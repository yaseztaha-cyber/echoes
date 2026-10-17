import { describe, expect, it } from "vitest";
import { createDynamicRes, DR_FLOOR, DR_DOWN_P95_MS, DR_UP_P95_MS, DR_DOWN_HOLD_S } from "@/engine/performance/resolution";

describe("dynamic render resolution", () => {
  it("stairs down to the floor under sustained load and never below it", () => {
    const dr = createDynamicRes();
    const feed = (p95: number) => {
      for (let i = 0; i < 40; i++) dr.feed(p95, 0.1);
    };
    expect(dr.scale).toBe(1);
    feed(DR_DOWN_P95_MS + 4); // 4 s of crisis: 1.2 s hold first, then two stair steps
    expect(dr.scale).toBeLessThan(1);
    expect(dr.scale).toBeGreaterThan(DR_FLOOR);
    while (dr.scale > DR_FLOOR) feed(DR_DOWN_P95_MS + 4);
    expect(dr.scale).toBeCloseTo(DR_FLOOR, 2);
    feed(DR_DOWN_P95_MS + 4);
    expect(dr.scale).toBe(DR_FLOOR);
  });

  it("recovery is slower than degradation and stops at 1", () => {
    const dr = createDynamicRes();
    for (let i = 0; i < 400; i++) dr.feed(DR_DOWN_P95_MS + 4, 0.1);
    const atFloor = dr.scale;
    feedUp: for (let i = 0; i < 600; i++) dr.feed(DR_UP_P95_MS - 2, 0.1);
    expect(dr.scale).toBeGreaterThan(atFloor);
    expect(dr.scale).toBeLessThanOrEqual(1);
    while (dr.scale < 1) dr.feed(DR_UP_P95_MS - 2, 0.1);
    expect(dr.scale).toBe(1);
  });

  it("oscillating borderline p95 changes nothing (hysteresis between bands)", () => {
    const dr = createDynamicRes();
    for (let i = 0; i < 600; i++) dr.feed(DR_UP_P95_MS + 2, 0.1);
    expect(dr.scale).toBe(1);
  });

  it("reset returns to full backing after a tier switch", () => {
    const dr = createDynamicRes();
    const hold = DR_DOWN_HOLD_S + 0.05;
    while (dr.scale > DR_FLOOR) dr.feed(DR_DOWN_P95_MS + 4, hold);
    dr.reset();
    expect(dr.scale).toBe(1);
    expect(dr.feed(DR_DOWN_P95_MS + 4, 0.1)).toBe(1);
  });

  it("short spikes do not shrink the backing store", () => {
    const dr = createDynamicRes();
    for (let i = 0; i < 5; i++) dr.feed(DR_DOWN_P95_MS + 8, 0.2);
    expect(dr.scale).toBe(1);
  });
});
