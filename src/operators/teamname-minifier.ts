import { teamnameShortener } from "scraperlib";
import { Abbreviation } from "../definitions/abbreviation";
import { teamnameCutter } from "./teamname-cutter";

function preferFirstNamePart(name: string, separator: string) {
  return name.split(separator).slice(0, 1).join('');
}

export function teamnameMinifier(teamname: string, termBlacklist: string[], defaultReplacements: Abbreviation[]) {
  // use shortener first
  let shortName = teamnameShortener(teamname, termBlacklist);

    // simple string replacements
  defaultReplacements.forEach(
    (replacement) => {
      shortName = shortName.replace(replacement.name, replacement.abbreviation);
    }
  );

  const teamnameParts = shortName.split(' ');

  const teamnamePartsModified = teamnameParts.filter(
    (item) => item.length > 3 && termBlacklist.indexOf(item) === -1
  );

  // If all parts do not meet our requirements
  if (teamnamePartsModified.length === 0) {
    return teamnameCutter(shortName, defaultReplacements);
  }

  let lastPart = teamnamePartsModified[teamnamePartsModified.length - 1];

  // Minifiy names consisting of multiple parts separated by / oder -
  lastPart = preferFirstNamePart(lastPart, '/');
  lastPart = preferFirstNamePart(lastPart, '-');

  if (lastPart.length > 12) {
    lastPart = lastPart.substr(0, 11) + ".";
  }

  return lastPart;
}
