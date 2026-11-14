import { IMG } from "../data/images";
import { Reveal } from "./Reveal";
import { EnterLink, GhostLink, Photo } from "./ui";

export function FinalCta() {
  const img = IMG.plutoHaze;
  return (
    <section className="relative isolate overflow-hidden border-t border-line bg-void" aria-labelledby="final-title">
      <Photo
        img={img}
        focus="50% 70%"
        sizes="100vw"
        className="absolute inset-x-0 bottom-0 -z-20 h-[70%] w-full object-cover opacity-80 sm:h-[78%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#050608_8%,rgba(5,6,8,0.55)_48%,rgba(5,6,8,0.25)_100%)]"
      />
      <div className="mx-auto flex min-h-[88svh] max-w-[1500px] flex-col justify-between px-5 pb-8 pt-28 sm:px-8 sm:pt-36">
        <Reveal>
          <p className="eyebrow mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-lamber" aria-hidden="true" />
            Begin
          </p>
          <h2 id="final-title" className="display text-[clamp(3rem,9vw,8.4rem)]">
            <span className="block">The next journey</span>
            <span className="block">
              starts with <span className="text-lamber">you.</span>
            </span>
          </h2>
          <p className="mt-8 max-w-xl text-[1.05rem] leading-relaxed text-ink/85 sm:text-lg">
            Step beyond the familiar. Explore the worlds, machines, and missions that continue to shape our understanding
            of the universe.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <EnterLink>Enter the Universe</EnterLink>
            <GhostLink href="#missions">Explore the Missions</GhostLink>
          </div>
        </Reveal>
        <p className="mt-24 text-right font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.14em] text-mute">
          Pluto's mountains and hazes at sunset · New Horizons, 2015
          <br />
          NASA/JHUAPL/SwRI · {img.id}
        </p>
      </div>
    </section>
  );
}
