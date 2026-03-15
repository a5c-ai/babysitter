/**
 * @process humanities/participant-observation-protocol
 * @description Conduct systematic participant observation with structured field note taking, daily reflection, and iterative analysis during extended community immersion
 * @inputs { researchFocus: string, observationSite: string, duration: string, observationMode: string }
 * @outputs { success: boolean, fieldNotes: array, analyticalMemos: array, emergentThemes: array, artifacts: array }
 * @recommendedSkills SK-HUM-002 (ethnographic-coding-thematics), SK-HUM-008 (oral-history-interview-technique)
 * @recommendedAgents AG-HUM-002 (ethnographic-methods-advisor), AG-HUM-006 (oral-historian)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchFocus,
    observationSite,
    duration = '1 week',
    observationMode = 'moderate participation',
    ethicsProtocol = {},
    outputDir = 'observation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Observation Protocol Setup
  ctx.log('info', 'Setting up observation protocols');
  const protocolSetup = await ctx.task(observationSetupTask, {
    researchFocus,
    observationSite,
    observationMode,
    outputDir
  });

  if (!protocolSetup.success) {
    return {
      success: false,
      error: 'Protocol setup failed',
      details: protocolSetup,
      metadata: { processId: 'humanities/participant-observation-protocol', timestamp: startTime }
    };
  }

  artifacts.push(...protocolSetup.artifacts);

  // Task 2: Field Note Documentation
  ctx.log('info', 'Conducting field note documentation');
  const fieldNotes = await ctx.task(fieldNoteDocumentationTask, {
    researchFocus,
    observationSite,
    protocolSetup,
    outputDir
  });

  artifacts.push(...fieldNotes.artifacts);

  // Task 3: Daily Reflection and Journaling
  ctx.log('info', 'Processing daily reflections');
  const dailyReflections = await ctx.task(dailyReflectionTask, {
    fieldNotes,
    researchFocus,
    outputDir
  });

  artifacts.push(...dailyReflections.artifacts);

  // Task 4: Iterative Coding and Analysis
  ctx.log('info', 'Conducting iterative analysis');
  const iterativeAnalysis = await ctx.task(iterativeAnalysisTask, {
    fieldNotes,
    dailyReflections,
    researchFocus,
    outputDir
  });

  artifacts.push(...iterativeAnalysis.artifacts);

  // Task 5: Emergent Theme Identification
  ctx.log('info', 'Identifying emergent themes');
  const themeIdentification = await ctx.task(themeIdentificationTask, {
    iterativeAnalysis,
    fieldNotes,
    outputDir
  });

  artifacts.push(...themeIdentification.artifacts);

  // Task 6: Analytical Memo Writing
  ctx.log('info', 'Writing analytical memos');
  const analyticalMemos = await ctx.task(analyticalMemoTask, {
    themeIdentification,
    iterativeAnalysis,
    researchFocus,
    outputDir
  });

  artifacts.push(...analyticalMemos.artifacts);

  // Task 7: Generate Observation Report
  ctx.log('info', 'Generating observation report');
  const observationReport = await ctx.task(observationReportTask, {
    protocolSetup,
    fieldNotes,
    dailyReflections,
    iterativeAnalysis,
    themeIdentification,
    analyticalMemos,
    outputDir
  });

  artifacts.push(...observationReport.artifacts);

  // Breakpoint: Review observation findings
  await ctx.breakpoint({
    question: `Observation cycle complete at ${observationSite}. ${themeIdentification.themes?.length || 0} emergent themes identified. Review findings?`,
    title: 'Participant Observation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        observationSite,
        duration,
        observationMode,
        fieldNoteCount: fieldNotes.notes?.length || 0,
        emergentThemes: themeIdentification.themes?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    fieldNotes: fieldNotes.notes,
    analyticalMemos: analyticalMemos.memos,
    emergentThemes: themeIdentification.themes,
    analysis: {
      codes: iterativeAnalysis.codes,
      categories: iterativeAnalysis.categories,
      patterns: iterativeAnalysis.patterns
    },
    reflections: dailyReflections.reflections,
    artifacts,
    duration: duration_ms,
    metadata: {
      processId: 'humanities/participant-observation-protocol',
      timestamp: startTime,
      observationSite,
      outputDir
    }
  };
}

// Task 1: Observation Protocol Setup
export const observationSetupTask = defineTask('observation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up observation protocols',
  agent: {
    name: 'ethnographer',
    prompt: {
      role: 'participant observer specialist',
      task: 'Establish observation protocols and frameworks',
      context: args,
      instructions: [
        'Define observation schedule and timing',
        'Establish field note format and conventions',
        'Clarify researcher role on participation spectrum',
        'Create observation focus areas aligned with research questions',
        'Develop sensitizing concepts list',
        'Establish rapport-building strategies',
        'Create recording and documentation guidelines',
        'Define ethical boundaries during observation'
      ],
      outputFormat: 'JSON with success, protocols, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'protocols', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        protocols: {
          type: 'object',
          properties: {
            observationFoci: { type: 'array', items: { type: 'string' } },
            participationLevel: { type: 'string' },
            documentationFormat: { type: 'object' }
          }
        },
        schedule: { type: 'object' },
        sensitizingConcepts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observation', 'protocol', 'ethnography']
}));

// Task 2: Field Note Documentation
export const fieldNoteDocumentationTask = defineTask('field-note-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document field observations',
  agent: {
    name: 'field-researcher',
    prompt: {
      role: 'ethnographic field researcher',
      task: 'Create comprehensive field notes from observations',
      context: args,
      instructions: [
        'Record descriptive observations (what happened)',
        'Document sensory details (sights, sounds, smells)',
        'Note social interactions and dynamics',
        'Record verbatim quotes and dialogue',
        'Document spatial arrangements and movements',
        'Note temporal patterns and sequences',
        'Include researcher reactions and questions',
        'Distinguish description from interpretation'
      ],
      outputFormat: 'JSON with notes array, observationSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notes', 'artifacts'],
      properties: {
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              interpretation: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        observationSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'field-notes', 'documentation', 'ethnography']
}));

// Task 3: Daily Reflection and Journaling
export const dailyReflectionTask = defineTask('daily-reflection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process daily reflections',
  agent: {
    name: 'reflexive-researcher',
    prompt: {
      role: 'reflexive ethnographer',
      task: 'Conduct daily reflection on observations and researcher positionality',
      context: args,
      instructions: [
        'Reflect on key observations and surprises',
        'Examine researcher reactions and biases',
        'Consider positionality and its influence',
        'Identify emerging questions',
        'Note methodological adjustments needed',
        'Reflect on rapport and relationships',
        'Document emotional responses',
        'Consider theoretical connections'
      ],
      outputFormat: 'JSON with reflections, positionality notes, adjustments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reflections', 'artifacts'],
      properties: {
        reflections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              keyInsights: { type: 'array', items: { type: 'string' } },
              surprises: { type: 'array', items: { type: 'string' } },
              questions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        positionalityNotes: { type: 'string' },
        methodologicalAdjustments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'reflexivity', 'ethnography']
}));

// Task 4: Iterative Coding and Analysis
export const iterativeAnalysisTask = defineTask('iterative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct iterative coding and analysis',
  agent: {
    name: 'qualitative-analyst',
    prompt: {
      role: 'qualitative data analyst',
      task: 'Perform iterative coding and analysis of field notes',
      context: args,
      instructions: [
        'Conduct initial open coding of field notes',
        'Identify recurring patterns and regularities',
        'Develop focused codes from initial codes',
        'Create categories from focused codes',
        'Identify relationships between categories',
        'Apply constant comparison method',
        'Note negative cases and variations',
        'Track code evolution and refinement'
      ],
      outputFormat: 'JSON with codes, categories, patterns, codeEvolution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['codes', 'categories', 'artifacts'],
      properties: {
        codes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              definition: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'object' } },
        negativeCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'coding', 'analysis', 'qualitative']
}));

// Task 5: Emergent Theme Identification
export const themeIdentificationTask = defineTask('theme-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify emergent themes',
  agent: {
    name: 'thematic-analyst',
    prompt: {
      role: 'thematic analysis specialist',
      task: 'Identify and develop emergent themes from coded data',
      context: args,
      instructions: [
        'Review codes and categories for thematic patterns',
        'Identify overarching themes that capture meaning',
        'Develop theme names and definitions',
        'Map relationships between themes',
        'Identify subthemes within larger themes',
        'Consider theoretical resonance of themes',
        'Assess theme saturation',
        'Create thematic map visualization'
      ],
      outputFormat: 'JSON with themes, thematicMap, saturation, artifacts'
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
              definition: { type: 'string' },
              subthemes: { type: 'array', items: { type: 'string' } },
              supportingData: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        thematicMap: { type: 'object' },
        saturationAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'themes', 'thematic-analysis', 'ethnography']
}));

// Task 6: Analytical Memo Writing
export const analyticalMemoTask = defineTask('analytical-memo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write analytical memos',
  agent: {
    name: 'memo-writer',
    prompt: {
      role: 'ethnographic analyst',
      task: 'Write analytical memos exploring themes and theoretical connections',
      context: args,
      instructions: [
        'Write memos exploring each major theme',
        'Connect observations to theoretical concepts',
        'Explore relationships between themes',
        'Document analytical decisions and rationale',
        'Identify gaps requiring further investigation',
        'Consider alternative interpretations',
        'Develop theoretical propositions',
        'Link to existing literature'
      ],
      outputFormat: 'JSON with memos, theoreticalConnections, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['memos', 'artifacts'],
      properties: {
        memos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              theme: { type: 'string' },
              content: { type: 'string' },
              theoreticalConnections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        theoreticalPropositions: { type: 'array', items: { type: 'string' } },
        researchGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'memos', 'analysis', 'theory-building']
}));

// Task 7: Observation Report Generation
export const observationReportTask = defineTask('observation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate observation report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'ethnographic writer',
      task: 'Generate comprehensive observation period report',
      context: args,
      instructions: [
        'Summarize observation activities and scope',
        'Present key findings and themes',
        'Include rich descriptive excerpts',
        'Document analytical process',
        'Present preliminary interpretations',
        'Identify next steps and follow-up needed',
        'Include reflexivity statement',
        'Format as professional ethnographic report'
      ],
      outputFormat: 'JSON with reportPath, keyFindings, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        preliminaryInterpretations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'ethnography', 'documentation']
}));
