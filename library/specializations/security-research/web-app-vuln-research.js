/**
 * @process specializations/security-research/web-app-vuln-research
 * @description Comprehensive web application security research covering OWASP Top 10, modern web
 * vulnerabilities, client-side attacks, and API security testing using Burp Suite, OWASP ZAP,
 * and manual testing techniques.
 * @inputs { projectName: string, targetUrl: string, authCredentials?: object }
 * @outputs { success: boolean, vulnerabilities: array, webAppReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/web-app-vuln-research', {
 *   projectName: 'E-commerce Security Assessment',
 *   targetUrl: 'https://app.example.com',
 *   authCredentials: { username: 'test', password: 'test123' }
 * });
 *
 * @references
 * - OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
 * - Burp Suite: https://portswigger.net/burp
 * - OWASP ZAP: https://www.zaproxy.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetUrl,
    authCredentials = null,
    testingScope = 'comprehensive',
    outputDir = 'webapp-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Web App Vulnerability Research for ${projectName}`);
  ctx.log('info', `Target: ${targetUrl}`);

  // ============================================================================
  // PHASE 1: RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 1: Web application reconnaissance');

  const recon = await ctx.task(webAppReconTask, {
    projectName,
    targetUrl,
    outputDir
  });

  artifacts.push(...recon.artifacts);

  // ============================================================================
  // PHASE 2: AUTHENTICATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 2: Testing authentication mechanisms');

  const authTesting = await ctx.task(authTestingTask, {
    projectName,
    targetUrl,
    authCredentials,
    recon,
    outputDir
  });

  vulnerabilities.push(...authTesting.vulnerabilities);
  artifacts.push(...authTesting.artifacts);

  // ============================================================================
  // PHASE 3: SESSION MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing session management');

  const sessionTesting = await ctx.task(sessionTestingTask, {
    projectName,
    targetUrl,
    authCredentials,
    outputDir
  });

  vulnerabilities.push(...sessionTesting.vulnerabilities);
  artifacts.push(...sessionTesting.artifacts);

  // ============================================================================
  // PHASE 4: INPUT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing input validation (injection attacks)');

  const inputTesting = await ctx.task(inputValidationTestingTask, {
    projectName,
    targetUrl,
    recon,
    outputDir
  });

  vulnerabilities.push(...inputTesting.vulnerabilities);
  artifacts.push(...inputTesting.artifacts);

  // ============================================================================
  // PHASE 5: ACCESS CONTROL
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing access control');

  const accessControlTesting = await ctx.task(accessControlTestingTask, {
    projectName,
    targetUrl,
    authCredentials,
    recon,
    outputDir
  });

  vulnerabilities.push(...accessControlTesting.vulnerabilities);
  artifacts.push(...accessControlTesting.artifacts);

  // ============================================================================
  // PHASE 6: CLIENT-SIDE SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing client-side security');

  const clientSideTesting = await ctx.task(clientSideTestingTask, {
    projectName,
    targetUrl,
    recon,
    outputDir
  });

  vulnerabilities.push(...clientSideTesting.vulnerabilities);
  artifacts.push(...clientSideTesting.artifacts);

  // ============================================================================
  // PHASE 7: BUSINESS LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing business logic');

  const businessLogicTesting = await ctx.task(businessLogicTestingTask, {
    projectName,
    targetUrl,
    recon,
    outputDir
  });

  vulnerabilities.push(...businessLogicTesting.vulnerabilities);
  artifacts.push(...businessLogicTesting.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating web app security report');

  const report = await ctx.task(webAppReportTask, {
    projectName,
    targetUrl,
    vulnerabilities,
    recon,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Web app research complete for ${projectName}. Found ${vulnerabilities.length} vulnerabilities. Review findings?`,
    title: 'Web App Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        target: targetUrl,
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
    webAppReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/web-app-vuln-research',
      timestamp: startTime,
      targetUrl,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const webAppReconTask = defineTask('webapp-recon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Web App Recon - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Web Application Researcher',
      task: 'Conduct web application reconnaissance',
      context: args,
      instructions: [
        '1. Map application structure',
        '2. Identify technologies used',
        '3. Discover endpoints',
        '4. Find entry points',
        '5. Identify authentication',
        '6. Map data flows',
        '7. Identify API endpoints',
        '8. Document attack surface'
      ],
      outputFormat: 'JSON with recon results'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'technologies', 'artifacts'],
      properties: {
        endpoints: { type: 'array' },
        technologies: { type: 'array' },
        entryPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'recon']
}));

export const authTestingTask = defineTask('auth-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auth Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Authentication Security Tester',
      task: 'Test authentication mechanisms',
      context: args,
      instructions: [
        '1. Test login functionality',
        '2. Test password policies',
        '3. Test brute force protection',
        '4. Test MFA implementation',
        '5. Test password reset',
        '6. Test credential storage',
        '7. Test authentication bypass',
        '8. Document findings'
      ],
      outputFormat: 'JSON with auth findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        authMechanisms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'auth']
}));

export const sessionTestingTask = defineTask('session-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Session Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Session Management Tester',
      task: 'Test session management',
      context: args,
      instructions: [
        '1. Test session tokens',
        '2. Test session fixation',
        '3. Test session hijacking',
        '4. Test timeout policies',
        '5. Test logout functionality',
        '6. Test concurrent sessions',
        '7. Test cookie security',
        '8. Document findings'
      ],
      outputFormat: 'JSON with session findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        sessionConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'session']
}));

export const inputValidationTestingTask = defineTask('input-validation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Input Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Input Validation Tester',
      task: 'Test input validation (injection attacks)',
      context: args,
      instructions: [
        '1. Test for SQL injection',
        '2. Test for XSS',
        '3. Test for command injection',
        '4. Test for LDAP injection',
        '5. Test for XML injection',
        '6. Test for path traversal',
        '7. Test for SSRF',
        '8. Document findings'
      ],
      outputFormat: 'JSON with injection findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        injectionPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'injection']
}));

export const accessControlTestingTask = defineTask('access-control-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Access Control Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Access Control Tester',
      task: 'Test access control',
      context: args,
      instructions: [
        '1. Test horizontal privilege escalation',
        '2. Test vertical privilege escalation',
        '3. Test IDOR vulnerabilities',
        '4. Test forced browsing',
        '5. Test function level access',
        '6. Test data access controls',
        '7. Test role-based access',
        '8. Document findings'
      ],
      outputFormat: 'JSON with access control findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        accessControlIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'access-control']
}));

export const clientSideTestingTask = defineTask('client-side-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client-Side Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Client-Side Security Tester',
      task: 'Test client-side security',
      context: args,
      instructions: [
        '1. Test DOM-based XSS',
        '2. Test clickjacking',
        '3. Test CORS misconfig',
        '4. Test CSP bypass',
        '5. Test client-side storage',
        '6. Test postMessage security',
        '7. Test WebSocket security',
        '8. Document findings'
      ],
      outputFormat: 'JSON with client-side findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        clientSideIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'client-side']
}));

export const businessLogicTestingTask = defineTask('business-logic-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Logic Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Business Logic Tester',
      task: 'Test business logic',
      context: args,
      instructions: [
        '1. Test workflow bypasses',
        '2. Test race conditions',
        '3. Test price manipulation',
        '4. Test quantity manipulation',
        '5. Test coupon abuse',
        '6. Test feature abuse',
        '7. Test limit bypasses',
        '8. Document findings'
      ],
      outputFormat: 'JSON with logic findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        logicFlaws: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'business-logic']
}));

export const webAppReportTask = defineTask('webapp-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Web App Security Report Specialist',
      task: 'Generate web app security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Categorize by severity',
        '3. Include reproduction steps',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Include evidence',
        '7. Add recommendations',
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
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'webapp', 'reporting']
}));
