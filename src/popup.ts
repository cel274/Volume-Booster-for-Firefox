const tabsList = document.getElementById("tabsList") as HTMLDivElement | null;

interface GainMessage {
  type: "get-gain" | "set-gain" | "ping";
  value?: number;
}

interface GainResponse {
  gain?: number | null;
  pong?: boolean;
  ok?: boolean;
}

const injectionPromises = new Map<number, Promise<void>>();

async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    const res = (await browser.tabs.sendMessage(tabId, { type: "ping" } as GainMessage)) as GainResponse;
    if (res && res.pong) return true;
  } catch {
    // Content script not responding yet
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
      files: ["dist/content.js"],
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

async function sendGainMessage(tabId: number, message: GainMessage): Promise<GainResponse | null> {
  try {
    return (await browser.tabs.sendMessage(tabId, message)) as GainResponse;
  } catch {
    const injected = await ensureContentScript(tabId);
    if (!injected) return null;
    try {
      return (await browser.tabs.sendMessage(tabId, message)) as GainResponse;
    } catch {
      return null;
    }
  }
}

function buildTabRow(tab: browser.tabs.Tab, isActive: boolean): HTMLDivElement {
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
  label.innerText = tab.title || "Sin título";
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
    browser.tabs.query({ active: true, currentWindow: true }),
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