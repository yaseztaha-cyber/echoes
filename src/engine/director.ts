import * as THREE from "three";
import { useEcho, showBanner, persist, type CamMode } from "@/state/store";
import { cam, fly, flyTo, setView, setFollow, wait, smoother, easeInOut, easeOut } from "./cameras/controller";
import { clock, configureClock, setT } from "./time/clock";
import { bodyById, bodyPos } from "./frames/frames";
import { artifactById } from "@/data/artifacts";
import { VOYAGER_NOW } from "@/data/artifacts/voyager";
import { env, siteRef } from "./telemetry";
import { GLOBE_R, RADIUS_KM, lonLatToVec, D2R } from "@/lib/geo";
import { heightAt } from "./terrain/height";
import { globeResidency, HI_URLS } from "./textures/manager";
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
  showBanner("EARTH", "SOLAR SYSTEM · VISUAL SCALE ADJUSTED FOR NAVIGATION", 4200);
  flyTo(() => bodyPos("earth", clock.t).addScaledVector(dir, b.radius * 7), () => bodyPos("earth", clock.t), 6, smoother);
}

/* ------------------------------------------------------------------ solar system */
export async function focusBody(id: string) {
  const st = S();
  if (st.scene !== "solar") return;
  if (id === "voyager1") return goVoyager();
  const b = bodyById(id);
  if (!b) return;
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
  if (S().focusBody === id && S().scene === "solar") setFollow(() => bodyPos(id, clock.t));
}

