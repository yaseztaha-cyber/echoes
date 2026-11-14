# ECHOES — SOLAR SYSTEM & ENVIRONMENT AUDIT

**Date:** 2026-11-13 · **Scope:** every celestial body and every planetary
environment implemented in ECHOES.

---

## 1. Celestial-body inventory

From `src/engine/solar-system/model.ts` (single authoritative registry):

| id | Name | Kind | Semi-major axis (AU, real) | Period (d, real) | Real radius (km) | Render radius (scene units) | Texture | Notes |
|---|---|---|---|---|---|---|---|---|
| sun | SUN | star | 0 | — | 695 700 | 2.4 | `sun.jpg` + 4 SDO science channels | dedicated solar renderer |
| mercury | MERCURY | planet | 0.387 | 87.97 | 2 439.7 | 0.35 | `mercury.jpg` | MESSENGER-derived map |
| venus | VENUS | planet | 0.723 | 224.7 | 6 051.8 | 0.80 | `venus.jpg` (+ `venus_clouds.jpg`) | radar surface / cloud modes |
| earth | EARTH | planet | 1.000 | 365.256 | 6 371 | 0.85 | `earth.jpg` + night + clouds | Blue Marble base |
| moon | MOON | moon (parent: earth) | — | 27.32 | 1 737.4 | 0.23 | `moon.jpg` | LROC mosaic |
| mars | MARS | planet | 1.524 | 686.98 | 3 389.5 | 0.60 | `mars.jpg` | Viking MDIM colour mosaic |
| jupiter | JUPITER | planet | 5.203 | 4 332.59 | 69 911 | 3.00 | `jupiter.jpg` | |
| saturn | SATURN | planet | 9.537 | 10 759.22 | 58 232 | 2.50 | `saturn.jpg` | ring present |
| uranus | URANUS | planet | 19.19 | 30 688.5 | 25 362 | 1.50 | `uranus.jpg` | |
| neptune | NEPTUNE | planet | 30.07 | 60 182 | 24 622 | 1.40 | `neptune.jpg` | |
| pluto | PLUTO | planet (dwarf flag) | 39.482 | 90 560 | 1 188.3 | 0.35 | `pluto.jpg` | circular approximation — documented in the source |

**Scale honesty:** the render radii are deliberately exaggerated relative to the
real radii (Jupiter is 11× Earth in reality but 3.5× in scene units) so the
bodies remain distinguishable at solar-system scale. The app states this in the
interface ("VISUAL SCALE ADJUSTED — COMPRESSED VALUES ARE LABELLED") and keeps
the true values in the SCI layer for every measurement. No claim of true scale
is made anywhere.

**Orbits:** heliocentric positions come from JPL approximate Keplerian elements
(`src/engine/frames/kepler.ts`, DE441-verified per the source comments). Pluto
and the Moon use documented circular approximations and say so in the code.

---

## 2. Findings

| # | Area | Finding | Status |
|---|---|---|---|
| E1 | Texture assignment | every body maps to its own texture file; no body borrows another's map | VERIFIED (code + screenshots) |
| E2 | Texture resolution | global maps are 1K–2K class (`src/assets/tex/*.jpg`); 4K-class KTX2 variants exist for earth/mars/moon/milkyway and are streamed on demand (`public/tex-hi/`) | VERIFIED |
| E3 | Missing maps | none of the twelve bodies lacks a map | VERIFIED |
| E4 | Cloud behaviour | Earth and Venus carry separate cloud layers; the surface/cloud distinction is exposed as a user-selectable view (radar surface vs cloud-covered for Venus) | VERIFIED |
| E5 | Night lights | Earth has a night-lights layer | VERIFIED |
| E6 | Rings | Saturn's ring is present in the registry (`ring: true`) | VERIFIED |
| E7 | Moons | only the Moon is implemented as a satellite (parent: earth); the other moons of the outer planets are **not** modelled | NOT IMPLEMENTED — stated here rather than implied |
| E8 | Axial tilt / rotation | axial tilt is not applied per body in the renderer; bodies do not visibly spin | LIMITED — rotation is a presentation gap, not a scientific error |
| E9 | Camera near/far | near 0.01 / far 30 000 with a floating-origin rebase; verified at both solar-system and planetary scale | VERIFIED (browser) |
| E10 | Overlap | no body overlap observed during the body tour (all ten bodies focus correctly, camera framing correct) | VERIFIED (browser) |
| E11 | Body selection | selection, focus, travel and return all work for every body | VERIFIED (browser) |

