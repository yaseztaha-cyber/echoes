// Diagnostic: list the clickable controls of the running app so the audit
// probe can address them reliably.
import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("echoes.quality", "high");
  localStorage.setItem("echoes.ceiling", "high");
  localStorage.setItem("echoes.autoq", "false");
});
await page.goto(process.env.PROBE_BASE || "http://localhost:5174/", { waitUntil: "load", timeout: 90000 });
const click = async (t) => {
  for (let i = 0; i < 40; i++) {
    const ok = await page.evaluate((x) => {
      const b = [...document.querySelectorAll("button")].find((e) => (e.textContent || "").trim().toUpperCase() === x);
      if (b) { b.click(); return true; }
      return false;
    }, t.toUpperCase());
    if (ok) return true;
    await sleep(400);
  }
  return false;
};
await click("ENTER SIMULATION");
await sleep(6000);
const dump = async (label) => {
  const list = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim().replace(/\s+/g, " ")).filter(Boolean));
  console.log(`--- ${label} (${list.length}) ---`);
  console.log(list.join(" | "));
};
await dump("solar scene");
await click("Mars");
await sleep(2500);
await dump("after Mars click");
console.log("state:", JSON.stringify(await page.evaluate(() => { const s = window.__echoesState?.(); return { scene: s?.scene, focusBody: s?.focusBody, world: s?.world }; })));
await browser.close();
