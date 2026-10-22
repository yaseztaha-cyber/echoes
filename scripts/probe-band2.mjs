/* Band brightness probe: renders a fresh frame pointed straight at the galactic
 * center (band guaranteed on-screen), reads pixels, then hides the dome and
 * repeats. Diff = the band's measured on-screen contribution.
 */
import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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
  const out = await page.evaluate(async () => {
    const scene = typeof window.__echoesScene !== "undefined" ? window.__echoesScene : null;
    const gl = typeof window.__echoesGl !== "undefined" ? window.__echoesGl : null;
    const cam = typeof window.__echoesCam !== "undefined" ? window.__echoesCam : null;
    if (!scene || !gl || !cam) return { err: "bridges missing" };
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (!band) return { err: "no band mesh" };

    const gunit = { x: -0.0555, y: -0.7912, z: 0.6088 }; // galactic center in scene frame (galactic.ts anchors)
    const V = cam.position.constructor || (cam.position.clone().constructor);
    const read = (on) => {
      band.visible = on;
      const before = cam.quaternion.clone();
      const target = cam.position.clone().add(new V(gunit.x, gunit.y, gunit.z));
      cam.lookAt(target);
      gl.render(scene, cam);
      cam.quaternion.copy(before);
      return Promise.resolve(gl.domElement.toDataURL("image/png"));
    };
    const onUrl = await read(true);
    const offUrl = await read(false);
    band.visible = true;
    const meanOf = (url) => new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        let sum = 0, n = 0, peak = 0;
        // center 40% of the frame — the aimed direction (band core) lives there
        const x0 = Math.floor(c.width * 0.3), x1 = Math.floor(c.width * 0.7);
        const y0 = Math.floor(c.height * 0.3), y1 = Math.floor(c.height * 0.7);
        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const i = (y * c.width + x) * 4;
            const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += v; n++;
            if (v > peak) peak = v;
          }
        }
        res({ mean: +(sum / n).toFixed(2), peak: +peak.toFixed(1), n });
      };
      img.src = url;
    });
    const on = await meanOf(onUrl);
    const off = await meanOf(offUrl);
    return { on, off, delta: +(on.mean - off.mean).toFixed(2) };
  });
  console.log(JSON.stringify(out));
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
