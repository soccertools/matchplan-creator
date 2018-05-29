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

function createPrefix(team: Team) {
  const blacklist = ['Herren'];

  if (blacklist.indexOf(team.type) !== -1) {
    return "";
  } else {
    return team.type + ":";
  }
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

  const matchData: any[] = matches.map(
    (match) => {
      const date = Moment(match.date);
      return {
        guest: teamnameShortener(match.guest.name, teamnameBlacklist),
        home: teamnameShortener(match.home.name, teamnameBlacklist),
        prefix: createPrefix(match.home),
        subtitle: date.format('LLLL') + ' Uhr'
      };
    }
  );

  return Mustache.render(matchplanTemplate, { matches: matchData});
}

async function createLatexMatchtable(clubId: string, month: Month) {
  const matches = await loadMatches(clubId, month);

  const teamnameBlacklist = ['Erfurt'];

  const weekData: { [id: string]: Match[]; }   = matches.reduce(
    (groups, match) => {
      const key = match.date.getMonth() + '-' + match.date.getDate();
      // make sure array for that day exists
      if (groups[key] === undefined) {
        groups[key] = [];
      }
      // insert into bucket
      groups[key].push(match);

      return groups;
    }
  , {});

  console.log(weekData);

  // return Mustache.render(matchtableTemplate, { weeks: weekData});
}

const hochstedtClubId = '00ES8GNC6K000035VV0AG08LVUPGND5I';

createLatexMatchplan(hochstedtClubId, Month.March).then(
  (matchplanLatexString) => console.log(matchplanLatexString)
);

createLatexMatchtable(hochstedtClubId, Month.April).then(
  (matchtableLatexString) => console.log("Hallo Welt")
);
