/**
 * @process specializations/domains/science/bioinformatics/rnaseq-differential-expression
 * @description RNA-seq Differential Expression Analysis - Comprehensive RNA-seq analysis workflow
 * for identifying differentially expressed genes between experimental conditions. Includes
 * normalization, statistical modeling, and pathway enrichment.
 * @inputs { projectName: string, samples: array, conditions: object, referenceGenome?: string, outputDir?: string }
 * @outputs { success: boolean, deGenes: array, pathways: array, qcMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/rnaseq-differential-expression', {
 *   projectName: 'Drug Treatment Study',
 *   samples: [{ id: 'S1', condition: 'treatment' }, { id: 'S2', condition: 'control' }],
 *   conditions: { treatment: 'Drug_A', control: 'Vehicle' },
 *   referenceGenome: 'GRCh38'
 * });
 *
 * @references
 * - DESeq2: https://bioconductor.org/packages/DESeq2/
 * - edgeR: https://bioconductor.org/packages/edgeR/
 * - STAR Aligner: https://github.com/alexdobin/STAR
 * - Salmon: https://combine-lab.github.io/salmon/
 * - clusterProfiler: https://bioconductor.org/packages/clusterProfiler/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    samples = [],
    conditions = {},
    referenceGenome = 'GRCh38',
    annotation = 'GENCODE',
    outputDir = 'rnaseq-output',
    alignmentMethod = 'STAR', // 'STAR', 'HISAT2', 'salmon'
    deMethod = 'DESeq2', // 'DESeq2', 'edgeR', 'limma-voom'
    pValueThreshold = 0.05,
    log2FCThreshold = 1.0,
    batchCorrection = true,
    pathwayDatabases = ['GO', 'KEGG', 'Reactome', 'MSigDB']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const deGenes = [];

  ctx.log('info', `Starting RNA-seq Differential Expression Analysis for ${projectName}`);
  ctx.log('info', `Samples: ${samples.length}, Conditions: ${Object.keys(conditions).join(' vs ')}`);

  // ============================================================================
  // PHASE 1: READ QUALITY CONTROL AND PREPROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Read Quality Control and Preprocessing');

  const qcResult = await ctx.task(readQualityControlTask, {
    projectName,
    samples,
    outputDir
  });

  artifacts.push(...qcResult.artifacts);

  ctx.log('info', `QC complete - ${qcResult.passedSamples.length}/${samples.length} samples passed quality filters`);

  // Quality Gate: Sample quality check
  if (qcResult.failedSamples.length > 0) {
    await ctx.breakpoint({
      question: `${qcResult.failedSamples.length} samples failed QC. Review quality metrics and decide whether to proceed?`,
      title: 'RNA-seq Quality Gate',
      context: {
        runId: ctx.runId,
        passedSamples: qcResult.passedSamples.length,
        failedSamples: qcResult.failedSamples,
        qcMetrics: qcResult.metrics,
        files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: READ ALIGNMENT / QUANTIFICATION
  // ============================================================================

  ctx.log('info', `Phase 2: Read Alignment/Quantification with ${alignmentMethod}`);

  const alignmentResult = await ctx.task(readAlignmentQuantificationTask, {
    projectName,
    samples: qcResult.passedSamples,
    referenceGenome,
    annotation,
    alignmentMethod,
    outputDir
  });

  artifacts.push(...alignmentResult.artifacts);

  ctx.log('info', `Alignment complete - Average mapping rate: ${alignmentResult.averageMappingRate}%`);

  // Breakpoint: Review alignment statistics
  await ctx.breakpoint({
    question: `Alignment/quantification complete. Average mapping rate: ${alignmentResult.averageMappingRate}%. Review alignment statistics?`,
    title: 'Alignment Statistics Review',
    context: {
      runId: ctx.runId,
      alignmentMethod,
      averageMappingRate: alignmentResult.averageMappingRate,
      totalGenes: alignmentResult.totalGenesQuantified,
      sampleStats: alignmentResult.sampleStatistics,
      files: alignmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: COUNT MATRIX GENERATION AND NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Count Matrix Generation and Normalization');

  const normalizationResult = await ctx.task(countNormalizationTask, {
    projectName,
    countMatrix: alignmentResult.countMatrix,
    samples: qcResult.passedSamples,
    conditions,
    deMethod,
    outputDir
  });

  artifacts.push(...normalizationResult.artifacts);

  ctx.log('info', `Normalization complete - ${normalizationResult.genesRetained} genes retained after filtering`);

  // ============================================================================
  // PHASE 4: BATCH EFFECT ASSESSMENT AND CORRECTION
  // ============================================================================

  let batchCorrectionResult = null;
  if (batchCorrection) {
    ctx.log('info', 'Phase 4: Batch Effect Assessment and Correction');

    batchCorrectionResult = await ctx.task(batchCorrectionTask, {
      projectName,
      normalizedCounts: normalizationResult.normalizedCounts,
      samples: qcResult.passedSamples,
      conditions,
      outputDir
    });

    artifacts.push(...batchCorrectionResult.artifacts);

    ctx.log('info', `Batch effect assessment complete - Batch effect detected: ${batchCorrectionResult.batchEffectDetected}`);

    // Breakpoint: Review batch effect
    if (batchCorrectionResult.batchEffectDetected) {
      await ctx.breakpoint({
        question: `Batch effect detected. Variance explained by batch: ${batchCorrectionResult.varianceExplained}%. Review batch correction results?`,
        title: 'Batch Effect Review',
        context: {
          runId: ctx.runId,
          batchEffectDetected: batchCorrectionResult.batchEffectDetected,
          varianceExplained: batchCorrectionResult.varianceExplained,
          correctionMethod: batchCorrectionResult.correctionMethod,
          files: batchCorrectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: EXPLORATORY DATA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Exploratory Data Analysis');

  const edaResult = await ctx.task(exploratoryAnalysisTask, {
    projectName,
    normalizedCounts: batchCorrectionResult?.correctedCounts || normalizationResult.normalizedCounts,
    samples: qcResult.passedSamples,
    conditions,
    outputDir
  });

  artifacts.push(...edaResult.artifacts);

  ctx.log('info', `EDA complete - PCA variance explained: ${edaResult.pcaVariance}%`);

  // ============================================================================
  // PHASE 6: DIFFERENTIAL EXPRESSION ANALYSIS
  // ============================================================================

  ctx.log('info', `Phase 6: Differential Expression Analysis with ${deMethod}`);

  const deResult = await ctx.task(differentialExpressionTask, {
    projectName,
    countMatrix: batchCorrectionResult?.correctedCounts || normalizationResult.normalizedCounts,
    samples: qcResult.passedSamples,
    conditions,
    deMethod,
    pValueThreshold,
    log2FCThreshold,
    outputDir
  });

  artifacts.push(...deResult.artifacts);
  deGenes.push(...deResult.deGenes);

  ctx.log('info', `DE analysis complete - ${deResult.significantGenes} significant genes (FDR < ${pValueThreshold}, |log2FC| > ${log2FCThreshold})`);

  // Breakpoint: Review DE results
  await ctx.breakpoint({
    question: `Differential expression analysis complete. ${deResult.upregulated} upregulated, ${deResult.downregulated} downregulated genes. Review results?`,
    title: 'Differential Expression Review',
    context: {
      runId: ctx.runId,
      significantGenes: deResult.significantGenes,
      upregulated: deResult.upregulated,
      downregulated: deResult.downregulated,
      topGenes: deResult.topGenes.slice(0, 20),
      files: deResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: GENE ONTOLOGY AND PATHWAY ENRICHMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Gene Ontology and Pathway Enrichment Analysis');

  const enrichmentResult = await ctx.task(pathwayEnrichmentTask, {
    projectName,
    deGenes: deResult.deGenes,
    upregulatedGenes: deResult.upregulatedGenes,
    downregulatedGenes: deResult.downregulatedGenes,
    pathwayDatabases,
    outputDir
  });

  artifacts.push(...enrichmentResult.artifacts);

  ctx.log('info', `Enrichment analysis complete - ${enrichmentResult.significantPathways} significant pathways identified`);

  // Breakpoint: Review pathway enrichment
  await ctx.breakpoint({
    question: `Pathway enrichment complete. ${enrichmentResult.significantPathways} significant pathways. Top pathways: ${enrichmentResult.topPathways.slice(0, 5).map(p => p.name).join(', ')}. Review enrichment results?`,
    title: 'Pathway Enrichment Review',
    context: {
      runId: ctx.runId,
      significantPathways: enrichmentResult.significantPathways,
      topPathways: enrichmentResult.topPathways.slice(0, 20),
      goTerms: enrichmentResult.goEnrichment,
      files: enrichmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: VISUALIZATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Visualizations and Report');

  const reportResult = await ctx.task(generateRNAseqReportTask, {
    projectName,
    conditions,
    qcResult,
    alignmentResult,
    normalizationResult,
    batchCorrectionResult,
    edaResult,
    deResult,
    enrichmentResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: Analysis complete
  await ctx.breakpoint({
    question: `RNA-seq Differential Expression Analysis Complete for ${projectName}. ${deResult.significantGenes} DE genes, ${enrichmentResult.significantPathways} enriched pathways. Approve final results?`,
    title: 'RNA-seq Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        samplesAnalyzed: qcResult.passedSamples.length,
        significantGenes: deResult.significantGenes,
        upregulated: deResult.upregulated,
        downregulated: deResult.downregulated,
        enrichedPathways: enrichmentResult.significantPathways
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Analysis Report' },
        { path: deResult.deTablePath, format: 'tsv', label: 'DE Results Table' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    conditions,
    samplesAnalyzed: qcResult.passedSamples.length,
    deGenes: deGenes.map(g => ({
      geneId: g.geneId,
      geneName: g.geneName,
      log2FoldChange: g.log2FoldChange,
      pValue: g.pValue,
      padj: g.padj,
      regulation: g.regulation
    })),
    deSummary: {
      totalSignificant: deResult.significantGenes,
      upregulated: deResult.upregulated,
      downregulated: deResult.downregulated,
      pValueThreshold,
      log2FCThreshold
    },
    pathways: enrichmentResult.topPathways.map(p => ({
      pathwayId: p.id,
      name: p.name,
      database: p.database,
      pValue: p.pValue,
      geneCount: p.geneCount
    })),
    qcMetrics: {
      averageMappingRate: alignmentResult.averageMappingRate,
      totalGenesQuantified: alignmentResult.totalGenesQuantified,
      genesRetainedAfterFiltering: normalizationResult.genesRetained,
      batchEffectCorrected: batchCorrectionResult?.batchEffectDetected || false
    },
    outputFiles: {
      report: reportResult.reportPath,
      deTable: deResult.deTablePath,
      normalizedCounts: normalizationResult.countsPath,
      enrichmentResults: enrichmentResult.enrichmentPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/bioinformatics/rnaseq-differential-expression',
      processSlug: 'rnaseq-differential-expression',
      category: 'bioinformatics',
      timestamp: startTime,
      alignmentMethod,
      deMethod,
      referenceGenome
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const readQualityControlTask = defineTask('read-quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read Quality Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RNA-seq Quality Control Specialist',
      task: 'Perform quality control on RNA-seq reads',
      context: {
        projectName: args.projectName,
        samples: args.samples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run FastQC on all FASTQ files',
        '2. Evaluate per-base sequence quality (Phred > 30)',
        '3. Check for adapter contamination',
        '4. Assess GC content and sequence duplication',
        '5. Check for rRNA contamination',
        '6. Perform adapter trimming with Trimmomatic/fastp',
        '7. Quality filter reads below threshold',
        '8. Generate MultiQC summary report',
        '9. Identify samples failing quality thresholds',
        '10. Create quality summary with pass/fail status'
      ],
      outputFormat: 'JSON object with QC results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passedSamples', 'failedSamples', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passedSamples: { type: 'array' },
        failedSamples: { type: 'array' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'quality-control']
}));

export const readAlignmentQuantificationTask = defineTask('read-alignment-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read Alignment/Quantification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RNA-seq Alignment Specialist',
      task: 'Align reads and quantify gene expression',
      context: {
        projectName: args.projectName,
        samples: args.samples,
        referenceGenome: args.referenceGenome,
        annotation: args.annotation,
        alignmentMethod: args.alignmentMethod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Based on alignment method:',
        '   - STAR: Align with 2-pass mode for splice junctions',
        '   - HISAT2: Align with splice-aware mode',
        '   - Salmon: Quasi-mapping for fast quantification',
        '2. Generate alignment QC metrics (mapping rate, uniquely mapped)',
        '3. Quantify gene/transcript expression:',
        '   - For STAR/HISAT2: Use featureCounts or HTSeq',
        '   - For Salmon: Use built-in quantification',
        '4. Generate count matrix (genes x samples)',
        '5. Calculate TPM/FPKM normalized values',
        '6. Check for 3\' bias and other biases',
        '7. Generate alignment summary statistics',
        '8. Create BAM files for visualization',
        '9. Generate RNA-seq specific QC metrics',
        '10. Validate count matrix integrity'
      ],
      outputFormat: 'JSON object with alignment and quantification results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'countMatrix', 'averageMappingRate', 'totalGenesQuantified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        countMatrix: { type: 'string', description: 'Path to count matrix file' },
        averageMappingRate: { type: 'number' },
        totalGenesQuantified: { type: 'number' },
        sampleStatistics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'alignment', 'quantification']
}));

export const countNormalizationTask = defineTask('count-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Count Normalization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RNA-seq Normalization Specialist',
      task: 'Normalize count data for differential expression analysis',
      context: {
        projectName: args.projectName,
        countMatrix: args.countMatrix,
        samples: args.samples,
        conditions: args.conditions,
        deMethod: args.deMethod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load raw count matrix',
        '2. Filter lowly expressed genes (CPM > 1 in n samples)',
        '3. Apply normalization method based on DE tool:',
        '   - DESeq2: Size factor normalization',
        '   - edgeR: TMM normalization',
        '   - limma-voom: TMM + voom transformation',
        '4. Generate normalized count matrices',
        '5. Calculate sample correlation matrix',
        '6. Assess library size differences',
        '7. Generate normalization diagnostic plots',
        '8. Export normalized counts for downstream analysis',
        '9. Create sample metadata table',
        '10. Validate normalization quality'
      ],
      outputFormat: 'JSON object with normalization results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'normalizedCounts', 'genesRetained', 'countsPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        normalizedCounts: { type: 'string' },
        genesRetained: { type: 'number' },
        genesFiltered: { type: 'number' },
        countsPath: { type: 'string' },
        sizeFactors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'normalization']
}));

export const batchCorrectionTask = defineTask('batch-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Batch Effect Correction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Batch Effect Correction Specialist',
      task: 'Assess and correct batch effects in RNA-seq data',
      context: {
        projectName: args.projectName,
        normalizedCounts: args.normalizedCounts,
        samples: args.samples,
        conditions: args.conditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify potential batch variables (sequencing run, date, technician)',
        '2. Assess batch effect using PCA and variance partitioning',
        '3. Calculate variance explained by batch vs biological condition',
        '4. If batch effect significant, apply correction:',
        '   - ComBat (for known batches)',
        '   - SVA (for unknown confounders)',
        '   - RUV (remove unwanted variation)',
        '5. Include batch in DE model if not removable',
        '6. Generate before/after correction plots',
        '7. Validate that biological signal is preserved',
        '8. Document batch correction method and parameters',
        '9. Export batch-corrected counts',
        '10. Generate batch correction report'
      ],
      outputFormat: 'JSON object with batch correction results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'batchEffectDetected', 'correctedCounts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        batchEffectDetected: { type: 'boolean' },
        varianceExplained: { type: 'number' },
        correctionMethod: { type: 'string' },
        correctedCounts: { type: 'string' },
        surrogateVariables: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'batch-correction']
}));

export const exploratoryAnalysisTask = defineTask('exploratory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Exploratory Data Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RNA-seq Data Analyst',
      task: 'Perform exploratory data analysis on RNA-seq data',
      context: {
        projectName: args.projectName,
        normalizedCounts: args.normalizedCounts,
        samples: args.samples,
        conditions: args.conditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Perform PCA analysis on normalized counts',
        '2. Generate PCA plots colored by condition and other variables',
        '3. Create sample distance heatmap',
        '4. Generate sample correlation heatmap',
        '5. Identify outlier samples',
        '6. Create box plots of expression distribution per sample',
        '7. Generate density plots of expression values',
        '8. Assess sample clustering by condition',
        '9. Create variance stabilized transformation for visualization',
        '10. Generate EDA summary report'
      ],
      outputFormat: 'JSON object with EDA results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pcaVariance', 'outlierSamples', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pcaVariance: { type: 'number' },
        pcaCoordinates: { type: 'array' },
        outlierSamples: { type: 'array' },
        sampleClustering: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'exploratory-analysis']
}));

export const differentialExpressionTask = defineTask('differential-expression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Differential Expression Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Differential Expression Specialist',
      task: 'Identify differentially expressed genes between conditions',
      context: {
        projectName: args.projectName,
        countMatrix: args.countMatrix,
        samples: args.samples,
        conditions: args.conditions,
        deMethod: args.deMethod,
        pValueThreshold: args.pValueThreshold,
        log2FCThreshold: args.log2FCThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up DE analysis using specified method:',
        '   - DESeq2: DESeqDataSet with design formula',
        '   - edgeR: DGEList with GLM or exact test',
        '   - limma-voom: voom transformation with linear model',
        '2. Fit statistical model with appropriate design',
        '3. Calculate differential expression statistics',
        '4. Apply multiple testing correction (BH FDR)',
        '5. Filter significant genes by adjusted p-value and fold change',
        '6. Classify genes as up/down regulated',
        '7. Generate volcano plot',
        '8. Generate MA plot',
        '9. Create DE results table with statistics',
        '10. Generate top gene heatmap',
        '11. Export full results table'
      ],
      outputFormat: 'JSON object with DE results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deGenes', 'significantGenes', 'upregulated', 'downregulated', 'deTablePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deGenes: { type: 'array' },
        significantGenes: { type: 'number' },
        upregulated: { type: 'number' },
        downregulated: { type: 'number' },
        upregulatedGenes: { type: 'array' },
        downregulatedGenes: { type: 'array' },
        topGenes: { type: 'array' },
        deTablePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'differential-expression']
}));

export const pathwayEnrichmentTask = defineTask('pathway-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathway Enrichment Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pathway Enrichment Analyst',
      task: 'Perform gene set enrichment analysis',
      context: {
        projectName: args.projectName,
        deGenes: args.deGenes,
        upregulatedGenes: args.upregulatedGenes,
        downregulatedGenes: args.downregulatedGenes,
        pathwayDatabases: args.pathwayDatabases,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Perform GO enrichment analysis:',
        '   - Biological Process (BP)',
        '   - Molecular Function (MF)',
        '   - Cellular Component (CC)',
        '2. Perform KEGG pathway enrichment',
        '3. Perform Reactome pathway enrichment',
        '4. Perform MSigDB gene set enrichment',
        '5. Analyze up and down regulated genes separately',
        '6. Apply multiple testing correction',
        '7. Filter significant pathways (FDR < 0.05)',
        '8. Generate enrichment dot plots',
        '9. Generate enrichment network plots',
        '10. Create GSEA-style enrichment plots',
        '11. Export enrichment results tables'
      ],
      outputFormat: 'JSON object with enrichment results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'significantPathways', 'topPathways', 'goEnrichment', 'enrichmentPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        significantPathways: { type: 'number' },
        topPathways: { type: 'array' },
        goEnrichment: { type: 'object' },
        keggPathways: { type: 'array' },
        reactomePathways: { type: 'array' },
        enrichmentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'pathway-enrichment']
}));

export const generateRNAseqReportTask = defineTask('generate-rnaseq-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate RNA-seq Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RNA-seq Report Specialist',
      task: 'Generate comprehensive RNA-seq analysis report',
      context: {
        projectName: args.projectName,
        conditions: args.conditions,
        qcResult: args.qcResult,
        alignmentResult: args.alignmentResult,
        normalizationResult: args.normalizationResult,
        batchCorrectionResult: args.batchCorrectionResult,
        edaResult: args.edaResult,
        deResult: args.deResult,
        enrichmentResult: args.enrichmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document experimental design and conditions',
        '3. Summarize QC metrics and sample quality',
        '4. Report alignment/quantification statistics',
        '5. Include EDA visualizations (PCA, clustering)',
        '6. Present DE results with volcano and MA plots',
        '7. Include top DE gene table',
        '8. Present pathway enrichment results',
        '9. Document methods and parameters',
        '10. Include data availability and file locations',
        '11. Generate HTML interactive report',
        '12. Export report in multiple formats'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        htmlReportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'rnaseq', 'report-generation']
}));
