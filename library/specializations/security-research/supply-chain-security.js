/**
 * @process specializations/security-research/supply-chain-security
 * @description Analysis of software supply chain security including dependency analysis, build system
 * security, artifact integrity verification, and third-party component risk assessment using
 * SBOM generation and vulnerability databases.
 * @inputs { projectName: string, projectPath: string, ecosystems?: array }
 * @outputs { success: boolean, vulnerabilities: array, sbom: object, supplyChainReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/supply-chain-security', {
 *   projectName: 'NPM Supply Chain Analysis',
 *   projectPath: '/path/to/project',
 *   ecosystems: ['npm', 'docker']
 * });
 *
 * @references
 * - SLSA: https://slsa.dev/
 * - Sigstore: https://www.sigstore.dev/
 * - SBOM: https://www.cisa.gov/sbom
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectPath,
    ecosystems = ['npm', 'pypi', 'maven'],
    analysisDepth = 'comprehensive',
    outputDir = 'supply-chain-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Supply Chain Security Analysis for ${projectName}`);
  ctx.log('info', `Ecosystems: ${ecosystems.join(', ')}`);

  // ============================================================================
  // PHASE 1: DEPENDENCY ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Enumerating all dependencies');

  const dependencyEnum = await ctx.task(dependencyEnumerationTask, {
    projectName,
    projectPath,
    ecosystems,
    outputDir
  });

  artifacts.push(...dependencyEnum.artifacts);

  // ============================================================================
  // PHASE 2: SBOM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating Software Bill of Materials');

  const sbomGeneration = await ctx.task(sbomGenerationTask, {
    projectName,
    projectPath,
    dependencyEnum,
    outputDir
  });

  artifacts.push(...sbomGeneration.artifacts);

  // ============================================================================
  // PHASE 3: VULNERABILITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Scanning dependencies for vulnerabilities');

  const vulnScanning = await ctx.task(dependencyVulnScanningTask, {
    projectName,
    dependencyEnum,
    sbomGeneration,
    outputDir
  });

  vulnerabilities.push(...vulnScanning.vulnerabilities);
  artifacts.push(...vulnScanning.artifacts);

  // ============================================================================
  // PHASE 4: LICENSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing dependency licenses');

  const licenseAnalysis = await ctx.task(licenseAnalysisTask, {
    projectName,
    dependencyEnum,
    outputDir
  });

  artifacts.push(...licenseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: BUILD SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing build system security');

  const buildSecurity = await ctx.task(buildSecurityTask, {
    projectName,
    projectPath,
    outputDir
  });

  vulnerabilities.push(...buildSecurity.vulnerabilities);
  artifacts.push(...buildSecurity.artifacts);

  // ============================================================================
  // PHASE 6: ARTIFACT INTEGRITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Verifying artifact integrity');

  const artifactIntegrity = await ctx.task(artifactIntegrityTask, {
    projectName,
    dependencyEnum,
    outputDir
  });

  vulnerabilities.push(...artifactIntegrity.vulnerabilities);
  artifacts.push(...artifactIntegrity.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating supply chain security report');

  const report = await ctx.task(supplyChainReportTask, {
    projectName,
    vulnerabilities,
    sbomGeneration,
    dependencyEnum,
    licenseAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Supply chain analysis complete for ${projectName}. ${dependencyEnum.totalDependencies} dependencies, ${vulnerabilities.length} vulnerabilities found. Review findings?`,
    title: 'Supply Chain Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalDependencies: dependencyEnum.totalDependencies,
        vulnerabilities: vulnerabilities.length,
        licenseIssues: licenseAnalysis.issues.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    sbom: sbomGeneration.sbom,
    supplyChainReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/supply-chain-security',
      timestamp: startTime,
      ecosystems,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dependencyEnumerationTask = defineTask('dependency-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Enumerate Dependencies - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Dependency Analyst',
      task: 'Enumerate all dependencies',
      context: args,
      instructions: [
        '1. Parse package manifests',
        '2. Enumerate direct dependencies',
        '3. Enumerate transitive dependencies',
        '4. Map dependency tree',
        '5. Identify phantom dependencies',
        '6. Check for pinned versions',
        '7. Identify outdated packages',
        '8. Document dependency inventory'
      ],
      outputFormat: 'JSON with dependency enumeration'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'totalDependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'array' },
        totalDependencies: { type: 'number' },
        directDependencies: { type: 'number' },
        transitiveDependencies: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'dependencies']
}));

export const sbomGenerationTask = defineTask('sbom-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate SBOM - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'SBOM Generation Specialist',
      task: 'Generate Software Bill of Materials',
      context: args,
      instructions: [
        '1. Generate CycloneDX SBOM',
        '2. Generate SPDX SBOM',
        '3. Include all components',
        '4. Add license information',
        '5. Include hashes',
        '6. Add supplier info',
        '7. Include pURL identifiers',
        '8. Document SBOM generation'
      ],
      outputFormat: 'JSON with SBOM'
    },
    outputSchema: {
      type: 'object',
      required: ['sbom', 'sbomPath', 'artifacts'],
      properties: {
        sbom: { type: 'object' },
        sbomPath: { type: 'string' },
        format: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'sbom']
}));

export const dependencyVulnScanningTask = defineTask('dependency-vuln-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan for Vulnerabilities - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Dependency Vulnerability Scanner',
      task: 'Scan dependencies for vulnerabilities',
      context: args,
      instructions: [
        '1. Query vulnerability databases',
        '2. Check NVD/CVE',
        '3. Check OSV database',
        '4. Check Snyk database',
        '5. Map CVEs to dependencies',
        '6. Assess exploitability',
        '7. Check for patches',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with vulnerability scan'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        bySeverity: { type: 'object' },
        patchAvailable: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'vulnerabilities']
}));

export const licenseAnalysisTask = defineTask('license-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Licenses - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'License Analysis Specialist',
      task: 'Analyze dependency licenses',
      context: args,
      instructions: [
        '1. Identify all licenses',
        '2. Check license compatibility',
        '3. Identify copyleft licenses',
        '4. Check for unknown licenses',
        '5. Identify license conflicts',
        '6. Check attribution requirements',
        '7. Assess compliance risks',
        '8. Document license analysis'
      ],
      outputFormat: 'JSON with license analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['licenses', 'issues', 'artifacts'],
      properties: {
        licenses: { type: 'array' },
        issues: { type: 'array' },
        byLicenseType: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'licenses']
}));

export const buildSecurityTask = defineTask('build-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Build Security - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Build Security Analyst',
      task: 'Analyze build system security',
      context: args,
      instructions: [
        '1. Analyze CI/CD configuration',
        '2. Check for secrets in config',
        '3. Assess SLSA compliance',
        '4. Check build reproducibility',
        '5. Analyze build scripts',
        '6. Check artifact signing',
        '7. Review pipeline security',
        '8. Document findings'
      ],
      outputFormat: 'JSON with build security'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'slsaLevel', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        slsaLevel: { type: 'number' },
        buildIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'build']
}));

export const artifactIntegrityTask = defineTask('artifact-integrity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify Artifact Integrity - ${args.projectName}`,
  agent: {
    name: 'hardware-security-researcher',
    prompt: {
      role: 'Artifact Integrity Analyst',
      task: 'Verify artifact integrity',
      context: args,
      instructions: [
        '1. Verify package checksums',
        '2. Check signatures',
        '3. Verify provenance',
        '4. Check for typosquatting',
        '5. Verify publisher identity',
        '6. Check for malicious packages',
        '7. Verify registry integrity',
        '8. Document findings'
      ],
      outputFormat: 'JSON with integrity verification'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'verified', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        verified: { type: 'number' },
        failed: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'integrity']
}));

export const supplyChainReportTask = defineTask('supply-chain-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Supply Chain Report Specialist',
      task: 'Generate supply chain security report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Include SBOM reference',
        '3. List all vulnerabilities',
        '4. Include license issues',
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
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'supply-chain', 'reporting']
}));
