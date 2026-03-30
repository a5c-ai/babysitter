/**
 * @process specializations/security-research/static-code-analysis
 * @description Manual and automated source code analysis to identify security vulnerabilities including
 * injection flaws, authentication issues, cryptographic weaknesses, and logic errors using tools like
 * Semgrep, CodeQL, and manual code review techniques.
 * @inputs { projectName: string, codebasePath: string, languages?: array, analysisTools?: array }
 * @outputs { success: boolean, vulnerabilities: array, codeReviewReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/static-code-analysis', {
 *   projectName: 'Application Security Review',
 *   codebasePath: '/path/to/codebase',
 *   languages: ['javascript', 'python', 'java'],
 *   analysisTools: ['semgrep', 'codeql', 'manual']
 * });
 *
 * @references
 * - OWASP Code Review Guide: https://owasp.org/www-project-code-review-guide/
 * - Semgrep: https://semgrep.dev/
 * - CodeQL: https://codeql.github.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    codebasePath,
    languages = ['javascript', 'python'],
    analysisTools = ['semgrep', 'codeql', 'manual'],
    securityRules = ['owasp-top-10', 'cwe-top-25'],
    outputDir = 'static-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const allVulnerabilities = [];

  ctx.log('info', `Starting Static Code Analysis for ${projectName}`);
  ctx.log('info', `Languages: ${languages.join(', ')}, Tools: ${analysisTools.join(', ')}`);

  // ============================================================================
  // PHASE 1: CODEBASE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing codebase structure and security-critical paths');

  const codebaseAssessment = await ctx.task(codebaseAssessmentTask, {
    projectName,
    codebasePath,
    languages,
    outputDir
  });

  artifacts.push(...codebaseAssessment.artifacts);

  // ============================================================================
  // PHASE 2: AUTOMATED STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running automated static analysis tools');

  const automatedAnalysis = await ctx.task(automatedStaticAnalysisTask, {
    projectName,
    codebasePath,
    languages,
    analysisTools,
    securityRules,
    outputDir
  });

  allVulnerabilities.push(...automatedAnalysis.vulnerabilities);
  artifacts.push(...automatedAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DATA FLOW ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Tracing data flow from sources to sinks');

  const dataFlowAnalysis = await ctx.task(dataFlowAnalysisTask, {
    projectName,
    codebasePath,
    codebaseAssessment,
    outputDir
  });

  allVulnerabilities.push(...dataFlowAnalysis.vulnerabilities);
  artifacts.push(...dataFlowAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: AUTHENTICATION AND AUTHORIZATION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Reviewing authentication and authorization logic');

  const authReview = await ctx.task(authReviewTask, {
    projectName,
    codebasePath,
    codebaseAssessment,
    outputDir
  });

  allVulnerabilities.push(...authReview.vulnerabilities);
  artifacts.push(...authReview.artifacts);

  // ============================================================================
  // PHASE 5: CRYPTOGRAPHY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Reviewing cryptography implementation');

  const cryptoReview = await ctx.task(cryptoReviewTask, {
    projectName,
    codebasePath,
    codebaseAssessment,
    outputDir
  });

  allVulnerabilities.push(...cryptoReview.vulnerabilities);
  artifacts.push(...cryptoReview.artifacts);

  // ============================================================================
  // PHASE 6: FINDINGS CONSOLIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Consolidating and documenting findings');

  const consolidation = await ctx.task(findingsConsolidationTask, {
    projectName,
    vulnerabilities: allVulnerabilities,
    codebaseAssessment,
    outputDir
  });

  artifacts.push(...consolidation.artifacts);

  await ctx.breakpoint({
    question: `Static analysis complete for ${projectName}. Found ${consolidation.totalVulnerabilities} vulnerabilities. Review report?`,
    title: 'Static Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: consolidation.summary,
      files: consolidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities: consolidation.consolidatedVulnerabilities,
    codeReviewReport: {
      reportPath: consolidation.reportPath,
      totalVulnerabilities: consolidation.totalVulnerabilities,
      bySeverity: consolidation.bySeverity,
      byCategory: consolidation.byCategory
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/static-code-analysis',
      timestamp: startTime,
      languages,
      analysisTools,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codebaseAssessmentTask = defineTask('codebase-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Codebase - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Code Analyst',
      task: 'Assess codebase structure and identify security-critical code paths',
      context: args,
      instructions: [
        '1. Analyze codebase structure and architecture',
        '2. Identify programming languages and frameworks',
        '3. Locate security-critical functions and modules',
        '4. Identify authentication/authorization code',
        '5. Find cryptographic implementations',
        '6. Locate input handling and validation code',
        '7. Identify database interaction points',
        '8. Document security-relevant configuration files'
      ],
      outputFormat: 'JSON with codebase assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['securityCriticalPaths', 'technologies', 'artifacts'],
      properties: {
        securityCriticalPaths: { type: 'array' },
        technologies: { type: 'array' },
        linesOfCode: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'code-analysis']
}));

export const automatedStaticAnalysisTask = defineTask('automated-static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Automated Analysis - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'SAST Engineer',
      task: 'Run automated static analysis with security rules',
      context: args,
      instructions: [
        '1. Configure Semgrep with security rulesets',
        '2. Run CodeQL queries for vulnerability detection',
        '3. Apply OWASP Top 10 and CWE Top 25 rules',
        '4. Analyze results and filter false positives',
        '5. Prioritize findings by severity',
        '6. Document tool configurations used',
        '7. Export findings in standardized format',
        '8. Generate coverage metrics'
      ],
      outputFormat: 'JSON with automated analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'toolResults', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        toolResults: { type: 'object' },
        totalFindings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'sast']
}));

export const dataFlowAnalysisTask = defineTask('data-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Data Flows - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Data Flow Security Analyst',
      task: 'Trace data flow from sources to sinks for security analysis',
      context: args,
      instructions: [
        '1. Identify all data sources (user input, files, APIs)',
        '2. Identify all data sinks (databases, output, commands)',
        '3. Trace data propagation through the application',
        '4. Identify missing input validation',
        '5. Find data that reaches dangerous sinks',
        '6. Identify injection vulnerabilities',
        '7. Document taint propagation paths',
        '8. Assess data sanitization effectiveness'
      ],
      outputFormat: 'JSON with data flow analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'dataFlows', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        dataFlows: { type: 'array' },
        unsanitizedPaths: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'data-flow']
}));

export const authReviewTask = defineTask('auth-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Auth Logic - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Authentication Security Specialist',
      task: 'Review authentication and authorization implementation',
      context: args,
      instructions: [
        '1. Review authentication flow implementation',
        '2. Check password storage mechanisms',
        '3. Review session management code',
        '4. Analyze authorization checks',
        '5. Identify privilege escalation paths',
        '6. Review multi-factor authentication',
        '7. Check for authentication bypass',
        '8. Assess token handling security'
      ],
      outputFormat: 'JSON with auth review findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'authIssues', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        authIssues: { type: 'array' },
        authMechanisms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'auth-review']
}));

export const cryptoReviewTask = defineTask('crypto-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Cryptography - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Cryptography Security Analyst',
      task: 'Review cryptographic implementations for weaknesses',
      context: args,
      instructions: [
        '1. Identify all cryptographic operations',
        '2. Check for weak algorithms (MD5, SHA1, DES)',
        '3. Review key generation and management',
        '4. Assess random number generation',
        '5. Check for hardcoded keys/secrets',
        '6. Review encryption mode usage',
        '7. Analyze certificate validation',
        '8. Document cryptographic best practice violations'
      ],
      outputFormat: 'JSON with crypto review findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'cryptoIssues', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        cryptoIssues: { type: 'array' },
        algorithmsUsed: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'crypto-review']
}));

export const findingsConsolidationTask = defineTask('findings-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consolidate Findings - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Report Specialist',
      task: 'Consolidate all findings into comprehensive report',
      context: args,
      instructions: [
        '1. Deduplicate vulnerability findings',
        '2. Assign severity ratings to all findings',
        '3. Categorize by vulnerability type',
        '4. Map findings to CWE identifiers',
        '5. Create remediation recommendations',
        '6. Generate executive summary',
        '7. Create detailed technical report',
        '8. Provide code fix suggestions'
      ],
      outputFormat: 'JSON with consolidated report'
    },
    outputSchema: {
      type: 'object',
      required: ['consolidatedVulnerabilities', 'totalVulnerabilities', 'reportPath', 'artifacts'],
      properties: {
        consolidatedVulnerabilities: { type: 'array' },
        totalVulnerabilities: { type: 'number' },
        bySeverity: { type: 'object' },
        byCategory: { type: 'object' },
        summary: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reporting']
}));
