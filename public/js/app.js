// Dreamy Fish Pond — ties everything together.

import * as THREE from 'three';
import { SETTINGS } from './settings.js';
import { createScene, DEPTH } from './scene.js';
import { createSchool } from './fish.js';
import { createFood } from './food.js';
import { createRipples } from './ripples.js';
import { createSound } from './sound.js';
import { createConnection } from './connection.js';

export function start() {
  const sea = createScene(document.getElementById('sea'));
  const school = createSchool(sea.scene, sea.world);
  const food = createFood(sea.scene, sea.world);
  const ripples = createRipples(sea.scene);
  const sound = createSound();

  const hintEl = document.getElementById('hint');
  const statusEl = document.getElementById('status');
  const muteEl = document.getElementById('mute');

  // ---------- Mouse ----------
  // inside: is the mouse over the sea right now?
  // last:   where it was last seen over the sea (null = never)
  const mouse = { inside: false, x: 0, y: 0, last: null };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;   // desktop mouse only
    const p = sea.screenToWorld(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
    mouse.last = { x: p.x, y: p.y };
  });
  document.documentElement.addEventListener('mouseleave', () => { mouse.inside = false; });
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) mouse.inside = false;
  });
  window.addEventListener('blur', () => { stopSpaceHold(); });

  // ---------- Feeding ----------
  let hidden = document.hidden;
  let fedOnce = false;

  function feed() {
    if (hidden) return;                       // presses while hidden are ignored
    let spot;
    if (mouse.inside) spot = { x: mouse.x, y: mouse.y };
    else if (mouse.last) spot = mouse.last;  // last place the mouse was over the sea
    else spot = { x: 0, y: 0 };              // never seen: the centre

    const dropped = food.drop(spot.x, spot.y);
    if (dropped === 0) return;                // full: nothing drops, no plop
    ripples.drop(spot.x, spot.y);
    sound.plop();
    if (!fedOnce) {
      fedOnce = true;
      hintEl.classList.add('gone');
    }
  }

  // Space works exactly like the button: drop now, then once every second while held.
  let spaceTimer = null;
  function stopSpaceHold() {
    if (spaceTimer) clearInterval(spaceTimer);
    spaceTimer = null;
  }
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (e.repeat || spaceTimer) return;       // ignore the computer's own key repeat
    feed();
    spaceTimer = setInterval(feed, SETTINGS.holdRepeatMs);
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') stopSpaceHold();
  });

  // ---------- Sound start + mute ----------
  // The first click or key press anywhere starts the sound (not on the icon,
  // which handles its own first click so it doesn't instantly mute again).
  function firstGesture(e) {
    if (sound.started) return;
    if (e.target && e.target.closest && e.target.closest('#mute')) return;
    sound.start();
  }
  window.addEventListener('pointerdown', firstGesture, true);
  window.addEventListener('keydown', firstGesture, true);

  // The icon never keeps focus, so Space always feeds instead of toggling the icon.
  muteEl.addEventListener('mousedown', (e) => e.preventDefault());
  muteEl.addEventListener('click', () => {
    sound.toggleMute();
    muteEl.blur();
  });
  sound.onChange(({ muted }) => {
    muteEl.dataset.state = muted ? 'muted' : 'on';
    muteEl.setAttribute('aria-label', muted ? 'Sound off — click to turn on' : 'Sound on — click to mute');
  });

  // ---------- Connection ----------
  createConnection({
    onFeed: feed,
    onStatusChange: (state) => { statusEl.hidden = state === 'ok'; },
  });

  // ---------- Hidden tab ----------
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    sound.setHidden(hidden);
    if (hidden) {
      stopSpaceHold();
    } else {
      food.clear();          // all food is cleared when the tab comes back
      ripples.clear();
      lastTime = performance.now();
    }
  });

  // ---------- Resize ----------
  window.addEventListener('resize', () => {
    sea.resize();
    school.keepInside();
  });

  // ---------- Animation loop ----------
  const clock = { t: 0 };
  let lastTime = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) { lastTime = now; return; }  // paused while hidden
    const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    clock.t += dt;

    food.update(dt);
    school.update(dt, mouse, food, (x, y) => ripples.eat(x, y));
    ripples.update(dt);
    sea.setTime(clock.t);
    sea.render();
  }
  requestAnimationFrame(frame);

  // handy for checking things in the browser console
  window.pond = { THREE, DEPTH, feed, food, school, mouse };
}
