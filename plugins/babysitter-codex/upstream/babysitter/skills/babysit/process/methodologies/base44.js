/**
 * @process methodologies/base44
 * @description Base44-Inspired Conversational Development - Use natural language prompts to build apps with AI agents
 * @inputs { appIdea: string, conversationalRounds: number, refinementStrategy: string }
 * @outputs { success: boolean, generatedApp: object, conversationHistory: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Base44-Inspired Conversational Development Process
 *
 * Methodology: Natural language prompt → AI generates app → User feedback → Refine → Deploy
 *
 * Inspired by Base44's "vibe coding" approach, this process implements:
 * 1. User describes app idea in natural language
 * 2. AI agent generates complete application (frontend + backend)
 * 3. User reviews and provides conversational feedback
 * 4. AI refines the application based on feedback
 * 5. Iterate through conversational rounds until satisfied
 * 6. Deploy the generated application
 *
 * Key characteristics:
 * - No code required from user
 * - Conversational, iterative refinement
 * - AI handles all technical implementation
 * - Rapid development (minutes instead of days/weeks)
 * - Full-stack generation (UI, database, API, auth, hosting)
 *
 * Reference: Base44 is an AI-powered no-code platform that turns ideas into apps
 * through natural language conversation.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.appIdea - Natural language description of app to build
 * @param {number} inputs.conversationalRounds - Maximum refinement rounds (default: 5)
 * @param {string} inputs.refinementStrategy - 'guided' or 'freeform' (default: 'guided')
 * @param {boolean} inputs.includeAuth - Include authentication (default: true)
 * @param {boolean} inputs.includeDatabase - Include database (default: true)
 * @param {boolean} inputs.includeAPI - Include API endpoints (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with generated application
 */
export async function process(inputs, ctx) {
  const {
    appIdea,
    conversationalRounds = 5,
    refinementStrategy = 'guided',
    includeAuth = true,
    includeDatabase = true,
    includeAPI = true
  } = inputs;

  const conversationHistory = [];
  let currentApp = null;
  let userSatisfied = false;

  // Round 0: Initial app generation from natural language prompt
  const initialGeneration = await ctx.task(agentGenerateAppFromPromptTask, {
    appIdea,
    round: 0,
    includeAuth,
    includeDatabase,
    includeAPI
  });

  currentApp = initialGeneration;
  conversationHistory.push({
    round: 0,
    type: 'generation',
    input: appIdea,
    output: initialGeneration,
    timestamp: ctx.now()
  });

  // Refinement rounds - conversational iteration
  let round = 1;
  while (!userSatisfied && round <= conversationalRounds) {
    // Present current app to user and get feedback
    const userFeedback = await ctx.task(agentGatherFeedbackTask, {
      appIdea,
      currentApp,
      round,
      refinementStrategy,
      conversationHistory
    });

    conversationHistory.push({
      round,
      type: 'feedback',
      feedback: userFeedback,
      timestamp: ctx.now()
    });

    // Check if user is satisfied
    if (userFeedback.satisfied) {
      userSatisfied = true;
      break;
    }

    // Refine app based on feedback
    const refinedApp = await ctx.task(agentRefineAppTask, {
      appIdea,
      currentApp,
      userFeedback,
      round,
      conversationHistory
    });

    currentApp = refinedApp;
    conversationHistory.push({
      round,
      type: 'refinement',
      changes: refinedApp.changes,
      output: refinedApp,
      timestamp: ctx.now()
    });

    // Optional: Breakpoint for human review
    if (inputs.reviewEachRound) {
      await ctx.breakpoint({
        question: `Round ${round} refinement complete. Review changes and continue?`,
        title: `Base44 Development - Round ${round}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/round-${round}-app.json`, format: 'json' },
            { path: `artifacts/round-${round}-preview.md`, format: 'markdown' }
          ]
        }
      });
    }

    round++;
  }

  // Generate deployment package
  const deployment = await ctx.task(agentGenerateDeploymentTask, {
    appIdea,
    finalApp: currentApp,
    conversationHistory
  });

  // Final validation
  const validation = await ctx.task(agentValidateAppTask, {
    appIdea,
    app: currentApp,
    deployment,
    conversationHistory
  });

  return {
    success: userSatisfied && validation.appComplete,
    appIdea,
    generatedApp: currentApp,
    deployment,
    conversationHistory,
    totalRounds: round - 1,
    validation,
    summary: {
      totalRounds: round - 1,
      userSatisfied,
      appComplete: validation.appComplete,
      components: {
        frontend: currentApp.frontend?.summary || 'Generated',
        backend: currentApp.backend?.summary || 'Generated',
        database: includeDatabase ? (currentApp.database?.summary || 'Generated') : 'Not included',
        auth: includeAuth ? (currentApp.auth?.summary || 'Generated') : 'Not included',
        api: includeAPI ? (currentApp.api?.summary || 'Generated') : 'Not included'
      },
      developmentTime: `${round} rounds of conversation`,
      traditionalEstimate: 'Days to weeks in traditional development'
    },
    metadata: {
      processId: 'methodologies/base44',
      inspiration: 'Base44 AI-powered no-code platform',
      timestamp: ctx.now()
    }
  };
}

