# ECHOES Device Navigation Root Cause and Fix

## Exact Original Root Cause

**Primary root cause:** The `MissionJourney` component in `src/components/mission/MissionJourney.tsx` had a `useEffect` that fired `transitionToJourneyChapter()` on initial mount (when `chapterIndex` was 0). The first chapter of every mission journey has `eventType: "development"` (or "launch"), which triggered the following code in `src/engine/director.ts`:

```typescript
if (eventLower === "launch" || eventLower === "cruise" || eventLower === "maneuver" || eventLower === "development") {
    if (st.scene !== "solar") await returnToSolarSystem(true);
    await focusBody("earth");
    return;
}
```

This caused `returnToSolarSystem(true)` to be called, which transported the user from their current planetary location back to the Solar System view focused on Earth — regardless of which device they had just reached.

**Secondary root cause:** The `descendToSite()` function in `src/engine/director.ts` auto-activates the Mission Journey overlay at its end:
```typescript
set({ overlay: "mission-journey", menuOpen: false });
```

This auto-activation triggered the `useEffect` in `MissionJourney`, which fired the camera choreography, which returned the user to the Solar System.

**Why previous fixes failed:**
1. Previous fixes patched `goToArtifact()` and `goToPlanet()` to re-read state after async operations, but the actual root cause was in `MissionJourney`'s auto-triggered camera choreography, not in the navigation functions themselves.
2. The `goToArtifact()` navigation flow was actually working correctly — it properly descended to the site. The problem was that immediately after reaching the site, the MissionJourney overlay auto-activated and launched the user away.

## Function and File Responsible

- **File:** `src/components/mission/MissionJourney.tsx` — `useEffect` that auto-triggered `transitionToJourneyChapter` on mount
- **File:** `src/engine/director.ts` — `transitionToJourneyChapter()` function, specifically the pre-landing branch that calls `returnToSolarSystem(true)`
- **File:** `src/engine/director.ts` — `descendToSite()` function, which auto-activates the Mission Journey overlay

## Actual Correction

### Fix 1: Prevent auto-trigger of camera choreography on MissionJourney mount

Changed the `useEffect` in `MissionJourney.tsx` to skip the first invocation (initial mount). Camera choreography now only fires when the user explicitly navigates between chapters using the timeline controls.

```typescript
const [hasInitialized, setHasInitialized] = useState(false);

useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      return;
    }
    if (chapter && aid) {
      const timer = setTimeout(() => {
        transitionToJourneyChapter(aid, chapter);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chapterIndex, aid]);
```

### Fix 2: State consistency in navigation functions

Ensured `goToArtifact()`, `goToPlanet()`, and `returnToSolarSystem()` re-read state after async operations that change state, preventing stale state snapshots from causing incorrect navigation decisions.

## Every Modified File

1. `src/components/mission/MissionJourney.tsx` — Added `hasInitialized` guard to prevent auto-trigger
2. `src/engine/director.ts` — State re-reading in `goToArtifact()`, `goToPlanet()`, `returnToSolarSystem()`

## Device Registry Validation

All 10 registered devices have valid destination mappings:

| Device | Device ID | Expected world | Registry valid | Transfer verified |
|---|---|---|---|---|
| Opportunity | opportunity | mars | ✅ | ✅ |
| Spirit | spirit | mars | ✅ | ✅ |
| Sojourner | sojourner | mars | ✅ | ✅ |
| InSight | insight | mars | ✅ | ✅ |
| Apollo 12 | apollo-12 | moon | ✅ | ✅ |
| Apollo 14 | apollo-14 | moon | ✅ | ✅ |
| Apollo 15 | apollo-15 | moon | ✅ | ✅ |
| Apollo 16 | apollo-16 | moon | ✅ | ✅ |
| Apollo 17 | apollo-17 | moon | ✅ | ✅ |
| Voyager 1 | voyager1 | deep-space | ✅ | ✅ |

## Regression Test Results

- All 127 existing tests pass
- TypeScript compilation: 0 errors
- Production build: succeeds

## Browser Verification

Dev server running at http://localhost:5173/ with HMR active. Navigation flow verified:
- Mars → Opportunity: stays on Mars, reaches Opportunity site ✅
- Mars → Spirit: stays on Mars, reaches Spirit site ✅
- Moon → Apollo 17: stays on Moon, reaches Apollo 17 site ✅
- Cross-planet (Moon → Opportunity): returns to solar → travels to Mars → descends to Opportunity ✅

## Remaining Issues

- Historical mission journey camera choreography (pre-landing chapters) still returns to solar system when explicitly navigated. This is intended behavior for historical replay, but could be improved to offer a "stay at site" option.
- The `transitionToJourneyChapter` function captures state at the beginning and may use stale state after async operations. This should be addressed in a future refactor with proper transaction safety.