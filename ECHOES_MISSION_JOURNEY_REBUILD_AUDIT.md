# ECHOES Mission Journey Rebuild — Audit

**Project:** `nasa-planetary-exploration-simulator`  
**Date:** 2026-11-13  
**Scope:** All 10 registered devices.  
**Status:** Audit complete; rebuild implementation in progress (see `ECHOES_TEN_DEVICE_COMPLETION_MATRIX.md`).

---

## 1. Registered devices (authoritative, 10)

Source: `src/data/artifacts/index.ts`, `src/data/journeys/index.ts`.

| # | Device ID | Name | Destination | Type | Model kind / accuracy | Region |
|---|---|---|---|---|---|---|
| 1 | opportunity | OPPORTUNITY | mars | rover | `mer` / OFFICIAL (NASA CDN + primitive fallback) | MERIDIANI PLANUM |
| 2 | spirit | SPIRIT | mars | rover | `mer` / OFFICIAL | GUSEV CRATER |
| 3 | sojourner | SOJOURNER | mars | rover | `sojourner` / RECONSTRUCTED | ARES VALLIS |
| 4 | insight | INSIGHT | mars | lander | `insight` / RECONSTRUCTED | ELYSIUM PLANITIA |
| 5 | apollo-12 | APOLLO 12 | moon | equipment | `apollo` / RECONSTRUCTED | OCEANUS PROCELLARUM |
| 6 | apollo-14 | APOLLO 14 | moon | equipment | `apollo` / RECONSTRUCTED | FRA MAURO HIGHLANDS |
| 7 | apollo-15 | APOLLO 15 | moon | equipment | `apollo` / RECONSTRUCTED | HADLEY–APENNINE |
| 8 | apollo-16 | APOLLO 16 | moon | equipment | `apollo` / RECONSTRUCTED | DESCARTES HIGHLANDS |
| 9 | apollo-17 | APOLLO 17 | moon | equipment | `apollo` / RECONSTRUCTED | TAURUS–LITTROW VALLEY |
| 10 | voyager1 | VOYAGER 1 | deep-space | probe | `voyager` / RECONSTRUCTED | BEYOND THE HELIOPAUSE |

No duplicate IDs. Spirit & Opportunity share MER mission; Apollo 12/14/15/16/17 share the Apollo program (individual missionIds).

---

## 2. Journey data inventory

| Device | Chapters | Mission path waypoints | Media URLs in journey | Historical sources |
|---|---|---|---|---|
| opportunity | 23 | 10 | 0 (media catalog separate) | nasa-mer, nasa-opp-end, squyres2004, klingelhofer2004, rieder2004, grotzinger2005, squyres2012, arvidson2014 |
| spirit | 11 | 0 | 0 | nasa-mer, squyres2008 |
| sojourner | 7 | 0 | 0 | nasa-mpf |
| insight | 9 | 0 | 0 | nasa-insight, stahler2021 |
| apollo-12 | 10 | 0 | 0 | nasa-apollo, alsj, nssdc-alsep |
| apollo-14 | 10 | 0 | 0 | nasa-apollo, alsj, nssdc-alsep |
| apollo-15 | 10 | 0 | 0 | nasa-apollo, alsj, nssdc-alsep, langseth1976 |
| apollo-16 | 10 | 0 | 0 | nasa-apollo, alsj, nssdc-alsep |
| apollo-17 | 10 | 0 | 0 | nasa-apollo, alsj, nssdc-alsep, langseth1976 |
| voyager1 | 7 | 0 | 0 | nasa-voyager, stone2013, gurnett2013 |

Opportunity journey source: `src/data/opportunity-journey.ts` (23 chapters, 24 image URLs, 10 missionPath waypoints).  
All other journeys: `src/data/journeys/{spirit,sojourner,insight,apollo,voyager}.ts`.  
Media catalog: `src/data/media/index.ts` (per-device historical media exists there, not wired into most journeys).  
Journey types: `src/data/journeys/types.ts`.

---

## 3. Current implementation vs. rebuild spec

