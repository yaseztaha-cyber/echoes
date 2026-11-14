import type { Artifact, HardwareComponent, ScienceQuestion, TimelineEvent } from "@/types";

const HOUR = 3600000;
const ev = (id: string, t: number, title: string, detail: string, kind: TimelineEvent["kind"]): TimelineEvent => ({ id, t, title, detail, kind, sourceId: "alsj" });

const H = (id: string, name: string, full: string, purpose: string, capability: string, how: string, pos: [number, number, number], dist: number, decode?: HardwareComponent["decode"]): HardwareComponent => ({
  id, name, full, purpose, capability, how, pos, view: [1, 0.55, 0.9], dist, decode,
});

const lm = (name: string) =>
  H("lm", "LM DESCENT STAGE", `LUNAR MODULE ${name.toUpperCase()} · DESCENT STAGE`,
    "The landing stage of the Lunar Module. It carried the landing engine and was the launch platform for the ascent stage, which took the crew back to orbit.",
    "Landing engine, four landing legs and storage bays for tools and experiments.",
    "After the crew lifted off, the descent stage stayed behind. It is still there, wrapped in thermal foil.",
    [0, 1.2, 0], 13,
    { full: "LUNAR MODULE DESCENT STAGE", what: "The lower half of the Lunar Module.", measures: "Not an instrument — it is the landing platform.", why: "It marks the exact spot where humans arrived and is a fixed reference for every surface experiment." });

const alsep = H("alsep", "ALSEP STATION", "APOLLO LUNAR SURFACE EXPERIMENTS PACKAGE · CENTRAL STATION",
  "Received commands from Earth, powered the experiments and relayed their data.",
  "Powered by a SNAP-27 radioisotope thermoelectric generator providing roughly 70 watts.",
  "Data from each experiment travelled by cable to the central station, which transmitted it to Earth until the stations were shut down on 30 September 1977.",
  [52, 0.5, -28], 5,
  { full: "APOLLO LUNAR SURFACE EXPERIMENTS PACKAGE", what: "A set of long-lived science instruments left on the surface, with a central radio station.", measures: "Depends on the experiment: seismic waves, heat flow, magnetic fields, particles.", why: "Unlike the astronauts, the ALSEP stayed and kept measuring for years." });

const pse = H("pse", "PSE", "PASSIVE SEISMIC EXPERIMENT",
  "A seismometer that listened for moonquakes and impacts.",
  "Sensitive to extremely small ground motions.",
  "The seismometer recorded vibrations of the Moon. Scientists studied how those waves travelled through the interior.",
  [47, 0.3, -22], 3.5,
  { full: "PASSIVE SEISMIC EXPERIMENT", what: "A seismometer on the lunar surface.", measures: "Ground vibrations from moonquakes and impacts.", why: "Waves reveal the layers inside the Moon, like an ultrasound of a world." });

const ase = H("ase", "ASE", "ACTIVE SEISMIC EXPERIMENT",
  "Created small controlled vibrations and listened to them.",
  "A thumper device and small explosive charges generated seismic waves recorded by geophones.",
  "Waves travelled through the shallow lunar soil and rock. Their speed revealed the structure of the upper layers.",
  [40, 0.2, -18], 3.5,
  { full: "ACTIVE SEISMIC EXPERIMENT", what: "A set of geophones plus a thumper and explosive charges.", measures: "How fast seismic waves travel in the upper few hundred metres.", why: "It shows how the shallow Moon is layered." });

const sws = H("sws", "SWS", "SOLAR WIND SPECTROMETER",
  "Measured electrons and protons streaming from the Sun.",
  "Seven Faraday cup sensors pointing in different directions.",
  "The Moon has almost no atmosphere or magnetic field, so the solar wind hits the surface directly. SWS measured it.",
  [44, 0.5, -34], 3.5,
  { full: "SOLAR WIND SPECTROMETER", what: "An instrument that counts charged particles from the Sun.", measures: "Speed and density of the solar wind.", why: "It shows how the Sun's particles interact with an airless world." });

