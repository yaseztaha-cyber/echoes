import { useMemo, useState, type ReactNode } from "react";
import { useEcho } from "@/state/store";
import { ARTIFACTS, ALL_QUESTIONS } from "@/data/artifacts";
import { SOURCES } from "@/data/sources";
import { Status } from "@/components/chrome/ui";
import { goToArtifact, inspectHardware, focusInstrument, openScience } from "@/engine/director";
import { fmtDate } from "@/lib/time";
import { sfx } from "@/lib/audio";

function Shell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-stretch justify-center bg-ink-0/80 p-3 backdrop-blur-sm max-md:p-0" onClick={() => useEcho.setState({ overlay: null })}>
      <div className="module anim-up flex h-full w-full max-w-6xl flex-col" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-[#1d2429] px-5 py-3">
          <div>
            <h2 className="mono text-[15px] tracking-[0.24em] text-bone">{title}</h2>
            <div className="label mt-0.5">{sub}</div>
          </div>
          <button className="ctl" onClick={() => { sfx.close(); useEcho.setState({ overlay: null }); }}>CLOSE · ESC</button>
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function Archive() {
  const [q, setQ] = useState("");
  const [w, setW] = useState("all");
  const visits = useEcho((s) => s.visits);
  const rows = ARTIFACTS.filter((a) => (w === "all" || a.destination === w) && (a.name + a.designation + a.location.region + a.missionName).toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="ARCHIVE" sub={`${ARTIFACTS.length} ARTIFACTS ON RECORD · ${visits.length} PERSONALLY VISITED · SELECT TO ENTER THE 3D EXPERIENCE`}>
      <div className="flex flex-wrap gap-2 border-b border-[#1d2429] px-5 py-3">
        <input className="mono min-w-[200px] flex-1 border border-iron bg-ink-1 px-3 py-2 text-[12px] tracking-[0.1em] text-bone outline-none focus:border-amber" placeholder="FILTER ARCHIVE…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter archive" />
        {["all", "moon", "mars", "deep-space"].map((k) => (
          <button key={k} className="ctl" data-on={w === k} onClick={() => setW(k)}>{k}</button>
        ))}
      </div>
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 bg-ink-2">
          <tr className="label">
            {["ID", "NAME", "WORLD", "TYPE", "STATUS", "LAUNCHED", "SITE"].map((h) => (
              <th key={h} className="px-5 py-2 font-normal max-md:[&:nth-child(n+6)]:hidden">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const visited = visits.includes(a.id);
            return (
            <tr key={a.id} className="mono group cursor-pointer border-t border-[#1d2429] text-[12px] tracking-[0.08em] hover:bg-ink-3 focus-within:bg-ink-3" onClick={() => goToArtifact(a.id)}>
              <td className="px-5 py-2.5 text-amber">
                <button className="text-left" onClick={(e) => { e.stopPropagation(); goToArtifact(a.id); }} aria-label={`Enter ${a.name}${visited ? " (visited)" : ""}`}>{a.designation}{visited && <span className="ml-1.5 text-[9px] text-cyan" title="You have visited this record in 3D">●</span>}</button>
              </td>
              <td className="px-5 py-2.5 text-bone">{a.name}</td>
              <td className="px-5 py-2.5 uppercase text-ash">{a.destination}</td>
              <td className="px-5 py-2.5 uppercase text-ash">{a.type}</td>
              <td className="px-5 py-2.5"><Status s={a.status} /></td>
              <td className="px-5 py-2.5 text-ash max-md:hidden">{fmtDate(a.dates.launch)}</td>
              <td className="px-5 py-2.5 text-slate max-md:hidden">{a.location.region}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="label p-6">NO RECORDS MATCH</div>}
    </Shell>
  );
}

export function GroundTruth() {
  const [kind, setKind] = useState("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const linked = useMemo(() => {
    const m = new Map<string, { claims: Set<string>; arts: Set<string> }>();
    const add = (sid: string, claim: string, art: string) => {
      const e = m.get(sid) ?? { claims: new Set<string>(), arts: new Set<string>() };
      e.claims.add(claim);
      e.arts.add(art);
      m.set(sid, e);
    };
    ARTIFACTS.forEach((a) => {
      a.sources.forEach((s) => add(s.sourceId, s.claim, a.name));
      a.scientificQuestions.forEach((q) => {
        q.sources.forEach((s) => add(s.sourceId, s.claim, a.name));
        q.evidence.forEach((e) => add(e.sourceId, `${e.label}: ${e.detail}`, a.name));
      });
      a.timeline.forEach((e) => add(e.sourceId, `${e.title}: ${e.detail}`, a.name));
    });
    return m;
  }, []);
  const rows = SOURCES.filter((s) => kind === "ALL" || s.kind === kind);
  return (
    <Shell title="GROUND TRUTH" sub="EVERY CLAIM TRACEABLE TO A SOURCE">
      <div className="flex flex-wrap gap-1 border-b border-[#1d2429] px-5 py-3">
        {["ALL", "NASA", "PEER-REVIEWED", "ARCHIVE"].map((k) => (
          <button key={k} className="ctl" data-on={kind === k} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>
      {rows.map((s) => {
        const l = linked.get(s.id);
        const isOpen = open === s.id;
        return (
          <div key={s.id} className="border-b border-[#1d2429] px-5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                <div className="flex items-center gap-2">
                  <span className="mono border border-iron/70 px-1.5 text-[9px] tracking-[0.14em] text-slate">{s.kind}</span>
                  <span className="mono text-[10px] tracking-[0.1em] text-amber">{s.id.toUpperCase()}</span>
                </div>
                <div className="mt-1 text-[14px] text-bone">{s.title}</div>
                <div className="text-[12px] text-slate">{s.publisher}</div>
              </button>
              <a className="ctl" href={s.url} target="_blank" rel="noreferrer" onClick={() => sfx.source()}>OPEN SOURCE ↗</a>
            </div>
            <div className="mt-1 text-[12.5px] text-ash"><span className="label mr-2">SUPPORTS</span>{s.supports}</div>
            {isOpen && l && (
              <div className="mt-2 border-l border-amber/50 pl-3 anim-up">
                <div className="label">LINKED CLAIMS</div>
                {[...l.claims].slice(0, 8).map((c) => (
                  <div key={c} className="mt-1 text-[12.5px] leading-snug text-ash">· {c}</div>
                ))}
                <div className="label mt-2">RELATED ARTIFACTS</div>
                <div className="mono text-[11px] tracking-[0.1em] text-bone">{[...l.arts].join(" · ")}</div>
              </div>
            )}
            {isOpen && !l && <div className="label mt-2">USED FOR IMAGERY / MODEL DOCUMENTATION</div>}
          </div>
        );
      })}
    </Shell>
  );
}

interface Hit { type: string; title: string; sub: string; run: () => void }

export function Search() {
  const [q, setQ] = useState("");
  const hits: Hit[] = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out: Hit[] = [];
    const m = (...t: (string | undefined)[]) => t.join(" ").toLowerCase().includes(s);
    ARTIFACTS.forEach((a) => {
      if (m(a.name, a.designation, a.summary, a.location.region, a.destination, a.missionName)) out.push({ type: "ARTIFACT", title: `${a.designation} · ${a.name}`, sub: `${a.destination.toUpperCase()} · ${a.location.region}`, run: () => goToArtifact(a.id) });
      a.hardware.forEach((h) => {
        if (m(h.name, h.full, h.purpose)) out.push({ type: "INSTRUMENT", title: `${h.name} — ${h.full}`, sub: `${a.name}`, run: async () => { await goToArtifact(a.id); await inspectHardware(); await focusInstrument(h.id); } });
      });
      a.scientificQuestions.forEach((qq) => {
        if (m(qq.question, qq.recordName, qq.interpretation)) out.push({ type: "SCIENCE QUESTION", title: qq.question, sub: `${qq.recordName} · ${a.name}`, run: async () => { await goToArtifact(a.id); await inspectHardware(); await focusInstrument(qq.instrumentIds[0]); await openScience(qq.id); } });
      });
      if (m(a.location.region, a.location.site)) out.push({ type: "LOCATION", title: a.location.region, sub: `${a.location.site} · ${a.name}`, run: () => goToArtifact(a.id) });
    });
    SOURCES.forEach((x) => {
      if (m(x.title, x.supports, x.publisher)) out.push({ type: "SOURCE", title: x.title, sub: x.publisher, run: () => useEcho.setState({ overlay: "sources" }) });
    });
    return out.slice(0, 40);
  }, [q]);
  void ALL_QUESTIONS;
  return (
    <Shell title="SEARCH ARCHIVE" sub="ARTIFACTS · MISSIONS · INSTRUMENTS · SCIENCE QUESTIONS · LOCATIONS">
      <div className="px-5 py-4">
        <input autoFocus className="mono w-full border-0 border-b border-iron bg-transparent pb-2 text-[18px] tracking-[0.1em] text-bone outline-none focus:border-amber" placeholder="_" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search archive" />
        {!q && (
          <div className="mt-4 flex flex-wrap gap-2">
            {["Opportunity", "Pancam", "Apollo 17", "ALSEP", "Mars", "Water", "Seismic"].map((k) => (
              <button key={k} className="ctl" onClick={() => setQ(k)}>{k}</button>
            ))}
          </div>
        )}
      </div>
      {hits.map((h, i) => (
        <button key={i} className="flex w-full items-baseline gap-4 border-t border-[#1d2429] px-5 py-3 text-left hover:bg-ink-3" onClick={() => { sfx.confirm(); useEcho.setState({ overlay: null }); h.run(); }}>
          <span className="mono w-32 flex-none text-[9.5px] tracking-[0.14em] text-amber">{h.type}</span>
          <span className="min-w-0">
            <span className="block text-[14px] text-bone">{h.title}</span>
            <span className="label">{h.sub}</span>
          </span>
        </button>
      ))}
      {q && hits.length === 0 && <div className="label px-5 py-4">NO RECORDS MATCH “{q}”</div>}
    </Shell>
  );
}
