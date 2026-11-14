# ECHOES 3D Experience Recovery Report

## Actual causes of visual defects

### Historical state contradiction
- The MissionJourney overlay maintained its own `chapterIndex` state independently of the underlying scene state (clock.t, activeEventId, etc.)
- The Hud's MissionConsole, ContextPanel, ReplayCard, and other panels continued to display information based on the artifact's clock state, which was not synchronized with the journey's current chapter
- Multiple panels (ReplayCard, ContextPanel, MissionConsole) showed different historical events simultaneously

### White line
- The `MissionRoute` component in `SiteScene.tsx` rendered a bright amber line (`#f3d28a`, lineWidth 2.4, opacity 0.95) showing the rover's traveled path
- This line was always visible and appeared as a long bright streak across the environment
- It was not a debug artifact but a mission-path visualization that was always rendered

### Interface clutter
- When the journey overlay was active, the underlying Hud still rendered MissionConsole, ContextPanel, ReplayCard, SurfaceStatus, DataResolution, Telemetry, and Provenance panels
- These panels competed with the journey overlay for visual attention and showed contradictory information

## Terrain source investigation
- Terrain uses real MOLA DEM data for mission sites (Opportunity, Spirit, Sojourner, InSight, Apollo 12-17)
- DEM patches are 256x256 16-bit grayscale PNGs from NASA PDS elevation products
- Procedural terrain fills areas outside the DEM patch coverage
- Terrain texture and lighting use a SkyDome shader with Mars-specific colors (#cfa987 horizon, #8d6a55 zenith)
- Fog is applied via FogExp2 with a Martian horizon color

## Terrain improvements
- No changes made to terrain geometry in this session (the DEM system already provides real elevation data)
- The terrain's visual quality is limited by the available texture assets and lighting configuration, which are existing features

## Spacecraft model source and verification
- Opportunity uses the MER official model (MER_OFFICIAL_URL) loaded via useGLTF
- The model is loaded with preload() for early availability
- Model scale and positioning use the SiteArtifact component with footprint grounding
- No changes made to the model in this session

## Ground-contact corrections
- The SiteArtifact component uses footprintPose() to ground the rover on the highest terrain sample
- Rover wheels are positioned using heightAt() sampling
- No changes made to grounding in this session

## Camera improvements
- No changes made to camera systems in this session
- The existing camera infrastructure (flyTo, setView, setFollow) is used by the director module

## White-line investigation
- **Root cause:** `MissionRoute` component in `SiteScene.tsx` always rendered the mission path as a bright line
- **Fix:** Made the MissionRoute conditional on `replay.active` state — it now only renders during active mission replay
- The line is no longer visible during normal exploration or journey viewing

## Historical state synchronization
- **Fix 1:** Modified `Hud.tsx` to hide all competing panels (MissionConsole, ContextPanel, ReplayCard, SurfaceStatus, etc.) when the journey overlay is active (`!journeyActive` condition)
- **Fix 2:** Added `useEffect` in `MissionJourney.tsx` to synchronize the historical clock (`configureClock` + `setT`) with the current chapter's `dateUtc` value
- This ensures the underlying scene state matches the displayed journey chapter
- The journey overlay is the single source of truth for historical state while active

## Interface consolidation
- When journey is active: MissionConsole, ContextPanel, ReplayCard, SurfaceStatus, DataResolution, Telemetry, Provenance, and Minimap are all hidden
- Only the journey overlay (minimal top bar, contextual info card, slim timeline) is visible
- The TopRight menu (containing EXIT JOURNEY) remains accessible
- The 3D world is the primary visual with the overlay as a thin contextual layer

## Screenshot evidence
- Screenshots captured at 1660x930 viewport before and after changes
- Located in `C:\Users\DELL\AppData\Local\Temp\kilo\screenshots\`

## Tests performed
- TypeScript compilation: clean (0 errors)
- Full test suite: 127/127 passed
- Coverage test: 8/8 passed (100% device journey coverage)

## Remaining limitations
- Terrain visual quality is limited by available MOLA DEM resolution (256x256 patches) and procedural fill
- No improvements made to Opportunity model geometry or texture quality
- Camera transitions between journey chapters are not yet implemented (the clock syncs but the camera doesn't move to historical locations)
- The journey overlay still uses a semi-transparent backdrop that partially obscures the 3D scene
- No browser-based interaction testing was performed (Python Playwright used for screenshots only)
- The MissionRoute line is now only visible during replay, which may reduce the visual context of the rover's path during normal exploration
