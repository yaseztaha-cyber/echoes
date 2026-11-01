/**
 * SOLAR LAYER PANEL — the Solar Layer Explorer UI for the focused Sun.
 *
 * One deliberate layer at a time (spec §11): each choice swaps the 3D sun's
 * observation and states what is shown, the instrument, wavelength, color
 * classification, and what cannot be concluded. Also lists the real detected
 * active regions (sunspots.json) so they can be opened as interactive targets.
 * Components live in src/components/solar; the renderer pieces are in
 * src/engine/solar-system/sun.
 */
import { SUN_LAYERS, SUN_SPOTS } from "@/engine/solar-system/sun/sunAssets";
import { useEcho, type SunLayerId } from "@/state/store";
import { Chip, Field } from "@/components/chrome/ui";
import { sfx } from "@/lib/audio";

const ORDER: SunLayerId[] = ["photosphere", "chromosphere", "corona", "magnetic", "motion"];

export function SunLayerPanel() {
  const layer = useEcho((s) => s.sunLayer);
  const sel = useEcho((s) => s.sunSpotId);
  const info = SUN_LAYERS[layer];
  const spots = (SUN_SPOTS.spots as { lon: number; lat: number }[]) ?? [];
  return (
    <div className="mt-3">
      <div className="label mb-1">SOLAR LAYER · ONE OBSERVATION AT A TIME</div>
      <div className="grid grid-cols-2 gap-1">
        {ORDER.map((id) => (
          <button key={id} className="ctl px-1 text-[9px]" data-on={layer === id} onClick={() => { sfx.select(); useEcho.setState({ sunLayer: id }); }}>
            {SUN_LAYERS[id].label}
          </button>
        ))}
      </div>
      <div className="module mt-2 p-2.5">
        <Field k="INSTRUMENT" v={info.instrument} />
        <Field k="WAVELENGTH" v={info.wavelength} />
        <Field k="CLASS" v={info.colorClass} tone="text-warn" />
        {info.legend && <Field k="LEGEND" v={info.legend} tone="text-amber" />}
        <div className="label mt-2 leading-relaxed text-bone">{info.physics}</div>
        <div className="label mt-1.5 leading-relaxed">CANNOT CONCLUDE: {info.cannot}</div>
        <Field k="OBSERVATION" v={info.stamp} />
      </div>
      {spots.length > 0 && (
        <div className="mt-2">
          <div className="label mb-1">{spots.length} REAL ACTIVE REGIONS DETECTED · TAP ON DISK OR LIST</div>
          {spots.map((sp, i) => (
            <button
              key={i}
              className="mono flex w-full items-center justify-between border-t border-[#1d2429] py-1.5 text-left text-[10px] tracking-[0.1em] text-ash hover:text-amber"
              data-on={sel === `spot${i + 1}` || undefined}
              onClick={() => { sfx.select(); useEcho.setState({ sunSpotId: sel === `spot${i + 1}` ? null : `spot${i + 1}` }); }}
            >
              <span>SUNSPOT {i + 1} · LAT {sp.lat.toFixed(0)}° LON {sp.lon.toFixed(0)}°</span>
              <span className="text-slate">{sel === `spot${i + 1}` ? "●" : "→"}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-1">
        <Chip tone="text-amber">
          PHOTOSPHERE = GLOBAL RECONSTRUCTION (FAR SIDE MIRRORED) · AIA CHANNELS FALSE COLOR AS PUBLISHED
        </Chip>
      </div>
      <button className="ctl ctl-primary mt-3 w-full" onClick={() => { sfx.open(); useEcho.setState({ overlay: "sun", sunSpotId: null }); }}>
        SOLAR SCIENCE VIEW (FLAT OBSERVATIONS) →
      </button>
    </div>
  );
}
