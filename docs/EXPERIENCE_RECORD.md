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

## STAGE 4 — SITE VIGNETTES (sourced mission quotes) — committed

- **What:** shortly after each surface arrival (and the Voyager flyin) a
  "MISSION VIGNETTE" card appears with one verbatim, sourced line from the
  real mission — attribution, date/context and source on every card. Once per
  site per session; dismissible immediately, auto-dismissed after 18 s.
- **Quotes (all verified verbatim against sources this session, nothing
  invented):** Conrad A12 + Shepard A14 + Scott A15 + Duke A16 + Cernan A17
  (Apollo Lunar Surface Journal); Muirhead MPF (JPL press kit, pre-landing
  context labelled); Manning Spirit + Lewicki Opportunity ("Two for two… One
  dozen wheels on soil") + Szalai InSight ("Touchdown confirmed…") mission
  transcripts; Sagan on the Golden Record for Voyager 1.
- **How:** `src/data/vignettes.ts` (Record keyed by artifact id);
  `queueVignette(id)` fired from `descendToSite` and `goVoyager` — sessions
  track via in-memory `vignettesSeen`; static data + UI = +5 kB.
- **Verification:** harness asserts the card at Apollo 12 arrival (text check
  + screenshot 13a-vignette with the Conrad card on the surface); surface
  perf unchanged (60.1 FPS / p95 16.8 / 0 errors); tsc clean (2 pre-existing
  warnings); 84/84 tests.

## STAGE 5 — AMBIENT AUDIO (generated beds, honesty-first) — committed

- **What:** a quiet generated ambient bed follows the scene: interstellar /
  solar space = faint observatory drone (two detuned 55 Hz sines through a
  lowpass); planet orbit = warm drone; Mars surface = a low bandpass noise
  wind with slow drift; airless (moon) surface = NO artificial wind — only
  the in-suit life-support pulse a wearer would actually hear (soft 96→48 Hz
  thud every 3.4 s). Master level sits well below UI tones; nothing loops
  distractingly.
- **Honesty rules (in code header + Settings):** ambience is generated
  interface audio, never a recording; the Settings AUDIO block now states
  "AIRLESS WORLDS GET THE IN-SUIT PULSE ONLY; MARS GETS A WIND STAND-IN."
  The InSight wind recording is real but is not used here — no confusion
  between synthesis and the actual NASA capture.
- **How:** `src/lib/ambience.ts` on the shared AudioContext (audio.ts), pink-
  ish smoothed looped noise + LFO filter-drift; scene→kind wiring in Hud
  (useEffect on scene/world/audioOn); audio-unlock ordering solved by a
  first-gesture `rearm` listener that re-syncs the bed after the context
  exists. Respect the AUDIO toggle (kind = off).
- **Verification:** harness asserts `__echoesAmb` transitions: solar → void,
  moon orbit → orbit, Apollo 12 surface → moon (airless = pulse only);
  surface perf unchanged (60.1 FPS / p95 16.8 / 0 errors); tsc clean (2
  pre-existing warnings); 84/84 tests.

## PHASE 9 — REAL SITE TERRAIN (LOLA / MOLA DEM patches) — committed

- **What:** the 9 mission sites now build their macro relief from real NASA
  laser-altimeter data: LOLA GDR LDEM_128 for the five Apollo sites, MOLA MEGDR
  128-ppd radial tiles for MPF / Spirit / Opportunity / InSight. Patches cover
  +-0.25 deg around each landing point (7.4-15 km) as 256x256 16-bit PNGs
  (Int16 metres, 1 m/step, per-patch offset). Extraction re-runs offline via
  `scripts/build-site-dems.py` (row-wise HTTP byte-range reads of the PDS
  products — never the full 2.1 GB; Trek's 8-bit grayscale DEMs were rejected:
  62.7 m/step vertical quantization would destroy site relief).
- **Honesty rules§8:** data window = DEM; outside it = procedural
  reconstruction (seeded value-noise + documented site features), faded over a
  blend band so no seam shows. `DataResolution` says which is which per site
  ("NASA DEM PATCH" + `LOLA DEM ACTIVE · 237 m NATIVE / 60 m SHOWN · MACRO
  RELIEF REAL` note, falling back to "VISUALIZATION" when no patch exists or a
  load fails). Site relief sanity-checked against real geography: A17
  Taurus-Littrow walls 2002 m, A15 Hadley 1335 m, A12 mare 123 m, mars sites
  118-299 m.
- **How:** `engine/terrain/dem.ts` (manual 16-bit PNG decode via
  DecompressionStream — canvas would truncate to 8-bit) + `heightAt`
  micro/macro split; `Terrain`, `RockField` and `MissionRoute` re-ground when
  the patch lands; store `demNote` drives the label. Patches add ~284 kB
  (~380 kB base64) — bundle 10,074 -> 10,438 kB.
- **Verification:** harness leg asserts `__echoesDemInfo` ready + siteId
  `apollo-12` + LOLA note text at the site; journey passed end to end
  (ambient/vignette/photography intact); surface perf unchanged (60.1 FPS /
  p95 16.9 / 0 errors); tsc clean (2 pre-existing warnings); 90/90 tests.




