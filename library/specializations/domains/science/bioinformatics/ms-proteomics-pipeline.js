/**
 * @process specializations/domains/science/bioinformatics/ms-proteomics-pipeline
 * @description Mass Spectrometry Proteomics Pipeline - Comprehensive pipeline for processing and
 * analyzing mass spectrometry-based proteomics data including protein identification, quantification,
 * and statistical analysis.
 * @inputs { projectName: string, rawFiles: array, database: string, quantMethod?: string, outputDir?: string }
 * @outputs { success: boolean, proteins: array, deProteins: array, ptmSites: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/ms-proteomics-pipeline', {
 *   projectName: 'Proteome Profiling Study',
 *   rawFiles: ['/data/sample1.raw', '/data/sample2.raw'],
 *   database: 'UniProt_Human',
 *   quantMethod: 'LFQ'
 * });
 *
 * @references
 * - MaxQuant: https://www.maxquant.org/
 * - MSFragger: https://msfragger.nesvilab.org/
 * - Perseus: https://maxquant.net/perseus/
 * - Proteomics Standards Initiative: http://www.psidev.info/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rawFiles = [],
    database = 'UniProt_Human',
    quantMethod = 'LFQ', // 'LFQ', 'TMT', 'SILAC', 'DIA'
    outputDir = 'proteomics-output',
    fdrThreshold = 0.01,
    minPeptides = 2,
    modifications = ['Oxidation (M)', 'Acetyl (Protein N-term)', 'Phospho (STY)'],
    enrichedModifications = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MS Proteomics Pipeline for ${projectName}`);
  ctx.log('info', `Files: ${rawFiles.length}, Database: ${database}, Quantification: ${quantMethod}`);

  // Phase 1: Raw File Conversion and Peak Detection
  const conversionResult = await ctx.task(rawFileProcessingTask, { projectName, rawFiles, outputDir });
  artifacts.push(...conversionResult.artifacts);

  // Phase 2: Database Searching
  const searchResult = await ctx.task(databaseSearchTask, { projectName, msFiles: conversionResult.msFiles, database, modifications, fdrThreshold, outputDir });
  artifacts.push(...searchResult.artifacts);

  ctx.log('info', `Database search complete - ${searchResult.proteinGroups} protein groups identified`);

  await ctx.breakpoint({
    question: `Database search complete. ${searchResult.proteinGroups} proteins, ${searchResult.peptides} peptides identified. Review search results?`,
    title: 'Database Search Review',
    context: { runId: ctx.runId, searchStats: searchResult.statistics, files: searchResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: FDR Control
  const fdrResult = await ctx.task(fdrControlTask, { projectName, searchResults: searchResult.results, fdrThreshold, outputDir });
  artifacts.push(...fdrResult.artifacts);

  // Phase 4: Quantification
  const quantResult = await ctx.task(proteinQuantificationTask, { projectName, identifications: fdrResult.filteredResults, quantMethod, outputDir });
  artifacts.push(...quantResult.artifacts);

  // Phase 5: Normalization and Imputation
  const normResult = await ctx.task(quantNormalizationTask, { projectName, quantMatrix: quantResult.quantMatrix, outputDir });
  artifacts.push(...normResult.artifacts);

  // Phase 6: Differential Abundance Analysis
  const deResult = await ctx.task(differentialAbundanceTask, { projectName, normalizedMatrix: normResult.normalizedMatrix, outputDir });
  artifacts.push(...deResult.artifacts);

  await ctx.breakpoint({
    question: `Differential analysis complete. ${deResult.significantProteins} significant proteins. Review DE results?`,
    title: 'Differential Analysis Review',
    context: { runId: ctx.runId, deStats: deResult.statistics, topProteins: deResult.topProteins, files: deResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 7: PTM Identification
  const ptmResult = await ctx.task(ptmIdentificationTask, { projectName, searchResults: searchResult.results, enrichedModifications, outputDir });
  artifacts.push(...ptmResult.artifacts);

  // Phase 8: Protein Network Analysis
  const networkResult = await ctx.task(proteinNetworkTask, { projectName, deProteins: deResult.deProteins, outputDir });
  artifacts.push(...networkResult.artifacts);

  // Phase 9: Report Generation
  const reportResult = await ctx.task(generateProteomicsReportTask, { projectName, quantMethod, searchResult, fdrResult, quantResult, normResult, deResult, ptmResult, networkResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Proteomics Analysis Complete. ${fdrResult.proteinsFDR} proteins, ${deResult.significantProteins} DE proteins. Approve results?`,
    title: 'Proteomics Analysis Complete',
    context: { runId: ctx.runId, summary: { proteins: fdrResult.proteinsFDR, deProteins: deResult.significantProteins, ptmSites: ptmResult.totalSites }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    quantMethod,
    proteins: { total: fdrResult.proteinsFDR, quantified: quantResult.proteinsQuantified },
    deProteins: deResult.deProteins,
    ptmSites: ptmResult.sites,
    networkClusters: networkResult.clusters,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/ms-proteomics-pipeline', timestamp: startTime, database, quantMethod }
  };
}

// Task Definitions
export const rawFileProcessingTask = defineTask('raw-file-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Raw File Processing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MS Data Processing Specialist',
      task: 'Convert and process raw MS files',
      context: args,
      instructions: ['1. Convert raw files to open format (mzML)', '2. Perform peak picking and centroiding', '3. Extract MS1 and MS2 spectra', '4. Generate QC metrics per file', '5. Validate file integrity'],
      outputFormat: 'JSON object with processed files'
    },
    outputSchema: { type: 'object', required: ['success', 'msFiles', 'artifacts'], properties: { success: { type: 'boolean' }, msFiles: { type: 'array' }, qcMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'raw-processing']
}));

export const databaseSearchTask = defineTask('database-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Database Search - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Proteomics Search Specialist',
      task: 'Search MS/MS spectra against protein database',
      context: args,
      instructions: ['1. Configure search engine (MaxQuant/MSFragger)', '2. Set search parameters (enzyme, modifications)', '3. Perform database search', '4. Generate PSM identifications', '5. Calculate search statistics'],
      outputFormat: 'JSON object with search results'
    },
    outputSchema: { type: 'object', required: ['success', 'results', 'proteinGroups', 'peptides', 'statistics', 'artifacts'], properties: { success: { type: 'boolean' }, results: { type: 'string' }, proteinGroups: { type: 'number' }, peptides: { type: 'number' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'database-search']
}));

export const fdrControlTask = defineTask('fdr-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `FDR Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FDR Control Specialist',
      task: 'Apply FDR filtering to search results',
      context: args,
      instructions: ['1. Calculate FDR at PSM level', '2. Calculate FDR at peptide level', '3. Calculate FDR at protein level', '4. Apply FDR threshold filtering', '5. Generate FDR reports'],
      outputFormat: 'JSON object with FDR-filtered results'
    },
    outputSchema: { type: 'object', required: ['success', 'filteredResults', 'proteinsFDR', 'artifacts'], properties: { success: { type: 'boolean' }, filteredResults: { type: 'string' }, proteinsFDR: { type: 'number' }, peptidesFDR: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'fdr-control']
}));

export const proteinQuantificationTask = defineTask('protein-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protein Quantification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Proteomics Quantification Specialist',
      task: 'Quantify protein abundances',
      context: args,
      instructions: ['1. Apply quantification method (LFQ/TMT/SILAC)', '2. Aggregate peptide to protein level', '3. Generate protein intensity matrix', '4. Calculate quantification quality metrics', '5. Export quantification matrix'],
      outputFormat: 'JSON object with quantification results'
    },
    outputSchema: { type: 'object', required: ['success', 'quantMatrix', 'proteinsQuantified', 'artifacts'], properties: { success: { type: 'boolean' }, quantMatrix: { type: 'string' }, proteinsQuantified: { type: 'number' }, quantMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'quantification']
}));

export const quantNormalizationTask = defineTask('quant-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Normalization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Normalization Specialist',
      task: 'Normalize quantification data and handle missing values',
      context: args,
      instructions: ['1. Apply normalization (median, quantile)', '2. Assess missing value patterns', '3. Impute missing values (if appropriate)', '4. Generate normalization QC plots', '5. Export normalized matrix'],
      outputFormat: 'JSON object with normalized data'
    },
    outputSchema: { type: 'object', required: ['success', 'normalizedMatrix', 'artifacts'], properties: { success: { type: 'boolean' }, normalizedMatrix: { type: 'string' }, missingValuePercent: { type: 'number' }, normalizationMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'normalization']
}));

export const differentialAbundanceTask = defineTask('differential-abundance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Differential Abundance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Proteomics Specialist',
      task: 'Identify differentially abundant proteins',
      context: args,
      instructions: ['1. Set up statistical comparison', '2. Apply appropriate test (t-test, limma)', '3. Calculate fold changes', '4. Apply multiple testing correction', '5. Generate volcano plots'],
      outputFormat: 'JSON object with DE results'
    },
    outputSchema: { type: 'object', required: ['success', 'deProteins', 'significantProteins', 'statistics', 'topProteins', 'artifacts'], properties: { success: { type: 'boolean' }, deProteins: { type: 'array' }, significantProteins: { type: 'number' }, statistics: { type: 'object' }, topProteins: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'differential-abundance']
}));

export const ptmIdentificationTask = defineTask('ptm-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `PTM Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PTM Analysis Specialist',
      task: 'Identify and localize post-translational modifications',
      context: args,
      instructions: ['1. Search for specified modifications', '2. Apply PTM localization scoring', '3. Filter high-confidence PTM sites', '4. Quantify PTM site occupancy', '5. Generate PTM summary'],
      outputFormat: 'JSON object with PTM results'
    },
    outputSchema: { type: 'object', required: ['success', 'sites', 'totalSites', 'artifacts'], properties: { success: { type: 'boolean' }, sites: { type: 'array' }, totalSites: { type: 'number' }, modificationCounts: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'ptm-analysis']
}));

export const proteinNetworkTask = defineTask('protein-network', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protein Network Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Biology Specialist',
      task: 'Analyze protein-protein interaction networks',
      context: args,
      instructions: ['1. Map proteins to STRING database', '2. Build PPI network', '3. Identify network clusters', '4. Perform pathway enrichment', '5. Generate network visualizations'],
      outputFormat: 'JSON object with network results'
    },
    outputSchema: { type: 'object', required: ['success', 'clusters', 'artifacts'], properties: { success: { type: 'boolean' }, clusters: { type: 'array' }, enrichedPathways: { type: 'array' }, hubProteins: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'network-analysis']
}));

export const generateProteomicsReportTask = defineTask('generate-proteomics-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Proteomics Report Specialist',
      task: 'Generate comprehensive proteomics analysis report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present identification statistics', '3. Show quantification results', '4. Include DE analysis', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'proteomics', 'report-generation']
}));
