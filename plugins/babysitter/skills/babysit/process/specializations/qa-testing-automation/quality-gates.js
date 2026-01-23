/**
 * @process qa-testing-automation/quality-gates
 * @description Comprehensive quality gate implementation process with gate definition, enforcement, automation, monitoring, and continuous improvement
 * @category Quality Gates
 * @priority High
 * @complexity Medium-High
 * @inputs { projectPath: string, qualityStandards: object, gateTypes: array, enforcementLevel: string, cicdPlatform: string }
 * @outputs { success: boolean, gatesImplemented: array, enforcementMetrics: object, monitoringSetup: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    qualityStandards = {
      testCoverage: 80,
      codeQuality: 'A',
      security: 'high',
      performance: 'acceptable'
    },
    gateTypes = ['commit', 'pull-request', 'pre-merge', 'pre-deployment', 'post-deployment'],
    enforcementLevel = 'blocking', // 'blocking', 'warning', 'informational'
    cicdPlatform = 'github-actions', // 'github-actions', 'gitlab-ci', 'jenkins', 'azure-devops'
    targetEnvironments = ['development', 'staging', 'production'],
    outputDir = 'quality-gates-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let gatesImplemented = [];

  ctx.log('info', 'Starting Quality Gate Implementation Process');
  ctx.log('info', `Project: ${projectPath}`);
  ctx.log('info', `Enforcement Level: ${enforcementLevel}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}`);

  // ============================================================================
  // PHASE 1: QUALITY STANDARDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing quality standards and requirements');
  const standardsAnalysis = await ctx.task(analyzeQualityStandardsTask, {
    projectPath,
    qualityStandards,
    gateTypes,
    targetEnvironments,
    outputDir
  });

  artifacts.push(...standardsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: GATE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining quality gate criteria and thresholds');
  const gateDefinition = await ctx.task(defineQualityGatesTask, {
    projectPath,
    qualityStandards,
    gateTypes,
    standardsAnalysis,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...gateDefinition.artifacts);
  gatesImplemented = gateDefinition.gates;

  // ============================================================================
  // PHASE 3: GATE AUTOMATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing automated quality gate checks');
  const automationImplementation = await ctx.task(implementGateAutomationTask, {
    projectPath,
    gates: gateDefinition.gates,
    cicdPlatform,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...automationImplementation.artifacts);

  // ============================================================================
  // PHASE 4: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Integrating quality gates with CI/CD pipeline');
  const cicdIntegration = await ctx.task(integrateCicdTask, {
    projectPath,
    gates: gateDefinition.gates,
    cicdPlatform,
    automation: automationImplementation,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 5: MONITORING AND REPORTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up quality gate monitoring and reporting');
  const monitoringSetup = await ctx.task(setupMonitoringTask, {
    projectPath,
    gates: gateDefinition.gates,
    cicdPlatform,
    targetEnvironments,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 6: EXCEPTION HANDLING PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing exception handling and override process');
  const exceptionProcess = await ctx.task(defineExceptionProcessTask, {
    projectPath,
    gates: gateDefinition.gates,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...exceptionProcess.artifacts);

  // ============================================================================
  // PHASE 7: TEAM DOCUMENTATION AND TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating documentation and training materials');
  const documentation = await ctx.task(createDocumentationTask, {
    projectPath,
    gates: gateDefinition.gates,
    automation: automationImplementation,
    cicdIntegration,
    monitoringSetup,
    exceptionProcess,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 8: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating quality gate implementation');
  const validation = await ctx.task(validateImplementationTask, {
    projectPath,
    gates: gateDefinition.gates,
    automation: automationImplementation,
    cicdIntegration,
    monitoringSetup,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const implementationSuccess = validation.overallSuccess;
  const validationScore = validation.validationScore;

  // Breakpoint: Review quality gate implementation
  await ctx.breakpoint({
    question: `Quality gates implementation complete. Validation score: ${validationScore}/100. ${implementationSuccess ? 'All gates validated successfully!' : 'Some gates require attention.'} Review and approve?`,
    title: 'Quality Gates Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        validationScore,
        implementationSuccess,
        gatesCount: gatesImplemented.length,
        enforcementLevel,
        cicdPlatform,
        totalArtifacts: artifacts.length,
        criticalIssues: validation.criticalIssues?.length || 0,
        warnings: validation.warnings?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 9: ROLLOUT PLANNING (if successful)
  // ============================================================================

  let rolloutPlan = null;
  if (implementationSuccess && validationScore >= 80) {
    ctx.log('info', 'Phase 9: Creating phased rollout plan');
    rolloutPlan = await ctx.task(createRolloutPlanTask, {
      projectPath,
      gates: gateDefinition.gates,
      validation,
      targetEnvironments,
      outputDir
    });
    artifacts.push(...rolloutPlan.artifacts);
  }

  // ============================================================================
  // PHASE 10: CONTINUOUS IMPROVEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Establishing continuous improvement process');
  const continuousImprovement = await ctx.task(setupContinuousImprovementTask, {
    projectPath,
    gates: gateDefinition.gates,
    monitoringSetup,
    validation,
    outputDir
  });

  artifacts.push(...continuousImprovement.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: implementationSuccess,
    projectPath,
    enforcementLevel,
    cicdPlatform,
    validationScore,
    gatesImplemented: gatesImplemented.map(g => ({
      name: g.name,
      type: g.type,
      stage: g.stage,
      criteria: g.criteria.length,
      automated: g.automated,
      blocking: g.blocking
    })),
    standardsAnalysis: {
      industryBenchmarks: standardsAnalysis.industryBenchmarks,
      gapAnalysis: standardsAnalysis.gapAnalysis,
      recommendations: standardsAnalysis.recommendations
    },
    gateDefinition: {
      totalGates: gateDefinition.gates.length,
      gatesByType: gateDefinition.gatesByType,
      totalCriteria: gateDefinition.totalCriteria,
      automationCoverage: gateDefinition.automationCoverage
    },
    automation: {
      toolsIntegrated: automationImplementation.toolsIntegrated,
      scriptsCreated: automationImplementation.scriptsCreated,
      hooksConfigured: automationImplementation.hooksConfigured,
      executionTime: automationImplementation.averageExecutionTime
    },
    cicdIntegration: {
      pipelinesModified: cicdIntegration.pipelinesModified,
      stagesAdded: cicdIntegration.stagesAdded,
      parallelization: cicdIntegration.parallelizationEnabled,
      failFastEnabled: cicdIntegration.failFastEnabled
    },
    monitoringSetup: {
      dashboards: monitoringSetup.dashboards,
      alerts: monitoringSetup.alerts,
      metricsCollected: monitoringSetup.metricsCollected,
      reportingCadence: monitoringSetup.reportingCadence
    },
    exceptionProcess: {
      overridePolicy: exceptionProcess.overridePolicy,
      approvalWorkflow: exceptionProcess.approvalWorkflow,
      auditLogging: exceptionProcess.auditLogging
    },
    validation: {
      overallScore: validationScore,
      criticalIssues: validation.criticalIssues,
      warnings: validation.warnings,
      testsPassed: validation.testsPassed,
      testsFailed: validation.testsFailed
    },
    rolloutPlan: rolloutPlan ? {
      phases: rolloutPlan.phases,
      timeline: rolloutPlan.timeline,
      rollbackPlan: rolloutPlan.rollbackPlan
    } : null,
    continuousImprovement: {
      reviewCadence: continuousImprovement.reviewCadence,
      optimizationOpportunities: continuousImprovement.optimizationOpportunities,
      feedbackLoop: continuousImprovement.feedbackLoop
    },
    artifacts,
    duration,
    metadata: {
      processId: 'qa-testing-automation/quality-gates',
      timestamp: startTime,
      projectPath,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Analyze Quality Standards
export const analyzeQualityStandardsTask = defineTask('analyze-quality-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze quality standards and requirements',
  agent: {
    name: 'quality-standards-analyst',
    prompt: {
      role: 'senior quality engineer and standards specialist',
      task: 'Analyze project quality requirements, industry benchmarks, and regulatory requirements to establish comprehensive quality standards baseline',
      context: args,
      instructions: [
        'Review project-specific quality requirements and constraints',
        'Research industry benchmarks for similar projects (test coverage, code quality, security)',
        'Identify applicable regulatory and compliance requirements (GDPR, HIPAA, PCI-DSS, SOC2)',
        'Analyze current quality metrics baseline if available',
        'Identify quality gaps between current state and target standards',
        'Map quality standards to gate types (commit, PR, pre-merge, deployment)',
        'Consider technical stack and project maturity in standards definition',
        'Define measurable quality criteria for each standard',
        'Provide recommendations for achievable quality targets',
        'Generate quality standards analysis report'
      ],
      outputFormat: 'JSON with industryBenchmarks (object), currentBaseline (object), gapAnalysis (object), recommendations (array), measurableCriteria (object), regulatoryRequirements (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['industryBenchmarks', 'gapAnalysis', 'recommendations', 'measurableCriteria', 'artifacts'],
      properties: {
        industryBenchmarks: {
          type: 'object',
          properties: {
            testCoverage: { type: 'object', properties: { average: { type: 'number' }, high: { type: 'number' } } },
            codeQuality: { type: 'object', properties: { averageGrade: { type: 'string' }, highGrade: { type: 'string' } } },
            securityScore: { type: 'object', properties: { average: { type: 'number' }, high: { type: 'number' } } },
            buildTime: { type: 'object', properties: { average: { type: 'string' }, fast: { type: 'string' } } }
          }
        },
        currentBaseline: {
          type: 'object',
          properties: {
            testCoverage: { type: 'number' },
            codeQuality: { type: 'string' },
            securityScore: { type: 'number' },
            buildTime: { type: 'string' }
          }
        },
        gapAnalysis: {
          type: 'object',
          properties: {
            testCoverageGap: { type: 'number' },
            codeQualityGap: { type: 'string' },
            securityGap: { type: 'string' },
            criticalGaps: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string' }
            }
          }
        },
        measurableCriteria: {
          type: 'object',
          properties: {
            testCoverage: { type: 'object', properties: { threshold: { type: 'number' }, measurement: { type: 'string' } } },
            codeComplexity: { type: 'object', properties: { threshold: { type: 'number' }, measurement: { type: 'string' } } },
            duplication: { type: 'object', properties: { threshold: { type: 'number' }, measurement: { type: 'string' } } },
            securityVulnerabilities: { type: 'object', properties: { threshold: { type: 'number' }, measurement: { type: 'string' } } },
            performanceBudget: { type: 'object', properties: { threshold: { type: 'string' }, measurement: { type: 'string' } } }
          }
        },
        regulatoryRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-gates', 'standards-analysis']
}));

// Task 2: Define Quality Gates
export const defineQualityGatesTask = defineTask('define-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality gate criteria and thresholds',
  agent: {
    name: 'gate-architect',
    prompt: {
      role: 'quality gate architect and process engineer',
      task: 'Design comprehensive quality gate framework with specific criteria, thresholds, and enforcement rules for each gate type',
      context: args,
      instructions: [
        'Define gate types based on SDLC stages: commit, pull-request, pre-merge, pre-deployment, post-deployment',
        'For COMMIT gates: fast checks (lint, format, unit tests, pre-commit hooks)',
        'For PULL REQUEST gates: comprehensive checks (all tests, coverage, code review, security scan)',
        'For PRE-MERGE gates: integration tests, performance tests, quality thresholds',
        'For PRE-DEPLOYMENT gates: smoke tests, environment validation, rollback readiness',
        'For POST-DEPLOYMENT gates: health checks, monitoring validation, rollback triggers',
        'Define specific measurable criteria for each gate (pass/fail conditions)',
        'Set appropriate thresholds based on standards analysis',
        'Determine gate enforcement level (blocking, warning, informational)',
        'Define gate dependencies and sequencing',
        'Create gate execution order and parallelization strategy',
        'Document gate bypass/override policies',
        'Calculate estimated gate execution times',
        'Generate comprehensive gate definition document'
      ],
      outputFormat: 'JSON with gates (array), gatesByType (object), totalCriteria (number), automationCoverage (number), executionStrategy (object), bypassPolicy (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['gates', 'gatesByType', 'totalCriteria', 'automationCoverage', 'artifacts'],
      properties: {
        gates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['commit', 'pull-request', 'pre-merge', 'pre-deployment', 'post-deployment'] },
              stage: { type: 'string' },
              description: { type: 'string' },
              criteria: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    criterion: { type: 'string' },
                    threshold: { type: 'string' },
                    measurement: { type: 'string' },
                    blocking: { type: 'boolean' },
                    tool: { type: 'string' }
                  }
                }
              },
              executionOrder: { type: 'number' },
              estimatedTime: { type: 'string' },
              automated: { type: 'boolean' },
              blocking: { type: 'boolean' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gatesByType: {
          type: 'object',
          properties: {
            commit: { type: 'number' },
            pullRequest: { type: 'number' },
            preMerge: { type: 'number' },
            preDeployment: { type: 'number' },
            postDeployment: { type: 'number' }
          }
        },
        totalCriteria: { type: 'number' },
        automationCoverage: { type: 'number', minimum: 0, maximum: 100 },
        executionStrategy: {
          type: 'object',
          properties: {
            parallelization: { type: 'boolean' },
            failFast: { type: 'boolean' },
            estimatedTotalTime: { type: 'string' }
          }
        },
        bypassPolicy: {
          type: 'object',
          properties: {
            allowBypass: { type: 'boolean' },
            bypassableGates: { type: 'array', items: { type: 'string' } },
            approvalRequired: { type: 'boolean' },
            auditLogging: { type: 'boolean' }
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
  labels: ['agent', 'quality-gates', 'gate-definition']
}));

// Task 3: Implement Gate Automation
export const implementGateAutomationTask = defineTask('implement-gate-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement automated quality gate checks',
  agent: {
    name: 'automation-engineer',
    prompt: {
      role: 'DevOps automation engineer and quality tooling specialist',
      task: 'Implement automated checks, scripts, and tooling for each quality gate',
      context: args,
      instructions: [
        'Set up pre-commit hooks using Husky or similar (commit gates)',
        'Configure Git hooks for linting, formatting, unit tests',
        'Implement test runners and coverage tools (Jest, pytest, JUnit)',
        'Configure static analysis tools (ESLint, Pylint, SonarQube)',
        'Set up security scanning (Snyk, OWASP Dependency-Check, Trivy)',
        'Configure code complexity analyzers (Radon, Code Climate)',
        'Implement performance testing tools (Lighthouse, k6, JMeter)',
        'Set up container/dependency scanning for deployments',
        'Create custom gate scripts for project-specific checks',
        'Configure tool integrations and API connections',
        'Implement gate result aggregation and reporting',
        'Set up caching strategies to optimize execution time',
        'Create gate execution orchestration scripts',
        'Document all automation configurations and dependencies'
      ],
      outputFormat: 'JSON with toolsIntegrated (array), scriptsCreated (array), hooksConfigured (array), configurations (object), averageExecutionTime (string), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsIntegrated', 'scriptsCreated', 'hooksConfigured', 'averageExecutionTime', 'artifacts'],
      properties: {
        toolsIntegrated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              gateType: { type: 'string' },
              configFile: { type: 'string' },
              version: { type: 'string' },
              integrated: { type: 'boolean' }
            }
          }
        },
        scriptsCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              script: { type: 'string' },
              purpose: { type: 'string' },
              language: { type: 'string' },
              executionTime: { type: 'string' }
            }
          }
        },
        hooksConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              checks: { type: 'array', items: { type: 'string' } },
              executionTime: { type: 'string' },
              canSkip: { type: 'boolean' }
            }
          }
        },
        configurations: {
          type: 'object',
          properties: {
            preCommit: { type: 'object' },
            cicd: { type: 'object' },
            monitoring: { type: 'object' }
          }
        },
        averageExecutionTime: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-gates', 'automation']
}));

// Task 4: Integrate with CI/CD
export const integrateCicdTask = defineTask('integrate-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate quality gates with CI/CD pipeline',
  agent: {
    name: 'cicd-integration-specialist',
    prompt: {
      role: 'CI/CD architect and pipeline engineer',
      task: 'Integrate quality gates into CI/CD pipeline with proper staging, parallelization, and failure handling',
      context: args,
      instructions: [
        'Analyze existing CI/CD pipeline configuration',
        'Define pipeline stages for quality gates (build, test, quality, security, deploy)',
        'Integrate commit gates into pre-push hooks',
        'Add pull request gates as PR checks (GitHub Actions, GitLab CI)',
        'Implement pre-merge gates as required status checks',
        'Add pre-deployment gates to deployment workflows',
        'Configure post-deployment gates as smoke tests and health checks',
        'Set up parallel execution for independent gates',
        'Implement fail-fast behavior for critical gates',
        'Configure gate result reporting and status badges',
        'Set up pipeline notifications for gate failures',
        'Implement deployment blocking based on gate results',
        'Create pipeline as code (YAML/Groovy/HCL)',
        'Document pipeline structure and gate integration points'
      ],
      outputFormat: 'JSON with pipelinesModified (array), stagesAdded (array), parallelizationEnabled (boolean), failFastEnabled (boolean), statusChecks (array), notifications (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelinesModified', 'stagesAdded', 'parallelizationEnabled', 'failFastEnabled', 'artifacts'],
      properties: {
        pipelinesModified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pipeline: { type: 'string' },
              file: { type: 'string' },
              platform: { type: 'string' },
              stagesCount: { type: 'number' },
              gatesIntegrated: { type: 'number' }
            }
          }
        },
        stagesAdded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              gates: { type: 'array', items: { type: 'string' } },
              parallel: { type: 'boolean' },
              estimatedTime: { type: 'string' }
            }
          }
        },
        parallelizationEnabled: { type: 'boolean' },
        failFastEnabled: { type: 'boolean' },
        statusChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              required: { type: 'boolean' },
              blocking: { type: 'boolean' }
            }
          }
        },
        notifications: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            onSuccess: { type: 'boolean' },
            onFailure: { type: 'boolean' },
            onWarning: { type: 'boolean' }
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
  labels: ['agent', 'quality-gates', 'cicd-integration']
}));

// Task 5: Setup Monitoring
export const setupMonitoringTask = defineTask('setup-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup quality gate monitoring and reporting',
  agent: {
    name: 'monitoring-specialist',
    prompt: {
      role: 'observability engineer and metrics specialist',
      task: 'Set up comprehensive monitoring, dashboards, alerts, and reporting for quality gate metrics',
      context: args,
      instructions: [
        'Define quality gate metrics to track (pass rate, failure rate, execution time, bypass rate)',
        'Set up metrics collection for each gate type',
        'Create quality gates dashboard (Grafana, Kibana, DataDog, or custom)',
        'Define visualization for gate pass/fail trends over time',
        'Create gate execution time trend charts',
        'Set up quality metrics aggregation (coverage, code quality, security scores)',
        'Configure alerting for gate failures and anomalies',
        'Define alert thresholds and escalation policies',
        'Set up automated reporting (daily, weekly summaries)',
        'Create quality gates scorecard for leadership visibility',
        'Implement gate bypass tracking and auditing',
        'Set up historical trend analysis',
        'Define SLOs (Service Level Objectives) for gate execution',
        'Document monitoring setup and runbook procedures'
      ],
      outputFormat: 'JSON with dashboards (array), alerts (array), metricsCollected (array), reportingCadence (string), slos (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'alerts', 'metricsCollected', 'reportingCadence', 'artifacts'],
      properties: {
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              platform: { type: 'string' },
              url: { type: 'string' },
              panels: { type: 'array', items: { type: 'string' } },
              refreshRate: { type: 'string' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alert: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              channels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metricsCollected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              type: { type: 'string' },
              frequency: { type: 'string' },
              retention: { type: 'string' }
            }
          }
        },
        reportingCadence: { type: 'string' },
        slos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
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
  labels: ['agent', 'quality-gates', 'monitoring']
}));

// Task 6: Define Exception Process
export const defineExceptionProcessTask = defineTask('define-exception-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define exception handling and override process',
  agent: {
    name: 'process-governance-specialist',
    prompt: {
      role: 'quality governance and compliance specialist',
      task: 'Design exception handling process for quality gate bypasses with approval workflow and audit logging',
      context: args,
      instructions: [
        'Define scenarios where gate bypass is acceptable (hotfixes, emergencies)',
        'Design approval workflow for gate overrides (roles, approvers, escalation)',
        'Define authorization matrix (who can bypass which gates)',
        'Create gate bypass request form/process',
        'Implement audit logging for all bypass attempts',
        'Define post-bypass remediation requirements',
        'Set up bypass expiration and time limits',
        'Create bypass reporting and review process',
        'Define escalation path for repeated bypasses',
        'Implement automated notifications for bypasses',
        'Create bypass metrics and trend analysis',
        'Define consequences for unauthorized bypasses',
        'Document exception handling procedures',
        'Create runbook for emergency gate overrides'
      ],
      outputFormat: 'JSON with overridePolicy (object), approvalWorkflow (object), auditLogging (object), authorizationMatrix (object), remediationRequirements (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overridePolicy', 'approvalWorkflow', 'auditLogging', 'authorizationMatrix', 'artifacts'],
      properties: {
        overridePolicy: {
          type: 'object',
          properties: {
            allowedScenarios: { type: 'array', items: { type: 'string' } },
            bypassableGates: { type: 'array', items: { type: 'string' } },
            nonBypassableGates: { type: 'array', items: { type: 'string' } },
            expirationTime: { type: 'string' },
            remediationRequired: { type: 'boolean' }
          }
        },
        approvalWorkflow: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'string' },
                  approver: { type: 'string' },
                  sla: { type: 'string' },
                  escalation: { type: 'string' }
                }
              }
            },
            automatedApproval: { type: 'boolean' },
            approvalTools: { type: 'array', items: { type: 'string' } }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            logAllAttempts: { type: 'boolean' },
            logLocation: { type: 'string' },
            retention: { type: 'string' },
            reviewCadence: { type: 'string' }
          }
        },
        authorizationMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              gates: { type: 'array', items: { type: 'string' } },
              approvalRequired: { type: 'boolean' }
            }
          }
        },
        remediationRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-gates', 'exception-handling']
}));

// Task 7: Create Documentation
export const createDocumentationTask = defineTask('create-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation and training materials',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer and training specialist',
      task: 'Create comprehensive documentation and training materials for quality gate implementation',
      context: args,
      instructions: [
        'Create quality gates overview document for all stakeholders',
        'Document each gate: purpose, criteria, thresholds, enforcement',
        'Create developer quick start guide for working with gates',
        'Document how to run gates locally before commit',
        'Create troubleshooting guide for common gate failures',
        'Document gate bypass/override procedures',
        'Create CI/CD integration documentation',
        'Document monitoring and reporting access',
        'Create FAQ covering common questions',
        'Design training presentation for team onboarding',
        'Create video tutorials for key workflows (optional)',
        'Document best practices and tips',
        'Create runbook for gate maintenance and updates',
        'Generate README files for all gate automation scripts'
      ],
      outputFormat: 'JSON with documentationCreated (array), trainingMaterials (array), readmeFiles (array), faqCount (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationCreated', 'trainingMaterials', 'faqCount', 'artifacts'],
      properties: {
        documentationCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              format: { type: 'string' },
              duration: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        readmeFiles: { type: 'array', items: { type: 'string' } },
        faqCount: { type: 'number' },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-gates', 'documentation']
}));

// Task 8: Validate Implementation
export const validateImplementationTask = defineTask('validate-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate quality gate implementation',
  agent: {
    name: 'qa-validation-engineer',
    prompt: {
      role: 'senior QA validation engineer',
      task: 'Validate quality gate implementation through comprehensive testing and verification',
      context: args,
      instructions: [
        'Test each gate with passing scenarios (all criteria met)',
        'Test each gate with failing scenarios (criteria violations)',
        'Verify gate blocking behavior (blocking gates prevent progression)',
        'Test gate execution order and dependencies',
        'Verify parallel gate execution works correctly',
        'Test fail-fast behavior (critical gates stop pipeline early)',
        'Validate CI/CD integration (gates run in pipeline)',
        'Test gate bypass/override mechanisms',
        'Verify monitoring and alerting functionality',
        'Test audit logging for bypasses',
        'Validate gate execution times meet SLOs',
        'Test edge cases and error handling',
        'Verify documentation accuracy against implementation',
        'Calculate overall validation score (0-100)',
        'Identify critical issues, warnings, and recommendations'
      ],
      outputFormat: 'JSON with validationScore (number 0-100), overallSuccess (boolean), testsPassed (number), testsFailed (number), criticalIssues (array), warnings (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'overallSuccess', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        overallSuccess: { type: 'boolean' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              gate: { type: 'string' },
              passed: { type: 'boolean' },
              details: { type: 'string' }
            }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              gate: { type: 'string' },
              severity: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warning: { type: 'string' },
              gate: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageExecutionTime: { type: 'string' },
            longestGate: { type: 'string' },
            parallelizationEfficiency: { type: 'number' }
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
  labels: ['agent', 'quality-gates', 'validation']
}));

// Task 9: Create Rollout Plan
export const createRolloutPlanTask = defineTask('create-rollout-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create phased rollout plan',
  agent: {
    name: 'rollout-strategist',
    prompt: {
      role: 'change management and rollout specialist',
      task: 'Design phased rollout plan for quality gates with progressive enforcement',
      context: args,
      instructions: [
        'Design phased rollout approach (warning → soft-blocking → hard-blocking)',
        'Phase 1: Enable gates in warning mode (informational only)',
        'Phase 2: Soft-blocking for new code (allow bypass with approval)',
        'Phase 3: Hard-blocking for critical gates (no bypass)',
        'Phase 4: Full enforcement across all gates',
        'Define timeline for each phase (recommended 2-4 weeks per phase)',
        'Identify pilot team or repository for initial rollout',
        'Create communication plan for each phase',
        'Define success criteria for phase progression',
        'Create rollback plan for each phase',
        'Plan team training sessions aligned with phases',
        'Define metrics to monitor during rollout',
        'Create feedback collection mechanism',
        'Document lessons learned process'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), pilotTeam (string), successCriteria (array), rollbackPlan (object), communicationPlan (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'successCriteria', 'rollbackPlan', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              enforcementLevel: { type: 'string' },
              gates: { type: 'array', items: { type: 'string' } },
              objectives: { type: 'array', items: { type: 'string' } },
              exitCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  start: { type: 'string' },
                  end: { type: 'string' }
                }
              }
            }
          }
        },
        pilotTeam: { type: 'string' },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            steps: { type: 'array', items: { type: 'string' } },
            owner: { type: 'string' }
          }
        },
        communicationPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              audience: { type: 'string' },
              message: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'quality-gates', 'rollout-planning']
}));

// Task 10: Setup Continuous Improvement
export const setupContinuousImprovementTask = defineTask('setup-continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup continuous improvement process',
  agent: {
    name: 'continuous-improvement-lead',
    prompt: {
      role: 'continuous improvement and process optimization specialist',
      task: 'Design continuous improvement framework for quality gates with regular reviews, optimizations, and feedback loops',
      context: args,
      instructions: [
        'Define regular review cadence for quality gates (monthly recommended)',
        'Create feedback collection mechanism from development team',
        'Set up gate effectiveness metrics (false positive rate, developer satisfaction)',
        'Identify optimization opportunities (execution time, threshold tuning)',
        'Design A/B testing framework for gate threshold experiments',
        'Create process for adding/removing gates based on value',
        'Set up quarterly gate ROI analysis',
        'Define process for incorporating new tools and technologies',
        'Create gate maintenance schedule (dependency updates, tool upgrades)',
        'Design retrospective format for gate-related learnings',
        'Set up benchmarking against industry standards',
        'Create knowledge base for gate patterns and anti-patterns',
        'Define escalation path for gate-related blockers',
        'Document continuous improvement procedures'
      ],
      outputFormat: 'JSON with reviewCadence (string), feedbackLoop (object), optimizationOpportunities (array), effectivenessMetrics (array), maintenanceSchedule (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewCadence', 'feedbackLoop', 'optimizationOpportunities', 'effectivenessMetrics', 'artifacts'],
      properties: {
        reviewCadence: { type: 'string' },
        feedbackLoop: {
          type: 'object',
          properties: {
            mechanisms: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' },
            owner: { type: 'string' },
            actionProcess: { type: 'string' }
          }
        },
        optimizationOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              area: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        effectivenessMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              currentValue: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        maintenanceSchedule: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'string' } },
            weekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } },
            quarterly: { type: 'array', items: { type: 'string' } }
          }
        },
        roiAnalysis: {
          type: 'object',
          properties: {
            defectsPrevented: { type: 'string' },
            timesSaved: { type: 'string' },
            costSavings: { type: 'string' }
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
  labels: ['agent', 'quality-gates', 'continuous-improvement']
}));

// Quality gates for the overall process
export const processQualityGates = {
  standardsDefinedAndMeasurable: {
    description: 'Quality standards defined with clear measurable criteria',
    threshold: 100,
    metric: 'measurableCriteriaPercentage'
  },
  gatesComprehensive: {
    description: 'Gates cover all SDLC stages with appropriate criteria',
    threshold: 90,
    metric: 'gateCompleteness'
  },
  automationCoverage: {
    description: 'At least 80% of gates are automated',
    threshold: 80,
    metric: 'automationPercentage'
  },
  cicdIntegrationComplete: {
    description: 'All gates integrated into CI/CD pipeline',
    threshold: 100,
    metric: 'cicdIntegrationPercentage'
  },
  monitoringOperational: {
    description: 'Monitoring dashboards and alerts operational',
    threshold: 100,
    metric: 'monitoringReadiness'
  },
  validationSuccessful: {
    description: 'Implementation validation score meets threshold',
    threshold: 85,
    metric: 'validationScore'
  }
};

// Estimated duration
export const estimatedDuration = {
  analysis: '1-2 days',
  implementation: '3-5 days',
  validation: '1-2 days',
  rollout: '4-8 weeks (phased)',
  total: '1-2 weeks implementation + 4-8 weeks rollout'
};
