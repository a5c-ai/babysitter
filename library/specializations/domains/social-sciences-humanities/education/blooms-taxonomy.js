/**
 * @process education/blooms-taxonomy
 * @description Applying cognitive taxonomy levels (Remember, Understand, Apply, Analyze, Evaluate, Create) to write measurable learning objectives and design aligned assessments
 * @inputs { courseName: string, contentTopics: array, targetLevel: string, context: object }
 * @outputs { success: boolean, objectives: array, assessmentAlignment: object, activityAlignment: object, artifacts: array }
 * @recommendedSkills SK-EDU-002 (learning-objectives-writing), SK-EDU-003 (assessment-design-validation), SK-EDU-004 (rubric-development)
 * @recommendedAgents AG-EDU-001 (instructional-designer), AG-EDU-002 (curriculum-development-specialist), AG-EDU-003 (assessment-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    contentTopics = [],
    targetLevel = 'apply',
    context = {},
    outputDir = 'blooms-taxonomy-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bloom's Taxonomy Application for ${courseName}`);

  // ============================================================================
  // CONTENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing content for cognitive level mapping');
  const contentAnalysis = await ctx.task(contentCognitiveMappingTask, {
    courseName,
    contentTopics,
    targetLevel,
    outputDir
  });

  artifacts.push(...contentAnalysis.artifacts);

  // ============================================================================
  // OBJECTIVE WRITING
  // ============================================================================

  ctx.log('info', 'Writing measurable learning objectives');
  const objectiveWriting = await ctx.task(objectiveWritingTask, {
    courseName,
    contentMapping: contentAnalysis.mapping,
    targetLevel,
    outputDir
  });

  artifacts.push(...objectiveWriting.artifacts);

  // ============================================================================
  // VERB ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Aligning action verbs to cognitive levels');
  const verbAlignment = await ctx.task(verbAlignmentTask, {
    objectives: objectiveWriting.objectives,
    outputDir
  });

  artifacts.push(...verbAlignment.artifacts);

  // ============================================================================
  // ASSESSMENT ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Aligning assessments to cognitive levels');
  const assessmentAlignment = await ctx.task(assessmentAlignmentTask, {
    objectives: objectiveWriting.objectives,
    verbAlignment: verbAlignment.alignment,
    outputDir
  });

  artifacts.push(...assessmentAlignment.artifacts);

  // ============================================================================
  // ACTIVITY ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Aligning learning activities to cognitive levels');
  const activityAlignment = await ctx.task(activityAlignmentTask, {
    objectives: objectiveWriting.objectives,
    assessmentAlignment: assessmentAlignment.alignment,
    outputDir
  });

  artifacts.push(...activityAlignment.artifacts);

  // ============================================================================
  // COGNITIVE LEVEL DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Analyzing cognitive level distribution');
  const levelDistribution = await ctx.task(cognitiveLevelDistributionTask, {
    objectives: objectiveWriting.objectives,
    assessmentAlignment: assessmentAlignment.alignment,
    activityAlignment: activityAlignment.alignment,
    targetLevel,
    outputDir
  });

  artifacts.push(...levelDistribution.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring Bloom\'s taxonomy application quality');
  const qualityScore = await ctx.task(bloomsQualityScoringTask, {
    courseName,
    objectiveWriting,
    verbAlignment,
    assessmentAlignment,
    activityAlignment,
    levelDistribution,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review Bloom's taxonomy application
  await ctx.breakpoint({
    question: `Bloom's taxonomy application complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Bloom\'s Taxonomy Application Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        targetLevel,
        totalObjectives: objectiveWriting.objectives?.length || 0,
        levelDistribution: levelDistribution.distribution,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    targetLevel,
    qualityScore: overallScore,
    qualityMet,
    objectives: objectiveWriting.objectives,
    verbAlignment: verbAlignment.alignment,
    assessmentAlignment: assessmentAlignment.alignment,
    activityAlignment: activityAlignment.alignment,
    levelDistribution: levelDistribution.distribution,
    artifacts,
    duration,
    metadata: {
      processId: 'education/blooms-taxonomy',
      timestamp: startTime,
      courseName,
      targetLevel,
      outputDir
    }
  };
}

// Task 1: Content Cognitive Mapping
export const contentCognitiveMappingTask = defineTask('content-cognitive-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map content to cognitive levels',
  agent: {
    name: 'cognitive-mapper',
    prompt: {
      role: 'cognitive taxonomy specialist',
      task: 'Map content topics to appropriate Bloom\'s taxonomy levels',
      context: args,
      instructions: [
        'Analyze each content topic',
        'Determine appropriate cognitive levels for each topic',
        'Consider prerequisite-advanced relationships',
        'Map knowledge types (factual, conceptual, procedural, metacognitive)',
        'Identify topics suitable for higher-order thinking',
        'Note topics requiring foundational knowledge first',
        'Create cognitive level roadmap',
        'Document mapping rationale',
        'Generate cognitive mapping document'
      ],
      outputFormat: 'JSON with mapping, knowledgeTypes, cognitiveRoadmap, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'artifacts'],
      properties: {
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              knowledgeType: { type: 'string' },
              suggestedLevels: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        knowledgeTypes: {
          type: 'object',
          properties: {
            factual: { type: 'array' },
            conceptual: { type: 'array' },
            procedural: { type: 'array' },
            metacognitive: { type: 'array' }
          }
        },
        cognitiveRoadmap: { type: 'object' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blooms', 'mapping', 'cognitive']
}));

// Task 2: Objective Writing
export const objectiveWritingTask = defineTask('objective-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write measurable learning objectives',
  agent: {
    name: 'objective-writer',
    prompt: {
      role: 'learning objectives specialist',
      task: 'Write measurable learning objectives using Bloom\'s taxonomy',
      context: args,
      instructions: [
        'Write objectives using ABCD format (Audience, Behavior, Condition, Degree)',
        'Use action verbs appropriate for each cognitive level',
        'Ensure objectives are measurable and observable',
        'Write objectives at multiple cognitive levels',
        'Include objectives for higher-order thinking',
        'Ensure objectives are student-centered',
        'Align objectives with content topics',
        'Verify objectives are achievable',
        'Generate learning objectives document'
      ],
      outputFormat: 'JSON with objectives, levelDistribution, verbsUsed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              text: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              actionVerb: { type: 'string' },
              topic: { type: 'string' },
              measurable: { type: 'boolean' }
            }
          }
        },
        levelDistribution: {
          type: 'object',
          properties: {
            remember: { type: 'number' },
            understand: { type: 'number' },
            apply: { type: 'number' },
            analyze: { type: 'number' },
            evaluate: { type: 'number' },
            create: { type: 'number' }
          }
        },
        verbsUsed: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blooms', 'objectives', 'writing']
}));

// Task 3: Verb Alignment
export const verbAlignmentTask = defineTask('verb-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align action verbs to cognitive levels',
  agent: {
    name: 'verb-aligner',
    prompt: {
      role: 'Bloom\'s taxonomy verb specialist',
      task: 'Verify and align action verbs to appropriate cognitive levels',
      context: args,
      instructions: [
        'Review verbs used in each objective',
        'Verify verb matches intended cognitive level',
        'Flag misaligned verbs',
        'Suggest alternative verbs where needed',
        'Provide verb bank by cognitive level',
        'Ensure variety in verb usage',
        'Check for vague or unmeasurable verbs',
        'Document verb-level alignment',
        'Generate verb alignment document'
      ],
      outputFormat: 'JSON with alignment, misalignments, suggestions, verbBank, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'verbBank', 'artifacts'],
      properties: {
        alignment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              verb: { type: 'string' },
              intendedLevel: { type: 'string' },
              actualLevel: { type: 'string' },
              aligned: { type: 'boolean' },
              suggestion: { type: 'string' }
            }
          }
        },
        misalignments: { type: 'array' },
        suggestions: { type: 'array' },
        verbBank: {
          type: 'object',
          properties: {
            remember: { type: 'array', items: { type: 'string' } },
            understand: { type: 'array', items: { type: 'string' } },
            apply: { type: 'array', items: { type: 'string' } },
            analyze: { type: 'array', items: { type: 'string' } },
            evaluate: { type: 'array', items: { type: 'string' } },
            create: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'blooms', 'verbs', 'alignment']
}));

// Task 4: Assessment Alignment
export const assessmentAlignmentTask = defineTask('assessment-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align assessments to cognitive levels',
  agent: {
    name: 'assessment-aligner',
    prompt: {
      role: 'assessment alignment specialist',
      task: 'Recommend assessment types aligned with cognitive levels',
      context: args,
      instructions: [
        'Match assessment types to cognitive levels',
        'Remember: recognition, recall tests',
        'Understand: explanation, summarization',
        'Apply: problem-solving, demonstrations',
        'Analyze: case studies, comparison tasks',
        'Evaluate: critiques, judgment tasks',
        'Create: projects, designs, compositions',
        'Ensure assessment-objective alignment',
        'Generate assessment alignment document'
      ],
      outputFormat: 'JSON with alignment, assessmentTypes, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'assessmentTypes', 'artifacts'],
      properties: {
        alignment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              assessmentTypes: { type: 'array', items: { type: 'string' } },
              specificAssessments: { type: 'array' }
            }
          }
        },
        assessmentTypes: {
          type: 'object',
          properties: {
            remember: { type: 'array' },
            understand: { type: 'array' },
            apply: { type: 'array' },
            analyze: { type: 'array' },
            evaluate: { type: 'array' },
            create: { type: 'array' }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blooms', 'assessment', 'alignment']
}));

// Task 5: Activity Alignment
export const activityAlignmentTask = defineTask('activity-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align learning activities to cognitive levels',
  agent: {
    name: 'activity-aligner',
    prompt: {
      role: 'learning activity specialist',
      task: 'Recommend learning activities aligned with cognitive levels',
      context: args,
      instructions: [
        'Match activity types to cognitive levels',
        'Remember: flashcards, memorization drills',
        'Understand: discussions, explanations',
        'Apply: practice problems, simulations',
        'Analyze: debates, investigations',
        'Evaluate: peer review, self-assessment',
        'Create: design projects, research',
        'Ensure activity-objective alignment',
        'Generate activity alignment document'
      ],
      outputFormat: 'JSON with alignment, activityTypes, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'activityTypes', 'artifacts'],
      properties: {
        alignment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              activityTypes: { type: 'array', items: { type: 'string' } },
              specificActivities: { type: 'array' }
            }
          }
        },
        activityTypes: {
          type: 'object',
          properties: {
            remember: { type: 'array' },
            understand: { type: 'array' },
            apply: { type: 'array' },
            analyze: { type: 'array' },
            evaluate: { type: 'array' },
            create: { type: 'array' }
          }
        },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blooms', 'activities', 'alignment']
}));

// Task 6: Cognitive Level Distribution
export const cognitiveLevelDistributionTask = defineTask('cognitive-level-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cognitive level distribution',
  agent: {
    name: 'distribution-analyst',
    prompt: {
      role: 'cognitive level analyst',
      task: 'Analyze and optimize cognitive level distribution',
      context: args,
      instructions: [
        'Calculate distribution of objectives by level',
        'Analyze assessment level distribution',
        'Analyze activity level distribution',
        'Compare to target distribution',
        'Identify over/underrepresented levels',
        'Recommend rebalancing if needed',
        'Create visual distribution analysis',
        'Document distribution rationale',
        'Generate distribution analysis document'
      ],
      outputFormat: 'JSON with distribution, comparison, recommendations, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['distribution', 'artifacts'],
      properties: {
        distribution: {
          type: 'object',
          properties: {
            objectives: { type: 'object' },
            assessments: { type: 'object' },
            activities: { type: 'object' }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            actual: { type: 'object' },
            target: { type: 'object' },
            difference: { type: 'object' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        visualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blooms', 'distribution', 'analysis']
}));

// Task 7: Quality Scoring
export const bloomsQualityScoringTask = defineTask('blooms-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score Bloom\'s taxonomy application quality',
  agent: {
    name: 'blooms-quality-auditor',
    prompt: {
      role: 'Bloom\'s taxonomy quality auditor',
      task: 'Assess Bloom\'s taxonomy application quality',
      context: args,
      instructions: [
        'Evaluate objective measurability (weight: 25%)',
        'Assess verb alignment accuracy (weight: 20%)',
        'Review assessment alignment (weight: 20%)',
        'Evaluate activity alignment (weight: 20%)',
        'Assess level distribution appropriateness (weight: 15%)',
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
            objectiveMeasurability: { type: 'number' },
            verbAlignment: { type: 'number' },
            assessmentAlignment: { type: 'number' },
            activityAlignment: { type: 'number' },
            levelDistribution: { type: 'number' }
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
  labels: ['agent', 'blooms', 'quality-scoring', 'validation']
}));
