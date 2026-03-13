/**
 * @process product-management/user-story-mapping
 * @description User Story Mapping process with user activity identification, task breakdown, story creation, prioritization, and release planning for product development
 * @inputs { productName: string, productGoal: string, userPersonas: array, existingBacklog: array, outputDir: string, releaseCount: number, teamCapacity: number }
 * @outputs { success: boolean, userActivities: array, userTasks: array, userStories: array, releaseMap: object, prioritizedBacklog: array, artifacts: array, metadata: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName = 'Product',
    productGoal = '',
    userPersonas = [],
    existingBacklog = [],
    outputDir = 'user-story-mapping-output',
    releaseCount = 3,
    teamCapacity = 100, // story points per release
    includeAcceptanceCriteria = true,
    estimationTechnique = 'story-points', // story-points | t-shirt-sizes | hours
    minimumQualityScore = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting User Story Mapping for ${productName}`);

  // ============================================================================
  // PHASE 1: PRODUCT CONTEXT AND USER RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing product context and user research');
  const contextAnalysis = await ctx.task(contextAnalysisTask, {
    productName,
    productGoal,
    userPersonas,
    existingBacklog,
    outputDir
  });

  artifacts.push(...contextAnalysis.artifacts);

  if (!contextAnalysis.hasAdequateInformation) {
    ctx.log('warn', 'Insufficient information to create comprehensive story map');
    return {
      success: false,
      reason: 'Insufficient information',
      missingInformation: contextAnalysis.missingInformation,
      recommendations: contextAnalysis.recommendations,
      metadata: {
        processId: 'product-management/user-story-mapping',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: USER ACTIVITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying high-level user activities');
  const userActivities = await ctx.task(userActivityIdentificationTask, {
    productName,
    productGoal: contextAnalysis.refinedProductGoal,
    userPersonas: contextAnalysis.enrichedPersonas,
    userJourneys: contextAnalysis.userJourneys,
    outputDir
  });

  artifacts.push(...userActivities.artifacts);

  // ============================================================================
  // PHASE 3: TASK BREAKDOWN
  // ============================================================================

  ctx.log('info', 'Phase 3: Breaking down activities into user tasks');
  const userTasks = await ctx.task(taskBreakdownTask, {
    productName,
    userActivities: userActivities.activities,
    userPersonas: contextAnalysis.enrichedPersonas,
    userJourneys: contextAnalysis.userJourneys,
    outputDir
  });

  artifacts.push(...userTasks.artifacts);

  // Breakpoint: Review user activities and tasks
  await ctx.breakpoint({
    question: `User story map backbone created with ${userActivities.activities.length} activities and ${userTasks.tasks.length} tasks. Review structure before creating stories?`,
    title: 'Story Map Backbone Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        activitiesCount: userActivities.activities.length,
        tasksCount: userTasks.tasks.length,
        personasCount: contextAnalysis.enrichedPersonas.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: USER STORY CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating detailed user stories');
  const userStories = await ctx.task(storyCreationTask, {
    productName,
    userActivities: userActivities.activities,
    userTasks: userTasks.tasks,
    userPersonas: contextAnalysis.enrichedPersonas,
    includeAcceptanceCriteria,
    outputDir
  });

  artifacts.push(...userStories.artifacts);

  // ============================================================================
  // PHASE 5: STORY ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Estimating user stories');
  const storyEstimation = await ctx.task(storyEstimationTask, {
    productName,
    userStories: userStories.stories,
    estimationTechnique,
    teamCapacity,
    outputDir
  });

  artifacts.push(...storyEstimation.artifacts);

  // ============================================================================
  // PHASE 6: PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing stories using multiple frameworks');
  const prioritization = await ctx.task(prioritizationTask, {
    productName,
    productGoal: contextAnalysis.refinedProductGoal,
    userStories: userStories.stories,
    estimatedStories: storyEstimation.estimatedStories,
    userPersonas: contextAnalysis.enrichedPersonas,
    businessObjectives: contextAnalysis.businessObjectives,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // Breakpoint: Review prioritization
  await ctx.breakpoint({
    question: `Story prioritization complete with ${prioritization.criticalStories.length} critical, ${prioritization.highPriorityStories.length} high priority stories. Review prioritization?`,
    title: 'Prioritization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalStories: userStories.stories.length,
        criticalStories: prioritization.criticalStories.length,
        highPriorityStories: prioritization.highPriorityStories.length,
        mvpStories: prioritization.mvpCandidates.length
      }
    }
  });

  // ============================================================================
  // PHASE 7: RELEASE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning releases and roadmap');
  const releasePlanning = await ctx.task(releasePlanningTask, {
    productName,
    productGoal: contextAnalysis.refinedProductGoal,
    prioritizedStories: prioritization.prioritizedStories,
    estimatedStories: storyEstimation.estimatedStories,
    releaseCount,
    teamCapacity,
    userActivities: userActivities.activities,
    outputDir
  });

  artifacts.push(...releasePlanning.artifacts);

  // ============================================================================
  // PHASE 8: MVP DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining Minimum Viable Product (MVP)');
  const mvpDefinition = await ctx.task(mvpDefinitionTask, {
    productName,
    productGoal: contextAnalysis.refinedProductGoal,
    userActivities: userActivities.activities,
    prioritizedStories: prioritization.prioritizedStories,
    releaseMap: releasePlanning.releaseMap,
    teamCapacity,
    outputDir
  });

  artifacts.push(...mvpDefinition.artifacts);

  // ============================================================================
  // PHASE 9: DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 9: Mapping story dependencies and sequencing');
  const dependencyMapping = await ctx.task(dependencyMappingTask, {
    productName,
    userStories: userStories.stories,
    prioritizedStories: prioritization.prioritizedStories,
    releaseMap: releasePlanning.releaseMap,
    userActivities: userActivities.activities,
    outputDir
  });

  artifacts.push(...dependencyMapping.artifacts);

  // ============================================================================
  // PHASE 10: STORY MAP VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating story map visualization');
  const visualization = await ctx.task(visualizationTask, {
    productName,
    userActivities: userActivities.activities,
    userTasks: userTasks.tasks,
    userStories: userStories.stories,
    prioritizedStories: prioritization.prioritizedStories,
    releaseMap: releasePlanning.releaseMap,
    mvpStories: mvpDefinition.mvpStories,
    dependencyGraph: dependencyMapping.dependencyGraph,
    outputDir
  });

  artifacts.push(...visualization.artifacts);

  // ============================================================================
  // PHASE 11: BACKLOG GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating prioritized product backlog');
  const backlogGeneration = await ctx.task(backlogGenerationTask, {
    productName,
    prioritizedStories: prioritization.prioritizedStories,
    estimatedStories: storyEstimation.estimatedStories,
    releaseMap: releasePlanning.releaseMap,
    dependencyGraph: dependencyMapping.dependencyGraph,
    mvpStories: mvpDefinition.mvpStories,
    outputDir
  });

  artifacts.push(...backlogGeneration.artifacts);

  // ============================================================================
  // PHASE 12: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Validating story map quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    userActivities: userActivities.activities,
    userTasks: userTasks.tasks,
    userStories: userStories.stories,
    prioritizedStories: prioritization.prioritizedStories,
    releaseMap: releasePlanning.releaseMap,
    mvpDefinition,
    minimumQualityScore,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= minimumQualityScore;

  // Final breakpoint: Review complete story map
  await ctx.breakpoint({
    question: `User story mapping complete for ${productName}. Quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'Story map meets quality standards!' : 'Story map may need refinement.'} Review and approve?`,
    title: 'Final Story Map Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        totalActivities: userActivities.activities.length,
        totalTasks: userTasks.tasks.length,
        totalStories: userStories.stories.length,
        mvpStories: mvpDefinition.mvpStories.length,
        plannedReleases: releasePlanning.releaseMap.releases.length,
        estimatedDuration: releasePlanning.estimatedDuration
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    qualityScore: qualityValidation.overallScore,
    qualityMet,
    userActivities: userActivities.activities,
    userTasks: userTasks.tasks,
    userStories: {
      total: userStories.stories.length,
      stories: userStories.stories,
      byPriority: {
        critical: prioritization.criticalStories.length,
        high: prioritization.highPriorityStories.length,
        medium: prioritization.mediumPriorityStories.length,
        low: prioritization.lowPriorityStories.length
      }
    },
    estimation: {
      technique: estimationTechnique,
      totalEstimate: storyEstimation.totalEstimate,
      averageEstimate: storyEstimation.averageEstimate,
      estimationConfidence: storyEstimation.estimationConfidence
    },
    prioritization: {
      framework: prioritization.frameworkUsed,
      mvpCandidates: prioritization.mvpCandidates.length,
      quickWins: prioritization.quickWins?.length || 0,
      strategicBets: prioritization.strategicBets?.length || 0
    },
    releaseMap: {
      releases: releasePlanning.releaseMap.releases,
      estimatedDuration: releasePlanning.estimatedDuration,
      releaseCadence: releasePlanning.releaseCadence,
      roadmapUrl: releasePlanning.roadmapPath
    },
    mvp: {
      storyCount: mvpDefinition.mvpStories.length,
      estimatedEffort: mvpDefinition.estimatedEffort,
      criticalPath: mvpDefinition.criticalPath,
      successCriteria: mvpDefinition.successCriteria
    },
    dependencies: {
      totalDependencies: dependencyMapping.totalDependencies,
      blockerCount: dependencyMapping.blockerCount,
      criticalPath: dependencyMapping.criticalPath
    },
    prioritizedBacklog: backlogGeneration.backlog,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/user-story-mapping',
      timestamp: startTime,
      outputDir,
      productName,
      releaseCount,
      teamCapacity
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Context Analysis
export const contextAnalysisTask = defineTask('context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product context and user research',
  agent: {
    name: 'product-analyst',
    prompt: {
      role: 'senior product manager and user research analyst',
      task: 'Analyze product context, refine product goals, and enrich user personas for story mapping',
      context: args,
      instructions: [
        'Review and refine product goal into clear, measurable outcomes',
        'Analyze existing user personas and enrich with:',
        '  - Jobs to be done',
        '  - Pain points and frustrations',
        '  - Goals and motivations',
        '  - Context of use',
        '  - Success criteria',
        'Identify business objectives and constraints',
        'Map user journeys for each persona (current state)',
        'Identify desired future state and gaps',
        'Review existing backlog for insights and themes',
        'Identify competitive landscape and market positioning',
        'Document assumptions and risks',
        'Assess information adequacy for story mapping',
        'List missing information needed',
        'Provide recommendations for story mapping approach',
        'Save context analysis to output directory'
      ],
      outputFormat: 'JSON with hasAdequateInformation (boolean), refinedProductGoal (string), enrichedPersonas (array), businessObjectives (array), userJourneys (array), assumptions (array), risks (array), marketContext (object), missingInformation (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasAdequateInformation', 'refinedProductGoal', 'enrichedPersonas', 'artifacts'],
      properties: {
        hasAdequateInformation: { type: 'boolean' },
        refinedProductGoal: { type: 'string' },
        enrichedPersonas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              jobsToBeDone: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              goals: { type: 'array', items: { type: 'string' } },
              contextOfUse: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        businessObjectives: { type: 'array', items: { type: 'string' } },
        userJourneys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              currentState: { type: 'array', items: { type: 'string' } },
              desiredState: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        marketContext: {
          type: 'object',
          properties: {
            competitors: { type: 'array', items: { type: 'string' } },
            differentiators: { type: 'array', items: { type: 'string' } },
            marketTrends: { type: 'array', items: { type: 'string' } }
          }
        },
        missingInformation: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story-mapping', 'context-analysis']
}));

// Task 2: User Activity Identification
export const userActivityIdentificationTask = defineTask('user-activity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify high-level user activities',
  agent: {
    name: 'ux-journey-mapper',
    prompt: {
      role: 'UX designer and user journey mapping specialist',
      task: 'Identify high-level user activities that form the backbone of the story map',
      context: args,
      instructions: [
        'Identify 5-15 high-level activities users perform to accomplish their goals',
        'Activities should be:',
        '  - User-centric (not system-centric)',
        '  - Verb-based action phrases (e.g., "Plan trip", "Book accommodation")',
        '  - Time-ordered left to right (chronological flow)',
        '  - Complete user journey from start to finish',
        '  - High-level enough to span multiple user stories',
        'For each activity define:',
        '  - Activity name (verb phrase)',
        '  - Description and purpose',
        '  - Primary persona(s) who perform it',
        '  - Prerequisites or context',
        '  - Expected outcome',
        '  - Business value',
        'Organize activities in logical sequence',
        'Validate activities map to user journeys',
        'Ensure activities cover all personas and jobs to be done',
        'Create activity map visualization (horizontal backbone)',
        'Save user activities and activity map to output directory'
      ],
      outputFormat: 'JSON with activities (array), activityCount (number), personaCoverage (object), businessValue (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'activityCount', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              primaryPersonas: { type: 'array', items: { type: 'string' } },
              prerequisites: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' },
              businessValue: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              sequenceOrder: { type: 'number' }
            }
          }
        },
        activityCount: { type: 'number' },
        personaCoverage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        businessValue: {
          type: 'object',
          properties: {
            criticalActivities: { type: 'number' },
            highValueActivities: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'user-activities']
}));

// Task 3: Task Breakdown
export const taskBreakdownTask = defineTask('task-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Break down activities into user tasks',
  agent: {
    name: 'product-designer',
    prompt: {
      role: 'product designer and interaction specialist',
      task: 'Break down high-level activities into detailed user tasks',
      context: args,
      instructions: [
        'For each user activity, identify 3-10 specific user tasks',
        'Tasks should be:',
        '  - More specific than activities but still user-centric',
        '  - Verb-based actions (e.g., "Enter destination", "Compare prices")',
        '  - Ordered sequentially under each activity',
        '  - At the right level to decompose into stories (not too high, not too detailed)',
        '  - Represent alternative paths and variations',
        'For each task define:',
        '  - Task name (specific verb phrase)',
        '  - Parent activity',
        '  - Description',
        '  - User type/persona',
        '  - Task complexity',
        '  - Variations or alternative paths',
        'Group tasks vertically under their parent activity',
        'Show task alternatives and optional paths',
        'Validate tasks cover all user scenarios',
        'Create task breakdown visualization (vertical under activities)',
        'Save user tasks and task map to output directory'
      ],
      outputFormat: 'JSON with tasks (array), taskCount (number), tasksByActivity (object), complexityDistribution (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'taskCount', 'tasksByActivity', 'artifacts'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              parentActivity: { type: 'string' },
              description: { type: 'string' },
              persona: { type: 'string' },
              complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
              isAlternativePath: { type: 'boolean' },
              isOptional: { type: 'boolean' },
              sequenceOrder: { type: 'number' }
            }
          }
        },
        taskCount: { type: 'number' },
        tasksByActivity: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        complexityDistribution: {
          type: 'object',
          properties: {
            simple: { type: 'number' },
            moderate: { type: 'number' },
            complex: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'task-breakdown']
}));

// Task 4: Story Creation
export const storyCreationTask = defineTask('story-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create detailed user stories',
  agent: {
    name: 'product-owner',
    prompt: {
      role: 'experienced product owner and agile practitioner',
      task: 'Create detailed, well-formed user stories from user tasks',
      context: args,
      instructions: [
        'For each user task, create 1-5 user stories representing implementation details',
        'Use standard user story format: "As a [persona], I want [action] so that [benefit]"',
        'Ensure stories follow INVEST criteria:',
        '  - Independent (can be developed separately)',
        '  - Negotiable (details can be discussed)',
        '  - Valuable (provides value to users/business)',
        '  - Estimable (can be estimated)',
        '  - Small (can be completed in one sprint)',
        '  - Testable (has clear acceptance criteria)',
        'For each story include:',
        '  - User story statement',
        '  - Parent task and activity',
        '  - Persona',
        '  - Description and context',
        '  - Business value/benefit',
        '  - Acceptance criteria (if includeAcceptanceCriteria=true)',
        '  - Technical notes or considerations',
        '  - Definition of Done',
        'Create stories at appropriate granularity (implementable in 1-2 weeks)',
        'Include edge cases and error scenarios as separate stories',
        'Identify technical enablers and infrastructure stories',
        'Save user stories to output directory'
      ],
      outputFormat: 'JSON with stories (array), storyCount (number), storiesByActivity (object), storiesByPersona (object), technicalStories (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stories', 'storyCount', 'artifacts'],
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              userStory: { type: 'string' },
              parentTask: { type: 'string' },
              parentActivity: { type: 'string' },
              persona: { type: 'string' },
              description: { type: 'string' },
              businessValue: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              technicalNotes: { type: 'array', items: { type: 'string' } },
              definitionOfDone: { type: 'array', items: { type: 'string' } },
              storyType: { type: 'string', enum: ['user-facing', 'technical-enabler', 'infrastructure', 'edge-case'] }
            }
          }
        },
        storyCount: { type: 'number' },
        storiesByActivity: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        storiesByPersona: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        technicalStories: { type: 'number' },
        investValidation: {
          type: 'object',
          properties: {
            independent: { type: 'number' },
            negotiable: { type: 'number' },
            valuable: { type: 'number' },
            estimable: { type: 'number' },
            small: { type: 'number' },
            testable: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'story-creation']
}));

// Task 5: Story Estimation
export const storyEstimationTask = defineTask('story-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate user stories',
  agent: {
    name: 'estimation-facilitator',
    prompt: {
      role: 'agile coach and estimation facilitator',
      task: 'Estimate effort for all user stories using specified estimation technique',
      context: args,
      instructions: [
        'Estimate each story using specified technique:',
        '  - story-points: Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)',
        '  - t-shirt-sizes: XS, S, M, L, XL, XXL',
        '  - hours: Estimated hours (with uncertainty range)',
        'Consider factors:',
        '  - Complexity',
        '  - Uncertainty/risk',
        '  - Amount of work',
        '  - Dependencies',
        '  - Technical challenges',
        'Use relative estimation (compare to reference stories)',
        'Identify stories that are too large (should be split)',
        'Identify stories with high uncertainty (need research/spike)',
        'Calculate team velocity implications',
        'Provide estimation confidence level for each story',
        'Document estimation assumptions',
        'Calculate total effort and average story size',
        'Save estimation results to output directory'
      ],
      outputFormat: 'JSON with estimatedStories (array), totalEstimate (number), averageEstimate (number), estimationConfidence (string), largeStories (array), uncertainStories (array), estimationAssumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedStories', 'totalEstimate', 'averageEstimate', 'artifacts'],
      properties: {
        estimatedStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              estimate: {},
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              uncertaintyFactors: { type: 'array', items: { type: 'string' } },
              needsSplitting: { type: 'boolean' },
              needsSpike: { type: 'boolean' }
            }
          }
        },
        totalEstimate: { type: 'number' },
        averageEstimate: { type: 'number' },
        estimationConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        largeStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              reason: { type: 'string' },
              suggestedSplit: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        uncertainStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              uncertaintyReason: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        estimationAssumptions: { type: 'array', items: { type: 'string' } },
        velocityImplications: {
          type: 'object',
          properties: {
            expectedSprintsForCompletion: { type: 'number' },
            storiesPerSprint: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'estimation']
}));

// Task 6: Prioritization
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize user stories',
  agent: {
    name: 'prioritization-strategist',
    prompt: {
      role: 'product strategy consultant and prioritization expert',
      task: 'Prioritize user stories using multiple frameworks to create ranked backlog',
      context: args,
      instructions: [
        'Apply multiple prioritization frameworks:',
        '  - MoSCoW (Must have, Should have, Could have, Won\'t have)',
        '  - Value vs Effort (2x2 matrix)',
        '  - RICE (Reach, Impact, Confidence, Effort)',
        '  - Kano Model (Basic, Performance, Excitement)',
        '  - Business Value Score',
        'For each story evaluate:',
        '  - User value and impact',
        '  - Business value and revenue impact',
        '  - Strategic alignment',
        '  - Risk and dependencies',
        '  - Effort and complexity',
        '  - Technical dependencies',
        '  - Market timing',
        'Identify MVP candidates (must-have, high-value stories)',
        'Identify Quick Wins (high value, low effort)',
        'Identify Strategic Bets (high effort, transformative value)',
        'Identify Technical Debt stories that block other work',
        'Create prioritized story list with clear rationale',
        'Generate priority heat map visualization',
        'Save prioritization analysis to output directory'
      ],
      outputFormat: 'JSON with prioritizedStories (array), frameworkUsed (string), criticalStories (array), highPriorityStories (array), mediumPriorityStories (array), lowPriorityStories (array), mvpCandidates (array), quickWins (array), strategicBets (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedStories', 'frameworkUsed', 'mvpCandidates', 'artifacts'],
      properties: {
        prioritizedStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              priorityScore: { type: 'number' },
              moscowCategory: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              valueScore: { type: 'number' },
              effortScore: { type: 'number' },
              riceScore: { type: 'number' },
              kanoCategory: { type: 'string', enum: ['basic', 'performance', 'excitement', 'indifferent'] },
              rationale: { type: 'string' }
            }
          }
        },
        frameworkUsed: { type: 'string' },
        criticalStories: { type: 'array', items: { type: 'string' } },
        highPriorityStories: { type: 'array', items: { type: 'string' } },
        mediumPriorityStories: { type: 'array', items: { type: 'string' } },
        lowPriorityStories: { type: 'array', items: { type: 'string' } },
        mvpCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              valueScore: { type: 'number' },
              effortScore: { type: 'number' }
            }
          }
        },
        strategicBets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              strategicValue: { type: 'string' }
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
  labels: ['agent', 'story-mapping', 'prioritization']
}));

// Task 7: Release Planning
export const releasePlanningTask = defineTask('release-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan releases and roadmap',
  agent: {
    name: 'release-planner',
    prompt: {
      role: 'release manager and roadmap strategist',
      task: 'Create release plan with story allocation across multiple releases',
      context: args,
      instructions: [
        'Plan specified number of releases (MVP, Release 2, Release 3, etc.)',
        'For each release:',
        '  - Define release goal and theme',
        '  - Allocate stories based on priority and capacity',
        '  - Respect team capacity per release',
        '  - Ensure dependencies are sequenced correctly',
        '  - Include complete user journeys where possible',
        '  - Balance quick wins with strategic initiatives',
        'First release should be MVP (minimum viable product)',
        'Subsequent releases should add incremental value',
        'Visualize releases as horizontal swim lanes on story map',
        'Calculate estimated timeline based on team capacity',
        'Define release cadence (weekly, bi-weekly, monthly)',
        'Identify release risks and dependencies',
        'Create release roadmap with milestones',
        'Define success metrics for each release',
        'Save release plan and roadmap to output directory'
      ],
      outputFormat: 'JSON with releaseMap (object with releases array), estimatedDuration (string), releaseCadence (string), roadmapPath (string), releaseRisks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['releaseMap', 'estimatedDuration', 'releaseCadence', 'artifacts'],
      properties: {
        releaseMap: {
          type: 'object',
          properties: {
            releases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  releaseNumber: { type: 'number' },
                  releaseName: { type: 'string' },
                  releaseGoal: { type: 'string' },
                  theme: { type: 'string' },
                  stories: { type: 'array', items: { type: 'string' } },
                  estimatedEffort: { type: 'number' },
                  capacityUsed: { type: 'number' },
                  startDate: { type: 'string' },
                  targetDate: { type: 'string' },
                  successMetrics: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        releaseCadence: { type: 'string' },
        roadmapPath: { type: 'string' },
        releaseRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              release: { type: 'string' },
              risk: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        capacityUtilization: {
          type: 'object',
          properties: {
            averageUtilization: { type: 'number' },
            overAllocatedReleases: { type: 'array', items: { type: 'string' } },
            underUtilizedReleases: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'story-mapping', 'release-planning']
}));

// Task 8: MVP Definition
export const mvpDefinitionTask = defineTask('mvp-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Minimum Viable Product (MVP)',
  agent: {
    name: 'mvp-strategist',
    prompt: {
      role: 'lean startup coach and MVP strategist',
      task: 'Define lean MVP that delivers core value with minimum features',
      context: args,
      instructions: [
        'Identify absolute minimum stories needed for viable product',
        'MVP should:',
        '  - Solve core problem for primary persona',
        '  - Deliver measurable value',
        '  - Be testable with real users',
        '  - Enable validated learning',
        '  - Be deliverable within capacity constraints',
        'Apply slicing techniques:',
        '  - Walking skeleton (end-to-end minimal functionality)',
        '  - Core user journey (primary happy path)',
        '  - Critical activities only',
        '  - Remove nice-to-haves',
        'Validate MVP includes complete user workflow',
        'Define MVP success criteria and metrics',
        'Identify learning objectives for MVP',
        'Calculate estimated MVP delivery timeline',
        'Define critical path (dependencies that affect timeline)',
        'Identify assumptions to validate with MVP',
        'Create MVP scope document',
        'Save MVP definition to output directory'
      ],
      outputFormat: 'JSON with mvpStories (array), estimatedEffort (number), deliveryTimeline (string), criticalPath (array), successCriteria (array), learningObjectives (array), assumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mvpStories', 'estimatedEffort', 'successCriteria', 'artifacts'],
      properties: {
        mvpStories: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'number' },
        deliveryTimeline: { type: 'string' },
        criticalPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              blockedBy: { type: 'array', items: { type: 'string' } },
              duration: { type: 'number' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        learningObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              risk: { type: 'string', enum: ['high', 'medium', 'low'] },
              validationMethod: { type: 'string' }
            }
          }
        },
        mvpScope: {
          type: 'object',
          properties: {
            includedActivities: { type: 'array', items: { type: 'string' } },
            excludedActivities: { type: 'array', items: { type: 'string' } },
            coreProblem: { type: 'string' },
            primaryPersona: { type: 'string' }
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
  labels: ['agent', 'story-mapping', 'mvp-definition']
}));

// Task 9: Dependency Mapping
export const dependencyMappingTask = defineTask('dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map story dependencies and sequencing',
  agent: {
    name: 'dependency-analyst',
    prompt: {
      role: 'technical project manager and dependency analyst',
      task: 'Identify and map dependencies between stories to optimize delivery sequence',
      context: args,
      instructions: [
        'Identify all story dependencies:',
        '  - Technical dependencies (must build X before Y)',
        '  - Data dependencies (needs data from upstream story)',
        '  - Infrastructure dependencies (requires platform capability)',
        '  - User experience dependencies (UX flow requires previous feature)',
        '  - Integration dependencies (external system integration)',
        'Categorize dependencies:',
        '  - Hard blockers (cannot start without)',
        '  - Soft dependencies (helpful but not blocking)',
        '  - Parallel work opportunities',
        'Create dependency graph showing story relationships',
        'Identify critical path through dependencies',
        'Find potential bottlenecks and blockers',
        'Recommend optimal sequencing to minimize delays',
        'Identify stories that can be parallelized',
        'Flag circular dependencies or conflicts',
        'Validate release plan respects dependencies',
        'Save dependency map and critical path to output directory'
      ],
      outputFormat: 'JSON with dependencyGraph (object), totalDependencies (number), blockerCount (number), criticalPath (array), parallelWorkOpportunities (array), circularDependencies (array), sequencingRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencyGraph', 'totalDependencies', 'criticalPath', 'artifacts'],
      properties: {
        dependencyGraph: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              blockedBy: { type: 'array', items: { type: 'string' } },
              blocks: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string', enum: ['technical', 'data', 'infrastructure', 'ux', 'integration'] },
              dependencyStrength: { type: 'string', enum: ['hard-blocker', 'soft-dependency'] }
            }
          }
        },
        totalDependencies: { type: 'number' },
        blockerCount: { type: 'number' },
        criticalPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              sequencePosition: { type: 'number' },
              estimatedDuration: { type: 'number' }
            }
          }
        },
        parallelWorkOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stories: { type: 'array', items: { type: 'string' } },
              benefit: { type: 'string' }
            }
          }
        },
        circularDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycle: { type: 'array', items: { type: 'string' } },
              resolution: { type: 'string' }
            }
          }
        },
        sequencingRecommendations: { type: 'array', items: { type: 'string' } },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              blocksCount: { type: 'number' },
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
  labels: ['agent', 'story-mapping', 'dependencies']
}));

// Task 10: Visualization
export const visualizationTask = defineTask('visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create story map visualization',
  agent: {
    name: 'visualization-designer',
    prompt: {
      role: 'information designer and visualization specialist',
      task: 'Create comprehensive visual story map with all elements',
      context: args,
      instructions: [
        'Create complete story map visualization with:',
        '  - User activities as horizontal backbone (top row)',
        '  - User tasks organized vertically under activities',
        '  - User stories organized under tasks',
        '  - Release swim lanes showing story allocation',
        '  - MVP line highlighting first release',
        '  - Priority color coding (critical, high, medium, low)',
        '  - Dependency arrows showing relationships',
        '  - Persona indicators on stories',
        'Generate multiple visualization formats:',
        '  - Miro/Mural-style board (markdown description)',
        '  - Jira roadmap format',
        '  - Simple text-based map',
        '  - CSV export for tool import',
        'Create supporting visualizations:',
        '  - Priority heat map',
        '  - Value vs Effort quadrant chart',
        '  - Dependency graph',
        '  - Release roadmap timeline',
        '  - Persona coverage chart',
        'Include legend explaining colors, symbols, and conventions',
        'Save all visualizations to output directory'
      ],
      outputFormat: 'JSON with storyMapVisualization (string), visualizationFormats (array), supportingCharts (array), legend (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['storyMapVisualization', 'visualizationFormats', 'artifacts'],
      properties: {
        storyMapVisualization: { type: 'string' },
        visualizationFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              description: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        supportingCharts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chartType: { type: 'string' },
              description: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        legend: {
          type: 'object',
          properties: {
            colors: { type: 'object' },
            symbols: { type: 'object' },
            conventions: { type: 'array', items: { type: 'string' } }
          }
        },
        mapDimensions: {
          type: 'object',
          properties: {
            activitiesCount: { type: 'number' },
            tasksCount: { type: 'number' },
            storiesCount: { type: 'number' },
            releasesCount: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'visualization']
}));

// Task 11: Backlog Generation
export const backlogGenerationTask = defineTask('backlog-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate prioritized product backlog',
  agent: {
    name: 'backlog-manager',
    prompt: {
      role: 'product backlog manager and agile coach',
      task: 'Generate prioritized, ready-to-use product backlog from story map',
      context: args,
      instructions: [
        'Create ordered product backlog with:',
        '  - All stories prioritized from top to bottom',
        '  - Release assignments',
        '  - Story estimates',
        '  - Acceptance criteria',
        '  - Dependencies noted',
        '  - Ready status (Definition of Ready)',
        'Group stories by:',
        '  - Current sprint (if applicable)',
        '  - MVP release',
        '  - Future releases',
        '  - Backlog (not yet planned)',
        'For each backlog item include:',
        '  - Priority rank',
        '  - Story ID and title',
        '  - User story statement',
        '  - Acceptance criteria',
        '  - Estimate',
        '  - Release assignment',
        '  - Dependencies',
        '  - Definition of Ready status',
        'Generate backlog in multiple formats:',
        '  - Jira import CSV',
        '  - Azure DevOps format',
        '  - GitHub Issues format',
        '  - Simple spreadsheet',
        'Create backlog refinement guide',
        'Save backlog and import files to output directory'
      ],
      outputFormat: 'JSON with backlog (array), readyStories (number), refinementNeeded (array), backlogFormats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['backlog', 'readyStories', 'artifacts'],
      properties: {
        backlog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              storyId: { type: 'string' },
              title: { type: 'string' },
              userStory: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              estimate: {},
              release: { type: 'string' },
              priority: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              readyStatus: { type: 'boolean' },
              persona: { type: 'string' },
              activity: { type: 'string' },
              labels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        readyStories: { type: 'number' },
        refinementNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              missingCriteria: { type: 'array', items: { type: 'string' } },
              recommendedAction: { type: 'string' }
            }
          }
        },
        backlogFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              filePath: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        backlogHealth: {
          type: 'object',
          properties: {
            readyStoriesPercentage: { type: 'number' },
            estimatedStoriesPercentage: { type: 'number' },
            storiesWithAcceptanceCriteria: { type: 'number' }
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
  labels: ['agent', 'story-mapping', 'backlog-generation']
}));

// Task 12: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate story map quality and completeness',
  agent: {
    name: 'story-map-auditor',
    prompt: {
      role: 'agile coach and story mapping expert',
      task: 'Audit story map quality, completeness, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate User Activities (weight: 15%):',
        '  - Cover complete user journey',
        '  - User-centric language (not system-centric)',
        '  - Appropriate granularity (5-15 activities)',
        '  - Logical sequence',
        'Evaluate User Tasks (weight: 15%):',
        '  - Adequate breakdown of activities',
        '  - Include variations and alternatives',
        '  - Appropriate level of detail',
        'Evaluate User Stories (weight: 25%):',
        '  - Follow INVEST criteria',
        '  - Clear acceptance criteria',
        '  - Appropriate size and granularity',
        '  - Complete coverage of tasks',
        'Evaluate Prioritization (weight: 20%):',
        '  - Clear priority rationale',
        '  - Business value alignment',
        '  - MVP properly defined',
        '  - Risk and dependency consideration',
        'Evaluate Release Planning (weight: 15%):',
        '  - Realistic capacity planning',
        '  - Dependencies properly sequenced',
        '  - Complete user journeys per release',
        '  - Incremental value delivery',
        'Evaluate Overall Coherence (weight: 10%):',
        '  - Alignment with product goals',
        '  - Persona coverage',
        '  - Consistency across map',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and improvement areas',
        'Validate against story mapping best practices',
        'Check for common anti-patterns'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), bestPracticesCheck (object), gaps (array), antiPatterns (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            userActivities: { type: 'number' },
            userTasks: { type: 'number' },
            userStories: { type: 'number' },
            prioritization: { type: 'number' },
            releasePlanning: { type: 'number' },
            overallCoherence: { type: 'number' }
          }
        },
        bestPracticesCheck: {
          type: 'object',
          properties: {
            userCentricLanguage: { type: 'boolean' },
            completeUserJourney: { type: 'boolean' },
            investCriteriaMet: { type: 'boolean' },
            mvpWellDefined: { type: 'boolean' },
            dependenciesMapped: { type: 'boolean' },
            appropriateGranularity: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        antiPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        coverageAnalysis: {
          type: 'object',
          properties: {
            personaCoverage: { type: 'number' },
            journeyCompleteness: { type: 'number' },
            edgeCasesCovered: { type: 'boolean' }
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
  labels: ['agent', 'story-mapping', 'quality-validation']
}));
