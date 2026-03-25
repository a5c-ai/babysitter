/**
 * @process specializations/ai-agents-conversational/tool-safety-validation
 * @description Tool Use Safety and Validation Framework - Process for implementing safety controls for tool-using agents
 * including input validation, authentication, rate limiting, audit logging, and sandboxed execution.
 * @inputs { agentName?: string, tools?: array, securityPolicy?: object, outputDir?: string }
 * @outputs { success: boolean, validationFramework: object, securityControls: object, auditLogs: object, safetyDocumentation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/tool-safety-validation', {
 *   agentName: 'production-agent',
 *   tools: ['database_query', 'file_operations', 'api_calls'],
 *   securityPolicy: { level: 'strict', auditAll: true }
 * });
 *
 * @references
 * - Guardrails AI: https://docs.guardrailsai.com/
 * - OWASP LLM Security: https://owasp.org/www-project-top-10-for-large-language-model-applications/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'secure-agent',
    tools = [],
    securityPolicy = { level: 'medium' },
    outputDir = 'tool-safety-output',
    enableSandbox = true,
    enableAudit = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Tool Safety Framework for ${agentName}`);

  // ============================================================================
  // PHASE 1: SECURITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing security requirements');

  const securityAssessment = await ctx.task(securityAssessmentTask, {
    agentName,
    tools,
    securityPolicy,
    outputDir
  });

  artifacts.push(...securityAssessment.artifacts);

  // ============================================================================
  // PHASE 2: INPUT VALIDATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 2: Building input validation framework');

  const validationFramework = await ctx.task(validationFrameworkTask, {
    agentName,
    tools,
    securityAssessment: securityAssessment.assessment,
    outputDir
  });

  artifacts.push(...validationFramework.artifacts);

  // ============================================================================
  // PHASE 3: AUTHENTICATION AND AUTHORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing authentication and authorization');

  const authImplementation = await ctx.task(authImplementationTask, {
    agentName,
    tools,
    securityPolicy,
    outputDir
  });

  artifacts.push(...authImplementation.artifacts);

  // ============================================================================
  // PHASE 4: RATE LIMITING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing rate limiting');

  const rateLimiting = await ctx.task(rateLimitingTask, {
    agentName,
    tools,
    securityPolicy,
    outputDir
  });

  artifacts.push(...rateLimiting.artifacts);

  // ============================================================================
  // PHASE 5: AUDIT LOGGING
  // ============================================================================

  let auditLogging = null;
  if (enableAudit) {
    ctx.log('info', 'Phase 5: Implementing audit logging');

    auditLogging = await ctx.task(auditLoggingTask, {
      agentName,
      tools,
      securityPolicy,
      outputDir
    });

    artifacts.push(...auditLogging.artifacts);
  }

  // ============================================================================
  // PHASE 6: SANDBOXED EXECUTION
  // ============================================================================

  let sandboxExecution = null;
  if (enableSandbox) {
    ctx.log('info', 'Phase 6: Implementing sandboxed execution');

    sandboxExecution = await ctx.task(sandboxExecutionTask, {
      agentName,
      tools,
      securityPolicy,
      outputDir
    });

    artifacts.push(...sandboxExecution.artifacts);
  }

  // ============================================================================
  // PHASE 7: SAFETY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating safety documentation');

  const safetyDocumentation = await ctx.task(safetyDocumentationTask, {
    agentName,
    securityAssessment: securityAssessment.assessment,
    validationFramework: validationFramework.framework,
    authImplementation: authImplementation.auth,
    rateLimiting: rateLimiting.config,
    auditLogging,
    sandboxExecution,
    outputDir
  });

  artifacts.push(...safetyDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Tool safety framework for ${agentName} complete. Security level: ${securityPolicy.level}. Review implementation?`,
    title: 'Tool Safety Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        toolCount: tools.length,
        securityLevel: securityPolicy.level,
        enableSandbox,
        enableAudit
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    validationFramework: validationFramework.framework,
    securityControls: {
      auth: authImplementation.auth,
      rateLimiting: rateLimiting.config,
      sandbox: sandboxExecution ? sandboxExecution.sandbox : null
    },
    auditLogs: auditLogging ? auditLogging.logging : null,
    safetyDocumentation: safetyDocumentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/tool-safety-validation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const securityAssessmentTask = defineTask('security-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Assessment - ${args.agentName}`,
  agent: {
    name: 'tool-safety-auditor',  // AG-TU-003: Implements tool validation, sandboxing, and safety controls
    prompt: {
      role: 'Security Analyst',
      task: 'Assess security requirements for tool-using agent',
      context: args,
      instructions: [
        '1. Analyze each tool for security risks',
        '2. Identify potential attack vectors',
        '3. Assess data sensitivity levels',
        '4. Identify compliance requirements',
        '5. Define security controls needed',
        '6. Create risk matrix',
        '7. Recommend security level per tool',
        '8. Save security assessment'
      ],
      outputFormat: 'JSON with security assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        riskMatrix: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'assessment']
}));

export const validationFrameworkTask = defineTask('validation-framework', (args, taskCtx) => ({
  kind: 'skill',
  title: `Build Validation Framework - ${args.agentName}`,
  skill: {
    name: 'tool-safety-validation',  // SK-TU-002: Tool safety validation and permission checking
    prompt: {
      role: 'Validation Framework Architect',
      task: 'Build comprehensive input validation framework',
      context: args,
      instructions: [
        '1. Create validation schema for each tool',
        '2. Implement type validation',
        '3. Add constraint validation',
        '4. Implement injection prevention',
        '5. Add path traversal prevention',
        '6. Create custom validators',
        '7. Implement validation chain',
        '8. Save validation framework'
      ],
      outputFormat: 'JSON with validation framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        validators: { type: 'array' },
        frameworkCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'validation']
}));

export const authImplementationTask = defineTask('auth-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Auth - ${args.agentName}`,
  agent: {
    name: 'auth-developer',
    prompt: {
      role: 'Auth Developer',
      task: 'Implement authentication and authorization',
      context: args,
      instructions: [
        '1. Implement API key validation',
        '2. Add JWT token handling',
        '3. Create role-based access control',
        '4. Implement tool-level permissions',
        '5. Add session management',
        '6. Create auth middleware',
        '7. Handle auth errors',
        '8. Save auth implementation'
      ],
      outputFormat: 'JSON with auth implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['auth', 'artifacts'],
      properties: {
        auth: { type: 'object' },
        authCodePath: { type: 'string' },
        permissions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'auth']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Rate Limiting - ${args.agentName}`,
  agent: {
    name: 'rate-limit-developer',
    prompt: {
      role: 'Rate Limiting Developer',
      task: 'Implement rate limiting for tool calls',
      context: args,
      instructions: [
        '1. Define rate limits per tool',
        '2. Implement sliding window limiter',
        '3. Add user-level limits',
        '4. Implement token bucket algorithm',
        '5. Add cost-based limiting',
        '6. Create limit exceeded handlers',
        '7. Add limit monitoring',
        '8. Save rate limiting config'
      ],
      outputFormat: 'JSON with rate limiting'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        limiterCodePath: { type: 'string' },
        limits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'rate-limiting']
}));

export const auditLoggingTask = defineTask('audit-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Audit Logging - ${args.agentName}`,
  agent: {
    name: 'audit-developer',
    prompt: {
      role: 'Audit Logging Developer',
      task: 'Implement comprehensive audit logging',
      context: args,
      instructions: [
        '1. Define audit events',
        '2. Capture tool call details',
        '3. Log input/output (with masking)',
        '4. Add timestamp and user context',
        '5. Implement log storage',
        '6. Add log retention policy',
        '7. Create audit reports',
        '8. Save audit logging config'
      ],
      outputFormat: 'JSON with audit logging'
    },
    outputSchema: {
      type: 'object',
      required: ['logging', 'artifacts'],
      properties: {
        logging: { type: 'object' },
        auditCodePath: { type: 'string' },
        eventTypes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'audit']
}));

export const sandboxExecutionTask = defineTask('sandbox-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Sandbox Execution - ${args.agentName}`,
  agent: {
    name: 'sandbox-developer',
    prompt: {
      role: 'Sandbox Developer',
      task: 'Implement sandboxed execution environment',
      context: args,
      instructions: [
        '1. Configure isolation boundaries',
        '2. Set resource limits',
        '3. Restrict network access',
        '4. Implement filesystem isolation',
        '5. Add process isolation',
        '6. Implement timeout enforcement',
        '7. Handle sandbox violations',
        '8. Save sandbox config'
      ],
      outputFormat: 'JSON with sandbox execution'
    },
    outputSchema: {
      type: 'object',
      required: ['sandbox', 'artifacts'],
      properties: {
        sandbox: { type: 'object' },
        sandboxCodePath: { type: 'string' },
        resourceLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-safety', 'sandbox']
}));

export const safetyDocumentationTask = defineTask('safety-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Safety Documentation - ${args.agentName}`,
  agent: {
    name: 'security-writer',
    prompt: {
      role: 'Security Documentation Writer',
      task: 'Create comprehensive safety documentation',
      context: args,
      instructions: [
        '1. Document security controls',
        '2. Create validation guidelines',
        '3. Document rate limits',
        '4. Write audit procedures',
        '5. Create incident response plan',
        '6. Document compliance mapping',
        '7. Add security best practices',
        '8. Save safety documentation'
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
  labels: ['agent', 'tool-safety', 'documentation']
}));
