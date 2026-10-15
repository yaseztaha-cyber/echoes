import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import marsUrl from "@/assets/tex/mars.jpg";
import earthUrl from "@/assets/tex/earth.jpg";
import moonUrl from "@/assets/tex/moon.jpg";
import { GLOBE_R } from "@/lib/geo";

const URLS = { mars: marsUrl, earth: earthUrl, moon: moonUrl } as const;

function bandTexture(colors: string[]) {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 256;
  const g = c.getContext("2d")!;
  let y = 0;
  let i = 0;
  while (y < 256) {
    const h = 10 + ((i * 37) % 26);
    g.fillStyle = colors[i % colors.length];
    g.fillRect(0, y, 8, h);
    y += h;
    i++;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const NOISE = /* glsl */ `
float h31(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn3(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

interface GlobeProps {
  kind: "mars" | "earth" | "moon";
  radius: number;
  detail?: boolean;
  rough?: number;
}

/** Textured globe. Color maps are published calibrated imagery: sRGB, no material repaint. */
export function Globe({ kind, radius, detail, rough = 1 }: GlobeProps) {
  const map = useTexture(URLS[kind]);
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;
  const u = useRef({ uDetail: { value: 0 } });
  const mat = useMemo(() => {
    // Phase 3: calibrated source maps (MDIM 2.1, LROC, BMNG) — no tint repaint.
    const m = new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0, color: "#ffffff" });
    if (detail) {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uDetail = u.current.uDetail;
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix*vec4(position,1.0)).xyz;");
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", `#include <common>\nvarying vec3 vWP; uniform float uDetail;\n${NOISE}`)
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
             float dd = vn3(vWP*0.35)*0.5 + vn3(vWP*2.4)*0.3 + vn3(vWP*13.0)*0.14 + vn3(vWP*60.0)*0.06;
             diffuseColor.rgb *= (1.0 + uDetail*(dd-0.5)*2.1) * mix(vec3(1.0), vec3(1.06,0.94,0.84), uDetail*0.8);`
          );
      };
    }
    return m;
  }, [map, detail, rough]);

  useFrame(({ camera }) => {
    if (!detail) return;
    const alt = camera.position.length() - GLOBE_R;
    const t = THREE.MathUtils.clamp((45 - alt) / 40, 0, 1);
    u.current.uDetail.value = t;
  });
  useEffect(() => () => mat.dispose(), [mat]);

  return (
    <mesh material={mat}>
      <sphereGeometry args={[radius, detail ? 160 : 96, detail ? 96 : 64]} />
    </mesh>
  );
}

export function BandedGlobe({ colors, radius }: { colors: string[]; radius: number }) {
  const map = useMemo(() => bandTexture(colors), [colors]);
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 32]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

export function PlainGlobe({ color, radius }: { color: string; radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 40, 28]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

/** Rim atmosphere. Strength and colour differ per world — never the same shader settings twice. */
export function Atmosphere({ radius, color, strength = 1, sun, scale = 1.09, power = 3 }: { radius: number; color: string; strength?: number; sun: () => THREE.Vector3; scale?: number; power?: number }) {
  const uni = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uSun: { value: new THREE.Vector3(1, 0, 0) }, uStrength: { value: strength }, uPow: { value: power } }),
    [color, strength, power]
  );
  useFrame(() => uni.uSun.value.copy(sun()));
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[radius, 64, 40]} />
      <shaderMaterial
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uni}
        vertexShader={`varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={`varying vec3 vN; varying vec3 vW; uniform vec3 uColor; uniform vec3 uSun; uniform float uStrength; uniform float uPow;
          void main(){ vec3 V=normalize(cameraPosition-vW); float d=1.0+dot(vN,V); float rim=pow(clamp(d,0.0,1.0),uPow);
          float lit=smoothstep(-0.25,0.55,dot(normalize(vN),normalize(uSun)));
          gl_FragColor=vec4(uColor*rim*uStrength*(0.12+0.88*lit),1.0);} `}
      />
    </mesh>
  );
}
