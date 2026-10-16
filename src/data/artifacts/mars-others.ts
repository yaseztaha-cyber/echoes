import type { Artifact, TimelineEvent } from "@/types";
import { merHardware } from "@/data/instruments/mer";
import { DAY_MS, SOL_MS } from "@/lib/time";

const ev = (id: string, t: number, title: string, detail: string, kind: TimelineEvent["kind"], sourceId: string): TimelineEvent => ({ id, t, title, detail, kind, sourceId });

const SPIRIT_LANDING = Date.UTC(2004, 0, 4, 4, 35);
export const spirit: Artifact = {
  id: "spirit",
  name: "SPIRIT",
  designation: "MER-A",
  summary: "Twin of Opportunity. Landed in Gusev crater and climbed into the Columbia Hills, where it found evidence of hot water.",
  destination: "mars",
  type: "rover",
  missionId: "mer",
  missionName: "Mars Exploration Rover",
  model: {
    kind: "mer",
    title: "SPIRIT / MER-A",
    source: "NASA 3D Resources: Mars Exploration Rovers 3D model (MER_static.glb), NASA/JPL-Caltech",
    modelType: "OFFICIAL",
    accuracy: "OFFICIAL NASA GEOMETRY · RUNTIME-LOADED · PRIMITIVE FALLBACK",
    note: "Spirit shares the MER configuration with Opportunity. Official metric-scale geometry with primitive fallback.",
  },
  location: { world: "mars", site: "Columbia Memorial Station", region: "GUSEV CRATER", lat: -14.5718, lon: 175.4785 },
  status: "MISSION COMPLETE",
  dates: { launch: Date.UTC(2003, 5, 10), landing: SPIRIT_LANDING, end: Date.UTC(2011, 4, 25), endLabel: "NASA ended recovery efforts" },
  clock: { rate: SOL_MS * 0.5, range: [Date.UTC(2003, 5, 10), Date.UTC(2011, 4, 25)], kind: "sol" },
  sun: { el: 36, az: 95 },
  terrainSeed: 23,
  hardware: merHardware,
  scientificQuestions: [
    {
      id: "q-gusev",
      question: "Did hot water once shape the Columbia Hills of Gusev crater?",
      recordName: "HOT SPRINGS ON MARS",
      instrumentIds: ["pancam", "minites", "apxs", "mb", "mi", "rat"],
      measurement: { simple: "Chemistry and texture of bright, silica-rich soil near Home Plate.", technical: "APXS elemental data and Mini-TES spectra of silica-rich soils exposed by a wheel dragging through the surface." },
      observations: [{ id: "o1", label: "SILICA-RICH SOIL", detail: "One of Spirit's wheels, which no longer turned properly, dug up bright soil made of nearly pure silica." }],
      evidence: [{ id: "e1", label: "OPALINE SILICA", detail: "Such high-silica deposits on Earth form in hot springs and steam vents (fumaroles).", sourceId: "squyres2008" }],
      interpretation: "A hydrothermal environment — hot water or steam interacting with volcanic rock — existed in Gusev crater. On Earth such environments often host microbial life.",
      layers: {
        explore: "Spirit dug up bright soil that looks like what Earth's hot springs leave behind.",
        understand: "The bright soil was almost pure silica. On Earth that forms where hot water or steam reaches the surface. Mars once had hot, wet places.",
        technical: "Silica-rich (>90 wt% SiO₂) soils near Home Plate, detected by APXS and Mini-TES, are interpreted as hydrothermal or fumarolic alteration products (Squyres et al. 2008).",
      },
      sources: [{ sourceId: "squyres2008", claim: "Silica-rich deposits at Gusev crater." }],
    },
  ],
  timeline: [
    ev("launch", Date.UTC(2003, 5, 10), "LAUNCH", "Delta II launches MER-A toward Mars.", "launch", "nasa-mer"),
    ev("landing", SPIRIT_LANDING, "LANDING IN GUSEV CRATER", "Airbag landing in a crater about 160 km wide.", "landing", "nasa-mer"),
    ev("stuck", Date.UTC(2009, 3, 23), "EMBEDDED IN SOFT SAND", "Wheels break through a crust into loose material near “Troy”.", "incident", "nasa-mer"),
    ev("last", SPIRIT_LANDING + 2210 * SOL_MS, "LAST COMMUNICATION", "Final signal received on sol 2210 (22 March 2010).", "end", "nasa-mer"),
    ev("end", Date.UTC(2011, 4, 25), "RECOVERY EFFORTS ENDED", "NASA ends attempts to re-establish contact.", "end", "nasa-mer"),
  ],
  legacy: {
    physical: "Spirit remains at Troy, in the Gusev crater plains, where it became embedded in soft soil.",
    data: "All Spirit observations are archived in NASA's Planetary Data System.",
    legacy: ["Found evidence of hot-water environments, expanding where scientists look for past habitability.", "Operated for more than 2,200 sols against a 90-sol design life."],
  },
  sources: [{ sourceId: "nasa-mer", claim: "Mission overview, landing, last contact." }, { sourceId: "squyres2008", claim: "Silica discovery." }],
  media: [],
};

