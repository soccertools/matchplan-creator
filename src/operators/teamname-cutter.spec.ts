import "jasmine";
import { teamnameCutter } from "./teamname-cutter";

describe('MatchplanUtilites', () => {
  it('should cut basic teamnames', () => {
    const teamname = "Musterhausen";
    const expectedAbbreviation = "Mus.";

    expect(teamnameCutter(teamname, [])).toBe(expectedAbbreviation);
  });
});
