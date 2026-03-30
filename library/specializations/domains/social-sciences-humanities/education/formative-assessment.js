/**
 * @process education/formative-assessment
 * @description Creating ongoing assessments that provide immediate feedback to inform instruction and support learning during the instructional process
 * @inputs { courseName: string, learningObjectives: array, targetAudience: object, instructionalContext: object, constraints: object }
 * @outputs { success: boolean, assessmentPlan: object, instruments: array, feedbackStrategies: object, artifacts: array }
 * @recommendedSkills SK-EDU-003 (assessment-design-validation), SK-EDU-002 (learning-objectives-writing), SK-EDU-009 (adaptive-learning-design)
 * @recommendedAgents AG-EDU-003 (assessment-specialist), AG-EDU-007 (educational-data-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    learningObjectives = [],
    targetAudience = {},
    instructionalContext = {},
    constraints = {},
    outputDir = 'formative-assessment-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Formative Assessment Design for ${courseName}`);

  // ============================================================================
  // ASSESSMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Developing formative assessment strategy');
  const assessmentStrategy = await ctx.task(formativeStrategyTask, {
    courseName,
    learningObjectives,
    targetAudience,
    instructionalContext,
    outputDir
  });

  artifacts.push(...assessmentStrategy.artifacts);

  // ============================================================================
  // ASSESSMENT TECHNIQUES SELECTION
  // ============================================================================

  ctx.log('info', 'Selecting assessment techniques');
  const techniqueSelection = await ctx.task(techniqueSelectionTask, {
    courseName,
    learningObjectives,
    strategy: assessmentStrategy.strategy,
    constraints,
    outputDir
  });

  artifacts.push(...techniqueSelection.artifacts);

  // ============================================================================
  // INSTRUMENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing assessment instruments');
  const instrumentDevelopment = await ctx.task(instrumentDevelopmentTask, {
    courseName,
    learningObjectives,
    techniques: techniqueSelection.techniques,
    targetAudience,
    outputDir
  });

  artifacts.push(...instrumentDevelopment.artifacts);

  // ============================================================================
  // FEEDBACK DESIGN
  // ============================================================================

  ctx.log('info', 'Designing feedback strategies');
  const feedbackDesign = await ctx.task(feedbackDesignTask, {
    courseName,
    instruments: instrumentDevelopment.instruments,
    learningObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...feedbackDesign.artifacts);

  // ============================================================================
  // DATA COLLECTION PLAN
  // ============================================================================

  ctx.log('info', 'Creating data collection plan');
  const dataCollectionPlan = await ctx.task(dataCollectionPlanTask, {
    courseName,
    instruments: instrumentDevelopment.instruments,
    instructionalContext,
    outputDir
  });

  artifacts.push(...dataCollectionPlan.artifacts);

  // ============================================================================
  // INSTRUCTIONAL RESPONSE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Developing instructional response framework');
  const responseFramework = await ctx.task(instructionalResponseTask, {
    courseName,
    learningObjectives,
    assessmentStrategy: assessmentStrategy.strategy,
    feedbackDesign: feedbackDesign.strategies,
    outputDir
  });

  artifacts.push(...responseFramework.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring formative assessment design quality');
  const qualityScore = await ctx.task(formativeQualityScoringTask, {
    courseName,
    assessmentStrategy,
    techniqueSelection,
    instrumentDevelopment,
    feedbackDesign,
    dataCollectionPlan,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review formative assessment design
  await ctx.breakpoint({
    question: `Formative assessment design complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Formative Assessment Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        totalInstruments: instrumentDevelopment.instruments?.length || 0,
        totalTechniques: techniqueSelection.techniques?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    qualityScore: overallScore,
    qualityMet,
    assessmentPlan: {
      strategy: assessmentStrategy.strategy,
      timing: assessmentStrategy.timing,
      objectives: assessmentStrategy.objectiveAlignment
    },
    instruments: instrumentDevelopment.instruments,
    feedbackStrategies: feedbackDesign.strategies,
    dataCollection: dataCollectionPlan.plan,
    responseFramework: responseFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'education/formative-assessment',
      timestamp: startTime,
      courseName,
      outputDir
    }
  };
}

// Task 1: Formative Assessment Strategy
export const formativeStrategyTask = defineTask('formative-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop formative assessment strategy',
  agent: {
    name: 'assessment-strategist',
    prompt: {
      role: 'formative assessment specialist',
      task: 'Develop comprehensive formative assessment strategy',
      context: args,
      instructions: [
        'Define formative assessment purpose and goals',
        'Map assessments to learning objectives',
        'Determine assessment timing (diagnostic, during, after instruction)',
        'Plan assessment frequency',
        'Consider learner characteristics in strategy',
        'Balance formal and informal assessment',
        'Plan for individual and group assessment',
        'Document strategy rationale',
        'Generate assessment strategy document'
      ],
      outputFormat: 'JSON with strategy, timing, objectiveAlignment, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'timing', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            approach: { type: 'string' },
            keyPrinciples: { type: 'array', items: { type: 'string' } }
          }
        },
        timing: {
          type: 'object',
          properties: {
            diagnostic: { type: 'array' },
            duringInstruction: { type: 'array' },
            afterInstruction: { type: 'array' }
          }
        },
        objectiveAlignment: { type: 'array' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'strategy', 'planning']
}));

// Task 2: Technique Selection
export const techniqueSelectionTask = defineTask('technique-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select assessment techniques',
  agent: {
    name: 'technique-selector',
    prompt: {
      role: 'classroom assessment specialist',
      task: 'Select appropriate formative assessment techniques',
      context: args,
      instructions: [
        'Review Classroom Assessment Techniques (CATs)',
        'Select techniques aligned with objectives',
        'Consider quick checks (exit tickets, muddiest point)',
        'Include questioning strategies (think-pair-share)',
        'Plan observation techniques',
        'Include peer assessment strategies',
        'Select self-assessment techniques',
        'Match techniques to instructional context',
        'Generate technique selection document'
      ],
      outputFormat: 'JSON with techniques, categories, alignment, implementationNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'categories', 'artifacts'],
      properties: {
        techniques: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              category: { type: 'string' },
              purpose: { type: 'string' },
              timing: { type: 'string' },
              duration: { type: 'string' },
              alignedObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            quickChecks: { type: 'array' },
            questioning: { type: 'array' },
            observation: { type: 'array' },
            peerAssessment: { type: 'array' },
            selfAssessment: { type: 'array' }
          }
        },
        alignment: { type: 'array' },
        implementationNotes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'techniques', 'selection']
}));

// Task 3: Instrument Development
export const instrumentDevelopmentTask = defineTask('instrument-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop assessment instruments',
  agent: {
    name: 'instrument-developer',
    prompt: {
      role: 'assessment instrument developer',
      task: 'Develop formative assessment instruments',
      context: args,
      instructions: [
        'Create exit ticket templates',
        'Develop discussion prompts',
        'Create observation checklists',
        'Design quick quiz items',
        'Develop peer assessment rubrics',
        'Create self-assessment tools',
        'Design graphic organizer assessments',
        'Create digital assessment tools specifications',
        'Generate instrument documentation'
      ],
      outputFormat: 'JSON with instruments, templates, rubrics, checklists, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['instruments', 'artifacts'],
      properties: {
        instruments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instrumentId: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              technique: { type: 'string' },
              content: { type: 'object' },
              scoringGuide: { type: 'object' }
            }
          }
        },
        templates: { type: 'array' },
        rubrics: { type: 'array' },
        checklists: { type: 'array' },
        digitalTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'instruments', 'development']
}));

// Task 4: Feedback Design
export const feedbackDesignTask = defineTask('feedback-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feedback strategies',
  agent: {
    name: 'feedback-designer',
    prompt: {
      role: 'feedback and learning specialist',
      task: 'Design effective feedback strategies for formative assessment',
      context: args,
      instructions: [
        'Design immediate feedback mechanisms',
        'Create descriptive feedback templates',
        'Plan corrective feedback strategies',
        'Develop feed-forward guidance',
        'Design peer feedback protocols',
        'Create self-assessment feedback tools',
        'Plan differentiated feedback by learner need',
        'Design feedback tracking system',
        'Generate feedback design document'
      ],
      outputFormat: 'JSON with strategies, templates, protocols, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'object',
          properties: {
            immediate: { type: 'array' },
            descriptive: { type: 'array' },
            corrective: { type: 'array' },
            feedForward: { type: 'array' }
          }
        },
        templates: { type: 'array' },
        protocols: {
          type: 'object',
          properties: {
            peer: { type: 'array' },
            self: { type: 'array' }
          }
        },
        tracking: { type: 'object' },
        differentiation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'feedback', 'design']
}));

// Task 5: Data Collection Plan
export const dataCollectionPlanTask = defineTask('data-collection-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create data collection plan',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'educational data specialist',
      task: 'Create plan for collecting and organizing assessment data',
      context: args,
      instructions: [
        'Define data to be collected from each instrument',
        'Plan data collection methods',
        'Design data organization system',
        'Create recording templates',
        'Plan digital data collection tools',
        'Design student progress tracking',
        'Plan class-level data aggregation',
        'Create data privacy protocols',
        'Generate data collection plan document'
      ],
      outputFormat: 'JSON with plan, methods, organization, tracking, privacy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'methods', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            dataTypes: { type: 'array' },
            frequency: { type: 'string' },
            responsibilities: { type: 'array' }
          }
        },
        methods: { type: 'array' },
        organization: {
          type: 'object',
          properties: {
            studentLevel: { type: 'object' },
            classLevel: { type: 'object' }
          }
        },
        tracking: { type: 'object' },
        privacy: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'data-collection', 'planning']
}));

// Task 6: Instructional Response Framework
export const instructionalResponseTask = defineTask('instructional-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop instructional response framework',
  agent: {
    name: 'response-developer',
    prompt: {
      role: 'responsive instruction specialist',
      task: 'Develop framework for responding to formative assessment data',
      context: args,
      instructions: [
        'Define decision rules based on assessment data',
        'Plan immediate instructional adjustments',
        'Design intervention strategies for struggling learners',
        'Create enrichment pathways for advanced learners',
        'Plan whole-class vs individual responses',
        'Design reteaching protocols',
        'Create flexible grouping strategies',
        'Document response decision tree',
        'Generate instructional response framework document'
      ],
      outputFormat: 'JSON with framework, decisionRules, interventions, enrichment, grouping, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'decisionRules', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            principles: { type: 'array', items: { type: 'string' } },
            responseTypes: { type: 'array' },
            timing: { type: 'object' }
          }
        },
        decisionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              response: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        interventions: { type: 'array' },
        enrichment: { type: 'array' },
        grouping: { type: 'object' },
        reteaching: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'response', 'instruction']
}));

// Task 7: Quality Scoring
export const formativeQualityScoringTask = defineTask('formative-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score formative assessment design quality',
  agent: {
    name: 'formative-quality-auditor',
    prompt: {
      role: 'formative assessment quality auditor',
      task: 'Assess formative assessment design quality',
      context: args,
      instructions: [
        'Evaluate strategy alignment with objectives (weight: 20%)',
        'Assess technique variety and appropriateness (weight: 20%)',
        'Review instrument quality (weight: 20%)',
        'Evaluate feedback design effectiveness (weight: 20%)',
        'Assess data collection feasibility (weight: 10%)',
        'Evaluate instructional response framework (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            strategyAlignment: { type: 'number' },
            techniqueVariety: { type: 'number' },
            instrumentQuality: { type: 'number' },
            feedbackDesign: { type: 'number' },
            dataCollection: { type: 'number' },
            responseFramework: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formative-assessment', 'quality-scoring', 'validation']
}));
