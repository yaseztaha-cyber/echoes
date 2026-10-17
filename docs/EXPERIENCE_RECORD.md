# EXPERIENCE RECORD — ECHOES

Per-stage log of deliberate experience enhancements. Same discipline as the asset
audit: what was built, what was verified, what stays honest. Commit per stage.

## STAGE 1 — SUN-PHASE SCRUB (dusk + night lights) — committed

- **What:** In every planet-orbit scene, "SUN PHASE · SIMULATED TIME OF DAY" in
  the orbital panel scrubs the sun around the planet with a slider plus
  NOON/DUSK/MIDNIGHT/DAWN chips. 0 = the real arrival sun geometry; any other
  position is explicitly labelled simulated (panel caption + honesty note).
- **How:** `sunPhase` (radians) in the store, non-persisted; `env.sunBase`
  captured at each `travelToBody`; `SunScrub` rotates `env.sunDir` around local
  up per frame, so direction-light, atmosphere, night-lights mask and terrain
  all follow. No new render loops; one useFrame.
- **Night-lights payoff (Earth):** the VIIRS layer mask
  (`smoothstep(0.05, −0.10, dot(N, sun))`) makes city lights ignite as the sun
  rotates past the terminator and vanish as noon crosses the disc.
- **Fix during the stage:** planet globe + cloud materials now carry
  `envMapIntensity = 0.22` — the RoomEnvironment PMREM was ghost-lighting the
  night side, which read as a permanent afterglow during the scrub. Metals
  (rover hardware) keep the room reflections.
- **Chip naming note (recorded, unchanged):** chips name the sun's phase of
  rotation relative to the visible disc, not local time at the sub-camera
  point — with the camera 60–75° off the subsolar arrival line, "NOON" shows a
  real terminator view. Study control, verified.
- **Verification (headless ANGLE/D3D11, 1600×1000):** measured canvas
  brightness across the sweep: phase 0 = 30.3, midnight = 18.5 (−39 %), dusk
  terminator = 22.6, noon reset = 30.9; earth orbit still 60.1 FPS / p95 16.9 ms
  with the panel control live; moon planet scene + Apollo 12 regression
  unchanged (60 FPS, 0 errors); 84/84 unit tests; screenshot set
  shots2/e5-dusk, e6-midnight, e7-noon.

## STAGE 2 — AUTO-FILLING ARCHIVE (visited-state feedback) — committed

- **What:** the ARCHIVE manifest is no longer a static list. Every artifact the
  player actually reaches gets marked in the journal: a persisted `visits[]`
  in the store (localStorage `echoes.visits`), a cyan `●` marker + "(visited)"
  on visited rows, a live header count ("N ARTIFACTS ON RECORD · N PERSONALLY
  VISITED"), a second HUD console row ("VISITS LOGGED nn / NN" with cyan
  bars under the amber ARCHIVE PROGRESS row), and an "ARCHIVE ENTRY
  LOGGED <designation> · NN RECORDS VISITED" toast the first time a site
  arrival is logged.
- **How:** `markVisit(artifactId, name)` (dedupe + persist) called from
  `descendToSite` after each `arrive()` — i.e. only real 3D surface descents
  count, archive clicks alone never forge a visit — and from `goVoyager`
  (deep-space flyin is a real visit to the record). Revisits update the
  toast count but don't duplicate rows.
- **Verification:** headless journey drives descent to Apollo 12 → archive
  screenshot shows "1 PERSONALLY VISITED", the ● on APOLLO 12 and
  "VISITS LOGGED 01 / 10" in the HUD; tsc clean (2 pre-existing warnings),
  84/84 tests, build green (10,064 kB, +0.06 from the feature).

## STAGE 3 — FRAME PHOTOGRAPHY (session film log) — committed

- **What:** any scene (solar / planet orbit / surface) can be captured: C key
  or the FRAME button in the bottom strip. Each capture flashes a shutter
  overlay, plays a two-blip shutter sound, drops a toast
  ("FRAME NN CAPTURED" + caption) and files the view in a FRAME LOG overlay
  (FILM button next to ARCHIVE) as a thumbnail with a SAVE link
  (echoes-frame-NN.jpg) and a CLEAR FILM action.
- **How:** `CaptureAgent` lives inside the R3F Canvas; `requestPhoto()`
  bumps `photoReq`, the agent renders one fresh frame (`gl.render`) then
  `toDataURL("image/jpeg", 0.92)` in the same task — no
  `preserveDrawingBuffer` cost on the live loop. Frames are session-only in
  memory (dataURLs would blow the 5 MB localStorage budget); the honest
  caption carries scene context (e.g. "A12 · MOON SURFACE · 1969-11-19
  06:54", plus "· SIM SUN n°" whenever the sun-phase scrub is non-zero).
- **Honesty rule:** the log is statically headed "SIMULATION PHOTOGRAPHY,
  NOT NASA IMAGERY" — captured frames can never be confused with the real
  archival photography the app cites.
- **Verification:** headless journey pressed C at Apollo 12 surface → toast +
  film log screenshot (15-frame, 16-film); surface measure unchanged
  (60.1 FPS / p95 16.8 / 0 errors); tsc clean (2 pre-existing warnings),
  build +3.2 kB.


