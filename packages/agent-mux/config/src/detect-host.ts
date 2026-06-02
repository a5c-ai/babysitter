/**
 * `amux detect-host` — detect whether the current process is running
 * under a supported agent harness.
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-comm';

import type { ParsedArgs } from './cli-helpers.js';
import { flagBool } from './cli-helpers.js';
import { ExitCode } from './cli-helpers.js';
import { printJsonOk, printKeyValue } from './cli-helpers.js';

export async function detectHostCommand(
  client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const info = client.detectHost();

  if (jsonMode) {
    printJsonOk({
      detected: info !== null,
      agent: info?.agent ?? null,
      confidence: info?.confidence ?? null,
      source: info?.source ?? null,
      matchedSignals: info?.matchedSignals ?? [],
    });
  } else if (info === null) {
    process.stdout.write('No host harness detected. This process appears to be running from a shell.\n');
  } else {
    printKeyValue([
      ['Host agent:', info.agent],
      ['Confidence:', info.confidence],
      ['Source:', info.source],
      ['Signals:', info.matchedSignals.join(', ') || '--'],
    ]);
  }
  return ExitCode.SUCCESS;
}
