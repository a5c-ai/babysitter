/**
 * @process methodologies/bmad-method/bmad-document-project
 * @description BMAD Document Project - Comprehensive project documentation with Paige (Tech Writer)
 * @inputs { projectName: string, projectPath: string, documentationType?: string }
 * @outputs { success: boolean, documents: array, projectContext: object, sourceTree: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Document Project - Technical Documentation Generation
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * Paige (Tech Writer) generates comprehensive project documentation through:
 * - Full project scan and source tree analysis
 * - Deep-dive documentation for architecture and components
 * - Project context generation for onboarding
 * - Index and navigation structure creation
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectPath - Path to project root
 * @param {string} inputs.documentationType - 'full-scan', 'deep-dive', 'context-only' (default: 'full-scan')
 * @param {Object} inputs.existingDocs - Existing documentation to update (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Documentation artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectPath,
    documentationType = 'full-scan',
    existingDocs = null
  } = inputs;

  // Project scan
  const scanResult = await ctx.task(projectScanTask, {
    projectName, projectPath, documentationType
  });

  // Source tree analysis
  const sourceTreeResult = await ctx.task(sourceTreeAnalysisTask, {
    projectName, projectPath, scanResult
  });

  await ctx.breakpoint({
    question: `Project scan complete for "${projectName}". ${scanResult.fileCount || 0} files analyzed. ${scanResult.componentCount || 0} components identified. Generate documentation?`,
    title: 'BMAD Document - Scan Complete',
    context: { runId: ctx.runId, files: [
      { path: 'artifacts/bmad/docs/scan-report.md', format: 'markdown', label: 'Scan Report' },
      { path: 'artifacts/bmad/docs/source-tree.md', format: 'markdown', label: 'Source Tree' }
    ]}
  });

  // Generate project context
  const projectContext = await ctx.task(generateProjectContextTask, {
    projectName, scanResult, sourceTreeResult
  });

  // Deep-dive documentation if requested
  let deepDiveResult = null;
  if (documentationType === 'full-scan' || documentationType === 'deep-dive') {
    deepDiveResult = await ctx.task(deepDiveDocTask, {
      projectName, scanResult, sourceTreeResult, projectContext
    });
  }

  // Generate documentation index
  const indexResult = await ctx.task(documentIndexTask, {
    projectName, projectContext, deepDiveResult, scanResult
  });

  await ctx.breakpoint({
    question: `Documentation complete for "${projectName}". ${indexResult.totalDocuments || 0} documents generated. ${indexResult.diagramsGenerated || 0} diagrams created. Accept documentation?`,
    title: 'BMAD Document - Complete',
    context: { runId: ctx.runId, files: [
      { path: 'artifacts/bmad/docs/project-overview.md', format: 'markdown', label: 'Overview' },
      { path: 'artifacts/bmad/docs/index.md', format: 'markdown', label: 'Index' }
    ]}
  });

  return {
    success: true,
    projectName,
    documentationType,
    documents: indexResult.documents || [],
    projectContext,
    sourceTree: sourceTreeResult,
    scan: scanResult,
    deepDive: deepDiveResult,
    artifacts: {
      scanReport: 'artifacts/bmad/docs/scan-report.md',
      sourceTree: 'artifacts/bmad/docs/source-tree.md',
      projectOverview: 'artifacts/bmad/docs/project-overview.md',
      index: 'artifacts/bmad/docs/index.md'
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-document-project',
      timestamp: ctx.now(),
      framework: 'BMAD Method - Document Project',
      agent: 'Paige (Tech Writer)',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectScanTask = defineTask('bmad-project-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Scan: ${args.projectName}`,
  description: 'Paige (Tech Writer) scans project structure and components',
  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Technical Documentation Specialist analyzing project structure for comprehensive documentation',
      task: 'Scan project structure, identify components, and catalog documentation needs',
      context: args,
      instructions: [
        'Analyze project directory structure',
        'Identify major components and their relationships',
        'Catalog existing documentation',
        'Identify documentation gaps',
        'Map technology stack from project files',
        'Identify configuration patterns',
        'Count and categorize source files'
      ],
      outputFormat: 'JSON with scan results, component inventory, and documentation gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'fileCount'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        fileCount: { type: 'number' },
        componentCount: { type: 'number' },
        techStack: { type: 'object' },
        existingDocs: { type: 'array', items: { type: 'string' } },
        documentationGaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/docs/scan-report.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'documentation', 'scan', 'paige']
}));

export const sourceTreeAnalysisTask = defineTask('bmad-source-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Source Tree: ${args.projectName}`,
  description: 'Paige (Tech Writer) generates annotated source tree documentation',
  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Tech Writer creating navigable source tree documentation',
      task: 'Generate annotated source tree with component descriptions',
      context: args,
      instructions: [
        'Create hierarchical source tree representation',
        'Annotate key directories with purpose descriptions',
        'Identify entry points and main modules',
        'Map data flow between components',
        'Generate Mermaid diagram of architecture'
      ],
      outputFormat: 'JSON with source tree, annotations, and architecture diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['tree', 'annotations'],
      properties: {
        tree: { type: 'object' },
        annotations: { type: 'array', items: { type: 'object' } },
        entryPoints: { type: 'array', items: { type: 'string' } },
        architectureDiagram: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/docs/source-tree.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'documentation', 'source-tree', 'paige']
}));

export const generateProjectContextTask = defineTask('bmad-project-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Context: ${args.projectName}`,
  description: 'Paige (Tech Writer) generates project context for onboarding',
  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Tech Writer creating project context documentation for developer onboarding',
      task: 'Generate project context document for new developer onboarding',
      context: args,
      instructions: [
        'Create project overview with goals and architecture summary',
        'Document setup instructions for development environment',
        'List key conventions and patterns used',
        'Document important architectural decisions',
        'Create quick-start guide for common tasks',
        'List key contacts and resources'
      ],
      outputFormat: 'JSON with project context sections'
    },
    outputSchema: {
      type: 'object',
      required: ['overview', 'setupInstructions'],
      properties: {
        overview: { type: 'string' },
        setupInstructions: { type: 'array', items: { type: 'string' } },
        conventions: { type: 'array', items: { type: 'object' } },
        architecturalDecisions: { type: 'array', items: { type: 'object' } },
        quickStart: { type: 'object' },
        resources: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/docs/project-overview.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'documentation', 'project-context', 'paige']
}));

export const deepDiveDocTask = defineTask('bmad-deep-dive-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deep Dive Docs: ${args.projectName}`,
  description: 'Paige (Tech Writer) creates detailed component documentation',
  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Tech Writer creating detailed technical documentation with Mermaid diagrams',
      task: 'Create deep-dive documentation for major components',
      context: args,
      instructions: [
        'Document each major component in detail',
        'Include API documentation with examples',
        'Create sequence diagrams for key flows',
        'Document data models and schemas',
        'Include troubleshooting guides',
        'Create Mermaid diagrams for complex interactions'
      ],
      outputFormat: 'JSON with detailed documentation for each component'
    },
    outputSchema: {
      type: 'object',
      required: ['componentDocs'],
      properties: {
        componentDocs: { type: 'array', items: { type: 'object' } },
        apiDocs: { type: 'array', items: { type: 'object' } },
        diagramsGenerated: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/docs/deep-dive.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'documentation', 'deep-dive', 'paige']
}));

export const documentIndexTask = defineTask('bmad-doc-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Index: ${args.projectName}`,
  description: 'Paige (Tech Writer) generates documentation index and navigation',
  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Tech Writer organizing documentation into navigable index',
      task: 'Create documentation index with navigation and cross-references',
      context: args,
      instructions: [
        'Create master documentation index',
        'Organize by audience (developer, user, admin)',
        'Add cross-references between related documents',
        'Create table of contents for each major section',
        'Verify all links and references'
      ],
      outputFormat: 'JSON with document index and navigation structure'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'totalDocuments'],
      properties: {
        documents: { type: 'array', items: { type: 'object' } },
        totalDocuments: { type: 'number' },
        diagramsGenerated: { type: 'number' },
        navigation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/docs/index.md', format: 'markdown' }
    ]
  },
  labels: ['agent', 'bmad', 'documentation', 'index', 'paige']
}));
