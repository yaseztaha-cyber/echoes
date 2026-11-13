// MER-B MISSION FILM — browser verification
//
// Drives the real application and checks every acceptance item of the film
// integration: entry point, file, playback, audio, seek, fullscreen, state
// safety, device availability, repeat-open hygiene and the survival of the
// mission journey + 3D exploration.
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
const filmRequests = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
page.on("response", (r) => {
  if (r.url().includes("/films/")) filmRequests.push({ url: r.url(), status: r.status(), len: r.headers()["content-length"] });
});

await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("echoes.quality", "high");
  localStorage.setItem("echoes.ceiling", "high");
  localStorage.setItem("echoes.autoq", "false");
});

const state = () => page.evaluate(() => window.__echoesState?.() ?? null);
const navTrace = () => page.evaluate(() => (window.__navTrace ?? []).map((t) => ({ fn: t.fn, reason: t.reason })));

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

async function waitState(pred, timeout = 120000) {
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
  while (Date.now() - t0 < 120000) {
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
await shot("opportunity-site");

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

/* ------------------------------------------------------------------ 2. the real file loads */
const before = filmRequests.length;
await clickText("WATCH MISSION FILM");
await page.waitForSelector("video", { timeout: 20000 });
await sleep(2500);
const vid = await page.evaluate(() => {
  const v = document.querySelector("video");
  if (!v) return null;
  return {
    src: v.currentSrc || v.src,
    duration: v.duration,
    w: v.videoWidth,
    h: v.videoHeight,
    readyState: v.readyState,
    preload: v.preload,
    poster: v.poster,
    hasAudioTracks: v.audioTracks ? v.audioTracks.length : null,
    muted: v.muted,
    paused: v.paused,
  };
});
const req = filmRequests.slice(before);
record("V3", "the film file is the MER-B recording and loaded", !!vid && vid.duration > 500 && vid.w === 1280 && vid.h === 720, { vid, req });
// 206 = partial content: the browser ranged the file, which is exactly how a
// streamed video is fetched. 200 is also fine.
record("V4", "the film is requested from /films/ and served", req.some((r) => r.url.includes("merb-mission-film.webm") && (r.status === 200 || r.status === 206)), req);
record("V5", "playback does NOT autoplay with sound", vid?.paused === true && vid?.muted === false, { paused: vid?.paused, muted: vid?.muted });
await shot("film-opened");

/* ------------------------------------------------------------------ 3. playback + audio */
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Play "));
  if (b) b.click();
  else {
    const p = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim().toUpperCase() === "PLAY");
    p?.click();
  }
});
await sleep(4000);
const playing = await page.evaluate(() => {
  const v = document.querySelector("video");
  return v ? { paused: v.paused, t: v.currentTime, muted: v.muted, volume: v.volume, dur: v.duration } : null;
});
record("V6", "playback starts on the user's click and the time advances", !!playing && !playing.paused && playing.t > 0.2, playing);
const audioInfo = await page.evaluate(() => {
  const v = document.querySelector("video");
  if (!v) return null;
  // webkitAudioDecodedByteCount is non-zero once an audio track has been decoded
  return {
    decoded: v.webkitAudioDecodedByteCount ?? null,
    tracks: v.audioTracks ? v.audioTracks.length : null,
    muted: v.muted,
    volume: v.volume,
  };
});
record("V7", "the film carries an audio track that decodes", audioInfo && (audioInfo.decoded > 0 || (audioInfo.tracks ?? 0) > 0), audioInfo);
await shot("film-playing");

/* ------------------------------------------------------------------ 4. seeking */
const beforeSeek = await page.evaluate(() => document.querySelector("video")?.currentTime ?? 0);
await page.evaluate(() => {
  const slider = [...document.querySelectorAll("input[aria-label='Seek']")][0];
  if (!slider) return;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  set.call(slider, "120");
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  slider.dispatchEvent(new Event("change", { bubbles: true }));
});
await sleep(1200);
const afterSeek = await page.evaluate(() => document.querySelector("video")?.currentTime ?? 0);
record("V8", "seeking works (the slider jumps the film)", Math.abs(afterSeek - 120) < 6 && Math.abs(afterSeek - beforeSeek) > 5, { beforeSeek, afterSeek });

// keyboard: arrow key seeks
await page.evaluate(() => document.querySelector("[data-film='merb']")?.focus());
await page.keyboard.press("ArrowRight");
await sleep(800);
const afterKey = await page.evaluate(() => document.querySelector("video")?.currentTime ?? 0);
record("V9", "keyboard seek works (ArrowRight = +5 s)", afterKey > afterSeek + 3, { afterSeek, afterKey });

