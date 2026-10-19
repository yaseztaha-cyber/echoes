import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Atmosphere, EarthLayers, Globe } from "./Globe";
import { HI_TIERS } from "@/engine/textures/manager";
import { GlobeKind } from "@/data/assets/manifest";
import { useHiMap } from "@/engine/textures/hiGlobe";
import { Stars } from "@/engine/world/Stars";
import { artifactsFor } from "@/data/artifacts";
import { LANDMARKS } from "@/data/locations";
import { GLOBE_R, RADIUS_KM, lonLatToVec, smoothstep, vecToLonLat, D2R, R2D } from "@/lib/geo";
import { env, tele, htmlLayer } from "@/engine/telemetry";
import { useEcho } from "@/state/store";
import { selectSite } from "@/engine/director";

const tmp = new THREE.Vector3();

function SiteMarker({ id, occ }: { id: string; occ: React.RefObject<THREE.Mesh | null> }) {
  const art = artifactsFor("mars").concat(artifactsFor("moon")).find((a) => a.id === id)!;
  const pos = useMemo(() => lonLatToVec(art.location.lon, art.location.lat, GLOBE_R * 1.0008), [art]);
  const selected = useEcho((s) => s.artifactId === id);
  const science = useEcho((s) => s.uiMode === "science");
  const box = useRef<HTMLDivElement>(null);
  useFrame(({ camera }) => {
    if (!box.current) return;
    const alt = camera.position.length() - GLOBE_R;
    box.current.style.opacity = String(smoothstep(0.8, 6, alt));
  });
  return (
    <Html portal={htmlLayer as any} position={pos} zIndexRange={[12, 0]} occlude={occ as any} style={{ pointerEvents: "none" }}>
      <div ref={box}>
        <button
          onClick={() => selectSite(id)}
          aria-label={`Select mission site ${art.name}`}
          className="mono"
          style={{ pointerEvents: "auto", display: "flex", alignItems: "flex-end", gap: 8, background: "transparent", border: 0, cursor: "pointer", transform: "translate(-6px,-100%)", color: "#d8d6ce", textAlign: "left" }}
        >
          <div style={{ width: 12, height: 12, border: `1px solid ${selected ? "#d8d6ce" : "#d0a45b"}`, borderRadius: "50%", position: "relative", flex: "none", background: "rgba(5,7,10,.55)" }}>
            <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "#d0a45b" }} />
            <div style={{ position: "absolute", left: 5, top: 12, width: 1, height: 26, background: "#d0a45b", opacity: 0.8 }} />
          </div>
          <div style={{ paddingBottom: 26, fontSize: 9.5, lineHeight: 1.45, letterSpacing: "0.14em", whiteSpace: "nowrap", textShadow: "0 0 6px #000, 0 0 2px #000" }}>
            <div style={{ color: "#d0a45b" }}>{art.designation}</div>
            <div style={{ fontSize: 11, color: "#f0eee6" }}>{art.name}</div>
            {(selected || science) && (
              <>
                <div style={{ color: "#a2a6a4" }}>{art.location.region}</div>
                <div style={{ color: "#6f7576" }}>{art.destination.toUpperCase()}</div>
              </>
            )}
          </div>
        </button>
      </div>
    </Html>
  );
}

function Landmarks({ world }: { world: GlobeKind }) {
  const science = useEcho((s) => s.uiMode === "science");
  const items = LANDMARKS.filter((l) => l.world === world);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useFrame(({ camera }) => {
    const alt = camera.position.length() - GLOBE_R;
    const o = smoothstep(5, 60, alt) * (1 - smoothstep(260, 600, alt));
    refs.current.forEach((r) => r && (r.style.opacity = String(o)));
  });
  if (!science) return null;
  return (
    <>
      {items.map((l, i) => (
        <Html portal={htmlLayer as any} key={l.id} position={lonLatToVec(l.lon, l.lat, GLOBE_R)} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
          <div ref={(el) => { refs.current[i] = el; }} className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "#a2a6a4", whiteSpace: "nowrap", textShadow: "0 0 5px #000" }}>
            <div>{l.name}</div>
            <div style={{ color: "#6f7576", fontSize: 8.5 }}>{l.lat.toFixed(1)}° {l.lon.toFixed(1)}°E</div>
          </div>
        </Html>
      ))}
    </>
  );
}

function PlanetTelemetry({ world }: { world: GlobeKind }) {
  useFrame(({ camera }) => {
    const l = camera.position.length();
    const km = RADIUS_KM[world as keyof typeof RADIUS_KM];
    if (!km) return;
    tele.altitudeM = Math.max(0, ((l - GLOBE_R) / GLOBE_R) * km * 1000);
    tele.distanceToFocusM = (l / GLOBE_R) * km * 1000;
    const ll = vecToLonLat(camera.position);
    tele.lat = ll.lat;
    tele.lon = ll.lon;
    tmp.copy(camera.position).normalize();
    tele.sunAngle = Math.asin(THREE.MathUtils.clamp(tmp.dot(env.sunDir), -1, 1)) * R2D;
    tele.speedScale = Math.max(0.05, (l - GLOBE_R) * 0.7);
  });
  return null;
}

/** Planet-scene globe with the same hi-res upgrade as the solar view. */
function PlanetGlobe({ world }: { world: GlobeKind }) {
  const hiMap = useHiMap(world, GLOBE_R, HI_TIERS[world] ?? null, (cam) => cam.position.length());
  return <Globe kind={world} radius={GLOBE_R} detail hiMap={hiMap} />;
}

/** Simulated time-of-day scrub: rotates the arrival-true sun around local up. 0 = real geometry. */
function SunScrub() {
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const p = useEcho.getState().sunPhase;
    env.sunDir.copy(env.sunBase);
    if (p !== 0) env.sunDir.applyAxisAngle(up, p);
  });
  return null;
}

export function PlanetScene({ world }: { world: GlobeKind }) {  const light = useRef<THREE.DirectionalLight>(null);
  const occ = useRef<THREE.Mesh>(null);
  const sites = (world === "mars" || world === "moon") ? artifactsFor(world) : [];
  useFrame(() => light.current?.position.copy(env.sunDir).multiplyScalar(2000));
  return (
    <>
      <color attach="background" args={["#030406"]} />
      <ambientLight intensity={world === "mars" ? 0.06 : 0.015} />
      <directionalLight ref={light} intensity={world === "mars" ? 2.5 : 3.4} />
      <Suspense fallback={null}>
      <PlanetGlobe world={world} />
      </Suspense>
      <SunScrub />
      {world === "mars" && <Atmosphere radius={GLOBE_R} color="#c9906a" strength={0.75} sun={() => env.sunDir} scale={1.045} power={4.5} />}
      {world === "earth" && <EarthLayers radius={GLOBE_R} sun={() => env.sunDir} />}
      <mesh ref={occ}>
        <sphereGeometry args={[GLOBE_R * 0.997, 32, 16]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      {sites.map((a) => (
        <SiteMarker key={a.id} id={a.id} occ={occ} />
      ))}
      <Landmarks world={world} />
      <Stars radius={9000} />
      <PlanetTelemetry world={world} />
    </>
  );
}

export const _deg = D2R;
