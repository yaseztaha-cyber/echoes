import { useEffect, useState } from "react";
import { World } from "@/engine/World";
import { Hud } from "@/components/chrome/Hud";
import { Boot } from "@/components/chrome/Boot";
import { DevPanel } from "@/components/chrome/DevPanel";
import { useKeys } from "@/hooks/useKeys";
import { useEcho } from "@/state/store";
import { saveLastLocation } from "@/engine/director";
import { artifactById } from "@/data/artifacts";
import { routeKey, useRoute } from "@/landing/lib/router";
import Landing from "@/landing/pages/Landing";
import { MissionPage, WorldPage } from "@/landing/pages/Dossier";

export default function App() {
  useKeys();
  const route = useRoute();
  const key = routeKey(route);
  const [dev, setDev] = useState(() => location.hash === "#/dev" || location.pathname.endsWith("/dev"));

  useEffect(() => {
    const h = () => setDev(location.hash === "#/dev");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  // The landing page is the default surface; #/simulator (or #/dev) mounts the
  // real application. Nothing from the 3D world is created until then.
  const simulator = route.name === "simulator" || dev;

  useEffect(() => {
    document.documentElement.classList.toggle("landing-mode", !simulator);
    // A deliberate WebGL teardown can raise webglcontextlost on the old canvas;
    // never carry that state into a freshly mounted simulator.
    if (simulator) useEcho.setState({ gpuLost: false });
    if (!simulator) {
      const id = window.location.hash.replace("#", "");
      const raf = requestAnimationFrame(() => {
        if (id && !id.startsWith("/")) {
          document.getElementById(id)?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
        } else {
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      });
      return () => {
        cancelAnimationFrame(raf);
        document.documentElement.classList.remove("landing-mode");
      };
    }
    return () => document.documentElement.classList.remove("landing-mode");
  }, [key, simulator]);

  // remember the last location while exploring a mission site
  useEffect(() => {
    const id = setInterval(() => {
      const s = useEcho.getState();
      const a = artifactById(s.artifactId);
      if (s.scene === "site" && a && !s.flying) saveLastLocation(a);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  if (!simulator) {
    if (route.name === "mission") return <MissionPage id={route.id} />;
    if (route.name === "world") return <WorldPage id={route.id} />;
    return <Landing />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink-0">
      <World />
      <Hud />
      {dev && <DevPanel />}
      <Boot />
    </div>
  );
}
