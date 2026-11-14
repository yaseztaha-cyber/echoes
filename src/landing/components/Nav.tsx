import { useEffect, useRef, useState } from "react";
import { SIMULATOR_URL } from "../config";

export const NAV = [
  { id: "worlds", label: "Worlds" },
  { id: "missions", label: "Missions" },
  { id: "experience", label: "The Experience" },
  { id: "discoveries", label: "Discoveries" },
  { id: "about", label: "About" },
];

export function Nav({ solid: forceSolid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (forceSolid) return;
    let ticking = false;
    const compute = () => {
      ticking = false;
      setScrolled(window.scrollY > 24);
      const line = window.innerHeight * 0.35;
      let cur = "";
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) cur = n.id;
      }
      setActive(cur);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [forceSolid]);

  // Mobile menu: lock scroll, close on Escape and when the viewport grows
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const solid = forceSolid || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
        solid ? "border-line bg-void/95" : "border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          onClick={() => setOpen(false)}
          className="font-display text-[1.7rem] uppercase leading-none tracking-[0.06em] text-ink"
          aria-label="ECHOES — back to top"
        >
          Echoes
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                aria-current={active === n.id ? "location" : undefined}
                className={`relative py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:text-ink ${
                  active === n.id ? "text-ink" : "text-mute"
                }`}
              >
                {n.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-lamber transition-transform duration-500 ${
                    active === n.id ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={SIMULATOR_URL}
            className="hidden min-h-9 items-center border border-lamber/70 px-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-lamber transition-colors hover:bg-lamber hover:text-void sm:inline-flex"
          >
            Enter Simulator
          </a>
          <button
            ref={btnRef}
            type="button"
            className="relative flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span
              aria-hidden="true"
              className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`}
            />
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-14 flex flex-col justify-between overflow-y-auto bg-void px-5 pb-8 pt-8 lg:hidden"
        >
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id} className="border-b border-line">
                <a
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-16 items-baseline gap-4 py-4 font-display text-4xl uppercase text-ink"
                >
                  <span className="font-mono text-[0.7rem] tracking-[0.2em] text-lamber">0{i + 1}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={SIMULATOR_URL}
            onClick={() => setOpen(false)}
            className="mt-10 flex min-h-14 items-center justify-center bg-lamber px-6 font-mono text-[0.78rem] font-medium uppercase tracking-[0.2em] text-void"
          >
            Enter Simulator →
          </a>
        </div>
      )}
    </header>
  );
}
