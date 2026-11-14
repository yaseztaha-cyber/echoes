import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "@/lib/asset";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { globeResidency } from "@/engine/textures/manager";
import { createGalacticSkyGeometry } from "@/engine/world/galactic";
import { useEcho } from "@/state/store";

/**
 * Rich-Universe Phase 2 — Milky Way panorama dome.
 *
 * Real ESO/S. Brunier photograph (CC BY 4.0), galactic equirectangular KTX2
 * streamed from public/tex-hi/milkyway.ktx2 and mounted on the inside of the
 * star sphere, aligned to the catalogue frame by galactic.ts. Fades in over
 * ~2 s once decoded so it never pops against the starfield; low quality tiers
 * never fetch it. Sitting behind the additive stars (renderOrder -11) keeps
 * the photo as the sky's texture while HYG points stay the positional truth.
 */

const BAND_URL = assetUrl("/tex-hi/milkyway.ktx2");
const BAND_OPACITY = 1.0;
const FADE_SECONDS = 2.4;

let pending: Promise<THREE.Texture | null> | null = null;

/**
 * Load through the shared residency manager so the band's bytes join the
 * stream budget (visible in texStats), pinned to stay above LRU eviction.
 * Polls get() until the texture turns ready — the manager returns null while
 * pending. ~14 s timeout then null (mount retries later after a failure).
 */
function loadBand(): Promise<THREE.Texture | null> {
  if (!pending) {
    globeResidency.request(BAND_URL, 90); // kicks the tracked load
    globeResidency.pin(BAND_URL); // pin the live entry above LRU eviction
    pending = (async () => {
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 120));
        const t = globeResidency.get(BAND_URL);
        if (t) return t as THREE.Texture;
      }
      return null;
    })();
    pending.then((t) => {
      if (!t) pending = null;
    });
  }
  return pending;
}

export function MilkyWay({ radius, dim = 1 }: { radius: number; dim?: number }) {
  const quality = useEcho((s) => s.quality);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const fade = useRef(0);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (quality === "low") return;
    let alive = true;
    void loadBand().then((t) => {
      if (alive && t) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, [quality]);

  const geo = useMemo(() => createGalacticSkyGeometry(), []);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    fade.current = Math.min(1, fade.current + dt / FADE_SECONDS);
    matRef.current.opacity = fade.current * BAND_OPACITY * dim;
  });

  if (!tex) return null;
  return (
    <mesh geometry={geo} scale={radius * 0.998} renderOrder={-11} frustumCulled={false}>
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        color="#ffffff"
        side={THREE.BackSide}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
