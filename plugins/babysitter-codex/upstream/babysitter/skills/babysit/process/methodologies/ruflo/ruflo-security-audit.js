/**
 * @process methodologies/ruflo/ruflo-security-audit
 * @description Ruflo Security Audit Pipeline - AIDefence layer: prompt injection check -> input validation -> sandboxed execution -> output sanitization
 * @inputs { target: string, targetType?: string, projectRoot?: string, securityLevel?: string, scanScope?: string }
 * @outputs { success: boolean, auditResult: object, vulnerabilities: array, mitigations: array, complianceReport: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const promptInjectionCheckTask = defineTask('ruflo-prompt-injection-check', async (args, _ctx) => {
  return { check: args };
}, {
  kind: 'agent',
  title: 'AIDefence: Prompt Injection Detection and Blocking',
  labels: ['ruflo', 'security', 'prompt-injection', 'aidefence'],
  io: {
    inputs: { target: 'string', targetType: 'string', knownPatterns: 'array' },
    outputs: { injectionDetected: 'boolean', injectionType: 'string', confidence: 'number', blockedPatterns: 'array', sanitizedInput: 'string' }
  }
});

const inputValidationTask = defineTask('ruflo-input-validation', async (args, _ctx) => {
  return { validation: args };
}, {
  kind: 'agent',
  title: 'Validate and Sanitize All Input Paths and Parameters',
  labels: ['ruflo', 'security', 'input-validation'],
  io: {
    inputs: { target: 'string', targetType: 'string', projectRoot: 'string' },
    outputs: { valid: 'boolean', pathTraversalAttempts: 'array', sanitizedPaths: 'array', parameterIssues: 'array', typeCoercionRisks: 'array' }
  }
});

const staticAnalysisTask = defineTask('ruflo-static-analysis', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Static Security Analysis: SAST Scan',
  labels: ['ruflo', 'security', 'sast', 'static-analysis'],
  io: {
    inputs: { target: 'string', projectRoot: 'string', scanScope: 'string' },
    outputs: { vulnerabilities: 'array', severityCounts: 'object', hotspots: 'array', dependencyVulnerabilities: 'array', cweMatches: 'array' }
  }
});

const sandboxedExecutionTask = defineTask('ruflo-sandboxed-execution', async (args, _ctx) => {
  return { execution: args };
}, {
  kind: 'agent',
  title: 'Execute Security Tests in Sandboxed Environment',
  labels: ['ruflo', 'security', 'sandbox', 'execution'],
  io: {
    inputs: { target: 'string', testCases: 'array', sandboxConfig: 'object' },
    outputs: { results: 'array', sandboxViolations: 'array', resourceLimitsHit: 'array', networkAttempts: 'array', filesystemAttempts: 'array' }
  }
});

const outputSanitizationTask = defineTask('ruflo-output-sanitization', async (args, _ctx) => {
  return { sanitization: args };
}, {
  kind: 'agent',
  title: 'Sanitize All Outputs: Secrets, PII, Injection Vectors',
  labels: ['ruflo', 'security', 'output-sanitization'],
  io: {
    inputs: { outputs: 'array', sensitivePatterns: 'array' },
    outputs: { sanitizedOutputs: 'array', secretsRedacted: 'number', piiRedacted: 'number', injectionVectorsNeutralized: 'number', sanitizationLog: 'array' }
  }
});

const threatModelingTask = defineTask('ruflo-threat-modeling', async (args, _ctx) => {
  return { model: args };
}, {
  kind: 'agent',
  title: 'STRIDE Threat Modeling Analysis',
  labels: ['ruflo', 'security', 'threat-modeling', 'stride'],
  io: {
    inputs: { target: 'string', targetType: 'string', projectRoot: 'string', vulnerabilities: 'array' },
    outputs: { threats: 'array', strideCategories: 'object', attackSurface: 'object', mitigations: 'array', riskMatrix: 'object' }
  }
});

const complianceCheckTask = defineTask('ruflo-compliance-check', async (args, _ctx) => {
  return { compliance: args };
}, {
  kind: 'agent',
  title: 'Security Compliance and Best Practices Audit',
  labels: ['ruflo', 'security', 'compliance'],
  io: {
    inputs: { vulnerabilities: 'array', threats: 'array', securityLevel: 'string' },
    outputs: { compliant: 'boolean', findings: 'array', owaspTop10: 'object', cisControls: 'array', remediationPriority: 'array' }
  }
});

const generateReportTask = defineTask('ruflo-security-report', async (args, _ctx) => {
  return { report: args };
}, {
  kind: 'agent',
  title: 'Generate Comprehensive Security Audit Report',
  labels: ['ruflo', 'security', 'reporting'],
  io: {
    inputs: { auditResults: 'object', vulnerabilities: 'array', threats: 'array', compliance: 'object' },
    outputs: { report: 'object', executiveSummary: 'string', criticalFindings: 'array', remediationPlan: 'array', riskScore: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Ruflo Security Audit Pipeline Process
 *
 * Implements the AIDefence multi-layered security audit:
 * 1. Prompt Injection Detection - Pattern matching and heuristic blocking
 * 2. Input Validation - Path traversal, parameter sanitization, type coercion
 * 3. Static Analysis (SAST) - Vulnerability scanning, CWE matching, dependency audit
 * 4. Sandboxed Execution - Isolated security test execution with resource limits
 * 5. Output Sanitization - Secret/PII redaction, injection vector neutralization
 * 6. Threat Modeling (STRIDE) - Attack surface analysis and mitigation mapping
 * 7. Compliance Audit - OWASP Top 10, CIS controls, best practices
 * 8. Report Generation - Executive summary, risk score, remediation plan
 *
 * AIDefence Components:
 * - Prompt injection blocking (pattern + heuristic)
 * - Input validation (path traversal, injection prevention)
 * - Sandboxed execution (resource limits, network isolation, filesystem restrictions)
 * - Output sanitization (secrets, PII, injection vectors)
 *
 * Security Levels:
 * - standard: Basic SAST + input validation + output sanitization
 * - elevated: + threat modeling + compliance check
 * - maximum: + sandboxed execution + full STRIDE + remediation plan
 *
 * Attribution: Adapted from https://github.com/ruvnet/ruflo by ruvnet
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.target - Code, file, or component to audit
 * @param {string} inputs.targetType - code|file|component|api|dependency (default: code)
 * @param {string} inputs.projectRoot - Project root directory
 * @param {string} inputs.securityLevel - standard|elevated|maximum (default: elevated)
 * @param {string} inputs.scanScope - file|directory|project (default: directory)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Security audit results
 */
