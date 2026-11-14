import { useEffect, useState, lazy, Suspense } from "react";
import { World } from "@/engine/World";
import { Landing } from "@/components/landing/Landing";
import { Hud } from "@/components/chrome/Hud";
import { Boot } from "@/components/chrome/Boot";
import { useKeys } from "@/hooks/useKeys";
import { useEcho } from "@/state/store";
import { saveLastLocation } from "@/engine/director";
import { artifactById } from "@/data/artifacts";

/** Diagnostics are a development-only chunk: a production build never ships it. */
const DevPanel = import.meta.env.DEV
  ? lazy(() => import("@/components/chrome/DevPanel").then((m) => ({ default: m.DevPanel })))
  : null;

/**
 * Session storage can be unavailable (an opaque origin, a sandboxed frame, a
 * privacy mode). Reading it must never take the whole application down.
 */
const readEntered = (): boolean => {
  try {
    return sessionStorage.getItem("echoes.entered") === "1";
  } catch {
    return false;
  }
};
const writeEntered = () => {
  try {
    sessionStorage.setItem("echoes.entered", "1");
  } catch {
    /* storage unavailable — the session simply starts at the landing page again */
  }
};

export default function App() {
  useKeys();
  // The diagnostics panel is a development-only surface: it is not routable in
  // a production build, so the public release exposes no developer controls.
  const [dev, setDev] = useState(() => import.meta.env.DEV && (location.hash === "#/dev" || location.pathname.endsWith("/dev")));
  const [entered, setEntered] = useState(() => readEntered());
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const h = () => setDev(location.hash === "#/dev");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  // remember the last location while exploring a mission site
  useEffect(() => {
    const id = setInterval(() => {
      const s = useEcho.getState();
      const a = artifactById(s.artifactId);
      if (s.scene === "site" && a && !s.flying) saveLastLocation(a);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  // The landing page is presented OVER the live solar system: the hero is the
  // real 3D environment, not a picture of one.
  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-0">
      <World />
      {!entered && <Landing onEnter={() => { writeEntered(); setEntered(true); }} />}
      {entered && (
        <>
          <Hud />
          <Boot />
        </>
      )}
      {dev && DevPanel ? (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      ) : null}
    </div>
  );
}
