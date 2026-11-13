// ECHOES device-navigation audit probe.
//
// Drives the real application in a browser, records the navigation state after
// every step and captures every Solar System return (reason + stack) that the
// instrumented director records.
//
//   PROBE_BASE   app URL (default http://localhost:5174/)
//   PROBE_SET    scenario subset: core | all | chapters | stress
//   PROBE_OUT    json output file (default shotsnav/nav-probe.json)
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const BASE_RAW = process.env.PROBE_BASE || "http://localhost:5174/";
// ?navtrace=1 makes the instrumented director publish its Solar System return
// log on window.__navTrace for this audit.
const BASE = BASE_RAW + (BASE_RAW.includes("?") ? "&" : "?") + "navtrace=1";
const SET = process.env.PROBE_SET || "core";
const OUT = process.env.PROBE_OUT || `${REPO}/shotsnav/nav-probe.json`;

const results = [];
let shotN = 0;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));

await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("echoes.quality", "high");
  localStorage.setItem("echoes.ceiling", "high");
  localStorage.setItem("echoes.autoq", "false");
});

// The dev server hot-reloads during the audit; a destroyed execution context
// must not abort the probe.
const safe = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch {
    return fallback;
  }
};

const state = () => safe(() => page.evaluate(() => window.__echoesState?.() ?? null));
const navState = () => safe(() => page.evaluate(() => window.__echoesNav?.() ?? null));
const trace = () => safe(() => page.evaluate(() => (window.__navTrace ?? []).map((t) => ({
  fn: t.fn, reason: t.reason, scene: t.scene, world: t.world, artifactId: t.artifactId,
  at: t.at, stack: (t.stack || "").split("\n").slice(1, 7).join(" | "),
}))), []);

async function clickText(text, { exact = false, timeout = 15000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const ok = await safe(async () => page.evaluate(({ t, ex }) => {
      const b = [...document.querySelectorAll("button")].find((x) => {
        const s = (x.textContent || "").trim();
        const u = s.toUpperCase();
        const q = t.toUpperCase();
        return (ex ? u === q : u.includes(q)) && !x.disabled;
      });
      if (b) { b.click(); return true; }
      return false;
    }, { t: text, ex: exact }), false);
    if (ok) return true;
    await sleep(250);
  }
  return false;
}

/** Click a device row/entry by its uppercase display name (designation · NAME). */
async function clickDevice(name) {
  const ok = await safe(async () => page.evaluate((n) => {
    const b = [...document.querySelectorAll("button")].find((x) => {
      const s = (x.textContent || "").trim().toUpperCase();
      return s.includes(n) && s.includes("·") && !x.disabled;
    });
    if (b) { b.click(); return true; }
    return false;
  }, name), false);
  if (!ok) await clickText(name, { exact: false });
  return ok;
}

/** Click a device entry inside the SEARCH overlay (type label = ARTIFACT). */
async function clickSearchHit(name) {
  return safe(async () => page.evaluate((n) => {
    const b = [...document.querySelectorAll("button")].find((x) => {
      if (x.disabled) return false;
      const spans = [...x.querySelectorAll("span")];
      const type = (spans[0]?.textContent || "").trim().toUpperCase();
      const title = (spans[1]?.firstElementChild?.textContent || "").trim().toUpperCase();
      return type === "ARTIFACT" && title.includes(n);
    });
    if (b) { b.click(); return true; }
    return false;
  }, name), false);
}

async function waitState(pred, timeout = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await state();
    if (s && pred(s)) return s;
    await sleep(250);
  }
  return null;
}

/** Wait until no camera flight is in progress and the scene has settled. */
async function settle(extra = 900) {
  const t0 = Date.now();
  let last = null;
  let stable = 0;
  while (Date.now() - t0 < 90000) {
    const s = await state();
    if (s && !s.flying) {
      const key = `${s.scene}|${s.world}|${s.artifactId}|${s.camMode}`;
      if (key === last) {
        stable++;
        if (stable >= 3) break; // unchanged for ~750 ms
      } else {
        stable = 0;
        last = key;
      }
    }
    await sleep(250);
  }
  await sleep(extra);
}

