/**
 * @process specializations/desktop-development/incremental-feature-e2e-gate
 * @description Incremental Feature E2E Gate - Ensures E2E tests are updated when new routes, pages, or features
 * are added to an existing desktop application. Prevents the gap where feature code passes unit/integration tests
 * but E2E coverage is stale from a previous build run.
 * @inputs { projectName: string, framework?: string, testFramework?: string, newRoutes?: array, newFeatures?: array, existingE2eDir?: string, outputDir?: string }
 * @outputs { success: boolean, e2eTestsAdded: number, coverageReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/incremental-feature-e2e-gate', {
 *   projectName: 'CrudeOilTracker',
 *   framework: 'Electron',
 *   testFramework: 'Playwright',
 *   newRoutes: ['/dubai-oman', '/murban', '/ulsd'],
 *   newFeatures: ['multi-commodity-nav', 'commodity-detail-view'],
 *   existingE2eDir: 'e2e'
 * });
 *
 * @motivation
 * Discovered during retrospective of crude-oil-tracker build runs. Run 2 added 3 new commodity
 * pages (Dubai/Oman, Murban, ULSD) with zero E2E coverage — all 23 existing E2E tests passed
 * because they only covered the original 2 commodities. The process template had no task
 * requiring agents to update E2E tests when adding features.
 *
 * @references
 * - Playwright Electron: https://playwright.dev/docs/api/class-electron
 * - Related issue: https://github.com/a5c-ai/babysitter/issues/59
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    testFramework = 'Playwright',
    newRoutes = [],
    newFeatures = [],
    existingE2eDir = 'e2e',
    outputDir = 'incremental-e2e'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Incremental Feature E2E Gate: ${projectName}`);

  // ============================================================================
  // PHASE 1: INVENTORY NEW FEATURES & EXISTING E2E COVERAGE
  // ============================================================================

  ctx.log('info', 'Phase 1: Inventorying new features and existing E2E coverage');

  const inventory = await ctx.task(inventoryTask, {
    projectName, framework, testFramework,
    newRoutes, newFeatures, existingE2eDir
  });
  artifacts.push(...(inventory.artifacts || []));

  // ============================================================================
  // PHASE 2: IDENTIFY E2E GAPS
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying E2E coverage gaps');

  const gaps = await ctx.task(identifyGapsTask, {
    projectName, inventory, existingE2eDir
  });
  artifacts.push(...(gaps.artifacts || []));

  if (gaps.uncoveredRoutes.length === 0 && gaps.uncoveredFeatures.length === 0) {
    ctx.log('info', 'All new routes and features already have E2E coverage — gate passed');
    return {
      success: true,
      e2eTestsAdded: 0,
      coverageReport: { uncoveredRoutes: [], uncoveredFeatures: [], alreadyCovered: true },
      artifacts,
      duration: ctx.now() - startTime,
      metadata: { processId: 'specializations/desktop-development/incremental-feature-e2e-gate', timestamp: startTime }
    };
  }
  // ============================================================================
  // PHASE 3: GENERATE E2E TESTS FOR UNCOVERED ROUTES/FEATURES
  // ============================================================================

  ctx.log('info', `Phase 3: Generating E2E tests for ${gaps.uncoveredRoutes.length} routes, ${gaps.uncoveredFeatures.length} features`);

  const [routeTests, featureTests] = await ctx.parallel.all([
    () => ctx.task(generateRouteE2eTestsTask, {
      projectName, framework, testFramework,
      uncoveredRoutes: gaps.uncoveredRoutes,
      existingE2eDir, outputDir
    }),
    () => ctx.task(generateFeatureE2eTestsTask, {
      projectName, framework, testFramework,
      uncoveredFeatures: gaps.uncoveredFeatures,
      existingE2eDir, outputDir
    })
  ]);
  artifacts.push(...(routeTests.artifacts || []), ...(featureTests.artifacts || []));

  // ============================================================================
  // PHASE 4: RUN E2E TESTS & VALIDATE
  // ============================================================================

  ctx.log('info', 'Phase 4: Running E2E tests to validate new coverage');

  const runResult = await ctx.task(runE2eTestsTask, {
    projectName, framework, testFramework, existingE2eDir
  });
  artifacts.push(...(runResult.artifacts || []));

  // ============================================================================
  // PHASE 5: CONVERGENCE — RETRY IF TESTS FAIL
  // ============================================================================

  let convergenceAttempts = 0;
  const maxConvergenceAttempts = 3;
  let finalResult = runResult;

  while (!finalResult.allPassing && convergenceAttempts < maxConvergenceAttempts) {
    convergenceAttempts++;
    ctx.log('info', `Phase 5: Convergence attempt ${convergenceAttempts}/${maxConvergenceAttempts} — ${finalResult.failingTests.length} tests failing`);

    let fixResult = await ctx.task(fixFailingE2eTestsTask, {
      projectName, framework, testFramework,
      failingTests: finalResult.failingTests,
      existingE2eDir
    });
    artifacts.push(...(fixResult.artifacts || []));

    finalResult = await ctx.task(runE2eTestsTask, {
      projectName, framework, testFramework, existingE2eDir
    });
    artifacts.push(...(finalResult.artifacts || []));
  }
  // ============================================================================
  // PHASE 6: QUALITY GATE — PASS/FAIL DECISION
  // ============================================================================

  const totalNewTests = (routeTests.testsAdded || 0) + (featureTests.testsAdded || 0);
  const gatePassed = finalResult.allPassing && totalNewTests > 0;

      let lastFeedback = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback) {
        fixResult = await ctx.task(fixFailingE2eTestsTask, { ...{
      projectName, framework, testFramework,
      failingTests: finalResult.failingTests,
      existingE2eDir
    }, feedback: lastFeedback, attempt: attempt + 1 });
      }
  const phase6Review = await ctx.breakpoint({
      question: [
        `**E2E Gate ${gatePassed ? 'PASSED' : 'FAILED'}**`,
        '',
        `New tests added: ${totalNewTests}`,
        `All passing: ${finalResult.allPassing}`,
        `Convergence attempts: ${convergenceAttempts}/${maxConvergenceAttempts}`,
        finalResult.failingTests?.length > 0
          ? `Failing: ${finalResult.failingTests.map(t => t.name).join(', ')}`
          : '',
        '',
        'The E2E gate did not pass. Review and decide whether to proceed anyway or fix the issues.'
      ].join('\n'),
      title: 'E2E Gate Result',
      context: { runId: ctx.runId, gatePassed, totalNewTests },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase6Review.approved) break;
      lastFeedback = phase6Review.response || phase6Review.feedback || 'Changes requested';
    } }

  return {
    success: gatePassed,
    e2eTestsAdded: totalNewTests,
    coverageReport: {
      uncoveredRoutes: gaps.uncoveredRoutes,
      uncoveredFeatures: gaps.uncoveredFeatures,
      routeTestsAdded: routeTests.testsAdded || 0,
      featureTestsAdded: featureTests.testsAdded || 0,
      convergenceAttempts,
      allPassing: finalResult.allPassing
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/incremental-feature-e2e-gate', timestamp: startTime }
  };
}
  // ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inventoryTask = defineTask('inventory-features-and-e2e', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory new features and existing E2E coverage',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer inventorying application features and E2E test coverage',
      task: 'Catalog all new routes/features and map existing E2E test coverage',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        testFramework: args.testFramework,
        newRoutes: args.newRoutes,
        newFeatures: args.newFeatures,
        existingE2eDir: args.existingE2eDir
      },
      instructions: [
        'Scan the project for new routes/pages added (check router config, navigation components)',
        'If newRoutes provided, use those; otherwise detect from codebase',
        'List all existing E2E test files and the routes/features they cover',
        'Build a coverage map: route → [test files covering it]',
        'Return structured inventory'
      ],
      outputFormat: 'JSON with allRoutes (array), allFeatures (array), existingE2eFiles (array of {file, coversRoutes, coversFeatures}), coverageMap (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['allRoutes', 'existingE2eFiles', 'coverageMap'],
      properties: {
        allRoutes: { type: 'array', items: { type: 'string' } },
        allFeatures: { type: 'array', items: { type: 'string' } },
        existingE2eFiles: { type: 'array', items: { type: 'object' } },
        coverageMap: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'inventory']
}));

export const identifyGapsTask = defineTask('identify-e2e-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify E2E coverage gaps',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA analyst identifying gaps in E2E test coverage',
      task: 'Compare new routes/features against existing E2E coverage to find gaps',
      context: {
        projectName: args.projectName,
        inventory: args.inventory,
        existingE2eDir: args.existingE2eDir
      },
      instructions: [
        'Cross-reference inventory.allRoutes with inventory.coverageMap',
        'Any route with zero covering test files is uncovered',
        'Any feature without dedicated test assertions is uncovered',
        'Prioritize gaps: new routes > new features > existing uncovered',
        'Return structured gap analysis'
      ],
      outputFormat: 'JSON with uncoveredRoutes (array of {route, priority}), uncoveredFeatures (array of {feature, priority}), coveragePercentage (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['uncoveredRoutes', 'uncoveredFeatures'],
      properties: {
        uncoveredRoutes: { type: 'array', items: { type: 'object' } },
        uncoveredFeatures: { type: 'array', items: { type: 'object' } },
        coveragePercentage: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'gaps']
}));

export const generateRouteE2eTestsTask = defineTask('generate-route-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate E2E tests for ${(args.uncoveredRoutes || []).length} uncovered routes`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E test engineer writing route-level end-to-end tests',
      task: 'Write E2E tests for each uncovered route, following existing test patterns',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        testFramework: args.testFramework,
        uncoveredRoutes: args.uncoveredRoutes,
        existingE2eDir: args.existingE2eDir,
        outputDir: args.outputDir
      },
      instructions: [
        'Read existing E2E test files to understand patterns, selectors, and helpers',
        'For each uncovered route, create a test file that covers:',
        '  - Navigation to the route',
        '  - Page renders correctly (key elements present)',
        '  - Data loads (no empty states when data available)',
        '  - Interactions work (clicks, inputs, navigation)',
        '  - Responsive/accessible basics',
        'Follow existing naming conventions (e.g., <route-name>.e2e.ts)',
        'Place tests in the existing E2E directory structure',
        'Return count of tests added and file paths'
      ],
      outputFormat: 'JSON with testsAdded (number), testFiles (array of strings), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['testsAdded', 'testFiles'],
      properties: {
        testsAdded: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'generate-route-tests']
}));

export const generateFeatureE2eTestsTask = defineTask('generate-feature-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate E2E tests for ${(args.uncoveredFeatures || []).length} uncovered features`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E test engineer writing feature-level end-to-end tests',
      task: 'Write E2E tests for each uncovered feature, following existing test patterns',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        testFramework: args.testFramework,
        uncoveredFeatures: args.uncoveredFeatures,
        existingE2eDir: args.existingE2eDir,
        outputDir: args.outputDir
      },
      instructions: [
        'Read existing E2E tests to understand patterns',
        'For each uncovered feature, add test assertions to existing or new test files:',
        '  - Feature is accessible from expected entry points',
        '  - Feature interactions work correctly',
        '  - Feature integrates with existing functionality',
        '  - Error/edge cases handled',
        'Return count of tests added and file paths'
      ],
      outputFormat: 'JSON with testsAdded (number), testFiles (array of strings), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['testsAdded', 'testFiles'],
      properties: {
        testsAdded: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'generate-feature-tests']
}));

export const runE2eTestsTask = defineTask('run-e2e-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run E2E test suite',
  shell: {
    command: `cd ${args.projectName} && npx playwright test --reporter=json 2>&1 || true`,
    parseOutput: 'json'
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test runner executing and parsing E2E test results',
      task: 'Run the full E2E test suite and parse results',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        testFramework: args.testFramework,
        existingE2eDir: args.existingE2eDir
      },
      instructions: [
        'Run the E2E test suite using the project\'s test command',
        'Parse test results: total, passing, failing, skipped',
        'For failing tests, capture test name and error message',
        'Return structured results'
      ],
      outputFormat: 'JSON with allPassing (boolean), total (number), passing (number), failing (number), failingTests (array of {name, error}), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassing', 'total', 'passing'],
      properties: {
        allPassing: { type: 'boolean' },
        total: { type: 'number' },
        passing: { type: 'number' },
        failing: { type: 'number' },
        failingTests: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'run-tests']
}));

export const fixFailingE2eTestsTask = defineTask('fix-failing-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${(args.failingTests || []).length} failing E2E tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E test debugger fixing failing tests',
      task: 'Analyze and fix failing E2E tests',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        testFramework: args.testFramework,
        failingTests: args.failingTests,
        existingE2eDir: args.existingE2eDir
      },
      instructions: [
        'For each failing test, analyze the error message and test code',
        'Common fixes: update selectors, add waits for async operations, fix navigation paths',
        'Do NOT delete tests to make them pass — fix the underlying issue',
        'If a test reveals a real app bug, note it but still fix the test to be correct',
        'Return list of fixes applied'
      ],
      outputFormat: 'JSON with fixesApplied (array of {test, fix}), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied'],
      properties: {
        fixesApplied: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-gate', 'fix-tests']
}));
