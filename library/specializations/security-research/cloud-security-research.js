/**
 * @process specializations/security-research/cloud-security-research
 * @description Security research for cloud infrastructure and services covering AWS, Azure, GCP
 * misconfigurations, IAM analysis, serverless security, and container security using cloud-native
 * security tools and frameworks.
 * @inputs { projectName: string, cloudProvider: string, targetScope: object }
 * @outputs { success: boolean, vulnerabilities: array, cloudSecurityReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/cloud-security-research', {
 *   projectName: 'AWS Infrastructure Security',
 *   cloudProvider: 'aws',
 *   targetScope: { accountId: '123456789012', regions: ['us-east-1', 'us-west-2'] }
 * });
 *
 * @references
 * - AWS Security Best Practices: https://aws.amazon.com/security/
 * - Prowler: https://github.com/prowler-cloud/prowler
 * - ScoutSuite: https://github.com/nccgroup/ScoutSuite
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cloudProvider,
    targetScope,
    assessmentType = 'comprehensive',
    outputDir = 'cloud-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Cloud Security Research for ${projectName}`);
  ctx.log('info', `Provider: ${cloudProvider}`);

  // ============================================================================
  // PHASE 1: CLOUD ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Enumerating cloud resources');

  const enumeration = await ctx.task(cloudEnumerationTask, {
    projectName,
    cloudProvider,
    targetScope,
    outputDir
  });

  artifacts.push(...enumeration.artifacts);

  // ============================================================================
  // PHASE 2: IAM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing IAM policies and permissions');

  const iamAnalysis = await ctx.task(iamAnalysisTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...iamAnalysis.vulnerabilities);
  artifacts.push(...iamAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: STORAGE SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing storage security (S3/Blob/GCS)');

  const storageSecurity = await ctx.task(storageSecurityTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...storageSecurity.vulnerabilities);
  artifacts.push(...storageSecurity.artifacts);

  // ============================================================================
  // PHASE 4: NETWORK SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing network security configurations');

  const networkSecurity = await ctx.task(cloudNetworkSecurityTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...networkSecurity.vulnerabilities);
  artifacts.push(...networkSecurity.artifacts);

  // ============================================================================
  // PHASE 5: COMPUTE SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing compute instance security');

  const computeSecurity = await ctx.task(computeSecurityTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...computeSecurity.vulnerabilities);
  artifacts.push(...computeSecurity.artifacts);

  // ============================================================================
  // PHASE 6: CONTAINER/SERVERLESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing container and serverless security');

  const containerServerless = await ctx.task(containerServerlessTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...containerServerless.vulnerabilities);
  artifacts.push(...containerServerless.artifacts);

  // ============================================================================
  // PHASE 7: LOGGING AND MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing logging and monitoring');

  const loggingMonitoring = await ctx.task(loggingMonitoringTask, {
    projectName,
    cloudProvider,
    enumeration,
    outputDir
  });

  vulnerabilities.push(...loggingMonitoring.vulnerabilities);
  artifacts.push(...loggingMonitoring.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating cloud security report');

  const report = await ctx.task(cloudSecurityReportTask, {
    projectName,
    cloudProvider,
    vulnerabilities,
    enumeration,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Cloud security research complete for ${projectName}. Found ${vulnerabilities.length} misconfigurations/vulnerabilities. Review findings?`,
    title: 'Cloud Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        cloudProvider,
        resourcesScanned: enumeration.totalResources,
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
    cloudSecurityReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/cloud-security-research',
      timestamp: startTime,
      cloudProvider,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cloudEnumerationTask = defineTask('cloud-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Enumerate Cloud Resources - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Cloud Security Researcher',
      task: 'Enumerate cloud resources',
      context: args,
      instructions: [
        '1. List all compute resources',
        '2. List storage resources',
        '3. List network resources',
        '4. List IAM entities',
        '5. List databases',
        '6. List serverless functions',
        '7. List container resources',
        '8. Document resource inventory'
      ],
      outputFormat: 'JSON with enumeration'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'totalResources', 'artifacts'],
      properties: {
        resources: { type: 'object' },
        totalResources: { type: 'number' },
        regions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'enumeration']
}));

export const iamAnalysisTask = defineTask('iam-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `IAM Analysis - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'IAM Security Analyst',
      task: 'Analyze IAM policies and permissions',
      context: args,
      instructions: [
        '1. Analyze IAM policies',
        '2. Check for overprivileged roles',
        '3. Find unused credentials',
        '4. Check MFA enforcement',
        '5. Analyze cross-account access',
        '6. Check for privilege escalation paths',
        '7. Analyze service accounts',
        '8. Document findings'
      ],
      outputFormat: 'JSON with IAM findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        overprivileged: { type: 'array' },
        unusedCredentials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'iam']
}));

export const storageSecurityTask = defineTask('storage-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Storage Security - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Cloud Storage Security Analyst',
      task: 'Analyze storage security',
      context: args,
      instructions: [
        '1. Check for public buckets',
        '2. Analyze bucket policies',
        '3. Check encryption settings',
        '4. Review access logs',
        '5. Check versioning',
        '6. Analyze cross-origin settings',
        '7. Check for sensitive data',
        '8. Document findings'
      ],
      outputFormat: 'JSON with storage findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        publicBuckets: { type: 'array' },
        unencrypted: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'storage']
}));

export const cloudNetworkSecurityTask = defineTask('cloud-network-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Security - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Cloud Network Security Analyst',
      task: 'Analyze network security configurations',
      context: args,
      instructions: [
        '1. Analyze security groups',
        '2. Check for open ports',
        '3. Review NACLs',
        '4. Analyze VPC configurations',
        '5. Check peering connections',
        '6. Review load balancers',
        '7. Check DNS configurations',
        '8. Document findings'
      ],
      outputFormat: 'JSON with network findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        openPorts: { type: 'array' },
        exposedServices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'network']
}));

export const computeSecurityTask = defineTask('compute-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compute Security - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Cloud Compute Security Analyst',
      task: 'Analyze compute instance security',
      context: args,
      instructions: [
        '1. Check instance metadata',
        '2. Analyze instance profiles',
        '3. Check for public IPs',
        '4. Review AMI/image security',
        '5. Check patching status',
        '6. Analyze user data scripts',
        '7. Check EBS encryption',
        '8. Document findings'
      ],
      outputFormat: 'JSON with compute findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        publicInstances: { type: 'array' },
        unpatched: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'compute']
}));

export const containerServerlessTask = defineTask('container-serverless', (args, taskCtx) => ({
  kind: 'agent',
  title: `Container/Serverless Security - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Container and Serverless Security Analyst',
      task: 'Analyze container and serverless security',
      context: args,
      instructions: [
        '1. Analyze container images',
        '2. Check ECS/EKS/AKS configs',
        '3. Review Lambda/Functions permissions',
        '4. Check for vulnerable images',
        '5. Analyze network policies',
        '6. Review secrets management',
        '7. Check runtime security',
        '8. Document findings'
      ],
      outputFormat: 'JSON with container/serverless findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        vulnerableImages: { type: 'array' },
        overprivilegedFunctions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'container']
}));

export const loggingMonitoringTask = defineTask('logging-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Logging & Monitoring - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Cloud Logging and Monitoring Analyst',
      task: 'Analyze logging and monitoring',
      context: args,
      instructions: [
        '1. Check CloudTrail/Activity Log',
        '2. Verify log retention',
        '3. Check log encryption',
        '4. Review alerting configs',
        '5. Check for log gaps',
        '6. Verify compliance logging',
        '7. Check access to logs',
        '8. Document findings'
      ],
      outputFormat: 'JSON with logging findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        loggingGaps: { type: 'array' },
        alertingIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'logging']
}));

export const cloudSecurityReportTask = defineTask('cloud-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Cloud Security Report Specialist',
      task: 'Generate cloud security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to CIS benchmarks',
        '3. Include remediation steps',
        '4. Create executive summary',
        '5. Include compliance mapping',
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
        byService: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'cloud', 'reporting']
}));
