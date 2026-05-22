import { formatHarnessInstallError } from "../commands/harness/install";
import { executeHarnessInfraCommand } from "./dispatchHarness";
import { executeRunSessionCommand } from "./dispatchRunSession";
import type { ParsedArgs } from "./types";
import { formatUsage } from "./usage";
import { CORE_PROGRAM, getValidCommands, type CliProgram } from "./program";
import {
  handleUnknownCommand,
  outputError,
  readCliVersion,
  showConfigBeforeCommand,
} from "./ui";
import { BabysitterRuntimeError } from "../../runtime/exceptions";

export async function executeCliCommand(parsed: ParsedArgs, program: CliProgram = CORE_PROGRAM): Promise<number> {
  if (parsed.command === "version") {
    console.log(await readCliVersion());
    return 0;
  }
  if (!parsed.command || parsed.helpRequested) {
    console.log(formatUsage(parsed.helpSurface, program));
    return 0;
  }
  if (parsed.showConfig) {
    showConfigBeforeCommand(parsed);
  }
  const validCommands = getValidCommands(program.variant);
  if (!validCommands.includes(parsed.command)) {
    return handleUnknownCommand(parsed.command, parsed.json, program);
  }

  const runSessionResult = await executeRunSessionCommand(parsed);
  if (runSessionResult !== undefined) {
    return runSessionResult;
  }
  const harnessResult = await executeHarnessInfraCommand(parsed);
  if (harnessResult !== undefined) {
    return harnessResult;
  }
  return handleUnknownCommand(parsed.command, parsed.json, program);
}

export function handleCliError(error: unknown, parsedJson: boolean, parsedVerbose: boolean): number {
  if (parsedJson && error instanceof BabysitterRuntimeError && error.name === "UnsupportedHarnessInstall") {
    return formatHarnessInstallError(error, true);
  }
  outputError(error instanceof Error ? error : new Error(String(error)), { json: parsedJson, verbose: parsedVerbose });
  return 1;
}
