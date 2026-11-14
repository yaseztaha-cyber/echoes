import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { Credit, EnterLink, Photo, TextLink } from "../components/ui";
import { MISSIONS, missionById } from "../data/missions";
import { WORLDS, worldById } from "../data/worlds";
import { missionHref, worldHref } from "../lib/router";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav solid />
      <main className="pt-14">{children}</main>
      <Footer />
    </>
  );
}

function NotFound({ what }: { what: string }) {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-5 py-40 sm:px-8">
        <p className="eyebrow mb-4">Not found</p>
        <h1 className="display mb-6 text-5xl">That {what} isn't in the archive.</h1>
        <TextLink href="#/">Back to ECHOES</TextLink>
      </section>
    </Shell>
  );
}

export function MissionPage({ id }: { id: string }) {
  const m = missionById(id);
  if (!m) return <NotFound what="mission" />;
  const i = MISSIONS.findIndex((x) => x.id === id);
  const prev = MISSIONS[(i - 1 + MISSIONS.length) % MISSIONS.length];
  const next = MISSIONS[(i + 1) % MISSIONS.length];

  return (
    <Shell>
      <article>
        <div className="mx-auto max-w-[1500px] px-5 pt-8 sm:px-8">
          <TextLink href="#missions" className="mb-8 [&>span]:hidden">
            ← All missions
          </TextLink>
          <p className="eyebrow mb-5">
            Mission dossier · {m.year} · {m.agency}
          </p>
          <h1 className="display text-[clamp(3rem,9vw,8rem)]">{m.name}</h1>
        </div>

        <div className="mx-auto mt-10 max-w-[1500px] px-5 sm:px-8">
          <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[21/9]">
            <Photo img={m.img} focus={m.focus} eager sizes="100vw" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <Credit img={m.img} className="mt-3" />
        </div>

        <div className="mx-auto mt-16 grid max-w-[1500px] gap-14 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <dl className="grid gap-6 font-mono text-[0.74rem] uppercase tracking-[0.12em]">
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
            <h2 className="eyebrow mb-3 mt-12">Objective</h2>
            <p className="leading-relaxed text-ink/85">{m.objective}</p>
            <h2 className="eyebrow mb-3 mt-8 text-lamber">What it found</h2>
            <p className="leading-relaxed text-ink">{m.discovery}</p>
            <h2 className="eyebrow mb-3 mt-10">Worlds</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {m.worlds.map((w) => (
                <li key={w}>
                  <TextLink href={worldHref(w)}>{worldById(w)?.name}</TextLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <h2 className="eyebrow mb-8">The journey · {m.stages.length} stages</h2>
            <ol className="relative border-l border-line">
              {m.stages.map((s, n) => (
                <li key={s.label} className="relative pb-12 pl-8 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[7px] top-1 h-[13px] w-[13px] border border-lamber bg-void" />
                  <p className="font-mono text-[0.7rem] tracking-[0.16em] text-lamber">
                    {String(n + 1).padStart(2, "0")} · {s.when}
                  </p>
                  <h3 className="display mb-3 mt-2 text-3xl">{s.label}</h3>
                  <p className="max-w-xl leading-relaxed text-ink/80">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <nav
          aria-label="Other missions"
          className="mx-auto mt-24 grid max-w-[1500px] gap-px bg-line px-0 sm:grid-cols-2"
        >
          {[
            { m: prev, dir: "Previous" },
            { m: next, dir: "Next" },
          ].map(({ m: x, dir }) => (
            <a key={dir} href={missionHref(x.id)} className="group block bg-void px-5 py-10 transition-colors hover:bg-char sm:px-8">
              <p className="eyebrow mb-3">{dir} mission</p>
              <p className="display text-4xl transition-colors group-hover:text-lamber">{x.name}</p>
            </a>
          ))}
        </nav>

        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8">
          <EnterLink>Enter Echoes</EnterLink>
        </div>
      </article>
    </Shell>
  );
}

export function WorldPage({ id }: { id: string }) {
  const w = worldById(id);
  if (!w) return <NotFound what="world" />;
  const i = WORLDS.findIndex((x) => x.id === id);
  const next = WORLDS[(i + 1) % WORLDS.length];

  return (
    <Shell>
      <article>
        <div className="mx-auto max-w-[1500px] px-5 pt-8 sm:px-8">
          <TextLink href="#worlds" className="mb-8 [&>span]:hidden">
            ← All destinations
          </TextLink>
          <p className="eyebrow mb-5">
            Destination · {w.kind}
          </p>
          <h1 className="display text-[clamp(3rem,9vw,8rem)]">{w.name}</h1>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1500px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[16/11]">
              <Photo img={w.img} focus={w.focus} eager sizes="(min-width: 1024px) 58vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <Credit img={w.img} className="mt-3" />
          </div>
          <div className="lg:col-span-5">
            <p className="text-lg leading-relaxed text-ink">{w.blurb}</p>
            <p className="mt-6 leading-relaxed text-ink/75">{w.detail}</p>
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 font-mono text-[0.74rem] uppercase tracking-[0.12em]">
              {w.facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-mute">{f.label}</dt>
                  <dd className="mt-1.5 text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <h2 className="eyebrow mb-4 mt-10">Missions that studied it</h2>
            {w.missions.length ? (
              <ul className="space-y-3">
                {w.missions.map((mid) => (
                  <li key={mid}>
                    <TextLink href={missionHref(mid)}>{missionById(mid)?.name}</TextLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-mute">No mission from this selection is dedicated to this world.</p>
            )}
          </div>
        </div>

        <nav aria-label="Next destination" className="mx-auto mt-24 max-w-[1500px]">
          <a href={worldHref(next.id)} className="group block border-y border-line px-5 py-10 transition-colors hover:bg-char sm:px-8">
            <p className="eyebrow mb-3">Next destination</p>
            <p className="display text-4xl transition-colors group-hover:text-lamber">{next.name}</p>
          </a>
        </nav>

        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8">
          <EnterLink>Enter Echoes</EnterLink>
        </div>
      </article>
    </Shell>
  );
}
