/**
 * @process specializations/domains/science/bioinformatics/long-read-analysis
 * @description Long-Read Sequencing Analysis - Processing and analysis of Oxford Nanopore and PacBio
 * long-read sequencing data for genome assembly, structural variant detection, and methylation analysis.
 * @inputs { projectName: string, platform: string, dataFiles: array, analysisType?: string, outputDir?: string }
 * @outputs { success: boolean, assembly: object, structuralVariants: array, methylation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/long-read-analysis', {
 *   projectName: 'Long-Read Genome Assembly',
 *   platform: 'nanopore',
 *   dataFiles: ['/data/reads.fastq.gz'],
 *   analysisType: 'assembly'
 * });
 *
 * @references
 * - Minimap2: https://github.com/lh3/minimap2
 * - Flye: https://github.com/fenderglass/Flye
 * - Medaka: https://github.com/nanoporetech/medaka
 * - PEPPER-Margin-DeepVariant: https://github.com/kishwarshafin/pepper
 * - Sniffles: https://github.com/fritzsedlazeck/Sniffles
 * - Megalodon: https://github.com/nanoporetech/megalodon
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platform, // 'nanopore', 'pacbio-hifi', 'pacbio-clr'
    dataFiles,
    analysisType = 'comprehensive', // 'assembly', 'variant-calling', 'methylation', 'comprehensive'
    outputDir = 'longread-output',
    referenceGenome = null,
    haplotyping = true,
    targetRegions = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Long-Read Analysis for ${projectName}`);
  ctx.log('info', `Platform: ${platform}, Analysis: ${analysisType}, Files: ${dataFiles.length}`);

  // Phase 1: Data Quality Assessment
  const qcResult = await ctx.task(longreadQcTask, { projectName, platform, dataFiles, outputDir });
  artifacts.push(...qcResult.artifacts);

  ctx.log('info', `QC complete. ${qcResult.totalReads} reads, N50: ${qcResult.n50}, mean quality: ${qcResult.meanQuality}`);

  // Phase 2: Basecalling/Processing (if needed)
  const processingResult = await ctx.task(dataProcessingTask, { projectName, platform, dataFiles, qcResult, outputDir });
  artifacts.push(...processingResult.artifacts);

  await ctx.breakpoint({
    question: `Data processing complete. ${processingResult.processedReads} reads processed, ${processingResult.filteredReads} passed filters. Continue with analysis?`,
    title: 'Data Processing Review',
    context: { runId: ctx.runId, qcMetrics: qcResult.metrics, processingStats: processingResult.stats, files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Read Alignment (if reference provided)
  let alignmentResult = null;
  if (referenceGenome) {
    alignmentResult = await ctx.task(longreadAlignmentTask, { projectName, platform, processedReads: processingResult.outputPath, reference: referenceGenome, outputDir });
    artifacts.push(...alignmentResult.artifacts);
  }

  // Phase 4: De Novo Assembly (if assembly type)
  let assemblyResult = null;
  if (analysisType === 'assembly' || analysisType === 'comprehensive') {
    assemblyResult = await ctx.task(deNovoAssemblyTask, { projectName, platform, processedReads: processingResult.outputPath, outputDir });
    artifacts.push(...assemblyResult.artifacts);

    ctx.log('info', `Assembly complete. Contigs: ${assemblyResult.contigCount}, N50: ${assemblyResult.assemblyN50}`);
  }

  // Phase 5: Assembly Polishing
  let polishingResult = null;
  if (assemblyResult) {
    polishingResult = await ctx.task(assemblyPolishingTask, { projectName, platform, assembly: assemblyResult.assemblyPath, reads: processingResult.outputPath, outputDir });
    artifacts.push(...polishingResult.artifacts);
  }

  // Phase 6: Structural Variant Detection
  let svResult = null;
  if ((analysisType === 'variant-calling' || analysisType === 'comprehensive') && alignmentResult) {
    svResult = await ctx.task(structuralVariantTask, { projectName, alignment: alignmentResult.bamPath, reference: referenceGenome, outputDir });
    artifacts.push(...svResult.artifacts);

    ctx.log('info', `SV detection complete. ${svResult.totalSVs} SVs identified`);
  }

  // Phase 7: SNV/Indel Calling
  let snvResult = null;
  if ((analysisType === 'variant-calling' || analysisType === 'comprehensive') && alignmentResult) {
    snvResult = await ctx.task(snvIndelCallingTask, { projectName, platform, alignment: alignmentResult.bamPath, reference: referenceGenome, outputDir });
    artifacts.push(...snvResult.artifacts);
  }

  // Phase 8: Haplotype Phasing
  let phasingResult = null;
  if (haplotyping && (svResult || snvResult)) {
    phasingResult = await ctx.task(haplotypePhasingTask, { projectName, alignment: alignmentResult?.bamPath, variants: { sv: svResult, snv: snvResult }, reference: referenceGenome, outputDir });
    artifacts.push(...phasingResult.artifacts);
  }

  // Phase 9: Methylation Analysis
  let methylationResult = null;
  if ((analysisType === 'methylation' || analysisType === 'comprehensive') && platform === 'nanopore') {
    methylationResult = await ctx.task(methylationAnalysisTask, { projectName, dataFiles, alignment: alignmentResult?.bamPath, reference: referenceGenome, outputDir });
    artifacts.push(...methylationResult.artifacts);

    ctx.log('info', `Methylation analysis complete. ${methylationResult.cpgSites} CpG sites analyzed`);
  }

  await ctx.breakpoint({
    question: `Analysis phases complete. Assembly: ${assemblyResult?.assemblyN50 || 'N/A'}, SVs: ${svResult?.totalSVs || 'N/A'}, Methylation sites: ${methylationResult?.cpgSites || 'N/A'}. Review results?`,
    title: 'Long-Read Analysis Review',
    context: { runId: ctx.runId, summary: { assembly: assemblyResult?.stats, svCount: svResult?.totalSVs, methylation: methylationResult?.summary }, files: [...(assemblyResult?.artifacts || []), ...(svResult?.artifacts || [])].map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 10: Assembly Quality Assessment
  let assemblyQaResult = null;
  if (assemblyResult) {
    assemblyQaResult = await ctx.task(assemblyQualityTask, { projectName, assembly: polishingResult?.polishedPath || assemblyResult.assemblyPath, reference: referenceGenome, outputDir });
    artifacts.push(...assemblyQaResult.artifacts);
  }

  // Phase 11: Report Generation
  const reportResult = await ctx.task(generateLongreadReportTask, { projectName, platform, qcResult, assemblyResult, polishingResult, svResult, snvResult, phasingResult, methylationResult, assemblyQaResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Long-Read Analysis Complete. Platform: ${platform}, Analysis: ${analysisType}. Approve final report?`,
    title: 'Long-Read Analysis Complete',
    context: { runId: ctx.runId, summary: { platform, analysisType, readsProcessed: processingResult.processedReads, assemblyN50: assemblyResult?.assemblyN50, totalSVs: svResult?.totalSVs }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Analysis Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    platform,
    analysisType,
    qcMetrics: qcResult.metrics,
    assembly: assemblyResult ? {
      path: polishingResult?.polishedPath || assemblyResult.assemblyPath,
      n50: assemblyResult.assemblyN50,
      contigs: assemblyResult.contigCount,
      quality: assemblyQaResult?.quality
    } : null,
    structuralVariants: svResult?.variants || [],
    snvIndels: snvResult?.variants || [],
    phasing: phasingResult?.phasedBlocks || null,
    methylation: methylationResult ? {
      cpgSites: methylationResult.cpgSites,
      meanMethylation: methylationResult.meanMethylation
    } : null,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/long-read-analysis', timestamp: startTime, platform, analysisType }
  };
}

// Task Definitions
export const longreadQcTask = defineTask('longread-qc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Long-Read QC - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-Read QC Specialist',
      task: 'Perform quality control on long-read data',
      context: args,
      instructions: ['1. Calculate read length distribution', '2. Assess base quality scores', '3. Compute N50 and mean length', '4. Identify adapter sequences', '5. Generate QC report with NanoPlot/LongQC'],
      outputFormat: 'JSON object with QC metrics'
    },
    outputSchema: { type: 'object', required: ['success', 'totalReads', 'n50', 'meanQuality', 'metrics', 'artifacts'], properties: { success: { type: 'boolean' }, totalReads: { type: 'number' }, n50: { type: 'number' }, meanLength: { type: 'number' }, meanQuality: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'quality-control']
}));

export const dataProcessingTask = defineTask('data-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Processing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-Read Processing Specialist',
      task: 'Process and filter long-read data',
      context: args,
      instructions: ['1. Apply quality filters', '2. Remove adapters', '3. Filter by length', '4. Split/merge files as needed', '5. Generate processed FASTQ'],
      outputFormat: 'JSON object with processed data'
    },
    outputSchema: { type: 'object', required: ['success', 'outputPath', 'processedReads', 'filteredReads', 'stats', 'artifacts'], properties: { success: { type: 'boolean' }, outputPath: { type: 'string' }, processedReads: { type: 'number' }, filteredReads: { type: 'number' }, stats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'processing']
}));

export const longreadAlignmentTask = defineTask('longread-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Long-Read Alignment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-Read Alignment Specialist',
      task: 'Align long reads to reference genome',
      context: args,
      instructions: ['1. Configure Minimap2 for platform', '2. Perform alignment', '3. Sort and index BAM', '4. Calculate alignment statistics', '5. Generate alignment report'],
      outputFormat: 'JSON object with alignment results'
    },
    outputSchema: { type: 'object', required: ['success', 'bamPath', 'alignmentRate', 'artifacts'], properties: { success: { type: 'boolean' }, bamPath: { type: 'string' }, alignmentRate: { type: 'number' }, meanCoverage: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'alignment']
}));

export const deNovoAssemblyTask = defineTask('de-novo-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `De Novo Assembly - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Genome Assembly Specialist',
      task: 'Perform de novo genome assembly',
      context: args,
      instructions: ['1. Select assembler (Flye/Canu/Hifiasm)', '2. Configure assembly parameters', '3. Run assembly', '4. Assess initial assembly quality', '5. Generate assembly statistics'],
      outputFormat: 'JSON object with assembly results'
    },
    outputSchema: { type: 'object', required: ['success', 'assemblyPath', 'contigCount', 'assemblyN50', 'stats', 'artifacts'], properties: { success: { type: 'boolean' }, assemblyPath: { type: 'string' }, contigCount: { type: 'number' }, assemblyN50: { type: 'number' }, totalLength: { type: 'number' }, stats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'assembly']
}));

export const assemblyPolishingTask = defineTask('assembly-polishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assembly Polishing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assembly Polishing Specialist',
      task: 'Polish genome assembly',
      context: args,
      instructions: ['1. Run Medaka/PEPPER polishing', '2. Optionally add short-read polishing', '3. Assess quality improvement', '4. Compare pre/post polishing', '5. Generate polished assembly'],
      outputFormat: 'JSON object with polishing results'
    },
    outputSchema: { type: 'object', required: ['success', 'polishedPath', 'qualityImprovement', 'artifacts'], properties: { success: { type: 'boolean' }, polishedPath: { type: 'string' }, qualityImprovement: { type: 'number' }, rounds: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'polishing']
}));

export const structuralVariantTask = defineTask('structural-variant', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structural Variant Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Variant Detection Specialist',
      task: 'Detect structural variants from long reads',
      context: args,
      instructions: ['1. Run Sniffles/cuteSV', '2. Filter by quality and support', '3. Annotate SVs', '4. Classify SV types', '5. Generate SV report'],
      outputFormat: 'JSON object with SV results'
    },
    outputSchema: { type: 'object', required: ['success', 'vcfPath', 'totalSVs', 'variants', 'artifacts'], properties: { success: { type: 'boolean' }, vcfPath: { type: 'string' }, totalSVs: { type: 'number' }, variants: { type: 'array' }, svTypes: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'structural-variants']
}));

export const snvIndelCallingTask = defineTask('snv-indel-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: `SNV/Indel Calling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-Read Variant Calling Specialist',
      task: 'Call SNVs and indels from long reads',
      context: args,
      instructions: ['1. Run PEPPER-Margin-DeepVariant or Clair3', '2. Apply variant filters', '3. Annotate variants', '4. Calculate variant statistics', '5. Generate variant report'],
      outputFormat: 'JSON object with variant results'
    },
    outputSchema: { type: 'object', required: ['success', 'vcfPath', 'totalVariants', 'variants', 'artifacts'], properties: { success: { type: 'boolean' }, vcfPath: { type: 'string' }, totalVariants: { type: 'number' }, snvCount: { type: 'number' }, indelCount: { type: 'number' }, variants: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'variant-calling']
}));

export const haplotypePhasingTask = defineTask('haplotype-phasing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Haplotype Phasing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Haplotype Phasing Specialist',
      task: 'Phase variants into haplotypes',
      context: args,
      instructions: ['1. Run WhatsHap/margin', '2. Generate phased VCF', '3. Create haplotagged BAM', '4. Calculate phase block statistics', '5. Generate phasing report'],
      outputFormat: 'JSON object with phasing results'
    },
    outputSchema: { type: 'object', required: ['success', 'phasedVcf', 'phasedBlocks', 'artifacts'], properties: { success: { type: 'boolean' }, phasedVcf: { type: 'string' }, phasedBlocks: { type: 'number' }, n50PhaseBlock: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'phasing']
}));

export const methylationAnalysisTask = defineTask('methylation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Methylation Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Methylation Analysis Specialist',
      task: 'Analyze DNA methylation from Nanopore data',
      context: args,
      instructions: ['1. Run Megalodon/modkit', '2. Call CpG methylation', '3. Calculate methylation frequencies', '4. Identify DMRs', '5. Generate methylation report'],
      outputFormat: 'JSON object with methylation results'
    },
    outputSchema: { type: 'object', required: ['success', 'methylationPath', 'cpgSites', 'meanMethylation', 'summary', 'artifacts'], properties: { success: { type: 'boolean' }, methylationPath: { type: 'string' }, cpgSites: { type: 'number' }, meanMethylation: { type: 'number' }, dmrCount: { type: 'number' }, summary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'methylation']
}));

export const assemblyQualityTask = defineTask('assembly-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assembly Quality Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assembly Quality Assessment Specialist',
      task: 'Assess assembly quality',
      context: args,
      instructions: ['1. Run BUSCO completeness', '2. Calculate QUAST metrics', '3. Assess genome completeness', '4. Identify misassemblies', '5. Generate quality report'],
      outputFormat: 'JSON object with quality assessment'
    },
    outputSchema: { type: 'object', required: ['success', 'quality', 'buscoComplete', 'artifacts'], properties: { success: { type: 'boolean' }, quality: { type: 'object' }, buscoComplete: { type: 'number' }, misassemblies: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'quality-assessment']
}));

export const generateLongreadReportTask = defineTask('generate-longread-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-Read Report Specialist',
      task: 'Generate comprehensive long-read analysis report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present QC metrics', '3. Include assembly statistics', '4. Summarize variant findings', '5. Add methylation results'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'long-read', 'report-generation']
}));
