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

  // src/content.ts
  var require_content = __commonJS({
    "src/content.ts"() {
      if (window.__volumeBoosterInjected) {
      } else {
        let getAudioContext2 = function() {
          if (!audioCtx || audioCtx.state === "closed") {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            audioCtx = new AudioContextClass();
          }
          return audioCtx;
        }, resumeContext2 = function() {
          if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {
            });
          }
        }, updateAllGainNodes2 = function(val) {
          currentGain = val;
          try {
            sessionStorage.setItem("__vb_gain__", val.toString());
          } catch {
          }
          for (const [el, gainNode] of boostedElements.entries()) {
            if (!el.isConnected) {
              boostedElements.delete(el);
              continue;
            }
            try {
              gainNode.gain.value = val;
            } catch {
            }
          }
          resumeContext2();
        }, processElement2 = function(e) {
          if (e._boosted) return;
          try {
            const ctx = getAudioContext2();
            if (!ctx) return;
            const source = ctx.createMediaElementSource(e);
            const gainNode = ctx.createGain();
            gainNode.gain.value = currentGain;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            e._boosted = true;
            boostedElements.set(e, gainNode);
            const handlePlay = () => {
              resumeContext2();
            };
            e.addEventListener("play", handlePlay);
            e.addEventListener("playing", handlePlay);
            if (!e.paused) {
              handlePlay();
            }
          } catch (err) {
          }
        }, scanMediaElements2 = function() {
          const elements = document.querySelectorAll("video, audio");
          elements.forEach((e) => processElement2(e));
        };
        getAudioContext = getAudioContext2, resumeContext = resumeContext2, updateAllGainNodes = updateAllGainNodes2, processElement = processElement2, scanMediaElements = scanMediaElements2;
        window.__volumeBoosterInjected = true;
        let audioCtx = null;
        let currentGain = 1;
        const boostedElements = /* @__PURE__ */ new Map();
        try {
          const saved = sessionStorage.getItem("__vb_gain__");
          if (saved) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed) && parsed >= 0) {
              currentGain = parsed;
            }
          }
        } catch {
        }
        window.addEventListener("click", resumeContext2, { capture: true, passive: true });
        window.addEventListener("keydown", resumeContext2, { capture: true, passive: true });
        window.addEventListener("pointerdown", resumeContext2, { capture: true, passive: true });
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", scanMediaElements2);
        } else {
          scanMediaElements2();
        }
        try {
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                if (node instanceof HTMLMediaElement) {
                  processElement2(node);
                } else if (node instanceof HTMLElement) {
                  const media = node.querySelectorAll("video, audio");
                  media.forEach((m) => processElement2(m));
                }
              }
            }
          });
          const target = document.documentElement || document.body;
          if (target) {
            observer.observe(target, { childList: true, subtree: true });
          }
        } catch {
        }
        setInterval(scanMediaElements2, 1500);
        browser.runtime.onMessage.addListener((msg) => {
          if (msg.type === "ping") {
            return Promise.resolve({ pong: true });
          }
          if (msg.type === "get-gain") {
            return Promise.resolve({ gain: currentGain });
          }
          if (msg.type === "set-gain" && typeof msg.value === "number") {
            updateAllGainNodes2(msg.value);
            return Promise.resolve({ ok: true, gain: currentGain });
          }
          return void 0;
        });
      }
      var getAudioContext;
      var resumeContext;
      var updateAllGainNodes;
      var processElement;
      var scanMediaElements;
    }
  });
  require_content();
})();
