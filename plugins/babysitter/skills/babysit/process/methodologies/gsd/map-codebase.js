/**
 * @process gsd/map-codebase
 * @description GSD brownfield analysis - understand existing codebase
 * @inputs { codebasePath: string, analysisDepth?: string }
 * @outputs { success: boolean, architecture: object, patterns: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Agents referenced from agents/ directory:
 *   - gsd-codebase-mapper: Parallel analysis of structure, patterns, dependencies, tech stack
 *   - gsd-integration-checker: Creates integration plan for new work
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config and path utilities
 *   - context-engineering: Codebase context capture and management
 *   - template-scaffolding: Codebase map document templates
 */
export async function process(inputs, ctx) {
  const { codebasePath, analysisDepth = 'standard' } = inputs;

  // Parallel analysis
  const [structure, patterns, dependencies, tech] = await ctx.parallel.all([
    () => ctx.task(analyzeStructureTask, { codebasePath }),
    () => ctx.task(analyzePatternsTask, { codebasePath }),
    () => ctx.task(analyzeDependenciesTask, { codebasePath }),
    () => ctx.task(analyzeTechStackTask, { codebasePath })
  ]);

  // Generate integration plan
  const integration = await ctx.task(createIntegrationPlanTask, {
    structure,
    patterns,
    dependencies,
    tech
  });

  await ctx.breakpoint({
    question: 'Review codebase analysis. Ready to integrate new work?',
    title: 'Codebase Analysis Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/CODEBASE-MAP.md', format: 'markdown', label: 'Codebase Map' }
      ]
    }
  });

  return {
    success: true,
    structure,
    patterns,
    dependencies,
    tech,
    integration,
    metadata: { processId: 'gsd/map-codebase', timestamp: ctx.now() }
  };
}

export const analyzeStructureTask = defineTask('analyze-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze codebase structure',
  agent: {
    name: 'gsd-codebase-mapper',
    prompt: {
      role: 'senior architect',
      task: 'Analyze codebase directory structure and organization',
      context: args,
      instructions: ['Map directory structure', 'Identify module boundaries', 'Document organization patterns'],
      outputFormat: 'JSON with directoryTree, modules, organization'
    },
    outputSchema: {
      type: 'object',
      required: ['directoryTree', 'modules'],
      properties: {
        directoryTree: { type: 'object' },
        modules: { type: 'array', items: { type: 'object' } },
        organization: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'analysis']
}));

export const analyzePatternsTask = defineTask('analyze-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze code patterns',
  agent: {
    name: 'gsd-codebase-mapper',
    prompt: {
      role: 'senior engineer',
      task: 'Identify coding patterns and conventions',
      context: args,
      instructions: ['Find naming conventions', 'Identify design patterns', 'Document coding style'],
      outputFormat: 'JSON with patterns, conventions, style'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        conventions: { type: 'object' },
        style: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'analysis']
}));

export const analyzeDependenciesTask = defineTask('analyze-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze dependencies',
  agent: {
    name: 'gsd-codebase-mapper',
    prompt: {
      role: 'senior engineer',
      task: 'Analyze dependency graph',
      context: args,
      instructions: ['List dependencies', 'Identify coupling', 'Find circular dependencies'],
      outputFormat: 'JSON with dependencies, coupling, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies'],
      properties: {
        dependencies: { type: 'array', items: { type: 'string' } },
        coupling: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'analysis']
}));

export const analyzeTechStackTask = defineTask('analyze-tech-stack', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze tech stack',
  agent: {
    name: 'gsd-codebase-mapper',
    prompt: {
      role: 'senior architect',
      task: 'Identify technologies and versions',
      context: args,
      instructions: ['Identify languages and frameworks', 'Check versions', 'Note build tools'],
      outputFormat: 'JSON with languages, frameworks, tools, versions'
    },
    outputSchema: {
      type: 'object',
      required: ['languages', 'frameworks'],
      properties: {
        languages: { type: 'array', items: { type: 'string' } },
        frameworks: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } },
        versions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'analysis']
}));

export const createIntegrationPlanTask = defineTask('create-integration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create integration plan',
  agent: {
    name: 'gsd-integration-checker',
    prompt: {
      role: 'senior architect',
      task: 'Create plan for integrating new work',
      context: args,
      instructions: ['Recommend integration approach', 'Identify integration points', 'Note constraints'],
      outputFormat: 'JSON with approach, integrationPoints, constraints, planMarkdown'
    },
    outputSchema: {
      type: 'object',
      required: ['approach'],
      properties: {
        approach: { type: 'string' },
        integrationPoints: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        planMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'integration']
}));
