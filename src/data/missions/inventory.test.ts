/**
 * MISSION INVENTORY — generated from the live registries.
 *
 * This test is the generator for `MISSION_INVENTORY.csv` (the machine-readable
 * inventory required for the release audit) AND the regression guard that keeps
 * the verified mission facts in `src/data/missions/verification.ts` consistent
 * with the artifact records the app actually renders.
 *
 * Run: npx vitest run src/data/missions/inventory.test.ts
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ARTIFACTS, artifactById } from "@/data/artifacts";
import { JOURNEY_REGISTRY } from "@/data/journeys";
import { SOURCES } from "@/data/sources";
import { MISSION_VERIFICATION, verificationFor } from "./verification";

const iso = (ms?: number | null) =>
  ms === undefined || ms === null ? "" : new Date(ms).toISOString().slice(0, 10);

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

describe("mission inventory", () => {
  it("every registered device has verified mission facts", () => {
    const missing = ARTIFACTS.filter((a) => !verificationFor(a.id)).map((a) => a.id);
    expect(missing, `devices without a verification record: ${missing.join(", ")}`).toEqual([]);
    expect(MISSION_VERIFICATION.length).toBe(ARTIFACTS.length);
  });

  it("the verified launch date matches the artifact record", () => {
    for (const v of MISSION_VERIFICATION) {
      const art = artifactById(v.deviceId)!;
      const launch = v.keyEvents.find((e) => e.label === "Launch");
      expect(launch, `${v.deviceId} has no verified launch event`).toBeTruthy();
      expect(
        Math.abs((launch!.dateUtc ?? 0) - art.dates.launch),
        `${v.deviceId}: verification launch ${iso(launch!.dateUtc)} vs artifact ${iso(art.dates.launch)}`,
      ).toBeLessThan(36 * 3600 * 1000);
    }
  });

  it("the verified landing date matches the artifact record", () => {
    for (const v of MISSION_VERIFICATION) {
      const art = artifactById(v.deviceId)!;
      if (!art.dates.landing) continue;
      const landing = v.keyEvents.find((e) => e.label.toLowerCase().includes("landing") || e.label.includes("Entry, descent and landing"));
      if (!landing) continue;
      expect(
        Math.abs((landing.dateUtc ?? 0) - art.dates.landing),
        `${v.deviceId}: verification landing ${iso(landing.dateUtc)} vs artifact ${iso(art.dates.landing)}`,
      ).toBeLessThan(36 * 3600 * 1000);
    }
  });

  it("a mission with no end date is genuinely ongoing", () => {
    // Voyager 1: the mission continues — it must not carry an end date.
    const voyager = artifactById("voyager1")!;
    expect(voyager.dates.end, "Voyager 1 must not be recorded as ended").toBeUndefined();
    expect(verificationFor("voyager1")!.verifiedStatus).toBe("ONGOING");
  });

  it("every verification record cites at least one source", () => {
    for (const v of MISSION_VERIFICATION) {
      expect(v.sources.length, `${v.deviceId} has no sources`).toBeGreaterThan(0);
      for (const s of v.sources) {
        expect(s.url.startsWith("https://"), `${v.deviceId}: source must be a URL`).toBe(true);
        expect(s.publisher.length).toBeGreaterThan(2);
        expect(s.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      // duplicate URLs would collide as React keys in the mission panel
      const urls = v.sources.map((s) => s.url);
      expect(new Set(urls).size, `${v.deviceId} lists the same source URL twice`).toBe(urls.length);
    }
  });

  it("writes MISSION_INVENTORY.csv", () => {
    const head = [
      "device_id", "name", "designation", "mission_name", "device_type", "mission_type",
      "destination", "world", "agency", "launch_vehicle", "launch_site",
      "launch_date_utc", "landing_date_utc", "mission_end_date_utc", "verified_status",
      "app_status", "hardware_location", "landing_site", "landing_region", "lat", "lon",
      "model_kind", "model_type", "model_accuracy", "timeline_events", "instruments",
      "hardware_items", "science_questions", "media_assets", "journey_chapters",
      "journey_event_types", "mission_path_waypoints", "sources",
    ];
    const rows = ARTIFACTS.map((a) => {
      const v = verificationFor(a.id)!;
      const j = JOURNEY_REGISTRY[a.id];
      return [
        a.id, a.name, a.designation, a.missionName, a.type, v.missionType,
        a.destination, a.location.world, v.agency, v.launchVehicle, v.launchSite,
        iso(a.dates.launch), iso(a.dates.landing ?? null), iso(a.dates.end ?? null),
        v.verifiedStatus, a.status, v.hardwareLocation, a.location.site, a.location.region,
        a.location.lat, a.location.lon,
        a.model.kind, a.model.modelType, a.model.accuracy,
        a.timeline.length, a.hardware.length, a.scientificQuestions.length, a.media.length,
        j?.chapters.length ?? 0,
        j ? [...new Set(j.chapters.map((c) => c.eventType))].join(" ") : "",
        a.missionPath?.waypoints.length ?? 0,
        v.sources.map((s) => s.url).join(" | "),
      ].map(csvCell).join(",");
    });
    const out = join(process.cwd(), "MISSION_INVENTORY.csv");
    writeFileSync(out, [head.join(","), ...rows].join("\n") + "\n", "utf8");
    expect(rows.length).toBe(ARTIFACTS.length);
  });

  it("writes MISSION_SOURCE_REGISTER.md", () => {
    const lines: string[] = [];
    lines.push("# ECHOES — MISSION SOURCE REGISTER");
    lines.push("");
    lines.push("Generated from `src/data/missions/verification.ts` (per-mission audited facts) and");
    lines.push("`src/data/sources/index.ts` (the application-wide source registry).");
    lines.push("");
    lines.push("Attribution rule used throughout ECHOES: NASA imagery and NASA/JPL media are");
    lines.push("generally not copyrighted, but NASA requests attribution of the source and the");
    lines.push("creator; peer-reviewed papers are cited by DOI. Every asset that appears in the");
    lines.push("product carries its credit line in the interface.");
    lines.push("");
    lines.push("## Per-mission audited claims");
    lines.push("");
    for (const v of MISSION_VERIFICATION) {
      const art = artifactById(v.deviceId)!;
      lines.push(`### ${art.name} (${art.designation}) — ${v.verifiedStatus}`);
      lines.push("");
      lines.push(`- **Agency:** ${v.agency}`);
      lines.push(`- **Launch vehicle:** ${v.launchVehicle}`);
      lines.push(`- **Launch site:** ${v.launchSite}`);
      lines.push(`- **Objective:** ${v.objective}`);
      lines.push(`- **Status:** ${v.statusNote}`);
      lines.push(`- **Hardware today:** ${v.hardwareLocation}`);
      lines.push("");
      lines.push("| Claim / data item | Source | Publisher | URL | Accessed | Attribution & usage |");
      lines.push("|---|---|---|---|---|---|");
      const claims = v.keyEvents.map((e) => `${e.label} (${iso(e.dateUtc) || "ongoing"})`);
      claims.push("Verified operational status", "Objective and mission type", "Discoveries");
      v.sources.forEach((s, i) => {
        lines.push(`| ${claims[i] ?? "Mission facts"} | ${s.title} | ${s.publisher} | ${s.url} | ${s.accessed} | NASA media: credit the source and creator (not copyrighted, attribution requested). Peer-reviewed: cite the DOI. |`);
      });
      lines.push("");
    }
    lines.push("## Application-wide source registry");
    lines.push("");
    lines.push("| id | Title | Publisher | Kind | URL | Supports |");
    lines.push("|---|---|---|---|---|---|");
    for (const s of SOURCES) {
      lines.push(`| ${s.id} | ${s.title} | ${s.publisher} | ${s.kind} | ${s.url} | ${s.supports} |`);
    }
    lines.push("");
    const out = join(process.cwd(), "MISSION_SOURCE_REGISTER.md");
    writeFileSync(out, lines.join("\n"), "utf8");
    expect(SOURCES.length).toBeGreaterThan(15);
  });
});
