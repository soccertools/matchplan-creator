import "jasmine";
import { teamnameCutter } from "./teamname-cutter";

describe('MatchplanUtilites', () => {
  it('should cut basic teamnames', () => {
    const teamname = "Musterhausen";
    const expectedAbbreviation = "Mus.";

    expect(teamnameCutter(teamname, [])).toBe(expectedAbbreviation);
  });

  it('should not cut very short names', () => {
    const teamname = "Must";
    const expectedAbbreviation = "Must";

    expect(teamnameCutter(teamname, [])).toBe(expectedAbbreviation);
  });

  it('should not cut short abbrevated names', () => {
    const teamname = "Muster.";
    const expectedAbbreviation = "Muster.";

    expect(teamnameCutter(teamname, [])).toBe(expectedAbbreviation);
  });

  it('should cut long abbrevated names', () => {
    const teamname = "Musterhausen.";
    const expectedAbbreviation = "Mus.";

    expect(teamnameCutter(teamname, [])).toBe(expectedAbbreviation);
  });
});
