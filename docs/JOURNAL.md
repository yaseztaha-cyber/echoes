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
- **Tier-quality UX (against "it looks low-resolution" on mid GPUs)** —
  the adaptive stepper used to need p95 ≤ 9 ms for ~20 s to recover from a
  downgrade, which ordinary Windows+browsers GPUs never reach after one
  3-second dip → devices silently sat in the soft low/medium path
  (DPR 0.75–1, shadows off, no stream packs). Recovery band widened to
  ≤ 12 ms over ~10 s; DPR floors raised (high now 1.2–2.0, ultra 1.5–2.5 —
  the tier system was supersampling at 100% displays to ~1.0 backing store);
  the boot screen now points at SYS → QUALITY → ULTRA so the pack tiers
  (8K moon, 4K earth/mars, 6K Milky Way, 61,814-deep-star layer) are one
  click away and AUTO ADAPT can be turned off. Probes:
  `scripts/probe-quality.mjs` captures low vs ultra at the same view.
- **Ground tiering (phase 4)** — the site quadtree already varies resolution
  by camera distance (the "3 rings"); the missing piece was scatter cost:
  rock counts now scale with quality (35% low / 60% medium / 100% high),
  rocks stop casting shadows below high tier, and the scatter rng stream is
  exactly 5 rolls per rock (`rockScatter.ts`, locked by `rockScatter.test.ts`)
  so trimming never reshuffles the landscape a visitor already explored.
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

### Where verification stood at the end of the rich-universe phase (kept as recorded)
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

### Post-user-review pass (same phase, third session day)

User review flagged four concrete things; each got a fix, not a shrug:

- **"Cloud at the center of everything" at ultra** — diagnosed as two
  overlapping causes: the zodiacal haze disc (above) reading as a glow blob
  in the solar view, and the *single-mip q220 Milky Way band* whose flat
  ETC1S blockiness reads as blocky clouds on dark sky. BOTH removed:
  zodiacal haze deleted from `SolarSystem.tsx` (feature kept in git history,
  journal line kept for the record), and the band re-encoded at **qlevel
  255 with a full 13-level mip chain** (`fetch-hi-textures.mjs` now puts
  toktx options before files — options after files silently no-op'd;
  found because levelCount stayed 1 in the KTX2 header). Band pack:
  6000×3000, 13 mips, 3.26 MB; Mars pack also re-encoded with mips (1.71 MB).
- **"Why is Mars like that"** — the 4K Mars stream tier was the SVS GMM-3
  *topography composition* (false-color elevation rainbow), so the globe
  turned rainbow at high/ultra. Root cause: the fetch script targeted
  `mars_cyl_topo2.jpg` while the bundled 2K map is the USGS Viking MDIM 2.1
  photograph. Fixed at the source: the tier now encodes the **same
  photographic MDIM 2.1 build** the bundled map uses (`assets-hi/mars_4k.jpg`
  → `public/tex-hi/mars.ktx2`, 4096×2048, 13 mips, 1.71 MB); manifest
  record + provenance JSONs updated honestly (`mdim21_color`, gaps mention
  the replaced false-color tier). Headless ultra planet view now shows a
  recognizable photographic Mars (Valles Marineris visible).
- **SYS panel couldn't be closed** — Esc never touched it (panel open-flag
  lived in component state, invisible to the key chain; the hint said
  `ESC CLOSE` anyway — an honesty bug). The flag is now `sysOpen` in the
  store, Esc closes it first (before overlay/menu), and the panel has an
  explicit CLOSE button. Verified: press Esc → panel closes; CLOSE clicks
  → closes.
- **"Still the machine is blurry"** — the dynamic backing-store scaler kept
  trading pixels away whenever p95 sat in its 14–24 ms band, so ultra tier
  never *guaranteed* sharpness. Ultra now pins dpr = [2, 2] and the scaler
  is bypassed entirely at ultra (`World.tsx::DynamicScale`) — crispness is
  the contract there; the tier ladder stays the lever for weak GPUs. Also
  honest limit: on an integrated GPU ultra may drop frame *rate* — sharp
  and slow is still better than soft and fast for inspection work.

- Site look follow-up (same pass, second round): the rock scatter read as
  white confetti and the outcrop slabs as dropped dark boxes. The rocks'
  baked albedo (0.13 linear) was being lifted into the light by the site's
  dir 2.9 + warm hemisphere combo; now they bake darker and rust-leaning
  (0.045–0.095 linear, dust-tinted minority), squash lower, and the slabs
  are fewer (4), half-buried, tilted, and silhouette-sheared so they read as
  bedrock instead of dropped rectangles. The Sun read as a dirty beige ball:
  the photosphere now multiplies HDR (>1 color) so the disc clips toward
  white-hot with the HMI granulation only visible as mottling, plus a two
  layer additive glare (13/30 sprites, brighter core stops). Verified with
  `scripts/probe-sitefix.mjs` shots (sun close-up + site orbit + low-angle
  field view); tests 108/108.
