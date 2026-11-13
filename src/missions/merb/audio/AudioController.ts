import type { AudioPolicy, MediaEntry } from '../data/types';

/**
 * Audio policy
 *  - NO music, NO soundtrack, NO synthesised or AI-generated effects. Nothing here generates sound.
 *  - The only audible material is the original audio track of archival NASA/JPL video, played exactly as published.
 *  - 'native'            raw archive audio (e.g. launch tracker footage)             → audible when enabled
 *  - 'feature-narration' narrated NASA TV feature; music bed unverified              → muted unless allowNarratedFeatureAudio
 *  - 'muted'             never audible (e.g. animation soundtrack)
 *  - 3D scenes of space and Mars are SILENT: space has no sound and Opportunity carried no microphone.
 */
export class AudioController {
  private enabled: boolean;
  private volume = 0.8;
  private tracked = new Map<HTMLMediaElement, { policy: AudioPolicy; gain: number; target: number }>();
  private raf = 0;
  locked = false;
  onChange?: () => void;

  constructor(enabled: boolean, private allowNarrated = false) { this.enabled = enabled; }

  isEnabled() { return this.enabled; }
  setEnabled(v: boolean) { this.enabled = v; this.locked = false; this.apply(); this.onChange?.(); }
  setVolume(v: number) { this.volume = Math.min(1, Math.max(0, v)); this.apply(); }
  /** Does this entry play audible sound under the current settings? */
  audible(e: MediaEntry | undefined) { return !!e && this.policyAudible(e.audio ?? 'muted'); }
  private policyAudible(p: AudioPolicy) { return this.enabled && (p === 'native' || (p === 'feature-narration' && this.allowNarrated)); }

  attach(video: HTMLVideoElement, entry: MediaEntry) {
    this.tracked.set(video, { policy: entry.audio ?? 'muted', gain: 0, target: 1 });
    this.applyOne(video);
  }
  detach(video: HTMLVideoElement) { this.tracked.delete(video); }
  /** Fade a video's audio in/out (used at plate boundaries). */
  fade(video: HTMLVideoElement, to: number) {
    const t = this.tracked.get(video); if (!t) return; t.target = to; cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.tick());
  }
  private tick() {
    let busy = false;
    for (const [v, t] of this.tracked) {
      if (Math.abs(t.gain - t.target) > 0.01) { t.gain += (t.target - t.gain) * 0.18; busy = true; } else t.gain = t.target;
      this.applyOne(v);
    }
    if (busy) this.raf = requestAnimationFrame(() => this.tick());
  }
  private applyOne(v: HTMLMediaElement) {
    const t = this.tracked.get(v); if (!t) return;
    const aud = this.policyAudible(t.policy);
    v.muted = !aud || this.locked;
    v.volume = aud ? Math.min(1, this.volume * Math.max(0.0001, t.gain || 0.0001)) : 0;
  }
  apply() { for (const v of this.tracked.keys()) this.applyOne(v); }

  /** play() that survives autoplay policies; falls back to muted playback and flags `locked`. */
  async play(v: HTMLVideoElement): Promise<void> {
    try { await v.play(); }
    catch { if (this.enabled) { this.locked = true; this.applyOne(v); this.onChange?.(); } try { await v.play(); } catch { /* not playable */ } }
  }
  dispose() { cancelAnimationFrame(this.raf); this.tracked.clear(); }
}
