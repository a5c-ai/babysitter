import { getAdapterByName } from "../../harness";
import type {
  HarnessAdapter,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "../../harness";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  formatErrorWithContext,
  toStructuredError,
} from "../../runtime/exceptions";

export interface HarnessInstallCommandArgs extends HarnessInstallOptions {
  harnessName?: string;
}

function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return Boolean(process.stderr?.isTTY);
}

function formatInstallResult(payload: HarnessInstallResult, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.warning) {
    console.log(`Warning: ${payload.warning}`);
  }
  if (payload.summary) {
    console.log(payload.summary);
  }
  if (payload.command) {
    console.log(`Command: ${payload.command}`);
  }
  if (payload.output) {
    console.log(payload.output);
  }
  if (payload.location) {
    console.log(`Location: ${payload.location}`);
  }
}

function requireHarnessName(
  harnessName: string | undefined,
  commandName: string,
): string {
  if (!harnessName) {
    throw new BabysitterRuntimeError(
      "MissingArgument",
      `${commandName} requires a harness name as the first argument`,
      {
        category: ErrorCategory.Validation,
        suggestions: [`babysitter ${commandName} codex`],
      },
    );
  }
  return harnessName;
}

function requireInstallMethod(
  harnessName: string,
  commandName: string,
  kind: "installHarness" | "installPlugin",
): {
  adapter: HarnessAdapter;
  run: (options: HarnessInstallOptions) => Promise<HarnessInstallResult>;
} {
  const adapter = getAdapterByName(harnessName);
  if (!adapter) {
    throw new BabysitterRuntimeError(
      "UnsupportedHarnessInstall",
      `${commandName} does not support "${harnessName}" yet.`,
      {
        category: ErrorCategory.Validation,
        suggestions: [
          "Supported harnesses: claude-code, codex, gemini-cli, pi, oh-my-pi",
        ],
      },
    );
  }

  const run = adapter[kind];
  if (!run) {
    throw new BabysitterRuntimeError(
      "UnsupportedHarnessInstall",
      `${commandName} does not support "${harnessName}" yet.`,
      {
        category: ErrorCategory.Validation,
        suggestions: [
          "Supported harnesses: claude-code, codex, gemini-cli, pi, oh-my-pi",
        ],
      },
    );
  }

  return {
    adapter,
    run: run.bind(adapter) as (options: HarnessInstallOptions) => Promise<HarnessInstallResult>,
  };
}

export async function handleHarnessInstall(args: HarnessInstallCommandArgs): Promise<number> {
  const harnessName = requireHarnessName(args.harnessName, "harness:install");
  const { run } = requireInstallMethod(harnessName, "harness:install", "installHarness");
  const result = await run(args);
  formatInstallResult(result, args.json);
  return 0;
}

export async function handleHarnessInstallPlugin(args: HarnessInstallCommandArgs): Promise<number> {
  const harnessName = requireHarnessName(args.harnessName, "harness:install-plugin");
  const { run } = requireInstallMethod(harnessName, "harness:install-plugin", "installPlugin");
  const result = await run(args);
  formatInstallResult(result, args.json);
  return 0;
}

export function formatHarnessInstallError(error: unknown, json: boolean): number {
  const err = error instanceof Error
    ? error
    : new Error(String(error));

  if (json) {
    console.error(JSON.stringify(toStructuredError(err), null, 2));
  } else {
    console.error(formatErrorWithContext(err, { colors: supportsColors() }));
  }
  return 1;
}
