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
      match.home.name = "Hometeam";
      match.guest = new Team();
      match.guest.name = "Guestteam";
      match.date = new Date("1961-12-17T03:24:00");

      return match;
    }

    function buildSampleContext(): MatchplanContext {
      const context: MatchplanContext = {
        club: {
          ageClasses: [
            new AgeClass("Herren", "Herren I"),
            new AgeClass("Herren", "Herren II"),
            new AgeClass("Z-Junioren")
          ],
          id: "someId",
          nameSelector: "SomeName",
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
      singleMatch.home.type = "Z-Junioren";
      singleMatch.guest.type = "Z-Junioren";

      const matches: Match[] = [
        singleMatch
      ];

      const context = buildSampleContext();

      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\\dayRow{ So, 17.12. &  .  &  .  &  Hom. vs. Gue.   }"
      );
    });

});
