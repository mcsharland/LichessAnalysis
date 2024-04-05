document.addEventListener("DOMContentLoaded", function () {
  const lichessButton = document.getElementById(
    "lichessButton"
  ) as HTMLButtonElement;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTabUrl = tabs[0].url;

    if (
      (currentTabUrl?.startsWith("https://www.chess.com/events") ||
        currentTabUrl?.startsWith("https://www.chess.com/game/live")) &&
      lichessButton
    ) {
      lichessButton.disabled = false;
      lichessButton.style.opacity = "1";
      lichessButton.style.pointerEvents = "auto";
    } else {
      lichessButton.disabled = true;
      lichessButton.style.opacity = "0.6";
      lichessButton.style.pointerEvents = "none";
    }
  });

  lichessButton.addEventListener("click", async () => {
    try {
      lichessButton.disabled = true;
      lichessButton.style.opacity = "0.6";
      lichessButton.style.pointerEvents = "none";

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab && tab.id) {
        if (tab.url?.startsWith("https://www.chess.com/game/live")) {
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: "live",
          });
        }
        else if (tab.url?.startsWith("https://www.chess.com/events")) {
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
    } catch (error) {
      alert("Error: Something went wrong...");
    }
  });
});
