/**
 * @process gsd/verify-work
 * @description GSD work verification - UAT with automated diagnosis and fix planning
 * @inputs { phaseId: string, phaseName: string, deliverables: array }
 * @outputs { success: boolean, approved: boolean, fixes: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Work Verification Process
 *
 * GSD Methodology: User acceptance testing → Automated diagnosis → Fix planning → Re-verification
 *
 * Agents referenced from agents/ directory:
 *   - gsd-verifier: Prepares UAT checklists and verification
 *   - gsd-debugger: Automated issue diagnosis with root cause analysis
 *   - gsd-planner: Creates fix plans from diagnosis
 *   - gsd-executor: Executes fix plans with atomic commits
 *
 * Skills referenced from skills/ directory:
 *   - verification-suite: UAT checklist patterns and verification
 *   - git-integration: Atomic commits for fixes
 *   - template-scaffolding: UAT checklist and diagnosis report templates
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {array} inputs.deliverables - List of deliverables to verify
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with verification outcome
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    deliverables = []
  } = inputs;

  // ============================================================================
  // PHASE 1: PREPARE VERIFICATION CHECKLIST
  // ============================================================================

  const checklistResult = await ctx.task(prepareChecklistTask, {
    phaseId,
    phaseName,
    deliverables,
    requirements: inputs.requirements
  });

  // ============================================================================
  // PHASE 2: USER ACCEPTANCE TESTING
  // ============================================================================

  const uatResult = await ctx.breakpoint({
    question: `Test deliverables for "${phaseName}" one at a time. Confirm each works as expected or report issues.`,
    title: `User Acceptance Testing: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${phaseId}-UAT-CHECKLIST.md`, format: 'markdown', label: 'Testing Checklist' }
      ]
    }
  });

  // Parse UAT result to determine if there are issues
  // In real implementation, this would parse structured feedback
  const hasIssues = inputs.hasIssues || false; // Placeholder

  if (!hasIssues) {
    return {
      success: true,
      approved: true,
      phaseId,
      phaseName,
      issues: [],
      metadata: {
        processId: 'gsd/verify-work',
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // PHASE 3: AUTOMATED ISSUE DIAGNOSIS
  // ============================================================================

  const diagnosisResult = await ctx.task(diagnoseIssuesTask, {
    phaseId,
    phaseName,
    issues: inputs.issues || [],
    deliverables
  });

  // ============================================================================
  // PHASE 4: FIX PLANNING
  // ============================================================================

  const fixPlansResult = await ctx.task(createFixPlansTask, {
    phaseId,
    phaseName,
    diagnosis: diagnosisResult
  });

  // Breakpoint: Review fix plans
  await ctx.breakpoint({
    question: `Review fix plans for ${fixPlansResult.fixes.length} issues. Approve to execute fixes?`,
    title: `Fix Plans: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${phaseId}-FIX-PLANS.md`, format: 'markdown', label: 'Fix Plans' },
        { path: `artifacts/${phaseId}-DIAGNOSIS.md`, format: 'markdown', label: 'Issue Diagnosis' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: EXECUTE FIXES
  // ============================================================================

  const fixResults = [];

  for (const fixPlan of fixPlansResult.fixes) {
    const fixResult = await ctx.task(executeFixTask, {
      phaseId,
      fixPlan
    });

    fixResults.push(fixResult);

    // Commit fix atomically
    await ctx.task(commitFixTask, {
      phaseId,
      fixPlan,
      fixResult
    });
  }

  // ============================================================================
  // PHASE 6: RE-VERIFICATION
  // ============================================================================

  await ctx.breakpoint({
    question: `Fixes applied. Re-test deliverables for "${phaseName}". Confirm all issues resolved.`,
    title: `Re-verification: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${phaseId}-UAT-CHECKLIST.md`, format: 'markdown', label: 'Testing Checklist' }
      ]
    }
  });

  return {
    success: true,
    approved: true, // Placeholder - would come from re-verification
    phaseId,
    phaseName,
    issues: inputs.issues || [],
    diagnosis: diagnosisResult,
    fixes: fixResults,
    artifacts: {
      checklist: `artifacts/${phaseId}-UAT-CHECKLIST.md`,
      diagnosis: `artifacts/${phaseId}-DIAGNOSIS.md`,
      fixPlans: `artifacts/${phaseId}-FIX-PLANS.md`
    },
    metadata: {
      processId: 'gsd/verify-work',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const prepareChecklistTask = defineTask('prepare-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare UAT checklist',
  description: 'Create testing checklist for deliverables',

  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'senior QA engineer and test coordinator',
      task: 'Create comprehensive user acceptance testing checklist',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        deliverables: args.deliverables,
        requirements: args.requirements
      },
      instructions: [
        'List all deliverables to test',
        'For each deliverable, create specific test steps',
        'Include: what to test, how to test, expected result',
        'Order tests logically (dependencies first)',
        'Provide clear pass/fail criteria',
        'Include links to files/URLs to test',
        'Create formatted checklist markdown'
      ],
      outputFormat: 'JSON with checklistItems (array), checklistMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['checklistItems', 'checklistMarkdown'],
      properties: {
        checklistItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              testSteps: { type: 'array', items: { type: 'string' } },
              expectedResult: { type: 'string' },
              passCriteria: { type: 'string' }
            }
          }
        },
        checklistMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'verification', 'uat']
}));

export const diagnoseIssuesTask = defineTask('diagnose-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose issues',
  description: 'Automated diagnosis of reported issues',

  agent: {
    name: 'gsd-debugger',
    prompt: {
      role: 'expert debugging engineer',
      task: 'Diagnose root causes of reported issues',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        issues: args.issues,
        deliverables: args.deliverables
      },
      instructions: [
        'For each reported issue, investigate the root cause',
        'Review relevant code files',
        'Check logs and error messages',
        'Identify whether issue is: bug, missing feature, UX problem, or configuration',
        'Trace issue to specific code locations',
        'Assess severity: critical, major, minor, cosmetic',
        'Document findings with file references and line numbers'
      ],
      outputFormat: 'JSON with diagnoses (array of objects), diagnosisMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['diagnoses', 'diagnosisMarkdown'],
      properties: {
        diagnoses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              rootCause: { type: 'string' },
              category: { type: 'string', enum: ['bug', 'missing-feature', 'ux', 'config', 'data'] },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'cosmetic'] },
              affectedFiles: { type: 'array', items: { type: 'string' } },
              codeLocation: { type: 'string' }
            }
          }
        },
        diagnosisMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'verification', 'diagnosis']
}));

export const createFixPlansTask = defineTask('create-fix-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create fix plans',
  description: 'Generate plans to fix diagnosed issues',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'senior software engineer',
      task: 'Create specific fix plans for each diagnosed issue',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        diagnosis: args.diagnosis
      },
      instructions: [
        'For each diagnosis, create a fix plan',
        'Specify exact code changes needed',
        'List files to modify',
        'Provide step-by-step fix actions',
        'Include verification steps',
        'Prioritize by severity',
        'Create XML-formatted fix plans similar to task plans'
      ],
      outputFormat: 'JSON with fixes (array of fix plan objects), fixPlansMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixes', 'fixPlansMarkdown'],
      properties: {
        fixes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              name: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
              action: { type: 'string' },
              verify: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        fixPlansMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'verification', 'fix-planning']
}));

export const executeFixTask = defineTask('execute-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix: ${args.fixPlan.name}`,
  description: 'Execute fix plan',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'senior software engineer',
      task: 'Execute the fix plan completely',
      context: {
        phaseId: args.phaseId,
        fixPlan: args.fixPlan
      },
      instructions: [
        'Execute all fix actions',
        'Modify specified files',
        'Test the fix locally',
        'Document what changed',
        'Return files modified'
      ],
      outputFormat: 'JSON with filesModified (array), summary (string), verified (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        verified: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'verification', 'fix', args.fixPlan.name]
}));

export const commitFixTask = defineTask('commit-fix', (args, taskCtx) => ({
  kind: 'shell',
  title: `Commit fix: ${args.fixPlan.name}`,
  description: 'Create atomic commit for fix',

  shell: {
    command: `git add ${args.fixResult.filesModified.join(' ')} && git commit -m "Fix: ${args.fixPlan.name}\n\n${args.fixResult.summary}\n\nPhase: ${args.phaseId}"`
  },

  labels: ['gsd', 'verification', 'commit']
}));
