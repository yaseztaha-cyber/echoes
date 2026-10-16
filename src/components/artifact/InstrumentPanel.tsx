import { useEffect, useState } from "react";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { Chip, Panel } from "@/components/chrome/ui";
import { exitInspect, focusInstrument, inspectHardware, openScience } from "@/engine/director";
import { sfx } from "@/lib/audio";

export function InstrumentPanel() {
  const aid = useEcho((s) => s.artifactId);
  const iid = useEcho((s) => s.instrumentId);
  const aud = useEcho((s) => s.audience);
  const art = artifactById(aid);
  const [how, setHow] = useState(false);
  useEffect(() => setHow(false), [iid]);
  if (!art) return null;
  const hw = art.hardware.find((h) => h.id === iid);
  const qs = hw ? art.scientificQuestions.filter((q) => q.instrumentIds.includes(hw.id)) : [];
  return (
    <div className="pointer-events-auto flex w-full flex-col gap-3">
      <Panel title={hw ? hw.name : "HARDWARE INSPECTION"} sub={hw ? hw.full : `${art.designation} · ${art.name}`} right={<button className="ctl px-2" onClick={() => exitInspect()} aria-label="Exit inspection">✕ ESC</button>}>
        {hw ? (
          <div className="anim-up" key={hw.id}>
            <div className="label">PURPOSE</div>
            <p className="mb-2 text-[13px] leading-snug text-bone">{hw.purpose}</p>
            <div className="label">CAPABILITY</div>
            <p className="mb-2 text-[13px] leading-snug text-ash">{hw.capability}</p>
            {(how || aud === "student") && (
              <>
                <div className="label">HOW IT WORKED</div>
                <p className="mb-2 text-[13px] leading-snug text-ash">{hw.how}</p>
              </>
            )}
            {hw.decode && (
              <button className="mono mb-2 flex w-full items-center justify-between border border-iron/70 px-2 py-1.5 text-[11px] tracking-[0.14em] text-bone hover:border-amber" onClick={() => { sfx.open(); useEcho.setState({ decodeId: hw.id }); }}>
                <span>{hw.name}</span>
                <span className="text-amber">[DECODE]</span>
              </button>
            )}
            <div className="flex flex-col gap-1.5">
              {!how && aud !== "student" && <button className="ctl" onClick={() => { sfx.select(); setHow(true); }}>HOW IT WORKED</button>}
              {qs.some((x) => x.trace && x.trace.length > 0) ? (
                <button
                  className="ctl ctl-primary"
                  onClick={() => { sfx.confirm(); const t = qs.find((x) => x.trace && x.trace.length > 0) ?? qs[0]; useEcho.setState({ overlay: "evidence", questionId: t.id }); }}
                >
                  SHOW ME THE DATA →
                </button>
              ) : null}
              {qs.length > 0 ? (
                <button className="ctl" onClick={() => openScience(qs[0].id)}>SEE THE SCIENCE →</button>
              ) : (
                <div className="border border-iron/60 p-2 text-[12px] leading-snug text-ash">
                  <Chip tone="text-cyan">SUPPORT ROLE</Chip>
                  <p className="mt-1">{hw.enables ?? "This hardware enables the instruments that produced the headline science."}</p>
                </div>
              )}
              <button className="ctl" onClick={() => inspectHardware()}>← WHOLE VEHICLE</button>
            </div>
          </div>
        ) : (
          <p className="mb-1 text-[13px] leading-snug text-ash">Select a marker on the vehicle, or choose from the list. The camera will move to the instrument.</p>
        )}
      </Panel>
      <Panel title="INSTRUMENTS" sub={`${art.hardware.length} ON RECORD`}>
        {art.hardware.map((h) => (
          <button key={h.id} className={`mono flex w-full items-center justify-between border-t border-[#1d2429] py-1.5 text-left text-[11px] tracking-[0.1em] ${iid === h.id ? "text-amber" : "text-ash hover:text-bone"}`} onClick={() => focusInstrument(h.id)}>
            <span>{iid === h.id ? "●" : "○"} {h.name}</span>
            <span className="max-w-[150px] truncate text-[9.5px] text-slate">{h.full}</span>
          </button>
        ))}
      </Panel>
    </div>
  );
}

