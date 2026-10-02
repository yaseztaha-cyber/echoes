import type { Artifact, TimelineEvent, Waypoint } from "@/types";
import { merHardware } from "@/data/instruments/mer";
import { MEDIA } from "@/data/media";
import { SOL_MS, solToT } from "@/lib/time";

const LANDING = Date.UTC(2004, 0, 25, 5, 5);
const S = (sol: number) => solToT(sol, LANDING);

const ev = (id: string, sol: number | null, t: number | null, title: string, detail: string, kind: TimelineEvent["kind"], sourceId: string, waypointId?: string): TimelineEvent => ({
  id, t: t ?? S(sol as number), title, detail, kind, sourceId, waypointId,
});

// Approximate waypoint positions (metres east / south of the landing point). Reconstructed for visualisation.
const wp = (id: string, name: string, sol: number, x: number, z: number): Waypoint => ({ id, name, x, z, t: S(sol) });

const LAST_SOL = 5111;

export const opportunity: Artifact = {
  id: "opportunity",
  name: "OPPORTUNITY",
  designation: "MER-B",
  summary: "A solar-powered geologist on wheels. Designed for 90 sols, it worked for more than 5,000 and drove a marathon on Mars.",
  destination: "mars",
  type: "rover",
  missionId: "mer",
  missionName: "Mars Exploration Rover",
  model: {
    kind: "mer",
    title: "OPPORTUNITY / MER-B",
    source: "NASA mission documentation and rover self-portraits (PIA07372, PIA17759)",
    modelType: "RECONSTRUCTED",
    accuracy: "DOCUMENTED REFERENCE · SIMPLIFIED PRIMITIVE GEOMETRY",
    note: "Proportions follow published rover dimensions (about 1.6 m long, 2.3 m wide, 1.5 m tall). An official NASA model has not been integrated; this is not an official asset.",
  },
  location: { world: "mars", site: "Eagle crater landing site", region: "MERIDIANI PLANUM", lat: -1.9462, lon: 354.4734, landmark: "Eagle crater" },
  status: "MISSION COMPLETE",
  dates: { launch: Date.UTC(2003, 6, 7, 3, 18), landing: LANDING, end: S(5352), endLabel: "Mission declared complete (sol 5352)" },
  clock: { rate: SOL_MS * 0.5, range: [Date.UTC(2003, 6, 7), S(5352) + SOL_MS * 20], kind: "sol" },
  sun: { el: 34, az: 100 },
  terrainSeed: 7,
  hardware: merHardware,
  scientificQuestions: [
    {
      id: "q-water",
      question: "Was there ever liquid water at Meridiani Planum?",
      recordName: "ANCIENT MARTIAN WATER",
      instrumentIds: ["pancam", "navcam", "minites", "rat", "mi", "apxs", "mb"],
      measurement: {
        simple: "Pictures and chemical fingerprints of rock layers, tiny spheres and minerals.",
        technical: "Multispectral imaging (≈400–1,100 nm), microscopic imaging at ≈31 µm/pixel, iron-phase identification by Mössbauer spectroscopy, and elemental analysis by APXS.",
      },
      observations: [
        { id: "o1", label: "LAYERED, SULFATE-RICH BEDROCK", detail: "Outcrop rocks at Eagle and Endurance craters were finely layered and rich in sulfur and magnesium salts.", mediaId: "media-pia15091" },
        { id: "o2", label: "HEMATITE SPHERULES — “BLUEBERRIES”", detail: "Small round grains embedded in the rock and loose on the ground, rich in the iron oxide mineral hematite.", mediaId: "media-pia05273" },
        { id: "o3", label: "JAROSITE SIGNATURE", detail: "The Mössbauer spectrometer detected jarosite, an iron sulfate mineral that forms in acidic, water-rich conditions." },
      ],
      evidence: [
        { id: "e1", label: "SULFATE SALT CHEMISTRY", detail: "APXS measured high sulfur with magnesium, calcium and iron sulfates in outcrop rocks — consistent with evaporation and alteration by water.", sourceId: "rieder2004" },
        { id: "e2", label: "JAROSITE MINERALOGY", detail: "Jarosite is a mineral that requires water to form. Its presence indicates an acidic, oxidising aqueous environment.", sourceId: "klingelhofer2004" },
        { id: "e3", label: "CROSS-BEDDING + CONCRETIONS", detail: "Ripple-like cross-bedding and concretion-like spherules point to sediment laid down by moving water and altered by groundwater.", sourceId: "squyres2004" },
      ],
      interpretation: "Meridiani Planum once hosted an environment with liquid water at or near the surface — salty, acidic, and at times flowing. The rocks record water that did not just pass through, but shaped and chemically altered the land.",
      layers: {
        explore: "Opportunity found rock layers and small stone balls that form where water is present. Mars once had liquid water here.",
        understand: "Rock layers carried ripple patterns left by moving water. The ground was full of salty minerals such as sulfates and jarosite, and tiny iron-rich spheres grew inside the rock as groundwater soaked through. Together they say water was here long enough to leave a lasting record.",
        technical: "APXS elemental data, Mössbauer detection of jarosite [KFe₃(SO₄)₂(OH)₆], and Microscopic Imager morphology of hematite concretions jointly constrain an aqueous, acidic, oxidising depositional and diagenetic environment (Squyres et al. 2004; Klingelhöfer et al. 2004; Rieder et al. 2004). Sedimentary structures indicate both subaqueous and eolian transport (Grotzinger et al. 2005).",
      },
      sources: [
        { sourceId: "squyres2004", claim: "Meridiani outcrop records an ancient aqueous environment." },
        { sourceId: "klingelhofer2004", claim: "Jarosite detected at Meridiani Planum." },
        { sourceId: "rieder2004", claim: "Outcrop is sulfur-rich." },
      ],
    },
    {
      id: "q-esperance",
      question: "What does the rock 'Esperance' record about ancient Martian water?",
      recordName: "ESPERANCE CASE FILE",
      instrumentIds: ["pancam", "rat", "mi", "apxs"],
      measurement: {
        simple: "A pale rock photographed by Pancam, scraped clean by the RAT, then chemically fingerprinted by APXS.",
        technical: "Pancam 3-exposure false-color composite (sol 3230); RAT abrasion at target point Esperance6; APXS elemental composition compared against other Meridiani rocks examined over nine-plus years.",
      },
      observations: [
        { id: "o1", label: "PALE ROCK IMAGED · SOL 3230", detail: "Pancam composite shows 'Esperance', about 70 cm across, near Matijevic Hill. Three exposures through different filters, presented in false color to separate materials. 23 February 2013.", mediaId: "media-pia17074" },
        { id: "o2", label: "RAT EXPOSES ESPERANCE6", detail: "The rock abrasion tool ground away surface material at the target point 'Esperance6' so the contact instruments could measure fresh rock instead of dust and weathering rind.", mediaId: "media-pia17074-fig" },
        { id: "o3", label: "APXS MEASURES COMPOSITION", detail: "The alpha particle X-ray spectrometer identified chemical elements in the abraded spot: higher aluminium and silica, lower calcium and iron than other rocks Opportunity had examined.", mediaId: "media-pia17074-fig" },
      ],
      evidence: [
        { id: "e1", label: "AL- AND SI-RICH, CA- AND FE-POOR", detail: "Esperance6 composition stands apart from every other Meridiani rock in nine years of APXS data — enriched in aluminium and silica, depleted in calcium and iron.", sourceId: "pia17074" },
        { id: "e2", label: "PRELIMINARY CLAY INTERPRETATION", detail: "NASA's preliminary interpretation points to clay mineral content produced by intensive alteration by water. Stated as preliminary — a working reading, not a final verdict.", sourceId: "pia17074" },
      ],
      interpretation: "Esperance looks like a rock that water attacked hard enough to leave clay minerals behind — the most water-altered chemistry Opportunity found at Meridiani. NASA states this as a preliminary interpretation: consistent with intense aqueous alteration, still open to refinement.",
      layers: {
        explore: "This pale rock may hold clay — and clay means water worked on it for a long time.",
        understand: "HOW TO READ THIS IMAGE: the colors are false color, exaggerated on purpose so different rock materials stand out — Mars does not look like this to human eyes. Pancam took the same view through three different color filters and combined them. The RAT then scraped a clean spot (Esperance6), and APXS read its chemistry: lots of aluminium and silica, little calcium and iron. That recipe matches clay minerals, which form when water soaks rock thoroughly.",
        technical: "Pancam false-color composite PIA17074 (sol 3230, Feb 2013); RAT abrasion + APXS at Esperance6 (inspected May 2013). Enrichment in Al/Si with Ca/Fe depletion relative to the Meridiani APXS dataset; preliminary interpretation as clay-bearing, intensively water-altered material (NASA Photojournal PIA17074). Compare with the acidic Burns formation (q-water) and near-neutral Endeavour rim (q-endeavour) for the site's full water-chemistry range.",
      },
      sources: [
        { sourceId: "pia17074", claim: "Esperance6 chain: Pancam image, RAT abrasion, APXS composition, preliminary clay interpretation." },
        { sourceId: "nasa-mer-instruments", claim: "Pancam/RAT/APXS operating principles and specifications." },
      ],
      trace: [
        { kind: "image", title: "REAL IMAGE · PANCAM SOL 3230", detail: "False-color composite of 'Esperance', ~70 cm across. Three exposures through different filters.", mediaId: "media-pia17074", sourceId: "pia17074" },
        { kind: "target", title: "TARGET · ESPERANCE6", detail: "A point on the pale rock near Matijevic Hill, chosen for contact science. See the annotated target map.", mediaId: "media-pia17074-fig", sourceId: "pia17074" },
        { kind: "action", title: "RAT ABLATES THE SURFACE", detail: "The rock abrasion tool grinds away dust and weathered rind, exposing fresh mineral surface for analysis.", sourceId: "nasa-mer-instruments" },
        { kind: "measurement", title: "APXS MEASURES ELEMENTS", detail: "Alpha particles and X-rays from a curium-244 source make atoms in the rock emit X-rays unique to each element. Hours of accumulation give the composition.", sourceId: "nasa-mer-instruments" },
        { kind: "observation", title: "OBSERVATION · AL/SI HIGH, CA/FE LOW", detail: "Higher aluminium and silica, lower calcium and iron than any other rock Opportunity examined in nine-plus years on Mars.", sourceId: "pia17074" },
        { kind: "evidence", title: "EVIDENCE · UNUSUAL CHEMISTRY", detail: "The composition stands apart from the full Meridiani APXS dataset — something altered this rock more intensely than its surroundings.", sourceId: "pia17074" },
        { kind: "interpretation", title: "INTERPRETATION · WATER-ALTERED CLAY (PRELIMINARY)", detail: "NASA's preliminary interpretation: clay mineral content from intensive alteration by water. Preliminary — the working reading, stated with its uncertainty intact.", sourceId: "pia17074" },
      ],
    },
    {
      id: "q-endeavour",
      question: "What kind of water chemistry is recorded at the rim of Endeavour crater?",
      recordName: "OLDER, GENTLER WATER",
      instrumentIds: ["pancam", "navcam", "minites", "rat", "mi", "apxs"],
      measurement: {
        simple: "Close-up pictures and chemistry of rocks on the crater rim.",
        technical: "APXS elemental composition and Microscopic Imager textures of rim rocks, combined with orbital spectral mapping.",
      },
      observations: [
        { id: "o1", label: "CALCIUM-SULFATE VEINS", detail: "Bright, narrow veins cut through rocks on the rim at Cape York — material deposited from fluids moving through fractures." },
        { id: "o2", label: "CLAY-MINERAL SIGNATURE", detail: "Rim material at Cape York contains aluminium-rich smectite clay, identified with combined orbital and surface data." },
      ],
      evidence: [
        { id: "e1", label: "CA-SULFATE VEINS", detail: "Veins record water flowing through fractured rim rock after the impact.", sourceId: "squyres2012" },
        { id: "e2", label: "SMECTITE CLAY", detail: "Smectite clays typically form in water that is less acidic — closer to neutral pH — than the water that shaped the Burns formation.", sourceId: "arvidson2014" },
      ],
      interpretation: "Endeavour's rim preserves an older record of water than the plains do, with chemistry closer to neutral — a type of environment potentially more habitable than the acidic waters of Meridiani.",
      layers: {
        explore: "On the crater rim Opportunity found clay minerals — a sign of gentler water than the salty, acidic water found on the plains.",
        understand: "Veins and clays on the rim of Endeavour crater tell of a different, older period of water on Mars. Clays form where water is not very acidic, and that is a friendlier kind of water for chemistry that could support life.",
        technical: "Ca-sulfate veins at Cape York (Squyres et al. 2012) and Al-rich smectite detected in rim material (Arvidson et al. 2014) indicate fluid-rock interaction at near-neutral pH, in contrast to the acidic Burns formation.",
      },
      sources: [
        { sourceId: "squyres2012", claim: "Ca-sulfate veins record aqueous processes at Endeavour." },
        { sourceId: "arvidson2014", claim: "Endeavour rim hosts smectite, implying near-neutral water." },
      ],
    },
    {
      id: "q-wind",
      question: "How did wind shape the plains of Meridiani?",
      recordName: "WIND-BLOWN PLAINS",
      instrumentIds: ["pancam", "navcam", "mi"],
      measurement: {
        simple: "Pictures of ripples, layers and sand across the plains and in crater walls.",
        technical: "Stereo imaging of sedimentary structures and microscopic imaging of grain texture.",
      },
      observations: [
        { id: "o1", label: "RIPPLE FIELDS", detail: "The plains are covered in wind-driven sand ripples. In 2005 the rover became embedded in the Purgatory dune from sol 446 until sol 484." },
        { id: "o2", label: "CROSS-STRATIFIED OUTCROP", detail: "Layers in Endurance crater walls show stratification consistent with migrating dunes and sand sheets, with wetter interdune deposits above.", mediaId: "media-pia06263" },
      ],
      evidence: [
        { id: "e1", label: "DRY-TO-WET SEQUENCE", detail: "The Burns formation records eolian (wind) deposition at the base, with increasing evidence of surface water higher in the sequence.", sourceId: "grotzinger2005" },
      ],
      interpretation: "Meridiani did not have one constant climate. Dry, wind-driven sand and wetter interdune conditions alternated through time.",
      layers: {
        explore: "Wind built dunes here — but layers higher in the cliff show water came back.",
        understand: "The lower layers look like sand dunes frozen in rock. Higher layers look like they were deposited in damp or flooded ground between dunes. Mars's climate changed through time.",
        technical: "Burns formation facies include eolian dune and sand-sheet deposits transitioning to interdune playa deposits with evidence for a rising water table (Grotzinger et al. 2005).",
      },
      sources: [{ sourceId: "grotzinger2005", claim: "Burns formation is a dry-to-wet eolian depositional system." }],
    },
  ],
  timeline: [
    ev("launch", null, Date.UTC(2003, 6, 7, 3, 18), "LAUNCH", "A Delta II rocket lifts off from Cape Canaveral carrying MER-B on a seven-month cruise to Mars.", "launch", "nasa-mer"),
    ev("landing", 0, null, "LANDING AT MERIDIANI PLANUM", "Airbag landing inside a small crater, later named Eagle, about 22 m across.", "landing", "nasa-mer", "eagle"),
    ev("water", null, Date.UTC(2004, 2, 2), "EVIDENCE OF PAST WATER", "NASA announces that Meridiani Planum bedrock was altered by liquid water.", "science", "squyres2004", "eagle"),
    ev("endurance", 131, null, "ENTERS ENDURANCE CRATER", "The rover drives into a crater about 130 m across to read layers in its wall.", "drive", "nasa-mer", "endurance"),
    ev("burns", 287, null, "TARGET: BURNS CLIFF", "Opportunity examines layered outcrop at Burns Cliff, inside Endurance crater.", "science", "grotzinger2005", "burns"),
    ev("heatshield", 339, null, "HEAT SHIELD ROCK", "The rover examines an iron-nickel meteorite — the first meteorite identified on another planet.", "science", "nasa-mer", "heatshield"),
    ev("purgatory", 446, null, "EMBEDDED IN PURGATORY DUNE", "Wheels sink into loose sand. Engineers spend weeks working the rover free (until sol 484).", "incident", "nasa-mer", "purgatory"),
    ev("victoria", 951, null, "ARRIVES AT VICTORIA CRATER", "After more than two years of driving south, the rover reaches the rim of a crater roughly 730 m wide.", "drive", "nasa-mer", "victoria"),
    ev("victoria-exit", 1634, null, "LEAVES VICTORIA", "Opportunity departs Victoria to begin a long drive toward Endeavour crater.", "drive", "nasa-mer", "victoria-exit"),
    ev("endeavour", 2681, null, "ARRIVES AT ENDEAVOUR CRATER", "The rover reaches the rim of a crater about 22 km across, with older rocks than the plains.", "drive", "arvidson2014", "capeyork"),
    ev("esperance", 3230, null, "TARGET: ESPERANCE", "At Matijevic Hill, Pancam images the pale rock 'Esperance'. The RAT exposes target Esperance6 and APXS measures aluminium- and silica-rich chemistry — a preliminary sign of water-altered clay.", "science", "pia17074"),
    ev("marathon", 3967, null, "A MARATHON ON MARS", "Cumulative driving distance passes 42.195 km — a marathon.", "drive", "nasa-mer", "marathon"),
    ev("last", LAST_SOL, null, "LAST COMMUNICATION", "The final signal arrives on 10 June 2018, as a planet-encircling dust storm blocks sunlight.", "end", "nasa-opp-end", "perseverance"),
    ev("complete", 5352, null, "MISSION DECLARED COMPLETE", "After repeated attempts to contact the rover, NASA declares the mission complete.", "end", "nasa-opp-end", "perseverance"),
  ],
  missionPath: {
    note: "ROUTE RECONSTRUCTED · waypoint positions are approximate and shown for orientation, not surveyed.",
    waypoints: [
      wp("eagle", "EAGLE CRATER", 0, 0, 0),
      wp("endurance", "ENDURANCE CRATER", 131, 330, 640),
      wp("burns", "BURNS CLIFF", 287, 395, 705),
      wp("heatshield", "HEAT SHIELD ROCK", 339, 260, 1250),
      wp("purgatory", "PURGATORY DUNE", 446, 900, 3400),
      wp("victoria", "VICTORIA CRATER", 951, 1500, 5900),
      wp("victoria-exit", "VICTORIA EXIT", 1634, 1700, 5800),
      wp("capeyork", "CAPE YORK · ENDEAVOUR RIM", 2681, 4800, 17100),
      wp("marathon", "MARATHON VALLEY", 3967, 5300, 20300),
      wp("perseverance", "PERSEVERANCE VALLEY · LAST KNOWN", LAST_SOL, 5150, 21600),
    ],
  },
  legacy: {
    physical: "The rover remains where it stopped, in Perseverance Valley on the rim of Endeavour crater, still and dust-covered. It has not been recovered and will not be.",
    data: "Every image and measurement the rover sent is archived in NASA's Planetary Data System, open to anyone. NASA reports more than 217,000 images returned, including 15 full 360-degree colour panoramas, across more than 5,000 sols.",
    legacy: [
      "Showed from the surface that Mars once had long-lived liquid water, turning a hypothesis from orbit into measured evidence.",
      "Demonstrated that solar-powered rovers can operate for more than a decade, changing expectations for later missions.",
      "Its results shaped how later rovers, including Curiosity and Perseverance, are designed to investigate habitability.",
    ],
  },
  sources: [
    { sourceId: "nasa-mer", claim: "Rover design, landing, timeline of major drives." },
    { sourceId: "nasa-mer-instruments", claim: "Instrument specs, calibration systems, operating principles." },
    { sourceId: "pia17074", claim: "Esperance investigation: image, RAT, APXS, interpretation." },
    { sourceId: "nasa-opp-end", claim: "Last communication on sol 5111; mission declared complete." },
    { sourceId: "squyres2004", claim: "Evidence for an ancient aqueous environment." },
    { sourceId: "nasa-3d", claim: "Official model availability (not yet integrated)." },
  ],
  media: MEDIA.filter((m) => m.artifactId === "opportunity"),
};
