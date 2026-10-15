/**
 * Phase 3 globe-texture manifest. Machine-readable provenance for every bundled
 * planetary surface map. Generated deliveries: scripts/build-globes.py
 * (2048x1024 sRGB JPEG in src/assets/tex/ + 4096x2048 hi-res in assets-hi/).
 * Verified facts only — see docs/PLANETARY_ASSET_AUDIT.md Phase 3 section.
 */
export type GlobeKind = "earth" | "moon" | "mars";

export interface GlobeAsset {
  id: string;
  body: string;
  /** Surface vs alternate view (venus clouds) vs flat science record (sun). */
  view?: string;
  /** Flat full-disk record, not a spherical map (sun science channels). */
  flat?: boolean;
  /** OBSERVED | MOSAIC | ENHANCED | REPRESENTATIVE | RECONSTRUCTED | SIMULATED (+qualifiers). */
  class: string;
  /** Observation epoch or product date. Never invented. */
  epoch: string;
  org: string;
  product: string;
  sourceUrl: string;
  sourceFile: string;
  sourcePx: [number, number];
  deliveredPx: [number, number];
  hiresPx: [number, number];
  projection: string;
  colorClass: string;
  processing: string;
  gaps: string;
  credit: string;
  format: string;
  colorSpace: "SRGBColorSpace";
  /** Runtime hi-res URL (public/, on-demand only) for bodies with 4K delivery. */
  hiresUrl?: string;
  orientation: string;
  status: "APPROVED";
}

