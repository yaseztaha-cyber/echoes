# ECHOES Ten-Device Completion Matrix

**Project:** `nasa-planetary-exploration-simulator`  
**Date:** 2026-11-13  
**Scope:** All 10 registered devices.  
**Legend:** PASS = verified with evidence; PARTIAL = implemented but gaps; FAIL = not implemented; LIMITED = blocked by data/asset constraints.  
**Rule:** No PASS without evidence. Evidence column cites files/tests/commands.

---

## Summary table

| Device | Journey chapters | Mission path | 3D env/landmarks | Vehicle model | Camera choreography | Side-based UI | Sync (chapter↔timeline↔vehicle↔camera) | Perf measured | Browser verified | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| opportunity | PASS (23) | PASS (10 wp) | PARTIAL (procedural terrain + rock scatter) | PASS (official MER + fallback) | PARTIAL (waypoint visit + orbit) | FAIL (centered 2D overlay) | PARTIAL (clock + camera wired) | FAIL (not measured) | PARTIAL (dev server only) | PARTIAL |
| spirit | PASS (11) | FAIL (0 wp) | PARTIAL (procedural terrain) | PASS (official MER + fallback) | FAIL (no waypoints → orbit only) | FAIL | FAIL (no path → no vehicle motion) | FAIL | FAIL | PARTIAL |
| sojourner | PASS (7) | FAIL (0 wp) | PARTIAL (procedural terrain) | LIMITED (reconstructed primitive) | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| insight | PASS (9) | FAIL (0 wp) | PARTIAL (procedural terrain) | LIMITED (reconstructed primitive) | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| apollo-12 | PASS (10) | FAIL (0 wp) | PARTIAL (terrain seed + hardware) | LIMITED (reconstructed) | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| apollo-14 | PASS (10) | FAIL (0 wp) | PARTIAL | LIMITED | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| apollo-15 | PASS (10) | FAIL (0 wp) | PARTIAL | LIMITED | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| apollo-16 | PASS (10) | FAIL (0 wp) | PARTIAL | LIMITED | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| apollo-17 | PASS (10) | FAIL (0 wp) | PARTIAL | LIMITED | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |
| voyager1 | PASS (7) | FAIL (0 wp) | FAIL (solar frame only) | LIMITED (reconstructed) | FAIL | FAIL | FAIL | FAIL | FAIL | PARTIAL |

**Overall project status: PARTIAL.** No device meets the full rebuild spec yet. Baseline navigation invariants and journey coverage are PASS.

---

## Per-device detail

### 1. opportunity
- **Journey:** `src/data/opportunity-journey.ts` — 23 chapters, 24 image URLs. PASS.
- **Path:** `missionPath` with 10 waypoints in `src/data/artifacts/opportunity.ts`. PASS.
- **Model:** MER official (NASA CDN) + primitive fallback. PASS (`src/engine/spacecraft/merOfficial.ts`).
- **Camera:** `transitionToJourneyChapter` → `visitWaypoint`/`cinematicOrbit` for post-landing chapters at own site. PARTIAL (no explicit mode selector; no user-grab suspension).
- **UI:** centered 2D overlay. FAIL (needs side-based redesign).
- **Sync:** clock configured per chapter; vehicle position via `artifactStateAt`. PARTIAL.
- **Perf/Browser:** not measured. FAIL/PARTIAL.
- **Evidence:** `src/data/journeys/coverage.test.ts` (154 tests pass); `src/engine/director.nav.test.ts`.

### 2. spirit
- **Journey:** `src/data/journeys/spirit.ts` — 11 chapters. PASS.
- **Path:** none. FAIL.
- **Model:** MER official + fallback. PASS.
- **Camera:** no waypoints → `cinematicOrbit` only. FAIL (no mission-specific choreography).
- **Evidence:** coverage test.

### 3. sojourner
- **Journey:** `src/data/journeys/sojourner.ts` — 7 chapters. PASS.
- **Path:** none. FAIL.
- **Model:** reconstructed primitive. LIMITED.
- **Evidence:** coverage test.

### 4. insight
- **Journey:** `src/data/journeys/insight.ts` — 9 chapters. PASS.
- **Path:** none. FAIL.
- **Model:** reconstructed primitive. LIMITED.
- **Evidence:** coverage test.

