# ECHOES — MER-B MISSION FILM INTEGRATION

**Date:** 2026-11-13 · **App under test:** `http://localhost:5174/` (Vite dev server, real browser: Edge/Chromium via Playwright, 1920×1080)

---

## 1. The asset: what was delivered, and what it actually is

### 1.1 The search

The task asked for *the user's already-created Opportunity documentary video*. It
was looked for in:

| Location | Method | Result |
|---|---|---|
| `nasa-planetary-exploration-simulator/` (whole tree, recursive) | extension + name scan | only `mars-rover-cinematic-prototype (1).zip` (357 KB, added 2026-11-13 03:54, contents dated 2026-11-10 23:55) |
| `D:\YASEZ_HOME\projects` (whole tree) | extension + name scan | no video; `New folder` (empty), `eydo ai`, `workspace-019f7d50…` are unrelated projects |
| `C:\Users\DELL\{Downloads,Desktop,Documents,Videos}` (recursive) | extension + name scan + "modified in the last 45 days" filter | only unrelated screen recordings / clips / course zips |
| **every** `.zip` in `C:\Users\DELL\Downloads` (~130 archives) | archive entry listing (video extensions) | the only archives with video are `clips.zip`, `clips (1).zip`, `videos-2025…zip`, `Openclip-main.zip` — all unrelated |
| `D:\YASEZ_HOME` roots (`autoclip`, `clipping`, `clips material`, …) | directory listing | unrelated clip tooling, no MER-B film |
| the prototype's own documentation | read `README.md`, `VERIFICATION.md`, `docs/INTEGRATION.md` | names a recording `MERB_JOURNEY_STANDALONE/verification/video/verification-run-software-gl.webm` — not in the zip, not on the machine |

**Finding: the delivered archive contains no video file — and that is correct,
because the documentary was never a video. It is *code*.**

`MERB_JOURNEY_STANDALONE` is the finished MER-B (Opportunity) documentary as a
self-contained TypeScript + Three.js experience: 18 chapters / 514 s, procedural
Mars/launch/space worlds, a reconstructed rover with deterministic animation
scripts, data-driven camera shots, the archival media manifest (55 NASA/JPL
records), a DOM documentary interface (chapter ruler, scrub, inspect drawer,
free orbit) and a strict audio policy. Its own `docs/INTEGRATION.md` prescribes
exactly how to mount it inside a host app:

```ts
const journey = mountOpportunityJourney(containerEl, { mode: 'cinematic', … });
```

### 1.2 How it is integrated — as code, not as a file

The module was taken into the ECHOES repository unchanged and mounted inside
ECHOES's mission journey interface:

* `src/missions/merb/` — the documentary's 22 source files (219 KB), imported by
  ECHOES like any other module. It depends only on `three`, which ECHOES
  already ships (one copy, no aliasing needed).
* `src/components/mission/MerBMissionFilm.tsx` — a thin React wrapper that
  mounts the module into a container, maps ECHOES' quality tier onto the
  documentary's own render tier, mutes ECHOES' ambient bed while it plays, and
  **destroys the module completely on unmount**.

The film's isolation (the module's own guarantee, kept intact):
its own `WebGLRenderer` and `THREE.Scene` inside the container, CSS namespaced
under `.merb`, keyboard handlers on the container, and full disposal of
geometries, materials, textures, the renderer and the GL context on destroy.

**No video file ships with ECHOES.** An earlier iteration of this work rendered
the documentary to a 165 MB WebM and played it back; that was the wrong shape
for the asset and it has been removed again (the file, the player component and
the render script are all deleted — see §3).

---

## 2. What the film is

