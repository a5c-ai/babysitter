/**
 * @process education/backward-design
 * @description Curriculum design starting from desired learning outcomes, determining acceptable evidence, then planning learning experiences (Understanding by Design - UbD)
 * @inputs { courseName: string, desiredResults: array, transferGoals: array, standards: array, constraints: object }
 * @outputs { success: boolean, stage1Results: object, stage2Evidence: object, stage3Plan: object, artifacts: array }
 * @recommendedSkills SK-EDU-002 (learning-objectives-writing), SK-EDU-008 (standards-alignment-mapping), SK-EDU-003 (assessment-item-development)
 * @recommendedAgents AG-EDU-001 (instructional-design-lead), AG-EDU-002 (curriculum-development-specialist), AG-EDU-003 (assessment-design-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    desiredResults = [],
    transferGoals = [],
    standards = [],
    constraints = {},
    outputDir = 'backward-design-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Backward Design (UbD) Implementation for ${courseName}`);

  // ============================================================================
  // STAGE 1: IDENTIFY DESIRED RESULTS
  // ============================================================================

  ctx.log('info', 'Stage 1: Identifying desired results');
  const stage1Results = await ctx.task(desiredResultsTask, {
    courseName,
    desiredResults,
    transferGoals,
    standards,
    outputDir
  });

  artifacts.push(...stage1Results.artifacts);

  // ============================================================================
  // STAGE 2: DETERMINE ACCEPTABLE EVIDENCE
  // ============================================================================

  ctx.log('info', 'Stage 2: Determining acceptable evidence');
  const stage2Evidence = await ctx.task(acceptableEvidenceTask, {
    courseName,
    stage1Results: stage1Results.results,
    outputDir
  });

  artifacts.push(...stage2Evidence.artifacts);

  // ============================================================================
  // STAGE 3: PLAN LEARNING EXPERIENCES
  // ============================================================================

  ctx.log('info', 'Stage 3: Planning learning experiences');
  const stage3Plan = await ctx.task(learningExperiencesPlanTask, {
    courseName,
    stage1Results: stage1Results.results,
    stage2Evidence: stage2Evidence.evidence,
    constraints,
    outputDir
  });

  artifacts.push(...stage3Plan.artifacts);

  // ============================================================================
  // WHERETO ELEMENTS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing WHERETO instructional elements');
  const wheretoElements = await ctx.task(wheretoElementsTask, {
    courseName,
    stage1Results: stage1Results.results,
    stage2Evidence: stage2Evidence.evidence,
    stage3Plan: stage3Plan.plan,
    outputDir
  });

  artifacts.push(...wheretoElements.artifacts);

  // ============================================================================
  // UNIT DESIGN TEMPLATE
  // ============================================================================

  ctx.log('info', 'Creating comprehensive unit design template');
  const unitDesign = await ctx.task(unitDesignTemplateTask, {
    courseName,
    stage1Results: stage1Results.results,
    stage2Evidence: stage2Evidence.evidence,
    stage3Plan: stage3Plan.plan,
    wheretoElements: wheretoElements.elements,
    outputDir
  });

  artifacts.push(...unitDesign.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring backward design quality');
  const qualityScore = await ctx.task(backwardDesignQualityScoringTask, {
    courseName,
    stage1Results,
    stage2Evidence,
    stage3Plan,
    wheretoElements,
    unitDesign,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review backward design
  await ctx.breakpoint({
    question: `Backward design complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Backward Design (UbD) Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        totalUnderstandings: stage1Results.results?.understandings?.length || 0,
        totalAssessments: stage2Evidence.evidence?.performanceTasks?.length || 0,
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
    stage1Results: {
      transferGoals: stage1Results.results.transferGoals,
      understandings: stage1Results.results.understandings,
      essentialQuestions: stage1Results.results.essentialQuestions,
      knowledgeAndSkills: stage1Results.results.knowledgeAndSkills
    },
    stage2Evidence: {
      performanceTasks: stage2Evidence.evidence.performanceTasks,
      otherEvidence: stage2Evidence.evidence.otherEvidence,
      rubrics: stage2Evidence.evidence.rubrics
    },
    stage3Plan: {
      learningActivities: stage3Plan.plan.learningActivities,
      resources: stage3Plan.plan.resources,
      sequencing: stage3Plan.plan.sequencing
    },
    wheretoElements: wheretoElements.elements,
    unitDesign: unitDesign.template,
    artifacts,
    duration,
    metadata: {
      processId: 'education/backward-design',
      timestamp: startTime,
      courseName,
      outputDir
    }
  };
}

// Task 1: Identify Desired Results (Stage 1)
export const desiredResultsTask = defineTask('desired-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify desired results (Stage 1)',
  agent: {
    name: 'ubd-designer',
    prompt: {
      role: 'curriculum design specialist (Understanding by Design)',
      task: 'Identify desired results following UbD Stage 1 framework',
      context: args,
      instructions: [
        'Identify long-term transfer goals (what students will be able to do independently)',
        'Determine enduring understandings (big ideas students should retain)',
        'Craft essential questions (open-ended, thought-provoking, recurring)',
        'Identify knowledge students will acquire (facts, concepts, principles)',
        'Identify skills students will develop (processes, procedures, strategies)',
        'Align with relevant standards and competencies',
        'Prioritize content using UbD filters (worth being familiar with, important to know, enduring understanding)',
        'Ensure transfer goals reflect authentic real-world application',
        'Generate Stage 1 documentation'
      ],
      outputFormat: 'JSON with results (transferGoals, understandings, essentialQuestions, knowledgeAndSkills), standardsAlignment, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            transferGoals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  goal: { type: 'string' },
                  context: { type: 'string' },
                  realWorldApplication: { type: 'string' }
                }
              }
            },
            understandings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  understanding: { type: 'string' },
                  bigIdea: { type: 'string' },
                  misconceptions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            essentialQuestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  type: { type: 'string', enum: ['overarching', 'topical'] },
                  relatedUnderstanding: { type: 'string' }
                }
              }
            },
            knowledgeAndSkills: {
              type: 'object',
              properties: {
                knowledge: { type: 'array', items: { type: 'string' } },
                skills: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        standardsAlignment: { type: 'array' },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ubd', 'stage1', 'desired-results']
}));

// Task 2: Determine Acceptable Evidence (Stage 2)
export const acceptableEvidenceTask = defineTask('acceptable-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine acceptable evidence (Stage 2)',
  agent: {
    name: 'assessment-designer',
    prompt: {
      role: 'assessment design specialist (Understanding by Design)',
      task: 'Determine acceptable evidence following UbD Stage 2 framework',
      context: args,
      instructions: [
        'Design performance tasks using GRASPS format (Goal, Role, Audience, Situation, Product, Standards)',
        'Create authentic assessments aligned with transfer goals',
        'Develop rubrics for performance task evaluation',
        'Identify other evidence (quizzes, tests, observations, work samples)',
        'Plan self-assessment opportunities for students',
        'Ensure evidence addresses all desired results from Stage 1',
        'Design formative assessments to check for understanding',
        'Consider multiple forms of evidence for each understanding',
        'Generate Stage 2 documentation'
      ],
      outputFormat: 'JSON with evidence (performanceTasks, otherEvidence, rubrics, selfAssessment), alignmentMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence', 'artifacts'],
      properties: {
        evidence: {
          type: 'object',
          properties: {
            performanceTasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskName: { type: 'string' },
                  grasps: {
                    type: 'object',
                    properties: {
                      goal: { type: 'string' },
                      role: { type: 'string' },
                      audience: { type: 'string' },
                      situation: { type: 'string' },
                      product: { type: 'string' },
                      standards: { type: 'string' }
                    }
                  },
                  alignedUnderstandings: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            otherEvidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  purpose: { type: 'string' }
                }
              }
            },
            rubrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskName: { type: 'string' },
                  criteria: { type: 'array' },
                  levels: { type: 'array' }
                }
              }
            },
            selfAssessment: { type: 'array' }
          }
        },
        alignmentMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ubd', 'stage2', 'assessment']
}));

// Task 3: Plan Learning Experiences (Stage 3)
export const learningExperiencesPlanTask = defineTask('learning-experiences-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan learning experiences (Stage 3)',
  agent: {
    name: 'learning-experience-designer',
    prompt: {
      role: 'learning experience designer (Understanding by Design)',
      task: 'Plan learning experiences following UbD Stage 3 framework',
      context: args,
      instructions: [
        'Design learning activities that prepare students for performance tasks',
        'Sequence activities to build understanding progressively',
        'Include activities that address essential questions',
        'Plan opportunities for students to explore, explain, and apply',
        'Design differentiated learning experiences for diverse learners',
        'Identify necessary resources and materials',
        'Plan scaffolding and support strategies',
        'Include reflection and metacognition activities',
        'Ensure coherence between Stage 1, 2, and 3',
        'Generate Stage 3 documentation'
      ],
      outputFormat: 'JSON with plan (learningActivities, resources, sequencing, differentiation), scaffolding, coherenceCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            learningActivities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity: { type: 'string' },
                  purpose: { type: 'string' },
                  duration: { type: 'string' },
                  materials: { type: 'array', items: { type: 'string' } },
                  alignedGoals: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            resources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resource: { type: 'string' },
                  type: { type: 'string' },
                  purpose: { type: 'string' }
                }
              }
            },
            sequencing: {
              type: 'object',
              properties: {
                phases: { type: 'array' },
                rationale: { type: 'string' }
              }
            },
            differentiation: { type: 'object' }
          }
        },
        scaffolding: { type: 'array' },
        coherenceCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ubd', 'stage3', 'learning-experiences']
}));

// Task 4: WHERETO Elements Development
export const wheretoElementsTask = defineTask('whereto-elements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop WHERETO instructional elements',
  agent: {
    name: 'whereto-designer',
    prompt: {
      role: 'UbD instructional designer',
      task: 'Develop WHERETO instructional elements for effective unit design',
      context: args,
      instructions: [
        'W - Where/Why: How will you help students know where they are going and why?',
        'H - Hook/Hold: How will you hook and hold student interest?',
        'E - Equip/Experience/Explore: How will you equip students and help them explore?',
        'R - Rethink/Reflect/Revise: How will you help students rethink and revise?',
        'E - Evaluate: How will students self-evaluate and reflect?',
        'T - Tailor: How will you tailor learning for diverse needs?',
        'O - Organize: How will you organize the learning for maximum engagement?',
        'Ensure all WHERETO elements are addressed in learning plan',
        'Generate WHERETO elements documentation'
      ],
      outputFormat: 'JSON with elements (W, H, E1, R, E2, T, O), implementation strategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['elements', 'artifacts'],
      properties: {
        elements: {
          type: 'object',
          properties: {
            W: {
              type: 'object',
              properties: {
                strategies: { type: 'array', items: { type: 'string' } },
                activities: { type: 'array', items: { type: 'string' } }
              }
            },
            H: {
              type: 'object',
              properties: {
                hooks: { type: 'array', items: { type: 'string' } },
                sustainingStrategies: { type: 'array', items: { type: 'string' } }
              }
            },
            E1: {
              type: 'object',
              properties: {
                equipStrategies: { type: 'array', items: { type: 'string' } },
                experiences: { type: 'array', items: { type: 'string' } },
                explorations: { type: 'array', items: { type: 'string' } }
              }
            },
            R: {
              type: 'object',
              properties: {
                rethinkActivities: { type: 'array', items: { type: 'string' } },
                reflectionPrompts: { type: 'array', items: { type: 'string' } },
                revisionOpportunities: { type: 'array', items: { type: 'string' } }
              }
            },
            E2: {
              type: 'object',
              properties: {
                selfEvaluationTools: { type: 'array', items: { type: 'string' } },
                reflectionActivities: { type: 'array', items: { type: 'string' } }
              }
            },
            T: {
              type: 'object',
              properties: {
                differentiationStrategies: { type: 'array', items: { type: 'string' } },
                accommodations: { type: 'array', items: { type: 'string' } }
              }
            },
            O: {
              type: 'object',
              properties: {
                organizationalStructure: { type: 'string' },
                engagementFlow: { type: 'string' }
              }
            }
          }
        },
        implementationStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ubd', 'whereto', 'instruction']
}));

// Task 5: Unit Design Template
export const unitDesignTemplateTask = defineTask('unit-design-template', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive unit design template',
  agent: {
    name: 'unit-designer',
    prompt: {
      role: 'curriculum unit designer',
      task: 'Create comprehensive unit design template integrating all UbD elements',
      context: args,
      instructions: [
        'Compile all Stage 1, 2, and 3 elements into coherent unit',
        'Create unit overview with essential information',
        'Develop detailed lesson plans for each session',
        'Include pacing guide and timeline',
        'Document resource requirements',
        'Create teacher guide with facilitation notes',
        'Include student materials list',
        'Add assessment schedule and checkpoints',
        'Generate comprehensive unit design document'
      ],
      outputFormat: 'JSON with template (overview, lessons, pacing, resources, teacherGuide), completenessScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'artifacts'],
      properties: {
        template: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                unitTitle: { type: 'string' },
                gradeLevel: { type: 'string' },
                subject: { type: 'string' },
                duration: { type: 'string' },
                summary: { type: 'string' }
              }
            },
            lessons: { type: 'array' },
            pacing: { type: 'object' },
            resources: { type: 'array' },
            teacherGuide: { type: 'object' },
            studentMaterials: { type: 'array' },
            assessmentSchedule: { type: 'array' }
          }
        },
        completenessScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ubd', 'unit-design', 'template']
}));

// Task 6: Backward Design Quality Scoring
export const backwardDesignQualityScoringTask = defineTask('backward-design-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score backward design quality',
  agent: {
    name: 'ubd-quality-auditor',
    prompt: {
      role: 'curriculum quality auditor (Understanding by Design)',
      task: 'Assess overall backward design quality and completeness',
      context: args,
      instructions: [
        'Evaluate Stage 1 clarity and transfer focus (weight: 25%)',
        'Assess Stage 2 assessment alignment and authenticity (weight: 25%)',
        'Review Stage 3 learning experience coherence (weight: 20%)',
        'Evaluate WHERETO elements completeness (weight: 15%)',
        'Assess overall unit design quality (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Check for alignment between all three stages',
        'Identify gaps and improvement areas',
        'Validate against UbD best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, alignmentCheck, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            stage1: { type: 'number' },
            stage2: { type: 'number' },
            stage3: { type: 'number' },
            whereto: { type: 'number' },
            unitDesign: { type: 'number' }
          }
        },
        alignmentCheck: {
          type: 'object',
          properties: {
            stage1to2: { type: 'boolean' },
            stage2to3: { type: 'boolean' },
            overallCoherence: { type: 'boolean' }
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
  labels: ['agent', 'ubd', 'quality-scoring', 'validation']
}));
