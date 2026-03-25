/**
 * @process humanities/data-visualization-cultural-research
 * @description Create meaningful visualizations of humanistic data including timelines, maps, graphs, and interactive displays for scholarly communication
 * @inputs { dataSet: object, visualizationGoals: array, audience: string, publicationFormat: string }
 * @outputs { success: boolean, visualizations: array, designSystem: object, interactiveComponents: array, artifacts: array }
 * @recommendedSkills SK-HUM-011 (gis-mapping-humanities), SK-HUM-014 (metadata-standards-implementation), SK-HUM-009 (topic-modeling-text-mining)
 * @recommendedAgents AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataSet,
    visualizationGoals = [],
    audience = 'scholarly',
    publicationFormat = 'digital',
    accessibilityRequirements = {},
    outputDir = 'visualization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Data Assessment and Preparation
  ctx.log('info', 'Assessing and preparing data for visualization');
  const dataAssessment = await ctx.task(dataAssessmentTask, {
    dataSet,
    visualizationGoals,
    outputDir
  });

  if (!dataAssessment.success) {
    return {
      success: false,
      error: 'Data assessment failed',
      details: dataAssessment,
      metadata: { processId: 'humanities/data-visualization-cultural-research', timestamp: startTime }
    };
  }

  artifacts.push(...dataAssessment.artifacts);

  // Task 2: Visualization Strategy Development
  ctx.log('info', 'Developing visualization strategy');
  const visualizationStrategy = await ctx.task(visualizationStrategyTask, {
    dataAssessment,
    visualizationGoals,
    audience,
    publicationFormat,
    outputDir
  });

  artifacts.push(...visualizationStrategy.artifacts);

  // Task 3: Design System Development
  ctx.log('info', 'Developing design system');
  const designSystem = await ctx.task(designSystemTask, {
    visualizationStrategy,
    audience,
    accessibilityRequirements,
    outputDir
  });

  artifacts.push(...designSystem.artifacts);

  // Task 4: Static Visualization Creation
  ctx.log('info', 'Creating static visualizations');
  const staticVisualizations = await ctx.task(staticVisualizationTask, {
    dataSet,
    visualizationStrategy,
    designSystem,
    outputDir
  });

  artifacts.push(...staticVisualizations.artifacts);

  // Task 5: Interactive Component Development
  ctx.log('info', 'Developing interactive components');
  const interactiveComponents = await ctx.task(interactiveComponentTask, {
    dataSet,
    visualizationStrategy,
    designSystem,
    outputDir
  });

  artifacts.push(...interactiveComponents.artifacts);

  // Task 6: Narrative Integration
  ctx.log('info', 'Integrating visualizations with narrative');
  const narrativeIntegration = await ctx.task(narrativeIntegrationTask, {
    staticVisualizations,
    interactiveComponents,
    visualizationGoals,
    outputDir
  });

  artifacts.push(...narrativeIntegration.artifacts);

  // Task 7: Generate Visualization Documentation
  ctx.log('info', 'Generating visualization documentation');
  const visualizationDocumentation = await ctx.task(visualizationDocumentationTask, {
    dataAssessment,
    visualizationStrategy,
    designSystem,
    staticVisualizations,
    interactiveComponents,
    narrativeIntegration,
    outputDir
  });

  artifacts.push(...visualizationDocumentation.artifacts);

  // Breakpoint: Review visualizations
  await ctx.breakpoint({
    question: `Visualization development complete. Static: ${staticVisualizations.visualizations?.length || 0}. Interactive: ${interactiveComponents.components?.length || 0}. Review visualizations?`,
    title: 'Data Visualization for Cultural Research Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        audience,
        publicationFormat,
        staticCount: staticVisualizations.visualizations?.length || 0,
        interactiveCount: interactiveComponents.components?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    visualizations: staticVisualizations.visualizations,
    designSystem: designSystem.system,
    interactiveComponents: interactiveComponents.components,
    narrative: narrativeIntegration.integration,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/data-visualization-cultural-research',
      timestamp: startTime,
      audience,
      outputDir
    }
  };
}

// Task 1: Data Assessment and Preparation
export const dataAssessmentTask = defineTask('data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess and prepare data for visualization',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'humanities data visualization specialist',
      task: 'Assess data and prepare for visualization',
      context: args,
      instructions: [
        'Analyze data structure and types',
        'Identify quantitative vs qualitative data',
        'Assess data completeness and gaps',
        'Identify temporal dimensions',
        'Identify spatial dimensions',
        'Identify categorical dimensions',
        'Assess data for visualization suitability',
        'Prepare data transformations needed'
      ],
      outputFormat: 'JSON with success, assessment, dimensions, transformations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            types: { type: 'object' },
            completeness: { type: 'number' }
          }
        },
        dimensions: {
          type: 'object',
          properties: {
            temporal: { type: 'object' },
            spatial: { type: 'object' },
            categorical: { type: 'array', items: { type: 'string' } },
            quantitative: { type: 'array', items: { type: 'string' } }
          }
        },
        transformations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-assessment', 'preparation', 'visualization']
}));

// Task 2: Visualization Strategy Development
export const visualizationStrategyTask = defineTask('visualization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop visualization strategy',
  agent: {
    name: 'visualization-strategist',
    prompt: {
      role: 'visualization strategy specialist',
      task: 'Develop comprehensive visualization strategy',
      context: args,
      instructions: [
        'Define visualization objectives',
        'Select appropriate chart types',
        'Plan visualization sequence',
        'Consider publication requirements',
        'Plan interactivity levels',
        'Consider audience needs',
        'Plan for accessibility',
        'Define success criteria'
      ],
      outputFormat: 'JSON with strategy, chartTypes, sequence, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'chartTypes', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            approach: { type: 'string' },
            interactivity: { type: 'string' }
          }
        },
        chartTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              purpose: { type: 'string' },
              data: { type: 'string' }
            }
          }
        },
        sequence: { type: 'array', items: { type: 'object' } },
        requirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy', 'planning', 'visualization']
}));

// Task 3: Design System Development
export const designSystemTask = defineTask('design-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop design system',
  agent: {
    name: 'design-system-developer',
    prompt: {
      role: 'visualization design specialist',
      task: 'Develop cohesive design system for visualizations',
      context: args,
      instructions: [
        'Define color palette (accessibility compliant)',
        'Select typography',
        'Define visual hierarchy',
        'Create consistent symbology',
        'Define layout grid',
        'Create annotation styles',
        'Define interaction patterns',
        'Document design specifications'
      ],
      outputFormat: 'JSON with system, colors, typography, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            principles: { type: 'array', items: { type: 'string' } }
          }
        },
        colors: {
          type: 'object',
          properties: {
            primary: { type: 'array', items: { type: 'string' } },
            sequential: { type: 'array', items: { type: 'string' } },
            categorical: { type: 'array', items: { type: 'string' } }
          }
        },
        typography: { type: 'object' },
        patterns: { type: 'object' },
        accessibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'aesthetics', 'accessibility']
}));

// Task 4: Static Visualization Creation
export const staticVisualizationTask = defineTask('static-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create static visualizations',
  agent: {
    name: 'visualization-creator',
    prompt: {
      role: 'static visualization specialist',
      task: 'Create publication-quality static visualizations',
      context: args,
      instructions: [
        'Create charts per visualization strategy',
        'Apply design system consistently',
        'Add appropriate annotations',
        'Include legends and labels',
        'Ensure readability',
        'Create print-ready versions',
        'Create web-optimized versions',
        'Document each visualization'
      ],
      outputFormat: 'JSON with visualizations, formats, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visualizations', 'artifacts'],
      properties: {
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        formats: {
          type: 'object',
          properties: {
            print: { type: 'array', items: { type: 'string' } },
            web: { type: 'array', items: { type: 'string' } }
          }
        },
        documentation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visualization', 'static', 'charts']
}));

// Task 5: Interactive Component Development
export const interactiveComponentTask = defineTask('interactive-component', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interactive components',
  agent: {
    name: 'interactive-developer',
    prompt: {
      role: 'interactive visualization specialist',
      task: 'Develop interactive visualization components',
      context: args,
      instructions: [
        'Design interaction patterns',
        'Create interactive timelines',
        'Create interactive maps',
        'Create filterable charts',
        'Add tooltips and details-on-demand',
        'Create linked views if appropriate',
        'Ensure responsive design',
        'Test interactions'
      ],
      outputFormat: 'JSON with components, interactions, testing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              interactions: { type: 'array', items: { type: 'string' } },
              path: { type: 'string' }
            }
          }
        },
        interactions: {
          type: 'object',
          properties: {
            filters: { type: 'array', items: { type: 'string' } },
            tooltips: { type: 'object' },
            linking: { type: 'object' }
          }
        },
        testing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive', 'components', 'web']
}));

// Task 6: Narrative Integration
export const narrativeIntegrationTask = defineTask('narrative-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate visualizations with narrative',
  agent: {
    name: 'narrative-integrator',
    prompt: {
      role: 'data storytelling specialist',
      task: 'Integrate visualizations with scholarly narrative',
      context: args,
      instructions: [
        'Design visualization-text flow',
        'Create scrollytelling if appropriate',
        'Write visualization captions',
        'Create annotations linking to narrative',
        'Design reveal sequences',
        'Ensure coherent story arc',
        'Create entry points for exploration',
        'Balance explanation and exploration'
      ],
      outputFormat: 'JSON with integration, flow, captions, annotations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'artifacts'],
      properties: {
        integration: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            flow: { type: 'array', items: { type: 'object' } },
            balance: { type: 'object' }
          }
        },
        flow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              type: { type: 'string' },
              position: { type: 'number' }
            }
          }
        },
        captions: { type: 'array', items: { type: 'object' } },
        annotations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'narrative', 'storytelling', 'integration']
}));

// Task 7: Visualization Documentation Generation
export const visualizationDocumentationTask = defineTask('visualization-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate visualization documentation',
  agent: {
    name: 'documentation-writer',
    prompt: {
      role: 'visualization documentation specialist',
      task: 'Generate comprehensive visualization documentation',
      context: args,
      instructions: [
        'Document data sources and preparation',
        'Document visualization strategy',
        'Present design system',
        'Document each visualization',
        'Include methodological notes',
        'Document interactive features',
        'Create user guide if needed',
        'Include accessibility information'
      ],
      outputFormat: 'JSON with documentationPath, sections, userGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        userGuide: { type: 'object' },
        methodology: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'methodology', 'visualization']
}));
