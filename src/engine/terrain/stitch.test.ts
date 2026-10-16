import { describe, expect, it } from "vitest";
import { buildTile, edgeSnapBits } from "./Terrain";
import { terrainState } from "./height";

const RX = 0;
const RZ = 0;
const ROOT = 4096;

function drawn(cells: [number, number, number][]): Set<string> {
  return new Set(cells.map(([d, x, z]) => `${d}/${x}/${z}`));
}

describe("edgeSnapBits", () => {
  it("no snap in a uniform-depth neighborhood", () => {
    const s = drawn([[1, 0, 0], [1, 2048, 0], [1, 0, 2048], [1, 2048, 2048], [0, 0, 0]]);
    // interior shared edges: tile (1/0/0) right edge meets (1/2048/0) fully
    expect(edgeSnapBits(s, RX, RZ, ROOT, 0, 0, 2048, 1) & 2).toBe(0);
    expect(edgeSnapBits(s, RX, RZ, ROOT, 2048, 2048, 2048, 1)).toBe(0);
  });

  it("snaps toward a coarser neighbor", () => {
    // tile (1/0/0), only the root covers above → top edge snaps
    const s = drawn([[1, 0, 0], [0, 0, 0]]);
    const bits = edgeSnapBits(s, RX, RZ, ROOT, 0, 0, 2048, 1);
    expect(bits & 1).toBe(1);
  });

  it("does not snap toward finer neighbors (they snap to us)", () => {
    const s = drawn([[1, 0, 0], [2, 0, -1024], [2, 1024, -1024], [0, 0, 0]]);
    expect(edgeSnapBits(s, RX, RZ, ROOT, 0, 0, 2048, 1) & 1).toBe(0);
  });

  it("never snaps outside the world rect", () => {
    const s = drawn([[0, 0, 0]]);
    expect(edgeSnapBits(s, RX, RZ, ROOT, 0, 0, 4096, 0)).toBe(0);
  });
});

describe("buildTile snapping", () => {
  it("odd edge vertices sit exactly on the corner-to-corner segment", () => {
    terrainState.world = "mars";
    terrainState.seed = 7;
    const t = buildTile("mars", 0, 2048, 1024, "t", [true, false, false, false]);
    const pos = t.geo.getAttribute("position");
    // top edge (j=0): vertex (i,0) at index i
    const h = (i: number) => pos.getY(i);
    for (let k = 1; k < 32; k += 2) {
      // float32 vertex storage: exact to ~0.1 micron, far below visible
      expect(h(k)).toBeCloseTo((h(k - 1) + h(k + 1)) / 2, 6);
    }
    expect(t.bits & 1).toBe(1);
  });

  it("same-depth neighbors share exact edge heights (no snap needed)", () => {
    terrainState.world = "mars";
    terrainState.seed = 7;
    const a = buildTile("mars", 0, 0, 1024, "a");
    const b = buildTile("mars", 1024, 0, 1024, "b");
    const pa = a.geo.getAttribute("position");
    const pb = b.geo.getAttribute("position");
    // a right edge (i=32) vs b left edge (i=0), same world x
    for (let j = 0; j <= 32; j++) {
      const ia = j * 33 + 32;
      const ib = j * 33 + 0;
      expect(pa.getX(ia) + a.cx).toBeCloseTo(pb.getX(ib) + b.cx, 9);
      expect(pa.getY(ia)).toBeCloseTo(pb.getY(ib), 9);
      expect(pa.getZ(ia) + a.cz).toBeCloseTo(pb.getZ(ib) + b.cz, 9);
    }
  });

  it("snapped child edge is watertight against the coarse parent edge", () => {
    terrainState.world = "mars";
    terrainState.seed = 7;
    // Parent covers x∈[0,2048], bottom edge at z=2048. Child covers
    // x∈[0,1024] with its top edge on the same line, snapped.
    const parent = buildTile("mars", 0, 0, 2048, "p");
    const childTop = buildTile("mars", 0, 2048, 1024, "c2", [true, false, false, false]);
    const pp = parent.geo.getAttribute("position");
    const cp = childTop.geo.getAttribute("position");
    // parent bottom edge (j=32): world x = i*64, y at index 32*33+i
    // child top edge (j=0): world x = j*32, y at index j
    const edgeP = (x: number) => {
      const f = x / 64;
      const i0 = Math.floor(f);
      const fr = f - i0;
      const y0 = pp.getY(32 * 33 + i0);
      const y1 = pp.getY(32 * 33 + i0 + 1);
      return y0 + (y1 - y0) * fr;
    };
    const edgeC = (x: number) => {
      const f = x / 32;
      const i0 = Math.floor(f);
      const fr = f - i0;
      return cp.getY(i0) + (cp.getY(i0 + 1) - cp.getY(i0)) * fr;
    };
    let worst = 0;
    for (let x = 0; x <= 1024; x += 16) worst = Math.max(worst, Math.abs(edgeP(x) - edgeC(x)));
    // float32 storage: watertight to ~0.1 micron
    expect(worst).toBeLessThan(1e-6);
  });
});
