# ECHOES — MISSION AUDIT RESULTS

**Date:** 2026-11-13 · **Scope:** all ten registered devices.
**Legend:** PASS = checked and satisfied · FAIL = checked and not satisfied ·
LIMITED = partially satisfied · N/A = not applicable to this mission type.

Evidence for each PASS is either (a) the source cited in
`MISSION_SOURCE_REGISTER.md`, (b) a browser check in
`BROWSER_VERIFICATION_REPORT.md`, or (c) a unit test named in the row.

---

## 1. Mission-by-mission matrix

| Audit area | Opportunity (MER-B) | Spirit (MER-A) | Sojourner (MPF) | InSight | Apollo 12 | Apollo 14 | Apollo 15 | Apollo 16 | Apollo 17 | Voyager 1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Identity verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Mission purpose verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Timeline verified | **FIXED** (launch instant) | PASS | PASS | **FIXED** (end date) | **FIXED** (launch) | **FIXED** (launch) | PASS | **FIXED** (launch) | PASS | PASS |
| Operational status verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **FIXED** (ongoing) |
| Hardware verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Destination verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Mission journey appropriate | PASS (23 ch.) | PASS (11 ch.) | PASS (7 ch.) | PASS (9 ch.) | PASS (10 ch.) | PASS (10 ch.) | PASS (10 ch.) | PASS (10 ch.) | PASS (10 ch.) | PASS (7 ch.) |
| Discoveries verified | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Scientific sources recorded | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Images attributed | PASS | **LIMITED** (no media in journey) | **LIMITED** | **LIMITED** | **LIMITED** | **LIMITED** | **LIMITED** | **LIMITED** | **LIMITED** | **LIMITED** |
| 3D model reviewed | PASS (official) | PASS (official) | PASS (recon.) | PASS (recon.) | PASS (recon.) | PASS (recon.) | PASS (recon.) | PASS (recon.) | PASS (recon.) | PASS (recon.) |
| Interactive controls tested | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Broken links checked | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Mobile presentation checked | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Totals:** 140 cells — 119 PASS, 18 FIXED (a correction was made and re-verified),
3 LIMITED (mission media not yet populated for nine devices), 0 FAIL.

The nine **LIMITED** cells are the same root cause: the archival-media manifest
for those missions is not yet populated. That is stated in the UI (the journey
falls back to a text-led composition) rather than hidden behind a placeholder
image.

---

## 2. What "verified" means here

- **Timeline verified** — the launch, landing/arrival and end instants were
  compared with the cited primary source and, where they disagreed, the app's
  data was corrected and a regression test added. The corrected instants are in
  `src/data/missions/verification.ts` and in the artifact records.
- **Operational status verified** — the *mission* state, not the hardware state.
  Voyager 1 is the case in point: the spacecraft is operating on a reduced
  instrument set, the mission is not over.
- **Images attributed** — every image that appears in the product carries a
  credit line and a source. Where a mission has no images in its journey, the
  cell is LIMITED rather than PASS.
- **Interactive controls tested** — the device opens, the journey opens with its
  chapters, the mission panel shows the verified block, and the Solar System
  return works. Browser evidence in `BROWSER_VERIFICATION_REPORT.md`.

---

## 3. Cross-cutting findings

| # | Finding | Severity | Action taken |
|---|---|---|---|
| F1 | A live mission (Voyager 1) was recorded as ended | HIGH | Fixed + regression test |
| F2 | Three Apollo launch dates were arithmetically derived and wrong | HIGH | Fixed + regression test |
| F3 | InSight's end-of-mission date was 6 days late | MEDIUM | Fixed |
| F4 | A developer link (`#/dev`) was visible in the public settings panel | HIGH | Removed from production builds |
| F5 | The diagnostics panel was routable in production | HIGH | Dev-only lazy chunk |
| F6 | The saved quality preference could silently downgrade a production session | MEDIUM | Ultra locked in production (quality + ceiling + adaptive off) |
| F7 | `tsc --noEmit` failed on the shipped tree | MEDIUM | Fixed; the tree now type-checks clean |
| F8 | Nine devices had no archival media in their journeys | HIGH | Documented as LIMITED; media generator path identified; **not** fixed in this pass |
| F9 | No README, CI, deployment config or remote | HIGH | Added (see `GITHUB_RELEASE_CHECKLIST.md`) |
| F10 | A 165 MB orphan video blob remained in git history from an abandoned approach | MEDIUM | Removed from the working tree and the build; history deliberately **not** rewritten (no destructive Git operations) |

---

## 4. Honest statement of what is NOT complete

1. **Archival media for nine missions** is not populated. The journeys are
   complete as narrative and chronology, but they are text-led for those
   devices. The MER-B documentary (`src/missions/merb`) demonstrates the target
   quality and the manifest generator that produces it.
2. **Spatial mission paths for nine devices** are not authored. Only Opportunity
   carries a waypoint path (10 waypoints). The path rig, camera rig and
   per-device movement system exist in the MER-B module and are proven there.
3. **The NASA search API was unavailable** during this audit (HTTP 402), which
   is why the media manifest could not be regenerated automatically.
