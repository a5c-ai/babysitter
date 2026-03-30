/**
 * @process specializations/product-management/beta-program
 * @description Beta Program Planning and Execution - Comprehensive process for planning, launching, and managing
 * structured beta programs to validate features with real customers before full launch. Covers participant recruitment,
 * program setup, feedback collection, usage monitoring, iteration cycles, and launch readiness assessment.
 * @inputs { featureName: string, betaObjectives: array, targetParticipants: number, duration: number }
 * @outputs { success: boolean, participantCount: number, feedbackSummary: object, launchReady: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/product-management/beta-program', {
 *   featureName: 'AI-Powered Analytics Dashboard',
 *   betaObjectives: ['validate-usability', 'test-performance', 'gather-feedback'],
 *   targetParticipants: 30,
 *   duration: 30, // days
 *   targetSegments: ['enterprise', 'mid-market'],
 *   successCriteria: {
 *     minEngagement: 70,
 *     minSatisfaction: 4.0,
 *     maxCriticalBugs: 0
 *   }
 * });
 *
 * @references
 * - Beta Testing Best Practices: https://www.centercode.com/blog/beta-testing-best-practices
 * - Product Launch Guide: https://www.productplan.com/learn/beta-testing/
 * - User Testing: https://www.usertesting.com/resources/topics/beta-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    featureName,
    betaObjectives = ['validate-usability', 'test-performance', 'gather-feedback'],
    targetParticipants = 25,
    duration = 30, // days
    targetSegments = ['all'],
    successCriteria = {
      minEngagement: 70,
      minSatisfaction: 4.0,
      maxCriticalBugs: 0,
      minActiveParticipants: 80
    },
    outputDir = 'beta-program-output',
    betaType = 'closed', // 'closed', 'open', 'private'
    feedbackChannels = ['surveys', 'interviews', 'analytics', 'support'],
    includeNDA = true,
    rewardProgram = true,
    participantCriteria = {},
    existingCustomers = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let participantCount = 0;
  let launchReady = false;
  const phaseResults = [];

  ctx.log('info', `Starting Beta Program Planning for ${featureName}`);
  ctx.log('info', `Target: ${targetParticipants} participants, Duration: ${duration} days, Type: ${betaType}`);
  ctx.log('info', `Objectives: ${betaObjectives.join(', ')}`);

  // ============================================================================
  // PHASE 1: BETA PROGRAM PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning beta program strategy and objectives');

  const planningResult = await ctx.task(betaProgramPlanningTask, {
    featureName,
    betaObjectives,
    targetParticipants,
    duration,
    targetSegments,
    successCriteria,
    betaType,
    feedbackChannels,
    outputDir
  });

  artifacts.push(...planningResult.artifacts);
  phaseResults.push({ phase: 'Beta Program Planning', result: planningResult });

  ctx.log('info', `Beta program plan complete - ${planningResult.phases.length} phases, ${planningResult.milestones.length} milestones`);

  // Quality Gate: Program plan review
  await ctx.breakpoint({
    question: `Beta program plan created for ${featureName}. ${planningResult.phases.length} phases over ${duration} days. ${targetParticipants} participants targeted. Review program plan and objectives?`,
    title: 'Beta Program Plan Review',
    context: {
      runId: ctx.runId,
      plan: {
        featureName,
        betaType,
        duration,
        targetParticipants,
        objectives: betaObjectives,
        successCriteria,
        phases: planningResult.phases.map(p => p.name)
      },
      files: planningResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: PARTICIPANT SELECTION CRITERIA
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining participant selection criteria and profile');

  const criteriaResult = await ctx.task(defineParticipantCriteriaTask, {
    featureName,
    targetParticipants,
    targetSegments,
    betaObjectives,
    participantCriteria,
    existingCustomers,
    outputDir
  });

  artifacts.push(...criteriaResult.artifacts);
  phaseResults.push({ phase: 'Participant Criteria', result: criteriaResult });

  ctx.log('info', `Participant criteria defined - ${criteriaResult.criteria.length} criteria, ${criteriaResult.segments.length} segments`);

  // ============================================================================
  // PHASE 3: BETA RECRUITMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing beta participant recruitment strategy');

  const recruitmentResult = await ctx.task(developRecruitmentStrategyTask, {
    featureName,
    targetParticipants,
    criteriaResult,
    targetSegments,
    existingCustomers,
    betaType,
    rewardProgram,
    outputDir
  });

  artifacts.push(...recruitmentResult.artifacts);
  phaseResults.push({ phase: 'Recruitment Strategy', result: recruitmentResult });

  ctx.log('info', `Recruitment strategy developed - ${recruitmentResult.channels.length} channels, ${recruitmentResult.tactics.length} tactics`);

  // ============================================================================
  // PHASE 4: BETA ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning beta environment and access setup');

  const environmentResult = await ctx.task(planBetaEnvironmentTask, {
    featureName,
    betaType,
    targetParticipants,
    planningResult,
    outputDir
  });

  artifacts.push(...environmentResult.artifacts);
  phaseResults.push({ phase: 'Environment Setup', result: environmentResult });

  ctx.log('info', `Environment plan created - ${environmentResult.components.length} components configured`);

  // ============================================================================
  // PHASE 5: BETA DOCUMENTATION AND ONBOARDING
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating beta documentation and onboarding materials');

  const documentationResult = await ctx.task(createBetaDocumentationTask, {
    featureName,
    betaObjectives,
    planningResult,
    criteriaResult,
    includeNDA,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);
  phaseResults.push({ phase: 'Beta Documentation', result: documentationResult });

  ctx.log('info', `Beta documentation complete - ${documentationResult.documents.length} documents, ${documentationResult.guides.length} guides`);

  // Quality Gate: Documentation review
  await ctx.breakpoint({
    question: `Beta documentation and onboarding materials created. ${documentationResult.documents.length} documents including guides, FAQs, and NDA. Review beta materials?`,
    title: 'Beta Documentation Review',
    context: {
      runId: ctx.runId,
      documentation: {
        totalDocuments: documentationResult.documents.length,
        guides: documentationResult.guides,
        includesNDA: includeNDA,
        onboardingSteps: documentationResult.onboardingSteps.length
      },
      files: documentationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: FEEDBACK COLLECTION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing feedback collection framework and mechanisms');

  const feedbackFrameworkResult = await ctx.task(designFeedbackFrameworkTask, {
    featureName,
    betaObjectives,
    duration,
    feedbackChannels,
    successCriteria,
    planningResult,
    outputDir
  });

  artifacts.push(...feedbackFrameworkResult.artifacts);
  phaseResults.push({ phase: 'Feedback Framework', result: feedbackFrameworkResult });

  ctx.log('info', `Feedback framework designed - ${feedbackFrameworkResult.mechanisms.length} mechanisms, ${feedbackFrameworkResult.surveys.length} surveys`);

  // ============================================================================
  // PHASE 7: ANALYTICS AND TRACKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up analytics, tracking, and monitoring');

  const analyticsResult = await ctx.task(setupAnalyticsTrackingTask, {
    featureName,
    betaObjectives,
    successCriteria,
    feedbackFrameworkResult,
    outputDir
  });

  artifacts.push(...analyticsResult.artifacts);
  phaseResults.push({ phase: 'Analytics Setup', result: analyticsResult });

  ctx.log('info', `Analytics setup complete - ${analyticsResult.metrics.length} metrics, ${analyticsResult.dashboards.length} dashboards`);

  // ============================================================================
  // PHASE 8: BETA LAUNCH COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating beta launch communication plan');

  const communicationResult = await ctx.task(createCommunicationPlanTask, {
    featureName,
    targetParticipants,
    planningResult,
    recruitmentResult,
    documentationResult,
    outputDir
  });

  artifacts.push(...communicationResult.artifacts);
  phaseResults.push({ phase: 'Communication Plan', result: communicationResult });

  ctx.log('info', `Communication plan created - ${communicationResult.touchpoints.length} touchpoints, ${communicationResult.templates.length} templates`);

  // ============================================================================
  // PHASE 9: BETA PROGRAM KICKOFF PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning beta program kickoff and launch');

  const kickoffResult = await ctx.task(planBetaKickoffTask, {
    featureName,
    planningResult,
    documentationResult,
    communicationResult,
    environmentResult,
    outputDir
  });

  artifacts.push(...kickoffResult.artifacts);
  phaseResults.push({ phase: 'Beta Kickoff', result: kickoffResult });

  ctx.log('info', `Kickoff plan created - ${kickoffResult.activities.length} activities, ${kickoffResult.checklistItems.length} checklist items`);

  // Quality Gate: Pre-launch readiness
  await ctx.breakpoint({
    question: `Beta program ready for kickoff. ${kickoffResult.checklistItems.length} checklist items. Environment, documentation, and communication plans complete. Proceed with beta launch?`,
    title: 'Beta Launch Readiness Review',
    context: {
      runId: ctx.runId,
      readiness: {
        planComplete: true,
        documentationReady: documentationResult.documents.length > 0,
        environmentReady: environmentResult.components.length > 0,
        communicationReady: communicationResult.touchpoints.length > 0,
        checklistComplete: kickoffResult.readinessScore
      },
      files: [
        { path: kickoffResult.checklistPath, format: 'markdown', label: 'Launch Checklist' },
        { path: planningResult.planPath, format: 'json', label: 'Beta Program Plan' }
      ]
    }
  });

  // ============================================================================
  // PHASE 10: ONGOING MONITORING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating ongoing monitoring and engagement plan');

  const monitoringResult = await ctx.task(createMonitoringPlanTask, {
    featureName,
    duration,
    planningResult,
    analyticsResult,
    feedbackFrameworkResult,
    successCriteria,
    outputDir
  });

  artifacts.push(...monitoringResult.artifacts);
  phaseResults.push({ phase: 'Monitoring Plan', result: monitoringResult });

  ctx.log('info', `Monitoring plan created - ${monitoringResult.checkpoints.length} checkpoints, ${monitoringResult.reports.length} reports`);

  // ============================================================================
  // PHASE 11: MID-BETA CHECK-IN FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 11: Designing mid-beta check-in and engagement framework');

  const checkinResult = await ctx.task(designCheckinFrameworkTask, {
    featureName,
    duration,
    targetParticipants,
    feedbackFrameworkResult,
    monitoringResult,
    outputDir
  });

  artifacts.push(...checkinResult.artifacts);
  phaseResults.push({ phase: 'Check-in Framework', result: checkinResult });

  ctx.log('info', `Check-in framework designed - ${checkinResult.checkins.length} check-ins, ${checkinResult.engagementTactics.length} engagement tactics`);

  // ============================================================================
  // PHASE 12: FEEDBACK ANALYSIS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating feedback analysis and synthesis plan');

  const analysisResult = await ctx.task(createAnalysisPlanTask, {
    featureName,
    betaObjectives,
    feedbackFrameworkResult,
    analyticsResult,
    successCriteria,
    outputDir
  });

  artifacts.push(...analysisResult.artifacts);
  phaseResults.push({ phase: 'Analysis Plan', result: analysisResult });

  ctx.log('info', `Analysis plan created - ${analysisResult.analysisMethods.length} methods, ${analysisResult.reportTemplates.length} templates`);

  // ============================================================================
  // PHASE 13: ISSUE PRIORITIZATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 13: Developing issue prioritization and triage framework');

  const prioritizationResult = await ctx.task(developPrioritizationFrameworkTask, {
    featureName,
    betaObjectives,
    successCriteria,
    analysisResult,
    outputDir
  });

  artifacts.push(...prioritizationResult.artifacts);
  phaseResults.push({ phase: 'Issue Prioritization', result: prioritizationResult });

  ctx.log('info', `Prioritization framework created - ${prioritizationResult.criteria.length} criteria, ${prioritizationResult.severityLevels.length} severity levels`);

  // ============================================================================
  // PHASE 14: BETA CLOSEOUT AND REWARDS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 14: Planning beta closeout and participant rewards');

  const closeoutResult = await ctx.task(planBetaCloseoutTask, {
    featureName,
    targetParticipants,
    rewardProgram,
    planningResult,
    outputDir
  });

  artifacts.push(...closeoutResult.artifacts);
  phaseResults.push({ phase: 'Beta Closeout', result: closeoutResult });

  ctx.log('info', `Closeout plan created - ${closeoutResult.activities.length} closeout activities, reward program: ${rewardProgram}`);

  // ============================================================================
  // PHASE 15: LAUNCH READINESS ASSESSMENT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating launch readiness assessment framework');

  const readinessResult = await ctx.task(createReadinessFrameworkTask, {
    featureName,
    betaObjectives,
    successCriteria,
    analysisResult,
    prioritizationResult,
    phaseResults,
    outputDir
  });

  artifacts.push(...readinessResult.artifacts);
  phaseResults.push({ phase: 'Launch Readiness', result: readinessResult });

  launchReady = readinessResult.preliminaryReadiness;
  participantCount = targetParticipants;

  ctx.log('info', `Launch readiness framework created - ${readinessResult.criteria.length} readiness criteria`);

  // Final Breakpoint: Beta Program Plan Complete
  await ctx.breakpoint({
    question: `Beta Program Plan Complete for ${featureName}. All ${phaseResults.length} phases planned. Target: ${targetParticipants} participants over ${duration} days. Review complete beta program plan?`,
    title: 'Final Beta Program Review',
    context: {
      runId: ctx.runId,
      summary: {
        featureName,
        betaType,
        duration,
        targetParticipants,
        objectives: betaObjectives,
        successCriteria
      },
      programComponents: {
        phases: planningResult.phases.length,
        milestones: planningResult.milestones.length,
        documents: documentationResult.documents.length,
        feedbackMechanisms: feedbackFrameworkResult.mechanisms.length,
        metrics: analyticsResult.metrics.length,
        checkpoints: monitoringResult.checkpoints.length,
        readinessCriteria: readinessResult.criteria.length
      },
      recruitment: {
        channels: recruitmentResult.channels.length,
        selectionCriteria: criteriaResult.criteria.length,
        targetSegments: targetSegments.join(', ')
      },
      files: [
        { path: planningResult.planPath, format: 'json', label: 'Beta Program Plan' },
        { path: documentationResult.mainDocPath, format: 'markdown', label: 'Beta Program Guide' },
        { path: kickoffResult.checklistPath, format: 'markdown', label: 'Launch Checklist' },
        { path: readinessResult.frameworkPath, format: 'json', label: 'Launch Readiness Framework' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    featureName,
    betaType,
    duration,
    targetParticipants: participantCount,
    objectives: betaObjectives,
    successCriteria,
    programPlan: {
      phases: planningResult.phases.length,
      milestones: planningResult.milestones.length,
      timeline: planningResult.timeline
    },
    participantRecruitment: {
      criteria: criteriaResult.criteria,
      segments: criteriaResult.segments,
      channels: recruitmentResult.channels,
      estimatedReach: recruitmentResult.estimatedReach
    },
    documentation: {
      totalDocuments: documentationResult.documents.length,
      guides: documentationResult.guides,
      includesNDA: includeNDA,
      onboardingSteps: documentationResult.onboardingSteps.length
    },
    feedbackCollection: {
      mechanisms: feedbackFrameworkResult.mechanisms,
      surveys: feedbackFrameworkResult.surveys.length,
      channels: feedbackChannels
    },
    analytics: {
      metrics: analyticsResult.metrics,
      dashboards: analyticsResult.dashboards,
      trackingEvents: analyticsResult.trackingEvents.length
    },
    monitoring: {
      checkpoints: monitoringResult.checkpoints,
      reports: monitoringResult.reports,
      alertsConfigured: monitoringResult.alertsConfigured
    },
    engagement: {
      checkins: checkinResult.checkins,
      communicationTouchpoints: communicationResult.touchpoints.length,
      engagementTactics: checkinResult.engagementTactics.length
    },
    analysis: {
      methods: analysisResult.analysisMethods,
      reportTemplates: analysisResult.reportTemplates.length,
      synthesisFramework: analysisResult.synthesisFramework
    },
    issuePrioritization: {
      criteria: prioritizationResult.criteria,
      severityLevels: prioritizationResult.severityLevels,
      triageProcess: prioritizationResult.triageProcess
    },
    launchReadiness: {
      preliminaryReadiness: launchReady,
      criteria: readinessResult.criteria,
      assessmentFramework: readinessResult.assessmentFramework
    },
    closeout: {
      activities: closeoutResult.activities,
      rewardProgram: rewardProgram,
      recognitionPlan: closeoutResult.recognitionPlan
    },
    artifacts,
    documentation_paths: {
      betaProgramPlan: planningResult.planPath,
      betaProgramGuide: documentationResult.mainDocPath,
      launchChecklist: kickoffResult.checklistPath,
      feedbackFramework: feedbackFrameworkResult.frameworkPath,
      analyticsSetup: analyticsResult.setupPath,
      readinessFramework: readinessResult.frameworkPath
    },
    duration: duration_ms,
    metadata: {
      processId: 'specializations/product-management/beta-program',
      processSlug: 'beta-program',
      category: 'product-launch-gtm',
      specializationSlug: 'product-management',
      timestamp: startTime,
      betaType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Beta Program Planning
export const betaProgramPlanningTask = defineTask('beta-program-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Beta Program Planning - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Beta Program Coordinator',
      task: 'Create comprehensive beta program plan with objectives, phases, timeline, and success metrics',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        targetParticipants: args.targetParticipants,
        duration: args.duration,
        targetSegments: args.targetSegments,
        successCriteria: args.successCriteria,
        betaType: args.betaType,
        feedbackChannels: args.feedbackChannels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BETA PROGRAM OBJECTIVES:',
        '   - Primary objectives (e.g., validate usability, test performance, gather feedback)',
        '   - Learning goals and key questions to answer',
        '   - Success metrics and criteria',
        '   - Risk mitigation goals',
        '',
        '2. Design BETA PROGRAM PHASES:',
        '   - Pre-Beta: Planning and setup (week -2 to 0)',
        '   - Kickoff: Launch and onboarding (week 1)',
        '   - Active Beta: Monitoring and engagement (weeks 2-3)',
        '   - Analysis: Feedback synthesis (week 4)',
        '   - Closeout: Wrap-up and rewards (week 5)',
        '',
        '3. Create TIMELINE AND MILESTONES:',
        '   - Key dates and deadlines',
        '   - Phase transitions and gates',
        '   - Feedback collection checkpoints',
        '   - Decision points',
        '',
        '4. Define SUCCESS CRITERIA:',
        '   - Minimum engagement requirements',
        '   - Satisfaction thresholds',
        '   - Quality gates (bug counts, performance)',
        '   - Launch readiness criteria',
        '',
        '5. Identify STAKEHOLDERS AND ROLES:',
        '   - Beta program owner',
        '   - Product team involvement',
        '   - Engineering support',
        '   - Customer success coordination',
        '   - Marketing/communications role',
        '',
        '6. Plan RESOURCE REQUIREMENTS:',
        '   - Team time allocation',
        '   - Tools and infrastructure',
        '   - Budget considerations',
        '',
        '7. Create comprehensive beta program plan document',
        '8. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with beta program plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phases', 'milestones', 'timeline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              description: { type: 'string' },
              successMetric: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            totalDuration: { type: 'number' },
            phases: { type: 'array' }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              timeCommitment: { type: 'string' }
            }
          }
        },
        resourceRequirements: {
          type: 'object',
          properties: {
            teamTime: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } }
          }
        },
        planPath: { type: 'string', description: 'Path to beta program plan JSON' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'planning']
}));

// Phase 2: Define Participant Criteria
export const defineParticipantCriteriaTask = defineTask('define-participant-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Define Participant Selection Criteria - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and User Research Specialist',
      task: 'Define comprehensive participant selection criteria and ideal beta tester profile',
      context: {
        featureName: args.featureName,
        targetParticipants: args.targetParticipants,
        targetSegments: args.targetSegments,
        betaObjectives: args.betaObjectives,
        participantCriteria: args.participantCriteria,
        existingCustomers: args.existingCustomers,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define INCLUSION CRITERIA:',
        '   - Customer segment (enterprise, mid-market, SMB)',
        '   - User role/persona',
        '   - Product usage level (power user, regular, light)',
        '   - Technical proficiency',
        '   - Geographic location (if relevant)',
        '   - Company size/industry',
        '',
        '2. Define EXCLUSION CRITERIA:',
        '   - Competitors or competitive intelligence risk',
        '   - Non-target segments',
        '   - Insufficient usage/engagement',
        '   - Technical limitations',
        '',
        '3. Create IDEAL PARTICIPANT PROFILE:',
        '   - Primary characteristics',
        '   - Nice-to-have attributes',
        '   - Diversity considerations (roles, industries, use cases)',
        '   - Mix of vocal vs. quiet users',
        '   - Balance of advocates vs. critics',
        '',
        '4. Define SEGMENT DISTRIBUTION:',
        '   - Target number per segment',
        '   - Rationale for mix',
        '   - Priority segments',
        '',
        '5. Specify COMMITMENT REQUIREMENTS:',
        '   - Time commitment expected',
        '   - Participation activities required',
        '   - Response time expectations',
        '   - Minimum engagement level',
        '',
        '6. Create SCREENING QUESTIONS:',
        '   - Application/screening form questions',
        '   - Qualification scoring method',
        '',
        '7. Document participant selection criteria',
        '8. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with participant criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criteria', 'segments', 'idealProfile', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              type: { type: 'string', enum: ['inclusion', 'exclusion', 'preferred'] },
              weight: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              targetCount: { type: 'number' },
              characteristics: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        idealProfile: {
          type: 'object',
          properties: {
            primaryCharacteristics: { type: 'array', items: { type: 'string' } },
            secondaryCharacteristics: { type: 'array', items: { type: 'string' } },
            diversityConsiderations: { type: 'array', items: { type: 'string' } }
          }
        },
        commitmentRequirements: {
          type: 'object',
          properties: {
            timeCommitment: { type: 'string' },
            activities: { type: 'array', items: { type: 'string' } },
            expectations: { type: 'array', items: { type: 'string' } }
          }
        },
        screeningQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' }
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
  labels: ['agent', 'beta-program', 'criteria']
}));

// Phase 3: Develop Recruitment Strategy
export const developRecruitmentStrategyTask = defineTask('develop-recruitment-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Develop Recruitment Strategy - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Manager and Community Manager',
      task: 'Develop comprehensive beta participant recruitment and selection strategy',
      context: {
        featureName: args.featureName,
        targetParticipants: args.targetParticipants,
        criteriaResult: args.criteriaResult,
        targetSegments: args.targetSegments,
        existingCustomers: args.existingCustomers,
        betaType: args.betaType,
        rewardProgram: args.rewardProgram,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify RECRUITMENT CHANNELS:',
        '   - Email campaigns to existing customers',
        '   - In-app invitations and banners',
        '   - Customer advisory board',
        '   - Sales team nominations',
        '   - Customer success manager referrals',
        '   - Community forums and user groups',
        '   - Social media outreach',
        '   - Website landing page',
        '',
        '2. Design RECRUITMENT MESSAGING:',
        '   - Value proposition for participants',
        '   - Exclusive early access framing',
        '   - Influence product development angle',
        '   - Recognition and rewards',
        '   - Time commitment transparency',
        '',
        '3. Create RECRUITMENT TIMELINE:',
        '   - Launch announcement date',
        '   - Application period duration',
        '   - Review and selection timeline',
        '   - Acceptance notifications',
        '   - Onboarding start date',
        '',
        '4. Define SELECTION PROCESS:',
        '   - Application review criteria',
        '   - Scoring methodology',
        '   - Diversity balancing',
        '   - Waitlist management',
        '   - Rejection communication',
        '',
        '5. Plan INCENTIVES AND REWARDS:',
        '   - Early access benefits',
        '   - Recognition program',
        '   - Tangible rewards (credits, swag, discounts)',
        '   - Exclusive access to product team',
        '   - Certificate or badge',
        '',
        '6. Estimate CONVERSION FUNNEL:',
        '   - Expected reach per channel',
        '   - Application rate',
        '   - Qualification rate',
        '   - Acceptance rate',
        '   - Over-recruitment buffer',
        '',
        '7. Create recruitment strategy document',
        '8. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with recruitment strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'channels', 'tactics', 'timeline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              reach: { type: 'number' },
              priority: { type: 'string' },
              expectedApplications: { type: 'number' }
            }
          }
        },
        tactics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tactic: { type: 'string' },
              channel: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        messaging: {
          type: 'object',
          properties: {
            valueProposition: { type: 'string' },
            keyMessages: { type: 'array', items: { type: 'string' } },
            callToAction: { type: 'string' }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        selectionProcess: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            scoringCriteria: { type: 'array' },
            decisionMakers: { type: 'array', items: { type: 'string' } }
          }
        },
        incentives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              incentive: { type: 'string' },
              description: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        estimatedReach: {
          type: 'object',
          properties: {
            totalReach: { type: 'number' },
            expectedApplications: { type: 'number' },
            targetAcceptances: { type: 'number' },
            overRecruitmentFactor: { type: 'number' }
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
  labels: ['agent', 'beta-program', 'recruitment']
}));

// Phase 4: Plan Beta Environment
export const planBetaEnvironmentTask = defineTask('plan-beta-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Plan Beta Environment Setup - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Technical Program Manager',
      task: 'Plan beta environment infrastructure, access controls, and technical setup',
      context: {
        featureName: args.featureName,
        betaType: args.betaType,
        targetParticipants: args.targetParticipants,
        planningResult: args.planningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define ENVIRONMENT STRATEGY:',
        '   - Dedicated beta environment vs. production with feature flags',
        '   - Isolation and data separation approach',
        '   - Scalability and performance considerations',
        '   - Rollback and safety mechanisms',
        '',
        '2. Plan ACCESS CONTROL:',
        '   - Beta participant identification (email list, user IDs)',
        '   - Feature flag configuration',
        '   - Permissions and entitlements',
        '   - Access provisioning process',
        '   - Access revocation process',
        '',
        '3. Configure FEATURE FLAGS:',
        '   - Beta feature toggle setup',
        '   - Gradual rollout capability',
        '   - Emergency kill switch',
        '   - A/B testing hooks (if applicable)',
        '',
        '4. Setup MONITORING AND OBSERVABILITY:',
        '   - Error tracking and logging',
        '   - Performance monitoring',
        '   - Usage analytics',
        '   - Beta-specific dashboards',
        '   - Alert configuration',
        '',
        '5. Plan DATA MANAGEMENT:',
        '   - Beta data collection and storage',
        '   - Privacy and GDPR compliance',
        '   - Data retention policy',
        '   - Anonymization approach',
        '',
        '6. Define SUPPORT INFRASTRUCTURE:',
        '   - Beta-specific support channel',
        '   - Bug reporting mechanism',
        '   - Feedback collection tools',
        '   - Communication platform (Slack, email, forum)',
        '',
        '7. Create TECHNICAL SETUP CHECKLIST:',
        '   - Pre-launch validation steps',
        '   - Environment readiness criteria',
        '   - Testing and smoke tests',
        '',
        '8. Document environment setup plan',
        '9. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with environment setup plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'components', 'setupSteps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        environmentStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            infrastructure: { type: 'string' },
            isolationLevel: { type: 'string' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        accessControl: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            provisioningProcess: { type: 'array', items: { type: 'string' } },
            revocationProcess: { type: 'array', items: { type: 'string' } }
          }
        },
        featureFlags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flag: { type: 'string' },
              purpose: { type: 'string' },
              defaultValue: { type: 'boolean' }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            errorTracking: { type: 'string' },
            performanceMonitoring: { type: 'string' },
            analytics: { type: 'string' },
            alerts: { type: 'array', items: { type: 'string' } }
          }
        },
        supportInfrastructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              accessLevel: { type: 'string' }
            }
          }
        },
        setupSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'beta-program', 'environment']
}));

// Phase 5: Create Beta Documentation
export const createBetaDocumentationTask = defineTask('create-beta-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Create Beta Documentation and Onboarding - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Product Manager',
      task: 'Create comprehensive beta program documentation, guides, and onboarding materials',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        planningResult: args.planningResult,
        criteriaResult: args.criteriaResult,
        includeNDA: args.includeNDA,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create BETA PROGRAM GUIDE:',
        '   - Welcome and introduction',
        '   - Program overview and timeline',
        '   - Participant responsibilities and expectations',
        '   - Communication channels and support',
        '   - Feedback mechanisms',
        '   - Rewards and recognition',
        '   - FAQ section',
        '',
        '2. Write FEATURE DOCUMENTATION:',
        '   - Feature overview and value proposition',
        '   - Getting started guide',
        '   - Step-by-step tutorials',
        '   - Use case examples',
        '   - Troubleshooting tips',
        '   - Known limitations',
        '',
        '3. Create ONBOARDING CHECKLIST:',
        '   - Account setup steps',
        '   - Access verification',
        '   - First task to complete',
        '   - Orientation materials to review',
        '   - Initial feedback to provide',
        '',
        '4. Design LEGAL DOCUMENTS (if applicable):',
        '   - NDA (Non-Disclosure Agreement)',
        '   - Beta terms and conditions',
        '   - Data privacy notice',
        '   - Acceptable use policy',
        '',
        '5. Create FEEDBACK TEMPLATES:',
        '   - Bug report template',
        '   - Feature request format',
        '   - General feedback structure',
        '   - Survey templates',
        '',
        '6. Develop VIDEO OR VISUAL GUIDES:',
        '   - Product walkthrough outline',
        '   - Demo video script',
        '   - Screenshot guides',
        '',
        '7. Build FAQ AND TROUBLESHOOTING:',
        '   - Common questions and answers',
        '   - Technical troubleshooting',
        '   - Who to contact for different issues',
        '',
        '8. Create WELCOME EMAIL SEQUENCE:',
        '   - Acceptance email with next steps',
        '   - Access credentials email',
        '   - Getting started email',
        '   - First check-in prompt',
        '',
        '9. Compile all documentation',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with beta documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documents', 'guides', 'onboardingSteps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              documentName: { type: 'string' },
              documentType: { type: 'string' },
              description: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        guides: {
          type: 'array',
          items: { type: 'string' }
        },
        onboardingSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        legalDocuments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              required: { type: 'boolean' },
              description: { type: 'string' }
            }
          }
        },
        feedbackTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              purpose: { type: 'string' },
              fields: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        faq: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        welcomeSequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              timing: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        mainDocPath: { type: 'string', description: 'Path to main beta program guide' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'documentation']
}));

// Phase 6: Design Feedback Framework
export const designFeedbackFrameworkTask = defineTask('design-feedback-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Design Feedback Collection Framework - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and User Research Specialist',
      task: 'Design comprehensive feedback collection framework with multiple mechanisms and touchpoints',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        duration: args.duration,
        feedbackChannels: args.feedbackChannels,
        successCriteria: args.successCriteria,
        planningResult: args.planningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design FEEDBACK MECHANISMS:',
        '   - In-app feedback widget',
        '   - Email surveys (initial, mid-beta, final)',
        '   - One-on-one interviews',
        '   - Group feedback sessions',
        '   - Bug reporting system',
        '   - Feature request portal',
        '   - Community forum or Slack channel',
        '',
        '2. Create SURVEY INSTRUMENTS:',
        '   - Initial expectations survey (Day 1)',
        '   - Weekly pulse surveys (every 7 days)',
        '   - Mid-beta deep dive survey (Day 15)',
        '   - Final beta survey (Day 30)',
        '   - NPS or satisfaction questions',
        '   - Open-ended qualitative questions',
        '',
        '3. Plan INTERVIEW PROGRAM:',
        '   - Interview schedule and cadence',
        '   - Participant selection for interviews',
        '   - Interview guide and questions',
        '   - Recording and transcription approach',
        '',
        '4. Define FEEDBACK TAXONOMY:',
        '   - Feedback categories (bug, feature request, usability, performance)',
        '   - Priority levels',
        '   - Tagging system',
        '   - Status workflow',
        '',
        '5. Setup FEEDBACK COLLECTION TOOLS:',
        '   - Survey tool configuration (Typeform, SurveyMonkey, Qualtrics)',
        '   - Bug tracking integration (Jira, Linear)',
        '   - Feedback aggregation platform',
        '   - Communication tools (Slack, email)',
        '',
        '6. Design ENGAGEMENT TRIGGERS:',
        '   - Automated feedback requests based on usage',
        '   - Milestone-based surveys',
        '   - Event-triggered feedback (after key actions)',
        '   - Time-based check-ins',
        '',
        '7. Create FEEDBACK RESPONSE PROTOCOL:',
        '   - Acknowledgment process',
        '   - Response time SLAs',
        '   - Escalation paths',
        '   - Communication of actions taken',
        '',
        '8. Define SUCCESS METRICS:',
        '   - Response rate targets',
        '   - Feedback quality indicators',
        '   - Engagement metrics',
        '',
        '9. Document feedback collection framework',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with feedback framework'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mechanisms', 'surveys', 'frameworkPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              channel: { type: 'string' },
              frequency: { type: 'string' },
              purpose: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        surveys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              surveyName: { type: 'string' },
              timing: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } },
              expectedResponseRate: { type: 'number' }
            }
          }
        },
        interviewProgram: {
          type: 'object',
          properties: {
            totalInterviews: { type: 'number' },
            interviewDuration: { type: 'string' },
            participantSelection: { type: 'string' },
            interviewGuide: { type: 'array', items: { type: 'string' } }
          }
        },
        feedbackTaxonomy: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            priorities: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              integration: { type: 'string' }
            }
          }
        },
        engagementTriggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              condition: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        responseProtocol: {
          type: 'object',
          properties: {
            acknowledgmentSLA: { type: 'string' },
            responseSLA: { type: 'string' },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        successMetrics: {
          type: 'object',
          properties: {
            targetResponseRate: { type: 'number' },
            targetEngagement: { type: 'number' },
            feedbackQualityIndicators: { type: 'array', items: { type: 'string' } }
          }
        },
        frameworkPath: { type: 'string', description: 'Path to feedback framework JSON' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'feedback']
}));

// Phase 7: Setup Analytics Tracking
export const setupAnalyticsTrackingTask = defineTask('setup-analytics-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Setup Analytics and Tracking - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Analytics Specialist and Data Analyst',
      task: 'Design analytics instrumentation, tracking events, and monitoring dashboards for beta program',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        successCriteria: args.successCriteria,
        feedbackFrameworkResult: args.feedbackFrameworkResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define KEY METRICS:',
        '   - Activation metrics (first use, time to value)',
        '   - Engagement metrics (DAU, WAU, session duration, feature usage)',
        '   - Adoption metrics (% of participants using feature)',
        '   - Performance metrics (load times, error rates)',
        '   - Satisfaction metrics (NPS, CSAT)',
        '   - Quality metrics (bug count, severity)',
        '',
        '2. Design TRACKING EVENTS:',
        '   - Feature accessed',
        '   - Key actions completed',
        '   - User flows and funnels',
        '   - Error events',
        '   - Engagement milestones',
        '   - Drop-off points',
        '',
        '3. Create EVENT TAXONOMY:',
        '   - Naming conventions',
        '   - Event properties',
        '   - User properties (beta participant flag)',
        '   - Context data',
        '',
        '4. Design DASHBOARDS:',
        '   - Beta program overview dashboard',
        '   - Feature usage dashboard',
        '   - Engagement and retention dashboard',
        '   - Performance and quality dashboard',
        '   - Individual participant activity view',
        '',
        '5. Setup COHORT ANALYSIS:',
        '   - Beta participant cohort definition',
        '   - Retention curves',
        '   - Segment comparisons',
        '   - Feature adoption progression',
        '',
        '6. Configure ALERTS AND NOTIFICATIONS:',
        '   - Critical errors',
        '   - Performance degradation',
        '   - Engagement drop-offs',
        '   - Anomaly detection',
        '',
        '7. Plan REPORTING CADENCE:',
        '   - Daily metrics snapshot',
        '   - Weekly summary report',
        '   - Mid-beta analysis',
        '   - Final beta report',
        '',
        '8. Define INSTRUMENTATION REQUIREMENTS:',
        '   - Analytics SDK/library',
        '   - Event tracking code locations',
        '   - Testing and validation approach',
        '',
        '9. Create analytics setup guide',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with analytics setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'dashboards', 'trackingEvents', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              category: { type: 'string' },
              definition: { type: 'string' },
              target: { type: 'string' },
              calculationMethod: { type: 'string' }
            }
          }
        },
        trackingEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              purpose: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } },
              trigger: { type: 'string' }
            }
          }
        },
        eventTaxonomy: {
          type: 'object',
          properties: {
            namingConvention: { type: 'string' },
            categories: { type: 'array', items: { type: 'string' } },
            standardProperties: { type: 'array', items: { type: 'string' } }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboardName: { type: 'string' },
              purpose: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' }
            }
          }
        },
        cohortAnalysis: {
          type: 'object',
          properties: {
            cohortDefinition: { type: 'string' },
            analysisTypes: { type: 'array', items: { type: 'string' } },
            segments: { type: 'array', items: { type: 'string' } }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alert: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportingCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reportType: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        instrumentation: {
          type: 'object',
          properties: {
            sdk: { type: 'string' },
            implementationAreas: { type: 'array', items: { type: 'string' } },
            validationSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        setupPath: { type: 'string', description: 'Path to analytics setup guide' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'analytics']
}));

// Phase 8: Create Communication Plan
export const createCommunicationPlanTask = defineTask('create-communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Beta Launch Communication Plan - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Manager and Communications Specialist',
      task: 'Create comprehensive communication plan for beta program launch and ongoing engagement',
      context: {
        featureName: args.featureName,
        targetParticipants: args.targetParticipants,
        planningResult: args.planningResult,
        recruitmentResult: args.recruitmentResult,
        documentationResult: args.documentationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define COMMUNICATION OBJECTIVES:',
        '   - Build excitement and engagement',
        '   - Ensure clarity on expectations',
        '   - Maintain active participation',
        '   - Foster community and feedback',
        '   - Recognize contributions',
        '',
        '2. Map COMMUNICATION TOUCHPOINTS:',
        '   - Pre-beta: Invitation and selection',
        '   - Launch: Welcome and onboarding',
        '   - Week 1: Getting started support',
        '   - Week 2: First check-in',
        '   - Week 3: Mid-beta survey',
        '   - Week 4: Final survey and wrap-up',
        '   - Post-beta: Thank you and next steps',
        '',
        '3. Create EMAIL TEMPLATES:',
        '   - Beta invitation email',
        '   - Acceptance notification',
        '   - Welcome and kickoff email',
        '   - Weekly update emails',
        '   - Survey request emails',
        '   - Interview invitation email',
        '   - Thank you and closeout email',
        '',
        '4. Design IN-APP MESSAGING:',
        '   - Beta banner or badge',
        '   - Feature announcements',
        '   - Feedback prompts',
        '   - Tips and tricks',
        '',
        '5. Plan COMMUNITY ENGAGEMENT:',
        '   - Slack/forum setup and moderation',
        '   - Discussion topic prompts',
        '   - Q&A sessions with product team',
        '   - Highlight participant contributions',
        '',
        '6. Create PROGRESS UPDATES:',
        '   - Weekly beta program status',
        '   - Feature improvements made based on feedback',
        '   - Participant success stories',
        '   - Roadmap sneak peeks',
        '',
        '7. Define COMMUNICATION CHANNELS:',
        '   - Primary: Email',
        '   - Secondary: In-app notifications',
        '   - Community: Slack/forum',
        '   - Real-time: Support chat',
        '',
        '8. Establish RESPONSE PROTOCOLS:',
        '   - Question escalation paths',
        '   - Response time commitments',
        '   - After-hours coverage',
        '',
        '9. Document communication plan',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'touchpoints', 'templates', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        objectives: {
          type: 'array',
          items: { type: 'string' }
        },
        touchpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              touchpoint: { type: 'string' },
              timing: { type: 'string' },
              channel: { type: 'string' },
              purpose: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              type: { type: 'string' },
              subject: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        inAppMessaging: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              messageType: { type: 'string' },
              trigger: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        communityEngagement: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            moderationPlan: { type: 'string' },
            discussionTopics: { type: 'array', items: { type: 'string' } },
            qaSessions: { type: 'array' }
          }
        },
        progressUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              updateType: { type: 'string' },
              frequency: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              role: { type: 'string' },
              useCase: { type: 'string' }
            }
          }
        },
        responseProtocols: {
          type: 'object',
          properties: {
            escalationPath: { type: 'array', items: { type: 'string' } },
            responseTimeSLA: { type: 'string' },
            afterHoursCoverage: { type: 'string' }
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
  labels: ['agent', 'beta-program', 'communication']
}));

// Phase 9: Plan Beta Kickoff
export const planBetaKickoffTask = defineTask('plan-beta-kickoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Plan Beta Program Kickoff - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Program Manager',
      task: 'Create comprehensive beta program kickoff plan with launch checklist and go-live procedures',
      context: {
        featureName: args.featureName,
        planningResult: args.planningResult,
        documentationResult: args.documentationResult,
        communicationResult: args.communicationResult,
        environmentResult: args.environmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create KICKOFF TIMELINE:',
        '   - T-7 days: Final environment testing',
        '   - T-5 days: Documentation review',
        '   - T-3 days: Team readiness check',
        '   - T-1 day: Final go/no-go decision',
        '   - Launch day: Go-live activities',
        '   - Launch +1: First day support',
        '',
        '2. Build PRE-LAUNCH CHECKLIST:',
        '   - Product readiness:',
        '     - Feature complete and tested',
        '     - Performance validated',
        '     - No critical bugs',
        '     - Rollback plan ready',
        '   - Environment readiness:',
        '     - Beta environment configured',
        '     - Feature flags tested',
        '     - Access controls verified',
        '     - Monitoring enabled',
        '   - Documentation readiness:',
        '     - All guides published',
        '     - FAQ populated',
        '     - Templates ready',
        '     - Legal docs signed',
        '   - Team readiness:',
        '     - Support team trained',
        '     - On-call schedule set',
        '     - Communication channels active',
        '     - Escalation paths clear',
        '',
        '3. Plan LAUNCH DAY ACTIVITIES:',
        '   - 9am: Enable beta access',
        '   - 10am: Send welcome emails',
        '   - 11am: Monitor first logins',
        '   - 12pm: Check for issues',
        '   - 2pm: First participant check-ins',
        '   - 4pm: Day 1 summary',
        '   - 6pm: Evening check',
        '',
        '4. Define KICKOFF ACTIVITIES:',
        '   - Welcome email with access instructions',
        '   - Kickoff webinar or video (optional)',
        '   - Community channel introduction',
        '   - First task assignment',
        '   - Initial survey launch',
        '',
        '5. Setup MONITORING AND SUPPORT:',
        '   - War room or sync channel',
        '   - Real-time dashboard monitoring',
        '   - On-call coverage',
        '   - Incident response procedures',
        '',
        '6. Plan GO/NO-GO DECISION PROCESS:',
        '   - Decision criteria',
        '   - Stakeholders involved',
        '   - Decision meeting agenda',
        '   - Delay procedures if needed',
        '',
        '7. Create ROLLBACK PLAN:',
        '   - Trigger conditions',
        '   - Rollback procedures',
        '   - Participant communication',
        '   - Recovery steps',
        '',
        '8. Define SUCCESS INDICATORS:',
        '   - First day metrics to track',
        '   - Green/yellow/red thresholds',
        '   - Decision points for first 48 hours',
        '',
        '9. Document kickoff plan and checklist',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with kickoff plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'activities', 'checklistItems', 'checklistPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timing: { type: 'string' },
              activity: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        checklistItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              item: { type: 'string' },
              completed: { type: 'boolean' },
              owner: { type: 'string' }
            }
          }
        },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              timing: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        launchDaySchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              task: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        kickoffActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              description: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        monitoringSetup: {
          type: 'object',
          properties: {
            warRoom: { type: 'string' },
            dashboards: { type: 'array', items: { type: 'string' } },
            onCallSchedule: { type: 'array' }
          }
        },
        goNoGoDecision: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } },
            decisionTiming: { type: 'string' }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            procedures: { type: 'array', items: { type: 'string' } },
            communicationPlan: { type: 'string' }
          }
        },
        successIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              target: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        checklistPath: { type: 'string', description: 'Path to launch checklist' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'kickoff']
}));

// Phase 10: Create Monitoring Plan
export const createMonitoringPlanTask = defineTask('create-monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Ongoing Monitoring Plan - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Data Analyst',
      task: 'Create ongoing monitoring and engagement plan for active beta program phase',
      context: {
        featureName: args.featureName,
        duration: args.duration,
        planningResult: args.planningResult,
        analyticsResult: args.analyticsResult,
        feedbackFrameworkResult: args.feedbackFrameworkResult,
        successCriteria: args.successCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define DAILY MONITORING ACTIVITIES:',
        '   - Review key metrics (logins, feature usage, errors)',
        '   - Monitor support tickets and feedback',
        '   - Check participant engagement levels',
        '   - Review anomalies or red flags',
        '   - Update team on status',
        '',
        '2. Create WEEKLY CHECKPOINTS:',
        '   - Week 1: Launch week review',
        '   - Week 2: Engagement and adoption check',
        '   - Week 3: Mid-beta assessment',
        '   - Week 4: Pre-closeout review',
        '   - Each checkpoint includes:',
        '     - Metrics review',
        '     - Feedback themes',
        '     - Issue triage',
        '     - Engagement interventions',
        '',
        '3. Design ENGAGEMENT MONITORING:',
        '   - Active participants (login in last 7 days)',
        '   - At-risk participants (no activity in 7+ days)',
        '   - Power users (high engagement)',
        '   - Dormant participants (never logged in)',
        '   - Re-engagement strategies for each segment',
        '',
        '4. Plan PROACTIVE OUTREACH:',
        '   - Check-in with inactive participants',
        '   - Celebrate power users',
        '   - Request feedback from engaged users',
        '   - Interview selection based on activity',
        '',
        '5. Create REPORTING STRUCTURE:',
        '   - Daily dashboard review (internal)',
        '   - Weekly summary report (stakeholders)',
        '   - Mid-beta comprehensive analysis',
        '   - Final beta report',
        '   - Report templates and formats',
        '',
        '6. Define ALERT THRESHOLDS:',
        '   - Critical: >5 critical bugs, <50% engagement',
        '   - Warning: Performance degradation, increasing error rates',
        '   - Info: Milestones reached, positive feedback spikes',
        '',
        '7. Plan ISSUE TRACKING:',
        '   - Bug tracking and prioritization',
        '   - Feature request logging',
        '   - Resolution communication back to participants',
        '',
        '8. Setup TEAM SYNC CADENCE:',
        '   - Daily standup (5 min)',
        '   - Weekly beta review (30 min)',
        '   - Mid-beta retrospective (1 hour)',
        '   - Ad-hoc escalations as needed',
        '',
        '9. Document monitoring plan',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with monitoring plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checkpoints', 'reports', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dailyActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              timing: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        engagementMonitoring: {
          type: 'object',
          properties: {
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  segment: { type: 'string' },
                  definition: { type: 'string' },
                  interventions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            reEngagementStrategies: { type: 'array', items: { type: 'string' } }
          }
        },
        proactiveOutreach: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outreachType: { type: 'string' },
              targetSegment: { type: 'string' },
              frequency: { type: 'string' },
              message: { type: 'string' }
            }
          }
        },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reportName: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alertThresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        issueTracking: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            workflow: { type: 'array', items: { type: 'string' } },
            communicationProcess: { type: 'string' }
          }
        },
        teamSync: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alertsConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'monitoring']
}));

// Phase 11: Design Check-in Framework
export const designCheckinFrameworkTask = defineTask('design-checkin-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Design Mid-Beta Check-in Framework - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Customer Success Manager',
      task: 'Design mid-beta check-in and participant engagement framework',
      context: {
        featureName: args.featureName,
        duration: args.duration,
        targetParticipants: args.targetParticipants,
        feedbackFrameworkResult: args.feedbackFrameworkResult,
        monitoringResult: args.monitoringResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design CHECK-IN SCHEDULE:',
        '   - Week 1 check-in: Getting started support',
        '   - Week 2 check-in: Initial experience feedback',
        '   - Week 3 check-in: Deep dive on usage',
        '   - Week 4 check-in: Pre-closeout preparation',
        '',
        '2. Create CHECK-IN FORMATS:',
        '   - Email check-ins (automated)',
        '   - 1-on-1 calls (with select participants)',
        '   - Group feedback sessions',
        '   - Office hours (open Q&A)',
        '   - Community discussions',
        '',
        '3. Develop CHECK-IN QUESTIONS:',
        '   - How is the beta experience going?',
        '   - What\'s working well?',
        '   - What\'s frustrating or confusing?',
        '   - What features are you using most?',
        '   - What\'s missing or needed?',
        '   - Any blockers or technical issues?',
        '   - How likely to recommend (NPS)?',
        '',
        '4. Plan PARTICIPANT SEGMENTATION:',
        '   - Power users: Deep dive interviews',
        '   - Regular users: Survey and email check-ins',
        '   - Low engagement: Proactive outreach',
        '   - Dormant: Re-engagement or exit',
        '',
        '5. Design ENGAGEMENT TACTICS:',
        '   - Gamification (badges, milestones)',
        '   - Exclusive sneak peeks of roadmap',
        '   - Direct access to product team',
        '   - Community recognition',
        '   - Progress sharing (you\'ve helped ship X improvements)',
        '',
        '6. Create RESPONSE PROTOCOLS:',
        '   - How to handle negative feedback',
        '   - Escalation of technical issues',
        '   - Feature request acknowledgment',
        '   - Celebrating positive feedback',
        '',
        '7. Plan MID-BETA SURVEY:',
        '   - Timing (around day 15)',
        '   - Questions covering usability, performance, satisfaction',
        '   - NPS or satisfaction score',
        '   - Open-ended qualitative questions',
        '   - Expected response rate',
        '',
        '8. Design ENGAGEMENT CADENCE:',
        '   - High-touch participants: Weekly 1-on-1s',
        '   - Medium-touch: Bi-weekly check-ins',
        '   - Low-touch: Surveys and email',
        '',
        '9. Document check-in framework',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with check-in framework'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checkins', 'engagementTactics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        checkins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkinName: { type: 'string' },
              timing: { type: 'string' },
              format: { type: 'string' },
              purpose: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        formats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'string' },
              targetAudience: { type: 'string' }
            }
          }
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        segmentation: {
          type: 'object',
          properties: {
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  segment: { type: 'string' },
                  definition: { type: 'string' },
                  engagementLevel: { type: 'string' },
                  tactics: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        engagementTactics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tactic: { type: 'string' },
              description: { type: 'string' },
              targetSegment: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        responseProtocols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              protocol: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        midBetaSurvey: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            questions: { type: 'array', items: { type: 'string' } },
            expectedResponseRate: { type: 'number' }
          }
        },
        engagementCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentType: { type: 'string' },
              frequency: { type: 'string' },
              method: { type: 'string' }
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
  labels: ['agent', 'beta-program', 'engagement']
}));

// Phase 12: Create Analysis Plan
export const createAnalysisPlanTask = defineTask('create-analysis-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Create Feedback Analysis Plan - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and User Research Analyst',
      task: 'Create comprehensive feedback analysis and synthesis plan for beta program',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        feedbackFrameworkResult: args.feedbackFrameworkResult,
        analyticsResult: args.analyticsResult,
        successCriteria: args.successCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define ANALYSIS METHODS:',
        '   - Quantitative analysis (metrics, surveys, usage data)',
        '   - Qualitative analysis (interviews, open-ended feedback)',
        '   - Thematic analysis (coding and categorizing feedback)',
        '   - Sentiment analysis',
        '   - Trend analysis over time',
        '',
        '2. Create ANALYSIS FRAMEWORK:',
        '   - Organize by feedback type (bugs, features, usability, performance)',
        '   - Prioritize by frequency and severity',
        '   - Map to product areas and components',
        '   - Identify quick wins vs. strategic changes',
        '',
        '3. Design SYNTHESIS PROCESS:',
        '   - Aggregate feedback from all sources',
        '   - Identify patterns and themes',
        '   - Quantify frequency of issues/requests',
        '   - Calculate impact and severity',
        '   - Create prioritized list',
        '',
        '4. Plan INSIGHT GENERATION:',
        '   - What did we learn about usability?',
        '   - What did we learn about value proposition?',
        '   - What did we learn about target users?',
        '   - What did we learn about product-market fit?',
        '   - What surprised us?',
        '',
        '5. Create REPORT TEMPLATES:',
        '   - Weekly feedback summary',
        '   - Mid-beta comprehensive report',
        '   - Final beta report and recommendations',
        '   - Executive summary',
        '   - Detailed findings appendix',
        '',
        '6. Define ANALYSIS SCHEDULE:',
        '   - Daily: Quick review of new feedback',
        '   - Weekly: Synthesis and summary',
        '   - Mid-beta: Deep dive analysis',
        '   - Post-beta: Comprehensive final analysis',
        '',
        '7. Setup ANALYSIS TOOLS:',
        '   - Spreadsheet for categorization',
        '   - Qualitative analysis software (if needed)',
        '   - Visualization tools for reports',
        '   - Dashboard for real-time tracking',
        '',
        '8. Plan STAKEHOLDER SHARING:',
        '   - Weekly updates to product team',
        '   - Bi-weekly to leadership',
        '   - Mid-beta to broader stakeholders',
        '   - Final report to all stakeholders',
        '',
        '9. Define SUCCESS METRICS CALCULATION:',
        '   - How to measure against success criteria',
        '   - How to calculate readiness scores',
        '   - How to assess launch go/no-go',
        '',
        '10. Document analysis plan',
        '11. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with analysis plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysisMethods', 'reportTemplates', 'synthesisFramework', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysisMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              dataSource: { type: 'string' },
              technique: { type: 'string' },
              output: { type: 'string' }
            }
          }
        },
        analysisFramework: {
          type: 'object',
          properties: {
            dimensions: { type: 'array', items: { type: 'string' } },
            categories: { type: 'array', items: { type: 'string' } },
            prioritizationCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        synthesisProcess: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              output: { type: 'string' }
            }
          }
        },
        insightGeneration: {
          type: 'object',
          properties: {
            learningQuestions: { type: 'array', items: { type: 'string' } },
            insightCategories: { type: 'array', items: { type: 'string' } },
            synthesisApproach: { type: 'string' }
          }
        },
        reportTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              frequency: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' }
            }
          }
        },
        analysisSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frequency: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        stakeholderSharing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              frequency: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        successMetricsCalculation: {
          type: 'object',
          properties: {
            methods: { type: 'array', items: { type: 'string' } },
            readinessScoreFormula: { type: 'string' },
            goNoGoThresholds: { type: 'array' }
          }
        },
        synthesisFramework: { type: 'string', description: 'Path to synthesis framework document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'analysis']
}));

// Phase 13: Develop Prioritization Framework
export const developPrioritizationFrameworkTask = defineTask('develop-prioritization-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Develop Issue Prioritization Framework - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Engineering Manager',
      task: 'Develop issue prioritization and triage framework for beta feedback and bugs',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        successCriteria: args.successCriteria,
        analysisResult: args.analysisResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define ISSUE CATEGORIES:',
        '   - Bugs (blocking, critical, major, minor)',
        '   - Feature requests (high-value, nice-to-have)',
        '   - Usability issues (friction points, confusion)',
        '   - Performance issues (slow, errors, crashes)',
        '   - Content/documentation issues',
        '',
        '2. Create SEVERITY LEVELS:',
        '   - P0/Critical: Blocks usage, data loss, security issue',
        '   - P1/High: Major impact, affects key workflows',
        '   - P2/Medium: Moderate impact, workaround available',
        '   - P3/Low: Minor impact, cosmetic, edge case',
        '',
        '3. Define PRIORITIZATION CRITERIA:',
        '   - Frequency: How many participants reported?',
        '   - Severity: What\'s the impact?',
        '   - Alignment: Does it align with product strategy?',
        '   - Effort: How hard to fix?',
        '   - Launch blocker: Must fix for launch?',
        '',
        '4. Create TRIAGE PROCESS:',
        '   - Initial review: Categorize and assign severity',
        '   - Investigation: Reproduce and assess effort',
        '   - Prioritization: Apply criteria and score',
        '   - Decision: Fix now, fix later, or won\'t fix',
        '   - Communication: Inform reporter of status',
        '',
        '5. Define RESPONSE SLAs:',
        '   - P0/Critical: 4 hours acknowledgment, 24 hours resolution',
        '   - P1/High: 24 hours acknowledgment, 1 week resolution',
        '   - P2/Medium: 2 days acknowledgment, 2 weeks resolution',
        '   - P3/Low: 1 week acknowledgment, backlog',
        '',
        '6. Setup TRIAGE MEETINGS:',
        '   - Daily quick triage (15 min)',
        '   - Weekly comprehensive review (1 hour)',
        '   - Participants: PM, Eng Lead, QA, Design',
        '',
        '7. Create DECISION FRAMEWORK:',
        '   - Must fix for launch: P0 and P1 issues',
        '   - Nice to fix: High-frequency P2 issues',
        '   - Post-launch backlog: All other issues',
        '   - Won\'t fix: Out of scope, edge cases, strategic misalignment',
        '',
        '8. Plan ITERATION CYCLES:',
        '   - Sprint planning with beta feedback',
        '   - Mid-beta bug bash',
        '   - Pre-launch bug fixing sprint',
        '',
        '9. Define COMMUNICATION BACK TO PARTICIPANTS:',
        '   - Acknowledge all reported issues',
        '   - Share what\'s being fixed',
        '   - Explain what won\'t be fixed and why',
        '   - Celebrate contributors',
        '',
        '10. Document prioritization framework',
        '11. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with prioritization framework'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criteria', 'severityLevels', 'triageProcess', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        issueCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              subcategories: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        severityLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              label: { type: 'string' },
              definition: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        triageProcess: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' },
              output: { type: 'string' }
            }
          }
        },
        responseSLAs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              acknowledgmentSLA: { type: 'string' },
              resolutionSLA: { type: 'string' }
            }
          }
        },
        triageMeetings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        decisionFramework: {
          type: 'object',
          properties: {
            mustFix: { type: 'array', items: { type: 'string' } },
            niceToFix: { type: 'array', items: { type: 'string' } },
            postLaunch: { type: 'array', items: { type: 'string' } },
            wontFix: { type: 'array', items: { type: 'string' } }
          }
        },
        iterationCycles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycle: { type: 'string' },
              timing: { type: 'string' },
              focus: { type: 'string' }
            }
          }
        },
        participantCommunication: {
          type: 'object',
          properties: {
            acknowledgmentProcess: { type: 'string' },
            updateFrequency: { type: 'string' },
            channels: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'beta-program', 'prioritization']
}));

// Phase 14: Plan Beta Closeout
export const planBetaCloseoutTask = defineTask('plan-beta-closeout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Plan Beta Closeout and Rewards - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Community Manager',
      task: 'Plan beta program closeout activities, participant recognition, and rewards program',
      context: {
        featureName: args.featureName,
        targetParticipants: args.targetParticipants,
        rewardProgram: args.rewardProgram,
        planningResult: args.planningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Plan CLOSEOUT TIMELINE:',
        '   - T-7 days: Final survey launch',
        '   - T-3 days: Thank you communications',
        '   - T-1 day: Rewards announcement',
        '   - Day 0: Beta program officially ends',
        '   - T+7 days: Launch announcement to participants',
        '   - T+14 days: Impact summary shared',
        '',
        '2. Design FINAL SURVEY:',
        '   - Overall satisfaction (NPS)',
        '   - Feature usability rating',
        '   - Value proposition validation',
        '   - Likelihood to use at launch',
        '   - Open-ended: What worked well?',
        '   - Open-ended: What could be improved?',
        '   - Would you participate in future betas?',
        '',
        '3. Create THANK YOU COMMUNICATIONS:',
        '   - Personal thank you email from PM',
        '   - Public recognition (with permission)',
        '   - Community spotlight',
        '   - Social media shoutout',
        '',
        '4. Plan REWARDS PROGRAM (if applicable):',
        '   - Tiered rewards based on engagement:',
        '     - Bronze: Logged in, minimal feedback',
        '     - Silver: Active participation, regular feedback',
        '     - Gold: Power user, interviews, high-quality feedback',
        '   - Reward types:',
        '     - Account credits or discounts',
        '     - Exclusive swag',
        '     - Early access to future features',
        '     - Recognition badges',
        '     - Certificate of appreciation',
        '     - Entry to beta alumni program',
        '',
        '5. Design RECOGNITION PROGRAM:',
        '   - Beta participant badge in-app',
        '   - LinkedIn recommendation offer',
        '   - Reference/testimonial request',
        '   - Case study opportunity (with consent)',
        '   - Beta alumni community access',
        '',
        '6. Plan IMPACT SHARING:',
        '   - Summary of feedback incorporated',
        '   - Number of bugs fixed',
        '   - Feature improvements made',
        '   - Individual participant impact highlights',
        '   - Product launch announcement',
        '',
        '7. Create TRANSITION PLAN:',
        '   - Beta access removal (if applicable)',
        '   - Production access provisioning',
        '   - Data migration (if needed)',
        '   - Support transition',
        '',
        '8. Plan FUTURE ENGAGEMENT:',
        '   - Beta alumni program',
        '   - Customer advisory board invitation',
        '   - Future beta program priority',
        '   - Community ambassador program',
        '',
        '9. Conduct RETROSPECTIVE:',
        '   - What went well?',
        '   - What could be improved?',
        '   - Lessons learned',
        '   - Best practices to document',
        '',
        '10. Document closeout plan',
        '11. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with closeout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'activities', 'recognitionPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timing: { type: 'string' },
              activity: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        finalSurvey: {
          type: 'object',
          properties: {
            launchDate: { type: 'string' },
            questions: { type: 'array', items: { type: 'string' } },
            expectedResponseRate: { type: 'number' }
          }
        },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              timing: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        thankYouCommunications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              message: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        rewardsProgram: {
          type: 'object',
          properties: {
            tiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tier: { type: 'string' },
                  criteria: { type: 'string' },
                  rewards: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            distributionProcess: { type: 'string' }
          }
        },
        recognitionPlan: {
          type: 'object',
          properties: {
            recognitionTypes: { type: 'array', items: { type: 'string' } },
            publicRecognition: { type: 'boolean' },
            badges: { type: 'array', items: { type: 'string' } }
          }
        },
        impactSharing: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            communicationPlan: { type: 'string' },
            individualHighlights: { type: 'boolean' }
          }
        },
        transitionPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              timing: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        futureEngagement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              program: { type: 'string' },
              description: { type: 'string' },
              eligibility: { type: 'string' }
            }
          }
        },
        retrospective: {
          type: 'object',
          properties: {
            scheduledDate: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            agenda: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'beta-program', 'closeout']
}));

// Phase 15: Create Launch Readiness Framework
export const createReadinessFrameworkTask = defineTask('create-readiness-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Create Launch Readiness Assessment Framework - ${args.featureName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Manager and Launch Coordinator',
      task: 'Create comprehensive launch readiness assessment framework based on beta program results',
      context: {
        featureName: args.featureName,
        betaObjectives: args.betaObjectives,
        successCriteria: args.successCriteria,
        analysisResult: args.analysisResult,
        prioritizationResult: args.prioritizationResult,
        phaseResults: args.phaseResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define LAUNCH READINESS CRITERIA:',
        '   - Product Quality:',
        '     - Zero P0/Critical bugs',
        '     - <3 P1/High bugs',
        '     - Acceptable performance metrics',
        '     - Usability score >4.0/5.0',
        '   - User Satisfaction:',
        '     - NPS >30',
        '     - CSAT >4.0/5.0',
        '     - >80% would use at launch',
        '   - Feature Validation:',
        '     - Core value proposition validated',
        '     - Key use cases working',
        '     - Adoption >70% of participants',
        '   - Feedback Quality:',
        '     - Positive feedback themes',
        '     - Manageable improvement backlog',
        '     - No fundamental concerns',
        '',
        '2. Create ASSESSMENT SCORECARD:',
        '   - Product Quality (30%)',
        '   - User Satisfaction (25%)',
        '   - Feature Validation (25%)',
        '   - Business Readiness (20%)',
        '   - Overall score >80 = Ready',
        '',
        '3. Define GO/NO-GO DECISION FRAMEWORK:',
        '   - GO: All criteria met, high confidence',
        '   - CONDITIONAL GO: Minor issues, acceptable risks',
        '   - DELAY: Significant gaps, need more work',
        '   - NO-GO: Fundamental problems, pivot needed',
        '',
        '4. Plan READINESS ASSESSMENT PROCESS:',
        '   - Data collection from beta program',
        '   - Quantitative metrics analysis',
        '   - Qualitative feedback synthesis',
        '   - Stakeholder alignment meeting',
        '   - Final decision and communication',
        '',
        '5. Create DECISION MAKING FRAMEWORK:',
        '   - Required approvers (PM, Eng, Leadership)',
        '   - Decision meeting agenda',
        '   - Criteria evaluation',
        '   - Risk assessment',
        '   - Final recommendation',
        '',
        '6. Plan POST-BETA ACTIONS:',
        '   - If GO: Launch planning kickoff',
        '   - If CONDITIONAL: Address gaps, set new date',
        '   - If DELAY: Major iteration, extended beta',
        '   - If NO-GO: Strategic reassessment',
        '',
        '7. Define SUCCESS CELEBRATION:',
        '   - Team recognition',
        '   - Participant appreciation',
        '   - Stakeholder communication',
        '   - Documentation of learnings',
        '',
        '8. Create LESSONS LEARNED CAPTURE:',
        '   - What worked in beta program?',
        '   - What could be improved?',
        '   - Best practices to replicate',
        '   - Template updates for future betas',
        '',
        '9. Document launch readiness framework',
        '10. Save artifacts to output directory'
      ],
      outputFormat: 'JSON object with launch readiness framework'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criteria', 'assessmentFramework', 'frameworkPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              category: { type: 'string' },
              threshold: { type: 'string' },
              weight: { type: 'number' },
              measurement: { type: 'string' }
            }
          }
        },
        scorecard: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  weight: { type: 'number' },
                  criteria: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            passingScore: { type: 'number' }
          }
        },
        decisionFramework: {
          type: 'object',
          properties: {
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  decision: { type: 'string' },
                  conditions: { type: 'array', items: { type: 'string' } },
                  actions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        assessmentProcess: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        assessmentFramework: {
          type: 'object',
          properties: {
            dataCollection: { type: 'array', items: { type: 'string' } },
            analysisMethod: { type: 'string' },
            decisionMakers: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' }
          }
        },
        decisionMaking: {
          type: 'object',
          properties: {
            approvers: { type: 'array', items: { type: 'string' } },
            meetingAgenda: { type: 'array', items: { type: 'string' } },
            evaluationCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        postBetaActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' }
            }
          }
        },
        lessonsLearned: {
          type: 'object',
          properties: {
            captureProcess: { type: 'string' },
            documentation: { type: 'array', items: { type: 'string' } },
            sharing: { type: 'string' }
          }
        },
        preliminaryReadiness: { type: 'boolean', description: 'Preliminary readiness based on planning' },
        frameworkPath: { type: 'string', description: 'Path to readiness framework JSON' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'beta-program', 'launch-readiness']
}));
