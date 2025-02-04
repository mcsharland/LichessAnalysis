/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!******************************!*\
  !*** ./src/contentScript.ts ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
const parser = (pgn) => {
    const removeParentheses = (str) => {
        let result = "";
        let level = 0;
        let inParentheses = false;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === "(") {
                level++;
                inParentheses = true;
            }
            else if (str[i] === ")") {
                level--;
                if (level === 0) {
                    inParentheses = false;
                }
            }
            else if (!inParentheses) {
                result += str[i];
            }
        }
        return result;
    };
    return removeParentheses(pgn)
        .split(/\s+/) // split by space
        .filter((str) => /^(?:\d+\.+)?(?:[NBRKQ]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QNBR])?|O-O(?:-O)?)[+#]?$/.test(str)) // filter valid moves
        .join("_")
        .replace(/#$/, ""); // remove a trailing '#' to ensure board flip works
};
const disableButton = (button) => {
    if (button) {
        button.disabled = true;
    }
};
const hijackButton = (button) => {
    var _a;
    if (button) {
        const clonedButton = button.cloneNode(true);
        (_a = button.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(clonedButton, button);
        clonedButton.addEventListener("click", (event) => {
            event.preventDefault();
            lichess();
        });
        clonedButton.disabled = false;
        if (clonedButton.classList.contains("cc-button-large")) {
            clonedButton.innerHTML =
                '<span aria-hidden="true" class="icon-font-chess best cc-icon-medium cc-button-icon"></span> <span class="cc-button-one-line">Lichess</span>';
        }
        else if (clonedButton.classList.contains("game-over-review-button-background")) {
            const parent = clonedButton.parentElement;
            const label = parent === null || parent === void 0 ? void 0 : parent.querySelector(".game-over-review-button-label");
            if (label) {
                label.textContent = "Lichess Analysis";
            }
        }
    }
    else {
        throw new Error("button not found");
    }
};
function handleButton(button) {
    disableButton(button);
    hijackButton(button);
}
function lichess() {
    const shareButton = document.querySelector(".icon-font-chess.share.live-game-buttons-button");
    if (!shareButton) {
        alert("Error: Unable to find PGN...");
        return;
    }
    const pgnObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    var _a, _b, _c, _d, _e;
                    if (node instanceof HTMLElement) {
                        const PGNElement = node.querySelector(`.share-menu-tab-image-component.share-menu-tab`);
                        if (PGNElement) {
                            pgnObserver.disconnect();
                            const closeButton = document.querySelector("div.icon-font-chess.x.ui_outside-close-icon");
                            const black = document.getElementsByClassName("board flipped").length > 0;
                            const moveData = (_d = (_c = (_b = (_a = document
                                .querySelector("wc-simple-move-list")) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("selected")[0]) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.dataset.node) === null || _d === void 0 ? void 0 : _d.split("-");
                            let move = moveData && moveData[0] === "0"
                                ? String(parseInt(moveData[1], 10) + 1)
                                : null;
                            closeButton === null || closeButton === void 0 ? void 0 : closeButton.click();
                            try {
                                const PGNData = PGNElement.getAttribute("pgn");
                                if (!PGNData) {
                                    throw new Error("PGN not found");
                                }
                                const formatted = parser(PGNData);
                                const link = `https://lichess.org/analysis/pgn/` +
                                    formatted +
                                    (black ? "?color=black" : "") +
                                    `#${move}`;
                                (_e = window.open(link, "_blank")) === null || _e === void 0 ? void 0 : _e.focus();
                            }
                            catch (error) {
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
    // Check for opening finished game
    function checkSideButton() {
        const sideBarButton = document.querySelector(`.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`);
        if (sideBarButton) {
            handleButton(sideBarButton);
            return;
        }
        requestAnimationFrame(checkSideButton);
    }
    requestAnimationFrame(checkSideButton);
    function initializeObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Redundancy because of different behavior with games <5 moves
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            const gameReviewButton = node.querySelector(".game-over-review-button-component");
                            if (gameReviewButton) {
                                const popUpButton = gameReviewButton.querySelector(".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background");
                                if (popUpButton) {
                                    handleButton(popUpButton);
                                }
                                // Additional check for when game ends
                                const sideBarButton = document.querySelector(`.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`);
                                if (sideBarButton) {
                                    handleButton(sideBarButton);
                                }
                            }
                        }
                    });
                }
                if (mutation.type === "attributes" &&
                    mutation.target instanceof HTMLElement &&
                    mutation.target.classList.contains("game-over-review-button-component")) {
                    const popUpButton = mutation.target.querySelector(".cc-button-component.cc-button-primary.cc-button-xx-large.cc-button-full.game-over-review-button-background");
                    if (popUpButton) {
                        handleButton(popUpButton);
                    }
                    // Additional check for when game ends
                    const sideBarButton = document.querySelector(`.cc-button-component.cc-button-primary.cc-button-large.cc-button-full`);
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
    }
    else if (msg.type === "events") {
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


/******/ })()
;
//# sourceMappingURL=contentScript.js.map