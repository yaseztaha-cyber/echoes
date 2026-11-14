import type { ReactNode } from "react";
import { SIMULATOR_URL } from "../config";
import type { Img } from "../data/images";
import { imgSrcSet, imgUrl } from "../data/images";

export function PrimaryLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`btn-primary inline-flex min-h-12 items-center justify-center gap-3 border border-lamber bg-lamber px-7 py-3.5 font-mono text-[0.78rem] font-medium uppercase tracking-[0.18em] text-void transition-colors duration-300 hover:text-void ${className}`}
    >
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}

export function GhostLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center border border-ink/30 px-7 py-3.5 font-mono text-[0.78rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-void ${className}`}
    >
      {children}
    </a>
  );
}

/** The one place every "Enter" CTA gets its destination. */
export function EnterLink({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <PrimaryLink href={SIMULATOR_URL} className={className}>
      {children}
    </PrimaryLink>
  );
}

export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`link-u inline-flex items-center gap-2 pb-1 font-mono text-[0.74rem] uppercase tracking-[0.18em] text-lamber ${className}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

export function Photo({
  img,
  className = "",
  focus = "50% 50%",
  sizes = "100vw",
  eager = false,
}: {
  img: Img;
  className?: string;
  focus?: string;
  sizes?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={imgUrl(img)}
      srcSet={imgSrcSet(img)}
      sizes={sizes}
      alt={img.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={className}
      style={{ objectPosition: focus }}
    />
  );
}

export function Credit({ img, className = "" }: { img: Img; className?: string }) {
  return (
    <p className={`font-mono text-[0.66rem] uppercase tracking-[0.14em] text-mute ${className}`}>
      {img.note ? `${img.note} · ` : ""}
      {img.credit} · NASA ID {img.id}
    </p>
  );
}

export function SectionHead({
  index,
  eyebrow,
  lines,
  text,
}: {
  index: string;
  eyebrow: string;
  lines: string[];
  text: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <p className="eyebrow mb-6 flex items-center gap-4">
          <span className="text-lamber">{index}</span>
          <span className="h-px w-10 bg-line" aria-hidden="true" />
          <span>{eyebrow}</span>
        </p>
        <h2 className="display text-[clamp(2.4rem,6.4vw,5.6rem)]">
          {lines.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
      </div>
      <p className="max-w-md text-[1.02rem] leading-relaxed text-mute lg:col-span-4 lg:justify-self-end">{text}</p>
    </div>
  );
}
