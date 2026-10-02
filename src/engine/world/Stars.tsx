import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEcho } from "@/state/store";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float tw = 0.68 + 0.32 * sin(uTime * aSpeed + aPhase);
  vColor = aColor * (0.55 + 0.45 * tw);
  vAlpha = tw;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (0.7 + 0.5 * tw);
  gl_Position = projectionMatrix * mv;
}
`;

const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.04, d);
  float glow = smoothstep(0.5, 0.18, d) * 0.35;
  gl_FragColor = vec4(vColor * (core + glow), (core + glow) * vAlpha);
}
`;

interface LayerSpec {
  count: number;
  size: number;
  bright: number;
  seed: number;
}

/** One twinkling star layer. Time is frozen when reduced-motion is on. */
function StarLayer({ radius, spec, dim, spin }: { radius: number; spec: LayerSpec; dim: number; spin: number }) {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const r = rng(spec.seed);
    const pos = new Float32Array(spec.count * 3);
    const col = new Float32Array(spec.count * 3);
    const pha = new Float32Array(spec.count);
    const spd = new Float32Array(spec.count);
    for (let i = 0; i < spec.count; i++) {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([s * Math.cos(a) * radius, u * radius, s * Math.sin(a) * radius], i * 3);
      const b = (0.12 + Math.pow(r(), 4.5) * 0.88) * spec.bright * dim;
      const tint = r();
      // restrained palette: bone white, cool blue-grey, faint warm
      const warm = r() > 0.86;
      col.set(
        warm ? [b, b * 0.82, b * 0.62] : [b * (0.88 + 0.12 * tint), b * 0.93, b * (1 - 0.12 * tint)],
        i * 3
      );
      pha[i] = r() * Math.PI * 2;
      spd[i] = 0.25 + r() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(pha, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(spd, 1));
    return g;
  }, [radius, spec, dim]);
  useFrame(({ camera, clock }) => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    if (spin !== 0) ref.current.rotation.y += spin;
    if (mat.current) {
      const reduced = useEcho.getState().reducedMotion;
      mat.current.uniforms.uTime.value = reduced ? 7.3 : clock.elapsedTime;
    }
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-10}>
      <shaderMaterial
        ref={mat}
        args={[
          {
            vertexShader: STAR_VERT,
            fragmentShader: STAR_FRAG,
            uniforms: { uTime: { value: 7.3 }, uSize: { value: spec.size } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </points>
  );
}

function milkyWayTexture() {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#05070a";
  g.fillRect(0, 0, W, H);
  const r = rng(4242);
  // faint galactic band, tilted
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(-0.42);
  const blob = (x: number, y: number, rad: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  const tones = ["rgba(88,110,150,0.055)", "rgba(64,110,120,0.05)", "rgba(150,120,80,0.045)", "rgba(110,120,150,0.05)"];
  for (let i = 0; i < 420; i++) {
    const x = (r() - 0.5) * W * 1.3;
    const y = (r() + r() + r() - 1.5) * 46;
    blob(x, y, 18 + r() * 90, tones[(r() * tones.length) | 0]);
  }
  // dark dust lanes cutting the band
  for (let i = 0; i < 90; i++) {
    const x = (r() - 0.5) * W * 1.1;
    const y = (r() + r() - 1) * 30;
    blob(x, y, 10 + r() * 42, "rgba(2,3,5,0.35)");
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function nebulaSprite(inner: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.45, inner.replace(/[\d.]+\)$/, "0.35)"));
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vast faint backdrop: milky-way shell + whisper nebulae. Follows the camera. */
function DeepBackdrop({ radius }: { radius: number }) {
  const ref = useRef<THREE.Group>(null);
  const sky = useMemo(milkyWayTexture, []);
  const neb = useMemo(
    () => [nebulaSprite("rgba(86,110,160,0.5)"), nebulaSprite("rgba(90,150,160,0.42)"), nebulaSprite("rgba(190,130,70,0.36)")],
    []
  );
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  const R = radius * 1.5;
  return (
    <group ref={ref} renderOrder={-20}>
      <mesh frustumCulled={false} renderOrder={-20}>
        <sphereGeometry args={[R, 48, 32]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {[
        { p: [0.62, 0.28, -0.72], s: R * 0.85, o: 0.16 },
        { p: [-0.7, -0.18, -0.66], s: R * 0.7, o: 0.13 },
        { p: [0.1, -0.42, 0.9], s: R * 0.6, o: 0.11 },
      ].map((n, i) => (
        <sprite
          key={i}
          position={[n.p[0] * R * 0.92, n.p[1] * R * 0.92, n.p[2] * R * 0.92]}
          scale={[n.s, n.s, 1]}
          renderOrder={-19}
        >
          <spriteMaterial map={neb[i]} transparent opacity={n.o} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

/**
 * Living backdrop. Same props as before (radius/count/dim) so planet and site
 * scenes keep working; the solar view layers extra depth on top.
 */
export function Stars({ radius, count = 650, dim = 1 }: { radius: number; count?: number; dim?: number }) {
  const quality = useEcho((s) => s.quality);
  const rich = quality === "ultra" || quality === "high";
  const minimal = quality === "low";
  const far: LayerSpec =
    quality === "ultra"
      ? { count: Math.max(count * 2, 1200), size: 2.1, bright: 1, seed: 1977 }
      : quality === "high"
        ? { count: Math.max(count, 650), size: 2.0, bright: 1, seed: 1977 }
        : quality === "medium"
          ? { count: Math.round(count * 0.7), size: 1.9, bright: 0.95, seed: 1977 }
          : { count: Math.round(count * 0.45), size: 1.8, bright: 0.9, seed: 1977 };
  const near: LayerSpec = { count: quality === "ultra" ? 420 : 260, size: 3.1, bright: 1.15, seed: 9021 };
  return (
    <>
      {!minimal && <DeepBackdrop radius={radius} />}
      <StarLayer radius={radius} spec={far} dim={dim} spin={rich ? 0.00012 : 0} />
      {rich && <StarLayer radius={radius * 0.82} spec={near} dim={dim} spin={-0.00007} />}
    </>
  );
}
