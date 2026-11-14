# ECHOES — DEPLOYMENT VERIFICATION

**Date:** 2026-11-13 · **Public URL:** <https://yaseztaha-cyber.github.io/echoes/>
**Deployment:** GitHub Pages, published from the `gh-pages` branch of
`yaseztaha-cyber/echoes` by `scripts/deploy-pages.mjs`.

---

## 1. What was deployed

| Item | Value |
|---|---|
| Type | static site — no server, no runtime configuration, no credentials |
| Build | `npm run build` → `dist/index.html` (single file, ~15.2 MB, gzip ~10.1 MB) |
| Published files | `index.html`, `404.html` (deep-link fallback), `.nojekyll`, `tex-hi/` (4 streamed planet maps), `vendors/` (Basis transcoder), `stars-deep.bin` (61 814-row star catalogue) |
| Deployment path | a repository sub-path (`/echoes/`) — the build is **base-relative**, so the same artefact also works at a domain root |
| Publisher | `scripts/deploy-pages.mjs` (token read from the environment only; never written to a file, to `.git/config`, or to a stored remote URL) |

## 2. Verification in a fresh, private browser session

Run against the **deployed** site in a brand-new browser context (no cookies, no
localStorage, no cached assets):

```
LANDING ok: true                       ← ENTER ECHOES present and functional
ENTER SIMULATION ok: true              ← the boot sequence completes
APP: {"canvas":2,"nav":true,"mars":true,"dev":false}
SYS panel: {"ultraLocked":true,"devLink":false}
errors: 0
failed requests: 0
```

| Check | Result |
|---|---|
| The landing page loads with the ECHOES identity and a live 3D canvas | PASS |
| ENTER ECHOES enters the experience | PASS |
| The boot airlock completes and the HUD appears | PASS |
| The NAVIGATE panel is present and the bodies are listed | PASS |
| The settings panel reads **GRAPHICS QUALITY · ULTRA (LOCKED)** | PASS |
| **No developer control is reachable in the production build** | PASS |
| Console errors | **0** |
| Failed network requests (404s) | **0** |
| Direct load of a deep link | PASS (404.html falls back to the single-file app) |
| Browser refresh | PASS (served as a static file; the app re-boots from the landing page) |

Screenshots: `shotsrelease/public-landing.png`, `shotsrelease/public-app.png`,
`shotsrelease/public-sys.png`.

## 3. Defect found and fixed during deployment

| # | Symptom | Cause | Fix |
|---|---|---|---|
| D1 | 41 assets 404'd on the public site (`/tex-hi/*.ktx2`, `/stars-deep.bin`, `/vendors/basis/`) | the asset URLs were hard-coded as root-absolute, so they resolved to the domain root instead of the repository sub-path | new `src/lib/asset.ts` (`assetUrl()`) resolves every asset against the deployment base; the Vite build now uses `base: "./"`. Verified: **0 failed requests** after the fix. |

The same build still works at a domain root (the dev-server verification and
the local production preview both pass), because the URLs are relative.

## 4. What is NOT verified

| Item | Why |
|---|---|
| A custom domain / CDN | no domain is configured for this project |
| HTTP security headers | GitHub Pages does not let a repository set them; a real deployment behind a CDN would |
| Automated redeploy on push | the deployment is currently a manual script run; a GitHub Actions workflow could publish the same way (the CI workflow already builds and uploads `dist/` as an artefact) |
| Load behaviour on a slow mobile network | not measured |

## 5. How to redeploy

```bash
GITHUB_TOKEN=<pat> node scripts/deploy-pages.mjs --repo yaseztaha-cyber/echoes
```

The script builds, stages the output in a temporary git worktree (the working
tree is never touched), force-pushes the `gh-pages` branch and ensures the
Pages site points at it.