const hfe = H("hfe", "HFE", "HEAT FLOW EXPERIMENT",
  "Measured how much heat flows out of the Moon's interior.",
  "Temperature sensors lowered into holes drilled in the regolith.",
  "Astronauts drilled holes and placed probes. Temperatures at different depths show how heat moves outward.",
  [58, 0.2, -38], 3.5,
  { full: "HEAT FLOW EXPERIMENT", what: "Probes placed in boreholes in the lunar soil.", measures: "Temperature at depth and the thermal properties of the soil.", why: "Heat flow reveals how much heat the Moon still releases from its formation and radioactive elements." });

const lspe = H("lspe", "LSPE", "LUNAR SEISMIC PROFILING EXPERIMENT",
  "Mapped the structure beneath the landing valley.",
  "Geophones recorded waves from explosive charges.",
  "Explosive charges were left by the astronauts and detonated remotely after they departed.",
  [36, 0.2, -25], 3.5,
  { full: "LUNAR SEISMIC PROFILING EXPERIMENT", what: "A string of geophones plus explosive charges.", measures: "Seismic wave travel times beneath the site.", why: "It helped reveal the layering under the Taurus–Littrow valley." });

const lrv = H("lrv", "LRV", "LUNAR ROVING VEHICLE",
  "Carried astronauts and tools far from the lander.",
  "Battery-powered, four-wheeled electric vehicle folded onto the side of the Lunar Module.",
  "First used on Apollo 15, the LRV extended the range of surface exploration. All three were left on the Moon.",
  [-28, 0.7, 18], 6,
  { full: "LUNAR ROVING VEHICLE", what: "An electric vehicle for two astronauts.", measures: "Not an instrument — it extended access to sites.", why: "Driving made it possible to sample distant geology." });

const QUAKES: ScienceQuestion = {
  id: "q-moonquakes",
  question: "Is the Moon seismically active — and what is it made of inside?",
  recordName: "THE MOON RINGS LIKE A BELL",
  instrumentIds: ["pse", "ase", "lspe", "alsep"],
  measurement: { simple: "Ground vibrations, recorded for years and sent to Earth.", technical: "Long-period and short-period seismograms from the Apollo passive and active seismic experiments, transmitted via the ALSEP." },
  observations: [
    { id: "o1", label: "THE MOON KEEPS RINGING", detail: "After spent hardware struck the surface, seismometers recorded vibrations that lasted far longer than they would on Earth." },
    { id: "o2", label: "DEEP MOONQUAKES", detail: "The network recorded moonquakes from deep in the interior that repeat in cycles linked to the Moon's orbit around Earth." },
  ],
  evidence: [
    { id: "e1", label: "LONG-LASTING REVERBERATION", detail: "Long ringing indicates a dry, fractured outer layer that scatters seismic waves with little energy loss.", sourceId: "nssdc-alsep" },
    { id: "e2", label: "TIDALLY TRIGGERED QUAKES", detail: "Repeating deep events show that Earth's gravity is flexing the Moon's interior.", sourceId: "alsj" },
  ],
  interpretation: "The Moon is not seismically dead. Earth's tides trigger deep moonquakes, and impacts shake a dry, fractured crust for a long time. Apollo seismology gave the first direct measurements of the Moon's layered interior.",
  layers: {
    explore: "Apollo's seismometers heard the Moon ring after impacts, and heard it shake from deep inside.",
    understand: "Because the Moon's crust is dry and cracked, vibrations bounce around for a very long time. Deep quakes repeat on a monthly rhythm because of Earth's pull. Together they gave scientists a first look inside another world.",
    technical: "ALSEP seismometers recorded thousands of events over eight years, including deep moonquakes with tidal periodicity and impact signals with prolonged coda. Travel-time data constrained crust and mantle structure.",
  },
  sources: [{ sourceId: "nssdc-alsep", claim: "ALSEP seismic experiments operated until 30 September 1977." }, { sourceId: "alsj", claim: "Surface experiment descriptions." }],
};

