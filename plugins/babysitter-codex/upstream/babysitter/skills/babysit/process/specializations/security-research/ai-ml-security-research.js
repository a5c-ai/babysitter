/**
 * @process specializations/security-research/ai-ml-security-research
 * @description Security research for AI/ML systems including adversarial attacks, model extraction,
 * data poisoning, and prompt injection vulnerabilities. Covers both traditional ML and LLM security
 * concerns.
 * @inputs { projectName: string, modelType: string, targetModel?: object }
 * @outputs { success: boolean, vulnerabilities: array, aiSecurityReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/ai-ml-security-research', {
 *   projectName: 'LLM Security Assessment',
 *   modelType: 'llm',
 *   targetModel: { endpoint: 'https://api.example.com/v1/chat' }
 * });
 *
 * @references
 * - OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
 * - Adversarial Robustness Toolbox: https://github.com/Trusted-AI/adversarial-robustness-toolbox
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    modelType,
    targetModel = {},
    assessmentType = 'comprehensive',
    outputDir = 'ai-ml-security-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting AI/ML Security Research for ${projectName}`);
  ctx.log('info', `Model Type: ${modelType}`);

  // ============================================================================
  // PHASE 1: MODEL RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 1: Model reconnaissance and characterization');

  const modelRecon = await ctx.task(modelReconTask, {
    projectName,
    modelType,
    targetModel,
    outputDir
  });

  artifacts.push(...modelRecon.artifacts);

  // ============================================================================
  // PHASE 2: PROMPT INJECTION (LLMs)
  // ============================================================================

  if (modelType === 'llm' || modelType === 'chatbot') {
    ctx.log('info', 'Phase 2: Testing prompt injection attacks');

    const promptInjection = await ctx.task(promptInjectionTask, {
      projectName,
      targetModel,
      outputDir
    });

    vulnerabilities.push(...promptInjection.vulnerabilities);
    artifacts.push(...promptInjection.artifacts);
  }

  // ============================================================================
  // PHASE 3: ADVERSARIAL ATTACKS
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing adversarial attacks');

  const adversarialAttacks = await ctx.task(adversarialAttacksTask, {
    projectName,
    modelType,
    targetModel,
    outputDir
  });

  vulnerabilities.push(...adversarialAttacks.vulnerabilities);
  artifacts.push(...adversarialAttacks.artifacts);

  // ============================================================================
  // PHASE 4: MODEL EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing model extraction vulnerabilities');

  const modelExtraction = await ctx.task(modelExtractionTask, {
    projectName,
    modelType,
    targetModel,
    outputDir
  });

  vulnerabilities.push(...modelExtraction.vulnerabilities);
  artifacts.push(...modelExtraction.artifacts);

  // ============================================================================
  // PHASE 5: DATA LEAKAGE
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing for data leakage');

  const dataLeakage = await ctx.task(dataLeakageTask, {
    projectName,
    modelType,
    targetModel,
    outputDir
  });

  vulnerabilities.push(...dataLeakage.vulnerabilities);
  artifacts.push(...dataLeakage.artifacts);

  // ============================================================================
  // PHASE 6: INFRASTRUCTURE SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing ML infrastructure security');

  const infraSecurity = await ctx.task(mlInfraSecurityTask, {
    projectName,
    targetModel,
    outputDir
  });

  vulnerabilities.push(...infraSecurity.vulnerabilities);
  artifacts.push(...infraSecurity.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating AI/ML security report');

  const report = await ctx.task(aiSecurityReportTask, {
    projectName,
    modelType,
    vulnerabilities,
    modelRecon,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `AI/ML security research complete for ${projectName}. Found ${vulnerabilities.length} vulnerabilities. Review findings?`,
    title: 'AI/ML Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        modelType,
        vulnerabilities: vulnerabilities.length,
        bySeverity: report.bySeverity
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    aiSecurityReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/ai-ml-security-research',
      timestamp: startTime,
      modelType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const modelReconTask = defineTask('model-recon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Reconnaissance - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'AI/ML Security Analyst',
      task: 'Perform model reconnaissance',
      context: args,
      instructions: [
        '1. Identify model architecture',
        '2. Determine model capabilities',
        '3. Identify input/output format',
        '4. Map API endpoints',
        '5. Identify rate limits',
        '6. Determine model version',
        '7. Identify safety guardrails',
        '8. Document model characteristics'
      ],
      outputFormat: 'JSON with model reconnaissance'
    },
    outputSchema: {
      type: 'object',
      required: ['modelInfo', 'capabilities', 'artifacts'],
      properties: {
        modelInfo: { type: 'object' },
        capabilities: { type: 'array' },
        guardrails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'recon']
}));

export const promptInjectionTask = defineTask('prompt-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prompt Injection Testing - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Prompt Injection Specialist',
      task: 'Test prompt injection attacks',
      context: args,
      instructions: [
        '1. Test direct injection',
        '2. Test indirect injection',
        '3. Test jailbreak attempts',
        '4. Test system prompt extraction',
        '5. Test guardrail bypasses',
        '6. Test multi-turn attacks',
        '7. Test encoding bypasses',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with prompt injection findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        successfulInjections: { type: 'array' },
        bypassedGuardrails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'prompt-injection']
}));

export const adversarialAttacksTask = defineTask('adversarial-attacks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial Attacks - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Adversarial Attack Specialist',
      task: 'Test adversarial attacks',
      context: args,
      instructions: [
        '1. Generate adversarial inputs',
        '2. Test evasion attacks',
        '3. Test perturbation attacks',
        '4. Test transferability',
        '5. Measure robustness',
        '6. Test physical attacks',
        '7. Test semantic attacks',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with adversarial findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        successfulAttacks: { type: 'array' },
        robustnessScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'adversarial']
}));

export const modelExtractionTask = defineTask('model-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Extraction - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Model Extraction Specialist',
      task: 'Test model extraction vulnerabilities',
      context: args,
      instructions: [
        '1. Test query-based extraction',
        '2. Assess model stealing risk',
        '3. Test decision boundary mapping',
        '4. Assess rate limit effectiveness',
        '5. Test watermark detection',
        '6. Assess API-based extraction',
        '7. Test functionality extraction',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with extraction findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        extractionRisk: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'extraction']
}));

export const dataLeakageTask = defineTask('data-leakage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Leakage Testing - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Data Leakage Specialist',
      task: 'Test for data leakage',
      context: args,
      instructions: [
        '1. Test training data extraction',
        '2. Test membership inference',
        '3. Test PII leakage',
        '4. Test memorization attacks',
        '5. Test for embedded secrets',
        '6. Test attribute inference',
        '7. Assess privacy protections',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with leakage findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        dataLeaked: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'data-leakage']
}));

export const mlInfraSecurityTask = defineTask('ml-infra-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `ML Infra Security - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'ML Infrastructure Security Analyst',
      task: 'Test ML infrastructure security',
      context: args,
      instructions: [
        '1. Check API authentication',
        '2. Test rate limiting',
        '3. Check input validation',
        '4. Assess model serving security',
        '5. Check logging/monitoring',
        '6. Test for SSRF',
        '7. Check for DoS vectors',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with infra findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        infraIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'infrastructure']
}));

export const aiSecurityReportTask = defineTask('ai-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'AI Security Report Specialist',
      task: 'Generate AI/ML security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to OWASP LLM Top 10',
        '3. Include attack examples',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Add risk ratings',
        '7. Include recommendations',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'bySeverity', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        bySeverity: { type: 'object' },
        byCategory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ai-ml', 'reporting']
}));
