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

// // maybe not needed but these ensure theres no unintended behavior
// let isLichessInProgress = false;
// let ready = false;

// const hijackButton = (button: HTMLButtonElement) => {
//   if (button) {
//     const clonedButton = button.cloneNode(true) as HTMLButtonElement;
//     button.parentNode?.replaceChild(clonedButton, button);

//     clonedButton.addEventListener("click", (event) => {
//       event.preventDefault();
//       if (!isLichessInProgress) {
//         isLichessInProgress = true;
//         lichess();
//       }
//     });
//     clonedButton.disabled = false;

//     if (clonedButton.classList.contains("game-review-buttons-button")) {
//       clonedButton.innerHTML =
//         '<span aria-hidden="true" class="ui_v5-button-icon icon-font-chess best"></span> <span>Lichess</span>';
//     } else if (
//       clonedButton.classList.contains("game-over-review-button-background")
//     ) {
//       const parent = clonedButton.parentElement;
//       const label = parent?.querySelector(".game-over-review-button-label");

//       if (label) {
//         label.textContent = "Lichess Analysis";

//         const observer = new MutationObserver((mutations) => {
//           mutations.forEach((mutation) => {
//             if (
//               mutation.type === "childList" ||
//               mutation.type === "characterData"
//             ) {
//               const currentText = label.textContent;
//               if (currentText !== "Lichess Analysis") {
//                 label.textContent = "Lichess Analysis";
//               }
//             }
//           });
//         });

//         observer.observe(label, {
//           childList: true,
//           characterData: true,
//           subtree: true,
//         });
//       }
//     }
//   } else {
//     throw new Error("button not found");
//   }
// };

// let stopObs = false;
// const gameEndObserver = new MutationObserver((mutations, observer) => {
//   const gameReviewButton = document.querySelector(
//     ".cc-button-component.cc-button.primary.cc-button-large.cc-button-full",
//   ) as HTMLButtonElement;

//   const popUpReviewButton = document.querySelector(
//     ".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background",
//   ) as HTMLButtonElement;

//   if (gameReviewButton && !gameReviewButton.textContent?.includes("Lichess")) {
//     disableButton(gameReviewButton);
//     setTimeout(() => {
//       hijackButton(gameReviewButton);
//     }, 0);
//   }
//   if (popUpReviewButton && !stopObs) {
//     disableButton(popUpReviewButton);
//     setTimeout(() => {
//       hijackButton(popUpReviewButton);
//     }, 0);
//   }

//   // if (gameReviewButton?.textContent?.includes("Lichess") && popUpReviewButton) {
//   //   stopObs = true;
//   //   ready = true;
//   // }
//   if (popUpReviewButton) {
//     // Temporary until new system fleshed out
//     stopObs = true;
//     ready = true;
//   }
// });

// const lichess = (def = true) => {
//   const shareButton = def
//     ? (document.querySelector(
//         ".icon-font-chess.share.live-game-buttons-button",
//       ) as HTMLElement)
//     : (document.querySelector('button[aria-label="Share"]') as HTMLElement);

//   if (!shareButton) {
//     alert("Error: Unable to find PGN...");
//     return;
//   }
//   setTimeout(() => {
//     shareButton.click();

//     const checkPGN = () => {
//       const PGNElement = document.querySelector(
//         ".share-menu-tab-image-component.share-menu-tab",
//       ) as HTMLTextAreaElement;
//       if (PGNElement) {
//         const closeButton = document.querySelector(
//           "div.icon-font-chess.x.ui_outside-close-icon",
//         ) as HTMLElement;
//         const black =
//           document.getElementsByClassName("board flipped").length > 0;
//         const moveData = (
//           document
//             .querySelector("wc-simple-move-list")
//             ?.getElementsByClassName("selected")[0]
//             ?.parentElement as HTMLElement
//         )?.dataset.node?.split("-");
//         let move =
//           moveData && moveData[0] === "0"
//             ? String(parseInt(moveData[1], 10) + 1)
//             : null;

