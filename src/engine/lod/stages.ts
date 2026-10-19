import type { Quality } from "@/state/store";

/**
 * Phase 4 — scale-aware stages for solar-scene bodies.
 * D (regional) and E (mission site) are owned by the planet / site scenes;
 * this module governs the A→C texture ladder inside the Solar System view.
 *
 *   A — few pixels: bundled global texture only, never hi-res.
 *   B — growing disk: bundled global, hi-res may prefetch.
 *   C — fills a large screen fraction: hi-res active when the tier allows.
 *
 * Hysteresis: upgrade and downgrade thresholds differ so a body hovering at a
 * boundary cannot flap between representations every evaluation.
 */

export type DetailStage = "A" | "B" | "C";

const UP = { B: 0.01, C: 0.12 } as const; // upgrade when fraction exceeds…
const DOWN = { B: 0.006, C: 0.07 } as const; // …downgrade only when it falls below

/** Fraction of screen height covered by a sphere: (r/d) / tan(fov/2). */
export function screenFraction(radius: number, dist: number, fovDeg: number): number {
  if (!(dist > 0) || !(radius > 0)) return 0;
  return radius / dist / Math.tan(((fovDeg / 2) * Math.PI) / 180);
}

export function selectStage(prev: DetailStage, fraction: number): DetailStage {
  if (prev === "A") {
    if (fraction >= UP.C) return "C";
    if (fraction >= UP.B) return "B";
    return "A";
  }
  if (prev === "B") {
    if (fraction >= UP.C) return "C";
    if (fraction < DOWN.B) return "A";
    return "B";
  }
  // prev === "C"
  if (fraction < DOWN.B) return "A";
  if (fraction < DOWN.C) return "B";
  return "C";
}

/** Hi-res textures are a high/ultra privilege; lower tiers keep the global map. */
export function hiResAllowed(quality: Quality): boolean {
  return quality === "high" || quality === "ultra";
}

/** Should the body actively hold its hi-res texture right now? */
export function wantHiRes(stage: DetailStage, quality: Quality, hiAvailable: boolean): boolean {
  return hiAvailable && stage === "C" && hiResAllowed(quality);
}

/** May the manager fetch ahead? Only while approaching (B) on capable tiers. */
export function prefetchHiRes(stage: DetailStage, quality: Quality, hiAvailable: boolean): boolean {
  return hiAvailable && stage === "B" && hiResAllowed(quality);
}

/**
 * Rich-Universe Phase 1 — tier state machine above the A/B/C stages.
 * "hi" = the KTX2 hi tier is mounted (near bodies); "none" = bundled map only
 * (far bodies, which is exactly the "far at 1080, near at 4K/8K" contract).
 * Hysteresis bounds differ so a body hovering at the boundary cannot flap.
 */
export type HiTierState = "none" | "hi";

const TIER_UP = 0.12; // upgrade once the disc covers ≥ % of screen height
const TIER_DOWN = 0.07; // downgrade only when it falls below

export function selectHiTier(prev: HiTierState, fraction: number): HiTierState {
  if (prev === "none") return fraction >= TIER_UP ? "hi" : "none";
  return fraction < TIER_DOWN ? "none" : "hi";
}
