import "jasmine";
import { Match, Month, Team } from "scraperlib";
import { AgeClass } from "../definitions/age-class";
import { MatchplanContext } from "../definitions/matchplan-context";
import { MatchtableGenerator } from "./matchtable.generator";

describe('MatchtableGenerator', () => {
    let matchtableGenerator: MatchtableGenerator;

    beforeAll(() => {
      matchtableGenerator = new MatchtableGenerator();
    });

    function buildSampleMatch(): Match {
      const match = new Match();

      match.home = new Team();
      match.home.name = "MyTeam";
      match.home.type = "Z-Junioren";

      match.guest = new Team();
      match.guest.name = "Guestteam";
      match.guest.type = "Z-Junioren";

      match.date = new Date("1961-12-17T03:24:00");

      return match;
    }

    function buildSampleContext(): MatchplanContext {
      const context: MatchplanContext = {
        club: {
          ageClasses: [
            new AgeClass(0, "Herren", "MyTeam I"),
            new AgeClass(1, "Herren", "MyTeam II"),
            new AgeClass(2, "Z-Junioren"),
            new AgeClass(3, "Valid AgeClass")
          ],
          id: "someId",
          nameSelector: "MyTeam",
        },
        cutter: {
          abbreviations: []
        },
        shortener: {
          aliases: [],
          forbidden: [],
        },
        type: "list",
      };
      return context;
    }

    it('should arrange single match correctly', () => {
      const singleMatch = buildSampleMatch();
      const matches: Match[] = [singleMatch];
      const context = buildSampleContext();
      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\\dayRow{ Fr, 15.12. &    &    &    &     }"
      );
      expect(actualLatex).toContain(
        "\\dayRow{ Sa, 16.12. &    &    &    &     }"
      );
      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &    &    &  \\matchSum{MyTeam}{Guestteam}{03:24}  &     }"
      );
    });

    it('should arrange single match with multiple age class candidates correctly', () => {
      const singleMatch = buildSampleMatch();
      singleMatch.home.type = "Herren";
      singleMatch.home.name = "MyTeam II";
      const matches: Match[] = [singleMatch];
      const context = buildSampleContext();
      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &    &  \\matchSum{MyTeam}{Guestteam}{03:24}  &    &     }"
      );
    });

    it('should arrange two matches on different days in same week correctly', () => {
      const saturdayMatch = buildSampleMatch();
      saturdayMatch.date = new Date("1961-12-16T03:24:00");
      const sundayMatch = buildSampleMatch();

      const matches: Match[] = [
        saturdayMatch,
        sundayMatch
      ];

      const context = buildSampleContext();
      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\\dayRow{ Sa, 16.12. &    &    &  \\matchSum{MyTeam}{Guestteam}{03:24}  &     }"
      );
      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &    &    &  \\matchSum{MyTeam}{Guestteam}{03:24}  &     }"
      );
    });

    it('should mark two matches on same day with dots', () => {
      const saturdayMatch = buildSampleMatch();
      saturdayMatch.home.type = "Z-Junioren";
      saturdayMatch.guest.type = "Z-Junioren";

      const sundayMatch = buildSampleMatch();
      sundayMatch.home.type = "Z-Junioren";
      sundayMatch.guest.type = "Z-Junioren";

      const matches: Match[] = [saturdayMatch, sundayMatch];
      const context = buildSampleContext();

      const actualLatex: string = matchtableGenerator.generate(matches, context);
      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &    &    &  \\matchSum{MyTeam}{Guestteam}{03:24} ...  &     }"
      );
    });

    it('should ignore matches with unknown ageClass', () => {
      const match = buildSampleMatch();
      match.home.type = "Some Unkown AgeClass";
      const matches: Match[] = [match];
      const context = buildSampleContext();
      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).not.toContain("MyTeam");
    });

    it('should use ageClass of guest if guest is my team', () => {
      const match = buildSampleMatch();
      match.guest.name = "MyTeam";
      match.guest.type = "Valid AgeClass";

      match.home.name = "OtherTeam";
      match.home.type = "Z-Junioren";

      const matches: Match[] = [match];
      const context = buildSampleContext();
      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &    &    &    &  \\matchSum{OtherTeam}{MyTeam}{03:24}   }"
      );
    });

    it('should create multiple weeks for matches in different weeks', () => {
      const firstWeekMatch = buildSampleMatch();

      const secondWeekMatch = buildSampleMatch();
      secondWeekMatch.date = new Date("1961-12-24T03:24:00");

      const matches: Match[] = [firstWeekMatch, secondWeekMatch];
      const context = buildSampleContext();

      const actualLatex: string = matchtableGenerator.generate(matches, context);
      expect(actualLatex.split("\\weekendRow").length - 1).toBe(2);
    });
});
