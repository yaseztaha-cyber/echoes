import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 250)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 250)));
try {
  await page.addInitScript(() => {
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => (window.__freezeRaf === true ? 0 : orig(cb));
  });
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
  await sleep(9000); // band fade completes
  await page.evaluate(() => { window.__freezeRaf = true; });
  const shootAt = async (vx, jx, file) => {
    await page.evaluate(async ([i, j]) => {
      const { __echoesGl: gl, __echoesScene: scene, __echoesCam: cam } = window;
      let band = null;
      scene.traverse((o) => { if (o.isMesh && o.material?.isMeshBasicMaterial && o.renderOrder === -11) band = o; });
      const pos = band.geometry.attributes.position;
      const at = (idx) => [pos.getX(idx) * 8982, pos.getY(idx) * 8982, pos.getZ(idx) * 8982];
      const [tx, ty, tz] = at(j * 129 + i);
      cam.lookAt(tx, ty, tz);
      cam.updateMatrixWorld(true);
      gl.render(scene, cam);
    }, [vx, jx]);
    await page.screenshot({ path: `${REPO}/shotsky/${file}` });
  };
  // control field first (l=-90), then galactic center bulge (l≈0, b≈-28)
  await shootAt(32, 42, "field-l90.png");
  await shootAt(64, 42, "bulge.png");
  console.log("done");
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
