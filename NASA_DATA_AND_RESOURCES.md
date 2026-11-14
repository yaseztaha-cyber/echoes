# ECHOES — NASA DATA & RESOURCES

**Date:** 2026-11-13 · For the NASA Space Apps 2026 submission form.

---

## 1. The 2026 challenge set (verified from the official site)

Fetched from <https://www.spaceappschallenge.org/> and
<https://www.spaceappschallenge.org/2026/challenges/> on 2026-11-13:

- The 2026 NASA Space Apps Challenge runs **14–15 November 2026**.
- Project submission opens **Saturday 14 November 2026, 09:00 local** and
  closes **Sunday 15 November 2026, 23:59 local**.
- The 2026 challenge list is rendered client-side; the server-rendered
  homepage markup names the challenges, including the storytelling family that
  ECHOES belongs to:

| Challenge (as published on the 2026 homepage) | ECHOES' relationship |
|---|---|
| **Best Use of Storytelling** | ECHOES is a storytelling application: ten missions, each with a sourced narrative, a journey, a documentary layer and an explorable 3D world. |
| **Stellar Stories: Space Weather Through the Eyes of Earthlings** | ECHOES' solar renderer is built on real SDO observations (HMI continuum, AIA 171/193/211/304) with a live layer explorer, so the "solar weather" story is present and honestly labelled. |
| Commercializing Low Earth Orbit (LEO) | not targeted |
| HeCode Space | not targeted |
| Gaia+LEO | the star field is Gaia-derived, but the project is not targeted at this challenge |
| Astro Sweepers, PureFlow2, Resonant Exoplanets, SpaceGenes, Twisters, Watana Project, Zumorroda-X, Photonic Force (2025 titles visible in the 2026 homepage markup) | not targeted |

> **Honest limitation:** the per-challenge *Resources* lists are rendered
> client-side and could not be extracted from this sandbox (the pages return
> the shell only). The count, the dates and the challenge names above are
> verified; the exact Resources list for the chosen challenge must be opened
> manually at <https://www.spaceappschallenge.org/2026/challenges/> and
> checked against §2 below before submitting. **PARTIAL.**

---

## 2. NASA data sources ECHOES actually uses

Each row states **how the source influenced the implementation**, as the Global
Awards eligibility requires a source that is genuinely used — not merely
listed.

| NASA source | How it is used in ECHOES |
|---|---|
| **NASA SDO / HMI full-disk continuum** (`https://sdo.gsfc.nasa.gov/`) | Drives the solar layer explorer's photosphere: the full-disk image is resampled to an equirectangular map, the limb-darkening ramp and the sunspot detection both run on that disk. The sunspot markers on the surface are the *real detections* from that snapshot (`src/data/sunspots.json`). |
| **NASA SDO / AIA 171, 193, 211, 304 Å** | The four science channels in the Solar Layer Explorer, shown as published (false colour, labelled as such). |
| **NASA LASCO C3 coronagraph** | The corona structure mask (`corona_mask.png` + `src/data/corona.json`) is a log-polar resample of the real C3 structure, re-scaled to hug the limb — with the scale compression disclosed in the data file and in the UI. |
| **NASA 3D Resources — Mars Exploration Rover model** (`https://science.nasa.gov/resource/mars-exploration-rovers-3d-model/`) | The **official** MER geometry (`MER_static.glb`) is the model that stands at Opportunity's and Spirit's sites. It is loaded at runtime and is the reason those two vehicles are photographically recognisable rather than reconstructed. |
| **NASA Image and Video Library** (`https://images.nasa.gov/`) | 55 archival records (PIA photographs, orbital images, maps, the EDL animation, NASA TV features) are the media manifest of the MER-B documentary. The manifest was generated from the NASA API by the delivered prototype's own tool and each record keeps its credit, date, caption and source page. |
| **NASA/JPL Mars Outreach video file MER-2003-1020** (via archive.org) | The launch tracker tape is the documentary's only audible material — played exactly as published, with no music and no synthesised sound. |
| **NASA Image and Video Library — Mars Pathfinder gallery** | The Pathfinder/Sojourner 360° panorama is the reference for the Ares Vallis site and the Sojourner reconstruction. |
| **NASA Science mission pages** (`https://science.nasa.gov/mission/…`) | The authoritative mission facts (launch vehicle, launch site, landing site, end-of-mission dates, instruments, discoveries) that now live in `src/data/missions/verification.ts` and are shown in every mission panel with source links. Three generated Apollo launch dates and two end dates were corrected against these pages during the audit. |
| **NSSDCA Master Catalog** (`https://nssdc.gsfc.nasa.gov/nmc/`) | Cross-check for launch dates, vehicles and landing sites for all ten missions. |
| **NASA SVS — CGI Moon Kit (LROC)** | The Moon's global map. |
| **USGS Astrogeology / NASA Ames — Viking MDIM 2.1** | The Mars global map (a colourised global mosaic — labelled as such in the interface). |
| **NASA Earth Observatory — Blue Marble, night lights, cloud layer** | The Earth globe and its three layers. |
| **JPL approximate Keplerian elements** (documented in `src/engine/frames/kepler.ts`) | The orbital motion of every planet: positions, the orbit paths and the DE441 verification notes that the app's own readouts cite. |
| **NASA PDS / mission literature (Science, EPSL, LPSC)** | The scientific claims in the discovery cards and case files are cited by DOI (`src/data/sources/index.ts`): Squyres 2004/2012, Klingelhöfer 2004, Rieder 2004, Grotzinger 2005, Arvidson 2014, Squyres 2008, Stähler 2021, Stone 2013, Gurnett 2013, Langseth 1976. |
| **Gaia-derived star catalogue** (compiled in-project) | The 9,000-star field and the Milky Way panorama backdrop, with the ESA/Gaia credit recorded. |
| **NASA MOLA and LOLA DEMs** (`https://pds-geosciences.wustl.edu/`) | The Martian and lunar site terrain under each vehicle — the reason the surface reads as a place and not a stage set. |

---

## 3. NASA data NOT used

Stated so the submission is precise: ECHOES does not use live mission telemetry
(no spacecraft is currently broadcasting a downlink we consume), planetary
weather data, or Earth-observation products beyond the static Blue Marble
imagery.

---

## 4. Space Agency Partner resources

ECHOES does not depend on any Space Agency Partner tool. The app is a
self-contained static site: it streams NASA/JPL/archive.org media directly and
makes no authenticated calls.

---

## 5. Copy for the submission form (NASA data resources)

> ECHOES is built on NASA data at every layer: SDO/HMI and AIA full-disk
> observations for the solar layer explorer (including automated sunspot
> detection on the real HMI disk), LASCO C3 for the corona structure, NASA's
> official 3D Resources MER model for the Mars Exploration Rover vehicles at
> their landing sites, MOLA and LOLA elevation models for the surface terrain,
> the NASA Image and Video Library for the 55 archival media records inside the
> MER-B documentary, JPL Keplerian elements for the orbital motion, and the
> NASA Science mission pages and NSSDCA master catalog for every mission fact
> displayed in the app — each with a source link in the interface. Mission
> claims are additionally backed by the primary literature, cited by DOI.
