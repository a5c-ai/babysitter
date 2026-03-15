/**
 * @process pilot-shell/quality-pipeline
 * @description Quality hooks pipeline: lint/format/typecheck -> TDD enforcement -> context monitoring
 * @inputs { projectPath?: string, language?: string, checkTdd?: boolean, contextThreshold?: number }
 * @outputs { success: boolean, quality: object, tdd: object, context: object }
 *
 * Attribution: Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Pilot Shell Quality Pipeline
 *
 * Implements the full quality hooks system from Pilot Shell:
 * - PostToolUse hooks: file_checker, tdd_enforcer, context_monitor
 * - Language-specific tool chains: Python, TypeScript, Go
 * - TDD enforcement across all changes
 * - Context usage monitoring with threshold alerts and preservation triggers
 *
 * Agents referenced from agents/ directory:
 *   - file-checker: Language-specific lint/format/typecheck
 *   - tdd-enforcer: Test-first implementation verification
 *   - context-monitor: Context usage tracking and threshold alerts
 *
 * Skills referenced from skills/ directory:
 *   - quality-hooks: Language-specific auto-lint/format/typecheck
 *   - strict-tdd: RED->GREEN->REFACTOR enforcement
 *   - context-preservation: State capture at thresholds
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectPath - Path to project root
 * @param {string} inputs.language - Override language detection
 * @param {boolean} inputs.checkTdd - Enable TDD enforcement checking
 * @param {number} inputs.contextThreshold - Context usage % to trigger preservation (default: 70)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    projectPath = '.',
    language = null,
    checkTdd = true,
    contextThreshold = 70
  } = inputs;

  // ============================================================================
  // PHASE 1: LANGUAGE DETECTION AND TOOL SELECTION
  // ============================================================================

  const detectionResult = await ctx.task(languageDetectionTask, {
    projectPath,
    languageOverride: language
  });

  // ============================================================================
  // PHASE 2: QUALITY HOOKS PIPELINE (parallel per tool type)
  // ============================================================================

  const toolChain = selectToolChain(detectionResult.language);

  const [lintResult, formatResult, typecheckResult] = await ctx.parallel.all([
    () => ctx.task(lintCheckTask, {
      projectPath,
      language: detectionResult.language,
      tool: toolChain.linter,
      autoFix: true
    }),
    () => ctx.task(formatCheckTask, {
      projectPath,
      language: detectionResult.language,
      tool: toolChain.formatter,
      autoFix: true
    }),
    () => ctx.task(typecheckTask, {
      projectPath,
      language: detectionResult.language,
      tool: toolChain.typechecker
    })
  ]);

  const qualityPassed = lintResult.passed && formatResult.passed && typecheckResult.passed;

  // ============================================================================
  // PHASE 3: TDD ENFORCEMENT (conditional)
  // ============================================================================

  let tddResult = { checked: false, compliant: true };
  if (checkTdd) {
    tddResult = await ctx.task(tddEnforcementCheckTask, {
      projectPath,
      language: detectionResult.language,
      testFramework: detectionResult.testFramework
    });
  }

  // ============================================================================
  // PHASE 4: CONTEXT MONITORING
  // ============================================================================

  const contextResult = await ctx.task(contextMonitorTask, {
    contextThreshold,
    qualityResults: { lint: lintResult, format: formatResult, typecheck: typecheckResult },
    tddResult
  });

  // Trigger context preservation if threshold exceeded
  if (contextResult.usagePercent >= contextThreshold) {
    await ctx.task(contextPreservationTask, {
      usagePercent: contextResult.usagePercent,
      qualityState: { lint: lintResult, format: formatResult, typecheck: typecheckResult, tdd: tddResult }
    });
  }

  // Convergence: if quality not passed, enter auto-fix loop
  let fixIterations = 0;
  const maxFixIterations = 3;
  let currentLint = lintResult;
  let currentFormat = formatResult;
  let currentTypecheck = typecheckResult;

  while (!qualityPassed && fixIterations < maxFixIterations) {
    fixIterations++;

    const autoFixResult = await ctx.task(autoFixIterationTask, {
      lintIssues: currentLint.issues || [],
      formatIssues: currentFormat.issues || [],
      typecheckErrors: currentTypecheck.errors || [],
      language: detectionResult.language,
      toolChain,
      iteration: fixIterations
    });

    // Re-check after fixes
    [currentLint, currentFormat, currentTypecheck] = await ctx.parallel.all([
      () => ctx.task(lintCheckTask, {
        projectPath,
        language: detectionResult.language,
        tool: toolChain.linter,
        autoFix: false
      }),
      () => ctx.task(formatCheckTask, {
        projectPath,
        language: detectionResult.language,
        tool: toolChain.formatter,
        autoFix: false
      }),
      () => ctx.task(typecheckTask, {
        projectPath,
        language: detectionResult.language,
        tool: toolChain.typechecker
      })
    ]);

    if (currentLint.passed && currentFormat.passed && currentTypecheck.passed) break;
  }

  const allPassed = currentLint.passed && currentFormat.passed && currentTypecheck.passed;

  return {
    success: allPassed && tddResult.compliant,
    quality: {
      passed: allPassed,
      lint: currentLint,
      format: currentFormat,
      typecheck: currentTypecheck,
      fixIterations,
      language: detectionResult.language,
      toolChain
    },
    tdd: tddResult,
    context: contextResult,
    artifacts: {
      qualityReport: 'artifacts/QUALITY-REPORT.md'
    },
    metadata: {
      processId: 'pilot-shell/quality-pipeline',
      timestamp: ctx.now(),
      attribution: 'Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)'
    }
  };
}

/**
 * Select tool chain based on detected language
 */
