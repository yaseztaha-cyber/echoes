/**
 * Official NASA MER geometry record. Pure constants (no renderer imports) so
 * model integrity rules stay unit-testable. Rendered by models.tsx.
 */
export const MER_OFFICIAL_URL =
  "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/m/MER_static.glb";

/** Source-model forward axis → ECHOES rover forward (+X). Yaw hypothesis, verify visually. */
export const MER_YAW = -Math.PI / 2;

/** Source facts (verified from the glTF binary + NASA 3D Resources page). */
export const MER_OFFICIAL_META = {
  meshes: 1,
  materials: 9,
  embeddedImages: 12,
  animations: 0,
  groundAtY: 0, // wheel contact ≈ y 0: mounts directly in the rover frame
  footprintM: { x: 2.28, z: 1.58 },
  mastTopM: 1.58,
} as const;
