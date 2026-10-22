/* Rich-universe sky probe: verifies deep-star stream + Milky Way KTX2 mount,
 * captures solar and planet-view skies. Usage: node scripts/probe-sky.mjs [url] [outDir]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173/";
const outDir = process.argv[3] ?? "shotsky";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clickText = async (page, text, exact = false, tries = 12) => {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate(
      ({ text, exact }) => {
        const btns = [...document.querySelectorAll("button")];
        const hit = btns.find((b) => {
          const t = (b.textContent || "").trim();
          return exact ? t === text : t.includes(text);
        });
        if (hit) { hit.click(); return true; }
        return false;
      },
      { text, exact }
    );
    if (ok) return true;
    await sleep(800);
  }
  return false;
};

const bandResident = (page) =>
  page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => e.name.includes("milkyway.ktx2"))
      .map((e) => e.transferSize)
      .reduce((a, b) => a + b, 0)
  );

const errors = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));

try {
  await mkdir(outDir, { recursive: true });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  await clickText(page, "ENTER SIMULATION");
  await sleep(6000);
  const deep = await page.evaluate(() => window.__echoesStarsDeep?.());
  const bandBytes = await bandResident(page);
  console.log("deep stars:", JSON.stringify(deep));
  console.log("milky way bytes (transfer):", bandBytes);
  await page.screenshot({ path: `${outDir}/solar-sky.png` });

  await clickText(page, "MOON", true);
  await sleep(2000);
  await clickText(page, "TRAVEL TO MOON");
  await sleep(9000);
  await page.screenshot({ path: `${outDir}/moon-sky.png` });
  console.log("post-arrival band bytes:", await bandResident(page));
} finally {
  await browser.close();
  if (errors.length) {
    console.log("ERRORS:", errors.length);
    for (const e of errors) console.log(" ", e);
    process.exitCode = 1;
  } else console.log("ERRORS: none");
}
