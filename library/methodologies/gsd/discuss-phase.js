/**
 * @process gsd/discuss-phase
 * @description GSD phase discussion - capture implementation preferences before planning
 * @inputs { phaseId: string, phaseName: string, requirements: array }
 * @outputs { success: boolean, context: object, preferences: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Phase Discussion Process
 *
 * GSD Methodology: Identify gray areas and capture preferences BEFORE planning
 *
 * Purpose: Reduce back-and-forth during planning by capturing:
 * - Layout and UI preferences
 * - API patterns and conventions
 * - Content structure and organization
 * - Technology choices within the stack
 * - Testing strategies
 *
 * Agents referenced from agents/ directory:
 *   - gsd-project-researcher: Identifies decision points and captures preferences
 *   - gsd-planner: Generates implementation context from decisions
 *
 * Skills referenced from skills/ directory:
 *   - context-engineering: Context document generation and management
 *   - template-scaffolding: Phase context document templates
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {array} inputs.requirements - Requirements for this phase
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with captured context and preferences
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    requirements = []
  } = inputs;

  // ============================================================================
  // PHASE 1: IDENTIFY DECISION POINTS
  // ============================================================================

  const decisionPointsResult = await ctx.task(identifyDecisionPointsTask, {
    phaseId,
    phaseName,
    requirements,
    vision: inputs.vision,
    research: inputs.research
  });

  // ============================================================================
  // PHASE 2: CAPTURE PREFERENCES
  // ============================================================================

  const preferencesResult = await ctx.task(capturePreferencesTask, {
    phaseId,
    phaseName,
    requirements,
    decisionPoints: decisionPointsResult.decisionPoints
  });

  // Breakpoint: Review captured preferences
  await ctx.breakpoint({
    question: `Review implementation preferences for phase "${phaseName}". Are these accurate?`,
    title: `Phase Discussion: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${phaseId}-CONTEXT.md`, format: 'markdown', label: 'Phase Context' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: GENERATE IMPLEMENTATION CONTEXT
  // ============================================================================

  const contextResult = await ctx.task(generateContextTask, {
    phaseId,
    phaseName,
    requirements,
    decisionPoints: decisionPointsResult.decisionPoints,
    preferences: preferencesResult.preferences
  });

  return {
    success: true,
    phaseId,
    phaseName,
    decisionPoints: decisionPointsResult.decisionPoints,
    preferences: preferencesResult.preferences,
    context: contextResult,
    artifacts: {
      context: `artifacts/${phaseId}-CONTEXT.md`
    },
    metadata: {
      processId: 'gsd/discuss-phase',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Identify Decision Points Task
 * Analyzes phase requirements to find areas needing user input
 */
export const identifyDecisionPointsTask = defineTask('identify-decision-points', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify decisions: ${args.phaseName}`,
  description: 'Analyze requirements to find gray areas and decision points',

  agent: {
    name: 'gsd-project-researcher',
    prompt: {
      role: 'senior product manager and UX architect',
      task: 'Identify implementation decision points that need user preferences',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        requirements: args.requirements,
        vision: args.vision,
        research: args.research
      },
      instructions: [
        'Analyze each requirement for ambiguous or subjective aspects',
        'Identify layout and UI decisions (navigation, forms, data display)',
        'Identify API pattern decisions (REST, GraphQL, endpoints, authentication)',
        'Identify content structure decisions (data models, hierarchies)',
        'Identify organizational decisions (folder structure, naming conventions)',
        'Identify technology choices within approved stack (libraries, tools)',
        'Identify testing strategy decisions (unit, integration, e2e levels)',
        'For each decision point: describe the choice, list 2-4 options, explain trade-offs'
      ],
      outputFormat: 'JSON with decisionPoints (array of objects with category, question, options, tradeoffs, recommendation)'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionPoints'],
      properties: {
        decisionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: {
                type: 'string',
                enum: ['layout', 'api', 'content', 'organization', 'technology', 'testing', 'styling', 'other']
              },
              question: { type: 'string' },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    pros: { type: 'array', items: { type: 'string' } },
                    cons: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              recommendation: { type: 'string' },
              tradeoffs: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'discussion', 'decision-points']
}));

/**
 * Capture Preferences Task
 * Interactive gathering of user preferences for each decision point
 */
export const capturePreferencesTask = defineTask('capture-preferences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capture user preferences',
  description: 'Gather implementation preferences from decision points',

  agent: {
    name: 'gsd-project-researcher',
    prompt: {
      role: 'product manager facilitating technical decisions',
      task: 'Present decision points and capture user preferences in a structured format',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        requirements: args.requirements,
        decisionPoints: args.decisionPoints
      },
      instructions: [
        'For each decision point, present the question and options clearly',
        'Explain trade-offs in practical terms',
        'Provide recommendation with justification',
        'Capture user selection or custom preference',
        'Document rationale for each preference',
        'Identify any preferences that conflict or need reconciliation',
        'Generate summary of all captured preferences'
      ],
      outputFormat: 'JSON with preferences (array of objects with decisionId, selected, rationale, customization)'
    },
    outputSchema: {
      type: 'object',
      required: ['preferences'],
      properties: {
        preferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decisionId: { type: 'string' },
              category: { type: 'string' },
              selected: { type: 'string' },
              rationale: { type: 'string' },
              customization: { type: 'string' }
            }
          }
        },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'discussion', 'preferences']
}));

/**
 * Generate Context Task
 * Creates comprehensive context document for planning phase
 */
export const generateContextTask = defineTask('generate-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate phase context',
  description: 'Create context document with decisions and preferences',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'technical writer and documentation specialist',
      task: 'Generate comprehensive phase context document that will guide planning',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        requirements: args.requirements,
        decisionPoints: args.decisionPoints,
        preferences: args.preferences
      },
      instructions: [
        'Create structured context document ({phaseId}-CONTEXT.md)',
        'Include: phase overview, requirements summary, decision points, selected preferences',
        'Document rationale for each preference',
        'Provide implementation guidance based on preferences',
        'Include code examples or patterns where helpful',
        'Add constraints and guardrails from preferences',
        'List reference materials (docs, examples, libraries)',
        'Make it clear and actionable for the planning agent'
      ],
      outputFormat: 'JSON with contextMarkdown (string), guidelines (array), constraints (array), references (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['contextMarkdown', 'guidelines'],
      properties: {
        contextMarkdown: { type: 'string' },
        guidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              guideline: { type: 'string' }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'discussion', 'context']
}));
