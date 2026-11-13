import * as THREE from 'three';
import type { QualityProfile, SceneDef } from '../data/types';
import { SITES } from '../data/scenes';
import { Terrain } from './Terrain';
import { RoverRig } from './RoverRig';
import { SkyDome, glowTexture } from './sky';
import { smoothstep, makeNoise } from './noise';
import type { World, WorldProjectedMarker } from './World';

const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Four-petal lander platform (documented mechanism: petals fold open after airbag retraction). */
class LanderProp {
  readonly group = new THREE.Group();
  private petals: Array<{ g: THREE.Group; kind: 'f' | 'b' | 'l' | 'r' }> = [];
  private geos: THREE.BufferGeometry[] = []; private mats: THREE.Material[] = [];
  constructor() {
    const silver = new THREE.MeshStandardMaterial({ color: 0xc4c2bc, metalness: 0.7, roughness: 0.5 });
    const gold = new THREE.MeshStandardMaterial({ color: 0x9c7e44, metalness: 0.6, roughness: 0.5 });
    this.mats.push(silver, gold);
    const box = (w: number, h: number, d: number, m: THREE.Material, p: THREE.Object3D, x = 0, y = 0, z = 0) => {
      const g = new THREE.BoxGeometry(w, h, d); this.geos.push(g);
      const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; p.add(me); return me;
    };
    box(1.7, 0.4, 1.7, gold, this.group, 0, 0.2, 0);
    const mk = (kind: 'f' | 'b' | 'l' | 'r') => {
      const g = new THREE.Group();
      const horiz = kind === 'f' || kind === 'b';
      const hinge = { f: [0, 0.4, 0.85], b: [0, 0.4, -0.85], l: [0.85, 0.4, 0], r: [-0.85, 0.4, 0] }[kind];
      g.position.set(hinge[0], hinge[1], hinge[2]);
      const L = 1.15;
      const off = { f: [0, 0, L / 2], b: [0, 0, -L / 2], l: [L / 2, 0, 0], r: [-L / 2, 0, 0] }[kind];
      box(horiz ? 1.7 : L, 0.04, horiz ? L : 1.7, silver, g, off[0], off[1], off[2]);
      this.group.add(g); this.petals.push({ g, kind });
    };
    (['f', 'b', 'l', 'r'] as const).forEach(mk);
    this.setOpen(1);
  }
  setOpen(o: number) {
    const a = -1.35 + (0.38 + 1.35) * o;
    for (const { g, kind } of this.petals) {
      g.rotation.set(0, 0, 0);
      if (kind === 'f') g.rotation.x = a; else if (kind === 'b') g.rotation.x = -a; else if (kind === 'l') g.rotation.z = -a; else g.rotation.z = a;
    }
  }
  dispose() { this.geos.forEach((g) => g.dispose()); this.mats.forEach((m) => m.dispose()); this.group.clear(); }
}

