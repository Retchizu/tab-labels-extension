let updateTimer: number | null = null;
const MAXCOUNT = 9;

async function updateTabIndices() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabGroups = await chrome.tabGroups.query({ collapsed: true });

    const collapsedIds = new Set(tabGroups.map((tabGroup) => tabGroup.id));
    const uncollapsedTabs = tabs.filter(
      (tab) => !collapsedIds.has(tab.groupId ?? 0)
    );

    const lastTab = uncollapsedTabs[tabs.length - 1];
    const promises = uncollapsedTabs.map(async (tab, i) => {
      let displayIndex = i + 1;
      if (displayIndex > MAXCOUNT - 1) {
        displayIndex = tab.id === lastTab.id ? MAXCOUNT : 0;
      }

      if (tab.id && tab.url && !tab.url.startsWith("chrome://")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["inject.js"],
          });

          await chrome.tabs.sendMessage(tab.id, { index: displayIndex });
        } catch (e) {
          console.error(e);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
}

function debounceUpdate() {
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(async () => {
    await updateTabIndices();
    updateTimer = null;
  }, 50);
}

// Tabs events
chrome.tabs.onActivated.addListener(debounceUpdate);
chrome.tabs.onMoved.addListener(debounceUpdate);
chrome.tabs.onUpdated.addListener(debounceUpdate);
chrome.tabs.onCreated.addListener(debounceUpdate);
chrome.windows.onFocusChanged.addListener(debounceUpdate);

// Tab groups events
chrome.tabGroups.onMoved.addListener(debounceUpdate);
chrome.tabGroups.onUpdated.addListener(debounceUpdate);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle_collapse") return;

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !activeTab ||
      activeTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
    ) {
      const currentWindow = await chrome.windows.getCurrent();
      const collapsedGroups = await chrome.tabGroups.query({ collapsed: true });

      for (const group of collapsedGroups) {
        if (group.windowId === currentWindow.id) {
          await chrome.tabGroups.update(group.id, { collapsed: false });
        }
      }

      return;
    }

    await chrome.tabGroups.update(activeTab.groupId, { collapsed: true });
  } catch (e) {
    console.error("Failed to toggle collapse for tab group:", e);
  }
});
