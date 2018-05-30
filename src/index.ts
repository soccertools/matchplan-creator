import * as Moment from 'moment';
import * as Mustache from 'mustache';
import {
  FussballHtmlService,
  FussballScraper,
  Match,
  Month,
  Team,
  teamnameShortener
} from 'scraperlib';
import { HttpClient, HttpClientResponse } from 'typed-rest-client/HttpClient';

Moment.locale('de');
const httpClient = new HttpClient('some client');
const fussballHtmlService = new FussballHtmlService(httpClient);
const fussballScraper = new FussballScraper();

export class AgeClass {
  constructor(
    public ageSelector: string,
    public nameSelector?: string
  ) {}
}

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
    \\dayRow{ <<&matchInfo>>  }
  <</days>>
}
<</weeks>>
`;

function createPrefix(team: Team, ignoreList: string[]) {
  if (ignoreList.indexOf(team.type) !== -1) {
    return "";
  } else {
    return team.type + ":";
  }
}

function groupMatchesByWeekNumber(matches: Match[]): { [id: string]: Match[]; } {
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

function createDailyBuckets(
  groupedMatches: { [id: string]: Match[]; },
  mandatoryDays: number[],
  ageClasses: AgeClass[]
): { [id: string]: any; } {
  const weekNumbers = Object.keys(groupedMatches);

  if (Object.keys(groupedMatches).length === 0) {
    return {};
  }

  const firstWeekNumber = parseInt(weekNumbers[0], 10);

  return {};
}

async function loadMatches(clubId: string, month: Month): Promise<Match[]> {
  const matchHtml = await fussballHtmlService.loadMatchplan(
    clubId,
    month
  );

  return fussballScraper.scrapeMatches(matchHtml);
}

async function createLatexMatchplan(clubId: string, month: Month) {
  const matches = await loadMatches(clubId, month);

  const teamnameBlacklist = ['Erfurt'];
  const agegroupIgnorelist = ['Herren'];

  const matchData: any[] = matches.map(
    (match) => {
      const date = Moment(match.date);
      return {
        guest: teamnameShortener(match.guest.name, teamnameBlacklist),
        home: teamnameShortener(match.home.name, teamnameBlacklist),
        prefix: createPrefix(match.home, agegroupIgnorelist),
        subtitle: date.format('LLLL') + ' Uhr'
      };
    }
  );

  return Mustache.render(matchplanTemplate, { matches: matchData});
}

async function createLatexMatchtable(clubId: string, month: Month, clubNameSelector: string, ageClasses: AgeClass[]) {
  const matches = await loadMatches(clubId, month);
  const teamnameBlacklist = ['Erfurt'];
  const weeklyGroupedMatches: { [id: string]: Match[]; } = groupMatchesByWeekNumber(matches);
  const dailyBuckets = createDailyBuckets(weeklyGroupedMatches, [4, 5, 6]);

  console.log(dailyBuckets);

  // return Mustache.render(matchtableTemplate, { weeks: weekData});
}

const hochstedtClubId = '00ES8GNC6K000035VV0AG08LVUPGND5I';
const hochstedtClubNameSelector = "Hochstedt";
const hochstedtAgeClasses = [
  new AgeClass("Herren", "I"),
  new AgeClass("Herren", "II"),
  new AgeClass("D-Junioren"),
  new AgeClass("E-Junioren"),
  new AgeClass("F-Junioren", "I"),
  new AgeClass("F-Junioren", "II"),
  new AgeClass("G-Junioren")
];

createLatexMatchplan(hochstedtClubId, Month.March).then(
  (matchplanLatexString) => console.log(matchplanLatexString)
);

createLatexMatchtable(hochstedtClubId, Month.April, hochstedtClubNameSelector, hochstedtAgeClasses).then(
  (matchtableLatexString) => console.log("Hallo Welt")
);
