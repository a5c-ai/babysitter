/**
 * @process specializations/domains/science/bioinformatics/clinical-variant-interpretation
 * @description Clinical Variant Interpretation - Systematic process for interpreting genetic variants
 * according to ACMG/AMP guidelines for clinical reporting. Includes pathogenicity classification,
 * evidence curation, and report generation.
 * @inputs { projectName: string, variants: array, phenotype?: string, inheritancePattern?: string, outputDir?: string }
 * @outputs { success: boolean, classifiedVariants: array, clinicalReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/clinical-variant-interpretation', {
 *   projectName: 'Rare Disease Case Review',
 *   variants: [{ gene: 'BRCA1', hgvs: 'c.5266dupC' }],
 *   phenotype: 'Breast cancer, early onset',
 *   inheritancePattern: 'autosomal-dominant'
 * });
 *
 * @references
 * - ACMG/AMP Guidelines: https://www.nature.com/articles/gim201530
 * - ClinGen: https://clinicalgenome.org/
 * - ClinVar: https://www.ncbi.nlm.nih.gov/clinvar/
 * - gnomAD: https://gnomad.broadinstitute.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    variants = [],
    vcfFile = null,
    phenotype = '',
    inheritancePattern = 'unknown',
    affectedStatus = 'affected',
    familyHistory = '',
    outputDir = 'clinical-interpretation-output',
    databases = ['ClinVar', 'gnomAD', 'OMIM', 'HGMD'],
    predictionTools = ['CADD', 'REVEL', 'SpliceAI', 'AlphaMissense']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const classifiedVariants = [];

  ctx.log('info', `Starting Clinical Variant Interpretation for ${projectName}`);
  ctx.log('info', `Variants: ${variants.length || 'from VCF'}, Phenotype: ${phenotype}`);

  // ============================================================================
  // PHASE 1: VARIANT EXTRACTION AND NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Variant Extraction and Normalization');

  const extractionResult = await ctx.task(variantExtractionTask, {
    projectName,
    variants,
    vcfFile,
    outputDir
  });

  artifacts.push(...extractionResult.artifacts);

  ctx.log('info', `Extracted ${extractionResult.normalizedVariants.length} variants for interpretation`);

  // ============================================================================
  // PHASE 2: POPULATION FREQUENCY FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 2: Population Frequency Filtering');

  const frequencyResult = await ctx.task(populationFrequencyFilteringTask, {
    projectName,
    variants: extractionResult.normalizedVariants,
    databases,
    outputDir
  });

  artifacts.push(...frequencyResult.artifacts);

  ctx.log('info', `${frequencyResult.rareVariants.length} variants passed frequency filtering (AF < 0.01)`);

  // Breakpoint: Review frequency filtering
  await ctx.breakpoint({
    question: `Population frequency filtering complete. ${frequencyResult.rareVariants.length}/${extractionResult.normalizedVariants.length} variants are rare (AF < 0.01). Review filtering results?`,
    title: 'Population Frequency Review',
    context: {
      runId: ctx.runId,
      totalVariants: extractionResult.normalizedVariants.length,
      rareVariants: frequencyResult.rareVariants.length,
      filteredOut: frequencyResult.commonVariants.length,
      files: frequencyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: IN SILICO PREDICTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: In Silico Prediction Analysis');

  const predictionResult = await ctx.task(inSilicoPredictionTask, {
    projectName,
    variants: frequencyResult.rareVariants,
    predictionTools,
    outputDir
  });

  artifacts.push(...predictionResult.artifacts);

  ctx.log('info', `Prediction analysis complete - ${predictionResult.deleteriousPredicted} predicted deleterious`);

  // ============================================================================
  // PHASE 4: LITERATURE AND DATABASE EVIDENCE REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Literature and Database Evidence Review');

  const evidenceResult = await ctx.task(evidenceReviewTask, {
    projectName,
    variants: frequencyResult.rareVariants,
    phenotype,
    databases,
    outputDir
  });

  artifacts.push(...evidenceResult.artifacts);

  ctx.log('info', `Evidence review complete - ${evidenceResult.variantsWithEvidence} variants have supporting evidence`);

  // Breakpoint: Review evidence
  await ctx.breakpoint({
    question: `Literature and database evidence review complete. ${evidenceResult.variantsWithEvidence} variants have clinical evidence. Review evidence summary?`,
    title: 'Evidence Review',
    context: {
      runId: ctx.runId,
      evidenceSummary: evidenceResult.summary,
      clinvarMatches: evidenceResult.clinvarMatches,
      literatureReferences: evidenceResult.literatureCount,
      files: evidenceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: ACMG/AMP CRITERIA ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: ACMG/AMP Criteria Assessment');

  const acmgResult = await ctx.task(acmgCriteriaAssessmentTask, {
    projectName,
    variants: frequencyResult.rareVariants,
    predictionResult,
    evidenceResult,
    phenotype,
    inheritancePattern,
    outputDir
  });

  artifacts.push(...acmgResult.artifacts);

  ctx.log('info', `ACMG assessment complete - Pathogenic: ${acmgResult.pathogenicCount}, VUS: ${acmgResult.vusCount}`);

  // Quality Gate: ACMG classification review
  await ctx.breakpoint({
    question: `ACMG/AMP classification complete. Pathogenic: ${acmgResult.pathogenicCount}, Likely Pathogenic: ${acmgResult.likelyPathogenicCount}, VUS: ${acmgResult.vusCount}. Review classifications?`,
    title: 'ACMG Classification Review',
    context: {
      runId: ctx.runId,
      classifications: {
        pathogenic: acmgResult.pathogenicCount,
        likelyPathogenic: acmgResult.likelyPathogenicCount,
        vus: acmgResult.vusCount,
        likelyBenign: acmgResult.likelyBenignCount,
        benign: acmgResult.benignCount
      },
      criteriaApplied: acmgResult.criteriaBreakdown,
      files: acmgResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: INHERITANCE PATTERN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Inheritance Pattern Analysis');

  const inheritanceResult = await ctx.task(inheritanceAnalysisTask, {
    projectName,
    classifiedVariants: acmgResult.classifiedVariants,
    phenotype,
    inheritancePattern,
    familyHistory,
    outputDir
  });

  artifacts.push(...inheritanceResult.artifacts);

  ctx.log('info', `Inheritance analysis complete - ${inheritanceResult.consistentVariants} variants consistent with expected inheritance`);

  // ============================================================================
  // PHASE 7: CLINICAL CORRELATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Clinical Correlation Assessment');

  const correlationResult = await ctx.task(clinicalCorrelationTask, {
    projectName,
    classifiedVariants: acmgResult.classifiedVariants,
    phenotype,
    inheritanceResult,
    outputDir
  });

  artifacts.push(...correlationResult.artifacts);

  ctx.log('info', `Clinical correlation complete - ${correlationResult.phenotypeMatchCount} variants match phenotype`);

  // ============================================================================
  // PHASE 8: ACTIONABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Actionability Assessment');

  const actionabilityResult = await ctx.task(actionabilityAssessmentTask, {
    projectName,
    classifiedVariants: acmgResult.classifiedVariants,
    correlationResult,
    outputDir
  });

  artifacts.push(...actionabilityResult.artifacts);

  ctx.log('info', `Actionability assessment complete - ${actionabilityResult.actionableVariants} actionable variants`);

  // Breakpoint: Review actionable findings
  if (actionabilityResult.actionableVariants > 0) {
    await ctx.breakpoint({
      question: `${actionabilityResult.actionableVariants} clinically actionable variants identified. Management recommendations available. Review actionable findings?`,
      title: 'Actionable Findings Review',
      context: {
        runId: ctx.runId,
        actionableVariants: actionabilityResult.actionableFindings,
        recommendations: actionabilityResult.recommendations,
        files: actionabilityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: GENERATE CLINICAL REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Clinical Report');

  const reportResult = await ctx.task(generateClinicalReportTask, {
    projectName,
    phenotype,
    inheritancePattern,
    acmgResult,
    inheritanceResult,
    correlationResult,
    actionabilityResult,
    predictionResult,
    evidenceResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: Report approval
  await ctx.breakpoint({
    question: `Clinical Variant Interpretation Complete for ${projectName}. ${acmgResult.pathogenicCount + acmgResult.likelyPathogenicCount} pathogenic/likely pathogenic variants identified. Approve clinical report?`,
    title: 'Clinical Report Approval',
    context: {
      runId: ctx.runId,
      summary: {
        totalVariants: extractionResult.normalizedVariants.length,
        pathogenic: acmgResult.pathogenicCount,
        likelyPathogenic: acmgResult.likelyPathogenicCount,
        vus: acmgResult.vusCount,
        actionable: actionabilityResult.actionableVariants
      },
      primaryFindings: reportResult.primaryFindings,
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Clinical Report' },
        { path: reportResult.jsonReportPath, format: 'json', label: 'Structured Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Compile classified variants
  acmgResult.classifiedVariants.forEach(v => classifiedVariants.push(v));

  return {
    success: true,
    projectName,
    phenotype,
    inheritancePattern,
    totalVariantsAnalyzed: extractionResult.normalizedVariants.length,
    classifiedVariants: classifiedVariants.map(v => ({
      gene: v.gene,
      hgvsc: v.hgvsc,
      hgvsp: v.hgvsp,
      classification: v.classification,
      acmgCriteria: v.appliedCriteria,
      clinicalSignificance: v.clinicalSignificance
    })),
    classificationSummary: {
      pathogenic: acmgResult.pathogenicCount,
      likelyPathogenic: acmgResult.likelyPathogenicCount,
      vus: acmgResult.vusCount,
      likelyBenign: acmgResult.likelyBenignCount,
      benign: acmgResult.benignCount
    },
    clinicalReport: {
      reportPath: reportResult.reportPath,
      primaryFindings: reportResult.primaryFindings,
      secondaryFindings: reportResult.secondaryFindings,
      recommendations: actionabilityResult.recommendations
    },
    actionableFindings: actionabilityResult.actionableFindings,
    phenotypeCorrelation: correlationResult.correlationScore,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/bioinformatics/clinical-variant-interpretation',
      processSlug: 'clinical-variant-interpretation',
      category: 'bioinformatics',
      timestamp: startTime,
      databases,
      predictionTools
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const variantExtractionTask = defineTask('variant-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variant Extraction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Genetics Data Specialist',
      task: 'Extract and normalize variants for clinical interpretation',
      context: {
        projectName: args.projectName,
        variants: args.variants,
        vcfFile: args.vcfFile,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract variants from VCF file or provided variant list',
        '2. Normalize variants to standard representation (left-align, trim)',
        '3. Convert to HGVS nomenclature (genomic, coding, protein)',
        '4. Validate HGVS nomenclature using Mutalyzer or similar',
        '5. Map variants to transcripts (use MANE Select when available)',
        '6. Annotate variant type (SNV, indel, frameshift, splice, etc.)',
        '7. Filter out common artifacts and low-quality calls',
        '8. Generate variant summary table',
        '9. Create normalized variant file',
        '10. Document any variants that could not be normalized'
      ],
      outputFormat: 'JSON object with normalized variants'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'normalizedVariants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        normalizedVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string' },
              gene: { type: 'string' },
              hgvsg: { type: 'string' },
              hgvsc: { type: 'string' },
              hgvsp: { type: 'string' },
              variantType: { type: 'string' },
              transcript: { type: 'string' }
            }
          }
        },
        failedNormalization: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'variant-normalization']
}));

export const populationFrequencyFilteringTask = defineTask('population-frequency-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Population Frequency Filtering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Population Genetics Specialist',
      task: 'Filter variants based on population allele frequencies',
      context: {
        projectName: args.projectName,
        variants: args.variants,
        databases: args.databases,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query gnomAD for global and population-specific allele frequencies',
        '2. Query 1000 Genomes for additional population data',
        '3. Consider ancestry-matched populations when available',
        '4. Apply frequency thresholds based on inheritance pattern:',
        '   - Dominant: AF < 0.0001 (BA1, BS1 thresholds)',
        '   - Recessive: AF < 0.01',
        '5. Flag variants absent from population databases (novel)',
        '6. Identify population-specific variants',
        '7. Apply ACMG BA1 criteria for variants > 5% AF',
        '8. Apply ACMG BS1 criteria for variants > expected frequency',
        '9. Apply ACMG PM2 criteria for absent/rare variants',
        '10. Generate frequency annotation summary'
      ],
      outputFormat: 'JSON object with frequency-filtered variants'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rareVariants', 'commonVariants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rareVariants: { type: 'array' },
        commonVariants: { type: 'array' },
        novelVariants: { type: 'number' },
        frequencyAnnotations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'population-frequency']
}));

export const inSilicoPredictionTask = defineTask('in-silico-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `In Silico Prediction Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Computational Variant Analysis Specialist',
      task: 'Analyze variants using in silico prediction tools',
      context: {
        projectName: args.projectName,
        variants: args.variants,
        predictionTools: args.predictionTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run CADD scoring for all variants (pathogenic threshold ~25-30)',
        '2. Run REVEL for missense variants (pathogenic threshold ~0.5)',
        '3. Run SpliceAI for variants near splice sites (delta score threshold)',
        '4. Run AlphaMissense for missense variants',
        '5. Aggregate multiple algorithm predictions',
        '6. Apply ACMG PP3 criteria for consistent deleterious predictions',
        '7. Apply ACMG BP4 criteria for consistent benign predictions',
        '8. Calculate prediction concordance score',
        '9. Flag discordant predictions for manual review',
        '10. Generate prediction summary with confidence scores'
      ],
      outputFormat: 'JSON object with prediction results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deleteriousPredicted', 'predictions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deleteriousPredicted: { type: 'number' },
        benignPredicted: { type: 'number' },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string' },
              cadd: { type: 'number' },
              revel: { type: 'number' },
              spliceAI: { type: 'number' },
              alphaMissense: { type: 'number' },
              consensus: { type: 'string' }
            }
          }
        },
        discordantPredictions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'in-silico-prediction']
}));

export const evidenceReviewTask = defineTask('evidence-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evidence Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Evidence Curator',
      task: 'Review literature and database evidence for variants',
      context: {
        projectName: args.projectName,
        variants: args.variants,
        phenotype: args.phenotype,
        databases: args.databases,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query ClinVar for existing classifications and review status',
        '2. Query OMIM for gene-disease associations',
        '3. Query HGMD for published disease-causing mutations',
        '4. Search PubMed for functional studies on variants',
        '5. Identify segregation data from published studies',
        '6. Evaluate case-level evidence (PS4, PM6 criteria)',
        '7. Review de novo evidence from trio studies',
        '8. Assess functional evidence from experimental studies',
        '9. Document evidence strength for each criterion',
        '10. Generate evidence summary with citations'
      ],
      outputFormat: 'JSON object with evidence review results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'variantsWithEvidence', 'summary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        variantsWithEvidence: { type: 'number' },
        clinvarMatches: { type: 'number' },
        literatureCount: { type: 'number' },
        summary: { type: 'object' },
        evidenceDetails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'evidence-review']
}));

export const acmgCriteriaAssessmentTask = defineTask('acmg-criteria-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `ACMG/AMP Criteria Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Molecular Geneticist',
      task: 'Classify variants according to ACMG/AMP guidelines',
      context: {
        projectName: args.projectName,
        variants: args.variants,
        predictionResult: args.predictionResult,
        evidenceResult: args.evidenceResult,
        phenotype: args.phenotype,
        inheritancePattern: args.inheritancePattern,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply pathogenic criteria:',
        '   - PVS1: Null variant in gene with LOF mechanism',
        '   - PS1-4: Strong pathogenic evidence',
        '   - PM1-6: Moderate pathogenic evidence',
        '   - PP1-5: Supporting pathogenic evidence',
        '2. Apply benign criteria:',
        '   - BA1: Allele frequency > 5%',
        '   - BS1-4: Strong benign evidence',
        '   - BP1-7: Supporting benign evidence',
        '3. Combine criteria using ACMG combining rules',
        '4. Assign final classification:',
        '   - Pathogenic (P)',
        '   - Likely Pathogenic (LP)',
        '   - Variant of Uncertain Significance (VUS)',
        '   - Likely Benign (LB)',
        '   - Benign (B)',
        '5. Document rationale for each criterion applied',
        '6. Flag uncertain criteria for review',
        '7. Generate classification summary',
        '8. Create detailed evidence table for each variant'
      ],
      outputFormat: 'JSON object with ACMG classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'classifiedVariants', 'pathogenicCount', 'vusCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        classifiedVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string' },
              gene: { type: 'string' },
              hgvsc: { type: 'string' },
              hgvsp: { type: 'string' },
              classification: { type: 'string' },
              appliedCriteria: { type: 'array' },
              clinicalSignificance: { type: 'string' }
            }
          }
        },
        pathogenicCount: { type: 'number' },
        likelyPathogenicCount: { type: 'number' },
        vusCount: { type: 'number' },
        likelyBenignCount: { type: 'number' },
        benignCount: { type: 'number' },
        criteriaBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'acmg-classification']
}));

export const inheritanceAnalysisTask = defineTask('inheritance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inheritance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Genetics Specialist',
      task: 'Analyze variants for inheritance pattern consistency',
      context: {
        projectName: args.projectName,
        classifiedVariants: args.classifiedVariants,
        phenotype: args.phenotype,
        inheritancePattern: args.inheritancePattern,
        familyHistory: args.familyHistory,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate variants for consistency with expected inheritance:',
        '   - Autosomal dominant: heterozygous pathogenic variants',
        '   - Autosomal recessive: homozygous or compound heterozygous',
        '   - X-linked: consider sex of patient',
        '   - Mitochondrial: consider heteroplasmy',
        '2. Identify compound heterozygous pairs for recessive genes',
        '3. Check phase of variants (cis vs trans) when family data available',
        '4. Evaluate de novo status if parental data available',
        '5. Check segregation with disease in family',
        '6. Flag variants inconsistent with reported inheritance',
        '7. Identify potential reduced penetrance scenarios',
        '8. Generate inheritance analysis summary'
      ],
      outputFormat: 'JSON object with inheritance analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'consistentVariants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        consistentVariants: { type: 'number' },
        inconsistentVariants: { type: 'number' },
        compoundHeterozygousPairs: { type: 'array' },
        deNovoVariants: { type: 'array' },
        segregationEvidence: { type: 'array' },
        inheritanceSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'inheritance-analysis']
}));

export const clinicalCorrelationTask = defineTask('clinical-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clinical Correlation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Phenotype Correlation Specialist',
      task: 'Correlate variants with clinical phenotype',
      context: {
        projectName: args.projectName,
        classifiedVariants: args.classifiedVariants,
        phenotype: args.phenotype,
        inheritanceResult: args.inheritanceResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map phenotype to HPO (Human Phenotype Ontology) terms',
        '2. Query gene-phenotype databases (OMIM, OrphaNet)',
        '3. Calculate phenotype match score for each variant',
        '4. Identify variants with strong phenotype correlation',
        '5. Flag variants associated with different phenotypes',
        '6. Consider variable expressivity and phenotype spectrum',
        '7. Evaluate timing of symptom onset vs expected',
        '8. Assess multi-system involvement patterns',
        '9. Generate phenotype correlation matrix',
        '10. Rank variants by clinical relevance'
      ],
      outputFormat: 'JSON object with clinical correlation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phenotypeMatchCount', 'correlationScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        phenotypeMatchCount: { type: 'number' },
        correlationScore: { type: 'number' },
        hpoTerms: { type: 'array' },
        variantCorrelations: { type: 'array' },
        phenotypeMismatches: { type: 'array' },
        rankedVariants: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'phenotype-correlation']
}));

export const actionabilityAssessmentTask = defineTask('actionability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Actionability Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Actionability Specialist',
      task: 'Assess clinical actionability of identified variants',
      context: {
        projectName: args.projectName,
        classifiedVariants: args.classifiedVariants,
        correlationResult: args.correlationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify variants in ACMG Secondary Findings genes (SF v3.2)',
        '2. Check for variants with established clinical management guidelines',
        '3. Query ClinGen actionability database',
        '4. Assess availability of targeted therapies',
        '5. Identify variants relevant for genetic counseling',
        '6. Evaluate cascade testing recommendations for family',
        '7. Assess surveillance recommendations',
        '8. Identify variants relevant for reproductive counseling',
        '9. Generate management recommendations',
        '10. Create actionable findings summary'
      ],
      outputFormat: 'JSON object with actionability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actionableVariants', 'actionableFindings', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actionableVariants: { type: 'number' },
        actionableFindings: { type: 'array' },
        secondaryFindings: { type: 'array' },
        recommendations: { type: 'array' },
        cascadeTestingRecommended: { type: 'boolean' },
        treatmentOptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'actionability']
}));

export const generateClinicalReportTask = defineTask('generate-clinical-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Clinical Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Genomics Report Writer',
      task: 'Generate comprehensive clinical variant interpretation report',
      context: {
        projectName: args.projectName,
        phenotype: args.phenotype,
        inheritancePattern: args.inheritancePattern,
        acmgResult: args.acmgResult,
        inheritanceResult: args.inheritanceResult,
        correlationResult: args.correlationResult,
        actionabilityResult: args.actionabilityResult,
        predictionResult: args.predictionResult,
        evidenceResult: args.evidenceResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document patient information and indication for testing',
        '3. Report primary findings (pathogenic/likely pathogenic)',
        '4. Report variants of uncertain significance (selective)',
        '5. Report secondary findings if applicable',
        '6. Include detailed variant tables with evidence',
        '7. Document ACMG criteria applied for each variant',
        '8. Provide interpretation and clinical correlation',
        '9. Include recommendations and management guidance',
        '10. Add methodology section and limitations',
        '11. Generate report in clinical format',
        '12. Create structured JSON report for EHR integration'
      ],
      outputFormat: 'JSON object with report paths and content'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'primaryFindings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        jsonReportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        primaryFindings: { type: 'array' },
        secondaryFindings: { type: 'array' },
        vusReported: { type: 'array' },
        recommendations: { type: 'array' },
        limitations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'clinical-interpretation', 'report-generation']
}));
