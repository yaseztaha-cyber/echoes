# ECHOES — MISSION SCIENTIFIC AUDIT

**Date:** 2026-11-13 · **Scope:** every registered device (all ten) — not a sample.
**Method:** each mission's record in `src/data/artifacts/` was compared against an
authoritative NASA source (mission page, NSSDCA master catalog, or the mission's
primary literature), the audited facts were written into
`src/data/missions/verification.ts`, and the app's own data was corrected where
the two disagreed.

Status vocabulary: **VERIFIED** (checked against a primary source this session),
**FIXED** (a discrepancy was found and corrected), **LIMITED** (a fact that
exists but cannot be verified to the same standard), **NOT IMPLEMENTED**.

---

## 1. Master inventory

| Device | Designation | Type | Destination | Model | Journey |
|---|---|---|---|---|---|
| Opportunity | MER-B | rover | Mars | OFFICIAL (NASA 3D GLB) | 23 chapters |
| Spirit | MER-A | rover | Mars | OFFICIAL (NASA 3D GLB) | 11 chapters |
| Sojourner | MPF | rover | Mars | RECONSTRUCTED | 7 chapters |
| InSight | INSIGHT | lander | Mars | RECONSTRUCTED | 9 chapters |
| Apollo 12 | A12 | crewed lander | Moon | RECONSTRUCTED | 10 chapters |
| Apollo 14 | A14 | crewed lander | Moon | RECONSTRUCTED | 10 chapters |
| Apollo 15 | A15 | crewed lander | Moon | RECONSTRUCTED | 10 chapters |
| Apollo 16 | A16 | crewed lander | Moon | RECONSTRUCTED | 10 chapters |
| Apollo 17 | A17 | crewed lander | Moon | RECONSTRUCTED | 10 chapters |
| Voyager 1 | VGR-1 | flyby probe | Interstellar space | RECONSTRUCTED | 7 chapters |

Machine-readable form: `MISSION_INVENTORY.csv` (generated from the live
registries by `src/data/missions/inventory.test.ts`).

