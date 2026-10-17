/**
 * Dynamic render resolution (quality-layer accessor per spec §5). Pure decision
 * logic with injected time, so hysteresis and floors are unit-testable.
 *
 * Rationale (measured, in-browser, Intel HD 530-class / Radeon R7 M370-class):
 * the site scene is texture-bandwidth-bound with a super-linear pixel curve
 * (pixelRatio 1.0 → 0.4 took frame p95 from 483 ms to 34 ms at constant scene
 * state — 5.3x fewer pixels, 14x fewer milliseconds). Scaled backing store
 * keeps shared-memory pages hot; visibility is untouched.
 *
 * Integration: the render loop feeds the rolling frame-time p95 (same stat the
 * quality stepper consumes); this module only ever answers a scale factor in
 * [FLOOR, 1]. Recovery is deliberately slower than degradation.
 */

export const DR_FLOOR = 0.45;
export const DR_DOWN_P95_MS = 24;
export const DR_UP_P95_MS = 14;
export const DR_DOWN_STEP = 0.1;
export const DR_UP_STEP = 0.06;
export const DR_DOWN_HOLD_S = 1.2;
export const DR_UP_AFTER_S = 4;
export const DR_UP_HOLD_S = 1.0;

export function createDynamicRes() {
  let scale = 1;
  let badTime = 0;
  let goodTime = 0;
  let sinceStep = 0;

  /** Feed the current frame-time p95 and dt (seconds). Returns the new scale. */
  function feed(p95Ms: number, dt: number): number {
    sinceStep += dt;
    if (p95Ms >= DR_DOWN_P95_MS) {
      goodTime = 0;
      badTime += dt;
      if (badTime >= DR_DOWN_HOLD_S && sinceStep >= DR_DOWN_HOLD_S && scale > DR_FLOOR) {
        scale = Math.max(DR_FLOOR, Math.round((scale - DR_DOWN_STEP) * 100) / 100);
        badTime = 0;
        goodTime = 0;
        sinceStep = 0;
      }
    } else if (p95Ms > 0 && p95Ms <= DR_UP_P95_MS) {
      badTime = 0;
      goodTime += dt;
      if (goodTime >= DR_UP_AFTER_S && sinceStep >= DR_UP_HOLD_S && scale < 1) {
        scale = Math.min(1, Math.round((scale + DR_UP_STEP) * 100) / 100);
        goodTime = DR_UP_AFTER_S; // keep the signal armed for continued recovery
        sinceStep = 0;
      }
    } else if (p95Ms > DR_UP_P95_MS) {
      goodTime = 0;
    }
    return scale;
  }

  /** Quality tier switches reset the backing-store scale (R3F re-inits dpr). */
  function reset() {
    scale = 1;
    badTime = 0;
    goodTime = 0;
    sinceStep = DR_DOWN_HOLD_S;
  }

  return { feed, reset, get scale() { return scale; } };
}
