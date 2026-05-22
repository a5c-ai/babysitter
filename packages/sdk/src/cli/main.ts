#!/usr/bin/env node
import { executeCliCommand, handleCliError } from "./main/dispatch";
import { parseArgs, resolveRunDir, collapseDoubledA5cRuns } from "./main/args";
import { formatUsage } from "./main/usage";
import { CORE_PROGRAM, type CliProgram } from "./main/program";

export { resolveRunDir as _resolveRunDir, collapseDoubledA5cRuns as _collapseDoubledA5cRuns };
export { BOOLEAN_FLAGS, FLAG_PARSERS } from "./main/argFlags";
export { applyPositionalArgs } from "./main/argPositionals";
export type { ParsedArgs } from "./main/types";

export function createBabysitterCli(program: CliProgram = CORE_PROGRAM) {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      let parsedJson = false;
      let parsedVerbose = false;
      try {
        const parsed = parseArgs(argv);
        parsedJson = parsed.json;
        parsedVerbose = parsed.verbose;
        return await executeCliCommand(parsed, program);
      } catch (error) {
        return handleCliError(error, parsedJson, parsedVerbose);
      }
    },
    formatHelp(): string {
      return formatUsage("agent", program);
    },
    formatHumanHelp(): string {
      return formatUsage("human", program);
    },
  };
}

if (require.main === module) {
  createBabysitterCli()
    .run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
