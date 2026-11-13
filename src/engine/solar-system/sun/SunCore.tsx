/**
 * SUN — dedicated solar renderer (ECHOES "THE SUN: EXTREME VISUAL FIDELITY").
 *
 * Replaces the old 2-sprite glow Sun. Pieces:
 *  - photosphere: emissive-only shader sphere. The surface look is the
 *    user-selected artistic equirectangular map (Solar System Scope, CC BY
 *    4.0) sampled as baked color, with physical limb darkening and a
 *    restrained chromosphere rim; the real HMI continuum stays the science
 *    record in the flat SOLAR SCIENCE view. Distance-gated micro-detail, and
 *    in-shader filmic + sRGB for the science channels (no double tone mapping);
 *  - structured corona: one additive billboard sampling the LASCO C3
 *    log-polar structure mask (corona_mask.png), world-anchored azimuth,
 *    distance-aware gain (restrained at overview, stronger near, hidden
 *    before it could flood the frame);
 *  - real detected sunspots as interactive targets (SunSpotMarkers).
 *
 * The Sun keeps lighting the planets exactly as before: the shared
 * pointLight at the origin is untouched, and the photosphere is emissive
 * (does not read scene lights).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SUN_LAYERS, SUN_R, CORONA_MASK_URL } from "./sunAssets";
import { PHOTO_VERT, PHOTO_FRAG, CORONA_VERT, CORONA_FRAG, CORONA_R_OUT, coronaRIn } from "./SunShader";
import { SunSpotMarkers } from "./SunSpotMarkers";
import { useEcho, type SunLayerId } from "@/state/store";
import { smoothstep } from "@/lib/geo";

function makeTex(url: string, wrap = false) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (wrap) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
  }
  return t;
}

export function Sun() {
  const layer = useEcho((s) => s.sunLayer);
  const info = SUN_LAYERS[layer];

  const masks = useMemo(() => {
    const m = {} as Record<SunLayerId, THREE.Texture>;
    (Object.keys(SUN_LAYERS) as SunLayerId[]).forEach((k) => {
      m[k] = makeTex(SUN_LAYERS[k].tex, true);
    });
    return m;
  }, []);
  const coronaTex = useMemo(() => makeTex(CORONA_MASK_URL), []);

  const coronaMesh = useRef<THREE.Mesh>(null);
  const glare = useRef<THREE.Sprite>(null!);
  // Uniform writes go through the material refs: r3f does not guarantee the
  // `uniforms` prop object identity survives onto the created material, so
  // mutating the useMemo object alone silently no-ops.
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const coronaMatRef = useRef<THREE.ShaderMaterial>(null);
  const glareMap = useMemo(glareTexture, []);

  const uniforms = useMemo(
    () => ({
      uMap: { value: masks.photosphere },
      uDetail: { value: 0 },
      uEx: { value: 1.02 },
      uRaw: { value: 0 },
      uBaked: { value: 0 },
    }),
    [masks],
  );
  const cUniforms = useMemo(
    () => ({
      uMask: { value: coronaTex },
      uYaw: { value: Math.PI },
      uGain: { value: 0.5 },
      uRIn: { value: coronaRIn() },
      uColor: { value: new THREE.Color(1.0, 0.92, 0.76) },
    }),
    [coronaTex],
  );

  // Layer swap + per-frame LOD/anchoring. Uniform writes are idempotent and
  // cheap; they also keep the shader in sync after texture loads complete.
  useFrame(({ camera }) => {
    const u = matRef.current?.uniforms;
    const cu = coronaMatRef.current?.uniforms;
    if (!u || !cu) return;
    const cam = camera as THREE.PerspectiveCamera;
    u.uMap.value = masks[layer];
    u.uRaw.value = info.raw;
    u.uBaked.value = info.baked ?? 0;
    // the artistic surface map is an SDR sRGB image: a touch more exposure
    // keeps it as bright as the reference without blowing the flare patches
    u.uEx.value = info.baked ? 1.16 : 1.08;
    const d = cam.position.length();
    // fractional angular radius vs half-fov: the disk's share of screen height
    const frac = Math.atan2(SUN_R, d) / (THREE.MathUtils.degToRad(cam.fov) * 0.5);
    // micro-detail only when granulation is actually resolvable on screen
    u.uDetail.value = smoothstep(0.1, 0.32, frac) * (1 - smoothstep(0.75, 0.95, frac));
    // corona gain: only shows once the disk is large enough on screen (no
    // giant gray oval at overview), stronger near the Sun, and hidden again
    // before it could flood extreme close-ups
    let gain =
      0.85 *
      smoothstep(0.2, 0.38, frac) *
      (1 - smoothstep(0.62, 0.86, frac)) *
      (0.6 + 0.4 * smoothstep(0.3, 0.55, frac));
    if (layer === "corona") gain = Math.min(1.05, gain * 1.8);
    cu.uGain.value = gain;
    // world-anchored streamer azimuth (sign settled by the sun probe)
    cu.uYaw.value = Math.atan2(cam.position.x, cam.position.z) + Math.PI;
    if (coronaMesh.current) coronaMesh.current.quaternion.copy(cam.quaternion);
    if (glare.current) {
      const m = glare.current.material as THREE.SpriteMaterial;
      m.opacity = 0.38 * (1 - smoothstep(0.28, 0.55, frac));
    }
  });

  return (
    <group>
      {/* photosphere — emissive shader sphere; lighting for planets unchanged */}
      <mesh>
        <sphereGeometry args={[SUN_R, 128, 96]} />
        <shaderMaterial ref={matRef} vertexShader={PHOTO_VERT} fragmentShader={PHOTO_FRAG} uniforms={uniforms} />
      </mesh>
      {/* photosphere glare (additive, fades out close) — replaces the old double sprite */}
      <sprite ref={glare} scale={[SUN_R * 4.2, SUN_R * 4.2, 1]}>
        <spriteMaterial map={glareMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.38} fog={false} color={[1, 0.9, 0.72]} />
      </sprite>
      {/* structured corona — one billboard, observed streamer structure */}
      <mesh ref={coronaMesh} scale={SUN_R * CORONA_R_OUT}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial ref={coronaMatRef}
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          uniforms={cUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>
      <SunSpotMarkers />
    </group>
  );
}

// soft centred glare texture (canvas radial gradient — glare only, NOT corona)
function glareTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,244,222,0.9)");
  gr.addColorStop(0.28, "rgba(255,228,178,0.22)");
  gr.addColorStop(1, "rgba(255,228,178,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
