/**
 * @process business-strategy/ma-strategic-assessment
 * @description Strategic assessment for mergers, acquisitions, and divestitures including synergy analysis and integration planning
 * @inputs { organizationName: string, dealType: string, targetInfo: object, acquirerInfo: object, marketContext: object }
 * @outputs { success: boolean, strategicRationale: object, synergyValuation: object, integrationFramework: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    dealType = 'acquisition',
    targetInfo = {},
    acquirerInfo = {},
    marketContext = {},
    outputDir = 'ma-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting M&A Strategic Assessment for ${organizationName}`);

  // Phase 1: Strategic Rationale Development
  ctx.log('info', 'Phase 1: Developing strategic rationale and deal thesis');
  const strategicRationale = await ctx.task(strategicRationaleTask, {
    organizationName, dealType, targetInfo, acquirerInfo, marketContext, outputDir
  });
  artifacts.push(...strategicRationale.artifacts);

  // Phase 2: Target Screening and Evaluation
  ctx.log('info', 'Phase 2: Screening and evaluating target');
  const targetEvaluation = await ctx.task(targetEvaluationTask, {
    organizationName, targetInfo, acquirerInfo, strategicRationale, outputDir
  });
  artifacts.push(...targetEvaluation.artifacts);

  // Phase 3: Strategic Due Diligence
  ctx.log('info', 'Phase 3: Conducting strategic due diligence');
  const strategicDueDiligence = await ctx.task(strategicDueDiligenceTask, {
    organizationName, targetInfo, targetEvaluation, marketContext, outputDir
  });
  artifacts.push(...strategicDueDiligence.artifacts);

  // Phase 4: Synergy Analysis
  ctx.log('info', 'Phase 4: Analyzing revenue and cost synergies');
  const synergyAnalysis = await ctx.task(maSynergyAnalysisTask, {
    organizationName, targetInfo, acquirerInfo, strategicDueDiligence, outputDir
  });
  artifacts.push(...synergyAnalysis.artifacts);

  // Phase 5: Cultural Compatibility Assessment
  ctx.log('info', 'Phase 5: Assessing cultural compatibility');
  const culturalAssessment = await ctx.task(culturalAssessmentTask, {
    organizationName, targetInfo, acquirerInfo, outputDir
  });
  artifacts.push(...culturalAssessment.artifacts);

  // Phase 6: Integration Risk Analysis
  ctx.log('info', 'Phase 6: Analyzing integration risks');
  const integrationRisks = await ctx.task(integrationRiskAnalysisTask, {
    organizationName, synergyAnalysis, culturalAssessment, strategicDueDiligence, outputDir
  });
  artifacts.push(...integrationRisks.artifacts);

  // Phase 7: Integration Planning Framework
  ctx.log('info', 'Phase 7: Developing integration planning framework');
  const integrationFramework = await ctx.task(integrationPlanningTask, {
    organizationName, synergyAnalysis, culturalAssessment, integrationRisks, outputDir
  });
  artifacts.push(...integrationFramework.artifacts);

  // Phase 8: Value Capture Roadmap
  ctx.log('info', 'Phase 8: Creating value capture roadmap');
  const valueCaptureRoadmap = await ctx.task(valueCaptureRoadmapTask, {
    organizationName, synergyAnalysis, integrationFramework, outputDir
  });
  artifacts.push(...valueCaptureRoadmap.artifacts);

  // Phase 9: Generate Report
  ctx.log('info', 'Phase 9: Generating comprehensive M&A assessment report');
  const maReport = await ctx.task(maAssessmentReportTask, {
    organizationName, dealType, strategicRationale, targetEvaluation, strategicDueDiligence,
    synergyAnalysis, culturalAssessment, integrationRisks, integrationFramework, valueCaptureRoadmap, outputDir
  });
  artifacts.push(...maReport.artifacts);

  await ctx.breakpoint({
    question: `M&A strategic assessment complete. Total synergy value: ${synergyAnalysis.totalSynergyValue}. Review recommendations?`,
    title: 'M&A Strategic Assessment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName, dealType,
    strategicRationale: strategicRationale.rationale,
    synergyValuation: synergyAnalysis.valuation,
    integrationFramework: integrationFramework.framework,
    valueCaptureRoadmap: valueCaptureRoadmap.roadmap,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/ma-strategic-assessment', timestamp: startTime, outputDir }
  };
}

export const strategicRationaleTask = defineTask('strategic-rationale', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop strategic rationale and deal thesis',
  agent: {
    name: 'deal-strategist',
    prompt: {
      role: 'M&A strategy specialist',
      task: 'Develop strategic rationale and deal thesis for the transaction',
      context: args,
      instructions: ['Define clear strategic rationale for the deal', 'Articulate deal thesis and value creation hypothesis', 'Identify strategic objectives achieved', 'Assess strategic fit and alignment', 'Document key assumptions', 'Generate strategic rationale document']
    },
    outputSchema: { type: 'object', required: ['rationale', 'artifacts'], properties: { rationale: { type: 'object' }, dealThesis: { type: 'string' }, strategicObjectives: { type: 'array' }, keyAssumptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'strategic-rationale']
}));

export const targetEvaluationTask = defineTask('target-evaluation', (args, taskCtx) => ({
  kind: 'agent', title: 'Screen and evaluate target',
  agent: {
    name: 'target-evaluator',
    prompt: {
      role: 'M&A target screening specialist',
      task: 'Conduct comprehensive target evaluation',
      context: args,
      instructions: ['Evaluate strategic fit with acquirer', 'Assess target market position', 'Analyze target financial performance', 'Evaluate target capabilities and assets', 'Assess deal attractiveness', 'Generate target evaluation scorecard']
    },
    outputSchema: { type: 'object', required: ['evaluation', 'artifacts'], properties: { evaluation: { type: 'object' }, strategicFit: { type: 'object' }, financialHealth: { type: 'object' }, attractivenessScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'target-evaluation']
}));

export const strategicDueDiligenceTask = defineTask('strategic-due-diligence', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct strategic due diligence',
  agent: {
    name: 'due-diligence-analyst',
    prompt: {
      role: 'strategic due diligence specialist',
      task: 'Conduct comprehensive strategic due diligence',
      context: args,
      instructions: ['Validate market size and growth assumptions', 'Assess competitive position sustainability', 'Evaluate customer and revenue quality', 'Assess technology and IP', 'Identify key risks and issues', 'Generate strategic due diligence findings']
    },
    outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'object' }, marketValidation: { type: 'object' }, competitiveAssessment: { type: 'object' }, keyRisks: { type: 'array' }, dealBreakers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'due-diligence']
}));

export const maSynergyAnalysisTask = defineTask('ma-synergy-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze revenue and cost synergies',
  agent: {
    name: 'synergy-analyst',
    prompt: {
      role: 'M&A synergy valuation specialist',
      task: 'Quantify and validate revenue and cost synergies',
      context: args,
      instructions: ['Identify and quantify revenue synergies', 'Identify and quantify cost synergies', 'Assess synergy achievability and timeline', 'Estimate implementation costs', 'Calculate net synergy value', 'Generate synergy model documentation']
    },
    outputSchema: { type: 'object', required: ['valuation', 'totalSynergyValue', 'artifacts'], properties: { valuation: { type: 'object' }, revenueSynergies: { type: 'array' }, costSynergies: { type: 'array' }, totalSynergyValue: { type: 'string' }, implementationCosts: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'synergies']
}));

export const culturalAssessmentTask = defineTask('cultural-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess cultural compatibility',
  agent: {
    name: 'culture-analyst',
    prompt: {
      role: 'organizational culture specialist',
      task: 'Assess cultural compatibility and integration challenges',
      context: args,
      instructions: ['Assess organizational culture differences', 'Identify potential culture clashes', 'Evaluate leadership compatibility', 'Assess employee integration challenges', 'Recommend culture integration approach', 'Generate cultural assessment report']
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, cultureDifferences: { type: 'array' }, integrationChallenges: { type: 'array' }, compatibilityScore: { type: 'number' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'culture']
}));

export const integrationRiskAnalysisTask = defineTask('integration-risk-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze integration risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'integration risk specialist',
      task: 'Identify and assess integration risks',
      context: args,
      instructions: ['Identify operational integration risks', 'Assess customer and revenue retention risks', 'Evaluate talent retention risks', 'Assess technology integration risks', 'Develop risk mitigation strategies', 'Generate integration risk assessment']
    },
    outputSchema: { type: 'object', required: ['risks', 'artifacts'], properties: { risks: { type: 'array' }, riskMatrix: { type: 'object' }, mitigationStrategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'risk']
}));

export const integrationPlanningTask = defineTask('integration-planning', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop integration planning framework',
  agent: {
    name: 'integration-planner',
    prompt: {
      role: 'post-merger integration specialist',
      task: 'Develop comprehensive integration planning framework',
      context: args,
      instructions: ['Define integration approach and principles', 'Develop integration workstreams and governance', 'Create Day 1 readiness plan', 'Define 100-day integration priorities', 'Establish integration metrics and KPIs', 'Generate integration framework documentation']
    },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, workstreams: { type: 'array' }, day1Plan: { type: 'object' }, hundredDayPlan: { type: 'object' }, metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'integration']
}));

export const valueCaptureRoadmapTask = defineTask('value-capture-roadmap', (args, taskCtx) => ({
  kind: 'agent', title: 'Create value capture roadmap',
  agent: {
    name: 'value-capture-planner',
    prompt: {
      role: 'M&A value creation specialist',
      task: 'Create roadmap for capturing deal value',
      context: args,
      instructions: ['Sequence synergy capture initiatives', 'Define milestones and targets', 'Allocate resources for value capture', 'Establish tracking and governance', 'Identify quick wins', 'Generate value capture roadmap']
    },
    outputSchema: { type: 'object', required: ['roadmap', 'artifacts'], properties: { roadmap: { type: 'object' }, milestones: { type: 'array' }, quickWins: { type: 'array' }, tracking: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'value-capture']
}));

export const maAssessmentReportTask = defineTask('ma-assessment-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate M&A assessment report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'M&A report author',
      task: 'Generate comprehensive M&A strategic assessment report',
      context: args,
      instructions: ['Create executive summary', 'Present strategic rationale', 'Document due diligence findings', 'Present synergy analysis', 'Include cultural assessment', 'Document integration framework', 'Present value capture roadmap', 'Format as Markdown report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'reporting']
}));
