import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  let clicked = false;
  for (let i = 0; i < 15 && !clicked; i++) {
    clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
      if (!b) return false;
      b.click();
      return true;
    });
    await sleep(800);
  }
  console.log("clicked:", clicked);
  await sleep(6000);
  await page.screenshot({ path: "shotsky/sweep-enter.png" });
  const hud = await page.evaluate(() => !document.body.textContent.includes("ENTER SIMULATION"));
  console.log("entered:", hud);
  const dome = await page.evaluate(() => {
    let hits = [];
    const scene = window.__echoesScene;
    scene?.traverse((o) => {
      if (o.isMesh && o.material?.map && o.material.side === 1) {
        hits.push({ scale: Math.round(o.scale.x), opacity: +o.material.opacity.toFixed(3), visible: o.visible, map: !!o.material.map, rendered: o.material.map?.image?.width ?? null });
      }
    });
    return hits;
  });
  console.log("backside textured meshes:", JSON.stringify(dome));
  const cx = 720, cy = 500;
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 400, cy, { steps: 12 });
    await page.mouse.up();
    await sleep(1200);
    await page.screenshot({ path: `shotsky/sweep-${i}.png` });
  }
  console.log("sweep done");
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
