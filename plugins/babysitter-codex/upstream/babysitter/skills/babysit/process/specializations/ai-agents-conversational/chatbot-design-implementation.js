/**
 * @process specializations/ai-agents-conversational/chatbot-design-implementation
 * @description Chatbot Design and Implementation - Comprehensive process for designing and implementing chatbots including
 * conversation flow design, intent/entity recognition, dialogue management, and multi-channel deployment.
 * @inputs { chatbotName?: string, purpose?: string, channels?: array, nluApproach?: string, framework?: string, outputDir?: string }
 * @outputs { success: boolean, conversationFlows: array, nluModels: object, dialoguePolicy: object, deployedBot: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/chatbot-design-implementation', {
 *   chatbotName: 'customer-support-bot',
 *   purpose: 'Handle customer inquiries and support tickets',
 *   channels: ['web', 'slack', 'whatsapp'],
 *   nluApproach: 'llm-based',
 *   framework: 'rasa'
 * });
 *
 * @references
 * - Rasa Documentation: https://rasa.com/docs/
 * - Botpress: https://botpress.com/docs
 * - Dialogflow: https://cloud.google.com/dialogflow/docs
 * - Conversation Design: https://designguidelines.withgoogle.com/conversation/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    chatbotName = 'chatbot',
    purpose = 'general assistance',
    channels = ['web'],
    nluApproach = 'llm-based',
    framework = 'custom',
    outputDir = 'chatbot-output',
    multiTurn = true,
    personaEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Chatbot Design and Implementation for ${chatbotName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND PERSONA
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining requirements and persona');

  const requirements = await ctx.task(chatbotRequirementsTask, {
    chatbotName,
    purpose,
    channels,
    personaEnabled,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: CONVERSATION FLOW DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing conversation flows');

  const conversationFlows = await ctx.task(conversationFlowDesignTask, {
    chatbotName,
    requirements: requirements.analysis,
    multiTurn,
    outputDir
  });

  artifacts.push(...conversationFlows.artifacts);

  // ============================================================================
  // PHASE 3: INTENT AND ENTITY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing intents and entities');

  const intentEntityDesign = await ctx.task(intentEntityDesignTask, {
    chatbotName,
    conversationFlows: conversationFlows.flows,
    nluApproach,
    outputDir
  });

  artifacts.push(...intentEntityDesign.artifacts);

  // ============================================================================
  // PHASE 4: NLU MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing NLU models');

  const nluDevelopment = await ctx.task(nluModelDevelopmentTask, {
    chatbotName,
    intents: intentEntityDesign.intents,
    entities: intentEntityDesign.entities,
    nluApproach,
    framework,
    outputDir
  });

  artifacts.push(...nluDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: DIALOGUE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing dialogue management');

  const dialogueManagement = await ctx.task(dialogueManagementTask, {
    chatbotName,
    conversationFlows: conversationFlows.flows,
    intents: intentEntityDesign.intents,
    framework,
    outputDir
  });

  artifacts.push(...dialogueManagement.artifacts);

  // ============================================================================
  // PHASE 6: RESPONSE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing response generation');

  const responseGeneration = await ctx.task(responseGenerationTask, {
    chatbotName,
    persona: requirements.persona,
    conversationFlows: conversationFlows.flows,
    nluApproach,
    outputDir
  });

  artifacts.push(...responseGeneration.artifacts);

  // ============================================================================
  // PHASE 7: MULTI-CHANNEL DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up multi-channel deployment');

  const deployment = await ctx.task(multiChannelDeploymentTask, {
    chatbotName,
    channels,
    dialoguePolicy: dialogueManagement.policy,
    responseGeneration: responseGeneration.generator,
    outputDir
  });

  artifacts.push(...deployment.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Chatbot ${chatbotName} implementation complete. ${conversationFlows.flows.length} flows, ${intentEntityDesign.intents.length} intents. Ready for testing?`,
    title: 'Chatbot Implementation Review',
    context: {
      runId: ctx.runId,
      summary: {
        chatbotName,
        purpose,
        channels,
        flowCount: conversationFlows.flows.length,
        intentCount: intentEntityDesign.intents.length,
        entityCount: intentEntityDesign.entities.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    chatbotName,
    conversationFlows: conversationFlows.flows,
    nluModels: nluDevelopment.models,
    dialoguePolicy: dialogueManagement.policy,
    deployedBot: deployment.deployment,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/chatbot-design-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const chatbotRequirementsTask = defineTask('chatbot-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Chatbot Requirements - ${args.chatbotName}`,
  agent: {
    name: 'chatbot-designer',  // AG-CI-001: Designs conversational flows with intent/entity modeling
    prompt: {
      role: 'Conversation Designer',
      task: 'Define chatbot requirements and persona',
      context: args,
      instructions: [
        '1. Analyze chatbot purpose and use cases',
        '2. Define target user personas',
        '3. Create chatbot persona (name, personality, tone)',
        '4. Define scope and capabilities',
        '5. Identify out-of-scope topics',
        '6. Define success metrics',
        '7. Document channel-specific requirements',
        '8. Save requirements document'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'persona', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        persona: { type: 'object' },
        useCases: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'requirements']
}));

export const conversationFlowDesignTask = defineTask('conversation-flow-design', (args, taskCtx) => ({
  kind: 'skill',
  title: `Design Conversation Flows - ${args.chatbotName}`,
  skill: {
    name: 'dialogue-flow-templates',  // SK-CI-001: Dialogue flow templates for common interaction patterns
    prompt: {
      role: 'Conversation Flow Designer',
      task: 'Design conversation flows and dialogue paths',
      context: args,
      instructions: [
        '1. Design happy path flows for each use case',
        '2. Create error handling flows',
        '3. Design clarification request flows',
        '4. Create context switching handlers',
        '5. Design conversation repair flows',
        '6. Create flow diagrams',
        '7. Define slot filling sequences',
        '8. Save conversation flows'
      ],
      outputFormat: 'JSON with conversation flows'
    },
    outputSchema: {
      type: 'object',
      required: ['flows', 'artifacts'],
      properties: {
        flows: { type: 'array' },
        flowDiagrams: { type: 'array' },
        errorHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'flows']
}));

export const intentEntityDesignTask = defineTask('intent-entity-design', (args, taskCtx) => ({
  kind: 'skill',
  title: `Design Intents and Entities - ${args.chatbotName}`,
  skill: {
    name: 'entity-extraction-templates',  // SK-CI-003: Entity extraction templates for common entity types
    prompt: {
      role: 'NLU Designer',
      task: 'Design intents and entities for the chatbot',
      context: args,
      instructions: [
        '1. Extract intents from conversation flows',
        '2. Create intent training examples (10-20 per intent)',
        '3. Define entity types (built-in and custom)',
        '4. Create entity examples and synonyms',
        '5. Define slot types for each entity',
        '6. Create intent/entity taxonomy',
        '7. Handle multi-intent utterances',
        '8. Save NLU design'
      ],
      outputFormat: 'JSON with intents and entities'
    },
    outputSchema: {
      type: 'object',
      required: ['intents', 'entities', 'artifacts'],
      properties: {
        intents: { type: 'array' },
        entities: { type: 'array' },
        trainingData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'nlu']
}));

export const nluModelDevelopmentTask = defineTask('nlu-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop NLU Models - ${args.chatbotName}`,
  agent: {
    name: 'nlu-developer',
    prompt: {
      role: 'NLU Developer',
      task: 'Develop NLU models for intent and entity recognition',
      context: args,
      instructions: [
        '1. Choose NLU approach (BERT, LLM-based, Rasa NLU)',
        '2. Prepare training data format',
        '3. Configure model architecture',
        '4. Train intent classifier',
        '5. Train entity extractor',
        '6. Evaluate model performance',
        '7. Tune confidence thresholds',
        '8. Save trained models'
      ],
      outputFormat: 'JSON with NLU models'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'artifacts'],
      properties: {
        models: { type: 'object' },
        intentAccuracy: { type: 'number' },
        entityF1: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'nlu', 'training']
}));

export const dialogueManagementTask = defineTask('dialogue-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Dialogue Management - ${args.chatbotName}`,
  agent: {
    name: 'dialogue-developer',
    prompt: {
      role: 'Dialogue Management Developer',
      task: 'Implement dialogue state tracking and policy',
      context: args,
      instructions: [
        '1. Implement dialogue state tracker',
        '2. Create dialogue policy (rule-based or ML)',
        '3. Implement context management',
        '4. Handle slot filling logic',
        '5. Implement conversation memory',
        '6. Create action selection logic',
        '7. Handle multi-turn conversations',
        '8. Save dialogue manager'
      ],
      outputFormat: 'JSON with dialogue policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'artifacts'],
      properties: {
        policy: { type: 'object' },
        stateTracker: { type: 'object' },
        policyCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'dialogue']
}));

export const responseGenerationTask = defineTask('response-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Response Generation - ${args.chatbotName}`,
  agent: {
    name: 'nlg-developer',
    prompt: {
      role: 'NLG Developer',
      task: 'Implement response generation system',
      context: args,
      instructions: [
        '1. Create response templates',
        '2. Implement template-based NLG',
        '3. Add LLM-based dynamic generation',
        '4. Apply persona to responses',
        '5. Handle variable substitution',
        '6. Add response variation',
        '7. Implement rich message formats',
        '8. Save response generator'
      ],
      outputFormat: 'JSON with response generator'
    },
    outputSchema: {
      type: 'object',
      required: ['generator', 'artifacts'],
      properties: {
        generator: { type: 'object' },
        templates: { type: 'array' },
        generatorCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'nlg']
}));

export const multiChannelDeploymentTask = defineTask('multi-channel-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy to Multiple Channels - ${args.chatbotName}`,
  agent: {
    name: 'deployment-specialist',
    prompt: {
      role: 'Chatbot Deployment Specialist',
      task: 'Deploy chatbot to multiple channels',
      context: args,
      instructions: [
        '1. Configure web chat widget',
        '2. Set up Slack integration',
        '3. Configure WhatsApp Business API',
        '4. Implement channel adapters',
        '5. Handle channel-specific message formats',
        '6. Set up webhooks',
        '7. Test each channel',
        '8. Save deployment configuration'
      ],
      outputFormat: 'JSON with deployment details'
    },
    outputSchema: {
      type: 'object',
      required: ['deployment', 'artifacts'],
      properties: {
        deployment: { type: 'object' },
        channelConfigs: { type: 'object' },
        webhookUrls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chatbot', 'deployment']
}));
