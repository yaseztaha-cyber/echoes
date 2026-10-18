import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line, useGLTF } from "@react-three/drei";
import { Terrain } from "@/engine/terrain/Terrain";
import { RockField } from "@/engine/terrain/Rocks";
import { heightAt, slopeAt, footprintPose, terrainState } from "@/engine/terrain/height";
import { loadSiteDem, clearSiteDem, onDemReady } from "@/engine/terrain/dem";
import { ArtifactModel } from "@/engine/spacecraft/models";
import { MER_OFFICIAL_URL } from "@/engine/spacecraft/merOfficial";
import { Stars } from "@/engine/world/Stars";
import { artifactById } from "@/data/artifacts";
import { artifactStateAt, buildPath } from "@/engine/missions/pathing";
import { clock } from "@/engine/time/clock";
import { env, siteRef, tele, htmlLayer } from "@/engine/telemetry";
import { useEcho } from "@/state/store";
import { D2R, RADIUS_KM, fmtDist, localToLonLat, proximityState, smoothstep } from "@/lib/geo";
import type { Artifact } from "@/types";

const HORIZON = new THREE.Color("#c8a27e");

export function sunVector(el: number, az: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(el * D2R) * Math.sin(az * D2R), Math.sin(el * D2R), -Math.cos(el * D2R) * Math.cos(az * D2R));
}

