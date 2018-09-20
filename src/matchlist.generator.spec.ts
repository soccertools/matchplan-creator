import "jasmine";
import { Match, Month, Team } from "scraperlib";
import { MatchplanContext } from "./definitions/matchplan-context";
import { MatchlistGenerator } from "./matchlist.generator";

describe('MatchlistGenerator', () => {
    let matchlistGenerator: MatchlistGenerator;

    beforeAll(() => {
      matchlistGenerator = new MatchlistGenerator();
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
        prefixer: {
          noPrefix: "none"
        },
        shortener: {
          aliases: [],
          forbidden: [],
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

      const actualLatex: string = matchlistGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\match{Sonntag, 18. Januar 1970 20:04 Uhr}{Hometeam}{Guestteam}{~}"
      );
    });

    it('should convert a single match with team types to latex', () => {
      const singleMatch = buildSampleMatch();
      singleMatch.home.type = "Alte Herren";
      singleMatch.guest.type = "Alte Herren";

      const matches: Match[] = [
        singleMatch
      ];

      const context = buildSampleContext();

      const actualLatex: string = matchlistGenerator.generate(matches, context);

      expect(actualLatex).toContain(
        "\match{Sonntag, 18. Januar 1970 20:04 Uhr}{Hometeam}{Guestteam}{Alte Herren:}"
      );
    });

});
