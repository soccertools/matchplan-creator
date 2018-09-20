import "jasmine";
import { Month } from "scraperlib";
import { MatchplanUtilites } from "./matchplan-utilities";

describe('MatchplanUtilites', () => {
  describe('getMonthFromName', () => {
    it('should convert Januar to associated enum', () => {
      const nameOfMonth = "Januar";
      const expectedEnum = Month.January;

      expect(MatchplanUtilites.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });

    it('should convert Februar to associated enum', () => {
      const nameOfMonth = "Februar";
      const expectedEnum = Month.February;

      expect(MatchplanUtilites.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });

    it('should convert Dezember to associated enum', () => {
      const nameOfMonth = "Dezember";
      const expectedEnum = Month.December;

      expect(MatchplanUtilites.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });
  });

});
