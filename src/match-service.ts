import { FussballHtmlService, FussballScraper, Match, Month } from "scraperlib";

export class MatchService {
  constructor(
    private fussballHtmlService: FussballHtmlService,
    private fussballScraper: FussballScraper
  ) {
    //
  }

  public async loadMatches(clubId: string, month: Month): Promise<Match[]> {
    const matchHtml = await this.fussballHtmlService.loadMatchplan(
      clubId,
      month
    );

    return this.fussballScraper.scrapeMatches(matchHtml);
  }
}
