/**
 * @process social-sciences/mixed-methods-research-design
 * @description Create integrated research designs combining quantitative and qualitative approaches using convergent, explanatory sequential, or exploratory sequential strategies
 * @inputs { researchQuestions: array, phenomenon: string, constraints: object, outputDir: string }
 * @outputs { success: boolean, mixedMethodsDesign: object, integrationPlan: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-010 (mixed-methods-integration), SK-SS-001 (quantitative-methods), SK-SS-002 (qualitative-analysis)
 * @recommendedAgents AG-SS-008 (mixed-methods-research-coordinator), AG-SS-001 (quantitative-research-methodologist), AG-SS-002 (qualitative-research-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestions = [],
    phenomenon,
    constraints = {},
    outputDir = 'mixed-methods-output',
    priorityStrand = 'equal'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Mixed Methods Research Design process');

  // ============================================================================
  // PHASE 1: PARADIGM AND PURPOSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing paradigm orientation and research purpose');
  const paradigmAnalysis = await ctx.task(paradigmAnalysisTask, {
    researchQuestions,
    phenomenon,
    outputDir
  });

  artifacts.push(...paradigmAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DESIGN TYPE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting mixed methods design type');
  const designSelection = await ctx.task(mixedMethodsDesignSelectionTask, {
    paradigmAnalysis,
    researchQuestions,
    constraints,
    priorityStrand,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // ============================================================================
  // PHASE 3: QUANTITATIVE STRAND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing quantitative strand');
  const quantitativeDesign = await ctx.task(quantitativeStrandDesignTask, {
    designSelection,
    researchQuestions,
    outputDir
  });

  artifacts.push(...quantitativeDesign.artifacts);

  // ============================================================================
  // PHASE 4: QUALITATIVE STRAND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing qualitative strand');
  const qualitativeDesign = await ctx.task(qualitativeStrandDesignTask, {
    designSelection,
    researchQuestions,
    outputDir
  });

  artifacts.push(...qualitativeDesign.artifacts);

  // ============================================================================
  // PHASE 5: INTEGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing integration strategy');
  const integrationStrategy = await ctx.task(integrationStrategyTask, {
    designSelection,
    quantitativeDesign,
    qualitativeDesign,
    outputDir
  });

  artifacts.push(...integrationStrategy.artifacts);

  // ============================================================================
  // PHASE 6: VALIDITY FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing validity framework');
  const validityFramework = await ctx.task(mixedMethodsValidityTask, {
    designSelection,
    quantitativeDesign,
    qualitativeDesign,
    integrationStrategy,
    outputDir
  });

  artifacts.push(...validityFramework.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring mixed methods design quality');
  const qualityScore = await ctx.task(mixedMethodsQualityScoringTask, {
    paradigmAnalysis,
    designSelection,
    quantitativeDesign,
    qualitativeDesign,
    integrationStrategy,
    validityFramework,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const designScore = qualityScore.overallScore;
  const qualityMet = designScore >= 80;

  // Breakpoint: Review mixed methods design
  await ctx.breakpoint({
    question: `Mixed methods design complete. Quality score: ${designScore}/100. ${qualityMet ? 'Design meets quality standards!' : 'Design may need refinement.'} Review and approve?`,
    title: 'Mixed Methods Research Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        designScore,
        qualityMet,
        designType: designSelection.designType,
        priorityStrand: designSelection.priorityStrand,
        integrationPoints: integrationStrategy.integrationPoints
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: designScore,
    qualityMet,
    mixedMethodsDesign: {
      designType: designSelection.designType,
      notation: designSelection.notation,
      priorityStrand: designSelection.priorityStrand,
      timing: designSelection.timing
    },
    quantitativeStrand: {
      design: quantitativeDesign.design,
      sampleSize: quantitativeDesign.sampleSize,
      measures: quantitativeDesign.measures
    },
    qualitativeStrand: {
      approach: qualitativeDesign.approach,
      sampleSize: qualitativeDesign.sampleSize,
      dataCollection: qualitativeDesign.dataCollection
    },
    integrationPlan: {
      integrationPoints: integrationStrategy.integrationPoints,
      integrationProcedures: integrationStrategy.procedures,
      jointDisplay: integrationStrategy.jointDisplay
    },
    validityFramework: validityFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/mixed-methods-research-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Paradigm Analysis
export const paradigmAnalysisTask = defineTask('paradigm-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze paradigm orientation and research purpose',
  agent: {
    name: 'mixed-methods-methodologist',
    prompt: {
      role: 'senior mixed methods research methodologist',
      task: 'Analyze paradigm orientation and determine mixed methods purpose',
      context: args,
      instructions: [
        'Identify philosophical worldview (pragmatism, transformative, etc.)',
        'Assess research purpose requiring mixed methods',
        'Determine if complementarity is needed (different facets)',
        'Determine if triangulation is needed (convergence/corroboration)',
        'Determine if development is needed (one informs the other)',
        'Determine if expansion is needed (extend breadth/range)',
        'Assess feasibility of mixed methods approach',
        'Document rationale for mixing methods',
        'Generate paradigm analysis report'
      ],
      outputFormat: 'JSON with paradigm, mixedMethodsPurpose, rationale, feasibility, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paradigm', 'mixedMethodsPurpose', 'artifacts'],
      properties: {
        paradigm: { type: 'string' },
        mixedMethodsPurpose: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              purpose: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        rationale: { type: 'string' },
        feasibility: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mixed-methods', 'paradigm-analysis']
}));

// Task 2: Design Type Selection
export const mixedMethodsDesignSelectionTask = defineTask('mm-design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select mixed methods design type',
  agent: {
    name: 'mm-design-specialist',
    prompt: {
      role: 'mixed methods design expert',
      task: 'Select appropriate mixed methods design type',
      context: args,
      instructions: [
        'Evaluate convergent parallel design suitability',
        'Evaluate explanatory sequential design suitability',
        'Evaluate exploratory sequential design suitability',
        'Evaluate embedded design suitability',
        'Evaluate transformative design suitability',
        'Evaluate multiphase design suitability',
        'Determine strand priority (QUAN, QUAL, or equal)',
        'Determine timing (concurrent vs sequential)',
        'Create design notation (e.g., QUAN + QUAL)',
        'Document design selection rationale'
      ],
      outputFormat: 'JSON with designType, notation, priorityStrand, timing, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designType', 'notation', 'priorityStrand', 'artifacts'],
      properties: {
        designType: { type: 'string' },
        notation: { type: 'string' },
        priorityStrand: { type: 'string' },
        timing: { type: 'string' },
        rationale: { type: 'string' },
        designDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mixed-methods', 'design-selection']
}));

// Task 3: Quantitative Strand Design
export const quantitativeStrandDesignTask = defineTask('quantitative-strand-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design quantitative strand',
  agent: {
    name: 'quantitative-designer',
    prompt: {
      role: 'quantitative research methodologist',
      task: 'Design the quantitative strand of the mixed methods study',
      context: args,
      instructions: [
        'Select quantitative research design (survey, experimental, etc.)',
        'Define quantitative research questions/hypotheses',
        'Design sampling strategy for quantitative strand',
        'Calculate required sample size',
        'Select/design quantitative measures and instruments',
        'Plan data collection procedures',
        'Specify statistical analysis approach',
        'Address validity and reliability concerns',
        'Generate quantitative strand protocol'
      ],
      outputFormat: 'JSON with design, researchQuestions, sampleSize, measures, analysisApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'sampleSize', 'measures', 'artifacts'],
      properties: {
        design: { type: 'string' },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        sampleSize: { type: 'number' },
        samplingStrategy: { type: 'string' },
        measures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              construct: { type: 'string' },
              instrument: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        analysisApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mixed-methods', 'quantitative-design']
}));

// Task 4: Qualitative Strand Design
export const qualitativeStrandDesignTask = defineTask('qualitative-strand-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design qualitative strand',
  agent: {
    name: 'qualitative-designer',
    prompt: {
      role: 'qualitative research methodologist',
      task: 'Design the qualitative strand of the mixed methods study',
      context: args,
      instructions: [
        'Select qualitative research approach (phenomenology, grounded theory, etc.)',
        'Define qualitative research questions',
        'Design purposeful sampling strategy',
        'Determine qualitative sample size for saturation',
        'Design qualitative data collection methods',
        'Plan interview/observation protocols',
        'Specify qualitative analysis approach',
        'Address trustworthiness criteria',
        'Generate qualitative strand protocol'
      ],
      outputFormat: 'JSON with approach, researchQuestions, sampleSize, dataCollection, analysisApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'sampleSize', 'dataCollection', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        sampleSize: { type: 'number' },
        samplingStrategy: { type: 'string' },
        dataCollection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        analysisApproach: { type: 'string' },
        trustworthinessCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mixed-methods', 'qualitative-design']
}));

// Task 5: Integration Strategy
export const integrationStrategyTask = defineTask('integration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop integration strategy',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'mixed methods integration expert',
      task: 'Develop comprehensive integration strategy for mixing strands',
      context: args,
      instructions: [
        'Identify integration points in the research process',
        'Plan integration at design level',
        'Plan integration at methods level (connecting/building)',
        'Plan integration at interpretation level',
        'Design joint display for presenting integrated findings',
        'Plan procedures for addressing convergent findings',
        'Plan procedures for addressing divergent findings',
        'Design meta-inferences framework',
        'Generate integration protocol document'
      ],
      outputFormat: 'JSON with integrationPoints, procedures, jointDisplay, metaInferences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'procedures', 'artifacts'],
      properties: {
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              level: { type: 'string' },
              procedure: { type: 'string' }
            }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            connecting: { type: 'string' },
            building: { type: 'string' },
            merging: { type: 'string' },
            embedding: { type: 'string' }
          }
        },
        jointDisplay: { type: 'object' },
        metaInferences: { type: 'string' },
        divergenceHandling: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mixed-methods', 'integration']
}));

// Task 6: Validity Framework
export const mixedMethodsValidityTask = defineTask('mm-validity-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop validity framework',
  agent: {
    name: 'mm-validity-specialist',
    prompt: {
      role: 'mixed methods validity expert',
      task: 'Develop comprehensive validity framework for mixed methods study',
      context: args,
      instructions: [
        'Address quantitative validity (internal, external, construct, statistical)',
        'Address qualitative trustworthiness (credibility, transferability, dependability, confirmability)',
        'Address mixed methods legitimation criteria',
        'Evaluate sample integration validity',
        'Evaluate inside-outside validity',
        'Evaluate weakness minimization validity',
        'Evaluate sequential validity (if applicable)',
        'Evaluate conversion validity (if applicable)',
        'Develop validation strategies for each concern',
        'Generate validity framework document'
      ],
      outputFormat: 'JSON with framework, quantitativeValidity, qualitativeTrustworthiness, mmLegitimation, strategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        quantitativeValidity: {
          type: 'object',
          properties: {
            internal: { type: 'string' },
            external: { type: 'string' },
            construct: { type: 'string' },
            statistical: { type: 'string' }
          }
        },
        qualitativeTrustworthiness: {
          type: 'object',
          properties: {
            credibility: { type: 'string' },
            transferability: { type: 'string' },
            dependability: { type: 'string' },
            confirmability: { type: 'string' }
          }
        },
        mmLegitimation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              strategy: { type: 'string' }
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
  labels: ['agent', 'mixed-methods', 'validity']
}));

// Task 7: Quality Scoring
export const mixedMethodsQualityScoringTask = defineTask('mm-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score mixed methods design quality',
  agent: {
    name: 'mm-quality-reviewer',
    prompt: {
      role: 'senior mixed methods reviewer',
      task: 'Assess overall mixed methods design quality',
      context: args,
      instructions: [
        'Evaluate paradigm/purpose justification (weight: 10%)',
        'Assess design type appropriateness (weight: 15%)',
        'Evaluate quantitative strand rigor (weight: 20%)',
        'Evaluate qualitative strand rigor (weight: 20%)',
        'Assess integration strategy quality (weight: 20%)',
        'Evaluate validity framework comprehensiveness (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify critical gaps and weaknesses',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            paradigmJustification: { type: 'number' },
            designAppropriateness: { type: 'number' },
            quantitativeRigor: { type: 'number' },
            qualitativeRigor: { type: 'number' },
            integrationQuality: { type: 'number' },
            validityFramework: { type: 'number' }
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
  labels: ['agent', 'mixed-methods', 'quality-scoring']
}));
