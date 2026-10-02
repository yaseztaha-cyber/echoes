import { useEffect, useRef } from "react";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { sourceById } from "@/data/sources";
import { clock, setT, togglePlay, faster, slower, setDir, SPEEDS } from "@/engine/time/clock";
import { solOf, fmtDate, fmtUTC, fmtRate, fmtYear } from "@/lib/time";
import { openRemains, replayControl, startReplay, stopReplay, toggleReplayPause, visitWaypoint } from "@/engine/director";
import { sfx } from "@/lib/audio";

export function TimeControls() {
  const sim = useEcho((s) => s.sim);
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const modeLabel = sim.mode === "solar-system" ? "SOLAR SYSTEM DATE" : sim.mode === "mission" ? "MISSION TIME" : "HISTORICAL DATE";
  const main = sim.mode === "mission" && art?.dates.landing ? `SOL ${Math.max(0, solOf(sim.t, art.dates.landing))}` : fmtDate(sim.t);
  const per = sim.rate * sim.speed;
  return (
    <div className="module flex items-center gap-1 p-1.5" role="group" aria-label="Simulation clock">
      <div className="mr-1 min-w-[112px] px-1.5">
        <div className="label text-[9px]">{modeLabel}</div>
        <div className="mono text-[13px] tracking-[0.1em] text-bone">{main}</div>
        <div className="label text-[9px]">1 S = {fmtRate(per)}</div>
      </div>
      <button className="ctl" aria-label="Slower" onClick={() => { sfx.select(); slower(); }}>◀◀</button>
      <button className="ctl" aria-label="Play in reverse" data-on={sim.playing && sim.dir < 0} onClick={() => { sfx.select(); setDir(-1); }}>◀</button>
      <button className="ctl w-[64px]" aria-label="Toggle play and pause" onClick={() => { sfx.select(); togglePlay(); }}>
        {SPEEDS.includes(sim.speed) ? sim.speed.toLocaleString() : sim.speed}×{sim.playing ? "" : " ❚❚"}
      </button>
      <button className="ctl" aria-label="Play forward" data-on={sim.playing && sim.dir > 0} onClick={() => { sfx.select(); setDir(1); }}>▶</button>
      <button className="ctl" aria-label="Faster" onClick={() => { sfx.select(); faster(); }}>▶▶</button>
    </div>
  );
}

export function Timeline() {
  const aid = useEcho((s) => s.artifactId);
  const t = useEcho((s) => s.sim.t);
  const open = useEcho((s) => s.timelineOpen);
  const scene = useEcho((s) => s.scene);
  const replay = useEcho((s) => s.replay);
  const art = artifactById(aid);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const range = art?.clock.range;

  // surface the most recent event while scrubbing
  useEffect(() => {
    if (!art || !range || replay.active) return;
    const span = range[1] - range[0];
    const ev = [...art.timeline].reverse().find((e) => e.t <= t && t - e.t < span * 0.03);
    const cur = useEcho.getState().activeEventId;
    if ((ev?.id ?? null) !== cur) useEcho.setState({ activeEventId: ev?.id ?? null });
  }, [t, art, range, replay.active]);

  if (!art || !range) return null;
  const [t0, t1] = range;
  const pct = (x: number) => ((x - t0) / (t1 - t0)) * 100;
  const years: number[] = [];
  const y0 = fmtYear(t0), y1 = fmtYear(t1);
  const spanYears = y1 - y0;
  if (spanYears >= 1) {
    const stepY = spanYears > 20 ? 5 : spanYears > 8 ? 2 : 1;
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1; y += stepY) years.push(y);
  }
  const ticks = years.length
    ? years.map((y) => ({ label: String(y), x: pct(Date.UTC(y, 0, 1)) }))
    : [0, 0.25, 0.5, 0.75, 1].map((f) => ({ label: fmtUTC(t0 + (t1 - t0) * f).slice(5, 16), x: f * 100 }));

  const seek = (e: React.PointerEvent | PointerEvent) => {
    const r = rail.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    clock.playing = false;
    setT(t0 + (t1 - t0) * f);
  };
  const landing = art.dates.landing;
  const label = art.clock.kind === "sol" && landing ? (t < landing ? "IN TRANSIT" : `SOL ${solOf(t, landing)}`) : fmtUTC(t);

  return (
    <div className={`module px-3 pb-2 pt-2 transition-all ${open ? "" : "hidden"}`} aria-label="Mission timeline">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="mono text-[11px] tracking-[0.14em] text-bone">
          {label} <span className="text-slate">· {fmtDate(t)}</span>
        </div>
        <div className="flex gap-1">
          {replay.active ? (
            <button className="ctl ctl-primary" onClick={() => stopReplay()}>■ STOP REPLAY</button>
          ) : (
            <button className="ctl ctl-primary" onClick={() => startReplay()}>▶ REPLAY MISSION</button>
          )}
          {art.destination !== "deep-space" && <button className="ctl" onClick={() => openRemains()}>WHAT REMAINS?</button>}
        </div>
      </div>
      <div
        ref={rail}
        className="relative h-9 cursor-ew-resize touch-none"
        role="slider"
        tabIndex={0}
        aria-label="Mission timeline scrubber"
        aria-valuemin={t0}
        aria-valuemax={t1}
        aria-valuenow={t}
        onPointerDown={(e) => { drag.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); seek(e); }}
        onPointerMove={(e) => drag.current && seek(e)}
        onPointerUp={() => (drag.current = false)}
        onKeyDown={(e) => {
          const step = (t1 - t0) / 200;
          if (e.key === "ArrowRight") setT(t + step);
          if (e.key === "ArrowLeft") setT(t - step);
        }}
      >
        <div className="absolute left-0 right-0 top-[15px] h-px bg-iron" />
        <div className="absolute left-0 top-[14px] h-[3px] bg-amber/60" style={{ width: `${pct(t)}%` }} />
        {ticks.map((k) => (
          <div key={k.label + k.x} className="absolute top-[10px]" style={{ left: `${k.x}%` }}>
            <div className="h-[11px] w-px bg-slate" />
            <div className="mono -translate-x-1/2 pt-[1px] text-[9px] tracking-[0.1em] text-slate">{k.label}</div>
          </div>
        ))}
        {art.timeline.map((e) => (
          <button
            key={e.id}
            title={`${e.title}`}
            aria-label={`Jump to ${e.title}`}
            className="absolute top-[9px] -translate-x-1/2 p-1"
            style={{ left: `${pct(e.t)}%` }}
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={() => { sfx.select(); clock.playing = false; setT(e.t); useEcho.setState({ activeEventId: e.id }); }}
          >
            <div className={`h-[9px] w-[9px] rotate-45 border ${e.t <= t ? "border-amber bg-amber" : "border-slate bg-ink-0"} ${e.kind === "end" ? "!border-crit" : ""}`} />
          </button>
        ))}
        <div className="pointer-events-none absolute top-[3px] -translate-x-1/2" style={{ left: `${pct(t)}%` }}>
          <div className="h-[26px] w-px bg-bone" />
          <div className="mx-auto -mt-1 h-2 w-2 rounded-full bg-bone" />
        </div>
      </div>
      {scene !== "site" && art.id !== "voyager1" && null}
    </div>
  );
}

