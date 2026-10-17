import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { fbm, heightAt, slopeAt, terrainState, type TerrainWorld } from "./height";
import { useEcho } from "@/state/store";
import { tele } from "@/engine/telemetry";

/**
 * Planetary tile engine (site level): a view-dependent quadtree. Tiles are generated on demand
 * under a per-frame time budget, cached, evicted by recency, and parents stand in for children
 * that have not finished streaming — so the surface refines continuously instead of popping.
 */
const N = 32;
interface Tile {
  key: string;
  geo: THREE.BufferGeometry;
  cx: number;
  cz: number;
  used: number;
  /** Edge-snap flags the geometry was built with ([top, right, bottom, left]). */
  bits: number;
}
interface Req {
  key: string;
  x0: number;
  z0: number;
  size: number;
  depth: number;
  d: number;
  bits: number;
}

const cache = new Map<string, Tile>();
// Cached edge-snap bits per tile key. Bits only change when a tile's neighbor
// layout in `depths` changes, so we compute them once per tile and reuse.
// Invalidated on clearCache and on LRU eviction.
const bitsCache = new Map<string, number>();
let frameNo = 0;

// Growable scratch pools for the merged tile mesh: typed arrays are reused
// across rebuilds so streaming never churns tens of MB of garbage per frame.
const pool = {
  pos: new Float32Array(0),
  nor: new Float32Array(0),
  col: new Float32Array(0),
  uv: new Float32Array(0),
  idx: new Uint32Array(0),
};
const poolF32 = (a: Float32Array<ArrayBuffer>, n: number): Float32Array<ArrayBuffer> =>
  a.length >= n ? a : new Float32Array(Math.ceil(n * 1.3));
const poolU32 = (a: Uint32Array<ArrayBuffer>, n: number): Uint32Array<ArrayBuffer> =>
  a.length >= n ? a : new Uint32Array(Math.ceil(n * 1.3));

function clearCache() {
  cache.forEach((t) => t.geo.dispose());
  cache.clear();
  bitsCache.clear();
}

const lin = (v: number) => Math.pow(v, 2.2);

export const V_POLY = (N + 1) * (N + 1);
export const V_SKIRT = 4 * (N + 1);

/**
 * Merge drawn tiles into ONE geometry (one draw call). Tile-local vertices are
 * shifted by the tile origin so the merged mesh sits in world space; the
 * scratch pools are reused so streaming doesn't allocate per rebuild.
 * Exported for headless tests.
 */
export function mergeTileGeos(tiles: Tile[]): THREE.BufferGeometry {
  const vps = V_POLY + V_SKIRT;
  const vc = tiles.length * vps;
  const pos = (pool.pos = poolF32(pool.pos, vc * 3));
  const nor = (pool.nor = poolF32(pool.nor, vc * 3));
  const col = (pool.col = poolF32(pool.col, vc * 3));
  const uv = (pool.uv = poolF32(pool.uv, vc * 2));
  let iCount = 0;
  for (const t of tiles) iCount += t.geo.index ? t.geo.index.count : 0;
  const idx = (pool.idx = poolU32(pool.idx, iCount));
  let vo = 0;
  let io = 0;
  for (const t of tiles) {
    const g = t.geo;
    const gp = g.attributes.position.array as Float32Array;
    const gn = g.attributes.normal.array as Float32Array;
    const gc = g.attributes.color.array as Float32Array;
    const gu = g.attributes.uv.array as Float32Array;
    pos.set(gp, vo * 3);
    nor.set(gn, vo * 3);
    col.set(gc, vo * 3);
    uv.set(gu, vo * 2);
    for (let i = 0; i < vps; i++) {
      const p = (vo + i) * 3;
      pos[p] += t.cx;
      pos[p + 2] += t.cz;
    }
    const gi = g.index!;
    const ga = gi.array as ArrayLike<number>;
    for (let i = 0; i < gi.count; i++) idx[io + i] = ga[i] + vo;
    io += gi.count;
    vo += vps;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, vc * 3), 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor.subarray(0, vc * 3), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col.subarray(0, vc * 3), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv.subarray(0, vc * 2), 2));
  geo.setIndex(new THREE.BufferAttribute(idx.subarray(0, iCount), 1));
  return geo;
}

/**
 * Stitching is only worth rebuild churn where cracks are visible: near tiles.
 * Far tiles build once, unsnapped (subpixel cracks), and never refresh —
 * this is what keeps the streamer quiet during fast flights.
 */
