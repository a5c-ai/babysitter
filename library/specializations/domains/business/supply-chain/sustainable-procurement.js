/**
 * @process specializations/domains/business/supply-chain/sustainable-procurement
 * @description Sustainable Procurement Assessment - Evaluate and improve procurement practices against
 * sustainability criteria including environmental impact, social responsibility, and ethical sourcing standards.
 * @inputs { suppliers?: array, categories?: array, sustainabilityTargets?: object, assessmentScope?: string }
 * @outputs { success: boolean, assessment: object, gaps: array, improvementPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/sustainable-procurement', {
 *   suppliers: ['Supplier A', 'Supplier B'],
 *   categories: ['Raw Materials', 'Packaging'],
 *   sustainabilityTargets: { carbonReduction: 30, ethicalSourcing: 100 },
 *   assessmentScope: 'comprehensive'
 * });
 *
 * @references
 * - ISO 20400 Sustainable Procurement: https://www.iso.org/standard/63026.html
 * - EcoVadis Sustainability Ratings: https://ecovadis.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    suppliers = [],
    categories = [],
    sustainabilityTargets = {},
    assessmentScope = 'comprehensive',
    reportingFrameworks = ['GRI', 'UNGC'],
    outputDir = 'sustainable-procurement-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Sustainable Procurement Assessment Process');

  // ============================================================================
  // PHASE 1: BASELINE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting baseline sustainability assessment');

  const baselineAssessment = await ctx.task(baselineAssessmentTask, {
    suppliers,
    categories,
    assessmentScope,
    outputDir
  });

  artifacts.push(...baselineAssessment.artifacts);

  // ============================================================================
  // PHASE 2: ENVIRONMENTAL IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing environmental impact');

  const environmentalAssessment = await ctx.task(environmentalImpactTask, {
    suppliers,
    categories,
    baselineAssessment,
    sustainabilityTargets,
    outputDir
  });

  artifacts.push(...environmentalAssessment.artifacts);

  // ============================================================================
  // PHASE 3: SOCIAL RESPONSIBILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing social responsibility');

  const socialAssessment = await ctx.task(socialResponsibilityTask, {
    suppliers,
    baselineAssessment,
    outputDir
  });

  artifacts.push(...socialAssessment.artifacts);

  // ============================================================================
  // PHASE 4: ETHICAL SOURCING ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing ethical sourcing');

  const ethicalAssessment = await ctx.task(ethicalSourcingTask, {
    suppliers,
    categories,
    baselineAssessment,
    outputDir
  });

  artifacts.push(...ethicalAssessment.artifacts);

  // ============================================================================
  // PHASE 5: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing sustainability gaps');

  const gapAnalysis = await ctx.task(sustainabilityGapTask, {
    baselineAssessment,
    environmentalAssessment,
    socialAssessment,
    ethicalAssessment,
    sustainabilityTargets,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Breakpoint: Review sustainability assessment
  await ctx.breakpoint({
    question: `Sustainability assessment complete. Overall score: ${gapAnalysis.overallScore}/100. ${gapAnalysis.criticalGaps.length} critical gaps identified. Review assessment?`,
    title: 'Sustainable Procurement Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        overallScore: gapAnalysis.overallScore,
        criticalGaps: gapAnalysis.criticalGaps.length,
        environmentalScore: environmentalAssessment.score,
        socialScore: socialAssessment.score
      }
    }
  });

  // ============================================================================
  // PHASE 6: IMPROVEMENT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing improvement plan');

  const improvementPlan = await ctx.task(improvementPlanTask, {
    gapAnalysis,
    sustainabilityTargets,
    outputDir
  });

  artifacts.push(...improvementPlan.artifacts);

  // ============================================================================
  // PHASE 7: SUPPLIER ENGAGEMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing supplier engagement strategy');

  const supplierEngagement = await ctx.task(supplierEngagementTask, {
    suppliers,
    gapAnalysis,
    improvementPlan,
    outputDir
  });

  artifacts.push(...supplierEngagement.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING AND COMPLIANCE
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating sustainability reports');

  const reportingCompliance = await ctx.task(sustainabilityReportingTask, {
    baselineAssessment,
    environmentalAssessment,
    socialAssessment,
    ethicalAssessment,
    gapAnalysis,
    improvementPlan,
    reportingFrameworks,
    outputDir
  });

  artifacts.push(...reportingCompliance.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    assessment: {
      overallScore: gapAnalysis.overallScore,
      environmentalScore: environmentalAssessment.score,
      socialScore: socialAssessment.score,
      ethicalScore: ethicalAssessment.score,
      supplierScores: gapAnalysis.supplierScores
    },
    environmentalMetrics: {
      carbonFootprint: environmentalAssessment.carbonFootprint,
      wasteMetrics: environmentalAssessment.wasteMetrics,
      energyUsage: environmentalAssessment.energyUsage
    },
    socialMetrics: {
      laborPractices: socialAssessment.laborPractices,
      diversityInclusion: socialAssessment.diversityInclusion,
      communityImpact: socialAssessment.communityImpact
    },
    gaps: gapAnalysis.gaps,
    criticalGaps: gapAnalysis.criticalGaps,
    improvementPlan: {
      initiatives: improvementPlan.initiatives,
      timeline: improvementPlan.timeline,
      expectedImpact: improvementPlan.expectedImpact
    },
    supplierEngagement: supplierEngagement.strategy,
    complianceStatus: reportingCompliance.complianceStatus,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/sustainable-procurement',
      timestamp: startTime,
      assessmentScope,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const baselineAssessmentTask = defineTask('baseline-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Baseline Sustainability Assessment',
  agent: {
    name: 'baseline-assessor',
    prompt: {
      role: 'Sustainability Baseline Analyst',
      task: 'Conduct baseline sustainability assessment',
      context: args,
      instructions: [
        '1. Gather current sustainability policies',
        '2. Assess existing sustainability practices',
        '3. Review supplier sustainability data',
        '4. Assess current certifications',
        '5. Benchmark against industry standards',
        '6. Document current state',
        '7. Identify key stakeholders',
        '8. Create baseline report'
      ],
      outputFormat: 'JSON with baseline assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState', 'existingPractices', 'artifacts'],
      properties: {
        currentState: { type: 'object' },
        existingPractices: { type: 'array' },
        certifications: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        stakeholders: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'baseline']
}));

export const environmentalImpactTask = defineTask('environmental-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Environmental Impact Assessment',
  agent: {
    name: 'environmental-assessor',
    prompt: {
      role: 'Environmental Impact Analyst',
      task: 'Assess environmental impact of procurement',
      context: args,
      instructions: [
        '1. Calculate carbon footprint (Scope 3)',
        '2. Assess energy usage',
        '3. Evaluate waste generation',
        '4. Assess water usage',
        '5. Review packaging sustainability',
        '6. Evaluate circular economy practices',
        '7. Calculate environmental score',
        '8. Document environmental assessment'
      ],
      outputFormat: 'JSON with environmental assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'carbonFootprint', 'wasteMetrics', 'artifacts'],
      properties: {
        score: { type: 'number' },
        carbonFootprint: { type: 'object' },
        energyUsage: { type: 'object' },
        wasteMetrics: { type: 'object' },
        waterUsage: { type: 'object' },
        packagingMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'environmental']
}));

export const socialResponsibilityTask = defineTask('social-responsibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Social Responsibility Assessment',
  agent: {
    name: 'social-assessor',
    prompt: {
      role: 'Social Responsibility Analyst',
      task: 'Assess social responsibility practices',
      context: args,
      instructions: [
        '1. Assess labor practices compliance',
        '2. Evaluate working conditions',
        '3. Review diversity and inclusion',
        '4. Assess community impact',
        '5. Evaluate health and safety',
        '6. Review human rights policies',
        '7. Calculate social score',
        '8. Document social assessment'
      ],
      outputFormat: 'JSON with social responsibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'laborPractices', 'diversityInclusion', 'artifacts'],
      properties: {
        score: { type: 'number' },
        laborPractices: { type: 'object' },
        diversityInclusion: { type: 'object' },
        communityImpact: { type: 'object' },
        healthSafety: { type: 'object' },
        humanRights: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'social']
}));

export const ethicalSourcingTask = defineTask('ethical-sourcing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Ethical Sourcing Assessment',
  agent: {
    name: 'ethical-assessor',
    prompt: {
      role: 'Ethical Sourcing Analyst',
      task: 'Assess ethical sourcing practices',
      context: args,
      instructions: [
        '1. Assess supplier ethics policies',
        '2. Evaluate anti-corruption measures',
        '3. Review conflict minerals compliance',
        '4. Assess fair trade practices',
        '5. Evaluate supply chain transparency',
        '6. Review modern slavery compliance',
        '7. Calculate ethical score',
        '8. Document ethical assessment'
      ],
      outputFormat: 'JSON with ethical sourcing assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'ethicsCompliance', 'artifacts'],
      properties: {
        score: { type: 'number' },
        ethicsCompliance: { type: 'object' },
        antiCorruption: { type: 'object' },
        conflictMinerals: { type: 'object' },
        fairTrade: { type: 'object' },
        transparency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'ethical']
}));

export const sustainabilityGapTask = defineTask('sustainability-gap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Sustainability Gap Analysis',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Sustainability Gap Analyst',
      task: 'Analyze gaps against sustainability targets',
      context: args,
      instructions: [
        '1. Compare to sustainability targets',
        '2. Identify environmental gaps',
        '3. Identify social responsibility gaps',
        '4. Identify ethical sourcing gaps',
        '5. Prioritize gaps by impact',
        '6. Classify critical gaps',
        '7. Calculate supplier scores',
        '8. Document gap analysis'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'gaps', 'criticalGaps', 'supplierScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        gaps: { type: 'array' },
        criticalGaps: { type: 'array' },
        supplierScores: { type: 'object' },
        gapPriorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'gap-analysis']
}));

export const improvementPlanTask = defineTask('improvement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Improvement Planning',
  agent: {
    name: 'improvement-planner',
    prompt: {
      role: 'Sustainability Improvement Planner',
      task: 'Develop sustainability improvement plan',
      context: args,
      instructions: [
        '1. Define improvement initiatives',
        '2. Set improvement targets',
        '3. Create implementation timeline',
        '4. Assign initiative owners',
        '5. Define resource requirements',
        '6. Calculate expected impact',
        '7. Identify quick wins',
        '8. Document improvement plan'
      ],
      outputFormat: 'JSON with improvement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'timeline', 'expectedImpact', 'artifacts'],
      properties: {
        initiatives: { type: 'array' },
        targets: { type: 'object' },
        timeline: { type: 'object' },
        owners: { type: 'object' },
        resourceRequirements: { type: 'object' },
        expectedImpact: { type: 'object' },
        quickWins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'improvement']
}));

export const supplierEngagementTask = defineTask('supplier-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Supplier Engagement Strategy',
  agent: {
    name: 'engagement-strategist',
    prompt: {
      role: 'Supplier Engagement Strategist',
      task: 'Develop supplier sustainability engagement strategy',
      context: args,
      instructions: [
        '1. Define engagement approach',
        '2. Create supplier communication plan',
        '3. Develop training programs',
        '4. Define collaboration initiatives',
        '5. Create incentive programs',
        '6. Define monitoring approach',
        '7. Create escalation procedures',
        '8. Document engagement strategy'
      ],
      outputFormat: 'JSON with supplier engagement strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'communicationPlan', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        communicationPlan: { type: 'object' },
        trainingPrograms: { type: 'array' },
        collaborationInitiatives: { type: 'array' },
        incentivePrograms: { type: 'array' },
        monitoringApproach: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'engagement']
}));

export const sustainabilityReportingTask = defineTask('sustainability-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Sustainability Reporting',
  agent: {
    name: 'sustainability-reporter',
    prompt: {
      role: 'Sustainability Reporting Specialist',
      task: 'Generate sustainability reports and compliance documentation',
      context: args,
      instructions: [
        '1. Generate GRI-aligned report',
        '2. Prepare UNGC communication',
        '3. Create executive dashboard',
        '4. Document compliance status',
        '5. Prepare stakeholder report',
        '6. Create supplier scorecards',
        '7. Generate trend analysis',
        '8. Compile reporting package'
      ],
      outputFormat: 'JSON with sustainability reports'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceStatus', 'reports', 'artifacts'],
      properties: {
        complianceStatus: { type: 'object' },
        reports: { type: 'array' },
        griReport: { type: 'object' },
        executiveDashboard: { type: 'object' },
        stakeholderReport: { type: 'object' },
        supplierScorecards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'sustainable-procurement', 'reporting']
}));
