import { useState } from "react";
import { setAudioEnabled, setVolume, unlockAudio } from "@/lib/audio";
import { sfx } from "@/lib/audio";

export function AudioSettings() {
  const [open, setOpen] = useState(false);
  const [master, setMaster] = useState(1);
  const [env, setEnv] = useState(0.3);
  const [mech, setMech] = useState(0.4);
  const [comm, setComm] = useState(0.6);
  const [ui, setUi] = useState(0.25);
  const [enabled, setEnabled] = useState(true);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setAudioEnabled(next);
    if (next) unlockAudio();
    sfx.select();
  };

  const handleVolume = (channel: "master" | "env" | "mech" | "comm" | "ui", value: number) => {
    setVolume(channel, value);
    switch (channel) {
      case "master": setMaster(value); break;
      case "env": setEnv(value); break;
      case "mech": setMech(value); break;
      case "comm": setComm(value); break;
      case "ui": setUi(value); break;
    }
  };

  if (!open) {
    return (
      <button className="ctl text-[9px] px-2 py-1" onClick={() => { unlockAudio(); setOpen(true); sfx.open(); }} aria-label="Audio settings" style={{ minHeight: "22px" }}>
        🔊 AUDIO
      </button>
    );
  }

  return (
    <div className="pointer-events-auto bg-ink-1/90 border border-iron/60 rounded px-3 py-2 backdrop-blur-sm w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="mono text-[10px] tracking-[0.12em] text-bone">AUDIO</span>
        <button className="ctl text-[9px] px-2 py-1" onClick={() => { setOpen(false); sfx.close(); }} aria-label="Close audio settings" style={{ minHeight: "20px" }}>✕</button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="mono text-[9px] text-slate">MASTER</span>
          <button className="ctl text-[9px] px-2 py-1" onClick={toggle} aria-label={enabled ? "Mute" : "Unmute"} style={{ minHeight: "20px" }}>
            {enabled ? "ON" : "OFF"}
          </button>
        </div>
        {[
          { label: "MASTER", value: master, channel: "master" as const },
          { label: "ENV", value: env, channel: "env" as const },
          { label: "MECH", value: mech, channel: "mech" as const },
          { label: "COMM", value: comm, channel: "comm" as const },
          { label: "UI", value: ui, channel: "ui" as const },
        ].map(({ label, value, channel }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="mono text-[8px] text-slate w-[40px]">{label}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={value}
              onChange={(e) => handleVolume(channel, parseFloat(e.target.value))}
              className="flex-1 h-1 accent-amber"
            />
          </div>
        ))}
      </div>
      <div className="mt-2 text-[8px] text-slate mono">
        NO MUSIC · SOUND EFFECTS ONLY
      </div>
    </div>
  );
}
