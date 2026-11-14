# ECHOES — AUDIT BASELINE

**Date:** 2026-11-13 · **Project root:** `D:\YASEZ_HOME\projects\NASA space apps\nasa-planetary-exploration-simulator`
**Stack:** React 19 + TypeScript + three.js r186 + Vite 7 (single-file build) + Tailwind 4 + Zustand + Playwright.

This is the state of ECHOES as found at the start of the release audit, recorded
before any release change was made. Everything below was read from the running
project (code + the live application in a browser), not from a description.

---

## 1. Project discovery

| Area | Finding |
|---|---|
| Root | single Vite/React app, `src/` + `public/`, no monorepo, no server |
| Rendering | three.js r186 through @react-three/fiber 9; one `<Canvas>` in `src/engine/World.tsx` |
| Frame model | `src/engine/frames/frames.ts` — three explicit layers (SCI / PRESENT / RENDER), never mixed silently |
| Celestial registry | `src/engine/solar-system/model.ts` — 12 bodies: sun, mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune, pluto |
| Spacecraft registry | `src/data/artifacts/` — **10 devices** (opportunity, spirit, sojourner, insight, apollo-12/14/15/16/17, voyager1) |
| Journey registry | `src/data/journeys/` — 10 mission journeys, 7–23 chapters each |
| Site environments | `src/engine/sites/SiteScene.tsx` — DEM-backed terrain (`src/engine/terrain/dem.ts`), rock fields, the artifact model, a mission route |
| Models | `src/engine/spacecraft/models.tsx` — official MER GLB for MER-A/MER-B, documented reconstructions for the rest; primitives baked per material slot for draw-call reduction |
| Textures | `src/assets/tex/*.jpg` (2K-ish equirect maps) + `public/tex-hi/*.ktx2` (earth/mars/moon/milkyway) |
| Camera | `src/engine/cameras/controller.ts` (single flight controller) + `src/engine/director.ts` (the sequencer) |
| Audio | `src/lib/audio.ts` — generated Web Audio ambience, no recordings |
| Docs | `docs/` (13 files) + `ECHOES_*` reports at the root |
| Tests | vitest, 17 files / 153 tests at baseline |
| Git | repository on `main`, **no remote configured**, history preserved (no destructive operations performed) |
| CI | **none** (no `.github/`) |
| README | **none** |
| Deployment | **none** (no config for any static host) |

---

## 2. Baseline behaviour (verified in the browser, not assumed)

| Scenario | Baseline result |
|---|---|
| Landing page | renders (`src/components/landing/Landing.tsx`), ENTER ECHOES / EXPLORE MISSIONS present, CTA works |
| Enter the simulation | solar system, scene=solar |
| Body selection | all 12 bodies focus correctly |
| Device travel | every device reaches its site (scene=site, world correct) |
| Mission journey | opens automatically on arrival, chapters render, chapter ruler works |
| Solar System return | works from every scene |
| Console errors | 0 in a full tour |
| Device-navigation regression | 13/13 browser checks pass (the earlier navigation-bug fix holds) |
| MER-B documentary | mounts and plays inside the journey (23/23 checks) |

---

## 3. What was working

- The three-layer coordinate discipline (SCI / PRESENT / RENDER) and the Keplerian
  orbital model with DE441 verification notes.
- The site environments: DEM-backed Martian and lunar terrain, the beacon, the
  mission route markers, the arrival choreography.
- The navigation-ticket system that fixed the "device transfer returns to the
  Solar System" bug (regression-covered, 19 tests).
- The MER-B cinematic journey module (`src/missions/merb`) — a complete
  documentary experience mounted inside ECHOES.
- The adaptive quality system and the Ultra rendering contract.

## 4. What was incomplete or wrong (found by this audit)

| # | Problem | Evidence | Severity |
|---|---|---|---|
| B1 | **Voyager 1's mission was recorded as ended.** `dates.end` was "today", so a live mission was labelled finished. | NASA: "crossed into interstellar space in August 2012 and continues to collect data" | HIGH — misinforms the public |
| B2 | **Apollo launch dates were derived, not real.** `launch: landing − 4 days` gave Apollo 12 = 15 Nov (actual 14 Nov), Apollo 14 = 1 Feb (actual 31 Jan), Apollo 16 = 17 Apr (actual 16 Apr). | NSSDCA / NASA mission pages | HIGH — wrong chronology |
| B3 | **InSight's end-of-mission date was 6 days late** (21 Dec 2022 vs NASA's 15 Dec 2022). | science.nasa.gov/mission/insight | MEDIUM |
| B4 | **A developer control was visible in the public UI**: the SYS panel linked to `#/dev`. | `src/components/chrome/Hud.tsx` | HIGH — Phase 5 violation |
| B5 | **The diagnostics panel was routable in production** (`#/dev` worked in the built app). | `src/App.tsx` | HIGH — Phase 5 violation |
| B6 | **No verified mission facts were surfaced anywhere.** Agency, launch vehicle, launch site, objective and verified status existed only in scattered prose. | registry inspection | MEDIUM — Phase 1 requirement |
| B7 | **`tsc --noEmit` failed** on the shipped tree (unused `hover` state in Landing.tsx). | `npx tsc --noEmit` | MEDIUM — CI would fail |
| B8 | **Nine of ten devices had no mission media, no mission path and no landmarks** in their journeys. | journey registry inspection | HIGH — the core quality complaint |
| B9 | **No README, no CI, no deployment configuration, no remote.** | repository inspection | HIGH — release requirement |
| B10 | **A 165 MB orphan video blob** remained in the git history from the abandoned "film as a video" approach (the working tree and the build are clean). | `git rev-list --objects --all` + object sizes | MEDIUM — repository weight |
| B11 | **Tracked development artefacts**: 9 screenshot directories and `test-results/` in the tree (gitignored, but present on disk). | `git status` / directory listing | LOW |

---

## 5. What is decorative, expensive or disconnected

| Item | Finding |
|---|---|
| `src/components/chrome/DevPanel.tsx` | real diagnostics, but development-only — must not ship in the public build |
| `#/dev` route | developer surface, publicly reachable at baseline |
| Quality selector | already correctly hidden in production (`import.meta.env.PROD`), but the *saved* quality preference could still downgrade a production session — **now locked** |
| `assets-hi/` | 4 KTX2 planet maps, streamed on demand — correct, but not bundled into the repo (gitignored by design) |
| Screenshot folders (`shots*/`) | gitignored working artefacts; excluded from the public package |

---

## 6. Baseline measurements (this machine — see PERFORMANCE_AUDIT.md)

| Metric | Baseline |
|---|---|
| Page load (dev server, cold) | recorded by the release probe (`shotsrelease/release-probe.json`) |
| Frame time p50 / p95 | recorded by the release probe |
| Draw calls / triangles | recorded by the release probe |
| Test suite | 17 files, 153 tests, all passing |
| `tsc --noEmit` | **fails** (B7) |
| Production build | succeeds (15.0 MB single file) |

---

## 7. Change-control rules applied

- No destructive Git operation was run (no reset, no force-push, no branch
  deletion, no history rewrite).
- Existing work was preserved: the MER-B documentary module, the navigation
  ticket system, the sun renderer, the journey data and every prior document
  remain in place.
- Risky configuration was backed up before change (the store's quality defaults
  and the DevPanel route were read before being edited).
- Changes were incremental and each one was re-verified in the browser.
