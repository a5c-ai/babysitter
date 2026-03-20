/**
 * @process infra-diagnostic
 * @description Shell-first infrastructure diagnostic and remediation template.
 * Always uses shell tasks for process management — never agent tasks for kill/rebuild.
 * Mandates CWD check for any running Next.js server in the very first diagnostic phase.
 *
 * Structure: 5 phases
 *   Phase 1: Shell env snapshot (ps aux, /tmp state, PG socket, server CWD check)
 *   Phase 2: Breakpoint — human reviews diagnostics before remediation begins
 *   Phase 3: Agent-led root cause investigation (reads logs, Prisma schema, env snapshot)
 *   Phase 4: Shell-based remediation (from correct /tmp/trip-planner-dev directory)
 *   Phase 5: Breakpoint — confirm environment is healthy
 *
 * Critical rule: Server MUST run from /tmp/trip-planner-dev, NOT from project root.
 * Missing this check in fix-db-v1 and fix-db-v2 caused 2 unnecessary extra runs.
 *
 * @inputs
 *   projectDir {string} - Absolute path to the project directory
 *   issueDescription {string} - Description of the infrastructure issue
 *
 * @outputs
 *   envSnapshot: shell output from Phase 1
 *   investigation: { rootCause, fixPlan } from Phase 3
 *   verification: shell output from Phase 4
 *
 * @agent backend-engineer (Phase 3)
 *
 * @see shared/common.js for devHealthCheckTask definition
 * @see .a5c/processes/PROCESS-GUIDE.md for infra session pre-flight guidance
 *
 * Evidence: fix-db took 3 runs (17.6 min total). Single well-designed run would
 * have taken ~8 min. Missing CWD check in first diagnostic caused 2 unnecessary
 * follow-up runs.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @param {{ projectDir: string, issueDescription: string }} args
 */
