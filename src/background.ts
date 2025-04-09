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
  try {
    if (tab?.id && tab?.url?.includes(`chess.com/game/`)) {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "live" });
    }
  } catch (e) {
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
