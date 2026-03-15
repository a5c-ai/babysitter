/**
 * @process specializations/domains/science/bioinformatics/16s-microbiome-analysis
 * @description 16S rRNA Microbiome Analysis - Analysis of 16S rRNA amplicon sequencing data for
 * microbial community profiling including taxonomic classification, diversity analysis, and
 * differential abundance testing.
 * @inputs { projectName: string, samples: array, metadata: object, region?: string, outputDir?: string }
 * @outputs { success: boolean, taxonomyProfiles: array, diversityMetrics: object, daTaxa: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/16s-microbiome-analysis', {
 *   projectName: 'Gut Microbiome Study',
 *   samples: [{ id: 'sample1', fastq: '/data/sample1.fastq.gz' }],
 *   metadata: { condition: ['treatment', 'control'] },
 *   region: 'V3-V4'
 * });
 *
 * @references
 * - QIIME2: https://qiime2.org/
 * - DADA2: https://benjjneb.github.io/dada2/
 * - SILVA Database: https://www.arb-silva.de/
 * - PICRUSt2: https://github.com/picrust/picrust2
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    samples = [],
    metadata = {},
    region = 'V3-V4', // 'V1-V3', 'V3-V4', 'V4', 'V4-V5'
    outputDir = 'microbiome-output',
    database = 'SILVA', // 'SILVA', 'Greengenes', 'RDP'
    denoiseMethod = 'DADA2', // 'DADA2', 'Deblur'
    alphaMetrics = ['shannon', 'observed_features', 'faith_pd'],
    betaMetrics = ['bray_curtis', 'weighted_unifrac', 'unweighted_unifrac']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting 16S Microbiome Analysis for ${projectName}`);
  ctx.log('info', `Samples: ${samples.length}, Region: ${region}, Database: ${database}`);

  // Phase 1: Quality Filtering and Denoising
  const qcResult = await ctx.task(qualityFilteringTask, { projectName, samples, region, outputDir });
  artifacts.push(...qcResult.artifacts);

  // Phase 2: ASV/OTU Generation
  const asvResult = await ctx.task(asvGenerationTask, { projectName, filteredReads: qcResult.filteredReads, denoiseMethod, outputDir });
  artifacts.push(...asvResult.artifacts);

  ctx.log('info', `Generated ${asvResult.totalASVs} ASVs from ${asvResult.samplesProcessed} samples`);

  await ctx.breakpoint({
    question: `ASV generation complete. ${asvResult.totalASVs} ASVs, ${asvResult.readsRetained}% reads retained. Review denoising results?`,
    title: 'ASV Generation Review',
    context: { runId: ctx.runId, asvStats: asvResult.statistics, files: asvResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Taxonomic Classification
  const taxonomyResult = await ctx.task(taxonomicClassificationTask, { projectName, asvTable: asvResult.asvTable, repSeqs: asvResult.repSeqs, database, outputDir });
  artifacts.push(...taxonomyResult.artifacts);

  // Phase 4: Phylogenetic Tree Construction
  const phylogenyResult = await ctx.task(phylogenyConstructionTask, { projectName, repSeqs: asvResult.repSeqs, outputDir });
  artifacts.push(...phylogenyResult.artifacts);

  // Phase 5: Alpha Diversity Analysis
  const alphaResult = await ctx.task(alphaDiversityTask, { projectName, asvTable: asvResult.asvTable, phylogeny: phylogenyResult.tree, metadata, alphaMetrics, outputDir });
  artifacts.push(...alphaResult.artifacts);

  // Phase 6: Beta Diversity Analysis
  const betaResult = await ctx.task(betaDiversityTask, { projectName, asvTable: asvResult.asvTable, phylogeny: phylogenyResult.tree, metadata, betaMetrics, outputDir });
  artifacts.push(...betaResult.artifacts);

  await ctx.breakpoint({
    question: `Diversity analysis complete. Significant group differences: ${betaResult.significantComparisons}. Review diversity results?`,
    title: 'Diversity Analysis Review',
    context: { runId: ctx.runId, alphaSummary: alphaResult.summary, betaSummary: betaResult.summary, files: [...alphaResult.artifacts, ...betaResult.artifacts].map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 7: Differential Abundance Testing
  const daResult = await ctx.task(differentialAbundanceTask, { projectName, asvTable: asvResult.asvTable, taxonomy: taxonomyResult.taxonomy, metadata, outputDir });
  artifacts.push(...daResult.artifacts);

  // Phase 8: Functional Prediction
  const functionalResult = await ctx.task(functionalPredictionTask, { projectName, asvTable: asvResult.asvTable, repSeqs: asvResult.repSeqs, outputDir });
  artifacts.push(...functionalResult.artifacts);

  // Phase 9: Visualization and Reporting
  const reportResult = await ctx.task(generateMicrobiomeReportTask, { projectName, qcResult, asvResult, taxonomyResult, alphaResult, betaResult, daResult, functionalResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Microbiome Analysis Complete. ${asvResult.totalASVs} ASVs, ${daResult.significantTaxa} differentially abundant taxa. Approve results?`,
    title: 'Microbiome Analysis Complete',
    context: { runId: ctx.runId, summary: { asvs: asvResult.totalASVs, daTaxa: daResult.significantTaxa, pathways: functionalResult.predictedPathways }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    region,
    database,
    taxonomyProfiles: taxonomyResult.profiles,
    diversityMetrics: { alpha: alphaResult.metrics, beta: betaResult.metrics },
    daTaxa: daResult.differentialTaxa,
    functionalPredictions: functionalResult.pathways,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/16s-microbiome-analysis', timestamp: startTime, region, database }
  };
}

// Task Definitions
export const qualityFilteringTask = defineTask('quality-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Filtering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Microbiome QC Specialist',
      task: 'Filter and quality control 16S reads',
      context: args,
      instructions: ['1. Import sequences into QIIME2', '2. Perform quality assessment', '3. Trim primers and adapters', '4. Quality filter reads (Q>20)', '5. Generate QC summary'],
      outputFormat: 'JSON object with filtered reads'
    },
    outputSchema: { type: 'object', required: ['success', 'filteredReads', 'artifacts'], properties: { success: { type: 'boolean' }, filteredReads: { type: 'string' }, readsRetained: { type: 'number' }, qcStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'quality-control']
}));

export const asvGenerationTask = defineTask('asv-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `ASV Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ASV Analysis Specialist',
      task: 'Generate ASVs using DADA2 or Deblur',
      context: args,
      instructions: ['1. Denoise reads using selected method', '2. Generate ASV/feature table', '3. Generate representative sequences', '4. Calculate denoising statistics', '5. Export ASV table'],
      outputFormat: 'JSON object with ASV results'
    },
    outputSchema: { type: 'object', required: ['success', 'asvTable', 'repSeqs', 'totalASVs', 'samplesProcessed', 'readsRetained', 'statistics', 'artifacts'], properties: { success: { type: 'boolean' }, asvTable: { type: 'string' }, repSeqs: { type: 'string' }, totalASVs: { type: 'number' }, samplesProcessed: { type: 'number' }, readsRetained: { type: 'number' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'asv-generation']
}));

export const taxonomicClassificationTask = defineTask('taxonomic-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Taxonomic Classification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Taxonomic Classification Specialist',
      task: 'Classify ASVs taxonomically',
      context: args,
      instructions: ['1. Train or load classifier', '2. Classify ASVs against reference database', '3. Generate taxonomy table', '4. Calculate classification confidence', '5. Create taxonomic barplots'],
      outputFormat: 'JSON object with taxonomy results'
    },
    outputSchema: { type: 'object', required: ['success', 'taxonomy', 'profiles', 'artifacts'], properties: { success: { type: 'boolean' }, taxonomy: { type: 'string' }, profiles: { type: 'array' }, classificationStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'taxonomy']
}));

export const phylogenyConstructionTask = defineTask('phylogeny-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phylogeny Construction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Phylogenetic Analysis Specialist',
      task: 'Construct phylogenetic tree',
      context: args,
      instructions: ['1. Align representative sequences', '2. Mask alignment', '3. Build phylogenetic tree (FastTree)', '4. Root tree at midpoint', '5. Validate tree topology'],
      outputFormat: 'JSON object with phylogeny'
    },
    outputSchema: { type: 'object', required: ['success', 'tree', 'artifacts'], properties: { success: { type: 'boolean' }, tree: { type: 'string' }, alignmentStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'phylogeny']
}));

export const alphaDiversityTask = defineTask('alpha-diversity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alpha Diversity - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alpha Diversity Specialist',
      task: 'Calculate alpha diversity metrics',
      context: args,
      instructions: ['1. Rarefy samples to even depth', '2. Calculate diversity metrics', '3. Generate rarefaction curves', '4. Perform statistical comparisons', '5. Create diversity boxplots'],
      outputFormat: 'JSON object with alpha diversity'
    },
    outputSchema: { type: 'object', required: ['success', 'metrics', 'summary', 'artifacts'], properties: { success: { type: 'boolean' }, metrics: { type: 'object' }, summary: { type: 'object' }, statisticalTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'alpha-diversity']
}));

export const betaDiversityTask = defineTask('beta-diversity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Beta Diversity - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Beta Diversity Specialist',
      task: 'Calculate beta diversity and ordination',
      context: args,
      instructions: ['1. Calculate distance matrices', '2. Perform PCoA ordination', '3. Run PERMANOVA tests', '4. Calculate dispersion', '5. Generate ordination plots'],
      outputFormat: 'JSON object with beta diversity'
    },
    outputSchema: { type: 'object', required: ['success', 'metrics', 'summary', 'significantComparisons', 'artifacts'], properties: { success: { type: 'boolean' }, metrics: { type: 'object' }, summary: { type: 'object' }, significantComparisons: { type: 'number' }, permanovaResults: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'beta-diversity']
}));

export const differentialAbundanceTask = defineTask('differential-abundance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Differential Abundance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Differential Abundance Specialist',
      task: 'Identify differentially abundant taxa',
      context: args,
      instructions: ['1. Apply DA method (ANCOM-BC, ALDEx2, DESeq2)', '2. Calculate effect sizes', '3. Apply multiple testing correction', '4. Filter significant taxa', '5. Generate DA plots'],
      outputFormat: 'JSON object with DA results'
    },
    outputSchema: { type: 'object', required: ['success', 'differentialTaxa', 'significantTaxa', 'artifacts'], properties: { success: { type: 'boolean' }, differentialTaxa: { type: 'array' }, significantTaxa: { type: 'number' }, daMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'differential-abundance']
}));

export const functionalPredictionTask = defineTask('functional-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Functional Prediction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Prediction Specialist',
      task: 'Predict functional profiles using PICRUSt2',
      context: args,
      instructions: ['1. Run PICRUSt2 pipeline', '2. Predict metagenome', '3. Collapse to pathways (MetaCyc, KEGG)', '4. Calculate NSTI scores', '5. Test differential pathways'],
      outputFormat: 'JSON object with functional predictions'
    },
    outputSchema: { type: 'object', required: ['success', 'pathways', 'predictedPathways', 'artifacts'], properties: { success: { type: 'boolean' }, pathways: { type: 'array' }, predictedPathways: { type: 'number' }, nstiStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'functional-prediction']
}));

export const generateMicrobiomeReportTask = defineTask('generate-microbiome-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Microbiome Report Specialist',
      task: 'Generate comprehensive microbiome analysis report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present taxonomic composition', '3. Show diversity results', '4. Include DA analysis', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'microbiome', 'report-generation']
}));
