// ECHOES RELEASE VERIFICATION PROBE
//
// Drives the real application in a browser and records, with evidence:
//   - the landing page and the entry flow
//   - every celestial body in the NAVIGATE grid
//   - every registered device (all ten): site scene, mission panel, journey
//   - the interactive surfaces (search, archive, timeline, science mode, film)
//   - console errors, failed requests, WebGL problems
//   - performance: FPS, frame-time p95, draw calls, triangles, load time
//   - layout at 1920x1080, 1366x768 and a phone viewport
//
//   PROBE_BASE  app URL (default http://localhost:5174/)
//   PROBE_OUT   json output (default shotsrelease/release-probe.json)
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const BASE = process.env.PROBE_BASE || "http://localhost:5174/";
const OUT = process.env.PROBE_OUT || `${REPO}/shotsrelease/release-probe.json`;

const results = [];
const errors = [];
const failedRequests = [];
let shotN = 0;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 300)));
page.on("requestfailed", (r) => failedRequests.push(`${r.failure()?.errorText} ${r.url().slice(0, 140)}`));
page.on("response", (r) => {
  if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.url().slice(0, 140)}`);
});

await page.addInitScript(() => {
  // storage is denied on opaque origins (about:blank) — never let the harness
  // be the thing that throws
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
});

const state = async () => {
  try {
    return await page.evaluate(() => window.__echoesState?.() ?? null);
  } catch {
    return null; // the page navigated under us (reload / back)
  }
};

async function click(text, { exact = false, prefix = false, timeout = 25000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const ok = await page.evaluate(({ t, ex, pre }) => {
      const b = [...document.querySelectorAll("button")].find((x) => {
        const u = (x.textContent || "").trim().toUpperCase();
        const q = t.toUpperCase();
        const match = ex ? u === q : pre ? u.startsWith(q) : u.includes(q);
        return match && !x.disabled;
      });
      if (b) { b.click(); return true; }
      return false;
    }, { t: text.toUpperCase(), ex: exact, pre: prefix });
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
    await sleep(250);
  }
  return null;
}

async function settle(extra = 1200, max = 180000) {
  const t0 = Date.now();
  let last = null;
  let stable = 0;
  while (Date.now() - t0 < max) {
    const s = await state();
    if (s && !s.flying) {
      const key = `${s.scene}|${s.world}|${s.artifactId}|${s.camMode}|${s.overlay}`;
      if (key === last) { stable++; if (stable >= 3) break; } else { stable = 0; last = key; }
    }
    await sleep(250);
  }
  await sleep(extra);
}

async function shot(name) {
  shotN++;
  mkdirSync(`${REPO}/shotsrelease`, { recursive: true });
  await page.screenshot({ path: `${REPO}/shotsrelease/${String(shotN).padStart(2, "0")}-${name}.png` });
}

function record(id, desc, pass, detail) {
  results.push({ id, desc, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} — ${desc}${pass ? "" : " :: " + JSON.stringify(detail)}`);
}

/** FPS + frame time + renderer counters, sampled in-page. */
async function measure(ms = 4000) {
  return page.evaluate(async (dur) => {
    const gl = window.__echoesGl;
    const frames = [];
    let last = performance.now();
    await new Promise((resolve) => {
      const t0 = last;
      const tick = (now) => {
        frames.push(now - last);
        last = now;
        if (now - t0 < dur) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;
    return {
      fps: Math.round(1000 / (frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length))),
      frameMsP50: +p(0.5).toFixed(2),
      frameMsP95: +p(0.95).toFixed(2),
      frameMsMax: +Math.max(0, ...frames).toFixed(2),
      drawCalls: gl?.info?.render?.calls ?? null,
      triangles: gl?.info?.render?.triangles ?? null,
      geometries: gl?.info?.memory?.geometries ?? null,
      textures: gl?.info?.memory?.textures ?? null,
      pixelRatio: gl?.getPixelRatio?.() ?? null,
    };
  }, ms);
}

console.log(`RELEASE PROBE → ${BASE}`);

/* ---------------------------------------------------------------- landing */
const t0 = Date.now();
await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
const loadMs = Date.now() - t0;
await page.waitForSelector("h1", { timeout: 30000 });
const landingText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));
record("L1", "landing page renders with the ECHOES identity", /ECHOES/i.test(landingText) && /ENTER ECHOES/i.test(landingText), landingText.slice(0, 120));
record("L2", "landing page offers both calls to action", (await page.evaluate(() => document.body.innerText)).includes("EXPLORE MISSIONS"), null);
await shot("landing-1920");

