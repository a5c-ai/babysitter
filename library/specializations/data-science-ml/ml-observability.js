/**
 * @process specializations/data-science-ml/ml-observability
 * @description ML System Observability and Incident Response - Comprehensive monitoring, anomaly detection,
 * incident triage, root cause analysis, and automated remediation for ML systems in production.
 * @inputs { modelId: string, environment: string, incidentType?: string, alertThresholds?: object, enableAutoRemediation?: boolean }
 * @outputs { success: boolean, incidentResolved: boolean, rootCause: string, remediationApplied: boolean, monitoringDashboardUrl: string }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/ml-observability', {
 *   modelId: 'recommendation-engine-v3',
 *   environment: 'production',
 *   incidentType: 'performance-degradation', // or 'data-drift', 'prediction-anomaly', 'system-failure'
 *   alertThresholds: {
 *     latencyP95Ms: 500,
 *     errorRatePercent: 2.0,
 *     predictionDriftScore: 0.15,
 *     dataDriftScore: 0.20
 *   },
 *   enableAutoRemediation: true
 * });
 *
 * @references
 * - Google SRE Book: https://sre.google/sre-book/table-of-contents/
 * - ML Observability Best Practices: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning#mlops_level_2_cicd_pipeline_automation
 * - Incident Response: https://response.pagerduty.com/
 * - OpenTelemetry for ML: https://opentelemetry.io/
 * - Evidently AI Monitoring: https://www.evidentlyai.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelId,
    environment = 'production',
    incidentType = null,
    alertThresholds = {
      latencyP95Ms: 500,
      errorRatePercent: 2.0,
      predictionDriftScore: 0.15,
      dataDriftScore: 0.20,
      accuracyDropPercent: 5.0
    },
    enableAutoRemediation = false,
    notificationChannels = [],
    runbookUrl = null
  } = inputs;

  const startTime = ctx.now();
  let incidentResolved = false;
  let remediationApplied = false;
  let rootCauseIdentified = null;
  const artifacts = [];

  ctx.log('info', `Starting ML observability and incident response for model: ${modelId} in ${environment}`);
  if (incidentType) {
    ctx.log('warn', `Active incident detected: ${incidentType}`);
  }

  // ============================================================================
  // PHASE 1: OBSERVABILITY SETUP AND HEALTH CHECK
  // ============================================================================

  ctx.log('info', 'Phase 1: Observability setup and system health check');

  // Task 1.1: Validate Observability Infrastructure
  const observabilityValidation = await ctx.task(validateObservabilityInfrastructureTask, {
    modelId,
    environment
  });

  if (!observabilityValidation.healthy) {
    return {
      success: false,
      error: 'Observability infrastructure is not healthy',
      details: observabilityValidation.issues,
      phase: 'observability-setup',
      metadata: { processId: 'specializations/data-science-ml/ml-observability', timestamp: startTime }
    };
  }

  artifacts.push(...observabilityValidation.artifacts);

  // Task 1.2: Collect Current System Metrics
  const currentMetrics = await ctx.task(collectSystemMetricsTask, {
    modelId,
    environment,
    lookbackMinutes: 60,
    metricsToCollect: [
      'prediction_latency',
      'error_rate',
      'throughput',
      'model_accuracy',
      'data_drift',
      'prediction_drift',
      'feature_quality',
      'resource_utilization'
    ]
  });

  artifacts.push(...currentMetrics.artifacts);

  // Task 1.3: Health Assessment
  const healthAssessment = await ctx.task(assessSystemHealthTask, {
    modelId,
    environment,
    currentMetrics: currentMetrics.metrics,
    alertThresholds,
    baselineMetrics: currentMetrics.baseline
  });

  artifacts.push(...healthAssessment.artifacts);

  // ============================================================================
  // PHASE 2: INCIDENT DETECTION AND TRIAGE
  // ============================================================================

  ctx.log('info', 'Phase 2: Incident detection and triage');

  let activeIncident = null;

  if (incidentType) {
    // Incident already reported, validate and triage
    activeIncident = {
      type: incidentType,
      reportedAt: startTime,
      source: 'external'
    };
  } else if (!healthAssessment.healthy) {
    // Detect incident from health assessment
    activeIncident = {
      type: healthAssessment.primaryIssue,
      reportedAt: startTime,
      source: 'health-assessment'
    };
  }

  if (activeIncident) {
    ctx.log('warn', `Active incident: ${activeIncident.type}`);

    // Task 2.1: Incident Triage and Classification
    const incidentTriage = await ctx.task(triageIncidentTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      currentMetrics: currentMetrics.metrics,
      healthAssessment,
      alertThresholds
    });

    artifacts.push(...incidentTriage.artifacts);

    // Task 2.2: Assess Incident Severity and Impact
    const severityAssessment = await ctx.task(assessIncidentSeverityTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      triage: incidentTriage,
      currentMetrics: currentMetrics.metrics,
      businessImpact: {
        affectedUsers: currentMetrics.activeUsers || 'unknown',
        affectedRequests: currentMetrics.requestsPerMinute || 'unknown'
      }
    });

    artifacts.push(...severityAssessment.artifacts);

    // Breakpoint: Review incident triage and severity
    await ctx.breakpoint({
      question: `Incident detected: ${activeIncident.type}. Severity: ${severityAssessment.severity}. Impact: ${severityAssessment.impactSummary}. Proceed with incident response?`,
      title: 'Incident Triage Review',
      context: {
        runId: ctx.runId,
        modelId,
        environment,
        incidentType: activeIncident.type,
        severity: severityAssessment.severity,
        impact: severityAssessment.impactSummary,
        files: [
          { path: `artifacts/incident-triage-${activeIncident.type}.json`, format: 'json' },
          { path: `artifacts/severity-assessment.md`, format: 'markdown' }
        ]
      }
    });

    // ============================================================================
    // PHASE 3: ROOT CAUSE ANALYSIS
    // ============================================================================

    ctx.log('info', 'Phase 3: Root cause analysis');

    // Task 3.1: Parallel Data Collection for RCA
    const [
      logsAnalysis,
      metricsAnalysis,
      tracesAnalysis,
      modelPerformanceAnalysis
    ] = await ctx.parallel.all([
      () => ctx.task(analyzeLogsTask, {
        modelId,
        environment,
        incidentType: activeIncident.type,
        timeRange: {
          start: severityAssessment.incidentStartTime,
          end: ctx.now()
        }
      }),
      () => ctx.task(analyzeMetricsTask, {
        modelId,
        environment,
        incidentType: activeIncident.type,
        currentMetrics: currentMetrics.metrics,
        timeRange: {
          start: severityAssessment.incidentStartTime,
          end: ctx.now()
        }
      }),
      () => ctx.task(analyzeTracesTask, {
        modelId,
        environment,
        incidentType: activeIncident.type,
        timeRange: {
          start: severityAssessment.incidentStartTime,
          end: ctx.now()
        }
      }),
      () => ctx.task(analyzeModelPerformanceTask, {
        modelId,
        environment,
        incidentType: activeIncident.type,
        currentMetrics: currentMetrics.metrics,
        baseline: currentMetrics.baseline
      })
    ]);

    artifacts.push(...logsAnalysis.artifacts);
    artifacts.push(...metricsAnalysis.artifacts);
    artifacts.push(...tracesAnalysis.artifacts);
    artifacts.push(...modelPerformanceAnalysis.artifacts);

    // Task 3.2: Root Cause Synthesis
    const rootCauseAnalysis = await ctx.task(synthesizeRootCauseTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      triage: incidentTriage,
      severity: severityAssessment,
      logsFindings: logsAnalysis.findings,
      metricsFindings: metricsAnalysis.findings,
      tracesFindings: tracesAnalysis.findings,
      modelPerformanceFindings: modelPerformanceAnalysis.findings
    });

    artifacts.push(...rootCauseAnalysis.artifacts);
    rootCauseIdentified = rootCauseAnalysis.rootCause;

    ctx.log('info', `Root cause identified: ${rootCauseIdentified}`);

    // Breakpoint: Review root cause analysis
    await ctx.breakpoint({
      question: `Root cause analysis complete. Primary cause: ${rootCauseIdentified}. Confidence: ${rootCauseAnalysis.confidence}%. Review findings and proceed with remediation?`,
      title: 'Root Cause Analysis Review',
      context: {
        runId: ctx.runId,
        modelId,
        environment,
        incidentType: activeIncident.type,
        rootCause: rootCauseIdentified,
        confidence: rootCauseAnalysis.confidence,
        contributingFactors: rootCauseAnalysis.contributingFactors,
        files: [
          { path: `artifacts/root-cause-analysis.md`, format: 'markdown' },
          { path: `artifacts/rca-evidence.json`, format: 'json' },
          { path: `artifacts/metrics-timeline.png`, format: 'image', label: 'Metrics Timeline' }
        ]
      }
    });

    // ============================================================================
    // PHASE 4: REMEDIATION STRATEGY
    // ============================================================================

    ctx.log('info', 'Phase 4: Remediation strategy planning');

    // Task 4.1: Generate Remediation Plan
    const remediationPlan = await ctx.task(generateRemediationPlanTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      rootCause: rootCauseAnalysis.rootCause,
      severity: severityAssessment.severity,
      currentState: {
        metrics: currentMetrics.metrics,
        health: healthAssessment
      },
      enableAutoRemediation,
      runbookUrl
    });

    artifacts.push(...remediationPlan.artifacts);

    // Task 4.2: Assess Remediation Risk
    const remediationRisk = await ctx.task(assessRemediationRiskTask, {
      modelId,
      environment,
      remediationPlan: remediationPlan.plan,
      currentState: {
        severity: severityAssessment.severity,
        impact: severityAssessment.impactSummary
      }
    });

    artifacts.push(...remediationRisk.artifacts);

    // Quality Gate: High-risk remediations require manual approval
    if (remediationRisk.riskLevel === 'high' || !enableAutoRemediation) {
      await ctx.breakpoint({
        question: `Remediation plan ready. Risk level: ${remediationRisk.riskLevel}. ${remediationPlan.plan.steps.length} steps planned. Approve remediation execution?`,
        title: 'Remediation Plan Approval',
        context: {
          runId: ctx.runId,
          modelId,
          environment,
          incidentType: activeIncident.type,
          rootCause: rootCauseIdentified,
          riskLevel: remediationRisk.riskLevel,
          remediationSteps: remediationPlan.plan.steps,
          estimatedDuration: remediationPlan.estimatedDuration,
          rollbackAvailable: remediationPlan.rollbackAvailable,
          files: [
            { path: `artifacts/remediation-plan.md`, format: 'markdown' },
            { path: `artifacts/risk-assessment.json`, format: 'json' }
          ]
        }
      });
    }

    // ============================================================================
    // PHASE 5: REMEDIATION EXECUTION
    // ============================================================================

    ctx.log('info', 'Phase 5: Remediation execution');

    // Execute remediation steps
    const remediationResults = [];
    for (let i = 0; i < remediationPlan.plan.steps.length; i++) {
      const step = remediationPlan.plan.steps[i];
      ctx.log('info', `Executing remediation step ${i + 1}/${remediationPlan.plan.steps.length}: ${step.name}`);

      const stepResult = await ctx.task(executeRemediationStepTask, {
        modelId,
        environment,
        step,
        stepNumber: i + 1,
        totalSteps: remediationPlan.plan.steps.length,
        dryRun: remediationRisk.riskLevel === 'critical' // Force dry-run for critical risk
      });

      remediationResults.push(stepResult);
      artifacts.push(...stepResult.artifacts);

      if (!stepResult.success) {
        ctx.log('error', `Remediation step ${i + 1} failed: ${stepResult.error}`);

        // Attempt rollback if available
        if (remediationPlan.rollbackAvailable) {
          ctx.log('warn', 'Initiating rollback of remediation changes');

          const rollbackResult = await ctx.task(rollbackRemediationTask, {
            modelId,
            environment,
            executedSteps: remediationResults.slice(0, i + 1),
            reason: stepResult.error
          });

          artifacts.push(...rollbackResult.artifacts);

          return {
            success: false,
            incidentResolved: false,
            error: `Remediation failed at step ${i + 1}, rollback executed`,
            details: {
              failedStep: step,
              rollback: rollbackResult
            },
            rootCause: rootCauseIdentified,
            remediationApplied: false,
            artifacts,
            metadata: {
              processId: 'specializations/data-science-ml/ml-observability',
              timestamp: startTime,
              duration: ctx.now() - startTime
            }
          };
        }

        return {
          success: false,
          incidentResolved: false,
          error: `Remediation failed at step ${i + 1}`,
          details: stepResult,
          rootCause: rootCauseIdentified,
          remediationApplied: false,
          artifacts,
          metadata: {
            processId: 'specializations/data-science-ml/ml-observability',
            timestamp: startTime,
            duration: ctx.now() - startTime
          }
        };
      }

      // Verify step effectiveness
      if (step.verificationRequired) {
        const verification = await ctx.task(verifyRemediationStepTask, {
          modelId,
          environment,
          step,
          stepResult,
          expectedOutcome: step.expectedOutcome
        });

        artifacts.push(...verification.artifacts);

        if (!verification.verified) {
          ctx.log('warn', `Remediation step ${i + 1} verification failed: ${verification.reason}`);

          await ctx.breakpoint({
            question: `Remediation step "${step.name}" verification failed. Continue with remaining steps or abort?`,
            title: `Remediation Step ${i + 1} Verification Failed`,
            context: {
              runId: ctx.runId,
              modelId,
              step: step.name,
              reason: verification.reason,
              files: [
                { path: `artifacts/step-${i + 1}-verification.json`, format: 'json' }
              ]
            }
          });
        }
      }
    }

    remediationApplied = remediationResults.every(r => r.success);
    ctx.log('info', `Remediation execution complete. Success: ${remediationApplied}`);

    // ============================================================================
    // PHASE 6: POST-REMEDIATION VALIDATION
    // ============================================================================

    ctx.log('info', 'Phase 6: Post-remediation validation');

    // Wait for system stabilization
    await ctx.task(stabilizationWaitTask, {
      modelId,
      environment,
      waitMinutes: 5,
      reason: 'post-remediation-stabilization'
    });

    // Task 6.1: Collect Post-Remediation Metrics
    const postRemediationMetrics = await ctx.task(collectSystemMetricsTask, {
      modelId,
      environment,
      lookbackMinutes: 10,
      metricsToCollect: [
        'prediction_latency',
        'error_rate',
        'throughput',
        'model_accuracy',
        'data_drift',
        'prediction_drift'
      ]
    });

    artifacts.push(...postRemediationMetrics.artifacts);

    // Task 6.2: Validate Remediation Effectiveness
    const remediationValidation = await ctx.task(validateRemediationEffectivenessTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      preRemediationMetrics: currentMetrics.metrics,
      postRemediationMetrics: postRemediationMetrics.metrics,
      alertThresholds,
      remediationPlan: remediationPlan.plan
    });

    artifacts.push(...remediationValidation.artifacts);

    incidentResolved = remediationValidation.incidentResolved;

    // Quality Gate: Incident must be resolved
    if (!incidentResolved) {
      ctx.log('error', 'Incident not resolved after remediation');

      await ctx.breakpoint({
        question: `Remediation completed but incident not fully resolved. ${remediationValidation.remainingIssues.length} issue(s) remain. Escalate or continue investigation?`,
        title: 'Incident Not Fully Resolved',
        context: {
          runId: ctx.runId,
          modelId,
          environment,
          incidentType: activeIncident.type,
          remainingIssues: remediationValidation.remainingIssues,
          improvement: remediationValidation.improvement,
          files: [
            { path: `artifacts/post-remediation-validation.md`, format: 'markdown' },
            { path: `artifacts/metrics-comparison.json`, format: 'json' }
          ]
        }
      });
    } else {
      ctx.log('info', 'Incident successfully resolved');
    }

    // ============================================================================
    // PHASE 7: POST-INCIDENT ACTIVITIES
    // ============================================================================

    ctx.log('info', 'Phase 7: Post-incident activities');

    // Task 7.1: Generate Incident Report
    const incidentReport = await ctx.task(generateIncidentReportTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      reportedAt: activeIncident.reportedAt,
      resolvedAt: incidentResolved ? ctx.now() : null,
      severity: severityAssessment,
      rootCause: rootCauseAnalysis,
      remediation: {
        plan: remediationPlan.plan,
        results: remediationResults,
        applied: remediationApplied,
        resolved: incidentResolved
      },
      validation: remediationValidation,
      timeline: {
        detection: severityAssessment.incidentStartTime,
        triage: incidentTriage.completedAt,
        rcaComplete: rootCauseAnalysis.completedAt,
        remediationStart: remediationResults[0]?.startedAt,
        remediationEnd: remediationResults[remediationResults.length - 1]?.completedAt,
        resolution: incidentResolved ? ctx.now() : null
      },
      artifacts
    });

    artifacts.push(...incidentReport.artifacts);

    // Task 7.2: Update Monitoring and Alerting
    const monitoringUpdate = await ctx.task(updateMonitoringTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      rootCause: rootCauseAnalysis.rootCause,
      lessonsLearned: rootCauseAnalysis.preventionRecommendations,
      newAlerts: remediationPlan.recommendedAlerts || []
    });

    artifacts.push(...monitoringUpdate.artifacts);

    // Task 7.3: Schedule Post-Incident Review
    const pirSchedule = await ctx.task(schedulePostIncidentReviewTask, {
      modelId,
      environment,
      incidentType: activeIncident.type,
      severity: severityAssessment.severity,
      incidentReport: incidentReport.reportPath,
      stakeholders: severityAssessment.affectedStakeholders || []
    });

    artifacts.push(...pirSchedule.artifacts);

    // Final Breakpoint: Review incident resolution
    await ctx.breakpoint({
      question: `Incident response complete. Incident resolved: ${incidentResolved}. Remediation applied: ${remediationApplied}. Review incident report and approve closure?`,
      title: 'Incident Response Complete',
      context: {
        runId: ctx.runId,
        modelId,
        environment,
        incidentType: activeIncident.type,
        resolved: incidentResolved,
        rootCause: rootCauseIdentified,
        duration: ctx.now() - startTime,
        files: [
          { path: incidentReport.reportPath, format: 'markdown', label: 'Incident Report' },
          { path: incidentReport.timelinePath, format: 'markdown', label: 'Incident Timeline' },
          { path: monitoringUpdate.dashboardUrl, format: 'link', label: 'Monitoring Dashboard' }
        ]
      }
    });

    const endTime = ctx.now();

    return {
      success: true,
      incidentDetected: true,
      incidentType: activeIncident.type,
      incidentResolved,
      severity: severityAssessment.severity,
      rootCause: rootCauseIdentified,
      remediationApplied,
      timeline: {
        startTime,
        endTime,
        duration: endTime - startTime,
        mttr: incidentResolved ? (endTime - severityAssessment.incidentStartTime) : null
      },
      metrics: {
        preRemediation: currentMetrics.metrics,
        postRemediation: incidentResolved ? postRemediationMetrics.metrics : null,
        improvement: incidentResolved ? remediationValidation.improvement : null
      },
      remediation: {
        stepsExecuted: remediationResults.length,
        stepsSuccessful: remediationResults.filter(r => r.success).length,
        rollbackTriggered: false
      },
      artifacts,
      reports: {
        incidentReport: incidentReport.reportPath,
        timelineReport: incidentReport.timelinePath,
        rcaReport: rootCauseAnalysis.reportPath
      },
      monitoringDashboardUrl: monitoringUpdate.dashboardUrl,
      postIncidentReview: pirSchedule,
      metadata: {
        processId: 'specializations/data-science-ml/ml-observability',
        timestamp: startTime,
        completedAt: endTime,
        duration: endTime - startTime
      }
    };
  } else {
    // No incident detected - return healthy status
    ctx.log('info', 'No incident detected. System healthy.');

    // Task: Generate Health Report
    const healthReport = await ctx.task(generateHealthReportTask, {
      modelId,
      environment,
      currentMetrics: currentMetrics.metrics,
      healthAssessment,
      alertThresholds
    });

    artifacts.push(...healthReport.artifacts);

    const endTime = ctx.now();

    return {
      success: true,
      incidentDetected: false,
      incidentResolved: true,
      systemHealthy: true,
      currentMetrics: currentMetrics.metrics,
      healthScore: healthAssessment.healthScore,
      monitoringDashboardUrl: observabilityValidation.dashboardUrl,
      artifacts,
      reports: {
        healthReport: healthReport.reportPath
      },
      metadata: {
        processId: 'specializations/data-science-ml/ml-observability',
        timestamp: startTime,
        completedAt: endTime,
        duration: endTime - startTime
      }
    };
  }
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1.1: Validate Observability Infrastructure
export const validateObservabilityInfrastructureTask = defineTask('validate-observability-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate observability infrastructure - ${args.modelId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and observability engineer with expertise in ML monitoring',
      task: 'Validate that observability infrastructure is properly configured and operational',
      context: {
        modelId: args.modelId,
        environment: args.environment
      },
      instructions: [
        '1. Verify metrics collection systems are operational (Prometheus, CloudWatch, Datadog, etc.)',
        '2. Check logging infrastructure (ELK, CloudWatch Logs, etc.)',
        '3. Verify distributed tracing is configured (Jaeger, X-Ray, etc.)',
        '4. Check ML-specific monitoring (Evidently, Whylabs, etc.)',
        '5. Verify alerting systems are configured and functional',
        '6. Check dashboard availability and data freshness',
        '7. Verify data retention policies are appropriate',
        '8. Validate monitoring coverage for model endpoints',
        '9. Check access to observability tools',
        '10. Generate observability infrastructure health report'
      ],
      outputFormat: 'JSON object with healthy status, issues, and dashboard URLs'
    },
    outputSchema: {
      type: 'object',
      required: ['healthy', 'dashboardUrl', 'artifacts'],
      properties: {
        healthy: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        infrastructure: {
          type: 'object',
          properties: {
            metrics: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                operational: { type: 'boolean' },
                dataFreshness: { type: 'string' }
              }
            },
            logging: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                operational: { type: 'boolean' }
              }
            },
            tracing: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                operational: { type: 'boolean' }
              }
            },
            mlMonitoring: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                operational: { type: 'boolean' }
              }
            },
            alerting: {
              type: 'object',
              properties: {
                configured: { type: 'boolean' },
                alertsActive: { type: 'number' }
              }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'validation', 'infrastructure']
}));

// Task 1.2: Collect System Metrics
export const collectSystemMetricsTask = defineTask('collect-system-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect current system metrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML observability engineer',
      task: 'Collect comprehensive system and ML metrics for analysis',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        lookbackMinutes: args.lookbackMinutes,
        metricsToCollect: args.metricsToCollect
      },
      instructions: [
        '1. Query prediction latency metrics (p50, p95, p99) over lookback period',
        '2. Collect error rate and error types',
        '3. Collect throughput (requests per second)',
        '4. Query model accuracy/performance metrics if available',
        '5. Collect data drift scores from monitoring tools',
        '6. Collect prediction drift scores',
        '7. Collect feature quality metrics',
        '8. Collect resource utilization (CPU, memory, GPU)',
        '9. Fetch baseline metrics for comparison',
        '10. Calculate statistical summaries and trends'
      ],
      outputFormat: 'JSON object with current metrics, baseline, and trends'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'baseline', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            prediction_latency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' },
                mean: { type: 'number' }
              }
            },
            error_rate: {
              type: 'object',
              properties: {
                rate: { type: 'number' },
                count: { type: 'number' },
                types: { type: 'object' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                requestsPerSecond: { type: 'number' },
                totalRequests: { type: 'number' }
              }
            },
            model_accuracy: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                value: { type: 'number' }
              }
            },
            data_drift: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                driftedFeatures: { type: 'array', items: { type: 'string' } }
              }
            },
            prediction_drift: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                distribution: { type: 'object' }
              }
            },
            feature_quality: {
              type: 'object',
              properties: {
                missingRate: { type: 'number' },
                outlierRate: { type: 'number' }
              }
            },
            resource_utilization: {
              type: 'object',
              properties: {
                cpuPercent: { type: 'number' },
                memoryPercent: { type: 'number' }
              }
            }
          }
        },
        baseline: { type: 'object' },
        trends: {
          type: 'object',
          properties: {
            latencyTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            errorRateTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            driftTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] }
          }
        },
        activeUsers: { type: 'number' },
        requestsPerMinute: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'metrics', 'collection']
}));

// Task 1.3: Assess System Health
export const assessSystemHealthTask = defineTask('assess-system-health', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall system health',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and ML performance analyst',
      task: 'Assess overall system health and identify any issues',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        currentMetrics: args.currentMetrics,
        alertThresholds: args.alertThresholds,
        baselineMetrics: args.baselineMetrics
      },
      instructions: [
        '1. Compare current metrics against alert thresholds',
        '2. Compare current metrics against baseline for anomalies',
        '3. Calculate health score (0-100) across all dimensions',
        '4. Identify primary issues if any',
        '5. Assess severity of each issue',
        '6. Check for correlated issues that might indicate root cause',
        '7. Determine if system is healthy, degraded, or unhealthy',
        '8. Generate health assessment summary',
        '9. Provide recommendations for issues found',
        '10. Identify potential incident types'
      ],
      outputFormat: 'JSON object with health status, score, issues, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['healthy', 'healthScore', 'artifacts'],
      properties: {
        healthy: { type: 'boolean' },
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy', 'critical'] },
        primaryIssue: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              metric: { type: 'string' },
              currentValue: { type: 'number' },
              thresholdValue: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        dimensionScores: {
          type: 'object',
          properties: {
            performance: { type: 'number' },
            reliability: { type: 'number' },
            accuracy: { type: 'number' },
            dataQuality: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'health', 'assessment']
}));

// Task 2.1: Triage Incident
export const triageIncidentTask = defineTask('triage-incident', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage incident - ${args.incidentType}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident response engineer with ML systems expertise',
      task: 'Triage incident and classify for appropriate response',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        currentMetrics: args.currentMetrics,
        healthAssessment: args.healthAssessment,
        alertThresholds: args.alertThresholds
      },
      instructions: [
        '1. Classify incident type (performance, data drift, accuracy, system failure, etc.)',
        '2. Determine incident scope (single model, multiple models, infrastructure)',
        '3. Identify affected components and services',
        '4. Estimate number of affected users/requests',
        '5. Determine if incident is ongoing or resolved',
        '6. Check for similar historical incidents',
        '7. Identify immediate mitigation actions if needed',
        '8. Determine investigation priority',
        '9. Assign incident category and tags',
        '10. Generate triage summary with next steps'
      ],
      outputFormat: 'JSON object with classification, scope, and triage details'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentCategory', 'scope', 'ongoing', 'completedAt', 'artifacts'],
      properties: {
        incidentCategory: {
          type: 'string',
          enum: ['performance-degradation', 'data-drift', 'prediction-anomaly', 'accuracy-drop', 'system-failure', 'resource-exhaustion', 'other']
        },
        scope: {
          type: 'object',
          properties: {
            affectedModels: { type: 'array', items: { type: 'string' } },
            affectedComponents: { type: 'array', items: { type: 'string' } },
            affectedRegions: { type: 'array', items: { type: 'string' } }
          }
        },
        ongoing: { type: 'boolean' },
        estimatedAffectedUsers: { type: 'number' },
        estimatedAffectedRequests: { type: 'number' },
        similarIncidents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              incidentId: { type: 'string' },
              date: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        immediateMitigation: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            actions: { type: 'array', items: { type: 'string' } }
          }
        },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        tags: { type: 'array', items: { type: 'string' } },
        completedAt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'incident', 'triage']
}));

// Task 2.2: Assess Incident Severity
export const assessIncidentSeverityTask = defineTask('assess-incident-severity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess incident severity and impact',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident manager with understanding of ML systems and business impact',
      task: 'Assess incident severity based on technical and business impact',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        triage: args.triage,
        currentMetrics: args.currentMetrics,
        businessImpact: args.businessImpact
      },
      instructions: [
        '1. Assess technical severity based on metrics degradation',
        '2. Assess business impact based on affected users and revenue',
        '3. Determine incident severity level (SEV1-SEV4)',
        '4. Estimate incident start time based on metrics',
        '5. Calculate time since incident start (incident age)',
        '6. Identify affected stakeholders',
        '7. Determine communication requirements',
        '8. Assess urgency of response',
        '9. Generate impact summary',
        '10. Provide escalation recommendations'
      ],
      outputFormat: 'JSON object with severity, impact, and response requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['severity', 'impactSummary', 'incidentStartTime', 'artifacts'],
      properties: {
        severity: {
          type: 'string',
          enum: ['SEV1', 'SEV2', 'SEV3', 'SEV4'],
          description: 'SEV1=Critical, SEV2=High, SEV3=Medium, SEV4=Low'
        },
        impactSummary: { type: 'string' },
        incidentStartTime: { type: 'string' },
        incidentAge: { type: 'string' },
        technicalImpact: {
          type: 'object',
          properties: {
            performanceDegradation: { type: 'number' },
            availabilityImpact: { type: 'number' },
            accuracyImpact: { type: 'number' }
          }
        },
        businessImpact: {
          type: 'object',
          properties: {
            usersAffected: { type: 'number' },
            requestsAffected: { type: 'number' },
            estimatedRevenueLoss: { type: 'string' },
            customerExperienceImpact: { type: 'string' }
          }
        },
        affectedStakeholders: { type: 'array', items: { type: 'string' } },
        communicationRequired: { type: 'boolean' },
        escalationRequired: { type: 'boolean' },
        responseUrgency: { type: 'string', enum: ['immediate', 'urgent', 'normal', 'low'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'incident', 'severity']
}));

// Task 3.1: Analyze Logs
export const analyzeLogsTask = defineTask('analyze-logs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze system logs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Log analysis specialist with ML systems knowledge',
      task: 'Analyze system logs for error patterns and anomalies',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        timeRange: args.timeRange
      },
      instructions: [
        '1. Query logs for specified time range',
        '2. Filter logs for model and environment',
        '3. Identify error messages and exceptions',
        '4. Detect error patterns and frequency',
        '5. Analyze error types and severity',
        '6. Check for correlation with incident timing',
        '7. Identify suspicious log patterns',
        '8. Extract relevant stack traces',
        '9. Summarize key findings from logs',
        '10. Generate log analysis report'
      ],
      outputFormat: 'JSON object with log findings and key errors'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'keyErrors', 'artifacts'],
      properties: {
        findings: { type: 'string' },
        keyErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              level: { type: 'string' },
              message: { type: 'string' },
              count: { type: 'number' },
              stackTrace: { type: 'string' }
            }
          }
        },
        errorPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              firstOccurrence: { type: 'string' }
            }
          }
        },
        suspiciousPatterns: { type: 'array', items: { type: 'string' } },
        logVolume: {
          type: 'object',
          properties: {
            totalLogs: { type: 'number' },
            errorLogs: { type: 'number' },
            warnLogs: { type: 'number' }
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
  labels: ['ml-observability', 'rca', 'logs']
}));

// Task 3.2: Analyze Metrics
export const analyzeMetricsTask = defineTask('analyze-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze metrics timeline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metrics analyst with ML monitoring expertise',
      task: 'Analyze metrics timeline to identify patterns and anomalies',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        currentMetrics: args.currentMetrics,
        timeRange: args.timeRange
      },
      instructions: [
        '1. Query time-series metrics for specified range',
        '2. Identify metric anomalies and spikes',
        '3. Detect correlations between metrics',
        '4. Identify leading indicators (metrics that changed first)',
        '5. Analyze metric trends before and during incident',
        '6. Compare against historical patterns',
        '7. Identify sudden changes vs gradual degradation',
        '8. Check for cascading failures in metrics',
        '9. Generate metrics timeline visualization',
        '10. Summarize key metric findings'
      ],
      outputFormat: 'JSON object with metric findings and anomalies'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'anomalies', 'artifacts'],
      properties: {
        findings: { type: 'string' },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              timestamp: { type: 'string' },
              value: { type: 'number' },
              expectedValue: { type: 'number' },
              deviationPercent: { type: 'number' }
            }
          }
        },
        correlations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric1: { type: 'string' },
              metric2: { type: 'string' },
              correlation: { type: 'number' }
            }
          }
        },
        leadingIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              changedAt: { type: 'string' },
              changeType: { type: 'string' }
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
  labels: ['ml-observability', 'rca', 'metrics']
}));

// Task 3.3: Analyze Traces
export const analyzeTracesTask = defineTask('analyze-traces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze distributed traces',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed systems engineer',
      task: 'Analyze distributed traces to identify performance bottlenecks',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        timeRange: args.timeRange
      },
      instructions: [
        '1. Query distributed traces for time range',
        '2. Identify slow traces and bottlenecks',
        '3. Analyze trace latency breakdown by component',
        '4. Identify failed traces and error spans',
        '5. Check for dependency issues',
        '6. Analyze service call patterns',
        '7. Detect timeout or retry patterns',
        '8. Identify components with highest latency',
        '9. Generate trace analysis summary',
        '10. Provide component-level insights'
      ],
      outputFormat: 'JSON object with trace findings and bottlenecks'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'string' },
        slowTraces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              traceId: { type: 'string' },
              duration: { type: 'number' },
              bottleneck: { type: 'string' }
            }
          }
        },
        componentLatency: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              avgLatency: { type: 'number' },
              p95Latency: { type: 'number' }
            }
          }
        },
        failedTraces: { type: 'number' },
        dependencyIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'rca', 'traces']
}));

// Task 3.4: Analyze Model Performance
export const analyzeModelPerformanceTask = defineTask('analyze-model-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze ML model performance',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML engineer with model monitoring expertise',
      task: 'Analyze ML-specific performance metrics and model behavior',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        currentMetrics: args.currentMetrics,
        baseline: args.baseline
      },
      instructions: [
        '1. Analyze prediction accuracy/performance metrics',
        '2. Check for data drift in input features',
        '3. Check for prediction drift in output distribution',
        '4. Analyze feature importance changes',
        '5. Check for model staleness indicators',
        '6. Analyze prediction confidence distribution',
        '7. Check for input data quality issues',
        '8. Identify anomalous predictions',
        '9. Compare against model baseline',
        '10. Generate model performance analysis'
      ],
      outputFormat: 'JSON object with model performance findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'string' },
        accuracyAnalysis: {
          type: 'object',
          properties: {
            currentAccuracy: { type: 'number' },
            baselineAccuracy: { type: 'number' },
            degradation: { type: 'number' }
          }
        },
        driftAnalysis: {
          type: 'object',
          properties: {
            dataDriftDetected: { type: 'boolean' },
            driftScore: { type: 'number' },
            driftedFeatures: { type: 'array', items: { type: 'string' } },
            predictionDriftDetected: { type: 'boolean' }
          }
        },
        dataQualityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        anomalousPredictions: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            examples: { type: 'array' }
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
  labels: ['ml-observability', 'rca', 'model-performance']
}));

// Task 3.5: Synthesize Root Cause
export const synthesizeRootCauseTask = defineTask('synthesize-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize root cause from analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE and incident analyst with ML expertise',
      task: 'Synthesize root cause from all analysis sources',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        triage: args.triage,
        severity: args.severity,
        logsFindings: args.logsFindings,
        metricsFindings: args.metricsFindings,
        tracesFindings: args.tracesFindings,
        modelPerformanceFindings: args.modelPerformanceFindings
      },
      instructions: [
        '1. Synthesize findings from logs, metrics, traces, and model analysis',
        '2. Identify primary root cause',
        '3. Identify contributing factors',
        '4. Determine confidence level in root cause',
        '5. Provide evidence supporting root cause',
        '6. Rule out alternative explanations',
        '7. Generate root cause statement',
        '8. Provide prevention recommendations',
        '9. Identify lessons learned',
        '10. Create detailed RCA report'
      ],
      outputFormat: 'JSON object with root cause, confidence, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'confidence', 'completedAt', 'reportPath', 'artifacts'],
      properties: {
        rootCause: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              finding: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        alternativesRuledOut: { type: 'array', items: { type: 'string' } },
        preventionRecommendations: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        completedAt: { type: 'string' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'rca', 'synthesis']
}));

// Task 4.1: Generate Remediation Plan
export const generateRemediationPlanTask = defineTask('generate-remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate remediation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident remediation specialist with ML systems expertise',
      task: 'Generate detailed remediation plan based on root cause',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        rootCause: args.rootCause,
        severity: args.severity,
        currentState: args.currentState,
        enableAutoRemediation: args.enableAutoRemediation,
        runbookUrl: args.runbookUrl
      },
      instructions: [
        '1. Analyze root cause and determine remediation approach',
        '2. Check for existing runbooks or procedures',
        '3. Generate step-by-step remediation plan',
        '4. Identify dependencies between steps',
        '5. Estimate duration for each step',
        '6. Determine if remediation can be automated',
        '7. Identify verification steps for each action',
        '8. Plan rollback strategy',
        '9. Recommend new alerts to prevent recurrence',
        '10. Generate detailed remediation documentation'
      ],
      outputFormat: 'JSON object with remediation plan and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'estimatedDuration', 'rollbackAvailable', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  action: { type: 'string' },
                  type: { type: 'string', enum: ['config-change', 'restart', 'scale', 'rollback', 'manual', 'other'] },
                  automatable: { type: 'boolean' },
                  estimatedDuration: { type: 'string' },
                  verificationRequired: { type: 'boolean' },
                  expectedOutcome: { type: 'string' },
                  rollbackProcedure: { type: 'string' }
                }
              }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        rollbackAvailable: { type: 'boolean' },
        requiresManualIntervention: { type: 'boolean' },
        recommendedAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'number' }
            }
          }
        },
        runbookReference: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'remediation', 'planning']
}));

// Task 4.2: Assess Remediation Risk
export const assessRemediationRiskTask = defineTask('assess-remediation-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess remediation risk',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk assessment specialist',
      task: 'Assess risk associated with remediation plan',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        remediationPlan: args.remediationPlan,
        currentState: args.currentState
      },
      instructions: [
        '1. Analyze each remediation step for risk',
        '2. Assess potential for making situation worse',
        '3. Evaluate rollback capability',
        '4. Check for blast radius (what could be affected)',
        '5. Assess timing considerations',
        '6. Evaluate automation safety',
        '7. Determine overall risk level',
        '8. Identify risk mitigation measures',
        '9. Provide risk-based recommendations',
        '10. Generate risk assessment report'
      ],
      outputFormat: 'JSON object with risk level and mitigation'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'riskFactors', 'artifacts'],
      properties: {
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              severity: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        blastRadius: { type: 'string' },
        mitigationMeasures: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        requiresApproval: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'remediation', 'risk']
}));

// Task 5: Execute Remediation Step
export const executeRemediationStepTask = defineTask('execute-remediation-step', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.step.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer with ML systems expertise',
      task: 'Execute single remediation step',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        step: args.step,
        stepNumber: args.stepNumber,
        totalSteps: args.totalSteps,
        dryRun: args.dryRun
      },
      instructions: [
        '1. Review step action and requirements',
        '2. Verify prerequisites are met',
        '3. Execute step action (or simulate if dry-run)',
        '4. Capture execution output and logs',
        '5. Record execution timestamp',
        '6. Check for immediate errors',
        '7. Document changes made',
        '8. Prepare rollback information',
        '9. Return execution status',
        '10. Log step completion'
      ],
      outputFormat: 'JSON object with execution status and details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'startedAt', 'completedAt', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stepName: { type: 'string' },
        action: { type: 'string' },
        startedAt: { type: 'string' },
        completedAt: { type: 'string' },
        duration: { type: 'string' },
        output: { type: 'string' },
        changesMade: { type: 'array', items: { type: 'string' } },
        rollbackInfo: { type: 'object' },
        dryRun: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'remediation', 'execution']
}));

// Task 5.1: Verify Remediation Step
export const verifyRemediationStepTask = defineTask('verify-remediation-step', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify: ${args.step.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Verification specialist',
      task: 'Verify remediation step was successful',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        step: args.step,
        stepResult: args.stepResult,
        expectedOutcome: args.expectedOutcome
      },
      instructions: [
        '1. Check expected outcome was achieved',
        '2. Verify changes were applied correctly',
        '3. Check for side effects or issues',
        '4. Query relevant metrics to confirm improvement',
        '5. Check logs for errors',
        '6. Verify system stability',
        '7. Compare against expected state',
        '8. Return verification status',
        '9. Provide reason if verification failed',
        '10. Generate verification report'
      ],
      outputFormat: 'JSON object with verification status'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        expectedOutcome: { type: 'string' },
        actualOutcome: { type: 'string' },
        reason: { type: 'string' },
        metrics: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'remediation', 'verification']
}));

// Task 5.2: Rollback Remediation
export const rollbackRemediationTask = defineTask('rollback-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rollback remediation changes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident response engineer',
      task: 'Rollback remediation changes due to failure',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        executedSteps: args.executedSteps,
        reason: args.reason
      },
      instructions: [
        '1. Review executed steps in reverse order',
        '2. Execute rollback for each step',
        '3. Verify rollback success for each step',
        '4. Restore system to pre-remediation state',
        '5. Verify system stability after rollback',
        '6. Log rollback actions',
        '7. Document reason for rollback',
        '8. Generate rollback report',
        '9. Send notifications about rollback',
        '10. Update incident with rollback info'
      ],
      outputFormat: 'JSON object with rollback status'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stepsRolledBack', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stepsRolledBack: { type: 'number' },
        rollbackActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              action: { type: 'string' },
              success: { type: 'boolean' }
            }
          }
        },
        systemRestored: { type: 'boolean' },
        reason: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'remediation', 'rollback']
}));

// Task 5.3: Stabilization Wait
export const stabilizationWaitTask = defineTask('stabilization-wait', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wait ${args.waitMinutes} minutes for stabilization`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring coordinator',
      task: 'Wait for system stabilization and monitor',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        waitMinutes: args.waitMinutes,
        reason: args.reason
      },
      instructions: [
        '1. Wait for specified duration',
        '2. Monitor system metrics during wait',
        '3. Check for immediate issues or regressions',
        '4. Allow transient metrics to stabilize',
        '5. Log periodic status updates',
        '6. Note any anomalies during wait',
        '7. Verify system remains stable',
        '8. Confirm wait completed successfully',
        '9. Return stabilization status',
        '10. Document observations'
      ],
      outputFormat: 'JSON object with stabilization status'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'stable', 'artifacts'],
      properties: {
        completed: { type: 'boolean' },
        waitedMinutes: { type: 'number' },
        stable: { type: 'boolean' },
        observations: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'stabilization', 'wait']
}));

// Task 6.2: Validate Remediation Effectiveness
export const validateRemediationEffectivenessTask = defineTask('validate-remediation-effectiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate remediation effectiveness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and validation specialist',
      task: 'Validate that remediation resolved the incident',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        preRemediationMetrics: args.preRemediationMetrics,
        postRemediationMetrics: args.postRemediationMetrics,
        alertThresholds: args.alertThresholds,
        remediationPlan: args.remediationPlan
      },
      instructions: [
        '1. Compare pre and post-remediation metrics',
        '2. Check if all metrics are within thresholds',
        '3. Verify incident symptoms are resolved',
        '4. Calculate improvement percentage',
        '5. Check for any new issues introduced',
        '6. Verify system meets health requirements',
        '7. Determine if incident is fully resolved',
        '8. Identify any remaining issues',
        '9. Generate validation report',
        '10. Provide recommendations if not fully resolved'
      ],
      outputFormat: 'JSON object with resolution status and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentResolved', 'improvement', 'artifacts'],
      properties: {
        incidentResolved: { type: 'boolean' },
        improvement: {
          type: 'object',
          properties: {
            latency: { type: 'number' },
            errorRate: { type: 'number' },
            throughput: { type: 'number' },
            drift: { type: 'number' }
          }
        },
        metricsWithinThresholds: { type: 'boolean' },
        symptomsResolved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symptom: { type: 'string' },
              resolved: { type: 'boolean' }
            }
          }
        },
        remainingIssues: { type: 'array', items: { type: 'string' } },
        newIssuesIntroduced: { type: 'array', items: { type: 'string' } },
        systemHealthy: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'validation', 'effectiveness']
}));

// Task 7.1: Generate Incident Report
export const generateIncidentReportTask = defineTask('generate-incident-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive incident report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer and incident analyst',
      task: 'Generate comprehensive incident report for documentation',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        reportedAt: args.reportedAt,
        resolvedAt: args.resolvedAt,
        severity: args.severity,
        rootCause: args.rootCause,
        remediation: args.remediation,
        validation: args.validation,
        timeline: args.timeline,
        artifacts: args.artifacts
      },
      instructions: [
        '1. Create executive summary of incident',
        '2. Document incident timeline with key events',
        '3. Describe incident impact and severity',
        '4. Document root cause analysis findings',
        '5. Detail remediation actions taken',
        '6. Present pre and post-remediation metrics',
        '7. Document lessons learned',
        '8. Provide prevention recommendations',
        '9. Generate both Markdown and JSON reports',
        '10. Include all relevant artifacts and links'
      ],
      outputFormat: 'JSON object with report paths and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'timelinePath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        timelinePath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            incidentId: { type: 'string' },
            incidentType: { type: 'string' },
            severity: { type: 'string' },
            duration: { type: 'string' },
            resolved: { type: 'boolean' },
            mttr: { type: 'string' }
          }
        },
        impactSummary: {
          type: 'object',
          properties: {
            usersAffected: { type: 'number' },
            requestsAffected: { type: 'number' },
            downtime: { type: 'string' }
          }
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
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
  labels: ['ml-observability', 'reporting', 'documentation']
}));

// Task 7.2: Update Monitoring
export const updateMonitoringTask = defineTask('update-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update monitoring and alerting',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring engineer',
      task: 'Update monitoring configuration based on incident learnings',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        rootCause: args.rootCause,
        lessonsLearned: args.lessonsLearned,
        newAlerts: args.newAlerts
      },
      instructions: [
        '1. Review incident root cause and lessons learned',
        '2. Identify gaps in monitoring coverage',
        '3. Configure new alerts based on recommendations',
        '4. Adjust existing alert thresholds if needed',
        '5. Add monitoring for new risk indicators',
        '6. Update dashboards with new insights',
        '7. Document monitoring changes',
        '8. Test new alerts',
        '9. Update runbooks with new procedures',
        '10. Generate monitoring update report'
      ],
      outputFormat: 'JSON object with monitoring updates'
    },
    outputSchema: {
      type: 'object',
      required: ['updated', 'dashboardUrl', 'artifacts'],
      properties: {
        updated: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        newAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'number' },
              enabled: { type: 'boolean' }
            }
          }
        },
        modifiedAlerts: { type: 'array', items: { type: 'string' } },
        dashboardUpdates: { type: 'array', items: { type: 'string' } },
        runbooksUpdated: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'monitoring', 'update']
}));

// Task 7.3: Schedule Post-Incident Review
export const schedulePostIncidentReviewTask = defineTask('schedule-post-incident-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule post-incident review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident coordinator',
      task: 'Schedule post-incident review meeting',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        incidentType: args.incidentType,
        severity: args.severity,
        incidentReport: args.incidentReport,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Determine PIR timeline based on severity (SEV1: within 48h, SEV2: within 1 week)',
        '2. Identify required attendees based on incident scope',
        '3. Create calendar invitation with incident report',
        '4. Set agenda for PIR meeting',
        '5. Assign facilitator for PIR',
        '6. Prepare pre-read materials',
        '7. Send notifications to stakeholders',
        '8. Document PIR scheduling details',
        '9. Create tracking ticket for action items',
        '10. Return scheduling confirmation'
      ],
      outputFormat: 'JSON object with PIR scheduling details'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduled', 'scheduledDate', 'artifacts'],
      properties: {
        scheduled: { type: 'boolean' },
        scheduledDate: { type: 'string' },
        meetingUrl: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
        facilitator: { type: 'string' },
        agenda: { type: 'array', items: { type: 'string' } },
        preReadMaterials: { type: 'array', items: { type: 'string' } },
        actionItemsTicket: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'pir', 'scheduling']
}));

// Task (No Incident): Generate Health Report
export const generateHealthReportTask = defineTask('generate-health-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate system health report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML monitoring specialist',
      task: 'Generate comprehensive system health report',
      context: {
        modelId: args.modelId,
        environment: args.environment,
        currentMetrics: args.currentMetrics,
        healthAssessment: args.healthAssessment,
        alertThresholds: args.alertThresholds
      },
      instructions: [
        '1. Summarize current system health status',
        '2. Present key metrics and trends',
        '3. Highlight metrics within/outside thresholds',
        '4. Identify potential risks or concerns',
        '5. Provide recommendations for improvements',
        '6. Generate health score breakdown',
        '7. Create visualizations of metric trends',
        '8. Format as Markdown report',
        '9. Include links to dashboards and metrics',
        '10. Provide summary for stakeholders'
      ],
      outputFormat: 'JSON object with health report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            healthScore: { type: 'number' },
            metricsWithinThresholds: { type: 'number' },
            totalMetrics: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-observability', 'health', 'reporting']
}));
