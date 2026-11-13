import { useCallback, useState } from "react";
import { useEcho } from "@/state/store";
import { OPPORTUNITY_JOURNEY, OPPORTUNITY_CASE_FILES, type MissionChapter, type CaseFile } from "@/data/opportunity-journey";
import { artifactById } from "@/data/artifacts";
import { sourceById } from "@/data/sources";
import { Panel } from "@/components/chrome/ui";
import { fmtDate } from "@/lib/time";
import { sfx } from "@/lib/audio";

const setOverlay = (o: string | null) => useEcho.setState({ overlay: o as any });

function MediaChip({ label }: { label: string }) {
  return (
    <span className="mono border border-iron/60 px-2 py-1 text-[10px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone cursor-pointer">
      {label}
    </span>
  );
}

function HologramStep({ step }: { step: MissionChapter["hologramSequence"][number] }) {
  const kindColor: Record<string, string> = {
    title: "text-bone",
    video: "text-cyan",
    animation: "text-amber",
    image: "text-ok",
    action: "text-cyan",
    diagram: "text-ash",
    map: "text-cyan",
    chart: "text-amber",
    text: "text-slate",
  };
  return (
    <div className="border-l-2 border-l-[#1d2429] pl-3 py-1.5">
      <span className={`mono block text-[9px] tracking-[0.14em] ${kindColor[step.kind]}`}>{step.kind.toUpperCase()}</span>
      <div className="mono block text-[11px] leading-snug text-bone">{step.title}</div>
      <span className="mono block mt-0.5 text-[10px] leading-snug text-ash">{step.detail}</span>
    </div>
  );
}

function CaseFileViewer({ caseFile, onClose }: { caseFile: CaseFile; onClose: () => void }) {
  const srcs = caseFile.sourceIds.map((sid) => sourceById(sid)).filter(Boolean);
  const handleClose = () => { sfx.close(); onClose(); };
  return (
    <Panel title={`CASE FILE · ${caseFile.recordName}`} sub={caseFile.title} className="pointer-events-auto flex max-h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-[#1d2429] px-4 pb-2.5 pt-3">
        <div>
          <h2 className="mono text-[13px] tracking-[0.14em] text-bone">CASE FILE · {caseFile.recordName}</h2>
          <div className="label mt-0.5">{caseFile.title}</div>
        </div>
        <button className="ctl px-2" aria-label="Close case file" onClick={handleClose}>✕</button>
      </div>
      <div className="scroll-thin max-h-[60vh] overflow-y-auto anim-up px-4 py-3">
        <div className="mb-3">
          <div className="label mb-1">DIRECT OBSERVATION</div>
          <p className="text-[12.5px] leading-snug text-bone">{caseFile.directObservation}</p>
        </div>
        <div className="mb-3">
          <div className="label mb-1">MEASUREMENT</div>
          <p className="text-[12.5px] leading-snug text-bone">{caseFile.measurement}</p>
        </div>
        <div className="mb-3">
          <div className="label mb-1">EVIDENCE</div>
          <p className="text-[12.5px] leading-snug text-bone">{caseFile.evidence}</p>
        </div>
        <div className="mb-3">
          <div className="label mb-1">SCIENTIFIC INTERPRETATION</div>
          <p className="text-[12.5px] leading-snug text-bone">{caseFile.interpretation}</p>
        </div>
        <div className="mb-3">
          <div className="label mb-1">UNCERTAINTY</div>
          <p className="text-[12.5px] leading-snug text-ash">{caseFile.uncertainty}</p>
        </div>
        <div className="mb-3">
          <div className="label mb-1">SIGNIFICANCE</div>
          <p className="text-[12.5px] leading-snug text-amber">{caseFile.significance}</p>
        </div>
        {caseFile.media.length > 0 && (
          <div className="mb-3">
            <div className="label mb-1">MEDIA</div>
            <div className="flex flex-wrap gap-1">{caseFile.media.map((m) => <MediaChip key={m} label={m} />)}</div>
          </div>
        )}
        <div className="mb-3">
          <div className="label mb-1">SOURCES</div>
          {srcs.map((s) => (
            <a key={s!.id} href={s!.url} target="_blank" rel="noreferrer" className="mono mb-1 block border border-iron/60 px-2 py-1.5 text-[10px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone">
              <span className="text-amber">[{s!.kind}]</span> {s!.title} ↗
            </a>
          ))}
        </div>
        <button className="ctl ctl-primary mt-3 w-full" onClick={() => { sfx.confirm(); onClose(); }}>
          CLOSE CASE FILE
        </button>
      </div>
    </Panel>
  );
}