async function shot(name) {
  shotN++;
  mkdirSync(`${REPO}/shotsnav`, { recursive: true });
  const p = `${REPO}/shotsnav/${String(shotN).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: p });
  return p;
}

function record(id, desc, pass, detail) {
  results.push({ id, desc, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} — ${desc}${pass ? "" : " :: " + JSON.stringify(detail)}`);
}

const traceCount = () => trace().then((t) => t.length);
async function traceSince(n) {
  const t = await trace();
  return t.slice(n);
}

/* ------------------------------------------------------------------ helpers */

/** Travel from the solar system to a planet through the real UI. */
async function goToPlanetUI(name) {
  await clickText(name, { exact: true });
  await sleep(500);
  await clickText(`TRAVEL TO ${name.toUpperCase()} →`);
  const ok = await waitState((s) => s.scene === "planet", 90000);
  await settle();
  return ok;
}

/** Wait for the mission-journey timeline to be on screen (auto-opens on arrival). */
async function waitForJourneyTimeline(timeout = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const n = await page.evaluate(() => document.querySelectorAll("button[aria-label^='Jump to']").length);
    if (n > 0) return n;
    await sleep(400);
  }
  return 0;
}

/** The journey overlay hides the whole HUD — close it before using the HUD. */
async function closeJourneyOverlay() {
  // the overlay mounts a moment after the transfer finishes — wait for its
  // EXIT button, and fall back to ESC (which also closes the overlay).
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const ok = await safe(async () => page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "") === "Exit journey");
      if (b) { b.click(); return true; }
      return false;
    }), false);
    if (ok) {
      await sleep(700);
      const s = await state();
      if (s && s.overlay === null) return true;
    }
    await sleep(300);
  }
  await safe(async () => { await page.keyboard.press("Escape"); }, null);
  await sleep(700);
  const s = await state();
  return !s || s.overlay === null;
}

/** Pick a device from the planet panel list, then descend to its site. */
async function descendViaPanel(name, id) {
  await clickDevice(name);
  await sleep(800);
  await clickText("DESCEND TO SITE ↓");
  return waitState((s) => s.scene === "site" && s.artifactId === id, 120000);
}

/** Pick a device through the SEARCH overlay (a different entry point). */
async function selectViaSearch(name, id) {
  await closeJourneyOverlay();
  const opened = await clickText("SEARCH", { exact: true });
  if (!opened) return null;
  await sleep(900);
  const input = await safe(() => page.$("input[aria-label='Search archive']"), null);
  if (input) {
    await safe(async () => { await input.fill(name); }, null);
    await sleep(900);
  }
  const clicked = await clickSearchHit(name);
  if (!clicked) {
    console.log(`  [search] no ARTIFACT hit for ${name}`);
    return null;
  }
  return waitState((s) => s.scene === "site" && s.artifactId === id, 120000);
}

/* ------------------------------------------------------------------ scenarios */

console.log(`PROBE ${SET} → ${BASE}`);
await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
await clickText("ENTER SIMULATION", { timeout: 60000 });
await sleep(3500);
await settle();

record("boot", "application entered; scene = solar", (await state())?.scene === "solar", await state());

// ---- C1: solar → Mars → Opportunity site -------------------------------------
if (SET === "all" || SET === "core" || SET === "chapters") {
  const t0 = await traceCount();
  await goToPlanetUI("Mars");
  const mars = await state();
  record("C1a", "solar → Mars (planet scene, world=mars)", mars?.scene === "planet" && mars?.world === "mars", mars);
  await shot("mars-orbit");

  await descendViaPanel("OPPORTUNITY", "opportunity");
  await settle();
  const opp = await state();
  record("C1b", "Mars → Opportunity site (scene=site, world=mars, artifact=opportunity)",
    opp?.scene === "site" && opp?.world === "mars" && opp?.artifactId === "opportunity", opp);
  await shot("opportunity-site");
  console.log(`  mars transfer trace: ${JSON.stringify((await traceSince(t0)).map((e) => `${e.fn}:${e.reason}`))}`);
}

