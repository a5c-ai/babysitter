/**
 * @process specializations/domains/science/bioinformatics/protein-structure-prediction
 * @description Protein Structure Prediction - Computational prediction of protein 3D structures using
 * AlphaFold, RoseTTAFold, and homology modeling approaches. Includes structure validation and quality assessment.
 * @inputs { projectName: string, sequences: array, modelingMethod?: string, outputDir?: string }
 * @outputs { success: boolean, structures: array, qualityScores: object, functionalAnnotations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/protein-structure-prediction', {
 *   projectName: 'Drug Target Structure Prediction',
 *   sequences: [{ id: 'protein1', sequence: 'MKTAY...' }],
 *   modelingMethod: 'AlphaFold'
 * });
 *
 * @references
 * - AlphaFold: https://alphafold.ebi.ac.uk/
 * - RoseTTAFold: https://github.com/RosettaCommons/RoseTTAFold
 * - SWISS-MODEL: https://swissmodel.expasy.org/
 * - MolProbity: http://molprobity.biochem.duke.edu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sequences = [],
    modelingMethod = 'AlphaFold', // 'AlphaFold', 'RoseTTAFold', 'SWISS-MODEL', 'I-TASSER'
    outputDir = 'structure-output',
    templateSearch = true,
    qualityThreshold = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Protein Structure Prediction for ${projectName}`);
  ctx.log('info', `Sequences: ${sequences.length}, Method: ${modelingMethod}`);

  // Phase 1: Sequence Analysis
  const seqAnalysisResult = await ctx.task(sequenceAnalysisTask, { projectName, sequences, outputDir });
  artifacts.push(...seqAnalysisResult.artifacts);

  // Phase 2: Template Search (if applicable)
  let templateResult = null;
  if (templateSearch) {
    templateResult = await ctx.task(templateSearchTask, { projectName, sequences, outputDir });
    artifacts.push(...templateResult.artifacts);
  }

  // Phase 3: Structure Prediction
  const predictionResult = await ctx.task(structurePredictionTask, { projectName, sequences, modelingMethod, templates: templateResult?.templates, outputDir });
  artifacts.push(...predictionResult.artifacts);

  await ctx.breakpoint({
    question: `Structure prediction complete for ${predictionResult.structuresGenerated} proteins. Average pLDDT: ${predictionResult.averagePLDDT}. Review structures?`,
    title: 'Structure Prediction Review',
    context: { runId: ctx.runId, structures: predictionResult.structures, qualityScores: predictionResult.qualityScores, files: predictionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 4: Structure Refinement
  const refinementResult = await ctx.task(structureRefinementTask, { projectName, structures: predictionResult.structures, outputDir });
  artifacts.push(...refinementResult.artifacts);

  // Phase 5: Quality Assessment
  const qualityResult = await ctx.task(structureQualityAssessmentTask, { projectName, structures: refinementResult.refinedStructures, qualityThreshold, outputDir });
  artifacts.push(...qualityResult.artifacts);

  // Phase 6: Binding Site Identification
  const bindingSiteResult = await ctx.task(bindingSiteIdentificationTask, { projectName, structures: refinementResult.refinedStructures, outputDir });
  artifacts.push(...bindingSiteResult.artifacts);

  // Phase 7: Functional Annotation
  const annotationResult = await ctx.task(structureFunctionalAnnotationTask, { projectName, structures: refinementResult.refinedStructures, bindingSites: bindingSiteResult.bindingSites, outputDir });
  artifacts.push(...annotationResult.artifacts);

  // Phase 8: Report Generation
  const reportResult = await ctx.task(generateStructureReportTask, { projectName, seqAnalysisResult, predictionResult, refinementResult, qualityResult, bindingSiteResult, annotationResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Protein Structure Analysis Complete. ${qualityResult.highQualityStructures} high-quality structures, ${bindingSiteResult.totalSites} binding sites identified. Approve results?`,
    title: 'Structure Analysis Complete',
    context: { runId: ctx.runId, summary: { structures: predictionResult.structuresGenerated, highQuality: qualityResult.highQualityStructures, bindingSites: bindingSiteResult.totalSites }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    modelingMethod,
    structures: refinementResult.refinedStructures,
    qualityScores: qualityResult.scores,
    bindingSites: bindingSiteResult.bindingSites,
    functionalAnnotations: annotationResult.annotations,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/protein-structure-prediction', timestamp: startTime, modelingMethod }
  };
}

// Task Definitions
export const sequenceAnalysisTask = defineTask('sequence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sequence Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Protein Sequence Analyst',
      task: 'Analyze input protein sequences',
      context: args,
      instructions: ['1. Validate input sequences', '2. Calculate sequence properties (length, MW, pI)', '3. Predict secondary structure', '4. Identify domains and motifs', '5. Generate MSA for each sequence'],
      outputFormat: 'JSON object with sequence analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'sequenceProperties', 'artifacts'], properties: { success: { type: 'boolean' }, sequenceProperties: { type: 'array' }, domains: { type: 'array' }, secondaryStructure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'sequence-analysis']
}));

export const templateSearchTask = defineTask('template-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Template Search - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Homology Specialist',
      task: 'Search for structural templates',
      context: args,
      instructions: ['1. Search PDB for homologous structures', '2. Rank templates by sequence identity and coverage', '3. Assess template quality', '4. Select best templates', '5. Generate template alignment'],
      outputFormat: 'JSON object with template search results'
    },
    outputSchema: { type: 'object', required: ['success', 'templates', 'artifacts'], properties: { success: { type: 'boolean' }, templates: { type: 'array' }, coverageStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'template-search']
}));

export const structurePredictionTask = defineTask('structure-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structure Prediction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Prediction Specialist',
      task: 'Predict 3D protein structures',
      context: args,
      instructions: ['1. Run structure prediction (AlphaFold/RoseTTAFold)', '2. Generate multiple models if applicable', '3. Calculate confidence scores (pLDDT)', '4. Identify low-confidence regions', '5. Export PDB structures'],
      outputFormat: 'JSON object with predicted structures'
    },
    outputSchema: { type: 'object', required: ['success', 'structures', 'structuresGenerated', 'averagePLDDT', 'qualityScores', 'artifacts'], properties: { success: { type: 'boolean' }, structures: { type: 'array' }, structuresGenerated: { type: 'number' }, averagePLDDT: { type: 'number' }, qualityScores: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'modeling']
}));

export const structureRefinementTask = defineTask('structure-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structure Refinement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Refinement Specialist',
      task: 'Refine and optimize predicted structures',
      context: args,
      instructions: ['1. Perform energy minimization', '2. Fix steric clashes', '3. Optimize side chain conformations', '4. Refine loop regions', '5. Validate refined structures'],
      outputFormat: 'JSON object with refined structures'
    },
    outputSchema: { type: 'object', required: ['success', 'refinedStructures', 'artifacts'], properties: { success: { type: 'boolean' }, refinedStructures: { type: 'array' }, energyImprovement: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'refinement']
}));

export const structureQualityAssessmentTask = defineTask('structure-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Validation Specialist',
      task: 'Assess structure quality',
      context: args,
      instructions: ['1. Run MolProbity validation', '2. Calculate Ramachandran statistics', '3. Assess clash scores', '4. Calculate QMEAN/ProSA scores', '5. Classify structures by quality'],
      outputFormat: 'JSON object with quality assessment'
    },
    outputSchema: { type: 'object', required: ['success', 'scores', 'highQualityStructures', 'artifacts'], properties: { success: { type: 'boolean' }, scores: { type: 'object' }, highQualityStructures: { type: 'number' }, ramachandranStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'quality-assessment']
}));

export const bindingSiteIdentificationTask = defineTask('binding-site-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Binding Site Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Binding Site Prediction Specialist',
      task: 'Identify potential binding sites',
      context: args,
      instructions: ['1. Predict binding pockets (fpocket, SiteMap)', '2. Identify catalytic sites', '3. Predict ligand binding sites', '4. Calculate druggability scores', '5. Characterize binding site properties'],
      outputFormat: 'JSON object with binding sites'
    },
    outputSchema: { type: 'object', required: ['success', 'bindingSites', 'totalSites', 'artifacts'], properties: { success: { type: 'boolean' }, bindingSites: { type: 'array' }, totalSites: { type: 'number' }, druggableSites: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'binding-sites']
}));

export const structureFunctionalAnnotationTask = defineTask('structure-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Functional Annotation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Annotation Specialist',
      task: 'Annotate structure function from 3D information',
      context: args,
      instructions: ['1. Compare to known structures (Dali, TM-align)', '2. Transfer functional annotations', '3. Predict protein function', '4. Identify conserved residues', '5. Generate annotation summary'],
      outputFormat: 'JSON object with functional annotations'
    },
    outputSchema: { type: 'object', required: ['success', 'annotations', 'artifacts'], properties: { success: { type: 'boolean' }, annotations: { type: 'array' }, structuralSimilarity: { type: 'array' }, conservedResidues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'annotation']
}));

export const generateStructureReportTask = defineTask('generate-structure-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Analysis Report Specialist',
      task: 'Generate comprehensive structure prediction report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present predicted structures', '3. Show quality metrics', '4. Include binding site analysis', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'structure-prediction', 'report-generation']
}));
