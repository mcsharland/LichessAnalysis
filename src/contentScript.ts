const parser = (pgn: String) => {
  // matches valid chess moves
  const regex =
    /(?:[NBRKQ]?(?:[a-h]|[1-8])?x?[a-h][1-8](?:=[QNBR])?|O-O|O-O-O)[+#]?/;

  const strings = pgn.split(/\s+/);
  const newstrings = strings.filter((str) => regex.test(str));

  /* 
    Check if the last element contains '#' and remove it
    The trailing '#' will prevent the board from being flipped
  */
  if (
    newstrings.length > 0 &&
    newstrings[newstrings.length - 1].includes("#")
  ) {
    newstrings[newstrings.length - 1] = newstrings[
      newstrings.length - 1
    ].replace("#", "");
  }
  return newstrings.join("_");
};

const disableButton = (button: HTMLButtonElement) => {
  if (button) {
    button.disabled = true;
  }
};

// maybe not needed but these ensure theres no unintended behavior
let isLichessInProgress = false;
let ready = false;

const hijackButton = (button: HTMLButtonElement) => {
  if (button) {
    const clonedButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(clonedButton, button);

    clonedButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (!isLichessInProgress) {
        isLichessInProgress = true;
        lichess();
      }
    });
    clonedButton.disabled = false;

    if (button.dataset.cy === "sidebar-game-review-button") {
      clonedButton.innerHTML =
        '<span aria-hidden="true" class="ui_v5-button-icon icon-font-chess best"></span> <span>Lichess</span>';
    } else if (
      clonedButton.classList.contains("game-over-review-button-background")
    ) {
      const parent = clonedButton.parentElement;
      const label = parent?.querySelector(
        ".game-over-review-button-label"
      );

      if (label) {
        label.textContent = "Lichess Analysis";

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === "childList" ||
              mutation.type === "characterData"
            ) {
              const currentText = label.textContent;
              if (currentText !== "Lichess Analysis") {
                label.textContent = "Lichess Analysis";
              }
            }
          });
        });

        observer.observe(label, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    }
  } else {
    throw new Error("button not found");
  }
};

const gameEndObserver = new MutationObserver((mutations, observer) => {
  const gameReviewButton = document.querySelector(
    '[data-cy="sidebar-game-review-button"]'
  ) as HTMLButtonElement;
  const popUpReviewButton = document.querySelector(
    ".ui_v5-button-component.ui_v5-button-primary.ui_v5-button-large.ui_v5-button-full.game-over-review-button-background"
  ) as HTMLButtonElement;

  if (gameReviewButton) {
    disableButton(gameReviewButton);
    setTimeout(() => {
      hijackButton(gameReviewButton);
    }, 0);
  }

  if (popUpReviewButton) {
    disableButton(popUpReviewButton);
    setTimeout(() => {
      hijackButton(popUpReviewButton);
    }, 0);
  }

  if (gameReviewButton && popUpReviewButton) {
    observer.disconnect();
    ready = true;
  }
});

const lichess = (def = true) => {
  const shareButton = def
    ? (document.querySelector(
        ".icon-font-chess.share.live-game-buttons-button"
      ) as HTMLElement)
    : (document.querySelector('button[aria-label="Share"]') as HTMLElement);

  if (!shareButton) {
    alert("Error: Unable to find PGN...");
    return;
  }
  setTimeout(() => {
    shareButton.click();

    const checkPGN = () => {
      const PGNElement = document.querySelector(
        ".share-menu-tab-pgn-textarea"
      ) as HTMLTextAreaElement;
      if (PGNElement) {
        const closeButton = document.querySelector(
          "div.icon-font-chess.x.ui_outside-close-icon"
        ) as HTMLElement;
        const black =
          document.getElementsByClassName("board flipped").length > 0;
        closeButton?.click();
        try {
          const formatted = parser(PGNElement.value);
          const link =
            `https://lichess.org/analysis/pgn/` +
            formatted +
            (black ? "?color=black" : "") + "#0";
          window.open(link, "_blank")?.focus();
        } catch (error) {
          isLichessInProgress = false;
          alert("Error: Something went wrong...");
          throw new Error("Couldn't open new page");
        }
      } else {
        setTimeout(checkPGN, 100);
      }
    };

    checkPGN();
  }, 100);

  isLichessInProgress = false;
};

gameEndObserver.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "live") {
    if (ready) {
      lichess();
    }
    sendResponse({ success: true });
  } else if (msg.type === "events") {
    const button = document.querySelector(
      'button[aria-label="Share"]'
    ) as HTMLElement;
    if (button) {
      lichess(false);
    } else {
      alert(
        "Error: PGN not found. Try again in a moment if you believe this is an error"
      );
    }
  }
  return true;
});
