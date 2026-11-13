import * as THREE from 'three';
import type { RoverScript } from '../data/types';
import { RoverModel, ROVER, type ArmPose } from './RoverModel';
import type { Terrain } from './Terrain';
import { smoothstep } from './noise';

const POSES: Record<string, ArmPose> = {
  stow: [0, -1.25, 2.45, 0],
  reach: [0, -0.15, 0.05, 0],
  apxs: [-0.2, 0.5, -0.22, 0],
  mi: [0.05, 0.45, -0.16, 0],
  rat: [0.3, 0.56, -0.28, 0],
};
const ease = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

/**
 * Vehicle animation. Fully DETERMINISTIC: the rover pose is a pure function of
 * normalised chapter time, so seeking, scrubbing and replaying are exact.
 * Terrain-conforming: body attitude is fitted to the six wheel contact points
 * and the rocker-bogie joints articulate to match the terrain under each wheel.
 */
export class RoverRig {
  readonly model: RoverModel;
  private curve: THREE.CatmullRomCurve3;
  private length: number;
  private tracks?: THREE.InstancedMesh;
  private trackGeo?: THREE.BufferGeometry;
  private trackMat?: THREE.Material;
  private trackStep = 0.32;
  private tmp = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private pos = new THREE.Vector3();
  private one = new THREE.Vector3(1, 1, 1);
  private lastTrackCount = -1;
  heading = 0;

  constructor(private script: RoverScript, private terrain: Terrain, private duration: number, detail: 'high' | 'low', parent: THREE.Object3D) {
    this.model = new RoverModel(detail);
    parent.add(this.model.root);
    const pts = script.path.map(([x, z]) => new THREE.Vector3(x, 0, z));
    if (pts.length === 1) pts.push(pts[0].clone().add(new THREE.Vector3(0, 0, 0.01)));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.length = Math.max(0.01, this.curve.getLength());
    this.model.root.visible = !script.hidden;
    this.model.setDust(script.dust);
    if (script.drive.length) this.buildTracks(parent);
  }

  get object() { return this.model.root; }

