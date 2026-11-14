import { useState } from "react";
import { assetUrl } from "@/lib/asset";
import { sfx } from "@/lib/audio";
import {
  galleryForDevice,
  heroForDevice,
  mediaForDevice,
  videoForDevice,
  NASA_USAGE_NOTE,
  type MissionMediaAsset,
} from "@/data/media-manifest";

/**
 * MISSION MEDIA
 * =============
 *
 * The editorial media presentation for a mission: a hero image, a supporting
 * gallery, the mission video where one exists, and the provenance for every
 * single asset (classification, credit, official source page, date accessed).
 *
 * Everything shown here is a local file served from `public/media/missions/`.
 * The NASA Image and Video Library is never contacted at runtime.
 */

const CLASSIFICATION_TONE: Record<string, string> = {
  "Archival photograph": "text-ash",
  "Mission camera image": "text-cyan",
  "Mission video": "text-amber",
  "Scientific visualization": "text-mars",
  "Artist's concept": "text-warn",
  "Other illustration": "text-slate",
};

const ClassificationChip = ({ asset }: { asset: MissionMediaAsset }) => (
  <span className={`mono border border-iron/50 px-1.5 py-0.5 text-[8.5px] tracking-[0.1em] ${CLASSIFICATION_TONE[asset.classification] ?? "text-slate"}`}>
    {asset.classification.toUpperCase()}
  </span>
);

