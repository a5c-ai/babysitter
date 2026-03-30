/**
 * @process ux-ui-design/user-research
 * @description User Research and Discovery process with research planning, participant recruitment, data collection, synthesis, insight generation, and deliverable creation
 * @inputs { projectName: string, researchObjectives: array, researchMethods: array, participantCriteria: object, timeline: string, budget: object, outputDir: string }
 * @outputs { success: boolean, researchReport: string, insights: array, personas: array, artifacts: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    researchObjectives = [],
    researchMethods = ['interviews', 'surveys', 'usability-testing'],
    participantCriteria = {},
    participantCount = 10,
    timeline = '4 weeks',
    budget = {},
    outputDir = 'user-research-output',
    targetInsightQuality = 85,
    generatePersonas = true,
    generateJourneyMaps = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting User Research and Discovery for ${projectName}`);

  // ============================================================================
  // PHASE 1: RESEARCH PLANNING AND SCOPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning research scope and methodology');
  const researchPlanning = await ctx.task(researchPlanningTask, {
    projectName,
    researchObjectives,
    researchMethods,
    participantCriteria,
    participantCount,
    timeline,
    budget,
    outputDir
  });

  artifacts.push(...researchPlanning.artifacts);

  if (!researchPlanning.planApproved) {
    ctx.log('warn', 'Research plan needs refinement');
    return {
      success: false,
      reason: 'Research plan quality insufficient',
      recommendations: researchPlanning.recommendations,
      metadata: {
        processId: 'ux-ui-design/user-research',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: PARTICIPANT RECRUITMENT AND SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 2: Recruiting and screening research participants');
  const participantRecruitment = await ctx.task(participantRecruitmentTask, {
    projectName,
    participantCriteria: researchPlanning.refinedCriteria,
    participantCount,
    researchMethods: researchPlanning.selectedMethods,
    screenerQuestions: researchPlanning.screenerQuestions,
    incentives: budget.incentives || {},
    outputDir
  });

  artifacts.push(...participantRecruitment.artifacts);

  // ============================================================================
  // PHASE 3: RESEARCH PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing research protocols and guides');
  const protocolDevelopment = await ctx.task(protocolDevelopmentTask, {
    projectName,
    researchObjectives: researchPlanning.refinedObjectives,
    researchMethods: researchPlanning.selectedMethods,
    participantProfiles: participantRecruitment.participantProfiles,
    outputDir
  });

  artifacts.push(...protocolDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: QUALITATIVE DATA COLLECTION
  // ============================================================================

  const qualitativeResults = [];
  const qualitativeMethods = researchPlanning.selectedMethods.filter(m =>
    ['interviews', 'contextual-inquiry', 'focus-groups', 'usability-testing', 'diary-studies'].includes(m.method)
  );

  if (qualitativeMethods.length > 0) {
    ctx.log('info', 'Phase 4: Conducting qualitative research');

    const qualitativeDataCollection = await ctx.task(qualitativeDataCollectionTask, {
      projectName,
      researchMethods: qualitativeMethods,
      protocols: protocolDevelopment.protocols,
      participants: participantRecruitment.confirmedParticipants,
      outputDir
    });

    artifacts.push(...qualitativeDataCollection.artifacts);
    qualitativeResults.push(qualitativeDataCollection);
  }

  // ============================================================================
  // PHASE 5: QUANTITATIVE DATA COLLECTION
  // ============================================================================

  const quantitativeResults = [];
  const quantitativeMethods = researchPlanning.selectedMethods.filter(m =>
    ['surveys', 'analytics', 'card-sorting', 'tree-testing', 'first-click-testing'].includes(m.method)
  );

  if (quantitativeMethods.length > 0) {
    ctx.log('info', 'Phase 5: Conducting quantitative research');

    const quantitativeDataCollection = await ctx.task(quantitativeDataCollectionTask, {
      projectName,
      researchMethods: quantitativeMethods,
      protocols: protocolDevelopment.protocols,
      participantCount,
      outputDir
    });

    artifacts.push(...quantitativeDataCollection.artifacts);
    quantitativeResults.push(quantitativeDataCollection);
  }

  // ============================================================================
  // PHASE 6: DATA SYNTHESIS AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing research data and extracting insights');
  const dataSynthesis = await ctx.task(dataSynthesisTask, {
    projectName,
    researchObjectives: researchPlanning.refinedObjectives,
    qualitativeData: qualitativeResults,
    quantitativeData: quantitativeResults,
    researchMethods: researchPlanning.selectedMethods,
    outputDir
  });

  artifacts.push(...dataSynthesis.artifacts);

  // ============================================================================
  // PHASE 7: INSIGHT GENERATION AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating and prioritizing actionable insights');
  const insightGeneration = await ctx.task(insightGenerationTask, {
    projectName,
    researchObjectives: researchPlanning.refinedObjectives,
    synthesisFindings: dataSynthesis.findings,
    themes: dataSynthesis.themes,
    patterns: dataSynthesis.patterns,
    outputDir
  });

  artifacts.push(...insightGeneration.artifacts);

  // ============================================================================
  // PHASE 8: PERSONA CREATION (if requested)
  // ============================================================================

  let personaCreation = null;
  if (generatePersonas && dataSynthesis.sufficientDataForPersonas) {
    ctx.log('info', 'Phase 8: Creating research-based personas');
    personaCreation = await ctx.task(personaCreationTask, {
      projectName,
      researchFindings: dataSynthesis.findings,
      userSegments: dataSynthesis.userSegments,
      behavioralPatterns: dataSynthesis.patterns,
      outputDir
    });
    artifacts.push(...personaCreation.artifacts);
  }

  // ============================================================================
  // PHASE 9: JOURNEY MAPPING (if requested)
  // ============================================================================

  let journeyMapping = null;
  if (generateJourneyMaps && dataSynthesis.sufficientDataForJourneys) {
    ctx.log('info', 'Phase 9: Creating user journey maps');
    journeyMapping = await ctx.task(journeyMappingTask, {
      projectName,
      researchFindings: dataSynthesis.findings,
      personas: personaCreation ? personaCreation.personas : [],
      touchpoints: dataSynthesis.touchpoints,
      painPoints: dataSynthesis.painPoints,
      outputDir
    });
    artifacts.push(...journeyMapping.artifacts);
  }

  // ============================================================================
  // PHASE 10: RESEARCH REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive research report');
  const researchReport = await ctx.task(researchReportGenerationTask, {
    projectName,
    researchPlanning,
    participantRecruitment,
    qualitativeResults,
    quantitativeResults,
    dataSynthesis,
    insightGeneration,
    personaCreation,
    journeyMapping,
    outputDir
  });

  artifacts.push(...researchReport.artifacts);

  // ============================================================================
  // PHASE 11: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Evaluating research quality and completeness');
  const qualityScore = await ctx.task(researchQualityScoringTask, {
    projectName,
    researchObjectives: researchPlanning.refinedObjectives,
    participantCount: participantRecruitment.confirmedParticipants.length,
    methodsDiversity: researchPlanning.selectedMethods.length,
    dataSynthesis,
    insightGeneration,
    researchReport,
    targetInsightQuality,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= targetInsightQuality;

  // Breakpoint: Review research findings
  await ctx.breakpoint({
    question: `User research complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Research meets quality standards!' : 'Research may need additional investigation.'} Review findings?`,
    title: 'User Research Review',
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
        qualityScore: qualityScore.overallScore,
        qualityMet,
        participantsRecruited: participantRecruitment.confirmedParticipants.length,
        methodsUsed: researchPlanning.selectedMethods.length,
        insightsGenerated: insightGeneration.insights.length,
        personasCreated: personaCreation ? personaCreation.personas.length : 0,
        journeyMapsCreated: journeyMapping ? journeyMapping.journeyMaps.length : 0,
        keyThemes: dataSynthesis.themes.slice(0, 5)
      }
    }
  });

  // ============================================================================
  // PHASE 12: RECOMMENDATIONS AND NEXT STEPS
  // ============================================================================

  let recommendations = null;
  if (qualityMet) {
    ctx.log('info', 'Phase 12: Generating actionable recommendations and next steps');
    recommendations = await ctx.task(recommendationsGenerationTask, {
      projectName,
      insights: insightGeneration.insights,
      painPoints: dataSynthesis.painPoints,
      opportunities: dataSynthesis.opportunities,
      personas: personaCreation ? personaCreation.personas : [],
      journeyMaps: journeyMapping ? journeyMapping.journeyMaps : [],
      outputDir
    });
    artifacts.push(...recommendations.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: qualityScore.overallScore,
    qualityMet,
    researchReport: researchReport.reportPath,
    researchPlan: {
      objectives: researchPlanning.refinedObjectives,
      methods: researchPlanning.selectedMethods.map(m => m.method),
      timeline: researchPlanning.estimatedTimeline,
      budget: researchPlanning.estimatedBudget
    },
    participants: {
      recruited: participantRecruitment.confirmedParticipants.length,
      target: participantCount,
      diversity: participantRecruitment.diversityScore,
      profiles: participantRecruitment.participantProfiles
    },
    research: {
      qualitativeSessions: qualitativeResults.length > 0 ? qualitativeResults[0].sessionCount : 0,
      quantitativeResponses: quantitativeResults.length > 0 ? quantitativeResults[0].responseCount : 0,
      dataQuality: dataSynthesis.dataQuality
    },
    findings: {
      themes: dataSynthesis.themes,
      patterns: dataSynthesis.patterns.slice(0, 10),
      painPoints: dataSynthesis.painPoints.slice(0, 10),
      opportunities: dataSynthesis.opportunities.slice(0, 10)
    },
    insights: {
      total: insightGeneration.insights.length,
      criticalInsights: insightGeneration.insights.filter(i => i.priority === 'critical').length,
      insights: insightGeneration.insights
    },
    personas: personaCreation ? {
      total: personaCreation.personas.length,
      personas: personaCreation.personas,
      validationScore: personaCreation.validationScore
    } : null,
    journeyMaps: journeyMapping ? {
      total: journeyMapping.journeyMaps.length,
      maps: journeyMapping.journeyMaps
    } : null,
    recommendations: recommendations ? {
      total: recommendations.recommendations.length,
      prioritized: recommendations.prioritizedRecommendations,
      quickWins: recommendations.quickWins,
      longTermInitiatives: recommendations.longTermInitiatives
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/user-research',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Research Planning and Scoping
export const researchPlanningTask = defineTask('research-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan research scope and methodology',
  agent: {
    name: 'ux-research-planner',
    prompt: {
      role: 'senior UX researcher and research strategist',
      task: 'Develop comprehensive user research plan with clear objectives, appropriate methods, and realistic timeline',
      context: args,
      instructions: [
        'Review and refine research objectives to be specific, measurable, actionable',
        'For each objective, identify what needs to be learned and why',
        'Evaluate proposed research methods for appropriateness',
        'Select optimal mix of qualitative and quantitative methods',
        'Qualitative methods: interviews (depth), contextual inquiry (context), focus groups (diverse perspectives), usability testing (validation), diary studies (longitudinal)',
        'Quantitative methods: surveys (scale), analytics (behavior), card sorting (IA), tree testing (navigation), first-click testing (interaction)',
        'Consider mixed-methods approach for triangulation and validation',
        'Assess feasibility given timeline and budget constraints',
        'Develop detailed research timeline with phases and milestones',
        'Create participant screening criteria and screener questions',
        'Estimate budget needs: participant incentives, tools, recruiting costs',
        'Identify potential risks and mitigation strategies',
        'Define success criteria for research quality',
        'Generate comprehensive research plan document'
      ],
      outputFormat: 'JSON with refinedObjectives (array), selectedMethods (array with method, rationale, estimatedTime), refinedCriteria (object), screenerQuestions (array), estimatedTimeline (string), estimatedBudget (object), risks (array), successCriteria (array), planApproved (boolean), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedObjectives', 'selectedMethods', 'planApproved', 'artifacts'],
      properties: {
        refinedObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              researchQuestions: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        selectedMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              type: { type: 'string', enum: ['qualitative', 'quantitative', 'mixed'] },
              rationale: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              participantCount: { type: 'number' },
              estimatedTime: { type: 'string' },
              estimatedCost: { type: 'string' }
            }
          }
        },
        refinedCriteria: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            behaviors: { type: 'array', items: { type: 'string' } },
            experience: { type: 'string' },
            exclusionCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        screenerQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string', enum: ['multiple-choice', 'open-ended', 'rating'] },
              purpose: { type: 'string' },
              qualifyingAnswer: { type: 'string' }
            }
          }
        },
        estimatedTimeline: { type: 'string' },
        estimatedBudget: {
          type: 'object',
          properties: {
            participantIncentives: { type: 'string' },
            tools: { type: 'string' },
            recruiting: { type: 'string' },
            total: { type: 'string' }
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
        successCriteria: { type: 'array', items: { type: 'string' } },
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
  labels: ['agent', 'user-research', 'research-planning']
}));

// Task 2: Participant Recruitment and Screening
export const participantRecruitmentTask = defineTask('participant-recruitment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recruit and screen research participants',
  agent: {
    name: 'participant-recruiter',
    prompt: {
      role: 'UX research recruiter and coordinator',
      task: 'Recruit qualified research participants matching criteria and screen for diversity',
      context: args,
      instructions: [
        'Develop recruitment strategy: panels, social media, existing customers, guerrilla recruiting',
        'Create participant outreach messaging and emails',
        'Apply screening criteria to identify qualified participants',
        'Use screener questions to validate participant fit',
        'Aim for diverse participant pool (age, gender, tech proficiency, location, behaviors)',
        'Over-recruit by 20% to account for no-shows',
        'Schedule research sessions with confirmed participants',
        'Send confirmation emails with session details and incentives',
        'Create participant profiles summarizing demographics and qualifications',
        'Track recruitment status and diversity metrics',
        'Prepare participant contact list and scheduling details',
        'Generate recruitment report with participant profiles'
      ],
      outputFormat: 'JSON with confirmedParticipants (array), participantProfiles (array), diversityScore (number 0-100), recruitmentChannels (array), schedulingDetails (object), artifacts'
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
              qualifications: { type: 'array', items: { type: 'string' } },
              sessionDate: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        participantProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              count: { type: 'number' },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        diversityScore: { type: 'number', minimum: 0, maximum: 100 },
        recruitmentChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              participantsRecruited: { type: 'number' },
              effectiveness: { type: 'string' }
            }
          }
        },
        schedulingDetails: {
          type: 'object',
          properties: {
            totalSessions: { type: 'number' },
            dateRange: { type: 'string' },
            sessionDuration: { type: 'string' }
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
  labels: ['agent', 'user-research', 'recruitment']
}));

// Task 3: Research Protocol Development
export const protocolDevelopmentTask = defineTask('protocol-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop research protocols and guides',
  agent: {
    name: 'protocol-developer',
    prompt: {
      role: 'UX researcher and research methodologist',
      task: 'Create comprehensive research protocols, interview guides, test scripts, and survey instruments',
      context: args,
      instructions: [
        'For user interviews: develop discussion guide with opening, warm-up, main questions, wrap-up',
        '  - Use open-ended questions to encourage storytelling',
        '  - Ask about behaviors, not preferences ("Tell me about last time..." vs "Would you...")',
        '  - Include follow-up prompts (Tell me more, Why is that?, Can you give an example?)',
        '  - Avoid leading questions',
        'For usability testing: create task scenarios with clear success criteria',
        '  - Write realistic task descriptions without giving away UI elements',
        '  - Define task success metrics (completion, time, errors)',
        '  - Prepare think-aloud instructions',
        'For surveys: design questionnaire with validated scales (SUS, NPS, CSAT)',
        '  - Mix question types: multiple choice, rating scales, open-ended',
        '  - Ensure logical flow and appropriate length (5-10 minutes)',
        '  - Include screening questions at start',
        'For card sorting: prepare card set and instructions',
        'For contextual inquiry: develop observation protocol and interview prompts',
        'Include consent forms and privacy disclosures',
        'Pilot test all protocols with internal team',
        'Refine based on pilot feedback',
        'Generate protocol package for each research method'
      ],
      outputFormat: 'JSON with protocols (object with method-specific protocols), consentForms (array), pilotTestResults (object), refinements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            interviews: {
              type: 'object',
              properties: {
                discussionGuide: { type: 'string' },
                questions: { type: 'array', items: { type: 'string' } },
                estimatedDuration: { type: 'string' }
              }
            },
            usabilityTesting: {
              type: 'object',
              properties: {
                taskScenarios: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      task: { type: 'string' },
                      successCriteria: { type: 'string' },
                      metrics: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                thinkAloudInstructions: { type: 'string' }
              }
            },
            surveys: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      type: { type: 'string' },
                      options: { type: 'array' }
                    }
                  }
                },
                estimatedCompletionTime: { type: 'string' }
              }
            }
          }
        },
        consentForms: { type: 'array', items: { type: 'string' } },
        pilotTestResults: {
          type: 'object',
          properties: {
            conductedPilot: { type: 'boolean' },
            feedback: { type: 'array', items: { type: 'string' } },
            adjustmentsMade: { type: 'array', items: { type: 'string' } }
          }
        },
        refinements: { type: 'array', items: { type: 'string' } },
        researcherGuidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'protocol-development']
}));

// Task 4: Qualitative Data Collection
export const qualitativeDataCollectionTask = defineTask('qualitative-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct qualitative research sessions',
  agent: {
    name: 'qualitative-researcher',
    prompt: {
      role: 'experienced UX researcher and qualitative interviewer',
      task: 'Conduct qualitative research sessions (interviews, usability tests, contextual inquiry) and collect rich observational data',
      context: args,
      instructions: [
        'For each research session:',
        '  - Build rapport with participants, make them comfortable',
        '  - Follow discussion guide while remaining flexible to explore interesting topics',
        '  - Use active listening and probing techniques',
        '  - Observe non-verbal cues and emotional responses',
        '  - Record sessions (with consent) for later analysis',
        '  - Take detailed observation notes',
        '  - Capture memorable quotes verbatim',
        'For user interviews (30-60 min each):',
        '  - Explore user needs, behaviors, motivations, mental models',
        '  - Ask about recent experiences, not hypotheticals',
        '  - Dig into pain points and workarounds',
        'For usability testing (45-60 min each):',
        '  - Have users complete realistic tasks while thinking aloud',
        '  - Observe task completion, time, errors, satisfaction',
        '  - Note confusion points, error recovery, unexpected behaviors',
        '  - Ask post-task questions about experience',
        'For contextual inquiry:',
        '  - Observe users in natural environment',
        '  - Use master-apprentice model: watch, ask, interpret',
        '  - Document workflow, tools, workarounds, environmental factors',
        'Immediately after each session:',
        '  - Write debrief notes with key observations and insights',
        '  - Identify preliminary themes and patterns',
        '  - Note any protocol adjustments needed',
        'Compile all session data: transcripts, notes, observations, quotes',
        'Generate qualitative research summary'
      ],
      outputFormat: 'JSON with sessionCount (number), sessionSummaries (array), observations (array), quotes (array), preliminaryThemes (array), dataQuality (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionCount', 'sessionSummaries', 'observations', 'quotes', 'artifacts'],
      properties: {
        sessionCount: { type: 'number' },
        sessionSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              participant: { type: 'string' },
              method: { type: 'string' },
              date: { type: 'string' },
              duration: { type: 'string' },
              keyObservations: { type: 'array', items: { type: 'string' } },
              notableQuotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              observation: { type: 'string' },
              context: { type: 'string' },
              frequency: { type: 'string', enum: ['rare', 'occasional', 'common', 'consistent'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
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
              significance: { type: 'string' }
            }
          }
        },
        preliminaryThemes: { type: 'array', items: { type: 'string' } },
        usabilityFindings: {
          type: 'object',
          properties: {
            taskSuccessRates: { type: 'object' },
            commonErrors: { type: 'array', items: { type: 'string' } },
            confusionPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        dataQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'qualitative-research']
}));

// Task 5: Quantitative Data Collection
export const quantitativeDataCollectionTask = defineTask('quantitative-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct quantitative research and collect metrics',
  agent: {
    name: 'quantitative-researcher',
    prompt: {
      role: 'UX researcher and data analyst',
      task: 'Conduct quantitative research (surveys, analytics, card sorting, tree testing) and collect measurable data',
      context: args,
      instructions: [
        'For surveys:',
        '  - Deploy survey to target participants',
        '  - Monitor response rate and send reminders',
        '  - Aim for statistical significance (100+ responses)',
        '  - Calculate metrics: NPS, CSAT, SUS scores',
        '  - Analyze rating scales, multiple choice distributions',
        '  - Code and analyze open-ended responses',
        'For card sorting:',
        '  - Conduct open/closed/hybrid card sorting sessions',
        '  - Analyze similarity matrices and dendrograms',
        '  - Identify common groupings and category labels',
        '  - Calculate agreement scores',
        'For tree testing:',
        '  - Test information architecture with text-based hierarchy',
        '  - Measure task success rate, directness, time taken',
        '  - Identify problematic navigation paths',
        'For analytics review:',
        '  - Collect usage data from analytics platforms',
        '  - Analyze user flows, conversion funnels, drop-off points',
        '  - Calculate engagement metrics, bounce rates',
        'For first-click testing:',
        '  - Collect first-click data on designs/wireframes',
        '  - Generate heatmaps showing click distribution',
        '  - Calculate first-click success rates',
        'Perform statistical analysis where appropriate',
        'Identify significant patterns and trends',
        'Generate data visualizations (charts, graphs, heatmaps)',
        'Compile quantitative research summary with key metrics'
      ],
      outputFormat: 'JSON with responseCount (number), completionRate (string), metrics (object), statisticalSignificance (boolean), visualizations (array), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responseCount', 'metrics', 'keyFindings', 'artifacts'],
      properties: {
        responseCount: { type: 'number' },
        completionRate: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            nps: { type: 'number' },
            csat: { type: 'number' },
            sus: { type: 'number' },
            taskSuccessRate: { type: 'number' },
            averageTimeOnTask: { type: 'string' }
          }
        },
        statisticalSignificance: { type: 'boolean' },
        surveyResults: {
          type: 'object',
          properties: {
            totalResponses: { type: 'number' },
            demographics: { type: 'object' },
            ratingDistributions: { type: 'object' },
            topFindings: { type: 'array', items: { type: 'string' } }
          }
        },
        cardSortingResults: {
          type: 'object',
          properties: {
            commonGroupings: { type: 'array', items: { type: 'string' } },
            categoryLabels: { type: 'array', items: { type: 'string' } },
            agreementScore: { type: 'number' }
          }
        },
        treeTestingResults: {
          type: 'object',
          properties: {
            taskSuccessRates: { type: 'object' },
            directness: { type: 'object' },
            problemPaths: { type: 'array', items: { type: 'string' } }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        dataQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'quantitative-research']
}));

// Task 6: Data Synthesis and Analysis
export const dataSynthesisTask = defineTask('data-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize research data and extract patterns',
  agent: {
    name: 'research-analyst',
    prompt: {
      role: 'senior UX researcher and data synthesis specialist',
      task: 'Analyze and synthesize all research data to identify themes, patterns, pain points, and opportunities',
      context: args,
      instructions: [
        'Review all qualitative and quantitative data collected',
        'Conduct affinity mapping/diagramming:',
        '  - Write observations on digital sticky notes',
        '  - Group related observations together',
        '  - Identify emergent themes and patterns',
        '  - Create hierarchy: observations → patterns → themes → insights',
        'Perform thematic analysis:',
        '  - Code qualitative data (quotes, observations)',
        '  - Identify recurring themes across participants',
        '  - Quantify theme frequency and prevalence',
        '  - Connect themes to research objectives',
        'Triangulate findings across multiple data sources',
        'Identify user segments based on behavioral patterns',
        'Catalog pain points with severity and frequency',
        'Identify opportunity areas for improvement',
        'Map touchpoints across user journey',
        'Document user mental models and expectations',
        'Validate findings against quantitative data',
        'Assess data sufficiency for personas and journey maps',
        'Generate comprehensive synthesis report with themes, patterns, pain points'
      ],
      outputFormat: 'JSON with themes (array), patterns (array), painPoints (array), opportunities (array), userSegments (array), touchpoints (array), findings (object), dataQuality (string), sufficientDataForPersonas (boolean), sufficientDataForJourneys (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'patterns', 'painPoints', 'opportunities', 'findings', 'artifacts'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'string', enum: ['rare', 'occasional', 'common', 'universal'] },
              supportingEvidence: { type: 'array', items: { type: 'string' } },
              relatedObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              userSegments: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
            }
          }
        },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              frequency: { type: 'string' },
              affectedSegments: { type: 'array', items: { type: 'string' } },
              currentWorkarounds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'transformative'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              relatedPainPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              goals: { type: 'array', items: { type: 'string' } },
              behaviors: { type: 'array', items: { type: 'string' } },
              size: { type: 'string' }
            }
          }
        },
        touchpoints: { type: 'array', items: { type: 'string' } },
        mentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expectation: { type: 'string' },
              reality: { type: 'string' },
              gap: { type: 'string' }
            }
          }
        },
        findings: {
          type: 'object',
          properties: {
            totalObservations: { type: 'number' },
            themesIdentified: { type: 'number' },
            patternsIdentified: { type: 'number' },
            criticalPainPoints: { type: 'number' },
            triangulation: { type: 'string' }
          }
        },
        dataQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        sufficientDataForPersonas: { type: 'boolean' },
        sufficientDataForJourneys: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'data-synthesis']
}));

// Task 7: Insight Generation and Prioritization
export const insightGenerationTask = defineTask('insight-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate and prioritize actionable insights',
  agent: {
    name: 'insight-strategist',
    prompt: {
      role: 'senior UX strategist and insight generator',
      task: 'Transform research findings into actionable insights and prioritize by impact and feasibility',
      context: args,
      instructions: [
        'Transform themes and patterns into actionable insights',
        'An insight is a non-obvious understanding that reveals user needs, motivations, or behaviors',
        'Good insights are: specific, actionable, grounded in data, answer research objectives',
        'For each insight:',
        '  - State the insight clearly and concisely',
        '  - Explain the supporting evidence from research',
        '  - Describe implications for design/product',
        '  - Suggest potential solutions or next steps',
        '  - Assess priority (critical, high, medium, low)',
        'Connect insights back to original research objectives',
        'Identify critical insights requiring immediate action',
        'Group insights by theme or product area',
        'Prioritize using impact vs effort framework',
        'Validate insights are truly insights (not just observations or facts)',
        'Ensure insights are actionable and specific enough to guide decisions',
        'Generate insight summary with prioritization matrix'
      ],
      outputFormat: 'JSON with insights (array with insight, evidence, implications, suggestedActions, priority, relatedObjectives), criticalInsights (array), insightsByTheme (object), prioritizationMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'criticalInsights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              implications: { type: 'string' },
              suggestedActions: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'transformative'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              relatedObjectives: { type: 'array', items: { type: 'string' } },
              affectedUserSegments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              urgency: { type: 'string' },
              businessImpact: { type: 'string' }
            }
          }
        },
        insightsByTheme: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        prioritizationMatrix: {
          type: 'object',
          properties: {
            quickWins: { type: 'array', items: { type: 'string' } },
            majorProjects: { type: 'array', items: { type: 'string' } },
            fillIns: { type: 'array', items: { type: 'string' } },
            thanklessTasks: { type: 'array', items: { type: 'string' } }
          }
        },
        objectivesAddressed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              addressed: { type: 'boolean' },
              relatedInsights: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'user-research', 'insight-generation']
}));

// Task 8: Persona Creation
export const personaCreationTask = defineTask('persona-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create research-based personas',
  agent: {
    name: 'persona-designer',
    prompt: {
      role: 'UX researcher and persona specialist',
      task: 'Create 3-5 research-based persona profiles capturing user archetypes with goals, needs, behaviors, and pain points',
      context: args,
      instructions: [
        'Review user segments and behavioral patterns from research',
        'Identify 3-5 distinct persona archetypes representing primary user types',
        'For each persona, create comprehensive profile:',
        '  - Name and photo (fictional but realistic)',
        '  - Demographics (age, location, occupation, education, tech proficiency)',
        '  - Quote capturing persona essence',
        '  - Goals (primary, secondary)',
        '  - Needs and expectations',
        '  - Pain points and frustrations',
        '  - Behaviors and patterns (how they work, tools used, habits)',
        '  - Context and scenarios (when/where they use product)',
        '  - Motivations and values',
        'Base all persona details on actual research data (no assumptions)',
        'Include specific quotes and evidence from research',
        'Ensure personas are distinct and non-overlapping',
        'Validate personas cover majority of target users',
        'Create visual persona documents/posters',
        'Include persona prioritization (primary vs secondary)',
        'Generate persona validation report'
      ],
      outputFormat: 'JSON with personas (array with detailed persona objects), validationScore (number 0-100), coverage (string), primaryPersona (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'validationScore', 'artifacts'],
      properties: {
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tagline: { type: 'string' },
              quote: { type: 'string' },
              demographics: {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  location: { type: 'string' },
                  occupation: { type: 'string' },
                  education: { type: 'string' },
                  techProficiency: { type: 'string', enum: ['low', 'medium', 'high', 'expert'] }
                }
              },
              goals: {
                type: 'object',
                properties: {
                  primary: { type: 'array', items: { type: 'string' } },
                  secondary: { type: 'array', items: { type: 'string' } }
                }
              },
              needs: { type: 'array', items: { type: 'string' } },
              painPoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    painPoint: { type: 'string' },
                    context: { type: 'string' },
                    severity: { type: 'string' }
                  }
                }
              },
              behaviors: {
                type: 'object',
                properties: {
                  workStyle: { type: 'string' },
                  toolsUsed: { type: 'array', items: { type: 'string' } },
                  habits: { type: 'array', items: { type: 'string' } },
                  decisionMaking: { type: 'string' }
                }
              },
              motivations: { type: 'array', items: { type: 'string' } },
              frustrations: { type: 'array', items: { type: 'string' } },
              context: { type: 'string' },
              scenarios: { type: 'array', items: { type: 'string' } },
              researchEvidence: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['primary', 'secondary'] },
              estimatedPercentage: { type: 'string' }
            }
          }
        },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        coverage: { type: 'string' },
        primaryPersona: { type: 'string' },
        personaDistinctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona1: { type: 'string' },
              persona2: { type: 'string' },
              keyDifference: { type: 'string' }
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
  labels: ['agent', 'user-research', 'personas']
}));

// Task 9: Journey Mapping
export const journeyMappingTask = defineTask('journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create user journey maps',
  agent: {
    name: 'journey-mapper',
    prompt: {
      role: 'UX researcher and service designer',
      task: 'Create current-state user journey maps visualizing complete user experience across touchpoints with pain points and opportunities',
      context: args,
      instructions: [
        'For each primary persona, create current-state journey map',
        'Define journey stages (e.g., Awareness, Consideration, Purchase, Onboarding, Usage, Retention)',
        'For each stage, document:',
        '  - Touchpoints (where user interacts with product/service)',
        '  - User actions (what user is trying to do)',
        '  - Thoughts (what user is thinking)',
        '  - Emotions (how user feels - plot emotional curve)',
        '  - Pain points (problems, obstacles, frustrations)',
        '  - Opportunities (areas for improvement)',
        '  - Channels (web, mobile, email, phone, etc.)',
        'Use research data to populate each section',
        'Include supporting quotes and evidence',
        'Plot emotional journey curve showing highs and lows',
        'Identify critical moments of truth',
        'Highlight major pain points requiring attention',
        'Mark opportunity areas for innovation',
        'Create visual journey map diagrams',
        'Ensure journey maps are validated by research data',
        'Generate journey mapping report with findings'
      ],
      outputFormat: 'JSON with journeyMaps (array), criticalMoments (array), majorPainPoints (array), opportunityAreas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['journeyMaps', 'artifacts'],
      properties: {
        journeyMaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              journeyName: { type: 'string' },
              stages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage: { type: 'string' },
                    touchpoints: { type: 'array', items: { type: 'string' } },
                    actions: { type: 'array', items: { type: 'string' } },
                    thoughts: { type: 'array', items: { type: 'string' } },
                    emotions: {
                      type: 'object',
                      properties: {
                        level: { type: 'string', enum: ['very-negative', 'negative', 'neutral', 'positive', 'very-positive'] },
                        description: { type: 'string' }
                      }
                    },
                    painPoints: { type: 'array', items: { type: 'string' } },
                    opportunities: { type: 'array', items: { type: 'string' } },
                    channels: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              emotionalCurve: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage: { type: 'string' },
                    emotionLevel: { type: 'number', minimum: -5, maximum: 5 }
                  }
                }
              },
              researchEvidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              stage: { type: 'string' },
              significance: { type: 'string' },
              currentExperience: { type: 'string' },
              opportunity: { type: 'string' }
            }
          }
        },
        majorPainPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              stage: { type: 'string' },
              impact: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        opportunityAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              stage: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
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
  labels: ['agent', 'user-research', 'journey-mapping']
}));

// Task 10: Research Report Generation
export const researchReportGenerationTask = defineTask('research-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive research report',
  agent: {
    name: 'research-writer',
    prompt: {
      role: 'UX researcher and technical writer',
      task: 'Generate comprehensive, stakeholder-ready user research report consolidating all findings, insights, and recommendations',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Key insights and findings',
        '  - Critical pain points discovered',
        '  - Top recommendations',
        '  - Next steps',
        'Include research overview section:',
        '  - Research objectives',
        '  - Methods used and rationale',
        '  - Participant demographics and recruitment',
        '  - Timeline and logistics',
        'Document methodology section:',
        '  - Detailed description of each research method',
        '  - Participant counts and profiles',
        '  - Data collection procedures',
        '  - Analysis approach',
        'Present findings section:',
        '  - Major themes with supporting evidence',
        '  - Behavioral patterns observed',
        '  - Pain points with severity and frequency',
        '  - Opportunity areas',
        '  - Include quotes and data visualizations',
        'Include insights section:',
        '  - Actionable insights with evidence',
        '  - Implications for product/design',
        '  - Prioritization',
        'Add personas section (if created)',
        'Add journey maps section (if created)',
        'Include recommendations section:',
        '  - Specific, actionable recommendations',
        '  - Prioritization framework',
        '  - Quick wins vs long-term initiatives',
        'Include appendices:',
        '  - Research protocols',
        '  - Full data tables',
        '  - Participant screeners',
        '  - Additional quotes',
        'Format as professional, well-designed document',
        'Use clear headings, visuals, and data visualizations',
        'Write for stakeholder audience (executives, product, design, eng)',
        'Ensure report is actionable and guides decision-making'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), topRecommendations (array), readinessScore (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' }
            }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        targetAudience: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'reporting', 'documentation']
}));

// Task 11: Research Quality Scoring
export const researchQualityScoringTask = defineTask('research-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score research quality and completeness',
  agent: {
    name: 'research-validator',
    prompt: {
      role: 'principal UX researcher and research quality auditor',
      task: 'Assess overall research quality, rigor, completeness, and actionability',
      context: args,
      instructions: [
        'Evaluate research planning rigor (weight: 15%):',
        '  - Were objectives clear and appropriate?',
        '  - Were methods well-chosen for objectives?',
        '  - Was participant recruitment appropriate?',
        'Evaluate data collection quality (weight: 20%):',
        '  - Was sample size sufficient for methods used?',
        '  - Was participant diversity adequate?',
        '  - Were protocols followed rigorously?',
        '  - Was data quality high (rich, detailed, relevant)?',
        'Evaluate synthesis thoroughness (weight: 20%):',
        '  - Was affinity mapping/thematic analysis conducted?',
        '  - Were themes well-supported by evidence?',
        '  - Was triangulation across data sources performed?',
        'Evaluate insight quality (weight: 25%):',
        '  - Are insights truly insightful (non-obvious)?',
        '  - Are insights actionable and specific?',
        '  - Do insights address research objectives?',
        '  - Are insights prioritized appropriately?',
        'Evaluate deliverable quality (weight: 10%):',
        '  - Are personas research-based (if created)?',
        '  - Are journey maps data-driven (if created)?',
        '  - Is report comprehensive and clear?',
        'Evaluate actionability (weight: 10%):',
        '  - Does research clearly guide decisions?',
        '  - Are recommendations specific and feasible?',
        '  - Are next steps clear?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and limitations',
        'Provide recommendations for improvement or additional research',
        'Assess readiness to inform design decisions'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), strengths (array), gaps (array), limitations (array), recommendations (array), readinessForDesign (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'readinessForDesign', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            planningRigor: { type: 'number' },
            dataCollectionQuality: { type: 'number' },
            synthesisDepth: { type: 'number' },
            insightQuality: { type: 'number' },
            deliverableQuality: { type: 'number' },
            actionability: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitation: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        additionalResearchNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              method: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        readinessForDesign: { type: 'string', enum: ['ready', 'mostly-ready', 'needs-more-research'] },
        confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'quality-scoring', 'validation']
}));

// Task 12: Recommendations and Next Steps
export const recommendationsGenerationTask = defineTask('recommendations-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable recommendations and next steps',
  agent: {
    name: 'ux-strategist',
    prompt: {
      role: 'senior UX strategist and product advisor',
      task: 'Generate prioritized, actionable recommendations and define clear next steps based on research insights',
      context: args,
      instructions: [
        'Review all insights, pain points, and opportunities',
        'For each insight, generate specific design/product recommendations:',
        '  - What should be built/changed/improved?',
        '  - How might we address this pain point?',
        '  - What are potential solutions?',
        'Prioritize recommendations using impact vs effort framework:',
        '  - Quick wins (high impact, low effort)',
        '  - Major projects (high impact, high effort)',
        '  - Fill-ins (low impact, low effort)',
        '  - Avoid: low impact, high effort',
        'Group recommendations by:',
        '  - Design changes (UI, interaction, visual)',
        '  - Feature additions',
        '  - Content and messaging',
        '  - Information architecture',
        '  - Accessibility improvements',
        'Define immediate next steps:',
        '  - What design work should start immediately?',
        '  - What additional research is needed?',
        '  - Who needs to be involved?',
        'Define short-term initiatives (1-3 months)',
        'Define long-term initiatives (3-12 months)',
        'Include success metrics for measuring impact',
        'Provide implementation considerations',
        'Generate prioritized recommendations document'
      ],
      outputFormat: 'JSON with recommendations (array), prioritizedRecommendations (array), quickWins (array), shortTermInitiatives (array), longTermInitiatives (array), nextSteps (array), successMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedRecommendations', 'nextSteps', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string', enum: ['design', 'feature', 'content', 'IA', 'accessibility', 'research'] },
              relatedInsights: { type: 'array', items: { type: 'string' } },
              addressesPainPoints: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'transformative'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        prioritizedRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        shortTermInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        longTermInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              timeline: { type: 'string' },
              strategicValue: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              currentBaseline: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        implementationConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-research', 'recommendations', 'strategy']
}));
