import type { Artifact } from "@/types";

export interface PathSample {
  t: number;
  x: number;
  z: number;
}

const cache = new Map<string, PathSample[]>();

/** Densify a waypoint route into time-stamped samples with gentle lateral wander. */
export function buildPath(a: Artifact): PathSample[] {
  const hit = cache.get(a.id);
  if (hit) return hit;
  const out: PathSample[] = [];
  const wps = a.missionPath?.waypoints ?? [];
  for (let i = 0; i < wps.length - 1; i++) {
    const p = wps[i];
    const q = wps[i + 1];
    const len = Math.hypot(q.x - p.x, q.z - p.z);
    const n = Math.max(2, Math.min(220, Math.ceil(len / 45)));
    const nx = -(q.z - p.z) / (len || 1);
    const nz = (q.x - p.x) / (len || 1);
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const wob = Math.sin(f * Math.PI) * len * 0.035 * Math.sin(f * 9 + i * 1.7);
      out.push({ t: p.t + (q.t - p.t) * f, x: p.x + (q.x - p.x) * f + nx * wob, z: p.z + (q.z - p.z) * f + nz * wob });
    }
  }
  if (wps.length) {
    const l = wps[wps.length - 1];
    out.push({ t: l.t, x: l.x, z: l.z });
  }
  cache.set(a.id, out);
  return out;
}

export interface ArtifactState {
  x: number;
  z: number;
  yaw: number;
  index: number;
  onSurface: boolean;
}

export function artifactStateAt(a: Artifact, t: number): ArtifactState {
  const path = buildPath(a);
  const landing = a.dates.landing ?? a.dates.launch;
  const onSurface = t >= landing;
  if (!path.length) return { x: 0, z: 0, yaw: 0, index: 0, onSurface };
  if (t <= path[0].t) return { x: path[0].x, z: path[0].z, yaw: dirYaw(path, 0), index: 0, onSurface };
  const last = path.length - 1;
  if (t >= path[last].t) return { x: path[last].x, z: path[last].z, yaw: dirYaw(path, last - 1), index: last, onSurface };
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (path[m].t <= t) lo = m;
    else hi = m;
  }
  const raw = (t - path[lo].t) / (path[hi].t - path[lo].t || 1);
  const f = raw * raw * (3 - 2 * raw); // smoothstep accel/decel
  return {
    x: path[lo].x + (path[hi].x - path[lo].x) * f,
    z: path[lo].z + (path[hi].z - path[lo].z) * f,
    yaw: dirYaw(path, lo),
    index: lo,
    onSurface,
  };
}

function dirYaw(path: PathSample[], i: number) {
  const a = path[Math.max(0, i - 2)];
  const b = path[Math.min(path.length - 1, i + 3)];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (Math.abs(dx) + Math.abs(dz) < 1e-6) return 0;
  return Math.atan2(-dz, dx);
}

export function waypointById(a: Artifact, id: string) {
  return a.missionPath?.waypoints.find((w) => w.id === id);
}

