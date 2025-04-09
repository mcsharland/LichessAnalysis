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

const disableButton = (button: HTMLButtonElement) => {
  if (button) {
    button.disabled = true;
  }
};

const hijackButton = (button: HTMLButtonElement) => {
  if (button == null) {
    console.error("Null button");
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

  button.disabled = false;
  if (button.getAttribute("aria-label") === "Game Review") {
    const parent = button.parentElement;
    const label = parent?.querySelector(".game-over-review-button-label");
    if (label) {
      label.textContent = "Lichess Analysis";
    }
    // warning first button also contains this class, no guaranteed unique classes
  } else if (button.classList.contains("cc-button-full")) {
    button.innerHTML =
      '<span aria-hidden="true" class="icon-font-chess best cc-icon-large cc-button-icon"></span> <span class="cc-button-one-line">Lichess</span>';
  }
};

function handleButton(button: HTMLButtonElement) {
  disableButton(button);
  hijackButton(button);
}

function lichess() {
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

              try {
                const PGNData = PGNElement.getAttribute("pgn");
                if (!PGNData) {
                  throw new Error("PGN not found");
                }
                const formatted = parser(PGNData);
                const link =
                  `https://lichess.org/analysis/pgn/` +
                  formatted +
                  (black ? "?color=black" : "") +
                  `#${move}`;
                window.open(link, "_blank")?.focus();
              } catch (error) {
                alert("Error: Something went wrong...");
                throw new Error("Couldn't open new page");
              }
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

  const sideBarIdentifier =
    ".cc-button-component.cc-button-primary.cc-button-full:is(.cc-button-xx-large, .cc-button-large)";
  const popUpIdentifier = `button[aria-label="Game Review"`;

  // Check for opening finished game
  function checkSideButton() {
    const sideBarButton = document.querySelector(
      sideBarIdentifier,
    ) as HTMLButtonElement;
    if (sideBarButton) {
      handleButton(sideBarButton);
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
              const popUpButton = node.querySelector(
                `button[aria-label="Game Review"`,
              ) as HTMLButtonElement;
              if (popUpButton) {
                handleButton(popUpButton);
                // Additional check for when game ends
                const sideBarButton = document.querySelector(
                  sideBarIdentifier,
                ) as HTMLButtonElement;
                if (sideBarButton) {
                  handleButton(sideBarButton);
                }
              }
            }
          });
        }

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement
        ) {
          const popUpButton = mutation.target.querySelector(
            popUpIdentifier,
          ) as HTMLButtonElement;
          if (popUpButton) {
            handleButton(popUpButton);
            // Additional check for when game ends
            const sideBarButton = document.querySelector(
              sideBarIdentifier,
            ) as HTMLButtonElement;
            if (sideBarButton) {
              handleButton(sideBarButton);
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