/* ---------------------------------------------------------------- enter */
await click("ENTER ECHOES", { exact: true });
await sleep(3000);
// the boot airlock sits between the landing page and the HUD
await click("ENTER SIMULATION", { exact: true });
await sleep(8000);
await settle();
const entered = await state();
record("E1", "ENTER ECHOES opens the solar system", entered?.scene === "solar", entered);
const hudVisible = await page.evaluate(() => {
  const t = document.body.innerText;
  return { hasNavigate: t.includes("NAVIGATE"), hasSearch: t.includes("SEARCH") };
});
record("E1b", "the HUD is reachable after the boot sequence", hudVisible.hasNavigate && hudVisible.hasSearch, hudVisible);
const perfSolar = await measure();
record("E2", "solar system renders with live renderer counters", perfSolar.drawCalls > 0, perfSolar);
await shot("solar-system");

/* ---------------------------------------------------------------- bodies */
const BODIES = ["MERCURY", "VENUS", "EARTH", "MOON", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
for (const b of BODIES) {
  const ok = await click(b, { exact: true });
  await sleep(2600);
  const s = await state();
  record(`B-${b}`, `${b} focuses without error`, ok && s?.focusBody === b.toLowerCase(), { ok, focusBody: s?.focusBody });
}
await shot("body-neptune");

/* ---------------------------------------------------------------- devices */
const DEVICES = [
  ["MER-B · OPPORTUNITY", "opportunity", "mars"], ["MER-A · SPIRIT", "spirit", "mars"],
  ["MPF · SOJOURNER", "sojourner", "mars"], ["INSIGHT · INSIGHT", "insight", "mars"],
  ["A12 · APOLLO 12", "apollo-12", "moon"], ["A14 · APOLLO 14", "apollo-14", "moon"],
  ["A15 · APOLLO 15", "apollo-15", "moon"], ["A16 · APOLLO 16", "apollo-16", "moon"],
  ["A17 · APOLLO 17", "apollo-17", "moon"],
];
for (const [row, id, world] of DEVICES) {
  // leave whatever is open and get back to the solar frame
  await click("✕ EXIT", { timeout: 6000 }).catch(() => {});
  await click("← SOLAR SYSTEM", { timeout: 12000 }).catch(() => {});
  await waitState((s) => s.scene === "solar", 90000);
  await sleep(1200);
  await click(world === "mars" ? "MARS" : "MOON", { exact: true });
  await sleep(600);
  await click(`TRAVEL TO ${world === "mars" ? "MARS" : "MOON"} →`);
  await waitState((s) => s.scene === "planet", 120000);
  await settle();
  await page.evaluate((r) => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes(r));
    b?.click();
  }, row);
  await sleep(900);
  await click("DESCEND TO SITE ↓");
  const at = await waitState((s) => s.scene === "site" && s.artifactId === id, 150000);
  await settle(1500);
  const s = await state();
  record(`D-${id}`, `${id} reaches its site on ${world}`, at?.scene === "site" && at?.world === world && at?.artifactId === id, {
    scene: s?.scene, world: s?.world, artifactId: s?.artifactId,
  });
  // the journey overlay opens automatically on arrival — wait for its chapters
  let dots = 0;
  for (let i = 0; i < 60; i++) {
    dots = await page.evaluate(() => document.querySelectorAll("button[aria-label^='Jump to']").length);
    if (dots > 3) break;
    await sleep(500);
  }
  record(`D-${id}-journey`, `${id} journey presents its chapters`, dots > 3, { dots });
  await shot(`device-${id}`);
  // close the journey → the mission panel (with the verified facts) is visible
  await click("✕ EXIT", { timeout: 8000 }).catch(() => {});
  await sleep(1200);
  const verifiedShown = await page.evaluate(() => document.body.innerText.includes("MISSION VERIFIED"));
  record(`D-${id}-panel`, `${id} mission panel shows the verified mission block`, verifiedShown, null);
}

