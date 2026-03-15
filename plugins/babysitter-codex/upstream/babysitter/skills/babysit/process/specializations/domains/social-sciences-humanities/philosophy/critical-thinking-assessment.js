/**
 * @process philosophy/critical-thinking-assessment
 * @description Design and implement assessments of reasoning skills, identifying cognitive biases, evaluating argument quality, and measuring logical competence
 * @inputs { assessmentContext: string, targetSkills: array, assessmentType: string, outputDir: string }
 * @outputs { success: boolean, assessmentDesign: object, evaluationCriteria: object, sampleQuestions: array, artifacts: array }
 * @recommendedSkills SK-PHIL-011 (fallacy-detection-analysis), SK-PHIL-014 (socratic-dialogue-facilitation), SK-PHIL-002 (argument-mapping-reconstruction)
 * @recommendedAgents AG-PHIL-007 (critical-thinking-educator-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    assessmentContext,
    targetSkills = ['argument-analysis', 'fallacy-identification', 'evidence-evaluation'],
    assessmentType = 'comprehensive',
    outputDir = 'critical-thinking-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Assessment Framework Development
  ctx.log('info', 'Starting critical thinking assessment: Developing framework');
  const frameworkDevelopment = await ctx.task(frameworkDevelopmentTask, {
    assessmentContext,
    targetSkills,
    assessmentType,
    outputDir
  });

  if (!frameworkDevelopment.success) {
    return {
      success: false,
      error: 'Framework development failed',
      details: frameworkDevelopment,
      metadata: { processId: 'philosophy/critical-thinking-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...frameworkDevelopment.artifacts);

  // Task 2: Cognitive Bias Assessment Design
  ctx.log('info', 'Designing cognitive bias assessment');
  const biasAssessment = await ctx.task(biasAssessmentTask, {
    framework: frameworkDevelopment.framework,
    assessmentContext,
    outputDir
  });

  artifacts.push(...biasAssessment.artifacts);

  // Task 3: Argument Quality Evaluation Design
  ctx.log('info', 'Designing argument quality evaluation');
  const argumentEvaluation = await ctx.task(argumentEvaluationTask, {
    framework: frameworkDevelopment.framework,
    targetSkills,
    outputDir
  });

  artifacts.push(...argumentEvaluation.artifacts);

  // Task 4: Logical Competence Measurement Design
  ctx.log('info', 'Designing logical competence measurement');
  const logicalMeasurement = await ctx.task(logicalMeasurementTask, {
    framework: frameworkDevelopment.framework,
    targetSkills,
    outputDir
  });

  artifacts.push(...logicalMeasurement.artifacts);

  // Task 5: Sample Question Development
  ctx.log('info', 'Developing sample questions');
  const sampleQuestions = await ctx.task(sampleQuestionsTask, {
    biasAssessment,
    argumentEvaluation,
    logicalMeasurement,
    outputDir
  });

  artifacts.push(...sampleQuestions.artifacts);

  // Task 6: Scoring Rubric Development
  ctx.log('info', 'Developing scoring rubrics');
  const scoringRubrics = await ctx.task(scoringRubricsTask, {
    framework: frameworkDevelopment.framework,
    questions: sampleQuestions.questions,
    outputDir
  });

  artifacts.push(...scoringRubrics.artifacts);

  // Breakpoint: Review assessment design
  await ctx.breakpoint({
    question: `Critical thinking assessment design complete. ${sampleQuestions.questions.length} sample questions developed. Review the assessment?`,
    title: 'Critical Thinking Assessment Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        assessmentContext,
        targetSkills,
        questionCount: sampleQuestions.questions.length,
        skillsCovered: frameworkDevelopment.framework.skills.length
      }
    }
  });

  // Task 7: Generate Assessment Package
  ctx.log('info', 'Generating assessment package');
  const assessmentPackage = await ctx.task(assessmentPackageTask, {
    frameworkDevelopment,
    biasAssessment,
    argumentEvaluation,
    logicalMeasurement,
    sampleQuestions,
    scoringRubrics,
    outputDir
  });

  artifacts.push(...assessmentPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    assessmentDesign: {
      framework: frameworkDevelopment.framework,
      components: {
        biasAssessment: biasAssessment.design,
        argumentEvaluation: argumentEvaluation.design,
        logicalMeasurement: logicalMeasurement.design
      }
    },
    evaluationCriteria: {
      rubrics: scoringRubrics.rubrics,
      scoringGuide: scoringRubrics.guide,
      benchmarks: scoringRubrics.benchmarks
    },
    sampleQuestions: sampleQuestions.questions,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/critical-thinking-assessment',
      timestamp: startTime,
      assessmentType,
      outputDir
    }
  };
}

// Task definitions
export const frameworkDevelopmentTask = defineTask('framework-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop assessment framework',
  agent: {
    name: 'framework-developer',
    prompt: {
      role: 'critical thinking educator',
      task: 'Develop a framework for assessing critical thinking skills',
      context: args,
      instructions: [
        'Define the critical thinking skills to assess',
        'Operationalize each skill',
        'Identify skill levels (beginner to expert)',
        'Determine appropriate assessment methods',
        'Align with established CT frameworks (Paul-Elder, etc.)',
        'Consider context-specific requirements',
        'Design validity measures',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with success, framework (skills, levels, methods, validity), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'framework', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        framework: {
          type: 'object',
          properties: {
            skills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  skill: { type: 'string' },
                  definition: { type: 'string' },
                  indicators: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            levels: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'string' } },
            validityMeasures: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'framework']
}));

export const biasAssessmentTask = defineTask('bias-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design cognitive bias assessment',
  agent: {
    name: 'bias-assessor',
    prompt: {
      role: 'cognitive scientist and educator',
      task: 'Design assessment for identifying cognitive biases',
      context: args,
      instructions: [
        'Identify key cognitive biases to assess',
        'Design scenarios that reveal biases',
        'Create bias identification tasks',
        'Develop bias resistance measures',
        'Include common biases (confirmation, anchoring, etc.)',
        'Design metacognitive awareness items',
        'Ensure ecological validity',
        'Save bias assessment design to output directory'
      ],
      outputFormat: 'JSON with design (biases, scenarios, tasks, measures), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            targetBiases: { type: 'array', items: { type: 'string' } },
            scenarios: { type: 'array', items: { type: 'object' } },
            tasks: { type: 'array', items: { type: 'string' } },
            measures: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'bias']
}));

export const argumentEvaluationTask = defineTask('argument-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design argument quality evaluation',
  agent: {
    name: 'argument-evaluator',
    prompt: {
      role: 'logic educator',
      task: 'Design assessment for evaluating argument quality',
      context: args,
      instructions: [
        'Define argument quality dimensions',
        'Design premise evaluation tasks',
        'Design validity/soundness assessment',
        'Create fallacy identification items',
        'Design argument strength rating tasks',
        'Include argument reconstruction tasks',
        'Create counterargument generation tasks',
        'Save argument evaluation design to output directory'
      ],
      outputFormat: 'JSON with design (dimensions, tasks, fallacyItems, reconstructionTasks), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            dimensions: { type: 'array', items: { type: 'string' } },
            premiseTasks: { type: 'array', items: { type: 'string' } },
            validityTasks: { type: 'array', items: { type: 'string' } },
            fallacyItems: { type: 'array', items: { type: 'string' } },
            reconstructionTasks: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'arguments']
}));

export const logicalMeasurementTask = defineTask('logical-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design logical competence measurement',
  agent: {
    name: 'logic-measurer',
    prompt: {
      role: 'logic educator',
      task: 'Design assessment for measuring logical competence',
      context: args,
      instructions: [
        'Define logical competencies to measure',
        'Design deductive reasoning tasks',
        'Design inductive reasoning tasks',
        'Create syllogism evaluation items',
        'Design conditional reasoning tasks',
        'Include formal logic items if appropriate',
        'Calibrate difficulty levels',
        'Save logical measurement design to output directory'
      ],
      outputFormat: 'JSON with design (competencies, deductive, inductive, syllogisms, conditionals), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            competencies: { type: 'array', items: { type: 'string' } },
            deductiveTasks: { type: 'array', items: { type: 'string' } },
            inductiveTasks: { type: 'array', items: { type: 'string' } },
            syllogismItems: { type: 'array', items: { type: 'string' } },
            conditionalTasks: { type: 'array', items: { type: 'string' } },
            difficultyLevels: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'logic']
}));

export const sampleQuestionsTask = defineTask('sample-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sample questions',
  agent: {
    name: 'question-developer',
    prompt: {
      role: 'assessment developer',
      task: 'Develop sample assessment questions',
      context: args,
      instructions: [
        'Create questions for each skill area',
        'Include multiple question formats',
        'Vary difficulty levels',
        'Include answer keys',
        'Provide explanations for answers',
        'Ensure content validity',
        'Balance question types',
        'Save sample questions to output directory'
      ],
      outputFormat: 'JSON with questions (question, type, skill, difficulty, answer, explanation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string' },
              targetSkill: { type: 'string' },
              difficulty: { type: 'string' },
              answer: { type: 'string' },
              explanation: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'questions']
}));

export const scoringRubricsTask = defineTask('scoring-rubrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scoring rubrics',
  agent: {
    name: 'rubric-developer',
    prompt: {
      role: 'assessment developer',
      task: 'Develop scoring rubrics and criteria',
      context: args,
      instructions: [
        'Develop rubrics for each skill area',
        'Define performance levels',
        'Create specific criteria for each level',
        'Develop scoring guide for assessors',
        'Establish benchmarks',
        'Create inter-rater reliability guidance',
        'Design feedback mechanisms',
        'Save scoring rubrics to output directory'
      ],
      outputFormat: 'JSON with rubrics, guide, benchmarks, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rubrics', 'guide', 'artifacts'],
      properties: {
        rubrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              levels: { type: 'array', items: { type: 'object' } },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        guide: { type: 'string' },
        benchmarks: { type: 'object' },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'critical-thinking', 'rubrics']
}));

export const assessmentPackageTask = defineTask('assessment-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate assessment package',
  agent: {
    name: 'package-generator',
    prompt: {
      role: 'assessment developer',
      task: 'Generate complete assessment package',
      context: args,
      instructions: [
        'Compile all assessment components',
        'Create administrator guide',
        'Create student/participant instructions',
        'Compile question bank',
        'Include scoring materials',
        'Create interpretation guide',
        'Package all materials',
        'Save assessment package to output directory'
      ],
      outputFormat: 'JSON with package (components, guides, materials), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: {
          type: 'object',
          properties: {
            components: { type: 'array', items: { type: 'string' } },
            administratorGuide: { type: 'string' },
            participantInstructions: { type: 'string' },
            questionBank: { type: 'string' },
            scoringMaterials: { type: 'string' },
            interpretationGuide: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'critical-thinking', 'package']
}));
