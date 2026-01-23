/**
 * @process specializations/security-compliance/sca-dependency-management
 * @description Software Composition Analysis (SCA) and Dependency Management - Comprehensive SCA framework covering
 * vulnerability scanning, CVE monitoring, SBOM generation, automated dependency updates, license compliance verification,
 * supply chain risk assessment, and integration with security tools like Snyk, Dependabot, OWASP Dependency-Check,
 * and Trivy for complete software supply chain security.
 * @inputs { projectName: string, repositoryUrl?: string, packageManagers?: array, scaTools?: array, licensePolicies?: object, automatedUpdates?: boolean }
 * @outputs { success: boolean, sbom: object, vulnerabilities: array, licenses: object, complianceStatus: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/sca-dependency-management', {
 *   projectName: 'E-Commerce Platform',
 *   repositoryUrl: 'https://github.com/org/ecommerce-platform',
 *   packageManagers: ['npm', 'maven', 'pip'],
 *   scaTools: ['snyk', 'dependabot', 'trivy', 'owasp-dependency-check'],
 *   licensePolicies: {
 *     allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
 *     denied: ['GPL-3.0', 'AGPL-3.0'],
 *     reviewRequired: ['LGPL-2.1']
 *   },
 *   severityThreshold: 'high',
 *   automatedUpdates: true,
 *   sbomFormat: 'cyclonedx',
 *   cicdIntegration: true,
 *   supplyChainSecurity: true
 * });
 *
 * @references
 * - OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
 * - Snyk Documentation: https://docs.snyk.io/
 * - GitHub Dependabot: https://docs.github.com/en/code-security/dependabot
 * - CycloneDX SBOM Standard: https://cyclonedx.org/
 * - SPDX: https://spdx.dev/
 * - NIST SSDF: https://csrc.nist.gov/Projects/ssdf
 * - SLSA Framework: https://slsa.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryUrl = null,
    packageManagers = ['npm', 'maven', 'pip'],
    scaTools = ['snyk', 'dependabot', 'trivy'],
    licensePolicies = {
      allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
      denied: ['GPL-3.0', 'AGPL-3.0'],
      reviewRequired: ['LGPL-2.1', 'MPL-2.0']
    },
    severityThreshold = 'high', // 'critical', 'high', 'medium', 'low'
    automatedUpdates = true,
    sbomFormat = 'cyclonedx', // 'cyclonedx', 'spdx', 'both'
    cicdIntegration = true,
    supplyChainSecurity = true,
    outputDir = 'sca-output',
    qualityCriteria = {
      maxCriticalVulnerabilities: 0,
      maxHighVulnerabilities: 5,
      requiredSBOM: true,
      licenseComplianceRequired: true,
      updateCadence: 'weekly'
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];
  let sbom = {};
  let licenses = {};
  let complianceStatus = {};

  ctx.log('info', `Starting SCA and Dependency Management for ${projectName}`);
  ctx.log('info', `Package Managers: ${packageManagers.join(', ')}`);
  ctx.log('info', `SCA Tools: ${scaTools.join(', ')}`);
  ctx.log('info', `Severity Threshold: ${severityThreshold}`);

  // ============================================================================
  // PHASE 1: DEPENDENCY DISCOVERY AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and inventorying dependencies');

  const dependencyInventory = await ctx.task(dependencyDiscoveryTask, {
    projectName,
    repositoryUrl,
    packageManagers,
    outputDir
  });

  if (!dependencyInventory.success) {
    return {
      success: false,
      error: 'Failed to discover dependencies',
      details: dependencyInventory,
      metadata: {
        processId: 'specializations/security-compliance/sca-dependency-management',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...dependencyInventory.artifacts);

  const totalDependencies = dependencyInventory.totalDependencies;
  const directDependencies = dependencyInventory.directDependencies;
  const transitiveDependencies = dependencyInventory.transitiveDependencies;

  ctx.log('info', `Discovered ${totalDependencies} dependencies (${directDependencies} direct, ${transitiveDependencies} transitive)`);

  // ============================================================================
  // PHASE 2: VULNERABILITY SCANNING (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 2: Running vulnerability scans in parallel with multiple tools');

  const vulnScanTasks = scaTools.map(tool =>
    () => ctx.task(vulnerabilityScanningTask, {
      projectName,
      tool,
      repositoryUrl,
      packageManagers,
      dependencyInventory: dependencyInventory.dependencies,
      severityThreshold,
      outputDir
    })
  );

  const vulnScanResults = await ctx.parallel.all(vulnScanTasks);

  artifacts.push(...vulnScanResults.flatMap(r => r.artifacts));

  // Aggregate and deduplicate vulnerabilities across tools
  const aggregatedVulnerabilities = await ctx.task(vulnerabilityAggregationTask, {
    projectName,
    scanResults: vulnScanResults,
    severityThreshold,
    outputDir
  });

  vulnerabilities.push(...aggregatedVulnerabilities.vulnerabilities);

  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

  ctx.log('info', `Vulnerabilities found: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low`);

  artifacts.push(...aggregatedVulnerabilities.artifacts);

  // Quality Gate: Check vulnerability thresholds
  if (criticalCount > qualityCriteria.maxCriticalVulnerabilities || highCount > qualityCriteria.maxHighVulnerabilities) {
    await ctx.breakpoint({
      question: `Vulnerability threshold exceeded: ${criticalCount} critical (max: ${qualityCriteria.maxCriticalVulnerabilities}), ${highCount} high (max: ${qualityCriteria.maxHighVulnerabilities}). Review vulnerabilities?`,
      title: 'Vulnerability Threshold Alert',
      context: {
        runId: ctx.runId,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        topVulnerabilities: vulnerabilities.slice(0, 10),
        files: [{
          path: aggregatedVulnerabilities.reportPath,
          format: 'json',
          label: 'Vulnerability Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 3: SBOM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating Software Bill of Materials (SBOM)');

  const sbomGeneration = await ctx.task(sbomGenerationTask, {
    projectName,
    dependencyInventory: dependencyInventory.dependencies,
    packageManagers,
    format: sbomFormat,
    includeVulnerabilities: true,
    vulnerabilities: vulnerabilities,
    outputDir
  });

  sbom = sbomGeneration.sbom;
  artifacts.push(...sbomGeneration.artifacts);

  ctx.log('info', `SBOM generated in ${sbomFormat} format with ${sbom.componentCount} components`);

  // Breakpoint: Review SBOM
  await ctx.breakpoint({
    question: `SBOM generated with ${sbom.componentCount} components in ${sbomFormat} format. Review SBOM?`,
    title: 'SBOM Review',
    context: {
      runId: ctx.runId,
      sbomFormat,
      componentCount: sbom.componentCount,
      files: sbomGeneration.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        label: a.label || 'SBOM'
      }))
    }
  });

  // ============================================================================
  // PHASE 4: LICENSE COMPLIANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing license compliance');

  const licenseAnalysis = await ctx.task(licenseComplianceTask, {
    projectName,
    dependencyInventory: dependencyInventory.dependencies,
    packageManagers,
    licensePolicies,
    outputDir
  });

  licenses = licenseAnalysis.licenses;
  artifacts.push(...licenseAnalysis.artifacts);

  const licenseViolations = licenseAnalysis.violations;
  const licenseReviews = licenseAnalysis.reviewRequired;

  ctx.log('info', `License analysis complete: ${licenseViolations.length} violations, ${licenseReviews.length} requiring review`);

  // Quality Gate: License compliance
  if (licenseViolations.length > 0 && qualityCriteria.licenseComplianceRequired) {
    await ctx.breakpoint({
      question: `Found ${licenseViolations.length} license policy violations. Review and approve?`,
      title: 'License Compliance Review',
      context: {
        runId: ctx.runId,
        violations: licenseViolations,
        reviewRequired: licenseReviews,
        files: [{
          path: licenseAnalysis.reportPath,
          format: 'json',
          label: 'License Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 5: SUPPLY CHAIN SECURITY ASSESSMENT (IF ENABLED)
  // ============================================================================

  let supplyChainAssessment = null;
  if (supplyChainSecurity) {
    ctx.log('info', 'Phase 5: Assessing supply chain security risks');

    supplyChainAssessment = await ctx.task(supplyChainSecurityTask, {
      projectName,
      repositoryUrl,
      dependencyInventory: dependencyInventory.dependencies,
      packageManagers,
      vulnerabilities,
      outputDir
    });

    artifacts.push(...supplyChainAssessment.artifacts);

    ctx.log('info', `Supply chain assessment: ${supplyChainAssessment.riskScore}/100 risk score`);
  }

  // ============================================================================
  // PHASE 6: SCA TOOL SETUP AND CONFIGURATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up and configuring SCA tools in parallel');

  const toolSetupTasks = scaTools.map(tool =>
    () => ctx.task(scaToolSetupTask, {
      projectName,
      tool,
      repositoryUrl,
      packageManagers,
      licensePolicies,
      severityThreshold,
      automatedUpdates: automatedUpdates && ['snyk', 'dependabot'].includes(tool),
      cicdIntegration,
      outputDir
    })
  );

  const toolSetups = await ctx.parallel.all(toolSetupTasks);

  artifacts.push(...toolSetups.flatMap(s => s.artifacts));

  ctx.log('info', `Configured ${toolSetups.length} SCA tools with CI/CD integration`);

  // ============================================================================
  // PHASE 7: AUTOMATED UPDATE STRATEGY (IF ENABLED)
  // ============================================================================

  let updateStrategy = null;
  if (automatedUpdates) {
    ctx.log('info', 'Phase 7: Designing automated dependency update strategy');

    updateStrategy = await ctx.task(automatedUpdateStrategyTask, {
      projectName,
      packageManagers,
      dependencyInventory: dependencyInventory.dependencies,
      vulnerabilities,
      updateCadence: qualityCriteria.updateCadence,
      cicdIntegration,
      outputDir
    });

    artifacts.push(...updateStrategy.artifacts);

    ctx.log('info', `Update strategy created with ${updateStrategy.updateRules.length} rules`);
  }

  // ============================================================================
  // PHASE 8: REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating vulnerability remediation plan');

  const remediationPlan = await ctx.task(remediationPlanningTask, {
    projectName,
    vulnerabilities,
    dependencyInventory: dependencyInventory.dependencies,
    licenseViolations,
    supplyChainAssessment,
    automatedUpdates,
    outputDir
  });

  artifacts.push(...remediationPlan.artifacts);

  ctx.log('info', `Remediation plan created with ${remediationPlan.actions.length} actions (${remediationPlan.automatable} automatable)`);

  // Breakpoint: Review remediation plan
  await ctx.breakpoint({
    question: `Remediation plan created with ${remediationPlan.actions.length} actions. ${remediationPlan.criticalActions} critical actions require immediate attention. Review plan?`,
    title: 'Remediation Plan Review',
    context: {
      runId: ctx.runId,
      totalActions: remediationPlan.actions.length,
      criticalActions: remediationPlan.criticalActions,
      automatableActions: remediationPlan.automatable,
      estimatedEffort: remediationPlan.estimatedEffort,
      files: [{
        path: remediationPlan.reportPath,
        format: 'markdown',
        label: 'Remediation Plan'
      }]
    }
  });

  // ============================================================================
  // PHASE 9: CI/CD PIPELINE INTEGRATION (IF ENABLED)
  // ============================================================================

  let cicdSetup = null;
  if (cicdIntegration) {
    ctx.log('info', 'Phase 9: Creating CI/CD pipeline integration configuration');

    cicdSetup = await ctx.task(cicdIntegrationTask, {
      projectName,
      repositoryUrl,
      scaTools,
      packageManagers,
      severityThreshold,
      automatedUpdates,
      failBuildOnVulnerabilities: criticalCount > 0 || highCount > qualityCriteria.maxHighVulnerabilities,
      outputDir
    });

    artifacts.push(...cicdSetup.artifacts);

    ctx.log('info', `CI/CD integration configured for ${cicdSetup.platforms.length} platforms`);
  }

  // ============================================================================
  // PHASE 10: COMPLIANCE REPORTING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating compliance reports and documentation');

  const complianceReporting = await ctx.task(complianceReportingTask, {
    projectName,
    sbom,
    vulnerabilities,
    licenses,
    licenseViolations,
    licenseReviews,
    supplyChainAssessment,
    remediationPlan,
    qualityCriteria,
    outputDir
  });

  complianceStatus = complianceReporting.status;
  artifacts.push(...complianceReporting.artifacts);

  ctx.log('info', `Compliance status: ${complianceStatus.overall} (${complianceStatus.score}/100)`);

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `SCA analysis complete. Compliance score: ${complianceStatus.score}/100. ${criticalCount} critical vulnerabilities, ${licenseViolations.length} license violations. Review final report and approve?`,
    title: 'Final SCA Report Review',
    context: {
      runId: ctx.runId,
      complianceScore: complianceStatus.score,
      vulnerabilitySummary: { criticalCount, highCount, mediumCount, lowCount },
      licenseSummary: { violations: licenseViolations.length, reviewRequired: licenseReviews.length },
      supplyChainRisk: supplyChainAssessment?.riskScore || 'N/A',
      files: [
        {
          path: complianceReporting.executiveReportPath,
          format: 'markdown',
          label: 'Executive Summary'
        },
        {
          path: complianceReporting.technicalReportPath,
          format: 'markdown',
          label: 'Technical Report'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    sbom: {
      format: sbomFormat,
      componentCount: sbom.componentCount,
      paths: sbom.paths,
      specification: sbom.specification
    },
    vulnerabilities: {
      total: vulnerabilities.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      details: vulnerabilities.map(v => ({
        id: v.id,
        package: v.package,
        severity: v.severity,
        cvss: v.cvss,
        fixAvailable: v.fixAvailable
      }))
    },
    licenses: {
      total: licenses.totalLicenses,
      compliance: {
        compliant: licenses.compliant,
        violations: licenseViolations.length,
        reviewRequired: licenseReviews.length
      },
      byLicense: licenses.byLicense
    },
    dependencies: {
      total: totalDependencies,
      direct: directDependencies,
      transitive: transitiveDependencies
    },
    supplyChain: supplyChainAssessment ? {
      riskScore: supplyChainAssessment.riskScore,
      risks: supplyChainAssessment.risks.length,
      recommendations: supplyChainAssessment.recommendations.length
    } : null,
    remediation: {
      totalActions: remediationPlan.actions.length,
      criticalActions: remediationPlan.criticalActions,
      automatableActions: remediationPlan.automatable,
      estimatedEffort: remediationPlan.estimatedEffort
    },
    tooling: {
      configured: scaTools,
      automatedUpdates: automatedUpdates ? updateStrategy?.updateRules.length : 0,
      cicdIntegration: cicdIntegration ? cicdSetup?.platforms : []
    },
    complianceStatus: {
      overall: complianceStatus.overall,
      score: complianceStatus.score,
      meetsThresholds: complianceStatus.meetsThresholds
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/security-compliance/sca-dependency-management',
      timestamp: startTime,
      outputDir,
      severityThreshold
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Dependency Discovery
export const dependencyDiscoveryTask = defineTask('dependency-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and inventory all project dependencies',
  agent: {
    name: 'dependency-analyzer',
    prompt: {
      role: 'software composition analysis specialist',
      task: 'Discover and inventory all project dependencies across package managers',
      context: args,
      instructions: [
        'Scan project for dependency manifest files (package.json, pom.xml, requirements.txt, etc.)',
        'For each package manager, parse dependency declarations',
        'Identify direct (explicitly declared) dependencies',
        'Resolve and identify transitive (indirect) dependencies',
        'Extract version information and version constraints',
        'Identify dev/test vs production dependencies',
        'Detect dependency lock files (package-lock.json, yarn.lock, Pipfile.lock, etc.)',
        'Build complete dependency tree/graph',
        'Identify outdated dependencies',
        'Detect duplicate dependencies across the tree',
        'Note deprecated packages',
        'Extract package metadata (name, version, description, maintainers)',
        'Save dependency inventory to structured format (JSON)',
        'Create dependency visualization (tree or graph)'
      ],
      outputFormat: 'JSON with success (boolean), totalDependencies (number), directDependencies (number), transitiveDependencies (number), dependencies (array), dependencyTree (object), outdated (array), duplicates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalDependencies', 'directDependencies', 'transitiveDependencies', 'dependencies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalDependencies: { type: 'number' },
        directDependencies: { type: 'number' },
        transitiveDependencies: { type: 'number' },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              packageManager: { type: 'string' },
              type: { type: 'string', enum: ['direct', 'transitive'] },
              scope: { type: 'string', enum: ['production', 'development', 'test'] },
              latestVersion: { type: 'string' },
              deprecated: { type: 'boolean' }
            }
          }
        },
        dependencyTree: { type: 'object' },
        outdated: { type: 'array' },
        duplicates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sca', 'dependency-discovery']
}));

// Task 2: Vulnerability Scanning
export const vulnerabilityScanningTask = defineTask('vulnerability-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run vulnerability scan with ${args.tool}`,
  agent: {
    name: `${args.tool}-scanner`,
    prompt: {
      role: 'security vulnerability analyst',
      task: `Scan dependencies for known vulnerabilities using ${args.tool}`,
      context: args,
      instructions: [
        `Configure and run ${args.tool} vulnerability scanner`,
        'Scan all dependencies (direct and transitive) for known vulnerabilities',
        'Query CVE databases (NVD, GitHub Advisory, Snyk DB, etc.)',
        'For each vulnerability found, extract:',
        '  - CVE ID or vulnerability identifier',
        '  - Affected package name and version',
        '  - Vulnerability severity (Critical, High, Medium, Low)',
        '  - CVSS score and vector',
        '  - Vulnerability description',
        '  - CWE classification',
        '  - Affected version range',
        '  - Fixed version (if available)',
        '  - Exploit availability',
        '  - Patching information',
        '  - References and advisories',
        'Prioritize vulnerabilities by severity and exploitability',
        'Identify vulnerabilities with available fixes',
        'Generate vulnerability report with remediation guidance',
        'Save scan results in structured format'
      ],
      outputFormat: 'JSON with tool (string), vulnerabilities (array), summary (object), scanTimestamp (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'vulnerabilities', 'summary', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              package: { type: 'string' },
              version: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              cvss: { type: 'number' },
              cve: { type: 'array', items: { type: 'string' } },
              cwe: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              fixedVersion: { type: 'string' },
              fixAvailable: { type: 'boolean' },
              exploitAvailable: { type: 'boolean' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        scanTimestamp: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sca', 'vulnerability-scanning', args.tool]
}));

// Task 3: Vulnerability Aggregation
export const vulnerabilityAggregationTask = defineTask('vulnerability-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate and deduplicate vulnerabilities from multiple tools',
  agent: {
    name: 'vulnerability-aggregator',
    prompt: {
      role: 'security data analyst',
      task: 'Aggregate, deduplicate, and prioritize vulnerabilities from multiple scanning tools',
      context: args,
      instructions: [
        'Collect vulnerability results from all scanning tools',
        'Deduplicate vulnerabilities by CVE ID, package, and version',
        'For duplicates, merge data and take highest severity',
        'Normalize severity levels across different tools',
        'Calculate priority score based on:',
        '  - Severity (CVSS score)',
        '  - Exploitability',
        '  - Fix availability',
        '  - Package usage (direct vs transitive)',
        '  - Public exposure',
        'Group vulnerabilities by package',
        'Identify vulnerability chains (transitive dependency vulnerabilities)',
        'Filter by severity threshold',
        'Create unified vulnerability report',
        'Generate actionable remediation recommendations',
        'Save aggregated results'
      ],
      outputFormat: 'JSON with vulnerabilities (array deduplicated), summary (object), prioritized (array), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'summary', 'reportPath', 'artifacts'],
      properties: {
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              package: { type: 'string' },
              version: { type: 'string' },
              severity: { type: 'string' },
              cvss: { type: 'number' },
              priorityScore: { type: 'number' },
              fixedVersion: { type: 'string' },
              fixAvailable: { type: 'boolean' },
              exploitAvailable: { type: 'boolean' },
              detectedBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            fixable: { type: 'number' }
          }
        },
        prioritized: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sca', 'vulnerability-aggregation']
}));

// Task 4: SBOM Generation
export const sbomGenerationTask = defineTask('sbom-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Software Bill of Materials (SBOM)',
  agent: {
    name: 'sbom-generator',
    prompt: {
      role: 'supply chain security specialist',
      task: 'Generate comprehensive SBOM in specified format(s)',
      context: args,
      instructions: [
        'Generate SBOM following specified standard (CycloneDX, SPDX, or both)',
        'Include all components from dependency inventory',
        'For each component, document:',
        '  - Component name and version',
        '  - Package URL (purl)',
        '  - License information',
        '  - Supplier/publisher',
        '  - Hash/checksum',
        '  - Component type (library, framework, application)',
        '  - Relationships (dependencies)',
        'Include vulnerability information if specified',
        'Add metadata (timestamp, tools, authors)',
        'Validate SBOM against schema',
        'Generate machine-readable format (JSON/XML)',
        'Generate human-readable summary',
        'Sign SBOM for integrity verification (if applicable)',
        'Save SBOM in specified format(s)',
        'Create SBOM diff capability for version comparison'
      ],
      outputFormat: 'JSON with sbom (object with format, componentCount, specification, paths), validation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sbom', 'validation', 'artifacts'],
      properties: {
        sbom: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            componentCount: { type: 'number' },
            specification: { type: 'string' },
            paths: {
              type: 'object',
              properties: {
                json: { type: 'string' },
                xml: { type: 'string' },
                summary: { type: 'string' }
              }
            },
            signed: { type: 'boolean' }
          }
        },
        validation: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: { type: 'array' },
            warnings: { type: 'array' }
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
  labels: ['agent', 'sca', 'sbom']
}));

// Task 5: License Compliance
export const licenseComplianceTask = defineTask('license-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze license compliance across dependencies',
  agent: {
    name: 'license-compliance-analyst',
    prompt: {
      role: 'open source license compliance specialist',
      task: 'Analyze dependency licenses and check against organizational policies',
      context: args,
      instructions: [
        'Extract license information from all dependencies',
        'Identify license type (permissive, copyleft, proprietary, unknown)',
        'Check each license against policy (allowed, denied, review required)',
        'Identify license policy violations',
        'Identify dependencies requiring legal review',
        'Detect license conflicts (incompatible licenses)',
        'Identify dependencies with multiple or unclear licenses',
        'Check for missing license information',
        'Assess copyleft obligations (GPL, AGPL, etc.)',
        'Document attribution requirements',
        'Generate license compliance report',
        'Create license summary by type',
        'Provide remediation recommendations for violations',
        'Generate attribution notices for allowed licenses'
      ],
      outputFormat: 'JSON with licenses (object), violations (array), reviewRequired (array), summary (object), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['licenses', 'violations', 'reviewRequired', 'artifacts'],
      properties: {
        licenses: {
          type: 'object',
          properties: {
            totalLicenses: { type: 'number' },
            compliant: { type: 'number' },
            byLicense: { type: 'object' },
            byType: {
              type: 'object',
              properties: {
                permissive: { type: 'number' },
                copyleft: { type: 'number' },
                proprietary: { type: 'number' },
                unknown: { type: 'number' }
              }
            }
          }
        },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              package: { type: 'string' },
              version: { type: 'string' },
              license: { type: 'string' },
              policy: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        reviewRequired: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              package: { type: 'string' },
              version: { type: 'string' },
              license: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        conflicts: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sca', 'license-compliance']
}));

// Task 6: Supply Chain Security Assessment
export const supplyChainSecurityTask = defineTask('supply-chain-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess software supply chain security risks',
  agent: {
    name: 'supply-chain-analyst',
    prompt: {
      role: 'software supply chain security specialist',
      task: 'Assess supply chain security risks and threats',
      context: args,
      instructions: [
        'Analyze supply chain security risks following SLSA framework',
        'Check for typosquatting risks (similar package names)',
        'Identify unmaintained/abandoned dependencies',
        'Check package maintainer reputation and trust',
        'Analyze package download statistics and popularity',
        'Identify dependencies with single maintainer risk',
        'Check for package hijacking indicators',
        'Analyze dependency freshness (last update)',
        'Check for packages with known malicious history',
        'Assess build provenance and integrity',
        'Check for package signing and verification',
        'Identify packages from untrusted sources',
        'Analyze dependency update frequency',
        'Check for suspicious package behavior',
        'Calculate supply chain risk score (0-100)',
        'Generate risk mitigation recommendations',
        'Create supply chain security report'
      ],
      outputFormat: 'JSON with riskScore (number 0-100), risks (array), recommendations (array), metrics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'risks', 'recommendations', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              package: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              recommendation: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            unmaintainedPackages: { type: 'number' },
            singleMaintainerPackages: { type: 'number' },
            lowPopularityPackages: { type: 'number' },
            outdatedPackages: { type: 'number' }
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
  labels: ['agent', 'sca', 'supply-chain-security']
}));

// Task 7: SCA Tool Setup
export const scaToolSetupTask = defineTask('sca-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup and configure ${args.tool}`,
  agent: {
    name: 'sca-tool-configurator',
    prompt: {
      role: 'DevSecOps engineer',
      task: `Setup and configure ${args.tool} for continuous dependency scanning`,
      context: args,
      instructions: [
        `Generate configuration files for ${args.tool}`,
        'Configure severity thresholds and policies',
        'Setup license policy enforcement',
        'Configure automated scanning schedule',
        'Setup vulnerability alerting and notifications',
        'Configure integration with version control (GitHub, GitLab, Bitbucket)',
        'If automated updates enabled, configure PR automation',
        'Setup security gate configuration for CI/CD',
        'Configure ignore/exception rules (with justifications)',
        'Setup reporting and dashboard access',
        'Configure SSO/authentication if applicable',
        'Create onboarding documentation',
        'Generate API keys or access tokens (document securely)',
        'Create monitoring and alerting setup',
        'Document tool usage and best practices'
      ],
      outputFormat: 'JSON with tool (string), configured (boolean), configFiles (array), documentation (object), automationEnabled (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'configured', 'configFiles', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        configured: { type: 'boolean' },
        configFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        documentation: {
          type: 'object',
          properties: {
            setupGuide: { type: 'string' },
            userGuide: { type: 'string' }
          }
        },
        automationEnabled: { type: 'boolean' },
        integration: {
          type: 'object',
          properties: {
            vcs: { type: 'string' },
            cicd: { type: 'boolean' },
            notifications: { type: 'boolean' }
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
  labels: ['agent', 'sca', 'tool-setup', args.tool]
}));

// Task 8: Automated Update Strategy
export const automatedUpdateStrategyTask = defineTask('automated-update-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design automated dependency update strategy',
  agent: {
    name: 'update-strategy-designer',
    prompt: {
      role: 'software maintenance and automation specialist',
      task: 'Design comprehensive automated dependency update strategy',
      context: args,
      instructions: [
        'Define update cadence (daily, weekly, monthly) by dependency type',
        'Create update rules by severity:',
        '  - Critical vulnerabilities: immediate automated updates',
        '  - High vulnerabilities: automated with quick review',
        '  - Medium/Low: scheduled batch updates',
        'Define version update policies:',
        '  - Patch updates: auto-merge if tests pass',
        '  - Minor updates: PR with review',
        '  - Major updates: manual review required',
        'Configure automated testing requirements before merge',
        'Setup rollback procedures for failed updates',
        'Define approval workflows',
        'Configure PR grouping strategies (by package, by severity)',
        'Setup update conflict resolution',
        'Configure change log generation',
        'Define notification rules',
        'Create update schedule (avoid peak hours)',
        'Document manual intervention scenarios',
        'Generate Dependabot/Renovate configuration'
      ],
      outputFormat: 'JSON with updateRules (array), schedule (object), automation (object), prSettings (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['updateRules', 'schedule', 'automation', 'artifacts'],
      properties: {
        updateRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              versionChange: { type: 'string' },
              automation: { type: 'string', enum: ['auto-merge', 'pr-review', 'manual'] },
              testRequired: { type: 'boolean' }
            }
          }
        },
        schedule: {
          type: 'object',
          properties: {
            cadence: { type: 'string' },
            timezone: { type: 'string' },
            excludeDays: { type: 'array' }
          }
        },
        automation: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            autoMergeEnabled: { type: 'boolean' },
            prGroupingStrategy: { type: 'string' }
          }
        },
        prSettings: {
          type: 'object',
          properties: {
            reviewers: { type: 'array' },
            labels: { type: 'array' },
            commitMessagePrefix: { type: 'string' }
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
  labels: ['agent', 'sca', 'automated-updates']
}));

// Task 9: Remediation Planning
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create vulnerability and compliance remediation plan',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'security remediation specialist',
      task: 'Create prioritized remediation plan for vulnerabilities and compliance issues',
      context: args,
      instructions: [
        'Consolidate all issues (vulnerabilities, license violations, supply chain risks)',
        'For each issue, create remediation action:',
        '  - Issue description and impact',
        '  - Remediation approach (update, replace, remove, accept risk)',
        '  - Specific steps to remediate',
        '  - Estimated effort (hours/days)',
        '  - Priority (critical, high, medium, low)',
        '  - Automatable vs manual',
        'Prioritize actions by:',
        '  - Security risk (CVSS, exploitability)',
        '  - Business impact',
        '  - Ease of remediation',
        '  - Compliance requirements',
        'Group related actions',
        'Identify quick wins (high impact, low effort)',
        'Create timeline with phases (immediate, short-term, long-term)',
        'Estimate total remediation effort',
        'Identify dependencies between actions',
        'Create risk acceptance documentation for unfixable issues',
        'Generate remediation tracking dashboard',
        'Create detailed remediation runbook'
      ],
      outputFormat: 'JSON with actions (array), criticalActions (number), automatable (number), estimatedEffort (string), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'criticalActions', 'automatable', 'estimatedEffort', 'reportPath', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              issue: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' },
              approach: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              automatable: { type: 'boolean' },
              effort: { type: 'string' },
              phase: { type: 'string' }
            }
          }
        },
        criticalActions: { type: 'number' },
        automatable: { type: 'number' },
        estimatedEffort: { type: 'string' },
        timeline: {
          type: 'object',
          properties: {
            immediate: { type: 'number' },
            shortTerm: { type: 'number' },
            longTerm: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sca', 'remediation-planning']
}));

// Task 10: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create CI/CD pipeline integration for SCA',
  agent: {
    name: 'cicd-integration-specialist',
    prompt: {
      role: 'DevSecOps CI/CD specialist',
      task: 'Create CI/CD pipeline integration configuration for SCA tools',
      context: args,
      instructions: [
        'Identify CI/CD platform (GitHub Actions, GitLab CI, Jenkins, CircleCI, etc.)',
        'Create pipeline stages for SCA:',
        '  - Dependency scanning',
        '  - Vulnerability scanning',
        '  - License compliance check',
        '  - SBOM generation',
        '  - Security gate enforcement',
        'Configure security gates and fail conditions',
        'Setup caching for faster scans',
        'Configure parallel scanning with multiple tools',
        'Setup artifact publishing (SBOM, reports)',
        'Configure notifications (Slack, email, etc.)',
        'Create separate workflows for PR checks vs scheduled scans',
        'Setup automated PR comments with scan results',
        'Configure security dashboard integration',
        'Create pipeline templates for reuse',
        'Document pipeline configuration and usage',
        'Create troubleshooting guide'
      ],
      outputFormat: 'JSON with platforms (array), configured (boolean), pipelineFiles (array), securityGates (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['platforms', 'configured', 'pipelineFiles', 'artifacts'],
      properties: {
        platforms: { type: 'array', items: { type: 'string' } },
        configured: { type: 'boolean' },
        pipelineFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              platform: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        securityGates: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            failOnCritical: { type: 'boolean' },
            failOnHigh: { type: 'boolean' },
            failOnLicenseViolation: { type: 'boolean' }
          }
        },
        features: {
          type: 'object',
          properties: {
            prComments: { type: 'boolean' },
            artifacts: { type: 'boolean' },
            notifications: { type: 'boolean' },
            caching: { type: 'boolean' }
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
  labels: ['agent', 'sca', 'cicd-integration']
}));

// Task 11: Compliance Reporting
export const complianceReportingTask = defineTask('compliance-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate compliance reports and documentation',
  agent: {
    name: 'compliance-reporter',
    prompt: {
      role: 'security compliance and reporting specialist',
      task: 'Generate comprehensive compliance reports and documentation',
      context: args,
      instructions: [
        'Create executive summary report:',
        '  - Overall compliance status',
        '  - Key metrics (vulnerability count, license compliance, supply chain risk)',
        '  - Critical findings and recommendations',
        '  - Risk assessment',
        'Create technical report:',
        '  - Detailed vulnerability analysis',
        '  - SBOM summary',
        '  - License compliance details',
        '  - Supply chain security assessment',
        '  - Remediation plan',
        '  - Tool configuration status',
        'Create compliance scorecard:',
        '  - Vulnerability management score',
        '  - License compliance score',
        '  - Supply chain security score',
        '  - Overall compliance score (0-100)',
        'Include visualizations:',
        '  - Vulnerability trend charts',
        '  - Dependency tree visualization',
        '  - License distribution pie chart',
        'Document compliance with standards (NIST SSDF, SLSA, etc.)',
        'Create audit trail documentation',
        'Generate stakeholder-specific reports',
        'Create compliance dashboard configuration',
        'Save all reports in multiple formats (PDF, HTML, Markdown)'
      ],
      outputFormat: 'JSON with status (object with overall, score, meetsThresholds), executiveReportPath (string), technicalReportPath (string), scorecard (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'executiveReportPath', 'technicalReportPath', 'artifacts'],
      properties: {
        status: {
          type: 'object',
          properties: {
            overall: { type: 'string', enum: ['compliant', 'non-compliant', 'partial'] },
            score: { type: 'number', minimum: 0, maximum: 100 },
            meetsThresholds: { type: 'boolean' }
          }
        },
        executiveReportPath: { type: 'string' },
        technicalReportPath: { type: 'string' },
        scorecard: {
          type: 'object',
          properties: {
            vulnerabilityManagement: { type: 'number' },
            licenseCompliance: { type: 'number' },
            supplyChainSecurity: { type: 'number' },
            toolingAndAutomation: { type: 'number' }
          }
        },
        standards: {
          type: 'object',
          properties: {
            nistSsdf: { type: 'string' },
            slsa: { type: 'string' }
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
  labels: ['agent', 'sca', 'compliance-reporting']
}));
