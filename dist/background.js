"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/background.ts
  var require_background = __commonJS({
    "src/background.ts"() {
      async function injectContentScript(tabId) {
        try {
          const tab = await browser.tabs.get(tabId);
          if (tab.discarded) return;
          if (!tab.url || tab.url.startsWith("about:") || tab.url.startsWith("moz-extension:")) {
            return;
          }
          try {
            const pong = await browser.tabs.sendMessage(tabId, { type: "ping" });
            if (pong?.pong) return;
          } catch {
          }
          await browser.scripting.executeScript({
            target: { tabId },
            files: ["dist/content.js"]
          });
        } catch {
        }
      }
      async function injectIntoExistingTabs() {
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
          if (tab.id != null) {
            await injectContentScript(tab.id);
          }
        }
      }
      browser.runtime.onStartup.addListener(injectIntoExistingTabs);
      browser.runtime.onInstalled.addListener(injectIntoExistingTabs);
      browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && tab.url) {
          injectContentScript(tabId);
        }
      });
      browser.tabs.onActivated.addListener((activeInfo) => {
        injectContentScript(activeInfo.tabId);
      });
    }
  });
  require_background();
})();
