/**
 * MISSION MEDIA MANIFEST — regression tests
 *
 * These lock the media collection down:
 *  - every registered mission owns a collection with real imagery;
 *  - every file the manifest names exists on disk and is non-trivial;
 *  - primary imagery is local (no hotlinks) and every asset carries its
 *    provenance (source page, direct URL, credit, classification, date);
 *  - the journey's chapter images point at files that exist locally.
 */
import { describe, expect, it } from "vitest";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ARTIFACTS } from "@/data/artifacts";
import {
  MISSION_MEDIA,
  MEDIA_FILE_PATHS,
  galleryForDevice,
  heroForDevice,
  mediaForDevice,
  videoForDevice,
  journeyMediaForDevice,
  type MediaClassification,
} from "@/data/media-manifest";

const PUBLIC = join(__dirname, "..", "..", "public");
const localPath = (p: string) => join(PUBLIC, p.replace(/^\//, ""));

const CLASSIFICATIONS: MediaClassification[] = [
  "Archival photograph",
  "Mission camera image",
  "Mission video",
  "Scientific visualization",
  "Artist's concept",
  "Other illustration",
];

describe("mission media manifest", () => {
  it("covers every registered mission", () => {
    const ids = MISSION_MEDIA.map((c) => c.deviceId).sort();
    expect(ids).toEqual(ARTIFACTS.map((a) => a.id).sort());
    for (const art of ARTIFACTS) {
      expect(mediaForDevice(art.id), `${art.id} must have a media collection`).not.toBeNull();
    }
  });

  it("resolves nothing for unknown devices", () => {
    expect(mediaForDevice(null)).toBeNull();
    expect(mediaForDevice(undefined)).toBeNull();
    expect(mediaForDevice("not-a-device")).toBeNull();
    expect(mediaForDevice("")).toBeNull();
  });

  it("gives every mission at least three authentic images and one hero", () => {
    for (const c of MISSION_MEDIA) {
      const images = c.assets.filter((a) => a.kind === "image" && a.role !== "journey");
      expect(images.length, `${c.deviceId} must carry at least three images`).toBeGreaterThanOrEqual(3);
      expect(heroForDevice(c.deviceId), `${c.deviceId} needs a hero image`).not.toBeNull();
      expect(galleryForDevice(c.deviceId).length, `${c.deviceId} needs a gallery`).toBeGreaterThanOrEqual(2);
      const heroes = c.assets.filter((a) => a.role === "hero");
      expect(heroes.length, `${c.deviceId} must have exactly one hero`).toBe(1);
    }
  });

  it("records provenance for every asset", () => {
    for (const c of MISSION_MEDIA) {
      for (const a of c.assets) {
        expect(a.title.length, `${c.deviceId}/${a.id} needs a title`).toBeGreaterThan(3);
        expect(a.caption.length, `${c.deviceId}/${a.id} needs a caption`).toBeGreaterThan(10);
        expect(a.credit.length, `${c.deviceId}/${a.id} needs a credit`).toBeGreaterThan(3);
        expect(a.sourcePage.startsWith("https://"), `${c.deviceId}/${a.id} needs an official source page`).toBe(true);
        expect(a.accessed, `${c.deviceId}/${a.id} needs a date accessed`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(a.restrictions.length, `${c.deviceId}/${a.id} needs a usage restriction line`).toBeGreaterThan(10);
        expect(CLASSIFICATIONS).toContain(a.classification);
      }
    }
  });

  it("never hotlinks primary imagery", () => {
    for (const c of MISSION_MEDIA) {
      for (const a of c.assets) {
        if (a.kind !== "image") continue;
        expect(a.file, `${c.deviceId}/${a.id} must be stored locally`).toMatch(/^\/media\/missions\//);
        expect(a.file!.startsWith("http")).toBe(false);
      }
    }
  });

  it("stores every named file on disk, with a real size", () => {
    for (const p of MEDIA_FILE_PATHS) {
      const abs = localPath(p);
      expect(existsSync(abs), `${p} is missing`).toBe(true);
      // a thumbnail of a very small source image may be small; a full asset may not
      const floor = p.endsWith("-thumb.webp") ? 400 : 1024;
      expect(statSync(abs).size, `${p} is empty`).toBeGreaterThan(floor);
    }
  });

  it("gives every image a thumbnail and every video a poster", () => {
    for (const c of MISSION_MEDIA) {
      for (const a of c.assets) {
        if (a.kind === "image") {
          expect(a.thumb, `${c.deviceId}/${a.id} needs a thumbnail`).toBeTruthy();
          expect(existsSync(localPath(a.thumb!)), `${a.thumb} is missing`).toBe(true);
        }
        if (a.kind === "video") {
          expect(a.poster, `${c.deviceId}/${a.id} needs a poster frame`).toBeTruthy();
          expect(existsSync(localPath(a.poster!)), `${a.poster} is missing`).toBe(true);
          expect(a.file!.endsWith(".webm"), `${c.deviceId}/${a.id} must be a local webm`).toBe(true);
        }
      }
    }
  });

  it("keeps file paths unique across the whole collection", () => {
    const seen = new Set<string>();
    for (const c of MISSION_MEDIA) {
      for (const a of c.assets) {
        for (const p of [a.file, a.thumb, a.poster]) {
          if (!p) continue;
          expect(seen.has(p), `${p} is registered twice`).toBe(false);
          seen.add(p);
        }
      }
    }
  });

  it("gives every mission a video entry — nine stored locally, one external", () => {
    const withVideo = MISSION_MEDIA.filter((c) => videoForDevice(c.deviceId)).map((c) => c.deviceId);
    expect(withVideo.sort()).toEqual(MISSION_MEDIA.map((c) => c.deviceId).sort());
    const local = MISSION_MEDIA.filter((c) => videoForDevice(c.deviceId)?.kind === "video").map((c) => c.deviceId);
    expect(local.sort()).toEqual(
      ["opportunity", "spirit", "insight", "apollo-12", "apollo-14", "apollo-15", "apollo-16", "apollo-17", "voyager1"].sort(),
    );
  });

  it("states the Sojourner video gap instead of faking one", () => {
    const v = videoForDevice("sojourner")!;
    expect(v).toBeTruthy();
    expect(v.kind).toBe("external-video");
    expect(v.file).toBeUndefined();
    expect(v.url).toMatch(/^https:\/\/images\.nasa\.gov\//);
    expect(v.caption).toMatch(/no suitably short official video/i);
  });

  it("points the Opportunity journey at local files that exist", () => {
    const journey = journeyMediaForDevice("opportunity");
    expect(journey.length).toBeGreaterThanOrEqual(10);
    for (const a of journey) {
      expect(a.file!.startsWith("/media/missions/opportunity/journey/")).toBe(true);
      expect(existsSync(localPath(a.file!)), `${a.file} is missing`).toBe(true);
    }
    const source = readFileSync(join(__dirname, "opportunity-journey.ts"), "utf8");
    const referenced = [...source.matchAll(/\/media\/missions\/opportunity\/journey\/[a-z0-9-]+\.webp/g)].map((m) => m[0]);
    expect(referenced.length).toBeGreaterThan(0);
    for (const p of new Set(referenced)) {
      expect(existsSync(localPath(p)), `${p} is referenced but missing`).toBe(true);
    }
    // the journey must not hotlink NASA any more
    expect(source).not.toMatch(/https:\/\/images-assets\.nasa\.gov/);
  });

  it("never implies NASA endorsement", () => {
    const text = readFileSync(join(__dirname, "media-manifest.ts"), "utf8");
    expect(text).toMatch(/is not an official NASA product/i);
    // every mention of endorsement must be a denial
    for (const m of text.matchAll(/.{0,12}endorsed by NASA/gi)) {
      expect(m[0].toLowerCase()).toMatch(/not endorsed/);
    }
    expect(text).not.toMatch(/in partnership with NASA/i);
    expect(text).not.toMatch(/official NASA (website|site)/i);
  });
});