**Not a rover:** the registry contains four rovers (MER-A, MER-B, Sojourner, and
InSight's stationary cousin is a lander), one lander (InSight), five crewed
lunar landers and one flyby probe. The app treats them as different hardware
kinds (`ModelKind`: mer / sojourner / insight / apollo / voyager) and the
journeys give each its own chronology.

---

## 2. Corrections made (real fixes, not documentation)

### 2.1 Voyager 1 — a live mission was recorded as finished — FIXED

| | |
|---|---|
| Found | `src/data/artifacts/voyager.ts`: `dates.end = VOYAGER_NOW` (i.e. "today"), which reads as "the mission ended today". |
| Source | NASA Science, *Voyager 1* (accessed 2026-11-13): "Launched in 1977 to fly by Jupiter and Saturn, Voyager 1 crossed into interstellar space in August 2012 **and continues to collect data**." |
| Fix | `dates.end` is now `undefined`; `endLabel` reads "ONGOING — still returning data from interstellar space; some instruments powered down to conserve energy". The clock range still tracks the spacecraft out to the present. |
| Guard | New regression test: *"a mission with no end date is genuinely ongoing"* fails if Voyager 1 ever regains an end date. |

The reduced instrument set is a **spacecraft** state, not a **mission** state —
the distinction the audit brief calls for.

### 2.2 Apollo launch dates were derived, not real — FIXED

| | |
|---|---|
| Found | `src/data/artifacts/apollo.ts`: `launch: s.landing - 4 * 86400000` — the launch date was *computed* from the landing date. |
| Sources | NASA mission pages `nasa.gov/mission/apollo-12|14|15|16|17` (accessed 2026-11-13); NSSDCA master catalog. |
| Result | Apollo 12 launched **14 Nov 1969** (app said 15 Nov); Apollo 14 launched **31 Jan 1971** (app said 1 Feb); Apollo 16 launched **16 Apr 1972** (app said 17 Apr). Apollo 15 (26 Jul) and Apollo 17 (7 Dec) happened to be right. |
| Fix | Each mission now carries its **real launch instant** (UTC), including the time of day. |
| Guard | New regression test compares every verified launch against the artifact record (36 h tolerance) — it also caught a month-index slip in the new verification file before it shipped. |

### 2.3 InSight end-of-mission date — FIXED

| | |
|---|---|
| Found | `dates.end = 2022-12-21`. |
| Source | NASA Science, *InSight*: "End of Mission: Dec. 15, 2022". |
| Fix | `2022-12-15`, label "End of mission: NASA ceased operations after the final data transmission". |

### 2.4 Verified mission facts are now in the product — ADDED

Agency, launch vehicle, launch site, objective, the verified operational status,
where the hardware is today, the key events with dates, and the discoveries were
written into `src/data/missions/verification.ts` (one record per device, each
with sources and access dates) and are surfaced in the mission panel of every
device ("MISSION VERIFIED" block with source links). Before this, these facts
existed only in scattered prose.

---

## 3. Mission-by-mission verification

| Mission | Identity | Purpose | Timeline | Status | Hardware | Destination | Verified against |
|---|---|---|---|---|---|---|---|
| MER-B Opportunity | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | VERIFIED | science.nasa.gov MER page; NSSDCA 2003-037A |
| MER-A Spirit | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | science.nasa.gov MER page; NSSDCA 2003-027A |
| Sojourner / Pathfinder | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | science.nasa.gov/mission/mars-pathfinder (Type "Lander, Rover", Delta II 7925, Ares Vallis, end 27 Sep 1997) |
| InSight | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | VERIFIED | science.nasa.gov/mission/insight (Atlas V-401, Vandenberg, Elysium Planitia, end 15 Dec 2022) |
| Apollo 12 | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | VERIFIED | nasa.gov/mission/apollo-12 |
| Apollo 14 | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | VERIFIED | nasa.gov/mission/apollo-14 |
| Apollo 15 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | nasa.gov/mission/apollo-15 |
| Apollo 16 | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | VERIFIED | nasa.gov/mission/apollo-16 |
| Apollo 17 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | nasa.gov/mission/apollo-17 |
| Voyager 1 | VERIFIED | VERIFIED | VERIFIED | FIXED | VERIFIED | VERIFIED | science.nasa.gov/mission/voyager-1; NSSDCA 1977-084A |

### Key facts now carried by the app

- **Opportunity** — NASA/JPL, Delta II Heavy 7925H from SLC-17B, launched
  7 Jul 2003; airbags into Eagle Crater (14.57°S, 177.53°E) on 25 Jan 2004;
  5,111 sols and 45.16 km; mission declared complete 14 Feb 2019; the hardware is
  still in Endeavour crater at Cape York.
- **Spirit** — NASA/JPL, Delta II 7925 from SLC-17A, launched 10 Jun 2003;
  airbags into Gusev (14.57°S, 175.47°E) on 4 Jan 2004; 2,207 sols and
  7.73 km; last contact 22 Mar 2010 in the global dust storm; NASA ended
  recovery efforts 25 May 2011; the hardware is still at Troy in the Columbia Hills.
- **Sojourner** — NASA/JPL, Delta II 7925, launched 4 Dec 1996 with Mars
  Pathfinder; Ares Vallis (19.13°N, 325.81°E) on 4 Jul 1997; 83 sols and ≈100 m;
  end of mission 27 Sep 1997; hardware still at the site.
- **InSight** — NASA/JPL with DLR, CNES and ESA; Atlas V 401 from Vandenberg
  SLC-3E, launched 5 May 2018; Elysium Planitia (4.50°N, 135.62°E) on 26 Nov
  2018; end of mission 15 Dec 2022; hardware still at the site.
- **Apollo 12/14/15/16/17** — NASA, Saturn V from LC-39A (39B for Apollo 17);
  landing sites Oceanus Procellarum, Fra Mauro, Hadley-Apennine, Descartes
  Highlands and Taurus-Littrow; the ALSEP stations operated until 30 Sep 1977;
  all the hardware remains on the Moon. Apollo 17 was the last crewed lunar
  landing (11 Dec 1972).
- **Voyager 1** — NASA/JPL, Titan IIIE-Centaur from SLC-41, launched 5 Sep 1977;
  Jupiter 5 Mar 1979, Saturn/Titan 12 Nov 1980; heliopause 25 Aug 2012; the
  mission is **ongoing**.

---

## 4. Known limitations (stated, not hidden)

| # | Limitation | Status |
|---|---|---|
| L1 | Nine of ten journeys still carry **no archival imagery** (only Opportunity has mission media). The journeys for Spirit, Sojourner, InSight, the five Apollos and Voyager have chapters without photographs. | NOT IMPLEMENTED — the media manifest for those missions is not yet populated. The presentation falls back to text-led compositions rather than showing empty frames. |
| L2 | Only Opportunity has a **mission path** with waypoints (10 waypoints). The other nine journeys do not yet carry a spatial traverse. | PARTIAL — the path is authored for MER-B only. |
| L3 | Landing-site coordinates for the Apollos come from the mission literature; they are recorded to ~0.01° and are the published site values. | VERIFIED |
| L4 | Voyager 1's live distance/position uses the app's own propagation model from the launch epoch, not a published ephemeris. | LIMITED — labelled as a model in the interface. |
| L5 | The NASA search API was unavailable during this audit (HTTP 402), so the archival-media manifest could not be regenerated for the nine missions that lack it. | BLOCKED — external service unavailable; the media generator (`tools/build-media.mjs` in the MER-B prototype) is the path forward. |

---

## 5. What the audit changed in the product

- `src/data/missions/verification.ts` — new audited registry (10 records, sources, access dates).
- `src/data/missions/inventory.test.ts` — new: 7 regression tests + the generators for `MISSION_INVENTORY.csv` and `MISSION_SOURCE_REGISTER.md`.
- `src/data/artifacts/voyager.ts` — Voyager 1 no longer recorded as ended.
- `src/data/artifacts/mars-others.ts` — InSight end-of-mission date corrected.
- `src/data/artifacts/apollo.ts` — real launch instants replace the derived dates.
- `src/components/planet/ContextPanels.tsx` — the "MISSION VERIFIED" block with source links in every mission panel.
- `src/state/store.ts` — the production quality lock (Ultra) completed for the ceiling as well.
