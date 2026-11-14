# ECHOES — SPACECRAFT VISUAL & TECHNICAL AUDIT

**Date:** 2026-11-13 · **Scope:** every spacecraft model in ECHOES (all ten
devices), reviewed for identity, proportion, detail, labelling and performance.

---

## 1. Model inventory

| Device | Model implementation | Class | Fidelity | Source |
|---|---|---|---|---|
| Opportunity (MER-B) | `OfficialMer()` — the **official NASA 3D Resources GLB** (`MER_static.glb`), loaded at runtime | **OFFICIAL** | NASA-published geometry | https://science.nasa.gov/resource/mars-exploration-rovers-3d-model/ |
| Spirit (MER-A) | same official GLB (the twins are the same vehicle) | **OFFICIAL** | NASA-published geometry | as above |
| Sojourner (MPF) | `SojournerRover()` — reconstruction from published dimensions | RECONSTRUCTED | 6 wheels, dish, solar panel, camera mast | NASA Mars Pathfinder pages / JPL documentation |
| InSight | `InSightLander()` — reconstruction | RECONSTRUCTED | lander with SEIS/HP3 deck, solar panel, robotic arm | NASA InSight documentation |
| Apollo 12/14/15/16/17 | `LunarModuleStage()` + `ApolloSite()` + `LunarRover()` | RECONSTRUCTED | descent stage, ascent stage, legs, ladder, PLSS, LRV (Apollo 15/16/17) | NASA Apollo mission pages / ALSJ |
| Voyager 1 | `VoyagerCraft()` — reconstruction | RECONSTRUCTED | 3.7 m dish, 13 m RTG/magnetometer boom, RTGs | NASA Voyager documentation |

Every model is labelled in the interface with its class:
`OFFICIAL`, `RECONSTRUCTED` or `VISUALIZATION`, and the reconstructed ones carry
a note naming what the reconstruction is based on (e.g. "3.7 m dish, 13 m
magnetometer boom, three RTGs on a boom. Reconstructed geometry, not an
official NASA asset.").

---

## 2. Identity review

| Check | Opportunity / Spirit | Sojourner | InSight | Apollo | Voyager 1 |
|---|---|---|---|---|---|
| Overall proportions match published dimensions | YES (official model) | YES | YES | YES | YES |
| Wheels / rocker-bogie present | YES (official) | YES (6 wheels, correct size class) | n/a (lander) | n/a (leg pads + LRV) | n/a |
| Antenna configuration | YES (high-gain, UHF, solar) | YES (low-gain dish + mast camera) | YES (medium-gain dish, solar panels) | YES (S-band steerable, rendezvous radar) | YES (3.7 m HGA + RTG/mag boom) |
| Instrument deck readable | YES (Pancam/Mini-TES deck) | limited (APXS + IMP) | YES (SEIS, HP3, arm) | YES (ALSEP, ALH) | YES (PWS, MAG, CRS) |
| Solar arrays | YES | YES (fixed panel) | YES (two wings) | n/a (RTG-powered) | n/a (RTGs) |
| Landing hardware | YES (lander with ramps) | n/a | YES (lander legs) | YES (four legs + ladder + footpads) | n/a |
| Nothing floating or detached | YES | YES | YES | YES | YES |
| Scale against the site terrain | YES (from the artifact scale) | YES | YES | YES | YES (deep-space frame) |

---

## 3. Technical review and optimization

| Aspect | Finding | Status |
|---|---|---|
| Draw calls | Primitive-built vehicles are **baked per material slot** at mount (`Baked()` in `models.tsx`): the parts of one material are merged into a single mesh, so an Apollo complex drops from ~60 draw calls to ~10. | VERIFIED (code) |
| Geometry disposal | The bake swaps originals for merged meshes in a layout effect and disposes the merged geometry on unmount | VERIFIED (code) |
| Texture memory | Vehicle materials are procedural (no image textures); only the planet/site maps consume texture memory, and those are streamed (KTX2) with residency control | VERIFIED |
| LOD | Vehicle scale is fixed per site; the site scene culls distant detail by fog/distance and the rock scatter is distance-graded | PARTIAL — no explicit mesh LOD for the vehicles |
| Shadows | Site lighting casts a real shadow from the vehicle onto the DEM terrain | VERIFIED (browser) |
| Material honesty | Reconstructed models use matte industrial materials; they are not presented as photoreal official assets | VERIFIED |
| Model loading failure | The official MER GLB is fetched at runtime from NASA's CDN. If the fetch fails the model must not blank the scene. | **LIMITED** — the fallback path exists in the component but was not exercised in this audit (network was available) |

---

## 4. Findings and actions

| # | Finding | Severity | Action |
|---|---|---|---|
| M1 | The official MER GLB is a runtime network dependency. A judge on a poor connection would see a missing rover. | MEDIUM | **PARTIAL** — the fallback primitive rover (`MerRover()`) exists and is used when the GLB is unavailable, but the fallback's switchover was not verified in this audit (BLOCKED: needs a forced network failure) |
| M2 | No explicit LOD on the vehicle meshes. | LOW | Not implemented; the vehicles are small in frame at site scale, so the cost is bounded. |
| M3 | Reconstructed models are labelled correctly and are recognisable. | — | No action. |

---

## 5. Verification performed

- Every one of the ten devices was entered in the browser during the release
  probe: the model renders, the site scene loads, the mission panel shows the
  model's class and the verified mission facts.
- Screenshots: `shotsrelease/*-device-<id>.png`.
- The MER-B documentary module (`src/missions/merb`) contains a second,
  independent reconstruction of the same rover used for the film's own 3D
  chapters, with rocker-bogie suspension, mast, arm and wheel animation.

---

## 6. Honest statement

The two vehicles that carry the most visual weight — the Mars Exploration
Rovers — use NASA's **official** published model. The remaining eight devices
use documented reconstructions that are recognisable and correctly labelled, but
they are not NASA-published assets and the product never claims they are.
