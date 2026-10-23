// Site rock + sun look check at ultra.
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
// Sun close-up
await clickText("SUN");
await sleep(5200);
await page.screenshot({ path: `${REPO}/shotsfix/06-sun-ultra.png` });
// Mars site via the non-cinematic path: orbit, then descend
await clickText("MARS");
await sleep(2500);
await clickText("MER-B");
await sleep(2400);
await clickText("DESCEND TO SITE");
let arrived = false;
for (let i = 0; i < 40 && !arrived; i++) {
  await sleep(1500);
  arrived = await page.evaluate(() => window.__echoesAmb === "mars");
}
console.log("arrived site:", arrived);
await sleep(6500);
await page.screenshot({ path: `${REPO}/shotsfix/07-mars-site-rocks.png` });
// tilt the camera a bit lower via arrow keys for the field vantage
await page.keyboard.press("ArrowDown");
await page.keyboard.down("ArrowDown");
await sleep(2500);
await page.keyboard.up("ArrowDown");
await sleep(1200);
await page.screenshot({ path: `${REPO}/shotsfix/08-mars-site-rocks-low.png` });
console.log("ERRORS:", errors.length, errors.slice(0, 4));
await browser.close();
