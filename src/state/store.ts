import { create } from "zustand";

export type SceneId = "solar" | "planet" | "site";
export type CamMode = "orbit" | "free" | "follow" | "surface" | "inspect" | "cinematic" | "overview";
export type Overlay = null | "archive" | "sources" | "lab" | "search" | "remains" | "finale" | "settings" | "decode" | "evidence" | "sun" | "panorama";
export type Quality = "ultra" | "high" | "medium" | "low";
export type SimMode = "solar-system" | "mission" | "historical";
export type Level = "explore" | "understand" | "technical";

export interface Banner {
  title: string;
  sub?: string;
  key: number;
}

export interface LastLocation {
  artifactId: string;
  world: string;
  sol?: number;
}

const load = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
export const persist = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
};

export interface EchoState {
  entered: boolean;
  scene: SceneId;
  world: "solar" | "moon" | "mars";
  focusBody: string;
  artifactId: string | null; // selected artifact (site context or highlighted record)
  camMode: CamMode;
  uiMode: "cinematic" | "science";
  audience: "explorer" | "student";
  sim: { mode: SimMode; t: number; speed: number; dir: number; playing: boolean; rate: number };
  flying: boolean;
  veil: number;
  veilTone: "dark" | "mars";
  banner: Banner | null;
  instrumentId: string | null;
  scienceOpen: boolean;
  questionId: string | null;
  level: Level;
  decodeId: string | null;
  panoramaId: string | null;
  overlay: Overlay;
  compareOpen: boolean;
  minimap: boolean;
  timelineOpen: boolean;
  replay: { active: boolean; index: number; paused: boolean };
  demo: { active: boolean; caption: string };
  activeEventId: string | null;
  progress: string[];
  last: LastLocation | null;
  quality: Quality;
  /** Auto stepper may degrade below the ceiling and recover up to it, never above. */
  qualityCeiling: Quality;
  autoQuality: boolean;
  reducedMotion: boolean;
  audioOn: boolean;
  tiles: { loaded: number; needed: number; level: number; ready: boolean };
  arrival: { active: boolean; label: string };
  toasts: { id: number; title: string; sub: string }[];
  menuOpen: boolean;
  panelOpen: boolean;
  sidePanelHidden: boolean;
  /** Venus globe mode: radar-derived surface vs cloud-covered appearance. */
  venusView: "surface" | "clouds";
}

export const useEcho = create<EchoState>(() => ({
  entered: false,
  scene: "solar",
  world: "solar",
  focusBody: "earth",
  artifactId: null,
  camMode: "orbit",
  uiMode: "cinematic",
  audience: "explorer",
  sim: { mode: "solar-system", t: Date.now(), speed: 10, dir: 1, playing: true, rate: 3600000 },
  flying: false,
  veil: 0,
  veilTone: "dark",
  banner: null,
  instrumentId: null,
  scienceOpen: false,
  questionId: null,
  level: "explore",
  decodeId: null,
  panoramaId: null,
  overlay: null,
  compareOpen: false,
  minimap: true,
  timelineOpen: true,
  replay: { active: false, index: -1, paused: false },
  demo: { active: false, caption: "" },
  activeEventId: null,
  progress: load<string[]>("echoes.progress", []),
  last: load<LastLocation | null>("echoes.last", null),
  quality: load<Quality>("echoes.quality", "high"),
  qualityCeiling: load<Quality>("echoes.ceiling", "high"),
  autoQuality: load<boolean>("echoes.autoq", true),
  reducedMotion:
    load<boolean | null>("echoes.reduced", null) ??
    (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
  audioOn: load<boolean>("echoes.audio", true),
  tiles: { loaded: 0, needed: 0, level: 0, ready: true },
  arrival: { active: false, label: "" },
  toasts: [],
  menuOpen: false,
  panelOpen: true,
  sidePanelHidden: false,
  venusView: "surface",
}));

let bannerKey = 0;
export const showBanner = (title: string, sub?: string, ms = 3200) => {
  const key = ++bannerKey;
  useEcho.setState({ banner: { title, sub, key } });
  setTimeout(() => {
    if (useEcho.getState().banner?.key === key) useEcho.setState({ banner: null });
  }, ms);
};

let toastId = 0;
export const toast = (title: string, sub: string) => {
  const id = ++toastId;
  useEcho.setState((s) => ({ toasts: [...s.toasts, { id, title, sub }] }));
  setTimeout(() => useEcho.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5200);
};

export const unlockRecord = (questionId: string, name: string) => {
  const s = useEcho.getState();
  if (s.progress.includes(questionId)) return;
  const progress = [...s.progress, questionId];
  persist("echoes.progress", progress);
  useEcho.setState({ progress });
  toast("SCIENCE RECORD UNLOCKED", name);
};
