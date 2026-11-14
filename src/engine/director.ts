import * as THREE from "three";
import { useEcho, showBanner, persist, type CamMode } from "@/state/store";
import { markVisit, queueVignette } from "@/state/store";
import { cam, fly, flyTo, setView, setFollow, wait, smoother, easeInOut, easeOut } from "./cameras/controller";
import { clock, configureClock, setT } from "./time/clock";
import { bodyById, bodyPos } from "./frames/frames";
import { artifactById } from "@/data/artifacts";
import { VOYAGER_NOW } from "@/data/artifacts/voyager";
import { env, siteRef } from "./telemetry";
import { GLOBE_R, RADIUS_KM, lonLatToVec, D2R } from "@/lib/geo";
import { heightAt } from "./terrain/height";
import { globeResidency, HI_TIERS } from "./textures/manager";
import { sfx } from "@/lib/audio";
import { DAY_MS, SOL_MS } from "@/lib/time";
import type { Artifact } from "@/types";

/**
 * Director: sequences camera flights, scene swaps and clock configuration so that every
 * transition is spatially continuous. UI never moves the camera directly.
 */
const S = () => useEcho.getState();
const set = useEcho.setState;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const nextFrames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const APPROACH = new THREE.Vector2(-0.55, 0.83).normalize(); // (x east, z south) camera sits south-west of the site

const veil = async (on: boolean, tone: "dark" | "mars" = "dark", ms = 600) => {
  set({ veil: on ? 1 : 0, veilTone: tone } as any);
  await wait(ms);
};

export const currentArtifact = (): Artifact | undefined => artifactById(S().artifactId);

/* ------------------------------------------------------------------ navigation trace */
/**
 * Navigation trace — every Solar System return is recorded with its reason and
 * call stack so navigation regressions can be audited in the running app.
 *
 * The log is always kept in memory (the unit tests assert on it); it is only
 * published on `window` when the page is opened with `?navtrace=1`, so the
 * production build stays clean.
 */
export interface NavTraceEntry {
  fn: string;
  reason: string;
  at: number;
  scene: string;
  world: string;
  artifactId: string | null;
  stack: string;
  detail?: Record<string, unknown>;
}
export const navTraceLog: NavTraceEntry[] = [];
const NAV_TRACE =
  typeof location !== "undefined" && typeof URLSearchParams !== "undefined"
    ? new URLSearchParams(location.search).has("navtrace")
    : false;
const TRACE_CAP = 200;

export function navTrace(fn: string, reason: string, detail?: Record<string, unknown>): NavTraceEntry {
  const st = S();
  const entry: NavTraceEntry = {
    fn,
    reason,
    at: Date.now(),
    scene: st.scene,
    world: st.world,
    artifactId: st.artifactId,
    stack: new Error().stack ?? "",
    detail,
  };
  navTraceLog.push(entry);
  if (navTraceLog.length > TRACE_CAP) navTraceLog.splice(0, navTraceLog.length - TRACE_CAP);
  if (NAV_TRACE && typeof window !== "undefined") {
    const w = window as unknown as { __navTrace?: NavTraceEntry[] };
    (w.__navTrace ??= []).push(entry);
  }
  return entry;
}

if (typeof window !== "undefined") {
  // read-only accessors for the navigation audit (browser probes)
  const w = window as unknown as { __echoesState?: () => unknown; __echoesNav?: () => unknown };
  w.__echoesState = () => useEcho.getState();
  w.__echoesNav = () => navStatus();
}

/* ------------------------------------------------------------------ navigation tickets */
/**
 * Navigation tickets.
 *
 * Two independent channels:
 *
 *  - NAVIGATION (device transfers): every user-initiated transfer claims a
 *    navigation ticket. A newer transfer invalidates the older one, so two
 *    rapid device selections cannot interleave — the older chain's scene swap
 *    can no longer land after the newer one and strand the user in the Solar
 *    System or at the wrong device.
 *  - CHAPTER (documentary choreography): a journey chapter claims a chapter
 *    ticket. Chapters never invalidate a navigation, so a documentary can
 *    never cancel a device transfer; a navigation does invalidate a pending
 *    chapter, so the user's device choice always wins.
 *
 * Internal steps of one action pass the ticket down, so a single user action
 * never invalidates itself.
 */
export interface NavTicket {
  id: number;
  reason: string;
  kind: "navigation" | "chapter";
  navSeq: number;
  chapterSeq: number;
}
let navCounter = 0;
let navSeq = 0;
let chapterSeq = 0;
let lastNavTicket: NavTicket | null = null;
let lastChapterTicket: NavTicket | null = null;

export function beginNav(reason: string, kind: "navigation" | "chapter" = "navigation"): NavTicket {
  const ticket: NavTicket = {
    id: ++navCounter,
    reason,
    kind,
    navSeq: kind === "navigation" ? ++navSeq : navSeq,
    chapterSeq: kind === "chapter" ? ++chapterSeq : chapterSeq,
  };
  if (kind === "chapter") lastChapterTicket = ticket;
  else lastNavTicket = ticket;
  navTrace("nav-begin", reason, { ticket: ticket.id, kind });
  return ticket;
}
/**
 * True when a newer action of the same (or a stronger) kind has taken over —
 * the caller must stop instead of writing scene state.
 */
export const isStaleNav = (ticket?: NavTicket): boolean => {
  if (!ticket) return false;
  if (ticket.kind === "chapter") {
    // a newer chapter supersedes this one, and a newer device transfer wins too
    return ticket.chapterSeq !== chapterSeq || ticket.navSeq !== navSeq;
  }
  // a chapter never cancels a device transfer
  return ticket.navSeq !== navSeq;
};
export const activeNavTicket = (): NavTicket | null => lastNavTicket;
export const lastChapterTicketInfo = (): NavTicket | null => lastChapterTicket;

