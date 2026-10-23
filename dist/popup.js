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

  // src/popup.ts
  var require_popup = __commonJS({
    "src/popup.ts"() {
      var tabsList = document.getElementById("tabsList");
      var injectionPromises = /* @__PURE__ */ new Map();
      async function ensureContentScript(tabId) {
        try {
          const res = await browser.tabs.sendMessage(tabId, { type: "ping" });
          if (res && res.pong) return true;
        } catch {
        }
        if (injectionPromises.has(tabId)) {
          try {
            await injectionPromises.get(tabId);
            return true;
          } catch {
            return false;
          }
        }
        const promise = (async () => {
          await browser.scripting.executeScript({
            target: { tabId },
            files: ["dist/content.js"]
          });
        })();
        injectionPromises.set(tabId, promise);
        try {
          await promise;
          return true;
        } catch {
          return false;
        } finally {
          injectionPromises.delete(tabId);
        }
      }
      async function sendGainMessage(tabId, message) {
        try {
          return await browser.tabs.sendMessage(tabId, message);
        } catch {
          const injected = await ensureContentScript(tabId);
          if (!injected) return null;
          try {
            return await browser.tabs.sendMessage(tabId, message);
          } catch {
            return null;
          }
        }
      }
      function buildTabRow(tab, isActive) {
        const row = document.createElement("div");
        row.className = "tab-row";
        const favicon = document.createElement("img");
        favicon.className = "tab-favicon";
        favicon.src = tab.favIconUrl || "assets/icon-16.png";
        favicon.onerror = () => {
          favicon.style.visibility = "hidden";
        };
        const label = document.createElement("span");
        label.className = "tab-label";
        label.title = tab.title ?? "";
        label.innerText = tab.title || "Sin t\xEDtulo";
        if (isActive) label.style.color = "#3b82f6";
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "6";
        slider.step = "0.1";
        slider.value = "1";
        slider.style.flex = "1";
        slider.style.minWidth = "150px";
        const valSpan = document.createElement("span");
        valSpan.className = "tab-val";
        valSpan.innerText = "100%";
        const tabId = tab.id;
        if (tabId != null) {
          sendGainMessage(tabId, { type: "get-gain" }).then((res) => {
            if (res && res.gain != null) {
              slider.value = res.gain.toString();
              valSpan.innerText = Math.round(res.gain * 100) + "%";
            }
          });
          slider.addEventListener("input", () => {
            const v = parseFloat(slider.value);
            valSpan.innerText = Math.round(v * 100) + "%";
            sendGainMessage(tabId, { type: "set-gain", value: v });
          });
        }
        row.appendChild(favicon);
        row.appendChild(label);
        row.appendChild(slider);
        row.appendChild(valSpan);
        return row;
      }
      if (tabsList) {
        Promise.all([
          browser.tabs.query({ currentWindow: true }),
          browser.tabs.query({ active: true, currentWindow: true })
        ]).then(([allTabs, activeTabs]) => {
          const activeId = activeTabs[0]?.id;
          const filtered = allTabs.filter((tab) => {
            if (!tab.url) return true;
            return !tab.url.startsWith("about:") && !tab.url.startsWith("moz-extension:");
          });
          const sorted = [...filtered].sort((a, b) => {
            const aActive = a.id === activeId ? 0 : 1;
            const bActive = b.id === activeId ? 0 : 1;
            return aActive - bActive;
          });
          for (const tab of sorted) {
            const row = buildTabRow(tab, tab.id === activeId);
            tabsList.appendChild(row);
          }
        });
      }
    }
  });
  require_popup();
})();
