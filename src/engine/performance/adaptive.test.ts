import { describe, expect, it } from "vitest";
import { createAdaptive } from "./adaptive";

function feed(a: ReturnType<typeof createAdaptive>, ms: number, n: number) {
  let p = 0;
  for (let i = 0; i < n; i++) p = a.sample(ms);
  return p;
}

describe("adaptive stepper", () => {
  it("holds steady inside the budget", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 12, 300);
    expect(a.evaluate("high", "high", true)).toEqual({ verdict: "hold", next: "high" });
  });

  it("steps down after sustained bad frames, one tier at a time", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 33, 200);
    const r = a.evaluate("high", "ultra", true);
    expect(r).toEqual({ verdict: "downgrade", next: "medium" });
    // cooldown: immediate re-evaluation holds even if still slow
    feed(a, 33, 10);
    expect(a.evaluate("medium", "ultra", true).verdict).toBe("hold");
  });

  it("never steps below low", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 50, 500);
    let tier = "low" as const;
    for (let i = 0; i < 5; i++) tier = a.evaluate(tier, "ultra", true).next as typeof tier;
    expect(tier).toBe("low");
  });

  it("recovers toward the ceiling, never above it", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 5, 1300);
    const r = a.evaluate("low", "medium", true);
    expect(r).toEqual({ verdict: "upgrade", next: "medium" });
    // at ceiling already: hold, not ultra
    feed(a, 5, 1300);
    expect(a.evaluate("medium", "medium", true).verdict).toBe("hold");
  });

  it("a single spike never triggers a change", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 12, 119);
    feed(a, 120, 1); // one terrible frame in the window
    expect(a.evaluate("high", "ultra", true).verdict).toBe("hold");
  });

  it("does nothing when auto is off", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 60, 500);
    expect(a.evaluate("ultra", "ultra", false)).toEqual({ verdict: "hold", next: "ultra" });
  });

  it("p95 reflects the window, not the average", () => {
    const a = createAdaptive({ now: () => 0 });
    feed(a, 8, 110);
    const p = feed(a, 40, 10); // 10 slow frames of 120
    expect(p).toBeGreaterThan(8);
    expect(p).toBeLessThanOrEqual(40);
  });
});
