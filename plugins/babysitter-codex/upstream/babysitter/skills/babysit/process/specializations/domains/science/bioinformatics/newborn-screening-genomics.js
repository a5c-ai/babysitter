/**
 * @process specializations/domains/science/bioinformatics/newborn-screening-genomics
 * @description Newborn Screening Genomics - Rapid genomic analysis workflow optimized for newborn screening
 * applications with focus on turnaround time and actionable findings.
 * @inputs { projectName: string, newborn: object, screeningPanel?: string, urgentMode?: boolean, outputDir?: string }
 * @outputs { success: boolean, screeningResults: array, carrierStatus: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/newborn-screening-genomics', {
 *   projectName: 'Newborn Screen Case',
 *   newborn: { id: 'NB001', dob: '2025-01-20', vcf: '/data/newborn.vcf' },
 *   screeningPanel: 'ACMG59',
 *   urgentMode: true
 * });
 *
 * @references
 * - ACMG Newborn Screening: https://www.acmg.net/ACMG/Medical-Genetics-Practice-Resources/Practice-Guidelines.aspx
 * - BabySeq: https://www.genomes2people.org/babyseq/
 * - RUSP: https://www.hrsa.gov/advisory-committees/heritable-disorders/rusp
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    newborn,
    screeningPanel = 'ACMG59', // 'ACMG59', 'RUSP', 'Extended', 'Custom'
    urgentMode = false,
    outputDir = 'newborn-screening-output',
    includeCarrierStatus = true,
    includePGx = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Newborn Screening Genomics for ${projectName}`);
  ctx.log('info', `Panel: ${screeningPanel}, Urgent Mode: ${urgentMode}`);

  // Phase 1: Rapid Data Processing
  const processingResult = await ctx.task(rapidDataProcessingTask, { projectName, newborn, urgentMode, outputDir });
  artifacts.push(...processingResult.artifacts);

  // Phase 2: Targeted Gene Panel Analysis
  const panelResult = await ctx.task(targetedPanelAnalysisTask, { projectName, variants: processingResult.variants, screeningPanel, outputDir });
  artifacts.push(...panelResult.artifacts);

  ctx.log('info', `Panel analysis complete. ${panelResult.genesAnalyzed} genes, ${panelResult.variantsInPanel} variants in panel`);

  // Phase 3: Pathogenic Variant Identification
  const pathogenicResult = await ctx.task(pathogenicIdentificationTask, { projectName, panelVariants: panelResult.panelVariants, screeningPanel, outputDir });
  artifacts.push(...pathogenicResult.artifacts);

  if (pathogenicResult.actionableFindings > 0) {
    await ctx.breakpoint({
      question: `URGENT: ${pathogenicResult.actionableFindings} actionable pathogenic variants identified. Review immediately for clinical action.`,
      title: 'Actionable Findings Alert',
      context: { runId: ctx.runId, actionableVariants: pathogenicResult.actionable, urgentRecommendations: pathogenicResult.urgentRecommendations, files: pathogenicResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
    });
  }

  // Phase 4: Carrier Status Determination
  let carrierResult = null;
  if (includeCarrierStatus) {
    carrierResult = await ctx.task(carrierStatusTask, { projectName, variants: processingResult.variants, outputDir });
    artifacts.push(...carrierResult.artifacts);
  }

  // Phase 5: Pharmacogenomics Panel
  let pgxResult = null;
  if (includePGx) {
    pgxResult = await ctx.task(newbornPgxTask, { projectName, variants: processingResult.variants, outputDir });
    artifacts.push(...pgxResult.artifacts);
  }

  // Phase 6: Biochemical Integration
  const biochemResult = await ctx.task(biochemicalIntegrationTask, { projectName, genomicFindings: pathogenicResult, biochemicalResults: newborn.biochemical, outputDir });
  artifacts.push(...biochemResult.artifacts);

  // Phase 7: Rapid Clinical Reporting
  const reportResult = await ctx.task(rapidClinicalReportTask, { projectName, newborn, pathogenicResult, carrierResult, pgxResult, biochemResult, screeningPanel, outputDir });
  artifacts.push(...reportResult.artifacts);

  // Phase 8: Quality Assurance
  const qaResult = await ctx.task(screeningQaTask, { projectName, results: { pathogenicResult, carrierResult }, outputDir });
  artifacts.push(...qaResult.artifacts);

  // Phase 9: Follow-up Recommendations
  const followupResult = await ctx.task(followupRecommendationsTask, { projectName, screeningResults: pathogenicResult, carrierStatus: carrierResult, pgxResults: pgxResult, outputDir });
  artifacts.push(...followupResult.artifacts);

  await ctx.breakpoint({
    question: `Newborn Screening Complete. ${pathogenicResult.actionableFindings} actionable, ${carrierResult?.carrierConditions || 0} carrier conditions. Approve clinical report?`,
    title: 'Newborn Screening Complete',
    context: { runId: ctx.runId, summary: { actionable: pathogenicResult.actionableFindings, carriers: carrierResult?.carrierConditions || 0, pgxFindings: pgxResult?.significantFindings || 0 }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Screening Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    newbornId: newborn.id,
    screeningPanel,
    screeningResults: pathogenicResult.results,
    carrierStatus: carrierResult?.carriers || [],
    pgxFindings: pgxResult?.findings || [],
    recommendations: followupResult.recommendations,
    turnaroundTime: urgentMode ? 'Rapid (24-48h)' : 'Standard (7-14 days)',
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/newborn-screening-genomics', timestamp: startTime, screeningPanel, urgentMode }
  };
}

// Task Definitions
export const rapidDataProcessingTask = defineTask('rapid-data-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rapid Processing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rapid Genomics Processing Specialist',
      task: 'Rapidly process genomic data for newborn screening',
      context: args,
      instructions: ['1. Load and validate VCF data', '2. Apply quality filters', '3. Extract screening-relevant variants', '4. Generate processing summary', '5. Flag urgent variants for immediate review'],
      outputFormat: 'JSON object with processed data'
    },
    outputSchema: { type: 'object', required: ['success', 'variants', 'artifacts'], properties: { success: { type: 'boolean' }, variants: { type: 'string' }, totalVariants: { type: 'number' }, processingTime: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'rapid-processing']
}));

export const targetedPanelAnalysisTask = defineTask('targeted-panel-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Panel Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screening Panel Specialist',
      task: 'Analyze targeted gene panel',
      context: args,
      instructions: ['1. Extract variants in panel genes', '2. Apply panel-specific filters', '3. Annotate with ClinVar', '4. Calculate coverage metrics', '5. Generate panel report'],
      outputFormat: 'JSON object with panel analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'panelVariants', 'genesAnalyzed', 'variantsInPanel', 'artifacts'], properties: { success: { type: 'boolean' }, panelVariants: { type: 'array' }, genesAnalyzed: { type: 'number' }, variantsInPanel: { type: 'number' }, coverageStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'panel-analysis']
}));

export const pathogenicIdentificationTask = defineTask('pathogenic-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathogenic ID - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pathogenic Variant Identification Specialist',
      task: 'Identify pathogenic variants for screening conditions',
      context: args,
      instructions: ['1. Filter for pathogenic/likely pathogenic', '2. Match to screening conditions', '3. Assess clinical actionability', '4. Generate urgent alerts', '5. Create findings summary'],
      outputFormat: 'JSON object with pathogenic findings'
    },
    outputSchema: { type: 'object', required: ['success', 'results', 'actionableFindings', 'actionable', 'urgentRecommendations', 'artifacts'], properties: { success: { type: 'boolean' }, results: { type: 'array' }, actionableFindings: { type: 'number' }, actionable: { type: 'array' }, urgentRecommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'pathogenic-identification']
}));

export const carrierStatusTask = defineTask('carrier-status', (args, taskCtx) => ({
  kind: 'agent',
  title: `Carrier Status - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Carrier Screening Specialist',
      task: 'Determine carrier status',
      context: args,
      instructions: ['1. Identify heterozygous pathogenic variants', '2. Filter for recessive conditions', '3. Classify carrier conditions', '4. Generate carrier report', '5. Flag for genetic counseling'],
      outputFormat: 'JSON object with carrier status'
    },
    outputSchema: { type: 'object', required: ['success', 'carriers', 'carrierConditions', 'artifacts'], properties: { success: { type: 'boolean' }, carriers: { type: 'array' }, carrierConditions: { type: 'number' }, counselingRecommended: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'carrier-status']
}));

export const newbornPgxTask = defineTask('newborn-pgx', (args, taskCtx) => ({
  kind: 'agent',
  title: `Newborn PGx - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pediatric Pharmacogenomics Specialist',
      task: 'Analyze pharmacogenomics for newborn',
      context: args,
      instructions: ['1. Genotype key PGx genes', '2. Focus on pediatric-relevant drugs', '3. Predict metabolizer status', '4. Generate PGx card', '5. Create medication alerts'],
      outputFormat: 'JSON object with PGx results'
    },
    outputSchema: { type: 'object', required: ['success', 'findings', 'significantFindings', 'artifacts'], properties: { success: { type: 'boolean' }, findings: { type: 'array' }, significantFindings: { type: 'number' }, medicationAlerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'pharmacogenomics']
}));

export const biochemicalIntegrationTask = defineTask('biochemical-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Biochemical Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biochemical-Genomic Integration Specialist',
      task: 'Integrate genomic with biochemical screening',
      context: args,
      instructions: ['1. Correlate genomic with biochemical markers', '2. Identify concordant findings', '3. Flag discordant results', '4. Prioritize by combined evidence', '5. Generate integrated summary'],
      outputFormat: 'JSON object with integration results'
    },
    outputSchema: { type: 'object', required: ['success', 'integratedFindings', 'artifacts'], properties: { success: { type: 'boolean' }, integratedFindings: { type: 'array' }, concordantPairs: { type: 'number' }, discordantPairs: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'integration']
}));

export const rapidClinicalReportTask = defineTask('rapid-clinical-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clinical Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Newborn Screening Report Specialist',
      task: 'Generate rapid clinical report',
      context: args,
      instructions: ['1. Create urgent findings section', '2. Present screening results', '3. Include carrier information', '4. Add PGx summary', '5. Generate actionable recommendations'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, urgentReport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'report-generation']
}));

export const screeningQaTask = defineTask('screening-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Screening QA - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screening Quality Assurance Specialist',
      task: 'Perform quality assurance on screening results',
      context: args,
      instructions: ['1. Verify all panel genes covered', '2. Check variant call quality', '3. Validate classifications', '4. Compare with controls', '5. Generate QA report'],
      outputFormat: 'JSON object with QA results'
    },
    outputSchema: { type: 'object', required: ['success', 'qaStatus', 'artifacts'], properties: { success: { type: 'boolean' }, qaStatus: { type: 'string' }, coverageMetrics: { type: 'object' }, qualityScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'quality-assurance']
}));

export const followupRecommendationsTask = defineTask('followup-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Followup Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Followup Specialist',
      task: 'Generate follow-up recommendations',
      context: args,
      instructions: ['1. Prioritize confirmatory testing', '2. Recommend specialist referrals', '3. Suggest monitoring plans', '4. Include family counseling recommendations', '5. Generate followup timeline'],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: { type: 'object', required: ['success', 'recommendations', 'artifacts'], properties: { success: { type: 'boolean' }, recommendations: { type: 'array' }, confirmatoryTesting: { type: 'array' }, referrals: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'newborn-screening', 'followup']
}));
