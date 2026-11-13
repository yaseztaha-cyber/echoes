/** Universal mission journey types for ECHOES. */

export interface HologramStep {
  kind: "title" | "video" | "animation" | "image" | "action" | "diagram" | "map" | "chart" | "text";
  title: string;
  detail: string;
}

export interface MissionChapter {
  id: string;
  sequence: number;
  act: string;
  title: string;
  date: string;
  dateUtc: number;
  sol: number | null;
  location: string;
  eventType: string;
  narrative: string;
  whyHappened: string;
  instruments: string[];
  hardware: string[];
  discovery: string | null;
  scientificSignificance: string;
  engineeringSignificance: string;
  futureMissions: string;
  media: string[];
  caseFileId: string | null;
  cameraBehavior: string;
  hologramSequence: HologramStep[];
}

export interface CaseFile {
  id: string;
  title: string;
  recordName: string;
  directObservation: string;
  measurement: string;
  evidence: string;
  interpretation: string;
  uncertainty: string;
  significance: string;
  media: string[];
  sourceIds: string[];
}

export interface MissionJourney {
  deviceId: string;
  title: string;
  subtitle: string;
  missionName: string;
  missionType: string;
  introduction: string;
  missionObjective: string;
  chapters: MissionChapter[];
  caseFiles: CaseFile[];
  mediaIds: string[];
  sourceIds: string[];
  finalStatus: string;
  finalDistance?: string;
  finalDuration?: string;
  legacyStatement: string;
  limitedHistory?: boolean;
}

export interface JourneyRegistry {
  [deviceId: string]: MissionJourney;
}