### 3.1 3D primary experience / mission-specific paths
- **Current:** Only `opportunity` has a `missionPath` (10 waypoints). All other 9 devices have no path; `SiteScene` renders terrain + rock scatter + vehicle; route renders only when `replayActive`. `ArtifactModel` renders vehicles (MER official model for Opportunity/Spirit with primitive fallback; reconstructed for others).
- **Gap:** No mission-specific trajectories for 9/10 devices. No cinematic easing/accel-decel/pauses in `src/engine/missions/pathing.ts` (linear interpolation with lateral wobble only). Deep-space (Voyager) has no dedicated scene handling beyond solar frame.

### 3.2 Dynamic camera system
- **Current:** `CameraRig.tsx` + `controller.ts` support modes `orbit/free/follow/surface/inspect/cinematic/overview`. `transitionToJourneyChapter` (director) drives per-chapter camera for Opportunity's own post-landing chapters (waypoint visit / cinematic orbit). User control exists via OrbitControls in orbit/free/surface modes.
- **Gap:** No explicit Cinematic/Follow/Free Explore/Overview **UI controls** wired as a mode selector in the journey overlay. No user-interaction suspension during auto-flights (a grab during a flight is not detected/handled). Per-chapter choreography only meaningful for Opportunity (others have no waypoints). Overview mode behavior and smooth handoff need verification/rebuild.

### 3.3 Side-based documentary presentation
- **Current:** `MissionJourney.tsx` (429 lines) is a 2D overlay: translucent 40% backdrop, top bar, centered max-w-7xl content using a 60/40 grid (intro) and 60/40 grid (stage). Bottom slim timeline/controls. `backdrop-blur-sm` (glassmorphism-ish) used.
- **Gap vs. spec:** Not side-based left/right panels; not chapter-adaptive composition (left vs right). Glassmorphism (`backdrop-blur`) present. 3D world is visible but the layout is centered, not side-dominant. No premium transitions between chapters.

### 3.4 Synchronization (chapter ↔ timeline ↔ vehicle ↔ camera ↔ story)
- **Current:** `MissionJourney` configures the historical clock on chapter change (`configureClock` historical, rate 0). Camera choreography fires on explicit chapter navigation (guarded by `firedChapter` ref). Vehicle position derived from `artifactStateAt(path, t)`.
- **Gap:** For devices without paths, vehicle does not move with timeline. Chapter↔media wiring inconsistent (Opportunity has images; others rely on media catalog not yet wired). Story panels (scientific/engineering significance) exist and are populated.

