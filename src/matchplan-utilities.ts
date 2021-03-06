import * as Moment from 'moment';
import {
  Match,
  Month,
  Team
} from 'scraperlib';
import { AgeClass } from './definitions/age-class';

Moment.locale('de');

export class MatchplanUtilities {

  public static getMonthFromName(nameOfMonth: string): Month {
      const numberOfMonth = Moment().month(nameOfMonth).format("M");
      return parseInt(numberOfMonth, 10) - 1;
  }

  public static getAgeClassOfMatch(match: Match, clubNameSelector: string, ageClasses: AgeClass[]): AgeClass | null {
    if (ageClasses.length === 0) {
      throw new Error("no age-class available");
    }

    const matchingAgeClasses = ageClasses.filter(
      (ageClassItem) => {
        let nameSelector;

        if (ageClassItem.nameSelector) {
          nameSelector = ageClassItem.nameSelector;
        } else {
          nameSelector = clubNameSelector;
        }

        // try to match home team
        let selectedTeam: Team = match.home;
        if (match.home.name.indexOf(nameSelector) === -1) {
          selectedTeam = match.guest;
        }

        // try to match guest team
        if (selectedTeam.name.indexOf(nameSelector) === -1) {
          return false;
        }

        const nameSelectorEndPosition = selectedTeam.name.indexOf(nameSelector) + nameSelector.length;

        if (
          selectedTeam.name.length >= nameSelectorEndPosition &&
          selectedTeam.name[nameSelectorEndPosition - 1] === selectedTeam.name[nameSelectorEndPosition]
        ) {
          return false;
        }

        // match age selector
        if (selectedTeam.type !== ageClassItem.ageSelector) {
          return false;
        }

        return true;
      }
    );

    if (matchingAgeClasses.length > 2) {
      console.error("too many age classes found", matchingAgeClasses);
      throw new Error("multiple age class candidates found for match");
    }

    if (matchingAgeClasses.length === 2) {
      if (matchingAgeClasses[0].nameSelector.length > matchingAgeClasses[1].nameSelector.length) {
        return matchingAgeClasses[0];
      } else {
        return matchingAgeClasses[1];
      }
    }

    if (matchingAgeClasses.length === 0) {
      return null;
    }

    return matchingAgeClasses[0];
  }

}
