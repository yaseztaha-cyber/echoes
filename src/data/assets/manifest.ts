/**
 * Phase 3 globe-texture manifest. Machine-readable provenance for every bundled
 * planetary surface map. Generated deliveries: scripts/build-globes.py
 * (2048x1024 sRGB JPEG in src/assets/tex/ + 4096x2048 hi-res in assets-hi/).
 * Verified facts only — see docs/PLANETARY_ASSET_AUDIT.md Phase 3 section.
 */
export type GlobeKind =
  | "earth"
  | "moon"
  | "mars"
  | "mercury"
  | "venus"
  | "venus_clouds"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "sun";

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
    gaps: "Seasonal (December) snow/vegetation state; night lights and clouds shipped as separate labelled layers (earth-clouds-2ndhand, earth-night-viirs-2016)",
    credit: "NASA Earth Observatory / Blue Marble",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified aligned with renderer UV + markers",
    status: "APPROVED",
  },
  {
    id: "earth-clouds-2ndhand",
    body: "earth",
    view: "clouds",
    class: "MOSAIC (NASA-derived cloud composite; provenance chain incomplete)",
    epoch: "Unknown (pre-2020 composite era per delivered file)",
    org: "Upstream NASA-derived, secondhand copy via three.js examples",
    product: "Global cloud composite (alpha cloud mask), delivered as alpha-derived grayscale",
    sourceUrl: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
    sourceFile: "earth_clouds_1024.png",
    sourcePx: [1024, 512],
    deliveredPx: [1024, 512],
    hiresPx: [1024, 512],
    projection: "Equirectangular 2:1, left edge -180 deg (standard per product convention; not feature-verified)",
    colorClass: "White cloud opacity mask (alpha), rendered as a lit white alphaMap layer",
    processing: "Alpha channel extracted and transcoded to grayscale JPEG q92 (scripts/build-earth-layers.py); geolocation unverified upstream",
    gaps: "Secondhand provenance: exact observation set, epoch and processing chain of the upstream composite unknown; replace with a direct NASA/SVS cloud product when verified",
    credit: "upstream: NASA (chain incomplete); courtesy three.js examples",
    format: "JPEG q92 (grayscale mask)",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular as delivered by three.js examples",
    status: "APPROVED",
  },
  {
    id: "earth-night-viirs-2016",
    body: "earth",
    view: "night",
    class: "MOSAIC (VIIRS Day/Night Band annual composite)",
    epoch: "Annual composite, 2016",
    org: "NASA Earth Observatory (Suomi NPP VIIRS team, NASA/GSFC)",
    product: "NASA Black Marble 2016 global night-lights composite, 0.01 deg/px rendition",
    sourceUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg",
    sourceFile: "BlackMarble_2016_01deg.jpg",
    sourcePx: [3600, 1800],
    deliveredPx: [2048, 1024],
    hiresPx: [2048, 1024],
    projection: "Equirectangular 2:1, left edge -180 deg (EO Black Marble global convention)",
    colorClass: "City-light radiance composite; presented on the night hemisphere only in renderer",
    processing: "LANCZOS downsample only (scripts/build-earth-layers.py). EO processing notes: cloud-free compositing from VIIRS high-latency near-real-time levels, stray-light and BRDF corrections upstream",
    gaps: "2016 epoch (not current); gas flares and boat lights included by sensor physics; not an instantaneous snapshot",
    credit: "NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Roman (NASA GSFC)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular per EO product",
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
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular per product record",
    status: "APPROVED",
  },
  {
    id: "sun-visible-recon",
    body: "sun",
    class: "OBSERVED + RECONSTRUCTED (real SDO/HMI continuum photosphere; far side mirrored)",
    epoch: "SDO/HMI continuum retrieved 2026-10-23 (latest-image feed, full-resolution 4096)",
    org: "ECHOES reprojection of NASA SDO/HMI full-disk continuum (HMIIC)",
    product: "Photosphere: real limb darkening, granulation and spot groups; sphere-mapped",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_hmiic_4096.jpg",
    sourcePx: [4096, 4096],
    deliveredPx: [4096, 2048],
    hiresPx: [4096, 2048],
    projection: "Equirectangular rebuilt from the orthographic disk (scripts/build-sun-channels.py inverse-ortho, bilinear; three.js UV convention)",
    colorClass: "Grayscale continuum intensity only (no baked color); white-gold tone ramp + disclosed contrast stretch applied in the shader — labelled OBSERVED+RECONSTRUCTED in UI",
    processing: "scripts/build-sun-channels.py (disk autodetect, inverse orthographic resample, P-angle left as published, far side = east-west mirror at 85%)",
    gaps: "Far side of a single full-disk snapshot is unreachable — mirrored fill, slightly darkened; ~±7.25° P-angle not de-rotated; measured continuum spans only p1–p95 = 0.56–0.70, so the shader stretches ~2.8× around the median (disclosed reconstruction)",
    credit: "NASA/SDO and the HMI science team (reconstruction method documented in audit)",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Equirectangular, solar north up",
    status: "APPROVED",
  },
  {
    id: "sun-hmi-mag-recon",
    body: "sun",
    view: "magnetic",
    class: "OBSERVED + RECONSTRUCTED (real SDO/HMI line-of-sight magnetogram; far side mirrored)",
    epoch: "SDO/HMI magnetogram retrieved 2026-10-23 (latest-image feed)",
    org: "ECHOES reprojection of NASA SDO/HMI LOS magnetogram (HMIB)",
    product: "Photospheric line-of-sight magnetic field, sphere-mapped (white = toward observer, black = away)",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_HMIB.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 512],
    hiresPx: [2048, 1024],
    projection: "Equirectangular rebuilt from the orthographic disk (scripts/build-sun-channels.py inverse-ortho, bilinear)",
    colorClass: "Grayscale quantity map, not natural color",
    processing: "scripts/build-sun-channels.py (disk autodetect, inverse orthographic resample, far side = east-west mirror at 85%)",
    gaps: "Line-of-sight component only (horizontal field invisible); far side mirrored fill; P-angle not de-rotated",
    credit: "NASA/SDO and the HMI science team",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Equirectangular, solar north up",
    status: "APPROVED",
  },
  {
    id: "sun-aia304-recon",
    body: "sun",
    view: "chromosphere",
    class: "OBSERVED + RECONSTRUCTED (false-color EUV, SDO/AIA 304 Å; far side mirrored)",
    epoch: "SDO/AIA 304 Å retrieved 2026-10-23 (latest-image feed)",
    org: "ECHOES reprojection of NASA SDO/AIA 304 Å full-disk",
    product: "Chromosphere/transition region ~50,000 K, sphere-mapped false color",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_0304.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 512],
    hiresPx: [2048, 1024],
    projection: "Equirectangular rebuilt from the orthographic disk (scripts/build-sun-channels.py inverse-ortho, bilinear)",
    colorClass: "False-color EUV (science visualization, never naked-eye)",
    processing: "scripts/build-sun-channels.py (disk autodetect, inverse orthographic resample, far side = east-west mirror at 85%)",
    gaps: "EUV emission is optically thin — the disk edge is not the photosphere limb; far side mirrored fill",
    credit: "NASA/SDO/AIA",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Equirectangular, solar north up",
    status: "APPROVED",
  },
  {
    id: "sun-aia171-recon",
    body: "sun",
    view: "corona",
    class: "OBSERVED + RECONSTRUCTED (false-color EUV, SDO/AIA 171 Å; far side mirrored)",
    epoch: "SDO/AIA 171 Å retrieved 2026-10-23 (latest-image feed)",
    org: "ECHOES reprojection of NASA SDO/AIA 171 Å full-disk",
    product: "Quiet corona / coronal loops ~0.6–1 MK, sphere-mapped false color",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_0171.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 512],
    hiresPx: [2048, 1024],
    projection: "Equirectangular rebuilt from the orthographic disk (scripts/build-sun-channels.py inverse-ortho, bilinear)",
    colorClass: "False-color EUV (science visualization, never naked-eye)",
    processing: "scripts/build-sun-channels.py (disk autodetect, inverse orthographic resample, far side = east-west mirror at 85%)",
    gaps: "The bright halo around the observed disk is LOS integration through the corona, not a surface; far side mirrored fill",
    credit: "NASA/SDO/AIA",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Equirectangular, solar north up",
    status: "APPROVED",
  },
  {
    id: "sun-doppler-recon",
    body: "sun",
    view: "motion",
    class: "OBSERVED + RECONSTRUCTED (SDO/HMI dopplergram; far side mirrored)",
    epoch: "SDO/HMI dopplergram retrieved 2026-10-23 (latest-image feed)",
    org: "ECHOES reprojection of NASA SDO/HMI dopplergram (HMID)",
    product: "Line-of-sight velocity map, sphere-mapped (gray = line-of-sight motion)",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
    sourceFile: "sdo_HMID.jpg",
    sourcePx: [1024, 1024],
    deliveredPx: [1024, 512],
    hiresPx: [2048, 1024],
    projection: "Equirectangular rebuilt from the orthographic disk (scripts/build-sun-channels.py inverse-ortho, bilinear)",
    colorClass: "Grayscale quantity map, not natural color",
    processing: "scripts/build-sun-channels.py (disk autodetect, inverse orthographic resample, far side = east-west mirror at 85%)",
    gaps: "Line-of-sight motion only (transverse flows invisible); far side mirrored fill; solar rotation signal included as published",
    credit: "NASA/SDO and the HMI science team",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "Equirectangular, solar north up",
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
    body: "sun",    view: "193",
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
  {
    id: "meridiani-panorama-05138",
    body: "mars",
    view: "panorama",
    flat: true,
    class: "OBSERVED (grayscale Pancam mosaic; location-correct for Eagle crater)",
    epoch: "January 2004, shortly after touchdown (sol not stated on record)",
    org: "NASA/JPL-Caltech/Cornell (MER Pancam)",
    product: "First Panoramic Look at Meridiani Planum (PIA05138), 360-degree mosaic",
    sourceUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA05138",
    sourceFile: "PIA05138.jpg",
    sourcePx: [1922, 595],
    deliveredPx: [1922, 595],
    hiresPx: [1922, 595],
    projection: "Cylindrical panoramic mosaic (flat strip; wraps horizontally)",
    colorClass: "Grayscale Pancam mosaic",
    processing: "None (used as published)",
    gaps: "Grayscale only; mosaic seams inherent to the record",
    credit: "NASA/JPL-Caltech/Cornell",
    format: "JPEG q90",
    colorSpace: "SRGBColorSpace",
    orientation: "N/A (panoramic strip)",
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

/* -------------------------------------------------------------------------
 * Phase 9 — site DEM patches. Real elevation (LOLA / MOLA) at the 9 mission
 * sites, extracted at build time by scripts/build-site-dems.py and shipped as
 * 256x256 16-bit grayscale PNGs (src/assets/terrain/dem). Height data, not
 * color imagery: the sRGB validation above therefore does not apply here.
 * Vertical: Int16 metres, 1 m/step (patch-relative, see hOffsetM in
 * demCatalog.ts). Horizontal: 0.5-deg patch bilinearly resampled from 128-ppd
 * native grids — a 4x upsample of the real ground sample distance, stated per
 * record. Macro relief comes from the DEM; sub-resolution detail stays
 * procedural and is labelled in the UI (DataResolution).
 * ---------------------------------------------------------------------- */

export interface SiteDemAsset {
  id: string;
  artifactId: string;
  world: "moon" | "mars";
  class: string;
  epoch: string;
  org: string;
  product: string;
  sourceUrl: string;
  sourceFile: string;
  nativePpd: number;
  nativeGspM: number;
  deliveredGspM: number;
  patchHalfDeg: number;
  deliveredPx: [number, number];
  file: string;
  processing: string;
  gaps: string;
  credit: string;
  vertical: string;
  status: "APPROVED";
}

const LOLA_SITE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128.img";
const MOLA = (tile: string) =>
  `https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/${tile}.img`;

function demRecord(
  artifactId: string,
  world: "moon" | "mars",
  tile: string,
  product: string,
  nativeGspM: number,
  deliveredGspM: number,
): SiteDemAsset {
  return {
    id: `dem-${artifactId}`,
    artifactId,
    world,
    class: "OBSERVED (laser altimeter DEM, build-time bilinear resample)",
    epoch: world === "moon" ? "LRO LOLA GDR LDEM_128 V1.0 (LRO mission data)" : "MGS MOLA MEGDR 128-ppd V1.0 (MGS mission data)",
    org: world === "moon" ? "NASA / MIT / GSFC (LRO LOLA team)" : "NASA / GSFC (MGS MOLA team)",
    product,
    sourceUrl: world === "moon" ? LOLA_SITE : MOLA(tile),
    sourceFile: world === "moon" ? "ldem_128.img (+.lbl)" : `${tile}.img (+.lbl)`,
    nativePpd: 128,
    nativeGspM,
    deliveredGspM,
    patchHalfDeg: 0.25,
    deliveredPx: [256, 256],
    file: `dem-${artifactId}.png`,
    processing: "HTTP-range row-window extraction, bilinear resample to 256x256, Int16 metres (1 m/step, per-patch offset in demCatalog.ts); 16-bit grayscale PNG",
    gaps: "Macro relief only above ~59 m (moon) / ~116 m (mars) delivered ground sample; sub-resolution site detail remains procedural and is labelled as such in UI",
    credit: "NASA / LOLA / MOLA teams (PDS Geosciences)",
    vertical: "Int16, 1 m quantization; patch-relative to floor(min) - 128 m offset",
    status: "APPROVED",
  };
}

export const SITE_DEM_MANIFEST: SiteDemAsset[] = [
  demRecord("apollo-12", "moon", "", "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)", 236.9, 59.5),
  demRecord("apollo-14", "moon", "", "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)", 236.9, 59.5),
  demRecord("apollo-15", "moon", "", "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)", 236.9, 59.5),
  demRecord("apollo-16", "moon", "", "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)", 236.9, 59.5),
  demRecord("apollo-17", "moon", "", "LOLA GDR LDEM_128 (LRO-L-LOLA-4-GDR-V1.0)", 236.9, 59.5),
  demRecord("sojourner", "mars", "megr44n270hb", "MOLA MEGDR 128-ppd radial tile megr44n270hb (MGS-M-MOLA-5-MEGDR-L3-V1.0)", 463.1, 116.2),
  demRecord("spirit", "mars", "megr00n090hb", "MOLA MEGDR 128-ppd radial tile megr00n090hb (MGS-M-MOLA-5-MEGDR-L3-V1.0)", 463.1, 116.2),
  demRecord("opportunity", "mars", "megr00n270hb", "MOLA MEGDR 128-ppd radial tile megr00n270hb (MGS-M-MOLA-5-MEGDR-L3-V1.0)", 463.1, 116.2),
  demRecord("insight", "mars", "megr44n090hb", "MOLA MEGDR 128-ppd radial tile megr44n090hb (MGS-M-MOLA-5-MEGDR-L3-V1.0)", 463.1, 116.2),
];

/** Structural validation for DEM records (height data, not color imagery). */
export function validateDemManifest(list: SiteDemAsset[]): string[] {
  const problems: string[] = [];
  const required: (keyof SiteDemAsset)[] = [
    "id", "artifactId", "world", "class", "epoch", "org", "product", "sourceUrl", "sourceFile",
    "nativePpd", "nativeGspM", "deliveredGspM", "patchHalfDeg", "deliveredPx", "file",
    "processing", "gaps", "credit", "vertical", "status",
  ];
  for (const m of list) {
    for (const k of required) {
      const v = m[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.some((n) => !(n > 0)))) {
        problems.push(`${m.id || m.artifactId}: missing/invalid '${k}'`);
      }
    }
    if (m.sourceUrl && !m.sourceUrl.startsWith("https://")) problems.push(`${m.id}: sourceUrl not https`);
    // resample factor: native GSP / delivered GSP must stay inside [1..5] —
    // record states ~4x bilinear upsample; anything beyond it would be fake detail
    const factor = m.nativeGspM / m.deliveredGspM;
    if (!(factor >= 1 && factor <= 5)) {
      problems.push(`${m.id}: delivered/native sample factor ${factor.toFixed(2)} outside [1..5]`);
    }
  }
  return problems;
}

/* -------------------------------------------------------------------------
 * Rich-Universe Phase 1 — KTX2 streaming hi tiers. Real NASA imagery at (or
 * POT-downsampled from) native resolution, transcoded offline by
 * scripts/fetch-hi-textures.mjs to GPU-compressed ETC1S/BasisLZ .ktx2 files in
 * public/tex-hi/. NEVER bundled: single-file index.html stays text-only; tiers
 * stream on demand when a body fills the screen (lod/stages.ts tier machine).
 * The anachronism test "hi-res disabled (spec §2)" in manifest.test.ts is
 * superseded by user approval: no upscaling rule stays absolute.
 * ---------------------------------------------------------------------- */

export interface GlobeHiTierAsset {
  id: string;
  body: string;
  tier: "max";
  class: string;
  epoch: string;
  org: string;
  product: string;
  sourceUrl: string;
  sourcePx: [number, number];
  deliveredPx: [number, number];
  streamUrl: string; // starts with /tex-hi/, served from public, never bundled
  file: string;
  bytes: number;
  format: string;
  processing: string;
  gaps: string;
  credit: string;
  orientation: string;
  status: "APPROVED";
}

export const HI_TIER_MANIFEST: GlobeHiTierAsset[] = [
  {
    id: "earth-4k-ktx2",
    body: "earth",
    tier: "max",
    class: "ENHANCED (same BMNG topo+bathy source as the bundled map)",
    epoch: "December 2004 base composite",
    org: "NASA Earth Observatory",
    product: "Blue Marble Next Generation Topography+Bathymetry 4096x2048 KTX2 stream tier",
    sourceUrl: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
    sourcePx: [5400, 2700],
    deliveredPx: [4096, 2048],
    streamUrl: "/tex-hi/earth.ktx2",
    file: "earth.ktx2",
    bytes: 911_527,
    format: "KTX2 ETC1S/BasisLZ (GPU-compressed; runtime transcode via Basis universal, mips included)",
    processing: "toktx --encode etc1s c4 q220 --resize 4096x2048 (KTX-Software 4.4.2). POT downsample of the 5400px native mosaic, never an upsample",
    gaps: "Same December-composite caveats as the bundled map; tier serves color depth, not newer data",
    credit: "NASA Earth Observatory / Blue Marble",
    orientation: "Standard equirectangular (source as published)",
    status: "APPROVED",
  },
  {
    id: "moon-8k-ktx2",
    body: "moon",
    tier: "max",
    class: "MOSAIC (white-balanced LROC WAC bands; polar fill interpolated)",
    epoch: "LROC 2009-; SVS 2025 reprocessing used as-is at native px",
    org: "NASA Scientific Visualization Studio (LRO camera teams)",
    product: "CGI Moon Kit color map, 8192x4096 KTX2 stream tier",
    sourceUrl: "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif",
    sourcePx: [8192, 4096],
    deliveredPx: [8192, 4096],
    streamUrl: "/tex-hi/moon.ktx2",
    file: "moon.ktx2",
    bytes: 4_370_869,
    format: "KTX2 ETC1S/BasisLZ (GPU-compressed; runtime transcode via Basis universal, mips included)",
    processing: "WIC 16-bit tif -> RGB png, toktx --encode etc1s c4 q220 at native 8192x4096 (no resize needed)",
    gaps: "Same SVS polar-fill caveats as the bundled map (albedo fill beyond ±70 deg); ETC1S quantization may slightly soften faint linework",
    credit: "NASA SVS / LRO / Arizona State University",
    orientation: "Standard equirectangular, centered 0 deg lon (matches bundled map)",
    status: "APPROVED",
  },
  {
    id: "mars-4k-ktx2",
    body: "mars",
    tier: "max",
    class: "MOSAIC (same Viking MDIM 2.1 photograph as the bundled map, at the full 4K tier)",
    epoch: "Viking orbiter imagery, MDIM 2.1 mosaic",
    org: "USGS Astrogeology / NASA Ames",
    product: "Viking MDIM 2.1 color photographic mosaic, 4096x2048 KTX2 stream tier",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m",
    sourcePx: [4096, 2048],
    deliveredPx: [4096, 2048],
    streamUrl: "/tex-hi/mars.ktx2",
    file: "mars.ktx2",
    bytes: 1_709_637,
    format: "KTX2 ETC1S/BasisLZ (GPU-compressed; runtime transcode via Basis universal, mips included)",
    processing: "toktx --encode etc1s c4 q220 at native 4096x2048 POT from the photographic MDIM 4K build (assets-hi/mars_4k.jpg, same source build-globes.py used — replaces a prior false-color MOLA topography tier)",
    gaps: "ETC1S quantization may slightly soften Viking mosaic detail; elevation colors from the previous topography tier no longer used — DEM relief still comes from MOLA MEGDR",
    credit: "USGS Astrogeology / NASA",
    orientation: "Standard equirectangular (verified in-ECHOES via Syrtis Major and Hellas, see bundled-map record)",
    status: "APPROVED",
  },
];

/** Structural validation for the streaming hi tiers (imagery record — same honesty bar). */
export function validateHiTierManifest(list: GlobeHiTierAsset[]): string[] {
  const problems: string[] = [];
  const required: (keyof GlobeHiTierAsset)[] = [
    "id", "body", "tier", "class", "epoch", "org", "product", "sourceUrl", "sourcePx",
    "deliveredPx", "streamUrl", "file", "bytes", "format", "processing", "gaps", "credit",
    "orientation", "status",
  ];
  for (const m of list) {
    for (const k of required) {
      const v = m[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.some((n) => !(n > 0)))) {
        problems.push(`${m.id}: missing/invalid '${k}'`);
      }
    }
    if (m.sourceUrl && !m.sourceUrl.startsWith("https://")) problems.push(`${m.id}: sourceUrl not https`);
    if (m.streamUrl && !m.streamUrl.startsWith("/tex-hi/")) problems.push(`${m.id}: streamUrl outside /tex-hi/`);
    if (m.deliveredPx[0] > m.sourcePx[0] || m.deliveredPx[1] > m.sourcePx[1]) {
      problems.push(`${m.id}: delivered px exceeds source px — upscaling forbidden`);
    }
  }
  return problems;
}

