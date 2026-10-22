import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 250)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 250)));
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  let entered = false;
  for (let i = 0; i < 20 && !entered; i++) {
    entered = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
      if (!b) return false;
      b.click();
      return true;
    });
    await sleep(900);
  }
  // ESC as skip: travel to the moon, press Escape mid-flight, arrival must land instantly
  await sleep(3200);
  let travel = false;
  for (let i = 0; i < 15 && !travel; i++) {
    travel = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "MOON");
      if (b) { b.click(); return true; }
      return false;
    });
    if (!travel) await sleep(1000);
  }
  console.log("clicked MOON pill:", travel);
  // focusBody flight; wait out (or ESC-skip) it, then kick the real travel
  let travelBtn = false;
  for (let i = 0; i < 20 && !travelBtn; i++) {
    travelBtn = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("TRAVEL TO MOON"));
      if (b) { b.click(); return true; }
      return false;
    });
    if (!travelBtn) await sleep(1000);
  }
  console.log("clicked TRAVEL TO MOON:", travelBtn);
  await sleep(900);
  await page.keyboard.press("Escape");
  const deadline = Date.now() + 8000;
  let ok = false;
  while (Date.now() < deadline) {
    ok = await page.evaluate(() => ({ inserted: document.body.innerText.includes("ORBITAL INSERTION"), amb: window.__echoesAmb }));
    if (ok.inserted && ok.amb === "orbit") break;
    await sleep(500);
  }
  await sleep(2500);
  const st = await page.evaluate(() => ({ amb: window.__echoesAmb, world: !!(window.__echoesTexStats), orbit: document.body.innerText.includes("ORBITAL INSERTION") }));
  console.log(`skip-landed: inserted=${JSON.stringify(ok)} final=${JSON.stringify(st)}`);
  await page.screenshot({ path: `${REPO}/shotsky/esc-skip.png` });
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
