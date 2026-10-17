# PLANETARY ASSET AUDIT — ECHOES

Phase 1 of the Deep-Space Visual Fidelity & Adaptive Rendering Engine.
An asset is **APPROVED** only when provenance and technical properties are understood.
Status values: `APPROVED` · `PROVISIONAL` (usable, replace when able) · `MISSING` · `NON-COMPLIANT`.

Renderer baseline (verified in-tree): three.js 0.186.1 (WebGL2), React Three Fiber 9,
ACESFilmic tone mapping, manual quality tiers (ultra/high/medium/low) driving DPR and
shadows. No KTX2/Basis pipeline, no texture tile pyramid, no automatic adaptive quality.
`renderer.info` draw calls / triangles are already sampled (`engine/World.tsx` → Perf).
Terrain uses a procedural quadtree with quality budgets (`engine/terrain/Terrain.tsx`) —
elevation is **synthetic noise, not a real DEM** (see §8). Scene changes are discrete
swaps (solar → planet → site), not one continuous metric frame (see §9).

---

## 1. EARTH — `src/assets/tex/earth.jpg`

- **Celestial body:** Earth
- **Source organization:** three.js examples (secondhand copy; upstream derived from NASA Blue Marble)
- **Original title:** `earth_atmos_2048.jpg` (three.js repo, `examples/textures/planets/`)
- **Direct source URL:** https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg
- **Original pixel dimensions (as stored):** 2048 × 1024
- **Coverage / projection:** Global, equirectangular
- **Observation date:** Unknown (Blue Marble generation, not recorded with this file)
- **Spectral band:** Visible composite (unknown exact bands)
- **Classification:** Natural-color-ish composite; may include blended cloud/atmosphere treatment. Treat as **visualization, not a science product**
- **Gaps / reconstruction:** Baked-in processing unknown; cloud content unknown
- **ECHOES processing:** None (used as-is, sRGB, mipmapped)
- **Attribution:** "NASA Blue Marble via three.js examples" — upstream credit incomplete
- **Rendering use:** Solar-system globe + planet-scene globe (`engine/planets/Globe.tsx`)
- **Detail levels:** Single LOD only — visibly soft below ~orbit zoom
- **Limitations:** No cloud layer, no night lights, no DEM, secondhand provenance, single resolution
- **Status:** `PROVISIONAL`
- **Recommended replacement:** NASA Blue Marble Next Generation
  (https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/),
  full 21600 × 10800 + tiled derivatives; VIIRS Black Marble for night side;
  separate satellite cloud layer with recorded date/source

## 2. MOON — `src/assets/tex/moon.jpg`

