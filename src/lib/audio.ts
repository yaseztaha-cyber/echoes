/**
 * ECHOES Spatial Audio Engine.
 * Sound effects only — no music, no soundtrack, no ambient musical pads.
 * All sounds are generated via Web Audio API or loaded from attributed sources.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let envGain: GainNode | null = null;
let mechGain: GainNode | null = null;
let commGain: GainNode | null = null;
let uiGain: GainNode | null = null;
let enabled = true;
let listener: AudioListener | null = null;

export function setAudioEnabled(v: boolean) {
  enabled = v;
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(v ? 1 : 0, ctx.currentTime);
  }
}

export function unlockAudio() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(ctx.destination);

      envGain = ctx.createGain();
      envGain.gain.value = 0.3;
      envGain.connect(masterGain);

      mechGain = ctx.createGain();
      mechGain.gain.value = 0.4;
      mechGain.connect(masterGain);

      commGain = ctx.createGain();
      commGain.gain.value = 0.6;
      commGain.connect(masterGain);

      uiGain = ctx.createGain();
      uiGain.gain.value = 0.25;
      uiGain.connect(masterGain);

      listener = ctx.listener;
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

export function sharedCtx(): AudioContext | null {
  return ctx;
}

export function getMasterGain(): GainNode | null { return masterGain; }
export function getEnvGain(): GainNode | null { return envGain; }
export function getMechGain(): GainNode | null { return mechGain; }
export function getCommGain(): GainNode | null { return commGain; }
export function getUiGain(): GainNode | null { return uiGain; }

export function setVolume(channel: "master" | "env" | "mech" | "comm" | "ui", value: number) {
  if (!ctx) return;
  const v = Math.max(0, Math.min(1, value));
  const gain = channel === "master" ? masterGain : channel === "env" ? envGain : channel === "mech" ? mechGain : channel === "comm" ? commGain : uiGain;
  if (gain) gain.gain.setValueAtTime(v, ctx.currentTime);
}

export function isAudioEnabled(): boolean { return enabled; }

/** Create a spatial panner for 3D positional audio. */
export function createSpatialPanner(x: number, y: number, z: number, maxDistance = 50): PannerNode | null {
  if (!ctx) return null;
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 5;
  panner.maxDistance = maxDistance;
  panner.rolloffFactor = 1.5;
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;
  panner.connect(envGain!);
  return panner;
}

