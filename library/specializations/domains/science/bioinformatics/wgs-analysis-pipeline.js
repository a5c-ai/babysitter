/**
 * @process specializations/domains/science/bioinformatics/wgs-analysis-pipeline
 * @description Whole Genome Sequencing Pipeline - End-to-end pipeline for whole genome sequencing analysis
 * including read alignment, variant calling, annotation, and quality control. Implements GATK best practices
 * with support for germline and somatic workflows.
 * @inputs { projectName: string, sampleIds: array, referenceGenome: string, analysisType?: string, outputDir?: string }
 * @outputs { success: boolean, alignedSamples: array, variants: object, qcMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/wgs-analysis-pipeline', {
 *   projectName: 'Cancer Genomics Study',
 *   sampleIds: ['SAMPLE001', 'SAMPLE002', 'SAMPLE003'],
 *   referenceGenome: 'GRCh38',
 *   analysisType: 'germline', // 'germline', 'somatic', 'trio'
 *   fastqDir: '/data/fastq',
 *   outputDir: '/results/wgs'
 * });
 *
 * @references
 * - GATK Best Practices: https://gatk.broadinstitute.org/hc/en-us/sections/360007226651-Best-Practices-Workflows
 * - BWA-MEM2: https://github.com/bwa-mem2/bwa-mem2
 * - DeepVariant: https://github.com/google/deepvariant
 * - VEP Documentation: https://www.ensembl.org/info/docs/tools/vep/index.html
 * - Genome in a Bottle: https://www.nist.gov/programs-projects/genome-bottle
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sampleIds = [],
    referenceGenome = 'GRCh38',
    analysisType = 'germline', // 'germline', 'somatic', 'trio'
    fastqDir = '/data/fastq',
    outputDir = 'wgs-output',
    qualityThreshold = 30,
    coverageTarget = 30,
    enableSVDetection = true,
    enableJointGenotyping = true,
    annotationDatabases = ['VEP', 'ANNOVAR', 'gnomAD', 'ClinVar']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const alignedSamples = [];
  const variantResults = [];

  ctx.log('info', `Starting WGS Analysis Pipeline for ${projectName}`);
  ctx.log('info', `Samples: ${sampleIds.length}, Reference: ${referenceGenome}, Analysis Type: ${analysisType}`);

  // ============================================================================
  // PHASE 1: FASTQ QUALITY ASSESSMENT AND PREPROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 1: FASTQ Quality Assessment and Preprocessing');

  const qcResult = await ctx.task(fastqQualityControlTask, {
    projectName,
    sampleIds,
    fastqDir,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qcResult.artifacts);

  ctx.log('info', `QC complete - ${qcResult.passedSamples.length}/${sampleIds.length} samples passed quality filters`);

  // Quality Gate: Sample quality check
  if (qcResult.failedSamples.length > 0) {
    await ctx.breakpoint({
      question: `${qcResult.failedSamples.length} samples failed QC. Failed samples: ${qcResult.failedSamples.join(', ')}. Continue with passing samples or address issues?`,
      title: 'Sample Quality Gate',
      context: {
        runId: ctx.runId,
        projectName,
        passedSamples: qcResult.passedSamples.length,
        failedSamples: qcResult.failedSamples,
        qcMetrics: qcResult.metrics,
        files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: READ ALIGNMENT WITH BWA-MEM2
  // ============================================================================

  ctx.log('info', 'Phase 2: Read Alignment with BWA-MEM2');

  const alignmentResult = await ctx.task(readAlignmentTask, {
    projectName,
    sampleIds: qcResult.passedSamples,
    referenceGenome,
    fastqDir,
    outputDir
  });

  artifacts.push(...alignmentResult.artifacts);
  alignedSamples.push(...alignmentResult.alignedSamples);

  ctx.log('info', `Alignment complete - ${alignmentResult.alignedSamples.length} samples aligned`);

  // Breakpoint: Review alignment statistics
  await ctx.breakpoint({
    question: `Read alignment complete for ${alignmentResult.alignedSamples.length} samples. Average mapping rate: ${alignmentResult.averageMappingRate}%. Review alignment statistics?`,
    title: 'Alignment Statistics Review',
    context: {
      runId: ctx.runId,
      alignmentStats: alignmentResult.statistics,
      coverageMetrics: alignmentResult.coverageMetrics,
      files: alignmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: DUPLICATE MARKING AND BQSR
  // ============================================================================

  ctx.log('info', 'Phase 3: Duplicate Marking and Base Quality Score Recalibration');

  const preprocessResult = await ctx.task(bamPreprocessingTask, {
    projectName,
    alignedSamples: alignmentResult.alignedSamples,
    referenceGenome,
    outputDir
  });

  artifacts.push(...preprocessResult.artifacts);

  ctx.log('info', `BAM preprocessing complete - Duplicate rate: ${preprocessResult.averageDuplicateRate}%`);

  // ============================================================================
  // PHASE 4: VARIANT CALLING
  // ============================================================================

  ctx.log('info', `Phase 4: Variant Calling (${analysisType} workflow)`);

  const variantCallingResult = await ctx.task(variantCallingTask, {
    projectName,
    preprocessedBams: preprocessResult.processedBams,
    referenceGenome,
    analysisType,
    outputDir
  });

  artifacts.push(...variantCallingResult.artifacts);
  variantResults.push(variantCallingResult);

  ctx.log('info', `Variant calling complete - ${variantCallingResult.totalVariants} variants identified`);

  // Quality Gate: Variant calling metrics
  await ctx.breakpoint({
    question: `Variant calling complete. Total variants: ${variantCallingResult.totalVariants}. SNVs: ${variantCallingResult.snvCount}, Indels: ${variantCallingResult.indelCount}. Review variant calling metrics?`,
    title: 'Variant Calling Review',
    context: {
      runId: ctx.runId,
      variantStats: {
        total: variantCallingResult.totalVariants,
        snvs: variantCallingResult.snvCount,
        indels: variantCallingResult.indelCount,
        titvRatio: variantCallingResult.titvRatio
      },
      qualityMetrics: variantCallingResult.qualityMetrics,
      files: variantCallingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: STRUCTURAL VARIANT DETECTION (OPTIONAL)
  // ============================================================================

  let svResult = null;
  if (enableSVDetection) {
    ctx.log('info', 'Phase 5: Structural Variant Detection');

    svResult = await ctx.task(structuralVariantDetectionTask, {
      projectName,
      preprocessedBams: preprocessResult.processedBams,
      referenceGenome,
      outputDir
    });

    artifacts.push(...svResult.artifacts);

    ctx.log('info', `SV detection complete - ${svResult.totalSVs} structural variants identified`);
  }

  // ============================================================================
  // PHASE 6: JOINT GENOTYPING (FOR MULTI-SAMPLE STUDIES)
  // ============================================================================

  let jointGenotypingResult = null;
  if (enableJointGenotyping && sampleIds.length > 1) {
    ctx.log('info', 'Phase 6: Joint Genotyping');

    jointGenotypingResult = await ctx.task(jointGenotypingTask, {
      projectName,
      gvcfFiles: variantCallingResult.gvcfFiles,
      referenceGenome,
      outputDir
    });

    artifacts.push(...jointGenotypingResult.artifacts);

    ctx.log('info', `Joint genotyping complete - ${jointGenotypingResult.jointVariants} variants in cohort VCF`);
  }

  // ============================================================================
  // PHASE 7: VARIANT ANNOTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Variant Annotation');

  const annotationResult = await ctx.task(variantAnnotationTask, {
    projectName,
    vcfFile: jointGenotypingResult?.vcfFile || variantCallingResult.vcfFile,
    referenceGenome,
    annotationDatabases,
    outputDir
  });

  artifacts.push(...annotationResult.artifacts);

  ctx.log('info', `Annotation complete - Annotated with ${annotationDatabases.join(', ')}`);

  // Breakpoint: Review annotated variants
  await ctx.breakpoint({
    question: `Variant annotation complete. Pathogenic variants: ${annotationResult.pathogenicCount}, High-impact: ${annotationResult.highImpactCount}. Review annotation results?`,
    title: 'Variant Annotation Review',
    context: {
      runId: ctx.runId,
      annotationSummary: {
        totalAnnotated: annotationResult.totalAnnotated,
        pathogenic: annotationResult.pathogenicCount,
        likelyPathogenic: annotationResult.likelyPathogenicCount,
        highImpact: annotationResult.highImpactCount,
        moderateImpact: annotationResult.moderateImpactCount
      },
      topGenes: annotationResult.topAffectedGenes,
      files: annotationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: QUALITY CONTROL AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Quality Control and Validation');

  const validationResult = await ctx.task(pipelineValidationTask, {
    projectName,
    alignmentResult,
    preprocessResult,
    variantCallingResult,
    annotationResult,
    svResult,
    coverageTarget,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Validation complete - QC Score: ${validationResult.qcScore}/100`);

  // Quality Gate: Validation results
  if (validationResult.qcScore < 80) {
    await ctx.breakpoint({
      question: `Pipeline QC score ${validationResult.qcScore}/100 is below threshold. Issues: ${validationResult.issues.join(', ')}. Address issues or proceed with caution?`,
      title: 'Quality Control Warning',
      context: {
        runId: ctx.runId,
        qcScore: validationResult.qcScore,
        issues: validationResult.issues,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: GENERATE ANALYSIS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Analysis Report');

  const reportResult = await ctx.task(generateWGSReportTask, {
    projectName,
    sampleIds,
    referenceGenome,
    analysisType,
    qcResult,
    alignmentResult,
    preprocessResult,
    variantCallingResult,
    svResult,
    jointGenotypingResult,
    annotationResult,
    validationResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: Pipeline complete
  await ctx.breakpoint({
    question: `WGS Analysis Pipeline Complete for ${projectName}. ${alignedSamples.length} samples processed, ${variantCallingResult.totalVariants} variants identified. Approve final results?`,
    title: 'WGS Pipeline Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        samplesProcessed: alignedSamples.length,
        totalVariants: variantCallingResult.totalVariants,
        pathogenicVariants: annotationResult.pathogenicCount,
        qcScore: validationResult.qcScore
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Analysis Report' },
        { path: annotationResult.annotatedVcfPath, format: 'vcf', label: 'Annotated VCF' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    samplesProcessed: alignedSamples.length,
    referenceGenome,
    analysisType,
    alignedSamples: alignedSamples.map(s => ({
      sampleId: s.sampleId,
      mappingRate: s.mappingRate,
      meanCoverage: s.meanCoverage
    })),
    variants: {
      totalVariants: variantCallingResult.totalVariants,
      snvCount: variantCallingResult.snvCount,
      indelCount: variantCallingResult.indelCount,
      structuralVariants: svResult?.totalSVs || 0,
      titvRatio: variantCallingResult.titvRatio,
      pathogenicCount: annotationResult.pathogenicCount,
      highImpactCount: annotationResult.highImpactCount
    },
    qcMetrics: {
      overallScore: validationResult.qcScore,
      alignmentQuality: alignmentResult.averageMappingRate,
      duplicateRate: preprocessResult.averageDuplicateRate,
      coverageMetrics: alignmentResult.coverageMetrics,
      variantQuality: variantCallingResult.qualityMetrics
    },
    outputFiles: {
      annotatedVcf: annotationResult.annotatedVcfPath,
      report: reportResult.reportPath,
      qcReport: validationResult.qcReportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/bioinformatics/wgs-analysis-pipeline',
      processSlug: 'wgs-analysis-pipeline',
      category: 'bioinformatics',
      timestamp: startTime,
      referenceGenome,
      analysisType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const fastqQualityControlTask = defineTask('fastq-quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `FASTQ Quality Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bioinformatics Quality Control Specialist',
      task: 'Perform quality control on FASTQ files for WGS analysis',
      context: {
        projectName: args.projectName,
        sampleIds: args.sampleIds,
        fastqDir: args.fastqDir,
        qualityThreshold: args.qualityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run FastQC on all FASTQ files to assess read quality',
        '2. Evaluate per-base sequence quality (Phred scores)',
        '3. Check for adapter contamination and overrepresented sequences',
        '4. Assess GC content distribution for contamination indicators',
        '5. Evaluate sequence duplication levels',
        '6. Perform adapter trimming with Trimmomatic or fastp if needed',
        '7. Quality filter reads below threshold (Q30)',
        '8. Generate MultiQC report aggregating all sample metrics',
        '9. Flag samples with concerning quality metrics',
        '10. Create quality summary with pass/fail status for each sample'
      ],
      outputFormat: 'JSON object with QC results for all samples'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passedSamples', 'failedSamples', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passedSamples: { type: 'array', items: { type: 'string' } },
        failedSamples: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'object',
          properties: {
            averageQuality: { type: 'number' },
            averageReadLength: { type: 'number' },
            totalReads: { type: 'number' },
            adapterContamination: { type: 'number' }
          }
        },
        sampleMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'quality-control', 'fastq']
}));

export const readAlignmentTask = defineTask('read-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read Alignment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NGS Alignment Specialist',
      task: 'Align sequencing reads to reference genome using BWA-MEM2',
      context: {
        projectName: args.projectName,
        sampleIds: args.sampleIds,
        referenceGenome: args.referenceGenome,
        fastqDir: args.fastqDir,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Index reference genome if not already indexed',
        '2. Align reads using BWA-MEM2 with appropriate parameters',
        '3. Add read groups (RGID, RGSM, RGPL, RGLB, RGPU) to BAM files',
        '4. Sort aligned BAM files by coordinate',
        '5. Index BAM files with samtools',
        '6. Calculate alignment statistics (mapping rate, properly paired)',
        '7. Generate coverage statistics per sample',
        '8. Calculate mean, median coverage and coverage uniformity',
        '9. Identify regions with low coverage (<10x)',
        '10. Create alignment summary report'
      ],
      outputFormat: 'JSON object with alignment results and statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alignedSamples', 'averageMappingRate', 'statistics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alignedSamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              bamPath: { type: 'string' },
              mappingRate: { type: 'number' },
              meanCoverage: { type: 'number' },
              properlyPaired: { type: 'number' }
            }
          }
        },
        averageMappingRate: { type: 'number' },
        coverageMetrics: { type: 'object' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'alignment', 'bwa']
}));

export const bamPreprocessingTask = defineTask('bam-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: `BAM Preprocessing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NGS Data Processing Specialist',
      task: 'Perform duplicate marking and base quality score recalibration',
      context: {
        projectName: args.projectName,
        alignedSamples: args.alignedSamples,
        referenceGenome: args.referenceGenome,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Mark duplicates using GATK MarkDuplicates or Picard',
        '2. Calculate duplicate metrics for each sample',
        '3. Generate recalibration table using GATK BaseRecalibrator',
        '4. Apply BQSR using GATK ApplyBQSR',
        '5. Validate recalibrated BAM files',
        '6. Generate before/after BQSR comparison plots',
        '7. Index final preprocessed BAM files',
        '8. Calculate final coverage statistics',
        '9. Verify BAM integrity with ValidateSamFile',
        '10. Create preprocessing summary with metrics'
      ],
      outputFormat: 'JSON object with preprocessing results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'processedBams', 'averageDuplicateRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        processedBams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              bamPath: { type: 'string' },
              duplicateRate: { type: 'number' },
              bqsrApplied: { type: 'boolean' }
            }
          }
        },
        averageDuplicateRate: { type: 'number' },
        bqsrMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'preprocessing', 'bqsr']
}));

export const variantCallingTask = defineTask('variant-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variant Calling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Variant Calling Specialist',
      task: 'Call germline or somatic variants using GATK HaplotypeCaller or DeepVariant',
      context: {
        projectName: args.projectName,
        preprocessedBams: args.preprocessedBams,
        referenceGenome: args.referenceGenome,
        analysisType: args.analysisType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate variant caller based on analysis type:',
        '   - Germline: GATK HaplotypeCaller or DeepVariant',
        '   - Somatic: Mutect2 with matched normal',
        '   - Trio: GATK HaplotypeCaller with pedigree',
        '2. Call variants per sample in GVCF mode for germline',
        '3. Apply variant quality score recalibration (VQSR) or hard filtering',
        '4. Filter variants based on quality metrics',
        '5. Calculate variant statistics (Ti/Tv ratio, het/hom ratio)',
        '6. Validate variant calls against known sites if available',
        '7. Generate VCF statistics with bcftools stats',
        '8. Create variant calling summary report',
        '9. Validate VCF format compliance',
        '10. Archive intermediate files and organize outputs'
      ],
      outputFormat: 'JSON object with variant calling results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalVariants', 'snvCount', 'indelCount', 'vcfFile', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vcfFile: { type: 'string' },
        gvcfFiles: { type: 'array', items: { type: 'string' } },
        totalVariants: { type: 'number' },
        snvCount: { type: 'number' },
        indelCount: { type: 'number' },
        titvRatio: { type: 'number' },
        hetHomRatio: { type: 'number' },
        qualityMetrics: { type: 'object' },
        perSampleStats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'variant-calling', 'gatk']
}));

export const structuralVariantDetectionTask = defineTask('structural-variant-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structural Variant Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Variant Analysis Specialist',
      task: 'Detect structural variants using Manta, DELLY, or similar tools',
      context: {
        projectName: args.projectName,
        preprocessedBams: args.preprocessedBams,
        referenceGenome: args.referenceGenome,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run Manta for SV detection (deletions, duplications, inversions, insertions)',
        '2. Run DELLY for additional SV confirmation',
        '3. Detect copy number variations (CNVs) using CNVkit or GATK gCNV',
        '4. Merge and filter SV calls from multiple callers',
        '5. Annotate SVs with gene overlaps and functional impact',
        '6. Filter SVs by quality, size, and population frequency',
        '7. Identify SVs affecting coding regions or regulatory elements',
        '8. Generate SV visualization plots',
        '9. Create SV summary with counts by type',
        '10. Validate high-confidence SVs'
      ],
      outputFormat: 'JSON object with structural variant results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalSVs', 'svCounts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vcfFile: { type: 'string' },
        totalSVs: { type: 'number' },
        svCounts: {
          type: 'object',
          properties: {
            deletions: { type: 'number' },
            duplications: { type: 'number' },
            inversions: { type: 'number' },
            insertions: { type: 'number' },
            translocations: { type: 'number' }
          }
        },
        cnvResults: { type: 'object' },
        highConfidenceSVs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'structural-variants', 'cnv']
}));

export const jointGenotypingTask = defineTask('joint-genotyping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Joint Genotyping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Population Genetics Specialist',
      task: 'Perform joint genotyping across multiple samples',
      context: {
        projectName: args.projectName,
        gvcfFiles: args.gvcfFiles,
        referenceGenome: args.referenceGenome,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Combine GVCFs using GenomicsDBImport or CombineGVCFs',
        '2. Run joint genotyping with GenotypeGVCFs',
        '3. Apply VQSR or hard filtering to joint-called variants',
        '4. Calculate cohort-level statistics',
        '5. Identify variants with Mendelian violations (for families)',
        '6. Calculate allele frequencies within the cohort',
        '7. Flag rare variants (AF < 0.01 in cohort)',
        '8. Generate sample concordance matrix',
        '9. Verify sample relationships if pedigree provided',
        '10. Create joint genotyping summary report'
      ],
      outputFormat: 'JSON object with joint genotyping results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vcfFile', 'jointVariants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vcfFile: { type: 'string' },
        jointVariants: { type: 'number' },
        cohortAlleleFrequencies: { type: 'object' },
        sampleConcordance: { type: 'object' },
        mendelianViolations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'joint-genotyping', 'cohort']
}));

export const variantAnnotationTask = defineTask('variant-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variant Annotation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Variant Annotation Specialist',
      task: 'Annotate variants with functional and clinical information',
      context: {
        projectName: args.projectName,
        vcfFile: args.vcfFile,
        referenceGenome: args.referenceGenome,
        annotationDatabases: args.annotationDatabases,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Annotate with VEP (Variant Effect Predictor):',
        '   - Gene, transcript, and protein consequences',
        '   - IMPACT classification (HIGH, MODERATE, LOW, MODIFIER)',
        '2. Add population frequencies from gnomAD',
        '3. Add ClinVar clinical significance',
        '4. Add CADD, REVEL, and other pathogenicity scores',
        '5. Annotate with OMIM disease associations',
        '6. Add conservation scores (GERP, phyloP)',
        '7. Identify variants in ACMG actionable genes',
        '8. Flag variants meeting ACMG/AMP pathogenic criteria',
        '9. Generate annotation summary statistics',
        '10. Create prioritized variant list for review'
      ],
      outputFormat: 'JSON object with annotation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'annotatedVcfPath', 'totalAnnotated', 'pathogenicCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        annotatedVcfPath: { type: 'string' },
        totalAnnotated: { type: 'number' },
        pathogenicCount: { type: 'number' },
        likelyPathogenicCount: { type: 'number' },
        highImpactCount: { type: 'number' },
        moderateImpactCount: { type: 'number' },
        topAffectedGenes: { type: 'array', items: { type: 'string' } },
        acmgActionableVariants: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'annotation', 'vep']
}));

export const pipelineValidationTask = defineTask('pipeline-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bioinformatics Quality Assurance Specialist',
      task: 'Validate WGS pipeline results and calculate quality metrics',
      context: {
        projectName: args.projectName,
        alignmentResult: args.alignmentResult,
        preprocessResult: args.preprocessResult,
        variantCallingResult: args.variantCallingResult,
        annotationResult: args.annotationResult,
        svResult: args.svResult,
        coverageTarget: args.coverageTarget,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate alignment quality metrics:',
        '   - Mapping rate > 95%',
        '   - Properly paired > 90%',
        '   - Mean coverage >= target',
        '2. Validate variant calling quality:',
        '   - Ti/Tv ratio 2.0-2.1 for WGS',
        '   - Het/Hom ratio appropriate for population',
        '   - Variant count within expected range',
        '3. Validate annotation completeness',
        '4. Check for sample swaps using genotype concordance',
        '5. Verify sex concordance with reported sex',
        '6. Check contamination levels',
        '7. Validate against reference samples if available',
        '8. Calculate overall QC score (0-100)',
        '9. Identify issues and provide recommendations',
        '10. Generate comprehensive QC report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'qcScore', 'issues', 'qcReportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        qcScore: { type: 'number', minimum: 0, maximum: 100 },
        passedValidation: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        metricsValidation: { type: 'object' },
        qcReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'validation', 'quality-control']
}));

export const generateWGSReportTask = defineTask('generate-wgs-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate WGS Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Genomics Report Specialist',
      task: 'Generate comprehensive WGS analysis report',
      context: {
        projectName: args.projectName,
        sampleIds: args.sampleIds,
        referenceGenome: args.referenceGenome,
        analysisType: args.analysisType,
        qcResult: args.qcResult,
        alignmentResult: args.alignmentResult,
        preprocessResult: args.preprocessResult,
        variantCallingResult: args.variantCallingResult,
        svResult: args.svResult,
        jointGenotypingResult: args.jointGenotypingResult,
        annotationResult: args.annotationResult,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document methods and pipeline version',
        '3. Summarize sample quality metrics',
        '4. Report alignment and coverage statistics',
        '5. Summarize variant calling results',
        '6. Highlight pathogenic and clinically relevant variants',
        '7. Include structural variant findings',
        '8. Document quality control metrics and validation',
        '9. Provide interpretation guidance',
        '10. Generate report in multiple formats (HTML, PDF, JSON)'
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
        jsonReportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'wgs', 'reporting', 'documentation']
}));