const MPF_LANDING = Date.UTC(1997, 6, 4, 16, 57);
export const sojourner: Artifact = {
  id: "sojourner",
  name: "SOJOURNER",
  designation: "MPF",
  summary: "The first wheeled vehicle on another planet. A microwave-oven-sized rover that proved mobile robotics on Mars.",
  destination: "mars",
  type: "rover",
  missionId: "mpf",
  missionName: "Mars Pathfinder",
  model: {
    kind: "sojourner",
    title: "SOJOURNER / MARS PATHFINDER",
    source: "NASA Pathfinder documentation",
    modelType: "RECONSTRUCTED",
    accuracy: "DOCUMENTED REFERENCE · SIMPLIFIED PRIMITIVE GEOMETRY",
    note: "Six-wheeled rover about 65 cm long. Reconstructed geometry, not an official NASA asset.",
  },
  location: { world: "mars", site: "Carl Sagan Memorial Station", region: "ARES VALLIS", lat: 19.13, lon: -33.22 },
  status: "NO LONGER COMMUNICATING",
  dates: { launch: Date.UTC(1996, 11, 4), landing: MPF_LANDING, end: Date.UTC(1997, 8, 27), endLabel: "Last data transmission from the lander" },
  clock: { rate: SOL_MS * 0.5, range: [Date.UTC(1996, 11, 4), Date.UTC(1997, 8, 27)], kind: "sol" },
  sun: { el: 40, az: 120 },
  terrainSeed: 41,
  hardware: [
    {
      id: "apxs", name: "APXS", full: "ALPHA PARTICLE X-RAY SPECTROMETER",
      purpose: "Measures the elements in rocks and soil.", capability: "Mounted at the rear; deployed against rock and soil targets.",
      how: "A radioactive source excites atoms in the target; the X-rays they emit reveal which elements are present.",
      pos: [-0.33, 0.1, 0], view: [-1, 0.5, 0.6], dist: 0.7,
      decode: { full: "ALPHA PARTICLE X-RAY SPECTROMETER", what: "A chemistry sensor placed against rock.", measures: "Elemental composition.", why: "Chemistry reveals what a rock is made of and how it formed." },
    },
    {
      id: "cams", name: "CAMERAS", full: "FRONT STEREO CAMERAS",
      purpose: "Look ahead for navigation and to photograph targets.", capability: "Two front cameras with laser stripe projectors for hazard detection; a rear colour camera.",
      how: "Stereo images and laser lines show terrain shape so operators on Earth can plan each short drive.",
      pos: [0.3, 0.22, 0], view: [1, 0.3, 0.5], dist: 0.8,
      decode: { full: "STEREO IMAGING SYSTEM", what: "Cameras on the front of the rover.", measures: "Terrain shape and rock positions.", why: "A rover can only move as safely as it can see." },
    },
    {
      id: "wae", name: "WAE", full: "WHEEL ABRASION EXPERIMENT",
      purpose: "Uses a wheel to learn about the hardness and abrasiveness of the soil.", capability: "Sensors in the wheel measure how thin films wear as the wheel rolls.",
      how: "Engineers observed wear on test materials mounted on a wheel to infer properties of the surface.",
      pos: [0.2, 0.065, 0.26], view: [0.4, 0.3, 1], dist: 0.7,
      decode: { full: "WHEEL ABRASION EXPERIMENT", what: "An experiment that uses a rover wheel as a tool.", measures: "How much the surface abrades thin films on the wheel.", why: "Knowing how abrasive soil is helps design future mechanisms." },
    },
  ],
  scientificQuestions: [
    {
      id: "q-pathfinder",
      question: "What are the rocks and soil of Ares Vallis made of?",
      recordName: "FIRST ROCK CHEMISTRY ON THE MOVE",
      instrumentIds: ["apxs", "cams"],
      measurement: { simple: "Elements in rocks and soil next to the lander.", technical: "In situ APXS elemental analyses of rocks and soils within metres of the lander." },
      observations: [{ id: "o1", label: "ROCK AND SOIL MEASUREMENTS", detail: "The rover placed its APXS on multiple rocks and soils, measuring their composition for the first time from the surface of Mars with a mobile instrument." }],
      evidence: [{ id: "e1", label: "ELEMENTAL COMPOSITION", detail: "Compositions differed between rock and soil; analysis is affected by dust and weathering coatings on rock surfaces.", sourceId: "nasa-mpf" }],
      interpretation: "A mobile robot can reach multiple targets and compare them. Pathfinder showed that surface chemistry must be interpreted with care, because dust and weathered coatings can bias what an instrument sees.",
      layers: {
        explore: "Sojourner touched real Martian rocks and measured what they are made of.",
        understand: "By moving between rocks, the rover compared different targets. It also taught scientists that dust on rocks can hide what is beneath — a lesson later rovers solved by grinding.",
        technical: "APXS spectra from Pathfinder targets were influenced by surface dust and weathering rinds; later missions added abrasion tools (e.g. the MER Rock Abrasion Tool) to expose fresh rock.",
      },
      sources: [{ sourceId: "nasa-mpf", claim: "Sojourner APXS measurements and lessons." }],
    },
  ],
  timeline: [
    ev("launch", Date.UTC(1996, 11, 4), "LAUNCH", "Pathfinder launches on a Delta II.", "launch", "nasa-mpf"),
    ev("landing", MPF_LANDING, "LANDING IN ARES VALLIS", "Pathfinder lands with airbags; Sojourner rolls out onto the surface days later.", "landing", "nasa-mpf"),
    ev("end", Date.UTC(1997, 8, 27), "LAST DATA TRANSMISSION", "The final transmission from the Pathfinder lander is received.", "end", "nasa-mpf"),
  ],
  legacy: {
    physical: "Sojourner and the Pathfinder lander remain in Ares Vallis.",
    data: "Images and APXS spectra are archived in the Planetary Data System.",
    legacy: ["Proved that a low-cost rover could drive and do science on Mars.", "Its design heritage led to the larger MER rovers."],
  },
  sources: [{ sourceId: "nasa-mpf", claim: "Mission overview and rover description." }],
  media: [],
};

