// Post-complaint verification: haze gone, SYS panel closes (Esc + CLOSE), Mars photographic tier, mipped band.
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
await sleep(4500);

// 1) solar view at ultra — band quality + haze gone
await sleep(9000);
const tex = await page.evaluate(() => (window.__echoesTexStats ? window.__echoesTexStats() : null));
const band = tex?.entries?.find?.((e) => e.url === "/tex-hi/milkyway.ktx2");
console.log("band tier:", band ? `${band.status} ${((band.bytes ?? 0) / 1e6).toFixed(2)} MB` : "none");
await page.screenshot({ path: `${REPO}/shotsfix/01-solar-ultra.png` });

// 2) SYS panel: Esc closes
await clickText("SYS");
await sleep(500);
const before = await page.evaluate(() => document.body.innerText.includes("GRAPHICS QUALITY"));
console.log("settings open before Esc:", before);
await page.screenshot({ path: `${REPO}/shotsfix/02-sys-open.png` });
await page.keyboard.press("Escape");
await sleep(500);
const afterEsc = await page.evaluate(() => document.body.innerText.includes("GRAPHICS QUALITY"));
console.log("settings open after ESC:", afterEsc, "(want false)");

// CLOSE button path
await clickText("SYS");
await sleep(500);
await clickText("CLOSE");
await sleep(400);
const afterClose = await page.evaluate(() => document.body.innerText.includes("GRAPHICS QUALITY"));
console.log("settings open after CLOSE:", afterClose, "(want false)");

// 3) Mars planet tier via cinematic approach
if (!(await clickText("MARS"))) throw new Error("mars pill missing");
await sleep(2500);
const clickedOpp = await clickText("MER-B");
console.log("clicked artifact row:", clickedOpp);
await sleep(2500);
await page.screenshot({ path: `${REPO}/shotsfix/03-mars-list.png` });
if (await clickText("CINEMATIC")) {
  console.log("cinematic approach started");
}
let marsReady = null;
for (let i = 0; i < 40 && !marsReady; i++) {
  await sleep(1500);
  const t = await page.evaluate(() => (window.__echoesTexStats ? window.__echoesTexStats() : null));
  marsReady = t?.entries?.find?.((e) => e.url === "/tex-hi/mars.ktx2" && e.status === "ready") ?? null;
}
console.log("mars tier:", marsReady ? `ready ${((marsReady.bytes ?? 0) / 1e6).toFixed(2)} MB` : "NOT ready");
await sleep(9000);
await page.screenshot({ path: `${REPO}/shotsfix/04-mars-planet-ultra.png` });

console.log("ERRORS:", errors.length, errors.slice(0, 6));
await browser.close();
