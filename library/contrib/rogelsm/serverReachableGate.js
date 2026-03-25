/**
 * @module contrib/rogelsm/serverReachableGate
 * @description Zero-token shell task factory that hard-fails if the dev server is unreachable.
 * Designed as Phase 0 for bugfix processes to prevent misdiagnosis when dev environment is down.
 *
 * Usage:
 *   import { serverReachableGate } from './serverReachableGate.js';
 *   // In your process tasks array:
 *   serverReachableGate(3010),  // checks localhost:3010
 *
 * @see https://github.com/a5c-ai/babysitter/issues/70
 * @see https://github.com/a5c-ai/babysitter/issues/71
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Hard shell gate: dev server must be reachable.
 * Zero tokens — instant fail if server is down.
 *
 * @param {number} [port=3010] - Port to check
 * @returns {TaskDefinition}
 */
export function serverReachableGate(port = 3010) {
  return defineTask({
    name: 'server-reachable-gate',
    kind: 'shell',
    command: `curl -sf http://localhost:${port} -o /dev/null`,
    expectedExitCode: 0,
    description:
      `Hard gate: dev server must be reachable at http://localhost:${port}. ` +
      'If this fails, run your dev server startup script before proceeding with diagnosis.',
  });
}