- Headless (msedge 1600×1000, quality=ultra, auto-adapt off, zero
  console/page errors): solar ultra screenshot shows no center haze and a
  fine-grained band; `SYS` closes via both Esc and CLOSE; Mars travel pulls
  `/tex-hi/mars.ktx2` (ready, 1.71 MB) and the MilkyWay band tier reports
  ready at 3.26 MB; Mars planet view photographic; Mars cinematic site
  arrival frame shows warm rust-orange ground. New probes committed:
  `probe-pressfix.mjs`, `probe-marsfix.mjs`; `probe-zodiac.mjs` deleted with
  its feature.

- User round (fourth): "orbits true? distances? and a real sun". Planets now
  use **real Keplerian positions** — JPL Standish approximate elements
  (Table 1, 1800–2050, mean ecliptic of J2000) solved per epoch in
  `src/engine/frames/kepler.ts`; the old circular mean-longitude model only
  remains where it must: the Moon (visual orbit) and Pluto (also kept out of
  the table by JPL — read the page footnote). `frames.test.ts` semantics
  upgraded from "distance == a" to perihelion/aphelion bounds at each epoch's
  own elements + Kepler mean-r ≈ a property; new `kepler.test.ts` asserts
  actual heliocentric vectors against **JPL Horizons DE441 ground truth
  fetched via API** (Earth/Mars 2004-01-25, Jupiter 2026-10-23) inside the
  published error bars (Earth ≈ 2e-5 AU at the anchor). Orbit lines are now
  true ellipses with inclination-driven out-of-plane Y (small, honest).
  Distance panels show live solar-system truth: Earth 0.99 AU in late
  October, Jupiter 5.28 — nothing pinned to round numbers. UI honesty labels
  updated (Keplerian JPL approx. elements · DE441-verified). The Sun texture
  is now a **real** SDO/HMI 4096 continuum (HMIIC, retrieved 2026-10-23,
  embedded UT timestamp) reprojected to an equirectangular photosphere by
  `scripts/build-sun-map.py` (inverse-ortho disk detect + bilinear; far side
  mirrored with a brightness fade, ±7.25° P-angle left as published and
  documented). Verified: seam-free white-hot disc, spot groups visible,
  elliptic orbit lines, labels updated; tests 119/119, tsc clean (both
  pre-existing warnings resolved), harness ERRORS none.

### THE SUN — extreme visual fidelity + Solar Layer Explorer

- **Renderer:** new `src/engine/solar-system/sun/` module (old flat disc + double
  sprite glow removed). Photosphere = 96×64 shader sphere sampling the real HMI
  continuum equirect; white-gold 4-stop ramp, continuum limb darkening, thin
  chromosphere rim, distance-gated granulation micro-mottle, in-shader ACES +
  sRGB (no double tone mapping). Glare = one soft sprite, fades out close.
- **Corona:** structured billboard sampling the LASCO C3 log-polar mask
  (visible annulus only, sweep-corrupted samples replaced, monotone radial
  falloff); world-anchored azimuth, distance-aware gain — restrained at
  overview (no giant grey oval), boosted on the CORONA layer, hidden before it
  floods close-ups. Plane extent 4.3 R☉ (was 7.0; user-directed shrink).
- **Solar Layer Explorer:** five layers (photosphere, chromosphere 304,
  corona 171, magnetic HMI LOS, motion dopplergram) with per-layer
  instrument/wavelength/class/legend/cannot-conclude text and observation
  stamps; EUV/magnetogram/doppler render as published (no ramp). `SolarScope`
  now shows seven flat channels (continuum, magnetogram, dopplergram, 304,
  171, 193, 211) with A/B compare against continuum.
- **Real detections:** `src/data/sunspots.json` (detected in the stored HMI
  snapshot) drives sphere-anchored markers; tapping opens a physics card and
  "COMPARE IN SOLAR SCIENCE". Marker visibility = distance gate + tangent-safe
  facing test (0.02) so limb spots stay tappable.
- **Pipeline:** `scripts/build-sun-channels.py` rebuilt with the three.js UV
  convention (`sample_dir`; near half u∈[0,0.5), u=0.25 = disk center) after
  the first convention was found mirrored on the sphere; far side = east-west
  mirror at 85%; photosphere asset is grayscale intensity only (no baked color
  or limb bleed); sunspot UVs use the matching formula.
- **Bug found and fixed:** r3f does not guarantee the `uniforms` prop object
  identity survives onto the created `ShaderMaterial` — per-frame mutations of
  the `useMemo` object silently no-op (disk rendered with default uniforms).
  All uniform writes now go through material refs (`matRef.current.uniforms`).
- **Verified:** headless probe (`scripts/probe-sun.mjs`, shots in gitignored
  `shotsun/`) — all five layers swap correctly, corona streamers visible,
  overview clean, spot card opens, ERRORS 0; tsc clean; vitest 119/119.

#### Surface look: user-selected artistic map (follow-up, same phase)

- **What changed:** the 3D photosphere now renders the user-supplied Solar
  System Scope solar map (`src/assets/tex/sun_sss.jpg`, 4096×2048, q90
  progressive re-encode, no resample and no colour edit) instead of the
  white-gold ramp over the HMI continuum. It reads orange/gold with dark active
  regions and bright flare patches, matching the reference the user pointed at.
