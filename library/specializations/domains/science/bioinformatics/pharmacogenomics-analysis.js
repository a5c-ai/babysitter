/**
 * @process specializations/domains/science/bioinformatics/pharmacogenomics-analysis
 * @description Pharmacogenomics Analysis - Analysis of genetic variants affecting drug metabolism,
 * efficacy, and adverse reactions. Supports precision medicine by identifying patient-specific
 * pharmacogenomic markers.
 * @inputs { projectName: string, sampleId: string, vcfFile?: string, drugList?: array, outputDir?: string }
 * @outputs { success: boolean, pgxGenotypes: array, drugRecommendations: array, report: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/pharmacogenomics-analysis', {
 *   projectName: 'Patient PGx Profile',
 *   sampleId: 'PATIENT001',
 *   vcfFile: '/data/patient.vcf',
 *   drugList: ['warfarin', 'clopidogrel', 'codeine', 'tamoxifen']
 * });
 *
 * @references
 * - PharmGKB: https://www.pharmgkb.org/
 * - CPIC Guidelines: https://cpicpgx.org/guidelines/
 * - PharmVar: https://www.pharmvar.org/
 * - DPWG Guidelines: https://www.knmp.nl/dossiers/farmacogenetica
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sampleId,
    vcfFile = null,
    drugList = [],
    outputDir = 'pgx-output',
    guidelines = ['CPIC', 'DPWG'],
    pgxGenes = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A5', 'SLCO1B1', 'TPMT', 'DPYD', 'UGT1A1', 'VKORC1', 'HLA-B'],
    includeResearchVariants = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const pgxGenotypes = [];
  const drugRecommendations = [];

  ctx.log('info', `Starting Pharmacogenomics Analysis for ${projectName}`);
  ctx.log('info', `Sample: ${sampleId}, Drugs: ${drugList.length > 0 ? drugList.join(', ') : 'All available'}`);

  // ============================================================================
  // PHASE 1: EXTRACT PGX VARIANTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Extracting Pharmacogenomic Variants');

  const extractionResult = await ctx.task(extractPgxVariantsTask, {
    projectName,
    sampleId,
    vcfFile,
    pgxGenes,
    outputDir
  });

  artifacts.push(...extractionResult.artifacts);

  ctx.log('info', `Extracted ${extractionResult.pgxVariants.length} PGx-relevant variants`);

  // ============================================================================
  // PHASE 2: STAR ALLELE CALLING
  // ============================================================================

  ctx.log('info', 'Phase 2: Star Allele Calling');

  const starAlleleResult = await ctx.task(starAlleleCallingTask, {
    projectName,
    sampleId,
    pgxVariants: extractionResult.pgxVariants,
    pgxGenes,
    outputDir
  });

  artifacts.push(...starAlleleResult.artifacts);

  ctx.log('info', `Star allele calling complete for ${starAlleleResult.calledGenes.length} genes`);

  // Breakpoint: Review star allele calls
  await ctx.breakpoint({
    question: `Star allele calling complete for ${starAlleleResult.calledGenes.length} PGx genes. Review star allele assignments?`,
    title: 'Star Allele Review',
    context: {
      runId: ctx.runId,
      calledGenes: starAlleleResult.calledGenes,
      diplotypes: starAlleleResult.diplotypes,
      novelAlleles: starAlleleResult.novelAlleles,
      files: starAlleleResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: DIPLOTYPE TO PHENOTYPE TRANSLATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Diplotype to Phenotype Translation');

  const phenotypeResult = await ctx.task(dipotypeToPhenotypeTask, {
    projectName,
    sampleId,
    diplotypes: starAlleleResult.diplotypes,
    outputDir
  });

  artifacts.push(...phenotypeResult.artifacts);
  pgxGenotypes.push(...phenotypeResult.phenotypes);

  ctx.log('info', `Phenotype translation complete - ${phenotypeResult.phenotypes.length} metabolizer phenotypes assigned`);

  // ============================================================================
  // PHASE 4: DRUG-GENE INTERACTION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Drug-Gene Interaction Assessment');

  const interactionResult = await ctx.task(drugGeneInteractionTask, {
    projectName,
    sampleId,
    phenotypes: phenotypeResult.phenotypes,
    drugList,
    guidelines,
    outputDir
  });

  artifacts.push(...interactionResult.artifacts);

  ctx.log('info', `Identified ${interactionResult.interactions.length} drug-gene interactions`);

  // Breakpoint: Review drug interactions
  if (interactionResult.highRiskInteractions.length > 0) {
    await ctx.breakpoint({
      question: `${interactionResult.highRiskInteractions.length} high-risk drug-gene interactions identified. Review interactions before generating recommendations?`,
      title: 'High-Risk Interaction Review',
      context: {
        runId: ctx.runId,
        highRiskInteractions: interactionResult.highRiskInteractions,
        moderateInteractions: interactionResult.moderateInteractions,
        files: interactionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: CLINICAL ACTIONABILITY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Clinical Actionability Evaluation');

  const actionabilityResult = await ctx.task(pgxActionabilityTask, {
    projectName,
    sampleId,
    phenotypes: phenotypeResult.phenotypes,
    interactions: interactionResult.interactions,
    guidelines,
    outputDir
  });

  artifacts.push(...actionabilityResult.artifacts);

  ctx.log('info', `Actionability evaluation complete - ${actionabilityResult.actionableResults} actionable findings`);

  // ============================================================================
  // PHASE 6: DOSING RECOMMENDATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Dosing Recommendations');

  const dosingResult = await ctx.task(dosingRecommendationTask, {
    projectName,
    sampleId,
    phenotypes: phenotypeResult.phenotypes,
    interactions: interactionResult.interactions,
    drugList,
    guidelines,
    outputDir
  });

  artifacts.push(...dosingResult.artifacts);
  drugRecommendations.push(...dosingResult.recommendations);

  ctx.log('info', `Generated ${dosingResult.recommendations.length} dosing recommendations`);

  // Breakpoint: Review dosing recommendations
  await ctx.breakpoint({
    question: `Dosing recommendations generated for ${dosingResult.recommendations.length} drugs. Review recommendations before finalizing report?`,
    title: 'Dosing Recommendations Review',
    context: {
      runId: ctx.runId,
      recommendations: dosingResult.recommendations,
      alternativeDrugs: dosingResult.alternativeDrugs,
      files: dosingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: GENERATE PGX REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Pharmacogenomics Report');

  const reportResult = await ctx.task(generatePgxReportTask, {
    projectName,
    sampleId,
    starAlleleResult,
    phenotypeResult,
    interactionResult,
    actionabilityResult,
    dosingResult,
    guidelines,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: Report approval
  await ctx.breakpoint({
    question: `Pharmacogenomics Report Complete for ${sampleId}. ${pgxGenotypes.length} genotypes, ${drugRecommendations.length} drug recommendations. Approve report?`,
    title: 'PGx Report Approval',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        genesAnalyzed: starAlleleResult.calledGenes.length,
        phenotypesAssigned: pgxGenotypes.length,
        drugRecommendations: drugRecommendations.length,
        highRiskInteractions: interactionResult.highRiskInteractions.length
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'PGx Report' },
        { path: reportResult.jsonReportPath, format: 'json', label: 'Structured Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    sampleId,
    pgxGenotypes: pgxGenotypes.map(g => ({
      gene: g.gene,
      diplotype: g.diplotype,
      phenotype: g.phenotype,
      activityScore: g.activityScore
    })),
    drugRecommendations: drugRecommendations.map(r => ({
      drug: r.drug,
      gene: r.gene,
      phenotype: r.phenotype,
      recommendation: r.recommendation,
      evidenceLevel: r.evidenceLevel,
      guideline: r.guideline
    })),
    interactions: {
      highRisk: interactionResult.highRiskInteractions,
      moderate: interactionResult.moderateInteractions,
      total: interactionResult.interactions.length
    },
    report: {
      reportPath: reportResult.reportPath,
      jsonReportPath: reportResult.jsonReportPath,
      executiveSummary: reportResult.executiveSummary
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/bioinformatics/pharmacogenomics-analysis',
      processSlug: 'pharmacogenomics-analysis',
      category: 'bioinformatics',
      timestamp: startTime,
      guidelines,
      pgxGenes
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const extractPgxVariantsTask = defineTask('extract-pgx-variants', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract PGx Variants - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pharmacogenomics Data Specialist',
      task: 'Extract pharmacogenomic variants from sequencing data',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        vcfFile: args.vcfFile,
        pgxGenes: args.pgxGenes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract variants in PGx gene regions from VCF file',
        '2. Query PharmVar database for known PGx allele-defining variants',
        '3. Include variants in PharmGKB clinical annotations',
        '4. Identify copy number variants for CYP2D6 and other CNV-affected genes',
        '5. Extract HLA typing results if available',
        '6. Normalize variant representation',
        '7. Annotate variants with rsIDs and functional consequences',
        '8. Flag novel variants not in PharmVar',
        '9. Calculate variant quality metrics',
        '10. Generate PGx variant summary'
      ],
      outputFormat: 'JSON object with extracted PGx variants'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pgxVariants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pgxVariants: { type: 'array' },
        genesCovered: { type: 'array' },
        novelVariants: { type: 'number' },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'variant-extraction']
}));

export const starAlleleCallingTask = defineTask('star-allele-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Star Allele Calling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PGx Allele Calling Specialist',
      task: 'Call star alleles for pharmacogenes',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        pgxVariants: args.pgxVariants,
        pgxGenes: args.pgxGenes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use PharmCAT or similar tool for star allele calling',
        '2. Call CYP2D6 alleles including gene deletions and duplications',
        '3. Call CYP2C19 alleles with attention to *17 increased function',
        '4. Call CYP2C9 alleles including *2, *3, and other reduced function',
        '5. Call other pharmacogene alleles (TPMT, DPYD, SLCO1B1, etc.)',
        '6. Handle complex alleles and suballeles',
        '7. Resolve phasing when possible from VCF data',
        '8. Assign diplotype for each gene',
        '9. Calculate confidence scores for allele calls',
        '10. Flag uncertain or ambiguous calls for review'
      ],
      outputFormat: 'JSON object with star allele calls'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'calledGenes', 'diplotypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        calledGenes: { type: 'array', items: { type: 'string' } },
        diplotypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gene: { type: 'string' },
              allele1: { type: 'string' },
              allele2: { type: 'string' },
              diplotype: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        novelAlleles: { type: 'array' },
        uncertainCalls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'star-allele-calling']
}));

export const dipotypeToPhenotypeTask = defineTask('diplotype-to-phenotype', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diplotype to Phenotype Translation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PGx Phenotype Specialist',
      task: 'Translate diplotypes to metabolizer phenotypes',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        diplotypes: args.diplotypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Look up activity scores for each allele from CPIC tables',
        '2. Calculate total activity score for diplotype',
        '3. Assign metabolizer phenotype based on activity score ranges:',
        '   - Poor Metabolizer (PM)',
        '   - Intermediate Metabolizer (IM)',
        '   - Normal Metabolizer (NM/EM)',
        '   - Rapid/Ultrarapid Metabolizer (RM/UM)',
        '4. Handle gene-specific phenotype assignments',
        '5. Account for CYP2D6 copy number in activity score',
        '6. Assign transporter function for SLCO1B1',
        '7. Assign TPMT and DPYD activity levels',
        '8. Handle VKORC1 sensitivity phenotypes',
        '9. Document phenotype assignment rationale',
        '10. Generate phenotype summary table'
      ],
      outputFormat: 'JSON object with phenotype assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phenotypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        phenotypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gene: { type: 'string' },
              diplotype: { type: 'string' },
              phenotype: { type: 'string' },
              activityScore: { type: 'number' },
              function: { type: 'string' }
            }
          }
        },
        phenotypeSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'phenotype-translation']
}));

export const drugGeneInteractionTask = defineTask('drug-gene-interaction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Drug-Gene Interaction Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Pharmacogenomics Specialist',
      task: 'Assess drug-gene interactions based on phenotypes',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        phenotypes: args.phenotypes,
        drugList: args.drugList,
        guidelines: args.guidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query CPIC guidelines for drug-gene pairs',
        '2. Query DPWG guidelines for European recommendations',
        '3. Query FDA drug labels for PGx information',
        '4. Identify high-risk interactions requiring action',
        '5. Identify moderate interactions with monitoring recommendations',
        '6. Flag drugs with boxed warnings for PGx',
        '7. Identify drugs to avoid based on phenotype',
        '8. Document evidence level for each interaction',
        '9. Calculate risk scores for interactions',
        '10. Generate interaction priority list'
      ],
      outputFormat: 'JSON object with drug-gene interactions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'interactions', 'highRiskInteractions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        interactions: { type: 'array' },
        highRiskInteractions: { type: 'array' },
        moderateInteractions: { type: 'array' },
        drugsToAvoid: { type: 'array' },
        boxedWarnings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'drug-interaction']
}));

export const pgxActionabilityTask = defineTask('pgx-actionability', (args, taskCtx) => ({
  kind: 'agent',
  title: `PGx Actionability Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical PGx Actionability Specialist',
      task: 'Evaluate clinical actionability of PGx results',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        phenotypes: args.phenotypes,
        interactions: args.interactions,
        guidelines: args.guidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess actionability using CPIC evidence levels:',
        '   - Level A: Prescribing action recommended',
        '   - Level B: Prescribing action may be warranted',
        '   - Level C: Information only',
        '2. Identify results requiring immediate clinical attention',
        '3. Identify results for medication reconciliation',
        '4. Assess impact on current medications if known',
        '5. Identify preemptive results for future prescribing',
        '6. Document guidelines supporting each recommendation',
        '7. Assess strength of recommendation',
        '8. Identify gaps in guideline coverage',
        '9. Calculate overall actionability score',
        '10. Generate actionability summary'
      ],
      outputFormat: 'JSON object with actionability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actionableResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actionableResults: { type: 'number' },
        levelAResults: { type: 'array' },
        levelBResults: { type: 'array' },
        informationalResults: { type: 'array' },
        immediateActions: { type: 'array' },
        preemptiveResults: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'actionability']
}));

export const dosingRecommendationTask = defineTask('dosing-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dosing Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Pharmacologist',
      task: 'Generate drug dosing recommendations based on PGx profile',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        phenotypes: args.phenotypes,
        interactions: args.interactions,
        drugList: args.drugList,
        guidelines: args.guidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate specific dosing recommendations from CPIC guidelines',
        '2. Include DPWG recommendations where different',
        '3. For PM phenotype drugs:',
        '   - Recommend dose reduction percentage',
        '   - Suggest alternative drugs',
        '4. For UM phenotype drugs:',
        '   - Recommend dose increase or alternatives',
        '5. Include warfarin dosing algorithm inputs',
        '6. Include clopidogrel alternative recommendations',
        '7. Include codeine/tramadol safety recommendations',
        '8. Provide evidence level for each recommendation',
        '9. Include monitoring recommendations',
        '10. Generate prioritized recommendation list'
      ],
      outputFormat: 'JSON object with dosing recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              drug: { type: 'string' },
              gene: { type: 'string' },
              phenotype: { type: 'string' },
              recommendation: { type: 'string' },
              doseAdjustment: { type: 'string' },
              evidenceLevel: { type: 'string' },
              guideline: { type: 'string' }
            }
          }
        },
        alternativeDrugs: { type: 'array' },
        monitoringRecommendations: { type: 'array' },
        contraindications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'dosing-recommendations']
}));

export const generatePgxReportTask = defineTask('generate-pgx-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate PGx Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical PGx Report Writer',
      task: 'Generate comprehensive pharmacogenomics report',
      context: {
        projectName: args.projectName,
        sampleId: args.sampleId,
        starAlleleResult: args.starAlleleResult,
        phenotypeResult: args.phenotypeResult,
        interactionResult: args.interactionResult,
        actionabilityResult: args.actionabilityResult,
        dosingResult: args.dosingResult,
        guidelines: args.guidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document patient identifier and test indication',
        '3. Report genotype results table with diplotypes',
        '4. Report phenotype interpretations',
        '5. Present drug-specific recommendations',
        '6. Include evidence levels and guideline sources',
        '7. Document high-priority findings prominently',
        '8. Include methodology and limitations',
        '9. Add resources for prescribers',
        '10. Generate report in clinical format',
        '11. Create structured JSON for EHR/CDS integration'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'jsonReportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        jsonReportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array' },
        genotypeTable: { type: 'array' },
        recommendationTable: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'pharmacogenomics', 'report-generation']
}));
