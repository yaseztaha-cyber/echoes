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
