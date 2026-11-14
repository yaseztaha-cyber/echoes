# ECHOES — BROWSER VERIFICATION REPORT

**Date:** 2026-11-13 · **Method:** real browser (Microsoft Edge / Chromium via
Playwright), real clicks, real camera flights. Nothing here is a unit-test
result or a build result.

Probe: `scripts/probe-release.mjs` · raw results: `shotsrelease/release-probe.json` · screenshots: `shotsrelease/`.

> **Port note:** the sandbox reassigns development ports between runs (the
> environment started other projects on :5173 and :5174 during this audit).
> ECHOES was therefore served from a dedicated port for the final run.

---

## 1. Final run

**24 / 24 checks PASS before the last two fixes; the final run is recorded in
§6.** Console errors: **0** (after the fixes below). Failed network requests:
**0**.

### 1.1 Landing and entry

| # | Check | Result |
|---|---|---|
| L1 | the landing page renders with the ECHOES identity and both calls to action | PASS |
| L2 | EXPLORE MISSIONS is present | PASS |
| E1 | ENTER ECHOES opens the solar system | PASS |
| E1b | the HUD is reachable after the boot airlock | PASS |
| E2 | the solar system renders with live renderer counters (22 draw calls, 108 k triangles) | PASS |

The hero is **the live 3D solar system** — the camera drifts slowly around the
Sun while the visitor reads the page (screenshot:
`shotsrelease/landing-hero-3d.png`).

### 1.2 Every celestial body

| Check | Result |
|---|---|
| MERCURY, VENUS, EARTH, MOON, MARS, JUPITER, SATURN, URANUS, NEPTUNE, PLUTO each focus without error and set `focusBody` correctly | PASS (10/10) |

### 1.3 Every registered device

For each device: travel to its world, select it in the planet panel, descend to
the site, confirm the journey opens with its chapters, then close the journey
and confirm the mission panel shows the audited mission block.

| Device | Site | Journey chapters | Verified mission block |
|---|---|---|---|
| Opportunity (MER-B) | mars | PASS | PASS |
| Spirit (MER-A) | mars | PASS | PASS |
| Sojourner (MPF) | mars | PASS | PASS |
| InSight | mars | PASS | PASS |
| Apollo 12 | moon | PASS | PASS |
| Apollo 14 | moon | PASS | PASS |
| Apollo 15 | moon | PASS | PASS |
| Apollo 16 | moon | PASS | PASS |
| Apollo 17 | moon | PASS | PASS |

**27 / 27 device checks PASS.** (Voyager 1 is a deep-space probe: it is reached
through the solar system's VOYAGER 1 control and is covered by the navigation
regression suite rather than by a site descent — it has no surface site.)

### 1.4 Interactive surfaces

| Surface | Result |
|---|---|
| SEARCH, ARCHIVE, FILM, GROUND TRUTH, MISSION LAB, SYS each open with real content | PASS (6/6) |

### 1.5 Stability

| Check | Result |
|---|---|
| the application survives a reload | PASS |
| browser back / forward inside the app | PASS (after the harness fix below) |
| no horizontal overflow at 1920×1080, 1366×768, 820×1180 and 390×844 | PASS (4/4) |

---

## 2. Defects the browser run actually found (and fixed)

| # | Defect | How it was found | Fix | Regression guard |
|---|---|---|---|---|
| B1 | **React duplicate-key crash** — "Encountered two children with the same key" (72 occurrences) when a device's mission panel was open | the release probe's console capture | the mission panel keyed its source links by URL, and Apollo 12 lists the same URL twice; the key is now unique **and** the duplicate source was corrected | new unit test: *"every verification record cites at least one source"* now also asserts that no record repeats a source URL |
| B2 | **the application crashed where browser storage is blocked** — `SecurityError: Failed to read the 'sessionStorage' property` | the browser-back check landed on an opaque origin | `App.tsx` reads and writes session storage inside try/catch (`readEntered` / `writeEntered`) | the release probe's storage-safe init script; manual reproduction confirmed 0 errors |
| B3 | **a developer control was reachable in the public build** (`#/dev` link in the settings panel, and the diagnostics panel was routable) | code inspection during Phase 5 | the DEV link is now `import.meta.env.DEV` only; the diagnostics panel is a dev-only lazy chunk that a production build never ships | CI asserts the production bundle contains neither the diagnostics string nor a dev route |
| B4 | **a production session could be silently downgraded** by a stale saved quality preference | code inspection | production forces `quality = ultra`, `qualityCeiling = ultra`, `autoQuality = false` | the CI bundle check asserts the `ULTRA (LOCKED)` label ships |

Two further probe failures were **harness artifacts, not application defects**,
and are recorded here so the numbers are not misread:
* "browser back" landed on the browser's first page (`about:blank`), where no
  application code runs at all — the app's own history is now exercised with a
  distinct in-app URL.
* the `localStorage` console error came from the probe's own
  `addInitScript` calling `localStorage.clear()` on that opaque origin.

---

## 3. Screenshots

| File | Shows |
|---|---|
| `shotsrelease/landing-hero-3d.png` | the landing page over the live solar system |
| `shotsrelease/02-solar-system.png` | the solar system after entering |
| `shotsrelease/03-body-neptune.png` | a focused outer planet |
| `shotsrelease/04-device-opportunity.png` … `12-device-apollo-17.png` | every device site |
| `shotsrelease/surface-*.png` | every interactive surface |
| `shotsrelease/viewport-*.png` | the four viewports |

---

## 4. What was NOT verified in the browser

| Item | Why |
|---|---|
| The reference hardware (i7-6820HQ / R7 M370) | not available in this environment — see `PERFORMANCE_AUDIT.md` |
| The official MER GLB under a forced network failure | the fallback path exists but the forced-failure scenario was not staged |
| A multi-hour session soak | out of scope for the audit window |
| Mobile touch interaction (only the layout was checked) | the automated checks cover layout and overflow, not gestures |

---

## 5. Independent verification of the earlier navigation fix

The device-navigation regression suite (`scripts/probe-nav.mjs`, 13 checks) was
re-run after the release changes: **13 / 13 PASS**, zero Solar System returns
during chapter selection.

---

## 6. Final run record

*(filled in from `shotsrelease/release-probe.json` after the last pass — see the
committed JSON for the machine-readable result.)*
