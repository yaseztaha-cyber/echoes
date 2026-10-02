import { useState } from "react";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { Panel, Field, Chip } from "@/components/chrome/ui";
import { fmtDate } from "@/lib/time";
import { fmtLat, fmtLon } from "@/lib/geo";
import { leaveFinale, playFinale } from "@/engine/director";
import { sfx } from "@/lib/audio";

/** AFTER THE MISSION — physical remains, data, and legacy. The 3D world shows where the hardware is. */
export function Remains() {
  const aid = useEcho((s) => s.artifactId);
  const art = artifactById(aid);
  const [tab, setTab] = useState<"PHYSICAL" | "DATA" | "LEGACY">("PHYSICAL");
  if (!art) return null;
  const last = art.missionPath?.waypoints.at(-1);
  return (
    <div className="pointer-events-none absolute right-3 top-[132px] bottom-[168px] z-20 flex w-[336px] flex-col max-md:inset-x-2 max-md:bottom-[96px] max-md:top-auto max-md:w-auto">
      <Panel title="AFTER THE MISSION" sub={`${art.designation} · ${art.name}`} className="pointer-events-auto flex max-h-full flex-col overflow-hidden" right={<button className="ctl px-2" aria-label="Close" onClick={() => useEcho.setState({ overlay: null })}>✕</button>}>
        <div className="mb-3 flex gap-px" role="tablist">
          {(["PHYSICAL", "DATA", "LEGACY"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className="ctl flex-1 px-1" data-on={tab === k} onClick={() => { sfx.select(); setTab(k); }}>{k}</button>
          ))}
        </div>
        <div className="scroll-thin max-h-[48vh] overflow-y-auto anim-up" key={tab}>
          {tab === "PHYSICAL" && (
            <>
              <div className="label">WHERE THE HARDWARE IS</div>
              <p className="mt-1 text-[13.5px] leading-snug text-bone">{art.legacy.physical}</p>
              <div className="mt-3">
                <Field k="REGION" v={art.location.region} />
                <Field k="WORLD" v={art.destination.toUpperCase()} />
                {art.destination !== "deep-space" && <Field k="REF. LAT / LON" v={`${fmtLat(art.location.lat)} ${fmtLon(art.location.lon)}`} />}
                {last && <Field k="LAST KNOWN" v={last.name} />}
              </div>
              <div className="label mt-3 leading-relaxed">THE 3D VIEW SHOWS THE HARDWARE WHERE IT STOPPED. POSITION IS APPROXIMATE · RECONSTRUCTED.</div>
            </>
          )}
          {tab === "DATA" && (
            <>
              <div className="label">WHAT INFORMATION REMAINS</div>
              <p className="mt-1 text-[13.5px] leading-snug text-bone">{art.legacy.data}</p>
              {art.media.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {art.media.slice(0, 6).map((m) => (
                    <a key={m.id} href={m.recordUrl} target="_blank" rel="noreferrer" title={m.title}>
                      <img src={m.url} alt={m.title} className="h-16 w-full border border-iron object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 label">TIMELINE OF RECORD</div>
              {art.timeline.slice(-5).map((e) => (
                <div key={e.id} className="mono flex justify-between border-t border-[#1d2429] py-1 text-[10.5px] tracking-[0.08em]">
                  <span className="text-ash">{e.title}</span>
                  <span className="text-slate">{fmtDate(e.t)}</span>
                </div>
              ))}
            </>
          )}
          {tab === "LEGACY" && (
            <>
              <div className="label">WHAT FUTURE SCIENCE GAINED</div>
              <ul className="mt-1 space-y-2">
                {art.legacy.legacy.map((l) => (
                  <li key={l} className="border-l border-amber/60 pl-2 text-[13.5px] leading-snug text-bone">{l}</li>
                ))}
              </ul>
              <div className="mt-3"><Chip tone="text-ok">NASA RECORD</Chip></div>
            </>
          )}
        </div>
        <button className="ctl ctl-primary mt-3 w-full" onClick={() => playFinale()}>CONTINUE →</button>
      </Panel>
    </div>
  );
}

export function Finale() {
  const [ready, setReady] = useState(false);
  useState(() => {
    setTimeout(() => setReady(true), 6500);
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end bg-gradient-to-t from-ink-0/90 via-ink-0/30 to-transparent pb-[12vh] text-center">
      <h2 className="mono px-6 text-[clamp(20px,4.6vw,52px)] font-light leading-snug tracking-[0.18em] text-bone anim-up" style={{ animationDuration: "2s" }}>
        THE MISSION ENDED.
      </h2>
      <h2 className="mono px-6 text-[clamp(20px,4.6vw,52px)] font-light leading-snug tracking-[0.18em] text-amber" style={{ animation: "fadeUp 2s 2.6s both" }}>
        THE SCIENCE DIDN’T.
      </h2>
      <div className="mt-8 transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? "auto" : "none" }}>
        <button className="ctl ctl-primary pointer-events-auto px-6 py-3 tracking-[0.24em]" onClick={() => leaveFinale()}>RETURN TO THE SOLAR SYSTEM</button>
      </div>
    </div>
  );
}