const HEAT: ScienceQuestion = {
  id: "q-heat",
  question: "How much heat is escaping from the Moon's interior?",
  recordName: "THE MOON'S QUIET HEAT",
  instrumentIds: ["hfe", "alsep"],
  measurement: { simple: "Temperatures at different depths in the soil, over time.", technical: "Temperature-gradient and thermal-conductivity measurements in boreholes, giving conductive heat flux." },
  observations: [{ id: "o1", label: "TEMPERATURE RISES WITH DEPTH", detail: "Below the changing surface layer, temperature increases with depth: heat is flowing outward from the interior." }],
  evidence: [{ id: "e1", label: "REVISED HEAT-FLOW VALUES", detail: "Revised values are about 21 mW/m² at Apollo 15 and 16 mW/m² at Apollo 17 — far below Earth's average.", sourceId: "langseth1976" }],
  interpretation: "The Moon releases much less heat than Earth, but more than expected from its crust alone, helping scientists estimate how much radioactive material the Moon contains.",
  layers: {
    explore: "Probes in the Moon's soil measured the slow warmth leaking out of the interior.",
    understand: "The Moon is small, so it has cooled. Still, a faint heat flows out. How much tells scientists about radioactive elements inside.",
    technical: "Revised conductive heat flow values at the Apollo 15 and 17 sites were ≈21 and ≈16 mW/m² (Langseth et al. 1976).",
  },
  sources: [{ sourceId: "langseth1976", claim: "Heat flow at Apollo 15 and 17 sites." }],
};

interface Spec {
  n: number; lm: string; region: string; lat: number; lon: number; landing: number; eva: number; liftoff: number;
  /** Real launch instant (UTC). Derived dates were wrong for Apollo 12, 14 and 16. */
  launch: number;
  summary: string; extra: HardwareComponent[]; qs: ScienceQuestion[]; terrainSeed: number; extraLegacy?: string;
}

const make = (s: Spec): Artifact => {
  const id = `apollo-${s.n}`;
  return {
    id,
    name: `APOLLO ${s.n}`,
    designation: `A${s.n}`,
    summary: s.summary,
    destination: "moon",
    type: "equipment",
    missionId: id,
    missionName: `Apollo ${s.n} · ${s.lm}`,
    model: {
      kind: "apollo",
      title: `APOLLO ${s.n} SURFACE HARDWARE`,
      source: "NASA Apollo Lunar Surface Journal and ALSEP documentation",
      modelType: "RECONSTRUCTED",
      accuracy: "DOCUMENTED REFERENCE · SIMPLIFIED · ARRANGEMENT APPROXIMATE",
      note: "Hardware shapes are simplified reconstructions. The arrangement of experiments around the Lunar Module is approximate and not surveyed. Not an official NASA asset.",
    },
    location: { world: "moon", site: `${s.lm} landing site`, region: s.region, lat: s.lat, lon: s.lon },
    status: "INACTIVE HARDWARE",
    dates: { launch: s.launch, landing: s.landing, end: Date.UTC(1977, 8, 30), endLabel: "ALSEP stations shut down (30 September 1977)" },
    clock: { rate: 60000, range: [s.landing - HOUR, s.liftoff + HOUR], kind: "date" },
    sun: { el: 22, az: 80 },
    terrainSeed: s.terrainSeed,
    hardware: [lm(s.lm), alsep, ...s.extra],
    scientificQuestions: s.qs,
    timeline: [
      ev("landing", s.landing, `${s.lm.toUpperCase()} LANDS`, `The Lunar Module touches down in ${s.region}.`, "landing"),
      ev("eva1", s.eva, "FIRST MOONWALK (EVA 1)", "The crew steps onto the surface and deploys experiments, including the ALSEP.", "eva"),
      ev("liftoff", s.liftoff, "LIFTOFF FROM THE MOON", "The ascent stage lifts off, leaving the descent stage and experiments behind.", "end"),
    ],
    legacy: {
      physical: "The Lunar Module descent stage and the surface experiments remain where they were left in 1969–1972.",
      data: "ALSEP stations transmitted until they were shut down on 30 September 1977. The seismic and heat-flow data are archived and still analysed.",
      legacy: [
        "Apollo seismology gave the first direct measurements of the Moon's internal structure.",
        "About 382 kg of lunar samples from the six landings remain a research resource.",
        ...(s.extraLegacy ? [s.extraLegacy] : []),
      ],
    },
    sources: [{ sourceId: "alsj", claim: "Surface operations and hardware." }, { sourceId: "nssdc-alsep", claim: "ALSEP experiments and shutdown." }, { sourceId: "nasa-apollo", claim: "Mission dates." }],
    media: [],
  };
};

