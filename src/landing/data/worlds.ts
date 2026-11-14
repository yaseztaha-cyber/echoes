import { IMG, type Img } from "./images";

export type World = {
  id: string;
  name: string;
  kind: string;
  img: Img;
  /** CSS object-position for the panel crop */
  focus: string;
  /** Short, scientifically careful description */
  blurb: string;
  /** Longer note for the dossier page */
  detail: string;
  facts: { label: string; value: string }[];
  /** ids from missions.ts */
  missions: string[];
};

export const WORLDS: World[] = [
  {
    id: "mercury",
    name: "Mercury",
    kind: "Planet",
    img: IMG.mercuryHorizon,
    focus: "50% 60%",
    blurb:
      "The smallest planet and the closest to the Sun. Its cratered surface and ice in permanently shadowed polar craters were mapped by MESSENGER.",
    detail:
      "Mercury has almost no atmosphere to soften temperature swings, so its sunlit side is scorching while shadowed craters near the poles stay cold enough to hold water ice. MESSENGER, the first spacecraft to orbit it, mapped the whole surface and measured its magnetic field and composition.",
    facts: [
      { label: "Diameter", value: "4,879 km" },
      { label: "Year", value: "88 Earth days" },
    ],
    missions: ["messenger"],
  },
  {
    id: "venus",
    name: "Venus",
    kind: "Planet",
    img: IMG.venusGlobe,
    focus: "50% 50%",
    blurb:
      "Wrapped in thick cloud, its surface is invisible to cameras. Magellan used radar to map volcanoes, lava plains and fractured highlands.",
    detail:
      "Venus's dense carbon-dioxide atmosphere hides the ground and holds the surface near 465 °C. Radar can see through the clouds, which is how Magellan built a map covering most of the planet at roughly 100-metre resolution.",
    facts: [
      { label: "Diameter", value: "12,104 km" },
      { label: "Year", value: "225 Earth days" },
    ],
    missions: ["magellan"],
  },
  {
    id: "earth",
    name: "Earth",
    kind: "Planet",
    img: IMG.earthApollo,
    focus: "50% 50%",
    blurb:
      "The only world known to host life, and the point of departure for every mission here. Photographed whole by the Apollo 17 crew on their way to the Moon.",
    detail:
      "Every spacecraft in this story began its journey on Earth. This photograph, taken by the Apollo 17 crew in December 1972, is one of the most widely reproduced images ever made — Earth as a complete, lit disk.",
    facts: [
      { label: "Diameter", value: "12,742 km" },
      { label: "Year", value: "365.25 days" },
    ],
    missions: [],
  },
  {
    id: "moon",
    name: "The Moon",
    kind: "Natural satellite",
    img: IMG.moonAldrin,
    focus: "40% 40%",
    blurb:
      "The only other world humans have walked on. Twelve astronauts landed between Apollo 11 in 1969 and Apollo 17 in 1972.",
    detail:
      "The Moon is Earth's only natural satellite. Apollo astronauts brought back about 382 kg of rock and soil, which still anchor our understanding of its age and origin. Apollo 11 landed on 20 July 1969; Apollo 17, the last crewed landing, in December 1972.",
    facts: [
      { label: "Diameter", value: "3,474 km" },
      { label: "Orbit", value: "27.3 days around Earth" },
    ],
    missions: [],
  },
  {
    id: "mars",
    name: "Mars",
    kind: "Planet",
    img: IMG.marsGlobe,
    focus: "50% 50%",
    blurb:
      "A cold desert shaped by ancient water. Opportunity, Curiosity and Perseverance have driven across it, reading rocks that record lakes and rivers.",
    detail:
      "Mars is the best-explored planet beyond Earth. Orbiters mapped it from above; rovers have read its rocks from the ground. Minerals found by Opportunity and Curiosity show that liquid water once persisted at the surface, and Perseverance is exploring an ancient river delta.",
    facts: [
      { label: "Diameter", value: "6,779 km" },
      { label: "Year", value: "687 Earth days" },
    ],
    missions: ["opportunity", "curiosity", "perseverance"],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    kind: "Gas giant",
    img: IMG.jupiterSpot,
    focus: "40% 40%",
    blurb:
      "The largest planet. Voyager 1's 1979 flyby resolved the Great Red Spot and the turbulent cloud bands around it in unprecedented detail.",
    detail:
      "Jupiter has no solid surface to land on, so every encounter has been a flyby or an orbit. Voyager 1 and 2 passed in 1979; Cassini and New Horizons used Jupiter's gravity as a slingshot in 2000 and 2007 while studying it on the way.",
    facts: [
      { label: "Diameter", value: "139,820 km" },
      { label: "Year", value: "11.9 Earth years" },
    ],
    missions: ["voyager", "cassini", "newhorizons"],
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "Gas giant",
    img: IMG.earthSmiled,
    focus: "50% 50%",
    blurb:
      "Home to the most extensive ring system known. Cassini orbited it for 13 years, studying the rings, Titan and Enceladus up close.",
    detail:
      "Cassini arrived at Saturn on 1 July 2004 and ended its mission in Saturn's atmosphere on 15 September 2017. This view, taken from Saturn's shadow with the Sun behind the planet, also shows Earth as a faint dot beyond the rings.",
    facts: [
      { label: "Diameter", value: "116,460 km" },
      { label: "Year", value: "29.4 Earth years" },
    ],
    missions: ["cassini", "voyager"],
  },
  {
    id: "uranus",
    name: "Uranus",
    kind: "Ice giant",
    img: IMG.uranus,
    focus: "50% 50%",
    blurb:
      "Tipped on its side, and visited only once. Voyager 2 flew past in January 1986 and still provides most of what we know up close.",
    detail:
      "Uranus rotates on an axis tilted about 98°, so it effectively rolls around the Sun. Voyager 2's single flyby on 24 January 1986 revealed new moons and rings, and a bland-looking atmosphere in visible light.",
    facts: [
      { label: "Diameter", value: "50,724 km" },
      { label: "Year", value: "84 Earth years" },
    ],
    missions: ["voyager"],
  },
  {
    id: "neptune",
    name: "Neptune",
    kind: "Ice giant",
    img: IMG.neptune,
    focus: "50% 50%",
    blurb:
      "The farthest planet from the Sun. Voyager 2 reached it in 1989, finding the Great Dark Spot and some of the fastest winds in the solar system.",
    detail:
      "Neptune was the last stop of Voyager 2's Grand Tour, on 25 August 1989. The spacecraft imaged a dark storm system, high clouds, and winds that exceed 1,000 km/h.",
    facts: [
      { label: "Diameter", value: "49,244 km" },
      { label: "Year", value: "165 Earth years" },
    ],
    missions: ["voyager"],
  },
  {
    id: "pluto",
    name: "Pluto",
    kind: "Dwarf planet",
    img: IMG.plutoHaze,
    focus: "50% 55%",
    blurb:
      "A distant, geologically alive dwarf planet. New Horizons revealed water-ice mountains, nitrogen-ice plains and layered blue haze in 2015.",
    detail:
      "New Horizons made its closest approach to Pluto on 14 July 2015, about 12,500 km above the surface. Before that, Pluto was little more than a few pixels in the best telescope images.",
    facts: [
      { label: "Diameter", value: "2,377 km" },
      { label: "Year", value: "248 Earth years" },
    ],
    missions: ["newhorizons"],
  },
];

export const worldById = (id: string) => WORLDS.find((w) => w.id === id);
