import * as THREE from 'three';
import type { QualityProfile } from '../data/types';
import { glowTexture, makeStars } from './sky';
import { makeNoise } from './noise';
import type { World } from './World';

/**
 * Night launch from Cape Canaveral LC-17B — simplified RECONSTRUCTION of a Delta II Heavy
 * (first stage, nine graphite-epoxy strap-on solids, second stage, 3 m-class fairing, umbilical tower).
 */
export class LaunchWorld implements World {
  readonly group = new THREE.Group();
  readonly markers = [];
  readonly subject = new THREE.Object3D();
  private rocket = new THREE.Group();
  private flame: THREE.Mesh; private glowSprite: THREE.Sprite; private fireLight: THREE.PointLight;
  private smoke: THREE.Points; private smokeN: number;
  private disposables: Array<{ dispose(): void }> = [];
  private glow = glowTexture();
  private seeds: Float32Array;
  private stars: THREE.Points;
  private focusV = new THREE.Vector3(0, 20, 0);

  constructor(q: QualityProfile, private duration: number) {
    const d = <T extends { dispose(): void }>(o: T) => { this.disposables.push(o); return o; };
    const mat = (c: number, m = 0.3, r = 0.55) => d(new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r }));
    const white = mat(0xe8e9e6), blue = mat(0x2d4a63, 0.2, 0.6), black = mat(0x1a1a1a), steel = mat(0x777b80, 0.7, 0.5), concrete = mat(0x4a4a48, 0, 0.95);
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: THREE.Object3D, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(d(g), m); me.position.set(x, y, z); me.castShadow = false; p.add(me); return me; };

    // ground + pad
    const ground = mesh(new THREE.CircleGeometry(4000, 32).rotateX(-Math.PI / 2), mat(0x0d0f0e, 0, 1), this.group); ground.position.y = -0.2;
    mesh(new THREE.BoxGeometry(46, 1, 46), concrete, this.group, 0, -0.5, 0);
    mesh(new THREE.BoxGeometry(14, 4, 14), concrete, this.group, 0, 1.5, 0); // launch mount

    // rocket
    const R = this.rocket; this.group.add(R); R.position.y = 4;
    mesh(new THREE.CylinderGeometry(1.3, 1.3, 26, 24), white, R, 0, 13, 0);
    mesh(new THREE.CylinderGeometry(1.31, 1.31, 3, 24), blue, R, 0, 7, 0); // stripe
    mesh(new THREE.CylinderGeometry(1.3, 1.3, 7, 20), white, R, 0, 29.5, 0); // 2nd stage section
    mesh(new THREE.CylinderGeometry(1.55, 1.55, 6, 24), white, R, 0, 36, 0); // fairing
    mesh(new THREE.ConeGeometry(1.55, 4.5, 24), white, R, 0, 41.2, 0);
    for (let i = 0; i < 9; i++) { // nine strap-on solids
      const a = (i / 9) * Math.PI * 2 + 0.2, x = Math.cos(a) * 2.1, z = Math.sin(a) * 2.1;
      mesh(new THREE.CylinderGeometry(0.57, 0.57, 13, 12), blue, R, x, 6.5, z);
      mesh(new THREE.ConeGeometry(0.57, 2, 12), blue, R, x, 14, z);
    }
    mesh(new THREE.CylinderGeometry(1.3, 1.9, 1.2, 20), black, R, 0, -0.2, 0);

    // exhaust
    const fm = d(new THREE.MeshBasicMaterial({ color: 0xffb765, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.flame = new THREE.Mesh(d(new THREE.ConeGeometry(2.2, 22, 14, 1, true).translate(0, -11, 0)), fm); R.add(this.flame);
    const gm = d(new THREE.SpriteMaterial({ map: this.glow, color: 0xffa650, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    this.glowSprite = new THREE.Sprite(gm); this.glowSprite.scale.setScalar(60); R.add(this.glowSprite);
    this.fireLight = new THREE.PointLight(0xff9a50, 0, 500, 2); R.add(this.fireLight);

    // umbilical tower: lattice
    const tower = new THREE.Group(); tower.position.set(13, 0, -2); this.group.add(tower);
    const n = 14;
    for (let i = 0; i < n; i++) {
      mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), steel, tower, -1.5, 3 + i * 3, -1.5); mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), steel, tower, 1.5, 3 + i * 3, -1.5);
      mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), steel, tower, -1.5, 3 + i * 3, 1.5); mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), steel, tower, 1.5, 3 + i * 3, 1.5);
      mesh(new THREE.BoxGeometry(3.2, 0.15, 0.15), steel, tower, 0, 4.4 + i * 3, 1.5); mesh(new THREE.BoxGeometry(0.15, 0.15, 3.2), steel, tower, 1.5, 4.4 + i * 3, 0);
    }
    const arm = mesh(new THREE.BoxGeometry(9, 0.6, 0.8), steel, tower, -5.5, 24, 0);
    void arm;
    // floodlight columns
    for (const [x, z] of [[-26, 18], [24, 26]] as const) {
      mesh(new THREE.CylinderGeometry(0.2, 0.3, 30, 8), steel, this.group, x, 15, z);
      const l = new THREE.SpotLight(0xfff2de, 90000, 160, 0.34, 0.5, 1.7); l.position.set(x, 30, z); l.target.position.set(0, 20, 0);
      this.group.add(l, l.target);
      const s = new THREE.Sprite(d(new THREE.SpriteMaterial({ map: this.glow, color: 0xfff1d8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))); s.position.set(x, 30, z); s.scale.setScalar(14); this.group.add(s);
    }
    this.group.add(new THREE.HemisphereLight(0x3a4560, 0x15110d, 0.9));
    const key = new THREE.DirectionalLight(0xbcc7e6, 1.3); key.position.set(-60, 80, 120); this.group.add(key);
    this.stars = makeStars(q.stars, 3800); this.group.add(this.stars); d(this.stars.geometry); d(this.stars.material as THREE.Material);

    // smoke trail (deterministic from time)
    this.smokeN = q.plume;
    const { rnd } = makeNoise(13); this.seeds = new Float32Array(this.smokeN * 3);
    for (let i = 0; i < this.seeds.length; i++) this.seeds[i] = rnd() - 0.5;
    const sg = d(new THREE.BufferGeometry()); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.smokeN * 3), 3));
    sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.smokeN * 3), 3));
    this.smoke = new THREE.Points(sg, d(new THREE.PointsMaterial({ size: 38, map: this.glow, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true })));
    this.smoke.frustumCulled = false; this.group.add(this.smoke);
    this.subject.position.set(0, 24, 0); this.group.add(this.subject);
  }

  private height(tau: number) { return tau <= 0 ? 0 : 3 * tau * tau + 0.02 * tau * tau * tau; }

  apply(scene: THREE.Scene) { scene.fog = new THREE.FogExp2(0x05070b, 0.0009); scene.background = new THREE.Color(0x04060a); }
  focus() { return this.focusV; }

  update(t: number, _dt: number, cam: THREE.Vector3) {
    void cam;
    const tau = (t - 0.3) * this.duration;
    const y = this.height(tau);
    const lean = tau > 8 ? 0.35 * (1 - Math.exp(-(tau - 8) / 18)) : 0;
    this.rocket.position.set(Math.sin(lean) * Math.max(0, y - 80) * 0.25, 4 + y, 0);
    this.rocket.rotation.z = -lean * 0.8;
    this.subject.position.copy(this.rocket.position).add(new THREE.Vector3(0, 20, 0));
    this.focusV.copy(this.subject.position);
    const lit = tau > 0;
    const flick = 0.85 + 0.15 * Math.sin(performance.now() * 0.05);
    this.flame.visible = this.glowSprite.visible = lit; this.fireLight.intensity = lit ? 30000 * flick * Math.min(1, tau / 1.5) : 0;
    this.flame.scale.set(1, (0.6 + Math.min(1, tau / 3)) * flick, 1);
    this.glowSprite.scale.setScalar(55 * flick);
    // smoke: emitted along the past trajectory
    const pos = this.smoke.geometry.attributes.position as THREE.BufferAttribute, col = this.smoke.geometry.attributes.color as THREE.BufferAttribute;
    const life = Math.max(0, tau);
    const spread = Math.min(1, life / 8);
    for (let i = 0; i < this.smokeN; i++) {
      const age = (i / this.smokeN) * Math.min(life, 40);
      const ts = life - age;
      const yy = 4 + this.height(ts - 0 + 0) * 1;
      const ground = Math.max(0, 1 - ts / 5);
      pos.setXYZ(i,
        this.seeds[i * 3] * (6 + age * 1.1) * spread + age * 0.8 + ground * this.seeds[i * 3] * 24,
        lit ? yy - 4 + 2 + Math.abs(this.seeds[i * 3 + 1]) * 3 + (ts < 4 ? 0 : 0) : -100,
        this.seeds[i * 3 + 2] * (6 + age * 1.1) * spread + ground * this.seeds[i * 3 + 2] * 24 + 3);
      const warm = Math.max(0, 1 - age / 4);
      const b = 0.34 - Math.min(0.2, age * 0.006);
      col.setXYZ(i, b + warm * 0.55, b + warm * 0.25, b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    this.smoke.visible = lit;
    this.stars.position.copy(cam);
  }

  dispose() { this.disposables.forEach((d) => d.dispose()); this.glow.dispose(); this.group.clear(); }
}
