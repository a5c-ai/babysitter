/**
 * @process methodologies/build-realtime-remediation
 * @description Build Realtime Remediation - Monitor CI/build state and automatically remediate failures
 * @inputs { buildCommand: string, testCommand: string, maxRemediationAttempts: number, ciProvider: string }
 * @outputs { success: boolean, buildStatus: string, remediationHistory: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Build Realtime Remediation Process
 *
 * Methodology: Monitor build → Detect failure → Analyze → Remediate → Rebuild → Repeat
 *
 * This process implements continuous build remediation where:
 * 1. Trigger or monitor build process
 * 2. Detect build/test failures in real-time
 * 3. Analyze failure logs and error messages
 * 4. Determine root cause
 * 5. Apply automated fixes
 * 6. Re-run build to verify fix
 * 7. Iterate until build succeeds or max attempts reached
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.buildCommand - Command to run build (e.g., "npm run build")
 * @param {string} inputs.testCommand - Command to run tests (e.g., "npm test")
 * @param {number} inputs.maxRemediationAttempts - Maximum fix attempts (default: 5)
 * @param {string} inputs.ciProvider - CI provider: 'github', 'gitlab', 'jenkins', 'local' (default: 'local')
 * @param {string} inputs.ciUrl - Optional URL to monitor CI build
 * @param {boolean} inputs.runTests - Run tests after build succeeds (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with build status and remediation history
 */
export async function process(inputs, ctx) {
  const {
    buildCommand = 'npm run build',
    testCommand = 'npm test',
    maxRemediationAttempts = 5,
    ciProvider = 'local',
    ciUrl = null,
    runTests = true
  } = inputs;

  let attempt = 0;
  let buildSucceeded = false;
  let testsSucceeded = false;
  const remediationHistory = [];

  // Initial build attempt
  attempt++;
  let buildResult = await ctx.task(executeBuildTask, {
    buildCommand,
    ciProvider,
    ciUrl,
    attempt
  });

  remediationHistory.push({
    attempt,
    phase: 'build',
    result: buildResult,
    timestamp: ctx.now()
  });

  buildSucceeded = buildResult.success;

  // Remediation loop for build failures
  while (!buildSucceeded && attempt < maxRemediationAttempts) {
    // Analyze build failure
    const analysis = await ctx.task(agentAnalyzeFailureTask, {
      buildResult,
      phase: 'build',
      attempt,
      previousRemediations: remediationHistory
    });

    remediationHistory.push({
      attempt,
      phase: 'analysis',
      analysis,
      timestamp: ctx.now()
    });

    // Apply remediation
    const remediation = await ctx.task(agentRemediateTask, {
      analysis,
      buildResult,
      phase: 'build',
      attempt,
      previousRemediations: remediationHistory
    });

    remediationHistory.push({
      attempt,
      phase: 'remediation',
      remediation,
      timestamp: ctx.now()
    });

    // Optional: Breakpoint for human review of critical fixes
    if (remediation.requiresReview && inputs.reviewCriticalFixes) {
      await ctx.breakpoint({
        question: `Attempt ${attempt}: ${remediation.fixDescription}. Approve this fix?`,
        title: `Build Remediation - Attempt ${attempt}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/attempt-${attempt}-analysis.json`, format: 'json' },
            { path: `artifacts/attempt-${attempt}-fix.md`, format: 'markdown' }
          ]
        }
      });
    }

    // Re-run build
    attempt++;
    buildResult = await ctx.task(executeBuildTask, {
      buildCommand,
      ciProvider,
      ciUrl,
      attempt
    });

    remediationHistory.push({
      attempt,
      phase: 'build',
      result: buildResult,
      timestamp: ctx.now()
    });

    buildSucceeded = buildResult.success;
  }

  // If build succeeded and tests are requested, run tests
  if (buildSucceeded && runTests) {
    let testAttempt = 0;

    testAttempt++;
    let testResult = await ctx.task(executeTestsTask, {
      testCommand,
      attempt: testAttempt
    });

    remediationHistory.push({
      attempt: testAttempt,
      phase: 'test',
      result: testResult,
      timestamp: ctx.now()
    });

    testsSucceeded = testResult.success;

    // Test remediation loop
    while (!testsSucceeded && testAttempt < maxRemediationAttempts) {
      // Analyze test failure
      const analysis = await ctx.task(agentAnalyzeFailureTask, {
        buildResult: testResult,
        phase: 'test',
        attempt: testAttempt,
        previousRemediations: remediationHistory
      });

      remediationHistory.push({
        attempt: testAttempt,
        phase: 'test-analysis',
        analysis,
        timestamp: ctx.now()
      });

      // Apply remediation
      const remediation = await ctx.task(agentRemediateTask, {
        analysis,
        buildResult: testResult,
        phase: 'test',
        attempt: testAttempt,
        previousRemediations: remediationHistory
      });

      remediationHistory.push({
        attempt: testAttempt,
        phase: 'test-remediation',
        remediation,
        timestamp: ctx.now()
      });

      // Re-run tests
      testAttempt++;
      testResult = await ctx.task(executeTestsTask, {
        testCommand,
        attempt: testAttempt
      });

      remediationHistory.push({
        attempt: testAttempt,
        phase: 'test',
        result: testResult,
        timestamp: ctx.now()
      });

      testsSucceeded = testResult.success;
    }
  }

  // Final result
  const overallSuccess = buildSucceeded && (!runTests || testsSucceeded);

  return {
    success: overallSuccess,
    buildSucceeded,
    testsSucceeded: runTests ? testsSucceeded : null,
    totalAttempts: attempt,
    maxRemediationAttempts,
    remediationHistory,
    summary: {
      buildStatus: buildSucceeded ? 'passed' : 'failed',
      testStatus: runTests ? (testsSucceeded ? 'passed' : 'failed') : 'skipped',
      totalRemediations: remediationHistory.filter(h => h.phase === 'remediation' || h.phase === 'test-remediation').length,
      buildAttempts: remediationHistory.filter(h => h.phase === 'build').length,
      testAttempts: remediationHistory.filter(h => h.phase === 'test').length,
      fixesApplied: remediationHistory
        .filter(h => h.phase === 'remediation' || h.phase === 'test-remediation')
        .map(h => h.remediation?.fixDescription)
    },
    metadata: {
      processId: 'methodologies/build-realtime-remediation',
      timestamp: ctx.now()
    }
  };
}

