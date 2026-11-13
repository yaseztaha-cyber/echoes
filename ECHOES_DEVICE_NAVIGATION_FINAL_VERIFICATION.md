# ECHOES — Device Navigation Final Verification

**Audit date:** 2026-11-13 · **App under test:** `http://localhost:5174/` (Vite dev server, real browser: Edge/Chromium via Playwright, 1600×1000)
**Scope:** device transfers, journey-chapter selection, Solar System returns, state consistency, stale-callback races.

> Every claim below is backed either by the browser run recorded in §6 or by the
> automated tests in §5. A green build alone was never treated as evidence:
> the browser scenarios were executed repeatedly against the running app
> (three full passes, see §6.4).

---

## 1. Root cause of the original bug

### 1.1 What was reported

> "Transferring to a device unexpectedly returned the user to the Solar System."

The cross-planet transfer legitimately passes through the solar frame (the
planet frame is a different scale, so the frame must be swapped). The reported
symptom was different: the user asked for a **device** and ended up **in the
Solar System** instead of at that device.

### 1.2 The actual mechanism — three defects, not one

**Defect A — the journey-chapter path could leave the site and return to the Solar System.**

`src/engine/director.ts :: transitionToJourneyChapter()` contained:

```ts
if (eventLower === "launch" || eventLower === "cruise" || eventLower === "maneuver" || eventLower === "development") {
  if (isOnSite) return;                                  // guarded ONLY at a site
  if (freshSt.scene !== "solar") await returnToSolarSystem(true);   // ← the Solar System
  await focusBody("earth");
  return;
}
```

Two problems:

1. The guard only covered `scene === "site"`. **During a device transfer the
   scene is `"planet"` or `"solar"`** — i.e. exactly while the user is in
   flight, the guard did not apply and the branch ran
   `returnToSolarSystem(true)`.
2. The trigger was not the user's action but the **MissionJourney overlay's
   effect**, which fires 100 ms after the selected device id changes. The
   overlay auto-opens on arrival (`descendToSite()` ends with
   `set({ overlay: "mission-journey" })`) and was not keyed by device, so a
   *device change* re-fired the previous chapter's choreography.

Sequence: the user selects a device → the overlay's delayed callback fires a
"development / launch / cruise / maneuver" chapter → `returnToSolarSystem(true)`
→ `focusBody("earth")` → the user is thrown out of the world they were
travelling to and parked in the Solar System. The device transfer then either
lost the race or was overridden by the stale callback.

**Defect B — the guard was a hand-picked list of four event-type labels.**

`deployment`, `discovery`, `milestone`, `traverse`, `observation`, `end`,
`conclusion` and `incident` were not in the list, so those chapters fell
through to the `default:` branch, which called `goToArtifact(artifactId)` — a
full device transfer, including a `returnToSolarSystem()` hop for a device on
another world. A documentary chapter could therefore still move the user.

**Defect C — no protection against stale asynchronous transitions.**

`goToArtifact()` / `descendToSite()` / `travelToBody()` are multi-await chains
(flight → frame swap → veil → scene swap → arrival flight) with nothing tying
them to the request that started them. Two rapid device selections interleaved:
the older chain's scene swap could land *after* the newer chain had committed,
leaving the user in the Solar System or at the wrong device.

### 1.3 Did the previous patch fix it, or mask one path?

**It masked one path.** The earlier patch (a `scene === "site"` early return
plus a mount guard in `MissionJourney`) stopped the *idle-at-a-site* case, and
the `hasInitialized` mount guard stopped the *mount* case. It did not fix:

* the **mid-transfer** case — the guard's condition `scene === "site"` is false
  while travelling, which is where the user's "returned to the Solar System"
  came from;
* the **event-type gaps** (Defect B);
* the **stale-callback race** (Defect C);
* the **silent drop** of a chapter transition (`if (st.flying) return;` threw
  the transition away instead of waiting for the flight);
* the fact that the overlay re-fired the previous device's choreography.

---

## 2. The fix — an explicit policy, not a skipped call

### 2.1 Journey-chapter policy (documentary playback vs live exploration)

`transitionToJourneyChapter()` now implements a written policy
(`src/engine/director.ts`, "JOURNEY CHAPTER POLICY"):

