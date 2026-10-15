import * as THREE from "three";

/** Mutable per-frame telemetry. Written by the engine, read by HUD at low rate. */
export const tele = {
  fps: 60,
  frameP95: 0,
  drawCalls: 0,
  triangles: 0,
  texResident: 0,
  texPending: 0,
  texBytesEst: 0,
  altitudeM: 0,
  altLabelBasis: "ALT",
  distanceToFocusM: 0,
  heading: 0,
  lat: 0,
  lon: 0,
  elevM: 0,
  slopeDeg: 0,
  sunAngle: 0,
  cam: [0, 0, 0] as [number, number, number],
  hotspot: { x: 0, y: 0, v: false },
  distToArtifact: 0,
  tilesCached: 0,
  tilesDrawn: 0,
  maxDepth: 0,
  modelsLoaded: 0,
  speedScale: 1,
  focusRealKm: 0,
  sunDistAU: 0,
  info: "",
};

/** The artifact currently placed in the site scene. */
export const siteRef = {
  group: null as THREE.Group | null,
  pos: new THREE.Vector3(),
  yaw: 0,
  visible: true,
};

/** Environment shared between scenes. */
export const env = {
  sunDir: new THREE.Vector3(1, 0.25, 0.5).normalize(),
  siteLit: false,
};

/** Stable DOM layer for in-world labels (keeps drei <Html> out of R3F's managed container). */
export const htmlLayer: { current: HTMLElement | null } = { current: null };
