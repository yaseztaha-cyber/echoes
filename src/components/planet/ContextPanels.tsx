import { useEcho } from "@/state/store";
import { ARTIFACTS, artifactById, artifactsFor } from "@/data/artifacts";
import { sourceById } from "@/data/sources";
import { BODIES, bodyById } from "@/engine/frames/frames";
import { Chip, Field, Panel, Status, stateAt, useTele } from "@/components/chrome/ui";
import { descendToSite, focusBody, goVoyager, inspectHardware, leaveSite, openRemains, returnToSolarSystem, scalePullback, selectSite, startReplay, travelToBody, goToArtifact } from "@/engine/director";
import { SunLayerPanel } from "@/components/solar/SunLayerPanel";
import { fmtDist, fmtLat, fmtLon } from "@/lib/geo";
import { fmtDate } from "@/lib/time";
import { sfx } from "@/lib/audio";

const AU = 149597870.7;
const lightTime = (km: number) => {
  const s = km / 299792.458;
  if (s < 90) return `${s.toFixed(1)} S`;
  const m = Math.floor(s / 60);
  return `${m} MIN ${Math.round(s % 60)} S`;
};

function BodyPanel() {
  const focus = useEcho((s) => s.focusBody);
  const venusView = useEcho((s) => s.venusView);
  const t = useTele(300);
  const b = bodyById(focus);
  if (!b) return null;
  const sites = b.destination ? artifactsFor(b.destination) : [];
  return (
    <div className="pointer-events-auto flex w-full flex-col gap-3">
      <Panel title={b.name} sub={b.dwarf ? "DWARF PLANET" : b.kind.toUpperCase()}>
        <Field k="SUN DISTANCE" v={`${t.sunDistAU.toFixed(3)} AU`} />
        <Field k="MEAN RADIUS" v={`${b.km.toLocaleString()} KM`} />
        {b.dwarf && <Field k="CLASS" v="DWARF PLANET · KUIPER BELT" tone="text-amber" />}
        {focus !== "earth" && focus !== "sun" && <Field k="FROM EARTH" v={fmtDist(t.focusRealKm * 1000)} />}
        {focus !== "earth" && focus !== "sun" && <Field k="LIGHT TIME" v={lightTime(t.focusRealKm)} />}
        {b.a > 0 && <Field k="ORBIT" v={`${b.a} AU · ${b.periodDays.toLocaleString()} D`} />}
        {focus === "venus" && (
          <div className="mt-3">
            <div className="label mb-1">VENUS VIEW</div>
            <div className="flex gap-1">
              {(["surface", "clouds"] as const).map((v) => (
                <button key={v} className="ctl flex-1 px-1 text-[9.5px]" data-on={venusView === v} onClick={() => { sfx.select(); useEcho.setState({ venusView: v }); }}>
                  {v === "surface" ? "SURFACE DATA" : "CLOUDS"}
                </button>
              ))}
            </div>
            <div className="label mt-1 leading-relaxed">SURFACE = MAGELLAN RADAR, NOT A PHOTO · CLOUDS = REPRESENTATIVE APPEARANCE</div>
          </div>
        )}
        {focus === "sun" && <SunLayerPanel />}
        <div className="label mt-2 leading-relaxed">DISTANCES FROM KEPLERIAN HELIOCENTRIC POSITIONS (JPL APPROX. ELEMENTS · DE441-VERIFIED). DISPLAY POSITIONS USE ADJUSTED VISUAL SCALE.</div>
        {(b.destination || focus === "earth") && (
          <button className="ctl ctl-primary mt-3 w-full" onClick={() => travelToBody(b.destination ?? "earth")}>
            {b.destination ? `TRAVEL TO ${b.name} →` : "ENTER EARTH ORBIT →"}
          </button>
        )}
        {b.destination && (
          <div className="mt-3">
            <div className="label mb-1">{sites.length} MISSION SITES</div>
            {sites.map((a) => (
              <button key={a.id} className="mono flex w-full items-center justify-between border-t border-[#1d2429] py-1.5 text-left text-[11px] tracking-[0.1em] text-ash hover:text-amber" onClick={() => goToArtifact(a.id)}>
                <span>{a.designation} · {a.name}</span>
                <span className="text-slate">→</span>
              </button>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="NAVIGATE" sub="SELECT A BODY OR SPACECRAFT">
        <div className="grid grid-cols-3 gap-1">
          {BODIES.map((x) => (
            <button key={x.id} className="ctl px-1 text-[9.5px]" data-on={focus === x.id} onClick={() => focusBody(x.id)}>{x.name}</button>
          ))}
          <button className="ctl px-1 text-[9.5px]" onClick={() => goVoyager()}>VOYAGER 1</button>
        </div>
        <div className="label mt-2">1 AU = {(AU / 1e6).toFixed(1)} M KM</div>
      </Panel>
    </div>
  );
}

function PlanetPanel() {
  const world = useEcho((s) => s.world);
  const aid = useEcho((s) => s.artifactId);
  const sunPhase = useEcho((s) => s.sunPhase);
  const t = useTele(300);
  const sites = world === "mars" || world === "moon" ? artifactsFor(world) : [];
  const sel = artifactById(aid);
  const sim = useEcho((s) => s.sim);
  const setPhase = (v: number) => useEcho.setState({ sunPhase: v });
  const chips: [string, number][] = [
    ["NOON", 0],
    ["DUSK", Math.PI / 2],
    ["MIDNIGHT", Math.PI],
    ["DAWN", (3 * Math.PI) / 2],
  ];
  return (
    <div className="pointer-events-auto flex w-full flex-col gap-3">
      <Panel title={world.toUpperCase()} sub="ORBITAL VIEW">
        <Field k="ALTITUDE" v={fmtDist(t.altitudeM)} />
        <Field k="SUB-CAMERA" v={`${fmtLat(t.lat)} ${fmtLon(t.lon)}`} />
        <div className="mt-3">
          <div className="label mb-1">SUN PHASE · SIMULATED TIME OF DAY</div>
          <input
            type="range"
            min={0}
            max={Math.PI * 2}
            step={0.01}
            value={sunPhase}
            onChange={(e) => setPhase(+e.target.value)}
            className="my-1 w-full accent-[#d0a45b]"
            aria-label="Sun phase scrub, simulated time of day"
          />
          <div className="flex gap-1">
            {chips.map(([name, v]) => (
              <button key={name} className="ctl flex-1 px-1 text-[9.5px]" data-on={Math.abs(((sunPhase - v + Math.PI * 2) % (Math.PI * 2)) - 0) < 0.06 || sunPhase === v} onClick={() => setPhase(v)}>
                {name}
              </button>
            ))}
          </div>
          <div className="label mt-1 leading-relaxed">TIME-OF-DAY IS SIMULATED FOR STUDY · 0 = REAL ARRIVAL SUN GEOMETRY</div>
        </div>
        {sites.length > 0 && <div className="label mt-2">SELECT A MISSION SITE ON THE GLOBE OR FROM THE LIST</div>}
        <div className="mt-2">
          {sites.map((a) => (
            <button key={a.id} onClick={() => selectSite(a.id)} data-on={aid === a.id} className={`mono flex w-full items-center justify-between border-t border-[#1d2429] py-1.5 text-left text-[11px] tracking-[0.1em] ${aid === a.id ? "text-amber" : "text-ash hover:text-bone"}`}>
              <span>{a.designation} · {a.name}</span>
              <span className="text-slate">{a.location.region.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </Panel>
      {sel && sel.destination === world && (
        <Panel title={`${sel.designation} · ${sel.name}`} sub={sel.location.region}>
          <Field k="LATITUDE" v={fmtLat(sel.location.lat)} />
          <Field k="LONGITUDE" v={fmtLon(sel.location.lon)} />
          <Field k="STATUS" v={<Status s={sel.status} />} mono={false} />
          <p className="mt-2 text-[13px] leading-snug text-ash">{sel.summary}</p>
          <button className="ctl ctl-primary mt-3 w-full" onClick={() => descendToSite(sel.id)}>DESCEND TO SITE ↓</button>
        </Panel>
      )}
      <span className="hidden">{sim.t}</span>
    </div>
  );
}

function ArtifactPanel() {
  const aid = useEcho((s) => s.artifactId)!;
  const sim = useEcho((s) => s.sim);
  const ui = useEcho((s) => s.uiMode);
  const aud = useEcho((s) => s.audience);
  const scene = useEcho((s) => s.scene);
  const progress = useEcho((s) => s.progress);
  const art = artifactById(aid);
  if (!art) return null;
  const detail = ui === "science" || aud === "student";
  const voy = art.id === "voyager1";
  return (
    <div className="pointer-events-auto flex w-full flex-col gap-3">
      <Panel title={`${art.designation} · ${art.name}`} sub={art.missionName.toUpperCase()} right={<Chip tone="text-warn">{art.model.modelType}</Chip>}>
        <Field k="MISSION STATE" v={<Status s={stateAt(art, sim.t)} />} mono={false} />
        <Field k="LOCATION" v={art.location.region} />
        {!voy && <Field k="COORDINATES" v={`${fmtLat(art.location.lat)} ${fmtLon(art.location.lon)}`} />}
        <Field k="LAUNCH" v={fmtDate(art.dates.launch)} />
        {art.dates.landing && <Field k="LANDING" v={fmtDate(art.dates.landing)} />}
        <p className="mt-2 text-[13px] leading-snug text-ash">{art.summary}</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <button className="ctl ctl-primary col-span-2" onClick={() => inspectHardware()}>INSPECT HARDWARE</button>
          <button className="ctl" onClick={() => startReplay()}>▶ REPLAY MISSION</button>
          {voy ? <button className="ctl" onClick={() => scalePullback()}>SCALE PULLBACK</button> : <button className="ctl" onClick={() => openRemains()}>WHAT REMAINS?</button>}
          {art.media.length > 0 && <button className="ctl" onClick={() => useEcho.setState({ compareOpen: true })}>COMPARE NASA IMAGE</button>}
          {art.media.some((m) => m.imageType?.includes("PANORAM")) && (
            <button className="ctl" onClick={() => { sfx.open(); useEcho.setState({ overlay: "panorama", panoramaId: null }); }}>VIEW REAL PANORAMA</button>
          )}
          <button className="ctl" onClick={() => (scene === "site" ? leaveSite() : returnToSolarSystem())}>{scene === "site" ? "↑ LEAVE SITE" : "← SOLAR SYSTEM"}</button>
        </div>
      </Panel>
      {detail && (
        <Panel title="MODEL PROVENANCE" sub="WHAT IS REAL · WHAT IS VISUALIZED">
          <Field k="MODEL" v={art.model.title} />
          <Field k="SOURCE" v={<span className="text-[11px]">{art.model.source}</span>} mono={false} />
          <Field k="MODEL TYPE" v={art.model.modelType} tone="text-warn" />
          <Field k="ACCURACY" v={<span className="text-[10.5px]">{art.model.accuracy}</span>} />
          <p className="label mt-2 leading-relaxed normal-case tracking-normal text-slate">{art.model.note}</p>
        </Panel>
      )}
      {aud === "student" && (
        <Panel title="SCIENCE RECORDS" sub={`${art.scientificQuestions.filter((q) => progress.includes(q.id)).length} / ${art.scientificQuestions.length} UNDERSTOOD`}>
          {art.scientificQuestions.map((q) => (
            <div key={q.id} className="border-t border-[#1d2429] py-1.5">
              <div className="mono text-[11px] tracking-[0.1em] text-bone">{progress.includes(q.id) ? "◆" : "◇"} {q.recordName}</div>
              <div className="text-[12px] text-slate">{q.question}</div>
            </div>
          ))}
          <div className="label mt-2">INSPECT HARDWARE → SELECT AN INSTRUMENT → SEE THE SCIENCE</div>
          <div className="label mt-3">SOURCES</div>
          {art.sources.slice(0, 4).map((s) => {
            const src = sourceById(s.sourceId);
            return src ? (
              <a key={s.sourceId} href={src.url} target="_blank" rel="noreferrer" className="mono mt-1 block text-[10.5px] text-ash hover:text-amber" onClick={() => sfx.source()}>↗ {src.title.slice(0, 60)}</a>
            ) : null;
          })}
        </Panel>
      )}
    </div>
  );
}

export function ContextPanel() {
  const scene = useEcho((s) => s.scene);
  const aid = useEcho((s) => s.artifactId);
  if (scene === "solar" && aid === "voyager1") return <ArtifactPanel />;
  if (scene === "solar") return <BodyPanel />;
  if (scene === "planet") return <PlanetPanel />;
  return <ArtifactPanel />;
}

export const _all = ARTIFACTS;
