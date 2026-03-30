/**
 * @process specializations/domains/science/bioinformatics/reproducible-research
 * @description Reproducible Research Workflows - Developing portable, reproducible bioinformatics
 * workflows using workflow managers (Nextflow, Snakemake) with containerization and versioning.
 * @inputs { projectName: string, workflowType: string, tools: array, containerEngine?: string, outputDir?: string }
 * @outputs { success: boolean, workflowFiles: array, containerImages: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/reproducible-research', {
 *   projectName: 'WGS Reproducible Pipeline',
 *   workflowType: 'nextflow',
 *   tools: ['bwa-mem2', 'gatk4', 'bcftools'],
 *   containerEngine: 'docker'
 * });
 *
 * @references
 * - Nextflow: https://www.nextflow.io/
 * - Snakemake: https://snakemake.readthedocs.io/
 * - nf-core: https://nf-co.re/
 * - BioContainers: https://biocontainers.pro/
 * - Conda/Bioconda: https://bioconda.github.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    workflowType = 'nextflow', // 'nextflow', 'snakemake', 'cwl', 'wdl'
    tools,
    containerEngine = 'docker', // 'docker', 'singularity', 'podman'
    outputDir = 'reproducible-output',
    includeTests = true,
    publishRegistry = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Reproducible Research Workflow for ${projectName}`);
  ctx.log('info', `Workflow: ${workflowType}, Container: ${containerEngine}, Tools: ${tools.length}`);

  // Phase 1: Workflow Architecture Design
  const architectureResult = await ctx.task(workflowArchitectureTask, { projectName, workflowType, tools, outputDir });
  artifacts.push(...architectureResult.artifacts);

  // Phase 2: Tool Dependency Resolution
  const dependencyResult = await ctx.task(dependencyResolutionTask, { projectName, tools, workflowType, outputDir });
  artifacts.push(...dependencyResult.artifacts);

  await ctx.breakpoint({
    question: `Workflow architecture defined. ${architectureResult.modules} modules, ${dependencyResult.resolvedTools} tools resolved. Review architecture?`,
    title: 'Workflow Architecture Review',
    context: { runId: ctx.runId, architecture: architectureResult.design, dependencies: dependencyResult.summary, files: architectureResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label })) }
  });

  // Phase 3: Container Definition
  const containerResult = await ctx.task(containerDefinitionTask, { projectName, dependencies: dependencyResult.resolved, containerEngine, outputDir });
  artifacts.push(...containerResult.artifacts);

  // Phase 4: Workflow Implementation
  const implementationResult = await ctx.task(workflowImplementationTask, { projectName, workflowType, architecture: architectureResult.design, containers: containerResult.images, outputDir });
  artifacts.push(...implementationResult.artifacts);

  // Phase 5: Configuration Management
  const configResult = await ctx.task(configurationManagementTask, { projectName, workflowType, outputDir });
  artifacts.push(...configResult.artifacts);

  ctx.log('info', `Implementation complete. ${implementationResult.processCount} processes, ${configResult.profiles} profiles`);

  // Phase 6: Test Data and Validation
  let testResult = null;
  if (includeTests) {
    testResult = await ctx.task(testDataValidationTask, { projectName, workflowType, workflow: implementationResult.workflow, outputDir });
    artifacts.push(...testResult.artifacts);
  }

  // Phase 7: Documentation Generation
  const docsResult = await ctx.task(documentationGenerationTask, { projectName, workflowType, architecture: architectureResult.design, implementation: implementationResult, outputDir });
  artifacts.push(...docsResult.artifacts);

  // Phase 8: Version Control Setup
  const vcsResult = await ctx.task(versionControlSetupTask, { projectName, workflowType, outputDir });
  artifacts.push(...vcsResult.artifacts);

  // Phase 9: CI/CD Pipeline
  const cicdResult = await ctx.task(cicdPipelineTask, { projectName, workflowType, containerEngine, testResult, outputDir });
  artifacts.push(...cicdResult.artifacts);

  // Phase 10: Registry Publication (if specified)
  let publishResult = null;
  if (publishRegistry) {
    publishResult = await ctx.task(registryPublicationTask, { projectName, workflowType, registry: publishRegistry, containers: containerResult.images, outputDir });
    artifacts.push(...publishResult.artifacts);
  }

  // Phase 11: Reproducibility Report
  const reportResult = await ctx.task(generateReproducibilityReportTask, { projectName, workflowType, architectureResult, containerResult, implementationResult, testResult, docsResult, outputDir });
  artifacts.push(...reportResult.artifacts);

  await ctx.breakpoint({
    question: `Reproducible Workflow Complete. ${implementationResult.processCount} processes, ${containerResult.imageCount} containers, tests: ${testResult?.passed || 'N/A'}. Approve workflow?`,
    title: 'Reproducible Workflow Complete',
    context: { runId: ctx.runId, summary: { processes: implementationResult.processCount, containers: containerResult.imageCount, testsPassed: testResult?.passed }, files: [{ path: reportResult.reportPath, format: 'markdown', label: 'Reproducibility Report' }] }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    workflowType,
    workflowFiles: implementationResult.files,
    containerImages: containerResult.images,
    documentation: docsResult.docs,
    testResults: testResult?.results || null,
    cicdPipeline: cicdResult.pipeline,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/science/bioinformatics/reproducible-research', timestamp: startTime, workflowType, containerEngine }
  };
}

// Task Definitions
export const workflowArchitectureTask = defineTask('workflow-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Workflow Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Workflow Architecture Specialist',
      task: 'Design reproducible workflow architecture',
      context: args,
      instructions: ['1. Define workflow modules and processes', '2. Design data flow between steps', '3. Identify parallelization opportunities', '4. Define input/output channels', '5. Generate architecture diagram'],
      outputFormat: 'JSON object with workflow architecture'
    },
    outputSchema: { type: 'object', required: ['success', 'design', 'modules', 'artifacts'], properties: { success: { type: 'boolean' }, design: { type: 'object' }, modules: { type: 'number' }, dataFlows: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'architecture']
}));

export const dependencyResolutionTask = defineTask('dependency-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dependency Resolution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dependency Resolution Specialist',
      task: 'Resolve tool dependencies and versions',
      context: args,
      instructions: ['1. Identify all tool dependencies', '2. Pin specific versions', '3. Resolve conflicts', '4. Create environment specifications', '5. Generate dependency manifest'],
      outputFormat: 'JSON object with resolved dependencies'
    },
    outputSchema: { type: 'object', required: ['success', 'resolved', 'resolvedTools', 'summary', 'artifacts'], properties: { success: { type: 'boolean' }, resolved: { type: 'array' }, resolvedTools: { type: 'number' }, conflicts: { type: 'array' }, summary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'dependencies']
}));

export const containerDefinitionTask = defineTask('container-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Container Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Engineering Specialist',
      task: 'Create container definitions for tools',
      context: args,
      instructions: ['1. Create Dockerfile/Singularity definitions', '2. Use BioContainers base images', '3. Optimize layer caching', '4. Define multi-stage builds', '5. Generate container manifests'],
      outputFormat: 'JSON object with container definitions'
    },
    outputSchema: { type: 'object', required: ['success', 'images', 'imageCount', 'artifacts'], properties: { success: { type: 'boolean' }, images: { type: 'array' }, imageCount: { type: 'number' }, dockerfiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'containers']
}));

export const workflowImplementationTask = defineTask('workflow-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Workflow Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Workflow Implementation Specialist',
      task: 'Implement workflow in target language',
      context: args,
      instructions: ['1. Implement processes/rules', '2. Define channels/wildcards', '3. Add error handling', '4. Implement checkpointing', '5. Generate workflow files'],
      outputFormat: 'JSON object with implementation'
    },
    outputSchema: { type: 'object', required: ['success', 'workflow', 'files', 'processCount', 'artifacts'], properties: { success: { type: 'boolean' }, workflow: { type: 'string' }, files: { type: 'array' }, processCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'implementation']
}));

export const configurationManagementTask = defineTask('configuration-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configuration Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Configuration Management Specialist',
      task: 'Create configuration profiles',
      context: args,
      instructions: ['1. Create default configuration', '2. Define compute profiles', '3. Create institutional profiles', '4. Add cloud execution configs', '5. Generate config documentation'],
      outputFormat: 'JSON object with configurations'
    },
    outputSchema: { type: 'object', required: ['success', 'profiles', 'artifacts'], properties: { success: { type: 'boolean' }, profiles: { type: 'number' }, configFiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'configuration']
}));

export const testDataValidationTask = defineTask('test-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Data Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Validation Specialist',
      task: 'Create test data and validate workflow',
      context: args,
      instructions: ['1. Create minimal test dataset', '2. Define expected outputs', '3. Run workflow test', '4. Validate outputs', '5. Generate test report'],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: { type: 'object', required: ['success', 'passed', 'results', 'artifacts'], properties: { success: { type: 'boolean' }, passed: { type: 'boolean' }, results: { type: 'object' }, testData: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'testing']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Generate comprehensive workflow documentation',
      context: args,
      instructions: ['1. Create README with usage examples', '2. Document all parameters', '3. Generate API documentation', '4. Create quickstart guide', '5. Add troubleshooting section'],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: { type: 'object', required: ['success', 'docs', 'artifacts'], properties: { success: { type: 'boolean' }, docs: { type: 'object' }, readmePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'documentation']
}));

export const versionControlSetupTask = defineTask('version-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Control Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Version Control Specialist',
      task: 'Setup version control and release management',
      context: args,
      instructions: ['1. Initialize git repository', '2. Create .gitignore', '3. Setup semantic versioning', '4. Create CHANGELOG template', '5. Add contribution guidelines'],
      outputFormat: 'JSON object with VCS setup'
    },
    outputSchema: { type: 'object', required: ['success', 'artifacts'], properties: { success: { type: 'boolean' }, repoPath: { type: 'string' }, version: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'version-control']
}));

export const cicdPipelineTask = defineTask('cicd-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI/CD Pipeline - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD Pipeline Specialist',
      task: 'Create CI/CD pipeline for workflow',
      context: args,
      instructions: ['1. Create GitHub Actions workflow', '2. Add linting checks', '3. Setup test execution', '4. Configure container builds', '5. Add release automation'],
      outputFormat: 'JSON object with CI/CD config'
    },
    outputSchema: { type: 'object', required: ['success', 'pipeline', 'artifacts'], properties: { success: { type: 'boolean' }, pipeline: { type: 'object' }, workflowFiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'cicd']
}));

export const registryPublicationTask = defineTask('registry-publication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry Publication - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Registry Publication Specialist',
      task: 'Publish workflow to registries',
      context: args,
      instructions: ['1. Prepare for nf-core/Snakemake catalog', '2. Push containers to registry', '3. Create release artifacts', '4. Generate DOI', '5. Submit to workflow registry'],
      outputFormat: 'JSON object with publication status'
    },
    outputSchema: { type: 'object', required: ['success', 'published', 'artifacts'], properties: { success: { type: 'boolean' }, published: { type: 'boolean' }, registryUrl: { type: 'string' }, doi: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'publication']
}));

export const generateReproducibilityReportTask = defineTask('generate-reproducibility-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reproducibility Report Specialist',
      task: 'Generate comprehensive reproducibility report',
      context: args,
      instructions: ['1. Create executive summary', '2. Document all dependencies', '3. Include container specifications', '4. Present test results', '5. Add usage instructions'],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: { type: 'object', required: ['success', 'reportPath', 'artifacts'], properties: { success: { type: 'boolean' }, reportPath: { type: 'string' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bioinformatics', 'reproducible-research', 'report-generation']
}));
