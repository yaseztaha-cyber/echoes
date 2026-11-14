# ECHOES

**Every Journey Leaves a Trace.**

ECHOES is a browser-based 3D experience for exploring the places spacecraft have visited and the machines that helped us study them. Move through a navigable solar system, descend to selected lunar and Martian sites, inspect spacecraft representations, and open mission records with timelines, discoveries, and source links.

[![ECHOES — solar system](docs/images/hero-solar-system.png)](docs/images/hero-solar-system.png)

## Why we made it

A mission can be reduced to a name, a date, and a photograph. We wanted to bring the spacecraft, the place it explored, and the science it helped produce into the same experience. ECHOES is our attempt to make those connections easier to explore, especially for students who are curious about space.

## What you can explore

- **The solar system** — move between planetary bodies in a navigable 3D scene. Distances and body sizes are visually compressed where needed for navigation.
- **Ten mission vehicles or spacecraft representations** — Spirit, Opportunity, Sojourner, InSight, Apollo 12, Apollo 14, Apollo 15, Apollo 16, Apollo 17, and Voyager 1.
- **Selected lunar and Martian sites** — terrain informed by MOLA and LOLA elevation data, alongside mission-specific scene assets.
- **Mission records** — objectives, timelines, instruments, discoveries, mission status, and references.
- **Mission journeys** — chapter-based records for the registered missions. Opportunity (MER-B) also has a spatial waypoint route and an embedded 3D documentary.

The experiences are not all at the same level of completion. Opportunity is currently the only mission with a spatial waypoint route, and archival media coverage is incomplete across the other missions.

## How the project is built

| Part | What it uses |
|---|---|
| 3D experience | React, TypeScript, three.js, and React Three Fiber |
| Planetary terrain | MOLA-derived Mars elevation data and LOLA-derived lunar elevation data |
| Orbital motion | JPL approximate Keplerian elements |
| Spacecraft | NASA's published MER model where identified; other models are project reconstructions |
| Mission research | NASA Science, NSSDCA, and peer-reviewed research linked from mission records |
| Media | NASA and other credited material, with asset-specific attribution |

A model, reconstruction, artist's visualization, or archival photograph is not the same thing as a direct observation. The interface and asset records should make those distinctions clear.

## References and credits

Start with [REFERENCES.md](REFERENCES.md) for the main NASA, JPL, USGS, PDS, and mission-history sources.

For the detailed trail:
- [Mission source register](MISSION_SOURCE_REGISTER.md) — mission facts and their supporting sources.
- [Asset licence and attribution register](ASSET_LICENSE_AND_ATTRIBUTION.md) — image, model, texture, font, audio, and software credits.
- [AI use disclosure](AI_USE_DISCLOSURE.md) — where AI tools were used in the project.

## Run locally

```bash
npm install
npm run dev
```

To build and run the available checks:

```bash
npm run build
npm test
npx tsc --noEmit
```

The production build is a static site and can be served by a static web host.

