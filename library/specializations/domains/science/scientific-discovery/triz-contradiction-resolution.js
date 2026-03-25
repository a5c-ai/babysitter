/**
 * @process domains/science/scientific-discovery/triz-contradiction-resolution
 * @description Apply TRIZ inventive principles and contradiction matrix - Guides practitioners through
 * TRIZ (Theory of Inventive Problem Solving) methodology to identify and resolve technical and physical
 * contradictions using the 40 inventive principles and contradiction matrix.
 * @inputs { problem: string, improvingParameter: string, worseningParameter: string, context: object }
 * @outputs { success: boolean, contradictions: object, principles: array, concepts: array, evaluation: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/triz-contradiction-resolution', {
 *   problem: 'Increase aircraft wing strength without adding weight',
 *   improvingParameter: 'strength',
 *   worseningParameter: 'weight',
 *   context: { domain: 'aerospace', constraints: ['cost', 'manufacturability'] }
 * });
 *
 * @references
 * - Altshuller, G.S. (1984). Creativity as an Exact Science
 * - Savransky, S.D. (2000). Engineering of Creativity
 * - Mann, D. (2001). Hands-On Systematic Innovation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    improvingParameter,
    worseningParameter,
    context = {},
    outputDir = 'triz-output',
    minimumConceptScore = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TRIZ Analysis for: ${problem}`);

  // ============================================================================
  // PHASE 1: PROBLEM REFORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Reformulating problem in TRIZ terms');
  const problemReformulation = await ctx.task(problemReformulationTask, {
    problem,
    context,
    outputDir
  });

  artifacts.push(...problemReformulation.artifacts);

  // ============================================================================
  // PHASE 2: CONTRADICTION IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying contradictions');
  const contradictionIdentification = await ctx.task(contradictionIdentificationTask, {
    problem: problemReformulation.reformulatedProblem,
    improvingParameter,
    worseningParameter,
    context,
    outputDir
  });

  artifacts.push(...contradictionIdentification.artifacts);

  // ============================================================================
  // PHASE 3: PARAMETER MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping to TRIZ 39 parameters');
  const parameterMapping = await ctx.task(parameterMappingTask, {
    contradictions: contradictionIdentification.contradictions,
    improvingParameter,
    worseningParameter,
    context,
    outputDir
  });

  artifacts.push(...parameterMapping.artifacts);

  // Breakpoint: Review contradiction mapping
  await ctx.breakpoint({
    question: `Contradictions mapped: Improving "${parameterMapping.mappedImprovingParameter}" vs Worsening "${parameterMapping.mappedWorseningParameter}". Review mapping?`,
    title: 'TRIZ Parameter Mapping Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problem: problemReformulation.reformulatedProblem,
        improvingParameter: parameterMapping.mappedImprovingParameter,
        worseningParameter: parameterMapping.mappedWorseningParameter,
        contradictionType: contradictionIdentification.contradictionType
      }
    }
  });

  // ============================================================================
  // PHASE 4: MATRIX LOOKUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Looking up contradiction matrix');
  const matrixLookup = await ctx.task(matrixLookupTask, {
    mappedImprovingParameter: parameterMapping.mappedImprovingParameter,
    mappedWorseningParameter: parameterMapping.mappedWorseningParameter,
    outputDir
  });

  artifacts.push(...matrixLookup.artifacts);

  // ============================================================================
  // PHASE 5: PRINCIPLE APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Applying inventive principles');
  const principleApplication = await ctx.task(principleApplicationTask, {
    problem: problemReformulation.reformulatedProblem,
    suggestedPrinciples: matrixLookup.suggestedPrinciples,
    context,
    outputDir
  });

  artifacts.push(...principleApplication.artifacts);

  // ============================================================================
  // PHASE 6: PHYSICAL CONTRADICTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing physical contradictions');
  const physicalContradictionAnalysis = await ctx.task(physicalContradictionAnalysisTask, {
    problem: problemReformulation.reformulatedProblem,
    contradictions: contradictionIdentification.contradictions,
    context,
    outputDir
  });

  artifacts.push(...physicalContradictionAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: CONCEPT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating solution concepts');
  const conceptGeneration = await ctx.task(conceptGenerationTask, {
    problem: problemReformulation.reformulatedProblem,
    principleApplications: principleApplication.applications,
    physicalContradictionSolutions: physicalContradictionAnalysis.solutions,
    context,
    outputDir
  });

  artifacts.push(...conceptGeneration.artifacts);

  // ============================================================================
  // PHASE 8: CONCEPT EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Evaluating concepts');
  const conceptEvaluation = await ctx.task(conceptEvaluationTask, {
    concepts: conceptGeneration.concepts,
    context,
    minimumConceptScore,
    outputDir
  });

  artifacts.push(...conceptEvaluation.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Scoring analysis quality');
  const qualityScore = await ctx.task(trizQualityScoringTask, {
    problemReformulation,
    contradictionIdentification,
    parameterMapping,
    principleApplication,
    conceptGeneration,
    conceptEvaluation,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `TRIZ analysis complete. ${conceptGeneration.concepts?.length || 0} concepts generated, ${conceptEvaluation.viableConcepts?.length || 0} viable. Quality score: ${qualityScore.overallScore}/100. Approve?`,
    title: 'TRIZ Analysis Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problem: problemReformulation.reformulatedProblem,
        conceptsGenerated: conceptGeneration.concepts?.length || 0,
        viableConcepts: conceptEvaluation.viableConcepts?.length || 0,
        topConceptScore: conceptEvaluation.topConceptScore || 0,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problem: problemReformulation.reformulatedProblem,
    contradictions: {
      type: contradictionIdentification.contradictionType,
      technical: contradictionIdentification.technicalContradiction,
      physical: contradictionIdentification.physicalContradiction
    },
    principles: {
      suggested: matrixLookup.suggestedPrinciples,
      applied: principleApplication.applications
    },
    concepts: conceptGeneration.concepts,
    evaluation: {
      viableConcepts: conceptEvaluation.viableConcepts,
      topConcept: conceptEvaluation.topConcept,
      rankings: conceptEvaluation.rankings
    },
    qualityScore: {
      overall: qualityScore.overallScore,
      creativityScore: qualityScore.creativityScore,
      rigorScore: qualityScore.rigorScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/triz-contradiction-resolution',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemReformulationTask = defineTask('problem-reformulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reformulate problem in TRIZ terms',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'hypothesis-generator'],
    prompt: {
      role: 'TRIZ methodology expert',
      task: 'Reformulate the problem using TRIZ problem formulation techniques',
      context: args,
      instructions: [
        'Identify the system and its components',
        'Identify the primary useful function',
        'Identify harmful functions and undesired effects',
        'Define the Ideal Final Result (IFR)',
        'Identify available resources (substance, field, space, time)',
        'Formulate the mini-problem',
        'Identify the zone of conflict',
        'Define operational time and space',
        'Identify constraints and requirements',
        'Create problem model'
      ],
      outputFormat: 'JSON with reformulatedProblem, systemComponents, primaryFunction, harmfulFunctions, idealFinalResult, resources, miniProblem, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reformulatedProblem', 'idealFinalResult', 'artifacts'],
      properties: {
        reformulatedProblem: { type: 'string' },
        systemComponents: { type: 'array', items: { type: 'string' } },
        primaryFunction: { type: 'string' },
        harmfulFunctions: { type: 'array', items: { type: 'string' } },
        idealFinalResult: { type: 'string' },
        resources: {
          type: 'object',
          properties: {
            substance: { type: 'array', items: { type: 'string' } },
            field: { type: 'array', items: { type: 'string' } },
            space: { type: 'array', items: { type: 'string' } },
            time: { type: 'array', items: { type: 'string' } }
          }
        },
        miniProblem: { type: 'string' },
        zoneOfConflict: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'problem-reformulation']
}));

export const contradictionIdentificationTask = defineTask('contradiction-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify contradictions',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'causal-inference-engine'],
    prompt: {
      role: 'TRIZ contradiction analyst',
      task: 'Identify technical and physical contradictions in the problem',
      context: args,
      instructions: [
        'Identify technical contradiction (improving A worsens B)',
        'Formulate as: IF [action] THEN [benefit] BUT [harm]',
        'Identify physical contradiction (property must be X and not-X)',
        'Formulate as: Element must be [property] to [benefit] AND must be [opposite] to [other benefit]',
        'Consider multiple contradiction formulations',
        'Identify the most fundamental contradiction',
        'Rank contradictions by importance',
        'Document contradiction in standard TRIZ format',
        'Identify administrative contradictions if present',
        'Create contradiction hierarchy'
      ],
      outputFormat: 'JSON with contradictionType, technicalContradiction, physicalContradiction, contradictionFormulations, fundamentalContradiction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contradictionType', 'technicalContradiction', 'artifacts'],
      properties: {
        contradictionType: { type: 'string', enum: ['technical', 'physical', 'both'] },
        technicalContradiction: {
          type: 'object',
          properties: {
            improving: { type: 'string' },
            worsening: { type: 'string' },
            statement: { type: 'string' }
          }
        },
        physicalContradiction: {
          type: 'object',
          properties: {
            element: { type: 'string' },
            property: { type: 'string' },
            oppositeProperty: { type: 'string' },
            statement: { type: 'string' }
          }
        },
        contradictions: { type: 'array' },
        fundamentalContradiction: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'contradiction-identification']
}));

export const parameterMappingTask = defineTask('parameter-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map to TRIZ 39 parameters',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver'],
    prompt: {
      role: 'TRIZ parameter mapping specialist',
      task: 'Map problem parameters to TRIZ 39 engineering parameters',
      context: args,
      instructions: [
        'Review the 39 TRIZ engineering parameters',
        'Map improving parameter to closest TRIZ parameter',
        'Map worsening parameter to closest TRIZ parameter',
        'Consider multiple mappings if applicable',
        'Document rationale for mapping choices',
        'List relevant TRIZ parameters: Weight (1), Length (2), Area (3), Volume (4), Speed (5), Force (6), Stress (7), Stability (8), etc.',
        'Consider abstract vs concrete interpretations',
        'Note any parameters not well-represented',
        'Create mapping justification',
        'Rank mapping confidence'
      ],
      outputFormat: 'JSON with mappedImprovingParameter, mappedWorseningParameter, improvingParameterNumber, worseningParameterNumber, alternativeMappings, mappingRationale, confidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mappedImprovingParameter', 'mappedWorseningParameter', 'artifacts'],
      properties: {
        mappedImprovingParameter: { type: 'string' },
        mappedWorseningParameter: { type: 'string' },
        improvingParameterNumber: { type: 'number' },
        worseningParameterNumber: { type: 'number' },
        alternativeMappings: { type: 'array' },
        mappingRationale: { type: 'string' },
        confidence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'parameter-mapping']
}));

export const matrixLookupTask = defineTask('matrix-lookup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Look up contradiction matrix',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver'],
    prompt: {
      role: 'TRIZ matrix specialist',
      task: 'Look up the contradiction matrix to find suggested inventive principles',
      context: args,
      instructions: [
        'Use the TRIZ contradiction matrix',
        'Find row for improving parameter',
        'Find column for worsening parameter',
        'Extract suggested inventive principles (typically 3-4)',
        'List full names and descriptions of suggested principles',
        'Note principle numbers',
        'Consider principles from alternative mappings',
        'Rank principles by likely relevance',
        'Document any empty cells in matrix',
        'Include principle sub-principles where applicable'
      ],
      outputFormat: 'JSON with suggestedPrinciples, principleDescriptions, principleNumbers, ranking, alternativePrinciples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['suggestedPrinciples', 'principleDescriptions', 'artifacts'],
      properties: {
        suggestedPrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              subPrinciples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        principleDescriptions: { type: 'object' },
        principleNumbers: { type: 'array', items: { type: 'number' } },
        ranking: { type: 'array' },
        alternativePrinciples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'matrix-lookup']
}));

export const principleApplicationTask = defineTask('principle-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply inventive principles',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'analogy-mapper', 'hypothesis-generator'],
    prompt: {
      role: 'TRIZ principle application specialist',
      task: 'Apply each suggested inventive principle to generate solution directions',
      context: args,
      instructions: [
        'For each suggested principle, brainstorm applications to the problem',
        'Consider sub-principles and variations',
        'Generate at least 2-3 ideas per principle',
        'Think abstractly then concretely',
        'Consider domain-specific implementations',
        'Look for analogies from other fields',
        'Document how each principle applies',
        'Note principles that seem inapplicable and why',
        'Combine principles for hybrid solutions',
        'Rank applications by promise'
      ],
      outputFormat: 'JSON with applications, applicationsPerPrinciple, hybridApplications, inapplicablePrinciples, ranking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'artifacts'],
      properties: {
        applications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principleNumber: { type: 'number' },
              principleName: { type: 'string' },
              application: { type: 'string' },
              description: { type: 'string' },
              feasibility: { type: 'string' }
            }
          }
        },
        applicationsPerPrinciple: { type: 'object' },
        hybridApplications: { type: 'array' },
        inapplicablePrinciples: { type: 'array' },
        ranking: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'principle-application']
}));

export const physicalContradictionAnalysisTask = defineTask('physical-contradiction-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze physical contradictions',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'causal-inference-engine'],
    prompt: {
      role: 'Physical contradiction resolution specialist',
      task: 'Resolve physical contradictions using separation principles',
      context: args,
      instructions: [
        'Apply separation in space (different properties in different locations)',
        'Apply separation in time (different properties at different times)',
        'Apply separation by condition (different properties under different conditions)',
        'Apply separation at system level (whole vs parts)',
        'Consider transitions between states',
        'Look for phase transitions',
        'Consider field applications',
        'Generate solution directions for each separation type',
        'Evaluate which separations are most applicable',
        'Document separation-based solutions'
      ],
      outputFormat: 'JSON with solutions, separationInSpace, separationInTime, separationByCondition, separationAtSystemLevel, transitions, applicableSeparations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'artifacts'],
      properties: {
        solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              separationType: { type: 'string' },
              solution: { type: 'string' },
              description: { type: 'string' },
              feasibility: { type: 'string' }
            }
          }
        },
        separationInSpace: { type: 'array' },
        separationInTime: { type: 'array' },
        separationByCondition: { type: 'array' },
        separationAtSystemLevel: { type: 'array' },
        transitions: { type: 'array' },
        applicableSeparations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'physical-contradiction']
}));

export const conceptGenerationTask = defineTask('concept-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate solution concepts',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Inventive concept developer',
      task: 'Synthesize principle applications into complete solution concepts',
      context: args,
      instructions: [
        'Combine related principle applications into coherent concepts',
        'Develop each concept with sufficient detail',
        'Name each concept descriptively',
        'Describe how each concept resolves the contradiction',
        'Identify pros and cons of each concept',
        'Note required resources for each concept',
        'Consider implementation complexity',
        'Identify development risks',
        'Create concept sketches or descriptions',
        'Ensure concepts are distinct from each other'
      ],
      outputFormat: 'JSON with concepts, conceptCount, conceptDescriptions, prosAndCons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'artifacts'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              principlesUsed: { type: 'array', items: { type: 'number' } },
              howItResolvesContradiction: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string' }
            }
          }
        },
        conceptCount: { type: 'number' },
        conceptDescriptions: { type: 'object' },
        prosAndCons: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'concept-generation']
}));

export const conceptEvaluationTask = defineTask('concept-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate concepts',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'formal-logic-reasoner'],
    prompt: {
      role: 'Concept evaluation specialist',
      task: 'Evaluate and rank generated concepts',
      context: args,
      instructions: [
        'Evaluate each concept against criteria:',
        '- Effectiveness in resolving contradiction (0-100)',
        '- Technical feasibility (0-100)',
        '- Cost to implement (0-100)',
        '- Time to implement (0-100)',
        '- Alignment with constraints (0-100)',
        'Calculate weighted overall score',
        'Rank concepts by score',
        'Identify viable concepts (above threshold)',
        'Identify top concept',
        'Document evaluation rationale'
      ],
      outputFormat: 'JSON with evaluations, rankings, viableConcepts, topConcept, topConceptScore, evaluationCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rankings', 'viableConcepts', 'topConcept', 'artifacts'],
      properties: {
        evaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptId: { type: 'string' },
              effectiveness: { type: 'number' },
              feasibility: { type: 'number' },
              cost: { type: 'number' },
              time: { type: 'number' },
              constraintAlignment: { type: 'number' },
              overallScore: { type: 'number' }
            }
          }
        },
        rankings: { type: 'array' },
        viableConcepts: { type: 'array' },
        topConcept: { type: 'object' },
        topConceptScore: { type: 'number' },
        evaluationCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triz', 'concept-evaluation']
}));

export const trizQualityScoringTask = defineTask('triz-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score TRIZ analysis quality',
  agent: {
    name: 'triz-specialist',
    skills: ['triz-inventive-solver', 'formal-logic-reasoner'],
    prompt: {
      role: 'TRIZ methodology auditor',
      task: 'Assess the quality and completeness of the TRIZ analysis',
      context: args,
      instructions: [
        'Score problem reformulation quality (0-100)',
        'Score contradiction identification rigor (0-100)',
        'Score parameter mapping accuracy (0-100)',
        'Score principle application creativity (0-100)',
        'Score concept quality and variety (0-100)',
        'Score evaluation objectivity (0-100)',
        'Calculate overall quality score',
        'Calculate creativity score',
        'Identify gaps in the analysis',
        'Recommend improvements'
      ],
      outputFormat: 'JSON with overallScore, creativityScore, rigorScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'creativityScore', 'rigorScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        creativityScore: { type: 'number', minimum: 0, maximum: 100 },
        rigorScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            problemReformulation: { type: 'number' },
            contradictionIdentification: { type: 'number' },
            parameterMapping: { type: 'number' },
            principleApplication: { type: 'number' },
            conceptQuality: { type: 'number' },
            evaluation: { type: 'number' }
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
  labels: ['agent', 'triz', 'quality-scoring']
}));
