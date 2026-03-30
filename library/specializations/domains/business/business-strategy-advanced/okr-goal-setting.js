/**
 * @process business-strategy/okr-goal-setting
 * @description Objectives and Key Results (OKR) implementation for strategic goal setting and alignment
 * @inputs { organizationName: string, strategyContext: object, organizationalStructure: object, currentOKRs: array }
 * @outputs { success: boolean, companyOKRs: array, teamOKRs: array, alignmentMatrix: object, reviewCadence: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    strategyContext = {},
    organizationalStructure = {},
    currentOKRs = [],
    outputDir = 'okr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OKR Goal Setting for ${organizationName}`);

  // Phase 1: Company-Level OKR Development
  ctx.log('info', 'Phase 1: Developing company-level OKRs');
  const companyOKRs = await ctx.task(companyOKRsTask, {
    organizationName, strategyContext, outputDir
  });
  artifacts.push(...companyOKRs.artifacts);

  // Phase 2: Team/Department OKR Cascade
  ctx.log('info', 'Phase 2: Cascading OKRs to teams and departments');
  const teamOKRs = await ctx.task(teamOKRsTask, {
    organizationName, companyOKRs, organizationalStructure, outputDir
  });
  artifacts.push(...teamOKRs.artifacts);

  // Phase 3: OKR Alignment Validation
  ctx.log('info', 'Phase 3: Validating OKR alignment across organization');
  const alignmentValidation = await ctx.task(okrAlignmentTask, {
    organizationName, companyOKRs, teamOKRs, outputDir
  });
  artifacts.push(...alignmentValidation.artifacts);

  // Phase 4: Key Results Refinement
  ctx.log('info', 'Phase 4: Refining key results for measurability');
  const keyResultsRefinement = await ctx.task(keyResultsRefinementTask, {
    organizationName, companyOKRs, teamOKRs, outputDir
  });
  artifacts.push(...keyResultsRefinement.artifacts);

  // Phase 5: OKR Cycle Implementation
  ctx.log('info', 'Phase 5: Implementing quarterly OKR cycles');
  const okrCycles = await ctx.task(okrCyclesTask, {
    organizationName, keyResultsRefinement, outputDir
  });
  artifacts.push(...okrCycles.artifacts);

  // Phase 6: Check-in and Grading Process
  ctx.log('info', 'Phase 6: Establishing check-in and grading process');
  const gradingProcess = await ctx.task(okrGradingProcessTask, {
    organizationName, okrCycles, outputDir
  });
  artifacts.push(...gradingProcess.artifacts);

  // Phase 7: Transparency and Communication
  ctx.log('info', 'Phase 7: Ensuring transparency and communication');
  const transparencyPlan = await ctx.task(okrTransparencyTask, {
    organizationName, companyOKRs, teamOKRs, outputDir
  });
  artifacts.push(...transparencyPlan.artifacts);

  // Phase 8: Generate OKR Documentation
  ctx.log('info', 'Phase 8: Generating OKR implementation documentation');
  const okrReport = await ctx.task(okrReportTask, {
    organizationName, companyOKRs, teamOKRs, alignmentValidation, keyResultsRefinement,
    okrCycles, gradingProcess, transparencyPlan, outputDir
  });
  artifacts.push(...okrReport.artifacts);

  await ctx.breakpoint({
    question: `OKR goal setting complete for ${organizationName}. ${companyOKRs.objectives?.length || 0} company objectives defined. Review?`,
    title: 'OKR Goal Setting Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName,
    companyOKRs: companyOKRs.objectives,
    teamOKRs: teamOKRs.teamObjectives,
    alignmentMatrix: alignmentValidation.matrix,
    reviewCadence: okrCycles.cadence,
    gradingProcess: gradingProcess.process,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/okr-goal-setting', timestamp: startTime, outputDir }
  };
}

export const companyOKRsTask = defineTask('company-okrs', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop company-level OKRs',
  agent: {
    name: 'okr-architect',
    prompt: {
      role: 'OKR implementation specialist',
      task: 'Develop ambitious company-level OKRs aligned with strategy',
      context: args,
      instructions: ['Define 3-5 ambitious qualitative objectives', 'Ensure objectives are inspiring and challenging', 'Create 3-5 measurable key results per objective', 'Ensure key results are specific and time-bound', 'Align with strategic priorities', 'Generate company OKR documentation']
    },
    outputSchema: { type: 'object', required: ['objectives', 'artifacts'], properties: { objectives: { type: 'array' }, keyResults: { type: 'object' }, strategicAlignment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'company']
}));

export const teamOKRsTask = defineTask('team-okrs', (args, taskCtx) => ({
  kind: 'agent', title: 'Cascade OKRs to teams',
  agent: {
    name: 'okr-cascader',
    prompt: {
      role: 'OKR alignment specialist',
      task: 'Cascade company OKRs to team and department level',
      context: args,
      instructions: ['Define team-level objectives that support company OKRs', 'Create team key results aligned with company key results', 'Ensure appropriate scope for each team', 'Balance top-down and bottom-up OKR setting', 'Identify cross-functional dependencies', 'Generate team OKR documentation']
    },
    outputSchema: { type: 'object', required: ['teamObjectives', 'artifacts'], properties: { teamObjectives: { type: 'array' }, dependencies: { type: 'array' }, alignmentLinks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'teams']
}));

export const okrAlignmentTask = defineTask('okr-alignment', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate OKR alignment',
  agent: {
    name: 'alignment-validator',
    prompt: {
      role: 'OKR alignment analyst',
      task: 'Validate alignment and identify gaps in OKR structure',
      context: args,
      instructions: ['Map team OKRs to company OKRs', 'Identify alignment gaps', 'Check for orphan objectives', 'Validate key result coverage', 'Create alignment matrix', 'Generate alignment validation report']
    },
    outputSchema: { type: 'object', required: ['matrix', 'artifacts'], properties: { matrix: { type: 'object' }, gaps: { type: 'array' }, orphanObjectives: { type: 'array' }, alignmentScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'alignment']
}));

export const keyResultsRefinementTask = defineTask('key-results-refinement', (args, taskCtx) => ({
  kind: 'agent', title: 'Refine key results for measurability',
  agent: {
    name: 'kr-refiner',
    prompt: {
      role: 'key results specialist',
      task: 'Refine key results for clarity and measurability',
      context: args,
      instructions: ['Ensure key results are quantifiable', 'Apply SMART criteria to each key result', 'Define measurement methods', 'Set baseline and target values', 'Identify leading vs lagging indicators', 'Generate refined key results documentation']
    },
    outputSchema: { type: 'object', required: ['refinedKRs', 'artifacts'], properties: { refinedKRs: { type: 'array' }, measurements: { type: 'object' }, baselines: { type: 'object' }, targets: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'refinement']
}));

export const okrCyclesTask = defineTask('okr-cycles', (args, taskCtx) => ({
  kind: 'agent', title: 'Implement quarterly OKR cycles',
  agent: {
    name: 'cycle-designer',
    prompt: {
      role: 'OKR cycle specialist',
      task: 'Design quarterly OKR cycles and check-in cadence',
      context: args,
      instructions: ['Define quarterly OKR cycle timeline', 'Establish weekly check-in process', 'Define mid-quarter review process', 'Create quarter-end retrospective process', 'Plan annual OKR planning integration', 'Generate OKR cycle documentation']
    },
    outputSchema: { type: 'object', required: ['cadence', 'artifacts'], properties: { cadence: { type: 'object' }, timeline: { type: 'object' }, checkInProcess: { type: 'object' }, retrospectiveProcess: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'cycles']
}));

export const okrGradingProcessTask = defineTask('okr-grading-process', (args, taskCtx) => ({
  kind: 'agent', title: 'Establish grading and retrospective process',
  agent: {
    name: 'grading-designer',
    prompt: {
      role: 'OKR grading specialist',
      task: 'Design OKR grading and retrospective process',
      context: args,
      instructions: ['Define grading scale (0.0-1.0)', 'Establish grading criteria', 'Design self-assessment process', 'Create retrospective framework', 'Plan iteration and learning process', 'Generate grading process documentation']
    },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, gradingScale: { type: 'object' }, criteria: { type: 'array' }, retrospectiveFramework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'grading']
}));

export const okrTransparencyTask = defineTask('okr-transparency', (args, taskCtx) => ({
  kind: 'agent', title: 'Ensure transparency and communication',
  agent: {
    name: 'transparency-planner',
    prompt: {
      role: 'OKR communication specialist',
      task: 'Plan transparency and communication of OKRs',
      context: args,
      instructions: ['Design OKR visibility mechanisms', 'Plan all-hands OKR communication', 'Establish OKR sharing tools and platforms', 'Define cross-team visibility', 'Plan progress sharing cadence', 'Generate transparency plan documentation']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, visibilityMechanisms: { type: 'array' }, tools: { type: 'array' }, communicationPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'transparency']
}));

export const okrReportTask = defineTask('okr-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate OKR implementation documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'OKR documentation specialist',
      task: 'Generate comprehensive OKR implementation documentation',
      context: args,
      instructions: ['Create executive summary', 'Document company OKRs', 'Document team OKRs', 'Include alignment matrix', 'Document OKR processes', 'Format as professional OKR guide']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'okr', 'reporting']
}));
