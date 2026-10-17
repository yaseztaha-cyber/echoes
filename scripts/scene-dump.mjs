/* Site-scene draw-call composition dump: journey to the surface, then walk the
 * three.js scene graph and classify every visible drawable by bucket.
 * Usage: node scripts/scene-dump.mjs [url] [outJson]
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:4173/";
const out = process.argv[3] ?? null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, exact = false, tries = 12) {
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
    if (ok) return;
    await sleep(800);
  }
  throw new Error(`button "${text}" not found`);
}

const errors = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));

try {
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await sleep(3500);
  await clickText(page, "ENTER SIMULATION", false);
  await sleep(5000);
  await clickText(page, "MOON", true);
  await sleep(5000);
  await clickText(page, "TRAVEL TO MOON", false);
  await sleep(9000);
  await clickText(page, "APOLLO 12", false);
  await sleep(4000);
  await clickText(page, "DESCEND TO SITE", false);
  await sleep(52000);

  const dump = await page.evaluate(() => {
    const w = window;
    const scene = w.__echoesScene, gl = w.__echoesGl;
    if (!scene || !gl) return { error: "scene/gl hooks missing" };
    const t0 = performance.now();
    const buckets = new Map();
    const lights = [];
    let visibleDrawables = 0;
    let culled = 0;
    scene.traverse((o) => {
      if (o.isLight) {
        lights.push(`${o.type}:cast=${!!o.castShadow}:i=${o.intensity ?? "-"}:${o.shadow?.mapSize?.width ?? 0}`);
        return;
      }
      const isDraw = o.isMesh || o.isInstancedMesh || o.isPoints || o.isLine || o.isLineSegments || o.isLineSegments2 || o.isLine2;
      if (!isDraw) return;
      if (!o.visible) { culled++; return; }
      visibleDrawables++;
      const g = o.geometry ?? {};
      const m = o.material;
      const mHex = m && !Array.isArray(m) && m.color ? m.color.getHexString() : "";
      let key;
      if (o.isPoints) key = "points:" + (g.name || g.type || "?");
      else if (o.isInstancedMesh) key = `instanced:${g.type}:${o.count}`;
      else if (m && m.type === "LineMaterial") key = "line2";
      else if (m && m.type === "MeshBasicMaterial") key = `basic:${g.type}:${m.vertexColors ? "vc" : ""}`;
      else if (g.type === "BoxGeometry") key = `box:${mHex}`;
      else if (g.type === "CylinderGeometry") key = `cyl:${mHex}`;
      else if (g.type === "SphereGeometry") key = `sphere:${mHex}`;
      else key = `obj:${g.name || g.type || g.constructor?.name || "?"}@${(m && (m.name || m.type)) || "?"}`;
      const b = buckets.get(key) ?? { n: 0, tris: 0, bytes: 0 };
      const at = g.attributes ?? {};
      const v = at.position ? at.position.count : 0;
      b.n++;
      b.tris += g.index ? g.index.count / 3 : v / 3;
      const iB = g.index ? g.index.count * (g.index.array?.BYTES_PER_ELEMENT ?? 4) : 0;
      const aB = [
        ["position", 12], ["normal", 12], ["uv", 8], ["color", 12], ["aColor", 12], ["aSize", 4],
      ].reduce((s, [nm, sz]) => s + (at[nm] ? at[nm].count * sz : 0), 0);
      b.bytes += v * (aB ? aB : 0) + iB;
      if (o.isInstancedMesh) b.bytes += o.count * 64;
      buckets.set(key, b);
    });
    const callList = {};
    let totTris = 0, totBytes = 0;
    for (const [k, b] of [...buckets].sort()) {
      callList[k] = `${b.n} calls, ${Math.round(b.tris)} tris, ${(b.bytes / 1024).toFixed(0)} KB`;
      totTris += b.tris;
      totBytes += b.bytes;
    }
    return {
      ms: +(performance.now() - t0).toFixed(1),
      shadowMapEnabled: gl.shadowMap.enabled,
      lights,
      renderCalls: gl.info.render.calls,
      renderTris: gl.info.render.triangles,
      visibleDrawables,
      hiddenDrawables: culled,
      totTris: Math.round(totTris),
      totBytesKB: Math.round(totBytes / 1024),
      buckets: callList,
    };
  });
  console.log(JSON.stringify(dump, null, 1));
  console.log("PAGE ERRORS:", errors.length ? errors.join(" | ") : "none");
  if (out) await writeFile(out, JSON.stringify({ dump, errors }, null, 2));
} finally {
  await browser.close();
}