/* -------------------------------------------------------------------------
 * Rich-Universe Phase 2 — Milky Way panorama. A REAL wide-field photograph
 * (ESO GigaGalaxy Zoom, S. Brunier), not a generated skybox. Galactic
 * equirectangular 2:1 at the largest native size ESO's CDN serves; streamed
 * on demand from public/tex-hi like the globe tiers, never bundled. Star
 * positions in the photo and the HYG catalogue share the J2000 frame via the
 * fixed galactic->equatorial rotation in src/engine/world/galactic.ts.
 * ---------------------------------------------------------------------- */

export interface SkyBandAsset {
  id: string;
  url: string;
  file: string;
  bytes: number;
  sourceUrl: string;
  sourcePx: [number, number];
  deliveredPx: [number, number];
  impression: string;
  projection: string;
  alignment: string;
  license: string;
  credit: string;
  /** Encode provenance (optional honesty field — not required by the validator). */
  encode?: string;
  gaps: string;
  status: "APPROVED";
}

export const SKY_BAND_MANIFEST: SkyBandAsset[] = [
  {
    id: "milkyway-eso-6k-ktx2",
    url: "/tex-hi/milkyway.ktx2",
    file: "milkyway.ktx2",
    bytes: 3_255_282,
    sourceUrl: "https://cdn.eso.org/images/large/eso0932a.jpg",
    sourcePx: [6000, 3000],
    deliveredPx: [6000, 3000],
    impression: "PHOTOGRAPH (real sky, wide-field mosaic)",
    projection: "Equirectangular 2:1 across the whole sky; horizontal axis runs along the galactic equator",
    alignment:
      "Placed in the ECHOES sky with the J2000 galactic->equatorial->scene rotation (galactic.ts), then checked against catalogue anchors (Sgr A* bulge, LMC/SMC density peaks)",
    license: "CC BY 4.0 — ESO/S. Brunier, The Milky Way panorama (GigaGalaxy Zoom)",
    credit: "ESO/S. Brunier",
    encode: "KTX2 ETC1S BasisLZ, clevel 4, qlevel 255 (max quality) with a full mip chain — re-encoded after the first single-mip tier showed flat blockiness on dark sky",
    gaps:
      "The largest source ESO serves is 6000x3000 (no 8K original publicly available; nothing is upsampled). Photographic mosaic — not a photometric survey: bright-star blooming and processing can exaggerate apparent sizes, and the panorama predates Gaia-era precision. Deep-sky labels elsewhere on the sky are selected objects, not a survey.",
    status: "APPROVED",
  },
];

export function validateSkyBandManifest(list: SkyBandAsset[]): string[] {
  const problems: string[] = [];
  const required: (keyof SkyBandAsset)[] = [
    "id", "url", "file", "bytes", "sourceUrl", "sourcePx", "deliveredPx", "impression",
    "projection", "alignment", "license", "credit", "gaps", "status",
  ];
  for (const m of list) {
    for (const k of required) {
      const v = m[k];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.some((n) => !(n > 0)))) {
        problems.push(`${m.id}: missing/invalid '${k}'`);
      }
    }
    if (m.sourceUrl && !m.sourceUrl.startsWith("https://")) problems.push(`${m.id}: sourceUrl not https`);
    if (m.url && !m.url.startsWith("/tex-hi/")) problems.push(`${m.id}: url outside /tex-hi/`);
    if (m.deliveredPx[0] > m.sourcePx[0] || m.deliveredPx[1] > m.sourcePx[1]) {
      problems.push(`${m.id}: delivered px exceeds source px — upscaling forbidden`);
    }
  }
  return problems;
}