/** DECODE overlay: teach terminology in context. */
export function Decode() {
  const id = useEcho((s) => s.decodeId);
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const hw = art?.hardware.find((h) => h.id === id);
  if (!hw?.decode) return null;
  const d = hw.decode;
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => useEcho.setState({ decodeId: null })}>
      <div className="module anim-up w-full max-w-md p-5" role="dialog" aria-label={`Decode ${hw.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="label text-amber">DECODE · {hw.name}</div>
            <h3 className="mono mt-1 text-[15px] tracking-[0.1em] text-bone">{d.full}</h3>
          </div>
          <button className="ctl px-2" onClick={() => useEcho.setState({ decodeId: null })} aria-label="Close">✕</button>
        </div>
        <div className="rule my-3" />
        {([["WHAT IT IS", d.what], ["WHAT IT MEASURES", d.measures], ["WHY SCIENTISTS USED IT", d.why]] as const).map(([k, v]) => (
          <div key={k} className="mb-3">
            <div className="label">{k}</div>
            <p className="text-[14px] leading-snug text-bone">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simulation ◐━━━● Mission image crossfade. */
export function Compare() {
  const open = useEcho((s) => s.compareOpen);
  const aid = useEcho((s) => s.artifactId);
  const demo = useEcho((s) => s.demo.active);
  const art = artifactById(aid);
  const [v, setV] = useState(0.5);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!open || !demo) return;
    setV(0);
    let raf = 0;
    const t0 = performance.now();
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / 3200);
      setV(u * u * (3 - 2 * u));
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, demo]);
  if (!open || !art) return null;
  const m = art.media[idx];
  // Deduplicate selector labels (raw + annotated versions share a PIA number).
  const seen = new Set<string>();
  const picks = art.media.map((x, i) => ({ x, i, label: x.title.match(/PIA\d+/)?.[0] ?? String(i + 1) })).filter((p) => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  });
  return (
    <>
      {m && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black" style={{ opacity: v * 0.96 }}>
          <img src={m.url} alt={m.title} className="max-h-full max-w-full object-contain" />
        </div>
      )}
      <div className="module pointer-events-auto absolute bottom-[112px] left-1/2 z-20 w-[min(560px,94vw)] -translate-x-1/2 p-3 anim-up">
        <div className="flex items-center justify-between">
          <span className="label text-cyan">ECHOES 3D VISUALIZATION</span>
          <button className="ctl px-2" onClick={() => useEcho.setState({ compareOpen: false })} aria-label="Close comparison">✕</button>
          <span className="label text-ok">NASA IMAGE</span>
        </div>
        <input type="range" min={0} max={1} step={0.005} value={v} onChange={(e) => setV(+e.target.value)} className="my-2 w-full accent-[#d0a45b]" aria-label="Crossfade between simulation and NASA image" />
        {m ? (
          <>
            <div className="mono text-[11px] tracking-[0.1em] text-bone">{m.title}</div>
            <p className="mt-1 text-[12px] leading-snug text-ash">{m.caption}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Chip tone="text-ok">NASA RECORD</Chip>
              <span className="label">CREDIT · {m.credit}</span>
              {m.recordUrl && <a className="label hover:text-amber" href={m.recordUrl} target="_blank" rel="noreferrer">PHOTOJOURNAL ↗</a>}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {picks.map((p) => (
                <button key={p.x.id} className="ctl px-2" data-on={p.i === idx} onClick={() => setIdx(p.i)}>{p.label}</button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-slate">No NASA image has been linked to this record yet.</p>
        )}
      </div>
    </>
  );
}
