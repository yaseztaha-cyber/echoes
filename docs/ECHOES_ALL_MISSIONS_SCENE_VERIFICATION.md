# ECHOES All Missions Scene Verification

## Note

This document provides an honest assessment of the current state of visual scene implementation across all mission journeys. The verification is based on code inspection and the existing 3D rendering infrastructure.

## Device Coverage

| Mission | Device | Historical Stages | Environment Type | Hardware Model | Scene Status |
|---|---|---|---|---|---|
| Mars Exploration Rover | Opportunity | 23 | Mars (MOLA DEM) | Official NASA GLB (MER_static.glb) | Site-specific terrain, rover model, mission path |
| Mars Exploration Rover | Spirit | 11 | Mars (MOLA DEM) | Official NASA GLB (MER_static.glb) | Site-specific terrain, rover model |
| Mars Pathfinder | Sojourner | 7 | Mars (MOLA DEM) | Reconstructed primitive | Site-specific terrain, rover model |
| InSight | InSight | 9 | Mars (MOLA DEM) | Reconstructed primitive | Site-specific terrain, lander model |
| Apollo 12 | Apollo 12 LM | 10 | Moon (LOLA DEM) | Reconstructed primitive | Site-specific terrain, LM + ALSEP |
| Apollo 14 | Apollo 14 LM | 10 | Moon (LOLA DEM) | Reconstructed primitive | Site-specific terrain, LM + ALSEP |
| Apollo 15 | Apollo 15 LM | 10 | Moon (LOLA DEM) | Reconstructed primitive | Site-specific terrain, LM + ALSEP + LRV |
| Apollo 16 | Apollo 16 LM | 10 | Moon (LOLA DEM) | Reconstructed primitive | Site-specific terrain, LM + ALSEP + LRV |
| Apollo 17 | Apollo 17 LM | 10 | Moon (LOLA DEM) | Reconstructed primitive | Site-specific terrain, LM + ALSEP + LRV |
| Voyager Interstellar Mission | Voyager 1 | 7 | Deep space | Reconstructed primitive | Voyager model, solar system view |

## Terrain System

- **Mars missions:** Real MOLA DEM patches (256x256, 16-bit) for Opportunity, Spirit, Sojourner, InSight
- **Moon missions:** Real LOLA DEM patches (256x256, 16-bit) for Apollo 12, 14, 15, 16, 17
- **Procedural fill:** Outside DEM patch coverage, procedural terrain with documented crater positions
- **Sky dome:** Mars-specific shader (horizon #cfa987, zenith #8d6a55)
- **Fog:** FogExp2 with Martian horizon color

## Model Authenticity

| Model | Type | Source | Verification |
|---|---|---|---|
| MER (Opportunity/Spirit) | Official NASA | NASA 3D Resources (MER_static.glb) | Bounds-verified, metric scale |
| Sojourner | Reconstructed | Documented dimensions | Primitive geometry |
| InSight | Reconstructed | NASA documentation | Primitive geometry |
| Apollo LM | Reconstructed | Apollo Lunar Surface Journal | Primitive geometry, arrangement approximate |
| Voyager 1 | Reconstructed | NASA Voyager documentation | Primitive geometry |
| Lunar Roving Vehicle | Reconstructed | Apollo documentation | Primitive geometry |

## Historical State Synchronization

- Journey overlay synchronizes historical clock with chapter dateUtc
- Competing Hud panels hidden when journey is active
- Single source of truth: journey overlay chapterIndex

## Limitations

1. **Scene transitions per chapter:** The clock synchronizes with chapter dates, but camera movements to historical locations are not yet implemented. The 3D scene remains at the site's default position.

2. **Model authenticity:** Only Opportunity/Spirit use the official NASA GLB model. All other spacecraft use primitive reconstructions.

3. **Terrain coverage:** DEM patches cover ±0.25° around landing points (7-15 km). Areas beyond this use procedural terrain.

4. **Historical media:** Media references exist by ID but not all have corresponding image files in the assets directory.

5. **Orbital/flyby environments:** No orbital or flyby-specific environments implemented. Voyager 1 shows the spacecraft model but not an interstellar environment.

6. **Camera transitions:** The existing camera infrastructure (flyTo, setView) is available but not yet wired to journey chapter changes.

## Visual Verification Status

- Screenshots captured at 1660x930 viewport
- TypeScript compiles clean
- 127/127 tests pass
- No visual regression testing performed beyond screenshot capture

## Conclusion

The universal mission journey system is complete at the data and UI level (100% device coverage, 10 journeys, 100+ chapters). The 3D scene infrastructure exists (real DEM terrain, spacecraft models, camera systems). However, the integration between journey chapters and 3D scene transitions (camera movements, environment changes) is not yet implemented. This is the primary remaining gap for a fully immersive experience.