export const GLOBE_MANIFEST: GlobeAsset[] = [
  {
    id: "earth-bmng-2004",
    body: "earth",
    class: "ENHANCED (seasonal composite + shaded relief)",
    epoch: "December 2004 base composite",
    org: "NASA Earth Observatory",
    product: "Blue Marble Next Generation, Topography + Bathymetry, December 2004 base",
    sourceUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
    sourceFile: "earth_bmng_5400.jpg",
    sourcePx: [5400, 2700],
    deliveredPx: [2048, 1024],
    hiresPx: [4096, 2048],
    projection: "Equirectangular 2:1, left edge -180 deg (verified: 0.0 deg shift vs prior map, corr 0.93)",
    colorClass: "Natural-color composite with shaded relief and bathymetry",
    processing: "LANCZOS downsample only; December seasonal composite, not an instantaneous snapshot",
    gaps: "Seasonal (December) snow/vegetation state; no night side, no clouds layer",
    credit: "NASA Earth Observatory / Blue Marble",
    format: "JPEG q90",
    hiresUrl: "/tex-hi/earth_4k.jpg",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified aligned with renderer UV + markers",
    status: "APPROVED",
  },
  {
    id: "moon-lroc-2025",
    body: "moon",
    class: "MOSAIC (white-balanced WAC bands; polar fill interpolated)",
    epoch: "LROC 2009–; map reprocessed Dec 2025",
    org: "NASA Scientific Visualization Studio (LRO camera + laser altimeter teams)",
    product: "CGI Moon Kit 2025 color map (Dec 2025 reprocessing)",
    sourceUrl: "https://svs.gsfc.nasa.gov/4720/",
    sourceFile: "moon_lroc_4k.tif",
    sourcePx: [4096, 2048],
    deliveredPx: [2048, 1024],
    hiresPx: [4096, 2048],
    projection: "Equirectangular 2:1, centered 0 deg lon (verified: ~0 deg shift vs prior map)",
    colorClass: "White-balanced mosaic of LROC WAC bands 643/566/415 nm (human-vision match)",
    processing: "LANCZOS downsample only. SVS: high-latitude dropouts inpainted; beyond +/-70 deg filled with LDAM laser albedo; optimized for aesthetics, not science",
    gaps: "Polar fill is laser albedo, not camera imagery; no elevation wired (displacement map retained for later phase)",
    credit: "NASA SVS / LRO / Arizona State University",
    format: "JPEG q90",
    hiresUrl: "/tex-hi/moon_4k.jpg",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified aligned with renderer UV + markers",
    status: "APPROVED",
  },
  {
    id: "mars-mdim21",
    body: "mars",
    class: "MOSAIC (Viking Orbiter color mosaic)",
    epoch: "Viking Orbiter 1976–1980; mosaic v2.1",
    org: "USGS Astrogeology (Viking Orbiter imagery)",
    product: "Mars Viking MDIM 2.1 color mosaic, 1 km/px rendition",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m",
    sourceFile: "mars_mdim21_1km.jpg",
    sourcePx: [21339, 10670],
    deliveredPx: [2048, 1024],
    hiresPx: [4096, 2048],
    projection: "Equirectangular 2:1 (verified via Syrtis Major 72.5E + Hellas 71.2E pixel checks)",
    colorClass: "Calibrated Viking color mosaic (no material tint repaint in renderer)",
    processing: "LANCZOS downsample only. Replaces legacy 1000x500 texture that was shifted 180 deg (markers previously sat on the wrong hemisphere)",
    gaps: "Viking-era coverage/processing lineage per USGS record; regional detail deferred to streaming phase",
    credit: "USGS Astrogeology / NASA Viking",
    format: "JPEG q90",
    hiresUrl: "/tex-hi/mars_4k.jpg",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified aligned with renderer UV + markers",
    status: "APPROVED",
  },
  {
    id: "mercury-mdis-bdr",
    body: "mercury",
    class: "MOSAIC (750-nm monochrome reflectance)",
    epoch: "MESSENGER 2011–2015; basemap v1 May 2016",
    org: "USGS Astrogeology (MESSENGER MDIS)",
    product: "MDIS Global Basemap BDR 166m, 1024px sample rendition",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_basemap_bdr_166m",
    sourceFile: "mercury_mdis_1024.jpg",
    sourcePx: [1024, 512],
    deliveredPx: [1024, 512],
    hiresPx: [1024, 512],
    projection: "Simple cylindrical, longitude -180 to 180 (per product record)",
    colorClass: "Monochrome 750-nm reflectance; not visible color",
    processing: "None (used as published)",
    gaps: "Single-band monochrome; 4 GB full product retained via re-fetch URL only",
    credit: "NASA/JHUAPL/USGS Astrogeology",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular per product record; renderer UV verified on sibling maps",
    status: "APPROVED",
  },
  {
    id: "venus-magellan",
    body: "venus",
    view: "surface",
    class: "MOSAIC (RADAR — brightness is backscatter, not color)",
    epoch: "Magellan 1990–1994",
    org: "NASA/JPL (Magellan radar mapping)",
    product: "JPL tmaps ven0aaa2 global radar mosaic",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/venus.html",
    sourceFile: "ven0aaa2.jpg",
    sourcePx: [1440, 720],
    deliveredPx: [1440, 720],
    hiresPx: [1440, 720],
    projection: "Equirectangular (verified: Maxwell Montes lands at 2.0E vs 3E documented)",
    colorClass: "Grayscale radar backscatter presented as-is; must never be called a photograph",
    processing: "None (used as published)",
    gaps: "Radar reveals topography, not surface color; cloud deck never penetrated optically",
    credit: "NASA/JPL-Caltech (Magellan)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified via Maxwell Montes",
    status: "APPROVED",
  },
  {
    id: "venus-clouds-rep",
    body: "venus",
    view: "clouds",
    class: "REPRESENTATIVE (fictitious visible-light appearance, JPL-labelled)",
    epoch: "N/A — not an observation",
    org: "NASA/JPL (David Seal, tmaps ven0mss2)",
    product: "Fictitious Venus cloud appearance for the atmosphere view",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/venus.html",
    sourceFile: "ven0mss2.jpg",
    sourcePx: [1440, 720],
    deliveredPx: [1440, 720],
    hiresPx: [1440, 720],
    projection: "Equirectangular-style wraparound (appearance only)",
    colorClass: "Representative pale-sulfuric cloud deck",
    processing: "None (used as published)",
    gaps: "The entire entry is an appearance stand-in, labelled in UI + manifest",
    credit: "NASA/JPL-Caltech (fictitious — David Seal)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (appearance)",
    status: "APPROVED",
  },
  {
    id: "jupiter-voyager",
    body: "jupiter",
    class: "MOSAIC (Voyager observations; storms drift — not current)",
    epoch: "Voyager 1979 flybys",
    org: "NASA/JPL (Voyager imaging)",
    product: "JPL tmaps jup0vss1 global mosaic",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/jupiter.html",
    sourceFile: "jup0vss1.jpg",
    sourcePx: [720, 360],
    deliveredPx: [720, 360],
    hiresPx: [720, 360],
    projection: "Equirectangular (JPL tmaps convention, verified on Venus sibling)",
    colorClass: "Observed cloud bands and storms at 1979 epoch",
    processing: "None (used as published)",
    gaps: "720px — soft on close approach; atmosphere has changed since 1979",
    credit: "NASA/JPL-Caltech (Voyager)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular per tmaps convention; discrete-storm alignment approximate",
    status: "APPROVED",
  },
  {
    id: "saturn-rep",
    body: "saturn",
    class: "REPRESENTATIVE (JPL-labelled fictitious globe, Don Davis)",
    epoch: "N/A — not an observation",
    org: "NASA/JPL (Don Davis artwork, tmaps sat0fds1)",
    product: "Fictitious Saturn globe + representative ring shading",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/saturn.html",
    sourceFile: "sat0fds1.jpg",
    sourcePx: [720, 360],
    deliveredPx: [720, 360],
    hiresPx: [720, 360],
    projection: "Equirectangular-style wraparound (appearance only)",
    colorClass: "Representative banded appearance; rings are separate geometry (inner 1.24R, outer 2.27R per documented C/A edges), representative shading",
    processing: "None (used as published)",
    gaps: "Not Cassini data; replace with observed mosaic when a suitable one is verified",
    credit: "NASA/JPL-Caltech (fictitious — Don Davis)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (appearance; zonal symmetry)",
    status: "APPROVED",
  },
  {
    id: "uranus-rep",
    body: "uranus",
    class: "REPRESENTATIVE (JPL-labelled fictional globe; restrained by design)",
    epoch: "N/A — not an observation",
    org: "NASA/JPL (tmaps ura0fss1)",
    product: "Fictional Uranus globe, pale-cyan restrained appearance",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/uranus.html",
    sourceFile: "ura0fss1.jpg",
    sourcePx: [720, 360],
    deliveredPx: [720, 360],
    hiresPx: [720, 360],
    projection: "Equirectangular-style wraparound (appearance only)",
    colorClass: "Representative pale-cyan; no invented continents or storms",
    processing: "None (used as published)",
    gaps: "No verified global feature map wired; replace with Voyager/HST product when verified",
    credit: "NASA/JPL-Caltech (fictional)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (appearance; near-featureless)",
    status: "APPROVED",
  },
  {
    id: "neptune-rep",
    body: "neptune",
    class: "REPRESENTATIVE (JPL-labelled fictional globe; no permanent-storm claim)",
    epoch: "N/A — not an observation",
    org: "NASA/JPL (Davis, tmaps nep0fds1)",
    product: "Fictional Neptune globe",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/neptune.html",
    sourceFile: "nep0fds1.jpg",
    sourcePx: [720, 360],
    deliveredPx: [720, 360],
    hiresPx: [720, 360],
    projection: "Equirectangular-style wraparound (appearance only)",
    colorClass: "Representative deep-blue; any storm features are illustrative, not the 1989 Great Dark Spot",
    processing: "None (used as published)",
    gaps: "No verified global feature map wired; replace with Voyager-epoch labelled product when verified",
    credit: "NASA/JPL-Caltech (fictional — Davis)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (appearance)",
    status: "APPROVED",
  },
  {
    id: "pluto-nh-mosaic",
    body: "pluto",
    class: "MOSAIC (LORRI encounter mosaic; far side lower resolution)",
    epoch: "New Horizons flyby July 2015",
    org: "USGS Astrogeology (New Horizons LORRI/MVIC)",
    product: "Pluto New Horizons LORRI-MVIC Global Mosaic 300m (8-bit rendition)",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/pluto_new_horizons_lorri_mvic_global_mosaic_300m",
    sourceFile: "pluto_300m.tif",
    sourcePx: [24888, 12444],
    deliveredPx: [2048, 1024],
    hiresPx: [4096, 2048],
    projection: "Equirectangular, Pluto radii 1188.3 km (per product record)",
    colorClass: "Monochrome mosaic rendition; terrain south of ~30S was in darkness (black)",
    processing: "LANCZOS downsample only",
    gaps: "Southern polar night black; far-side resolution coarser; no invented far-side geography",
    credit: "USGS Astrogeology / NASA/JHUAPL/SwRI (New Horizons)",
    format: "JPEG q90",
    hiresUrl: "/tex-hi/pluto_4k.jpg",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular per product record",
    status: "APPROVED",
  },
  {
    id: "sun-visible-recon",
    body: "sun",
    class: "RECONSTRUCTED (granulation visualization derived from SDO/HMI continuum)",
    epoch: "SDO/HMI record retrieved Oct 2026",
    org: "ECHOES processing of NASA SDO/HMI full-disk continuum",
    product: "Photosphere granulation: central-disk crop, limb-darkening normalized, mirror-tiled",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_hmiic.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 512],
    hiresPx: [1024, 512],
    projection: "Statistical fill — every pixel originates from HMI, geometry beyond central crop is not data",
    colorClass: "Warm-tinted granulation field; labelled RECONSTRUCTED in UI",
    processing: "scripts/build-system.py build_sun_surface (documented 4-step method)",
    gaps: "Not a spherical observation; limb, poles and far side are fill",
    credit: "NASA SDO/HMI (reconstruction method documented in audit)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (statistical)",
    status: "APPROVED",
  },
  {
    id: "sun-hmi-flat",
    body: "sun",
    view: "continuum",
    flat: true,
    class: "OBSERVED (full-disk intensitygram, presented flat — not a spherical map)",
    epoch: "Retrieved Oct 2026 latest-image feed; exact timestamp not embedded",
    org: "NASA SDO/HMI",
    product: "HMI continuum full-disk 1024",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_hmiic.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 1024],
    hiresPx: [1024, 1024],
    projection: "Orthographic full-disk (flat)",
    colorClass: "Near-natural continuum",
    processing: "None (used as published)",
    gaps: "Snapshot record; fetch dated product for research use",
    credit: "NASA SDO/HMI",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (flat disk)",
    status: "APPROVED",
  },
  {
    id: "sun-aia304-flat",
    body: "sun",
    view: "304",
    flat: true,
    class: "OBSERVED (FALSE COLOR EUV — science visualization, never naked-eye)",
    epoch: "Retrieved Oct 2026 latest-image feed; exact timestamp not embedded",
    org: "NASA SDO/AIA",
    product: "AIA 304 Å full-disk 1024 (chromosphere/TR ~50,000 K)",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_0304.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 1024],
    hiresPx: [1024, 1024],
    projection: "Orthographic full-disk (flat)",
    colorClass: "False-color EUV",
    processing: "None (used as published)",
    gaps: "Snapshot record; fetch dated product for research use",
    credit: "NASA SDO/AIA",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (flat disk)",
    status: "APPROVED",
  },
  {
    id: "sun-aia193-flat",
    body: "sun",
    view: "193",
    flat: true,
    class: "OBSERVED (FALSE COLOR EUV — science visualization, never naked-eye)",
    epoch: "Retrieved Oct 2026 latest-image feed; exact timestamp not embedded",
    org: "NASA SDO/AIA",
    product: "AIA 193 Å full-disk 1024 (hot corona ~1.25 MK)",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_0193.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 1024],
    hiresPx: [1024, 1024],
    projection: "Orthographic full-disk (flat)",
    colorClass: "False-color EUV",
    processing: "None (used as published)",
    gaps: "Snapshot record; fetch dated product for research use",
    credit: "NASA SDO/AIA",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (flat disk)",
    status: "APPROVED",
  },
];

