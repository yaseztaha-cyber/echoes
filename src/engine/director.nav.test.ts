/**
 * DEVICE NAVIGATION REGRESSION TESTS
 *
 * The bug these lock down: transferring to a device (or selecting a journey
 * chapter while at a device) could return the user to the Solar System.
 *
 * Two mechanisms are covered:
 *  - navigation tickets: a stale (older) asynchronous transfer must never
 *    overwrite a newer user selection;
 *  - the journey-chapter policy: documentary chapters never move the live
 *    exploration location, and returnToSolarSystem() is never called during an
 *    ordinary device transfer or a documentary chapter selection at a site.
 *
 * The camera is faked (no WebGL in node): flights resolve instantly, so the
 * director's state transitions can be asserted directly.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./cameras/controller", async () => {
  const THREE = await import("three");
  const camera = new THREE.PerspectiveCamera(50, 1.6, 0.01, 30000);
  camera.position.set(0, 6, 22);
  const controls = { target: new THREE.Vector3(), update: () => {} };
  const vec = (v: any) => (typeof v === "function" ? v() : v);
  return {
    cam: {
      camera,
      controls,
      flight: null,
      follow: null,
      followPrev: new THREE.Vector3(),
      followFresh: true,
      keys: new Set<string>(),
    },
    fly: async (_dur: number, fn: any) => {
      fn(1, camera.position, controls.target);
    },
    flyTo: async (pos: any, tgt: any) => {
      camera.position.copy(vec(pos));
      controls.target.copy(vec(tgt));
    },
    setView: (pos: any, tgt: any) => {
      camera.position.copy(vec(pos));
      controls.target.copy(vec(tgt));
    },
    setFollow: () => {},
    wait: async () => {},
    smoother: (u: number) => u,
    easeInOut: (u: number) => u,
    easeOut: (u: number) => u,
  };
});

vi.mock("./textures/manager", () => ({
  globeResidency: { request: () => {} },
  HI_TIERS: {},
}));

import { useEcho } from "@/state/store";
import { ARTIFACTS } from "@/data/artifacts";
import { getJourney } from "@/data/journeys";
import {
  beginNav,
  descendToSite,
  goToArtifact,
  goToPlanet,
  isHistoricalChapter,
  leaveSite,
  navTraceLog,
  returnToSolarSystem,
  transitionToJourneyChapter,
} from "./director";

// node has no animation frames — the director waits two of them between scene
// swaps, so provide a timer-backed stand-in.
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof globalThis.cancelAnimationFrame;
}

/** Solar System returns recorded since the last reset. */
const solarReturns = () => navTraceLog.filter((e) => e.fn === "returnToSolarSystem");

const put = (patch: Record<string, unknown>) => useEcho.setState(patch as never);

const atSite = (artifactId: string) => {
  const art = ARTIFACTS.find((a) => a.id === artifactId)!;
  put({ scene: "site", world: art.destination, artifactId, camMode: "orbit", overlay: null, flying: false });
};

const atPlanet = (world: string) => put({ scene: "planet", world, artifactId: null, camMode: "orbit", overlay: null, flying: false });

const atSolar = () => put({ scene: "solar", world: "solar", focusBody: "earth", artifactId: null, camMode: "orbit", overlay: null, flying: false });

beforeEach(() => {
  navTraceLog.length = 0;
  atSolar();
});

