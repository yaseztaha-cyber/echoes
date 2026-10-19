/* KTX2 tier probe: confirm the hi tier requests, transcodes and mounts on the
 * moon globe without blanking, using the window.__echoesTexStats bridge.
 * Usage: node scripts/probe-ktx.mjs <url> <outDir>
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173/";
const outDir = process.argv[3] ?? "shotsktx";
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
  await sleep(3000);
  console.log("solar texStats:", JSON.stringify(await page.evaluate(() => window.__echoesTexStats?.())));

  await clickText(page, "MOON", true);
  await sleep(2000);
  await clickText(page, "TRAVEL TO MOON");
  // the approach schedules KTX2 fetch + transcode; sample residency as it lands
  const samples = [];
  for (let i = 0; i < 10; i++) {
    await sleep(1500);
    const s = await page.evaluate(() => window.__echoesTexStats?.());
    samples.push(s);
    console.log(`  t=${(i + 1) * 1.5}s resident=${s.resident} pending=${s.pending} bytes=${(s.bytesEstimate / 1e6).toFixed(2)}MB evictions=${s.evictions} hits=${s.hits} misses=${s.misses}`);
  }
  const done = samples.some((s) => s.resident > 0 && s.pending === 0 && s.bytesEstimate > 1e6);
  if (!done) throw new Error(`hi tier never became resident: ${JSON.stringify(samples)}`);
  console.log(`HI TIER RESIDENT on moon globe (${done ? "assert ok" : ""})`);
  await page.screenshot({ path: `${outDir}/moon-hi.png` });
} finally {
  await browser.close();
  if (errors.length) {
    console.log("ERRORS:", errors.length);
    for (const e of errors) console.log(" ", e);
    process.exitCode = 1;
  } else console.log("ERRORS: none");
}
