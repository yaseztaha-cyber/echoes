import { Component, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraRig } from "./cameras/CameraRig";
import { SolarSystem } from "./solar-system/SolarSystem";
import { PlanetScene } from "./planets/PlanetScene";
import { SiteScene } from "./sites/SiteScene";
import { tick } from "./time/clock";
import { siteRef, tele, htmlLayer } from "./telemetry";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";

function TimeDriver() {
  useFrame((_, dt) => tick(Math.min(dt, 0.1)));
  return null;
}

function Perf() {
  const gl = useThree((s) => s.gl);
  const acc = { n: 0, t: 0 };
  useFrame((_, dt) => {
    acc.n++;
    acc.t += dt;
    if (acc.t > 0.5) {
      tele.fps = Math.round(acc.n / acc.t);
      acc.n = 0;
      acc.t = 0;
      tele.drawCalls = gl.info.render.calls;
      tele.triangles = gl.info.render.triangles;
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
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        aria-label="ECHOES 3D simulation viewport"
      >
        <TimeDriver />
        <CameraRig />
        <Perf />
        <HotspotProjector />
        {scene === "solar" && <SolarSystem />}
        {scene === "planet" && (world === "mars" || world === "moon") && <PlanetScene world={world} />}
        {scene === "site" && artifactId && <SiteScene key={artifactId} artifactId={artifactId} />}
      </Canvas>
      <div ref={(el) => { htmlLayer.current = el; }} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden={false} />
    </Boundary>
  );
}
