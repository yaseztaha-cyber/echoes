# ECHOES — PUBLIC REPOSITORY VERIFICATION

**Date:** 2026-11-13 · **Repository:** <https://github.com/yaseztaha-cyber/echoes>
**Visibility:** public · **Default branch:** `main` · **Live site:** <https://yaseztaha-cyber.github.io/echoes/>

---

## 1. Publication

| Step | Result |
|---|---|
| Repository created through the GitHub API with the account on the PAT | PASS — `yaseztaha-cyber/echoes`, public |
| History pushed | PASS — `main` tracks `origin/main` |
| Repository description, topics and the tagline set | PASS |
| Pages site published from `gh-pages` | PASS — the live URL opens in a fresh private session |
| Files reviewed before publishing | PASS — no secrets, no local databases, no build output, no screenshot dumps |

## 2. What is in the repository

| Folder | Contents |
|---|---|
| `src/` | the application (engine, components, data, state, missions) |
| `public/` | the streamed planet maps, the Basis transcoder and the star catalogue |
| `docs/` | the engineering journals and the per-feature reports |
| `scripts/` | the verification probes and the deployment tool |
| `*.md` (root) | the audit documents, the README and the submission packet |
| `MISSION_INVENTORY.csv` | the machine-readable mission inventory |

## 3. What is deliberately NOT in the repository

| Excluded | Why |
|---|---|
| `node_modules/`, `dist/` | dependencies and build output (gitignored) |
| `shots*/` | the screenshot working directories (gitignored); three curated images were copied to `docs/images/` for the README |
| `test-results/`, `.playwright-mcp/` | test output (gitignored) |
| `agent/`, `.agents/`, `.claude/`, `skills-lock.json` | local tooling (gitignored) |
| `mars-rover-cinematic-prototype (1).zip` | the delivered input archive — not project source. The module it contains ships as `src/missions/merb/` |
| `.env`, local configs | none exist; the app has no configuration and makes no authenticated calls |

## 4. History note (honest)

The repository was published after **five commits authored in this release
session** were rewritten to remove a 165 MB WebM that an earlier, abandoned
approach had added (the file was already deleted from the working tree and the
build; only the historical blob remained, and GitHub refuses any push that
contains a file over 100 MB). The rewrite was limited to those five commits —
**every commit that pre-dates the release session keeps its original hash and
its original content** (verified: `88410f1`, `8ea1f81`, `9a8b76a` and all
earlier are unchanged). No other history was touched, no branch was deleted,
no force-push over an existing remote was performed (the repository was empty
before this push).

## 5. CI

`.github/workflows/ci.yml` runs on every push and pull request to `main`:
dependency install → `tsc --noEmit` → `npm test` → `npm run build` → a bundle
assertion (no development diagnostics in the production HTML, the
`ULTRA (LOCKED)` label present) → a secret scan over the tracked files → the
build is uploaded as an artefact.

The workflow file is committed; **whether it has run green is recorded in
`GITHUB_RELEASE_CHECKLIST.md`** — this session could not observe the GitHub
Actions run from the sandbox.

## 6. Access and ownership — the steps that need a human

| Step | Why |
|---|---|
| Add the other team members as collaborators | only the account that owns the PAT was available |
| Enable branch protection (require CI to pass) | repository settings |
| Confirm the repository description and topics read as the team intends | wording is a team decision |
| Confirm the challenge on the submission portal matches the team's selection | the portal needs the team's own account |
