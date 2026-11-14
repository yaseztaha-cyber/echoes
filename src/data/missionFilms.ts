/**
 * MISSION FILM REGISTRY
 *
 * A mission film is a documentary that belongs to exactly ONE device. Only
 * devices with an `available` entry here can show the "WATCH MISSION FILM"
 * action — a device without a registered film shows nothing at all (no
 * disabled button, no empty player, no "coming soon").
 *
 * Two kinds are supported:
 *  - "documentary" — the film IS code: an authored in-app experience mounted
 *    into the mission journey interface (today: the MER-B cinematic journey,
 *    `src/missions/merb`). It plays live, at the device's own quality tier.
 *  - "video" — a recorded film file streamed from `public/` (native range
 *    requests, never inlined, loaded only when the user opens the film).
 *
 * Honesty: every entry carries its own provenance.
 */

export type FilmStatus = "available" | "unavailable";
export type FilmKind = "documentary" | "video";

export interface MissionFilm {
  /** ARTIFACTS id the film belongs to (e.g. "opportunity"). */
  deviceId: string;
  /** Film title shown in the film header. */
  title: string;
  /** One line of context above the film. */
  subtitle: string;
  /** How the film is delivered. */
  kind: FilmKind;
  /** For kind === "video": the path served from the app root (files live in public/). */
  src?: string;
  /** Optional poster image (a real frame of the film). */
  poster?: string;
  /** Informational only — a documentary reads its own timeline from the module. */
  durationSec?: number;
  /** Provenance line under the film. */
  credit: string;
  /** Availability. Only "available" films are offered. */
  status: FilmStatus;
}

export const MISSION_FILMS: MissionFilm[] = [
  {
    deviceId: "opportunity",
    title: "MER-B — OPPORTUNITY",
    subtitle: "The mission documentary · 18 chapters · 2003 – 2019",
    kind: "documentary",
    durationSec: 514,
    credit:
      "MER-B cinematic journey (src/missions/merb), authored for ECHOES. Archival media inside the film: NASA / JPL-Caltech (public domain).",
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
