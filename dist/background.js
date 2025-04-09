/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/

const rule = {
    conditions: [
        new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
                hostContains: `chess.com`,
                pathPrefix: `/game/`,
            },
        }),
    ],
    actions: [new chrome.declarativeContent.ShowAction()],
};
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.disable();
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([rule]);
    });
});
chrome.action.onClicked.addListener(async (tab) => {
    var _a;
    try {
        if ((tab === null || tab === void 0 ? void 0 : tab.id) && ((_a = tab === null || tab === void 0 ? void 0 : tab.url) === null || _a === void 0 ? void 0 : _a.includes(`chess.com/game/`))) {
            const response = await chrome.tabs.sendMessage(tab.id, { type: "live" });
        }
    }
    catch (e) {
        // console.error("No response or error:", e);
    }
});
// This doesn't seem to be supported in my browser,
// and I am too lazy to test it on another
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (tab?.url?.includes("chess.com/game")) {
//     chrome.action.setTitle({
//       tabId,
//       title: "Click to open analysis",
//     });
//   }
// });

/******/ })()
;
//# sourceMappingURL=background.js.map