import * as THREE from 'three';
import { makeNoise } from './noise';

export function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Martian sky dome: butterscotch horizon, grey-blue zenith and the characteristic blue sun halo. */
export class SkyDome {
  readonly mesh: THREE.Mesh;
  readonly sunDir = new THREE.Vector3();
  constructor(zenith: number[], horizon: number[], sunElevDeg: number, sunAzimDeg: number, sunColor: number[], dust: number) {
    const el = THREE.MathUtils.degToRad(sunElevDeg), az = THREE.MathUtils.degToRad(sunAzimDeg);
    this.sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(...zenith) }, horizon: { value: new THREE.Color(...horizon) },
        sunDir: { value: this.sunDir.clone() }, sunColor: { value: new THREE.Color(...sunColor) }, dust: { value: dust },
      },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        varying vec3 vD; uniform vec3 zenith, horizon, sunDir, sunColor; uniform float dust;
        void main(){
          float h = clamp(vD.y, 0.0, 1.0);
          vec3 col = mix(horizon, zenith, pow(h, 0.55));
          if (vD.y < 0.0) col = horizon * (0.9 + vD.y * 0.4);
          float s = max(dot(normalize(vD), sunDir), 0.0);
          vec3 halo = mix(vec3(0.45,0.58,0.95), sunColor, dust);
          col += halo * pow(s, 14.0) * (0.35 - 0.2 * dust);
          col += sunColor * pow(s, 3.0) * 0.18;
          col += sunColor * smoothstep(0.99935, 0.99975, s) * (2.2 - 1.4 * dust);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(4500, 24, 16), mat);
    this.mesh.renderOrder = -10; this.mesh.frustumCulled = false;
  }
  follow(p: THREE.Vector3) { this.mesh.position.copy(p); }
  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}

export function makeStars(count: number, radius = 5000): THREE.Points {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const { rnd } = makeNoise(77);
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * r * radius, u * radius, Math.sin(a) * r * radius], i * 3);
    const b = 0.35 + Math.pow(rnd(), 3) * 0.65, warm = rnd();
    col.set([b, b * (0.9 + warm * 0.1), b * (0.82 + warm * 0.18)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
  p.frustumCulled = false; p.renderOrder = -9;
  return p;
}

/** Procedural planet map (equirectangular, horizontally seamless). */
export function planetTexture(kind: 'earth' | 'mars', w = 512, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!; const img = g.createImageData(w, h);
  const nz = makeNoise(kind === 'earth' ? 5 : 9);
  for (let y = 0; y < h; y++) {
    const lat = (y / h - 0.5) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2;
      const nx = Math.cos(lon) * 2.4 + lat * 0.3, nzz = Math.sin(lon) * 2.4 + lat * 1.6;
      const v = nz.fbm(nx + 10, nzz + 10, 5), d = nz.fbm(nx * 2.2 + 40, nzz * 2.2 + 40, 3);
      let r: number, gg: number, b: number;
      if (kind === 'earth') {
        if (v > 0.53) { const t = Math.min(1, (v - 0.53) * 5); r = 70 + 90 * t * d; gg = 110 + 50 * (1 - t); b = 62 + 20 * t; }
        else { r = 12; gg = 38 + 30 * v; b = 84 + 70 * v; }
        const cl = nz.fbm(nx * 1.6 + 90, nzz * 1.6 + 90, 4); if (cl > 0.55) { const t = Math.min(1, (cl - 0.55) * 4); r += (240 - r) * t; gg += (244 - gg) * t; b += (250 - b) * t; }
        if (Math.abs(lat) > 1.25) { r = 235; gg = 240; b = 245; }
      } else {
        const dark = v > 0.5 ? (v - 0.5) * 1.6 : 0;
        r = 188 - 80 * dark + 24 * d; gg = 104 - 50 * dark + 14 * d; b = 62 - 28 * dark + 8 * d;
        if (Math.abs(lat) > 1.38) { r = 236; gg = 226; b = 214; }
      }
      const k = (y * w + x) * 4; img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}
