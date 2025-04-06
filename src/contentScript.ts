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
  if (button) {
    const clonedButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(clonedButton, button);

    clonedButton.addEventListener("click", (event) => {
      event.preventDefault();
      lichess();
    });
    clonedButton.disabled = false;
    if (clonedButton.classList.contains("game-over-review-button-background")) {
      const parent = clonedButton.parentElement;
      const label = parent?.querySelector(".game-over-review-button-label");
      if (label) {
        label.textContent = "Lichess Analysis";
      }
      // warning first button also contains this class, no guaranteed unique classes
    } else if (clonedButton.classList.contains("cc-button-full")) {
      clonedButton.innerHTML =
        '<span aria-hidden="true" class="icon-font-chess best cc-icon-large cc-button-icon"></span> <span class="cc-button-one-line">Lichess</span>';
    }
  } else {
    throw new Error("button not found");
  }
};

function handleButton(button: HTMLButtonElement) {
  disableButton(button);
  hijackButton(button);
}

function lichess() {
  const shareButton = document.querySelector(
    ".icon-font-chess.share.live-game-buttons-button",
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
            const PGNElement = node.querySelector(
              `.share-menu-tab-image-component.share-menu-tab`,
            );
            if (PGNElement) {
              pgnObserver.disconnect();
              const closeButton = node.querySelector(
                ".cc-modal-header-close",
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

(function () {
  const targetUrls = ["https://www.chess.com/game/"];

  function handlePageLoad() {
    const currentUrl = window.location.href;
    const isTargetPage = targetUrls.some((url) => currentUrl.startsWith(url));

    if (isTargetPage) {
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

  const sideBarClass =
    ".cc-button-component.cc-button-primary.cc-button-full:is(.cc-button-xx-large, .cc-button-large)";
  const popUpClass =
    ".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background";

  // Check for opening finished game
  function checkSideButton() {
    const sideBarButton = document.querySelector(
      sideBarClass,
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
              const gameReviewButton = node.querySelector(
                ".game-over-review-button-component",
              );
              if (gameReviewButton) {
                const popUpButton = gameReviewButton.querySelector(
                  popUpClass,
                ) as HTMLButtonElement;
                if (popUpButton) {
                  handleButton(popUpButton);
                }
                // Additional check for when game ends
                const sideBarButton = document.querySelector(
                  sideBarClass,
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
          mutation.target instanceof HTMLElement &&
          mutation.target.classList.contains(
            "game-over-review-button-component",
          )
        ) {
          const popUpButton = mutation.target.querySelector(
            popUpClass,
          ) as HTMLButtonElement;
          if (popUpButton) {
            handleButton(popUpButton);
          }
          // Additional check for when game ends
          const sideBarButton = document.querySelector(
            sideBarClass,
          ) as HTMLButtonElement;
          if (sideBarButton) {
            handleButton(sideBarButton);
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
  } else if (msg.type === "events") {
    alert("Feature currently disabled");
    //   const button = document.querySelector(
    //     'button[aria-label="Share"]',
    //   ) as HTMLElement;
    //   if (button) {
    //     // lichess();
    //   } else {
    //     alert(
    //       "Error: PGN not found. Try again in a moment if you believe this is an error",
    //     );
    //   }
  }
  return true;
});

export {};
