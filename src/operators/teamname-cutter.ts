import { Abbreviation } from "../definitions/abbreviation";

export function teamnameCutter(teamname: string, defaultReplacements: Abbreviation[]) {
  // simple string replacements
  defaultReplacements.forEach(
    (replacement) => {
      teamname = teamname.replace(replacement.name, replacement.abbrevation);
    }
  );

  // shorten long words
  const teamnameParts = teamname.split(' ').map(
    (word) => {
      // already short
      if (word.length <= 4) {
        return word;
      }

      // already abbrevated
      if (word.endsWith('.') && word.length < 8) {
        return word;
      }

      // shorten long word
      return word.substr(0, 3) + ".";
    }
  ).filter(
    // filter roman numerals e.g. I, II, III
    (word) => word.search(/^[I]+/) === -1
  );

  return teamnameParts.join(' ');
}
