# ECHOES — AI USE DISCLOSURE

**Date:** 2026-11-13 · **Project:** ECHOES — planetary exploration system

NASA Space Apps asks teams to disclose how AI tools were used. This is the
complete, honest record for ECHOES.

---

## 1. AI coding assistants

| Tool | Where it was used | What it produced |
|---|---|---|
| **OpenAI Codex / Claude Code style agentic coding assistants** (this project was built and audited with AI coding agents working directly in the repository) | across the whole codebase — React components, three.js engines, data files, tests, tooling and documentation | the majority of the source code, the scripts under `scripts/`, and every markdown document in the repository |

Every AI-written file was reviewed, executed and verified before it shipped:
the test suite (159 tests at the time of this audit) and the browser probes in
`scripts/` are the evidence that the code works, not that it was written by a
person or by a machine.

**No AI-generated binary asset ships as NASA archival material.** Where the
product uses imagery, that imagery is NASA/JPL/USGS material, credited in
`ASSET_LICENSE_AND_ATTRIBUTION.md`.

---

## 2. AI-generated imagery and video

| Item | Status |
|---|---|
| AI-generated photographs | **none** in the product |
| AI-generated video | **none** in the product |
| AI-generated textures | **none** in the product |
| AI-generated audio | **none** in the product |

The one non-observational visual in ECHOES is the **Solar System Scope artist
solar map** (`sun_sss.jpg`). It is **not AI-generated** — it is a human-made
artist's map, licensed **CC BY 4.0** — and the product labels it explicitly as
**"ARTISTIC VISUALIZATION — NOT AN OBSERVATION (CC BY 4.0)"** in the Solar
Layer Explorer and in the asset manifest. It is never presented as NASA
archival imagery, and it carries no NASA branding.

**During this audit** an intermediate approach was tested in which the MER-B
documentary was rendered to a 165 MB WebM for playback. That file was
**discarded** (it duplicated the code-based experience) and does not exist in
the released build; the documentary now runs as code. No AI-generated imagery
or video was produced in that experiment either — it was a screen capture of
the project's own 3D scenes.

---

## 3. AI-assisted code, data and text

| Area | Disclosure |
|---|---|
| Application code | Written with AI coding assistants, reviewed and tested by the team. |
| Mission narrative text | Drafted with AI assistance **from cited primary sources**; every factual claim is traceable through `MISSION_SOURCE_REGISTER.md`, and the launch/landing/end dates were verified against NASA pages and the NSSDCA master catalog during this audit. |
| Mission data (`src/data/artifacts/**`) | Written with AI assistance, then **verified** against NASA sources; three Apollo launch dates and two end dates were corrected during the audit precisely because the generated values were wrong. |
| Documentation | Drafted with AI assistance and checked against the running application. |
| Scientific claims | No claim is included without a source. Where information could not be verified, the product says so (see the LIMITED rows in `MISSION_AUDIT_RESULTS.md`). |

---

## 4. Human verification performed

| Area | Verification |
|---|---|
| Mission facts | checked against science.nasa.gov mission pages, nasa.gov mission pages and the NSSDCA master catalog (access date 2026-11-13) |
| Code | `tsc --noEmit` clean; 159 unit tests; browser probes in `scripts/` (device navigation, mission film, release audit) |
| Visual output | screenshots at 1920×1080, 1366×768, tablet and phone viewports |
| Performance | measured in-browser (FPS, frame-time p95, draw calls, triangles) — see `PERFORMANCE_AUDIT.md` |
| Assets | licence and attribution register completed (`ASSET_LICENSE_AND_ATTRIBUTION.md`) |

---

## 5. What the team is *not* claiming

- That NASA endorses, reviewed or contributed to ECHOES.
- That any AI-generated material is NASA archival footage.
- That any benchmark, feature or scientific result in this repository was
  fabricated — every measurement in the reports came from a run on the machine
  named in the report.

---

## 6. Submission note (copy for the NASA Space Apps form)

> AI coding assistants were used to write and refactor the application code,
> the build/verification scripts and the documentation. All factual mission data
> was verified against NASA mission pages, the NASA NSSDCA master catalog and
> the primary literature, with the sources recorded in
> `MISSION_SOURCE_REGISTER.md`; several generated dates were corrected during
> that verification. No AI-generated images, video, textures or audio are used
> in the product — every image, plate and film is NASA/JPL/USGS archival
> material or a human-made artist map that is explicitly labelled as such
> (CC BY 4.0). The only non-observational visual, the Solar System Scope solar
> map, carries a visible "ARTISTIC VISUALIZATION — NOT AN OBSERVATION" label and
> its attribution, and contains no NASA branding or identifiers.
