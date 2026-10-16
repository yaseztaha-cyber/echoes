import { Component, Suspense, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Html, Line, useGLTF } from "@react-three/drei";
import { htmlLayer } from "@/engine/telemetry";
import type { Artifact } from "@/types";
import { useEcho } from "@/state/store";
import { focusInstrument } from "@/engine/director";
import { MER_OFFICIAL_URL, MER_YAW } from "./merOfficial";

/**
 * Spacecraft models. All are RECONSTRUCTED from documented dimensions using simple primitives.
 * Hardware hotspots come from the artifact record, so UI and geometry share one source of truth.
 */
type V = [number, number, number];

const mk = (color: string, metalness: number, roughness: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const MAT = {
  alu: mk("#aeb1b2", 0.85, 0.42),
  dust: mk("#8f7a66", 0.1, 0.95),
  dustAlu: mk("#9b8f84", 0.5, 0.7),
  solar: mk("#161d2a", 0.6, 0.38),
  web: mk("#9d8f78", 0.4, 0.6),
  black: mk("#141618", 0.3, 0.6),
  gold: mk("#b8923a", 0.95, 0.32),
  white: mk("#cfcfca", 0.2, 0.7),
  steel: mk("#767b80", 0.9, 0.35),
  foil: mk("#c4a24f", 1.0, 0.28, { side: THREE.DoubleSide }),
  dish: mk("#cfd0cc", 0.5, 0.45, { side: THREE.DoubleSide }),
};
type MatKey = keyof typeof MAT;

function Box({ p, s, m, r }: { p: V; s: V; m: MatKey; r?: V }) {
  return (
    <mesh position={p} rotation={r} material={MAT[m]} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}
function Cyl({ p, r, h, m, rot, seg = 18, r2 }: { p: V; r: number; h: number; m: MatKey; rot?: V; seg?: number; r2?: number }) {
  return (
    <mesh position={p} rotation={rot} material={MAT[m]} castShadow receiveShadow>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    </mesh>
  );
}
function Bar({ a, b, r = 0.014, m = "alu" }: { a: V; b: V; r?: number; m?: MatKey }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const len = d.length();
    return { pos: A.clone().add(B).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={MAT[m]} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
    </mesh>
  );
}
const Ball = ({ p, r, m }: { p: V; r: number; m: MatKey }) => (
  <mesh position={p} material={MAT[m]} castShadow>
    <sphereGeometry args={[r, 12, 10]} />
  </mesh>
);

/* ---------------------------------------------------------------- MER */
function Wheel({ p }: { p: V }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0, 0]} r={0.13} h={0.16} m="dustAlu" rot={[Math.PI / 2, 0, 0]} seg={28} />
      <Cyl p={[0, 0, 0]} r={0.085} h={0.17} m="steel" rot={[Math.PI / 2, 0, 0]} seg={20} />
      <Cyl p={[0, 0, 0]} r={0.12} h={0.01} m="dust" rot={[Math.PI / 2, 0, 0]} seg={28} />
    </group>
  );
}

