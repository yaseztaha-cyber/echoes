export type Destination = "moon" | "mars" | "deep-space";
export type ArtifactType = "rover" | "lander" | "instrument" | "experiment" | "probe" | "equipment";
export type ArtifactStatus =
  | "ACTIVE"
  | "EXTENDED"
  | "PARTIALLY OPERATIONAL"
  | "NO LONGER COMMUNICATING"
  | "MISSION COMPLETE"
  | "INACTIVE HARDWARE";
export type Accuracy = "official" | "reconstructed" | "visualization";
export type ModelKind = "mer" | "sojourner" | "insight" | "apollo" | "voyager";

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  kind: "NASA" | "PEER-REVIEWED" | "ARCHIVE";
  url: string;
  supports: string;
}

export interface SourceReference {
  sourceId: string;
  claim: string;
}

export interface MediaAsset {
  id: string;
  type: "image" | "model" | "terrain" | "diagram";
  title: string;
  source: string;
  url: string;
  credit: string;
  licenseNote?: string;
  artifactId?: string;
  accuracy?: Accuracy;
  caption?: string;
  recordUrl?: string;
  /** Mars sol of the observation, when documented. */
  sol?: number;
  /** Hardware id that recorded it, when known. */
  instrumentId?: string;
  /** e.g. FALSE COLOR COMPOSITE, ANNOTATED, TRUE-COLOR APPROXIMATION. */
  imageType?: string;
}

export interface ModelAsset {
  kind: ModelKind;
  title: string;
  source: string;
  modelType: "OFFICIAL" | "RECONSTRUCTED" | "VISUALIZATION";
  accuracy: string;
  note: string;
}

export interface LocationRecord {
  world: Destination;
  site: string;
  region: string;
  lat: number;
  lon: number; // degrees east
  landmark?: string;
}

export interface MissionDates {
  launch: number;
  landing?: number;
  end?: number;
  endLabel: string;
}

export interface Decode {
  full: string;
  what: string;
  measures: string;
  why: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  full: string;
  purpose: string;
  capability: string;
  how: string;
  pos: [number, number, number];
  view: [number, number, number];
  dist: number;
  decode?: Decode;
  enables?: string;
}

export interface Observation {
  id: string;
  label: string;
  detail: string;
  mediaId?: string;
}
export interface Evidence {
  id: string;
  label: string;
  detail: string;
  sourceId: string;
}

/** One clickable link in an instrument → measurement → evidence chain. */
export interface TraceStep {
  kind: "image" | "target" | "action" | "measurement" | "observation" | "evidence" | "interpretation";
  title: string;
  detail: string;
  mediaId?: string;
  sourceId?: string;
}

export interface ScienceQuestion {
  id: string;
  question: string;
  recordName: string;
  instrumentIds: string[];
  measurement: { simple: string; technical: string };
  observations: Observation[];
  evidence: [Evidence, ...Evidence[]];
  interpretation: string;
  layers: { explore: string; understand: string; technical: string };
  sources: [SourceReference, ...SourceReference[]];
  /** Clickable instrument → image → data → evidence chain, when documented. */
  trace?: TraceStep[];
}

export interface TimelineEvent {
  id: string;
  t: number;
  title: string;
  detail: string;
  kind: "launch" | "landing" | "drive" | "science" | "incident" | "end" | "flyby" | "eva";
  waypointId?: string;
  sourceId: string;
}

export interface Waypoint {
  id: string;
  name: string;
  x: number; // metres east of landing point (approximate)
  z: number; // metres south of landing point (approximate)
  t: number;
}

export interface MissionPath {
  waypoints: Waypoint[];
  note: string;
}

export interface LegacyRecord {
  physical: string;
  data: string;
  legacy: string[];
}

/**
 * A dated distance milestone that a spacecraft actually reached. Kept as its
 * own record (rather than only a timeline row) so the UI can explain the
 * milestone without inventing live telemetry.
 */
export interface DistanceMilestone {
  /** UTC ms at which the milestone was reached. */
  date: number;
  /** Human-readable date/time, already normalised to UTC. */
  dateLabel: string;
  distanceKm: number;
  distanceMi: number;
  /** One-way light travel time in hours. */
  oneWayHours: number;
  /** Dated operational status at the moment of the milestone. */
  status: string;
  sourceIds: string[];
}

export interface Artifact {
  id: string;
  name: string;
  designation: string;
  summary: string;
  destination: Destination;
  type: ArtifactType;
  missionId: string;
  missionName: string;
  model: ModelAsset;
  location: LocationRecord;
  status: ArtifactStatus;
  dates: MissionDates;
  clock: { rate: number; range: [number, number]; kind: "sol" | "date" };
  hardware: HardwareComponent[];
  scientificQuestions: ScienceQuestion[];
  timeline: TimelineEvent[];
  missionPath?: MissionPath;
  legacy: LegacyRecord;
  sources: SourceReference[];
  media: MediaAsset[];
  sun: { el: number; az: number };
  terrainSeed: number;
  /** A dated distance milestone, when one has been officially confirmed. */
  distanceMilestone?: DistanceMilestone;
}
