/**
 * @process agent-mux-implementation
 * @description Iterative spec-driven TDD implementation of @a5c-ai/agent-mux with adversarial review convergence
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const planPhaseTask = defineTask('plan-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan phase ${args.phaseNumber}: ${args.phaseTitle}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript architect planning spec-driven implementation',
      task: `Plan the implementation for phase ${args.phaseNumber}: "${args.phaseTitle}". Define acceptance criteria, file structure, and test plan.`,
      context: {
        phaseNumber: args.phaseNumber,
        phaseTitle: args.phaseTitle,
        specs: args.specs,
        scopeFile: args.scopeFile,
        projectRoot: args.projectRoot,
        previousPhases: args.previousPhases || [],
        phaseDescription: args.phaseDescription,
      },
      instructions: [
        `Read ALL spec files listed: ${JSON.stringify(args.specs)}`,
        `Read the scope document at "${args.scopeFile}" for context.`,
        args.previousPhases?.length ? `Previous phases completed: ${JSON.stringify(args.previousPhases)}. Build on existing code.` : 'This is the first phase. Set up the project structure.',
        'Analyze the specs to identify all types, interfaces, classes, functions, and behaviors to implement.',
        'Define clear acceptance criteria that map directly to spec sections.',
        'Plan the file structure following TypeScript best practices (src/, tests/, etc.).',
        'Plan tests FIRST (TDD): for each type/interface/function, define what tests to write.',
        'Identify dependencies between components and order implementation accordingly.',
        'Return JSON with: { acceptanceCriteria: [{id, description, specRef, priority}], fileStructure: [{path, purpose, exports}], testPlan: [{testFile, describes, testCases: string[]}], implementationOrder: string[], estimatedFiles: number }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['acceptanceCriteria', 'fileStructure', 'testPlan', 'implementationOrder'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementPhaseTask = defineTask('implement-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement phase ${args.phaseNumber}: ${args.phaseTitle}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript developer implementing spec-driven code with TDD',
      task: `Implement phase ${args.phaseNumber}: "${args.phaseTitle}" following the plan and specs. Write tests first, then implementation.`,
      context: {
        phaseNumber: args.phaseNumber,
        phaseTitle: args.phaseTitle,
        specs: args.specs,
        scopeFile: args.scopeFile,
        projectRoot: args.projectRoot,
        plan: args.plan,
        feedback: args.feedback || null,
        attempt: args.attempt || 1,
      },
      instructions: [
        `Read ALL spec files: ${JSON.stringify(args.specs)}`,
        `Read the scope document at "${args.scopeFile}".`,
        `Project root is "${args.projectRoot}". All files go under this directory.`,
        args.attempt > 1 ? `CRITICAL: This is attempt ${args.attempt}. Address this feedback: ${args.feedback}` : '',
        args.attempt === 1 ? 'Read the existing project structure to understand what already exists.' : 'Read existing code to understand what needs to change.',
        'Follow TDD: write failing tests first, then implement code to pass them.',
        'Implementation MUST match the specs exactly: every type, field, method, error, and behavior.',
        'Use TypeScript strict mode. Use ESM imports.',
        'Write clean, well-structured code. No unnecessary abstractions.',
        'Every public type/interface/class must have JSDoc with @see references to the spec.',
        'Tests must cover: happy path, edge cases, error cases, and behavioral contracts from specs.',
        'Actually create all files. Do not just describe what to create.',
        `Use vitest for testing. Config should be in ${args.projectRoot}/vitest.config.ts.`,
        'Return JSON: { filesCreated: string[], filesModified: string[], testsWritten: number, summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const compileCheckTask = defineTask('compile-check', (args, taskCtx) => ({
  kind: 'shell',
  title: `TypeScript compilation check: phase ${args.phaseNumber}`,
  shell: {
    command: `cd "${args.projectRoot}" && npx tsc --noEmit`,
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const testRunTask = defineTask('test-run', (args, taskCtx) => ({
  kind: 'shell',
  title: `Test suite: phase ${args.phaseNumber}`,
  shell: {
    command: `cd "${args.projectRoot}" && npx vitest run --reporter=verbose ${args.testPattern || ''}`,
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const lintCheckTask = defineTask('lint-check', (args, taskCtx) => ({
  kind: 'shell',
  title: `Lint check: phase ${args.phaseNumber}`,
  shell: {
    command: `cd "${args.projectRoot}" && npx eslint src/ --max-warnings=0`,
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review: phase ${args.phaseNumber}`,
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Adversarial code reviewer comparing implementation to specs',
      task: `Review the implementation of phase ${args.phaseNumber}: "${args.phaseTitle}" against the specs. Be harsh and thorough.`,
      context: {
        phaseNumber: args.phaseNumber,
        phaseTitle: args.phaseTitle,
        specs: args.specs,
        scopeFile: args.scopeFile,
        projectRoot: args.projectRoot,
        plan: args.plan,
        targetScore: args.targetScore || 99,
      },
      instructions: [
        `Read ALL spec files: ${JSON.stringify(args.specs)}`,
        `Read the scope document at "${args.scopeFile}".`,
        `Read ALL implementation files under "${args.projectRoot}/src/" relevant to this phase.`,
        `Read ALL test files under "${args.projectRoot}/tests/" relevant to this phase.`,
        'Score on these dimensions (0-100 each):',
        '  - SpecParity (35%): Does the implementation match every type, field, method, error, and behavior in the specs?',
        '  - TestCoverage (25%): Are all spec behaviors tested? Happy path, edge cases, errors?',
        '  - CodeQuality (20%): TypeScript strictness, clean patterns, no unnecessary abstractions?',
        '  - Integration (20%): Does this phase integrate correctly with previous phases?',
        'Look for: missing types/fields, wrong default values, missing error cases, missing test cases, type mismatches, behavioral divergences from spec.',
        'List specific tech debts: things that work but deviate from the spec or could cause integration issues.',
        'Be HARSH. Find every deviation from the specs.',
        'Compute weighted overall: specParity(35%) + testCoverage(25%) + codeQuality(20%) + integration(20%).',
        'Return JSON: { overallScore, dimensions: {specParity, testCoverage, codeQuality, integration}, issues: [{severity, description, specRef, file}], techDebts: string[], feedback, passesTarget }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'dimensions', 'issues', 'feedback', 'passesTarget'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const refactorIntegrateTask = defineTask('refactor-integrate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refactor & integrate: phase ${args.phaseNumber}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript developer refactoring and integrating code',
      task: `Refactor and integrate phase ${args.phaseNumber} implementation. Fix review issues, resolve tech debts, ensure clean integration with the whole system.`,
      context: {
        phaseNumber: args.phaseNumber,
        phaseTitle: args.phaseTitle,
        specs: args.specs,
        scopeFile: args.scopeFile,
        projectRoot: args.projectRoot,
        reviewFeedback: args.reviewFeedback,
        techDebts: args.techDebts,
        issues: args.issues,
      },
      instructions: [
        `Read ALL spec files: ${JSON.stringify(args.specs)}`,
        `Read the implementation under "${args.projectRoot}/src/".`,
        `Read the tests under "${args.projectRoot}/tests/".`,
        `Fix these review issues: ${args.reviewFeedback}`,
        args.techDebts?.length ? `Resolve these tech debts: ${JSON.stringify(args.techDebts)}` : '',
        'Ensure all exports are properly re-exported from package index.',
        'Ensure cross-module integration is clean (imports, type compatibility).',
        'Run through each spec section and verify the implementation matches.',
        'Actually make the changes. Do not just describe them.',
        'Return JSON: { filesModified: string[], issuesFixed: number, techDebtsResolved: string[], summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const integrationTestTask = defineTask('integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration test: phases 1-${args.phaseNumber}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration test engineer verifying cross-phase system coherence',
      task: `Write and run integration tests verifying phases 1 through ${args.phaseNumber} work together correctly.`,
      context: {
        phaseNumber: args.phaseNumber,
        projectRoot: args.projectRoot,
        completedPhases: args.completedPhases,
        specs: args.allSpecs,
      },
      instructions: [
        `Read the existing implementation under "${args.projectRoot}/src/".`,
        `Read the existing tests under "${args.projectRoot}/tests/".`,
        'Write integration tests that verify cross-module interactions.',
        'Test the public API surface end-to-end where possible.',
        'Verify types compose correctly across modules.',
        'Actually create test files and run them.',
        'Return JSON: { testFiles: string[], testCount: number, passingTests: number, failingTests: number, summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ============================================================================
// PHASE DEFINITIONS
// ============================================================================

const PHASES = [
  {
    number: 1,
    title: 'Foundation — Core Types, Errors, and Client Skeleton',
    specs: ['docs/01-core-types-and-client.md'],
    description: 'Set up the monorepo structure, implement all core types (AgentName, ErrorCode, AgentMuxError, CapabilityError, ValidationError), the createClient() factory, ClientOptions, RetryPolicy, storage layout types, and the AgentMuxClient class skeleton with namespace stubs.',
  },
  {
    number: 2,
    title: 'Run Engine — RunOptions, Validation, and Profiles',
    specs: ['docs/02-run-options-and-profiles.md'],
    description: 'Implement RunOptions interface, all supporting types (Attachment, McpServerConfig), validation pipeline, capability-gating logic, the profile system (ProfileData, ProfileManager, resolution/merge), and thinking effort translation tables.',
  },
  {
    number: 3,
    title: 'Run Handle and Event Streaming',
    specs: ['docs/03-run-handle-and-interaction.md', 'docs/04-agent-events.md'],
    description: 'Implement RunHandle, RunResult, InteractionChannel, the full AgentEvent union type (67 event types, 18 categories), BaseEvent, event streaming pipeline, backpressure management, run lifecycle state machine, and the two-phase shutdown mechanism.',
  },
  {
    number: 4,
    title: 'Adapter System — Contract, Base Class, and Registry',
    specs: ['docs/05-adapter-system.md', 'docs/06-capabilities-and-models.md'],
    description: 'Implement BaseAgentAdapter abstract class with all hooks, AdapterRegistry, AgentCapabilities, ModelCapabilities, ModelRegistry, capability profiles, thinking normalization, and the adapter lifecycle.',
  },
  {
    number: 5,
    title: 'Session Manager and Config/Auth',
    specs: ['docs/07-session-manager.md', 'docs/08-config-and-auth.md'],
    description: 'Implement SessionManager (session listing, reading, metadata), ConfigManager (read/write/merge agent configs), AuthManager (auth state detection, setup guidance), and AgentConfig type system.',
  },
  {
    number: 6,
    title: 'Plugin Manager and Plugin Ecosystem',
    specs: ['docs/09-plugin-manager.md'],
    description: 'Implement PluginManager (install/list/remove/search plugins), plugin registries, skill management, the unified plugin interface across agent-specific plugin systems.',
  },
  {
    number: 7,
    title: 'Process Lifecycle, Safety, and Platform Support',
    specs: ['docs/11-process-lifecycle-and-platform.md'],
    description: 'Implement ProcessTracker, signal handling, two-phase shutdown, PTY management, cross-platform support (Windows/macOS/Linux), graceful termination, and process group management.',
  },
  {
    number: 8,
    title: 'Built-in Adapters — All 10 Agent Implementations',
    specs: ['docs/12-built-in-adapters.md', 'docs/06-capabilities-and-models.md'],
    description: 'Implement all 10 built-in adapters (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes). Each adapter: buildSpawnArgs, parseEvent, event mapping tables, install detection, auth detection.',
  },
  {
    number: 9,
    title: 'CLI Binary (amux) — Command Reference',
    specs: ['docs/10-cli-reference.md'],
    description: 'Implement the amux CLI binary with all commands: run, adapters, models, sessions, config, auth, profiles, plugins, install, version, help. Wire up to the SDK.',
  },
  {
    number: 10,
    title: 'Final Integration, Polish, and Full System Test',
    specs: [
      'docs/01-core-types-and-client.md',
      'docs/02-run-options-and-profiles.md',
      'docs/03-run-handle-and-interaction.md',
      'docs/04-agent-events.md',
      'docs/05-adapter-system.md',
      'docs/06-capabilities-and-models.md',
      'docs/07-session-manager.md',
      'docs/08-config-and-auth.md',
      'docs/09-plugin-manager.md',
      'docs/10-cli-reference.md',
      'docs/11-process-lifecycle-and-platform.md',
      'docs/12-built-in-adapters.md',
    ],
    description: 'Full system integration test, fix all remaining tech debts, verify all package exports, ensure all specs are fully covered, final polish pass.',
  },
];

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    scopeFile = 'C:/work/agent-mux/agent-mux-scope.md',
    projectRoot = 'C:/work/agent-mux',
    specDir = 'C:/work/agent-mux/docs',
    targetScore = 99,
    maxIterationsPerPhase = 10,
  } = inputs;

  const startTime = ctx.now();
  const completedPhases = [];
  const phaseResults = [];
  const allSpecs = PHASES.flatMap(p => p.specs).filter((s, i, a) => a.indexOf(s) === i);

  ctx.log('info', `Starting agent-mux implementation. ${PHASES.length} phases, target: ${targetScore}%`);

  // ============================================================================
  // PROJECT SETUP (Phase 0)
  // ============================================================================

  ctx.log('info', 'Phase 0: Project scaffolding');

  const scaffoldTask = defineTask('scaffold-project', (args, taskCtx) => ({
    kind: 'agent',
    title: 'Scaffold project structure',
    execution: { model: 'claude-opus-4-6' },
    agent: {
      name: 'general-purpose',
      prompt: {
        role: 'TypeScript project setup specialist',
        task: 'Set up the monorepo project structure for @a5c-ai/agent-mux.',
        context: {
          projectRoot: args.projectRoot,
          scopeFile: args.scopeFile,
        },
        instructions: [
          `Read the scope document at "${args.scopeFile}" section 1 (Package Identity).`,
          `Read spec 01 at "${args.projectRoot}/docs/01-core-types-and-client.md" sections 1.1-1.3 for package structure.`,
          `Project root is "${args.projectRoot}".`,
          'Set up a TypeScript monorepo with these packages:',
          '  - packages/agent-mux/core/ — @a5c-ai/agent-mux-comm (types, client, stream engine)',
          '  - packages/agent-mux/adapters/ — @a5c-ai/agent-mux-adapters (built-in adapters)',
          '  - packages/agent-mux/cli/ — @a5c-ai/agent-mux-cli (amux binary)',
          '  - packages/agent-mux/sdk/ — @a5c-ai/agent-mux (meta-package)',
          'Create: tsconfig.json (strict, ESM, path aliases), package.json (workspaces), vitest.config.ts.',
          'Set up each package with its own package.json, tsconfig.json, src/index.ts.',
          'Use Node 20+ features. ESM with CJS compat shim noted in spec.',
          'Add devDependencies: typescript, vitest, eslint, @types/node.',
          'Actually create all files. Return JSON: { filesCreated: string[], summary: string }',
        ],
        outputFormat: 'JSON',
      },
      outputSchema: { type: 'object', required: ['filesCreated', 'summary'] },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }));

  await ctx.task(scaffoldTask, { projectRoot, scopeFile });

  // ============================================================================
  // MAIN PHASE LOOP
  // ============================================================================

  for (const phase of PHASES) {
    ctx.log('info', `\n${'='.repeat(60)}`);
    ctx.log('info', `PHASE ${phase.number}: ${phase.title}`);
    ctx.log('info', `${'='.repeat(60)}`);

    const specPaths = phase.specs.map(s => `${projectRoot}/${s}`);

    // ── Part 1: Planning ──────────────────────────────────────────────

    ctx.log('info', `Phase ${phase.number} Part 1: Planning and acceptance criteria`);

    const plan = await ctx.task(planPhaseTask, {
      phaseNumber: phase.number,
      phaseTitle: phase.title,
      specs: specPaths,
      scopeFile,
      projectRoot,
      previousPhases: completedPhases,
      phaseDescription: phase.description,
    });

    // ── Part 2: Implementation + Test convergence loop ────────────────

    ctx.log('info', `Phase ${phase.number} Part 2: Implementation and testing (TDD)`);

    let phaseScore = 0;
    let lastFeedback = null;
    let lastTechDebts = [];
    let lastIssues = [];
    let iteration = 0;

    while (phaseScore < targetScore && iteration < maxIterationsPerPhase) {
      iteration++;
      ctx.log('info', `  Iteration ${iteration}: ${iteration === 1 ? 'Initial implementation' : 'Refinement'}`);

      // Implement (or refine)
      await ctx.task(implementPhaseTask, {
        phaseNumber: phase.number,
        phaseTitle: phase.title,
        specs: specPaths,
        scopeFile,
        projectRoot,
        plan,
        feedback: lastFeedback,
        attempt: iteration,
      });

      // Shell gates: compile + test
      let compileOk = false;
      let testsOk = false;

      try {
        await ctx.task(compileCheckTask, { phaseNumber: phase.number, projectRoot });
        compileOk = true;
      } catch (e) {
        ctx.log('warn', `  Compilation failed on iteration ${iteration}`);
      }

      if (compileOk) {
        try {
          await ctx.task(testRunTask, { phaseNumber: phase.number, projectRoot });
          testsOk = true;
        } catch (e) {
          ctx.log('warn', `  Tests failed on iteration ${iteration}`);
        }
      }

      // If shell gates fail, feed back to implementation without running adversarial review
      if (!compileOk || !testsOk) {
        lastFeedback = !compileOk
          ? 'TypeScript compilation failed. Fix type errors and ensure all imports resolve.'
          : 'Test suite failed. Fix failing tests and ensure all test cases pass.';
        phaseScore = 0;
        continue;
      }

      // Adversarial review
      const review = await ctx.task(adversarialReviewTask, {
        phaseNumber: phase.number,
        phaseTitle: phase.title,
        specs: specPaths,
        scopeFile,
        projectRoot,
        plan,
        targetScore,
      });

      phaseScore = review.overallScore || 0;
      lastFeedback = review.feedback;
      lastTechDebts = review.techDebts || [];
      lastIssues = review.issues || [];

      ctx.log('info', `  Review score: ${phaseScore}/100 (target: ${targetScore}). Issues: ${lastIssues.length}`);

      if (phaseScore >= targetScore) {
        ctx.log('info', `  Phase ${phase.number} converged at ${phaseScore} after ${iteration} iteration(s)`);
        break;
      }

      if (iteration >= maxIterationsPerPhase) {
        ctx.log('warn', `  Phase ${phase.number} reached max iterations at score ${phaseScore}`);
      }
    }

    // ── Part 3: Refactor, integrate, and polish ───────────────────────

    ctx.log('info', `Phase ${phase.number} Part 3: Refactor and integrate`);

    if (lastTechDebts.length > 0 || lastIssues.length > 0) {
      await ctx.task(refactorIntegrateTask, {
        phaseNumber: phase.number,
        phaseTitle: phase.title,
        specs: specPaths,
        scopeFile,
        projectRoot,
        reviewFeedback: lastFeedback,
        techDebts: lastTechDebts,
        issues: lastIssues,
      });

      // Re-verify after refactor
      try {
        await ctx.task(compileCheckTask, { phaseNumber: phase.number, projectRoot });
        await ctx.task(testRunTask, { phaseNumber: phase.number, projectRoot });
      } catch (e) {
        ctx.log('warn', `  Post-refactor verification failed: ${e.message || 'unknown'}`);
      }
    }

    // Integration test every 2 phases or on the last phase
    if (phase.number % 2 === 0 || phase.number === PHASES.length) {
      ctx.log('info', `  Running integration tests for phases 1-${phase.number}`);
      await ctx.task(integrationTestTask, {
        phaseNumber: phase.number,
        projectRoot,
        completedPhases,
        allSpecs: allSpecs.map(s => `${projectRoot}/${s}`),
      });
    }

    completedPhases.push({
      number: phase.number,
      title: phase.title,
      score: phaseScore,
      iterations: iteration,
    });

    phaseResults.push({
      phaseNumber: phase.number,
      phaseTitle: phase.title,
      finalScore: phaseScore,
      iterations: iteration,
    });

    ctx.log('info', `Phase ${phase.number} complete. Score: ${phaseScore}, Iterations: ${iteration}`);
  }

  const elapsed = ctx.now() - startTime;

  return {
    success: true,
    phasesCompleted: phaseResults.length,
    phaseResults,
    projectRoot,
    elapsedMs: elapsed,
  };
}
