import "jasmine";
import { teamnameMinifier } from "./teamname-minifier";

describe('TeamnameMinifier', () => {
  it('should minify names with long prefix', () => {
    const teamname = "Sport-Freunde Musterbach";
    const expectedAbbreviation = "Musterbach";

    expect(teamnameMinifier(teamname, [], [])).toBe(expectedAbbreviation);
  });

  it('should prefer non blacklisted terms', () => {
    const blacklist = ['Musterbach'];
    const teamname = "Sportfreunde Musterbach";
    const expectedAbbreviation = "Sportfreunde";

    expect(teamnameMinifier(teamname, blacklist, [])).toBe(expectedAbbreviation);
  });

  it('should cut names with more than 12 characters', () => {
    const teamname = "SV Any VeryLongClubName";
    const expectedAbbreviation = "VeryLongClu.";

    expect(teamnameMinifier(teamname, [], [])).toBe(expectedAbbreviation);
  });

  it('should cut names if all parts are blacklisted', () => {
    const blacklist = ['Sport-Freunde', 'Musterbach'];
    const teamname = "Sport-Freunde Musterbach";
    const expectedAbbreviation = "Spo. Mus.";

    expect(teamnameMinifier(teamname, blacklist, [])).toBe(expectedAbbreviation);
  });

  it('should prefer first part of slash connected terms', () => {
    const teamname = "SV Diesesdorf/Jenesdorf";
    const expectedAbbreviation = "Diesesdorf";

    expect(teamnameMinifier(teamname, [], [])).toBe(expectedAbbreviation);
  });

  it('should prefer first part of hyphen connected terms', () => {
    const teamname = "SV Diesesdorf-Jenesdorf";
    const expectedAbbreviation = "Diesesdorf";

    expect(teamnameMinifier(teamname, [], [])).toBe(expectedAbbreviation);
  });

});