export function ReplayCard() {
  const id = useEcho((s) => s.activeEventId);
  const aid = useEcho((s) => s.artifactId);
  const replay = useEcho((s) => s.replay);
  const scene = useEcho((s) => s.scene);
  const aud = useEcho((s) => s.audience);
  const art = artifactById(aid);
  const ev = art?.timeline.find((e) => e.id === id);
  if (!art || !ev) return null;
  const src = sourceById(ev.sourceId);
  const sol = art.dates.landing && art.clock.kind === "sol" ? solOf(ev.t, art.dates.landing) : null;
  const wp = ev.waypointId ? art.missionPath?.waypoints.find((w) => w.id === ev.waypointId) : undefined;
  return (
    <div className="module pointer-events-auto w-[330px] max-w-[92vw] border-l-2 border-l-amber p-3 anim-up" key={ev.id}>
      <div className="flex items-center justify-between">
        <span className="label text-amber">{replay.active ? `MISSION REPLAY · ${replay.index + 1}/${art.timeline.length}` : "MISSION EVENT"}</span>
        <button className="label hover:text-bone" aria-label="Close event" onClick={() => { useEcho.setState({ activeEventId: null }); stopReplay(); }}>✕</button>
      </div>
      <div className="mono mt-1 text-[11px] tracking-[0.14em] text-ash">{sol !== null && sol >= 0 ? `SOL ${sol} · ` : ""}{fmtDate(ev.t)}</div>
      <div className="mono mt-1 text-[14px] tracking-[0.1em] text-bone">{ev.title}</div>
      <p className="mt-1.5 text-[13px] leading-snug text-ash">{ev.detail}</p>
      {wp && <div className="label mt-1.5 text-slate">APPROXIMATE LOCATION · {wp.name}</div>}
      {(aud === "student" || src) && src && (
        <a className="label mt-1.5 block hover:text-amber" href={src.url} target="_blank" rel="noreferrer" onClick={() => sfx.source()}>
          SOURCE · {src.title.slice(0, 54)}{src.title.length > 54 ? "…" : ""} ↗
        </a>
      )}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {ev.waypointId && scene === "site" && art.missionPath && (
          <button className="ctl ctl-primary" onClick={() => visitWaypoint(art.id, ev.waypointId!)}>VISIT LOCATION</button>
        )}
        {replay.active && (
          <>
            <button className="ctl" onClick={replayControl.prev} aria-label="Previous event">◀</button>
            <button className="ctl" onClick={toggleReplayPause}>{replay.paused ? "RESUME" : "PAUSE"}</button>
            <button className="ctl" onClick={replayControl.next} aria-label="Next event">▶</button>
          </>
        )}
      </div>
    </div>
  );
}
