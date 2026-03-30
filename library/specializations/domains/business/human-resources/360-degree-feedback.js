/**
 * @process specializations/domains/business/human-resources/360-degree-feedback
 * @description 360-Degree Feedback Implementation Process - Multi-rater feedback process design and execution gathering
 * input from managers, peers, direct reports, and stakeholders for leadership development and performance insight.
 * @inputs { organizationName: string, targetPopulation: string, feedbackPurpose: string, raterGroups: array }
 * @outputs { success: boolean, participantsAssessed: number, responseRate: number, feedbackReports: array, developmentInsights: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/360-degree-feedback', {
 *   organizationName: 'TechCorp',
 *   targetPopulation: 'People Managers',
 *   feedbackPurpose: 'Leadership Development',
 *   raterGroups: ['manager', 'peers', 'direct-reports', 'stakeholders']
 * });
 *
 * @references
 * - CCL 360 Feedback: https://www.ccl.org/articles/leading-effectively-articles/360-degree-feedback/
 * - SHRM 360 Feedback: https://www.shrm.org/resourcesandtools/hr-topics/employee-relations/pages/360degreefeedback.aspx
 * - Harvard Business Review: https://hbr.org/2019/03/getting-360-degree-reviews-right
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    targetPopulation,
    feedbackPurpose = 'development', // 'development', 'performance', 'succession'
    raterGroups = ['manager', 'peers', 'direct-reports'],
    competencyModel = null,
    anonymityThreshold = 3,
    includeCoaching = true,
    outputDir = '360-feedback-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting 360-Degree Feedback Implementation for ${organizationName}`);

  // Phase 1: Program Design
  const programDesign = await ctx.task(programDesignTask, {
    organizationName,
    targetPopulation,
    feedbackPurpose,
    raterGroups,
    competencyModel,
    anonymityThreshold,
    outputDir
  });

  artifacts.push(...programDesign.artifacts);

  await ctx.breakpoint({
    question: `360 feedback program designed for ${targetPopulation}. ${programDesign.competencies.length} competencies selected. Review program design?`,
    title: '360 Program Design Review',
    context: {
      runId: ctx.runId,
      competencies: programDesign.competencies,
      raterGroups: programDesign.raterGroups,
      timeline: programDesign.timeline,
      files: programDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Survey Instrument Development
  const surveyDevelopment = await ctx.task(surveyDevelopmentTask, {
    organizationName,
    competencies: programDesign.competencies,
    raterGroups: programDesign.raterGroups,
    anonymityThreshold,
    outputDir
  });

  artifacts.push(...surveyDevelopment.artifacts);

  // Phase 3: Participant Selection
  const participantSelection = await ctx.task(participantSelectionTask, {
    organizationName,
    targetPopulation,
    outputDir
  });

  artifacts.push(...participantSelection.artifacts);

  // Phase 4: Rater Nomination
  const raterNomination = await ctx.task(raterNominationTask, {
    organizationName,
    participants: participantSelection.participants,
    raterGroups: programDesign.raterGroups,
    anonymityThreshold,
    outputDir
  });

  artifacts.push(...raterNomination.artifacts);

  await ctx.breakpoint({
    question: `Rater nominations complete. ${raterNomination.totalRaters} raters nominated for ${participantSelection.participants.length} participants. Review and approve rater lists?`,
    title: 'Rater Nomination Review',
    context: {
      runId: ctx.runId,
      totalRaters: raterNomination.totalRaters,
      averageRatersPerParticipant: raterNomination.averageRatersPerParticipant,
      raterDistribution: raterNomination.raterDistribution,
      files: raterNomination.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Communication and Launch
  const launchCommunication = await ctx.task(launchCommunicationTask, {
    organizationName,
    participants: participantSelection.participants,
    raters: raterNomination.raters,
    feedbackPurpose,
    timeline: programDesign.timeline,
    outputDir
  });

  artifacts.push(...launchCommunication.artifacts);

  // Phase 6: Survey Administration
  const surveyAdministration = await ctx.task(surveyAdministrationTask, {
    organizationName,
    participants: participantSelection.participants,
    raters: raterNomination.raters,
    survey: surveyDevelopment.survey,
    timeline: programDesign.timeline,
    outputDir
  });

  artifacts.push(...surveyAdministration.artifacts);

  ctx.log('info', `Survey response rate: ${surveyAdministration.responseRate}%`);

  // Phase 7: Data Analysis and Report Generation
  const reportGeneration = await ctx.task(reportGenerationTask, {
    organizationName,
    participants: participantSelection.participants,
    surveyResponses: surveyAdministration.responses,
    competencies: programDesign.competencies,
    anonymityThreshold,
    outputDir
  });

  artifacts.push(...reportGeneration.artifacts);

  // Phase 8: Report Review and Quality Check
  const reportQualityCheck = await ctx.task(reportQualityCheckTask, {
    organizationName,
    reports: reportGeneration.reports,
    anonymityThreshold,
    outputDir
  });

  artifacts.push(...reportQualityCheck.artifacts);

  await ctx.breakpoint({
    question: `${reportQualityCheck.reportsReady} feedback reports ready for delivery. ${reportQualityCheck.flaggedReports} reports flagged for review. Approve reports for delivery?`,
    title: 'Report Quality Review',
    context: {
      runId: ctx.runId,
      reportsReady: reportQualityCheck.reportsReady,
      flaggedReports: reportQualityCheck.flaggedReports,
      qualityIssues: reportQualityCheck.qualityIssues,
      files: reportQualityCheck.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Feedback Debrief Preparation
  let coachingPrep = null;
  if (includeCoaching) {
    coachingPrep = await ctx.task(coachingPrepTask, {
      organizationName,
      reports: reportGeneration.reports,
      feedbackPurpose,
      outputDir
    });

    artifacts.push(...coachingPrep.artifacts);
  }

  // Phase 10: Report Delivery and Debrief Sessions
  const reportDelivery = await ctx.task(reportDeliveryTask, {
    organizationName,
    participants: participantSelection.participants,
    reports: reportGeneration.reports,
    includeCoaching,
    coachingPrep: coachingPrep?.preparation,
    outputDir
  });

  artifacts.push(...reportDelivery.artifacts);

  // Phase 11: Development Action Planning
  const developmentPlanning = await ctx.task(developmentPlanningTask, {
    organizationName,
    participants: participantSelection.participants,
    reports: reportGeneration.reports,
    debriefSessions: reportDelivery.debriefSessions,
    outputDir
  });

  artifacts.push(...developmentPlanning.artifacts);

  // Phase 12: Program Evaluation and Analytics
  const programEvaluation = await ctx.task(programEvaluationTask, {
    organizationName,
    participants: participantSelection.participants,
    surveyAdministration,
    reportGeneration,
    reportDelivery,
    developmentPlanning,
    outputDir
  });

  artifacts.push(...programEvaluation.artifacts);

  return {
    success: true,
    organizationName,
    targetPopulation,
    feedbackPurpose,
    participantsAssessed: participantSelection.participants.length,
    totalRaters: raterNomination.totalRaters,
    responseRate: surveyAdministration.responseRate,
    feedbackReports: reportGeneration.reports.length,
    reportsDelivered: reportDelivery.deliveredCount,
    developmentInsights: {
      topStrengths: reportGeneration.aggregateInsights.topStrengths,
      developmentAreas: reportGeneration.aggregateInsights.developmentAreas,
      actionPlansCreated: developmentPlanning.plansCreated
    },
    programMetrics: programEvaluation.metrics,
    recommendations: programEvaluation.recommendations,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/360-degree-feedback',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Program Design - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: '360 Feedback Program Designer',
      task: 'Design 360-degree feedback program',
      context: {
        organizationName: args.organizationName,
        targetPopulation: args.targetPopulation,
        feedbackPurpose: args.feedbackPurpose,
        raterGroups: args.raterGroups,
        competencyModel: args.competencyModel,
        anonymityThreshold: args.anonymityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define program objectives',
        '2. Select competency framework',
        '3. Define rater categories',
        '4. Set anonymity rules',
        '5. Establish timeline',
        '6. Define success metrics',
        '7. Plan communication strategy',
        '8. Design feedback report format',
        '9. Plan debrief approach',
        '10. Document program guidelines'
      ],
      outputFormat: 'JSON object with program design'
    },
    outputSchema: {
      type: 'object',
      required: ['competencies', 'raterGroups', 'timeline', 'artifacts'],
      properties: {
        competencies: { type: 'array', items: { type: 'object' } },
        raterGroups: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        anonymityRules: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        reportFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'program-design']
}));

export const surveyDevelopmentTask = defineTask('survey-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Survey Development - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Survey Design Specialist',
      task: 'Develop 360 feedback survey instrument',
      context: {
        organizationName: args.organizationName,
        competencies: args.competencies,
        raterGroups: args.raterGroups,
        anonymityThreshold: args.anonymityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create behavioral indicators for each competency',
        '2. Write survey questions',
        '3. Design rating scale',
        '4. Add open-ended questions',
        '5. Create rater-specific variations',
        '6. Design self-assessment version',
        '7. Set up survey logic',
        '8. Test survey instrument',
        '9. Calculate expected completion time',
        '10. Create survey instructions'
      ],
      outputFormat: 'JSON object with survey instrument'
    },
    outputSchema: {
      type: 'object',
      required: ['survey', 'questions', 'artifacts'],
      properties: {
        survey: { type: 'object' },
        questions: { type: 'array', items: { type: 'object' } },
        ratingScale: { type: 'object' },
        openEndedQuestions: { type: 'array', items: { type: 'object' } },
        completionTime: { type: 'number' },
        instructions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'survey']
}));

export const participantSelectionTask = defineTask('participant-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Participant Selection - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Program Coordinator',
      task: 'Select and validate 360 feedback participants',
      context: {
        organizationName: args.organizationName,
        targetPopulation: args.targetPopulation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define participant criteria',
        '2. Generate participant list',
        '3. Validate eligibility',
        '4. Check tenure requirements',
        '5. Verify manager approval',
        '6. Handle exceptions',
        '7. Create participant profiles',
        '8. Set up in 360 platform',
        '9. Generate participant communications',
        '10. Document participant list'
      ],
      outputFormat: 'JSON object with participant selection'
    },
    outputSchema: {
      type: 'object',
      required: ['participants', 'artifacts'],
      properties: {
        participants: { type: 'array', items: { type: 'object' } },
        eligibilityCriteria: { type: 'object' },
        exceptions: { type: 'array', items: { type: 'object' } },
        participantProfiles: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'participants']
}));

export const raterNominationTask = defineTask('rater-nomination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Rater Nomination - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rater Coordination Specialist',
      task: 'Manage rater nomination process',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        raterGroups: args.raterGroups,
        anonymityThreshold: args.anonymityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define rater nomination guidelines',
        '2. Request participant nominations',
        '3. Validate rater nominations',
        '4. Check anonymity thresholds',
        '5. Add manager automatically',
        '6. Balance rater groups',
        '7. Handle nomination conflicts',
        '8. Approve final rater lists',
        '9. Set up rater assignments',
        '10. Generate rater communications'
      ],
      outputFormat: 'JSON object with rater nominations'
    },
    outputSchema: {
      type: 'object',
      required: ['raters', 'totalRaters', 'averageRatersPerParticipant', 'artifacts'],
      properties: {
        raters: { type: 'object' },
        totalRaters: { type: 'number' },
        averageRatersPerParticipant: { type: 'number' },
        raterDistribution: { type: 'object' },
        anonymityFlags: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'raters']
}));

export const launchCommunicationTask = defineTask('launch-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Launch Communication - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Internal Communications Specialist',
      task: 'Launch 360 feedback program communications',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        raters: args.raters,
        feedbackPurpose: args.feedbackPurpose,
        timeline: args.timeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create program announcement',
        '2. Send participant welcome emails',
        '3. Send rater invitation emails',
        '4. Create FAQ document',
        '5. Prepare manager communications',
        '6. Plan reminder schedule',
        '7. Set up support channels',
        '8. Create confidentiality statement',
        '9. Launch program',
        '10. Track communication delivery'
      ],
      outputFormat: 'JSON object with launch communication details'
    },
    outputSchema: {
      type: 'object',
      required: ['launched', 'communications', 'artifacts'],
      properties: {
        launched: { type: 'boolean' },
        communications: { type: 'array', items: { type: 'object' } },
        reminderSchedule: { type: 'array', items: { type: 'object' } },
        faq: { type: 'object' },
        supportChannels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'communication']
}));

export const surveyAdministrationTask = defineTask('survey-administration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Survey Administration - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: '360 Survey Administrator',
      task: 'Administer 360 feedback survey collection',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        raters: args.raters,
        survey: args.survey,
        timeline: args.timeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Open survey window',
        '2. Send survey invitations',
        '3. Track response rates daily',
        '4. Send reminder emails',
        '5. Handle technical issues',
        '6. Manage survey extensions',
        '7. Monitor completion quality',
        '8. Close survey window',
        '9. Validate response data',
        '10. Generate response report'
      ],
      outputFormat: 'JSON object with survey administration results'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'responseRate', 'artifacts'],
      properties: {
        responses: { type: 'object' },
        responseRate: { type: 'number' },
        responseRateByGroup: { type: 'object' },
        completionTimeline: { type: 'array', items: { type: 'object' } },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'administration']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Report Generation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: '360 Report Analyst',
      task: 'Generate individual 360 feedback reports',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        surveyResponses: args.surveyResponses,
        competencies: args.competencies,
        anonymityThreshold: args.anonymityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate rater responses',
        '2. Apply anonymity protections',
        '3. Calculate competency scores',
        '4. Generate visual charts',
        '5. Identify strengths and development areas',
        '6. Compare self vs. others ratings',
        '7. Include verbatim comments (anonymized)',
        '8. Generate executive summary',
        '9. Create comparison benchmarks',
        '10. Generate aggregate insights'
      ],
      outputFormat: 'JSON object with generated reports'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'aggregateInsights', 'artifacts'],
      properties: {
        reports: { type: 'array', items: { type: 'object' } },
        aggregateInsights: {
          type: 'object',
          properties: {
            topStrengths: { type: 'array', items: { type: 'string' } },
            developmentAreas: { type: 'array', items: { type: 'string' } }
          }
        },
        benchmarks: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'reports']
}));

export const reportQualityCheckTask = defineTask('report-quality-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Report Quality Check - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Specialist',
      task: 'Review and validate 360 feedback reports',
      context: {
        organizationName: args.organizationName,
        reports: args.reports,
        anonymityThreshold: args.anonymityThreshold,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify anonymity protection',
        '2. Check data accuracy',
        '3. Review calculation correctness',
        '4. Validate chart generation',
        '5. Check comment appropriateness',
        '6. Flag concerning content',
        '7. Verify report completeness',
        '8. Review extreme ratings',
        '9. Approve reports for delivery',
        '10. Document quality issues'
      ],
      outputFormat: 'JSON object with quality check results'
    },
    outputSchema: {
      type: 'object',
      required: ['reportsReady', 'flaggedReports', 'artifacts'],
      properties: {
        reportsReady: { type: 'number' },
        flaggedReports: { type: 'number' },
        qualityIssues: { type: 'array', items: { type: 'object' } },
        approvedReports: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'quality']
}));

export const coachingPrepTask = defineTask('coaching-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Coaching Preparation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Executive Coach',
      task: 'Prepare coaching debrief materials',
      context: {
        organizationName: args.organizationName,
        reports: args.reports,
        feedbackPurpose: args.feedbackPurpose,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review individual reports',
        '2. Identify coaching themes',
        '3. Prepare debrief questions',
        '4. Create interpretation guides',
        '5. Plan difficult feedback delivery',
        '6. Prepare development suggestions',
        '7. Create coaching session agendas',
        '8. Train internal coaches',
        '9. Assign coaches to participants',
        '10. Schedule debrief sessions'
      ],
      outputFormat: 'JSON object with coaching preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['preparation', 'artifacts'],
      properties: {
        preparation: { type: 'object' },
        coachingThemes: { type: 'array', items: { type: 'object' } },
        debriefQuestions: { type: 'array', items: { type: 'string' } },
        interpretationGuide: { type: 'object' },
        coachAssignments: { type: 'object' },
        sessionAgendas: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'coaching']
}));

export const reportDeliveryTask = defineTask('report-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Report Delivery - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Feedback Delivery Coordinator',
      task: 'Deliver 360 feedback reports and conduct debriefs',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        reports: args.reports,
        includeCoaching: args.includeCoaching,
        coachingPrep: args.coachingPrep,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare report delivery communications',
        '2. Share reports with participants',
        '3. Schedule debrief sessions',
        '4. Conduct individual debriefs',
        '5. Facilitate feedback interpretation',
        '6. Answer participant questions',
        '7. Track debrief completion',
        '8. Collect debrief feedback',
        '9. Document action commitments',
        '10. Provide follow-up resources'
      ],
      outputFormat: 'JSON object with report delivery results'
    },
    outputSchema: {
      type: 'object',
      required: ['deliveredCount', 'debriefSessions', 'artifacts'],
      properties: {
        deliveredCount: { type: 'number' },
        debriefSessions: { type: 'array', items: { type: 'object' } },
        debriefCompletionRate: { type: 'number' },
        participantFeedback: { type: 'object' },
        actionCommitments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'delivery']
}));

export const developmentPlanningTask = defineTask('development-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Development Planning - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Development Planning Specialist',
      task: 'Support development action planning from 360 feedback',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        reports: args.reports,
        debriefSessions: args.debriefSessions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create development plan templates',
        '2. Guide goal setting from feedback',
        '3. Recommend development activities',
        '4. Connect to learning resources',
        '5. Facilitate manager conversations',
        '6. Track plan creation',
        '7. Schedule follow-up check-ins',
        '8. Integrate with performance goals',
        '9. Create accountability mechanisms',
        '10. Document development commitments'
      ],
      outputFormat: 'JSON object with development planning results'
    },
    outputSchema: {
      type: 'object',
      required: ['plansCreated', 'artifacts'],
      properties: {
        plansCreated: { type: 'number' },
        developmentGoals: { type: 'array', items: { type: 'object' } },
        recommendedActivities: { type: 'object' },
        learningResources: { type: 'array', items: { type: 'object' } },
        checkInSchedule: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'development']
}));

export const programEvaluationTask = defineTask('program-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Program Evaluation - ${args.organizationName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Analytics Specialist',
      task: 'Evaluate 360 feedback program effectiveness',
      context: {
        organizationName: args.organizationName,
        participants: args.participants,
        surveyAdministration: args.surveyAdministration,
        reportGeneration: args.reportGeneration,
        reportDelivery: args.reportDelivery,
        developmentPlanning: args.developmentPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate program metrics',
        '2. Analyze response rates',
        '3. Evaluate report quality',
        '4. Measure participant satisfaction',
        '5. Assess development plan adoption',
        '6. Compare to benchmarks',
        '7. Identify program improvements',
        '8. Calculate program ROI',
        '9. Generate executive summary',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON object with program evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'recommendations', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        participantSatisfaction: { type: 'number' },
        programEffectiveness: { type: 'number' },
        benchmarkComparison: { type: 'object' },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        roi: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', '360-feedback', 'evaluation']
}));
