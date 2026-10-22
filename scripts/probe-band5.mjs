import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
    if (b) b.click();
  });
  await sleep(4000);
  await page.evaluate(() => {
    const scene = window.__echoesScene;
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (band) {
      band.visible = true;
      band.material.map = null;
      band.material.color.setRGB(0, 1, 0);
      band.material.opacity = 0.6;
    }
    window._bandFound = !!band;
  });
  await sleep(1000);
  const found = await page.evaluate(() => window._bandFound);
  console.log("band found:", found);
  await page.screenshot({ path: "shotsky/band-green.png" });
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