/**
 * Execute build task
 */
export const executeBuildTask = defineTask('execute-build', (args, taskCtx) => ({
  kind: 'node',
  title: `Build - Attempt ${args.attempt}`,
  description: 'Run build command and capture results',

  script: async () => {
    const { buildCommand, ciProvider, ciUrl, attempt } = args;

    if (ciProvider !== 'local' && ciUrl) {
      // Fetch CI build status
      // This is a placeholder - real implementation would use CI provider API
      return {
        success: false,
        provider: ciProvider,
        url: ciUrl,
        status: 'failed',
        logs: 'CI build failed - see URL for details',
        exitCode: 1,
        errors: ['CI build failed']
      };
    }

    // Execute build locally
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      return {
        success: true,
        command: buildCommand,
        stdout,
        stderr,
        exitCode: 0,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        command: buildCommand,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        errors: extractErrors(error.stderr || error.stdout || error.message)
      };
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['node', 'build-remediation', 'build', `attempt-${args.attempt}`]
}));

/**
 * Execute tests task
 */
export const executeTestsTask = defineTask('execute-tests', (args, taskCtx) => ({
  kind: 'node',
  title: `Tests - Attempt ${args.attempt}`,
  description: 'Run test command and capture results',

  script: async () => {
    const { testCommand, attempt } = args;

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      return {
        success: true,
        command: testCommand,
        stdout,
        stderr,
        exitCode: 0,
        errors: [],
        failedTests: []
      };
    } catch (error) {
      return {
        success: false,
        command: testCommand,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        errors: extractErrors(error.stderr || error.stdout || error.message),
        failedTests: extractFailedTests(error.stdout || '')
      };
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['node', 'build-remediation', 'test', `attempt-${args.attempt}`]
}));

/**
 * Helper: Extract errors from output
 */
function extractErrors(output) {
  const errorPatterns = [
    /error:/gi,
    /failed:/gi,
    /exception:/gi,
    /TypeError:/gi,
    /ReferenceError:/gi,
    /SyntaxError:/gi
  ];

  const errors = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (errorPatterns.some(pattern => pattern.test(line))) {
      errors.push(line.trim());
    }
  }

  return errors.slice(0, 50); // Limit to 50 errors
}

/**
 * Helper: Extract failed test names
 */
function extractFailedTests(output) {
  const failedTests = [];
  const failPattern = /✗|✕|FAIL|Failed:?\s+(.+)/gi;
  const lines = output.split('\n');

  for (const line of lines) {
    const match = failPattern.exec(line);
    if (match) {
      failedTests.push(line.trim());
    }
  }

  return failedTests.slice(0, 20); // Limit to 20 failed tests
}

/**
 * Analyze failure task
 */
export const agentAnalyzeFailureTask = defineTask('agent-analyze-failure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze ${args.phase} failure - Attempt ${args.attempt}`,
  description: 'Determine root cause of failure',

  agent: {
    name: 'failure-analyzer',
    prompt: {
      role: 'expert build/test failure analyst',
      task: 'Analyze the failure and identify root cause',
      context: {
        buildResult: args.buildResult,
        phase: args.phase,
        attempt: args.attempt,
        previousRemediations: args.previousRemediations
      },
      instructions: [
        'Review build/test output carefully',
        'Identify all errors and their context',
        'Determine root cause (not just symptoms)',
        'Check if this is a recurring issue from previous attempts',
        'Classify error type (dependency, syntax, type error, configuration, etc.)',
        'Prioritize errors by impact',
        'Suggest potential fixes'
      ],
      outputFormat: 'JSON with root cause, error classification, affected files, and fix suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'errorType', 'affectedFiles', 'fixSuggestions'],
      properties: {
        rootCause: { type: 'string' },
        errorType: {
          type: 'string',
          enum: ['dependency', 'syntax', 'type-error', 'configuration', 'runtime', 'test-logic', 'other']
        },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        fixSuggestions: { type: 'array', items: { type: 'string' } },
        severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
        isRecurring: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'build-remediation', 'analysis', `attempt-${args.attempt}`]
}));

/**
 * Remediate failure task
 */
export const agentRemediateTask = defineTask('agent-remediate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate ${args.phase} - Attempt ${args.attempt}`,
  description: 'Apply fixes to resolve build/test failure',

  agent: {
    name: 'build-remediator',
    prompt: {
      role: 'expert build/test remediator',
      task: 'Apply fixes to resolve the identified issues',
      context: {
        analysis: args.analysis,
        buildResult: args.buildResult,
        phase: args.phase,
        attempt: args.attempt,
        previousRemediations: args.previousRemediations
      },
      instructions: [
        'Based on the analysis, apply targeted fixes',
        'Fix root cause, not symptoms',
        'Make minimal, focused changes',
        'Update affected files with corrections',
        'If dependency issue, update package.json or install missing deps',
        'If syntax/type error, fix code',
        'If configuration, update config files',
        'Document what was fixed and why',
        'Flag if fix requires human review (security, breaking changes)'
      ],
      outputFormat: 'JSON with files modified, fix description, and review requirement'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'fixDescription', 'fixType'],
      properties: {
        filesModified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              changes: { type: 'string' }
            }
          }
        },
        fixDescription: { type: 'string' },
        fixType: { type: 'string' },
        requiresReview: { type: 'boolean' },
        reviewReason: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'build-remediation', 'fix', `attempt-${args.attempt}`]
}));
