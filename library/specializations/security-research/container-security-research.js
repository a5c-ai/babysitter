/**
 * @process specializations/security-research/container-security-research
 * @description Security research for containerized environments including Docker and Kubernetes.
 * Covers image security, runtime security, orchestration misconfigurations, and supply chain
 * security using Trivy, Falco, and kube-bench.
 * @inputs { projectName: string, targetScope: object, containerRuntime?: string }
 * @outputs { success: boolean, vulnerabilities: array, containerReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/container-security-research', {
 *   projectName: 'K8s Cluster Security',
 *   targetScope: { clusterName: 'production', namespaces: ['default', 'app'] },
 *   containerRuntime: 'containerd'
 * });
 *
 * @references
 * - CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker
 * - CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes
 * - Trivy: https://aquasecurity.github.io/trivy/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetScope,
    containerRuntime = 'docker',
    assessmentType = 'comprehensive',
    outputDir = 'container-research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Container Security Research for ${projectName}`);
  ctx.log('info', `Runtime: ${containerRuntime}`);

  // ============================================================================
  // PHASE 1: IMAGE SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Scanning container images');

  const imageScanning = await ctx.task(imageScanningTask, {
    projectName,
    targetScope,
    outputDir
  });

  vulnerabilities.push(...imageScanning.vulnerabilities);
  artifacts.push(...imageScanning.artifacts);

  // ============================================================================
  // PHASE 2: KUBERNETES CONFIG
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Kubernetes configurations');

  const k8sConfig = await ctx.task(k8sConfigAnalysisTask, {
    projectName,
    targetScope,
    outputDir
  });

  vulnerabilities.push(...k8sConfig.vulnerabilities);
  artifacts.push(...k8sConfig.artifacts);

  // ============================================================================
  // PHASE 3: RUNTIME SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing runtime security');

  const runtimeSecurity = await ctx.task(runtimeSecurityTask, {
    projectName,
    targetScope,
    containerRuntime,
    outputDir
  });

  vulnerabilities.push(...runtimeSecurity.vulnerabilities);
  artifacts.push(...runtimeSecurity.artifacts);

  // ============================================================================
  // PHASE 4: NETWORK POLICIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing network policies');

  const networkPolicies = await ctx.task(networkPoliciesTask, {
    projectName,
    targetScope,
    outputDir
  });

  vulnerabilities.push(...networkPolicies.vulnerabilities);
  artifacts.push(...networkPolicies.artifacts);

  // ============================================================================
  // PHASE 5: SECRETS MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing secrets management');

  const secretsManagement = await ctx.task(secretsManagementTask, {
    projectName,
    targetScope,
    outputDir
  });

  vulnerabilities.push(...secretsManagement.vulnerabilities);
  artifacts.push(...secretsManagement.artifacts);

  // ============================================================================
  // PHASE 6: RBAC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing RBAC configurations');

  const rbacAnalysis = await ctx.task(rbacAnalysisTask, {
    projectName,
    targetScope,
    outputDir
  });

  vulnerabilities.push(...rbacAnalysis.vulnerabilities);
  artifacts.push(...rbacAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating container security report');

  const report = await ctx.task(containerSecurityReportTask, {
    projectName,
    vulnerabilities,
    imageScanning,
    k8sConfig,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Container security research complete for ${projectName}. Found ${vulnerabilities.length} issues. Review findings?`,
    title: 'Container Security Research Complete',
    context: {
      runId: ctx.runId,
      summary: {
        imagesScanned: imageScanning.imagesScanned,
        vulnerableImages: imageScanning.vulnerableImages,
        k8sIssues: k8sConfig.totalIssues,
        totalVulnerabilities: vulnerabilities.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    containerReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/container-security-research',
      timestamp: startTime,
      containerRuntime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const imageScanningTask = defineTask('image-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Images - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Container Image Security Analyst',
      task: 'Scan container images',
      context: args,
      instructions: [
        '1. Scan images with Trivy',
        '2. Check for CVEs',
        '3. Analyze base images',
        '4. Check for secrets in images',
        '5. Analyze Dockerfile security',
        '6. Check image provenance',
        '7. Verify image signatures',
        '8. Document findings'
      ],
      outputFormat: 'JSON with image scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'imagesScanned', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        imagesScanned: { type: 'number' },
        vulnerableImages: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'image-scanning']
}));

export const k8sConfigAnalysisTask = defineTask('k8s-config-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `K8s Config Analysis - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Kubernetes Security Analyst',
      task: 'Analyze Kubernetes configurations',
      context: args,
      instructions: [
        '1. Run kube-bench',
        '2. Check pod security policies',
        '3. Analyze security contexts',
        '4. Check for privileged containers',
        '5. Analyze resource limits',
        '6. Check admission controllers',
        '7. Review API server config',
        '8. Document findings'
      ],
      outputFormat: 'JSON with K8s config findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'totalIssues', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        totalIssues: { type: 'number' },
        benchmarkResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'kubernetes']
}));

export const runtimeSecurityTask = defineTask('runtime-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Runtime Security - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Container Runtime Security Analyst',
      task: 'Analyze runtime security',
      context: args,
      instructions: [
        '1. Check runtime configuration',
        '2. Analyze process execution',
        '3. Check for container escapes',
        '4. Analyze syscall restrictions',
        '5. Check seccomp profiles',
        '6. Analyze AppArmor/SELinux',
        '7. Monitor runtime behavior',
        '8. Document findings'
      ],
      outputFormat: 'JSON with runtime findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        runtimeIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'runtime']
}));

export const networkPoliciesTask = defineTask('network-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Policies - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Container Network Security Analyst',
      task: 'Analyze network policies',
      context: args,
      instructions: [
        '1. Analyze network policies',
        '2. Check default deny',
        '3. Map pod communications',
        '4. Check service mesh config',
        '5. Analyze ingress/egress',
        '6. Check for network isolation',
        '7. Review CNI configuration',
        '8. Document findings'
      ],
      outputFormat: 'JSON with network findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        networkPolicies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'network']
}));

export const secretsManagementTask = defineTask('secrets-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secrets Management - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Container Secrets Analyst',
      task: 'Analyze secrets management',
      context: args,
      instructions: [
        '1. Analyze K8s secrets',
        '2. Check secret encryption',
        '3. Find hardcoded secrets',
        '4. Check env var secrets',
        '5. Analyze vault integration',
        '6. Check secret rotation',
        '7. Review access to secrets',
        '8. Document findings'
      ],
      outputFormat: 'JSON with secrets findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        secretsFound: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'secrets']
}));

export const rbacAnalysisTask = defineTask('rbac-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `RBAC Analysis - ${args.projectName}`,
  agent: {
    name: 'cloud-security-researcher',
    prompt: {
      role: 'Kubernetes RBAC Analyst',
      task: 'Analyze RBAC configurations',
      context: args,
      instructions: [
        '1. Analyze ClusterRoles',
        '2. Analyze RoleBindings',
        '3. Check for overprivileged SAs',
        '4. Find privilege escalation paths',
        '5. Check default accounts',
        '6. Analyze impersonation',
        '7. Review audit logs',
        '8. Document findings'
      ],
      outputFormat: 'JSON with RBAC findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        overprivilegedAccounts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'container', 'rbac']
}));

export const containerSecurityReportTask = defineTask('container-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Container Security Report Specialist',
      task: 'Generate container security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to CIS benchmarks',
        '3. Include remediation',
        '4. Create executive summary',
        '5. Include image scan results',
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
  labels: ['agent', 'security-research', 'container', 'reporting']
}));
