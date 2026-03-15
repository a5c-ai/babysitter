/**
 * @process specializations/code-migration-modernization/migration-planning-roadmap
 * @description Migration Planning and Roadmap - Strategic migration roadmap creation process covering
 * goal definition, strategy selection, target architecture design, phased planning, data migration
 * planning, testing strategy, and stakeholder communication for comprehensive migration execution.
 * @inputs { projectName: string, assessmentReport?: object, businessRequirements?: array, budgetConstraints?: object, timelineConstraints?: object }
 * @outputs { success: boolean, goals: object, strategy: object, targetArchitecture: object, roadmap: object, dataMigrationPlan: object, testingStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/migration-planning-roadmap', {
 *   projectName: 'ERP Modernization',
 *   assessmentReport: { readinessScore: 65, technicalDebt: {...} },
 *   businessRequirements: ['reduce costs', 'improve performance', 'enable cloud deployment'],
 *   budgetConstraints: { total: '$2M', contingency: '20%' },
 *   timelineConstraints: { deadline: '2025-12-31', maxDowntime: '8 hours' }
 * });
 *
 * @references
 * - AWS Migration Hub: https://aws.amazon.com/migration-hub/
 * - Cloud Migration Strategies (6 Rs): https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-strategies/
 * - Strangler Fig Pattern: https://martinfowler.com/bliki/StranglerFigApplication.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    assessmentReport = {},
    businessRequirements = [],
    budgetConstraints = {},
    timelineConstraints = {},
    riskTolerance = 'medium',
    outputDir = 'migration-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Migration Planning and Roadmap for ${projectName}`);

  // ============================================================================
  // PHASE 1: DEFINE MIGRATION GOALS
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining migration goals');
  const migrationGoals = await ctx.task(defineMigrationGoalsTask, {
    projectName,
    assessmentReport,
    businessRequirements,
    budgetConstraints,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...migrationGoals.artifacts);

  // Breakpoint: Goal alignment review
  await ctx.breakpoint({
    question: `Migration goals defined for ${projectName}. Primary goal: ${migrationGoals.primaryGoal}. Business alignment score: ${migrationGoals.alignmentScore}%. Approve goals before strategy selection?`,
    title: 'Migration Goals Review',
    context: {
      runId: ctx.runId,
      projectName,
      goals: migrationGoals,
      recommendation: 'Ensure all stakeholders agree on goals before proceeding'
    }
  });

  // ============================================================================
  // PHASE 2: SELECT MIGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting migration strategy');
  const migrationStrategy = await ctx.task(selectMigrationStrategyTask, {
    projectName,
    migrationGoals,
    assessmentReport,
    budgetConstraints,
    timelineConstraints,
    riskTolerance,
    outputDir
  });

  artifacts.push(...migrationStrategy.artifacts);

  // ============================================================================
  // PHASE 3: DEFINE TARGET ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining target architecture');
  const targetArchitecture = await ctx.task(defineTargetArchitectureTask, {
    projectName,
    migrationGoals,
    migrationStrategy,
    assessmentReport,
    outputDir
  });

  artifacts.push(...targetArchitecture.artifacts);

  // Breakpoint: Target architecture approval
  await ctx.breakpoint({
    question: `Target architecture designed for ${projectName}. Pattern: ${targetArchitecture.architecturePattern}. Approve architecture before detailed planning?`,
    title: 'Target Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architecture: targetArchitecture,
      files: targetArchitecture.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: IDENTIFY MIGRATION PHASES
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying migration phases');
  const migrationPhases = await ctx.task(identifyMigrationPhasesTask, {
    projectName,
    migrationGoals,
    migrationStrategy,
    targetArchitecture,
    assessmentReport,
    outputDir
  });

  artifacts.push(...migrationPhases.artifacts);

  // ============================================================================
  // PHASE 5: CREATE DETAILED ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating detailed roadmap');
  const detailedRoadmap = await ctx.task(createDetailedRoadmapTask, {
    projectName,
    migrationGoals,
    migrationStrategy,
    targetArchitecture,
    migrationPhases,
    budgetConstraints,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...detailedRoadmap.artifacts);

  // ============================================================================
  // PHASE 6: PLAN DATA MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning data migration');
  const dataMigrationPlan = await ctx.task(planDataMigrationTask, {
    projectName,
    migrationStrategy,
    targetArchitecture,
    detailedRoadmap,
    assessmentReport,
    outputDir
  });

  artifacts.push(...dataMigrationPlan.artifacts);

  // ============================================================================
  // PHASE 7: DEFINE TESTING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining testing strategy');
  const testingStrategy = await ctx.task(defineTestingStrategyTask, {
    projectName,
    migrationStrategy,
    targetArchitecture,
    detailedRoadmap,
    outputDir
  });

  artifacts.push(...testingStrategy.artifacts);

  // ============================================================================
  // PHASE 8: PLAN COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Planning communication');
  const communicationPlan = await ctx.task(planCommunicationTask, {
    projectName,
    migrationGoals,
    detailedRoadmap,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 9: RISK MITIGATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning risk mitigation');
  const riskMitigationPlan = await ctx.task(planRiskMitigationTask, {
    projectName,
    migrationStrategy,
    detailedRoadmap,
    assessmentReport,
    outputDir
  });

  artifacts.push(...riskMitigationPlan.artifacts);

  // ============================================================================
  // PHASE 10: FINALIZE AND APPROVE
  // ============================================================================

  ctx.log('info', 'Phase 10: Finalizing migration plan');
  const finalPlan = await ctx.task(finalizeMigrationPlanTask, {
    projectName,
    migrationGoals,
    migrationStrategy,
    targetArchitecture,
    detailedRoadmap,
    dataMigrationPlan,
    testingStrategy,
    communicationPlan,
    riskMitigationPlan,
    outputDir
  });

  artifacts.push(...finalPlan.artifacts);

  // Final Breakpoint: Migration Plan Approval
  await ctx.breakpoint({
    question: `Migration plan complete for ${projectName}. Total phases: ${detailedRoadmap.phases.length}. Estimated duration: ${detailedRoadmap.totalDuration}. Estimated cost: ${detailedRoadmap.estimatedCost}. Approve migration plan?`,
    title: 'Migration Plan Final Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        phases: detailedRoadmap.phases.length,
        duration: detailedRoadmap.totalDuration,
        cost: detailedRoadmap.estimatedCost,
        strategy: migrationStrategy.selectedStrategy,
        riskLevel: riskMitigationPlan.overallRiskLevel
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    goals: migrationGoals,
    strategy: migrationStrategy,
    targetArchitecture,
    roadmap: detailedRoadmap,
    dataMigrationPlan,
    testingStrategy,
    communicationPlan,
    riskMitigationPlan,
    finalPlanPath: finalPlan.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/migration-planning-roadmap',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const defineMigrationGoalsTask = defineTask('define-migration-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Migration Goals - ${args.projectName}`,
  agent: {
    name: 'migration-readiness-assessor',
    prompt: {
      role: 'Migration Strategy Consultant',
      task: 'Define clear, measurable migration goals aligned with business objectives',
      context: args,
      instructions: [
        '1. Establish business objectives driving migration',
        '2. Define technical goals (performance, scalability, maintainability)',
        '3. Set measurable success criteria',
        '4. Identify constraints (budget, timeline, resources)',
        '5. Define non-goals and out-of-scope items',
        '6. Prioritize goals by importance',
        '7. Align goals with stakeholder expectations',
        '8. Calculate business alignment score',
        '9. Document assumptions and dependencies',
        '10. Create goals document'
      ],
      outputFormat: 'JSON with primaryGoal, businessGoals, technicalGoals, successCriteria, constraints, alignmentScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryGoal', 'alignmentScore', 'artifacts'],
      properties: {
        primaryGoal: { type: 'string' },
        businessGoals: { type: 'array', items: { type: 'object' } },
        technicalGoals: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'object' },
        alignmentScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'goals', 'strategy']
}));

export const selectMigrationStrategyTask = defineTask('select-migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Select Migration Strategy - ${args.projectName}`,
  agent: {
    name: 'ddd-analyst',
    prompt: {
      role: 'Migration Architect',
      task: 'Select optimal migration strategy based on goals and constraints',
      context: args,
      instructions: [
        '1. Evaluate strategy options per component (6 Rs)',
        '2. Assess Strangler Fig vs Big Bang vs Parallel Run',
        '3. Consider risk tolerance in strategy selection',
        '4. Document rationale for each decision',
        '5. Create Architecture Decision Records (ADRs)',
        '6. Estimate effort for each strategy option',
        '7. Assess feasibility within constraints',
        '8. Select primary migration pattern',
        '9. Define hybrid approach if needed',
        '10. Document strategy selection matrix'
      ],
      outputFormat: 'JSON with selectedStrategy, strategyPattern, rationale, componentStrategies, adrs, feasibilityScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStrategy', 'rationale', 'artifacts'],
      properties: {
        selectedStrategy: { type: 'string' },
        strategyPattern: { type: 'string' },
        rationale: { type: 'string' },
        componentStrategies: { type: 'array', items: { type: 'object' } },
        adrs: { type: 'array', items: { type: 'object' } },
        feasibilityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'strategy', 'decision']
}));

export const defineTargetArchitectureTask = defineTask('define-target-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Define Target Architecture - ${args.projectName}`,
  agent: {
    name: 'ddd-analyst',
    prompt: {
      role: 'Principal Software Architect',
      task: 'Design comprehensive target architecture for migrated system',
      context: args,
      instructions: [
        '1. Design future state architecture pattern',
        '2. Select target technology stack',
        '3. Plan infrastructure requirements',
        '4. Define integration patterns',
        '5. Design data architecture',
        '6. Plan security architecture',
        '7. Define observability strategy',
        '8. Create architecture diagrams (C4)',
        '9. Document design decisions',
        '10. Validate against goals'
      ],
      outputFormat: 'JSON with architecturePattern, technologyStack, infrastructure, integrations, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecturePattern', 'technologyStack', 'artifacts'],
      properties: {
        architecturePattern: { type: 'string' },
        technologyStack: { type: 'object' },
        infrastructure: { type: 'object' },
        integrations: { type: 'array', items: { type: 'object' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'architecture', 'design']
}));

export const identifyMigrationPhasesTask = defineTask('identify-migration-phases', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Identify Migration Phases - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Migration Program Manager',
      task: 'Identify and sequence migration phases',
      context: args,
      instructions: [
        '1. Group components into migration waves',
        '2. Define phase dependencies',
        '3. Sequence based on risk and value',
        '4. Plan for parallel execution',
        '5. Define deliverables per phase',
        '6. Identify phase gates and checkpoints',
        '7. Plan incremental value delivery',
        '8. Define phase success criteria',
        '9. Estimate phase durations',
        '10. Document phase dependencies'
      ],
      outputFormat: 'JSON with phases, dependencies, sequenceRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'dependencies', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        sequenceRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'phases', 'sequencing']
}));

export const createDetailedRoadmapTask = defineTask('create-detailed-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Create Detailed Roadmap - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Project Manager',
      task: 'Create detailed migration roadmap with timelines and resources',
      context: args,
      instructions: [
        '1. Estimate effort per phase',
        '2. Assign resources and teams',
        '3. Set milestones and checkpoints',
        '4. Plan contingencies and buffers',
        '5. Create timeline visualization',
        '6. Define critical path',
        '7. Plan parallel workstreams',
        '8. Set budget allocation per phase',
        '9. Define go/no-go criteria',
        '10. Generate roadmap document'
      ],
      outputFormat: 'JSON with phases, totalDuration, estimatedCost, milestones, criticalPath, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalDuration', 'estimatedCost', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        totalDuration: { type: 'string' },
        estimatedCost: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object' } },
        criticalPath: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'roadmap', 'timeline']
}));

export const planDataMigrationTask = defineTask('plan-data-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Plan Data Migration - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Data Migration Architect',
      task: 'Plan comprehensive data migration strategy',
      context: args,
      instructions: [
        '1. Assess data migration complexity',
        '2. Define data transformation rules',
        '3. Choose migration approach (big bang, incremental)',
        '4. Plan data validation strategy',
        '5. Design data reconciliation process',
        '6. Plan for data quality improvements',
        '7. Define downtime requirements',
        '8. Select migration tools',
        '9. Plan rollback procedures',
        '10. Create data migration plan document'
      ],
      outputFormat: 'JSON with approach, transformationRules, validationStrategy, tools, downtimeEstimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'validationStrategy', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        transformationRules: { type: 'array', items: { type: 'object' } },
        validationStrategy: { type: 'object' },
        tools: { type: 'array', items: { type: 'string' } },
        downtimeEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'data-migration', 'etl']
}));

export const defineTestingStrategyTask = defineTask('define-testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Define Testing Strategy - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'QA Architect',
      task: 'Define comprehensive testing strategy for migration',
      context: args,
      instructions: [
        '1. Plan functional equivalence testing',
        '2. Design regression test suite',
        '3. Plan performance validation',
        '4. Define acceptance criteria',
        '5. Plan parallel run testing',
        '6. Design data validation tests',
        '7. Plan user acceptance testing',
        '8. Define test automation strategy',
        '9. Plan smoke and sanity testing',
        '10. Create testing strategy document'
      ],
      outputFormat: 'JSON with testLevels, automationStrategy, acceptanceCriteria, parallelRunPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testLevels', 'acceptanceCriteria', 'artifacts'],
      properties: {
        testLevels: { type: 'array', items: { type: 'object' } },
        automationStrategy: { type: 'object' },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        parallelRunPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'testing', 'quality']
}));

export const planCommunicationTask = defineTask('plan-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Plan Communication - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Change Management Specialist',
      task: 'Plan stakeholder communication throughout migration',
      context: args,
      instructions: [
        '1. Identify all stakeholders',
        '2. Define communication cadence',
        '3. Plan user training program',
        '4. Create change management plan',
        '5. Define escalation procedures',
        '6. Plan status reporting',
        '7. Design feedback mechanisms',
        '8. Plan go-live communication',
        '9. Create communication templates',
        '10. Document communication plan'
      ],
      outputFormat: 'JSON with stakeholders, communicationSchedule, trainingPlan, changeManagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'communicationSchedule', 'artifacts'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        communicationSchedule: { type: 'array', items: { type: 'object' } },
        trainingPlan: { type: 'object' },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'communication', 'change-management']
}));

export const planRiskMitigationTask = defineTask('plan-risk-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Plan Risk Mitigation - ${args.projectName}`,
  agent: {
    name: 'migration-readiness-assessor',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Plan risk mitigation strategies for migration',
      context: args,
      instructions: [
        '1. Address identified risks from assessment',
        '2. Plan rollback procedures per phase',
        '3. Define escalation paths',
        '4. Create contingency plans',
        '5. Plan for data rollback',
        '6. Define risk triggers and thresholds',
        '7. Assign risk owners',
        '8. Plan risk monitoring',
        '9. Define go/no-go criteria',
        '10. Create risk mitigation document'
      ],
      outputFormat: 'JSON with mitigationStrategies, rollbackProcedures, contingencyPlans, overallRiskLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mitigationStrategies', 'rollbackProcedures', 'overallRiskLevel', 'artifacts'],
      properties: {
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        rollbackProcedures: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        overallRiskLevel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'risk', 'mitigation']
}));

export const finalizeMigrationPlanTask = defineTask('finalize-migration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Finalize Migration Plan - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Migration Program Director',
      task: 'Finalize and consolidate migration plan documentation',
      context: args,
      instructions: [
        '1. Consolidate all planning artifacts',
        '2. Create executive summary',
        '3. Document all decisions and rationale',
        '4. Create approval checklist',
        '5. Generate master plan document',
        '6. Include all appendices',
        '7. Create quick reference guide',
        '8. Define next steps',
        '9. Prepare for kickoff',
        '10. Generate final plan package'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, approvalChecklist, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        approvalChecklist: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-planning', 'documentation', 'finalization']
}));
