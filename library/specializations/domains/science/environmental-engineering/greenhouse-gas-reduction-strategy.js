/**
 * @process environmental-engineering/greenhouse-gas-reduction-strategy
 * @description Greenhouse Gas Reduction Strategy - Development of GHG reduction plans including baseline assessment,
 * reduction opportunities, implementation roadmap, and monitoring/verification.
 * @inputs { organizationName: string, organizationType: string, reductionTarget: object, baselineYear: number }
 * @outputs { success: boolean, reductionStrategy: object, implementationRoadmap: object, monitoringPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/greenhouse-gas-reduction-strategy', {
 *   organizationName: 'Manufacturing Corporation',
 *   organizationType: 'industrial',
 *   reductionTarget: { percent: 50, targetYear: 2030, scope: [1, 2] },
 *   baselineYear: 2020
 * });
 *
 * @references
 * - GHG Protocol Corporate Standard
 * - Science Based Targets Initiative (SBTi)
 * - EPA Climate Leaders Program
 * - ISO 14064 - GHG Accounting and Verification
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    organizationType = 'corporate',
    reductionTarget = {},
    baselineYear,
    currentOperations = {},
    outputDir = 'ghg-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GHG Reduction Strategy: ${organizationName}`);
  ctx.log('info', `Target: ${reductionTarget.percent}% reduction by ${reductionTarget.targetYear}`);

  // ============================================================================
  // PHASE 1: BASELINE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: GHG Baseline Assessment');

  const baselineAssessment = await ctx.task(ghgBaselineTask, {
    organizationName,
    organizationType,
    baselineYear,
    currentOperations,
    outputDir
  });

  artifacts.push(...baselineAssessment.artifacts);

  // ============================================================================
  // PHASE 2: REDUCTION OPPORTUNITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Reduction Opportunity Analysis');

  const opportunityAnalysis = await ctx.task(reductionOpportunityTask, {
    organizationName,
    baselineAssessment,
    reductionTarget,
    outputDir
  });

  artifacts.push(...opportunityAnalysis.artifacts);

  // Breakpoint: Opportunity Review
  await ctx.breakpoint({
    question: `${opportunityAnalysis.opportunities.length} reduction opportunities identified for ${organizationName}. Total reduction potential: ${opportunityAnalysis.totalReductionPotential} tCO2e. Review opportunities?`,
    title: 'GHG Reduction Opportunities Review',
    context: {
      runId: ctx.runId,
      opportunities: opportunityAnalysis.opportunities,
      totalPotential: opportunityAnalysis.totalReductionPotential,
      files: opportunityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Reduction Strategy Development');

  const strategyDevelopment = await ctx.task(strategyDevelopmentTask, {
    organizationName,
    baselineAssessment,
    opportunityAnalysis,
    reductionTarget,
    outputDir
  });

  artifacts.push(...strategyDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementation Roadmap');

  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    organizationName,
    strategyDevelopment,
    reductionTarget,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 5: MONITORING AND VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Monitoring and Verification Plan');

  const monitoringPlan = await ctx.task(ghgMonitoringTask, {
    organizationName,
    strategyDevelopment,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...monitoringPlan.artifacts);

  // ============================================================================
  // PHASE 6: REPORTING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Reporting Framework');

  const reportingFramework = await ctx.task(ghgReportingTask, {
    organizationName,
    baselineAssessment,
    strategyDevelopment,
    monitoringPlan,
    outputDir
  });

  artifacts.push(...reportingFramework.artifacts);

  // ============================================================================
  // PHASE 7: STRATEGY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Strategy Documentation');

  const strategyDocs = await ctx.task(ghgStrategyDocsTask, {
    organizationName,
    reductionTarget,
    baselineAssessment,
    opportunityAnalysis,
    strategyDevelopment,
    implementationRoadmap,
    monitoringPlan,
    reportingFramework,
    outputDir
  });

  artifacts.push(...strategyDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    reductionStrategy: {
      target: reductionTarget,
      baseline: baselineAssessment.totalEmissions,
      opportunities: opportunityAnalysis.opportunities,
      prioritizedActions: strategyDevelopment.prioritizedActions
    },
    implementationRoadmap: {
      phases: implementationRoadmap.phases,
      timeline: implementationRoadmap.timeline,
      investmentRequired: implementationRoadmap.totalInvestment
    },
    monitoringPlan: {
      kpis: monitoringPlan.kpis,
      verificationApproach: monitoringPlan.verificationApproach
    },
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/greenhouse-gas-reduction-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const ghgBaselineTask = defineTask('ghg-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'GHG Baseline Assessment',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Inventory Specialist',
      task: 'Develop GHG baseline inventory',
      context: args,
      instructions: [
        '1. Define organizational boundaries',
        '2. Identify Scope 1 emission sources',
        '3. Identify Scope 2 emission sources',
        '4. Identify material Scope 3 categories',
        '5. Collect activity data',
        '6. Select emission factors',
        '7. Calculate baseline emissions',
        '8. Verify calculations',
        '9. Document methodology',
        '10. Prepare baseline report'
      ],
      outputFormat: 'JSON with total emissions, by scope, by source'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEmissions', 'scope1Emissions', 'scope2Emissions', 'artifacts'],
      properties: {
        totalEmissions: { type: 'object' },
        scope1Emissions: { type: 'object' },
        scope2Emissions: { type: 'object' },
        scope3Emissions: { type: 'object' },
        emissionsBySource: { type: 'array' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'baseline']
}));

export const reductionOpportunityTask = defineTask('reduction-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reduction Opportunity Analysis',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Reduction Analyst',
      task: 'Identify and analyze GHG reduction opportunities',
      context: args,
      instructions: [
        '1. Analyze energy efficiency opportunities',
        '2. Evaluate renewable energy options',
        '3. Assess process optimization opportunities',
        '4. Identify fuel switching opportunities',
        '5. Evaluate electrification potential',
        '6. Assess carbon capture feasibility',
        '7. Evaluate supply chain reductions',
        '8. Estimate reduction potential',
        '9. Assess implementation costs',
        '10. Rank opportunities by marginal abatement cost'
      ],
      outputFormat: 'JSON with opportunities, reduction potential, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'totalReductionPotential', 'marginalAbatementCurve', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        totalReductionPotential: { type: 'number' },
        energyEfficiency: { type: 'array' },
        renewableEnergy: { type: 'array' },
        processOptimization: { type: 'array' },
        marginalAbatementCurve: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'opportunities']
}));

export const strategyDevelopmentTask = defineTask('strategy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reduction Strategy Development',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Strategy Developer',
      task: 'Develop comprehensive GHG reduction strategy',
      context: args,
      instructions: [
        '1. Set interim targets',
        '2. Prioritize reduction measures',
        '3. Develop implementation pathway',
        '4. Assess technology readiness',
        '5. Develop financing strategy',
        '6. Identify co-benefits',
        '7. Assess risks and barriers',
        '8. Develop stakeholder engagement plan',
        '9. Align with science-based targets',
        '10. Document reduction strategy'
      ],
      outputFormat: 'JSON with prioritized actions, pathway, financing'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedActions', 'reductionPathway', 'financingStrategy', 'artifacts'],
      properties: {
        prioritizedActions: { type: 'array' },
        interimTargets: { type: 'array' },
        reductionPathway: { type: 'object' },
        technologyRoadmap: { type: 'object' },
        financingStrategy: { type: 'object' },
        coBenefits: { type: 'array' },
        risksAndBarriers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'strategy']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Roadmap',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Implementation Planner',
      task: 'Develop detailed implementation roadmap',
      context: args,
      instructions: [
        '1. Develop implementation phases',
        '2. Create detailed project timelines',
        '3. Identify resource requirements',
        '4. Develop budget estimates',
        '5. Assign responsibilities',
        '6. Identify dependencies',
        '7. Develop risk mitigation plans',
        '8. Create milestone schedule',
        '9. Develop governance structure',
        '10. Document implementation roadmap'
      ],
      outputFormat: 'JSON with phases, timeline, investment'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'totalInvestment', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        milestones: { type: 'array' },
        resourceRequirements: { type: 'object' },
        totalInvestment: { type: 'object' },
        governance: { type: 'object' },
        riskMitigation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'implementation']
}));

export const ghgMonitoringTask = defineTask('ghg-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring and Verification Plan',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG MRV Specialist',
      task: 'Develop monitoring, reporting, and verification plan',
      context: args,
      instructions: [
        '1. Define key performance indicators',
        '2. Establish monitoring procedures',
        '3. Design data collection system',
        '4. Develop verification protocols',
        '5. Plan third-party verification',
        '6. Establish data quality procedures',
        '7. Design tracking dashboard',
        '8. Develop progress reporting format',
        '9. Plan annual inventory updates',
        '10. Document MRV plan'
      ],
      outputFormat: 'JSON with KPIs, verification approach, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'verificationApproach', 'monitoringProcedures', 'artifacts'],
      properties: {
        kpis: { type: 'array' },
        verificationApproach: { type: 'object' },
        monitoringProcedures: { type: 'object' },
        dataManagement: { type: 'object' },
        thirdPartyVerification: { type: 'object' },
        trackingDashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'monitoring']
}));

export const ghgReportingTask = defineTask('ghg-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reporting Framework',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Reporting Specialist',
      task: 'Develop GHG reporting framework',
      context: args,
      instructions: [
        '1. Identify reporting requirements',
        '2. Align with disclosure frameworks (CDP, TCFD)',
        '3. Develop internal reporting procedures',
        '4. Create report templates',
        '5. Plan stakeholder communications',
        '6. Develop public disclosure strategy',
        '7. Plan regulatory reporting',
        '8. Design data visualization',
        '9. Establish reporting schedule',
        '10. Document reporting framework'
      ],
      outputFormat: 'JSON with frameworks, templates, schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['reportingFrameworks', 'templates', 'schedule', 'artifacts'],
      properties: {
        reportingFrameworks: { type: 'array' },
        internalReporting: { type: 'object' },
        externalDisclosure: { type: 'object' },
        templates: { type: 'array' },
        schedule: { type: 'object' },
        stakeholderCommunications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'reporting']
}));

export const ghgStrategyDocsTask = defineTask('ghg-strategy-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strategy Documentation',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Strategy Documentation Specialist',
      task: 'Compile GHG reduction strategy documentation',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document baseline inventory',
        '3. Present reduction opportunities',
        '4. Detail reduction strategy',
        '5. Present implementation roadmap',
        '6. Document monitoring plan',
        '7. Include financial analysis',
        '8. Prepare board presentation',
        '9. Create stakeholder summary',
        '10. Generate documentation package'
      ],
      outputFormat: 'JSON with document list, report path, presentations'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'presentations', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        presentations: { type: 'array' },
        stakeholderSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ghg', 'documentation']
}));
