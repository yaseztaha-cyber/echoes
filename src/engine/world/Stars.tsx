import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deliberately sparse starfield. Static, no motion, no dust. Follows the camera so it never parallaxes. */
export function Stars({ radius, count = 650, dim = 1 }: { radius: number; count?: number; dim?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const r = rng(1977);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([s * Math.cos(a) * radius, u * radius, s * Math.sin(a) * radius], i * 3);
      const b = (0.18 + Math.pow(r(), 5) * 0.82) * dim;
      const tint = r();
      col.set([b * (0.9 + 0.1 * tint), b * 0.95, b * (1 - 0.15 * tint)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [radius, count, dim]);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-10}>
      <pointsMaterial size={1.5} sizeAttenuation={false} vertexColors transparent depthWrite={false} fog={false} />
    </points>
  );
}