function SkyDome() {
  const ref = useRef<THREE.Mesh>(null);
  const uni = useMemo(() => ({ uSun: { value: new THREE.Vector3(0, 1, 0) }, uHor: { value: new THREE.Color("#cfa987") }, uZen: { value: new THREE.Color("#8d6a55") } }), []);
  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
    uni.uSun.value.copy(env.sunDir);
  });
  return (
    <mesh ref={ref} renderOrder={-20} frustumCulled={false}>
      <sphereGeometry args={[120000, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uni}
        vertexShader={`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={`varying vec3 vD; uniform vec3 uSun; uniform vec3 uHor; uniform vec3 uZen;
          void main(){ float h=clamp(vD.y,0.0,1.0); vec3 c=mix(uHor,uZen,pow(h,0.45));
          float s=max(dot(normalize(vD),normalize(uSun)),0.0);
          c+=vec3(1.0,0.86,0.7)*(pow(s,600.0)*3.0+pow(s,10.0)*0.22);
          c*=0.55+0.45*smoothstep(-0.1,0.4,uSun.y);
          if(vD.y<0.0) c=uHor*0.85;
          gl_FragColor=vec4(c,1.0);} `}
      />
    </mesh>
  );
}

/** Half-span of each landed frame in metres (footprint grounding radius). */
const FOOTPRINT: Record<string, number> = { mer: 1.3, sojourner: 0.5, insight: 1.6, apollo: 4.6, voyager: 0 };

function SiteArtifact({ art, sun }: { art: Artifact; sun: THREE.Vector3 }) {
  const g = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const yaw = useRef(0);
  const first = useRef(true);
  const { camera } = useThree();
  const rover = art.model.kind === "mer" || art.model.kind === "sojourner";
  useFrame(() => {
    if (!g.current) return;
    const s = artifactStateAt(art, clock.t);
    if (first.current) {
      yaw.current = s.yaw;
      first.current = false;
    }
    let d = s.yaw - yaw.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw.current += d * 0.12;
    // Footprint grounding: rest on the highest sample under the frame so no
    // wheel, foot or leg dives below the surface; tilt with the local slope.
    // (The old code used the minimum sample, which buried frames on slopes.)
    let y: number;
    let pitch = 0;
    let roll = 0;
    if (rover) {
      const c = Math.cos(yaw.current), sn = -Math.sin(yaw.current);
      const hf = heightAt(s.x + c * 0.55, s.z + sn * 0.55);
      const hr = heightAt(s.x - c * 0.55, s.z - sn * 0.55);
      y = Math.max(heightAt(s.x, s.z), hf, hr) - 0.03;
      pitch = Math.atan2(hf - hr, 1.1);
    } else {
      const pose = footprintPose(s.x, s.z, FOOTPRINT[art.model.kind] ?? 1.0);
      y = pose.y;
      pitch = pose.pitch;
      roll = pose.roll;
    }
    g.current.position.set(s.x, y, s.z);
    g.current.rotation.set(roll, yaw.current, pitch, "YZX");
    g.current.visible = s.onSurface;
    siteRef.group = g.current;
    siteRef.pos.set(s.x, y + (art.model.kind === "apollo" ? 1.3 : 0.7), s.z);
    siteRef.visible = s.onSurface;
    tele.distToArtifact = camera.position.distanceTo(siteRef.pos);
    if (light.current) {
      light.current.position.copy(siteRef.pos).addScaledVector(sun, 120);
      light.current.target.position.copy(siteRef.pos);
      light.current.target.updateMatrixWorld();
    }
  });
  return (
    <>
      <directionalLight
        ref={light}
        intensity={art.destination === "moon" ? 4.2 : 2.9}
      />
      {light.current && <primitive object={light.current.target} />}
      <group ref={g}>
        <ArtifactModel artifact={art} />
      </group>
    </>
  );
}

function MissionRoute({ art }: { art: Artifact }) {
  const path = useMemo(() => buildPath(art), [art]);
  const idx = useEcho((s) => (path.length ? artifactStateAt(art, s.sim.t).index : 0));
  const simT = useEcho((s) => s.sim.t);
  const science = useEcho((s) => s.uiMode === "science");
  const wps = art.missionPath?.waypoints ?? [];
  // DEM landing shifts the ground plane — recompute route line heights on arrival.
  const [demTick, setDemTick] = useState(0);
  useEffect(() => onDemReady(() => setDemTick((v) => v + 1)), []);
  const lift = useCallback((x: number, z: number): [number, number, number] => [x, heightAt(x, z) + 1.2, z], [demTick]);
  const lastWp = wps.filter((w) => w.t <= simT).length - 1;
  const legStart = useMemo(() => {
    if (lastWp < 0) return 0;
    const t = wps[lastWp].t;
    const i = path.findIndex((p) => p.t >= t);
    return Math.max(0, i);
  }, [lastWp, path, wps]);
  const dim = useMemo(() => path.slice(0, legStart + 1).map((p) => lift(p.x, p.z)), [path, legStart, demTick]);
  const bright = useMemo(() => path.slice(legStart, idx + 2).map((p) => lift(p.x, p.z)), [path, legStart, idx, demTick]);
  if (path.length < 2) return null;
  return (
    <>
      {dim.length > 1 && <Line points={dim} color="#d0a45b" lineWidth={1.3} transparent opacity={0.4} />}
      {bright.length > 1 && <Line points={bright} color="#f3d28a" lineWidth={2.4} transparent opacity={0.95} />}
      {wps
        .filter((w) => w.t <= simT)
        .map((w) => (
          <group key={w.id} position={lift(w.x, w.z)}>
            <Html portal={htmlLayer as any} zIndexRange={[9, 0]} style={{ pointerEvents: "none" }}>
              <div className="mono" style={{ transform: "translate(8px,-50%)", fontSize: 9, letterSpacing: "0.14em", color: "#d0a45b", whiteSpace: "nowrap", display: science ? "block" : "none", textShadow: "0 0 5px #000" }}>
                {w.name}
              </div>
              <div style={{ width: 5, height: 5, background: "#d0a45b", transform: "translate(-50%,-50%) rotate(45deg)" }} />
            </Html>
          </group>
        ))}
    </>
  );
}

function Beacon({ art }: { art: Artifact }) {
  const wrap = useRef<HTMLDivElement>(null);
  const txt = useRef<HTMLSpanElement>(null);
  const ctx = useRef<HTMLSpanElement>(null);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.position.copy(siteRef.pos);
    const d = tele.distToArtifact;
    if (wrap.current) wrap.current.style.opacity = String(siteRef.visible ? smoothstep(30, 140, d) : 0);
    if (txt.current) txt.current.textContent = fmtDist(d);
    if (ctx.current) ctx.current.textContent = proximityState(d);
  });
  return (
    <group ref={group}>
      <Html portal={htmlLayer as any} zIndexRange={[11, 0]} style={{ pointerEvents: "none" }}>
        <div ref={wrap} className="mono" style={{ transform: "translate(-6px,-100%)", display: "flex", alignItems: "flex-end", gap: 8, whiteSpace: "nowrap" }}>
          <div style={{ width: 12, height: 12, border: "1px solid #d0a45b", borderRadius: "50%", position: "relative", flex: "none" }}>
            <div style={{ position: "absolute", left: 5, top: 12, width: 1, height: 54, background: "linear-gradient(#d0a45b,transparent)" }} />
          </div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.14em", lineHeight: 1.5, paddingBottom: 60, textShadow: "0 0 6px #000" }}>
            <div style={{ color: "#d0a45b" }}>{art.designation} · {art.name}</div>
            <div style={{ color: "#6f7576" }}><span ref={ctx} /></div>
            <div style={{ color: "#d8d6ce" }}>
              DISTANCE <span ref={txt} />
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function SiteTelemetry({ art }: { art: Artifact }) {
  useFrame(({ camera }) => {
    const p = camera.position;
    const g = heightAt(p.x, p.z);
    tele.altitudeM = Math.max(0, p.y - g);
    tele.elevM = g;
    tele.slopeDeg = slopeAt(p.x, p.z);
    const ll = localToLonLat(art.location.lat, art.location.lon, p.x, p.z, RADIUS_KM[art.destination === "moon" ? "moon" : "mars"]);
    tele.lat = ll.lat;
    tele.lon = ll.lon;
    tele.sunAngle = art.sun.el;
    tele.distanceToFocusM = tele.distToArtifact;
    tele.speedScale = Math.max(2.5, tele.altitudeM * 0.9);
  });
  return null;
}

export function SiteScene({ artifactId }: { artifactId: string }) {
  const art = artifactById(artifactId)!;
  const mars = art.destination === "mars";
  const world = mars ? "mars" : "moon";
  terrainState.world = world;
  terrainState.seed = art.terrainSeed;
  const sun = useMemo(() => sunVector(art.sun.el, art.sun.az), [art]);
  env.sunDir.copy(sun);
  const fog = useMemo(() => new THREE.FogExp2(HORIZON.getHex(), 0.00002), []);
  // Phase 9: real LOLA/MOLA relief for mission sites (no-op for sites without a
  // patch — the note stays procedural in that case).
  useEffect(() => {
    loadSiteDem(art.id, world);
    return () => clearSiteDem();
  }, [art.id, world]);
  useEffect(() => {
    // Start the official rover geometry early so inspection rarely waits.
    if (art.model.kind === "mer") useGLTF.preload(MER_OFFICIAL_URL);
  }, [art]);
  return (
    <>
      {mars ? <SkyDome /> : <color attach="background" args={["#000000"]} />}
      {mars && <primitive object={fog} attach="fog" />}
      {!mars && <Stars radius={90000} count={500} dim={0.55} />}
      <hemisphereLight args={mars ? ["#b89a86", "#3a251c", 0.38] : ["#1a1a1c", "#050505", 0.04]} />
      <Terrain
        world={world}
        seed={art.terrainSeed}
        rootSize={mars ? 65536 : 32768}
        center={mars ? [6000, 10000] : [0, 0]}
        maxDepth={mars ? 9 : 10}
      />
      <SiteArtifact art={art} sun={sun} />
      <RockField seed={art.terrainSeed} />
      <MissionRoute art={art} />
      <Beacon art={art} />
      <SiteTelemetry art={art} />
    </>
  );
}
