import * as Moment from 'moment';
import {
  Match,
  Month,
  Team
} from 'scraperlib';
import { AgeClass } from './definitions/age-class';
import { AgeClassWrapper } from './definitions/age-class-wrapper';
import { GroupedMatches } from './definitions/grouped-matches';
import { Week } from './definitions/week';
import { WeekendBucket } from './definitions/weekend-bucket';

Moment.locale('de');

export class MatchplanUtilites {
  public static getMonthFromName(nameOfMonth: string): Month {
      const numberOfMonth = Moment().month(nameOfMonth).format("M");
      return parseInt(numberOfMonth, 10) - 1;
  }

  public static getAgeClassWithIndexOfMatch(match: Match, ageClasses: AgeClass[]): AgeClassWrapper {
    if (!match.home.type) {
      return {
        index: -1
      };
    }

    const matchedAgeClasses = ageClasses.map(
      (item, index) => {
        return {
          ageClass: item,
          index
        };
      }
    )
    .filter(
      (ageClassWrapper) => {
        const ageClass = ageClassWrapper.ageClass;
        const teamTypes = [match.home.type, match.guest.type];
        const firstAgeSelectorOccurence = teamTypes.indexOf(ageClass.ageSelector);

        if (firstAgeSelectorOccurence !== -1) {
          if (!ageClass.nameSelector) {
            return true;
          }

          if (match.home.name.indexOf(ageClass.nameSelector) !== -1) {
            return true;
          }
        }

        return false;
      }
    );

    if (matchedAgeClasses.length > 1) {
      console.warn(`
        Found mulitple matches for same team on same day.
        Continue with first match.`
      );
      return matchedAgeClasses[0];
    } else if (matchedAgeClasses.length === 0) {
      throw new Error(
        'no age class found (' +
        match.home.name + '/' + match.home.type +
        ' vs. ' +
        match.guest.name + '/' + match.guest.type + ')'
      );
    }

    return matchedAgeClasses[0];
  }

  public static expandWeek(week: Week, ageClasses: AgeClass[]): Week {
    week.days = week.days.map(
      (day) => {
        const ageClassBuckets = ageClasses.map(() => null);
        day.forEach(
          (match) => {
            const i = MatchplanUtilites.getAgeClassWithIndexOfMatch(match, ageClasses).index;
            ageClassBuckets[i] = match;
          }
        );
        return ageClassBuckets;
      }
    );
    return week;
  }

  public static groupMatchesByWeekNumber(matches: Match[]): GroupedMatches {
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
    groupedMatches: GroupedMatches,
    mandatoryDays: number[],
    ageClasses: AgeClass[]
  ): WeekendBucket {
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
          (match) => week.days[Moment(match.date).weekday()]
            .push(match)
        );
      }
      result[i] = MatchplanUtilites.expandWeek(week, ageClasses);
    }

    return result;
  }
}
