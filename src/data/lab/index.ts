/** Mission Lab scenario parameters. EDUCATIONAL SIMULATION — not a record of NASA decisions. */
export interface LabAction {
  id: string;
  label: string;
  blurb: string;
  powerCost: number; // percent
  scienceGain: number; // 0-100 points
  distanceKm: number;
  risk: number; // added risk points
}

export const LAB_SCENARIO = {
  title: "A DECISION ON THE PLAINS",
  intro: "A solar-powered rover has finished a measurement session. Dust has reduced the power available. A high-priority science target lies ahead, and the terrain between is soft sand. Choose how to spend today's energy.",
  start: { power: 63, travelKm: 1.4, target: "HIGH", risk: 28 },
  actions: [
    { id: "drive", label: "DRIVE TO TARGET", blurb: "Cross 1.4 km of terrain to reach the high-value rock.", powerCost: 38, scienceGain: 70, distanceKm: 1.4, risk: 34 },
    { id: "analyze", label: "ANALYZE CURRENT LOCATION", blurb: "Stay put and use contact instruments on nearby rocks.", powerCost: 18, scienceGain: 40, distanceKm: 0, risk: 6 },
    { id: "conserve", label: "CONSERVE POWER", blurb: "Hold position and recharge; no new science today.", powerCost: -12, scienceGain: 0, distanceKm: 0, risk: -10 },
  ] as LabAction[],
  tradeoffs: [
    "More driving can reach better science, but uses more energy and carries more risk of getting stuck.",
    "Measuring where you are is cheap and safe, but may be less valuable than the target.",
    "Waiting protects the rover, but science time is limited. Real operations teams weigh all three every day.",
  ],
};
