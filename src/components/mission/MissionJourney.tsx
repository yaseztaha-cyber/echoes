import { useCallback, useEffect, useRef, useState } from "react";
import { useEcho } from "@/state/store";
import { getJourney, type MissionJourney, type CaseFile } from "@/data/journeys";
import { artifactById } from "@/data/artifacts";
import { sourceById } from "@/data/sources";
import { setT, configureClock } from "@/engine/time/clock";
import { sfx } from "@/lib/audio";
import { transitionToJourneyChapter } from "@/engine/director";

const setOverlay = (o: string | null) => useEcho.setState({ overlay: o as any });

function CaseFileViewer({ caseFile, onClose }: { caseFile: CaseFile; onClose: () => void }) {
  const srcs = caseFile.sourceIds.map((sid: string) => sourceById(sid)).filter(Boolean);
  const handleClose = () => { sfx.close(); onClose(); };
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink-0/30 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto bg-ink-1/85 border border-iron/40 rounded shadow-2xl">
        <div className="flex items-start justify-between border-b border-iron/30 px-6 py-4">
          <div>
            <h2 className="mono text-[13px] tracking-[0.14em] text-bone">CASE FILE · {caseFile.recordName}</h2>
            <div className="label mt-1">{caseFile.title}</div>
          </div>
          <button className="ctl text-[9px] px-2 py-1" onClick={handleClose} aria-label="Close case file" style={{ minHeight: "22px" }}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div><div className="label mb-1">DIRECT OBSERVATION</div><p className="text-[12.5px] leading-relaxed text-bone">{caseFile.directObservation}</p></div>
          <div><div className="label mb-1">MEASUREMENT</div><p className="text-[12.5px] leading-relaxed text-bone">{caseFile.measurement}</p></div>
          <div><div className="label mb-1">EVIDENCE</div><p className="text-[12.5px] leading-relaxed text-bone">{caseFile.evidence}</p></div>
          <div><div className="label mb-1">SCIENTIFIC INTERPRETATION</div><p className="text-[12.5px] leading-relaxed text-bone">{caseFile.interpretation}</p></div>
          <div><div className="label mb-1">UNCERTAINTY</div><p className="text-[12.5px] leading-relaxed text-ash">{caseFile.uncertainty}</p></div>
          <div><div className="label mb-1">SIGNIFICANCE</div><p className="text-[12.5px] leading-relaxed text-amber">{caseFile.significance}</p></div>
          {caseFile.media.length > 0 && (
            <div><div className="label mb-1">MEDIA</div><div className="flex flex-wrap gap-1">{caseFile.media.map((m) => (
              <span key={m} className="mono border border-iron/60 px-2 py-1 text-[9px] text-ash">{m}</span>
            ))}</div></div>
          )}
          <div>
            <div className="label mb-1">SOURCES</div>
            {srcs.map((s: any) => (
              <a key={s!.id} href={s!.url} target="_blank" rel="noreferrer" className="mono mb-1 block border border-iron/60 px-3 py-2 text-[10px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone">
                <span className="text-amber">[{s!.kind}]</span> {s!.title} ↗
              </a>
            ))}
          </div>
          <button className="ctl ctl-primary mt-3 w-full" onClick={() => { sfx.confirm(); onClose(); }}>CLOSE CASE FILE</button>
        </div>
      </div>
    </div>
  );
}

