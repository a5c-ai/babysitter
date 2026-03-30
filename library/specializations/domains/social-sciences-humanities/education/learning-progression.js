/**
 * @process education/learning-progression
 * @description Creating coherent sequences of learning experiences that build upon prior knowledge across grade levels using research-based progressions
 * @inputs { domain: string, gradeSpan: object, standards: array, research: array, context: object }
 * @outputs { success: boolean, progression: object, milestones: array, assessmentPoints: array, artifacts: array }
 * @recommendedSkills SK-EDU-008 (standards-alignment-mapping), SK-EDU-002 (learning-objectives-writing), SK-EDU-015 (curriculum-gap-analysis)
 * @recommendedAgents AG-EDU-002 (curriculum-development-specialist), AG-EDU-003 (assessment-design-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain = '',
    gradeSpan = { start: 'K', end: '12' },
    standards = [],
    research = [],
    context = {},
    outputDir = 'learning-progression-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Learning Progression Development for ${domain}`);

  // ============================================================================
  // RESEARCH SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Synthesizing research on learning progressions');
  const researchSynthesis = await ctx.task(researchSynthesisTask, {
    domain,
    research,
    gradeSpan,
    outputDir
  });

  artifacts.push(...researchSynthesis.artifacts);

  // ============================================================================
  // ANCHOR CONCEPTS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Identifying anchor concepts and big ideas');
  const anchorConcepts = await ctx.task(anchorConceptsTask, {
    domain,
    standards,
    researchSynthesis: researchSynthesis.findings,
    outputDir
  });

  artifacts.push(...anchorConcepts.artifacts);

  // ============================================================================
  // PROGRESSION LEVELS DEFINITION
  // ============================================================================

  ctx.log('info', 'Defining progression levels');
  const progressionLevels = await ctx.task(progressionLevelsTask, {
    domain,
    anchorConcepts: anchorConcepts.concepts,
    gradeSpan,
    standards,
    outputDir
  });

  artifacts.push(...progressionLevels.artifacts);

  // ============================================================================
  // LEARNING TRAJECTORY MAPPING
  // ============================================================================

  ctx.log('info', 'Mapping learning trajectories');
  const learningTrajectories = await ctx.task(learningTrajectoriesTask, {
    domain,
    progressionLevels: progressionLevels.levels,
    anchorConcepts: anchorConcepts.concepts,
    outputDir
  });

  artifacts.push(...learningTrajectories.artifacts);

  // ============================================================================
  // MILESTONE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing learning milestones');
  const milestones = await ctx.task(milestoneDevelopmentTask, {
    domain,
    progressionLevels: progressionLevels.levels,
    learningTrajectories: learningTrajectories.trajectories,
    gradeSpan,
    outputDir
  });

  artifacts.push(...milestones.artifacts);

  // ============================================================================
  // ASSESSMENT ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Aligning assessments to progression');
  const assessmentAlignment = await ctx.task(progressionAssessmentTask, {
    domain,
    milestones: milestones.milestones,
    progressionLevels: progressionLevels.levels,
    outputDir
  });

  artifacts.push(...assessmentAlignment.artifacts);

  // ============================================================================
  // INSTRUCTIONAL GUIDANCE
  // ============================================================================

  ctx.log('info', 'Developing instructional guidance');
  const instructionalGuidance = await ctx.task(instructionalGuidanceTask, {
    domain,
    progressionLevels: progressionLevels.levels,
    learningTrajectories: learningTrajectories.trajectories,
    milestones: milestones.milestones,
    context,
    outputDir
  });

  artifacts.push(...instructionalGuidance.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring learning progression quality');
  const qualityScore = await ctx.task(progressionQualityScoringTask, {
    domain,
    researchSynthesis,
    anchorConcepts,
    progressionLevels,
    learningTrajectories,
    milestones,
    assessmentAlignment,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review progression
  await ctx.breakpoint({
    question: `Learning progression complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Learning Progression Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        domain,
        gradeSpan,
        totalLevels: progressionLevels.levels?.length || 0,
        totalMilestones: milestones.milestones?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    domain,
    gradeSpan,
    qualityScore: overallScore,
    qualityMet,
    progression: {
      anchorConcepts: anchorConcepts.concepts,
      levels: progressionLevels.levels,
      trajectories: learningTrajectories.trajectories
    },
    milestones: milestones.milestones,
    assessmentPoints: assessmentAlignment.assessmentPoints,
    instructionalGuidance: instructionalGuidance.guidance,
    artifacts,
    duration,
    metadata: {
      processId: 'education/learning-progression',
      timestamp: startTime,
      domain,
      gradeSpan,
      outputDir
    }
  };
}

// Task 1: Research Synthesis
export const researchSynthesisTask = defineTask('research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize research on learning progressions',
  agent: {
    name: 'research-synthesizer',
    prompt: {
      role: 'educational research specialist',
      task: 'Synthesize research findings on learning progressions for the domain',
      context: args,
      instructions: [
        'Review research on how students learn this domain',
        'Identify common misconceptions and learning difficulties',
        'Document developmental considerations by age',
        'Summarize key findings on effective sequencing',
        'Identify research-validated progression models',
        'Note cultural and contextual considerations',
        'Document gaps in research knowledge',
        'Create research summary document',
        'Generate research synthesis report'
      ],
      outputFormat: 'JSON with findings, misconceptions, developmentalFactors, progressionModels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'misconceptions', 'artifacts'],
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              source: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        misconceptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              misconception: { type: 'string' },
              prevalence: { type: 'string' },
              intervention: { type: 'string' }
            }
          }
        },
        developmentalFactors: { type: 'array' },
        progressionModels: { type: 'array' },
        researchGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'research', 'synthesis']
}));

// Task 2: Anchor Concepts
export const anchorConceptsTask = defineTask('anchor-concepts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify anchor concepts and big ideas',
  agent: {
    name: 'concept-analyst',
    prompt: {
      role: 'curriculum concept specialist',
      task: 'Identify anchor concepts that form the foundation of the progression',
      context: args,
      instructions: [
        'Identify the core concepts that anchor the domain',
        'Determine big ideas that span grade levels',
        'Map concept relationships and dependencies',
        'Identify threshold concepts (transformative understanding)',
        'Document concept definitions at various levels',
        'Note crosscutting concepts from other domains',
        'Create concept map visualization',
        'Prioritize concepts by foundational importance',
        'Generate anchor concepts document'
      ],
      outputFormat: 'JSON with concepts, bigIdeas, relationships, thresholdConcepts, conceptMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'bigIdeas', 'artifacts'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              definition: { type: 'string' },
              importance: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        bigIdeas: { type: 'array', items: { type: 'string' } },
        relationships: { type: 'array' },
        thresholdConcepts: { type: 'array' },
        conceptMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'concepts', 'big-ideas']
}));

// Task 3: Progression Levels
export const progressionLevelsTask = defineTask('progression-levels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define progression levels',
  agent: {
    name: 'progression-designer',
    prompt: {
      role: 'learning progression specialist',
      task: 'Define distinct levels of understanding in the progression',
      context: args,
      instructions: [
        'Define progression levels (naive to expert)',
        'Describe understanding at each level',
        'Map levels to approximate grade ranges',
        'Identify transition indicators between levels',
        'Document typical student thinking at each level',
        'Note key achievements that mark level attainment',
        'Create level descriptions for teachers',
        'Design level-appropriate language',
        'Generate progression levels document'
      ],
      outputFormat: 'JSON with levels, transitions, gradeMapping, levelDescriptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'transitions', 'artifacts'],
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              levelId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              gradeRange: { type: 'string' },
              keyCharacteristics: { type: 'array', items: { type: 'string' } },
              typicalThinking: { type: 'string' }
            }
          }
        },
        transitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } },
              challenges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gradeMapping: { type: 'object' },
        levelDescriptions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'levels', 'design']
}));

// Task 4: Learning Trajectories
export const learningTrajectoriesTask = defineTask('learning-trajectories', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map learning trajectories',
  agent: {
    name: 'trajectory-mapper',
    prompt: {
      role: 'learning trajectory specialist',
      task: 'Map detailed learning trajectories through progression levels',
      context: args,
      instructions: [
        'Map trajectories for each anchor concept',
        'Document stepping stones between levels',
        'Identify multiple pathways where appropriate',
        'Note critical junctures in learning',
        'Document prerequisite relationships',
        'Identify potential learning detours',
        'Create trajectory visualizations',
        'Map trajectories to instructional activities',
        'Generate learning trajectories document'
      ],
      outputFormat: 'JSON with trajectories, steppingStones, pathways, criticalJunctures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trajectories', 'steppingStones', 'artifacts'],
      properties: {
        trajectories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              pathway: { type: 'array' },
              alternativePathways: { type: 'array' }
            }
          }
        },
        steppingStones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stone: { type: 'string' },
              description: { type: 'string' },
              prerequisites: { type: 'array' },
              enables: { type: 'array' }
            }
          }
        },
        pathways: { type: 'array' },
        criticalJunctures: { type: 'array' },
        trajectoryVisualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'trajectories', 'pathways']
}));

// Task 5: Milestone Development
export const milestoneDevelopmentTask = defineTask('milestone-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop learning milestones',
  agent: {
    name: 'milestone-developer',
    prompt: {
      role: 'curriculum milestone specialist',
      task: 'Develop observable milestones for the learning progression',
      context: args,
      instructions: [
        'Define observable milestones at each grade level',
        'Write student-friendly milestone descriptions',
        'Create milestone indicators for teachers',
        'Align milestones with standards',
        'Develop milestone assessment criteria',
        'Note common milestone achievement variations',
        'Create milestone tracking tools',
        'Document milestone celebration strategies',
        'Generate milestones document'
      ],
      outputFormat: 'JSON with milestones, indicators, assessmentCriteria, trackingTools, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'indicators', 'artifacts'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              gradeLevel: { type: 'string' },
              description: { type: 'string' },
              studentFriendly: { type: 'string' },
              standardAlignment: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        indicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assessmentCriteria: { type: 'array' },
        trackingTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'milestones', 'development']
}));

// Task 6: Assessment Alignment
export const progressionAssessmentTask = defineTask('progression-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align assessments to progression',
  agent: {
    name: 'assessment-aligner',
    prompt: {
      role: 'progression assessment specialist',
      task: 'Develop assessments aligned to the learning progression',
      context: args,
      instructions: [
        'Design diagnostic assessments for level placement',
        'Create formative assessments for progress monitoring',
        'Develop milestone achievement assessments',
        'Design progression-based rubrics',
        'Create assessment item banks by level',
        'Plan portfolio evidence collection',
        'Develop self-assessment tools for students',
        'Create assessment administration guidance',
        'Generate assessment alignment document'
      ],
      outputFormat: 'JSON with assessmentPoints, diagnosticAssessments, formativeAssessments, rubrics, itemBanks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessmentPoints', 'diagnosticAssessments', 'artifacts'],
      properties: {
        assessmentPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              level: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        diagnosticAssessments: { type: 'array' },
        formativeAssessments: { type: 'array' },
        rubrics: { type: 'array' },
        itemBanks: { type: 'object' },
        selfAssessmentTools: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'assessment', 'alignment']
}));

// Task 7: Instructional Guidance
export const instructionalGuidanceTask = defineTask('instructional-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop instructional guidance',
  agent: {
    name: 'instructional-guide',
    prompt: {
      role: 'instructional specialist',
      task: 'Develop instructional guidance for implementing the progression',
      context: args,
      instructions: [
        'Create instructional strategies for each level',
        'Develop scaffolding recommendations',
        'Suggest differentiation strategies',
        'Provide intervention guidance for struggling learners',
        'Create enrichment suggestions for advanced learners',
        'Document effective teaching practices',
        'Suggest materials and resources by level',
        'Create teacher professional development outline',
        'Generate instructional guidance document'
      ],
      outputFormat: 'JSON with guidance, strategies, differentiation, interventions, enrichment, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidance', 'strategies', 'artifacts'],
      properties: {
        guidance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              strategies: { type: 'array', items: { type: 'string' } },
              keyActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        strategies: { type: 'array' },
        differentiation: {
          type: 'object',
          properties: {
            content: { type: 'array' },
            process: { type: 'array' },
            product: { type: 'array' }
          }
        },
        interventions: { type: 'array' },
        enrichment: { type: 'array' },
        resources: { type: 'array' },
        professionalDevelopment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-progression', 'instruction', 'guidance']
}));

// Task 8: Quality Scoring
export const progressionQualityScoringTask = defineTask('progression-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score learning progression quality',
  agent: {
    name: 'progression-quality-auditor',
    prompt: {
      role: 'learning progression quality auditor',
      task: 'Assess learning progression quality and completeness',
      context: args,
      instructions: [
        'Evaluate research basis (weight: 15%)',
        'Assess concept identification clarity (weight: 20%)',
        'Review progression level coherence (weight: 20%)',
        'Evaluate trajectory mapping quality (weight: 20%)',
        'Assess milestone specificity (weight: 15%)',
        'Evaluate assessment alignment (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify progression quality issues',
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
            researchBasis: { type: 'number' },
            conceptClarity: { type: 'number' },
            levelCoherence: { type: 'number' },
            trajectoryMapping: { type: 'number' },
            milestoneSpecificity: { type: 'number' },
            assessmentAlignment: { type: 'number' }
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
  labels: ['agent', 'learning-progression', 'quality-scoring', 'validation']
}));
