/**
 * @process specializations/domains/business/human-resources/employee-onboarding-program
 * @description Employee Onboarding Program Process - Comprehensive new hire integration process covering preboarding,
 * first-day orientation, 30-60-90 day plans, buddy assignments, and onboarding effectiveness measurement.
 * @inputs { employeeId: string, employeeName: string, department: string, role: string, startDate: string, manager: string }
 * @outputs { success: boolean, onboardingCompleted: boolean, milestoneCompletion: object, feedbackScores: object, timeToProductivity: number }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/employee-onboarding-program', {
 *   employeeId: 'EMP-2024-001',
 *   employeeName: 'John Smith',
 *   department: 'Engineering',
 *   role: 'Senior Software Engineer',
 *   startDate: '2024-02-01',
 *   manager: 'Jane Doe'
 * });
 *
 * @references
 * - SHRM Onboarding Guide: https://www.shrm.org/resourcesandtools/hr-topics/talent-acquisition/pages/new-employee-onboarding-guide.aspx
 * - BambooHR Onboarding: https://www.bamboohr.com/blog/new-employee-onboarding-guide
 * - Gallup Onboarding Research: https://www.gallup.com/workplace/247172/getting-onboarding-right.aspx
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    employeeId,
    employeeName,
    department,
    role,
    startDate,
    manager,
    buddy = null,
    location = 'remote',
    employmentType = 'full-time',
    seniorityLevel = 'individual-contributor',
    customOnboardingPath = null,
    outputDir = 'onboarding-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Employee Onboarding Program for ${employeeName} (${employeeId})`);

  // Phase 1: Pre-boarding Setup (Before Day 1)
  const preboardingSetup = await ctx.task(preboardingSetupTask, {
    employeeId,
    employeeName,
    department,
    role,
    startDate,
    manager,
    location,
    outputDir
  });

  artifacts.push(...preboardingSetup.artifacts);

  await ctx.breakpoint({
    question: `Pre-boarding setup completed for ${employeeName}. IT equipment ordered, accounts created. Review pre-boarding checklist?`,
    title: 'Pre-boarding Review',
    context: {
      runId: ctx.runId,
      employeeId,
      employeeName,
      checklist: preboardingSetup.checklist,
      accountsCreated: preboardingSetup.accountsCreated,
      equipmentOrdered: preboardingSetup.equipmentOrdered,
      files: preboardingSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Buddy Assignment
  const buddyAssignment = await ctx.task(buddyAssignmentTask, {
    employeeId,
    employeeName,
    department,
    role,
    manager,
    suggestedBuddy: buddy,
    outputDir
  });

  artifacts.push(...buddyAssignment.artifacts);

  // Phase 3: Day 1 Orientation Planning
  const day1Orientation = await ctx.task(day1OrientationTask, {
    employeeId,
    employeeName,
    department,
    role,
    startDate,
    manager,
    buddy: buddyAssignment.assignedBuddy,
    location,
    outputDir
  });

  artifacts.push(...day1Orientation.artifacts);

  // Phase 4: 30-60-90 Day Plan Development
  const developmentPlan = await ctx.task(developmentPlanTask, {
    employeeId,
    employeeName,
    department,
    role,
    manager,
    seniorityLevel,
    customOnboardingPath,
    outputDir
  });

  artifacts.push(...developmentPlan.artifacts);

  await ctx.breakpoint({
    question: `30-60-90 day plan created for ${employeeName}. Review milestones and success criteria before sharing with new hire?`,
    title: '30-60-90 Day Plan Review',
    context: {
      runId: ctx.runId,
      employeeId,
      day30Goals: developmentPlan.day30Goals,
      day60Goals: developmentPlan.day60Goals,
      day90Goals: developmentPlan.day90Goals,
      successCriteria: developmentPlan.successCriteria,
      files: developmentPlan.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Training Schedule Creation
  const trainingSchedule = await ctx.task(trainingScheduleTask, {
    employeeId,
    employeeName,
    department,
    role,
    developmentPlan: developmentPlan.plan,
    outputDir
  });

  artifacts.push(...trainingSchedule.artifacts);

  // Phase 6: Stakeholder Introduction Planning
  const stakeholderIntros = await ctx.task(stakeholderIntrosTask, {
    employeeId,
    employeeName,
    department,
    role,
    manager,
    seniorityLevel,
    outputDir
  });

  artifacts.push(...stakeholderIntros.artifacts);

  // Phase 7: Week 1 Execution Tracking
  const week1Tracking = await ctx.task(week1TrackingTask, {
    employeeId,
    employeeName,
    day1Orientation,
    trainingSchedule: trainingSchedule.schedule,
    buddy: buddyAssignment.assignedBuddy,
    outputDir
  });

  artifacts.push(...week1Tracking.artifacts);

  // Phase 8: 30-Day Checkpoint
  const day30Checkpoint = await ctx.task(checkpointTask, {
    employeeId,
    employeeName,
    checkpointDay: 30,
    milestones: developmentPlan.day30Goals,
    manager,
    outputDir
  });

  artifacts.push(...day30Checkpoint.artifacts);

  await ctx.breakpoint({
    question: `30-day checkpoint for ${employeeName}. Milestone completion: ${day30Checkpoint.completionRate}%. Review progress and provide feedback?`,
    title: '30-Day Checkpoint Review',
    context: {
      runId: ctx.runId,
      employeeId,
      completionRate: day30Checkpoint.completionRate,
      completedMilestones: day30Checkpoint.completedMilestones,
      pendingMilestones: day30Checkpoint.pendingMilestones,
      feedback: day30Checkpoint.feedback,
      files: day30Checkpoint.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: 60-Day Checkpoint
  const day60Checkpoint = await ctx.task(checkpointTask, {
    employeeId,
    employeeName,
    checkpointDay: 60,
    milestones: developmentPlan.day60Goals,
    manager,
    previousCheckpoint: day30Checkpoint,
    outputDir
  });

  artifacts.push(...day60Checkpoint.artifacts);

  // Phase 10: 90-Day Checkpoint and Completion
  const day90Checkpoint = await ctx.task(checkpointTask, {
    employeeId,
    employeeName,
    checkpointDay: 90,
    milestones: developmentPlan.day90Goals,
    manager,
    previousCheckpoint: day60Checkpoint,
    outputDir
  });

  artifacts.push(...day90Checkpoint.artifacts);

  await ctx.breakpoint({
    question: `90-day onboarding checkpoint for ${employeeName}. Overall completion: ${day90Checkpoint.completionRate}%. Confirm onboarding completion and transition to regular performance management?`,
    title: '90-Day Onboarding Completion',
    context: {
      runId: ctx.runId,
      employeeId,
      overallCompletion: day90Checkpoint.completionRate,
      onboardingSuccess: day90Checkpoint.onboardingSuccess,
      recommendations: day90Checkpoint.recommendations,
      files: day90Checkpoint.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 11: Onboarding Feedback Collection
  const feedbackCollection = await ctx.task(feedbackCollectionTask, {
    employeeId,
    employeeName,
    manager,
    buddy: buddyAssignment.assignedBuddy,
    day30Checkpoint,
    day60Checkpoint,
    day90Checkpoint,
    outputDir
  });

  artifacts.push(...feedbackCollection.artifacts);

  // Phase 12: Onboarding Analytics and Reporting
  const onboardingAnalytics = await ctx.task(onboardingAnalyticsTask, {
    employeeId,
    employeeName,
    department,
    role,
    startDate,
    day30Checkpoint,
    day60Checkpoint,
    day90Checkpoint,
    feedbackCollection,
    outputDir
  });

  artifacts.push(...onboardingAnalytics.artifacts);

  const onboardingCompleted = day90Checkpoint.completionRate >= 80;

  return {
    success: true,
    employeeId,
    employeeName,
    department,
    role,
    manager,
    buddy: buddyAssignment.assignedBuddy,
    onboardingCompleted,
    milestoneCompletion: {
      day30: day30Checkpoint.completionRate,
      day60: day60Checkpoint.completionRate,
      day90: day90Checkpoint.completionRate
    },
    feedbackScores: feedbackCollection.scores,
    timeToProductivity: onboardingAnalytics.timeToProductivity,
    onboardingMetrics: onboardingAnalytics.metrics,
    recommendations: onboardingAnalytics.recommendations,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/employee-onboarding-program',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const preboardingSetupTask = defineTask('preboarding-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pre-boarding Setup - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Onboarding Coordinator',
      task: 'Complete pre-boarding setup before employee start date',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        startDate: args.startDate,
        manager: args.manager,
        location: args.location,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create employee profile in HRIS',
        '2. Set up email and system accounts',
        '3. Order IT equipment (laptop, peripherals)',
        '4. Prepare workspace (if office-based)',
        '5. Send welcome email with first-day instructions',
        '6. Share pre-reading materials',
        '7. Complete I-9 and tax documentation',
        '8. Add to organization chart',
        '9. Create calendar placeholder for Day 1',
        '10. Notify relevant stakeholders'
      ],
      outputFormat: 'JSON object with pre-boarding setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'accountsCreated', 'equipmentOrdered', 'artifacts'],
      properties: {
        checklist: { type: 'array', items: { type: 'object' } },
        accountsCreated: { type: 'array', items: { type: 'string' } },
        equipmentOrdered: { type: 'array', items: { type: 'object' } },
        documentationStatus: { type: 'object' },
        welcomeEmailSent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'preboarding']
}));

export const buddyAssignmentTask = defineTask('buddy-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Buddy Assignment - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Onboarding Specialist',
      task: 'Assign onboarding buddy for new employee',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        manager: args.manager,
        suggestedBuddy: args.suggestedBuddy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify potential buddy candidates',
        '2. Evaluate buddy availability and workload',
        '3. Match based on role and experience',
        '4. Confirm buddy assignment',
        '5. Brief buddy on responsibilities',
        '6. Share buddy guidelines',
        '7. Set up initial buddy meeting',
        '8. Create buddy check-in schedule',
        '9. Provide buddy with new hire profile',
        '10. Establish communication channels'
      ],
      outputFormat: 'JSON object with buddy assignment details'
    },
    outputSchema: {
      type: 'object',
      required: ['assignedBuddy', 'artifacts'],
      properties: {
        assignedBuddy: { type: 'object' },
        buddyCandidates: { type: 'array', items: { type: 'object' } },
        matchRationale: { type: 'string' },
        buddyGuidelines: { type: 'object' },
        checkInSchedule: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'buddy-program']
}));

export const day1OrientationTask = defineTask('day1-orientation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Day 1 Orientation - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Orientation Facilitator',
      task: 'Plan and execute first day orientation',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        startDate: args.startDate,
        manager: args.manager,
        buddy: args.buddy,
        location: args.location,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Day 1 agenda',
        '2. Schedule welcome meeting with manager',
        '3. Arrange buddy introduction',
        '4. Plan company orientation session',
        '5. Schedule IT setup assistance',
        '6. Arrange workspace tour (virtual or in-person)',
        '7. Plan team introduction meeting',
        '8. Prepare welcome kit',
        '9. Schedule benefits orientation',
        '10. Plan lunch or coffee chat'
      ],
      outputFormat: 'JSON object with Day 1 orientation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'meetings', 'artifacts'],
      properties: {
        agenda: { type: 'array', items: { type: 'object' } },
        meetings: { type: 'array', items: { type: 'object' } },
        welcomeKit: { type: 'object' },
        orientationMaterials: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'orientation']
}));

export const developmentPlanTask = defineTask('development-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: 30-60-90 Day Plan - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Create comprehensive 30-60-90 day development plan',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        manager: args.manager,
        seniorityLevel: args.seniorityLevel,
        customOnboardingPath: args.customOnboardingPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define Day 1-30 learning objectives (Learn)',
        '2. Define Day 31-60 contribution objectives (Build)',
        '3. Define Day 61-90 impact objectives (Lead)',
        '4. Set specific, measurable milestones',
        '5. Identify required training and resources',
        '6. Plan key deliverables for each phase',
        '7. Schedule manager check-ins',
        '8. Define success criteria',
        '9. Create skill development goals',
        '10. Plan relationship building activities'
      ],
      outputFormat: 'JSON object with 30-60-90 day plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'day30Goals', 'day60Goals', 'day90Goals', 'successCriteria', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        day30Goals: { type: 'array', items: { type: 'object' } },
        day60Goals: { type: 'array', items: { type: 'object' } },
        day90Goals: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'object' } },
        trainingRequirements: { type: 'array', items: { type: 'object' } },
        keyDeliverables: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'development-plan']
}));

export const trainingScheduleTask = defineTask('training-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Training Schedule - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Training Coordinator',
      task: 'Create comprehensive training schedule for new hire',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        developmentPlan: args.developmentPlan,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify required compliance training',
        '2. Schedule role-specific training',
        '3. Plan technical skills training',
        '4. Schedule product/service training',
        '5. Plan tools and systems training',
        '6. Include soft skills development',
        '7. Schedule mentoring sessions',
        '8. Plan shadow opportunities',
        '9. Include self-paced learning',
        '10. Track training completion'
      ],
      outputFormat: 'JSON object with training schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: { type: 'array', items: { type: 'object' } },
        complianceTraining: { type: 'array', items: { type: 'object' } },
        technicalTraining: { type: 'array', items: { type: 'object' } },
        softSkillsTraining: { type: 'array', items: { type: 'object' } },
        selfPacedLearning: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'training']
}));

export const stakeholderIntrosTask = defineTask('stakeholder-intros', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stakeholder Introductions - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Relationship Coordinator',
      task: 'Plan stakeholder introductions and relationship building',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        manager: args.manager,
        seniorityLevel: args.seniorityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify key stakeholders',
        '2. Schedule team introductions',
        '3. Plan cross-functional meetings',
        '4. Schedule skip-level meeting',
        '5. Plan customer/client introductions',
        '6. Arrange executive meet and greet (if applicable)',
        '7. Schedule peer networking sessions',
        '8. Plan department overview meetings',
        '9. Create stakeholder map',
        '10. Track relationship building progress'
      ],
      outputFormat: 'JSON object with stakeholder introduction plan'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'introductionSchedule', 'artifacts'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        introductionSchedule: { type: 'array', items: { type: 'object' } },
        stakeholderMap: { type: 'object' },
        networkingOpportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'stakeholder-management']
}));

export const week1TrackingTask = defineTask('week1-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Week 1 Tracking - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Onboarding Success Manager',
      task: 'Track and support new hire during first week',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        day1Orientation: args.day1Orientation,
        trainingSchedule: args.trainingSchedule,
        buddy: args.buddy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Confirm Day 1 completion',
        '2. Track orientation attendance',
        '3. Monitor training progress',
        '4. Check buddy engagement',
        '5. Collect daily feedback',
        '6. Address immediate concerns',
        '7. Verify system access',
        '8. Ensure manager touchpoints',
        '9. Track task completion',
        '10. Document week 1 summary'
      ],
      outputFormat: 'JSON object with week 1 tracking results'
    },
    outputSchema: {
      type: 'object',
      required: ['week1Summary', 'completedActivities', 'artifacts'],
      properties: {
        week1Summary: { type: 'object' },
        completedActivities: { type: 'array', items: { type: 'string' } },
        pendingActivities: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        feedback: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'tracking']
}));

export const checkpointTask = defineTask('checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase ${args.checkpointDay}-Day Checkpoint - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Coach',
      task: `Conduct ${args.checkpointDay}-day onboarding checkpoint`,
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        checkpointDay: args.checkpointDay,
        milestones: args.milestones,
        manager: args.manager,
        previousCheckpoint: args.previousCheckpoint,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review milestone completion',
        '2. Assess goal achievement',
        '3. Gather manager feedback',
        '4. Collect employee self-assessment',
        '5. Identify development areas',
        '6. Recognize achievements',
        '7. Address concerns or blockers',
        '8. Adjust goals if needed',
        '9. Plan next phase priorities',
        '10. Document checkpoint summary'
      ],
      outputFormat: 'JSON object with checkpoint results'
    },
    outputSchema: {
      type: 'object',
      required: ['completionRate', 'completedMilestones', 'pendingMilestones', 'feedback', 'artifacts'],
      properties: {
        completionRate: { type: 'number' },
        completedMilestones: { type: 'array', items: { type: 'object' } },
        pendingMilestones: { type: 'array', items: { type: 'object' } },
        feedback: { type: 'object' },
        developmentAreas: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        onboardingSuccess: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'checkpoint']
}));

export const feedbackCollectionTask = defineTask('feedback-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Feedback Collection - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employee Experience Analyst',
      task: 'Collect comprehensive onboarding feedback',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        manager: args.manager,
        buddy: args.buddy,
        day30Checkpoint: args.day30Checkpoint,
        day60Checkpoint: args.day60Checkpoint,
        day90Checkpoint: args.day90Checkpoint,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Send onboarding survey to new hire',
        '2. Collect manager feedback',
        '3. Gather buddy feedback',
        '4. Assess training effectiveness',
        '5. Evaluate orientation quality',
        '6. Measure satisfaction scores',
        '7. Identify improvement areas',
        '8. Calculate NPS for onboarding',
        '9. Document qualitative feedback',
        '10. Create feedback summary'
      ],
      outputFormat: 'JSON object with feedback collection results'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'artifacts'],
      properties: {
        scores: {
          type: 'object',
          properties: {
            overallSatisfaction: { type: 'number' },
            managerSupport: { type: 'number' },
            buddyEffectiveness: { type: 'number' },
            trainingQuality: { type: 'number' },
            resourceAvailability: { type: 'number' },
            nps: { type: 'number' }
          }
        },
        qualitativeFeedback: { type: 'object' },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        highlights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'feedback']
}));

export const onboardingAnalyticsTask = defineTask('onboarding-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Onboarding Analytics - ${args.employeeName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Analytics Specialist',
      task: 'Analyze onboarding effectiveness and generate report',
      context: {
        employeeId: args.employeeId,
        employeeName: args.employeeName,
        department: args.department,
        role: args.role,
        startDate: args.startDate,
        day30Checkpoint: args.day30Checkpoint,
        day60Checkpoint: args.day60Checkpoint,
        day90Checkpoint: args.day90Checkpoint,
        feedbackCollection: args.feedbackCollection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate time to productivity',
        '2. Measure milestone achievement rate',
        '3. Analyze training completion',
        '4. Compare to department benchmarks',
        '5. Calculate onboarding cost',
        '6. Assess early engagement indicators',
        '7. Predict retention likelihood',
        '8. Identify process improvements',
        '9. Generate onboarding scorecard',
        '10. Create recommendations report'
      ],
      outputFormat: 'JSON object with onboarding analytics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'timeToProductivity', 'recommendations', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            timeToProductivity: { type: 'number' },
            milestoneAchievementRate: { type: 'number' },
            trainingCompletionRate: { type: 'number' },
            satisfactionScore: { type: 'number' },
            engagementScore: { type: 'number' }
          }
        },
        timeToProductivity: { type: 'number' },
        benchmarkComparison: { type: 'object' },
        retentionLikelihood: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        processImprovements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'onboarding', 'analytics']
}));
