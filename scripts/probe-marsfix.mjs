// Mars planet floor at ultra, deep into the cinematic approach.
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
      const b = [...document.querySelectorAll("button,a")].find((x) => (x.textContent || "").trim() === t || (x.textContent || "").includes(t));
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
if (!(await clickText("MARS"))) throw new Error("mars pill missing");
await sleep(2200);
await clickText("MER-B");
await sleep(2200);
await clickText("CINEMATIC");
console.log("cinematic approach started");
let marsReady = null;
for (let i = 0; i < 40 && !marsReady; i++) {
  await sleep(1500);
  const t = await page.evaluate(() => (window.__echoesTexStats ? window.__echoesTexStats() : null));
  marsReady = t?.entries?.find?.((e) => e.url === "/tex-hi/mars.ktx2" && e.status === "ready") ?? null;
}
console.log("mars tier:", marsReady ? `ready ${((marsReady.bytes ?? 0) / 1e6).toFixed(2)} MB` : "NOT ready");
// deep wait: cinematic travel leg is 2.2-5.5 s, insertion banner ~2.4 s, then approach camera settles
await sleep(26000);
await page.screenshot({ path: `${REPO}/shotsfix/04a-mars-planet.png` });
await sleep(14000);
await page.screenshot({ path: `${REPO}/shotsfix/04b-mars-planet.png` });
await sleep(14000);
await page.screenshot({ path: `${REPO}/shotsfix/04c-mars-planet.png` });
const amb = await page.evaluate(() => window.__echoesAmb);
console.log("ambience:", amb, "ERRORS:", errors.length, errors.slice(0, 4));
await browser.close();
