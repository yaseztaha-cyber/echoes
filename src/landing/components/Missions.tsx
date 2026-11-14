import { useState, type KeyboardEvent } from "react";
import { MISSIONS } from "../data/missions";
import { missionHref } from "../lib/router";
import { Reveal } from "./Reveal";
import { Credit, Photo, SectionHead, TextLink } from "./ui";

export function Missions() {
  const [idx, setIdx] = useState(0);
  // Only mount images the visitor has actually reached — keeps first load light.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const m = MISSIONS[idx];

  const select = (i: number) => {
    setIdx(i);
    setSeen((s) => (s.has(i) ? s : new Set(s).add(i)));
  };

  const onKey = (e: KeyboardEvent) => {
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (idx + 1) % MISSIONS.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (idx - 1 + MISSIONS.length) % MISSIONS.length
          : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    document.getElementById(`mission-tab-${MISSIONS[next].id}`)?.focus();
  };

  return (
    <section id="missions" className="relative border-t border-line bg-char py-24 sm:py-32" aria-labelledby="missions-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div id="missions-title">
            <SectionHead
              index="02"
              eyebrow="Missions"
              lines={["Humanity,", "reaching further."]}
              text="Some machines landed. Some orbited. Others passed through distant worlds or continued into interstellar space. Each mission left behind a different kind of evidence."
            />
          </div>
        </Reveal>

        <Reveal className="mt-14 grid gap-8 sm:mt-20 lg:grid-cols-12 lg:gap-14" delay={100}>
          {/* Index: a vertical timeline on desktop, a swipeable rail on small screens */}
          <div
            role="tablist"
            aria-label="Missions"
            aria-orientation="vertical"
            onKeyDown={onKey}
            className="rail -mx-5 flex gap-2 overflow-x-auto px-5 lg:order-1 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-line lg:px-0"
          >
            {MISSIONS.map((x, i) => {
              const on = i === idx;
              return (
                <button
                  key={x.id}
                  id={`mission-tab-${x.id}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls="mission-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i)}
                  className={`group relative flex min-h-12 shrink-0 items-baseline gap-4 border px-4 py-3 text-left transition-colors lg:border-0 lg:py-[1.05rem] lg:pl-8 ${
                    on ? "border-lamber/60 text-ink" : "border-line text-mute hover:text-ink"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[3px] top-1/2 hidden h-[5px] w-[5px] -translate-y-1/2 rounded-full transition-all lg:block ${
                      on ? "scale-[1.8] bg-lamber" : "bg-line group-hover:bg-mute"
                    }`}
                  />
                  <span className={`font-mono text-[0.7rem] tracking-[0.16em] ${on ? "text-lamber" : ""}`}>{x.year}</span>
                  <span className="display whitespace-nowrap text-[1.45rem] leading-none sm:text-[1.7rem] lg:text-[2.1rem]">
                    {x.short}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stage */}
          <div id="mission-panel" role="tabpanel" aria-labelledby={`mission-tab-${m.id}`} className="lg:order-2 lg:col-span-8">
            <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[16/10]">
              {MISSIONS.map((x, i) =>
                seen.has(i) ? (
                  <Photo
                    key={x.id}
                    img={x.img}
                    focus={x.focus}
                    sizes="(min-width: 1024px) 62vw, 100vw"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      i === idx ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ) : null,
              )}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                <h3 key={m.id} className="display fade-up text-[clamp(2rem,4.4vw,3.8rem)]">
                  {m.name}
                </h3>
                <span className="eyebrow hidden text-ink/70 sm:block">
                  {String(idx + 1).padStart(2, "0")} / {String(MISSIONS.length).padStart(2, "0")}
                </span>
              </div>
            </div>
            <Credit img={m.img} className="mt-3" />

            <div key={m.id} className="fade-up mt-8 grid gap-8 md:grid-cols-12">
              <dl className="grid grid-cols-1 gap-5 font-mono text-[0.72rem] uppercase tracking-[0.12em] md:col-span-5">
                <div>
                  <dt className="text-mute">Destination</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink">{m.destination}</dd>
                </div>
                <div>
                  <dt className="text-mute">Mission type</dt>
                  <dd className="mt-1.5 text-ink">{m.type}</dd>
                </div>
                <div>
                  <dt className="text-mute">Status</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink">{m.status}</dd>
                </div>
              </dl>
              <div className="md:col-span-7">
                <p className="eyebrow mb-2">Objective</p>
                <p className="mb-6 leading-relaxed text-ink/85">{m.objective}</p>
                <p className="eyebrow mb-2 text-lamber">What it found</p>
                <p className="mb-8 leading-relaxed text-ink">{m.discovery}</p>
                <TextLink href={missionHref(m.id)}>Explore mission</TextLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
