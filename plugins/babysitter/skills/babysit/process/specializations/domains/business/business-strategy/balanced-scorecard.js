/**
 * @process business-strategy/balanced-scorecard
 * @description Design and deployment of performance management system across financial, customer, internal process, and learning perspectives
 * @inputs { organizationContext: object, strategicObjectives: array, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, scorecard: object, strategyMap: object, measurementSystem: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    strategicObjectives = [],
    stakeholders = [],
    outputDir = 'bsc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Balanced Scorecard Implementation Process');

  // ============================================================================
  // PHASE 1: FINANCIAL PERSPECTIVE OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining financial perspective objectives');
  const financialPerspective = await ctx.task(financialPerspectiveTask, {
    organizationContext,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...financialPerspective.artifacts);

  // ============================================================================
  // PHASE 2: CUSTOMER PERSPECTIVE OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining customer perspective objectives');
  const customerPerspective = await ctx.task(customerPerspectiveTask, {
    organizationContext,
    strategicObjectives,
    financialObjectives: financialPerspective.objectives,
    outputDir
  });

  artifacts.push(...customerPerspective.artifacts);

  // ============================================================================
  // PHASE 3: INTERNAL PROCESS PERSPECTIVE OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining internal process perspective objectives');
  const processPerspective = await ctx.task(processPerspectiveTask, {
    organizationContext,
    strategicObjectives,
    customerObjectives: customerPerspective.objectives,
    outputDir
  });

  artifacts.push(...processPerspective.artifacts);

  // ============================================================================
  // PHASE 4: LEARNING AND GROWTH PERSPECTIVE OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining learning and growth perspective objectives');
  const learningPerspective = await ctx.task(learningPerspectiveTask, {
    organizationContext,
    strategicObjectives,
    processObjectives: processPerspective.objectives,
    outputDir
  });

  artifacts.push(...learningPerspective.artifacts);

  // ============================================================================
  // PHASE 5: STRATEGY MAP CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating strategy map');
  const strategyMap = await ctx.task(strategyMapTask, {
    financialPerspective,
    customerPerspective,
    processPerspective,
    learningPerspective,
    outputDir
  });

  artifacts.push(...strategyMap.artifacts);

  // Breakpoint: Review strategy map
  await ctx.breakpoint({
    question: `Strategy map complete. ${strategyMap.totalObjectives} objectives across 4 perspectives with ${strategyMap.causalLinks.length} cause-effect links. Review before measurement system?`,
    title: 'Balanced Scorecard Strategy Map Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        financialObjectives: financialPerspective.objectives.length,
        customerObjectives: customerPerspective.objectives.length,
        processObjectives: processPerspective.objectives.length,
        learningObjectives: learningPerspective.objectives.length,
        causalLinks: strategyMap.causalLinks.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: MEASURES AND TARGETS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining measures and targets');
  const measuresTargets = await ctx.task(measuresTargetsTask, {
    financialPerspective,
    customerPerspective,
    processPerspective,
    learningPerspective,
    outputDir
  });

  artifacts.push(...measuresTargets.artifacts);

  // ============================================================================
  // PHASE 7: INITIATIVES ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Aligning strategic initiatives');
  const initiativesAlignment = await ctx.task(initiativesAlignmentTask, {
    measuresTargets,
    strategicObjectives,
    organizationContext,
    outputDir
  });

  artifacts.push(...initiativesAlignment.artifacts);

  // ============================================================================
  // PHASE 8: CASCADING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating cascading framework');
  const cascadingFramework = await ctx.task(cascadingFrameworkTask, {
    scorecard: measuresTargets,
    organizationContext,
    outputDir
  });

  artifacts.push(...cascadingFramework.artifacts);

  // ============================================================================
  // PHASE 9: REPORTING AND REVIEW SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing reporting system');
  const reportingSystem = await ctx.task(reportingSystemTask, {
    measuresTargets,
    stakeholders,
    outputDir
  });

  artifacts.push(...reportingSystem.artifacts);

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive documentation');
  const bscDocumentation = await ctx.task(bscDocumentationTask, {
    financialPerspective,
    customerPerspective,
    processPerspective,
    learningPerspective,
    strategyMap,
    measuresTargets,
    initiativesAlignment,
    cascadingFramework,
    reportingSystem,
    outputDir
  });

  artifacts.push(...bscDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    scorecard: {
      financial: financialPerspective.objectives,
      customer: customerPerspective.objectives,
      internalProcess: processPerspective.objectives,
      learningGrowth: learningPerspective.objectives
    },
    strategyMap: strategyMap.map,
    measurementSystem: measuresTargets.measures,
    initiatives: initiativesAlignment.alignedInitiatives,
    reportingFramework: reportingSystem.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/balanced-scorecard',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Financial Perspective
export const financialPerspectiveTask = defineTask('financial-perspective', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define financial perspective objectives',
  agent: {
    name: 'financial-strategist',
    prompt: {
      role: 'financial strategy expert',
      task: 'Define objectives for the financial perspective of the balanced scorecard',
      context: args,
      instructions: [
        'Define financial objectives answering:',
        '  "If we succeed, how will we look to shareholders?"',
        'Consider objective themes:',
        '  - Revenue growth strategy',
        '  - Productivity strategy',
        '  - Asset utilization',
        '  - Risk management',
        'Define 3-5 financial objectives',
        'Ensure objectives are:',
        '  - Aligned with shareholder expectations',
        '  - Measurable with financial metrics',
        '  - Balanced between growth and productivity',
        'Save perspective to output directory'
      ],
      outputFormat: 'JSON with objectives (array of objects with name, description, theme, drivers), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              theme: { type: 'string' },
              drivers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'financial-perspective']
}));

// Task 2: Customer Perspective
export const customerPerspectiveTask = defineTask('customer-perspective', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define customer perspective objectives',
  agent: {
    name: 'customer-strategist',
    prompt: {
      role: 'customer strategy expert',
      task: 'Define objectives for the customer perspective of the balanced scorecard',
      context: args,
      instructions: [
        'Define customer objectives answering:',
        '  "To achieve financial goals, how must we appear to customers?"',
        'Consider customer value proposition:',
        '  - Product/service attributes',
        '  - Customer relationship',
        '  - Image and reputation',
        'Consider objective themes:',
        '  - Customer acquisition',
        '  - Customer retention',
        '  - Customer satisfaction',
        '  - Customer profitability',
        '  - Market share',
        'Define 3-5 customer objectives',
        'Link to financial objectives',
        'Save perspective to output directory'
      ],
      outputFormat: 'JSON with objectives (array of objects), valueProposition (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              theme: { type: 'string' },
              linkedFinancialObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        valueProposition: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'customer-perspective']
}));

// Task 3: Internal Process Perspective
export const processPerspectiveTask = defineTask('process-perspective', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define internal process perspective objectives',
  agent: {
    name: 'process-strategist',
    prompt: {
      role: 'process strategy expert',
      task: 'Define objectives for the internal process perspective',
      context: args,
      instructions: [
        'Define process objectives answering:',
        '  "To satisfy customers, at which processes must we excel?"',
        'Consider process categories:',
        '  - Operations management processes',
        '  - Customer management processes',
        '  - Innovation processes',
        '  - Regulatory and social processes',
        'Define 4-6 process objectives',
        'Link to customer objectives',
        'Identify critical processes for value creation',
        'Save perspective to output directory'
      ],
      outputFormat: 'JSON with objectives (array of objects), criticalProcesses (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              linkedCustomerObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalProcesses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'process-perspective']
}));

// Task 4: Learning and Growth Perspective
export const learningPerspectiveTask = defineTask('learning-perspective', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define learning and growth perspective objectives',
  agent: {
    name: 'learning-strategist',
    prompt: {
      role: 'learning and organizational development expert',
      task: 'Define objectives for the learning and growth perspective',
      context: args,
      instructions: [
        'Define learning objectives answering:',
        '  "To achieve process excellence, how must we learn and improve?"',
        'Consider intangible asset categories:',
        '  - Human capital (skills, training, knowledge)',
        '  - Information capital (systems, databases, networks)',
        '  - Organization capital (culture, leadership, alignment)',
        'Define 3-5 learning objectives',
        'Link to process objectives',
        'Identify capability gaps to address',
        'Save perspective to output directory'
      ],
      outputFormat: 'JSON with objectives (array of objects), capabilityGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              linkedProcessObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        capabilityGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'learning-perspective']
}));

// Task 5: Strategy Map
export const strategyMapTask = defineTask('strategy-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create strategy map',
  agent: {
    name: 'strategy-mapper',
    prompt: {
      role: 'strategy map architect',
      task: 'Create visual strategy map showing cause-effect relationships',
      context: args,
      instructions: [
        'Create strategy map visualization:',
        '  - Four horizontal perspective bands',
        '  - Objectives as boxes within bands',
        '  - Cause-effect arrows between objectives',
        'Document causal linkages:',
        '  - Learning drives process excellence',
        '  - Process excellence drives customer value',
        '  - Customer value drives financial results',
        'Identify strategic themes (vertical pathways)',
        'Validate logical flow of strategy',
        'Save strategy map to output directory'
      ],
      outputFormat: 'JSON with map (object), causalLinks (array), strategicThemes (array), totalObjectives (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'causalLinks', 'totalObjectives', 'artifacts'],
      properties: {
        map: { type: 'object' },
        causalLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        strategicThemes: { type: 'array', items: { type: 'string' } },
        totalObjectives: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'strategy-map']
}));

// Task 6: Measures and Targets
export const measuresTargetsTask = defineTask('measures-targets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define measures and targets',
  agent: {
    name: 'measurement-designer',
    prompt: {
      role: 'performance measurement expert',
      task: 'Define measures and targets for each objective',
      context: args,
      instructions: [
        'For each objective define:',
        '  - 1-2 measures (leading and/or lagging)',
        '  - Current baseline',
        '  - Target value',
        '  - Target timeline',
        'Ensure measures are:',
        '  - Quantifiable and objective',
        '  - Reliable and consistent',
        '  - Available at reasonable cost',
        '  - Balanced (leading vs lagging)',
        'Create measure data dictionary',
        'Save measures to output directory'
      ],
      outputFormat: 'JSON with measures (object mapping objectives to measures), dataDictionary (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'artifacts'],
      properties: {
        measures: { type: 'object' },
        dataDictionary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              measure: { type: 'string' },
              definition: { type: 'string' },
              source: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'measures']
}));

// Task 7: Initiatives Alignment
export const initiativesAlignmentTask = defineTask('initiatives-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align strategic initiatives',
  agent: {
    name: 'initiative-aligner',
    prompt: {
      role: 'strategic initiative alignment expert',
      task: 'Align strategic initiatives to scorecard objectives',
      context: args,
      instructions: [
        'Map existing initiatives to objectives',
        'Identify initiative gaps (objectives without initiatives)',
        'Identify orphan initiatives (no objective link)',
        'Recommend new initiatives for gaps',
        'Prioritize initiatives by objective impact',
        'Create initiative-objective alignment matrix',
        'Save alignment to output directory'
      ],
      outputFormat: 'JSON with alignedInitiatives (array), initiativeGaps (array), orphanInitiatives (array), alignmentMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignedInitiatives', 'artifacts'],
      properties: {
        alignedInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        initiativeGaps: { type: 'array', items: { type: 'string' } },
        orphanInitiatives: { type: 'array', items: { type: 'string' } },
        alignmentMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'initiatives']
}));

// Task 8: Cascading Framework
export const cascadingFrameworkTask = defineTask('cascading-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create cascading framework',
  agent: {
    name: 'cascade-designer',
    prompt: {
      role: 'scorecard cascading specialist',
      task: 'Design framework for cascading scorecard to units',
      context: args,
      instructions: [
        'Design cascade approach:',
        '  - Direct contribution (same measure)',
        '  - Indirect contribution (supporting measure)',
        '  - Influenced measures',
        'Create unit-level scorecard templates',
        'Define cascade process:',
        '  - Top-down communication',
        '  - Bottom-up negotiation',
        '  - Alignment review',
        'Document cascade rules and guidelines',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with cascadeApproach (object), unitTemplates (array), cascadeProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cascadeApproach', 'artifacts'],
      properties: {
        cascadeApproach: { type: 'object' },
        unitTemplates: { type: 'array' },
        cascadeProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'cascading']
}));

// Task 9: Reporting System
export const reportingSystemTask = defineTask('reporting-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reporting system',
  agent: {
    name: 'reporting-designer',
    prompt: {
      role: 'performance reporting specialist',
      task: 'Design the scorecard reporting and review system',
      context: args,
      instructions: [
        'Design reporting framework:',
        '  - Reporting frequency by measure',
        '  - Report formats and dashboards',
        '  - Distribution lists',
        'Design review meetings:',
        '  - Monthly operational reviews',
        '  - Quarterly strategy reviews',
        '  - Annual planning integration',
        'Define escalation procedures',
        'Create report templates',
        'Save system design to output directory'
      ],
      outputFormat: 'JSON with framework (object with reporting, reviews, escalation), reportTemplates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            reporting: { type: 'object' },
            reviews: { type: 'object' },
            escalation: { type: 'object' }
          }
        },
        reportTemplates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bsc', 'reporting']
}));

// Task 10: BSC Documentation
export const bscDocumentationTask = defineTask('bsc-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate BSC documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'balanced scorecard consultant and technical writer',
      task: 'Generate comprehensive Balanced Scorecard documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document each perspective:',
        '  - Financial objectives and measures',
        '  - Customer objectives and measures',
        '  - Process objectives and measures',
        '  - Learning objectives and measures',
        'Include strategy map visualization',
        'Document measurement system',
        'Include initiative portfolio',
        'Document cascading framework',
        'Include reporting system design',
        'Add implementation roadmap',
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
  labels: ['agent', 'bsc', 'documentation']
}));
