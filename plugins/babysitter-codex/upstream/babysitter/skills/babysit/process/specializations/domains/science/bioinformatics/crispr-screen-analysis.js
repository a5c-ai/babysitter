/**
 * @process specializations/domains/science/bioinformatics/crispr-screen-analysis
 * @description CRISPR Screen Analysis - Analyzing pooled CRISPR knockout/activation/inhibition screens
 * for gene essentiality, synthetic lethality, and functional genomics applications.
 * @inputs { projectName: string, screenType: string, libraryInfo: object, sequencingFiles: array, outputDir?: string }
 * @outputs { success: boolean, hitGenes: array, qualityMetrics: object, pathwayEnrichment: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/crispr-screen-analysis', {
 *   projectName: 'Drug Resistance Screen',
 *   screenType: 'knockout',
 *   libraryInfo: { name: 'Brunello', guides: 76441 },
 *   sequencingFiles: ['/data/plasmid.fastq', '/data/t0.fastq', '/data/treatment.fastq']
 * });
 *
 * @references
 * - MAGeCK: https://sourceforge.net/p/mageck/wiki/Home/
 * - BAGEL2: https://github.com/hart-lab/bagel
 * - CRISPRcleanR: https://github.com/francescojm/CRISPRcleanR
 * - CRISPR-ScreenProcessing: https://github.com/mhegde/CRISPR-Analysis
 * - DepMap: https://depmap.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    screenType, // 'knockout', 'activation', 'inhibition', 'base-editing'
    libraryInfo,
    sequencingFiles,
    outputDir = 'crispr-screen-output',
    controlSamples = [],
    treatmentSamples = [],
    analysisMethod = 'mageck', // 'mageck', 'bagel', 'drugz', 'crispr-cleanr'
    fdrThreshold = 0.05,
    essentialGeneList = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CRISPR Screen Analysis for ${projectName}`);
  ctx.log('info', `Screen type: ${screenType}, Library: ${libraryInfo.name}, Method: ${analysisMethod}`);

  // Phase 1: Read Count Extraction
  const countResult = await ctx.task(readCountExtractionTask, { projectName, libraryInfo, sequencingFiles, outputDir });
  artifacts.push(...countResult.artifacts);

  ctx.log('info', `Count extraction complete. ${countResult.totalReads} total reads, ${countResult.mappedReads} mapped`);

  // Phase 2: Quality Control
  const qcResult = await ctx.task(screenQcTask, { projectName, countData: countResult.countMatrix, libraryInfo, outputDir });
  artifacts.push(...qcResult.artifacts);

  await ctx.breakpoint({
    question: `Screen QC complete. Mapping rate: ${qcResult.mappingRate}%, Library coverage: ${qcResult.libraryCoverage}%, Gini index: ${qcResult.giniIndex}. Review quality metrics?`,
    title: 'CRISPR Screen QC Review',
    context: { runId: ctx.runId, qcMetrics: qcResult.metrics, sampleCorrelations: qcResult.correlations, files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Count Normalization
  const normResult = await ctx.task(countNormalizationTask, { projectName, countData: countResult.countMatrix, qcResult, outputDir });
  artifacts.push(...normResult.artifacts);

  // Phase 4: Copy Number Correction (if applicable)
  let cnvResult = null;
  if (screenType === 'knockout') {
    cnvResult = await ctx.task(cnvCorrectionTask, { projectName, normalizedCounts: normResult.normalizedMatrix, cellLine: libraryInfo.cellLine, outputDir });
    artifacts.push(...cnvResult.artifacts);
  }

  // Phase 5: Hit Identification
  const hitResult = await ctx.task(hitIdentificationTask, {
    projectName,
    countData: cnvResult?.correctedMatrix || normResult.normalizedMatrix,
    controlSamples,
    treatmentSamples,
    analysisMethod,
    fdrThreshold,
    screenType,
    outputDir
  });
  artifacts.push(...hitResult.artifacts);

  ctx.log('info', `Hit identification complete. ${hitResult.significantGenes} significant genes at FDR < ${fdrThreshold}`);

  // Phase 6: Essential Gene Analysis
  let essentialResult = null;
  if (screenType === 'knockout' && essentialGeneList) {
    essentialResult = await ctx.task(essentialGeneAnalysisTask, { projectName, hitResults: hitResult, essentialGeneList, outputDir });
    artifacts.push(...essentialResult.artifacts);
  }

  // Phase 7: Guide-Level Analysis
  const guideResult = await ctx.task(guideLevelAnalysisTask, { projectName, countData: normResult.normalizedMatrix, hitResults: hitResult, libraryInfo, outputDir });
  artifacts.push(...guideResult.artifacts);

  await ctx.breakpoint({
    question: `Hit analysis complete. ${hitResult.significantGenes} hits identified. Top enriched: ${hitResult.topEnriched?.slice(0, 5).join(', ') || 'N/A'}. Top depleted: ${hitResult.topDepleted?.slice(0, 5).join(', ') || 'N/A'}. Review hit list?`,
    title: 'CRISPR Screen Hit Review',
    context: { runId: ctx.runId, hitSummary: hitResult.summary, topHits: { enriched: hitResult.topEnriched?.slice(0, 10), depleted: hitResult.topDepleted?.slice(0, 10) }, files: hitResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 8: Pathway Enrichment
  const pathwayResult = await ctx.task(pathwayEnrichmentTask, { projectName, hitGenes: hitResult.significantHits, screenType, outputDir });
  artifacts.push(...pathwayResult.artifacts);

  // Phase 9: Protein-Protein Interaction Analysis
  const ppiResult = await ctx.task(ppiAnalysisTask, { projectName, hitGenes: hitResult.significantHits, outputDir });
  artifacts.push(...ppiResult.artifacts);

  // Phase 10: Synthetic Lethality Analysis (if applicable)
  let synlethalResult = null;
  if (screenType === 'knockout' && treatmentSamples.length > 0) {
    synlethalResult = await ctx.task(syntheticLethalityTask, { projectName, hitResults: hitResult, treatmentContext: inputs.treatmentContext, outputDir });
    artifacts.push(...synlethalResult.artifacts);
  }

  // Phase 11: Visualization Generation
  const vizResult = await ctx.task(screenVisualizationTask, { projectName, countData: normResult.normalizedMatrix, hitResults: hitResult, qcResult, pathwayResult, outputDir });
  artifacts.push(...vizResult.artifacts);

  // Phase 12: Report Generation
  const reportResult = await ctx.task(generateScreenReportTask, { projectName, screenType, libraryInfo, qcResult, hitResult, guideResult, pathwayResult, ppiResult, synlethalResult, vizResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `CRISPR Screen Analysis Complete. ${hitResult.significantGenes} significant genes, ${pathwayResult.enrichedPathways} enriched pathways. Approve final report?`,
    title: 'CRISPR Screen Analysis Complete',
    context: { runId: ctx.runId, summary: { screenType, library: libraryInfo.name, significantGenes: hitResult.significantGenes, enrichedPathways: pathwayResult.enrichedPathways }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Screen Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    screenType,
    library: libraryInfo.name,
    hitGenes: hitResult.significantHits,
    qualityMetrics: {
      mappingRate: qcResult.mappingRate,
      libraryCoverage: qcResult.libraryCoverage,
      giniIndex: qcResult.giniIndex,
      sampleCorrelations: qcResult.correlations
    },
    hitSummary: {
      totalSignificant: hitResult.significantGenes,
      enriched: hitResult.enrichedCount,
      depleted: hitResult.depletedCount,
      topEnriched: hitResult.topEnriched,
      topDepleted: hitResult.topDepleted
    },
    pathwayEnrichment: pathwayResult.pathways,
    syntheticLethality: synlethalResult?.candidates || null,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/crispr-screen-analysis', timestamp: startTime, screenType, analysisMethod }
  };
}

// Task Definitions
export const readCountExtractionTask = defineTask('read-count-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read Count Extraction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CRISPR Screen Data Processing Specialist',
      task: 'Extract guide RNA read counts from sequencing data',
      context: args,
      instructions: ['1. Trim adapter sequences', '2. Map reads to library', '3. Count reads per guide', '4. Generate count matrix', '5. Calculate mapping statistics'],
      outputFormat: 'JSON object with count data'
    },
    outputSchema: { type: 'object', required: ['success', 'countMatrix', 'totalReads', 'mappedReads', 'artifacts'], properties: { success: { type: 'boolean' }, countMatrix: { type: 'string' }, totalReads: { type: 'number' }, mappedReads: { type: 'number' }, unmappedReads: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'count-extraction']
}));

export const screenQcTask = defineTask('screen-qc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Screen QC - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CRISPR Screen QC Specialist',
      task: 'Perform quality control on screen data',
      context: args,
      instructions: ['1. Calculate mapping rates', '2. Assess library coverage', '3. Compute Gini index', '4. Calculate sample correlations', '5. Generate QC report'],
      outputFormat: 'JSON object with QC metrics'
    },
    outputSchema: { type: 'object', required: ['success', 'mappingRate', 'libraryCoverage', 'giniIndex', 'correlations', 'metrics', 'artifacts'], properties: { success: { type: 'boolean' }, mappingRate: { type: 'number' }, libraryCoverage: { type: 'number' }, giniIndex: { type: 'number' }, correlations: { type: 'object' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'quality-control']
}));

export const countNormalizationTask = defineTask('count-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Count Normalization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Count Normalization Specialist',
      task: 'Normalize guide RNA counts',
      context: args,
      instructions: ['1. Apply median normalization', '2. Calculate size factors', '3. Log-transform counts', '4. Assess normalization quality', '5. Generate normalized matrix'],
      outputFormat: 'JSON object with normalized data'
    },
    outputSchema: { type: 'object', required: ['success', 'normalizedMatrix', 'artifacts'], properties: { success: { type: 'boolean' }, normalizedMatrix: { type: 'string' }, sizeFactors: { type: 'array' }, normalizationMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'normalization']
}));

export const cnvCorrectionTask = defineTask('cnv-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: `CNV Correction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Copy Number Correction Specialist',
      task: 'Correct for copy number variation effects',
      context: args,
      instructions: ['1. Load copy number data', '2. Apply CRISPRcleanR or similar', '3. Correct guide-level counts', '4. Assess correction impact', '5. Generate corrected matrix'],
      outputFormat: 'JSON object with CNV-corrected data'
    },
    outputSchema: { type: 'object', required: ['success', 'correctedMatrix', 'artifacts'], properties: { success: { type: 'boolean' }, correctedMatrix: { type: 'string' }, genesAffected: { type: 'number' }, correctionMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'cnv-correction']
}));

export const hitIdentificationTask = defineTask('hit-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hit Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CRISPR Hit Identification Specialist',
      task: 'Identify significant screen hits',
      context: args,
      instructions: ['1. Run MAGeCK/BAGEL analysis', '2. Calculate gene-level scores', '3. Apply FDR correction', '4. Identify enriched/depleted genes', '5. Generate hit list'],
      outputFormat: 'JSON object with hit results'
    },
    outputSchema: { type: 'object', required: ['success', 'significantHits', 'significantGenes', 'enrichedCount', 'depletedCount', 'topEnriched', 'topDepleted', 'summary', 'artifacts'], properties: { success: { type: 'boolean' }, significantHits: { type: 'array' }, significantGenes: { type: 'number' }, enrichedCount: { type: 'number' }, depletedCount: { type: 'number' }, topEnriched: { type: 'array' }, topDepleted: { type: 'array' }, summary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'hit-identification']
}));

export const essentialGeneAnalysisTask = defineTask('essential-gene-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Essential Gene Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Essential Gene Analysis Specialist',
      task: 'Analyze essential gene depletion',
      context: args,
      instructions: ['1. Compare to reference essential genes', '2. Calculate precision-recall', '3. Assess screen quality', '4. Identify context-specific essentials', '5. Generate essentiality report'],
      outputFormat: 'JSON object with essential gene analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'essentialGeneRecall', 'artifacts'], properties: { success: { type: 'boolean' }, essentialGeneRecall: { type: 'number' }, precision: { type: 'number' }, contextSpecificEssentials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'essential-genes']
}));

export const guideLevelAnalysisTask = defineTask('guide-level-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Guide-Level Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Guide-Level Analysis Specialist',
      task: 'Analyze individual guide performance',
      context: args,
      instructions: ['1. Assess guide concordance', '2. Identify outlier guides', '3. Calculate guide efficiency', '4. Detect potential off-targets', '5. Generate guide report'],
      outputFormat: 'JSON object with guide analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'guideMetrics', 'artifacts'], properties: { success: { type: 'boolean' }, guideMetrics: { type: 'object' }, outlierGuides: { type: 'array' }, concordanceScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'guide-analysis']
}));

export const pathwayEnrichmentTask = defineTask('pathway-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathway Enrichment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pathway Enrichment Specialist',
      task: 'Perform pathway enrichment analysis on hits',
      context: args,
      instructions: ['1. Run GO enrichment', '2. Perform KEGG analysis', '3. Analyze Reactome pathways', '4. Identify biological themes', '5. Generate enrichment report'],
      outputFormat: 'JSON object with pathway enrichment'
    },
    outputSchema: { type: 'object', required: ['success', 'pathways', 'enrichedPathways', 'artifacts'], properties: { success: { type: 'boolean' }, pathways: { type: 'array' }, enrichedPathways: { type: 'number' }, topPathways: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'pathway-enrichment']
}));

export const ppiAnalysisTask = defineTask('ppi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `PPI Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Protein Interaction Analysis Specialist',
      task: 'Analyze protein-protein interactions among hits',
      context: args,
      instructions: ['1. Query STRING database', '2. Build interaction network', '3. Identify hub genes', '4. Detect protein complexes', '5. Generate PPI report'],
      outputFormat: 'JSON object with PPI analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'interactions', 'hubGenes', 'artifacts'], properties: { success: { type: 'boolean' }, interactions: { type: 'array' }, hubGenes: { type: 'array' }, complexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'ppi-analysis']
}));

export const syntheticLethalityTask = defineTask('synthetic-lethality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthetic Lethality - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Synthetic Lethality Specialist',
      task: 'Identify synthetic lethal interactions',
      context: args,
      instructions: ['1. Compare treatment vs control', '2. Identify context-dependent hits', '3. Validate synthetic lethal pairs', '4. Check known SL databases', '5. Generate SL report'],
      outputFormat: 'JSON object with synthetic lethality results'
    },
    outputSchema: { type: 'object', required: ['success', 'candidates', 'artifacts'], properties: { success: { type: 'boolean' }, candidates: { type: 'array' }, knownSLPairs: { type: 'array' }, novelCandidates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'synthetic-lethality']
}));

export const screenVisualizationTask = defineTask('screen-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Screen Visualization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CRISPR Screen Visualization Specialist',
      task: 'Generate screen visualizations',
      context: args,
      instructions: ['1. Create volcano plots', '2. Generate rank plots', '3. Create QC heatmaps', '4. Plot pathway networks', '5. Generate figure panels'],
      outputFormat: 'JSON object with visualization paths'
    },
    outputSchema: { type: 'object', required: ['success', 'figures', 'artifacts'], properties: { success: { type: 'boolean' }, figures: { type: 'array' }, volcanoPlot: { type: 'string' }, rankPlot: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'visualization']
}));

export const generateScreenReportTask = defineTask('generate-screen-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CRISPR Screen Report Specialist',
      task: 'Generate comprehensive screen analysis report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present QC metrics', '3. List significant hits', '4. Summarize pathway analysis', '5. Provide recommendations'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, hitTablePath: { type: 'string' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'crispr-screen', 'report-generation']
}));