- **Celestial body:** Moon
- **Source organization:** three.js examples (secondhand copy; upstream lunar mosaic of NASA origin)
- **Original title:** `moon_1024.jpg`
- **Direct source URL:** https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg
- **Original pixel dimensions (as stored):** 1024 × 512
- **Coverage / projection:** Global, equirectangular
- **Observation date:** Unknown
- **Classification:** Grayscale albedo mosaic (lander sites NOT marked in texture)
- **Gaps / reconstruction:** Unknown downsampling/processing chain
- **ECHOES processing:** None
- **Rendering use:** Solar-system + planet-scene globe; minimap equirect background
- **Detail levels:** Single LOD — soft at orbit zoom, no crater definition up close
- **Limitations:** 1024 px is far below what orbit views need; no elevation data; no landing-site markings in texture (sites are code-side markers — keep it that way)
- **Status:** `PROVISIONAL`
- **Recommended replacement:** LROC WAC CGI Moon Kit, NASA SVS 4720
  (https://svs.gsfc.nasa.gov/4720/) — color + displacement; LOLA/SELENE DEM
  (e.g. SLDEM2015) for elevation-aware terrain. Correctly: **no atmosphere** (already true in code)

## 3. MARS — `src/assets/tex/mars.jpg`

- **Celestial body:** Mars (flagship — highest replacement priority)
- **Source organization:** threex.planets repo (secondhand; Viking/MOLA-derived color map in wide circulation)
- **Original title:** `marsmap1k.jpg`
- **Direct source URL:** https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg
- **Original pixel dimensions (as stored):** 1000 × 500 (**not power-of-two** — fine under WebGL2 mipmapping, but flag for any custom mipmap/compression work)
- **Coverage / projection:** Global, equirectangular
- **Classification:** Color albedo map, Viking-era mosaic family
- **Gaps / reconstruction:** Processing chain undocumented; polar/terminator treatment unknown
- **ECHOES processing:** None (plus a `#d79a78` material tint in `Globe.tsx` to restore ochre)
- **Rendering use:** Solar-system + planet-scene globe; minimap equirect background
- **Detail levels:** Single LOD — the weakest link at regional zoom
- **Limitations:** Soft at any closer-than-hemisphere view; no elevation; mission sites are code markers, not in texture (correct — keep)
- **Status:** `PROVISIONAL`
- **Recommended replacement:** USGS Viking MDIM 2.1 colorized global mosaic (232 m)
  (https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m)
  + MOLA DEM for elevation; Mars Trek WMTS tiles (https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars)
  for the streaming pyramid; HiRISE/CTX via PDS for mission-site tiles

## 4. MERCURY / VENUS / JUPITER / SATURN / URANUS / NEPTUNE — no textures

- **Status:** `MISSING` (rendered as procedural band/clar colors in `Globe.tsx` `BandedGlobe`/`PlainGlobe`)
- **Policy per spec §6:** observation-based maps only; gas giants get atmospheric-band imagery, never rocky-surface treatment; incomplete coverage shown honestly and labelled
- **Candidate sources (to verify in Phase 4):** MESSENGER MDIS global mosaic (Mercury, USGS);
  Magellan SAR mosaic (Venus — radar grayscale, must never be presented as true color);
  Cassini / JunoCam / Voyager composites for the giants (verify each map is data, not the
  widely circulated artistic Saturn maps the spec warns about); Pluto: New Horizons LORRI/MVIC mosaic
- **Rule:** every giant-planet texture gets `REAL / RECONSTRUCTED / VISUALIZATION` labelling
  through the existing provenance UI before it ships

## 5. SUN — no solar imagery

- **Status:** `MISSING` (flat `#fff1d0` disc + sprite glow, `SolarSystem.tsx` `Sun`)
- **Required:** SDO full-disk (~4K) with recorded channel + timestamp
  (https://sdo.gsfc.nasa.gov/data/dataaccess.php); visible-light vs false-color channels
  must be labelled and never conflated; corona/glare exposure-dependent, not permanent neon
- **Note:** a prior enhancement attempt (granulation + corona shaders) was reverted by
  direction; any new sun work follows this audit + the wavelength-mode rules in spec §7

## 6. STARFIELD — real catalogue excerpt (COMPLIANT)

- **Status:** `COMPLIANT` with spec §18. `src/data/stars/starCatalog.ts` embeds 5,070
  naked-eye stars (Vmag ≤ 6.0) generated from HYG v4.4 (Hipparcos + Yale Bright Star +
  Gliese merge, https://codeberg.org/astronexus/hyg, CC BY-SA 4.0; generator script
  `scripts/generate-star-catalog.mjs` kept in-repo; filter: mag ≤ 6.0, Sun dropped,
  brightest-first sort, RA converted hours→degrees).
- **Mapping (spec-required chain):** ICRS/J2000 RA/Dec → unit direction in the ECHOES
  frame (equatorial → rotate by ecliptic obliquity 23.439° → Y-up/ecliptic-XZ basis;
  `starDirection`); apparent magnitude → relative flux 10^(−0.4 m) with gamma 0.55
  compression (`starBrightness`) drives both brightness and point size; color index
  B−V → temperature (Ballesteros 2012, anchored at B−V 0.656 → 5,778 K) → blackbody RGB
  (Tanner Helland approximation) provides the spectral tint (`kelvinToRgb`).
- **GPU rendering:** custom `ShaderMaterial` point list (additive, depth-tested, no
  depth write), per-vertex size + color attributes, `uDim` exposure each frame,
  `uPixelRatio` DPR-aware. Draw calls: 1. Follows the camera (no parallax) and is
  spatially coherent (positions are fixed catalogue directions, and the mag-sorted
  excerpt keeps real Milky Way band overrepresentation — locked by test).
- **No streaks, no dust, no artistic sharpening.** Sky density stays derived from
  catalogue distributions, not decorative noise.
- **Remaining (deferred):** survey-built fainter Milky Way layer (must be labelled
  survey vs naked-eye) and deep-space objects (only as deliberate, attributed targets).

## 7. MISSION PHOTOGRAPHY — `src/assets/nasa/PIA*.jpg` — APPROVED (with note)

- PIA05273 (1280×679), PIA06263 (1024×1024), PIA07372 (1280×1160), PIA08812 (1176×942),
  PIA15091 (862×647), PIA17759 (1280×1041), PIA17074 + fig1 (1024×1024)
- **Source:** `assets.science.nasa.gov` 1280px renditions of Photojournal records,
  credits per file (NASA/JPL-Caltech et al.), record URLs in `data/media/index.ts`
- **Classification:** Real NASA imagery at **web-rendition resolution, not archival
  full-resolution** (TIFFs available at Photojournal; fetch on demand, do not bundle)
- **Status:** `APPROVED` for in-app archive use

## 8. TERRAIN ELEVATION — synthetic (must not be mistaken for data)

- `engine/terrain/height.ts` + `Terrain.tsx` generateInvoker: seeded value-noise heightfield.
  It is **not** MOLA, LOLA, or any DEM. It must never be described as measured terrain.
- Milestone rule: mission-site terrain work (Phase 9) replaces/augments this with real
  elevation (MOLA/HiRISE DTM, LOLA) while keeping the noise field only where no data
  exists — and the UI must say which is which (existing `DataResolution` component).

## 9. COORDINATE / SCALE SYSTEM — current state (input to Phase 2)

- Positions are **visual, not metric**: `ORBIT_K * sqrt(AU)` orbits, exaggerated body radii,
  scene swaps (solar → planet → site) with matched apparent size, mission sites in local
  metre frames. Correct for navigation; must stay explicitly separated from real
  measurements (km/AU shown in telemetry come from `realPos`, good — keep that split).
- Gaps vs spec §15–16: no hierarchical frames, no floating-origin rebasing, far plane
  30000 with three scenes instead. Phase 2 must design frames without breaking the
  director's spatial-continuity transitions.

## 10. PERFORMANCE BASELINE — current state (input to Phases 7/10)

- Manual presets only (ultra/high/medium/low → DPR, shadows, terrain depth, counts).
  Target metrics already sampled: FPS + draw calls + triangles (`tele`, `DevPanel`).
- Missing: frame-time percentiles, texture-memory estimates, tile stats, adaptive
  auto-quality with hysteresis, dynamic render scale, KTX2 pipeline, residency manager.
- Standing rule (§14): presets may shed detail but never range, bodies, markers, or travel continuity.

---

## APPROVAL LEDGER

| Asset | Status | Next action |
|---|---|---|
| earth.jpg | PROVISIONAL | Replace with BMNG (+tiles); add clouds/night as separate labelled layers |
| moon.jpg | PROVISIONAL | Replace with SVS 4720 kit + DEM |
| mars.jpg | PROVISIONAL (priority) | Replace with MDIM 2.1 + MOLA; Trek tiles for streaming |
| Giants/Pluto | MISSING | Verify data (not artistic) maps per body; label class |
| Sun imagery | MISSING | SDO channel set + wavelength-mode UI rules |
| Star catalogue | COMPLIANT | HYG v4.4 naked-eye excerpt embedded (5,070 stars, CC BY-SA, RA/Dec→dir, mag→size, B−V→tint); PRNG field removed |
| PIA archive | APPROVED (web rendition) | Fetch full-res on demand only |
| Terrain DEM | SYNTHETIC (labelled) | Real DEM at mission sites (Phase 9) |

No asset above may be described in-app at a resolution or fidelity beyond what this
document records. Globe textures are single-LOD visualization aids until the Phase 5
streaming pyramid lands.

---

## PHASE 3 — REPLACEMENT RECORD (verified, committed)

Machine manifest: `src/data/assets/manifest.ts`. Pipeline: `scripts/build-globes.py`
(verify → LANCZOS downsample → sRGB JPEG q90; 2048×1024 bundled + 4096×2048 hi-res
retained in git-ignored `assets-hi/`; no upscaling anywhere — moon hi-res comes from
the 4K TIFF, not the 2K JPEG.
**Runtime hi-res delivery removed per spec §2 (1080p budget): `public/tex-hi/`
deleted, `HI_URLS` emptied, manifest `hiresUrl` fields dropped — 2048×1024 is now
the terminal global-map tier by design.** The 4K originals stay in git-ignored
`assets-hi/` as provenance sources and are NOT deployed.

- **earth.jpg ← BMNG topo.bathy Dec 2004, 5400×2700.** Orientation cross-checked
  against prior map: 0.0° shift, corr 0.93. Seasonal (December) composite — recorded,
  not mixed silently.
- **moon.jpg ← SVS CGI Moon Kit 2025 color, 4K TIFF.** Orientation ~0° shift.
  Polar fill is LDAM laser albedo; map is aesthetics-optimized per SVS, not science
  data. Displacement (LOLA) deliberately NOT wired — later phase.
- **mars.jpg ← USGS MDIM 2.1 color mosaic, 21339×10670.** Orientation verified by
  feature check (Syrtis Major 72.5°E, Hellas 71.2°E). The legacy 1000×500 texture
  was 180° shifted — Mars markers previously sat on the wrong hemisphere; fixed.
- Renderer: `Globe` now sets `SRGBColorSpace` (was linear — color was wrong) and the
  `#d79a78` Mars repaint tint was removed (calibrated maps are not repainted).
- KTX2 evaluated and deferred: needs a ~500 KB WASM transcoder plus async loader
  rework and non-inlined hosting, which conflicts with the single-file build; JPEG +
  mipmaps chosen with rationale. Revisit with the residency manager (later phase).
- Bundle impact: dist/index.html 6.37 MB → ~7.3 MB expected (three 0.5–0.7 MB JPEGs
  inlined as base64). No runtime behavior change besides sharper globes.

| Asset | Was | Now |
|---|---|---|
| earth.jpg | PROVISIONAL (three.js copy) | APPROVED `earth-bmng-2004` |
| moon.jpg | PROVISIONAL (three.js copy) | APPROVED `moon-lroc-2025` |
| mars.jpg | PROVISIONAL (1000×500, 180° off) | APPROVED `mars-mdim21` |

---

## PHASE 3b — COMPLETE SYSTEM RECORD (verified, committed)

Machine manifest: `src/data/assets/manifest.ts` (15 records). Pipeline:
`scripts/build-system.py` (verify → deliver native, downsample only; hi-res only
where the source supports it). Renderer: `Globe` kind union extended; per-body `tex`
in `model.ts`; Venus surface/clouds switch (`venusView`); Pluto added as a dwarf
planet entry (JPL Keplerian circular approx, a=39.482, L0=238.9 — orbit line + label
automatic, UI names it DWARF PLANET); Saturn rings set to documented 1.24–2.27R with
representative shading note; Sun sphere uses the RECONSTRUCTED granulation with a
dedicated SolarScope science view for flat SDO records.

Orientation verification method: three.js sphere UV gives left edge = ±180° with
`lon = x/W·360−180`. Cross-checked per map: Earth 0.0° (corr 0.93), Moon ~0°,
Mars via Syrtis Major 72.5°E + Hellas 71.2°E, Venus radar via Maxwell Montes 2.0°E
(vs 3°E documented). Zonal giants assume the same JPL tmaps convention (sibling
products of the verified Venus map); discrete-storm alignment on Jupiter is
approximate — recorded, not claimed.

| Body | Record | Class | Source → delivered |
|---|---|---|---|
| Mercury | `mercury-mdis-bdr` | MOSAIC (750nm mono) | MESSENGER BDR 1024×512 → native |
| Venus surface | `venus-magellan` | MOSAIC (RADAR, not a photo) | Magellan 1440×720 → native |
| Venus clouds | `venus-clouds-rep` | REPRESENTATIVE (fictitious) | JPL 1440×720 → native |
| Jupiter | `jupiter-voyager` | MOSAIC (1979 epoch, storms drift) | Voyager 720×360 → native |
| Saturn | `saturn-rep` | REPRESENTATIVE (fictitious globe) | JPL 720×360 → native |
| Uranus | `uranus-rep` | REPRESENTATIVE (fictional) | JPL 720×360 → native |
| Neptune | `neptune-rep` | REPRESENTATIVE (fictional, no GDS claim) | JPL 720×360 → native |
| Pluto (dwarf) | `pluto-nh-mosaic` | MOSAIC (LORRI 300m; S-pole night black) | USGS 24888×12444 → 2048 + 4K hi |
| Sun visible | `sun-visible-recon` | RECONSTRUCTED (HMI-derived, method filed) | HMI 1024 → 1024×512 (no fake detail) |
| Sun 304/193/HMI | `sun-aia304/193/hmi-flat` | OBSERVED flat full-disk (false-color labelled) | SDO 1024 → native |

Deliberate non-upgrades (spec §15, §29): small maps delivered native — a 720px
Voyager Jupiter is honest; upscaling it to 2K would be the exact fabrication the
spec forbids. Hi-res streaming remains a later phase. No procedural planet
placeholders remain: every globe is a sourced map or a labelled representative.

---

## PHASE 4 — ADAPTIVE ENGINE RECORD

- Stages A→C per body by screen fraction with hysteresis (no flapping);
  D/E remain planet/site scenes. `src/engine/lod/stages.ts`.
- Residency manager: dedup, priority, LRU eviction, refcount + pin protection,
  failure retry, cancel. Fallbacks stay on `useTexture` (always resident, never
  blank). 96 MiB cap ≈ two 4K chains. `src/engine/textures/`.
- Hi-res delivery: **REMOVED (spec §2)**. Formerly `public/tex-hi/` 4K for
  earth/moon/mars/pluto; stage-C fetch path is now inert (`HI_URLS = {}`). Small
  maps keep their earlier decision — recorded, not upscaled.
- Adaptive stepper: p95-driven, ~3 s to step down, ~20 s to recover toward the
  user's ceiling, 5 s cooldown, single-tier moves. Drives the existing quality
  tiers (= DPR + shadows + terrain + hi-res eligibility), so dynamic render
  resolution is bounded and visibility never changes. Manual pick sets the
  ceiling; AUTO toggle in Settings. DevPanel shows p95, residency, estimate.
- Jupiter Cassini upgrade attempted and declined: Jónsson path 404, PIA direct
  dead — Voyager 720px stands with epoch label. Saturn/Uranus/Neptune authentic
  observation mode deferred to the archive phase (recorded, not silently dropped).
- KTX2 re-confirmed deferred (single-file conflict stands).
- Benchmarks: `docs/RENDERING_BENCHMARKS.md` — static budgets measured, camera
  paths defined, in-browser numbers pending a GPU machine (stated, not claimed).

---

## PHASE 4.1 — VALIDATION RECORD (real browser, real GPU)

- Test rig: Windows, Intel HD Graphics 530 via ANGLE/D3D11, Playwright Chromium,
  DPR 1.25, `high` preset with auto-quality ON. MAX_TEXTURE_SIZE 16384.
- Measured: solar overview 60.4 FPS (p95 16.8 ms, p99 18.5); Mars close orbit
  60.1 FPS (p95 17.0, p99 19.7); Opportunity site 60.2 FPS (p95 16.8, p99 17.6).
- Full journey replayed by automation: boot → ENTER → Mars focus → orbit →
  site select → descend → site. No position jumps, no blank globes, markers
  aligned (Opportunity panel shows documented 1.9462°S 354.4734°E).
- Console: 0 application errors. Upstream THREE.Clock deprecation noted, not ours.
- Jupiter decision: NASA Cassini globe (Dec 7 2000, ~144 km/px, NASA/JPL/Univ. of
  Arizona) evaluated — the downloadable is a perspective globe RENDER, not the
  cylindrical map. Wrapping it as an equirectangular texture would violate the
  false-mapping rule, so Voyager 720px stands with its 1979-epoch label. The
  CICLOPS gallery is recorded as the on-demand observation path
  (https://ciclops.org/view/92/).
- Saturn/Uranus/Neptune authentic observation views: deferred to the archive
  phase, which owns image-viewer infrastructure — recorded, not silently dropped.
- Defect fixed: ReplayCard overlapped the site minimap on short viewports.
  First enforced zone rule — one contextual panel per zone; the minimap yields
  while the event card is open and returns on close (no z-index change).
- Favicon 404 fixed with an inline SVG data-URI (zero bundle cost).

---

## PHASE 4.2 — FIDELITY RECOVERY RECORD

Defect → cause → fix (all confirmed in code and/or running app):

1. Diagonal boundary + triangular facets at range → LOD steps at depth borders
   (no stitching) + 0.05-depth skirts reading as dark bands + a horizontal-only
   split metric that refined to maxDepth even from 20 km up. Fixed: 3D-aware
   metric (altitude-weighted), skirts 0.015/min 0.6.
2. Orange wash at distance → FogExp2 0.000042 (≈75% opaque at 28 km) + warm
   hemisphere 0.55. Fixed: fog 0.00002, hemisphere 0.38 cooled. Cause found by
   reading values, not by filtering the output.
3. Flat/repetitive ground → widened large-scale albedo variation + basalt-patch
   contrast in vertex colors.
4. No rocks → RockField: 240 instanced rocks + 5 outcrop slabs, labelled
   RECONSTRUCTED scatter (representative density/size, not surveyed positions).
5. "28.4 vs 28.2" → ALT (vertical) vs DIST (slant range): both correct, both
   from tele. Clarified with live proximity-state labels.
6. "MISSION SITE" at 28 km → arrival banner renamed MISSION REGION + live
   Beacon states (PLANETARY/REGIONAL/MISSION SITE/ROVER INSPECTION at
   5000/500/40 m — navigation settings, tested).
7. Primitive rover → official NASA MER_static.glb (11.9 MB, CORS *, runtime
   load, primitive Suspense fallback + error boundary). Orientation
   bounds-verified (2.28 m wingspan, mast maps ≈10 cm from Pancam mount);
   stowed-arm hotspot caveat documented. Opportunity + Spirit now OFFICIAL.
8. Black rover/rocks → missing environment reflections on PBR metals
   (RoomEnvironment PMREM, intensity 0.5) + instanceColor double-darkening fix.
9. Panorama Mode A → PIA05138 Eagle-crater 360° grayscale + cylindrical viewer
   overlay with metadata. Location-correct; not a navigable reconstruction.
10. Process: an edit-tool fuzzy match deleted a SiteScene import (caught by the
    browser, fixed); `tsc --noEmit` added to the validation flow (2 pre-existing
    unused-var errors recorded, untouched).
11. Approach-sharpness pass (user QA: blurry globes on approach/planet view,
    diving/floating hardware, rocks crowding devices): hi-res engages from 12%
    screen fraction (was 22%), destination 4K prefetched at travel commit,
    planet scene uses the same hi-res upgrade; footprint grounding (max-sample
    + tilt + soil settle) replaces the burying minimum-sample rule for every
    landed frame; rock clearing 12 m around devices. (Prior aerial-fog change
    was reverted on request; range seams remain open.)
13. Tile-crack root fix (replaces fog approach): neighbor-aware edge stitching
    in the terrain quadtree. Tiles query the drawn neighbor layout per frame;
    edges facing coarser neighbors snap odd vertices onto the coarse segment
    (watertight to ~0.1 micron, tested); same-depth/finer neighbors already
    coincide. Snap flags ride the cache keys with ancestor-backdrop fallback,
    so coverage never holes. Skirts stay as insurance. Depth jumps >1 across
    one edge remain a documented residual.
14. Streaming-churn fix (user QA: white-out arrival + stuck 124/248 + drops):
    far tiles (dist ≥ size×8) build unsnapped once and never refresh; new
    coverage wins the whole build budget while snap refresh is capped at
    2/frame near-only. Plus GPU context lost/restored detection with a plain
    recovery message instead of a mystifying white canvas.
