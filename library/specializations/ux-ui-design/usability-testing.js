/**
 * @process specializations/ux-ui-design/usability-testing
 * @description Comprehensive Usability Testing process for evaluating product usability through test planning,
 * participant recruitment, task scenario design, moderated/unmoderated testing, think-aloud protocol,
 * observation & recording, success metrics analysis, findings synthesis, and prioritized recommendations.
 * @inputs { projectName: string, productType: string, testingGoals: array, prototypeFidelity: string, participantCount?: number, testingType?: string, outputDir?: string }
 * @outputs { success: boolean, testResults: object, usabilityScore: number, findings: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/usability-testing', {
 *   projectName: 'Mobile Banking App',
 *   productType: 'mobile-app',
 *   testingGoals: ['Evaluate account transfer flow', 'Test bill payment usability', 'Assess navigation clarity'],
 *   prototypeFidelity: 'high-fidelity',
 *   participantCount: 8,
 *   testingType: 'moderated'
 * });
 *
 * @references
 * - Usability Testing 101: https://www.nngroup.com/articles/usability-testing-101/
 * - Think-Aloud Protocol: https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/
 * - System Usability Scale (SUS): https://www.usability.gov/how-to-and-tools/methods/system-usability-scale.html
 * - Task Success Rate: https://measuringu.com/task-completion/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productType,
    testingGoals = [],
    prototypeFidelity = 'high-fidelity',
    participantCount = 8,
    testingType = 'moderated',
    outputDir = 'usability-testing-output',
    minimumUsabilityScore = 68,
    includeAccessibilityTesting = false,
    targetTaskSuccessRate = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Usability Testing for ${projectName}`);

  // ============================================================================
  // PHASE 1: TEST PLANNING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning usability test approach and objectives');
  const testPlan = await ctx.task(testPlanningTask, {
    projectName,
    productType,
    testingGoals,
    prototypeFidelity,
    participantCount,
    testingType,
    includeAccessibilityTesting,
    targetTaskSuccessRate,
    outputDir
  });

  artifacts.push(...testPlan.artifacts);

  // Quality Gate: Test plan must be comprehensive
  if (!testPlan.planApproved) {
    ctx.log('warn', 'Test plan needs refinement before proceeding');
    return {
      success: false,
      reason: 'Test plan quality insufficient',
      recommendations: testPlan.recommendations,
      metadata: {
        processId: 'specializations/ux-ui-design/usability-testing',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: PARTICIPANT RECRUITMENT AND SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 2: Recruiting and screening test participants');
  const participantRecruitment = await ctx.task(participantRecruitmentTask, {
    projectName,
    participantCriteria: testPlan.participantCriteria,
    participantCount,
    screenerQuestions: testPlan.screenerQuestions,
    testingType,
    incentiveAmount: testPlan.incentiveAmount,
    outputDir
  });

  artifacts.push(...participantRecruitment.artifacts);

  // ============================================================================
  // PHASE 3: TASK SCENARIO DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing realistic task scenarios and success criteria');
  const taskScenarios = await ctx.task(taskScenarioDesignTask, {
    projectName,
    productType,
    testingGoals: testPlan.refinedTestingGoals,
    prototypeFidelity,
    participantProfiles: participantRecruitment.participantProfiles,
    targetTaskSuccessRate,
    outputDir
  });

  artifacts.push(...taskScenarios.artifacts);

  // ============================================================================
  // PHASE 4: TEST PROTOCOL AND MATERIALS PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Preparing test protocol, scripts, and materials');
  const testProtocol = await ctx.task(testProtocolPreparationTask, {
    projectName,
    testingType,
    taskScenarios: taskScenarios.scenarios,
    testingGoals: testPlan.refinedTestingGoals,
    includeAccessibilityTesting,
    outputDir
  });

  artifacts.push(...testProtocol.artifacts);

  // ============================================================================
  // PHASE 5: PILOT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting pilot test to validate test setup');
  const pilotTest = await ctx.task(pilotTestingTask, {
    projectName,
    testProtocol,
    taskScenarios: taskScenarios.scenarios,
    testingType,
    outputDir
  });

  artifacts.push(...pilotTest.artifacts);

  // Breakpoint: Review pilot test results
  await ctx.breakpoint({
    question: `Pilot test complete. ${pilotTest.issuesFound} issues identified. Review pilot findings and approve test protocol?`,
    title: 'Pilot Test Review',
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
        testingType,
        participantsRecruited: participantRecruitment.confirmedParticipants.length,
        taskCount: taskScenarios.scenarios.length,
        pilotIssues: pilotTest.issuesFound,
        adjustmentsMade: pilotTest.adjustmentsMade
      }
    }
  });

  // ============================================================================
  // PHASE 6: MODERATED USABILITY TESTING SESSIONS
  // ============================================================================

  let moderatedResults = null;
  if (testingType === 'moderated' || testingType === 'hybrid') {
    ctx.log('info', 'Phase 6: Conducting moderated usability testing sessions');

    // Run test sessions in parallel for efficiency (simulated concurrent sessions)
    const moderatedSessionResults = await ctx.parallel.all(
      participantRecruitment.confirmedParticipants
        .filter(p => p.testingType === 'moderated')
        .slice(0, Math.ceil(participantCount / (testingType === 'hybrid' ? 2 : 1)))
        .map((participant, index) =>
          () => ctx.task(moderatedTestingSessionTask, {
            projectName,
            sessionNumber: index + 1,
            participant,
            testProtocol,
            taskScenarios: taskScenarios.scenarios,
            thinkAloudProtocol: testProtocol.thinkAloudInstructions,
            outputDir
          })
        )
    );

    moderatedResults = {
      sessionCount: moderatedSessionResults.length,
      sessions: moderatedSessionResults
    };

    moderatedSessionResults.forEach(result => {
      artifacts.push(...(result.artifacts || []));
    });
  }

  // ============================================================================
  // PHASE 7: UNMODERATED USABILITY TESTING
  // ============================================================================

  let unmoderatedResults = null;
  if (testingType === 'unmoderated' || testingType === 'hybrid') {
    ctx.log('info', 'Phase 7: Conducting unmoderated remote usability testing');

    unmoderatedResults = await ctx.task(unmoderatedTestingTask, {
      projectName,
      participants: participantRecruitment.confirmedParticipants
        .filter(p => !p.testingType || p.testingType === 'unmoderated'),
      testProtocol,
      taskScenarios: taskScenarios.scenarios,
      outputDir
    });

    artifacts.push(...unmoderatedResults.artifacts);
  }

  // ============================================================================
  // PHASE 8: OBSERVATION DATA SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing observation data and user behaviors');
  const observationSynthesis = await ctx.task(observationSynthesisTask, {
    projectName,
    moderatedResults,
    unmoderatedResults,
    taskScenarios: taskScenarios.scenarios,
    testingGoals: testPlan.refinedTestingGoals,
    outputDir
  });

  artifacts.push(...observationSynthesis.artifacts);

  // ============================================================================
  // PHASE 9: SUCCESS METRICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing success metrics and quantitative data');
  const metricsAnalysis = await ctx.task(successMetricsAnalysisTask, {
    projectName,
    moderatedResults,
    unmoderatedResults,
    taskScenarios: taskScenarios.scenarios,
    targetTaskSuccessRate,
    observationSynthesis,
    outputDir
  });

  artifacts.push(...metricsAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: USABILITY ISSUES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Identifying and categorizing usability issues');
  const issueIdentification = await ctx.task(issueIdentificationTask, {
    projectName,
    observationSynthesis,
    metricsAnalysis,
    taskScenarios: taskScenarios.scenarios,
    testingGoals: testPlan.refinedTestingGoals,
    outputDir
  });

  artifacts.push(...issueIdentification.artifacts);

  // ============================================================================
  // PHASE 11: FINDINGS SYNTHESIS AND INSIGHTS
  // ============================================================================

  ctx.log('info', 'Phase 11: Synthesizing findings and generating insights');
  const findingsSynthesis = await ctx.task(findingsSynthesisTask, {
    projectName,
    observationSynthesis,
    metricsAnalysis,
    issueIdentification,
    testingGoals: testPlan.refinedTestingGoals,
    outputDir
  });

  artifacts.push(...findingsSynthesis.artifacts);

  // ============================================================================
  // PHASE 12: USABILITY SCORING (SUS)
  // ============================================================================

  ctx.log('info', 'Phase 12: Calculating System Usability Scale (SUS) score');
  const usabilityScoring = await ctx.task(usabilityScoringTask, {
    projectName,
    moderatedResults,
    unmoderatedResults,
    metricsAnalysis,
    minimumUsabilityScore,
    outputDir
  });

  artifacts.push(...usabilityScoring.artifacts);

  const usabilityScore = usabilityScoring.susScore;
  const usabilityGrade = usabilityScoring.grade;
  const passedThreshold = usabilityScore >= minimumUsabilityScore;

  // ============================================================================
  // PHASE 13: PRIORITIZED RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating prioritized recommendations for improvements');
  const recommendations = await ctx.task(recommendationsGenerationTask, {
    projectName,
    issueIdentification,
    findingsSynthesis,
    metricsAnalysis,
    usabilityScore,
    testingGoals: testPlan.refinedTestingGoals,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 14: ACCESSIBILITY FINDINGS (if applicable)
  // ============================================================================

  let accessibilityFindings = null;
  if (includeAccessibilityTesting) {
    ctx.log('info', 'Phase 14: Analyzing accessibility findings');
    accessibilityFindings = await ctx.task(accessibilityAnalysisTask, {
      projectName,
      moderatedResults,
      observationSynthesis,
      issueIdentification,
      outputDir
    });
    artifacts.push(...accessibilityFindings.artifacts);
  }

  // ============================================================================
  // PHASE 15: USABILITY TEST REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive usability test report');
  const testReport = await ctx.task(testReportGenerationTask, {
    projectName,
    testPlan,
    participantRecruitment,
    taskScenarios,
    moderatedResults,
    unmoderatedResults,
    observationSynthesis,
    metricsAnalysis,
    issueIdentification,
    findingsSynthesis,
    usabilityScoring,
    recommendations,
    accessibilityFindings,
    outputDir
  });

  artifacts.push(...testReport.artifacts);

  // Final Breakpoint: Test Results Review
  await ctx.breakpoint({
    question: `Usability Testing complete for ${projectName}. SUS Score: ${usabilityScore}/100 (${usabilityGrade}). ${issueIdentification.criticalIssues.length} critical issues found. Review results and approve report?`,
    title: 'Usability Test Results Review',
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
        usabilityScore,
        usabilityGrade,
        passedThreshold,
        participantCount: (moderatedResults?.sessionCount || 0) + (unmoderatedResults?.participantCount || 0),
        taskSuccessRate: metricsAnalysis.overallTaskSuccessRate,
        criticalIssues: issueIdentification.criticalIssues.length,
        totalIssues: issueIdentification.totalIssues,
        topRecommendations: recommendations.prioritizedRecommendations.slice(0, 3)
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    usabilityScore,
    usabilityGrade,
    passedThreshold,
    testPlan: {
      testingType: testPlan.testingType,
      testingGoals: testPlan.refinedTestingGoals,
      taskCount: taskScenarios.scenarios.length,
      estimatedDuration: testPlan.estimatedDuration
    },
    participants: {
      recruited: participantRecruitment.confirmedParticipants.length,
      target: participantCount,
      diversityScore: participantRecruitment.diversityScore,
      moderatedSessions: moderatedResults?.sessionCount || 0,
      unmoderatedSessions: unmoderatedResults?.participantCount || 0
    },
    testResults: {
      taskSuccessRate: metricsAnalysis.overallTaskSuccessRate,
      averageTimeOnTask: metricsAnalysis.averageTimeOnTask,
      averageErrorRate: metricsAnalysis.averageErrorRate,
      taskMetrics: metricsAnalysis.taskMetrics,
      satisfactionScore: metricsAnalysis.satisfactionScore
    },
    observations: {
      totalObservations: observationSynthesis.totalObservations,
      behavioralPatterns: observationSynthesis.behavioralPatterns,
      confusionPoints: observationSynthesis.confusionPoints.length,
      positiveObservations: observationSynthesis.positiveObservations.length
    },
    issues: {
      total: issueIdentification.totalIssues,
      critical: issueIdentification.criticalIssues.length,
      high: issueIdentification.highIssues.length,
      medium: issueIdentification.mediumIssues.length,
      low: issueIdentification.lowIssues.length,
      byCategory: issueIdentification.issuesByCategory
    },
    findings: {
      keyFindings: findingsSynthesis.keyFindings,
      insights: findingsSynthesis.insights,
      userExpectations: findingsSynthesis.userExpectations,
      mentalModelMismatches: findingsSynthesis.mentalModelMismatches
    },
    recommendations: {
      total: recommendations.recommendations.length,
      prioritized: recommendations.prioritizedRecommendations,
      quickWins: recommendations.quickWins,
      shortTerm: recommendations.shortTermImprovements,
      longTerm: recommendations.longTermImprovements
    },
    accessibility: accessibilityFindings ? {
      issuesFound: accessibilityFindings.issuesFound,
      wcagLevel: accessibilityFindings.wcagComplianceLevel,
      recommendations: accessibilityFindings.recommendations
    } : null,
    report: {
      reportPath: testReport.reportPath,
      executiveSummary: testReport.executiveSummary,
      videoHighlights: testReport.videoHighlights,
      presentationPath: testReport.presentationPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/usability-testing',
      timestamp: startTime,
      version: '1.0.0',
      projectName,
      productType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Test Planning
export const testPlanningTask = defineTask('test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan usability test approach and objectives',
  agent: {
    name: 'usability-test-planner',
    prompt: {
      role: 'Senior UX Researcher with expertise in usability testing methodologies and test planning',
      task: 'Develop comprehensive usability test plan with clear objectives, methods, and success criteria',
      context: args,
      instructions: [
        'Review and refine testing goals to be specific, measurable, and actionable',
        'Define what aspects of usability to evaluate: effectiveness, efficiency, satisfaction, learnability, errors',
        'Select appropriate testing approach based on product stage and fidelity:',
        '  - Moderated in-person: rich qualitative data, expensive, slower',
        '  - Moderated remote: flexible, good qualitative data, technical setup needed',
        '  - Unmoderated remote: scalable, quantitative focus, less contextual insight',
        '  - Hybrid: combines strengths of moderated and unmoderated',
        'Determine optimal participant count (5-8 for qualitative insights, 20+ for quantitative confidence)',
        'Define participant criteria: demographics, experience level, behaviors, screening requirements',
        'Estimate test session duration (45-90 minutes typical for moderated)',
        'Plan testing logistics: location/platform, equipment, recording setup, tools',
        'Define success metrics: task completion rate, time on task, errors, satisfaction',
        'Set target benchmarks (e.g., 80% task success rate, SUS score > 68)',
        'Create screening questions to identify qualified participants',
        'Determine appropriate incentive amount based on session length and complexity',
        'Identify risks and mitigation strategies',
        'Generate comprehensive test plan document'
      ],
      outputFormat: 'JSON with refinedTestingGoals (array), testingType, participantCriteria, screenerQuestions (array), successMetrics (object), targetBenchmarks (object), sessionDuration, logistics (object), incentiveAmount, estimatedDuration, risks (array), planApproved (boolean), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedTestingGoals', 'testingType', 'participantCriteria', 'planApproved', 'artifacts'],
      properties: {
        refinedTestingGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              rationale: { type: 'string' },
              measurementApproach: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        testingType: { type: 'string', enum: ['moderated', 'unmoderated', 'hybrid'] },
        participantCriteria: {
          type: 'object',
          properties: {
            demographics: {
              type: 'object',
              properties: {
                ageRange: { type: 'array', items: { type: 'string' } },
                techProficiency: { type: 'array', items: { type: 'string' } },
                productExperience: { type: 'string' }
              }
            },
            behavioralCriteria: { type: 'array', items: { type: 'string' } },
            exclusionCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        screenerQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string', enum: ['multiple-choice', 'yes-no', 'open-ended', 'rating'] },
              qualifyingAnswer: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        successMetrics: {
          type: 'object',
          properties: {
            taskCompletion: { type: 'boolean' },
            timeOnTask: { type: 'boolean' },
            errorRate: { type: 'boolean' },
            satisfaction: { type: 'boolean' },
            learnability: { type: 'boolean' }
          }
        },
        targetBenchmarks: {
          type: 'object',
          properties: {
            taskSuccessRate: { type: 'number' },
            susScore: { type: 'number' },
            averageErrorsPerTask: { type: 'number' },
            satisfactionRating: { type: 'number' }
          }
        },
        sessionDuration: { type: 'string' },
        logistics: {
          type: 'object',
          properties: {
            testingLocation: { type: 'string' },
            testingPlatform: { type: 'string' },
            recordingTools: { type: 'array', items: { type: 'string' } },
            equipmentNeeded: { type: 'array', items: { type: 'string' } }
          }
        },
        incentiveAmount: { type: 'string' },
        estimatedDuration: { type: 'string' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        planApproved: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'usability-testing', 'test-planning']
}));

// Task 2: Participant Recruitment
export const participantRecruitmentTask = defineTask('participant-recruitment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recruit and screen usability test participants',
  agent: {
    name: 'participant-recruiter',
    prompt: {
      role: 'UX Research Coordinator with expertise in participant recruitment and screening',
      task: 'Recruit qualified usability test participants matching criteria and schedule test sessions',
      context: args,
      instructions: [
        'Develop recruitment strategy: user panels, customer lists, social media, recruiting services',
        'Create recruitment messaging and outreach materials',
        'Apply screening questions to identify qualified participants',
        'Aim for diverse participant pool (age, gender, tech proficiency, experience level)',
        'Over-recruit by 20-25% to account for no-shows and cancellations',
        'For moderated testing: schedule sessions with buffer time between (15-30 min)',
        'For unmoderated testing: send test links and instructions with deadline',
        'Send confirmation emails with session details, location/platform, and incentive info',
        'Create participant profiles summarizing key characteristics',
        'Prepare consent forms and NDA documents if needed',
        'Track recruitment status and diversity metrics',
        'Generate recruitment summary and participant roster'
      ],
      outputFormat: 'JSON with confirmedParticipants (array), participantProfiles (array), diversityScore (0-100), scheduledSessions (array), recruitmentChannels (array), noShowMitigation (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedParticipants', 'participantProfiles', 'diversityScore', 'artifacts'],
      properties: {
        confirmedParticipants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              pseudonym: { type: 'string' },
              demographics: { type: 'object' },
              techProficiency: { type: 'string' },
              productExperience: { type: 'string' },
              sessionDateTime: { type: 'string' },
              testingType: { type: 'string', enum: ['moderated', 'unmoderated'] }
            }
          }
        },
        participantProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              profileType: { type: 'string' },
              count: { type: 'number' },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        diversityScore: { type: 'number', minimum: 0, maximum: 100 },
        scheduledSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              participantId: { type: 'string' },
              dateTime: { type: 'string' },
              moderator: { type: 'string' }
            }
          }
        },
        recruitmentChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              participantsRecruited: { type: 'number' },
              conversionRate: { type: 'string' }
            }
          }
        },
        noShowMitigation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'usability-testing', 'recruitment']
}));

// Task 3: Task Scenario Design
export const taskScenarioDesignTask = defineTask('task-scenario-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design realistic task scenarios with success criteria',
  agent: {
    name: 'task-scenario-designer',
    prompt: {
      role: 'UX Researcher with expertise in task analysis and scenario design',
      task: 'Create realistic, representative task scenarios that test key user flows and functionality',
      context: args,
      instructions: [
        'Design 5-8 task scenarios aligned with testing goals',
        'Write tasks as realistic scenarios with context and motivation (not just instructions)',
        'GOOD: "You want to send $50 to your friend Alex for dinner last night. Complete this transfer."',
        'BAD: "Click on Transfer, enter $50, and submit."',
        'Avoid giving away UI elements or navigation paths in task description',
        'Each task should test a specific user goal or workflow',
        'Order tasks from simple to complex (warm-up → main tasks → advanced tasks)',
        'Include task context: who, what, when, where, why',
        'Define clear success criteria for each task (task completed successfully, task completed with errors, task failed)',
        'Specify primary and alternate paths to success',
        'Define metrics to track: completion rate, time on task, errors, clicks/taps',
        'Estimate realistic time allowance for each task',
        'Include pre-task questions (expectations) and post-task questions (experience, difficulty, satisfaction)',
        'Design tasks to be independent (failure on one task should not block subsequent tasks)',
        'Generate task scenario document with success criteria and metrics'
      ],
      outputFormat: 'JSON with scenarios (array), estimatedTotalTime, taskOrderingRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'estimatedTotalTime', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              taskScenario: { type: 'string' },
              taskGoal: { type: 'string' },
              successCriteria: {
                type: 'object',
                properties: {
                  success: { type: 'string' },
                  successWithErrors: { type: 'string' },
                  failure: { type: 'string' }
                }
              },
              primaryPath: { type: 'array', items: { type: 'string' } },
              alternatePaths: { type: 'array', items: { type: 'array' } },
              metrics: {
                type: 'object',
                properties: {
                  completion: { type: 'boolean' },
                  timeOnTask: { type: 'boolean' },
                  errorCount: { type: 'boolean' },
                  pathDirectness: { type: 'boolean' }
                }
              },
              estimatedTime: { type: 'string' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              preTaskQuestions: { type: 'array', items: { type: 'string' } },
              postTaskQuestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    type: { type: 'string', enum: ['rating', 'open-ended', 'ease', 'satisfaction'] }
                  }
                }
              },
              relatedTestingGoals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedTotalTime: { type: 'string' },
        taskOrderingRationale: { type: 'string' },
        taskCoverage: {
          type: 'object',
          properties: {
            coverageByGoal: { type: 'object' },
            coverageByFeature: { type: 'object' }
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
  labels: ['agent', 'usability-testing', 'task-design']
}));

// Task 4: Test Protocol Preparation
export const testProtocolPreparationTask = defineTask('test-protocol-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare test protocol, scripts, and materials',
  agent: {
    name: 'test-protocol-designer',
    prompt: {
      role: 'UX Researcher with expertise in test moderation and protocol design',
      task: 'Create comprehensive test protocol including moderator script, think-aloud instructions, and data collection templates',
      context: args,
      instructions: [
        'Create moderator script for test sessions:',
        '  - Welcome and introduction (5 min): build rapport, explain process, review consent',
        '  - Background questions (5 min): demographic info, experience, expectations',
        '  - Think-aloud training (3 min): explain and practice thinking aloud',
        '  - Task administration: introduce each task, observe, take notes, avoid helping',
        '  - Post-task questions: difficulty, satisfaction, expectations vs reality',
        '  - Post-test questionnaire: System Usability Scale (SUS), overall impressions',
        '  - Debrief (5 min): final questions, thank participant',
        'Write think-aloud protocol instructions:',
        '  - "As you work through these tasks, please think out loud"',
        '  - "Tell me what you\'re thinking, what you\'re looking for, what you expect to happen"',
        '  - "There are no wrong answers - we\'re testing the design, not you"',
        '  - Practice example: "I\'m looking for... I expect this to... I\'m confused by..."',
        'Create observation checklist for note-takers:',
        '  - Task completion (success/partial/fail)',
        '  - Time on task, Errors made, Path taken',
        '  - Confusion points, Hesitations, Unexpected behaviors',
        '  - Verbal expressions (frustration, delight, confusion)',
        '  - Quotes and memorable moments',
        'Prepare System Usability Scale (SUS) questionnaire (10 standard questions)',
        'Create consent form and recording permission form',
        'For unmoderated testing: write clear task instructions and setup guide',
        'Prepare technical setup checklist (recording software, screen capture, equipment)',
        'Generate complete test protocol package'
      ],
      outputFormat: 'JSON with moderatorScript (object), thinkAloudInstructions (string), observationChecklist (array), susQuestionnaire (array), consentForms (array), unmoderatedInstructions (string), technicalChecklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['moderatorScript', 'thinkAloudInstructions', 'observationChecklist', 'artifacts'],
      properties: {
        moderatorScript: {
          type: 'object',
          properties: {
            welcome: { type: 'string' },
            introductionTalking Points: { type: 'array', items: { type: 'string' } },
            backgroundQuestions: { type: 'array', items: { type: 'string' } },
            thinkAloudTraining: { type: 'string' },
            taskIntroTemplate: { type: 'string' },
            interventionGuidelines: { type: 'array', items: { type: 'string' } },
            postTaskQuestions: { type: 'array', items: { type: 'string' } },
            debrief: { type: 'string' }
          }
        },
        thinkAloudInstructions: { type: 'string' },
        observationChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        susQuestionnaire: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionNumber: { type: 'number' },
              question: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        consentForms: { type: 'array', items: { type: 'string' } },
        unmoderatedInstructions: { type: 'string' },
        technicalChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              required: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        dataCollectionTemplates: {
          type: 'object',
          properties: {
            sessionNotesTemplate: { type: 'string' },
            metricsTrackingSheet: { type: 'string' },
            observationLog: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'test-protocol']
}));

// Task 5: Pilot Testing
export const pilotTestingTask = defineTask('pilot-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct pilot test to validate test setup',
  agent: {
    name: 'pilot-test-facilitator',
    prompt: {
      role: 'UX Researcher conducting pilot usability test',
      task: 'Run pilot test session to validate test setup, timing, and identify any issues with protocol or tasks',
      context: args,
      instructions: [
        'Conduct pilot test with internal team member or external pilot participant',
        'Run through complete test protocol including all tasks',
        'Validate task scenarios are clear and not leading',
        'Check task difficulty and time estimates',
        'Test think-aloud protocol effectiveness',
        'Validate recording and observation setup works properly',
        'Identify technical issues (screen sharing, recording, platform)',
        'Check moderator script flow and timing',
        'Assess total session duration against estimate',
        'Identify confusing or problematic task wording',
        'Check if success criteria are clear and measurable',
        'Document all issues, confusion points, and suggested improvements',
        'Make necessary adjustments to protocol and tasks',
        'Generate pilot test report with issues found and adjustments made'
      ],
      outputFormat: 'JSON with pilotCompleted (boolean), issuesFound (number), issueDetails (array), adjustmentsMade (array), timingValidation (object), protocolValidated (boolean), readyForTesting (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pilotCompleted', 'issuesFound', 'adjustmentsMade', 'readyForTesting', 'artifacts'],
      properties: {
        pilotCompleted: { type: 'boolean' },
        issuesFound: { type: 'number' },
        issueDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['task-wording', 'timing', 'technical', 'protocol', 'success-criteria'] },
              resolution: { type: 'string' }
            }
          }
        },
        adjustmentsMade: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              adjustment: { type: 'string' },
              reason: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        timingValidation: {
          type: 'object',
          properties: {
            estimatedDuration: { type: 'string' },
            actualDuration: { type: 'string' },
            withinRange: { type: 'boolean' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        protocolValidated: { type: 'boolean' },
        readyForTesting: { type: 'boolean' },
        pilotParticipantFeedback: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'usability-testing', 'pilot-test']
}));

// Task 6: Moderated Testing Session
export const moderatedTestingSessionTask = defineTask('moderated-testing-session', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct Moderated Test Session ${args.sessionNumber}`,
  agent: {
    name: 'usability-test-moderator',
    prompt: {
      role: 'Expert UX Researcher and usability test moderator',
      task: 'Conduct moderated usability test session with participant using think-aloud protocol',
      context: args,
      instructions: [
        'Session setup (5 min):',
        '  - Welcome participant warmly, build rapport',
        '  - Review consent and recording permission',
        '  - Explain test process and set expectations',
        '  - Emphasize testing the design, not the participant',
        'Background questions (5 min): gather demographic and experience info',
        'Think-aloud training (3 min):',
        '  - Explain think-aloud protocol clearly',
        '  - Practice with simple example task',
        '  - Encourage continuous verbalization of thoughts',
        'Task administration (30-45 min):',
        '  - Introduce each task without leading hints',
        '  - Encourage thinking aloud: "What are you thinking?" "Keep talking"',
        '  - Observe carefully: clicks, hesitations, errors, expressions',
        '  - Take detailed notes on behavior and verbal comments',
        '  - Record time on task and path taken',
        '  - Count errors: wrong clicks, backtracking, dead ends',
        '  - Note confusion points and unexpected behaviors',
        '  - Capture memorable quotes verbatim',
        '  - Only intervene if participant is completely stuck (note intervention)',
        '  - Ask post-task questions: difficulty (1-5), satisfaction, expectations',
        'Post-test questionnaire (5 min):',
        '  - Administer System Usability Scale (SUS)',
        '  - Gather overall impressions and feedback',
        'Debrief (5 min):',
        '  - Ask if participant has final questions or comments',
        '  - Thank participant and provide incentive',
        'Immediately after session:',
        '  - Write session summary with key observations',
        '  - Note critical usability issues discovered',
        '  - Identify memorable moments and quotes',
        '  - Document task completion results',
        'Generate detailed session report with all observations, metrics, and quotes'
      ],
      outputFormat: 'JSON with sessionId, participantId, sessionDuration, taskResults (array), observations (array), quotes (array), susResponses (object), criticalIssues (array), memorableMoments (array), sessionSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionId', 'participantId', 'taskResults', 'observations', 'artifacts'],
      properties: {
        sessionId: { type: 'string' },
        participantId: { type: 'string' },
        sessionDate: { type: 'string' },
        sessionDuration: { type: 'string' },
        taskResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              completion: { type: 'string', enum: ['success', 'success-with-errors', 'failure', 'abandoned'] },
              timeOnTask: { type: 'string' },
              errorCount: { type: 'number' },
              pathTaken: { type: 'array', items: { type: 'string' } },
              interventionsNeeded: { type: 'number' },
              postTaskDifficulty: { type: 'number', minimum: 1, maximum: 5 },
              postTaskSatisfaction: { type: 'number', minimum: 1, maximum: 5 },
              notes: { type: 'string' }
            }
          }
        },
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              taskId: { type: 'string' },
              observation: { type: 'string' },
              category: { type: 'string', enum: ['confusion', 'error', 'delight', 'frustration', 'unexpected-behavior', 'mental-model-mismatch'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              taskId: { type: 'string' },
              context: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'confused'] }
            }
          }
        },
        susResponses: {
          type: 'object',
          properties: {
            responses: { type: 'array', items: { type: 'number' } },
            rawScore: { type: 'number' }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              taskId: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        memorableMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              taskId: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        participantBackground: {
          type: 'object',
          properties: {
            techProficiency: { type: 'string' },
            productExperience: { type: 'string' },
            relevantExperience: { type: 'string' }
          }
        },
        sessionSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'usability-testing', 'moderated-session', `session-${args.sessionNumber}`]
}));

// Task 7: Unmoderated Testing
export const unmoderatedTestingTask = defineTask('unmoderated-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct unmoderated remote usability testing',
  agent: {
    name: 'unmoderated-test-coordinator',
    prompt: {
      role: 'UX Researcher coordinating unmoderated remote usability testing',
      task: 'Set up and analyze unmoderated remote usability tests collecting quantitative metrics and qualitative feedback',
      context: args,
      instructions: [
        'Set up unmoderated testing using appropriate platform (UserTesting, Maze, Lookback, etc.)',
        'Configure test with task scenarios and instructions',
        'Set up automatic recording of screen, clicks, and participant audio (if supported)',
        'Create clear, self-explanatory task instructions (no moderator to clarify)',
        'Add post-task questions for each task (difficulty, satisfaction, expectations)',
        'Include System Usability Scale (SUS) at end of test',
        'Add open-ended questions for qualitative feedback',
        'Send test invitations to unmoderated participants with deadline',
        'Monitor completion rate and send reminders if needed',
        'Collect and aggregate results from all participants:',
        '  - Task completion rates',
        '  - Time on task (average, median, range)',
        '  - Click/tap paths taken',
        '  - Drop-off points',
        '  - Post-task ratings',
        '  - SUS scores',
        '  - Qualitative feedback',
        'Watch video recordings for key insights (sample if large volume)',
        'Identify common confusion points and error patterns',
        'Note any technical issues or participant difficulties with test platform',
        'Generate unmoderated testing summary with quantitative metrics and key qualitative insights'
      ],
      outputFormat: 'JSON with participantCount, completionRate, taskMetrics (array), aggregatedSUSScores, qualitativeFeedback (array), videoInsights (array), commonIssues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['participantCount', 'completionRate', 'taskMetrics', 'artifacts'],
      properties: {
        participantCount: { type: 'number' },
        completionRate: { type: 'string' },
        taskMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              successRate: { type: 'number' },
              averageTime: { type: 'string' },
              medianTime: { type: 'string' },
              averageDifficulty: { type: 'number' },
              averageSatisfaction: { type: 'number' },
              dropOffRate: { type: 'number' },
              pathDirectness: { type: 'number' }
            }
          }
        },
        aggregatedSUSScores: {
          type: 'object',
          properties: {
            averageSUS: { type: 'number' },
            medianSUS: { type: 'number' },
            susDistribution: { type: 'array', items: { type: 'number' } }
          }
        },
        qualitativeFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              taskId: { type: 'string' },
              feedback: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
            }
          }
        },
        videoInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              taskId: { type: 'string' },
              insight: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        commonIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              frequency: { type: 'string' },
              affectedTasks: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        heatmaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              clickData: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technicalIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'usability-testing', 'unmoderated-testing']
}));

// Task 8: Observation Synthesis
export const observationSynthesisTask = defineTask('observation-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize observation data and user behaviors',
  agent: {
    name: 'observation-analyst',
    prompt: {
      role: 'UX Researcher specializing in qualitative data synthesis and behavioral analysis',
      task: 'Synthesize all observation data from test sessions to identify patterns, behaviors, and usability issues',
      context: args,
      instructions: [
        'Aggregate all observations from moderated and unmoderated sessions',
        'Use affinity mapping to group related observations',
        'Identify behavioral patterns that emerged across multiple participants',
        'Categorize observations by type: errors, confusion, delight, frustration, mental model mismatches',
        'Map observations to specific tasks and product areas',
        'Identify confusion points where multiple participants struggled',
        'Document mental model mismatches (what users expected vs. what happened)',
        'Capture positive observations (delightful moments, intuitive interactions)',
        'Analyze think-aloud data for insights into user expectations and reasoning',
        'Identify verbal expressions indicating emotion (frustration, surprise, satisfaction)',
        'Document unexpected behaviors and creative workarounds',
        'Quantify frequency of observations (how many participants encountered each issue)',
        'Organize memorable quotes by theme',
        'Generate comprehensive observation synthesis document with patterns and insights'
      ],
      outputFormat: 'JSON with totalObservations, observationsByCategory (object), behavioralPatterns (array), confusionPoints (array), mentalModelMismatches (array), positiveObservations (array), quotes (array), unexpectedBehaviors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalObservations', 'behavioralPatterns', 'confusionPoints', 'artifacts'],
      properties: {
        totalObservations: { type: 'number' },
        observationsByCategory: {
          type: 'object',
          properties: {
            errors: { type: 'number' },
            confusion: { type: 'number' },
            frustration: { type: 'number' },
            delight: { type: 'number' },
            mentalModelMismatch: { type: 'number' }
          }
        },
        behavioralPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string' },
              participantCount: { type: 'number' },
              affectedTasks: { type: 'array', items: { type: 'string' } },
              implications: { type: 'string' }
            }
          }
        },
        confusionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              confusionPoint: { type: 'string' },
              location: { type: 'string' },
              participantCount: { type: 'number' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        mentalModelMismatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userExpectation: { type: 'string' },
              actualBehavior: { type: 'string' },
              gap: { type: 'string' },
              participantCount: { type: 'number' },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        positiveObservations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              observation: { type: 'string' },
              location: { type: 'string' },
              participantCount: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              participantId: { type: 'string' },
              theme: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'confused'] },
              context: { type: 'string' }
            }
          }
        },
        unexpectedBehaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              participantCount: { type: 'number' },
              significance: { type: 'string' }
            }
          }
        },
        emotionalResponses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emotion: { type: 'string' },
              trigger: { type: 'string' },
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
  labels: ['agent', 'usability-testing', 'observation-synthesis']
}));

// Task 9: Success Metrics Analysis
export const successMetricsAnalysisTask = defineTask('success-metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze success metrics and quantitative data',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'UX Researcher and data analyst specializing in usability metrics',
      task: 'Analyze quantitative success metrics to evaluate usability performance',
      context: args,
      instructions: [
        'Calculate task completion rates (success, success-with-errors, failure) for each task',
        'Aggregate across all participants for statistical reliability',
        'Compare against target benchmark (typically 80% success rate)',
        'Analyze time on task:',
        '  - Calculate average, median, range for each task',
        '  - Identify tasks that took significantly longer than expected',
        '  - Compare against task time estimates',
        'Analyze error rates:',
        '  - Count average errors per task',
        '  - Identify tasks with highest error rates',
        '  - Categorize error types (navigation, input, recovery)',
        'Calculate path directness (actual steps / optimal steps)',
        'Analyze post-task difficulty ratings (1-5 scale):',
        '  - Average difficulty per task',
        '  - Identify tasks rated most difficult',
        'Analyze post-task satisfaction ratings (1-5 scale):',
        '  - Average satisfaction per task',
        '  - Identify tasks with lowest satisfaction',
        'Calculate overall satisfaction score',
        'Identify correlations: high error rate → low satisfaction, long time → high difficulty',
        'Compare moderated vs. unmoderated results (if applicable)',
        'Generate statistical confidence intervals where sample size permits',
        'Create visualizations: bar charts for completion rates, line graphs for time trends',
        'Generate comprehensive metrics analysis report with charts and insights'
      ],
      outputFormat: 'JSON with overallTaskSuccessRate, averageTimeOnTask, averageErrorRate, taskMetrics (array), satisfactionScore, metricsVsBenchmarks (object), correlations (array), visualizations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallTaskSuccessRate', 'averageTimeOnTask', 'averageErrorRate', 'taskMetrics', 'artifacts'],
      properties: {
        overallTaskSuccessRate: { type: 'number' },
        averageTimeOnTask: { type: 'string' },
        averageErrorRate: { type: 'number' },
        taskMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              completionRate: {
                type: 'object',
                properties: {
                  success: { type: 'number' },
                  successWithErrors: { type: 'number' },
                  failure: { type: 'number' }
                }
              },
              timeOnTask: {
                type: 'object',
                properties: {
                  average: { type: 'string' },
                  median: { type: 'string' },
                  range: { type: 'string' },
                  longerThanExpected: { type: 'boolean' }
                }
              },
              errorRate: {
                type: 'object',
                properties: {
                  averageErrors: { type: 'number' },
                  errorTypes: { type: 'object' }
                }
              },
              pathDirectness: { type: 'number' },
              averageDifficulty: { type: 'number' },
              averageSatisfaction: { type: 'number' },
              metBenchmark: { type: 'boolean' }
            }
          }
        },
        satisfactionScore: { type: 'number' },
        metricsVsBenchmarks: {
          type: 'object',
          properties: {
            taskSuccessRateVsTarget: {
              type: 'object',
              properties: {
                actual: { type: 'number' },
                target: { type: 'number' },
                met: { type: 'boolean' },
                gap: { type: 'number' }
              }
            },
            errorRateVsTarget: {
              type: 'object',
              properties: {
                actual: { type: 'number' },
                target: { type: 'number' },
                met: { type: 'boolean' }
              }
            }
          }
        },
        correlations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              correlation: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              insight: { type: 'string' }
            }
          }
        },
        performanceSummary: {
          type: 'object',
          properties: {
            bestPerformingTasks: { type: 'array', items: { type: 'string' } },
            worstPerformingTasks: { type: 'array', items: { type: 'string' } },
            tasksNeedingAttention: { type: 'array', items: { type: 'string' } }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'metrics-analysis']
}));

// Task 10: Issue Identification
export const issueIdentificationTask = defineTask('issue-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and categorize usability issues',
  agent: {
    name: 'usability-issues-analyst',
    prompt: {
      role: 'UX Researcher and usability expert specializing in issue identification and prioritization',
      task: 'Identify, document, and prioritize all usability issues discovered during testing',
      context: args,
      instructions: [
        'Review all observations, metrics, and participant feedback',
        'Identify distinct usability issues (not individual observations, but underlying problems)',
        'For each issue, document:',
        '  - Clear description of the problem',
        '  - Location in product/design',
        '  - Tasks affected',
        '  - Frequency (how many participants encountered)',
        '  - Impact on task completion and satisfaction',
        '  - Supporting evidence (observations, quotes, metrics)',
        'Categorize issues by type:',
        '  - Navigation: difficulty finding features/content',
        '  - Comprehension: confusing labels, unclear instructions',
        '  - Interaction: unclear affordances, unexpected behaviors',
        '  - Visual design: poor hierarchy, low contrast, cluttered',
        '  - Content: unclear copy, missing information',
        '  - Performance: slow loading, lag, errors',
        '  - Accessibility: keyboard, screen reader, color contrast issues',
        'Prioritize issues using severity framework:',
        '  - Critical: prevents task completion, affects most users',
        '  - High: significant impact on completion/satisfaction, affects many users',
        '  - Medium: moderate impact, affects some users',
        '  - Low: minor annoyance, minimal impact',
        'Consider Jakob Nielsen severity rating: frequency × impact × persistence',
        'Identify root causes where possible',
        'Group related issues into themes',
        'Generate comprehensive issues report with prioritization'
      ],
      outputFormat: 'JSON with totalIssues, criticalIssues (array), highIssues (array), mediumIssues (array), lowIssues (array), issuesByCategory (object), issuesByTask (object), issueThemes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalIssues', 'criticalIssues', 'highIssues', 'issuesByCategory', 'artifacts'],
      properties: {
        totalIssues: { type: 'number' },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              affectedTasks: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              participantCount: { type: 'number' },
              impact: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              rootCause: { type: 'string' }
            }
          }
        },
        highIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              affectedTasks: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              participantCount: { type: 'number' },
              impact: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mediumIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        lowIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        issuesByCategory: {
          type: 'object',
          properties: {
            navigation: { type: 'number' },
            comprehension: { type: 'number' },
            interaction: { type: 'number' },
            visualDesign: { type: 'number' },
            content: { type: 'number' },
            performance: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        issuesByTask: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        issueThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              issueCount: { type: 'number' },
              relatedIssues: { type: 'array', items: { type: 'string' } },
              overarchingProblem: { type: 'string' }
            }
          }
        },
        severityDistribution: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
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
  labels: ['agent', 'usability-testing', 'issue-identification']
}));

// Task 11: Findings Synthesis
export const findingsSynthesisTask = defineTask('findings-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize findings and generate insights',
  agent: {
    name: 'findings-synthesizer',
    prompt: {
      role: 'Senior UX Researcher and insight strategist',
      task: 'Synthesize all findings into actionable insights that guide design decisions',
      context: args,
      instructions: [
        'Review all data: observations, metrics, issues, participant feedback',
        'Synthesize into high-level key findings (5-10 major findings)',
        'Each finding should:',
        '  - State clear insight about usability',
        '  - Be supported by multiple data sources (triangulation)',
        '  - Connect to testing goals',
        '  - Have clear implications for design',
        'Transform findings into actionable insights',
        'An insight reveals WHY an issue exists and WHAT it means for users',
        'Good insight example: "Users expected the search to filter results in real-time because all modern e-commerce sites work this way. The delayed search creates frustration and makes users question if it\'s working."',
        'Document user expectations vs. reality gaps',
        'Identify mental model mismatches and their implications',
        'Highlight positive findings (what worked well and why)',
        'Connect findings to broader UX principles (consistency, feedback, affordances)',
        'Identify patterns across multiple tasks or areas',
        'Prioritize findings by impact on user experience',
        'Generate findings synthesis document with insights and implications'
      ],
      outputFormat: 'JSON with keyFindings (array), insights (array), userExpectations (array), mentalModelMismatches (array), positiveFindings (array), uxPrincipleViolations (array), patternsAcrossTasks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyFindings', 'insights', 'userExpectations', 'artifacts'],
      properties: {
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              supportingEvidence: { type: 'array', items: { type: 'string' } },
              relatedTestingGoals: { type: 'array', items: { type: 'string' } },
              implications: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              why: { type: 'string' },
              whatItMeans: { type: 'string' },
              designImplication: { type: 'string' },
              supportingData: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userExpectations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expectation: { type: 'string' },
              actualExperience: { type: 'string' },
              gap: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        mentalModelMismatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mismatch: { type: 'string' },
              userMentalModel: { type: 'string' },
              systemModel: { type: 'string' },
              consequence: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        positiveFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              whyItWorked: { type: 'string' },
              applyElsewhere: { type: 'string' }
            }
          }
        },
        uxPrincipleViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              violation: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        patternsAcrossTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
              systemicIssue: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'findings-synthesis']
}));

// Task 12: Usability Scoring (SUS)
export const usabilityScoringTask = defineTask('usability-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate System Usability Scale (SUS) score',
  agent: {
    name: 'usability-scorer',
    prompt: {
      role: 'UX Researcher and usability metrics specialist',
      task: 'Calculate and interpret System Usability Scale (SUS) score from test data',
      context: args,
      instructions: [
        'Collect SUS responses from all participants (10 questions, 1-5 scale)',
        'SUS questions (standard):',
        '  1. I think that I would like to use this system frequently.',
        '  2. I found the system unnecessarily complex.',
        '  3. I thought the system was easy to use.',
        '  4. I think that I would need the support of a technical person to use this system.',
        '  5. I found the various functions in this system were well integrated.',
        '  6. I thought there was too much inconsistency in this system.',
        '  7. I would imagine that most people would learn to use this system very quickly.',
        '  8. I found the system very cumbersome to use.',
        '  9. I felt very confident using the system.',
        '  10. I needed to learn a lot of things before I could get going with this system.',
        'Calculate SUS score:',
        '  - For odd questions (1,3,5,7,9): score contribution = response - 1',
        '  - For even questions (2,4,6,8,10): score contribution = 5 - response',
        '  - Sum all contributions and multiply by 2.5',
        '  - Final score ranges from 0-100',
        'Calculate average SUS score across all participants',
        'Interpret SUS score:',
        '  - 90-100 = A (Excellent)',
        '  - 80-89 = B (Good)',
        '  - 68-79 = C (Okay)',
        '  - 51-67 = D (Poor)',
        '  - 0-50 = F (Awful)',
        'Note: 68 is average SUS score across all systems',
        'Compare score against minimum threshold',
        'Calculate confidence interval if sample size permits',
        'Analyze SUS score distribution across participants',
        'Identify outlier scores and investigate reasons',
        'Generate SUS score report with interpretation and visualization'
      ],
      outputFormat: 'JSON with susScore (0-100), grade (string), interpretation, scoreDistribution, metThreshold (boolean), confidenceInterval, individualScores (array), outliers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['susScore', 'grade', 'interpretation', 'metThreshold', 'artifacts'],
      properties: {
        susScore: { type: 'number', minimum: 0, maximum: 100 },
        grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
        interpretation: { type: 'string' },
        scoreDistribution: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            median: { type: 'number' },
            standardDeviation: { type: 'number' },
            range: { type: 'string' }
          }
        },
        metThreshold: { type: 'boolean' },
        threshold: { type: 'number' },
        gap: { type: 'number' },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            confidenceLevel: { type: 'string' }
          }
        },
        individualScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              susScore: { type: 'number' },
              grade: { type: 'string' }
            }
          }
        },
        outliers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              susScore: { type: 'number' },
              possibleReasons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        benchmarkComparison: {
          type: 'object',
          properties: {
            industryAverage: { type: 'number' },
            vsIndustry: { type: 'string' },
            globalAverage: { type: 'number' },
            vsGlobal: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'sus-scoring']
}));

// Task 13: Recommendations Generation
export const recommendationsGenerationTask = defineTask('recommendations-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate prioritized recommendations for improvements',
  agent: {
    name: 'ux-recommendations-strategist',
    prompt: {
      role: 'Senior UX Designer and product strategist',
      task: 'Generate specific, prioritized, actionable recommendations for improving usability',
      context: args,
      instructions: [
        'Review all issues, findings, and insights',
        'For each critical and high priority issue, generate specific recommendations',
        'Recommendations should be:',
        '  - Specific and actionable (not vague)',
        '  - Address root cause, not just symptoms',
        '  - Grounded in UX best practices',
        '  - Feasible to implement',
        'Good recommendation: "Add real-time search filtering to show results as user types, matching mental model of modern e-commerce sites. Include visual feedback (loading spinner) during search."',
        'Bad recommendation: "Make search better."',
        'For each recommendation:',
        '  - Describe the change clearly',
        '  - Explain expected impact on usability',
        '  - Estimate implementation effort (low/medium/high)',
        '  - Link to issues/findings addressed',
        'Prioritize using impact vs. effort matrix:',
        '  - Quick wins: high impact, low effort (do first)',
        '  - Short-term improvements: high impact, medium effort (plan for next sprint)',
        '  - Long-term improvements: high impact, high effort (roadmap)',
        '  - Deprioritize: low impact (regardless of effort)',
        'Group recommendations by product area or feature',
        'Include design patterns or examples where helpful',
        'Provide specific wording suggestions for labels, messages, instructions',
        'Generate comprehensive recommendations report with prioritization'
      ],
      outputFormat: 'JSON with recommendations (array), prioritizedRecommendations (array), quickWins (array), shortTermImprovements (array), longTermImprovements (array), designPatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedRecommendations', 'quickWins', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              addressedIssues: { type: 'array', items: { type: 'string' } },
              expectedImpact: { type: 'string' },
              implementationEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              productArea: { type: 'string' },
              specificChanges: { type: 'array', items: { type: 'string' } },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritizedRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              expectedImpact: { type: 'string' },
              effort: { type: 'string' },
              timeToImplement: { type: 'string' }
            }
          }
        },
        shortTermImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        longTermImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              title: { type: 'string' },
              strategicValue: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        designPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              useCase: { type: 'string' },
              example: { type: 'string' },
              relatedRecommendations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contentSuggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              currentContent: { type: 'string' },
              suggestedContent: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'recommendations']
}));

// Task 14: Accessibility Analysis
export const accessibilityAnalysisTask = defineTask('accessibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze accessibility findings',
  agent: {
    name: 'accessibility-analyst',
    prompt: {
      role: 'Accessibility specialist and inclusive design expert',
      task: 'Analyze accessibility issues discovered during usability testing',
      context: args,
      instructions: [
        'Review all observations for accessibility-related issues',
        'Identify WCAG 2.1 compliance violations:',
        '  - Level A: critical accessibility barriers',
        '  - Level AA: recommended standard for most sites',
        '  - Level AAA: enhanced accessibility',
        'Categorize accessibility issues:',
        '  - Perceivable: content must be perceivable (contrast, text alternatives, captions)',
        '  - Operable: interface must be operable (keyboard, timing, navigation)',
        '  - Understandable: content must be understandable (readable, predictable)',
        '  - Robust: content must be robust (compatible with assistive tech)',
        'Document specific accessibility issues:',
        '  - Keyboard accessibility barriers',
        '  - Screen reader issues',
        '  - Color contrast problems',
        '  - Missing alt text or labels',
        '  - Form accessibility issues',
        '  - Focus indicators missing or unclear',
        'Assess severity of each accessibility issue',
        'Determine WCAG compliance level achieved',
        'Generate specific accessibility recommendations',
        'Prioritize accessibility fixes by impact on users with disabilities',
        'Generate accessibility findings report'
      ],
      outputFormat: 'JSON with issuesFound (number), wcagComplianceLevel, accessibilityIssues (array), issuesByCategory (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['issuesFound', 'wcagComplianceLevel', 'accessibilityIssues', 'recommendations', 'artifacts'],
      properties: {
        issuesFound: { type: 'number' },
        wcagComplianceLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'non-compliant'] },
        accessibilityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
              category: { type: 'string', enum: ['perceivable', 'operable', 'understandable', 'robust'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedUsers: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'string' }
            }
          }
        },
        issuesByCategory: {
          type: 'object',
          properties: {
            perceivable: { type: 'number' },
            operable: { type: 'number' },
            understandable: { type: 'number' },
            robust: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              wcagCriterion: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implementationGuidance: { type: 'string' }
            }
          }
        },
        complianceGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              level: { type: 'string' },
              gap: { type: 'string' }
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
  labels: ['agent', 'usability-testing', 'accessibility']
}));

// Task 15: Test Report Generation
export const testReportGenerationTask = defineTask('test-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive usability test report',
  agent: {
    name: 'test-report-writer',
    prompt: {
      role: 'UX Researcher and technical writer',
      task: 'Generate comprehensive, stakeholder-ready usability test report with findings and recommendations',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - SUS score and usability grade',
        '  - Overall task success rate',
        '  - Critical findings (top 3-5)',
        '  - Top recommendations (prioritized)',
        '  - Next steps',
        'Include test overview section:',
        '  - Testing goals and objectives',
        '  - Testing methodology and approach',
        '  - Participant demographics and recruitment',
        '  - Test tasks and scenarios',
        '  - Timeline and logistics',
        'Document methodology section:',
        '  - Detailed test protocol',
        '  - Participant screening criteria',
        '  - Data collection methods',
        '  - Analysis approach',
        'Present quantitative results:',
        '  - Task completion rates with charts',
        '  - Time on task analysis',
        '  - Error rates',
        '  - SUS score with interpretation',
        '  - Satisfaction ratings',
        'Present qualitative findings:',
        '  - Key behavioral patterns',
        '  - Confusion points',
        '  - Mental model mismatches',
        '  - Notable participant quotes',
        '  - Positive findings',
        'Include usability issues section:',
        '  - Critical issues with evidence',
        '  - High priority issues',
        '  - Issue severity breakdown',
        '  - Issues by category',
        'Include insights and findings section:',
        '  - High-level insights',
        '  - Implications for design',
        '  - User expectations vs. reality',
        'Present recommendations:',
        '  - Prioritized recommendations',
        '  - Quick wins',
        '  - Short-term and long-term improvements',
        '  - Success metrics for measuring improvement',
        'Include video highlights and notable moments',
        'Add appendices: test protocol, tasks, raw data, participant quotes',
        'Format as professional, well-designed document with visuals and charts',
        'Create stakeholder presentation deck (15-20 slides)',
        'Ensure report is actionable and guides design decisions'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyMetrics (object), criticalFindings (array), topRecommendations (array), videoHighlights (array), presentationPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyMetrics', 'criticalFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyMetrics: {
          type: 'object',
          properties: {
            susScore: { type: 'number' },
            usabilityGrade: { type: 'string' },
            taskSuccessRate: { type: 'number' },
            participantCount: { type: 'number' },
            totalIssues: { type: 'number' },
            criticalIssues: { type: 'number' }
          }
        },
        criticalFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              impact: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        videoHighlights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              participantId: { type: 'string' },
              taskId: { type: 'string' },
              timestamp: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        presentationPath: { type: 'string' },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              pageCount: { type: 'number' },
              summary: { type: 'string' }
            }
          }
        },
        distributionPlan: {
          type: 'object',
          properties: {
            targetAudiences: { type: 'array', items: { type: 'string' } },
            formats: { type: 'array', items: { type: 'string' } },
            nextSteps: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'usability-testing', 'reporting', 'documentation']
}));
