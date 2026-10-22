import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
page: {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 250)); });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 250)));
  try {
    const shots = async (label, quality) => {
      await page.addInitScript((q) => {
        localStorage.clear();
        localStorage.setItem("echoes.quality", q);
        localStorage.setItem("echoes.ceiling", q);
        localStorage.setItem("echoes.autoq", "false");
      }, quality);
      await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
      await sleep(3200);
      let entered = false;
      for (let i = 0; i < 20 && !entered; i++) {
        entered = await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("ENTER SIMULATION"));
          if (!b) return false;
          b.click();
          return true;
        });
        await sleep(800);
      }
      // solar view first
      await sleep(6000);
      await page.screenshot({ path: `${REPO}/shotsquality/${label}-solar.png` });
      // travel to the moon planet scene (8K map lives there)
      for (let i = 0; i < 12; i++) {
        const clicked = await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "MOON");
          if (b) { b.click(); return true; }
          return false;
        });
        if (clicked) break;
        await sleep(1000);
      }
      await sleep(7000);
      for (let i = 0; i < 12; i++) {
        const clicked = await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("TRAVEL TO MOON"));
          if (b) { b.click(); return true; }
          return false;
        });
        if (clicked) break;
        await sleep(1200);
      }
      await sleep(9000);
      await page.screenshot({ path: `${REPO}/shotsquality/${label}-moon.png` });
      console.log(`${label}: quality=${quality} shots saved`);
    };
    await shots("auto-low", "low");
    await shots("ultra", "ultra");
    console.log("ERRORS:", errors.length ? errors.join(" | ").slice(0, 500) : "none");
  } finally {
    await page.close();
  }
}
await browser.close();
