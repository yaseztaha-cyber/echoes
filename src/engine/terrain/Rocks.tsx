import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { heightAt } from "./height";
import { onDemReady } from "./dem";
import { rockScatter, rng, type RockItem } from "./rockScatter";
import { useEcho } from "@/state/store";

/**
 * Representative rock scatter + a few outcrop slabs around the mission site.
 * RECONSTRUCTED VISUALIZATION: rock positions are illustrative (density and size
 * follow Meridiani photo references), NOT surveyed coordinates. One draw call
 * for all rocks (instanced), one per outcrop slab.
 *
 * Quality tiers: the rng stream is count-independent — the first n items of a
 * 140-scatter equal the whole of a 90-scatter — so trimming never reshuffles
 * the visible landscape between quality changes. Shadows are the expensive
 * part on weak devices: rocks stop casting below high tier, slabs follow.
 */
export const ROCK_COUNT_FACTOR: Record<string, number> = { low: 0.35, medium: 0.6, high: 1, ultra: 1 };

export function RockField({ seed, radius = 150, count = 240 }: { seed: number; radius?: number; count?: number }) {
  const quality = useEcho((s) => s.quality);
  const rocks = useRef<THREE.InstancedMesh>(null);
  // DEM landing can shift heights by metres â€” reground the scatter when it arrives.
  const [demTick, setDemTick] = useState(0);
  useEffect(() => onDemReady(() => setDemTick((t) => t + 1)), []);
  const useCount = Math.max(1, Math.round(count * (ROCK_COUNT_FACTOR[quality] ?? 1)));
  const rockShadows = quality === "high" || quality === "ultra";
  const data = useMemo(
    () => rockScatter(seed, radius, useCount, heightAt),
    [seed, radius, useCount, demTick]
  ) as RockItem[];
  const slabs = useMemo(() => {
    const r = rng(seed * 57 + 3);
    const out: { x: number; z: number; y: number; w: number; h: number; d: number; ry: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r() * 0.8;
      const dist = 30 + r() * 65;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      out.push({ x, z, y: heightAt(x, z) - 0.15, w: 3 + r() * 5, h: 0.3 + r() * 0.45, d: 1.5 + r() * 2.5, ry: r() * Math.PI });
    }
    return out;
  }, [seed, demTick]);

  // Static scatter: compose once, not per frame.
  useEffect(() => {
    const m = rocks.current;
    if (!m) return;
    const M = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const E = new THREE.Euler();
    const S = new THREE.Vector3();
    const P = new THREE.Vector3();
    const C = new THREE.Color();
    data.forEach((it, i) => {
      E.set(0, it.ry, 0);
      Q.setFromEuler(E);
      S.set(it.s * (0.7 + it.tone * 0.6), it.s * 0.75, it.s);
      P.set(it.x, it.y, it.z);
      M.compose(P, Q, S);
      m.setMatrixAt(i, M);
      // linear-space rock tones (material base is white): dark basaltic browns
      C.setRGB(0.13 + it.tone * 0.05, 0.08 + it.tone * 0.03, 0.055 + it.tone * 0.02);
      m.setColorAt(i, C);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data]);

  // Slabs baked into two merged geometries (one per tone) â€” 10 slab meshes
  // become 2 draw calls instead of 10.
  const slabGeos = useMemo(() => {
    const dark: THREE.BufferGeometry[] = [];
    const upper: THREE.BufferGeometry[] = [];
    for (const s of slabs) {
      const w = new THREE.Matrix4().makeTranslation(s.x, s.y, s.z).multiply(
        new THREE.Matrix4().makeRotationY(s.ry)
      );
      const main = new THREE.BoxGeometry(s.w, s.h, s.d);
      main.applyMatrix4(new THREE.Matrix4().makeTranslation(0, s.h * 0.5, 0).premultiply(w));
      dark.push(main);
      const up = new THREE.BoxGeometry(s.w * 0.7, s.h * 0.4, s.d * 0.8);
      up.applyMatrix4(new THREE.Matrix4().makeTranslation(0.2, s.h + 0.12, -0.1).premultiply(w));
      upper.push(up);
    }
    return {
      dark: mergeGeometries(dark) ?? undefined,
      upper: mergeGeometries(upper) ?? undefined,
    };
  }, [slabs]);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#42291d", roughness: 0.97, metalness: 0 }), []);
  const upperMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#54382a", roughness: 0.97, metalness: 0 }), []);
  useEffect(() => () => {
    slabGeos.dark?.dispose();
    slabGeos.upper?.dispose();
  }, [slabGeos]);

  return (
    <group>
      <instancedMesh ref={rocks} args={[undefined, undefined, data.length]} castShadow={rockShadows} receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        {/* white base: per-instance colors carry the tone (a colored base would double-darken) */}
        <meshStandardMaterial color="#ffffff" roughness={0.96} metalness={0} />
      </instancedMesh>
      {slabGeos.dark && slabGeos.upper && (
        <>
          <mesh geometry={slabGeos.dark} material={darkMat} castShadow={rockShadows} receiveShadow />
          <mesh geometry={slabGeos.upper} material={upperMat} castShadow={rockShadows} receiveShadow />
        </>
      )}
    </group>
  );
}
