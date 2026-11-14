import { DISCOVERIES } from "../data/features";
import { missionHref, worldHref } from "../lib/router";
import { worldById } from "../data/worlds";
import { Reveal } from "./Reveal";
import { Credit, Photo, SectionHead, TextLink } from "./ui";

export function Discoveries() {
  return (
    <section id="discoveries" className="relative border-t border-line bg-void py-24 sm:py-32" aria-labelledby="disc-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div id="disc-title">
            <SectionHead
              index="05"
              eyebrow="Discoveries"
              lines={["The universe,", "understood a little better."]}
              text="These are five findings that changed the picture scientists had of another world. Open a story to see which spacecraft made it possible and where the evidence came from."
            />
          </div>
        </Reveal>

        <ol className="mt-16 space-y-20 sm:mt-24 sm:space-y-28">
          {DISCOVERIES.map((d, i) => {
            const flip = i % 2 === 1;
            const wide = i % 3 !== 1;
            const world = worldById(d.world)!;
            return (
              <li key={d.title}>
                <Reveal className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
                  <div className={`${wide ? "lg:col-span-7" : "lg:col-span-6"} ${flip ? "lg:order-2" : ""}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[16/10]">
                      <Photo
                        img={d.img}
                        focus={d.focus}
                        sizes="(min-width: 1024px) 55vw, 100vw"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <Credit img={d.img} className="mt-3" />
                  </div>
                  <div className={`${wide ? "lg:col-span-5" : "lg:col-span-6"} ${flip ? "lg:order-1" : ""} ${!wide ? "lg:px-10" : ""}`}>
                    <p className="eyebrow mb-5 flex items-center gap-3">
                      <span className="text-lamber">{String(i + 1).padStart(2, "0")}</span>
                      <span className="h-px w-8 bg-line" aria-hidden="true" />
                      <span>{d.missionName}</span>
                    </p>
                    <h3 className="display mb-6 text-[clamp(2.2rem,4.2vw,3.8rem)]">{d.title}</h3>
                    <p className="mb-6 text-[1.05rem] leading-relaxed text-ink">{d.what}</p>
                    <p className="eyebrow mb-2">Why this matters</p>
                    <p className="mb-8 leading-relaxed text-ink/75">{d.why}</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <TextLink href={missionHref(d.mission)}>Mission: {d.missionName}</TextLink>
                      <TextLink href={worldHref(d.world)}>Destination: {world.name}</TextLink>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
