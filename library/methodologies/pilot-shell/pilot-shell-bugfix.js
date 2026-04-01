/**
 * @process pilot-shell/bugfix
 * @description Bugfix mode with Phase 0 root-cause diagnosis: analysis (git diff + 2 evidence signals) -> behavior contract -> test-before-fix -> verify
 * @inputs { description: string, reproSteps?: string[], targetQuality?: number }
 * @outputs { success: boolean, analysis: object, contract: object, fix: object, verification: object }
 *
 * Attribution: Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';


/**
 * Pilot Shell Bugfix Mode
 *
 * Systematic bug resolution with behavior contracts and test-before-fix:
 * 1. ANALYSIS: Trace to file:line, identify root cause, assess blast radius
 * 2. CONTRACT: Formalize Bug Condition, Postcondition, and Invariants as a Behavior Contract
 * 3. TEST-BEFORE-FIX: Write failing bug test + preservation tests -> minimal fix -> verify
 * 4. VERIFY: Behavior Contract audit + full suite + lint
 *
 * Agents referenced from agents/ directory:
 *   - unified-reviewer: Root cause analysis and behavior contract auditing
 *   - tdd-enforcer: Test-before-fix discipline and behavior contract formalization
 *   - file-checker: Quality pipeline (lint/format/typecheck)
 *
 * Skills referenced from skills/ directory:
 *   - behavior-contract: Bug condition/postcondition formalization
 *   - strict-tdd: RED->GREEN->REFACTOR enforcement
 *   - quality-hooks: Language-specific auto-lint/format/typecheck pipeline
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.description - Bug description
 * @param {string[]} inputs.reproSteps - Steps to reproduce the bug
 * @param {number} inputs.targetQuality - Minimum quality score (0-100)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    description,
    reproSteps = [],
    targetQuality = 85
  } = inputs;

  // ============================================================================
  // PHASE 1: ANALYSIS - Trace to file:line, root cause identification
  // ============================================================================

  const analysisResult = await ctx.task(bugTraceTask, {
    description,
    reproSteps,
    context: inputs.context || {}
  });

  await ctx.breakpoint({
    question: `Bug analysis complete for "${description}".\n\nRoot cause: ${analysisResult.rootCause?.file}:${analysisResult.rootCause?.line}\nBlast radius: ${analysisResult.blastRadius}\n\nProceed with behavior contract?`,
    title: 'Bug Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/BUG-ANALYSIS.md', format: 'markdown', label: 'Bug Analysis' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: BEHAVIOR CONTRACT - Formalize bug condition and postcondition
  // ============================================================================

  const contractResult = await ctx.task(behaviorContractTask, {
    analysis: analysisResult,
    description,
    reproSteps
  });

  await ctx.breakpoint({
    question: `Review Behavior Contract for "${description}":\n\nBug Condition: ${contractResult.bugCondition}\nPostcondition: ${contractResult.postcondition}\nInvariants: ${contractResult.invariants.length} defined\n\nApprove contract?`,
    title: 'Behavior Contract Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/BEHAVIOR-CONTRACT.md', format: 'markdown', label: 'Behavior Contract' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: TEST-BEFORE-FIX
  // ============================================================================

  // Step 3a: Write failing bug test (RED)
  const failingTestResult = await ctx.task(failingBugTestTask, {
    contract: contractResult,
    analysis: analysisResult,
    description
  });

  // Step 3b: Write preservation tests (must pass with current code)
  const preservationResult = await ctx.task(preservationTestsTask, {
    contract: contractResult,
    analysis: analysisResult,
    description
  });

  // Step 3c: Apply minimal fix (GREEN)
  const fixResult = await ctx.task(minimalFixTask, {
    contract: contractResult,
    analysis: analysisResult,
    failingTest: failingTestResult,
    preservationTests: preservationResult,
    description
  });

  // ============================================================================
  // PHASE 4: VERIFY - Contract audit + full suite + lint
  // ============================================================================

  // Run verification in parallel
  const [contractAudit, fullSuiteResult, qualityResult] = await ctx.parallel.all([
    () => ctx.task(contractAuditTask, {
      contract: contractResult,
      fix: fixResult,
      description
    }),
    () => ctx.task(fullTestSuiteTask, {
      description,
      phase: 'verification'
    }),
    () => ctx.task(qualityPipelineTask, {
      fix: fixResult,
      description
    })
  ]);

  // Convergence check: if quality insufficient, enter fix-and-verify loop
  let finalQuality = qualityResult.score;
  let refinementCount = 0;
  const maxRefinements = 3;

  while (finalQuality < targetQuality && refinementCount < maxRefinements) {
    refinementCount++;

    await ctx.breakpoint({
      question: `Bugfix quality ${finalQuality}/${targetQuality}. Refinement ${refinementCount}/${maxRefinements}. Continue?`,
      title: `Bugfix Refinement ${refinementCount}`,
      context: { runId: ctx.runId }
    });

    const refinementResult = await ctx.task(bugfixRefinementTask, {
      contract: contractResult,
      currentFix: fixResult,
      qualityFeedback: qualityResult.feedback,
      refinementCount,
      description
    });

    const [refinedSuite, refinedQuality] = await ctx.parallel.all([
      () => ctx.task(fullTestSuiteTask, { description, phase: `refinement-${refinementCount}` }),
      () => ctx.task(qualityPipelineTask, { fix: refinementResult, description })
    ]);

    finalQuality = refinedQuality.score;
  }

  const success = contractAudit.satisfied &&
    fullSuiteResult.passed &&
    finalQuality >= targetQuality;

  return {
    success,
    analysis: analysisResult,
    contract: contractResult,
    fix: fixResult,
    verification: {
      contractAudit,
      testSuite: fullSuiteResult,
      quality: { score: finalQuality, targetQuality },
      refinements: refinementCount
    },
    artifacts: {
      analysis: 'artifacts/BUG-ANALYSIS.md',
      contract: 'artifacts/BEHAVIOR-CONTRACT.md',
      fix: 'artifacts/BUGFIX.md',
      verification: 'artifacts/VERIFICATION.md'
    },
    metadata: {
      processId: 'pilot-shell/bugfix',
      timestamp: ctx.now(),
      attribution: 'Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const bugTraceTask = defineTask('bug-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trace bug: ${args.description.slice(0, 50)}`,
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'senior debugger and root cause analyst',
      task: 'Trace the bug to its exact file:line root cause and assess impact',
      context: args,
      instructions: [
        'PHASE 0 RULE: Run `git diff` and `git log --oneline -20` to identify the specific commit(s) that introduced this bug',
        'PHASE 0 RULE: You MUST NOT make any code changes during analysis. This is diagnosis only.',
        'PHASE 0 RULE: Gather at least 2 independent evidence signals before identifying root cause',
        'If reproduction steps are provided, trace the execution path',
        'Use semantic search to find related code and recent changes',
        'Identify the exact file:line where the bug originates',
        'Assess blast radius: what other features/tests are affected?',
        'Document the analysis in BUG-ANALYSIS.md'
      ],
      outputFormat: 'JSON with rootCause ({file, line, description, recentChange}), affectedFiles (array), blastRadius (string: low/medium/high), executionPath (array), analysisMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'affectedFiles', 'blastRadius', 'evidenceSignals'],
      properties: {
        rootCause: {
          type: 'object',
          required: ['file', 'line', 'description', 'recentChange'],
          properties: {
            file: { type: 'string' },
            line: { type: 'number' },
            description: { type: 'string' },
            recentChange: { type: 'string' }
          }
        },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        blastRadius: { type: 'string', enum: ['low', 'medium', 'high'] },
        evidenceSignals: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          description: 'At least 2 independent evidence signals supporting the root cause identification'
        },
        gitDiffSummary: {
          type: 'string',
          description: 'Summary of git diff/log output identifying the breaking change'
        },
        executionPath: { type: 'array', items: { type: 'string' } },
        analysisMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'trace']
}));

export const behaviorContractTask = defineTask('behavior-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize behavior contract',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'behavior contract specialist',
      task: 'Formalize the bug as a Behavior Contract with Bug Condition, Postcondition, and Invariants',
      context: args,
      instructions: [
        'Bug Condition: The exact input/state combination that triggers the bug',
        'Postcondition: The correct behavior that must hold after the fix',
        'Invariants: Existing correct behavior that must be preserved',
        'Write each in testable, specific terms',
        'Generate BEHAVIOR-CONTRACT.md'
      ],
      outputFormat: 'JSON with bugCondition (string), postcondition (string), invariants (array of strings), testableAssertions (array), contractMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['bugCondition', 'postcondition', 'invariants'],
      properties: {
        bugCondition: { type: 'string' },
        postcondition: { type: 'string' },
        invariants: { type: 'array', items: { type: 'string' } },
        testableAssertions: { type: 'array', items: { type: 'string' } },
        contractMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'contract']
}));

export const failingBugTestTask = defineTask('failing-bug-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing bug test (RED)',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD red-phase specialist',
      task: 'Write a test that reproduces the bug condition and fails with current code',
      context: args,
      instructions: [
        'Write a test that triggers the Bug Condition from the contract',
        'The expected outcome should be the Postcondition',
        'Run the test and confirm it FAILS',
        'The failure message should clearly describe the bug',
        'Commit the failing test with message: "test: add failing test for [bug]"'
      ],
      outputFormat: 'JSON with testFile (string), testName (string), failureMessage (string), failsCorrectly (boolean), committed (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFile', 'testName', 'failsCorrectly'],
      properties: {
        testFile: { type: 'string' },
        testName: { type: 'string' },
        failureMessage: { type: 'string' },
        failsCorrectly: { type: 'boolean' },
        committed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'tdd-red']
}));

export const preservationTestsTask = defineTask('preservation-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write preservation tests for invariants',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'regression prevention specialist',
      task: 'Write tests for each invariant in the Behavior Contract to prevent regression',
      context: args,
      instructions: [
        'For each invariant in the contract, write a test that validates the current correct behavior',
        'All preservation tests MUST pass with the current (buggy) code',
        'These tests guard against the fix accidentally breaking other behavior',
        'Commit preservation tests'
      ],
      outputFormat: 'JSON with testFiles (array), testCount (number), allPassing (boolean), invariantsCovered (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testCount', 'allPassing'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        allPassing: { type: 'boolean' },
        invariantsCovered: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'preservation']
}));

export const minimalFixTask = defineTask('minimal-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply minimal fix (GREEN)',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'minimal fix specialist following GREEN phase discipline',
      task: 'Write the smallest possible code change to make the failing bug test pass while keeping all preservation tests green',
      context: args,
      instructions: [
        'Make the minimum code change to satisfy the Postcondition',
        'The failing bug test must now pass',
        'All preservation tests must remain green',
        'Run full test suite to check for regressions',
        'Commit with message: "fix: [description]"',
        'Do NOT refactor in this step (REFACTOR comes next if needed)'
      ],
      outputFormat: 'JSON with filesModified (array), linesChanged (number), bugTestPassing (boolean), preservationTestsPassing (boolean), fullSuitePassing (boolean), diffSummary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'bugTestPassing', 'preservationTestsPassing'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        linesChanged: { type: 'number' },
        bugTestPassing: { type: 'boolean' },
        preservationTestsPassing: { type: 'boolean' },
        fullSuitePassing: { type: 'boolean' },
        diffSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'tdd-green']
}));

export const contractAuditTask = defineTask('contract-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Behavior contract audit',
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'behavior contract auditor',
      task: 'Audit the fix against the Behavior Contract',
      context: args,
      instructions: [
        'Verify the Postcondition is satisfied by the fix',
        'Verify all Invariants are preserved',
        'Confirm the Bug Condition no longer triggers the bug',
        'Check that no new behavior violations were introduced',
        'Provide overall satisfaction assessment'
      ],
      outputFormat: 'JSON with satisfied (boolean), postconditionMet (boolean), invariantsPreserved (boolean), bugConditionResolved (boolean), newViolations (array), notes (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfied', 'postconditionMet', 'invariantsPreserved', 'bugConditionResolved'],
      properties: {
        satisfied: { type: 'boolean' },
        postconditionMet: { type: 'boolean' },
        invariantsPreserved: { type: 'boolean' },
        bugConditionResolved: { type: 'boolean' },
        newViolations: { type: 'array', items: { type: 'object' } },
        notes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'audit']
}));

export const fullTestSuiteTask = defineTask('full-test-suite', (args, taskCtx) => ({
  kind: 'node',
  title: `Full test suite (${args.phase})`,
  description: 'Run the complete project test suite for verification',
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pilot-shell', 'bugfix', 'test', args.phase]
}));

export const qualityPipelineTask = defineTask('quality-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality pipeline: lint + format + typecheck',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'quality pipeline operator',
      task: 'Run full quality pipeline on the bugfix changes',
      context: args,
      instructions: [
        'Run linter with auto-fix',
        'Run formatter',
        'Run type checker',
        'Score overall quality 0-100',
        'Provide improvement feedback'
      ],
      outputFormat: 'JSON with score (number), passed (boolean), lintPassed (boolean), formatPassed (boolean), typecheckPassed (boolean), feedback (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number' },
        passed: { type: 'boolean' },
        lintPassed: { type: 'boolean' },
        formatPassed: { type: 'boolean' },
        typecheckPassed: { type: 'boolean' },
        feedback: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'quality']
}));

export const bugfixRefinementTask = defineTask('bugfix-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bugfix refinement (round ${args.refinementCount})`,
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'bugfix refinement specialist',
      task: 'Refine the bugfix based on quality feedback while maintaining contract satisfaction',
      context: args,
      instructions: [
        'Apply quality feedback improvements',
        'Maintain all test passing state',
        'Keep contract satisfaction intact',
        'Improve code quality score toward target',
        'Commit refinements'
      ],
      outputFormat: 'JSON with filesModified (array), improvementsApplied (array), testsPassing (boolean), contractStillSatisfied (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'testsPassing'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        improvementsApplied: { type: 'array', items: { type: 'string' } },
        testsPassing: { type: 'boolean' },
        contractStillSatisfied: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'refinement', `round-${args.refinementCount}`]
}));
