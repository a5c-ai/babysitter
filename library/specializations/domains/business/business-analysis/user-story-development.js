/**
 * @process business-analysis/user-story-development
 * @description Transform business requirements into well-formed user stories with acceptance criteria using INVEST principles. Supports agile product backlog management and sprint planning.
 * @inputs { projectName: string, requirements: array, personas: array, productBacklog: object, sprintContext: object }
 * @outputs { success: boolean, userStories: array, storyMap: object, acceptanceCriteria: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    requirements = [],
    personas = [],
    productBacklog = {},
    sprintContext = {},
    outputDir = 'user-story-output',
    storyFormat = 'standard'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting User Story Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: PERSONA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing user personas');
  const personaAnalysis = await ctx.task(personaAnalysisTask, {
    projectName,
    personas,
    requirements,
    outputDir
  });

  artifacts.push(...personaAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: REQUIREMENTS TO STORIES MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping requirements to user stories');
  const requirementsMapping = await ctx.task(requirementsMappingTask, {
    projectName,
    requirements,
    personas: personaAnalysis.refinedPersonas,
    outputDir
  });

  artifacts.push(...requirementsMapping.artifacts);

  // ============================================================================
  // PHASE 3: USER STORY CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating user stories with INVEST principles');
  const storyCreation = await ctx.task(storyCreationTask, {
    projectName,
    mappedRequirements: requirementsMapping.mappedRequirements,
    personas: personaAnalysis.refinedPersonas,
    storyFormat,
    outputDir
  });

  artifacts.push(...storyCreation.artifacts);

  // ============================================================================
  // PHASE 4: ACCEPTANCE CRITERIA DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing acceptance criteria');
  const acceptanceCriteria = await ctx.task(acceptanceCriteriaTask, {
    projectName,
    userStories: storyCreation.userStories,
    requirements,
    outputDir
  });

  artifacts.push(...acceptanceCriteria.artifacts);

  // ============================================================================
  // PHASE 5: STORY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating user story map');
  const storyMapping = await ctx.task(storyMappingTask, {
    projectName,
    userStories: storyCreation.userStories,
    personas: personaAnalysis.refinedPersonas,
    outputDir
  });

  artifacts.push(...storyMapping.artifacts);

  // ============================================================================
  // PHASE 6: STORY ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating story points');
  const storyEstimation = await ctx.task(storyEstimationTask, {
    projectName,
    userStories: storyCreation.userStories,
    acceptanceCriteria: acceptanceCriteria.criteria,
    sprintContext,
    outputDir
  });

  artifacts.push(...storyEstimation.artifacts);

  // ============================================================================
  // PHASE 7: INVEST VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating stories against INVEST criteria');
  const investValidation = await ctx.task(investValidationTask, {
    projectName,
    userStories: storyCreation.userStories,
    acceptanceCriteria: acceptanceCriteria.criteria,
    storyEstimation,
    outputDir
  });

  artifacts.push(...investValidation.artifacts);

  const qualityMet = investValidation.overallScore >= 80;

  // Breakpoint: Review user stories
  await ctx.breakpoint({
    question: `User story development complete for ${projectName}. INVEST score: ${investValidation.overallScore}/100. ${qualityMet ? 'Stories meet INVEST criteria!' : 'Some stories need refinement.'} Review and approve?`,
    title: 'User Story Review',
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
        investScore: investValidation.overallScore,
        qualityMet,
        totalStories: storyCreation.userStories?.length || 0,
        totalStoryPoints: storyEstimation.totalPoints,
        storiesNeedingRefinement: investValidation.storiesNeedingRefinement?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 8: BACKLOG INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating stories into product backlog');
  const backlogIntegration = await ctx.task(backlogIntegrationTask, {
    projectName,
    userStories: storyCreation.userStories,
    acceptanceCriteria: acceptanceCriteria.criteria,
    storyEstimation,
    storyMap: storyMapping.storyMap,
    productBacklog,
    outputDir
  });

  artifacts.push(...backlogIntegration.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    investScore: investValidation.overallScore,
    qualityMet,
    userStories: {
      total: storyCreation.userStories?.length || 0,
      stories: storyCreation.userStories,
      byPersona: storyCreation.storiesByPersona
    },
    acceptanceCriteria: {
      total: acceptanceCriteria.totalCriteria,
      criteria: acceptanceCriteria.criteria
    },
    storyMap: storyMapping.storyMap,
    estimation: {
      totalPoints: storyEstimation.totalPoints,
      averagePoints: storyEstimation.averagePoints,
      distribution: storyEstimation.distribution
    },
    backlogIntegration: {
      status: backlogIntegration.status,
      prioritizedBacklog: backlogIntegration.prioritizedBacklog
    },
    investValidation: {
      overallScore: investValidation.overallScore,
      componentScores: investValidation.componentScores,
      storiesNeedingRefinement: investValidation.storiesNeedingRefinement
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/user-story-development',
      timestamp: startTime,
      storyFormat,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const personaAnalysisTask = defineTask('persona-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user personas',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior product owner with user research expertise',
      task: 'Analyze and refine user personas for user story development',
      context: args,
      instructions: [
        'Review existing personas for completeness',
        'Identify missing persona attributes needed for stories',
        'Define persona goals and motivations',
        'Identify persona pain points and needs',
        'Map personas to requirements coverage',
        'Create persona hierarchy (primary, secondary)',
        'Define persona-specific acceptance criteria needs',
        'Identify persona interactions and relationships',
        'Create persona cards with key attributes',
        'Document persona assumptions for validation'
      ],
      outputFormat: 'JSON with refinedPersonas, personaHierarchy, goals, painPoints, requirementsCoverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedPersonas', 'artifacts'],
      properties: {
        refinedPersonas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              type: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              goals: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              needs: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'object' }
            }
          }
        },
        personaHierarchy: { type: 'object' },
        requirementsCoverage: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'persona-analysis', 'agile']
}));

export const requirementsMappingTask = defineTask('requirements-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map requirements to stories',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with agile transformation expertise',
      task: 'Map business requirements to user story candidates',
      context: args,
      instructions: [
        'Analyze each requirement for story decomposition',
        'Identify requirements that map to single stories',
        'Identify requirements needing multiple stories (epics)',
        'Map requirements to relevant personas',
        'Identify cross-cutting requirements (NFRs)',
        'Create requirement-to-story traceability',
        'Flag requirements needing clarification',
        'Identify gaps in requirements coverage',
        'Recommend story splitting strategies',
        'Create mapping documentation'
      ],
      outputFormat: 'JSON with mappedRequirements, epics, crossCuttingRequirements, gaps, splittingRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mappedRequirements', 'artifacts'],
      properties: {
        mappedRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              storyCount: { type: 'number' },
              persona: { type: 'string' },
              epic: { type: 'string' },
              splittingStrategy: { type: 'string' }
            }
          }
        },
        epics: { type: 'array', items: { type: 'object' } },
        crossCuttingRequirements: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        splittingRecommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'requirements-mapping', 'agile']
}));

export const storyCreationTask = defineTask('story-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create user stories',
  agent: {
    name: 'product-owner',
    prompt: {
      role: 'certified product owner with user story writing expertise',
      task: 'Create well-formed user stories following standard format and INVEST principles',
      context: args,
      instructions: [
        'Write stories in format: As a [persona], I want [goal], so that [benefit]',
        'Ensure each story is Independent (minimize dependencies)',
        'Make stories Negotiable (not contracts)',
        'Ensure stories are Valuable (deliver user value)',
        'Make stories Estimable (clear enough to estimate)',
        'Keep stories Small (completable in sprint)',
        'Make stories Testable (clear acceptance criteria possible)',
        'Create unique story IDs following conventions',
        'Tag stories with epic and theme',
        'Document story assumptions'
      ],
      outputFormat: 'JSON with userStories, storiesByPersona, storiesByEpic, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['userStories', 'artifacts'],
      properties: {
        userStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              asA: { type: 'string' },
              iWant: { type: 'string' },
              soThat: { type: 'string' },
              epic: { type: 'string' },
              theme: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        storiesByPersona: { type: 'object' },
        storiesByEpic: { type: 'object' },
        totalStories: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'story-creation', 'invest']
}));

export const acceptanceCriteriaTask = defineTask('acceptance-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop acceptance criteria',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior QA analyst with BDD expertise',
      task: 'Develop comprehensive acceptance criteria for each user story',
      context: args,
      instructions: [
        'Write acceptance criteria in Given-When-Then format',
        'Ensure criteria are testable and measurable',
        'Cover happy path scenarios',
        'Include edge cases and error scenarios',
        'Define boundary conditions',
        'Include performance criteria where applicable',
        'Define data validation criteria',
        'Include accessibility criteria where relevant',
        'Ensure criteria completeness for story closure',
        'Create criteria checklist for each story'
      ],
      outputFormat: 'JSON with criteria, totalCriteria, criteriaByStory, scenarios, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'totalCriteria', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              criteriaId: { type: 'string' },
              given: { type: 'string' },
              when: { type: 'string' },
              then: { type: 'string' },
              type: { type: 'string', enum: ['happy-path', 'edge-case', 'error', 'performance'] }
            }
          }
        },
        totalCriteria: { type: 'number' },
        criteriaByStory: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'acceptance-criteria', 'bdd']
}));

export const storyMappingTask = defineTask('story-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create story map',
  agent: {
    name: 'product-owner',
    prompt: {
      role: 'agile coach with story mapping expertise',
      task: 'Create user story map showing user activities and story organization',
      context: args,
      instructions: [
        'Identify user activities (backbone)',
        'Group stories under activities',
        'Arrange stories by priority (walking skeleton)',
        'Identify MVP release slice',
        'Define release boundaries',
        'Show dependencies between stories',
        'Identify gaps in user journey',
        'Create visual story map',
        'Document release strategy',
        'Identify technical enablers needed'
      ],
      outputFormat: 'JSON with storyMap, backbone, releases, mvpSlice, dependencies, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['storyMap', 'artifacts'],
      properties: {
        storyMap: {
          type: 'object',
          properties: {
            backbone: { type: 'array', items: { type: 'string' } },
            activities: { type: 'array', items: { type: 'object' } },
            releases: { type: 'array', items: { type: 'object' } }
          }
        },
        mvpSlice: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        technicalEnablers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'story-mapping', 'agile']
}));

export const storyEstimationTask = defineTask('story-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate story points',
  agent: {
    name: 'scrum-master',
    prompt: {
      role: 'certified scrum master with estimation expertise',
      task: 'Estimate story points using relative sizing and planning poker concepts',
      context: args,
      instructions: [
        'Apply Fibonacci sequence for story points (1, 2, 3, 5, 8, 13, 21)',
        'Consider complexity, effort, and uncertainty',
        'Identify reference stories for calibration',
        'Flag stories too large for single sprint (>13 points)',
        'Recommend splitting for large stories',
        'Calculate total backlog points',
        'Estimate velocity based on sprint capacity',
        'Identify estimation assumptions',
        'Create estimation summary',
        'Document estimation rationale'
      ],
      outputFormat: 'JSON with estimatedStories, totalPoints, averagePoints, distribution, largeStoies, velocityEstimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedStories', 'totalPoints', 'artifacts'],
      properties: {
        estimatedStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              points: { type: 'number' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
              rationale: { type: 'string' }
            }
          }
        },
        totalPoints: { type: 'number' },
        averagePoints: { type: 'number' },
        distribution: { type: 'object' },
        largeStories: { type: 'array', items: { type: 'string' } },
        velocityEstimate: { type: 'number' },
        sprintsNeeded: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'estimation', 'planning-poker']
}));

export const investValidationTask = defineTask('invest-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate INVEST criteria',
  agent: {
    name: 'agile-coach',
    prompt: {
      role: 'agile coach with story quality expertise',
      task: 'Validate user stories against INVEST criteria',
      context: args,
      instructions: [
        'Evaluate Independence: Are stories self-contained?',
        'Evaluate Negotiability: Is there room for discussion?',
        'Evaluate Value: Does story deliver user/business value?',
        'Evaluate Estimability: Can the team estimate it?',
        'Evaluate Size: Is it small enough for a sprint?',
        'Evaluate Testability: Are acceptance criteria clear?',
        'Score each criterion (0-100)',
        'Calculate overall INVEST score',
        'Identify stories needing refinement',
        'Provide specific improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, storyScores, storiesNeedingRefinement, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
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
        storyScores: { type: 'array', items: { type: 'object' } },
        storiesNeedingRefinement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'invest-validation', 'quality']
}));

export const backlogIntegrationTask = defineTask('backlog-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate into backlog',
  agent: {
    name: 'product-owner',
    prompt: {
      role: 'product owner with backlog management expertise',
      task: 'Integrate validated user stories into product backlog',
      context: args,
      instructions: [
        'Prioritize stories using value vs effort analysis',
        'Apply WSJF (Weighted Shortest Job First) where applicable',
        'Organize backlog by epic and theme',
        'Define sprint candidates based on priority',
        'Create dependency-aware ordering',
        'Identify ready-for-sprint stories',
        'Document backlog refinement needs',
        'Create backlog visualization',
        'Define backlog grooming schedule',
        'Set up story tracking structure'
      ],
      outputFormat: 'JSON with status, prioritizedBacklog, sprintCandidates, refinementNeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'prioritizedBacklog', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['integrated', 'partial', 'pending'] },
        prioritizedBacklog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              priority: { type: 'number' },
              epic: { type: 'string' },
              readyForSprint: { type: 'boolean' },
              wsjfScore: { type: 'number' }
            }
          }
        },
        sprintCandidates: { type: 'array', items: { type: 'string' } },
        refinementNeeds: { type: 'array', items: { type: 'string' } },
        backlogMetrics: {
          type: 'object',
          properties: {
            totalStories: { type: 'number' },
            totalPoints: { type: 'number' },
            readyStories: { type: 'number' }
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
  labels: ['agent', 'business-analysis', 'backlog-management', 'agile']
}));
