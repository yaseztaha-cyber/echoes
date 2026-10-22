import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  for (let i = 0; i < 10 && !entered; i++) {
    entered = await page.evaluate(() => document.body.textContent.includes("ARCHIVE PROGRESS"));
    await sleep(1000);
  }
  console.log("entered:", entered);
  await sleep(9000); // fade completes
  const stats = await page.evaluate(() => {
    const { __echoesGl: gl, __echoesScene: scene, __echoesCam: cam } = window;
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material.isMeshBasicMaterial && o.renderOrder === -11) band = o; });
    if (!band) return { found: false };
    const grab = () => {
      gl.render(scene, cam);
      const glc = gl.domElement;
      const c2 = document.createElement("canvas");
      c2.width = 256; c2.height = 160;
      const ctx = c2.getContext("2d");
      ctx.drawImage(glc, 0, 0, c2.width, c2.height);
      return ctx.getImageData(0, 0, 256, 160).data;
    };
    const lum = (d) => { let s = 0, n = 0, mx = 0; for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; n++; if (l > mx) mx = l; } return { mean: +(s / n).toFixed(1), max: +mx.toFixed(1) }; };
    const on = lum(grab());
    band.visible = false;
    const off = lum(grab());
    band.visible = true;
    const t = band.material.map;
    return {
      found: true, on, off,
      minFilter: t.minFilter, magFilter: t.magFilter,
      mipCount: t.mipmaps?.length,
      bytes: t.mipmaps?.[0]?.data?.byteLength,
    };
  });
  console.log(JSON.stringify(stats));
  await page.screenshot({ path: "shotsky/band-fixed.png" });
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