| Property | Value |
|---|---|
| Form | **live code** — the MER-B cinematic journey module (`src/missions/merb`) |
| Chapters | 18 (`concept` … `conclusion`), 514 s of authored runtime |
| Worlds | procedural Mars surface (Eagle, Endurance, Purgatory, Victoria, Endeavour, Cape York, Marathon, Perseverance Valley), launch complex, interplanetary space |
| Camera | data-driven shots (world / rover / rover-pos / orbit) + free orbit/zoom |
| Media | 55 archival NASA/JPL records (photographs, orbital images, maps, the EDL animation, feature footage) streamed with per-item status; a failed plate is skipped, never shown empty |
| Audio | archival only — the NASA/JPL launch tracker tape (MER-2003-1020). No music, no synthesised sound; the Mars and space scenes are silent because Opportunity carried no microphone. The documentary states this on screen. |
| Render tier | ECHOES `low/medium/high` → documentary `low/medium/high`, with the module's own adaptive step-down and GPU-string detection |
| Provenance | Every scene carries its own line ("3D SCENES ARE RECONSTRUCTIONS AND ARE LABELLED AS SUCH…", "PROCEDURAL 3D RECONSTRUCTION. TERRAIN, ROVER POSE AND CAMERA ARE ILLUSTRATIVE, NOT TELEMETRY.") |

---

## 3. Files added or modified

### Added

| File | Purpose |
|---|---|
| `src/missions/merb/**` | the MER-B cinematic journey module — the documentary itself (22 files, 219 KB) |
| `src/components/mission/MerBMissionFilm.tsx` | React wrapper: mounts the module, maps the quality tier, mutes the ambient bed, destroys it on unmount |
| `src/components/mission/MissionFilmIcons.tsx` | the play/pause glyphs (SVG, not emoji) |
| `src/data/missionFilms.ts` | **the mission-film registry** (device id, title, subtitle, kind, duration, credit, status) + `filmForDevice()` / `devicesWithFilm()` |
| `src/data/missionFilms.test.ts` | 7 registry regression tests (MER-B only, no other device, the module ships with the app, provenance present) |
| `scripts/probe-film.mjs` | the browser verification probe (23 checks) |
| `ECHOES_MERB_MISSION_FILM_INTEGRATION.md` | this report |

### Modified

