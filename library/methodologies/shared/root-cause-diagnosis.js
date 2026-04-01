/**
 * @module methodologies/shared/root-cause-diagnosis
 * @description Shared root-cause diagnosis task for Phase 0 of all bugfix processes.
 *   Enforces: git diff analysis, written hypothesis with 2+ evidence signals,
 *   no code changes during diagnosis.
 * @see https://github.com/a5c-ai/babysitter/issues/88
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// ROOT-CAUSE DIAGNOSIS TASK (Phase 0)
// ============================================================================

/**
 * Root-cause diagnosis task definition.
 *
 * Enforces Phase 0 rules:
 * - Git diff analysis to identify the breaking change
 * - Written hypothesis with specific root cause (not vague)
 * - At least 2 independent evidence signals
 * - Document alternative causes that were ruled out
 * - NO CODE CHANGES during diagnosis
 *
 * @param {Object} args
 * @param {string} args.description - Description of the bug or issue
 * @param {string} [args.projectDir] - Absolute path to the project directory
 * @param {string} [args.errorMessage] - The exact error message observed
 * @param {string} [args.stackTrace] - Full stack trace if available
 * @param {Object} [args.context] - Additional context about the bug
 */
export const rootCauseDiagnosisTask = defineTask('root-cause-diagnosis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0: Root-cause diagnosis (no code changes)',
  description:
    'Diagnose the root cause of the reported bug using git history analysis, ' +
    'reproduction, and evidence gathering. This is a diagnosis-only phase: ' +
    'absolutely no code changes are permitted.',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Root-cause diagnosis specialist',
      task:
        'Perform a comprehensive root-cause diagnosis of the reported bug. ' +
        'You must identify the specific breaking change, reproduce the error, ' +
        'formulate a precise hypothesis, gather at least 2 independent evidence ' +
        'signals, and document what alternative causes were ruled out. ' +
        'You MUST NOT make any code changes -- this is a diagnosis-only phase.',
      context: {
        description: args.description,
        projectDir: args.projectDir || '.',
        errorMessage: args.errorMessage || null,
        stackTrace: args.stackTrace || null,
        additionalContext: args.context || null,
      },
      instructions: [
        // 1. BREAKING CHANGE
        'BREAKING CHANGE: Run `git diff` and `git log --oneline -20` to identify what changed recently. ' +
          'Narrow down to the specific commit(s) that introduced the regression. ' +
          'If the project dir is provided, run commands from that directory.',

        // 2. REPRODUCE
        'REPRODUCE: What is the exact error? Reproduce the failure and capture the full error message, ' +
          'exit code, and stack trace. If an error message or stack trace was provided in the context, ' +
          'verify it is still current by reproducing.',

        // 3. ROOT CAUSE
        'ROOT CAUSE: What specifically is wrong? Formulate a precise, specific hypothesis. ' +
          'Do NOT use vague language like "something is broken" or "there might be an issue". ' +
          'State the exact mechanism: which line, which function, which dependency, which config ' +
          'change caused the failure and why.',

        // 4. EVIDENCE
        'EVIDENCE: Gather at least 2 independent evidence signals that support your hypothesis. ' +
          'Examples of evidence signals: git blame output, test output diff, dependency version mismatch, ' +
          'config file diff, log output comparison, reproducing with/without the suspect change. ' +
          'Each signal must independently point to the same root cause.',

        // 5. ALTERNATIVES
        'ALTERNATIVES: Document at least one alternative cause you considered and explain ' +
          'why you ruled it out with evidence. This demonstrates thoroughness and reduces ' +
          'the chance of a misdiagnosis.',
      ],
      outputFormat:
        'JSON matching the output schema. GUARD: You MUST have at least 2 evidence signals ' +
        'before completing. NO CODE CHANGES -- set noCodeChanges to true to confirm compliance.',
    },
    outputSchema: {
      type: 'object',
      required: [
        'rootCause',
        'hypothesis',
        'evidenceSignals',
        'gitDiffSummary',
        'noCodeChanges',
      ],
      properties: {
        rootCause: {
          type: 'string',
          description: 'Concise statement of the identified root cause',
        },
        hypothesis: {
          type: 'string',
          description:
            'Specific, falsifiable hypothesis explaining the failure mechanism',
        },
        evidenceSignals: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          description:
            'At least 2 independent evidence signals supporting the hypothesis',
        },
        alternativeCausesRuledOut: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Alternative causes that were considered and ruled out, with reasoning',
        },
        gitDiffSummary: {
          type: 'string',
          description:
            'Summary of relevant git diff/log output that identified the breaking change',
        },
        affectedFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files affected by or related to the root cause',
        },
        noCodeChanges: {
          type: 'boolean',
          description:
            'Must be true -- confirms no code changes were made during diagnosis',
        },
        edgeCases: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Edge cases or scenarios that may be affected by the same root cause',
        },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },

  labels: ['diagnosis', 'phase-0', 'no-code-changes', 'root-cause'],
}));

