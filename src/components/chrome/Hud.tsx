import { useEffect, useState } from "react";
import { useEcho, persist, type CamMode } from "@/state/store";
import { artifactById, ALL_QUESTIONS } from "@/data/artifacts";
import { bodyById } from "@/engine/solar-system/model";
import { setCamMode, returnToSolarSystem } from "@/engine/director";
import { stopDemo } from "@/features/exploration/demo";
import { Field, Status, stateAt, useTele, pad2 } from "./ui";
import { setAudioEnabled, sfx } from "@/lib/audio";
import { solOf, fmtUTC } from "@/lib/time";
import { fmtDist } from "@/lib/geo";
import { Telemetry, Compass, Minimap } from "@/components/navigation/Telemetry";
import { Timeline, TimeControls, ReplayCard } from "@/components/timeline/Timeline";
import { ContextPanel } from "@/components/planet/ContextPanels";
import { InstrumentPanel, Compare, Decode } from "@/components/artifact/InstrumentPanel";
import { ScienceChain, SignalLink } from "@/components/science/ScienceChain";
import { Archive, GroundTruth, Search } from "@/components/sources/Overlays";
import { MissionLab } from "@/components/lab/MissionLab";
import { Remains, Finale } from "@/components/mission/Remains";
import { Evidence } from "@/components/evidence/EvidenceTrace";
import { clock } from "@/engine/time/clock";

