import { CHAPTERS } from '../data/chapters';
import { MediaManifest } from '../data/media';
import type { Chapter } from '../data/types';
import { AudioController } from '../audio/AudioController';
import { SceneController } from '../three/SceneController';
import { AdaptiveQuality } from './quality';

export type Mode = 'cinematic' | 'interactive';
export interface JourneyOptions {
  /** Start in this mode (default 'cinematic'). */
  mode?: Mode;
  /** Begin playback immediately on mount (browsers may require a gesture for sound). Default false. */
  autoplay?: boolean;
  /** Initial chapter id. */
  startChapter?: string;
  /** Initial audio state. Default true (archival audio only; space/Mars scenes are always silent). */
  audio?: boolean;
  /** 'auto' picks a tier from the GPU; the adaptive system can step down at runtime. */
  quality?: 'auto' | 'low' | 'medium' | 'high';
  adaptiveQuality?: boolean;
  /** Allow narrated NASA TV feature audio (music bed unverified, so off by default). */
  allowNarratedFeatureAudio?: boolean;
  /** Show the built-in documentary UI. Set false to drive the module headlessly from the host. */
  ui?: boolean;
  /** Frame cap. Default 30. */
  targetFps?: number;
  /** Fired for host integration. */
  onEvent?: (e: JourneyEvent) => void;
}
export type JourneyEvent =
  | { type: 'chapter'; chapter: Chapter; index: number }
  | { type: 'state'; playing: boolean; mode: Mode }
  | { type: 'time'; chapterTime: number; chapter: Chapter }
  | { type: 'transition'; active: boolean; chapter: Chapter }
  | { type: 'ended' }
  | { type: 'quality'; level: 'low' | 'medium' | 'high' };

type Listener = (e: JourneyEvent) => void;

/** Timeline state machine. UI, scene, media and audio all hang off this single source of truth. */
export class JourneyController {
  readonly manifest = new MediaManifest();
  readonly audio: AudioController;
  readonly scene: SceneController;
  readonly chapters = CHAPTERS;
  private listeners = new Set<Listener>();
  private adaptive: AdaptiveQuality;
  index = 0;
  chapterTime = 0;
  playing = false;
  mode: Mode;
  transitioning = true;
  ended = false;
  private raf = 0;
  private last = 0; private lastRender = 0;
  private token = 0;
  private destroyed = false;
  private visible = true;
  private io?: IntersectionObserver;
  private targetFps: number;
  fps = 0; private fpsAcc = 0; private fpsN = 0;
  private onVis = () => { if (document.hidden && this.playing) this.pause(); };

  constructor(readonly container: HTMLElement, readonly opts: JourneyOptions = {}) {
    this.mode = opts.mode ?? 'cinematic';
    this.targetFps = opts.targetFps ?? 30;
    this.audio = new AudioController(opts.audio ?? true, opts.allowNarratedFeatureAudio ?? false);
    this.scene = new SceneController(container, opts.quality ?? 'auto');
    this.scene.setInteractive(this.mode === 'interactive');
    if (opts.onEvent) this.listeners.add(opts.onEvent);
    this.adaptive = new AdaptiveQuality(
      (to) => { void this.scene.setQuality(to, this.chapter).then(() => this.emit({ type: 'quality', level: to })); },
      () => this.scene.qualityLevel, opts.adaptiveQuality ?? true,
    );
    document.addEventListener('visibilitychange', this.onVis);
    if ('IntersectionObserver' in window) { this.io = new IntersectionObserver((es) => { this.visible = es[0]?.isIntersecting ?? true; }); this.io.observe(container); }
    const start = opts.startChapter ? Math.max(0, CHAPTERS.findIndex((c) => c.id === opts.startChapter)) : 0;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    void this.goTo(start, { play: !!opts.autoplay });
  }

