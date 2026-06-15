/**
 * Governance policy decision audit logging (GAP-SEC-001).
 * Appends decisions to a JSONL file for audit trail.
 * Uses async handle-based I/O with fsync for crash safety.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { PolicyDecisionLog } from './types';

const LOG_FILENAME = 'governance-decisions.jsonl';

/**
 * Append a policy decision to the audit log.
 * Uses handle-based async I/O with fsync for crash safety.
 */
export async function logPolicyDecision(logDir: string, entry: PolicyDecisionLog): Promise<void> {
  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, LOG_FILENAME);
  const line = JSON.stringify(entry) + '\n';
  const handle = await fs.open(logPath, 'a');
  try {
    await handle.writeFile(line, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/**
 * Read all policy decisions from the audit log.
 * Returns empty array if the file does not exist.
 * Throws on permission errors or other unexpected failures.
 */
export async function readPolicyDecisionLog(logDir: string): Promise<PolicyDecisionLog[]> {
  const logPath = path.join(logDir, LOG_FILENAME);
  try {
    const content = await fs.readFile(logPath, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as PolicyDecisionLog);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return [];
    throw error;
  }
}