export function shouldStitch(dist: number, size: number): boolean {
  return dist < size * 8;
}

/**
 * Edge-stitching resolution (pure, headless-testable). Given the set of drawn
 * cell keys (`depth/x0/z0`) plus the world rect, returns the snap bitmask for
 * a tile: an edge snaps when its neighbor across that edge is drawn coarser.
 * Edges: 0 top (z0 side), 1 right, 2 bottom, 3 left. Bit e set = snap edge e.
 */
export function edgeSnapBits(
  drawn: { has(key: string): boolean },
  rx: number,
  rz: number,
  rootSize: number,
  x0: number,
  z0: number,
  size: number,
  depth: number
): number {
  const hasCell = (d: number, cx: number, cz: number) => drawn.has(`${d}/${cx}/${cz}`);
  const ancestorDrawn = (mx: number, mz: number): boolean => {
    for (let dd = depth - 1; dd >= 0; dd--) {
      const S = rootSize / 2 ** dd;
      const ox = rx + Math.floor((mx - rx) / S) * S;
      const oz = rz + Math.floor((mz - rz) / S) * S;
      if (hasCell(dd, ox, oz)) return true;
    }
    return false;
  };
  const needsSnap = (edge: number): boolean => {
    const h = size / 2;
    let mx = 0, mz = 0;
    if (edge === 0) { mx = x0 + h; mz = z0; }
    else if (edge === 1) { mx = x0 + size; mz = z0 + h; }
    else if (edge === 2) { mx = x0 + h; mz = z0 + size; }
    else { mx = x0; mz = z0 + h; }
    if (mx < rx || mx > rx + rootSize || mz < rz || mz > rz + rootSize) return false;
    // Same-depth neighbor shares the whole edge (grid-aligned subdivision).
    const same: [number, number] =
      edge === 0 ? [x0, z0 - size]
      : edge === 1 ? [x0 + size, z0]
      : edge === 2 ? [x0, z0 + size]
      : [x0 - size, z0];
    if (hasCell(depth, same[0], same[1])) return false;
    // Finer neighbors (child size h) snap to us instead — one origin per half.
    const fine: [number, number][] =
      edge === 0 ? [[x0, z0 - h], [x0 + h, z0 - h]]
      : edge === 1 ? [[x0 + size, z0], [x0 + size, z0 + h]]
      : edge === 2 ? [[x0, z0 + size], [x0 + h, z0 + size]]
      : [[x0 - size, z0], [x0 - size, z0 + h]];
    if (fine.every(([nx, nz]) => hasCell(depth + 1, nx, nz))) return false;
    return ancestorDrawn(mx, mz);
  };
  let bits = 0;
  for (let e = 0; e < 4; e++) if (needsSnap(e)) bits |= 1 << e;
  return bits;
}

function colorAt(world: TerrainWorld, x: number, z: number, h: number, slope: number, out: number[]) {
  const n1 = fbm(x / 700, z / 700, 3, 5);
  const n2 = fbm(x / 38, z / 38, 3, 11);
  const n3 = fbm(x / 6, z / 6, 2, 21);
  let r: number, g: number, b: number;
  if (world === "mars") {
    const t = n1;
    r = 0.5 + 0.16 * t; g = 0.3 + 0.11 * t; b = 0.19 + 0.08 * t;
    // dark basaltic patches: stronger large-scale variation so regions read
    // as different geology instead of one uniform wash
    const dark = Math.max(0, Math.min(1, (n2 - 0.52) * 3.6)) * 0.6;
    r = r * (1 - dark) + 0.27 * dark; g = g * (1 - dark) + 0.2 * dark; b = b * (1 - dark) + 0.19 * dark;
    const k = 0.9 + 0.2 * n3 - Math.min(0.35, slope * 0.012);
    r *= k; g *= k; b *= k;
  } else {
    const t = 0.34 + 0.16 * n1 + 0.06 * n2;
    const k = (0.92 + 0.16 * n3) * (1 - Math.min(0.3, slope * 0.01)) + Math.min(0.15, slope * 0.004);
    r = t * k; g = t * k * 0.99; b = t * k * 0.96;
  }
  out[0] = lin(r); out[1] = lin(g); out[2] = lin(b);
}

