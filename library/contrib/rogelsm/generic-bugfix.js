/**
 * @process generic-bugfix
 * @description Root-cause-first bugfix template with Phase 0 git-diff analysis. Enforces deep diagnosis before
 * implementation and verifies edge cases beyond the reported case. Replaces all
 * ad-hoc bugfix processes that vary in diagnostic depth.
 *
 * Structure: 6 phases
 *   Phase 1: Diagnostic (5-question checklist, requires 2+ independent evidence signals)
 *   Phase 2: Breakpoint — human reviews diagnosis before fix begins
 *   Phase 3: Implement fix (references diagnosis output)
 *   Phase 4: TypeScript check (hard shell gate — non-zero exit fails the run)
 *   Phase 5: Verify fix + edge cases (structured matrix: reported + boundary cases)
 *   Phase 6: Breakpoint — human reviews outcome
 *
 * @inputs
 *   projectDir {string} - Absolute path to the project directory
 *   issueDescription {string} - Plain-English description of the bug to fix
 *
 * @outputs
 *   diagnosis: { rootCause, evidenceForRootCause[], alternativeCausesRuledOut[], fixPlan }
 *   verification: { allChecksPassed, failedChecks[] }
 *
 * @agent senior-debugger (Phase 1), nextjs-developer (Phase 3), qa-engineer (Phase 5)
 *
 * @see shared/common.js for tsCheckTask definition
 * @see .a5c/processes/PROCESS-GUIDE.md for pre-flight diagnostic checklist
 *
 * Evidence: Duration warning bug fixed twice (incomplete verification);
 * parking address took 3 runs (first-plausible-fix diagnosis). Both preventable
 * with this template.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { tsCheckTask } from './common.js';

/**
 * @param {{ projectDir: string, issueDescription: string }} args
 */
