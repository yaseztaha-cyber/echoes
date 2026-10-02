import { useEcho } from "@/state/store";
import { wait } from "@/engine/cameras/controller";
import { clock } from "@/engine/time/clock";
import {
  animateTime,
  closeScience,
  descendToSite,
  exitInspect,
  focusBody,
  focusInstrument,
  inspectHardware,
  openScience,
  overview,
  playFinale,
  returnToSolarSystem,
  selectSite,
  travelToBody,
  visitWaypoint,
  leaveFinale,
} from "@/engine/director";
import { artifactById } from "@/data/artifacts";

const S = () => useEcho.getState();
const set = useEcho.setState;
let token = 0;

class Cancel extends Error {}

/** Scripted competition flow: every step uses the same director calls a user would trigger. */
export async function runDemo() {
  const my = ++token;
  const say = async (caption: string, fn: () => Promise<void> | void = () => {}, hold = 0) => {
    if (my !== token) throw new Cancel();
    set({ demo: { active: true, caption } });
    await fn();
    if (my !== token) throw new Cancel();
    if (hold) await wait(hold);
    if (my !== token) throw new Cancel();
  };
  set({ demo: { active: true, caption: "" }, overlay: null, menuOpen: false });
  try {
    if (S().scene !== "solar") await returnToSolarSystem(true);
    const opp = artifactById("opportunity")!;
    await say("EVERY WORLD HERE WAS REACHED BY A MACHINE.", () => overview(), 2800);
    await say("MARS. 225 MILLION KILOMETRES AWAY AT ITS FARTHEST.", () => focusBody("mars"), 800);
    await say("DISTANCE. APPROACH.", () => travelToBody("mars"), 800);
    set({ camMode: "cinematic" });
    await say("ORBIT. THE PLANET BECOMES A PLACE.", () => {}, 4200);
    set({ camMode: "orbit" });
    await say("MERIDIANI PLANUM. OPPORTUNITY.", () => selectSite("opportunity"), 1800);
    await say("DESCEND. THEN FIND THE ROVER.", () => descendToSite("opportunity"), 600);
    await say("INSPECT THE HARDWARE.", () => inspectHardware(), 1400);
    await say("PANCAM. THE MACHINE'S EYES.", () => focusInstrument("pancam"), 1800);
    await say("INSTRUMENT → MEASUREMENT → OBSERVATION → EVIDENCE → DISCOVERY.", () => openScience("q-water"), 12500);
    set({ compareOpen: true });
    await say("REAL NASA IMAGE. ECHOES 3D VISUALIZATION.", () => {}, 4500);
    set({ compareOpen: false });
    closeScience();
    exitInspect();
    set({ camMode: "orbit" });
    await say("SCRUB THE MISSION. SOL 0 TO SOL 951.", async () => {
      await animateTime(opp.missionPath!.waypoints.find((w) => w.id === "victoria")!.t, 4);
    }, 600);
    await say("JUMP TO ENDEAVOUR CRATER. SOL 2681.", () => visitWaypoint("opportunity", "capeyork"), 2200);
    await say("LAST COMMUNICATION. SOL 5111.", () => visitWaypoint("opportunity", "perseverance"), 1400);
    set({ demo: { active: true, caption: "" } });
    await playFinale();
    await wait(1500);
    set({ demo: { active: false, caption: "" } });
    await leaveFinale();
  } catch (e) {
    if (!(e instanceof Cancel)) console.error(e);
  } finally {
    if (my === token) set({ demo: { active: false, caption: "" } });
    clock.playing = false;
  }
}

export function stopDemo() {
  token++;
  set({ demo: { active: false, caption: "" } });
}
