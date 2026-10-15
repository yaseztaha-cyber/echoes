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

## 6. STARFIELD — random points (NON-COMPLIANT)

- **Status:** `NON-COMPLIANT` with spec §18 (seeded PRNG sphere, 650 points, no catalogue)
- **Required:** astronomy-derived catalogue (Hipparcos or Bright Star Catalogue subset:
  RA/Dec → direction, magnitude → size/brightness, spectral class → tint), GPU point
  rendering, magnitude/exposure-driven visibility, spatially coherent under camera flight,
  no streaks outside a labelled artistic mode
- **Also required:** restrained Milky Way from a real survey (label survey vs naked-eye),
  deep-space objects only as deliberate, attributed targets

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
| Star catalogue | NON-COMPLIANT | Embed real catalogue subset; remove PRNG field |
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
the 4K TIFF, not the 2K JPEG).

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
