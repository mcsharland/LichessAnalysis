/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
/*!******************************!*\
  !*** ./src/contentScript.ts ***!
  \******************************/

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
        if (clonedButton.classList.contains("game-review-buttons-button")) {
            clonedButton.innerHTML =
                '<span aria-hidden="true" class="ui_v5-button-icon icon-font-chess best"></span> <span>Lichess</span>';
        }
        else if (clonedButton.classList.contains("game-over-review-button-background")) {
            const parent = clonedButton.parentElement;
            const label = parent === null || parent === void 0 ? void 0 : parent.querySelector(".game-over-review-button-label");
            if (label) {
                label.textContent = "Lichess Analysis";
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === "childList" ||
                            mutation.type === "characterData") {
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
    }
    else {
        throw new Error("button not found");
    }
};
// I am not proud of this but it was annoying to fix and this works
let stopObs = false;
const gameEndObserver = new MutationObserver((mutations, observer) => {
    var _a, _b;
    const gameReviewButton = document.querySelector(".game-review-buttons-component .game-review-buttons-review .ui_v5-button-component.ui_v5-button-primary.game-review-buttons-button");
    const popUpReviewButton = document.querySelector(".ui_v5-button-component.ui_v5-button-primary.ui_v5-button-large.ui_v5-button-full.game-over-review-button-background");
    if (gameReviewButton && !((_a = gameReviewButton.textContent) === null || _a === void 0 ? void 0 : _a.includes("Lichess"))) {
        disableButton(gameReviewButton);
        setTimeout(() => {
            hijackButton(gameReviewButton);
        }, 0);
    }
    if (popUpReviewButton && !stopObs) {
        disableButton(popUpReviewButton);
        setTimeout(() => {
            hijackButton(popUpReviewButton);
        }, 0);
    }
    if (((_b = gameReviewButton === null || gameReviewButton === void 0 ? void 0 : gameReviewButton.textContent) === null || _b === void 0 ? void 0 : _b.includes("Lichess")) && popUpReviewButton) {
        stopObs = true;
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const PGNElement = document.querySelector(".share-menu-tab-pgn-textarea");
            if (PGNElement) {
                const closeButton = document.querySelector("div.icon-font-chess.x.ui_outside-close-icon");
                const black = document.getElementsByClassName("board flipped").length > 0;
                const moveData = (_d = (_c = (_b = (_a = document
                    .querySelector("wc-new-move-list")) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("selected")[0]) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.dataset.node) === null || _d === void 0 ? void 0 : _d.split("-");
                let move = moveData && moveData[0] === "0"
                    ? String(parseInt(moveData[1], 10) + 1)
                    : null;
                if (!move) {
                    const moveData = (_h = (_g = (_f = (_e = document
                        .querySelector("wc-vertical-move-list")) === null || _e === void 0 ? void 0 : _e.getElementsByClassName("selected")[0]) === null || _f === void 0 ? void 0 : _f.parentElement) === null || _g === void 0 ? void 0 : _g.dataset.node) === null || _h === void 0 ? void 0 : _h.split("-");
                    move =
                        moveData && moveData[0] === "0"
                            ? String(parseInt(moveData[1], 10) + 1)
                            : "0";
                }
                closeButton === null || closeButton === void 0 ? void 0 : closeButton.click();
                try {
                    const formatted = parser(PGNElement.value);
                    const link = `https://lichess.org/analysis/pgn/` +
                        formatted +
                        (black ? "?color=black" : "") +
                        `#${move}`;
                    (_j = window.open(link, "_blank")) === null || _j === void 0 ? void 0 : _j.focus();
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