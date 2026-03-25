/**
 * @module shared/common
 * @description Shared reusable task definitions for the trip-planner process library.
 *
 * Exports factory functions that create task definitions. All factories accept
 * projectDir to avoid hardcoded paths. Import and spread into process task arrays.
 *
 * Usage:
 *   import { tsCheckTask, permissionAuditTask } from './shared/common.js';
 *
 *   export async function process(args) {
 *     return {
 *       tasks: [
 *         // ... your tasks ...
 *         tsCheckTask(args.projectDir),
 *         permissionAuditTask(args.projectDir),
 *       ]
 *     };
 *   }
 *
 * @see .a5c/processes/PROCESS-GUIDE.md for usage guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Hard TypeScript compilation gate.
 *
 * Uses a shell task (not agent) so the run fails on non-zero exit code.
 * Must be placed after all code changes, before browser/functional verification.
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @returns {TaskDefinition}
 */
export function tsCheckTask(projectDir) {
  return defineTask({
    name: 'typescript-check',
    kind: 'shell',
    command: `cd '${projectDir}' && PATH=/Users/rogelsm/.nvm/versions/node/v22.18.0/bin:$PATH npx tsc --noEmit 2>&1`,
    expectedExitCode: 0,
    description:
      'Hard TypeScript gate. Run fails if the project has compilation errors. ' +
      'Never embed tsc instructions inside agent prompts — use this shell task instead.',
  });
}

/**
 * Development environment health check.
 *
 * Verifies that the full dev stack is healthy before or after infra work.
 * Checks: PostgreSQL socket, /tmp/trip-planner-dev structure,
 * Prisma generated client, server CWD, and HTTP 200 from dashboard.
 *
 * @param {string} projectDir - Absolute path to the project directory (used as context).
 * @returns {TaskDefinition}
 */
export function devHealthCheckTask(projectDir) {
  return defineTask({
    name: 'dev-health-check',
    kind: 'agent',
    description:
      'Verify the development environment is fully healthy. ' +
      'Run these checks and report pass/fail for each:\n' +
      '1. PostgreSQL socket exists: ls /tmp/.s.PGSQL.* (must find at least one socket)\n' +
      '2. Dev directory exists: ls /tmp/trip-planner-dev (must exist with expected structure)\n' +
      '3. Prisma client is generated: ls /tmp/trip-planner-dev/src/generated/prisma/ (must exist)\n' +
      '4. Dev server process CWD: run `ps aux | grep "next dev" | grep -v grep` — ' +
      '   the server MUST be running from /tmp/trip-planner-dev, NOT from the project root ' +
      `   (${projectDir}). If running from the wrong CWD, this is a critical failure.\n` +
      '5. Dashboard HTTP response: curl -s -o /dev/null -w "%{http_code}" http://localhost:3010 ' +
      '   (must return 200)\n\n' +
      'Output schema: { healthy: boolean, checks: [{name, passed, detail}], remediationHints: string[] }\n' +
      'If any check fails, populate remediationHints with actionable remediation steps.',
    outputSchema: {
      healthy: 'boolean',
      checks: [{ name: 'string', passed: 'boolean', detail: 'string' }],
      remediationHints: ['string'],
    },
  });
}

/**
 * Role-based permission audit for auth-gated UI components.
 *
 * Required for any process that touches trip cards, dashboard components,
 * or any file containing isOwner / canEdit / collaboratorRole / role === 'ADMIN'.
 *
 * Test accounts:
 *   viewer:  alice@test.com / password123
 *   admin:   admin@test.com / password123
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @returns {TaskDefinition}
 */
export function permissionAuditTask(projectDir) {
  return defineTask({
    name: 'permission-audit',
    kind: 'agent',
    description:
      'Perform a role-based permission audit on the dashboard and trip card components. ' +
      `Project directory: ${projectDir}\n\n` +
      'Test the following scenarios in order:\n\n' +
      '1. VIEWER role (alice@test.com / password123):\n' +
      '   - Log in and navigate to the dashboard\n' +
      '   - Verify: delete and archive actions are NOT visible on any trip card\n' +
      '   - Verify: "Plan" and "Edit" buttons are NOT visible\n' +
      '   - Verify: shared/collaborative trips appear correctly\n\n' +
      '2. ADMIN role (admin@test.com / password123):\n' +
      '   - Log in and navigate to the dashboard\n' +
      '   - Verify: admin can see all trips in the dashboard\n' +
      '   - Verify: admin-only destructive actions (delete) are gated by ownership, ' +
      '     not just admin role\n\n' +
      'For each check, report whether it passed and any observed failure details.\n\n' +
      'Output schema: { passed: boolean, failures: string[], testedRoles: string[] }',
    outputSchema: {
      passed: 'boolean',
      failures: ['string'],
      testedRoles: ['string'],
    },
  });
}

/**
 * Parameterized browser verification task.
 *
 * Use for functional verification of any UI feature. Pass a URL and a
 * list of checks to verify. Returns structured pass/fail results.
 *
 * @param {string} projectDir - Absolute path to the project directory.
 * @param {string} url - URL to navigate to (e.g. 'http://localhost:3010/trips/1').
 * @param {string[]} checks - Array of check descriptions to verify.
 * @returns {TaskDefinition}
 */
export function browserVerifyTask(projectDir, url, checks) {
  const checkList = checks.map((c, i) => `${i + 1}. ${c}`).join('\n');
  return defineTask({
    name: 'browser-verify',
    kind: 'agent',
    description:
      `Navigate to ${url} and verify the following checks:\n\n` +
      `${checkList}\n\n` +
      `Project directory: ${projectDir}\n\n` +
      'For each check, report whether it passed and include relevant details or ' +
      'screenshots if a check fails.\n\n' +
      'Output schema: { passed: boolean, checkResults: [{check, passed, detail}] }',
    outputSchema: {
      passed: 'boolean',
      checkResults: [{ check: 'string', passed: 'boolean', detail: 'string' }],
    },
  });
}
