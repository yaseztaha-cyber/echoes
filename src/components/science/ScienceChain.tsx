import { useEffect, useRef, useState } from "react";
import { useEcho, unlockRecord, type Level } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { mediaById } from "@/data/media";
import { sourceById } from "@/data/sources";
import { Chip } from "@/components/chrome/ui";
import { closeScience } from "@/engine/director";
import { tele } from "@/engine/telemetry";
import { sfx } from "@/lib/audio";

const NODES = ["INSTRUMENT", "MEASUREMENT", "OBSERVATION", "EVIDENCE", "DISCOVERY"] as const;

export function ScienceChain() {
  const aid = useEcho((s) => s.artifactId);
  const iid = useEcho((s) => s.instrumentId);
  const qid = useEcho((s) => s.questionId);
  const level = useEcho((s) => s.level);
  const reduced = useEcho((s) => s.reducedMotion);
  const art = artifactById(aid);
  const hw = art?.hardware.find((h) => h.id === iid);
  const qs = art && hw ? art.scientificQuestions.filter((q) => q.instrumentIds.includes(hw.id)) : [];
  const q = qs.find((x) => x.id === qid) ?? qs[0];
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    if (!q) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setStep(i);
      sfx.data();
      if (i >= NODES.length - 1) {
        clearInterval(id);
        unlockRecord(q.id, q.recordName);
      }
    }, reduced ? 250 : 1250);
    return () => clearInterval(id);
  }, [q?.id, reduced]);

  if (!art || !hw || !q) return null;
  const lv = level;
  const setLv = (l: Level) => { sfx.select(); useEcho.setState({ level: l }); };

  return (
    <div className="module pointer-events-auto flex max-h-full w-full flex-col anim-up" aria-label="Science signal path">
      <header className="border-b border-[#1d2429] px-4 pb-2.5 pt-3">
        <div className="flex items-start justify-between">
          <div>
            <div id="signal-anchor" className="label text-amber">SIGNAL PATH · {hw.name}</div>
            <div className="mt-1 text-[15px] leading-snug text-bone">{q.question}</div>
          </div>
          <button className="ctl px-2" onClick={() => closeScience()} aria-label="Close science view">✕</button>
        </div>
        {qs.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {qs.map((x) => (
              <button key={x.id} className="ctl px-2 text-[9.5px]" data-on={x.id === q.id} onClick={() => useEcho.setState({ questionId: x.id })}>{x.recordName}</button>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-px" role="tablist" aria-label="Explanation level">
          {(["explore", "understand", "technical"] as Level[]).map((l) => (
            <button key={l} role="tab" aria-selected={lv === l} className="ctl flex-1 px-1" data-on={lv === l} onClick={() => setLv(l)}>{l}</button>
          ))}
        </div>
      </header>
      <div className="scroll-thin overflow-y-auto px-4 py-3">
        {NODES.map((n, i) => {
          const on = step >= i;
          return (
            <div key={n} className="relative flex gap-3 pb-4" style={{ marginLeft: i % 2 ? 10 : 0, opacity: on ? 1 : 0.18, transform: on ? "none" : "translateY(6px)", transition: "opacity .6s, transform .6s" }}>
              <div className="relative flex w-4 flex-none flex-col items-center">
                <div className={`mt-1 h-2.5 w-2.5 rotate-45 border ${on ? "border-amber bg-amber" : "border-iron"}`} />
                {i < NODES.length - 1 && (
                  <div className="relative mt-1 w-px flex-1 origin-top bg-iron" style={{ transform: step > i ? "scaleY(1)" : "scaleY(0.15)", transition: "transform .9s", background: step > i ? "#d0a45b" : undefined }}>
                    {step === i + 1 && !reduced && <span className="absolute -left-[2px] h-[5px] w-[5px] rounded-full bg-bone" style={{ ["--run" as any]: "70px", animation: "pulse1 1.1s ease-out 1" }} />}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="label">{String(i + 1).padStart(2, "0")} · {n}</div>
                {n === "INSTRUMENT" && (
                  <div>
                    <div className="mono text-[13px] tracking-[0.12em] text-bone">{hw.name}</div>
                    <div className="text-[12px] text-ash">{hw.full}</div>
                  </div>
                )}
                {n === "MEASUREMENT" && (
                  <p className="text-[13px] leading-snug text-bone">{lv === "technical" ? q.measurement.technical : q.measurement.simple}{lv === "understand" ? ` ${hw.how}` : ""}</p>
                )}
                {n === "OBSERVATION" && (
                  <div className="space-y-2">
                    {q.observations.map((o) => {
                      const m = o.mediaId ? mediaById(o.mediaId) : undefined;
                      return (
                        <div key={o.id} className="border-l border-iron pl-2">
                          <div className="mono text-[11px] tracking-[0.1em] text-bone">{o.label}</div>
                          {lv !== "explore" && <p className="text-[12.5px] leading-snug text-ash">{o.detail}</p>}
                          {m && on && step >= 2 && (
                            <figure className="mt-1.5 anim-up">
                              <img src={m.url} alt={m.title} className="max-h-36 w-full border border-iron object-cover" />
                              <figcaption className="mt-1 flex flex-wrap items-center gap-2">
                                <Chip tone="text-ok">NASA IMAGE</Chip>
                                <span className="label text-[9px]">{m.credit}</span>
                                <a className="label text-[9px] hover:text-amber" href={m.recordUrl} target="_blank" rel="noreferrer">{m.title.match(/PIA\d+/)?.[0]} ↗</a>
                              </figcaption>
                            </figure>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {n === "EVIDENCE" && (
                  <div className="space-y-2">
                    {q.evidence.map((e) => {
                      const s = sourceById(e.sourceId);
                      return (
                        <div key={e.id} className="border-l border-iron pl-2">
                          <div className="mono text-[11px] tracking-[0.1em] text-bone">{e.label}</div>
                          {lv !== "explore" && <p className="text-[12.5px] leading-snug text-ash">{e.detail}</p>}
                          {s && (
                            <a className="mono mt-0.5 block text-[10px] tracking-[0.06em] text-cyan hover:text-amber" href={s.url} target="_blank" rel="noreferrer" onClick={() => sfx.source()}>
                              ↗ {lv === "technical" ? s.publisher : s.title.slice(0, 58)}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {n === "DISCOVERY" && (
                  <div>
                    <p className="text-[13.5px] leading-snug text-bone">{lv === "explore" ? q.layers.explore : lv === "understand" ? q.layers.understand : q.layers.technical}</p>
                    {lv !== "explore" && <p className="mt-1.5 text-[12.5px] italic leading-snug text-ash">{q.interpretation}</p>}
                    {step >= 4 && (
                      <div className="mt-2 flex items-center gap-2 anim-up">
                        <Chip tone="text-amber">SCIENCE RECORD</Chip>
                        <span className="mono text-[11px] tracking-[0.12em] text-amber">{q.recordName}</span>
                      </div>
                    )}
                    {lv === "technical" && (
                      <div className="mt-2">
                        {q.sources.map((r) => {
                          const s = sourceById(r.sourceId);
                          return s ? (
                            <div key={r.sourceId} className="label mt-0.5 normal-case tracking-normal text-slate">[{s.kind}] {s.publisher} — {r.claim}</div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button className="ctl w-full" onClick={() => useEcho.setState({ overlay: "sources" })}>OPEN GROUND TRUTH · SOURCES</button>
      </div>
    </div>
  );
}

/** A thin line from the selected instrument in the 3D world to the signal-path panel. */
export function SignalLink() {
  const open = useEcho((s) => s.scienceOpen && s.camMode === "inspect");
  const path = useRef<SVGPathElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const loop = () => {
      const a = document.getElementById("signal-anchor")?.getBoundingClientRect();
      const h = tele.hotspot;
      if (a && h.v && path.current && ring.current && window.innerWidth > 768) {
        const x1 = h.x, y1 = h.y, x2 = a.left - 10, y2 = a.top + 7;
        const mx = (x1 + x2) / 2;
        path.current.setAttribute("d", `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
        path.current.style.opacity = "1";
        ring.current.setAttribute("cx", String(x1));
        ring.current.setAttribute("cy", String(y1));
        ring.current.style.opacity = "1";
      } else if (path.current && ring.current) {
        path.current.style.opacity = "0";
        ring.current.style.opacity = "0";
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [open]);
  if (!open) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <path ref={path} fill="none" stroke="#d0a45b" strokeWidth="1" strokeDasharray="4 4" style={{ ["--len" as any]: 600, animation: "drawLine 1.2s ease-out both", opacity: 0 }} />
      <circle ref={ring} r="13" fill="none" stroke="#d0a45b" strokeWidth="1" style={{ opacity: 0 }} />
    </svg>
  );
}
