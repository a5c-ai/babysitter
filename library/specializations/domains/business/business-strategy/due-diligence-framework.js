/**
 * @process business-strategy/due-diligence-framework
 * @description Comprehensive framework for conducting thorough due diligence across commercial, financial, legal, operational, and technical dimensions
 * @inputs { targetCompany: object, dealContext: object, diligenceScope: array, outputDir: string }
 * @outputs { success: boolean, diligenceFindings: object, riskAssessment: object, dealRecommendation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetCompany = {},
    dealContext = {},
    diligenceScope = [],
    outputDir = 'due-diligence-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Due Diligence Process');

  // Phase 1: Due Diligence Planning
  ctx.log('info', 'Phase 1: Planning due diligence');
  const ddPlanning = await ctx.task(ddPlanningTask, { targetCompany, dealContext, diligenceScope, outputDir });
  artifacts.push(...ddPlanning.artifacts);

  // Phase 2: Commercial Due Diligence
  ctx.log('info', 'Phase 2: Conducting commercial due diligence');
  const commercialDD = await ctx.task(commercialDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...commercialDD.artifacts);

  // Phase 3: Financial Due Diligence
  ctx.log('info', 'Phase 3: Conducting financial due diligence');
  const financialDD = await ctx.task(financialDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...financialDD.artifacts);

  // Phase 4: Legal Due Diligence
  ctx.log('info', 'Phase 4: Conducting legal due diligence');
  const legalDD = await ctx.task(legalDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...legalDD.artifacts);

  // Phase 5: Operational Due Diligence
  ctx.log('info', 'Phase 5: Conducting operational due diligence');
  const operationalDD = await ctx.task(operationalDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...operationalDD.artifacts);

  // Phase 6: Technology Due Diligence
  ctx.log('info', 'Phase 6: Conducting technology due diligence');
  const technologyDD = await ctx.task(technologyDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...technologyDD.artifacts);

  // Phase 7: HR and Culture Due Diligence
  ctx.log('info', 'Phase 7: Conducting HR and culture due diligence');
  const hrCultureDD = await ctx.task(hrCultureDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...hrCultureDD.artifacts);

  // Phase 8: Environmental and Compliance Due Diligence
  ctx.log('info', 'Phase 8: Conducting environmental and compliance due diligence');
  const complianceDD = await ctx.task(complianceDDTask, { targetCompany, ddPlanning, outputDir });
  artifacts.push(...complianceDD.artifacts);

  // Phase 9: Risk Synthesis and Assessment
  ctx.log('info', 'Phase 9: Synthesizing findings and assessing risks');
  const riskSynthesis = await ctx.task(riskSynthesisTask, { commercialDD, financialDD, legalDD, operationalDD, technologyDD, hrCultureDD, complianceDD, outputDir });
  artifacts.push(...riskSynthesis.artifacts);

  // Phase 10: Valuation Impact Analysis
  ctx.log('info', 'Phase 10: Analyzing valuation impact');
  const valuationImpact = await ctx.task(valuationImpactTask, { riskSynthesis, financialDD, dealContext, outputDir });
  artifacts.push(...valuationImpact.artifacts);

  // Phase 11: Deal Recommendation
  ctx.log('info', 'Phase 11: Developing deal recommendation');
  const dealRecommendation = await ctx.task(dealRecommendationTask, { riskSynthesis, valuationImpact, outputDir });
  artifacts.push(...dealRecommendation.artifacts);

  // Phase 12: Generate Report
  ctx.log('info', 'Phase 12: Generating due diligence report');
  const ddReport = await ctx.task(ddReportTask, { ddPlanning, commercialDD, financialDD, legalDD, operationalDD, riskSynthesis, dealRecommendation, outputDir });
  artifacts.push(...ddReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    diligenceFindings: {
      commercial: commercialDD.findings,
      financial: financialDD.findings,
      legal: legalDD.findings,
      operational: operationalDD.findings,
      technology: technologyDD.findings,
      hrCulture: hrCultureDD.findings,
      compliance: complianceDD.findings
    },
    riskAssessment: riskSynthesis.assessment,
    dealRecommendation: dealRecommendation.recommendation,
    valuationImpact: valuationImpact.impact,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/due-diligence-framework', timestamp: startTime }
  };
}

export const ddPlanningTask = defineTask('dd-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan due diligence',
  agent: {
    name: 'dd-planner',
    prompt: {
      role: 'due diligence planning specialist',
      task: 'Plan comprehensive due diligence approach',
      context: args,
      instructions: ['Define due diligence scope', 'Create work streams and timelines', 'Identify key focus areas', 'Plan resource requirements', 'Save plan to output directory'],
      outputFormat: 'JSON with plan (object), workStreams (array), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, workStreams: { type: 'array' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'planning']
}));

export const commercialDDTask = defineTask('commercial-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct commercial due diligence',
  agent: {
    name: 'commercial-analyst',
    prompt: {
      role: 'commercial due diligence specialist',
      task: 'Conduct commercial due diligence analysis',
      context: args,
      instructions: ['Analyze market position and dynamics', 'Assess customer base and relationships', 'Evaluate competitive positioning', 'Validate revenue projections', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), marketAnalysis (object), risks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, marketAnalysis: { type: 'object' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'commercial']
}));

export const financialDDTask = defineTask('financial-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct financial due diligence',
  agent: {
    name: 'financial-dd-analyst',
    prompt: {
      role: 'financial due diligence specialist',
      task: 'Conduct financial due diligence analysis',
      context: args,
      instructions: ['Analyze historical financials', 'Assess quality of earnings', 'Review working capital', 'Identify normalized EBITDA adjustments', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), qualityOfEarnings (object), adjustments (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, qualityOfEarnings: { type: 'object' }, adjustments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'financial']
}));

export const legalDDTask = defineTask('legal-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct legal due diligence',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'legal due diligence specialist',
      task: 'Conduct legal due diligence review',
      context: args,
      instructions: ['Review corporate structure', 'Analyze material contracts', 'Identify litigation and claims', 'Review intellectual property', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), contractIssues (array), litigationRisks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, contractIssues: { type: 'array' }, litigationRisks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'legal']
}));

export const operationalDDTask = defineTask('operational-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct operational due diligence',
  agent: {
    name: 'operations-analyst',
    prompt: {
      role: 'operational due diligence specialist',
      task: 'Conduct operational due diligence assessment',
      context: args,
      instructions: ['Assess operational capabilities', 'Review supply chain', 'Evaluate facilities and equipment', 'Identify operational risks', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), capabilities (object), risks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, capabilities: { type: 'object' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'operational']
}));

export const technologyDDTask = defineTask('technology-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct technology due diligence',
  agent: {
    name: 'technology-analyst',
    prompt: {
      role: 'technology due diligence specialist',
      task: 'Conduct technology due diligence assessment',
      context: args,
      instructions: ['Assess technology stack', 'Review IT infrastructure', 'Evaluate cybersecurity posture', 'Identify technology debt', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), techAssessment (object), risks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, techAssessment: { type: 'object' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'technology']
}));

export const hrCultureDDTask = defineTask('hr-culture-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct HR and culture due diligence',
  agent: {
    name: 'hr-culture-analyst',
    prompt: {
      role: 'HR and culture due diligence specialist',
      task: 'Conduct HR and organizational culture assessment',
      context: args,
      instructions: ['Assess organizational structure', 'Review key personnel and retention', 'Evaluate compensation and benefits', 'Assess cultural alignment', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), keyPersonnel (array), culturalAssessment (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, keyPersonnel: { type: 'array' }, culturalAssessment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'hr-culture']
}));

export const complianceDDTask = defineTask('compliance-dd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct compliance due diligence',
  agent: {
    name: 'compliance-analyst',
    prompt: {
      role: 'regulatory and compliance specialist',
      task: 'Conduct environmental and regulatory compliance review',
      context: args,
      instructions: ['Review regulatory compliance', 'Assess environmental liabilities', 'Evaluate data privacy compliance', 'Identify compliance gaps', 'Save findings to output directory'],
      outputFormat: 'JSON with findings (object), complianceGaps (array), liabilities (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, complianceGaps: { type: 'array' }, liabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'compliance']
}));

export const riskSynthesisTask = defineTask('risk-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize findings and assess risks',
  agent: {
    name: 'risk-synthesizer',
    prompt: {
      role: 'due diligence risk synthesis specialist',
      task: 'Synthesize all due diligence findings and assess overall risks',
      context: args,
      instructions: ['Consolidate all findings', 'Categorize and prioritize risks', 'Identify deal breakers', 'Develop risk mitigation strategies', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), riskMatrix (object), dealBreakers (array), mitigations (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, riskMatrix: { type: 'object' }, dealBreakers: { type: 'array' }, mitigations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'risk']
}));

export const valuationImpactTask = defineTask('valuation-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze valuation impact',
  agent: {
    name: 'valuation-analyst',
    prompt: {
      role: 'M&A valuation specialist',
      task: 'Analyze impact of due diligence findings on valuation',
      context: args,
      instructions: ['Quantify financial adjustments', 'Calculate risk-adjusted valuation', 'Identify purchase price adjustments', 'Recommend deal structure implications', 'Save analysis to output directory'],
      outputFormat: 'JSON with impact (object), adjustments (array), recommendedPrice (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['impact', 'artifacts'], properties: { impact: { type: 'object' }, adjustments: { type: 'array' }, recommendedPrice: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'valuation']
}));

export const dealRecommendationTask = defineTask('deal-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop deal recommendation',
  agent: {
    name: 'deal-advisor',
    prompt: {
      role: 'M&A deal advisor',
      task: 'Develop overall deal recommendation based on due diligence',
      context: args,
      instructions: ['Synthesize go/no-go recommendation', 'Outline key negotiation points', 'Define closing conditions', 'Identify post-close priorities', 'Save recommendation to output directory'],
      outputFormat: 'JSON with recommendation (object), negotiationPoints (array), closingConditions (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['recommendation', 'artifacts'], properties: { recommendation: { type: 'object' }, negotiationPoints: { type: 'array' }, closingConditions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'recommendation']
}));

export const ddReportTask = defineTask('dd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate due diligence report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'M&A advisor and technical writer',
      task: 'Generate comprehensive due diligence report',
      context: args,
      instructions: ['Create executive summary', 'Document all work stream findings', 'Present risk assessment', 'Include deal recommendation', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'due-diligence', 'reporting']
}));