/** Update listener position (camera) for spatial audio. */
export function updateListenerPosition(x: number, y: number, z: number, fx: number, fy: number, fz: number) {
  if (!ctx || !listener) return;
  listener.positionX.value = x;
  listener.positionY.value = y;
  listener.positionZ.value = z;
  listener.forwardX.value = fx;
  listener.forwardY.value = fy;
  listener.forwardZ.value = fz;
  listener.upX.value = 0;
  listener.upY.value = 1;
  listener.upZ.value = 0;
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = "sine", delay = 0, to?: number, gainNode?: GainNode | null) {
  if (!enabled || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(gainNode ?? masterGain!);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, filterFreq: number, gainNode?: GainNode | null) {
  if (!enabled || !ctx) return;
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  src.connect(filter).connect(g).connect(gainNode ?? masterGain!);
  src.start();
  src.stop(ctx.currentTime + dur);
}

export const sfx = {
  select: () => tone(880, 0.07, 0.025, "triangle", 0, undefined, uiGain),
  open: () => tone(300, 0.18, 0.03, "sine", 0, 520, uiGain),
  close: () => tone(520, 0.14, 0.025, "sine", 0, 300, uiGain),
  confirm: () => {
    tone(660, 0.09, 0.03, "triangle", 0, undefined, uiGain);
    tone(990, 0.12, 0.03, "triangle", 0.08, undefined, uiGain);
  },
  data: () => {
    tone(1200, 0.04, 0.015, "square", 0, undefined, uiGain);
    tone(1600, 0.04, 0.012, "square", 0.05, undefined, uiGain);
  },
  event: () => tone(440, 0.4, 0.035, "sine", 0, 330, commGain),
  source: () => tone(740, 0.1, 0.025, "triangle", 0, 980, uiGain),
  shutter: () => {
    tone(2000, 0.04, 0.02, "square", 0, undefined, uiGain);
    tone(1200, 0.06, 0.015, "square", 0.06, undefined, uiGain);
  },
  // Mechanical rover sounds
  wheelMove: () => noise(0.15, 0.015, 800, mechGain),
  armMove: () => tone(180, 0.2, 0.02, "sawtooth", 0, 220, mechGain),
  instrumentActivate: () => tone(1000, 0.15, 0.02, "sine", 0, 1400, mechGain),
  // Environment sounds (subtle, event-driven, no loops)
  marsWind: () => noise(0.8, 0.008, 400, envGain),
  moonSilence: () => { /* intentional silence — Moon has no atmosphere */ },
  spaceSilence: () => { /* intentional silence — space is silent */ },
  // Launch sounds
  launchIgnition: () => {
    noise(0.5, 0.04, 200, envGain);
    tone(60, 0.8, 0.03, "sawtooth", 0.1, 40, envGain);
  },
  // Communication
  commBeep: () => tone(1000, 0.08, 0.03, "square", 0, undefined, commGain),
  commStatic: () => noise(0.3, 0.012, 3000, commGain),
};

/** Environment sound profile — determines which sounds are appropriate for each world. */
export type SoundEnvironment = "space" | "moon" | "mars" | "earth" | "venus" | "gas-giant";

export const ENV_SOUND_PROFILES: Record<SoundEnvironment, { ambient: boolean; wind: boolean; mechanical: boolean; comm: boolean }> = {
  space: { ambient: false, wind: false, mechanical: false, comm: true },
  moon: { ambient: false, wind: false, mechanical: true, comm: true },
  mars: { ambient: false, wind: true, mechanical: true, comm: true },
  earth: { ambient: true, wind: true, mechanical: true, comm: true },
  venus: { ambient: false, wind: false, mechanical: true, comm: true },
  "gas-giant": { ambient: false, wind: false, mechanical: false, comm: true },
};

/** Audio asset manifest — tracks sound sources and authenticity. */
export interface AudioAsset {
  id: string;
  name: string;
  category: "ENVIRONMENT" | "MECHANICAL" | "INSTRUMENT" | "COMMUNICATION" | "LAUNCH" | "LANDING" | "ARCHIVAL" | "INTERFACE" | "CINEMATIC";
  source: "generated" | "nasa" | "reconstructed" | "licensed";
  authentic: boolean;
  mission?: string;
  description: string;
}

export const AUDIO_ASSET_MANIFEST: AudioAsset[] = [
  { id: "ui-select", name: "UI Select", category: "INTERFACE", source: "generated", authentic: false, description: "Subtle triangle tone for selection" },
  { id: "ui-open", name: "UI Open", category: "INTERFACE", source: "generated", authentic: false, description: "Rising sine tone for panel open" },
  { id: "ui-close", name: "UI Close", category: "INTERFACE", source: "generated", authentic: false, description: "Falling sine tone for panel close" },
  { id: "ui-confirm", name: "UI Confirm", category: "INTERFACE", source: "generated", authentic: false, description: "Two-tone confirmation" },
  { id: "mars-wind-subtle", name: "Mars Wind (subtle)", category: "ENVIRONMENT", source: "generated", authentic: false, mission: "general", description: "Low-pass filtered noise — labelled as ECHOES interpretation, NOT a real Mars recording" },
  { id: "rover-wheel", name: "Rover Wheel", category: "MECHANICAL", source: "generated", authentic: false, description: "Brief noise burst for wheel movement" },
  { id: "rover-arm", name: "Rover Arm", category: "MECHANICAL", source: "generated", authentic: false, description: "Sawtooth sweep for arm movement" },
  { id: "launch-ignition", name: "Launch Ignition", category: "LAUNCH", source: "generated", authentic: false, description: "Low-frequency rumble + noise — ECHOES interpretation" },
  { id: "comm-beep", name: "Communication Beep", category: "COMMUNICATION", source: "generated", authentic: false, description: "Square wave beep for comm" },
  { id: "comm-static", name: "Communication Static", category: "COMMUNICATION", source: "generated", authentic: false, description: "Filtered noise for radio static" },
];
