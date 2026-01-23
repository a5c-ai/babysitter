/**
 * @process ux-ui-design/card-sorting
 * @description Card Sorting Process for Information Architecture validation through open, closed, and hybrid card sorting methodologies with participant recruitment, session facilitation, dendrogram analysis, and navigation structure recommendations
 * @inputs { projectName: string, sortingType: string, contentItems: array, existingCategories: array, participantCount: number, toolPreference: string, researchObjectives: array, outputDir: string }
 * @outputs { success: boolean, sortingResults: object, dendrogramAnalysis: object, categoryRecommendations: array, navigationStructure: object, validationReport: string, artifacts: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    sortingType = 'open', // open, closed, hybrid
    contentItems = [],
    existingCategories = [],
    participantCount = 20,
    toolPreference = 'optimal-workshop', // optimal-workshop, userzoom, miro, useberry
    researchObjectives = [],
    targetAudience = [],
    remoteSession = true,
    sessionDuration = '30 minutes',
    outputDir = 'card-sorting-output',
    minAgreementScore = 70,
    includeFollowUpQuestions = true,
    generateNavigationRecommendations = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Card Sorting Process for ${projectName} (${sortingType} sort)`);

  // ============================================================================
  // PHASE 1: CARD SORTING PLANNING AND METHODOLOGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning card sorting study and selecting methodology');
  const studyPlanning = await ctx.task(studyPlanningTask, {
    projectName,
    sortingType,
    contentItems,
    existingCategories,
    researchObjectives,
    participantCount,
    targetAudience,
    remoteSession,
    outputDir
  });

  artifacts.push(...studyPlanning.artifacts);

  if (!studyPlanning.studyApproved) {
    ctx.log('warn', 'Card sorting study plan needs refinement');
    return {
      success: false,
      reason: 'Card sorting study plan quality insufficient',
      recommendations: studyPlanning.recommendations,
      metadata: {
        processId: 'ux-ui-design/card-sorting',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: CARD PREPARATION AND CONTENT CURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Preparing cards and curating content items');
  const cardPreparation = await ctx.task(cardPreparationTask, {
    projectName,
    sortingType,
    contentItems,
    existingCategories,
    studyPlanning,
    targetCardCount: studyPlanning.recommendedCardCount,
    outputDir
  });

  artifacts.push(...cardPreparation.artifacts);

  // ============================================================================
  // PHASE 3: TOOL SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up card sorting tool and configuring study');
  const toolSetup = await ctx.task(toolSetupTask, {
    projectName,
    sortingType,
    toolPreference,
    cards: cardPreparation.finalCards,
    predefinedCategories: cardPreparation.categories,
    studyPlanning,
    remoteSession,
    includeFollowUpQuestions,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  // Breakpoint: Review study setup before recruitment
  await ctx.breakpoint({
    question: `Card sorting study configured with ${cardPreparation.finalCards.length} cards${sortingType === 'closed' ? ` and ${cardPreparation.categories.length} predefined categories` : ''}. Review setup and approve for participant recruitment?`,
    title: 'Card Sorting Study Setup Review',
    context: {
      runId: ctx.runId,
      files: [
        ...studyPlanning.artifacts,
        ...cardPreparation.artifacts,
        ...toolSetup.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || 'Study Setup'
      })),
      summary: {
        projectName,
        sortingType,
        cardCount: cardPreparation.finalCards.length,
        categoryCount: sortingType === 'closed' ? cardPreparation.categories.length : 'User-defined',
        targetParticipants: participantCount,
        toolConfigured: toolSetup.toolName,
        studyUrl: toolSetup.studyUrl
      }
    }
  });

  // ============================================================================
  // PHASE 4: PARTICIPANT RECRUITMENT AND SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 4: Recruiting and screening participants for card sorting');
  const participantRecruitment = await ctx.task(participantRecruitmentTask, {
    projectName,
    targetAudience,
    participantCount,
    studyPlanning,
    sessionDuration,
    remoteSession,
    incentiveStructure: studyPlanning.incentiveStructure,
    outputDir
  });

  artifacts.push(...participantRecruitment.artifacts);

  // ============================================================================
  // PHASE 5: SESSION FACILITATION AND DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Facilitating card sorting sessions and collecting data');
  const sessionFacilitation = await ctx.task(sessionFacilitationTask, {
    projectName,
    sortingType,
    studyUrl: toolSetup.studyUrl,
    participants: participantRecruitment.confirmedParticipants,
    remoteSession,
    includeFollowUpQuestions,
    followUpQuestions: toolSetup.followUpQuestions,
    sessionDuration,
    outputDir
  });

  artifacts.push(...sessionFacilitation.artifacts);

  // ============================================================================
  // PHASE 6: SIMILARITY MATRIX ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing similarity matrices and card relationships');
  const similarityAnalysis = await ctx.task(similarityMatrixAnalysisTask, {
    projectName,
    sortingType,
    sortingData: sessionFacilitation.sortingData,
    cards: cardPreparation.finalCards,
    participantCount: sessionFacilitation.completedSessions,
    outputDir
  });

  artifacts.push(...similarityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DENDROGRAM ANALYSIS AND CLUSTER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing dendrogram analysis and identifying clusters');
  const dendrogramAnalysis = await ctx.task(dendrogramAnalysisTask, {
    projectName,
    sortingType,
    similarityMatrix: similarityAnalysis.similarityMatrix,
    cards: cardPreparation.finalCards,
    sortingData: sessionFacilitation.sortingData,
    outputDir
  });

  artifacts.push(...dendrogramAnalysis.artifacts);

  // Breakpoint: Review analysis results
  await ctx.breakpoint({
    question: `Card sorting analysis complete. ${sessionFacilitation.completedSessions} sessions analyzed. Agreement score: ${similarityAnalysis.overallAgreementScore}/100. ${dendrogramAnalysis.clusters.length} clusters identified. Review analysis?`,
    title: 'Card Sorting Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        ...sessionFacilitation.artifacts,
        ...similarityAnalysis.artifacts,
        ...dendrogramAnalysis.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language,
        label: a.label || 'Analysis'
      })),
      summary: {
        projectName,
        completedSessions: sessionFacilitation.completedSessions,
        agreementScore: similarityAnalysis.overallAgreementScore,
        clustersIdentified: dendrogramAnalysis.clusters.length,
        strongPairings: similarityAnalysis.strongPairings.length,
        uncertainGroupings: dendrogramAnalysis.uncertainGroupings.length
      }
    }
  });

  // ============================================================================
  // PHASE 8: CATEGORY NAMING AND LABELING (for open/hybrid sorts)
  // ============================================================================

  let categoryLabeling = null;
  if (sortingType === 'open' || sortingType === 'hybrid') {
    ctx.log('info', 'Phase 8: Analyzing participant-generated category labels');
    categoryLabeling = await ctx.task(categoryLabelingAnalysisTask, {
      projectName,
      sortingType,
      sortingData: sessionFacilitation.sortingData,
      clusters: dendrogramAnalysis.clusters,
      participantLabels: sessionFacilitation.participantCategoryLabels,
      outputDir
    });

    artifacts.push(...categoryLabeling.artifacts);
  }

  // ============================================================================
  // PHASE 9: CATEGORY VALIDATION AND AGREEMENT SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating categories and calculating agreement scores');
  const categoryValidation = await ctx.task(categoryValidationTask, {
    projectName,
    sortingType,
    sortingData: sessionFacilitation.sortingData,
    clusters: dendrogramAnalysis.clusters,
    categoryLabeling,
    existingCategories: sortingType === 'closed' ? cardPreparation.categories : null,
    similarityAnalysis,
    minAgreementScore,
    outputDir
  });

  artifacts.push(...categoryValidation.artifacts);

  // ============================================================================
  // PHASE 10: NAVIGATION STRUCTURE RECOMMENDATIONS
  // ============================================================================

  let navigationRecommendations = null;
  if (generateNavigationRecommendations) {
    ctx.log('info', 'Phase 10: Generating navigation structure recommendations');
    navigationRecommendations = await ctx.task(navigationRecommendationsTask, {
      projectName,
      sortingType,
      clusters: dendrogramAnalysis.clusters,
      categoryLabeling,
      categoryValidation,
      similarityAnalysis,
      dendrogramAnalysis,
      outputDir
    });

    artifacts.push(...navigationRecommendations.artifacts);
  }

  // ============================================================================
  // PHASE 11: INSIGHT GENERATION AND FINDINGS SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Synthesizing insights and generating findings report');
  const insightGeneration = await ctx.task(insightGenerationTask, {
    projectName,
    sortingType,
    researchObjectives,
    sessionFacilitation,
    similarityAnalysis,
    dendrogramAnalysis,
    categoryLabeling,
    categoryValidation,
    navigationRecommendations,
    existingCategories,
    outputDir
  });

  artifacts.push(...insightGeneration.artifacts);

  // ============================================================================
  // PHASE 12: COMPREHENSIVE VALIDATION REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive validation report');
  const validationReport = await ctx.task(validationReportGenerationTask, {
    projectName,
    sortingType,
    studyPlanning,
    cardPreparation,
    participantRecruitment,
    sessionFacilitation,
    similarityAnalysis,
    dendrogramAnalysis,
    categoryLabeling,
    categoryValidation,
    navigationRecommendations,
    insightGeneration,
    outputDir
  });

  artifacts.push(...validationReport.artifacts);

  // ============================================================================
  // PHASE 13: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Scoring card sorting study quality and reliability');
  const qualityScoring = await ctx.task(qualityScoringTask, {
    projectName,
    sortingType,
    participantCount: sessionFacilitation.completedSessions,
    targetParticipantCount: participantCount,
    cardCount: cardPreparation.finalCards.length,
    agreementScore: similarityAnalysis.overallAgreementScore,
    categoryValidation,
    sessionFacilitation,
    minAgreementScore,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  const qualityScore = qualityScoring.overallScore;
  const qualityMet = qualityScore >= 75;

  // Final Breakpoint: Review complete card sorting deliverables
  await ctx.breakpoint({
    question: `Card sorting study complete! Quality score: ${qualityScore}/100. Agreement score: ${similarityAnalysis.overallAgreementScore}/100. ${qualityMet ? 'Study meets quality standards!' : 'Study may benefit from additional sessions or refinement.'} Review findings and approve?`,
    title: 'Card Sorting Final Review',
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
        sortingType,
        qualityScore,
        qualityMet,
        agreementScore: similarityAnalysis.overallAgreementScore,
        agreementMet: similarityAnalysis.overallAgreementScore >= minAgreementScore,
        studyMetrics: {
          targetParticipants: participantCount,
          completedSessions: sessionFacilitation.completedSessions,
          cardCount: cardPreparation.finalCards.length,
          clustersIdentified: dendrogramAnalysis.clusters.length,
          strongPairings: similarityAnalysis.strongPairings.length
        },
        recommendations: {
          totalRecommendations: insightGeneration.insights.length,
          criticalInsights: insightGeneration.criticalInsights.length,
          categoryChanges: categoryValidation.recommendedChanges.length,
          navigationStructureReady: !!navigationRecommendations
        }
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    sortingType,
    qualityScore,
    qualityMet,
    studyConfiguration: {
      cardCount: cardPreparation.finalCards.length,
      participantTarget: participantCount,
      actualParticipants: sessionFacilitation.completedSessions,
      completionRate: sessionFacilitation.completionRate,
      toolUsed: toolSetup.toolName,
      studyUrl: toolSetup.studyUrl
    },
    sortingResults: {
      completedSessions: sessionFacilitation.completedSessions,
      averageSessionDuration: sessionFacilitation.averageSessionDuration,
      agreementScore: similarityAnalysis.overallAgreementScore,
      agreementMet: similarityAnalysis.overallAgreementScore >= minAgreementScore,
      strongPairings: similarityAnalysis.strongPairings.length,
      weakPairings: similarityAnalysis.weakPairings.length,
      dataQuality: sessionFacilitation.dataQuality
    },
    dendrogramAnalysis: {
      clusters: dendrogramAnalysis.clusters.length,
      clusterQuality: dendrogramAnalysis.clusterQuality,
      uncertainGroupings: dendrogramAnalysis.uncertainGroupings.length,
      recommendedCategoryCount: dendrogramAnalysis.recommendedCategoryCount,
      dendrogramPath: dendrogramAnalysis.dendrogramPath
    },
    categoryResults: sortingType === 'open' || sortingType === 'hybrid' ? {
      participantCategoryCount: categoryLabeling.participantCategoryRange,
      popularLabels: categoryLabeling.popularLabels.slice(0, 10),
      recommendedLabels: categoryLabeling.recommendedLabels,
      labelConsistency: categoryLabeling.labelConsistency
    } : {
      existingCategories: cardPreparation.categories.length,
      categoryAgreement: categoryValidation.categoryAgreementScores,
      validationResults: categoryValidation.validationResults
    },
    categoryRecommendations: categoryValidation.recommendedCategories,
    navigationStructure: navigationRecommendations ? {
      primaryNavigation: navigationRecommendations.primaryNavigation,
      secondaryNavigation: navigationRecommendations.secondaryNavigation,
      hierarchy: navigationRecommendations.hierarchy,
      implementationGuidance: navigationRecommendations.implementationGuidance
    } : null,
    insights: {
      total: insightGeneration.insights.length,
      criticalInsights: insightGeneration.criticalInsights,
      keyFindings: insightGeneration.keyFindings,
      surprisingResults: insightGeneration.surprisingResults,
      objectivesAddressed: insightGeneration.objectivesAddressed
    },
    validationReport: validationReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/card-sorting',
      timestamp: startTime,
      projectName,
      sortingType,
      outputDir,
      toolUsed: toolSetup.toolName,
      participantCount: sessionFacilitation.completedSessions,
      agreementScore: similarityAnalysis.overallAgreementScore
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Card Sorting Study Planning
export const studyPlanningTask = defineTask('study-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan card sorting study and methodology',
  agent: {
    name: 'card-sorting-planner',
    prompt: {
      role: 'senior UX researcher specializing in card sorting methodology',
      task: 'Design comprehensive card sorting study plan including methodology selection, participant requirements, and success criteria',
      context: args,
      instructions: [
        'Review research objectives to align card sorting methodology',
        'Select optimal card sorting type:',
        '  - Open card sort: participants create their own categories (exploratory, greenfield IA)',
        '  - Closed card sort: participants sort into predefined categories (validating existing IA)',
        '  - Hybrid: participants can add categories to predefined set (refinement)',
        'Validate content items are appropriate for card sorting (30-60 cards optimal)',
        'If >60 items, recommend multiple sorting studies or prioritization',
        'If <30 items, recommend expanding card set for meaningful results',
        'Define target participant count (15-30 for statistical significance)',
        'Ensure target audience represents actual users',
        'Plan for remote vs in-person sessions',
        'Remote: scalable, async, larger sample, tools like Optimal Workshop',
        'In-person: richer qualitative data, can probe reasoning, smaller sample',
        'Define study success criteria and agreement score thresholds',
        'Plan follow-up questions to understand reasoning',
        'Estimate timeline and budget (incentives, tools, facilitation)',
        'Document methodology rationale and create study protocol',
        'Identify potential risks and mitigation strategies'
      ],
      outputFormat: 'JSON with sortingMethodology (string), recommendedCardCount (number), targetParticipants (number), sessionFormat (string), successCriteria (array), studyProtocol (object), timeline (string), budget (object), incentiveStructure (object), risks (array), studyApproved (boolean), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sortingMethodology', 'recommendedCardCount', 'targetParticipants', 'studyApproved', 'artifacts'],
      properties: {
        sortingMethodology: { type: 'string', enum: ['open', 'closed', 'hybrid'] },
        recommendedCardCount: { type: 'number', minimum: 20, maximum: 100 },
        targetParticipants: { type: 'number', minimum: 10, maximum: 50 },
        sessionFormat: { type: 'string', enum: ['remote-unmoderated', 'remote-moderated', 'in-person'] },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        studyProtocol: {
          type: 'object',
          properties: {
            introduction: { type: 'string' },
            instructions: { type: 'array', items: { type: 'string' } },
            estimatedDuration: { type: 'string' },
            followUpQuestions: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: { type: 'string' },
        budget: {
          type: 'object',
          properties: {
            toolCosts: { type: 'string' },
            participantIncentives: { type: 'string' },
            facilitationTime: { type: 'string' },
            total: { type: 'string' }
          }
        },
        incentiveStructure: {
          type: 'object',
          properties: {
            amount: { type: 'string' },
            format: { type: 'string' },
            criteria: { type: 'string' }
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
        studyApproved: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'study-planning']
}));

// Task 2: Card Preparation and Content Curation
export const cardPreparationTask = defineTask('card-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and curate cards for sorting study',
  agent: {
    name: 'card-curator',
    prompt: {
      role: 'information architect and content strategist',
      task: 'Curate and prepare optimal set of cards for card sorting study with clear, unambiguous labels',
      context: args,
      instructions: [
        'Review all content items provided',
        'Select representative content items for card sorting',
        'Aim for target card count (typically 30-60 cards)',
        'Ensure cards represent diverse content types and categories',
        'Create clear, concise card labels (typically 2-5 words)',
        'Avoid ambiguous terms or internal jargon',
        'Use language familiar to target users',
        'Ensure cards are distinct and non-overlapping',
        'Include important content items users would actually seek',
        'Exclude overly specific or redundant items',
        'For closed sorts, prepare predefined categories:',
        '  - Typically 5-10 categories for closed sorts',
        '  - Clear, distinct category labels',
        '  - Category definitions/descriptions',
        'For hybrid sorts, prepare starter categories but allow flexibility',
        'Create card descriptions if labels need clarification',
        'Randomize card order to prevent ordering bias',
        'Generate card list document with rationale',
        'Create participant instructions document'
      ],
      outputFormat: 'JSON with finalCards (array), cardCount (number), categories (array for closed/hybrid), cardDescriptions (object), excludedCards (array), cardRationale (string), randomizationApplied (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['finalCards', 'cardCount', 'artifacts'],
      properties: {
        finalCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cardId: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' },
              contentType: { type: 'string' },
              originalItem: { type: 'string' }
            }
          }
        },
        cardCount: { type: 'number' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        cardDescriptions: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        excludedCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              card: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        cardRationale: { type: 'string' },
        randomizationApplied: { type: 'boolean' },
        contentTypeDistribution: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'card-preparation']
}));

// Task 3: Tool Setup and Configuration
export const toolSetupTask = defineTask('tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure card sorting tool and study',
  agent: {
    name: 'tool-configurator',
    prompt: {
      role: 'UX researcher and research operations specialist',
      task: 'Set up card sorting tool, configure study parameters, and prepare for participant sessions',
      context: args,
      instructions: [
        'Select optimal card sorting tool based on preference and requirements:',
        '  - Optimal Workshop (OptimalSort): industry standard, robust analytics, dendrograms',
        '  - UserZoom: enterprise platform, integrated with other research tools',
        '  - Miro: collaborative, visual, good for moderated sessions',
        '  - UsabilityHub (Lyssna): affordable, simple interface',
        '  - Maze: modern, user-friendly, good UX',
        'Create study in selected tool',
        'Upload cards with labels and descriptions',
        'For closed/hybrid sorts, configure predefined categories',
        'Set study parameters: randomize card order, session timeout',
        'Configure welcome screen with study introduction',
        'Add instructions: "Group these cards in a way that makes sense to you"',
        'For open sorts: "Create categories and name them"',
        'For closed sorts: "Sort cards into the provided categories"',
        'Configure follow-up questions:',
        '  - "How confident are you in your groupings?" (1-5 scale)',
        '  - "Were any cards difficult to categorize? Which ones?"',
        '  - "Would you suggest any additional categories?"',
        '  - "How would you describe your overall experience?"',
        'Configure thank you screen and completion confirmation',
        'Test study flow with internal team',
        'Generate shareable study URL or access code',
        'Document tool configuration and setup'
      ],
      outputFormat: 'JSON with toolName (string), studyUrl (string), studyConfiguration (object), followUpQuestions (array), testResults (object), participantInstructions (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['toolName', 'studyUrl', 'studyConfiguration', 'artifacts'],
      properties: {
        toolName: { type: 'string' },
        studyUrl: { type: 'string' },
        studyConfiguration: {
          type: 'object',
          properties: {
            cardRandomization: { type: 'boolean' },
            sessionTimeout: { type: 'string' },
            allowMultipleAttempts: { type: 'boolean' },
            captureParticipantInfo: { type: 'boolean' },
            anonymousResponses: { type: 'boolean' }
          }
        },
        followUpQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string', enum: ['multiple-choice', 'rating', 'open-ended'] },
              required: { type: 'boolean' }
            }
          }
        },
        testResults: {
          type: 'object',
          properties: {
            testCompleted: { type: 'boolean' },
            issuesFound: { type: 'array', items: { type: 'string' } },
            adjustmentsMade: { type: 'array', items: { type: 'string' } }
          }
        },
        participantInstructions: { type: 'string' },
        estimatedCompletionTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'tool-setup']
}));

// Task 4: Participant Recruitment
export const participantRecruitmentTask = defineTask('participant-recruitment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recruit and screen participants for card sorting',
  agent: {
    name: 'participant-recruiter',
    prompt: {
      role: 'UX research recruiter and coordinator',
      task: 'Recruit qualified participants matching target audience criteria for card sorting study',
      context: args,
      instructions: [
        'Develop recruitment strategy based on target audience',
        'Recruitment channels: user panels, social media, email lists, customer database, recruiting services',
        'Create recruitment message explaining study purpose and incentive',
        'Apply screening criteria to identify qualified participants',
        'Aim for diverse participant pool (demographics, usage patterns, experience levels)',
        'Over-recruit by 20-30% to account for no-shows and incomplete sessions',
        'For remote unmoderated: send study link with clear instructions',
        'For moderated sessions: schedule sessions and send calendar invites',
        'Send reminder emails before session deadline',
        'Track recruitment status and participation rates',
        'Create participant profiles summarizing demographics',
        'Monitor data collection progress and quality',
        'Follow up with non-responders',
        'Generate recruitment report'
      ],
      outputFormat: 'JSON with confirmedParticipants (array), recruitmentChannels (array), participantDemographics (object), recruitmentRate (string), remindersSent (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedParticipants', 'participantDemographics', 'artifacts'],
      properties: {
        confirmedParticipants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              pseudonym: { type: 'string' },
              demographics: { type: 'object' },
              recruitmentChannel: { type: 'string' },
              invitedDate: { type: 'string' },
              status: { type: 'string', enum: ['invited', 'reminded', 'completed', 'incomplete', 'no-show'] }
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
        participantDemographics: {
          type: 'object',
          properties: {
            ageDistribution: { type: 'object' },
            experienceDistribution: { type: 'object' },
            diversityScore: { type: 'number' }
          }
        },
        recruitmentRate: { type: 'string' },
        remindersSent: { type: 'number' },
        dropoutRate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'recruitment']
}));

// Task 5: Session Facilitation and Data Collection
export const sessionFacilitationTask = defineTask('session-facilitation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Facilitate card sorting sessions and collect data',
  agent: {
    name: 'session-facilitator',
    prompt: {
      role: 'UX researcher and card sorting facilitator',
      task: 'Facilitate card sorting sessions, monitor data collection, and gather participant feedback',
      context: args,
      instructions: [
        'For remote unmoderated sessions:',
        '  - Monitor study completion rates',
        '  - Check data quality as sessions complete',
        '  - Send reminders to non-completers',
        '  - Track average completion time',
        'For moderated sessions:',
        '  - Welcome participant and explain study',
        '  - Observe sorting process (think-aloud if possible)',
        '  - Take notes on reasoning and hesitations',
        '  - Ask follow-up questions about grouping decisions',
        '  - Probe on difficult cards or uncertain placements',
        'Collect complete sorting data for each participant:',
        '  - Card groupings (which cards in which categories)',
        '  - Category labels (for open/hybrid sorts)',
        '  - Completion time',
        '  - Follow-up question responses',
        '  - Confidence ratings',
        'Identify incomplete or low-quality sessions',
        'Monitor for patterns: cards frequently ungrouped, categories with single cards',
        'Document participant feedback and observations',
        'Compile all session data into structured format',
        'Calculate participation metrics and data quality',
        'Generate session summary report'
      ],
      outputFormat: 'JSON with completedSessions (number), incompleteSessions (number), sortingData (array), participantCategoryLabels (array for open/hybrid), averageSessionDuration (string), averageCategoryCount (number for open/hybrid), followUpResponses (array), dataQuality (string), completionRate (string), observations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completedSessions', 'sortingData', 'completionRate', 'dataQuality', 'artifacts'],
      properties: {
        completedSessions: { type: 'number' },
        incompleteSessions: { type: 'number' },
        sortingData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              cardGroupings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    cards: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              completionTime: { type: 'number' },
              confidenceRating: { type: 'number' }
            }
          }
        },
        participantCategoryLabels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    cardCount: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        averageSessionDuration: { type: 'string' },
        averageCategoryCount: { type: 'number' },
        followUpResponses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              responses: { type: 'object' }
            }
          }
        },
        dataQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        completionRate: { type: 'string' },
        difficultCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cardId: { type: 'string' },
              frequency: { type: 'number' },
              participantFeedback: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        observations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'session-facilitation']
}));

// Task 6: Similarity Matrix Analysis
export const similarityMatrixAnalysisTask = defineTask('similarity-matrix-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze similarity matrices and card relationships',
  agent: {
    name: 'similarity-analyst',
    prompt: {
      role: 'data analyst and UX researcher specializing in card sorting analysis',
      task: 'Calculate similarity matrices showing how frequently cards were grouped together, identify strong and weak pairings',
      context: args,
      instructions: [
        'Create similarity matrix (also called co-occurrence matrix):',
        '  - For each pair of cards, calculate % of participants who grouped them together',
        '  - Matrix shows pairwise similarity scores (0-100%)',
        '  - High scores indicate strong agreement on grouping',
        'Calculate overall agreement score across all participants',
        'Identify strong pairings (cards grouped together >70% of time)',
        'Identify weak pairings (cards grouped together <30% of time)',
        'Identify controversial cards (high variance in placement)',
        'Find cards frequently left ungrouped or isolated',
        'Calculate inter-rater reliability (agreement between participants)',
        'Generate similarity matrix visualization (heatmap)',
        'Create distance matrix (inverse of similarity) for clustering',
        'Identify natural groupings based on similarity scores',
        'Document cards with low agreement requiring investigation',
        'Generate similarity analysis report with key findings'
      ],
      outputFormat: 'JSON with similarityMatrix (object), overallAgreementScore (number 0-100), strongPairings (array), weakPairings (array), controversialCards (array), isolatedCards (array), interRaterReliability (number), distanceMatrix (object), naturalGroupings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['similarityMatrix', 'overallAgreementScore', 'strongPairings', 'artifacts'],
      properties: {
        similarityMatrix: {
          type: 'object',
          properties: {
            matrixData: { type: 'object' },
            heatmapPath: { type: 'string' }
          }
        },
        overallAgreementScore: { type: 'number', minimum: 0, maximum: 100 },
        strongPairings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              card1: { type: 'string' },
              card2: { type: 'string' },
              similarityScore: { type: 'number' },
              percentage: { type: 'string' }
            }
          }
        },
        weakPairings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              card1: { type: 'string' },
              card2: { type: 'string' },
              similarityScore: { type: 'number' }
            }
          }
        },
        controversialCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cardId: { type: 'string' },
              varianceScore: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        isolatedCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cardId: { type: 'string' },
              isolationFrequency: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        interRaterReliability: { type: 'number', minimum: 0, maximum: 1 },
        distanceMatrix: {
          type: 'object',
          properties: {
            matrixData: { type: 'object' }
          }
        },
        naturalGroupings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              grouping: { type: 'string' },
              cards: { type: 'array', items: { type: 'string' } },
              cohesionScore: { type: 'number' }
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
  labels: ['agent', 'card-sorting', 'similarity-analysis']
}));

// Task 7: Dendrogram Analysis and Cluster Identification
export const dendrogramAnalysisTask = defineTask('dendrogram-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform dendrogram analysis and identify clusters',
  agent: {
    name: 'dendrogram-analyst',
    prompt: {
      role: 'data scientist and UX researcher specializing in hierarchical clustering',
      task: 'Perform hierarchical cluster analysis, generate dendrograms, and identify optimal category groupings',
      context: args,
      instructions: [
        'Perform hierarchical cluster analysis on distance matrix',
        'Use agglomerative clustering (bottom-up approach):',
        '  - Start with each card as its own cluster',
        '  - Iteratively merge closest clusters',
        '  - Continue until all cards in single cluster',
        'Select linkage method (average linkage typically best for card sorting)',
        'Generate dendrogram visualization showing hierarchical relationships',
        'Identify optimal "cut height" to determine category count:',
        '  - Too few categories: overly broad, low findability',
        '  - Too many categories: cognitive overload, fragmentation',
        '  - Sweet spot typically 5-9 top-level categories',
        'Analyze cluster quality and cohesion scores',
        'Identify clear, distinct clusters with high internal similarity',
        'Flag uncertain or ambiguous groupings (cards between clusters)',
        'Compare dendrogram results with participant-generated groupings',
        'For closed sorts, compare dendrogram with predefined categories',
        'Identify cards that consistently cluster together across different cut heights',
        'Recommend optimal category structure based on analysis',
        'Generate dendrogram report with interpretation guide'
      ],
      outputFormat: 'JSON with dendrogramPath (string), clusters (array), recommendedCategoryCount (number), clusterQuality (string), uncertainGroupings (array), comparisonWithParticipants (object), optimalCutHeight (number), hierarchyLevels (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dendrogramPath', 'clusters', 'recommendedCategoryCount', 'clusterQuality', 'artifacts'],
      properties: {
        dendrogramPath: { type: 'string' },
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clusterId: { type: 'string' },
              cards: { type: 'array', items: { type: 'string' } },
              cohesionScore: { type: 'number' },
              averageSimilarity: { type: 'number' },
              size: { type: 'number' }
            }
          }
        },
        recommendedCategoryCount: { type: 'number' },
        clusterQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        uncertainGroupings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cardId: { type: 'string' },
              possibleClusters: { type: 'array', items: { type: 'string' } },
              reason: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        comparisonWithParticipants: {
          type: 'object',
          properties: {
            alignmentScore: { type: 'number' },
            majorDifferences: { type: 'array', items: { type: 'string' } },
            convergentPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        optimalCutHeight: { type: 'number' },
        hierarchyLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              categoryCount: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        interpretationGuidance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'dendrogram-analysis']
}));

// Task 8: Category Labeling Analysis (for open/hybrid sorts)
export const categoryLabelingAnalysisTask = defineTask('category-labeling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze participant-generated category labels',
  agent: {
    name: 'category-labeling-analyst',
    prompt: {
      role: 'content strategist and taxonomy specialist',
      task: 'Analyze category labels created by participants, identify popular labels, and recommend optimal category naming scheme',
      context: args,
      instructions: [
        'Collect all category labels created by participants',
        'Analyze label frequency and popularity',
        'Identify most common labels for each cluster',
        'Group synonymous labels (e.g., "Products" vs "Items", "Help" vs "Support")',
        'Calculate label consistency score (how often participants chose similar names)',
        'Identify clear, popular labels with high agreement',
        'Flag ambiguous or vague labels ("Other", "Miscellaneous", "Stuff")',
        'Analyze participant category count distribution:',
        '  - Average number of categories created',
        '  - Range (min to max categories)',
        '  - Modal category count',
        'Compare participant labels with dendrogram clusters',
        'Identify alignment: do popular labels match natural clusters?',
        'Recommend category labels combining:',
        '  - Popular participant terminology (user language)',
        '  - Clear, distinct meaning (no overlap)',
        '  - Appropriate abstraction level',
        '  - SEO and findability optimization',
        'Document label rationale and alternatives',
        'Generate category labeling recommendations report'
      ],
      outputFormat: 'JSON with participantCategoryRange (object), popularLabels (array), labelConsistency (number 0-100), recommendedLabels (array), synonymGroups (array), ambiguousLabels (array), averageCategoryCount (number), alignmentWithClusters (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['participantCategoryRange', 'popularLabels', 'labelConsistency', 'recommendedLabels', 'artifacts'],
      properties: {
        participantCategoryRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            average: { type: 'number' },
            median: { type: 'number' },
            mode: { type: 'number' }
          }
        },
        popularLabels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              frequency: { type: 'number' },
              percentage: { type: 'string' },
              cluster: { type: 'string' }
            }
          }
        },
        labelConsistency: { type: 'number', minimum: 0, maximum: 100 },
        recommendedLabels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              clusterId: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              participantSupport: { type: 'string' }
            }
          }
        },
        synonymGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              primaryLabel: { type: 'string' },
              synonyms: { type: 'array', items: { type: 'string' } },
              recommendedLabel: { type: 'string' }
            }
          }
        },
        ambiguousLabels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              issue: { type: 'string' },
              replacement: { type: 'string' }
            }
          }
        },
        averageCategoryCount: { type: 'number' },
        alignmentWithClusters: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
        labelingPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              observation: { type: 'string' }
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
  labels: ['agent', 'card-sorting', 'category-labeling']
}));

// Task 9: Category Validation and Agreement Scoring
export const categoryValidationTask = defineTask('category-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate categories and calculate agreement scores',
  agent: {
    name: 'category-validator',
    prompt: {
      role: 'UX researcher and statistical analyst',
      task: 'Validate category structure, calculate agreement scores, and provide recommendations for IA refinement',
      context: args,
      instructions: [
        'For each identified category/cluster:',
        '  - Calculate within-category agreement (how consistently participants grouped these cards)',
        '  - Assess category cohesion and distinctness',
        '  - Identify outlier cards that don\'t fit well',
        'For open sorts:',
        '  - Validate recommended categories against participant groupings',
        '  - Calculate agreement scores for each recommended category',
        '  - Ensure categories are comprehensive (all cards accounted for)',
        'For closed sorts:',
        '  - Validate predefined categories against participant behavior',
        '  - Calculate agreement score for each predefined category',
        '  - Identify misplaced cards frequently sorted into wrong categories',
        '  - Recommend category improvements (rename, merge, split, add)',
        'Calculate overall validation score combining:',
        '  - Inter-participant agreement',
        '  - Cluster quality',
        '  - Category label clarity',
        '  - Completeness (no orphan cards)',
        'Identify problematic categories:',
        '  - Too broad (many unrelated items)',
        '  - Too narrow (very few items)',
        '  - Unclear purpose or labeling',
        '  - High disagreement among participants',
        'Recommend category refinements:',
        '  - Merge overlapping categories',
        '  - Split overly broad categories',
        '  - Rename unclear categories',
        '  - Relocate misplaced cards',
        'Generate category validation report with specific recommendations'
      ],
      outputFormat: 'JSON with recommendedCategories (array), categoryAgreementScores (object), validationResults (object), problematicCategories (array), recommendedChanges (array), validationScore (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedCategories', 'validationScore', 'recommendedChanges', 'artifacts'],
      properties: {
        recommendedCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryLabel: { type: 'string' },
              description: { type: 'string' },
              cards: { type: 'array', items: { type: 'string' } },
              agreementScore: { type: 'number' },
              cohesionScore: { type: 'number' },
              participantSupport: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        categoryAgreementScores: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        validationResults: {
          type: 'object',
          properties: {
            totalCategories: { type: 'number' },
            highAgreementCategories: { type: 'number' },
            moderateAgreementCategories: { type: 'number' },
            lowAgreementCategories: { type: 'number' },
            orphanCards: { type: 'array', items: { type: 'string' } },
            misplacedCards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cardId: { type: 'string' },
                  currentCategory: { type: 'string' },
                  recommendedCategory: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        problematicCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryLabel: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendedChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              changeType: { type: 'string', enum: ['merge', 'split', 'rename', 'relocate', 'add'] },
              description: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        meetsAgreementThreshold: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'category-validation']
}));

// Task 10: Navigation Structure Recommendations
export const navigationRecommendationsTask = defineTask('navigation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate navigation structure recommendations',
  agent: {
    name: 'navigation-architect',
    prompt: {
      role: 'senior information architect and navigation designer',
      task: 'Transform card sorting results into actionable navigation structure recommendations for website/application',
      context: args,
      instructions: [
        'Analyze validated categories to design navigation structure',
        'Recommend primary navigation (top-level categories):',
        '  - Typically 5-9 items for optimal cognitive load',
        '  - Use most popular, high-agreement categories',
        '  - Ensure categories are mutually exclusive',
        '  - Order by priority, frequency, or logical sequence',
        'Recommend secondary navigation (subcategories):',
        '  - Break down large categories into subcategories',
        '  - Use dendrogram hierarchy levels',
        '  - Keep consistent depth (typically 2-3 levels max)',
        'Define navigation patterns:',
        '  - Mega menu: for many subcategories',
        '  - Dropdown: for moderate subcategories',
        '  - Flyout: for nested hierarchies',
        '  - Tabs: for sibling categories',
        'Recommend utility navigation (search, help, account)',
        'Suggest contextual navigation (related items, cross-links)',
        'Design breadcrumb hierarchy based on category structure',
        'Plan for mobile navigation (hamburger menu, bottom nav, progressive disclosure)',
        'Recommend page templates for each category type',
        'Suggest information scent and labeling approach',
        'Create visual navigation structure diagram',
        'Provide implementation guidance and best practices',
        'Document navigation rationale and user research support'
      ],
      outputFormat: 'JSON with primaryNavigation (array), secondaryNavigation (object), navigationPattern (string), mobileNavigation (object), breadcrumbStructure (array), pageTemplates (array), hierarchy (object), implementationGuidance (string), navigationDiagram (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryNavigation', 'secondaryNavigation', 'hierarchy', 'implementationGuidance', 'artifacts'],
      properties: {
        primaryNavigation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              category: { type: 'string' },
              cardCount: { type: 'number' },
              agreementScore: { type: 'number' },
              order: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        secondaryNavigation: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                parent: { type: 'string' },
                cards: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        navigationPattern: { type: 'string' },
        navigationPatternRationale: { type: 'string' },
        mobileNavigation: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            primaryTreatment: { type: 'string' },
            secondaryTreatment: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        breadcrumbStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              label: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        pageTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              template: { type: 'string' },
              purpose: { type: 'string' },
              categories: { type: 'array', items: { type: 'string' } },
              navigationElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hierarchy: {
          type: 'object',
          properties: {
            depth: { type: 'number' },
            breadth: { type: 'number' },
            structure: { type: 'string' },
            visualization: { type: 'string' }
          }
        },
        informationScent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              scentProviders: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'string' }
            }
          }
        },
        implementationGuidance: { type: 'string' },
        navigationDiagram: { type: 'string' },
        usabilityConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'navigation-recommendations']
}));

// Task 11: Insight Generation and Findings Synthesis
export const insightGenerationTask = defineTask('insight-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate insights and synthesize findings',
  agent: {
    name: 'insights-synthesizer',
    prompt: {
      role: 'senior UX researcher and strategic analyst',
      task: 'Synthesize card sorting findings into actionable insights addressing research objectives',
      context: args,
      instructions: [
        'Review all card sorting data and analysis',
        'Connect findings back to original research objectives',
        'Generate key insights about user mental models:',
        '  - How do users naturally categorize content?',
        '  - What groupings were unexpected or surprising?',
        '  - Where do user mental models differ from current/proposed IA?',
        'Identify critical findings requiring immediate action',
        'Document surprising results and their implications',
        'Highlight areas of strong user agreement (design confidence)',
        'Highlight areas of low agreement (need more research or flexibility)',
        'Compare results with any existing IA structure',
        'Identify gaps: content types users expected but weren\'t included',
        'Document participant feedback and qualitative observations',
        'Prioritize insights by:',
        '  - Impact on user experience',
        '  - Alignment with business goals',
        '  - Ease of implementation',
        'Generate actionable recommendations for IA design',
        'Create executive summary highlighting key takeaways',
        'Document insights that inform future research or design decisions'
      ],
      outputFormat: 'JSON with insights (array), criticalInsights (array), keyFindings (array), surprisingResults (array), userMentalModels (array), objectivesAddressed (array), gapsIdentified (array), prioritizedRecommendations (array), executiveSummary (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'criticalInsights', 'keyFindings', 'objectivesAddressed', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              implications: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              supportingData: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        surprisingResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              result: { type: 'string' },
              expectation: { type: 'string' },
              actual: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        userMentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mentalModel: { type: 'string' },
              description: { type: 'string' },
              evidence: { type: 'string' },
              designImplication: { type: 'string' }
            }
          }
        },
        objectivesAddressed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              addressed: { type: 'boolean' },
              findings: { type: 'array', items: { type: 'string' } },
              completeness: { type: 'string', enum: ['fully', 'partially', 'not-addressed'] }
            }
          }
        },
        gapsIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              type: { type: 'string', enum: ['content', 'category', 'methodology', 'research'] },
              recommendation: { type: 'string' }
            }
          }
        },
        prioritizedRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        executiveSummary: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'insight-generation']
}));

// Task 12: Validation Report Generation
export const validationReportGenerationTask = defineTask('validation-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive validation report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'UX researcher and technical writer',
      task: 'Create comprehensive card sorting validation report consolidating all findings, analysis, and recommendations',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Study purpose and objectives',
        '  - Key findings and insights',
        '  - Top recommendations for IA',
        '  - Agreement scores and validation results',
        'Document methodology section:',
        '  - Card sorting type (open/closed/hybrid) and rationale',
        '  - Card preparation and curation',
        '  - Tool used and configuration',
        '  - Participant recruitment and demographics',
        '  - Session facilitation approach',
        'Present study results:',
        '  - Participation metrics (completion rate, session duration)',
        '  - Overall agreement score and interpretation',
        '  - Data quality assessment',
        'Include similarity matrix analysis:',
        '  - Heatmap visualization',
        '  - Strong and weak pairings',
        '  - Controversial cards analysis',
        'Include dendrogram analysis:',
        '  - Dendrogram visualization',
        '  - Cluster identification',
        '  - Recommended category structure',
        'Present category validation results:',
        '  - Recommended categories with agreement scores',
        '  - Category descriptions and card assignments',
        '  - Problematic categories and recommendations',
        'For open sorts: include category labeling analysis',
        'Include navigation structure recommendations',
        'Document insights and key findings',
        'Provide actionable recommendations prioritized by impact',
        'Include limitations and caveats',
        'Add next steps and future research needs',
        'Include appendices:',
        '  - Complete card list',
        '  - Raw similarity matrix data',
        '  - Participant feedback',
        '  - Tool screenshots',
        'Format as professional, stakeholder-ready document'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), topRecommendations (array), reportSections (array), appendices (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'topRecommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              evidence: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' },
              path: { type: 'string' }
            }
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
        limitations: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        reportCompleteness: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'card-sorting', 'documentation', 'reporting']
}));

// Task 13: Quality Scoring
export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score card sorting study quality and reliability',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'principal UX researcher and research quality auditor',
      task: 'Assess card sorting study quality, rigor, and reliability to validate findings',
      context: args,
      instructions: [
        'Evaluate study design quality (weight: 20%):',
        '  - Appropriate methodology selection?',
        '  - Optimal card count (30-60 cards)?',
        '  - Clear research objectives?',
        '  - Well-designed study protocol?',
        'Evaluate participant sample quality (weight: 20%):',
        '  - Sufficient participant count (15-30 optimal)?',
        '  - Representative of target audience?',
        '  - Diverse participant pool?',
        '  - High completion rate (>80% good)?',
        'Evaluate data quality (weight: 20%):',
        '  - Complete sessions with all cards sorted?',
        '  - Reasonable session duration (not too fast)?',
        '  - Few isolated/ungrouped cards?',
        '  - Participant engagement (follow-up responses)?',
        'Evaluate agreement and reliability (weight: 25%):',
        '  - Overall agreement score above threshold?',
        '  - Reasonable inter-rater reliability?',
        '  - Strong pairings identified?',
        '  - Clear cluster formation?',
        'Evaluate analysis thoroughness (weight: 10%):',
        '  - Similarity matrix analyzed?',
        '  - Dendrogram generated and interpreted?',
        '  - Category validation performed?',
        '  - Insights generated?',
        'Evaluate actionability (weight: 5%):',
        '  - Clear recommendations provided?',
        '  - Navigation structure defined?',
        '  - Implementation guidance included?',
        'Calculate weighted overall quality score (0-100)',
        'Identify strengths and limitations',
        'Assess confidence level in findings',
        'Recommend additional research if needed',
        'Validate study meets statistical significance thresholds'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), strengths (array), limitations (array), confidenceLevel (string), meetsStatisticalSignificance (boolean), recommendations (array), reliabilityAssessment (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'confidenceLevel', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            studyDesign: { type: 'number' },
            participantSample: { type: 'number' },
            dataQuality: { type: 'number' },
            agreementReliability: { type: 'number' },
            analysisThoroughness: { type: 'number' },
            actionability: { type: 'number' }
          }
        },
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
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitation: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major'] },
              mitigation: { type: 'string' }
            }
          }
        },
        confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        meetsStatisticalSignificance: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        reliabilityAssessment: { type: 'string' },
        additionalResearchNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              researchType: { type: 'string' },
              purpose: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        validityThreats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['agent', 'card-sorting', 'quality-scoring', 'validation']
}));
