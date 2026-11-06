// The sea: renderer, top-down camera and the glowing sea bottom.
//
// World layout (seen from above, camera on +z looking down):
//   x: -50 … +50          (always 100 units = the screen width)
//   y: -height/2 … +height/2
//   z: surface +6, fish 0, bottom -10   (depth only changes drawing order)

import * as THREE from 'three';

export const DEPTH = {
  surface: 6,
  fish: 0,
  shadow: -9,
  bottom: -10,
};

const bottomVertex = /* glsl */ `
  varying vec2 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xy;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Dreamy blue with darker edges and soft moving light patterns (caustics).
const bottomFragment = /* glsl */ `
  uniform float uTime;
  uniform vec2 uHalf;      // half the visible width / height in world units
  varying vec2 vWorld;

  #define TAU 6.28318530718

  // Soft water-light pattern.
  float caustic(vec2 p, float t) {
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.0);
  }

  void main() {
    vec2 q = vWorld / uHalf;                    // -1 … 1 across the screen
    float edge = length(q * vec2(0.9, 1.0));

    vec3 deep   = vec3(0.035, 0.105, 0.255);
    vec3 middle = vec3(0.11, 0.33, 0.62);
    vec3 glow   = vec3(0.32, 0.62, 0.88);

    vec3 color = mix(middle, deep, smoothstep(0.15, 1.35, edge));
    // a soft pool of light that slowly wanders
    vec2 lightPos = vec2(sin(uTime * 0.05) * 0.25, cos(uTime * 0.04) * 0.2 + 0.1);
    color += glow * 0.22 * exp(-dot(q - lightPos, q - lightPos) * 1.6);

    // caustics, sized in world units so they look the same at any window size
    // each layer is wrapped on its own TAU tile, so the pattern has no seams
    vec2 p1 = mod(vWorld * 0.045 * TAU, TAU) - 250.0;
    vec2 p2 = mod(vWorld * 0.07 * TAU + 1.3, TAU) - 250.0;
    float c1 = caustic(p1, uTime * 0.22 + 23.0);
    float c2 = caustic(p2, uTime * 0.17 + 7.0);
    float light = c1 * 0.65 + c2 * 0.35;
    // slow, large brightness changes so the pattern never looks like a repeating tile
    light *= 0.55 + 0.45 * sin(vWorld.x * 0.045 + uTime * 0.09) * sin(vWorld.y * 0.06 - uTime * 0.07 + 1.7);
    color += vec3(0.55, 0.8, 1.0) * clamp(light, 0.0, 1.2) * 0.13 * (1.0 - smoothstep(0.4, 1.4, edge));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0a2350, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-50, 50, 30, -30, 0.1, 200);
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  const bottomUniforms = {
    uTime: { value: 0 },
    uHalf: { value: new THREE.Vector2(50, 30) },
  };
  const bottom = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: bottomUniforms,
      vertexShader: bottomVertex,
      fragmentShader: bottomFragment,
      depthWrite: false,
    }),
  );
  bottom.position.z = DEPTH.bottom;
  bottom.renderOrder = 0;
  scene.add(bottom);

  // The visible sea in world units. Width is always 100.
  const world = { width: 100, height: 60, halfW: 50, halfH: 30 };

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    world.height = 100 * (h / w);
    world.halfH = world.height / 2;
    camera.top = world.halfH;
    camera.bottom = -world.halfH;
    camera.updateProjectionMatrix();
    bottom.scale.set(world.width * 1.02, world.height * 1.02, 1);
    bottomUniforms.uHalf.value.set(world.halfW, world.halfH);
  }
  resize();

  // Turns a mouse position (pixels) into a point on the water (world units).
  function screenToWorld(clientX, clientY) {
    return {
      x: (clientX / window.innerWidth - 0.5) * world.width,
      y: (0.5 - clientY / window.innerHeight) * world.height,
    };
  }

  return {
    renderer,
    scene,
    camera,
    world,
    resize,
    screenToWorld,
    setTime(t) { bottomUniforms.uTime.value = t; },
    render() { renderer.render(scene, camera); },
  };
}