/** Navigation state for the audit probes (transition id, sequence, scene). */
export const navStatus = () => ({
  navTicket: lastNavTicket,
  chapterTicket: lastChapterTicket,
  navSeq,
  chapterSeq,
  scene: S().scene,
  world: S().world,
  artifactId: S().artifactId,
  camMode: S().camMode,
  overlay: S().overlay,
  flying: S().flying,
});

/** Wait until no camera flight is in progress (bounded). */
async function waitForIdle(timeoutMs = 30000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (!S().flying) return true;
    await wait(120);
  }
  return false;
}

export function anchor(): THREE.Vector3 {
  const st = S();
  if (st.scene === "solar") return st.focusBody === "voyager1" ? siteRef.pos.clone() : bodyPos(st.focusBody, clock.t);
  if (st.scene === "planet") return V();
  return siteRef.pos.clone();
}

function resetPanels() {
  set({ instrumentId: null, scienceOpen: false, questionId: null, compareOpen: false, activeEventId: null, arrival: { active: false, label: "" }, replay: { active: false, index: -1, paused: false } });
}

/* ------------------------------------------------------------------ boot */
export function enterSimulation() {
  set({ entered: true, scene: "solar", world: "solar", focusBody: "earth", artifactId: null, camMode: "orbit" });
  configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
  const e = bodyPos("earth", clock.t);
  const sunDir = e.clone().negate().normalize();
  const side = V(-sunDir.z, 0, sunDir.x);
  const dir = sunDir.clone().multiplyScalar(0.5).addScaledVector(side, 0.8).add(V(0, 0.28, 0)).normalize();
  const b = bodyById("earth")!;
  setView(e.clone().addScaledVector(dir, b.radius * 16), e);
  setFollow(() => bodyPos("earth", clock.t));
  showBanner("EARTH", "SOLAR SYSTEM · VISUAL SCALE ADJUSTED FOR NAVIGATION", 2400);
  flyTo(() => bodyPos("earth", clock.t).addScaledVector(dir, b.radius * 7), () => bodyPos("earth", clock.t), 2.2, smoother);
}

/* ------------------------------------------------------------------ solar system */
export async function focusBody(id: string, nav?: NavTicket) {
  const st = S();
  if (st.scene !== "solar") return;
  if (id === "voyager1") return goVoyager(nav);
  const b = bodyById(id);
  if (!b) return;
  const ticket = nav ?? beginNav(`focusBody:${id}`);
  sfx.select();
  if (st.artifactId === "voyager1") exitVoyager();
  set({ focusBody: id, artifactId: null, camMode: "orbit", instrumentId: null });
  setFollow(null);
  const c = cam.camera!;
  const p = bodyPos(id, clock.t);
  const toCam = c.position.clone().sub(p).normalize();
  const sunDir = p.clone().negate().normalize();
  const dir = toCam.multiplyScalar(0.35).addScaledVector(sunDir, id === "sun" ? 0 : 0.85).add(V(0, 0.22, 0)).normalize();
  const dist = b.radius * (id === "sun" ? 6 : 7);
  const travel = c.position.distanceTo(p);
  const dur = THREE.MathUtils.clamp(1.8 + Math.log10(1 + travel) * 2.2, 2.2, 9);
  showBanner(b.name, id === "mars" || id === "moon" ? "SELECT TRAVEL TO DESCEND" : "ORBIT", 2600);
  await flyTo(() => bodyPos(id, clock.t).addScaledVector(dir, dist), () => bodyPos(id, clock.t), dur, smoother);
  if (isStaleNav(ticket)) return;
  if (S().focusBody === id && S().scene === "solar") setFollow(() => bodyPos(id, clock.t));
}

export async function goVoyager(nav?: NavTicket) {
  const art = artifactById("voyager1")!;
  const ticket = nav ?? beginNav("goVoyager");
  sfx.confirm();
  set({ focusBody: "voyager1", artifactId: "voyager1", camMode: "follow", instrumentId: null });
  setFollow(null);
  configureClock({ mode: "historical", rate: art.clock.rate, range: art.clock.range, t: VOYAGER_NOW, speedIdx: 1, playing: false, dir: 1 });
  await nextFrames();
  if (isStaleNav(ticket)) return;
  const vp = () => (siteRef.group ? siteRef.pos.clone() : bodyPos("voyager1", clock.t));
  const c = cam.camera!;
  const start = vp();
  const sunDir = start.clone().negate().normalize();
  const off = sunDir.clone().multiplyScalar(0.4).add(V(0.25, 0.35, 0.6)).normalize().multiplyScalar(0.95);
  showBanner("VOYAGER 1", "EARTH → TRAJECTORY → SPACECRAFT → INTERSTELLAR SPACE", 3000);
  void c;
  await flyTo(() => vp().add(off), vp, 6.5, smoother);
  if (isStaleNav(ticket)) return;
  setFollow(vp);
  markVisit("voyager1", "VOYAGER 1 · INTERSTELLAR SPACECRAFT");
  queueVignette("voyager1");
}

function exitVoyager() {
  setFollow(null);
  configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
}

