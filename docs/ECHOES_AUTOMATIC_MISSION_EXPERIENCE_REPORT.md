# ECHOES Automatic Mission Experience Report

## 01 — Removed Journey-Entry Dependencies

- Removed `MISSION JOURNEY` / `OPPORTUNITY JOURNEY` buttons from TopRight menu
- Journey no longer requires a separate button click
- No `START JOURNEY` button
- No theater-mode activation
- No separate presentation screen

## 02 — Automatic Initialization

When a user selects a device (via `goToArtifact` in `director.ts`):
1. Device record is resolved
2. Parent mission is resolved
3. Journey data is resolved
4. Default entry stage (chapter 0) is used
5. Celestial environment is loaded (via existing `descendToSite`)
6. Hardware assets are loaded
7. Camera is established (existing arrival animation)
8. Mission timeline is activated automatically
9. Contextual mission information appears
10. Journey overlay activates automatically (`set({ overlay: "mission-journey" })`)

No separate journey-entry click required.

## 03 — Default Entry Stage Per Device

All devices use chapter 0 (first chapter) as the entry stage. Each device's first chapter is:
- Opportunity: "The reason for the mission" (concept/development)
- Spirit: "The reason for the mission" (concept/development)
- Sojourner: "The reason for the mission" (concept/development)
- InSight: "The reason for the mission" (concept/development)
- Apollo 12-17: "Mission development" (Apollo program)
- Voyager 1: "The reason for the mission" (concept/development)

## 04 — Unified Historical State

- Journey overlay synchronizes historical clock with chapter dateUtc
- Competing Hud panels hidden when journey is active
- Single source of truth: journey overlay chapterIndex
- All state updates are coherent

## 05 — Mission-Specific Scene System

- Terrain: Real MOLA/LOLA DEM patches for all mission sites
- Models: Official NASA GLB for MER rovers, reconstructed primitives for others
- Camera: Existing infrastructure (flyTo, setView, setFollow) used
- Scene transitions: Clock synchronization implemented

## 06 — Hardware and Asset Verification

| Model | Source | Type |
|---|---|---|
| MER (Opportunity/Spirit) | NASA 3D Resources (MER_static.glb) | Official |
| Sojourner | Reconstructed | Primitive |
| InSight | Reconstructed | Primitive |
| Apollo LM | Reconstructed | Primitive |
| Voyager 1 | Reconstructed | Primitive |

## 07 — Environment Coverage

- Mars: SkyDome shader, MOLA DEM terrain, FogExp2, hemisphere lighting
- Moon: Stars, LOLA DEM terrain, directional lighting
- All sites: RockField, Beacon, SiteTelemetry

## 08 — Historical Media Integration

- Media references by ID in journey data
- Opportunity: PIA images, launch footage, EDL animation
- Other devices: References exist but not all have corresponding files

## 09 — Visual Screenshots

- Screenshots captured at 1660x930 viewport
- Located in temp directory

## 10 — Automated Test Results

- 127/127 tests pass
- 8/8 coverage tests pass (100% device coverage)
- TypeScript compiles clean
- Production build succeeds

## 11 — Performance Measurements

- Production build: 14,968.57 kB (single file), built in 28.52s
- Dev server startup: ~3-17 seconds
- No runtime performance benchmarks taken

## 12 — Remaining Genuine Limitations

1. Camera transitions between journey chapters not yet implemented (scene stays at site position)
2. Orbital/flyby-specific environments not implemented
3. Historical media files for non-Opportunity devices referenced but not all exist
4. Scene-specific environment changes per chapter not implemented
5. Interactive scientific target inspection existing but not wired to journey
6. Only MER rovers use official NASA 3D model; others use primitive reconstructions
7. Terrain visual quality limited by 256x256 DEM resolution and procedural fill
8. Journey overlay is 2D HUD over 3D scene, not fully integrated 3D experience
9. No browser-based interaction testing performed
