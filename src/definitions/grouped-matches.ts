import { Match } from "scraperlib";

export interface GroupedMatches {
  [id: string]: Match[];
}
