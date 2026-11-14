import { useEffect, useRef } from "react";
import { IMG, imgSrcSet, imgUrl } from "../data/images";
import { usePrefersReducedMotion } from "../lib/hooks";
import { Starfield } from "./Starfield";
import { EnterLink, GhostLink } from "./ui";

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const planetRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Scroll parallax: two layers at different speeds, written straight to the DOM (no React renders).
  useEffect(() => {
    if (reduced) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.min(window.scrollY, window.innerHeight * 1.2);
      if (planetRef.current) planetRef.current.style.transform = `translate3d(0, ${y * 0.16}px, 0)`;
      if (starsRef.current) starsRef.current.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  const img = IMG.saturnShadow;

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative isolate flex h-[100svh] min-h-[640px] flex-col justify-end overflow-hidden bg-void"
    >
      {/* Stars */}
      <div ref={starsRef} className="absolute inset-x-0 -top-10 bottom-0 -z-30 will-change-transform">
        <Starfield className="h-full w-full" />
      </div>

      {/* Planet image: Cassini's view of Saturn from within its shadow */}
      <div
        ref={planetRef}
        className="fade-in absolute inset-x-0 -top-[12%] -z-20 h-[66%] will-change-transform lg:inset-y-0 lg:left-[32%] lg:right-0 lg:top-0 lg:h-full"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 22%, #000 100%)",
          maskImage: "linear-gradient(to right, transparent 0%, #000 22%, #000 100%)",
        }}
      >
        <img
          src={imgUrl(img)}
          srcSet={imgSrcSet(img)}
          sizes="(min-width: 1024px) 76vw, 100vw"
          alt={img.alt}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover opacity-90"
          style={{ objectPosition: "50% 45%" }}
        />
      </div>

      {/* Scrims: keep text legible and melt the image into the page */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#050608_6%,rgba(5,6,8,0.78)_34%,rgba(5,6,8,0)_66%)] lg:bg-[linear-gradient(to_top,#050608_2%,rgba(5,6,8,0.55)_30%,rgba(5,6,8,0)_62%),linear-gradient(to_right,rgba(5,6,8,0.7)_0%,rgba(5,6,8,0)_55%)]"
      />

      <div className="mx-auto w-full max-w-[1500px] px-5 pb-24 sm:px-8 sm:pb-28">
        <p className="eyebrow fade-up mb-6 text-ink/80 [animation-delay:150ms] sm:mb-8">
          <span className="mr-3 inline-block h-px w-8 translate-y-[-3px] bg-lamber align-middle" aria-hidden="true" />
          A closer look at the places we've explored
        </p>

        <h1 className="display text-[clamp(3.3rem,9.2vw,9rem)]" aria-label="Every journey leaves a trace.">
          <span className="line-mask" aria-hidden="true">
            <span className="line-rise [animation-delay:250ms]">Every journey</span>
          </span>
          <span className="line-mask" aria-hidden="true">
            <span className="line-rise [animation-delay:380ms]">
              leaves a <span className="text-lamber">trace.</span>
            </span>
          </span>
        </h1>

        <p className="fade-up mt-7 max-w-[34rem] text-[1.02rem] leading-relaxed text-ink/80 [animation-delay:700ms] sm:mt-9 sm:text-lg">
          From the first footprints on the Moon to probes still sending signals from beyond the planets, follow the missions and machines that changed what we know about space.
        </p>

        <div className="fade-up mt-8 flex flex-col gap-3 [animation-delay:850ms] sm:mt-10 sm:flex-row sm:gap-4">
          <EnterLink>Enter ECHOES</EnterLink>
          <GhostLink href="#missions">Browse the missions</GhostLink>
        </div>
      </div>

      {/* Bottom rail: scroll cue + image identification */}
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1500px] items-end justify-between px-5 pb-6 sm:px-8">
        <a href="#worlds" className="group flex items-center gap-4 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-mute hover:text-ink">
          <span className="relative h-9 w-px overflow-hidden bg-line" aria-hidden="true">
            <span className="cue-line absolute inset-0 bg-lamber" />
          </span>
          Keep exploring
        </a>
        <p className="hidden max-w-xs text-right font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.14em] text-mute sm:block">
          Saturn from within its own shadow · Cassini, 2006
          <br />
          NASA/JPL/Space Science Institute · {img.id}
        </p>
      </div>
    </section>
  );
}
