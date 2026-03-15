/**
 * @process specializations/security-research/mobile-app-security-research
 * @description Security research for Android and iOS applications including static analysis, dynamic
 * analysis, network traffic analysis, and platform-specific vulnerabilities using Frida, objection,
 * and mobile security testing frameworks.
 * @inputs { projectName: string, appPath: string, platform: string }
 * @outputs { success: boolean, vulnerabilities: array, mobileSecurityReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/mobile-app-security-research', {
 *   projectName: 'Banking App Security',
 *   appPath: '/path/to/app.apk',
 *   platform: 'android'
 * });
 *
 * @references
 * - OWASP MASTG: https://mas.owasp.org/MASTG/
 * - Frida: https://frida.re/
 * - objection: https://github.com/sensepost/objection
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    appPath,
    platform,
    testingLevel = 'comprehensive',
    outputDir = 'mobile-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Mobile App Security Research for ${projectName}`);
  ctx.log('info', `App: ${appPath}, Platform: ${platform}`);

  // ============================================================================
  // PHASE 1: APP EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Extracting and analyzing app package');

  const appExtraction = await ctx.task(appExtractionTask, {
    projectName,
    appPath,
    platform,
    outputDir
  });

  artifacts.push(...appExtraction.artifacts);

  // ============================================================================
  // PHASE 2: STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing static analysis');

  const staticAnalysis = await ctx.task(mobileStaticAnalysisTask, {
    projectName,
    appExtraction,
    platform,
    outputDir
  });

  vulnerabilities.push(...staticAnalysis.vulnerabilities);
  artifacts.push(...staticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DYNAMIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing dynamic analysis with instrumentation');

  const dynamicAnalysis = await ctx.task(mobileDynamicAnalysisTask, {
    projectName,
    appPath,
    platform,
    outputDir
  });

  vulnerabilities.push(...dynamicAnalysis.vulnerabilities);
  artifacts.push(...dynamicAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: NETWORK TRAFFIC
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing network traffic');

  const networkAnalysis = await ctx.task(mobileNetworkAnalysisTask, {
    projectName,
    platform,
    dynamicAnalysis,
    outputDir
  });

  vulnerabilities.push(...networkAnalysis.vulnerabilities);
  artifacts.push(...networkAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: DATA STORAGE
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing data storage security');

  const dataStorage = await ctx.task(dataStorageAnalysisTask, {
    projectName,
    platform,
    appExtraction,
    outputDir
  });

  vulnerabilities.push(...dataStorage.vulnerabilities);
  artifacts.push(...dataStorage.artifacts);

  // ============================================================================
  // PHASE 6: AUTHENTICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing authentication and authorization');

  const authTesting = await ctx.task(mobileAuthTestingTask, {
    projectName,
    platform,
    dynamicAnalysis,
    outputDir
  });

  vulnerabilities.push(...authTesting.vulnerabilities);
  artifacts.push(...authTesting.artifacts);

  // ============================================================================
  // PHASE 7: PLATFORM SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing platform-specific security');

  const platformSecurity = await ctx.task(platformSecurityTask, {
    projectName,
    platform,
    appExtraction,
    staticAnalysis,
    outputDir
  });

  vulnerabilities.push(...platformSecurity.vulnerabilities);
  artifacts.push(...platformSecurity.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating mobile security report');

  const report = await ctx.task(mobileSecurityReportTask, {
    projectName,
    platform,
    vulnerabilities,
    appExtraction,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Mobile app research complete for ${projectName}. Found ${vulnerabilities.length} vulnerabilities. Review findings?`,
    title: 'Mobile Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        platform,
        appName: appExtraction.appName,
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
    mobileSecurityReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/mobile-app-security-research',
      timestamp: startTime,
      platform,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const appExtractionTask = defineTask('app-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract App - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile App Analyst',
      task: 'Extract and analyze app package',
      context: args,
      instructions: [
        '1. Extract APK/IPA contents',
        '2. Identify app metadata',
        '3. Extract manifest/info.plist',
        '4. Identify libraries and frameworks',
        '5. Extract resources',
        '6. Identify native code',
        '7. Check signing info',
        '8. Document app structure'
      ],
      outputFormat: 'JSON with extraction'
    },
    outputSchema: {
      type: 'object',
      required: ['appName', 'extractedPath', 'artifacts'],
      properties: {
        appName: { type: 'string' },
        extractedPath: { type: 'string' },
        manifest: { type: 'object' },
        libraries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'extraction']
}));

export const mobileStaticAnalysisTask = defineTask('mobile-static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Static Analysis - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile Static Analysis Specialist',
      task: 'Perform static analysis',
      context: args,
      instructions: [
        '1. Decompile app code',
        '2. Search for hardcoded secrets',
        '3. Analyze permissions',
        '4. Check for insecure code patterns',
        '5. Analyze cryptography usage',
        '6. Check for debugging code',
        '7. Analyze third-party libraries',
        '8. Document findings'
      ],
      outputFormat: 'JSON with static analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        hardcodedSecrets: { type: 'array' },
        permissions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'static']
}));

export const mobileDynamicAnalysisTask = defineTask('mobile-dynamic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Analysis - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile Dynamic Analysis Specialist',
      task: 'Perform dynamic analysis with instrumentation',
      context: args,
      instructions: [
        '1. Set up instrumentation (Frida)',
        '2. Bypass root/jailbreak detection',
        '3. Bypass SSL pinning',
        '4. Hook security functions',
        '5. Monitor API calls',
        '6. Trace method execution',
        '7. Monitor file operations',
        '8. Document findings'
      ],
      outputFormat: 'JSON with dynamic analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        hookedFunctions: { type: 'array' },
        bypassedChecks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'dynamic']
}));

export const mobileNetworkAnalysisTask = defineTask('mobile-network-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Analysis - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile Network Analyst',
      task: 'Analyze network traffic',
      context: args,
      instructions: [
        '1. Capture app traffic',
        '2. Analyze HTTPS implementation',
        '3. Check certificate validation',
        '4. Identify API endpoints',
        '5. Check for sensitive data in transit',
        '6. Analyze authentication tokens',
        '7. Check for cleartext traffic',
        '8. Document findings'
      ],
      outputFormat: 'JSON with network analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        endpoints: { type: 'array' },
        cleartextTraffic: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'network']
}));

export const dataStorageAnalysisTask = defineTask('data-storage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Storage Analysis - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile Data Storage Analyst',
      task: 'Analyze data storage security',
      context: args,
      instructions: [
        '1. Check local storage',
        '2. Analyze SharedPreferences/NSUserDefaults',
        '3. Check database encryption',
        '4. Review keychain/keystore usage',
        '5. Check for sensitive data in logs',
        '6. Analyze backup security',
        '7. Check cache directories',
        '8. Document findings'
      ],
      outputFormat: 'JSON with data storage analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        storageLocations: { type: 'array' },
        sensitiveDataFound: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'data-storage']
}));

export const mobileAuthTestingTask = defineTask('mobile-auth-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auth Testing - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Mobile Authentication Tester',
      task: 'Test authentication and authorization',
      context: args,
      instructions: [
        '1. Test local authentication',
        '2. Test biometric bypass',
        '3. Analyze session handling',
        '4. Test token storage',
        '5. Check authorization controls',
        '6. Test logout functionality',
        '7. Check for auth bypass',
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
  labels: ['agent', 'security-research', 'mobile', 'authentication']
}));

export const platformSecurityTask = defineTask('platform-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Security - ${args.projectName}`,
  agent: {
    name: 'mobile-researcher',
    prompt: {
      role: 'Platform Security Analyst',
      task: 'Test platform-specific security',
      context: args,
      instructions: [
        '1. Check IPC security (Android)',
        '2. Test deep link handling',
        '3. Check webview security',
        '4. Test clipboard security',
        '5. Check for code injection',
        '6. Test runtime integrity',
        '7. Check for tapjacking',
        '8. Document findings'
      ],
      outputFormat: 'JSON with platform security findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        platformIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'platform']
}));

export const mobileSecurityReportTask = defineTask('mobile-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Mobile Security Report Specialist',
      task: 'Generate mobile security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to OWASP MASTG',
        '3. Include reproduction steps',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Include screenshots',
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
        byMasvs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'mobile', 'reporting']
}));