function MerRover() {
  const sides = [-1, 1];
  return (
    <group>
      {sides.map((s) => (
        <group key={s}>
          <Wheel p={[0.53, 0.13, s * 0.6]} />
          <Wheel p={[0, 0.13, s * 0.6]} />
          <Wheel p={[-0.53, 0.13, s * 0.6]} />
          <Bar a={[0.53, 0.13, s * 0.56]} b={[0.22, 0.42, s * 0.52]} r={0.017} />
          <Bar a={[0.22, 0.42, s * 0.52]} b={[0.0, 0.5, s * 0.45]} r={0.019} />
          <Bar a={[0.22, 0.42, s * 0.52]} b={[-0.2, 0.4, s * 0.56]} r={0.017} />
          <Bar a={[-0.2, 0.4, s * 0.56]} b={[0.0, 0.13, s * 0.56]} r={0.016} />
          <Bar a={[-0.2, 0.4, s * 0.56]} b={[-0.53, 0.13, s * 0.56]} r={0.016} />
          {/* hazcams */}
          <Box p={[0.5, 0.42, s * 0.22]} s={[0.05, 0.05, 0.07]} m="black" />
          <Box p={[-0.5, 0.42, s * 0.2]} s={[0.05, 0.05, 0.07]} m="black" />
          {/* solar wing */}
          <Box p={[0, 0.7, s * 0.8]} s={[1.0, 0.025, 0.62]} m="solar" />
        </group>
      ))}
      {/* warm electronics box and deck */}
      <Box p={[0, 0.5, 0]} s={[0.95, 0.3, 0.8]} m="web" />
      <Box p={[0, 0.685, 0]} s={[1.05, 0.03, 0.95]} m="solar" />
      {/* mast + camera bar */}
      <Cyl p={[0.3, 1.1, 0]} r={0.022} h={0.82} m="alu" seg={10} />
      <Box p={[0.3, 1.5, 0]} s={[0.05, 0.05, 0.42]} m="alu" />
      {[-0.15, 0.15].map((z) => (
        <group key={z}>
          <Box p={[0.3, 1.52, z]} s={[0.07, 0.07, 0.07]} m="dustAlu" />
          <Cyl p={[0.345, 1.52, z]} r={0.022} h={0.03} m="black" rot={[0, 0, Math.PI / 2]} seg={12} />
        </group>
      ))}
      {[-0.05, 0.05].map((z) => (
        <group key={z}>
          <Box p={[0.31, 1.54, z]} s={[0.055, 0.055, 0.055]} m="dustAlu" />
          <Cyl p={[0.345, 1.54, z]} r={0.016} h={0.025} m="black" rot={[0, 0, Math.PI / 2]} seg={10} />
        </group>
      ))}
      <Box p={[0.3, 0.9, 0]} s={[0.12, 0.16, 0.12]} m="gold" />
      {/* high-gain antenna */}
      <Cyl p={[-0.4, 0.83, -0.38]} r={0.012} h={0.28} m="alu" seg={8} />
      <Cyl p={[-0.4, 0.98, -0.38]} r={0.15} h={0.012} m="dish" rot={[0.55, 0, 0]} seg={28} />
      {/* low-gain / UHF antennas */}
      <Bar a={[-0.45, 0.7, 0.3]} b={[-0.45, 1.0, 0.3]} r={0.008} />
      <Ball p={[-0.45, 1.01, 0.3]} r={0.015} m="alu" />
      <Bar a={[-0.3, 0.7, 0.4]} b={[-0.3, 0.88, 0.4]} r={0.012} />
      {/* calibration target */}
      <Cyl p={[-0.1, 0.75, 0.3]} r={0.01} h={0.12} m="steel" seg={8} />
      <Cyl p={[-0.1, 0.815, 0.3]} r={0.04} h={0.01} m="white" seg={16} />
      {/* instrument deployment device */}
      <Cyl p={[0.5, 0.4, 0]} r={0.03} h={0.1} m="steel" rot={[Math.PI / 2, 0, 0]} />
      <Bar a={[0.5, 0.4, 0]} b={[0.68, 0.5, 0.05]} r={0.022} m="steel" />
      <Ball p={[0.68, 0.5, 0.05]} r={0.03} m="steel" />
      <Bar a={[0.68, 0.5, 0.05]} b={[0.8, 0.36, 0]} r={0.02} m="steel" />
      <Cyl p={[0.82, 0.34, 0]} r={0.09} h={0.1} m="dustAlu" rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[0.87, 0.34, 0]} r={0.025} h={0.06} m="black" rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[0.84, 0.36, -0.07]} r={0.03} h={0.07} m="alu" rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[0.83, 0.3, 0.07]} r={0.03} h={0.07} m="gold" rot={[0, 0, Math.PI / 2]} />
      <Cyl p={[0.8, 0.4, 0]} r={0.035} h={0.06} m="steel" />
    </group>
  );
}

/* ---------------------------------------------------------------- MER official */

/**
 * Official NASA/JPL MER model (MER_static.glb, NASA 3D Resources).
 * Metric scale, ground plane at y≈0 — mounts directly in the rover frame.
 * Single merged mesh: no part hierarchy, so hardware hotspots keep using the
 * documented mount positions from the artifact record.
 * Orientation (bounds-verified): 2.28 m wingspan on model X matches the real
 * 2.3 m panel span, tall mast assembly front-center at model z≈-0.37, so model
 * forward is -Z → yaw -90° into the +X-forward rover frame. The mapped mast
 * lands ≈10 cm from the documented Pancam mount. The source arm is stowed, so
 * arm-instrument hotspots hover near the front deck edge (documented
 * limitation). Facts: see merOfficial.ts (unit-tested record).
 */
function OfficialMer() {
  const { scene } = useGLTF(MER_OFFICIAL_URL);
  return <primitive object={scene} rotation={[0, MER_YAW, 0]} />;
}

/** Local fallback: any load failure keeps the documented primitive reconstruction. */
class MerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <MerRover /> : this.props.children;
  }
}

