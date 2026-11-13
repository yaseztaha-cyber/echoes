import * as THREE from 'three';

/**
 * Procedural RECONSTRUCTION of a Mars Exploration Rover (Opportunity / MER-B).
 * Built from publicly documented proportions — not NASA CAD:
 *   length ≈ 1.6 m · deck width ≈ 2.3 m · wheel Ø ≈ 0.26 m · six wheels on a rocker-bogie suspension
 *   solar-panel deck with fold-out wings · Pancam/Navcam mast (~1.5 m overall height) · HGA + UHF antennas
 *   front Hazcams · 4-DOF robotic arm (IDD) carrying APXS, Mössbauer, Microscopic Imager and RAT.
 * Frame: forward +Z, up +Y, left +X. Origin = wheel contact plane at body centre.
 */
export const ROVER = {
  wheelR: 0.13, wheelW: 0.16, track: 0.74,
  wheelZ: [0.78, 0.05, -0.75] as const, // front, middle, rear
};

export type ArmPose = [number, number, number, number]; // azimuth, shoulder pitch, elbow, wrist

export class RoverModel {
  readonly root = new THREE.Group();
  readonly chassis = new THREE.Group();
  readonly wheelSpin: THREE.Group[][] = [[], []]; // [side 0=left,1=right][front,mid,rear]
  readonly rocker: THREE.Group[] = [];
  readonly bogie: THREE.Group[] = [];
  readonly wings: THREE.Group[] = [];
  readonly rearFlap = new THREE.Group();
  readonly mastTube = new THREE.Mesh();
  readonly mastHead = new THREE.Group();
  readonly mastPan = new THREE.Group();
  readonly mastTilt = new THREE.Group();
  readonly armAz = new THREE.Group();
  readonly armShoulder = new THREE.Group();
  readonly armElbow = new THREE.Group();
  readonly armWrist = new THREE.Group();
  readonly fine = new THREE.Group();
  readonly dustMats: THREE.MeshBasicMaterial[] = [];
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private texs: THREE.Texture[] = [];

  constructor(private detail: 'high' | 'low' = 'high') {
    this.root.add(this.chassis);
    this.chassis.add(this.fine);
    this.build();
  }

