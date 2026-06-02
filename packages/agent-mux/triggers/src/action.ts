import { spawn } from 'node:child_process';
import { evaluateTrigger } from './query.js';
import { enrichEvent } from './enrich.js';
import type { TriggerEvaluation } from './types.js';

export interface ActionOptions {
  backend?: string;
  eventName?: string;
  eventPath?: string;
  query?: string;
  includeDiff?: boolean;
  githubToken?: string;
}

export async function evaluateActionTrigger(options: ActionOptions = {}): Promise<TriggerEvaluation> {
  const event = await enrichEvent({
    backend: options.backend as any,
    eventName: options.eventName,
    eventPath: options.eventPath,
    token: options.githubToken,
    includeDiff: options.includeDiff,
  });
  return evaluateTrigger(event, options.query);
}

export interface CommandResult {
  code: number;
  signal: NodeJS.Signals | null;
}

export function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
}
