import { useState } from "react";
import { useEcho } from "@/state/store";
import { LAB_SCENARIO as L } from "@/data/lab";
import { sfx } from "@/lib/audio";

const clamp = (v: number) => Math.max(0, Math.min(100, v));

function Gauge({ k, v, tone = "bg-amber", suffix = "%" }: { k: string; v: number; tone?: string; suffix?: string }) {
  return (
    <div>
      <div className="flex justify-between"><span className="label">{k}</span><span className="mono text-[12px] text-bone">{Math.round(v)}{suffix}</span></div>
      <div className="mt-1 h-[3px] bg-iron"><div className={`h-full ${tone} transition-all duration-700`} style={{ width: `${clamp(v)}%` }} /></div>
    </div>
  );
}

/** Educational scenario — explicitly NOT a record of what NASA decided. */
export function MissionLab() {
  const [pick, setPick] = useState<string | null>(null);
  const a = L.actions.find((x) => x.id === pick);
  const power = a ? clamp(L.start.power - a.powerCost) : L.start.power;
  const risk = a ? clamp(L.start.risk + a.risk) : L.start.risk;
  const science = a?.scienceGain ?? 0;
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-ink-0/80 p-3 backdrop-blur-sm" onClick={() => useEcho.setState({ overlay: null })}>
      <div className="module anim-up max-h-full w-full max-w-3xl overflow-auto scroll-thin" role="dialog" aria-label="Mission Lab" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-[#1d2429] px-5 py-3">
          <div>
            <h2 className="mono text-[15px] tracking-[0.24em] text-bone">MISSION LAB</h2>
            <div className="mono mt-1 inline-block border border-warn/60 px-1.5 py-[1px] text-[9.5px] tracking-[0.16em] text-warn">EDUCATIONAL SIMULATION</div>
          </div>
          <button className="ctl" onClick={() => { sfx.close(); useEcho.setState({ overlay: null }); }}>CLOSE · ESC</button>
        </header>
        <div className="p-5">
          <h3 className="mono text-[13px] tracking-[0.18em] text-amber">{L.title}</h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ash">{L.intro}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Gauge k="POWER" v={power} tone={power < 30 ? "bg-crit" : "bg-ok"} />
            <div>
              <div className="label">TRAVEL</div>
              <div className="mono mt-1 text-[16px] text-bone">{(a?.distanceKm ?? L.start.travelKm).toFixed(1)} KM</div>
              <div className="label mt-1">{a ? (a.distanceKm ? "TO TARGET" : "NO DRIVE") : "TO TARGET"}</div>
            </div>
            <div>
              <div className="label">SCIENCE TARGET</div>
              <div className="mono mt-1 text-[16px] text-bone">{L.start.target}</div>
              <div className="label mt-1">GAIN TODAY {science}</div>
            </div>
            <Gauge k="RISK" v={risk} tone={risk > 50 ? "bg-crit" : risk > 30 ? "bg-warn" : "bg-ok"} />
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {L.actions.map((x) => (
              <button key={x.id} className="ctl h-auto p-3 text-left normal-case tracking-normal" data-on={pick === x.id} onClick={() => { sfx.select(); setPick(x.id); }}>
                <div className="mono text-[11px] uppercase tracking-[0.14em]">{x.label}</div>
                <div className="mt-1 text-[12px] leading-snug opacity-90">{x.blurb}</div>
              </button>
            ))}
          </div>
          {a && (
            <div className="mt-5 border-t border-[#1d2429] pt-4 anim-up">
              <div className="label text-amber">TRADE-OFFS</div>
              <ul className="mt-2 space-y-1 text-[13px] leading-snug text-ash">
                <li>Energy: {a.powerCost > 0 ? `uses ${a.powerCost}% of the battery` : `recovers ${-a.powerCost}%`} → {Math.round(power)}% remains.{power < 30 && " Low margin: little energy left for heating or the next day."}</li>
                <li>Science: {a.scienceGain ? `adds ${a.scienceGain} points of science value today` : "no new measurements today"}.</li>
                <li>Risk: {a.risk > 0 ? `rises by ${a.risk} points` : a.risk < 0 ? `falls by ${-a.risk} points` : "unchanged"}{a.distanceKm ? " because soft sand can trap wheels." : "."}</li>
              </ul>
              <div className="mt-3 space-y-1 text-[12.5px] leading-snug text-slate">
                {L.tradeoffs.map((t) => <p key={t}>· {t}</p>)}
              </div>
              <p className="mono mt-3 text-[10px] tracking-[0.12em] text-warn">EDUCATIONAL SIMULATION · NOT A RECORD OF WHAT NASA DECIDED</p>
              <button className="ctl mt-3" onClick={() => setPick(null)}>RESET SCENARIO</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
