import { useEffect, useRef, useState } from "react";
import { useEcho } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { mediaById } from "@/data/media";
import { Chip, Field } from "@/components/chrome/ui";
import { sfx } from "@/lib/audio";

/**
 * PANORAMA MODE (A) — real 360° mission panorama as a cylindrical viewer.
 * Drag to look around (wraps seamlessly), wheel/buttons to zoom. The view is
 * the documented observation location, not a navigable 3D reconstruction.
 */
export function Panorama() {
  const aid = useEcho((s) => s.artifactId);
  const pid = useEcho((s) => s.panoramaId);
  const art = artifactById(aid);
  const panos = art?.media.filter((m) => m.imageType?.includes("PANORAM")) ?? [];
  const m = (pid ? mediaById(pid) : undefined) ?? (panos.length > 0 ? mediaById(panos[0].id) : undefined);
  const [yaw, setYaw] = useState(0); // pixels of horizontal pan
  const [pitch, setPitch] = useState(0); // pixels of vertical pan
  const [scale, setScale] = useState(1);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [span, setSpan] = useState({ w: 1, h: 1 });

  useEffect(() => {
    setYaw(0);
    setPitch(0);
    setScale(1);
  }, [m?.id]);

  useEffect(() => {
    const el = imgRef.current?.parentElement;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(5, Math.max(1, s * (e.deltaY < 0 ? 1.12 : 0.89))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [m?.id]);

  if (!art || !m) return null;
  const close = () => {
    sfx.close();
    useEcho.setState({ overlay: null, panoramaId: null });
  };
  // seamless horizontal wrap: two copies offset by one full width
  const unit = span.w * scale;
  const off = ((yaw % unit) + unit) % unit;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex bg-ink-0/97 max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-label={`Panorama ${m.title}`}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#1d2429] px-4 py-2">
          <span className="label text-amber">REAL PANORAMA · {art.designation}</span>
          <span className="label">DRAG TO LOOK AROUND · SCROLL TO ZOOM</span>
          <span className="ml-auto flex items-center gap-1">
            <button className="ctl px-2" onClick={() => { setScale(1); setPitch(0); }} aria-label="Reset view">1:1</button>
            <button className="ctl px-2" onClick={close} aria-label="Return to 3D">✕ RETURN TO 3D</button>
          </span>
        </div>
        <div
          className="relative min-h-[280px] flex-1 cursor-ew-resize overflow-hidden bg-black"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setYaw(drag.current.yaw + (e.clientX - drag.current.x));
            setPitch(Math.max(-220, Math.min(220, drag.current.pitch + (e.clientY - drag.current.y))));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {[0, 1].map((k) => (
            <img
              key={k}
              ref={k === 0 ? imgRef : undefined}
              src={m.url}
              alt=""
              aria-hidden={k === 1}
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget;
                setSpan({ w: im.naturalWidth, h: im.naturalHeight });
              }}
              className="absolute top-1/2 max-h-none select-none"
              style={{
                height: `${100 * scale}%`,
                width: "auto",
                maxWidth: "none",
                left: "50%",
                transform: `translate(calc(-50% + ${-off + k * unit}px), calc(-50% + ${pitch * scale}px))`,
              }}
            />
          ))}
          <span className="mono absolute left-3 top-3 border border-iron/80 bg-ink-0/80 px-2 py-1 text-[10px] tracking-[0.14em] text-bone">
            {m.imageType} · CYLINDRICAL VIEWER
          </span>
        </div>
        <div className="border-t border-[#1d2429] px-4 py-2">
          <div className="mono text-[12px] tracking-[0.08em] text-bone">{m.title}</div>
          <p className="mt-0.5 text-[12px] leading-snug text-ash">{m.caption}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Chip tone="text-ok">NASA RECORD</Chip>
            <span className="label">CREDIT · {m.credit}</span>
            {m.recordUrl && <a className="label hover:text-amber" href={m.recordUrl} target="_blank" rel="noreferrer">PHOTOJOURNAL ↗</a>}
          </div>
        </div>
      </div>
      <aside className="scroll-thin flex w-[340px] flex-none flex-col gap-3 overflow-y-auto border-l border-[#1d2429] bg-ink-1/60 p-3 max-md:w-auto max-md:border-l-0 max-md:border-t">
        <div>
          <div className="label">OBSERVATION CONTEXT</div>
          <div className="mt-0.5 text-[15px] leading-snug text-bone">Eagle crater landing site</div>
        </div>
        <div className="module p-2.5">
          <Field k="INSTRUMENT" v="PANCAM" />
          <Field k="SETTING" v="EAGLE CRATER · MERIDIANI PLANUM" />
          <Field k="DATE" v="JANUARY 2004 · SHORTLY AFTER TOUCHDOWN" />
          <Field k="PROVENANCE" v="REAL NASA IMAGE · OFFICIAL RECORD" tone="text-ok" />
        </div>
        <p className="text-[12px] leading-snug text-ash">
          This is what the rover saw — a fixed observational viewpoint, not a place
          you can drive through. Return to the 3D world for the reconstructed site.
        </p>
        <button className="ctl" onClick={close}>← RETURN TO 3D WORLD</button>
      </aside>
    </div>
  );
}
