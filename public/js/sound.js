// Sound: a soft looping water ambience and a gentle plop per drop (docs/02_frontend.md §7).
//
// Browsers block sound until the user clicks or presses a key on the page,
// so nothing plays before that. If a file fails to load, that sound is just
// missing and everything else keeps working (E7).

import { SETTINGS } from './settings.js';

// The page tries each name in turn, so you can drop in .mp3 files later
// without changing the code.
const AMBIENT_FILES = ['sounds/ambient.mp3', 'sounds/ambient.wav'];
const PLOP_FILES = ['sounds/plop.mp3', 'sounds/plop.wav'];

export function createSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let master = null;
  let ambientBuffer = null;
  let plopBuffer = null;
  let ambientSource = null;
  let started = false;
  let muted = true;       // shows as muted until the sound has started
  let hidden = false;
  const listeners = [];

  try {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  } catch (error) {
    console.warn('Sound is not available:', error);
  }

  async function loadFirst(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.arrayBuffer();
        // Safari's older decodeAudioData only supports callbacks
        return await new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject));
      } catch {
        // try the next file
      }
    }
    console.warn('Sound file could not be loaded:', urls.join(' or '));
    return null;
  }

  if (ctx) {
    loadFirst(AMBIENT_FILES).then((b) => { ambientBuffer = b; startAmbient(); });
    loadFirst(PLOP_FILES).then((b) => { plopBuffer = b; });
  }

  function startAmbient() {
    if (!started || !ambientBuffer || ambientSource) return;
    const gain = ctx.createGain();
    gain.gain.value = SETTINGS.ambientVolume;
    gain.connect(master);
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = ambientBuffer;
    ambientSource.loop = true;
    ambientSource.connect(gain);
    ambientSource.start();
  }

  function applyVolume() {
    if (!ctx) return;
    const target = muted ? 0 : 1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.15);
  }

  function notify() {
    for (const fn of listeners) fn({ started, muted });
  }

  /** First click or key press: start the sound and turn it on. */
  function start() {
    if (started) return;
    started = true;
    muted = false;
    if (ctx) {
      if (!hidden) ctx.resume().catch(() => {});
      startAmbient();
      applyVolume();
    }
    notify();
  }

  function toggleMute() {
    if (!started) { start(); return; }
    muted = !muted;
    applyVolume();
    notify();
  }

  function plop() {
    if (!ctx || !started || muted || hidden || !plopBuffer) return;
    const gain = ctx.createGain();
    gain.gain.value = SETTINGS.plopVolume;
    gain.connect(master);
    const source = ctx.createBufferSource();
    source.buffer = plopBuffer;
    source.playbackRate.value = 0.92 + Math.random() * 0.16;  // each plop a little different
    source.connect(gain);
    source.start();
  }

  /** Tab hidden: pause all sound. Tab shown: resume (unless muted — mute is just volume 0). */
  function setHidden(value) {
    hidden = value;
    if (!ctx || !started) return;
    if (hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  }

  return {
    start,
    toggleMute,
    plop,
    setHidden,
    get started() { return started; },
    onChange(fn) { listeners.push(fn); fn({ started, muted }); },
  };
}
