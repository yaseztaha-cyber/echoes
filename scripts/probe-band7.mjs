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
  await sleep(5000);
  const report = await page.evaluate(() => {
    const { __echoesGl: gl, __echoesScene: scene } = window;
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (!band) return { found: false };
    gl.info.reset();
    band.visible = false;
    gl.render(scene, window.__echoesCam);
    const off = { calls: gl.info.render.calls, tris: gl.info.render.triangles };
    band.visible = true;
    band.material.map = null;
    band.material.color.setRGB(0, 1, 0);
    band.material.opacity = 1;
    band.material.side = 2; // DoubleSide
    band.material.needsUpdate = true;
    gl.render(scene, window.__echoesCam);
    const on = { calls: gl.info.render.calls, tris: gl.info.render.triangles };
    const geo = band.geometry;
    return {
      found: true,
      off, on,
      idxCount: geo.index?.count,
      posCount: geo.attributes.position?.count,
      hasUv: !!geo.attributes.uv,
      bounding: geo.boundingSphere ? { r: +geo.boundingSphere.radius.toFixed(1), center: geo.boundingSphere.center.toArray().map((v) => +v.toFixed(1)) } : null,
      nan: (() => { const a = geo.attributes.position.array; for (let i = 0; i < a.length; i += 997) if (!isFinite(a[i])) return true; return false; })(),
      bandPos: band.position.toArray().map((v) => +v.toFixed(2)),
      parent: band.parent?.type,
    };
  });
  console.log(JSON.stringify(report));
  await page.screenshot({ path: "shotsky/green-doubleside.png" });
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
