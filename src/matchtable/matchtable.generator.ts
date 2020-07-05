import { AgeClass } from '../definitions/age-class';

import * as Moment from 'moment';
import * as Mustache from 'mustache';

import {
  Match
} from 'scraperlib';

import { Abbreviation } from '../definitions/abbreviation';
import { MatchMetadata } from '../definitions/match-metadata';
import { MatchplanContext } from '../definitions/matchplan-context';
import { LatexGenerator } from "../latex-generator.interface";
import { MatchplanUtilities } from "../matchplan-utilities";
import { groupBy } from '../operators/group-by';
import { teamnameMinifier } from '../operators/teamname-minifier';

Moment.locale('de');

export class MatchtableGenerator implements LatexGenerator {
  private static defaultLatexTemplate = `
{{=<< >>=}}
<<#weeks>>
<<#.>>
<<&.>>
<</.>>
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
          ageClass: MatchplanUtilities.getAgeClassOfMatch(match, clubNameSelector, ageClasses),
          match,
          weekDay: Moment(match.date).isoWeekday() - 1,
          weekNumber: Moment(match.date).isoWeek(),
        };
      }
    ).filter(
      (matchMetadata) => matchMetadata.ageClass !== null
    );

    const weekGroups = this.groupMatchesByWeekAndDays(matchMetadatas);
    const latexWeekMatchData: string[][] = this.createFormattedArray(
      weekGroups,
      ageClasses,
      forbiddenShortenerTerms,
      abbreviations
    );

    return Mustache.render(this.matchplanTemplate, { weeks: latexWeekMatchData });
  }

  private groupMatchesByWeekAndDays(matchMetadatas: MatchMetadata[]): MatchMetadata[][][] {
    return groupBy(matchMetadatas,
      (itemA, itemB) => itemA.weekNumber === itemB.weekNumber
    ).map(
      (weekGroup) => weekGroup.sort( (matchA, matchB) => matchA.weekDay > matchB.weekDay )
    ).map(
      (matchesInWeek) => groupBy(matchesInWeek, (wrapper1, wrapper2) => wrapper1.weekDay === wrapper2.weekDay )
    );
  }

  private createFormattedArray(
    weekGroups: MatchMetadata[][][],
    ageClasses: AgeClass[],
    forbiddenShortenerTerms: string[],
    abbreviations: Abbreviation[]
  ): string[][] {
    return weekGroups.map(
      (matchMetadatas) => this.ensureObligatoryDays(matchMetadatas, ageClasses, [4, 5, 6])
    ).map(
      (week) => week.map(
        (dayWrapper) => this.associateMatchMetadataToAgeClasses(dayWrapper, ageClasses)
      ).map(
        (completeMatchMetadatas) => this.latexify(completeMatchMetadatas, forbiddenShortenerTerms, abbreviations)
      )
    );
  }

  private ensureObligatoryDays(
    matchMetadatasWeek: MatchMetadata[][],
    ageClasses: AgeClass[],
    obligatoryDayOfWeekNumbers: number[]
  ) {
    obligatoryDayOfWeekNumbers.forEach(
      (dayNumber) => {
        if (!matchMetadatasWeek.some((metadata) => metadata[0].weekDay === dayNumber)) {
          if (ageClasses.length === 0) {
            throw new Error('no age class found');
          }

          const dummyMatch = new Match();
          dummyMatch.date = Moment(matchMetadatasWeek[0][0].match.date).startOf('week').add(dayNumber, 'days').toDate();

          matchMetadatasWeek.push(
            [
              {
                ageClass: ageClasses[0],
                match: dummyMatch,
                weekDay: dayNumber,
                weekNumber: -1,
              }
            ]
          );
        }
      }
    );
    return matchMetadatasWeek.sort(
      (a, b) => a[0].weekDay - b[0].weekDay
    );
  }

  private associateMatchMetadataToAgeClasses(matches: MatchMetadata[], ageClasses: AgeClass[]): MatchMetadata[] {
      // associate matches to age classes (later columns)
      return ageClasses.map(
        (ageClass) => {
          const matchesFoundForAgeClass = matches.filter(
            (matchWrapper) => matchWrapper.ageClass === ageClass
          );

          if (matchesFoundForAgeClass.length > 1) {
              matchesFoundForAgeClass[0].competingMatches = matchesFoundForAgeClass
              .map( (metadata) => metadata.match )
              .slice(1);
          }

          if (matchesFoundForAgeClass.length > 0) {
            return matchesFoundForAgeClass[0];
          }
          const dummyMatch = new Match();
          dummyMatch.date = matches[0].match.date;

          return {
            ageClass,
            match: dummyMatch,
            weekDay: -1,
            weekNumber: -1,
          };
        }
      );
    }

    private latexify(
      matchMetadatas: MatchMetadata[],
      forbiddenShortenerTerms: any,
      abbreviations: Abbreviation[]
    ): string {
      return matchMetadatas.reduce(
        (acc, matchWrapper, index) => {
          let additionals = " ";
          if (matchWrapper.competingMatches) {
            additionals = " ... ";
          }

          const match = matchWrapper.match;

          if (index === 0) {
            acc += `"${Moment(match.date).format("dd, D.M.")}"`;
          }

          if (!match.home.name) { // dummy match detection
            return `${acc} ,   `;
          }

          const home = teamnameMinifier(
            match.home.name,
            forbiddenShortenerTerms,
            abbreviations
          );
          const guest = teamnameMinifier(
            match.guest.name,
            forbiddenShortenerTerms,
            abbreviations
          );
          const time = Moment(match.date).format("kk:mm");

          return `${acc} ,  ${home} - ${guest} ${time} ${additionals}`;
        },
        ""
      );
    }
  }
