/* ECHOES in-browser verification (Playwright + system Edge).
 * Usage: node scripts/browser-verify.mjs <url> <outDir>
 * Navigates a scripted journey, records FPS via rAF, saves screenshots, prints JSON summary.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://192.168.1.4:4173/";
const outDir = process.argv[3] ?? "shots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** rAF FPS sampler into the page context; returns {avg, p95, frames, ms_p95}. */
async function measure(page, label, runMs = 8000) {
  const r = await page.evaluate(
    ({ runMs }) =>
      new Promise((resolve) => {
        const frameMs = [];
        let last = performance.now();
        const started = last;
        function loop(t) {
          const dt = t - last;
          last = t;
          if (dt < 500) frameMs.push(dt);
          if (t - started < runMs) requestAnimationFrame(loop);
          else {
            const sorted = [...frameMs].sort((a, b) => a - b);
            const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
            const avg = frameMs.reduce((a, c) => a + c, 0) / frameMs.length;
            resolve({ frames: frameMs.length, avgMs: Math.round(avg * 100) / 100, fps: Math.round(1000 / avg * 10) / 10, p95: Math.round(q(0.95) * 100) / 100, p99: Math.round(q(0.99) * 100) / 100 });
          }
        }
        requestAnimationFrame(loop);
      }),
    { runMs }
  );
  console.log(`${label}: ${JSON.stringify(r)}`);
  return r;
}

const clickText = async (page, text, exact = true) => {
  const clicked = await page.evaluate(
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
  if (!clicked) throw new Error(`button "${text}" not found`);
};

const results = {};
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));

try {
  await mkdir(outDir, { recursive: true });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await sleep(4000);

  await page.screenshot({ path: `${outDir}/01-solar.png` }).catch(() => {});
  results.solar = await measure(page, "solar-overview");

  // enter the sim
  await clickText(page, "ENTER SIMULATION", false);
  await sleep(6000);
  results.solarAfterEnter = await measure(page, "solar-after-enter");

  await page.screenshot({ path: `${outDir}/02-solar-entered.png` }).catch(() => {});

  // moon planet scene (stars visible here)
  await clickText(page, "MOON", true);
  await sleep(9000);
  results.moonPlanet = await measure(page, "moon-planet-scene");
  await page.screenshot({ path: `${outDir}/03-moon-planet.png` }).catch(() => {});

  const summary = { results, errors };
  await writeFile(`${outDir}/summary.json`, JSON.stringify(summary, null, 2));
  console.log("ERRORS:", errors.length ? errors.join(" | ").slice(0, 800) : "none");
} finally {
  await browser.close();
}
