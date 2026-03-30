/**
 * @process specializations/domains/science/bioinformatics/spatial-transcriptomics
 * @description Spatial Transcriptomics Analysis - Analysis of spatially-resolved transcriptomics data
 * to understand gene expression patterns in tissue context. Integrates with histological imaging
 * for comprehensive tissue characterization.
 * @inputs { projectName: string, samples: array, platform?: string, histologyImages?: array, outputDir?: string }
 * @outputs { success: boolean, spatialDomains: array, svGenes: array, cellTypeDeconv: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/spatial-transcriptomics', {
 *   projectName: 'Tumor Microenvironment Study',
 *   samples: [{ id: 'sample1', dataPath: '/data/spatial' }],
 *   platform: 'Visium',
 *   histologyImages: ['/images/HE_sample1.tiff']
 * });
 *
 * @references
 * - Squidpy: https://squidpy.readthedocs.io/
 * - SpatialDE: https://github.com/Teichlab/SpatialDE
 * - STUtility: https://ludvigla.github.io/STUtility_web_site/
 * - Cell2location: https://cell2location.readthedocs.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    samples = [],
    platform = 'Visium', // 'Visium', 'Slide-seq', 'MERFISH', 'seqFISH'
    histologyImages = [],
    outputDir = 'spatial-output',
    scReferenceData = null,
    resolution = 1.0,
    minCounts = 500,
    nNeighbors = 6
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Spatial Transcriptomics Analysis for ${projectName}`);
  ctx.log('info', `Samples: ${samples.length}, Platform: ${platform}`);

  // Phase 1: Data Loading and Image Processing
  const loadingResult = await ctx.task(spatialDataLoadingTask, { projectName, samples, platform, histologyImages, outputDir });
  artifacts.push(...loadingResult.artifacts);

  // Phase 2: Quality Control
  const qcResult = await ctx.task(spatialQualityControlTask, { projectName, adata: loadingResult.adata, minCounts, outputDir });
  artifacts.push(...qcResult.artifacts);

  await ctx.breakpoint({
    question: `Spatial QC complete. ${qcResult.spotsRetained} spots retained. Review QC metrics?`,
    title: 'Spatial QC Review',
    context: { runId: ctx.runId, qcMetrics: qcResult.metrics, files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Normalization
  const normResult = await ctx.task(spatialNormalizationTask, { projectName, adata: qcResult.filteredAdata, outputDir });
  artifacts.push(...normResult.artifacts);

  // Phase 4: Spatial Clustering
  const clusteringResult = await ctx.task(spatialClusteringTask, { projectName, adata: normResult.normalizedAdata, resolution, nNeighbors, outputDir });
  artifacts.push(...clusteringResult.artifacts);

  // Phase 5: Spatially Variable Gene Detection
  const svgResult = await ctx.task(spatiallyVariableGenesTask, { projectName, adata: clusteringResult.clusteredAdata, outputDir });
  artifacts.push(...svgResult.artifacts);

  await ctx.breakpoint({
    question: `Identified ${svgResult.svgCount} spatially variable genes. Review SVG results?`,
    title: 'SVG Analysis Review',
    context: { runId: ctx.runId, topSVGs: svgResult.topGenes, files: svgResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 6: Cell Type Deconvolution
  const deconvResult = await ctx.task(cellTypeDeconvolutionTask, { projectName, adata: clusteringResult.clusteredAdata, scReferenceData, outputDir });
  artifacts.push(...deconvResult.artifacts);

  // Phase 7: Ligand-Receptor Spatial Mapping
  const lrResult = await ctx.task(ligandReceptorMappingTask, { projectName, adata: deconvResult.deconvolvedAdata, outputDir });
  artifacts.push(...lrResult.artifacts);

  // Phase 8: Histology Integration
  const histologyResult = await ctx.task(histologyIntegrationTask, { projectName, adata: deconvResult.deconvolvedAdata, histologyImages, outputDir });
  artifacts.push(...histologyResult.artifacts);

  // Phase 9: Report Generation
  const reportResult = await ctx.task(generateSpatialReportTask, { projectName, platform, qcResult, clusteringResult, svgResult, deconvResult, lrResult, histologyResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Spatial Transcriptomics Analysis Complete. ${clusteringResult.nDomains} spatial domains, ${svgResult.svgCount} SVGs. Approve results?`,
    title: 'Spatial Analysis Complete',
    context: { runId: ctx.runId, summary: { domains: clusteringResult.nDomains, svgs: svgResult.svgCount, cellTypes: deconvResult.cellTypesDeconvolved }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    platform,
    spotsAnalyzed: qcResult.spotsRetained,
    spatialDomains: clusteringResult.domains,
    svGenes: svgResult.topGenes,
    cellTypeDeconv: deconvResult.cellTypeProportions,
    ligandReceptorInteractions: lrResult.significantPairs,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/spatial-transcriptomics', timestamp: startTime, platform }
  };
}

// Task Definitions
export const spatialDataLoadingTask = defineTask('spatial-data-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spatial Data Loading - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Transcriptomics Data Specialist',
      task: 'Load spatial transcriptomics data and associated images',
      context: args,
      instructions: ['1. Load spatial data based on platform format', '2. Load tissue position coordinates', '3. Load H&E images if available', '4. Create spatial AnnData object', '5. Validate coordinate alignment', '6. Generate initial spatial plot'],
      outputFormat: 'JSON object with loaded data'
    },
    outputSchema: { type: 'object', required: ['success', 'adata', 'totalSpots', 'artifacts'], properties: { success: { type: 'boolean' }, adata: { type: 'string' }, totalSpots: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'data-loading']
}));

export const spatialQualityControlTask = defineTask('spatial-quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spatial QC - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial QC Specialist',
      task: 'Perform quality control on spatial data',
      context: args,
      instructions: ['1. Filter spots by minimum counts', '2. Calculate QC metrics per spot', '3. Identify tissue vs background spots', '4. Generate spatial QC plots', '5. Remove low-quality spots'],
      outputFormat: 'JSON object with QC results'
    },
    outputSchema: { type: 'object', required: ['success', 'filteredAdata', 'spotsRetained', 'metrics', 'artifacts'], properties: { success: { type: 'boolean' }, filteredAdata: { type: 'string' }, spotsRetained: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'quality-control']
}));

export const spatialNormalizationTask = defineTask('spatial-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spatial Normalization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Data Normalization Specialist',
      task: 'Normalize spatial transcriptomics data',
      context: args,
      instructions: ['1. Apply library size normalization', '2. Log-transform counts', '3. Identify highly variable genes', '4. Scale data for downstream analysis'],
      outputFormat: 'JSON object with normalization results'
    },
    outputSchema: { type: 'object', required: ['success', 'normalizedAdata', 'hvgCount', 'artifacts'], properties: { success: { type: 'boolean' }, normalizedAdata: { type: 'string' }, hvgCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'normalization']
}));

export const spatialClusteringTask = defineTask('spatial-clustering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spatial Clustering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Domain Identification Specialist',
      task: 'Identify spatial domains through clustering',
      context: args,
      instructions: ['1. Build spatial neighbor graph', '2. Perform Leiden clustering with spatial constraints', '3. Identify spatial domains', '4. Validate domain coherence', '5. Generate spatial domain plots'],
      outputFormat: 'JSON object with clustering results'
    },
    outputSchema: { type: 'object', required: ['success', 'clusteredAdata', 'nDomains', 'domains', 'artifacts'], properties: { success: { type: 'boolean' }, clusteredAdata: { type: 'string' }, nDomains: { type: 'number' }, domains: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'clustering']
}));

export const spatiallyVariableGenesTask = defineTask('spatially-variable-genes', (args, taskCtx) => ({
  kind: 'agent',
  title: `SVG Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Gene Expression Specialist',
      task: 'Identify spatially variable genes',
      context: args,
      instructions: ['1. Run SpatialDE or Moran\'s I test', '2. Identify genes with spatial patterns', '3. Cluster genes by expression pattern', '4. Generate spatial gene expression plots', '5. Export SVG results'],
      outputFormat: 'JSON object with SVG results'
    },
    outputSchema: { type: 'object', required: ['success', 'svgCount', 'topGenes', 'artifacts'], properties: { success: { type: 'boolean' }, svgCount: { type: 'number' }, topGenes: { type: 'array' }, patternClusters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'spatially-variable-genes']
}));

export const cellTypeDeconvolutionTask = defineTask('cell-type-deconvolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cell Type Deconvolution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Deconvolution Specialist',
      task: 'Deconvolve cell types from spatial spots',
      context: args,
      instructions: ['1. Use Cell2location or RCTD for deconvolution', '2. Estimate cell type proportions per spot', '3. Map cell type distributions spatially', '4. Identify cell type niches', '5. Generate cell type composition plots'],
      outputFormat: 'JSON object with deconvolution results'
    },
    outputSchema: { type: 'object', required: ['success', 'deconvolvedAdata', 'cellTypesDeconvolved', 'cellTypeProportions', 'artifacts'], properties: { success: { type: 'boolean' }, deconvolvedAdata: { type: 'string' }, cellTypesDeconvolved: { type: 'number' }, cellTypeProportions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'deconvolution']
}));

export const ligandReceptorMappingTask = defineTask('ligand-receptor-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `L-R Spatial Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Interaction Specialist',
      task: 'Map ligand-receptor interactions spatially',
      context: args,
      instructions: ['1. Identify L-R pairs from database', '2. Calculate co-expression in neighboring spots', '3. Identify significant spatial interactions', '4. Generate L-R interaction maps', '5. Export interaction results'],
      outputFormat: 'JSON object with L-R mapping results'
    },
    outputSchema: { type: 'object', required: ['success', 'significantPairs', 'artifacts'], properties: { success: { type: 'boolean' }, significantPairs: { type: 'array' }, interactionNetworks: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'ligand-receptor']
}));

export const histologyIntegrationTask = defineTask('histology-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Histology Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Histopathology Integration Specialist',
      task: 'Integrate expression with histology images',
      context: args,
      instructions: ['1. Align expression data with H&E images', '2. Extract morphological features', '3. Correlate expression with histology', '4. Identify tissue landmarks', '5. Generate integrated visualizations'],
      outputFormat: 'JSON object with integration results'
    },
    outputSchema: { type: 'object', required: ['success', 'artifacts'], properties: { success: { type: 'boolean' }, morphologicalFeatures: { type: 'object' }, correlations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'histology']
}));

export const generateSpatialReportTask = defineTask('generate-spatial-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Spatial Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spatial Analysis Report Specialist',
      task: 'Generate comprehensive spatial transcriptomics report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present spatial domain maps', '3. Show SVG analysis results', '4. Include cell type deconvolution', '5. Document methods and generate figures'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'spatial-transcriptomics', 'report-generation']
}));
