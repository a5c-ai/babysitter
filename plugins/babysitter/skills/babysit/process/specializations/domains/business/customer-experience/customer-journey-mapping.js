/**
 * @process customer-experience/customer-journey-mapping
 * @description Facilitated process for mapping end-to-end customer journeys, identifying pain points, and designing improvements
 * @inputs { journeyScope: object, customerPersonas: array, touchpointData: object, feedbackData: array }
 * @outputs { success: boolean, journeyMap: object, painPoints: array, improvements: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    journeyScope = {},
    customerPersonas = [],
    touchpointData = {},
    feedbackData = [],
    outputDir = 'journey-mapping-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Journey Mapping Workshop Process');

  // ============================================================================
  // PHASE 1: WORKSHOP PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing journey mapping workshop');
  const workshopPreparation = await ctx.task(workshopPreparationTask, {
    journeyScope,
    customerPersonas,
    outputDir
  });

  artifacts.push(...workshopPreparation.artifacts);

  // ============================================================================
  // PHASE 2: PERSONA VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating customer personas');
  const personaValidation = await ctx.task(personaValidationTask, {
    customerPersonas,
    feedbackData,
    outputDir
  });

  artifacts.push(...personaValidation.artifacts);

  // ============================================================================
  // PHASE 3: JOURNEY STAGE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping journey stages');
  const stageMapping = await ctx.task(stageMappingTask, {
    journeyScope,
    personaValidation,
    touchpointData,
    outputDir
  });

  artifacts.push(...stageMapping.artifacts);

  // ============================================================================
  // PHASE 4: TOUCHPOINT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying touchpoints');
  const touchpointIdentification = await ctx.task(touchpointIdentificationTask, {
    stageMapping,
    touchpointData,
    personaValidation,
    outputDir
  });

  artifacts.push(...touchpointIdentification.artifacts);

  // ============================================================================
  // PHASE 5: EMOTION AND EXPERIENCE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping emotions and experiences');
  const emotionMapping = await ctx.task(emotionMappingTask, {
    stageMapping,
    touchpointIdentification,
    feedbackData,
    outputDir
  });

  artifacts.push(...emotionMapping.artifacts);

  // ============================================================================
  // PHASE 6: PAIN POINT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing pain points');
  const painPointAnalysis = await ctx.task(painPointAnalysisTask, {
    emotionMapping,
    touchpointIdentification,
    feedbackData,
    outputDir
  });

  artifacts.push(...painPointAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: MOMENT OF TRUTH IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying moments of truth');
  const momentOfTruthIdentification = await ctx.task(momentOfTruthTask, {
    stageMapping,
    emotionMapping,
    painPointAnalysis,
    outputDir
  });

  artifacts.push(...momentOfTruthIdentification.artifacts);

  // ============================================================================
  // PHASE 8: IMPROVEMENT OPPORTUNITY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 8: Mapping improvement opportunities');
  const improvementMapping = await ctx.task(improvementMappingTask, {
    painPointAnalysis,
    momentOfTruthIdentification,
    emotionMapping,
    outputDir
  });

  artifacts.push(...improvementMapping.artifacts);

  // ============================================================================
  // PHASE 9: JOURNEY MAP VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating journey map visualization');
  const journeyVisualization = await ctx.task(journeyVisualizationTask, {
    stageMapping,
    touchpointIdentification,
    emotionMapping,
    painPointAnalysis,
    momentOfTruthIdentification,
    improvementMapping,
    outputDir
  });

  artifacts.push(...journeyVisualization.artifacts);

  const painPointCount = painPointAnalysis.painPoints?.length || 0;
  const improvementCount = improvementMapping.improvements?.length || 0;

  await ctx.breakpoint({
    question: `Customer journey mapping complete. Stages mapped: ${stageMapping.stages?.length || 0}. Touchpoints: ${touchpointIdentification.touchpoints?.length || 0}. Pain points: ${painPointCount}. Improvement opportunities: ${improvementCount}. Review and finalize?`,
    title: 'Journey Mapping Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        stagesCount: stageMapping.stages?.length || 0,
        touchpointsCount: touchpointIdentification.touchpoints?.length || 0,
        painPointCount,
        improvementCount,
        momentsOfTruth: momentOfTruthIdentification.moments?.length || 0,
        personasValidated: personaValidation.personas?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    journeyMap: {
      scope: journeyScope,
      personas: personaValidation.personas,
      stages: stageMapping.stages,
      touchpoints: touchpointIdentification.touchpoints,
      emotions: emotionMapping.emotionCurve,
      visualization: journeyVisualization.map
    },
    painPoints: painPointAnalysis.painPoints,
    momentsOfTruth: momentOfTruthIdentification.moments,
    improvements: improvementMapping.improvements,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/customer-journey-mapping',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const workshopPreparationTask = defineTask('workshop-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare journey mapping workshop',
  agent: {
    name: 'workshop-planner',
    prompt: {
      role: 'journey mapping facilitator',
      task: 'Prepare materials and agenda for journey mapping workshop',
      context: args,
      instructions: [
        'Define workshop objectives',
        'Create workshop agenda',
        'Identify required participants',
        'Prepare journey scope documentation',
        'Create persona profiles for review',
        'Prepare touchpoint inventory',
        'Design workshop exercises',
        'Prepare visualization templates',
        'Generate preparation package'
      ],
      outputFormat: 'JSON with agenda, participants, materials, exercises, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'participants', 'artifacts'],
      properties: {
        agenda: { type: 'object' },
        participants: { type: 'array', items: { type: 'object' } },
        materials: { type: 'array', items: { type: 'object' } },
        exercises: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'preparation']
}));

export const personaValidationTask = defineTask('persona-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate customer personas',
  agent: {
    name: 'persona-validator',
    prompt: {
      role: 'customer research specialist',
      task: 'Validate and refine customer personas for journey mapping',
      context: args,
      instructions: [
        'Review existing persona definitions',
        'Validate personas against feedback data',
        'Identify persona gaps',
        'Refine persona characteristics',
        'Define persona goals and motivations',
        'Identify persona pain points',
        'Document persona journey triggers',
        'Prioritize personas for mapping',
        'Generate validated personas'
      ],
      outputFormat: 'JSON with personas, validations, gaps, refinements, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'validations', 'artifacts'],
      properties: {
        personas: { type: 'array', items: { type: 'object' } },
        validations: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        refinements: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'personas']
}));

export const stageMappingTask = defineTask('stage-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map journey stages',
  agent: {
    name: 'stage-mapper',
    prompt: {
      role: 'journey design specialist',
      task: 'Map high-level journey stages and phases',
      context: args,
      instructions: [
        'Define journey start and end points',
        'Identify major journey phases',
        'Map sub-stages within phases',
        'Define stage transitions',
        'Identify stage objectives',
        'Map customer actions per stage',
        'Define stage success criteria',
        'Document stage dependencies',
        'Generate stage map'
      ],
      outputFormat: 'JSON with stages, phases, transitions, objectives, actions, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'phases', 'artifacts'],
      properties: {
        stages: { type: 'array', items: { type: 'object' } },
        phases: { type: 'array', items: { type: 'object' } },
        transitions: { type: 'array', items: { type: 'object' } },
        objectives: { type: 'object' },
        actions: { type: 'object' },
        successCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'stages']
}));

export const touchpointIdentificationTask = defineTask('touchpoint-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify touchpoints',
  agent: {
    name: 'touchpoint-identifier',
    prompt: {
      role: 'touchpoint analysis specialist',
      task: 'Identify all customer touchpoints across the journey',
      context: args,
      instructions: [
        'Inventory all touchpoints',
        'Map touchpoints to stages',
        'Categorize by channel',
        'Identify touchpoint owners',
        'Document touchpoint purpose',
        'Assess touchpoint effectiveness',
        'Identify touchpoint dependencies',
        'Map cross-channel handoffs',
        'Generate touchpoint inventory'
      ],
      outputFormat: 'JSON with touchpoints, byStage, byChannel, owners, effectiveness, handoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['touchpoints', 'byStage', 'artifacts'],
      properties: {
        touchpoints: { type: 'array', items: { type: 'object' } },
        byStage: { type: 'object' },
        byChannel: { type: 'object' },
        owners: { type: 'object' },
        effectiveness: { type: 'object' },
        handoffs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'touchpoints']
}));

export const emotionMappingTask = defineTask('emotion-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map emotions and experiences',
  agent: {
    name: 'emotion-mapper',
    prompt: {
      role: 'customer experience researcher',
      task: 'Map customer emotions and experiences throughout the journey',
      context: args,
      instructions: [
        'Identify emotional highs and lows',
        'Map emotions to stages',
        'Create emotion curve',
        'Document experience drivers',
        'Identify frustration triggers',
        'Map satisfaction moments',
        'Document customer thoughts',
        'Capture verbatim feedback',
        'Generate emotion map'
      ],
      outputFormat: 'JSON with emotionCurve, byStage, highs, lows, drivers, frustrations, satisfaction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['emotionCurve', 'byStage', 'artifacts'],
      properties: {
        emotionCurve: { type: 'array', items: { type: 'object' } },
        byStage: { type: 'object' },
        highs: { type: 'array', items: { type: 'object' } },
        lows: { type: 'array', items: { type: 'object' } },
        drivers: { type: 'array', items: { type: 'object' } },
        frustrations: { type: 'array', items: { type: 'object' } },
        satisfaction: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'emotions']
}));

export const painPointAnalysisTask = defineTask('pain-point-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze pain points',
  agent: {
    name: 'pain-point-analyst',
    prompt: {
      role: 'customer pain point specialist',
      task: 'Analyze and prioritize customer pain points',
      context: args,
      instructions: [
        'Identify all pain points',
        'Categorize pain points',
        'Assess pain point severity',
        'Calculate frequency of occurrence',
        'Estimate business impact',
        'Identify root causes',
        'Map to touchpoints and stages',
        'Prioritize for improvement',
        'Generate pain point analysis'
      ],
      outputFormat: 'JSON with painPoints, categories, severity, frequency, impact, rootCauses, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['painPoints', 'priorities', 'artifacts'],
      properties: {
        painPoints: { type: 'array', items: { type: 'object' } },
        categories: { type: 'object' },
        severity: { type: 'object' },
        frequency: { type: 'object' },
        impact: { type: 'object' },
        rootCauses: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'pain-points']
}));

export const momentOfTruthTask = defineTask('moment-of-truth', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify moments of truth',
  agent: {
    name: 'mot-identifier',
    prompt: {
      role: 'customer experience strategist',
      task: 'Identify critical moments of truth in the customer journey',
      context: args,
      instructions: [
        'Identify decision points',
        'Find loyalty-building moments',
        'Identify churn risk moments',
        'Map first impressions',
        'Identify value realization moments',
        'Document emotional peaks',
        'Assess moment importance',
        'Prioritize moments for improvement',
        'Generate moments of truth analysis'
      ],
      outputFormat: 'JSON with moments, decisionPoints, loyaltyMoments, churnRisks, valueRealization, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['moments', 'priorities', 'artifacts'],
      properties: {
        moments: { type: 'array', items: { type: 'object' } },
        decisionPoints: { type: 'array', items: { type: 'object' } },
        loyaltyMoments: { type: 'array', items: { type: 'object' } },
        churnRisks: { type: 'array', items: { type: 'object' } },
        valueRealization: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'moments-of-truth']
}));

export const improvementMappingTask = defineTask('improvement-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map improvement opportunities',
  agent: {
    name: 'improvement-mapper',
    prompt: {
      role: 'customer experience improvement specialist',
      task: 'Map and prioritize improvement opportunities',
      context: args,
      instructions: [
        'Identify improvement opportunities',
        'Link to pain points',
        'Estimate improvement impact',
        'Assess implementation effort',
        'Calculate ROI potential',
        'Identify quick wins',
        'Create improvement roadmap',
        'Assign ownership',
        'Generate improvement plan'
      ],
      outputFormat: 'JSON with improvements, linkedPainPoints, impact, effort, roi, quickWins, roadmap, ownership, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['improvements', 'roadmap', 'artifacts'],
      properties: {
        improvements: { type: 'array', items: { type: 'object' } },
        linkedPainPoints: { type: 'object' },
        impact: { type: 'object' },
        effort: { type: 'object' },
        roi: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'object' } },
        roadmap: { type: 'object' },
        ownership: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'improvements']
}));

export const journeyVisualizationTask = defineTask('journey-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create journey map visualization',
  agent: {
    name: 'journey-visualizer',
    prompt: {
      role: 'journey map designer',
      task: 'Create comprehensive journey map visualization',
      context: args,
      instructions: [
        'Design journey map layout',
        'Visualize stages and touchpoints',
        'Overlay emotion curve',
        'Highlight pain points',
        'Mark moments of truth',
        'Show improvement opportunities',
        'Add annotations and callouts',
        'Create multiple views',
        'Generate journey map documentation'
      ],
      outputFormat: 'JSON with map, layout, visualizations, annotations, views, exportFormats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'layout', 'artifacts'],
      properties: {
        map: { type: 'object' },
        layout: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } },
        annotations: { type: 'array', items: { type: 'object' } },
        views: { type: 'array', items: { type: 'object' } },
        exportFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'journey-mapping', 'visualization']
}));
