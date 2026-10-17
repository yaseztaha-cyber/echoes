/* Same-run A/B: land at A12 at 1600x1000, then toggle gl pixel ratio + frustum ablations in-page.
 * Requires window.__echoesGl (exposed when hash contains "dev").
 * Usage: node scripts/ablate-site.mjs
 */
import { chromium } from "playwright-core";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clickText = (page, text, tries = 10) =>
  (async () => {
    for (let i = 0; i < tries; i++) {
      const ok = await page.evaluate((text) => {
        const b = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes(text));
        if (b) { b.click(); return true; }
        return false;
      }, text);
      if (ok) return;
      await sleep(800);
    }
    throw new Error(`button "${text}" never clickable`);
  })();

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("http://localhost:4173/#/dev", { waitUntil: "load", timeout: 60000 });
await sleep(4000);
await clickText(page, "ENTER SIMULATION");
await sleep(5000);
await clickText(page, "MOON");
await sleep(5000);
await clickText(page, "TRAVEL TO MOON");
await sleep(9000);
await clickText(page, "APOLLO 12");
await sleep(4000);
await clickText(page, "DESCEND TO SITE");
await sleep(45000);

/** sample window of rAF + renderer.info deltas */
const sample = (ms, label) =>
  page.evaluate(
    ({ ms, label }) =>
      new Promise((resolve) => {
        const gl = window.__echoesGl;
        const t0 = performance.now();
        const frames = [];
        const calls0 = gl.info.render.calls;
        const tri0 = gl.info.render.triangles;
        let last = performance.now();
        function loop(t) {
          const dt = t - last;
          last = t;
          if (dt < 600) frames.push(dt);
          if (t - t0 < ms) requestAnimationFrame(loop);
          else {
            const sorted = [...frames].sort((a, b) => a - b);
            const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
            const avg = frames.reduce((a, c) => a + c, 0) / frames.length;
            resolve({
              label,
              fps: Math.round(1000 / avg),
              p95: Math.round(q(0.95)),
              calls: gl.info.render.calls,
              callsDelta: gl.info.render.calls - calls0,
              tris: gl.info.render.triangles,
            });
          }
        }
        requestAnimationFrame(loop);
      }),
    { ms, label }
  );

const set = (fn) => page.evaluate(gl.__proto__ && fn.toString ? fn.toString() : fn);

console.log(JSON.stringify(await sample(7000, "A_baseline-pr1.0")));
await page.evaluate(() => { window.__echoesGl.setPixelRatio(0.4); });
await sleep(1500);
console.log(JSON.stringify(await sample(7000, "B_pr0.4")));
await sleep(1500);
console.log(JSON.stringify(await sample(5000, "B2_pr0.4-hold")));
await page.evaluate(() => { window.__echoesGl.setPixelRatio(1); });
await sleep(1500);
console.log(JSON.stringify(await sample(6000, "C_back-pr1.0")));

await browser.close();
