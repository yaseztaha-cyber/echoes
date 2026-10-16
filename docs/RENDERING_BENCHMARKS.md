# RENDERING BENCHMARKS — ECHOES Phase 4

Honesty header: this environment has **no GPU-enabled browser**, so frame-time,
FPS-distribution and screenshot rows are procedures + static budgets, not measured
results. Anything marked ESTIMATE is labelled as such. In-browser validation on a
defined machine is still required before any 60 FPS claim.

## 1. Static budgets (measured headless, Phase 4 commit)

| Metric | Pre-Phase 4 | Phase 4 | Notes |
|---|---|---|---|
| Production bundle (dist/index.html) | 9,267,579 B | — (record on build) | single-file; hi-res excluded by design |
| Bundled globe textures (base64 ≈ ×1.37) | ~2.9 MB baked | unchanged | 2K JPEGs stay resident as fallbacks |
| Runtime hi-res (public/tex-hi, NOT bundled) | — | earth 1.69 + moon 2.02 + mars 2.72 + pluto 1.41 MB | fetched on demand at stage C, high/ultra only |
| Residency cap | — | 96 MiB (~2× 4K RGBA mip chains) | LRU; pinned fallbacks never evicted |
| Render loops | 1 (R3F) | 1 (no new loops) | stage eval ~2 Hz per body, no setState storms |
| Draw calls (construction) | +0 | +0 | texture swap reuses mesh/material |

Decoded-memory math (ESTIMATE method, not GPU measurement): 4096×2048 RGBA =
32 MiB, +mipmaps ≈ 43 MiB per hi-res globe. Two resident ≈ 86 MiB ≤ 96 MiB cap.

## 2. Repeatable camera paths (run in a GPU browser, all presets)

1. Idle solar overview 10 s (record FPS avg + p95 frame time).
2. Rapid camera rotation 360° (stutter check during hi-res hold).
3. Earth approach → close orbit (stage A→B→C transitions, texture pop check).
4. Mars approach → close orbit (same; marker alignment check).
5. Jupiter/Saturn approach (representative maps: band continuity, ring response).
6. Rapid Earth→Mars→Earth travel (prefetch + cancel behavior, no blank globes).
7. Rover inspection + instrument close-up (site scene unaffected — confirm).
8. 5-minute soak: FPS distribution, heap trend, residency evictions in DevPanel.

Record: browser + GPU + resolution + preset + FPS avg/p95 + draw calls +
triangles + TEX RESIDENT/PENDING + TEX GPU EST (all visible in `#/dev`).

## 3. Target frame budget

16.67 ms (60 FPS). Auto stepper: downgrade after ~3 s of p95 ≥ 20 ms, recover
after ~20 s of p95 ≤ 9 ms toward the user's ceiling, 5 s cooldown. Visibility
(bodies, markers, travel range) is identical across tiers by construction.

## 4. Results log

| Date | Machine/Browser/GPU | Preset | Path | FPS avg | p95 | Notes |
|---|---|---|---|---|---|---|
| 2026-10-15 | Win, Intel HD 530 (ANGLE/D3D11), Playwright Chromium, DPR 1.25 | high (auto) | solar overview, 180f | 60.4 | 16.8 ms | p99 18.5 ms; 0 app errors |
| 2026-10-15 | same | high (auto) | Mars close orbit, 240f | 60.1 | 17.0 ms | p99 19.7 ms; MDIM globe, markers, minimap |
| 2026-10-15 | same | high (auto) | Opportunity site, 240f | 60.2 | 16.8 ms | p99 17.6 ms; terrain + rover + timeline |
| 2026-10-15 | same | high (auto) | Opportunity site rebuilt (rocks, official rover, new wash), console + screenshots | — | — | 0 app errors across full journey; inspect close-up verified |
| — | pending discrete-GPU + rapid-travel/soak paths | — | travel, switching, soak | — | — | §2 paths 6–8 unmeasured |

Console (all runs): 0 application errors. 1 benign upstream warning
(THREE.Clock deprecation, drei/R3F internals) + favicon 404 (fixed Phase 4.1).
MAX_TEXTURE_SIZE 16384 on the test GPU — 4K hi-res safe, 8K would also fit.