/** The strongest demonstration of scale: pull away from Voyager until the Solar System is a speck, then return. */
export async function scalePullback() {
  if (S().scene !== "solar") return;
  if (S().artifactId !== "voyager1") await goVoyager();
  const c = cam.camera!;
  const t = siteRef.pos.clone();
  setFollow(null);
  const d0 = c.position.distanceTo(t);
  const dir = V(0.35, 0.62, 0.7).normalize();
  showBanner("SCALE", "THE SOLAR SYSTEM, FROM VOYAGER 1", 6000);
  await fly(
    16,
    (u, p, g) => {
      const d = d0 * Math.pow(3600 / d0, u);
      g.copy(t).multiplyScalar(1 - u * 0.97);
      p.copy(g).addScaledVector(dir, d);
    },
    easeInOut
  );
  await wait(1800);
  const dst = siteRef.pos.clone();
  await flyTo(() => siteRef.pos.clone().add(V(0.25, 0.35, 0.6).normalize().multiplyScalar(0.95)), () => siteRef.pos.clone(), 12, easeInOut);
  void dst;
  setFollow(() => siteRef.pos.clone());
}

export async function overview() {
  const st = S();
  if (st.flying) return;
  sfx.select();
  const c = cam.camera!;
  set({ camMode: "overview" });
  setFollow(null);
  if (st.scene === "solar") {
    showBanner("SOLAR SYSTEM", "OVERVIEW", 2200);
    await flyTo(V(0, 150, 175), V(0, 0, 0), 4.5, smoother);
  } else if (st.scene === "planet") {
    const d = c.position.clone().normalize().multiplyScalar(520);
    await flyTo(d, V(), 3.5, smoother);
  } else {
    const t = siteRef.pos.clone();
    const p = t.clone().add(V(APPROACH.x * 2600, 0, APPROACH.y * 2600));
    p.y = t.y + 2300;
    await flyTo(p, t, 4, smoother);
  }
}

/* ------------------------------------------------------------------ planets */
export async function travelToBody(id: string, nav?: NavTicket) {
  const b = bodyById(id)!;
  const ticket = nav ?? beginNav(`travelToBody:${id}`);
  const k = GLOBE_R / b.radius;
  sfx.confirm();
  if (S().artifactId === "voyager1") exitVoyager();
  // Commit point: destination known → warm its hi-res KTX2 tier now so that the
  // approach sharpens instead of arriving blurry (high/ultra tiers only).
  const hi = HI_TIERS[id]?.hi;
  if (hi) {
    const q = S().quality;
    if (q === "high" || q === "ultra") globeResidency.request(hi, 5);
  }
  set({ focusBody: id, artifactId: null, camMode: "orbit", instrumentId: null });
  setFollow(null);
  showBanner(b.name, "DISTANCE · APPROACH", 2600);
  const c = cam.camera!;
  const p0 = bodyPos(id, clock.t);
  const sunDir = p0.clone().negate().normalize();
  const toCam = c.position.clone().sub(p0).normalize();
  const dir = toCam.multiplyScalar(0.3).addScaledVector(sunDir, 0.9).add(V(0, 0.18, 0)).normalize();
  const dist = b.radius * 10;
  const travel = c.position.distanceTo(p0);
  await flyTo(() => bodyPos(id, clock.t).addScaledVector(dir, dist), () => bodyPos(id, clock.t), THREE.MathUtils.clamp(2 + Math.log10(1 + travel) * 2.4, 2.2, 5.5), smoother);
  if (isStaleNav(ticket)) return;
  // swap into the planet frame with identical apparent size, direction and sunlight
  const rel = c.position.clone().sub(bodyPos(id, clock.t)).multiplyScalar(k);
  env.sunDir.copy(sunDir);
  env.sunBase.copy(sunDir);
  set({ scene: "planet", world: id, sunPhase: 0 });
  setView(rel, V());
  await nextFrames();
  if (isStaleNav(ticket)) return;
  showBanner(b.name.toUpperCase(), "ORBITAL INSERTION", 2400);
  await flyTo(rel.clone().normalize().multiplyScalar(300), V(), 2.6, easeOut);
  if (isStaleNav(ticket)) return;
  set({ camMode: "orbit" });
}

export async function selectSite(id: string, nav?: NavTicket) {
  const art = artifactById(id);
  if (!art || S().scene !== "planet") return;
  const ticket = nav ?? beginNav(`selectSite:${id}`);
  sfx.select();
  set({ artifactId: id });
  const c = cam.camera!;
  const n = lonLatToVec(art.location.lon, art.location.lat, 1);
  const d = Math.max(c.position.length(), 190);
  await flyTo(n.clone().multiplyScalar(d), V(), 2.4, smoother);
  if (isStaleNav(ticket)) return;
  setFollow(null);
}

export function configureForArtifact(a: Artifact, start?: number) {
  const t0 = a.dates.landing ?? a.dates.launch;
  configureClock({
    mode: a.clock.kind === "sol" ? "mission" : "historical",
    rate: a.clock.rate,
    range: a.clock.range,
    t: start ?? t0,
    speedIdx: 1,
    playing: false,
    dir: 1,
  });
}

function saveLast(a: Artifact) {
  const sol = a.clock.kind === "sol" && a.dates.landing ? Math.floor((clock.t - a.dates.landing) / SOL_MS) : undefined;
  const last = { artifactId: a.id, world: a.destination, sol };
  persist("echoes.last", last);
  set({ last });
}
export const saveLastLocation = saveLast;

