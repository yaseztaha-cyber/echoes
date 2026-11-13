/**
 * MER-B MISSION FILM — the Opportunity documentary, running as code.
 *
 * The film is not a video file: it is the MER-B cinematic journey itself
 * (`src/missions/merb` — 18 chapters, procedural 3D worlds, camera
 * choreography, the archival media manifest and the documentary's own audio
 * policy). This component mounts that module inside ECHOES's mission journey
 * interface, so the documentary plays as a live layer of Opportunity's
 * experience instead of a flat recording.
 *
 * Isolation (the module's own guarantee, kept intact here):
 *  - it creates its own WebGLRenderer and its own THREE.Scene inside the
 *    container; it never touches ECHOES' scene, camera or renderer;
 *  - its CSS is namespaced under `.merb` and injected on mount, removed on
 *    destroy; its DOM, geometries, textures, renderer and GL context are
 *    disposed when it unmounts;
 *  - it never navigates: ECHOES' scene, world, device, journey chapter and
 *    camera are untouched while it plays.
 *
 * The player is the documentary's own interface (real play/pause, chapter
 * ruler, scrub inside a chapter, replay, sound toggle, inspect drawer, free
 * orbit/zoom, fullscreen) — no fake controls.
 */
import { useEffect, useRef } from "react";
import { useEcho } from "@/state/store";
import { setAudioEnabled } from "@/lib/audio";
import { mountOpportunityJourney, type OpportunityJourney } from "@/missions/merb";

/** ECHOES quality tier → the documentary's own render tier. */
const tierFor = (q: string): "low" | "medium" | "high" => {
  if (q === "ultra") return "high";
  if (q === "high") return "medium";
  return "low";
};

export function MerBMissionFilm() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const journey: OpportunityJourney = mountOpportunityJourney(host, {
      mode: "cinematic",
      autoplay: false,
      audio: true,
      quality: tierFor(useEcho.getState().quality),
      adaptiveQuality: true,
      targetFps: 30,
      ui: true,
      // the documentary's policy: narrated NASA features stay muted (their
      // music beds were never verified); only the archival launch tape plays
      allowNarratedFeatureAudio: false,
    });
    // test hook for the navigation/film audit (dev builds only)
    if (import.meta.env.DEV) {
      (window as unknown as { __merb?: OpportunityJourney }).__merb = journey;
    }
    // ECHOES' ambient bed must not play under the documentary: the film is
    // silent except for its launch tape, and its own frames say so.
    setAudioEnabled(false);
    return () => {
      journey.destroy();
      if (import.meta.env.DEV) delete (window as unknown as { __merb?: OpportunityJourney }).__merb;
      setAudioEnabled(useEcho.getState().audioOn);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full overflow-hidden bg-black"
      data-film="merb"
      aria-label="MER-B mission film — the Opportunity documentary"
    />
  );
}
