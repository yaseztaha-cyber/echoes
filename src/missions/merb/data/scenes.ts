import type { MarkerDef, RoverScript, SceneDef, Shot, SiteDef, V3 } from './types';

const deg = Math.PI / 180;
const SKY_DAY = { zenith: [0.46, 0.40, 0.38] as [number, number, number], horizon: [0.84, 0.62, 0.44] as [number, number, number], sunColor: [1.0, 0.88, 0.72] as [number, number, number] };

/* --------------------------------- sites ---------------------------------
 * Terrain is PROCEDURAL. Feature sizes follow documented diameters where the
 * site fits the 240–340 m terrain tile (Eagle, Endurance); larger craters are
 * scaled down and labelled as reconstruction. No coordinate here is telemetry.
 */
export const SITES: Record<string, SiteDef & { size: number; lander?: boolean }> = {
  testbed: {
    id: 'testbed', label: 'Test bed (reconstruction)', seed: 3, size: 120, ripple: 0.05, rippleFreq: 0.5, features: [],
    palette: { low: [0.34, 0.28, 0.23], high: [0.40, 0.33, 0.27], rock: [0.30, 0.25, 0.22] },
    sky: { zenith: [0.04, 0.04, 0.05], horizon: [0.16, 0.13, 0.11], sunElev: 52, sunAzim: 130, sunColor: [1, 0.93, 0.85], sunIntensity: 2.4, fog: 0.012, dust: 0 },
    rocks: 90, spherules: 0, slabs: 0,
  },
  eagle: {
    id: 'eagle', label: 'Eagle crater (reconstruction)', seed: 11, size: 240, ripple: 0.09, rippleFreq: 0.45, lander: true,
    features: [{ type: 'bowl', x: 0, z: 0, r: 11, depth: 2.4, rim: 0.4 }, { type: 'outcrop-ring', x: 0, z: 0, r: 9.2, depth: 0, angle: 80 * deg, width: 0.9, n: 30 }],
    palette: { low: [0.30, 0.20, 0.16], high: [0.48, 0.28, 0.17], rock: [0.40, 0.27, 0.20] },
    sky: { ...SKY_DAY, sunElev: 38, sunAzim: 215, sunIntensity: 2.8, fog: 0.0045, dust: 0.5 },
    rocks: 260, spherules: 0, slabs: 34,
  },
  water: {
    id: 'water', label: 'Eagle outcrop (reconstruction)', seed: 11, size: 240, ripple: 0.07, rippleFreq: 0.45, lander: true,
    features: [{ type: 'bowl', x: 0, z: 0, r: 11, depth: 2.4, rim: 0.4 }, { type: 'outcrop-ring', x: 0, z: 0, r: 9.2, depth: 0, angle: 80 * deg, width: 0.9, n: 44 }],
    palette: { low: [0.26, 0.18, 0.15], high: [0.42, 0.25, 0.16], rock: [0.42, 0.28, 0.21] },
    sky: { ...SKY_DAY, sunElev: 30, sunAzim: 235, sunIntensity: 2.8, fog: 0.004, dust: 0.45 },
    rocks: 120, spherules: 1500, slabs: 40,
  },
  endurance: {
    id: 'endurance', label: 'Endurance crater (reconstruction)', seed: 21, size: 320, ripple: 0.1, rippleFreq: 0.4,
    features: [{ type: 'bowl', x: 0, z: 78, r: 65, depth: 20, rim: 1.4 }, { type: 'outcrop-ring', x: 0, z: 78, r: 56, depth: 0, angle: 300 * deg, width: 2.2, n: 60 }],
    palette: { low: [0.30, 0.20, 0.16], high: [0.52, 0.31, 0.19], rock: [0.45, 0.30, 0.22] },
    sky: { ...SKY_DAY, sunElev: 45, sunAzim: 200, sunIntensity: 3, fog: 0.003, dust: 0.5 },
    rocks: 300, spherules: 0, slabs: 50,
  },
  purgatory: {
    id: 'purgatory', label: 'Dune field (reconstruction)', seed: 31, size: 240, ripple: 0.05, rippleFreq: 0.4,
    features: [{ type: 'dunes', x: 0, z: 0, r: 7, depth: 0.55, angle: 20 * deg, n: 1 }],
    palette: { low: [0.22, 0.16, 0.14], high: [0.37, 0.24, 0.17], rock: [0.32, 0.23, 0.18] },
    sky: { ...SKY_DAY, sunElev: 28, sunAzim: 250, sunIntensity: 2.8, fog: 0.004, dust: 0.5 },
    rocks: 60, spherules: 0, slabs: 0,
  },
  victoria: {
    id: 'victoria', label: 'Victoria crater (scaled reconstruction)', seed: 41, size: 360, ripple: 0.08, rippleFreq: 0.35,
    features: [{ type: 'scallop-bowl', x: 0, z: 100, r: 82, depth: 24, rim: 2.2, n: 9 }, { type: 'outcrop-ring', x: 0, z: 100, r: 72, depth: 0, angle: 330 * deg, width: 3, n: 70 }],
    palette: { low: [0.26, 0.18, 0.15], high: [0.50, 0.30, 0.19], rock: [0.46, 0.31, 0.23] },
    sky: { ...SKY_DAY, sunElev: 33, sunAzim: 220, sunIntensity: 3, fog: 0.0026, dust: 0.5 },
    rocks: 260, spherules: 0, slabs: 60,
  },
  endeavour: {
    id: 'endeavour', label: 'Endeavour rim (reconstruction)', seed: 51, size: 400, ripple: 0.08, rippleFreq: 0.35,
    features: [
      { type: 'slope', x: 0, z: 0, r: 160, depth: 34, angle: 90 * deg },
      { type: 'ridge', x: -20, z: -30, r: 120, depth: 6, angle: 75 * deg, width: 14 },
    ],
    palette: { low: [0.27, 0.19, 0.16], high: [0.50, 0.31, 0.20], rock: [0.41, 0.29, 0.22] },
    sky: { ...SKY_DAY, sunElev: 36, sunAzim: 260, sunIntensity: 3, fog: 0.0024, dust: 0.5 },
    rocks: 340, spherules: 0, slabs: 20,
  },
  'cape-york': {
    id: 'cape-york', label: 'Cape York (reconstruction)', seed: 61, size: 360, ripple: 0.07, rippleFreq: 0.35,
    features: [{ type: 'ridge', x: 0, z: 25, r: 150, depth: 7, angle: 20 * deg, width: 16 }, { type: 'slope', x: 0, z: 0, r: 150, depth: 18, angle: 100 * deg }, { type: 'outcrop-ring', x: 0, z: 18, r: 14, depth: 0, angle: 360 * deg, width: 1.4, n: 70 }],
    palette: { low: [0.28, 0.20, 0.16], high: [0.52, 0.32, 0.20], rock: [0.52, 0.40, 0.31] },
    sky: { ...SKY_DAY, sunElev: 34, sunAzim: 225, sunIntensity: 3, fog: 0.0026, dust: 0.45 },
    rocks: 360, spherules: 0, slabs: 70,
  },
  marathon: {
    id: 'marathon', label: 'Endeavour rim plain (reconstruction)', seed: 71, size: 400, ripple: 0.06, rippleFreq: 0.32,
    features: [{ type: 'slope', x: 0, z: 0, r: 170, depth: 40, angle: 80 * deg }, { type: 'valley', x: 0, z: 70, r: 150, depth: 7, angle: 75 * deg, width: 18 }],
    palette: { low: [0.27, 0.19, 0.16], high: [0.50, 0.30, 0.19], rock: [0.42, 0.30, 0.23] },
    sky: { ...SKY_DAY, sunElev: 40, sunAzim: 240, sunIntensity: 3, fog: 0.0024, dust: 0.45 },
    rocks: 300, spherules: 0, slabs: 20,
  },
  valleys: {
    id: 'valleys', label: 'Valley (reconstruction)', seed: 81, size: 400, ripple: 0.06, rippleFreq: 0.32,
    features: [{ type: 'slope', x: 0, z: 0, r: 170, depth: 30, angle: 0 }, { type: 'valley', x: 0, z: 0, r: 160, depth: 5.5, angle: 0, width: 12 }],
    palette: { low: [0.26, 0.19, 0.16], high: [0.48, 0.30, 0.20], rock: [0.44, 0.32, 0.25] },
    sky: { ...SKY_DAY, sunElev: 32, sunAzim: 130, sunIntensity: 3, fog: 0.0024, dust: 0.5 },
    rocks: 340, spherules: 0, slabs: 40,
  },
  'dust-storm': {
    id: 'dust-storm', label: 'Perseverance Valley in dust (reconstruction)', seed: 81, size: 400, ripple: 0.06, rippleFreq: 0.32,
    features: [{ type: 'slope', x: 0, z: 0, r: 170, depth: 30, angle: 0 }, { type: 'valley', x: 0, z: 0, r: 160, depth: 5.5, angle: 0, width: 12 }],
    palette: { low: [0.34, 0.25, 0.19], high: [0.55, 0.38, 0.25], rock: [0.45, 0.34, 0.26] },
    sky: { zenith: [0.30, 0.23, 0.17], horizon: [0.50, 0.37, 0.25], sunElev: 30, sunAzim: 130, sunColor: [1.0, 0.7, 0.45], sunIntensity: 1.9, fog: 0.011, dust: 1 },
    rocks: 340, spherules: 0, slabs: 40,
  },
  'final-signal': {
    id: 'final-signal', label: 'Perseverance Valley (reconstruction)', seed: 81, size: 400, ripple: 0.06, rippleFreq: 0.32,
    features: [{ type: 'slope', x: 0, z: 0, r: 170, depth: 30, angle: 0 }, { type: 'valley', x: 0, z: 0, r: 160, depth: 5.5, angle: 0, width: 12 }],
    palette: { low: [0.32, 0.23, 0.17], high: [0.55, 0.37, 0.24], rock: [0.45, 0.34, 0.26] },
    sky: { zenith: [0.20, 0.17, 0.18], horizon: [0.62, 0.40, 0.26], sunElev: 9, sunAzim: 130, sunColor: [0.8, 0.86, 1.0], sunIntensity: 2.6, fog: 0.005, dust: 0.9 },
    rocks: 340, spherules: 0, slabs: 40,
  },
};

