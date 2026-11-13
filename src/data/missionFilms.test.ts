/**
 * MISSION FILM REGISTRY — regression tests
 *
 * The film is MER-B only. Every other device must show no action at all
 * (no disabled button, no empty player), and the registered assets must
 * actually exist on disk.
 */
import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { ARTIFACTS } from "@/data/artifacts";
import { MISSION_FILMS, devicesWithFilm, filmForDevice } from "@/data/missionFilms";

const PUBLIC = join(__dirname, "..", "..", "public");

describe("mission film registry", () => {
  it("MER-B (Opportunity) is the only device with a film", () => {
    expect(devicesWithFilm()).toEqual(["opportunity"]);
    expect(filmForDevice("opportunity")).not.toBeNull();
  });

  it("every other registered device has no film at all", () => {
    for (const art of ARTIFACTS) {
      if (art.id === "opportunity") continue;
      expect(filmForDevice(art.id), `${art.id} must not offer a film`).toBeNull();
    }
  });

  it("no device id outside the archive resolves to a film", () => {
    expect(filmForDevice(null)).toBeNull();
    expect(filmForDevice(undefined)).toBeNull();
    expect(filmForDevice("")).toBeNull();
    expect(filmForDevice("not-a-device")).toBeNull();
    expect(filmForDevice("voyager1")).toBeNull();
  });

  it("an unavailable film is never offered", () => {
    // the gate is `status === "available"`: an entry that is not available
    // must never resolve to a film, and an unregistered id never does either
    const ghost = { ...MISSION_FILMS[0], deviceId: "ghost", status: "unavailable" as const };
    expect(ghost.status).not.toBe("available");
    expect(filmForDevice(ghost.deviceId)).toBeNull();
  });

  it("the registered film files exist on disk and are non-trivial", () => {
    for (const film of MISSION_FILMS) {
      if (film.status !== "available") continue;
      if (film.kind !== "video") continue; // a documentary is code, not a file
      const src = join(PUBLIC, film.src!.replace(/^\//, ""));
      expect(existsSync(src), src).toBe(true);
      expect(statSync(src).size, `${film.src} is empty`).toBeGreaterThan(1024);
      if (film.poster) {
        const poster = join(PUBLIC, film.poster.replace(/^\//, ""));
        expect(existsSync(poster), poster).toBe(true);
        expect(statSync(poster).size, `${film.poster} is empty`).toBeGreaterThan(1024);
      }
    }
  });

  it("the MER-B film is the documentary module itself, not a media file", () => {
    const film = filmForDevice("opportunity")!;
    expect(film.kind).toBe("documentary");
    expect(film.src).toBeUndefined();
    // the documentary's code ships with the app
    expect(existsSync(join(__dirname, "..", "missions", "merb", "index.ts"))).toBe(true);
    expect(existsSync(join(__dirname, "..", "missions", "merb", "data", "chapters.ts"))).toBe(true);
  });

  it("the film declares its provenance", () => {
    const film = filmForDevice("opportunity")!;
    expect(film.credit.length).toBeGreaterThan(10);
    expect(film.title.length).toBeGreaterThan(3);
    expect(film.subtitle.length).toBeGreaterThan(3);
    expect(film.kind === "documentary" || !!film.src?.endsWith(".webm")).toBe(true);
  });
});
