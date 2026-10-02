import type { Artifact } from "@/types";
import { opportunity } from "./opportunity";
import { spirit, sojourner, insight } from "./mars-others";
import { apollo12, apollo14, apollo15, apollo16, apollo17 } from "./apollo";
import { voyager1 } from "./voyager";

export const ARTIFACTS: Artifact[] = [opportunity, spirit, sojourner, insight, apollo12, apollo14, apollo15, apollo16, apollo17, voyager1];

export const artifactById = (id: string | null | undefined) => ARTIFACTS.find((a) => a.id === id);
export const artifactsFor = (dest: "moon" | "mars" | "deep-space") => ARTIFACTS.filter((a) => a.destination === dest);
export const ALL_QUESTIONS = ARTIFACTS.flatMap((a) => a.scientificQuestions.map((q) => ({ artifactId: a.id, q })));
export const FLAGSHIP = "opportunity";