export async function descendToSite(id: string, startT?: number, nav?: NavTicket) {
  const art = artifactById(id);
  if (!art || art.destination === "deep-space") return;
  const ticket = nav ?? beginNav(`descendToSite:${id}`);
  const world = art.destination;
  if (S().scene !== "planet" || S().world !== world) await goToPlanet(world, ticket);
  if (isStaleNav(ticket)) return;
  const c = cam.camera!;
  set({ artifactId: id, camMode: "cinematic", instrumentId: null });
  setFollow(null);
  sfx.confirm();
  showBanner(`${art.designation} · ${art.name}`, `${art.location.region} · ${world.toUpperCase()}`, 2600);
  const R = GLOBE_R;
  const unitsM = (RADIUS_KM[world] * 1000) / R;
  const n = lonLatToVec(art.location.lon, art.location.lat, 1);
  const east = V(0, 1, 0).cross(n).normalize();
  const north = n.clone().cross(east).normalize();
  const el = art.sun.el * D2R;
  const az = art.sun.az * D2R;
  const sunSite = east.clone().multiplyScalar(Math.cos(el) * Math.sin(az)).addScaledVector(north, Math.cos(el) * Math.cos(az)).addScaledVector(n, Math.sin(el)).normalize();
  const sun0 = env.sunDir.clone();
  const offDir = east.clone().multiplyScalar(APPROACH.x).addScaledVector(north, -APPROACH.y);
  const p0 = c.position.clone();
  const g0 = V();
  const dir0 = p0.clone().normalize();
  const alt0 = Math.max(1, p0.length() - R);
  const altEnd = 0.6;
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion().setFromUnitVectors(dir0, n);
  await fly(
    5.2,
    (u, p, g) => {
      const a = easeInOut(Math.min(1, u * 1.08));
      q0.identity().slerp(q1, a);
      const dir = dir0.clone().applyQuaternion(q0);
      const alt = Math.exp(Math.log(alt0) + (Math.log(altEnd) - Math.log(alt0)) * Math.pow(u, 0.85));
      p.copy(dir).multiplyScalar(R + alt).addScaledVector(offDir, alt * 1.1 * u * u);
      g.lerpVectors(g0, n.clone().multiplyScalar(R), smoother(u));
      env.sunDir.copy(sun0).lerp(sunSite, easeInOut(u)).normalize();
    },
    (u) => u
  );
  if (isStaleNav(ticket)) return;
  // atmospheric descent: dust haze veils the scene swap
  await veil(true, world === "mars" ? "mars" : "dark", 500);
  if (isStaleNav(ticket)) return;
  const alt = altEnd * unitsM;
  configureForArtifact(art, startT);
  set({ scene: "site", world, artifactId: id });
  const startPos = V(APPROACH.x * alt * 1.1, alt, APPROACH.y * alt * 1.1);
  setView(startPos, V(0, 0, 0));
  await nextFrames();
  await wait(250);
  await veil(false, "dark", 650);
  await arrive(art);
  if (isStaleNav(ticket)) return;
  markVisit(id, art.designation || art.name);
  queueVignette(id);
  saveLast(art);
  // Auto-activate mission journey experience (documentary only — the journey
  // overlay never drives the camera by itself, see transitionToJourneyChapter).
  set({ overlay: "mission-journey", menuOpen: false });
}

async function arrive(art: Artifact, nav?: NavTicket) {
  const c = cam.camera!;
  set({ arrival: { active: true, label: art.name }, camMode: "cinematic" });
  const tgt = () => siteRef.pos.clone();
  const s0 = c.position.clone().sub(tgt());
  const D0 = s0.length();
  const az0 = Math.atan2(s0.z, s0.x);
  const pitch0 = Math.asin(s0.y / D0);
  const D1 = { mer: 9.5, sojourner: 1.9, insight: 8, apollo: 30, voyager: 20 }[art.model.kind];
  const azEnd = az0 + 0.55;
  showBanner("MISSION REGION", `${art.name} · ${art.dates.landing ? "SURFACE" : ""}`, 2400);
  await fly(
    7.5,
    (u, p, g) => {
      const e = easeInOut(u);
      const d = D0 * Math.pow(D1 / D0, e);
      const pitch = pitch0 + (0.2 - pitch0) * e;
      const az = az0 + (azEnd - az0) * e;
      const t = tgt();
      g.copy(t);
      p.set(t.x + Math.cos(az) * Math.cos(pitch) * d, t.y + Math.sin(pitch) * d, t.z + Math.sin(az) * Math.cos(pitch) * d);
    },
    (u) => u
  );
  if (isStaleNav(nav)) return;
  set({ arrival: { active: false, label: "" }, camMode: "orbit" });
}

export async function goToPlanet(world: string, nav?: NavTicket) {
  const ticket = nav ?? beginNav(`goToPlanet:${world}`);
  let st = S();
  if (st.scene === "planet" && st.world === world) return;
  if (st.scene === "site") {
    await leaveSite(ticket);
    st = S();
  }
  if (isStaleNav(ticket)) return;
  if (st.scene === "planet" && st.world !== world) await returnToSolarSystem(true, `goToPlanet:${world}`, ticket);
  if (isStaleNav(ticket)) return;
  st = S();
  if (st.scene === "solar") await travelToBody(world, ticket);
}

export async function leaveSite(nav?: NavTicket) {
  const art = currentArtifact();
  if (!art || S().scene !== "site") return;
  const ticket = nav ?? beginNav("leaveSite");
  resetPanels();
  // Leaving the device closes its journey overlay: while that overlay is open
  // the whole HUD (device lists, search, planet panel) is hidden, so leaving
  // the site with it still up would strand the user in the documentary.
  set({ overlay: null });
  sfx.close();
  setFollow(null);
  await veil(true, art.destination === "mars" ? "mars" : "dark", 650);
  if (isStaleNav(ticket)) return;
  const n = lonLatToVec(art.location.lon, art.location.lat, 1);
  set({ scene: "planet", world: art.destination, camMode: "orbit" });
  configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
  setView(n.clone().multiplyScalar(GLOBE_R + 0.8), n.clone().multiplyScalar(GLOBE_R));
  await nextFrames();
  await veil(false, "dark", 700);
  if (isStaleNav(ticket)) return;
  showBanner(art.destination.toUpperCase(), "ORBITAL VIEW", 2400);
  await flyTo(n.clone().multiplyScalar(260), V(), 5.5, easeOut);
}

