import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { BODIES, ORBIT_K, bodyPos, realDistanceKm, realPos, voyagerTrail, MOON_VISUAL_ORBIT, voyagerAU, type Body } from "./model";
import { Atmosphere, BandedGlobe, Globe, PlainGlobe } from "@/engine/planets/Globe";
import { Stars } from "@/engine/world/Stars";
import { ArtifactModel } from "@/engine/spacecraft/models";
import { clock } from "@/engine/time/clock";
import { tele, siteRef, htmlLayer } from "@/engine/telemetry";
import { useEcho } from "@/state/store";
import { artifactById, artifactsFor } from "@/data/artifacts";
import { focusBody } from "@/engine/director";
import { smoothstep, AU_KM } from "@/lib/geo";
import { VOYAGER_LAUNCH, VOYAGER_NOW } from "@/data/artifacts/voyager";

const SUN_DIR = new THREE.Vector3();
const tmp = new THREE.Vector3();

function glowTexture(inner = "rgba(255,244,214,0.6)", mid = "rgba(255,214,150,0.16)") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.22, mid);
  gr.addColorStop(0.55, "rgba(255,180,110,0.05)");
  gr.addColorStop(1, "rgba(255,180,110,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Boiling granulation for the photosphere. Unlit — the sun is the light. */
function sunSurfaceTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#fff3d2");
  base.addColorStop(0.5, "#ffe3a8");
  base.addColorStop(1, "#ffd08a");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  let seed = 1234567;
  const r = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return ((seed >>> 0) % 100000) / 100000;
  };
  for (let i = 0; i < 5200; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 1 + r() * 4.5;
    const hot = r() > 0.45;
    g.fillStyle = hot ? `rgba(255,246,214,${0.25 + r() * 0.4})` : `rgba(214,130,52,${0.2 + r() * 0.35})`;
    g.beginPath();
    g.ellipse(x, y, rad, rad * (0.5 + r() * 0.7), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // brighter faculae patches
  for (let i = 0; i < 26; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 12 + r() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, "rgba(255,252,238,0.5)");
    gr.addColorStop(1, "rgba(255,252,238,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const CORONA_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const CORONA_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uStrength;
uniform float uPower;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - abs(dot(normalize(vN), V)), uPower);
  float n = sin(vW.x * 2.3 + uTime * 1.9) * sin(vW.y * 3.1 - uTime * 1.4) * sin(vW.z * 2.7 + uTime * 2.3);
  float flames = 0.8 + 0.2 * n;
  vec3 col = uColor * rim * uStrength * flames;
  gl_FragColor = vec4(col, clamp(rim * 1.25, 0.0, 1.0));
}
`;

/** Flickering corona shell. Time freezes under reduced-motion. */
function CoronaShell({ scale, color, strength, power }: { scale: number; color: string; strength: number; power: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uni = useMemo(
    () => ({ uTime: { value: 3.1 }, uColor: { value: new THREE.Color(color) }, uStrength: { value: strength }, uPower: { value: power } }),
    [color, strength, power]
  );
  useFrame(({ clock }) => {
    if (mat.current && !useEcho.getState().reducedMotion) mat.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh scale={scale} frustumCulled={false} renderOrder={-4}>
      <sphereGeometry args={[2.4, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={CORONA_VERT}
        fragmentShader={CORONA_FRAG}
        uniforms={uni}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function ringTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  const stops: [number, string][] = [[0.56, "rgba(0,0,0,0)"], [0.58, "rgba(190,170,130,0.35)"], [0.66, "rgba(205,185,145,0.6)"], [0.7, "rgba(60,50,40,0.1)"], [0.73, "rgba(210,190,150,0.75)"], [0.86, "rgba(200,180,140,0.65)"], [0.89, "rgba(0,0,0,0)"], [0.91, "rgba(190,170,130,0.4)"], [0.99, "rgba(190,170,130,0.35)"], [1, "rgba(0,0,0,0)"]];
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function Sun() {
  const surface = useMemo(sunSurfaceTexture, []);
  const haloTight = useMemo(() => glowTexture(), []);
  const haloWide = useMemo(() => glowTexture("rgba(255,236,200,0.35)", "rgba(255,200,130,0.08)"), []);
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const tight = useRef<THREE.Sprite>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const reduced = useEcho.getState().reducedMotion;
    if (reduced) {
      if (light.current) light.current.intensity = 3.4;
      return;
    }
    if (mesh.current) mesh.current.rotation.y += dt * 0.02;
    // barely-there breathing: the light feels alive without moving any UI
    if (light.current) light.current.intensity = 3.4 * (1 + 0.022 * Math.sin(t * 6.3) + 0.017 * Math.sin(t * 11.7 + 1.3));
    if (tight.current) {
      const s = 10.5 * (1 + 0.018 * Math.sin(t * 1.4));
      tight.current.scale.set(s, s, 1);
    }
  });
  return (
    <group>
      <pointLight ref={light} position={[0, 0, 0]} intensity={3.4} decay={0} />
      <mesh ref={mesh}>
        <sphereGeometry args={[2.4, 64, 48]} />
        <meshBasicMaterial map={surface} toneMapped={false} />
      </mesh>
      <CoronaShell scale={1.3} color="#ffe9b0" strength={1.15} power={2.4} />
      <CoronaShell scale={1.75} color="#ff9a4d" strength={0.4} power={3.0} />
      <sprite ref={tight} scale={[10.5, 10.5, 1]} renderOrder={-3}>
        <spriteMaterial map={haloTight} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite scale={[24, 24, 1]} renderOrder={-3}>
        <spriteMaterial map={haloWide} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

function BodyVisual({ b, sun }: { b: Body; sun: THREE.Vector3 }) {
  const ringTex = useMemo(ringTexture, []);
  const sunFrom = () => sun;
  return (
    <>
      {b.tex ? (
        <Suspense fallback={<PlainGlobe color={b.color} radius={b.radius} />}>
          <Globe kind={b.tex} radius={b.radius} rough={1} />
        </Suspense>
      ) : b.bands ? (
        <BandedGlobe colors={b.bands} radius={b.radius} />
      ) : (
        <PlainGlobe color={b.color} radius={b.radius} />
      )}
      {b.id === "earth" && <Atmosphere radius={b.radius} color="#6aa6d4" strength={1.5} sun={sunFrom} scale={1.1} power={3.2} />}
      {b.id === "mars" && <Atmosphere radius={b.radius} color="#c9906a" strength={0.55} sun={sunFrom} scale={1.06} power={4} />}
      {b.id === "venus" && <Atmosphere radius={b.radius} color="#d9c089" strength={0.8} sun={sunFrom} scale={1.07} power={3} />}
      {b.ring && (
        <mesh rotation={[Math.PI / 2 - 0.47, 0, 0]}>
          <ringGeometry args={[b.radius * 1.2, b.radius * 2.2, 96]} />
          <meshBasicMaterial map={ringTex} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}

function BodyNode({ b }: { b: Body }) {
  const g = useRef<THREE.Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const sites = b.destination ? artifactsFor(b.destination).length : 0;
  const sunV = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  useFrame(({ camera }) => {
    if (!g.current) return;
    bodyPos(b.id, clock.t, g.current.position);
    sunV.copy(g.current.position).negate().normalize();
    if (label.current) {
      const d = camera.position.distanceTo(g.current.position);
      const o = smoothstep(b.radius * 3.5, b.radius * 9, d);
      label.current.style.opacity = String(o);
      label.current.style.pointerEvents = o > 0.3 ? "auto" : "none";
    }
  });
  return (
    <group ref={g}>
      <BodyVisual b={b} sun={sunV} />
      <Html portal={htmlLayer as any} center position={[0, b.radius * 1.5 + 0.3, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div ref={label} style={{ transition: "none" }}>
          <button
            onClick={() => focusBody(b.id)}
            className="mono"
            style={{ background: "transparent", border: "none", color: "#d8d6ce", cursor: "pointer", textAlign: "center", whiteSpace: "nowrap", padding: "4px 6px" }}
            aria-label={`Fly to ${b.name}`}
          >
            <div style={{ fontSize: 10, letterSpacing: "0.18em" }}>{b.name}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#6f7576" }}>
              {b.destination ? `${sites} SITES` : b.kind === "moon" ? "" : b.a ? `${b.a.toFixed(2)} AU` : ""}
            </div>
          </button>
        </div>
      </Html>
    </group>
  );
}

function Orbits() {
  const lines = useMemo(
    () =>
      BODIES.filter((b) => b.kind === "planet").map((b) => {
        const r = ORBIT_K * Math.sqrt(b.a);
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 256; i++) pts.push([r * Math.cos((i / 256) * Math.PI * 2), 0, r * Math.sin((i / 256) * Math.PI * 2)]);
        return { id: b.id, pts };
      }),
    []
  );
  return (
    <>
      {lines.map((l) => (
        <Line key={l.id} points={l.pts} color="#3b4246" lineWidth={1} transparent opacity={0.65} />
      ))}
    </>
  );
}

function MoonOrbit() {
  const pts = useMemo(() => Array.from({ length: 65 }, (_, i) => [MOON_VISUAL_ORBIT * Math.cos((i / 64) * Math.PI * 2), 0, MOON_VISUAL_ORBIT * Math.sin((i / 64) * Math.PI * 2)] as [number, number, number]), []);
  const g = useRef<THREE.Group>(null);
  useFrame(() => g.current && bodyPos("earth", clock.t, g.current.position));
  return (
    <group ref={g}>
      <Line points={pts} color="#3b4246" lineWidth={1} transparent opacity={0.5} />
    </group>
  );
}

function Voyager() {
  const g = useRef<THREE.Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const bucket = useEcho((s) => Math.floor(s.sim.t / (45 * 86400000)));
  const trail = useMemo(() => voyagerTrail(clock.t), [bucket]);
  const art = artifactById("voyager1")!;
  const selected = useEcho((s) => s.artifactId === "voyager1");
  useFrame(({ camera }) => {
    if (!g.current) return;
    bodyPos("voyager1", clock.t, g.current.position);
    tmp.copy(g.current.position).negate();
    if (tmp.lengthSq() > 1e-6) g.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.normalize());
    g.current.visible = clock.t >= VOYAGER_LAUNCH;
    if (useEcho.getState().artifactId === "voyager1" && useEcho.getState().scene === "solar") {
      siteRef.group = g.current;
      siteRef.pos.copy(g.current.position);
    }
    if (label.current) {
      const d = camera.position.distanceTo(g.current.position);
      label.current.style.opacity = String(smoothstep(0.4, 3, d));
    }
  });
  const auNow = voyagerAU(Math.min(clock.t, VOYAGER_NOW));
  void auNow;
  return (
    <>
      <Line points={trail} color="#d0a45b" lineWidth={1.2} transparent opacity={0.7} />
      <group ref={g} scale={0.03}>
        <ArtifactModel artifact={art} />
        <Html portal={htmlLayer as any} position={[0, 22, 0]} center zIndexRange={[10, 0]}>
          <div ref={label} className="mono" style={{ pointerEvents: "auto" }}>
            <button
              onClick={() => focusBody("voyager1")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: selected ? "#d0a45b" : "#d8d6ce", whiteSpace: "nowrap", textAlign: "center" }}
              aria-label="Fly to Voyager 1"
            >
              <div style={{ fontSize: 10, letterSpacing: "0.18em" }}>VOYAGER 1</div>
              <div style={{ fontSize: 9, color: "#6f7576", letterSpacing: "0.12em" }}>NOT TO SCALE</div>
            </button>
          </div>
        </Html>
      </group>
    </>
  );
}

/** Sunlight catching interplanetary dust: the only thing near the camera that truly parallaxes. */
function EclipticDust() {
  const quality = useEcho((s) => s.quality);
  const ref = useRef<THREE.Points>(null);
  const count = quality === "ultra" ? 520 : quality === "high" ? 340 : quality === "medium" ? 190 : 0;
  const geo = useMemo(() => {
    let seed = 777;
    const r = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return ((seed >>> 0) % 100000) / 100000;
    };
    const pos = new Float32Array(Math.max(count, 1) * 3);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const rad = 9 + Math.pow(r(), 1.6) * 125;
      pos.set([Math.cos(a) * rad, (r() + r() + r() - 1.5) * 5, Math.sin(a) * rad], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current && !useEcho.getState().reducedMotion) ref.current.rotation.y += dt * 0.0045;
  });
  if (!count) return null;
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-5}>
      <pointsMaterial color="#a08c64" size={0.45} sizeAttenuation transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Faint instrument reticle on the ecliptic: range rings + spokes, data-viz quiet. */
function EclipticGrid() {
  const quality = useEcho((s) => s.quality);
  const rings = useMemo(
    () =>
      [20, 40, 60, 80, 100, 120].map((rad) => {
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2;
          pts.push([rad * Math.cos(a), 0, rad * Math.sin(a)]);
        }
        return { rad, pts };
      }),
    []
  );
  const spokes = useMemo(() => {
    const out: [number, number, number][][] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      out.push([
        [10 * Math.cos(a), 0, 10 * Math.sin(a)],
        [124 * Math.cos(a), 0, 124 * Math.sin(a)],
      ]);
    }
    return out;
  }, []);
  return (
    <group>
      {rings.map((ring) => (
        <Line key={ring.rad} points={ring.pts} color="#232b31" lineWidth={1} transparent opacity={0.5} />
      ))}
      {quality !== "low" &&
        spokes.map((s, i) => <Line key={i} points={s} color="#1d2429" lineWidth={1} transparent opacity={0.45} />)}
    </group>
  );
}

function SolarTelemetry() {
  useFrame(({ camera }) => {
    const st = useEcho.getState();
    const id = st.focusBody;
    const p = bodyPos(id, clock.t, tmp);
    const d = camera.position.distanceTo(p);
    const b = BODIES.find((x) => x.id === id);
    if (b) {
      tele.altitudeM = Math.max(0, ((d - b.radius) / b.radius) * b.km * 1000);
      tele.distanceToFocusM = tele.altitudeM + b.km * 1000;
    } else {
      // Voyager: distance from the Sun in AU
      tele.altitudeM = voyagerAU(Math.min(clock.t, VOYAGER_NOW)) * AU_KM * 1000;
      tele.distanceToFocusM = tele.altitudeM;
    }
    const rp = realPos(id, clock.t);
    tele.sunDistAU = Math.hypot(rp[0], rp[1], rp[2]);
    tele.focusRealKm = id === "earth" ? 0 : realDistanceKm("earth", id, clock.t);
    tele.speedScale = Math.max(0.05, (d - (b?.radius ?? 0)) * 0.7);
  });
  return null;
}

export function SolarSystem() {
  return (
    <>
      <color attach="background" args={["#05070a"]} />
      <ambientLight intensity={0.07} />
      <Sun />
      {BODIES.filter((b) => b.kind !== "star").map((b) => (
        <BodyNode key={b.id} b={b} />
      ))}
      <Orbits />
      <EclipticGrid />
      <EclipticDust />
      <MoonOrbit />
      <Voyager />
      <Stars radius={9000} />
      <SolarTelemetry />
    </>
  );
}
