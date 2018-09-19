import * as Moment from 'moment';
import * as Mustache from 'mustache';
import {
  FussballHtmlService,
  FussballScraper,
  Match,
  Month,
  teamnameShortener
} from 'scraperlib';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { AgeClass } from './age-class';
import { MatchplanUtilites } from './matchplan-utilities';
import { Week } from './week';

Moment.locale('de');
const httpClient = new HttpClient('some useragent');
const fussballHtmlService = new FussballHtmlService(httpClient);
const fussballScraper = new FussballScraper();

const matchplanTemplate = `
{{=<< >>=}}
<<#matches>>
\\match{<<subtitle>>}{<<&home>>}{<<&guest>>}{<<prefix>>}
<</matches>>

`;

const matchtableTemplate = `
{{=<< >>=}}
<<#weeks>>
\\weekendRow{
  <<#days>>
    \\dayRow{ <<&.>>  }
  <</days>>
}
<</weeks>>
`;

function teamnameCutter(teamname: string, defaultReplacements: string[][]) {
  // simple string replacements
  defaultReplacements.forEach(
    (replacement) => {
      teamname = teamname.replace(replacement[0], replacement[1]);
    }
  );

  // shorten long words
  const teamnameParts = teamname.split(' ').map(
    (word) => {
      // already short
      if (word.length <= 4) {
        return word;
      }

      // already abbrevated
      if (word.endsWith('.')) {
        return word;
      }

      // shorten long word
      return word.substr(0, 3) + ".";
    }
  ).filter(
    // filter roman numerals e.g. I, II, III
    (word) => word.search(/^[I]+/) === -1
  );

  return teamnameParts.join(' ');
}

async function loadMatches(clubId: string, month: Month): Promise<Match[]> {
  const matchHtml = await fussballHtmlService.loadMatchplan(
    clubId,
    month
  );

  return fussballScraper.scrapeMatches(matchHtml);
}

async function createLatexMatchplan(
  clubId: string,
  month: Month,
  teamnameBlacklist: string[],
  aliases: {[teamName: string]: string},
  agegroupIgnorelist: string[]
) {
  const matches = await loadMatches(clubId, month);

  const matchData: any[] = matches.map(
    (match) => {
      const date = Moment(match.date);
      return {
        guest: teamnameShortener(match.guest.name, teamnameBlacklist, aliases),
        home: teamnameShortener(match.home.name, teamnameBlacklist, aliases),
        prefix: MatchplanUtilites.createPrefix(match.home, agegroupIgnorelist),
        subtitle: date.format('LLLL') + ' Uhr'
        };
    }
  );

  return Mustache.render(matchplanTemplate, { matches: matchData});
}

async function createLatexMatchtable(clubId: string, month: Month, clubNameSelector: string, ageClasses: AgeClass[]) {
  const matches = await loadMatches(clubId, month);
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
  console.log(weeks);

  return Mustache.render(matchtableTemplate, { weeks });
}

const hochstedtClubId = '00ES8GNC6K000035VV0AG08LVUPGND5I';
const hochstedtClubNameSelector = "Hochstedt";
const hochstedtAgeClasses = [
  new AgeClass("Herren", hochstedtClubNameSelector + " I"),
  new AgeClass("Herren", hochstedtClubNameSelector + " II"),
  new AgeClass("D-Junioren"),
  new AgeClass("E-Junioren"),
  new AgeClass("F-Junioren", hochstedtClubNameSelector + " I"),
  new AgeClass("F-Junioren", hochstedtClubNameSelector + " II"),
  new AgeClass("G-Junioren")
];

createLatexMatchplan(
  hochstedtClubId,
  Month.September,
  ['Erfurt'],
  {
    'SpG SC 1910 Vieselbach I': 'SpG Vies./Hochst. I',
    'SpG SC 1910 Vieselbach II': 'SpG Vies./Hochst. II'
  },
  ['Herren']
).then(
  (matchplanLatexString) => console.log(matchplanLatexString)
);

// createLatexMatchtable(
//  hochstedtClubId,
//  Month.August,
//  hochstedtClubNameSelector,
//  hochstedtAgeClasses
// ).then(
//  (matchtableLatexString) => console.log(matchtableLatexString)
// );