/** Schematic entry-descent-landing props: aeroshell, parachute, heat-shield release, airbag landing. */
class EdlProps {
  readonly capsule = new THREE.Group();
  readonly lander = new LanderProp();
  private chute: THREE.Mesh; private lines: THREE.LineSegments; private shield: THREE.Mesh; private backshell: THREE.Mesh;
  private bags = new THREE.Group(); private bagMeshes: THREE.Mesh[] = []; private dirs: THREE.Vector3[] = [];
  private glow: THREE.Sprite; private flame: THREE.Sprite;
  private disposables: Array<{ dispose(): void }> = [];
  private R = 1.9;
  constructor(private terrain: Terrain, glowTex: THREE.Texture) {
    const d = <T extends { dispose(): void }>(o: T) => { this.disposables.push(o); return o; };
    const sil = d(new THREE.MeshStandardMaterial({ color: 0xcfcdc6, metalness: 0.5, roughness: 0.6 }));
    const brown = d(new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.8 }));
    const orange = d(new THREE.MeshStandardMaterial({ color: 0xe8a15a, roughness: 0.9, side: THREE.DoubleSide }));
    const bagMat = d(new THREE.MeshStandardMaterial({ color: 0xcdb48e, roughness: 0.9 }));
    this.backshell = new THREE.Mesh(d(new THREE.ConeGeometry(1.5, 1.4, 20, 1, true)), sil); this.backshell.position.y = 1.0; this.capsule.add(this.backshell);
    this.shield = new THREE.Mesh(d(new THREE.CylinderGeometry(1.5, 0.3, 0.7, 20)), brown); this.shield.position.y = -0.6; this.capsule.add(this.shield);
    this.chute = new THREE.Mesh(d(new THREE.SphereGeometry(6.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), orange); this.capsule.add(this.chute);
    const pts: number[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push(Math.cos(a) * 6.4, 20, Math.sin(a) * 6.4, 0, 1.8, 0); }
    const lg = d(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.lines = new THREE.LineSegments(lg, d(new THREE.LineBasicMaterial({ color: 0xe9e1d3, transparent: true, opacity: 0.7 }))); this.capsule.add(this.lines);
    this.chute.position.y = 20;
    const sg = d(new THREE.SphereGeometry(0.85, 12, 10));
    const ico = new THREE.IcosahedronGeometry(1, 1); const p = ico.attributes.position; const seen = new Set<string>();
    for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i).normalize(); const k = v.toArray().map((n) => n.toFixed(2)).join(); if (!seen.has(k)) { seen.add(k); this.dirs.push(v); } }
    ico.dispose();
    for (const _v of this.dirs) { const m = new THREE.Mesh(sg, bagMat); m.castShadow = true; this.bags.add(m); this.bagMeshes.push(m); }
    this.capsule.add(this.bags);
    this.lander.group.position.y = -0.5; this.capsule.add(this.lander.group);
    const gm = d(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa050, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.glow = new THREE.Sprite(gm); this.glow.scale.setScalar(14); this.glow.position.y = -1; this.capsule.add(this.glow);
    const fm = d(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.flame = new THREE.Sprite(fm); this.flame.scale.setScalar(5); this.flame.position.y = 0.5; this.capsule.add(this.flame);
  }

  private ground(x: number, z: number) { return this.terrain.heightAt(x, z); }

  update(t: number) {
    // position along the schematic trajectory
    let x: number, y: number, z: number;
    const gb = (xx: number, zz: number) => this.ground(xx, zz);
    const tl = 0.58;
    if (t < tl) {
      const u = t / tl;
      x = -260 + (-48 + 260) * u; z = -90 + (-6 + 90) * u * u;
      const alt = 1200 * Math.pow(1 - u, 1.6);
      y = gb(x, z) + this.R + alt;
    } else if (t < 0.88) {
      const u = (t - tl) / (0.88 - tl);
      const e = 1 - Math.pow(1 - u, 2);
      x = -48 + 46.5 * e; z = -6 + 6.4 * e;
      const hop = 13 * Math.abs(Math.sin(u * Math.PI * 5.5)) * Math.pow(1 - u, 1.7);
      y = gb(x, z) + this.R + hop;
    } else { x = -1.5; z = 0.4; y = gb(x, z) + this.R; }
    // settle toward the final rest at the origin
    let def = 0;
    if (t >= 0.88) { const k = ease(clamp01((t - 0.88) / 0.08)); x = -1.5 + 1.5 * k; z = 0.4 - 0.4 * k; def = k; y = gb(x, z) + this.R - (this.R - 0.5) * k; }
    this.capsule.position.set(x, y, z);

    // entry glow, parachute, backshell, heat shield
    this.glow.visible = t < 0.14; this.glow.scale.setScalar(10 + 8 * (1 - t / 0.14));
    const chuteOn = t >= 0.12 && t < 0.5;
    this.chute.visible = this.lines.visible = chuteOn;
    const infl = ease(clamp01((t - 0.12) / 0.04));
    this.chute.scale.set(infl, infl, infl); this.lines.scale.set(1, infl, 1);
    this.backshell.visible = t < 0.5; this.backshell.position.y = 1.0;
    // heat shield falls away at t=0.42
    if (t < 0.42) { this.shield.visible = true; this.shield.position.set(0, -0.6, 0); }
    else if (t < 0.62) { const s = (t - 0.42) * 120; this.shield.visible = true; this.shield.position.set(2 + s * 0.3, -0.6 - 0.5 * 3.7 * s * s * 0.4, 0); }
    else this.shield.visible = false;
    // lander closed until rest
    this.lander.setOpen(smoothstep(0.9, 0.97, t));
    this.lander.group.visible = true;
    // retro-rocket burn
    this.flame.visible = t > 0.5 && t < 0.565; this.flame.position.y = 1.2; this.flame.scale.setScalar(4 + 2 * Math.sin(t * 900));
    // airbags
    const inflate = ease(clamp01((t - 0.46) / 0.05));
    this.bags.visible = inflate > 0.001 && t < 0.995;
    this.bagMeshes.forEach((m, i) => {
      const v = this.dirs[i];
      const spread = 1 + 0.9 * def, flat = 1 - 0.8 * def;
      m.position.set(v.x * 1.05 * spread, v.y * 1.05 * flat, v.z * 1.05 * spread);
      const s = inflate * (1 - 0.5 * def); m.scale.set(s, s * (1 - 0.5 * def), s);
    });
    if (t >= 0.97) this.bags.visible = this.bags.visible && t < 0.97 + 0.02;
  }
  dispose() { this.disposables.forEach((d) => d.dispose()); this.lander.dispose(); this.capsule.clear(); }
}

