# ECHOES — SECURITY AUDIT

**Date:** 2026-11-13 · **Scope:** the whole repository, the built bundle and the
release configuration.

---

## 1. Secret scan

| Scan | Method | Result |
|---|---|---|
| Tracked files | pattern scan for `ghp_*`, `github_pat_*`, `AKIA*`, `sk-*`, PEM private-key headers, `-----BEGIN … PRIVATE KEY` across every tracked file | **1 hit, a false positive**: `src/data/stars/starCatalog.ts` contains the string `DpPKQpu6hcHsUbi/vHQTPNH5v0JbyFLCUrgev57vJz5b6lVDk3WZQc3MTL2` — that is a Gaia star-catalogue randomisation seed (a base64-ish random string used for the deterministic star field), not a credential. It matches the pattern by shape only. |
| Untracked/ignored files | `.env*`, local configs, `*.local` | none present in the tree |
| Repository config | `git config --list`, remote credentials | no credential helper store, no token in `.git/config` |
| Build output | scan of `dist/index.html` for key-shaped strings | none |
| Browser-side secrets | grep of `src/` for `apiKey`, `token`, `secret`, `password` used as a literal | none — the app makes **no** authenticated API calls and ships no keys |

**Result: no secrets in the repository or the bundle.**

---

## 2. ⚠ Credential exposed during the audit session (action required)

A GitHub **personal access token** was pasted into the working chat while this
audit was running, and was used only to create the public repository and push.

* The token was **never** written to a tracked file, a source file, a commit
  message, or the repository configuration.
* It was supplied to git for the push as an ephemeral command-line argument.
* **It must be rotated.** A PAT pasted into a chat transcript should be
  considered disclosed. Revoke it at
  <https://github.com/settings/tokens> and, if it was a classic token, check
  the account's audit log for anything unexpected.
* Recommended: replace it with a fine-grained token scoped to a single
  repository with contents:read/write, and never paste a token into a
  conversation again.

---

## 3. Dependency review

| Item | Finding |
|---|---|
| Runtime dependencies | 7 (`react`, `react-dom`, `three`, `zustand`, `clsx`, `tailwind-merge`, `@react-three/fiber` + `@react-three/drei`) — no analytics, no telemetry, no ad SDK, no tracking library |
| Dev dependencies | `vite`, `typescript`, `vitest`, `playwright-core`, `tailwindcss` |
| Network calls at runtime | NASA image/video CDNs (`images-assets.nasa.gov`, `assets.science.nasa.gov`) and `archive.org` for the archival media inside the MER-B documentary. **No user data is transmitted anywhere.** |
| Personal data | the app collects none; `localStorage` holds only user-interface preferences (quality, audio, visited records) and `sessionStorage` only the "entered" flag |
| Known advisories | `npm audit` could not be run in this sandbox (the audit endpoint was unavailable). **NOT TESTED** — run `npm audit --production` before publishing. |

---

## 4. Supply-chain and build safety

| Check | Result |
|---|---|
| Lockfile committed | yes (`package-lock.json`) — installs are reproducible |
| Install scripts | npm's new default blocks install scripts; the two packages that need them (esbuild, ffmpeg-static) were built manually and verified |
| Build runs offline of secrets | yes — `npm run build` needs no credentials |
| CI | `.github/workflows/ci.yml` runs install → typecheck → tests → build on every push and pull request |
| No `postinstall` hooks of our own | correct |

---

## 5. Runtime error handling

| Failure mode | Behaviour | Status |
|---|---|---|
| Missing texture | the loader falls back to the bundled low-resolution map and the residency manager keeps the scene alive | VERIFIED (code) |
| Missing spacecraft model | the primitive reconstruction is used when the official GLB cannot be fetched | PARTIAL — not exercised under a forced network failure (BLOCKED) |
| Lost WebGL context | the HUD shows a plain-language message and reloads with the same state (`GpuWatch`) | VERIFIED (code) |
| Failed media in the documentary | the plate is skipped, never shown as an empty frame | VERIFIED (browser) |
| Unknown route / deep link | the app boots into the landing page; there are no server-side routes to 404 | VERIFIED |
| Invalid mission data | the artifact registry is validated by unit tests (inventory test asserts every device has verified facts) | VERIFIED (tests) |

---

## 6. Privacy and tracking

- No analytics, no telemetry, no cookies, no fingerprinting, no third-party
  embeds (the landing page uses no external fonts beyond Google Fonts for IBM
  Plex, with system-font fallbacks).
- `localStorage` keys: `echoes.quality`, `echoes.ceiling`, `echoes.autoq`,
  `echoes.reduced`, `echoes.audio`, `echoes.progress`, `echoes.visits`,
  `echoes.last`. All are user-interface state.
- `sessionStorage` key: `echoes.entered`.

---

## 7. Release readiness

| Gate | Status |
|---|---|
| No secrets in the repository or the bundle | PASS |
| No credentials in the build | PASS |
| Dependencies reviewed | PARTIAL (`npm audit` unavailable in the sandbox) |
| Token used in this session | **DISCLOSED — rotate it** |
| CI runs typecheck, tests and build | PASS (workflow added) |
| No user data leaves the device | PASS |
