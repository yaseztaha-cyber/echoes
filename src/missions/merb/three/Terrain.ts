import * as THREE from 'three';
import type { FeatureDef, QualityProfile, SiteDef } from '../data/types';
import { makeNoise, smoothstep } from './noise';

export type Site = SiteDef & { size: number; lander?: boolean };

/** Procedural Martian terrain tile + scattered rocks, outcrop slabs and hematite spherules. */
export class Terrain {
  readonly group = new THREE.Group();
  private n;
  private disposables: Array<{ dispose(): void }> = [];
  readonly size: number;

  constructor(readonly site: Site, private q: QualityProfile) {
    this.n = makeNoise(site.seed);
    this.size = site.size;
    this.build();
  }

  heightAt(x: number, z: number): number {
    const s = this.site;
    const half = this.size / 2;
    const edge = smoothstep(half, half * 0.62, Math.max(Math.abs(x), Math.abs(z)));
    let h = (this.n.fbm(x * s.rippleFreq * 0.35, z * s.rippleFreq * 0.35, 3) - 0.5) * s.ripple * 5;
    h += Math.sin((x * 0.8 + z * 0.55) * s.rippleFreq * 2 + this.n.fbm(x * 0.1, z * 0.1, 2) * 6) * s.ripple * 0.5;
    let f = 0;
    for (const ft of s.features) f += this.feature(ft, x, z);
    return (h + f) * edge;
  }

  private feature(f: FeatureDef, x: number, z: number): number {
    const dx = x - f.x, dz = z - f.z;
    switch (f.type) {
      case 'bowl':
      case 'scallop-bowl': {
        let r = f.r;
        const ang = Math.atan2(dz, dx);
        if (f.type === 'scallop-bowl') r *= 1 + 0.13 * Math.pow(Math.abs(Math.sin(((f.n ?? 8) * ang) / 2)), 0.8) - 0.06 + 0.04 * (this.n.noise(ang * 3, 4) - 0.5);
        else r *= 1 + 0.05 * (this.n.noise(Math.cos(ang) * 2 + 9, Math.sin(ang) * 2 + 9) - 0.5);
        const d = Math.hypot(dx, dz) / r;
        const bowl = -f.depth * (1 - smoothstep(0.38, 1.0, d));
        const rim = (f.rim ?? 0) * Math.exp(-Math.pow((d - 1.07) / 0.17, 2));
        return d > 1 ? rim : bowl + rim;
      }
      case 'ridge': {
        const ax = Math.cos(f.angle ?? 0), az = Math.sin(f.angle ?? 0);
        const along = dx * ax + dz * az, perp = -dx * az + dz * ax;
        const w = f.width ?? 10;
        return f.depth * Math.exp(-Math.pow(perp / w, 2)) * (1 - smoothstep(f.r * 0.5, f.r, Math.abs(along))) * (0.75 + 0.5 * this.n.noise(along * 0.06, 2));
      }
      case 'slope': {
        const a = f.angle ?? 0;
        return f.depth * Math.max(-1, Math.min(1, (dx * Math.cos(a) + dz * Math.sin(a)) / f.r));
      }
      case 'valley': {
        const a = f.angle ?? 0;
        const ax = Math.cos(a), az = Math.sin(a);
        const perp = -dx * az + dz * ax, along = dx * ax + dz * az;
        const w = f.width ?? 10;
        const bank = Math.exp(-Math.pow(perp / w, 2));
        return -f.depth * bank * (0.8 + 0.4 * this.n.noise(along * 0.08, 7)) * (1 - smoothstep(f.r * 0.7, f.r, Math.abs(along)));
      }
      case 'dunes': {
        const a = f.angle ?? 0;
        const proj = dx * Math.cos(a) + dz * Math.sin(a);
        const w = 1 - smoothstep(14, 40, Math.hypot(dx, dz));
        const wave = 0.5 + 0.5 * Math.sin((proj / f.r) * Math.PI + this.n.fbm(x * 0.12, z * 0.12, 2) * 4);
        return f.depth * Math.pow(wave, 1.6) * w;
      }
      default: return 0;
    }
  }

