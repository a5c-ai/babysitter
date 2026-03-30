/**
 * @process specializations/domains/business/supply-chain/capacity-planning
 * @description Capacity Planning and Constraint Management - Analyze production capacity against demand requirements,
 * identify bottlenecks, and develop capacity adjustment strategies using Theory of Constraints principles.
 * @inputs { demandForecast?: object, currentCapacity?: object, constraints?: array, planningHorizon?: string }
 * @outputs { success: boolean, capacityPlan: object, bottlenecks: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/capacity-planning', {
 *   demandForecast: { productA: [...], productB: [...] },
 *   currentCapacity: { line1: 1000, line2: 1500 },
 *   constraints: [{ type: 'labor', limit: 40 }],
 *   planningHorizon: '12-months'
 * });
 *
 * @references
 * - The Goal by Eliyahu Goldratt: https://www.amazon.com/Goal-Process-Ongoing-Improvement/dp/0884271951
 * - Theory of Constraints: https://www.tocico.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    demandForecast = {},
    currentCapacity = {},
    constraints = [],
    planningHorizon = '12-months',
    productMix = [],
    bufferStrategy = 'drum-buffer-rope',
    capacityFlexibility = 'medium',
    outputDir = 'capacity-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Capacity Planning and Constraint Management Process');

  // ============================================================================
  // PHASE 1: DEMAND REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing demand requirements');

  const demandAnalysis = await ctx.task(demandRequirementsTask, {
    demandForecast,
    productMix,
    planningHorizon,
    outputDir
  });

  artifacts.push(...demandAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CAPACITY BASELINE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing current capacity baseline');

  const capacityBaseline = await ctx.task(capacityBaselineTask, {
    currentCapacity,
    constraints,
    outputDir
  });

  artifacts.push(...capacityBaseline.artifacts);

  // ============================================================================
  // PHASE 3: CONSTRAINT IDENTIFICATION (TOC)
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying system constraints (Theory of Constraints)');

  const constraintIdentification = await ctx.task(constraintIdentificationTask, {
    demandAnalysis,
    capacityBaseline,
    constraints,
    outputDir
  });

  artifacts.push(...constraintIdentification.artifacts);

  // Breakpoint: Review bottlenecks
  await ctx.breakpoint({
    question: `${constraintIdentification.bottlenecks.length} bottlenecks identified. Primary constraint: ${constraintIdentification.primaryConstraint.name}. Review constraint analysis?`,
    title: 'Constraint Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        bottlenecks: constraintIdentification.bottlenecks,
        primaryConstraint: constraintIdentification.primaryConstraint,
        capacityGap: constraintIdentification.capacityGap
      }
    }
  });

  // ============================================================================
  // PHASE 4: EXPLOIT THE CONSTRAINT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing constraint exploitation strategies');

  const exploitConstraint = await ctx.task(exploitConstraintTask, {
    constraintIdentification,
    currentCapacity,
    outputDir
  });

  artifacts.push(...exploitConstraint.artifacts);

  // ============================================================================
  // PHASE 5: SUBORDINATE TO THE CONSTRAINT
  // ============================================================================

  ctx.log('info', 'Phase 5: Subordinating non-constraints to the constraint');

  const subordinateConstraint = await ctx.task(subordinateConstraintTask, {
    constraintIdentification,
    exploitConstraint,
    bufferStrategy,
    outputDir
  });

  artifacts.push(...subordinateConstraint.artifacts);

  // ============================================================================
  // PHASE 6: ELEVATE THE CONSTRAINT
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating capacity elevation options');

  const elevateConstraint = await ctx.task(elevateConstraintTask, {
    constraintIdentification,
    exploitConstraint,
    subordinateConstraint,
    capacityFlexibility,
    outputDir
  });

  artifacts.push(...elevateConstraint.artifacts);

  // ============================================================================
  // PHASE 7: CAPACITY PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive capacity plan');

  const capacityPlan = await ctx.task(capacityPlanGenerationTask, {
    demandAnalysis,
    capacityBaseline,
    constraintIdentification,
    exploitConstraint,
    subordinateConstraint,
    elevateConstraint,
    planningHorizon,
    outputDir
  });

  artifacts.push(...capacityPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    capacityPlan: {
      planVersion: capacityPlan.planVersion,
      planningHorizon,
      effectiveCapacity: capacityPlan.effectiveCapacity,
      capacityUtilization: capacityPlan.capacityUtilization,
      throughputIncrease: capacityPlan.throughputIncrease
    },
    bottlenecks: constraintIdentification.bottlenecks,
    constraints: {
      primary: constraintIdentification.primaryConstraint,
      secondary: constraintIdentification.secondaryConstraints
    },
    strategies: {
      exploit: exploitConstraint.strategies,
      subordinate: subordinateConstraint.strategies,
      elevate: elevateConstraint.investmentOptions
    },
    recommendations: capacityPlan.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/capacity-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const demandRequirementsTask = defineTask('demand-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Demand Requirements Analysis',
  agent: {
    name: 'demand-analyst',
    prompt: {
      role: 'Demand Planning Analyst',
      task: 'Analyze demand requirements for capacity planning',
      context: args,
      instructions: [
        '1. Convert demand forecast to capacity requirements',
        '2. Calculate required production hours by product',
        '3. Analyze demand variability and peaks',
        '4. Identify seasonal capacity requirements',
        '5. Calculate resource requirements (labor, materials)',
        '6. Project demand requirements over planning horizon',
        '7. Identify critical product requirements',
        '8. Document demand assumptions'
      ],
      outputFormat: 'JSON with demand requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['capacityRequirements', 'peakDemand', 'artifacts'],
      properties: {
        capacityRequirements: { type: 'object' },
        peakDemand: { type: 'object' },
        demandVariability: { type: 'object' },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'demand']
}));

export const capacityBaselineTask = defineTask('capacity-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Capacity Baseline Assessment',
  agent: {
    name: 'capacity-analyst',
    prompt: {
      role: 'Capacity Planning Analyst',
      task: 'Assess current capacity baseline and constraints',
      context: args,
      instructions: [
        '1. Document current production capacity by resource',
        '2. Calculate effective capacity (accounting for downtime)',
        '3. Measure current utilization rates',
        '4. Identify capacity constraints by resource type',
        '5. Document shift patterns and availability',
        '6. Assess capacity flexibility options',
        '7. Benchmark against industry standards',
        '8. Create capacity baseline report'
      ],
      outputFormat: 'JSON with capacity baseline assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['effectiveCapacity', 'utilizationRates', 'artifacts'],
      properties: {
        effectiveCapacity: { type: 'object' },
        utilizationRates: { type: 'object' },
        downtime: { type: 'object' },
        flexibilityOptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'baseline']
}));

export const constraintIdentificationTask = defineTask('constraint-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Constraint Identification (TOC)',
  agent: {
    name: 'toc-analyst',
    prompt: {
      role: 'Theory of Constraints Analyst',
      task: 'Identify system bottlenecks and constraints using TOC principles',
      context: args,
      instructions: [
        '1. Compare demand requirements to capacity',
        '2. Identify resources with insufficient capacity',
        '3. Determine primary system constraint',
        '4. Identify secondary constraints',
        '5. Calculate capacity gap at each constraint',
        '6. Analyze constraint interactions',
        '7. Prioritize constraints by impact',
        '8. Document constraint analysis'
      ],
      outputFormat: 'JSON with constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks', 'primaryConstraint', 'capacityGap', 'artifacts'],
      properties: {
        bottlenecks: { type: 'array' },
        primaryConstraint: { type: 'object' },
        secondaryConstraints: { type: 'array' },
        capacityGap: { type: 'object' },
        constraintImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'toc', 'constraints']
}));

export const exploitConstraintTask = defineTask('exploit-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Exploit the Constraint',
  agent: {
    name: 'constraint-optimizer',
    prompt: {
      role: 'Constraint Optimization Specialist',
      task: 'Develop strategies to maximize constraint throughput without investment',
      context: args,
      instructions: [
        '1. Analyze current constraint utilization',
        '2. Identify waste at the constraint (setup time, quality losses)',
        '3. Develop strategies to eliminate constraint waste',
        '4. Optimize product mix through constraint',
        '5. Improve scheduling at constraint',
        '6. Implement quality checks before constraint',
        '7. Calculate throughput improvement potential',
        '8. Document exploitation strategies'
      ],
      outputFormat: 'JSON with constraint exploitation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'throughputImprovement', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        throughputImprovement: { type: 'number' },
        wasteElimination: { type: 'object' },
        schedulingImprovements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'toc', 'exploit']
}));

export const subordinateConstraintTask = defineTask('subordinate-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Subordinate to the Constraint',
  agent: {
    name: 'flow-optimizer',
    prompt: {
      role: 'Production Flow Specialist',
      task: 'Align non-constraint resources to support constraint throughput',
      context: args,
      instructions: [
        '1. Implement Drum-Buffer-Rope scheduling',
        '2. Set buffer sizes before constraint',
        '3. Pace non-constraints to constraint rate',
        '4. Identify protective capacity requirements',
        '5. Reduce WIP inventory buildup',
        '6. Align upstream operations to constraint',
        '7. Implement visual management systems',
        '8. Document subordination strategies'
      ],
      outputFormat: 'JSON with subordination strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'bufferDesign', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        bufferDesign: { type: 'object' },
        wipReduction: { type: 'number' },
        flowImprovements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'toc', 'subordinate']
}));

export const elevateConstraintTask = defineTask('elevate-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Elevate the Constraint',
  agent: {
    name: 'capacity-investment-analyst',
    prompt: {
      role: 'Capacity Investment Analyst',
      task: 'Evaluate investment options to elevate constraint capacity',
      context: args,
      instructions: [
        '1. Identify capacity expansion options',
        '2. Evaluate equipment investment options',
        '3. Assess overtime and shift additions',
        '4. Consider outsourcing alternatives',
        '5. Calculate ROI for each option',
        '6. Assess lead time for capacity additions',
        '7. Evaluate risk of each option',
        '8. Recommend investment priorities'
      ],
      outputFormat: 'JSON with elevation options and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['investmentOptions', 'recommendedOption', 'artifacts'],
      properties: {
        investmentOptions: { type: 'array' },
        recommendedOption: { type: 'object' },
        roiAnalysis: { type: 'object' },
        implementationTimeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'toc', 'elevate']
}));

export const capacityPlanGenerationTask = defineTask('capacity-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Capacity Plan Generation',
  agent: {
    name: 'capacity-planner',
    prompt: {
      role: 'Capacity Planning Manager',
      task: 'Generate comprehensive capacity plan with recommendations',
      context: args,
      instructions: [
        '1. Consolidate all TOC analysis results',
        '2. Create integrated capacity plan',
        '3. Define capacity by period over horizon',
        '4. Document implementation timeline',
        '5. Create capacity monitoring KPIs',
        '6. Define trigger points for capacity actions',
        '7. Develop contingency plans',
        '8. Generate executive summary and recommendations'
      ],
      outputFormat: 'JSON with comprehensive capacity plan'
    },
    outputSchema: {
      type: 'object',
      required: ['planVersion', 'effectiveCapacity', 'recommendations', 'artifacts'],
      properties: {
        planVersion: { type: 'string' },
        effectiveCapacity: { type: 'object' },
        capacityUtilization: { type: 'object' },
        throughputIncrease: { type: 'number' },
        implementationTimeline: { type: 'array' },
        kpis: { type: 'array' },
        contingencyPlans: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'capacity-planning', 'plan-generation']
}));