export async function goVoyager() {
  const art = artifactById("voyager1")!;
  sfx.confirm();
  set({ focusBody: "voyager1", artifactId: "voyager1", camMode: "follow", instrumentId: null });
  setFollow(null);
  configureClock({ mode: "historical", rate: art.clock.rate, range: art.clock.range, t: VOYAGER_NOW, speedIdx: 1, playing: false, dir: 1 });
  await nextFrames();
  const vp = () => (siteRef.group ? siteRef.pos.clone() : bodyPos("voyager1", clock.t));
  const c = cam.camera!;
  const start = vp();
  const sunDir = start.clone().negate().normalize();
  const off = sunDir.clone().multiplyScalar(0.4).add(V(0.25, 0.35, 0.6)).normalize().multiplyScalar(0.95);
  showBanner("VOYAGER 1", "EARTH → TRAJECTORY → SPACECRAFT → INTERSTELLAR SPACE", 4200);
  void c;
  await flyTo(() => vp().add(off), vp, 9, smoother);
  setFollow(vp);
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
export async function travelToBody(id: string) {
  const b = bodyById(id)!;
  const k = GLOBE_R / b.radius;
  sfx.confirm();
  if (S().artifactId === "voyager1") exitVoyager();
  // Commit point: destination known → warm its hi-res texture now so the
  // approach sharpens instead of arriving blurry (high/ultra tiers only).
  const hi = HI_URLS[id];
  if (hi) {
    const q = S().quality;
    if (q === "high" || q === "ultra") globeResidency.request(hi, 5);
  }
  set({ focusBody: id, artifactId: null, camMode: "orbit", instrumentId: null });
  setFollow(null);
  showBanner(b.name, "DISTANCE · APPROACH", 4800);
  const c = cam.camera!;
  const p0 = bodyPos(id, clock.t);
  const sunDir = p0.clone().negate().normalize();
  const toCam = c.position.clone().sub(p0).normalize();
  const dir = toCam.multiplyScalar(0.3).addScaledVector(sunDir, 0.9).add(V(0, 0.18, 0)).normalize();
  const dist = b.radius * 10;
  const travel = c.position.distanceTo(p0);
  await flyTo(() => bodyPos(id, clock.t).addScaledVector(dir, dist), () => bodyPos(id, clock.t), THREE.MathUtils.clamp(3 + Math.log10(1 + travel) * 3.2, 4.5, 11), smoother);
  // swap into the planet frame with identical apparent size, direction and sunlight
  const rel = c.position.clone().sub(bodyPos(id, clock.t)).multiplyScalar(k);
  env.sunDir.copy(sunDir);
  set({ scene: "planet", world: id });
  setView(rel, V());
  await nextFrames();
  showBanner(b.name.toUpperCase(), "ORBITAL INSERTION", 3800);
  await flyTo(rel.clone().normalize().multiplyScalar(300), V(), 5, easeOut);
  set({ camMode: "orbit" });
}

export async function selectSite(id: string) {
  const art = artifactById(id);
  if (!art || S().scene !== "planet") return;
  sfx.select();
  set({ artifactId: id });
  const c = cam.camera!;
  const n = lonLatToVec(art.location.lon, art.location.lat, 1);
  const d = Math.max(c.position.length(), 190);
  await flyTo(n.clone().multiplyScalar(d), V(), 2.4, smoother);
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

export async function descendToSite(id: string, startT?: number) {
  const art = artifactById(id);
  if (!art || art.destination === "deep-space") return;
  const world = art.destination;
  if (S().scene !== "planet" || S().world !== world) await goToPlanet(world);
  const c = cam.camera!;
  set({ artifactId: id, camMode: "cinematic", instrumentId: null });
  setFollow(null);
  sfx.confirm();
  showBanner(`${art.designation} · ${art.name}`, `${art.location.region} · ${world.toUpperCase()}`, 4500);
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
    10,
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
  // atmospheric descent: dust haze veils the scene swap
  await veil(true, world === "mars" ? "mars" : "dark", 700);
  const alt = altEnd * unitsM;
  configureForArtifact(art, startT);
  set({ scene: "site", world, artifactId: id });
  const startPos = V(APPROACH.x * alt * 1.1, alt, APPROACH.y * alt * 1.1);
  setView(startPos, V(0, 0, 0));
  await nextFrames();
  await wait(500);
  await veil(false, "dark", 800);
  await arrive(art);
  saveLast(art);
}

async function arrive(art: Artifact) {
  const c = cam.camera!;
  set({ arrival: { active: true, label: art.name }, camMode: "cinematic" });
  const tgt = () => siteRef.pos.clone();
  const s0 = c.position.clone().sub(tgt());
  const D0 = s0.length();
  const az0 = Math.atan2(s0.z, s0.x);
  const pitch0 = Math.asin(s0.y / D0);
  const D1 = { mer: 12.5, sojourner: 4.2, insight: 9, apollo: 34, voyager: 20 }[art.model.kind];
  const azEnd = az0 + 0.55;
  showBanner("MISSION REGION", `${art.name} · ${art.dates.landing ? "SURFACE" : ""}`, 3600);
  await fly(
    15,
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
  set({ arrival: { active: false, label: "" }, camMode: "orbit" });
}

export async function goToPlanet(world: string) {
  const st = S();
  if (st.scene === "planet" && st.world === world) return;
  if (st.scene === "site") await leaveSite();
  if (S().scene === "planet" && S().world !== world) await returnToSolarSystem(true);
  if (S().scene === "solar") await travelToBody(world);
}

export async function leaveSite() {
  const art = currentArtifact();
  if (!art || S().scene !== "site") return;
  resetPanels();
  sfx.close();
  setFollow(null);
  await veil(true, art.destination === "mars" ? "mars" : "dark", 650);
  const n = lonLatToVec(art.location.lon, art.location.lat, 1);
  set({ scene: "planet", world: art.destination, camMode: "orbit" });
  configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
  setView(n.clone().multiplyScalar(GLOBE_R + 0.8), n.clone().multiplyScalar(GLOBE_R));
  await nextFrames();
  await veil(false, "dark", 700);
  showBanner(art.destination.toUpperCase(), "ORBITAL VIEW", 2400);
  await flyTo(n.clone().multiplyScalar(260), V(), 5.5, easeOut);
}

export async function returnToSolarSystem(quick = false) {
  const st = S();
  resetPanels();
  set({ overlay: null });
  if (st.scene === "site") await leaveSite();
  if (S().scene === "planet") {
    const world = S().world;
    const b = bodyById(world)!;
    const k = GLOBE_R / b.radius;
    const c = cam.camera!;
    await flyTo(c.position.clone().normalize().multiplyScalar(1000), V(), quick ? 1.8 : 3.5, smoother);
    configureClock({ mode: "solar-system", rate: 3600000, range: null, t: Date.now(), speedIdx: 1, playing: true, dir: 1 });
    const bp = bodyPos(world, clock.t);
    const rel = c.position.clone().multiplyScalar(1 / k);
    set({ scene: "solar", world: "solar", focusBody: world, artifactId: null });
    setView(bp.clone().add(rel), bp);
    await nextFrames();
  }
  if (S().artifactId === "voyager1") exitVoyager();
  set({ artifactId: null, camMode: "overview" });
  if (!quick) {
    showBanner("SOLAR SYSTEM", "RETURN", 2600);
    await flyTo(V(0, 150, 175), V(), 6.5, smoother);
  }
  setFollow(null);
}

export async function goToArtifact(id: string, opts: { t?: number } = {}) {
  const art = artifactById(id);
  if (!art) return;
  set({ overlay: null, menuOpen: false });
  stopReplay();
  if (art.destination === "deep-space") {
    if (S().scene !== "solar") await returnToSolarSystem(true);
    return goVoyager();
  }
  const st = S();
  if (st.scene === "site" && st.artifactId === id) {
    resetPanels();
    return;
  }
  if (st.scene === "site") await leaveSite();
  if (S().scene === "planet" && S().world !== art.destination) await returnToSolarSystem(true);
  if (S().scene === "solar") {
    if (S().artifactId === "voyager1") exitVoyager();
    await travelToBody(art.destination);
  }
  await descendToSite(id, opts.t);
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
export async function visitWaypoint(artifactId: string, wpId: string) {
  const art = artifactById(artifactId);
  const w = art?.missionPath?.waypoints.find((x) => x.id === wpId);
  if (!art || !w || S().scene !== "site") return;
  sfx.confirm();
  setFollow(null);
  set({ camMode: "orbit" });
  setT(w.t);
  await nextFrames();
  const t = siteRef.pos.clone();
  const p = V(t.x + APPROACH.x * 70, 0, t.z + APPROACH.y * 70);
  p.y = heightAt(p.x, p.z) + 22;
  const from = cam.camera!.position.distanceTo(p);
  await flyTo(p, t, THREE.MathUtils.clamp(2 + Math.log10(1 + from) * 1.2, 2.5, 6), smoother);
}

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
  await returnToSolarSystem();
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