// ---- C2: every journey chapter, at the device site ----------------------------
if (SET === "all" || SET === "core" || SET === "chapters") {
  const t1 = await traceCount();
  const dotCount = await waitForJourneyTimeline();
  const chapters = await page.evaluate(() =>
    [...document.querySelectorAll("button[aria-label^='Jump to']")].map((d) => d.getAttribute("aria-label")));
  console.log(`  journey chapters visible: ${chapters?.length ?? 0}`);
  record("C2a", "the mission-journey overlay opened automatically on arrival", dotCount > 0, { dotCount });
  const chapterStates = [];
  for (let i = 0; i < (chapters?.length ?? 0); i++) {
    await safe(async () => page.evaluate((idx) => {
      const dots = [...document.querySelectorAll("button[aria-label^='Jump to']")];
      dots[idx]?.click();
    }, i), null);
    await sleep(1500);
    await settle(400);
    const s = await state();
    // the visible chapter title proves the DOCUMENTARY UI followed the selection
    const title = await safe(() => page.evaluate(() => {
      const bar = [...document.querySelectorAll("span")].find((x) => (x.className || "").includes("truncate") && (x.textContent || "").trim());
      return (bar?.textContent || "").trim();
    }), "");
    chapterStates.push({
      i, label: chapters[i], title, simT: s?.sim?.t,
      scene: s?.scene, world: s?.world, artifactId: s?.artifactId,
      nav: await navState(),
    });
  }
  const titles = new Set(chapterStates.map((c) => c.title));
  const times = new Set(chapterStates.map((c) => c.simT));
  record("C2b", "the chapter UI and the timeline followed every chapter selection",
    titles.size === chapterStates.length && times.size > 1,
    { distinctTitles: titles.size, distinctTimes: times.size, chapters: chapterStates.length });
  const after = await state();
  record("C2", "all journey chapters at the device site kept scene=site / world=mars / artifact=opportunity",
    after?.scene === "site" && after?.world === "mars" && after?.artifactId === "opportunity",
    { after, chapterStates });
  const chapterTrace = await traceSince(t1);
  const returns = chapterTrace.filter((e) => e.fn === "returnToSolarSystem");
  record("C3", "no Solar System return during chapter selection at a device site", returns.length === 0, returns);
  await shot("opportunity-chapters");
}

// ---- C4: same-planet device transfer from the site -----------------------------
if (SET === "all" || SET === "core") {
  const t2 = await traceCount();
  await selectViaSearch("SPIRIT", "spirit");
  await settle();
  const spirit = await state();
  record("C4", "Opportunity site → Spirit site (same-planet transfer)",
    spirit?.scene === "site" && spirit?.world === "mars" && spirit?.artifactId === "spirit", spirit);
  await shot("spirit-site");
  const t2trace = await traceSince(t2);
  record("C4b", "same-planet transfer produced no Solar System return",
    t2trace.filter((e) => e.fn === "returnToSolarSystem").length === 0,
    t2trace.filter((e) => e.fn === "returnToSolarSystem"));
}

// ---- C5: cross-planet device transfer -----------------------------------------
if (SET === "all" || SET === "core") {
  const t3 = await traceCount();
  await selectViaSearch("APOLLO 12", "apollo-12");
  await settle();
  const ap12 = await state();
  record("C5", "Mars site → Apollo 12 site (cross-planet transfer ends on the Moon)",
    ap12?.scene === "site" && ap12?.world === "moon" && ap12?.artifactId === "apollo-12", ap12);
  await shot("apollo12-site");
  const t3trace = await traceSince(t3);
  console.log("  cross-planet trace:", JSON.stringify(t3trace.map((e) => `${e.fn}:${e.reason}`)));
  record("C5b", "cross-planet transfer did not leave the user in the Solar System", ap12?.scene !== "solar", ap12);
}

// ---- C6: Moon → Apollo 17 via the planet panel -------------------------------
if (SET === "all" || SET === "core") {
  await closeJourneyOverlay();
  await clickText("↑ LEAVE SITE", { timeout: 10000 });
  await waitState((s) => s.scene === "planet", 60000);
  await settle();
  const t4 = await traceCount();
  await descendViaPanel("APOLLO 17", "apollo-17");
  await settle();
  const ap17 = await state();
  record("C6", "Moon → Apollo 17 site", ap17?.scene === "site" && ap17?.world === "moon" && ap17?.artifactId === "apollo-17", ap17);
  await shot("apollo17-site");
}

