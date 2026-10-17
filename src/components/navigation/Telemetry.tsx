import { useEffect, useRef, useState } from "react";
import { useEcho } from "@/state/store";
import { useTele, Field } from "@/components/chrome/ui";
import { fmtDist, fmtLat, fmtLon } from "@/lib/geo";
import { artifactById, artifactsFor } from "@/data/artifacts";
import { BODIES, ORBIT_K, bodyPos } from "@/engine/frames/frames";
import { clock } from "@/engine/time/clock";
import { tele, siteRef } from "@/engine/telemetry";
import { buildPath, artifactStateAt } from "@/engine/missions/pathing";
import { flyToLocal, flyToLonLat, focusBody } from "@/engine/director";
import earthUrl from "@/assets/tex/earth.jpg";
import marsUrl from "@/assets/tex/mars.jpg";
import moonUrl from "@/assets/tex/moon.jpg";

function useRecent(ms = 4000) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    let id = 0;
    const bump = () => {
      setOn(true);
      clearTimeout(id);
      id = window.setTimeout(() => setOn(false), ms);
    };
    bump();
    window.addEventListener("pointermove", bump);
    window.addEventListener("wheel", bump);
    window.addEventListener("keydown", bump);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("wheel", bump);
      window.removeEventListener("keydown", bump);
    };
  }, [ms]);
  return on;
}

export function Compass() {
  const t = useTele(120);
  const recent = useRecent();
  const flying = useEcho((s) => s.flying);
  return (
    <div className={`flex items-center gap-3 transition-opacity duration-700 ${recent || flying ? "opacity-100" : "opacity-25"}`} aria-label={`Heading ${t.heading.toFixed(0)} degrees`}>
      <div className="relative h-12 w-12">
        <svg viewBox="-24 -24 48 48" className="h-12 w-12">
          <circle r="21" fill="none" stroke="#3b4246" strokeWidth="1" />
          <g transform={`rotate(${-t.heading})`}>
            {[0, 90, 180, 270].map((a) => (
              <line key={a} x1="0" y1="-21" x2="0" y2="-17" stroke="#6f7576" transform={`rotate(${a})`} />
            ))}
            <text y="-9" textAnchor="middle" fontSize="7" fill="#d0a45b" fontFamily="IBM Plex Mono">N</text>
            <text x="12" y="2.5" textAnchor="middle" fontSize="6" fill="#6f7576" fontFamily="IBM Plex Mono">E</text>
            <text y="14" textAnchor="middle" fontSize="6" fill="#6f7576" fontFamily="IBM Plex Mono">S</text>
            <text x="-12" y="2.5" textAnchor="middle" fontSize="6" fill="#6f7576" fontFamily="IBM Plex Mono">W</text>
          </g>
          <path d="M0 -24 L-2.5 -19 L2.5 -19Z" fill="#d8d6ce" />
        </svg>
      </div>
      <div className="mono text-[10px] leading-tight tracking-[0.12em] text-ash">
        <div><span className="text-slate">ALT</span> {fmtDist(t.altitudeM)}</div>
        <div><span className="text-slate">DIST</span> {fmtDist(t.distanceToFocusM)}</div>
        <div><span className="text-slate">HDG</span> {t.heading.toFixed(0).padStart(3, "0")}°</div>
      </div>
    </div>
  );
}

export function Telemetry() {
  const ui = useEcho((s) => s.uiMode);
  const scene = useEcho((s) => s.scene);
  const aid = useEcho((s) => s.artifactId);
  const t = useTele(160);
  const art = artifactById(aid);
  if (ui !== "science") return null;
  return (
    <div className="module pointer-events-auto w-64 p-3 max-md:hidden" aria-label="Telemetry">
      <div className="label mb-1">TELEMETRY · {scene.toUpperCase()}</div>
      <Field k="ALTITUDE" v={fmtDist(t.altitudeM)} />
      <Field k="DISTANCE" v={fmtDist(t.distanceToFocusM)} />
      <Field k="HEADING" v={`${t.heading.toFixed(1)}°`} />
      {scene !== "solar" && (
        <>
          <Field k="LATITUDE" v={fmtLat(t.lat)} />
          <Field k="LONGITUDE" v={fmtLon(t.lon)} />
        </>
      )}
      {scene === "site" && (
        <>
          <Field k="REL. ELEVATION" v={`${t.elevM.toFixed(1)} M · VIZ`} />
          <Field k="SLOPE" v={`${t.slopeDeg.toFixed(1)}° · VIZ`} />
          <Field k="SUN ANGLE" v={`${t.sunAngle.toFixed(0)}° · SIM`} />
        </>
      )}
      {scene === "planet" && <Field k="SUN ANGLE" v={`${t.sunAngle.toFixed(0)}°`} />}
      {scene === "solar" && (
        <>
          <Field k="SUN DISTANCE" v={`${t.sunDistAU.toFixed(3)} AU`} />
          {t.focusRealKm > 0 && <Field k="FROM EARTH" v={fmtDist(t.focusRealKm * 1000)} />}
        </>
      )}
      <Field k="CAMERA" v={`${t.cam.map((v) => v.toFixed(Math.abs(v) > 99 ? 0 : 1)).join(" ")}`} />
      {art && <Field k="SOURCE" v={art.sources[0]?.sourceId.toUpperCase()} />}
    </div>
  );
}

