import type { Quality } from "@/state/store";

/**
 * Phase 4 — adaptive performance core. Pure decision logic with an injected
 * clock, so hysteresis and cooldowns are unit-testable. The render loop feeds
 * real frame times; this module only ever answers downgrade / upgrade / hold.
 *
 * Degradation order is expressed by stepping the existing quality tiers
 * (ultra→high→medium→low): each tier already lowers DPR, shadows, terrain
 * depth and hi-res eligibility together. Visibility (bodies, markers, travel)
 * is identical across tiers by construction — the stepper can never take it.
 */

export const TIERS: Quality[] = ["ultra", "high", "medium", "low"];

const BAD_MS = 20; // sustained p95 above this: step down
const GOOD_MS = 9; // sustained p95 below this: may step up
const BAD_FRAMES = 180; // ~3 s at 60 fps before reacting
const GOOD_FRAMES = 1200; // ~20 s of headroom before restoring
const COOLDOWN_FRAMES = 300; // ~5 s quiet after any change
const WINDOW = 120; // rolling p95 window (frames)

export type Verdict = "downgrade" | "upgrade" | "hold";

export function createAdaptive(opts: { now: () => number }) {
  const frameMs: number[] = [];
  let badStreak = 0;
  let goodStreak = 0;
  let cooldown = 0;
  void opts;

  const p95 = (): number => {
    if (frameMs.length === 0) return 0;
    const s = [...frameMs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  };

  /** Feed one frame. Updates streaks from the rolling p95. Returns p95. */
  function sample(dtMs: number): number {
    frameMs.push(dtMs);
    if (frameMs.length > WINDOW) frameMs.shift();
    const p = p95();
    if (p >= BAD_MS) {
      badStreak++;
      goodStreak = 0;
    } else if (p > 0) {
      // Inside the budget band (GOOD_MS..BAD_MS): neither crisis nor surplus.
      // Only genuine headroom counts toward restoration.
      if (p <= GOOD_MS) {
        goodStreak++;
        badStreak = 0;
      } else {
        badStreak = 0;
        goodStreak = 0;
      }
    }
    return p;
  }

  /**
   * Evaluate once per frame. `ceiling` is the user's manual tier — auto may
   * degrade below it and recover up to it, never above it.
   */
  function evaluate(tier: Quality, ceiling: Quality, auto: boolean): { verdict: Verdict; next: Quality } {
    if (!auto) return { verdict: "hold", next: tier };
    if (cooldown > 0) {
      cooldown--;
      return { verdict: "hold", next: tier };
    }
    const i = TIERS.indexOf(tier);
    const cap = TIERS.indexOf(ceiling);
    if (badStreak >= BAD_FRAMES && i < TIERS.length - 1) {
      badStreak = 0;
      goodStreak = 0;
      cooldown = COOLDOWN_FRAMES;
      return { verdict: "downgrade", next: TIERS[i + 1] };
    }
    // recover toward (never above) the user's chosen ceiling
    if (goodStreak >= GOOD_FRAMES && i > cap) {
      badStreak = 0;
      goodStreak = 0;
      cooldown = COOLDOWN_FRAMES;
      return { verdict: "upgrade", next: TIERS[i - 1] };
    }
    return { verdict: "hold", next: tier };
  }

  return { sample, evaluate, p95 };
}

export type Adaptive = ReturnType<typeof createAdaptive>;

/** Shared stepper fed by the render loop (World → Perf). Pure logic, one instance. */
export const adaptive = createAdaptive({ now: () => performance.now() });
