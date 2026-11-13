import { useEffect } from "react";
import { cam } from "@/engine/cameras/controller";
import { useEcho } from "@/state/store";
import { requestPhoto } from "@/state/store";
import { exitInspect, focusBody, inspectHardware, setCamMode, anchor, flyAnchor } from "@/engine/director";
import { skipFlight } from "@/engine/cameras/controller";
import { stopDemo } from "@/features/exploration/demo";
import { unlockAudio } from "@/lib/audio";
import { setAmbience } from "@/lib/ambience";

const MOVE = new Set(["keyw", "keya", "keys", "keyd", "keyq", "keye", "space", "shiftleft", "shiftright", "controlleft", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export function useKeys() {
  useEffect(() => {
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      unlockAudio();
      const code = e.code.toLowerCase();
      const st = useEcho.getState();
      if (!st.entered) return;
      // The mission film owns the keyboard while it is open: it handles
      // play/pause, seek, mute and fullscreen itself, and the camera must
      // not react to the film's transport keys.
      if (st.filmDeviceId) {
        if (code === "escape") {
          e.preventDefault();
          useEcho.setState({ filmDeviceId: null });
        }
        return;
      }
      if (MOVE.has(code)) {
        cam.keys.add(code);
        if (code === "space" || code.startsWith("arrow")) e.preventDefault();
        if (["keyw", "keya", "keys", "keyd"].includes(code) && !["free", "surface"].includes(st.camMode) && !st.flying && st.overlay === null) {
          useEcho.setState({ camMode: "free" });
        }
        return;
      }
      if (code === "escape") {
        // Escape doubles as the flight skip: pressing it mid-flight lands the
        // destination camera immediately instead of waiting out the arrival.
        if (st.flying) return skipFlight();
        if (st.demo.active) return stopDemo();
        if (st.sysOpen) return useEcho.setState({ sysOpen: false });
        if (st.menuOpen) return useEcho.setState({ menuOpen: false });
        if (st.overlay) return useEcho.setState({ overlay: null });
        if (st.decodeId) return useEcho.setState({ decodeId: null });
        if (st.compareOpen) return useEcho.setState({ compareOpen: false });
        if (st.scienceOpen) return useEcho.setState({ scienceOpen: false });
        if (st.camMode === "inspect") return exitInspect();
        if (st.camMode === "cinematic") return useEcho.setState({ camMode: "orbit" });
        if (st.instrumentId) return useEcho.setState({ instrumentId: null });
        return;
      }
      if (code === "keyf") {
        if (st.scene === "solar") focusBody(st.focusBody);
        else flyAnchor();
        return;
      }
      if (code === "keym") return useEcho.setState({ minimap: !st.minimap });
      if (code === "keyt") return useEcho.setState({ timelineOpen: !st.timelineOpen });
      if (code === "keyi") return st.camMode === "inspect" ? exitInspect() : st.scene === "site" || st.artifactId === "voyager1" ? inspectHardware() : undefined;
      if (code === "keyg") return useEcho.setState({ uiMode: st.uiMode === "science" ? "cinematic" : "science" });
      if (code === "keyc") return requestPhoto();
      if (code === "digit1") return setCamMode("orbit");
      void anchor;
    };
    const up = (e: KeyboardEvent) => cam.keys.delete(e.code.toLowerCase());
    const blur = () => cam.keys.clear();
    // The AudioContext exists only after a gesture; the initial ambience call
    // can precede it. First pointer/keypress unlocks, then re-syncs the bed.
    const rearm = () => {
      unlockAudio();
      const k = (window as any).__echoesAmb;
      if (k) setAmbience(k);
    };
    window.addEventListener("pointerdown", rearm, { once: true });
    window.addEventListener("keydown", rearm, { once: true });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("pointerdown", rearm);
      window.removeEventListener("keydown", rearm);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}
