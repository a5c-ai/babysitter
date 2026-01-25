/**
 * @process civil-engineering/bim-coordination
 * @description Building Information Modeling coordination including model development, clash detection, and multi-discipline integration
 * @inputs { projectId: string, bimExecutionPlan: object, disciplineModels: array, projectRequirements: object }
 * @outputs { success: boolean, coordinatedModel: object, clashReports: array, coordinationDrawings: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    bimExecutionPlan,
    disciplineModels,
    projectRequirements,
    modelStandards,
    lodRequirements,
    outputDir = 'bim-coordination-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: BIM Standards Verification
  ctx.log('info', 'Starting BIM coordination: Verifying model standards');
  const standardsVerification = await ctx.task(standardsVerificationTask, {
    projectId,
    disciplineModels,
    modelStandards,
    bimExecutionPlan,
    outputDir
  });

  if (!standardsVerification.success) {
    return {
      success: false,
      error: 'Standards verification failed',
      details: standardsVerification,
      metadata: { processId: 'civil-engineering/bim-coordination', timestamp: startTime }
    };
  }

  artifacts.push(...standardsVerification.artifacts);

  // Task 2: Model Aggregation
  ctx.log('info', 'Aggregating discipline models');
  const modelAggregation = await ctx.task(modelAggregationTask, {
    projectId,
    disciplineModels,
    standardsVerification,
    outputDir
  });

  artifacts.push(...modelAggregation.artifacts);

  // Task 3: Clash Detection
  ctx.log('info', 'Running clash detection');
  const clashDetection = await ctx.task(clashDetectionTask, {
    projectId,
    modelAggregation,
    bimExecutionPlan,
    outputDir
  });

  artifacts.push(...clashDetection.artifacts);

  // Task 4: Clash Analysis and Prioritization
  ctx.log('info', 'Analyzing and prioritizing clashes');
  const clashAnalysis = await ctx.task(clashAnalysisTask, {
    projectId,
    clashDetection,
    outputDir
  });

  artifacts.push(...clashAnalysis.artifacts);

  // Breakpoint: Review clash detection results
  await ctx.breakpoint({
    question: `Clash detection complete for ${projectId}. Total clashes: ${clashDetection.totalClashes}, Critical: ${clashAnalysis.criticalClashes}. Review and proceed to resolution?`,
    title: 'BIM Clash Detection Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalClashes: clashDetection.totalClashes,
        criticalClashes: clashAnalysis.criticalClashes,
        majorClashes: clashAnalysis.majorClashes,
        minorClashes: clashAnalysis.minorClashes,
        disciplinesInvolved: clashAnalysis.disciplinesInvolved
      }
    }
  });

  // Task 5: Clash Resolution Coordination
  ctx.log('info', 'Coordinating clash resolution');
  const clashResolution = await ctx.task(clashResolutionTask, {
    projectId,
    clashAnalysis,
    disciplineModels,
    outputDir
  });

  artifacts.push(...clashResolution.artifacts);

  // Task 6: Model Update Verification
  ctx.log('info', 'Verifying model updates');
  const updateVerification = await ctx.task(updateVerificationTask, {
    projectId,
    clashResolution,
    modelAggregation,
    outputDir
  });

  artifacts.push(...updateVerification.artifacts);

  // Task 7: Coordination Drawings
  ctx.log('info', 'Generating coordination drawings');
  const coordinationDrawings = await ctx.task(coordinationDrawingsTask, {
    projectId,
    modelAggregation,
    updateVerification,
    outputDir
  });

  artifacts.push(...coordinationDrawings.artifacts);

  // Task 8: BIM Coordination Report
  ctx.log('info', 'Generating BIM coordination report');
  const coordinationReport = await ctx.task(coordinationReportTask, {
    projectId,
    standardsVerification,
    clashDetection,
    clashAnalysis,
    clashResolution,
    updateVerification,
    coordinationDrawings,
    outputDir
  });

  artifacts.push(...coordinationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    coordinatedModel: modelAggregation.federatedModel,
    clashReports: clashDetection.reports,
    clashResolutionStatus: clashResolution.status,
    coordinationDrawings: coordinationDrawings.drawings,
    modelQualityScore: standardsVerification.qualityScore,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/bim-coordination',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Standards Verification
export const standardsVerificationTask = defineTask('standards-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify BIM standards compliance',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM manager',
      task: 'Verify discipline models meet BIM standards',
      context: args,
      instructions: [
        'Check model file naming conventions',
        'Verify coordinate system alignment',
        'Check level of development (LOD)',
        'Verify element naming standards',
        'Check for required parameters/properties',
        'Verify model units',
        'Check file size and optimization',
        'Generate standards compliance report'
      ],
      outputFormat: 'JSON with compliance results, quality score'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'qualityScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        qualityScore: { type: 'number' },
        complianceResults: { type: 'object' },
        namingConventions: { type: 'object' },
        coordinateAlignment: { type: 'object' },
        lodCompliance: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'standards']
}));

// Task 2: Model Aggregation
export const modelAggregationTask = defineTask('model-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate discipline models',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM coordinator',
      task: 'Create federated model from discipline models',
      context: args,
      instructions: [
        'Link all discipline models',
        'Verify model positioning',
        'Check for missing elements',
        'Verify model completeness',
        'Create work sets if needed',
        'Set up coordination views',
        'Configure clash detection zones',
        'Document aggregation setup'
      ],
      outputFormat: 'JSON with federated model, configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['federatedModel', 'artifacts'],
      properties: {
        federatedModel: { type: 'object' },
        linkedModels: { type: 'array' },
        coordinationViews: { type: 'array' },
        detectionZones: { type: 'array' },
        modelCompleteness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'aggregation']
}));

// Task 3: Clash Detection
export const clashDetectionTask = defineTask('clash-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run clash detection',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM coordinator',
      task: 'Run clash detection between disciplines',
      context: args,
      instructions: [
        'Configure clash detection rules',
        'Run structural vs MEP clashes',
        'Run MEP vs MEP clashes',
        'Run architectural vs structural clashes',
        'Apply tolerance settings',
        'Group related clashes',
        'Filter false positives',
        'Generate clash reports'
      ],
      outputFormat: 'JSON with clash results, reports'
    },
    outputSchema: {
      type: 'object',
      required: ['totalClashes', 'reports', 'artifacts'],
      properties: {
        totalClashes: { type: 'number' },
        reports: { type: 'array' },
        clashMatrix: { type: 'object' },
        clashTests: { type: 'array' },
        groupedClashes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'clash-detection']
}));

// Task 4: Clash Analysis
export const clashAnalysisTask = defineTask('clash-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and prioritize clashes',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM coordinator',
      task: 'Analyze and prioritize detected clashes',
      context: args,
      instructions: [
        'Categorize by severity (critical, major, minor)',
        'Identify disciplines involved',
        'Determine responsible party',
        'Assign resolution priority',
        'Identify systemic issues',
        'Group by location/zone',
        'Identify design vs coordination clashes',
        'Create prioritized clash list'
      ],
      outputFormat: 'JSON with analyzed clashes, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalClashes', 'majorClashes', 'minorClashes', 'disciplinesInvolved', 'artifacts'],
      properties: {
        criticalClashes: { type: 'number' },
        majorClashes: { type: 'number' },
        minorClashes: { type: 'number' },
        disciplinesInvolved: { type: 'array' },
        prioritizedList: { type: 'array' },
        systemicIssues: { type: 'array' },
        responsibleParties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'clash-analysis']
}));

// Task 5: Clash Resolution
export const clashResolutionTask = defineTask('clash-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate clash resolution',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM coordinator',
      task: 'Coordinate clash resolution process',
      context: args,
      instructions: [
        'Assign clashes to responsible disciplines',
        'Document proposed resolutions',
        'Coordinate multi-discipline solutions',
        'Track resolution progress',
        'Verify resolved clashes',
        'Document design changes required',
        'Update clash status',
        'Generate resolution report'
      ],
      outputFormat: 'JSON with resolution status, assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'object' },
        assignments: { type: 'array' },
        resolutions: { type: 'array' },
        pendingClashes: { type: 'number' },
        resolvedClashes: { type: 'number' },
        designChanges: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'clash-resolution']
}));

// Task 6: Update Verification
export const updateVerificationTask = defineTask('update-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify model updates',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM coordinator',
      task: 'Verify clash resolution model updates',
      context: args,
      instructions: [
        'Re-run clash detection on updated models',
        'Verify clashes are resolved',
        'Check for new clashes introduced',
        'Verify model consistency',
        'Update clash status log',
        'Document remaining issues',
        'Verify coordination with design',
        'Generate verification report'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationResults', 'artifacts'],
      properties: {
        verificationResults: { type: 'object' },
        resolvedVerified: { type: 'number' },
        newClashes: { type: 'number' },
        remainingClashes: { type: 'number' },
        modelConsistency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'verification']
}));

// Task 7: Coordination Drawings
export const coordinationDrawingsTask = defineTask('coordination-drawings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate coordination drawings',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'BIM technician',
      task: 'Generate coordination drawings from model',
      context: args,
      instructions: [
        'Create coordination plans by level',
        'Create sections at critical areas',
        'Create MEP coordination drawings',
        'Show ceiling coordination',
        'Show sleeve and penetration plans',
        'Add dimensions and annotations',
        'Include routing conflicts',
        'Generate drawing sheets'
      ],
      outputFormat: 'JSON with coordination drawings'
    },
    outputSchema: {
      type: 'object',
      required: ['drawings', 'artifacts'],
      properties: {
        drawings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              title: { type: 'string' },
              level: { type: 'string' }
            }
          }
        },
        coordinationPlans: { type: 'array' },
        sections: { type: 'array' },
        penetrationPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'drawings']
}));

// Task 8: Coordination Report
export const coordinationReportTask = defineTask('coordination-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate BIM coordination report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'BIM manager',
      task: 'Generate BIM coordination report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document standards compliance',
        'Present clash detection results',
        'Document resolution progress',
        'Include coordination drawings',
        'Present remaining issues',
        'Provide recommendations',
        'Include action items'
      ],
      outputFormat: 'JSON with report path, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        actionItems: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bim', 'reporting']
}));