  private buildTracks(parent: THREE.Object3D) {
    const max = Math.min(900, Math.ceil(this.length / this.trackStep) * 2 + 4);
    this.trackGeo = new THREE.PlaneGeometry(0.17, this.trackStep * 0.9).rotateX(-Math.PI / 2);
    this.trackMat = new THREE.MeshBasicMaterial({ color: 0x2c1c15, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    this.tracks = new THREE.InstancedMesh(this.trackGeo, this.trackMat, max);
    this.tracks.count = 0; this.tracks.frustumCulled = false; this.tracks.renderOrder = 1;
    parent.add(this.tracks);
  }

  private sAt(t: number) {
    const w = this.script.drive;
    if (!w.length) return { s: 0, smax: 0 };
    let s = w[0].s0, smax = s;
    for (const k of w) {
      if (t >= k.t1) s = k.s1;
      else if (t > k.t0) s = k.s0 + (k.s1 - k.s0) * ease((t - k.t0) / (k.t1 - k.t0));
      else break;
      smax = Math.max(smax, s);
    }
    return { s, smax };
  }

  private armAt(t: number): ArmPose {
    const keys = this.script.arm ?? [];
    if (!keys.length) return POSES.stow;
    let cur = POSES[keys[0].pose];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = POSES[keys[i].pose], b = POSES[keys[i + 1].pose];
      const tEnd = keys[i + 1].t, trans = Math.min(0.08, (tEnd - keys[i].t) * 0.8);
      if (t < tEnd - trans) { cur = a; return cur; }
      if (t < tEnd) { const u = ease((t - (tEnd - trans)) / trans); return a.map((v, j) => v + (b[j] - v) * u) as ArmPose; }
      cur = b;
    }
    return cur;
  }

  private mastAt(t: number) {
    const k = this.script.mast ?? [];
    if (!k.length) return { pan: 0, tilt: 0 };
    if (t <= k[0].t) return k[0];
    for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1].t) { const u = smoothstep(k[i].t, k[i + 1].t, t); return { pan: k[i].pan + (k[i + 1].pan - k[i].pan) * u, tilt: k[i].tilt + (k[i + 1].tilt - k[i].tilt) * u }; }
    return k[k.length - 1];
  }

  setVisible(v: boolean) { this.model.root.visible = v && !this.script.hidden; if (this.tracks) this.tracks.visible = v; }

  update(t: number, camDist: number) {
    const sc = this.script, m = this.model;
    const { s, smax } = this.sAt(t);
    const sc01 = Math.min(1, Math.max(0, s));
    const p = this.curve.getPointAt(sc01), tan = this.curve.getTangentAt(sc01);
    this.heading = this.script.path.length > 1 && (tan.x !== 0 || tan.z !== 0) ? Math.atan2(tan.x, tan.z) : sc.start.heading;
    if (!sc.drive.length) this.heading = sc.start.heading;
    const sx = Math.sin(this.heading), cx = Math.cos(this.heading);
    const wp = (side: number, i: number) => {
      const lx = (side === 0 ? 1 : -1) * ROVER.track, lz = ROVER.wheelZ[i];
      return [p.x + lx * cx + lz * sx, p.z - lx * sx + lz * cx] as const;
    };
    const H: number[][] = [[], []];
    let sum = 0, fr = 0, rr = 0, lf = 0, rt = 0;
    for (let side = 0; side < 2; side++) for (let i = 0; i < 3; i++) {
      const [x, z] = wp(side, i); const h = this.terrain.heightAt(x, z); H[side][i] = h; sum += h;
      if (i === 0) fr += h; if (i === 2) rr += h; if (side === 0) lf += h; else rt += h;
    }
    const mean = sum / 6;
    const pitch = Math.atan2((fr - rr) / 2, ROVER.wheelZ[0] - ROVER.wheelZ[2]);
    const roll = Math.atan2((lf - rt) / 3, ROVER.track * 2);
    const tp = Math.tan(pitch), tr = Math.tan(roll);

    // sinking while spinning (Purgatory)
    let sink = 0, spinAngle = 0;
    for (const sp of sc.spin ?? []) {
      sink = Math.max(sink, 0.1 * smoothstep(sp.t0, (sp.t0 + sp.t1) / 2, t) * (1 - smoothstep(sp.t1, sp.t1 + 0.12, t)));
      spinAngle += (Math.min(Math.max(t, sp.t0), sp.t1) - sp.t0) * this.duration * 5.5;
    }
    const lift = (sc.platformLift ?? 0) * (1 - smoothstep(0.0, 0.3, sc01));
    this.pos.set(p.x, mean + lift - sink, p.z);
    m.root.position.copy(this.pos);
    this.e.set(-pitch, this.heading, roll, 'YXZ'); m.root.quaternion.setFromEuler(this.e);

    // rocker-bogie articulation
    for (let side = 0; side < 2; side++) {
      const dev = (i: number) => {
        const lx = (side === 0 ? 1 : -1) * ROVER.track, lz = ROVER.wheelZ[i];
        return H[side][i] - (mean + tp * lz + tr * lx);
      };
      const dF = dev(0), dM = dev(1), dR = dev(2);
      const a = THREE.MathUtils.clamp((dF - (dM + dR) / 2) / 1.13, -0.5, 0.5);
      const b = THREE.MathUtils.clamp((dM - dR) / 0.8, -0.5, 0.5);
      m.rocker[side].rotation.x = -a; m.bogie[side].rotation.x = -(b - a);
    }

    // wheels
    const dist = s * this.length;
    const roll_ = dist / ROVER.wheelR + spinAngle;
    for (let side = 0; side < 2; side++) for (let i = 0; i < 3; i++) m.wheelSpin[side][i].rotation.x = roll_;

    // deploy: wings, rear flap, mast height
    const d = sc.deploy ? smoothstep(sc.deploy.t0, sc.deploy.t1, t) : 1;
    m.wings[0].rotation.z = (1 - d) * 1.5; m.wings[1].rotation.z = -(1 - d) * 1.5;
    m.rearFlap.rotation.x = (1 - d) * 1.45;
    const mh = 0.28 + 0.72 * d;
    m.mastTube.scale.y = mh; m.mastTube.position.y = mh / 2; m.mastHead.position.y = mh;
    const ms = this.mastAt(t); m.mastPan.rotation.y = ms.pan; m.mastTilt.rotation.x = ms.tilt;

    // arm
    const [az, sh, el] = this.armAt(t);
    m.armAz.rotation.y = az; m.armShoulder.rotation.x = sh; m.armElbow.rotation.x = el;
    m.armWrist.rotation.x = -(sh + el) * 0.35;

    m.setLod(camDist);
    this.updateTracks(smax);
  }

  private updateTracks(smax: number) {
    if (!this.tracks) return;
    const n = Math.floor((smax * this.length) / this.trackStep);
    const count = Math.min(n * 2, (this.tracks.instanceMatrix.count));
    if (count === this.lastTrackCount) return;
    this.lastTrackCount = count;
    this.tracks.count = count;
    for (let k = 0; k < n && k * 2 + 1 < this.tracks.instanceMatrix.count; k++) {
      const u = Math.min(1, (k * this.trackStep) / this.length);
      const p = this.curve.getPointAt(u), tn = this.curve.getTangentAt(u);
      const h = Math.atan2(tn.x, tn.z), sx = Math.sin(h), cx = Math.cos(h);
      this.q.setFromEuler(this.e.set(0, h, 0));
      for (let side = 0; side < 2; side++) {
        const lx = side === 0 ? ROVER.track : -ROVER.track;
        const x = p.x + lx * cx, z = p.z - lx * sx;
        this.pos.set(x, this.terrain.heightAt(x, z) + 0.012, z);
        this.tmp.compose(this.pos, this.q, this.one);
        this.tracks.setMatrixAt(k * 2 + side, this.tmp);
      }
    }
    this.tracks.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.model.dispose();
    this.trackGeo?.dispose(); this.trackMat?.dispose(); this.tracks?.dispose();
    this.tracks?.removeFromParent();
  }
}
