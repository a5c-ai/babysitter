/**
 * @process software-architecture/refactoring-plan
 * @description Systematic refactoring plan creation process with technical debt identification, prioritization, test safety net creation, and actionable implementation roadmap
 * @inputs { codebasePath: string, projectName: string, technicalDebtSources: array, targetQualityScore: number, refactoringBudget: object, constraints: object }
 * @outputs { success: boolean, refactoringPlan: string, technicalDebtInventory: object, prioritizedBacklog: array, testCoverage: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    codebasePath = '.',
    projectName = 'Project',
    technicalDebtSources = [],
    targetQualityScore = 80,
    refactoringBudget = { sprintPercentage: 20, totalSprints: 6 },
    constraints = {},
    outputDir = 'refactoring-plan-output',
    minTestCoverage = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Refactoring Plan Creation for ${projectName}`);

  // ============================================================================
  // PHASE 1: TECHNICAL DEBT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying technical debt across codebase');
  const technicalDebtIdentification = await ctx.task(technicalDebtIdentificationTask, {
    projectName,
    codebasePath,
    technicalDebtSources,
    outputDir
  });

  artifacts.push(...technicalDebtIdentification.artifacts);

  // ============================================================================
  // PHASE 2: CATEGORIZATION AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Categorizing and prioritizing technical debt');
  const debtPrioritization = await ctx.task(debtPrioritizationTask, {
    projectName,
    codebasePath,
    technicalDebtInventory: technicalDebtIdentification,
    refactoringBudget,
    outputDir
  });

  artifacts.push(...debtPrioritization.artifacts);

  // ============================================================================
  // PHASE 3: DEFINE REFACTORING GOALS
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining measurable refactoring goals');
  const refactoringGoals = await ctx.task(refactoringGoalsTask, {
    projectName,
    technicalDebtInventory: technicalDebtIdentification,
    prioritizedBacklog: debtPrioritization,
    targetQualityScore,
    minTestCoverage,
    outputDir
  });

  artifacts.push(...refactoringGoals.artifacts);

  // ============================================================================
  // PHASE 4: CREATE TEST SAFETY NET
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating test safety net for refactoring');
  const testSafetyNet = await ctx.task(testSafetyNetTask, {
    projectName,
    codebasePath,
    prioritizedBacklog: debtPrioritization,
    minTestCoverage,
    outputDir
  });

  artifacts.push(...testSafetyNet.artifacts);

  // ============================================================================
  // PHASE 5: DESIGN REFACTORING APPROACH
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing refactoring approach and patterns');
  const refactoringApproach = await ctx.task(refactoringApproachTask, {
    projectName,
    codebasePath,
    prioritizedBacklog: debtPrioritization,
    refactoringGoals,
    testSafetyNet,
    outputDir
  });

  artifacts.push(...refactoringApproach.artifacts);

  // ============================================================================
  // PHASE 6: ESTIMATE AND SCHEDULE
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating effort and creating refactoring schedule');
  const refactoringSchedule = await ctx.task(refactoringScheduleTask, {
    projectName,
    prioritizedBacklog: debtPrioritization,
    refactoringApproach,
    refactoringBudget,
    constraints,
    outputDir
  });

  artifacts.push(...refactoringSchedule.artifacts);

  // ============================================================================
  // PHASE 7: COMPREHENSIVE REFACTORING PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive refactoring plan document');
  const refactoringPlanDocument = await ctx.task(refactoringPlanGenerationTask, {
    projectName,
    codebasePath,
    technicalDebtIdentification,
    debtPrioritization,
    refactoringGoals,
    testSafetyNet,
    refactoringApproach,
    refactoringSchedule,
    targetQualityScore,
    outputDir
  });

  artifacts.push(...refactoringPlanDocument.artifacts);

  // ============================================================================
  // PHASE 8: PLAN QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating refactoring plan quality and feasibility');
  const planQualityScore = await ctx.task(planQualityScoringTask, {
    projectName,
    technicalDebtIdentification,
    debtPrioritization,
    refactoringGoals,
    testSafetyNet,
    refactoringApproach,
    refactoringSchedule,
    refactoringPlanDocument,
    targetQualityScore,
    outputDir
  });

  artifacts.push(...planQualityScore.artifacts);

  const planScore = planQualityScore.overallScore;
  const qualityMet = planScore >= 85;

  // Breakpoint: Review refactoring plan
  await ctx.breakpoint({
    question: `Refactoring plan complete. Quality score: ${planScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Refactoring Plan Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        planScore,
        qualityMet,
        projectName,
        totalArtifacts: artifacts.length,
        totalDebtItems: technicalDebtIdentification.totalDebtItems || 0,
        highPriorityItems: debtPrioritization.highPriorityItems?.length || 0,
        estimatedDuration: refactoringSchedule.totalDuration || 'N/A',
        currentTestCoverage: testSafetyNet.currentCoverage || 0,
        targetTestCoverage: minTestCoverage
      }
    }
  });

  // ============================================================================
  // PHASE 9: GENERATE IMPLEMENTATION ROADMAP (if approved)
  // ============================================================================

  let implementationRoadmap = null;
  if (qualityMet) {
    ctx.log('info', 'Phase 9: Generating detailed implementation roadmap');
    implementationRoadmap = await ctx.task(implementationRoadmapTask, {
      projectName,
      prioritizedBacklog: debtPrioritization,
      refactoringApproach,
      refactoringSchedule,
      testSafetyNet,
      constraints,
      outputDir
    });
    artifacts.push(...implementationRoadmap.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    planScore,
    qualityMet,
    refactoringPlan: refactoringPlanDocument.documentPath,
    technicalDebtInventory: {
      totalDebtItems: technicalDebtIdentification.totalDebtItems,
      debtByCategory: technicalDebtIdentification.debtByCategory,
      architecturalSmells: technicalDebtIdentification.architecturalSmells,
      codeSmells: technicalDebtIdentification.codeSmells,
      estimatedDebtCost: technicalDebtIdentification.estimatedDebtCost
    },
    prioritizedBacklog: {
      highPriorityItems: debtPrioritization.highPriorityItems,
      mediumPriorityItems: debtPrioritization.mediumPriorityItems,
      lowPriorityItems: debtPrioritization.lowPriorityItems,
      totalEstimatedEffort: debtPrioritization.totalEstimatedEffort,
      roiAnalysis: debtPrioritization.roiAnalysis
    },
    refactoringGoals: {
      qualityGoals: refactoringGoals.qualityGoals,
      coverageGoals: refactoringGoals.coverageGoals,
      complexityGoals: refactoringGoals.complexityGoals,
      duplicationGoals: refactoringGoals.duplicationGoals
    },
    testCoverage: {
      currentCoverage: testSafetyNet.currentCoverage,
      targetCoverage: minTestCoverage,
      testsAdded: testSafetyNet.testsAdded,
      coverageGap: testSafetyNet.coverageGap,
      testingStrategy: testSafetyNet.testingStrategy
    },
    refactoringApproach: {
      patternsSelected: refactoringApproach.patternsSelected,
      incrementalSteps: refactoringApproach.incrementalSteps,
      riskMitigation: refactoringApproach.riskMitigation,
      featureFlagUsage: refactoringApproach.featureFlagUsage
    },
    schedule: {
      totalDuration: refactoringSchedule.totalDuration,
      phases: refactoringSchedule.phases,
      milestones: refactoringSchedule.milestones,
      resourceAllocation: refactoringSchedule.resourceAllocation
    },
    implementationRoadmap: implementationRoadmap ? implementationRoadmap.roadmap : null,
    artifacts,
    duration,
    metadata: {
      processId: 'software-architecture/refactoring-plan',
      timestamp: startTime,
      projectName,
      codebasePath,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Technical Debt Identification
export const technicalDebtIdentificationTask = defineTask('technical-debt-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify technical debt across codebase',
  agent: {
    name: 'debt-analyzer',
    prompt: {
      role: 'senior software architect and technical debt specialist',
      task: 'Comprehensively identify technical debt using static analysis, code metrics, and team feedback',
      context: args,
      instructions: [
        'Run static analysis tools (SonarQube, CodeClimate, ESLint, etc.) on codebase',
        'Analyze code complexity metrics (cyclomatic complexity, cognitive complexity)',
        'Identify code smells: long methods, large classes, god objects, duplicated code',
        'Identify architectural smells: layering violations, circular dependencies, feature envy',
        'Review bug patterns and defect history',
        'Analyze test coverage gaps',
        'Collect team feedback on pain points and maintenance challenges',
        'Identify deprecated dependencies and security vulnerabilities',
        'Calculate technical debt ratio and estimated cost',
        'Categorize debt by type: code quality, design, architecture, testing, documentation',
        'Generate comprehensive technical debt inventory report'
      ],
      outputFormat: 'JSON with totalDebtItems, debtByCategory, codeSmells, architecturalSmells, testCoverageGaps, securityIssues, estimatedDebtCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDebtItems', 'debtByCategory', 'estimatedDebtCost', 'artifacts'],
      properties: {
        totalDebtItems: { type: 'number' },
        debtByCategory: {
          type: 'object',
          properties: {
            codeQuality: { type: 'number' },
            design: { type: 'number' },
            architecture: { type: 'number' },
            testing: { type: 'number' },
            documentation: { type: 'number' },
            security: { type: 'number' }
          }
        },
        codeSmells: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              smell: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              complexity: { type: 'number' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        architecturalSmells: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              smell: { type: 'string' },
              affectedModules: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        testCoverageGaps: {
          type: 'object',
          properties: {
            currentCoverage: { type: 'number' },
            uncoveredFiles: { type: 'array', items: { type: 'string' } },
            criticalGaps: { type: 'array', items: { type: 'string' } }
          }
        },
        securityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        estimatedDebtCost: {
          type: 'object',
          properties: {
            totalDays: { type: 'number' },
            monthlyInterest: { type: 'string' },
            debtRatio: { type: 'number' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'debt-identification']
}));

// Task 2: Debt Prioritization
export const debtPrioritizationTask = defineTask('debt-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize and prioritize technical debt',
  agent: {
    name: 'prioritization-specialist',
    prompt: {
      role: 'senior engineering manager and ROI analyst',
      task: 'Prioritize technical debt items by severity, business impact, and ROI',
      context: args,
      instructions: [
        'Rate each debt item by severity (critical/high/medium/low)',
        'Assess business impact: velocity impact, bug rate, customer satisfaction',
        'Estimate refactoring effort for each item (story points or hours)',
        'Calculate pain-to-gain ratio (impact / effort)',
        'Consider dependencies between debt items',
        'Prioritize by ROI: high impact + low effort first',
        'Group debt into themes or epics',
        'Create prioritized refactoring backlog',
        'Identify quick wins (high ROI, low effort)',
        'Identify foundational items (required before other refactorings)',
        'Generate prioritization matrix and ROI analysis'
      ],
      outputFormat: 'JSON with highPriorityItems, mediumPriorityItems, lowPriorityItems, quickWins, foundationalItems, totalEstimatedEffort, roiAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highPriorityItems', 'totalEstimatedEffort', 'roiAnalysis', 'artifacts'],
      properties: {
        highPriorityItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              businessImpact: { type: 'string' },
              estimatedEffort: { type: 'string' },
              painToGainRatio: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mediumPriorityItems: { type: 'array' },
        lowPriorityItems: { type: 'array' },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              estimatedEffort: { type: 'string' },
              expectedBenefit: { type: 'string' }
            }
          }
        },
        foundationalItems: { type: 'array', items: { type: 'string' } },
        totalEstimatedEffort: {
          type: 'object',
          properties: {
            totalDays: { type: 'number' },
            totalStoryPoints: { type: 'number' }
          }
        },
        roiAnalysis: {
          type: 'object',
          properties: {
            highROIItems: { type: 'array', items: { type: 'string' } },
            estimatedVelocityImprovement: { type: 'string' },
            estimatedBugReduction: { type: 'string' },
            paybackPeriod: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'prioritization']
}));

// Task 3: Refactoring Goals Definition
export const refactoringGoalsTask = defineTask('refactoring-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define measurable refactoring goals',
  agent: {
    name: 'goals-specialist',
    prompt: {
      role: 'software quality engineer',
      task: 'Define specific, measurable, achievable refactoring goals aligned with technical debt reduction',
      context: args,
      instructions: [
        'Define code quality goals: reduce cyclomatic complexity to <10, reduce duplication to <3%',
        'Define test coverage goals: increase unit test coverage to target percentage',
        'Define maintainability goals: improve maintainability index to >70',
        'Define readability goals: reduce cognitive complexity, improve naming',
        'Define modularity goals: reduce coupling, increase cohesion',
        'Define performance goals (if applicable): reduce technical debt impacting performance',
        'Set baseline metrics and target metrics for each goal',
        'Ensure goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Align goals with business objectives (faster delivery, fewer bugs)',
        'Define success criteria for refactoring completion',
        'Generate measurable goals document'
      ],
      outputFormat: 'JSON with qualityGoals, coverageGoals, complexityGoals, duplicationGoals, maintainabilityGoals, performanceGoals, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityGoals', 'coverageGoals', 'successCriteria', 'artifacts'],
      properties: {
        qualityGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              baseline: { type: 'number' },
              target: { type: 'number' },
              unit: { type: 'string' }
            }
          }
        },
        coverageGoals: {
          type: 'object',
          properties: {
            currentCoverage: { type: 'number' },
            targetCoverage: { type: 'number' },
            criticalPathCoverage: { type: 'number' }
          }
        },
        complexityGoals: {
          type: 'object',
          properties: {
            maxCyclomaticComplexity: { type: 'number' },
            maxCognitiveComplexity: { type: 'number' },
            maxFileLength: { type: 'number' },
            maxFunctionLength: { type: 'number' }
          }
        },
        duplicationGoals: {
          type: 'object',
          properties: {
            currentDuplication: { type: 'number' },
            targetDuplication: { type: 'number' }
          }
        },
        maintainabilityGoals: {
          type: 'object',
          properties: {
            targetMaintainabilityIndex: { type: 'number' },
            targetTechnicalDebtRatio: { type: 'number' }
          }
        },
        performanceGoals: { type: 'array', items: { type: 'string' } },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'goals']
}));

// Task 4: Test Safety Net Creation
export const testSafetyNetTask = defineTask('test-safety-net', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create test safety net for refactoring',
  agent: {
    name: 'testing-specialist',
    prompt: {
      role: 'senior QA engineer and test architect',
      task: 'Establish comprehensive test coverage before refactoring to ensure safety',
      context: args,
      instructions: [
        'Assess current test coverage (unit, integration, E2E)',
        'Identify critical code paths requiring tests before refactoring',
        'Add missing unit tests for code to be refactored',
        'Add integration tests for module interactions',
        'Add regression tests for known bug fixes',
        'Set up mutation testing to validate test quality',
        'Define test execution strategy (CI/CD integration)',
        'Establish coverage gates (minimum coverage before refactoring)',
        'Document testing strategy and coverage goals',
        'Create test suite baseline report',
        'Generate test safety net documentation'
      ],
      outputFormat: 'JSON with currentCoverage, targetCoverage, testsAdded, coverageGap, testingStrategy, mutationScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentCoverage', 'targetCoverage', 'testsAdded', 'testingStrategy', 'artifacts'],
      properties: {
        currentCoverage: {
          type: 'object',
          properties: {
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' },
            overall: { type: 'number' }
          }
        },
        targetCoverage: {
          type: 'object',
          properties: {
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' },
            overall: { type: 'number' }
          }
        },
        testsAdded: {
          type: 'object',
          properties: {
            unitTests: { type: 'number' },
            integrationTests: { type: 'number' },
            regressionTests: { type: 'number' },
            totalTests: { type: 'number' }
          }
        },
        coverageGap: {
          type: 'object',
          properties: {
            gapPercentage: { type: 'number' },
            uncoveredCriticalPaths: { type: 'array', items: { type: 'string' } }
          }
        },
        testingStrategy: {
          type: 'object',
          properties: {
            testPyramid: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            cicdIntegration: { type: 'string' },
            coverageGates: { type: 'array', items: { type: 'string' } }
          }
        },
        mutationScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'test-safety-net']
}));

// Task 5: Refactoring Approach Design
export const refactoringApproachTask = defineTask('refactoring-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design refactoring approach and patterns',
  agent: {
    name: 'refactoring-architect',
    prompt: {
      role: 'senior software architect and refactoring expert',
      task: 'Design comprehensive refactoring strategy with patterns, incremental steps, and risk mitigation',
      context: args,
      instructions: [
        'Choose appropriate refactoring patterns for each debt item',
        'Common patterns: Extract Method, Extract Class, Move Method, Rename, Inline',
        'Advanced patterns: Replace Conditional with Polymorphism, Introduce Parameter Object',
        'Plan incremental refactoring steps (small, safe changes)',
        'Identify logical commit points (tests still pass)',
        'Consider feature flags for large structural changes',
        'Design branch strategy (refactoring branches vs. trunk-based)',
        'Plan for backward compatibility during refactoring',
        'Define rollback strategy for each major refactoring',
        'Identify risks and mitigation strategies',
        'Document refactoring approach and decision rationale',
        'Generate refactoring approach document'
      ],
      outputFormat: 'JSON with patternsSelected, incrementalSteps, commitStrategy, featureFlagUsage, backwardCompatibility, riskMitigation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternsSelected', 'incrementalSteps', 'riskMitigation', 'artifacts'],
      properties: {
        patternsSelected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              applicableTo: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        incrementalSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              debtItem: { type: 'string' },
              pattern: { type: 'string' },
              commitPoint: { type: 'boolean' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        commitStrategy: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            commitMessageFormat: { type: 'string' },
            codeReviewRequired: { type: 'boolean' }
          }
        },
        featureFlagUsage: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            flagsNeeded: { type: 'array', items: { type: 'string' } },
            rolloutStrategy: { type: 'string' }
          }
        },
        backwardCompatibility: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            compatibilityStrategy: { type: 'string' },
            deprecationPlan: { type: 'string' }
          }
        },
        riskMitigation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'approach-design']
}));

// Task 6: Refactoring Schedule
export const refactoringScheduleTask = defineTask('refactoring-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate effort and create refactoring schedule',
  agent: {
    name: 'schedule-planner',
    prompt: {
      role: 'engineering manager and project planner',
      task: 'Create realistic refactoring schedule balancing debt reduction with feature delivery',
      context: args,
      instructions: [
        'Estimate effort for each refactoring item (story points or hours)',
        'Allocate refactoring capacity per sprint (e.g., 20% of sprint)',
        'Balance refactoring work with feature development',
        'Create phased refactoring timeline',
        'Define milestones and checkpoints',
        'Plan resource allocation (who works on what)',
        'Consider team availability and skills',
        'Account for buffer time (unknowns, blockers)',
        'Define sprint-by-sprint refactoring roadmap',
        'Establish progress tracking metrics',
        'Generate comprehensive refactoring schedule'
      ],
      outputFormat: 'JSON with totalDuration, phases, milestones, resourceAllocation, sprintPlan, progressMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDuration', 'phases', 'milestones', 'resourceAllocation', 'artifacts'],
      properties: {
        totalDuration: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              debtItems: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' }
            }
          }
        },
        resourceAllocation: {
          type: 'object',
          properties: {
            totalFTE: { type: 'number' },
            sprintCapacity: { type: 'string' },
            teamMembers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string' },
                  allocation: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        sprintPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              refactoringItems: { type: 'array', items: { type: 'string' } },
              capacity: { type: 'string' },
              expectedProgress: { type: 'string' }
            }
          }
        },
        progressMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              trackingFrequency: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'scheduling']
}));

// Task 7: Refactoring Plan Document Generation
export const refactoringPlanGenerationTask = defineTask('refactoring-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive refactoring plan document',
  agent: {
    name: 'plan-writer',
    prompt: {
      role: 'senior technical writer and software architect',
      task: 'Create comprehensive, actionable refactoring plan consolidating all analysis and planning',
      context: args,
      instructions: [
        'Create executive summary with key findings and recommendations',
        'Include project overview and refactoring objectives',
        'Document technical debt inventory with categorization',
        'Present prioritized refactoring backlog with ROI analysis',
        'Detail refactoring goals and success criteria',
        'Document test safety net strategy and coverage targets',
        'Explain refactoring approach with patterns and incremental steps',
        'Present schedule with phases, milestones, and resource allocation',
        'Include risk assessment and mitigation strategies',
        'Document monitoring and progress tracking approach',
        'Provide implementation guidelines (Boy Scout Rule, red-green-refactor)',
        'Include appendices: metrics baseline, tool recommendations, code review checklist',
        'Format as professional Markdown document',
        'Ensure plan is actionable and ready for team execution',
        'Save refactoring plan document to output directory'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyRecommendations, implementationReadiness, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyRecommendations', 'implementationReadiness', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyRecommendations: { type: 'array', items: { type: 'string' } },
        implementationReadiness: { type: 'number', minimum: 0, maximum: 100 },
        quickWins: { type: 'array', items: { type: 'string' } },
        criticalActions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'documentation']
}));

// Task 8: Plan Quality Scoring
export const planQualityScoringTask = defineTask('plan-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score refactoring plan quality and feasibility',
  agent: {
    name: 'plan-validator',
    prompt: {
      role: 'principal software architect and quality auditor',
      task: 'Assess refactoring plan quality, completeness, and feasibility for successful execution',
      context: args,
      instructions: [
        'Evaluate debt identification completeness (weight: 15%)',
        'Assess prioritization logic and ROI analysis (weight: 20%)',
        'Review refactoring goals measurability and achievability (weight: 15%)',
        'Evaluate test safety net adequacy (weight: 20%)',
        'Assess refactoring approach soundness and incrementality (weight: 15%)',
        'Review schedule realism and resource allocation (weight: 10%)',
        'Evaluate plan documentation clarity and actionability (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific recommendations for improvement',
        'Assess team execution readiness',
        'Validate alignment with best practices (Boy Scout Rule, red-green-refactor)'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), executionReadiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            debtIdentification: { type: 'number' },
            prioritization: { type: 'number' },
            refactoringGoals: { type: 'number' },
            testSafetyNet: { type: 'number' },
            refactoringApproach: { type: 'number' },
            schedule: { type: 'number' },
            documentation: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allDebtIdentified: { type: 'boolean' },
            roiJustified: { type: 'boolean' },
            goalsAreMeasurable: { type: 'boolean' },
            testsAreAdequate: { type: 'boolean' },
            approachIsIncremental: { type: 'boolean' },
            scheduleIsRealistic: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        executionReadiness: { type: 'string', enum: ['ready', 'minor-adjustments', 'major-revisions'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'validation', 'quality-scoring']
}));

// Task 9: Implementation Roadmap Generation (optional)
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate detailed implementation roadmap',
  agent: {
    name: 'roadmap-generator',
    prompt: {
      role: 'engineering manager and program planner',
      task: 'Create detailed sprint-by-sprint implementation roadmap with tasks, dependencies, and checkpoints',
      context: args,
      instructions: [
        'Define implementation phases (preparation, execution, validation, optimization)',
        'Phase 1 - Preparation: Test safety net completion, tooling setup, team training',
        'Phase 2 - Execution: Sprint-by-sprint refactoring work',
        'Phase 3 - Validation: Metrics verification, quality gates, stakeholder review',
        'Phase 4 - Optimization: Continuous improvement, lessons learned',
        'Define deliverables and success criteria for each phase',
        'Identify dependencies between refactoring tasks',
        'Create Gantt chart or timeline visualization',
        'Map resource allocation across sprints',
        'Define checkpoints and quality gates',
        'Include quick wins for early momentum',
        'Document rollback procedures',
        'Generate comprehensive implementation roadmap'
      ],
      outputFormat: 'JSON with roadmap (object with phases), tasks (array), dependencies (array), timeline (object), checkpoints (array), quickWins (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'tasks', 'timeline', 'checkpoints', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  successCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              phase: { type: 'string' },
              sprint: { type: 'string' },
              owner: { type: 'string' },
              estimatedEffort: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            totalDuration: { type: 'string' },
            sprints: { type: 'number' }
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              sprint: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              reviewRequired: { type: 'boolean' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  },
  labels: ['agent', 'refactoring-plan', 'implementation-roadmap']
}));
