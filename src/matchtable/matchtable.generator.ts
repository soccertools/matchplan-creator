import { AgeClass } from '../definitions/age-class';

import * as Moment from 'moment';
import * as Mustache from 'mustache';

import {
  Match,
  teamnameShortener,
} from 'scraperlib';

import { Abbreviation } from '../definitions/abbreviation';
import { GroupedMatches } from '../definitions/grouped-matches';
import { MatchplanContext } from '../definitions/matchplan-context';
import { Week } from '../definitions/week';
import { LatexGenerator } from "../latex-generator.interface";
import { MatchplanUtilites } from "../matchplan-utilities";
import { teamnameCutter } from '../operators/teamname-cutter';

Moment.locale('de');

export class MatchtableGenerator implements LatexGenerator {
  private static defaultLatexTemplate = `
  {{=<< >>=}}
  <<#weeks>>
  \\weekendRow{
    <<#days>>
      \\dayRow{ <<&.>>  }
    <</days>>
  }
  <</weeks>>
  `;

  private matchplanTemplate: string;

  constructor(
    matchtableTemplate?: string
  ) {
    if (matchtableTemplate) {
      this.matchplanTemplate = matchtableTemplate;
    } else {
      this.matchplanTemplate = MatchtableGenerator.defaultLatexTemplate;
    }
  }

  public generate(matches: Match[], context: MatchplanContext) {
    const mandatoryDayNumbers = [4, 5, 6];

    return this.createLatexMatchtable(
      matches,
      context.club.nameSelector,
      context.club.ageClasses,
      context.shortener.forbidden,
      mandatoryDayNumbers,
      context.cutter.abbreviations
    );
  }

  private createLatexMatchtable(
    matches: Match[],
    clubNameSelector: string,
    ageClasses: AgeClass[],
    forbiddenShortenerTerms: string[],
    mandatoryDayNumbers: number[],
    abbreviations: Abbreviation[]
  ): string {
    const weeklyGroupedMatches: GroupedMatches = MatchplanUtilites.groupMatchesByWeekNumber(matches);
    const weekendBuckets = MatchplanUtilites.createWeekendBuckets(
      weeklyGroupedMatches,
      mandatoryDayNumbers,
      ageClasses
    );

    // make weekendBucket object to array of weeks
    let weeks = [];
    for (const weekKey in weekendBuckets) {
      if (weekendBuckets.hasOwnProperty(weekKey)) {
        weeks.push(weekendBuckets[weekKey]);
      }
    }

    weeks = weeks.map(
      (week: Week) => {
        const days = week.days.map(
          (day) => {
            let date: string;
            const dayMatches = day.filter(
              (match) => match !== null
            );
            if (dayMatches.length === 0) {
              date = " . ";
            } else {
              date = Moment(dayMatches[0].date).format("dd, D.M.");
            }
            return day.reduce(
              (teamDay, match: Match | null, index) => {
                teamDay += " & ";

                if (match === null) {
                  return teamDay += " . ";
                } else {
                  const blacklist = forbiddenShortenerTerms;
                  const home = teamnameCutter(
                    teamnameShortener(match.home.name, forbiddenShortenerTerms),
                    abbreviations
                  );
                  const guest = teamnameCutter(
                    teamnameShortener(match.guest.name, forbiddenShortenerTerms),
                    abbreviations
                  );
                  return teamDay += ' ' + home + ' vs. ' + guest + ' ';
                }
              },
              date
            );
          }
        ).filter(
          (day, index) =>
            day.trim().startsWith('.') ||
            mandatoryDayNumbers.indexOf(index) !== -1
        );
        week.days = days;
        return week;
      }
    );

    return Mustache.render(this.matchplanTemplate, { weeks });
  }

}
