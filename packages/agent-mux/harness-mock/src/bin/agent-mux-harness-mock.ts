#!/usr/bin/env node
/**
 * agent-mux-harness-mock — CLI binary that replays a mock scenario to stdout/stderr.
 *
 * Flags:
 *   --scenario <name>    Scenario id (see `--list`).
 *   --agent <name>       Restrict resolution to a specific agent prefix.
 *   --delay <ms>         Per-chunk delay override.
 *   --stdin-echo         Echo stdin back to stdout (for interaction tests).
 *   --exit-code <n>      Force exit code after scenario finishes.
 *   --fail-after <n>     Exit with code n after emitting n output chunks.
 *   --list               Print scenario names and exit.
 */

import { resolveScenario, listScenarioNames } from '../scenarios/index.js';
import type { HarnessScenario } from '../types.js';
import { MockProcess } from '../mock-process.js';

interface Args {
  scenario?: string;
  agent?: string;
  delay?: number;
  stdinEcho: boolean;
  exitCode?: number;
  failAfter?: number;
  list: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): Args {
  const out: Args = { stdinEcho: false, list: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Missing value for ${a}`);
      return v;
    };
    switch (a) {
      case '--scenario': out.scenario = next(); break;
      case '--agent': out.agent = next(); break;
      case '--delay': out.delay = Number(next()); break;
      case '--stdin-echo': out.stdinEcho = true; break;
      case '--exit-code': out.exitCode = Number(next()); break;
      case '--fail-after': out.failAfter = Number(next()); break;
      case '--list': out.list = true; break;
      case '-h':
      case '--help': out.help = true; break;
      default:
        if (a && a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    }
  }
  return out;
}

export function applyOverrides(scenario: HarnessScenario, args: Args): HarnessScenario {
  const baseProcess = scenario.process ?? { exitCode: 0 };
  const out: HarnessScenario = {
    ...scenario,
    output: (scenario.output ?? []).map((c) => ({ ...c, delayMs: args.delay ?? c.delayMs })),
    process: { ...baseProcess, exitCode: baseProcess.exitCode ?? 0 },
  };
  if (args.exitCode !== undefined && Number.isFinite(args.exitCode)) {
    out.process = { ...out.process!, exitCode: args.exitCode };
  }
  if (args.failAfter !== undefined && Number.isFinite(args.failAfter)) {
    out.output = (out.output ?? []).slice(0, args.failAfter);
    out.process = { ...out.process!, exitCode: out.process?.exitCode || 1 };
  }
  return out;
}

export async function runMockHarness(
  args: Args,
  streams: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream; stdin?: NodeJS.ReadableStream } =
    { stdout: process.stdout, stderr: process.stderr, stdin: process.stdin },
): Promise<number> {
  if (args.help) {
    streams.stderr.write(helpText());
    return 0;
  }
  if (args.list) {
    for (const n of listScenarioNames(args.agent)) streams.stdout.write(n + '\n');
    return 0;
  }
  if (!args.scenario) {
    streams.stderr.write('error: --scenario is required (use --list)\n');
    return 2;
  }
  const resolved = resolveScenario(args.scenario, args.agent);
  if (!resolved) {
    streams.stderr.write(`error: unknown scenario: ${args.scenario}\n`);
    return 2;
  }
  const scenario = applyOverrides(resolved, args);

  // Stdin echo: pipe stdin lines straight to stdout so interaction tests
  // can verify which approval response arrived.
  if (args.stdinEcho && streams.stdin) {
    streams.stdin.on('data', (chunk: Buffer | string) => {
      const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      streams.stdout.write(`stdin:${s}`);
    });
  }

  const proc = new MockProcess(scenario);
  proc.on('stdout', (data: string) => streams.stdout.write(data));
  proc.on('stderr', (data: string) => streams.stderr.write(data));
  if (streams.stdin) {
    streams.stdin.on('data', (chunk: Buffer | string) => {
      const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      proc.write(s);
    });
  }
  proc.start();
  const result = await proc.waitForExit();
  return result.exitCode;
}

function helpText(): string {
  return [
    'agent-mux-harness-mock — replay a mock agent scenario.',
    '',
    'Usage: agent-mux-harness-mock --scenario <name> [--agent <name>] [flags]',
    '',
    'Flags:',
    '  --scenario <name>   Scenario id (try --list); bare names resolve within --agent',
    '  --agent <name>      Restrict --list and scenario lookup to <name>:*',
    '  --delay <ms>        Override per-chunk delay',
    '  --stdin-echo        Echo stdin back to stdout',
    '  --exit-code <n>     Force process exit code',
    '  --fail-after <n>    Truncate scenario to n chunks and fail',
    '  --list              List scenario names (filtered by --agent)',
    '  -h, --help          Show this help',
    '',
  ].join('\n');
}

// Entrypoint guard — invoked only when executed as a script.
const invokedAsScript = (() => {
  try {
    const argv1 = process.argv[1];
    if (!argv1) return false;
    // Match on known filename fragment rather than import.meta.url, which
    // requires ESM-only syntax that plays poorly with the tsconfig setup.
    return /agent-mux-harness-mock(\.js|\.ts)?$/.test(argv1);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  const args = parseArgs(process.argv.slice(2));
  runMockHarness(args).then(
    (code) => { process.exit(code); },
    (err) => {
      process.stderr.write(`agent-mux-harness-mock failed: ${(err as Error).message}\n`);
      process.exit(1);
    },
  );
}
