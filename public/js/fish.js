// The fish: soft, glowing, see-through white shapes (docs/02_frontend.md §3).
//
// Each fish is always doing one of four things:
//   wander  – mouse off the page, no landed food
//   follow  – mouse over the sea: loose circle around the cursor
//   detour  – following, but landed food is within 10% → eat it, then go back
//   chase   – mouse off the page and there is landed food → nearest piece

import * as THREE from 'three';
import { SETTINGS } from './settings.js';
import { DEPTH } from './scene.js';

const TAU = Math.PI * 2;

// ---------- Look ----------

const fishVertex = /* glsl */ `
  uniform float uPhase;    // tail sway phase
  uniform float uAmp;      // tail sway size
  uniform float uBend;     // body curve while turning
  varying float vS;        // 0 at the nose, 1 at the tail tip
  varying float vV;        // across the body
  varying vec2 vQuad;      // position on the flat quad, for fading the glow out before its edge
  void main() {
    vec3 p = position;
    vQuad = position.xy;
    float s = 0.5 - p.x;   // the nose is at x = +0.5, the tail tip at x = -0.5
    float back = clamp(s, 0.0, 1.2);
    p.y += sin(uPhase - s * 5.5) * uAmp * pow(back, 1.7);
    p.y += uBend * back * back;
    vS = s;
    vV = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fishFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uShadow;   // 1 = draw as a soft shadow on the bottom
  varying float vS;
  varying float vV;
  varying vec2 vQuad;

  // half-width of the rounded body, nose (s = 0) to the narrow end (s = 0.8)
  float bodyW(float s) {
    float t = clamp(s / 0.8, 0.0, 1.0);
    return 0.15 * pow(sin(3.14159 * pow(t, 0.62)), 0.85);
  }

  // distance from the body outline (negative inside)
  float dBody(float s, float av) {
    float sc = clamp(s, 0.0, 0.8);
    float d = av - bodyW(sc);
    return (s != sc) ? length(vec2(s - sc, max(d, 0.0))) : d;
  }

  // the tail: a soft fan with a small fork
  float dTail(float s, float av) {
    float sc = clamp(s, 0.66, 1.0);
    float w = 0.16 * smoothstep(0.66, 1.0, sc) + 0.015;
    float notch = 0.08 * smoothstep(0.86, 1.0, sc);
    float d = max(av - w, notch - av);
    return (s != sc) ? length(vec2(s - sc, max(d, 0.0))) : d;
  }

  // two soft, rounded side fins
  float dFin(float s, float av) {
    float sc = clamp(s, 0.2, 0.46);
    float k = sin(3.14159 * (sc - 0.2) / 0.26);
    float w = 0.24 * sqrt(max(k, 0.0));
    float d = av - w;
    return (s != sc) ? length(vec2(s - sc, max(d, 0.0))) : d;
  }

  void main() {
    float av = abs(vV);
    float db = dBody(vS, av);
    float dt = dTail(vS, av);
    float df = dFin(vS, av);

    float soft = mix(0.03, 0.07, uShadow);
    float body = 1.0 - smoothstep(-soft, soft, db);
    float tail = (1.0 - smoothstep(-soft * 1.4, soft * 1.4, dt)) * 0.42;
    float fin  = (1.0 - smoothstep(-soft * 1.6, soft * 1.6, df)) * 0.22;

    // see-through body, brighter along the spine
    float spine = 1.0 - clamp(av / max(bodyW(vS), 0.02), 0.0, 1.0);
    float core = max(body * (0.38 + 0.62 * spine * spine), max(tail, fin));

    // soft glow around the whole shape
    float d = min(db, min(dt, df));
    float glow = exp(-max(d, 0.0) * 10.0) * 0.36 * (1.0 - uShadow);

    // fade everything to zero before the edge of the quad (no visible rectangle)
    float edge = (1.0 - smoothstep(0.5, 0.7, abs(vQuad.x))) * (1.0 - smoothstep(0.26, 0.45, abs(vQuad.y)));

    float a = clamp(core + glow, 0.0, 1.0) * uOpacity * edge;
    gl_FragColor = vec4(uColor, a);
  }
`;

function makeFishMaterial({ shadow }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPhase: { value: 0 },
      uAmp: { value: 0.05 },
      uBend: { value: 0 },
      uColor: { value: shadow ? new THREE.Color(0x020a1c) : new THREE.Color(0xeef6ff) },
      uOpacity: { value: shadow ? 0.28 : 0.72 },
      uShadow: { value: shadow ? 1 : 0 },
    },
    vertexShader: fishVertex,
    fragmentShader: fishFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: shadow ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}

// One shared shape: 1 unit long, with room around it for the glow.
const fishGeometry = new THREE.PlaneGeometry(1.4, 0.9, 56, 6);

// ---------- Helpers ----------

function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

// ---------- One fish ----------

