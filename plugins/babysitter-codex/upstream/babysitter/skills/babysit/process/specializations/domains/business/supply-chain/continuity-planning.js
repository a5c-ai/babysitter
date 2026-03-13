/**
 * @process specializations/domains/business/supply-chain/continuity-planning
 * @description Business Continuity and Contingency Planning - Develop and maintain contingency plans for
 * critical suppliers including alternative sourcing strategies, buffer stock policies, and recovery procedures.
 * @inputs { criticalSuppliers?: array, criticalCategories?: array, riskScenarios?: array }
 * @outputs { success: boolean, contingencyPlans: array, alternativeSources: object, recoveryProcedures: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/continuity-planning', {
 *   criticalSuppliers: ['Supplier A', 'Supplier B'],
 *   criticalCategories: ['Semiconductors', 'Raw Materials'],
 *   riskScenarios: ['supplier-failure', 'natural-disaster', 'geopolitical']
 * });
 *
 * @references
 * - ISO 22301 Business Continuity: https://www.iso.org/standard/75106.html
 * - The Resilient Enterprise: https://mitpress.mit.edu/9780262693493/the-resilient-enterprise/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    criticalSuppliers = [],
    criticalCategories = [],
    riskScenarios = [],
    recoveryTimeObjective = '72-hours',
    outputDir = 'continuity-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Business Continuity and Contingency Planning Process');

  // ============================================================================
  // PHASE 1: CRITICAL SUPPLIER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying critical suppliers and dependencies');

  const criticalIdentification = await ctx.task(criticalIdentificationTask, {
    criticalSuppliers,
    criticalCategories,
    outputDir
  });

  artifacts.push(...criticalIdentification.artifacts);

  // ============================================================================
  // PHASE 2: BUSINESS IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting business impact analysis');

  const businessImpact = await ctx.task(businessImpactAnalysisTask, {
    criticalIdentification,
    riskScenarios,
    outputDir
  });

  artifacts.push(...businessImpact.artifacts);

  // ============================================================================
  // PHASE 3: ALTERNATIVE SOURCING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing alternative sourcing strategies');

  const alternativeSourcing = await ctx.task(alternativeSourcingTask, {
    criticalIdentification,
    businessImpact,
    outputDir
  });

  artifacts.push(...alternativeSourcing.artifacts);

  // ============================================================================
  // PHASE 4: BUFFER STOCK POLICY
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining buffer stock policies');

  const bufferStockPolicy = await ctx.task(bufferStockPolicyTask, {
    criticalIdentification,
    businessImpact,
    recoveryTimeObjective,
    outputDir
  });

  artifacts.push(...bufferStockPolicy.artifacts);

  // Breakpoint: Review contingency strategies
  await ctx.breakpoint({
    question: `Contingency strategies developed for ${criticalIdentification.criticalCount} critical items. Alternative sources identified: ${alternativeSourcing.alternativesCount}. Review strategies?`,
    title: 'Contingency Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        criticalItems: criticalIdentification.criticalCount,
        alternativeSources: alternativeSourcing.alternativesCount,
        bufferStockValue: bufferStockPolicy.totalValue
      }
    }
  });

  // ============================================================================
  // PHASE 5: RECOVERY PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing recovery procedures');

  const recoveryProcedures = await ctx.task(recoveryProceduresTask, {
    criticalIdentification,
    alternativeSourcing,
    bufferStockPolicy,
    recoveryTimeObjective,
    outputDir
  });

  artifacts.push(...recoveryProcedures.artifacts);

  // ============================================================================
  // PHASE 6: COMMUNICATION PLANS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating communication plans');

  const communicationPlans = await ctx.task(communicationPlansTask, {
    criticalIdentification,
    recoveryProcedures,
    outputDir
  });

  artifacts.push(...communicationPlans.artifacts);

  // ============================================================================
  // PHASE 7: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning testing and validation');

  const testingPlan = await ctx.task(testingValidationTask, {
    recoveryProcedures,
    communicationPlans,
    riskScenarios,
    outputDir
  });

  artifacts.push(...testingPlan.artifacts);

  // ============================================================================
  // PHASE 8: MAINTENANCE SCHEDULE
  // ============================================================================

  ctx.log('info', 'Phase 8: Establishing maintenance schedule');

  const maintenanceSchedule = await ctx.task(maintenanceScheduleTask, {
    criticalIdentification,
    alternativeSourcing,
    bufferStockPolicy,
    recoveryProcedures,
    outputDir
  });

  artifacts.push(...maintenanceSchedule.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contingencyPlans: recoveryProcedures.plans,
    criticalItems: {
      count: criticalIdentification.criticalCount,
      suppliers: criticalIdentification.criticalSuppliers,
      categories: criticalIdentification.criticalCategories
    },
    alternativeSources: {
      count: alternativeSourcing.alternativesCount,
      byCategory: alternativeSourcing.alternativesByCategory,
      qualificationStatus: alternativeSourcing.qualificationStatus
    },
    bufferStock: {
      totalValue: bufferStockPolicy.totalValue,
      policiesByItem: bufferStockPolicy.policies
    },
    recoveryProcedures: recoveryProcedures.procedures,
    communicationPlan: communicationPlans.plan,
    testingSchedule: testingPlan.schedule,
    maintenanceSchedule: maintenanceSchedule.schedule,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/continuity-planning',
      timestamp: startTime,
      recoveryTimeObjective,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const criticalIdentificationTask = defineTask('critical-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Critical Supplier Identification',
  agent: {
    name: 'criticality-analyst',
    prompt: {
      role: 'Supply Chain Criticality Analyst',
      task: 'Identify critical suppliers and dependencies',
      context: args,
      instructions: [
        '1. Identify single-source suppliers',
        '2. Identify suppliers with long lead times',
        '3. Map tier 2/3 dependencies',
        '4. Identify critical categories',
        '5. Assess geographic concentration',
        '6. Evaluate substitutability',
        '7. Calculate criticality scores',
        '8. Document critical dependencies'
      ],
      outputFormat: 'JSON with critical supplier identification'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalCount', 'criticalSuppliers', 'criticalCategories', 'artifacts'],
      properties: {
        criticalCount: { type: 'number' },
        criticalSuppliers: { type: 'array' },
        criticalCategories: { type: 'array' },
        singleSources: { type: 'array' },
        dependencyMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'criticality']
}));

export const businessImpactAnalysisTask = defineTask('business-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Business Impact Analysis',
  agent: {
    name: 'bia-analyst',
    prompt: {
      role: 'Business Impact Analyst',
      task: 'Assess business impact of supply disruptions',
      context: args,
      instructions: [
        '1. Model disruption scenarios',
        '2. Calculate revenue impact per scenario',
        '3. Estimate customer impact',
        '4. Assess production impact',
        '5. Calculate recovery costs',
        '6. Determine recovery time requirements',
        '7. Prioritize by impact',
        '8. Document impact analysis'
      ],
      outputFormat: 'JSON with business impact analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'impactByScenario', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        impactByScenario: { type: 'object' },
        revenueAtRisk: { type: 'number' },
        recoveryTimeRequired: { type: 'object' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'bia']
}));

export const alternativeSourcingTask = defineTask('alternative-sourcing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Alternative Sourcing Strategy',
  agent: {
    name: 'alt-sourcing-analyst',
    prompt: {
      role: 'Alternative Sourcing Strategist',
      task: 'Develop alternative sourcing strategies',
      context: args,
      instructions: [
        '1. Identify potential alternative suppliers',
        '2. Assess qualification requirements',
        '3. Evaluate capacity and capability',
        '4. Estimate lead time for qualification',
        '5. Calculate switching costs',
        '6. Develop dual-sourcing strategies',
        '7. Create supplier qualification roadmap',
        '8. Document alternative sources'
      ],
      outputFormat: 'JSON with alternative sourcing strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['alternativesCount', 'alternativesByCategory', 'qualificationStatus', 'artifacts'],
      properties: {
        alternativesCount: { type: 'number' },
        alternativesByCategory: { type: 'object' },
        qualificationStatus: { type: 'object' },
        switchingCosts: { type: 'object' },
        qualificationRoadmap: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'alternative-sourcing']
}));

export const bufferStockPolicyTask = defineTask('buffer-stock-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Buffer Stock Policy',
  agent: {
    name: 'buffer-stock-planner',
    prompt: {
      role: 'Strategic Inventory Planner',
      task: 'Define strategic buffer stock policies',
      context: args,
      instructions: [
        '1. Calculate buffer stock requirements',
        '2. Consider recovery time objectives',
        '3. Balance cost vs. protection',
        '4. Define storage locations',
        '5. Set replenishment triggers',
        '6. Define rotation policies',
        '7. Calculate total buffer investment',
        '8. Document buffer stock policies'
      ],
      outputFormat: 'JSON with buffer stock policies'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'totalValue', 'artifacts'],
      properties: {
        policies: { type: 'object' },
        totalValue: { type: 'number' },
        storageLocations: { type: 'array' },
        replenishmentTriggers: { type: 'object' },
        rotationSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'buffer-stock']
}));

export const recoveryProceduresTask = defineTask('recovery-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Recovery Procedures',
  agent: {
    name: 'recovery-planner',
    prompt: {
      role: 'Recovery Planning Specialist',
      task: 'Develop supply chain recovery procedures',
      context: args,
      instructions: [
        '1. Define recovery procedures by scenario',
        '2. Create step-by-step playbooks',
        '3. Assign roles and responsibilities',
        '4. Define decision triggers',
        '5. Set recovery time targets',
        '6. Create escalation procedures',
        '7. Define resource requirements',
        '8. Document recovery procedures'
      ],
      outputFormat: 'JSON with recovery procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'plans', 'artifacts'],
      properties: {
        procedures: { type: 'array' },
        plans: { type: 'array' },
        playbooks: { type: 'array' },
        rolesResponsibilities: { type: 'object' },
        decisionTriggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'recovery']
}));

export const communicationPlansTask = defineTask('communication-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Communication Plans',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'Crisis Communication Planner',
      task: 'Create communication plans for disruptions',
      context: args,
      instructions: [
        '1. Define stakeholder communication matrix',
        '2. Create internal communication templates',
        '3. Create customer communication templates',
        '4. Create supplier communication templates',
        '5. Define communication timing',
        '6. Set up communication channels',
        '7. Define spokesperson assignments',
        '8. Document communication plans'
      ],
      outputFormat: 'JSON with communication plans'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'templates', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        templates: { type: 'array' },
        stakeholderMatrix: { type: 'object' },
        channels: { type: 'array' },
        spokespersons: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'communication']
}));

export const testingValidationTask = defineTask('testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Testing and Validation',
  agent: {
    name: 'testing-coordinator',
    prompt: {
      role: 'Continuity Testing Coordinator',
      task: 'Plan testing and validation of contingency plans',
      context: args,
      instructions: [
        '1. Define testing scenarios',
        '2. Create tabletop exercise plans',
        '3. Plan simulation exercises',
        '4. Define success criteria',
        '5. Create testing schedule',
        '6. Assign testing roles',
        '7. Plan lessons learned process',
        '8. Document testing plan'
      ],
      outputFormat: 'JSON with testing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'scenarios', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        scenarios: { type: 'array' },
        exercises: { type: 'array' },
        successCriteria: { type: 'object' },
        lessonsLearnedProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'testing']
}));

export const maintenanceScheduleTask = defineTask('maintenance-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Maintenance Schedule',
  agent: {
    name: 'maintenance-planner',
    prompt: {
      role: 'Plan Maintenance Coordinator',
      task: 'Establish plan maintenance schedule',
      context: args,
      instructions: [
        '1. Define review frequency',
        '2. Set update triggers',
        '3. Assign maintenance owners',
        '4. Define version control',
        '5. Create audit schedule',
        '6. Set expiration dates',
        '7. Define change management',
        '8. Document maintenance schedule'
      ],
      outputFormat: 'JSON with maintenance schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'owners', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        owners: { type: 'object' },
        reviewFrequency: { type: 'string' },
        updateTriggers: { type: 'array' },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'continuity', 'maintenance']
}));
