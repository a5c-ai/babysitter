/**
 * @process civil-engineering/structural-peer-review
 * @description Independent peer review of structural design including code compliance verification, calculation checks, and constructability review
 * @inputs { projectId: string, designDocuments: object, calculationPackage: object, specifications: object }
 * @outputs { success: boolean, peerReviewReport: object, commentResolution: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    designDocuments,
    calculationPackage,
    specifications,
    designCriteria,
    geotechnicalReport,
    reviewScope = 'comprehensive',
    outputDir = 'peer-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Review Scope Definition
  ctx.log('info', 'Starting structural peer review: Defining scope');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    projectId,
    designDocuments,
    reviewScope,
    outputDir
  });

  if (!scopeDefinition.success) {
    return {
      success: false,
      error: 'Scope definition failed',
      details: scopeDefinition,
      metadata: { processId: 'civil-engineering/structural-peer-review', timestamp: startTime }
    };
  }

  artifacts.push(...scopeDefinition.artifacts);

  // Task 2: Code Compliance Review
  ctx.log('info', 'Reviewing code compliance');
  const codeCompliance = await ctx.task(codeComplianceTask, {
    projectId,
    designDocuments,
    calculationPackage,
    designCriteria,
    outputDir
  });

  artifacts.push(...codeCompliance.artifacts);

  // Task 3: Load Analysis Review
  ctx.log('info', 'Reviewing load analysis');
  const loadReview = await ctx.task(loadReviewTask, {
    projectId,
    calculationPackage,
    designCriteria,
    outputDir
  });

  artifacts.push(...loadReview.artifacts);

  // Task 4: Structural Analysis Review
  ctx.log('info', 'Reviewing structural analysis');
  const analysisReview = await ctx.task(analysisReviewTask, {
    projectId,
    calculationPackage,
    designDocuments,
    outputDir
  });

  artifacts.push(...analysisReview.artifacts);

  // Task 5: Member Design Review
  ctx.log('info', 'Reviewing member designs');
  const memberReview = await ctx.task(memberReviewTask, {
    projectId,
    calculationPackage,
    designDocuments,
    outputDir
  });

  artifacts.push(...memberReview.artifacts);

  // Breakpoint: Review findings
  const totalComments = codeCompliance.comments.length +
                        loadReview.comments.length +
                        analysisReview.comments.length +
                        memberReview.comments.length;
  await ctx.breakpoint({
    question: `Peer review complete for ${projectId}. Total comments: ${totalComments}. Review findings?`,
    title: 'Structural Peer Review Summary',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        codeComplianceComments: codeCompliance.comments.length,
        loadReviewComments: loadReview.comments.length,
        analysisComments: analysisReview.comments.length,
        memberDesignComments: memberReview.comments.length,
        criticalIssues: codeCompliance.criticalIssues + analysisReview.criticalIssues
      }
    }
  });

  // Task 6: Connection Review
  ctx.log('info', 'Reviewing connections');
  const connectionReview = await ctx.task(connectionReviewTask, {
    projectId,
    calculationPackage,
    designDocuments,
    outputDir
  });

  artifacts.push(...connectionReview.artifacts);

  // Task 7: Constructability Review
  ctx.log('info', 'Reviewing constructability');
  const constructabilityReview = await ctx.task(constructabilityReviewTask, {
    projectId,
    designDocuments,
    specifications,
    outputDir
  });

  artifacts.push(...constructabilityReview.artifacts);

  // Task 8: Comment Resolution Tracking
  ctx.log('info', 'Tracking comment resolution');
  const commentResolution = await ctx.task(commentResolutionTask, {
    projectId,
    codeCompliance,
    loadReview,
    analysisReview,
    memberReview,
    connectionReview,
    constructabilityReview,
    outputDir
  });

  artifacts.push(...commentResolution.artifacts);

  // Task 9: Peer Review Report
  ctx.log('info', 'Generating peer review report');
  const peerReviewReport = await ctx.task(peerReviewReportTask, {
    projectId,
    scopeDefinition,
    codeCompliance,
    loadReview,
    analysisReview,
    memberReview,
    connectionReview,
    constructabilityReview,
    commentResolution,
    outputDir
  });

  artifacts.push(...peerReviewReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    peerReviewReport: peerReviewReport.report,
    commentResolution: commentResolution.resolutions,
    reviewFindings: {
      codeCompliance: codeCompliance.findings,
      loadAnalysis: loadReview.findings,
      structuralAnalysis: analysisReview.findings,
      memberDesign: memberReview.findings,
      connections: connectionReview.findings,
      constructability: constructabilityReview.findings
    },
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/structural-peer-review',
      timestamp: startTime,
      projectId,
      reviewScope,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define peer review scope',
  agent: {
    name: 'structural-design-engineer',
    prompt: {
      role: 'senior structural engineer',
      task: 'Define peer review scope and approach',
      context: args,
      instructions: [
        'Review project description and scope',
        'Identify structural systems to review',
        'Define review depth and approach',
        'Identify critical elements for review',
        'List applicable codes and standards',
        'Define review deliverables',
        'Establish review schedule',
        'Create review checklist'
      ],
      outputFormat: 'JSON with review scope, checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scope', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scope: { type: 'object' },
        structuralSystems: { type: 'array' },
        criticalElements: { type: 'array' },
        applicableCodes: { type: 'array' },
        reviewChecklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'scope']
}));

// Task 2: Code Compliance Review
export const codeComplianceTask = defineTask('code-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review code compliance',
  agent: {
    name: 'structural-design-engineer',
    prompt: {
      role: 'code compliance specialist',
      task: 'Review structural design for code compliance',
      context: args,
      instructions: [
        'Verify applicable building code edition',
        'Check seismic design category determination',
        'Verify wind design parameters',
        'Check load combinations',
        'Verify structural system limitations',
        'Check detailing requirements',
        'Verify drift and deflection limits',
        'Document non-compliance issues'
      ],
      outputFormat: 'JSON with compliance review, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'criticalIssues', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        criticalIssues: { type: 'number' },
        findings: { type: 'object' },
        complianceMatrix: { type: 'object' },
        codeReferences: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'code-compliance']
}));

// Task 3: Load Analysis Review
export const loadReviewTask = defineTask('load-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review load analysis',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Review structural load analysis',
      context: args,
      instructions: [
        'Verify dead load calculations',
        'Check live load assumptions',
        'Verify wind load calculations',
        'Check seismic load calculations',
        'Verify snow and rain loads',
        'Check load combinations',
        'Verify load paths',
        'Review special load conditions'
      ],
      outputFormat: 'JSON with load review findings, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        findings: { type: 'object' },
        deadLoadReview: { type: 'object' },
        liveLoadReview: { type: 'object' },
        lateralLoadReview: { type: 'object' },
        loadCombinationReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'loads']
}));

// Task 4: Structural Analysis Review
export const analysisReviewTask = defineTask('analysis-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review structural analysis',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural analysis engineer',
      task: 'Review structural analysis model and results',
      context: args,
      instructions: [
        'Review analysis model assumptions',
        'Check boundary conditions',
        'Verify member connectivity',
        'Review analysis results reasonableness',
        'Check force distribution',
        'Verify drift results',
        'Check P-delta effects',
        'Review dynamic analysis if applicable'
      ],
      outputFormat: 'JSON with analysis review findings, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'criticalIssues', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        criticalIssues: { type: 'number' },
        findings: { type: 'object' },
        modelReview: { type: 'object' },
        resultsReview: { type: 'object' },
        driftReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'analysis']
}));

// Task 5: Member Design Review
export const memberReviewTask = defineTask('member-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review member designs',
  agent: {
    name: 'structural-design-engineer',
    prompt: {
      role: 'structural design engineer',
      task: 'Review structural member designs',
      context: args,
      instructions: [
        'Review beam designs',
        'Review column designs',
        'Review slab designs',
        'Review wall designs',
        'Check shear and flexure capacity',
        'Verify deflection limits',
        'Check reinforcement details',
        'Verify seismic detailing'
      ],
      outputFormat: 'JSON with member design review, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        findings: { type: 'object' },
        beamReview: { type: 'object' },
        columnReview: { type: 'object' },
        slabReview: { type: 'object' },
        wallReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'member-design']
}));

// Task 6: Connection Review
export const connectionReviewTask = defineTask('connection-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review connections',
  agent: {
    name: 'structural-design-engineer',
    prompt: {
      role: 'connection design engineer',
      task: 'Review structural connections',
      context: args,
      instructions: [
        'Review steel connections',
        'Review concrete connections/joints',
        'Check load transfer mechanisms',
        'Verify connection capacities',
        'Check seismic connection details',
        'Review collector connections',
        'Check base plate designs',
        'Verify embedment details'
      ],
      outputFormat: 'JSON with connection review, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        findings: { type: 'object' },
        steelConnectionReview: { type: 'object' },
        concreteConnectionReview: { type: 'object' },
        seismicDetailReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'connections']
}));

// Task 7: Constructability Review
export const constructabilityReviewTask = defineTask('constructability-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review constructability',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'construction engineer',
      task: 'Review design for constructability',
      context: args,
      instructions: [
        'Review concrete placement feasibility',
        'Check reinforcement congestion',
        'Review steel erection sequence',
        'Check accessibility for construction',
        'Review formwork requirements',
        'Identify construction tolerances',
        'Check coordination with other trades',
        'Identify potential field issues'
      ],
      outputFormat: 'JSON with constructability findings, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'findings', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        findings: { type: 'object' },
        concreteConstructability: { type: 'object' },
        steelConstructability: { type: 'object' },
        coordinationIssues: { type: 'array' },
        potentialFieldIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'constructability']
}));

// Task 8: Comment Resolution Tracking
export const commentResolutionTask = defineTask('comment-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track comment resolution',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'peer review coordinator',
      task: 'Track and manage comment resolution',
      context: args,
      instructions: [
        'Compile all review comments',
        'Assign comment numbers',
        'Categorize by severity',
        'Track designer responses',
        'Verify comment closure',
        'Document open items',
        'Create resolution matrix',
        'Generate tracking report'
      ],
      outputFormat: 'JSON with resolution tracking, status'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutions', 'artifacts'],
      properties: {
        resolutions: { type: 'array' },
        openComments: { type: 'number' },
        closedComments: { type: 'number' },
        resolutionMatrix: { type: 'object' },
        trackingReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'resolution']
}));

// Task 9: Peer Review Report
export const peerReviewReportTask = defineTask('peer-review-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate peer review report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'senior structural engineer',
      task: 'Generate comprehensive peer review report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document review scope',
        'Present code compliance findings',
        'Present load analysis findings',
        'Present structural analysis findings',
        'Present member design findings',
        'Present connection findings',
        'Present constructability findings',
        'Include comment resolution status',
        'Provide conclusions and recommendations'
      ],
      outputFormat: 'JSON with report, conclusions'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        reportPath: { type: 'string' },
        conclusions: { type: 'array' },
        recommendations: { type: 'array' },
        designAdequacy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'peer-review', 'reporting']
}));
