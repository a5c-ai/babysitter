/**
 * @process ba-training-enablement-design
 * @description Comprehensive training and enablement design process creating end-user training
 * programs, materials, and delivery plans aligned with adult learning principles.
 * @inputs {
 *   trainingContext: { initiative: string, scope: string, audience: object[] },
 *   learningNeeds: { skillGaps: object[], behaviorChanges: object[] },
 *   constraints: { timeline: string, budget: object, resources: object },
 *   deliveryPreferences: { methods: string[], locations: string[] },
 *   existingMaterials: object[]
 * }
 * @outputs {
 *   trainingProgram: object,
 *   curriculum: object,
 *   learningMaterials: object[],
 *   deliveryPlan: object,
 *   assessmentPlan: object,
 *   sustainmentPlan: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const needsAnalysisTask = defineTask('training-needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Training Needs',
  agent: {
    name: 'training-needs-analyst',
    prompt: {
      role: 'Learning Needs Analyst',
      task: 'Conduct comprehensive training needs analysis by audience segment',
      context: args,
      instructions: [
        'Analyze skill gaps by audience',
        'Identify knowledge requirements',
        'Assess current competency levels',
        'Define target competency levels',
        'Identify behavioral changes needed',
        'Assess learning preferences by group',
        'Prioritize training needs',
        'Create training needs matrix'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        needsAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audienceGroup: { type: 'string' },
              size: { type: 'number' },
              currentLevel: { type: 'object' },
              targetLevel: { type: 'object' },
              skillGaps: { type: 'array', items: { type: 'object' } },
              knowledgeGaps: { type: 'array', items: { type: 'object' } },
              behaviorChanges: { type: 'array', items: { type: 'string' } },
              learningPreferences: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        trainingNeedsMatrix: { type: 'object' },
        prioritizedNeeds: { type: 'array', items: { type: 'object' } }
      },
      required: ['needsAnalysis', 'prioritizedNeeds']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const learningObjectivesTask = defineTask('learning-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Learning Objectives',
  agent: {
    name: 'instructional-designer',
    prompt: {
      role: 'Instructional Design Specialist',
      task: 'Define measurable learning objectives using Bloom\'s taxonomy',
      context: args,
      instructions: [
        'Create terminal learning objectives',
        'Create enabling learning objectives',
        'Align with Bloom\'s taxonomy levels',
        'Ensure objectives are SMART',
        'Map objectives to training needs',
        'Sequence objectives logically',
        'Define assessment criteria',
        'Create objectives hierarchy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        learningObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              type: { type: 'string', enum: ['terminal', 'enabling'] },
              objective: { type: 'string' },
              bloomsLevel: { type: 'string' },
              assessmentCriteria: { type: 'array', items: { type: 'string' } },
              relatedNeeds: { type: 'array', items: { type: 'string' } },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        objectivesHierarchy: { type: 'object' },
        audienceMapping: { type: 'object' }
      },
      required: ['learningObjectives', 'objectivesHierarchy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const curriculumDesignTask = defineTask('curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Training Curriculum',
  agent: {
    name: 'curriculum-designer',
    prompt: {
      role: 'Curriculum Design Specialist',
      task: 'Design comprehensive training curriculum with modules and learning paths',
      context: args,
      instructions: [
        'Design curriculum structure',
        'Create learning paths by role',
        'Design training modules',
        'Define module sequencing',
        'Plan prerequisite requirements',
        'Design learning activities',
        'Integrate various learning methods',
        'Create curriculum overview'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        curriculum: {
          type: 'object',
          properties: {
            overview: { type: 'object' },
            learningPaths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pathId: { type: 'string' },
                  targetAudience: { type: 'string' },
                  modules: { type: 'array', items: { type: 'string' } },
                  duration: { type: 'string' },
                  certification: { type: 'object' }
                }
              }
            },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleId: { type: 'string' },
                  title: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  topics: { type: 'array', items: { type: 'object' } },
                  duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'object' } },
                  assessment: { type: 'object' }
                }
              }
            }
          }
        },
        moduleSequencing: { type: 'object' },
        totalDuration: { type: 'object' }
      },
      required: ['curriculum']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const materialDevelopmentTask = defineTask('material-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Learning Materials',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'Learning Content Developer',
      task: 'Develop comprehensive learning materials and resources',
      context: args,
      instructions: [
        'Design instructor-led training materials',
        'Create participant guides/workbooks',
        'Develop quick reference cards/job aids',
        'Create e-learning content outlines',
        'Design hands-on exercises',
        'Create assessment instruments',
        'Develop reinforcement materials',
        'Create multimedia specifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        learningMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialId: { type: 'string' },
              moduleId: { type: 'string' },
              type: { type: 'string' },
              title: { type: 'string' },
              format: { type: 'string' },
              content: { type: 'object' },
              developmentStatus: { type: 'string' }
            }
          }
        },
        instructorGuides: { type: 'array', items: { type: 'object' } },
        participantMaterials: { type: 'array', items: { type: 'object' } },
        jobAids: { type: 'array', items: { type: 'object' } },
        eLearningSpecs: { type: 'array', items: { type: 'object' } },
        exerciseDesigns: { type: 'array', items: { type: 'object' } }
      },
      required: ['learningMaterials', 'instructorGuides', 'participantMaterials']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const deliveryPlanTask = defineTask('delivery-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Delivery Plan',
  agent: {
    name: 'training-delivery-planner',
    prompt: {
      role: 'Training Delivery Specialist',
      task: 'Create comprehensive training delivery plan with logistics',
      context: args,
      instructions: [
        'Design delivery approach',
        'Create training schedule',
        'Plan session logistics',
        'Identify and prepare trainers',
        'Plan training environment setup',
        'Create enrollment process',
        'Plan capacity management',
        'Design feedback collection'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        deliveryPlan: {
          type: 'object',
          properties: {
            deliveryApproach: { type: 'object' },
            schedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  module: { type: 'string' },
                  date: { type: 'string' },
                  time: { type: 'string' },
                  location: { type: 'string' },
                  trainer: { type: 'string' },
                  capacity: { type: 'number' },
                  targetAudience: { type: 'string' }
                }
              }
            },
            logistics: { type: 'object' },
            trainerRequirements: { type: 'array', items: { type: 'object' } },
            enrollmentProcess: { type: 'object' }
          }
        },
        capacityPlan: { type: 'object' },
        resourceRequirements: { type: 'object' },
        feedbackProcess: { type: 'object' }
      },
      required: ['deliveryPlan', 'capacityPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessmentDesignTask = defineTask('assessment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Assessment Strategy',
  agent: {
    name: 'assessment-designer',
    prompt: {
      role: 'Learning Assessment Specialist',
      task: 'Design comprehensive assessment strategy to measure learning effectiveness',
      context: args,
      instructions: [
        'Design pre-training assessments',
        'Create knowledge checks',
        'Design skills assessments',
        'Create practical evaluations',
        'Design certification criteria',
        'Plan competency verification',
        'Create assessment rubrics',
        'Design reporting dashboard'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        assessmentPlan: {
          type: 'object',
          properties: {
            preAssessments: { type: 'array', items: { type: 'object' } },
            formativeAssessments: { type: 'array', items: { type: 'object' } },
            summativeAssessments: { type: 'array', items: { type: 'object' } },
            practicalEvaluations: { type: 'array', items: { type: 'object' } },
            certificationCriteria: { type: 'object' }
          }
        },
        assessmentRubrics: { type: 'array', items: { type: 'object' } },
        passingCriteria: { type: 'object' },
        reportingDashboard: { type: 'object' }
      },
      required: ['assessmentPlan', 'assessmentRubrics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const trainerEnablementTask = defineTask('trainer-enablement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Trainer Enablement',
  agent: {
    name: 'trainer-enablement-specialist',
    prompt: {
      role: 'Train-the-Trainer Specialist',
      task: 'Design trainer enablement program and support resources',
      context: args,
      instructions: [
        'Define trainer competency requirements',
        'Design train-the-trainer program',
        'Create trainer certification process',
        'Develop facilitation guides',
        'Create trainer support materials',
        'Design trainer coaching plan',
        'Plan ongoing trainer development',
        'Create trainer community structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        trainerEnablement: {
          type: 'object',
          properties: {
            competencyRequirements: { type: 'array', items: { type: 'object' } },
            trainTheTrainer: { type: 'object' },
            certificationProcess: { type: 'object' },
            supportMaterials: { type: 'array', items: { type: 'object' } },
            coachingPlan: { type: 'object' }
          }
        },
        facilitationGuides: { type: 'array', items: { type: 'object' } },
        trainerCommunity: { type: 'object' }
      },
      required: ['trainerEnablement', 'facilitationGuides']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const sustainmentPlanTask = defineTask('sustainment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Sustainment Plan',
  agent: {
    name: 'learning-sustainment-planner',
    prompt: {
      role: 'Learning Sustainment Specialist',
      task: 'Create plan for sustaining learning and continuous skill development',
      context: args,
      instructions: [
        'Design refresher training approach',
        'Create just-in-time learning resources',
        'Plan performance support tools',
        'Design coaching and mentoring program',
        'Create knowledge sharing platform',
        'Plan ongoing assessment and tracking',
        'Design continuous improvement process',
        'Create sustainment metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sustainmentPlan: {
          type: 'object',
          properties: {
            refresherTraining: { type: 'object' },
            justInTimeLearning: { type: 'array', items: { type: 'object' } },
            performanceSupport: { type: 'array', items: { type: 'object' } },
            coachingProgram: { type: 'object' },
            knowledgeSharing: { type: 'object' },
            continuousImprovement: { type: 'object' }
          }
        },
        sustainmentMetrics: { type: 'array', items: { type: 'object' } },
        maintenancePlan: { type: 'object' }
      },
      required: ['sustainmentPlan', 'sustainmentMetrics']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Training and Enablement Design process');

  const artifacts = {
    needsAnalysis: null,
    learningObjectives: null,
    curriculum: null,
    learningMaterials: null,
    deliveryPlan: null,
    assessmentPlan: null,
    trainerEnablement: null,
    sustainmentPlan: null
  };

  // Phase 1: Training Needs Analysis
  ctx.log('Phase 1: Analyzing training needs');
  const needsResult = await ctx.task(needsAnalysisTask, {
    trainingContext: inputs.trainingContext,
    learningNeeds: inputs.learningNeeds
  });
  artifacts.needsAnalysis = needsResult;

  // Phase 2: Learning Objectives
  ctx.log('Phase 2: Defining learning objectives');
  const objectivesResult = await ctx.task(learningObjectivesTask, {
    needsAnalysis: artifacts.needsAnalysis,
    trainingContext: inputs.trainingContext
  });
  artifacts.learningObjectives = objectivesResult;

  // Phase 3: Curriculum Design
  ctx.log('Phase 3: Designing training curriculum');
  const curriculumResult = await ctx.task(curriculumDesignTask, {
    learningObjectives: artifacts.learningObjectives,
    needsAnalysis: artifacts.needsAnalysis,
    deliveryPreferences: inputs.deliveryPreferences,
    constraints: inputs.constraints
  });
  artifacts.curriculum = curriculumResult;

  // Breakpoint for curriculum review
  await ctx.breakpoint('curriculum-review', {
    question: 'Review the training curriculum design. Is the structure and content appropriate?',
    artifacts: {
      needsAnalysis: artifacts.needsAnalysis,
      learningObjectives: artifacts.learningObjectives,
      curriculum: artifacts.curriculum
    }
  });

  // Phase 4: Learning Materials Development
  ctx.log('Phase 4: Developing learning materials');
  const materialsResult = await ctx.task(materialDevelopmentTask, {
    curriculum: artifacts.curriculum,
    learningObjectives: artifacts.learningObjectives,
    existingMaterials: inputs.existingMaterials
  });
  artifacts.learningMaterials = materialsResult;

  // Phase 5: Delivery Plan
  ctx.log('Phase 5: Creating delivery plan');
  const deliveryResult = await ctx.task(deliveryPlanTask, {
    curriculum: artifacts.curriculum,
    trainingContext: inputs.trainingContext,
    deliveryPreferences: inputs.deliveryPreferences,
    constraints: inputs.constraints
  });
  artifacts.deliveryPlan = deliveryResult;

  // Phase 6: Assessment Design
  ctx.log('Phase 6: Designing assessment strategy');
  const assessmentResult = await ctx.task(assessmentDesignTask, {
    curriculum: artifacts.curriculum,
    learningObjectives: artifacts.learningObjectives,
    needsAnalysis: artifacts.needsAnalysis
  });
  artifacts.assessmentPlan = assessmentResult;

  // Phase 7: Trainer Enablement
  ctx.log('Phase 7: Designing trainer enablement');
  const trainerResult = await ctx.task(trainerEnablementTask, {
    curriculum: artifacts.curriculum,
    learningMaterials: artifacts.learningMaterials,
    deliveryPlan: artifacts.deliveryPlan
  });
  artifacts.trainerEnablement = trainerResult;

  // Phase 8: Sustainment Plan
  ctx.log('Phase 8: Creating sustainment plan');
  const sustainmentResult = await ctx.task(sustainmentPlanTask, {
    curriculum: artifacts.curriculum,
    assessmentPlan: artifacts.assessmentPlan,
    trainingContext: inputs.trainingContext
  });
  artifacts.sustainmentPlan = sustainmentResult;

  ctx.log('Training and Enablement Design process completed');

  return {
    success: true,
    trainingProgram: {
      needsAnalysis: artifacts.needsAnalysis,
      objectives: artifacts.learningObjectives,
      trainerEnablement: artifacts.trainerEnablement
    },
    curriculum: artifacts.curriculum.curriculum,
    learningMaterials: artifacts.learningMaterials.learningMaterials,
    deliveryPlan: artifacts.deliveryPlan.deliveryPlan,
    assessmentPlan: artifacts.assessmentPlan.assessmentPlan,
    sustainmentPlan: artifacts.sustainmentPlan.sustainmentPlan,
    artifacts
  };
}
