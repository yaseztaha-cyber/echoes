# CONNECTION — ECHOES × NASA Space Apps Challenge 2026

**Challenge:** Abandoned but not Forgotten: Storytelling about NASA's Discarded
Equipment on the Moon and Mars — Challenge 01/14 of the 2026 hackathon
(Beginner/Youth, Intermediate; subjects: Astrophysics, Planets & Moons, Space
Exploration).

**Official mission (published summary):**
> "Since the 1960s, NASA has left hardware across the solar system—on the Moon,
> on Mars, and in deep space. From rovers and instruments that completed their
> science missions to probes still traveling away from Earth, this hardware
> varies widely in both its purpose and current level of functionality. Your
> challenge is to tell the story of some or all of this equipment that
> introduces school-age space enthusiasts to the hardware and the science it
> made possible."

This file maps every requirement in that brief to a specific, verifiable piece
of this repository. Nothing here is aspirational; each claim points to code,
data or a measured result committed alongside this document.

---

## 1. "Hardware across the solar system — on the Moon, on Mars, and in deep space."

The archive (`src/data/artifacts/`) is the spine of the project, and it covers
exactly the three environments the challenge names:

| Environment | Machines included | Where the data lives |
|---|---|---|
| Moon | Apollo 12 (with Surveyor 3, the case of a machine visited by another visitor), Apollo 14, 15, 16, 17 — descent stages, LRV, ALSEP stations | `src/data/artifacts/apollo.ts`, five walkable sites |
| Mars | Sojourner, Spirit, Opportunity, InSight — a range of purpose and fate | `src/data/artifacts/opportunity.ts`, `mars-others.ts`, four walkable sites |
| Deep space | Voyager 1 — still moving away from Earth **right now**, simulated to its real timeline | `src/data/artifacts/voyager.ts`, a real-time distance model (`voyagerAU`) |

That is **10 machines at 9 walkable mission sites**, each with its own timeline,
hardware breakdown and science questions (see §2). The progression the
challenge wants — machines that finished their missions (Apollo, Sojourner,
Spirit, Opportunity, InSight) versus a machine still traveling (Voyager 1) —
is a designed contrast, not an accident: the deep-space leg of the simulator
renders a probe that is *currently* leaving the neighborhood, against the final
position state of five machines that will never move again.

## 2. "Introduces them to the hardware — and the science it made possible."

Every artifact record carries three layers that decode one into the other:

- **Hardware in place.** Each machine is modelled as named components at their
  real relative layout — e.g. the Apollo science station breaks into PSE (the
  seismometer that "listened for moonquakes"), ASE, SWS, HFE, with purpose,
  capability, and how the data got back to Earth (`HardwareComponent` records in
  `src/data/artifacts/apollo.ts`).
- **The science chain.** Ten science questions ("Is the Moon seismically
  active — and what is it made of inside?", what Opportunity's traverse proved,
  etc.), each structured as observations → evidence → interpretation, written at
  three reading levels (`explore` / `understand` / `technical`). Student copy
  first, physics second ("Waves reveal the layers inside the Moon, like an
  ultrasound of a world"). `src/components/science/ScienceChain.tsx` renders
  the chain; `ALL_QUESTIONS` drives the archive progress HUD.
- **The rewards of visiting.** Discovering each science question fills the
  ARCHIVE progress bar; physically reaching each machine logs a visit — the
  collection loop (`visits[]`, `progress[]` in the store) turns exploration
  into a checklist a student can complete in one sitting.

## 3. "School-age space enthusiasts" — the audience in the design decisions

- **Guided demo:** the entry screen offers "PLAY GUIDED DEMO", an automated
  tour that reaches an artifact without reading a manual — a first session
  usable by a 12-year-old in under two minutes.
- **Reading layers everywhere:** all science copy ships in three difficulty
  bands, so siblings of different ages read the same moonquake record
  differently, without the app deciding for them who is which.
- **Language discipline:** every scientifically strong claim is phrased as an
  observation ("the Moon keeps ringing"), then explained, then cited. young
  readers get observations first.
- **No fail states:** nothing punishes wandering. The camera can always orbit,
  the archive never closes, the demo can be re-run.
- **Honest labels as an educational tool:** the HUD states plainly what is real
  and what is simulated ("NASA record + simulation", "circular-orbit model ·
  spin not simulated", "imagery: NASA, USGS"). Modeling the *ethics* of telling
  space stories is part of introducing a young audience to them.

## 4. "Tells the story" — storytelling structure, not a catalog

- Each visit is staged as theatre of arrival: travel to the world, orbital
  insertion, descent, then the site with the machine still where it was left.
- Artifact views expose **timeline events** (launch → landing → departure →
  end-of-mission) so the machine's biography is told at the machine.
- The project journal of what was staged and why is kept as deliberate
  experience stages in `docs/EXPERIENCE_RECORD.md` (sun-phase scrubbing for
  dusk/night artifacts, auto-filling archive, telemetry honesty panel).

## 5. Real NASA open data — the truth budget

The simulator is built on actual NASA/USGS/ESO public imagery and elevation
data, and every single source is recorded in `docs/PLANETARY_ASSET_AUDIT.md`
with license, epoch, and processing — including what each asset cannot claim:

- Earth: NASA Blue Marble Next Generation topography+bathymetry (bundled 2K +
  streamed 4K KTX2).
- Moon: NASA SVS CGI Moon Kit — LRO LROC WAC color at 8K for streaming,
  LOLA elevation at 9 mission sites for terrain.
- Mars: NASA SVS GMM-3 MOLA topography color + MOLA DEM sites.
- Sky: HYG v4.4 star catalogue (5,070 bundled stars + 61,814 streamed to mag
  8.5) and the ESO/S. Brunier Milky Way panorama (CC BY 4.0), aligned to the
  real equatorial frame.

The `DataResolution` HUD panel and the manifest validator tests
(`src/data/assets/manifest.test.ts`, 106 unit tests total) enforce that
labels match data — "RECONSTRUCTED" is rendered when something is model, not
record.

## 6. What's deliberately NOT covered (honest scope)

- The full official challenge statement with its data-resource list posts
  **28 October 2026**; this build targets the published summary and will be
  re-checked against the full statement before the event.
- Child-user testing has not been formally run yet; the reading layers and
  demo path are designed for it, with the plan to repeat the demo session at
  the local event with real students.
- Spacecraft models are reconstructions by this team, not NASA CAD, and are
  labelled as such in the application footer.

## 7. Thirty-second judge's tour

`npm run build && npm run preview` → ENTER SIMULATION → PLAY GUIDED DEMO →
reach Apollo 12 → open the artifact → read "The Moon rings like a bell" →
check the archive filled itself. Everything measured in this build: 106/106
unit tests, ~60 FPS with a 0-error console on the reference machine
(`docs/RENDERING_BENCHMARKS.md`), single-file bundle 11.3 MB + streaming asset
packs (8K Moon LROC 4.4 MB, 6K Milky Way 2.3 MB, deep stars 1 MB — all
served on demand, never blocking first visit).
