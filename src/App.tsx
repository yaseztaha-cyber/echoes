import { useEffect, useState } from "react";
import { World } from "@/engine/World";
import { Hud } from "@/components/chrome/Hud";
import { Boot } from "@/components/chrome/Boot";
import { DevPanel } from "@/components/chrome/DevPanel";
import { useKeys } from "@/hooks/useKeys";
import { useEcho } from "@/state/store";
import { saveLastLocation } from "@/engine/director";
import { artifactById } from "@/data/artifacts";

export default function App() {
  useKeys();
  const [dev, setDev] = useState(() => location.hash === "#/dev" || location.pathname.endsWith("/dev"));
  useEffect(() => {
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
  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-0">
      <World />
      <Hud />
      {dev && <DevPanel />}
      <Boot />
    </div>
  );
}
