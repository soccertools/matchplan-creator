import { AgeClass } from '../definitions/age-class';

import * as Moment from 'moment';
import * as Mustache from 'mustache';

import {
  Match,
  Team,
  teamnameShortener,
} from 'scraperlib';

import { Abbreviation } from '../definitions/abbreviation';
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
        (ageClassItem, index) => {
          if (ageClassItem.nameSelector) {
            ageClassItem.nameSelector = ageClassItem.nameSelector.replace("<nameSelector>", context.club.nameSelector);
          }
          return new AgeClass(
            index,
            ageClassItem.ageSelector,
            ageClassItem.nameSelector
          );
        }
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
          ageClass: MatchplanUtilites.getAgeClassOfMatch(match, clubNameSelector, ageClasses),
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
        (dayWrapper) => {
          // associate matches to age classes (later columns)
          const filledDay = ageClasses.map(
            (ageClass) => {
              const matchesFoundForAgeClass = dayWrapper.filter(
                (matchWrapper) => matchWrapper.ageClass === ageClass
              );

              if (matchesFoundForAgeClass.length > 1) {
                  matchesFoundForAgeClass[0].competingMatches = matchesFoundForAgeClass.slice(1);
              }

              if (matchesFoundForAgeClass.length > 0) {
                return matchesFoundForAgeClass[0];
              }
              const dummyMatch = new Match();
              dummyMatch.date = dayWrapper[0].match.date;

              return {
                ageClass,
                match: dummyMatch,
                weekDay: -1,
                weekNumber: -1,
              };
            }
          );

          return filledDay.reduce(
            (acc, matchWrapper, index) => {
              let additionals = " ";
              if (matchWrapper.competingMatches) {
                additionals = ",... ";
              }

              const match = matchWrapper.match;

              if (index === 0) {
                acc += Moment(match.date).format("dd, D.M.");
              }

              if (!match.home.name) { // dummy match detection
                return `${acc} &  . `;
              }

              const home = teamnameCutter(
                teamnameShortener(match.home.name, forbiddenShortenerTerms),
                abbreviations
              );
              const guest = teamnameCutter(
                teamnameShortener(match.guest.name, forbiddenShortenerTerms),
                abbreviations
              );

              return `${acc} &  ${home} vs. ${guest}${additionals}`;
            },
            ""
          );
        }

      )
    );

    return Mustache.render(this.matchplanTemplate, { weeks: latexWeekMatchData });
  }

}
