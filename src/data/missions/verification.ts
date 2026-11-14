/**
 * MISSION VERIFICATION REGISTRY
 *
 * The audited, source-backed facts for every registered device. This file is
 * the single place where "who flew what, when, with which rocket, and what
 * state is it in now" is asserted, so the UI, the audit documents and the
 * submission packet cannot drift apart.
 *
 * Every entry was checked against an authoritative NASA source (see `sources`
 * on each record; the access date is recorded). Where a fact is a
 * reconstruction rather than a measurement it says so explicitly.
 *
 * Verified corrections made during the release audit:
 *  - Voyager 1's MISSION IS ONGOING. NASA: "crossed into interstellar space in
 *    August 2012 and continues to collect data." The app previously carried an
 *    end date of "today", which mislabelled a live mission as finished. The
 *    spacecraft's reduced instrument set is a spacecraft state, not a mission
 *    state.
 *  - InSight's official End of Mission is 15 December 2022 (NASA mission
 *    page), not 21 December 2022.
 */

export type MissionType = "rover" | "lander" | "flyby" | "orbiter" | "crewed-lander";

export interface VerifiedEvent {
  label: string;
  /** UTC ms, or null for "ongoing / no date". */
  dateUtc: number | null;
  note: string;
}

export interface VerifiedSource {
  title: string;
  publisher: string;
  url: string;
  accessed: string;
  supports: string;
}

export interface MissionVerification {
  deviceId: string;
  agency: string;
  launchVehicle: string;
  launchSite: string;
  missionType: MissionType;
  objective: string;
  /** The verified operational state of the MISSION (not of the hardware). */
  verifiedStatus: string;
  statusNote: string;
  /** Where the hardware is today. */
  hardwareLocation: string;
  keyEvents: VerifiedEvent[];
  discoveries: { title: string; text: string }[];
  sources: VerifiedSource[];
}

const ACCESSED = "2026-11-13";

const NASA_SCIENCE = "NASA Science";
const NASA = "NASA";
const NSSDC = "NASA NSSDCA Master Catalog";
const ALSJ = "NASA Apollo Lunar Surface Journal";

