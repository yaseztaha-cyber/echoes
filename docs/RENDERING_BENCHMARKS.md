# RENDERING BENCHMARKS — ECHOES Phase 4

Honesty header: measured rows come from a real browser (headless ANGLE/D3D11 on
**Intel HD 530**, Playwright Chromium/Edge) — an integrated GPU, so numbers are
conservative for discrete-GPU machines but not universal. Anything marked
ESTIMATE is labelled as such. Discrete-GPU + soak rows remain pending.

## 1. Static budgets (measured headless, Phase 4 commit)

| Metric | Pre-Phase 4 | Phase 4 | Notes |
|---|---|---|---|
| Production bundle (dist/index.html) | 9,267,579 B | record per build (see commit log) | single-file; hi-res excluded by design |
| Bundled globe textures (base64 ≈ ×1.37) | ~2.9 MB baked | unchanged | 2K JPEGs stay resident as fallbacks |
| Runtime hi-res (public/tex-hi) | 4 files, 7.84 MB | **REMOVED (spec §2)** | 2048×1024 is the terminal global-map tier; `HI_URLS` = {} |
| Star catalogue (src/data/stars/starCatalog.ts) | — | +110 KB source (5,070 naked-eye stars, HYG v4.4 excerpt) | typed-array base64; 1 draw call; spec §18 |
| Residency cap | — | 96 MiB (~2× 4K RGBA mip chains) | LRU; pinned fallbacks never evicted |
| Render loops | 1 (R3F) | 1 (no new loops) | stage eval ~2 Hz per body, no setState storms |
| Draw calls (construction) | +0 | +0 | texture swap reuses mesh/material |
| Site-scene draw calls (settled Apollo 12) | 258 in flight / 389 tile-mesh objects (scene dump) | **12** | terrain = 1 merged mesh (live draw set, pooled rebuild); artifact ≈ 6 baked material meshes; slabs 2; rocks 1 instanced; stars 1; route line 1 |

Decoded-memory math (ESTIMATE method, not GPU measurement): 4096×2048 RGBA =
32 MiB, +mipmaps ≈ 43 MiB per hi-res globe. Two resident ≈ 86 MiB ≤ 96 MiB cap.

## 2. Repeatable camera paths (run in a GPU browser, all presets)

1. Idle solar overview 10 s (record FPS avg + p95 frame time).
2. Rapid camera rotation 360° (stutter check during streaming; hi-res hold removed — stage C no longer fetches).
3. Earth approach → close orbit (stage A→B→C transitions, texture pop check).
4. Mars approach → close orbit (same; marker alignment check).
5. Jupiter/Saturn approach (representative maps: band continuity, ring response).
6. Rapid Earth→Mars→Earth travel (prefetch + cancel behavior, no blank globes).
7. Rover inspection + instrument close-up (site scene unaffected — confirm).
8. 5-minute soak: FPS distribution, heap trend, residency evictions in DevPanel.

Record: browser + GPU + resolution + preset + FPS avg/p95 + draw calls +
triangles + TEX RESIDENT/PENDING + TEX GPU EST (all visible in `#/dev`).

## 3. Target frame budget

16.67 ms (60 FPS), enforced two ways:
- Per-preset DPR ceiling (unchanged). Visibility (bodies, markers, travel range)
  is identical across tiers by construction.
- **Dynamic render scale (spec §5, shipped):** bounded backing-store scale in
  [0.45, 1.0] applied as `gl.setPixelRatio(base × scale)`. Stair down 0.1 after
  1.2 s of frame-p95 > 24 ms; recover 0.06 per 1.0 s after 4 s of p95 < 14 ms;
  1.0 s cooldown; quality-tier switch resets the stepper. Exposed in `#/dev`
  as RENDER SCALE. Sharpness may drop on bandwidth-bound scenes; visibility
  never changes.
- Measured on-site (1600×1000, DPR 1, Intel HD 530): site scene at scale 1.0 =
  2 FPS / p95 483 ms; DRS settles at scale 0.60 → 54 FPS / p95 17.5 ms. Same
  scene, same state (ablation): pixelRatio 0.4 → 30–35 FPS / p95 34–50 ms —
  cost is super-linear in fragments (texture-bandwidth-bound, not draw calls).

## 4. Results log

| Date | Machine/Browser/GPU | Preset | Path | FPS avg | p95 | Notes |
|---|---|---|---|---|---|---|
| 2026-10-15 | Win, Intel HD 530 (ANGLE/D3D11), Playwright Chromium, DPR 1.25 | high (auto) | solar overview, 180f | 60.4 | 16.8 ms | p99 18.5 ms; 0 app errors |
| 2026-10-15 | same | high (auto) | Mars close orbit, 240f | 60.1 | 17.0 ms | p99 19.7 ms; MDIM globe, markers, minimap |
| 2026-10-15 | same | high (auto) | Opportunity site, 240f | 60.2 | 16.8 ms | p99 17.6 ms; terrain + rover + timeline |
| 2026-10-15 | same | high (auto) | Opportunity site rebuilt (rocks, official rover, new wash), console + screenshots | — | — | 0 app errors across full journey; inspect close-up verified |
| 2026-10-17 | same, Edge headless (playwright-core), DPR 1.0, 1600×1000 | AUTO | solar overview → entered sim, 7 s each | 60.1 / 57.7 | 16.8 | full-journey harness; 0 app/page errors |
| 2026-10-17 | same | AUTO | moon planet scene (1440×900), 7 s | 54.8 | 33.3 ms | p99 50 ms; streaming spikes; DRS correctly stays at scale 1.0 — unchanged vs pre-DRS |
| 2026-10-17 | same | AUTO | Apollo 12 surface (1440×900) after 45 s approach — post-DRS | 60.0 | 16.8 ms | same view pre-DRS ≈ 2–3 FPS; DRS settles above floor |
| 2026-10-17 | same, 1600×1000 | AUTO | site DevPanel mid-descent, DRS live | 54.0 | 17.5 ms | RENDER SCALE 60 %; 289 draws; 515k tris; tiles 76/171; scale 1.0 was 2 FPS / p95 ≤ 483 ms |
| 2026-10-17 | same, Intel HD 530 | AUTO | Apollo 12 surface after draw-call refactor (scene dump + DevPanel) | 60.0 | 16.8 ms | **12 draw calls** (was 258); 185,650 tris; tiles 76/171, LOD 7; full journey re-verified: planet scene 52.2 fps unchanged, 0 errors |
| 2026-10-17 | same, 1440×900 | AUTO | Earth close orbit — cloud alphaMap + VIIRS night-layers active | 60.1 | 16.8 ms | first earth planet-scene run (was gated out); 0 errors; §2 path 3 measured |
| — | pending discrete-GPU + rapid-travel/soak paths | — | travel, switching, soak | — | — | §2 paths 6–8 unmeasured |

Console (all runs): 0 application errors. 1 benign upstream warning
(THREE.Clock deprecation, drei/R3F internals) + favicon 404 (fixed Phase 4.1).
MAX_TEXTURE_SIZE 16384 on the test GPU — 4K hi-res safe, 8K would also fit.
