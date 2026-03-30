/**
 * @process business-strategy/business-case-development
 * @description Comprehensive business case development including strategic alignment, financial analysis, risk assessment, and implementation planning
 * @inputs { initiative: string, initiativeContext: object, organizationContext: object, financialAssumptions: object, outputDir: string }
 * @outputs { success: boolean, businessCase: object, financialAnalysis: object, riskAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    initiative = '',
    initiativeContext = {},
    organizationContext = {},
    financialAssumptions = {},
    outputDir = 'business-case-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Business Case Development Process');

  // Phase 1: Problem/Opportunity Definition
  ctx.log('info', 'Phase 1: Defining problem or opportunity');
  const problemDefinition = await ctx.task(problemDefinitionTask, { initiative, initiativeContext, outputDir });
  artifacts.push(...problemDefinition.artifacts);

  // Phase 2: Strategic Alignment
  ctx.log('info', 'Phase 2: Assessing strategic alignment');
  const strategicAlignment = await ctx.task(strategicAlignmentTask, { problemDefinition, organizationContext, outputDir });
  artifacts.push(...strategicAlignment.artifacts);

  // Phase 3: Options Analysis
  ctx.log('info', 'Phase 3: Analyzing options');
  const optionsAnalysis = await ctx.task(optionsAnalysisTask, { problemDefinition, initiativeContext, outputDir });
  artifacts.push(...optionsAnalysis.artifacts);

  // Phase 4: Benefits Identification
  ctx.log('info', 'Phase 4: Identifying benefits');
  const benefitsAnalysis = await ctx.task(benefitsIdentificationTask, { optionsAnalysis, outputDir });
  artifacts.push(...benefitsAnalysis.artifacts);

  // Phase 5: Cost Estimation
  ctx.log('info', 'Phase 5: Estimating costs');
  const costEstimation = await ctx.task(costEstimationTask, { optionsAnalysis, financialAssumptions, outputDir });
  artifacts.push(...costEstimation.artifacts);

  // Phase 6: Financial Analysis
  ctx.log('info', 'Phase 6: Conducting financial analysis');
  const financialAnalysis = await ctx.task(financialAnalysisTask, { benefitsAnalysis, costEstimation, financialAssumptions, outputDir });
  artifacts.push(...financialAnalysis.artifacts);

  // Phase 7: Risk Assessment
  ctx.log('info', 'Phase 7: Assessing risks');
  const riskAssessment = await ctx.task(riskAssessmentTask, { optionsAnalysis, financialAnalysis, outputDir });
  artifacts.push(...riskAssessment.artifacts);

  // Phase 8: Sensitivity Analysis
  ctx.log('info', 'Phase 8: Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, { financialAnalysis, riskAssessment, outputDir });
  artifacts.push(...sensitivityAnalysis.artifacts);

  // Phase 9: Implementation Approach
  ctx.log('info', 'Phase 9: Defining implementation approach');
  const implementationApproach = await ctx.task(implementationApproachTask, { optionsAnalysis, outputDir });
  artifacts.push(...implementationApproach.artifacts);

  // Phase 10: Recommendation Development
  ctx.log('info', 'Phase 10: Developing recommendation');
  const recommendation = await ctx.task(recommendationTask, { optionsAnalysis, financialAnalysis, riskAssessment, sensitivityAnalysis, outputDir });
  artifacts.push(...recommendation.artifacts);

  // Phase 11: Generate Business Case Document
  ctx.log('info', 'Phase 11: Generating business case document');
  const businessCaseDocument = await ctx.task(businessCaseDocumentTask, { problemDefinition, strategicAlignment, optionsAnalysis, benefitsAnalysis, costEstimation, financialAnalysis, riskAssessment, recommendation, implementationApproach, outputDir });
  artifacts.push(...businessCaseDocument.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    businessCase: {
      problem: problemDefinition.problem,
      strategicAlignment: strategicAlignment.alignment,
      options: optionsAnalysis.options,
      recommendation: recommendation.recommendation
    },
    financialAnalysis: {
      costs: costEstimation.costs,
      benefits: benefitsAnalysis.benefits,
      roi: financialAnalysis.roi,
      npv: financialAnalysis.npv,
      paybackPeriod: financialAnalysis.paybackPeriod
    },
    riskAssessment: riskAssessment.assessment,
    implementationPlan: implementationApproach.plan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/business-case-development', timestamp: startTime }
  };
}

export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define problem or opportunity',
  agent: {
    name: 'problem-analyst',
    prompt: {
      role: 'business analyst',
      task: 'Define and articulate the problem or opportunity',
      context: args,
      instructions: ['Articulate problem statement', 'Document current state', 'Describe desired future state', 'Quantify problem impact', 'Save definition to output directory'],
      outputFormat: 'JSON with problem (object), currentState (object), futureState (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['problem', 'artifacts'], properties: { problem: { type: 'object' }, currentState: { type: 'object' }, futureState: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'problem']
}));

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic alignment',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'strategic alignment analyst',
      task: 'Assess alignment with organizational strategy',
      context: args,
      instructions: ['Map to strategic objectives', 'Assess priority level', 'Identify strategic dependencies', 'Document alignment rationale', 'Save assessment to output directory'],
      outputFormat: 'JSON with alignment (object), strategicFit (number), dependencies (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['alignment', 'artifacts'], properties: { alignment: { type: 'object' }, strategicFit: { type: 'number' }, dependencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'strategy']
}));

export const optionsAnalysisTask = defineTask('options-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze options',
  agent: {
    name: 'options-analyst',
    prompt: {
      role: 'business options analyst',
      task: 'Identify and analyze solution options',
      context: args,
      instructions: ['Identify viable options', 'Include do-nothing baseline', 'Evaluate pros and cons', 'Assess feasibility', 'Save analysis to output directory'],
      outputFormat: 'JSON with options (array), evaluation (object), shortlistedOptions (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['options', 'artifacts'], properties: { options: { type: 'array' }, evaluation: { type: 'object' }, shortlistedOptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'options']
}));

export const benefitsIdentificationTask = defineTask('benefits-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify benefits',
  agent: {
    name: 'benefits-analyst',
    prompt: {
      role: 'benefits realization analyst',
      task: 'Identify and quantify benefits for each option',
      context: args,
      instructions: ['Identify tangible benefits', 'Identify intangible benefits', 'Quantify financial benefits', 'Create benefits map', 'Save benefits to output directory'],
      outputFormat: 'JSON with benefits (array), tangibleBenefits (array), intangibleBenefits (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['benefits', 'artifacts'], properties: { benefits: { type: 'array' }, tangibleBenefits: { type: 'array' }, intangibleBenefits: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'benefits']
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate costs',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'cost estimation specialist',
      task: 'Estimate costs for each option',
      context: args,
      instructions: ['Estimate capital costs', 'Estimate operational costs', 'Identify one-time vs recurring costs', 'Account for contingencies', 'Save estimates to output directory'],
      outputFormat: 'JSON with costs (object), capitalCosts (array), operationalCosts (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['costs', 'artifacts'], properties: { costs: { type: 'object' }, capitalCosts: { type: 'array' }, operationalCosts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'costs']
}));

export const financialAnalysisTask = defineTask('financial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct financial analysis',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial analyst',
      task: 'Conduct comprehensive financial analysis',
      context: args,
      instructions: ['Calculate ROI', 'Calculate NPV', 'Calculate IRR', 'Determine payback period', 'Compare options financially', 'Save analysis to output directory'],
      outputFormat: 'JSON with roi (number), npv (number), irr (number), paybackPeriod (number), financialComparison (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['roi', 'npv', 'artifacts'], properties: { roi: { type: 'number' }, npv: { type: 'number' }, irr: { type: 'number' }, paybackPeriod: { type: 'number' }, financialComparison: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'financial']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'risk assessment specialist',
      task: 'Assess risks for each option',
      context: args,
      instructions: ['Identify risks per option', 'Assess likelihood and impact', 'Develop mitigation strategies', 'Create risk register', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), risks (array), mitigations (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, risks: { type: 'array' }, mitigations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'risk']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'financial modeling specialist',
      task: 'Perform sensitivity analysis on financial projections',
      context: args,
      instructions: ['Identify key variables', 'Model best/base/worst cases', 'Determine break-even points', 'Create tornado diagrams', 'Save analysis to output directory'],
      outputFormat: 'JSON with sensitivity (object), scenarios (array), breakEvenPoints (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['sensitivity', 'artifacts'], properties: { sensitivity: { type: 'object' }, scenarios: { type: 'array' }, breakEvenPoints: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'sensitivity']
}));

export const implementationApproachTask = defineTask('implementation-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define implementation approach',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'implementation planning specialist',
      task: 'Define implementation approach for recommended option',
      context: args,
      instructions: ['Define implementation phases', 'Create high-level timeline', 'Identify resource requirements', 'Define governance approach', 'Save approach to output directory'],
      outputFormat: 'JSON with plan (object), phases (array), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, phases: { type: 'array' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'implementation']
}));

export const recommendationTask = defineTask('recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendation',
  agent: {
    name: 'recommendation-developer',
    prompt: {
      role: 'business case recommendation specialist',
      task: 'Develop and justify recommendation',
      context: args,
      instructions: ['Synthesize all analyses', 'Develop clear recommendation', 'Justify preferred option', 'Define approval requirements', 'Save recommendation to output directory'],
      outputFormat: 'JSON with recommendation (object), justification (string), approvalRequirements (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['recommendation', 'artifacts'], properties: { recommendation: { type: 'object' }, justification: { type: 'string' }, approvalRequirements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'recommendation']
}));

export const businessCaseDocumentTask = defineTask('business-case-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate business case document',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'business case writer and technical writer',
      task: 'Generate comprehensive business case document',
      context: args,
      instructions: ['Create executive summary', 'Document all sections', 'Include financial exhibits', 'Create appendices', 'Save document to output directory'],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['documentPath', 'artifacts'], properties: { documentPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'business-case', 'document']
}));
