/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/popup.ts":
/*!**********************!*\
  !*** ./src/popup.ts ***!
  \**********************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener("DOMContentLoaded", function () {
    const lichessButton = document.getElementById("lichessButton");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTabUrl = tabs[0].url;
        if (((currentTabUrl === null || currentTabUrl === void 0 ? void 0 : currentTabUrl.startsWith("https://www.chess.com/events")) ||
            (currentTabUrl === null || currentTabUrl === void 0 ? void 0 : currentTabUrl.startsWith("https://www.chess.com/game/live"))) &&
            lichessButton) {
            lichessButton.disabled = false;
            lichessButton.style.opacity = "1";
            lichessButton.style.pointerEvents = "auto";
        }
        else {
            lichessButton.disabled = true;
            lichessButton.style.opacity = "0.6";
            lichessButton.style.pointerEvents = "none";
        }
    });
    lichessButton.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            lichessButton.disabled = true;
            lichessButton.style.opacity = "0.6";
            lichessButton.style.pointerEvents = "none";
            const [tab] = yield chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (tab && tab.id) {
                if ((_a = tab.url) === null || _a === void 0 ? void 0 : _a.startsWith("https://www.chess.com/game/live")) {
                    const response = yield chrome.tabs.sendMessage(tab.id, {
                        type: "live",
                    });
                }
                else if ((_b = tab.url) === null || _b === void 0 ? void 0 : _b.startsWith("https://www.chess.com/events")) {
                    const response = yield chrome.tabs.sendMessage(tab.id, {
                        type: "events",
                    });
                }
                setTimeout(() => {
                    lichessButton.disabled = false;
                    lichessButton.style.opacity = "1";
                    lichessButton.style.pointerEvents = "auto";
                }, 250);
            }
        }
        catch (error) {
            alert("Error: Something went wrong...");
        }
    }));
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/popup.ts"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=popup.js.map