- **Why a separate shader path:** the map already carries colour and
  granulation, so `uBaked` samples it as-is, adds physical limb darkening
  (`0.84 + 0.16·mu^0.45`), blends the outermost band to a flat warm limb colour
  (the last sphere rows squeeze the full texture width into a line and alias),
  and **skips ACES** so the artist palette is not re-graded. The `raw` (science
  channels as published) and white-gold ramp paths are unchanged.
- **Honesty:** this surface is `ARTISTIC VISUALIZATION — NOT AN OBSERVATION`
  (Solar System Scope, CC BY 4.0). Its granulation and active-region shapes are
  illustrative and may not be read as data for any date; the layer card says so
  and points at SOLAR SCIENCE, where the real 2026-10-23 HMI continuum is still
  shown as published. The sunspot markers remain that snapshot's real
  detections, projected onto the artistic map (their UVs land on dark-orange
  pixels in the map's active-region band).
- **Records:** new manifest entry `sun-surface-art-sss` (view `surface-art`,
  class VISUALIZATION, credit Solar System Scope CC BY 4.0);
  `sun-visible-recon` keeps the observed continuum record, so
  `globeAssetFor("sun")` still resolves to the science asset.
- **Known cosmetic limit:** a ~1 px darker pixel remains on the sun's
  silhouette against the bright Milky Way band. It reproduces with a flat
  magenta debug shader, with the corona billboard hidden, and with a flat sky,
  so it is a renderer/MSAA compositing artifact of the sphere edge rather than
  the texture or limb ramp. Left as-is; a sky-dome opaque-pass experiment
  changed nothing and was reverted.

### DEVICE NAVIGATION — final regression audit (separate work stream)

- **Reported symptom:** "transferring to a device unexpectedly returned the user
  to the Solar System."
- **Root cause (three defects, none of them in the device transfer itself):**
  (A) the journey-chapter branch in `transitionToJourneyChapter()` called
  `returnToSolarSystem()` + `focusBody("earth")` for pre-landing chapters and
  was guarded only for `scene === "site"` — i.e. exactly *not* while a
  transfer was in flight; the trigger was the MissionJourney overlay's
  100 ms delayed effect, which re-fired whenever the device id changed;
  (B) the guard was a hand-picked list of four event-type labels, so
  `deployment` / `discovery` / `milestone` / `traverse` fell through to a
  `goToArtifact()` default branch that could transfer across worlds;
  (C) multi-await navigation chains had no ownership, so two rapid device
  selections could interleave and leave the user in the Solar System or at
  the wrong device.
- **Fix (explicit policy, not a skipped call):** a journey chapter is a
  DOCUMENTARY — it updates the content and the timeline, and may move the
  camera *inside the site the user is already at*; it never changes the
  exploration location. Pre-landing chapters are classified from the mission's
  own dates (`isHistoricalChapter()`), not from a label list. The
  `returnToSolarSystem()` call was removed from the journey path entirely.
  Two-channel navigation tickets (navigation / chapter) stop a stale transfer
  from overwriting a newer selection and stop a documentary from cancelling a
  transfer. `MissionJourney` is keyed by device id, so a device change can no
  longer re-fire the previous device's choreography. Leaving a site now closes
  the journey overlay (while it is open the whole HUD is hidden).
- **Instrumentation:** `navTrace()` records every Solar System return with its
  reason and call stack; published on `window.__navTrace` with `?navtrace=1`.
- **Verified in the running app** (`http://localhost:5174/`, Playwright +
  Edge): 24 / 24 scenarios pass, three consecutive passes, 0 console errors,
  all 10 devices reachable through three entry points, cross-planet transfers
  end on the right world, rapid selections settle on the last request, and
  **zero** unexpected Solar System returns (the only recorded ones are the
  cross-planet frame hop and the HUD button the probe itself clicked).
- **Tests:** `src/engine/director.nav.test.ts` (19 new cases); 146 tests total,
  `tsc --noEmit` clean, production build succeeds. Full report:
  `ECHOES_DEVICE_NAVIGATION_FINAL_VERIFICATION.md`.

## Honesty ledger (what must NOT be oversold)

- Orbits are Keplerian (JPL approximate elements, DE441-verified to arcsec
  accuracy); display positions are explicitly **adjusted for navigation, not
  to scale** — labelled in-app. Moon keeps a visual orbit; Pluto keeps a
  circular approximation (excluded from the JPL table by choice).
- Spacecraft are **team reconstructions**, not NASA CAD; labelled in-app.
- Terrain relief is real where DEM exists (nine sites), visualized elsewhere.
- Milky Way band is a real photograph placed at its real galactic geometry —
  it is scenery for orientation, not a photometric survey of the sky.
- Sun photosphere is a real HMI continuum snapshot but its white-gold tone is
  a disclosed reconstruction (in-shader contrast stretch, measured p1–p95
  recorded); the far hemisphere is mirrored fill; the corona halo is a dated
  LASCO C3 observation rescaled to hug the limb (radial scale compressed).
  EUV/magnetogram/doppler layers are false-color or quantity maps, never
  naked-eye views — labelled per layer in-app.
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
