# ECHOES — MER-B MISSION FILM INTEGRATION

**Date:** 2026-11-13 · **App under test:** `http://localhost:5174/` (Vite dev server, real browser: Edge/Chromium via Playwright, 1920×1080)

---

## 1. The asset: what was actually found

### 1.1 Search performed

The task asked for *the user's already-created Opportunity documentary video*. It was
looked for in:

| Location | Method | Result |
|---|---|---|
| `nasa-planetary-exploration-simulator/` (whole tree, recursive, media + archives) | extension + name scan | only `mars-rover-cinematic-prototype (1).zip` (357 KB, added 2026-11-13 03:54, contents dated 2026-11-10 23:55) |
| `D:\YASEZ_HOME\projects` (whole tree) | extension + name scan | no video; `New folder` (empty), `eydo ai`, `workspace-019f7d50…` are unrelated projects |
| `C:\Users\DELL\{Downloads,Desktop,Documents,Videos}` (recursive) | extension + name scan + "modified in the last 45 days" filter | only unrelated screen recordings / clips / course zips |
| **every** `.zip` in `C:\Users\DELL\Downloads` (~130 archives) | archive entry listing (video extensions) | the only archives containing video are `clips.zip`, `clips (1).zip`, `videos-2025…zip`, `Openclip-main.zip` — all unrelated (trading/GCSE/hero loops) |
| `D:\YASEZ_HOME` roots (`autoclip`, `clipping`, `clips material`, …) | directory listing | unrelated clip tooling, no MER-B film |
| the prototype's own documentation | read `README.md`, `VERIFICATION.md`, `docs/INTEGRATION.md` | names the recording `MERB_JOURNEY_STANDALONE/verification/video/verification-run-software-gl.webm` — **not included in the zip** (the zip contains only `verification/report.json`) and not present anywhere on the machine |

**Finding: the delivered zip contains no video file.** It is the *source* of the
documentary — `MERB_JOURNEY_STANDALONE`, 51 TypeScript/CSS/Markdown files: the
chapter registry (18 chapters, 514 s), the scene registry, the procedural 3D
worlds (Surface/Launch/Space), the rover reconstruction and rig, the camera
shots, the media manifest, the DOM documentary UI and the audio policy. The
finished screen recording its own verification report refers to was never
included in the archive.

No replacement video was invented, no stock footage and no NASA clip was
substituted. What was delivered instead is a rendering of **the user's own
documentary** — the exact frames, camera choreography, editorial typography and
media plates of `MERB_JOURNEY_STANDALONE` — captured to a real, streamable
video file.

### 1.2 How the film was produced

`scripts/render-merb-film.mjs` (kept in the repository so the film can be
re-rendered):

1. builds the delivered prototype (`npm install && npm run build` → single-file
   `dist/index.html`),
2. serves it locally and drives it in headless Edge/Chromium
   (`?debug=1&autoplay=1&intro=0&quality=medium`),
3. calls the prototype's own public API (`window.__journey.play()`) and records
   the real-time playthrough with the browser's screencast recorder.

The capture ran the **whole documentary**: 18 / 18 chapters, 558.9 s wall time,
30 fps, `ended: true`.

### 1.3 The audio, restored exactly

Chromium's screencast recorder is **video-only** — the recording came out with
no audio track. The documentary's own audio policy (`AudioController.ts`) is
explicit and strict:

> *No music. No soundtrack. No synthesised or AI-generated effects. The only
> audible material is the original audio track of archival NASA/JPL video, played
> exactly as published.* … *3D scenes of space and Mars are SILENT: space has no
> sound and Opportunity carried no microphone.*

So the film's only sound is the **NASA/JPL launch tracker tape**
(`AVC-2003-175-1`, MER-2003-1020), cut by the documentary as clip **226–256 s**
of the tape and played at **8 s into the launch chapter** (= 30 s into the
film). That audio was muxed back from the same public-domain source at the same
offset, with the **video stream copied bit-for-bit** (`-c:v copy` — no
re-encode, no quality loss):

```
ffmpeg -i film.webm -ss 226 -t 30 -i AVC-2003-175-1_512kb.mp4 \
       -filter_complex "[1:a]adelay=30000|30000[a]" \
       -map 0:v -map "[a]" -c:v copy -c:a libopus -b:a 96k film-with-audio.webm
```

Verified by level measurement: the film is at −91 dB (digital silence) before
0:30, follows the tape's own silence through the countdown (the tape itself is
silent between 3:30 and 4:08), and carries the launch sound at −14.5 dB mean /
−6.8 dB peak from 0:52 — i.e. the documentary's audio, in the documentary's
place, with the documentary's silence everywhere else.