const INSIGHT_LANDING = Date.UTC(2018, 10, 26, 19, 52);
export const insight: Artifact = {
  id: "insight",
  name: "INSIGHT",
  designation: "INSIGHT",
  summary: "A stationary geophysics lab that listened to Mars shake and measured the planet's core.",
  destination: "mars",
  type: "lander",
  missionId: "insight",
  missionName: "InSight",
  model: {
    kind: "insight",
    title: "INSIGHT LANDER",
    source: "NASA InSight documentation",
    modelType: "RECONSTRUCTED",
    accuracy: "DOCUMENTED REFERENCE · SIMPLIFIED PRIMITIVE GEOMETRY",
    note: "Reconstructed geometry, not an official NASA asset.",
  },
  location: { world: "mars", site: "InSight landing site", region: "ELYSIUM PLANITIA", lat: 4.5, lon: 135.62 },
  status: "MISSION COMPLETE",
  dates: { launch: Date.UTC(2018, 4, 5), landing: INSIGHT_LANDING, end: Date.UTC(2022, 11, 21), endLabel: "NASA ended the mission" },
  clock: { rate: SOL_MS * 0.5, range: [Date.UTC(2018, 4, 5), Date.UTC(2022, 11, 21)], kind: "sol" },
  sun: { el: 38, az: 90 },
  terrainSeed: 57,
  hardware: [
    {
      id: "seis", name: "SEIS", full: "SEISMIC EXPERIMENT FOR INTERIOR STRUCTURE",
      purpose: "Listens for marsquakes and meteorite impacts.", capability: "A very sensitive seismometer placed on the ground by the robotic arm and covered by a wind and thermal shield.",
      how: "Seismic waves bend and reflect inside Mars. Their travel times reveal layers such as crust, mantle and core.",
      pos: [1.55, 0.2, 0.9], view: [0.8, 0.6, 1], dist: 1.9,
      decode: { full: "SEISMIC EXPERIMENT FOR INTERIOR STRUCTURE", what: "A seismometer on the Martian surface.", measures: "Ground motion from marsquakes and impacts.", why: "Seismic waves are the best tool for seeing inside a planet." },
    },
    {
      id: "hp3", name: "HP3", full: "HEAT FLOW AND PHYSICAL PROPERTIES PACKAGE",
      purpose: "Meant to measure heat flowing out of Mars.", capability: "A self-hammering probe (the “mole”) designed to burrow several metres.",
      how: "The probe was designed to trail temperature sensors into the ground. The soil did not provide enough friction and the mole could not penetrate as planned.",
      pos: [-1.3, 0.1, 1.0], view: [-0.7, 0.6, 1], dist: 1.8,
      decode: { full: "HEAT FLOW AND PHYSICAL PROPERTIES PACKAGE", what: "A burrowing temperature probe.", measures: "Subsurface temperature and thermal properties.", why: "Heat flow reveals how much heat Mars retains from its formation." },
    },
    {
      id: "ida", name: "IDA", full: "INSTRUMENT DEPLOYMENT ARM",
      purpose: "Places instruments on the ground.", capability: "A robotic arm about 2.4 m long with a grapple and cameras.",
      how: "The arm picked up SEIS and HP3 from the deck and set them down in precise positions on the surface.",
      pos: [0.5, 1.0, 0.0], view: [1, 0.5, 0.8], dist: 2.4,
      decode: { full: "INSTRUMENT DEPLOYMENT ARM", what: "The lander's robotic arm.", measures: "Not applicable — it positions the instruments.", why: "Seismometers work best when set directly on the ground." },
    },
  ],
  scientificQuestions: [
    {
      id: "q-interior",
      question: "What is the inside of Mars like?",
      recordName: "THE HEART OF MARS",
      instrumentIds: ["seis", "ida"],
      measurement: { simple: "Vibrations from marsquakes as they pass through the planet.", technical: "Broadband seismic waveforms from marsquakes and impacts, used to constrain crust, mantle and core structure." },
      observations: [{ id: "o1", label: "MORE THAN 1,300 MARSQUAKES", detail: "SEIS recorded over 1,300 marsquakes during the mission, including one of about magnitude 5 in May 2022." }],
      evidence: [{ id: "e1", label: "CORE RADIUS ≈ 1,830 km", detail: "Waves reflected from the core boundary imply a liquid core with a radius of about 1,830 ± 40 km.", sourceId: "stahler2021" }],
      interpretation: "Mars has a liquid core that is larger — and therefore less dense — than expected, which means it contains more light elements than a pure iron-nickel core.",
      layers: {
        explore: "InSight listened to the planet shake. The echoes showed that Mars has a big, liquid core.",
        understand: "Marsquake waves bounce off layers inside Mars. By timing the echoes, scientists measured the crust, the mantle, and the size of the core.",
        technical: "Core-reflected seismic phases give a core radius of 1,830 ± 40 km and a density lower than a pure Fe–Ni composition would imply, indicating light-element alloying (Stähler et al. 2021).",
      },
      sources: [{ sourceId: "stahler2021", claim: "Seismic detection of the martian core." }],
    },
  ],
  timeline: [
    ev("launch", Date.UTC(2018, 4, 5), "LAUNCH", "InSight launches on an Atlas V from Vandenberg.", "launch", "nasa-insight"),
    ev("landing", INSIGHT_LANDING, "LANDING IN ELYSIUM PLANITIA", "The lander touches down on a flat, smooth plain.", "landing", "nasa-insight"),
    ev("quake", Date.UTC(2019, 3, 6), "FIRST MARSQUAKE DETECTED", "SEIS records the first clear marsquake.", "science", "nasa-insight"),
    ev("big", Date.UTC(2022, 4, 4), "LARGEST QUAKE OF THE MISSION", "A quake of about magnitude 5 is recorded.", "science", "nasa-insight"),
    ev("end", Date.UTC(2022, 11, 21), "MISSION ENDED", "After two missed communication sessions as dust covered the solar panels, NASA ends the mission.", "end", "nasa-insight"),
  ],
  legacy: {
    physical: "InSight stands in Elysium Planitia, its solar panels covered in dust, SEIS still sitting on the ground.",
    data: "Seismic data are open in public archives and still being analysed.",
    legacy: ["First direct seismic measurement of the size of a planet's core other than Earth's.", "Established Mars's seismic background and quake rate."],
  },
  sources: [{ sourceId: "nasa-insight", claim: "Mission overview." }, { sourceId: "stahler2021", claim: "Core radius." }],
  media: [],
};

export const _marsOthersDay = DAY_MS;
