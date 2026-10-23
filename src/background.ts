async function injectContentScript(tabId: number): Promise<void> {
  try {
    const tab = await browser.tabs.get(tabId);
    if (tab.discarded) return;
    if (!tab.url || tab.url.startsWith("about:") || tab.url.startsWith("moz-extension:")) {
      return;
    }

    // Ping tab first to avoid redundant injections
    try {
      const pong = (await browser.tabs.sendMessage(tabId, { type: "ping" })) as any;
      if (pong?.pong) return;
    } catch {
      // Content script is not present or responding
    }

    await browser.scripting.executeScript({
      target: { tabId },
      files: ["dist/content.js"],
    });
  } catch {
    // Ignore errors for unscriptable tabs or restricted domains
  }
}

async function injectIntoExistingTabs(): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id != null) {
      await injectContentScript(tab.id);
    }
  }
}

// On extension startup & install/reload
browser.runtime.onStartup.addListener(injectIntoExistingTabs);
browser.runtime.onInstalled.addListener(injectIntoExistingTabs);

// When a tab finishes loading or is woken up from session restore / discarded state
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    injectContentScript(tabId);
  }
});

// When user activates/switches to a tab
browser.tabs.onActivated.addListener((activeInfo) => {
  injectContentScript(activeInfo.tabId);
});