export async function returnToSolarSystem(quick = false, reason = "unspecified", nav?: NavTicket) {
  const ticket = nav ?? beginNav(`returnToSolarSystem:${reason}`);
  navTrace("returnToSolarSystem", reason, { quick, nav: ticket.id });
  let st = S();
  resetPanels();
  set({ overlay: null });
  if (st.scene === "site") {
    await leaveSite(ticket);
    st = S();
  }
  if (isStaleNav(ticket)) return;
  if (st.scene === "planet") {
    const world = st.world;
    const b = bodyById(world)!;
    const k = GLOBE_R / b.radius;
    const c = cam.camera!;
    await flyTo(c.position.clone().normalize().multiplyScalar(1000), V(), quick ? 1.8 : 3.5, smoother);
    if (isStaleNav(ticket)) return;
    configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
    const bp = bodyPos(world, clock.t);
    const rel = c.position.clone().multiplyScalar(1 / k);
    set({ scene: "solar", world: "solar", focusBody: world, artifactId: null });
    setView(bp.clone().add(rel), bp);
    await nextFrames();
    st = S();
  }
  if (st.artifactId === "voyager1") exitVoyager();
  set({ artifactId: null, camMode: "overview" });
  if (!quick) {
    showBanner("SOLAR SYSTEM", "RETURN", 2600);
    await flyTo(V(0, 150, 175), V(), 6.5, smoother);
  }
  if (isStaleNav(ticket)) return;
  setFollow(null);
}

export async function goToArtifact(id: string, opts: { t?: number } = {}, nav?: NavTicket) {
  const art = artifactById(id);
  if (!art) return;
  const ticket = nav ?? beginNav(`goToArtifact:${id}`);
  set({ overlay: null, menuOpen: false });
  stopReplay();
  if (art.destination === "deep-space") {
    if (S().scene !== "solar") await returnToSolarSystem(true, "goToArtifact:deep-space", ticket);
    if (isStaleNav(ticket)) return;
    return goVoyager(ticket);
  }
  let st = S();
  if (st.scene === "site" && st.artifactId === id) {
    resetPanels();
    return;
  }
  if (st.scene === "site") {
    await leaveSite(ticket);
    st = S();
  }
  if (isStaleNav(ticket)) return;
  if (st.scene === "planet" && st.world !== art.destination) {
    await returnToSolarSystem(true, "goToArtifact:cross-planet", ticket);
    st = S();
  }
  if (isStaleNav(ticket)) return;
  if (st.scene === "solar") {
    if (st.artifactId === "voyager1") exitVoyager();
    await travelToBody(art.destination, ticket);
    if (isStaleNav(ticket)) return;
  }
  await descendToSite(id, opts.t, ticket);
}

/* ------------------------------------------------------------------ camera modes */
export async function setCamMode(mode: CamMode) {
  const st = S();
  const c = cam.camera!;
  if (st.flying && mode !== "cinematic") return;
  sfx.select();
  switch (mode) {
    case "orbit": {
      if (st.camMode === "inspect") return exitInspect();
      set({ camMode: "orbit" });
      const a = anchor();
      if (st.scene !== "site") setFollow(st.scene === "solar" ? () => anchor() : null);
      await flyTo(c.position.clone(), a, 0.9, smoother);
      return;
    }
    case "free":
      set({ camMode: "free" });
      setFollow(null);
      return;
    case "follow": {
      if (st.scene === "planet") {
        set({ camMode: "orbit" });
        return;
      }
      set({ camMode: "follow" });
      const a = anchor();
      const off = c.position.clone().sub(a);
      const want = st.scene === "site" ? 28 : st.focusBody === "voyager1" ? 0.9 : bodyById(st.focusBody)!.radius * 4;
      off.setLength(want);
      if (st.scene === "site") off.y = Math.max(off.y, 6);
      await flyTo(() => anchorLive().add(off), anchorLive, 1.6, smoother);
      setFollow(anchorLive);
      return;
    }
    case "surface": {
      if (st.scene !== "site") {
        showBanner("SURFACE MODE", "REQUIRES A MISSION SITE", 2600);
        return;
      }
      setFollow(null);
      const t = siteRef.pos.clone();
      const px = t.x + 9, pz = t.z + 7;
      const eye = V(px, heightAt(px, pz) + 1.7, pz);
      await flyTo(eye, t, 2.2, smoother);
      set({ camMode: "surface" });
      return;
    }
    case "inspect":
      return inspectHardware();
    case "cinematic":
      set({ camMode: "cinematic" });
      return;
    case "overview":
      return overview();
  }
}
const anchorLive = () => anchor();

/* ------------------------------------------------------------------ inspection */
const INSPECT_VIEW: Record<string, { off: [number, number, number]; tgt: [number, number, number] }> = {
  mer: { off: [3.4, 1.7, 3.1], tgt: [0.1, 0.72, 0] },
  sojourner: { off: [1.5, 0.75, 1.3], tgt: [0, 0.2, 0] },
  insight: { off: [4.6, 2.3, 4.8], tgt: [0.3, 0.7, 0.5] },
  apollo: { off: [15, 5.5, 13], tgt: [0, 1.4, 0] },
  voyager: { off: [13, 5, 15], tgt: [0, 0, 0] },
};

