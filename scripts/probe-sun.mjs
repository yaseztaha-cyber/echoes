// Sun rebuild look-check at ultra: layers, markers, corona overview.
import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const sunlog = [];
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 300));
  if ((m.text() || "").includes("[sun]")) sunlog.push(m.text().slice(0, 160));
});
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
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
// 1. Sun close-up (photosphere: granulation, limb darkening, corona, markers)
await clickText("SUN");
await sleep(5500);
await page.screenshot({ path: `${REPO}/shotsun/01-photosphere.png` });
// 2-5. Layer explorer
await clickText("MAGNETIC FIELD");
await sleep(2200);
await page.screenshot({ path: `${REPO}/shotsun/02-magnetic.png` });
await clickText("CORONA");
await sleep(2200);
await page.screenshot({ path: `${REPO}/shotsun/03-corona.png` });
await clickText("CHROMOSPHERE");
await sleep(2200);
await page.screenshot({ path: `${REPO}/shotsun/04-chromosphere.png` });
await clickText("SURFACE MOTION");
await sleep(2200);
await page.screenshot({ path: `${REPO}/shotsun/05-motion.png` });
// 6. Photosphere again + open a real detected sunspot from the panel list
await clickText("PHOTOSPHERE");
await sleep(1800);
await clickText("SUNSPOT 1");
await sleep(1200);
await page.screenshot({ path: `${REPO}/shotsun/06-spot-card.png` });
// 7. Overview — corona restrained at distance, must not dominate
await clickText("OVERVIEW");
await sleep(3200);
await page.screenshot({ path: `${REPO}/shotsun/07-overview.png` });
console.log("ERRORS:", errors.length, errors.slice(0, 6));
console.log("SUNLOG n=", sunlog.length);
console.log(sunlog.join("\n"));
await browser.close();
