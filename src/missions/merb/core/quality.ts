import type { QualityProfile } from '../data/types';

export const QUALITY: Record<'low' | 'medium' | 'high', QualityProfile> = {
  low:    { id: 'low',    pixelRatioCap: 1,    terrainSegments: 96,  shadows: false, shadowMap: 512,  rocks: 0.35, stars: 700,  plume: 160, antialias: false, targetFps: 30 },
  medium: { id: 'medium', pixelRatioCap: 1,    terrainSegments: 150, shadows: true,  shadowMap: 1024, rocks: 0.7,  stars: 1400, plume: 280, antialias: true,  targetFps: 30 },
  high:   { id: 'high',   pixelRatioCap: 1.5,  terrainSegments: 210, shadows: true,  shadowMap: 2048, rocks: 1,    stars: 2400, plume: 420, antialias: true,  targetFps: 30 },
};
export const QUALITY_ORDER: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

/** GPU-aware initial tier from the WebGL renderer string and CPU hints. */
export function detectQuality(gl: WebGLRenderingContext | WebGL2RenderingContext | null): 'low' | 'medium' | 'high' {
  let name = '';
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
  }
  if (/swiftshader|llvmpipe|software|basic render/.test(name)) return 'low';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  if (/intel|uhd|iris|mali|adreno|powervr/.test(name) || cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

/** Steps quality down when the rolling frame time stays above budget. Never steps up mid-film (avoids flicker). */
export class AdaptiveQuality {
  private samples: number[] = [];
  private cooldown = 0;
  constructor(private onStepDown: (to: 'low' | 'medium') => void, private current: () => 'low' | 'medium' | 'high', private enabled = true) {}
  setEnabled(v: boolean) { this.enabled = v; this.samples = []; }
  push(frameMs: number, targetFps: number) {
    if (!this.enabled) return;
    this.samples.push(frameMs);
    if (this.samples.length < 90) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    if (this.cooldown > 0) { this.cooldown--; return; }
    const budget = 1000 / targetFps;
    if (avg > budget * 1.35) {
      const c = this.current();
      if (c === 'high') { this.onStepDown('medium'); this.cooldown = 2; } else if (c === 'medium') { this.onStepDown('low'); this.cooldown = 2; }
    }
  }
}
