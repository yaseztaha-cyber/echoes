/* Probe the approach phase: long tasks (JS) vs rAF gaps (GPU/render stall).
 * Usage: node scripts/probe-approach.mjs
 */
import { chromium } from "playwright-core";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
await sleep(3500);
const clickText = async (text, tries = 10) => {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate((text) => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes(text));
      if (b) { b.click(); return true; }
      return false;
    }, text);
    if (ok) return;
    await sleep(800);
  }
  throw new Error(`button "${text}" never clickable`);
};
await clickText("ENTER SIMULATION");
await sleep(5000);
await clickText("MOON");
await sleep(5000);
await clickText("TRAVEL TO MOON");
await sleep(9000);
await clickText("APOLLO 12");
await sleep(4000);
await clickText("DESCEND TO SITE");

// sampler: rAF deltas + longtasks
await page.evaluate(() => {
  window.__probe = { raf: [], longtasks: [] };
  let last = performance.now();
  function loop(t) {
    window.__probe.raf.push(t - last);
    last = t;
    if (window.__probe.raf.length < 4000) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__probe.longtasks.push(e.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {}
});

for (let i = 0; i < 6; i++) {
  await sleep(8000);
  const r = await page.evaluate(() => {
    const p = window.__probe;
    const ms = p.raf.slice(-60).filter((d) => d < 500);
    const avg = ms.length ? ms.reduce((a, c) => a + c, 0) / ms.length : -1;
    const sorted = [...ms].sort((a, b) => a - b);
    const lt = p.longtasks.slice(-20);
    const txt = (document.body.textContent || "");
    const dist = (txt.match(/([\d.]+) KM/) || [])[1];
    const markers = ["PLANETARY APPROACH", "SURFACE", "OCEANUS", "CINEMATIC"].filter((m) => txt.includes(m));
    return { fps: Math.round(1000 / avg), avgMs: Math.round(avg), lastLongTasks: lt, distKm: dist, markers };
  });
  console.log(`t+${(i + 1) * 8}s: ${JSON.stringify(r)}`);
  await page.screenshot({ path: `shots2/probe-${i}.png` }).catch(() => {});
}
console.log("pageerrors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