  normalAt(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const e = 0.5;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx, 2 * e, -hz).normalize();
  }

  private track<T extends { dispose(): void }>(o: T): T { this.disposables.push(o); return o; }

  private build() {
    const { site, size } = this;
    const seg = this.q.terrainSegments;
    const geo = this.track(new THREE.PlaneGeometry(size, size, seg, seg));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const lo = new THREE.Color(...site.palette.low), hi = new THREE.Color(...site.palette.high), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this.heightAt(x, z);
      pos.setY(i, h);
      const t = Math.min(1, Math.max(0, this.n.fbm(x * 0.07, z * 0.07, 4) * 1.3 - 0.1 + (h > 0 ? h * 0.02 : 0)));
      tmp.copy(lo).lerp(hi, t);
      const grain = 0.88 + 0.24 * this.n.noise(x * 1.7, z * 1.7);
      col[i * 3] = tmp.r * grain; col[i * 3 + 1] = tmp.g * grain; col[i * 3 + 2] = tmp.b * grain;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();

    const tex = this.track(this.detailTexture());
    const mat = this.track(this.q.shadows
      ? new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 1, metalness: 0 })
      : new THREE.MeshLambertMaterial({ vertexColors: true, map: tex }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // flat plain to the horizon: a huge square with a square hole under the terrain tile
    const hs = size / 2 - 1;
    const shape = new THREE.Shape(); shape.moveTo(-5000, -5000); shape.lineTo(5000, -5000); shape.lineTo(5000, 5000); shape.lineTo(-5000, 5000); shape.closePath();
    const hole = new THREE.Path(); hole.moveTo(-hs, -hs); hole.lineTo(-hs, hs); hole.lineTo(hs, hs); hole.lineTo(hs, -hs); hole.closePath(); shape.holes.push(hole);
    const far = this.track(new THREE.ShapeGeometry(shape)); far.rotateX(-Math.PI / 2);
    const farMat = this.track(new THREE.MeshBasicMaterial({ color: new THREE.Color(...site.palette.low).multiplyScalar(0.8), side: THREE.DoubleSide }));
    const farMesh = new THREE.Mesh(far, farMat); farMesh.position.y = -0.03; this.group.add(farMesh);

    this.scatterRocks();
    this.scatterSlabs();
    this.scatterSpherules();
  }

  private detailTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!; const img = g.createImageData(256, 256);
    const nz = makeNoise(this.site.seed + 5);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const v = 150 + 90 * (nz.fbm(x / 18, y / 18, 3) - 0.5) + 40 * (nz.noise(x / 2.2, y / 2.2) - 0.5);
      const k = (y * 256 + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.max(0, Math.min(255, v)); img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(this.size / 5, this.size / 5); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  private scatterRocks() {
    const count = Math.round(this.site.rocks * this.q.rocks);
    if (!count) return;
    const geo = this.track(new THREE.IcosahedronGeometry(1, 0));
    const mat = this.track(new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true, color: 0xffffff }));
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = this.q.shadows; mesh.receiveShadow = true;
    const m = new THREE.Matrix4(), qn = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const base = new THREE.Color(...this.site.palette.rock), c = new THREE.Color();
    const R = this.size * 0.45;
    const rnd = this.n.rnd;
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, r = R * Math.pow(rnd(), 1.5);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const s = 0.04 + Math.pow(rnd(), 4) * 0.5 + (rnd() < 0.02 ? 0.6 : 0);
      sc.set(s * (0.8 + rnd() * 0.6), s * (0.35 + rnd() * 0.3), s * (0.8 + rnd() * 0.6));
      e.set(rnd() * 0.4, rnd() * 6.28, rnd() * 0.4); qn.setFromEuler(e);
      ps.set(x, this.heightAt(x, z) + sc.y * 0.2, z);
      m.compose(ps, qn, sc); mesh.setMatrixAt(i, m);
      c.copy(base).multiplyScalar(0.7 + rnd() * 0.6); mesh.setColorAt(i, c);
    }
    this.group.add(mesh);
  }

  private scatterSlabs() {
    const ring = this.site.features.find((f) => f.type === 'outcrop-ring');
    if (!ring || !this.site.slabs) return;
    const per = Math.max(10, Math.round((ring.n ?? 20) * (this.q.id === 'low' ? 0.6 : 1)));
    const layers = 3, count = per * layers;
    const geo = this.track(new THREE.BoxGeometry(1, 1, 1));
    const mat = this.track(new THREE.MeshStandardMaterial({ roughness: 0.9, color: 0xffffff }));
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = this.q.shadows; mesh.receiveShadow = true;
    const rnd = this.n.rnd; const m = new THREE.Matrix4(), qn = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const base = new THREE.Color(...this.site.palette.rock), c = new THREE.Color();
    const full = (ring.angle ?? 0) >= Math.PI * 2 - 0.01;
    const arc = full ? Math.PI * 2 : 2.4, a0 = full ? 0 : (ring.angle ?? 0) - arc / 2;
    let k = 0;
    for (let i = 0; i < per; i++) {
      const a = a0 + (i / per) * arc + (rnd() - 0.5) * 0.05;
      const rr = ring.r + (rnd() - 0.5) * 2;
      const x = ring.x + Math.cos(a) * rr, z = ring.z + Math.sin(a) * rr;
      const w = (ring.width ?? 1.5) * (0.7 + rnd() * 0.8);
      const y0 = this.heightAt(x, z) - 0.05;
      for (let l = 0; l < layers; l++) {
        const th = 0.12 + rnd() * 0.18;
        sc.set(w * (1 - l * 0.12), th, w * 0.9 * (1 - l * 0.1));
        ps.set(x + (rnd() - 0.5) * 0.15, y0 + l * 0.2 + th / 2, z + (rnd() - 0.5) * 0.15);
        e.set((rnd() - 0.5) * 0.08, a + Math.PI / 2 + (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.08); qn.setFromEuler(e);
        m.compose(ps, qn, sc); mesh.setMatrixAt(k, m);
        c.copy(base).multiplyScalar(0.8 + l * 0.12 + rnd() * 0.15); mesh.setColorAt(k, c); k++;
      }
    }
    this.group.add(mesh);
  }

  private scatterSpherules() {
    const count = Math.round(this.site.spherules * (this.q.id === 'low' ? 0.4 : this.q.id === 'medium' ? 0.7 : 1));
    if (!count) return;
    const geo = this.track(new THREE.SphereGeometry(0.014, 6, 5));
    const mat = this.track(new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.35, metalness: 0.6 }));
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const rnd = this.n.rnd; const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const a = rnd() * 6.283, r = 3.6 * Math.sqrt(rnd());
      const x = 2.6 + Math.cos(a) * r, z = 6.3 + Math.sin(a) * r;
      m.makeTranslation(x, this.heightAt(x, z) + 0.008, z); mesh.setMatrixAt(i, m);
    }
    this.group.add(mesh);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.group.traverse((o) => { if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose(); });
    this.group.clear();
  }
}
