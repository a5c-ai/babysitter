/**
 * @process specializations/domains/science/bioinformatics/molecular-docking
 * @description Molecular Docking and Virtual Screening - Computational docking of small molecules to
 * protein targets for drug discovery and lead optimization. Includes virtual screening of compound libraries.
 * @inputs { projectName: string, proteinStructure: string, ligands: array, dockingMethod?: string, outputDir?: string }
 * @outputs { success: boolean, dockingResults: array, topCompounds: array, admetPredictions: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/molecular-docking', {
 *   projectName: 'Drug Discovery Campaign',
 *   proteinStructure: '/data/target.pdb',
 *   ligands: ['/data/compound_library.sdf'],
 *   dockingMethod: 'AutoDock-Vina'
 * });
 *
 * @references
 * - AutoDock Vina: https://vina.scripps.edu/
 * - GOLD: https://www.ccdc.cam.ac.uk/solutions/csd-discovery/components/gold/
 * - Glide: https://www.schrodinger.com/products/glide
 * - SwissADME: http://www.swissadme.ch/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    proteinStructure,
    ligands = [],
    dockingMethod = 'AutoDock-Vina', // 'AutoDock-Vina', 'GOLD', 'Glide', 'AutoDock-GPU'
    bindingSite = null,
    outputDir = 'docking-output',
    exhaustiveness = 8,
    topCompoundsCount = 100
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Molecular Docking for ${projectName}`);
  ctx.log('info', `Protein: ${proteinStructure}, Ligands: ${ligands.length}, Method: ${dockingMethod}`);

  // Phase 1: Protein Preparation
  const proteinPrepResult = await ctx.task(proteinPreparationTask, { projectName, proteinStructure, outputDir });
  artifacts.push(...proteinPrepResult.artifacts);

  // Phase 2: Binding Site Definition
  const bindingSiteResult = await ctx.task(bindingSiteDefinitionTask, { projectName, preparedProtein: proteinPrepResult.preparedProtein, bindingSite, outputDir });
  artifacts.push(...bindingSiteResult.artifacts);

  await ctx.breakpoint({
    question: `Binding site defined. Grid center: ${JSON.stringify(bindingSiteResult.gridCenter)}. Box size: ${JSON.stringify(bindingSiteResult.boxSize)}. Proceed with ligand preparation?`,
    title: 'Binding Site Review',
    context: { runId: ctx.runId, bindingSite: bindingSiteResult, files: bindingSiteResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Ligand Preparation
  const ligandPrepResult = await ctx.task(ligandPreparationTask, { projectName, ligands, outputDir });
  artifacts.push(...ligandPrepResult.artifacts);

  ctx.log('info', `Prepared ${ligandPrepResult.ligandsReady} ligands for docking`);

  // Phase 4: Molecular Docking
  const dockingResult = await ctx.task(molecularDockingTask, { projectName, preparedProtein: proteinPrepResult.preparedProtein, bindingSite: bindingSiteResult, preparedLigands: ligandPrepResult.preparedLigands, dockingMethod, exhaustiveness, outputDir });
  artifacts.push(...dockingResult.artifacts);

  await ctx.breakpoint({
    question: `Docking complete. ${dockingResult.compoundsDocked} compounds docked. Top score: ${dockingResult.topScore}. Review docking results?`,
    title: 'Docking Results Review',
    context: { runId: ctx.runId, topCompounds: dockingResult.topCompounds.slice(0, 20), scoreDistribution: dockingResult.scoreDistribution, files: dockingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 5: Pose Analysis
  const poseAnalysisResult = await ctx.task(poseAnalysisTask, { projectName, dockingResults: dockingResult.results, proteinStructure: proteinPrepResult.preparedProtein, topCompoundsCount, outputDir });
  artifacts.push(...poseAnalysisResult.artifacts);

  // Phase 6: Binding Affinity Prediction
  const affinityResult = await ctx.task(bindingAffinityPredictionTask, { projectName, topPoses: poseAnalysisResult.topPoses, outputDir });
  artifacts.push(...affinityResult.artifacts);

  // Phase 7: ADMET Prediction
  const admetResult = await ctx.task(admetPredictionTask, { projectName, topCompounds: poseAnalysisResult.topPoses, outputDir });
  artifacts.push(...admetResult.artifacts);

  // Phase 8: Lead Prioritization
  const prioritizationResult = await ctx.task(leadPrioritizationTask, { projectName, dockingScores: dockingResult.results, affinityPredictions: affinityResult.predictions, admetResults: admetResult.predictions, topCompoundsCount, outputDir });
  artifacts.push(...prioritizationResult.artifacts);

  // Phase 9: Report Generation
  const reportResult = await ctx.task(generateDockingReportTask, { projectName, proteinPrepResult, bindingSiteResult, dockingResult, poseAnalysisResult, affinityResult, admetResult, prioritizationResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Virtual Screening Complete. ${prioritizationResult.leadCandidates.length} lead candidates identified. Approve results?`,
    title: 'Virtual Screening Complete',
    context: { runId: ctx.runId, summary: { compoundsDocked: dockingResult.compoundsDocked, leadCandidates: prioritizationResult.leadCandidates.length, topScore: dockingResult.topScore }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    dockingMethod,
    compoundsDocked: dockingResult.compoundsDocked,
    dockingResults: dockingResult.results.slice(0, topCompoundsCount),
    topCompounds: prioritizationResult.leadCandidates,
    admetPredictions: admetResult.predictions,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/molecular-docking', timestamp: startTime, dockingMethod }
  };
}

// Task Definitions
export const proteinPreparationTask = defineTask('protein-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protein Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Protein Preparation Specialist',
      task: 'Prepare protein structure for docking',
      context: args,
      instructions: ['1. Remove water molecules and heteroatoms', '2. Add hydrogen atoms', '3. Assign partial charges', '4. Fix missing residues/atoms', '5. Optimize hydrogen bonding network'],
      outputFormat: 'JSON object with prepared protein'
    },
    outputSchema: { type: 'object', required: ['success', 'preparedProtein', 'artifacts'], properties: { success: { type: 'boolean' }, preparedProtein: { type: 'string' }, preparationLog: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'protein-preparation']
}));

export const bindingSiteDefinitionTask = defineTask('binding-site-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Binding Site Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Binding Site Specialist',
      task: 'Define docking binding site',
      context: args,
      instructions: ['1. Identify binding site from structure or co-crystal', '2. Define grid box center coordinates', '3. Set appropriate box dimensions', '4. Validate binding site coverage', '5. Generate grid parameter files'],
      outputFormat: 'JSON object with binding site definition'
    },
    outputSchema: { type: 'object', required: ['success', 'gridCenter', 'boxSize', 'artifacts'], properties: { success: { type: 'boolean' }, gridCenter: { type: 'array' }, boxSize: { type: 'array' }, gridFile: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'binding-site']
}));

export const ligandPreparationTask = defineTask('ligand-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ligand Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Ligand Preparation Specialist',
      task: 'Prepare ligands for docking',
      context: args,
      instructions: ['1. Read ligand structures from input files', '2. Generate 3D conformers', '3. Assign charges and atom types', '4. Generate tautomers and ionization states', '5. Filter ligands by drug-likeness'],
      outputFormat: 'JSON object with prepared ligands'
    },
    outputSchema: { type: 'object', required: ['success', 'preparedLigands', 'ligandsReady', 'artifacts'], properties: { success: { type: 'boolean' }, preparedLigands: { type: 'string' }, ligandsReady: { type: 'number' }, ligandsFiltered: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'ligand-preparation']
}));

export const molecularDockingTask = defineTask('molecular-docking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Molecular Docking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Molecular Docking Specialist',
      task: 'Perform molecular docking',
      context: args,
      instructions: ['1. Configure docking parameters', '2. Run docking for all ligands', '3. Collect docking scores', '4. Rank compounds by score', '5. Export docked poses'],
      outputFormat: 'JSON object with docking results'
    },
    outputSchema: { type: 'object', required: ['success', 'results', 'compoundsDocked', 'topScore', 'topCompounds', 'scoreDistribution', 'artifacts'], properties: { success: { type: 'boolean' }, results: { type: 'array' }, compoundsDocked: { type: 'number' }, topScore: { type: 'number' }, topCompounds: { type: 'array' }, scoreDistribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'docking']
}));

export const poseAnalysisTask = defineTask('pose-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pose Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pose Analysis Specialist',
      task: 'Analyze docked poses',
      context: args,
      instructions: ['1. Analyze binding interactions (H-bonds, hydrophobic)', '2. Calculate interaction fingerprints', '3. Cluster similar poses', '4. Identify key interactions', '5. Generate interaction visualizations'],
      outputFormat: 'JSON object with pose analysis'
    },
    outputSchema: { type: 'object', required: ['success', 'topPoses', 'artifacts'], properties: { success: { type: 'boolean' }, topPoses: { type: 'array' }, interactionAnalysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'pose-analysis']
}));

export const bindingAffinityPredictionTask = defineTask('binding-affinity-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Affinity Prediction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Binding Affinity Specialist',
      task: 'Predict binding affinities',
      context: args,
      instructions: ['1. Calculate MM-GBSA/MM-PBSA binding energies', '2. Apply machine learning scoring functions', '3. Estimate binding free energies', '4. Rank by predicted affinity', '5. Validate predictions'],
      outputFormat: 'JSON object with affinity predictions'
    },
    outputSchema: { type: 'object', required: ['success', 'predictions', 'artifacts'], properties: { success: { type: 'boolean' }, predictions: { type: 'array' }, correlationStats: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'affinity-prediction']
}));

export const admetPredictionTask = defineTask('admet-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `ADMET Prediction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADMET Prediction Specialist',
      task: 'Predict ADMET properties',
      context: args,
      instructions: ['1. Calculate physicochemical properties', '2. Predict absorption (GI, BBB, Pgp)', '3. Predict metabolism (CYP inhibition)', '4. Predict toxicity (hERG, Ames, hepatotoxicity)', '5. Calculate drug-likeness scores'],
      outputFormat: 'JSON object with ADMET predictions'
    },
    outputSchema: { type: 'object', required: ['success', 'predictions', 'artifacts'], properties: { success: { type: 'boolean' }, predictions: { type: 'object' }, flaggedCompounds: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'admet']
}));

export const leadPrioritizationTask = defineTask('lead-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lead Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lead Prioritization Specialist',
      task: 'Prioritize lead candidates',
      context: args,
      instructions: ['1. Combine docking scores, affinity, and ADMET', '2. Apply multi-parameter optimization', '3. Rank candidates by overall score', '4. Identify structurally diverse leads', '5. Generate prioritized lead list'],
      outputFormat: 'JSON object with prioritized leads'
    },
    outputSchema: { type: 'object', required: ['success', 'leadCandidates', 'artifacts'], properties: { success: { type: 'boolean' }, leadCandidates: { type: 'array' }, prioritizationCriteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'lead-prioritization']
}));

export const generateDockingReportTask = defineTask('generate-docking-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Virtual Screening Report Specialist',
      task: 'Generate comprehensive docking report',
      context: args,
      instructions: ['1. Create executive summary', '2. Present top compounds', '3. Show binding mode analysis', '4. Include ADMET summary', '5. Document methods'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'molecular-docking', 'report-generation']
}));
