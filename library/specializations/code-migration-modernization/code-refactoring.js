/**
 * @process specializations/code-migration-modernization/code-refactoring
 * @description Code Refactoring - Systematic process for restructuring existing code without changing
 * external behavior, improving readability, reducing complexity, and applying modern patterns while
 * maintaining comprehensive test coverage.
 * @inputs { projectName: string, codebasePath?: string, refactoringGoals?: array, qualityTargets?: object }
 * @outputs { success: boolean, analysisReport: object, refactoringPlan: object, changesApplied: array, qualityMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/code-refactoring', {
 *   projectName: 'Payment Service Refactoring',
 *   codebasePath: '/src/payment',
 *   refactoringGoals: ['reduce-complexity', 'improve-testability', 'apply-solid'],
 *   qualityTargets: { maxComplexity: 10, minCoverage: 80, maxDuplication: 3 }
 * });
 *
 * @references
 * - Refactoring (Martin Fowler): https://refactoring.com/
 * - Clean Code (Robert Martin): https://www.oreilly.com/library/view/clean-code/9780136083238/
 * - Refactoring Catalog: https://refactoring.guru/refactoring/catalog
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    codebasePath = '',
    refactoringGoals = [],
    qualityTargets = { maxComplexity: 10, minCoverage: 80, maxDuplication: 5 },
    outputDir = 'refactoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Code Refactoring for ${projectName}`);

  // ============================================================================
  // PHASE 1: CODE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing code quality');
  const codeAnalysis = await ctx.task(codeAnalysisTask, {
    projectName,
    codebasePath,
    qualityTargets,
    outputDir
  });

  artifacts.push(...codeAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: SMELL DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Detecting code smells');
  const smellDetection = await ctx.task(smellDetectionTask, {
    projectName,
    codeAnalysis,
    outputDir
  });

  artifacts.push(...smellDetection.artifacts);

  // Breakpoint: Code smell review
  await ctx.breakpoint({
    question: `Code analysis complete for ${projectName}. Smells detected: ${smellDetection.totalSmells}. Hotspots: ${smellDetection.hotspots.length}. Review findings before planning?`,
    title: 'Code Smell Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      smellDetection,
      recommendation: 'Prioritize high-impact refactoring targets'
    }
  });

  // ============================================================================
  // PHASE 3: REFACTORING PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning refactoring');
  const refactoringPlan = await ctx.task(refactoringPlanningTask, {
    projectName,
    codeAnalysis,
    smellDetection,
    refactoringGoals,
    qualityTargets,
    outputDir
  });

  artifacts.push(...refactoringPlan.artifacts);

  // ============================================================================
  // PHASE 4: TEST COVERAGE ENHANCEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Enhancing test coverage');
  const testEnhancement = await ctx.task(testCoverageEnhancementTask, {
    projectName,
    refactoringPlan,
    codeAnalysis,
    outputDir
  });

  artifacts.push(...testEnhancement.artifacts);

  // ============================================================================
  // PHASE 5: REFACTORING EXECUTION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing refactoring');
  const refactoringExecution = await ctx.task(refactoringExecutionTask, {
    projectName,
    refactoringPlan,
    testEnhancement,
    outputDir
  });

  artifacts.push(...refactoringExecution.artifacts);

  // ============================================================================
  // PHASE 6: CONTINUOUS VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating changes');
  const validation = await ctx.task(refactoringValidationTask, {
    projectName,
    refactoringExecution,
    qualityTargets,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Quality Gate: Validation results
  if (!validation.allTestsPassed) {
    await ctx.breakpoint({
      question: `Validation failed for ${projectName}. Failed tests: ${validation.failedCount}. Review and fix regressions?`,
      title: 'Refactoring Validation Failed',
      context: {
        runId: ctx.runId,
        projectName,
        failures: validation.failures,
        recommendation: 'Fix failing tests before proceeding'
      }
    });
  }

  // ============================================================================
  // PHASE 7: QUALITY METRICS COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 7: Comparing quality metrics');
  const metricsComparison = await ctx.task(metricsComparisonTask, {
    projectName,
    codeAnalysis,
    refactoringExecution,
    qualityTargets,
    outputDir
  });

  artifacts.push(...metricsComparison.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Code refactoring complete for ${projectName}. Complexity reduction: ${metricsComparison.complexityReduction}%. Coverage increase: ${metricsComparison.coverageIncrease}%. Quality targets met: ${metricsComparison.targetsMet}. Approve?`,
    title: 'Code Refactoring Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        refactoringsApplied: refactoringExecution.appliedCount,
        complexityReduction: metricsComparison.complexityReduction,
        coverageIncrease: metricsComparison.coverageIncrease,
        targetsMet: metricsComparison.targetsMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    analysisReport: {
      complexity: codeAnalysis.complexity,
      coverage: codeAnalysis.coverage,
      duplication: codeAnalysis.duplication,
      smells: smellDetection.totalSmells
    },
    refactoringPlan: {
      totalRefactorings: refactoringPlan.totalRefactorings,
      byCategory: refactoringPlan.byCategory,
      estimatedEffort: refactoringPlan.estimatedEffort
    },
    changesApplied: refactoringExecution.appliedRefactorings,
    qualityMetrics: {
      before: metricsComparison.before,
      after: metricsComparison.after,
      improvement: metricsComparison.improvement,
      targetsMet: metricsComparison.targetsMet
    },
    testResults: {
      allPassed: validation.allTestsPassed,
      coverage: validation.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/code-refactoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codeAnalysisTask = defineTask('code-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Code Analysis - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Code Quality Analyst',
      task: 'Analyze code quality metrics',
      context: args,
      instructions: [
        '1. Measure cyclomatic complexity',
        '2. Calculate test coverage',
        '3. Detect code duplication',
        '4. Analyze dependencies',
        '5. Measure maintainability index',
        '6. Count lines of code',
        '7. Identify hotspots',
        '8. Analyze coupling',
        '9. Measure cohesion',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with complexity, coverage, duplication, maintainabilityIndex, hotspots, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complexity', 'coverage', 'duplication', 'artifacts'],
      properties: {
        complexity: { type: 'object' },
        coverage: { type: 'number' },
        duplication: { type: 'number' },
        maintainabilityIndex: { type: 'number' },
        hotspots: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'analysis', 'quality']
}));

export const smellDetectionTask = defineTask('smell-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Smell Detection - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Code Smell Expert',
      task: 'Detect code smells and anti-patterns',
      context: args,
      instructions: [
        '1. Identify long methods',
        '2. Find large classes',
        '3. Detect feature envy',
        '4. Find dead code',
        '5. Identify code duplication',
        '6. Detect primitive obsession',
        '7. Find switch statements',
        '8. Identify parallel inheritance',
        '9. Detect lazy classes',
        '10. Generate smell report'
      ],
      outputFormat: 'JSON with totalSmells, byCategory, hotspots, prioritizedList, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSmells', 'byCategory', 'hotspots', 'artifacts'],
      properties: {
        totalSmells: { type: 'number' },
        byCategory: { type: 'object' },
        hotspots: { type: 'array', items: { type: 'object' } },
        prioritizedList: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'smells', 'detection']
}));

export const refactoringPlanningTask = defineTask('refactoring-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Refactoring Planning - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Refactoring Specialist',
      task: 'Plan refactoring activities',
      context: args,
      instructions: [
        '1. Select refactoring techniques',
        '2. Prioritize by impact',
        '3. Plan execution order',
        '4. Identify dependencies',
        '5. Estimate effort',
        '6. Plan test updates',
        '7. Identify risks',
        '8. Plan rollback',
        '9. Schedule batches',
        '10. Generate refactoring plan'
      ],
      outputFormat: 'JSON with totalRefactorings, byCategory, executionOrder, estimatedEffort, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRefactorings', 'byCategory', 'estimatedEffort', 'artifacts'],
      properties: {
        totalRefactorings: { type: 'number' },
        byCategory: { type: 'object' },
        executionOrder: { type: 'array', items: { type: 'object' } },
        estimatedEffort: { type: 'string' },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'planning', 'prioritization']
}));

export const testCoverageEnhancementTask = defineTask('test-coverage-enhancement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Coverage Enhancement - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Test Engineer',
      task: 'Enhance test coverage before refactoring',
      context: args,
      instructions: [
        '1. Identify coverage gaps',
        '2. Add characterization tests',
        '3. Create golden master tests',
        '4. Add edge case tests',
        '5. Improve integration tests',
        '6. Add contract tests',
        '7. Measure new coverage',
        '8. Set up continuous testing',
        '9. Document test strategy',
        '10. Generate coverage report'
      ],
      outputFormat: 'JSON with newTestsAdded, coverageBefore, coverageAfter, characterizationTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['newTestsAdded', 'coverageAfter', 'artifacts'],
      properties: {
        newTestsAdded: { type: 'number' },
        coverageBefore: { type: 'number' },
        coverageAfter: { type: 'number' },
        characterizationTests: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'testing', 'coverage']
}));

export const refactoringExecutionTask = defineTask('refactoring-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Refactoring Execution - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Senior Developer',
      task: 'Execute planned refactorings',
      context: args,
      instructions: [
        '1. Apply extract method',
        '2. Apply extract class',
        '3. Apply move method',
        '4. Apply rename',
        '5. Remove duplication',
        '6. Apply design patterns',
        '7. Run tests after each change',
        '8. Commit incrementally',
        '9. Document changes',
        '10. Track progress'
      ],
      outputFormat: 'JSON with appliedCount, appliedRefactorings, filesModified, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['appliedCount', 'appliedRefactorings', 'artifacts'],
      properties: {
        appliedCount: { type: 'number' },
        appliedRefactorings: { type: 'array', items: { type: 'object' } },
        filesModified: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'execution', 'code-changes']
}));

export const refactoringValidationTask = defineTask('refactoring-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Refactoring Validation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate refactored code',
      context: args,
      instructions: [
        '1. Run all tests',
        '2. Verify behavior unchanged',
        '3. Check performance',
        '4. Validate integrations',
        '5. Run static analysis',
        '6. Check for regressions',
        '7. Validate edge cases',
        '8. Measure quality metrics',
        '9. Document results',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allTestsPassed, passedCount, failedCount, failures, coverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'passedCount', 'failedCount', 'coverage', 'artifacts'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'validation', 'testing']
}));

export const metricsComparisonTask = defineTask('metrics-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Metrics Comparison - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Quality Analyst',
      task: 'Compare quality metrics before and after',
      context: args,
      instructions: [
        '1. Measure post-refactoring complexity',
        '2. Calculate coverage improvement',
        '3. Measure duplication reduction',
        '4. Compare maintainability',
        '5. Calculate improvement percentages',
        '6. Check against targets',
        '7. Identify remaining issues',
        '8. Calculate ROI',
        '9. Document improvements',
        '10. Generate comparison report'
      ],
      outputFormat: 'JSON with before, after, improvement, complexityReduction, coverageIncrease, targetsMet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['before', 'after', 'improvement', 'targetsMet', 'artifacts'],
      properties: {
        before: { type: 'object' },
        after: { type: 'object' },
        improvement: { type: 'object' },
        complexityReduction: { type: 'number' },
        coverageIncrease: { type: 'number' },
        targetsMet: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['refactoring', 'metrics', 'comparison']
}));
