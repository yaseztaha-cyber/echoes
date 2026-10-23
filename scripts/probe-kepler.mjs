// Kepler + real-sun look check at ultra. Reuses the sitefix probe structure.
import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 220)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 220)));
const clickText = async (text) => {
  for (let i = 0; i < 12; i++) {
    const ok = await page.evaluate((t) => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === t || (x.textContent || "").includes(t));
      if (b) { b.click(); return true; }
      return false;
    }, text);
    if (ok) return true;
    await sleep(700);
  }
  return false;
};
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("echoes.quality", "ultra");
  localStorage.setItem("echoes.ceiling", "ultra");
  localStorage.setItem("echoes.autoq", "false");
});
await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
if (!(await clickText("ENTER SIMULATION"))) throw new Error("entry missing");
await sleep(3500);
// 1. Sun close-up
await clickText("SUN");
await sleep(5200);
await page.screenshot({ path: `${REPO}/shotskep/01-sun.png` });
// 2. Solar overview from above — verify the ellipse orbit lines
await clickText("OVERVIEW");
await sleep(3000);
await page.screenshot({ path: `${REPO}/shotskep/02-overview.png` });
// 3. Mars label + open its context panel (true distances)
await clickText("EARTH");
await sleep(4000);
await page.screenshot({ path: `${REPO}/shotskep/03-earth.png` });
console.log("ERRORS:", errors.length, errors.slice(0, 4));
await browser.close();