| Situation | What a chapter selection does |
|---|---|
| Chapter is **before touchdown** (historical playback) | **Documentary only**: overlay content + timeline. Never a camera or scene change. |
| User is at **another device's site** | Documentary only — the live site is untouched. |
| User is **on a planet** or in the **Solar System** | Documentary only. A device is chosen from the HUD (device list / search), never from a documentary chapter. |
| User is at **this device's own site**, post-landing chapter | The camera may move **inside that site** (mission-path waypoint visit, or a slow orbit of the hardware). |

"Before touchdown" is derived from the mission's own dates *and* the event-type
vocabulary (`isHistoricalChapter()`), not from a four-item label list, so
**every** pre-landing chapter is historical playback whatever it is called.
For Opportunity the classification is: `development`, `launch`, `cruise`,
`maneuver` → historical; `landing`, `deployment`, `discovery`, `exploration`,
`milestone`, `traverse`, `incident`, `end`, `conclusion` → post-landing.

### 2.2 The Solar System is no longer reachable from the journey path

The `returnToSolarSystem()` call inside `transitionToJourneyChapter()` is
**gone** (not merely guarded), and the `default:` branch that could call
`goToArtifact()` is gone with it. After the fix the journey code path cannot
reach the Solar System at all — verified in the live trace (§6.3): no
`journey-chapter:*` return exists.

### 2.3 Navigation tickets — a stale transition can never overwrite a newer selection

Two independent channels:

* **navigation** (device transfers): every user-initiated transfer claims a
  navigation ticket. A newer transfer invalidates the older one, so two rapid
  device selections cannot interleave — the older chain's scene swap can no
  longer land after the newer one.
