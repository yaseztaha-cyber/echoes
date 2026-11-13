/**
 * MISSION FILM PLAYER
 *
 * A real HTML5 <video> element with ECHOES-styled controls. The file itself is
 * streamed by the browser (native range requests) — it is never preloaded into
 * memory and never inlined into the bundle.
 *
 * Rules this component keeps:
 *  - playback NEVER autoplays: the film starts on the user's explicit click,
 *    so the original audio is never played unbidden;
 *  - the film's own audio is preserved (no music, no added sound effects);
 *  - on close the decoder is released (pause + drop the source + load());
 *  - every control is a real control, reachable by keyboard and touch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { MissionFilm } from "@/data/missionFilms";
import { setAudioEnabled } from "@/lib/audio";
import { useEcho } from "@/state/store";

/** Real play glyph (SVG triangle) — never an emoji. */
export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M2.5 1.2 10.4 6 2.5 10.8Z" />
    </svg>
  );
}

export function PauseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="2.2" y="1.4" width="2.8" height="9.2" />
      <rect x="7" y="1.4" width="2.8" height="9.2" />
    </svg>
  );
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

type Status = "idle" | "buffering" | "playing" | "paused" | "ended" | "error";

export function MissionFilmPlayer({ film, onClose }: { film: MissionFilm; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ---------------------------------------------------------- element wiring */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setStatus("paused");
    };
    const onTime = () => {
      setTime(v.currentTime);
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => setStatus("playing");
    const onPause = () => setStatus((s) => (s === "ended" ? s : "paused"));
    const onWait = () => setStatus("buffering");
    const onCanPlay = () => setStatus((s) => (s === "buffering" ? "paused" : s));
    const onEnd = () => setStatus("ended");
    const onErr = () => {
      setStatus("error");
      setErrorMsg(v.error?.message || "The film could not be played.");
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("progress", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onErr);
    };
  }, []);

  /* ---------------------------------------------------------- the source */
  /**
   * The source is assigned imperatively, not as a JSX attribute: the release
   * step below removes the attribute, and React would not put it back (the
   * prop never changed) — which left the element with no file at all under
   * StrictMode's double mount.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = film.src;
    v.load();
    return () => {
      v.pause();
      v.removeAttribute("src");
      v.load(); // stops the network activity and frees the buffered data
    };
  }, [film.src]);

  /* ---------------------------------------------------------- release on close */
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (!v) return;
      v.pause();
    };
  }, []);

  /* ---------------------------------------------------------- the film's own audio */
  /**
   * The documentary carries its own audio (the NASA/JPL launch tape) and is
   * silent everywhere else — that is the film's own policy, and the frames say
   * so. ECHOES' ambient bed must therefore not play underneath it: the film
   * is heard exactly as it was authored. The user's audio preference is
   * restored when the film closes.
   */
  useEffect(() => {
    setAudioEnabled(false);
    return () => setAudioEnabled(useEcho.getState().audioOn);
  }, []);

  /* ---------------------------------------------------------- actions */
  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setStarted(true);
      void v.play().catch(() => setErrorMsg("Playback was blocked by the browser."));
    } else {
      v.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0);
    setTime(v.currentTime);
  }, []);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, t), v.duration || 0);
    setTime(v.currentTime);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  /* ---------------------------------------------------------- keyboard */
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); e.stopPropagation(); toggle(); return; }
    if (k === "arrowleft") { e.preventDefault(); e.stopPropagation(); seekBy(-5); return; }
    if (k === "arrowright") { e.preventDefault(); e.stopPropagation(); seekBy(5); return; }
    if (k === "j") { e.preventDefault(); e.stopPropagation(); seekBy(-10); return; }
    if (k === "l") { e.preventDefault(); e.stopPropagation(); seekBy(10); return; }
    if (k === "m") { e.preventDefault(); e.stopPropagation(); toggleMute(); return; }
    if (k === "f") { e.preventDefault(); e.stopPropagation(); toggleFullscreen(); return; }
    if (k === "escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
  };

  const pct = duration > 0 ? Math.min(1, time / duration) : 0;
  const bufPct = duration > 0 ? Math.min(1, buffered / duration) : 0;
  const playing = status === "playing";

  return (
    <div
      ref={wrapRef}
      className="w-full border border-[#1d2429] bg-ink-1/95"
      onKeyDown={onKey}
      tabIndex={-1}
      role="region"
      aria-label={`Mission film: ${film.title}`}
      data-film="merb"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#1d2429] px-4 py-3">
        <div className="min-w-0">
          <h3 className="mono text-[12px] tracking-[0.18em] text-bone">{film.title}</h3>
          <p className="label mt-1 normal-case tracking-[0.1em]">{film.subtitle}</p>
        </div>
        <button className="ctl flex-none" onClick={onClose} aria-label="Close mission film">
          ✕ CLOSE FILM
        </button>
      </div>

      {/* stage */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          poster={film.poster}
          preload="metadata"
          playsInline
          className="block max-h-[62vh] w-full bg-black object-contain"
          onClick={toggle}
          aria-label={film.title}
        />
        {!started && status !== "error" && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-ink-0/25"
            onClick={toggle}
            aria-label={`Play ${film.title}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-amber/70 bg-ink-0/70 text-amber">
              <PlayIcon className="ml-1 h-6 w-6" />
            </span>
          </button>
        )}
        {status === "buffering" && (
          <div className="pointer-events-none absolute inset-x-0 top-3 text-center">
            <span className="mono text-[10px] tracking-[0.2em] text-amber/90">BUFFERING…</span>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-0/85 px-6 text-center">
            <div>
              <div className="mono text-[11px] tracking-[0.18em] text-crit">FILM UNAVAILABLE</div>
              <p className="label mt-2 normal-case tracking-[0.1em]">{errorMsg}</p>
              <p className="label mt-1 normal-case tracking-[0.1em]">
                The mission experience below is unaffected — close the film to continue.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#1d2429] px-4 py-2.5">
        <button
          className="ctl flex-none px-3 py-1.5"
          onClick={toggle}
          aria-label={playing ? "Pause film" : "Play film"}
        >
          <span className="flex items-center gap-2">
            {playing ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
            {playing ? "PAUSE" : "PLAY"}
          </span>
        </button>
        <button className="ctl flex-none px-2 py-1.5" onClick={() => seekBy(-10)} aria-label="Seek back 10 seconds">
          −10s
        </button>
        <button className="ctl flex-none px-2 py-1.5" onClick={() => seekBy(10)} aria-label="Seek forward 10 seconds">
          +10s
        </button>

        <div className="relative min-w-[140px] flex-1">
          <div className="h-1 w-full bg-iron/40" aria-hidden="true">
            <div className="h-1 bg-iron/70" style={{ width: `${bufPct * 100}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.1}
            value={time}
            onChange={(e) => seekTo(Number(e.target.value))}
            aria-label="Seek"
            aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
            className="absolute inset-[-6px_0] h-4 w-full cursor-pointer appearance-none bg-transparent accent-[#d0a45b]"
            style={{ accentColor: "#d0a45b" }}
          />
          <div
            className="pointer-events-none absolute left-0 top-0 h-1 bg-amber"
            style={{ width: `${pct * 100}%` }}
            aria-hidden="true"
          />
        </div>

        <span className="mono flex-none text-[11px] tabular-nums text-ash">
          {fmt(time)} / {fmt(duration)}
        </span>

        <div className="flex flex-none items-center gap-2">
          <button className="ctl px-2 py-1.5" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? "MUTED" : "AUDIO"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer appearance-none bg-iron/50"
            style={{ accentColor: "#d0a45b" }}
          />
        </div>

        <button className="ctl flex-none px-2 py-1.5" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          FULLSCREEN
        </button>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2">
        <span className="label normal-case tracking-[0.08em]">
          {status === "ended"
            ? "END OF FILM"
            : status === "error"
              ? "PLAYBACK ERROR"
              : `${status.toUpperCase()} · SPACE PLAY/PAUSE · ←/→ SEEK · M MUTE · F FULLSCREEN · ESC CLOSE`}
        </span>
        <span className="label normal-case tracking-[0.08em] text-slate">{film.credit}</span>
      </div>
    </div>
  );
}
