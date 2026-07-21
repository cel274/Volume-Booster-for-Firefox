const tabsList = document.getElementById("tabsList") as HTMLDivElement | null;
const globalSlider = document.getElementById("globalSlider") as HTMLInputElement | null;
const globalVal = document.getElementById("globalVal") as HTMLSpanElement | null;

interface GainMessage {
  type: "get-gain" | "set-gain";
  value?: number;
}

interface GainResponse {
  gain: number | null;
}

function buildTabRow(tab: browser.tabs.Tab, isActive: boolean): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "tab-row";

  const favicon = document.createElement("img");
  favicon.className = "tab-favicon";
  favicon.src = tab.favIconUrl || "icons/default-favicon.png";
  favicon.onerror = () => {
    favicon.style.visibility = "hidden";
  };

  const label = document.createElement("span");
  label.className = "tab-label";
  label.title = tab.title ?? "";
  label.innerText = tab.title || "Sin título";
  if (isActive) label.style.color = "#3b82f6";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
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
    browser.tabs
      .sendMessage(tabId, { type: "get-gain" } as GainMessage)
      .then((res: GainResponse) => {
        if (res && res.gain != null) {
          slider.value = res.gain.toString();
          valSpan.innerText = Math.round(res.gain * 100) + "%";
        }
      })
      .catch(() => {});

    slider.addEventListener("input", () => {
      const v = parseFloat(slider.value);
      valSpan.innerText = Math.round(v * 100) + "%";
      browser.tabs.sendMessage(tabId, { type: "set-gain", value: v } as GainMessage).catch(() => {});
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
    browser.tabs.query({ active: true, currentWindow: true }),
  ]).then(([allTabs, activeTabs]) => {
    const activeId = activeTabs[0]?.id;

    const sorted = [...allTabs].sort((a, b) => {
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

if (globalSlider && globalVal) {
  browser.storage.local.get("globalGain").then((data) => {
    const saved = data.globalGain;
    if (typeof saved === "number") {
      globalSlider.value = saved.toString();
      globalVal.innerText = Math.round(saved * 100) + "%";
    }
  });

  globalSlider.addEventListener("input", () => {
    const v = parseFloat(globalSlider.value);
    globalVal.innerText = Math.round(v * 100) + "%";

    browser.storage.local.set({ globalGain: v });

    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id != null) {
          browser.tabs
            .sendMessage(tab.id, { type: "set-gain", value: v } as GainMessage)
            .catch(() => {});
        }
      }
    });
  });
}