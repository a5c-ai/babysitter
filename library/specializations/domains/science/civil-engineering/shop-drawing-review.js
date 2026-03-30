/**
 * @process civil-engineering/shop-drawing-review
 * @description Review of contractor shop drawings and submittals for compliance with design intent and specifications
 * @inputs { projectId: string, submittalPackage: object, designDocuments: object, specifications: object }
 * @outputs { success: boolean, reviewComments: array, approvalStatus: string, rfiResponses: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    submittalPackage,
    designDocuments,
    specifications,
    submittalType,
    contractRequirements,
    outputDir = 'shop-drawing-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Submittal Log and Tracking
  ctx.log('info', 'Starting shop drawing review: Logging submittal');
  const submittalLogging = await ctx.task(submittalLoggingTask, {
    projectId,
    submittalPackage,
    contractRequirements,
    outputDir
  });

  if (!submittalLogging.success) {
    return {
      success: false,
      error: 'Submittal logging failed',
      details: submittalLogging,
      metadata: { processId: 'civil-engineering/shop-drawing-review', timestamp: startTime }
    };
  }

  artifacts.push(...submittalLogging.artifacts);

  // Task 2: Specification Compliance Review
  ctx.log('info', 'Reviewing specification compliance');
  const specCompliance = await ctx.task(specComplianceTask, {
    projectId,
    submittalPackage,
    specifications,
    outputDir
  });

  artifacts.push(...specCompliance.artifacts);

  // Task 3: Design Intent Review
  ctx.log('info', 'Reviewing design intent');
  const designIntentReview = await ctx.task(designIntentTask, {
    projectId,
    submittalPackage,
    designDocuments,
    submittalType,
    outputDir
  });

  artifacts.push(...designIntentReview.artifacts);

  // Task 4: Dimensional and Coordination Review
  ctx.log('info', 'Reviewing dimensions and coordination');
  const coordinationReview = await ctx.task(coordinationReviewTask, {
    projectId,
    submittalPackage,
    designDocuments,
    outputDir
  });

  artifacts.push(...coordinationReview.artifacts);

  // Task 5: Material and Product Review
  ctx.log('info', 'Reviewing materials and products');
  const materialReview = await ctx.task(materialReviewTask, {
    projectId,
    submittalPackage,
    specifications,
    outputDir
  });

  artifacts.push(...materialReview.artifacts);

  // Breakpoint: Review findings
  const totalComments = specCompliance.comments.length +
                        designIntentReview.comments.length +
                        coordinationReview.comments.length +
                        materialReview.comments.length;
  await ctx.breakpoint({
    question: `Shop drawing review complete for ${projectId}. Total comments: ${totalComments}. Review findings and determine action?`,
    title: 'Shop Drawing Review Summary',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        specComplianceComments: specCompliance.comments.length,
        designIntentComments: designIntentReview.comments.length,
        coordinationComments: coordinationReview.comments.length,
        materialComments: materialReview.comments.length,
        hasRejectableItems: specCompliance.hasRejectableItems || designIntentReview.hasRejectableItems
      }
    }
  });

  // Task 6: Review Comment Compilation
  ctx.log('info', 'Compiling review comments');
  const commentCompilation = await ctx.task(commentCompilationTask, {
    projectId,
    specCompliance,
    designIntentReview,
    coordinationReview,
    materialReview,
    outputDir
  });

  artifacts.push(...commentCompilation.artifacts);

  // Task 7: Approval Determination
  ctx.log('info', 'Determining approval status');
  const approvalDetermination = await ctx.task(approvalDeterminationTask, {
    projectId,
    commentCompilation,
    contractRequirements,
    outputDir
  });

  artifacts.push(...approvalDetermination.artifacts);

  // Task 8: Review Response Package
  ctx.log('info', 'Generating review response package');
  const responsePackage = await ctx.task(responsePackageTask, {
    projectId,
    submittalLogging,
    commentCompilation,
    approvalDetermination,
    outputDir
  });

  artifacts.push(...responsePackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    reviewComments: commentCompilation.allComments,
    approvalStatus: approvalDetermination.status,
    approvalStamp: approvalDetermination.stamp,
    rfiResponses: designIntentReview.rfiResponses || [],
    reviewPackage: responsePackage.package,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/shop-drawing-review',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Submittal Logging
export const submittalLoggingTask = defineTask('submittal-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Log and track submittal',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'document controller',
      task: 'Log submittal and verify completeness',
      context: args,
      instructions: [
        'Assign submittal number',
        'Verify submittal matches spec section',
        'Check for required number of copies',
        'Verify contractor certification',
        'Check for required data/calculations',
        'Verify resubmittal addresses prior comments',
        'Log receipt date and due date',
        'Create submittal tracking entry'
      ],
      outputFormat: 'JSON with submittal log entry, completeness check'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'submittalNumber', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        submittalNumber: { type: 'string' },
        specSection: { type: 'string' },
        receiptDate: { type: 'string' },
        dueDate: { type: 'string' },
        completenessCheck: { type: 'object' },
        isResubmittal: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'logging']
}));

// Task 2: Specification Compliance Review
export const specComplianceTask = defineTask('spec-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review specification compliance',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'specifications engineer',
      task: 'Review submittal for specification compliance',
      context: args,
      instructions: [
        'Compare submittal to specification requirements',
        'Verify material grades and standards',
        'Check manufacturer/product approval status',
        'Verify test reports and certifications',
        'Check for substitution requests',
        'Identify non-compliant items',
        'Document deviations from specifications',
        'Generate compliance comments'
      ],
      outputFormat: 'JSON with compliance review, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'hasRejectableItems', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        hasRejectableItems: { type: 'boolean' },
        complianceMatrix: { type: 'object' },
        deviations: { type: 'array' },
        substitutionRequests: { type: 'array' },
        certifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'compliance']
}));

// Task 3: Design Intent Review
export const designIntentTask = defineTask('design-intent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review design intent',
  agent: {
    name: 'structural-design-engineer',
    prompt: {
      role: 'design engineer',
      task: 'Review submittal for design intent compliance',
      context: args,
      instructions: [
        'Compare to contract drawings',
        'Verify structural adequacy',
        'Check load paths and connections',
        'Verify clearances and interfaces',
        'Check for design changes',
        'Review fabrication details',
        'Identify deviations from design intent',
        'Respond to embedded RFIs'
      ],
      outputFormat: 'JSON with design review, comments, RFI responses'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'hasRejectableItems', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        hasRejectableItems: { type: 'boolean' },
        designChanges: { type: 'array' },
        structuralAdequacy: { type: 'object' },
        rfiResponses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'design-intent']
}));

// Task 4: Coordination Review
export const coordinationReviewTask = defineTask('coordination-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review dimensional coordination',
  agent: {
    name: 'bim-coordinator',
    prompt: {
      role: 'project coordinator',
      task: 'Review submittal for dimensional coordination',
      context: args,
      instructions: [
        'Verify dimensions match contract documents',
        'Check interface dimensions with other trades',
        'Verify field measurements if required',
        'Check for coordination issues',
        'Verify clearances for installation',
        'Check anchor bolt layouts',
        'Review connection points',
        'Identify coordination conflicts'
      ],
      outputFormat: 'JSON with coordination review, conflicts'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        dimensionalChecks: { type: 'object' },
        coordinationConflicts: { type: 'array' },
        interfaceIssues: { type: 'array' },
        fieldVerificationNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'coordination']
}));

// Task 5: Material Review
export const materialReviewTask = defineTask('material-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review materials and products',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'materials engineer',
      task: 'Review material submittals',
      context: args,
      instructions: [
        'Review material certifications',
        'Verify mill test reports',
        'Check product data sheets',
        'Verify material properties',
        'Review finish and coating specs',
        'Check warranty documentation',
        'Verify code compliance',
        'Identify material deficiencies'
      ],
      outputFormat: 'JSON with material review, comments'
    },
    outputSchema: {
      type: 'object',
      required: ['comments', 'artifacts'],
      properties: {
        comments: { type: 'array' },
        certifications: { type: 'object' },
        testReports: { type: 'array' },
        materialProperties: { type: 'object' },
        warrantyStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'materials']
}));

// Task 6: Comment Compilation
export const commentCompilationTask = defineTask('comment-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile review comments',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'submittal reviewer',
      task: 'Compile and organize review comments',
      context: args,
      instructions: [
        'Consolidate all review comments',
        'Assign comment numbers',
        'Categorize by severity',
        'Identify items requiring resubmittal',
        'Identify items for information only',
        'Prioritize critical issues',
        'Format comments clearly',
        'Create marked-up drawings if needed'
      ],
      outputFormat: 'JSON with compiled comments, marked drawings'
    },
    outputSchema: {
      type: 'object',
      required: ['allComments', 'artifacts'],
      properties: {
        allComments: { type: 'array' },
        criticalIssues: { type: 'array' },
        resubmittalRequired: { type: 'array' },
        informationOnly: { type: 'array' },
        markedDrawings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'comments']
}));

// Task 7: Approval Determination
export const approvalDeterminationTask = defineTask('approval-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine approval status',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'senior engineer',
      task: 'Determine submittal approval status',
      context: args,
      instructions: [
        'Evaluate severity of comments',
        'Determine if submittal meets requirements',
        'Select appropriate action stamp',
        'Document approval conditions',
        'Identify resubmittal requirements',
        'Note exceptions taken',
        'Apply approval stamp',
        'Document approval rationale'
      ],
      outputFormat: 'JSON with approval status, stamp, conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'stamp', 'artifacts'],
      properties: {
        status: { type: 'string' },
        stamp: { type: 'string' },
        conditions: { type: 'array' },
        resubmittalRequired: { type: 'boolean' },
        exceptionsTaken: { type: 'array' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'approval']
}));

// Task 8: Response Package
export const responsePackageTask = defineTask('response-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate review response package',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'document controller',
      task: 'Generate submittal response package',
      context: args,
      instructions: [
        'Create transmittal letter',
        'Attach stamped drawings',
        'Include review comments',
        'Include RFI responses',
        'Update submittal log',
        'Distribute to required parties',
        'Archive review package',
        'Track resubmittal if required'
      ],
      outputFormat: 'JSON with response package, distribution'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: { type: 'object' },
        transmittal: { type: 'object' },
        stampedDrawings: { type: 'array' },
        distributionList: { type: 'array' },
        archiveLocation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'submittals', 'response']
}));