/* ------------------------------------------------------------ minimap */
export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = useEcho((s) => s.scene);
  const world = useEcho((s) => s.world);
  const aid = useEcho((s) => s.artifactId);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const W = 176, H = 128;
  const view = useRef({ cx: 0, cz: 0, span: 600 });

  useEffect(() => {
    if (scene === "planet") {
      const im = new Image();
      im.src = world === "moon" ? moonUrl : world === "earth" ? earthUrl : marsUrl;
      imgRef.current = im;
    }
  }, [scene, world]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    const art = artifactById(aid);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#080b0e";
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      if (scene === "planet") {
        const im = imgRef.current;
        if (im && im.complete) {
          ctx.globalAlpha = 0.85;
          ctx.drawImage(im, 0, 0, W, H);
          ctx.globalAlpha = 1;
        }
        const pt = (lon: number, lat: number) => [((((lon + 180) % 360) + 360) % 360) / 360 * W, ((90 - lat) / 180) * H];
        (world === "mars" || world === "moon" ? artifactsFor(world) : []).forEach((a) => {
          const [x, y] = pt(a.location.lon, a.location.lat);
          ctx.strokeStyle = a.id === aid ? "#d8d6ce" : "#d0a45b";
          ctx.strokeRect(x - 3, y - 3, 6, 6);
        });
        const [cx, cy] = pt(tele.lon, tele.lat);
        ctx.fillStyle = "#7fb8c7";
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 7);
        ctx.fill();
      } else if (scene === "solar") {
        const sc = (W / 2 - 6) / (ORBIT_K * Math.sqrt(30.07));
        ctx.strokeStyle = "#1d2429";
        BODIES.filter((b) => b.kind === "planet").forEach((b) => {
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, ORBIT_K * Math.sqrt(b.a) * sc * (H / W) * 1.6, 0, 7);
          ctx.stroke();
        });
        const k = sc * (H / W) * 1.6;
        BODIES.forEach((b) => {
          const p = bodyPos(b.id, clock.t);
          ctx.fillStyle = b.id === "sun" ? "#d0a45b" : b.id === "earth" ? "#7fb8c7" : b.id === "mars" ? "#c76e4b" : "#a2a6a4";
          ctx.fillRect(W / 2 + p.x * k - 1.5, H / 2 + p.z * k - 1.5, 3, 3);
        });
        const c = tele.cam;
        ctx.strokeStyle = "#d8d6ce";
        ctx.strokeRect(W / 2 + c[0] * k - 3, H / 2 + c[2] * k - 3, 6, 6);
      } else if (art) {
        const path = buildPath(art);
        const v = view.current;
        const rv = siteRef.pos;
        if (path.length) {
          let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
          path.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
          v.cx = (x0 + x1) / 2; v.cz = (z0 + z1) / 2; v.span = Math.max(x1 - x0, (z1 - z0) * (W / H), 300) * 1.18;
        } else {
          v.cx = rv.x; v.cz = rv.z; v.span = 500;
        }
        const k = W / v.span;
        const X = (x: number) => W / 2 + (x - v.cx) * k;
        const Z = (z: number) => H / 2 + (z - v.cz) * k;
        const st = artifactStateAt(art, clock.t);
        if (path.length) {
          ctx.strokeStyle = "#3b4246";
          ctx.beginPath();
          path.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Z(p.z)) : ctx.moveTo(X(p.x), Z(p.z))));
          ctx.stroke();
          ctx.strokeStyle = "#d0a45b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          path.slice(0, st.index + 1).forEach((p, i) => (i ? ctx.lineTo(X(p.x), Z(p.z)) : ctx.moveTo(X(p.x), Z(p.z))));
          ctx.stroke();
          ctx.lineWidth = 1;
          art.missionPath!.waypoints.forEach((w) => {
            ctx.fillStyle = w.t <= clock.t ? "#d0a45b" : "#3b4246";
            ctx.fillRect(X(w.x) - 1.5, Z(w.z) - 1.5, 3, 3);
          });
        }
        ctx.fillStyle = "#d0a45b";
        ctx.beginPath();
        ctx.arc(X(rv.x), Z(rv.z), 3, 0, 7);
        ctx.fill();
        const c = tele.cam;
        const hd = (tele.heading * Math.PI) / 180;
        ctx.save();
        ctx.translate(X(c[0]), Z(c[2]));
        ctx.rotate(hd);
        ctx.fillStyle = "#7fb8c7";
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(3.5, 4); ctx.lineTo(-3.5, 4); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = "#262e34";
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    };
    draw();
    const id = setInterval(draw, 120);
    return () => clearInterval(id);
  }, [scene, world, aid]);

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    if (scene === "planet") flyToLonLat((x / W) * 360 - 180, 90 - (y / H) * 180);
    else if (scene === "site") {
      const v = view.current;
      const k = W / v.span;
      flyToLocal(v.cx + (x - W / 2) / k, v.cz + (y - H / 2) / k);
    } else if (scene === "solar") {
      const sc = (W / 2 - 6) / (ORBIT_K * Math.sqrt(30.07)) * (H / W) * 1.6;
      let best = "sun", bd = 1e9;
      BODIES.forEach((b) => {
        const p = bodyPos(b.id, clock.t);
        const d = Math.hypot(W / 2 + p.x * sc - x, H / 2 + p.z * sc - y);
        if (d < bd) { bd = d; best = b.id; }
      });
      focusBody(best);
    }
  };

  return (
    <div className="module p-1.5">
      <div className="mb-1 flex items-center justify-between px-0.5">
        <span className="label">MINIMAP · {scene === "planet" ? "EQUIRECT" : scene === "solar" ? "ECLIPTIC" : "SITE"}</span>
        <span className="label">M</span>
      </div>
      <canvas ref={ref} style={{ width: W, height: H }} onClick={click} className="cursor-crosshair" aria-label="Interactive minimap" />
    </div>
  );
}
