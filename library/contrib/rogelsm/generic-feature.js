/**
 * @process generic-feature
 * @description Standard feature implementation template with built-in TypeScript
 * gate, conditional permission audit, and browser verification. Replaces all
 * feature processes that touch dashboard/card components without permission checks.
 *
 * Structure: 7 phases
 *   Phase 1: Analyze codebase and produce typed implementation plan
 *   Phase 2: Breakpoint — human reviews plan before implementation
 *   Phase 3: Implement the feature (references plan output)
 *   Phase 4: TypeScript check (hard shell gate — non-zero exit fails the run)
 *   Phase 5: Conditional permission audit (only if touchesAuthGatedComponents === true)
 *   Phase 6: Verify feature + browser check
 *   Phase 7: Breakpoint — human reviews outcome
 *
 * Auth-gated component definition (triggers Phase 5):
 *   Any file matching: **/dashboard/**, **/trips/[id]/**, BentoTripCard,
 *   DashboardClient, or any file containing isOwner, canEdit, collaboratorRole,
 *   or role === 'ADMIN'.
 *
 * @inputs
 *   projectDir {string} - Absolute path to the project directory
 *   featureDescription {string} - Plain-English description of the feature to build
 *
 * @outputs
 *   plan: { plan, filesToModify[], touchesAuthGatedComponents }
 *   verification: { passed, featureBehavior }
 *   permissionAudit: { passed, failures[] } (conditional)
 *
 * @agent fullstack-architect (Phase 1), nextjs-developer (Phase 3),
 *        security-reviewer (Phase 5), qa-engineer (Phase 6)
 *
 * @see shared/common.js for tsCheckTask and permissionAuditTask definitions
 * @see .a5c/processes/PROCESS-GUIDE.md for feature completion criteria
 *
 * Evidence: Post-bento 3 permission regressions (fix-delete-permissions,
 * fix-plan-button-visibility, admin-trip-access) — 33 minutes of rework
 * preventable with the Phase 5 permission audit.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { tsCheckTask, permissionAuditTask } from './common.js';

/**
 * @param {{ projectDir: string, featureDescription: string }} args
 */
