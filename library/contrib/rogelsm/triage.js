/**
 * @process triage
 * @description Lightweight triage process to classify incoming issues before routing
 * to a specialized process (generic-bugfix, infra-diagnostic, generic-feature, etc.).
 *
 * Structure: 2 phases
 *   Phase 1: Health check (dev environment reachability)
 *   Phase 2: Categorize (agent classifies the issue and recommends a process)
 *
 * @inputs
 *   port {number} - Port the dev server listens on (default: 3010)
 *   projectDir {string} - Absolute path to the project directory
 *   issueDescription {string} - Plain-English description of the issue
 *
 * @outputs
 *   healthCheck: pass/fail from the server reachable gate
 *   category: { issueType, confidence, recommendedProcess, reasoning }
 *
 * @agent triage-analyst (Phase 2)
 *
 * @see ./serverReachableGate.js
 * @see https://github.com/a5c-ai/babysitter/issues/70
 * @see https://github.com/a5c-ai/babysitter/issues/71
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { serverReachableGate } from './serverReachableGate.js';

/**
 * @param {{ port?: number, projectDir: string, issueDescription: string }} args
 */
export async function process(args) {
  const { port = 3010, projectDir, issueDescription } = args;

  return {
    tasks: [
      // ── Phase 1: Health check ───────────────────────────────────────────────
      serverReachableGate(port),

      // ── Phase 2: Categorize ─────────────────────────────────────────────────
      defineTask({
        name: 'categorize',
        kind: 'agent',
        role: 'triage-analyst',
        description:
          `Classify the following issue and recommend which process template to use.\n\n` +
          `Issue description: ${issueDescription}\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `Available process templates:\n` +
          `  - generic-bugfix: For application-level bugs (UI glitches, logic errors, data issues)\n` +
          `  - infra-diagnostic: For infrastructure issues (server won't start, DB down, /tmp wiped, ` +
          `    Prisma errors, port conflicts)\n` +
          `  - generic-feature: For new feature implementation or enhancements\n\n` +
          `Classification steps:\n` +
          `1. Read the issue description carefully\n` +
          `2. Check the health check results from Phase 1 — if the dev stack is unhealthy, ` +
          `   the issue is likely infra regardless of how it was described\n` +
          `3. Determine the issue type: "bug", "infrastructure", or "feature"\n` +
          `4. Recommend the appropriate process template\n` +
          `5. Provide reasoning for the classification\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  issueType: string,          // "bug" | "infrastructure" | "feature"\n` +
          `  confidence: string,         // "high" | "medium" | "low"\n` +
          `  recommendedProcess: string, // "generic-bugfix" | "infra-diagnostic" | "generic-feature"\n` +
          `  reasoning: string           // why this classification was chosen\n` +
          `}`,
        outputSchema: {
          issueType: 'string',
          confidence: 'string',
          recommendedProcess: 'string',
          reasoning: 'string',
        },
      }),
    ],
  };
}
