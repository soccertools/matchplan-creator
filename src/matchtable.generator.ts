import { AgeClass } from './age-class';

import * as Moment from 'moment';
import * as Mustache from 'mustache';

import {
  Match,
  teamnameShortener
} from 'scraperlib';

import { MatchplanContext } from './definitions/matchplan-context';
import { LatexGenerator } from "./latex-generator.interface";
import { MatchplanUtilites } from "./matchplan-utilities";
import { teamnameCutter } from './teamname-cutter';
import { Week } from './week';

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
    return this.createLatexMatchtable(
      matches,
      context.clubNameSelector,
      context.ageClasses
    );
  }

  private createLatexMatchtable(
    matches: Match[],
    clubNameSelector: string,
    ageClasses: AgeClass[]
  ): string {
    const teamnameBlacklist = ['Erfurt'];
    const mandatoryDays = [4, 5, 6];
    const weeklyGroupedMatches: { [id: string]: Match[]; } = MatchplanUtilites.groupMatchesByWeekNumber(matches);
    const weekendBuckets = MatchplanUtilites.createWeekendBuckets(weeklyGroupedMatches, mandatoryDays, ageClasses);

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
                  const abbrevations = [['Hochstedt', 'Ho.'], ['Vieselbach', 'Vi.']];
                  const blacklist = ['Erfurt'];
                  const home = teamnameCutter(teamnameShortener(match.home.name, blacklist), abbrevations);
                  const guest = teamnameCutter(teamnameShortener(match.guest.name, blacklist), abbrevations);
                  return teamDay += ' ' + home + ' vs. ' + guest + ' ';
                }
              },
              date
            );
          }
        ).filter(
          (day, index) => !day.trim().startsWith('.') || mandatoryDays.indexOf(index) !== -1
        );
        week.days = days;
        return week;
      }
    );

    return Mustache.render(this.matchplanTemplate, { weeks });
  }
}