/* ---------------------------------------------------------------- Sojourner */
function SojournerRover() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {[0.22, 0, -0.22].map((x) => (
            <Cyl key={x} p={[x, 0.065, s * 0.26]} r={0.065} h={0.08} m="dustAlu" rot={[Math.PI / 2, 0, 0]} seg={20} />
          ))}
          <Bar a={[0.22, 0.065, s * 0.24]} b={[-0.22, 0.065, s * 0.24]} r={0.008} />
          <Bar a={[0.0, 0.065, s * 0.24]} b={[0.0, 0.2, s * 0.2]} r={0.008} />
        </group>
      ))}
      <Box p={[0, 0.21, 0]} s={[0.55, 0.16, 0.36]} m="web" />
      <Box p={[0, 0.3, 0]} s={[0.5, 0.012, 0.34]} m="solar" />
      <Bar a={[-0.22, 0.3, 0.1]} b={[-0.22, 0.55, 0.1]} r={0.006} />
      <Ball p={[-0.22, 0.56, 0.1]} r={0.012} m="alu" />
      {[-0.06, 0.06].map((z) => (
        <Box key={z} p={[0.29, 0.22, z]} s={[0.03, 0.035, 0.035]} m="black" />
      ))}
      <Cyl p={[-0.3, 0.12, 0]} r={0.03} h={0.06} m="alu" rot={[0, 0, Math.PI / 2]} />
    </group>
  );
}

/* ---------------------------------------------------------------- InSight */
function InSightLander() {
  return (
    <group>
      <Cyl p={[0, 0.95, 0]} r={0.8} h={0.08} m="dustAlu" seg={6} />
      <Cyl p={[0, 0.7, 0]} r={0.5} h={0.4} m="gold" seg={6} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <group key={i}>
            <Bar a={[Math.cos(a) * 0.6, 0.85, Math.sin(a) * 0.6]} b={[Math.cos(a) * 1.2, 0.05, Math.sin(a) * 1.2]} r={0.03} />
            <Cyl p={[Math.cos(a) * 1.2, 0.03, Math.sin(a) * 1.2]} r={0.16} h={0.04} m="steel" />
          </group>
        );
      })}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 1.08, s * 1.45]} rotation={[s * 0.2, 0, 0]}>
          <Cyl p={[0, 0, 0]} r={1.05} h={0.03} m="solar" seg={40} />
          <Cyl p={[0, 0.02, 0]} r={0.12} h={0.04} m="steel" seg={14} />
        </group>
      ))}
      <Bar a={[0.4, 1.0, -0.4]} b={[0.4, 1.5, -0.4]} r={0.02} />
      <Ball p={[0.4, 1.52, -0.4]} r={0.05} m="alu" />
      {/* arm */}
      <Bar a={[0.5, 1.05, 0]} b={[1.0, 1.4, 0.4]} r={0.04} m="steel" />
      <Bar a={[1.0, 1.4, 0.4]} b={[1.5, 0.9, 0.85]} r={0.035} m="steel" />
      {/* SEIS under wind & thermal shield */}
      <mesh position={[1.55, 0.0, 0.9]} material={MAT.dish} castShadow>
        <sphereGeometry args={[0.42, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* HP3 */}
      <Box p={[-1.3, 0.1, 1.0]} s={[0.55, 0.2, 0.22]} m="white" />
      <Bar a={[-1.3, 0.2, 1.0]} b={[-0.8, 0.9, 0.5]} r={0.01} m="black" />
    </group>
  );
}

/* ---------------------------------------------------------------- Apollo */
function LunarModuleStage() {
  const legs = [0, 1, 2, 3].map((i) => (i / 4) * Math.PI * 2 + Math.PI / 4);
  return (
    <group>
      <Cyl p={[0, 1.55, 0]} r={1.9} h={1.55} m="foil" seg={8} />
      <Cyl p={[0, 0.85, 0]} r={0.55} h={0.5} m="black" seg={14} r2={0.2} />
      {legs.map((a, i) => (
        <group key={i}>
          <Bar a={[Math.cos(a) * 1.9, 2.1, Math.sin(a) * 1.9]} b={[Math.cos(a) * 4.2, 0.2, Math.sin(a) * 4.2]} r={0.08} m="foil" />
          <Bar a={[Math.cos(a) * 1.9, 0.95, Math.sin(a) * 1.9]} b={[Math.cos(a) * 3.6, 0.7, Math.sin(a) * 3.6]} r={0.045} m="steel" />
          <Cyl p={[Math.cos(a) * 4.25, 0.08, Math.sin(a) * 4.25]} r={0.46} h={0.07} m="foil" seg={20} />
        </group>
      ))}
      <Box p={[2.45, 1.35, 0]} s={[0.08, 1.7, 0.6]} m="steel" r={[0, 0, 0.1]} />
    </group>
  );
}

