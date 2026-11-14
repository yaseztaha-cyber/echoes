/**
 * Every image on the page is a real asset from the NASA Image and Video Library
 * (images.nasa.gov). IDs were looked up and visually checked; `hasMedium` records
 * whether the 1280px rendition exists (some assets only have a 640px "small").
 */
export type Img = {
  id: string;
  alt: string;
  /** Short credit line shown in captions */
  credit: string;
  /** Short kind note, e.g. "Artist's concept" */
  note?: string;
  hasMedium: boolean;
};

const BASE = "https://images-assets.nasa.gov/image";

export const imgUrl = (img: Img, size: "small" | "medium" = "medium") =>
  `${BASE}/${img.id}/${img.id}~${size === "medium" && !img.hasMedium ? "small" : size}.jpg`;

export const imgSrcSet = (img: Img) =>
  img.hasMedium ? `${imgUrl(img, "small")} 640w, ${imgUrl(img, "medium")} 1280w` : undefined;

const I = (id: string, alt: string, credit: string, hasMedium = true, note?: string): Img => ({
  id,
  alt,
  credit,
  hasMedium,
  note,
});

export const IMG = {
  saturnShadow: I(
    "PIA08329",
    "Saturn backlit by the Sun, its disc dark and its rings glowing, photographed by the Cassini spacecraft from Saturn's shadow.",
    "NASA/JPL/Space Science Institute",
  ),
  earthSmiled: I(
    "PIA17172",
    "Saturn and its rings backlit by the Sun, with Earth visible as a faint dot beyond the rings, imaged by Cassini.",
    "NASA/JPL-Caltech/Space Science Institute",
  ),
  mercuryHorizon: I(
    "PIA10176",
    "The cratered, sunlit limb of Mercury against black space, imaged by MESSENGER on approach to its first flyby.",
    "NASA/JHUAPL/Carnegie Institution of Washington",
    false,
  ),
  venusGlobe: I(
    "PIA00271",
    "Computer-simulated global view of Venus's northern hemisphere built from Magellan radar data.",
    "NASA/JPL",
    true,
    "Radar-derived rendering",
  ),
  earthApollo: I(
    "as17-148-22727",
    "The full disk of Earth seen by the Apollo 17 crew on their way to the Moon, showing Africa, Antarctica and swirling cloud.",
    "NASA/Apollo 17 crew",
  ),
  moonAldrin: I(
    "as11-40-5902",
    "Astronaut Buzz Aldrin walking on the lunar surface beside a leg of the Apollo 11 lunar module.",
    "NASA/Apollo 11",
  ),
  marsGlobe: I(
    "PIA00407",
    "Global colour view of Mars, with the Valles Marineris canyon system and a polar ice cap, mosaicked from Viking orbiter images.",
    "NASA/JPL/USGS",
  ),
  jupiterSpot: I(
    "PIA00022",
    "Mosaic of Jupiter's Great Red Spot and surrounding cloud bands taken by Voyager 1 in March 1979.",
    "NASA/JPL",
  ),
  uranus: I(
    "PIA18182",
    "Uranus as a pale blue-green featureless globe, photographed by Voyager 2 in 1986.",
    "NASA/JPL-Caltech",
  ),
  neptune: I(
    "PIA01492",
    "Neptune, a deep blue globe with bright cloud streaks and the Great Dark Spot, imaged by Voyager 2.",
    "NASA/JPL",
  ),
  plutoHaze: I(
    "PIA19948",
    "Pluto's icy mountains and flat plains near the sunset terminator, with layers of haze lit from behind, taken by New Horizons 15 minutes after closest approach.",
    "NASA/JHUAPL/SwRI",
  ),
  voyager: I(
    "PIA04495",
    "Artist's concept of a Voyager spacecraft with its large white dish antenna pointed at Earth, against a starfield.",
    "NASA/JPL",
    true,
    "Artist's concept",
  ),
  magellan: I(
    "S88-50418",
    "The Magellan Venus radar-mapper spacecraft in a cleanroom during checkout, with technicians in protective suits.",
    "NASA",
    true,
    "Pre-launch checkout",
  ),
  messenger: I(
    "PIA18145",
    "Artist's impression of the MESSENGER spacecraft in orbit around Mercury, its sunshade facing the Sun.",
    "NASA/JHUAPL/Carnegie Institution of Washington",
    true,
    "Artist's concept",
  ),
  cassini: I(
    "PIA04603",
    "The Cassini spacecraft in a JPL assembly room, wrapped in gold thermal blanket with its white high-gain antenna on top.",
    "NASA/JPL",
    true,
    "Pre-launch assembly",
  ),
  opportunity: I(
    "PIA17759",
    "Self-portrait mosaic of the Opportunity rover on Mars, its solar panels covered in dust.",
    "NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.",
  ),
  curiosity: I(
    "PIA19142",
    "Curiosity rover self-portrait at the Mojave drill site on Mount Sharp, with the Martian horizon behind.",
    "NASA/JPL-Caltech/MSSS",
  ),
  newHorizons: I(
    "PIA10075",
    "Artist's concept of the New Horizons spacecraft with its large dish, flying past Pluto with its moon Charon in the distance.",
    "NASA/JHUAPL/SwRI",
    true,
    "Artist's concept",
  ),
  perseverance: I(
    "PIA24542",
    "Perseverance rover selfie on Mars with the small Ingenuity helicopter about four metres away, on the floor of Jezero Crater.",
    "NASA/JPL-Caltech/MSSS",
  ),
  gale: I(
    "PIA21255",
    "Illustration of Gale Crater in cross-section showing the ancient lake that deposited mudstone, the sandstone, and Mount Sharp above.",
    "NASA/JPL-Caltech",
    false,
    "Illustration",
  ),
  enceladus: I(
    "PIA14599",
    "The dark side of Saturn's moon Enceladus as a thin sunlit crescent, with a plume of ice particles spraying from the south pole.",
    "NASA/JPL-Caltech/Space Science Institute",
    false,
  ),
  venusRadar: I(
    "PIA00248",
    "Magellan radar images of Aphrodite Terra on Venus, showing ridged and fractured volcanic plains.",
    "NASA/JPL",
    false,
    "Radar imagery",
  ),
} satisfies Record<string, Img>;
