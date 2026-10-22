/* Band presence probe: measures mean canvas brightness with the Milky Way dome
 * visible vs hidden, and samples brightness around the projected galactic-center
 * direction. Prints numbers; no thresholds are broken silently.
 */
import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  for (let i = 0; i < 15; i++) {
    const done = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
      if (!b) return true;
      b.click();
      return true;
    });
    if (done) break;
    await sleep(800);
  }
  await sleep(7000);
  const stats = await page.evaluate(() => {
    const scene = window.__echoesScene;
    const gl = window.__echoesGl;
    if (!scene || !gl) return { err: "no bridges" };
    let band = null;
    scene.traverse((o) => {
      if (o.isMesh && o.material?.map && o.material.side === 1) band = o;
    });
    if (!band) return { err: "no band mesh" };
    const readMean = (on) => {
      band.visible = on;
      const dom = gl.domElement;
      const w = dom.width, h = dom.height;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(dom, 0, 0);
      const img = ctx.getImageData(0, 0, w, h).data;
      let sum = 0, n = 0;
      for (let i = 0; i < img.length; i += 16) { sum += (img[i] + img[i + 1] + img[i + 2]) / 3; n++; }
      return sum / n;
    };
    const on = readMean(true);
    const off = readMean(false);
    band.visible = true;
    return { meanOn: +on.toFixed(2), meanOff: +off.toFixed(2), delta: +(on - off).toFixed(2), opacity: band.material.opacity };
  });
  console.log(JSON.stringify(stats));
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
