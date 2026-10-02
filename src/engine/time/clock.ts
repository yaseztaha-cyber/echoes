import { useEcho, type SimMode } from "@/state/store";

/**
 * The single ECHOES time engine. Every module (planet positions, rover location,
 * mission path, event markers, UI) reads from this clock. The store mirrors it
 * at ~10 Hz for the interface only.
 */
export const SPEEDS = [1, 10, 100, 1000, 10000];

export const clock = {
  t: Date.now(),
  mode: "solar-system" as SimMode,
  rate: 3600000, // simulated ms per real second at 1x
  speedIdx: 1,
  dir: 1,
  playing: true,
  range: null as [number, number] | null,
  acc: 0,
};

export function publish() {
  useEcho.setState({
    sim: {
      mode: clock.mode,
      t: clock.t,
      speed: SPEEDS[clock.speedIdx],
      dir: clock.dir,
      playing: clock.playing,
      rate: clock.rate,
    },
  });
}

export function tick(dt: number) {
  if (clock.playing) {
    clock.t += dt * clock.rate * SPEEDS[clock.speedIdx] * clock.dir;
    if (clock.range) {
      if (clock.t >= clock.range[1]) {
        clock.t = clock.range[1];
        clock.playing = false;
        publish();
      } else if (clock.t <= clock.range[0]) {
        clock.t = clock.range[0];
        clock.playing = false;
        publish();
      }
    }
  }
  clock.acc += dt;
  if (clock.acc > 0.1) {
    clock.acc = 0;
    publish();
  }
}

export function configureClock(opts: Partial<Pick<typeof clock, "mode" | "rate" | "range" | "t" | "speedIdx" | "playing" | "dir">>) {
  Object.assign(clock, opts);
  publish();
}

export function setT(t: number) {
  if (clock.range) t = Math.min(clock.range[1], Math.max(clock.range[0], t));
  clock.t = t;
  publish();
}

export const togglePlay = () => {
  if (clock.range && !clock.playing) {
    if (clock.dir > 0 && clock.t >= clock.range[1] - 1) clock.t = clock.range[0];
    if (clock.dir < 0 && clock.t <= clock.range[0] + 1) clock.t = clock.range[1];
  }
  clock.playing = !clock.playing;
  publish();
};
export const faster = () => {
  clock.speedIdx = Math.min(SPEEDS.length - 1, clock.speedIdx + 1);
  publish();
};
export const slower = () => {
  clock.speedIdx = Math.max(0, clock.speedIdx - 1);
  publish();
};
export const setDir = (d: number) => {
  clock.dir = d;
  clock.playing = true;
  publish();
};