export class SurfaceWorld implements World {
  readonly group = new THREE.Group();
  readonly markers: WorldProjectedMarker[] = [];
  readonly subject: THREE.Object3D;
  private terrain: Terrain; private sky: SkyDome; private rig?: RoverRig; private lander?: LanderProp; private edl?: EdlProps;
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private fog: THREE.FogExp2; private fogColor: THREE.Color;
  private glow = glowTexture();
  private dustPts?: THREE.Points; private dustSeed = new Float32Array(0);
  private studioLights: THREE.Light[] = [];
  private camDist = 10;
  private focusV = new THREE.Vector3();

  constructor(def: SceneDef, private q: QualityProfile, duration = 24) {
    const site = SITES[def.siteId!];
    this.terrain = new Terrain(site, q);
    this.group.add(this.terrain.group);
    const s = site.sky;
    this.sky = new SkyDome(s.zenith, s.horizon, s.sunElev, s.sunAzim, s.sunColor, s.dust);
    this.group.add(this.sky.mesh);
    this.fogColor = new THREE.Color(...s.horizon).lerp(new THREE.Color(...s.zenith), 0.1);
    this.fog = new THREE.FogExp2(this.fogColor, s.fog);
    this.sun = new THREE.DirectionalLight(new THREE.Color(...s.sunColor), s.sunIntensity);
    this.hemi = new THREE.HemisphereLight(new THREE.Color(...s.zenith).lerp(new THREE.Color(...s.horizon), 0.5), new THREE.Color(...site.palette.high), (s.dust > 0.8 ? 1.25 : 0.9));
    this.group.add(this.sun, this.sun.target, this.hemi);
    if (q.shadows) {
      this.sun.castShadow = true; this.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
      const c = this.sun.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 160; this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.02;
    }
    if (site.lander) { this.lander = new LanderProp(); this.lander.group.position.set(0, this.terrain.heightAt(0, 0), 0); this.group.add(this.lander.group); }
    if (def.kind === 'edl') {
      this.edl = new EdlProps(this.terrain, this.glow);
      this.group.add(this.edl.capsule);
      this.lander?.group.removeFromParent(); this.lander?.dispose(); this.lander = undefined;
    }
    if (def.rover) {
      this.rig = new RoverRig(def.rover, this.terrain, duration, q.id === 'low' ? 'low' : 'high', this.group);
      this.rig.model.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = q.shadows; });
    }
    this.subject = this.edl ? this.edl.capsule : this.rig!.object;
    for (const m of def.markers ?? []) {
      const [x, z] = m.p; this.markers.push({ label: m.label, sub: m.sub, world: new THREE.Vector3(x, this.terrain.heightAt(x, z) + 1.2, z), showAt: m.showAt ?? 0 });
    }
    if (site.id === 'testbed') {
      const sp = new THREE.SpotLight(0xfff1de, 520, 60, 0.7, 0.6, 1.6); sp.position.set(6, 12, -6); sp.target.position.set(0, 0, 0);
      this.group.add(sp, sp.target); this.studioLights.push(sp);
      const grid = new THREE.GridHelper(120, 120, 0x58504a, 0x2a2623); grid.position.y = 0.02; (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.5; this.group.add(grid);
    }
    if (s.dust > 0.8) this.buildDust();
  }


  private buildDust() {
    const n = this.q.id === 'low' ? 250 : 700; const { rnd } = makeNoise(5);
    const pos = new Float32Array(n * 3); this.dustSeed = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { this.dustSeed[i * 2] = rnd(); this.dustSeed[i * 2 + 1] = rnd(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: 26, map: this.glow, color: 0xc08a58, transparent: true, opacity: 0.1, depthWrite: false, sizeAttenuation: true, fog: false });
    this.dustPts = new THREE.Points(g, m); this.dustPts.frustumCulled = false; this.group.add(this.dustPts);
  }

  groundAt = (x: number, z: number) => this.terrain.heightAt(x, z);
  apply(scene: THREE.Scene) { scene.fog = this.fog; scene.background = this.fogColor; }
  focus() { return this.focusV; }

  update(t: number, dt: number, cam: THREE.Vector3) {
    this.edl?.update(t);
    if (this.rig) {
      if (this.edl) this.rig.setVisible(t >= 0.9);
      const o = this.rig.object; this.camDist = cam.distanceTo(o.position);
      this.rig.update(this.edl ? 1.5 : t, this.camDist);
    }
    this.focusV.copy(this.subject.position);
    this.sky.follow(cam);
    const sd = this.sky.sunDir;
    this.sun.position.copy(this.subject.position).addScaledVector(sd, 70);
    this.sun.target.position.copy(this.subject.position);
    this.sun.target.updateMatrixWorld();
    if (this.dustPts) {
      const a = this.dustPts.geometry.attributes.position as THREE.BufferAttribute; const time = performance.now() * 0.001 * 1.0 + t * 20;
      for (let i = 0; i < a.count; i++) {
        const sx = this.dustSeed[i * 2], sz = this.dustSeed[i * 2 + 1];
        const x = ((sx * 160 - time * (3 + sz * 4)) % 160 + 160) % 160 - 80, z = (sz * 160 + Math.sin(time * 0.2 + sx * 9) * 4) - 80, y = 0.4 + ((sx * 7.3 + sz * 3.1) % 1) * 10;
        a.setXYZ(i, cam.x + x, this.terrain.heightAt(cam.x + x, cam.z + z) + y, cam.z + z);
      }
      a.needsUpdate = true;
    }
    void dt;
  }

  dispose() {
    this.edl?.dispose(); this.lander?.dispose(); this.rig?.dispose(); this.terrain.dispose(); this.sky.dispose(); this.glow.dispose();
    this.dustPts?.geometry.dispose(); (this.dustPts?.material as THREE.Material | undefined)?.dispose();
    this.sun.shadow.map?.dispose();
    this.group.clear();
  }
}
