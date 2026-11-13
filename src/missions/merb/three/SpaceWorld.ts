import * as THREE from 'three';
import type { QualityProfile } from '../data/types';
import { glowTexture, makeStars, planetTexture } from './sky';
import type { World } from './World';

/**
 * Space scenes: interplanetary cruise and Mars approach.
 * STYLISED: bodies and distances are not to scale — see the on-screen provenance label.
 */
export class SpaceWorld implements World {
  readonly group = new THREE.Group();
  readonly markers = [];
  readonly subject = new THREE.Object3D();
  private craft = new THREE.Group();
  private cruiseStage = new THREE.Group();
  private path: THREE.CatmullRomCurve3;
  private trail: THREE.Line; private trailGeo = new THREE.BufferGeometry();
  private mars: THREE.Mesh; private earth?: THREE.Mesh;
  private disposables: Array<{ dispose(): void }> = [];
  private stars: THREE.Points;
  private focusV = new THREE.Vector3();

  constructor(private kind: 'cruise' | 'approach', q: QualityProfile) {
    const d = <T extends { dispose(): void }>(o: T) => { this.disposables.push(o); return o; };
    const glow = d(glowTexture());
    this.stars = makeStars(q.stars, 5000); this.group.add(this.stars); d(this.stars.geometry); d(this.stars.material as THREE.Material);
    const sunDir = kind === 'cruise' ? new THREE.Vector3(-1, 0.25, -0.5) : new THREE.Vector3(-1, 0.3, 0.55);
    const sun = new THREE.DirectionalLight(0xfff1e0, 3.2); sun.position.copy(sunDir.clone().multiplyScalar(500)); this.group.add(sun);
    this.group.add(new THREE.AmbientLight(0x4a4440, 1.4));
    const sunSprite = new THREE.Sprite(d(new THREE.SpriteMaterial({ map: glow, color: 0xfff0d0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })));
    sunSprite.position.copy(sunDir.clone().multiplyScalar(2800)); sunSprite.scale.setScalar(kind === 'cruise' ? 900 : 700); this.group.add(sunSprite);

    const marsTex = d(planetTexture('mars'));
    const marsR = kind === 'cruise' ? 6 : 300;
    this.mars = new THREE.Mesh(d(new THREE.SphereGeometry(marsR, 48, 32)), d(new THREE.MeshStandardMaterial({ map: marsTex, roughness: 1 })));
    const atmo = new THREE.Mesh(d(new THREE.SphereGeometry(marsR * 1.035, 48, 32)), d(new THREE.MeshBasicMaterial({ color: 0xd9906a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })));
    this.mars.add(atmo); this.group.add(this.mars);

    // craft: aeroshell + cruise stage
    const sil = d(new THREE.MeshStandardMaterial({ color: 0xcfcbc2, metalness: 0.6, roughness: 0.5 }));
    const brown = d(new THREE.MeshStandardMaterial({ color: 0x70513a, roughness: 0.8 }));
    const cell = d(new THREE.MeshStandardMaterial({ color: 0x232a36, metalness: 0.4, roughness: 0.5 }));
    const m = (g: THREE.BufferGeometry, mat: THREE.Material, p: THREE.Object3D, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(d(g), mat); me.position.set(x, y, z); p.add(me); return me; };
    // axis along +Z
    m(new THREE.ConeGeometry(1.35, 0.9, 24).rotateX(-Math.PI / 2), sil, this.craft, 0, 0, 0.0); // backshell (front toward travel)
    m(new THREE.CylinderGeometry(1.35, 1.1, 0.5, 24).rotateX(Math.PI / 2), brown, this.craft, 0, 0, -0.65); // heat shield
    this.craft.add(this.cruiseStage);
    m(new THREE.CylinderGeometry(1.25, 1.25, 0.35, 24).rotateX(Math.PI / 2), sil, this.cruiseStage, 0, 0, -1.2);
    m(new THREE.CylinderGeometry(1.55, 1.55, 0.06, 24).rotateX(Math.PI / 2), cell, this.cruiseStage, 0, 0, -1.35);
    this.group.add(this.craft);

    if (kind === 'cruise') {
      const earthTex = d(planetTexture('earth'));
      this.earth = new THREE.Mesh(d(new THREE.SphereGeometry(9, 48, 32)), d(new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.9 })));
      this.earth.position.set(-120, 0, 0);
      const ea = new THREE.Mesh(d(new THREE.SphereGeometry(9.4, 48, 32)), d(new THREE.MeshBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })));
      this.earth.add(ea); this.group.add(this.earth);
      this.mars.position.set(130, 0, -20);
      this.path = new THREE.CatmullRomCurve3([new THREE.Vector3(-110, 1, 6), new THREE.Vector3(-60, 8, 38), new THREE.Vector3(20, 6, 46), new THREE.Vector3(90, 2, 10), new THREE.Vector3(122, 0, -14)]);
      const pts = this.path.getPoints(160);
      this.trailGeo.setFromPoints(pts);
      this.trail = new THREE.Line(this.trailGeo, d(new THREE.LineBasicMaterial({ color: 0xe8b987, transparent: true, opacity: 0.55 })));
      this.group.add(this.trail);
      d(this.trailGeo);
    } else {
      this.mars.position.set(0, 0, 0);
      this.path = new THREE.CatmullRomCurve3([new THREE.Vector3(30, 40, 900), new THREE.Vector3(10, 36, 700), new THREE.Vector3(-18, 28, 540), new THREE.Vector3(-26, 25, 440)]);
      this.trail = new THREE.Line(); // unused
      const home = new THREE.Sprite(d(new THREE.SpriteMaterial({ map: glow, color: 0xbfd8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })));
      home.position.set(1800, 300, 3600); home.scale.setScalar(60); this.group.add(home);
    }
  }

  apply(scene: THREE.Scene) { scene.fog = null; scene.background = new THREE.Color(0x020306); }
  focus() { return this.focusV; }

  update(t: number, _dt: number, cam: THREE.Vector3) {
    const u = this.kind === 'cruise' ? t : Math.min(1, t * 1.02);
    const p = this.path.getPointAt(u), tan = this.path.getTangentAt(u);
    this.craft.position.copy(p);
    this.craft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    this.subject.position.copy(p); this.focusV.copy(p);
    if (this.kind === 'cruise') {
      this.mars.rotation.y = t * 0.6; if (this.earth) this.earth.rotation.y = t * 2;
      this.trailGeo.setDrawRange(0, Math.max(2, Math.floor(u * 161)));
    } else {
      this.mars.rotation.y = t * 0.08;
      const sep = Math.max(0, (t - 0.5) * 2);
      this.cruiseStage.position.set(0, sep * 2.2, -sep * sep * 30); this.cruiseStage.rotation.x = sep * 0.9; this.cruiseStage.rotation.z = sep * 0.4;
    }
    this.stars.position.copy(cam);
  }

  dispose() { this.disposables.forEach((d) => d.dispose()); this.group.clear(); }
}
