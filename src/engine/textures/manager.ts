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
          // 4× anisotropy: 8× costs significant iGPU fill-rate at close zoom
          // for imperceptible sharpness gain over 4× on these maps.
          t.anisotropy = 4;
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

/** Runtime hi-res URLs served from public/tex-hi.
 *
 * DISABLED per spec §2: no 4K globe upgrades in the normal 1080p experience.
 * The bundled 2K maps (src/assets/tex/) remain the delivery default.
 * Kept as an empty record so importers don't break; re-enable only when a
 * verified streaming pipeline with measured GPU budget lands.
 */
export const HI_URLS: Record<string, string> = {};