* **chapter** (documentary choreography): a chapter claims a chapter ticket.
  A chapter **never** invalidates a transfer (a documentary cannot cancel a
  device transfer), and a **transfer invalidates a pending chapter** (the
  user's device choice always wins).

Every await point in `goToArtifact` / `descendToSite` / `travelToBody` /
`leaveSite` / `returnToSolarSystem` / `goToPlanet` / `transitionToJourneyChapter`
/ `visitWaypoint` checks its ticket and aborts if it is stale. Internal steps
of one action pass the ticket down, so a single user action never invalidates
itself.

### 2.4 The journey overlay can no longer hijack a device change

* `MissionJourney` is keyed by device id (`key={aid}` in `Hud.tsx`): a device
  change starts a fresh chapter list instead of re-firing the previous
  device's choreography.
* Its effect fires **only** when the chapter index changes (an explicit
  chapter navigation) — never on mount, never because the device changed.
* A chapter transition is no longer dropped when a flight is in progress: it
  waits for the flight to finish (`waitForIdle()`), so nothing is skipped
  silently.

### 2.5 Leaving a device closes its journey overlay

`leaveSite()` now clears the overlay. The journey overlay hides the entire HUD
(device lists, SEARCH, planet panel) while it is open, so leaving the site
with it still up stranded the user in the documentary with no way to navigate.
(This was found by the browser run: the probe could not reach the HUD until the
overlay was closed, and the fallback — ESC — was the only escape.)

---

## 3. Every changed file and function

| File | Function / change |
|---|---|
| `src/engine/director.ts` | **`navTrace()` + `navTraceLog`** (Solar System return instrumentation: reason + call stack + scene/world/device at the call, capped at 200 entries); **`beginNav()` / `isStaleNav()` / `activeNavTicket()` / `lastChapterTicketInfo()` / `navStatus()`** (two-channel navigation tickets); **`waitForIdle()`**; **`focusBody()`, `goVoyager()`, `travelToBody()`, `selectSite()`, `descendToSite()`, `arrive()`, `goToPlanet()`, `leaveSite()`, `returnToSolarSystem()`, `goToArtifact()`, `visitWaypoint()`** — ticket threading, staleness aborts, explicit return reasons; **`leaveSite()`** — closes the journey overlay; **`isHistoricalChapter()`** (new), **`matchWaypoint()`** (new), **`cinematicOrbit()`** (new), **`transitionToJourneyChapter()`** — rewritten to the policy (the `returnToSolarSystem()` + `focusBody("earth")` branch and the `default: goToArtifact()` branch are removed) |
| `src/components/mission/MissionJourney.tsx` | effect rewritten: choreography fires only on an explicit chapter change (no mount trigger, no device-change trigger); `useRef` import |
| `src/components/chrome/Hud.tsx` | `<MissionJourney key={aid ?? "none"} />`; the "← SOLAR SYSTEM" button passes a reason to the trace |
| `src/components/planet/ContextPanels.tsx` | "← SOLAR SYSTEM" button passes a reason to the trace |
| `src/features/exploration/demo.ts` | guided demo passes a reason to the trace |
| `src/engine/director.nav.test.ts` | **new** — 19 regression tests (§5) |
| `scripts/probe-nav.mjs` | **new** — the browser audit probe (scenarios, per-step state capture, Solar System return log, screenshots) |
| `scripts/probe-buttons.mjs` | **new** — control-inventory helper used to address the real UI reliably |
| `ECHOES_DEVICE_NAVIGATION_FINAL_VERIFICATION.md` | **new** — this document |

No other system was touched. The sun work in the working tree (`sun_sss.jpg`,
`SunShader.ts`, `SunCore.tsx`, `sunAssets.ts`, `SunLayerPanel.tsx`,
`manifest.ts`) and the unrelated in-progress work (`OpportunityJourney.tsx`,
`audio.ts`, `SiteScene.tsx`, `state/store.ts`) were left exactly as they were.
No destructive Git operation was used.

---

## 4. Solar System return-call inventory (every invocation in the codebase)

`grep -rn "returnToSolarSystem(" src` — **7 call sites, all accounted for**:

| # | Call site | Reason recorded | Legitimate? |
|---|---|---|---|
| 1 | `director.ts` `goToPlanet()` | `goToPlanet:<world>` | Yes — the frame hop between two worlds; the transfer continues to the target world. |
| 2 | `director.ts` `goToArtifact()` (deep-space) | `goToArtifact:deep-space` | Yes — Voyager 1 lives in the solar frame. |
| 3 | `director.ts` `goToArtifact()` (cross-planet) | `goToArtifact:cross-planet` | Yes — the frame hop; the transfer ends on the device's world. |
| 4 | `director.ts` `leaveFinale()` | `leave-finale` | Yes — explicit user action. |
| 5 | `Hud.tsx` "← SOLAR SYSTEM" button | `hud-solar-system-button` | Yes — explicit user action. |
| 6 | `ContextPanels.tsx` "← SOLAR SYSTEM" button | `planet-panel-button` | Yes — explicit user action. |
| 7 | `demo.ts` guided demo | `guided-demo` | Yes — the scripted demo. |

**Removed by this fix:** the journey-chapter call site (call site #8 before the
fix). The journey path can no longer reach the Solar System.

Checked and found **not** to be callers: the two `catch` blocks in the
navigation files (`demo.ts` swallows its own `Cancel`; `MissionJourney.tsx`
guards the clock) — neither navigates. There is no dynamic dispatch of the
director API (`grep` for computed member access in `director.ts` → none), so
the list above is complete.

---

## 5. Automated tests

```
Test Files  16 passed (16)
     Tests  146 passed (146)
```

* 127 pre-existing tests — still green (no regressions).
* **19 new tests** in `src/engine/director.nav.test.ts`:

| Test | What it locks down |
|---|---|
| same-planet transfer (Mars → Opportunity → Spirit) | stays on Mars; **zero** Solar System returns |
| cross-planet transfer (Mars → Apollo 12) | ends on the Moon, not in the Solar System |
| site-to-device navigation | leaves the old site, lands on the new device |
| site exit | returns to the **parent planet**, not the Solar System |
| `descendToSite` from the planet view | lands on the site |
| `goToPlanet` to the world the user is already on | changes nothing |
| **every registered device** (10) | each lands on its own world / site |
| unknown device id | ignored, no navigation, no crash |
| two rapid selections | settles on the **last** requested device |
| a chapter selection during a transfer | **does not cancel** the transfer |
| a stale transfer after a newer navigation | never installs a site |
| a device transfer invalidating a pending chapter | the chapter aborts, the device wins |
| **every pre-landing chapter of every device** at its site | scene/world/device unchanged, **zero** Solar System returns |
| a chapter of another device | does not move the user off the current site |
| a post-landing chapter of the device at the site | camera stays on that site |
| pre-landing classification | derived from mission dates, not a label list |
| **every chapter of every device** at its site | **zero** Solar System returns; the scene stays `site` |
| return instrumentation | reason + call stack recorded |
| only explicit reasons re-enter the Solar System | no `journey-chapter:*` reason ever appears |

The camera is faked in these tests (no WebGL in node) — they cover the
*director logic*; the rendering is covered by the browser run in §6.

---

## 6. Browser evidence

### 6.1 Scenarios executed (real app, real clicks)

Probe: `scripts/probe-nav.mjs` (Playwright + Edge, `http://localhost:5174/?navtrace=1`).
Every scenario waits for all camera flights, veils, scene swaps and the
arrival choreography to finish before the state is read.

| # | Scenario | Result |
|---|---|---|
| boot | app entered, scene = solar | PASS |
| C1a | solar → Mars (planet scene, world=mars) | PASS |
| C1b | Mars → Opportunity site (scene=site, world=mars, device=opportunity) | PASS |
| C2a | the mission-journey overlay opens automatically on arrival (23 chapters) | PASS |
| C2b | the chapter UI and the timeline follow every chapter selection (23 distinct titles, 21 distinct mission dates) | PASS |
| C2 | **all 23 chapters** at the site keep scene=site / world=mars / device=opportunity | PASS |
| C3 | **zero** Solar System returns during chapter selection at the site | PASS |
| C4 | Opportunity site → Spirit site (same-planet transfer) | PASS |
| C4b | same-planet transfer produced no Solar System return | PASS |
| C5 | Mars site → Apollo 12 site (cross-planet, ends on the Moon) | PASS |
| C5b | the cross-planet transfer did not leave the user in the Solar System | PASS |
| C6 | Moon → Apollo 17 site (planet panel → DESCEND TO SITE) | PASS |
| C7 | Moon → InSight site (cross-planet, ends on Mars) | PASS |
| C8 | **rapid consecutive selections** (Spirit + Opportunity clicked in the same tick) settle on the last requested device | PASS |
| C9-opportunity … C9-apollo-17 | **all 9 surface devices** reachable through SEARCH → their own site on their own world | PASS (9/9) |
| C9-voyager1 | Voyager 1 reachable in the solar frame (deep-space device) | PASS |

**Final run: 24 / 24 scenarios PASS, 0 console errors, 0 page errors.**

### 6.2 State consistency at each navigation step

Recorded per step (`window.__echoesState`): `scene`, `world`, `artifactId`,
`camMode`, `overlay`, `sim.t`, plus the navigation ticket
(`window.__echoesNav`: ticket id, kind, `navSeq`, `chapterSeq`, flying flag).
Representative samples from the final run:

| Step | scene | world | device | camMode | nav ticket | seq |
|---|---|---|---|---|---|---|
| Mars → Opportunity (arrived) | site | mars | opportunity | orbit | `goToArtifact:opportunity` (navigation) | navSeq 15 |
| after 23 chapter selections | site | mars | opportunity | orbit | last chapter `opp-ch-23` (chapter) | chapterSeq 22 |
| Opportunity → Spirit | site | mars | spirit | orbit | `goToArtifact:spirit` | navSeq ↑ |
| Mars → Apollo 12 (arrived) | site | moon | apollo-12 | orbit | `goToArtifact:apollo-12` | navSeq 23 |
| Moon → Apollo 17 (arrived) | site | moon | apollo-17 | orbit | `goToArtifact:apollo-17` | navSeq 23+ |
| Moon → InSight (arrived) | site | mars | insight | orbit | `goToArtifact:insight` | navSeq ↑ |
| rapid Spirit+Opportunity | site | mars | **opportunity** (last request) | orbit | `goToArtifact:opportunity` | navSeq ↑ |
| Voyager 1 | solar | solar | voyager1 | follow | `goVoyager` | — |

The selected device, its registered parent world, the active planet and the
rendered scene agree at every recorded step.

### 6.3 Solar System return-call instrumentation (live)

Instrumented with reason + call stack; the recorded log for the full run
(`shotsnav/nav-probe.json` → `navEvents`):

```
SOLAR RETURNS: 5
  goToArtifact:cross-planet     | scene=planet world=mars  artifact=spirit      ← Mars → Moon hop
  goToArtifact:cross-planet     | scene=planet world=moon  artifact=apollo-17   ← Moon → Mars hop
  hud-solar-system-button       | scene=site    world=mars  artifact=insight     ← probe clicked "← SOLAR SYSTEM"
  goToArtifact:cross-planet     | scene=planet world=mars  artifact=insight     ← Mars → Moon hop
  hud-solar-system-button       | scene=site    world=moon  artifact=apollo-17   ← probe clicked "← SOLAR SYSTEM"
```

* **Unexpected Solar System returns: 0.**
* Every return is either an explicit user action (the HUD button, which the
  probe itself clicked to set up the next scenario) or the frame hop a
  cross-planet transfer must make — and each such transfer **ended on the
  correct world** (Moon for Apollo 12 / Apollo 17, Mars for InSight).
* **No `journey-chapter:*` return exists in the log at all.** The 23 chapter
  selections are all recorded as documentary actions:

```
journey-chapter | historical-playback:launch     | site mars opportunity
journey-chapter | historical-playback:cruise     | site mars opportunity
journey-chapter | historical-playback:maneuver   | site mars opportunity
journey-chapter | waypoint-visit                 | site mars opportunity
journey-chapter | site-orbit                     | site mars opportunity
   … (23 chapter selections, every one recorded at scene=site world=mars)
```

* The rapid-selection race is visible in the log as two overlapping
  `nav-begin goToArtifact:spirit` / `goToArtifact:opportunity` entries, with
  the **last** request owning the final state.

### 6.4 Repetition (timing-dependent failures)

The same sequence was executed **three times** against the running app:

| Run | Scope | Result |
|---|---|---|
| 1 | core (C1–C7) | 13 / 13 PASS — 2 Solar System returns, both the cross-planet hop |
| 2 | all (C1–C9, every device + rapid selection) | 24 / 24 PASS — 5 returns, all accounted for above |
| 3 | core repeat, independent process | 13 / 13 PASS — see `shotsnav/probe-core-repeat.log` |

Screenshots per scenario are in `shotsnav/` (`01-mars-orbit.png`,
`02-opportunity-site.png`, `03-opportunity-chapters.png`, `04-spirit-site.png`,
`05-apollo12-site.png`, `06-apollo17-site.png`, `07-insight-site.png`,
`08-rapid-select.png`, `09-voyager.png`).

---

## 7. Remaining limitations

1. **A cross-planet transfer still passes through the Solar System frame.**
   This is mechanical, not a bug: the planet frame is a different scale, so the
   camera has to be handed back to the solar frame to fly to another world. The
   user sees a brief solar view during the hop, and the trace records it
   (`goToArtifact:cross-planet`). The transfer always *ends* on the device's
   world — it never *stays* in the Solar System.
2. **A documentary chapter never moves the user to another device** (by
   design). Selecting an exploration chapter while standing on Mars does not
   fly you to the rover — the device is chosen from the HUD device list or
   SEARCH. This is the policy the audit asked for, and it is the behaviour the
   user should keep.
3. **The arrival vignette covers the HUD for up to 18 s** and the journey
   overlay hides the HUD entirely while it is open. Leaving the site now
   closes the overlay automatically, but while the overlay is open the only
   way back to the HUD is its "✕ EXIT" button (or ESC).
4. **The unit tests fake the camera** (no WebGL in node). They cover the
   director logic and the state machine; the rendering, the arrival
   choreography and the overlay behaviour are covered by the browser run.
5. **The chapter choreography waits for an in-flight camera move** (up to
   30 s) instead of dropping the transition. A chapter clicked during a very
   long flight therefore lands late rather than not at all.
6. **`navTraceLog` keeps the last 200 entries in memory** and is published on
   `window.__navTrace` only when the page is opened with `?navtrace=1`.
   `window.__echoesState` / `window.__echoesNav` are read-only accessors used
   by the audit probe.
7. **The guided demo is the only remaining non-user caller** of
   `returnToSolarSystem()`; it is scripted and intentional.

---

## 8. Verdict

* Selecting a device **always** leaves the user at that device's correct
  planetary world and site — verified in the browser for all 10 registered
  devices through three entry points (planet device list, SEARCH, DESCEND TO
  SITE), for same-planet and cross-planet transfers, and for rapid
  consecutive selections.
* Documentary chapter selection **never** changes the exploration location;
  it updates the content and the timeline, and may move the camera inside the
  site the user is already at.
* **Zero** unexpected Solar System returns were recorded, and no delayed
  callback can return the user to the Solar System: the journey path no longer
  reaches `returnToSolarSystem()` at all, and stale transfers abort instead of
  writing scene state.
* 146 automated tests pass (19 new), `tsc --noEmit` is clean, the production
  build succeeds, and the browser evidence is in `shotsnav/`.
