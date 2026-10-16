import type { MediaAsset } from "@/types";
import pia05273 from "@/assets/nasa/PIA05273.jpg";
import pia06263 from "@/assets/nasa/PIA06263.jpg";
import pia08812 from "@/assets/nasa/PIA08812.jpg";
import pia15091 from "@/assets/nasa/PIA15091.jpg";
import pia07372 from "@/assets/nasa/PIA07372.jpg";
import pia17759 from "@/assets/nasa/PIA17759.jpg";
import pia17074 from "@/assets/nasa/PIA17074.jpg";
import pia17074fig from "@/assets/nasa/PIA17074_fig1.jpg";
import pia05138 from "@/assets/nasa/PIA05138.jpg";

const LICENSE = "NASA imagery is generally not subject to copyright. Credit retained.";
const mk = (id: string, title: string, pia: string, url: string, caption: string): MediaAsset => ({
  id,
  type: "image",
  title,
  source: "NASA Photojournal",
  url,
  credit: "NASA/JPL-Caltech",
  licenseNote: LICENSE,
  artifactId: "opportunity",
  accuracy: "official",
  caption,
  recordUrl: `https://photojournal.jpl.nasa.gov/catalog/${pia}`,
});

export const MEDIA: MediaAsset[] = [
  mk("media-pia05273", '"Berries" on the Ground (PIA05273)', "PIA05273", pia05273, "Microscopic Imager mosaic of hematite-rich spherules in martian soil near the Stone Mountain outcrop, Meridiani Planum. February 2004."),  mk("media-pia06263", "Layers Inside Endurance (PIA06263)", "PIA06263", pia06263, "Navigation camera view of rock layers on the inner slope of Endurance crater, sol 134 (9 June 2004)."),
  mk("media-pia15091", "Layers in Burns Cliff (PIA15091)", "PIA15091", pia15091, "Panoramic camera image of layered, sulfate-rich sediments in the Burns Cliff slope of Endurance crater, 2004."),
  mk("media-pia08812", "The Opportunity Rover at Victoria Crater (PIA08812)", "PIA08812", pia08812, "Orbital view of the rover at the rim of Victoria crater, October 2006."),
  mk("media-pia07372", "Opportunity Self-Portrait, Sols 322–323 (PIA07372)", "PIA07372", pia07372, "Self-portrait assembled from Pancam images, 2005. A direct reference for rover proportions."),
  mk("media-pia17759", "Self-Portrait by Opportunity, January 2014 (PIA17759)", "PIA17759", pia17759, "Self-portrait recorded about three weeks before the rover completed a decade of work on Mars."),
  {
    id: "media-pia17074",
    type: "image",
    title: "'Esperance' Target Examined by Opportunity (PIA17074)",
    source: "NASA Photojournal",
    url: pia17074,
    credit: "NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.",
    licenseNote: LICENSE,
    artifactId: "opportunity",
    accuracy: "official",
    caption: "Pancam false-color composite of three exposures through different filters, showing the pale rock 'Esperance' (about 70 cm across). Sol 3230 (23 February 2013).",
    recordUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA17074",
    sol: 3230,
    instrumentId: "pancam",
    imageType: "FALSE COLOR COMPOSITE",
  },
  {
    id: "media-pia17074-fig",
    type: "image",
    title: "'Esperance' Annotated Target Map (PIA17074 fig. 1)",
    source: "NASA Photojournal",
    url: pia17074fig,
    credit: "NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.",
    licenseNote: LICENSE,
    artifactId: "opportunity",
    accuracy: "official",
    caption: "Authoritative annotated version marking the RAT-abraded target point 'Esperance6' analysed by APXS.",
    recordUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA17074",
    sol: 3230,
    instrumentId: "pancam",
    imageType: "ANNOTATED",
  },
  {
    id: "media-pia05138",
    type: "image",
    title: "First Panoramic Look at Meridiani Planum (PIA05138)",
    source: "NASA Photojournal",
    url: pia05138,
    credit: "NASA/JPL-Caltech/Cornell",
    licenseNote: LICENSE,
    artifactId: "opportunity",
    accuracy: "official",
    caption: "360-degree Pancam panorama from Eagle crater shortly after touchdown (January 2004). Grayscale mosaic; this is the actual landing-site view, not a reconstruction.",
    recordUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA05138",
    instrumentId: "pancam",
    imageType: "PANORAMIC MOSAIC",
  },
];

export const mediaById = (id: string) => MEDIA.find((m) => m.id === id);
