import "jasmine";
import { Match, Month, Team } from "scraperlib";
import { AgeClass } from "./definitions/age-class";
import { MatchplanUtilities } from "./matchplan-utilities";

describe('MatchplanUtilities', () => {
  function buildSampleMatch(): Match {
    const match = new Match();
    match.home = new Team();
    match.home.name = "Hometeam";
    match.guest = new Team();
    match.guest.name = "Guestteam";
    match.date = new Date(1537473028);

    return match;
  }

  describe('getMonthFromName', () => {
    it('should convert Januar to associated enum', () => {
      const nameOfMonth = "Januar";
      const expectedEnum = Month.January;

      expect(MatchplanUtilities.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });

    it('should convert Februar to associated enum', () => {
      const nameOfMonth = "Februar";
      const expectedEnum = Month.February;

      expect(MatchplanUtilities.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });

    it('should convert Dezember to associated enum', () => {
      const nameOfMonth = "Dezember";
      const expectedEnum = Month.December;

      expect(MatchplanUtilities.getMonthFromName(nameOfMonth)).toBe(expectedEnum);
    });
  });

  describe('getAgeClassOfMatch', () => {
    it('should return null if no home team type was given', () => {
      const match = buildSampleMatch();
      const ageClasses = [
        new AgeClass(0, "Some-Unused-AgeClass")
      ];

      expect(MatchplanUtilities.getAgeClassOfMatch(match, "Hometeam", ageClasses))
       .toBeNull();
    });

    it('should throw error if no age class was given', () => {
      const match = buildSampleMatch();
      const ageClasses = [];

      expect(() => MatchplanUtilities.getAgeClassOfMatch(match, "Hometeam", ageClasses))
       .toThrowError("no age-class available");
    });

    it('should return matching ageClass on matching ageSelector', () => {
      const match = buildSampleMatch();
      match.home.type = "Expected-Class";
      match.guest.type = "Expected-Class";

      const ageClasses = [
        new AgeClass(0, "Herren"),
        new AgeClass(1, "A-Junioren"),
        new AgeClass(2, "Expected-Class"),
        new AgeClass(3, "Z-Junioren"),
      ];

      const actualAgeClass = MatchplanUtilities.getAgeClassOfMatch(match, "Hometeam", ageClasses);

      expect(actualAgeClass.order).toBe(2);
      expect(actualAgeClass.ageSelector).toBe("Expected-Class");
    });
  });

  it('should return matching ageClass on matching nameSelector', () => {
    const match = buildSampleMatch();
    match.home.name = "Hometeam II";
    match.home.type = "Expected-Class";
    match.guest.type = "Expected-Class";

    const ageClasses = [
      new AgeClass(0, "Herren", "Hometeam II"),
      new AgeClass(1, "Expected-Class", "Guestteam I"),
      new AgeClass(2, "Expected-Class", "Hometeam II"),
      new AgeClass(3, "Z-Junioren"),
    ];

    const actualAgeClass = MatchplanUtilities.getAgeClassOfMatch(match, "Hometeam", ageClasses);

    expect(actualAgeClass.order).toBe(2);
    expect(actualAgeClass.ageSelector).toBe("Expected-Class");
  });

});