/** Credit + official source, shown wherever an asset is presented. */
function Provenance({ asset, compact = false }: { asset: MissionMediaAsset; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${compact ? "mt-1" : "mt-2"}`}>
      <span className="mono text-[9px] tracking-[0.1em] text-slate">{asset.credit}</span>
      {asset.sourcePage && (
        <a
          href={asset.sourcePage}
          target="_blank"
          rel="noreferrer"
          className="mono text-[9px] tracking-[0.1em] text-cyan/80 underline decoration-cyan/30 underline-offset-2 hover:text-cyan"
          title={`${asset.title} — NASA Image and Video Library (accessed ${asset.accessed})`}
        >
          SOURCE ↗
        </a>
      )}
      {!compact && <span className="mono text-[9px] tracking-[0.1em] text-slate/70">ACCESSED {asset.accessed}</span>}
    </div>
  );
}

/**
 * A still. Uses the small variant for narrow viewports via `srcset`, decodes
 * asynchronously, and falls back to an honest placeholder if the file cannot
 * be loaded — never a broken image icon.
 */
/** Very wide panoramas and very tall frames are shown whole, not cropped. */
const fitClass = (asset: MissionMediaAsset): string => {
  if (!asset.width || !asset.height) return "object-cover";
  const ratio = asset.width / asset.height;
  return ratio > 2.1 || ratio < 0.55 ? "object-contain" : "object-cover";
};

function Still({
  asset,
  sizes,
  eager = false,
  className = "",
}: {
  asset: MissionMediaAsset;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!asset.file || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-ink-2/80 ${className}`}
        role="img"
        aria-label={`${asset.title} — image unavailable`}
      >
        <span className="mono px-4 text-center text-[9px] tracking-[0.12em] text-slate">
          IMAGE UNAVAILABLE
          <br />
          SOURCE · NASA
        </span>
      </div>
    );
  }
  const srcSet =
    asset.thumb && asset.thumbWidth
      ? `${assetUrl(asset.thumb)} ${asset.thumbWidth}w, ${assetUrl(asset.file)} ${asset.width ?? 1600}w`
      : undefined;
  return (
    <img
      src={assetUrl(asset.file)}
      srcSet={srcSet}
      sizes={sizes}
      width={asset.width}
      height={asset.height}
      alt={asset.title}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function VideoBlock({ asset }: { asset: MissionMediaAsset }) {
  const [failed, setFailed] = useState(false);
  if (asset.kind === "external-video") {
    return (
      <div className="border border-iron/40 bg-ink-1/40 p-4">
        <div className="mono text-[10px] tracking-[0.14em] text-amber">NO STORED CLIP · OFFICIAL SOURCE LINKED</div>
        <p className="mt-2 text-[12px] leading-relaxed text-ash">{asset.caption}</p>
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="ctl ctl-primary mt-3 inline-flex items-center gap-2 text-amber"
        >
          OPEN OFFICIAL NASA MEDIA ↗
        </a>
        <Provenance asset={asset} compact />
      </div>
    );
  }
  if (!asset.file) return null;
  return (
    <figure className="border border-iron/40 bg-ink-1/40">
      {failed ? (
        <div className="flex aspect-video items-center justify-center bg-ink-2/80">
          <span className="mono text-[9px] tracking-[0.12em] text-slate">VIDEO UNAVAILABLE · SOURCE · NASA</span>
        </div>
      ) : (
        <video
          className="aspect-video w-full bg-black"
          controls
          preload="none"
          playsInline
          poster={asset.poster ? assetUrl(asset.poster) : undefined}
          aria-label={asset.title}
          onError={() => setFailed(true)}
        >
          <source src={assetUrl(asset.file)} type="video/webm" />
          <p className="p-4 text-[12px] text-ash">
            This browser cannot play the mission clip.{" "}
            <a href={assetUrl(asset.file)} className="text-amber underline">
              Open the file
            </a>{" "}
            or read the transcript below.
          </p>
        </video>
      )}
      <figcaption className="border-t border-iron/30 px-4 py-3">
        <div className="mono text-[11px] leading-snug tracking-[0.06em] text-bone">{asset.title}</div>
        <p className="mt-1 text-[12px] leading-relaxed text-ash">{asset.caption}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <ClassificationChip asset={asset} />
          <Provenance asset={asset} compact />
        </div>
      </figcaption>
    </figure>
  );
}

export function MissionMedia({ deviceId }: { deviceId: string }) {
  const collection = mediaForDevice(deviceId);
  const hero = heroForDevice(deviceId);
  const gallery = galleryForDevice(deviceId);
  const video = videoForDevice(deviceId);
  const [focusId, setFocusId] = useState<string | null>(null);

  if (!collection || (!hero && gallery.length === 0 && !video)) return null;

  const focus =
    (focusId ? [hero, ...gallery].find((a) => a?.id === focusId) : null) ?? hero ?? gallery[0] ?? null;
  const others = gallery.filter((a) => a.id !== focus?.id);

  return (
    <div className="space-y-5">
      {/* HERO */}
      {focus && (
        <figure className="border border-iron/40 bg-ink-1/40">
          <Still
            asset={focus}
            sizes="(max-width: 900px) 100vw, 1100px"
            eager
            className={`max-h-[52vh] w-full ${fitClass(focus)}`}
          />
          <figcaption className="border-t border-iron/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <ClassificationChip asset={focus} />
              <span className="mono text-[9px] tracking-[0.12em] text-slate">NASA IMAGE AND VIDEO LIBRARY</span>
            </div>
            <div className="mono mt-1.5 text-[13px] leading-snug tracking-[0.05em] text-bone">{focus.title}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ash">{focus.caption}</p>
            <Provenance asset={focus} />
          </figcaption>
        </figure>
      )}

      {/* GALLERY */}
      {others.length > 0 && (
        <section aria-label="Mission gallery">
          <div className="label mb-2">GALLERY · SELECT AN IMAGE TO FEATURE</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {others.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  sfx.select();
                  setFocusId(a.id);
                }}
                className="group border border-iron/40 bg-ink-1/40 text-left transition-colors hover:border-amber/70 focus-visible:border-amber"
                aria-label={`Show ${a.title} in the main viewer`}
                aria-pressed={focus?.id === a.id}
              >
                <Still asset={a} sizes="(max-width: 640px) 100vw, 50vw" className={`aspect-[3/2] w-full ${fitClass(a)}`} />
                <div className="border-t border-iron/30 px-3 py-2">
                  <div className="mono text-[10.5px] leading-snug tracking-[0.05em] text-bone group-hover:text-amber">
                    {a.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ClassificationChip asset={a} />
                    <span className="mono text-[8.5px] tracking-[0.1em] text-slate">{a.credit}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* VIDEO */}
      {video && (
        <section aria-label="Mission video">
          <div className="label mb-2">MISSION VIDEO</div>
          <VideoBlock asset={video} />
        </section>
      )}

      {/* PROVENANCE */}
      <section aria-label="Media provenance" className="border border-iron/40 bg-ink-1/30">
        <div className="border-b border-iron/30 px-4 py-2">
          <div className="label">PROVENANCE · EVERY ASSET IN THIS COLLECTION</div>
        </div>
        <ul className="px-4 py-2">
          {collection.assets
            .filter((a) => a.role !== "journey")
            .map((a) => (
              <li key={`${a.role}-${a.id}`} className="border-t border-iron/20 py-2 first:border-t-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="mono text-[11px] leading-snug tracking-[0.04em] text-bone">{a.title}</span>
                  <ClassificationChip asset={a} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="mono text-[9px] tracking-[0.1em] text-slate">{a.credit}</span>
                  {a.sourcePage && (
                    <a
                      href={a.sourcePage}
                      target="_blank"
                      rel="noreferrer"
                      className="mono text-[9px] tracking-[0.1em] text-cyan/80 underline decoration-cyan/30 underline-offset-2 hover:text-cyan"
                    >
                      SOURCE ↗
                    </a>
                  )}
                  <span className="mono text-[9px] tracking-[0.1em] text-slate/70">ACCESSED {a.accessed}</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-slate">{a.restrictions}</p>
              </li>
            ))}
        </ul>
        <div className="border-t border-iron/30 px-4 py-2.5">
          <p className="text-[10.5px] leading-relaxed text-slate">{NASA_USAGE_NOTE}</p>
        </div>
      </section>
    </div>
  );
}
