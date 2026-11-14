# ECHOES — NASA SPACE APPS 2026 SUBMISSION PACKET

**Prepared:** 2026-11-13 · Everything below is verified; nothing is a plan.

---

## 1. Project

| Field | Value |
|---|---|
| **Project title** | ECHOES |
| **Tagline** | Every Journey Leaves a Trace. |
| **One-line description** | A real-time, explorable planetary system where ten real spacecraft stand on their real landing sites and every mission fact is sourced from NASA. |
| **Live project** | <https://yaseztaha-cyber.github.io/echoes/> |
| **Repository** | <https://github.com/yaseztaha-cyber/echoes> |
| **Demo video (competition cut, 29.9 s)** | <https://raw.githubusercontent.com/yaseztaha-cyber/echoes-demo/main/echoes-demo-30s.webm> — also at <https://github.com/yaseztaha-cyber/echoes-demo> |
| **Demo video (master, 60.7 s)** | <https://raw.githubusercontent.com/yaseztaha-cyber/echoes-demo/main/echoes-demo-60s.webm> |
| **Team** | ⚠️ **TO BE FILLED IN BY THE TEAM** — member names, roles and contact. No names are invented in this packet. |
| **Selected challenge** | ⚠️ **TO BE CONFIRMED BY THE TEAM** on the submission portal. See §2. |

## 2. NASA Space Apps 2026 — what was checked, and what was not

Verified on the official site on **2026-11-13**:

* the challenge runs **14–15 November 2026**;
* project submission opens **Saturday 14 November 09:00 local** and closes
  **Sunday 15 November 23:59 local**;
* the 2026 set contains **14 challenges**; the names visible in the official
  homepage markup include **Best Use of Storytelling** and **Stellar Stories:
  Space Weather Through the Eyes of Earthlings** — the two ECHOES' content
  genuinely addresses.

**Limitation (stated, not hidden):** the per-challenge *Resources* lists are
rendered client-side and could not be extracted from the audit sandbox. Before
submitting, the team must open
<https://www.spaceappschallenge.org/2026/challenges/>, confirm the chosen
challenge, and check §3 against that challenge's Resources list. ECHOES uses
the NASA sources below **in the implementation**, each one observable in the
running product — which is what Global Awards eligibility asks for.

## 3. NASA data resources used (and how each one is used)

| NASA source | How it shaped the implementation |
|---|---|
| **NASA 3D Resources — Mars Exploration Rover model** (`MER_static.glb`) | It is the actual model standing at Opportunity's and Spirit's sites. Without it those two vehicles would be reconstructions; with it they are photographically recognisable. |
| **SDO / HMI full-disk continuum** | The solar layer explorer's photosphere map, its limb-darkening ramp and the **sunspot detection** (the markers on the surface are real detections on that disk). |
| **SDO / AIA 171, 193, 211, 304** | The four false-colour solar science channels, shown as published and labelled as such. |
| **LASCO C3** | The corona structure mask and its log-polar geometry (the radial compression is disclosed in the data file and in the interface). |
| **NASA Image and Video Library** | The 55 archival media records inside the MER-B documentary (photographs, orbital images, the EDL animation, NASA TV features). |
| **NASA/JPL MER-2003-1020 launch tape** (archive.org) | The documentary's only audible material, played exactly as published — no music, no synthesised sound. |
| **NASA Mars Pathfinder / Sojourner gallery** | The 360° panorama that the Ares Vallis site and the Sojourner reconstruction are matched against. |
| **MOLA and LOLA DEMs** (PDS Geosciences) | The Martian and lunar terrain under every vehicle — the reason a site reads as a place rather than a stage set. |
| **JPL approximate Keplerian elements** | The orbital motion of every planet and the orbit paths, with the DE441 verification recorded in the source notes. |
| **NASA Science mission pages + NSSDCA Master Catalog** | Every mission fact in the app. Three generated Apollo launch dates and two end dates were **found wrong** during the release audit and corrected against these sources. |
| **Gaia-derived star catalogue** | The 9 000-star field and the Milky Way backdrop, with the ESA/Gaia credit recorded. |
| **Blue Marble / Earth Observatory / SVS CGI Moon Kit / USGS MDIM** | The Earth, Moon and Mars globes (labelled as colourised global mosaics where that is what they are). |

## 4. High-level summary (submission form)

> ECHOES is a real-time planetary exploration system for the browser. You fly the
> solar system, drop to Mars or the Moon, and find the actual spacecraft standing
> where they landed — the Mars Exploration Rovers using NASA's own published 3D
> model, the landers on MOLA and LOLA elevation data, and Voyager 1 still out
> beyond the heliopause. Every mission is presented as a documentary: its
> chronology, its instruments, its discoveries, and its verified current status,
> each fact carrying a link to the NASA source it came from. The flagship layer
> is the MER-B mission film: Opportunity's complete 18-chapter documentary,
> running as code inside the mission experience rather than as a flat video.

## 5. Detailed project description

**The problem.** Spaceflight history is usually told as a slideshow — a
photograph, a paragraph, a date. The machines are abstractions and the places
they went are coordinates on a map. The continuity is missing: the sense that a
specific vehicle, in a specific place, did specific things, and that the
evidence still exists.

**The solution.** ECHOES makes the *record* and the *place* the same object. Ten
registered devices — three rovers, a lander, five crewed lunar landers and a
flyby probe — each stand or drift in their real destination, each carrying a
mission record built from NASA's own sources.

**What the user actually does.** Focus any body; travel to it; select a
mission site from the planet's own panel; descend through an atmospheric haze
onto DEM-backed terrain with the vehicle, its tracks, its beacon and its
instrument deck; then open the mission's journey and step through its chapters
— the narrative, the milestones, the discoveries, the source-cited facts. For
Opportunity there is a further layer: the MER-B mission film, a complete
documentary running as live 3D inside the journey interface.

