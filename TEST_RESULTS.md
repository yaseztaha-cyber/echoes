# ECHOES — TEST RESULTS

**Date:** 2026-11-13 · Run on the audit machine.

---

## 1. Automated suite

```
$ npx vitest run

 Test Files  18 passed (18)
      Tests  160 passed (160)
   Duration  ~5 s
```

| Suite | Files | Tests | Result |
|---|---|---|---|
| Data & registries | 5 | ~60 | PASS — planet/moon registry, mission inventory, asset manifest, journey coverage, star catalogue |
| Frames & orbital mechanics | 3 | ~40 | PASS — Keplerian propagation, frame conversions, the solar↔planet swap inversion |
| Terrain & performance | 4 | ~25 | PASS — DEM stitching, height fields, rock scatter, adaptive quality, dynamic resolution |
| Mission film registry | 1 | 7 | PASS — **new**: MER-B only, verified dates match the artifact records, Voyager 1 has no end date, no duplicate source URLs, the inventory CSV and source register are generated |
| Device navigation | 1 | 19 | PASS — same-planet and cross-planet transfers, site-to-device, site exit, pre-landing chapters, post-landing chapters, rapid selections, stale callbacks, invalid devices, every registered device, and the assertion that a device transfer never calls `returnToSolarSystem` |
| World & textures | 3 | ~15 | PASS — galactic frame, texture residency, GPU-string quality detection |

### 1.1 Tests added by this release audit

| Test | Guards |
|---|---|
| "every registered device has verified mission facts" | the audit registry cannot drift from the device list |
| "the verified launch date matches the artifact record" | the corrected Apollo launch instants (this test caught a month-index slip in the new data before it shipped) |
| "the verified landing date matches the artifact record" | landing instants |
| "a mission with no end date is genuinely ongoing" | Voyager 1 must never be recorded as finished again |
| "every verification record cites at least one source" (with the no-duplicate-URL rule) | source attribution and the React-key collision that this audit found |
| "writes MISSION_INVENTORY.csv" / "writes MISSION_SOURCE_REGISTER.md" | the generated audit artefacts stay in step with the code |

## 2. Type checking

```
$ npx tsc --noEmit
(clean)
```

The tree **did not type-check** at the start of the audit (an unused state
variable in the landing page); it does now, and CI runs it on every push.

## 3. Production build

```
$ npm run build
✓ built in ~25 s
dist/index.html          15.0 MB (single file, gzip 10.0 MB)
dist/films/…             the MER-B documentary assets (when present)
dist/tex-hi/…            the streamed high-resolution planet maps
```

The build asserts (in CI) that the production bundle contains **no**
development diagnostics and does carry the `ULTRA (LOCKED)` production label.

## 4. Browser verification (real application)

```
$ PROBE_BASE=http://localhost:5190/ node scripts/probe-release.mjs

SCENARIOS: 55 | FAILED: 0        ← final run
ERRORS: 0
FAILED REQUESTS: 0
```

| Suite | Checks | Result |
|---|---|---|
| Landing + entry | 5 | PASS |
| Celestial bodies | 10 | PASS |
| Devices (site + journey + verified panel) | 27 | PASS |
| Interactive surfaces | 6 | PASS |
| Performance, reload, history, four viewports | 7 | PASS |

Details and screenshots: `BROWSER_VERIFICATION_REPORT.md`, `shotsrelease/`.

## 5. Additional browser suites re-run after the release changes

| Suite | Checks | Result |
|---|---|---|
| `scripts/probe-nav.mjs` — device navigation | 13 | PASS (zero Solar System returns during chapter selection) |
| `scripts/probe-film.mjs` — the MER-B mission film | 23 | PASS (mounts, plays, seeks, scrubs, sound, state-safe, no accumulation) |

## 6. Honest gaps

| Gap | Status |
|---|---|
| `npm audit` (dependency advisories) | **NOT TESTED** — the audit endpoint was unreachable from the sandbox |
| the reference hardware (i7-6820HQ / R7 M370) | **NOT TESTED** — not available; measurements are from the audit machine and labelled as such |
| multi-hour session soak | **NOT TESTED** |
| forced network failure for the official MER model | **NOT TESTED** — the fallback exists but the scenario was not staged |
| touch gestures | **NOT TESTED** — layout and overflow were verified at 390 px |
