/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!**********************!*\
  !*** ./src/popup.ts ***!
  \**********************/

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
    lichessButton.addEventListener("click", async () => {
        var _a, _b;
        try {
            lichessButton.disabled = true;
            lichessButton.style.opacity = "0.6";
            lichessButton.style.pointerEvents = "none";
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (tab && tab.id) {
                if ((_a = tab.url) === null || _a === void 0 ? void 0 : _a.startsWith("https://www.chess.com/game/live")) {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        type: "live",
                    });
                }
                else if ((_b = tab.url) === null || _b === void 0 ? void 0 : _b.startsWith("https://www.chess.com/events")) {
                    const response = await chrome.tabs.sendMessage(tab.id, {
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
    });
});

/******/ })()
;
//# sourceMappingURL=popup.js.map