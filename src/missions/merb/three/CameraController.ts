import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneDef, Shot, V3 } from '../data/types';
import type { World } from './World';

const e = {
  inout: (u: number) => u * u * (3 - 2 * u),
  out: (u: number) => 1 - Math.pow(1 - u, 2.2),
  linear: (u: number) => u,
};

/**
 * Camera choreography. Shots are data (see data/scenes.ts) and the camera pose is a pure function of
 * normalised chapter time. Supports three shot spaces:
 *   'world'      absolute scene-local coordinates
 *   'rover'      relative to the subject (rover / rocket / capsule / spacecraft) including its orientation
 *   'rover-pos'  relative to the subject position only (world-aligned axes)
 * plus 'orbit' shots around the subject or a fixed point. A free (user-driven) orbit mode takes over in Interactive mode.
 */
export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private free = false;
  private shift = 0; private shiftTarget = 0;
  private tmpP = new THREE.Vector3(); private tmpL = new THREE.Vector3(); private tmpP2 = new THREE.Vector3(); private tmpL2 = new THREE.Vector3();
  private w = 1; private h = 1;
  onFreeChange?: (free: boolean) => void;

  constructor(dom: HTMLElement) {
    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.05, 9000);
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enabled = false; this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.2; this.controls.maxDistance = 400; this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.addEventListener('start', () => { if (!this.free) this.setFree(true); });
  }

  get isFree() { return this.free; }
  setInteractive(enabled: boolean) { this.controls.enabled = enabled; if (!enabled && this.free) this.setFree(false); }

  setFree(f: boolean, world?: World) {
    this.free = f;
    if (f) {
      this.controls.enabled = true;
      const focus = world ? world.focus() : this.camera.position.clone().add(new THREE.Vector3(0, 0, -5));
      this.controls.target.copy(focus);
    }
    this.onFreeChange?.(f);
  }

  resize(w: number, h: number) { this.w = w; this.h = h; this.camera.aspect = w / h; this.applyView(); }
  setFrameShift(frac: number) { this.shiftTarget = frac; }
  private applyView() {
    if (Math.abs(this.shift) < 0.001) this.camera.clearViewOffset();
    else this.camera.setViewOffset(this.w, this.h, this.shift * this.w, 0, this.w, this.h);
    this.camera.updateProjectionMatrix();
  }

  private resolve(space: 'world' | 'rover' | 'rover-pos', p: V3, l: V3, subject: THREE.Object3D, outP: THREE.Vector3, outL: THREE.Vector3) {
    outP.set(...p); outL.set(...l);
    if (space === 'rover') { subject.updateWorldMatrix(true, false); outP.applyMatrix4(subject.matrixWorld); outL.applyMatrix4(subject.matrixWorld); }
    else if (space === 'rover-pos') { outP.add(subject.position); outL.add(subject.position); }
  }

  private poseFor(shot: Shot, u: number, subject: THREE.Object3D, outP: THREE.Vector3, outL: THREE.Vector3): number {
    if (shot.kind === 'dolly') {
      const k = e[shot.ease ?? 'inout'](u);
      this.resolve(shot.space, shot.from.p, shot.from.l, subject, this.tmpP2, this.tmpL2);
      this.resolve(shot.space, shot.to.p, shot.to.l, subject, outP, outL);
      // a moving subject is handled because both ends are resolved at the current time
      outP.lerpVectors(this.tmpP2, outP, k); outL.lerpVectors(this.tmpL2, outL, k);
      return (shot.from.fov ?? 42) + ((shot.to.fov ?? shot.from.fov ?? 42) - (shot.from.fov ?? 42)) * k;
    }
    const k = e.inout(u);
    const c = shot.center === 'rover' ? subject.position : this.tmpL2.set(...shot.center);
    const r = shot.r0 + (shot.r1 - shot.r0) * k, a = shot.a0 + (shot.a1 - shot.a0) * k, h = shot.h0 + (shot.h1 - shot.h0) * k;
    outP.set(c.x + Math.sin(a) * r, c.y + h, c.z + Math.cos(a) * r);
    outL.set(c.x, c.y + (shot.lookUp ?? 0.5), c.z);
    return shot.fov ?? 40;
  }

  /** Deterministic cinematic pose for chapter progress t∈[0,1]. */
  update(scene: SceneDef, world: World, t: number, dt: number) {
    this.shift += (this.shiftTarget - this.shift) * Math.min(1, dt * 3.2);
    this.applyView();
    if (this.free) {
      // follow the subject while the user orbits
      const f = world.focus(); const d = this.tmpP.copy(f).sub(this.controls.target);
      this.camera.position.add(d); this.controls.target.add(d);
      this.controls.update();
      this.clampGround(world);
      return;
    }
    const shots = scene.shots;
    let shot = shots[shots.length - 1];
    for (const s of shots) if (t < s.t1) { shot = s; break; }
    const span = Math.max(1e-4, shot.t1 - shot.t0);
    const u = Math.min(1, Math.max(0, (t - shot.t0) / span));
    const fov = this.poseFor(shot, u, world.subject, this.tmpP, this.tmpL);
    this.camera.position.copy(this.tmpP);
    this.clampGround(world);
    this.camera.lookAt(this.tmpL);
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
  }

  private clampGround(world: World) {
    if (!world.groundAt) return;
    const g = world.groundAt(this.camera.position.x, this.camera.position.z) + 0.3;
    if (this.camera.position.y < g) this.camera.position.y = g;
  }

  dispose() { this.controls.dispose(); }
}
