import type { MissionJourney, MissionChapter, CaseFile, HologramStep } from "./types";
import { OPPORTUNITY_JOURNEY, OPPORTUNITY_CASE_FILES } from "@/data/opportunity-journey";

// Convert the existing Opportunity journey (old format) to the universal MissionJourney format
const chapters: MissionChapter[] = OPPORTUNITY_JOURNEY.map((ch: any) => ({
  id: ch.id,
  sequence: ch.sequence,
  act: ch.act,
  title: ch.title,
  date: ch.date,
  dateUtc: ch.dateUtc,
  sol: ch.sol,
  location: ch.location,
  eventType: ch.eventType,
  narrative: ch.narrative,
  whyHappened: ch.whyHappened,
  instruments: ch.instruments,
  hardware: ch.hardware,
  discovery: ch.discovery,
  scientificSignificance: ch.scientificSignificance,
  engineeringSignificance: ch.engineeringSignificance,
  futureMissions: ch.futureMissions,
  media: ch.media,
  caseFileId: ch.caseFileId,
  cameraBehavior: ch.cameraBehavior,
  hologramSequence: ch.hologramSequence as HologramStep[],
}));

const caseFiles: CaseFile[] = OPPORTUNITY_CASE_FILES.map((cf: any) => ({
  id: cf.id,
  title: cf.title,
  recordName: cf.recordName,
  directObservation: cf.directObservation,
  measurement: cf.measurement,
  evidence: cf.evidence,
  interpretation: cf.interpretation,
  uncertainty: cf.uncertainty,
  significance: cf.significance,
  media: cf.media,
  sourceIds: cf.sourceIds,
}));

export const opportunityJourney: MissionJourney = {
  deviceId: "opportunity",
  title: "OPPORTUNITY JOURNEY",
  subtitle: "MER-B · Mars Exploration Rover",
  missionName: "Mars Exploration Rover",
  missionType: "rover",
  introduction: "Opportunity was a Mars Exploration Rover that landed in Meridiani Planum and operated for nearly 15 years, traveling over 45 km and making groundbreaking discoveries about ancient water on Mars.",
  missionObjective: "Determine whether Mars once had liquid water and environments that could have supported life.",
  chapters,
  caseFiles,
  mediaIds: [],
  sourceIds: ["nasa-mer", "nasa-opp-end"],
  finalStatus: "MISSION COMPLETE",
  finalDistance: "45.16 km",
  finalDuration: "5,111 sols (~14 years, 46 days)",
  legacyStatement: "Opportunity remains on Mars in Perseverance Valley. Its observations demonstrated ancient water-related environments and geological conditions that helped scientists evaluate the planet's past habitability.",
  limitedHistory: false,
};

export default opportunityJourney;
