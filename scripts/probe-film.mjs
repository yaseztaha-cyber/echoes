// MER-B MISSION FILM — browser verification (the documentary running as code)
//
// Checks every acceptance item of the film integration: the entry point, the
// mounted documentary, real playback, chapter navigation, sound, state safety,
// device availability, repeat-open hygiene, and the survival of the mission
// journey + 3D exploration.
//
//   PROBE_BASE  app URL (default http://localhost:5174/)
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const BASE = process.env.PROBE_BASE || "http://localhost:5174/";

const results = [];
let shotN = 0;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
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

const state = () => page.evaluate(() => window.__echoesState?.() ?? null);
const navTrace = () => page.evaluate(() => (window.__navTrace ?? []).map((t) => ({ fn: t.fn, reason: t.reason })));
const filmState = () => page.evaluate(() => {
  const j = window.__merb;
  if (!j) return null;
  const s = j.getState();
  return { chapterId: s.chapterId, chapterIndex: s.chapterIndex, chapterTime: s.chapterTime, duration: s.chapterDuration, playing: s.playing, ended: s.ended, fps: s.fps, quality: s.quality, audio: s.audioEnabled, media: s.media.length };
});

async function clickText(text, { exact = false, timeout = 20000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const ok = await page.evaluate(({ t, ex }) => {
      const b = [...document.querySelectorAll("button")].find((x) => {
        const u = (x.textContent || "").trim().toUpperCase();
        const q = t.toUpperCase();
        return (ex ? u === q : u.includes(q)) && !x.disabled;
      });
      if (b) { b.click(); return true; }
      return false;
    }, { t: text, ex: exact });
    if (ok) return true;
    await sleep(250);
  }
  return false;
}

async function waitState(pred, timeout = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await state();
    if (s && pred(s)) return s;
    await sleep(300);
  }
  return null;
}

async function settle(extra = 1200) {
  const t0 = Date.now();
  let last = null;
  let stable = 0;
  while (Date.now() - t0 < 180000) {
    const s = await state();
    if (s && !s.flying) {
      const key = `${s.scene}|${s.world}|${s.artifactId}|${s.camMode}|${s.overlay}`;
      if (key === last) { stable++; if (stable >= 3) break; } else { stable = 0; last = key; }
    }
    await sleep(300);
  }
  await sleep(extra);
}

async function shot(name) {
  shotN++;
  mkdirSync(`${REPO}/shotsfilm`, { recursive: true });
  await page.screenshot({ path: `${REPO}/shotsfilm/${String(shotN).padStart(2, "0")}-${name}.png` });
}

