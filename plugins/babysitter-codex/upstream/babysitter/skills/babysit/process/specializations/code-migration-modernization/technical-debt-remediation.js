/**
 * @process specializations/code-migration-modernization/technical-debt-remediation
 * @description Technical Debt Remediation - Systematic process for identifying, categorizing, prioritizing,
 * and addressing technical debt to improve code quality, reduce maintenance costs, and enable faster
 * feature delivery.
 * @inputs { projectName: string, debtSources?: array, businessPriorities?: array, timelineConstraints?: object }
 * @outputs { success: boolean, debtInventory: object, prioritizedBacklog: array, remediationPlan: object, completedItems: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/technical-debt-remediation', {
 *   projectName: 'Core Platform Debt Remediation',
 *   debtSources: ['sonarqube', 'code-review', 'incident-reports'],
 *   businessPriorities: ['performance', 'security', 'maintainability'],
 *   timelineConstraints: { sprintAllocation: '20%', deadline: '2025-Q4' }
 * });
 *
 * @references
 * - Managing Technical Debt: https://martinfowler.com/bliki/TechnicalDebt.html
 * - Technical Debt Quadrant: https://martinfowler.com/bliki/TechnicalDebtQuadrant.html
 * - Clean Architecture: https://www.oreilly.com/library/view/clean-architecture/9780134494166/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    debtSources = [],
    businessPriorities = [],
    timelineConstraints = {},
    outputDir = 'debt-remediation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Technical Debt Remediation for ${projectName}`);

  // ============================================================================
  // PHASE 1: DEBT INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating debt inventory');
  const debtInventory = await ctx.task(debtInventoryTask, {
    projectName,
    debtSources,
    outputDir
  });

  artifacts.push(...debtInventory.artifacts);

  // ============================================================================
  // PHASE 2: DEBT CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Categorizing debt');
  const debtCategorization = await ctx.task(debtCategorizationTask, {
    projectName,
    debtInventory,
    outputDir
  });

  artifacts.push(...debtCategorization.artifacts);

  // ============================================================================
  // PHASE 3: IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing impact');
  const impactAnalysis = await ctx.task(debtImpactAnalysisTask, {
    projectName,
    debtInventory,
    debtCategorization,
    businessPriorities,
    outputDir
  });

  artifacts.push(...impactAnalysis.artifacts);

  // Breakpoint: Debt analysis review
  await ctx.breakpoint({
    question: `Debt analysis complete for ${projectName}. Total items: ${debtInventory.totalItems}. High impact: ${impactAnalysis.highImpactCount}. Review before prioritization?`,
    title: 'Technical Debt Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      debtInventory,
      impactAnalysis,
      recommendation: 'Review high-impact items with stakeholders'
    }
  });

  // ============================================================================
  // PHASE 4: PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Prioritizing debt items');
  const prioritization = await ctx.task(debtPrioritizationTask, {
    projectName,
    debtInventory,
    debtCategorization,
    impactAnalysis,
    businessPriorities,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // ============================================================================
  // PHASE 5: REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning remediation');
  const remediationPlan = await ctx.task(remediationPlanningTask, {
    projectName,
    prioritization,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...remediationPlan.artifacts);

  // ============================================================================
  // PHASE 6: SPRINT ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Allocating to sprints');
  const sprintAllocation = await ctx.task(sprintAllocationTask, {
    projectName,
    remediationPlan,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...sprintAllocation.artifacts);

  // ============================================================================
  // PHASE 7: REMEDIATION EXECUTION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 7: Executing remediation');
  const remediationExecution = await ctx.task(remediationExecutionTask, {
    projectName,
    sprintAllocation,
    outputDir
  });

  artifacts.push(...remediationExecution.artifacts);

  // ============================================================================
  // PHASE 8: VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying remediation');
  const verification = await ctx.task(remediationVerificationTask, {
    projectName,
    remediationExecution,
    debtInventory,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // ============================================================================
  // PHASE 9: DEBT PREVENTION
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up debt prevention');
  const debtPrevention = await ctx.task(debtPreventionTask, {
    projectName,
    debtCategorization,
    verification,
    outputDir
  });

  artifacts.push(...debtPrevention.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Technical debt remediation complete for ${projectName}. Items addressed: ${remediationExecution.completedCount}/${debtInventory.totalItems}. Debt reduction: ${verification.debtReduction}%. Approve?`,
    title: 'Technical Debt Remediation Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        totalItems: debtInventory.totalItems,
        completed: remediationExecution.completedCount,
        debtReduction: verification.debtReduction,
        preventionMeasures: debtPrevention.measuresImplemented
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    debtInventory: {
      totalItems: debtInventory.totalItems,
      byCategory: debtCategorization.byCategory,
      byPriority: prioritization.byPriority
    },
    prioritizedBacklog: prioritization.prioritizedBacklog,
    remediationPlan: {
      phases: remediationPlan.phases,
      timeline: remediationPlan.timeline,
      estimatedEffort: remediationPlan.totalEffort
    },
    completedItems: remediationExecution.completedItems,
    verification: {
      debtReduction: verification.debtReduction,
      qualityImprovement: verification.qualityImprovement
    },
    prevention: {
      measuresImplemented: debtPrevention.measuresImplemented,
      monitoringSetup: debtPrevention.monitoringSetup
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/technical-debt-remediation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const debtInventoryTask = defineTask('debt-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Debt Inventory - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Technical Debt Analyst',
      task: 'Create comprehensive debt inventory',
      context: args,
      instructions: [
        '1. Collect debt from static analysis tools',
        '2. Review code review comments',
        '3. Analyze incident reports',
        '4. Interview developers',
        '5. Review architecture decisions',
        '6. Check dependency outdatedness',
        '7. Review test coverage gaps',
        '8. Identify documentation debt',
        '9. Count total debt items',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalItems, debtItems, bySource, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalItems', 'debtItems', 'artifacts'],
      properties: {
        totalItems: { type: 'number' },
        debtItems: { type: 'array', items: { type: 'object' } },
        bySource: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'inventory', 'analysis']
}));

export const debtCategorizationTask = defineTask('debt-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Debt Categorization - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Technical Debt Specialist',
      task: 'Categorize debt items',
      context: args,
      instructions: [
        '1. Categorize by type (code, architecture, test, infrastructure)',
        '2. Apply debt quadrant classification',
        '3. Identify reckless vs prudent',
        '4. Identify deliberate vs inadvertent',
        '5. Tag related items',
        '6. Identify dependencies',
        '7. Estimate remediation effort',
        '8. Calculate interest (ongoing cost)',
        '9. Document rationale',
        '10. Generate categorization report'
      ],
      outputFormat: 'JSON with byCategory, byQuadrant, effortEstimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['byCategory', 'byQuadrant', 'artifacts'],
      properties: {
        byCategory: { type: 'object' },
        byQuadrant: { type: 'object' },
        effortEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'categorization', 'classification']
}));

export const debtImpactAnalysisTask = defineTask('debt-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Impact Analysis - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Business Analyst',
      task: 'Analyze business impact of debt',
      context: args,
      instructions: [
        '1. Assess development velocity impact',
        '2. Calculate maintenance cost',
        '3. Assess security risk',
        '4. Evaluate scalability impact',
        '5. Assess reliability impact',
        '6. Calculate opportunity cost',
        '7. Identify high-impact items',
        '8. Map to business priorities',
        '9. Calculate total cost of ownership',
        '10. Generate impact report'
      ],
      outputFormat: 'JSON with highImpactCount, impactScores, businessCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highImpactCount', 'impactScores', 'artifacts'],
      properties: {
        highImpactCount: { type: 'number' },
        impactScores: { type: 'array', items: { type: 'object' } },
        businessCost: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'impact', 'analysis']
}));

export const debtPrioritizationTask = defineTask('debt-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Debt Prioritization - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Product Manager',
      task: 'Prioritize debt remediation',
      context: args,
      instructions: [
        '1. Apply value vs effort matrix',
        '2. Consider business priorities',
        '3. Factor in risk level',
        '4. Consider dependencies',
        '5. Group related items',
        '6. Identify quick wins',
        '7. Plan strategic improvements',
        '8. Create prioritized backlog',
        '9. Define priority levels',
        '10. Generate prioritization report'
      ],
      outputFormat: 'JSON with prioritizedBacklog, byPriority, quickWins, strategic, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedBacklog', 'byPriority', 'artifacts'],
      properties: {
        prioritizedBacklog: { type: 'array', items: { type: 'object' } },
        byPriority: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'object' } },
        strategic: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'prioritization', 'planning']
}));

export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Remediation Planning - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Technical Lead',
      task: 'Plan debt remediation',
      context: args,
      instructions: [
        '1. Define remediation phases',
        '2. Estimate effort per item',
        '3. Plan testing strategy',
        '4. Identify risks',
        '5. Define success criteria',
        '6. Plan rollback',
        '7. Create timeline',
        '8. Assign responsibilities',
        '9. Define milestones',
        '10. Generate remediation plan'
      ],
      outputFormat: 'JSON with phases, timeline, totalEffort, milestones, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'totalEffort', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        totalEffort: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'planning', 'roadmap']
}));

export const sprintAllocationTask = defineTask('sprint-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Sprint Allocation - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Scrum Master',
      task: 'Allocate debt items to sprints',
      context: args,
      instructions: [
        '1. Calculate sprint capacity',
        '2. Allocate debt percentage',
        '3. Distribute by priority',
        '4. Balance with features',
        '5. Plan buffer time',
        '6. Consider dependencies',
        '7. Create sprint backlog',
        '8. Define acceptance criteria',
        '9. Plan review points',
        '10. Generate allocation plan'
      ],
      outputFormat: 'JSON with sprintAllocations, capacityUsed, sprints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sprintAllocations', 'sprints', 'artifacts'],
      properties: {
        sprintAllocations: { type: 'array', items: { type: 'object' } },
        capacityUsed: { type: 'number' },
        sprints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'sprints', 'allocation']
}));

export const remediationExecutionTask = defineTask('remediation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Remediation Execution - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Senior Developer',
      task: 'Execute debt remediation',
      context: args,
      instructions: [
        '1. Address debt items',
        '2. Write/update tests',
        '3. Validate changes',
        '4. Document solutions',
        '5. Track progress',
        '6. Handle blockers',
        '7. Update status',
        '8. Create commits',
        '9. Conduct reviews',
        '10. Track completed items'
      ],
      outputFormat: 'JSON with completedCount, completedItems, inProgress, blocked, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completedCount', 'completedItems', 'artifacts'],
      properties: {
        completedCount: { type: 'number' },
        completedItems: { type: 'array', items: { type: 'object' } },
        inProgress: { type: 'array', items: { type: 'object' } },
        blocked: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'execution', 'implementation']
}));

export const remediationVerificationTask = defineTask('remediation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Remediation Verification - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Lead',
      task: 'Verify debt remediation',
      context: args,
      instructions: [
        '1. Run all tests',
        '2. Verify debt resolved',
        '3. Measure quality improvement',
        '4. Calculate debt reduction',
        '5. Check for regressions',
        '6. Validate metrics',
        '7. Compare before/after',
        '8. Verify documentation',
        '9. Confirm acceptance criteria',
        '10. Generate verification report'
      ],
      outputFormat: 'JSON with debtReduction, qualityImprovement, testsPass, metricsComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['debtReduction', 'qualityImprovement', 'artifacts'],
      properties: {
        debtReduction: { type: 'number' },
        qualityImprovement: { type: 'object' },
        testsPass: { type: 'boolean' },
        metricsComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'verification', 'validation']
}));

export const debtPreventionTask = defineTask('debt-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Debt Prevention - ${args.projectName}`,
  agent: {
    name: 'technical-debt-auditor',
    prompt: {
      role: 'Engineering Manager',
      task: 'Set up debt prevention measures',
      context: args,
      instructions: [
        '1. Set up quality gates',
        '2. Configure static analysis',
        '3. Implement code review standards',
        '4. Set up debt monitoring',
        '5. Create debt budget',
        '6. Define acceptance criteria',
        '7. Implement architecture review',
        '8. Set up alerts',
        '9. Create guidelines',
        '10. Generate prevention plan'
      ],
      outputFormat: 'JSON with measuresImplemented, monitoringSetup, guidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measuresImplemented', 'monitoringSetup', 'artifacts'],
      properties: {
        measuresImplemented: { type: 'array', items: { type: 'string' } },
        monitoringSetup: { type: 'object' },
        guidelines: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['debt-remediation', 'prevention', 'governance']
}));
