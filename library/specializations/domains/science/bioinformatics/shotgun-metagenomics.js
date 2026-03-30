/**
 * @process specializations/domains/science/bioinformatics/shotgun-metagenomics
 * @description Shotgun Metagenomics Pipeline - Comprehensive analysis of shotgun metagenomic sequencing
 * data for taxonomic and functional profiling of microbial communities with strain-level resolution.
 * @inputs { projectName: string, samples: array, metadata: object, hostGenome?: string, outputDir?: string }
 * @outputs { success: boolean, taxonomyProfiles: array, functionalProfiles: array, amrGenes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/shotgun-metagenomics', {
 *   projectName: 'Environmental Microbiome Study',
 *   samples: [{ id: 'sample1', r1: '/data/sample1_R1.fq.gz', r2: '/data/sample1_R2.fq.gz' }],
 *   metadata: { environment: ['soil', 'water'] },
 *   hostGenome: 'GRCh38'
 * });
 *
 * @references
 * - MetaPhlAn4: https://github.com/biobakery/MetaPhlAn
 * - HUMAnN3: https://huttenhower.sph.harvard.edu/humann/
 * - Kraken2: https://ccb.jhu.edu/software/kraken2/
 * - MEGAHIT: https://github.com/voutcn/megahit
 * - CARD Database: https://card.mcmaster.ca/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    samples = [],
    metadata = {},
    hostGenome = null,
    outputDir = 'metagenomics-output',
    taxonomyTool = 'MetaPhlAn', // 'MetaPhlAn', 'Kraken2', 'mOTUs'
    functionalTool = 'HUMAnN', // 'HUMAnN', 'FMAP'
    performAssembly = true,
    performStrainProfiling = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Shotgun Metagenomics Analysis for ${projectName}`);
  ctx.log('info', `Samples: ${samples.length}, Taxonomy: ${taxonomyTool}, Functional: ${functionalTool}`);

  // Phase 1: QC and Host Decontamination
  const qcResult = await ctx.task(metagenomicsQcTask, { projectName, samples, hostGenome, outputDir });
  artifacts.push(...qcResult.artifacts);

  ctx.log('info', `QC complete. ${qcResult.readsRetained}% reads retained after host removal`);

  // Phase 2: Taxonomic Profiling
  const taxonomyResult = await ctx.task(taxonomicProfilingTask, { projectName, cleanReads: qcResult.cleanReads, taxonomyTool, outputDir });
  artifacts.push(...taxonomyResult.artifacts);

  await ctx.breakpoint({
    question: `Taxonomic profiling complete. ${taxonomyResult.speciesIdentified} species identified. Review taxonomy profiles?`,
    title: 'Taxonomic Profiling Review',
    context: { runId: ctx.runId, topSpecies: taxonomyResult.topSpecies, diversityStats: taxonomyResult.diversityStats, files: taxonomyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Metagenomic Assembly
  let assemblyResult = null;
  if (performAssembly) {
    assemblyResult = await ctx.task(metagenomeAssemblyTask, { projectName, cleanReads: qcResult.cleanReads, outputDir });
    artifacts.push(...assemblyResult.artifacts);
  }

  // Phase 4: Gene Prediction and Annotation
  const geneResult = await ctx.task(genePredictionTask, { projectName, contigs: assemblyResult?.contigs, cleanReads: qcResult.cleanReads, outputDir });
  artifacts.push(...geneResult.artifacts);

  // Phase 5: Functional Profiling
  const functionalResult = await ctx.task(functionalProfilingTask, { projectName, cleanReads: qcResult.cleanReads, genes: geneResult.genes, functionalTool, outputDir });
  artifacts.push(...functionalResult.artifacts);

  // Phase 6: AMR Gene Detection
  const amrResult = await ctx.task(amrDetectionTask, { projectName, cleanReads: qcResult.cleanReads, contigs: assemblyResult?.contigs, outputDir });
  artifacts.push(...amrResult.artifacts);

  await ctx.breakpoint({
    question: `AMR detection complete. ${amrResult.amrGenes.length} AMR genes identified. Review AMR results?`,
    title: 'AMR Detection Review',
    context: { runId: ctx.runId, amrGenes: amrResult.amrGenes, drugClasses: amrResult.drugClasses, files: amrResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 7: Strain-Level Analysis
  let strainResult = null;
  if (performStrainProfiling) {
    strainResult = await ctx.task(strainProfilingTask, { projectName, cleanReads: qcResult.cleanReads, taxonomyResult, outputDir });
    artifacts.push(...strainResult.artifacts);
  }

  // Phase 8: Metabolic Pathway Reconstruction
  const pathwayResult = await ctx.task(pathwayReconstructionTask, { projectName, functionalProfiles: functionalResult.profiles, outputDir });
  artifacts.push(...pathwayResult.artifacts);

  // Phase 9: Report Generation
  const reportResult = await ctx.task(generateMetagenomicsReportTask, { projectName, qcResult, taxonomyResult, assemblyResult, geneResult, functionalResult, amrResult, strainResult, pathwayResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Metagenomics Analysis Complete. ${taxonomyResult.speciesIdentified} species, ${functionalResult.pathwaysIdentified} pathways, ${amrResult.amrGenes.length} AMR genes. Approve results?`,
    title: 'Metagenomics Analysis Complete',
    context: { runId: ctx.runId, summary: { species: taxonomyResult.speciesIdentified, pathways: functionalResult.pathwaysIdentified, amrGenes: amrResult.amrGenes.length }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    taxonomyProfiles: taxonomyResult.profiles,
    functionalProfiles: functionalResult.profiles,
    amrGenes: amrResult.amrGenes,
    strainProfiles: strainResult?.strains || [],
    metabolicPathways: pathwayResult.pathways,
    assemblyStats: assemblyResult?.statistics || null,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/shotgun-metagenomics', timestamp: startTime, taxonomyTool, functionalTool }
  };
}

// Task Definitions
export const metagenomicsQcTask = defineTask('metagenomics-qc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metagenomics QC - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metagenomics QC Specialist',
      task: 'Quality control and host decontamination',
      context: args,
      instructions: ['1. Quality filter reads', '2. Remove host contamination with Bowtie2/KneadData', '3. Remove low-complexity sequences', '4. Generate QC statistics', '5. Export clean reads'],
      outputFormat: 'JSON object with QC results'
    },
    outputSchema: { type: 'object', required: ['success', 'cleanReads', 'readsRetained', 'artifacts'], properties: { success: { type: 'boolean' }, cleanReads: { type: 'array' }, readsRetained: { type: 'number' }, hostContamination: { type: 'number' }, qcStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'quality-control']
}));

export const taxonomicProfilingTask = defineTask('taxonomic-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Taxonomic Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Taxonomic Profiling Specialist',
      task: 'Profile microbial community composition',
      context: args,
      instructions: ['1. Run taxonomic profiler (MetaPhlAn/Kraken2)', '2. Generate species-level profiles', '3. Calculate relative abundances', '4. Identify top species', '5. Generate composition plots'],
      outputFormat: 'JSON object with taxonomy profiles'
    },
    outputSchema: { type: 'object', required: ['success', 'profiles', 'speciesIdentified', 'topSpecies', 'diversityStats', 'artifacts'], properties: { success: { type: 'boolean' }, profiles: { type: 'array' }, speciesIdentified: { type: 'number' }, topSpecies: { type: 'array' }, diversityStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'taxonomy']
}));

export const metagenomeAssemblyTask = defineTask('metagenome-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metagenomic Assembly - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metagenomic Assembly Specialist',
      task: 'Assemble metagenome from reads',
      context: args,
      instructions: ['1. Run MEGAHIT or metaSPAdes', '2. Filter contigs by length', '3. Calculate assembly statistics', '4. Bin contigs into MAGs', '5. Assess MAG quality'],
      outputFormat: 'JSON object with assembly results'
    },
    outputSchema: { type: 'object', required: ['success', 'contigs', 'statistics', 'artifacts'], properties: { success: { type: 'boolean' }, contigs: { type: 'string' }, statistics: { type: 'object' }, mags: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'assembly']
}));

export const genePredictionTask = defineTask('gene-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gene Prediction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gene Prediction Specialist',
      task: 'Predict and annotate genes',
      context: args,
      instructions: ['1. Predict genes using Prodigal', '2. Annotate genes against databases', '3. Cluster genes (CD-HIT)', '4. Generate gene catalog', '5. Calculate gene abundances'],
      outputFormat: 'JSON object with gene predictions'
    },
    outputSchema: { type: 'object', required: ['success', 'genes', 'artifacts'], properties: { success: { type: 'boolean' }, genes: { type: 'string' }, geneCatalog: { type: 'string' }, geneCount: { type: 'number' }, annotations: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'gene-prediction']
}));

export const functionalProfilingTask = defineTask('functional-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Functional Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Profiling Specialist',
      task: 'Profile functional potential',
      context: args,
      instructions: ['1. Run HUMAnN3 for pathway profiling', '2. Generate pathway abundances', '3. Map to KEGG/MetaCyc', '4. Calculate functional diversity', '5. Test differential pathways'],
      outputFormat: 'JSON object with functional profiles'
    },
    outputSchema: { type: 'object', required: ['success', 'profiles', 'pathwaysIdentified', 'artifacts'], properties: { success: { type: 'boolean' }, profiles: { type: 'array' }, pathwaysIdentified: { type: 'number' }, topPathways: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'functional-profiling']
}));

export const amrDetectionTask = defineTask('amr-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `AMR Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AMR Detection Specialist',
      task: 'Detect antimicrobial resistance genes',
      context: args,
      instructions: ['1. Search against CARD database', '2. Identify AMR genes and mutations', '3. Classify by drug class', '4. Calculate AMR gene abundances', '5. Generate AMR summary'],
      outputFormat: 'JSON object with AMR results'
    },
    outputSchema: { type: 'object', required: ['success', 'amrGenes', 'drugClasses', 'artifacts'], properties: { success: { type: 'boolean' }, amrGenes: { type: 'array' }, drugClasses: { type: 'object' }, resistanceMechanisms: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'amr-detection']
}));

export const strainProfilingTask = defineTask('strain-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strain Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strain Profiling Specialist',
      task: 'Perform strain-level analysis',
      context: args,
      instructions: ['1. Run StrainPhlAn or PanPhlAn', '2. Identify strain variants', '3. Build strain phylogeny', '4. Detect strain sharing', '5. Generate strain profiles'],
      outputFormat: 'JSON object with strain profiles'
    },
    outputSchema: { type: 'object', required: ['success', 'strains', 'artifacts'], properties: { success: { type: 'boolean' }, strains: { type: 'array' }, strainPhylogeny: { type: 'object' }, strainSharing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'strain-profiling']
}));

export const pathwayReconstructionTask = defineTask('pathway-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathway Reconstruction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metabolic Pathway Specialist',
      task: 'Reconstruct metabolic pathways',
      context: args,
      instructions: ['1. Map genes to metabolic pathways', '2. Reconstruct complete pathways', '3. Identify pathway gaps', '4. Calculate pathway completeness', '5. Compare pathway abundances'],
      outputFormat: 'JSON object with pathway reconstruction'
    },
    outputSchema: { type: 'object', required: ['success', 'pathways', 'artifacts'], properties: { success: { type: 'boolean' }, pathways: { type: 'array' }, pathwayCompleteness: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'pathway-reconstruction']
}));

export const generateMetagenomicsReportTask = defineTask('generate-metagenomics-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metagenomics Report Specialist',
      task: 'Generate comprehensive metagenomics report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present taxonomic composition', '3. Show functional profiles', '4. Include AMR analysis', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'metagenomics', 'report-generation']
}));