function record(id, desc, pass, detail) {
  results.push({ id, desc, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} — ${desc}${pass ? "" : " :: " + JSON.stringify(detail)}`);
}

/* ------------------------------------------------------------------ boot */
console.log(`FILM PROBE → ${BASE}`);
await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
await clickText("ENTER SIMULATION", { timeout: 60000 });
await sleep(4000);
await settle();

/* ------------------------------------------------------------------ travel to Opportunity */
await clickText("Mars", { exact: true });
await sleep(700);
await clickText("TRAVEL TO MARS →");
await waitState((s) => s.scene === "planet", 120000);
await settle();
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes("MER-B · OPPORTUNITY"));
  b?.click();
});
await sleep(900);
await clickText("DESCEND TO SITE ↓");
await waitState((s) => s.scene === "site", 180000);
await settle(2500);

const atSite = await state();
record("V1", "arrived at the Opportunity site", atSite?.scene === "site" && atSite?.world === "mars" && atSite?.artifactId === "opportunity", atSite);

/* ------------------------------------------------------------------ 1. entry point */
const chapterTitle = () => page.evaluate(() => {
  const el = [...document.querySelectorAll("span")].find((x) => (x.className || "").includes("truncate") && (x.textContent || "").trim());
  return (el?.textContent || "").trim();
});
const entry = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").toUpperCase().includes("WATCH MISSION FILM"));
  return { count: btns.length, labels: btns.map((b) => b.getAttribute("aria-label")) };
});
record("V2", "Opportunity shows WATCH MISSION FILM", entry.count >= 1, entry);
const chapterBefore = await chapterTitle();
await shot("film-entry");

/* ------------------------------------------------------------------ 2. the documentary mounts */
await clickText("WATCH MISSION FILM");
await page.waitForSelector("[data-film='merb']", { timeout: 20000 });
await sleep(3500);
const mounted = await page.evaluate(() => {
  const host = document.querySelector("[data-film='merb']");
  if (!host) return null;
  const r = host.getBoundingClientRect();
  return {
    canvases: host.querySelectorAll("canvas").length,
    // the module namespaces itself by adding .merb to the host container
    merbClass: host.classList.contains("merb"),
    merbNodes: host.querySelectorAll(".merb").length,
    styleTags: document.querySelectorAll("style[data-merb]").length,
    transport: !!host.querySelector("[data-act='play']"),
    chips: host.querySelectorAll(".chip").length,
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
});
const fs1 = await filmState();
record("V3", "the MER-B documentary is mounted inside the mission experience",
  !!mounted && mounted.canvases === 1 && (mounted.merbClass || mounted.merbNodes >= 1) && mounted.transport && mounted.width > 800 && mounted.height > 400,
  { mounted, film: fs1 });
record("V4", "the documentary exposes its own timeline state", !!fs1 && fs1.chapterId.length > 0 && fs1.duration > 0, fs1);
await shot("film-mounted");

/* ------------------------------------------------------------------ 3. real playback */
await page.evaluate(() => window.__merb?.play());
await sleep(3500);
const playing = await filmState();
record("V5", "playback runs: the chapter time advances and fps is live",
  !!playing && playing.playing && playing.chapterTime > 0.3 && playing.fps > 0, playing);
await shot("film-playing");

/* ------------------------------------------------------------------ 4. the module's own transport */
const uiPlay = await page.evaluate(() => {
  const host = document.querySelector("[data-film='merb']");
  const b = host?.querySelector("[data-act='play']");
  if (!b) return false;
  b.click();
  return true;
});
await sleep(1500);
const afterUiPlay = await filmState();
record("V6", "the documentary's own play/pause control works", uiPlay && afterUiPlay?.playing === false, { afterUiPlay });
await page.evaluate(() => window.__merb?.play());
await sleep(600);

/* ------------------------------------------------------------------ 5. chapter navigation + scrub */
await page.evaluate(() => window.__merb?.seekToChapter("endeavour", true));
await sleep(3000);
const jumped = await filmState();
record("V7", "chapter navigation works (seek to Endeavour)", jumped?.chapterId === "endeavour" && jumped?.playing === true, jumped);
await page.evaluate(() => window.__merb?.seekTime(12));
await sleep(1200);
const scrubbed = await filmState();
record("V8", "scrubbing inside a chapter works", !!scrubbed && scrubbed.chapterTime >= 11 && scrubbed.chapterTime < 16, scrubbed);
await shot("film-chapter");

/* ------------------------------------------------------------------ 6. the module's sound toggle */
const soundBefore = (await filmState())?.audio;
await page.evaluate(() => {
  const host = document.querySelector("[data-film='merb']");
  const b = host?.querySelector("[data-act='sound']");
  b?.click();
});
await sleep(800);
const soundAfter = (await filmState())?.audio;
record("V9", "the documentary's own sound toggle works", soundBefore !== soundAfter, { soundBefore, soundAfter });
await page.evaluate(() => {
  const host = document.querySelector("[data-film='merb']");
  host?.querySelector("[data-act='sound']")?.click();
});

/* ------------------------------------------------------------------ 7. state safety */
const stateBefore = await state();
const traceBefore = (await navTrace()).length;
await clickText("CLOSE FILM");
await sleep(2000);
const stateAfter = await state();
const traceAfter = await navTrace();
record("V10", "closing the film restores the previous mission state",
  stateAfter?.scene === stateBefore?.scene && stateAfter?.world === stateBefore?.world &&
  stateAfter?.artifactId === stateBefore?.artifactId && stateAfter?.overlay === stateBefore?.overlay &&
  stateAfter?.camMode === stateBefore?.camMode,
  { before: { scene: stateBefore?.scene, world: stateBefore?.world, artifactId: stateBefore?.artifactId, overlay: stateBefore?.overlay, camMode: stateBefore?.camMode }, after: { scene: stateAfter?.scene, world: stateAfter?.world, artifactId: stateAfter?.artifactId, overlay: stateAfter?.overlay, camMode: stateAfter?.camMode } });
record("V11", "closing the film never returns to the Solar System", stateAfter?.scene !== "solar", stateAfter);
const newReturns = traceAfter.slice(traceBefore).filter((e) => e.fn === "returnToSolarSystem");
record("V12", "no Solar System return was triggered by the film", newReturns.length === 0, newReturns);
const chapterAfter = await chapterTitle();
record("V13", "the journey chapter is unchanged after the film", chapterBefore === chapterAfter && chapterBefore.length > 0, { chapterBefore, chapterAfter });
await shot("film-closed");

/* ------------------------------------------------------------------ 8. repeat open/close hygiene */
for (let i = 0; i < 4; i++) {
  await clickText("WATCH MISSION FILM");
  await page.waitForSelector("[data-film='merb']", { timeout: 20000 });
  await sleep(1200);
  await clickText("CLOSE FILM");
  await sleep(900);
}
const leftovers = await page.evaluate(() => ({
  hosts: document.querySelectorAll("[data-film='merb']").length,
  canvases: document.querySelectorAll("canvas").length,
  merbNodes: document.querySelectorAll(".merb").length,
  styleTags: document.querySelectorAll("style[data-merb]").length,
  moduleHook: !!window.__merb,
}));
record("V14", "repeated open/close leaves no accumulating instance (no canvas, no .merb node, no style tag)",
  leftovers.hosts === 0 && leftovers.merbNodes === 0 && leftovers.styleTags === 0 && leftovers.moduleHook === false, leftovers);
const stFinal = await state();
record("V15", "the mission experience is still intact after repeated open/close",
  stFinal?.scene === "site" && stFinal?.artifactId === "opportunity" && stFinal?.world === "mars", stFinal);

/* ------------------------------------------------------------------ 9. the journey still works */
const dots = await page.evaluate(() => document.querySelectorAll("button[aria-label^='Jump to']").length);
record("V16", "the mission journey timeline is still functional", dots > 5, { dots });
await page.evaluate(() => {
  const d = [...document.querySelectorAll("button[aria-label^='Jump to']")][3];
  d?.click();
});
await sleep(2000);
const afterChapter = await chapterTitle();
record("V17", "chapter selection still works after the film was used", !!afterChapter && afterChapter !== chapterAfter, { afterChapter });
await shot("journey-after-film");

/* ------------------------------------------------------------------ 10. other devices have no film */
const others = ["SPIRIT", "INSIGHT", "SOJOURNER", "APOLLO 12", "APOLLO 17"];
for (const name of others) {
  await clickText("✕ EXIT", { timeout: 8000 });
  await sleep(900);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes("SOLAR SYSTEM"));
    b?.click();
  });
  await waitState((s) => s.scene === "solar", 90000);
  await sleep(1500);
  const moon = name.startsWith("APOLLO");
  await clickText(moon ? "Moon" : "Mars", { exact: true });
  await sleep(800);
  await clickText(`TRAVEL TO ${moon ? "MOON" : "MARS"} →`);
  await waitState((s) => s.scene === "planet", 120000);
  await settle();
  await page.evaluate((n) => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes(n));
    b?.click();
  }, name);
  await sleep(900);
  await clickText("DESCEND TO SITE ↓");
  await waitState((s) => s.scene === "site", 180000);
  await settle(1800);
  const found = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").toUpperCase().includes("WATCH MISSION FILM")).length);
  const st = await state();
  record(`V18-${name}`, `${name} shows NO WATCH MISSION FILM action`, found === 0, { found, artifactId: st?.artifactId, world: st?.world });
  await shot(`no-film-${name.toLowerCase().replace(/\s+/g, "-")}`);
}

record("V19", "no console errors during the whole film session", errors.length === 0, errors.slice(0, 5));

mkdirSync(`${REPO}/shotsfilm`, { recursive: true });
writeFileSync(`${REPO}/shotsfilm/film-probe.json`, JSON.stringify({ base: BASE, results, errors }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\nERRORS: ${errors.length}`, errors.slice(0, 4));
console.log(`SCENARIOS: ${results.length} | FAILED: ${failed.length}`);
for (const f of failed) console.log(`  FAIL ${f.id}: ${f.desc}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
