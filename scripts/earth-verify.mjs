/* ECHOES earth-layers verification: solar focus view + planet scene (clouds/night).
 * Usage: node scripts/earth-verify.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

try {
  await mkdir("shots2", { recursive: true });
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  await clickText(page, "ENTER SIMULATION");
  await sleep(5000);
  await clickText(page, "EARTH", true);
  await sleep(4000);
  await page.screenshot({ path: "shots2/e0-focused.png" });
  console.log("e0 solar focus captured");
  await clickText(page, "ENTER EARTH ORBIT");
  await sleep(12000);
  const r = await page.evaluate(() =>
    new Promise((resolve) => {
      const ms = [];
      let last = performance.now();
      const started = last;
      function loop(t) {
        const dt = t - last;
        last = t;
        if (dt < 500) ms.push(dt);
        if (t - started < 7000) requestAnimationFrame(loop);
        else {
          const s = [...ms].sort((a, b) => a - b);
          const avg = ms.reduce((a, c) => a + c, 0) / ms.length;
          resolve({ frames: ms.length, fps: Math.round((1000 / avg) * 10) / 10, p95: Math.round(s[Math.floor(s.length * 0.95)] * 100) / 100 });
        }
      }
      requestAnimationFrame(loop);
    })
  );
  console.log("earth-planet-scene: " + JSON.stringify(r));
  await page.screenshot({ path: "shots2/e1-planet.png" });
  console.log("e1 planet scene captured");
  await clickText(page, "DUSK", true);
  await sleep(2500);
  await page.screenshot({ path: "shots2/e5-dusk.png" });
  console.log("e5 dusk scrub captured");
  await clickText(page, "MIDNIGHT", true);
  await sleep(2500);
  await page.screenshot({ path: "shots2/e6-midnight.png" });
  console.log("e6 midnight scrub captured");
  await clickText(page, "NOON", true);
  await sleep(2500);
  await page.screenshot({ path: "shots2/e7-noon.png" });
  console.log("e7 noon scrub captured");
  for (let i = 2; i < 5; i++) {
    await sleep(5000);
    await page.screenshot({ path: `shots2/e${i}-orbit.png` });
    console.log(`e${i} orbit frame captured`);
  }
  await writeFile("shots2/earth-summary.json", JSON.stringify({ errors }, null, 2));
  console.log("ERRORS:", errors.length ? errors.join(" | ").slice(0, 800) : "none");
} finally {
  await browser.close();
}
