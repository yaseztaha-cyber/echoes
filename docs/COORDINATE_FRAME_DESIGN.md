# COORDINATE FRAME DESIGN — ECHOES Phase 2

Authoritative spatial model. Implementation: `src/engine/frames/frames.ts`
(tests: `frames.test.ts`, 19 tests). The orbital math itself is unchanged and stays
implemented in `src/engine/solar-system/model.ts`; the frames module is the single
access point the rest of the app imports from.

## 1. The three layers

```text
SCI        authoritative science — AU, km, degrees. Measurements live here.
  │  sciBodyPosAU · sciDistanceKm · surfacePointKm
  ▼
PRESENT    navigation/presentation — sqrt-compressed scene units. Camera lives here.
  │  presentBodyPos · surfacePointGlobe · (GLOBE_R globes, metre site frames)
  ▼
RENDER     camera-relative scene units — FloatingOrigin. GPU lives here.
```

Nothing in PRESENT may flow into a measurement without passing through an explicit
inverse (`presentRadiusToAU`, `globePointToKm`). Nothing in SCI reaches the GPU
except through the PRESENT mapping.

## 2. Frame inventory

| Frame | Parent | Axes / handedness | Units | Defined by |
|---|---|---|---|---|
| SCI-HELIO | — (root) | Right-handed Y-up; ecliptic = XZ plane; longitude grows toward −Z: `x = r·cosL, z = −r·sinL` | AU | `realPos` (circular J2000 mean-longitude model) |
| SCI-BODY | SCI-HELIO translated | Body-fixed: +Y north pole, lon 0° at +X, east-positive | km | `surfacePointKm` + `RADIUS_KM` |
| PRESENT-SOLAR | — (render root while `scene === "solar"`) | Same orientation as SCI-HELIO | scene units, `r = ORBIT_K·√a`, `ORBIT_K = 20` | `presentBodyPos` |
| PRESENT-GLOBE | PRESENT-SOLAR (conceptual) | Same orientation as SCI-BODY | scene units, globe radius `GLOBE_R = 100` | `surfacePointGlobe`, uniform scale `GLOBE_R / R_km` |
| SITE-LOCAL | PRESENT-GLOBE (tangent patch) | +x east, +z south, +y up, metres from site origin | m | `SiteScene` / `siteRef`, `localToLonLat` for geo lookup |
| ROVER | SITE-LOCAL | +x forward, +y up, metres | m | `hardware[].pos` (e.g. Pancam `[0.3, 1.52, 0.15]`) |
| RENDER | PRESENT-* shifted by `−origin` | Same orientation as parent | scene units | `FloatingOrigin` |

What we deliberately do NOT claim: SCI-HELIO is not barycentric, not inertial-grade
(no perturbations, no inclination/eccentricity — circular ecliptic model, documented in
`model.ts`); globes do not rotate (textures are static; rotation is a listed limitation);
SITE-LOCAL is a tangent-plane approximation, valid within kilometres of the site.

## 3. Transformation conventions

- Forward PRESENT mapping (planets): `r_present = 20·√a_AU`. Inverse: `a = (r/20)²`
  (`presentRadiusToAU`), exact for circular planets by construction.
- Globe mapping is a uniform scale, therefore exactly invertible both ways
  (`globePointToKm` / `kmPointToGlobe`).
- The Moon's visual orbit (2.4 units about Earth) is NOT physical; the inverse
  returns Earth's semi-major axis and says so. Voyager's inverse returns its AU model.
- Surface direction convention is shared: `lonLatToVec` ⇄ `vecToLonLat`
  (note: inverse longitude wraps to (−180°, 180°]; compare angles modulo 360°).
- Every transform takes an explicit `out` vector where hot-path reuse matters and
  never mutates its inputs.

## 4. Floating origin / rebasing

`FloatingOrigin` holds the PRESENT-frame render origin. `toRender`/`toWorld` convert;
`rebase(newOrigin, nodes)` shifts every registered node (scene groups, camera
position, and `{ position: controls.target }`) by −delta, so the rendered view is
identical after the shift. Tested: round-trip, world-position preservation across
rebase, double-rebase without drift.

**Measured need (honest):** current magnitudes (solar view ~110 units, Voyager trail
~260) are exact in float32 to ~1e-5 units — no jitter is demonstrable today, so the
render loop does NOT rebase yet. The class is implemented and tested for Phase 5
streaming, which will need it. No continuous loops or duplicate updates were added.

## 5. How the camera director uses the system

The director (`engine/director.ts`) operates purely in PRESENT (+SITE/ROVER for
inspection) and is unchanged mathematically — its five import sites now come from
the frames module. Continuity invariants (tested):
- `travelToBody`: `rel = (cam − body)·(GLOBE_R / body.radius)` preserves apparent
  size across the solar→planet swap.
- `returnToSolarSystem`: dividing by the same factor inverts exactly.
- `selectSite`/`descendToSite`/`leaveSite`: unit-sphere directions scaled to
  `GLOBE_R`, i.e. PRESENT-GLOBE vectors by construction.
- Follow targets (`setFollow(() => bodyPos…)`) re-evaluate in the same frame the
  camera renders, so no frame-mixing jumps.
- Telemetry already measured in SCI (`realDistanceKm`, `realPos`); minimap draws in
  PRESENT. That split is now architectural, not accidental.

## 6. Worked numerical examples (all verified by tests)

- Earth at J2000: PRESENT radius `20·√1 = 20.0`; SCI distance to Sun exactly 1 AU.
- Mars at J2000: PRESENT `20·√1.524 ≈ 24.69`; SCI `1.524 AU`; inverse recovers it.
- Earth→Mars PRESENT ratio `24.69/20 ≈ 1.235 ≠ 1.524` — the compression is
  nonlinear by design; a test guards against silent linearization.
- Opportunity site (−1.9462°, 354.4734°): globe vector length exactly 100;
  kilometre vector length exactly 3389.5; round-trip error < 1e-9 units.
- 1 km east at Meridiani shifts longitude by the spherical-earth value to 1e-9°.

## 7. Known precision limits

- JS float64 holds AU positions to ~0.02 mm equivalent — SCI is never the limit.
- GPU float32 at 260 units resolves ~3e-5 units — invisible at every camera range
  the director uses. Revisit if a single continuous frame ever spans >1e5 units.
- Tangent-plane SITE-LOCAL error grows quadratically with distance; mission sites
  span metres-to-kilometres, error is sub-millimetre. Do not reuse it for regional
  distances — use SCI surface vectors instead.

## 8. Deferred to later phases (explicitly NOT in Phase 2)

Planetary rotation state; real DEM-backed site frames (Phase 9); tile-local frames
for streaming (Phase 5); trajectory frames for spacecraft (Phase 9); any texture,
star, sun, terrain-data, or UI change.
