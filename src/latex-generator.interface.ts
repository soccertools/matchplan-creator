import { Match } from "scraperlib";
import { MatchplanContext } from "./definitions/matchplan-context";

export interface LatexGenerator {
  generate(matches: Match[], context: MatchplanContext): string;
}