function ApolloSite({ a }: { a: Artifact }) {
  const has = (id: string) => a.hardware.find((h) => h.id === id);
  const alsep = has("alsep")!;
  const rtgPos: V = [alsep.pos[0] + 7, 0.3, alsep.pos[2] + 2];
  return (
    <group>
      <LunarModuleStage />
      <group position={alsep.pos}>
        <Box p={[0, 0.15, 0]} s={[0.8, 0.5, 0.6]} m="foil" />
        <Bar a={[0.2, 0.4, 0.1]} b={[0.2, 1.4, 0.1]} r={0.015} />
        <Cyl p={[0.2, 1.45, 0.1]} r={0.22} h={0.06} m="dish" rot={[0.2, 0, 0.3]} seg={20} />
      </group>
      <group position={rtgPos}>
        <Cyl p={[0, 0, 0]} r={0.2} h={0.46} m="steel" />
        <Cyl p={[0, 0, 0]} r={0.27} h={0.05} m="steel" />
        <Cyl p={[0, 0.12, 0]} r={0.27} h={0.05} m="steel" />
        <Cyl p={[0, -0.12, 0]} r={0.27} h={0.05} m="steel" />
      </group>
      <Line points={[alsep.pos, rtgPos]} color="#3a3a38" lineWidth={1} />
      {has("pse") && (
        <group position={has("pse")!.pos}>
          <Cyl p={[0, 0.1, 0]} r={0.28} h={0.28} m="foil" />
          <Cyl p={[0, 0.26, 0]} r={0.2} h={0.02} m="white" />
        </group>
      )}
      {has("sws") && (
        <group position={has("sws")!.pos}>
          <Box p={[0, 0.3, 0]} s={[0.3, 0.3, 0.3]} m="white" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Cyl key={i} p={[Math.cos(i) * 0.22, 0.62, Math.sin(i) * 0.22]} r={0.04} h={0.12} m="steel" />
          ))}
          <Bar a={[0, 0, 0]} b={[0, 0.3, 0]} r={0.02} />
        </group>
      )}
      {has("ase") && (
        <group position={has("ase")!.pos}>
          <Box p={[0, 0.12, 0]} s={[0.35, 0.22, 0.25]} m="white" />
          {[3, 6, 9].map((d) => (
            <Box key={d} p={[-d, 0.04, 0]} s={[0.1, 0.08, 0.1]} m="steel" />
          ))}
          <Line points={[[0, 0.05, 0], [-9, 0.05, 0]]} color="#3a3a38" lineWidth={1} />
        </group>
      )}
      {has("lspe") && (
        <group position={has("lspe")!.pos}>
          <Box p={[0, 0.12, 0]} s={[0.35, 0.22, 0.25]} m="white" />
          {[3, 6, 9].map((d) => (
            <Box key={d} p={[-d, 0.04, 0.5]} s={[0.1, 0.08, 0.1]} m="steel" />
          ))}
        </group>
      )}
      {has("hfe") && (
        <group position={has("hfe")!.pos}>
          <Box p={[0, 0.1, 0]} s={[0.4, 0.18, 0.3]} m="white" />
          {[-0.5, 0.5].map((z) => (
            <Bar key={z} a={[0, 0.1, z]} b={[0, 0.9, z]} r={0.012} m="steel" />
          ))}
        </group>
      )}
      {has("lrv") && <LunarRover pos={has("lrv")!.pos} />}
    </group>
  );
}

function LunarRover({ pos }: { pos: V }) {
  return (
    <group position={[pos[0], 0, pos[2]]} rotation={[0, 0.6, 0]}>
      <Box p={[0, 0.62, 0]} s={[2.4, 0.12, 1.1]} m="alu" />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <Cyl p={[sx * 1.15, 0.36, sz * 0.9]} r={0.36} h={0.23} m="steel" rot={[Math.PI / 2, 0, 0]} seg={20} />
            <Bar a={[sx * 1.15, 0.4, sz * 0.9]} b={[sx * 0.9, 0.62, sz * 0.5]} r={0.03} />
          </group>
        ))
      )}
      {[-0.28, 0.28].map((z) => (
        <Box key={z} p={[-0.1, 0.9, z]} s={[0.4, 0.4, 0.12]} m="white" />
      ))}
      <Bar a={[0.9, 0.7, 0]} b={[0.9, 1.3, 0]} r={0.02} />
      <Cyl p={[0.9, 1.4, 0]} r={0.3} h={0.04} m="dish" rot={[0.3, 0, 0]} seg={20} />
      <Box p={[1.1, 0.78, 0]} s={[0.35, 0.3, 0.55]} m="white" />
    </group>
  );
}