export async function process(args) {
  const { projectDir, issueDescription } = args;

  return {
    tasks: [
      // ── Phase 1: Shell environment snapshot ───────────────────────────────
      // This MUST be a shell task — deterministic, cannot hallucinate.
      defineTask({
        name: 'environment-snapshot',
        kind: 'shell',
        command: [
          // Clear any stale server first
          `echo '=== Clearing stale processes ==='`,
          `lsof -ti :3010 | xargs kill -9 2>/dev/null || echo 'No process on :3010'`,
          `sleep 2`,

          // Check all environmental factors
          `echo '=== Server CWD Check ==='`,
          `ps aux | grep 'next dev' | grep -v grep || echo 'No Next.js server running'`,

          `echo '=== /tmp/trip-planner-dev ==='`,
          `ls /tmp/trip-planner-dev 2>/dev/null || echo 'MISSING: /tmp/trip-planner-dev does not exist'`,

          `echo '=== PostgreSQL socket ==='`,
          `ls /tmp/.s.PGSQL.* 2>/dev/null || echo 'NO PG SOCKET: PostgreSQL not running'`,

          `echo '=== Prisma generated client ==='`,
          `ls /tmp/trip-planner-dev/src/generated/prisma/ 2>/dev/null || echo 'NOT GENERATED: Prisma client missing'`,

          `echo '=== Project root (should NOT be where server runs from) ==='`,
          `ls '${projectDir}' | head -10`,

          `echo '=== Environment snapshot complete ==='`,
        ].join(' && '),
        description:
          'Captures all environmental factors in one deterministic snapshot before investigation. ' +
          'CRITICAL: The server must run from /tmp/trip-planner-dev, NOT from the project root. ' +
          `Project root is: ${projectDir}`,
      }),

      // ── Phase 2: Breakpoint — review diagnostics ──────────────────────────
      defineTask({
        name: 'review-diagnostics',
        kind: 'breakpoint',
        description:
          'Review the environment snapshot output above.\n\n' +
          'Key things to confirm:\n' +
          '  1. If a Next.js server is running, note its CWD — it MUST be /tmp/trip-planner-dev\n' +
          '     If it is running from the project root, that is the root cause of Prisma errors\n' +
          '  2. PostgreSQL socket status — if missing, PG needs to be started\n' +
          '  3. /tmp/trip-planner-dev existence — if missing, the dev directory needs to be rebuilt\n' +
          '  4. Prisma generated client — if missing, npx prisma generate needs to run\n\n' +
          `Issue reported: ${issueDescription}\n\n` +
          'Based on the snapshot, does the diagnosis in Phase 3 seem necessary, or is the ' +
          'root cause already clear from the snapshot alone? ' +
          'Approve to proceed to agent investigation.',
      }),

      // ── Phase 3: Agent root cause investigation ────────────────────────────
      defineTask({
        name: 'investigate-root-cause',
        kind: 'agent',
        role: 'backend-engineer',
        description:
          `Investigate the root cause of this infrastructure issue:\n\n` +
          `Issue: ${issueDescription}\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `You have the environment snapshot from Phase 1. Use it as the primary input.\n\n` +
          `Additional investigation steps:\n` +
          `1. Read any relevant log files (if accessible)\n` +
          `2. Check the Prisma schema for any recent changes: ${projectDir}/prisma/schema.prisma\n` +
          `3. Check dev.sh for the startup procedure: ${projectDir}/dev.sh\n` +
          `4. If PG socket is missing, determine what PostgreSQL startup command is needed\n` +
          `5. If server was running from wrong CWD, explain WHY that would cause Prisma errors\n\n` +
          `Key context:\n` +
          `- Dev server MUST run from /tmp/trip-planner-dev (not ${projectDir})\n` +
          `- This is because Prisma client path resolution depends on CWD\n` +
          `- dev.sh at ${projectDir}/dev.sh contains the correct startup procedure\n` +
          `- PostgreSQL socket is expected at /tmp/.s.PGSQL.*\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  rootCause: string,   // precise description of what is wrong\n` +
          `  fixPlan: string      // step-by-step remediation plan using shell commands\n` +
          `}`,
        outputSchema: {
          rootCause: 'string',
          fixPlan: 'string',
        },
      }),

      // ── Phase 4: Shell remediation ─────────────────────────────────────────
      // Always uses shell tasks — never agent tasks — for process management.
      defineTask({
        name: 'remediate',
        kind: 'shell',
        command: [
          `echo '=== Starting remediation ==='`,

          // Ensure clean state: kill any lingering processes
          `lsof -ti :3010 | xargs kill -9 2>/dev/null || true`,
          `sleep 1`,

          // Sync project to /tmp/trip-planner-dev
          `echo '=== Syncing project to /tmp/trip-planner-dev ==='`,
          `mkdir -p /tmp/trip-planner-dev`,
          `rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' ` +
            `'${projectDir}/' /tmp/trip-planner-dev/`,

          // Install dependencies
          `echo '=== Installing dependencies ==='`,
          `cd /tmp/trip-planner-dev && PATH=/Users/rogelsm/.nvm/versions/node/v22.18.0/bin:$PATH npm install --silent`,

          // Generate Prisma client
          `echo '=== Generating Prisma client ==='`,
          `cd /tmp/trip-planner-dev && PATH=/Users/rogelsm/.nvm/versions/node/v22.18.0/bin:$PATH npx prisma generate`,

          // Start dev server FROM the correct directory
          `echo '=== Starting dev server from /tmp/trip-planner-dev ==='`,
          `cd /tmp/trip-planner-dev && PATH=/Users/rogelsm/.nvm/versions/node/v22.18.0/bin:$PATH nohup npm run dev > /tmp/next-dev.log 2>&1 &`,
          `sleep 5`,

          // Verify server is up
          `echo '=== Verifying server ==='`,
          `curl -s -o /dev/null -w "HTTP status: %{http_code}" http://localhost:3010 || echo 'Server not responding'`,

          `echo '=== Remediation complete ==='`,
        ].join(' && '),
        description:
          'Deterministic shell remediation: sync project, install, generate Prisma client, ' +
          'and start server from /tmp/trip-planner-dev. Never uses an agent for process management.',
      }),

      // ── Phase 5: Breakpoint — confirm healthy ──────────────────────────────
      defineTask({
        name: 'confirm-healthy',
        kind: 'breakpoint',
        description:
          'Review the remediation output above.\n\n' +
          'Confirm:\n' +
          '  1. The rsync completed without errors\n' +
          '  2. npm install completed\n' +
          '  3. Prisma generate completed\n' +
          '  4. The HTTP status from localhost:3010 is 200\n' +
          '  5. The server process is confirmed running from /tmp/trip-planner-dev\n\n' +
          'If the server is not responding or the HTTP status is not 200, reject and ' +
          'check /tmp/next-dev.log for errors. If everything is healthy, approve to complete.',
      }),
    ],
  };
}
