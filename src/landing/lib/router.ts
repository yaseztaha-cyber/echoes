import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "mission"; id: string }
  | { name: "world"; id: string }
  | { name: "simulator" };

/** Hash routes: #/mission/:id, #/world/:id, #/simulator. Any other hash (e.g. #missions) is a landing-page anchor. */
export function parseHash(hash: string): Route {
  const m = hash.match(/^#\/(mission|world)\/([\w-]+)$/);
  if (m) return { name: m[1] as "mission" | "world", id: m[2] };
  if (hash === "#/simulator") return { name: "simulator" };
  return { name: "home" };
}

export const routeKey = (r: Route) => (r.name === "mission" || r.name === "world" ? `${r.name}:${r.id}` : r.name);

export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parseHash(hash);
}

export const missionHref = (id: string) => `#/mission/${id}`;
export const worldHref = (id: string) => `#/world/${id}`;
