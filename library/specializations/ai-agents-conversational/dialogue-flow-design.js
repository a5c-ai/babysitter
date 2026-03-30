/**
 * @process specializations/ai-agents-conversational/dialogue-flow-design
 * @description Dialogue Flow and Conversation Design - Process for designing natural conversation flows including
 * happy paths, error handling, clarification strategies, context switching, and conversation repair mechanisms.
 * @inputs { projectName?: string, useCases?: array, userPersonas?: array, outputDir?: string }
 * @outputs { success: boolean, dialogueFlows: array, errorHandling: object, clarificationStrategies: array, uxGuidelines: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/dialogue-flow-design', {
 *   projectName: 'banking-assistant',
 *   useCases: ['check-balance', 'transfer-money', 'pay-bills'],
 *   userPersonas: ['tech-savvy', 'elderly', 'business-user']
 * });
 *
 * @references
 * - Google Conversation Design: https://designguidelines.withgoogle.com/conversation/
 * - Voiceflow: https://www.voiceflow.com/
 * - Conversation Design Institute: https://www.conversationdesigninstitute.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'conversation-project',
    useCases = [],
    userPersonas = [],
    outputDir = 'dialogue-flow-output',
    includeVoice = false,
    multiLanguage = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dialogue Flow Design for ${projectName}`);

  // ============================================================================
  // PHASE 1: USER RESEARCH AND PERSONAS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing user personas');

  const personaAnalysis = await ctx.task(personaAnalysisTask, {
    projectName,
    userPersonas,
    useCases,
    outputDir
  });

  artifacts.push(...personaAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: HAPPY PATH DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing happy path flows');

  const happyPaths = await ctx.task(happyPathDesignTask, {
    projectName,
    useCases,
    personas: personaAnalysis.personas,
    outputDir
  });

  artifacts.push(...happyPaths.artifacts);

  // ============================================================================
  // PHASE 3: ERROR HANDLING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing error handling');

  const errorHandling = await ctx.task(errorHandlingDesignTask, {
    projectName,
    happyPaths: happyPaths.flows,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 4: CLARIFICATION STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing clarification strategies');

  const clarificationStrategies = await ctx.task(clarificationStrategiesTask, {
    projectName,
    useCases,
    errorHandling: errorHandling.strategies,
    outputDir
  });

  artifacts.push(...clarificationStrategies.artifacts);

  // ============================================================================
  // PHASE 5: CONTEXT SWITCHING
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing context switching');

  const contextSwitching = await ctx.task(contextSwitchingTask, {
    projectName,
    happyPaths: happyPaths.flows,
    outputDir
  });

  artifacts.push(...contextSwitching.artifacts);

  // ============================================================================
  // PHASE 6: CONVERSATION REPAIR
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing conversation repair');

  const conversationRepair = await ctx.task(conversationRepairTask, {
    projectName,
    errorHandling: errorHandling.strategies,
    clarificationStrategies: clarificationStrategies.strategies,
    outputDir
  });

  artifacts.push(...conversationRepair.artifacts);

  // ============================================================================
  // PHASE 7: UX GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating UX guidelines');

  const uxGuidelines = await ctx.task(uxGuidelinesTask, {
    projectName,
    happyPaths: happyPaths.flows,
    errorHandling: errorHandling.strategies,
    personas: personaAnalysis.personas,
    includeVoice,
    outputDir
  });

  artifacts.push(...uxGuidelines.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Dialogue flow design for ${projectName} complete. ${happyPaths.flows.length} flows, ${errorHandling.strategies.length} error handlers. Review design?`,
    title: 'Dialogue Flow Design Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        flowCount: happyPaths.flows.length,
        errorHandlerCount: errorHandling.strategies.length,
        clarificationCount: clarificationStrategies.strategies.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    dialogueFlows: happyPaths.flows,
    errorHandling: errorHandling.strategies,
    clarificationStrategies: clarificationStrategies.strategies,
    contextSwitching: contextSwitching.handlers,
    conversationRepair: conversationRepair.mechanisms,
    uxGuidelines: uxGuidelines.guidelines,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/dialogue-flow-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const personaAnalysisTask = defineTask('persona-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze User Personas - ${args.projectName}`,
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'UX Researcher',
      task: 'Analyze user personas for conversation design',
      context: args,
      instructions: [
        '1. Define user personas with demographics',
        '2. Identify communication preferences',
        '3. Assess technical proficiency levels',
        '4. Document typical user journeys',
        '5. Identify pain points and frustrations',
        '6. Define persona-specific tone requirements',
        '7. Create persona cards',
        '8. Save persona analysis'
      ],
      outputFormat: 'JSON with persona analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'artifacts'],
      properties: {
        personas: { type: 'array' },
        communicationPreferences: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'personas']
}));

export const happyPathDesignTask = defineTask('happy-path-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Happy Paths - ${args.projectName}`,
  agent: {
    name: 'dialogue-architect',  // AG-CI-002: Creates multi-turn dialogue systems with context handling
    prompt: {
      role: 'Conversation Designer',
      task: 'Design happy path conversation flows',
      context: args,
      instructions: [
        '1. Create flow for each use case',
        '2. Design natural opening prompts',
        '3. Define turn-by-turn dialogue',
        '4. Include slot-filling sequences',
        '5. Design confirmation steps',
        '6. Create successful completion messages',
        '7. Add persona-appropriate variations',
        '8. Save flow diagrams'
      ],
      outputFormat: 'JSON with happy path flows'
    },
    outputSchema: {
      type: 'object',
      required: ['flows', 'artifacts'],
      properties: {
        flows: { type: 'array' },
        flowDiagrams: { type: 'array' },
        sampleDialogues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'happy-paths']
}));

export const errorHandlingDesignTask = defineTask('error-handling-design', (args, taskCtx) => ({
  kind: 'skill',
  title: `Design Error Handling - ${args.projectName}`,
  skill: {
    name: 'dialogue-flow-templates',  // SK-CI-001: Dialogue flow templates for common interaction patterns
    prompt: {
      role: 'Error Handling Designer',
      task: 'Design error handling strategies',
      context: args,
      instructions: [
        '1. Identify potential error points in each flow',
        '2. Design no-match handlers',
        '3. Design no-input handlers',
        '4. Create timeout handling',
        '5. Design system error messages',
        '6. Create fallback responses',
        '7. Design graceful degradation',
        '8. Save error handling strategies'
      ],
      outputFormat: 'JSON with error handling strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        errorMessages: { type: 'array' },
        fallbackFlows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'error-handling']
}));

export const clarificationStrategiesTask = defineTask('clarification-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Clarification Strategies - ${args.projectName}`,
  agent: {
    name: 'clarification-designer',
    prompt: {
      role: 'Clarification Strategy Designer',
      task: 'Design clarification and disambiguation strategies',
      context: args,
      instructions: [
        '1. Identify ambiguous user inputs',
        '2. Design clarification questions',
        '3. Create disambiguation options',
        '4. Design confirmation requests',
        '5. Handle multiple interpretations',
        '6. Create progressive clarification',
        '7. Set clarification limits',
        '8. Save clarification strategies'
      ],
      outputFormat: 'JSON with clarification strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        clarificationPrompts: { type: 'array' },
        disambiguationPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'clarification']
}));

export const contextSwitchingTask = defineTask('context-switching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Context Switching - ${args.projectName}`,
  agent: {
    name: 'context-designer',
    prompt: {
      role: 'Context Management Designer',
      task: 'Design context switching and digression handling',
      context: args,
      instructions: [
        '1. Identify digression scenarios',
        '2. Design context save/restore',
        '3. Handle topic changes gracefully',
        '4. Create return-to-flow prompts',
        '5. Manage nested contexts',
        '6. Design context expiration',
        '7. Handle interruptions',
        '8. Save context switching handlers'
      ],
      outputFormat: 'JSON with context switching handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: { type: 'array' },
        digressionPatterns: { type: 'array' },
        returnPrompts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'context']
}));

export const conversationRepairTask = defineTask('conversation-repair', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Conversation Repair - ${args.projectName}`,
  agent: {
    name: 'repair-designer',
    prompt: {
      role: 'Conversation Repair Designer',
      task: 'Design conversation repair mechanisms',
      context: args,
      instructions: [
        '1. Identify conversation breakdowns',
        '2. Design repair initiation triggers',
        '3. Create self-repair strategies',
        '4. Design user-initiated repair',
        '5. Implement undo/correction',
        '6. Create recovery flows',
        '7. Design escalation paths',
        '8. Save repair mechanisms'
      ],
      outputFormat: 'JSON with repair mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'artifacts'],
      properties: {
        mechanisms: { type: 'array' },
        repairTriggers: { type: 'array' },
        recoveryFlows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'repair']
}));

export const uxGuidelinesTask = defineTask('ux-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create UX Guidelines - ${args.projectName}`,
  agent: {
    name: 'ux-writer',
    prompt: {
      role: 'UX Writer',
      task: 'Create conversation UX guidelines',
      context: args,
      instructions: [
        '1. Define writing style guide',
        '2. Create tone and voice guidelines',
        '3. Document message length limits',
        '4. Create prompt templates',
        '5. Define button/quick reply usage',
        '6. Document accessibility requirements',
        '7. Create localization guidelines',
        '8. Save UX guidelines document'
      ],
      outputFormat: 'JSON with UX guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        styleGuide: { type: 'object' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'ux']
}));
