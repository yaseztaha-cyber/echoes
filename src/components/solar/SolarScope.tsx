import { useState } from "react";
import { useEcho } from "@/state/store";
import { Chip, Field } from "@/components/chrome/ui";
import { sfx } from "@/lib/audio";
import hmi from "@/assets/sun/sdo_hmiic.jpg";
import a304 from "@/assets/sun/sdo_0304.jpg";
import a193 from "@/assets/sun/sdo_0193.jpg";

const CHANNELS = [
  {
    id: "hmi",
    label: "CONTINUUM",
    url: hmi,
    instrument: "SDO / HMI",
    wavelength: "6173 Å (visible continuum)",
    colorClass: "Near-natural photosphere intensitygram",
    reveals: "Sunspots, faculae and granulation in visible light.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "304",
    label: "304 Å",
    url: a304,
    instrument: "SDO / AIA",
    wavelength: "304 Å (extreme ultraviolet)",
    colorClass: "FALSE COLOR — science visualization, not naked-eye appearance",
    reveals: "Upper chromosphere and transition region (~50,000 K plasma).",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "193",
    label: "193 Å",
    url: a193,
    instrument: "SDO / AIA",
    wavelength: "193 Å (extreme ultraviolet)",
    colorClass: "FALSE COLOR — science visualization, not naked-eye appearance",
    reveals: "Hot corona (~1.25 MK); coronal holes appear dark.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
] as const;

/**
 * SOLAR SCIENCE VIEW — real full-disk SDO observations, presented flat (they are
 * disk images, not spherical maps) with instrument, wavelength and classification.
 */
export function SolarScope() {
  const [ch, setCh] = useState<(typeof CHANNELS)[number]>(CHANNELS[0]);
  const close = () => {
    sfx.close();
    useEcho.setState({ overlay: null });
  };
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex bg-ink-0/97 max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-label="Solar science view">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#1d2429] px-4 py-2">
          <span className="label text-amber">SOLAR SCIENCE · SDO FULL-DISK OBSERVATIONS</span>
          <span className="ml-auto flex items-center gap-1">
            {CHANNELS.map((c) => (
              <button key={c.id} className="ctl px-2 text-[9.5px]" data-on={c.id === ch.id} onClick={() => { sfx.select(); setCh(c); }}>
                {c.label}
              </button>
            ))}
            <button className="ctl px-2" onClick={close} aria-label="Return to 3D">✕ RETURN TO 3D</button>
          </span>
        </div>
        <div className="flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-black p-4">
          <img key={ch.id} src={ch.url} alt={`SDO full-disk Sun, ${ch.label}`} className="anim-up max-h-full max-w-full select-none object-contain" draggable={false} />
        </div>
        <div className="border-t border-[#1d2429] px-4 py-2">
          <Chip tone="text-ok">NASA RECORD · FLAT FULL-DISK IMAGE, NOT A SPHERICAL MAP</Chip>
        </div>
      </div>
      <aside className="scroll-thin flex w-[340px] flex-none flex-col gap-3 overflow-y-auto border-l border-[#1d2429] bg-ink-1/60 p-3 max-md:w-auto max-md:border-l-0 max-md:border-t">
        <div>
          <div className="label">CHANNEL</div>
          <div className="mono mt-0.5 text-[15px] tracking-[0.1em] text-bone">{ch.instrument} · {ch.label}</div>
        </div>
        <div className="module p-2.5">
          <Field k="WAVELENGTH" v={ch.wavelength} />
          <Field k="CLASS" v={ch.colorClass} tone="text-warn" />
          <Field k="REVEALS" v={ch.reveals} />
          <Field k="RETRIEVED" v="OCT 2026 LATEST-IMAGE FEED — EXACT TIMESTAMP NOT EMBEDDED; FETCH DATED RECORD FOR RESEARCH" />
        </div>
        <div>
          <div className="label mb-1">SOURCE</div>
          <a href={ch.recordUrl} target="_blank" rel="noreferrer" className="mono mb-1 block border border-iron/60 px-2 py-1.5 text-[10.5px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone">
            <span className="text-amber">[NASA]</span> SDO DATA ACCESS ↗
          </a>
        </div>
        <button className="ctl" onClick={close}>← RETURN TO 3D WORLD</button>
      </aside>
    </div>
  );
}
