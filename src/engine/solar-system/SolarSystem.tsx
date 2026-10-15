import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { BODIES, ORBIT_K, bodyPos, realDistanceKm, realPos, voyagerTrail, MOON_VISUAL_ORBIT, voyagerAU, type Body } from "../frames/frames";
import { Atmosphere, BandedGlobe, Globe, PlainGlobe } from "@/engine/planets/Globe";
import { Stars } from "@/engine/world/Stars";
import { ArtifactModel } from "@/engine/spacecraft/models";
import sunUrl from "@/assets/tex/sun.jpg";
import { clock } from "@/engine/time/clock";
import { tele, siteRef, htmlLayer } from "@/engine/telemetry";
import { useEcho } from "@/state/store";
import { artifactById, artifactsFor } from "@/data/artifacts";
import { focusBody } from "@/engine/director";
import { smoothstep, AU_KM } from "@/lib/geo";
import { VOYAGER_LAUNCH, VOYAGER_NOW } from "@/data/artifacts/voyager";

const SUN_DIR = new THREE.Vector3();
const tmp = new THREE.Vector3();

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,244,214,0.55)");
  gr.addColorStop(0.25, "rgba(255,226,170,0.14)");
  gr.addColorStop(1, "rgba(255,226,170,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
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
  const tex = useMemo(glowTexture, []);
  // RECONSTRUCTED photosphere (SDO/HMI-derived granulation, see manifest).
  // Real wavelength observations live in the SolarScope science view.
  const surface = useMemo(() => {
    const t = new THREE.TextureLoader().load(sunUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.4, 48, 32]} />
        <meshBasicMaterial map={surface} toneMapped={false} />
      </mesh>
      <sprite scale={[11, 11, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  );
}

function BodyVisual({ b, sun }: { b: Body; sun: THREE.Vector3 }) {
  const ringTex = useMemo(ringTexture, []);
  const sunFrom = () => sun;
  const venusView = useEcho((s) => s.venusView);
  const kind = b.id === "venus" && venusView === "clouds" ? "venus_clouds" : b.tex;
  return (
    <>
      {kind ? (
        <Suspense fallback={<PlainGlobe color={b.color} radius={b.radius} />}>
          <Globe kind={kind} radius={b.radius} rough={1} />
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
        // Documented C-to-A ring extent (inner ~1.24R, outer ~2.27R). Gradient is
        // representative shading, not measured optical depth — see manifest.
        <mesh rotation={[Math.PI / 2 - 0.47, 0, 0]}>
          <ringGeometry args={[b.radius * 1.24, b.radius * 2.27, 96]} />
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
      <pointLight position={[0, 0, 0]} intensity={3.4} decay={0} />
      <Sun />
      {BODIES.filter((b) => b.kind !== "star").map((b) => (
        <BodyNode key={b.id} b={b} />
      ))}
      <Orbits />
      <MoonOrbit />
      <Voyager />
      <Stars radius={9000} />
      <SolarTelemetry />
    </>
  );
}
