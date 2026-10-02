import { useEffect, useState, type ReactNode } from "react";
import type { Artifact, ArtifactStatus } from "@/types";
import { tele } from "@/engine/telemetry";

export const STATUS_STYLE: Record<ArtifactStatus | "IN TRANSIT", { c: string; g: string }> = {
  ACTIVE: { c: "text-ok", g: "●" },
  EXTENDED: { c: "text-ok", g: "◐" },
  "PARTIALLY OPERATIONAL": { c: "text-warn", g: "◑" },
  "NO LONGER COMMUNICATING": { c: "text-warn", g: "○" },
  "MISSION COMPLETE": { c: "text-ash", g: "■" },
  "INACTIVE HARDWARE": { c: "text-slate", g: "□" },
  "IN TRANSIT": { c: "text-cyan", g: "→" },
};

export function Status({ s }: { s: ArtifactStatus | "IN TRANSIT" }) {
  const st = STATUS_STYLE[s];
  return (
    <span className={`mono text-[10.5px] tracking-[0.12em] ${st.c}`}>
      {st.g} {s}
    </span>
  );
}

/** Mission state at a given simulation time — factual labels only. */
export function stateAt(a: Artifact, t: number): ArtifactStatus | "IN TRANSIT" {
  const landing = a.dates.landing;
  if (landing && t < landing) return "IN TRANSIT";
  if (a.id === "opportunity") {
    const last = a.timeline.find((e) => e.id === "last")!.t;
    const done = a.timeline.find((e) => e.id === "complete")!.t;
    if (t >= done) return "MISSION COMPLETE";
    if (t >= last) return "NO LONGER COMMUNICATING";
    return t > a.dates.landing! + 90 * 88775244 ? "EXTENDED" : "ACTIVE";
  }
  if (a.id === "voyager1") return a.status;
  const end = a.timeline[a.timeline.length - 1].t;
  if (a.destination === "moon") return t >= end ? "INACTIVE HARDWARE" : "ACTIVE";
  return t >= end ? a.status : "ACTIVE";
}

export function Field({ k, v, mono = true, tone }: { k: string; v: ReactNode; mono?: boolean; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="label">{k}</span>
      <span className={`${mono ? "mono" : ""} text-[12px] ${tone ?? "text-bone"} text-right`}>{v}</span>
    </div>
  );
}

export function Chip({ children, tone = "text-slate" }: { children: ReactNode; tone?: string }) {
  return <span className={`mono border border-iron/70 px-1.5 py-[1px] text-[9px] tracking-[0.14em] ${tone}`}>{children}</span>;
}

export function Panel({ title, sub, children, className = "", right }: { title?: string; sub?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`module anim-up ${className}`}>
      {title && (
        <header className="flex items-start justify-between gap-3 border-b border-[#1d2429] px-4 pb-2.5 pt-3">
          <div>
            <h2 className="mono text-[13px] tracking-[0.14em] text-bone">{title}</h2>
            {sub && <div className="label mt-0.5">{sub}</div>}
          </div>
          {right}
        </header>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

/** Low-rate snapshot of engine telemetry. */
export function useTele(ms = 160) {
  const [s, set] = useState({ ...tele, hotspot: { ...tele.hotspot } });
  useEffect(() => {
    const id = setInterval(() => set({ ...tele, hotspot: { ...tele.hotspot } }), ms);
    return () => clearInterval(id);
  }, [ms]);
  return s;
}

export const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");
