import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEcho } from "@/state/store";
import { presentBodyPos } from "@/engine/frames/frames";
import { clock } from "@/engine/time/clock";
import { screenFraction, selectHiTier, hiResAllowed, type HiTierState } from "@/engine/lod/stages";
import { globeResidency, texStats, type HiTierUrls } from "./manager";

const tmp = new THREE.Vector3();

declare global {
  interface Window {
    __echoesTexStats?: typeof texStats;
  }
}

if (typeof window !== "undefined") window.__echoesTexStats = texStats;

/**
 * Rich-Universe Phase 1 — per-body tiered texture lifecycle for any scene.
 * Every half second the screen fraction drives a hysteresis tier machine:
 *   "none" — the bundled global map (always mounted, never blank).
 *   "hi"   — the KTX2 stream tier near the body; far bodies are never upgraded.
 * No-pop contract: the previous tier (or the bundled map) stays mounted until
 * the new tier's texture returns from the residency manager ready — a swap is
 * a sharpening-in-place, never a flash or a drop to blank.
 */
export function useHiMap(
  bodyId: string,
  radius: number,
  tiers: HiTierUrls | null,
  measure?: (cam: THREE.PerspectiveCamera) => number
): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const st = useRef({ tier: "none" as HiTierState, n: 0, current: null as string | null });

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
    const fraction = screenFraction(radius, dist, fov);
    const allowed = hiResAllowed(useEcho.getState().quality);
    const prevTier = s.tier;
    s.tier = allowed && tiers?.hi ? selectHiTier(prevTier, fraction) : "none";
    const url = s.tier === "hi" ? tiers!.hi! : null;

    if (url) {
      if (s.current !== url) {
        if (s.current) globeResidency.release(s.current);
        globeResidency.acquire(url);
        s.current = url;
      }
      // request() returns a texture only once the tier is fully transcoded
      // (mip-complete). Until then the currently mounted map keeps rendering.
      const got = globeResidency.request(url, 10) as THREE.Texture | null;
      if (got) setTex((prev) => (prev === got ? prev : got));
    } else if (allowed && tiers?.hi && s.tier === "none" && fraction >= 0.01) {
      // Approach band [0.01, TIER_UP): warm the stream now so the tier
      // upgrade arrives already resident, then hold the current texture.
      globeResidency.request(tiers.hi, 1);
    }
  });
  return tex;
}
