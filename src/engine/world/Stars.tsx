import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildStarGeometryData } from "@/engine/world/starsData";

/**
 * Catalogue-backed naked-eye starfield (spec A18). Static, no motion, no dust.
 * Follows the camera so it never parallaxes. GPU-side brightness in uDim.
 */
export function Stars({ radius, count = Infinity, dim = 1 }: { radius: number; count?: number; dim?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const { positions, colors, sizes } = buildStarGeometryData(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
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
  useFrame(({ camera, gl }) => {
    mat.uniforms.uPixelRatio.value = gl.getPixelRatio();
    ref.current?.position.copy(camera.position);
  });
  return (
    <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={-10} scale={radius} />
  );
}
