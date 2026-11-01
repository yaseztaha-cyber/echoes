import { useState } from "react";
import { useEcho } from "@/state/store";
import { Chip, Field } from "@/components/chrome/ui";
import { sfx } from "@/lib/audio";
import hmi from "@/assets/sun/sdo_hmiic.jpg";
import a304 from "@/assets/sun/sdo_0304.jpg";
import a193 from "@/assets/sun/sdo_0193.jpg";
import a171 from "@/assets/sun/sdo_0171.jpg";
import a211 from "@/assets/sun/sdo_0211.jpg";
import mag from "@/assets/sun/sdo_HMIB.jpg";
import dop from "@/assets/sun/sdo_HMID.jpg";

const CHANNELS = [
  {
    id: "hmi",
    label: "CONTINUUM",
    url: hmi,
    instrument: "SDO / HMI",
    wavelength: "6173 Å (visible continuum)",
    colorClass: "Near-natural photosphere intensitygram",
    legend: undefined as string | undefined,
    stamp: "Retrieved 2026-10-23 (latest-image feed)",
    reveals: "Sunspots, faculae and granulation in visible light.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "magnetic",
    label: "MAGNETOGRAM",
    url: mag,
    instrument: "SDO / HMI",
    wavelength: "Fe I 6173 Å — line-of-sight magnetogram",
    colorClass: "GRAYSCALE QUANTITY MAP, NOT NATURAL COLOR",
    legend: "WHITE = FIELD TOWARD OBSERVER (+B LOS) · BLACK = FIELD AWAY (−B LOS)",
    stamp: "2026-10-23T11:30:00Z (watermark)",
    reveals: "Magnetic polarity and strength — the engine behind spots and active regions.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "motion",
    label: "DOPPLERGRAM",
    url: dop,
    instrument: "SDO / HMI",
    wavelength: "Fe I 6173 Å line — dopplergram",
    colorClass: "VELOCITY MAP — COLORS ENCODE MOTION, NOT NATURAL COLOR",
    legend: "BRIGHTER/DARKER GRAY = PLASMA MOVING TOWARD / AWAY FROM THE OBSERVER",
    stamp: "2026-10-23T11:30:00Z (watermark)",
    reveals: "Line-of-sight velocity: convection, supergranulation, rotation.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "304",
    label: "304 Å",
    url: a304,
    instrument: "SDO / AIA",
    wavelength: "304 Å (extreme ultraviolet)",
    colorClass: "FALSE COLOR — AS PUBLISHED BY SDO, NOT NAKED-EYE",
    legend: undefined as string | undefined,
    stamp: "2026-10-23 (AIA 304 latest)",
    reveals: "Upper chromosphere and transition region (~50,000 K plasma).",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "171",
    label: "171 Å",
    url: a171,
    instrument: "SDO / AIA",
    wavelength: "171 Å (Fe IX, extreme ultraviolet)",
    colorClass: "FALSE COLOR — AS PUBLISHED BY SDO, NOT NAKED-EYE",
    legend: undefined as string | undefined,
    stamp: "2026-10-23T11:36:08Z (watermark)",
    reveals: "Quiet corona and million-kelvin magnetic loops.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "193",
    label: "193 Å",
    url: a193,
    instrument: "SDO / AIA",
    wavelength: "193 Å (extreme ultraviolet)",
    colorClass: "FALSE COLOR — AS PUBLISHED BY SDO, NOT NAKED-EYE",
    legend: undefined as string | undefined,
    stamp: "Retrieved 2026-10-23 (latest-image feed)",
    reveals: "Hot corona (~1.25 MK); coronal holes appear dark.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
  {
    id: "211",
    label: "211 Å",
    url: a211,
    instrument: "SDO / AIA",
    wavelength: "211 Å (Fe XIV, extreme ultraviolet)",
    colorClass: "FALSE COLOR — AS PUBLISHED BY SDO, NOT NAKED-EYE",
    legend: undefined as string | undefined,
    stamp: "2026-10-23T11:36:08Z (watermark)",
    reveals: "Hotter corona (~2 MK); active regions stand out bright.",
    recordUrl: "https://sdo.gsfc.nasa.gov/data/dataaccess.php",
  },
] as const;

/**
 * SOLAR SCIENCE VIEW — real full-disk SDO observations, presented flat (they are
 * disk images, not spherical maps) with instrument, wavelength, classification
 * and, where meaningful, a reading legend. A/B compare puts any channel next to
 * the visible-light continuum reference.
 */
export function SolarScope() {
  const [ch, setCh] = useState<(typeof CHANNELS)[number]>(CHANNELS[0]);
  const [cmp, setCmp] = useState(false);
  const close = () => {
    sfx.close();
    useEcho.setState({ overlay: null });
  };
  const ref = CHANNELS[0];
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
            <button className="ctl px-2" data-on={cmp || undefined} onClick={() => { sfx.select(); setCmp(!cmp); }}>A/B</button>
            <button className="ctl px-2" onClick={close} aria-label="Return to 3D">✕ RETURN TO 3D</button>
          </span>
        </div>
        <div className="flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-black p-4">
          {cmp ? (
            <div className="flex h-full w-full items-center justify-center gap-3 max-lg:flex-col">
              <figure className="flex h-full min-h-0 flex-col items-center justify-center">
                <img src={ref.url} alt={`SDO full-disk Sun, ${ref.label} reference`} className="min-h-0 max-h-full max-w-full select-none object-contain" draggable={false} />
                <figcaption className="mono mt-1 text-[9px] tracking-[0.12em] text-amber">A · {ref.instrument} · VISIBLE CONTINUUM REFERENCE</figcaption>
              </figure>
              <figure className="flex h-full min-h-0 flex-col items-center justify-center">
                <img key={ch.id} src={ch.url} alt={`SDO full-disk Sun, ${ch.label}`} className="min-h-0 max-h-full max-w-full select-none object-contain" draggable={false} />
                <figcaption className="mono mt-1 text-[9px] tracking-[0.12em] text-bone">B · {ch.instrument} · {ch.label}</figcaption>
              </figure>
            </div>
          ) : (
            <img key={ch.id} src={ch.url} alt={`SDO full-disk Sun, ${ch.label}`} className="anim-up max-h-full max-w-full select-none object-contain" draggable={false} />
          )}
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
          {ch.legend && <Field k="LEGEND" v={ch.legend} tone="text-amber" />}
          <Field k="REVEALS" v={ch.reveals} />
          <Field k="OBSERVATION" v={ch.stamp} />
        </div>
        <div>
          <div className="label mb-1">SOURCE</div>
          <a href={ch.recordUrl} target="_blank" rel="noreferrer" className="mono mb-1 block border border-iron/60 px-2 py-1.5 text-[10.5px] tracking-[0.08em] text-ash hover:border-amber hover:text-bone">
            <span className="text-amber">[NASA]</span> SDO DATA ACCESS ↗
          </a>
        </div>
        <div className="module p-2.5">
          <div className="label leading-relaxed">EUV CHANNELS AND THE MAGNETOGRAM ARE SCIENCE VISUALIZATIONS OF PHYSICAL QUANTITIES, NOT PHOTOGRAPHS. THE SUN WOULD NOT LOOK LIKE THIS TO THE EYE.</div>
        </div>
        <button className="ctl" onClick={close}>← RETURN TO 3D WORLD</button>
      </aside>
    </div>
  );
}
