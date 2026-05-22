import { spawn } from 'node:child_process';

import type { CostRecord, Spawner } from '@a5c-ai/agent-mux-core';

/**
 * Default Spawner that runs the command via `child_process.spawn`, capturing
 * stdout/stderr. `shell: false`, `windowsHide: true`.
 */
export const defaultSpawner: Spawner = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      env: options?.env ? { ...process.env, ...options.env } : process.env,
      cwd: options?.cwd,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (c: string) => { stdout += c; });
    child.stderr?.on('data', (c: string) => { stderr += c; });
    child.on('error', (err) => reject(err));
    child.on('exit', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });

export function assembleCostRecord(raw: unknown): CostRecord | null {
  if (raw == null || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  const totalUsd = extractNumber(obj, ['totalUsd', 'total_usd', 'cost', 'total_cost', 'totalCost']) ?? 0;
  const inputTokens = extractNumber(obj, ['inputTokens', 'input_tokens', 'prompt_tokens']) ?? 0;
  const outputTokens = extractNumber(obj, ['outputTokens', 'output_tokens', 'completion_tokens']) ?? 0;
  const thinkingTokens = extractNumber(obj, ['thinkingTokens', 'thinking_tokens', 'reasoning_tokens']);
  const cacheCreationTokens = extractNumber(obj, ['cacheCreationTokens', 'cache_creation_tokens', 'cache_write_tokens']);
  const cacheReadTokens = extractNumber(obj, ['cacheReadTokens', 'cache_read_tokens', 'cache_read_input_tokens']);
  const cachedTokens = extractNumber(obj, ['cachedTokens', 'cached_tokens']) ??
    ((cacheCreationTokens != null && cacheReadTokens != null) ? cacheCreationTokens + cacheReadTokens : undefined);

  if (totalUsd === 0 && inputTokens === 0 && outputTokens === 0) return null;

  const record: CostRecord = {
    totalUsd,
    inputTokens,
    outputTokens,
  };

  if (thinkingTokens != null) record.thinkingTokens = thinkingTokens;
  if (cachedTokens != null) record.cachedTokens = cachedTokens;
  if (cacheCreationTokens != null) record.cacheCreationTokens = cacheCreationTokens;
  if (cacheReadTokens != null) record.cacheReadTokens = cacheReadTokens;

  return record;
}

function extractNumber(
  obj: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'object' && val !== null) {
      const nested = val as Record<string, unknown>;
      for (const nk of Object.keys(nested)) {
        const nv = nested[nk];
        if (typeof nv === 'number' && Number.isFinite(nv)) return nv;
      }
    }
  }
  return undefined;
}
