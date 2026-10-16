import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEcho } from "@/state/store";
import { presentBodyPos } from "@/engine/frames/frames";
import { clock } from "@/engine/time/clock";
import { screenFraction, selectStage, wantHiRes, prefetchHiRes, type DetailStage } from "@/engine/lod/stages";
import { globeResidency } from "./manager";

const tmp = new THREE.Vector3();

/**
 * Per-body hi-res texture lifecycle for the solar view.
 * Evaluates ~2×/s: stage A/B/C via hysteresis → acquire/request at C,
 * prefetch at B, release below. The bundled global map (passed to Globe as
 * the base) stays mounted the whole time, so a body is never left blank.
 */
export function useHiMap(
  bodyId: string,
  radius: number,
  hiUrl: string | null,
  measure?: (cam: THREE.PerspectiveCamera) => number
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const st = useRef({ stage: "A" as DetailStage, n: 0, current: null as string | null });
  const quality = useEcho((s) => s.quality);

  useEffect(
    () => () => {
      if (st.current.current) {
        globeResidency.release(st.current.current);
        st.current.current = null;
      }
    },
    []
  );

  useFrame(({ camera }) => {
    const s = st.current;
    s.n++;
    if (s.n % 30 !== 0) return;
    // Frozen tab: never start GPU uploads the user can't see yet.
    if (typeof document !== "undefined" && document.hidden) return;
    const cam = camera as THREE.PerspectiveCamera;
    const fov = cam.fov ?? 50;
    const dist = measure ? measure(cam) : cam.position.distanceTo(presentBodyPos(bodyId, clock.t, tmp));
    s.stage = selectStage(s.stage, screenFraction(radius, dist, fov));
    const q = useEcho.getState().quality;
    void quality;
    const want = hiUrl && wantHiRes(s.stage, q, true) ? hiUrl : null;
    if (want) {
      if (s.current !== want) {
        if (s.current) globeResidency.release(s.current);
        globeResidency.acquire(want);
        s.current = want;
      }
      const got = globeResidency.request(want, 10) as THREE.Texture | null;
      if (got) setTex((prev) => (prev === got ? prev : got));
    } else {
      if (s.current) {
        globeResidency.release(s.current);
        s.current = null;
      }
      setTex((prev) => (prev === null ? prev : null));
      if (hiUrl && prefetchHiRes(s.stage, q, true)) globeResidency.request(hiUrl, 1);
    }
  });
  return tex;
}
