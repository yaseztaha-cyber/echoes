/**
 * Galactic <-> scene frame for the Milky Way panorama (rich-universe phase).
 *
 * The ESO panorama is equirectangular along the galactic equator; HYG star
 * rows are equatorial J2000. Both are placed in the ECHOES scene through the
 * fixed IAU J2000 galactic<->equatorial rotation below, so the photo band and
 * the catalogue stars share one frame. Constants (galactic pole, NCP galactic
 * longitude) are the standard IAU 1958 values, precessed to J2000.
 *
 * u=0 sits at galactic longitude SKY_L0_DEG; with the default -180 the bulge
 * (l=0) lands at u=0.5, matching the published panorama's centering.
 */
import * as THREE from "three";
import { starDirection } from "@/engine/world/starsData";

export const GAL_POLE_RA_DEG = 192.85948;
export const GAL_POLE_DEC_DEG = 27.12825;
export const GAL_LON_NCP_DEG = 122.93192;

/** Texture-u=0 galactic longitude (deg) and whether image columns run backwards. */
export const SKY_L0_DEG = -180;
/**
 * The ESO panorama is assembled from inside the sky: image columns run with
 * DECREASING galactic longitude (verified against the LMC/SMC blobs at
 * u≈0.73/0.67, which sit at l≈280°/303°). Flip so photo and HYG agree.
 */
export const SKY_SCROLL_FLIP = true;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function galToEq(lDeg: number, bDeg: number): [number, number] {
  const l = lDeg * D2R;
  const b = bDeg * D2R;
  const dG = GAL_POLE_DEC_DEG * D2R;
  const aG = GAL_POLE_RA_DEG * D2R;
  const lN = GAL_LON_NCP_DEG * D2R;
  const sinDec = Math.sin(dG) * Math.sin(b) + Math.cos(dG) * Math.cos(b) * Math.cos(lN - l);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const y = Math.cos(b) * Math.sin(lN - l);
  const x = Math.cos(dG) * Math.sin(b) - Math.sin(dG) * Math.cos(b) * Math.cos(lN - l);
  let ra = (Math.atan2(y, x) + aG) * R2D;
  ra = ((ra % 360) + 360) % 360;
  return [ra, dec * R2D];
}

export function galToSceneDir(lDeg: number, bDeg: number, out: [number, number, number]) {
  const [ra, dec] = galToEq(lDeg, bDeg);
  return starDirection(ra, dec, out);
}

/** Galactic longitude for panorama column u (0..1). */
export function skyLongitudeAt(u: number): number {
  const span = SKY_SCROLL_FLIP ? -360 : 360;
  return SKY_L0_DEG + span * u;
}

/**
 * Unit-sphere geometry carrying the panorama's equirect UVs, with every
 * vertex pre-rotated into the scene frame (galactic -> equatorial -> ECHOES).
 * Render with THREE.BackSide; the camera sits inside. UV v=1 is the image top
 * (galactic north) to match three.js flipY texture defaults.
 */
export function createGalacticSkyGeometry(widthSeg = 128, heightSeg = 64): THREE.BufferGeometry {
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const dir: [number, number, number] = [0, 0, 0];
  const row = widthSeg + 1;
  for (let j = 0; j <= heightSeg; j++) {
    const v = j / heightSeg;
    const b = 90 - 180 * v;
    for (let i = 0; i <= widthSeg; i++) {
      const u = i / widthSeg;
      galToSceneDir(skyLongitudeAt(u), b, dir);
      verts.push(dir[0], dir[1], dir[2]);
      uvs.push(u, 1 - v);
    }
  }
  for (let j = 0; j < heightSeg; j++) {
    for (let i = 0; i < widthSeg; i++) {
      const a = j * row + i;
      const bIdx = a + row;
      idx.push(a, a + 1, bIdx, a + 1, bIdx + 1, bIdx);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}
