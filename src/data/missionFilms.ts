/**
 * MISSION FILM REGISTRY
 *
 * A mission film is a recorded documentary that belongs to exactly ONE device.
 * Only devices with an `available` entry here can show the "WATCH MISSION
 * FILM" action — a device without a registered film shows nothing at all (no
 * disabled button, no empty player, no "coming soon").
 *
 * Files live in `public/films/` and are served as-is by the dev server and
 * copied verbatim into the build. The browser streams them with native range
 * requests: nothing is inlined into the bundle, nothing is preloaded before
 * the user opens the film, and the decoder is released when it closes.
 *
 * Honesty: every entry carries its own provenance. The MER-B film is a screen
 * capture of the MER-B cinematic journey prototype authored for this project
 * (NASA/JPL media inside it are public domain and credited in the film).
 */

export type FilmStatus = "available" | "unavailable";

export interface MissionFilm {
  /** ARTIFACTS id the film belongs to (e.g. "opportunity"). */
  deviceId: string;
  /** Film title shown in the player header. */
  title: string;
  /** One line of context above the player. */
  subtitle: string;
  /** Path served from the app root (files live in public/). */
  src: string;
  /** Optional poster image (a real frame of the film). */
  poster?: string;
  /** Informational only — the player always reads the real duration from the file. */
  durationSec?: number;
  /** Provenance line under the player. */
  credit: string;
  /** Availability. Only "available" films are offered. */
  status: FilmStatus;
}

export const MISSION_FILMS: MissionFilm[] = [
  {
    deviceId: "opportunity",
    title: "MER-B — OPPORTUNITY",
    subtitle: "The full mission documentary · 18 chapters · 2000 – 2019",
    src: "/films/merb-mission-film.webm",
    poster: "/films/merb-mission-film-poster.jpg",
    durationSec: 514,
    credit:
      "MER-B cinematic journey, authored for ECHOES. Archival media inside the film: NASA / JPL-Caltech (public domain).",
    status: "available",
  },
];

const BY_DEVICE = new Map(MISSION_FILMS.map((f) => [f.deviceId, f]));

/**
 * The film registered for a device, or null. Null means: show no action at
 * all. Devices without a film never see a disabled control.
 */
export const filmForDevice = (deviceId?: string | null): MissionFilm | null => {
  if (!deviceId) return null;
  const f = BY_DEVICE.get(deviceId);
  return f && f.status === "available" ? f : null;
};

/** Device ids that currently have a film (used by the regression tests). */
export const devicesWithFilm = (): string[] =>
  MISSION_FILMS.filter((f) => f.status === "available").map((f) => f.deviceId);
