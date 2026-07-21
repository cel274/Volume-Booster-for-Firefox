let activeGainNode: GainNode | null = null;

function processElement(e: HTMLMediaElement): void {
  if ((e as any)._boosted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const handlePlay = () => {
      if (audioCtx.state === "suspended") audioCtx.resume();
    };
    e.addEventListener("play", handlePlay);
    const source = audioCtx.createMediaElementSource(e);
    const gainNode = audioCtx.createGain();
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    browser.storage.local.get("globalGain").then((data) => {
      gainNode.gain.value = typeof data.globalGain === "number" ? data.globalGain : 1;
    });

    activeGainNode = gainNode;
    (e as any)._boosted = true;
    if (!e.paused) handlePlay();
  } catch (err) {
    console.error(err);
  }
}

function init(): void {
  const elements = document.querySelectorAll<HTMLMediaElement>("video, audio");
  elements.forEach((e) => processElement(e));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

setInterval(() => {
  document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((e) => processElement(e));
}, 1000);

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "set-gain" && activeGainNode) {
    activeGainNode.gain.value = msg.value;
    return Promise.resolve({ ok: true });
  }
  if (msg.type === "get-gain") {
    return Promise.resolve({ gain: activeGainNode ? activeGainNode.gain.value : null });
  }
  return undefined;
});