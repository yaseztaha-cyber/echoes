// RENDER THE MER-B MISSION FILM
//
// The MER-B (Opportunity) documentary was authored as the standalone cinematic
// journey prototype (mars-rover-cinematic-prototype). This script renders that
// documentary to a single, streamable video file so ECHOES can play it as a
// mission film inside Opportunity's mission experience.
//
//   node scripts/render-merb-film.mjs [--src <prototypeDir>] [--out <file.webm>]
//
// It drives the BUILT prototype (dist/index.html) in headless Chromium/Edge and
// records the real-time playthrough — the film's own 3D scenes, camera
// choreography, editorial typography and the original audio of the NASA/JPL
// launch tape. Nothing is re-authored, re-drawn or substituted here.
//
// Provenance of the output: the frames are the user's own documentary; the
// only transform is the screen capture itself (VP8/WebM).
import { chromium } from "playwright-core";
import http from "node:http";
import { readFile, stat, mkdir, readdir, copyFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const SRC = argOf("--src", "C:/Users/DELL/AppData/Local/Temp/opencode/merb");
const OUT = argOf("--out", "public/films/merb-mission-film.webm");
const WIDTH = Number(argOf("--width", "1280"));
const HEIGHT = Number(argOf("--height", "720"));
const QUALITY = argOf("--quality", "medium");
const PORT = Number(argOf("--port", "5199"));

const DIST = path.join(SRC, "dist");
if (!existsSync(path.join(DIST, "index.html"))) {
  console.error(`No build at ${DIST}/index.html — run "npm run build" in the prototype folder first.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ static server */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    const p = path.join(DIST, rel === "/" ? "index.html" : rel);
    const body = await readFile(p);
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(PORT, r));

/* ------------------------------------------------------------------ capture */
const videoDir = path.join(SRC, "verification-video");
await mkdir(videoDir, { recursive: true });
for (const f of await readdir(videoDir)) await unlink(path.join(videoDir, f)).catch(() => {});

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
    "--mute-audio=false",
  ],
});
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  recordVideo: { dir: videoDir, size: { width: WIDTH, height: HEIGHT } },
});
const page = await context.newPage();
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

console.log(`rendering MER-B film at ${WIDTH}x${HEIGHT} (quality=${QUALITY}) …`);
await page.goto(`http://localhost:${PORT}/?debug=1&autoplay=1&intro=0&quality=${QUALITY}`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => !!window.__journey, null, { timeout: 60000 });
await page.evaluate(() => window.__journey.play());

const t0 = Date.now();
let last = "";
for (;;) {
  const s = await page.evaluate(() => window.__journey.getState());
  const line = `${s.chapterId} ${s.chapterTime.toFixed(1)}/${s.chapterDuration.toFixed(0)}s fps=${s.fps.toFixed(0)}`;
  if (line.slice(0, 24) !== last.slice(0, 24)) {
    console.log(`  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${line}`);
    last = line;
  }
  if (s.ended) break;
  if (Date.now() - t0 > 20 * 60 * 1000) {
    console.error("Timed out before the journey ended.");
    break;
  }
  await page.waitForTimeout(2000);
}

const state = await page.evaluate(() => window.__journey.getState());
console.log("final state:", JSON.stringify({ chapter: state.chapterId, ended: state.ended, fps: state.fps, quality: state.quality }));
if (logs.length) console.log("LOGS:\n" + [...new Set(logs)].slice(0, 12).join("\n"));

await context.close(); // flushes the recording
await browser.close();
server.close();

const files = await readdir(videoDir);
const webm = files.find((f) => f.endsWith(".webm"));
if (!webm) {
  console.error("No recording produced.");
  process.exit(1);
}
const outPath = path.resolve(OUT);
await mkdir(path.dirname(outPath), { recursive: true });
await copyFile(path.join(videoDir, webm), outPath); // copy: the capture may live on another volume
await unlink(path.join(videoDir, webm)).catch(() => {});
const size = (await stat(outPath)).size;
console.log(`film written: ${outPath} (${(size / 1048576).toFixed(1)} MB)`);
