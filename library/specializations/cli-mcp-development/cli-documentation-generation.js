/**
 * @process specializations/cli-mcp-development/cli-documentation-generation
 * @description CLI Documentation Generation - Implement automated documentation generation from CLI command definitions
 * including markdown docs, man pages, and command references.
 * @inputs { projectName: string, language: string, framework?: string, outputFormats?: array }
 * @outputs { success: boolean, generatedDocs: array, manPages: array, commandReference: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-documentation-generation', {
 *   projectName: 'my-cli',
 *   language: 'typescript',
 *   framework: 'commander',
 *   outputFormats: ['markdown', 'manpage', 'html']
 * });
 *
 * @references
 * - Cobra doc generation: https://github.com/spf13/cobra/blob/main/doc/README.md
 * - oclif README generation: https://oclif.io/docs/commands#readme-generation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'commander',
    outputFormats = ['markdown', 'manpage'],
    outputDir = 'cli-documentation-generation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Documentation Generation: ${projectName}`);

  const needsAnalysis = await ctx.task(documentationNeedsAnalysisTask, { projectName, framework, outputFormats, outputDir });
  artifacts.push(...needsAnalysis.artifacts);

  const helpTextExtraction = await ctx.task(helpTextExtractionTask, { projectName, language, framework, outputDir });
  artifacts.push(...helpTextExtraction.artifacts);

  const markdownGeneration = await ctx.task(markdownGenerationTask, { projectName, helpTextExtraction, outputDir });
  artifacts.push(...markdownGeneration.artifacts);

  const manPageGeneration = await ctx.task(manPageGenerationTask, { projectName, helpTextExtraction, outputDir });
  artifacts.push(...manPageGeneration.artifacts);

  const commandReferenceGeneration = await ctx.task(commandReferenceGenerationTask, { projectName, helpTextExtraction, outputDir });
  artifacts.push(...commandReferenceGeneration.artifacts);

  const exampleExtraction = await ctx.task(exampleExtractionTask, { projectName, language, outputDir });
  artifacts.push(...exampleExtraction.artifacts);

  const changelogAutomation = await ctx.task(changelogAutomationTask, { projectName, outputDir });
  artifacts.push(...changelogAutomation.artifacts);

  const shellCompletionDocs = await ctx.task(shellCompletionDocsTask, { projectName, outputDir });
  artifacts.push(...shellCompletionDocs.artifacts);

  const documentationCi = await ctx.task(documentationCiTask, { projectName, outputFormats, outputDir });
  artifacts.push(...documentationCi.artifacts);

  const documentationPublishing = await ctx.task(documentationPublishingTask, { projectName, outputDir });
  artifacts.push(...documentationPublishing.artifacts);

  await ctx.breakpoint({
    question: `CLI Documentation Generation complete with ${outputFormats.length} output formats. Review and approve?`,
    title: 'Documentation Generation Complete',
    context: { runId: ctx.runId, summary: { projectName, framework, outputFormats } }
  });

  return {
    success: true,
    projectName,
    generatedDocs: [markdownGeneration.docPath, commandReferenceGeneration.referencePath],
    manPages: manPageGeneration.manPages,
    commandReference: { path: commandReferenceGeneration.referencePath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/cli-documentation-generation', timestamp: startTime }
  };
}

export const documentationNeedsAnalysisTask = defineTask('docs-needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Needs Analysis - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'CLI Documentation Analyst', task: 'Analyze documentation needs', context: args, instructions: ['1. Identify documentation requirements', '2. Analyze existing docs', '3. Plan documentation structure', '4. Identify output formats', '5. Generate analysis report'], outputFormat: 'JSON with analysis' },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'analysis']
}));

export const helpTextExtractionTask = defineTask('help-text-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Help Text Extraction - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'CLI Help Text Specialist', task: 'Implement help text extraction', context: args, instructions: ['1. Parse command definitions', '2. Extract help text', '3. Extract option descriptions', '4. Extract examples', '5. Generate extraction code'], outputFormat: 'JSON with help text extraction' },
    outputSchema: { type: 'object', required: ['commands', 'options', 'artifacts'], properties: { commands: { type: 'array' }, options: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'extraction']
}));

export const markdownGenerationTask = defineTask('markdown-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Markdown Generation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Markdown Documentation Generator', task: 'Generate markdown documentation', context: args, instructions: ['1. Create README template', '2. Generate command docs', '3. Add usage examples', '4. Create installation guide', '5. Generate markdown files'], outputFormat: 'JSON with markdown docs' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'markdown']
}));

export const manPageGenerationTask = defineTask('manpage-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Man Page Generation - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Man Page Generator', task: 'Create man page generation', context: args, instructions: ['1. Create man page template', '2. Generate man page sections', '3. Format according to conventions', '4. Add installation instructions', '5. Generate man pages'], outputFormat: 'JSON with man pages' },
    outputSchema: { type: 'object', required: ['manPages', 'artifacts'], properties: { manPages: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'manpage']
}));

export const commandReferenceGenerationTask = defineTask('command-reference-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Command Reference Generation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Command Reference Generator', task: 'Add command reference generation', context: args, instructions: ['1. Create reference structure', '2. Document each command', '3. Document all options', '4. Add cross-references', '5. Generate command reference'], outputFormat: 'JSON with command reference' },
    outputSchema: { type: 'object', required: ['referencePath', 'artifacts'], properties: { referencePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'reference']
}));

export const exampleExtractionTask = defineTask('example-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Example Extraction - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'CLI Example Extractor', task: 'Implement example extraction', context: args, instructions: ['1. Extract code examples', '2. Validate examples work', '3. Format for documentation', '4. Create runnable examples', '5. Generate example docs'], outputFormat: 'JSON with examples' },
    outputSchema: { type: 'object', required: ['examples', 'artifacts'], properties: { examples: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'examples']
}));

export const changelogAutomationTask = defineTask('changelog-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Changelog Automation - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Changelog Automation Specialist', task: 'Create changelog automation', context: args, instructions: ['1. Configure conventional commits', '2. Set up changelog generation', '3. Create release notes template', '4. Automate version bumping', '5. Generate changelog config'], outputFormat: 'JSON with changelog automation' },
    outputSchema: { type: 'object', required: ['changelogConfig', 'artifacts'], properties: { changelogConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'changelog']
}));

export const shellCompletionDocsTask = defineTask('shell-completion-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shell Completion Docs - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Shell Completion Documentation Specialist', task: 'Generate shell completion docs', context: args, instructions: ['1. Document Bash completion', '2. Document Zsh completion', '3. Document Fish completion', '4. Add installation instructions', '5. Generate completion docs'], outputFormat: 'JSON with completion docs' },
    outputSchema: { type: 'object', required: ['completionDocPath', 'artifacts'], properties: { completionDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'completion']
}));

export const documentationCiTask = defineTask('documentation-ci', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation CI - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Documentation CI Specialist', task: 'Set up documentation CI', context: args, instructions: ['1. Create docs build workflow', '2. Validate documentation', '3. Check links', '4. Deploy documentation', '5. Generate CI config'], outputFormat: 'JSON with documentation CI' },
    outputSchema: { type: 'object', required: ['ciConfigPath', 'artifacts'], properties: { ciConfigPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'ci']
}));

export const documentationPublishingTask = defineTask('documentation-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Publishing - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Documentation Publishing Specialist', task: 'Publish to documentation site', context: args, instructions: ['1. Configure documentation site', '2. Set up GitHub Pages or similar', '3. Configure versioning', '4. Add search functionality', '5. Generate publishing config'], outputFormat: 'JSON with publishing config' },
    outputSchema: { type: 'object', required: ['publishingConfig', 'artifacts'], properties: { publishingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'documentation', 'publishing']
}));
