import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt } from "./height";

/** Seeded PRNG (mulberry-ish). Deterministic scatter, no surveyed positions claimed. */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Representative rock scatter + a few outcrop slabs around the mission site.
 * RECONSTRUCTED VISUALIZATION: rock positions are illustrative (density and size
 * follow Meridiani photo references), NOT surveyed coordinates. One draw call
 * for all rocks (instanced), one per outcrop slab.
 */
export function RockField({ seed, radius = 150, count = 240 }: { seed: number; radius?: number; count?: number }) {
  const rocks = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(seed * 31 + 7);
    const items: { x: number; y: number; z: number; s: number; ry: number; tone: number }[] = [];
    let guard = 0;
    while (items.length < count && guard++ < count * 30) {
      const a = r() * Math.PI * 2;
      const d = 3 + Math.pow(r(), 1.6) * (radius - 3);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      // near-field discipline: nothing taller than a pebble bed within 8 m of
      // the rover, so close-up inspection never stares into a boulder
      const cap = d < 8 ? 0.32 : 1.18;
      const s = 0.08 + Math.pow(r(), 2.4) * cap;
      items.push({ x, y: heightAt(x, z) + s * 0.12, z, s, ry: r() * Math.PI * 2, tone: r() });
    }
    return items;
  }, [seed, radius, count]);
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
  }, [seed]);

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

  return (
    <group>
      <instancedMesh ref={rocks} args={[undefined, undefined, data.length]} castShadow receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        {/* white base: per-instance colors carry the tone (a colored base would double-darken) */}
        <meshStandardMaterial color="#ffffff" roughness={0.96} metalness={0} />
      </instancedMesh>
      {slabs.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} rotation={[0, s.ry, 0]}>
          <mesh position={[0, s.h * 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[s.w, s.h, s.d]} />
            <meshStandardMaterial color="#42291d" roughness={0.97} metalness={0} />
          </mesh>
          <mesh position={[0.2, s.h + 0.12, -0.1]} castShadow receiveShadow>
            <boxGeometry args={[s.w * 0.7, s.h * 0.4, s.d * 0.8]} />
            <meshStandardMaterial color="#54382a" roughness={0.97} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
