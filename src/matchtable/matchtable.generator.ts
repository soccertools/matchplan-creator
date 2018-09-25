import { AgeClass } from '../definitions/age-class';

import * as Moment from 'moment';
import * as Mustache from 'mustache';

import {
  Match,
  Team,
  teamnameShortener,
} from 'scraperlib';

import { Abbreviation } from '../definitions/abbreviation';
import { GroupedMatches } from '../definitions/grouped-matches';
import { MatchMetadata } from '../definitions/match-metadata';
import { MatchplanContext } from '../definitions/matchplan-context';
import { Week } from '../definitions/week';
import { LatexGenerator } from "../latex-generator.interface";
import { MatchplanUtilites } from "../matchplan-utilities";
import { groupBy } from '../operators/group-by';
import { teamnameCutter } from '../operators/teamname-cutter';

Moment.locale('de');

export class MatchtableGenerator implements LatexGenerator {
  private static defaultLatexTemplate = `
  {{=<< >>=}}
  <<#weeks>>
  \\weekendRow{
    <<#.>>
      \\dayRow{ <<&.>>  }
    <</.>>
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
      context.club.ageClasses.map(
        (ageClassItem, index) => new AgeClass(index, ageClassItem.ageSelector, ageClassItem.nameSelector)
      ),
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

    // enrich match data
    const matchMetadatas: MatchMetadata[] = matches.map(
      (match) => {
        return {
          ageClass: this.getAgeClassOfMatch(match, clubNameSelector, ageClasses),
          match,
          weekDay: Moment(match.date).weekday(),
          weekNumber: Moment(match.date).isoWeek(),
        };
      }
    ).filter(
      (matchMetadata) => matchMetadata.ageClass !== null
    );

    // group matches in weeks and days
    const weekGroups = groupBy(matchMetadatas,
      (itemA, itemB) => itemA.weekNumber === itemB.weekNumber
    ).map(
      (weekGroup) => weekGroup.sort( (matchA, matchB) => matchA.weekDay > matchB.weekDay )
    ).map(
      (matchesInWeek) => groupBy(matchesInWeek, (wrapper1, wrapper2) => wrapper1.weekDay === wrapper2.weekDay )
    );

    // transform to latex
    const latexWeekMatchData: string[][] = weekGroups.map(
      (week) => week.map(
        (day) => {
          const filledDay = ageClasses.map(
            (ageClass) => {
              const matchFoundForAgeClass = day.find(
                (matchWrapper) => matchWrapper.ageClass === ageClass
              );
              if (matchFoundForAgeClass) {
                return matchFoundForAgeClass;
              }
              return {
                ageClass,
                match: null,
                weekDay: -1,
                weekNumber: -1,
              };
            }
          );

          return filledDay.reduce(
            (acc, matchWrapper, index) => {
              if (!matchWrapper.match) {
                return `${acc} & . `;
              }

              const match = matchWrapper.match;
              const home = teamnameCutter(
                teamnameShortener(match.home.name, forbiddenShortenerTerms),
                abbreviations
              );
              const guest = teamnameCutter(
                teamnameShortener(match.guest.name, forbiddenShortenerTerms),
                abbreviations
              );
              if (index === 0) {
                acc += Moment(match.date).format("dd, D.M.");
              }
              return `${acc} & ${home} vs. ${guest}`;
            },
            ""
          );
        }

      )
    );

    console.log("weekNumberGroups", latexWeekMatchData);

    return Mustache.render(this.matchplanTemplate, { weeks: latexWeekMatchData });
  }

  private getAgeClassOfMatch(match: Match, clubNameSelector: string, ageClasses: AgeClass[]): AgeClass | null {
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

        let selectedTeam: Team = match.home;
        if (match.home.name.indexOf(nameSelector) === -1) {
          selectedTeam = match.guest;
        }

        if (selectedTeam.name.indexOf(nameSelector) === -1) {
          return false;
        }

        if (selectedTeam.type !== ageClassItem.ageSelector) {
          return false;
        }

        return true;
      }
    );

    if (matchingAgeClasses.length > 1) {
      throw new Error("multiple age class candidates found for match");
    }

    if (matchingAgeClasses.length === 0) {
      return null;
    }

    return matchingAgeClasses[0];
  }

}
