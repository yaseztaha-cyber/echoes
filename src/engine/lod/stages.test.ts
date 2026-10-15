import { describe, expect, it } from "vitest";
import { screenFraction, selectStage, wantHiRes, prefetchHiRes, hiResAllowed } from "./stages";

describe("screen fraction", () => {
  it("grows as the camera closes in", () => {
    const near = screenFraction(0.6, 5, 50);
    const far = screenFraction(0.6, 100, 50);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });
  it("rejects degenerate inputs", () => {
    expect(screenFraction(0, 10, 50)).toBe(0);
    expect(screenFraction(1, 0, 50)).toBe(0);
    expect(screenFraction(1, -5, 50)).toBe(0);
  });
});

describe("stage selection with hysteresis", () => {
  it("climbs A→B→C on approach", () => {
    expect(selectStage("A", 0.001)).toBe("A");
    expect(selectStage("A", 0.05)).toBe("B");
    expect(selectStage("B", 0.5)).toBe("C");
  });
  it("does not flap at the boundary", () => {
    // 0.02 upgrades A→B, but B holds until below 0.012
    expect(selectStage("A", 0.02)).toBe("B");
    expect(selectStage("B", 0.015)).toBe("B");
    expect(selectStage("B", 0.011)).toBe("A");
    // 0.22 upgrades B→C, but C holds until below 0.13
    expect(selectStage("B", 0.22)).toBe("C");
    expect(selectStage("C", 0.15)).toBe("C");
    expect(selectStage("C", 0.12)).toBe("B");
  });
  it("a lost target falls straight back", () => {
    expect(selectStage("C", 0.001)).toBe("A");
  });
});

describe("hi-res gating", () => {
  it("hi-res is a high/ultra privilege at stage C only", () => {
    expect(hiResAllowed("ultra")).toBe(true);
    expect(hiResAllowed("high")).toBe(true);
    expect(hiResAllowed("medium")).toBe(false);
    expect(hiResAllowed("low")).toBe(false);
    expect(wantHiRes("C", "high", true)).toBe(true);
    expect(wantHiRes("C", "medium", true)).toBe(false);
    expect(wantHiRes("B", "ultra", true)).toBe(false);
    expect(wantHiRes("C", "ultra", false)).toBe(false);
  });
  it("prefetch happens only while approaching on capable tiers", () => {
    expect(prefetchHiRes("B", "high", true)).toBe(true);
    expect(prefetchHiRes("B", "medium", true)).toBe(false);
    expect(prefetchHiRes("C", "high", true)).toBe(false);
    expect(prefetchHiRes("A", "ultra", true)).toBe(false);
  });
});