class Fish {
  constructor(scene, world, index) {
    this.index = index;
    this.baseScale = 1 + rand(-SETTINGS.fishSizeVariation, SETTINGS.fishSizeVariation);
    this.scale = this.baseScale;
    this.targetScale = this.baseScale;
    this.eaten = 0;

    this.x = rand(-world.halfW * 0.6, world.halfW * 0.6);
    this.y = rand(-world.halfH * 0.6, world.halfH * 0.6);
    this.heading = rand(-Math.PI, Math.PI);
    this.speed = 0;
    this.turnRate = 0;
    this.phase = rand(0, TAU);
    this.slot = index;
    this.mode = 'wander';
    this.wanderTarget = null;
    this.wanderTimer = 0;

    this.mesh = new THREE.Mesh(fishGeometry, makeFishMaterial({ shadow: false }));
    this.mesh.renderOrder = 3;
    this.shadow = new THREE.Mesh(fishGeometry, makeFishMaterial({ shadow: true }));
    this.shadow.renderOrder = 1;
    scene.add(this.shadow);
    scene.add(this.mesh);
  }

  get length() { return SETTINGS.fishLength * this.scale; }

  // where the fish eats from
  mouth() {
    const reach = this.length * 0.4;
    return { x: this.x + Math.cos(this.heading) * reach, y: this.y + Math.sin(this.heading) * reach };
  }

  pickWanderTarget(world) {
    const m = 10;
    this.wanderTarget = {
      x: rand(-world.halfW + m, world.halfW - m),
      y: rand(-world.halfH + m, world.halfH - m),
    };
    this.wanderTimer = rand(8, 14);
  }

  updateLook() {
    const len = this.length;
    this.mesh.position.set(this.x, this.y, DEPTH.fish);
    this.mesh.rotation.z = this.heading;
    this.mesh.scale.set(len, len, 1);

    // soft shadow on the bottom, a little offset as if lit from above-left
    this.shadow.position.set(this.x + 1.3, this.y - 1.3, DEPTH.shadow);
    this.shadow.rotation.z = this.heading;
    this.shadow.scale.set(len * 1.06, len * 1.06, 1);

    const fullSpeed = 100 / SETTINGS.crossTime;
    const amp = 0.045 + 0.06 * clamp(this.speed / fullSpeed, 0, 1);
    const bend = clamp(this.turnRate * 0.09, -0.12, 0.12);
    for (const mat of [this.mesh.material, this.shadow.material]) {
      mat.uniforms.uPhase.value = this.phase;
      mat.uniforms.uAmp.value = amp;
      mat.uniforms.uBend.value = -bend;
    }
  }
}

// ---------- The school ----------

