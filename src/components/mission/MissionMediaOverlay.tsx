import { useEcho, closeMissionMedia } from "@/state/store";
import { artifactById } from "@/data/artifacts";
import { mediaForDevice } from "@/data/media-manifest";
import { MissionMedia } from "./MissionMedia";
import { sfx } from "@/lib/audio";

/**
 * MISSION MEDIA overlay.
 *
 * A full-screen reading surface over the 3D world: the mission's editorial
 * gallery, its video and the full provenance for every asset. Opened from the
 * mission panel or from the mission journey; closing it returns the user
 * exactly where they were.
 */
export function MissionMediaOverlay() {
  const deviceId = useEcho((s) => s.mediaDeviceId);
  const art = deviceId ? artifactById(deviceId) : undefined;
  const collection = deviceId ? mediaForDevice(deviceId) : null;
  if (!deviceId || !collection) return null;

  const close = () => {
    sfx.close();
    closeMissionMedia();
    useEcho.setState({ overlay: null });
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex flex-col bg-ink-0/92 backdrop-blur-sm"
      role="dialog"
      aria-label={`${collection.label} mission media`}
    >
      {/* Header */}
      <div className="flex flex-none items-center justify-between gap-4 border-b border-iron/40 bg-ink-1/80 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <div className="label">MISSION MEDIA · {collection.label.toUpperCase()}</div>
          <h2 className="mono mt-0.5 truncate text-[13px] tracking-[0.1em] text-bone">
            {art ? `${art.designation} · ${art.name}` : collection.label}
          </h2>
        </div>
        <button className="ctl flex-none px-3 py-1.5" onClick={close} aria-label="Close mission media">
          ✕ CLOSE MEDIA
        </button>
      </div>

      {/* Content */}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <MissionMedia deviceId={deviceId} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none border-t border-iron/40 bg-ink-1/80 px-4 py-2 md:px-6">
        <p className="mono text-[8.5px] leading-relaxed tracking-[0.08em] text-slate">
          ALL ASSETS STORED LOCALLY · SOURCED FROM THE NASA IMAGE AND VIDEO LIBRARY · ECHOES IS AN INDEPENDENT PROJECT, NOT AN
          OFFICIAL NASA PRODUCT
        </p>
      </div>
    </div>
  );
}
