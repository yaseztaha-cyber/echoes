import { useTele } from "./ui";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { clock } from "@/engine/time/clock";

/** Development diagnostics. Only reachable at #/dev — never linked from normal navigation. */
export function DevPanel() {
  const t = useTele(250);
  const s = useEcho();
  const art = artifactById(s.artifactId);
  const mem = (performance as any).memory?.usedJSHeapSize;
  const rows: [string, string][] = [
    ["FPS", String(t.fps)],
    ["DRAW CALLS", String(t.drawCalls)],
    ["TRIANGLES", t.triangles.toLocaleString()],
    ["TILES DRAWN / CACHED", `${t.tilesDrawn} / ${t.tilesCached}`],
    ["ACTIVE TERRAIN LOD", String(t.maxDepth)],
    ["LOADED MODELS", art ? art.model.title : "—"],
    ["JS HEAP", mem ? `${(mem / 1048576).toFixed(0)} MB` : "n/a"],
    ["CAMERA", t.cam.map((v) => v.toFixed(2)).join(", ")],
    ["SIM TIME", new Date(clock.t).toISOString()],
    ["CLOCK MODE", clock.mode],
    ["SCENE", s.scene],
    ["MISSION", art?.missionId ?? "—"],
    ["ARTIFACT", art?.id ?? "—"],
    ["SOURCE IDS", art?.sources.map((x) => x.sourceId).join(", ") ?? "—"],
    ["QUALITY", s.quality],
  ];
  return (
    <div className="module pointer-events-auto absolute bottom-3 left-3 z-50 w-[360px] p-3">
      <div className="label mb-1 text-amber">/DEV · DIAGNOSTICS</div>
      {rows.map(([k, v]) => (
        <div key={k} className="mono flex justify-between gap-3 text-[10.5px] tracking-[0.06em]">
          <span className="text-slate">{k}</span>
          <span className="max-w-[210px] truncate text-bone">{v}</span>
        </div>
      ))}
      <a href="#/" className="ctl mt-2 block text-center">CLOSE</a>
    </div>
  );
}
