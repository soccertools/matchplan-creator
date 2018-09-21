import {
  Match,
  Team,
  teamnameShortener,
} from 'scraperlib';
import { LatexGenerator } from "../latex-generator.interface";
import { MatchService } from "../match.service";
import { MatchplanUtilites } from "../matchplan-utilities";

import * as Moment from 'moment';
import * as Mustache from 'mustache';
import { MatchplanContext } from '../definitions/matchplan-context';

Moment.locale('de');

export class MatchlistGenerator implements LatexGenerator {
  private static defaultLatexTemplate = `
  {{=<< >>=}}
  <<#matches>>
  \\match{<<subtitle>>}{<<&home>>}{<<&guest>>}{<<prefix>>}
  <</matches>>
  `;

  private static formatPrefix(team: Team, ignoreList: string[]) {
    if (!team.type) {
      return "~";
    }

    if (ignoreList.indexOf(team.type) !== -1) {
      return "";
    }

    return team.type + ":";
  }

  private matchplanTemplate: string;

  constructor(
    matchplanTemplate?: string
  ) {
    if (matchplanTemplate) {
      this.matchplanTemplate = matchplanTemplate;
    } else {
      this.matchplanTemplate = MatchlistGenerator.defaultLatexTemplate;
    }
  }

  public generate(matches: Match[], context: MatchplanContext) {
    return this.createLatexMatchplan(
      matches,
      context.shortener.forbidden,
      context.shortener.aliases,
      context.prefixer.noPrefix
    );
  }

  private createLatexMatchplan(
    matches: Match[],
    teamnameBlacklist: string[],
    aliases: {[teamName: string]: string},
    agegroupIgnorelist: string[]
  ): string {
    const matchData: any[] = matches.map(
      (match) => {
        const date = Moment(match.date);
        return {
          guest: teamnameShortener(match.guest.name, teamnameBlacklist, aliases),
          home: teamnameShortener(match.home.name, teamnameBlacklist, aliases),
          prefix: MatchlistGenerator.formatPrefix(match.home, agegroupIgnorelist),
          subtitle: date.format('LLLL') + ' Uhr'
          };
      }
    );

    return Mustache.render(this.matchplanTemplate, { matches: matchData});
  }
}
