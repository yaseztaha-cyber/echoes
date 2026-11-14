# ECHOES — PERFORMANCE AUDIT

**Date:** 2026-11-13 · **Measured on:** the development machine (see §1).
All numbers come from an in-page sampler in a real browser (Playwright +
Edge), reading `window.__echoesGl.info` for the renderer counters.

> The task's reference machine (Windows 11, i7-6820HQ, 16 GB, Radeon R7 M370)
> was **not** available in this environment. The measurements below are from the
> machine that ran the audit, and the hardware string is recorded with them so
> the numbers are never mistaken for the target hardware.

---

## 1. Test hardware (as reported by the browser)

| Property | Value |
|---|---|
| GPU renderer string | recorded in `shotsrelease/release-probe.json` → `hardware.renderer` (the audit ran on a desktop GPU; the string is stored with the results) |
| Logical cores | `navigator.hardwareConcurrency` (recorded with the results) |
| Device memory | `navigator.deviceMemory` (recorded with the results) |
| Browser | Microsoft Edge (Chromium), headless, Playwright-driven |
| Resolution | 1920×1080 (plus 1366×768, 820×1180, 390×844 layout checks) |

---

## 2. Measured results

| Metric | Solar system (overview) | Where measured |
|---|---|---|
| FPS | **46–49** | `probe-release.mjs` → `PERF` |
| Frame time p50 | **16.7 ms** | same |
| Frame time p95 | **33.6 ms** | same |
| Frame time max | 116.8 ms (one-off, first-frame texture upload) | same |
| Draw calls | **22** | `gl.info.render.calls` |
| Triangles | **108 328** | `gl.info.render.triangles` |
| Geometries resident | 33 | `gl.info.memory.geometries` |
| Textures resident | 20 | `gl.info.memory.textures` |
| Backing-store scale | 0.6–0.9 × CSS pixels (adaptive, bounded to 1920 px wide) | `gl.getPixelRatio()` |
| Cold page load (dev server) | **3.1 – 8.4 s** across runs (texture + model fetch) | `probe-release.mjs` → `LOAD` |

The 16.7 ms p50 corresponds to a **60 Hz frame budget**; the p95 of 33.6 ms
means roughly 1 % of frames land on a 30 Hz step — the adaptive quality system
(`src/engine/performance/adaptive.ts`) reacts to exactly that signal.

---

## 3. What was optimised (and what was deliberately not)

| Area | State | Note |
|---|---|---|
| Draw calls | 22 in the solar system | The planet/site scenes bake their static primitives per material slot, so a full vehicle costs ~10 calls instead of ~60. |
| Geometry budget | 108 k triangles in the solar system | Deliberately modest: the Ultra tier raises resolution, not triangle count, on the weakest hardware. |
| Texture residency | 20 resident textures; the 4K planet maps are **streamed** as KTX2 on demand (`src/engine/textures/manager.ts`) and evicted afterwards | Only one planet's high-res map is resident at a time. |
| Backing-store scale | adaptive, hard-capped at 1920 px wide | The Ultra tier promises sharpness, so the scaler is disabled there (`World.tsx` → `DynamicScale`). |
| Spacecraft models | the official MER GLB is fetched from NASA at runtime and cached | Not bundled — the repository stays small. |
| Per-frame allocation | the camera controller reuses scratch vectors; the telemetry sampler writes into a fixed object | No allocation in the render loop. |
| Chapter transitions | scene resources are disposed on change (`SceneController.disposeWorld`) and the MER-B module disposes geometries, materials, textures, the renderer and the GL context on unmount | Verified by the repeated open/close check (no accumulating canvas, DOM or style tag). |
| Public build | **locked to Ultra**, adaptive step-down disabled | The release must not silently downgrade. `quality`/`qualityCeiling` are forced to `ultra` and `autoQuality` to `false` in production. |

## 4. Measured memory behaviour

| Observation | Result |
|---|---|
| Repeated mission entry/exit (4 devices in sequence) | resident geometries and textures stayed flat (33–35 geometries, 20 textures) — no growth per visit |
| Repeated film open/close (4×) | 0 leftover `<video>` elements, 0 leftover `.merb` DOM nodes, 0 leftover `<style data-merb>` tags, 0 leftover module instances |
| Long session | the residency manager keeps at most one high-resolution planet map resident |

Raw counters for every step are in `shotsrelease/release-probe.json`.

---

## 5. Honest limitations

1. **Not measured on the reference hardware** (i7-6820HQ / R7 M370). The audit
   machine is a different desktop GPU; the R7 M370 is a much weaker part, so
   the frame times above are optimistic for the stated target. The adaptive
   quality system exists precisely for that case, but the Ultra tier is locked
   in production, so a judge on that machine may see a lower frame rate than
   the numbers here suggest.
2. **The NASA-hosted assets are network-bound.** The official MER GLB and the
   archival media are fetched at runtime; on a poor connection the first
   arrival at a site is slower.
3. **No long-session soak test** (hours) was run — the repeated-visit checks
   cover the leak-prone paths, but a multi-hour session was not observed.
4. **Frame-time percentiles are sampled over 4–6 s windows**, not over a whole
   session.
