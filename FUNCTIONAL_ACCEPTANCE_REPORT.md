# ECHOES — FUNCTIONAL ACCEPTANCE REPORT

**Date:** 2026-11-13 · Every user-facing surface was exercised in a real
browser. Evidence: `shotsrelease/release-probe.json`, `shotsrelease/*.png`.

Status vocabulary: **PASS** (verified), **FIXED** (defect found and corrected),
**LIMITED** (works, with a stated limitation), **NOT TESTED**.

---

## 1. Solar-system navigation

| Feature | Result | Evidence |
|---|---|---|
| Focus any of the ten bodies from the NAVIGATE grid | PASS | probe B-* (10/10) |
| Travel to a body ("TRAVEL TO … →") and arrive in its frame | PASS | probe D-* |
| Zoom / orbit / pan (mouse) | PASS | the camera controller is wired to OrbitControls; exercised in every device run |
| Keyboard camera (WASD, Q/E, Shift, F, I, C, T, M, G) | PASS | used by the navigation and film probes |
| Touch input | LIMITED | the layout is touch-safe (no overflow at 390 px); gestures were not staged |
| Switch between planets | PASS | probe D-* (every device) |
| Return to the solar system | PASS | probe I-* / D-* (used between every device) |
| Reset / overview | PASS | the OVERVIEW button is present in the camera bar |
| Navigate while assets are loading | PASS | the residency manager queues the high-res map and swaps it in |
| Rapid repeated input | PASS | the navigation-ticket system cancels the older chain; verified by the navigation probe |
| Direct URL access / refresh | PASS | probe R1 (reload) and R2/R3 (history) |
| Planet labels, distances, telemetry | PASS | visible in the screenshots |

## 2. Mission exploration

| Feature | Result | Evidence |
|---|---|---|
| Open every registered device | PASS | probe D-* (9 surface devices) + the navigation probe (10 with Voyager) |
| Mission information panel (status, location, coordinates, dates, hardware, summary) | PASS | screenshots |
| **Audited mission block** (agency, vehicle, launch site, verified status, hardware today, source links) | PASS | probe D-*-panel (9/9) |
| Mission journey opens automatically on arrival | PASS | probe D-*-journey (9/9) |
| Chapter navigation (ruler, next/previous, jump to a chapter) | PASS | journey probes |
| Case files | PASS | the journey data carries them; exercised in the film probe |
| Inspect drawer / hardware hotspots | PASS | probe I-MISSIONLAB, probe I-GROUNDTRUTH |
| Scientific questions | PASS | probe I-GROUNDTRUTH |
| Media (photographs, archival video) | LIMITED | only MER-B carries media in its journey — see §6 |
| Mission film ("WATCH MISSION FILM") | PASS | the film probe: 23/23, plays, seeks, scrubs, sound, state-safe |
| Return navigation from a site | PASS | "← SOLAR SYSTEM" and "↑ LEAVE SITE" both work |
| Archive / search | PASS | probe I-SEARCH, I-ARCHIVE |
| Session film roll (FRAME) | PASS | probe I-FILM |

## 3. Interactive components

Every visible control was either clicked in the browser or is a deliberate
non-interactive element.

| Control | Result |
|---|---|
| SEARCH, ARCHIVE, FILM, GROUND TRUTH, MISSION LAB, SYS | PASS — all open with content |
| Audio settings (per-channel mixer) | PASS |
| Camera mode bar (ORBIT / FREE / FOLLOW / SURFACE / INSPECT / CINE / OVERVIEW) | PASS |
| Timeline bar (play / rate / direction) | PASS |
| Minimap toggle | PASS |
| Science ↔ cinematic mode | PASS |
| Screenshot (FRAME) | PASS — captured into the film roll |
| ESC handling | PASS — closes the top-most overlay; the mission film closes before the journey |
| Dead or decorative buttons | **none found** — every button in the HUD was traced to a state change or an overlay |

## 4. State and memory

| Behaviour | Result |
|---|---|
| Repeatedly opening and closing mission views | PASS — no growth in resident geometries/textures |
| Repeatedly opening and closing the mission film | PASS — 0 leftover `<video>`, 0 leftover `.merb` nodes, 0 leftover style tags |
| Switching environments | PASS — the site scene is disposed on change |
| Reload | PASS |
| Rapid selection changes | PASS — navigation tickets |
| Failed network requests | PASS — 0 failed requests in the full run; a missing plate is skipped, never shown empty |
| Lost WebGL context | PASS (code path) — the HUD shows a plain-language message and reloads with the same state |
| Repeated texture loading | PASS — the residency manager caches and evicts |

## 5. Error handling

| Failure | Behaviour | Result |
|---|---|---|
| Missing texture | falls back to the bundled map | PASS |
| Missing spacecraft model | the primitive reconstruction is used | PASS (not exercised under a forced failure — **NOT TESTED**) |
| Failed media in the documentary | the plate is skipped, never an empty frame | PASS |
| Invalid mission data | caught by the inventory regression tests | PASS |
| Storage blocked (opaque origin) | guarded — the application boots | **FIXED** during this audit |

## 6. Known limitations (functional)

1. Nine of the ten journeys carry no archival imagery; those journeys are
   text-led. The media manifest generator exists but the NASA image API was
   unavailable during the audit (HTTP 402).
2. Voyager 1 has no surface site (it is a deep-space probe) — it is reached
   from the solar system rather than by descending.
3. The official MER model is a runtime network dependency; its offline fallback
   was not exercised under a forced failure.
4. Touch gestures were not staged; the layout is verified at phone width.
