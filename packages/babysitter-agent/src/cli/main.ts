#!/usr/bin/env node
import { executeAgentCliCommand, formatAgentHelp } from "./dispatch";
import { parseHarnessArgs } from "./args";
import { outputError } from "./ui";

export function createBabysitterAgentCli() {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      let parsedJson = false;
      let parsedVerbose = false;
      try {
        const parsed = parseHarnessArgs(argv);
        parsedJson = parsed.json;
        parsedVerbose = parsed.verbose;
        return await executeAgentCliCommand(parsed);
      } catch (error) {
        outputError(error instanceof Error ? error : new Error(String(error)), {
          json: parsedJson,
          verbose: parsedVerbose,
        });
        return 1;
      }
    },
    formatHelp(): string {
      return formatAgentHelp("agent");
    },
    formatHumanHelp(): string {
      return formatAgentHelp("human");
    },
  };
}

if (require.main === module) {
  void createBabysitterAgentCli()
    .run()
    .then((code) => {
      process.exitCode = code;
    });
}