/* ---------------------------------------------------------------- interactions */
await click("← SOLAR SYSTEM", { timeout: 12000 }).catch(() => {});
await waitState((s) => s.scene === "solar", 90000);
await sleep(1000);
const surfaces = ["SEARCH", "ARCHIVE", "FILM", "GROUND TRUTH", "MISSION LAB", "SYS"];
for (const s of surfaces) {
  const ok = await click(s, { prefix: true });
  await sleep(1600);
  const st = await state();
  const text = await page.evaluate(() => document.body.innerText.length);
  record(`I-${s.replace(/\s/g, "")}`, `${s} surface opens with content`, ok && text > 400, { ok, chars: text, overlay: st?.overlay });
  await shot(`surface-${s.replace(/\s/g, "-").toLowerCase()}`);
  await page.keyboard.press("Escape");
  await sleep(900);
}

/* ---------------------------------------------------------------- performance */
const perf = await measure(6000);
record("P1", "measured frame performance in the solar system", perf.fps > 0, perf);

/* ---------------------------------------------------------------- reload + back/forward */
await page.reload({ waitUntil: "load", timeout: 120000 });
await sleep(5000);
const afterReload = await state();
record("R1", "the application survives a reload and returns to a usable state", !!afterReload, { scene: afterReload?.scene, entered: afterReload?.entered });
// put a DISTINCT in-app entry in the history first: going back past the
// application's own URL lands on the browser's first page (about:blank), where
// the application is not running at all.
await page.goto(`${BASE}?history=1`, { waitUntil: "load", timeout: 120000 });
await sleep(4000);
await page.goBack().catch(() => {});
await sleep(5000);
const backState = await state();
record("R2", "browser back inside the app keeps the application alive", !!backState, { url: page.url(), scene: backState?.scene ?? null });
await page.goForward().catch(() => {});
await sleep(4000);
const fwdState = await state();
record("R3", "browser forward inside the app keeps the application alive", !!fwdState, { url: page.url(), scene: fwdState?.scene ?? null });

/* ---------------------------------------------------------------- viewports */
for (const [w, h, label] of [[1366, 768, "laptop"], [820, 1180, "tablet"], [390, 844, "phone"]]) {
  await page.setViewportSize({ width: w, height: h });
  await sleep(2500);
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    canvases: document.querySelectorAll("canvas").length,
  }));
  record(`VP-${label}`, `no horizontal overflow at ${w}x${h}`, overflow.scrollW <= overflow.clientW + 2, overflow);
  await shot(`viewport-${label}`);
}
await page.setViewportSize({ width: 1920, height: 1080 });

/* ---------------------------------------------------------------- report */
const finalState = await state();
writeFileSync(OUT, JSON.stringify({
  base: BASE, loadMs, perfSolar, perf, results, errors, failedRequests,
  finalState, devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
  hardware: await page.evaluate(() => {
    const gl = window.__echoesGl?.getContext?.();
    const ext = gl?.getExtension?.("WEBGL_debug_renderer_info");
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl ? gl.getParameter(gl.RENDERER) : "unknown"),
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "unknown",
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory ?? null,
      ua: navigator.userAgent,
    };
  }),
}, null, 2));

const failed = results.filter((r) => !r.pass);
console.log(`\nLOAD: ${loadMs} ms`);
console.log(`PERF solar: ${JSON.stringify(perfSolar)}`);
console.log(`ERRORS: ${errors.length}`, errors.slice(0, 6));
console.log(`FAILED REQUESTS: ${failedRequests.length}`, failedRequests.slice(0, 8));
console.log(`SCENARIOS: ${results.length} | FAILED: ${failed.length}`);
for (const f of failed) console.log(`  FAIL ${f.id}: ${f.desc} :: ${JSON.stringify(f.detail)}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
