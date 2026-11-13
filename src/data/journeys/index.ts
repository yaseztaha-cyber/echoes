import type { MissionJourney } from "./types";
import { opportunityJourney } from "./opportunity";
import { spiritJourney } from "./spirit";
import { sojournerJourney } from "./sojourner";
import { insightJourney } from "./insight";
import { apolloJourneys } from "./apollo";
import { voyagerJourney } from "./voyager";

export type { MissionJourney, MissionChapter, CaseFile, HologramStep } from "./types";
export * from "./types";

export const JOURNEY_REGISTRY: Record<string, MissionJourney> = {
  opportunity: opportunityJourney,
  spirit: spiritJourney,
  sojourner: sojournerJourney,
  insight: insightJourney,
  "apollo-12": apolloJourneys["apollo-12"],
  "apollo-14": apolloJourneys["apollo-14"],
  "apollo-15": apolloJourneys["apollo-15"],
  "apollo-16": apolloJourneys["apollo-16"],
  "apollo-17": apolloJourneys["apollo-17"],
  voyager1: voyagerJourney,
};

export function getJourney(deviceId: string): MissionJourney | undefined {
  return JOURNEY_REGISTRY[deviceId];
}

export function hasJourney(deviceId: string): boolean {
  return deviceId in JOURNEY_REGISTRY;
}

export function allJourneyDeviceIds(): string[] {
  return Object.keys(JOURNEY_REGISTRY);
}

export function journeyCount(): number {
  return Object.keys(JOURNEY_REGISTRY).length;
}
