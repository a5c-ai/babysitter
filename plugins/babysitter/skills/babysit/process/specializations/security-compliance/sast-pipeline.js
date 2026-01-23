/**
 * @process specializations/security-compliance/sast-pipeline
 * @description SAST Pipeline Integration - Automated static application security testing integration for CI/CD pipelines.
 * Covers tool selection (SonarQube, Semgrep, Bandit, ESLint, etc.), CI/CD integration, security quality gates,
 * vulnerability triage, false positive reduction, and continuous security monitoring.
 * @inputs { projectName: string, repositoryUrl?: string, techStack: object, cicdPlatform: string, sastTools?: array, qualityGates?: object, severityThreshold?: string }
 * @outputs { success: boolean, sastConfig: object, qualityGates: array, integrationConfig: object, baselineMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/sast-pipeline', {
 *   projectName: 'E-Commerce API',
 *   repositoryUrl: 'https://github.com/org/ecommerce-api',
 *   techStack: {
 *     language: 'JavaScript',
 *     framework: 'Node.js/Express',
 *     additionalLanguages: ['TypeScript', 'Python']
 *   },
 *   cicdPlatform: 'GitHub Actions',
 *   sastTools: ['SonarQube', 'Semgrep', 'ESLint Security'],
 *   qualityGates: {
 *     blockOnCritical: true,
 *     blockOnHigh: true,
 *     maxCritical: 0,
 *     maxHigh: 5,
 *     maxMedium: 20
 *   },
 *   severityThreshold: 'high',
 *   falsePositiveManagement: true,
 *   incrementalScanning: true,
 *   autoRemediation: false
 * });
 *
 * @references
 * - OWASP SAST: https://owasp.org/www-community/Source_Code_Analysis_Tools
 * - SonarQube: https://www.sonarqube.org/
 * - Semgrep: https://semgrep.dev/
 * - Bandit: https://bandit.readthedocs.io/
 * - ESLint Security: https://github.com/nodesecurity/eslint-plugin-security
 * - NIST SAST Guide: https://csrc.nist.gov/publications/detail/sp/500-268/final
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryUrl = '',
    techStack,
    cicdPlatform,
    sastTools = [],
    qualityGates = {
      blockOnCritical: true,
      blockOnHigh: true,
      maxCritical: 0,
      maxHigh: 5,
      maxMedium: 20
    },
    severityThreshold = 'high',
    falsePositiveManagement = true,
    incrementalScanning = true,
    autoRemediation = false,
    outputDir = 'sast-pipeline-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SAST Pipeline Integration: ${projectName}`);
  ctx.log('info', `Tech Stack: ${techStack.language} / ${techStack.framework || 'N/A'}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}`);

  // ============================================================================
  // PHASE 1: TECHNOLOGY ANALYSIS AND TOOL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing technology stack and selecting SAST tools');

  const toolSelection = await ctx.task(sastToolSelectionTask, {
    projectName,
    repositoryUrl,
    techStack,
    sastTools,
    cicdPlatform,
    outputDir
  });

  artifacts.push(...toolSelection.artifacts);

  // Quality Gate: Tool selection must be validated
  await ctx.breakpoint({
    question: `Phase 1 Complete: Selected ${toolSelection.selectedTools.length} SAST tool(s) for ${techStack.language}. Tools: ${toolSelection.selectedTools.map(t => t.name).join(', ')}. Proceed with configuration?`,
    title: 'SAST Tool Selection Review',
    context: {
      runId: ctx.runId,
      selectedTools: toolSelection.selectedTools,
      languageCoverage: toolSelection.languageCoverage,
      toolCapabilities: toolSelection.capabilities,
      estimatedSetupTime: toolSelection.estimatedSetupTime,
      files: toolSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SAST TOOL CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring SAST tools with security rules');

  const toolConfigurations = await ctx.parallel.all(
    toolSelection.selectedTools.map(tool =>
      () => ctx.task(configureSastToolTask, {
        projectName,
        tool: tool.name,
        techStack,
        securityRules: tool.recommendedRules,
        severityThreshold,
        outputDir
      })
    )
  );

  artifacts.push(...toolConfigurations.flatMap(tc => tc.artifacts));

  // ============================================================================
  // PHASE 3: CI/CD PIPELINE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Integrating SAST tools into CI/CD pipeline');

  const pipelineIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    cicdPlatform,
    sastTools: toolSelection.selectedTools,
    toolConfigurations,
    incrementalScanning,
    repositoryUrl,
    outputDir
  });

  artifacts.push(...pipelineIntegration.artifacts);

  // ============================================================================
  // PHASE 4: QUALITY GATES CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring security quality gates');

  const qualityGatesConfig = await ctx.task(qualityGatesConfigTask, {
    projectName,
    qualityGates,
    severityThreshold,
    cicdPlatform,
    sastTools: toolSelection.selectedTools,
    outputDir
  });

  artifacts.push(...qualityGatesConfig.artifacts);

  // Quality Gate: Review quality gates before baseline
  await ctx.breakpoint({
    question: `Phase 4 Complete: Configured ${qualityGatesConfig.gates.length} quality gate(s). Pipeline will ${qualityGates.blockOnCritical ? 'BLOCK' : 'WARN'} on critical findings. Review gate configuration?`,
    title: 'Quality Gates Review',
    context: {
      runId: ctx.runId,
      gates: qualityGatesConfig.gates,
      thresholds: qualityGatesConfig.thresholds,
      blockingBehavior: qualityGatesConfig.blockingBehavior,
      files: qualityGatesConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: BASELINE SECURITY SCAN
  // ============================================================================

  ctx.log('info', 'Phase 5: Running baseline security scan');

  const baselineScan = await ctx.task(baselineScanTask, {
    projectName,
    repositoryUrl,
    sastTools: toolSelection.selectedTools,
    toolConfigurations,
    outputDir
  });

  artifacts.push(...baselineScan.artifacts);

  const baselineScore = baselineScan.securityScore;
  const criticalCount = baselineScan.findings.filter(f => f.severity === 'critical').length;
  const highCount = baselineScan.findings.filter(f => f.severity === 'high').length;

  // ============================================================================
  // PHASE 6: VULNERABILITY TRIAGE AND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Triaging and classifying security findings');

  const vulnerabilityTriage = await ctx.task(vulnerabilityTriageTask, {
    projectName,
    findings: baselineScan.findings,
    qualityGates,
    outputDir
  });

  artifacts.push(...vulnerabilityTriage.artifacts);

  // Quality Gate: Review triage results
  await ctx.breakpoint({
    question: `Phase 6 Complete: Baseline scan found ${baselineScan.totalFindings} findings (Critical: ${criticalCount}, High: ${highCount}). Security Score: ${baselineScore}/100. ${vulnerabilityTriage.truePositives} confirmed vulnerabilities require remediation. Review triage results?`,
    title: 'Vulnerability Triage Review',
    context: {
      runId: ctx.runId,
      baselineScore,
      totalFindings: baselineScan.totalFindings,
      criticalCount,
      highCount,
      truePositives: vulnerabilityTriage.truePositives,
      falsePositives: vulnerabilityTriage.falsePositives,
      needsReview: vulnerabilityTriage.needsReview,
      files: vulnerabilityTriage.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 7: FALSE POSITIVE REDUCTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing false positive reduction strategies');

  const falsePositiveReduction = await ctx.task(falsePositiveReductionTask, {
    projectName,
    findings: baselineScan.findings,
    triage: vulnerabilityTriage,
    sastTools: toolSelection.selectedTools,
    falsePositiveManagement,
    outputDir
  });

  artifacts.push(...falsePositiveReduction.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING AND DASHBOARD SETUP
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up security reporting and dashboards');

  const reportingSetup = await ctx.task(reportingSetupTask, {
    projectName,
    sastTools: toolSelection.selectedTools,
    cicdPlatform,
    baselineScan,
    vulnerabilityTriage,
    outputDir
  });

  artifacts.push(...reportingSetup.artifacts);

  // ============================================================================
  // PHASE 9: REMEDIATION WORKFLOW CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring vulnerability remediation workflow');

  const remediationWorkflow = await ctx.task(remediationWorkflowTask, {
    projectName,
    cicdPlatform,
    vulnerabilityTriage,
    autoRemediation,
    outputDir
  });

  artifacts.push(...remediationWorkflow.artifacts);

  // ============================================================================
  // PHASE 10: TEAM TRAINING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating training materials and documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    toolSelection,
    toolConfigurations,
    pipelineIntegration,
    qualityGatesConfig,
    baselineScan,
    vulnerabilityTriage,
    falsePositiveReduction,
    reportingSetup,
    remediationWorkflow,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 11: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating SAST pipeline integration');

  const validation = await ctx.task(validationTask, {
    projectName,
    cicdPlatform,
    sastTools: toolSelection.selectedTools,
    pipelineIntegration,
    qualityGatesConfig,
    baselineScan,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.overallScore >= 80;

  // Quality Gate: Validation must pass
  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Phase 11 Warning: Validation score: ${validation.overallScore}/100 (below threshold of 80). ${validation.failedChecks.length} check(s) failed. Review and fix issues before deployment?`,
      title: 'SAST Pipeline Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore: validation.overallScore,
        passedChecks: validation.passedChecks,
        failedChecks: validation.failedChecks,
        recommendations: validation.recommendations,
        files: validation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: FINAL REVIEW AND DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Final review and deployment preparation');

  const finalReview = await ctx.task(finalReviewTask, {
    projectName,
    toolSelection,
    pipelineIntegration,
    qualityGatesConfig,
    baselineScan,
    vulnerabilityTriage,
    falsePositiveReduction,
    documentation,
    validation,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: SAST Pipeline Approval
  await ctx.breakpoint({
    question: `SAST Pipeline Integration Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Baseline security score: ${baselineScore}/100 with ${vulnerabilityTriage.truePositives} vulnerabilities to remediate. Review deliverables and approve for deployment?`,
    title: 'SAST Pipeline Integration Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        cicdPlatform,
        sastTools: toolSelection.selectedTools.map(t => t.name),
        validationScore: validation.overallScore,
        baselineScore,
        totalFindings: baselineScan.totalFindings,
        criticalFindings: criticalCount,
        highFindings: highCount,
        vulnerabilitiesToRemediate: vulnerabilityTriage.truePositives,
        qualityGatesConfigured: qualityGatesConfig.gates.length,
        reportingEnabled: reportingSetup.dashboardEnabled
      },
      nextSteps: finalReview.nextSteps,
      remediationPriorities: finalReview.remediationPriorities,
      files: [
        { path: documentation.setupGuidePath, format: 'markdown', label: 'SAST Setup Guide' },
        { path: documentation.runbookPath, format: 'markdown', label: 'Operations Runbook' },
        { path: documentation.remediationGuidePath, format: 'markdown', label: 'Remediation Guide' },
        { path: validation.reportPath, format: 'json', label: 'Validation Report' },
        { path: finalReview.deploymentChecklistPath, format: 'markdown', label: 'Deployment Checklist' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed && baselineScore >= 60,
    projectName,
    cicdPlatform,
    sastConfig: {
      tools: toolSelection.selectedTools,
      configurations: toolConfigurations,
      languageCoverage: toolSelection.languageCoverage
    },
    qualityGates: qualityGatesConfig.gates,
    integrationConfig: {
      platform: cicdPlatform,
      configFiles: pipelineIntegration.configFiles,
      triggers: pipelineIntegration.triggers,
      incrementalScanning
    },
    baselineMetrics: {
      securityScore: baselineScore,
      totalFindings: baselineScan.totalFindings,
      findingsBySeverity: {
        critical: criticalCount,
        high: highCount,
        medium: baselineScan.findings.filter(f => f.severity === 'medium').length,
        low: baselineScan.findings.filter(f => f.severity === 'low').length
      },
      truePositives: vulnerabilityTriage.truePositives,
      falsePositives: vulnerabilityTriage.falsePositives
    },
    triage: {
      truePositives: vulnerabilityTriage.truePositives,
      falsePositives: vulnerabilityTriage.falsePositives,
      needsReview: vulnerabilityTriage.needsReview,
      suppressionRules: falsePositiveReduction.suppressionRules
    },
    reporting: {
      dashboardEnabled: reportingSetup.dashboardEnabled,
      dashboardUrl: reportingSetup.dashboardUrl,
      reportingChannels: reportingSetup.reportingChannels
    },
    remediation: {
      workflowConfigured: remediationWorkflow.workflowConfigured,
      autoRemediationEnabled: autoRemediation,
      slaByseverity: remediationWorkflow.slaByCategory
    },
    documentation: {
      setupGuide: documentation.setupGuidePath,
      runbook: documentation.runbookPath,
      remediationGuide: documentation.remediationGuidePath,
      trainingMaterials: documentation.trainingMaterialsPaths
    },
    validation: {
      overallScore: validation.overallScore,
      passedChecks: validation.passedChecks,
      failedChecks: validation.failedChecks,
      recommendations: validation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/security-compliance/sast-pipeline',
      timestamp: startTime,
      cicdPlatform,
      sastToolsCount: toolSelection.selectedTools.length,
      qualityGatesCount: qualityGatesConfig.gates.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: SAST Tool Selection
export const sastToolSelectionTask = defineTask('sast-tool-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: SAST Tool Selection - ${args.projectName}`,
  agent: {
    name: 'security-tooling-specialist',
    prompt: {
      role: 'Application Security Engineer specializing in SAST tools',
      task: 'Analyze technology stack and select appropriate SAST tools',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        techStack: args.techStack,
        sastTools: args.sastTools,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze primary and secondary languages in the tech stack',
        '2. Evaluate suggested SAST tools or recommend tools if none provided',
        '3. For each language, recommend specific SAST tools (e.g., SonarQube, Semgrep, Bandit, ESLint Security, Brakeman, SpotBugs)',
        '4. Assess tool capabilities: vulnerability detection, compliance checking, custom rules, IDE integration',
        '5. Evaluate tool compatibility with CI/CD platform',
        '6. Consider open-source vs commercial options based on project needs',
        '7. Assess language coverage and detection accuracy',
        '8. Evaluate false positive rates and tuning capabilities',
        '9. Consider tool licensing and cost implications',
        '10. Assess integration complexity and setup time',
        '11. Recommend tool combinations for comprehensive coverage',
        '12. Document tool selection rationale and trade-offs'
      ],
      outputFormat: 'JSON with selected tools, capabilities, language coverage, and setup estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'languageCoverage', 'capabilities', 'artifacts'],
      properties: {
        selectedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['commercial', 'open-source', 'freemium'] },
              languages: { type: 'array', items: { type: 'string' } },
              primaryUseCase: { type: 'string' },
              detectionCategories: { type: 'array', items: { type: 'string' } },
              recommendedRules: { type: 'array', items: { type: 'string' } },
              integrationMethod: { type: 'string' },
              estimatedSetupTime: { type: 'string' }
            }
          }
        },
        languageCoverage: {
          type: 'object',
          properties: {
            primary: { type: 'array', items: { type: 'string' } },
            secondary: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        capabilities: {
          type: 'object',
          properties: {
            vulnerabilityDetection: { type: 'boolean' },
            complianceChecking: { type: 'boolean' },
            customRules: { type: 'boolean' },
            ideIntegration: { type: 'boolean' },
            incrementalScanning: { type: 'boolean' }
          }
        },
        toolComparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        },
        estimatedSetupTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['security', 'sast', 'tool-selection']
}));

// Phase 2: Configure SAST Tool
export const configureSastToolTask = defineTask('configure-sast-tool', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Configure ${args.tool} - ${args.projectName}`,
  agent: {
    name: 'sast-configuration-engineer',
    prompt: {
      role: `${args.tool} Security Configuration Specialist`,
      task: `Configure ${args.tool} with security rules and quality profiles`,
      context: {
        projectName: args.projectName,
        tool: args.tool,
        techStack: args.techStack,
        securityRules: args.securityRules,
        severityThreshold: args.severityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.tool} configuration file for ${args.techStack.language}`,
        '2. Enable recommended security rules and vulnerability detection',
        '3. Configure severity levels and categorization',
        '4. Set up quality profiles for different security standards (OWASP Top 10, CWE)',
        '5. Configure custom rules if needed for project-specific patterns',
        '6. Set up exclusion patterns for test files, dependencies, generated code',
        '7. Configure scanning scope and file patterns',
        '8. Set up incremental scanning capabilities',
        '9. Configure reporting format and output locations',
        '10. Set up authentication and API keys if required',
        '11. Configure integration with issue tracking systems',
        '12. Generate tool configuration file and documentation'
      ],
      outputFormat: 'JSON with tool configuration, enabled rules, and quality profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['configFile', 'enabledRules', 'qualityProfiles', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        configFile: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            format: { type: 'string' },
            content: { type: 'string' }
          }
        },
        enabledRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              enabled: { type: 'boolean' }
            }
          }
        },
        qualityProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              standard: { type: 'string' },
              rulesCount: { type: 'number' }
            }
          }
        },
        exclusionPatterns: { type: 'array', items: { type: 'string' } },
        scanningScope: {
          type: 'object',
          properties: {
            includePatterns: { type: 'array', items: { type: 'string' } },
            excludePatterns: { type: 'array', items: { type: 'string' } }
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
  labels: ['security', 'sast', 'configuration', args.tool.toLowerCase()]
}));

// Phase 3: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'cicd-security-engineer',
    prompt: {
      role: 'DevSecOps Engineer specializing in CI/CD security integration',
      task: 'Integrate SAST tools into CI/CD pipeline',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        sastTools: args.sastTools,
        toolConfigurations: args.toolConfigurations,
        incrementalScanning: args.incrementalScanning,
        repositoryUrl: args.repositoryUrl,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.cicdPlatform} pipeline configuration for SAST integration`,
        '2. Configure pipeline triggers (push, pull request, scheduled scans)',
        '3. Set up SAST scan stages in the pipeline',
        '4. Configure parallel execution of multiple SAST tools if applicable',
        '5. Set up incremental/differential scanning for pull requests',
        '6. Configure full scanning for main branch and scheduled runs',
        '7. Set up artifact collection for scan results',
        '8. Configure result aggregation and normalization',
        '9. Set up authentication and secrets management',
        '10. Configure pipeline failure conditions based on findings',
        '11. Set up caching for faster subsequent scans',
        '12. Generate pipeline configuration files and integration documentation'
      ],
      outputFormat: 'JSON with pipeline configuration, triggers, and integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['configFiles', 'triggers', 'scanStages', 'artifacts'],
      properties: {
        configFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              platform: { type: 'string' },
              format: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        triggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['push', 'pull_request', 'schedule', 'manual'] },
              branches: { type: 'array', items: { type: 'string' } },
              schedule: { type: 'string' },
              scanMode: { type: 'string', enum: ['full', 'incremental'] }
            }
          }
        },
        scanStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tool: { type: 'string' },
              executionOrder: { type: 'number' },
              parallel: { type: 'boolean' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        cachingStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            cacheKeys: { type: 'array', items: { type: 'string' } },
            cachePaths: { type: 'array', items: { type: 'string' } }
          }
        },
        secretsManagement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              required: { type: 'boolean' },
              description: { type: 'string' }
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
  labels: ['security', 'sast', 'cicd', 'integration']
}));

// Phase 4: Quality Gates Configuration
export const qualityGatesConfigTask = defineTask('quality-gates-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Quality Gates Configuration - ${args.projectName}`,
  agent: {
    name: 'security-quality-engineer',
    prompt: {
      role: 'Security Quality Assurance Engineer',
      task: 'Configure security quality gates for the CI/CD pipeline',
      context: {
        projectName: args.projectName,
        qualityGates: args.qualityGates,
        severityThreshold: args.severityThreshold,
        cicdPlatform: args.cicdPlatform,
        sastTools: args.sastTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define quality gate criteria based on vulnerability severity',
        '2. Configure blocking gates for critical and high severity findings',
        '3. Set up warning gates for medium severity findings',
        '4. Configure thresholds for maximum allowed vulnerabilities by severity',
        '5. Set up security score thresholds (e.g., minimum score of 70/100)',
        '6. Configure compliance gates for security standards (OWASP, CWE)',
        '7. Set up code coverage requirements for security tests',
        '8. Configure new vulnerability detection gates (fail on new issues)',
        '9. Set up grace periods for existing vulnerabilities',
        '10. Configure gate bypass procedures for exceptions',
        '11. Set up gate result reporting and notifications',
        '12. Generate quality gates configuration and documentation'
      ],
      outputFormat: 'JSON with quality gates, thresholds, and blocking behavior'
    },
    outputSchema: {
      type: 'object',
      required: ['gates', 'thresholds', 'blockingBehavior', 'artifacts'],
      properties: {
        gates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['blocking', 'warning', 'informational'] },
              condition: { type: 'string' },
              threshold: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              action: { type: 'string', enum: ['fail', 'warn', 'pass'] }
            }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            minimumSecurityScore: { type: 'number' }
          }
        },
        blockingBehavior: {
          type: 'object',
          properties: {
            blockOnCritical: { type: 'boolean' },
            blockOnHigh: { type: 'boolean' },
            blockOnNew: { type: 'boolean' },
            gracePeriodDays: { type: 'number' }
          }
        },
        complianceGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              minimumCompliance: { type: 'number' },
              blocking: { type: 'boolean' }
            }
          }
        },
        bypassProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              approvalRequired: { type: 'boolean' },
              approvers: { type: 'array', items: { type: 'string' } }
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
  labels: ['security', 'sast', 'quality-gates']
}));

// Phase 5: Baseline Security Scan
export const baselineScanTask = defineTask('baseline-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Baseline Security Scan - ${args.projectName}`,
  agent: {
    name: 'security-scanner',
    prompt: {
      role: 'Security Scanning Specialist',
      task: 'Execute baseline SAST scan and analyze results',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        sastTools: args.sastTools,
        toolConfigurations: args.toolConfigurations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute SAST scans with all configured tools',
        '2. Collect and aggregate scan results from all tools',
        '3. Normalize findings across different tool formats',
        '4. Categorize findings by severity (critical, high, medium, low)',
        '5. Categorize findings by vulnerability type (injection, XSS, CSRF, etc.)',
        '6. Map findings to security standards (OWASP Top 10, CWE)',
        '7. Calculate baseline security score (0-100)',
        '8. Identify code hotspots with multiple vulnerabilities',
        '9. Analyze trends and patterns in findings',
        '10. Generate detailed findings report with source code context',
        '11. Create executive summary of security posture',
        '12. Generate baseline metrics for tracking improvements'
      ],
      outputFormat: 'JSON with scan results, findings, and security metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFindings', 'findings', 'securityScore', 'artifacts'],
      properties: {
        totalFindings: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tool: { type: 'string' },
              ruleId: { type: 'string' },
              ruleName: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string' },
              cwe: { type: 'string' },
              owaspCategory: { type: 'string' },
              filePath: { type: 'string' },
              lineNumber: { type: 'number' },
              message: { type: 'string' },
              codeSnippet: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        findingsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            info: { type: 'number' }
          }
        },
        findingsByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        securityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        codeHotspots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              findingsCount: { type: 'number' },
              severities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complianceMapping: {
          type: 'object',
          properties: {
            owaspTop10: { type: 'array', items: { type: 'string' } },
            cweTop25: { type: 'array', items: { type: 'string' } }
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
  labels: ['security', 'sast', 'baseline-scan']
}));

// Phase 6: Vulnerability Triage
export const vulnerabilityTriageTask = defineTask('vulnerability-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Vulnerability Triage - ${args.projectName}`,
  agent: {
    name: 'security-triager',
    prompt: {
      role: 'Security Vulnerability Analyst',
      task: 'Triage and classify security findings',
      context: {
        projectName: args.projectName,
        findings: args.findings,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review each finding for validity and exploitability',
        '2. Classify findings as true positive, false positive, or needs review',
        '3. Assess exploitability and actual risk in the context of the application',
        '4. Prioritize findings based on risk (consider CVSS, exploitability, business impact)',
        '5. Identify duplicate findings across different tools',
        '6. Group related findings by vulnerability type',
        '7. Assign ownership for remediation',
        '8. Set remediation SLAs based on severity',
        '9. Document false positive justifications',
        '10. Create tracking tickets for confirmed vulnerabilities',
        '11. Generate triage summary with statistics',
        '12. Create prioritized remediation backlog'
      ],
      outputFormat: 'JSON with triaged findings, classifications, and priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['truePositives', 'falsePositives', 'needsReview', 'prioritizedFindings', 'artifacts'],
      properties: {
        truePositives: { type: 'number' },
        falsePositives: { type: 'number' },
        needsReview: { type: 'number' },
        prioritizedFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              classification: { type: 'string', enum: ['true-positive', 'false-positive', 'needs-review'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              exploitability: { type: 'string', enum: ['high', 'medium', 'low'] },
              businessImpact: { type: 'string', enum: ['high', 'medium', 'low'] },
              riskScore: { type: 'number', minimum: 0, maximum: 10 },
              assignedTo: { type: 'string' },
              remediationSLA: { type: 'string' },
              justification: { type: 'string' },
              trackingTicket: { type: 'string' }
            }
          }
        },
        duplicateGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              primaryFindingId: { type: 'string' },
              duplicateIds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        remediationBacklog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerability: { type: 'string' },
              count: { type: 'number' },
              priority: { type: 'string' },
              estimatedEffort: { type: 'string' }
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
  labels: ['security', 'sast', 'triage']
}));

// Phase 7: False Positive Reduction
export const falsePositiveReductionTask = defineTask('false-positive-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: False Positive Reduction - ${args.projectName}`,
  agent: {
    name: 'sast-tuning-specialist',
    prompt: {
      role: 'SAST Tool Tuning Specialist',
      task: 'Implement strategies to reduce false positives',
      context: {
        projectName: args.projectName,
        findings: args.findings,
        triage: args.triage,
        sastTools: args.sastTools,
        falsePositiveManagement: args.falsePositiveManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze false positive patterns and root causes',
        '2. Create suppression rules for confirmed false positives',
        '3. Refine tool configurations to reduce noise',
        '4. Configure context-aware scanning rules',
        '5. Set up file and code path exclusions',
        '6. Configure sanitizer and validation framework recognition',
        '7. Create custom rules for project-specific patterns',
        '8. Implement inline suppression comments with justifications',
        '9. Set up periodic review of suppressed findings',
        '10. Document suppression rationale and approval process',
        '11. Calculate false positive rate improvement',
        '12. Generate updated tool configurations and suppression files'
      ],
      outputFormat: 'JSON with suppression rules, configuration updates, and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['suppressionRules', 'configurationUpdates', 'falsePositiveRate', 'artifacts'],
      properties: {
        suppressionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              ruleId: { type: 'string' },
              suppressionType: { type: 'string', enum: ['global', 'file', 'line', 'pattern'] },
              pattern: { type: 'string' },
              justification: { type: 'string' },
              approvedBy: { type: 'string' },
              reviewDate: { type: 'string' }
            }
          }
        },
        configurationUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              configFile: { type: 'string' },
              changes: { type: 'array', items: { type: 'string' } },
              expectedImpact: { type: 'string' }
            }
          }
        },
        exclusionPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              type: { type: 'string', enum: ['file', 'directory', 'code-pattern'] },
              reason: { type: 'string' }
            }
          }
        },
        falsePositiveRate: {
          type: 'object',
          properties: {
            before: { type: 'number' },
            after: { type: 'number' },
            improvement: { type: 'number' }
          }
        },
        customRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              ruleId: { type: 'string' },
              name: { type: 'string' },
              pattern: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        reviewProcess: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            reviewers: { type: 'array', items: { type: 'string' } },
            criteria: { type: 'array', items: { type: 'string' } }
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
  labels: ['security', 'sast', 'false-positive-reduction']
}));

// Phase 8: Reporting Setup
export const reportingSetupTask = defineTask('reporting-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Reporting and Dashboard Setup - ${args.projectName}`,
  agent: {
    name: 'security-reporting-specialist',
    prompt: {
      role: 'Security Metrics and Reporting Specialist',
      task: 'Set up security reporting and dashboards',
      context: {
        projectName: args.projectName,
        sastTools: args.sastTools,
        cicdPlatform: args.cicdPlatform,
        baselineScan: args.baselineScan,
        vulnerabilityTriage: args.vulnerabilityTriage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure automated reporting for SAST scan results',
        '2. Set up security dashboard with key metrics',
        '3. Configure trend analysis and historical tracking',
        '4. Set up vulnerability aging reports',
        '5. Configure compliance reporting (OWASP, CWE coverage)',
        '6. Set up executive summary reports',
        '7. Configure detailed technical reports for developers',
        '8. Set up notification channels (email, Slack, Teams)',
        '9. Configure report scheduling and distribution',
        '10. Set up integration with security information systems',
        '11. Configure custom metrics and KPIs',
        '12. Generate reporting configuration and dashboard templates'
      ],
      outputFormat: 'JSON with reporting configuration and dashboard details'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardEnabled', 'reportingChannels', 'artifacts'],
      properties: {
        dashboardEnabled: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        dashboardMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              type: { type: 'string', enum: ['gauge', 'counter', 'trend', 'distribution'] },
              description: { type: 'string' }
            }
          }
        },
        reportingChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string', enum: ['email', 'slack', 'teams', 'jira', 'webhook'] },
              recipients: { type: 'array', items: { type: 'string' } },
              reportTypes: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string', enum: ['immediate', 'daily', 'weekly', 'on-scan'] }
            }
          }
        },
        reportTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              audience: { type: 'string', enum: ['executive', 'technical', 'compliance'] },
              format: { type: 'string', enum: ['pdf', 'html', 'json', 'csv'] },
              sections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'number' },
              current: { type: 'number' },
              trend: { type: 'string', enum: ['improving', 'stable', 'degrading'] }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              enabled: { type: 'boolean' },
              syncFrequency: { type: 'string' }
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
  labels: ['security', 'sast', 'reporting', 'dashboards']
}));

// Phase 9: Remediation Workflow
export const remediationWorkflowTask = defineTask('remediation-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Remediation Workflow - ${args.projectName}`,
  agent: {
    name: 'remediation-workflow-engineer',
    prompt: {
      role: 'Security Remediation Process Engineer',
      task: 'Configure vulnerability remediation workflow',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        vulnerabilityTriage: args.vulnerabilityTriage,
        autoRemediation: args.autoRemediation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design remediation workflow with clear stages',
        '2. Configure automatic ticket creation for vulnerabilities',
        '3. Set up assignment rules based on component ownership',
        '4. Configure remediation SLAs by severity level',
        '5. Set up escalation procedures for missed SLAs',
        '6. Configure auto-remediation for common patterns if enabled',
        '7. Set up fix validation and verification process',
        '8. Configure retest workflows after fixes',
        '9. Set up metrics tracking for remediation performance',
        '10. Configure remediation guidance and code examples',
        '11. Set up knowledge base for common vulnerabilities',
        '12. Generate workflow documentation and runbooks'
      ],
      outputFormat: 'JSON with remediation workflow configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['workflowConfigured', 'slaByCategory', 'artifacts'],
      properties: {
        workflowConfigured: { type: 'boolean' },
        workflowStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string', enum: ['detected', 'triaged', 'assigned', 'in-progress', 'fixed', 'verified', 'closed'] },
              actions: { type: 'array', items: { type: 'string' } },
              automations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ticketingIntegration: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            autoCreate: { type: 'boolean' },
            ticketTemplate: { type: 'string' },
            labelsAndTags: { type: 'array', items: { type: 'string' } }
          }
        },
        assignmentRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              assignTo: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        slaByCategory: {
          type: 'object',
          properties: {
            critical: { type: 'string' },
            high: { type: 'string' },
            medium: { type: 'string' },
            low: { type: 'string' }
          }
        },
        escalationProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              slaBreachThreshold: { type: 'string' },
              escalateTo: { type: 'string' },
              notificationChannel: { type: 'string' }
            }
          }
        },
        autoRemediationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerabilityType: { type: 'string' },
              pattern: { type: 'string' },
              fixTemplate: { type: 'string' },
              requiresReview: { type: 'boolean' }
            }
          }
        },
        remediationGuidance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerabilityType: { type: 'string' },
              description: { type: 'string' },
              fixExamples: { type: 'array', items: { type: 'string' } },
              references: { type: 'array', items: { type: 'string' } }
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
  labels: ['security', 'sast', 'remediation', 'workflow']
}));

// Phase 10: Documentation
export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  agent: {
    name: 'security-technical-writer',
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Create comprehensive SAST pipeline documentation',
      context: {
        projectName: args.projectName,
        toolSelection: args.toolSelection,
        toolConfigurations: args.toolConfigurations,
        pipelineIntegration: args.pipelineIntegration,
        qualityGatesConfig: args.qualityGatesConfig,
        baselineScan: args.baselineScan,
        vulnerabilityTriage: args.vulnerabilityTriage,
        falsePositiveReduction: args.falsePositiveReduction,
        reportingSetup: args.reportingSetup,
        remediationWorkflow: args.remediationWorkflow,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SAST setup guide with step-by-step instructions',
        '2. Document tool configurations and customizations',
        '3. Create pipeline integration guide',
        '4. Document quality gates and failure criteria',
        '5. Create vulnerability remediation guide with code examples',
        '6. Document false positive management procedures',
        '7. Create operations runbook for SAST maintenance',
        '8. Document reporting and dashboard usage',
        '9. Create troubleshooting guide for common issues',
        '10. Develop training materials for development team',
        '11. Create security champion onboarding guide',
        '12. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['setupGuidePath', 'runbookPath', 'remediationGuidePath', 'artifacts'],
      properties: {
        setupGuidePath: { type: 'string' },
        runbookPath: { type: 'string' },
        remediationGuidePath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        trainingMaterialsPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              audience: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              filePath: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['security', 'sast', 'documentation']
}));

// Phase 11: Validation
export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: SAST Pipeline Validation - ${args.projectName}`,
  agent: {
    name: 'security-qa-engineer',
    prompt: {
      role: 'Security QA Engineer',
      task: 'Validate SAST pipeline integration',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        sastTools: args.sastTools,
        pipelineIntegration: args.pipelineIntegration,
        qualityGatesConfig: args.qualityGatesConfig,
        baselineScan: args.baselineScan,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate all SAST tools are correctly configured',
        '2. Test pipeline integration on sample commits',
        '3. Verify quality gates trigger correctly',
        '4. Test incremental scanning functionality',
        '5. Validate scan result aggregation and normalization',
        '6. Test reporting and notification channels',
        '7. Verify false positive suppression works correctly',
        '8. Test remediation workflow automation',
        '9. Validate dashboard metrics and visualizations',
        '10. Check performance and scan duration',
        '11. Calculate overall validation score (0-100)',
        '12. Generate validation report with pass/fail criteria'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'failedChecks', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        passedChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        failedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageScanDuration: { type: 'string' },
            incrementalScanDuration: { type: 'string' },
            resourceUsage: { type: 'string' }
          }
        },
        functionalTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              passed: { type: 'boolean' },
              details: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
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
  labels: ['security', 'sast', 'validation']
}));

// Phase 12: Final Review
export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Final Review - ${args.projectName}`,
  agent: {
    name: 'security-lead',
    prompt: {
      role: 'Security Team Lead',
      task: 'Conduct final review and prepare deployment',
      context: {
        projectName: args.projectName,
        toolSelection: args.toolSelection,
        pipelineIntegration: args.pipelineIntegration,
        qualityGatesConfig: args.qualityGatesConfig,
        baselineScan: args.baselineScan,
        vulnerabilityTriage: args.vulnerabilityTriage,
        falsePositiveReduction: args.falsePositiveReduction,
        documentation: args.documentation,
        validation: args.validation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all SAST pipeline components',
        '2. Verify validation checks passed',
        '3. Review baseline scan results and triage',
        '4. Verify quality gates are appropriately configured',
        '5. Check documentation completeness',
        '6. Create deployment checklist',
        '7. Define next steps for pipeline activation',
        '8. Prioritize vulnerabilities for remediation',
        '9. Identify training needs for the team',
        '10. Create handoff documentation',
        '11. Define success criteria and KPIs',
        '12. Generate final review report'
      ],
      outputFormat: 'JSON with final review and next steps'
    },
    outputSchema: {
      type: 'object',
      required: ['nextSteps', 'remediationPriorities', 'deploymentChecklistPath', 'artifacts'],
      properties: {
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        remediationPriorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerability: { type: 'string' },
              count: { type: 'number' },
              severity: { type: 'string' },
              priority: { type: 'number' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        deploymentChecklistPath: { type: 'string' },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementFrequency: { type: 'string' }
            }
          }
        },
        trainingPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              audience: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['security', 'sast', 'final-review']
}));
