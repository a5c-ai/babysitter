/**
 * Interaction scenarios.
 *
 * The mock process emits a prompt-style line then waits for stdin. When
 * running in the CLI binary, three approval modes are exposed:
 *
 *   - yolo:   auto-respond "y" with no user prompt
 *   - prompt: emit a question, wait for user to write y/n on stdin
 *   - deny:   auto-respond "n"
 *
 * The scenario's `interactions` field configures which auto-response the
 * MockProcess fires when it sees the prompt pattern.
 */

import type { HarnessScenario, StdinInteraction } from '../types.js';
import { claudeSystemInit, claudeAssistantText, claudeResult, stderrChunk, stdoutChunk } from './wire-format.js';

export type InteractionMode = 'yolo' | 'prompt' | 'deny' | 'timeout';

export function buildInteractiveScenario(mode: InteractionMode): HarnessScenario {
  const prompt = 'Do you want to allow this tool call? (y/n)';
  const response = mode === 'yolo' ? 'y\n' : mode === 'deny' ? 'n\n' : '';

  const output = [
    stdoutChunk(claudeSystemInit('sess_interact', ['Write']), 5),
    stdoutChunk(claudeAssistantText('I need to write a file.'), 10),
    stderrChunk(prompt + '\n', 10),
  ];

  const interaction: StdinInteraction = {
    triggerPattern: 'Do you want to allow',
    response,
    delayMs: 20,
    timeoutMs: mode === 'timeout' ? 80 : undefined,
    onAllow: {
      output: [
        stdoutChunk(claudeResult('sess_interact', 'done'), 0),
      ],
      exitCode: 0,
    },
    onDeny: {
      output: [
        stdoutChunk(claudeAssistantText('Tool call denied.'), 0),
      ],
      exitCode: 0,
    },
    onTimeout: {
      output: [
        stderrChunk('Approval timed out.\n', 0),
      ],
      exitCode: 1,
    },
  };

  const base: HarnessScenario = {
    harness: 'claude-code',
    name: `interactive:${mode}`,
    process: { exitCode: mode === 'timeout' ? 1 : 0, shutdownDelayMs: 50 },
    output,
    interactions: [interaction],
  };
  if (mode === 'prompt' || mode === 'timeout') {
    base.interactions = [{ ...interaction, response: '' }];
  }
  return base;
}

export const INTERACTION_SCENARIOS: Record<InteractionMode, HarnessScenario> = {
  yolo: buildInteractiveScenario('yolo'),
  prompt: buildInteractiveScenario('prompt'),
  deny: buildInteractiveScenario('deny'),
  timeout: buildInteractiveScenario('timeout'),
};