  private mat(m: THREE.Material) { this.mats.push(m); return m; }
  private geo<T extends THREE.BufferGeometry>(g: T) { this.geos.push(g); return g; }
  private mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const me = new THREE.Mesh(this.geo(g), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me;
  }
  private bar(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, parent: THREE.Object3D) {
    const len = a.distanceTo(b);
    const me = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(r, r, len, 8)), m);
    me.position.copy(a).add(b).multiplyScalar(0.5);
    me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    me.castShadow = true; parent.add(me); return me;
  }

  private solarTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#1b2230'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#8c8f94'; g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    g.strokeStyle = '#3a4252'; g.lineWidth = 1;
    for (let i = 16; i < 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; this.texs.push(t); return t;
  }

  private build() {
    const gold = this.mat(new THREE.MeshStandardMaterial({ color: 0xa98a4a, metalness: 0.65, roughness: 0.45 }));
    const alu = this.mat(new THREE.MeshStandardMaterial({ color: 0xb8bbbf, metalness: 0.8, roughness: 0.38 }));
    const white = this.mat(new THREE.MeshStandardMaterial({ color: 0xe2dfd6, metalness: 0.2, roughness: 0.6 }));
    const dark = this.mat(new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.3, roughness: 0.5 }));
    const lens = this.mat(new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.9, roughness: 0.15 }));
    const wheelM = this.mat(new THREE.MeshStandardMaterial({ color: 0xa5a8ac, metalness: 0.75, roughness: 0.42 }));
    const solar = this.mat(new THREE.MeshStandardMaterial({ map: this.solarTexture(), roughness: 0.55, metalness: 0.25 }));
    const hi = this.detail === 'high';
    const seg = hi ? 22 : 12;

    // Warm electronics box
    this.mesh(new THREE.BoxGeometry(0.95, 0.34, 1.2), gold, this.chassis, 0, 0.44, 0.02);

    // Deck + wings
    const deckY = 0.64;
    this.mesh(new THREE.BoxGeometry(1.2, 0.035, 1.35), solar, this.chassis, 0, deckY, 0);
    this.addDust(this.chassis, 1.2, 1.35, 0, deckY + 0.02, 0);
    for (const s of [1, -1]) {
      const hinge = new THREE.Group(); hinge.position.set(s * 0.6, deckY, 0); this.chassis.add(hinge);
      const wing = new THREE.Group(); hinge.add(wing);
      this.mesh(new THREE.BoxGeometry(0.55, 0.03, 1.05), solar, wing, s * 0.275, 0, 0);
      this.addDust(wing, 0.55, 1.05, s * 0.275, 0.019, 0);
      this.wings.push(hinge);
    }
    const rf = this.rearFlap; rf.position.set(0, deckY, -0.675); this.chassis.add(rf);
    this.mesh(new THREE.BoxGeometry(1.2, 0.03, 0.42), solar, rf, 0, 0, -0.21);
    this.addDust(rf, 1.2, 0.42, 0, 0.019, -0.21);
    this.mesh(new THREE.BoxGeometry(1.3, 0.04, 0.05), alu, this.chassis, 0, deckY + 0.01, 0.69); // front deck rim

    // Rocker-bogie (both sides) + differential bar
    this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.24, 8).rotateZ(Math.PI / 2), alu, this.chassis, 0, 0.5, 0.1);
    for (let side = 0; side < 2; side++) {
      const s = side === 0 ? 1 : -1;
      const rocker = new THREE.Group(); rocker.position.set(s * 0.62, 0.46, 0.1); this.chassis.add(rocker);
      this.rocker.push(rocker);
      const F = new THREE.Vector3(0, -0.33, 0.68), B = new THREE.Vector3(0, -0.14, -0.45), O = new THREE.Vector3();
      this.bar(O, F, 0.026, alu, rocker); this.bar(O, B, 0.026, alu, rocker);
      const bogie = new THREE.Group(); bogie.position.copy(B); rocker.add(bogie); this.bogie.push(bogie);
      const M = new THREE.Vector3(0, -0.2, 0.4), R = new THREE.Vector3(0, -0.2, -0.4);
      this.bar(new THREE.Vector3(), M, 0.024, alu, bogie); this.bar(new THREE.Vector3(), R, 0.024, alu, bogie);
      const hubs: Array<[THREE.Object3D, THREE.Vector3]> = [[rocker, F], [bogie, M], [bogie, R]];
      hubs.forEach(([parent, p], i) => {
        // axle + steering knuckle
        this.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8).rotateZ(Math.PI / 2), alu, parent, p.x + s * 0.06, p.y, p.z);
        const spin = new THREE.Group(); spin.position.set(p.x + s * 0.12, p.y, p.z); parent.add(spin);
        this.wheelSpin[side][i] = spin;
        this.buildWheel(spin, wheelM, dark, seg, hi);
      });
    }

    // Mast (PMA): Pancam pair + Navcam pair, Mini-TES inside tube
    const mastBase = new THREE.Group(); mastBase.position.set(-0.22, deckY + 0.02, 0.42); this.chassis.add(mastBase);
    this.mastPan.position.set(0, 0, 0); mastBase.add(this.mastPan);
    const tube = this.mastTube as THREE.Mesh; tube.geometry = this.geo(new THREE.CylinderGeometry(0.035, 0.045, 1, 12)); tube.material = white; tube.castShadow = true;
    tube.position.y = 0.5; this.mastPan.add(tube);
    this.mastPan.add(this.mastHead); this.mastHead.add(this.mastTilt);
    this.mesh(new THREE.BoxGeometry(0.34, 0.07, 0.08), alu, this.mastTilt, 0, 0, 0);
    for (const x of [-0.12, 0.12]) { // Pancam
      this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 12).rotateX(Math.PI / 2), white, this.mastTilt, x, 0.0, 0.07);
      this.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 10).rotateX(Math.PI / 2), lens, this.mastTilt, x, 0, 0.12);
    }
    for (const x of [-0.05, 0.05]) { // Navcam
      this.mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), white, this.mastTilt, x, 0.065, 0.04);
      this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8).rotateX(Math.PI / 2), lens, this.mastTilt, x, 0.065, 0.075);
    }

    // HGA (steerable dish) + UHF
    const hga = new THREE.Group(); hga.position.set(0.42, deckY + 0.02, -0.5); this.chassis.add(hga);
    this.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8), alu, hga, 0, 0.17, 0);
    const dish = this.mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.02, 24), white, hga, 0, 0.36, 0); dish.rotation.x = -0.5;
    this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 6), dark, this.chassis, -0.5, deckY + 0.26, -0.55); // UHF

    // Cameras on the body: front Hazcams, calibration target (sundial)
    this.mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), dark, this.fine, 0.22, 0.4, 0.66);
    this.mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), dark, this.fine, -0.22, 0.4, 0.66);
    this.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20), alu, this.fine, 0.38, deckY + 0.025, 0.25);
    this.mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6), dark, this.fine, 0.38, deckY + 0.06, 0.25);

    // Robotic arm (IDD): azimuth → shoulder → elbow → wrist/turret
    const shoulderMount = new THREE.Group(); shoulderMount.position.set(-0.12, 0.4, 0.62); this.chassis.add(shoulderMount);
    shoulderMount.add(this.armAz); this.armAz.add(this.armShoulder);
    this.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12).rotateZ(Math.PI / 2), alu, this.armShoulder, 0, 0, 0);
    this.mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), alu, this.armShoulder, 0, 0, 0.25);
    this.armElbow.position.set(0, 0, 0.5); this.armShoulder.add(this.armElbow);
    this.mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 12).rotateZ(Math.PI / 2), alu, this.armElbow, 0, 0, 0);
    this.mesh(new THREE.BoxGeometry(0.06, 0.06, 0.44), white, this.armElbow, 0, 0, 0.22);
    this.armWrist.position.set(0, 0, 0.44); this.armElbow.add(this.armWrist);
    this.mesh(new THREE.BoxGeometry(0.22, 0.2, 0.12), alu, this.armWrist, 0, 0, 0.03);
    // tools on the turret: RAT, MI, Mössbauer, APXS
    this.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12).rotateX(Math.PI / 2), gold, this.armWrist, 0.06, 0.05, 0.12);
    this.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10).rotateX(Math.PI / 2), dark, this.armWrist, -0.06, 0.05, 0.12);
    this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10).rotateX(Math.PI / 2), alu, this.armWrist, 0.06, -0.05, 0.11);
    this.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10).rotateX(Math.PI / 2), white, this.armWrist, -0.06, -0.05, 0.11);

    this.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
  }

  private addDust(parent: THREE.Object3D, w: number, d: number, x: number, y: number, z: number) {
    const m = new THREE.MeshBasicMaterial({ color: 0x9a6d47, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mats.push(m); this.dustMats.push(m);
    const me = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2)), m); me.position.set(x, y, z); me.renderOrder = 2; parent.add(me);
  }

  private buildWheel(spin: THREE.Group, wheelM: THREE.Material, dark: THREE.Material, seg: number, hi: boolean) {
    const { wheelR: r, wheelW: w } = ROVER;
    const rim = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(r, r, w, seg, 1, true).rotateZ(Math.PI / 2)), wheelM);
    (rim.material as THREE.Material).side = THREE.DoubleSide; rim.castShadow = true; spin.add(rim);
    const hub = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(r * 0.28, r * 0.28, w * 0.9, 10).rotateZ(Math.PI / 2)), dark); spin.add(hub);
    // flexure spokes — also make rotation readable
    const n = hi ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sp = new THREE.Mesh(this.geo(new THREE.BoxGeometry(w * 0.15, r * 0.74, r * 0.07)), wheelM);
      sp.position.set(0, Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64);
      sp.rotation.x = -a; sp.rotation.z = 0; spin.add(sp);
    }
    // grousers (cleats) — fine detail
    if (hi) {
      const g = this.geo(new THREE.BoxGeometry(w * 1.02, 0.012, 0.016));
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const cl = new THREE.Mesh(g, dark); cl.position.set(0, Math.cos(a) * r, Math.sin(a) * r); cl.rotation.x = -a; spin.add(cl);
      }
    }
  }

  setDust(d: number) { this.dustMats.forEach((m) => { m.opacity = Math.min(0.85, d * 0.9); }); }
  /** hide small parts when the camera is far away (LOD) */
  setLod(dist: number) { this.fine.visible = dist < 28; }

  dispose() {
    this.geos.forEach((g) => g.dispose()); this.mats.forEach((m) => m.dispose()); this.texs.forEach((t) => t.dispose());
    this.root.clear();
  }
}
