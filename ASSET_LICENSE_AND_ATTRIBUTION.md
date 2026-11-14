# ECHOES — ASSET LICENCE & ATTRIBUTION REGISTER

**Date:** 2026-11-13 · **Scope:** every third-party asset, library, font and
external service used by ECHOES.

ECHOES does not claim endorsement by or affiliation with NASA. NASA imagery and
media are generally not copyrighted, but NASA requests that the source and the
creator be credited; peer-reviewed literature is cited by DOI. The product
carries a credit line for every image it shows.

---

## 1. Imagery and textures

| Asset | Where it appears | Creator / publisher | Source URL | Licence / terms | Modified? | Attribution shown in product |
|---|---|---|---|---|---|---|
| `src/assets/tex/earth.jpg` | Earth globe | NASA Earth Observatory (Blue Marble) | https://visibleearth.nasa.gov/images/57752/blue-marble-land-surface-shallow-water-and-shaded-topography | Public domain (NASA) | cropped/resampled to 2K | yes — GROUND TRUTH panel |
| `earth_night.jpg` | Earth night side | NASA Earth Observatory | https://earthobservatory.nasa.gov/ | Public domain | resampled | yes |
| `earth_clouds.jpg` | Earth cloud layer | NASA | https://visibleearth.nasa.gov/ | Public domain | resampled | yes |
| `moon.jpg` | Moon globe | NASA Scientific Visualization Studio (CGI Moon Kit, LROC) | https://svs.gsfc.nasa.gov/4720/ | Public domain | resampled | yes |
| `mars.jpg` | Mars globe | USGS Astrogeology / NASA Ames (Viking MDIM 2.1 colour mosaic) | https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m | Public domain (USGS/NASA) | colourised mosaic, resampled | yes (labelled colourised global mosaic) |
| `mercury.jpg`, `venus.jpg`, `venus_clouds.jpg`, `jupiter.jpg`, `saturn.jpg`, `uranus.jpg`, `neptune.jpg`, `pluto.jpg` | planetary globes | NASA / JPL-Caltech | https://science.nasa.gov/ | Public domain | resampled to 2K | yes |
| `sun.jpg`, `sun_hmi.jpg`, `sun_0304.jpg`, `sun_0171.jpg`, `sun_0211.jpg`, `sun_doppler.jpg` | Solar layer explorer | NASA SDO (AIA 304/171/211, HMI) | https://sdo.gsfc.nasa.gov/ | Public domain; NASA credit requested | resampled to equirect | yes — every layer names its instrument |
| `sun_sss.jpg` | Solar layer explorer (default surface) | **Solar System Scope** (artist) | https://www.solarsystemscope.com/textures/ | **CC BY 4.0** | re-encoded only (q90, no resample, no colour change) | yes — the layer is labelled **ARTISTIC VISUALIZATION — NOT AN OBSERVATION (CC BY 4.0)** |
| `public/tex-hi/*.ktx2` | Ultra-tier planet maps | transcoded from the above | — | inherits the source terms | transcoded to KTX2/Basis | yes |
| `public/tex-hi/milkyway.ktx2` | sky dome | ESO / S. Brunier | credited in the source record | CC BY 4.0 (per the source credit) | transcoded | yes |
| `corona_mask.png` + `src/data/corona.json` | corona structure | derived from NASA LASCO C3 | https://science.nasa.gov/mission/solar-observatory/ | Public domain | log-polar resample of real observations | yes |
| `src/assets/tex/sunspots.json` | sunspot markers | SDO/HMI continuum detection (local) | https://sdo.gsfc.nasa.gov/ | Public domain | detected locally from the stored HMI disk | yes |

## 2. Mission imagery inside the MER-B documentary

The MER-B cinematic journey (`src/missions/merb`) streams archival media from
the NASA Image and Video Library and archive.org. Every record carries its own
`credit`, `date`, `caption` and `sourcePage`, and the film shows the credit
line on each plate. The manifest was generated and verified by the delivered
prototype's own tool (`tools/build-media.mjs`, NASA Image and Video Library API).

| Media | Credit shown |
|---|---|
| NASA photographs (PIA…) | NASA / JPL-Caltech / Cornell / ASU as recorded per plate |
| NASA TV features | NASA / NASA TV, with the audio policy noted |
| MER mission animation | NASA / JPL-Caltech (artist's concept — labelled as such) |
| Launch tracker tape, AVC-2003-175-1 | NASA/JPL-Caltech, Mars Outreach video file MER-2003-1020 (archive.org) |

## 3. Spacecraft models

| Model | Where | Source | Terms |
|---|---|---|---|
| `MER_static.glb` | Opportunity and Spirit | NASA 3D Resources — https://science.nasa.gov/resource/mars-exploration-rovers-3d-model/ | NASA media, public domain, credit requested |
| Sojourner, InSight, Apollo LM + LRV, Voyager 1 | their sites | **reconstructed in-project** from published dimensions | original work; labelled RECONSTRUCTED in the product |

## 4. Fonts

| Font | Use | Source | Licence |
|---|---|---|---|
| IBM Plex Sans | body text | Google Fonts (Google) | SIL Open Font License 1.1 |
| IBM Plex Mono | all instrument/label typography | Google Fonts (Google) | SIL Open Font License 1.1 |
| serif stack for the documentary's editorial titles | system serif | — | — |

Both are loaded from Google Fonts with system fallbacks; no font files are
redistributed in the repository.

## 5. Audio

| Asset | Nature | Terms |
|---|---|---|
| ECHOES interface audio | **generated** in the browser (Web Audio) — clicks, confirm tones, ambience | original, no recording |
| Mars wind stand-in / in-suit pulse | **generated** (filtered noise / oscillator), labelled as a stand-in in the UI | original |
| NASA/JPL launch tape audio inside the documentary | archival, streamed from archive.org | public domain, credited |
| NASA TV feature narration (muted by policy) | archival | public domain, credited |

## 6. Libraries

| Package | Licence |
|---|---|
| react, react-dom | MIT |
| three | MIT |
| @react-three/fiber, @react-three/drei | MIT |
| zustand | MIT |
| clsx | MIT |
| tailwind-merge | MIT |
| vite, @vitejs/plugin-react, vite-plugin-singlefile | MIT |
| typescript | Apache-2.0 |
| vitest | MIT |
| playwright-core | Apache-2.0 |
| tailwindcss | MIT |

## 7. Data and text

| Item | Source | Terms |
|---|---|---|
| Keplerian orbital elements | JPL approximate elements (documented in `src/engine/frames/kepler.ts`) | public domain |
| Star catalogue | Gaia-derived catalogue compiled in-project (`src/data/stars/`) | ESA/Gaia credit recorded in the source notes |
| Mission narrative text | written for this project from the cited sources | original; claims traceable via `MISSION_SOURCE_REGISTER.md` |
| Peer-reviewed claims | Squyres 2004/2012, Klingelhofer 2004, Rieder 2004, Grotzinger 2005, Arvidson 2014, Squyres 2008, Stähler 2021, Stone 2013, Gurnett 2013, Langseth 1976 | cited by DOI in `src/data/sources/index.ts` |

---

## 8. Obligations the product must keep

1. Keep the credit line on every image, plate and video the product shows.
2. Keep the "ARTISTIC VISUALIZATION — NOT AN OBSERVATION" label on the
   Solar System Scope solar map, and keep the CC BY 4.0 attribution next to it.
3. Keep the reconstruction labels on every non-official model.
4. Keep NASA imagery marked as NASA imagery — never present generated material
   as archival footage.
