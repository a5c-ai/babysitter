/**
 * @process business-strategy/core-competence-analysis
 * @description Identification and leverage of core competencies for competitive advantage across business units
 * @inputs { organizationName: string, capabilities: array, businessUnits: array, competitorData: object }
 * @outputs { success: boolean, coreCompetencies: array, competenceMatrix: object, leverageStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    capabilities = [],
    businessUnits = [],
    competitorData = {},
    outputDir = 'core-competence-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Core Competence Analysis for ${organizationName}`);

  // Phase 1: Potential Core Competence Identification
  ctx.log('info', 'Phase 1: Identifying potential core competencies');
  const competenceIdentification = await ctx.task(competenceIdentificationTask, {
    organizationName, capabilities, businessUnits, outputDir
  });
  artifacts.push(...competenceIdentification.artifacts);

  // Phase 2: Core Competence Tests
  ctx.log('info', 'Phase 2: Applying core competence tests');
  const competenceTests = await ctx.task(competenceTestsTask, {
    organizationName, competenceIdentification, competitorData, outputDir
  });
  artifacts.push(...competenceTests.artifacts);

  // Phase 3: Competence-Product Mapping
  ctx.log('info', 'Phase 3: Mapping competencies to products and business units');
  const competenceMapping = await ctx.task(competenceMappingTask, {
    organizationName, competenceTests, businessUnits, outputDir
  });
  artifacts.push(...competenceMapping.artifacts);

  // Phase 4: Competence Strength Assessment
  ctx.log('info', 'Phase 4: Assessing competence strength and sustainability');
  const strengthAssessment = await ctx.task(strengthAssessmentTask, {
    organizationName, competenceTests, competitorData, outputDir
  });
  artifacts.push(...strengthAssessment.artifacts);

  // Phase 5: Gap Analysis
  ctx.log('info', 'Phase 5: Identifying competence gaps and development needs');
  const gapAnalysis = await ctx.task(competenceGapAnalysisTask, {
    organizationName, competenceTests, strengthAssessment, businessUnits, outputDir
  });
  artifacts.push(...gapAnalysis.artifacts);

  // Phase 6: Leverage Strategy Development
  ctx.log('info', 'Phase 6: Developing competence leverage strategy');
  const leverageStrategy = await ctx.task(leverageStrategyTask, {
    organizationName, competenceTests, competenceMapping, strengthAssessment, outputDir
  });
  artifacts.push(...leverageStrategy.artifacts);

  // Phase 7: Investment and Protection Plan
  ctx.log('info', 'Phase 7: Creating competence investment and protection plan');
  const investmentPlan = await ctx.task(competenceInvestmentPlanTask, {
    organizationName, competenceTests, gapAnalysis, leverageStrategy, outputDir
  });
  artifacts.push(...investmentPlan.artifacts);

  // Phase 8: Generate Report
  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const competenceReport = await ctx.task(coreCompetenceReportTask, {
    organizationName, competenceIdentification, competenceTests, competenceMapping,
    strengthAssessment, gapAnalysis, leverageStrategy, investmentPlan, outputDir
  });
  artifacts.push(...competenceReport.artifacts);

  await ctx.breakpoint({
    question: `Core competence analysis complete for ${organizationName}. ${competenceTests.validatedCompetencies?.length || 0} core competencies validated. Review?`,
    title: 'Core Competence Analysis Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName,
    coreCompetencies: competenceTests.validatedCompetencies,
    competenceMatrix: competenceMapping.matrix,
    strengthScorecard: strengthAssessment.scorecard,
    leverageStrategy: leverageStrategy.strategy,
    investmentPlan: investmentPlan.plan,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/core-competence-analysis', timestamp: startTime, outputDir }
  };
}

export const competenceIdentificationTask = defineTask('competence-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify potential core competencies',
  agent: {
    name: 'competence-identifier',
    prompt: {
      role: 'core competence analyst',
      task: 'Identify potential core competencies from organizational capabilities',
      context: args,
      instructions: ['Inventory all organizational capabilities', 'Identify capabilities that span multiple products/units', 'Look for unique bundles of skills and technologies', 'Identify capabilities customers value highly', 'Generate potential core competence list']
    },
    outputSchema: { type: 'object', required: ['potentialCompetencies', 'artifacts'], properties: { potentialCompetencies: { type: 'array' }, capabilityInventory: { type: 'array' }, competenceClusters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'identification']
}));

export const competenceTestsTask = defineTask('competence-tests', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply Prahalad & Hamel core competence tests',
  agent: {
    name: 'competence-tester',
    prompt: {
      role: 'core competence validation specialist',
      task: 'Apply the three tests of core competence',
      context: args,
      instructions: ['Test 1: Customer Value - Does it contribute to customer-perceived value?', 'Test 2: Competitor Differentiation - Is it difficult for competitors to imitate?', 'Test 3: Extendability - Can it be leveraged to new markets/products?', 'Score each potential competence on all three tests', 'Identify validated core competencies', 'Generate competence test results']
    },
    outputSchema: { type: 'object', required: ['validatedCompetencies', 'artifacts'], properties: { validatedCompetencies: { type: 'array' }, testResults: { type: 'array' }, failedCandidates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'validation']
}));

export const competenceMappingTask = defineTask('competence-mapping', (args, taskCtx) => ({
  kind: 'agent', title: 'Map competencies to products and business units',
  agent: {
    name: 'competence-mapper',
    prompt: {
      role: 'competence mapping specialist',
      task: 'Create competence-product matrix',
      context: args,
      instructions: ['Map each core competence to products/services that use it', 'Map competencies to business units', 'Identify competence concentration and spread', 'Find underleveraged competencies', 'Create competence-product matrix visualization', 'Generate competence mapping documentation']
    },
    outputSchema: { type: 'object', required: ['matrix', 'artifacts'], properties: { matrix: { type: 'object' }, competenceProductMap: { type: 'object' }, competenceUnitMap: { type: 'object' }, underleveraged: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'mapping']
}));

export const strengthAssessmentTask = defineTask('strength-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess competence strength and sustainability',
  agent: {
    name: 'strength-assessor',
    prompt: {
      role: 'competence strength analyst',
      task: 'Assess strength and sustainability of each core competence',
      context: args,
      instructions: ['Assess current strength relative to competitors', 'Evaluate sustainability over time', 'Identify erosion threats', 'Assess investment adequacy', 'Create competence strength scorecard', 'Generate strength assessment report']
    },
    outputSchema: { type: 'object', required: ['scorecard', 'artifacts'], properties: { scorecard: { type: 'object' }, strengthRatings: { type: 'array' }, sustainabilityRatings: { type: 'array' }, erosionThreats: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'strength']
}));

export const competenceGapAnalysisTask = defineTask('competence-gap-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify competence gaps and development needs',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'competence development specialist',
      task: 'Identify gaps in core competencies and development priorities',
      context: args,
      instructions: ['Identify competence gaps vs. strategic needs', 'Assess competencies needed for future strategy', 'Prioritize competence development areas', 'Identify acquisition vs. build options', 'Generate competence gap analysis']
    },
    outputSchema: { type: 'object', required: ['gaps', 'artifacts'], properties: { gaps: { type: 'array' }, futureNeeds: { type: 'array' }, developmentPriorities: { type: 'array' }, buildVsBuy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'gap-analysis']
}));

export const leverageStrategyTask = defineTask('leverage-strategy', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop competence leverage strategy',
  agent: {
    name: 'leverage-strategist',
    prompt: {
      role: 'competence leverage specialist',
      task: 'Develop strategy to leverage core competencies across businesses',
      context: args,
      instructions: ['Identify new markets for existing competencies', 'Identify new products enabled by competencies', 'Develop competence sharing mechanisms', 'Create leverage roadmap', 'Estimate value creation from leverage', 'Generate leverage strategy']
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, newMarkets: { type: 'array' }, newProducts: { type: 'array' }, sharingMechanisms: { type: 'array' }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'leverage']
}));

export const competenceInvestmentPlanTask = defineTask('competence-investment-plan', (args, taskCtx) => ({
  kind: 'agent', title: 'Create competence investment and protection plan',
  agent: {
    name: 'investment-planner',
    prompt: {
      role: 'competence investment strategist',
      task: 'Create plan for investing in and protecting core competencies',
      context: args,
      instructions: ['Prioritize competence investments', 'Define protection strategies (IP, talent retention, secrecy)', 'Allocate resources for competence development', 'Create investment timeline', 'Define ROI metrics', 'Generate investment and protection plan']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, investmentPriorities: { type: 'array' }, protectionStrategies: { type: 'array' }, resourceAllocation: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'investment']
}));

export const coreCompetenceReportTask = defineTask('core-competence-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate core competence analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy report author',
      task: 'Generate comprehensive core competence analysis report',
      context: args,
      instructions: ['Create executive summary', 'Present core competence inventory', 'Document competence tests and validation', 'Include competence-product matrix', 'Present leverage strategy', 'Document investment plan', 'Format as Markdown report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'core-competence', 'reporting']
}));
