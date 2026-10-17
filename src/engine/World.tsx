import { Component, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraRig } from "./cameras/CameraRig";
import { SolarSystem } from "./solar-system/SolarSystem";
import { PlanetScene } from "./planets/PlanetScene";
import { SiteScene } from "./sites/SiteScene";
import { tick } from "./time/clock";
import { siteRef, tele, htmlLayer } from "./telemetry";
import { useEcho, persist } from "@/state/store";
import { adaptive } from "./performance/adaptive";
import { createDynamicRes } from "./performance/resolution";
import { globeResidency } from "./textures/manager";
import { artifactById } from "@/data/artifacts";

function TimeDriver() {
  useFrame((_, dt) => tick(Math.min(dt, 0.1)));
  return null;
}

function Perf() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const acc = { n: 0, t: 0 };
  useEffect(() => {
    const w = window as typeof window & { __echoesGl?: THREE.WebGLRenderer; __echoesScene?: THREE.Scene };
    w.__echoesGl = gl;
    w.__echoesScene = scene;
  }, [gl, scene]);
  useFrame((_, dt) => {
    const p95 = adaptive.sample(Math.min(dt * 1000, 250));
    tele.frameP95 = p95;
    const st = useEcho.getState();
    const { verdict, next } = adaptive.evaluate(st.quality, st.qualityCeiling, st.autoQuality);
    if (verdict !== "hold" && next !== st.quality) {
      useEcho.setState({ quality: next });
      persist("echoes.quality", next);
    }
    acc.n++;
    acc.t += dt;
    if (acc.t > 0.5) {
      tele.fps = Math.round(acc.n / acc.t);
      acc.n = 0;
      acc.t = 0;
      tele.drawCalls = gl.info.render.calls;
      tele.triangles = gl.info.render.triangles;
      const rs = globeResidency.stats();
      tele.texResident = rs.resident;
      tele.texPending = rs.pending;
      tele.texBytesEst = rs.bytesEstimate;
    }
  });
  return null;
}

/**
 * Dynamic render backing scale (spec §5): the frame-time p95 the quality
 * stepper consumes also drives a bounded backing-store scale. Visibility is
 * identical at every scale — only sharpness moves — so the tier contract
 * "visibility never changes" holds by construction.
 */
function DynamicScale() {
  const gl = useThree((s) => s.gl);
  const quality = useEcho((s) => s.quality);
  const base = useRef(1);
  const last = useRef(1);
  const dr = useRef(createDynamicRes());
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      base.current = gl.getPixelRatio();
      dr.current.reset();
      last.current = 1;
      tele.renderScale = 1;
    });
    return () => cancelAnimationFrame(id);
  }, [gl, quality]);
  useFrame((_, dt) => {
    const s = dr.current.feed(adaptive.p95(), Math.min(dt, 0.25));
    if (s !== last.current) {
      last.current = s;
      gl.setPixelRatio(base.current * s);
      tele.renderScale = s;
    }
  });
  return null;
}

const wp = new THREE.Vector3();
function HotspotProjector() {
  useFrame(({ camera, size }) => {
    const st = useEcho.getState();
    const art = artifactById(st.artifactId);
    const hw = art?.hardware.find((h) => h.id === st.instrumentId);
    if (!hw || !siteRef.group) {
      tele.hotspot.v = false;
      return;
    }
    wp.set(...hw.pos);
    siteRef.group.localToWorld(wp);
    wp.project(camera);
    tele.hotspot.x = ((wp.x + 1) / 2) * size.width;
    tele.hotspot.y = ((1 - wp.y) / 2) * size.height;
    tele.hotspot.v = wp.z < 1;
  });
  return null;
}

class Boundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { err: e.message };
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-ink-0">
        <div className="module max-w-md p-6">
          <div className="label text-crit">DATA LINK INTERRUPTED</div>
          <div className="mt-2 text-lg">TERRAIN TILE UNAVAILABLE</div>
          <p className="mt-2 text-sm text-ash">The current region could not be loaded. {this.state.err}</p>
          <div className="mt-4 flex gap-2">
            <button className="ctl ctl-primary" onClick={() => this.setState({ err: null })}>RETRY</button>
            <button className="ctl" onClick={() => location.reload()}>RETURN TO LAST VALID REGION</button>
          </div>
        </div>
      </div>
    );
  }
}

export function World() {
  const scene = useEcho((s) => s.scene);
  const world = useEcho((s) => s.world);
  const artifactId = useEcho((s) => s.artifactId);
  const quality = useEcho((s) => s.quality);
  const dpr: [number, number] = quality === "ultra" ? [1, 2] : quality === "high" ? [1, 1.6] : quality === "medium" ? [1, 1.25] : [0.75, 1];
  return (
    <Boundary>
      <Canvas
        shadows={quality !== "low"}
        dpr={dpr}
        camera={{ fov: 50, near: 0.01, far: 30000, position: [0, 6, 22] }}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          // Neutral studio reflections so PBR metals (official spacecraft
          // models) read as metal instead of black. Low intensity: rough
          // planetary surfaces are barely affected; lights still dominate.
          const pmrem = new THREE.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          scene.environmentIntensity = 0.5;
          pmrem.dispose();
          // A lost GPU context blanks the canvas while the DOM UI survives —
          // report it instead of leaving a mystifying white view. preventDefault
          // allows the browser to restore the context without a reload.
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            useEcho.setState({ gpuLost: true });
          });
          canvas.addEventListener("webglcontextrestored", () => {
            useEcho.setState({ gpuLost: false });
          });
        }}
        aria-label="ECHOES 3D simulation viewport"
      >
        <TimeDriver />
        <CameraRig />
        <Perf />
        <DynamicScale />
        <HotspotProjector />
        {scene === "solar" && <SolarSystem />}
        {scene === "planet" && (world === "mars" || world === "moon" || world === "earth") && <PlanetScene world={world} />}
        {scene === "site" && artifactId && <SiteScene key={artifactId} artifactId={artifactId} />}
      </Canvas>
      <div ref={(el) => { htmlLayer.current = el; }} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden={false} />
    </Boundary>
  );
}
