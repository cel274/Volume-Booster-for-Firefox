if ((window as any).__volumeBoosterInjected) {
  // Prevent duplicate execution if injected multiple times
} else {
  (window as any).__volumeBoosterInjected = true;

  let audioCtx: AudioContext | null = null;
  let currentGain = 1.0;
  const boostedElements = new Map<HTMLMediaElement, GainNode>();

  // Restore saved tab gain if exists in sessionStorage
  try {
    const saved = sessionStorage.getItem("__vb_gain__");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        currentGain = parsed;
      }
    }
  } catch {}

  function getAudioContext(): AudioContext | null {
    if (!audioCtx || audioCtx.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    return audioCtx;
  }

  function resumeContext(): void {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  }

  function updateAllGainNodes(val: number): void {
    currentGain = val;
    try {
      sessionStorage.setItem("__vb_gain__", val.toString());
    } catch {}

    for (const [el, gainNode] of boostedElements.entries()) {
      if (!el.isConnected) {
        boostedElements.delete(el);
        continue;
      }
      try {
        gainNode.gain.value = val;
      } catch {}
    }
    resumeContext();
  }

  function processElement(e: HTMLMediaElement): void {
    if ((e as any)._boosted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaElementSource(e);
      const gainNode = ctx.createGain();
      gainNode.gain.value = currentGain;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      (e as any)._boosted = true;
      boostedElements.set(e, gainNode);

      const handlePlay = () => {
        resumeContext();
      };
      e.addEventListener("play", handlePlay);
      e.addEventListener("playing", handlePlay);

      if (!e.paused) {
        handlePlay();
      }
    } catch (err) {
      // Element might already be connected or CORS restricted
    }
  }

  function scanMediaElements(): void {
    const elements = document.querySelectorAll<HTMLMediaElement>("video, audio");
    elements.forEach((e) => processElement(e));
  }

  // Register user gesture listeners to wake up suspended AudioContext
  window.addEventListener("click", resumeContext, { capture: true, passive: true });
  window.addEventListener("keydown", resumeContext, { capture: true, passive: true });
  window.addEventListener("pointerdown", resumeContext, { capture: true, passive: true });

  // Initial scan
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanMediaElements);
  } else {
    scanMediaElements();
  }

  // Observe DOM for dynamic media elements (like SPA navigations on YouTube)
  try {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node instanceof HTMLMediaElement) {
            processElement(node);
          } else if (node instanceof HTMLElement) {
            const media = node.querySelectorAll<HTMLMediaElement>("video, audio");
            media.forEach((m) => processElement(m));
          }
        }
      }
    });

    const target = document.documentElement || document.body;
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
  } catch {}

  // Fallback periodic scan
  setInterval(scanMediaElements, 1500);

  // Runtime messaging
  browser.runtime.onMessage.addListener((msg: any) => {
    if (msg.type === "ping") {
      return Promise.resolve({ pong: true });
    }
    if (msg.type === "get-gain") {
      return Promise.resolve({ gain: currentGain });
    }
    if (msg.type === "set-gain" && typeof msg.value === "number") {
      updateAllGainNodes(msg.value);
      return Promise.resolve({ ok: true, gain: currentGain });
    }
    return undefined;
  });
}