export async function inspectHardware() {
  const art = currentArtifact();
  const g = siteRef.group;
  if (!art || !g) return;
  sfx.open();
  set({ camMode: "inspect", instrumentId: null, scienceOpen: false, replay: { ...S().replay, active: false } });
  setFollow(null);
  const v = INSPECT_VIEW[art.model.kind];
  await flyTo(() => g.localToWorld(V(...v.off)), () => g.localToWorld(V(...v.tgt)), 3, smoother);
}

export function exitInspect() {
  sfx.close();
  set({ camMode: "orbit", instrumentId: null, scienceOpen: false, compareOpen: false });
}

export async function focusInstrument(id: string) {
  const art = currentArtifact();
  const g = siteRef.group;
  if (!art || !g) return;
  const hw = art.hardware.find((h) => h.id === id);
  if (!hw) return;
  sfx.select();
  set({ instrumentId: id, camMode: "inspect", scienceOpen: false, questionId: null });
  const wp = g.localToWorld(V(...hw.pos));
  const q = g.getWorldQuaternion(new THREE.Quaternion());
  const dirW = V(...hw.view).normalize().applyQuaternion(q);
  const pos = wp.clone().addScaledVector(dirW, hw.dist * g.scale.x);
  await flyTo(pos, wp, 1.7, smoother);
}

export async function openScience(questionId?: string) {
  const art = currentArtifact();
  if (!art) return;
  const id = S().instrumentId;
  const q = art.scientificQuestions.find((x) => x.id === questionId) ?? art.scientificQuestions.find((x) => id && x.instrumentIds.includes(id)) ?? art.scientificQuestions[0];
  sfx.data();
  set({ scienceOpen: true, questionId: q?.id ?? null, level: "explore" });
  const c = cam.camera!;
  const t = cam.controls.target.clone();
  const p = c.position.clone();
  const back = p.clone().sub(t).multiplyScalar(0.7);
  await flyTo(p.clone().add(back), t, 1.6, smoother);
}

export function closeScience() {
  set({ scienceOpen: false });
}

/* ------------------------------------------------------------------ timeline / replay */

let replayToken = 0;
let replaySkip: number | null = null;
export const replayControl = {
  next: () => (replaySkip = 1),
  prev: () => (replaySkip = -1),
};

function tweenTime(to: number, sec: number, token: number) {
  return new Promise<void>((resolve) => {
    const from = clock.t;
    const t0 = performance.now();
    clock.playing = false;
    const step = () => {
      if (token !== replayToken) return resolve();
      const u = Math.min(1, (performance.now() - t0) / (sec * 1000));
      setT(from + (to - from) * smoother(u));
      if (u < 1) requestAnimationFrame(step);
      else resolve();
    };
    step();
  });
}

export async function startReplay() {
  const art = currentArtifact();
  if (!art) return;
  const token = ++replayToken;
  const landing = art.dates.landing ?? art.dates.launch;
  const events = art.timeline.filter((e) => e.t >= landing || art.destination === "deep-space").sort((a, b) => a.t - b.t);
  resetPanels();
  set({ replay: { active: true, index: 0, paused: false }, camMode: "follow", overlay: null });
  sfx.open();
  if (S().scene === "site") {
    setT(events[0].t);
    await nextFrames();
    const t = siteRef.pos.clone();
    const p = t.clone().add(V(-6, 4, 9));
    await flyTo(p, t, 2.2, smoother);
    setFollow(() => siteRef.pos.clone());
  } else if (S().artifactId === "voyager1") {
    setT(events[0].t);
  }
  let i = 0;
  while (i < events.length) {
    if (token !== replayToken) return;
    const e = events[i];
    await tweenTime(e.t, i === 0 ? 0.5 : 3.2, token);
    if (token !== replayToken) return;
    set({ activeEventId: e.id, replay: { active: true, index: i, paused: S().replay.paused } });
    sfx.event();
    if (S().scene === "site" && art.missionPath) {
      const dist = e.kind === "science" ? 11 : e.kind === "incident" ? 16 : e.kind === "end" ? 34 : 24;
      const cur = cam.camera!.position.clone().sub(siteRef.pos);
      cur.setLength(dist);
      cur.y = Math.max(cur.y, dist * 0.3);
      const tgtOff = cur.clone();
      await flyTo(() => siteRef.pos.clone().add(tgtOff), () => siteRef.pos.clone(), 2, smoother);
    }
    replaySkip = null;
    let held = 0;
    while (token === replayToken && replaySkip === null && held < 6500) {
      await wait(100);
      if (!S().replay.paused) held += 100;
    }
    const skip = replaySkip;
    replaySkip = null;
    i = skip === -1 ? Math.max(0, i - 1) : i + 1;
  }
  if (token !== replayToken) return;
  setFollow(null);
  set({ replay: { active: false, index: -1, paused: false } });
  await openRemains();
}

export function stopReplay() {
  replayToken++;
  if (S().replay.active) {
    set({ replay: { active: false, index: -1, paused: false }, activeEventId: null });
    if (S().scene === "site" || S().artifactId === "voyager1") setFollow(null);
    if (S().camMode === "follow") set({ camMode: "orbit" });
  }
}

export function toggleReplayPause() {
  const r = S().replay;
  set({ replay: { ...r, paused: !r.paused } });
}

/* ------------------------------------------------------------------ what remains / finale */
export async function openRemains() {
  const art = currentArtifact();
  if (!art) return;
  stopReplay();
  set({ overlay: "remains", instrumentId: null, scienceOpen: false, compareOpen: false });
  sfx.open();
  if (S().scene === "site") {
    const wps = art.missionPath?.waypoints;
    setT(wps ? wps[wps.length - 1].t : art.dates.end ?? clock.t);
    clock.playing = false;
    await nextFrames();
    setFollow(null);
    const t = siteRef.pos.clone();
    const dist = art.model.kind === "apollo" ? 40 : 11;
    await flyTo(t.clone().add(V(-dist * 0.7, dist * 0.35, dist * 0.8)), t, 3.2, smoother);
    set({ camMode: "orbit" });
  }
}

