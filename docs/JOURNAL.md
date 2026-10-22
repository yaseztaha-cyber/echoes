# JOURNAL — ECHOES ("The machines we left behind")

NASA Space Apps Challenge 2026 — *Abandoned but not Forgotten: Storytelling
about NASA's Discarded Equipment on the Moon and Mars* (Challenge 01/14).

Requirement-by-requirement mapping of this build to the challenge brief lives
in **`docs/CONNECTION.md`**. This journal is the record of what was built,
stage by stage, how each stage was verified, and what stays honest. Every
stage below is compiled in the repo at the commit noted in its entry.

## How to run what is described here

```
npm install
npm run build        # single-file dist/index.html (+ streaming asset packs in public/)
npm run preview      # serve; open the printed http://localhost port
```
Entry screen → **ENTER SIMULATION** (free exploration) or **PLAY GUIDED DEMO**
(automated tour that lands you at an artifact). Everything measured below was
captured headless via the harness scripts in `scripts/` against precisely this
build, always watching for console errors (the acceptance bar: zero).

## Phase ledger

### Core engine (spec phases A–P)
The simulator was built spec-first: a real-solar-system frame (circular-orbit
navigation model, documented honestly as such — `docs/COORDINATE_FRAME_DESIGN.md`),
wanderable planet orbits, arrival sequencing, site scenes with reconstructed
spacecraft hardware, artifact/story panels with three reading layers, archive
collection with persisted visits, science-question discovery loop, search,
film consciousness — in short: the challenge's "tell the story" engine.
Unit-tested throughout; every astronomy-adjacent function carries its own
test (star direction→position, orbit radii, time-of-day geometry).

### Experience stages (records in `docs/EXPERIENCE_RECORD.md`)
Stage-by-stage deliberate enhancements, each committed and verified headless:
- **Sun-phase scrub** — dusk/NOON/MIDNIGHT chips; VIIRS-style night lights
  ignite on the dark side of Earth; measured canvas-brightness drop of ~39%
  at midnight, no fps cost (60.1 fps Orbit).
- **Auto-filling archive** — visited artifacts mark the journal live.
- Arrival polish, telemetry honesty panel, guided demo path, film archive,
  mission lab.

### Real-terrain phase (commits `0a5fc3a`, `46b21ff`, `4ac9bcb`)
LOLA (Moon) and MOLA (Mars) elevation stripes decoded at runtime; nine mission
sites grounded on real DEM patches; **`DataResolution`** panel in the HUD that
labels what is real data versus visualization per panel; terrain re-anchoring
Rocks and tracks; Apollo 12/Surveyor 3 sent to 0-error bar.

### Rich-universe phase (this journal's latest entry; commits `cca1e43`, `2a06974`, then docs)
Why: a rich sky is the strongest "this is elsewhere" lever for a young audience.
What shipped:
- **KTX2 stream tiers** — real NASA maps re-transcoded at native resolution to
  GPU-compressed ETC1S/Basis (toktx), streamed on demand in `public/tex-hi/`,
  never bundled: Moon 8192×4096 LROC (4.4 MB), Earth 4096×2048 BMNG
  (0.9 MB), Mars 4096×2048 MOLA (1.5 MB). Tier machine swaps textures at
  distance thresholds without a visible pop (hysteresis UP 0.12 / DOWN 0.07).
- **Deep star layer** — 61,814 real HYG-v4.4 stars to mag 8.5 streamed as a
  1 MB binary (`public/stars-deep.bin`), rendered as a second additive Points
  layer protected by the same performance tiering as the globe tiers
  (`quality === "low"` never fetches).
- **Milky Way panorama** — ESO/S. Brunier GigaGalaxy-Zoom photograph, CC BY
  4.0, largest source resolution ESO serves (6000×3000; nothing upscaled),
  KTX2 2.3 MB; positioned on the sky dome via the IAU J2000
  galactic→equatorial→scene rotation, aligned to the HYG catalogue frame and
  verified against real anchors (bulge at texture center, LMC/SMC mapped at
  80.9°/303° galactic longitudes — `src/engine/world/galactic.ts` +
  `galactic.test.ts` anchors for center/pole/LMC).
