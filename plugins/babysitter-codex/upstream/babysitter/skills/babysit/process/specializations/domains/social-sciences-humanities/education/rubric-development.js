/**
 * @process education/rubric-development
 * @description Creating clear, reliable scoring rubrics with defined criteria and performance levels for consistent assessment of student work
 * @inputs { assessmentTask: string, learningObjectives: array, performanceLevels: number, rubricType: string, context: object }
 * @outputs { success: boolean, rubric: object, anchorExamples: array, scorerGuide: object, artifacts: array }
 * @recommendedSkills SK-EDU-004 (rubric-development), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-003 (assessment-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    assessmentTask = '',
    learningObjectives = [],
    performanceLevels = 4,
    rubricType = 'analytic',
    context = {},
    outputDir = 'rubric-development-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Rubric Development for: ${assessmentTask}`);

  // ============================================================================
  // CRITERIA IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Identifying assessment criteria');
  const criteriaIdentification = await ctx.task(criteriaIdentificationTask, {
    assessmentTask,
    learningObjectives,
    rubricType,
    context,
    outputDir
  });

  artifacts.push(...criteriaIdentification.artifacts);

  // ============================================================================
  // PERFORMANCE LEVEL DEFINITION
  // ============================================================================

  ctx.log('info', 'Defining performance levels');
  const levelDefinition = await ctx.task(performanceLevelDefinitionTask, {
    assessmentTask,
    criteria: criteriaIdentification.criteria,
    performanceLevels,
    outputDir
  });

  artifacts.push(...levelDefinition.artifacts);

  // ============================================================================
  // DESCRIPTOR WRITING
  // ============================================================================

  ctx.log('info', 'Writing performance descriptors');
  const descriptorWriting = await ctx.task(descriptorWritingTask, {
    assessmentTask,
    criteria: criteriaIdentification.criteria,
    levels: levelDefinition.levels,
    rubricType,
    outputDir
  });

  artifacts.push(...descriptorWriting.artifacts);

  // ============================================================================
  // ANCHOR EXAMPLE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing anchor examples');
  const anchorDevelopment = await ctx.task(anchorExampleDevelopmentTask, {
    assessmentTask,
    rubric: descriptorWriting.rubric,
    levels: levelDefinition.levels,
    outputDir
  });

  artifacts.push(...anchorDevelopment.artifacts);

  // ============================================================================
  // SCORER GUIDE CREATION
  // ============================================================================

  ctx.log('info', 'Creating scorer guide');
  const scorerGuide = await ctx.task(scorerGuideCreationTask, {
    assessmentTask,
    rubric: descriptorWriting.rubric,
    anchors: anchorDevelopment.anchors,
    outputDir
  });

  artifacts.push(...scorerGuide.artifacts);

  // ============================================================================
  // RUBRIC VALIDATION
  // ============================================================================

  ctx.log('info', 'Validating rubric');
  const rubricValidation = await ctx.task(rubricValidationTask, {
    assessmentTask,
    rubric: descriptorWriting.rubric,
    learningObjectives,
    anchors: anchorDevelopment.anchors,
    outputDir
  });

  artifacts.push(...rubricValidation.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring rubric quality');
  const qualityScore = await ctx.task(rubricQualityScoringTask, {
    assessmentTask,
    criteriaIdentification,
    levelDefinition,
    descriptorWriting,
    anchorDevelopment,
    rubricValidation,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review rubric
  await ctx.breakpoint({
    question: `Rubric development complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Rubric Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        assessmentTask,
        rubricType,
        criteriaCount: criteriaIdentification.criteria?.length || 0,
        performanceLevels,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    assessmentTask,
    rubricType,
    qualityScore: overallScore,
    qualityMet,
    rubric: {
      criteria: criteriaIdentification.criteria,
      levels: levelDefinition.levels,
      descriptors: descriptorWriting.rubric,
      pointValues: descriptorWriting.pointValues
    },
    anchorExamples: anchorDevelopment.anchors,
    scorerGuide: scorerGuide.guide,
    validationReport: rubricValidation.report,
    artifacts,
    duration,
    metadata: {
      processId: 'education/rubric-development',
      timestamp: startTime,
      assessmentTask,
      rubricType,
      outputDir
    }
  };
}

// Task 1: Criteria Identification
export const criteriaIdentificationTask = defineTask('criteria-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify assessment criteria',
  agent: {
    name: 'criteria-analyst',
    prompt: {
      role: 'rubric development specialist',
      task: 'Identify criteria for assessing student work',
      context: args,
      instructions: [
        'Analyze the assessment task requirements',
        'Identify key dimensions of quality',
        'Align criteria with learning objectives',
        'Ensure criteria are observable and measurable',
        'Distinguish between criteria (not overlapping)',
        'Prioritize criteria by importance',
        'Consider holistic vs analytic criteria needs',
        'Document criteria definitions',
        'Generate criteria identification document'
      ],
      outputFormat: 'JSON with criteria, definitions, alignment, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterionId: { type: 'string' },
              name: { type: 'string' },
              definition: { type: 'string' },
              weight: { type: 'number' },
              alignedObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        definitions: { type: 'object' },
        alignment: { type: 'array' },
        prioritization: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'criteria', 'identification']
}));

// Task 2: Performance Level Definition
export const performanceLevelDefinitionTask = defineTask('performance-level-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define performance levels',
  agent: {
    name: 'level-definer',
    prompt: {
      role: 'assessment level specialist',
      task: 'Define clear performance levels for the rubric',
      context: args,
      instructions: [
        'Define the number of performance levels',
        'Create clear level labels (e.g., Exemplary, Proficient, Developing, Beginning)',
        'Define what distinguishes each level',
        'Ensure levels are evenly distributed',
        'Assign point values to each level',
        'Define the threshold for proficiency',
        'Consider developmental appropriateness',
        'Document level definitions',
        'Generate performance level document'
      ],
      outputFormat: 'JSON with levels, labels, definitions, pointValues, proficiencyThreshold, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'labels', 'artifacts'],
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              levelNumber: { type: 'number' },
              label: { type: 'string' },
              generalDescription: { type: 'string' },
              pointValue: { type: 'number' }
            }
          }
        },
        labels: { type: 'array', items: { type: 'string' } },
        definitions: { type: 'object' },
        pointValues: { type: 'object' },
        proficiencyThreshold: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'levels', 'definition']
}));

// Task 3: Descriptor Writing
export const descriptorWritingTask = defineTask('descriptor-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write performance descriptors',
  agent: {
    name: 'descriptor-writer',
    prompt: {
      role: 'rubric descriptor specialist',
      task: 'Write clear performance descriptors for each criterion-level combination',
      context: args,
      instructions: [
        'Write descriptors for each criterion at each level',
        'Use parallel language structure across levels',
        'Make descriptors specific and observable',
        'Avoid vague terms (e.g., good, adequate)',
        'Use qualitative and quantitative indicators',
        'Ensure clear differentiation between levels',
        'Write in student-friendly language',
        'Include examples where helpful',
        'Generate rubric matrix document'
      ],
      outputFormat: 'JSON with rubric, descriptorMatrix, pointValues, studentVersion, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rubric', 'pointValues', 'artifacts'],
      properties: {
        rubric: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              descriptors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level: { type: 'number' },
                    descriptor: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        descriptorMatrix: { type: 'object' },
        pointValues: { type: 'object' },
        studentVersion: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'descriptors', 'writing']
}));

// Task 4: Anchor Example Development
export const anchorExampleDevelopmentTask = defineTask('anchor-example-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop anchor examples',
  agent: {
    name: 'anchor-developer',
    prompt: {
      role: 'scoring anchor specialist',
      task: 'Develop anchor examples for each performance level',
      context: args,
      instructions: [
        'Create or identify anchor examples for each level',
        'Ensure anchors clearly represent the level',
        'Include borderline examples for calibration',
        'Write annotations explaining why each anchor fits its level',
        'Include both strong and weak examples within levels',
        'Consider diverse response types',
        'Create training set with varied examples',
        'Document selection rationale',
        'Generate anchor example document'
      ],
      outputFormat: 'JSON with anchors, annotations, borderlineExamples, trainingSet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['anchors', 'artifacts'],
      properties: {
        anchors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              anchorId: { type: 'string' },
              level: { type: 'number' },
              example: { type: 'string' },
              annotation: { type: 'string' },
              criterionScores: { type: 'object' }
            }
          }
        },
        annotations: { type: 'array' },
        borderlineExamples: { type: 'array' },
        trainingSet: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'anchors', 'examples']
}));

// Task 5: Scorer Guide Creation
export const scorerGuideCreationTask = defineTask('scorer-guide-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create scorer guide',
  agent: {
    name: 'scorer-guide-creator',
    prompt: {
      role: 'scorer training specialist',
      task: 'Create comprehensive guide for scoring student work',
      context: args,
      instructions: [
        'Write step-by-step scoring procedures',
        'Include rubric interpretation guidelines',
        'Address common scoring challenges',
        'Provide guidance for edge cases',
        'Include calibration exercises',
        'Create scoring practice activities',
        'Document inter-rater reliability procedures',
        'Include troubleshooting guide',
        'Generate scorer guide document'
      ],
      outputFormat: 'JSON with guide, procedures, calibrationExercises, troubleshooting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'procedures', 'artifacts'],
      properties: {
        guide: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            scoringSteps: { type: 'array' },
            interpretationGuidelines: { type: 'object' },
            edgeCases: { type: 'array' }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            preparation: { type: 'array' },
            scoring: { type: 'array' },
            review: { type: 'array' }
          }
        },
        calibrationExercises: { type: 'array' },
        troubleshooting: { type: 'array' },
        reliabilityProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'scorer-guide', 'training']
}));

// Task 6: Rubric Validation
export const rubricValidationTask = defineTask('rubric-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate rubric',
  agent: {
    name: 'rubric-validator',
    prompt: {
      role: 'rubric validation specialist',
      task: 'Validate rubric for clarity, reliability, and validity',
      context: args,
      instructions: [
        'Check alignment with learning objectives',
        'Review descriptor clarity and specificity',
        'Verify level distinctions are clear',
        'Check for consistent language',
        'Verify point values are appropriate',
        'Review for potential bias',
        'Assess feasibility for scoring',
        'Document validation findings',
        'Generate validation report'
      ],
      outputFormat: 'JSON with report, alignmentCheck, clarityCheck, biasCheck, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            overallValidity: { type: 'string' },
            summary: { type: 'string' },
            strengths: { type: 'array' },
            weaknesses: { type: 'array' }
          }
        },
        alignmentCheck: { type: 'object' },
        clarityCheck: { type: 'object' },
        biasCheck: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        revisionsSuggested: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rubric', 'validation', 'quality']
}));

// Task 7: Quality Scoring
export const rubricQualityScoringTask = defineTask('rubric-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score rubric quality',
  agent: {
    name: 'rubric-quality-auditor',
    prompt: {
      role: 'rubric quality auditor',
      task: 'Assess rubric development quality',
      context: args,
      instructions: [
        'Evaluate criteria clarity and completeness (weight: 25%)',
        'Assess level differentiation quality (weight: 20%)',
        'Review descriptor specificity (weight: 25%)',
        'Evaluate anchor example quality (weight: 15%)',
        'Assess scorer guide completeness (weight: 15%)',
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
            criteriaClarity: { type: 'number' },
            levelDifferentiation: { type: 'number' },
            descriptorSpecificity: { type: 'number' },
            anchorQuality: { type: 'number' },
            scorerGuide: { type: 'number' }
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
  labels: ['agent', 'rubric', 'quality-scoring', 'validation']
}));
