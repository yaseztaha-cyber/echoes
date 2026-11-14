import { useState } from "react";

export function Landing({ onEnter }: { onEnter: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto text-bone">
      {/* Hero — the live solar system renders behind this panel */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 42%, rgba(5,7,10,0.72) 0%, rgba(5,7,10,0.28) 45%, rgba(5,7,10,0.06) 70%), linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(5,7,10,0) 28%, rgba(5,7,10,0) 62%, rgba(5,7,10,0.92) 92%, rgba(5,7,10,1) 100%)",
          }}
        />
        <div className="relative max-w-4xl">
          <div className="mono mb-6 text-[10px] tracking-[0.35em] text-amber/70">ECHOES · SPACE EXPLORATION SIMULATOR</div>
          <h1 className="mono text-[44px] leading-[1.05] tracking-[0.04em] text-bone md:text-[72px]">
            Every Journey Leaves an Echo.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ash md:text-[17px]">
            Explore the worlds, machines, journeys, and discoveries that have expanded humanity's reach beyond Earth.
            Real missions. Real destinations. One continuous experience.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="ctl ctl-primary px-6 py-3 text-[11px] tracking-[0.18em] transition-[letter-spacing,color] duration-300"
              style={hover ? { letterSpacing: "0.24em", color: "#f0dcb4" } : undefined}
              onClick={onEnter}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              ENTER ECHOES
            </button>
            <button className="ctl px-6 py-3 text-[11px] tracking-[0.18em]" onClick={onEnter}>
              EXPLORE MISSIONS
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[9px] tracking-[0.2em] text-slate/60">
          SCROLL TO DISCOVER
        </div>
      </section>

      {/* The editorial body sits on an opaque surface so the type stays crisp
          while the hero above it stays live. */}
      <div className="bg-ink-0">
        {/* Section: Solar System */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="label mb-3 text-amber">THE SOLAR SYSTEM AWAITS</div>
          <h2 className="mono text-[26px] tracking-[0.06em] text-bone md:text-[34px]">A real-time, explorable solar system.</h2>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-ash">
            Navigate planets and moons, descend to mission sites, and inspect the hardware left behind. Distances and
            scales are presented for clarity; compressed values are labelled in the interface.
          </p>
        </section>

        {/* Section: Machines */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="label mb-3 text-amber">THE MACHINES THAT EXPLORE</div>
          <h2 className="mono text-[26px] tracking-[0.06em] text-bone md:text-[34px]">Rovers, landers, orbiters, and deep-space probes.</h2>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-ash">
            Every spacecraft is tied to its real mission, instruments, and scientific questions. Reconstructed models
            are clearly labelled as such.
          </p>
        </section>

        {/* Section: Missions */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="label mb-3 text-amber">EVERY MISSION HAS A STORY</div>
          <h2 className="mono text-[26px] tracking-[0.06em] text-bone md:text-[34px]">Purpose. Launch. Journey. Operations. Discoveries. Legacy.</h2>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-ash">
            Step through verified timelines and mission chapters, from development to the present operational status
            of each spacecraft.
          </p>
        </section>

        {/* Section: Enter */}
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
          <h2 className="mono text-[30px] tracking-[0.06em] text-bone md:text-[44px]">Enter ECHOES</h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ash">
            Begin exploring the solar system now.
          </p>
          <button className="ctl ctl-primary mt-8 px-8 py-3 text-[11px] tracking-[0.18em]" onClick={onEnter}>
            ENTER ECHOES
          </button>
          <div className="mt-12 mono text-[9px] tracking-[0.2em] text-slate/50">
            DATA SOURCES INCLUDE NASA, JPL, AND PRIMARY MISSION ARCHIVES. AI-ASSISTED CONTENT IS DISCLOSED IN THE
            PROJECT DOCUMENTATION.
          </div>
        </section>
      </div>
    </div>
  );
}
