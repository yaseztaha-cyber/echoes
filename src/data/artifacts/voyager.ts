import type { Artifact, HardwareComponent } from "@/types";
import { DAY_MS } from "@/lib/time";

export const VOYAGER_LAUNCH = Date.UTC(1977, 8, 5, 12, 56);
export const VOYAGER_NOW = Date.now();

const H = (id: string, name: string, full: string, purpose: string, capability: string, how: string, pos: [number, number, number], dist: number, decode: HardwareComponent["decode"]): HardwareComponent => ({
  id, name, full, purpose, capability, how, pos, view: [1, 0.4, 0.8], dist, decode,
});

export const voyager1: Artifact = {
  id: "voyager1",
  name: "VOYAGER 1",
  designation: "VGR-1",
  summary: "The most distant human-made object. Launched in 1977, it crossed into interstellar space in 2012 and reached one light-day from Earth on 18 November 2026.",
  destination: "deep-space",
  type: "probe",
  missionId: "voyager",
  missionName: "Voyager Interstellar Mission",
  model: {
    kind: "voyager",
    title: "VOYAGER 1",
    source: "NASA Voyager mission documentation",
    modelType: "RECONSTRUCTED",
    accuracy: "DOCUMENTED REFERENCE · SIMPLIFIED PRIMITIVE GEOMETRY",
    note: "3.7 m dish, 13 m magnetometer boom, three RTGs on a boom. Reconstructed geometry, not an official NASA asset.",
  },
  location: { world: "deep-space", site: "Interstellar space", region: "BEYOND THE HELIOPAUSE", lat: 0, lon: 0 },
  status: "PARTIALLY OPERATIONAL",
  // The Voyager mission has NOT ended: as described on NASA's pre-interruption
  // mission page, Voyager 1 "continues to collect data" beyond the heliopause;
  // `end` is therefore intentionally absent (the mission is ongoing) - the clock
  // range below still tracks the spacecraft out to the present.
  dates: {
    launch: VOYAGER_LAUNCH,
    end: undefined,
    // Dated status, not a live claim: NASA reported on 18 November 2026 that
    // science and engineering data had not been received since 14 November,
    // while the carrier signal was still detected. The mission itself is ongoing.
    endLabel: "ONGOING — carrier signal detected; science and engineering data paused since 14 November 2026 while engineers investigate (dated status as of 18 November 2026)",
  },
  clock: { rate: DAY_MS, range: [VOYAGER_LAUNCH, VOYAGER_NOW], kind: "date" },
  sun: { el: 30, az: 90 },
  terrainSeed: 0,
  hardware: [
    H("hga", "HGA", "HIGH-GAIN ANTENNA", "Talks to Earth.", "A 3.7 m dish transmitting in S-band and X-band.", "The dish stays pointed at Earth. Signals take many hours to arrive.", [0, 1.3, 0], 6,
      { full: "HIGH-GAIN ANTENNA", what: "A large dish antenna.", measures: "Not an instrument — it carries data.", why: "Without it, nothing Voyager measures would reach us." }),
    H("mag", "MAG", "MAGNETOMETER", "Measures the strength and direction of magnetic fields.", "Sensors mounted on a boom about 13 m long, away from the spacecraft's own magnetic noise.", "As the spacecraft moves, the magnetometer records the field of planets and of interstellar space.", [-6.5, 0.2, 0.8], 7,
      { full: "MAGNETOMETER", what: "A sensitive compass.", measures: "Magnetic field strength and direction.", why: "Magnetic fields show where the Sun's influence changes." }),
    H("pws", "PWS", "PLASMA WAVE SUBSYSTEM", "Listens for oscillations in ionised gas.", "Uses two electric antennas about 10 m long.", "Plasma oscillates at a frequency that depends on its density. PWS measures the frequency and so the density.", [1.0, 0.2, -4.8], 7,
      { full: "PLASMA WAVE SUBSYSTEM", what: "A radio receiver tuned to waves in ionised gas.", measures: "Electron density of the surrounding plasma.", why: "It gave the clearest measurement that Voyager 1 had entered interstellar plasma." }),
    H("particles", "CRS · LECP", "COSMIC RAY SUBSYSTEM · LOW-ENERGY CHARGED PARTICLE", "Counts energetic particles.", "Detectors for cosmic rays and lower-energy particles from the Sun and beyond.", "Counts from different energy ranges show whether particles come from the Sun or from beyond the solar system.", [0.8, 0.0, 1.2], 5,
      { full: "COSMIC RAY AND LOW-ENERGY CHARGED PARTICLE DETECTORS", what: "Two particle-detector systems.", measures: "Rates and energies of charged particles.", why: "A sudden change in the mix of particles marked the edge of the Sun's bubble." }),
    H("iss", "ISS", "IMAGING SCIENCE SUBSYSTEM", "Took pictures of planets, moons and, in 1990, the family portrait of the solar system.", "Wide-angle and narrow-angle cameras on the scan platform. Powered down after 1990.", "Cameras were switched off to conserve power and computer memory after the Family Portrait images.", [1.4, -0.2, 0.9], 5,
      { full: "IMAGING SCIENCE SUBSYSTEM", what: "Voyager's cameras.", measures: "Light from planets, moons and rings.", why: "They revealed volcanoes on Io and the detail of Saturn's rings." }),
    H("rtg", "RTG", "RADIOISOTOPE THERMOELECTRIC GENERATORS", "Make electricity from heat.", "Three generators on a boom, using plutonium-238. Output declines gradually over time.", "Heat from decaying plutonium is converted to electricity by thermocouples; there are no moving parts.", [3.8, 0.0, -1.6], 7,
      { full: "RADIOISOTOPE THERMOELECTRIC GENERATOR", what: "A nuclear battery.", measures: "Not applicable.", why: "At this distance sunlight is too weak for solar panels." }),
    H("record", "GOLDEN RECORD", "VOYAGER GOLDEN RECORD", "A message from Earth.", "A 12-inch gold-plated copper disc with sounds and images of Earth, in a protective cover.", "A stylus and instructions are included so any finder can play it.", [-0.6, -0.1, 1.5], 4,
      { full: "VOYAGER GOLDEN RECORD", what: "A phonograph record carried aboard each Voyager.", measures: "Not an instrument.", why: "A time capsule — meant to last far longer than the mission." }),
  ],
  scientificQuestions: [
    {
      id: "q-heliopause",
      question: "Where does the Sun's influence end?",
      recordName: "LEAVING THE HELIOSPHERE",
      instrumentIds: ["mag", "pws", "particles"],
      measurement: { simple: "Particles, magnetic fields and plasma waves as Voyager 1 travelled outward.", technical: "Cosmic-ray and charged-particle counts (CRS, LECP), magnetic field vectors (MAG) and plasma oscillation frequencies (PWS)." },
      observations: [
        { id: "o1", label: "COSMIC-RAY SURGE", detail: "In August 2012, galactic cosmic rays increased sharply while particles from the Sun dropped away." },
        { id: "o2", label: "DENSER PLASMA", detail: "The Plasma Wave Subsystem detected oscillations indicating plasma much denser than in the heliosphere, at about 0.08 electrons per cubic centimetre." },
      ],
      evidence: [
        { id: "e1", label: "PARTICLE CHANGE", detail: "A rapid shift from solar to galactic particles marks the crossing of the heliopause.", sourceId: "stone2013" },
        { id: "e2", label: "PLASMA DENSITY", detail: "A density of about 0.08 cm⁻³ is characteristic of interstellar plasma.", sourceId: "gurnett2013" },
      ],
      interpretation: "Voyager 1 crossed the heliopause in August 2012 and entered interstellar space — the first human-made object to do so.",
      layers: {
        explore: "Voyager 1 felt the Sun's bubble end, and became the first spacecraft in interstellar space.",
        understand: "Inside the heliosphere, particles from the Sun dominate. Outside, particles from the galaxy dominate. Voyager saw one swap for the other, and then measured plasma that is denser — the gas between the stars.",
        technical: "Cosmic-ray counts rose sharply as heliospheric ion counts fell (Stone et al. 2013). PWS electron density derived from plasma oscillations was ≈0.08 cm⁻³ (Gurnett et al. 2013).",
      },
      sources: [{ sourceId: "stone2013", claim: "Particle changes near the heliopause." }, { sourceId: "gurnett2013", claim: "Interstellar plasma density." }],
    },
  ],
  timeline: [
    { id: "launch", t: VOYAGER_LAUNCH, title: "LAUNCH", detail: "Titan IIIE–Centaur lifts off from Cape Canaveral.", kind: "launch", sourceId: "nasa-voyager" },
    { id: "jupiter", t: Date.UTC(1979, 2, 5), title: "JUPITER FLYBY", detail: "Closest approach to Jupiter; Io's active volcanoes are discovered in the images.", kind: "flyby", sourceId: "nasa-voyager" },
    { id: "saturn", t: Date.UTC(1980, 10, 12), title: "SATURN FLYBY", detail: "Closest approach to Saturn; a Titan encounter then bends the path out of the planetary plane.", kind: "flyby", sourceId: "nasa-voyager" },
    { id: "pale", t: Date.UTC(1990, 1, 14), title: "FAMILY PORTRAIT", detail: "Cameras look back to capture the solar system, including the “Pale Blue Dot”.", kind: "science", sourceId: "nasa-voyager" },
    { id: "heliopause", t: Date.UTC(2012, 7, 25), title: "ENTERS INTERSTELLAR SPACE", detail: "Voyager 1 crosses the heliopause.", kind: "science", sourceId: "gurnett2013" },
    { id: "lightday", t: Date.UTC(2026, 10, 18, 10, 16), title: "ONE LIGHT-DAY FROM EARTH", detail: "About 25.9 billion km (16.1 billion mi) away. A radio signal now takes roughly 24 hours to cross each way.", kind: "science", sourceId: "nasa-voyager-lightday" },
  ],
  distanceMilestone: {
    date: Date.UTC(2026, 10, 18, 10, 16),
    dateLabel: "18 NOVEMBER 2026 · 2:16 A.M. PST (10:16 UTC)",
    distanceKm: 25_900_000_000,
    distanceMi: 16_100_000_000,
    oneWayHours: 24,
    status:
      "Dated status: NASA had received no science or engineering data from Voyager 1 since 14 November 2026, although its carrier signal was still detected. Engineers used the carrier signal and trajectory calculations to confirm the milestone and are analysing the data issue. This is not live telemetry.",
    sourceIds: ["nasa-voyager-lightday", "nasa-voyager-data-2026"],
  },
  legacy: {
    physical: "Voyager 1 is travelling outward at about 17 km/s. It will not return.",
    data: "Planetary-encounter and interstellar measurements are archived. The current data-return issue is dated in the timeline rather than presented as live.",
    legacy: [
      "First spacecraft to reach interstellar space.",
      "First spacecraft to reach one light-day from Earth (18 November 2026).",
      "Showed the diversity of the outer planets and their moons.",
      "Carries the Golden Record.",
    ],
  },
  sources: [
    { sourceId: "nasa-voyager", claim: "Mission dates and instruments." },
    { sourceId: "gurnett2013", claim: "Interstellar plasma." },
    { sourceId: "nasa-voyager-lightday", claim: "One light-day distance, date and signal travel time." },
    { sourceId: "nasa-voyager-data-2026", claim: "Dated data-return status and carrier-signal confirmation." },
  ],
  media: [],
};
