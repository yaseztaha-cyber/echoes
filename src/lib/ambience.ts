/**
 * Ambient audio — a generated interface layer, never a recording.
 * Honesty rules:
 * - Interplanetary space is silent; the solar/deep-space bed is a faint
 *   observatory drone clearly below the sfx level.
 * - The lunar surface is airless, so there is no wind there — only the
 *   in-suit life-support pulse the wearer would actually hear.
 * - Mars has a documented thin wind (InSight recorded it); the ambient bed
 *   there is a synthesized stand-in, never presented as the real recording.
 */
import { sharedCtx } from "./audio";

export type AmbienceKind = "off" | "void" | "orbit" | "mars" | "moon";

interface Bed {
  master: GainNode;
  droneGain: GainNode;
  windGain: GainNode;
  pulse: () => void;
}

let bed: Bed | null = null;
let pulsing = false;
let pulseTimer = 0;

function build(ctx: AudioContext, noise: AudioBuffer): Bed {
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // slow observatory drone: two detuned low sines
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  const a = ctx.createOscillator();
  a.type = "sine";
  a.frequency.value = 55;
  const b = ctx.createOscillator();
  b.type = "sine";
  b.frequency.value = 55.6;
  const dg = ctx.createGain();
  dg.gain.value = 0.5;
  a.connect(dg);
  b.connect(dg);
  dg.connect(lp).connect(droneGain).connect(master);
  a.start();
  b.start();

  // air trace: filtered looped noise for the Mars wind stand-in
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 420;
  bp.Q.value = 0.6;
  const drift = ctx.createOscillator();
  drift.type = "sine";
  drift.frequency.value = 0.07;
  const driftAmt = ctx.createGain();
  driftAmt.gain.value = 0.014;
  drift.connect(driftAmt).connect(bp.frequency);
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  src.connect(bp).connect(windGain).connect(master);
  src.start();
  drift.start();

  // suit life-support pulse: scheduled soft thud, only used on airless sites
  const pulse = () => {
    if (!pulsing) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(96, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.018, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.2);
  };

  return { master, droneGain, windGain, pulse };
}

function level(ctx: AudioContext, node: GainNode, v: number) {
  node.gain.setTargetAtTime(v, ctx.currentTime, 0.8);
}

/** Switch the ambient bed. Safe to call repeatedly; no-op until audio is unlocked. */
export function setAmbience(kind: AmbienceKind) {
  (window as any).__echoesAmb = kind;
  const ctx = sharedCtx();
  if (!ctx) return;
  if (!bed) {
    const len = 2 * ctx.sampleRate;
    const noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    // pink-ish: simple two-stage smoothing of white noise
    let la = 0;
    let lb = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      la = 0.9 * la + 0.1 * w;
      lb = 0.96 * lb + 0.04 * la;
      d[i] = lb * 1.6;
    }
    bed = build(ctx, noise);
  }
  const b = bed;
  if (kind === "off") {
    level(ctx, b.droneGain, 0);
    level(ctx, b.windGain, 0);
    pulsing = false;
    clearInterval(pulseTimer);
    pulseTimer = 0;
    return;
  }
  level(ctx, b.droneGain, kind === "void" ? 0.02 : 0.032);
  level(ctx, b.windGain, kind === "mars" ? 0.05 : 0);
  const wantPulse = kind === "moon";
  if (wantPulse && !pulsing) {
    pulsing = true;
    pulseTimer = window.setInterval(b.pulse, 3400);
  } else if (!wantPulse && pulsing) {
    pulsing = false;
    clearInterval(pulseTimer);
    pulseTimer = 0;
  }
}
