/** Media references used by the Opportunity cinematic journey. */
export const OPPORTUNITY_MEDIA = {
  LAUNCH_STILL: "media-launch-still",
  EDL_ANIMATION: "media-edl-animation",
  FIRST_IMAGES: "media-pia05138",
  ROLLOFF: "media-rolloff",
  BERRY_BOWL: "media-pia05273",
  ENDURANCE: "media-pia06263",
  BURNS_CLIFF: "media-pia15091",
  HEAT_SHIELD_ROCK: "media-heat-shield-rock",
  PURGATORY: "media-purgatory",
  VICTORIA: "media-pia08812",
  ESPERANCE: "media-pia17074",
  ESPERANCE_FIG: "media-pia17074-fig",
  SELF_PORTRAIT_2005: "media-pia07372",
  SELF_PORTRAIT_2014: "media-pia17759",
  MARATHON: "media-marathon",
  FINAL_IMAGE: "media-final-image",
} as const;

/** 23-chapter Opportunity mission journey. Each chapter has full structured content
 *  for the cinematic hologram engine: narrative, instruments, significance, media,
 *  camera behavior, and hologram reveal sequence. */
export const OPPORTUNITY_JOURNEY: MissionChapter[] = [

  /* ACT I — THE JOURNEY FROM EARTH */
  {
    id: "opp-ch-01",
    sequence: 1,
    act: "ACT I — THE JOURNEY FROM EARTH",
    title: "The reason for the mission",
    date: "2000–2003 · CONCEPT AND DEVELOPMENT",
    dateUtc: Date.UTC(2000, 0, 1),
    sol: null,
    location: "Earth · NASA centers",
    eventType: "development",
    narrative:
      "NASA wanted to investigate whether ancient Mars had environments where liquid water had existed and whether those environments might have been habitable. The landing site was chosen partly because orbiting observations showed crystalline hematite, a mineral commonly associated with water-related processes.",
    whyHappened:
      "Scientists wanted to move beyond viewing Mars from orbit and investigate rocks directly on the surface.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mb", "mi", "rat"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Defined the scientific objectives that drove instrument selection, landing-site choice, and the entire mission architecture.",
    engineeringSignificance:
      "Established the dual-rover strategy (Spirit and Opportunity) to hedge against launch or landing failure.",
    futureMissions:
      "Set the template for later rovers (Curiosity, Perseverance) to follow the water and seek signs of past habitability.",
    media: ["/media/missions/opportunity/journey/ksc-03pd2090.webp"],
    caseFileId: null,
    cameraBehavior: "Orbital view of Earth, transitioning to Mars approach; instrument diagrams fade in.",
    hologramSequence: [
      { kind: "title", title: "WHY WE WENT", detail: "Follow the water on Mars" },
      { kind: "diagram", title: "MER spacecraft architecture", detail: "Rover, cruise stage, aeroshell, lander" },
      { kind: "text", title: "Design life: 90 sols", detail: "Actual operations: 5,111 sols" },
    ],
  },
  {
    id: "opp-ch-02",
    sequence: 2,
    act: "ACT I — THE JOURNEY FROM EARTH",
    title: "Delta II Heavy launch",
    date: "7 July 2003 · Cape Canaveral",
    dateUtc: Date.UTC(2003, 6, 7, 23, 18, 15),
    sol: null,
    location: "Cape Canaveral Air Force Station, SLC-17B, Florida",
    eventType: "launch",
    narrative:
      "Opportunity launched aboard a Delta II Heavy rocket at 11:18:15 p.m. EDT from Space Launch Complex 17B. Its launch vehicle was the Delta 7925H. The spacecraft separated from the rocket's third stage approximately 83 minutes after liftoff.",
    whyHappened:
      "The rover needed to escape Earth's gravity and begin its interplanetary trajectory to Mars.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance: "Placed the rover on its way to Mars; no science data yet.",
    engineeringSignificance:
      "Verified launch vehicle performance and spacecraft separation for the MER-B spacecraft.",
    futureMissions: "Launch architecture informed later Mars missions including Curiosity and Perseverance.",
    media: [OPPORTUNITY_MEDIA.LAUNCH_STILL, "/media/missions/opportunity/journey/ksc-03pd2090.webp"],
    caseFileId: null,
    cameraBehavior: "Rocket on pad, liftoff, stage separation, spacecraft drifting away from Earth.",
    hologramSequence: [
      { kind: "video", title: "MER-B launch footage", detail: "Delta II Heavy, 7 July 2003, SLC-17B" },
      { kind: "text", title: "Separation", detail: "83 minutes after liftoff" },
    ],
  },
  {
    id: "opp-ch-03",
    sequence: 3,
    act: "ACT I — THE JOURNEY FROM EARTH",
    title: "Spacecraft separation and cruise",
    date: "July 2003 – January 2004 · Cruise",
    dateUtc: Date.UTC(2003, 9, 15),
    sol: null,
    location: "Interplanetary space · Earth to Mars transfer",
    eventType: "cruise",
    narrative:
      "The spacecraft traveled for approximately six months toward Mars. During cruise, the spacecraft maintained its trajectory, communicated with Earth through the Deep Space Network, and received navigation corrections. NASA's mission record documents a 156-day cruise for Opportunity.",
    whyHappened:
      "Engineers had to deliver a spacecraft to a moving planetary target millions of kilometers away.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance: "No surface science yet; cruise was purely operational.",
    engineeringSignificance:
      "Demonstrated deep-space navigation, course correction, and communications over interplanetary distances.",
    futureMissions: "Cruise navigation techniques reused by all subsequent Mars missions.",
    media: ["/media/missions/opportunity/journey/ksc-03pd2090.webp"],
    caseFileId: null,
    cameraBehavior: "Spacecraft traveling along curved trajectory; Earth recedes, Mars grows; DSN comms link pulses.",
    hologramSequence: [
      { kind: "diagram", title: "Earth-Mars transfer orbit", detail: "156-day cruise" },
      { kind: "text", title: "Deep Space Network", detail: "Continuous communication link" },
    ],
  },
  {
    id: "opp-ch-04",
    sequence: 4,
    act: "ACT I — THE JOURNEY FROM EARTH",
    title: "Final course correction",
    date: "16 January 2004 · Pre-entry",
    dateUtc: Date.UTC(2004, 0, 16),
    sol: null,
    location: "Approaching Mars",
    eventType: "maneuver",
    narrative:
      "The spacecraft performed its final documented course correction before entering the Martian atmosphere. Its entry and landing system would have to transform an extremely fast atmospheric arrival into a safe surface landing using a heat shield, parachute, retrorockets, and airbags.",
    whyHappened:
      "A successful cruise was not enough. The entire mission depended on surviving the final descent.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance: "Positioned the spacecraft for entry at the Meridiani Planum target.",
    engineeringSignificance: "Final trajectory refinement before the EDL sequence.",
    futureMissions: "Course correction procedures became standard for all Mars landers.",
    media: ["/media/missions/opportunity/journey/ksc-03pd2090.webp"],
    caseFileId: null,
    cameraBehavior: "Approach trajectory tightens; spacecraft orientation shifts for entry; entry capsule cutaway shows EDL components.",
    hologramSequence: [
      { kind: "diagram", title: "Entry corridor", detail: "Meridiani Planum target ellipse" },
      { kind: "diagram", title: "EDL system", detail: "Heat shield, parachute, retrorockets, airbags" },
    ],
  },
  {
    id: "opp-ch-05",
    sequence: 5,
    act: "ACT I — THE JOURNEY FROM EARTH",
    title: "Atmospheric entry, descent, and landing",
    date: "24 January 2004 PST / 25 January 2004 UTC",
    dateUtc: Date.UTC(2004, 0, 25, 5, 5),
    sol: 0,
    location: "Eagle Crater, Meridiani Planum",
    eventType: "landing",
    narrative:
      "Opportunity entered Mars' atmosphere, deployed its parachute, used its descent system, and landed inside an airbag-protected structure. The lander bounced at least 26 times before coming to rest inside Eagle Crater, within Meridiani Planum. Its landing point was approximately 14.9 km from the intended target. The landing site was later named Challenger Memorial Station.",
    whyHappened:
      "The EDL system had to slow the spacecraft from entry velocity to a safe touchdown in minutes.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Placed a mobile scientific laboratory in Meridiani Planum, a site selected for hematite evidence of past water.",
    engineeringSignificance:
      "Validated the MER airbag landing architecture. Landed within 14.9 km of target despite the bounce sequence.",
    futureMissions: "EDL lessons informed Phoenix, Curiosity (sky crane), and Perseverance (Terrain Relative Navigation).",
    media: [OPPORTUNITY_MEDIA.EDL_ANIMATION],
    caseFileId: null,
    cameraBehavior:
      "NASA/JPL official EDL animation: atmospheric entry, parachute deployment, retrorocket sequence, airbag inflation, bouncing and settling inside Eagle Crater.",
    hologramSequence: [
      { kind: "animation", title: "OFFICIAL MISSION-ARCHITECTURE ANIMATION", detail: "NOT actual Opportunity touchdown footage" },
      { kind: "text", title: "Landing site", detail: "Eagle Crater, Meridiani Planum" },
      { kind: "text", title: "Bounces", detail: "26+ before coming to rest" },
    ],
  },

  /* ACT II — THE FIRST DISCOVERIES */
  {
    id: "opp-ch-06",
    sequence: 6,
    act: "ACT II — THE FIRST DISCOVERIES",
    title: "A strange landscape",
    date: "January 2004 · First surface images",
    dateUtc: Date.UTC(2004, 0, 26),
    sol: 1,
    location: "Eagle Crater, Meridiani Planum",
    eventType: "observation",
    narrative:
      "Opportunity returned its first pictures of a dark, cratered Martian landscape. The exposed rock outcrop inside its landing crater became an immediate scientific target. NASA's scientists could now compare orbital predictions against actual surface evidence.",
    whyHappened:
      "Pancam and Navcam imaged the landing site immediately after touchdown to assess the local geology.",
    instruments: ["pancam", "navcam"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Confirmed the presence of bedrock outcrop at the landing site, validating the orbital hematite detection.",
    engineeringSignificance:
      "Verified camera systems survived landing and could transmit imagery from the surface.",
    futureMissions: "Surface imaging protocols became standard for all subsequent rovers.",
    media: [OPPORTUNITY_MEDIA.FIRST_IMAGES, "/media/missions/opportunity/journey/looking-back-at-eagle-crater3-d.webp"],
    caseFileId: null,
    cameraBehavior: "Reveal actual first Pancam images; identify Eagle Crater; expose the bedrock outcrop; compare pre-landing orbital view with surface imagery.",
    hologramSequence: [
      { kind: "image", title: "First Pancam view of Eagle Crater", detail: "Sol 1, January 2004" },
      { kind: "text", title: "Orbital vs surface", detail: "Comparison of predicted vs actual terrain" },
    ],
  },
  {
    id: "opp-ch-07",
    sequence: 7,
    act: "ACT II — THE FIRST DISCOVERIES",
    title: "Rover deployment and first drive",
    date: "31 January 2004 · Sol 7",
    dateUtc: Date.UTC(2004, 0, 31),
    sol: 7,
    location: "Eagle Crater, Meridiani Planum",
    eventType: "deployment",
    narrative:
      "Opportunity drove down its reinforced fabric ramp and onto the Martian surface. It had successfully separated from its lander and begun independent exploration. This was also the first period in which Spirit and Opportunity were operating as mobile explorers on opposite sides of Mars simultaneously.",
    whyHappened:
      "The rover had to egress from the lander to begin surface mobility and geological investigation.",
    instruments: ["navcam", "hazcam"],
    hardware: [],
    discovery: null,
    scientificSignificance: "Transitioned from landed platform to mobile surface explorer.",
    engineeringSignificance:
      "Validated the rover egress mechanism and suspension deployment on Martian soil.",
    futureMissions: "Egress procedures adopted by all subsequent Mars rovers.",
    media: [OPPORTUNITY_MEDIA.ROLLOFF, "/media/missions/opportunity/journey/engineers-test-roll-off-at-jpl.webp"],
    caseFileId: null,
    cameraBehavior: "Animate the suspension unfolding, rover descending the ramp, wheel contact with soil, first tracks, empty lander photograph.",
    hologramSequence: [
      { kind: "image", title: "Opportunity on its own", detail: "PIA05182, rover on Martian surface" },
      { kind: "text", title: "Dual rover ops", detail: "Spirit and Opportunity active simultaneously" },
    ],
  },
  {
    id: "opp-ch-08",
    sequence: 8,
    act: "ACT II — THE FIRST DISCOVERIES",
    title: "Martian blueberries — Eagle Crater",
    date: "March 2004 · Eagle Crater · Sol 48",
    dateUtc: Date.UTC(2004, 2, 15),
    sol: 48,
    location: "Eagle Crater outcrop, Meridiani Planum",
    eventType: "discovery",
    narrative:
      "Opportunity investigated small spherical particles embedded in nearby rocks. Scientists nicknamed these features the Martian blueberries. Using the rover's instruments, they identified hematite as a major iron-bearing component of the spherules. Opportunity brushed the Berry Bowl target to expose a cleaner surface for spectrometer analysis.",
    whyHappened:
      "The rover's instruments detected spherical features in the outcrop that warranted closer investigation.",
    instruments: ["mi", "apxs", "mb", "rat"],
    hardware: [],
    discovery:
      "Hematite-rich spherules (blueberries) consistent with formation through water-related geological processes.",
    scientificSignificance:
      "Compelling physical and chemical evidence that liquid water had affected the ancient Martian environment at Meridiani Planum.",
    engineeringSignificance:
      "Demonstrated the RAT brushing capability and contact instrument coordination on a specific target.",
    futureMissions: "RAT and contact-instrument workflows became standard for in-situ rock analysis.",
    media: [OPPORTUNITY_MEDIA.BERRY_BOWL, "/media/missions/opportunity/journey/berries-on-the-ground.webp"],
    caseFileId: "opp-case-blueberries",
    cameraBehavior: "Zoom into the real Berry Bowl image, highlight spherical features, show the brushing operation, reveal spectrometer investigation.",
    hologramSequence: [
      { kind: "image", title: "Berry Bowl hematite spherules", detail: "Microscopic Imager mosaic" },
      { kind: "action", title: "RAT brushing", detail: "Surface preparation for APXS/Mössbauer" },
    ],
  },
  {
    id: "opp-ch-09",
    sequence: 9,
    act: "ACT II — THE FIRST DISCOVERIES",
    title: "Inside Endurance Crater",
    date: "April – August 2004 · Sols 94–205",
    dateUtc: Date.UTC(2004, 5, 15),
    sol: 130,
    location: "Endurance Crater, Meridiani Planum",
    eventType: "exploration",
    narrative:
      "Opportunity traveled to Endurance Crater, inspecting its layered rock formations. It examined outcrops including Burns Cliff. Researchers studied sulfate-rich sediments, rock layers, and geological structures that indicated ancient water-related deposition and alteration. Opportunity entered the crater on Sol 130, 5 June 2004, after scientists carefully assessed the slopes and possible route.",
    whyHappened:
      "The crater exposed deeper geological layers than the plains, offering a window into Mars' sedimentary history.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mb", "mi"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "The rock record showed a complex history involving water, sediments, evaporation, and later alteration — allowing scientists to reconstruct how water interacted with the Martian surface.",
    engineeringSignificance:
      "Demonstrated safe entry into and operation within a large crater, including slope management and egress planning.",
    futureMissions: "Crater-entry protocols informed Victoria, Endeavour, and later crater investigations.",
    media: [OPPORTUNITY_MEDIA.ENDURANCE, OPPORTUNITY_MEDIA.BURNS_CLIFF, "/media/missions/opportunity/journey/layers-in-burns-cliff-examined-by-opportunity.webp"],
    caseFileId: null,
    cameraBehavior: "Fly down toward Endurance, reveal layered cliffs, activate geological cross-sections, and display the rover's actual route and images.",
    hologramSequence: [
      { kind: "image", title: "Layers in Burns Cliff", detail: "Pancam image of sulfate-rich sediments" },
      { kind: "diagram", title: "Crater entry route", detail: "Sol 130 entry, egress planning" },
    ],
  },
  {
    id: "opp-ch-10",
    sequence: 10,
    act: "ACT II — THE FIRST DISCOVERIES",
    title: "Doubling the planned lifetime",
    date: "26 July 2004 · Sol 180",
    dateUtc: Date.UTC(2004, 6, 26),
    sol: 180,
    location: "Endurance Crater, Meridiani Planum",
    eventType: "milestone",
    narrative:
      "Opportunity had now operated for twice its original 90-sol primary mission. It continued examining rocks, slopes, and geological features inside Endurance Crater.",
    whyHappened:
      "Careful power management and robust hardware allowed the rover to far exceed its design lifetime.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance: "Extended observation window for geological and atmospheric monitoring.",
    engineeringSignificance:
      "Demonstrated that mobile scientific hardware could operate far longer than its initial design mission.",
    futureMissions: "Extended-mission planning became standard for Mars surface missions.",
    media: [OPPORTUNITY_MEDIA.SELF_PORTRAIT_2005, "/media/missions/opportunity/journey/self-portrait-by-opportunity-mars-rover-in-january-2014.webp"],
    caseFileId: null,
    cameraBehavior: "Show the original 90-sol design limit, advance the counter to Sol 180, and display the rover's actual shadow photograph.",
    hologramSequence: [
      { kind: "text", title: "Design life: 90 sols", detail: "Actual: Sol 180 and counting" },
      { kind: "image", title: "Rover self-portrait", detail: "Sols 322–323, PIA07372" },
    ],
  },

  /* ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION */
  {
    id: "opp-ch-11",
    sequence: 11,
    act: "ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION",
    title: "Heat Shield Rock meteorite",
    date: "January 2005 · Heat Shield Rock",
    dateUtc: Date.UTC(2005, 0, 15),
    sol: 339,
    location: "Near discarded heat shield, Meridiani Planum",
    eventType: "discovery",
    narrative:
      "Near the rover's discarded heat shield, Opportunity discovered a basketball-sized rock that scientists identified as an iron-nickel meteorite.",
    whyHappened:
      "The rover investigated an unusual rock near its heat shield that did not match local Martian geology.",
    instruments: ["apxs", "mb", "pancam", "mi"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "The rover investigated material that originated beyond the immediate Martian geological setting — a meteorite on another planet.",
    engineeringSignificance:
      "Showed the rover could identify and investigate non-indigenous rocks during traverse.",
    futureMissions: "Meteorite identification became part of rover traverse science planning.",
    media: [OPPORTUNITY_MEDIA.HEAT_SHIELD_ROCK, "/media/missions/opportunity/journey/skirting-an-obstacle-opportunity-sol-1867.webp"],
    caseFileId: null,
    cameraBehavior: "Show the rover and its heat shield, reveal the meteorite target, compare the rock's appearance with its iron-nickel interpretation.",
    hologramSequence: [
      { kind: "image", title: "Heat Shield Rock", detail: "Basketball-sized iron-nickel meteorite" },
      { kind: "text", title: "First meteorite on another planet", detail: "Identified by Opportunity" },
    ],
  },
  {
    id: "opp-ch-12",
    sequence: 12,
    act: "ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION",
    title: "Trapped in Purgatory Dune",
    date: "26 April – 4 June 2005 · Sols 446–485",
    dateUtc: Date.UTC(2005, 3, 15),
    sol: 446,
    location: "Purgatory Dune, Meridiani Planum",
    eventType: "incident",
    narrative:
      "Opportunity drove into a soft wind-shaped ripple called Purgatory Dune. Its wheels dug more than 10 centimetres into the sand. Engineers on Earth had to test possible recovery strategies and use very cautious movements to free the six-wheeled rover. Opportunity escaped after more than five weeks.",
    whyHappened:
      "The rover encountered loose, wind-shaped sand that exceeded the traction of its wheels.",
    instruments: ["navcam", "hazcam"],
    hardware: [],
    discovery: null,
    scientificSignificance: "Provided data on Martian soil mechanics and ripple formation.",
    engineeringSignificance:
      "Demonstrated the importance of realistic terrain testing and conservative autonomous mobility planning. Recovery took over five weeks of careful commanding.",
    futureMissions: "Terrain assessment and wheel-slip monitoring became critical for all subsequent rovers.",
    media: [OPPORTUNITY_MEDIA.PURGATORY, "/media/missions/opportunity/journey/skirting-an-obstacle-opportunity-sol-1867.webp"],
    caseFileId: null,
    cameraBehavior: "Show the six wheels sinking, compare wheel movement with actual displacement, and replay the recovery strategy.",
    hologramSequence: [
      { kind: "image", title: "Purgatory Dune entrapment", detail: "Wheels dug 10+ cm into sand" },
      { kind: "text", title: "Recovery", detail: "Escaped after 5+ weeks of careful commanding" },
    ],
  },
  {
    id: "opp-ch-13",
    sequence: 13,
    act: "ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION",
    title: "Journey toward Victoria Crater",
    date: "Late 2005 – September 2006",
    dateUtc: Date.UTC(2006, 0, 15),
    sol: 900,
    location: "Meridiani Planum traverse to Victoria Crater",
    eventType: "traverse",
    narrative:
      "Opportunity continued south across Meridiani Planum, reaching the highly eroded Erebus Crater before continuing toward Victoria Crater. It examined additional geological structures while traveling across the plains.",
    whyHappened:
      "Scientific exploration expanded from individual landing-site investigations into an increasingly large regional geological survey.",
    instruments: ["pancam", "navcam", "minites"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Regional geological survey of Meridiani Planum, building a broader picture of the plain's history.",
    engineeringSignificance:
      "Demonstrated long-distance traverse capability far beyond the original ~1 km design goal.",
    futureMissions: "Long-distance rover traverse planning became standard for Mars missions.",
    media: ["/media/missions/opportunity/journey/the-opportunity-rover-at-victoria-crater.webp"],
    caseFileId: null,
    cameraBehavior: "Display the historical traverse, animate the rover along documented route segments, and reveal the increasing scale of its journey.",
    hologramSequence: [
      { kind: "map", title: "Traverse map", detail: "Eagle to Victoria route" },
      { kind: "text", title: "Distance", detail: "Many kilometers beyond original design" },
    ],
  },
  {
    id: "opp-ch-14",
    sequence: 14,
    act: "ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION",
    title: "Victoria Crater",
    date: "September 2006 – September 2007",
    dateUtc: Date.UTC(2006, 8, 15),
    sol: 951,
    location: "Victoria Crater, Meridiani Planum",
    eventType: "exploration",
    narrative:
      "Opportunity reached Victoria Crater in September 2006. The crater was approximately 800 metres across and exposed large sections of geological layers. The rover examined the rim and later entered the crater on 11 September 2007. In 2007, major dust storms severely reduced the sunlight reaching its solar arrays. Science operations were suspended during the worst conditions. After the storms weakened, the rover resumed work.",
    whyHappened:
      "Victoria offered exposed stratigraphy spanning a long period of Martian geological history.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mb", "mi", "rat"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Exposed layered sedimentary record allowing reconstruction of Mars' geological history over extended time periods.",
    engineeringSignificance:
      "Operated through severe dust storms, demonstrating power management under reduced sunlight.",
    futureMissions: "Dust-storm power management informed later solar-powered mission planning.",
    media: [OPPORTUNITY_MEDIA.VICTORIA, "/media/missions/opportunity/journey/the-opportunity-rover-at-victoria-crater.webp"],
    caseFileId: null,
    cameraBehavior: "Orbit-like overview of the crater, panoramic views from Cape Verde, historical rover path and the dust-storm interruption.",
    hologramSequence: [
      { kind: "image", title: "Opportunity at Victoria Crater", detail: "PIA08812, October 2006" },
      { kind: "text", title: "Crater diameter", detail: "~800 metres" },
      { kind: "text", title: "Dust storm", detail: "2007 global dust storm interrupted operations" },
    ],
  },
  {
    id: "opp-ch-15",
    sequence: 15,
    act: "ACT III — ENGINEERING CHALLENGES AND LONG-DISTANCE EXPLORATION",
    title: "Journey toward Endeavour Crater",
    date: "2008 – August 2011",
    dateUtc: Date.UTC(2009, 0, 15),
    sol: 2000,
    location: "Meridiani Planum to Endeavour Crater",
    eventType: "traverse",
    narrative:
      "After Victoria, Opportunity began a very long drive toward Endeavour Crater, approximately 22 kilometres across. Along the way it investigated the unusual rock Marquette Island, which scientists considered different from the local rocks previously examined. The rover reached Endeavour Crater on 9 August 2011 after traveling approximately 21 kilometres from Victoria.",
    whyHappened:
      "Endeavour Crater offered older rocks and different geological materials than those examined at Meridiani Planum.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mi"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Investigated a wider variety of geological material than scientists had originally expected, including the distinct Marquette Island rock.",
    engineeringSignificance:
      "A rover designed to travel roughly one kilometre during its prime mission had now traveled many times farther.",
    futureMissions: "Extended-traverse operations became a core capability of Mars rover missions.",
    media: ["/media/missions/opportunity/journey/opportunity-exploration-of-cape.webp"],
    caseFileId: null,
    cameraBehavior: "A cinematic regional map, waypoint progression, changing terrain photographs and arrival at Endeavour.",
    hologramSequence: [
      { kind: "map", title: "Victoria to Endeavour traverse", detail: "~21 km drive" },
      { kind: "text", title: "Marquette Island", detail: "Unusual rock investigated en route" },
    ],
  },

  /* ACT IV — DISCOVERING DIFFERENT WATERY ENVIRONMENTS */
  {
    id: "opp-ch-16",
    sequence: 16,
    act: "ACT IV — DISCOVERING DIFFERENT WATERY ENVIRONMENTS",
    title: "Cape York investigations",
    date: "August 2011 – May 2013",
    dateUtc: Date.UTC(2011, 11, 15),
    sol: 2681,
    location: "Cape York, Endeavour Crater rim",
    eventType: "exploration",
    narrative:
      "Opportunity investigated Cape York along the edge of Endeavour Crater, including the area of Matijevic Hill. Orbital observations had detected clay-mineral signatures in the region, prompting more detailed investigation from the ground. Opportunity examined rocks including Whitewater Lake and Esperance. At Esperance, the rover found chemical evidence consistent with intense water-related alteration along rock fractures.",
    whyHappened:
      "Orbital clay-mineral detections at Endeavour's rim warranted ground-truth investigation.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mb", "mi", "rat"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Suggested water had interacted with different Martian rocks under different chemical conditions, including conditions less acidic than some previously studied environments.",
    engineeringSignificance:
      "Validated orbital mineral detection as a tool for selecting rover investigation targets.",
    futureMissions: "Orbital-to-surface targeting workflow used by Curiosity and Perseverance.",
    media: [OPPORTUNITY_MEDIA.ESPERANCE, OPPORTUNITY_MEDIA.ESPERANCE_FIG, "/media/missions/opportunity/journey/esperance-target-examined-by-opportunity.webp"],
    caseFileId: null,
    cameraBehavior: "Show orbital mineral detection, fly down to Cape York, highlight the target, then connect the rover's instruments to the observation.",
    hologramSequence: [
      { kind: "diagram", title: "Orbital clay detection", detail: "CRISM/OMEGA signatures at Endeavour rim" },
      { kind: "image", title: "Esperance target", detail: "Pancam false-color composite, sol 3230" },
    ],
  },
  {
    id: "opp-ch-17",
    sequence: 17,
    act: "ACT IV — DISCOVERING DIFFERENT WATERY ENVIRONMENTS",
    title: "Esperance: water-altered rock",
    date: "February – May 2013 · Sol 3230",
    dateUtc: Date.UTC(2013, 1, 23),
    sol: 3230,
    location: "Matijevic Hill, Cape York, Endeavour Crater",
    eventType: "discovery",
    narrative:
      "Opportunity's Pancam recorded images of Esperance. Its Rock Abrasion Tool removed surface material to expose a fresher area. APXS then measured elemental composition. The measurements showed higher aluminum and silica and lower calcium and iron than other rocks examined during the mission. Preliminary scientific interpretation pointed to clay-mineral content and intense alteration by water. This changed the investigators' understanding: evidence of more extensive and potentially less acidic water-related alteration than some other ancient environments documented by the rover. It did not prove that life existed.",
    whyHappened:
      "The unusual chemistry of Esperance warranted close-up instrument analysis to understand its formation history.",
    instruments: ["pancam", "rat", "apxs", "mi", "mb"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Evidence of clay-mineral content and intense water-related alteration under potentially less acidic conditions than earlier Meridiani environments.",
    engineeringSignificance:
      "Demonstrated the full contact-instrument chain: Pancam targeting, RAT abrasion, APXS measurement, MI imaging.",
    futureMissions: "Contact-instrument targeting and abrasion-before-measurement workflow standardized.",
    media: [OPPORTUNITY_MEDIA.ESPERANCE, OPPORTUNITY_MEDIA.ESPERANCE_FIG, "/media/missions/opportunity/journey/esperance-target-examined-by-opportunity.webp"],
    caseFileId: "opp-case-esperance",
    cameraBehavior: "Display the actual Pancam target image, animate the abrasion operation as an educational reconstruction, highlight APXS, then reveal the measured compositional comparison.",
    hologramSequence: [
      { kind: "image", title: "Esperance Pancam image", detail: "Sol 3230, false-color composite" },
      { kind: "action", title: "RAT abrasion at Esperance6", detail: "Surface preparation for contact science" },
      { kind: "chart", title: "APXS composition", detail: "High Al/Si, low Ca/Fe vs other Meridiani rocks" },
    ],
  },
  {
    id: "opp-ch-18",
    sequence: 18,
    act: "ACT IV — DISCOVERING DIFFERENT WATERY ENVIRONMENTS",
    title: "Ten years on Mars",
    date: "January – September 2014",
    dateUtc: Date.UTC(2014, 0, 25),
    sol: 3500,
    location: "Endeavour Crater rim, Mars",
    eventType: "milestone",
    narrative:
      "Opportunity passed ten Earth years on Mars. Wind had cleaned much of the accumulated dust from its solar panels, improving available electrical power. The rover also faced computer-memory problems, eventually requiring its flash-memory configuration to be changed. NASA extended the mission again, directing the rover toward Marathon Valley.",
    whyHappened:
      "Environmental changes (wind cleaning) and engineering workarounds (flash memory reformat) kept aging equipment scientifically useful.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance: "Extended observation continued at Endeavour Crater rim.",
    engineeringSignificance:
      "Demonstrated how environmental changes and engineering workarounds could keep aging equipment scientifically useful beyond design life.",
    futureMissions: "Long-duration operations and autonomous fault recovery became core design principles.",
    media: [OPPORTUNITY_MEDIA.SELF_PORTRAIT_2014, "/media/missions/opportunity/journey/self-portrait-by-opportunity-mars-rover-in-january-2014.webp"],
    caseFileId: null,
    cameraBehavior: "Compare dusty and cleaned solar panels, reveal the energy context, show the flash-memory system and the next mission target.",
    hologramSequence: [
      { kind: "image", title: "Self-portrait, January 2014", detail: "PIA17759, cleaned solar panels" },
      { kind: "text", title: "Ten Earth years on Mars", detail: "Far beyond 90-sol design" },
    ],
  },
  {
    id: "opp-ch-19",
    sequence: 19,
    act: "ACT IV — DISCOVERING DIFFERENT WATERY ENVIRONMENTS",
    title: "First marathon on another world",
    date: "25 March 2015",
    dateUtc: Date.UTC(2015, 2, 25),
    sol: 3967,
    location: "Endeavour Crater rim, Mars",
    eventType: "milestone",
    narrative:
      "Opportunity reached 26.219 miles (42.195 kilometres) of travel. It became the first human-made vehicle to travel a marathon distance on another world. Its original planned total distance was approximately one kilometre.",
    whyHappened:
      "Years of careful driving across Meridiani Planum accumulated distance far beyond the original goal.",
    instruments: ["navcam", "hazcam"],
    hardware: [],
    discovery: null,
    scientificSignificance: "Enabled regional geological survey across an unprecedented distance.",
    engineeringSignificance:
      "A rover designed to travel roughly one kilometre during its prime mission had traveled 42.195 km — a marathon on another world.",
    futureMissions: "Long-distance rover mobility demonstrated as feasible for multi-year missions.",
    media: ["/media/missions/opportunity/journey/opportunity-rover-surpasses-marathon-distance.webp"],
    caseFileId: null,
    cameraBehavior: "Show the 42.195 km milestone, the actual traverse map, a visual comparison with a marathon, and the rover's progress beyond its original mission target.",
    hologramSequence: [
      { kind: "text", title: "42.195 km", detail: "Marathon distance on Mars" },
      { kind: "text", title: "Original goal", detail: "~1 km planned traverse" },
    ],
  },

  /* ACT V — THE FINAL YEARS */
  {
    id: "opp-ch-20",
    sequence: 20,
    act: "ACT V — THE FINAL YEARS",
    title: "Marathon Valley and the steep climb",
    date: "2015–2017",
    dateUtc: Date.UTC(2016, 0, 15),
    sol: 4200,
    location: "Marathon Valley, Endeavour Crater",
    eventType: "exploration",
    narrative:
      "Opportunity continued operating in its extended missions along Endeavour Crater. It investigated Marathon Valley and the surrounding terrain. On 10 March 2016, near Knudsen Crater, it drove at a tilt of approximately 32 degrees, setting a Mars-rover slope record at the time. The mission then investigated a gully called Perseverance Valley. Scientists wanted to understand whether it had been carved by flowing water or another process.",
    whyHappened:
      "The rover was investigating increasingly complex geological terrain, including a feature whose origins were scientifically uncertain.",
    instruments: ["pancam", "navcam", "minites", "apxs", "mi"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Investigated gully formation hypotheses — water-carved vs dry processes — without reaching a definitive conclusion.",
    engineeringSignificance:
      "Set a Mars-rover slope record at ~32 degrees, demonstrating extreme-terrain mobility capability.",
    futureMissions: "Steep-slope driving techniques informed later rover terrain capabilities.",
    media: ["/media/missions/opportunity/journey/opportunity-approach-to-marathon-valley.webp"],
    caseFileId: null,
    cameraBehavior: "Show the actual rover route, slope visualization, geological layers, dust-devil imagery and competing hypotheses for gully formation.",
    hologramSequence: [
      { kind: "text", title: "Slope record", detail: "~32 degrees, March 2016" },
      { kind: "text", title: "Perseverance Valley", detail: "Gully origin under investigation" },
    ],
  },
  {
    id: "opp-ch-21",
    sequence: 21,
    act: "ACT V — THE FINAL YEARS",
    title: "Perseverance Valley",
    date: "May 2017 – June 2018",
    dateUtc: Date.UTC(2017, 4, 15),
    sol: 4700,
    location: "Perseverance Valley, Endeavour Crater",
    eventType: "exploration",
    narrative:
      "Opportunity reached Perseverance Valley in the first week of May 2017 and began investigating the gully. It collected extensive imagery of surrounding geological targets. The rover experienced a steering issue with its front-left wheel, which appeared to return to normal after attempts by engineers. It continued driving deeper into the valley during 2017.",
    whyHappened:
      "This was the final major geological environment explored during Opportunity's long mission.",
    instruments: ["pancam", "navcam", "mi"],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "Final geological investigation of a gully whose formation mechanism remained under study.",
    engineeringSignificance:
      "Demonstrated continued mobility and instrument operation despite wheel steering issues.",
    futureMissions: "Wheel-steering fault tolerance informed later rover drive-system design.",
    media: ["/media/missions/opportunity/journey/from-tribulation-to-perseverance-on-mars.webp"],
    caseFileId: null,
    cameraBehavior: "Fly into Perseverance Valley, show its actual panoramas and route, and reveal the scientific questions being investigated.",
    hologramSequence: [
      { kind: "text", title: "Perseverance Valley", detail: "Final major geological environment" },
      { kind: "text", title: "Wheel issue", detail: "Front-left steering, recovered by engineers" },
    ],
  },
  {
    id: "opp-ch-22",
    sequence: 22,
    act: "ACT V — THE FINAL YEARS",
    title: "The last signal",
    date: "10 June 2018 · Sol 5111",
    dateUtc: Date.UTC(2018, 5, 10),
    sol: 5111,
    location: "Perseverance Valley, Endeavour Crater",
    eventType: "end",
    narrative:
      "A major Mars-wide dust storm blocked sunlight from reaching Opportunity's solar panels. Electrical power became insufficient for continued communication. The last signal was received on Earth on 10 June 2018. Opportunity's final transmitted full-frame image was an incomplete, extremely dark view of the sky, with a faint Sun and camera noise. The rover's last observations also included images used to estimate how opaque the dust-filled atmosphere had become.",
    whyHappened:
      "A planet-wide environmental event ended communication with a machine that had survived nearly fifteen years of exploration.",
    instruments: ["pancam", "navcam"],
    hardware: [],
    discovery: null,
    scientificSignificance: "Final atmospheric opacity measurements during a global dust storm.",
    engineeringSignificance:
      "Demonstrated the vulnerability of solar-powered spacecraft to planet-wide dust events.",
    futureMissions: "Dust-storm modeling and power budgeting informed later mission designs.",
    media: [OPPORTUNITY_MEDIA.FINAL_IMAGE, "/media/missions/opportunity/journey/opportunity-legacy-panorama.webp"],
    caseFileId: null,
    cameraBehavior: "The illumination fades, the solar-power indication drops, actual last images appear, and the timeline stops at the last signal.",
    hologramSequence: [
      { kind: "image", title: "Final transmitted image", detail: "Dark sky view, Sol 5111" },
      { kind: "text", title: "Last signal", detail: "10 June 2018, Sol 5111" },
      { kind: "text", title: "Cause", detail: "Mars-wide dust storm blocked sunlight" },
    ],
  },
  {
    id: "opp-ch-23",
    sequence: 23,
    act: "ACT V — THE FINAL YEARS",
    title: "Recovery attempts and mission end",
    date: "June 2018 – 13 February 2019",
    dateUtc: Date.UTC(2019, 1, 13),
    sol: null,
    location: "Perseverance Valley, Endeavour Crater",
    eventType: "conclusion",
    narrative:
      "Engineers spent approximately eight months attempting to re-establish contact. More than a thousand recovery commands were sent. The final recovery attempt was made on 13 February 2019. NASA then declared the mission complete. Final odometer: 45.16 kilometres. The rover had operated for 5,111 Martian sols, approximately 14 years and 46 Earth days.",
    whyHappened:
      "After exhaustive recovery efforts, NASA concluded the rover could not be re-established.",
    instruments: [],
    hardware: [],
    discovery: null,
    scientificSignificance:
      "A mission designed for 90 sols had far exceeded its planned lifetime and continued producing scientific information for almost fifteen years.",
    engineeringSignificance:
      "Demonstrated the value of long-lived robotic exploration, remote mobility operations, fault recovery, and scientific investigation over distances far greater than originally planned.",
    futureMissions: "Opportunity's longevity record set expectations for Mars surface mission durability.",
    media: ["/media/missions/opportunity/journey/opportunity-s-final-traverse-map.webp"],
    caseFileId: null,
    cameraBehavior: "Show mission-control photographs, the final commands, the end-of-mission announcement and the rover's final position in Perseverance Valley.",
    hologramSequence: [
      { kind: "text", title: "Recovery attempts", detail: "8 months, 1000+ commands" },
      { kind: "text", title: "Mission declared complete", detail: "13 February 2019" },
      { kind: "text", title: "Final distance", detail: "45.16 km" },
      { kind: "text", title: "Duration", detail: "5,111 sols (~14 years, 46 days)" },
    ],
  },
];

/** Scientific case files for key Opportunity discoveries. Each distinguishes
 *  direct observation, measurement, evidence, interpretation, uncertainty, and significance. */
export const OPPORTUNITY_CASE_FILES: CaseFile[] = [
  {
    id: "opp-case-blueberries",
    title: "Hematite-rich spherules at Eagle Crater",
    recordName: "MARTIAN BLUEBERRIES",
    directObservation:
      "Small spherical particles embedded in rocks at Eagle Crater, nicknamed 'blueberries' by the science team.",
    measurement:
      "Microscopic Imager close-ups, APXS elemental composition, and Mössbauer iron-mineral identification of the spherules.",
    evidence:
      "Hematite identified as a major iron-bearing component of the spherules; spherules concentrated in outcrop layers.",
    interpretation:
      "Spherules consistent with formation through water-related geological processes — concretions growing in wet sediment.",
    uncertainty:
      "Exact formation mechanism (groundwater vs. other aqueous process) not fully resolved.",
    significance:
      "Physical and chemical evidence that liquid water had affected the ancient Martian environment at Meridiani Planum. Not evidence of life.",
    media: [OPPORTUNITY_MEDIA.BERRY_BOWL, "/media/missions/opportunity/journey/berries-on-the-ground.webp"],
    sourceIds: ["squyres2004", "klingelhofer2004", "rieder2004"],
  },
  {
    id: "opp-case-esperance",
    title: "Esperance — water-altered rock at Endeavour",
    recordName: "ESPERANCE CASE FILE",
    directObservation:
      "Pancam images of the pale rock 'Esperance' at Matijevic Hill; RAT abrasion at target 'Esperance6'; APXS elemental analysis of the abraded spot.",
    measurement:
      "APXS showed higher aluminum and silica, lower calcium and iron than other Meridiani rocks examined over nine-plus years.",
    evidence:
      "Composition stands apart from every other Meridiani rock in the APXS dataset; preliminary clay-mineral interpretation.",
    interpretation:
      "Evidence of clay-mineral content and intense water-related alteration along rock fractures, potentially under less acidic conditions than earlier environments.",
    uncertainty:
      "Preliminary interpretation — clay content suggested but not definitively confirmed; not evidence of life.",
    significance:
      "Expanded understanding of the range of ancient watery environments on Mars and their possible habitability.",
    media: [OPPORTUNITY_MEDIA.ESPERANCE, OPPORTUNITY_MEDIA.ESPERANCE_FIG, "/media/missions/opportunity/journey/esperance-target-examined-by-opportunity.webp"],
    sourceIds: ["pia17074", "nasa-mer-instruments"],
  },
];

/** Types for the cinematic journey system. */
export interface MissionChapter {
  id: string;
  sequence: number;
  act: string;
  title: string;
  date: string;
  dateUtc: number;
  sol: number | null;
  location: string;
  eventType: "development" | "launch" | "cruise" | "maneuver" | "landing" | "observation" | "deployment" | "discovery" | "exploration" | "milestone" | "traverse" | "incident" | "end" | "conclusion";
  narrative: string;
  whyHappened: string;
  instruments: string[];
  hardware: string[];
  discovery: string | null;
  scientificSignificance: string;
  engineeringSignificance: string;
  futureMissions: string;
  media: string[];
  caseFileId: string | null;
  cameraBehavior: string;
  hologramSequence: HologramStep[];
}

export interface HologramStep {
  kind: "title" | "video" | "animation" | "image" | "action" | "diagram" | "map" | "chart" | "text";
  title: string;
  detail: string;
}

export interface CaseFile {
  id: string;
  title: string;
  recordName: string;
  directObservation: string;
  measurement: string;
  evidence: string;
  interpretation: string;
  uncertainty: string;
  significance: string;
  media: string[];
  sourceIds: string[];
}