/* ------------------------------ shot helpers ------------------------------ */
const dolly = (t0: number, t1: number, space: 'world' | 'rover' | 'rover-pos', fp: V3, fl: V3, tp: V3, tl: V3, fov = 42, fov2?: number, ease: 'inout' | 'out' | 'linear' = 'inout'): Shot =>
  ({ kind: 'dolly', t0, t1, space, from: { p: fp, l: fl, fov }, to: { p: tp, l: tl, fov: fov2 ?? fov }, ease });
const orbit = (t0: number, t1: number, r0: number, r1: number, a0: number, a1: number, h0: number, h1: number, lookUp = 0.5, fov = 40, center: V3 | 'rover' = 'rover'): Shot =>
  ({ kind: 'orbit', t0, t1, center, r0, r1, a0, a1, h0, h1, lookUp, fov });

const roverMast = (...k: Array<[number, number, number]>) => k.map(([t, pan, tilt]) => ({ t, pan: pan * deg, tilt: tilt * deg }));

interface SurfaceOpts {
  id: string; site: string; rover: RoverScript; shots: Shot[]; markers?: MarkerDef[]; provenance?: string;
}
const surface = (o: SurfaceOpts): SceneDef => ({
  id: o.id, kind: 'surface', siteId: o.site, shots: o.shots, rover: o.rover, markers: o.markers,
  provenance: o.provenance ?? 'Procedural 3D reconstruction. Terrain, rover pose and camera are illustrative, not telemetry.',
});

