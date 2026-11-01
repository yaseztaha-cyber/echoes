/**
 * SUN — layer registry for the solar renderer.
 *
 * Every layer is a REAL SDO observation, rebuilt as a 1024x512 equirectangular
 * map by scripts/build-sun-channels.py (inverse-orthographic resample of the
 * full disk; far side = mirrored near side with a brightness fade, the same
 * disclosed method as the photosphere sun.jpg).
 *
 * Honesty contract (spec: THE SUN — EXTREME VISUAL FIDELITY):
 *  - photosphere is a reconstructed GLOBAL map (near half real, far half mirror);
 *  - the flat science-view images are full-disk OBSERVATIONS shown as published;
 *  - AIA channels are FALSE COLOR as published by SDO, never sold as naked-eye;
 *  - magnetogram/dopplergram colors are quantities, not natural color;
 *  - stamps are the watermark timestamps read from each product.
 */
import sunJpg from "@/assets/tex/sun.jpg";
import sunHmi from "@/assets/tex/sun_hmi.jpg";
import sunDoppler from "@/assets/tex/sun_doppler.jpg";
import sun0304 from "@/assets/tex/sun_0304.jpg";
import sun0171 from "@/assets/tex/sun_0171.jpg";
import coronaMaskUrl from "@/assets/tex/corona_mask.png";
import spotsJson from "@/data/sunspots.json";
import coronaJson from "@/data/corona.json";
import type { SunLayerId } from "@/state/store";

export interface SunLayerInfo {
  id: SunLayerId;
  label: string;
  /** 3D globe texture (equirect map). */
  tex: string;
  /** 0 = photosphere tone ramp (white-gold render), 1 = channel shown as published. */
  raw: 0 | 1;
  instrument: string;
  wavelength: string;
  colorClass: string;
  physics: string;
  /** Shown when supported (quantitative channels). */
  legend?: string;
  cannot: string;
  stamp: string;
  file: string;
}

export const SUN_LAYERS: Record<SunLayerId, SunLayerInfo> = {
  photosphere: {
    id: "photosphere",
    label: "PHOTOSPHERE",
    tex: sunJpg,
    raw: 0,
    instrument: "SDO / HMI",
    wavelength: "6173 Å continuum (visible light)",
    colorClass: "NEAR-NATURAL INTENSITY · RECONSTRUCTED GLOBAL MAP",
    physics:
      "The visible surface where sunlight escapes (~5,772 K effective temperature). Sunspots read dark because they are ~1,000–2,000 K cooler than the surrounding granulation.",
    cannot:
      "The far side is a mirrored near-side fill, and granulation cells are frozen in time — real granulation evolves over minutes.",
    stamp: "2026-10-23 (HMI continuum full disk 4096)",
    file: "sun.jpg",
  },
  chromosphere: {
    id: "chromosphere",
    label: "CHROMOSPHERE",
    tex: sun0304,
    raw: 1,
    instrument: "SDO / AIA",
    wavelength: "304 Å (extreme ultraviolet, He II)",
    colorClass: "FALSE COLOR — AS PUBLISHED BY SDO, NOT NAKED-EYE",
    physics:
      "Upper chromosphere / transition region (~50,000 K plasma). Bright sites trace active regions and plages above the magnetic network.",
    cannot: "An EUV intensity image: temperature-constrained emission, not a visible-light photograph.",
    stamp: "2026-10-23 (AIA 304 full disk)",
    file: "sun_0304.jpg",
  },
  corona: {
    id: "corona",
    label: "CORONA",
    tex: sun0171,
    raw: 1,
    instrument: "SDO / AIA · corona halo: SOHO / LASCO C3",
    wavelength: "171 Å (Fe IX, ~0.6–1 MK plasma) · white-light outer corona",
    colorClass: "FALSE COLOR DISK · WHITE-LIGHT HALO (OBSERVED STRUCTURE MAP)",
    physics:
      "Million-kelvin magnetic corona. Loops and streamers trace the magnetic field; dark lanes are coronal holes (open field lines feeding fast solar wind).",
    cannot:
      "The halo structure map is built from a dated LASCO C3 observation and rescaled to hug the limb (radial scale compressed); it is not a live feed.",
    stamp: "2026-10-23 disk · 2026-10-22T23:42Z halo (watermark)",
    file: "sun_0171.jpg",
  },
  magnetic: {
    id: "magnetic",
    label: "MAGNETIC FIELD",
    tex: sunHmi,
    raw: 1,
    instrument: "SDO / HMI",
    wavelength: "Fe I 6173 Å line — line-of-sight magnetogram",
    colorClass: "GRAYSCALE QUANTITY MAP, NOT NATURAL COLOR",
    physics:
      "Line-of-sight magnetic field measured via Zeeman splitting of the 6173 Å line. Sunspots sit above strong-field active regions; the quiet network is weaker.",
    legend: "WHITE = FIELD TOWARD OBSERVER (+B LOS) · BLACK = FIELD AWAY (−B LOS) · GRAY = WEAK/UNPOLARIZED",
    cannot:
      "Only the line-of-sight component: a horizontal field is invisible here, and polarity signs flip with viewing geometry.",
    stamp: "2026-10-23T11:30:00Z (watermark)",
    file: "sun_hmi.jpg",
  },
  motion: {
    id: "motion",
    label: "SURFACE MOTION",
    tex: sunDoppler,
    raw: 1,
    instrument: "SDO / HMI",
    wavelength: "Fe I 6173 Å line — dopplergram",
    colorClass: "VELOCITY MAP — COLORS ENCODE MOTION, NOT NATURAL COLOR",
    physics:
      "Line-of-sight velocity from the Doppler shift of the same line. Superposed convection (granules, supergranules) and rotation appear as velocity fields.",
    legend: "BRIGHTER/DARKER GRAY = PLASMA MOVING TOWARD / AWAY FROM THE OBSERVER (LINE-OF-SIGHT ONLY)",
    cannot:
      "Motion across the line of sight is invisible, and Earth's orbital/rotational velocities must be subtracted in research pipelines (not shown here).",
    stamp: "2026-10-23T11:30:00Z (watermark)",
    file: "sun_doppler.jpg",
  },
};

/** Flat full-disk observation, as published (science view / observatory). */
export interface SunFlatChannel {
  id: string;
  label: string;
  url: string;
  instrument: string;
  wavelength: string;
  colorClass: string;
  reveals: string;
}

export const CORONA_MASK_URL = coronaMaskUrl;
export const SUN_SPOTS = spotsJson;
export const CORONA_META = coronaJson;

/** Distance at which the sunspot markers become interactive (scene units, R_sun = 2.4). */
export const SUN_R = 2.4;