//         if (!move) {
//           const moveData = (
//             document
//               .querySelector("wc-vertical-move-list")
//               ?.getElementsByClassName("selected")[0]
//               ?.parentElement as HTMLElement
//           )?.dataset.node?.split("-");
//           move =
//             moveData && moveData[0] === "0"
//               ? String(parseInt(moveData[1], 10) + 1)
//               : "0";
//         }
//         closeButton?.click();
//         try {
//           const PGNData = PGNElement.getAttribute("pgn");
//           if (!PGNData) {
//             throw new Error("PGN not found");
//           }
//           const formatted = parser(PGNData);
//           const link =
//             `https://lichess.org/analysis/pgn/` +
//             formatted +
//             (black ? "?color=black" : "") +
//             `#${move}`;
//           window.open(link, "_blank")?.focus();
//         } catch (error) {
//           isLichessInProgress = false;
//           alert("Error: Something went wrong...");
//           throw new Error("Couldn't open new page");
//         }
//       } else {
//         setTimeout(checkPGN, 100);
//       }
//     };

//     checkPGN();
//   }, 100);

//   isLichessInProgress = false;
// };

// gameEndObserver.observe(
//   document.body,

//   { childList: true, subtree: true },
// );

const hijackButton = (button: HTMLButtonElement) => {
  if (button) {
    const clonedButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(clonedButton, button);

    clonedButton.addEventListener("click", (event) => {
      event.preventDefault();
      // if (!isLichessInProgress) {
      //   isLichessInProgress = true;
      lichess();
      // }
    });
    clonedButton.disabled = false;

    if (clonedButton.classList.contains("cc-button-large")) {
      clonedButton.innerHTML =
        '<span aria-hidden="true" class="icon-font-chess best cc-icon-medium cc-button-icon"></span> <span class="cc-button-one-line">Lichess</span>';
    } else if (
      clonedButton.classList.contains("game-over-review-button-background")
    ) {
      const parent = clonedButton.parentElement;
      const label = parent?.querySelector(".game-over-review-button-label");

      if (label) {
        label.textContent = "Lichess Analysis";

        // const observer = new MutationObserver((mutations) => {
        //   mutations.forEach((mutation) => {
        //     if (
        //       mutation.type === "childList" ||
        //       mutation.type === "characterData"
        //     ) {
        //       const currentText = label.textContent;
        //       if (currentText !== "Lichess Analysis") {
        //         label.textContent = "Lichess Analysis";
        //       }
        //     }
        //   });
        // });

        // observer.observe(label, {
        //   childList: true,
        //   characterData: true,
        //   subtree: true,
        // });
      }
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
  console.log("Share button found!");

  const pgnObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const PGNElement = node.querySelector(
              `.share-menu-tab-image-component.share-menu-tab`,
            );
            if (PGNElement) {
              console.log("PGN found!");
              pgnObserver.disconnect();
              const closeButton = document.querySelector(
                "div.icon-font-chess.x.ui_outside-close-icon",
              ) as HTMLElement;

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
                console.log("Attemping to open lichess!");
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
  if (!window.gameEndObserver) {
    initializeObserver();
  }

  const sideBarButton = document.querySelector(
    `.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`,
  );
  console.log(sideBarButton);
  if (sideBarButton instanceof HTMLButtonElement) {
    handleButton(sideBarButton);
  }

  function initializeObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              const gameReviewButton = node.querySelector(
                ".game-over-review-button-component",
              );
              if (gameReviewButton) {
                const popUpButton = gameReviewButton.querySelector(
                  ".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background",
                );
                const sideBarButton = document.querySelector(
                  `.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`,
                );
                if (
                  popUpButton instanceof HTMLButtonElement &&
                  sideBarButton instanceof HTMLButtonElement
                ) {
                  handleButton(popUpButton);
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
            ".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background",
          );
          if (popUpButton instanceof HTMLButtonElement) {
            handleButton(popUpButton);
          }

          // Do the sidebar again just in case
          const sideBarButton = document.querySelector(
            `.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`,
          );
          if (sideBarButton instanceof HTMLButtonElement) {
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
