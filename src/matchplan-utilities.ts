import * as Moment from 'moment';
import {
  Match,
  Team
} from 'scraperlib';
import { AgeClass } from './age-class';
import { Week } from './week';

export class MatchplanUtilites {
  public static createPrefix(team: Team, ignoreList: string[]) {
    if (ignoreList.indexOf(team.type) !== -1) {
      return "";
    } else {
      return team.type + ":";
    }
  }

  public static getAgeClassIndexOfMatch(match: Match, ageClasses: AgeClass[]) {
    const matchingClassIndexes = [];
    ageClasses.forEach(
      (ageClass, index) => {
        if (ageClass.ageSelector ===
          match.home.type &&
          (
            !ageClass.nameSelector ||
            match.home.name.indexOf(ageClass.nameSelector) !== -1 ||
            match.guest.name.indexOf(ageClass.nameSelector) !== -1
          )
        ) {
          matchingClassIndexes.push(index);
        }
      }
    );

    if (matchingClassIndexes.length > 1) {
      console.warn(`
        Found mulitple matches for same team on same day.
        Continue with first match.`
      );
      return matchingClassIndexes[0];
    } else if (matchingClassIndexes.length === 0) {
      throw new Error(
        'no age class found (' +
        match.home.name + '/' + match.home.type +
        ' vs. ' +
        match.guest.name + '/' + match.guest.type + ')'
      );
    }

    return matchingClassIndexes[0];
  }

  public static expandWeek(week: Week, ageClasses: AgeClass[]): Week {
    week.days = week.days.map(
      (day) => {
        const ageClassBuckets = ageClasses.map(() => null);
        day.forEach(
          (match) => {
            const i = MatchplanUtilites.getAgeClassIndexOfMatch(match, ageClasses);
            ageClassBuckets[i] = match;
          }
        );
        return ageClassBuckets;
      }
    );
    return week;
  }

  public static groupMatchesByWeekNumber(matches: Match[]): { [id: string]: Match[]; } {
    return matches.reduce(
      (groups, match) => {
        const key = Moment(match.date).isoWeek();

        // make sure array for that day exists
        if (groups[key] === undefined) {
          groups[key] = [];
        }
        // insert into bucket
        groups[key].push(match);

        return groups;
      }
    , {});
  }

  public static createWeekendBuckets(
    groupedMatches: { [id: string]: Match[]; },
    mandatoryDays: number[],
    ageClasses: AgeClass[]
  ): { [id: string]: Week; } {
    const weekNumbers = Object.keys(groupedMatches);
    const result = {};

    if (Object.keys(groupedMatches).length === 0) {
      return {};
    }

    const firstWeekNumber = parseInt(weekNumbers[0], 10);
    const lastWeekNumber = parseInt(weekNumbers[weekNumbers.length - 1], 10);

    let week: Week;
    let matches: Match[];
    for (let i = firstWeekNumber; i <= lastWeekNumber; i++) {
      week = new Week();
      if (groupedMatches[i]) {
        matches = groupedMatches[i];
        matches.forEach(
          (match) => week.days[Moment(match.date).weekday()].push(match)
        );
      }
      result[i] = MatchplanUtilites.expandWeek(week, ageClasses);
    }

    return result;
  }
}
