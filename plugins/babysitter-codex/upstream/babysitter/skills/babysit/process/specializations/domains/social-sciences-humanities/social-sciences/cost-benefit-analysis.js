/**
 * @process social-sciences/cost-benefit-analysis
 * @description Perform economic evaluation of policies and programs including monetization of outcomes, discounting, sensitivity analysis, and distributional impact assessment
 * @inputs { intervention: object, timeHorizon: number, discountRate: number, outputDir: string }
 * @outputs { success: boolean, cbaResults: object, sensitivityResults: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-006 (program-evaluation), SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-004 (program-evaluation-specialist), AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    intervention = {},
    timeHorizon = 10,
    discountRate = 0.03,
    outputDir = 'cba-output',
    perspective = 'societal'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cost-Benefit Analysis process');

  // ============================================================================
  // PHASE 1: FRAMEWORK SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up CBA framework');
  const frameworkSetup = await ctx.task(cbaFrameworkTask, {
    intervention,
    timeHorizon,
    discountRate,
    perspective,
    outputDir
  });

  artifacts.push(...frameworkSetup.artifacts);

  // ============================================================================
  // PHASE 2: COST IDENTIFICATION AND ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying and estimating costs');
  const costEstimation = await ctx.task(costEstimationTask, {
    intervention,
    frameworkSetup,
    timeHorizon,
    outputDir
  });

  artifacts.push(...costEstimation.artifacts);

  // ============================================================================
  // PHASE 3: BENEFIT IDENTIFICATION AND MONETIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying and monetizing benefits');
  const benefitEstimation = await ctx.task(benefitEstimationTask, {
    intervention,
    frameworkSetup,
    timeHorizon,
    outputDir
  });

  artifacts.push(...benefitEstimation.artifacts);

  // ============================================================================
  // PHASE 4: DISCOUNTING AND NPV CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Calculating present values');
  const presentValueCalc = await ctx.task(presentValueCalculationTask, {
    costEstimation,
    benefitEstimation,
    discountRate,
    timeHorizon,
    outputDir
  });

  artifacts.push(...presentValueCalc.artifacts);

  // ============================================================================
  // PHASE 5: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(cbaSensitivityAnalysisTask, {
    presentValueCalc,
    costEstimation,
    benefitEstimation,
    discountRate,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: DISTRIBUTIONAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing distributional impacts');
  const distributionalAnalysis = await ctx.task(distributionalAnalysisTask, {
    costEstimation,
    benefitEstimation,
    intervention,
    outputDir
  });

  artifacts.push(...distributionalAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring CBA quality');
  const qualityScore = await ctx.task(cbaQualityScoringTask, {
    frameworkSetup,
    costEstimation,
    benefitEstimation,
    presentValueCalc,
    sensitivityAnalysis,
    distributionalAnalysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const cbaScore = qualityScore.overallScore;
  const qualityMet = cbaScore >= 80;

  // Breakpoint: Review CBA
  await ctx.breakpoint({
    question: `Cost-benefit analysis complete. Quality score: ${cbaScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Cost-Benefit Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        cbaScore,
        qualityMet,
        npv: presentValueCalc.npv,
        bcRatio: presentValueCalc.bcRatio,
        irr: presentValueCalc.irr
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: cbaScore,
    qualityMet,
    cbaResults: {
      totalCosts: costEstimation.totalCosts,
      totalBenefits: benefitEstimation.totalBenefits,
      npv: presentValueCalc.npv,
      bcRatio: presentValueCalc.bcRatio,
      irr: presentValueCalc.irr,
      paybackPeriod: presentValueCalc.paybackPeriod
    },
    sensitivityResults: sensitivityAnalysis.results,
    distributionalImpacts: distributionalAnalysis.impacts,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/cost-benefit-analysis',
      timestamp: startTime,
      perspective,
      discountRate,
      timeHorizon,
      outputDir
    }
  };
}

export const cbaFrameworkTask = defineTask('cba-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up CBA framework',
  agent: {
    name: 'cba-framework-specialist',
    prompt: {
      role: 'economic evaluation specialist',
      task: 'Establish cost-benefit analysis framework',
      context: args,
      instructions: [
        'Define analysis perspective (societal, government, etc.)',
        'Specify time horizon and base year',
        'Select discount rate with justification',
        'Define scope of costs and benefits to include',
        'Identify key parameters and assumptions',
        'Plan data sources for cost and benefit estimation',
        'Address ethical considerations',
        'Generate CBA framework document'
      ],
      outputFormat: 'JSON with perspective, timeHorizon, discountRate, scope, assumptions, dataSources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['perspective', 'scope', 'assumptions', 'artifacts'],
      properties: {
        perspective: { type: 'string' },
        timeHorizon: { type: 'number' },
        discountRate: { type: 'number' },
        baseYear: { type: 'number' },
        scope: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        dataSources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'framework']
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate costs',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'cost analysis specialist',
      task: 'Identify and estimate all relevant costs',
      context: args,
      instructions: [
        'Identify direct costs (implementation, operation)',
        'Identify indirect costs (opportunity costs)',
        'Identify intangible costs',
        'Estimate costs by year',
        'Adjust for inflation to base year',
        'Account for cost uncertainty',
        'Document data sources and methods',
        'Generate cost estimation report'
      ],
      outputFormat: 'JSON with directCosts, indirectCosts, intangibleCosts, totalCosts, costsByYear, uncertainty, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCosts', 'costsByYear', 'artifacts'],
      properties: {
        directCosts: { type: 'object' },
        indirectCosts: { type: 'object' },
        intangibleCosts: { type: 'object' },
        totalCosts: { type: 'number' },
        costsByYear: { type: 'array' },
        uncertainty: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'costs']
}));

export const benefitEstimationTask = defineTask('benefit-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate benefits',
  agent: {
    name: 'benefit-estimator',
    prompt: {
      role: 'benefit valuation specialist',
      task: 'Identify and monetize all relevant benefits',
      context: args,
      instructions: [
        'Identify direct benefits',
        'Identify indirect/spillover benefits',
        'Identify intangible benefits',
        'Apply appropriate valuation methods',
        'Use willingness-to-pay or market prices',
        'Apply benefit transfer if needed',
        'Estimate benefits by year',
        'Document valuation methods and uncertainty',
        'Generate benefit estimation report'
      ],
      outputFormat: 'JSON with directBenefits, indirectBenefits, intangibleBenefits, totalBenefits, benefitsByYear, valuationMethods, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBenefits', 'benefitsByYear', 'artifacts'],
      properties: {
        directBenefits: { type: 'object' },
        indirectBenefits: { type: 'object' },
        intangibleBenefits: { type: 'object' },
        totalBenefits: { type: 'number' },
        benefitsByYear: { type: 'array' },
        valuationMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'benefits']
}));

export const presentValueCalculationTask = defineTask('present-value-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate present values',
  agent: {
    name: 'pv-calculator',
    prompt: {
      role: 'financial analyst',
      task: 'Calculate present values and CBA metrics',
      context: args,
      instructions: [
        'Discount future costs to present value',
        'Discount future benefits to present value',
        'Calculate net present value (NPV)',
        'Calculate benefit-cost ratio',
        'Calculate internal rate of return (IRR)',
        'Calculate payback period',
        'Create cash flow table',
        'Generate present value calculations report'
      ],
      outputFormat: 'JSON with pvCosts, pvBenefits, npv, bcRatio, irr, paybackPeriod, cashFlowTable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['npv', 'bcRatio', 'artifacts'],
      properties: {
        pvCosts: { type: 'number' },
        pvBenefits: { type: 'number' },
        npv: { type: 'number' },
        bcRatio: { type: 'number' },
        irr: { type: 'number' },
        paybackPeriod: { type: 'number' },
        cashFlowTable: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'present-value']
}));

export const cbaSensitivityAnalysisTask = defineTask('cba-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'economic sensitivity analyst',
      task: 'Conduct comprehensive sensitivity analysis',
      context: args,
      instructions: [
        'Vary discount rate and assess impact',
        'Vary key cost parameters',
        'Vary key benefit parameters',
        'Conduct Monte Carlo simulation if data available',
        'Calculate switching values for key parameters',
        'Identify most sensitive parameters',
        'Create tornado diagram',
        'Generate sensitivity analysis report'
      ],
      outputFormat: 'JSON with results, discountRateSensitivity, parameterSensitivity, switchingValues, tornadoDiagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        discountRateSensitivity: { type: 'object' },
        parameterSensitivity: { type: 'array' },
        switchingValues: { type: 'object' },
        tornadoDiagram: { type: 'string' },
        monteCarlo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'sensitivity']
}));

export const distributionalAnalysisTask = defineTask('distributional-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze distributional impacts',
  agent: {
    name: 'distributional-analyst',
    prompt: {
      role: 'distributional impact analyst',
      task: 'Analyze distributional impacts of intervention',
      context: args,
      instructions: [
        'Identify affected stakeholder groups',
        'Estimate costs and benefits by group',
        'Assess impacts on different income levels',
        'Analyze geographic distribution',
        'Consider intergenerational impacts',
        'Apply distributional weights if appropriate',
        'Assess equity implications',
        'Generate distributional analysis report'
      ],
      outputFormat: 'JSON with impacts, stakeholderImpacts, incomeDistribution, equityAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impacts', 'artifacts'],
      properties: {
        impacts: { type: 'object' },
        stakeholderImpacts: { type: 'array' },
        incomeDistribution: { type: 'object' },
        geographicDistribution: { type: 'object' },
        intergenerational: { type: 'object' },
        equityAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'distributional']
}));

export const cbaQualityScoringTask = defineTask('cba-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score CBA quality',
  agent: {
    name: 'cba-quality-reviewer',
    prompt: {
      role: 'economic evaluation methodologist',
      task: 'Assess cost-benefit analysis quality',
      context: args,
      instructions: [
        'Evaluate framework setup (weight: 10%)',
        'Assess cost estimation rigor (weight: 20%)',
        'Evaluate benefit estimation and monetization (weight: 25%)',
        'Assess present value calculations (weight: 15%)',
        'Evaluate sensitivity analysis (weight: 20%)',
        'Assess distributional analysis (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cba', 'quality-scoring']
}));
