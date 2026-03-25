/**
 * @process domains/science/scientific-discovery/reproducible-research-pipeline
 * @description Establish version-controlled, documented workflows - Guides researchers through
 * creating fully reproducible research pipelines with proper version control, documentation, and automation.
 * @inputs { project: object, data: object, analyses: array, outputFormats?: array }
 * @outputs { success: boolean, pipeline: object, documentation: object, reproducibilityScore: number, recommendations: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/reproducible-research-pipeline', {
 *   project: { name: 'Climate Analysis Study', language: 'R', framework: 'targets' },
 *   data: { sources: ['weather_stations.csv', 'satellite_data.nc'], preprocessing: ['cleaning', 'imputation'] },
 *   analyses: ['descriptive_stats', 'regression_models', 'sensitivity_analysis'],
 *   outputFormats: ['pdf_report', 'html_dashboard', 'data_archive']
 * });
 *
 * @references
 * - Wilson, G. et al. (2017). Good Enough Practices in Scientific Computing
 * - Sandve, G.K. et al. (2013). Ten Simple Rules for Reproducible Computational Research
 * - Stodden, V. et al. (2014). Implementing Reproducible Research
 * - The Turing Way Community (2022). The Turing Way: A Handbook for Reproducible Data Science
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { project, data, analyses = [], outputFormats = ['pdf_report'], outputDir = 'reproducible-output', minimumReproducibilityScore = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Reproducible Research Pipeline for: ${project.name || 'Project'}`);

  const projectStructure = await ctx.task(projectStructureTask, { project, data, analyses, outputDir });
  artifacts.push(...projectStructure.artifacts);

  const versionControl = await ctx.task(versionControlTask, { project, projectStructure, outputDir });
  artifacts.push(...versionControl.artifacts);

  const environmentManagement = await ctx.task(environmentManagementTask, { project, dependencies: projectStructure.dependencies, outputDir });
  artifacts.push(...environmentManagement.artifacts);

  await ctx.breakpoint({
    question: `Project structure defined. ${projectStructure.files?.length || 0} files, ${environmentManagement.dependencies?.length || 0} dependencies. Review before data pipeline?`,
    title: 'Project Structure Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { files: projectStructure.files?.length || 0, dependencies: environmentManagement.dependencies?.length || 0 }}
  });

  const dataPipeline = await ctx.task(dataPipelineTask, { data, projectStructure, outputDir });
  artifacts.push(...dataPipeline.artifacts);

  const dataDocumentation = await ctx.task(dataDocumentationTask, { data, dataPipeline, outputDir });
  artifacts.push(...dataDocumentation.artifacts);

  const analysisPipeline = await ctx.task(analysisPipelineTask, { analyses, dataPipeline, project, outputDir });
  artifacts.push(...analysisPipeline.artifacts);

  const workflowAutomation = await ctx.task(workflowAutomationTask, { project, dataPipeline, analysisPipeline, outputDir });
  artifacts.push(...workflowAutomation.artifacts);

  const outputGeneration = await ctx.task(outputGenerationTask, { analysisPipeline, outputFormats, project, outputDir });
  artifacts.push(...outputGeneration.artifacts);

  const testingValidation = await ctx.task(pipelineTestingTask, { dataPipeline, analysisPipeline, workflowAutomation, outputDir });
  artifacts.push(...testingValidation.artifacts);

  const documentationGeneration = await ctx.task(pipelineDocumentationTask, { project, projectStructure, dataPipeline, analysisPipeline, environmentManagement, outputDir });
  artifacts.push(...documentationGeneration.artifacts);

  const reproducibilityAudit = await ctx.task(reproducibilityAuditTask, { project, versionControl, environmentManagement, dataPipeline, analysisPipeline, workflowAutomation, documentationGeneration, minimumReproducibilityScore, outputDir });
  artifacts.push(...reproducibilityAudit.artifacts);

  await ctx.breakpoint({
    question: `Pipeline complete. Reproducibility score: ${reproducibilityAudit.reproducibilityScore}/100. ${reproducibilityAudit.recommendations?.length || 0} recommendations. Approve?`,
    title: 'Reproducible Pipeline Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { reproducibilityScore: reproducibilityAudit.reproducibilityScore, recommendations: reproducibilityAudit.recommendations?.length || 0 }}
  });

  return {
    success: true, project: project.name, pipeline: { data: dataPipeline, analysis: analysisPipeline, workflow: workflowAutomation },
    documentation: documentationGeneration, reproducibilityScore: reproducibilityAudit.reproducibilityScore,
    recommendations: reproducibilityAudit.recommendations, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/reproducible-research-pipeline', timestamp: startTime, outputDir }
  };
}

export const projectStructureTask = defineTask('project-structure', (args, taskCtx) => ({
  kind: 'agent', title: 'Define project structure',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Research software engineer', task: 'Define reproducible project structure', context: args, instructions: ['Create standard directory structure', 'Define file naming conventions', 'Identify required files (README, LICENSE)', 'List dependencies', 'Create project template', 'Document structure rationale'], outputFormat: 'JSON with structure, directories, files, conventions, dependencies, template, artifacts' }, outputSchema: { type: 'object', required: ['structure', 'directories', 'files', 'artifacts'], properties: { structure: { type: 'object' }, directories: { type: 'array' }, files: { type: 'array' }, conventions: { type: 'object' }, dependencies: { type: 'array' }, template: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const versionControlTask = defineTask('version-control', (args, taskCtx) => ({
  kind: 'agent', title: 'Setup version control',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Version control specialist', task: 'Configure version control for reproducibility', context: args, instructions: ['Configure Git repository', 'Create .gitignore for data/outputs', 'Setup branching strategy', 'Configure pre-commit hooks', 'Setup data versioning (DVC/Git LFS)', 'Document version control workflow'], outputFormat: 'JSON with gitConfig, gitignore, branchingStrategy, preCommitHooks, dataVersioning, workflow, artifacts' }, outputSchema: { type: 'object', required: ['gitConfig', 'dataVersioning', 'artifacts'], properties: { gitConfig: { type: 'object' }, gitignore: { type: 'array' }, branchingStrategy: { type: 'object' }, preCommitHooks: { type: 'array' }, dataVersioning: { type: 'object' }, workflow: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const environmentManagementTask = defineTask('environment-management', (args, taskCtx) => ({
  kind: 'agent', title: 'Configure environment management',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Environment management specialist', task: 'Setup reproducible computational environment', context: args, instructions: ['Create dependency specification (requirements.txt, renv.lock, environment.yml)', 'Document exact package versions', 'Create Docker/Singularity container if appropriate', 'Setup virtual environment instructions', 'Document environment setup steps', 'Include system dependencies'], outputFormat: 'JSON with dependencies, dependencyFile, containerConfig, virtualEnvInstructions, setupSteps, systemDeps, artifacts' }, outputSchema: { type: 'object', required: ['dependencies', 'dependencyFile', 'artifacts'], properties: { dependencies: { type: 'array' }, dependencyFile: { type: 'object' }, containerConfig: { type: 'object' }, virtualEnvInstructions: { type: 'string' }, setupSteps: { type: 'array' }, systemDeps: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const dataPipelineTask = defineTask('data-pipeline', (args, taskCtx) => ({
  kind: 'agent', title: 'Design data pipeline',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Data pipeline architect', task: 'Design reproducible data pipeline', context: args, instructions: ['Define data acquisition steps', 'Create preprocessing scripts', 'Implement data validation checks', 'Setup intermediate data caching', 'Create data transformation functions', 'Document data lineage'], outputFormat: 'JSON with acquisitionSteps, preprocessingScripts, validationChecks, cachingStrategy, transformations, lineage, artifacts' }, outputSchema: { type: 'object', required: ['acquisitionSteps', 'preprocessingScripts', 'artifacts'], properties: { acquisitionSteps: { type: 'array' }, preprocessingScripts: { type: 'array' }, validationChecks: { type: 'array' }, cachingStrategy: { type: 'object' }, transformations: { type: 'array' }, lineage: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const dataDocumentationTask = defineTask('data-documentation', (args, taskCtx) => ({
  kind: 'agent', title: 'Document data',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Data documentation specialist', task: 'Create comprehensive data documentation', context: args, instructions: ['Create data dictionary', 'Document data provenance', 'Describe data cleaning decisions', 'Create codebook for variables', 'Document missing data handling', 'Specify data access/sharing terms'], outputFormat: 'JSON with dataDictionary, provenance, cleaningDecisions, codebook, missingDataHandling, accessTerms, artifacts' }, outputSchema: { type: 'object', required: ['dataDictionary', 'provenance', 'artifacts'], properties: { dataDictionary: { type: 'object' }, provenance: { type: 'object' }, cleaningDecisions: { type: 'array' }, codebook: { type: 'array' }, missingDataHandling: { type: 'object' }, accessTerms: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const analysisPipelineTask = defineTask('analysis-pipeline', (args, taskCtx) => ({
  kind: 'agent', title: 'Design analysis pipeline',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Analysis pipeline architect', task: 'Design reproducible analysis pipeline', context: args, instructions: ['Define analysis steps', 'Create modular analysis scripts', 'Implement random seed management', 'Setup parallel execution where appropriate', 'Create analysis configuration files', 'Document analysis decisions'], outputFormat: 'JSON with analysisSteps, scripts, seedManagement, parallelization, configFiles, decisions, artifacts' }, outputSchema: { type: 'object', required: ['analysisSteps', 'scripts', 'artifacts'], properties: { analysisSteps: { type: 'array' }, scripts: { type: 'array' }, seedManagement: { type: 'object' }, parallelization: { type: 'object' }, configFiles: { type: 'array' }, decisions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const workflowAutomationTask = defineTask('workflow-automation', (args, taskCtx) => ({
  kind: 'agent', title: 'Automate workflow',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Workflow automation specialist', task: 'Create automated workflow orchestration', context: args, instructions: ['Select workflow tool (Make, Snakemake, targets, Nextflow)', 'Define workflow DAG', 'Implement dependency tracking', 'Setup incremental builds', 'Create one-command execution', 'Document workflow usage'], outputFormat: 'JSON with workflowTool, workflowDAG, dependencies, incrementalBuilds, executionCommand, documentation, artifacts' }, outputSchema: { type: 'object', required: ['workflowTool', 'workflowDAG', 'executionCommand', 'artifacts'], properties: { workflowTool: { type: 'string' }, workflowDAG: { type: 'object' }, dependencies: { type: 'array' }, incrementalBuilds: { type: 'object' }, executionCommand: { type: 'string' }, documentation: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const outputGenerationTask = defineTask('output-generation', (args, taskCtx) => ({
  kind: 'agent', title: 'Configure output generation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Output generation specialist', task: 'Configure reproducible output generation', context: args, instructions: ['Setup literate programming (R Markdown, Jupyter, Quarto)', 'Configure figure generation', 'Setup table generation', 'Create output templates', 'Implement output versioning', 'Configure multiple output formats'], outputFormat: 'JSON with literateProgramming, figureGeneration, tableGeneration, templates, versioning, outputFormats, artifacts' }, outputSchema: { type: 'object', required: ['literateProgramming', 'outputFormats', 'artifacts'], properties: { literateProgramming: { type: 'object' }, figureGeneration: { type: 'object' }, tableGeneration: { type: 'object' }, templates: { type: 'array' }, versioning: { type: 'object' }, outputFormats: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const pipelineTestingTask = defineTask('pipeline-testing', (args, taskCtx) => ({
  kind: 'agent', title: 'Test pipeline',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Pipeline testing specialist', task: 'Create tests for reproducibility pipeline', context: args, instructions: ['Create unit tests for functions', 'Create integration tests for pipeline', 'Test reproducibility (same inputs = same outputs)', 'Validate data integrity checks', 'Test workflow automation', 'Create test data fixtures'], outputFormat: 'JSON with unitTests, integrationTests, reproducibilityTests, dataValidationTests, workflowTests, fixtures, artifacts' }, outputSchema: { type: 'object', required: ['unitTests', 'reproducibilityTests', 'artifacts'], properties: { unitTests: { type: 'array' }, integrationTests: { type: 'array' }, reproducibilityTests: { type: 'array' }, dataValidationTests: { type: 'array' }, workflowTests: { type: 'array' }, fixtures: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const pipelineDocumentationTask = defineTask('pipeline-documentation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate documentation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Documentation specialist', task: 'Generate comprehensive pipeline documentation', context: args, instructions: ['Create README with quick start', 'Document all analysis decisions', 'Create contributor guidelines', 'Document code structure', 'Create troubleshooting guide', 'Add citation information'], outputFormat: 'JSON with readme, analysisDecisions, contributorGuidelines, codeDocumentation, troubleshooting, citation, artifacts' }, outputSchema: { type: 'object', required: ['readme', 'analysisDecisions', 'artifacts'], properties: { readme: { type: 'string' }, analysisDecisions: { type: 'array' }, contributorGuidelines: { type: 'string' }, codeDocumentation: { type: 'object' }, troubleshooting: { type: 'array' }, citation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));

export const reproducibilityAuditTask = defineTask('reproducibility-audit', (args, taskCtx) => ({
  kind: 'agent', title: 'Audit reproducibility',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'research-software-engineer', skills: ['hypothesis-generator', 'statistical-test-selector'], prompt: { role: 'Reproducibility auditor', task: 'Audit the reproducibility of the research pipeline', context: args, instructions: ['Check version control completeness', 'Verify environment specification', 'Audit data documentation', 'Check automation coverage', 'Verify documentation completeness', 'Score reproducibility and provide recommendations'], outputFormat: 'JSON with reproducibilityScore, versionControlAudit, environmentAudit, dataAudit, automationAudit, documentationAudit, recommendations, artifacts' }, outputSchema: { type: 'object', required: ['reproducibilityScore', 'recommendations', 'artifacts'], properties: { reproducibilityScore: { type: 'number' }, versionControlAudit: { type: 'object' }, environmentAudit: { type: 'object' }, dataAudit: { type: 'object' }, automationAudit: { type: 'object' }, documentationAudit: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'reproducibility']
}));
