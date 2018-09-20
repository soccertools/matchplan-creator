import "jasmine";
import { Match, Month, Team } from "scraperlib";
import { AgeClass } from "./age-class";
import { MatchplanContext } from "./definitions/matchplan-context";
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
      match.date = new Date(1537473028);

      return match;
    }

    function buildSampleContext(): MatchplanContext {
      const context: MatchplanContext = {
        club: {
          ageClasses: [
            new AgeClass("Herren", "Herren I"),
            new AgeClass("Herren", "Herren II")
          ],
          id: "someId",
          nameSelector: "SomeName",
          shortener: {
            aliases: [],
            forbidden: [],
          },
        },
        type: "list",
      };
      return context;
    }

    it('should convert a single match without team types to latex', () => {
      const singleMatch = buildSampleMatch();
      const matches: Match[] = [
        singleMatch
      ];

      const context = buildSampleContext();

      const actualLatex: string = matchtableGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "testtest1234"
      );
    });

});