describe("device transfers stay on the device's world", () => {
  it("same-planet transfer: Mars → Opportunity → Spirit stays on Mars", async () => {
    atPlanet("mars");
    await goToArtifact("opportunity");
    expect(useEcho.getState().scene).toBe("site");
    expect(useEcho.getState().world).toBe("mars");
    expect(useEcho.getState().artifactId).toBe("opportunity");

    navTraceLog.length = 0;
    await goToArtifact("spirit");
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("mars");
    expect(st.artifactId).toBe("spirit");
    expect(solarReturns(), "same-planet transfer must not touch the Solar System").toHaveLength(0);
  });

  it("cross-planet transfer: Mars → Apollo 12 ends on the Moon", async () => {
    atPlanet("mars");
    await goToArtifact("apollo-12");
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("moon");
    expect(st.artifactId).toBe("apollo-12");
    expect(st.scene, "the transfer must not leave the user in the Solar System").not.toBe("solar");
  });

  it("site-to-device navigation leaves the previous site and lands on the new one", async () => {
    atSite("opportunity");
    await goToArtifact("sojourner");
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("mars");
    expect(st.artifactId).toBe("sojourner");
  });

  it("site exit returns to the parent planet (not the Solar System)", async () => {
    atSite("insight");
    await leaveSite();
    const st = useEcho.getState();
    expect(st.scene).toBe("planet");
    expect(st.world).toBe("mars");
    expect(solarReturns()).toHaveLength(0);
  });

  it("descendToSite from the planet view lands on the site", async () => {
    atPlanet("moon");
    await descendToSite("apollo-17");
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("moon");
    expect(st.artifactId).toBe("apollo-17");
  });

  it("goToPlanet to the world the user is already on changes nothing", async () => {
    atPlanet("mars");
    await goToPlanet("mars");
    expect(useEcho.getState().scene).toBe("planet");
    expect(useEcho.getState().world).toBe("mars");
  });

  it("every registered device is reachable and lands on its own world", async () => {
    for (const art of ARTIFACTS) {
      atSolar();
      navTraceLog.length = 0;
      await goToArtifact(art.id);
      const st = useEcho.getState();
      if (art.destination === "deep-space") {
        expect(st.scene, `${art.id} stays in the solar frame`).toBe("solar");
        expect(st.artifactId).toBe(art.id);
      } else {
        expect(st.scene, `${art.id} reaches a site`).toBe("site");
        expect(st.world, `${art.id} is on ${art.destination}`).toBe(art.destination);
        expect(st.artifactId).toBe(art.id);
      }
    }
  });

  it("unknown device ids are ignored (no navigation, no crash)", async () => {
    atPlanet("mars");
    await goToArtifact("not-a-real-device");
    const st = useEcho.getState();
    expect(st.scene).toBe("planet");
    expect(st.world).toBe("mars");
    expect(solarReturns()).toHaveLength(0);
  });
});

describe("stale asynchronous transfers cannot overwrite a newer selection", () => {
  it("two rapid selections settle on the last requested device", async () => {
    atPlanet("mars");
    const first = goToArtifact("spirit");
    const second = goToArtifact("opportunity");
    await Promise.all([first, second]);
    const st = useEcho.getState();
    expect(st.artifactId).toBe("opportunity");
    expect(st.world).toBe("mars");
    expect(st.scene).toBe("site");
  });

  it("a chapter selection never cancels a device transfer", async () => {
    atPlanet("mars");
    const transfer = goToArtifact("opportunity");
    // a documentary chapter fires while the transfer is still running
    await transitionToJourneyChapter("opportunity", {
      id: "c1", sequence: 1, act: "ACT", title: "Launch", date: "", dateUtc: 0, sol: null,
      location: "", eventType: "launch", narrative: "", whyHappened: "", instruments: [], hardware: [],
      discovery: null, scientificSignificance: "", engineeringSignificance: "", futureMissions: "",
      media: [], caseFileId: null, cameraBehavior: "", hologramSequence: [],
    });
    await transfer;
    const st = useEcho.getState();
    expect(st.scene, "the transfer was not cancelled by the chapter").toBe("site");
    expect(st.artifactId).toBe("opportunity");
    expect(st.world).toBe("mars");
  });

  it("a stale transfer never installs a site after a newer navigation took over", async () => {
    atPlanet("mars");
    const stale = goToArtifact("opportunity");
    beginNav("newer-user-action"); // the user's next action invalidates the transfer
    await stale;
    expect(useEcho.getState().scene, "the stale transfer must not complete").not.toBe("site");
  });

  it("a device transfer invalidates a pending chapter transition", async () => {
    atSite("opportunity");
    const chapter = transitionToJourneyChapter("opportunity", {
      id: "c2", sequence: 2, act: "ACT", title: "Traverse", date: "", dateUtc: 0, sol: null,
      location: "", eventType: "traverse", narrative: "", whyHappened: "", instruments: [], hardware: [],
      discovery: null, scientificSignificance: "", engineeringSignificance: "", futureMissions: "",
      media: [], caseFileId: null, cameraBehavior: "", hologramSequence: [],
    });
    beginNav("device-transfer"); // the user picks another device
    await chapter;
    expect(useEcho.getState().scene).toBe("site");
    expect(useEcho.getState().artifactId).toBe("opportunity");
  });
});

