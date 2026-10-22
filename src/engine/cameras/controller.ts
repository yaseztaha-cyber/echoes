import * as THREE from "three";
import { useEcho } from "@/state/store";

export interface Flight {
  dur: number;
  t: number;
  fn: (u: number, pos: THREE.Vector3, tgt: THREE.Vector3) => void;
  ease: (u: number) => number;
  resolve: () => void;
}

/** Camera manager state shared between the rig (per-frame) and the director (sequencing). */
export const cam = {
  controls: null as any,
  camera: null as THREE.PerspectiveCamera | null,
  flight: null as Flight | null,
  follow: null as null | (() => THREE.Vector3),
  followPrev: new THREE.Vector3(),
  followFresh: true,
  keys: new Set<string>(),
};

export const smoother = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export function fly(dur: number, fn: Flight["fn"], ease: Flight["ease"] = smoother): Promise<void> {
  if (cam.flight) cam.flight.resolve();
  if (useEcho.getState().reducedMotion) dur = Math.min(dur, 0.5);
  return new Promise((res) => {
    cam.flight = { dur: Math.max(0.01, dur), t: 0, fn, ease, resolve: res };
    useEcho.setState({ flying: true });
  });
}

type V3 = THREE.Vector3 | (() => THREE.Vector3);
const val = (v: V3) => (typeof v === "function" ? v() : v);

export function flyTo(pos: V3, tgt: V3, dur: number, ease?: Flight["ease"]) {
  const c = cam.camera!;
  const p0 = c.position.clone();
  const g0 = cam.controls.target.clone();
  return fly(
    dur,
    (u, p, g) => {
      p.lerpVectors(p0, val(pos), u);
      g.lerpVectors(g0, val(tgt), u);
    },
    ease
  );
}

export function setView(pos: THREE.Vector3, tgt: THREE.Vector3) {
  if (cam.flight) cam.flight.resolve();
  cam.flight = null;
  cam.camera!.position.copy(pos);
  cam.controls.target.copy(tgt);
  cam.camera!.lookAt(tgt);
  cam.controls.update();
  useEcho.setState({ flying: false });
}

/** ESC during a flight: jump straight to the flight's end state. The awaiting
 *  director continuation (scene swap, veils, arrival timing) resolves exactly
 *  as if the flight had played, so the chain never desyncs. */
export function skipFlight() {
  const f = cam.flight;
  if (!f) return;
  const P = cam.camera!.position.clone();
  const G = cam.controls.target.clone();
  f.fn(1, P, G); // eases evaluate to 1 at u=1; env lerps land on their finals
  cam.camera!.position.copy(P);
  cam.controls.target.copy(G);
  cam.camera!.lookAt(G);
  cam.controls.update();
  cam.flight = null;
  useEcho.setState({ flying: false });
  f.resolve();
}

export function setFollow(getter: null | (() => THREE.Vector3)) {
  cam.follow = getter;
  cam.followFresh = true;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, useEcho.getState().reducedMotion ? Math.min(ms, 200) : ms));
