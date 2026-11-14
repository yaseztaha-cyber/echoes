import { useEffect, useRef, useState } from "react";
import { MACHINES } from "../data/features";
import { missionHref } from "../lib/router";
import { Reveal } from "./Reveal";
import { Credit, Photo, SectionHead } from "./ui";

export function Machines() {
  const [active, setActive] = useState(0);
  const blocks = useRef<(HTMLElement | null)[]>([]);

  // Scroll-linked (not scroll-jacked): the block crossing the viewport centre drives the sticky image.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    blocks.current.forEach((b) => b && io.observe(b));
    return () => io.disconnect();
  }, []);

  const cur = MACHINES[active];

  return (
    <section className="relative border-t border-line bg-void py-24 sm:py-32" aria-labelledby="machines-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div id="machines-title">
            <SectionHead
              index="03"
              eyebrow="The machines"
              lines={["Built to go", "where we cannot."]}
              text="Rovers, orbiters and deep-space probes are engineered for places that are too far, too cold, too hot or too hostile for people. Each of these was built for one job."
            />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 sm:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* Sticky stage (desktop) */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-[5/4] max-h-[calc(100svh-10rem)] w-full overflow-hidden bg-black">
                {MACHINES.map((m, i) => (
                  <Photo
                    key={m.name}
                    img={m.img}
                    focus={m.focus}
                    sizes="58vw"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div aria-hidden="true" className="absolute inset-0 border border-ink/10" />
                <p className="eyebrow absolute left-5 top-5 text-ink/80">
                  {String(active + 1).padStart(2, "0")} / {String(MACHINES.length).padStart(2, "0")}
                </p>
              </div>
              <Credit img={cur.img} className="mt-3" />
            </div>
          </div>

          {/* Text blocks */}
          <ol className="lg:col-span-5">
            {MACHINES.map((m, i) => (
              <li
                key={m.name}
                data-i={i}
                ref={(el) => {
                  blocks.current[i] = el;
                }}
                className="flex flex-col justify-center border-t border-line py-12 lg:min-h-[78svh] lg:py-0 first:lg:border-t-0"
              >
                <div className="relative mb-8 aspect-[4/3] overflow-hidden bg-black lg:hidden">
                  <Photo img={m.img} focus={m.focus} sizes="100vw" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <p className="eyebrow mb-4 flex items-center gap-3">
                  <span className="text-lamber">{String(i + 1).padStart(2, "0")}</span>
                  {m.kind}
                </p>
                <h3 className="display mb-8 text-[clamp(2.6rem,5vw,4.4rem)]">{m.name}</h3>
                <dl className="space-y-5 text-[0.98rem] leading-relaxed">
                  <div>
                    <dt className="eyebrow mb-1.5">Mission</dt>
                    <dd>
                      <a href={missionHref(m.mission)} className="link-u text-ink">
                        {m.missionName}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-1.5">Destination</dt>
                    <dd className="text-ink">{m.destination}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-1.5">Function</dt>
                    <dd className="text-ink/85">{m.fn}</dd>
                  </div>
                  <div className="border-l border-lamber pl-5">
                    <dt className="eyebrow mb-1.5 text-lamber">Engineering detail</dt>
                    <dd className="text-ink">{m.detail}</dd>
                  </div>
                </dl>
                <Credit img={m.img} className="mt-6 lg:hidden" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
