/*
  Still references sidebar and popup as distinct buttons despite both now holding NodeLists
  This can be refactored later, but for the time being serves as a reminder to the specific trigger
  (I'm too lazy to change them now)
*/
declare global {
  interface Window {
    gameEndObserver?: MutationObserver | null;
  }
}

const parser = (pgn: string) => {
  const removeParentheses = (str: string): string => {
    let result = "";
    let level = 0;
    let inParentheses = false;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === "(") {
        level++;
        inParentheses = true;
      } else if (str[i] === ")") {
        level--;
        if (level === 0) {
          inParentheses = false;
        }
      } else if (!inParentheses) {
        result += str[i];
      }
    }

    return result;
  };

  return removeParentheses(pgn)
    .split(/\s+/) // split by space
    .filter((str) =>
      /^(?:\d+\.+)?(?:[NBRKQ]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QNBR])?|O-O(?:-O)?)[+#]?$/.test(
        str,
      ),
    ) // filter valid moves
    .join("_")
    .replace(/#$/, ""); // remove a trailing '#' to ensure board flip works
};

const disableButton = (button: HTMLAnchorElement) => {
  if (button) {
    button.style.pointerEvents = "none";
    button.setAttribute("hijacked", "true");
    button.removeAttribute("href");
  }
};

const hijackButton = (button: HTMLAnchorElement) => {
  if (button == null) {
    throw new Error("button not found");
  }
  button.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      lichess();
      return false;
    },
    true,
  );

  button.style.pointerEvents = ""; // reset

  const sideBarLabel = button.querySelector(".cc-button-one-line");
  if (sideBarLabel) {
    sideBarLabel.textContent = "Lichess Analysis";
  }

  const prevSibling = button.previousElementSibling;
  if (
    prevSibling &&
    prevSibling instanceof HTMLSpanElement &&
    prevSibling.classList.contains("game-over-review-button-label")
  ) {
    prevSibling.textContent = "Lichess Analysis";
  }
};

function handleButton(button: HTMLAnchorElement) {
  if (button.getAttribute("hijacked") === "true") return;
  if (!lichessAnalysisLink) createLichessLink();
  disableButton(button);
  hijackButton(button);
}

let lichessAnalysisLink: string | null = null;

function createLichessLink() {
  const shareButton = document.querySelector(
    `button[aria-label="Share"]`,
  ) as HTMLElement;

  if (!shareButton) {
    alert("Error: Unable to find PGN...");
    return;
  }

  const pgnObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const PGNElement = node.querySelector(`[pgn]`);
            if (PGNElement) {
              pgnObserver.disconnect();
              const closeButton = node.querySelector(
                `button[aria-label="Close"]`,
              ) as HTMLButtonElement;

              const black =
                document.getElementsByClassName("board flipped").length > 0;
              const moveData = (
                document
                  .querySelector("wc-simple-move-list")
                  ?.getElementsByClassName("selected")[0]
                  ?.parentElement as HTMLElement
              )?.dataset.node?.split("-");
              let move =
                moveData && moveData[0] === "0"
                  ? String(parseInt(moveData[1], 10) + 1)
                  : null;

              closeButton?.click();

              const PGNData = PGNElement.getAttribute("pgn");
              if (!PGNData) {
                throw new Error("PGN not found");
              }
              const formatted = parser(PGNData);
              lichessAnalysisLink =
                `https://lichess.org/analysis/pgn/` +
                formatted +
                (black ? "?color=black" : "") +
                `#${move}`;
            }
          }
        });
      }
    });
  });

  shareButton.click();

  pgnObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function lichess() {
  if (!lichessAnalysisLink) createLichessLink();

  try {
    if (lichessAnalysisLink) {
      window.open(lichessAnalysisLink, "_blank")?.focus();
    }
    return;
  } catch (error) {
    alert("Error: Something went wrong...");
    throw new Error("Couldn't open new page");
  }
}

function isLiveGame() {
  return (
    window.location.hostname.includes(`chess.com`) &&
    window.location.pathname.startsWith(`/game/`)
  );
}

(function () {
  function handlePageLoad() {
    if (isLiveGame()) {
      if (!window.gameEndObserver) {
        initializeObserver();
      }
      requestAnimationFrame(checkSideButton);
    } else {
      if (window.gameEndObserver) {
        window.gameEndObserver.disconnect();
        window.gameEndObserver = null;
      }
    }
  }

  // @ts-ignore
  window.navigation.addEventListener("currententrychange", handlePageLoad);

  handlePageLoad();

  const gameOverIdentifier = `a[aria-label="Game Review"]`;

  // Check for opening finished game
  function checkSideButton() {
    const sideBarButton = document.querySelectorAll(
      gameOverIdentifier,
    ) as NodeListOf<HTMLAnchorElement>;
    if (sideBarButton) {
      sideBarButton.forEach((button) => handleButton(button));
      // handleButton(sideBarButton);
      return;
    }
    requestAnimationFrame(checkSideButton);
  }

  function initializeObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Redundancy because of different behavior with games <5 moves
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              const popUpButton = node.querySelectorAll(
                gameOverIdentifier,
              ) as NodeListOf<HTMLAnchorElement>;
              if (popUpButton) {
                // Additional check for when game ends
                // So, because we are also trying to target the quick-analysis tally with querySelectorAll, we avoid the initial check on the popUp
                const sideBarButton = document.querySelectorAll(
                  gameOverIdentifier,
                ) as NodeListOf<HTMLAnchorElement>;
                if (sideBarButton) {
                  sideBarButton.forEach((button) => handleButton(button));
                }
              }
            }
          });
        }

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement
        ) {
          const popUpButton = mutation.target.querySelectorAll(
            gameOverIdentifier,
          ) as NodeListOf<HTMLAnchorElement>;
          if (popUpButton) {
            // Additional check for when game ends
            const sideBarButton = document.querySelectorAll(
              gameOverIdentifier,
            ) as NodeListOf<HTMLAnchorElement>;
            if (sideBarButton) {
              sideBarButton.forEach((button) => handleButton(button));
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.gameEndObserver = observer;
  }
})();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "live") {
    lichess();
    sendResponse({ success: true });
  }
  return true;
});

export {};
