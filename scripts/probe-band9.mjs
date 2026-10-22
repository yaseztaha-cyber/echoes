import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPO = "D:/YASEZ_HOME/projects/NASA space apps/nasa-planetary-exploration-simulator";
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
  await sleep(9000); // band faded in
  const cine = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "CINEMATIC");
    if (!b) return false;
    b.click();
    return true;
  });
  console.log("cinematic:", cine);
  for (let k = 0; k < 5; k++) {
    await sleep(2600);
    await page.screenshot({ path: `${REPO}/shotsky/cine-${k}.png` });
  }
  console.log("done");
} finally {
  await browser.close();
  if (errors.length) { console.log("ERRORS:", errors.length); errors.forEach((e) => console.log(" ", e)); }
}
