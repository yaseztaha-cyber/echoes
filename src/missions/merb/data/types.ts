/**
 * Shared data contracts. Everything the journey plays (chapters, scenes, media)
 * is plain, serialisable data defined against these types.
 *
 * COORDINATE FRAMES (see docs/INTEGRATION.md)
 *  - Scene-local frame: right-handed, +Y up, 1 unit = 1 metre, origin at the scene's focus.
 *  - Rover frame: forward = +Z, up = +Y, left = +X.
 *  The module never writes to a host scene graph; it owns a private THREE.Scene.
 */

export type MediaKind = 'photograph' | 'image' | 'stereo' | 'orbital-image' | 'map' | 'simulation' | 'animation' | 'video';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AudioPolicy = 'native' | 'feature-narration' | 'muted';

export interface ImageRecord {
  id: string;
  kind: MediaKind;
  chapters: string[];
  title: string;
  url: string;
  credit: string;
  date: string;
  caption: string;
  sourcePage: string;
}

export interface VideoRecord {
  id: string;
  kind: 'video' | 'animation';
  chapters: string[];
  title: string;
  url: string;
  poster?: string;
  credit: string;
  date: string;
  caption: string;
  sourcePage: string;
  /** native: raw camera/archive audio. feature-narration: narrated NASA TV feature. muted: audio never played. */
  audio: AudioPolicy;
  audioNote: string;
}

export interface MediaEntry {
  id: string;
  mediaType: 'image' | 'video';
  kind: MediaKind;
  chapters: string[];
  title: string;
  url: string;
  poster?: string;
  credit: string;
  date: string;
  caption: string;
  sourcePage: string;
  license: string;
  audio?: AudioPolicy;
  audioNote?: string;
}

export interface Plate {
  mediaId: string;
  /** seconds from chapter start */
  at: number;
  dur: number;
  /** For video: source clip in seconds. */
  clip?: [number, number];
  motion?: 'push' | 'drift-left' | 'drift-right' | 'still';
  /** Where the plate is composed over the 3D world. */
  frame?: 'right' | 'left' | 'wide';
}

export interface NarrationLine { at: number; dur: number; text: string }
export interface Fact { label: string; value: string; status: 'documented' | 'reconstruction' }
export interface Milestone { date: string; title: string; text: string; mediaId?: string }
export interface Discovery { title: string; text: string; mediaId?: string }

export interface Chapter {
  id: string;
  number: number;
  title: string;
  /** Large editorial date line. */
  dateLabel: string;
  /** Short label for the timeline ruler. */
  rulerLabel: string;
  sceneId: string;
  duration: number;
  narration: NarrationLine[];
  facts: Fact[];
  milestones: Milestone[];
  discoveries: Discovery[];
  plates: Plate[];
  /** True when the real mission had (and we show) no audible sound at this point. */
  silenceNote?: string;
}

/* ------------------------------ scene data ------------------------------ */
export type V3 = [number, number, number];

export type Shot =
  | { kind: 'dolly'; t0: number; t1: number; space: 'world' | 'rover' | 'rover-pos'; from: { p: V3; l: V3; fov?: number }; to: { p: V3; l: V3; fov?: number }; ease?: 'inout' | 'out' | 'linear' }
  | { kind: 'orbit'; t0: number; t1: number; center: V3 | 'rover'; r0: number; r1: number; a0: number; a1: number; h0: number; h1: number; lookUp?: number; fov?: number };

export interface RoverWindow { t0: number; t1: number; s0: number; s1: number }
export interface ArmKey { t: number; pose: 'stow' | 'reach' | 'rat' | 'mi' | 'apxs' }
export interface MastKey { t: number; pan: number; tilt: number }
export interface RoverScript {
  start: { x: number; z: number; heading: number };
  path: Array<[number, number]>;
  drive: RoverWindow[];
  spin?: Array<{ t0: number; t1: number }>;
  arm?: ArmKey[];
  mast?: MastKey[];
  deploy?: { t0: number; t1: number };
  /** 0..1 how much dust covers the arrays. */
  dust: number;
  hidden?: boolean;
  /** drive-direction: true for driving in reverse (Opportunity drove backwards in some phases) */
  reverse?: boolean;
  /** metres the rover starts raised on the lander platform, rolling off during the first 30% of the path */
  platformLift?: number;
}

export interface MarkerDef {
  label: string;
  sub?: string;
  p: [number, number];
  /** appears when chapter progress passes this */
  showAt?: number;
}

export type SceneKind = 'hall' | 'launch' | 'cruise' | 'approach' | 'edl' | 'surface';
export interface SceneDef {
  id: string;
  kind: SceneKind;
  siteId?: string;
  shots: Shot[];
  rover?: RoverScript;
  markers?: MarkerDef[];
  /** What the viewer is looking at is a reconstruction */
  provenance: string;
}

export interface FeatureDef {
  type: 'bowl' | 'ridge' | 'slope' | 'valley' | 'scallop-bowl' | 'dunes' | 'outcrop-ring';
  x: number; z: number; r: number; depth: number; rim?: number; angle?: number; width?: number; n?: number;
}
export interface SiteDef {
  id: string;
  label: string;
  seed: number;
  ripple: number;
  rippleFreq: number;
  features: FeatureDef[];
  palette: { low: [number, number, number]; high: [number, number, number]; rock: [number, number, number] };
  sky: { zenith: [number, number, number]; horizon: [number, number, number]; sunElev: number; sunAzim: number; sunColor: [number, number, number]; sunIntensity: number; fog: number; dust: number };
  rocks: number;
  spherules: number;
  slabs: number;
}

export interface QualityProfile {
  id: 'low' | 'medium' | 'high';
  pixelRatioCap: number;
  terrainSegments: number;
  shadows: boolean;
  shadowMap: number;
  rocks: number;
  stars: number;
  plume: number;
  antialias: boolean;
  targetFps: number;
}