const byBody = new Map<string, GlobeAsset>();
for (const m of GLOBE_MANIFEST) {
  // Surface/default view wins; alternate views (venus clouds) and flat science
  // records (sun) are reachable by id, never by accident.
  if (!m.flat && (m.view === undefined || m.view === "surface")) byBody.set(m.body, m);
  else if (!byBody.has(m.body)) byBody.set(m.body, m);
}

/** Asset selection for a globe kind. Returns null for bodies without a verified map. */
export function globeAssetFor(kind: string): GlobeAsset | null {
  return byBody.get(kind) ?? null;
}

/** Structural validation: every required provenance field present and sane. */
export function validateManifest(list: GlobeAsset[]): string[] {
  const problems: string[] = [];
  const required: (keyof GlobeAsset)[] = [
    "id", "body", "class", "epoch", "org", "product", "sourceUrl", "sourceFile", "sourcePx",
    "deliveredPx", "projection", "colorClass", "processing", "gaps",
    "credit", "format", "colorSpace", "orientation", "status",
  ];
  for (const m of list) {
    for (const k of required) {
      const v = m[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.some((n) => !(n > 0)))) {
        problems.push(`${m.id || m.body}: missing/invalid '${k}'`);
      }
    }
    if (m.sourceUrl && !m.sourceUrl.startsWith("https://")) problems.push(`${m.id}: sourceUrl not https`);
    if (m.deliveredPx && m.sourcePx && (m.deliveredPx[0] > m.sourcePx[0] || m.deliveredPx[1] > m.sourcePx[1])) {
      problems.push(`${m.id}: delivered resolution exceeds source (upscaling forbidden)`);
    }
    if (m.colorSpace !== "SRGBColorSpace") problems.push(`${m.id}: color imagery must be sRGB`);
  }
  return problems;
}
