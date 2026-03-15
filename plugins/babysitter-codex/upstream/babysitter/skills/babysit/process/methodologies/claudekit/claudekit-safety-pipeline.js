/**
 * @process methodologies/claudekit/claudekit-safety-pipeline
 * @description ClaudeKit Safety Pipeline - Hook-driven safety system implementing file-guard (195+ patterns, 12 categories), PostToolUse quality checks (typecheck, lint, test), checkpoint management, and session-scoped hook profiling with color-coded alerts
 * @inputs { projectRoot?: string, hookConfig?: object, fileGuardPatterns?: object, checkpointLabel?: string, enableProfiling?: boolean, sessionId?: string }
 * @outputs { success: boolean, fileGuard: object, qualityChecks: object, checkpoint: object, hookProfile: object, sessionState: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// FILE GUARD TASKS
// ============================================================================

const initFileGuardTask = defineTask('claudekit-safety-init-file-guard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Initialize File Guard (195+ Patterns)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit File Guard Engine',
      task: 'Initialize the file-guard protection system with 195+ patterns across 12 categories. Set up PreToolUse blocking for sensitive file access.',
      context: { ...args },
      instructions: [
        'Category 1 - Secrets: .env, .env.*, .secret, secrets.*, vault.*',
        'Category 2 - Credentials: credentials.*, password.*, auth.json, oauth.*',
        'Category 3 - SSH Keys: id_rsa, id_ed25519, *.pem, authorized_keys, known_hosts',
        'Category 4 - Certificates: *.crt, *.cert, *.ca-bundle, ssl/*, tls/*',
        'Category 5 - Environment: .env.local, .env.production, .env.staging, docker.env',
        'Category 6 - Auth Tokens: token.*, jwt.*, session.*, cookie.*',
        'Category 7 - Database: database.yml, db.json, *.sqlite, *.db, pgpass',
        'Category 8 - Cloud Config: .aws/*, .gcp/*, .azure/*, terraform.tfvars',
        'Category 9 - CI/CD Secrets: .github/secrets, .gitlab-ci.yml variables, jenkins credentials',
        'Category 10 - Private Keys: *.key, *.p12, *.pfx, *.keystore, *.jks',
        'Category 11 - API Keys: api_key.*, apikey.*, api-credentials.*',
        'Category 12 - Sensitive Config: config/secrets/*, .htpasswd, shadow, gshadow',
        'Enable bash pipeline analysis for indirect access detection',
        'Configure multi-tool ignore support for approved exceptions',
        'Return pattern count per category and guard status'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'file-guard']
}));

const scanFileAccessTask = defineTask('claudekit-safety-scan-access', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan for Sensitive File Access Attempts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Access Scanner',
      task: 'Scan recent tool invocations for sensitive file access attempts. Check direct file reads, bash commands with pipes, and multi-tool chains.',
      context: { ...args },
      instructions: [
        'Check direct file paths against 195+ blocked patterns',
        'Analyze bash commands for piped file access (cat secret | grep)',
        'Detect multi-tool chains that could bypass direct blocks',
        'Check glob patterns that could match sensitive files',
        'Identify file copy/move operations targeting protected paths',
        'Report blocked attempts with category and pattern matched',
        'Return scan results with any blocked access details'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'access-scan']
}));

// ============================================================================
// QUALITY CHECK TASKS (PostToolUse)
// ============================================================================

const typecheckChangedTask = defineTask('claudekit-safety-typecheck', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Typecheck Changed Files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Type Checker',
      task: 'Run type checking on files changed since last check. Report type errors with file, line, and error description.',
      context: { ...args },
      instructions: [
        'Identify files changed since last typecheck',
        'Run TypeScript compiler in check mode (tsc --noEmit)',
        'Parse compiler output for errors and warnings',
        'Map errors to changed files (ignore unrelated errors)',
        'Report each error with file path, line number, and message',
        'Return pass/fail status with error count'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'typecheck']
}));

const lintChangedTask = defineTask('claudekit-safety-lint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Lint Changed Files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Linter',
      task: 'Run linting on files changed since last check. Report lint violations with auto-fix suggestions.',
      context: { ...args },
      instructions: [
        'Identify files changed since last lint run',
        'Run ESLint with project configuration',
        'Parse output for errors and warnings',
        'Attempt auto-fix for fixable violations',
        'Report remaining violations with file, line, rule, and message',
        'Return pass/fail status with violation count'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'lint']
}));

const testChangedTask = defineTask('claudekit-safety-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Changed Files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Test Runner',
      task: 'Run tests related to changed files. Report test results with pass/fail status and failure details.',
      context: { ...args },
      instructions: [
        'Identify test files related to changed source files',
        'Run targeted test suite using vitest or configured test runner',
        'Collect test results with pass/fail per test',
        'Report failure details with test name, expected vs actual',
        'Calculate test coverage for changed files',
        'Return pass/fail status with coverage summary'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'test']
}));

const checkCommentReplacementTask = defineTask('claudekit-safety-comment-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check Comment Replacement',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Comment Checker',
      task: 'Detect if code changes replaced actual implementation with placeholder comments. This is a critical safety check to prevent AI hallucination artifacts.',
      context: { ...args },
      instructions: [
        'Diff changed files to detect removed code blocks',
        'Check if removed code was replaced with comments like "// ... rest of implementation"',
        'Flag patterns: "// existing code", "// unchanged", "// same as before", "// TODO: implement"',
        'This is a critical check: replacing code with comments is never acceptable',
        'Report each instance with file, line, and the replaced content',
        'Return pass/fail with violation details'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'comment-replacement']
}));

const checkUnusedParamsTask = defineTask('claudekit-safety-unused-params', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check Unused Parameters',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Parameter Checker',
      task: 'Detect unused parameters in changed functions and methods. Flag parameters that are declared but never referenced in the function body.',
      context: { ...args },
      instructions: [
        'Parse changed functions for parameter declarations',
        'Check each parameter for usage within the function body',
        'Ignore parameters prefixed with _ (intentionally unused per convention)',
        'Report unused parameters with function name, parameter name, and file location',
        'Suggest either using the parameter or prefixing with _',
        'Return pass/fail with unused parameter list'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'unused-params']
}));

// ============================================================================
// CHECKPOINT AND PROFILING TASKS
// ============================================================================

const createSafetyCheckpointTask = defineTask('claudekit-safety-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Safety Checkpoint',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Checkpoint Manager',
      task: 'Create a git-backed safety checkpoint after all quality checks pass. Include check results in checkpoint metadata.',
      context: { ...args },
      instructions: [
        'Verify all quality checks have passed',
        'Stage all current changes',
        'Create checkpoint commit with [SAFETY-CHECKPOINT] prefix',
        'Tag with claudekit-safety-{timestamp}',
        'Include quality check results in tag annotation',
        'Return checkpoint details'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'checkpoint']
}));

const profileHookExecutionTask = defineTask('claudekit-safety-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Profile Hook Execution Times',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Hook Profiler',
      task: 'Profile execution times for all hook invocations in this pipeline run. Generate color-coded performance report.',
      context: { ...args },
      instructions: [
        'Collect timing data for each hook invocation',
        'Calculate execution time per hook',
        'Red alert: hooks exceeding 5 seconds',
        'Yellow warning: hooks exceeding 3 seconds',
        'Green: hooks under 3 seconds',
        'Measure output size for each hook',
        'Flag hooks with excessive output (>10KB)',
        'Return profiling report with timing breakdown and alerts'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'profiling']
}));

const selfReviewTask = defineTask('claudekit-safety-self-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Self-Review Session Changes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Self-Reviewer',
      task: 'Perform a comprehensive self-review of all changes made during this session. Check for regressions, incomplete implementations, and consistency.',
      context: { ...args },
      instructions: [
        'Review all files changed during this session',
        'Check for incomplete implementations or TODO markers',
        'Verify no regressions were introduced',
        'Ensure consistency across all changed files',
        'Check that error handling is complete',
        'Verify documentation was updated where needed',
        'Return self-review report with findings'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'self-review']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    hookConfig = {},
    fileGuardPatterns = {},
    checkpointLabel = 'safety-check',
    enableProfiling = true,
    sessionId = null
  } = inputs;

  ctx.log('Starting ClaudeKit Safety Pipeline');

  // Phase 1: Initialize file guard
  ctx.log('Phase 1: Initializing file guard (195+ patterns, 12 categories)');
  const fileGuard = await ctx.task(initFileGuardTask, {
    projectRoot,
    customPatterns: fileGuardPatterns
  });

  // Phase 2: Scan for existing sensitive file access
  ctx.log('Phase 2: Scanning for sensitive file access');
  const accessScan = await ctx.task(scanFileAccessTask, {
    projectRoot,
    fileGuard
  });

  if (accessScan.blockedCount > 0) {
    await ctx.breakpoint({
      title: 'Sensitive File Access Detected',
      description: `${accessScan.blockedCount} sensitive file access attempts were detected and blocked. Review the details.`,
      context: { blockedAccesses: accessScan.blocked }
    });
  }

  // Phase 3: Run all PostToolUse quality checks in parallel
  ctx.log('Phase 3: Running quality checks in parallel (typecheck, lint, test, comment, params)');
  const [
    typecheckResult,
    lintResult,
    testResult,
    commentResult,
    unusedParamsResult
  ] = await ctx.parallel.all([
    ctx.task(typecheckChangedTask, { projectRoot }),
    ctx.task(lintChangedTask, { projectRoot }),
    ctx.task(testChangedTask, { projectRoot }),
    ctx.task(checkCommentReplacementTask, { projectRoot }),
    ctx.task(checkUnusedParamsTask, { projectRoot })
  ]);

  const qualityChecks = {
    typecheck: typecheckResult,
    lint: lintResult,
    test: testResult,
    commentReplacement: commentResult,
    unusedParams: unusedParamsResult,
    allPassed: typecheckResult.passed && lintResult.passed && testResult.passed &&
               commentResult.passed && unusedParamsResult.passed
  };

  // Phase 4: Self-review
  ctx.log('Phase 4: Self-review of session changes');
  const selfReview = await ctx.task(selfReviewTask, {
    projectRoot,
    qualityChecks,
    sessionId
  });

  // Phase 5: Quality-gated convergence - retry if checks fail
  let convergenceAttempt = 0;
  const maxConvergence = 2;
  let currentChecks = qualityChecks;

  while (!currentChecks.allPassed && convergenceAttempt < maxConvergence) {
    convergenceAttempt++;
    ctx.log(`Convergence attempt ${convergenceAttempt}/${maxConvergence}: Re-running failed checks`);

    await ctx.breakpoint({
      title: `Quality Check Failures - Attempt ${convergenceAttempt}`,
      description: 'Some quality checks failed. Fix issues and approve re-check.',
      context: {
        typecheck: currentChecks.typecheck.passed ? 'PASS' : 'FAIL',
        lint: currentChecks.lint.passed ? 'PASS' : 'FAIL',
        test: currentChecks.test.passed ? 'PASS' : 'FAIL',
        commentReplacement: currentChecks.commentReplacement.passed ? 'PASS' : 'FAIL',
        unusedParams: currentChecks.unusedParams.passed ? 'PASS' : 'FAIL'
      }
    });

    const [tc, ln, ts, cr, up] = await ctx.parallel.all([
      ctx.task(typecheckChangedTask, { projectRoot, retry: convergenceAttempt }),
      ctx.task(lintChangedTask, { projectRoot, retry: convergenceAttempt }),
      ctx.task(testChangedTask, { projectRoot, retry: convergenceAttempt }),
      ctx.task(checkCommentReplacementTask, { projectRoot, retry: convergenceAttempt }),
      ctx.task(checkUnusedParamsTask, { projectRoot, retry: convergenceAttempt })
    ]);

    currentChecks = {
      typecheck: tc, lint: ln, test: ts,
      commentReplacement: cr, unusedParams: up,
      allPassed: tc.passed && ln.passed && ts.passed && cr.passed && up.passed
    };
  }

  // Phase 6: Create checkpoint and profile hooks
  ctx.log('Phase 6: Creating checkpoint and profiling hooks');
  const [checkpoint, hookProfile] = await ctx.parallel.all([
    ctx.task(createSafetyCheckpointTask, {
      projectRoot,
      label: checkpointLabel,
      qualityChecks: currentChecks,
      selfReview
    }),
    enableProfiling ? ctx.task(profileHookExecutionTask, {
      hookConfig,
      qualityChecks: currentChecks
    }) : Promise.resolve({ profiling: 'disabled' })
  ]);

  ctx.log('ClaudeKit Safety Pipeline complete');

  return {
    success: currentChecks.allPassed,
    fileGuard: {
      initialized: true,
      patternCount: fileGuard.totalPatterns,
      categories: fileGuard.categoryCount,
      blockedAccesses: accessScan.blockedCount
    },
    qualityChecks: {
      typecheck: { passed: currentChecks.typecheck.passed, errors: currentChecks.typecheck.errorCount },
      lint: { passed: currentChecks.lint.passed, violations: currentChecks.lint.violationCount },
      test: { passed: currentChecks.test.passed, failures: currentChecks.test.failureCount },
      commentReplacement: { passed: currentChecks.commentReplacement.passed },
      unusedParams: { passed: currentChecks.unusedParams.passed },
      allPassed: currentChecks.allPassed,
      convergenceAttempts: convergenceAttempt
    },
    checkpoint,
    hookProfile,
    sessionState: {
      sessionId,
      selfReview: selfReview.summary,
      isolated: true
    },
    summary: {
      fileGuardPatterns: fileGuard.totalPatterns,
      qualityChecksPassed: currentChecks.allPassed,
      checkpointCreated: checkpoint.success,
      profilingEnabled: enableProfiling,
      convergenceAttempts: convergenceAttempt
    }
  };
}