---

## 3. Planetary environments

Two kinds of environment exist:

1. **The globe** — a body viewed from orbit: real texture, atmosphere/fog, the
   sun-direction rig, the terminator, and the navigation overlay (labels,
   minimap, telemetry).
2. **The site** — a mission site on the surface: DEM-backed terrain
   (`src/engine/terrain/dem.ts`, MOLA for Mars, LOLA for the Moon), a rock and
   slab scatter, the spacecraft model, the mission route with its waypoint
   markers, the arrival choreography, the beacon and the site vignette.

| Environment | Terrain source | Verified |
|---|---|---|
| Mars (Opportunity, Spirit, Sojourner, InSight) | MOLA DEM at the site, procedural detail around it | browser: all four sites entered, terrain renders, DEM note shown in the HUD ("MOLA DEM ACTIVE · 463 m NATIVE / 116 m SHOWN") |
| Moon (Apollo 12/14/15/16/17) | LOLA DEM at each landing site | browser: sites entered, "LOLA DEM ACTIVE" note shown |
| Earth, Venus, Mercury, gas/ice giants, Pluto | orbit only — no surface site (no mission landed there in this product) | VERIFIED |

**Honesty note carried in the product:** the DEM note states the native
resolution and the displayed resolution, and the reconstructed spacecraft,
terrain and camera are labelled as reconstructions at the site.

---

## 4. Texture provenance

| Texture | Source | Class |
|---|---|---|
| `earth.jpg` | NASA Blue Marble (visibleearth.nasa.gov) | real imagery |
| `earth_night.jpg` | NASA Earth Observatory | real imagery |
| `earth_clouds.jpg` | NASA | real imagery |
| `moon.jpg` | NASA Scientific Visualization Studio — CGI Moon Kit (LROC) | real imagery |
| `mars.jpg` | USGS/NASA — Viking MDIM 2.1 colourised mosaic | real imagery, colourised global map |
| `mercury.jpg`, `venus.jpg`, `venus_clouds.jpg`, `jupiter.jpg`, `saturn.jpg`, `uranus.jpg`, `neptune.jpg`, `pluto.jpg` | NASA/JPL public-domain planetary maps | real imagery / processed maps |
| `sun.jpg` + `sun_hmi/0304/0171/0211/doppler` | SDO/AIA + HMI full-disk products | real observations |
| `sun_sss.jpg` | Solar System Scope artist map (CC BY 4.0) | **ARTISTIC VISUALIZATION — NOT AN OBSERVATION** (labelled as such in the product) |
| `public/tex-hi/*.ktx2` | transcoded from the above | compressed delivery of the same imagery |
| `corona_mask.png` | LASCO C3 log-polar structure | derived from real observations |

The artistic solar map is the only non-observational image in the product and it
is explicitly labelled in the layer panel and in the manifest record
(`sun-surface-art-sss`, class VISUALIZATION).

---

## 5. What was verified in the browser

The release probe (`scripts/probe-release.mjs`) focuses all ten bodies in the
NAVIGATE grid and records the resulting state; screenshots are in
`shotsrelease/`. Results: `BROWSER_VERIFICATION_REPORT.md`.

---

## 6. Open items

| # | Item | Status | Why it is not a bug |
|---|---|---|---|
| O1 | Other moons (Europa, Titan, Triton…) are not modelled | NOT IMPLEMENTED | No mission in ECHOES landed or orbited them; adding bodies without missions would be decoration |
| O2 | Axial tilt and spin are not rendered | LIMITED | Presentation gap; the orbital model itself is correct and the products are not sold as tidally locked |
| O3 | Global maps are 1K–2K class | LIMITED | The Ultra tier streams 4K KTX2 for earth/mars/moon; the remaining bodies have no higher-resolution source in the project |
