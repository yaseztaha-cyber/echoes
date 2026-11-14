import { useState } from "react";
import { WORLDS } from "../data/worlds";
import { worldHref } from "../lib/router";
import { Reveal } from "./Reveal";
import { Credit, Photo, SectionHead, TextLink } from "./ui";

export function Worlds() {
  const [active, setActive] = useState("mars");
  const current = WORLDS.find((w) => w.id === active)!;

  return (
    <section id="worlds" className="relative bg-void py-24 sm:py-32" aria-labelledby="worlds-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div id="worlds-title">
            <SectionHead
              index="01"
              eyebrow="Destinations"
              lines={["Not just distant worlds.", "Places we have reached."]}
              text="Every world holds a different story. Every spacecraft carries a different purpose. Explore the environments that our missions have observed, visited, and studied."
            />
          </div>
        </Reveal>

        <Reveal className="mt-14 sm:mt-20" delay={120}>
          <ul className="flex h-[calc(9*52px+420px)] flex-col md:h-[clamp(540px,76vh,720px)] md:flex-row" aria-label="Destinations">
            {WORLDS.map((w, i) => {
              const on = w.id === active;
              return (
                <li
                  key={w.id}
                  data-active={on}
                  className="group relative basis-[52px] grow-0 overflow-hidden border-t border-line bg-black transition-[flex-grow,flex-basis] duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] first:border-t-0 data-[active=true]:basis-[420px] md:basis-0 md:grow-[1] md:border-l md:border-t-0 md:first:border-l-0 md:data-[active=true]:grow-[11] md:data-[active=true]:basis-0"
                >
                  <Photo
                    img={w.img}
                    focus={w.focus}
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className={`absolute left-1/2 top-1/2 h-[420px] w-[100vw] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-[opacity,filter] duration-700 md:h-full md:w-[60vw] ${
                      on ? "opacity-100" : "opacity-45 grayscale-[35%] group-hover:opacity-70"
                    }`}
                  />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-700 ${
                      on ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* Panel selector: the whole strip is the button while collapsed */}
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`world-${w.id}`}
                    tabIndex={on ? -1 : 0}
                    aria-label={`Show ${w.name}`}
                    onClick={() => setActive(w.id)}
                    onFocus={() => setActive(w.id)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setActive(w.id)}
                    className={`absolute inset-x-0 top-0 flex items-center gap-3 px-4 text-left md:inset-y-0 md:items-end md:justify-center md:px-0 md:pb-6 ${
                      on ? "pointer-events-none h-0 opacity-0 md:h-auto" : "h-[52px] md:h-auto"
                    }`}
                  >
                    <span className="font-mono text-[0.66rem] tracking-[0.2em] text-lamber">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-mono text-[0.74rem] uppercase tracking-[0.22em] text-ink md:[writing-mode:vertical-rl] md:rotate-180">
                      {w.name}
                    </span>
                  </button>

                  {on && (
                    <div
                      id={`world-${w.id}`}
                      className="fade-up absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8 md:max-w-[44rem]"
                    >
                      <p className="eyebrow flex items-center gap-3">
                        <span className="text-lamber">{String(i + 1).padStart(2, "0")}</span>
                        <span>{w.kind}</span>
                      </p>
                      <h3 className="display text-[clamp(2.6rem,5.5vw,5rem)]">{w.name}</h3>
                      <p className="max-w-[34rem] text-[0.98rem] leading-relaxed text-ink/85">{w.blurb}</p>
                      <dl className="flex gap-8 font-mono text-[0.68rem] uppercase tracking-[0.14em]">
                        {w.facts.map((f) => (
                          <div key={f.label}>
                            <dt className="text-mute">{f.label}</dt>
                            <dd className="mt-1 text-ink">{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <TextLink href={worldHref(w.id)} className="self-start">
                        Read the {w.name === "The Moon" ? "Moon" : w.name} dossier
                      </TextLink>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Credit img={current.img} className="mt-4" />
        </Reveal>
      </div>
    </section>
  );
}
