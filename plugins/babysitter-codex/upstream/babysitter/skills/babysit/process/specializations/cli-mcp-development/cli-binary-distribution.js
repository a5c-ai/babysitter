/**
 * @process specializations/cli-mcp-development/cli-binary-distribution
 * @description CLI Binary Distribution - Set up binary compilation and distribution for CLI tools
 * including cross-compilation, signing, and multi-platform releases.
 * @inputs { projectName: string, language: string, platforms?: array, distributionChannels?: array }
 * @outputs { success: boolean, buildConfig: object, platforms: array, distributionSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-binary-distribution', {
 *   projectName: 'my-cli-tool',
 *   language: 'go',
 *   platforms: ['linux-amd64', 'darwin-amd64', 'darwin-arm64', 'windows-amd64'],
 *   distributionChannels: ['github-releases', 'homebrew', 'scoop']
 * });
 *
 * @references
 * - GoReleaser: https://goreleaser.com/
 * - pkg (Node.js): https://github.com/vercel/pkg
 * - PyInstaller: https://pyinstaller.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'go',
    platforms = ['linux-amd64', 'darwin-amd64', 'darwin-arm64', 'windows-amd64'],
    distributionChannels = ['github-releases'],
    outputDir = 'cli-binary-distribution'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Binary Distribution: ${projectName}`);

  const buildSystemSetup = await ctx.task(buildSystemSetupTask, { projectName, language, platforms, outputDir });
  artifacts.push(...buildSystemSetup.artifacts);

  const crossCompilation = await ctx.task(crossCompilationTask, { projectName, language, platforms, outputDir });
  artifacts.push(...crossCompilation.artifacts);

  const binaryOptimization = await ctx.task(binaryOptimizationTask, { projectName, language, outputDir });
  artifacts.push(...binaryOptimization.artifacts);

  const codeSigningSetup = await ctx.task(codeSigningSetupTask, { projectName, platforms, outputDir });
  artifacts.push(...codeSigningSetup.artifacts);

  const checksumGeneration = await ctx.task(checksumGenerationTask, { projectName, outputDir });
  artifacts.push(...checksumGeneration.artifacts);

  const githubReleasesSetup = await ctx.task(githubReleasesSetupTask, { projectName, platforms, outputDir });
  artifacts.push(...githubReleasesSetup.artifacts);

  const homebrewFormula = await ctx.task(homebrewFormulaTask, { projectName, outputDir });
  artifacts.push(...homebrewFormula.artifacts);

  const scoopManifest = await ctx.task(scoopManifestTask, { projectName, outputDir });
  artifacts.push(...scoopManifest.artifacts);

  const aptDebPackaging = await ctx.task(aptDebPackagingTask, { projectName, outputDir });
  artifacts.push(...aptDebPackaging.artifacts);

  const releaseAutomation = await ctx.task(releaseAutomationTask, { projectName, distributionChannels, outputDir });
  artifacts.push(...releaseAutomation.artifacts);

  await ctx.breakpoint({
    question: `CLI Binary Distribution complete for ${platforms.length} platforms. Review and approve?`,
    title: 'Binary Distribution Complete',
    context: { runId: ctx.runId, summary: { projectName, platforms, distributionChannels } }
  });

  return {
    success: true,
    projectName,
    buildConfig: { system: buildSystemSetup.buildSystem, configPath: buildSystemSetup.configPath },
    platforms,
    distributionSetup: { channels: distributionChannels },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/cli-binary-distribution', timestamp: startTime }
  };
}

export const buildSystemSetupTask = defineTask('build-system-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build System Setup - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Build System Specialist', task: 'Set up build system', context: args, instructions: ['1. Choose build tool', '2. Configure build targets', '3. Set up build scripts', '4. Configure versioning', '5. Generate build config'], outputFormat: 'JSON with build system setup' },
    outputSchema: { type: 'object', required: ['buildSystem', 'configPath', 'artifacts'], properties: { buildSystem: { type: 'string' }, configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'build']
}));

export const crossCompilationTask = defineTask('cross-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Compilation - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Cross-Compilation Specialist', task: 'Configure cross-compilation', context: args, instructions: ['1. Set up cross-compile toolchain', '2. Configure target platforms', '3. Handle CGO dependencies', '4. Test cross-compiled binaries', '5. Generate cross-compile config'], outputFormat: 'JSON with cross-compilation setup' },
    outputSchema: { type: 'object', required: ['platformConfigs', 'artifacts'], properties: { platformConfigs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'cross-compile']
}));

export const binaryOptimizationTask = defineTask('binary-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Binary Optimization - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Binary Optimization Specialist', task: 'Optimize binary size and performance', context: args, instructions: ['1. Strip debug symbols', '2. Enable UPX compression', '3. Optimize for size', '4. Remove unused code', '5. Generate optimization config'], outputFormat: 'JSON with optimization config' },
    outputSchema: { type: 'object', required: ['optimizationConfig', 'artifacts'], properties: { optimizationConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'optimization']
}));

export const codeSigningSetupTask = defineTask('code-signing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code Signing Setup - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Code Signing Specialist', task: 'Set up code signing', context: args, instructions: ['1. Configure macOS signing', '2. Configure Windows signing', '3. Set up notarization', '4. Configure CI secrets', '5. Generate signing config'], outputFormat: 'JSON with code signing setup' },
    outputSchema: { type: 'object', required: ['signingConfig', 'artifacts'], properties: { signingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'signing']
}));

export const checksumGenerationTask = defineTask('checksum-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Checksum Generation - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Release Security Specialist', task: 'Set up checksum generation', context: args, instructions: ['1. Configure SHA256 checksums', '2. Generate checksum files', '3. Add GPG signing', '4. Automate verification', '5. Generate checksum config'], outputFormat: 'JSON with checksum setup' },
    outputSchema: { type: 'object', required: ['checksumConfig', 'artifacts'], properties: { checksumConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'checksum']
}));

export const githubReleasesSetupTask = defineTask('github-releases-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `GitHub Releases Setup - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Release Automation Specialist', task: 'Set up GitHub releases', context: args, instructions: ['1. Configure release workflow', '2. Set up asset uploads', '3. Configure release notes', '4. Add changelog generation', '5. Generate release config'], outputFormat: 'JSON with GitHub releases setup' },
    outputSchema: { type: 'object', required: ['releaseConfig', 'artifacts'], properties: { releaseConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'github']
}));

export const homebrewFormulaTask = defineTask('homebrew-formula', (args, taskCtx) => ({
  kind: 'agent',
  title: `Homebrew Formula - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Homebrew Formula Specialist', task: 'Create Homebrew formula', context: args, instructions: ['1. Create formula template', '2. Configure dependencies', '3. Set up tap repository', '4. Automate formula updates', '5. Generate Homebrew config'], outputFormat: 'JSON with Homebrew formula' },
    outputSchema: { type: 'object', required: ['formulaPath', 'artifacts'], properties: { formulaPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'homebrew']
}));

export const scoopManifestTask = defineTask('scoop-manifest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scoop Manifest - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Scoop Manifest Specialist', task: 'Create Scoop manifest', context: args, instructions: ['1. Create manifest template', '2. Configure autoupdate', '3. Set up bucket', '4. Add installer scripts', '5. Generate Scoop manifest'], outputFormat: 'JSON with Scoop manifest' },
    outputSchema: { type: 'object', required: ['manifestPath', 'artifacts'], properties: { manifestPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'scoop']
}));

export const aptDebPackagingTask = defineTask('apt-deb-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: `APT/DEB Packaging - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Debian Packaging Specialist', task: 'Create Debian package', context: args, instructions: ['1. Create control file', '2. Configure maintainer scripts', '3. Set up PPA', '4. Automate package builds', '5. Generate Debian package config'], outputFormat: 'JSON with Debian package setup' },
    outputSchema: { type: 'object', required: ['debConfig', 'artifacts'], properties: { debConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'debian']
}));

export const releaseAutomationTask = defineTask('release-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Automation - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Release Automation Specialist', task: 'Automate release process', context: args, instructions: ['1. Create release workflow', '2. Configure semantic versioning', '3. Automate changelog', '4. Set up multi-channel releases', '5. Generate release automation'], outputFormat: 'JSON with release automation' },
    outputSchema: { type: 'object', required: ['releaseWorkflow', 'artifacts'], properties: { releaseWorkflow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'distribution', 'automation']
}));
