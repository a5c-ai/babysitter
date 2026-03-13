/**
 * @process domains/business/knowledge-management/after-action-review
 * @description Conduct structured after-action reviews following projects, incidents, or significant events to capture lessons and improvement opportunities
 * @specialization Knowledge Management
 * @category Lessons Learned
 * @inputs { eventContext: object, eventType: string, participants: array, scope: object, outputDir: string }
 * @outputs { success: boolean, aarReport: object, lessonsLearned: array, actionItems: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventContext = {},
    eventType = 'project',
    participants = [],
    scope = {
      timeframe: '',
      objectives: [],
      keyActivities: []
    },
    existingDocumentation = [],
    aarFramework = {
      methodology: 'army-aar',
      focusAreas: ['what-planned', 'what-happened', 'why-different', 'lessons', 'actions']
    },
    outputDir = 'aar-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting After-Action Review Facilitation Process');

  // ============================================================================
  // PHASE 1: AAR PLANNING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning and preparing after-action review');
  const aarPlanning = await ctx.task(aarPlanningTask, {
    eventContext,
    eventType,
    participants,
    scope,
    existingDocumentation,
    aarFramework,
    outputDir
  });

  artifacts.push(...aarPlanning.artifacts);

  // Breakpoint: Review AAR plan
  await ctx.breakpoint({
    question: `AAR plan created for ${eventType} event with ${participants.length} participants. Review plan?`,
    title: 'AAR Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        eventType,
        participants: participants.length,
        focusAreas: aarPlanning.focusAreas.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: WHAT WAS PLANNED
  // ============================================================================

  ctx.log('info', 'Phase 2: Documenting what was planned');
  const whatPlanned = await ctx.task(whatPlannedTask, {
    eventContext,
    scope,
    existingDocumentation,
    outputDir
  });

  artifacts.push(...whatPlanned.artifacts);

  // ============================================================================
  // PHASE 3: WHAT ACTUALLY HAPPENED
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting what actually happened');
  const whatHappened = await ctx.task(whatHappenedTask, {
    eventContext,
    whatPlanned: whatPlanned.plannedState,
    participants,
    outputDir
  });

  artifacts.push(...whatHappened.artifacts);

  // Breakpoint: Review planned vs actual
  await ctx.breakpoint({
    question: `Identified ${whatHappened.variances.length} variances between planned and actual. Review?`,
    title: 'Planned vs Actual Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        variancesIdentified: whatHappened.variances.length,
        successAreas: whatHappened.successes.length,
        challengeAreas: whatHappened.challenges.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: WHY IT WAS DIFFERENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing why outcomes differed from plans');
  const whyDifferent = await ctx.task(whyDifferentTask, {
    whatPlanned: whatPlanned.plannedState,
    whatHappened: whatHappened.actualState,
    variances: whatHappened.variances,
    outputDir
  });

  artifacts.push(...whyDifferent.artifacts);

  // ============================================================================
  // PHASE 5: LESSONS LEARNED EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Extracting lessons learned');
  const lessonsExtraction = await ctx.task(lessonsExtractionTask, {
    eventContext,
    whatPlanned: whatPlanned.plannedState,
    whatHappened: whatHappened.actualState,
    whyDifferent: whyDifferent.rootCauses,
    successes: whatHappened.successes,
    challenges: whatHappened.challenges,
    outputDir
  });

  artifacts.push(...lessonsExtraction.artifacts);

  // ============================================================================
  // PHASE 6: ACTION ITEM DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing action items');
  const actionItemDevelopment = await ctx.task(actionItemDevelopmentTask, {
    lessonsLearned: lessonsExtraction.lessons,
    eventContext,
    participants,
    outputDir
  });

  artifacts.push(...actionItemDevelopment.artifacts);

  // Breakpoint: Review lessons and actions
  await ctx.breakpoint({
    question: `Extracted ${lessonsExtraction.lessons.length} lessons and ${actionItemDevelopment.actionItems.length} action items. Review?`,
    title: 'Lessons and Actions Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        lessonsLearned: lessonsExtraction.lessons.length,
        actionItems: actionItemDevelopment.actionItems.length,
        immediateActions: actionItemDevelopment.actionItems.filter(a => a.priority === 'immediate').length
      }
    }
  });

  // ============================================================================
  // PHASE 7: AAR REPORT COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Compiling AAR report');
  const aarReport = await ctx.task(aarReportCompilationTask, {
    eventContext,
    eventType,
    whatPlanned: whatPlanned.plannedState,
    whatHappened: whatHappened.actualState,
    whyDifferent: whyDifferent.analysis,
    lessonsLearned: lessonsExtraction.lessons,
    actionItems: actionItemDevelopment.actionItems,
    outputDir
  });

  artifacts.push(...aarReport.artifacts);

  // ============================================================================
  // PHASE 8: PARTICIPANT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating with participants');
  const participantValidation = await ctx.task(participantValidationTask, {
    aarReport: aarReport.report,
    participants,
    lessonsLearned: lessonsExtraction.lessons,
    actionItems: actionItemDevelopment.actionItems,
    outputDir
  });

  artifacts.push(...participantValidation.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing AAR quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    aarPlanning,
    aarReport,
    lessonsExtraction,
    actionItemDevelopment,
    participantValidation,
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
      aarReport: aarReport.report,
      lessonsLearned: lessonsExtraction.lessons,
      actionItems: actionItemDevelopment.actionItems,
      qualityScore: qualityAssessment.overallScore,
      participantValidation,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize AAR?`,
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
          lessonsLearned: lessonsExtraction.lessons.length,
          actionItems: actionItemDevelopment.actionItems.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    eventContext,
    aarReport: aarReport.report,
    lessonsLearned: lessonsExtraction.lessons,
    actionItems: actionItemDevelopment.actionItems,
    statistics: {
      participantsInvolved: participants.length,
      variancesIdentified: whatHappened.variances.length,
      lessonsExtracted: lessonsExtraction.lessons.length,
      actionItemsCreated: actionItemDevelopment.actionItems.length,
      rootCausesIdentified: whyDifferent.rootCauses.length
    },
    validation: {
      participantValidationScore: participantValidation.validationScore,
      validationPassed: participantValidation.validationScore >= 80
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/after-action-review',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: AAR Planning
export const aarPlanningTask = defineTask('aar-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan after-action review',
  agent: {
    name: 'aar-facilitator',
    prompt: {
      role: 'after-action review facilitator',
      task: 'Plan and prepare for after-action review',
      context: args,
      instructions: [
        'Plan the after-action review:',
        '  - Define scope and objectives',
        '  - Identify key focus areas',
        '  - Plan session structure',
        '  - Prepare facilitation guide',
        '  - Identify data and documentation needs',
        'Design participant engagement approach',
        'Prepare AAR materials and templates',
        'Define ground rules and expectations',
        'Save AAR plan to output directory'
      ],
      outputFormat: 'JSON with aarPlan (object), focusAreas (array), facilitationGuide (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['aarPlan', 'focusAreas', 'artifacts'],
      properties: {
        aarPlan: { type: 'object' },
        focusAreas: { type: 'array' },
        facilitationGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'aar', 'planning']
}));

// Task 2: What Was Planned
export const whatPlannedTask = defineTask('what-planned', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document what was planned',
  agent: {
    name: 'documentation-analyst',
    prompt: {
      role: 'AAR documentation analyst',
      task: 'Document what was originally planned',
      context: args,
      instructions: [
        'Document the original plan:',
        '  - Goals and objectives',
        '  - Expected outcomes',
        '  - Planned activities and timeline',
        '  - Resource allocations',
        '  - Success criteria',
        '  - Assumptions and constraints',
        'Review existing documentation',
        'Capture key stakeholder expectations',
        'Save planned state to output directory'
      ],
      outputFormat: 'JSON with plannedState (object), objectives (array), timeline (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plannedState', 'artifacts'],
      properties: {
        plannedState: { type: 'object' },
        objectives: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'aar', 'planned']
}));

// Task 3: What Actually Happened
export const whatHappenedTask = defineTask('what-happened', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document what actually happened',
  agent: {
    name: 'event-documenter',
    prompt: {
      role: 'event outcome documenter',
      task: 'Document what actually happened',
      context: args,
      instructions: [
        'Document actual outcomes:',
        '  - What actually occurred',
        '  - Actual timeline and activities',
        '  - Resources actually used',
        '  - Results achieved',
        'Identify variances from plan',
        'Document successes and achievements',
        'Document challenges and issues',
        'Gather participant perspectives',
        'Save actual state to output directory'
      ],
      outputFormat: 'JSON with actualState (object), variances (array), successes (array), challenges (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actualState', 'variances', 'successes', 'challenges', 'artifacts'],
      properties: {
        actualState: { type: 'object' },
        variances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              planned: { type: 'string' },
              actual: { type: 'string' },
              impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
            }
          }
        },
        successes: { type: 'array' },
        challenges: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'aar', 'actual']
}));

// Task 4: Why Different
export const whyDifferentTask = defineTask('why-different', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze why outcomes differed',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'root cause analyst',
      task: 'Analyze why outcomes differed from plans',
      context: args,
      instructions: [
        'Analyze root causes of variances:',
        '  - Planning assumptions that were wrong',
        '  - External factors and changes',
        '  - Execution issues',
        '  - Resource constraints',
        '  - Communication gaps',
        '  - Unexpected challenges',
        'Apply root cause analysis techniques',
        'Categorize causes by controllability',
        'Identify contributing factors',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), rootCauses (array), contributingFactors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'rootCauses', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variance: { type: 'string' },
              rootCause: { type: 'string' },
              category: { type: 'string' },
              controllable: { type: 'boolean' }
            }
          }
        },
        contributingFactors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'aar', 'analysis']
}));

// Task 5: Lessons Extraction
export const lessonsExtractionTask = defineTask('lessons-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract lessons learned',
  agent: {
    name: 'lessons-analyst',
    prompt: {
      role: 'lessons learned analyst',
      task: 'Extract actionable lessons learned',
      context: args,
      instructions: [
        'Extract lessons learned:',
        '  - Sustains (what to continue doing)',
        '  - Improves (what to do differently)',
        '  - Starts (new practices to adopt)',
        '  - Stops (practices to discontinue)',
        'Ensure lessons are:',
        '  - Specific and actionable',
        '  - Based on evidence',
        '  - Applicable to future situations',
        'Categorize by domain and applicability',
        'Save lessons to output directory'
      ],
      outputFormat: 'JSON with lessons (array), sustains (array), improves (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lessons', 'artifacts'],
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['sustain', 'improve', 'start', 'stop'] },
              description: { type: 'string' },
              evidence: { type: 'string' },
              applicability: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sustains: { type: 'array' },
        improves: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'extraction']
}));

// Task 6: Action Item Development
export const actionItemDevelopmentTask = defineTask('action-item-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop action items',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'action planning specialist',
      task: 'Develop specific action items from lessons',
      context: args,
      instructions: [
        'Develop action items:',
        '  - Specific and measurable',
        '  - Assigned owner',
        '  - Target completion date',
        '  - Success criteria',
        'Prioritize actions by:',
        '  - Impact potential',
        '  - Urgency',
        '  - Feasibility',
        'Group into immediate, short-term, long-term',
        'Save action items to output directory'
      ],
      outputFormat: 'JSON with actionItems (array), prioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              lesson: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              successCriteria: { type: 'string' }
            }
          }
        },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'actions', 'planning']
}));

// Task 7: AAR Report Compilation
export const aarReportCompilationTask = defineTask('aar-report-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile AAR report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'AAR report writer',
      task: 'Compile comprehensive AAR report',
      context: args,
      instructions: [
        'Compile AAR report including:',
        '  - Executive summary',
        '  - Event overview',
        '  - What was planned',
        '  - What actually happened',
        '  - Analysis of variances',
        '  - Lessons learned',
        '  - Action items',
        '  - Appendices',
        'Apply consistent formatting',
        'Include visualizations where helpful',
        'Save AAR report to output directory'
      ],
      outputFormat: 'JSON with report (object), sections (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'aar', 'report']
}));

// Task 8: Participant Validation
export const participantValidationTask = defineTask('participant-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate with participants',
  agent: {
    name: 'validation-coordinator',
    prompt: {
      role: 'participant validation coordinator',
      task: 'Validate AAR findings with participants',
      context: args,
      instructions: [
        'Validate AAR with participants:',
        '  - Accuracy of documented events',
        '  - Agreement on root causes',
        '  - Relevance of lessons learned',
        '  - Feasibility of action items',
        'Collect participant feedback',
        'Address disagreements and clarifications',
        'Calculate validation score',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with validationScore (number 0-100), participantFeedback (array), corrections (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        participantFeedback: { type: 'array' },
        corrections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'validation', 'participants']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess AAR quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'AAR quality assessor',
      task: 'Evaluate the quality of the after-action review',
      context: args,
      instructions: [
        'Assess AAR quality:',
        '  - Completeness of coverage',
        '  - Depth of analysis',
        '  - Actionability of lessons',
        '  - Participant engagement',
        '  - Documentation quality',
        'Calculate overall quality score',
        'Identify strengths and improvements',
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
        'Present AAR to stakeholders',
        'Review lessons learned',
        'Present action items',
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
