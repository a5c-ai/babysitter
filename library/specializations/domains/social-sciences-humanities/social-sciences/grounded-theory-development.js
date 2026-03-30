/**
 * @process social-sciences/grounded-theory-development
 * @description Build theory inductively from qualitative data through systematic coding, constant comparison, theoretical sampling, and memo writing until theoretical saturation
 * @inputs { dataPath: string, phenomenon: string, researchQuestions: array, outputDir: string }
 * @outputs { success: boolean, groundedTheory: object, theoreticalModel: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-002 (qualitative-analysis)
 * @recommendedAgents AG-SS-002 (qualitative-research-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    phenomenon,
    researchQuestions = [],
    outputDir = 'grounded-theory-output',
    gtApproach = 'constructivist'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Grounded Theory Development process');

  // ============================================================================
  // PHASE 1: INITIAL CODING
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting initial/open coding');
  const initialCoding = await ctx.task(gtInitialCodingTask, {
    dataPath,
    phenomenon,
    gtApproach,
    outputDir
  });

  artifacts.push(...initialCoding.artifacts);

  // ============================================================================
  // PHASE 2: FOCUSED CODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting focused coding');
  const focusedCoding = await ctx.task(focusedCodingTask, {
    initialCoding,
    phenomenon,
    outputDir
  });

  artifacts.push(...focusedCoding.artifacts);

  // ============================================================================
  // PHASE 3: THEORETICAL SAMPLING
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting theoretical sampling');
  const theoreticalSampling = await ctx.task(theoreticalSamplingTask, {
    focusedCoding,
    phenomenon,
    outputDir
  });

  artifacts.push(...theoreticalSampling.artifacts);

  // ============================================================================
  // PHASE 4: CATEGORY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing categories');
  const categoryDevelopment = await ctx.task(categoryDevelopmentTask, {
    focusedCoding,
    theoreticalSampling,
    outputDir
  });

  artifacts.push(...categoryDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: THEORETICAL SATURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing theoretical saturation');
  const saturationAssessment = await ctx.task(saturationAssessmentTask, {
    categoryDevelopment,
    theoreticalSampling,
    outputDir
  });

  artifacts.push(...saturationAssessment.artifacts);

  // ============================================================================
  // PHASE 6: THEORY INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating theory');
  const theoryIntegration = await ctx.task(theoryIntegrationTask, {
    categoryDevelopment,
    saturationAssessment,
    phenomenon,
    outputDir
  });

  artifacts.push(...theoryIntegration.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring grounded theory quality');
  const qualityScore = await ctx.task(gtQualityScoringTask, {
    initialCoding,
    focusedCoding,
    theoreticalSampling,
    categoryDevelopment,
    saturationAssessment,
    theoryIntegration,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const gtScore = qualityScore.overallScore;
  const qualityMet = gtScore >= 80;

  // Breakpoint: Review grounded theory
  await ctx.breakpoint({
    question: `Grounded theory development complete. Quality score: ${gtScore}/100. ${qualityMet ? 'Theory meets quality standards!' : 'Theory may need refinement.'} Review and approve?`,
    title: 'Grounded Theory Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        gtScore,
        qualityMet,
        coreCategory: theoryIntegration.coreCategory,
        totalCategories: categoryDevelopment.categories.length,
        saturationAchieved: saturationAssessment.achieved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: gtScore,
    qualityMet,
    groundedTheory: {
      coreCategory: theoryIntegration.coreCategory,
      categories: categoryDevelopment.categories,
      relationships: theoryIntegration.relationships,
      propositions: theoryIntegration.propositions
    },
    theoreticalModel: {
      diagram: theoryIntegration.modelDiagram,
      narrative: theoryIntegration.narrativeDescription
    },
    saturation: saturationAssessment.assessment,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/grounded-theory-development',
      timestamp: startTime,
      gtApproach,
      outputDir
    }
  };
}

// Task 1: Initial Coding
export const gtInitialCodingTask = defineTask('gt-initial-coding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct initial/open coding',
  agent: {
    name: 'gt-coder',
    prompt: {
      role: 'grounded theory methodologist',
      task: 'Conduct initial open coding of qualitative data',
      context: args,
      instructions: [
        'Code data line-by-line or incident-by-incident',
        'Use in vivo codes where appropriate',
        'Stay close to the data - avoid pre-existing concepts',
        'Code for processes, actions, and meanings',
        'Use gerunds (-ing words) for action-oriented codes',
        'Write initial memos about emerging ideas',
        'Identify initial patterns and variations',
        'Apply constant comparison while coding',
        'Generate initial coding report'
      ],
      outputFormat: 'JSON with codes, inVivoCodes, memos, emergingPatterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['codes', 'memos', 'artifacts'],
      properties: {
        codes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              type: { type: 'string' },
              frequency: { type: 'number' }
            }
          }
        },
        inVivoCodes: { type: 'array', items: { type: 'string' } },
        memos: { type: 'array' },
        emergingPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'initial-coding']
}));

// Task 2: Focused Coding
export const focusedCodingTask = defineTask('focused-coding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct focused coding',
  agent: {
    name: 'focused-coder',
    prompt: {
      role: 'grounded theory analyst',
      task: 'Conduct focused coding to synthesize initial codes',
      context: args,
      instructions: [
        'Identify most significant and frequent initial codes',
        'Use focused codes to sort and synthesize data',
        'Apply constant comparison to test and refine codes',
        'Develop subcategories within focused codes',
        'Write analytic memos exploring focused codes',
        'Identify gaps in understanding',
        'Note variations and exceptions',
        'Generate focused coding report'
      ],
      outputFormat: 'JSON with focusedCodes, subcategories, memos, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['focusedCodes', 'memos', 'artifacts'],
      properties: {
        focusedCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              definition: { type: 'string' },
              initialCodes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        subcategories: { type: 'object' },
        memos: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        variations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'focused-coding']
}));

// Task 3: Theoretical Sampling
export const theoreticalSamplingTask = defineTask('theoretical-sampling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct theoretical sampling',
  agent: {
    name: 'theoretical-sampler',
    prompt: {
      role: 'grounded theory methodologist',
      task: 'Conduct theoretical sampling to develop categories',
      context: args,
      instructions: [
        'Identify conceptual gaps requiring more data',
        'Determine what data to collect next based on analysis',
        'Sample for variation in emerging categories',
        'Seek negative cases to test emerging theory',
        'Document sampling decisions and rationale',
        'Continue sampling until categories saturated',
        'Track theoretical sampling iterations',
        'Generate theoretical sampling report'
      ],
      outputFormat: 'JSON with samplingDecisions, dataCollected, negativeCases, iterations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['samplingDecisions', 'artifacts'],
      properties: {
        samplingDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        dataCollected: { type: 'array' },
        negativeCases: { type: 'array' },
        iterations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'theoretical-sampling']
}));

// Task 4: Category Development
export const categoryDevelopmentTask = defineTask('category-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop categories',
  agent: {
    name: 'category-developer',
    prompt: {
      role: 'grounded theory analyst',
      task: 'Develop and refine theoretical categories',
      context: args,
      instructions: [
        'Raise focused codes to conceptual categories',
        'Define properties and dimensions of each category',
        'Establish relationships between categories',
        'Identify conditions, actions, and consequences',
        'Write theoretical memos for each category',
        'Develop visual diagrams showing relationships',
        'Refine categories through constant comparison',
        'Generate category development report'
      ],
      outputFormat: 'JSON with categories, properties, relationships, diagrams, memos, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'relationships', 'artifacts'],
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } },
              dimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: { type: 'array' },
        diagrams: { type: 'array', items: { type: 'string' } },
        memos: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'category-development']
}));

// Task 5: Saturation Assessment
export const saturationAssessmentTask = defineTask('saturation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess theoretical saturation',
  agent: {
    name: 'saturation-assessor',
    prompt: {
      role: 'grounded theory methodologist',
      task: 'Assess whether theoretical saturation has been achieved',
      context: args,
      instructions: [
        'Evaluate if new data adds to existing categories',
        'Assess whether categories are fully developed',
        'Check if relationships are well-established',
        'Evaluate if variations are accounted for',
        'Document evidence for saturation claims',
        'Identify any remaining gaps',
        'Make saturation determination',
        'Generate saturation assessment report'
      ],
      outputFormat: 'JSON with achieved, assessment, evidence, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['achieved', 'assessment', 'artifacts'],
      properties: {
        achieved: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            categorySaturation: { type: 'object' },
            relationshipSaturation: { type: 'boolean' },
            variationCoverage: { type: 'boolean' }
          }
        },
        evidence: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'saturation']
}));

// Task 6: Theory Integration
export const theoryIntegrationTask = defineTask('theory-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate theory',
  agent: {
    name: 'theory-integrator',
    prompt: {
      role: 'grounded theory theorist',
      task: 'Integrate categories into coherent grounded theory',
      context: args,
      instructions: [
        'Identify core category that ties other categories together',
        'Develop theoretical storyline',
        'Specify conditions, actions/interactions, consequences',
        'Formulate theoretical propositions',
        'Create theoretical model diagram',
        'Write narrative description of theory',
        'Situate theory in relation to existing literature',
        'Generate theory integration report'
      ],
      outputFormat: 'JSON with coreCategory, relationships, propositions, modelDiagram, narrativeDescription, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coreCategory', 'propositions', 'artifacts'],
      properties: {
        coreCategory: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            definition: { type: 'string' },
            centralProcess: { type: 'string' }
          }
        },
        relationships: { type: 'array' },
        propositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              supportingCategories: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        modelDiagram: { type: 'string' },
        narrativeDescription: { type: 'string' },
        literatureConnection: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'integration']
}));

// Task 7: Quality Scoring
export const gtQualityScoringTask = defineTask('gt-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score grounded theory quality',
  agent: {
    name: 'gt-quality-reviewer',
    prompt: {
      role: 'senior grounded theory methodologist',
      task: 'Assess grounded theory development quality',
      context: args,
      instructions: [
        'Evaluate initial coding rigor (weight: 15%)',
        'Assess focused coding quality (weight: 15%)',
        'Evaluate theoretical sampling appropriateness (weight: 15%)',
        'Assess category development depth (weight: 20%)',
        'Evaluate saturation evidence (weight: 15%)',
        'Assess theory integration coherence (weight: 20%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            initialCoding: { type: 'number' },
            focusedCoding: { type: 'number' },
            theoreticalSampling: { type: 'number' },
            categoryDevelopment: { type: 'number' },
            saturation: { type: 'number' },
            theoryIntegration: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'grounded-theory', 'quality-scoring']
}));
