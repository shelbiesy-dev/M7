// Food: small warm glowing dots (docs/02_frontend.md §4).
//
// Life of one piece:
//   sinking (~3 s, cannot be eaten) → landed (5 s, can be eaten, fades in the last 1 s) → gone

import * as THREE from 'three';
import { SETTINGS } from './settings.js';
import { DEPTH } from './scene.js';

const foodVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const foodFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uDepth;    // 0 at the surface, 1 on the bottom
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;          // 0 centre … 1 edge of the quad
    float coreSize = 0.24;
    float soft = mix(0.06, 0.16, uDepth);        // softer as it sinks
    float core = (1.0 - smoothstep(coreSize - soft, coreSize + soft, r)) * 0.8;
    float glow = exp(-r * r * 9.0) * 0.5;
    vec3 warm = mix(vec3(1.0, 0.8, 0.42), vec3(0.98, 0.68, 0.32), uDepth);
    float a = clamp(core + glow, 0.0, 1.0) * uAlpha * (1.0 - 0.25 * uDepth);
    gl_FragColor = vec4(warm, a);
  }
`;

const quad = new THREE.PlaneGeometry(1, 1);
const SPRITE_SIZE = 3.0;   // world units, including the glow (the dot itself is ~1 unit)

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function createFood(scene, world) {
  const pieces = [];   // active pieces
  const pool = [];     // unused meshes, reused to avoid garbage

  function takeMesh() {
    let mesh = pool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({
        uniforms: { uAlpha: { value: 1 }, uDepth: { value: 0 } },
        vertexShader: foodVertex,
        fragmentShader: foodFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,   // keeps the warm gold colour (additive turns it white on blue)
      }));
      mesh.renderOrder = 2;
    }
    mesh.visible = true;
    scene.add(mesh);
    return mesh;
  }

  function release(piece) {
    piece.mesh.visible = false;
    scene.remove(piece.mesh);
    pool.push(piece.mesh);
  }

  function room() {
    return Math.max(0, SETTINGS.maxFood - pieces.length);
  }

  /** Drops up to foodPerDrop pieces at (x, y). Returns how many were dropped. */
  function drop(x, y) {
    const count = Math.min(SETTINGS.foodPerDrop, room());
    const m = SETTINGS.foodSpread + 2;
    const cx = clamp(x, -world.halfW + m, world.halfW - m);
    const cy = clamp(y, -world.halfH + m, world.halfH - m);

    for (let i = 0; i < count; i++) {
      // landing spot: random inside a small circle around the drop spot
      const a = rand(0, Math.PI * 2);
      const r = Math.sqrt(Math.random()) * SETTINGS.foodSpread;
      const endX = cx + Math.cos(a) * r;
      const endY = cy + Math.sin(a) * r;
      // starting spot: closer to the centre, so the pieces drift apart while sinking
      const startX = cx + Math.cos(a) * r * 0.35;
      const startY = cy + Math.sin(a) * r * 0.35;

      pieces.push({
        startX, startY, endX, endY,
        x: startX, y: startY,
        age: rand(-0.12, 0),            // small stagger so they don't move as one
        wobble: rand(0, Math.PI * 2),
        landed: false,
        mesh: takeMesh(),
      });
    }
    update(0);
    return count;
  }

  function update(dt) {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.age += dt;
      const t = clamp(p.age / SETTINGS.sinkTime, 0, 1);
      let alpha = Math.min(1, (p.age + 0.12) / 0.25);   // appears softly at the surface

      if (t < 1) {
        // sinking: slows down as it goes deeper, with a slight side-to-side drift
        const e = 1 - (1 - t) * (1 - t);
        const wob = Math.sin(p.wobble + p.age * 2.2) * 0.35 * (1 - t);
        p.x = p.startX + (p.endX - p.startX) * e + wob;
        p.y = p.startY + (p.endY - p.startY) * e;
        p.landed = false;
      } else {
        p.x = p.endX;
        p.y = p.endY;
        p.landed = true;
        const onBottom = p.age - SETTINGS.sinkTime;
        if (onBottom >= SETTINGS.bottomTime) {
          release(p);
          pieces.splice(i, 1);
          continue;
        }
        const fadeStart = SETTINGS.bottomTime - SETTINGS.fadeTime;
        if (onBottom > fadeStart) alpha *= 1 - (onBottom - fadeStart) / SETTINGS.fadeTime;
      }

      const depth = t;
      const size = SPRITE_SIZE * (1 - 0.25 * depth);   // a little smaller deeper down
      p.mesh.position.set(p.x, p.y, DEPTH.surface + (DEPTH.bottom + 1 - DEPTH.surface) * depth);
      p.mesh.scale.set(size, size, 1);
      p.mesh.material.uniforms.uAlpha.value = alpha;
      p.mesh.material.uniforms.uDepth.value = depth;
    }
  }

  function landed() {
    return pieces.filter((p) => p.landed);
  }

  function eat(piece) {
    const i = pieces.indexOf(piece);
    if (i === -1) return;
    release(piece);
    pieces.splice(i, 1);
  }

  function clear() {
    for (const p of pieces) release(p);
    pieces.length = 0;
  }

  return { drop, update, landed, eat, clear, count: () => pieces.length };
}
