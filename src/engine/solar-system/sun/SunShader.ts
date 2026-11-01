/**
 * SUN shaders — photosphere + structured corona.
 *
 * Pipeline notes:
 *  - textures upload as SRGB (colorSpace set in sunAssets users) so texture2D
 *    returns LINEAR values on WebGL2; we tone-map in-shader (ACES approx) and
 *    hand-encode to sRGB, because a raw ShaderMaterial bypasses the renderer's
 *    automatic tone mapping / encoding (no double tone mapping by design).
 *  - the photosphere is emissive-only: it must not depend on scene-light
 *    intensity; the shared pointLight keeps lighting the planets exactly as
 *    before.
 *  - corona structure comes from the LASCO C3 log-polar mask (corona.json):
 *    x = azimuth, y = log radius over the VISIBLE annulus, rescaled in the
 *    shader to hug the limb (radial scale compressed, disclosed in the data).
 */
import { SUN_R } from "./sunAssets";

/** Corona plane extent in solar radii (half-size of the billboard). */
export const CORONA_R_OUT = 4.3;

export const PHOTO_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const PHOTO_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uDetail; // micro-detail mix 0..1 (distance LOD)
uniform float uEx;     // exposure
uniform float uRaw;    // 0 = photosphere white-gold ramp, 1 = channel as published
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0031308)), vec3(0.41666)) - 0.055, step(0.0031308, c));
}

void main() {
  vec3 tex = texture2D(uMap, vUv).rgb;
  float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));
  vec3 col;
  if (uRaw > 0.5) {
    // science channel: as-published colors, gentle filmic only (no clipping)
    col = tex * uEx;
  } else {
    // RECONSTRUCTED photosphere: the measured continuum spans only
    // p1..p95 = 0.56..0.70 (median 0.63, sRGB units) — stretch around the
    // median so granulation mottling and sunspot umbrae actually reach the
    // ramp. Disclosed reconstruction (asset manifest notes the stretch).
    float m = 0.63 + (pow(lum, 1.0 / 2.2) - 0.63) * 2.8;
    float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    if (uDetail > 0.001) {
      // granulation micro-mottle: offset re-sample of the same map
      float l2 = dot(texture2D(uMap, fract(vUv * 3.5 + vec2(0.37, 0.11))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float m2 = 0.63 + (pow(l2, 1.0 / 2.2) - 0.63) * 2.8;
      m = mix(m, m2, 0.35 * uDetail);
    }
    // continuum limb darkening applied after the stretch
    float i = m * uEx * (0.34 + 0.66 * pow(mu, 0.62));
    vec3 cUmbra = vec3(0.32, 0.09, 0.02);
    vec3 cDeep = vec3(1.00, 0.52, 0.14);
    vec3 cGold = vec3(1.00, 0.78, 0.34);
    vec3 cWhite = vec3(1.00, 0.975, 0.90);
    col = mix(cUmbra, cDeep, smoothstep(0.08, 0.32, i));
    col = mix(col, cGold, smoothstep(0.32, 0.62, i));
    col = mix(col, cWhite, smoothstep(0.62, 0.92, i));
    // restrained chromosphere rim (thin warm edge, never a thick orange outline)
    col += vec3(0.85, 0.25, 0.05) * pow(1.0 - mu, 5.0) * 0.30;
  }
  col = toSRGB(aces(col));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const CORONA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const CORONA_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMask;
uniform float uYaw;   // world-anchored azimuth correction (camera orbit)
uniform float uGain;  // distance-aware intensity
uniform float uRIn;   // limb radius in plane units
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0; // 0 at center, 1 at plane edge (= CORONA_R_OUT solar radii)
  if (r < uRIn || r > 0.995) discard;
  float a = atan(p.x, p.y) + uYaw;
  float u = fract(a * 0.15915494 + 0.5);
  float v = clamp((r - uRIn) / (1.0 - uRIn), 0.0, 1.0);
  float m = texture2D(uMask, vec2(u, v)).r;
  // hard edge never shows: fade the outermost band of the plane to zero
  float g = m * uGain * (1.0 - smoothstep(0.82, 0.995, r));
  gl_FragColor = vec4(uColor, g);
}
`;

/** Limb radius in corona-plane units (just above the photosphere surface). */
export const coronaRIn = () => (SUN_R * 1.02) / (SUN_R * CORONA_R_OUT);