/* ------------------------------------------------------------------ 5. fullscreen */
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "") === "Toggle fullscreen");
  b?.click();
});
await sleep(1200);
const fs = await page.evaluate(() => !!document.fullscreenElement);
await page.evaluate(() => document.exitFullscreen?.());
await sleep(600);
record("V10", "fullscreen works", fs === true, { fullscreenElement: fs });

/* ------------------------------------------------------------------ 6/7. state safety */
const stateBefore = await state();
const traceBefore = (await navTrace()).length;
await clickText("CLOSE FILM");
await sleep(1500);
const stateAfter = await state();
const traceAfter = await navTrace();
record("V11", "closing the film restores the previous mission state",
  stateAfter?.scene === stateBefore?.scene && stateAfter?.world === stateBefore?.world &&
  stateAfter?.artifactId === stateBefore?.artifactId && stateAfter?.overlay === stateBefore?.overlay &&
  stateAfter?.camMode === stateBefore?.camMode,
  { before: { scene: stateBefore?.scene, world: stateBefore?.world, artifactId: stateBefore?.artifactId, overlay: stateBefore?.overlay, camMode: stateBefore?.camMode }, after: { scene: stateAfter?.scene, world: stateAfter?.world, artifactId: stateAfter?.artifactId, overlay: stateAfter?.overlay, camMode: stateAfter?.camMode } });
record("V12", "closing the film never returns to the Solar System", stateAfter?.scene !== "solar", stateAfter);
const newReturns = traceAfter.slice(traceBefore).filter((e) => e.fn === "returnToSolarSystem");
record("V13", "no Solar System return was triggered by the film", newReturns.length === 0, newReturns);
const chapterAfter = await chapterTitle();
record("V14", "the journey chapter is unchanged after the film", chapterBefore === chapterAfter && chapterBefore.length > 0, { chapterBefore, chapterAfter });
await shot("film-closed");

/* ------------------------------------------------------------------ 9. repeated open/close */
for (let i = 0; i < 4; i++) {
  await clickText("WATCH MISSION FILM");
  await page.waitForSelector("video", { timeout: 20000 });
  await sleep(900);
  await clickText("CLOSE FILM");
  await sleep(700);
}
const leftovers = await page.evaluate(() => ({
  videos: document.querySelectorAll("video").length,
  players: document.querySelectorAll("[data-film='merb']").length,
}));
record("V15", "repeated open/close leaves no accumulating video instances", leftovers.videos === 0 && leftovers.players === 0, leftovers);
const stFinal = await state();
record("V16", "the mission experience is still intact after repeated open/close",
  stFinal?.scene === "site" && stFinal?.artifactId === "opportunity" && stFinal?.world === "mars", stFinal);

/* ------------------------------------------------------------------ 10. journey still works */
const dots = await page.evaluate(() => document.querySelectorAll("button[aria-label^='Jump to']").length);
record("V17", "the mission journey timeline is still functional", dots > 5, { dots });
await page.evaluate(() => {
  const d = [...document.querySelectorAll("button[aria-label^='Jump to']")][3];
  d?.click();
});
await sleep(1800);
const afterChapter = await chapterTitle();
record("V18", "chapter selection still works after the film was used", !!afterChapter && afterChapter !== chapterAfter, { afterChapter });
await shot("journey-after-film");

/* ------------------------------------------------------------------ 8. other devices have no film */
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
  await clickText("Mars", { exact: true }).catch(() => {});
  await sleep(700);
  if (name.startsWith("APOLLO")) {
    await clickText("Moon", { exact: true }).catch(() => {});
    await sleep(700);
  }
  await clickText(`TRAVEL TO ${name.startsWith("APOLLO") ? "MOON" : "MARS"} →`);
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
  record(`V19-${name}`, `${name} shows NO WATCH MISSION FILM action`, found === 0, { found, artifactId: st?.artifactId, world: st?.world });
  await shot(`no-film-${name.toLowerCase().replace(/\s+/g, "-")}`);
}

record("V20", "no console errors during the whole film session", errors.length === 0, errors.slice(0, 5));

mkdirSync(`${REPO}/shotsfilm`, { recursive: true });
writeFileSync(`${REPO}/shotsfilm/film-probe.json`, JSON.stringify({ base: BASE, results, filmRequests, errors }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\nERRORS: ${errors.length}`, errors.slice(0, 4));
console.log(`SCENARIOS: ${results.length} | FAILED: ${failed.length}`);
for (const f of failed) console.log(`  FAIL ${f.id}: ${f.desc}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
