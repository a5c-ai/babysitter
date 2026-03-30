/**
 * @process specializations/security-research/api-security-research
 * @description Security research focused on REST, GraphQL, and gRPC APIs covering authentication,
 * authorization, input validation, rate limiting, and API-specific vulnerabilities following
 * OWASP API Security Top 10.
 * @inputs { projectName: string, apiEndpoint: string, apiType?: string, apiSpec?: string }
 * @outputs { success: boolean, vulnerabilities: array, apiSecurityReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/api-security-research', {
 *   projectName: 'Payment API Security',
 *   apiEndpoint: 'https://api.example.com',
 *   apiType: 'rest',
 *   apiSpec: '/path/to/openapi.yaml'
 * });
 *
 * @references
 * - OWASP API Security: https://owasp.org/www-project-api-security/
 * - API Security Best Practices: https://swagger.io/blog/api-security/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiEndpoint,
    apiType = 'rest',
    apiSpec = null,
    authMethod = 'bearer',
    outputDir = 'api-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting API Security Research for ${projectName}`);
  ctx.log('info', `API: ${apiEndpoint}, Type: ${apiType}`);

  // ============================================================================
  // PHASE 1: API DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering API endpoints and structure');

  const discovery = await ctx.task(apiDiscoveryTask, {
    projectName,
    apiEndpoint,
    apiType,
    apiSpec,
    outputDir
  });

  artifacts.push(...discovery.artifacts);

  // ============================================================================
  // PHASE 2: AUTHENTICATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 2: Testing API authentication');

  const authTesting = await ctx.task(apiAuthTestingTask, {
    projectName,
    apiEndpoint,
    authMethod,
    discovery,
    outputDir
  });

  vulnerabilities.push(...authTesting.vulnerabilities);
  artifacts.push(...authTesting.artifacts);

  // ============================================================================
  // PHASE 3: AUTHORIZATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing API authorization (BOLA/BFLA)');

  const authzTesting = await ctx.task(apiAuthzTestingTask, {
    projectName,
    apiEndpoint,
    discovery,
    outputDir
  });

  vulnerabilities.push(...authzTesting.vulnerabilities);
  artifacts.push(...authzTesting.artifacts);

  // ============================================================================
  // PHASE 4: INPUT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing API input validation');

  const inputTesting = await ctx.task(apiInputTestingTask, {
    projectName,
    apiEndpoint,
    discovery,
    outputDir
  });

  vulnerabilities.push(...inputTesting.vulnerabilities);
  artifacts.push(...inputTesting.artifacts);

  // ============================================================================
  // PHASE 5: RATE LIMITING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing rate limiting and resource consumption');

  const rateLimitTesting = await ctx.task(rateLimitTestingTask, {
    projectName,
    apiEndpoint,
    discovery,
    outputDir
  });

  vulnerabilities.push(...rateLimitTesting.vulnerabilities);
  artifacts.push(...rateLimitTesting.artifacts);

  // ============================================================================
  // PHASE 6: DATA EXPOSURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing for excessive data exposure');

  const dataExposureTesting = await ctx.task(dataExposureTestingTask, {
    projectName,
    apiEndpoint,
    discovery,
    outputDir
  });

  vulnerabilities.push(...dataExposureTesting.vulnerabilities);
  artifacts.push(...dataExposureTesting.artifacts);

  // ============================================================================
  // PHASE 7: MASS ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing for mass assignment vulnerabilities');

  const massAssignmentTesting = await ctx.task(massAssignmentTestingTask, {
    projectName,
    apiEndpoint,
    discovery,
    outputDir
  });

  vulnerabilities.push(...massAssignmentTesting.vulnerabilities);
  artifacts.push(...massAssignmentTesting.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating API security report');

  const report = await ctx.task(apiSecurityReportTask, {
    projectName,
    apiEndpoint,
    apiType,
    vulnerabilities,
    discovery,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `API security research complete for ${projectName}. Found ${vulnerabilities.length} vulnerabilities. Review findings?`,
    title: 'API Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        apiEndpoint,
        apiType,
        endpointsDiscovered: discovery.endpoints.length,
        vulnerabilities: vulnerabilities.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    apiSecurityReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/api-security-research',
      timestamp: startTime,
      apiEndpoint,
      apiType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const apiDiscoveryTask = defineTask('api-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Discovery - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'API Security Researcher',
      task: 'Discover API endpoints and structure',
      context: args,
      instructions: [
        '1. Parse API specification if available',
        '2. Discover undocumented endpoints',
        '3. Map API resources',
        '4. Identify parameters',
        '5. Document authentication methods',
        '6. Identify versioning',
        '7. Map data models',
        '8. Document API structure'
      ],
      outputFormat: 'JSON with API discovery'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'resources', 'artifacts'],
      properties: {
        endpoints: { type: 'array' },
        resources: { type: 'array' },
        authMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'discovery']
}));

export const apiAuthTestingTask = defineTask('api-auth-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Auth Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'API Authentication Tester',
      task: 'Test API authentication',
      context: args,
      instructions: [
        '1. Test broken authentication',
        '2. Test JWT vulnerabilities',
        '3. Test API key security',
        '4. Test OAuth flows',
        '5. Test token handling',
        '6. Test credential stuffing',
        '7. Test password policies',
        '8. Document findings'
      ],
      outputFormat: 'JSON with auth findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        authIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'authentication']
}));

export const apiAuthzTestingTask = defineTask('api-authz-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Authz Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'API Authorization Tester',
      task: 'Test API authorization (BOLA/BFLA)',
      context: args,
      instructions: [
        '1. Test BOLA (Broken Object Level Authorization)',
        '2. Test BFLA (Broken Function Level Authorization)',
        '3. Test IDOR vulnerabilities',
        '4. Test privilege escalation',
        '5. Test scope bypass',
        '6. Test role-based access',
        '7. Test resource isolation',
        '8. Document findings'
      ],
      outputFormat: 'JSON with authz findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        bolaFindings: { type: 'array' },
        bflaFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'authorization']
}));

export const apiInputTestingTask = defineTask('api-input-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Input Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'API Input Validation Tester',
      task: 'Test API input validation',
      context: args,
      instructions: [
        '1. Test injection attacks',
        '2. Test type confusion',
        '3. Test boundary values',
        '4. Test special characters',
        '5. Test encoding issues',
        '6. Test SSRF via parameters',
        '7. Test XXE if XML accepted',
        '8. Document findings'
      ],
      outputFormat: 'JSON with input findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        inputIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'input']
}));

export const rateLimitTestingTask = defineTask('rate-limit-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rate Limit Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Rate Limiting Tester',
      task: 'Test rate limiting and resource consumption',
      context: args,
      instructions: [
        '1. Test rate limiting presence',
        '2. Test rate limit bypass',
        '3. Test resource exhaustion',
        '4. Test DoS conditions',
        '5. Test batch operations',
        '6. Test pagination limits',
        '7. Test timeout handling',
        '8. Document findings'
      ],
      outputFormat: 'JSON with rate limit findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        rateLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'rate-limit']
}));

export const dataExposureTestingTask = defineTask('data-exposure-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Exposure Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Data Exposure Tester',
      task: 'Test for excessive data exposure',
      context: args,
      instructions: [
        '1. Check response filtering',
        '2. Test for PII exposure',
        '3. Check error messages',
        '4. Test verbose responses',
        '5. Check for internal IDs',
        '6. Test debug endpoints',
        '7. Check metadata exposure',
        '8. Document findings'
      ],
      outputFormat: 'JSON with data exposure findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        exposedData: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'data-exposure']
}));

export const massAssignmentTestingTask = defineTask('mass-assignment-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mass Assignment Testing - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Mass Assignment Tester',
      task: 'Test for mass assignment vulnerabilities',
      context: args,
      instructions: [
        '1. Identify writable properties',
        '2. Test adding extra fields',
        '3. Test modifying read-only fields',
        '4. Test role/permission fields',
        '5. Test internal fields',
        '6. Test nested objects',
        '7. Test array manipulation',
        '8. Document findings'
      ],
      outputFormat: 'JSON with mass assignment findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        assignableFields: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'mass-assignment']
}));

export const apiSecurityReportTask = defineTask('api-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate API Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'API Security Report Specialist',
      task: 'Generate API security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to OWASP API Top 10',
        '3. Include reproduction steps',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Include API documentation issues',
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
        byOwaspCategory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'api', 'reporting']
}));