/**
 * Generate app from natural language prompt
 */
export const agentGenerateAppFromPromptTask = defineTask('agent-generate-app-from-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate app from prompt',
  description: 'Create full-stack application from natural language description',

  agent: {
    name: 'app-generator',
    prompt: {
      role: 'AI app builder (Base44-style)',
      task: 'Generate a complete full-stack application from the user\'s natural language description',
      context: {
        appIdea: args.appIdea,
        round: args.round,
        includeAuth: args.includeAuth,
        includeDatabase: args.includeDatabase,
        includeAPI: args.includeAPI
      },
      instructions: [
        'Understand the user\'s app idea thoroughly',
        'Design and generate a complete frontend (UI/UX)',
        'Design and generate backend logic and API endpoints',
        args.includeDatabase ? 'Design and generate database schema' : 'Skip database',
        args.includeAuth ? 'Include authentication and authorization' : 'Skip auth',
        args.includeAPI ? 'Generate RESTful API endpoints' : 'Skip API',
        'Generate all necessary code and configuration',
        'Make the app functional and ready to run',
        'Keep it simple but complete',
        'Follow modern best practices',
        'Generate in a structured, organized manner'
      ],
      outputFormat: 'JSON with frontend, backend, database, auth, api, files generated'
    },
    outputSchema: {
      type: 'object',
      required: ['appName', 'frontend', 'backend', 'filesGenerated'],
      properties: {
        appName: { type: 'string' },
        description: { type: 'string' },
        frontend: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            pages: { type: 'array', items: { type: 'string' } },
            components: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        backend: {
          type: 'object',
          properties: {
            runtime: { type: 'string' },
            endpoints: { type: 'array', items: { type: 'string' } },
            businessLogic: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        database: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            schema: { type: 'object' },
            summary: { type: 'string' }
          }
        },
        auth: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        api: {
          type: 'object',
          properties: {
            endpoints: { type: 'array', items: { type: 'object' } },
            summary: { type: 'string' }
          }
        },
        filesGenerated: { type: 'array', items: { type: 'string' } },
        readyToDeploy: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'base44', 'generation', `round-${args.round}`]
}));

/**
 * Gather user feedback
 */
export const agentGatherFeedbackTask = defineTask('agent-gather-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gather feedback - Round ${args.round}`,
  description: 'Present app and gather conversational feedback',

  agent: {
    name: 'feedback-gatherer',
    prompt: {
      role: 'product manager and UX researcher',
      task: 'Present the current app state and gather user feedback',
      context: {
        appIdea: args.appIdea,
        currentApp: args.currentApp,
        round: args.round,
        refinementStrategy: args.refinementStrategy,
        conversationHistory: args.conversationHistory
      },
      instructions: [
        'Present the current app clearly',
        'Highlight what has been implemented',
        args.refinementStrategy === 'guided' ? 'Ask specific, guided questions about each component' : 'Allow freeform feedback',
        'Understand what the user likes and dislikes',
        'Identify specific changes or additions requested',
        'Determine if the user is satisfied or wants refinements',
        'Be conversational and natural',
        'Focus on user needs and preferences'
      ],
      outputFormat: 'JSON with feedback, requested changes, satisfied status'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfied', 'feedback'],
      properties: {
        satisfied: { type: 'boolean' },
        feedback: { type: 'string' },
        likes: { type: 'array', items: { type: 'string' } },
        dislikes: { type: 'array', items: { type: 'string' } },
        requestedChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              change: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        additionalFeatures: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'base44', 'feedback', `round-${args.round}`]
}));

/**
 * Refine app based on feedback
 */
