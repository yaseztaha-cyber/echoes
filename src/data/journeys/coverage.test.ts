import { describe, expect, it } from "vitest";
import { ARTIFACTS } from "@/data/artifacts";
import { getJourney, hasJourney, allJourneyDeviceIds, journeyCount } from "@/data/journeys";

describe("mission journey coverage", () => {
  it("every archive device has a journey entry", () => {
    const missing: string[] = [];
    for (const art of ARTIFACTS) {
      if (!hasJourney(art.id)) {
        missing.push(art.id);
      }
    }
    expect(missing, `Missing journeys for: ${missing.join(", ")}`).toEqual([]);
  });

  it("journey count matches device count", () => {
    expect(journeyCount()).toBe(ARTIFACTS.length);
  });

  it("all journey device IDs are valid archive devices", () => {
    const deviceIds = new Set(ARTIFACTS.map((a) => a.id));
    for (const jid of allJourneyDeviceIds()) {
      expect(deviceIds.has(jid), `Journey for unknown device: ${jid}`).toBe(true);
    }
  });

  it("every journey has at least 3 chapters", () => {
    for (const art of ARTIFACTS) {
      const j = getJourney(art.id);
      expect(j, `No journey for ${art.id}`).toBeDefined();
      expect(j!.chapters.length, `${art.id} has too few chapters`).toBeGreaterThanOrEqual(3);
    }
  });

  it("every journey has a valid title and mission name", () => {
    for (const art of ARTIFACTS) {
      const j = getJourney(art.id)!;
      expect(j.title.length).toBeGreaterThan(0);
      expect(j.missionName.length).toBeGreaterThan(0);
      expect(j.deviceId).toBe(art.id);
    }
  });

  it("every journey chapter has required fields", () => {
    for (const art of ARTIFACTS) {
      const j = getJourney(art.id)!;
      for (const ch of j.chapters) {
        expect(ch.id).toBeTruthy();
        expect(ch.title).toBeTruthy();
        expect(ch.narrative).toBeTruthy();
        expect(ch.dateUtc).not.toBeNaN();
        expect(ch.scientificSignificance).toBeTruthy();
        expect(ch.engineeringSignificance).toBeTruthy();
      }
    }
  });

  it("every journey has source references", () => {
    for (const art of ARTIFACTS) {
      const j = getJourney(art.id)!;
      expect(j.sourceIds.length, `${art.id} has no sources`).toBeGreaterThan(0);
    }
  });

  it("coverage is 100%", () => {
    const total = ARTIFACTS.length;
    const covered = ARTIFACTS.filter((a) => hasJourney(a.id)).length;
    const pct = (covered / total) * 100;
    expect(pct).toBe(100);
  });
});
