/**
 * @process business-analysis/requirements-traceability
 * @description Establish and maintain requirements traceability matrices linking business objectives to functional requirements, test cases, and delivered features. Manage requirements baselines and change control.
 * @inputs { projectName: string, requirements: array, objectives: array, testCases: array, features: array, baseline: object }
 * @outputs { success: boolean, traceabilityMatrix: object, baselineDocument: object, changeLog: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    requirements = [],
    objectives = [],
    testCases = [],
    features = [],
    baseline = {},
    outputDir = 'traceability-output',
    includeChangeControl = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Requirements Traceability for ${projectName}`);

  // ============================================================================
  // PHASE 1: OBJECTIVES TO REQUIREMENTS TRACING
  // ============================================================================

  ctx.log('info', 'Phase 1: Tracing objectives to requirements');
  const objectivesTracing = await ctx.task(objectivesTracingTask, {
    projectName,
    objectives,
    requirements,
    outputDir
  });

  artifacts.push(...objectivesTracing.artifacts);

  // ============================================================================
  // PHASE 2: REQUIREMENTS TO TEST CASES TRACING
  // ============================================================================

  ctx.log('info', 'Phase 2: Tracing requirements to test cases');
  const testCasesTracing = await ctx.task(testCasesTracingTask, {
    projectName,
    requirements,
    testCases,
    outputDir
  });

  artifacts.push(...testCasesTracing.artifacts);

  // ============================================================================
  // PHASE 3: REQUIREMENTS TO FEATURES TRACING
  // ============================================================================

  ctx.log('info', 'Phase 3: Tracing requirements to delivered features');
  const featuresTracing = await ctx.task(featuresTracingTask, {
    projectName,
    requirements,
    features,
    outputDir
  });

  artifacts.push(...featuresTracing.artifacts);

  // ============================================================================
  // PHASE 4: BIDIRECTIONAL TRACEABILITY MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating bidirectional traceability matrix');
  const traceabilityMatrix = await ctx.task(traceabilityMatrixCreationTask, {
    projectName,
    objectivesTracing,
    testCasesTracing,
    featuresTracing,
    requirements,
    outputDir
  });

  artifacts.push(...traceabilityMatrix.artifacts);

  // ============================================================================
  // PHASE 5: COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing traceability coverage');
  const coverageAnalysis = await ctx.task(coverageAnalysisTask, {
    projectName,
    traceabilityMatrix,
    requirements,
    objectives,
    testCases,
    features,
    outputDir
  });

  artifacts.push(...coverageAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BASELINE ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing requirements baseline');
  const baselineEstablishment = await ctx.task(baselineEstablishmentTask, {
    projectName,
    requirements,
    traceabilityMatrix,
    existingBaseline: baseline,
    outputDir
  });

  artifacts.push(...baselineEstablishment.artifacts);

  // Breakpoint: Review traceability and baseline
  await ctx.breakpoint({
    question: `Traceability matrix complete for ${projectName}. Coverage: ${coverageAnalysis.overallCoverage}%. Review baseline and approve?`,
    title: 'Traceability Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        overallCoverage: coverageAnalysis.overallCoverage,
        orphanRequirements: coverageAnalysis.orphanRequirements?.length || 0,
        baselineVersion: baselineEstablishment.version
      }
    }
  });

  // ============================================================================
  // PHASE 7: CHANGE CONTROL SETUP
  // ============================================================================

  let changeControl = null;
  if (includeChangeControl) {
    ctx.log('info', 'Phase 7: Setting up change control process');
    changeControl = await ctx.task(changeControlSetupTask, {
      projectName,
      baselineEstablishment,
      requirements,
      outputDir
    });

    artifacts.push(...changeControl.artifacts);
  }

  // ============================================================================
  // PHASE 8: TRACEABILITY REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating traceability reports');
  const traceabilityReporting = await ctx.task(traceabilityReportingTask, {
    projectName,
    traceabilityMatrix,
    coverageAnalysis,
    baselineEstablishment,
    changeControl,
    outputDir
  });

  artifacts.push(...traceabilityReporting.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    traceabilityMatrix: {
      matrixPath: traceabilityMatrix.matrixPath,
      totalLinks: traceabilityMatrix.totalLinks,
      bidirectional: traceabilityMatrix.bidirectional
    },
    coverage: {
      overall: coverageAnalysis.overallCoverage,
      objectivesCoverage: coverageAnalysis.objectivesCoverage,
      testCoverage: coverageAnalysis.testCoverage,
      featureCoverage: coverageAnalysis.featureCoverage,
      orphanRequirements: coverageAnalysis.orphanRequirements
    },
    baseline: {
      version: baselineEstablishment.version,
      documentPath: baselineEstablishment.documentPath,
      requirementsCount: baselineEstablishment.requirementsCount
    },
    changeControl: changeControl ? {
      processPath: changeControl.processPath,
      changeLogPath: changeControl.changeLogPath
    } : null,
    reports: traceabilityReporting.reports,
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/requirements-traceability',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const objectivesTracingTask = defineTask('objectives-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace objectives to requirements',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with traceability expertise',
      task: 'Create traceability links from business objectives to requirements',
      context: args,
      instructions: [
        'Map each business objective to supporting requirements',
        'Identify objectives without requirements coverage',
        'Identify requirements not linked to objectives',
        'Document traceability rationale',
        'Assess strength of objective-requirement links',
        'Identify partial coverage situations',
        'Create objective coverage report',
        'Flag gaps requiring attention',
        'Document assumptions in traceability',
        'Create visual traceability diagram'
      ],
      outputFormat: 'JSON with objectiveLinks, uncoveredObjectives, orphanRequirements, coverageReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectiveLinks', 'artifacts'],
      properties: {
        objectiveLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              requirementIds: { type: 'array', items: { type: 'string' } },
              linkStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              rationale: { type: 'string' }
            }
          }
        },
        uncoveredObjectives: { type: 'array', items: { type: 'string' } },
        orphanRequirements: { type: 'array', items: { type: 'string' } },
        coveragePercentage: { type: 'number' },
        coverageReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'traceability', 'objectives']
}));

export const testCasesTracingTask = defineTask('test-cases-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace requirements to test cases',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'QA analyst with test traceability expertise',
      task: 'Create traceability links from requirements to test cases',
      context: args,
      instructions: [
        'Map each requirement to validating test cases',
        'Identify requirements without test coverage',
        'Identify orphan test cases',
        'Assess test coverage adequacy',
        'Identify requirements needing more tests',
        'Document test type coverage (unit, integration, E2E)',
        'Calculate test coverage metrics',
        'Flag critical requirements with insufficient tests',
        'Create test coverage matrix',
        'Recommend additional test cases needed'
      ],
      outputFormat: 'JSON with testLinks, uncoveredRequirements, orphanTests, coverageMetrics, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testLinks', 'artifacts'],
      properties: {
        testLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              testCaseIds: { type: 'array', items: { type: 'string' } },
              testTypes: { type: 'array', items: { type: 'string' } },
              coverageLevel: { type: 'string', enum: ['full', 'partial', 'minimal'] }
            }
          }
        },
        uncoveredRequirements: { type: 'array', items: { type: 'string' } },
        orphanTests: { type: 'array', items: { type: 'string' } },
        coverageMetrics: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' }
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
  labels: ['agent', 'business-analysis', 'traceability', 'testing']
}));

export const featuresTracingTask = defineTask('features-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace requirements to features',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with delivery tracking expertise',
      task: 'Create traceability links from requirements to delivered features',
      context: args,
      instructions: [
        'Map each requirement to implementing features',
        'Identify requirements not yet implemented',
        'Identify features without requirements (scope creep)',
        'Track implementation status per requirement',
        'Document partial implementations',
        'Assess requirement fulfillment level',
        'Create delivery coverage report',
        'Track release mapping',
        'Identify blocked requirements',
        'Document implementation deviations'
      ],
      outputFormat: 'JSON with featureLinks, unimplementedRequirements, orphanFeatures, implementationStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['featureLinks', 'artifacts'],
      properties: {
        featureLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              featureIds: { type: 'array', items: { type: 'string' } },
              implementationStatus: { type: 'string', enum: ['complete', 'partial', 'not-started', 'blocked'] },
              fulfillmentLevel: { type: 'number' }
            }
          }
        },
        unimplementedRequirements: { type: 'array', items: { type: 'string' } },
        orphanFeatures: { type: 'array', items: { type: 'string' } },
        implementationStatus: {
          type: 'object',
          properties: {
            complete: { type: 'number' },
            partial: { type: 'number' },
            notStarted: { type: 'number' },
            blocked: { type: 'number' }
          }
        },
        releaseMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'traceability', 'delivery']
}));

export const traceabilityMatrixCreationTask = defineTask('traceability-matrix-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create bidirectional traceability matrix',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'requirements management specialist',
      task: 'Create comprehensive bidirectional traceability matrix',
      context: args,
      instructions: [
        'Consolidate all traceability links into single matrix',
        'Create forward traceability (objectives -> requirements -> tests -> features)',
        'Create backward traceability (features -> tests -> requirements -> objectives)',
        'Ensure bidirectional consistency',
        'Add link metadata (type, status, date)',
        'Create matrix visualization',
        'Generate matrix in multiple formats (spreadsheet, diagram)',
        'Calculate matrix completeness',
        'Identify inconsistencies in links',
        'Create matrix summary report'
      ],
      outputFormat: 'JSON with matrixPath, totalLinks, bidirectional, matrixData, inconsistencies, completeness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrixPath', 'totalLinks', 'artifacts'],
      properties: {
        matrixPath: { type: 'string' },
        totalLinks: { type: 'number' },
        bidirectional: { type: 'boolean' },
        matrixData: {
          type: 'object',
          properties: {
            forward: { type: 'array', items: { type: 'object' } },
            backward: { type: 'array', items: { type: 'object' } }
          }
        },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        completeness: { type: 'number' },
        visualizationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'traceability-matrix', 'babok']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze traceability coverage',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'requirements analyst with coverage analysis expertise',
      task: 'Analyze traceability coverage and identify gaps',
      context: args,
      instructions: [
        'Calculate overall traceability coverage percentage',
        'Calculate objectives coverage',
        'Calculate test coverage per requirement',
        'Calculate feature delivery coverage',
        'Identify orphan requirements (no upstream links)',
        'Identify gold-plating (features without requirements)',
        'Assess critical path coverage',
        'Identify high-risk coverage gaps',
        'Create coverage heatmap',
        'Provide coverage improvement recommendations'
      ],
      outputFormat: 'JSON with overallCoverage, objectivesCoverage, testCoverage, featureCoverage, orphanRequirements, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCoverage', 'artifacts'],
      properties: {
        overallCoverage: { type: 'number', minimum: 0, maximum: 100 },
        objectivesCoverage: { type: 'number' },
        testCoverage: { type: 'number' },
        featureCoverage: { type: 'number' },
        orphanRequirements: { type: 'array', items: { type: 'string' } },
        goldPlating: { type: 'array', items: { type: 'string' } },
        criticalPathCoverage: { type: 'number' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        heatmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'coverage-analysis', 'traceability']
}));

export const baselineEstablishmentTask = defineTask('baseline-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish requirements baseline',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'requirements management specialist with baseline expertise',
      task: 'Establish formal requirements baseline for change control',
      context: args,
      instructions: [
        'Define baseline scope and contents',
        'Version all requirements in baseline',
        'Document baseline approval criteria',
        'Create baseline snapshot document',
        'Establish baseline version number',
        'Document what is included vs excluded',
        'Define baseline freeze date',
        'Create baseline change request process',
        'Document baseline stakeholder approvals',
        'Establish baseline comparison mechanism'
      ],
      outputFormat: 'JSON with version, documentPath, requirementsCount, baselineDate, approvals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['version', 'documentPath', 'requirementsCount', 'artifacts'],
      properties: {
        version: { type: 'string' },
        documentPath: { type: 'string' },
        requirementsCount: { type: 'number' },
        baselineDate: { type: 'string' },
        freezeDate: { type: 'string' },
        approvals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approver: { type: 'string' },
              role: { type: 'string' },
              date: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        includedItems: { type: 'array', items: { type: 'string' } },
        excludedItems: { type: 'array', items: { type: 'string' } },
        comparisonBasis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'baseline', 'requirements-management']
}));

export const changeControlSetupTask = defineTask('change-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup change control process',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'change management specialist',
      task: 'Setup requirements change control process and change log',
      context: args,
      instructions: [
        'Define change request submission process',
        'Create change request template',
        'Define change impact assessment process',
        'Establish change control board (CCB) structure',
        'Define approval workflow by change type',
        'Create change log structure',
        'Define change classification (minor, major, critical)',
        'Establish emergency change process',
        'Define change communication process',
        'Create change tracking metrics'
      ],
      outputFormat: 'JSON with processPath, changeLogPath, requestTemplate, approvalWorkflow, ccbStructure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processPath', 'changeLogPath', 'artifacts'],
      properties: {
        processPath: { type: 'string' },
        changeLogPath: { type: 'string' },
        requestTemplate: { type: 'object' },
        approvalWorkflow: {
          type: 'object',
          properties: {
            minor: { type: 'array', items: { type: 'string' } },
            major: { type: 'array', items: { type: 'string' } },
            critical: { type: 'array', items: { type: 'string' } }
          }
        },
        ccbStructure: {
          type: 'object',
          properties: {
            members: { type: 'array', items: { type: 'string' } },
            meetingFrequency: { type: 'string' },
            quorum: { type: 'number' }
          }
        },
        emergencyProcess: { type: 'object' },
        metrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'change-control', 'governance']
}));

export const traceabilityReportingTask = defineTask('traceability-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate traceability reports',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'reporting specialist with requirements management expertise',
      task: 'Generate comprehensive traceability and coverage reports',
      context: args,
      instructions: [
        'Generate executive summary report',
        'Create detailed traceability matrix report',
        'Generate coverage analysis report',
        'Create baseline status report',
        'Generate change log report (if applicable)',
        'Create gap analysis report',
        'Generate stakeholder-specific views',
        'Create visual dashboards',
        'Generate compliance reports',
        'Document report distribution plan'
      ],
      outputFormat: 'JSON with reports, dashboardPath, distributionPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        dashboardPath: { type: 'string' },
        distributionPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              report: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
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
  labels: ['agent', 'business-analysis', 'reporting', 'traceability']
}));
