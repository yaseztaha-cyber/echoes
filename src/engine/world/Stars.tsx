import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildStarGeometryData, buildStarGeometryFromFlat, type StarGeometryData } from "@/engine/world/starsData";
import { loadDeepStars } from "@/engine/world/starsDeep";
import { MilkyWay } from "@/engine/world/MilkyWay";
import { useEcho } from "@/state/store";

/**
 * Catalogue-backed naked-eye starfield (spec A18) + streamed deep population
 * (rich-universe phase). Two Points layers share one shader: the bundled
 * naked-eye set always draws; the 61k-star HYG deep excerpt streams once from
 * public/stars-deep.bin and appends when ready (high/medium tiers; low tier
 * never fetches — performance first, exactly the tiering contract). Sky is
 * static, follows the camera, GPU-side brightness in uDim.
 */

function makeGeometry(g: StarGeometryData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(g.positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(g.colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(g.sizes, 1));
  return geo;
}

export function Stars({ radius, count = Infinity, dim = 1 }: { radius: number; count?: number; dim?: number }) {
  const coreRef = useRef<THREE.Points>(null);
  const deepRef = useRef<THREE.Points>(null);
  const quality = useEcho((s) => s.quality);
  const [deep, setDeep] = useState<StarGeometryData | null>(null);

  const { geo, mat } = useMemo(() => {
    const g = makeGeometry(buildStarGeometryData(count));
    const m = new THREE.ShaderMaterial({
      uniforms: { uDim: { value: dim }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uDim;
        uniform float uPixelRatio;
        varying vec3 vColor;
        void main() {
          vColor = aColor * uDim;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float fall = 1.0 - smoothstep(0.55, 1.0, r);
          float glow = fall * fall;
          gl_FragColor = vec4(vColor * glow, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    return { geo: g, mat: m };
  }, [dim, count]);

  useEffect(() => {
    if (quality === "low") return;
    let alive = true;
    void loadDeepStars().then((data) => {
      if (alive && data) setDeep(buildStarGeometryFromFlat(data, Infinity, "deep"));
    });
    return () => {
      alive = false;
    };
  }, [quality]);

  const deepGeo = useMemo(() => (deep ? makeGeometry(deep) : null), [deep]);

  useFrame(({ camera, gl }) => {
    mat.uniforms.uPixelRatio.value = gl.getPixelRatio();
    coreRef.current?.position.copy(camera.position);
    deepRef.current?.position.copy(camera.position);
  });

  return (
    <>
      <MilkyWay radius={radius} dim={dim} />
      <points ref={coreRef} geometry={geo} material={mat} frustumCulled={false} renderOrder={-10} scale={radius} />
      {deepGeo && (
        <points ref={deepRef} geometry={deepGeo} material={mat} frustumCulled={false} renderOrder={-10} scale={radius} />
      )}
    </>
  );
}