export async function process(args) {
  const { projectDir, featureDescription } = args;

  return {
    tasks: [
      // ── Phase 1: Analyze and plan ──────────────────────────────────────────
      defineTask({
        name: 'analyze-and-plan',
        kind: 'agent',
        role: 'fullstack-architect',
        description:
          `Analyze the codebase and produce a detailed implementation plan for the ` +
          `following feature:\n\n` +
          `Feature: ${featureDescription}\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `Your analysis must cover:\n\n` +
          `1. Read all relevant existing files (components, API routes, types, Prisma schema)\n` +
          `2. Identify all files that will need to be created or modified\n` +
          `3. Design the data model changes (if any)\n` +
          `4. Design the API changes (if any)\n` +
          `5. Design the UI component changes\n` +
          `6. Determine whether this feature touches auth-gated components:\n` +
          `   Auth-gated = any file in **/dashboard/**, **/trips/[id]/**, named BentoTripCard ` +
          `   or DashboardClient, or containing isOwner, canEdit, collaboratorRole, ` +
          `   or role === 'ADMIN'.\n` +
          `   Set touchesAuthGatedComponents: true if ANY modified file matches.\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  plan: string,                         // step-by-step implementation plan\n` +
          `  filesToModify: string[],              // absolute paths\n` +
          `  filesToCreate: string[],              // absolute paths\n` +
          `  touchesAuthGatedComponents: boolean,  // triggers permission audit in Phase 5\n` +
          `  dataModelChanges: string,             // 'none' if no schema changes\n` +
          `  apiChanges: string                    // 'none' if no route changes\n` +
          `}`,
        outputSchema: {
          plan: 'string',
          filesToModify: ['string'],
          filesToCreate: ['string'],
          touchesAuthGatedComponents: 'boolean',
          dataModelChanges: 'string',
          apiChanges: 'string',
        },
      }),

      // ── Phase 2: Breakpoint — review plan ─────────────────────────────────
      defineTask({
        name: 'review-plan',
        kind: 'breakpoint',
        description:
          'Review the implementation plan above.\n\n' +
          'Confirm:\n' +
          '  1. The plan is complete and covers all aspects of the feature\n' +
          '  2. The file list is accurate\n' +
          '  3. The touchesAuthGatedComponents flag is correctly set\n' +
          '     (if this feature touches any dashboard/card/trip components, it must be true)\n' +
          '  4. The scope is appropriate — not too broad, not missing anything\n\n' +
          'If the plan is incomplete or the auth-gated flag looks wrong, reject and ' +
          'request a revised plan. If satisfied, approve to proceed to implementation.',
      }),

      // ── Phase 3: Implement ─────────────────────────────────────────────────
      defineTask({
        name: 'implement',
        kind: 'agent',
        role: 'nextjs-developer',
        description:
          `Implement the feature described in the plan from Phase 1.\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `Follow the plan exactly. Reference filesToModify and filesToCreate from the plan output.\n\n` +
          `Key implementation rules:\n` +
          `- When creating replacement components, carry over ALL conditional rendering logic ` +
          `  (isOwner, canEdit, role checks) from the original component\n` +
          `- When touching auth-gated components, preserve existing permission gates\n` +
          `- Use Google APIs for any geocoding (never Nominatim)\n` +
          `- Dev server runs from /tmp/trip-planner-dev (not project root)\n\n` +
          `IMPORTANT: Do NOT run npx tsc --noEmit — TypeScript checking is handled by the ` +
          `next task as a hard shell gate.\n\n` +
          `After implementing, summarize:\n` +
          `- All files created or modified\n` +
          `- Key design decisions made\n` +
          `- Any deviations from the plan (and why)`,
      }),

      // ── Phase 4: TypeScript hard gate ──────────────────────────────────────
      tsCheckTask(projectDir),

      // ── Phase 5: Conditional permission audit ──────────────────────────────
      // Runs only if touchesAuthGatedComponents === true (set by Phase 1 analysis)
      {
        ...permissionAuditTask(projectDir),
        name: 'permission-audit',
        condition: "tasks['analyze-and-plan'].output.touchesAuthGatedComponents === true",
        conditionDescription:
          'Only runs if the feature touches auth-gated components (dashboard, trip cards, ' +
          'or any component with isOwner/canEdit/role gating). ' +
          'If this task runs, it MUST pass before proceeding to verification.',
      },

      // ── Phase 6: Verify + browser check ───────────────────────────────────
      defineTask({
        name: 'verify-feature',
        kind: 'agent',
        role: 'qa-engineer',
        description:
          `Verify that the feature works correctly and completely.\n\n` +
          `Feature: ${featureDescription}\n` +
          `Project directory: ${projectDir}\n\n` +
          `Verification checklist:\n` +
          `1. Navigate to the relevant page in a browser\n` +
          `2. Verify the feature behaves as described\n` +
          `3. Test the feature with typical input\n` +
          `4. Test the feature with edge-case input (empty, single item, boundary values)\n` +
          `5. Verify no console errors or network errors during normal feature usage\n` +
          `6. If the feature affects multiple pages or states, test each one\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  passed: boolean,\n` +
          `  featureBehavior: string,  // description of what was verified\n` +
          `  issues: string[]          // any issues found (empty array if none)\n` +
          `}`,
        outputSchema: {
          passed: 'boolean',
          featureBehavior: 'string',
          issues: ['string'],
        },
      }),

      // ── Phase 7: Final review breakpoint ───────────────────────────────────
      defineTask({
        name: 'review-feature',
        kind: 'breakpoint',
        description:
          'Review the feature implementation and verification results.\n\n' +
          'Confirm:\n' +
          '  1. TypeScript check passed (hard gate)\n' +
          '  2. Feature verification passed\n' +
          '  3. If touchesAuthGatedComponents was true: permission audit passed\n' +
          '  4. No outstanding issues\n\n' +
          'Feature completion criteria (ALL must be met):\n' +
          '  - TypeScript compiles with zero errors\n' +
          '  - Feature behavior works as described\n' +
          '  - If auth-gated components touched: permission audit passed\n' +
          '  - Edge cases verified\n\n' +
          'If any criterion is not met, reject and request fixes. ' +
          'If all criteria are met, approve to complete the run.',
      }),
    ],
  };
}
