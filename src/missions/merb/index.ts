/**
 * Public interface of the Opportunity (MER-B) journey module.
 * See docs/INTEGRATION.md. The module owns a private canvas + THREE.Scene inside `container`
 * and touches nothing else in the host page (CSS is namespaced under `.merb` and removed on destroy).
 */
import { CHAPTERS } from './data/chapters';
import { MEDIA_ENTRIES } from './data/media';
import type { Chapter, MediaEntry } from './data/types';
import { JourneyController, type JourneyEvent, type JourneyOptions, type Mode } from './core/JourneyController';
import { JourneyUI } from './ui/JourneyUI';

export type { JourneyOptions, JourneyEvent, Mode, Chapter, MediaEntry };
export { CHAPTERS, MEDIA_ENTRIES };

export interface OpportunityJourney {
  play(): void;
  pause(): void;
  toggle(): void;
  /** Jump to a chapter by id (see CHAPTERS) and optionally start playing it. */
  seekToChapter(chapterId: string, autoplay?: boolean): Promise<void>;
  /** Scrub inside the current chapter (seconds). */
  seekTime(seconds: number): void;
  setMode(mode: Mode): void;
  setAudioEnabled(enabled: boolean): void;
  setQuality(level: 'low' | 'medium' | 'high'): Promise<void>;
  on(listener: (e: JourneyEvent) => void): () => void;
  getState(): {
    chapterId: string; chapterIndex: number; chapterTime: number; chapterDuration: number; playing: boolean; mode: Mode; ended: boolean;
    audioEnabled: boolean; quality: 'low' | 'medium' | 'high'; fps: number;
    gpu: { geometries: number; textures: number; drawCalls: number; triangles: number };
    media: Array<{ id: string; status: string }>;
  };
  /** Stops the loop, releases GPU memory (geometries, textures, renderer + context), media elements and DOM. */
  destroy(): void;
}

export function mountOpportunityJourney(container: HTMLElement, options: JourneyOptions & { intro?: boolean } = {}): OpportunityJourney {
  if (!container) throw new Error('mountOpportunityJourney: container is required');
  const test = document.createElement('canvas');
  const webgl = !!(test.getContext('webgl2') || test.getContext('webgl'));
  if (!webgl) {
    container.innerHTML = '<div style="padding:40px;font:14px/1.5 sans-serif;color:#efe6d8;background:#070605;height:100%">WebGL is unavailable in this browser, so the 3D documentary cannot run. The archival NASA media for each chapter is listed in the media manifest.</div>';
    const noop = () => undefined;
    return { play: noop, pause: noop, toggle: noop, seekToChapter: async () => undefined, seekTime: noop, setMode: noop, setAudioEnabled: noop, setQuality: async () => undefined, on: () => noop, getState: () => ({ chapterId: '', chapterIndex: 0, chapterTime: 0, chapterDuration: 0, playing: false, mode: 'cinematic', ended: false, audioEnabled: false, quality: 'low', fps: 0, gpu: { geometries: 0, textures: 0, drawCalls: 0, triangles: 0 }, media: [] }), destroy: () => { container.innerHTML = ''; } };
  }
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const ctl = new JourneyController(container, options);
  const ui = options.ui === false ? undefined : new JourneyUI(container, ctl, options.intro ?? !options.autoplay);
  let dead = false;
  return {
    play: () => ctl.play(), pause: () => ctl.pause(), toggle: () => ctl.toggle(),
    seekToChapter: (id, autoplay = true) => ctl.seekToChapter(id, autoplay),
    seekTime: (s) => ctl.seekTime(s), setMode: (m) => ctl.setMode(m), setAudioEnabled: (v) => ctl.setAudioEnabled(v), setQuality: (l) => ctl.setQualityLevel(l),
    on: (fn) => ctl.on(fn),
    getState: () => ({
      chapterId: ctl.chapter.id, chapterIndex: ctl.index, chapterTime: ctl.chapterTime, chapterDuration: ctl.chapter.duration, playing: ctl.playing, mode: ctl.mode, ended: ctl.ended,
      audioEnabled: ctl.audio.isEnabled(), quality: ctl.scene.qualityLevel, fps: ctl.fps,
      gpu: { geometries: ctl.scene.info.geometries, textures: ctl.scene.info.textures, drawCalls: ctl.scene.info.calls, triangles: ctl.scene.info.tris },
      media: MEDIA_ENTRIES.map((e) => ({ id: e.id, status: ctl.manifest.getStatus(e.id) })),
    }),
    destroy: () => { if (dead) return; dead = true; ui?.destroy(); ctl.destroy(); },
  };
}
