import { useState } from "react";
import { videoForDevice } from "@/data/media-manifest";
import { assetUrl } from "@/lib/asset";
import { sfx } from "@/lib/audio";

/**
 * Real mission video player.
 *
 * The archival clip is the content: a native <video> element with the local
 * file, poster, caption and provenance. The interactive documentary is a
 * separate action — it is never mounted inside this player.
 */
export function MissionVideoPlayer({
  deviceId,
  label,
  onOpenDocumentary,
  onClose,
}: {
  deviceId: string;
  label: string;
  onOpenDocumentary?: () => void;
  onClose: () => void;
}) {
  const video = videoForDevice(deviceId);
  const [failed, setFailed] = useState(false);
  const external = video?.kind === "external-video";
  const playable = !!video && !external && !!video.file && !failed;

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] min-h-[440px] w-full max-w-[1500px] flex-col border border-[#1d2429] bg-black">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[#1d2429] bg-ink-1/95 px-4 py-2">
        <div className="min-w-0">
          <div className="label">MISSION VIDEO · {label.toUpperCase()}</div>
          <div className="mono truncate text-[11px] tracking-[0.06em] text-bone">
            {video?.title ?? "No stored clip for this mission"}
          </div>
        </div>
        <button className="ctl flex-none" onClick={() => { sfx.close(); onClose(); }} aria-label="Close mission video">
          ✕ CLOSE
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-black">
        {playable ? (
          <video
            key={video.file}
            className="h-full w-full bg-black object-contain"
            controls
            playsInline
            preload="metadata"
            poster={video.poster ? assetUrl(video.poster) : undefined}
            aria-label={video.title}
            onError={() => setFailed(true)}
          >
            <source src={assetUrl(video.file!)} type="video/webm" />
            <p className="p-6 text-[12px] text-ash">
              This browser cannot play the mission clip.{" "}
              <a href={assetUrl(video.file!)} className="text-amber underline">Open the file</a>.
            </p>
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="mono text-[11px] tracking-[0.14em] text-amber">
              {external ? "NO STORED CLIP · OFFICIAL SOURCE LINKED" : "VIDEO UNAVAILABLE · SOURCE · NASA"}
            </div>
            {video?.caption && <p className="max-w-xl text-[13px] leading-relaxed text-ash">{video.caption}</p>}
            {external && video.url && (
              <a href={video.url} target="_blank" rel="noreferrer" className="ctl ctl-primary">
                OPEN OFFICIAL NASA MEDIA ↗
              </a>
            )}
            {external && video.sourcePage && (
              <a href={video.sourcePage} target="_blank" rel="noreferrer" className="mono text-[10px] tracking-[0.1em] text-cyan underline">
                SOURCE PAGE ↗
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-[#1d2429] bg-ink-1/95 px-4 py-2">
        <div className="min-w-0 flex-1">
          {video?.caption && <p className="text-[11.5px] leading-snug text-ash">{video.caption}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {video?.credit && <span className="mono text-[9px] tracking-[0.1em] text-slate">{video.credit}</span>}
            {video?.sourcePage && (
              <a
                href={video.sourcePage}
                target="_blank"
                rel="noreferrer"
                className="mono text-[9px] tracking-[0.1em] text-cyan/80 underline decoration-cyan/30 underline-offset-2 hover:text-cyan"
              >
                SOURCE ↗
              </a>
            )}
            {video?.accessed && <span className="mono text-[9px] tracking-[0.1em] text-slate/70">ACCESSED {video.accessed}</span>}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          {onOpenDocumentary && (
            <button className="ctl text-amber" onClick={() => { sfx.confirm(); onOpenDocumentary(); }}>
              OPEN INTERACTIVE DOCUMENTARY
            </button>
          )}
          <button className="ctl" onClick={() => { sfx.close(); onClose(); }}>✕ CLOSE VIDEO</button>
        </div>
      </div>
    </div>
  );
}
