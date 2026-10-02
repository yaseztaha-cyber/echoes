import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { cam } from "./controller";
import { useEcho } from "@/state/store";
import { tele } from "@/engine/telemetry";
import { heightAt } from "@/engine/terrain/height";
import { GLOBE_R } from "@/lib/geo";

const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const mv = new THREE.Vector3();
const P = new THREE.Vector3();
const G = new THREE.Vector3();

export const SCENE_CAMERA = {
  solar: { near: 0.01, far: 30000 },
  planet: { near: 0.05, far: 30000 },
  site: { near: 0.05, far: 160000 },
};

export function CameraRig() {
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const scene = useEcho((s) => s.scene);

  useEffect(() => {
    cam.controls = controls.current;
    cam.camera = camera as THREE.PerspectiveCamera;
  }, [camera]);

  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.near = SCENE_CAMERA[scene].near;
    c.far = SCENE_CAMERA[scene].far;
    c.updateProjectionMatrix();
  }, [scene, camera]);

  useFrame((_, dtRaw) => {
    const ct = controls.current;
    if (!ct) return;
    cam.controls = ct;
    const dt = Math.min(dtRaw, 0.05);
    const st = useEcho.getState();
    const c = camera as THREE.PerspectiveCamera;

    if (cam.flight) {
      const f = cam.flight;
      f.t += dt / f.dur;
      const u = Math.min(1, f.t);
      P.copy(c.position);
      G.copy(ct.target);
      f.fn(f.ease(u), P, G);
      c.position.copy(P);
      ct.target.copy(G);
      c.lookAt(G);
      ct.update();
      if (u >= 1) {
        cam.flight = null;
        useEcho.setState({ flying: false });
        f.resolve();
      }
      cam.followFresh = true;
    } else {
      const mode = st.camMode;
      // follow target (planet, spacecraft)
      if (cam.follow) {
        const p = cam.follow();
        if (!cam.followFresh) {
          mv.copy(p).sub(cam.followPrev);
          c.position.add(mv);
          ct.target.add(mv);
        }
        cam.followPrev.copy(p);
        cam.followFresh = false;
      }
      ct.autoRotate = mode === "cinematic";
      ct.autoRotateSpeed = 0.5;
      const freeLike = mode === "free" || mode === "surface";
      ct.enableZoom = !freeLike;
      ct.enablePan = !freeLike;
      if (freeLike) {
        c.getWorldDirection(fwd);
        right.crossVectors(fwd, c.up).normalize();
        const k = cam.keys;
        const boost = k.has("shiftleft") || k.has("shiftright") ? 4 : 1;
        let speed = tele.speedScale * boost;
        if (mode === "surface") speed = (boost > 1 ? 7 : 2.4);
        mv.set(0, 0, 0);
        if (k.has("keyw") || k.has("arrowup")) mv.add(mode === "surface" ? fwd.clone().setY(0).normalize() : fwd);
        if (k.has("keys") || k.has("arrowdown")) mv.addScaledVector(mode === "surface" ? fwd.clone().setY(0).normalize() : fwd, -1);
        if (k.has("keya") || k.has("arrowleft")) mv.addScaledVector(right, -1);
        if (k.has("keyd") || k.has("arrowright")) mv.add(right);
        if (mode === "free") {
          if (k.has("keye") || k.has("space")) mv.y += 1;
          if (k.has("keyq") || k.has("controlleft")) mv.y -= 1;
        }
        if (mv.lengthSq() > 0) {
          mv.normalize().multiplyScalar(speed * dt);
          c.position.add(mv);
        }
        // look-around: orbit about a point right in front of the eye
        c.getWorldDirection(fwd);
        const L = mode === "surface" ? 0.5 : Math.max(1e-3, tele.speedScale * 0.002);
        ct.target.copy(c.position).addScaledVector(fwd, L);
      }
      ct.update();
    }

    // world constraints
    const sc = st.scene;
    if (sc === "site") {
      const g = heightAt(c.position.x, c.position.z);
      const eye = st.camMode === "surface" && !cam.flight ? 1.7 : 0.7;
      if (st.camMode === "surface" && !cam.flight) c.position.y += (g + eye - c.position.y) * Math.min(1, dt * 8);
      else if (c.position.y < g + eye) c.position.y = g + eye;
    } else if (sc === "planet") {
      const l = c.position.length();
      if (l < GLOBE_R * 1.004) c.position.multiplyScalar((GLOBE_R * 1.004) / l);
    }
    tele.cam = [c.position.x, c.position.y, c.position.z];
    c.getWorldDirection(fwd);
    tele.heading = (Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI;
    if (tele.heading < 0) tele.heading += 360;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.55}
      zoomSpeed={0.9}
      minDistance={0.0005}
      maxDistance={1e7}
      screenSpacePanning
    />
  );
}
