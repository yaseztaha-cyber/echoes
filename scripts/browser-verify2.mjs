/* ECHOES deep verification: planet scene + moon site (starfield visibility + fps).
 * Usage: node scripts/browser-verify2.mjs <url> <outDir>
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173/";
const outDir = process.argv[3] ?? "shots2";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function measure(page, label, runMs = 7000) {
  const r = await page.evaluate(
    ({ runMs }) =>
      new Promise((resolve) => {
        const ms = [];
        let last = performance.now();
        const started = last;
        function loop(t) {
          const dt = t - last;
          last = t;
          if (dt < 500) ms.push(dt);
          if (t - started < runMs) requestAnimationFrame(loop);
          else {
            const s = [...ms].sort((a, b) => a - b);
            const q = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
            const avg = ms.reduce((a, c) => a + c, 0) / ms.length;
            resolve({ frames: ms.length, fps: Math.round(1000 / avg * 10) / 10, p95: Math.round(q(0.95) * 100) / 100, p99: Math.round(q(0.99) * 100) / 100 });
          }
        }
        requestAnimationFrame(loop);
      }),
    { runMs }
  );
  console.log(`${label}: ${JSON.stringify(r)}`);
  return r;
}

const clickText = async (page, text, exact = false, tries = 12) => {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate(
      ({ text, exact }) => {
        const btns = [...document.querySelectorAll("button")];
        const hit = btns.find((b) => {
          const t = (b.textContent || "").trim();
          return exact ? t === text : t.includes(text);
        });
        if (hit) { hit.click(); return true; }
        return false;
      },
      { text, exact }
    );
    if (ok) return;
    await sleep(800);
  }
  throw new Error(`button "${text}" not found`);
};

const errors = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));

const results = {};
try {
  await mkdir(outDir, { recursive: true });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  await clickText(page, "ENTER SIMULATION", false);
  await sleep(5000);

  await clickText(page, "MOON", true);
  await sleep(5000);
  await clickText(page, "TRAVEL TO MOON", false);
  await sleep(9000);
  results.moonPlanetScene = await measure(page, "moon-planet-scene");
  await page.screenshot({ path: `${outDir}/10-moon-planet.png` });
  console.log("planet scene url:", page.url());

  // into an apollo site: descend, wait out the approach cinematic, then measure ON the surface
  try {
    await clickText(page, "APOLLO 12", false);
    console.log("clicked: APOLLO 12");
    await sleep(4000);
    await clickText(page, "DESCEND TO SITE", false);
    console.log("clicked: DESCEND TO SITE");
    await sleep(45000);
    results.apollo12Surface = await measure(page, "apollo12-surface");
    await page.screenshot({ path: `${outDir}/13-apollo12-surface.png` });
    console.log("site url:", page.url());
    // archive visit feedback check
    await clickText(page, "ARCHIVE", false);
    await sleep(2500);
    await page.screenshot({ path: `${outDir}/14-archive.png` });
    await clickText(page, "CLOSE · ESC", true);
    await sleep(1200);
  } catch (e) {
    results.apollo12Surface = { error: String(e).slice(0, 300) };
    await page.screenshot({ path: `${outDir}/13-apollo12-FAILED.png` });
    console.log("APOLLO LEG FAILED:", String(e).slice(0, 300));
  }

  await writeFile(`${outDir}/summary.json`, JSON.stringify({ results, errors }, null, 2));
  console.log("ERRORS:", errors.length ? errors.join(" | ").slice(0, 800) : "none");
} finally {
  await browser.close();
}
