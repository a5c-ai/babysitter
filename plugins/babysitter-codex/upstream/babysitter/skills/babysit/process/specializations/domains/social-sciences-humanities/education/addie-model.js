/**
 * @process education/addie-model
 * @description Systematic instructional design using Analyze, Design, Develop, Implement, Evaluate phases for comprehensive course development
 * @inputs { courseName: string, targetAudience: object, learningObjectives: array, constraints: object, existingMaterials: array }
 * @outputs { success: boolean, courseDesign: object, developmentPlan: object, evaluationFramework: object, artifacts: array }
 * @recommendedSkills SK-EDU-001 (learning-needs-analysis), SK-EDU-002 (learning-objectives-writing), SK-EDU-005 (e-learning-storyboarding), SK-EDU-014 (learning-transfer-design)
 * @recommendedAgents AG-EDU-001 (instructional-design-lead), AG-EDU-004 (e-learning-developer)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    targetAudience = {},
    learningObjectives = [],
    constraints = {},
    existingMaterials = [],
    outputDir = 'addie-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ADDIE Model Implementation for ${courseName}`);

  // ============================================================================
  // PHASE 1: ANALYZE
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting needs analysis');
  const needsAnalysis = await ctx.task(needsAnalysisTask, {
    courseName,
    targetAudience,
    learningObjectives,
    existingMaterials,
    outputDir
  });

  artifacts.push(...needsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating instructional design blueprint');
  const designBlueprint = await ctx.task(designBlueprintTask, {
    courseName,
    needsAnalysis,
    learningObjectives,
    constraints,
    outputDir
  });

  artifacts.push(...designBlueprint.artifacts);

  // ============================================================================
  // PHASE 3: DEVELOP
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing course materials and content');
  const developmentPlan = await ctx.task(developmentPlanTask, {
    courseName,
    designBlueprint,
    existingMaterials,
    constraints,
    outputDir
  });

  artifacts.push(...developmentPlan.artifacts);

  // ============================================================================
  // PHASE 4: IMPLEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating implementation strategy');
  const implementationStrategy = await ctx.task(implementationStrategyTask, {
    courseName,
    designBlueprint,
    developmentPlan,
    targetAudience,
    constraints,
    outputDir
  });

  artifacts.push(...implementationStrategy.artifacts);

  // ============================================================================
  // PHASE 5: EVALUATE
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing evaluation framework');
  const evaluationFramework = await ctx.task(evaluationFrameworkTask, {
    courseName,
    learningObjectives,
    designBlueprint,
    implementationStrategy,
    outputDir
  });

  artifacts.push(...evaluationFramework.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring ADDIE implementation quality');
  const qualityScore = await ctx.task(addieQualityScoringTask, {
    courseName,
    needsAnalysis,
    designBlueprint,
    developmentPlan,
    implementationStrategy,
    evaluationFramework,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review ADDIE implementation
  await ctx.breakpoint({
    question: `ADDIE implementation complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'ADDIE Model Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        targetAudienceSize: targetAudience.estimatedSize || 'N/A',
        totalObjectives: learningObjectives.length,
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
    needsAnalysis: {
      audienceProfile: needsAnalysis.audienceProfile,
      learningGaps: needsAnalysis.learningGaps,
      prerequisites: needsAnalysis.prerequisites
    },
    courseDesign: {
      modules: designBlueprint.modules,
      sequencing: designBlueprint.sequencing,
      assessmentStrategy: designBlueprint.assessmentStrategy
    },
    developmentPlan: {
      contentTypes: developmentPlan.contentTypes,
      timeline: developmentPlan.timeline,
      resources: developmentPlan.resources
    },
    implementationStrategy: {
      deliveryMethod: implementationStrategy.deliveryMethod,
      facilitation: implementationStrategy.facilitation,
      supportPlan: implementationStrategy.supportPlan
    },
    evaluationFramework: {
      formativeAssessments: evaluationFramework.formativeAssessments,
      summativeAssessments: evaluationFramework.summativeAssessments,
      continuousImprovement: evaluationFramework.continuousImprovement
    },
    artifacts,
    duration,
    metadata: {
      processId: 'education/addie-model',
      timestamp: startTime,
      courseName,
      outputDir
    }
  };
}

// Task 1: Needs Analysis (Analyze Phase)
export const needsAnalysisTask = defineTask('needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct comprehensive needs analysis',
  agent: {
    name: 'instructional-analyst',
    prompt: {
      role: 'instructional design analyst',
      task: 'Conduct comprehensive needs analysis for course development',
      context: args,
      instructions: [
        'Analyze target audience demographics, prior knowledge, and learning preferences',
        'Identify performance gaps between current and desired competencies',
        'Determine prerequisite knowledge and skills required',
        'Analyze organizational context and constraints',
        'Identify available resources and technology infrastructure',
        'Document learner motivation factors and barriers',
        'Assess existing materials for reuse potential',
        'Generate audience profile and learning needs report'
      ],
      outputFormat: 'JSON with audienceProfile, learningGaps, prerequisites, resourceAnalysis, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audienceProfile', 'learningGaps', 'prerequisites', 'artifacts'],
      properties: {
        audienceProfile: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            priorKnowledge: { type: 'array', items: { type: 'string' } },
            learningStyles: { type: 'array', items: { type: 'string' } },
            motivationFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        learningGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              currentLevel: { type: 'string' },
              targetLevel: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        prerequisites: { type: 'array', items: { type: 'string' } },
        resourceAnalysis: { type: 'object' },
        constraints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'addie', 'analyze', 'needs-analysis']
}));

// Task 2: Design Blueprint
export const designBlueprintTask = defineTask('design-blueprint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create instructional design blueprint',
  agent: {
    name: 'instructional-designer',
    prompt: {
      role: 'senior instructional designer',
      task: 'Create comprehensive instructional design blueprint based on needs analysis',
      context: args,
      instructions: [
        'Write measurable learning objectives using Bloom\'s Taxonomy',
        'Design module structure and content sequencing',
        'Select appropriate instructional strategies for each objective',
        'Design assessment strategy aligned with objectives',
        'Create content outline for each module',
        'Plan learner engagement activities',
        'Design feedback mechanisms',
        'Create storyboards for multimedia content',
        'Generate design document and course map'
      ],
      outputFormat: 'JSON with modules, sequencing, assessmentStrategy, instructionalStrategies, engagementActivities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'sequencing', 'assessmentStrategy', 'artifacts'],
      properties: {
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleId: { type: 'string' },
              title: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              contentTopics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sequencing: { type: 'object' },
        assessmentStrategy: {
          type: 'object',
          properties: {
            formative: { type: 'array' },
            summative: { type: 'array' },
            rubrics: { type: 'array' }
          }
        },
        instructionalStrategies: { type: 'array', items: { type: 'string' } },
        engagementActivities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'addie', 'design', 'blueprint']
}));

// Task 3: Development Plan
export const developmentPlanTask = defineTask('development-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create development plan and content specifications',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'instructional content developer',
      task: 'Create comprehensive development plan for course materials',
      context: args,
      instructions: [
        'Define content development specifications for each module',
        'Identify content types: text, video, audio, interactive, assessments',
        'Create media specifications and production requirements',
        'Plan accessibility compliance (WCAG, Section 508)',
        'Develop content creation timeline and milestones',
        'Identify resource requirements (SMEs, media producers, reviewers)',
        'Plan quality review checkpoints',
        'Create style guide for content consistency',
        'Generate development plan document'
      ],
      outputFormat: 'JSON with contentTypes, mediaSpecs, timeline, resources, qualityCheckpoints, styleGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentTypes', 'timeline', 'resources', 'artifacts'],
      properties: {
        contentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              quantity: { type: 'number' },
              specifications: { type: 'object' }
            }
          }
        },
        mediaSpecs: { type: 'object' },
        timeline: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            milestones: { type: 'array' },
            totalDuration: { type: 'string' }
          }
        },
        resources: {
          type: 'object',
          properties: {
            personnel: { type: 'array' },
            tools: { type: 'array' },
            budget: { type: 'string' }
          }
        },
        qualityCheckpoints: { type: 'array' },
        styleGuide: { type: 'object' },
        accessibilityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'addie', 'develop', 'content-plan']
}));

// Task 4: Implementation Strategy
export const implementationStrategyTask = defineTask('implementation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation and delivery strategy',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'learning implementation specialist',
      task: 'Create comprehensive implementation and delivery strategy',
      context: args,
      instructions: [
        'Define delivery method (instructor-led, self-paced, blended)',
        'Plan LMS configuration and course setup',
        'Create facilitator guides and training materials',
        'Design learner onboarding experience',
        'Plan communication and marketing strategy',
        'Develop learner support system',
        'Create troubleshooting guides',
        'Plan pilot testing approach',
        'Generate implementation checklist and timeline'
      ],
      outputFormat: 'JSON with deliveryMethod, lmsSetup, facilitation, onboarding, supportPlan, pilotPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deliveryMethod', 'facilitation', 'supportPlan', 'artifacts'],
      properties: {
        deliveryMethod: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            platform: { type: 'string' },
            schedule: { type: 'object' }
          }
        },
        lmsSetup: { type: 'object' },
        facilitation: {
          type: 'object',
          properties: {
            facilitatorGuide: { type: 'string' },
            trainingRequired: { type: 'boolean' },
            supportMaterials: { type: 'array' }
          }
        },
        onboarding: { type: 'object' },
        supportPlan: {
          type: 'object',
          properties: {
            helpDesk: { type: 'object' },
            faqs: { type: 'array' },
            escalationPath: { type: 'array' }
          }
        },
        pilotPlan: { type: 'object' },
        implementationChecklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'addie', 'implement', 'delivery']
}));

// Task 5: Evaluation Framework
export const evaluationFrameworkTask = defineTask('evaluation-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design comprehensive evaluation framework',
  agent: {
    name: 'evaluation-specialist',
    prompt: {
      role: 'learning evaluation specialist',
      task: 'Design comprehensive evaluation framework for course effectiveness',
      context: args,
      instructions: [
        'Design formative assessment instruments',
        'Create summative evaluation plan',
        'Develop learner satisfaction surveys',
        'Plan knowledge retention assessments',
        'Design performance transfer evaluation',
        'Create data collection methods and tools',
        'Plan Kirkpatrick four-level evaluation',
        'Define success metrics and KPIs',
        'Create continuous improvement process',
        'Generate evaluation plan document'
      ],
      outputFormat: 'JSON with formativeAssessments, summativeAssessments, surveyInstruments, kirkpatrickPlan, metrics, continuousImprovement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formativeAssessments', 'summativeAssessments', 'continuousImprovement', 'artifacts'],
      properties: {
        formativeAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              frequency: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        summativeAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              timing: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        surveyInstruments: { type: 'array' },
        kirkpatrickPlan: {
          type: 'object',
          properties: {
            level1Reaction: { type: 'object' },
            level2Learning: { type: 'object' },
            level3Behavior: { type: 'object' },
            level4Results: { type: 'object' }
          }
        },
        metrics: { type: 'array' },
        continuousImprovement: {
          type: 'object',
          properties: {
            feedbackLoops: { type: 'array' },
            revisionCycle: { type: 'string' },
            stakeholderReview: { type: 'object' }
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
  labels: ['agent', 'addie', 'evaluate', 'assessment']
}));

// Task 6: ADDIE Quality Scoring
export const addieQualityScoringTask = defineTask('addie-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score ADDIE implementation quality',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'instructional design quality auditor',
      task: 'Assess overall ADDIE implementation quality and completeness',
      context: args,
      instructions: [
        'Evaluate needs analysis thoroughness (weight: 20%)',
        'Assess design blueprint alignment with objectives (weight: 25%)',
        'Review development plan feasibility (weight: 20%)',
        'Evaluate implementation strategy completeness (weight: 15%)',
        'Assess evaluation framework comprehensiveness (weight: 20%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific recommendations for improvement',
        'Validate alignment with instructional design best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            analyze: { type: 'number' },
            design: { type: 'number' },
            develop: { type: 'number' },
            implement: { type: 'number' },
            evaluate: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
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
  labels: ['agent', 'addie', 'quality-scoring', 'validation']
}));
