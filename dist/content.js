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
      var activeGainNode = null;
      function processElement(e) {
        if (e._boosted) return;
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
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
          e._boosted = true;
          if (!e.paused) handlePlay();
        } catch (err) {
          console.error(err);
        }
      }
      function init() {
        const elements = document.querySelectorAll("video, audio");
        elements.forEach((e) => processElement(e));
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
      setInterval(() => {
        document.querySelectorAll("video, audio").forEach((e) => processElement(e));
      }, 1e3);
      browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === "set-gain" && activeGainNode) {
          activeGainNode.gain.value = msg.value;
          return Promise.resolve({ ok: true });
        }
        if (msg.type === "get-gain") {
          return Promise.resolve({ gain: activeGainNode ? activeGainNode.gain.value : null });
        }
        return void 0;
      });
    }
  });
  require_content();
})();