describe("journey chapter policy: documentary playback never moves the user", () => {
  it("every pre-landing chapter of every device keeps the user at the site", async () => {
    let checked = 0;
    for (const art of ARTIFACTS) {
      const journey = getJourney(art.id);
      if (!journey) continue;
      for (const ch of journey.chapters) {
        if (!isHistoricalChapter(art, ch)) continue;
        checked++;
        atSite(art.id);
        navTraceLog.length = 0;
        await transitionToJourneyChapter(art.id, ch);
        const st = useEcho.getState();
        expect(st.scene, `${art.id}/${ch.id} must not leave the site`).toBe("site");
        expect(st.world).toBe(art.destination);
        expect(st.artifactId).toBe(art.id);
        expect(solarReturns(), `${art.id}/${ch.id} must not call returnToSolarSystem`).toHaveLength(0);
      }
    }
    expect(checked, "there must be pre-landing chapters to test").toBeGreaterThan(0);
  });

  it("a chapter of another device does not move the user off the current site", async () => {
    atSite("opportunity");
    navTraceLog.length = 0;
    const spiritJourney = getJourney("spirit")!;
    const post = spiritJourney.chapters.find((c) => !isHistoricalChapter(ARTIFACTS.find((a) => a.id === "spirit")!, c))!;
    await transitionToJourneyChapter("spirit", post);
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("mars");
    expect(st.artifactId).toBe("opportunity");
    expect(solarReturns()).toHaveLength(0);
  });

  it("a post-landing chapter of the device at the site keeps the camera on that site", async () => {
    atSite("opportunity");
    navTraceLog.length = 0;
    const art = ARTIFACTS.find((a) => a.id === "opportunity")!;
    const journey = getJourney("opportunity")!;
    const post = journey.chapters.find((c) => !isHistoricalChapter(art, c))!;
    await transitionToJourneyChapter("opportunity", post);
    const st = useEcho.getState();
    expect(st.scene).toBe("site");
    expect(st.world).toBe("mars");
    expect(st.artifactId).toBe("opportunity");
    expect(solarReturns()).toHaveLength(0);
  });

  it("pre-landing chapters are classified from the mission dates, not from a hand-picked label list", () => {
    const art = ARTIFACTS.find((a) => a.id === "opportunity")!;
    const journey = getJourney("opportunity")!;
    const before = journey.chapters.filter((c) => c.dateUtc < art.dates.landing!);
    expect(before.length).toBeGreaterThan(0);
    for (const ch of before) expect(isHistoricalChapter(art, ch)).toBe(true);
    const after = journey.chapters.filter((c) => c.dateUtc > art.dates.landing! + 86400000);
    for (const ch of after) expect(isHistoricalChapter(art, ch)).toBe(false);
  });

  it("chapter selection at a site never returns to the Solar System (all devices, all chapters)", async () => {
    for (const art of ARTIFACTS) {
      const journey = getJourney(art.id);
      if (!journey) continue;
      for (const ch of journey.chapters) {
        atSite(art.id);
        navTraceLog.length = 0;
        await transitionToJourneyChapter(art.id, ch);
        expect(solarReturns(), `${art.id}/${ch.id} triggered a Solar System return`).toHaveLength(0);
        expect(useEcho.getState().scene).toBe("site");
      }
    }
  });
});

describe("Solar System return instrumentation", () => {
  it("records the reason and the call site of every return", async () => {
    atPlanet("mars");
    await returnToSolarSystem(true, "unit-test");
    const entries = solarReturns();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].reason).toBe("unit-test");
    expect(entries[0].stack).toContain("returnToSolarSystem");
  });

  it("an explicit user request is the only reason the Solar System is re-entered", async () => {
    atPlanet("mars");
    await goToArtifact("apollo-12");
    const reasons = solarReturns().map((e) => e.reason);
    // the frame hop between two worlds is legitimate, but it is never a
    // journey chapter and it never leaves the user in the Solar System
    for (const r of reasons) expect(r.startsWith("journey-chapter")).toBe(false);
    expect(useEcho.getState().scene).toBe("site");
  });
});
