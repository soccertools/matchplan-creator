import * as program from "commander";
import * as fs from "fs";
import { HttpClient } from "typed-rest-client/HttpClient";
import * as YAML from "yaml";
import { LatexGenerator } from "./latex-generator.interface";
import { MatchService } from "./match-service";
import { MatchlistGenerator } from "./matchlist.generator";
import { MatchplanUtilites } from "./matchplan-utilities";

export class AppWrapper {

  constructor(
    private cliArguments: string[],
    private matchService: MatchService
  ) {
    //
  }

  public run() {
    const cli = program
      .version('1.0.0')
      .arguments('<yamlConfig> <month>')
      .action(
        (yamlConfigurationLocation: string, nameOfMonth: string, env: any) => {
          const yamlFileContent: string = fs.readFileSync(yamlConfigurationLocation, 'utf8');

          const configuration = YAML.parse(yamlFileContent);
          if (!configuration.matchplan) {
            throw new Error('configuration is missing property "matchplan"');
          }
          const month = MatchplanUtilites.getMonthFromName(nameOfMonth);

          let generator: LatexGenerator;

          if (configuration.matchplan.type === 'list') {
            generator = new MatchlistGenerator();
          }

          if (!generator) {
            throw new Error('no suitable generator found for this config');
          }

          this.matchService.loadMatches(
            configuration.matchplan.club.id,
            month
          ).then(
            (matches) => {
              console.log(
                "output in latex",
                generator.generate(matches, configuration.matchplan)
              );
            }
          );

        }
      );
    cli.parse(this.cliArguments);
  }

}