/* --------------------------------- scenes --------------------------------- */
export const SCENES: Record<string, SceneDef> = {
  hall: surface({
    id: 'hall', site: 'testbed',
    provenance: 'Rover reconstructed from public NASA/JPL dimensions; the test bed is imaginary.',
    rover: {
      start: { x: 0, z: -6, heading: 0 }, path: [[0, -6], [0, 6]], drive: [{ t0: 0.32, t1: 0.92, s0: 0, s1: 1 }], dust: 0, deploy: { t0: 0.0, t1: 0.22 },
      arm: [{ t: 0.0, pose: 'stow' }, { t: 0.24, pose: 'reach' }, { t: 0.3, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.22, -50, 5], [0.3, 40, 0], [0.4, 0, 0]),
    },
    shots: [
      orbit(0, 0.3, 11, 6.5, 0.2, 2.1, 3.6, 1.7, 0.6, 38),
      dolly(0.3, 0.62, 'rover', [2.7, 0.8, 2.4], [0.3, 0.3, 0.5], [3.0, 0.9, -1.4], [0.2, 0.35, -0.2], 38),
      dolly(0.62, 1, 'rover-pos', [-3, 0.7, 5], [0, 0.7, 0], [1.5, 0.9, 3], [0, 0.7, 0], 40),
    ],
  }),
  launch: { id: 'launch', kind: 'launch', shots: [
    dolly(0, 0.3, 'world', [-95, 4, 150], [0, 38, 0], [-55, 6, 105], [0, 38, 0], 36),
    dolly(0.3, 0.46, 'world', [-70, 3, 100], [0, 40, 0], [-60, 3, 80], [0, 60, 0], 34, 40, 'out'),
    dolly(0.46, 0.7, 'rover', [-60, -40, 120], [0, 0, 0], [-80, -90, 190], [0, 20, 0], 36, 30),
    dolly(0.7, 1, 'rover', [-140, -300, 380], [0, 0, 0], [-170, -500, 600], [0, 40, 0], 32, 24),
  ], provenance: 'Reconstructed pad and vehicle (Delta II Heavy: first stage + nine strap-on solids). Not to scale in detail.' },
  cruise: { id: 'cruise', kind: 'cruise', shots: [
    dolly(0, 0.38, 'world', [-20, 70, 260], [0, 0, 0], [10, 40, 190], [0, 0, 0], 40),
    dolly(0.38, 0.72, 'rover-pos', [30, 8, 50], [-16, 0, 0], [40, 5, 34], [-20, 0, 0], 36),
    orbit(0.72, 1, 24, 14, 0.6, 3.4, 6, 2.5, 0, 40, 'rover'),
  ], provenance: 'Schematic: Earth, Mars and the spacecraft are not to scale; the path is illustrative.' },
  approach: { id: 'approach', kind: 'approach', shots: [
    dolly(0, 0.4, 'world', [0, 30, 900], [0, 0, 0], [60, 20, 650], [0, 0, 0], 40),
    dolly(0.4, 0.75, 'rover', [-14, 6, -30], [0, 0, 4], [-8, 3, -20], [0, 0, 3], 36),
    dolly(0.75, 1, 'world', [-80, 40, 520], [0, 0, 0], [-40, 10, 420], [0, 0, 0], 42),
  ], provenance: 'Stylised Mars and spacecraft; sizes and distances are not to scale.' },
  edl: { id: 'edl', kind: 'edl', siteId: 'eagle',
    rover: { start: { x: 0, z: 0, heading: 0 }, path: [[0, 0]], drive: [], dust: 0, platformLift: 0.42, deploy: { t0: 2, t1: 3 }, arm: [{ t: 0, pose: 'stow' }] },
    shots: [
    dolly(0, 0.14, 'rover', [60, 40, -90], [0, 0, 0], [40, 30, -70], [0, 0, 0], 38),
    dolly(0.14, 0.4, 'rover', [-30, 10, -50], [0, 18, 0], [-34, 4, -64], [0, 12, 0], 42),
    dolly(0.4, 0.58, 'rover', [-12, 4, -26], [0, 0, 0], [-9, 0, -15], [0, -4, 0], 40),
    dolly(0.58, 0.88, 'rover-pos', [14, 5, 26], [0, 1.2, 0], [7, 2.6, 13], [0, 1.0, 0], 40, 44),
    dolly(0.88, 1, 'world', [-10, 2.6, 9], [0, 0.8, 0], [-4.5, 1.6, 6], [0, 0.7, 0], 38),
  ], provenance: 'Schematic reconstruction of the published EDL sequence. Timing and trajectory are illustrative.' },
  'first-views': surface({
    id: 'first-views', site: 'eagle',
    rover: {
      start: { x: 0, z: 0, heading: 0 }, path: [[0, 0], [0, 5]], drive: [{ t0: 0.62, t1: 0.95, s0: 0, s1: 1 }], dust: 0.02, platformLift: 0.42, deploy: { t0: 0.04, t1: 0.4 },
      arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.36, 0, 0], [0.45, -60, 4], [0.55, 60, 4], [0.62, 0, 0]),
    },
    shots: [
      dolly(0, 0.3, 'world', [-9, 3.4, -8], [0, 0.7, 0], [-6, 1.8, -5], [0, 0.8, 0], 36),
      orbit(0.3, 0.62, 6, 4, 4.5, 6.6, 1.6, 1.0, 0.8, 34),
      dolly(0.62, 1, 'rover-pos', [-5, 1.2, -4], [0, 0.5, 2], [-4, 0.9, 1], [0, 0.6, 3], 36),
    ],
  }),
  eagle: surface({
    id: 'eagle', site: 'eagle',
    rover: {
      start: { x: -3, z: -3, heading: 0.5 }, path: [[-3, -3], [-1, -0.5], [1.5, 3], [3.2, 6]], drive: [{ t0: 0.05, t1: 0.45, s0: 0, s1: 1 }], dust: 0.04,
      arm: [{ t: 0, pose: 'stow' }, { t: 0.5, pose: 'reach' }, { t: 0.6, pose: 'apxs' }, { t: 0.72, pose: 'mi' }, { t: 0.88, pose: 'rat' }, { t: 0.98, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.5, 30, 0], [0.8, -30, 0]),
    },
    markers: [{ label: 'Landing platform', sub: 'Reconstructed position', p: [0, 0], showAt: 0 }, { label: 'Outcrop', sub: 'Layered bedrock', p: [3.5, 8.2], showAt: 0.3 }],
    shots: [
      dolly(0, 0.28, 'world', [-24, 22, -30], [0, 0, 0], [-11, 8, -15], [0, 0.5, 0], 40),
      dolly(0.28, 0.55, 'rover', [2.8, 1.1, -3.2], [0, 0.6, 1], [-2.8, 1.0, -2.2], [0, 0.6, 0.6], 38),
      dolly(0.55, 1, 'rover', [-2.7, 1.2, 2.6], [0, 0.35, 1.2], [-2.0, 0.9, 2.5], [0, 0.35, 1.3], 36),
    ],
  }),
  water: surface({
    id: 'water', site: 'water',
    rover: {
      start: { x: 1.5, z: 3.2, heading: 0.25 }, path: [[1.5, 3.2], [2.4, 5.8]], drive: [{ t0: 0.08, t1: 0.3, s0: 0, s1: 1 }], dust: 0.05,
      arm: [{ t: 0, pose: 'stow' }, { t: 0.34, pose: 'reach' }, { t: 0.5, pose: 'mi' }, { t: 0.72, pose: 'rat' }, { t: 0.9, pose: 'apxs' }],
      mast: roverMast([0, -20, 0], [0.4, 25, 0]),
    },
    markers: [{ label: 'Sedimentary outcrop', sub: 'Illustrative placement', p: [3.2, 8.4], showAt: 0.2 }, { label: 'Hematite spherules', sub: 'Illustrative placement', p: [2.5, 6.4], showAt: 0.5 }],
    shots: [
      dolly(0, 0.3, 'rover', [-3.2, 1.6, -3.2], [0, 0.5, 1], [-2.2, 1.0, -1.5], [0, 0.4, 1.2], 38),
      dolly(0.3, 0.62, 'rover', [-0.5, 0.35, 1.4], [0.1, 0.3, 1.5], [-0.15, 0.22, 1.7], [0.1, 0.18, 1.8], 28),
      dolly(0.62, 1, 'rover', [-1.9, 0.5, 2.1], [0, 0.3, 1.3], [-1.3, 0.35, 2.3], [0, 0.35, 1.4], 30),
    ],
  }),
  endurance: surface({
    id: 'endurance', site: 'endurance',
    rover: {
      start: { x: -4, z: -14, heading: 0.1 }, path: [[-4, -14], [-2, 4], [3, 22], [8, 40]], drive: [{ t0: 0.18, t1: 0.9, s0: 0, s1: 1 }], dust: 0.15, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.3, 35, 0], [0.6, -35, 0], [0.9, 0, 0]),
    },
    markers: [{ label: 'Endurance crater', sub: '≈130 m across · reconstructed', p: [0, 78], showAt: 0 }],
    shots: [
      dolly(0, 0.34, 'world', [-120, 90, -90], [0, 0, 70], [-60, 55, -40], [0, -6, 70], 42),
      dolly(0.34, 0.66, 'rover', [5.5, 1.8, -7.5], [0, 0.6, 2], [-5.5, 2.0, -6.5], [0, 0.6, 3], 36),
      dolly(0.66, 1, 'rover-pos', [10, 18, -24], [0, 4, 14], [-8, 30, -34], [0, -2, 40], 42),
    ],
  }),
  purgatory: surface({
    id: 'purgatory', site: 'purgatory',
    rover: {
      start: { x: -6, z: -6, heading: 0.7 }, path: [[-6, -6], [-0.4, -0.3]],
      drive: [{ t0: 0.04, t1: 0.3, s0: 0, s1: 0.86 }, { t0: 0.72, t1: 0.96, s0: 0.86, s1: 0.4 }], spin: [{ t0: 0.34, t1: 0.7 }], dust: 0.2, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.5, 40, 0]),
    },
    shots: [
      dolly(0, 0.3, 'rover-pos', [9, 2.6, -2], [0, 0.4, 0], [5, 1.2, 4], [0, 0.4, 0], 40),
      orbit(0.3, 0.7, 4.2, 2.8, 0.4, 2.8, 1.0, 0.45, 0.2, 34),
      dolly(0.7, 1, 'rover-pos', [-8, 3, -4], [0, 0.5, 0], [-6, 1.2, 1], [0, 0.4, 0], 38),
    ],
  }),
  victoria: surface({
    id: 'victoria', site: 'victoria',
    rover: {
      start: { x: -35, z: 4, heading: 1.15 }, path: [[-35, 4], [-18, 12], [-2, 12], [14, 18]], drive: [{ t0: 0.1, t1: 0.9, s0: 0, s1: 1 }], dust: 0.2, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.4, 30, 0], [0.8, -30, 0]),
    },
    markers: [{ label: 'Victoria crater', sub: 'scaled reconstruction · real diameter ≈ 800 m', p: [0, 100], showAt: 0 }],
    shots: [
      dolly(0, 0.4, 'world', [-120, 120, -80], [0, 0, 90], [-50, 36, -30], [0, -10, 100], 42),
      dolly(0.4, 0.7, 'rover', [3.2, 1.0, -4], [0, 0.6, 3], [-3, 1.4, -3.2], [0, 0.6, 3], 36),
      orbit(0.7, 1, 40, 70, 0.2, 1.4, 60, 90, -20, 44, [0, 0, 70]),
    ],
  }),
  endeavour: surface({
    id: 'endeavour', site: 'endeavour',
    rover: {
      start: { x: -42, z: -34, heading: 0.9 }, path: [[-42, -34], [-25, -18], [-8, -6], [6, 2]], drive: [{ t0: 0.08, t1: 0.82, s0: 0, s1: 1 }], dust: 0.25, arm: [{ t: 0, pose: 'stow' }, { t: 0.9, pose: 'reach' }],
      mast: roverMast([0, 0, 0], [0.85, 45, 0]),
    },
    markers: [{ label: 'Spirit Point', sub: 'First rim goal · illustrative placement', p: [10, 4], showAt: 0.5 }],
    shots: [
      dolly(0, 0.36, 'world', [-140, 70, -110], [0, 12, 0], [-80, 36, -60], [0, 8, 0], 42),
      dolly(0.36, 0.7, 'rover', [-3.2, 1.2, -4.2], [0, 0.7, 3], [3.4, 1.0, -3.2], [0, 0.7, 3], 36),
      dolly(0.7, 1, 'rover', [2.4, 0.7, 3.6], [0, 0.5, 0], [-2.0, 0.9, 3.2], [0, 0.6, 0], 34),
    ],
  }),
  'cape-york': surface({
    id: 'cape-york', site: 'cape-york',
    rover: {
      start: { x: -20, z: -4, heading: 1.3 }, path: [[-20, -4], [-10, 2], [-2, 6], [4, 10]], drive: [{ t0: 0.05, t1: 0.5, s0: 0, s1: 1 }], dust: 0.2,
      arm: [{ t: 0, pose: 'stow' }, { t: 0.55, pose: 'reach' }, { t: 0.66, pose: 'mi' }, { t: 0.8, pose: 'rat' }, { t: 0.95, pose: 'apxs' }],
      mast: roverMast([0, 0, 0], [0.5, 35, 0]),
    },
    markers: [{ label: 'Homestake vein', sub: 'Illustrative placement', p: [7, 14], showAt: 0.4 }, { label: 'Esperance', sub: 'Illustrative placement', p: [-6, 20], showAt: 0.75 }],
    shots: [
      dolly(0, 0.32, 'world', [-60, 36, -40], [0, 2, 8], [-34, 14, -22], [0, 1, 8], 40),
      dolly(0.32, 0.58, 'rover', [-3.2, 1.0, -3.6], [0, 0.6, 3], [3.0, 1.0, -3.4], [0, 0.6, 3], 36),
      dolly(0.58, 1, 'rover', [-2.8, 1.1, 3.0], [0, 0.35, 1.4], [-2.0, 0.8, 2.8], [0, 0.35, 1.4], 34),
    ],
  }),
  marathon: surface({
    id: 'marathon', site: 'marathon',
    rover: {
      start: { x: -60, z: -26, heading: 1.0 }, path: [[-60, -26], [-40, -12], [-20, 4], [0, 20], [18, 36]], drive: [{ t0: 0.04, t1: 0.88, s0: 0, s1: 1 }], dust: 0.22, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.5, 25, 0], [0.9, -25, 0]),
    },
    markers: [{ label: '42.195 km', sub: 'Marathon distance · Mar 24, 2015', p: [-4, 12], showAt: 0.45 }, { label: 'Marathon Valley', sub: 'Illustrative placement', p: [30, 70], showAt: 0.2 }],
    shots: [
      dolly(0, 0.34, 'world', [-120, 60, -90], [0, 6, 20], [-80, 30, -60], [0, 6, 28], 40),
      dolly(0.34, 0.7, 'rover', [4, 1.0, -5], [0, 0.6, 3], [-4, 1.2, -4], [0, 0.6, 3], 34, 42),
      dolly(0.7, 1, 'rover-pos', [-12, 4, -4], [0, 0.6, 0], [-30, 30, -20], [20, 6, 40], 42, 44),
    ],
  }),
  valleys: surface({
    id: 'valleys', site: 'valleys',
    rover: {
      start: { x: 18, z: 2, heading: -1.25 }, path: [[18, 2], [8, 0], [-2, 1], [-14, -1.2], [-26, 0]], drive: [{ t0: 0.06, t1: 0.9, s0: 0, s1: 1 }], dust: 0.25, arm: [{ t: 0, pose: 'stow' }, { t: 0.92, pose: 'reach' }],
      mast: roverMast([0, 0, 0], [0.4, -35, 0], [0.8, 35, 0]),
    },
    markers: [{ label: 'Perseverance Valley', sub: 'Reconstruction', p: [-20, 0], showAt: 0.2 }],
    shots: [
      dolly(0, 0.34, 'world', [60, 40, -50], [0, 0, 0], [34, 20, -24], [-10, 0, 0], 40),
      dolly(0.34, 0.68, 'rover', [2.6, 1.0, -4], [0, 0.6, 3], [-3, 1.2, -3.2], [0, 0.6, 3], 34),
      dolly(0.68, 1, 'rover-pos', [10, 2, 6], [-20, 0, 0], [-5, 3, 8], [-30, 0, 0], 36),
    ],
  }),
  'dust-storm': surface({
    id: 'dust-storm', site: 'dust-storm',
    rover: {
      start: { x: -26, z: 0, heading: -1.45 }, path: [[-26, 0], [-27.5, 0]], drive: [{ t0: 0.02, t1: 0.1, s0: 0, s1: 1 }], dust: 0.45, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.4, 50, 0], [0.8, 0, 0]),
    },
    markers: [],
    shots: [
      dolly(0, 0.4, 'rover', [7, 1.5, 9], [0, 0.6, 0], [4.6, 1.1, 5.6], [0, 0.7, 0], 38),
      orbit(0.4, 0.75, 6, 5, 0.8, 2.6, 1.5, 1.0, 0.7, 36),
      dolly(0.75, 1, 'rover', [-3.4, 0.7, -3.4], [0, 0.7, 0], [-2.8, 0.7, -2.6], [0, 0.8, 0], 34),
    ],
  }),
  'final-signal': surface({
    id: 'final-signal', site: 'final-signal',
    rover: {
      start: { x: -26, z: 0, heading: -1.45 }, path: [[-26, 0], [-27.5, 0]], drive: [], dust: 0.5, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0], [0.5, -20, 4], [0.8, 20, 4]),
    },
    markers: [{ label: 'Sol 5111', sub: 'Last communication · June 10, 2018', p: [-26, 0], showAt: 0.6 }],
    shots: [
      dolly(0, 0.35, 'rover-pos', [-20, 1.6, -14], [-26, 0.8, 0], [-26, 1.4, -8], [-26, 0.8, 0], 40),
      orbit(0.35, 0.8, 7, 4.5, 3.6, 5.6, 1.6, 0.9, 0.7, 34),
      dolly(0.8, 1, 'rover', [-3.5, 0.9, -4.5], [0, 0.9, 0], [-4.2, 1.2, -7], [0, 1.2, 0], 36, 30),
    ],
  }),
  conclusion: surface({
    id: 'conclusion', site: 'final-signal',
    rover: {
      start: { x: -26, z: 0, heading: -1.45 }, path: [[-26, 0], [-27.5, 0]], drive: [], dust: 0.5, arm: [{ t: 0, pose: 'stow' }],
      mast: roverMast([0, 0, 0]),
    },
    markers: [{ label: 'Perseverance Valley', sub: 'Opportunity’s final resting place · reconstruction', p: [-26, 0], showAt: 0.5 }],
    shots: [
      dolly(0, 0.4, 'rover-pos', [-10, 1.8, -7], [-26, 0.8, 0], [-26, 3, -9], [-26, 0.9, 0], 38),
      orbit(0.4, 1, 10, 150, 4.2, 6.4, 3, 90, 0.6, 40),
    ],
  }),
};

export const sceneById = (id: string) => SCENES[id];
