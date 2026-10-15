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
    colorSpace: "SRGBColorSpace",
    orientation: "Standard equirectangular; verified aligned with renderer UV + markers",
    status: "APPROVED",
  },
  {
    id: "moon-lroc-2025",
    body: "moon",
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
];

const byBody = new Map(GLOBE_MANIFEST.map((m) => [m.body, m]));

/** Asset selection for a globe kind. Returns null for bodies without a verified map. */
export function globeAssetFor(kind: string): GlobeAsset | null {
  return byBody.get(kind) ?? null;
}

/** Structural validation: every required provenance field present and sane. */
export function validateManifest(list: GlobeAsset[]): string[] {
  const problems: string[] = [];
  const required: (keyof GlobeAsset)[] = [
    "id", "body", "org", "product", "sourceUrl", "sourceFile", "sourcePx",
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
