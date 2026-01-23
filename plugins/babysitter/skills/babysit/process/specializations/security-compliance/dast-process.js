/**
 * @process security-compliance/dast-process
 * @description Dynamic Application Security Testing (DAST) Process - Comprehensive black-box security testing for running applications covering OWASP ZAP, Burp Suite, authenticated scanning, scope definition, vulnerability validation, and detailed reporting
 * @category Security Testing
 * @priority High
 * @complexity High
 * @inputs { applicationUrl: string, toolChoice: string, authenticationType: string, scanScope: object, complianceStandards: array, severityThreshold: string }
 * @outputs { success: boolean, vulnerabilitiesFound: number, criticalIssues: number, securityScore: number, complianceStatus: object, scanResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationUrl,
    toolChoice = 'owasp-zap', // owasp-zap | burp-suite | both
    authenticationType = 'form-based', // form-based | api-token | oauth | saml | custom
    scanScope = {},
    complianceStandards = ['OWASP-Top-10', 'PCI-DSS', 'CWE-Top-25'],
    severityThreshold = 'medium',
    credentials = {},
    scanTypes = ['passive', 'active', 'api'],
    maxScanDuration = '4 hours',
    reportFormats = ['html', 'json', 'pdf'],
    falsPositiveHandling = true,
    continuousScanningEnabled = false,
    outputDir = 'dast-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Dynamic Application Security Testing (DAST) Process');

  // Validate application URL
  if (!applicationUrl) {
    throw new Error('Application URL is required for DAST scanning');
  }

  // ============================================================================
  // PHASE 1: ENVIRONMENT ASSESSMENT AND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing target application and environment');
  const environmentAssessment = await ctx.task(assessEnvironmentTask, {
    applicationUrl,
    toolChoice,
    authenticationType,
    scanScope,
    outputDir
  });

  artifacts.push(...environmentAssessment.artifacts);

  await ctx.checkpoint({
    title: 'Phase 1: Environment Assessment Complete',
    message: `Target application assessed. Technology stack: ${environmentAssessment.techStack.join(', ')}. Entry points identified: ${environmentAssessment.entryPointsCount}.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        applicationUrl,
        techStack: environmentAssessment.techStack,
        entryPointsCount: environmentAssessment.entryPointsCount,
        authRequired: environmentAssessment.authRequired
      }
    }
  });

  // ============================================================================
  // PHASE 2: TOOL SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up and configuring DAST tools');
  const toolSetup = await ctx.task(setupDASTToolsTask, {
    toolChoice,
    applicationUrl,
    authenticationType,
    credentials,
    environmentAssessment,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  await ctx.checkpoint({
    title: 'Phase 2: DAST Tool Configuration Complete',
    message: `${toolSetup.toolsConfigured.join(' and ')} configured. Proxy setup: ${toolSetup.proxyConfigured ? 'Active' : 'N/A'}. Authentication handler: ${toolSetup.authConfigured ? 'Ready' : 'Pending'}.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        toolsConfigured: toolSetup.toolsConfigured,
        proxyConfigured: toolSetup.proxyConfigured,
        authConfigured: toolSetup.authConfigured
      }
    }
  });

  // ============================================================================
  // PHASE 3: SCOPE DEFINITION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining scan scope and boundaries');
  const scopeDefinition = await ctx.task(defineScanScopeTask, {
    applicationUrl,
    scanScope,
    environmentAssessment,
    toolSetup,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  await ctx.checkpoint({
    question: `Scan scope defined: ${scopeDefinition.urlsInScope.length} URLs in scope, ${scopeDefinition.urlsExcluded.length} excluded. Estimated scan time: ${scopeDefinition.estimatedDuration}. Approve scope before proceeding?`,
    title: 'Phase 3: Scan Scope Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        urlsInScope: scopeDefinition.urlsInScope.length,
        urlsExcluded: scopeDefinition.urlsExcluded.length,
        estimatedDuration: scopeDefinition.estimatedDuration,
        riskLevel: scopeDefinition.riskLevel
      }
    }
  });

  // ============================================================================
  // PHASE 4: AUTHENTICATED SESSION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring authenticated scanning');
  const authSetup = await ctx.task(setupAuthenticatedScanningTask, {
    authenticationType,
    credentials,
    applicationUrl,
    toolSetup,
    environmentAssessment,
    outputDir
  });

  artifacts.push(...authSetup.artifacts);

  await ctx.checkpoint({
    title: 'Phase 4: Authentication Setup Complete',
    message: `Authentication configured for ${authenticationType}. Session management: ${authSetup.sessionManagementActive ? 'Active' : 'Manual'}. Auth verification: ${authSetup.authVerified ? 'Success' : 'Needs Review'}.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        authenticationType,
        authVerified: authSetup.authVerified,
        sessionManagementActive: authSetup.sessionManagementActive,
        authLevelsConfigured: authSetup.authLevelsConfigured
      }
    }
  });

  // ============================================================================
  // PHASE 5: PASSIVE SCANNING AND SPIDERING
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing passive scan and application spidering');
  const passiveScan = await ctx.task(passiveScanAndSpiderTask, {
    applicationUrl,
    scopeDefinition,
    authSetup,
    toolSetup,
    maxScanDuration,
    outputDir
  });

  artifacts.push(...passiveScan.artifacts);

  await ctx.checkpoint({
    title: 'Phase 5: Passive Scan Complete',
    message: `Application spidered: ${passiveScan.urlsDiscovered} URLs discovered, ${passiveScan.passiveIssuesFound} passive vulnerabilities identified. Coverage: ${passiveScan.coveragePercent}%.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        urlsDiscovered: passiveScan.urlsDiscovered,
        passiveIssuesFound: passiveScan.passiveIssuesFound,
        coveragePercent: passiveScan.coveragePercent,
        spiderDepth: passiveScan.spiderDepth
      }
    }
  });

  // ============================================================================
  // PHASE 6: ACTIVE SCANNING AND ATTACK SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing active security scan with attack payloads');
  const activeScan = await ctx.task(activeScanTask, {
    applicationUrl,
    scopeDefinition,
    passiveScan,
    authSetup,
    toolSetup,
    scanTypes,
    complianceStandards,
    maxScanDuration,
    outputDir
  });

  artifacts.push(...activeScan.artifacts);

  await ctx.checkpoint({
    title: 'Phase 6: Active Scan Complete',
    message: `Active scan completed: ${activeScan.vulnerabilitiesFound} vulnerabilities found (${activeScan.criticalCount} critical, ${activeScan.highCount} high, ${activeScan.mediumCount} medium).`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        vulnerabilitiesFound: activeScan.vulnerabilitiesFound,
        criticalCount: activeScan.criticalCount,
        highCount: activeScan.highCount,
        mediumCount: activeScan.mediumCount,
        lowCount: activeScan.lowCount,
        scanProgress: activeScan.scanProgress
      }
    }
  });

  // ============================================================================
  // PHASE 7: API SECURITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing API-specific security testing');
  const apiScan = await ctx.task(apiSecurityTestingTask, {
    applicationUrl,
    environmentAssessment,
    scopeDefinition,
    authSetup,
    toolSetup,
    passiveScan,
    outputDir
  });

  artifacts.push(...apiScan.artifacts);

  await ctx.checkpoint({
    title: 'Phase 7: API Security Testing Complete',
    message: `API endpoints tested: ${apiScan.endpointsTested}. API-specific vulnerabilities: ${apiScan.apiVulnerabilitiesFound}. OWASP API Top 10 coverage: ${apiScan.apiTop10Coverage}%.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        endpointsTested: apiScan.endpointsTested,
        apiVulnerabilitiesFound: apiScan.apiVulnerabilitiesFound,
        apiTop10Coverage: apiScan.apiTop10Coverage,
        authIssues: apiScan.authIssues
      }
    }
  });

  // ============================================================================
  // PHASE 8: VULNERABILITY VALIDATION AND TRIAGE
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating vulnerabilities and filtering false positives');
  const vulnerabilityValidation = await ctx.task(validateVulnerabilitiesTask, {
    passiveScan,
    activeScan,
    apiScan,
    severityThreshold,
    falsPositiveHandling,
    complianceStandards,
    outputDir
  });

  artifacts.push(...vulnerabilityValidation.artifacts);

  await ctx.checkpoint({
    title: 'Phase 8: Vulnerability Validation Complete',
    message: `Validation complete: ${vulnerabilityValidation.confirmedVulnerabilities} confirmed vulnerabilities, ${vulnerabilityValidation.falsePositives} false positives identified. Validation accuracy: ${vulnerabilityValidation.validationAccuracy}%.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        confirmedVulnerabilities: vulnerabilityValidation.confirmedVulnerabilities,
        falsePositives: vulnerabilityValidation.falsePositives,
        requiresManualReview: vulnerabilityValidation.requiresManualReview,
        validationAccuracy: vulnerabilityValidation.validationAccuracy
      }
    }
  });

  // ============================================================================
  // PHASE 9: COMPLIANCE MAPPING AND SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Mapping findings to compliance standards');
  const complianceMapping = await ctx.task(mapComplianceTask, {
    vulnerabilityValidation,
    complianceStandards,
    environmentAssessment,
    outputDir
  });

  artifacts.push(...complianceMapping.artifacts);

  await ctx.checkpoint({
    title: 'Phase 9: Compliance Mapping Complete',
    message: `Compliance assessment: OWASP Top 10 score: ${complianceMapping.owaspScore}/100, PCI-DSS compliance: ${complianceMapping.pciDssCompliant ? 'Pass' : 'Fail'}, CWE coverage: ${complianceMapping.cweMatches} CWEs matched.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        owaspScore: complianceMapping.owaspScore,
        pciDssCompliant: complianceMapping.pciDssCompliant,
        cweMatches: complianceMapping.cweMatches,
        standardsCovered: complianceMapping.standardsCovered
      }
    }
  });

  // ============================================================================
  // PHASE 10: REPORTING AND REMEDIATION GUIDANCE
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating reports and remediation guidance');
  const reporting = await ctx.task(generateReportsTask, {
    environmentAssessment,
    scopeDefinition,
    passiveScan,
    activeScan,
    apiScan,
    vulnerabilityValidation,
    complianceMapping,
    reportFormats,
    severityThreshold,
    complianceStandards,
    outputDir
  });

  artifacts.push(...reporting.artifacts);

  await ctx.checkpoint({
    title: 'Phase 10: Reports Generated',
    message: `Reports generated in ${reporting.formatsGenerated.join(', ')} formats. Executive summary: ${reporting.executiveSummaryGenerated ? 'Created' : 'Pending'}. Remediation guidance: ${reporting.remediationItems} items.`,
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        formatsGenerated: reporting.formatsGenerated,
        executiveSummaryGenerated: reporting.executiveSummaryGenerated,
        remediationItems: reporting.remediationItems,
        reportLinks: reporting.reportLinks
      }
    }
  });

  // ============================================================================
  // PHASE 11: CONTINUOUS SCANNING SETUP (OPTIONAL)
  // ============================================================================

  let continuousScanning = null;
  if (continuousScanningEnabled) {
    ctx.log('info', 'Phase 11: Configuring continuous DAST scanning');
    continuousScanning = await ctx.task(setupContinuousScanningTask, {
      applicationUrl,
      toolSetup,
      scopeDefinition,
      authSetup,
      scanTypes,
      complianceStandards,
      outputDir
    });

    artifacts.push(...continuousScanning.artifacts);

    await ctx.checkpoint({
      title: 'Phase 11: Continuous Scanning Setup Complete',
      message: `Continuous scanning configured: Schedule: ${continuousScanning.scanSchedule}, CI/CD integration: ${continuousScanning.cicdIntegrated ? 'Active' : 'Manual'}.`,
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          scanSchedule: continuousScanning.scanSchedule,
          cicdIntegrated: continuousScanning.cicdIntegrated,
          automatedRemediation: continuousScanning.automatedRemediation
        }
      }
    });
  }

  // ============================================================================
  // FINAL ASSESSMENT AND SUMMARY
  // ============================================================================

  const totalVulnerabilities = vulnerabilityValidation.confirmedVulnerabilities;
  const criticalIssues = activeScan.criticalCount + apiScan.criticalCount;
  const securityScore = complianceMapping.overallSecurityScore || 0;
  const success = criticalIssues === 0 && securityScore >= 70;

  await ctx.breakpoint({
    question: `DAST scan complete! Found ${totalVulnerabilities} confirmed vulnerabilities (${criticalIssues} critical). Security score: ${securityScore}/100. ${success ? 'Application meets security baseline!' : 'Remediation required before production deployment.'} Review findings and proceed?`,
    title: 'DAST Process Complete - Review Required',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        success,
        totalVulnerabilities,
        criticalIssues,
        securityScore,
        complianceStatus: complianceMapping.complianceStatus,
        topFindings: reporting.topFindings,
        reportPaths: reporting.reportLinks
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success,
    vulnerabilitiesFound: totalVulnerabilities,
    criticalIssues,
    securityScore,
    complianceStatus: complianceMapping.complianceStatus,
    scanResults: {
      passive: {
        urlsDiscovered: passiveScan.urlsDiscovered,
        issuesFound: passiveScan.passiveIssuesFound,
        coverage: passiveScan.coveragePercent
      },
      active: {
        vulnerabilities: activeScan.vulnerabilitiesFound,
        criticalCount: activeScan.criticalCount,
        highCount: activeScan.highCount,
        mediumCount: activeScan.mediumCount,
        lowCount: activeScan.lowCount
      },
      api: {
        endpointsTested: apiScan.endpointsTested,
        vulnerabilities: apiScan.apiVulnerabilitiesFound,
        owaspApiTop10Coverage: apiScan.apiTop10Coverage
      }
    },
    validation: {
      confirmedVulnerabilities: vulnerabilityValidation.confirmedVulnerabilities,
      falsePositives: vulnerabilityValidation.falsePositives,
      requiresManualReview: vulnerabilityValidation.requiresManualReview,
      validationAccuracy: vulnerabilityValidation.validationAccuracy
    },
    compliance: {
      owaspScore: complianceMapping.owaspScore,
      pciDssCompliant: complianceMapping.pciDssCompliant,
      cweMatches: complianceMapping.cweMatches,
      standardsCovered: complianceMapping.standardsCovered
    },
    reports: {
      formatsGenerated: reporting.formatsGenerated,
      reportLinks: reporting.reportLinks,
      remediationItems: reporting.remediationItems,
      executiveSummary: reporting.executiveSummaryPath
    },
    continuousScanning: continuousScanning ? {
      enabled: true,
      schedule: continuousScanning.scanSchedule,
      cicdIntegrated: continuousScanning.cicdIntegrated
    } : { enabled: false },
    artifacts,
    duration,
    metadata: {
      processId: 'security-compliance/dast-process',
      timestamp: startTime,
      applicationUrl,
      toolChoice,
      authenticationType,
      scanTypes,
      complianceStandards,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Assess Environment
export const assessEnvironmentTask = defineTask('assess-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess target application environment and technology stack',
  agent: {
    name: 'environment-assessor',
    prompt: {
      role: 'application security specialist and penetration testing expert',
      task: 'Assess target application to identify technology stack, entry points, authentication mechanisms, and potential security considerations',
      context: args,
      instructions: [
        'Analyze application URL and identify web server technology',
        'Detect application framework and programming language (headers, footprints)',
        'Identify authentication mechanisms in use',
        'Map visible entry points and user flows',
        'Detect client-side technologies (JavaScript frameworks, libraries)',
        'Identify API endpoints and web services',
        'Analyze robots.txt, sitemap.xml, security.txt',
        'Detect security headers and mechanisms (CSP, HSTS, X-Frame-Options)',
        'Identify third-party integrations and CDN usage',
        'Assess application complexity and scanning feasibility',
        'Document potential scan challenges (rate limiting, CAPTCHA, WAF)',
        'Estimate initial scan scope and duration',
        'Generate environment assessment report with architecture diagram'
      ],
      outputFormat: 'JSON with techStack (array), entryPointsCount (number), authRequired (boolean), securityHeaders (object), complexityLevel (string), scanChallenges (array), estimatedScope (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techStack', 'entryPointsCount', 'authRequired', 'artifacts'],
      properties: {
        techStack: {
          type: 'array',
          items: { type: 'string' },
          description: 'Detected technologies (e.g., nginx, React, Express.js)'
        },
        entryPointsCount: { type: 'number' },
        authRequired: { type: 'boolean' },
        securityHeaders: {
          type: 'object',
          properties: {
            csp: { type: 'boolean' },
            hsts: { type: 'boolean' },
            xFrameOptions: { type: 'boolean' },
            xssProtection: { type: 'boolean' }
          }
        },
        complexityLevel: {
          type: 'string',
          enum: ['simple', 'moderate', 'complex', 'highly-complex']
        },
        apiEndpoints: { type: 'array', items: { type: 'string' } },
        scanChallenges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              challenge: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        estimatedScope: {
          type: 'object',
          properties: {
            expectedUrls: { type: 'number' },
            expectedDuration: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'assessment', 'security']
}));

// Task 2: Setup DAST Tools
export const setupDASTToolsTask = defineTask('setup-dast-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure DAST scanning tools',
  agent: {
    name: 'dast-tool-engineer',
    prompt: {
      role: 'security engineer specializing in DAST tools (OWASP ZAP, Burp Suite)',
      task: 'Set up and configure DAST scanning tools with appropriate settings for the target application',
      context: args,
      instructions: [
        'Install and configure selected DAST tool(s)',
        'Set up intercepting proxy for traffic capture',
        'Configure scan policies based on application type',
        'Set up custom attack patterns if needed',
        'Configure authentication handling mechanisms',
        'Set up session management and token handling',
        'Configure scan tuning parameters (threads, timeout, retry)',
        'Set up exclusions for sensitive endpoints (logout, delete operations)',
        'Configure custom headers or cookies if required',
        'Set up API testing extensions/plugins',
        'Configure scan optimization settings',
        'Test tool configuration with safe requests',
        'Document tool configuration and settings',
        'Generate tool setup guide and configuration files'
      ],
      outputFormat: 'JSON with toolsConfigured (array), proxyConfigured (boolean), authConfigured (boolean), scanPolicies (array), customSettings (object), testResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsConfigured', 'proxyConfigured', 'artifacts'],
      properties: {
        toolsConfigured: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tools successfully configured'
        },
        proxyConfigured: { type: 'boolean' },
        authConfigured: { type: 'boolean' },
        scanPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policyName: { type: 'string' },
              description: { type: 'string' },
              attackStrength: { type: 'string' }
            }
          }
        },
        customSettings: {
          type: 'object',
          properties: {
            maxDepth: { type: 'number' },
            threadCount: { type: 'number' },
            requestDelay: { type: 'number' },
            userAgent: { type: 'string' }
          }
        },
        testResults: {
          type: 'object',
          properties: {
            proxyWorking: { type: 'boolean' },
            targetReachable: { type: 'boolean' },
            authTested: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'tool-setup', 'configuration']
}));

// Task 3: Define Scan Scope
export const defineScanScopeTask = defineTask('define-scan-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define and validate scan scope boundaries',
  agent: {
    name: 'scope-specialist',
    prompt: {
      role: 'penetration testing lead specializing in scope definition and risk management',
      task: 'Define comprehensive scan scope including URLs to test, exclusions, and risk assessment',
      context: args,
      instructions: [
        'Define base URLs and allowed domains for scanning',
        'Identify URLs to include in scope (based on business logic)',
        'Define exclusion patterns (logout, payment, data deletion endpoints)',
        'Set up URL regex patterns for inclusion/exclusion',
        'Define scan depth and breadth limits',
        'Identify rate limiting requirements to avoid DoS',
        'Define testing windows if production scanning',
        'Assess risk level for each scope area',
        'Configure out-of-band interaction endpoints if needed',
        'Define data sensitivity levels for different endpoints',
        'Create scope validation rules',
        'Estimate scan duration based on scope',
        'Document scope rationale and risk considerations',
        'Generate scope definition document with approval checklist'
      ],
      outputFormat: 'JSON with urlsInScope (array), urlsExcluded (array), scopeRules (array), estimatedDuration (string), riskLevel (string), dataHandling (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['urlsInScope', 'urlsExcluded', 'estimatedDuration', 'riskLevel', 'artifacts'],
      properties: {
        urlsInScope: {
          type: 'array',
          items: { type: 'string' }
        },
        urlsExcluded: {
          type: 'array',
          items: { type: 'string' }
        },
        scopeRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              action: { type: 'string', enum: ['include', 'exclude'] },
              reason: { type: 'string' }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        riskLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical']
        },
        scanDepth: { type: 'number' },
        rateLimitSettings: {
          type: 'object',
          properties: {
            requestsPerSecond: { type: 'number' },
            delayBetweenRequests: { type: 'number' }
          }
        },
        dataHandling: {
          type: 'object',
          properties: {
            piiPresent: { type: 'boolean' },
            productionData: { type: 'boolean' },
            safeguardsMandatory: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'scope', 'planning']
}));

// Task 4: Setup Authenticated Scanning
export const setupAuthenticatedScanningTask = defineTask('setup-authenticated-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure authenticated scanning capabilities',
  agent: {
    name: 'auth-testing-specialist',
    prompt: {
      role: 'security tester specializing in authentication mechanisms and session management',
      task: 'Configure authenticated scanning to test application functionality behind authentication',
      context: args,
      instructions: [
        'Analyze authentication mechanism (form-based, OAuth, SAML, API key, JWT)',
        'Configure authentication credentials securely',
        'Set up login sequence and session establishment',
        'Configure session token extraction and management',
        'Set up automatic session re-authentication on expiry',
        'Configure logout detection and handling',
        'Test authentication flow with valid credentials',
        'Set up multiple user roles if role-based testing required',
        'Configure authorization header injection for API testing',
        'Test session persistence across requests',
        'Configure authentication verification checks',
        'Document authentication setup and credential handling',
        'Create authentication troubleshooting guide',
        'Generate auth configuration report'
      ],
      outputFormat: 'JSON with authVerified (boolean), sessionManagementActive (boolean), authLevelsConfigured (number), reAuthEnabled (boolean), testResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['authVerified', 'sessionManagementActive', 'artifacts'],
      properties: {
        authVerified: { type: 'boolean' },
        sessionManagementActive: { type: 'boolean' },
        authLevelsConfigured: {
          type: 'number',
          description: 'Number of user roles/privilege levels configured'
        },
        reAuthEnabled: { type: 'boolean' },
        authenticationType: { type: 'string' },
        testResults: {
          type: 'object',
          properties: {
            loginSuccessful: { type: 'boolean' },
            sessionEstablished: { type: 'boolean' },
            tokenExtracted: { type: 'boolean' },
            logoutDetected: { type: 'boolean' },
            reAuthTested: { type: 'boolean' }
          }
        },
        sessionSettings: {
          type: 'object',
          properties: {
            sessionTimeout: { type: 'string' },
            tokenType: { type: 'string' },
            cookieBased: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'authentication', 'session-management']
}));

// Task 5: Passive Scan and Spider
export const passiveScanAndSpiderTask = defineTask('passive-scan-spider', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute passive scanning and application spidering',
  agent: {
    name: 'spider-specialist',
    prompt: {
      role: 'web application security analyst specializing in passive reconnaissance',
      task: 'Spider application to discover all endpoints and perform passive vulnerability detection',
      context: args,
      instructions: [
        'Start spidering from base URL with authenticated session',
        'Follow all links within defined scope',
        'Parse and analyze HTML forms and input fields',
        'Extract API endpoints from JavaScript files',
        'Identify AJAX endpoints and dynamic content',
        'Analyze client-side code for sensitive data exposure',
        'Detect passive security issues (headers, cookies, comments)',
        'Map application structure and site tree',
        'Identify file types and technologies used',
        'Extract parameters and input validation patterns',
        'Detect information disclosure vulnerabilities',
        'Calculate application coverage percentage',
        'Log all discovered URLs and parameters',
        'Generate application map and discovery report'
      ],
      outputFormat: 'JSON with urlsDiscovered (number), passiveIssuesFound (number), coveragePercent (number), spiderDepth (number), forms (array), apiEndpoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['urlsDiscovered', 'passiveIssuesFound', 'coveragePercent', 'artifacts'],
      properties: {
        urlsDiscovered: { type: 'number' },
        passiveIssuesFound: { type: 'number' },
        coveragePercent: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        spiderDepth: { type: 'number' },
        forms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              method: { type: 'string' },
              inputFields: { type: 'number' }
            }
          }
        },
        apiEndpoints: { type: 'array', items: { type: 'string' } },
        passiveFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        siteMap: {
          type: 'object',
          properties: {
            totalNodes: { type: 'number' },
            maxDepth: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'passive-scan', 'spidering']
}));

// Task 6: Active Scan
export const activeScanTask = defineTask('active-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute active security scanning with attack payloads',
  agent: {
    name: 'active-scanner',
    prompt: {
      role: 'penetration tester specializing in automated vulnerability scanning',
      task: 'Perform active security testing using attack payloads to identify exploitable vulnerabilities',
      context: args,
      instructions: [
        'Execute active scan on all discovered URLs within scope',
        'Test for SQL Injection (SQLi) vulnerabilities',
        'Test for Cross-Site Scripting (XSS) - reflected, stored, DOM-based',
        'Test for Cross-Site Request Forgery (CSRF) vulnerabilities',
        'Test for XML External Entity (XXE) injection',
        'Test for Server-Side Request Forgery (SSRF)',
        'Test for Remote Code Execution (RCE) vulnerabilities',
        'Test for Local/Remote File Inclusion (LFI/RFI)',
        'Test for insecure deserialization',
        'Test for path traversal vulnerabilities',
        'Test for command injection vulnerabilities',
        'Test for authentication bypass and broken access control',
        'Test for security misconfigurations',
        'Test for sensitive data exposure',
        'Categorize findings by OWASP Top 10 and severity',
        'Generate detailed vulnerability reports with PoC'
      ],
      outputFormat: 'JSON with vulnerabilitiesFound (number), criticalCount (number), highCount (number), mediumCount (number), lowCount (number), owaspCategories (object), scanProgress (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilitiesFound', 'criticalCount', 'highCount', 'mediumCount', 'lowCount', 'artifacts'],
      properties: {
        vulnerabilitiesFound: { type: 'number' },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        mediumCount: { type: 'number' },
        lowCount: { type: 'number' },
        informationalCount: { type: 'number' },
        owaspCategories: {
          type: 'object',
          properties: {
            injectionFlaws: { type: 'number' },
            brokenAuthentication: { type: 'number' },
            sensitiveDataExposure: { type: 'number' },
            xxe: { type: 'number' },
            brokenAccessControl: { type: 'number' },
            securityMisconfiguration: { type: 'number' },
            xss: { type: 'number' },
            insecureDeserialization: { type: 'number' },
            vulnerableComponents: { type: 'number' },
            insufficientLogging: { type: 'number' }
          }
        },
        scanProgress: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        topVulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              severity: { type: 'string' },
              url: { type: 'string' },
              category: { type: 'string' },
              cvss: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'active-scan', 'vulnerability-detection']
}));

// Task 7: API Security Testing
export const apiSecurityTestingTask = defineTask('api-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform API-specific security testing',
  agent: {
    name: 'api-security-tester',
    prompt: {
      role: 'API security specialist focusing on REST, GraphQL, and SOAP security',
      task: 'Execute comprehensive API security testing covering OWASP API Security Top 10',
      context: args,
      instructions: [
        'Identify all API endpoints (REST, GraphQL, SOAP)',
        'Test for Broken Object Level Authorization (BOLA/IDOR)',
        'Test for Broken User Authentication',
        'Test for Excessive Data Exposure',
        'Test for Lack of Resources & Rate Limiting',
        'Test for Broken Function Level Authorization',
        'Test for Mass Assignment vulnerabilities',
        'Test for Security Misconfiguration',
        'Test for Injection flaws in API parameters',
        'Test for Improper Assets Management',
        'Test for Insufficient Logging & Monitoring',
        'Test API versioning security',
        'Test authentication token handling (JWT, OAuth)',
        'Analyze API documentation for security issues',
        'Calculate OWASP API Top 10 coverage',
        'Generate API-specific vulnerability report'
      ],
      outputFormat: 'JSON with endpointsTested (number), apiVulnerabilitiesFound (number), apiTop10Coverage (number), authIssues (number), criticalCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointsTested', 'apiVulnerabilitiesFound', 'apiTop10Coverage', 'artifacts'],
      properties: {
        endpointsTested: { type: 'number' },
        apiVulnerabilitiesFound: { type: 'number' },
        apiTop10Coverage: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        authIssues: { type: 'number' },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        apiTypes: {
          type: 'object',
          properties: {
            rest: { type: 'number' },
            graphql: { type: 'number' },
            soap: { type: 'number' }
          }
        },
        owaspApiTop10: {
          type: 'object',
          properties: {
            brokenObjectLevelAuth: { type: 'number' },
            brokenUserAuth: { type: 'number' },
            excessiveDataExposure: { type: 'number' },
            lackOfResourcesRateLimiting: { type: 'number' },
            brokenFunctionLevelAuth: { type: 'number' },
            massAssignment: { type: 'number' },
            securityMisconfiguration: { type: 'number' },
            injection: { type: 'number' },
            improperAssetsManagement: { type: 'number' },
            insufficientLogging: { type: 'number' }
          }
        },
        topApiFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              vulnerability: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'api-security', 'owasp-api-top-10']
}));

// Task 8: Validate Vulnerabilities
export const validateVulnerabilitiesTask = defineTask('validate-vulnerabilities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate vulnerabilities and filter false positives',
  agent: {
    name: 'vulnerability-analyst',
    prompt: {
      role: 'senior security analyst specializing in vulnerability validation and triage',
      task: 'Validate scan findings, identify false positives, and prioritize confirmed vulnerabilities',
      context: args,
      instructions: [
        'Review all scan findings from passive, active, and API scans',
        'Manually verify high and critical severity findings',
        'Identify false positives using context analysis',
        'Test exploit proof-of-concepts for critical vulnerabilities',
        'Assess actual exploitability vs theoretical risk',
        'Consider application context and business logic',
        'Evaluate compensating controls that may reduce risk',
        'Assess environmental factors (WAF, network security)',
        'Calculate CVSS scores for confirmed vulnerabilities',
        'Prioritize vulnerabilities by business impact',
        'Categorize findings requiring manual review',
        'Calculate validation accuracy metrics',
        'Document validation methodology and decisions',
        'Generate validated vulnerability list with evidence'
      ],
      outputFormat: 'JSON with confirmedVulnerabilities (number), falsePositives (number), requiresManualReview (number), validationAccuracy (number), prioritizedFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedVulnerabilities', 'falsePositives', 'requiresManualReview', 'validationAccuracy', 'artifacts'],
      properties: {
        confirmedVulnerabilities: { type: 'number' },
        falsePositives: { type: 'number' },
        requiresManualReview: { type: 'number' },
        validationAccuracy: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        prioritizedFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string' },
              cvss: { type: 'number' },
              exploitability: { type: 'string' },
              businessImpact: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        severityBreakdown: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            informational: { type: 'number' }
          }
        },
        validationSummary: {
          type: 'object',
          properties: {
            totalFindings: { type: 'number' },
            validated: { type: 'number' },
            falsePositiveRate: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'validation', 'triage']
}));

// Task 9: Map Compliance
export const mapComplianceTask = defineTask('map-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map findings to compliance standards',
  agent: {
    name: 'compliance-mapper',
    prompt: {
      role: 'security compliance specialist with expertise in OWASP, PCI-DSS, and industry standards',
      task: 'Map validated vulnerabilities to compliance standards and assess compliance posture',
      context: args,
      instructions: [
        'Map findings to OWASP Top 10 categories',
        'Map findings to PCI-DSS requirements (if applicable)',
        'Map findings to CWE (Common Weakness Enumeration)',
        'Map findings to SANS Top 25',
        'Assess OWASP Top 10 coverage and scoring',
        'Evaluate PCI-DSS compliance status',
        'Calculate compliance gap analysis',
        'Identify compliance violations by severity',
        'Document required remediations for compliance',
        'Calculate overall security score (0-100)',
        'Generate compliance dashboard data',
        'Create compliance mapping matrix',
        'Document compliance status by standard',
        'Generate compliance assessment report'
      ],
      outputFormat: 'JSON with owaspScore (number), pciDssCompliant (boolean), cweMatches (number), standardsCovered (array), complianceStatus (object), overallSecurityScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['owaspScore', 'cweMatches', 'standardsCovered', 'overallSecurityScore', 'artifacts'],
      properties: {
        owaspScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'OWASP Top 10 compliance score'
        },
        pciDssCompliant: { type: 'boolean' },
        cweMatches: { type: 'number' },
        standardsCovered: { type: 'array', items: { type: 'string' } },
        complianceStatus: {
          type: 'object',
          properties: {
            owaspTop10: {
              type: 'object',
              properties: {
                covered: { type: 'number' },
                violations: { type: 'number' },
                score: { type: 'number' }
              }
            },
            pciDss: {
              type: 'object',
              properties: {
                requirementsMet: { type: 'number' },
                requirementsFailed: { type: 'number' },
                compliant: { type: 'boolean' }
              }
            },
            cweTop25: {
              type: 'object',
              properties: {
                weaknessesFound: { type: 'number' },
                coverage: { type: 'number' }
              }
            }
          }
        },
        overallSecurityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        complianceGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              status: { type: 'string' },
              findings: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'compliance', 'mapping']
}));

// Task 10: Generate Reports
export const generateReportsTask = defineTask('generate-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive security reports and remediation guidance',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'security reporting specialist and technical writer',
      task: 'Generate comprehensive DAST reports with executive summaries and detailed remediation guidance',
      context: args,
      instructions: [
        'Generate executive summary for leadership',
        'Create technical vulnerability report with all findings',
        'Include proof-of-concept exploits for critical issues',
        'Provide detailed remediation guidance for each vulnerability',
        'Include code examples and secure coding recommendations',
        'Map findings to OWASP references and resources',
        'Generate compliance report by standard',
        'Create prioritized remediation roadmap',
        'Include risk scoring and business impact analysis',
        'Generate metrics dashboard data',
        'Create vulnerability trend analysis if historical data available',
        'Export reports in requested formats (HTML, PDF, JSON, XML)',
        'Generate JIRA/GitHub issues templates for tracking',
        'Create developer-focused remediation guide',
        'Generate evidence package for audit purposes'
      ],
      outputFormat: 'JSON with formatsGenerated (array), executiveSummaryGenerated (boolean), remediationItems (number), reportLinks (array), executiveSummaryPath (string), topFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formatsGenerated', 'executiveSummaryGenerated', 'remediationItems', 'reportLinks', 'artifacts'],
      properties: {
        formatsGenerated: {
          type: 'array',
          items: { type: 'string' }
        },
        executiveSummaryGenerated: { type: 'boolean' },
        remediationItems: { type: 'number' },
        reportLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        executiveSummaryPath: { type: 'string' },
        topFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              severity: { type: 'string' },
              category: { type: 'string' },
              remediationEffort: { type: 'string' }
            }
          }
        },
        remediationRoadmap: {
          type: 'object',
          properties: {
            immediate: { type: 'number' },
            shortTerm: { type: 'number' },
            longTerm: { type: 'number' }
          }
        },
        dashboardData: {
          type: 'object',
          properties: {
            totalVulnerabilities: { type: 'number' },
            bySeverity: { type: 'object' },
            byCategory: { type: 'object' },
            complianceScores: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'reporting', 'remediation']
}));

// Task 11: Setup Continuous Scanning
export const setupContinuousScanningTask = defineTask('setup-continuous-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure continuous DAST scanning integration',
  agent: {
    name: 'continuous-security-engineer',
    prompt: {
      role: 'DevSecOps engineer specializing in security automation and CI/CD integration',
      task: 'Set up continuous DAST scanning integrated with CI/CD pipeline and monitoring',
      context: args,
      instructions: [
        'Design continuous scanning schedule (daily, weekly, on-deploy)',
        'Integrate DAST tool with CI/CD pipeline (Jenkins, GitLab CI, GitHub Actions)',
        'Configure scan triggers (git push, PR creation, scheduled)',
        'Set up incremental scanning for faster feedback',
        'Configure quality gates and break-build criteria',
        'Integrate findings with issue tracking (JIRA, GitHub Issues)',
        'Set up automated notifications (Slack, email, PagerDuty)',
        'Configure scan result storage and trending',
        'Set up automated remediation suggestions',
        'Configure scan baseline and regression detection',
        'Implement false positive feedback loop',
        'Set up security metrics dashboards',
        'Document continuous scanning procedures',
        'Generate CI/CD integration guide'
      ],
      outputFormat: 'JSON with scanSchedule (string), cicdIntegrated (boolean), automatedRemediation (boolean), qualityGates (array), notificationsConfigured (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scanSchedule', 'cicdIntegrated', 'artifacts'],
      properties: {
        scanSchedule: { type: 'string' },
        cicdIntegrated: { type: 'boolean' },
        automatedRemediation: { type: 'boolean' },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              threshold: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        notificationsConfigured: {
          type: 'array',
          items: { type: 'string' }
        },
        integrations: {
          type: 'object',
          properties: {
            cicdPlatform: { type: 'string' },
            issueTracker: { type: 'string' },
            notificationChannels: { type: 'array', items: { type: 'string' } }
          }
        },
        scanOptimizations: {
          type: 'object',
          properties: {
            incrementalScanning: { type: 'boolean' },
            parallelExecution: { type: 'boolean' },
            smartThrottling: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dast', 'continuous-scanning', 'devsecops']
}));

// Quality gates for DAST process
export const qualityGates = {
  criticalVulnerabilities: {
    description: 'No critical severity vulnerabilities should be present',
    threshold: 0,
    metric: 'criticalIssues'
  },
  securityScore: {
    description: 'Minimum security score threshold',
    threshold: 70,
    metric: 'securityScore'
  },
  owaspTop10Coverage: {
    description: 'Percentage coverage of OWASP Top 10 testing',
    threshold: 90,
    metric: 'owaspCoverage'
  },
  falsePositiveRate: {
    description: 'Maximum acceptable false positive rate',
    threshold: 20,
    metric: 'falsePositivePercentage'
  },
  authenticationTested: {
    description: 'Authenticated scanning must be completed successfully',
    threshold: 100,
    metric: 'authTestingComplete'
  }
};

// Estimated duration
export const estimatedDuration = {
  environmentAssessment: '1-2 hours',
  toolSetup: '2-4 hours',
  scopeDefinition: '1-2 hours',
  authSetup: '2-3 hours',
  passiveScanning: '2-4 hours',
  activeScanning: '4-8 hours',
  apiTesting: '2-4 hours',
  validation: '4-6 hours',
  complianceMapping: '2-3 hours',
  reporting: '2-4 hours',
  continuousSetup: '4-6 hours',
  total: '2-4 days (depending on application complexity)'
};
