import {
  Match,
  Team,
  teamnameShortener,
} from 'scraperlib';
import { LatexGenerator } from "../latex-generator.interface";

import * as Moment from 'moment';
import * as Mustache from 'mustache';
import { Alias } from '../definitions/alias';
import { MatchplanContext } from '../definitions/matchplan-context';

Moment.locale('de');

export class MatchlistGenerator implements LatexGenerator {
  private static defaultLatexTemplate = `
  {{=<< >>=}}
  <<#matches>>
  <<subtitle>>: <<&home>> vs. <<&guest>> (<<prefix>>)
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
    aliases: Alias[],
    agegroupIgnorelist: string[]
  ): string {
    const matchData: any[] = matches.map(
      (match) => {
        const aliasesMap = aliases.reduce(
          (map, aliasListItem) =>  {
            map[aliasListItem.name] = aliasListItem.alias;
            return map; 
          }, 
          {} 
        );

        const date = Moment(match.date);
        return {
          guest: teamnameShortener(match.guest.name, teamnameBlacklist, aliasesMap),
          home: teamnameShortener(match.home.name, teamnameBlacklist, aliasesMap),
          prefix: MatchlistGenerator.formatPrefix(match.home, agegroupIgnorelist),
          subtitle: date.format('LLLL') + ' Uhr'
          };
      }
    );

    return Mustache.render(this.matchplanTemplate, { matches: matchData});
  }
}