export function OpportunityJourney() {
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"CHAPTER" | "VIDEO" | "IMAGE" | "DISCOVERY" | "SOURCES">("CHAPTER");
  const [openCaseFile, setOpenCaseFile] = useState<CaseFile | null>(null);

  const chapter = OPPORTUNITY_JOURNEY[chapterIndex];
  const total = OPPORTUNITY_JOURNEY.length;
  const progressPct = ((chapterIndex) / Math.max(total - 1, 1)) * 100;

  const closeJourney = useCallback(() => {
    setPlaying(false);
    setOverlay(null);
  }, []);

  const nextChapter = useCallback(() => {
    sfx.select();
    setChapterIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const prevChapter = useCallback(() => {
    sfx.select();
    setChapterIndex((i) => Math.max(i - 1, 0));
  }, []);

  const togglePlay = useCallback(() => {
    sfx.select();
    setPlaying((p) => !p);
  }, []);

  const openCase = useCallback((cf: CaseFile) => {
    sfx.select();
    setOpenCaseFile(cf);
  }, []);

  if (!art || !chapter) return null;
  const caseFile = chapter.caseFileId ? OPPORTUNITY_CASE_FILES.find((cf) => cf.id === chapter.caseFileId) : null;

  if (openCaseFile && caseFile) {
    return <CaseFileViewer caseFile={caseFile} onClose={() => setOpenCaseFile(null)} />;
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col bg-ink-0/98 max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-label="Opportunity cinematic mission journey">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1d2429] px-5 py-3">
        <div>
          <h2 className="mono text-[15px] tracking-[0.24em] text-bone">OPPORTUNITY JOURNEY</h2>
          <div className="label mt-0.5">{art.designation} · {art.name} · MER-B · Mars</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="ctl" onClick={closeJourney} aria-label="Exit journey">✕ EXIT JOURNEY</button>
          <button className="ctl ctl-primary" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚ PAUSE" : "▶ PLAY"}
          </button>
          <button className="ctl" onClick={prevChapter} disabled={chapterIndex === 0} aria-label="Previous chapter">◀ PREV</button>
          <button className="ctl" onClick={nextChapter} disabled={chapterIndex === total - 1} aria-label="Next chapter">NEXT ▶</button>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex border-b border-[#1d2429] px-5 py-2">
        {["CHAPTER", "VIDEO", "IMAGE", "DISCOVERY", "SOURCES"].map((mode) => (
          <button
            key={mode}
            className={`ctl flex-1 text-[10px] tracking-[0.1em] ${viewMode === mode ? "bg-amber/20 text-amber" : "text-ash"}`}
            onClick={() => { sfx.select(); setViewMode(mode as any); }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Chapter progress bar */}
      <div className="px-5 py-2">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="mono text-[10px] text-slate">CHAPTER {chapterIndex + 1} / {total}</span>
          <span className="ml-auto mono text-[10px] text-amber">{chapter.date}</span>
        </div>
        <div className="relative h-1.5 bg-iron rounded overflow-hidden">
          <div className="h-full bg-amber" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Chapter content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-r border-[#1d2429] p-5">
          <div className="mb-4">
            <span className="mono block text-[11px] tracking-[0.14em] text-amber">{chapter.act}</span>
            <h3 className="mono mt-1 text-[18px] leading-snug tracking-[0.08em] text-bone">{chapter.title}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="mono border border-iron/70 px-2 py-[1px] text-[9px] tracking-[0.12em] text-slate">{chapter.location}</span>
              {chapter.sol !== null && <span className="mono border border-iron/70 px-2 py-[1px] text-[9px] tracking-[0.12em] text-cyan">SOL {chapter.sol}</span>}
              <span className="mono border border-iron/70 px-2 py-[1px] text-[9px] tracking-[0.12em] text-ash">{fmtDate(chapter.dateUtc)}</span>
            </div>
          </div>

          <div className="mb-5">
            <div className="label mb-1.5">MISSION NARRATIVE</div>
            <p className="text-[13px] leading-snug text-bone">{chapter.narrative}</p>
          </div>

          <div className="mb-5">
            <div className="label mb-1.5">WHY THIS HAPPENED</div>
            <p className="text-[12.5px] leading-snug text-ash">{chapter.whyHappened}</p>
          </div>

          {chapter.instruments.length > 0 && (
            <div className="mb-5">
              <div className="label mb-1">INSTRUMENTS INVOLVED</div>
              <div className="flex flex-wrap gap-1">{chapter.instruments.map((inst) => (
                <span key={inst} className="mono border border-iron/60 px-2 py-1 text-[10px] tracking-[0.08em] text-slate hover:border-amber hover:text-bone">{inst.toUpperCase()}</span>
              ))}</div>
            </div>
          )}

          <div className="mb-5">
            <div className="label mb-1.5">SCIENTIFIC SIGNIFICANCE</div>
            <p className="text-[12.5px] leading-snug text-bone">{chapter.scientificSignificance}</p>
          </div>

          <div className="mb-5">
            <div className="label mb-1.5">ENGINEERING SIGNIFICANCE</div>
            <p className="text-[12.5px] leading-snug text-ash">{chapter.engineeringSignificance}</p>
          </div>

          <div className="mb-5">
            <div className="label mb-1.5">LEGACY FOR FUTURE MISSIONS</div>
            <p className="text-[12.5px] leading-snug text-slate">{chapter.futureMissions}</p>
          </div>

          {chapter.discovery && (
            <div className="mb-5 border border-amber/30 bg-amber/5 p-3 rounded">
              <div className="label text-amber mb-1">DISCOVERY</div>
              <p className="text-[12.5px] leading-snug text-bone">{chapter.discovery}</p>
            </div>
          )}

          {caseFile && (
            <button className="mb-5 ctl ctl-primary w-full" onClick={() => openCase(caseFile)} aria-label="Open case file">
              OPEN CASE FILE · {caseFile.recordName}
            </button>
          )}

          <div className="mb-5">
            <div className="label mb-1.5">HOLOGRAM REVEAL SEQUENCE</div>
            {chapter.hologramSequence.map((step, i) => (
              <HologramStep key={i} step={step} />
            ))}
          </div>

          <div className="mb-8">
            <div className="label mb-1.5">CAMERA BEHAVIOR</div>
            <p className="text-[12px] leading-snug text-ash">{chapter.cameraBehavior}</p>
          </div>
        </div>

        {/* Right: Media / hologram preview */}
        <div className="flex-none w-[420px] border-l border-[#1d2429] p-5 bg-ink-1/40">
          <div className="label mb-3">HOLOGRAM PREVIEW</div>
          <div className="relative h-[300px] w-full bg-black border border-iron mb-4 overflow-hidden flex items-center justify-center">
            {chapter.media.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="mono text-[10px] tracking-[0.1em] text-amber">MEDIA AVAILABLE</div>
                {chapter.media.map((m, i) => (
                  <MediaChip key={i} label={m} />
                ))}
              </div>
            )}
            {!chapter.media.length && (
              <div className="mono text-[11px] text-ash">No media linked to this chapter</div>
            )}
            <div className="absolute left-3 bottom-3 mono text-[10px] tracking-[0.1em] text-slate">
              {viewMode}
            </div>
          </div>

          <div className="mb-4">
            <div className="label mb-1">CHAPTER TIMELINE SCRUB</div>
            <div className="relative h-2 bg-iron rounded overflow-hidden cursor-ew-resize">
              <div className="h-full bg-amber" style={{ width: `${progressPct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${progressPct}%` }}>
                <div className="w-2 h-2 rounded-full bg-amber shadow" />
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate">
              <span>{OPPORTUNITY_JOURNEY[0].date}</span>
              <span>{OPPORTUNITY_JOURNEY[total - 1].date}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button className="ctl ctl-primary" onClick={prevChapter} disabled={chapterIndex === 0} aria-label="Previous chapter">◀ PREV</button>
            <button className="ctl ctl-primary" onClick={nextChapter} disabled={chapterIndex === total - 1} aria-label="Next chapter">NEXT ▶</button>
          </div>

          <div className="flex gap-2">
            <button className="ctl flex-1" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button className="ctl flex-1" onClick={closeJourney} aria-label="Exit journey">✕ EXIT</button>
          </div>
        </div>
      </div>
    </div>
  );
}