- **Entry timing pass (phase 3)** — school-age attention spans: whole
 Solar-system intro flight 6 s→2.2 s, travel-to-planet formula clamped
  2.2–5.5 s (was 4.5–11 s), orbital-insertion 5 s→2.6 s, site descent
  10 s→5.2 s, arrival pan 15 s→7.5 s, Voyager approach 9 s→6.5 s; banners
  shortened to match. NEW: Escape mid-flight jumps the flight to its end
  state (`controller.ts::skipFlight`, Escape-first in `useKeys.ts`) — the
  awaiting director chain resolves exactly as if the flight had played, so
  scene swaps and veils never desync. Verified by probe: ESC ~0.9 s into a
  moon travel landed "ORBITAL INSERTION" + planet ambience instantly;
  harness re-run green (surface 60.1 fps, zero errors).
- **Zodiacal haze** — faint warm additive disc in the ecliptic plane at the
  Sun (interplanetary-dust scattering is plane-concentrated; reads as the
  classic band edge-on). Canvas radial gradient, DoubleSide, skipped on the
  low quality tier (`SolarSystem.tsx::Sun` + `zodiacalTexture`, probe
  `scripts/probe-zodiac.mjs`).
- All of it gated, streamed, and Tai-directed (`docs/RENDERING_BENCHMARKS.md`
  carries the measured numbers; tests now 106/106 with the galactic anchors).

### Where verification stands right now (state of this journal)
- Unit tests: **106 passed / 0 failed** (vitest).
- TypeScript: clean except two pre-existing unused-symbol warnings (unrelated
  to runtime correctness; tracked, not hidden).
- Headless harness (`scripts/browser-verify2.mjs`, one run, zero console/page
  errors): solar ambience void → milkyway KTX2 resident (2.31 MB, manifest
  bytes) → deep stars resident (61,814) → moon travel, moon KTX tier resident
  (4.37 MB; residency total 9.05 MB across earth/moon/mars/milkyway) →
  Apollo 12 descent, LOLA DEM ACTIVE (237 m native / 60 m shown), arrival
  vignette, surface capture fps 60.1 (p99 16.8 ms); moon planet scene 48.1 fps.
- Three sky bugs found by pixel-probing and fixed during this phase (kept in
  the record because they are the kind of thing screenshots hide):
  (a) single-mip KTX2 under a default mipmap minFilter sampled constant
  black — an "incomplete texture"; fixed by clamping filter mode in the
  tracked prep path (`manager.ts` prepTexture);
  (b) galactic dome index winding pointed normals inward, so the intended
  BackSide render culled the whole dome; reversed the winding
  (`galactic.ts`), verified with deterministic camera-aim probes
  (`scripts/probe-band*.mjs`) — bulge field bright/star-cloud rich at the
  Sgr A* vertex (l≈0, b≈−28°) vs a plain field at l≈−90°;
  (c) `pin()` before `request()` in the residency manager created a zombie
  pending entry no loader ever kicked; request must start the load, pin
  pins the live entry.
- Bundle: single text-only `dist/index.html` (≈11.3 MB; sky/stream packs live
  as separate cached streams, so a first visit downloads only what it sees).

## Honesty ledger (what must NOT be oversold)

- Orbits use a circular-navigation model; display positions are explicitly
  **adjusted for navigation, not to scale** — labelled in-app.
- Spacecraft are **team reconstructions**, not NASA CAD; labelled in-app.
- Terrain relief is real where DEM exists (nine sites), visualized elsewhere.
- Milky Way band is a real photograph placed at its real galactic geometry —
  it is scenery for orientation, not a photometric survey of the sky.
- No child-user study has been run yet (planned at the local event; see
  `docs/CONNECTION.md` §6).

## Timing note for the team (Space Apps rules)

Space Apps requires the submission's work to be produced during the hackathon
weekend (Nov 14–15, 2026). Treat this repo as the **validated prototype and
test record**; run the final build, capture its screenshots/measurements and
compose the submission from/with it during the event itself, so what gets
submitted is demonstrably event-weekend work. The full challenge statement
(+ official data resources) publishes 28 Oct 2026 — re-read it against
`docs/CONNECTION.md` and update the mapping if the statement adds specific
asks.