export const agentRefineAppTask = defineTask('agent-refine-app', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine app - Round ${args.round}`,
  description: 'Apply changes based on user feedback',

  agent: {
    name: 'app-refiner',
    prompt: {
      role: 'AI app builder (Base44-style)',
      task: 'Refine the application based on user feedback',
      context: {
        appIdea: args.appIdea,
        currentApp: args.currentApp,
        userFeedback: args.userFeedback,
        round: args.round,
        conversationHistory: args.conversationHistory
      },
      instructions: [
        'Review user feedback carefully',
        'Understand what changes are requested',
        'Prioritize high-priority changes',
        'Modify the app to address feedback',
        'Add requested features',
        'Fix any issues mentioned',
        'Improve areas the user disliked',
        'Maintain what the user liked',
        'Keep the app functional throughout',
        'Generate/modify necessary code and files',
        'Document changes made'
      ],
      outputFormat: 'JSON with refined app, changes made, files modified'
    },
    outputSchema: {
      type: 'object',
      required: ['appName', 'frontend', 'backend', 'changes', 'filesModified'],
      properties: {
        appName: { type: 'string' },
        description: { type: 'string' },
        frontend: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            pages: { type: 'array', items: { type: 'string' } },
            components: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        backend: {
          type: 'object',
          properties: {
            runtime: { type: 'string' },
            endpoints: { type: 'array', items: { type: 'string' } },
            businessLogic: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        database: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            schema: { type: 'object' },
            summary: { type: 'string' }
          }
        },
        auth: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        api: {
          type: 'object',
          properties: {
            endpoints: { type: 'array', items: { type: 'object' } },
            summary: { type: 'string' }
          }
        },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              changeDescription: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        filesModified: { type: 'array', items: { type: 'string' } },
        filesAdded: { type: 'array', items: { type: 'string' } },
        readyToDeploy: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'base44', 'refinement', `round-${args.round}`]
}));

/**
 * Generate deployment package
 */
export const agentGenerateDeploymentTask = defineTask('agent-generate-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate deployment package',
  description: 'Prepare app for deployment',

  agent: {
    name: 'deployment-generator',
    prompt: {
      role: 'DevOps engineer',
      task: 'Generate deployment configuration and package',
      context: {
        appIdea: args.appIdea,
        finalApp: args.finalApp,
        conversationHistory: args.conversationHistory
      },
      instructions: [
        'Generate deployment configuration (Docker, serverless, etc.)',
        'Set up hosting configuration',
        'Configure environment variables',
        'Set up CI/CD if needed',
        'Generate deployment documentation',
        'Prepare production build',
        'Configure monitoring and logging',
        'Ensure security best practices'
      ],
      outputFormat: 'JSON with deployment config, hosting details, documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentType', 'configuration', 'readyToDeploy'],
      properties: {
        deploymentType: { type: 'string' },
        configuration: {
          type: 'object',
          properties: {
            hosting: { type: 'string' },
            environmentVariables: { type: 'object' },
            buildCommand: { type: 'string' },
            startCommand: { type: 'string' }
          }
        },
        deploymentFiles: { type: 'array', items: { type: 'string' } },
        documentation: { type: 'string' },
        deploymentUrl: { type: 'string' },
        readyToDeploy: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'base44', 'deployment']
}));

/**
 * Validate generated app
 */
export const agentValidateAppTask = defineTask('agent-validate-app', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate generated app',
  description: 'Validate app completeness and quality',

  agent: {
    name: 'app-validator',
    prompt: {
      role: 'QA engineer and product manager',
      task: 'Validate the generated application',
      context: {
        appIdea: args.appIdea,
        app: args.app,
        deployment: args.deployment,
        conversationHistory: args.conversationHistory
      },
      instructions: [
        'Verify app meets the original idea/requirements',
        'Check all components are implemented',
        'Verify frontend is functional and user-friendly',
        'Verify backend logic is correct',
        'Check database schema is appropriate',
        'Verify auth and security are properly implemented',
        'Check API endpoints are functional',
        'Verify deployment readiness',
        'Identify any gaps or issues'
      ],
      outputFormat: 'JSON with validation results, app completeness, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['appComplete', 'requirementsMet', 'deploymentReady'],
      properties: {
        appComplete: { type: 'boolean' },
        requirementsMet: { type: 'boolean' },
        deploymentReady: { type: 'boolean' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        overallAssessment: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'base44', 'validation']
}));
