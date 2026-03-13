/**
 * @process specializations/domains/science/bioinformatics/multi-omics-integration
 * @description Multi-Omics Data Integration - Integrative analysis combining genomics, transcriptomics,
 * proteomics, and metabolomics data to provide comprehensive biological insights and systems-level understanding.
 * @inputs { projectName: string, omicsData: object, sampleMetadata: object, outputDir?: string }
 * @outputs { success: boolean, integratedClusters: array, pathwayAssociations: array, biomarkers: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/multi-omics-integration', {
 *   projectName: 'Cancer Multi-Omics Study',
 *   omicsData: {
 *     genomics: '/data/mutations.vcf',
 *     transcriptomics: '/data/expression.tsv',
 *     proteomics: '/data/proteins.tsv',
 *     metabolomics: '/data/metabolites.tsv'
 *   },
 *   sampleMetadata: { conditions: ['tumor', 'normal'] }
 * });
 *
 * @references
 * - MOFA+: https://biofam.github.io/MOFA2/
 * - mixOmics: http://mixomics.org/
 * - iCluster: https://www.mskcc.org/departments/epidemiology-biostatistics/biostatistics/icluster
 * - PathwayCommons: https://www.pathwaycommons.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    omicsData = {},
    sampleMetadata = {},
    outputDir = 'multiomics-output',
    integrationMethod = 'MOFA', // 'MOFA', 'DIABLO', 'iCluster', 'SNF'
    nFactors = 10,
    pathwayDatabases = ['Reactome', 'KEGG', 'WikiPathways']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Omics Integration for ${projectName}`);
  ctx.log('info', `Omics layers: ${Object.keys(omicsData).join(', ')}`);

  // Phase 1: Data Loading and Preprocessing
  const loadingResult = await ctx.task(multiOmicsLoadingTask, { projectName, omicsData, sampleMetadata, outputDir });
  artifacts.push(...loadingResult.artifacts);

  // Phase 2: Feature Harmonization
  const harmonizationResult = await ctx.task(featureHarmonizationTask, { projectName, omicsMatrices: loadingResult.matrices, outputDir });
  artifacts.push(...harmonizationResult.artifacts);

  await ctx.breakpoint({
    question: `Data harmonization complete. ${harmonizationResult.matchedSamples} matched samples across ${Object.keys(omicsData).length} omics layers. Proceed with integration?`,
    title: 'Data Harmonization Review',
    context: { runId: ctx.runId, harmonizationStats: harmonizationResult.statistics, files: harmonizationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Multi-Omics Factor Analysis
  const factorResult = await ctx.task(multiOmicsFactorAnalysisTask, { projectName, harmonizedData: harmonizationResult.harmonizedData, integrationMethod, nFactors, outputDir });
  artifacts.push(...factorResult.artifacts);

  // Phase 4: Integrative Clustering
  const clusteringResult = await ctx.task(integrativeClusteringTask, { projectName, factorData: factorResult.factors, sampleMetadata, outputDir });
  artifacts.push(...clusteringResult.artifacts);

  await ctx.breakpoint({
    question: `Integrative clustering identified ${clusteringResult.nClusters} patient subtypes. Review clustering results?`,
    title: 'Integrative Clustering Review',
    context: { runId: ctx.runId, clusters: clusteringResult.clusters, clusterStats: clusteringResult.statistics, files: clusteringResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 5: Pathway-Level Integration
  const pathwayResult = await ctx.task(pathwayIntegrationTask, { projectName, omicsMatrices: harmonizationResult.harmonizedData, pathwayDatabases, outputDir });
  artifacts.push(...pathwayResult.artifacts);

  // Phase 6: Cross-Omics Correlation
  const correlationResult = await ctx.task(crossOmicsCorrelationTask, { projectName, harmonizedData: harmonizationResult.harmonizedData, outputDir });
  artifacts.push(...correlationResult.artifacts);

  // Phase 7: Biomarker Discovery
  const biomarkerResult = await ctx.task(biomarkerDiscoveryTask, { projectName, factorData: factorResult.factors, clusteringResult, correlationResult, outputDir });
  artifacts.push(...biomarkerResult.artifacts);

  // Phase 8: Causal Inference
  const causalResult = await ctx.task(causalInferenceTask, { projectName, harmonizedData: harmonizationResult.harmonizedData, correlationResult, outputDir });
  artifacts.push(...causalResult.artifacts);

  // Phase 9: Report Generation
  const reportResult = await ctx.task(generateMultiOmicsReportTask, { projectName, loadingResult, harmonizationResult, factorResult, clusteringResult, pathwayResult, correlationResult, biomarkerResult, causalResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Multi-Omics Integration Complete. ${clusteringResult.nClusters} subtypes, ${biomarkerResult.biomarkers.length} biomarkers identified. Approve results?`,
    title: 'Multi-Omics Analysis Complete',
    context: { runId: ctx.runId, summary: { clusters: clusteringResult.nClusters, biomarkers: biomarkerResult.biomarkers.length, pathways: pathwayResult.significantPathways }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    omicsLayers: Object.keys(omicsData),
    integratedClusters: clusteringResult.clusters,
    pathwayAssociations: pathwayResult.topPathways,
    biomarkers: biomarkerResult.biomarkers,
    crossOmicsCorrelations: correlationResult.topCorrelations,
    causalRelationships: causalResult.relationships,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/multi-omics-integration', timestamp: startTime, integrationMethod }
  };
}

// Task Definitions
export const multiOmicsLoadingTask = defineTask('multiomics-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Multi-Omics Loading - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Multi-Omics Data Specialist',
      task: 'Load and preprocess multi-omics datasets',
      context: args,
      instructions: ['1. Load each omics data layer', '2. Apply layer-specific preprocessing', '3. Filter low-quality features', '4. Normalize within each layer', '5. Generate loading summary'],
      outputFormat: 'JSON object with loaded matrices'
    },
    outputSchema: { type: 'object', required: ['success', 'matrices', 'artifacts'], properties: { success: { type: 'boolean' }, matrices: { type: 'object' }, layerSummary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'data-loading']
}));

export const featureHarmonizationTask = defineTask('feature-harmonization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feature Harmonization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Harmonization Specialist',
      task: 'Harmonize features across omics layers',
      context: args,
      instructions: ['1. Match samples across omics layers', '2. Map features to common identifiers', '3. Handle missing samples/features', '4. Scale features appropriately', '5. Validate harmonization'],
      outputFormat: 'JSON object with harmonized data'
    },
    outputSchema: { type: 'object', required: ['success', 'harmonizedData', 'matchedSamples', 'statistics', 'artifacts'], properties: { success: { type: 'boolean' }, harmonizedData: { type: 'object' }, matchedSamples: { type: 'number' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'harmonization']
}));

export const multiOmicsFactorAnalysisTask = defineTask('multiomics-factor-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Factor Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Multi-Omics Integration Specialist',
      task: 'Perform multi-omics factor analysis',
      context: args,
      instructions: ['1. Configure integration method (MOFA/DIABLO)', '2. Train factor model', '3. Extract latent factors', '4. Calculate factor weights per omics layer', '5. Identify top contributing features'],
      outputFormat: 'JSON object with factor analysis results'
    },
    outputSchema: { type: 'object', required: ['success', 'factors', 'weights', 'artifacts'], properties: { success: { type: 'boolean' }, factors: { type: 'object' }, weights: { type: 'object' }, varianceExplained: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'factor-analysis']
}));

export const integrativeClusteringTask = defineTask('integrative-clustering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrative Clustering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Patient Stratification Specialist',
      task: 'Perform integrative clustering for patient stratification',
      context: args,
      instructions: ['1. Cluster samples using integrated factors', '2. Determine optimal cluster number', '3. Characterize cluster phenotypes', '4. Assess cluster stability', '5. Generate cluster visualizations'],
      outputFormat: 'JSON object with clustering results'
    },
    outputSchema: { type: 'object', required: ['success', 'clusters', 'nClusters', 'statistics', 'artifacts'], properties: { success: { type: 'boolean' }, clusters: { type: 'array' }, nClusters: { type: 'number' }, statistics: { type: 'object' }, clusterAssignments: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'clustering']
}));

export const pathwayIntegrationTask = defineTask('pathway-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathway Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pathway Analysis Specialist',
      task: 'Integrate multi-omics data at pathway level',
      context: args,
      instructions: ['1. Map features to pathway databases', '2. Calculate pathway activity scores', '3. Identify dysregulated pathways', '4. Correlate pathway activities across omics', '5. Generate pathway integration summary'],
      outputFormat: 'JSON object with pathway integration results'
    },
    outputSchema: { type: 'object', required: ['success', 'topPathways', 'significantPathways', 'artifacts'], properties: { success: { type: 'boolean' }, topPathways: { type: 'array' }, significantPathways: { type: 'number' }, pathwayScores: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'pathway-integration']
}));

export const crossOmicsCorrelationTask = defineTask('cross-omics-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Omics Correlation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Correlation Analysis Specialist',
      task: 'Analyze correlations across omics layers',
      context: args,
      instructions: ['1. Calculate pairwise correlations across layers', '2. Build correlation networks', '3. Identify significant cross-omics associations', '4. Detect regulatory relationships', '5. Generate correlation heatmaps'],
      outputFormat: 'JSON object with correlation results'
    },
    outputSchema: { type: 'object', required: ['success', 'topCorrelations', 'artifacts'], properties: { success: { type: 'boolean' }, topCorrelations: { type: 'array' }, correlationNetwork: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'correlation']
}));

export const biomarkerDiscoveryTask = defineTask('biomarker-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Biomarker Discovery - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomarker Discovery Specialist',
      task: 'Identify multi-omics biomarker panels',
      context: args,
      instructions: ['1. Select features discriminating clusters', '2. Build multi-omics biomarker panels', '3. Evaluate biomarker performance', '4. Validate with cross-validation', '5. Generate biomarker summary'],
      outputFormat: 'JSON object with biomarker results'
    },
    outputSchema: { type: 'object', required: ['success', 'biomarkers', 'artifacts'], properties: { success: { type: 'boolean' }, biomarkers: { type: 'array' }, panelPerformance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'biomarker-discovery']
}));

export const causalInferenceTask = defineTask('causal-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Causal Inference - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Causal Inference Specialist',
      task: 'Infer causal relationships across omics layers',
      context: args,
      instructions: ['1. Apply causal inference methods', '2. Identify regulatory cascades', '3. Validate with Mendelian randomization', '4. Build causal networks', '5. Generate causal relationship summary'],
      outputFormat: 'JSON object with causal inference results'
    },
    outputSchema: { type: 'object', required: ['success', 'relationships', 'artifacts'], properties: { success: { type: 'boolean' }, relationships: { type: 'array' }, causalNetwork: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'causal-inference']
}));

export const generateMultiOmicsReportTask = defineTask('generate-multiomics-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Multi-Omics Report Specialist',
      task: 'Generate comprehensive multi-omics integration report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present integration results', '3. Show clustering and stratification', '4. Include pathway analysis', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'multi-omics', 'report-generation']
}));
