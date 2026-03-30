/**
 * @process specializations/cli-mcp-development/package-manager-publishing
 * @description Package Manager Publishing - Implement publishing workflows for npm, PyPI, crates.io,
 * and other package registries with versioning and CI/CD integration.
 * @inputs { projectName: string, language: string, registries?: array, versioningStrategy?: string }
 * @outputs { success: boolean, publishConfig: object, registries: array, ciSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/package-manager-publishing', {
 *   projectName: 'my-cli-library',
 *   language: 'typescript',
 *   registries: ['npm', 'github-packages'],
 *   versioningStrategy: 'semantic'
 * });
 *
 * @references
 * - npm publishing: https://docs.npmjs.com/cli/v8/commands/npm-publish
 * - PyPI publishing: https://packaging.python.org/tutorials/packaging-projects/
 * - crates.io publishing: https://doc.rust-lang.org/cargo/reference/publishing.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    registries = ['npm'],
    versioningStrategy = 'semantic',
    outputDir = 'package-manager-publishing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Package Manager Publishing: ${projectName}`);

  const packageMetadata = await ctx.task(packageMetadataTask, { projectName, language, outputDir });
  artifacts.push(...packageMetadata.artifacts);

  const versionManagement = await ctx.task(versionManagementTask, { projectName, versioningStrategy, outputDir });
  artifacts.push(...versionManagement.artifacts);

  const npmPublishing = await ctx.task(npmPublishingTask, { projectName, registries, outputDir });
  artifacts.push(...npmPublishing.artifacts);

  const pypiPublishing = await ctx.task(pypiPublishingTask, { projectName, registries, outputDir });
  artifacts.push(...pypiPublishing.artifacts);

  const cratesPublishing = await ctx.task(cratesPublishingTask, { projectName, registries, outputDir });
  artifacts.push(...cratesPublishing.artifacts);

  const githubPackages = await ctx.task(githubPackagesTask, { projectName, registries, outputDir });
  artifacts.push(...githubPackages.artifacts);

  const prePublishChecks = await ctx.task(prePublishChecksTask, { projectName, language, outputDir });
  artifacts.push(...prePublishChecks.artifacts);

  const publishCi = await ctx.task(publishCiTask, { projectName, registries, outputDir });
  artifacts.push(...publishCi.artifacts);

  const releaseNotes = await ctx.task(releaseNotesTask, { projectName, outputDir });
  artifacts.push(...releaseNotes.artifacts);

  const publishDocumentation = await ctx.task(publishDocumentationTask, { projectName, registries, outputDir });
  artifacts.push(...publishDocumentation.artifacts);

  await ctx.breakpoint({
    question: `Package Manager Publishing complete for ${registries.length} registries. Review and approve?`,
    title: 'Package Publishing Complete',
    context: { runId: ctx.runId, summary: { projectName, registries, versioningStrategy } }
  });

  return {
    success: true,
    projectName,
    publishConfig: { versioningStrategy, configPath: versionManagement.configPath },
    registries,
    ciSetup: { workflowPath: publishCi.workflowPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/package-manager-publishing', timestamp: startTime }
  };
}

export const packageMetadataTask = defineTask('package-metadata', (args, taskCtx) => ({
  kind: 'agent',
  title: `Package Metadata - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Package Metadata Specialist', task: 'Configure package metadata', context: args, instructions: ['1. Define package name', '2. Add description', '3. Configure keywords', '4. Set up author info', '5. Generate metadata config'], outputFormat: 'JSON with package metadata' },
    outputSchema: { type: 'object', required: ['metadata', 'artifacts'], properties: { metadata: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'metadata']
}));

export const versionManagementTask = defineTask('version-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Management - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Version Management Specialist', task: 'Set up version management', context: args, instructions: ['1. Configure versioning tool', '2. Set up conventional commits', '3. Configure version bumping', '4. Add pre-release support', '5. Generate versioning config'], outputFormat: 'JSON with version management' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'versioning']
}));

export const npmPublishingTask = defineTask('npm-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `NPM Publishing - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'NPM Publishing Specialist', task: 'Configure npm publishing', context: args, instructions: ['1. Configure npm registry', '2. Set up .npmrc', '3. Configure access tokens', '4. Set up scoped packages', '5. Generate npm publish config'], outputFormat: 'JSON with npm publishing setup' },
    outputSchema: { type: 'object', required: ['npmConfig', 'artifacts'], properties: { npmConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'npm']
}));

export const pypiPublishingTask = defineTask('pypi-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `PyPI Publishing - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'PyPI Publishing Specialist', task: 'Configure PyPI publishing', context: args, instructions: ['1. Configure setup.py/pyproject.toml', '2. Set up twine', '3. Configure API tokens', '4. Set up TestPyPI', '5. Generate PyPI publish config'], outputFormat: 'JSON with PyPI publishing setup' },
    outputSchema: { type: 'object', required: ['pypiConfig', 'artifacts'], properties: { pypiConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'pypi']
}));

export const cratesPublishingTask = defineTask('crates-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Crates.io Publishing - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Crates.io Publishing Specialist', task: 'Configure crates.io publishing', context: args, instructions: ['1. Configure Cargo.toml', '2. Set up crates.io token', '3. Configure workspace publishing', '4. Set up dry-run checks', '5. Generate crates publish config'], outputFormat: 'JSON with crates.io publishing setup' },
    outputSchema: { type: 'object', required: ['cratesConfig', 'artifacts'], properties: { cratesConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'crates']
}));

export const githubPackagesTask = defineTask('github-packages', (args, taskCtx) => ({
  kind: 'agent',
  title: `GitHub Packages - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'GitHub Packages Specialist', task: 'Configure GitHub Packages publishing', context: args, instructions: ['1. Configure package registry', '2. Set up authentication', '3. Configure package visibility', '4. Set up multi-registry', '5. Generate GitHub Packages config'], outputFormat: 'JSON with GitHub Packages setup' },
    outputSchema: { type: 'object', required: ['ghPackagesConfig', 'artifacts'], properties: { ghPackagesConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'github-packages']
}));

export const prePublishChecksTask = defineTask('pre-publish-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Publish Checks - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Pre-Publish Check Specialist', task: 'Set up pre-publish checks', context: args, instructions: ['1. Add lint checks', '2. Add test checks', '3. Check package contents', '4. Validate metadata', '5. Generate pre-publish config'], outputFormat: 'JSON with pre-publish checks' },
    outputSchema: { type: 'object', required: ['checksConfig', 'artifacts'], properties: { checksConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'checks']
}));

export const publishCiTask = defineTask('publish-ci', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish CI - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Publish CI Specialist', task: 'Set up publishing CI/CD', context: args, instructions: ['1. Create publish workflow', '2. Configure registry secrets', '3. Set up release triggers', '4. Add multi-registry support', '5. Generate CI workflow'], outputFormat: 'JSON with publish CI setup' },
    outputSchema: { type: 'object', required: ['workflowPath', 'artifacts'], properties: { workflowPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'ci']
}));

export const releaseNotesTask = defineTask('release-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Notes - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Release Notes Specialist', task: 'Set up release notes automation', context: args, instructions: ['1. Configure changelog generation', '2. Create release template', '3. Set up auto-generation', '4. Add breaking change highlights', '5. Generate release notes config'], outputFormat: 'JSON with release notes setup' },
    outputSchema: { type: 'object', required: ['releaseNotesConfig', 'artifacts'], properties: { releaseNotesConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'release-notes']
}));

export const publishDocumentationTask = defineTask('publish-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Publishing Documentation Specialist', task: 'Document publishing process', context: args, instructions: ['1. Document setup steps', '2. Document release process', '3. Add troubleshooting', '4. Document rollback procedures', '5. Generate documentation'], outputFormat: 'JSON with publishing documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'publishing', 'documentation']
}));
