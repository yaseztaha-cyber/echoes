# ECHOES — GITHUB RELEASE CHECKLIST

**Date:** 2026-11-13 · Everything below was performed or explicitly marked as a
manual step for a human.

---

## 1. Repository inspection

| Item | Value |
|---|---|
| Repository | `https://github.com/yaseztaha-cyber/echoes` |
| Branch | `main` |
| Visibility | **public** |
| Remote | added as `origin` (it did not exist before this release) |
| History | preserved — no reset, no force-push, no branch deletion, no history rewrite |
| Pushed commits | the complete release history, including the earlier ECHOES work |

## 2. Repository hygiene

| Check | Action |
|---|---|
| `node_modules/` | gitignored, never committed |
| `dist/` | gitignored (build output) |
| `shots*/` (screenshot working directories) | gitignored — **except** the three curated images copied to `docs/images/` for the README |
| `test-results/` | gitignored |
| `.env*` | none exist; `.env.example` not needed (the app has no configuration) |
| Temporary scripts | `scripts/tmp-*.mjs` helpers were deleted; the real probes are kept deliberately |
| The delivered prototype archive (`mars-rover-cinematic-prototype (1).zip`) | **kept in the working tree, not committed** — it is the user's input file, not project source; the module it contains is committed as `src/missions/merb/` |
| Large binaries | the only binary assets are the bundled planet maps (~4.5 MB total) and the official MER model is fetched from NASA at runtime, not committed |
| Licence | no repository-level licence file existed; the asset register states the terms of every third-party asset |

## 3. README

Written from scratch: title, tagline ("Every Journey Leaves a Trace."), hero
images, the problem, the concept, how it works, the implemented feature list,
screenshots, the technology stack, the NASA data sources, installation, local
development, production build, deployment, AI disclosure, asset credits,
limitations, and a clear statement that ECHOES is **not** affiliated with or
endorsed by NASA.

## 4. CI

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
5. a bundle assertion: the production HTML must **not** contain the development
   diagnostics, and must contain the `ULTRA (LOCKED)` production label
6. a secret scan over the tracked files (with the one known false positive
   allow-listed)
7. uploads `dist/` as an artifact

## 5. Publication steps performed

- [x] Remote added and `main` pushed
- [x] Repository created as **public**
- [x] Description, topics and the tagline set
- [x] A GitHub Pages deployment published from `dist/` (static site, no server)
- [x] The public URL opened in a fresh, private browser session and verified
- [x] Repository contents reviewed file by file before publishing

## 6. Deployed

| Item | Value |
|---|---|
| Live site | <https://yaseztaha-cyber.github.io/echoes/> (GitHub Pages, published from `gh-pages`) |
| Verified | in a fresh private browser session: landing, entry, HUD, ULTRA (LOCKED), no dev control, **0 console errors, 0 failed requests** |
| Demo films | <https://github.com/yaseztaha-cyber/echoes-demo> — 29.88 s competition cut + 60.72 s master, both verified playing |

## 7. Steps that still need a human

| Step | Why |
|---|---|
| Confirm the repository description/topics match the team's submission | wording is a team decision |
| Add team members as collaborators (the PAT's owner is the only account available here) | access control |
| Enable branch protection on `main` (CI must pass) | repository settings |
| Confirm the challenge on the submission portal matches the one the team selected | the account must be logged in |
| Accept the participation terms and submit | **irreversible and personal** — deliberately not automated |
