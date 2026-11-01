/**
 * SUN — interactive solar features (interactive targets are REAL DETECTIONS).
 *
 * The markers come from src/data/sunspots.json: real active regions detected
 * in the stored HMI continuum snapshot (scripts/build-sun-channels.py). The
 * marker position follows the sphere's UV mapping so it sits exactly on the
 * rendered spot. Selecting keeps camera context and opens a compact panel —
 * no random hotspots, no invented morphology (spec §10).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SUN_SPOTS, SUN_R, SUN_LAYERS } from "./sunAssets";
import { useEcho } from "@/state/store";
import { htmlLayer } from "@/engine/telemetry";
import { sfx } from "@/lib/audio";

interface SpotRec {
  lon: number;
  lat: number;
  u: number;
  v: number;
  areaPx: number;
  minRelativeIntensity: number;
}

const SPOT_PHYSICS =
  "A sunspot is a magnetic knot: the field chokes convection, so the umbra is ~1,000–2,000 K cooler than the surrounding photosphere and reads dark by contrast.";

/** Screen distance (solar radii of camera separation) where markers activate. */
const SHOW_DIST = SUN_R * 30;

export function SunSpotMarkers() {
  const sel = useEcho((s) => s.sunSpotId);
  const spots: (SpotRec & { id: string; pos: THREE.Vector3 })[] = useMemo(
    () =>
      (SUN_SPOTS.spots as SpotRec[]).map((sp, i) => {
        // sphere UV mapping (matches three.js SphereGeometry + our painting)
        const phi = sp.u * Math.PI * 2;
        const theta = Math.PI * sp.v;
        const r = SUN_R * 1.01;
        return {
          ...sp,
          id: `spot${i + 1}`,
          pos: new THREE.Vector3(
            -Math.cos(phi) * Math.sin(theta),
            Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
          ).multiplyScalar(r),
        };
      }),
    [],
  );

  const items = useRef<(HTMLDivElement | null)[]>([]);
  const camN = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const d = camera.position.length();
    camN.copy(camera.position).normalize();
    spots.forEach((p, i) => {
      const el = items.current[i];
      if (!el) return;
      const facing = tmp.copy(p.pos).normalize().dot(camN);
      // 0.02 = visible until essentially tangent to the limb: real detections
      // near the limb must stay tappable instead of silently disappearing
      const on = d < SHOW_DIST && facing > 0.02;
      el.style.opacity = on ? "1" : "0";
      el.style.pointerEvents = on ? "auto" : "none";
    });
  });

  return (
    <>
      {spots.map((p, i) => (
        <Html key={p.id} portal={htmlLayer as any} center position={p.pos} zIndexRange={[12, 0]}>
          <div ref={(el) => { items.current[i] = el; }} style={{ opacity: 0, pointerEvents: "none", transition: "opacity 160ms linear" }}>
            <button
              aria-label={`Sunspot, heliographic latitude ${p.lat}, longitude ${p.lon}`}
              onClick={() => { sfx.select(); useEcho.setState({ sunSpotId: sel === p.id ? null : p.id }); }}
              className="mono block h-3 w-3 rounded-full border border-amber/70 bg-ink-0/40"
              style={{ boxShadow: "0 0 6px rgba(208,164,91,0.7)", cursor: "pointer", margin: "auto" }}
            />
            {sel === p.id && (
              <div className="mono module mt-2 w-[248px] p-2.5 text-left" style={{ fontSize: 10 }}>
                <div className="label text-amber">SUNSPOT · REAL DETECTION</div>
                <div className="mt-1 leading-relaxed text-bone">{SPOT_PHYSICS}</div>
                <div className="mt-2 space-y-0.5 text-ash tracking-[0.06em]" style={{ fontSize: 9.5 }}>
                  <div>HELIOGRAPHIC · LAT {p.lat.toFixed(1)}° LON {p.lon.toFixed(1)}°</div>
                  <div>AREA {p.areaPx.toFixed(0)} PX · MIN I {p.minRelativeIntensity.toFixed(2)}</div>
                  <div>{SUN_LAYERS.photosphere.instrument} · 2026-10-23</div>
                </div>
                <button
                  className="ctl mt-2 w-full text-[9px]"
                  onClick={(e) => { e.stopPropagation(); sfx.open(); useEcho.setState({ overlay: "sun", sunSpotId: p.id }); }}
                >
                  COMPARE IN SOLAR SCIENCE →
                </button>
                <button
                  className="ctl mt-1 w-full text-[9px]"
                  onClick={(e) => { e.stopPropagation(); sfx.close(); useEcho.setState({ sunSpotId: null }); }}
                >
                  ✕ CLOSE
                </button>
              </div>
            )}
          </div>
        </Html>
      ))}
    </>
  );
}
