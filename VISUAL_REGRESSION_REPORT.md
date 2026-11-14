# ECHOES — VISUAL REGRESSION REPORT

**Date:** 2026-11-13 · Screenshots are produced by the release probe at four
viewports and are stored in `shotsrelease/`.

---

## 1. Viewports captured

| Viewport | Purpose | Result |
|---|---|---|
| 1920×1080 | the release target | PASS |
| 1366×768 | the common laptop | PASS |
| 820×1180 | tablet | PASS |
| 390×844 | phone | PASS |

At every width the probe asserts **no horizontal overflow**
(`scrollWidth <= clientWidth + 2`) and that the WebGL canvas is still present.

## 2. What each capture shows

| File | Scene | What it verifies |
|---|---|---|
| `landing-hero-3d.png` | the landing page | the hero is the live 3D solar system with the editorial type over it; the scrim keeps the headline legible |
| `02-solar-system.png` | the solar system after entering | body labels, orbit paths, the Milky Way, the HUD |
| `03-body-neptune.png` | an outer planet focused | focus framing, label placement |
| `04-device-opportunity.png` … `12-device-apollo-17.png` | every surface device | the terrain, the vehicle, the arrival overlay, the mission route |
| `surface-*.png` | SEARCH, ARCHIVE, FILM, GROUND TRUTH, MISSION LAB, SYS | every overlay renders real content |
| `viewport-*.png` | the four widths | layout integrity |

## 3. Visual regressions found and fixed during the audit

| # | Symptom | Cause | Fix |
|---|---|---|---|
| V1 | the mission panel threw a React duplicate-key error, which can drop or duplicate children | the source links were keyed by URL and Apollo 12 lists the same URL twice | unique keys + the duplicated source corrected + a unit test that forbids repeated source URLs |
| V2 | the landing page was a flat gradient with type on top | the landing page did not mount the 3D world | the world now renders behind the page with a slow camera drift; the hero scrim was re-tuned for legibility |
| V3 | the landing page's editorial sections lost their backdrop when the hero became transparent | the sections inherited the page's transparent background | the editorial body now sits on an opaque surface, the hero stays live |
| V4 | the settings panel exposed a "DEV" link in the public build | the link was unconditional | it is now `import.meta.env.DEV` only |

## 4. Typography, spacing and alignment

| Element | Standard | Status |
|---|---|---|
| Instrument/label type | IBM Plex Mono, 10 px, 0.12–0.14 em tracking, uppercase | consistent across the HUD, panels and overlays |
| Body type | IBM Plex Sans, 13–17 px | consistent |
| Panels | 1 px borders (`#1d2429` / `#262e34`), no rounded corners, no gradients, no glass | consistent |
| Accent | amber `#d0a45b` for primary actions, cyan `#7fb8c7` for links, slate for secondary | consistent |
| Alignment | 4 px spacing grid; labels align to a 32 px column | consistent |

## 5. Accessibility visible in the screenshots

* Every interactive element has an accessible name (`aria-label` on icon-only
  controls).
* Focus states are the native outline, never removed.
* Reduced-motion is a first-class setting and is honoured by the transitions.
* Text contrast: bone `#d8d6ce` on ink `#080b0e` (≈14:1), ash `#a2a6a4`
  (≈8:1), slate `#6f7576` (≈4.6:1) — all above the 4.5:1 threshold for body
  text.

## 6. Not verified visually

| Item | Why |
|---|---|
| Screen-reader walkthrough | no assistive technology available in the audit environment |
| Print styles | not a target for a WebGL product |
| Colours under forced high-contrast modes | not staged |