export async function process(inputs, ctx) {
  const {
    target,
    targetType = 'code',
    projectRoot = '.',
    securityLevel = 'elevated',
    scanScope = 'directory'
  } = inputs;

  ctx.log('Ruflo Security: Starting audit pipeline', { targetType, securityLevel, scanScope });

  // ============================================================================
  // STEP 1: PROMPT INJECTION DETECTION
  // ============================================================================

  ctx.log('Step 1: Prompt injection detection (AIDefence)');

  const injectionResult = await ctx.task(promptInjectionCheckTask, {
    target,
    targetType,
    knownPatterns: [
      'ignore previous', 'system prompt', 'jailbreak',
      'DAN', 'override instructions', 'forget rules'
    ]
  });

  if (injectionResult.injectionDetected) {
    ctx.log('ALERT: Prompt injection detected', {
      type: injectionResult.injectionType,
      confidence: injectionResult.confidence
    });

    await ctx.breakpoint({
      question: `Prompt injection detected (type: ${injectionResult.injectionType}, confidence: ${injectionResult.confidence}%). Blocked patterns: ${injectionResult.blockedPatterns.join(', ')}. Review and decide: continue with sanitized input or abort.`,
      title: 'SECURITY ALERT: Prompt Injection Detected',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 2: INPUT VALIDATION
  // ============================================================================

  ctx.log('Step 2: Input validation and path sanitization');

  const validationResult = await ctx.task(inputValidationTask, {
    target: injectionResult.sanitizedInput || target,
    targetType,
    projectRoot
  });

  if (!validationResult.valid) {
    ctx.log('Input validation failed', {
      pathTraversals: validationResult.pathTraversalAttempts.length,
      parameterIssues: validationResult.parameterIssues.length
    });

    if (validationResult.pathTraversalAttempts.length > 0) {
      await ctx.breakpoint({
        question: `Path traversal attempts detected: ${validationResult.pathTraversalAttempts.join(', ')}. This is a critical security issue. Abort or continue with sanitized paths.`,
        title: 'SECURITY ALERT: Path Traversal Detected',
        context: { runId: ctx.runId }
      });
    }
  }

  // ============================================================================
  // STEP 3: STATIC ANALYSIS (SAST)
  // ============================================================================

  ctx.log('Step 3: Static security analysis (SAST)');

  const sastResult = await ctx.task(staticAnalysisTask, {
    target: injectionResult.sanitizedInput || target,
    projectRoot,
    scanScope
  });

  ctx.log('SAST complete', {
    vulnerabilities: sastResult.vulnerabilities.length,
    severity: sastResult.severityCounts,
    dependencyVulns: sastResult.dependencyVulnerabilities.length
  });

  // ============================================================================
  // STEP 4: SANDBOXED EXECUTION (maximum security level only)
  // ============================================================================

  let sandboxResult = null;
  if (securityLevel === 'maximum') {
    ctx.log('Step 4: Sandboxed execution (maximum security level)');

    sandboxResult = await ctx.task(sandboxedExecutionTask, {
      target: injectionResult.sanitizedInput || target,
      testCases: sastResult.hotspots.map(h => ({ hotspot: h, testType: 'boundary' })),
      sandboxConfig: {
        networkIsolated: true,
        filesystemRestricted: true,
        resourceLimits: { memory: '256MB', cpu: '1 core', time: '30s' }
      }
    });

    if (sandboxResult.sandboxViolations.length > 0) {
      await ctx.breakpoint({
        question: `Sandbox violations detected: ${sandboxResult.sandboxViolations.join('; ')}. Network attempts: ${sandboxResult.networkAttempts.length}. Filesystem attempts: ${sandboxResult.filesystemAttempts.length}. Review violations.`,
        title: 'SECURITY: Sandbox Violations Detected',
        context: { runId: ctx.runId }
      });
    }
  }

  // ============================================================================
  // STEP 5: OUTPUT SANITIZATION
  // ============================================================================

  ctx.log('Step 5: Output sanitization');

  const allOutputs = [
    ...sastResult.vulnerabilities.map(v => v.description || ''),
    ...(sandboxResult?.results || []).map(r => JSON.stringify(r))
  ];

  const sanitizationResult = await ctx.task(outputSanitizationTask, {
    outputs: allOutputs,
    sensitivePatterns: ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY', 'SSN', 'email']
  });

  // ============================================================================
  // STEP 6-7: THREAT MODELING + COMPLIANCE (elevated/maximum only)
  // ============================================================================

  let threatResult = null;
  let complianceResult = null;

  if (securityLevel === 'elevated' || securityLevel === 'maximum') {
    ctx.log('Steps 6-7: Threat modeling and compliance (parallel)');

    [threatResult, complianceResult] = await ctx.parallel.all([
      ctx.task(threatModelingTask, {
        target,
        targetType,
        projectRoot,
        vulnerabilities: sastResult.vulnerabilities
      }),
      ctx.task(complianceCheckTask, {
        vulnerabilities: sastResult.vulnerabilities,
        threats: [],
        securityLevel
      })
    ]);
  }

  // ============================================================================
  // STEP 8: REPORT GENERATION
  // ============================================================================

  ctx.log('Step 8: Generating security audit report');

  const reportResult = await ctx.task(generateReportTask, {
    auditResults: {
      injectionCheck: { detected: injectionResult.injectionDetected, type: injectionResult.injectionType },
      inputValidation: { valid: validationResult.valid, issues: validationResult.parameterIssues.length },
      sast: { vulnerabilities: sastResult.vulnerabilities.length, severity: sastResult.severityCounts },
      sandbox: sandboxResult ? { violations: sandboxResult.sandboxViolations.length } : null,
      sanitization: { secretsRedacted: sanitizationResult.secretsRedacted, piiRedacted: sanitizationResult.piiRedacted }
    },
    vulnerabilities: sastResult.vulnerabilities,
    threats: threatResult?.threats || [],
    compliance: complianceResult || {}
  });

  const criticalCount = sastResult.vulnerabilities.filter(v => v.severity === 'critical').length;
  if (criticalCount > 0) {
    await ctx.breakpoint({
      question: `${criticalCount} CRITICAL vulnerabilities found. Risk score: ${reportResult.riskScore}/100. Critical findings: ${reportResult.criticalFindings.join('; ')}. Review remediation plan before proceeding.`,
      title: 'SECURITY: Critical Vulnerabilities Require Review',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: criticalCount === 0 && (complianceResult?.compliant !== false),
    auditResult: {
      injectionCheck: {
        detected: injectionResult.injectionDetected,
        type: injectionResult.injectionType,
        blocked: injectionResult.blockedPatterns
      },
      inputValidation: {
        valid: validationResult.valid,
        pathTraversals: validationResult.pathTraversalAttempts.length,
        parameterIssues: validationResult.parameterIssues.length
      },
      sast: {
        vulnerabilities: sastResult.vulnerabilities.length,
        severity: sastResult.severityCounts,
        dependencyVulns: sastResult.dependencyVulnerabilities.length,
        cweMatches: sastResult.cweMatches
      },
      sandbox: sandboxResult ? {
        violations: sandboxResult.sandboxViolations.length,
        networkAttempts: sandboxResult.networkAttempts.length,
        filesystemAttempts: sandboxResult.filesystemAttempts.length
      } : null,
      sanitization: {
        secretsRedacted: sanitizationResult.secretsRedacted,
        piiRedacted: sanitizationResult.piiRedacted,
        injectionVectorsNeutralized: sanitizationResult.injectionVectorsNeutralized
      }
    },
    vulnerabilities: sastResult.vulnerabilities,
    mitigations: threatResult?.mitigations || [],
    complianceReport: complianceResult ? {
      compliant: complianceResult.compliant,
      owaspTop10: complianceResult.owaspTop10,
      remediationPriority: complianceResult.remediationPriority
    } : null,
    report: {
      executiveSummary: reportResult.executiveSummary,
      riskScore: reportResult.riskScore,
      criticalFindings: reportResult.criticalFindings,
      remediationPlan: reportResult.remediationPlan
    },
    summary: {
      target,
      targetType,
      securityLevel,
      totalVulnerabilities: sastResult.vulnerabilities.length,
      criticalCount,
      riskScore: reportResult.riskScore,
      compliant: complianceResult?.compliant,
      injectionBlocked: injectionResult.injectionDetected
    },
    metadata: {
      processId: 'methodologies/ruflo/ruflo-security-audit',
      attribution: 'https://github.com/ruvnet/ruflo',
      author: 'ruvnet',
      timestamp: ctx.now()
    }
  };
}