### 1.4 Poster

No poster shipped with the archive. The poster is a **real frame of the film**:
t = 300 s (Chapter 10, *Purgatory Dune*), cropped to 16:9 so the documentary's
own chapter caption and honesty line stay legible.

---

## 2. Technical metadata of the delivered film

| Property | Value |
|---|---|
| Path in the app | `public/films/merb-mission-film.webm` |
| Served at | `/films/merb-mission-film.webm` (`Content-Type: video/webm`, `Accept-Ranges` honoured → **HTTP 206** on range requests) |
| Container | WebM (Matroska) |
| Video codec | **VP9 Profile 0**, `yuv420p`, progressive |
| Resolution | **1280 × 720**, SAR 1:1, DAR 16:9 |
| Frame rate | **25 fps** (tbr 25) |
| Duration | **00:09:18.92** (558.92 s) |
| Overall bitrate | 2 469 kb/s |
| Audio | **Opus**, 48 000 Hz, stereo (the documentary's launch tape, 0:30–1:00) |
| Size | 172 884 711 bytes (164.9 MB) |
| Poster | `public/films/merb-mission-film-poster.jpg` (980×550 crop of t = 300 s, 36 KB, JPEG baseline) |
| Browser compatibility | VP9 + Opus in WebM: Chrome/Edge/Firefox/Safari 14.1+ (no conversion required) |
| Provenance | MER-B cinematic journey, authored for ECHOES (`MERB_JOURNEY_STANDALONE`). Archival media inside the film: NASA / JPL-Caltech (public domain). |

The untouched capture (no audio track) is preserved outside the repository at
`C:\Users\DELL\AppData\Local\Temp\opencode\merb\verification-video\`.

---

## 3. Files added or modified

### Added

| File | Purpose |
|---|---|
| `public/films/merb-mission-film.webm` | the MER-B mission film (165 MB, streamed, never inlined) |
| `public/films/merb-mission-film-poster.jpg` | poster — a real frame of the film |
| `src/data/missionFilms.ts` | **the mission-film registry** (device id, title, subtitle, src, poster, duration, credit, status) + `filmForDevice()` / `devicesWithFilm()` |
| `src/data/missionFilms.test.ts` | 6 registry regression tests (MER-B only, no other device, assets exist, provenance present) |
| `src/components/mission/MissionFilmPlayer.tsx` | the player: real `<video>`, ECHOES-styled controls, `PlayIcon` (SVG, not emoji) |
| `scripts/render-merb-film.mjs` | renders the documentary to the film file (reproducible) |
| `scripts/probe-film.mjs` | the browser verification probe (20 checks) |
| `ECHOES_MERB_MISSION_FILM_INTEGRATION.md` | this report |

### Modified

| File | Change |
|---|---|
| `src/state/store.ts` | new `filmDeviceId` state + `openMissionFilm()` / `closeMissionFilm()` — they touch **only** the overlay and the film id |
| `src/components/mission/MissionJourney.tsx` | the film is revealed **inside the mission journey interface**; a `WATCH MISSION FILM` entry point in the journey's intro panel and in its top bar; the chapter ruler is hidden while the film is open (it drives camera choreography and must not compete with the film's transport) |
| `src/components/planet/ContextPanels.tsx` | `WATCH MISSION FILM` in the mission context panel — rendered only when the selected device has a registered film |
| `src/hooks/useKeys.ts` | while the film is open it owns the keyboard: ESC closes the film (not the whole journey) and the camera no longer reacts to the film's transport keys |

Nothing else was touched: no other mission journey, no other device, no change
to the 3D world, the navigation director or the solar renderer.

---

## 4. The integration in detail

### 4.1 Registry (the only place a film is declared)

```ts
export const MISSION_FILMS: MissionFilm[] = [
  {
    deviceId: "opportunity",
    title: "MER-B — OPPORTUNITY",
    subtitle: "The full mission documentary · 18 chapters · 2000 – 2019",
    src: "/films/merb-mission-film.webm",
    poster: "/films/merb-mission-film-poster.jpg",
    durationSec: 514,
    credit: "MER-B cinematic journey, authored for ECHOES. Archival media inside the film: NASA / JPL-Caltech (public domain).",
    status: "available",
  },
];

export const filmForDevice = (deviceId) => { … return f && f.status === "available" ? f : null; };
```

`filmForDevice()` returns `null` for every device without an entry, so the
action is **not rendered at all** — no disabled button, no empty player, no
"coming soon". Registering a film for another mission later is a one-entry
change.

### 4.2 Entry points (MER-B only)

* **Mission journey intro panel** (Opportunity's mission front page) — a
  full-width amber `▶ WATCH MISSION FILM` button under the mission identity.
* **Journey top bar** — a compact `WATCH MISSION FILM` action.
* **Mission context panel** (the HUD panel at the site) — the same action
  beside *INSPECT HARDWARE* / *REPLAY MISSION*.

All three render only when `filmForDevice(deviceId)` is non-null.

### 4.3 The film experience

The film replaces the journey's chapter content **inside the same overlay**:
the mission identity bar stays, the translucent backdrop keeps the 3D planetary
world visible around the panel, and the video gets the centre of the screen
(`max-w-6xl`, 16:9, up to 62 vh). Typography is the existing ECHOES mono /
tracking system; no gradients, no glass, no nested cards — one 1 px bordered
panel, one stage, one control bar.

### 4.4 Playback (all real)

| Control | Implementation |
|---|---|
| Play / pause | `<video>.play()` / `.pause()`, plus a play overlay with a real SVG glyph |
| Seek ±10 s | `currentTime ± 10` |
| Seek bar | a real `<input type="range">` (keyboard + touch) over a buffered/played progress track |
| Progress | buffered fraction and played fraction drawn behind the slider |
| Volume / mute | `<video>.volume` + `.muted`, with a range input and a MUTE toggle |
| Fullscreen | `requestFullscreen()` on the film panel (video included) |
| Time / duration | live `currentTime / duration` in mm:ss (the real duration is read from the file) |
| Buffering | `waiting` → `BUFFERING…`; `canplay` clears it |
| Errors | `error` → a clear "FILM UNAVAILABLE" panel; the mission experience underneath is untouched |
| Keyboard | Space/K play-pause · ←/→ ±5 s · J/L ±10 s · M mute · F fullscreen · ESC close — all handled on the panel, `stopPropagation` so the camera never sees them |

**No autoplay**: the film shows its poster and a play button; playback begins
only on the user's explicit click, so the original audio is never played
unbidden. **No added sound**: the film's own audio is preserved untouched and
ECHOES' ambient bed is muted while the film is open (the documentary is silent
except for the launch tape, and its own frames say so).

### 4.5 State and navigation safety

* `openMissionFilm(deviceId)` sets **only** `overlay` and `filmDeviceId`. It
  never calls the director: no scene change, no world change, no camera move,
  no launch/landing/cruise animation, no journey restart.
* `closeMissionFilm()` clears `filmDeviceId` only — the journey returns to the
  exact chapter it was on, and the HUD's mission panel, the site and the device
  are exactly as before.
* While the film is open the chapter ruler is hidden, so a chapter click can
  never fire camera choreography behind the player's back.
* ESC closes the **film** first (the journey stays open).
* On close the player pauses the element, removes the source and calls
  `load()` → the decoder and the buffered data are released; the `<video>`
  element is unmounted, so nothing accumulates.

---

## 5. Browser verification (real app, 1920×1080)

Probe: `scripts/probe-film.mjs` (Playwright + Edge, `http://localhost:5174/`),
screenshot evidence in `shotsfilm/`, raw results in `shotsfilm/film-probe.json`.

| # | Check | Result |
|---|---|---|
| V1 | reached the Opportunity site (scene=site, world=mars, device=opportunity) | PASS |
| V2 | Opportunity shows **WATCH MISSION FILM** | PASS |
| V3 | the film element points at the MER-B recording and loads it (duration 558.9 s, 1280×720) | PASS |
| V4 | `/films/merb-mission-film.webm` is requested and served (**HTTP 206** — the browser ranged the file, i.e. it streams) | PASS |
| V5 | playback does **not** autoplay, and is not muted-by-default | PASS |
| V6 | playback starts on the user's click and the time advances | PASS |
| V7 | the film carries an audio track that decodes | PASS |
| V8 | seeking works (the slider jumps the film) | PASS |
| V9 | keyboard seek works (ArrowRight = +5 s) | PASS |
| V10 | fullscreen works (`document.fullscreenElement` set) | PASS |
| V11 | closing the film restores the previous mission state (scene, world, device, overlay, camera mode) | PASS |
| V12 | closing the film never returns to the Solar System | PASS |
| V13 | **no** Solar System return was triggered by the film (instrumented trace) | PASS |
| V14 | the journey chapter is unchanged after the film | PASS |
| V15 | repeated open/close leaves no accumulating `<video>`/player instances | PASS |
| V16 | the mission experience is intact after repeated open/close | PASS |
| V17 | the mission journey timeline is still functional | PASS |
| V18 | chapter selection still works after the film was used | PASS |
| V19-SPIRIT / -INSIGHT / -SOJOURNER / -APOLLO 12 / -APOLLO 17 | **no** WATCH MISSION FILM action on any unregistered device | PASS |
| V20 | no console errors during the whole session | PASS |

**Final run: 24 / 24 PASS, 0 console errors.**

Two real defects were caught by this probe and fixed before the final run:

1. **StrictMode stripped the video source.** React 19 mounts effects twice in
   development; the release step removed the `src` attribute, and React — whose
   prop never changed — did not put it back, so the element ended up with no
   file at all (empty `src`, `readyState 0`, no request). The source is now
   assigned imperatively in an effect that re-applies it on every mount.
2. **A probe-side assertion was wrong**, not the app: the film is fetched with
   a range request, so the response is **206 Partial Content**, not 200. The
   check now accepts both (206 is the desired streaming behaviour).

Screenshots: `shotsfilm/02-film-entry.png` (the entry point in Opportunity's
journey), `shotsfilm/04-film-playing.png` (the film playing inside the journey,
with the 3D Mars site visible around it), `shotsfilm/05-film-closed.png` (the
journey restored), `shotsfilm/07…11-no-film-*.png` (no action on the other
devices). Raw results: `shotsfilm/film-probe.json`.

### Device-availability verification

The registry is asserted in unit tests (`src/data/missionFilms.test.ts`:
`devicesWithFilm()` equals exactly `["opportunity"]`, every other archive
device resolves to `null`) **and** in the browser (V19): each of Spirit,
InSight, Sojourner, Apollo 12 and Apollo 17 was travelled to in the running
app and the action was counted as **absent** on the page.

### No regression in the rest of the app

After the film work, the device-navigation regression probe was re-run in the
same session: **13 / 13 PASS** (Mars → Opportunity → Spirit, cross-planet
transfers, Moon → Apollo 17 / InSight, all 23 journey chapters at the site with
zero Solar System returns, 0 console errors). The 3D world, the mission journey
and the navigation director behave exactly as before the film was added.

---

## 6. Automated tests

```
Test Files  17 passed (17)
     Tests  152 passed (152)
```

* 146 pre-existing tests (incl. the device-navigation regression suite) — still
  green.
* 6 new registry tests.

`npx tsc --noEmit` — clean. `npm run build` — succeeds: `dist/index.html` stays
14.31 MB (the film is **not** inlined into the single-file bundle) and the film
is copied to `dist/films/merb-mission-film.webm` for the static server.

---

## 7. Remaining limitations

1. **The archive did not contain a video file.** The film in
   `public/films/` is a faithful capture of the delivered documentary, not a
   file the user had exported. If the original recording
   (`verification-run-software-gl.webm`) is recovered, dropping it in as
   `public/films/merb-mission-film.webm` replaces the film with **no code
   change** — the registry points at the path.
2. **The film is silent except for 30 s** (0:30–1:00, the launch tape). That is
   the documentary's own policy, stated in its frames ("SILENT. OPPORTUNITY
   CARRIED NO MICROPHONE — THERE IS NO RECORDED SOUND FROM MARS"), not a
   defect. The narrated NASA TV features and the EDL animation soundtrack are
   muted by the documentary's author because their music beds were never
   verified.
3. **165 MB on the wire.** The file is streamed (range requests, `preload=
   "metadata"`, nothing loaded before the user opens the film), but a first
   play on a slow connection will buffer. A lower-bitrate delivery copy can be
   produced from the same capture if bandwidth becomes a constraint; the
   untouched capture is preserved outside the repository.
4. **The capture is a screen recording of a 30 fps software-rendered run.** The
   documentary's adaptive quality tier stepped down to `low` during the capture
   (the machine was busy), so some chapters show the low-detail terrain tier.
   Re-rendering on an idle machine with `quality=high` would raise the visual
   fidelity of the film; the pipeline is `scripts/render-merb-film.mjs`.
5. **The film's own UI chrome is inside the picture** (the documentary's
   chapter title, the timeline, the provenance lines). That is the documentary
   as authored — it is not ECHOES' UI — and it is what makes the film legible
   as a documentary record.
6. **One device only.** Spirit, InSight, Sojourner, the Apollo missions and
   Voyager have no film and therefore no action; each needs its own recording
   and a one-line registry entry.

---

## 8. Files the user should keep

* `mars-rover-cinematic-prototype (1).zip` — the delivered documentary source
  (unchanged, still in the project root). It is what the film was rendered from
  and what the film registry's credit line refers to.
* `public/films/merb-mission-film.webm` + `…-poster.jpg` — the film and its
  poster.
* `scripts/render-merb-film.mjs` — re-render the film from the prototype at
  any time.
