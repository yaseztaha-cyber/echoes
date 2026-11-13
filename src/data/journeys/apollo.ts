import type { MissionJourney, MissionChapter, HologramStep } from "./types";

const mk = (id: string, seq: number, act: string, title: string, date: string, dateUtc: number, sol: number | null, loc: string, etype: string, narrative: string, why: string, instruments: string[], discovery: string | null, sci: string, eng: string, future: string, media: string[], caseFileId: string | null, camera: string, steps: HologramStep[]): MissionChapter => ({
  id, sequence: seq, act, title, date, dateUtc, sol, location: loc, eventType: etype, narrative, whyHappened: why, instruments, hardware: [], discovery, scientificSignificance: sci, engineeringSignificance: eng, futureMissions: future, media, caseFileId, cameraBehavior: camera, hologramSequence: steps,
});

interface ApolloSpec {
  n: number;
  lm: string;
  region: string;
  lat: number;
  lon: number;
  landing: number;
  eva: number;
  liftoff: number;
  summary: string;
  extraLegacy?: string;
}

const makeApolloJourney = (spec: ApolloSpec): MissionJourney => {
  const id = `apollo-${spec.n}`;
  const lmName = spec.lm.toUpperCase();
  return {
    deviceId: id,
    title: `APOLLO ${spec.n} JOURNEY`,
    subtitle: `${id.toUpperCase()} · Lunar Module ${lmName}`,
    missionName: `Apollo ${spec.n}`,
    missionType: "equipment",
    introduction: `Apollo ${spec.n} landed in ${spec.region} on the Moon. ${spec.summary} The Lunar Module descent stage and surface experiments remain where they were left.`,
    missionObjective: `Land humans on the Moon, conduct scientific experiments, and return safely to Earth. Apollo ${spec.n} specifically targeted ${spec.region}.`,
    chapters: [
      mk(`${id}-ch-01`, 1, "ACT I — THE JOURNEY TO THE MOON", "Mission development", "1960s · APOLLO PROGRAM", Date.UTC(1965, 0, 1), null, "Earth · NASA centers", "development", `Apollo ${spec.n} was part of the Apollo program, which aimed to land humans on the Moon and return them safely to Earth. The mission was developed at NASA centers across the United States.`, "The Apollo program was created to demonstrate American technological capability and advance scientific understanding of the Moon.", [], null, "Contributed to the Apollo program's goal of lunar exploration.", "Advanced spacecraft design, navigation, and life support systems.", "Apollo engineering informed all subsequent crewed spaceflight.", [], null, "Orbital view of Earth and Moon, Apollo program overview.", [{ kind: "title", title: "WHY WE WENT", detail: "Land humans on the Moon" }]),
      mk(`${id}-ch-02`, 2, "ACT I — THE JOURNEY TO THE MOON", "Launch", `${new Date(spec.landing - 4 * 86400000).toISOString().slice(0, 10)} · Kennedy Space Center`, spec.landing - 4 * 86400000, null, "Kennedy Space Center, Florida", "launch", `Apollo ${spec.n} launched on a Saturn V rocket from Kennedy Space Center. The three-stage rocket carried the crew, the Command/Service Module, and the Lunar Module to Earth orbit and then on to the Moon.`, "The Saturn V was needed to lift the combined spacecraft to lunar orbit.", [], null, "Placed the crew and spacecraft on a translunar trajectory.", "Verified Saturn V performance for the Apollo ${spec.n} mission.", "Saturn V became the most powerful rocket ever flown.", [], null, "Saturn V on pad, liftoff, stage separation, Earth orbit.", [{ kind: "video", title: "Apollo launch footage", detail: `Saturn V, Apollo ${spec.n}` }]),
      mk(`${id}-ch-03`, 3, "ACT I — THE JOURNEY TO THE MOON", "Translunar injection", "Translunar flight", spec.landing - 3 * 86400000, null, "Earth-Moon transfer", "cruise", "After a brief stay in Earth orbit, the S-IVB third stage fired again to send the spacecraft on a translunar trajectory. The crew then separated from the S-IVB and docked with the Lunar Module.", "The spacecraft needed to escape Earth's orbit to reach the Moon.", [], null, "Placed the spacecraft on course for the Moon.", "Demonstrated orbital rendezvous and docking.", "Rendezvous techniques became standard for all crewed missions.", [], null, "Spacecraft traveling along curved trajectory; Earth recedes, Moon grows.", [{ kind: "diagram", title: "Translunar trajectory", detail: "Earth to Moon transfer orbit" }]),
      mk(`${id}-ch-04`, 4, "ACT I — THE JOURNEY TO THE MOON", "Lunar orbit insertion", "Lunar orbit", spec.landing - 1 * 86400000, null, "Lunar orbit", "maneuver", "The spacecraft fired its service propulsion engine to enter lunar orbit. The crew then prepared the Lunar Module for descent to the surface.", "The spacecraft needed to slow down to be captured by the Moon's gravity.", [], null, "Placed the spacecraft in orbit around the Moon.", "Demonstrated lunar orbit insertion and navigation.", "Lunar orbit techniques informed all subsequent lunar missions.", [], null, "Spacecraft approaching Moon, engine firing, entering orbit.", [{ kind: "diagram", title: "Lunar orbit insertion", detail: "Service propulsion engine firing" }]),
      mk(`${id}-ch-05`, 5, "ACT II — THE LUNAR SURFACE", `${lmName} lands`, `${new Date(spec.landing).toISOString().slice(0, 10)} · ${spec.region}`, spec.landing, null, `${spec.region}, Moon`, "landing", `The Lunar Module ${lmName} descended to the surface and touched down in ${spec.region}. The crew reported a safe landing and began preparations for surface operations.`, "The Lunar Module's descent engine had to slow the craft for a safe touchdown on the lunar surface.", [], null, "Placed humans and equipment on the lunar surface.", "Validated the Lunar Module descent and landing system.", "Lunar landing techniques informed all subsequent crewed lunar missions.", [], null, "Lunar Module descending, engine firing, touchdown on the surface.", [{ kind: "animation", title: "Lunar Module descent", detail: `${lmName} landing in ${spec.region}` }]),
      mk(`${id}-ch-06`, 6, "ACT II — THE LUNAR SURFACE", "First moonwalk (EVA 1)", `${new Date(spec.eva).toISOString().slice(0, 10)} · Surface operations`, spec.eva, null, `${spec.region}, Moon`, "eva", "The crew stepped onto the lunar surface and began deploying experiments, including the ALSEP (Apollo Lunar Surface Experiments Package). They collected rock and soil samples and documented the landing site.", "The crew needed to deploy scientific instruments and collect samples during their limited time on the surface.", ["pse", "alsep"], null, "First direct human exploration and scientific investigation of this lunar region.", "Demonstrated EVA operations and experiment deployment on the Moon.", "EVA procedures informed all subsequent crewed lunar missions.", [], null, "Astronauts on the surface, deploying experiments, collecting samples.", [{ kind: "image", title: "First moonwalk", detail: `EVA 1 in ${spec.region}` }]),
      mk(`${id}-ch-07`, 7, "ACT II — THE LUNAR SURFACE", "Surface experiments", "Surface operations", spec.eva + 3600000, null, `${spec.region}, Moon`, "science", "The crew deployed the ALSEP station, which included seismometers, solar wind spectrometers, and other instruments. These experiments continued operating long after the crew departed, transmitting data to Earth until 1977.", "The ALSEP was designed to provide long-term scientific data from the lunar surface.", ["pse", "ase", "sws", "hfe", "lspe", "alsep"], "ALSEP experiments provided years of seismic, heat flow, and solar wind data from the lunar surface.", "Long-term geophysical monitoring of the Moon.", "Demonstrated long-duration surface experiment operations.", "ALSEP design informed future planetary surface experiment packages.", [], null, "Show the ALSEP station, instruments, data transmission.", [{ kind: "diagram", title: "ALSEP station", detail: "Surface experiments deployed" }]),
      mk(`${id}-ch-08`, 8, "ACT III — DEPARTURE AND LEGACY", "Liftoff from the Moon", `${new Date(spec.liftoff).toISOString().slice(0, 10)} · Ascent`, spec.liftoff, null, `${spec.region}, Moon`, "end", "The ascent stage of the Lunar Module lifted off from the Moon, leaving the descent stage and surface experiments behind. The crew rendezvoused with the Command Module in lunar orbit.", "The ascent stage needed to carry the crew back to lunar orbit for the return journey.", [], null, "Completed the surface exploration phase of the mission.", "Demonstrated lunar ascent and rendezvous.", "Lunar ascent techniques informed all subsequent crewed lunar missions.", [], null, "Ascent stage lifting off, leaving descent stage behind.", [{ kind: "text", title: "Liftoff", detail: "Ascent stage departs the Moon" }]),
      mk(`${id}-ch-09`, 9, "ACT III — DEPARTURE AND LEGACY", "Return to Earth", "Trans-Earth injection", spec.liftoff + 2 * 86400000, null, "Earth-Moon transfer", "cruise", "After rendezvous in lunar orbit, the crew fired the service propulsion engine to leave lunar orbit and begin the journey back to Earth. The spacecraft traveled for about three days before re-entering Earth's atmosphere.", "The spacecraft needed to escape lunar orbit and return to Earth.", [], null, "Completed the lunar mission and returned the crew safely.", "Demonstrated trans-Earth injection and re-entry.", "Return techniques informed all subsequent crewed missions.", [], null, "Spacecraft traveling back to Earth, re-entry, splashdown.", [{ kind: "text", title: "Return to Earth", detail: "Trans-Earth injection and re-entry" }]),
      mk(`${id}-ch-10`, 10, "ACT III — DEPARTURE AND LEGACY", "Surface legacy", "1972–present", Date.UTC(1972, 11, 14), null, `${spec.region}, Moon`, "conclusion", `The Lunar Module descent stage and the surface experiments remain where they were left in ${spec.n === 12 ? "1969" : spec.n === 14 ? "1971" : spec.n === 15 ? "1971" : spec.n === 16 ? "1972" : "1972"}. The ALSEP stations transmitted until they were shut down on 30 September 1977. The seismic and heat-flow data are archived and still analysed.`, "The hardware was left behind as part of the mission design.", [], null, "Apollo seismology gave the first direct measurements of the Moon's internal structure.", "Demonstrated long-duration surface experiment operations on the Moon.", "Apollo data continues to inform lunar science today.", [], null, "Show the descent stage, ALSEP station, final position.", [{ kind: "text", title: "Mission complete", detail: `Apollo ${spec.n} surface legacy` }, { kind: "text", title: "Hardware remains", detail: "Descent stage and experiments on the Moon" }]),
    ],
    caseFiles: [],
    mediaIds: [],
    sourceIds: ["nasa-apollo", "alsj", "nssdc-alsep"],
    finalStatus: "INACTIVE HARDWARE",
    legacyStatement: `The Lunar Module descent stage and surface experiments remain in ${spec.region}. Apollo seismology gave the first direct measurements of the Moon's internal structure.`,
    limitedHistory: false,
  };
};

