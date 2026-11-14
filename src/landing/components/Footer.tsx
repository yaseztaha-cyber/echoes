import { GITHUB_URL } from "../config";
import { NAV } from "./Nav";

const SOURCES = [
  { label: "NASA Image and Video Library", href: "https://images.nasa.gov/" },
  { label: "NASA Solar System Exploration", href: "https://science.nasa.gov/solar-system/" },
  { label: "JPL Photojournal", href: "https://photojournal.jpl.nasa.gov/" },
  { label: "NASA media usage guidelines", href: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
];

export function Footer() {
  return (
    <footer id="about" className="border-t border-line bg-void">
      <div className="mx-auto grid max-w-[1500px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <p className="display text-6xl sm:text-7xl">Echoes</p>
          <p className="mt-3 font-display text-2xl italic text-lamber">Every Journey Leaves a Trace.</p>
          <h2 className="eyebrow mb-3 mt-12">About the project</h2>
          <p className="max-w-md leading-relaxed text-ink/80">
            ECHOES is an interactive space exploration experience built around real missions, spacecraft and worlds. The
            missions, dates and discoveries on this page are drawn from publicly available NASA material.
          </p>
          <p className="mt-6 max-w-md border-l border-lamber pl-4 text-[0.92rem] leading-relaxed text-ink">
            An independent educational space exploration experience using publicly available scientific information and
            mission resources.
          </p>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-7">
          <h2 className="eyebrow mb-5">Explore</h2>
          <ul className="space-y-3">
            {NAV.filter((n) => n.id !== "about").map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="link-u text-ink">
                  {n.label}
                </a>
              </li>
            ))}
            {GITHUB_URL && (
              <li>
                <a href={GITHUB_URL} className="link-u text-ink" target="_blank" rel="noopener noreferrer">
                  GitHub repository
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="eyebrow mb-5">Sources</h2>
          <ul className="space-y-3">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} className="link-u text-ink" target="_blank" rel="noopener noreferrer">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-8 lg:col-span-12">
          <p className="max-w-4xl text-[0.82rem] leading-relaxed text-mute">
            Imagery is credited on each image and was obtained from the NASA Image and Video Library; credit lines name the
            originating NASA centre or mission team, and the NASA ID of every image is shown. NASA material is generally
            not subject to copyright in the United States, but some images carry other credits. ECHOES is not an official
            NASA product, is not affiliated with or endorsed by NASA, ESA, JPL or any mission team, and does not use the
            NASA insignia or logotype.
          </p>
          <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-mute">
            © {new Date().getFullYear()} ECHOES project · Educational, non-commercial
          </p>
        </div>
      </div>
    </footer>
  );
}
