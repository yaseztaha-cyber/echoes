export const SOL_MS = 88775244;
export const DAY_MS = 86400000;
export const YEAR_MS = 365.25 * DAY_MS;
export const J2000 = Date.UTC(2000, 0, 1, 12);

export const solOf = (t: number, landing: number) => Math.floor((t - landing) / SOL_MS);
export const solToT = (sol: number, landing: number) => landing + sol * SOL_MS;

export const fmtUTC = (t: number) => new Date(t).toISOString().replace("T", " ").slice(0, 16) + " UTC";
export const fmtDate = (t: number) => new Date(t).toISOString().slice(0, 10);
export const fmtYear = (t: number) => new Date(t).getUTCFullYear();

export function fmtRate(ms: number) {
  const s = ms;
  if (s >= SOL_MS * 0.9 && s < DAY_MS * 3 && Math.abs(s / SOL_MS - Math.round(s / SOL_MS * 2) / 2) < 0.01) {
    return `${+(s / SOL_MS).toFixed(1)} SOL`;
  }
  if (s < 60000) return `${(s / 1000).toFixed(0)} S`;
  if (s < 3600000) return `${(s / 60000).toFixed(0)} MIN`;
  if (s < DAY_MS) return `${(s / 3600000).toFixed(1)} H`;
  if (s < 365 * DAY_MS) return `${(s / DAY_MS).toFixed(1)} D`;
  return `${(s / YEAR_MS).toFixed(1)} YR`;
}