| File | Change |
|---|---|
| `src/state/store.ts` | new `filmDeviceId` state + `openMissionFilm()` / `closeMissionFilm()` — they touch **only** the overlay and the film id |
| `src/components/mission/MissionJourney.tsx` | the film is mounted **inside the mission journey interface**; `WATCH MISSION FILM` in the journey intro panel and in the top bar; the chapter ruler is hidden while the film is open (it drives camera choreography and must not compete with the film's transport) |
| `src/components/planet/ContextPanels.tsx` | `WATCH MISSION FILM` in the mission context panel — rendered only when the selected device has a registered film |
| `src/hooks/useKeys.ts` | while the film is open it owns the keyboard: ESC closes the film (not the whole journey) and the camera no longer reacts to the film's transport keys |

### Removed (the earlier, wrong shape)

| Removed | Why |
|---|---|
| `public/films/merb-mission-film.webm` (165 MB) + poster | the documentary is code; a rendered copy duplicated it and cost 165 MB |
| `src/components/mission/MissionFilmPlayer.tsx` | the HTML5 video player — the documentary's own interface is the player |
| `scripts/render-merb-film.mjs` | the renderer that produced the video file |

No other mission journey, no other device, and no part of the 3D world, the
navigation director or the solar renderer was touched.

---

## 4. The integration in detail

### 4.1 Registry (the only place a film is declared)

```ts
export const MISSION_FILMS: MissionFilm[] = [
  {
    deviceId: "opportunity",
    title: "MER-B — OPPORTUNITY",
    subtitle: "The mission documentary · 18 chapters · 2003 – 2019",
    kind: "documentary",
    durationSec: 514,
    credit: "MER-B cinematic journey (src/missions/merb), authored for ECHOES. Archival media inside the film: NASA / JPL-Caltech (public domain).",
    status: "available",
  },
];

export const filmForDevice = (deviceId) => { … return f && f.status === "available" ? f : null; };
```

`filmForDevice()` returns `null` for every device without an entry, so the
action is **not rendered at all** — no disabled button, no empty player, no
"coming soon". The registry also understands `kind: "video"` for a future real
film file, but **MER-B is a documentary, not a file**.

### 4.2 Entry points (MER-B only)

* **Mission journey intro panel** (Opportunity's mission front page) — a
  full-width amber `▶ WATCH MISSION FILM` button under the mission identity.
* **Journey top bar** — a compact `WATCH MISSION FILM` action.
* **Mission context panel** (the HUD panel at the site) — the same action
  beside *INSPECT HARDWARE* / *REPLAY MISSION*.

All three render only when `filmForDevice(deviceId)` is non-null.

### 4.3 The film experience

The film replaces the journey's chapter content **inside the same overlay**: the
ECHOES mission bar stays, the translucent backdrop keeps the 3D planetary world
visible around the panel, and the documentary's own interface (its brand bar,
mode chips, plates, chapter ruler, transport) fills a 16:9 stage. A slim
ECHOES strip below carries the provenance line and `✕ CLOSE FILM`.

### 4.4 Playback (all real)

The documentary's own interface is the player — no fake controls anywhere:

| Control | Implementation |
|---|---|
| Play / pause | the module's transport button (`data-act="play"`) → `JourneyController.play()/pause()` |
| Chapter navigation | the chapter ruler and the CHAPTERS index → `seekToChapter()` |
| Scrub inside a chapter | the ruler's per-chapter scrub → `seekTime()` |
| Progress | the ruler shows the play head and the chapter ticks; the clock shows `mm:ss / chapter duration` |
| Sound | the SOUND chip toggles the archival audio (`AudioController`) |
| Fullscreen | the module's fullscreen chip |
| Inspect | the INSPECT drawer (milestones, findings, archive media with source and attribution) |
| Free camera | drag to orbit, wheel to zoom (the rover keeps moving) |
| Keyboard | the module's own handlers (Space, ←/→, A, R, M, I) on its container — ECHOES' global keys are suspended while the film is open |
| Quality | the module's own tier chip, with adaptive step-down |

**No autoplay**: the documentary opens on its intro card; the user presses
*PLAY THE JOURNEY*. **No added sound**: the film's own audio is preserved
untouched and ECHOES' ambient bed is muted while it is open.

### 4.5 State and navigation safety

* `openMissionFilm(deviceId)` sets **only** `overlay` and `filmDeviceId`. It
  never calls the director: no scene change, no world change, no camera move,
  no launch/landing/cruise animation, no journey restart.
* `closeMissionFilm()` clears `filmDeviceId` only — the journey returns to the
  exact chapter it was on, and the HUD's mission panel, the site and the device
  are exactly as before.
* The documentary has its own renderer and scene: it cannot touch ECHOES' 3D
  world, and ECHOES cannot touch the documentary's.
* While the film is open the chapter ruler is hidden, so a chapter click can
  never fire camera choreography behind the player's back.
* ESC closes the **film** first (the journey stays open).
* On close the module is destroyed: its canvas, `.merb` DOM nodes, injected
  `<style data-merb>`, geometries, materials, textures, renderer and GL context
  all go — nothing accumulates.

---

## 5. Browser verification (real app, 1920×1080)

Probe: `scripts/probe-film.mjs` (Playwright + Edge, `http://localhost:5174/`),
screenshots in `shotsfilm/`, raw results in `shotsfilm/film-probe.json`.

| # | Check | Result |
|---|---|---|
| V1 | reached the Opportunity site (scene=site, world=mars, device=opportunity) | PASS |
| V2 | Opportunity shows **WATCH MISSION FILM** | PASS |
| V3 | the MER-B documentary is mounted inside the mission experience (1 canvas, `.merb` host, transport control, 1278×719 stage) | PASS |
| V4 | the documentary exposes its own timeline state (chapter, duration, 55 media records) | PASS |
| V5 | playback runs: the chapter time advances and fps is live | PASS |
| V6 | the documentary's own play/pause control works | PASS |
| V7 | chapter navigation works (seek to Endeavour) | PASS |
| V8 | scrubbing inside a chapter works | PASS |
| V9 | the documentary's own sound toggle works | PASS |
| V10 | closing the film restores the previous mission state (scene, world, device, overlay, camera mode) | PASS |
| V11 | closing the film never returns to the Solar System | PASS |
| V12 | **no** Solar System return was triggered by the film (instrumented trace) | PASS |
| V13 | the journey chapter is unchanged after the film | PASS |
| V14 | repeated open/close leaves no accumulating instance (no canvas, no `.merb` node, no style tag, no module hook) | PASS |
| V15 | the mission experience is intact after repeated open/close | PASS |
| V16 | the mission journey timeline is still functional | PASS |
| V17 | chapter selection still works after the film was used | PASS |
| V18-SPIRIT / -INSIGHT / -SOJOURNER / -APOLLO 12 / -APOLLO 17 | **no** WATCH MISSION FILM action on any unregistered device | PASS |
| V19 | no console errors during the whole session | PASS |

**Final run: 23 / 23 PASS, 0 console errors.**

### Device-availability verification

The registry is asserted in unit tests (`src/data/missionFilms.test.ts`:
`devicesWithFilm()` equals exactly `["opportunity"]`, every other archive device
resolves to `null`, and the MER-B entry is a *documentary* — its module ships
with the app) **and** in the browser (V18): each of Spirit, InSight,
Sojourner, Apollo 12 and Apollo 17 was travelled to in the running app and the
action was counted as **absent** on the page.

### No regression in the rest of the app

After the film work, the device-navigation regression probe was re-run in the
same session: **13 / 13 PASS** (Mars → Opportunity → Spirit, cross-planet
transfers, Moon → Apollo 17 / InSight, all 23 journey chapters at the site with
zero Solar System returns, 0 console errors).

---

## 6. Automated tests

```
Test Files  17 passed (17)
     Tests  153 passed (153)
```

* 146 pre-existing tests (incl. the device-navigation regression suite) — still
  green.
* 7 new registry tests.

`npx tsc --noEmit` — clean. `npm run build` — succeeds.

---

## 7. Remaining limitations

1. **The documentary is a 3D scene rendered live**, so it costs a second WebGL
   context while it is open (the module's own context, isolated from ECHOES').
   The module ships with quality tiers and adaptive step-down, and ECHOES'
   tier is mapped onto it, but on a very modest GPU the two contexts together
   are the heaviest thing in the app while the film is playing.
2. **The film is silent except for its launch tape** (the documentary's own
   policy, stated on screen: "ARCHIVAL AUDIO ONLY — NO MUSIC. MARS SCENES ARE
   SILENT: OPPORTUNITY CARRIED NO MICROPHONE"). That is the documentary as
   authored, not a defect.
3. **The archival media is streamed from NASA/JPL** (as in the delivered
   prototype) — a plate that cannot be fetched is skipped rather than shown
   empty, so an offline session sees fewer photographs.
4. **The documentary's own interface** (brand bar, chips, serif titles, chapter
   ruler) is the prototype's visual identity, not ECHOES'. It is namespaced
   under `.merb` and does not leak into the rest of the app, but it does not
   look like ECHOES chrome either — by design: the film is the documentary.
5. **Only MER-B.** Spirit, InSight, Sojourner, the Apollo missions and Voyager
   have no film and therefore no action. Each needs its own documentary module
   and a one-line registry entry.
6. **The git history still contains the 165 MB WebM** from the earlier,
   discarded video approach (it was committed before the film was recognised as
   code). The file is gone from the working tree and from the current build;
   only the history keeps the blob. History was not rewritten — that is a
   destructive operation and was deliberately avoided.

---

## 8. Files the user should keep

* `mars-rover-cinematic-prototype (1).zip` — the delivered documentary source
  (unchanged, still in the project root). It is now integrated directly as
  `src/missions/merb/`.
* `src/missions/merb/**` — the integrated documentary module.
* `scripts/probe-film.mjs` — the browser audit for the film.