// ---- C7: InSight on Mars ------------------------------------------------------
if (SET === "all" || SET === "core") {
  const t5 = await traceCount();
  await selectViaSearch("INSIGHT", "insight");
  await settle();
  const ins = await state();
  record("C7", "Moon → InSight site (cross-planet, ends on Mars)",
    ins?.scene === "site" && ins?.world === "mars" && ins?.artifactId === "insight", ins);
  await shot("insight-site");
}

// ---- C8: rapid consecutive device selections ----------------------------------
if (SET === "all" || SET === "stress") {
  // back to the solar frame, focus Mars, then click two devices in the same tick
  await closeJourneyOverlay();
  await clickText("← SOLAR SYSTEM", { timeout: 10000 });
  await waitState((s) => s.scene === "solar", 90000);
  await sleep(1500);
  await clickText("Mars", { exact: true });
  await sleep(900);
  const t6 = await traceCount();
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const find = (n) => btns.find((x) => (x.textContent || "").toUpperCase().includes(n) && (x.textContent || "").includes("·"));
    find("MER-A · SPIRIT")?.click();
    find("MER-B · OPPORTUNITY")?.click();
  });
  await settle(2000);
  const rapid = await state();
  record("C8", "rapid consecutive selections settle on the LAST requested device (opportunity)",
    rapid?.scene === "site" && rapid?.artifactId === "opportunity" && rapid?.world === "mars", rapid);
  await shot("rapid-select");
  const t6trace = await traceSince(t6);
  console.log("  rapid trace:", JSON.stringify(t6trace.map((e) => `${e.fn}:${e.reason}`)));
}

// ---- C9: every registered device ----------------------------------------------
if (SET === "all") {
  const devices = [
    ["OPPORTUNITY", "opportunity", "mars"], ["SPIRIT", "spirit", "mars"],
    ["SOJOURNER", "sojourner", "mars"], ["INSIGHT", "insight", "mars"],
    ["APOLLO 12", "apollo-12", "moon"], ["APOLLO 14", "apollo-14", "moon"],
    ["APOLLO 15", "apollo-15", "moon"], ["APOLLO 16", "apollo-16", "moon"],
    ["APOLLO 17", "apollo-17", "moon"],
  ];
  for (const [name, id, world] of devices) {
    const t = await traceCount();
    await selectViaSearch(name, id);
    await settle();
    const s = await state();
    const nav = await navState();
    const pass = s?.scene === "site" && s?.artifactId === id && s?.world === world;
    record(`C9-${id}`, `${name} reachable by search → site on ${world}`, pass, { scene: s?.scene, world: s?.world, artifactId: s?.artifactId, nav });
    const tr = await traceSince(t);
    if (!pass) console.log("   trace:", JSON.stringify(tr.map((e) => `${e.fn}:${e.reason}`)));
  }
  // Voyager lives in the solar frame
  await closeJourneyOverlay();
  await clickText("← SOLAR SYSTEM", { timeout: 10000 });
  await waitState((s) => s.scene === "solar", 90000);
  await sleep(1500);
  await clickText("VOYAGER 1", { exact: true });
  await waitState((s) => s.artifactId === "voyager1", 90000);
  await settle();
  const voy = await state();
  record("C9-voyager1", "Voyager 1 reachable in the solar frame", voy?.artifactId === "voyager1", voy);
  await shot("voyager");
}

/* ------------------------------------------------------------------ report */
const finalTrace = await trace();
mkdirSync(`${REPO}/shotsnav`, { recursive: true });
writeFileSync(OUT, JSON.stringify({ base: BASE, set: SET, results, navEvents: finalTrace, errors }, null, 2));
console.log(`\nERRORS: ${errors.length}`, errors.slice(0, 5));
const returns = finalTrace.filter((e) => e.fn === "returnToSolarSystem");
console.log(`SOLAR RETURNS: ${returns.length}`);
for (const e of returns) console.log(`  ${e.reason} | scene=${e.scene} world=${e.world} artifact=${e.artifactId}`);
const failed = results.filter((r) => !r.pass);
console.log(`\nSCENARIOS: ${results.length} | FAILED: ${failed.length}`);
for (const f of failed) console.log(`  FAIL ${f.id}: ${f.desc} :: ${JSON.stringify(f.detail)}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
