/**
 * @process specializations/domains/science/bioinformatics/tumor-molecular-profiling
 * @description Tumor Molecular Profiling - Comprehensive molecular characterization of tumors for precision
 * oncology including somatic mutation calling, copy number analysis, fusion detection, and biomarker assessment.
 * @inputs { projectName: string, tumorSample: object, normalSample?: object, panelType?: string, outputDir?: string }
 * @outputs { success: boolean, somaticMutations: array, cnvProfile: object, fusions: array, biomarkers: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/tumor-molecular-profiling', {
 *   projectName: 'Oncology Patient Case',
 *   tumorSample: { id: 'TUMOR001', bam: '/data/tumor.bam' },
 *   normalSample: { id: 'NORMAL001', bam: '/data/normal.bam' },
 *   panelType: 'WES'
 * });
 *
 * @references
 * - GATK Somatic: https://gatk.broadinstitute.org/hc/en-us/articles/360035894731-Somatic-short-variant-discovery-SNVs-Indels-
 * - OncoKB: https://www.oncokb.org/
 * - COSMIC: https://cancer.sanger.ac.uk/cosmic
 * - CIViC: https://civicdb.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    tumorSample,
    normalSample = null,
    panelType = 'WES', // 'WGS', 'WES', 'Panel'
    outputDir = 'tumor-profiling-output',
    cancerType = 'Unknown',
    referenceGenome = 'GRCh38',
    includeHRD = true,
    includeMSI = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Tumor Molecular Profiling for ${projectName}`);
  ctx.log('info', `Panel: ${panelType}, Cancer Type: ${cancerType}, Matched Normal: ${normalSample ? 'Yes' : 'No'}`);

  // Phase 1: Tumor/Normal QC
  const qcResult = await ctx.task(tumorQcTask, { projectName, tumorSample, normalSample, panelType, outputDir });
  artifacts.push(...qcResult.artifacts);

  // Phase 2: Somatic Mutation Calling
  const somaticResult = await ctx.task(somaticMutationCallingTask, { projectName, tumorSample, normalSample, referenceGenome, outputDir });
  artifacts.push(...somaticResult.artifacts);

  ctx.log('info', `Somatic calling complete. ${somaticResult.totalMutations} somatic mutations identified`);

  await ctx.breakpoint({
    question: `Somatic mutation calling complete. ${somaticResult.totalMutations} mutations (${somaticResult.snvCount} SNVs, ${somaticResult.indelCount} indels). Review results?`,
    title: 'Somatic Mutation Review',
    context: { runId: ctx.runId, mutationStats: somaticResult.statistics, topMutations: somaticResult.topMutations, files: somaticResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Copy Number Alteration Detection
  const cnvResult = await ctx.task(cnvDetectionTask, { projectName, tumorSample, normalSample, panelType, outputDir });
  artifacts.push(...cnvResult.artifacts);

  // Phase 4: Gene Fusion Detection
  const fusionResult = await ctx.task(fusionDetectionTask, { projectName, tumorSample, panelType, outputDir });
  artifacts.push(...fusionResult.artifacts);

  // Phase 5: MSI Assessment
  let msiResult = null;
  if (includeMSI) {
    msiResult = await ctx.task(msiAssessmentTask, { projectName, tumorSample, normalSample, outputDir });
    artifacts.push(...msiResult.artifacts);
  }

  // Phase 6: TMB Calculation
  const tmbResult = await ctx.task(tmbCalculationTask, { projectName, somaticMutations: somaticResult.mutations, panelType, outputDir });
  artifacts.push(...tmbResult.artifacts);

  // Phase 7: HRD Assessment
  let hrdResult = null;
  if (includeHRD && panelType !== 'Panel') {
    hrdResult = await ctx.task(hrdAssessmentTask, { projectName, tumorSample, normalSample, cnvProfile: cnvResult.profile, outputDir });
    artifacts.push(...hrdResult.artifacts);
  }

  // Phase 8: Actionable Mutation Identification
  const actionableResult = await ctx.task(actionableMutationTask, { projectName, somaticMutations: somaticResult.mutations, cnvProfile: cnvResult.profile, fusions: fusionResult.fusions, cancerType, outputDir });
  artifacts.push(...actionableResult.artifacts);

  await ctx.breakpoint({
    question: `Actionable mutation analysis complete. ${actionableResult.actionableCount} actionable alterations found. Review for therapy matching?`,
    title: 'Actionable Mutations Review',
    context: { runId: ctx.runId, actionableMutations: actionableResult.actionable, therapyMatches: actionableResult.therapyMatches, files: actionableResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 9: Therapy Matching
  const therapyResult = await ctx.task(therapyMatchingTask, { projectName, actionableMutations: actionableResult.actionable, cancerType, msiStatus: msiResult?.status, tmbScore: tmbResult.tmb, outputDir });
  artifacts.push(...therapyResult.artifacts);

  // Phase 10: Report Generation
  const reportResult = await ctx.task(generateTumorReportTask, { projectName, cancerType, qcResult, somaticResult, cnvResult, fusionResult, msiResult, tmbResult, hrdResult, actionableResult, therapyResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Tumor Molecular Profiling Complete. ${somaticResult.totalMutations} mutations, TMB: ${tmbResult.tmb}, ${actionableResult.actionableCount} actionable. Approve clinical report?`,
    title: 'Tumor Profiling Complete',
    context: { runId: ctx.runId, summary: { mutations: somaticResult.totalMutations, tmb: tmbResult.tmb, actionable: actionableResult.actionableCount, therapyOptions: therapyResult.therapyOptions.length }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Clinical Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    cancerType,
    somaticMutations: somaticResult.mutations,
    cnvProfile: cnvResult.profile,
    fusions: fusionResult.fusions,
    biomarkers: {
      tmb: tmbResult.tmb,
      tmbCategory: tmbResult.category,
      msiStatus: msiResult?.status || 'Not assessed',
      hrdScore: hrdResult?.score || null
    },
    actionableMutations: actionableResult.actionable,
    therapyRecommendations: therapyResult.therapyOptions,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/tumor-molecular-profiling', timestamp: startTime, panelType, cancerType }
  };
}

// Task Definitions
export const tumorQcTask = defineTask('tumor-qc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tumor QC - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Oncology QC Specialist',
      task: 'Quality control tumor and normal samples',
      context: args,
      instructions: ['1. Assess tumor purity', '2. Calculate coverage metrics', '3. Verify tumor-normal matching', '4. Check contamination levels', '5. Generate QC report'],
      outputFormat: 'JSON object with QC results'
    },
    outputSchema: { type: 'object', required: ['success', 'tumorPurity', 'coverage', 'artifacts'], properties: { success: { type: 'boolean' }, tumorPurity: { type: 'number' }, coverage: { type: 'object' }, contamination: { type: 'number' }, matchVerified: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'quality-control']
}));

export const somaticMutationCallingTask = defineTask('somatic-mutation-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Somatic Calling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Somatic Variant Calling Specialist',
      task: 'Call somatic mutations',
      context: args,
      instructions: ['1. Run Mutect2 for somatic calling', '2. Filter mutations (FilterMutectCalls)', '3. Annotate with Funcotator/VEP', '4. Calculate VAF', '5. Generate mutation summary'],
      outputFormat: 'JSON object with somatic mutations'
    },
    outputSchema: { type: 'object', required: ['success', 'mutations', 'totalMutations', 'snvCount', 'indelCount', 'statistics', 'topMutations', 'artifacts'], properties: { success: { type: 'boolean' }, mutations: { type: 'array' }, totalMutations: { type: 'number' }, snvCount: { type: 'number' }, indelCount: { type: 'number' }, statistics: { type: 'object' }, topMutations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'somatic-calling']
}));

export const cnvDetectionTask = defineTask('cnv-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `CNV Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Copy Number Analysis Specialist',
      task: 'Detect copy number alterations',
      context: args,
      instructions: ['1. Run CNVkit or GATK CNV', '2. Segment copy number profile', '3. Call amplifications and deletions', '4. Identify focal CNVs', '5. Generate CNV plots'],
      outputFormat: 'JSON object with CNV results'
    },
    outputSchema: { type: 'object', required: ['success', 'profile', 'artifacts'], properties: { success: { type: 'boolean' }, profile: { type: 'object' }, amplifications: { type: 'array' }, deletions: { type: 'array' }, focalEvents: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'cnv-detection']
}));

export const fusionDetectionTask = defineTask('fusion-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fusion Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gene Fusion Specialist',
      task: 'Detect gene fusions',
      context: args,
      instructions: ['1. Run fusion callers (STAR-Fusion, Arriba)', '2. Filter high-confidence fusions', '3. Annotate fusion partners', '4. Assess oncogenic potential', '5. Generate fusion report'],
      outputFormat: 'JSON object with fusion results'
    },
    outputSchema: { type: 'object', required: ['success', 'fusions', 'artifacts'], properties: { success: { type: 'boolean' }, fusions: { type: 'array' }, oncogenicFusions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'fusion-detection']
}));

export const msiAssessmentTask = defineTask('msi-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSI Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MSI Assessment Specialist',
      task: 'Assess microsatellite instability',
      context: args,
      instructions: ['1. Run MSIsensor or similar', '2. Calculate MSI score', '3. Classify as MSI-H/MSS', '4. Validate with markers', '5. Generate MSI report'],
      outputFormat: 'JSON object with MSI results'
    },
    outputSchema: { type: 'object', required: ['success', 'status', 'score', 'artifacts'], properties: { success: { type: 'boolean' }, status: { type: 'string' }, score: { type: 'number' }, unstableMarkers: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'msi-assessment']
}));

export const tmbCalculationTask = defineTask('tmb-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `TMB Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TMB Calculation Specialist',
      task: 'Calculate tumor mutational burden',
      context: args,
      instructions: ['1. Count coding mutations', '2. Calculate TMB (muts/Mb)', '3. Normalize by panel size', '4. Classify TMB category', '5. Generate TMB report'],
      outputFormat: 'JSON object with TMB results'
    },
    outputSchema: { type: 'object', required: ['success', 'tmb', 'category', 'artifacts'], properties: { success: { type: 'boolean' }, tmb: { type: 'number' }, category: { type: 'string' }, mutationCount: { type: 'number' }, panelSizeMb: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'tmb-calculation']
}));

export const hrdAssessmentTask = defineTask('hrd-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `HRD Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HRD Assessment Specialist',
      task: 'Assess homologous recombination deficiency',
      context: args,
      instructions: ['1. Calculate LOH score', '2. Calculate TAI score', '3. Calculate LST score', '4. Compute HRD score', '5. Classify HRD status'],
      outputFormat: 'JSON object with HRD results'
    },
    outputSchema: { type: 'object', required: ['success', 'score', 'status', 'artifacts'], properties: { success: { type: 'boolean' }, score: { type: 'number' }, status: { type: 'string' }, lohScore: { type: 'number' }, taiScore: { type: 'number' }, lstScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'hrd-assessment']
}));

export const actionableMutationTask = defineTask('actionable-mutation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Actionable Mutations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Actionable Mutation Specialist',
      task: 'Identify actionable mutations',
      context: args,
      instructions: ['1. Query OncoKB database', '2. Query CIViC database', '3. Classify actionability level', '4. Match to approved therapies', '5. Identify clinical trials'],
      outputFormat: 'JSON object with actionable mutations'
    },
    outputSchema: { type: 'object', required: ['success', 'actionable', 'actionableCount', 'therapyMatches', 'artifacts'], properties: { success: { type: 'boolean' }, actionable: { type: 'array' }, actionableCount: { type: 'number' }, therapyMatches: { type: 'array' }, clinicalTrials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'actionability']
}));

export const therapyMatchingTask = defineTask('therapy-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Therapy Matching - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Precision Oncology Specialist',
      task: 'Match to targeted therapies',
      context: args,
      instructions: ['1. Match mutations to targeted therapies', '2. Consider immunotherapy eligibility', '3. Identify combination options', '4. Search clinical trials', '5. Generate therapy recommendations'],
      outputFormat: 'JSON object with therapy matches'
    },
    outputSchema: { type: 'object', required: ['success', 'therapyOptions', 'artifacts'], properties: { success: { type: 'boolean' }, therapyOptions: { type: 'array' }, immunotherapyEligible: { type: 'boolean' }, clinicalTrials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'therapy-matching']
}));

export const generateTumorReportTask = defineTask('generate-tumor-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Oncology Report Specialist',
      task: 'Generate comprehensive tumor profiling report',
      context: args,
      instructions: ['1. Create clinical summary', '2. Present genomic findings', '3. Show biomarker results', '4. Include therapy recommendations', '5. Document methods and limitations'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, clinicalSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'oncology', 'report-generation']
}));
