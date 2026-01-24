/**
 * @process business-strategy/strategy-map-creation
 * @description Visual articulation of strategic objectives and cause-and-effect relationships across organizational dimensions
 * @inputs { organizationContext: object, strategicObjectives: array, perspectives: array, outputDir: string }
 * @outputs { success: boolean, strategyMap: object, causalChains: array, strategicThemes: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    strategicObjectives = [],
    perspectives = ['financial', 'customer', 'internal-process', 'learning-growth'],
    outputDir = 'strategy-map-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Strategy Map Creation Process');

  // ============================================================================
  // PHASE 1: OBJECTIVE CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Categorizing objectives by perspective');
  const objectiveCategorization = await ctx.task(objectiveCategorizationTask, {
    strategicObjectives,
    perspectives,
    outputDir
  });

  artifacts.push(...objectiveCategorization.artifacts);

  // ============================================================================
  // PHASE 2: CAUSAL RELATIONSHIP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying causal relationships');
  const causalRelationships = await ctx.task(causalRelationshipsTask, {
    categorizedObjectives: objectiveCategorization.categorized,
    perspectives,
    outputDir
  });

  artifacts.push(...causalRelationships.artifacts);

  // ============================================================================
  // PHASE 3: STRATEGIC THEME IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying strategic themes');
  const strategicThemes = await ctx.task(strategicThemesTask, {
    categorizedObjectives: objectiveCategorization.categorized,
    causalRelationships: causalRelationships.relationships,
    outputDir
  });

  artifacts.push(...strategicThemes.artifacts);

  // ============================================================================
  // PHASE 4: MAP LAYOUT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing map layout');
  const mapLayout = await ctx.task(mapLayoutTask, {
    categorizedObjectives: objectiveCategorization.categorized,
    causalRelationships: causalRelationships.relationships,
    strategicThemes: strategicThemes.themes,
    perspectives,
    outputDir
  });

  artifacts.push(...mapLayout.artifacts);

  // Breakpoint: Review strategy map structure
  await ctx.breakpoint({
    question: `Strategy map structure complete. ${objectiveCategorization.totalObjectives} objectives, ${causalRelationships.relationships.length} causal links, ${strategicThemes.themes.length} strategic themes. Review layout?`,
    title: 'Strategy Map Structure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        objectives: objectiveCategorization.totalObjectives,
        causalLinks: causalRelationships.relationships.length,
        themes: strategicThemes.themes.length,
        perspectives: perspectives.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: HYPOTHESIS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Documenting strategy hypotheses');
  const hypotheses = await ctx.task(hypothesesDocumentationTask, {
    causalRelationships: causalRelationships.relationships,
    strategicThemes: strategicThemes.themes,
    outputDir
  });

  artifacts.push(...hypotheses.artifacts);

  // ============================================================================
  // PHASE 6: MAP VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating strategy map');
  const mapValidation = await ctx.task(mapValidationTask, {
    categorizedObjectives: objectiveCategorization.categorized,
    causalRelationships: causalRelationships.relationships,
    strategicThemes: strategicThemes.themes,
    hypotheses: hypotheses.hypotheses,
    outputDir
  });

  artifacts.push(...mapValidation.artifacts);

  // ============================================================================
  // PHASE 7: VISUAL STRATEGY MAP GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating visual strategy map');
  const visualMap = await ctx.task(visualMapGenerationTask, {
    mapLayout,
    categorizedObjectives: objectiveCategorization.categorized,
    causalRelationships: causalRelationships.relationships,
    strategicThemes: strategicThemes.themes,
    outputDir
  });

  artifacts.push(...visualMap.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive documentation');
  const mapDocumentation = await ctx.task(mapDocumentationTask, {
    objectiveCategorization,
    causalRelationships,
    strategicThemes,
    mapLayout,
    hypotheses,
    mapValidation,
    visualMap,
    outputDir
  });

  artifacts.push(...mapDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategyMap: {
      objectives: objectiveCategorization.categorized,
      layout: mapLayout.layout
    },
    causalChains: causalRelationships.relationships,
    strategicThemes: strategicThemes.themes,
    hypotheses: hypotheses.hypotheses,
    validation: mapValidation.validation,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/strategy-map-creation',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Objective Categorization
export const objectiveCategorizationTask = defineTask('objective-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize objectives by perspective',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'strategy map analyst',
      task: 'Categorize strategic objectives by balanced scorecard perspective',
      context: args,
      instructions: [
        'Categorize each objective into perspective:',
        '  - Financial: Shareholder value, revenue, cost, asset utilization',
        '  - Customer: Customer acquisition, retention, satisfaction, share',
        '  - Internal Process: Operations, customer management, innovation, regulatory',
        '  - Learning & Growth: Human capital, information capital, organization capital',
        'Validate objective belongs in assigned perspective',
        'Identify gaps (perspectives without objectives)',
        'Suggest missing objectives if needed',
        'Save categorization to output directory'
      ],
      outputFormat: 'JSON with categorized (object by perspective), totalObjectives (number), gaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorized', 'totalObjectives', 'artifacts'],
      properties: {
        categorized: { type: 'object' },
        totalObjectives: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'categorization']
}));

// Task 2: Causal Relationships
export const causalRelationshipsTask = defineTask('causal-relationships', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify causal relationships',
  agent: {
    name: 'causal-analyst',
    prompt: {
      role: 'strategy cause-effect analyst',
      task: 'Identify cause-and-effect relationships between objectives',
      context: args,
      instructions: [
        'Identify causal links following logic:',
        '  - Learning enables process excellence',
        '  - Process excellence creates customer value',
        '  - Customer value drives financial results',
        'For each link document:',
        '  - From objective and To objective',
        '  - Causal mechanism (how does it work)',
        '  - Strength of relationship',
        '  - Time lag expectation',
        'Ensure no circular dependencies',
        'Identify multi-hop causal chains',
        'Save relationships to output directory'
      ],
      outputFormat: 'JSON with relationships (array of objects with from, to, mechanism, strength, timeLag), causalChains (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'artifacts'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              mechanism: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              timeLag: { type: 'string' }
            }
          }
        },
        causalChains: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'causal']
}));

// Task 3: Strategic Themes
export const strategicThemesTask = defineTask('strategic-themes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify strategic themes',
  agent: {
    name: 'theme-analyst',
    prompt: {
      role: 'strategic theme analyst',
      task: 'Identify strategic themes that span perspectives',
      context: args,
      instructions: [
        'Identify strategic themes (vertical pathways):',
        '  - Group related objectives across perspectives',
        '  - Themes should tell a coherent strategic story',
        '  - Common themes: Growth, Productivity, Customer Intimacy, etc.',
        'For each theme document:',
        '  - Theme name and description',
        '  - Objectives included',
        '  - Value creation logic',
        'Ensure all objectives belong to at least one theme',
        'Identify theme interdependencies',
        'Save themes to output directory'
      ],
      outputFormat: 'JSON with themes (array of objects with name, description, objectives, valueLogic), themeMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'artifacts'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              valueLogic: { type: 'string' }
            }
          }
        },
        themeMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'themes']
}));

// Task 4: Map Layout
export const mapLayoutTask = defineTask('map-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design map layout',
  agent: {
    name: 'layout-designer',
    prompt: {
      role: 'strategy map layout designer',
      task: 'Design the visual layout of the strategy map',
      context: args,
      instructions: [
        'Design layout with:',
        '  - Four horizontal perspective bands',
        '  - Financial at top, Learning at bottom',
        '  - Objectives as boxes within bands',
        '  - Arrows for causal links',
        'Position objectives:',
        '  - Group by strategic theme (columns)',
        '  - Minimize arrow crossings',
        '  - Balance visual distribution',
        'Define visual style:',
        '  - Color coding by theme or perspective',
        '  - Arrow styles for relationship strength',
        'Save layout to output directory'
      ],
      outputFormat: 'JSON with layout (object with positions, styles, grid), visualSpecs (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'artifacts'],
      properties: {
        layout: {
          type: 'object',
          properties: {
            positions: { type: 'object' },
            styles: { type: 'object' },
            grid: { type: 'object' }
          }
        },
        visualSpecs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'layout']
}));

// Task 5: Hypotheses Documentation
export const hypothesesDocumentationTask = defineTask('hypotheses-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document strategy hypotheses',
  agent: {
    name: 'hypothesis-documenter',
    prompt: {
      role: 'strategy hypothesis documenter',
      task: 'Document the strategic hypotheses embedded in the strategy map',
      context: args,
      instructions: [
        'Extract hypotheses from causal relationships:',
        '  - "If we improve X, then Y will improve"',
        '  - State expected outcomes and timing',
        'Document for each hypothesis:',
        '  - Hypothesis statement',
        '  - Underlying assumptions',
        '  - Leading indicators to monitor',
        '  - Evidence required to validate',
        'Prioritize hypotheses by strategic risk',
        'Identify hypotheses requiring testing',
        'Save hypotheses to output directory'
      ],
      outputFormat: 'JSON with hypotheses (array of objects with statement, assumptions, indicators, evidence, priority), testingPriorities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'artifacts'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              indicators: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        testingPriorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'hypotheses']
}));

// Task 6: Map Validation
export const mapValidationTask = defineTask('map-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate strategy map',
  agent: {
    name: 'map-validator',
    prompt: {
      role: 'strategy map validation expert',
      task: 'Validate the strategy map for completeness and logic',
      context: args,
      instructions: [
        'Validate structural completeness:',
        '  - All perspectives have objectives',
        '  - No orphan objectives (without links)',
        '  - All themes connect to financial outcomes',
        'Validate logical coherence:',
        '  - Causal chains make sense',
        '  - No circular dependencies',
        '  - Hypotheses are testable',
        'Validate strategic coverage:',
        '  - Key strategic priorities covered',
        '  - Balance across perspectives',
        'Calculate validation score',
        'Save validation to output directory'
      ],
      outputFormat: 'JSON with validation (object with structural, logical, coverage scores), issues (array), recommendations (array), overallScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validation', 'artifacts'],
      properties: {
        validation: {
          type: 'object',
          properties: {
            structural: { type: 'number' },
            logical: { type: 'number' },
            coverage: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        overallScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'validation']
}));

// Task 7: Visual Map Generation
export const visualMapGenerationTask = defineTask('visual-map-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate visual strategy map',
  agent: {
    name: 'visual-designer',
    prompt: {
      role: 'strategy map visual designer',
      task: 'Generate the visual representation of the strategy map',
      context: args,
      instructions: [
        'Generate strategy map visualization:',
        '  - Professional diagram format',
        '  - Clear perspective bands',
        '  - Objective boxes with names',
        '  - Causal arrows with labels',
        '  - Theme color coding',
        'Create multiple formats:',
        '  - Detailed operational map',
        '  - Executive summary view',
        '  - Theme-focused views',
        'Include legend and key',
        'Save visualizations to output directory'
      ],
      outputFormat: 'JSON with mapVisualization (object), executiveSummary (object), themeViews (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapVisualization', 'artifacts'],
      properties: {
        mapVisualization: { type: 'object' },
        executiveSummary: { type: 'object' },
        themeViews: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'visualization']
}));

// Task 8: Map Documentation
export const mapDocumentationTask = defineTask('map-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate map documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy map consultant and technical writer',
      task: 'Generate comprehensive strategy map documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document strategy map methodology',
        'Present visual strategy map',
        'Document each perspective and objectives',
        'Explain causal relationships',
        'Present strategic themes',
        'Document strategy hypotheses',
        'Include validation results',
        'Add guidance for using the map',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), keyElements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyElements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategy-map', 'documentation']
}));