export function MissionJourney() {
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const journey = aid ? getJourney(aid) : undefined;
  const [chapterIndex, setChapterIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [openCaseFile, setOpenCaseFile] = useState<CaseFile | null>(null);
  const [expanded, setExpanded] = useState(false);

  const chapter = journey?.chapters[chapterIndex];
  const total = journey?.chapters.length ?? 0;
  const progressPct = total > 1 ? (chapterIndex / (total - 1)) * 100 : 0;

  useEffect(() => {
    if (chapter?.dateUtc) {
      try {
        configureClock({ mode: "historical", rate: 0, range: null, t: chapter.dateUtc, speedIdx: 1, playing: false, dir: 1 });
        setT(chapter.dateUtc);
      } catch (e) { /* clock may not be available */ }
    }
  }, [chapterIndex, chapter?.dateUtc]);

  /**
   * Camera choreography fires ONLY for an explicit chapter navigation by the
   * user. Two things must never trigger it:
   *  - the initial mount (the overlay auto-opens when a device is reached);
   *  - a change of device (the transfer itself already moved the camera — the
   *    component is keyed by device id, so a new device starts a fresh
   *    chapter list instead of firing the previous one's choreography).
   */
  const firedChapter = useRef<number | null>(null);
  useEffect(() => {
    if (firedChapter.current === null) {
      firedChapter.current = chapterIndex; // mount for this device: no choreography
      return;
    }
    if (firedChapter.current === chapterIndex) return;
    firedChapter.current = chapterIndex;
    if (!chapter || !aid) return;
    const timer = setTimeout(() => {
      transitionToJourneyChapter(aid, chapter);
    }, 100);
    return () => clearTimeout(timer);
  }, [chapterIndex, aid]);

  const closeJourney = useCallback(() => { setPlaying(false); setOverlay(null); }, []);
  const nextChapter = useCallback(() => { sfx.select(); setChapterIndex((i) => Math.min(i + 1, total - 1)); }, [total]);
  const prevChapter = useCallback(() => { sfx.select(); setChapterIndex((i) => Math.max(i - 1, 0)); }, []);
  const togglePlay = useCallback(() => { sfx.select(); setPlaying((p) => !p); }, []);
  const openCase = useCallback((cf: CaseFile) => { sfx.select(); setOpenCaseFile(cf); }, []);

  if (!art || !journey || !chapter) return null;
  const caseFile = chapter.caseFileId ? journey.caseFiles.find((cf) => cf.id === chapter.caseFileId) : null;

  if (openCaseFile && caseFile) {
    return <CaseFileViewer caseFile={caseFile} onClose={() => setOpenCaseFile(null)} />;
  }

  const journeyTitle = journey.title || `${art.name} JOURNEY`;
  const isIntro = chapterIndex === 0;

  // Determine layout variant based on chapter content
  const hasMedia = chapter.media.length > 0;
  const hasDiscovery = !!chapter.discovery;
  const hasInstruments = chapter.instruments.length > 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-30" style={{ height: "100dvh" }} role="dialog" aria-label={`${art.name} mission journey`}>
      {/* Translucent backdrop — 40% opacity, 3D world clearly visible */}
      <div className="pointer-events-none absolute inset-0 bg-ink-0/40" />

      {/* Top bar — minimal, mission identity */}
      <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-b from-ink-0/50 to-transparent z-10">
        <div className="flex items-baseline gap-4">
          <h2 className="mono text-[11px] tracking-[0.25em] text-bone/70">{journeyTitle}</h2>
          <span className="label text-[8px] hidden lg:inline">{art.designation} · {art.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="mono text-[10px] text-amber/70">{chapter.date}</span>
          <button className="ctl text-[9px] px-2 py-1" onClick={closeJourney} aria-label="Exit journey" style={{ minHeight: "22px" }}>✕ EXIT</button>
        </div>
      </div>

      {/* Main cinematic content — fills most of screen, 3D world visible around edges */}
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center px-4 pt-12 pb-16 md:px-8">
        <div className="w-full max-w-7xl">
          {isIntro ? (
            /* INTRO: Asymmetric cinematic — large media left (60%), mission identity right (40%) */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Left: Large media viewport (3/5 = 60%) */}
              <div className="lg:col-span-3 relative">
                <div className="relative aspect-[16/9] bg-black/30 border border-iron/30 rounded-l-lg overflow-hidden">
                  {chapter.media.some(m => m.startsWith('http')) ? (
                    <div className="w-full h-full relative">
                      <img
                        src={chapter.media.find(m => m.startsWith('http'))!}
                        alt={chapter.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 left-3 mono text-[8px] text-white/60 tracking-[0.1em] bg-black/40 px-2 py-1 rounded">
                        ORIGINAL PHOTOGRAPH · NASA / JPL · {chapter.date}
                      </div>
                    </div>
                  ) : hasMedia ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="mono text-[11px] tracking-[0.15em] text-amber/80">HISTORICAL MEDIA</div>
                      <div className="flex flex-wrap gap-2 justify-center px-6">
                        {chapter.media.map((m, i) => (
                          <span key={i} className="mono border border-iron/50 bg-ink-0/40 px-3 py-1.5 text-[10px] text-ash">{m}</span>
                        ))}
                      </div>
                      <div className="mono text-[9px] text-slate/50 mt-2">ORIGINAL VIDEO / PHOTOGRAPH · NASA / JPL</div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="mono text-[12px] text-slate/40">HISTORICAL ARCHIVE</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Mission identity (2/5 = 40%) */}
              <div className="lg:col-span-2 bg-ink-1/50 border border-iron/30 border-l-0 rounded-r-lg p-6 flex flex-col justify-center space-y-5 backdrop-blur-sm">
                <div>
                  <div className="label mb-1 text-[9px]">{journey.missionName.toUpperCase()}</div>
                  <h1 className="mono text-[26px] leading-none tracking-[0.06em] text-bone mb-1">{art.name}</h1>
                  <div className="mono text-[11px] text-amber/70">{art.designation} · {journey.missionType.toUpperCase()}</div>
                </div>

                {/* Key achievements woven into text, not stat boxes */}
                <div className="space-y-3">
                  {journey.finalDistance && (
                    <div className="flex items-baseline gap-3">
                      <span className="mono text-[32px] leading-none text-amber">{journey.finalDistance}</span>
                      <span className="text-[11px] text-slate">distance travelled on Mars</span>
                    </div>
                  )}
                  {journey.finalDuration && (
                    <div className="flex items-baseline gap-3">
                      <span className="mono text-[32px] leading-none text-amber">{journey.finalDuration.split(" ")[0]}</span>
                      <span className="text-[11px] text-slate">Martian sols of operation</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="mono text-[32px] leading-none text-amber">{journey.chapters.length}</span>
                    <span className="text-[11px] text-slate">historical chapters</span>
                  </div>
                </div>

                <div>
                  <div className="label mb-1.5 text-[9px]">MISSION OBJECTIVE</div>
                  <p className="text-[12.5px] leading-relaxed text-bone">{journey.missionObjective}</p>
                </div>

                <div>
                  <div className="label mb-1.5 text-[9px]">INTRODUCTION</div>
                  <p className="text-[12px] leading-relaxed text-ash">{journey.introduction}</p>
                </div>

                {journey.limitedHistory && (
                  <div className="border border-amber/30 bg-amber/5 p-2 rounded">
                    <span className="mono text-[9px] tracking-[0.12em] text-amber">LIMITED HISTORICAL RECORD</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STAGE: Cinematic editorial layout — varies by content */
            <div className="relative">
              {/* Stage header — full width */}
              <div className="mb-4">
                <div className="flex items-baseline gap-4 mb-1">
                  <span className="mono text-[10px] tracking-[0.14em] text-amber/80">{chapter.act}</span>
                  <span className="mono text-[9px] text-slate/60">CHAPTER {chapterIndex + 1} OF {total}</span>
                </div>
                <h2 className="mono text-[24px] leading-tight tracking-[0.05em] text-bone mb-2">{chapter.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="mono border border-iron/40 bg-ink-0/30 px-2.5 py-1 text-[9px] tracking-[0.12em] text-slate">{chapter.location}</span>
                  {chapter.sol !== null && <span className="mono border border-iron/40 bg-ink-0/30 px-2.5 py-1 text-[9px] tracking-[0.12em] text-cyan/70">SOL {chapter.sol}</span>}
                  <span className="mono border border-iron/40 bg-ink-0/30 px-2.5 py-1 text-[9px] tracking-[0.12em] text-ash/70">{chapter.date}</span>
                </div>
              </div>

              {/* Media + content — asymmetric editorial layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Media area — 3/5 (60%) */}
              <div className="lg:col-span-3">
                {hasMedia ? (
                  <div className="relative bg-ink-1/30 border border-iron/30 rounded overflow-hidden">
                    <div className="aspect-[16/9] flex items-center justify-center">
                      {chapter.media.some(m => m.startsWith('http')) ? (
                        <div className="w-full h-full relative">
                          <img
                            src={chapter.media.find(m => m.startsWith('http'))!}
                            alt={chapter.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-2 left-3 mono text-[8px] text-white/60 tracking-[0.1em] bg-black/40 px-2 py-1 rounded">
                            ORIGINAL PHOTOGRAPH · NASA / JPL · {chapter.date}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="mono text-[10px] tracking-[0.12em] text-amber/60">HISTORICAL MEDIA</div>
                          <div className="flex flex-wrap gap-2 justify-center px-6">
                            {chapter.media.map((m, i) => (
                              <span key={i} className="mono border border-iron/50 bg-ink-0/30 px-3 py-1.5 text-[10px] text-ash">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Text-led editorial composition when no media */
                  <div className="bg-ink-1/30 border border-iron/30 rounded p-6 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <div className="mono text-[10px] tracking-[0.12em] text-slate/50 mb-2">HISTORICAL RECORD</div>
                      <div className="mono text-[14px] text-bone/60">{chapter.title}</div>
                    </div>
                  </div>
                )}
              </div>

                {/* Content area — 2/5 (40%) */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <div className="label mb-1 text-[9px]">MISSION NARRATIVE</div>
                    <p className="text-[12.5px] leading-relaxed text-bone">{chapter.narrative}</p>
                  </div>

                  <div>
                    <div className="label mb-1 text-[9px]">WHY THIS HAPPENED</div>
                    <p className="text-[11.5px] leading-relaxed text-ash">{chapter.whyHappened}</p>
                  </div>

                  {hasInstruments && (
                    <div>
                      <div className="label mb-1 text-[9px]">INSTRUMENTS</div>
                      <div className="flex flex-wrap gap-1">{chapter.instruments.map((inst) => (
                        <span key={inst} className="mono border border-iron/50 bg-ink-0/30 px-2 py-0.5 text-[8px] tracking-[0.08em] text-slate">{inst.toUpperCase()}</span>
                      ))}</div>
                    </div>
                  )}

                  <div>
                    <div className="label mb-1 text-[9px]">SCIENTIFIC SIGNIFICANCE</div>
                    <p className="text-[12px] leading-relaxed text-bone">{chapter.scientificSignificance}</p>
                  </div>

                  <div>
                    <div className="label mb-1 text-[9px]">ENGINEERING SIGNIFICANCE</div>
                    <p className="text-[11.5px] leading-relaxed text-ash">{chapter.engineeringSignificance}</p>
                  </div>

                  {hasDiscovery && (
                    <div className="border border-amber/20 bg-amber/5 p-3 rounded">
                      <div className="label text-amber mb-1 text-[9px]">DISCOVERY</div>
                      <p className="text-[11.5px] leading-snug text-bone">{chapter.discovery}</p>
                    </div>
                  )}

                  {caseFile && (
                    <button className="ctl ctl-primary text-[10px] w-full" onClick={() => openCase(caseFile)} aria-label="Open case file">
                      OPEN CASE FILE · {caseFile.recordName}
                    </button>
                  )}

                  <div>
                    <div className="label mb-1 text-[9px]">LEGACY</div>
                    <p className="text-[11px] leading-relaxed text-slate">{chapter.futureMissions}</p>
                  </div>
                </div>
              </div>

              {/* Expanded details toggle */}
              <div className="mt-3 flex justify-end">
                <button
                  className="mono text-[9px] tracking-[0.1em] text-slate/60 hover:text-amber transition-colors"
                  onClick={() => { sfx.select(); setExpanded(!expanded); }}
                >
                  {expanded ? "HIDE DETAILS ▲" : "SHOW DETAILS ▼"}
                </button>
              </div>

              {expanded && (
                <div className="mt-2 bg-ink-1/30 border border-iron/30 rounded p-4 space-y-3">
                  <div>
                    <div className="label mb-1 text-[9px]">CAMERA BEHAVIOR</div>
                    <p className="text-[11px] leading-relaxed text-ash">{chapter.cameraBehavior}</p>
                  </div>
                  <div>
                    <div className="label mb-1 text-[9px]">HOLOGRAM REVEAL SEQUENCE</div>
                    <div className="space-y-1">
                      {chapter.hologramSequence.map((step, i) => (
                        <div key={i} className="flex gap-2 text-[10px]">
                          <span className="mono text-amber/60 w-[60px] flex-none">{step.kind.toUpperCase()}</span>
                          <span className="text-bone/70">{step.title}</span>
                          <span className="text-slate/50">— {step.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contextual info — bottom left, compact */}
      {!isIntro && (
        <div className="pointer-events-auto absolute bottom-14 left-4 z-10 max-w-xs">
          <div className="bg-ink-1/50 border border-iron/30 rounded px-3 py-2 backdrop-blur-sm">
            <div className="mono text-[8px] tracking-[0.12em] text-amber/70 mb-0.5">{chapter.act}</div>
            <h3 className="mono text-[10px] leading-snug text-bone/80 mb-0.5">{chapter.title}</h3>
            <p className="text-[9px] leading-relaxed text-ash/70 line-clamp-2">{chapter.narrative}</p>
          </div>
        </div>
      )}

      {/* Slim timeline — bottom */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-ink-0/60 to-transparent">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-1 flex-none">
            <button className="ctl text-[9px] px-2 py-1" onClick={prevChapter} disabled={chapterIndex === 0} aria-label="Previous chapter" style={{ minHeight: "22px" }}>◀</button>
            <button className="ctl ctl-primary text-[9px] px-2 py-1" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={{ minHeight: "22px" }}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button className="ctl text-[9px] px-2 py-1" onClick={nextChapter} disabled={chapterIndex === total - 1} aria-label="Next chapter" style={{ minHeight: "22px" }}>▶</button>
          </div>

          <div className="flex items-center gap-2 flex-none">
            <span className="mono text-[9px] text-slate/60 whitespace-nowrap">{chapterIndex + 1}/{total}</span>
          </div>

          <div className="flex-1 relative h-1.5 bg-iron/30 rounded overflow-hidden cursor-pointer">
            <div className="h-full bg-amber/50 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            {journey.chapters.map((ch, i) => {
              const pos = total > 1 ? (i / (total - 1)) * 100 : 0;
              return (
                <button
                  key={ch.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-iron/50 bg-ink-0/60 hover:bg-amber/60 transition-colors"
                  style={{ left: `${pos}%`, backgroundColor: i <= chapterIndex ? "rgba(208,164,91,0.5)" : undefined }}
                  onClick={() => { sfx.select(); setChapterIndex(i); }}
                  aria-label={`Jump to ${ch.title}`}
                  title={ch.title}
                />
              );
            })}
          </div>

          <div className="flex-none max-w-[200px]">
            <span className="mono text-[9px] text-bone/50 truncate block">{chapter.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
