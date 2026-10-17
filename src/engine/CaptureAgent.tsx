import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useEcho, addPhoto, toast } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { bodyById } from "./frames/frames";
import { fmtUTC } from "@/lib/time";
import { sfx } from "@/lib/audio";

/** Honest caption for a frame: what the simulation itself knows about the view. */
function frameCaption(): string {
  const s = useEcho.getState();
  const art = artifactById(s.artifactId);
  const seg =
    s.scene === "site" && art
      ? `${art.designation} · ${art.destination.toUpperCase()} SURFACE`
      : s.scene === "planet"
        ? `${s.world.toUpperCase()} ORBIT`
        : s.artifactId === "voyager1"
          ? "VOYAGER 1 · INTERSTELLAR"
          : `${(bodyById(s.focusBody)?.name ?? s.focusBody).toUpperCase()} SYSTEM VIEW`;
  const date = fmtUTC(s.sim.t).slice(0, 16);
  const sun = s.scene === "planet" && s.sunPhase !== 0 ? ` · SIM SUN ${Math.round((s.sunPhase * 180) / Math.PI)}°` : "";
  return `${seg} · ${date}${sun}`;
}

/**
 * Frame photography. Lives inside the Canvas so it can reach the renderer.
 * Captures on demand (store.photoReq++): render one fresh frame, then read the
 * canvas — no preserveDrawingBuffer cost, readback happens in the same task as
 * the forced compose.
 */
export function CaptureAgent() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const last = useRef(useEcho.getState().photoReq);
  useEffect(() => {
    return useEcho.subscribe((s) => {
      if (s.photoReq === last.current) return;
      last.current = s.photoReq;
      try {
        gl.render(scene, camera);
        const url = gl.domElement.toDataURL("image/jpeg", 0.92);
        addPhoto(url, frameCaption());
        sfx.shutter();
      } catch {
        toast("CAPTURE FAILED", "RENDERER DENIED READBACK — TRY AGAIN AFTER NAVIGATING");
      }
    });
  });
  return null;
}
