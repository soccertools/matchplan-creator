#!/usr/bin/env node

import { FussballHtmlService, FussballScraper } from 'scraperlib';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { AppWrapper } from './app-wrapper';
import { MatchService } from './match.service';

const httpClient = new HttpClient('some useragent');
const fussballHtmlService = new FussballHtmlService(httpClient);
const fussballScraper = new FussballScraper();
const matchService = new MatchService(fussballHtmlService, fussballScraper);

const app = new AppWrapper(process.argv, matchService);

app.run();