function selectToolChain(language) {
  const toolChains = {
    python: { linter: 'ruff', formatter: 'ruff format', typechecker: 'pyright' },
    typescript: { linter: 'eslint', formatter: 'prettier', typechecker: 'tsc' },
    javascript: { linter: 'eslint', formatter: 'prettier', typechecker: 'tsc' },
    go: { linter: 'golangci-lint', formatter: 'gofmt', typechecker: 'go vet' }
  };
  return toolChains[language.toLowerCase()] || toolChains.typescript;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const languageDetectionTask = defineTask('language-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect project language and tools',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'language and tooling detector',
      task: 'Detect the project primary language, framework, and available quality tools',
      context: args,
      instructions: [
        'Check for language-specific config files (package.json, pyproject.toml, go.mod)',
        'Identify installed quality tools',
        'Detect test framework',
        'Return appropriate tool chain selection'
      ],
      outputFormat: 'JSON with language (string), framework (string), testFramework (string), availableTools (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['language'],
      properties: {
        language: { type: 'string' },
        framework: { type: 'string' },
        testFramework: { type: 'string' },
        availableTools: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'detection']
}));

export const lintCheckTask = defineTask('lint-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lint check: ${args.tool}${args.autoFix ? ' (auto-fix)' : ''}`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'linting specialist',
      task: `Run ${args.tool} linter${args.autoFix ? ' with auto-fix' : ''} on the project`,
      context: args,
      instructions: [
        `Execute ${args.tool} on the project source files`,
        args.autoFix ? 'Auto-fix all fixable issues' : 'Report all issues without fixing',
        'Categorize issues by severity (error, warning, info)',
        'Return structured results'
      ],
      outputFormat: 'JSON with passed (boolean), tool (string), issues (array of {file, line, severity, rule, message}), autoFixed (number), remaining (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'tool'],
      properties: {
        passed: { type: 'boolean' },
        tool: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        autoFixed: { type: 'number' },
        remaining: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'lint']
}));

export const formatCheckTask = defineTask('format-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Format check: ${args.tool}${args.autoFix ? ' (auto-fix)' : ''}`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'formatting specialist',
      task: `Run ${args.tool} formatter${args.autoFix ? ' with auto-fix' : ''} on the project`,
      context: args,
      instructions: [
        `Execute ${args.tool} on the project source files`,
        args.autoFix ? 'Auto-format all files' : 'Check formatting without changes',
        'Report files that needed formatting',
        'Return structured results'
      ],
      outputFormat: 'JSON with passed (boolean), tool (string), issues (array of {file, description}), formatted (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'tool'],
      properties: {
        passed: { type: 'boolean' },
        tool: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        formatted: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'format']
}));

