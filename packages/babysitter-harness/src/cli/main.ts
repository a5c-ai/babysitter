#!/usr/bin/env node
import { executeHarnessCliCommand, formatHarnessHelp } from "./dispatch";
import { parseHarnessArgs } from "./args";
import { outputError } from "./ui";

export function createBabysitterHarnessCli() {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      let parsedJson = false;
      let parsedVerbose = false;
      try {
        const parsed = parseHarnessArgs(argv);
        parsedJson = parsed.json;
        parsedVerbose = parsed.verbose;
        return await executeHarnessCliCommand(parsed);
      } catch (error) {
        outputError(error instanceof Error ? error : new Error(String(error)), {
          json: parsedJson,
          verbose: parsedVerbose,
        });
        return 1;
      }
    },
    formatHelp(): string {
      return formatHarnessHelp("agent");
    },
    formatHumanHelp(): string {
      return formatHarnessHelp("human");
    },
  };
}

if (require.main === module) {
  void createBabysitterHarnessCli()
    .run()
    .then((code) => {
      process.exitCode = code;
    });
}