**Technology.** React 19, TypeScript, three.js r186, @react-three/fiber, Vite
(single-file production build), Tailwind 4, Zustand, Vitest and Playwright.
The coordinate model keeps three layers apart — SCI (real units for every
measurement), PRESENT (visually compressed, for rendering) and RENDER
(camera-relative) — so a scale convenience can never contaminate a measurement.

**Scientific value.** Every mission fact is source-linked, and the app shows
its own epistemic status: an official model is labelled OFFICIAL, a documented
reconstruction is labelled RECONSTRUCTED, the artist solar map is labelled
*ARTISTIC VISUALIZATION — NOT AN OBSERVATION (CC BY 4.0)*, and compressed
distances are labelled as compressed. During the release audit three generated
Apollo launch dates and two end dates were corrected against NASA — the audit
trail is in `MISSION_SCIENTIFIC_AUDIT.md`.

**Educational value.** A visitor can go from "which rover?" to "what did it
actually find, and where?" without leaving the scene they are looking at.

**What makes it different.** Most mission sites are archives: text and
photographs. ECHOES is a *place* — the rover is on the ground, the terrain is
the elevation data, and the film is a documentary that plays inside the
mission rather than a link out of it.

**Known limitations (stated in the product and in the README).** Nine of the ten
journeys do not yet carry archival imagery (those journeys are text-led);
Opportunity is the only device with a spatial mission path; distances and body
sizes are visually compressed and labelled; axial tilt and spin are not
rendered; Voyager 1's live distance uses the project's own propagation model.

## 6. Other data and resources used

| Source | Use | Terms |
|---|---|---|
| Solar System Scope solar map | the artistic sun surface (labelled as such in the product) | CC BY 4.0, credited in the interface |
| ESO / S. Brunier Milky Way panorama | the sky backdrop | CC BY 4.0, credited |
| NASA Image and Video Library / archive.org | archival media inside the documentary | public domain, credited per plate |
| IBM Plex Sans / IBM Plex Mono | typography | SIL OFL 1.1 |
| NASA / USGS / JPL public-domain maps | planetary globes | credited in `ASSET_LICENSE_AND_ATTRIBUTION.md` |
| React, three.js, Vite, Zustand, Tailwind, Vitest, Playwright | software | MIT / Apache-2.0 |

## 7. AI tools used

> AI coding assistants were used to write and refactor the application code, the
> verification scripts and the documentation. All factual mission data was
> verified against NASA mission pages, the NSSDCA master catalog and the primary
> literature, with the sources recorded in `MISSION_SOURCE_REGISTER.md`; several
> generated dates were corrected during that verification. **No AI-generated
> images, video, textures or audio are used in the product** — every image,
> plate and film is NASA/JPL/USGS archival material or a human-made artist map
> that is explicitly labelled as such (CC BY 4.0). The only non-observational
> visual, the Solar System Scope solar map, carries a visible
> "ARTISTIC VISUALIZATION — NOT AN OBSERVATION" label and contains no NASA
> branding or identifiers.

## 8. Demo video — compliance with the 2026 guidance

| Requirement | Status |
|---|---|
| A competition demo of **no more than 30 seconds** | **29.88 s** (`echoes-demo-30s.webm`) |
| A longer cinematic master kept for other uses | **60.72 s** (`echoes-demo-60s.webm`) |
| The cut explains what ECHOES is | it shows the live solar system, the flight to Mars and Opportunity's site, then the title card with the tagline and the data-source line |
| It shows the actual working experience | the films are screen recordings of the production build — not an animation, not a mockup |
| It ends with the project name | the end card reads **ECHOES** with the tagline |
| Required AI visual disclosure | the end card states that AI coding tools were used and that NASA/JPL/USGS data is used |
| Hosted somewhere publicly accessible | <https://raw.githubusercontent.com/yaseztaha-cyber/echoes-demo/main/echoes-demo-30s.webm> — **verified playing in a fresh browser session** (1920×1080, readyState 4) |

## 9. Final pre-submission checklist

| Step | Owner |
|---|---|
| Fill in the team members (names, roles, contact) in the portal | team |
| Select and confirm the challenge; check its Resources list against §3 | team |
| Accept the participation terms and press submit (irreversible, personal) | team |
| Add the team as collaborators on the repository | team |
| Rotate the personal access token that was pasted into the working chat during the audit | team (see `SECURITY_AUDIT.md` §2) |
| Re-run `npm audit --production` before publishing (the sandbox could not reach the audit endpoint) | team |
| Confirm the demo link opens in a private window one final time | team |

## 10. Where the evidence lives

| Claim | Document |
|---|---|
| the project as found, and every defect the audit found | `AUDIT_BASELINE.md` |
| per-mission verification and the corrections | `MISSION_SCIENTIFIC_AUDIT.md` |
| the 140-cell audit matrix | `MISSION_AUDIT_RESULTS.md` |
| every claim and its source | `MISSION_SOURCE_REGISTER.md` |
| the browser runs | `BROWSER_VERIFICATION_REPORT.md`, `TEST_RESULTS.md` |
| the measured performance | `PERFORMANCE_AUDIT.md`, `PERFORMANCE_BENCHMARKS.csv` |
| the deployment | `DEPLOYMENT_VERIFICATION.md` |
| the repository | `PUBLIC_REPOSITORY_VERIFICATION.md` |
| asset rights and AI use | `ASSET_LICENSE_AND_ATTRIBUTION.md`, `AI_USE_DISCLOSURE.md` |
