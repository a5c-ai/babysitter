/**
 * @process ux-ui-design/design-sprint
 * @description Design Sprint Facilitation process implementing 5-day framework (Understand, Diverge, Decide, Prototype, Test) with stakeholder management, rapid prototyping, and validation testing
 * @inputs { projectName: string, challengeStatement: string, sprintGoal: string, participants: array, duration: string, format: string, targetUsers: object, constraints: object, outputDir: string }
 * @outputs { success: boolean, sprintReport: string, prototype: object, testingResults: object, decisions: array, insights: array, nextSteps: array, artifacts: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    challengeStatement = '',
    sprintGoal = '',
    participants = [],
    stakeholders = [],
    duration = '5-day', // 5-day, 4-day, 3-day
    format = 'remote', // remote, in-person, hybrid
    targetUsers = {},
    testParticipantCount = 5,
    constraints = {},
    existingResearch = [],
    expertInterviews = [],
    outputDir = 'design-sprint-output',
    targetQualityScore = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Design Sprint Facilitation for ${projectName}`);

  // ============================================================================
  // PHASE 1: PRE-SPRINT PREPARATION AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Pre-Sprint preparation and planning');
  const sprintPreparation = await ctx.task(sprintPreparationTask, {
    projectName,
    challengeStatement,
    sprintGoal,
    participants,
    stakeholders,
    duration,
    format,
    targetUsers,
    testParticipantCount,
    constraints,
    existingResearch,
    expertInterviews,
    outputDir
  });

  artifacts.push(...sprintPreparation.artifacts);

  if (!sprintPreparation.readinessApproved) {
    ctx.log('warn', 'Sprint preparation incomplete - missing critical elements');
    return {
      success: false,
      reason: 'Sprint preparation requirements not met',
      missingElements: sprintPreparation.missingElements,
      recommendations: sprintPreparation.recommendations,
      metadata: {
        processId: 'ux-ui-design/design-sprint',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: DAY 1 - UNDERSTAND (Map and Choose Target)
  // ============================================================================

  ctx.log('info', 'Phase 2: Day 1 - Understand the problem and map the challenge');
  const day1Understand = await ctx.task(day1UnderstandTask, {
    projectName,
    sprintGoal: sprintPreparation.refinedSprintGoal,
    challengeStatement: sprintPreparation.refinedChallengeStatement,
    participants: sprintPreparation.confirmedParticipants,
    stakeholders,
    existingResearch: sprintPreparation.researchSummary,
    expertInterviews: sprintPreparation.expertInsights,
    constraints,
    format,
    outputDir
  });

  artifacts.push(...day1Understand.artifacts);

  // Breakpoint: Day 1 Review
  await ctx.breakpoint({
    question: `Day 1 (Understand) complete. Target chosen: "${day1Understand.sprintTarget}". Review problem map and sprint questions?`,
    title: 'Day 1 Review - Understand',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.day === 1 || a.phase === 'understand')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        sprintTarget: day1Understand.sprintTarget,
        hmwQuestions: day1Understand.hmwQuestions.length,
        expertInsights: day1Understand.expertInsights.length,
        longTermGoal: day1Understand.longTermGoal,
        sprintQuestions: day1Understand.sprintQuestions
      }
    }
  });

  // ============================================================================
  // PHASE 3: DAY 2 - DIVERGE (Sketch Competing Solutions)
  // ============================================================================

  ctx.log('info', 'Phase 3: Day 2 - Diverge and sketch competing solutions');
  const day2Diverge = await ctx.task(day2DivergeTask, {
    projectName,
    sprintTarget: day1Understand.sprintTarget,
    userJourneyMap: day1Understand.userJourneyMap,
    hmwQuestions: day1Understand.hmwQuestions,
    inspirationSources: day1Understand.inspirationSources,
    sprintQuestions: day1Understand.sprintQuestions,
    participants: sprintPreparation.confirmedParticipants,
    format,
    outputDir
  });

  artifacts.push(...day2Diverge.artifacts);

  // Breakpoint: Day 2 Review
  await ctx.breakpoint({
    question: `Day 2 (Diverge) complete. ${day2Diverge.solutionSketches.length} solution sketches created. Review competing solutions?`,
    title: 'Day 2 Review - Diverge',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.day === 2 || a.phase === 'diverge')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        totalSketches: day2Diverge.solutionSketches.length,
        diverseApproaches: day2Diverge.diverseApproaches,
        notableIdeas: day2Diverge.notableIdeas,
        lightningDemos: day2Diverge.lightningDemos?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 4: DAY 3 - DECIDE (Choose the Best Solution)
  // ============================================================================

  ctx.log('info', 'Phase 4: Day 3 - Decide on the best solution to prototype');
  const day3Decide = await ctx.task(day3DecideTask, {
    projectName,
    sprintTarget: day1Understand.sprintTarget,
    sprintQuestions: day1Understand.sprintQuestions,
    solutionSketches: day2Diverge.solutionSketches,
    participants: sprintPreparation.confirmedParticipants,
    decisionMaker: sprintPreparation.decisionMaker,
    format,
    outputDir
  });

  artifacts.push(...day3Decide.artifacts);

  // Breakpoint: Day 3 Review
  await ctx.breakpoint({
    question: `Day 3 (Decide) complete. Winning solution selected. Review storyboard with ${day3Decide.storyboard.frames.length} frames?`,
    title: 'Day 3 Review - Decide',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.day === 3 || a.phase === 'decide')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        winningSolution: day3Decide.winningSolution.title,
        winningRationale: day3Decide.winningSolution.rationale,
        storyboardFrames: day3Decide.storyboard.frames.length,
        rumblesResolved: day3Decide.rumblesResolved,
        conflictingIdeas: day3Decide.conflictingIdeasHandled
      }
    }
  });

  // ============================================================================
  // PHASE 5: DAY 4 - PROTOTYPE (Build a Realistic Facade)
  // ============================================================================

  ctx.log('info', 'Phase 4: Day 4 - Prototype the winning solution');
  const day4Prototype = await ctx.task(day4PrototypeTask, {
    projectName,
    storyboard: day3Decide.storyboard,
    winningSolution: day3Decide.winningSolution,
    userJourneyMap: day1Understand.userJourneyMap,
    participants: sprintPreparation.confirmedParticipants,
    format,
    prototypeFidelity: 'high-fidelity-facade',
    outputDir
  });

  artifacts.push(...day4Prototype.artifacts);

  // Breakpoint: Day 4 Review
  await ctx.breakpoint({
    question: `Day 4 (Prototype) complete. Realistic prototype built with ${day4Prototype.totalScreens} screens. Review prototype before testing?`,
    title: 'Day 4 Review - Prototype',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.day === 4 || a.phase === 'prototype')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        prototypeUrl: day4Prototype.prototypeUrl,
        totalScreens: day4Prototype.totalScreens,
        interactions: day4Prototype.interactions.length,
        testingReadiness: day4Prototype.testingReadiness,
        assetsCaptured: day4Prototype.assetTypes
      }
    }
  });

  // ============================================================================
  // PHASE 6: TEST PREPARATION AND PARTICIPANT RECRUITMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Recruiting and preparing for user testing');
  const testPreparation = await ctx.task(testPreparationTask, {
    projectName,
    targetUsers,
    testParticipantCount,
    sprintTarget: day1Understand.sprintTarget,
    sprintQuestions: day1Understand.sprintQuestions,
    prototype: day4Prototype,
    storyboard: day3Decide.storyboard,
    format,
    outputDir
  });

  artifacts.push(...testPreparation.artifacts);

  // ============================================================================
  // PHASE 7: DAY 5 - TEST (Validate with Real Users)
  // ============================================================================

  ctx.log('info', 'Phase 7: Day 5 - Test with real users and gather insights');
  const day5Test = await ctx.task(day5TestTask, {
    projectName,
    prototype: day4Prototype,
    testParticipants: testPreparation.confirmedParticipants,
    interviewScript: testPreparation.interviewScript,
    sprintQuestions: day1Understand.sprintQuestions,
    storyboard: day3Decide.storyboard,
    participants: sprintPreparation.confirmedParticipants,
    format,
    outputDir
  });

  artifacts.push(...day5Test.artifacts);

  // Breakpoint: Day 5 Review
  await ctx.breakpoint({
    question: `Day 5 (Test) complete. ${day5Test.interviewsCompleted} user interviews conducted. Review testing insights and patterns?`,
    title: 'Day 5 Review - Test',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.day === 5 || a.phase === 'test')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        interviewsCompleted: day5Test.interviewsCompleted,
        successRate: day5Test.successRate,
        majorInsights: day5Test.majorInsights.slice(0, 5),
        patternsIdentified: day5Test.patterns.length,
        sprintQuestionsAnswered: day5Test.sprintQuestionsAnswered
      }
    }
  });

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INSIGHTS EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing test results and extracting insights');
  const insightsSynthesis = await ctx.task(insightsSynthesisTask, {
    projectName,
    sprintGoal: sprintPreparation.refinedSprintGoal,
    sprintTarget: day1Understand.sprintTarget,
    sprintQuestions: day1Understand.sprintQuestions,
    testResults: day5Test,
    winningSolution: day3Decide.winningSolution,
    prototype: day4Prototype,
    outputDir
  });

  artifacts.push(...insightsSynthesis.artifacts);

  // ============================================================================
  // PHASE 9: DECISION FRAMEWORK AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating decisions and next-step recommendations');
  const decisionsAndRecommendations = await ctx.task(decisionsRecommendationsTask, {
    projectName,
    sprintGoal: sprintPreparation.refinedSprintGoal,
    insightsSynthesis,
    testResults: day5Test,
    winningSolution: day3Decide.winningSolution,
    prototype: day4Prototype,
    sprintQuestions: day1Understand.sprintQuestions,
    decisionMaker: sprintPreparation.decisionMaker,
    outputDir
  });

  artifacts.push(...decisionsAndRecommendations.artifacts);

  // ============================================================================
  // PHASE 10: COMPREHENSIVE SPRINT REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive design sprint report');
  const sprintReport = await ctx.task(sprintReportGenerationTask, {
    projectName,
    sprintPreparation,
    day1Understand,
    day2Diverge,
    day3Decide,
    day4Prototype,
    day5Test,
    insightsSynthesis,
    decisionsAndRecommendations,
    duration,
    format,
    outputDir
  });

  artifacts.push(...sprintReport.artifacts);

  // ============================================================================
  // PHASE 11: SPRINT QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Evaluating sprint quality and outcomes');
  const qualityScoring = await ctx.task(sprintQualityScoringTask, {
    projectName,
    sprintGoal: sprintPreparation.refinedSprintGoal,
    sprintQuestions: day1Understand.sprintQuestions,
    testResults: day5Test,
    insightsSynthesis,
    decisionsAndRecommendations,
    prototypeQuality: day4Prototype.qualityScore,
    participantEngagement: sprintPreparation.confirmedParticipants.length,
    targetQualityScore,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  const qualityMet = qualityScoring.overallScore >= targetQualityScore;

  // Breakpoint: Sprint Completion Review
  await ctx.breakpoint({
    question: `Design Sprint complete. Quality score: ${qualityScoring.overallScore}/100. ${qualityMet ? 'Sprint achieved quality targets!' : 'Sprint may need follow-up activities.'} Review final outcomes?`,
    title: 'Sprint Completion Review',
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
        qualityScore: qualityScoring.overallScore,
        qualityMet,
        sprintGoal: sprintPreparation.refinedSprintGoal,
        sprintTarget: day1Understand.sprintTarget,
        prototypeUrl: day4Prototype.prototypeUrl,
        testSuccessRate: day5Test.successRate,
        majorInsights: insightsSynthesis.keyInsights.length,
        decisionsReached: decisionsAndRecommendations.decisions.length,
        recommendedAction: decisionsAndRecommendations.recommendedAction
      }
    }
  });

  // ============================================================================
  // PHASE 12: STAKEHOLDER PRESENTATION PREPARATION
  // ============================================================================

  let stakeholderPresentation = null;
  if (qualityMet && stakeholders.length > 0) {
    ctx.log('info', 'Phase 12: Preparing stakeholder presentation');
    stakeholderPresentation = await ctx.task(stakeholderPresentationTask, {
      projectName,
      sprintReport,
      insightsSynthesis,
      decisionsAndRecommendations,
      prototype: day4Prototype,
      testResults: day5Test,
      stakeholders,
      outputDir
    });
    artifacts.push(...stakeholderPresentation.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: qualityScoring.overallScore,
    qualityMet,
    sprintSummary: {
      goal: sprintPreparation.refinedSprintGoal,
      target: day1Understand.sprintTarget,
      duration,
      format,
      participantCount: sprintPreparation.confirmedParticipants.length
    },
    sprintReport: sprintReport.reportPath,
    sprintOutcomes: {
      longTermGoal: day1Understand.longTermGoal,
      sprintQuestions: day1Understand.sprintQuestions,
      hmwQuestions: day1Understand.hmwQuestions.slice(0, 10),
      solutionsExplored: day2Diverge.solutionSketches.length,
      winningSolution: day3Decide.winningSolution.title,
      storyboardFrames: day3Decide.storyboard.frames.length
    },
    prototype: {
      url: day4Prototype.prototypeUrl,
      screens: day4Prototype.totalScreens,
      interactions: day4Prototype.interactions.length,
      fidelity: day4Prototype.fidelity,
      testingReadiness: day4Prototype.testingReadiness
    },
    testingResults: {
      participantsInterviewed: day5Test.interviewsCompleted,
      successRate: day5Test.successRate,
      patterns: day5Test.patterns,
      majorInsights: day5Test.majorInsights,
      sprintQuestionsAnswered: day5Test.sprintQuestionsAnswered,
      quotableQuotes: day5Test.quotes.slice(0, 10)
    },
    insights: {
      total: insightsSynthesis.keyInsights.length,
      validated: insightsSynthesis.validatedHypotheses.length,
      invalidated: insightsSynthesis.invalidatedHypotheses.length,
      keyInsights: insightsSynthesis.keyInsights,
      surprises: insightsSynthesis.surprisingFindings
    },
    decisions: {
      total: decisionsAndRecommendations.decisions.length,
      recommendedAction: decisionsAndRecommendations.recommendedAction,
      decisions: decisionsAndRecommendations.decisions,
      confidence: decisionsAndRecommendations.confidenceLevel
    },
    nextSteps: {
      immediate: decisionsAndRecommendations.nextSteps.immediate,
      shortTerm: decisionsAndRecommendations.nextSteps.shortTerm,
      longTerm: decisionsAndRecommendations.nextSteps.longTerm,
      contingencies: decisionsAndRecommendations.nextSteps.contingencies
    },
    stakeholderPresentation: stakeholderPresentation ? {
      presentationPath: stakeholderPresentation.presentationPath,
      executiveSummary: stakeholderPresentation.executiveSummary,
      keySlides: stakeholderPresentation.keySlides
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/design-sprint',
      timestamp: startTime,
      outputDir,
      sprintFormat: format,
      sprintDuration: duration
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Sprint Preparation and Planning
export const sprintPreparationTask = defineTask('sprint-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and plan design sprint',
  agent: {
    name: 'sprint-facilitator',
    prompt: {
      role: 'experienced design sprint facilitator and workshop leader',
      task: 'Plan and prepare comprehensive design sprint including participant coordination, materials, schedule, and logistics',
      context: args,
      instructions: [
        'Review and refine challenge statement to be specific, actionable, and focused',
        'Clarify sprint goal and success criteria',
        'Validate sprint is appropriate method for this challenge (not too big/small)',
        'Identify and confirm sprint participants (5-7 people ideal)',
        '  - Decider (has authority to make decisions)',
        '  - Facilitator (guides the process)',
        '  - Designer (visual/UX expertise)',
        '  - Product Manager/Engineer (technical feasibility)',
        '  - Marketing/Customer expert (user knowledge)',
        '  - Domain experts as needed',
        'Confirm participant availability for full sprint duration',
        'Schedule sprint: consecutive days if possible, or adapt timeline',
        'Prepare logistics based on format:',
        '  - Remote: video conferencing, digital whiteboard (Miro/Mural), collaboration tools',
        '  - In-person: physical space, whiteboards, sticky notes, markers, voting dots',
        '  - Hybrid: combination of both with clear protocols',
        'Synthesize existing research and insights for sprint context',
        'Schedule expert interviews if needed (conduct before Day 1)',
        'Recruit test participants (5 users matching target criteria)',
        'Prepare sprint schedule and daily agendas',
        'Create participant briefing materials',
        'Set up collaboration spaces and tools',
        'Define roles and responsibilities',
        'Prepare icebreaker and energizer activities',
        'Create sprint readiness checklist',
        'Generate sprint preparation package'
      ],
      outputFormat: 'JSON with refinedChallengeStatement, refinedSprintGoal, confirmedParticipants (array), decisionMaker (object), sprintSchedule (object), logistics (object), researchSummary (object), expertInsights (array), readinessApproved (boolean), missingElements (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedChallengeStatement', 'refinedSprintGoal', 'confirmedParticipants', 'readinessApproved', 'artifacts'],
      properties: {
        refinedChallengeStatement: { type: 'string' },
        refinedSprintGoal: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        confirmedParticipants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              expertise: { type: 'string' },
              availability: { type: 'string' }
            }
          }
        },
        decisionMaker: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            authority: { type: 'string' }
          }
        },
        sprintSchedule: {
          type: 'object',
          properties: {
            day1: { type: 'string' },
            day2: { type: 'string' },
            day3: { type: 'string' },
            day4: { type: 'string' },
            day5: { type: 'string' },
            dailyHours: { type: 'string' },
            breaks: { type: 'array', items: { type: 'string' } }
          }
        },
        logistics: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            location: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            materials: { type: 'array', items: { type: 'string' } }
          }
        },
        researchSummary: {
          type: 'object',
          properties: {
            existingInsights: { type: 'array', items: { type: 'string' } },
            userProblems: { type: 'array', items: { type: 'string' } },
            competitiveAnalysis: { type: 'array', items: { type: 'string' } }
          }
        },
        expertInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expert: { type: 'string' },
              expertise: { type: 'string' },
              keyInsights: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        testParticipantRecruitment: {
          type: 'object',
          properties: {
            targetCriteria: { type: 'object' },
            recruitmentStatus: { type: 'string' },
            confirmedCount: { type: 'number' }
          }
        },
        readinessApproved: { type: 'boolean' },
        missingElements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-sprint', 'preparation']
}));

// Task 2: Day 1 - Understand
export const day1UnderstandTask = defineTask('day1-understand', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Day 1 - Understand the problem and map the challenge',
  agent: {
    name: 'sprint-facilitator-day1',
    prompt: {
      role: 'design sprint facilitator leading Day 1 activities',
      task: 'Facilitate Day 1 of design sprint: set long-term goal, map the challenge, conduct expert interviews, and choose sprint target',
      context: args,
      instructions: [
        'Start with sprint introduction and team alignment',
        'Set the long-term goal: Where do we want to be in 6 months, 1 year, 5 years?',
        '  - Frame as optimistic future state',
        '  - Get team alignment on vision',
        'List sprint questions: What questions need to be answered in this sprint?',
        '  - Turn obstacles into questions',
        '  - Focus on biggest risks and unknowns',
        '  - Prioritize top 3-5 questions',
        'Create user journey map showing complete user experience:',
        '  - Identify key actors (users, stakeholders)',
        '  - Map stages from discovery to goal completion',
        '  - Keep it simple (5-15 steps)',
        '  - Focus on one primary actor initially',
        'Conduct "Ask the Experts" interviews:',
        '  - Interview internal experts (15-30 min each)',
        '  - Marketing, sales, customer support, engineering, design',
        '  - Capture key insights, user problems, opportunities',
        '  - Take detailed notes on journey map',
        'Generate "How Might We" (HMW) notes:',
        '  - Turn problems and insights into opportunities',
        '  - Write as "How might we..." questions',
        '  - Create many HMWs (50-100+)',
        'Organize HMW notes:',
        '  - Group by themes',
        '  - Dot vote on most important HMWs',
        '  - Select top 10-15 HMWs to focus on',
        'Review lightning demos (competitive analysis, inspiration):',
        '  - Each person shares 3-min demo of relevant products/features',
        '  - Capture interesting elements and ideas',
        'Choose the target:',
        '  - Select the most critical part of journey map to focus on',
        '  - Usually one customer and one event on map',
        '  - Get decider approval on target',
        '  - This is where prototype will focus',
        'Document all Day 1 outputs comprehensively'
      ],
      outputFormat: 'JSON with longTermGoal (string), sprintQuestions (array), userJourneyMap (object), expertInsights (array), hmwQuestions (array), lightningDemos (array), sprintTarget (string), targetRationale (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['longTermGoal', 'sprintQuestions', 'userJourneyMap', 'hmwQuestions', 'sprintTarget', 'artifacts'],
      properties: {
        longTermGoal: { type: 'string' },
        sprintQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium'] },
              context: { type: 'string' }
            }
          }
        },
        userJourneyMap: {
          type: 'object',
          properties: {
            actor: { type: 'string' },
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } },
                  painPoints: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            endGoal: { type: 'string' }
          }
        },
        expertInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expert: { type: 'string' },
              role: { type: 'string' },
              keyInsights: { type: 'array', items: { type: 'string' } },
              quotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hmwQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              theme: { type: 'string' },
              votes: { type: 'number' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        lightningDemos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string' },
              presenter: { type: 'string' },
              interestingElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        inspirationSources: { type: 'array', items: { type: 'string' } },
        sprintTarget: { type: 'string' },
        targetRationale: { type: 'string' },
        targetOnMap: {
          type: 'object',
          properties: {
            actor: { type: 'string' },
            stage: { type: 'string' }
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
  labels: ['agent', 'design-sprint', 'day1', 'understand']
}));

// Task 3: Day 2 - Diverge
export const day2DivergeTask = defineTask('day2-diverge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Day 2 - Diverge and sketch competing solutions',
  agent: {
    name: 'sprint-facilitator-day2',
    prompt: {
      role: 'design sprint facilitator leading Day 2 activities',
      task: 'Facilitate Day 2 of design sprint: remix and improve, four-step sketch, and solution generation',
      context: args,
      instructions: [
        'Start with lightning demos (if not completed Day 1)',
        '  - Quick 3-min presentations of inspiring solutions',
        '  - Capture big ideas for later reference',
        'Divide or swarm (choose approach based on complexity):',
        '  - Divide: split large journey map into smaller chunks, assign to subteams',
        '  - Swarm: everyone focuses on same critical moment',
        'Four-step sketch process (everyone works individually):',
        'Step 1: Notes (20 minutes)',
        '  - Walk around room reviewing sprint materials',
        '  - Review journey map, HMW notes, inspiration',
        '  - Take notes, write down ideas, doodle',
        'Step 2: Ideas (20 minutes)',
        '  - Rough sketches, mind maps, diagrams',
        '  - Generate many ideas quickly',
        '  - Focus on quantity, not quality',
        '  - Build on lightning demos and notes',
        'Step 3: Crazy 8s (8 minutes)',
        '  - Fold paper into 8 frames',
        '  - Sketch 8 variations in 8 minutes (1 min each)',
        '  - Push for variety, think creatively',
        '  - Can be 8 variations of one idea or 8 different ideas',
        'Step 4: Solution Sketch (30-90 minutes)',
        '  - Create detailed 3-panel storyboard',
        '  - Self-explanatory: no verbal explanation needed',
        '  - Anonymous: don\'t put names on sketches',
        '  - Ugly is okay: fidelity doesn\'t matter',
        '  - Words matter: use clear titles and descriptions',
        '  - Give compelling title to solution',
        'Each participant creates their own solution sketch',
        'Ensure diversity of approaches and ideas',
        'Collect all solution sketches for Day 3 review',
        'Document all sketches and approaches comprehensively',
        'Capture notable ideas and innovative approaches'
      ],
      outputFormat: 'JSON with solutionSketches (array), crazy8s (array), diverseApproaches (boolean), notableIdeas (array), lightningDemos (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutionSketches', 'diverseApproaches', 'artifacts'],
      properties: {
        solutionSketches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              creator: { type: 'string' },
              description: { type: 'string' },
              approach: { type: 'string' },
              keyFeatures: { type: 'array', items: { type: 'string' } },
              storyboardFrames: { type: 'number' },
              sketchPath: { type: 'string' },
              innovativeElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        crazy8s: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participant: { type: 'string' },
              variations: { type: 'number' },
              favoriteVariation: { type: 'string' }
            }
          }
        },
        diverseApproaches: { type: 'boolean' },
        approachesCount: { type: 'number' },
        notableIdeas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              source: { type: 'string' },
              potential: { type: 'string' }
            }
          }
        },
        lightningDemos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string' },
              keyTakeaway: { type: 'string' }
            }
          }
        },
        participationMetrics: {
          type: 'object',
          properties: {
            totalSketches: { type: 'number' },
            participationRate: { type: 'string' },
            engagementLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
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
  labels: ['agent', 'design-sprint', 'day2', 'diverge']
}));

// Task 4: Day 3 - Decide
export const day3DecideTask = defineTask('day3-decide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Day 3 - Decide on the best solution',
  agent: {
    name: 'sprint-facilitator-day3',
    prompt: {
      role: 'design sprint facilitator leading Day 3 activities',
      task: 'Facilitate Day 3 of design sprint: critique solutions, vote on best ideas, and create storyboard for prototype',
      context: args,
      instructions: [
        'Display all solution sketches on wall (or digital board)',
        'Art Museum (silent review):',
        '  - Everyone walks around reviewing all sketches (15-20 min)',
        '  - Silent review - no discussion yet',
        '  - Use sticky dots to mark interesting ideas',
        '  - Don\'t worry about winners yet, just note interesting parts',
        'Heat Map voting:',
        '  - Each person gets unlimited dot stickers',
        '  - Place dots on interesting ideas, features, approaches',
        '  - Cluster of dots = "heat map" of most interesting ideas',
        'Speed Critique (3 min per sketch):',
        '  - Review each sketch with team discussion',
        '  - Facilitator narrates what they see',
        '  - Team calls out standout ideas',
        '  - Sketch creator stays silent (anonymous)',
        '  - Capture standout ideas on sketch with labels',
        'Straw Poll vote:',
        '  - Each person gets 1 vote (large dot or special sticker)',
        '  - Vote for best solution to prototype',
        '  - Explain reasoning briefly',
        'Decider Vote:',
        '  - Decider gets 3 votes (or supervote)',
        '  - Breaks ties, makes final decision',
        '  - Winning solution(s) selected',
        'Handle conflicts and rumbles:',
        '  - If conflicting ideas: Rumble (battle of ideas)',
        '  - Or: decide to prototype multiple solutions to test',
        '  - Or: all-in-one approach (combine best ideas)',
        '  - Decider makes final call',
        'Create storyboard for prototype:',
        '  - Use winning solution as base',
        '  - Create 10-15 frame storyboard',
        '  - Start with opening scene (how user discovers solution)',
        '  - Show each step user takes',
        '  - End with successful outcome',
        '  - Include existing products/touchpoints where user starts',
        '  - Fill in gaps with best ideas from other sketches',
        '  - Get team buy-in on storyboard',
        'Document decisions and rationale',
        'Generate prototype-ready storyboard'
      ],
      outputFormat: 'JSON with heatMapResults (object), speedCritiqueNotes (array), votingResults (object), winningSolution (object), conflictingIdeasHandled (boolean), rumblesResolved (array), storyboard (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['winningSolution', 'storyboard', 'artifacts'],
      properties: {
        heatMapResults: {
          type: 'object',
          properties: {
            topIdeas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idea: { type: 'string' },
                  sketch: { type: 'string' },
                  votes: { type: 'number' }
                }
              }
            }
          }
        },
        speedCritiqueNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sketch: { type: 'string' },
              standoutIdeas: { type: 'array', items: { type: 'string' } },
              concerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        votingResults: {
          type: 'object',
          properties: {
            strawPoll: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sketch: { type: 'string' },
                  votes: { type: 'number' }
                }
              }
            },
            deciderVotes: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        winningSolution: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            creator: { type: 'string' },
            approach: { type: 'string' },
            keyFeatures: { type: 'array', items: { type: 'string' } },
            whyItWon: { type: 'string' },
            rationale: { type: 'string' },
            borrowedIdeas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idea: { type: 'string' },
                  fromSketch: { type: 'string' }
                }
              }
            }
          }
        },
        conflictingIdeasHandled: { type: 'boolean' },
        rumblesResolved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conflict: { type: 'string' },
              resolution: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        storyboard: {
          type: 'object',
          properties: {
            frames: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  frameNumber: { type: 'number' },
                  scene: { type: 'string' },
                  description: { type: 'string' },
                  userAction: { type: 'string' },
                  systemResponse: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            openingScene: { type: 'string' },
            successOutcome: { type: 'string' },
            estimatedUserTime: { type: 'string' }
          }
        },
        decisionLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'design-sprint', 'day3', 'decide']
}));

// Task 5: Day 4 - Prototype
export const day4PrototypeTask = defineTask('day4-prototype', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Day 4 - Build a realistic prototype',
  agent: {
    name: 'sprint-prototyper',
    prompt: {
      role: 'design sprint prototyper and UX designer',
      task: 'Build realistic, high-fidelity facade prototype that brings storyboard to life for user testing',
      context: args,
      instructions: [
        'Mindset: "Prototype is a facade - fake it"',
        '  - Focus on front-end only',
        '  - Create appearance of real product',
        '  - Don\'t build real functionality',
        '  - Use existing tools, components, stock images',
        'Choose the right tool:',
        '  - Keynote/PowerPoint for screen-based prototypes',
        '  - Figma/Sketch for interactive prototypes',
        '  - InVision/Marvel for clickable prototypes',
        '  - Code (HTML/CSS) for web experiences',
        '  - Use whatever is fastest for team',
        'Divide and conquer (assign roles):',
        '  - Maker(s): build the prototype screens',
        '  - Stitcher: connect screens into flow',
        '  - Writer: write realistic copy',
        '  - Asset Collector: gather images, icons, data',
        '  - Interviewer: write interview script (start early)',
        'Build storyboard frame by frame:',
        '  - Create each screen/state from storyboard',
        '  - Use realistic content and copy',
        '  - Include actual brand elements if available',
        '  - Make it look real (users should believe it)',
        'Connect the prototype:',
        '  - Link screens together following user flow',
        '  - Only prototype the path being tested',
        '  - Add clickable hotspots for buttons/links',
        '  - Test the prototype flow yourselves',
        'Do trial run:',
        '  - Test prototype with someone not on sprint team',
        '  - Fix issues, smooth rough edges',
        '  - Ensure realistic timing and flow',
        'Goldilocks quality: not too high, not too low',
        '  - High enough to feel real',
        '  - Low enough to be disposable',
        '  - Can be built in 1 day',
        'Prepare for testing:',
        '  - Ensure prototype runs smoothly',
        '  - Have backup plan for tech failures',
        '  - Create realistic test environment',
        'Document prototype and interactions'
      ],
      outputFormat: 'JSON with prototypeUrl (string), totalScreens (number), interactions (array), fidelity (string), userFlow (array), realisticElements (array), assetTypes (array), testingReadiness (boolean), qualityScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeUrl', 'totalScreens', 'interactions', 'testingReadiness', 'artifacts'],
      properties: {
        prototypeUrl: { type: 'string' },
        prototypeTool: { type: 'string' },
        totalScreens: { type: 'number' },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromScreen: { type: 'string' },
              toScreen: { type: 'string' },
              trigger: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        fidelity: { type: 'string', enum: ['high-fidelity-facade', 'medium-fidelity', 'low-fidelity'] },
        userFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              screen: { type: 'string' },
              action: { type: 'string' },
              expectedTime: { type: 'string' }
            }
          }
        },
        realisticElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              approach: { type: 'string' }
            }
          }
        },
        assetTypes: { type: 'array', items: { type: 'string' } },
        copy: {
          type: 'object',
          properties: {
            realistic: { type: 'boolean' },
            voiceAndTone: { type: 'string' },
            keyMessages: { type: 'array', items: { type: 'string' } }
          }
        },
        teamRoles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              person: { type: 'string' },
              contribution: { type: 'string' }
            }
          }
        },
        trialRunResults: {
          type: 'object',
          properties: {
            conducted: { type: 'boolean' },
            issuesFound: { type: 'array', items: { type: 'string' } },
            issuesFixed: { type: 'array', items: { type: 'string' } }
          }
        },
        testingReadiness: { type: 'boolean' },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        goldilocksPrinciple: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-sprint', 'day4', 'prototype']
}));

// Task 6: Test Preparation
export const testPreparationTask = defineTask('test-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for user testing',
  agent: {
    name: 'sprint-test-coordinator',
    prompt: {
      role: 'UX researcher and test coordinator',
      task: 'Recruit test participants, prepare interview script, and set up testing environment for Day 5',
      context: args,
      instructions: [
        'Recruit 5 test participants matching target user criteria',
        '  - Screen for representative users',
        '  - Diverse perspectives within target audience',
        '  - Confirm availability for Day 5',
        '  - Over-recruit by 1-2 as backup',
        'Prepare interview script using "Five-Act Interview" structure:',
        'Act 1: Friendly Welcome (5 min)',
        '  - Thank participant',
        '  - Explain process: testing prototype, not testing them',
        '  - Get comfortable, permission to record',
        'Act 2: Context Questions (5-10 min)',
        '  - Learn about participant background',
        '  - Understand their current experience with problem',
        '  - Build context, make them comfortable',
        'Act 3: Introduce the Prototype (5 min)',
        '  - Explain scenario and task',
        '  - Remind them to think aloud',
        '  - Assure them it\'s not a real product',
        'Act 4: Tasks and Nudges (20-30 min)',
        '  - Give specific tasks aligned with storyboard',
        '  - Let them explore and react naturally',
        '  - Use planned nudges if they get stuck',
        '  - Observe, take notes, ask follow-up questions',
        'Act 5: Quick Debrief (5 min)',
        '  - Ask wrap-up questions',
        '  - Get overall impressions',
        '  - Thank them again',
        'Prepare interview guide with:',
        '  - Specific task descriptions',
        '  - Follow-up questions',
        '  - Nudges for if participants get stuck',
        '  - Sprint questions to investigate',
        'Set up testing environment:',
        '  - Remote: video call, screen sharing, recording',
        '  - In-person: private room, recording equipment',
        '  - Prepare observation setup for team',
        'Create observation template and note-taking system',
        'Brief team on roles: interviewer, note-takers, observers',
        'Schedule 5 interviews back-to-back with breaks',
        'Prepare incentives/compensation for participants'
      ],
      outputFormat: 'JSON with confirmedParticipants (array), interviewScript (object), interviewSchedule (array), testingEnvironment (object), observationSetup (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedParticipants', 'interviewScript', 'artifacts'],
      properties: {
        confirmedParticipants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              pseudonym: { type: 'string' },
              matchesTargetCriteria: { type: 'boolean' },
              background: { type: 'string' },
              scheduledTime: { type: 'string' }
            }
          }
        },
        backupParticipants: { type: 'number' },
        interviewScript: {
          type: 'object',
          properties: {
            friendlyWelcome: { type: 'string' },
            contextQuestions: { type: 'array', items: { type: 'string' } },
            prototypeIntroduction: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskNumber: { type: 'number' },
                  taskDescription: { type: 'string' },
                  successCriteria: { type: 'string' },
                  nudges: { type: 'array', items: { type: 'string' } },
                  followUpQuestions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            debriefQuestions: { type: 'array', items: { type: 'string' } },
            sprintQuestionsToInvestigate: { type: 'array', items: { type: 'string' } }
          }
        },
        interviewSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              participant: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        testingEnvironment: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            recordingSetup: { type: 'string' },
            backupPlan: { type: 'string' }
          }
        },
        observationSetup: {
          type: 'object',
          properties: {
            interviewer: { type: 'string' },
            noteTakers: { type: 'array', items: { type: 'string' } },
            observers: { type: 'array', items: { type: 'string' } },
            noteTemplate: { type: 'string' }
          }
        },
        incentives: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            amount: { type: 'string' },
            distributionMethod: { type: 'string' }
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
  labels: ['agent', 'design-sprint', 'test-preparation']
}));

// Task 7: Day 5 - Test
export const day5TestTask = defineTask('day5-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Day 5 - Test with real users',
  agent: {
    name: 'sprint-researcher',
    prompt: {
      role: 'UX researcher conducting design sprint user interviews',
      task: 'Conduct 5 user interviews testing prototype, observe reactions, collect insights, and identify patterns',
      context: args,
      instructions: [
        'Set up interview and observation room',
        '  - Test recording equipment',
        '  - Brief observers on silence and note-taking',
        '  - Prepare observation board for tracking patterns',
        'Conduct 5 back-to-back user interviews:',
        'For each interview (60 minutes):',
        '  - Follow Five-Act Interview script',
        '  - Make participant comfortable, explain process',
        '  - Ask context questions to understand background',
        '  - Introduce prototype and task',
        '  - Observe participant using prototype',
        '  - Encourage think-aloud protocol',
        '  - Take detailed notes on reactions, confusion, delight',
        '  - Note exact quotes verbatim',
        '  - Ask follow-up questions',
        '  - Investigate sprint questions',
        '  - Observe non-verbal cues and emotional responses',
        '  - Debrief and thank participant',
        'Between interviews:',
        '  - Team huddle (10-15 min)',
        '  - Share observations',
        '  - Update pattern tracking',
        '  - Adjust interview approach if needed',
        'Track patterns in real-time on observation board:',
        '  - Create columns for each sprint question',
        '  - Use tick marks to track positive/negative/neutral patterns',
        '  - Note recurring behaviors, comments, pain points',
        '  - Track task success/failure rates',
        'Look for patterns across interviews:',
        '  - Did users understand the value proposition?',
        '  - Could they complete critical tasks?',
        '  - Where did they get confused or stuck?',
        '  - What delighted them?',
        '  - What concerns did they raise?',
        '  - Did patterns emerge by interview 3-4?',
        'Answer sprint questions based on observations',
        'Calculate success metrics:',
        '  - Task completion rates',
        '  - Time on task',
        '  - Error rates',
        '  - Satisfaction ratings',
        'Collect memorable quotes and reactions',
        'Document all findings comprehensively',
        'Generate test results summary'
      ],
      outputFormat: 'JSON with interviewsCompleted (number), interviewSummaries (array), patterns (array), sprintQuestionsAnswered (array), successRate (string), taskMetrics (object), quotes (array), positiveReactions (array), negativeReactions (array), majorInsights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewsCompleted', 'interviewSummaries', 'patterns', 'sprintQuestionsAnswered', 'majorInsights', 'artifacts'],
      properties: {
        interviewsCompleted: { type: 'number' },
        interviewSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participant: { type: 'string' },
              background: { type: 'string' },
              taskSuccessRate: { type: 'string' },
              keyObservations: { type: 'array', items: { type: 'string' } },
              memorableQuotes: { type: 'array', items: { type: 'string' } },
              emotionalReactions: { type: 'array', items: { type: 'string' } },
              confusionPoints: { type: 'array', items: { type: 'string' } },
              delightMoments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
              occurrences: { type: 'number' },
              context: { type: 'string' }
            }
          }
        },
        sprintQuestionsAnswered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              supportingEvidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successRate: { type: 'string' },
        taskMetrics: {
          type: 'object',
          properties: {
            primaryTaskSuccess: { type: 'number', minimum: 0, maximum: 100 },
            averageCompletionTime: { type: 'string' },
            errorRate: { type: 'number' },
            satisfactionScore: { type: 'number', minimum: 1, maximum: 7 }
          }
        },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              participant: { type: 'string' },
              context: { type: 'string' },
              sentiment: { type: 'string' }
            }
          }
        },
        positiveReactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reaction: { type: 'string' },
              frequency: { type: 'number' },
              aspect: { type: 'string' }
            }
          }
        },
        negativeReactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reaction: { type: 'string' },
              frequency: { type: 'number' },
              aspect: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major', 'critical'] }
            }
          }
        },
        majorInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              implication: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        usabilityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              occurrences: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        validationStatus: {
          type: 'object',
          properties: {
            conceptValidated: { type: 'boolean' },
            valuePropositionClear: { type: 'boolean' },
            usabilityAcceptable: { type: 'boolean' },
            marketFitIndicated: { type: 'boolean' }
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
  labels: ['agent', 'design-sprint', 'day5', 'test', 'user-research']
}));

// Task 8: Insights Synthesis
export const insightsSynthesisTask = defineTask('insights-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize test results and extract insights',
  agent: {
    name: 'sprint-analyst',
    prompt: {
      role: 'senior UX strategist and insights specialist',
      task: 'Synthesize all test results to extract key insights, validate hypotheses, and determine learning outcomes',
      context: args,
      instructions: [
        'Review all test interview data comprehensively',
        'Identify recurring themes and patterns across interviews',
        'Synthesize patterns into actionable insights',
        'Validate or invalidate sprint questions:',
        '  - Which questions were answered definitively?',
        '  - What evidence supports conclusions?',
        '  - What remains uncertain?',
        'Evaluate solution validation:',
        '  - Did users understand the concept?',
        '  - Did it solve their problem?',
        '  - Would they use it?',
        '  - What was missing or confusing?',
        'Identify what worked:',
        '  - Features users loved',
        '  - Successful interactions',
        '  - Clear value propositions',
        '  - Effective design decisions',
        'Identify what didn\'t work:',
        '  - Confusion points',
        '  - Failed interactions',
        '  - Unmet expectations',
        '  - Problematic assumptions',
        'Extract surprising findings:',
        '  - Unexpected behaviors',
        '  - Contradictions to assumptions',
        '  - New opportunities discovered',
        'Assess hypotheses validation:',
        '  - Which hypotheses were validated?',
        '  - Which were invalidated?',
        '  - Which need more testing?',
        'Determine confidence level in findings',
        'Identify gaps requiring additional research',
        'Generate comprehensive insights report'
      ],
      outputFormat: 'JSON with keyInsights (array), validatedHypotheses (array), invalidatedHypotheses (array), whatWorked (array), whatDidntWork (array), surprisingFindings (array), uncertainties (array), confidenceLevel (string), researchGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyInsights', 'validatedHypotheses', 'invalidatedHypotheses', 'whatWorked', 'whatDidntWork', 'artifacts'],
      properties: {
        keyInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              implication: { type: 'string' },
              actionability: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        validatedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              validation: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        invalidatedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              whyInvalidated: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              alternative: { type: 'string' }
            }
          }
        },
        whatWorked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              whyItWorked: { type: 'string' },
              userReactions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        whatDidntWork: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              problem: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major', 'critical'] },
              potentialFix: { type: 'string' }
            }
          }
        },
        surprisingFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        uncertainties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              partialEvidence: { type: 'array', items: { type: 'string' } },
              additionalResearchNeeded: { type: 'string' }
            }
          }
        },
        conceptValidation: {
          type: 'object',
          properties: {
            conceptValidated: { type: 'boolean' },
            valuePropositionClear: { type: 'boolean' },
            solvesProblem: { type: 'boolean' },
            userWillingness: { type: 'string' }
          }
        },
        confidenceLevel: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
        researchGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-sprint', 'synthesis', 'insights']
}));

// Task 9: Decisions and Recommendations
export const decisionsRecommendationsTask = defineTask('decisions-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate decisions and next-step recommendations',
  agent: {
    name: 'sprint-strategist',
    prompt: {
      role: 'product strategist and decision framework expert',
      task: 'Synthesize insights into clear decisions and actionable next-step recommendations',
      context: args,
      instructions: [
        'Review all insights and test results',
        'Frame key decisions based on sprint outcomes:',
        '  - Build: Concept validated, move forward with development',
        '  - Iterate: Concept has potential, needs refinement',
        '  - Pivot: Concept didn\'t validate, try different approach',
        '  - Kill: Concept fundamentally flawed, stop pursuing',
        'For each decision:',
        '  - State decision clearly',
        '  - Provide rationale based on evidence',
        '  - Assess confidence level',
        '  - Define success criteria',
        'Recommend primary action:',
        '  - What should team do next?',
        '  - What is highest priority?',
        '  - What timeline makes sense?',
        'Define immediate next steps (1-2 weeks):',
        '  - Specific actions to take',
        '  - Who should own each action',
        '  - Dependencies and blockers',
        'Define short-term next steps (1-3 months):',
        '  - Development priorities',
        '  - Additional research needed',
        '  - Feature refinements',
        'Define long-term initiatives (3-12 months):',
        '  - Strategic directions',
        '  - Major feature development',
        '  - Market expansion',
        'Identify risks and mitigation strategies',
        'Define metrics for measuring success',
        'Create contingency plans for different scenarios',
        'Provide roadmap recommendations',
        'Generate decision framework document'
      ],
      outputFormat: 'JSON with recommendedAction (string), decisions (array), nextSteps (object), roadmapRecommendations (array), successMetrics (array), risks (array), contingencies (array), confidenceLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedAction', 'decisions', 'nextSteps', 'artifacts'],
      properties: {
        recommendedAction: { type: 'string', enum: ['build', 'iterate', 'pivot', 'kill', 'explore-further'] },
        recommendationRationale: { type: 'string' },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        nextSteps: {
          type: 'object',
          properties: {
            immediate: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  owner: { type: 'string' },
                  timeline: { type: 'string' },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                }
              }
            },
            shortTerm: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  initiative: { type: 'string' },
                  description: { type: 'string' },
                  timeline: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            longTerm: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  initiative: { type: 'string' },
                  description: { type: 'string' },
                  strategicValue: { type: 'string' },
                  timeline: { type: 'string' }
                }
              }
            },
            contingencies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            }
          }
        },
        roadmapRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              rationale: { type: 'string' },
              estimatedEffort: { type: 'string' },
              userValue: { type: 'string' }
            }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
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
        confidenceLevel: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
        additionalResearchNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              method: { type: 'string' },
              priority: { type: 'string' }
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
  labels: ['agent', 'design-sprint', 'decisions', 'strategy']
}));

// Task 10: Sprint Report Generation
export const sprintReportGenerationTask = defineTask('sprint-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive design sprint report',
  agent: {
    name: 'sprint-documenter',
    prompt: {
      role: 'design sprint facilitator and technical writer',
      task: 'Create comprehensive design sprint report documenting entire process, outcomes, insights, and recommendations',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Sprint goal and challenge',
        '  - Key outcomes and decisions',
        '  - Recommended action',
        '  - Major insights',
        '  - Next steps',
        'Document sprint overview:',
        '  - Challenge statement',
        '  - Sprint goal',
        '  - Participants and roles',
        '  - Duration and format',
        '  - Timeline',
        'Day 1 - Understand summary:',
        '  - Long-term goal',
        '  - Sprint questions',
        '  - User journey map',
        '  - Expert insights',
        '  - HMW questions',
        '  - Sprint target',
        'Day 2 - Diverge summary:',
        '  - Solution sketches created',
        '  - Diverse approaches explored',
        '  - Notable ideas',
        'Day 3 - Decide summary:',
        '  - Voting results',
        '  - Winning solution',
        '  - Decision rationale',
        '  - Storyboard',
        'Day 4 - Prototype summary:',
        '  - Prototype overview',
        '  - Screens and interactions',
        '  - Realistic elements',
        '  - Link to prototype',
        'Day 5 - Test summary:',
        '  - Participants interviewed',
        '  - Success metrics',
        '  - Patterns observed',
        '  - Major insights',
        '  - Memorable quotes',
        'Insights and learnings:',
        '  - Key insights',
        '  - Validated hypotheses',
        '  - Invalidated hypotheses',
        '  - What worked',
        '  - What didn\'t work',
        '  - Surprising findings',
        'Decisions and recommendations:',
        '  - Primary recommendation',
        '  - Supporting decisions',
        '  - Next steps',
        '  - Roadmap recommendations',
        '  - Success metrics',
        'Appendices:',
        '  - Sprint materials',
        '  - Interview transcripts',
        '  - Full storyboard',
        '  - Additional quotes',
        '  - Research artifacts',
        'Format as professional, visual, engaging document',
        'Include screenshots, diagrams, and visuals',
        'Make it shareable with stakeholders',
        'Ensure actionable and decision-focused'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), sprintOverview (object), dayByDaySummary (object), insightsSection (object), decisionsSection (object), appendices (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'sprintOverview', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sprintOverview: {
          type: 'object',
          properties: {
            challenge: { type: 'string' },
            goal: { type: 'string' },
            duration: { type: 'string' },
            format: { type: 'string' },
            participants: { type: 'number' }
          }
        },
        dayByDaySummary: {
          type: 'object',
          properties: {
            day1Highlights: { type: 'array', items: { type: 'string' } },
            day2Highlights: { type: 'array', items: { type: 'string' } },
            day3Highlights: { type: 'array', items: { type: 'string' } },
            day4Highlights: { type: 'array', items: { type: 'string' } },
            day5Highlights: { type: 'array', items: { type: 'string' } }
          }
        },
        insightsSection: {
          type: 'object',
          properties: {
            keyInsightsCount: { type: 'number' },
            validatedCount: { type: 'number' },
            invalidatedCount: { type: 'number' },
            topInsights: { type: 'array', items: { type: 'string' } }
          }
        },
        decisionsSection: {
          type: 'object',
          properties: {
            recommendedAction: { type: 'string' },
            decisionsCount: { type: 'number' },
            nextStepsCount: { type: 'number' }
          }
        },
        appendices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        readinessForStakeholders: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-sprint', 'documentation', 'reporting']
}));

// Task 11: Sprint Quality Scoring
export const sprintQualityScoringTask = defineTask('sprint-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score sprint quality and outcomes',
  agent: {
    name: 'sprint-evaluator',
    prompt: {
      role: 'principal design sprint expert and quality auditor',
      task: 'Evaluate overall design sprint quality, process rigor, and outcome value',
      context: args,
      instructions: [
        'Evaluate sprint planning and preparation (weight: 15%):',
        '  - Clear challenge and goal defined?',
        '  - Right participants involved?',
        '  - Adequate preparation and logistics?',
        'Evaluate Day 1-3 process quality (weight: 20%):',
        '  - Comprehensive problem understanding?',
        '  - Diverse solutions explored?',
        '  - Effective decision-making?',
        '  - Team engagement and participation?',
        'Evaluate prototype quality (weight: 15%):',
        '  - Realistic and testable?',
        '  - Aligned with storyboard?',
        '  - Appropriate fidelity?',
        'Evaluate testing rigor (weight: 20%):',
        '  - Appropriate participants recruited?',
        '  - Effective interview conduct?',
        '  - Rich data collected?',
        '  - Patterns identified?',
        'Evaluate insights quality (weight: 15%):',
        '  - Sprint questions answered?',
        '  - Actionable insights generated?',
        '  - Clear validation/invalidation?',
        '  - Surprising findings uncovered?',
        'Evaluate decisions and recommendations (weight: 15%):',
        '  - Clear recommended action?',
        '  - Well-supported decisions?',
        '  - Specific next steps?',
        '  - Practical roadmap?',
        'Calculate weighted overall score (0-100)',
        'Assess learning value: what did team learn?',
        'Assess risk reduction: what uncertainties were reduced?',
        'Assess time efficiency: appropriate use of sprint method?',
        'Identify strengths of this sprint',
        'Identify areas for improvement',
        'Provide recommendations for future sprints'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), learningValue (string), riskReduction (string), strengths (array), improvementAreas (array), futureRecommendations (array), sprintQuestionsAnswered (number), confidenceInOutcome (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'learningValue', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            planningPreparation: { type: 'number' },
            processQuality: { type: 'number' },
            prototypeQuality: { type: 'number' },
            testingRigor: { type: 'number' },
            insightsQuality: { type: 'number' },
            decisionsRecommendations: { type: 'number' }
          }
        },
        learningValue: { type: 'string', enum: ['transformative', 'high', 'medium', 'low'] },
        riskReduction: { type: 'string', enum: ['significant', 'moderate', 'minimal', 'none'] },
        sprintQuestionsAnswered: { type: 'number' },
        sprintQuestionsTotal: { type: 'number' },
        answerRate: { type: 'string' },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        improvementAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        futureRecommendations: { type: 'array', items: { type: 'string' } },
        confidenceInOutcome: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
        timeEfficiency: {
          type: 'object',
          properties: {
            appropriateMethod: { type: 'boolean' },
            valueForTime: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            pacing: { type: 'string' }
          }
        },
        teamPerformance: {
          type: 'object',
          properties: {
            engagement: { type: 'string', enum: ['high', 'medium', 'low'] },
            collaboration: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            decisionMaking: { type: 'string', enum: ['effective', 'adequate', 'challenged'] }
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
  labels: ['agent', 'design-sprint', 'quality-scoring', 'evaluation']
}));

// Task 12: Stakeholder Presentation
export const stakeholderPresentationTask = defineTask('stakeholder-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare stakeholder presentation',
  agent: {
    name: 'presentation-designer',
    prompt: {
      role: 'design sprint facilitator and executive communicator',
      task: 'Create compelling stakeholder presentation summarizing sprint outcomes and recommendations',
      context: args,
      instructions: [
        'Create executive-ready presentation (15-30 slides):',
        'Slide 1: Title and sprint overview',
        'Slide 2-3: Challenge and sprint goal',
        'Slide 4-5: Sprint process overview (5 days)',
        'Slide 6: Team and participants',
        'Slide 7-8: Key insights (3-5 major insights)',
        'Slide 9-10: Prototype showcase',
        '  - Include screenshots',
        '  - Link to prototype',
        '  - Show user flow',
        'Slide 11-12: Testing results',
        '  - Success metrics',
        '  - User reactions',
        '  - Quotes',
        'Slide 13-14: What worked / What didn\'t work',
        'Slide 15-16: Validated and invalidated hypotheses',
        'Slide 17: Surprising findings',
        'Slide 18-19: Recommended action and rationale',
        'Slide 20-22: Next steps (immediate, short-term, long-term)',
        'Slide 23: Success metrics and timeline',
        'Slide 24: Risks and mitigation',
        'Slide 25: Q&A',
        'Make it visual and engaging:',
        '  - Use screenshots and diagrams',
        '  - Highlight quotes',
        '  - Use data visualizations',
        '  - Keep text minimal',
        'Focus on business value and ROI',
        'Tell compelling story with narrative arc',
        'Make recommendation clear and actionable',
        'Prepare speaker notes for each slide',
        'Create presentation handout/leave-behind'
      ],
      outputFormat: 'JSON with presentationPath (string), executiveSummary (string), keySlides (array), narrativeArc (string), speakerNotes (object), handoutPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'executiveSummary', 'keySlides', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keySlides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slideNumber: { type: 'number' },
              title: { type: 'string' },
              content: { type: 'string' },
              visualType: { type: 'string' }
            }
          }
        },
        narrativeArc: { type: 'string' },
        speakerNotes: {
          type: 'object',
          properties: {
            keyMessages: { type: 'array', items: { type: 'string' } },
            anticipatedQuestions: { type: 'array', items: { type: 'string' } },
            talkingPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        handoutPath: { type: 'string' },
        targetAudience: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        callToAction: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-sprint', 'presentation', 'stakeholders']
}));
