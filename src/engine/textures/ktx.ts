import type { WebGLRenderer, CompressedTexture } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

/**
 * Rich-Universe Phase 1 — KTX2/Basis Universal streaming textures.
 * The transcoder wasm is served from public/vendors/basis/, so the single-file
 * bundle stays text-only. The loader needs the WebGLRenderer to detect the
 * device's supported compressed formats — initKtx() wires it from onCreated.
 */

let loader: KTX2Loader | null = null;
let renderer: WebGLRenderer | null = null;

export function initKtx(r: WebGLRenderer) {
  renderer = r;
}

export function getKtxLoader(): KTX2Loader {
  if (!loader) {
    if (!renderer) throw new Error("ktx loader used before initKtx(renderer)");
    loader = new KTX2Loader().setTranscoderPath("/vendors/basis/").detectSupport(renderer);
  }
  return loader;
}

/**
 * GPU memory estimate for a transcoded compressed texture. ETC1S/Basis on-disk
 * bytes ≈ GPU bytes (the compression IS the GPU format), so byte-length maths
 * drives the residency budget instead of a 4×RGBA expansion.
 */
export function estimateCompressedBytes(t: CompressedTexture): number {
  let total = 0;
  for (const m of t.mipmaps) total += (m.data as Uint8Array).byteLength;
  if (total === 0) {
    const img = t.image as { width?: number; height?: number } | undefined;
    const w = (img?.width || (t.source.data as { width?: number }).width || 4096) as number;
    const h = (img?.height || (t.source.data as { height?: number }).height || 2048) as number;
    total = w * h; // ETC1S ≈ 1 byte/px incl. mips; never zero
  }
  return total;
}
