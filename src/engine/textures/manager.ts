import * as THREE from "three";
import { createResidencyManager, type ResidencyManager } from "./residency";

/**
 * Shared texture residency bound to THREE.TextureLoader.
 * Budget 96 MiB ≈ two 4K RGBA mipmap chains resident; LRU evicts the rest.
 * Bundled global maps stay on useTexture (always resident = guaranteed fallback).
 */
const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

export const globeResidency: ResidencyManager<THREE.Texture> = createResidencyManager<THREE.Texture>({
  load: (url) =>
    new Promise((resolve, reject) => {
      loader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          const w = (t.image as { width?: number } | undefined)?.width ?? 0;
          const h = (t.image as { height?: number } | undefined)?.height ?? 0;
          resolve({ texture: t, bytes: w > 0 && h > 0 ? w * h * 4 : 4_194_304 });
        },
        undefined,
        () => reject(new Error(`texture load failed: ${url}`))
      );
    }),
  dispose: (t) => t.dispose(),
  maxBytes: 96 * 1024 * 1024,
  now: () => performance.now(),
});

/** Runtime hi-res URLs served from public/tex-hi (loaded on demand, never bundled). */
export const HI_URLS: Record<string, string> = {
  earth: "/tex-hi/earth_4k.jpg",
  moon: "/tex-hi/moon_4k.jpg",
  mars: "/tex-hi/mars_4k.jpg",
  pluto: "/tex-hi/pluto_4k.jpg",
};
