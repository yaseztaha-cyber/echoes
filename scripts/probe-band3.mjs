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
  await sleep(6000);
  const info = await page.evaluate(() => {
    const scene = window.__echoesScene, gl = window.__echoesGl, cam = window.__echoesCam;
    if (!scene || !gl || !cam) return "bridges missing";
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (!band) return "no band";
    band.material.color.setRGB(8, 8, 8);
    const g = new (cam.position.constructor)(-0.0555, -0.7912, 0.6088);
    cam.lookAt(cam.position.clone().add(g));
    gl.render(scene, cam);
    return { scale: band.scale.x, visible: band.visible, transparent: band.material.transparent, opacity: band.material.opacity, depthWrite: band.material.depthWrite, map: !!band.material.map, camFar: cam.far, camPos: [cam.position.x, cam.position.y, cam.position.z].map((v) => +v.toFixed(1)) };
  });
  console.log("info:", JSON.stringify(info));
  await page.screenshot({ path: "shotsky/band-x8.png" });
  // now restore-ish leaving color; doesn't matter, browser closes
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
