import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  let entered = false;
  for (let i = 0; i < 20 && !entered; i++) {
    entered = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
      if (!b) return false; // not ready
      b.click();
      return true;
    });
    await sleep(900);
  }
  // entry check: HUD "ARCHIVE PROGRESS" appears
  for (let i = 0; i < 10 && !entered; i++) {
    entered = await page.evaluate(() => document.body.textContent.includes("ARCHIVE PROGRESS"));
    await sleep(1000);
  }
  console.log("entered:", entered);
  await sleep(9000); // fade completes
  const pre = await page.evaluate(() => {
    const w = window;
    if (!(w.__echoesGl && w.__echoesScene && w.__echoesCam)) return "bridges missing";
    let band = null;
    w.__echoesScene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (!band) return "no band";
    band.material.map = null;
    band.material.color.setRGB(0, 1, 0);
    band.material.opacity = 1;
    band.material.needsUpdate = true;
    return "greened";
  });
  console.log("pre:", JSON.stringify(pre));
  await sleep(500);
  await page.screenshot({ path: "shotsky/green-entered.png" });
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
