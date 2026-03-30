/**
 * @process specializations/security-research/network-penetration-testing
 * @description Authorized security assessment of network infrastructure including reconnaissance,
 * vulnerability identification, exploitation, and post-exploitation activities. Follows PTES
 * methodology for comprehensive network security testing.
 * @inputs { projectName: string, scope: object, engagementType: string }
 * @outputs { success: boolean, findings: array, accessAchieved: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/network-penetration-testing', {
 *   projectName: 'Corporate Network Assessment',
 *   scope: { networks: ['10.0.0.0/24'], excludes: ['10.0.0.1'] },
 *   engagementType: 'internal'
 * });
 *
 * @references
 * - PTES: https://www.pentest-standard.org/
 * - Nmap: https://nmap.org/
 * - Metasploit: https://www.metasploit.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    scope,
    engagementType,
    credentials = [],
    outputDir = 'network-pentest-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const findings = [];
  const accessAchieved = [];

  ctx.log('info', `Starting Network Penetration Test for ${projectName}`);
  ctx.log('info', `Engagement Type: ${engagementType}`);

  // ============================================================================
  // PHASE 1: PRE-ENGAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Pre-engagement activities');

  const preEngagement = await ctx.task(preEngagementTask, {
    projectName,
    scope,
    engagementType,
    outputDir
  });

  artifacts.push(...preEngagement.artifacts);

  // ============================================================================
  // PHASE 2: RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 2: Network reconnaissance');

  const recon = await ctx.task(networkReconTask, {
    projectName,
    scope,
    preEngagement,
    outputDir
  });

  artifacts.push(...recon.artifacts);

  // ============================================================================
  // PHASE 3: SCANNING AND ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Scanning and enumeration');

  const scanning = await ctx.task(scanningEnumerationTask, {
    projectName,
    scope,
    recon,
    outputDir
  });

  artifacts.push(...scanning.artifacts);

  // ============================================================================
  // PHASE 4: VULNERABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Vulnerability analysis');

  const vulnAnalysis = await ctx.task(vulnAnalysisTask, {
    projectName,
    scanning,
    outputDir
  });

  findings.push(...vulnAnalysis.vulnerabilities);
  artifacts.push(...vulnAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: EXPLOITATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Exploitation');

  const exploitation = await ctx.task(exploitationTask, {
    projectName,
    vulnAnalysis,
    credentials,
    outputDir
  });

  accessAchieved.push(...exploitation.accessAchieved);
  artifacts.push(...exploitation.artifacts);

  // ============================================================================
  // PHASE 6: POST-EXPLOITATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Post-exploitation');

  const postExploit = await ctx.task(postExploitationTask, {
    projectName,
    exploitation,
    outputDir
  });

  accessAchieved.push(...postExploit.additionalAccess);
  findings.push(...postExploit.additionalFindings);
  artifacts.push(...postExploit.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating penetration test report');

  const report = await ctx.task(pentestReportTask, {
    projectName,
    scope,
    findings,
    accessAchieved,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Network penetration test complete. ${findings.length} vulnerabilities found, ${accessAchieved.length} systems compromised. Review findings?`,
    title: 'Network Pentest Complete',
    context: {
      runId: ctx.runId,
      summary: {
        engagementType,
        hostsScanned: scanning.hostsScanned,
        vulnerabilities: findings.length,
        systemsCompromised: accessAchieved.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    findings,
    accessAchieved,
    recommendations: report.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/network-penetration-testing',
      timestamp: startTime,
      engagementType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const preEngagementTask = defineTask('pre-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Engagement - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Penetration Test Coordinator',
      task: 'Prepare for penetration test engagement',
      context: args,
      instructions: [
        '1. Review scope and rules of engagement',
        '2. Validate authorization documents',
        '3. Establish communication channels',
        '4. Set up testing infrastructure',
        '5. Configure VPN/access',
        '6. Prepare testing tools',
        '7. Create initial documentation',
        '8. Confirm emergency contacts'
      ],
      outputFormat: 'JSON with pre-engagement preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['authorized', 'toolsReady', 'artifacts'],
      properties: {
        authorized: { type: 'boolean' },
        toolsReady: { type: 'boolean' },
        scope: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'pre-engagement']
}));

export const networkReconTask = defineTask('network-recon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Reconnaissance - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Network Reconnaissance Specialist',
      task: 'Perform network reconnaissance',
      context: args,
      instructions: [
        '1. Gather OSINT on target organization',
        '2. Identify network ranges',
        '3. DNS enumeration',
        '4. Identify public services',
        '5. Research employee information',
        '6. Identify technologies used',
        '7. Map external attack surface',
        '8. Document findings'
      ],
      outputFormat: 'JSON with reconnaissance results'
    },
    outputSchema: {
      type: 'object',
      required: ['networks', 'domains', 'artifacts'],
      properties: {
        networks: { type: 'array' },
        domains: { type: 'array' },
        services: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'recon']
}));

export const scanningEnumerationTask = defineTask('scanning-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scanning and Enumeration - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Network Scanner Specialist',
      task: 'Scan and enumerate network',
      context: args,
      instructions: [
        '1. Host discovery (ping sweeps)',
        '2. Port scanning (TCP/UDP)',
        '3. Service version detection',
        '4. OS fingerprinting',
        '5. Script scanning for details',
        '6. SMB enumeration',
        '7. SNMP enumeration',
        '8. Document all findings'
      ],
      outputFormat: 'JSON with scanning results'
    },
    outputSchema: {
      type: 'object',
      required: ['hostsScanned', 'openPorts', 'artifacts'],
      properties: {
        hostsScanned: { type: 'number' },
        liveHosts: { type: 'array' },
        openPorts: { type: 'array' },
        services: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'scanning']
}));

export const vulnAnalysisTask = defineTask('vuln-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vulnerability Analysis - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Vulnerability Analyst',
      task: 'Analyze network vulnerabilities',
      context: args,
      instructions: [
        '1. Run vulnerability scanners',
        '2. Analyze scan results',
        '3. Research vulnerabilities',
        '4. Verify findings manually',
        '5. Assess exploitability',
        '6. Prioritize by risk',
        '7. Identify attack paths',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with vulnerability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'riskRatings', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        riskRatings: { type: 'object' },
        attackPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'vulnerability']
}));

export const exploitationTask = defineTask('exploitation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Exploitation - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Penetration Test Exploit Specialist',
      task: 'Attempt exploitation of vulnerabilities',
      context: args,
      instructions: [
        '1. Prioritize exploitation targets',
        '2. Select appropriate exploits',
        '3. Configure exploitation tools',
        '4. Attempt exploitation',
        '5. Document successful access',
        '6. Capture evidence',
        '7. Maintain operational security',
        '8. Document all attempts'
      ],
      outputFormat: 'JSON with exploitation results'
    },
    outputSchema: {
      type: 'object',
      required: ['accessAchieved', 'exploitsUsed', 'artifacts'],
      properties: {
        accessAchieved: { type: 'array' },
        exploitsUsed: { type: 'array' },
        failedAttempts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'exploitation']
}));

export const postExploitationTask = defineTask('post-exploitation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Exploitation - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Post-Exploitation Specialist',
      task: 'Perform post-exploitation activities',
      context: args,
      instructions: [
        '1. Gather system information',
        '2. Escalate privileges',
        '3. Dump credentials',
        '4. Identify lateral movement paths',
        '5. Access additional systems',
        '6. Search for sensitive data',
        '7. Maintain access (if authorized)',
        '8. Document all activities'
      ],
      outputFormat: 'JSON with post-exploitation results'
    },
    outputSchema: {
      type: 'object',
      required: ['additionalAccess', 'additionalFindings', 'artifacts'],
      properties: {
        additionalAccess: { type: 'array' },
        additionalFindings: { type: 'array' },
        credentialsDumped: { type: 'array' },
        sensitiveData: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'post-exploitation']
}));

export const pentestReportTask = defineTask('pentest-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Penetration Test Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Penetration Test Report Specialist',
      task: 'Generate penetration test report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document methodology',
        '3. Detail all findings with evidence',
        '4. Include risk ratings',
        '5. Provide remediation recommendations',
        '6. Create technical appendices',
        '7. Include timeline of activities',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        recommendations: { type: 'array' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'network-pentest', 'reporting']
}));