  get chapter(): Chapter { return CHAPTERS[this.index]; }
  on(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(e: JourneyEvent) { this.listeners.forEach((l) => l(e)); }

  /* ------------------------------ public controls ------------------------------ */
  play() {
    if (this.destroyed) return;
    if (this.ended) { void this.goTo(0, { play: true }); return; }
    if (this.mode === 'interactive' && this.chapterTime >= this.chapter.duration - 0.05) { this.chapterTime = 0; }
    this.playing = true; this.emit({ type: 'state', playing: true, mode: this.mode });
  }
  pause() { this.playing = false; this.emit({ type: 'state', playing: false, mode: this.mode }); }
  toggle() { this.playing ? this.pause() : this.play(); }
  seekToChapter(id: string | number, play = this.playing) {
    const i = typeof id === 'number' ? id : CHAPTERS.findIndex((c) => c.id === id);
    if (i < 0 || i >= CHAPTERS.length) return Promise.resolve();
    return this.goTo(i, { play });
  }
  next() { return this.index < CHAPTERS.length - 1 ? this.goTo(this.index + 1, { play: this.playing }) : Promise.resolve(); }
  prev() { return this.chapterTime > 3 ? this.replay() : this.goTo(Math.max(0, this.index - 1), { play: this.playing }); }
  replay() { return this.goTo(this.index, { play: true, sameScene: true }); }
  /** scrub inside the current chapter (seconds) */
  seekTime(sec: number) { this.chapterTime = Math.min(this.chapter.duration, Math.max(0, sec)); this.ended = false; this.emit({ type: 'time', chapterTime: this.chapterTime, chapter: this.chapter }); }
  setMode(m: Mode) {
    this.mode = m; this.scene.setInteractive(m === 'interactive');
    if (m === 'cinematic') this.scene.resumeCinematic();
    this.emit({ type: 'state', playing: this.playing, mode: m });
  }
  setAudioEnabled(v: boolean) { this.audio.setEnabled(v); }

  async setQualityLevel(l: 'low' | 'medium' | 'high') { await this.scene.setQuality(l, this.chapter); this.emit({ type: 'quality', level: l }); }

  /* --------------------------------- navigation --------------------------------- */
  async goTo(index: number, o: { play: boolean; sameScene?: boolean }) {
    const my = ++this.token;
    const ch = CHAPTERS[index];
    this.playing = false; this.transitioning = true; this.ended = false;
    this.emit({ type: 'transition', active: true, chapter: ch });
    await new Promise((r) => setTimeout(r, 380));
    if (my !== this.token || this.destroyed) return;
    try { await this.scene.loadScene(ch); } catch (err) { console.error('[opportunity-journey] scene load failed', err); }
    if (my !== this.token || this.destroyed) return;
    // lazy media: first plates now, next chapter in the background
    const first = ch.plates.filter((p) => this.manifest.get(p.mediaId).mediaType === 'image').slice(0, 2);
    await Promise.race([Promise.all(first.map((p) => this.manifest.preload(p.mediaId))), new Promise((r) => setTimeout(r, 1500))]);
    if (my !== this.token || this.destroyed) return;
    this.index = index; this.chapterTime = 0;
    this.scene.render(0, 0);
    this.emit({ type: 'chapter', chapter: ch, index });
    this.transitioning = false;
    this.emit({ type: 'transition', active: false, chapter: ch });
    this.playing = o.play; this.last = performance.now();
    this.emit({ type: 'state', playing: this.playing, mode: this.mode });
    const nxt = CHAPTERS[index + 1];
    if (nxt) setTimeout(() => nxt.plates.forEach((p) => { if (!this.destroyed) void this.manifest.preload(p.mediaId); }), 2500);
  }

  /* ----------------------------------- loop ----------------------------------- */
  private loop = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    const interval = 1000 / this.targetFps;
    if (now - this.lastRender < interval - 2) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    const frameMs = now - this.lastRender;
    this.last = now; this.lastRender = now;
    if (!this.visible || this.transitioning) return;
    if (this.playing) {
      this.chapterTime += dt;
      if (this.chapterTime >= this.chapter.duration) {
        this.chapterTime = this.chapter.duration;
        if (this.mode === 'cinematic') {
          if (this.index < CHAPTERS.length - 1) { void this.goTo(this.index + 1, { play: true }); }
          else { this.playing = false; this.ended = true; this.emit({ type: 'state', playing: false, mode: this.mode }); this.emit({ type: 'ended' }); }
        } else { this.playing = false; this.emit({ type: 'state', playing: false, mode: this.mode }); }
      }
    }
    const t = this.chapter.duration > 0 ? this.chapterTime / this.chapter.duration : 0;
    this.scene.render(Math.min(1, t), dt);
    this.emit({ type: 'time', chapterTime: this.chapterTime, chapter: this.chapter });
    this.adaptive.push(frameMs, this.targetFps);
    this.fpsAcc += frameMs; this.fpsN++;
    if (this.fpsN >= 30) { this.fps = Math.round(1000 / (this.fpsAcc / this.fpsN)); this.fpsAcc = 0; this.fpsN = 0; }
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; this.token++;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVis);
    this.io?.disconnect();
    this.audio.dispose();
    this.scene.dispose();
    this.manifest.dispose();
    this.listeners.clear();
  }
}
