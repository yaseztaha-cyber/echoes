// RECORD THE ECHOES DEMO FILMS
//
// Captures two real screen recordings of the running application:
//   * echoes-demo-60s.webm  - the cinematic master
//   * echoes-demo-30s.webm  - the competition cut (max 30 s, ends on the name)
//
// Nothing is rendered or faked: the browser drives the actual application.
//
//   node scripts/record-demo.mjs [--base http://localhost:5190/] [--out <dir>]
import { chromium } from "playwright-core";
import { mkdirSync, renameSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const argOf = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BASE = argOf("--base", "http://localhost:5190/");
const OUT = argOf("--out", ".");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickWhenPresent(page, re, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate((x) => {
      const b = [...document.querySelectorAll("button")].find((e) => new RegExp(x, "i").test(e.textContent || ""));
      if (b) { b.click(); return true; }
      return false;
    }, re);
    if (ok) return true;
    await sleep(350);
  }
  return false;
}

async function run(name, { cut }) {
  const dir = join(OUT, `.rec-${name}`);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir, size: { width: 1920, height: 1080 } },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
  await sleep(3500);

  if (cut) {
    // 30 s competition cut: straight into the solar system, a world, a machine
    await clickWhenPresent(page, "ENTER ECHOES");
    await sleep(800);
    await clickWhenPresent(page, "ENTER SIMULATION");
    await sleep(4200);
    await clickWhenPresent(page, "MARS", 10);
    await sleep(2200);
    await clickWhenPresent(page, "TRAVEL TO MARS");
    await sleep(5200);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes("MER-B · OPPORTUNITY"));
      b?.click();
    });
    await sleep(700);
    await clickWhenPresent(page, "DESCEND TO SITE");
    await sleep(7200);
    // end card
    await page.evaluate(() => {
      const d = document.createElement("div");
      d.style.cssText =
        "position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,7,10,0.86);color:#d8d6ce;font-family:'IBM Plex Mono',monospace";
      d.innerHTML =
        '<div style="font-size:76px;letter-spacing:0.22em">ECHOES</div>' +
        '<div style="margin-top:18px;font-size:20px;letter-spacing:0.16em;color:#d0a45b">EVERY JOURNEY LEAVES A TRACE</div>' +
        '<div style="margin-top:14px;font-size:13px;letter-spacing:0.12em;color:#a2a6a4">REAL MISSIONS · REAL DESTINATIONS · ONE CONTINUOUS EXPERIENCE</div>' +
        '<div style="margin-top:10px;font-size:10px;letter-spacing:0.1em;color:#6f7576">ASSISTED BY AI CODING TOOLS · NASA/JPL/USGS DATA · SEE THE PROJECT README</div>';
      document.body.appendChild(d);
    });
    await sleep(3000);
  } else {
    // 60 s master: the whole arc, ending on the documentary
    await sleep(2000);
    await clickWhenPresent(page, "ENTER ECHOES");
    await sleep(1000);
    await clickWhenPresent(page, "ENTER SIMULATION");
    await sleep(5000);
    await clickWhenPresent(page, "MARS", 10);
    await sleep(3000);
    await clickWhenPresent(page, "TRAVEL TO MARS");
    await sleep(8000);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes("MER-B · OPPORTUNITY"));
      b?.click();
    });
    await sleep(700);
    await clickWhenPresent(page, "DESCEND TO SITE");
    await sleep(12000);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").toUpperCase().includes("WATCH MISSION FILM"));
      b?.click();
    });
    await sleep(8000);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").startsWith("Play "));
      b?.click();
    });
    await sleep(8000);
  }

  const video = page.video();
  await ctx.close();
  await browser.close();
  if (!video) throw new Error("no video was recorded");
  const p = await video.path();
  const out = join(OUT, name.endsWith(".webm") ? name : `${name}.webm`);
  renameSync(p, out);
  console.log("recorded", out);
  return out;
}

await run("echoes-demo-30s", { cut: true });
await run("echoes-demo-60s", { cut: false });
console.log("done:", readdirSync(OUT).filter((f) => f.endsWith(".webm")).join(", "));
