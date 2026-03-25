/**
 * @process specializations/cli-mcp-development/mcp-server-security-hardening
 * @description MCP Server Security Hardening - Implement security measures for MCP servers including sandboxing,
 * input validation, path traversal prevention, rate limiting, and audit logging.
 * @inputs { projectName: string, securityLevel: string, allowedDirectories?: array, rateLimits?: object }
 * @outputs { success: boolean, securityConfig: object, validationRules: array, auditConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-server-security-hardening', {
 *   projectName: 'secure-mcp-server',
 *   securityLevel: 'high',
 *   allowedDirectories: ['/workspace', '/tmp'],
 *   rateLimits: { maxRequests: 100, windowMs: 60000 }
 * });
 *
 * @references
 * - MCP Security: https://modelcontextprotocol.io/docs/concepts/security
 * - OWASP Guidelines: https://owasp.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    securityLevel = 'high',
    allowedDirectories = ['/workspace', '/tmp'],
    rateLimits = { maxRequests: 100, windowMs: 60000 },
    enableAuditLogging = true,
    language = 'typescript',
    outputDir = 'mcp-server-security-hardening'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Server Security Hardening: ${projectName}`);
  ctx.log('info', `Security Level: ${securityLevel}`);

  // ============================================================================
  // PHASE 1: INPUT PATH AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing all input paths');

  const inputPathAudit = await ctx.task(inputPathAuditTask, {
    projectName,
    securityLevel,
    outputDir
  });

  artifacts.push(...inputPathAudit.artifacts);

  // ============================================================================
  // PHASE 2: PATH TRAVERSAL PREVENTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing path traversal prevention');

  const pathTraversalPrevention = await ctx.task(pathTraversalPreventionTask, {
    projectName,
    allowedDirectories,
    language,
    outputDir
  });

  artifacts.push(...pathTraversalPrevention.artifacts);

  // ============================================================================
  // PHASE 3: COMMAND INJECTION PROTECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Adding command injection protection');

  const commandInjectionProtection = await ctx.task(commandInjectionProtectionTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...commandInjectionProtection.artifacts);

  // ============================================================================
  // PHASE 4: SANDBOXED EXECUTION ENVIRONMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating sandboxed execution environment');

  const sandboxedExecution = await ctx.task(sandboxedExecutionTask, {
    projectName,
    securityLevel,
    allowedDirectories,
    language,
    outputDir
  });

  artifacts.push(...sandboxedExecution.artifacts);

  // Quality Gate: Security Implementation Review
  await ctx.breakpoint({
    question: `Security measures implemented: path traversal prevention, command injection protection, sandboxed execution. Proceed with rate limiting and audit logging?`,
    title: 'Security Implementation Review',
    context: {
      runId: ctx.runId,
      projectName,
      securityLevel,
      allowedDirectories,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 5: RATE LIMITING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing rate limiting');

  const rateLimitingImpl = await ctx.task(rateLimitingTask, {
    projectName,
    rateLimits,
    language,
    outputDir
  });

  artifacts.push(...rateLimitingImpl.artifacts);

  // ============================================================================
  // PHASE 6: REQUEST SIZE LIMITS
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding request size limits');

  const requestSizeLimits = await ctx.task(requestSizeLimitsTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...requestSizeLimits.artifacts);

  // ============================================================================
  // PHASE 7: ALLOWED DIRECTORIES CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring allowed directories and resources');

  const allowedDirectoriesConfig = await ctx.task(allowedDirectoriesConfigTask, {
    projectName,
    allowedDirectories,
    language,
    outputDir
  });

  artifacts.push(...allowedDirectoriesConfig.artifacts);

  // ============================================================================
  // PHASE 8: PERMISSION MODEL
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing permission model');

  const permissionModel = await ctx.task(permissionModelTask, {
    projectName,
    securityLevel,
    language,
    outputDir
  });

  artifacts.push(...permissionModel.artifacts);

  // ============================================================================
  // PHASE 9: AUDIT LOGGING
  // ============================================================================

  if (enableAuditLogging) {
    ctx.log('info', 'Phase 9: Adding audit logging');

    const auditLogging = await ctx.task(auditLoggingTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...auditLogging.artifacts);
  }

  // ============================================================================
  // PHASE 10: SECURITY TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating security tests');

  const securityTests = await ctx.task(securityTestsTask, {
    projectName,
    pathTraversalPrevention,
    commandInjectionProtection,
    rateLimitingImpl,
    language,
    outputDir
  });

  artifacts.push(...securityTests.artifacts);

  // ============================================================================
  // PHASE 11: SECURITY MODEL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting security model');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    securityLevel,
    allowedDirectories,
    rateLimits,
    inputPathAudit,
    pathTraversalPrevention,
    sandboxedExecution,
    permissionModel,
    enableAuditLogging,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCP Server Security Hardening complete for ${projectName}. Review and approve?`,
    title: 'MCP Server Security Hardening Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        securityLevel,
        allowedDirectories,
        rateLimits,
        enableAuditLogging,
        securityTestsPassed: securityTests.passed
      },
      files: [
        { path: documentation.securityDocPath, format: 'markdown', label: 'Security Documentation' },
        { path: pathTraversalPrevention.validationPath, format: 'typescript', label: 'Path Validation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    securityConfig: {
      level: securityLevel,
      pathTraversalPrevention: pathTraversalPrevention.enabled,
      commandInjectionProtection: commandInjectionProtection.enabled,
      sandboxedExecution: sandboxedExecution.enabled,
      rateLimiting: rateLimitingImpl.config
    },
    validationRules: inputPathAudit.rules,
    permissionModel: permissionModel.model,
    auditConfig: enableAuditLogging ? { enabled: true } : { enabled: false },
    securityTests: {
      total: securityTests.total,
      passed: securityTests.passed
    },
    documentation: {
      securityDoc: documentation.securityDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/mcp-server-security-hardening',
      timestamp: startTime,
      securityLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inputPathAuditTask = defineTask('input-path-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Input Path Audit - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'MCP Security Auditor',
      task: 'Audit all input paths',
      context: {
        projectName: args.projectName,
        securityLevel: args.securityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all input entry points',
        '2. Analyze tool parameters for path inputs',
        '3. Analyze resource URIs for path patterns',
        '4. Document validation requirements',
        '5. Create input audit report',
        '6. Generate audit documentation'
      ],
      outputFormat: 'JSON with input path audit'
    },
    outputSchema: {
      type: 'object',
      required: ['inputPaths', 'rules', 'artifacts'],
      properties: {
        inputPaths: { type: 'array', items: { type: 'object' } },
        rules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'audit']
}));

export const pathTraversalPreventionTask = defineTask('path-traversal-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Path Traversal Prevention - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Path Security Specialist',
      task: 'Implement path traversal prevention',
      context: {
        projectName: args.projectName,
        allowedDirectories: args.allowedDirectories,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create path normalization function',
        '2. Detect and reject ".." patterns',
        '3. Validate against allowed directories',
        '4. Handle symbolic link resolution',
        '5. Create path validation middleware',
        '6. Generate path traversal prevention code'
      ],
      outputFormat: 'JSON with path traversal prevention'
    },
    outputSchema: {
      type: 'object',
      required: ['validationPath', 'enabled', 'artifacts'],
      properties: {
        validationPath: { type: 'string' },
        enabled: { type: 'boolean' },
        validationFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'path-traversal']
}));

export const commandInjectionProtectionTask = defineTask('command-injection-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Command Injection Protection - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Command Injection Prevention Specialist',
      task: 'Add command injection protection',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify shell command execution points',
        '2. Create argument sanitization functions',
        '3. Use parameterized commands',
        '4. Avoid shell interpolation',
        '5. Whitelist allowed commands',
        '6. Generate command injection protection code'
      ],
      outputFormat: 'JSON with command injection protection'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        sanitizationFunctions: { type: 'array', items: { type: 'string' } },
        allowedCommands: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'command-injection']
}));

export const sandboxedExecutionTask = defineTask('sandboxed-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sandboxed Execution - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Sandbox Environment Specialist',
      task: 'Create sandboxed execution environment',
      context: {
        projectName: args.projectName,
        securityLevel: args.securityLevel,
        allowedDirectories: args.allowedDirectories,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design sandbox boundaries',
        '2. Implement filesystem restrictions',
        '3. Restrict network access if needed',
        '4. Limit process spawning',
        '5. Configure resource limits',
        '6. Generate sandboxed execution code'
      ],
      outputFormat: 'JSON with sandboxed execution'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'restrictions', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        restrictions: { type: 'object' },
        sandboxConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'sandbox']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Rate Limiting - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Rate Limiting Specialist',
      task: 'Implement rate limiting',
      context: {
        projectName: args.projectName,
        rateLimits: args.rateLimits,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure rate limit thresholds',
        '2. Implement token bucket or sliding window',
        '3. Handle rate limit exceeded',
        '4. Add per-tool rate limits if needed',
        '5. Generate rate limiting code'
      ],
      outputFormat: 'JSON with rate limiting'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        middlewarePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'rate-limiting']
}));

export const requestSizeLimitsTask = defineTask('request-size-limits', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Request Size Limits - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Request Validation Specialist',
      task: 'Add request size limits',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure maximum request body size',
        '2. Limit parameter string lengths',
        '3. Limit array sizes in parameters',
        '4. Handle oversized requests',
        '5. Generate request size limit code'
      ],
      outputFormat: 'JSON with request size limits'
    },
    outputSchema: {
      type: 'object',
      required: ['limits', 'artifacts'],
      properties: {
        limits: { type: 'object' },
        validationCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'size-limits']
}));

export const allowedDirectoriesConfigTask = defineTask('allowed-directories-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Allowed Directories Config - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Directory Access Control Specialist',
      task: 'Configure allowed directories and resources',
      context: {
        projectName: args.projectName,
        allowedDirectories: args.allowedDirectories,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define allowed directory list',
        '2. Create directory access checker',
        '3. Configure per-tool directory permissions',
        '4. Handle dynamic directory additions',
        '5. Generate directory configuration'
      ],
      outputFormat: 'JSON with allowed directories config'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        allowedPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'directories']
}));

export const permissionModelTask = defineTask('permission-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Permission Model - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Permission System Designer',
      task: 'Implement permission model',
      context: {
        projectName: args.projectName,
        securityLevel: args.securityLevel,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design permission model',
        '2. Define permission types (read, write, execute)',
        '3. Create permission checking functions',
        '4. Implement role-based access if needed',
        '5. Generate permission model code'
      ],
      outputFormat: 'JSON with permission model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: { type: 'object' },
        permissionTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'permissions']
}));

export const auditLoggingTask = defineTask('audit-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Audit Logging - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'Audit Logging Specialist',
      task: 'Add audit logging',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design audit log format',
        '2. Log all tool invocations',
        '3. Log resource access',
        '4. Log security events (blocked requests)',
        '5. Configure log rotation',
        '6. Generate audit logging code'
      ],
      outputFormat: 'JSON with audit logging'
    },
    outputSchema: {
      type: 'object',
      required: ['loggingConfig', 'artifacts'],
      properties: {
        loggingConfig: { type: 'object' },
        logFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'audit-logging']
}));

export const securityTestsTask = defineTask('security-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Security Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: {
      role: 'Security Testing Specialist',
      task: 'Create security tests',
      context: {
        projectName: args.projectName,
        pathTraversalPrevention: args.pathTraversalPrevention,
        commandInjectionProtection: args.commandInjectionProtection,
        rateLimitingImpl: args.rateLimitingImpl,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test path traversal prevention',
        '2. Test command injection protection',
        '3. Test rate limiting',
        '4. Test request size limits',
        '5. Test permission enforcement',
        '6. Generate security test suite'
      ],
      outputFormat: 'JSON with security tests'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'passed', 'testFilePath', 'artifacts'],
      properties: {
        total: { type: 'number' },
        passed: { type: 'number' },
        testFilePath: { type: 'string' },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Document security model',
      context: {
        projectName: args.projectName,
        securityLevel: args.securityLevel,
        allowedDirectories: args.allowedDirectories,
        rateLimits: args.rateLimits,
        inputPathAudit: args.inputPathAudit,
        pathTraversalPrevention: args.pathTraversalPrevention,
        sandboxedExecution: args.sandboxedExecution,
        permissionModel: args.permissionModel,
        enableAuditLogging: args.enableAuditLogging,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document security architecture',
        '2. Document input validation rules',
        '3. Document permission model',
        '4. Document rate limits',
        '5. Document audit logging',
        '6. Add security best practices',
        '7. Generate security documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['securityDocPath', 'artifacts'],
      properties: {
        securityDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'security', 'documentation']
}));
