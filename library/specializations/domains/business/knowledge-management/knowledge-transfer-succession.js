/**
 * @process domains/business/knowledge-management/knowledge-transfer-succession
 * @description Develop comprehensive knowledge transfer plans for key roles, departing employees, and succession scenarios to prevent knowledge loss
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { transferScenario: string, keyRole: object, departingEmployee: object, successor: object, transferTimeline: string, outputDir: string }
 * @outputs { success: boolean, transferPlan: object, transferActivities: array, progressTracking: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    transferScenario = 'succession',
    keyRole = {},
    departingEmployee = {},
    successor = {},
    transferTimeline = '3 months',
    criticaLKnowledge = [],
    existingDocumentation = [],
    organizationalContext = {},
    transferMethods = {
      shadowing: true,
      mentoring: true,
      documentation: true,
      handoff: true,
      training: true
    },
    outputDir = 'knowledge-transfer-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Transfer Planning for Succession Process');

  // ============================================================================
  // PHASE 1: TRANSFER NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing knowledge transfer needs');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    transferScenario,
    keyRole,
    departingEmployee,
    successor,
    criticaLKnowledge,
    existingDocumentation,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  // Breakpoint: Review needs assessment
  await ctx.breakpoint({
    question: `Identified ${needsAssessment.knowledgeToTransfer.length} knowledge areas requiring transfer. Review assessment?`,
    title: 'Transfer Needs Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        transferScenario,
        knowledgeAreas: needsAssessment.knowledgeToTransfer.length,
        transferComplexity: needsAssessment.transferComplexity,
        riskLevel: needsAssessment.riskLevel
      }
    }
  });

  // ============================================================================
  // PHASE 2: SUCCESSOR READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing successor readiness');
  const successorAssessment = await ctx.task(successorAssessmentTask, {
    successor,
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    keyRole,
    outputDir
  });

  artifacts.push(...successorAssessment.artifacts);

  // ============================================================================
  // PHASE 3: TRANSFER PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing knowledge transfer plan');
  const transferPlan = await ctx.task(transferPlanDevelopmentTask, {
    transferScenario,
    keyRole,
    departingEmployee,
    successor,
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    successorGaps: successorAssessment.gaps,
    transferTimeline,
    transferMethods,
    outputDir
  });

  artifacts.push(...transferPlan.artifacts);

  // Breakpoint: Review transfer plan
  await ctx.breakpoint({
    question: `Transfer plan created with ${transferPlan.activities.length} activities over ${transferTimeline}. Review plan?`,
    title: 'Transfer Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalActivities: transferPlan.activities.length,
        transferPhases: transferPlan.phases.length,
        estimatedEffort: transferPlan.estimatedEffort
      }
    }
  });

  // ============================================================================
  // PHASE 4: DOCUMENTATION REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying documentation requirements');
  const documentationRequirements = await ctx.task(documentationRequirementsTask, {
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    existingDocumentation,
    transferPlan: transferPlan.plan,
    outputDir
  });

  artifacts.push(...documentationRequirements.artifacts);

  // ============================================================================
  // PHASE 5: TRANSFER ACTIVITY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing transfer activities');
  const activityDesign = await ctx.task(transferActivityDesignTask, {
    transferPlan: transferPlan.plan,
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    successor,
    departingEmployee,
    transferMethods,
    outputDir
  });

  artifacts.push(...activityDesign.artifacts);

  // ============================================================================
  // PHASE 6: PROGRESS TRACKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up progress tracking');
  const progressTracking = await ctx.task(progressTrackingSetupTask, {
    transferPlan: transferPlan.plan,
    activities: activityDesign.activities,
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    outputDir
  });

  artifacts.push(...progressTracking.artifacts);

  // ============================================================================
  // PHASE 7: RISK MITIGATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning risk mitigation');
  const riskMitigation = await ctx.task(riskMitigationTask, {
    transferScenario,
    knowledgeToTransfer: needsAssessment.knowledgeToTransfer,
    transferPlan: transferPlan.plan,
    riskLevel: needsAssessment.riskLevel,
    outputDir
  });

  artifacts.push(...riskMitigation.artifacts);

  // ============================================================================
  // PHASE 8: COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    transferPlan: transferPlan.plan,
    departingEmployee,
    successor,
    keyRole,
    organizationalContext,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    needsAssessment,
    successorAssessment,
    transferPlan,
    activityDesign,
    progressTracking,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      transferPlan: transferPlan.plan,
      activities: activityDesign.activities,
      progressTracking: progressTracking.framework,
      riskMitigation: riskMitigation.plan,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize transfer plan?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          transferActivities: activityDesign.activities.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    transferScenario,
    transferPlan: transferPlan.plan,
    transferActivities: activityDesign.activities,
    progressTracking: progressTracking.framework,
    statistics: {
      knowledgeAreasToTransfer: needsAssessment.knowledgeToTransfer.length,
      transferActivitiesPlanned: activityDesign.activities.length,
      documentationNeeded: documentationRequirements.requiredDocuments.length,
      successorGaps: successorAssessment.gaps.length
    },
    riskMitigation: riskMitigation.plan,
    communicationPlan: communicationPlan.plan,
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/knowledge-transfer-succession',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Needs Assessment
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess knowledge transfer needs',
  agent: {
    name: 'transfer-analyst',
    prompt: {
      role: 'knowledge transfer analyst',
      task: 'Assess knowledge transfer needs for succession',
      context: args,
      instructions: [
        'Analyze the transfer scenario and context',
        'Identify knowledge to be transferred:',
        '  - Role-specific knowledge',
        '  - Technical skills and expertise',
        '  - Relationships and networks',
        '  - Processes and procedures',
        '  - Organizational knowledge',
        '  - Tacit knowledge and experience',
        'Assess knowledge criticality',
        'Identify existing documentation',
        'Evaluate transfer complexity',
        'Assess overall risk level',
        'Save needs assessment to output directory'
      ],
      outputFormat: 'JSON with knowledgeToTransfer (array), transferComplexity (string), riskLevel (string), existingResources (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledgeToTransfer', 'transferComplexity', 'riskLevel', 'artifacts'],
      properties: {
        knowledgeToTransfer: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              transferDifficulty: { type: 'string', enum: ['high', 'medium', 'low'] },
              documentation: { type: 'string', enum: ['complete', 'partial', 'none'] }
            }
          }
        },
        transferComplexity: { type: 'string', enum: ['high', 'medium', 'low'] },
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        existingResources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'transfer', 'assessment']
}));

// Task 2: Successor Assessment
export const successorAssessmentTask = defineTask('successor-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess successor readiness',
  agent: {
    name: 'readiness-assessor',
    prompt: {
      role: 'successor readiness assessor',
      task: 'Assess successor readiness for knowledge transfer',
      context: args,
      instructions: [
        'Assess successor current knowledge and skills',
        'Compare against role requirements',
        'Identify knowledge and skill gaps',
        'Assess learning capacity and style',
        'Evaluate time availability',
        'Identify prerequisites for learning',
        'Prioritize gaps by importance',
        'Save successor assessment to output directory'
      ],
      outputFormat: 'JSON with currentCapabilities (array), gaps (array), learningStyle (string), readinessScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'readinessScore', 'artifacts'],
      properties: {
        currentCapabilities: { type: 'array' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeArea: { type: 'string' },
              currentLevel: { type: 'string' },
              requiredLevel: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        learningStyle: { type: 'string' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'successor', 'assessment']
}));

// Task 3: Transfer Plan Development
export const transferPlanDevelopmentTask = defineTask('transfer-plan-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop knowledge transfer plan',
  agent: {
    name: 'transfer-planner',
    prompt: {
      role: 'knowledge transfer planner',
      task: 'Develop comprehensive knowledge transfer plan',
      context: args,
      instructions: [
        'Develop transfer plan with phases:',
        '  - Preparation phase',
        '  - Active transfer phase',
        '  - Practice and reinforcement phase',
        '  - Validation and sign-off phase',
        'Define transfer activities for each knowledge area',
        'Sequence activities logically',
        'Assign responsibilities',
        'Define timelines and milestones',
        'Estimate effort required',
        'Identify dependencies',
        'Save transfer plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), phases (array), activities (array), estimatedEffort (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'phases', 'activities', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        phases: { type: 'array' },
        activities: { type: 'array' },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'transfer', 'planning']
}));

// Task 4: Documentation Requirements
export const documentationRequirementsTask = defineTask('documentation-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify documentation requirements',
  agent: {
    name: 'documentation-analyst',
    prompt: {
      role: 'documentation requirements analyst',
      task: 'Identify documentation requirements for transfer',
      context: args,
      instructions: [
        'Analyze documentation needs:',
        '  - Existing documentation gaps',
        '  - Documentation to be created',
        '  - Documentation to be updated',
        'Prioritize documentation needs',
        'Assign documentation responsibilities',
        'Define documentation standards',
        'Create documentation schedule',
        'Save documentation requirements to output directory'
      ],
      outputFormat: 'JSON with requiredDocuments (array), documentationGaps (array), schedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredDocuments', 'artifacts'],
      properties: {
        requiredDocuments: { type: 'array' },
        documentationGaps: { type: 'array' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'documentation', 'requirements']
}));

// Task 5: Transfer Activity Design
export const transferActivityDesignTask = defineTask('transfer-activity-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design transfer activities',
  agent: {
    name: 'activity-designer',
    prompt: {
      role: 'transfer activity designer',
      task: 'Design specific knowledge transfer activities',
      context: args,
      instructions: [
        'Design transfer activities:',
        '  - Shadowing sessions',
        '  - Mentoring meetings',
        '  - Hands-on practice',
        '  - Documentation review',
        '  - Knowledge walkthroughs',
        '  - Q&A sessions',
        '  - Handoff meetings',
        'Define activity details:',
        '  - Objectives and outcomes',
        '  - Duration and frequency',
        '  - Participants and roles',
        '  - Materials and preparation',
        'Save activity designs to output directory'
      ],
      outputFormat: 'JSON with activities (array), activitySchedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              knowledgeArea: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        activitySchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'transfer', 'activities']
}));

// Task 6: Progress Tracking Setup
export const progressTrackingSetupTask = defineTask('progress-tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up progress tracking',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'progress tracking specialist',
      task: 'Set up framework for tracking transfer progress',
      context: args,
      instructions: [
        'Design progress tracking framework:',
        '  - Milestones and checkpoints',
        '  - Success criteria per knowledge area',
        '  - Assessment methods',
        '  - Progress indicators',
        'Create tracking templates',
        'Define review cadence',
        'Create escalation triggers',
        'Save tracking framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), milestones (array), assessmentMethods (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        milestones: { type: 'array' },
        assessmentMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'tracking', 'progress']
}));

// Task 7: Risk Mitigation
export const riskMitigationTask = defineTask('risk-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan risk mitigation',
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'knowledge transfer risk manager',
      task: 'Plan risk mitigation for knowledge transfer',
      context: args,
      instructions: [
        'Identify transfer risks:',
        '  - Time constraints',
        '  - Knowledge loss before transfer',
        '  - Incomplete transfer',
        '  - Successor unavailability',
        '  - Documentation gaps',
        'Develop mitigation strategies',
        'Create contingency plans',
        'Define backup knowledge holders',
        'Save risk mitigation plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), risks (array), mitigations (array), contingencies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'risks', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        risks: { type: 'array' },
        mitigations: { type: 'array' },
        contingencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'risk', 'mitigation']
}));

// Task 8: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'communication planning specialist',
      task: 'Develop communication plan for transfer',
      context: args,
      instructions: [
        'Develop communication plan:',
        '  - Stakeholder communications',
        '  - Transfer announcements',
        '  - Progress updates',
        '  - Handoff communications',
        'Define communication channels',
        'Create communication schedule',
        'Prepare key messages',
        'Save communication plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), communications (array), schedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        communications: { type: 'array' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'communication', 'planning']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'transfer plan quality assessor',
      task: 'Evaluate the quality of the knowledge transfer plan',
      context: args,
      instructions: [
        'Assess transfer plan quality:',
        '  - Completeness of coverage',
        '  - Feasibility of timeline',
        '  - Appropriateness of methods',
        '  - Risk mitigation adequacy',
        'Calculate overall quality score',
        'Identify gaps and improvements',
        'Provide recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present transfer plan to stakeholders',
        'Review activities and timeline',
        'Present risk mitigation plan',
        'Present quality assessment',
        'Gather stakeholder feedback',
        'Obtain approval or identify changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