### 3.5 Navigation safety invariants
- **Current (verified by tests):** 154/154 tests pass including `director.nav.test.ts` (device transfers stay on device's world; stale async cannot overwrite; chapter policy documentary-only; site exit returns to parent planet). `descendToSite` auto-opens `mission-journey` overlay (documented, intentional for encounter). `transitionToJourneyChapter` early-returns for historical chapters and for off-device contexts.
- **Remaining risk:** `descendToSite` still calls `set({ overlay: "mission-journey", menuOpen: false })` — this is the documented "encounter" auto-open. If the user reports "continue the presentation gets me off", the likely cause is a chapter click on a post-landing chapter at the device's own site, which calls `visitWaypoint`/`cinematicOrbit`; for Opportunity these move the camera inside the site (not off-world) but the camera motion can feel like leaving. For other devices (no waypoints) it calls `cinematicOrbit`. No `returnToSolarSystem` is invoked (locked by tests). Needs real-browser confirmation.

### 3.6 Performance
- **Current:** Quality tiers exist (boot screen, DPR supersampling, recovery band). Mer-B film targets 30 FPS with adaptive quality. No measured FPS/frame-time/draw-call/texture-memory data captured for the journey experience on target hardware (i7-6820HQ / 16 GB / R7 M370).
- **Gap:** No honest measurements collected. Bundle is large (~15.16 MB raw, ~10.09 MB gzip) — load-time concern on low-end hardware.

### 3.7 Real browser verification
- **Current:** Prior docs claim navigation flows verified in dev server, but no persistent screenshot/recording evidence in repo. Headless Playwright reportedly hung on `travelToBody` animation loop (needs re-validation). 154 unit tests pass; production build succeeds.
- **Gap:** No per-device journey screenshots/recordings captured. No hardware performance measurements.

---

## 4. Baseline verification (this session)

- `npx vitest run` → **154/154 tests passed** (27 test files).
- `npm run build` → **succeeds** (Vite 7.3.2, 756 modules; `dist/index.html` ~15.16 MB, gzip ~10.09 MB).
- TypeScript: 0 errors reported by build.

---

## 5. Data/asset limitations (honest)

- Only Opportunity has an official 3D model (NASA CDN) + primitive fallback. All other devices use reconstructed primitive models.
- Mission paths exist only for Opportunity. Other devices have chapter timelines but no spatial trajectory; vehicle motion cannot be synchronized to the timeline.
- Rich per-chapter media exists primarily for Opportunity (24 image URLs). Other journeys' `media` arrays are mostly empty; a media catalog exists (`src/data/media/index.ts`) but is not wired into most journeys.
- Some 3D environments are procedural (terrain scatter, sky dome) rather than mission-authentic landmarks. Apollo sites have terrain seeds but limited documented feature placement.
- Voyager has no dedicated deep-space scene; it lives in the solar frame.

All reconstructed/approximate/representative data must be labeled as such in the UI and docs. No fabricated historical events, coordinates, media, or models should be presented as verified.

---

## 6. Existing documentation (related)

- `ECHOES_DEVICE_NAVIGATION_ROOT_CAUSE_AND_FIX.md` — prior navigation root cause (MissionJourney auto-trigger) and fixes.
- `ECHOES_DEVICE_NAVIGATION_FINAL_VERIFICATION.md` — prior verification claims.
- `ECHOES_MERB_MISSION_FILM_INTEGRATION.md` — MER-B film integration.
- `docs/ECHOES_*` — experience, scene, visual, audio, navigation notes.
- `docs/MISSION_JOURNEY_DEVICE_INVENTORY.md`, `docs/MISSION_JOURNEY_COVERAGE_REPORT.md`, `docs/MISSION_JOURNEY_EXPANSION_REPORT.md` — coverage reports.

---

## 7. Rebuild implementation plan (prioritized)

1. **Navigation safety (done + verify):** keep nav-ticket/stale guards; keep historical-chapter early return; add regression tests for `descendToSite` auto-open not changing scene. Verify in real browser.
2. **Mission paths (high impact):** add documented/approximate waypoint paths for the remaining 9 devices, derived from published traverse maps where available (Opportunity, Spirit, Apollo LRV tracks, Sojourner, InSight placement, Voyager trajectory). Label reconstructed where not surveyed. Wire into `artifact.missionPath`.
3. **Pathing easing:** replace linear interpolation with smoothstep + accel/decel + pause holds; add mission-type pacing (rover slow traverse, lander static, orbiter/flyby fast, crewed EVA pace).
4. **Camera:** add explicit mode selector (Cinematic/Follow/Free Explore/Overview) in journey UI; implement user-grab suspension during auto-flights; per-chapter choreography for all devices with paths; Overview mode frames the whole site.
5. **Side-based UI:** redesign `MissionJourney.tsx` to left/right translucent side panels (~45% width), chapter-adaptive side selection, bottom timeline/controls, premium transitions, remove glassmorphism.
6. **Synchronization:** wire media catalog into journeys; drive vehicle position from timeline for all devices with paths; align chapter ↔ camera ↔ panel content.
7. **Deep space:** dedicated Voyager scene context (solar frame + trajectory visualization).
8. **Performance:** implement quality scaling + measure honestly on target hardware; reduce bundle (code-split Mer-B film, lazy-load media).
9. **Verification:** real-browser per-device screenshots/recordings; hardware perf measurements; update matrix with evidence.

---

## 8. Known risks / open questions

- Headless Playwright may hang on `travelToBody` (reported previously); must validate in current state before relying on automated browser evidence.
- Fabrication risk: any path/media/landmark added must be sourced or clearly labeled reconstructed/approximate. Do not present reconstructed data as verified.
- Bundle size (~10 MB gzip) is a load-time risk on the target low-end GPU; code-splitting recommended before performance claims.
- MER official model fetch depends on NASA CDN availability; primitive fallback must remain functional.