function MissionConsole() {
  const scene = useEcho((s) => s.scene);
  const world = useEcho((s) => s.world);
  const focus = useEcho((s) => s.focusBody);
  const aid = useEcho((s) => s.artifactId);
  const sim = useEcho((s) => s.sim);
  const progress = useEcho((s) => s.progress);
  const art = artifactById(aid);
  const t = useTele(400);
  const total = ALL_QUESTIONS.length;
  const inSite = scene === "site" && art;
  const path = inSite ? `${art.destination.toUpperCase()} / ${art.designation}` : scene === "planet" ? `${world.toUpperCase()} / ORBIT` : art?.id === "voyager1" ? "DEEP SPACE / VGR-1" : `SOLAR SYSTEM / ${focus.toUpperCase()}`;
  const mode = scene === "solar" && !art ? "SOLAR SYSTEM DATE" : art?.clock.kind === "sol" ? "MISSION TIME" : "HISTORICAL DATE";
  return (
    <div className="module w-[260px] p-3 max-md:w-[190px] max-md:p-2.5" role="status" aria-label="Mission console">
      <div className="flex items-baseline justify-between">
        <span className="mono text-[13px] tracking-[0.3em] text-bone">ECHOES</span>
        <span className="label">{path}</span>
      </div>
      <div className="rule my-2" />
      {inSite && art ? (
        <>
          <Field k="LOCATION" v={art.location.region} />
          <Field k="MISSION STATE" v={<Status s={stateAt(art, sim.t)} />} mono={false} />
          {art.clock.kind === "sol" && art.dates.landing ? <Field k="SOL" v={Math.max(0, solOf(sim.t, art.dates.landing))} tone="text-amber" /> : <Field k="UTC" v={fmtUTC(sim.t).slice(0, 16)} />}
        </>
      ) : scene === "planet" ? (
        <>
          <Field k="WORLD" v={world.toUpperCase()} />
          <Field k="ALTITUDE" v={fmtDist(t.altitudeM)} />
          <Field k="SITE" v={art ? art.designation : "—"} tone="text-amber" />
        </>
      ) : art?.id === "voyager1" ? (
        <>
          <Field k="MISSION STATE" v={<Status s={art.status} />} mono={false} />
          <Field k="SUN DISTANCE" v={`${t.sunDistAU.toFixed(1)} AU`} tone="text-amber" />
        </>
      ) : (
        <>
          <Field k="FOCUS" v={bodyById(focus)?.name ?? focus.toUpperCase()} />
          <Field k="SUN DISTANCE" v={`${t.sunDistAU.toFixed(2)} AU`} />
        </>
      )}
      <div className="rule my-2" />
      <div className="flex items-center justify-between">
        <span className="label">{mode}</span>
        <span className="mono text-[10px] text-ash max-md:hidden">{fmtUTC(sim.t).slice(0, 10)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="label">ARCHIVE PROGRESS</span>
        <span className="mono text-[11px] text-bone">{pad2(progress.length)} / {pad2(total)}</span>
      </div>
      <div className="mt-1 flex gap-[3px]" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-[3px] flex-1 ${i < progress.length ? "bg-amber" : "bg-iron"}`} />
        ))}
      </div>
    </div>
  );
}

function Segmented<T extends string>({ a, b, value, onChange, label }: { a: [T, string]; b: [T, string]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex" role="group" aria-label={label}>
      {[a, b].map(([v, l]) => (
        <button key={v} className="ctl" data-on={value === v} aria-pressed={value === v} onClick={() => { sfx.select(); onChange(v); }}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Settings() {
  const q = useEcho((s) => s.quality);
  const reduced = useEcho((s) => s.reducedMotion);
  const audio = useEcho((s) => s.audioOn);
  return (
    <div className="module absolute right-0 top-9 z-40 w-64 p-3 anim-up">
      <div className="label mb-1">GRAPHICS QUALITY</div>
      <div className="grid grid-cols-4 gap-1">
        {(["ultra", "high", "medium", "low"] as const).map((k) => (
          <button key={k} className="ctl px-1" data-on={q === k} onClick={() => { useEcho.setState({ quality: k }); persist("echoes.quality", k); }}>
            {k}
          </button>
        ))}
      </div>
      <div className="label mb-1 mt-3">ACCESSIBILITY</div>
      <div className="flex gap-1">
        <button className="ctl flex-1" data-on={reduced} aria-pressed={reduced} onClick={() => { useEcho.setState({ reducedMotion: !reduced }); persist("echoes.reduced", !reduced); }}>
          REDUCED MOTION
        </button>
        <button className="ctl flex-1" data-on={audio} aria-pressed={audio} onClick={() => { setAudioEnabled(!audio); useEcho.setState({ audioOn: !audio }); persist("echoes.audio", !audio); }}>
          AUDIO {audio ? "ON" : "OFF"}
        </button>
      </div>
      <div className="label mt-3 leading-relaxed">
        MOUSE · LEFT DRAG ORBIT / LOOK · RIGHT DRAG PAN · WHEEL ZOOM
        <br />
        KEYS · WASD MOVE · Q/E VERTICAL · SHIFT FAST · F FOCUS · I INSPECT · T TIMELINE · M MINIMAP · G SCIENCE · ESC CLOSE
      </div>
      <div className="mt-3 flex gap-1">
        <a className="ctl flex-1 text-center" href="#/dev">DEV</a>
        <button className="ctl flex-1" onClick={() => { persist("echoes.progress", []); useEcho.setState({ progress: [] }); }}>RESET PROGRESS</button>
      </div>
    </div>
  );
}

function TopRight() {
  const ui = useEcho((s) => s.uiMode);
  const aud = useEcho((s) => s.audience);
  const open = useEcho((s) => s.menuOpen);
  const [sys, setSys] = useState(false);
  const setO = (o: any) => useEcho.setState({ overlay: o, menuOpen: false });
  return (
    <div className="relative flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <Segmented a={["cinematic", "CINEMATIC"]} b={["science", "SCIENCE"]} value={ui} onChange={(v) => useEcho.setState({ uiMode: v })} label="Display mode" />
        <button className="ctl md:hidden" aria-expanded={open} onClick={() => useEcho.setState({ menuOpen: !open })}>MENU</button>
      </div>
      <div className={`${open ? "flex" : "hidden"} flex-col items-end gap-1.5 md:flex`}>
        <Segmented a={["explorer", "EXPLORER"]} b={["student", "STUDENT"]} value={aud} onChange={(v) => useEcho.setState({ audience: v })} label="Information density" />
        <div className="flex flex-wrap justify-end gap-1">
          <button className="ctl" onClick={() => setO("search")}>SEARCH</button>
          <button className="ctl" onClick={() => setO("archive")}>ARCHIVE</button>
          <button className="ctl" onClick={() => setO("sources")}>GROUND TRUTH</button>
          <button className="ctl" onClick={() => setO("lab")}>MISSION LAB</button>
          <button className="ctl" aria-expanded={sys} onClick={() => setSys(!sys)}>SYS</button>
        </div>
        {sys && <Settings />}
      </div>
    </div>
  );
}

const MODES: [CamMode, string][] = [["orbit", "ORBIT"], ["free", "FREE"], ["follow", "FOLLOW"], ["surface", "SURFACE"], ["inspect", "INSPECT"], ["cinematic", "CINE"], ["overview", "OVERVIEW"]];

function CamModes() {
  const mode = useEcho((s) => s.camMode);
  const scene = useEcho((s) => s.scene);
  const aid = useEcho((s) => s.artifactId);
  return (
    <div className="flex max-w-full gap-px overflow-x-auto scroll-thin" role="group" aria-label="Camera mode">
      {MODES.map(([m, l]) => {
        const disabled = (m === "surface" && scene !== "site") || (m === "inspect" && !(scene === "site" || aid === "voyager1"));
        return (
          <button key={m} className="ctl" data-on={mode === m} aria-pressed={mode === m} disabled={disabled} style={{ opacity: disabled ? 0.4 : 1 }} onClick={() => setCamMode(m)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

function Banner() {
  const b = useEcho((s) => s.banner);
  if (!b) return null;
  return (
    <div key={b.key} className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 text-center anim-up" style={{ animationDuration: "0.9s" }}>
      <div className="mono text-[clamp(18px,3.2vw,34px)] font-light tracking-[0.32em] text-bone">{b.title}</div>
      {b.sub && <div className="mono mt-2 text-[10.5px] tracking-[0.3em] text-amber">{b.sub}</div>}
    </div>
  );
}

function Arrival() {
  const a = useEcho((s) => s.arrival);
  const t = useTele(90);
  if (!a.active) return null;
  const d = t.distToArtifact;
  const ladder = [[1200, "1.2 KM"], [600, "600 M"], [150, "150 M"], [30, "30 M"]] as const;
  return (
    <div className="pointer-events-none absolute bottom-[28%] left-1/2 -translate-x-1/2 text-center">
      <div className="label">DISTANCE TO {a.label}</div>
      <div className="mono mt-1 text-[clamp(26px,5vw,52px)] font-light tracking-[0.12em] text-bone">{fmtDist(d)}</div>
      <div className="mt-3 flex justify-center gap-5">
        {ladder.map(([m, l]) => (
          <span key={l} className={`mono text-[10px] tracking-[0.14em] ${d <= m ? "text-amber" : "text-iron"}`}>{d <= m ? "◆" : "◇"} {l}</span>
        ))}
      </div>
    </div>
  );
}

function SurfaceStatus() {
  const scene = useEcho((s) => s.scene);
  const tiles = useEcho((s) => s.tiles);
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (!tiles.ready) setShown(true);
    else {
      const id = setTimeout(() => setShown(false), 1800);
      return () => clearTimeout(id);
    }
  }, [tiles.ready]);
  if (scene !== "site" || !art || !shown) return null;
  const pct = tiles.needed ? Math.round((tiles.loaded / tiles.needed) * 100) : 0;
  const dots = (k: string, v: string) => (
    <div className="flex mono text-[10px] tracking-[0.12em] text-slate">
      <span>{k}</span>
      <span className="mx-2 flex-1 overflow-hidden whitespace-nowrap text-iron">{".".repeat(30)}</span>
      <span className={v === "READY" ? "text-ok" : "text-bone"}>{v}</span>
    </div>
  );
  return (
    <div className="module w-64 p-3 anim-up">
      <div className="label text-cyan">{art.destination.toUpperCase()} SURFACE SYSTEM</div>
      <div className="mono mt-1 text-[12px] tracking-[0.14em] text-bone">{tiles.ready ? "SURFACE DATA SYNCED" : "SURFACE DATA STREAMING"}</div>
      <div className="rule my-2" />
      <Field k="REGION" v={art.location.region} />
      <Field k="RESOLUTION" v={`LEVEL ${pad2(tiles.level)}`} />
      <Field k="TILES" v={`${tiles.loaded} / ${tiles.needed}`} tone="text-amber" />
      <div className="rule my-2" />
      {dots("ACQUIRING TERRAIN", `${pct}%`)}
      {dots("LOADING ELEVATION", `${pct}%`)}
      {dots("LOADING IMAGERY", "READY")}
      {dots("LOCATING MISSION", "READY")}
    </div>
  );
}

function DataResolution() {
  const scene = useEcho((s) => s.scene);
  const ui = useEcho((s) => s.uiMode);
  const aud = useEcho((s) => s.audience);
  if (scene !== "site" || (ui !== "science" && aud !== "student")) return null;
  return (
    <div className="module w-64 p-3 max-md:hidden">
      <div className="label mb-1">DATA RESOLUTION</div>
      <Field k="GLOBAL" v="MEDIUM · NASA/USGS IMAGERY" tone="text-ok" />
      <Field k="REGIONAL" v="VISUALIZATION" tone="text-warn" />
      <Field k="MISSION SITE" v="VISUALIZATION" tone="text-warn" />
      <div className="label mt-2 leading-relaxed text-slate">RECONSTRUCTED VISUALIZATION. Anchored to documented crater and waypoint positions. Surface relief is procedural pending surveyed terrain integration.</div>
    </div>
  );
}

function Provenance() {
  const scene = useEcho((s) => s.scene);
  const label = scene === "solar" ? ["SIMULATION", "text-cyan", "CIRCULAR-ORBIT MODEL · SPIN NOT SIMULATED"] : scene === "planet" ? ["NASA RECORD + SIMULATION", "text-ok", "GLOBAL IMAGERY: NASA / USGS"] : ["RECONSTRUCTED", "text-warn", "MODEL + TERRAIN ARE VISUALIZATION"];
  return (
    <div className="pointer-events-none text-right max-md:hidden">
      <span className={`mono border border-iron/70 px-1.5 py-[2px] text-[9px] tracking-[0.16em] ${label[1]}`}>{label[0]}</span>
      <div className="label mt-1 text-[9px]">{label[2]}</div>
      {scene === "solar" && <div className="label mt-0.5 text-[9px]">VISUAL SCALE · ADJUSTED FOR NAVIGATION</div>}
    </div>
  );
}

function Veil() {
  const v = useEcho((s) => s.veil);
  const tone = useEcho((s) => s.veilTone);
  return <div className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-[600ms]" style={{ opacity: v, background: tone === "mars" ? "radial-gradient(circle at 50% 60%, #8a5d44, #3a2418 80%)" : "#030406" }} />;
}

function Toasts() {
  const toasts = useEcho((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-40 flex -translate-x-1/2 flex-col gap-2" aria-live="assertive">
      {toasts.map((t) => (
        <div key={t.id} className="module anim-up border-l-2 border-l-amber px-4 py-2.5">
          <div className="label text-amber">{t.title}</div>
          <div className="mono mt-0.5 text-[13px] tracking-[0.14em] text-bone">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Vignette() {
  const inspect = useEcho((s) => s.camMode === "inspect");
  return <div className="pointer-events-none absolute inset-0 transition-opacity duration-700" style={{ opacity: inspect ? 1 : 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,.62) 100%), rgba(0,0,0,.18)" }} />;
}

export function Hud() {
  const entered = useEcho((s) => s.entered);
  const flying = useEcho((s) => s.flying);
  const mode = useEcho((s) => s.camMode);
  const demo = useEcho((s) => s.demo);
  const scene = useEcho((s) => s.scene);
  const aid = useEcho((s) => s.artifactId);
  const overlay = useEcho((s) => s.overlay);
  const minimap = useEcho((s) => s.minimap);
  const scienceOpen = useEcho((s) => s.scienceOpen);
  const reduced = useEcho((s) => s.reducedMotion);
  const art = artifactById(aid);
  const cine = mode === "cinematic";
  const hasTimeline = !!art && (scene === "site" || aid === "voyager1");

  useEffect(() => {
    document.documentElement.classList.toggle("reduced", reduced);
  }, [reduced]);
  useEffect(() => setAudioEnabled(useEcho.getState().audioOn), []);

  if (!entered) return null;
  const dim = flying ? "opacity-[0.18]" : "opacity-100";
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <Vignette />
      <Banner />
      <Arrival />
      <SignalLink />
      <div className="sr-only" aria-live="polite">
        {scene === "site" && art ? `Viewing ${art.name} at ${art.location.region} on ${art.destination}.` : scene === "planet" ? "In orbit." : "Solar system view."}
      </div>
      {demo.caption && (
        <div className="absolute inset-x-0 bottom-[16%] z-20 flex justify-center px-6 text-center">
          <div className="mono max-w-3xl text-[clamp(11px,1.8vw,16px)] tracking-[0.3em] text-bone" style={{ textShadow: "0 0 10px #000" }}>{demo.caption}</div>
        </div>
      )}
      {demo.active && (
        <button className="ctl pointer-events-auto absolute left-1/2 top-3 z-30 -translate-x-1/2" onClick={stopDemo}>STOP DEMO · ESC</button>
      )}
      {cine && !demo.active && (
        <button className="ctl pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 opacity-70" onClick={() => useEcho.setState({ camMode: "orbit" })}>EXIT CINEMATIC · ESC</button>
      )}

      {!cine && (
        <>
          <div className={`pointer-events-auto absolute left-3 top-3 transition-opacity duration-700 ${flying ? "opacity-60" : ""}`}>
            <MissionConsole />
          </div>
          <div className={`pointer-events-auto absolute right-3 top-3 z-20 transition-opacity duration-700 ${flying ? "opacity-40" : ""}`}>
            <TopRight />
          </div>

          {/* contextual right column */}
          <div className={`pointer-events-none absolute right-3 top-[132px] bottom-[168px] z-10 flex w-[336px] flex-col items-end gap-3 overflow-y-auto transition-opacity duration-700 scroll-thin max-md:inset-x-2 max-md:top-auto max-md:bottom-[96px] max-md:max-h-[44vh] max-md:w-auto ${dim}`}>
            {mode === "inspect" ? scienceOpen ? <ScienceChain /> : <InstrumentPanel /> : <ContextPanel />}
          </div>

          {/* left-bottom stack */}
          <div className={`pointer-events-none absolute bottom-[100px] left-3 flex flex-col gap-2 transition-opacity duration-700 max-md:bottom-[200px] ${dim}`}>
            <ReplayCard />
            <div className="pointer-events-auto"><SurfaceStatus /></div>
            <div className="pointer-events-auto"><DataResolution /></div>
            <Telemetry />
          </div>

          <div className={`absolute bottom-[100px] right-3 flex flex-col items-end gap-2 max-md:hidden ${flying ? "opacity-30" : ""}`}>
            <Provenance />
          </div>
          {minimap && (
            <div className={`pointer-events-auto absolute left-3 top-[260px] max-md:hidden ${flying ? "opacity-40" : ""}`}>
              <Minimap />
            </div>
          )}

          {/* bottom strip */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-3 bg-gradient-to-t from-ink-0/90 to-transparent px-3 pb-3 pt-6 max-md:gap-2">
            <div className="flex flex-col gap-1.5 max-md:w-full">
              <Compass />
              <CamModes />
            </div>
            <div className="min-w-[220px] flex-1 max-md:order-last max-md:basis-full">{hasTimeline && <Timeline />}</div>
            <TimeControls />
          </div>
        </>
      )}

      {overlay === "archive" && <Archive />}
      {overlay === "sources" && <GroundTruth />}
      {overlay === "search" && <Search />}
      {overlay === "lab" && <MissionLab />}
      {overlay === "remains" && <Remains />}
      {overlay === "finale" && <Finale />}
      {overlay === "evidence" && <Evidence />}
      <Compare />
      <Decode />
      <Veil />
      <Toasts />
      {scene !== "solar" && !cine && (
        <button className="ctl pointer-events-auto absolute left-3 top-[216px] z-10 max-md:hidden" onClick={() => returnToSolarSystem()}>
          ← SOLAR SYSTEM
        </button>
      )}
      <span className="hidden">{clock.t}</span>
    </div>
  );
}
