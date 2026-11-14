import * as THREE from "three";
import { assetUrl } from "@/lib/asset";
import { createResidencyManager, type ResidencyManager } from "./residency";
import { getKtxLoader, estimateCompressedBytes } from "./ktx";
import { HI_TIER_MANIFEST, SKY_BAND_MANIFEST } from "@/data/assets/manifest";

/**
 * Shared texture residency. Budget 96 MiB; with KTX2/Basis textures the bytes
 * ARE the GPU footprint (≈1 B/pp for ETC1S), so the same cap now holds an 8K
 * tier (~4-5 MB) plus several 4K tiers with room to spare. Bundled global maps
 * stay on useTexture (always resident = guaranteed fallback).
 */
const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

function prepTexture(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  // 4× anisotropy: 8× costs significant iGPU fill-rate at close zoom
  // for imperceptible sharpness gain over 4× on these maps.
  t.anisotropy = 4;
  // Single-mip compressed encodes (the Milky Way panorama ships one mip on
  // purpose) are an incomplete texture under a mipmap minFilter — WebGL then
  // samples constant black. Clamp the filter mode when there is no mip chain.
  if ((t as THREE.CompressedTexture).isCompressedTexture === true) {
    const mips = (t as THREE.CompressedTexture).mipmaps.length;
    if (mips <= 1) {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    }
  }
  return t;
}

function texBytes(t: THREE.Texture): number {
  const img = t.image as { width?: number; height?: number } | undefined;
  const w = img?.width ?? 0;
  const h = img?.height ?? 0;
  return w > 0 && h > 0 ? w * h * 4 : 4_194_304;
}

export const globeResidency: ResidencyManager<THREE.Texture> = createResidencyManager<THREE.Texture>({
  load: (rawUrl) => {
    // resolve against the deployment base (root or sub-path hosting)
    const url = assetUrl(rawUrl);
    return url.endsWith(".ktx2")
      ? getKtxLoader()
          .loadAsync(url)
          .then((t) => {
            prepTexture(t);
            const bytes =
              streamedBytes(url) ?? ktxBytesFor(url) ?? estimateCompressedBytes(t as THREE.CompressedTexture);
            return { texture: t, bytes };
          })
      : new Promise((resolve, reject) => {
          loader.load(
            url,
            (t) => resolve({ texture: prepTexture(t), bytes: texBytes(t) }),
            undefined,
            () => reject(new Error(`texture load failed: ${url}`))
          );
        });
  },
  dispose: (t) => t.dispose(),
  maxBytes: 96 * 1024 * 1024,
  now: () => performance.now(),
});

/** On-disk bytes of a streamed texture, from its (own-origin) resource timing. */
function streamedBytes(url: string): number | null {
  const entry = performance.getEntriesByName(url).pop() as PerformanceResourceTiming | undefined;
  const raw = ((entry?.decodedBodySize || entry?.encodedBodySize || 0) as number) || 0;
  return raw > 1000 ? raw : null; // null -> caller falls back to the on-texture estimate
}

/** KTX2 textures should report their real on-disk bytes (manifest is the truth). */
export function ktxBytesFor(url: string): number | null {
  const file = url.split("/").pop() ?? "";
  const known = HI_TIER_MANIFEST.find((m) => m.file === file) ?? SKY_BAND_MANIFEST.find((m) => m.file === file);
  return known ? known.bytes : null;
}

/**
 * Rich-Universe Phase 1 — runtime hi-res TIERS per solar-scene body kind /
 * planet-scene world. Values are .ktx2 stream URLs served from public/tex-hi
 * (never bundled). Provenance + source resolution live in assets-hi/tex/*.json;
 * every delivery is a POT downsample of the native map, never an upsample.
 */
export interface HiTierUrls {
  /** Filling the screen (focused body) — 4K / 8K class. */
  hi?: string;
}

export const HI_TIERS: Record<string, HiTierUrls> = {
  earth: { hi: "/tex-hi/earth.ktx2" },
  moon: { hi: "/tex-hi/moon.ktx2" },
  mars: { hi: "/tex-hi/mars.ktx2" },
};

/** Harness/dev introspection: residency + GPU-byte stats without wiring UI. */
export function texStats() {
  return { ...globeResidency.stats(), entries: globeResidency.describe() };
}
