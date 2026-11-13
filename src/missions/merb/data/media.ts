import { IMAGE_RECORDS } from './images.generated';
import type { LoadStatus, MediaEntry, VideoRecord } from './types';

const PD = 'NASA media are generally not copyrighted (public domain) — attribution requested. https://www.nasa.gov/nasa-brand-center/images-and-media/';
const KSC_FEATURE_NOTE = 'Narrated NASA TV feature. Its audio bed has not been verified as music-free, so it is muted by default (enable with allowNarratedFeatureAudio).';
const v = (id: string) => `https://images-assets.nasa.gov/video/${id}/${id}`;

/** Archival video. Every URL below was fetched and verified (HTTP 200, video/mp4, byte-range capable) while building. */
const VIDEOS: VideoRecord[] = [
  {
    id: 'vid-launch-tracker', kind: 'video', chapters: ['launch'],
    title: 'Mars Exploration Rover launches — tracker camera view (Opportunity segment)',
    url: 'https://archive.org/download/AVC-2003-175-1/AVC-2003-175-1_512kb.mp4',
    credit: 'NASA/JPL-Caltech (Mars Outreach video file MER-2003-1020)', date: '2003-07-07',
    caption: 'Raw HD tracker-camera footage of the Delta II Heavy lifting off from Launch Complex 17-B. Opportunity\'s night launch begins roughly 3 min 20 s into the tape.',
    sourcePage: 'https://archive.org/details/AVC-2003-175-1', audio: 'native',
    audioNote: 'Original archive audio as recorded on the NASA/JPL outreach tape.',
  },
  {
    id: 'vid-mer-animation', kind: 'animation', chapters: ['approach', 'edl', 'first-views'],
    title: 'Mars Exploration Rover mission animation (artist\'s concept)',
    url: 'https://assets.science.nasa.gov/content/dam/science/psd/mars/videos/2024/5443_MER_Spirit_Opportunity_rover_animation_EDL-1280.mp4',
    credit: 'NASA/JPL-Caltech', date: '2004-01-01',
    caption: 'NASA/JPL computer animation of arrival, entry, descent, airbag landing and rover deployment. An illustration — not footage.',
    sourcePage: 'https://science.nasa.gov/resource/mars-exploration-rover-mission-animation/', audio: 'muted',
    audioNote: 'Soundtrack deliberately omitted (this project plays no music or produced sound).',
  },
  {
    id: 'vid-meridiani-water', kind: 'video', chapters: ['water'],
    title: 'NASA feature: evidence of sedimentation at Meridiani Planum',
    url: v('ksc_032904_wetplanet') + '~mobile.mp4', poster: v('ksc_032904_wetplanet') + '~small_1.jpg',
    credit: 'NASA / NASA TV', date: '2004-03-29',
    caption: 'NASA TV feature reporting that the Meridiani rocks formed in water — “perhaps a shallow salty sea”.',
    sourcePage: 'https://images.nasa.gov/details/ksc_032904_wetplanet', audio: 'feature-narration', audioNote: KSC_FEATURE_NOTE,
  },
  {
    id: 'vid-bounce-rock', kind: 'video', chapters: ['eagle'],
    title: 'NASA feature: “Bounce” rock on the Meridiani plains',
    url: v('ksc_042104_meteor') + '~mobile.mp4', poster: v('ksc_042104_meteor') + '~small_1.jpg',
    credit: 'NASA / NASA TV', date: '2004-04-22',
    caption: 'NASA TV feature on Bounce, a volcanic rock found on the plains beyond Eagle crater.',
    sourcePage: 'https://images.nasa.gov/details/ksc_042104_meteor', audio: 'feature-narration', audioNote: KSC_FEATURE_NOTE,
  },
  {
    id: 'vid-primary-complete', kind: 'video', chapters: ['endurance'],
    title: 'NASA feature: the rovers complete their primary missions',
    url: v('ksc_050604_complete') + '~mobile.mp4', poster: v('ksc_050604_complete') + '~small_1.jpg',
    credit: 'NASA / NASA TV', date: '2004-05-06',
    caption: 'NASA TV feature: both rovers have met their primary-mission requirements and head into extended missions.',
    sourcePage: 'https://images.nasa.gov/details/ksc_050604_complete', audio: 'feature-narration', audioNote: KSC_FEATURE_NOTE,
  },
];

const KIND_LABEL: Record<string, string> = {
  photograph: 'Photograph', image: 'NASA/JPL image', stereo: 'Stereo anaglyph (red–cyan)', 'orbital-image': 'Orbital image',
  map: 'Map / data visualisation', simulation: 'Simulation — not a photograph', animation: 'Animation — artist\'s concept', video: 'Archival video',
};
export const kindLabel = (k: string) => KIND_LABEL[k] ?? k;

export const MEDIA_ENTRIES: MediaEntry[] = [
  ...IMAGE_RECORDS.map<MediaEntry>((r) => ({ ...r, mediaType: 'image', license: PD })),
  ...VIDEOS.map<MediaEntry>((r) => ({ ...r, mediaType: 'video', license: PD })),
];

/** Runtime manifest: static source/attribution data + live loading status. */
export class MediaManifest {
  private status = new Map<string, LoadStatus>();
  private listeners = new Set<(id: string, s: LoadStatus) => void>();
  private cache = new Map<string, HTMLImageElement>();
  readonly entries = MEDIA_ENTRIES;

  get(id: string): MediaEntry {
    const e = this.entries.find((x) => x.id === id);
    if (!e) throw new Error(`Unknown media id ${id}`);
    return e;
  }
  forChapter(chapterId: string) { return this.entries.filter((e) => e.chapters.includes(chapterId)); }
  getStatus(id: string): LoadStatus { return this.status.get(id) ?? 'idle'; }
  setStatus(id: string, s: LoadStatus) { this.status.set(id, s); this.listeners.forEach((l) => l(id, s)); }
  onStatus(fn: (id: string, s: LoadStatus) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /** Lazy image preload with status tracking. Resolves false on failure (never throws). */
  preload(id: string): Promise<boolean> {
    const e = this.get(id);
    if (e.mediaType !== 'image') return Promise.resolve(true);
    if (this.getStatus(id) === 'ready') return Promise.resolve(true);
    this.setStatus(id, 'loading');
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.cache.set(id, img); this.setStatus(id, 'ready'); res(true); };
      img.onerror = () => { this.setStatus(id, 'error'); res(false); };
      img.src = e.url;
    });
  }
  /** Release decoded image references. */
  dispose() { this.cache.clear(); this.listeners.clear(); this.status.clear(); }
  toJSON() { return this.entries.map((e) => ({ ...e, status: this.getStatus(e.id) })); }
}
