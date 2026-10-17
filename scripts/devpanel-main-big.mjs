/* DevPanel telemetry during the Apollo 12 descent (hash #/dev enables the panel).
 * Usage: node scripts/devpanel-approach.mjs
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await mkdir("shots2", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("http://localhost:4173/#/dev", { waitUntil: "load", timeout: 60000 });
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

for (let i = 0; i < 8; i++) {
  await sleep(9000);
  await page.screenshot({ path: `shots2/main-big-long-${i}.png` });
  console.log(`shot ${i}`);
}
await browser.close();
