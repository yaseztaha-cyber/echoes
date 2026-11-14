import { IMG, type Img } from "./images";

export type Machine = {
  name: string;
  mission: string; // mission id
  missionName: string;
  kind: string;
  destination: string;
  img: Img;
  focus: string;
  fn: string;
  detail: string;
};

/** Spacecraft shown in "Built to go where we cannot". Only static images — no 3D viewer exists. */
export const MACHINES: Machine[] = [
  {
    name: "Voyager",
    mission: "voyager",
    missionName: "Voyager 1 & 2",
    kind: "Deep-space probe",
    destination: "Outer planets, then interstellar space",
    img: IMG.voyager,
    focus: "50% 40%",
    fn: "A flyby probe carrying cameras, plasma and magnetic instruments to study the giant planets and the space between stars.",
    detail:
      "Its 3.7-metre dish antenna keeps talking to Earth from billions of kilometres away, and its radioisotope power sources have run for more than four decades.",
  },
  {
    name: "Cassini",
    mission: "cassini",
    missionName: "Cassini–Huygens",
    kind: "Orbiter with a lander",
    destination: "Saturn system",
    img: IMG.cassini,
    focus: "50% 45%",
    fn: "A large orbiter for long-term study of Saturn, its rings and moons, carrying ESA's Huygens probe to Titan.",
    detail:
      "At launch it weighed about 5.7 tonnes with fuel — one of the largest interplanetary spacecraft ever built. The Huygens probe separated and descended through Titan's atmosphere on its own.",
  },
  {
    name: "Curiosity",
    mission: "curiosity",
    missionName: "Curiosity",
    kind: "Planetary rover",
    destination: "Gale Crater, Mars",
    img: IMG.curiosity,
    focus: "50% 55%",
    fn: "A car-sized mobile laboratory with a robotic arm that drills rock and feeds samples to onboard chemistry instruments.",
    detail:
      "It was set down by the sky crane, a rocket-powered platform that lowered it on cables, and it runs on a radioisotope generator so it can work through the Martian night.",
  },
  {
    name: "Perseverance",
    mission: "perseverance",
    missionName: "Perseverance",
    kind: "Planetary rover",
    destination: "Jezero Crater, Mars",
    img: IMG.perseverance,
    focus: "50% 50%",
    fn: "A rover built to cache rock-core samples in sealed tubes while searching a former river delta for signs of ancient life.",
    detail:
      "It carried Ingenuity, a 1.8-kilogram helicopter that proved powered flight is possible in Mars's very thin atmosphere.",
  },
  {
    name: "MESSENGER",
    mission: "messenger",
    missionName: "MESSENGER",
    kind: "Orbiter",
    destination: "Mercury",
    img: IMG.messenger,
    focus: "50% 50%",
    fn: "An orbiter that mapped Mercury and measured its composition and magnetic field from an elliptical polar orbit.",
    detail:
      "A ceramic-fabric sunshade kept the instruments near room temperature while the spacecraft orbited the planet closest to the Sun.",
  },
];

export type Discovery = {
  title: string;
  what: string;
  mission: string;
  missionName: string;
  why: string;
  img: Img;
  focus: string;
  world: string;
};

export const DISCOVERIES: Discovery[] = [
  {
    title: "An ancient lake on Mars",
    what: "Curiosity drilled mudstone at Yellowknife Bay in Gale Crater and found clay minerals and chemistry left by a freshwater lake.",
    mission: "curiosity",
    missionName: "Curiosity",
    why: "It showed that Mars once offered an environment that could have supported microbial life.",
    img: IMG.gale,
    focus: "50% 50%",
    world: "mars",
  },
  {
    title: "Jets from a frozen moon",
    what: "Cassini saw plumes of water ice and vapour spraying from fractures at the south pole of Enceladus, a moon about 500 km wide.",
    mission: "cassini",
    missionName: "Cassini–Huygens",
    why: "A small, cold moon appears to hide a liquid ocean, which makes it one of the most interesting places to look for life.",
    img: IMG.enceladus,
    focus: "50% 30%",
    world: "saturn",
  },
  {
    title: "Jupiter's great storm, up close",
    what: "Voyager 1 resolved the Great Red Spot and the cloud bands around it, showing a turbulent, evolving atmosphere.",
    mission: "voyager",
    missionName: "Voyager 1 & 2",
    why: "The first close views turned Jupiter from a fuzzy disk into a dynamic weather system we could study.",
    img: IMG.jupiterSpot,
    focus: "40% 40%",
    world: "jupiter",
  },
  {
    title: "A living surface on Pluto",
    what: "New Horizons found mountains of water ice, smooth nitrogen-ice plains and layered hazes on Pluto.",
    mission: "newhorizons",
    missionName: "New Horizons",
    why: "A tiny, frozen world at the edge of the solar system is still geologically active.",
    img: IMG.plutoHaze,
    focus: "50% 55%",
    world: "pluto",
  },
  {
    title: "Venus, seen through the clouds",
    what: "Magellan's radar mapped volcanoes, lava plains and fractured terrain across most of Venus, through clouds no camera could pierce.",
    mission: "magellan",
    missionName: "Magellan",
    why: "The surface shows few craters, suggesting it is relatively young and has been reshaped by volcanism.",
    img: IMG.venusRadar,
    focus: "50% 50%",
    world: "venus",
  },
];
