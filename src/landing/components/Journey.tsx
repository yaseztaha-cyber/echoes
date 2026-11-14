import { useState } from "react";
import { MISSIONS } from "../data/missions";
import { missionHref } from "../lib/router";
import { Reveal } from "./Reveal";
import { SectionHead, TextLink } from "./ui";

export function Journey() {
  const [mi, setMi] = useState(0);
  const [si, setSi] = useState(0);
  const m = MISSIONS[mi];
  const n = m.stages.length;
  const stage = m.stages[si];

  const pick = (i: number) => {
    setMi(i);
    setSi(0);
  };

  return (
    <section className="relative border-t border-line bg-char py-24 sm:py-32" aria-labelledby="journey-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div id="journey-title">
            <SectionHead
              index="04"
              eyebrow="Follow the journey"
              lines={["A mission is more", "than a destination."]}
              text="A mission is a chain of decisions, long waits, close encounters and, sometimes, a final goodbye. Pick one below and follow what happened, in order."
            />
          </div>
        </Reveal>

        <Reveal className="mt-14 sm:mt-20" delay={100}>
          <div role="group" aria-label="Choose a mission" className="rail -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {MISSIONS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={i === mi}
                onClick={() => pick(i)}
                className={`min-h-11 shrink-0 border px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
                  i === mi ? "border-lamber bg-lamber text-void" : "border-line text-mute hover:border-mute hover:text-ink"
                }`}
              >
                {x.short}
              </button>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h3 className="display text-[clamp(1.8rem,3.4vw,2.8rem)]">{m.name}</h3>
            <p className="eyebrow">
              {m.type} · {n} stages
            </p>
          </div>

          {/* Timeline */}
          <div className="rail -mx-5 mt-10 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            <ol
              key={m.id}
              className="relative grid min-w-[min(100%,calc(var(--n)*13rem))] gap-0"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, "--n": n } as React.CSSProperties}
            >
              <span aria-hidden="true" className="absolute left-0 right-0 top-[7px] h-px bg-line" />
              <span
                aria-hidden="true"
                className="absolute left-0 top-[7px] h-px bg-lamber transition-[width] duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)]"
                style={{ width: `${((si + 0.0) / n) * 100}%` }}
              />
              {m.stages.map((s, i) => {
                const reached = i <= si;
                return (
                  <li key={s.label} className="relative pr-4">
                    <button
                      type="button"
                      aria-current={i === si ? "step" : undefined}
                      onClick={() => setSi(i)}
                      className="group block w-full min-h-11 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-[15px] w-[15px] border transition-colors duration-500 ${
                          i === si
                            ? "border-lamber bg-lamber"
                            : reached
                              ? "border-lamber bg-void"
                              : "border-mute bg-void group-hover:border-ink"
                        }`}
                      />
                      <span className={`mt-5 block font-mono text-[0.66rem] tracking-[0.16em] ${i === si ? "text-lamber" : "text-mute"}`}>
                        {String(i + 1).padStart(2, "0")} · {s.when}
                      </span>
                      <span
                        className={`mt-2 block text-[0.95rem] leading-snug transition-colors ${
                          i === si ? "text-ink" : "text-mute group-hover:text-ink"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Selected stage */}
          <div className="mt-12 grid gap-8 border-t border-line pt-10 lg:grid-cols-12">
            <p className="display text-[clamp(3.5rem,8vw,7rem)] text-lamber/90 lg:col-span-3" aria-hidden="true">
              {String(si + 1).padStart(2, "0")}
              <span className="text-mute/60">/{String(n).padStart(2, "0")}</span>
            </p>
            <div key={`${m.id}-${si}`} className="fade-up lg:col-span-6" aria-live="polite">
              <p className="eyebrow mb-3">{stage.when}</p>
              <h4 className="display mb-4 text-[clamp(1.8rem,3vw,2.6rem)]">{stage.label}</h4>
              <p className="max-w-xl text-[1.05rem] leading-relaxed text-ink/85">{stage.text}</p>
            </div>
            <div className="flex items-end lg:col-span-3 lg:justify-end">
              <TextLink href={missionHref(m.id)}>See the full mission</TextLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
