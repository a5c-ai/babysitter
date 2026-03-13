/**
 * @process specializations/ai-agents-conversational/content-moderation-safety
 * @description Content Moderation and Safety Filters - Process for implementing content filtering for both inputs and outputs
 * including toxicity detection, PII redaction, hallucination detection, and abuse prevention.
 * @inputs { systemName?: string, contentTypes?: array, moderationLevel?: string, outputDir?: string }
 * @outputs { success: boolean, contentFilters: object, moderationPipeline: object, alertSystem: object, auditLogs: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/content-moderation-safety', {
 *   systemName: 'chat-moderation',
 *   contentTypes: ['text', 'images'],
 *   moderationLevel: 'strict'
 * });
 *
 * @references
 * - OpenAI Moderation: https://platform.openai.com/docs/guides/moderation
 * - Perspective API: https://developers.perspectiveapi.com/
 * - Azure Content Safety: https://azure.microsoft.com/en-us/products/ai-services/ai-content-safety
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'content-moderation',
    contentTypes = ['text'],
    moderationLevel = 'standard',
    outputDir = 'moderation-output',
    enableToxicityDetection = true,
    enablePIIRedaction = true,
    enableHallucinationDetection = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Content Moderation System for ${systemName}`);

  // ============================================================================
  // PHASE 1: MODERATION POLICY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining moderation policy');

  const moderationPolicy = await ctx.task(moderationPolicyTask, {
    systemName,
    contentTypes,
    moderationLevel,
    outputDir
  });

  artifacts.push(...moderationPolicy.artifacts);

  // ============================================================================
  // PHASE 2: TOXICITY DETECTION
  // ============================================================================

  let toxicityDetection = null;
  if (enableToxicityDetection) {
    ctx.log('info', 'Phase 2: Implementing toxicity detection');

    toxicityDetection = await ctx.task(toxicityDetectionTask, {
      systemName,
      moderationLevel,
      outputDir
    });

    artifacts.push(...toxicityDetection.artifacts);
  }

  // ============================================================================
  // PHASE 3: PII REDACTION
  // ============================================================================

  let piiRedaction = null;
  if (enablePIIRedaction) {
    ctx.log('info', 'Phase 3: Implementing PII redaction');

    piiRedaction = await ctx.task(piiRedactionTask, {
      systemName,
      outputDir
    });

    artifacts.push(...piiRedaction.artifacts);
  }

  // ============================================================================
  // PHASE 4: HALLUCINATION DETECTION
  // ============================================================================

  let hallucinationDetection = null;
  if (enableHallucinationDetection) {
    ctx.log('info', 'Phase 4: Implementing hallucination detection');

    hallucinationDetection = await ctx.task(hallucinationDetectionTask, {
      systemName,
      outputDir
    });

    artifacts.push(...hallucinationDetection.artifacts);
  }

  // ============================================================================
  // PHASE 5: ABUSE PREVENTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing abuse prevention');

  const abusePrevention = await ctx.task(abusePreventionTask, {
    systemName,
    moderationLevel,
    outputDir
  });

  artifacts.push(...abusePrevention.artifacts);

  // ============================================================================
  // PHASE 6: ALERT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up alert system');

  const alertSystem = await ctx.task(alertSystemTask, {
    systemName,
    moderationLevel,
    outputDir
  });

  artifacts.push(...alertSystem.artifacts);

  // ============================================================================
  // PHASE 7: MODERATION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 7: Building moderation pipeline');

  const moderationPipeline = await ctx.task(moderationPipelineTask, {
    systemName,
    toxicityDetection: toxicityDetection ? toxicityDetection.detector : null,
    piiRedaction: piiRedaction ? piiRedaction.redactor : null,
    hallucinationDetection: hallucinationDetection ? hallucinationDetection.detector : null,
    abusePrevention: abusePrevention.prevention,
    alertSystem: alertSystem.system,
    outputDir
  });

  artifacts.push(...moderationPipeline.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Content moderation system ${systemName} complete. Moderation level: ${moderationLevel}. Review implementation?`,
    title: 'Content Moderation Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        contentTypes,
        moderationLevel,
        enableToxicityDetection,
        enablePIIRedaction,
        enableHallucinationDetection
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    contentFilters: {
      toxicity: toxicityDetection ? toxicityDetection.detector : null,
      pii: piiRedaction ? piiRedaction.redactor : null,
      hallucination: hallucinationDetection ? hallucinationDetection.detector : null
    },
    moderationPipeline: moderationPipeline.pipeline,
    alertSystem: alertSystem.system,
    auditLogs: moderationPipeline.auditConfig,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/content-moderation-safety',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const moderationPolicyTask = defineTask('moderation-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Moderation Policy - ${args.systemName}`,
  agent: {
    name: 'safety-auditor',  // AG-SAF-001: Reviews agents for safety and alignment issues
    prompt: {
      role: 'Moderation Policy Designer',
      task: 'Define content moderation policy',
      context: args,
      instructions: [
        '1. Define content categories',
        '2. Set severity thresholds',
        '3. Define action for each violation',
        '4. Create appeal process',
        '5. Document edge cases',
        '6. Set regional policies',
        '7. Create policy document',
        '8. Save moderation policy'
      ],
      outputFormat: 'JSON with moderation policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'artifacts'],
      properties: {
        policy: { type: 'object' },
        categories: { type: 'array' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'policy']
}));

export const toxicityDetectionTask = defineTask('toxicity-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Toxicity Detection - ${args.systemName}`,
  agent: {
    name: 'toxicity-developer',
    prompt: {
      role: 'Toxicity Detection Developer',
      task: 'Implement toxicity detection system',
      context: args,
      instructions: [
        '1. Integrate toxicity API (Perspective, OpenAI)',
        '2. Configure detection categories',
        '3. Set confidence thresholds',
        '4. Implement batch processing',
        '5. Handle false positives',
        '6. Add contextual analysis',
        '7. Create response handling',
        '8. Save toxicity detector'
      ],
      outputFormat: 'JSON with toxicity detector'
    },
    outputSchema: {
      type: 'object',
      required: ['detector', 'artifacts'],
      properties: {
        detector: { type: 'object' },
        detectorCodePath: { type: 'string' },
        categories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'toxicity']
}));

export const piiRedactionTask = defineTask('pii-redaction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement PII Redaction - ${args.systemName}`,
  agent: {
    name: 'pii-developer',
    prompt: {
      role: 'PII Redaction Developer',
      task: 'Implement PII detection and redaction',
      context: args,
      instructions: [
        '1. Define PII categories',
        '2. Implement detection patterns',
        '3. Use NER for entity extraction',
        '4. Implement redaction logic',
        '5. Handle partial redaction',
        '6. Support reversible redaction',
        '7. Add audit logging',
        '8. Save PII redactor'
      ],
      outputFormat: 'JSON with PII redactor'
    },
    outputSchema: {
      type: 'object',
      required: ['redactor', 'artifacts'],
      properties: {
        redactor: { type: 'object' },
        redactorCodePath: { type: 'string' },
        piiCategories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'pii']
}));

export const hallucinationDetectionTask = defineTask('hallucination-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Hallucination Detection - ${args.systemName}`,
  agent: {
    name: 'hallucination-developer',
    prompt: {
      role: 'Hallucination Detection Developer',
      task: 'Implement hallucination detection',
      context: args,
      instructions: [
        '1. Implement fact verification',
        '2. Check against knowledge base',
        '3. Detect unsupported claims',
        '4. Add confidence scoring',
        '5. Handle uncertainty expressions',
        '6. Implement self-consistency check',
        '7. Create hallucination report',
        '8. Save hallucination detector'
      ],
      outputFormat: 'JSON with hallucination detector'
    },
    outputSchema: {
      type: 'object',
      required: ['detector', 'artifacts'],
      properties: {
        detector: { type: 'object' },
        detectorCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'hallucination']
}));

export const abusePreventionTask = defineTask('abuse-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Abuse Prevention - ${args.systemName}`,
  agent: {
    name: 'abuse-prevention-developer',
    prompt: {
      role: 'Abuse Prevention Developer',
      task: 'Implement abuse prevention mechanisms',
      context: args,
      instructions: [
        '1. Implement rate limiting',
        '2. Detect repetitive abuse',
        '3. Block malicious patterns',
        '4. Implement user blocking',
        '5. Add escalation triggers',
        '6. Create abuse reports',
        '7. Handle appeals',
        '8. Save abuse prevention'
      ],
      outputFormat: 'JSON with abuse prevention'
    },
    outputSchema: {
      type: 'object',
      required: ['prevention', 'artifacts'],
      properties: {
        prevention: { type: 'object' },
        preventionCodePath: { type: 'string' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'abuse']
}));

export const alertSystemTask = defineTask('alert-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Alert System - ${args.systemName}`,
  agent: {
    name: 'alert-developer',
    prompt: {
      role: 'Alert System Developer',
      task: 'Setup moderation alert system',
      context: args,
      instructions: [
        '1. Define alert triggers',
        '2. Configure alert channels',
        '3. Set alert severity levels',
        '4. Implement escalation paths',
        '5. Add alert aggregation',
        '6. Create alert dashboard',
        '7. Configure on-call routing',
        '8. Save alert system'
      ],
      outputFormat: 'JSON with alert system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        alertCodePath: { type: 'string' },
        triggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'alerts']
}));

export const moderationPipelineTask = defineTask('moderation-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Moderation Pipeline - ${args.systemName}`,
  agent: {
    name: 'pipeline-developer',
    prompt: {
      role: 'Moderation Pipeline Developer',
      task: 'Build complete moderation pipeline',
      context: args,
      instructions: [
        '1. Create pipeline orchestrator',
        '2. Wire all filters',
        '3. Define filter order',
        '4. Implement early exit',
        '5. Add async processing',
        '6. Configure audit logging',
        '7. Add metrics collection',
        '8. Save moderation pipeline'
      ],
      outputFormat: 'JSON with moderation pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'auditConfig', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        pipelineCodePath: { type: 'string' },
        auditConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'moderation', 'pipeline']
}));