export function createSchool(scene, world) {
  const fish = [];
  for (let i = 0; i < SETTINGS.fishCount; i++) fish.push(new Fish(scene, world, i));
  for (const f of fish) { f.pickWanderTarget(world); f.updateLook(); }

  let ringAngle = 0;
  let wasFollowing = false;

  // When following starts, give each fish the circle slot nearest its side,
  // so they don't cross over each other.
  function assignSlots(mouse) {
    const order = fish
      .map((f) => ({ f, a: Math.atan2(f.y - mouse.y, f.x - mouse.x) }))
      .sort((p, q) => p.a - q.a);
    ringAngle = order[0].a;
    order.forEach((p, i) => { p.f.slot = i; });
  }

  function ringRadius() {
    // about 5% from the cursor; widens a little when the fish have grown, so they don't overlap
    const total = fish.reduce((sum, f) => sum + f.length, 0);
    return Math.max(SETTINGS.followDistance + 1, (total * 1.3) / TAU);
  }

  function slotPoint(f, mouse) {
    const a = ringAngle + (f.slot * TAU) / fish.length;
    const r = ringRadius();
    return { x: mouse.x + Math.cos(a) * r, y: mouse.y + Math.sin(a) * r };
  }

  function nearestFood(from, pieces, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const p of pieces) {
      const d = Math.hypot(p.x - from.x, p.y - from.y);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  /**
   * @param dt      seconds since the last frame
   * @param mouse   { inside, x, y }
   * @param food    the food module (landed() gives edible pieces, eat(piece) removes one)
   * @param onEat   called with (x, y) when a piece is eaten
   */
  function update(dt, mouse, food, onEat) {
    const fullSpeed = 100 / SETTINGS.crossTime;
    const following = mouse.inside;
    if (following && !wasFollowing) assignSlots(mouse);
    wasFollowing = following;
    ringAngle += SETTINGS.ringDrift * dt;

    const landed = food.landed();

    for (const f of fish) {
      const mouth = f.mouth();
      const halfLen = f.length / 2;
      const minX = -world.halfW + SETTINGS.edgeMargin + halfLen;
      const maxX = world.halfW - SETTINGS.edgeMargin - halfLen;
      const minY = -world.halfH + SETTINGS.edgeMargin + halfLen;
      const maxY = world.halfH - SETTINGS.edgeMargin - halfLen;

      // ----- decide what to do -----
      let target;
      let topSpeed;
      let slowRadius;
      let minSpeed;

      if (following) {
        const near = nearestFood(mouth, landed, SETTINGS.detourRange);
        if (near) {
          f.mode = 'detour';
          target = near;
          topSpeed = fullSpeed; slowRadius = 8; minSpeed = 0.2 * fullSpeed;
        } else {
          f.mode = 'follow';
          target = slotPoint(f, mouse);
          topSpeed = fullSpeed; slowRadius = 12; minSpeed = 0.1 * fullSpeed;
        }
      } else {
        const near = nearestFood(mouth, landed, Infinity);
        if (near) {
          f.mode = 'chase';
          target = near;
          topSpeed = fullSpeed; slowRadius = 8; minSpeed = 0.2 * fullSpeed;
        } else {
          if (f.mode !== 'wander' || !f.wanderTarget) f.pickWanderTarget(world);
          f.mode = 'wander';
          f.wanderTimer -= dt;
          if (f.wanderTimer <= 0 || Math.hypot(f.wanderTarget.x - f.x, f.wanderTarget.y - f.y) < 6) {
            f.pickWanderTarget(world);
          }
          target = f.wanderTarget;
          topSpeed = fullSpeed * SETTINGS.wanderSpeed; slowRadius = 10; minSpeed = 0.25 * topSpeed;
        }
      }

      const tx = clamp(target.x, minX, maxX);
      const ty = clamp(target.y, minY, maxY);

      // ----- steer smoothly (no sharp turns) -----
      const dx = tx - f.x;
      const dy = ty - f.y;
      const dist = Math.hypot(dx, dy);
      const turnNeeded = wrapAngle(Math.atan2(dy, dx) - f.heading);

      let wanted = Math.max(minSpeed, topSpeed * Math.min(1, dist / slowRadius));
      wanted *= 0.3 + 0.7 * Math.max(0, Math.cos(turnNeeded)); // slow down to turn

      const maxTurn = 1.8 * (1 + 1.6 * (1 - clamp(f.speed / fullSpeed, 0, 1)));
      const turn = clamp(turnNeeded, -maxTurn * dt, maxTurn * dt);
      f.heading = wrapAngle(f.heading + turn);
      f.turnRate += ((turn / Math.max(dt, 1e-4)) - f.turnRate) * Math.min(1, dt * 4);

      const accel = fullSpeed * 0.9;
      f.speed += clamp(wanted - f.speed, -accel * dt, accel * dt);

      f.x += Math.cos(f.heading) * f.speed * dt;
      f.y += Math.sin(f.heading) * f.speed * dt;

      // keep some space from the other fish
      for (const o of fish) {
        if (o === f) continue;
        const ox = f.x - o.x;
        const oy = f.y - o.y;
        const d = Math.hypot(ox, oy) || 0.001;
        const keep = (f.length + o.length) * 0.45;
        if (d < keep) {
          const push = (keep - d) * Math.min(1, dt * 3);
          f.x += (ox / d) * push * 0.5;
          f.y += (oy / d) * push * 0.5;
        }
      }

      // always inside the visible sea
      f.x = clamp(f.x, minX, maxX);
      f.y = clamp(f.y, minY, maxY);

      // tail sways faster when swimming faster
      f.phase += dt * (3 + 9 * clamp(f.speed / fullSpeed, 0, 1));

      // ----- eat a landed piece within reach -----
      const m = f.mouth();
      for (const piece of food.landed()) {
        if (Math.hypot(piece.x - m.x, piece.y - m.y) < SETTINGS.eatDistance) {
          food.eat(piece);
          onEat(piece.x, piece.y);
          f.eaten += 1;
          f.targetScale = f.baseScale * Math.min(SETTINGS.maxGrowth, 1 + SETTINGS.growthPerBite * f.eaten);
          break; // one piece per fish per frame
        }
      }

      // grow smoothly toward the new size
      f.scale += (f.targetScale - f.scale) * Math.min(1, dt * 2);
      f.updateLook();
    }
  }

  // After a resize, keep every fish inside the new sea.
  function keepInside() {
    for (const f of fish) {
      const halfLen = f.length / 2;
      f.x = clamp(f.x, -world.halfW + SETTINGS.edgeMargin + halfLen, world.halfW - SETTINGS.edgeMargin - halfLen);
      f.y = clamp(f.y, -world.halfH + SETTINGS.edgeMargin + halfLen, world.halfH - SETTINGS.edgeMargin - halfLen);
      if (f.wanderTarget) f.pickWanderTarget(world);
      f.updateLook();
    }
  }

  return { fish, update, keepInside };
}