/** Exported for headless stitching tests (geometry only, no renderer needed). */
export function buildTile(world: TerrainWorld, x0: number, z0: number, size: number, key: string, snap: [boolean, boolean, boolean, boolean] = [false, false, false, false]): Tile {
  const step = size / N;
  const M = N + 3;
  const hs = new Float32Array(M * M);
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) hs[j * M + i] = heightAt(x0 + (i - 1) * step, z0 + (j - 1) * step);
  // Edge stitching: where the neighbor across an edge is drawn coarser, snap
  // this tile's odd edge vertices onto the straight corner-to-corner segment.
  // The coarse neighbor's edge IS that segment (its own grid is 2x sparser),
  // so both sides coincide exactly — no crack, no skirt wall showing through.
  // Corners (even indices) are shared grid points and already exact.
  const snapEdge = (edge: number) => {
    if (!snap[edge]) return;
    for (let k = 1; k < N; k += 2) {
      let a = 0, b = 0;
      if (edge === 0) { a = 1 * M + (k - 1 + 1); b = 1 * M + (k + 1 + 1); }
      else if (edge === 2) { a = (N + 1) * M + (k - 1 + 1); b = (N + 1) * M + (k + 1 + 1); }
      else if (edge === 3) { a = (k - 1 + 1) * M + 1; b = (k + 1 + 1) * M + 1; }
      else { a = (k - 1 + 1) * M + (N + 1); b = (k + 1 + 1) * M + (N + 1); }
      const m = edge === 0 ? 1 * M + (k + 1) : edge === 2 ? (N + 1) * M + (k + 1) : edge === 3 ? (k + 1) * M + 1 : (k + 1) * M + (N + 1);
      hs[m] = (hs[a] + hs[b]) / 2;
    }
  };
  snapEdge(0); snapEdge(1); snapEdge(2); snapEdge(3);
  const cx = x0 + size / 2, cz = z0 + size / 2;
  const V = V_POLY;
  const S = V_SKIRT;
  const pos = new Float32Array((V + S) * 3);
  const nor = new Float32Array((V + S) * 3);
  const col = new Float32Array((V + S) * 3);
  const uv = new Float32Array((V + S) * 2);
  const tmp = [0, 0, 0];
  const uvs = world === "mars" ? 6 : 4;
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const idx = j * (N + 1) + i;
      const gi = (j + 1) * M + (i + 1);
      const h = hs[gi];
      const wx = x0 + i * step, wz = z0 + j * step;
      pos[idx * 3] = wx - cx; pos[idx * 3 + 1] = h; pos[idx * 3 + 2] = wz - cz;
      const dx = (hs[gi - 1] - hs[gi + 1]) / (2 * step);
      const dz = (hs[gi - M] - hs[gi + M]) / (2 * step);
      const l = Math.hypot(dx, 1, dz);
      nor[idx * 3] = dx / l; nor[idx * 3 + 1] = 1 / l; nor[idx * 3 + 2] = dz / l;
      const slope = Math.atan(Math.hypot(dx, dz)) * 57.3;
      colorAt(world, wx, wz, h, slope, tmp);
      col[idx * 3] = tmp[0]; col[idx * 3 + 1] = tmp[1]; col[idx * 3 + 2] = tmp[2];
      uv[idx * 2] = wx / uvs; uv[idx * 2 + 1] = wz / uvs;
    }
  }
  // Shallow skirts hide tile-boundary cracks without drawing deep dark walls
  // at grazing angles (previous 0.05 depth read as diagonal banding).
  const skirt = Math.max(0.6, size * 0.015);
  const edge: number[] = [];
  for (let i = 0; i <= N; i++) edge.push(i); // top
  for (let j = 0; j <= N; j++) edge.push(j * (N + 1) + N); // right
  for (let i = N; i >= 0; i--) edge.push(N * (N + 1) + i); // bottom
  for (let j = N; j >= 0; j--) edge.push(j * (N + 1)); // left
  edge.forEach((src, k) => {
    const d = V + k;
    pos[d * 3] = pos[src * 3]; pos[d * 3 + 1] = pos[src * 3 + 1] - skirt; pos[d * 3 + 2] = pos[src * 3 + 2];
    nor[d * 3] = nor[src * 3]; nor[d * 3 + 1] = nor[src * 3 + 1]; nor[d * 3 + 2] = nor[src * 3 + 2];
    col[d * 3] = col[src * 3]; col[d * 3 + 1] = col[src * 3 + 1]; col[d * 3 + 2] = col[src * 3 + 2];
    uv[d * 2] = uv[src * 2]; uv[d * 2 + 1] = uv[src * 2 + 1];
  });
  const idxs: number[] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idxs.push(a, c, b, b, c, d);
    }
  const per = N + 1;
  for (let side = 0; side < 4; side++) {
    for (let k = 0; k < N; k++) {
      const e0 = side * per + k, e1 = e0 + 1;
      const a = edge[e0], b = edge[e1], c = V + e0, d = V + e1;
      idxs.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idxs);
  geo.computeBoundingSphere();
  const bits = (snap[0] ? 1 : 0) | (snap[1] ? 2 : 0) | (snap[2] ? 4 : 0) | (snap[3] ? 8 : 0);
  return { key, geo, cx, cz, used: frameNo, bits };
}

function detailTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const n = fbm(x / 16, y / 16, 4, 3) * 0.6 + fbm(x / 3, y / 3, 2, 8) * 0.4;
      const v = 150 + n * 105;
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

interface Props {
  world: TerrainWorld;
  seed: number;
  rootSize: number;
  center: [number, number];
  maxDepth: number;
}

export function Terrain({ world, seed, rootSize, center, maxDepth }: Props) {
  const { camera } = useThree();
  const merged = useRef<THREE.Mesh>(null);
  const sig = useRef("");
  const stat = useRef("");
  const lastMerge = useRef(0);
  const tex = useMemo(detailTexture, []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, map: tex, side: THREE.DoubleSide }),
    [tex]
  );

  useEffect(() => {
    terrainState.world = world;
    terrainState.seed = seed;
    clearCache();
    sig.current = "";
    lastMerge.current = 0;
    // Synchronous root tile: guaranteed coverage on the first frame while the
    // correct snap variants stream in through the budget loop.
    const rx0 = center[0] - rootSize / 2, rz0 = center[1] - rootSize / 2;
    cache.set(`0/${rx0}/${rz0}`, buildTile(world, rx0, rz0, rootSize, `0/${rx0}/${rz0}`));
    const m = merged.current;
    if (m) {
      const t = cache.get(`0/${rx0}/${rz0}`);
      if (t) {
        const g = mergeTileGeos([t]);
        const old = m.geometry as THREE.BufferGeometry | undefined;
        m.geometry = g;
        if (old) old.dispose();
      }
    }
    return () => clearCache();
    // center/rootSize are constants of the mounted site (same for every render).
  }, [world, seed]);

  useFrame(() => {
    frameNo++;
    const quality = useEcho.getState().quality;
    const depthLimit = maxDepth - (quality === "low" ? 3 : quality === "medium" ? 1 : 0);
    const kSplit = quality === "low" ? 1.4 : 1.9;
    const need: Req[] = [];
    const draw: string[] = [];
    let leaves = 0;
    let ready = 0;
    let deepest = 0;
    const cp = camera.position;
    const rx = center[0] - rootSize / 2, rz = center[1] - rootSize / 2;

    // Pass A — coverage structure only. The split rule is pure camera geometry,
    // so the drawn depth layout is deterministic per frame, independent of cache.
    const depths = new Map<string, { x0: number; z0: number; size: number; depth: number; d: number }>();
    const visitA = (x0: number, z0: number, size: number, depth: number): void => {
      const cx = x0 + size / 2, cz = z0 + size / 2;
      // 3D-aware split metric: altitude counts, so high-altitude views stay
      // coarse (fewer tile boundaries on the horizon) and ground views refine.
      const dist = Math.hypot(cp.x - cx, cp.y * 0.85, cp.z - cz);
      if (depth < depthLimit && dist < size * kSplit) {
        const h = size / 2;
        visitA(x0, z0, h, depth + 1);
        visitA(x0 + h, z0, h, depth + 1);
        visitA(x0, z0 + h, h, depth + 1);
        visitA(x0 + h, z0 + h, h, depth + 1);
        return;
      }
      leaves++;
      depths.set(`${depth}/${x0}/${z0}`, { x0, z0, size, depth, d: dist });
    };
    visitA(rx, rz, rootSize, 0);

    // Pass B — per-edge stitching flags from the drawn neighbor layout.
    // An edge snaps when its neighbor is drawn coarser. Same-depth and finer
    // neighbors already coincide exactly, so they need no snap. Skirts remain.
    const bitsFor = (x0: number, z0: number, size: number, depth: number): number =>
      edgeSnapBits(depths, rx, rz, rootSize, x0, z0, size, depth);

    const ancestorVariant = (x0: number, z0: number, size: number, depth: number): Tile | undefined => {
      for (let dd = depth - 1; dd >= 0; dd--) {
        const S = rootSize / 2 ** dd;
        const ox = rx + Math.floor((x0 + size / 2 - rx) / S) * S;
        const oz = rz + Math.floor((z0 + size / 2 - rz) / S) * S;
        const t = cache.get(`${dd}/${ox}/${oz}`);
        if (t) return t;
      }
      return undefined;
    };

    const fresh: Req[] = [];
    const refresh: Req[] = [];
    for (const [key, c] of depths) {
      const near = shouldStitch(c.d, c.size);
      // Snap bits are cached per tile — edgeSnapBits is expensive and only
      // changes when a tile's neighbor layout in `depths` changes. Stale bits
      // cause a subpixel crack for a frame or two until the tile is rebuilt,
      // which is imperceptible and far cheaper than recomputing every frame.
      let bits: number;
      if (near) {
        const cached = bitsCache.get(key);
        if (cached !== undefined) {
          bits = cached;
        } else {
          bits = bitsFor(c.x0, c.z0, c.size, c.depth);
          bitsCache.set(key, bits);
        }
      } else {
        bits = 0;
      }
      const t = cache.get(key);
      if (t && t.bits === bits) {
        t.used = frameNo;
        draw.push(key);
        ready++;
        if (c.depth > deepest) deepest = c.depth;
      } else if (t) {
        t.used = frameNo;
        draw.push(key);
        // Stale snap variant still covers this frame; refresh it only when
        // near (visible) — far tiles keep serving the old variant silently.
        if (near) refresh.push({ key, x0: c.x0, z0: c.z0, size: c.size, depth: c.depth, d: c.d, bits });
      } else {
        const back = ancestorVariant(c.x0, c.z0, c.size, c.depth);
        if (back) {
          back.used = frameNo;
          draw.push(back.key);
        }
        fresh.push({ key, x0: c.x0, z0: c.z0, size: c.size, depth: c.depth, d: c.d, bits });
      }
    }
    // New coverage always wins the budget; variant refresh gets at most 2
    // builds per frame so travel never starves behind restitching.
    fresh.sort((a, b) => a.depth - b.depth || a.d - b.d);
    refresh.sort((a, b) => a.d - b.d);
    need.push(...fresh, ...refresh.slice(0, 2));

    const tBuild = performance.now();
    const budget = quality === "low" ? 3 : 5;
    for (let i = 0; i < need.length; i++) {
      if (performance.now() - tBuild > budget) break;
      const r = need[i];
      const old = cache.get(r.key);
      if (old) old.geo.dispose();
      cache.set(
        r.key,
        buildTile(world, r.x0, r.z0, r.size, r.key, [!!(r.bits & 1), !!(r.bits & 2), !!(r.bits & 4), !!(r.bits & 8)])
      );
    }

    if (cache.size > 700) {
      const arr = [...cache.values()].filter((t) => t.used < frameNo - 150).sort((a, b) => a.used - b.used);
      for (let i = 0; i < arr.length && cache.size > 520; i++) {
        arr[i].geo.dispose();
        cache.delete(arr[i].key);
        bitsCache.delete(arr[i].key);
      }
    }

    // One merged mesh carries the whole drawn set (≈1 draw call replaces the
    // per-tile mesh list, which drifted from the frame loop and piled up stale
    // draws). Rebuilt when the draw-set changes, throttled to every 3rd frame
    // so streaming doesn't re-upload per frame.
    const s = draw.join("|");
    const m = merged.current;
    if (m && s !== sig.current && frameNo - lastMerge.current >= 3) {
      sig.current = s;
      lastMerge.current = frameNo;
      const tiles: Tile[] = [];
      for (const k of draw) {
        const t = cache.get(k);
        if (t) tiles.push(t);
      }
      if (tiles.length) {
        const g = mergeTileGeos(tiles);
        const old = m.geometry as THREE.BufferGeometry | undefined;
        m.geometry = g;
        if (old) old.dispose();
      }
    }
    tele.tilesDrawn = draw.length;
    tele.tilesCached = cache.size;
    tele.maxDepth = deepest;
    const st = `${ready}/${leaves}/${deepest}`;
    if (st !== stat.current) {
      stat.current = st;
      useEcho.setState({ tiles: { loaded: ready, needed: leaves, level: deepest, ready: ready >= leaves } });
    }
  });

  return (
    <mesh ref={merged} material={mat} frustumCulled={false} />
  );
}

export { heightAt, slopeAt };
