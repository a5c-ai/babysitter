/**
 * @process specializations/ai-agents-conversational/conversational-persona-design
 * @description Conversational Persona Design - Process for designing and implementing consistent
 * conversational personas including personality traits, communication style, tone, and brand voice.
 * @inputs { personaName?: string, brandGuidelines?: object, targetAudience?: array, outputDir?: string }
 * @outputs { success: boolean, personaDefinition: object, communicationGuide: object, promptTemplates: array, testConversations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/conversational-persona-design', {
 *   personaName: 'Alex',
 *   brandGuidelines: { tone: 'friendly', values: ['helpful', 'professional'] },
 *   targetAudience: ['millennials', 'tech-savvy']
 * });
 *
 * @references
 * - OCEAN Personality Model: https://en.wikipedia.org/wiki/Big_Five_personality_traits
 * - Character.AI: https://character.ai/
 * - Brand Voice Guidelines: https://www.nngroup.com/articles/tone-voice-users/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    personaName = 'Assistant',
    brandGuidelines = {},
    targetAudience = ['general'],
    outputDir = 'persona-design-output',
    enableEmotionalRange = true,
    enableAdaptation = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Persona Design for ${personaName}`);

  // ============================================================================
  // PHASE 1: PERSONA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining persona characteristics');

  const personaDefinition = await ctx.task(personaDefinitionTask, {
    personaName,
    brandGuidelines,
    targetAudience,
    outputDir
  });

  artifacts.push(...personaDefinition.artifacts);

  // ============================================================================
  // PHASE 2: COMMUNICATION STYLE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing communication style');

  const communicationStyle = await ctx.task(communicationStyleTask, {
    personaName,
    personaTraits: personaDefinition.traits,
    targetAudience,
    outputDir
  });

  artifacts.push(...communicationStyle.artifacts);

  // ============================================================================
  // PHASE 3: EMOTIONAL RANGE
  // ============================================================================

  let emotionalRange = null;
  if (enableEmotionalRange) {
    ctx.log('info', 'Phase 3: Defining emotional range');

    emotionalRange = await ctx.task(emotionalRangeTask, {
      personaName,
      personaTraits: personaDefinition.traits,
      outputDir
    });

    artifacts.push(...emotionalRange.artifacts);
  }

  // ============================================================================
  // PHASE 4: PROMPT TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating prompt templates');

  const promptTemplates = await ctx.task(promptTemplatesTask, {
    personaName,
    personaDefinition: personaDefinition.persona,
    communicationStyle: communicationStyle.style,
    emotionalRange: emotionalRange ? emotionalRange.range : null,
    outputDir
  });

  artifacts.push(...promptTemplates.artifacts);

  // ============================================================================
  // PHASE 5: AUDIENCE ADAPTATION
  // ============================================================================

  let audienceAdaptation = null;
  if (enableAdaptation) {
    ctx.log('info', 'Phase 5: Implementing audience adaptation');

    audienceAdaptation = await ctx.task(audienceAdaptationTask, {
      personaName,
      targetAudience,
      baseStyle: communicationStyle.style,
      outputDir
    });

    artifacts.push(...audienceAdaptation.artifacts);
  }

  // ============================================================================
  // PHASE 6: PERSONA TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing persona consistency');

  const personaTesting = await ctx.task(personaTestingTask, {
    personaName,
    promptTemplates: promptTemplates.templates,
    personaDefinition: personaDefinition.persona,
    outputDir
  });

  artifacts.push(...personaTesting.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Persona ${personaName} designed. Consistency score: ${personaTesting.consistencyScore}. Review persona design?`,
    title: 'Persona Design Review',
    context: {
      runId: ctx.runId,
      summary: {
        personaName,
        targetAudience,
        traits: personaDefinition.traits,
        consistencyScore: personaTesting.consistencyScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    personaName,
    personaDefinition: personaDefinition.persona,
    communicationGuide: communicationStyle.style,
    promptTemplates: promptTemplates.templates,
    testConversations: personaTesting.conversations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/conversational-persona-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const personaDefinitionTask = defineTask('persona-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Persona - ${args.personaName}`,
  agent: {
    name: 'persona-designer',  // AG-CAI-005: Creates chatbot personas and brand voice guidelines
    prompt: {
      role: 'Persona Designer',
      task: 'Define conversational persona',
      context: args,
      instructions: [
        '1. Define personality traits (OCEAN)',
        '2. Create backstory elements',
        '3. Define values and beliefs',
        '4. Set knowledge boundaries',
        '5. Define quirks and characteristics',
        '6. Align with brand guidelines',
        '7. Create persona document',
        '8. Save persona definition'
      ],
      outputFormat: 'JSON with persona definition'
    },
    outputSchema: {
      type: 'object',
      required: ['persona', 'traits', 'artifacts'],
      properties: {
        persona: { type: 'object' },
        traits: { type: 'object' },
        backstory: { type: 'string' },
        personaDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'definition']
}));

export const communicationStyleTask = defineTask('communication-style', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Communication Style - ${args.personaName}`,
  agent: {
    name: 'style-designer',
    prompt: {
      role: 'Communication Style Designer',
      task: 'Design communication style',
      context: args,
      instructions: [
        '1. Define tone of voice',
        '2. Set formality level',
        '3. Create vocabulary guidelines',
        '4. Define sentence structure',
        '5. Set humor guidelines',
        '6. Create response patterns',
        '7. Define forbidden phrases',
        '8. Save communication guide'
      ],
      outputFormat: 'JSON with communication style'
    },
    outputSchema: {
      type: 'object',
      required: ['style', 'artifacts'],
      properties: {
        style: { type: 'object' },
        toneGuide: { type: 'object' },
        vocabularyGuide: { type: 'object' },
        styleGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'style']
}));

export const emotionalRangeTask = defineTask('emotional-range', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Emotional Range - ${args.personaName}`,
  agent: {
    name: 'emotion-designer',
    prompt: {
      role: 'Emotional Range Designer',
      task: 'Define emotional expression range',
      context: args,
      instructions: [
        '1. Define emotional spectrum',
        '2. Set expression intensity',
        '3. Create emotion triggers',
        '4. Define empathy patterns',
        '5. Set boundaries on emotions',
        '6. Create emotional transitions',
        '7. Define recovery patterns',
        '8. Save emotional range'
      ],
      outputFormat: 'JSON with emotional range'
    },
    outputSchema: {
      type: 'object',
      required: ['range', 'artifacts'],
      properties: {
        range: { type: 'object' },
        emotionPatterns: { type: 'array' },
        emotionGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'emotions']
}));

export const promptTemplatesTask = defineTask('prompt-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Prompt Templates - ${args.personaName}`,
  agent: {
    name: 'prompt-creator',
    prompt: {
      role: 'Prompt Template Creator',
      task: 'Create persona prompt templates',
      context: args,
      instructions: [
        '1. Create system prompt',
        '2. Add personality encoding',
        '3. Include style guidelines',
        '4. Add context handling',
        '5. Create scenario variations',
        '6. Add guardrails',
        '7. Test templates',
        '8. Save prompt templates'
      ],
      outputFormat: 'JSON with prompt templates'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array' },
        systemPrompt: { type: 'string' },
        templatesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'prompts']
}));

export const audienceAdaptationTask = defineTask('audience-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Audience Adaptation - ${args.personaName}`,
  agent: {
    name: 'adaptation-developer',
    prompt: {
      role: 'Audience Adaptation Developer',
      task: 'Implement audience-specific adaptations',
      context: args,
      instructions: [
        '1. Analyze target audiences',
        '2. Create audience profiles',
        '3. Define adaptation rules',
        '4. Implement style modifiers',
        '5. Add context detection',
        '6. Create audience prompts',
        '7. Test adaptations',
        '8. Save adaptation config'
      ],
      outputFormat: 'JSON with audience adaptations'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations', 'artifacts'],
      properties: {
        adaptations: { type: 'array' },
        audienceProfiles: { type: 'array' },
        adaptationConfigPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'adaptation']
}));

export const personaTestingTask = defineTask('persona-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Persona - ${args.personaName}`,
  agent: {
    name: 'persona-tester',
    prompt: {
      role: 'Persona Testing Specialist',
      task: 'Test persona consistency and quality',
      context: args,
      instructions: [
        '1. Generate test conversations',
        '2. Evaluate consistency',
        '3. Check brand alignment',
        '4. Test edge cases',
        '5. Evaluate naturalness',
        '6. Check emotional responses',
        '7. Calculate consistency score',
        '8. Save test results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'conversations', 'artifacts'],
      properties: {
        consistencyScore: { type: 'number' },
        conversations: { type: 'array' },
        testReportPath: { type: 'string' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona', 'testing']
}));
