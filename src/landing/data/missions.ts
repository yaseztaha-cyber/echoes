import { IMG, type Img } from "./images";

export type Stage = {
  /** Stage label — differs per mission because journeys differ */
  label: string;
  when: string;
  text: string;
};

export type Mission = {
  id: string;
  name: string;
  short: string;
  year: string;
  img: Img;
  focus: string;
  destination: string;
  type: string;
  agency: string;
  status: string;
  objective: string;
  discovery: string;
  stages: Stage[];
  /** world ids */
  worlds: string[];
};

const RAW: Mission[] = [
  {
    id: "voyager",
    name: "Voyager 1 & 2",
    short: "Voyager",
    year: "1977",
    img: IMG.voyager,
    focus: "50% 40%",
    destination: "Jupiter, Saturn, Uranus, Neptune — then interstellar space",
    type: "Flyby · Interstellar",
    agency: "NASA / JPL",
    status: "Both spacecraft still returning data from interstellar space",
    objective:
      "Use a rare alignment of the outer planets to visit them in a single journey, then keep going.",
    discovery:
      "Voyager 1 crossed into interstellar space in 2012 and Voyager 2 in 2018 — the first human-made objects to travel beyond the Sun's heliosphere.",
    stages: [
      {
        label: "Launch",
        when: "Aug – Sep 1977",
        text: "Voyager 2 lifts off on 20 August 1977, Voyager 1 follows on 5 September on a faster path.",
      },
      {
        label: "Jupiter & Saturn flybys",
        when: "1979 – 1981",
        text: "Both spacecraft pass Jupiter in 1979 and Saturn in 1980 and 1981, imaging moons, rings and storms.",
      },
      {
        label: "Uranus & Neptune (Voyager 2)",
        when: "1986 – 1989",
        text: "Voyager 2 alone continues, passing Uranus on 24 January 1986 and Neptune on 25 August 1989.",
      },
      {
        label: "Interstellar space",
        when: "2012 · 2018",
        text: "Voyager 1 crosses the heliopause in 2012; Voyager 2 follows in 2018. Both carry a Golden Record of sounds and images from Earth.",
      },
    ],
    worlds: ["jupiter", "saturn", "uranus", "neptune"],
  },
  {
    id: "magellan",
    name: "Magellan",
    short: "Magellan",
    year: "1989",
    img: IMG.magellan,
    focus: "50% 40%",
    destination: "Venus",
    type: "Orbiter · Radar mapper",
    agency: "NASA / JPL",
    status: "Mission ended 1994 in Venus's atmosphere",
    objective:
      "Map the surface of Venus with radar, because its dense clouds hide the ground from ordinary cameras.",
    discovery:
      "Radar maps covering most of the planet revealed volcanic plains, enormous lava flows and fractured highlands on a surface that looks geologically young.",
    stages: [
      {
        label: "Launch from the Space Shuttle",
        when: "4 May 1989",
        text: "Magellan is deployed from Space Shuttle Atlantis on mission STS-30 and sent on its way by an upper stage.",
      },
      {
        label: "Cruise",
        when: "1989 – 1990",
        text: "A looping trajectory of about 15 months carries it around the Sun to Venus.",
      },
      {
        label: "Orbit insertion",
        when: "10 Aug 1990",
        text: "Magellan enters a polar orbit around Venus; it does not land.",
      },
      {
        label: "Radar mapping",
        when: "1990 – 1994",
        text: "Repeated radar swaths build a map of most of the surface, followed by gravity measurements.",
      },
      {
        label: "End of mission",
        when: "Oct 1994",
        text: "Controllers lower the orbit so Magellan descends into the atmosphere, returning data on the way.",
      },
    ],
    worlds: ["venus"],
  },
  {
    id: "messenger",
    name: "MESSENGER",
    short: "MESSENGER",
    year: "2004",
    img: IMG.messenger,
    focus: "50% 50%",
    destination: "Mercury",
    type: "Orbiter",
    agency: "NASA / Johns Hopkins APL",
    status: "Mission ended 30 April 2015 on Mercury's surface",
    objective:
      "Become the first spacecraft to orbit Mercury and study its surface, composition, interior and magnetic field.",
    discovery:
      "Measurements confirmed water ice inside permanently shadowed craters near Mercury's poles, on the planet closest to the Sun.",
    stages: [
      {
        label: "Launch",
        when: "3 Aug 2004",
        text: "MESSENGER launches on a Delta II rocket.",
      },
      {
        label: "Gravity-assist cruise",
        when: "2005 – 2009",
        text: "One Earth flyby, two Venus flybys, and three Mercury flybys slow the spacecraft enough to be captured.",
      },
      {
        label: "Orbit insertion",
        when: "18 Mar 2011",
        text: "MESSENGER becomes the first spacecraft to enter orbit around Mercury.",
      },
      {
        label: "Orbital science",
        when: "2011 – 2015",
        text: "Imaging, laser altimetry and spectrometers map the entire planet and its polar deposits.",
      },
      {
        label: "End of mission",
        when: "30 Apr 2015",
        text: "With its fuel exhausted, MESSENGER impacts the surface of Mercury.",
      },
    ],
    worlds: ["mercury"],
  },
  {
    id: "cassini",
    name: "Cassini–Huygens",
    short: "Cassini",
    year: "1997",
    img: IMG.cassini,
    focus: "50% 45%",
    destination: "Saturn, Titan, Enceladus",
    type: "Orbiter · Titan probe",
    agency: "NASA / ESA / ASI",
    status: "Mission ended 15 September 2017 in Saturn's atmosphere",
    objective:
      "Study Saturn, its rings and its moons from orbit, and send the Huygens probe down to Titan.",
    discovery:
      "Cassini found jets of water ice and vapour erupting from Enceladus's south pole — evidence of a subsurface ocean on a small icy moon.",
    stages: [
      {
        label: "Launch",
        when: "15 Oct 1997",
        text: "Cassini–Huygens launches on a Titan IVB rocket.",
      },
      {
        label: "Gravity-assist cruise",
        when: "1998 – 2003",
        text: "Two Venus flybys, an Earth flyby and a Jupiter flyby (30 December 2000) build speed for Saturn.",
      },
      {
        label: "Orbit insertion",
        when: "1 Jul 2004",
        text: "Cassini enters orbit around Saturn after a seven-year journey.",
      },
      {
        label: "Huygens lands on Titan",
        when: "14 Jan 2005",
        text: "The European-built Huygens probe descends through Titan's atmosphere and lands on the surface.",
      },
      {
        label: "Orbital science",
        when: "2004 – 2017",
        text: "Dozens of Titan and Enceladus flybys, ring observations, then the Grand Finale dives between Saturn and its rings.",
      },
      {
        label: "Grand Finale",
        when: "15 Sep 2017",
        text: "Cassini is deliberately sent into Saturn's atmosphere, protecting moons that might harbour life.",
      },
    ],
    worlds: ["saturn", "jupiter"],
  },
  {
    id: "opportunity",
    name: "Opportunity",
    short: "Opportunity",
    year: "2003",
    img: IMG.opportunity,
    focus: "50% 45%",
    destination: "Meridiani Planum, Mars",
    type: "Rover",
    agency: "NASA / JPL",
    status: "Contact lost 10 June 2018 in a global dust storm",
    objective:
      "Look for rocks and minerals that record whether liquid water once existed at the surface of Mars.",
    discovery:
      "Opportunity found hematite-rich spherules and layered sulphate rocks showing that water once soaked and shaped the Meridiani plains.",
    stages: [
      {
        label: "Launch",
        when: "7 Jul 2003",
        text: "Opportunity launches on a Delta II rocket, about four weeks after its twin, Spirit.",
      },
      {
        label: "Cruise",
        when: "2003 – 2004",
        text: "About six months of cruise to Mars.",
      },
      {
        label: "Landing",
        when: "25 Jan 2004",
        text: "An airbag-cushioned landing in Eagle crater on Meridiani Planum.",
      },
      {
        label: "Surface operations",
        when: "2004 – 2018",
        text: "A mission planned for 90 sols lasts about 14 years and drives over 45 km, reaching Endeavour crater in 2011.",
      },
      {
        label: "Last contact",
        when: "10 Jun 2018",
        text: "A planet-wide dust storm blocks the sunlight its solar panels need; the mission is declared complete in February 2019.",
      },
    ],
    worlds: ["mars"],
  },
  {
    id: "curiosity",
    name: "Curiosity",
    short: "Curiosity",
    year: "2011",
    img: IMG.curiosity,
    focus: "50% 55%",
    destination: "Gale Crater, Mars",
    type: "Rover",
    agency: "NASA / JPL",
    status: "Operating on Mount Sharp",
    objective:
      "Assess whether Mars ever offered environments able to support microbial life, by reading rock chemistry in Gale Crater.",
    discovery:
      "Mudstone at Yellowknife Bay showed Gale Crater once held a freshwater lake with the chemical ingredients needed for life.",
    stages: [
      {
        label: "Launch",
        when: "26 Nov 2011",
        text: "Curiosity launches on an Atlas V rocket.",
      },
      {
        label: "Cruise",
        when: "2011 – 2012",
        text: "About eight months in space, steered by small trajectory corrections.",
      },
      {
        label: "Sky-crane landing",
        when: "6 Aug 2012",
        text: "A rocket-powered descent stage lowers the rover on cables onto the floor of Gale Crater.",
      },
      {
        label: "Surface operations",
        when: "2012 – present",
        text: "Drilling and analysing rocks, first at Yellowknife Bay and then climbing the layers of Mount Sharp.",
      },
    ],
    worlds: ["mars"],
  },
  {
    id: "newhorizons",
    name: "New Horizons",
    short: "New Horizons",
    year: "2006",
    img: IMG.newHorizons,
    focus: "50% 50%",
    destination: "Pluto and the Kuiper Belt",
    type: "Flyby",
    agency: "NASA / Johns Hopkins APL / SwRI",
    status: "Extended mission in the Kuiper Belt",
    objective:
      "Make the first close-up reconnaissance of Pluto and its moons, then explore other Kuiper Belt objects.",
    discovery:
      "Pluto turned out to be geologically active, with mountains of water ice, vast plains of nitrogen ice and layered haze.",
    stages: [
      {
        label: "Launch",
        when: "19 Jan 2006",
        text: "New Horizons launches on an Atlas V rocket — a very fast departure from Earth.",
      },
      {
        label: "Jupiter gravity assist",
        when: "28 Feb 2007",
        text: "Jupiter's gravity speeds it on toward Pluto, shortening the trip by years.",
      },
      {
        label: "Long cruise",
        when: "2007 – 2015",
        text: "Most of the trip is spent in electronic hibernation, woken periodically for checks.",
      },
      {
        label: "Pluto flyby",
        when: "14 Jul 2015",
        text: "A single high-speed pass at about 12,500 km — there is no orbit and no landing.",
      },
      {
        label: "Arrokoth and beyond",
        when: "1 Jan 2019",
        text: "New Horizons flies past the Kuiper Belt object Arrokoth, then continues outward.",
      },
    ],
    worlds: ["pluto", "jupiter"],
  },
  {
    id: "perseverance",
    name: "Perseverance",
    short: "Perseverance",
    year: "2020",
    img: IMG.perseverance,
    focus: "50% 50%",
    destination: "Jezero Crater, Mars",
    type: "Rover · Helicopter tech demo",
    agency: "NASA / JPL",
    status: "Operating in Jezero Crater",
    objective:
      "Search for signs of ancient microbial life in an old river delta and collect rock samples in sealed tubes.",
    discovery:
      "Alongside the rover, the Ingenuity helicopter made the first powered, controlled flights on another planet, completing 72 before its mission ended in January 2024.",
    stages: [
      {
        label: "Launch",
        when: "30 Jul 2020",
        text: "Perseverance launches on an Atlas V rocket, with the Ingenuity helicopter attached to its belly.",
      },
      {
        label: "Cruise",
        when: "2020 – 2021",
        text: "About seven months of cruise to Mars.",
      },
      {
        label: "Landing",
        when: "18 Feb 2021",
        text: "A sky-crane landing in Jezero Crater, a former lake with a river delta.",
      },
      {
        label: "Sampling & exploration",
        when: "2021 – present",
        text: "The rover drills rock cores into sealed tubes and explores the delta, while Ingenuity flies its first flight on 19 April 2021.",
      },
    ],
    worlds: ["mars"],
  },
];

/** Chronological by launch year. */
export const MISSIONS: Mission[] = [...RAW].sort((a, b) => Number(a.year) - Number(b.year));

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
