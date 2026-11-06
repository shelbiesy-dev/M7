// Ripples: soft rings where food drops and where a fish eats (docs/02_frontend.md §5).
// They are only for looks.

import * as THREE from 'three';
import { SETTINGS } from './settings.js';
import { DEPTH } from './scene.js';

const ringVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uWidth;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float ring = exp(-pow((r - 0.86) / uWidth, 2.0));
    float inner = exp(-pow((r - 0.62) / (uWidth * 1.4), 2.0)) * 0.35;
    gl_FragColor = vec4(vec3(0.78, 0.92, 1.0), (ring + inner) * uAlpha);
  }
`;

const quad = new THREE.PlaneGeometry(1, 1);
const MAX_RIPPLES = 40;

export function createRipples(scene) {
  const active = [];
  const pool = [];

  function takeMesh() {
    let mesh = pool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({
        uniforms: { uAlpha: { value: 0 }, uWidth: { value: 0.06 } },
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }));
      mesh.renderOrder = 4;
    }
    scene.add(mesh);
    return mesh;
  }

  function add(x, y, z, duration, size, strength, width) {
    if (active.length >= MAX_RIPPLES) {
      const old = active.shift();
      scene.remove(old.mesh);
      pool.push(old.mesh);
    }
    const mesh = takeMesh();
    mesh.position.set(x, y, z);
    mesh.material.uniforms.uWidth.value = width;
    active.push({ mesh, age: 0, duration, size, strength });
    update(0);
  }

  function drop(x, y) {
    add(x, y, DEPTH.surface + 1, SETTINGS.dropRippleTime, SETTINGS.dropRippleSize, 0.5, 0.05);
  }

  function eat(x, y) {
    add(x, y, DEPTH.fish - 1, SETTINGS.eatRippleTime, SETTINGS.eatRippleSize, 0.4, 0.08);
  }

  function update(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const r = active[i];
      r.age += dt;
      const t = r.age / r.duration;
      if (t >= 1) {
        scene.remove(r.mesh);
        pool.push(r.mesh);
        active.splice(i, 1);
        continue;
      }
      const radius = r.size * (1 - Math.pow(1 - t, 2.2)) + 0.3;   // spreads out, slowing down
      r.mesh.scale.set(radius * 2, radius * 2, 1);
      r.mesh.material.uniforms.uAlpha.value = r.strength * Math.pow(1 - t, 1.5) * Math.min(1, t * 8);
    }
  }

  function clear() {
    for (const r of active) {
      scene.remove(r.mesh);
      pool.push(r.mesh);
    }
    active.length = 0;
  }

  return { drop, eat, update, clear };
}
