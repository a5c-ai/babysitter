/**
 * @process specializations/domains/science/bioinformatics/rare-disease-diagnostics
 * @description Rare Disease Diagnostic Pipeline - Specialized workflow for diagnosing rare genetic diseases
 * using exome/genome sequencing with phenotype-driven prioritization and family-based analysis.
 * @inputs { projectName: string, proband: object, parents?: object, phenotypes: array, outputDir?: string }
 * @outputs { success: boolean, candidateVariants: array, diagnosticYield: object, report: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/rare-disease-diagnostics', {
 *   projectName: 'Rare Disease Case',
 *   proband: { id: 'PROBAND001', vcf: '/data/proband.vcf' },
 *   parents: { mother: { id: 'MOM001', vcf: '/data/mother.vcf' }, father: { id: 'DAD001', vcf: '/data/father.vcf' } },
 *   phenotypes: ['HP:0001249', 'HP:0001250', 'HP:0001263']
 * });
 *
 * @references
 * - Exomiser: https://exomiser.github.io/Exomiser/
 * - Phenomizer: https://compbio.charite.de/phenomizer/
 * - OMIM: https://www.omim.org/
 * - Orphanet: https://www.orpha.net/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    proband,
    parents = null,
    phenotypes = [],
    outputDir = 'rare-disease-output',
    referenceGenome = 'GRCh38',
    inheritanceModes = ['AD', 'AR', 'XL', 'MT', 'DN'],
    maxAF = 0.01
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const isTrio = parents?.mother && parents?.father;

  ctx.log('info', `Starting Rare Disease Diagnostics for ${projectName}`);
  ctx.log('info', `Trio analysis: ${isTrio}, Phenotypes: ${phenotypes.length} HPO terms`);

  // Phase 1: Variant Calling and QC
  const variantResult = await ctx.task(trioVariantCallingTask, { projectName, proband, parents, referenceGenome, outputDir });
  artifacts.push(...variantResult.artifacts);

  // Phase 2: Variant Filtering
  const filterResult = await ctx.task(rareDiseaseFilteringTask, { projectName, variants: variantResult.variants, maxAF, outputDir });
  artifacts.push(...filterResult.artifacts);

  ctx.log('info', `Filtering complete. ${filterResult.rareVariants} rare variants retained`);

  // Phase 3: Phenotype-Driven Prioritization
  const phenotypeResult = await ctx.task(phenotypePrioritizationTask, { projectName, variants: filterResult.filteredVariants, phenotypes, outputDir });
  artifacts.push(...phenotypeResult.artifacts);

  await ctx.breakpoint({
    question: `Phenotype prioritization complete. ${phenotypeResult.phenotypeMatchedGenes} genes match phenotype. Review prioritized candidates?`,
    title: 'Phenotype Prioritization Review',
    context: { runId: ctx.runId, topGenes: phenotypeResult.topGenes, phenotypeMatches: phenotypeResult.matches, files: phenotypeResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 4: De Novo Mutation Detection
  let deNovoResult = null;
  if (isTrio) {
    deNovoResult = await ctx.task(deNovoDetectionTask, { projectName, proband, parents, variants: filterResult.filteredVariants, outputDir });
    artifacts.push(...deNovoResult.artifacts);
    ctx.log('info', `De novo analysis: ${deNovoResult.deNovoCount} de novo variants identified`);
  }

  // Phase 5: Compound Heterozygosity Detection
  const compHetResult = await ctx.task(compoundHetDetectionTask, { projectName, variants: filterResult.filteredVariants, parents, outputDir });
  artifacts.push(...compHetResult.artifacts);

  // Phase 6: Inheritance Pattern Analysis
  const inheritanceResult = await ctx.task(inheritanceAnalysisTask, { projectName, variants: filterResult.filteredVariants, deNovoVariants: deNovoResult?.deNovoVariants, compHetPairs: compHetResult.pairs, inheritanceModes, outputDir });
  artifacts.push(...inheritanceResult.artifacts);

  // Phase 7: Variant Classification
  const classificationResult = await ctx.task(variantClassificationTask, { projectName, candidateVariants: inheritanceResult.candidates, phenotypes, outputDir });
  artifacts.push(...classificationResult.artifacts);

  await ctx.breakpoint({
    question: `Variant classification complete. ${classificationResult.pathogenicCount} pathogenic/likely pathogenic variants. Review classifications?`,
    title: 'Variant Classification Review',
    context: { runId: ctx.runId, classifications: classificationResult.summary, topCandidates: classificationResult.topCandidates, files: classificationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 8: Gene-Disease Validation
  const validationResult = await ctx.task(geneDiseaseValidationTask, { projectName, candidates: classificationResult.candidates, phenotypes, outputDir });
  artifacts.push(...validationResult.artifacts);

  // Phase 9: Clinical Report Generation
  const reportResult = await ctx.task(generateDiagnosticReportTask, { projectName, proband, phenotypes, variantResult, filterResult, phenotypeResult, deNovoResult, compHetResult, inheritanceResult, classificationResult, validationResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  // Phase 10: Reanalysis Recommendations
  const reanalysisResult = await ctx.task(reanalysisRecommendationTask, { projectName, diagnosticStatus: reportResult.diagnosticStatus, unsolved: reportResult.unsolved, outputDir });
  artifacts.push(...reanalysisResult.artifacts);

  await ctx.breakpoint({
    question: `Rare Disease Diagnostics Complete. Diagnostic status: ${reportResult.diagnosticStatus}. ${classificationResult.pathogenicCount} diagnostic candidates. Approve clinical report?`,
    title: 'Diagnostic Analysis Complete',
    context: { runId: ctx.runId, summary: { status: reportResult.diagnosticStatus, pathogenic: classificationResult.pathogenicCount, deNovo: deNovoResult?.deNovoCount || 0 }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Diagnostic Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    probandId: proband.id,
    trioAnalysis: isTrio,
    candidateVariants: classificationResult.candidates,
    diagnosticYield: {
      status: reportResult.diagnosticStatus,
      pathogenicVariants: classificationResult.pathogenicCount,
      deNovoVariants: deNovoResult?.deNovoCount || 0,
      compoundHetPairs: compHetResult.pairs.length
    },
    phenotypeMatch: phenotypeResult.phenotypeScore,
    report: { path: reportResult.reportPath, summary: reportResult.summary },
    reanalysisRecommendations: reanalysisResult.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/rare-disease-diagnostics', timestamp: startTime, trioAnalysis: isTrio }
  };
}

// Task Definitions
export const trioVariantCallingTask = defineTask('trio-variant-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trio Variant Calling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Genomics Specialist',
      task: 'Perform trio-aware variant calling',
      context: args,
      instructions: ['1. Load VCF files for proband and parents', '2. Perform joint genotyping if needed', '3. Calculate Mendelian violation rate', '4. Generate inheritance patterns', '5. Create merged family VCF'],
      outputFormat: 'JSON object with variant calling results'
    },
    outputSchema: { type: 'object', required: ['success', 'variants', 'artifacts'], properties: { success: { type: 'boolean' }, variants: { type: 'string' }, mendelianViolationRate: { type: 'number' }, totalVariants: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'variant-calling']
}));

export const rareDiseaseFilteringTask = defineTask('rare-disease-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variant Filtering - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rare Variant Filtering Specialist',
      task: 'Filter variants for rare disease analysis',
      context: args,
      instructions: ['1. Filter by population frequency (gnomAD < 0.01)', '2. Filter by variant quality', '3. Remove common benign variants', '4. Retain coding and splice variants', '5. Generate filtering statistics'],
      outputFormat: 'JSON object with filtered variants'
    },
    outputSchema: { type: 'object', required: ['success', 'filteredVariants', 'rareVariants', 'artifacts'], properties: { success: { type: 'boolean' }, filteredVariants: { type: 'string' }, rareVariants: { type: 'number' }, filteringStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'filtering']
}));

export const phenotypePrioritizationTask = defineTask('phenotype-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phenotype Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Phenotype-Genotype Correlation Specialist',
      task: 'Prioritize variants by phenotype match',
      context: args,
      instructions: ['1. Run Exomiser or similar tool', '2. Match HPO terms to gene-disease associations', '3. Score phenotype-gene concordance', '4. Rank variants by phenotype score', '5. Generate prioritized gene list'],
      outputFormat: 'JSON object with phenotype prioritization'
    },
    outputSchema: { type: 'object', required: ['success', 'phenotypeMatchedGenes', 'topGenes', 'matches', 'artifacts'], properties: { success: { type: 'boolean' }, phenotypeMatchedGenes: { type: 'number' }, topGenes: { type: 'array' }, matches: { type: 'array' }, phenotypeScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'phenotype-prioritization']
}));

export const deNovoDetectionTask = defineTask('de-novo-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `De Novo Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'De Novo Variant Specialist',
      task: 'Identify de novo mutations',
      context: args,
      instructions: ['1. Identify variants absent in parents', '2. Calculate de novo confidence', '3. Filter by read depth in trio', '4. Validate de novo calls', '5. Prioritize high-confidence de novos'],
      outputFormat: 'JSON object with de novo results'
    },
    outputSchema: { type: 'object', required: ['success', 'deNovoVariants', 'deNovoCount', 'artifacts'], properties: { success: { type: 'boolean' }, deNovoVariants: { type: 'array' }, deNovoCount: { type: 'number' }, highConfidenceCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'de-novo']
}));

export const compoundHetDetectionTask = defineTask('compound-het-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compound Het Detection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compound Heterozygosity Specialist',
      task: 'Detect compound heterozygous variants',
      context: args,
      instructions: ['1. Identify genes with multiple het variants', '2. Phase variants using parental data', '3. Verify variants are in trans', '4. Score compound het pairs', '5. Generate compound het list'],
      outputFormat: 'JSON object with compound het results'
    },
    outputSchema: { type: 'object', required: ['success', 'pairs', 'artifacts'], properties: { success: { type: 'boolean' }, pairs: { type: 'array' }, phasedGenes: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'compound-het']
}));

export const inheritanceAnalysisTask = defineTask('inheritance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inheritance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Inheritance Pattern Specialist',
      task: 'Analyze inheritance patterns',
      context: args,
      instructions: ['1. Classify by inheritance mode (AD, AR, XL)', '2. Match to known disease inheritance', '3. Score pattern consistency', '4. Identify best-fit candidates', '5. Generate inheritance summary'],
      outputFormat: 'JSON object with inheritance analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'candidates', 'artifacts'], properties: { success: { type: 'boolean' }, candidates: { type: 'array' }, inheritanceMatches: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'inheritance-analysis']
}));

export const variantClassificationTask = defineTask('variant-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variant Classification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Variant Classification Specialist',
      task: 'Classify variants using ACMG criteria',
      context: args,
      instructions: ['1. Apply ACMG/AMP criteria', '2. Consider phenotype specificity', '3. Classify pathogenicity', '4. Rank by diagnostic likelihood', '5. Generate classification report'],
      outputFormat: 'JSON object with classification results'
    },
    outputSchema: { type: 'object', required: ['success', 'candidates', 'pathogenicCount', 'summary', 'topCandidates', 'artifacts'], properties: { success: { type: 'boolean' }, candidates: { type: 'array' }, pathogenicCount: { type: 'number' }, summary: { type: 'object' }, topCandidates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'classification']
}));

export const geneDiseaseValidationTask = defineTask('gene-disease-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gene-Disease Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gene-Disease Association Specialist',
      task: 'Validate gene-disease associations',
      context: args,
      instructions: ['1. Query OMIM and Orphanet', '2. Check ClinGen gene validity', '3. Verify phenotype overlap', '4. Assess strength of association', '5. Generate validation report'],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: { type: 'object', required: ['success', 'validatedGenes', 'artifacts'], properties: { success: { type: 'boolean' }, validatedGenes: { type: 'array' }, validationSummary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'validation']
}));

export const generateDiagnosticReportTask = defineTask('generate-diagnostic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Genetics Report Specialist',
      task: 'Generate diagnostic report',
      context: args,
      instructions: ['1. Create clinical summary', '2. Present diagnostic candidates', '3. Include supporting evidence', '4. Provide recommendations', '5. Document limitations'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'diagnosticStatus', 'summary', 'unsolved', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, diagnosticStatus: { type: 'string' }, summary: { type: 'object' }, unsolved: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'report-generation']
}));

export const reanalysisRecommendationTask = defineTask('reanalysis-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reanalysis Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reanalysis Strategy Specialist',
      task: 'Generate reanalysis recommendations',
      context: args,
      instructions: ['1. Identify unsolved cases', '2. Recommend additional testing', '3. Suggest periodic reanalysis', '4. Propose research enrollment', '5. Generate reanalysis plan'],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: { type: 'object', required: ['success', 'recommendations', 'artifacts'], properties: { success: { type: 'boolean' }, recommendations: { type: 'array' }, additionalTesting: { type: 'array' }, reanalysisTimeline: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'rare-disease', 'reanalysis']
}));