### 5–9. apollo-12, apollo-14, apollo-15, apollo-16, apollo-17
- **Journey:** `src/data/journeys/apollo.ts` — 10 chapters each. PASS.
- **Path:** none (no LRV traverse paths). FAIL.
- **Model:** reconstructed Apollo hardware (LM descent stage + ALSEP + instruments). LIMITED (documented as approximate).
- **Terrain:** seeds 3/14/15/16/17; procedural. PARTIAL.
- **Evidence:** coverage test; artifact definitions in `src/data/artifacts/apollo.ts`.

### 10. voyager1
- **Journey:** `src/data/journeys/voyager.ts` — 7 chapters. PASS.
- **Path:** none. FAIL.
- **Scene:** solar frame only (no dedicated deep-space visualization). FAIL.
- **Model:** reconstructed primitive. LIMITED.
- **Evidence:** coverage test.

---

## Cross-cutting (system-level)

| Requirement | Status | Evidence |
|---|---|---|
| All 10 devices have journey entries | PASS | `src/data/journeys/coverage.test.ts` (154 tests pass) |
| Journey count matches device count | PASS | coverage test |
| Every journey ≥3 chapters | PASS | coverage test |
| Every chapter has required fields | PASS | coverage test |
| Every journey has sources | PASS | coverage test |
| Navigation: same-planet transfer stays on world | PASS | `src/engine/director.nav.test.ts` |
| Navigation: cross-planet transfer ends on target | PASS | director.nav.test.ts |
| Navigation: site exit → parent planet (not solar) | PASS | director.nav.test.ts |
| Navigation: stale async cannot overwrite | PASS | director.nav.test.ts |
| Navigation: historical chapters never move user | PASS | director.nav.test.ts |
| Navigation: chapter at site never returns to solar | PASS | director.nav.test.ts |
| Production build succeeds | PASS | `npm run build` (Vite 7.3.2, 756 modules) |
| TypeScript 0 errors | PASS | build |
| Side-based documentary UI (left/right panels) | FAIL | `src/components/mission/MissionJourney.tsx` is centered 2D overlay |
| Cinematic/Follow/Free/Overview mode selector | PARTIAL | MissionJourney.tsx top bar selector (2026-11-13) |
| User control during playback + handoff | FAIL | no grab-detection in `CameraRig.tsx` |
| Cinematic easing/accel-decel/pauses in pathing | FAIL | `src/engine/missions/pathing.ts` linear + wobble |
| Mission-type-specific movement pacing | FAIL | not implemented |
| Premium chapter transitions | FAIL | CSS transitions only (opacity) |
| Per-chapter camera choreography (all devices) | FAIL/PARTIAL | only Opportunity has waypoints |
| Deep-space scene (Voyager) | FAIL | solar frame only |
| Performance measurement (FPS/frame-time/draw calls/triangles/texture memory/load time/memory) on target HW | FAIL | not collected |
| Real-browser per-device screenshots/recordings | FAIL/PARTIAL | dev server claimed; no artifacts in repo |
| Media wired into all journeys | FAIL/PARTIAL | catalog exists, not wired |
| Authentic landmarks per mission | FAIL/PARTIAL | procedural terrain only |

---

## Baseline verification (this session)

- `npx vitest run` → 154/154 passed (27 files).
- `npm run build` → succeeds (dist/index.html ~15.16 MB, gzip ~10.09 MB).
- `tsc` (via build) → 0 errors.

## Known blockers

1. **Headless browser hang:** `travelToBody` animation loop reportedly hangs Playwright; must re-validate before relying on automated browser evidence.
2. **Data/asset gaps:** 9/10 devices lack mission paths; 9/10 lack rich media wiring; most models reconstructed. Any additions must be sourced or labeled reconstructed/approximate.
3. **Bundle size:** ~10 MB gzip; code-splitting needed before performance claims on target low-end GPU.

## Next required evidence to flip FAIL→PASS

- Per-device mission path data (documented or labeled reconstructed) + tests.
- Side-based UI redesign merged + visual verification.
- Camera mode selector + handoff implemented + tests.
- Pathing easing + mission-type pacing + tests.
- Real-browser screenshots/recordings for all 10 journeys.
- Hardware perf measurements (FPS, frame time, draw calls, triangles, texture memory, load time, memory) on i7-6820HQ/16GB/R7 M370.
