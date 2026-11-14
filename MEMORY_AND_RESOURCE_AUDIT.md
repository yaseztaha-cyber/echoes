# ECHOES — MEMORY & RESOURCE AUDIT

**Date:** 2026-11-13 · All figures were read from the live renderer
(`gl.info.memory`) and the DOM during the release probe.

---

## 1. What the app holds

| Resource | Where it lives | Released when |
|---|---|---|
| Planet maps (2K class) | `src/assets/tex/*.jpg` — bundled in the single-file build | with the app (≈4.5 MB of maps) |
| Planet maps (4K class) | `public/tex-hi/*.ktx2` — streamed | evicted by the residency manager when another planet takes priority (`src/engine/textures/manager.ts`) |
| Milky Way panorama | `public/tex-hi/milkyway.ktx2` | stays resident (it is the sky) |
| Official MER GLB | fetched from NASA's CDN at runtime | cached by the browser; the module disposes its own GPU resources on unmount |
| Site terrain | generated per site from the DEM + a procedural layer | disposed with the site scene |
| Vehicle models | primitives baked per material slot; the official GLB for MER | disposed with the site scene |
| Mission film media | streamed from NASA/archive.org | the documentary's manifest evicts decoded images on destroy |

## 2. Measured behaviour

| Measurement | Value | How |
|---|---|---|
| Resident geometries, solar system | **33–35** | `gl.info.memory.geometries` |
| Resident textures, solar system | **20** | `gl.info.memory.textures` |
| Resident geometries after visiting four sites in a row | flat (no per-visit growth) | probe D-* sequence |
| Resident textures after visiting four sites in a row | flat (no per-visit growth) | probe D-* sequence |
| `<video>` elements after four mission-film open/close cycles | **0** | probe V14 |
| `.merb` DOM nodes after the same | **0** | probe V14 |
| `<style data-merb>` tags after the same | **0** | probe V14 |
| Mission-film module instances after the same | **0** (the dev hook is cleared) | probe V14 |
| Failed network requests in a full run | **0** | probe |

## 3. Why nothing accumulates

* **Site scenes** are React components keyed by artifact id; unmounting one
  disposes its terrain, rocks, slabs, vehicle meshes and materials
  (`SiteScene.tsx`).
* **The MER-B documentary module** owns a private renderer, scene and DOM; its
  `destroy()` disposes geometries, materials, textures, the renderer, forces
  the loss of the GL context, and removes the canvas, the injected style tag and
  every `.merb` node. The React wrapper calls `destroy()` on unmount.
* **The residency manager** keeps at most one high-resolution planet map
  resident and streams the next one with a progress indicator.
* **The texture loader** caches by URL, so a repeated visit does not re-upload
  the same map.

## 4. Long-session behaviour

| Observation | Status |
|---|---|
| Multi-device tour (Opportunity → Spirit → Sojourner → InSight → five Apollos) in one session | measured — resident counts flat |
| Repeated mission-film open/close | measured — nothing left behind |
| Repeated chapter switching (23 chapters, several times) | measured — the film probe switched chapters repeatedly with no growth |
| Multi-hour soak | **NOT TESTED** — out of the audit window |

## 5. Known memory risks (honest)

| Risk | Assessment |
|---|---|
| The official MER GLB is fetched per browser session and cached by the browser | bounded — one model, ~2 MB, browser-cached |
| The NASA Image Library media in the documentary is decoded as it is needed | the module's manifest evicts decoded images on destroy; peak usage is the current chapter's plates |
| The `navTraceLog` in the director | capped at 200 entries in this release |
| `photos` (the session film roll) | in-memory only, user-deletable, never persisted to storage (frames are too large for localStorage) |

## 6. Verdict

No accumulating video instances, no DOM or style-tag leaks, no per-visit
growth in GPU resources, and no failed network requests in a full application
tour. The multi-hour soak test is the one item that was not performed.