const specs: ApolloSpec[] = [
  { n: 12, lm: "Intrepid", region: "OCEANUS PROCELLARUM", lat: -3.0124, lon: -23.4216, landing: Date.UTC(1969, 10, 19, 6, 54), eva: Date.UTC(1969, 10, 19, 11, 32), liftoff: Date.UTC(1969, 10, 20, 14, 25), summary: "Second crewed landing and the first precision landing, close to the Surveyor 3 spacecraft." },
  { n: 14, lm: "Antares", region: "FRA MAURO HIGHLANDS", lat: -3.6453, lon: -17.4714, landing: Date.UTC(1971, 1, 5, 9, 18), eva: Date.UTC(1971, 1, 5, 14, 42), liftoff: Date.UTC(1971, 1, 6, 18, 48), summary: "Landed in the Fra Mauro highlands, the intended target of the aborted Apollo 13." },
  { n: 15, lm: "Falcon", region: "HADLEY–APENNINE", lat: 26.1322, lon: 3.6298, landing: Date.UTC(1971, 6, 30, 22, 16), eva: Date.UTC(1971, 6, 31, 13, 12), liftoff: Date.UTC(1971, 7, 2, 17, 11), summary: "First mission with the Lunar Roving Vehicle, exploring Hadley Rille and the Apennine Mountains." },
  { n: 16, lm: "Orion", region: "DESCARTES HIGHLANDS", lat: -8.9730, lon: 15.5002, landing: Date.UTC(1972, 3, 21, 2, 23), eva: Date.UTC(1972, 3, 21, 17, 55), liftoff: Date.UTC(1972, 3, 24, 1, 25), summary: "The only Apollo landing in the lunar highlands, with a Lunar Roving Vehicle for exploring the Descartes region." },
  { n: 17, lm: "Challenger", region: "TAURUS–LITTROW VALLEY", lat: 20.1908, lon: 30.7717, landing: Date.UTC(1972, 11, 11, 19, 54), eva: Date.UTC(1972, 11, 11, 23, 54), liftoff: Date.UTC(1972, 11, 14, 22, 55), summary: "The last crewed lunar landing of the Apollo program. Harrison Schmitt became the first geologist on the Moon." },
];

export const apolloJourneys: Record<string, MissionJourney> = {};
for (const spec of specs) {
  apolloJourneys[`apollo-${spec.n}`] = makeApolloJourney(spec);
}

export default apolloJourneys;