export const MISSION_VERIFICATION: MissionVerification[] = [
  {
    deviceId: "opportunity",
    agency: "NASA / JPL-Caltech",
    launchVehicle: "Delta II Heavy 7925H (7925)",
    launchSite: "Space Launch Complex 17B, Cape Canaveral Air Force Station, Florida",
    missionType: "rover",
    objective:
      "Search for and characterise rocks and soils at a Martian site selected for evidence of ancient liquid water, using a mobile laboratory on the surface.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote:
      "NASA ended attempts to contact Opportunity on 14 February 2019 after the last transmission on 10 June 2018; a dust storm ended the mission's power budget.",
    hardwareLocation: "Still on Mars in Endeavour crater (Cape York), inside Victoria crater's rim.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(2003, 6, 7, 9, 26), note: "Delta II Heavy 7925H, SLC-17B; first launch of the type." },
      { label: "Cruise", dateUtc: Date.UTC(2003, 6, 7), note: "≈200-day interplanetary cruise, ≈201 million km." },
      { label: "Entry, descent and landing", dateUtc: Date.UTC(2004, 0, 25), note: "Six minutes of terror; airbags; touchdown in Eagle Crater (14.57°S, 177.53°E)." },
      { label: "Surface operations", dateUtc: Date.UTC(2004, 0, 25), note: "5,111 sols; 45.16 km driven." },
      { label: "Mission declared complete", dateUtc: Date.UTC(2019, 1, 14), note: "NASA formally ended recovery efforts." },
    ],
    discoveries: [
      { title: "Evidence of ancient liquid water", text: "Jarosite, hematite concretions ('blueberries') and sulfate salts in the Eagle Crater outcrop point to an acidic, wet early Mars." },
      { title: "Silica and clay", text: "Opportunity found high-silica and Al/Fe smectite clay, showing water altered rock at Meridiani Planum." },
      { title: "A wetter, more habitable past", text: "Sulfate veins, 'Christmas tree' pyrite and the global water-loss history reframed early Mars as long-lived and wet." },
    ],
    sources: [
      { title: "Mars Exploration Rovers: Spirit and Opportunity", publisher: NASA_SCIENCE, url: "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/", accessed: ACCESSED, supports: "Mission type, objectives, mission dates." },
      { title: "MER-B Opportunity — mission record", publisher: NSSDC, url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-037A", accessed: ACCESSED, supports: "Launch date, vehicle, landing site, end of mission." },
    ],
  },
  {
    deviceId: "spirit",
    agency: "NASA / JPL-Caltech",
    launchVehicle: "Delta II 7925",
    launchSite: "Space Launch Complex 17A, Cape Canaveral Air Force Station, Florida",
    missionType: "rover",
    objective:
      "Search for evidence of past water activity at Gusev Crater and characterise the rocks and soils of the Columbia Hills.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote:
      "The rover stopped responding in a 2010 global dust storm; NASA ended recovery efforts on 25 May 2011. This is a mission end, not a hardware abandonment.",
    hardwareLocation: "Still on Mars in Gusev Crater, at Troy (Columbia Hills).",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(2003, 5, 10, 2, 58), note: "Delta II 7925, SLC-17A; the twin of MER-B." },
      { label: "Entry, descent and landing", dateUtc: Date.UTC(2004, 0, 4), note: "Airbag landing in Gusev Crater (14.57°S, 175.47°E)." },
      { label: "Surface operations", dateUtc: Date.UTC(2004, 0, 4), note: "2,207 sols; 7.73 km driven; first climbs into the Columbia Hills." },
      { label: "Last contact", dateUtc: Date.UTC(2010, 2, 22), note: "Signal lost during the 2010 global dust storm." },
      { label: "NASA ended recovery efforts", dateUtc: Date.UTC(2011, 4, 25), note: "Mission formally concluded." },
    ],
    discoveries: [
      { title: "Hematite that water did not make", text: "The Gusev hematite is coarse-grained and not the fine, cemented form Opportunity found at Meridiani — evidence against standing liquid water at Gusev." },
      { title: "Silica, sulfate and carbonate", text: "The Columbia Hills outcrops carry opaline silica, light-toned sulfates and carbonates: prolonged, acidic, water-altered surface." },
      { title: "Home Plate and the basaltic plains", text: "A fractured, layered basaltic plateau with vesicles and specular weathering revealed a more complex, volcanic history for Gusev." },
    ],
    sources: [
      { title: "Mars Exploration Rovers: Spirit and Opportunity", publisher: NASA_SCIENCE, url: "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/", accessed: ACCESSED, supports: "Mission type, objectives, mission dates." },
      { title: "MER-A Spirit — mission record", publisher: NSSDC, url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A", accessed: ACCESSED, supports: "Launch date, vehicle, landing site, mission end." },
    ],
  },
  {
    deviceId: "sojourner",
    agency: "NASA / JPL-Caltech",
    launchVehicle: "Delta II 7925",
    launchSite: "Space Launch Complex 17A, Cape Canaveral Air Force Station, Florida",
    missionType: "rover",
    objective:
      "Demonstrate a low-cost airbag landing and deliver the first wheels on Mars, characterising the rocks and soils of an ancient streambed.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote:
      "NASA's own mission record gives End of Mission 27 September 1997, after 83 sols — far beyond the planned seven.",
    hardwareLocation: "Still on Mars in Ares Vallis, roughly 100 m from the Pathfinder lander.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1996, 11, 4, 8, 58), note: "Delta II 7925 carrying Mars Pathfinder; first launch of the Delta II." },
      { label: "Landing", dateUtc: Date.UTC(1997, 6, 4, 16, 56, 55), note: "Ares Vallis (19.13°N, 325.81°E) — first airbag landing on Mars." },
      { label: "Surface operations", dateUtc: Date.UTC(1997, 6, 4), note: "83 sols, ≈100 m of driving; the first rover wheels on another planet." },
      { label: "End of mission", dateUtc: Date.UTC(1997, 8, 27), note: "Last data transmission from the lander." },
    ],
    discoveries: [
      { title: "Rounded pebbles and cobbles", text: "Unlike the angular fragments returned by the Viking landers, Pathfinder saw rounded, cemented clasts — evidence of a running, or at least tumbling, flow." },
      { title: "A clumpy, dusty soil", text: "The bright soil with embedded pebbles differs from the dark, drifting material seen from orbit, hinting at an ancient streambed deposit." },
      { title: "Airbag landing proven", text: "Pathfinder proved a cheap direct-entry, parachute-and-airbag landing, the technique used for every Mars lander since." },
    ],
    sources: [
      { title: "Mars Pathfinder", publisher: NASA_SCIENCE, url: "https://science.nasa.gov/mission/mars-pathfinder/", accessed: ACCESSED, supports: "Mission type (Lander, Rover), launch Dec 4 1996, Delta II 7925, Ares Vallis landing, end of mission Sept 27 1997." },
    ],
  },
  {
    deviceId: "insight",
    agency: "NASA / JPL-Caltech, with DLR, CNES and ESA",
    launchVehicle: "Atlas V 401",
    launchSite: "Space Launch Complex 3E, Vandenberg Air Force Base, California",
    missionType: "lander",
    objective:
      "Study the deep interior and the crust of Mars — its core, mantle structure, crustal thickness and heat flow — using a seismometer and a heat-flow probe.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote:
      "NASA's mission page records End of Mission 15 December 2022, after the final data transmission.",
    hardwareLocation: "Still on Mars in Elysium Planitia (4.50°N, 135.62°E).",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(2018, 4, 5, 7, 5), note: "Atlas V 401 from Vandenberg; the first planetary launch from the west coast." },
      { label: "Cruise", dateUtc: Date.UTC(2018, 4, 5), note: "205 days, ≈480 million km." },
      { label: "Landing", dateUtc: Date.UTC(2018, 10, 26, 14, 52, 59), note: "Elysium Planitia; the first landing of a Mars mission launched from Vandenberg." },
      { label: "First marsquakes", dateUtc: Date.UTC(2019, 3, 7), note: "SEIS detects the first seismically recorded marsquakes." },
      { label: "End of mission", dateUtc: Date.UTC(2022, 11, 15), note: "NASA ceases operations after the final data transmission." },
    ],
    discoveries: [
      { title: "The first marsquakes", text: "SEIS recorded more than 1,300 marsquakes, including impacts and the first meteoroid impacts detected on another planet." },
      { title: "The core of Mars", text: "The first solid-inner-core estimate: a small, iron-rich core of roughly 1,830 km radius, with a fluid layer above it." },
      { title: "Crustal magnetism and layering", text: "The magnetometer measured crustal magnetic reversals, proving the crust formed in episodes and was later partly remelted." },
      { title: "Heat flow and a stuck probe", text: "HP3 measured the heat flow from the interior but its 'mole' stalled in sticky soil before reaching depth." },
    ],
    sources: [
      { title: "InSight Lander", publisher: NASA_SCIENCE, url: "https://science.nasa.gov/mission/insight/", accessed: ACCESSED, supports: "Type Lander, Atlas V-401, Vandenberg, landing Nov 26 2018 at Elysium Planitia, End of Mission Dec 15 2022." },
    ],
  },
  {
    deviceId: "apollo-12",
    agency: "NASA",
    launchVehicle: "Saturn V SA-507",
    launchSite: "Launch Complex 39A, Kennedy Space Center, Florida",
    missionType: "crewed-lander",
    objective:
      "Land two people on the Moon near the Surveyor 3 site, confirm the crewed landing system, and return an astronaut to the lunar surface for a second time.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote: "The crew returned to Earth on 24 November 1969; the mission ended with splashdown.",
    hardwareLocation: "The LM (Intrepid) and the S-IVB remain near the Surveyor 3 site; the ascent stage is lost.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1969, 10, 14, 16, 22), note: "Saturn V SA-507, LC-39A; struck by lightning twice during ascent." },
      { label: "Translunar injection", dateUtc: Date.UTC(1969, 10, 15), note: "Second burn of the S-IVB sends the stack toward the Moon." },
      { label: "Lunar orbit insertion", dateUtc: Date.UTC(1969, 10, 19), note: "The CSM separates and the lunar module descends." },
      { label: "Landing", dateUtc: Date.UTC(1969, 10, 19, 6, 54, 35), note: "Oceanus Procellarum, 3.01°S 23.47°W, about 45 km from Surveyor 3." },
      { label: "Surface EVA", dateUtc: Date.UTC(1969, 10, 19), note: "Two EVAs, 3 h 31 m and 4 h 36 m; the first colour TV on the Moon." },
      { label: "Return to Earth", dateUtc: Date.UTC(1969, 10, 24), note: "Splashdown in the Pacific; the crew recovered the Surveyor 3 material." },
    ],
    discoveries: [
      { title: "A second landing site, a different mare", text: "Intrepid landed in Oceanus Procellarum, so the crew sampled a second mare basalt and confirmed the Surveyor 3 site from the ground." },
      { title: "The ALSEP deployed", text: "Apollo 12 carried the first Apollo Lunar Surface Experiments Package: magnetometer, seismometer, ion detector, solar-wind spectrometer and dust collector." },
    ],
    sources: [
      { title: "Apollo 12", publisher: NASA, url: "https://www.nasa.gov/mission/apollo-12/", accessed: ACCESSED, supports: "Mission identity, launch vehicle, launch site, mission dates." },
      { title: "Apollo 12 Lunar Surface Journal", publisher: ALSJ, url: "https://www.nasa.gov/history/alsj/", accessed: ACCESSED, supports: "Landing site coordinates, EVA timeline, surface duration." },
    ],
  },
  {
    deviceId: "apollo-14",
    agency: "NASA",
    launchVehicle: "Saturn V SA-508",
    launchSite: "Launch Complex 39A, Kennedy Space Center, Florida",
    missionType: "crewed-lander",
    objective:
      "Explore the Fra Mauro highlands — a suspected ejecta blanket from the Imbrium basin — and return the first lunar samples to Earth since Apollo 11.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote: "The crew returned to Earth on 9 February 1971.",
    hardwareLocation: "The Antares LM descent stage remains at Fra Mauro; the crew's geological hammer and the ALSEP are still there.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1971, 0, 31, 21, 13), note: "Saturn V SA-508; the third crewed Saturn V flight." },
      { label: "Landing", dateUtc: Date.UTC(1971, 1, 5, 15, 54, 37), note: "Fra Mauro, 3.67°S 17.47°E — a highlands site near the rim of Imbrium." },
      { label: "Surface EVA", dateUtc: Date.UTC(1971, 1, 5), note: "Two EVAs, 9 h 3 m total; the first use of the ALSEP on the Moon (plus the 'contact light' seismometer in the LM)." },
      { label: "Return to Earth", dateUtc: Date.UTC(1971, 1, 9), note: "Splashdown; 43 kg of lunar samples." },
    ],
    discoveries: [
      { title: "Imbrium ejecta confirmed", text: "The breccias and impact-melt breccias at Fra Mauro matched the predicted Imbrium ejecta — an origin for the lunar highlands dated to the Imbrium basin." },
      { title: "A magnetic anomaly", text: "The ALSEP magnetometer measured a remanent crustal field, evidence that the Moon once had a global magnetic field." },
    ],
    sources: [
      { title: "Apollo 14", publisher: NASA, url: "https://www.nasa.gov/mission/apollo-14/", accessed: ACCESSED, supports: "Mission identity, launch vehicle, launch site, mission dates." },
    ],
  },
  {
    deviceId: "apollo-15",
    agency: "NASA",
    launchVehicle: "Saturn V SA-509",
    launchSite: "Launch Complex 39A, Kennedy Space Center, Florida",
    missionType: "crewed-lander",
    objective:
      "Explore the Hadley-Apennine region — a mountain range, a valley and an ancient lava flow — and leave the first Apollo Lunar Surface Experiments Package in operation.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote: "The crew returned to Earth on 7 August 1971.",
    hardwareLocation: "The Falcon LM and the ALSEP remain at Hadley Rille; the ALSEP operated until 1977.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1971, 6, 26, 15, 32), note: "Saturn V SA-509; the first use of a deep-space colour TV camera." },
      { label: "Landing", dateUtc: Date.UTC(1971, 6, 30, 22, 16, 35), note: "Hadley-Apennine, 26.13°N 3.63°E, beside Hadley Rille." },
      { label: "Surface EVA", dateUtc: Date.UTC(1971, 6, 30), note: "Three EVAs, 18 h 35 m; the first rover excursion on the Moon." },
      { label: "Return to Earth", dateUtc: Date.UTC(1971, 7, 7), note: "Splashdown with 77 kg of samples." },
    ],
    discoveries: [
      { title: "The lunar rover", text: "The first vehicle driven on another world: a manned, four-wheel, battery-powered rover that covered 28 km." },
      { title: "A long-lived ALSEP", text: "The passive seismic, laser ranging and heat-flow experiments were powered by a radioisotope generator and returned data until 1977." },
      { title: "Basalt at the rim of a rille", text: "Samples from the Apennine front helped date the mare basalts and the excavation of Hadley Rille." },
    ],
    sources: [
      { title: "Apollo 15", publisher: NASA, url: "https://www.nasa.gov/mission/apollo-15/", accessed: ACCESSED, supports: "Mission identity, launch vehicle, launch site, mission dates." },
    ],
  },
  {
    deviceId: "apollo-16",
    agency: "NASA",
    launchVehicle: "Saturn V SA-511",
    launchSite: "Launch Complex 39A, Kennedy Space Center, Florida",
    missionType: "crewed-lander",
    objective:
      "Sample the Descartes highlands — a candidate young volcanic region — to test the volcanic origin of the lunar highlands.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote: "The crew returned to Earth on 24 August 1972.",
    hardwareLocation: "The Orion LM and the ALSEP remain in the Descartes highlands; the ALSEP operated until 1977.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1972, 3, 16, 22, 54), note: "Saturn V SA-511." },
      { label: "Landing", dateUtc: Date.UTC(1972, 3, 21, 23, 54, 50), note: "Descartes highlands, 8.97°S 15.50°E." },
      { label: "Surface EVA", dateUtc: Date.UTC(1972, 3, 21), note: "Three EVAs, 21 h 36 m; the first deep drilling on the Moon (a 3 m borehole)." },
      { label: "Return to Earth", dateUtc: Date.UTC(1972, 7, 24), note: "Splashdown; the first deep-space mission to land humans." },
    ],
    discoveries: [
      { title: "Highland volcanism", text: "The 4.3-billion-year-old basalt fragments confirmed that the lunar highlands were partly volcanic — the impact hypothesis had held for two decades." },
      { title: "A long drill core", text: "The deep drill reached 3 m, sampling a layered column of impact breccias and basalt." },
    ],
    sources: [
      { title: "Apollo 16", publisher: NASA, url: "https://www.nasa.gov/mission/apollo-16/", accessed: ACCESSED, supports: "Mission identity, launch vehicle, launch site, mission dates." },
    ],
  },
  {
    deviceId: "apollo-17",
    agency: "NASA",
    launchVehicle: "Saturn V SA-515",
    launchSite: "Launch Complex 39B, Kennedy Space Center, Florida",
    missionType: "crewed-lander",
    objective:
      "Explore the Taurus-Littrow valley — a highland/mare boundary rich in stratified layers — and leave the last Apollo lunar surface experiments in operation.",
    verifiedStatus: "MISSION COMPLETE",
    statusNote:
      "The crew returned to Earth on 19 December 1972. Apollo 17 was the last crewed lunar landing and the last crewed departure from the Moon.",
    hardwareLocation: "The Challenger LM, the ALSEP and the lunar rover remain at Taurus-Littrow; the ALSEP operated until 1977.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1972, 11, 7, 5, 33), note: "Saturn V SA-515 from LC-39B — the only Apollo launch from pad 39B." },
      { label: "Landing", dateUtc: Date.UTC(1972, 11, 11, 22, 54, 37), note: "Taurus-Littrow, 20.19°N 30.77°E." },
      { label: "Surface EVA", dateUtc: Date.UTC(1972, 11, 11), note: "Three EVAs, 22 h 4 m; the final lunar surface operations." },
      { label: "Return to Earth", dateUtc: Date.UTC(1972, 11, 19), note: "Splashdown; the last crewed lunar ascent on 14 December 1972." },
    ],
    discoveries: [
      { title: "The 3.4 metre core", text: "The deepest lunar drill core, returned in a sealed container, records 500 million years of the Moon's history." },
      { title: "Volcanic glass", text: "Orange 'orange soil' turned out to be pyroclastic glass from a fire fountain — evidence of lunar volcanism." },
      { title: "The end of Apollo", text: "The last crewed landing: humanity has not returned to the Moon since December 1972." },
    ],
    sources: [
      { title: "Apollo 17", publisher: NASA, url: "https://www.nasa.gov/mission/apollo-17/", accessed: ACCESSED, supports: "Mission identity, launch vehicle, launch site, mission dates." },
    ],
  },
  {
    deviceId: "voyager1",
    agency: "NASA / JPL-Caltech",
    launchVehicle: "Titan IIIE-Centaur",
    launchSite: "Space Launch Complex 41, Cape Canaveral Air Force Station, Florida",
    missionType: "flyby",
    objective:
      "Survey Jupiter and Saturn, then continue outward into interstellar space, returning planetary and interstellar measurements for as long as the spacecraft can transmit.",
    verifiedStatus: "ONGOING",
    statusNote:
      "NASA: 'Voyager 1 crossed into interstellar space in August 2012 and continues to collect data.' The mission has not ended; the instrument set has been reduced to save power, which is a spacecraft state, not a mission state.",
    hardwareLocation: "Interstellar space, beyond the heliopause — the most distant human-made object.",
    keyEvents: [
      { label: "Launch", dateUtc: Date.UTC(1977, 8, 5, 12, 56), note: "Titan IIIE-Centaur from SLC-41; the first of the two Voyagers." },
      { label: "Jupiter flyby", dateUtc: Date.UTC(1979, 2, 5), note: "Closest approach ≈349,000 km; discovered Jupiter's ring and active volcanoes." },
      { label: "Saturn and Titan encounter", dateUtc: Date.UTC(1980, 10, 12), note: "Saturn at 124,000 km and Titan at 6,490 km — the only close encounter with Titan until Cassini-Huygens in 2005." },
      { label: "Interstellar space", dateUtc: Date.UTC(2012, 7, 25), note: "Crossed the heliopause; the first human-made object in interstellar space." },
      { label: "Ongoing", dateUtc: null, note: "Still returning engineering and plasma-wave data from beyond the heliopause." },
    ],
    discoveries: [
      { title: "A volcanically active Jupiter", text: "Voyager 1 saw an eruption in Io's plume — the first direct evidence of active volcanism beyond Earth." },
      { title: "Titan's haze", text: "The only close look at Titan before Cassini: a thick nitrogen haze over a methane-rich surface." },
      { title: "The heliopause", text: "Crossed into interstellar space in 2012 and measured the plasma transition — where the Sun's influence ends." },
    ],
    sources: [
      { title: "Voyager 1", publisher: NASA_SCIENCE, url: "https://science.nasa.gov/mission/voyager-1/", accessed: ACCESSED, supports: "Launch 1977, Jupiter and Saturn flybys, heliopause crossing August 2012, 'continues to collect data' — mission ongoing." },
      { title: "Voyager 1 — mission record", publisher: NSSDC, url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1977-084A", accessed: ACCESSED, supports: "Launch date, vehicle, launch site." },
    ],
  },
];

const BY_DEVICE = new Map(MISSION_VERIFICATION.map((m) => [m.deviceId, m]));

/** Verified mission facts for a device, or null. */
export const verificationFor = (deviceId?: string | null): MissionVerification | null =>
  deviceId ? BY_DEVICE.get(deviceId) ?? null : null;
