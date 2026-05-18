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
function lichess() {
    const shareButton = document.querySelector(`button[aria-label="Share"]`);
    if (!shareButton) {
        alert("Error: Unable to find PGN...");
        return;
    }
    const pgnObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    var _a, _b, _c, _d, _e, _f;
                    if (node instanceof HTMLElement) {
                        const PGNElement = node.querySelector(`[pgn]`);
                        if (PGNElement) {
                            pgnObserver.disconnect();
                            const closeButton = node.querySelector(`button[aria-label="Close"]`);
                            const black = document.getElementsByClassName("board flipped")
                                .length > 0;
                            const moveData = (_d = (_c = (_b = (_a = document
                                .querySelector("wc-simple-move-list")) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("selected")[0]) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.dataset.node) === null || _d === void 0 ? void 0 : _d.split("-");
                            const openingMove = (_e = document.querySelector("span.eco-opening-name")) === null || _e === void 0 ? void 0 : _e.textContent;
                            let move = openingMove === "Starting Position"
                                ? 0
                                : moveData && moveData[0] === "0"
                                    ? String(parseInt(moveData[1], 10) + 1)
                                    : null;
                            closeButton === null || closeButton === void 0 ? void 0 : closeButton.click();
                            const PGNData = PGNElement.getAttribute("pgn");
                            if (!PGNData) {
                                throw new Error("PGN not found");
                            }
                            const formatted = parser(PGNData);
                            const link = `https://lichess.org/analysis/pgn/` +
                                formatted +
                                (black ? "?color=black" : "") +
                                `#${move}`;
                            try {
                                if (link) {
                                    (_f = window.open(link, "_blank")) === null || _f === void 0 ? void 0 : _f.focus();
                                }
                                return;
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
const ANALYSIS_LINK_SELECTOR = 'a[href*="/analysis/game/live/"]';
const LICHESS_LABEL = "Lichess Analysis";
function neutralizeHrefs(root = document) {
    root.querySelectorAll(ANALYSIS_LINK_SELECTOR).forEach((anchor) => {
        if (anchor.dataset.lichessHrefStripped === "true")
            return;
        if (anchor.hasAttribute("href")) {
            anchor.dataset.lichessOriginalHref =
                anchor.getAttribute("href") || "";
            anchor.removeAttribute("href");
        }
        anchor.style.pointerEvents = "";
        anchor.dataset.lichessHrefStripped = "true";
    });
}
const LABEL_RULES = [
    // sidebar
    {
        name: "sidebar",
        container: [
            'a[data-cy="sidebar-game-review-button"]',
            'a[aria-label="Game Review"]',
        ],
        tag: "lichessLabelSidebar",
        apply: (anchor) => {
            const label = anchor.querySelector(".cc-button-one-line");
            if (label) {
                label.textContent = LICHESS_LABEL;
                anchor.setAttribute("aria-label", LICHESS_LABEL);
            }
        },
    },
    // popup
    {
        name: "popup",
        container: [".game-over-primary-cta-game-over-primary-cta"],
        tag: "lichessLabelPopup",
        apply: (anchor) => {
            // guard against the sidebar also matching by accident
            if (anchor.querySelector(".cc-button-one-line"))
                return;
            anchor.textContent = LICHESS_LABEL;
            anchor.setAttribute("aria-label", LICHESS_LABEL);
        },
    },
];
function applyLabelRules(root = document) {
    for (const rule of LABEL_RULES) {
        try {
            for (const selector of rule.container) {
                const matches = root.querySelectorAll(selector);
                matches.forEach((el) => {
                    if (el.dataset[rule.tag] === "true")
                        return;
                    rule.apply(el);
                    el.dataset[rule.tag] = "true";
                });
            }
        }
        catch (err) {
            console.warn(`[lichess-redirect] rule "${rule.name}" threw`, err);
        }
    }
}
function sweep(root = document) {
    neutralizeHrefs(root);
    applyLabelRules(root);
}
function attachClickHandler() {
    if (window.lichessClickHandlerAttached)
        return;
    window.lichessClickHandlerAttached = true;
    const handler = (e) => {
        const target = e.target;
        if (!(target instanceof Element))
            return;
        // check the live href pattern (in case we got here before neutralizeHrefs ran)
        const link = target.closest(ANALYSIS_LINK_SELECTOR);
        const stripped = target.closest('[data-lichess-href-stripped="true"]');
        if (!link && !stripped)
            return;
        e.preventDefault();
        e.stopImmediatePropagation();
        lichess();
    };
    // capture phase so we beat chess.com's own listeners
    // auxclick covers middle-click; click covers everything else
    document.addEventListener("click", handler, { capture: true });
    document.addEventListener("auxclick", handler, { capture: true });
}
function isLiveGame() {
    return (window.location.hostname.includes(`chess.com`) &&
        window.location.pathname.startsWith(`/game/`));
}
function initializeObserver() {
    const observer = new MutationObserver(() => sweep(document));
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
    });
    window.gameEndObserver = observer;
    // initial pass for elements already in the DOM at load
    sweep(document);
}
function handlePageLoad() {
    if (isLiveGame()) {
        attachClickHandler();
        if (!window.gameEndObserver) {
            initializeObserver();
        }
        else {
            sweep(document);
        }
    }
    else {
        if (window.gameEndObserver) {
            window.gameEndObserver.disconnect();
            window.gameEndObserver = null;
        }
    }
}
// @ts-ignore - new navigation API
window.navigation.addEventListener("currententrychange", handlePageLoad);
handlePageLoad();
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "live") {
        lichess();
        sendResponse({ success: true });
    }
    return true;
});


/******/ })()
;
//# sourceMappingURL=contentScript.js.map