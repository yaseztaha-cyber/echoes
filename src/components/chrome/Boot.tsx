import { useEffect, useState } from "react";
import { useEcho } from "@/state/store";
import { enterSimulation, goToArtifact } from "@/engine/director";
import { unlockAudio, sfx } from "@/lib/audio";
import { runDemo } from "@/features/exploration/demo";
import { artifactById } from "@/data/artifacts";

const LINES: [string, string][] = [
  ["ARCHIVE NODE", "CONNECTED"],
  ["MISSION DATABASE", "CONNECTED"],
  ["TERRAIN ENGINE", "READY"],
  ["SPACECRAFT LIBRARY", "READY"],
  ["SCIENCE RECORDS", "READY"],
  ["MEDIA ARCHIVE", "READY"],
];

export function Boot() {
  const entered = useEcho((s) => s.entered);
  const last = useEcho((s) => s.last);
  const reduced = useEcho((s) => s.reducedMotion);
  const [n, setN] = useState(0);
  const [stage, setStage] = useState<"log" | "title">("log");
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const step = reduced ? 20 : 340;
    const timers: number[] = [];
    LINES.forEach((_, i) => timers.push(window.setTimeout(() => setN(i + 1), 500 + i * step)));
    timers.push(window.setTimeout(() => setN(LINES.length + 1), 500 + LINES.length * step + 100));
    timers.push(window.setTimeout(() => setStage("title"), 500 + LINES.length * step + (reduced ? 100 : 1500)));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const enter = (then?: () => void) => {
    unlockAudio();
    sfx.open();
    setOpen(true);
    enterSimulation();
    window.setTimeout(() => setGone(true), reduced ? 100 : 1700);
    then && window.setTimeout(then, reduced ? 200 : 2600);
  };

  if (gone || entered && !open) return null;
  const lastArt = artifactById(last?.artifactId);

  return (
    <div className="fixed inset-0 z-50" aria-live="polite">
      {/* airlock halves */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-ink-0 transition-transform duration-[1400ms] ease-[cubic-bezier(.7,0,.2,1)]" style={{ transform: open ? "translateX(-101%)" : "none" }} />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-ink-0 transition-transform duration-[1400ms] ease-[cubic-bezier(.7,0,.2,1)]" style={{ transform: open ? "translateX(101%)" : "none" }} />
      <div className="absolute inset-y-0 left-1/2 w-px bg-[#d8d6ce] transition-opacity duration-500" style={{ opacity: open ? 0.7 : 0 }} />
      <div className="absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-500" style={{ opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto" }}>
        {stage === "log" ? (
          <div className="mono w-full max-w-md text-[11px] tracking-[0.14em]">
            <div className="text-bone text-sm tracking-[0.3em]">ECHOES</div>
            <div className="label mb-5">PLANETARY EXPLORATION SYSTEM</div>
            {LINES.slice(0, n).map(([k, v]) => (
              <div key={k} className="flex text-slate" style={{ animation: "bootLine .3s both" }}>
                <span>{k}</span>
                <span className="mx-2 flex-1 overflow-hidden whitespace-nowrap text-iron">{"." .repeat(60)}</span>
                <span className={v === "CONNECTED" ? "text-ok" : "text-cyan"}>{v}</span>
              </div>
            ))}
            {n > LINES.length && <div className="mt-5 text-bone" style={{ animation: "bootLine .4s both" }}>SYSTEM READY</div>}
          </div>
        ) : (
          <div className="max-w-2xl text-center anim-up" style={{ animationDuration: "1.2s" }}>
            <h1 className="text-[clamp(44px,9vw,104px)] font-light leading-none tracking-[0.2em] text-bone">ECHOES</h1>
            <div className="mono mt-5 text-[clamp(10px,1.6vw,13px)] tracking-[0.34em] text-amber">THE MACHINES WE LEFT BEHIND.</div>
            <p className="mx-auto mt-8 max-w-md text-[15px] font-light leading-relaxed text-ash">
              Explore the worlds they reached.
              <br />
              Inspect the machines they carried.
              <br />
              Follow the science they made possible.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3">
              <button className="ctl ctl-primary px-8 py-3 text-[12px] tracking-[0.28em]" onClick={() => enter()} autoFocus>
                ENTER SIMULATION
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="ctl" onClick={() => enter(() => runDemo())}>
                  PLAY GUIDED DEMO
                </button>
                {lastArt && last && (
                  <button className="ctl" onClick={() => enter(() => goToArtifact(last.artifactId))}>
                    RETURN TO LAST LOCATION · {lastArt.designation}
                  </button>
                )}
              </div>
              {lastArt && last && (
                <div className="label mt-1">
                  LAST LOCATION · {lastArt.destination.toUpperCase()} · {lastArt.designation} · {lastArt.name} · {lastArt.location.region}
                  {last.sol !== undefined ? ` · SOL ${last.sol}` : ""}
                </div>
              )}
              <div className="label mt-6 max-w-sm leading-relaxed text-slate/80">
                Imagery: NASA, USGS. Spacecraft models are reconstructions and are labelled as such. Orbits and terrain relief are visualizations.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