export const typecheckTask = defineTask('typecheck', (args, taskCtx) => ({
  kind: 'agent',
  title: `Type check: ${args.tool}`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'type checking specialist',
      task: `Run ${args.tool} type checker on the project`,
      context: args,
      instructions: [
        `Execute ${args.tool} for type checking`,
        'Report all type errors with file:line references',
        'Categorize errors (missing types, incompatible types, etc.)',
        'Return structured results'
      ],
      outputFormat: 'JSON with passed (boolean), tool (string), errors (array of {file, line, code, message, category}), errorCount (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'tool'],
      properties: {
        passed: { type: 'boolean' },
        tool: { type: 'string' },
        errors: { type: 'array', items: { type: 'object' } },
        errorCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'typecheck']
}));

export const tddEnforcementCheckTask = defineTask('tdd-enforcement-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD enforcement check',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD compliance auditor',
      task: 'Check that recent changes follow test-first discipline',
      context: args,
      instructions: [
        'Analyze recent git commits for TDD compliance',
        'Check: were test files modified/created before implementation files?',
        'Verify new code has corresponding test coverage',
        'Flag any implementation without prior failing test',
        'Score compliance 0-100'
      ],
      outputFormat: 'JSON with checked (boolean), compliant (boolean), score (number), violations (array of {commit, file, description}), recommendation (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['checked', 'compliant', 'score'],
      properties: {
        checked: { type: 'boolean' },
        compliant: { type: 'boolean' },
        score: { type: 'number' },
        violations: { type: 'array', items: { type: 'object' } },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'tdd-enforcement']
}));

export const contextMonitorTask = defineTask('context-monitor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor context usage',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'context usage monitor',
      task: 'Track context window usage and determine if preservation thresholds are approaching',
      context: args,
      instructions: [
        'Estimate current context window usage',
        'Compare against threshold percentage',
        'If approaching threshold, recommend context preservation',
        'Track quality state size for efficient preservation',
        'Report context health metrics'
      ],
      outputFormat: 'JSON with usagePercent (number), thresholdReached (boolean), preservationRecommended (boolean), metrics (object with tokensUsed, tokensAvailable, stateSize)'
    },
    outputSchema: {
      type: 'object',
      required: ['usagePercent', 'thresholdReached'],
      properties: {
        usagePercent: { type: 'number' },
        thresholdReached: { type: 'boolean' },
        preservationRecommended: { type: 'boolean' },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'context-monitor']
}));

export const contextPreservationTask = defineTask('context-preservation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Preserve context state',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'context preservation specialist',
      task: 'Capture current quality and task state for restoration after compaction',
      context: args,
      instructions: [
        'Serialize current quality check results',
        'Capture task progress state',
        'Store plan/spec completion status',
        'Write to persistent state file for post-compaction restore',
        'Include enough context for seamless continuation'
      ],
      outputFormat: 'JSON with preserved (boolean), stateFile (string), stateSize (number), restorable (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['preserved', 'restorable'],
      properties: {
        preserved: { type: 'boolean' },
        stateFile: { type: 'string' },
        stateSize: { type: 'number' },
        restorable: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'preservation']
}));

export const autoFixIterationTask = defineTask('auto-fix-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auto-fix iteration ${args.iteration}`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'automated issue fixer',
      task: 'Apply automated fixes for lint, format, and type errors',
      context: args,
      instructions: [
        'Apply lint auto-fixes for fixable rules',
        'Apply format corrections',
        'Attempt to resolve type errors with safe transformations',
        'Do not break existing tests',
        'Report what was fixed'
      ],
      outputFormat: 'JSON with fixesApplied (number), lintFixed (number), formatFixed (number), typecheckFixed (number), testsStillPassing (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied'],
      properties: {
        fixesApplied: { type: 'number' },
        lintFixed: { type: 'number' },
        formatFixed: { type: 'number' },
        typecheckFixed: { type: 'number' },
        testsStillPassing: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality', 'auto-fix', `iteration-${args.iteration}`]
}));
