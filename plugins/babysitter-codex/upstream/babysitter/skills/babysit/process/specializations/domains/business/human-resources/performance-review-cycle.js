/**
 * @process specializations/domains/business/human-resources/performance-review-cycle
 * @description Performance Review Cycle Process - Annual or semi-annual performance evaluation process including
 * self-assessments, manager evaluations, calibration sessions, ratings, and feedback documentation.
 * @inputs { organizationName: string, reviewPeriod: string, reviewCycle: string, departments: array }
 * @outputs { success: boolean, reviewsCompleted: number, calibrationResults: object, ratingDistribution: object, feedbackSummary: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/performance-review-cycle', {
 *   organizationName: 'TechCorp',
 *   reviewPeriod: '2024',
 *   reviewCycle: 'annual',
 *   departments: ['Engineering', 'Sales', 'Marketing', 'Product']
 * });
 *
 * @references
 * - Lattice Performance Review: https://lattice.com/library/performance-review-process
 * - SHRM Performance Management: https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/managingemployeeperformance.aspx
 * - Deloitte Performance Management: https://www2.deloitte.com/us/en/insights/focus/human-capital-trends/2017/redesigning-performance-management.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    reviewPeriod,
    reviewCycle = 'annual', // 'annual', 'semi-annual', 'quarterly'
    departments,
    ratingScale = '5-point',
    includeCalibration = true,
    include360Feedback = false,
    includeGoalReview = true,
    outputDir = 'performance-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Review Cycle for ${organizationName} - ${reviewPeriod}`);

  // Phase 1: Review Cycle Planning
  const cyclePlanning = await ctx.task(cyclePlanningTask, {
    organizationName,
    reviewPeriod,
    reviewCycle,
    departments,
    ratingScale,
    include360Feedback,
    includeGoalReview,
    outputDir
  });

  artifacts.push(...cyclePlanning.artifacts);

  await ctx.breakpoint({
    question: `Performance review cycle planned. Timeline: ${cyclePlanning.timeline.startDate} to ${cyclePlanning.timeline.endDate}. Review and approve cycle plan?`,
    title: 'Cycle Planning Review',
    context: {
      runId: ctx.runId,
      timeline: cyclePlanning.timeline,
      milestones: cyclePlanning.milestones,
      participants: cyclePlanning.participantCount,
      files: cyclePlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Form and Template Setup
  const formSetup = await ctx.task(formSetupTask, {
    organizationName,
    reviewPeriod,
    ratingScale,
    include360Feedback,
    includeGoalReview,
    outputDir
  });

  artifacts.push(...formSetup.artifacts);

  // Phase 3: Communication and Launch
  const launchCommunication = await ctx.task(launchCommunicationTask, {
    organizationName,
    reviewPeriod,
    cyclePlanning,
    departments,
    outputDir
  });

  artifacts.push(...launchCommunication.artifacts);

  // Phase 4: Self-Assessment Collection
  const selfAssessments = await ctx.task(selfAssessmentTask, {
    organizationName,
    reviewPeriod,
    departments,
    formSetup: formSetup.forms,
    includeGoalReview,
    outputDir
  });

  artifacts.push(...selfAssessments.artifacts);

  ctx.log('info', `Self-assessments collected: ${selfAssessments.completionRate}% completion rate`);

  // Phase 5: 360-Degree Feedback Collection (if enabled)
  let feedback360 = null;
  if (include360Feedback) {
    feedback360 = await ctx.task(feedback360Task, {
      organizationName,
      reviewPeriod,
      departments,
      outputDir
    });

    artifacts.push(...feedback360.artifacts);
  }

  // Phase 6: Manager Evaluation
  const managerEvaluations = await ctx.task(managerEvaluationTask, {
    organizationName,
    reviewPeriod,
    departments,
    selfAssessments: selfAssessments.assessments,
    feedback360: feedback360?.feedback,
    ratingScale,
    formSetup: formSetup.forms,
    outputDir
  });

  artifacts.push(...managerEvaluations.artifacts);

  await ctx.breakpoint({
    question: `Manager evaluations in progress. ${managerEvaluations.completionRate}% complete. Monitor progress and send reminders?`,
    title: 'Manager Evaluation Progress',
    context: {
      runId: ctx.runId,
      completionRate: managerEvaluations.completionRate,
      pendingManagers: managerEvaluations.pendingManagers,
      completedEvaluations: managerEvaluations.completedCount,
      files: managerEvaluations.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Rating Calibration
  let calibrationResults = null;
  if (includeCalibration) {
    calibrationResults = await ctx.task(calibrationTask, {
      organizationName,
      reviewPeriod,
      departments,
      managerEvaluations: managerEvaluations.evaluations,
      ratingScale,
      outputDir
    });

    artifacts.push(...calibrationResults.artifacts);

    await ctx.breakpoint({
      question: `Calibration sessions complete. Rating distribution adjusted. Review calibration outcomes before finalizing?`,
      title: 'Calibration Review',
      context: {
        runId: ctx.runId,
        preCalibrationDistribution: calibrationResults.preCalibrationDistribution,
        postCalibrationDistribution: calibrationResults.postCalibrationDistribution,
        adjustments: calibrationResults.adjustments,
        files: calibrationResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 8: Review Finalization
  const finalization = await ctx.task(finalizationTask, {
    organizationName,
    reviewPeriod,
    managerEvaluations: managerEvaluations.evaluations,
    calibrationResults: calibrationResults?.calibratedRatings,
    outputDir
  });

  artifacts.push(...finalization.artifacts);

  // Phase 9: Feedback Delivery Preparation
  const feedbackPrep = await ctx.task(feedbackPrepTask, {
    organizationName,
    reviewPeriod,
    finalization: finalization.finalReviews,
    outputDir
  });

  artifacts.push(...feedbackPrep.artifacts);

  // Phase 10: Performance Conversations
  const performanceConversations = await ctx.task(performanceConversationsTask, {
    organizationName,
    reviewPeriod,
    departments,
    finalReviews: finalization.finalReviews,
    feedbackPrep: feedbackPrep.preparation,
    outputDir
  });

  artifacts.push(...performanceConversations.artifacts);

  await ctx.breakpoint({
    question: `Performance conversations scheduled. ${performanceConversations.scheduledCount} meetings set up. Monitor conversation completion?`,
    title: 'Performance Conversation Monitoring',
    context: {
      runId: ctx.runId,
      scheduledCount: performanceConversations.scheduledCount,
      conversationGuides: performanceConversations.guides,
      timeline: performanceConversations.timeline,
      files: performanceConversations.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 11: Development Planning
  const developmentPlanning = await ctx.task(developmentPlanningTask, {
    organizationName,
    reviewPeriod,
    finalReviews: finalization.finalReviews,
    performanceConversations: performanceConversations.conversations,
    outputDir
  });

  artifacts.push(...developmentPlanning.artifacts);

  // Phase 12: Cycle Analytics and Reporting
  const cycleAnalytics = await ctx.task(cycleAnalyticsTask, {
    organizationName,
    reviewPeriod,
    reviewCycle,
    departments,
    selfAssessments,
    managerEvaluations,
    calibrationResults,
    finalization,
    performanceConversations,
    developmentPlanning,
    outputDir
  });

  artifacts.push(...cycleAnalytics.artifacts);

  return {
    success: true,
    organizationName,
    reviewPeriod,
    reviewCycle,
    reviewsCompleted: finalization.totalReviews,
    completionRate: cycleAnalytics.overallCompletionRate,
    calibrationResults: calibrationResults ? {
      sessionsHeld: calibrationResults.sessionsHeld,
      ratingsAdjusted: calibrationResults.ratingsAdjusted,
      preDistribution: calibrationResults.preCalibrationDistribution,
      postDistribution: calibrationResults.postCalibrationDistribution
    } : null,
    ratingDistribution: finalization.ratingDistribution,
    feedbackSummary: {
      conversationsCompleted: performanceConversations.completedCount,
      developmentPlansCreated: developmentPlanning.plansCreated,
      averageSatisfaction: cycleAnalytics.averageSatisfaction
    },
    cycleMetrics: cycleAnalytics.metrics,
    recommendations: cycleAnalytics.recommendations,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/performance-review-cycle',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const cyclePlanningTask = defineTask('cycle-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Cycle Planning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Management Specialist',
      task: 'Plan performance review cycle timeline and logistics',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        reviewCycle: args.reviewCycle,
        departments: args.departments,
        ratingScale: args.ratingScale,
        include360Feedback: args.include360Feedback,
        includeGoalReview: args.includeGoalReview,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define review cycle timeline',
        '2. Set milestone dates (launch, self-assessment, manager review, calibration)',
        '3. Identify participant count by department',
        '4. Assign HR business partners',
        '5. Plan calibration session schedule',
        '6. Define escalation procedures',
        '7. Set up tracking mechanisms',
        '8. Plan manager training',
        '9. Define success metrics',
        '10. Create project plan'
      ],
      outputFormat: 'JSON object with cycle planning details'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'milestones', 'participantCount', 'artifacts'],
      properties: {
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        participantCount: { type: 'number' },
        departmentBreakdown: { type: 'object' },
        hrbpAssignments: { type: 'object' },
        calibrationSchedule: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'planning']
}));

export const formSetupTask = defineTask('form-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Form Setup - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Systems Specialist',
      task: 'Set up performance review forms and templates',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        ratingScale: args.ratingScale,
        include360Feedback: args.include360Feedback,
        includeGoalReview: args.includeGoalReview,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design self-assessment form',
        '2. Create manager evaluation form',
        '3. Set up rating scales and definitions',
        '4. Design competency assessment section',
        '5. Create goal achievement section',
        '6. Design development planning section',
        '7. Configure 360 feedback form (if applicable)',
        '8. Set up in HRIS/performance system',
        '9. Test form workflows',
        '10. Create user guides'
      ],
      outputFormat: 'JSON object with form setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'ratingDefinitions', 'artifacts'],
      properties: {
        forms: { type: 'object' },
        selfAssessmentForm: { type: 'object' },
        managerForm: { type: 'object' },
        ratingDefinitions: { type: 'array', items: { type: 'object' } },
        competencies: { type: 'array', items: { type: 'object' } },
        userGuides: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'forms']
}));

export const launchCommunicationTask = defineTask('launch-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Launch Communication - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Internal Communications Specialist',
      task: 'Create and execute review cycle launch communication',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        cyclePlanning: args.cyclePlanning,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Draft cycle announcement email',
        '2. Create manager communication',
        '3. Prepare employee guide',
        '4. Schedule communication touchpoints',
        '5. Create FAQ document',
        '6. Plan reminder sequence',
        '7. Prepare manager training invitation',
        '8. Create Slack/Teams announcements',
        '9. Schedule office hours',
        '10. Launch communications'
      ],
      outputFormat: 'JSON object with launch communication details'
    },
    outputSchema: {
      type: 'object',
      required: ['communications', 'launched', 'artifacts'],
      properties: {
        communications: { type: 'array', items: { type: 'object' } },
        launched: { type: 'boolean' },
        announcementEmail: { type: 'object' },
        reminderSchedule: { type: 'array', items: { type: 'object' } },
        faq: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'communication']
}));

export const selfAssessmentTask = defineTask('self-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Self-Assessment Collection - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Review Coordinator',
      task: 'Manage self-assessment collection process',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        departments: args.departments,
        formSetup: args.formSetup,
        includeGoalReview: args.includeGoalReview,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Open self-assessment window',
        '2. Send completion reminders',
        '3. Track completion by department',
        '4. Follow up with non-responders',
        '5. Escalate as needed',
        '6. Provide employee support',
        '7. Monitor submission quality',
        '8. Close self-assessment window',
        '9. Generate completion report',
        '10. Share assessments with managers'
      ],
      outputFormat: 'JSON object with self-assessment collection results'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'completionRate', 'artifacts'],
      properties: {
        assessments: { type: 'object' },
        completionRate: { type: 'number' },
        completionByDepartment: { type: 'object' },
        pendingEmployees: { type: 'array', items: { type: 'string' } },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'self-assessment']
}));

export const feedback360Task = defineTask('feedback-360', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: 360-Degree Feedback - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: '360 Feedback Administrator',
      task: 'Manage 360-degree feedback collection',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        departments: args.departments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify feedback providers',
        '2. Send feedback requests',
        '3. Track response rates',
        '4. Send reminders to non-responders',
        '5. Monitor feedback quality',
        '6. Anonymize feedback appropriately',
        '7. Close feedback window',
        '8. Aggregate feedback results',
        '9. Generate 360 reports',
        '10. Share with managers for review prep'
      ],
      outputFormat: 'JSON object with 360 feedback collection results'
    },
    outputSchema: {
      type: 'object',
      required: ['feedback', 'responseRate', 'artifacts'],
      properties: {
        feedback: { type: 'object' },
        responseRate: { type: 'number' },
        feedbackProviderCount: { type: 'number' },
        feedbackReports: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', '360-feedback']
}));

export const managerEvaluationTask = defineTask('manager-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Manager Evaluation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Review Coordinator',
      task: 'Manage manager evaluation completion',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        departments: args.departments,
        selfAssessments: args.selfAssessments,
        feedback360: args.feedback360,
        ratingScale: args.ratingScale,
        formSetup: args.formSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Open manager evaluation window',
        '2. Share self-assessments with managers',
        '3. Share 360 feedback summaries',
        '4. Track manager completion',
        '5. Send completion reminders',
        '6. Provide manager support and guidance',
        '7. Monitor rating distribution early',
        '8. Flag potential calibration issues',
        '9. Close evaluation window',
        '10. Generate completion report'
      ],
      outputFormat: 'JSON object with manager evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluations', 'completionRate', 'completedCount', 'artifacts'],
      properties: {
        evaluations: { type: 'object' },
        completionRate: { type: 'number' },
        completedCount: { type: 'number' },
        pendingManagers: { type: 'array', items: { type: 'string' } },
        preliminaryRatingDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'manager-evaluation']
}));

export const calibrationTask = defineTask('calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Rating Calibration - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Calibration Facilitator',
      task: 'Facilitate performance rating calibration sessions',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        departments: args.departments,
        managerEvaluations: args.managerEvaluations,
        ratingScale: args.ratingScale,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare calibration materials',
        '2. Schedule calibration sessions by department',
        '3. Facilitate calibration discussions',
        '4. Compare ratings across managers',
        '5. Identify rating inconsistencies',
        '6. Guide rating adjustments',
        '7. Document calibration decisions',
        '8. Ensure fair distribution',
        '9. Finalize calibrated ratings',
        '10. Generate calibration report'
      ],
      outputFormat: 'JSON object with calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['calibratedRatings', 'preCalibrationDistribution', 'postCalibrationDistribution', 'artifacts'],
      properties: {
        calibratedRatings: { type: 'object' },
        sessionsHeld: { type: 'number' },
        ratingsAdjusted: { type: 'number' },
        preCalibrationDistribution: { type: 'object' },
        postCalibrationDistribution: { type: 'object' },
        adjustments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'calibration']
}));

export const finalizationTask = defineTask('finalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Review Finalization - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Review Administrator',
      task: 'Finalize performance reviews for delivery',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        managerEvaluations: args.managerEvaluations,
        calibrationResults: args.calibrationResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply calibration adjustments',
        '2. Review for completeness',
        '3. Lock final ratings',
        '4. Generate final review documents',
        '5. Calculate rating distribution',
        '6. Identify high performers',
        '7. Flag performance concerns',
        '8. Prepare manager delivery packets',
        '9. Set up review acknowledgment workflow',
        '10. Archive review data'
      ],
      outputFormat: 'JSON object with finalization results'
    },
    outputSchema: {
      type: 'object',
      required: ['finalReviews', 'totalReviews', 'ratingDistribution', 'artifacts'],
      properties: {
        finalReviews: { type: 'object' },
        totalReviews: { type: 'number' },
        ratingDistribution: { type: 'object' },
        highPerformers: { type: 'array', items: { type: 'object' } },
        performanceConcerns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'finalization']
}));

export const feedbackPrepTask = defineTask('feedback-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Feedback Delivery Prep - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Coach',
      task: 'Prepare managers for performance feedback delivery',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        finalization: args.finalization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create conversation guides',
        '2. Develop feedback frameworks',
        '3. Prepare difficult conversation tips',
        '4. Create recognition scripts',
        '5. Design development discussion guides',
        '6. Prepare compensation discussion guides',
        '7. Schedule manager preparation sessions',
        '8. Share delivery best practices',
        '9. Provide HRBP support assignments',
        '10. Create follow-up protocols'
      ],
      outputFormat: 'JSON object with feedback preparation materials'
    },
    outputSchema: {
      type: 'object',
      required: ['preparation', 'conversationGuides', 'artifacts'],
      properties: {
        preparation: { type: 'object' },
        conversationGuides: { type: 'array', items: { type: 'object' } },
        difficultConversationTips: { type: 'array', items: { type: 'string' } },
        recognitionScripts: { type: 'array', items: { type: 'object' } },
        hrbpSupport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'feedback-prep']
}));

export const performanceConversationsTask = defineTask('performance-conversations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Performance Conversations - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Review Coordinator',
      task: 'Manage performance conversation scheduling and completion',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        departments: args.departments,
        finalReviews: args.finalReviews,
        feedbackPrep: args.feedbackPrep,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set conversation window',
        '2. Schedule manager-employee meetings',
        '3. Share review documents',
        '4. Track conversation completion',
        '5. Send reminders for pending conversations',
        '6. Monitor acknowledgment signatures',
        '7. Collect conversation feedback',
        '8. Address escalations',
        '9. Close conversation window',
        '10. Generate completion report'
      ],
      outputFormat: 'JSON object with performance conversation results'
    },
    outputSchema: {
      type: 'object',
      required: ['conversations', 'scheduledCount', 'completedCount', 'artifacts'],
      properties: {
        conversations: { type: 'object' },
        scheduledCount: { type: 'number' },
        completedCount: { type: 'number' },
        guides: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        acknowledgments: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'conversations']
}));

export const developmentPlanningTask = defineTask('development-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Development Planning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Support development planning following performance reviews',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        finalReviews: args.finalReviews,
        performanceConversations: args.performanceConversations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create development plan templates',
        '2. Link review outcomes to development',
        '3. Track plan creation completion',
        '4. Identify common development needs',
        '5. Recommend learning resources',
        '6. Schedule development check-ins',
        '7. Connect to succession planning',
        '8. Plan high-performer development',
        '9. Create improvement plans for low performers',
        '10. Generate development analytics'
      ],
      outputFormat: 'JSON object with development planning results'
    },
    outputSchema: {
      type: 'object',
      required: ['developmentPlans', 'plansCreated', 'artifacts'],
      properties: {
        developmentPlans: { type: 'object' },
        plansCreated: { type: 'number' },
        commonDevelopmentNeeds: { type: 'array', items: { type: 'string' } },
        learningResources: { type: 'array', items: { type: 'object' } },
        improvementPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'development']
}));

export const cycleAnalyticsTask = defineTask('cycle-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Cycle Analytics - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Analytics Specialist',
      task: 'Analyze performance review cycle and generate insights',
      context: {
        organizationName: args.organizationName,
        reviewPeriod: args.reviewPeriod,
        reviewCycle: args.reviewCycle,
        departments: args.departments,
        selfAssessments: args.selfAssessments,
        managerEvaluations: args.managerEvaluations,
        calibrationResults: args.calibrationResults,
        finalization: args.finalization,
        performanceConversations: args.performanceConversations,
        developmentPlanning: args.developmentPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate overall completion rates',
        '2. Analyze rating distributions',
        '3. Compare to previous cycles',
        '4. Identify rating inflation/deflation',
        '5. Analyze manager rating patterns',
        '6. Calculate cycle satisfaction',
        '7. Measure process efficiency',
        '8. Identify process improvements',
        '9. Generate executive summary',
        '10. Create recommendations report'
      ],
      outputFormat: 'JSON object with cycle analytics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'overallCompletionRate', 'recommendations', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        overallCompletionRate: { type: 'number' },
        ratingAnalysis: { type: 'object' },
        cycleComparison: { type: 'object' },
        managerPatterns: { type: 'object' },
        averageSatisfaction: { type: 'number' },
        processEfficiency: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'performance-review', 'analytics']
}));
