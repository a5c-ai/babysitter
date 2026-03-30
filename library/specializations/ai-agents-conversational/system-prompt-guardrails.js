/**
 * @process specializations/ai-agents-conversational/system-prompt-guardrails
 * @description System Prompt Design and Guardrails - Process for crafting effective system prompts with role definition,
 * task boundaries, safety guidelines, and guardrails to prevent prompt injection and ensure aligned behavior.
 * @inputs { agentName?: string, role?: string, boundaries?: array, safetyLevel?: string, outputDir?: string }
 * @outputs { success: boolean, systemPrompts: object, safetyGuidelines: object, injectionDetection: object, validationRules: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/system-prompt-guardrails', {
 *   agentName: 'customer-service-agent',
 *   role: 'helpful customer service representative',
 *   boundaries: ['no-financial-advice', 'no-medical-advice', 'no-personal-opinions'],
 *   safetyLevel: 'high'
 * });
 *
 * @references
 * - Guardrails AI: https://docs.guardrailsai.com/
 * - NeMo Guardrails: https://docs.nvidia.com/nemo/guardrails/
 * - Constitutional AI: https://arxiv.org/abs/2212.08073
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'safe-agent',
    role = 'helpful assistant',
    boundaries = [],
    safetyLevel = 'medium',
    outputDir = 'system-prompt-output',
    enableInjectionDefense = true,
    enableOutputValidation = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Prompt and Guardrails Design for ${agentName}`);

  // ============================================================================
  // PHASE 1: ROLE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining agent role');

  const roleDefinition = await ctx.task(roleDefinitionTask, {
    agentName,
    role,
    boundaries,
    outputDir
  });

  artifacts.push(...roleDefinition.artifacts);

  // ============================================================================
  // PHASE 2: TASK BOUNDARIES
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining task boundaries');

  const taskBoundaries = await ctx.task(taskBoundariesTask, {
    agentName,
    boundaries,
    roleDefinition: roleDefinition.definition,
    outputDir
  });

  artifacts.push(...taskBoundaries.artifacts);

  // ============================================================================
  // PHASE 3: SAFETY GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating safety guidelines');

  const safetyGuidelines = await ctx.task(safetyGuidelinesTask, {
    agentName,
    safetyLevel,
    boundaries,
    outputDir
  });

  artifacts.push(...safetyGuidelines.artifacts);

  // ============================================================================
  // PHASE 4: INJECTION DEFENSE
  // ============================================================================

  let injectionDefense = null;
  if (enableInjectionDefense) {
    ctx.log('info', 'Phase 4: Implementing injection defense');

    injectionDefense = await ctx.task(injectionDefenseTask, {
      agentName,
      safetyLevel,
      outputDir
    });

    artifacts.push(...injectionDefense.artifacts);
  }

  // ============================================================================
  // PHASE 5: OUTPUT VALIDATION
  // ============================================================================

  let outputValidation = null;
  if (enableOutputValidation) {
    ctx.log('info', 'Phase 5: Implementing output validation');

    outputValidation = await ctx.task(outputValidationTask, {
      agentName,
      safetyGuidelines: safetyGuidelines.guidelines,
      boundaries,
      outputDir
    });

    artifacts.push(...outputValidation.artifacts);
  }

  // ============================================================================
  // PHASE 6: SYSTEM PROMPT ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 6: Assembling system prompt');

  const systemPrompt = await ctx.task(systemPromptAssemblyTask, {
    agentName,
    roleDefinition: roleDefinition.definition,
    taskBoundaries: taskBoundaries.boundaries,
    safetyGuidelines: safetyGuidelines.guidelines,
    injectionDefense: injectionDefense ? injectionDefense.defense : null,
    outputDir
  });

  artifacts.push(...systemPrompt.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `System prompt for ${agentName} complete. Safety level: ${safetyLevel}. Review prompt and guardrails?`,
    title: 'System Prompt Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        role,
        safetyLevel,
        boundaryCount: boundaries.length,
        enableInjectionDefense,
        enableOutputValidation
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    systemPrompts: systemPrompt.prompts,
    safetyGuidelines: safetyGuidelines.guidelines,
    injectionDetection: injectionDefense ? injectionDefense.defense : null,
    validationRules: outputValidation ? outputValidation.rules : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/system-prompt-guardrails',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Role - ${args.agentName}`,
  agent: {
    name: 'system-prompt-engineer',  // AG-PE-001: Crafts system prompts with guardrails and safety constraints
    prompt: {
      role: 'Role Designer',
      task: 'Define agent role and personality',
      context: args,
      instructions: [
        '1. Define agent identity',
        '2. Specify expertise areas',
        '3. Define communication style',
        '4. Set personality traits',
        '5. Define knowledge boundaries',
        '6. Specify authority level',
        '7. Create role description',
        '8. Save role definition'
      ],
      outputFormat: 'JSON with role definition'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'artifacts'],
      properties: {
        definition: { type: 'object' },
        rolePrompt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'role']
}));

export const taskBoundariesTask = defineTask('task-boundaries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Task Boundaries - ${args.agentName}`,
  agent: {
    name: 'boundary-designer',
    prompt: {
      role: 'Boundary Designer',
      task: 'Define task scope and limitations',
      context: args,
      instructions: [
        '1. Define allowed tasks',
        '2. Define prohibited tasks',
        '3. Create boundary rules',
        '4. Handle edge cases',
        '5. Define escalation triggers',
        '6. Create boundary prompts',
        '7. Test boundary enforcement',
        '8. Save task boundaries'
      ],
      outputFormat: 'JSON with task boundaries'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaries', 'artifacts'],
      properties: {
        boundaries: { type: 'object' },
        allowedTasks: { type: 'array' },
        prohibitedTasks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'boundaries']
}));

export const safetyGuidelinesTask = defineTask('safety-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Safety Guidelines - ${args.agentName}`,
  agent: {
    name: 'safety-designer',
    prompt: {
      role: 'Safety Guidelines Designer',
      task: 'Create comprehensive safety guidelines',
      context: args,
      instructions: [
        '1. Define content restrictions',
        '2. Create harm prevention rules',
        '3. Add privacy protections',
        '4. Define ethical guidelines',
        '5. Handle sensitive topics',
        '6. Create refusal templates',
        '7. Add transparency requirements',
        '8. Save safety guidelines'
      ],
      outputFormat: 'JSON with safety guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        contentRestrictions: { type: 'array' },
        refusalTemplates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'safety']
}));

export const injectionDefenseTask = defineTask('injection-defense', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Injection Defense - ${args.agentName}`,
  agent: {
    name: 'security-developer',
    prompt: {
      role: 'Security Developer',
      task: 'Implement prompt injection defenses',
      context: args,
      instructions: [
        '1. Implement input sanitization',
        '2. Add instruction hierarchy',
        '3. Use XML/JSON delimiters',
        '4. Implement canary tokens',
        '5. Add LLM-based detection',
        '6. Create injection patterns list',
        '7. Test defense effectiveness',
        '8. Save injection defense'
      ],
      outputFormat: 'JSON with injection defense'
    },
    outputSchema: {
      type: 'object',
      required: ['defense', 'artifacts'],
      properties: {
        defense: { type: 'object' },
        patterns: { type: 'array' },
        defenseCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'injection']
}));

export const outputValidationTask = defineTask('output-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Output Validation - ${args.agentName}`,
  agent: {
    name: 'validation-developer',
    prompt: {
      role: 'Output Validation Developer',
      task: 'Implement output validation and filtering',
      context: args,
      instructions: [
        '1. Create output validators',
        '2. Implement content filtering',
        '3. Add PII detection',
        '4. Check against safety rules',
        '5. Validate format compliance',
        '6. Implement retry logic',
        '7. Add logging for violations',
        '8. Save validation rules'
      ],
      outputFormat: 'JSON with validation rules'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: { type: 'object' },
        validators: { type: 'array' },
        validationCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'validation']
}));

export const systemPromptAssemblyTask = defineTask('system-prompt-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble System Prompt - ${args.agentName}`,
  agent: {
    name: 'prompt-assembler',
    prompt: {
      role: 'System Prompt Assembler',
      task: 'Assemble complete system prompt',
      context: args,
      instructions: [
        '1. Combine role definition',
        '2. Add task boundaries',
        '3. Include safety guidelines',
        '4. Add injection defenses',
        '5. Structure prompt sections',
        '6. Add examples if needed',
        '7. Validate completeness',
        '8. Save assembled prompt'
      ],
      outputFormat: 'JSON with system prompt'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: { type: 'object' },
        fullSystemPrompt: { type: 'string' },
        promptPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'guardrails', 'assembly']
}));
