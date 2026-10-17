import { describe, expect, it } from "vitest";
import { buildTile, mergeTileGeos, V_POLY, V_SKIRT } from "./Terrain";
import { terrainState } from "./height";

terrainState.world = "moon";
terrainState.seed = 42;

describe("mergeTileGeos", () => {
  it("concatenates tiles into one world-space geometry (one draw call)", () => {
    const a = buildTile("moon", 0, 0, 128, "t/a");
    const b = buildTile("moon", 128, 0, 128, "t/b");
    const merged = mergeTileGeos([a, b]);
    const vps = V_POLY + V_SKIRT;
    expect(merged.attributes.position.count).toBe(vps * 2);
    expect(merged.attributes.normal.count).toBe(vps * 2);
    expect(merged.attributes.color.count).toBe(vps * 2);
    expect(merged.attributes.uv.count).toBe(vps * 2);
    expect(merged.index!.count).toBe(a.geo.index!.count + b.geo.index!.count);
    // First vertex of tile A translated from tile-local x by the tile origin:
    expect(merged.attributes.position.array[0]).toBeCloseTo(a.geo.attributes.position.array[0] + a.cx);
    expect(merged.attributes.position.array[2]).toBeCloseTo(a.geo.attributes.position.array[2] + a.cz);
    // Index offset continuity: tile B's indices are bumped by tile A's vertex count
    const ia = a.geo.index!.array as ArrayLike<number>;
    const im = merged.index!.array as ArrayLike<number>;
    expect(im[a.geo.index!.count]).toBe(ia[0] + vps);
  });

  it("edges of adjacent tiles meet exactly in merged world space", () => {
    const a = buildTile("moon", 0, 0, 128, "t/c");
    const b = buildTile("moon", 128, 0, 128, "t/d");
    const merged = mergeTileGeos([a, b]);
    const p = merged.attributes.position.array as ArrayLike<number>;
    // tile A right-edge mid vertex (i = N, j = N/2) world x == tile B left-edge mid world x
    const N = 32;
    const vps = V_POLY + V_SKIRT;
    const vA = (Math.floor(N / 2) * (N + 1) + N) * 3;
    const vB = (Math.floor(N / 2) * (N + 1) + 0) * 3 + vps * 3;
    expect(p[vA]).toBeCloseTo(128);
    expect(p[vB]).toBeCloseTo(128);
    expect(p[vA + 1]).toBeCloseTo(p[vB + 1]);
    expect(p[vA + 2]).toBeCloseTo(p[vB + 2]);
  });

  it("empty input yields an empty geometry", () => {
    const merged = mergeTileGeos([]);
    expect(merged.attributes.position.count).toBe(0);
    expect(merged.index!.count).toBe(0);
  });
});