/* ---------------------------------------------------------------- Voyager */
function VoyagerCraft() {
  return (
    <group>
      <Cyl p={[0, 0, 0]} r={0.9} h={0.47} m="gold" seg={10} />
      <mesh position={[0, 0.7 + 3.67, 0]} material={MAT.dish} castShadow>
        <sphereGeometry args={[3.67, 56, 8, 0, Math.PI * 2, Math.PI - 0.528, 0.528]} />
      </mesh>
      <Bar a={[0.0, 0.4, 0]} b={[0.8, 1.2, 0]} r={0.025} />
      <Bar a={[0.0, 0.4, 0]} b={[-0.4, 1.2, 0.7]} r={0.025} />
      <Bar a={[0.0, 0.4, 0]} b={[-0.4, 1.2, -0.7]} r={0.025} />
      <Cyl p={[0, 1.6, 0]} r={0.2} h={0.2} m="alu" r2={0.04} />
      {/* magnetometer boom */}
      <Bar a={[-0.9, 0, 0.3]} b={[-13, 0.4, 1.3]} r={0.035} m="steel" />
      <Box p={[-6.5, 0.2, 0.8]} s={[0.25, 0.25, 0.25]} m="white" />
      <Box p={[-12.9, 0.4, 1.3]} s={[0.25, 0.25, 0.25]} m="white" />
      {/* RTG boom */}
      <Bar a={[0.9, -0.1, -0.2]} b={[4.6, -0.1, -1.8]} r={0.04} m="steel" />
      {[2.4, 3.3, 4.2].map((d, i) => (
        <Cyl key={i} p={[d, -0.1, -0.2 - d * 0.35]} r={0.2} h={0.8} m="steel" rot={[0, 0, Math.PI / 2]} />
      ))}
      {/* plasma wave antennas */}
      <Bar a={[0.5, 0, -0.9]} b={[1.5, 0.3, -9.5]} r={0.012} />
      <Bar a={[0.5, 0, -0.9]} b={[-4, 0.3, -8.4]} r={0.012} />
      {/* scan platform */}
      <Bar a={[0.9, -0.1, 0.4]} b={[1.5, -0.2, 0.95]} r={0.04} m="steel" />
      <Box p={[1.4, -0.2, 0.9]} s={[0.5, 0.4, 0.4]} m="white" />
      <Cyl p={[1.7, -0.2, 1.15]} r={0.1} h={0.35} m="black" rot={[Math.PI / 2, 0, 0]} />
      {/* particle detectors */}
      <Box p={[0.8, 0.0, 1.2]} s={[0.35, 0.3, 0.3]} m="white" />
      {/* golden record */}
      <Cyl p={[-0.6, -0.1, 1.5]} r={0.15} h={0.015} m="foil" rot={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

export function ArtifactModel({ artifact }: { artifact: Artifact }) {
  const inspect = useEcho((s) => s.camMode === "inspect");
  const science = useEcho((s) => s.uiMode === "science");
  const sel = useEcho((s) => s.instrumentId);
  const kind = artifact.model.kind;
  return (
    <group>
      {kind === "mer" ? (
        <Suspense fallback={<MerRover />}>
          <MerBoundary>
            <OfficialMer />
          </MerBoundary>
        </Suspense>
      ) : null}
      {kind === "sojourner" && <SojournerRover />}
      {kind === "insight" && <InSightLander />}
      {kind === "apollo" && <ApolloSite a={artifact} />}
      {kind === "voyager" && <VoyagerCraft />}
      {(inspect || science) &&
        artifact.hardware.map((h) => (
          <group key={h.id} position={h.pos}>
            <Html portal={htmlLayer as any} zIndexRange={[20, 0]} style={{ pointerEvents: inspect ? "auto" : "none" }}>
              <button
                className="hotspot"
                data-active={sel === h.id}
                aria-label={`${h.name}: ${h.full}`}
                onClick={() => inspect && focusInstrument(h.id)}
                title={`${h.name} · ${h.full}`}
              />
            </Html>
          </group>
        ))}
    </group>
  );
}