export async function playFinale() {
  set({ overlay: "finale", instrumentId: null, scienceOpen: false });
  sfx.event();
  setFollow(null);
  if (S().scene === "site") {
    const t = siteRef.pos.clone();
    const c = cam.camera!;
    const dir = c.position.clone().sub(t).normalize();
    dir.y = Math.max(dir.y, 0.25);
    dir.normalize();
    await fly(
      14,
      (u, p, g) => {
        const e = easeInOut(u);
        g.copy(t);
        p.copy(t).addScaledVector(dir, 12 * Math.pow(2600 / 12, e));
      },
      (u) => u
    );
  } else await wait(8000);
}

export async function leaveFinale() {
  set({ overlay: null });
  await returnToSolarSystem(false, "leave-finale");
}

/* ------------------------------------------------------------------ scrubbing helper for demo */
export function animateTime(to: number, sec: number) {
  const token = ++replayToken;
  return tweenTime(to, sec, token);
}

export const _day = DAY_MS;

/** F — focus the current subject with a short, continuous flight. */
export async function flyAnchor() {
  const st = S();
  if (st.flying) return;
  const c = cam.camera!;
  const a = anchor();
  const off = c.position.clone().sub(a);
  const want = st.scene === "site" ? Math.max(14, Math.min(off.length(), 40)) : off.length();
  off.setLength(want);
  await flyTo(() => anchor().add(off), anchor, 1.6, smoother);
}

/** Minimap navigation: fly to a local site position. */
export async function flyToLocal(x: number, z: number) {
  if (S().scene !== "site" || S().flying) return;
  sfx.select();
  setFollow(null);
  set({ camMode: "orbit" });
  const g = heightAt(x, z);
  const p = V(x + APPROACH.x * 90, 0, z + APPROACH.y * 90);
  p.y = heightAt(p.x, p.z) + 45;
  const from = cam.camera!.position.distanceTo(p);
  await flyTo(p, V(x, g, z), THREE.MathUtils.clamp(1.6 + Math.log10(1 + from), 2, 5), smoother);
}

/** Minimap navigation on a globe: rotate the orbital view to a longitude / latitude. */
export async function flyToLonLat(lon: number, lat: number) {
  if (S().scene !== "planet" || S().flying) return;
  sfx.select();
  const n = lonLatToVec(lon, Math.max(-85, Math.min(85, lat)), 1);
  const d = Math.max(cam.camera!.position.length(), 190);
  await flyTo(n.multiplyScalar(d), V(), 2.2, smoother);
}

/* ------------------------------------------------------------------ journey camera choreography */

import type { MissionChapter } from "@/data/journeys/types";

/**
 * JOURNEY CHAPTER POLICY — documentary playback vs live exploration.
 *
 * A mission-journey chapter is a DOCUMENTARY record. Selecting one updates the
 * overlay content and the timeline (the MissionJourney component owns the
 * clock); it is not a navigation command.
 *
 * Camera choreography for a chapter is allowed ONLY inside the site the user
 * is already at:
 *
 *  1. Pre-touchdown chapters are HISTORICAL PLAYBACK: content + timeline only,
 *     never a camera or scene change. They used to call returnToSolarSystem()
 *     and focusBody("earth"), which threw the user out of a live device site —
 *     and, mid-transfer, out of the world they were travelling to.
 *  2. At ANOTHER device's site, on a planet, or in the Solar System:
 *     documentary only. The live exploration location is untouched — the user
 *     chooses a device from the HUD (device list / search), never from a
 *     documentary chapter.
 *  3. At the device's OWN site, post-landing chapter: the camera may move
 *     inside that site (mission-path waypoint visit / cinematic orbit).
 *
 * Historical playback is deliberately kept separate from live exploration
 * navigation: a documentary chapter never moves the exploration location.
 */

/** Event types that are, by definition, before the device reached its world. */
const HISTORICAL_EVENT_TYPES = new Set(["development", "launch", "cruise", "maneuver", "approach", "transfer"]);

/**
 * True when the chapter documents a moment before the device touched down.
 * Classified from the mission's own dates (and the event-type vocabulary), not
 * from a hand-picked subset of chapter labels, so every pre-landing chapter —
 * whatever it is called — is treated as historical playback.
 */
export function isHistoricalChapter(art: Artifact, chapter: MissionChapter): boolean {
  const ev = (chapter.eventType || "").toLowerCase();
  if (HISTORICAL_EVENT_TYPES.has(ev)) return true;
  const touchdown = art.dates.landing ?? art.dates.launch;
  if (!touchdown) return false;
  return chapter.dateUtc > 0 && chapter.dateUtc < touchdown;
}

