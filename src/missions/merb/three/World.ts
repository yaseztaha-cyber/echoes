import * as THREE from 'three';

/** A World is one chapter's 3D environment. Its state is a pure function of normalised chapter time. */
export interface WorldProjectedMarker { label: string; sub?: string; world: THREE.Vector3; showAt: number }
export interface World {
  readonly group: THREE.Group;
  /** frame used by 'rover' camera-space shots (position + yaw/pitch/roll) */
  readonly subject: THREE.Object3D;
  readonly markers: WorldProjectedMarker[];
  /** terrain height for ground-aware camera clamping; undefined for space worlds */
  groundAt?(x: number, z: number): number;
  /** attach scene-level state (fog, background) */
  apply(scene: THREE.Scene): void;
  update(t: number, dt: number, cameraPos: THREE.Vector3): void;
  /** optional orbit centre for interactive exploring */
  focus(): THREE.Vector3;
  dispose(): void;
}
