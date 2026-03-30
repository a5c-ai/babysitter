/**
 * @process business-strategy/ma-target-screening
 * @description Systematic identification and evaluation of potential acquisition targets based on strategic fit, financial attractiveness, and integration feasibility
 * @inputs { strategicRationale: string, industryFocus: array, acquisitionCriteria: object, organizationContext: object, outputDir: string }
 * @outputs { success: boolean, targetLongList: array, targetShortList: array, targetProfiles: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    strategicRationale = '',
    industryFocus = [],
    acquisitionCriteria = {},
    organizationContext = {},
    outputDir = 'ma-screening-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting M&A Target Screening Process');

  // Phase 1: Strategic Rationale Definition
  ctx.log('info', 'Phase 1: Defining strategic rationale');
  const rationaleDefinition = await ctx.task(strategicRationaleTask, { strategicRationale, organizationContext, outputDir });
  artifacts.push(...rationaleDefinition.artifacts);

  // Phase 2: Screening Criteria Development
  ctx.log('info', 'Phase 2: Developing screening criteria');
  const screeningCriteria = await ctx.task(screeningCriteriaTask, { rationaleDefinition, acquisitionCriteria, outputDir });
  artifacts.push(...screeningCriteria.artifacts);

  // Phase 3: Market and Industry Mapping
  ctx.log('info', 'Phase 3: Mapping target markets and industries');
  const marketMapping = await ctx.task(marketMappingTask, { industryFocus, screeningCriteria, outputDir });
  artifacts.push(...marketMapping.artifacts);

  // Phase 4: Long List Generation
  ctx.log('info', 'Phase 4: Generating target long list');
  const longList = await ctx.task(longListGenerationTask, { marketMapping, screeningCriteria, outputDir });
  artifacts.push(...longList.artifacts);

  // Phase 5: Preliminary Screening
  ctx.log('info', 'Phase 5: Conducting preliminary screening');
  const preliminaryScreening = await ctx.task(preliminaryScreeningTask, { longList, screeningCriteria, outputDir });
  artifacts.push(...preliminaryScreening.artifacts);

  // Phase 6: Strategic Fit Assessment
  ctx.log('info', 'Phase 6: Assessing strategic fit');
  const strategicFit = await ctx.task(strategicFitTask, { preliminaryScreening, rationaleDefinition, outputDir });
  artifacts.push(...strategicFit.artifacts);

  // Phase 7: Financial Attractiveness Analysis
  ctx.log('info', 'Phase 7: Analyzing financial attractiveness');
  const financialAnalysis = await ctx.task(financialAttractivenessTask, { strategicFit, outputDir });
  artifacts.push(...financialAnalysis.artifacts);

  // Phase 8: Integration Feasibility Assessment
  ctx.log('info', 'Phase 8: Assessing integration feasibility');
  const integrationFeasibility = await ctx.task(integrationFeasibilityTask, { financialAnalysis, organizationContext, outputDir });
  artifacts.push(...integrationFeasibility.artifacts);

  // Phase 9: Short List Development
  ctx.log('info', 'Phase 9: Developing target short list');
  const shortList = await ctx.task(shortListDevelopmentTask, { strategicFit, financialAnalysis, integrationFeasibility, outputDir });
  artifacts.push(...shortList.artifacts);

  // Phase 10: Target Profiling
  ctx.log('info', 'Phase 10: Creating detailed target profiles');
  const targetProfiles = await ctx.task(targetProfilingTask, { shortList, outputDir });
  artifacts.push(...targetProfiles.artifacts);

  // Phase 11: Generate Report
  ctx.log('info', 'Phase 11: Generating M&A screening report');
  const screeningReport = await ctx.task(screeningReportTask, { rationaleDefinition, screeningCriteria, longList, shortList, targetProfiles, outputDir });
  artifacts.push(...screeningReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    targetLongList: longList.targets,
    targetShortList: shortList.targets,
    targetProfiles: targetProfiles.profiles,
    screeningCriteria: screeningCriteria.criteria,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/ma-target-screening', timestamp: startTime }
  };
}

export const strategicRationaleTask = defineTask('strategic-rationale', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define strategic rationale',
  agent: {
    name: 'ma-strategist',
    prompt: {
      role: 'M&A strategy specialist',
      task: 'Define and articulate M&A strategic rationale',
      context: args,
      instructions: ['Clarify acquisition objectives', 'Define value creation thesis', 'Identify strategic gaps to fill', 'Document deal rationale', 'Save to output directory'],
      outputFormat: 'JSON with rationale (object), valueCreationThesis (string), strategicGaps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['rationale', 'artifacts'], properties: { rationale: { type: 'object' }, valueCreationThesis: { type: 'string' }, strategicGaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'rationale']
}));

export const screeningCriteriaTask = defineTask('screening-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop screening criteria',
  agent: {
    name: 'criteria-developer',
    prompt: {
      role: 'M&A screening specialist',
      task: 'Develop comprehensive target screening criteria',
      context: args,
      instructions: ['Define must-have criteria', 'Define nice-to-have criteria', 'Set financial thresholds', 'Define strategic fit parameters', 'Save criteria to output directory'],
      outputFormat: 'JSON with criteria (object), mustHave (array), niceToHave (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['criteria', 'artifacts'], properties: { criteria: { type: 'object' }, mustHave: { type: 'array' }, niceToHave: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'criteria']
}));

export const marketMappingTask = defineTask('market-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map target markets',
  agent: {
    name: 'market-mapper',
    prompt: {
      role: 'market research analyst',
      task: 'Map target markets and industries for M&A opportunities',
      context: args,
      instructions: ['Identify target industry segments', 'Map competitive landscape', 'Identify market consolidation trends', 'Document market attractiveness', 'Save mapping to output directory'],
      outputFormat: 'JSON with marketMap (object), segments (array), consolidationTrends (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['marketMap', 'artifacts'], properties: { marketMap: { type: 'object' }, segments: { type: 'array' }, consolidationTrends: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'market']
}));

export const longListGenerationTask = defineTask('long-list-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate target long list',
  agent: {
    name: 'target-identifier',
    prompt: {
      role: 'M&A target identification specialist',
      task: 'Generate comprehensive long list of potential targets',
      context: args,
      instructions: ['Research potential targets', 'Include public and private companies', 'Document basic company information', 'Initial categorization', 'Save long list to output directory'],
      outputFormat: 'JSON with targets (array), categorization (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['targets', 'artifacts'], properties: { targets: { type: 'array' }, categorization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'targets']
}));

export const preliminaryScreeningTask = defineTask('preliminary-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct preliminary screening',
  agent: {
    name: 'preliminary-screener',
    prompt: {
      role: 'M&A analyst',
      task: 'Conduct preliminary screening of target long list',
      context: args,
      instructions: ['Apply must-have criteria', 'Filter out non-qualifying targets', 'Rank remaining targets', 'Document screening rationale', 'Save screening results to output directory'],
      outputFormat: 'JSON with qualifiedTargets (array), eliminatedTargets (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['qualifiedTargets', 'artifacts'], properties: { qualifiedTargets: { type: 'array' }, eliminatedTargets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'screening']
}));

export const strategicFitTask = defineTask('strategic-fit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic fit',
  agent: {
    name: 'strategic-fit-analyst',
    prompt: {
      role: 'strategic fit assessment specialist',
      task: 'Assess strategic fit of qualified targets',
      context: args,
      instructions: ['Evaluate business model alignment', 'Assess capability complementarity', 'Evaluate market position enhancement', 'Score strategic fit', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessments (array), rankings (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessments', 'artifacts'], properties: { assessments: { type: 'array' }, rankings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'strategic-fit']
}));

export const financialAttractivenessTask = defineTask('financial-attractiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze financial attractiveness',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'M&A financial analyst',
      task: 'Analyze financial attractiveness of targets',
      context: args,
      instructions: ['Evaluate financial performance', 'Estimate valuation ranges', 'Assess deal affordability', 'Calculate preliminary synergies', 'Save analysis to output directory'],
      outputFormat: 'JSON with financialAssessments (array), valuations (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['financialAssessments', 'artifacts'], properties: { financialAssessments: { type: 'array' }, valuations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'financial']
}));

export const integrationFeasibilityTask = defineTask('integration-feasibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess integration feasibility',
  agent: {
    name: 'integration-analyst',
    prompt: {
      role: 'post-merger integration specialist',
      task: 'Assess integration feasibility of targets',
      context: args,
      instructions: ['Evaluate cultural compatibility', 'Assess operational integration complexity', 'Identify integration risks', 'Estimate integration timeline', 'Save assessment to output directory'],
      outputFormat: 'JSON with feasibilityAssessments (array), integrationRisks (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['feasibilityAssessments', 'artifacts'], properties: { feasibilityAssessments: { type: 'array' }, integrationRisks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'integration']
}));

export const shortListDevelopmentTask = defineTask('short-list-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop target short list',
  agent: {
    name: 'shortlist-developer',
    prompt: {
      role: 'M&A target prioritization specialist',
      task: 'Develop prioritized short list of targets',
      context: args,
      instructions: ['Combine all assessment scores', 'Apply weighting to criteria', 'Rank and prioritize targets', 'Select top targets for short list', 'Save short list to output directory'],
      outputFormat: 'JSON with targets (array), rankings (array), selectionRationale (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['targets', 'artifacts'], properties: { targets: { type: 'array' }, rankings: { type: 'array' }, selectionRationale: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'shortlist']
}));

export const targetProfilingTask = defineTask('target-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create target profiles',
  agent: {
    name: 'target-profiler',
    prompt: {
      role: 'M&A research analyst',
      task: 'Create detailed profiles for short-listed targets',
      context: args,
      instructions: ['Compile comprehensive company profiles', 'Document business overview', 'Include financial summary', 'Identify key value drivers', 'Save profiles to output directory'],
      outputFormat: 'JSON with profiles (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['profiles', 'artifacts'], properties: { profiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'profiling']
}));

export const screeningReportTask = defineTask('screening-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate screening report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'M&A advisor and technical writer',
      task: 'Generate comprehensive M&A target screening report',
      context: args,
      instructions: ['Create executive summary', 'Document screening methodology', 'Present target analysis', 'Include recommendations', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ma', 'reporting']
}));