/** Waypoint on the mission path that a chapter refers to (if any). */
function matchWaypoint(art: Artifact, chapter: MissionChapter): string | null {
  const hasMissionPath = !!art.missionPath && art.missionPath.waypoints.length > 0;
  if (!hasMissionPath || !art.missionPath) return null;
  const eventLower = chapter.eventType.toLowerCase();
  const titleLower = chapter.title.toLowerCase();
  if (eventLower === "landing" || titleLower.includes("eagle")) return "eagle";
  if (eventLower === "exploration" && titleLower.includes("endurance")) return "endurance";
  if (titleLower.includes("burns")) return "burns";
  if (titleLower.includes("heat shield") || titleLower.includes("meteorite")) return "heatshield";
  if (titleLower.includes("purgatory")) return "purgatory";
  if (titleLower.includes("victoria") && !titleLower.includes("exit")) return "victoria";
  if (titleLower.includes("victoria exit") || titleLower.includes("leaves victoria")) return "victoria-exit";
  if (titleLower.includes("cape york") || titleLower.includes("endeavour rim")) return "capeyork";
  if (titleLower.includes("marathon valley")) return "marathon";
  if (titleLower.includes("perseverance valley")) return "perseverance";
  if (eventLower === "traverse" || eventLower === "drive") {
    if (chapter.sol === null) return null;
    const wps = art.missionPath.waypoints;
    const base = art.dates.landing ?? art.dates.launch;
    let closest = wps[0];
    for (const wp of wps) {
      const wpSol = Math.floor((wp.t - base) / SOL_MS);
      const closestSol = Math.floor((closest.t - base) / SOL_MS);
      if (Math.abs(wpSol - chapter.sol) < Math.abs(closestSol - chapter.sol)) closest = wp;
    }
    return closest.id;
  }
  return null;
}

/** Slow orbit around the hardware — the camera stays inside the current site. */
async function cinematicOrbit(nav?: NavTicket) {
  await setCamMode("cinematic");
  if (isStaleNav(nav)) return;
  const t = siteRef.pos.clone();
  const c = cam.camera!;
  const dir = c.position.clone().sub(t).normalize();
  await fly(
    4,
    (u, p, g) => {
      const e = easeInOut(u);
      const az = Math.atan2(dir.z, dir.x) + Math.PI * 0.5 * e;
      const d = 18;
      g.copy(t);
      p.set(t.x + Math.cos(az) * d, t.y + d * 0.3, t.z + Math.sin(az) * d);
    },
    (u) => u
  );
  if (isStaleNav(nav)) return;
  await setCamMode("orbit");
}

/**
 * Execute camera choreography for a journey chapter transition.
 * Called when the user navigates between chapters in the MissionJourney overlay.
 *
 * A chapter NEVER changes the exploration location: it may only move the
 * camera inside the site the user is already at, and only for that device's
 * own post-landing chapters. Everything else is documentary playback.
 */
export async function transitionToJourneyChapter(artifactId: string, chapter: MissionChapter) {
  const art = artifactById(artifactId);
  if (!art) return;

  // A chapter claims a CHAPTER ticket: it never invalidates a device transfer,
  // and a newer device transfer invalidates it.
  const nav = beginNav(`journey-chapter:${artifactId}:${chapter.id}`, "chapter");
  // Never drop the transition silently — wait for any camera move to finish.
  await waitForIdle();
  if (isStaleNav(nav)) return;

  const st = S();
  const atSite = st.scene === "site";
  const onDevice = atSite && st.artifactId === artifactId;

  // (1) Historical playback: documentary content + timeline only.
  if (isHistoricalChapter(art, chapter)) {
    navTrace("journey-chapter", `historical-playback:${chapter.eventType}`, { artifactId, chapter: chapter.id });
    return;
  }

  // (2) Anything that is not this device's own site is live exploration
  //     (another device's site, a planet, the Solar System): documentary only.
  if (!onDevice) {
    navTrace("journey-chapter", atSite ? "documentary-only:other-device-site" : "documentary-only:outside-site", {
      artifactId,
      chapter: chapter.id,
    });
    return;
  }

  // (3) The device's own site: the camera may move inside this site.
  const targetWaypoint = matchWaypoint(art, chapter);
  if (targetWaypoint) {
    navTrace("journey-chapter", "waypoint-visit", { artifactId, chapter: chapter.id, waypoint: targetWaypoint });
    await visitWaypoint(artifactId, targetWaypoint, nav, false);
    return;
  }

  navTrace("journey-chapter", "site-orbit", { artifactId, chapter: chapter.id });
  await cinematicOrbit(nav);
}

/**
 * Move the camera to a mission-path waypoint.
 * `allowDescend` is false for chapter playback: a documentary must never move
 * the user to another site — it only frames the hardware that is already there.
 */
export async function visitWaypoint(artifactId: string, wpId: string, nav?: NavTicket, allowDescend = true) {
  const art = artifactById(artifactId);
  if (!art) return;
  const ticket = nav ?? beginNav(`visitWaypoint:${artifactId}:${wpId}`);

  sfx.confirm();
  setFollow(null);
  set({ camMode: "orbit" });
  setT((art.missionPath?.waypoints.find(w => w.id === wpId)?.t) ?? clock.t);
  await nextFrames();
  if (isStaleNav(ticket)) return;

  const freshSt = S();
  if (freshSt.scene !== "site" || freshSt.artifactId !== artifactId) {
    if (!allowDescend) return; // documentary playback: never leave the current site
    await descendToSite(artifactId, undefined, ticket);
    if (isStaleNav(ticket)) return;
  }

  const finalSt = S();
  if (finalSt.scene === "site" && finalSt.artifactId === artifactId) {
    const t = siteRef.pos.clone();
    const dist = ({ mer: 10, sojourner: 2.4, insight: 8, apollo: 30, voyager: 18 } as Record<string, number>)[art.model.kind] ?? 10;
    const p = V(t.x + APPROACH.x * dist, 0, t.z + APPROACH.y * dist);
    p.y = heightAt(p.x, p.z) + dist * 0.32;
    const from = cam.camera!.position.distanceTo(p);
    await flyTo(p, t, THREE.MathUtils.clamp(2 + Math.log10(1 + from) * 1.2, 2.5, 6), smoother);
  }
}