export const apollo12 = make({
  n: 12, lm: "Intrepid", region: "OCEANUS PROCELLARUM", lat: -3.0124, lon: -23.4216, landing: Date.UTC(1969, 10, 19, 6, 54, 35), launch: Date.UTC(1969, 10, 14, 16, 22), eva: Date.UTC(1969, 10, 19, 11, 32), liftoff: Date.UTC(1969, 10, 20, 14, 25),
  summary: "Second crewed landing and the first precision landing, close to the Surveyor 3 spacecraft.", extra: [pse, sws], qs: [QUAKES], terrainSeed: 3,
});
export const apollo14 = make({
  n: 14, lm: "Antares", region: "FRA MAURO HIGHLANDS", lat: -3.6453, lon: -17.4714, landing: Date.UTC(1971, 1, 5, 9, 18, 11), launch: Date.UTC(1971, 0, 31, 21, 3, 2), eva: Date.UTC(1971, 1, 5, 14, 42), liftoff: Date.UTC(1971, 1, 6, 18, 48),
  summary: "Landed in the Fra Mauro highlands, the intended target of the aborted Apollo 13.", extra: [pse, ase], qs: [QUAKES], terrainSeed: 14,
  extraLegacy: "A laser retroreflector left on the surface is still used for laser ranging to the Moon.",
});
export const apollo15 = make({
  n: 15, lm: "Falcon", region: "HADLEY–APENNINE", lat: 26.1322, lon: 3.6298, landing: Date.UTC(1971, 6, 30, 22, 16, 29), launch: Date.UTC(1971, 6, 26, 13, 34), eva: Date.UTC(1971, 6, 31, 13, 12), liftoff: Date.UTC(1971, 7, 2, 17, 11),
  summary: "First mission with the Lunar Roving Vehicle, exploring Hadley Rille and the Apennine Mountains.", extra: [pse, hfe, lrv], qs: [QUAKES, HEAT], terrainSeed: 15,
  extraLegacy: "A laser retroreflector left on the surface is still used for laser ranging to the Moon.",
});
export const apollo16 = make({
  n: 16, lm: "Orion", region: "DESCARTES HIGHLANDS", lat: -8.9730, lon: 15.5002, landing: Date.UTC(1972, 3, 21, 2, 23, 35), launch: Date.UTC(1972, 3, 16, 17, 54), eva: Date.UTC(1972, 3, 21, 17, 55), liftoff: Date.UTC(1972, 3, 24, 1, 25),
  summary: "The only Apollo landing in the lunar highlands, with a Lunar Roving Vehicle for exploring the Descartes region.", extra: [pse, ase, lrv], qs: [QUAKES], terrainSeed: 16,
});
export const apollo17 = make({
  n: 17, lm: "Challenger", region: "TAURUS–LITTROW VALLEY", lat: 20.1908, lon: 30.7717, landing: Date.UTC(1972, 11, 11, 19, 54, 57), launch: Date.UTC(1972, 11, 7, 5, 33), eva: Date.UTC(1972, 11, 11, 23, 54), liftoff: Date.UTC(1972, 11, 14, 22, 55),
  summary: "The last crewed lunar landing of the Apollo program. Harrison Schmitt became the first geologist on the Moon.", extra: [lspe, hfe, lrv], qs: [QUAKES, HEAT], terrainSeed: 17,
});
