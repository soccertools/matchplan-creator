import { Match } from "scraperlib";
import { AgeClass } from "./age-class";

export interface MatchMetadata {
  weekDay: number;
  weekNumber: number;
  match: Match;
  ageClass: AgeClass;
}
