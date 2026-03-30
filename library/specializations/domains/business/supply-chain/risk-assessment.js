/**
 * @process specializations/domains/business/supply-chain/risk-assessment
 * @description Supply Chain Risk Assessment - Identify, assess, and prioritize supply chain risks across
 * financial, operational, geopolitical, and compliance dimensions with risk heat mapping.
 * @inputs { suppliers?: array, categories?: array, geographies?: array, riskTolerance?: string }
 * @outputs { success: boolean, riskRegister: array, heatMap: object, mitigationPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/risk-assessment', {
 *   suppliers: ['Supplier A', 'Supplier B'],
 *   categories: ['Electronics', 'Raw Materials'],
 *   geographies: ['Asia', 'Europe'],
 *   riskTolerance: 'moderate'
 * });
 *
 * @references
 * - Supply Chain Risk Management Book: https://www.koganpage.com/product/supply-chain-risk-management-9780749476298
 * - ISO 31000 Risk Management: https://www.iso.org/iso-31000-risk-management.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    suppliers = [],
    categories = [],
    geographies = [],
    riskTolerance = 'moderate',
    assessmentScope = 'comprehensive',
    outputDir = 'risk-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Supply Chain Risk Assessment Process');

  // ============================================================================
  // PHASE 1: RISK IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying supply chain risks');

  const riskIdentification = await ctx.task(riskIdentificationTask, {
    suppliers,
    categories,
    geographies,
    assessmentScope,
    outputDir
  });

  artifacts.push(...riskIdentification.artifacts);

  // ============================================================================
  // PHASE 2: FINANCIAL RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing financial risks');

  const financialRisk = await ctx.task(financialRiskTask, {
    suppliers,
    riskIdentification,
    outputDir
  });

  artifacts.push(...financialRisk.artifacts);

  // ============================================================================
  // PHASE 3: OPERATIONAL RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing operational risks');

  const operationalRisk = await ctx.task(operationalRiskTask, {
    suppliers,
    categories,
    riskIdentification,
    outputDir
  });

  artifacts.push(...operationalRisk.artifacts);

  // ============================================================================
  // PHASE 4: GEOPOLITICAL RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing geopolitical risks');

  const geopoliticalRisk = await ctx.task(geopoliticalRiskTask, {
    geographies,
    suppliers,
    riskIdentification,
    outputDir
  });

  artifacts.push(...geopoliticalRisk.artifacts);

  // ============================================================================
  // PHASE 5: COMPLIANCE RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing compliance risks');

  const complianceRisk = await ctx.task(complianceRiskTask, {
    suppliers,
    categories,
    riskIdentification,
    outputDir
  });

  artifacts.push(...complianceRisk.artifacts);

  // ============================================================================
  // PHASE 6: RISK SCORING AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Scoring and prioritizing risks');

  const riskScoring = await ctx.task(riskScoringTask, {
    financialRisk,
    operationalRisk,
    geopoliticalRisk,
    complianceRisk,
    riskTolerance,
    outputDir
  });

  artifacts.push(...riskScoring.artifacts);

  // Breakpoint: Review risk assessment
  await ctx.breakpoint({
    question: `Risk assessment complete. ${riskScoring.criticalRisks} critical risks, ${riskScoring.highRisks} high risks identified. Review risk register and heat map?`,
    title: 'Risk Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        totalRisks: riskScoring.totalRisks,
        criticalRisks: riskScoring.criticalRisks,
        highRisks: riskScoring.highRisks
      }
    }
  });

  // ============================================================================
  // PHASE 7: HEAT MAP GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating risk heat map');

  const heatMapGeneration = await ctx.task(heatMapGenerationTask, {
    riskScoring,
    outputDir
  });

  artifacts.push(...heatMapGeneration.artifacts);

  // ============================================================================
  // PHASE 8: MITIGATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing mitigation plan');

  const mitigationPlan = await ctx.task(mitigationPlanTask, {
    riskScoring,
    riskTolerance,
    outputDir
  });

  artifacts.push(...mitigationPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    riskRegister: riskScoring.riskRegister,
    riskSummary: {
      totalRisks: riskScoring.totalRisks,
      criticalRisks: riskScoring.criticalRisks,
      highRisks: riskScoring.highRisks,
      mediumRisks: riskScoring.mediumRisks,
      lowRisks: riskScoring.lowRisks
    },
    heatMap: heatMapGeneration.heatMap,
    riskByCategory: {
      financial: financialRisk.risks,
      operational: operationalRisk.risks,
      geopolitical: geopoliticalRisk.risks,
      compliance: complianceRisk.risks
    },
    mitigationPlan: mitigationPlan.actions,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/risk-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const riskIdentificationTask = defineTask('risk-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Risk Identification',
  agent: {
    name: 'risk-identifier',
    prompt: {
      role: 'Supply Chain Risk Analyst',
      task: 'Identify potential supply chain risks',
      context: args,
      instructions: [
        '1. Review supplier base for risk indicators',
        '2. Identify category-specific risks',
        '3. Assess geographic concentration risks',
        '4. Identify single-source dependencies',
        '5. Review historical incident data',
        '6. Assess capacity constraints',
        '7. Identify technology/cyber risks',
        '8. Create comprehensive risk inventory'
      ],
      outputFormat: 'JSON with identified risks'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedRisks', 'riskCategories', 'artifacts'],
      properties: {
        identifiedRisks: { type: 'array' },
        riskCategories: { type: 'object' },
        singleSourceRisks: { type: 'array' },
        concentrationRisks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'identification']
}));

export const financialRiskTask = defineTask('financial-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Financial Risk Assessment',
  agent: {
    name: 'financial-risk-analyst',
    prompt: {
      role: 'Financial Risk Analyst',
      task: 'Assess supplier financial risks',
      context: args,
      instructions: [
        '1. Review supplier credit ratings',
        '2. Analyze financial statements',
        '3. Assess bankruptcy risk',
        '4. Evaluate currency exposure',
        '5. Assess commodity price risks',
        '6. Review payment history',
        '7. Identify concentration risk',
        '8. Score financial risks'
      ],
      outputFormat: 'JSON with financial risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'financialScores', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        financialScores: { type: 'object' },
        creditRisks: { type: 'array' },
        currencyRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'financial']
}));

export const operationalRiskTask = defineTask('operational-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Operational Risk Assessment',
  agent: {
    name: 'operational-risk-analyst',
    prompt: {
      role: 'Operational Risk Analyst',
      task: 'Assess operational supply chain risks',
      context: args,
      instructions: [
        '1. Assess supplier capacity risks',
        '2. Evaluate quality risks',
        '3. Assess lead time risks',
        '4. Evaluate logistics risks',
        '5. Assess technology risks',
        '6. Evaluate natural disaster exposure',
        '7. Assess labor disruption risks',
        '8. Score operational risks'
      ],
      outputFormat: 'JSON with operational risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'operationalScores', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        operationalScores: { type: 'object' },
        capacityRisks: { type: 'array' },
        qualityRisks: { type: 'array' },
        logisticsRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'operational']
}));

export const geopoliticalRiskTask = defineTask('geopolitical-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Geopolitical Risk Assessment',
  agent: {
    name: 'geopolitical-risk-analyst',
    prompt: {
      role: 'Geopolitical Risk Analyst',
      task: 'Assess geopolitical supply chain risks',
      context: args,
      instructions: [
        '1. Assess country political stability',
        '2. Evaluate trade policy risks',
        '3. Assess tariff and sanctions risks',
        '4. Evaluate regulatory change risks',
        '5. Assess border/customs risks',
        '6. Evaluate infrastructure risks',
        '7. Assess civil unrest risks',
        '8. Score geopolitical risks'
      ],
      outputFormat: 'JSON with geopolitical risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'geopoliticalScores', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        geopoliticalScores: { type: 'object' },
        countryRisks: { type: 'object' },
        tradeRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'geopolitical']
}));

export const complianceRiskTask = defineTask('compliance-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Compliance Risk Assessment',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Compliance Risk Analyst',
      task: 'Assess compliance-related supply chain risks',
      context: args,
      instructions: [
        '1. Assess regulatory compliance risks',
        '2. Evaluate environmental compliance risks',
        '3. Assess labor compliance risks',
        '4. Evaluate data privacy risks',
        '5. Assess product safety risks',
        '6. Evaluate certification risks',
        '7. Assess ethical sourcing risks',
        '8. Score compliance risks'
      ],
      outputFormat: 'JSON with compliance risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'complianceScores', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        complianceScores: { type: 'object' },
        regulatoryRisks: { type: 'array' },
        ethicalRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'compliance']
}));

export const riskScoringTask = defineTask('risk-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Risk Scoring and Prioritization',
  agent: {
    name: 'risk-scorer',
    prompt: {
      role: 'Risk Scoring Specialist',
      task: 'Score and prioritize identified risks',
      context: args,
      instructions: [
        '1. Consolidate all identified risks',
        '2. Score likelihood (1-5 scale)',
        '3. Score impact (1-5 scale)',
        '4. Calculate risk score (likelihood x impact)',
        '5. Classify risks (critical, high, medium, low)',
        '6. Prioritize risks by score',
        '7. Create risk register',
        '8. Document scoring methodology'
      ],
      outputFormat: 'JSON with risk scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['riskRegister', 'totalRisks', 'criticalRisks', 'highRisks', 'artifacts'],
      properties: {
        riskRegister: { type: 'array' },
        totalRisks: { type: 'number' },
        criticalRisks: { type: 'number' },
        highRisks: { type: 'number' },
        mediumRisks: { type: 'number' },
        lowRisks: { type: 'number' },
        scoringMethodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'scoring']
}));

export const heatMapGenerationTask = defineTask('heat-map-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Heat Map Generation',
  agent: {
    name: 'heat-map-generator',
    prompt: {
      role: 'Risk Visualization Specialist',
      task: 'Generate risk heat map',
      context: args,
      instructions: [
        '1. Create likelihood vs. impact matrix',
        '2. Plot risks on heat map',
        '3. Color code by severity',
        '4. Group risks by category',
        '5. Create supplier risk heat map',
        '6. Create geographic risk heat map',
        '7. Generate visual reports',
        '8. Document heat map'
      ],
      outputFormat: 'JSON with heat map data'
    },
    outputSchema: {
      type: 'object',
      required: ['heatMap', 'visualizations', 'artifacts'],
      properties: {
        heatMap: { type: 'object' },
        visualizations: { type: 'array' },
        supplierHeatMap: { type: 'object' },
        geographicHeatMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'heat-map']
}));

export const mitigationPlanTask = defineTask('mitigation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Mitigation Planning',
  agent: {
    name: 'mitigation-planner',
    prompt: {
      role: 'Risk Mitigation Specialist',
      task: 'Develop risk mitigation plan',
      context: args,
      instructions: [
        '1. Develop mitigation strategies for critical risks',
        '2. Define mitigation actions for high risks',
        '3. Identify risk owners',
        '4. Set mitigation timelines',
        '5. Define contingency plans',
        '6. Calculate mitigation costs',
        '7. Prioritize mitigation investments',
        '8. Create mitigation action plan'
      ],
      outputFormat: 'JSON with mitigation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'contingencyPlans', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        contingencyPlans: { type: 'array' },
        riskOwners: { type: 'object' },
        mitigationCosts: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-assessment', 'mitigation']
}));
