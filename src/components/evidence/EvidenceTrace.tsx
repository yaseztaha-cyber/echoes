import { useEffect, useMemo, useRef, useState } from "react";
import { useEcho, unlockRecord } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { mediaById } from "@/data/media";
import { sourceById } from "@/data/sources";
import { Chip, Field } from "@/components/chrome/ui";
import { openScience } from "@/engine/director";
import { sfx } from "@/lib/audio";

/**
 * EVIDENCE TRACE — instrument → image → data → evidence → interpretation.
 * Full-screen archive view that keeps the 3D world mounted behind it.
 */
export function Evidence() {
  const aid = useEcho((s) => s.artifactId);
  const qid = useEcho((s) => s.questionId);
  const art = artifactById(aid);
  const withTrace = art?.scientificQuestions.filter((q) => q.trace && q.trace.length > 0) ?? [];
  const q = withTrace.find((x) => x.id === qid) ?? withTrace[0] ?? null;

  const mediaIds = useMemo(() => {
    if (!q) return [];
    const ids = [...q.observations.map((o) => o.mediaId), ...((q.trace ?? []).map((t) => t.mediaId))];
    return [...new Set(ids.filter(Boolean))] as string[];
  }, [q]);
  const [mid, setMid] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const viewRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMid(mediaIds[0] ?? null);
    setStep(0);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (q) unlockRecord(q.id, q.recordName);
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // non-passive wheel zoom (React's onWheel cannot preventDefault reliably)
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(6, Math.max(1, s * (e.deltaY < 0 ? 1.12 : 0.89))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (!art || !q) return null;
  const m = mid ? mediaById(mid) : undefined;
  const trace = q.trace ?? [];
  const zoom = (f: number) => {
    sfx.select();
    setScale((s) => Math.min(6, Math.max(1, s * f)));
    if (scale === 1 && f < 1) setPos({ x: 0, y: 0 });
  };
  const pick = (id: string, i?: number) => {
    sfx.select();
    setMid(id);
    if (i !== undefined) setStep(i);
    setScale(1);
    setPos({ x: 0, y: 0 });
  };
  const close = () => {
    sfx.close();
    useEcho.setState({ overlay: null });
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex bg-ink-0/97 max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-label={`Evidence trace ${q.recordName}`}>
      {/* ---- image workspace ---- */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#1d2429] px-4 py-2">
          <span className="label text-amber">EVIDENCE TRACE · {q.recordName}</span>
          <span className="label">{art.designation} · {art.name}</span>
          {m?.sol !== undefined && <span className="label text-cyan">SOL {m.sol}</span>}
          <span className="ml-auto flex items-center gap-1">
            <button className="ctl px-2" onClick={() => zoom(0.8)} aria-label="Zoom out">−</button>
            <span className="mono w-14 text-center text-[11px] text-ash">{Math.round(scale * 100)}%</span>
            <button className="ctl px-2" onClick={() => zoom(1.25)} aria-label="Zoom in">+</button>
            <button className="ctl px-2" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }} aria-label="Reset view">1:1</button>
            <button className="ctl px-2" onClick={() => viewRef.current?.requestFullscreen?.()} aria-label="Fullscreen">⛶</button>
            <button className="ctl px-2" onClick={close} aria-label="Return to 3D">✕ RETURN TO 3D</button>
          </span>
        </div>
        <div
          ref={viewRef}
          className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-black"
          style={{ cursor: scale > 1 ? "grab" : "default", touchAction: "none" }}
          onPointerDown={(e) => {
            if (scale <= 1) return;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          }}
          onPointerMove={(e) => {
            if (drag.current) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onDoubleClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}
        >
          {m ? (
            <img
              src={m.url}
              alt={m.title}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain"
              style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transformOrigin: "center" }}
            />
          ) : (
            <p className="text-[13px] text-slate">No image linked to this record yet.</p>
          )}
          {m?.imageType && (
            <span className="mono absolute left-3 top-3 border border-iron/80 bg-ink-0/80 px-2 py-1 text-[10px] tracking-[0.14em] text-bone">{m.imageType}</span>
          )}
        </div>
        <div className="border-t border-[#1d2429] px-4 py-2">
          {m ? (
            <>
              <div className="mono text-[12px] tracking-[0.08em] text-bone">{m.title}</div>
              <p className="mt-0.5 text-[12px] leading-snug text-ash">{m.caption}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Chip tone="text-ok">NASA RECORD</Chip>
                <span className="label">CREDIT · {m.credit}</span>
                {m.recordUrl && <a className="label hover:text-amber" href={m.recordUrl} target="_blank" rel="noreferrer">PHOTOJOURNAL ↗</a>}
              </div>
              {mediaIds.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Linked images">
                  {mediaIds.map((id) => {
                    const mm = mediaById(id);
                    return (
                      <button key={id} role="tab" aria-selected={id === mid} className="ctl px-2 text-[9.5px]" data-on={id === mid} onClick={() => mm && pick(id)}>
                        {(mm?.imageType ?? mm?.title ?? id).slice(0, 22)}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* ---- trace side panel ---- */}
      <aside className="scroll-thin flex w-[360px] flex-none flex-col gap-3 overflow-y-auto border-l border-[#1d2429] bg-ink-1/60 p-3 max-md:w-auto max-md:border-l-0 max-md:border-t">
        <div>
          <div className="label">TARGET RECORD</div>
          <div className="mt-0.5 text-[15px] leading-snug text-bone">{q.question}</div>
        </div>
        <div className="module p-2.5">
          <Field k="INSTRUMENTS" v={q.instrumentIds.join(" · ").toUpperCase()} />
          {m?.sol !== undefined && <Field k="SOL" v={`${m.sol}`} />}
          {m?.instrumentId && <Field k="IMAGED BY" v={m.instrumentId.toUpperCase()} />}
          <Field k="PROVENANCE" v="REAL NASA IMAGE · OFFICIAL RECORD" tone="text-ok" />
        </div>
        <div>
          <div className="label mb-1.5">HOW THIS BECAME SCIENCE</div>
          <ol>
            {trace.map((t, i) => (
              <li key={i}>
                <button
                  className={`flex w-full gap-2.5 border-l-2 py-2 pl-2.5 pr-1 text-left transition-colors ${i === step ? "border-amber bg-amber/5" : "border-iron/60 hover:border-slate"}`}
                  onClick={() => {
                    sfx.select();
                    setStep(i);
                    if (t.mediaId) pick(t.mediaId);
                  }}
                  aria-current={i === step}
                >
                  <span className={`mono mt-0.5 text-[10px] ${i === step ? "text-amber" : "text-slate"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="mono block text-[10px] tracking-[0.14em] text-slate">{t.kind.toUpperCase()}</span>
                    <span className="block text-[12.5px] leading-snug text-bone">{t.title}</span>
                    {(i === step || t.kind === "observation" || t.kind === "evidence" || t.kind === "interpretation") && (
                      <span className="mt-0.5 block text-[12px] leading-snug text-ash">{t.detail}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="module p-2.5">
          <div className="label text-cyan">OBSERVATION ≠ INTERPRETATION</div>
          <p className="mt-1 text-[12px] leading-snug text-ash">{q.evidence[0]?.detail}</p>
          <p className="mt-1.5 text-[12px] leading-snug text-bone">{q.interpretation}</p>
        </div>
        <div>
          <div className="label mb-1">SOURCES</div>
          {q.sources.map((s) => {
            const rec = sourceById(s.sourceId);
            return rec ? (
              <a key={s.sourceId} href={rec.url} target="_blank" rel="noreferrer" className="mono mb-1 block border border-iron/60 px-2 py-1.5 text-[10.5px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone">
                <span className="text-amber">[{rec.kind}]</span> {rec.title} ↗
              </a>
            ) : null;
          })}
        </div>
        <div className="flex flex-col gap-1.5 pb-1">
          <button className="ctl ctl-primary" onClick={() => { close(); openScience(q.id); }}>UNDERSTAND THIS RESULT →</button>
          <button className="ctl" onClick={close}>← RETURN TO 3D WORLD</button>
        </div>
      </aside>
    </div>
  );
}
