/** Quiet interface audio. No engines, no beeps-on-loop. Generated, nothing downloaded. */
let ctx: AudioContext | null = null;
let enabled = true;

export function setAudioEnabled(v: boolean) {
  enabled = v;
}
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = "sine", delay = 0, to?: number) {
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
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  select: () => tone(880, 0.07, 0.025, "triangle"),
  open: () => tone(300, 0.18, 0.03, "sine", 0, 520),
  close: () => tone(520, 0.14, 0.025, "sine", 0, 300),
  confirm: () => {
    tone(660, 0.09, 0.03, "triangle");
    tone(990, 0.12, 0.03, "triangle", 0.08);
  },
  data: () => {
    tone(1200, 0.04, 0.015, "square");
    tone(1600, 0.04, 0.012, "square", 0.05);
  },
  event: () => tone(440, 0.4, 0.035, "sine", 0, 330),
  source: () => tone(740, 0.1, 0.025, "triangle", 0, 980),
};
