import { useEffect, useMemo, useRef, useState } from "react";
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
}
interface Req {
  key: string;
  x0: number;
  z0: number;
  size: number;
  depth: number;
  d: number;
}

const cache = new Map<string, Tile>();
let frameNo = 0;

function clearCache() {
  cache.forEach((t) => t.geo.dispose());
  cache.clear();
}

const lin = (v: number) => Math.pow(v, 2.2);

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

function buildTile(world: TerrainWorld, x0: number, z0: number, size: number, key: string): Tile {
  const step = size / N;
  const M = N + 3;
  const hs = new Float32Array(M * M);
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) hs[j * M + i] = heightAt(x0 + (i - 1) * step, z0 + (j - 1) * step);
  const cx = x0 + size / 2, cz = z0 + size / 2;
  const V = (N + 1) * (N + 1);
  const S = 4 * (N + 1);
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
  return { key, geo, cx, cz, used: frameNo };
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
  const [drawn, setDrawn] = useState<string[]>([]);
  const sig = useRef("");
  const stat = useRef("");
  const tex = useMemo(detailTexture, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 1, metalness: 0, side: THREE.DoubleSide }),
    [tex]
  );

  useEffect(() => {
    terrainState.world = world;
    terrainState.seed = seed;
    clearCache();
    sig.current = "";
    return () => clearCache();
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

    const visit = (x0: number, z0: number, size: number, depth: number): boolean => {
      const key = `${depth}/${x0}/${z0}`;
      const t = cache.get(key);
      const cx = x0 + size / 2, cz = z0 + size / 2;
      // 3D-aware split metric: altitude counts, so high-altitude views stay
      // coarse (fewer tile boundaries on the horizon) and ground views refine.
      // Previously horizontal-only, which refined to maxDepth even from 20 km up.
      const dist = Math.hypot(cp.x - cx, cp.y * 0.85, cp.z - cz);
      if (!t) need.push({ key, x0, z0, size, depth, d: dist });
      else t.used = frameNo;
      const split = depth < depthLimit && dist < size * kSplit;
      if (split) {
        const start = draw.length;
        const h = size / 2;
        let ok = true;
        for (let k = 0; k < 4; k++) if (!visit(x0 + (k & 1) * h, z0 + (k >> 1) * h, h, depth + 1)) ok = false;
        if (ok) return true;
        draw.length = start;
      } else {
        leaves++;
        if (t) ready++;
      }
      if (t) {
        draw.push(key);
        if (depth > deepest) deepest = depth;
        return true;
      }
      return false;
    };

    const rx = center[0] - rootSize / 2, rz = center[1] - rootSize / 2;
    if (!cache.has(`0/${rx}/${rz}`)) cache.set(`0/${rx}/${rz}`, buildTile(world, rx, rz, rootSize, `0/${rx}/${rz}`));
    visit(rx, rz, rootSize, 0);

    need.sort((a, b) => a.depth - b.depth || a.d - b.d);
    const t0 = performance.now();
    const budget = quality === "low" ? 3 : 5;
    for (let i = 0; i < need.length; i++) {
      if (performance.now() - t0 > budget) break;
      const r = need[i];
      cache.set(r.key, buildTile(world, r.x0, r.z0, r.size, r.key));
    }

    if (cache.size > 700) {
      const arr = [...cache.values()].filter((t) => t.used < frameNo - 150).sort((a, b) => a.used - b.used);
      for (let i = 0; i < arr.length && cache.size > 520; i++) {
        arr[i].geo.dispose();
        cache.delete(arr[i].key);
      }
    }

    const s = draw.join("|");
    if (s !== sig.current) {
      sig.current = s;
      setDrawn(draw);
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
    <group>
      {drawn.map((k) => {
        const t = cache.get(k);
        if (!t) return null;
        return <mesh key={k} geometry={t.geo} material={mat} position={[t.cx, 0, t.cz]} receiveShadow />;
      })}
    </group>
  );
}

export { heightAt, slopeAt };
