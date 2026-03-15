/**
 * @process specializations/ai-agents-conversational/prompt-injection-defense
 * @description Prompt Injection Detection and Defense - Process for implementing defenses against prompt injection attacks
 * including input sanitization, instruction hierarchy, output validation, and LLM-based detection.
 * @inputs { systemName?: string, defenseLevel?: string, attackTypes?: array, outputDir?: string }
 * @outputs { success: boolean, detectionSystem: object, sanitizationLogic: object, validationRules: object, securityDocumentation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/prompt-injection-defense', {
 *   systemName: 'injection-defense',
 *   defenseLevel: 'high',
 *   attackTypes: ['direct', 'indirect', 'jailbreak']
 * });
 *
 * @references
 * - Rebuff: https://github.com/protectai/rebuff
 * - OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
 * - Prompt Injection Attacks: https://simonwillison.net/2022/Sep/12/prompt-injection/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'injection-defense',
    defenseLevel = 'medium',
    attackTypes = ['direct', 'indirect'],
    outputDir = 'injection-defense-output',
    enableLLMDetection = true,
    enableCanaryTokens = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Prompt Injection Defense for ${systemName}`);

  // ============================================================================
  // PHASE 1: THREAT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing injection threats');

  const threatAnalysis = await ctx.task(threatAnalysisTask, {
    systemName,
    attackTypes,
    defenseLevel,
    outputDir
  });

  artifacts.push(...threatAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INPUT SANITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing input sanitization');

  const inputSanitization = await ctx.task(inputSanitizationTask, {
    systemName,
    threatAnalysis: threatAnalysis.analysis,
    outputDir
  });

  artifacts.push(...inputSanitization.artifacts);

  // ============================================================================
  // PHASE 3: INSTRUCTION HIERARCHY
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing instruction hierarchy');

  const instructionHierarchy = await ctx.task(instructionHierarchyTask, {
    systemName,
    defenseLevel,
    outputDir
  });

  artifacts.push(...instructionHierarchy.artifacts);

  // ============================================================================
  // PHASE 4: LLM-BASED DETECTION
  // ============================================================================

  let llmDetection = null;
  if (enableLLMDetection) {
    ctx.log('info', 'Phase 4: Implementing LLM-based detection');

    llmDetection = await ctx.task(llmDetectionTask, {
      systemName,
      attackTypes,
      outputDir
    });

    artifacts.push(...llmDetection.artifacts);
  }

  // ============================================================================
  // PHASE 5: CANARY TOKENS
  // ============================================================================

  let canaryTokens = null;
  if (enableCanaryTokens) {
    ctx.log('info', 'Phase 5: Implementing canary tokens');

    canaryTokens = await ctx.task(canaryTokensTask, {
      systemName,
      outputDir
    });

    artifacts.push(...canaryTokens.artifacts);
  }

  // ============================================================================
  // PHASE 6: OUTPUT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing output validation');

  const outputValidation = await ctx.task(outputValidationInjectionTask, {
    systemName,
    instructionHierarchy: instructionHierarchy.hierarchy,
    canaryTokens: canaryTokens ? canaryTokens.tokens : null,
    outputDir
  });

  artifacts.push(...outputValidation.artifacts);

  // ============================================================================
  // PHASE 7: SECURITY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating security documentation');

  const securityDocs = await ctx.task(securityDocumentationTask, {
    systemName,
    threatAnalysis: threatAnalysis.analysis,
    defenses: {
      sanitization: inputSanitization.sanitization,
      hierarchy: instructionHierarchy.hierarchy,
      llmDetection: llmDetection ? llmDetection.detection : null,
      canaryTokens: canaryTokens ? canaryTokens.tokens : null,
      outputValidation: outputValidation.validation
    },
    outputDir
  });

  artifacts.push(...securityDocs.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Injection defense ${systemName} complete. Defense level: ${defenseLevel}. Review implementation?`,
    title: 'Injection Defense Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        defenseLevel,
        attackTypes,
        enableLLMDetection,
        enableCanaryTokens
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    detectionSystem: {
      llmDetection: llmDetection ? llmDetection.detection : null,
      canaryTokens: canaryTokens ? canaryTokens.tokens : null
    },
    sanitizationLogic: inputSanitization.sanitization,
    validationRules: outputValidation.validation,
    securityDocumentation: securityDocs.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/prompt-injection-defense',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const threatAnalysisTask = defineTask('threat-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Injection Threats - ${args.systemName}`,
  agent: {
    name: 'prompt-injection-defender',  // AG-SAF-002: Implements prompt injection defenses
    prompt: {
      role: 'Security Analyst',
      task: 'Analyze prompt injection threats',
      context: args,
      instructions: [
        '1. Catalog injection attack types',
        '2. Analyze direct injection patterns',
        '3. Analyze indirect injection vectors',
        '4. Identify jailbreak techniques',
        '5. Assess system vulnerabilities',
        '6. Prioritize threats by risk',
        '7. Create threat model',
        '8. Save threat analysis'
      ],
      outputFormat: 'JSON with threat analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        threatModel: { type: 'object' },
        attackPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'threat-analysis']
}));

export const inputSanitizationTask = defineTask('input-sanitization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Input Sanitization - ${args.systemName}`,
  agent: {
    name: 'sanitization-developer',
    prompt: {
      role: 'Input Sanitization Developer',
      task: 'Implement input sanitization for injection prevention',
      context: args,
      instructions: [
        '1. Implement character filtering',
        '2. Detect injection patterns',
        '3. Normalize input format',
        '4. Remove control characters',
        '5. Handle encoding attacks',
        '6. Add length limits',
        '7. Create sanitization pipeline',
        '8. Save sanitization logic'
      ],
      outputFormat: 'JSON with sanitization logic'
    },
    outputSchema: {
      type: 'object',
      required: ['sanitization', 'artifacts'],
      properties: {
        sanitization: { type: 'object' },
        sanitizationCodePath: { type: 'string' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'sanitization']
}));

export const instructionHierarchyTask = defineTask('instruction-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Instruction Hierarchy - ${args.systemName}`,
  agent: {
    name: 'hierarchy-developer',
    prompt: {
      role: 'Instruction Hierarchy Developer',
      task: 'Implement instruction hierarchy defense',
      context: args,
      instructions: [
        '1. Design instruction levels',
        '2. Implement system > user priority',
        '3. Use clear delimiters',
        '4. Add context boundaries',
        '5. Implement role enforcement',
        '6. Handle override attempts',
        '7. Test hierarchy enforcement',
        '8. Save hierarchy implementation'
      ],
      outputFormat: 'JSON with instruction hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'artifacts'],
      properties: {
        hierarchy: { type: 'object' },
        hierarchyCodePath: { type: 'string' },
        delimiters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'hierarchy']
}));

export const llmDetectionTask = defineTask('llm-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement LLM Detection - ${args.systemName}`,
  agent: {
    name: 'llm-detection-developer',
    prompt: {
      role: 'LLM Detection Developer',
      task: 'Implement LLM-based injection detection',
      context: args,
      instructions: [
        '1. Create detection prompt',
        '2. Classify injection attempts',
        '3. Set confidence thresholds',
        '4. Handle edge cases',
        '5. Optimize detection latency',
        '6. Add detection logging',
        '7. Test detection accuracy',
        '8. Save LLM detection'
      ],
      outputFormat: 'JSON with LLM detection'
    },
    outputSchema: {
      type: 'object',
      required: ['detection', 'artifacts'],
      properties: {
        detection: { type: 'object' },
        detectionCodePath: { type: 'string' },
        detectionPrompt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'llm-detection']
}));

export const canaryTokensTask = defineTask('canary-tokens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Canary Tokens - ${args.systemName}`,
  agent: {
    name: 'canary-developer',
    prompt: {
      role: 'Canary Token Developer',
      task: 'Implement canary token detection',
      context: args,
      instructions: [
        '1. Generate unique canary tokens',
        '2. Embed in system prompts',
        '3. Detect token leakage',
        '4. Alert on detection',
        '5. Rotate tokens periodically',
        '6. Handle false positives',
        '7. Log canary events',
        '8. Save canary system'
      ],
      outputFormat: 'JSON with canary tokens'
    },
    outputSchema: {
      type: 'object',
      required: ['tokens', 'artifacts'],
      properties: {
        tokens: { type: 'object' },
        canaryCodePath: { type: 'string' },
        rotationConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'canary']
}));

export const outputValidationInjectionTask = defineTask('output-validation-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Output Validation - ${args.systemName}`,
  agent: {
    name: 'output-validator-developer',
    prompt: {
      role: 'Output Validation Developer',
      task: 'Implement output validation for injection defense',
      context: args,
      instructions: [
        '1. Check for canary leakage',
        '2. Validate output format',
        '3. Detect instruction echoing',
        '4. Check for system prompt leak',
        '5. Validate role consistency',
        '6. Implement output filtering',
        '7. Add validation logging',
        '8. Save output validation'
      ],
      outputFormat: 'JSON with output validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validation', 'artifacts'],
      properties: {
        validation: { type: 'object' },
        validationCodePath: { type: 'string' },
        validators: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'output-validation']
}));

export const securityDocumentationTask = defineTask('security-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Security Documentation - ${args.systemName}`,
  agent: {
    name: 'security-writer',
    prompt: {
      role: 'Security Documentation Writer',
      task: 'Create comprehensive security documentation',
      context: args,
      instructions: [
        '1. Document threat model',
        '2. Describe defense layers',
        '3. Create incident response plan',
        '4. Document detection procedures',
        '5. Add remediation steps',
        '6. Create security checklist',
        '7. Add testing guidelines',
        '8. Save security documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docs', 'artifacts'],
      properties: {
        docs: { type: 'string' },
        docsPath: { type: 'string' },
        incidentPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'injection', 'documentation']
}));
