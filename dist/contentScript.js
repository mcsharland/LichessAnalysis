/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
/*!******************************!*\
  !*** ./src/contentScript.ts ***!
  \******************************/

const parser = (pgn) => {
    const removeParentheses = (str) => {
        let result = '';
        let level = 0;
        let inParentheses = false;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '(') {
                level++;
                inParentheses = true;
            }
            else if (str[i] === ')') {
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
        .filter(str => /^(?:\d+\.+)?(?:[NBRKQ]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QNBR])?|O-O(?:-O)?)[+#]?$/.test(str)) // filter valid moves
        .join("_")
        .replace(/#$/, ''); // remove a trailing '#' to ensure board flip works
};
const disableButton = (button) => {
    if (button) {
        button.disabled = true;
    }
};
// maybe not needed but these ensure theres no unintended behavior
let isLichessInProgress = false;
let ready = false;
const hijackButton = (button) => {
    var _a;
    if (button) {
        const clonedButton = button.cloneNode(true);
        (_a = button.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(clonedButton, button);
        clonedButton.addEventListener("click", (event) => {
            event.preventDefault();
            if (!isLichessInProgress) {
                isLichessInProgress = true;
                lichess();
            }
        });
        clonedButton.disabled = false;
        if (button.dataset.cy === "sidebar-game-review-button") {
            const span = clonedButton.querySelector("span:not(.ui_v5-button-icon)");
            if (span) {
                span.textContent = "Lichess";
                const sidebarObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === "childList" || mutation.type === "characterData") {
                            if (span.textContent !== "Lichess") {
                                span.textContent = "Lichess";
                            }
                        }
                    });
                });
                sidebarObserver.observe(span, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            }
        }
        else if (clonedButton.classList.contains("game-over-review-button-background")) {
            const parent = clonedButton.parentElement;
            const label = parent === null || parent === void 0 ? void 0 : parent.querySelector(".game-over-review-button-label");
            if (label) {
                label.textContent = "Lichess Analysis";
                const popupObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === "childList" || mutation.type === "characterData") {
                            if (label.textContent !== "Lichess Analysis") {
                                label.textContent = "Lichess Analysis";
                            }
                        }
                    });
                });
                popupObserver.observe(label, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            }
        }
    }
    else {
        throw new Error("button not found");
    }
};
const gameEndObserver = new MutationObserver((mutations, observer) => {
    const gameReviewButton = document.querySelector('[data-cy="sidebar-game-review-button"]');
    const popUpReviewButton = document.querySelector(".ui_v5-button-component.ui_v5-button-primary.ui_v5-button-large.ui_v5-button-full.game-over-review-button-background");
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
        ? document.querySelector(".icon-font-chess.share.live-game-buttons-button")
        : document.querySelector('button[aria-label="Share"]');
    if (!shareButton) {
        alert("Error: Unable to find PGN...");
        return;
    }
    setTimeout(() => {
        shareButton.click();
        const checkPGN = () => {
            var _a, _b, _c, _d, _e, _f, _g;
            const PGNElement = document.querySelector(".share-menu-tab-pgn-textarea");
            if (PGNElement) {
                const closeButton = document.querySelector("div.icon-font-chess.x.ui_outside-close-icon");
                const black = document.getElementsByClassName("board flipped").length > 0;
                let move = (_b = (_a = document.getElementsByClassName("vertical-move-list")[0]) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("selected")[0]) === null || _b === void 0 ? void 0 : _b.dataset.ply;
                if (!move) {
                    const moveData = (_f = (_e = (_d = (_c = document.querySelector("wc-horizontal-move-list")) === null || _c === void 0 ? void 0 : _c.querySelector('[class*="node-highlight-content"][class*="selected"]')) === null || _d === void 0 ? void 0 : _d.parentElement) === null || _e === void 0 ? void 0 : _e.dataset.node) === null || _f === void 0 ? void 0 : _f.split('-');
                    move = moveData && moveData[0] === '0' ? String(parseInt(moveData[1], 10) + 1) : '0';
                }
                closeButton === null || closeButton === void 0 ? void 0 : closeButton.click();
                try {
                    const formatted = parser(PGNElement.value);
                    const link = `https://lichess.org/analysis/pgn/` +
                        formatted +
                        (black ? "?color=black" : "") + `#${move}`;
                    (_g = window.open(link, "_blank")) === null || _g === void 0 ? void 0 : _g.focus();
                }
                catch (error) {
                    isLichessInProgress = false;
                    alert("Error: Something went wrong...");
                    throw new Error("Couldn't open new page");
                }
            }
            else {
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
    }
    else if (msg.type === "events") {
        const button = document.querySelector('button[aria-label="Share"]');
        if (button) {
            lichess(false);
        }
        else {
            alert("Error: PGN not found. Try again in a moment if you believe this is an error");
        }
    }
    return true;
});

/******/ })()
;
//# sourceMappingURL=contentScript.js.map