// ============================================================================
// DIAGNOSIS BREAKPOINT QUESTION HELPER
// ============================================================================

/**
 * Formats a diagnosis result into a human-readable breakpoint question string.
 *
 * Use this with ctx.breakpoint({ question: diagnosisBreakpointQuestion(result) })
 * to present the diagnosis findings for human review before proceeding to the
 * fix phase.
 *
 * @param {Object} diagnosis - The diagnosis result from rootCauseDiagnosisTask
 * @param {string} diagnosis.rootCause - The identified root cause
 * @param {string} diagnosis.hypothesis - The specific hypothesis
 * @param {string[]} diagnosis.evidenceSignals - Evidence signals gathered
 * @param {string} diagnosis.gitDiffSummary - Git diff/log summary
 * @param {string[]} [diagnosis.alternativeCausesRuledOut] - Ruled-out alternatives
 * @param {string[]} [diagnosis.affectedFiles] - Affected files
 * @param {string[]} [diagnosis.edgeCases] - Identified edge cases
 * @returns {string} Formatted question string for ctx.breakpoint()
 */
export function diagnosisBreakpointQuestion(diagnosis) {
  const lines = [];

  lines.push('=== Root-Cause Diagnosis Report ===');
  lines.push('');
  lines.push(`ROOT CAUSE: ${diagnosis.rootCause}`);
  lines.push('');
  lines.push(`HYPOTHESIS: ${diagnosis.hypothesis}`);
  lines.push('');

  lines.push(`EVIDENCE (${diagnosis.evidenceSignals.length} signals):`);
  for (const signal of diagnosis.evidenceSignals) {
    lines.push(`  - ${signal}`);
  }
  lines.push('');

  lines.push('GIT DIFF SUMMARY:');
  lines.push(`  ${diagnosis.gitDiffSummary}`);
  lines.push('');

  if (diagnosis.alternativeCausesRuledOut && diagnosis.alternativeCausesRuledOut.length > 0) {
    lines.push('ALTERNATIVES RULED OUT:');
    for (const alt of diagnosis.alternativeCausesRuledOut) {
      lines.push(`  - ${alt}`);
    }
    lines.push('');
  }

  if (diagnosis.affectedFiles && diagnosis.affectedFiles.length > 0) {
    lines.push(`AFFECTED FILES: ${diagnosis.affectedFiles.join(', ')}`);
    lines.push('');
  }

  if (diagnosis.edgeCases && diagnosis.edgeCases.length > 0) {
    lines.push('EDGE CASES TO WATCH:');
    for (const edge of diagnosis.edgeCases) {
      lines.push(`  - ${edge}`);
    }
    lines.push('');
  }

  lines.push('Do you approve this diagnosis and want to proceed to the fix phase?');

  return lines.join('\n');
}