export async function process(args) {
  const { projectDir, issueDescription } = args;

  return {
    tasks: [
      // ── Phase 1: Diagnostic ────────────────────────────────────────────────
      defineTask({
        name: 'diagnose',
        kind: 'agent',
        role: 'senior-debugger',
        description:
          `You are diagnosing a bug in the trip-planner project.\n\n` +
          `Issue description: ${issueDescription}\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `Answer ALL diagnostic questions in order before drawing any conclusions:\n\n` +
          `0. GIT HISTORY: Run \`git diff\` and \`git log --oneline -20\` to identify the specific commit(s) that introduced this regression. Document the breaking change.\n\n` +
          `1. REPRODUCE: What is the exact error message or incorrect behavior (copy verbatim, ` +
          `   not a paraphrase)? Which file(s) and line number(s) does the error originate from?\n\n` +
          `2. ISOLATE: What is the smallest reproduction case? Which component, function, or ` +
          `   code path triggers the issue?\n\n` +
          `3. ROOT CAUSE: What is the specific root cause? Be precise. "The function does X when ` +
          `   it should do Y" is acceptable. "There seems to be a problem" is not.\n\n` +
          `4. EVIDENCE: Provide at least TWO independent pieces of evidence that confirm this ` +
          `   root cause. Each piece must come from a different source (e.g., reading the ` +
          `   code directly, checking the data, running a command, examining a log). ` +
          `   A second piece of evidence that says "and also the code looks wrong" does not ` +
          `   count — it must be independently confirmatory.\n\n` +
          `5. EDGE CASES: What alternative causes did you consider and rule out? Why were they ` +
          `   ruled out? What edge cases might be affected by the root cause?\n\n` +
          `NO CODE CHANGES: This diagnostic phase is for investigation only. You must NOT modify any ` +
          `code files during this phase. Only read, analyze, and document.\n\n` +
          `GUARD: You must document WHY the identified root cause is correct before any fix ` +
          `is attempted. Do not proceed to a fix plan until you have 2+ independent evidence signals.\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  rootCause: string,                  // precise description\n` +
          `  evidenceForRootCause: string[],      // min 2 items, each from independent source\n` +
          `  alternativeCausesRuledOut: string[], // each with reason for ruling out\n` +
          `  edgeCasesAffected: string[],         // boundary conditions to verify\n` +
          `  fixPlan: string                      // step-by-step fix instructions\n` +
          `}`,
        outputSchema: {
          rootCause: 'string',
          evidenceForRootCause: ['string'],
          alternativeCausesRuledOut: ['string'],
          edgeCasesAffected: ['string'],
          fixPlan: 'string',
        },
      }),

      // ── Phase 2: Breakpoint — review diagnosis ─────────────────────────────
      defineTask({
        name: 'review-diagnosis',
        kind: 'breakpoint',
        description:
          'Review the diagnosis output above.\n\n' +
          'Confirm:\n' +
          '  1. The root cause is specific and actionable (not "there seems to be a problem")\n' +
          '  2. At least 2 independent evidence signals are provided\n' +
          '  3. Alternative causes were considered and ruled out\n' +
          '  4. The fix plan is clear and targeted\n\n' +
          'If the diagnosis is incomplete, reject and ask for a deeper investigation. ' +
          'If satisfied, approve to proceed to implementation.',
      }),

      // ── Phase 3: Implement fix ─────────────────────────────────────────────
      defineTask({
        name: 'implement-fix',
        kind: 'agent',
        role: 'nextjs-developer',
        description:
          `Implement the fix described in the diagnosis output from the previous task.\n\n` +
          `Project directory: ${projectDir}\n\n` +
          `Follow the fixPlan exactly. Do not make changes outside the scope of the identified ` +
          `root cause. Do not add features or refactor unrelated code.\n\n` +
          `IMPORTANT: Do NOT run npx tsc --noEmit — TypeScript checking is handled by the ` +
          `next task as a hard shell gate. Your task is to implement the fix only.\n\n` +
          `After implementing, summarize:\n` +
          `- Which files were modified\n` +
          `- What specific change was made\n` +
          `- Why this change addresses the root cause`,
      }),

      // ── Phase 4: TypeScript hard gate ──────────────────────────────────────
      tsCheckTask(projectDir),

      // ── Phase 5: Verify fix + edge cases ───────────────────────────────────
      defineTask({
        name: 'verify-with-edge-cases',
        kind: 'agent',
        role: 'qa-engineer',
        description:
          `Verify that the fix is complete and correct. Reference the issue description and ` +
          `the edge cases identified in the diagnosis.\n\n` +
          `Issue: ${issueDescription}\n` +
          `Project directory: ${projectDir}\n\n` +
          `Run through all of the following verification checks:\n\n` +
          `1. REPORTED CASE: Does the originally reported bug no longer occur?\n` +
          `2. EMPTY COLLECTION: What happens with 0 items (e.g., 0 activities, empty list)?\n` +
          `3. SINGLE ITEM: What happens with exactly 1 item?\n` +
          `4. NULL/UNDEFINED KEYS: What happens when relevant fields are null or undefined?\n` +
          `5. BOUNDARY CONDITIONS: Any edge cases identified in the diagnosis?\n\n` +
          `For time/duration bugs, additionally check:\n` +
          `- Activities with no startTime\n` +
          `- Activities spanning midnight\n\n` +
          `For permission bugs, additionally check:\n` +
          `- Owner, editor, viewer, and admin roles\n\n` +
          `Output schema:\n` +
          `{\n` +
          `  allChecksPassed: boolean,\n` +
          `  failedChecks: string[],\n` +
          `  verificationSummary: string\n` +
          `}`,
        outputSchema: {
          allChecksPassed: 'boolean',
          failedChecks: ['string'],
          verificationSummary: 'string',
        },
      }),

      // ── Phase 6: Final review breakpoint ───────────────────────────────────
      defineTask({
        name: 'review-fix',
        kind: 'breakpoint',
        description:
          'Review the fix and verification results.\n\n' +
          'Confirm:\n' +
          '  1. TypeScript check passed (hard gate — run would have failed otherwise)\n' +
          '  2. All verification checks passed\n' +
          '  3. No edge cases are failing\n\n' +
          'If any checks failed, reject and request additional fixes. ' +
          'If satisfied, approve to complete the run.',
      }),
    ],
  };
}
