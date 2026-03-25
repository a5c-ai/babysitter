/**
 * @process scientific-discovery/dimensional-analysis-scaling
 * @description Dimensional Analysis and Scaling process - Use physical units and dimensionless combinations to constrain equations and identify scaling laws
 * @inputs { phenomenon: string, variables: array, knownRelations: array, outputDir: string }
 * @outputs { success: boolean, dimensionlessGroups: array, scalingLaws: array, constrainedEquations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon = '',
    variables = [],
    knownRelations = [],
    outputDir = 'dimensional-analysis-output',
    fundamentalDimensions = ['M', 'L', 'T', 'I', 'Theta', 'N', 'J']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Dimensional Analysis and Scaling Process');

  // ============================================================================
  // PHASE 1: VARIABLE IDENTIFICATION AND DIMENSIONAL ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying variables and assigning dimensions');
  const variableAnalysis = await ctx.task(variableIdentificationTask, {
    phenomenon,
    variables,
    fundamentalDimensions,
    outputDir
  });

  artifacts.push(...variableAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DIMENSIONAL MATRIX CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Constructing dimensional matrix');
  const dimensionalMatrix = await ctx.task(dimensionalMatrixTask, {
    variables: variableAnalysis.variables,
    fundamentalDimensions,
    outputDir
  });

  artifacts.push(...dimensionalMatrix.artifacts);

  // ============================================================================
  // PHASE 3: BUCKINGHAM PI THEOREM APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying Buckingham Pi theorem');
  const piGroups = await ctx.task(buckinghamPiTask, {
    dimensionalMatrix: dimensionalMatrix.matrix,
    variables: variableAnalysis.variables,
    rank: dimensionalMatrix.rank,
    outputDir
  });

  artifacts.push(...piGroups.artifacts);

  // Breakpoint: Review dimensionless groups
  await ctx.breakpoint({
    question: `Identified ${piGroups.dimensionlessGroups.length} dimensionless Pi groups from ${variableAnalysis.variables.length} variables. Review before scaling analysis?`,
    title: 'Dimensionless Groups Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        variableCount: variableAnalysis.variables.length,
        matrixRank: dimensionalMatrix.rank,
        piGroupCount: piGroups.dimensionlessGroups.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: PHYSICAL INTERPRETATION OF PI GROUPS
  // ============================================================================

  ctx.log('info', 'Phase 4: Interpreting dimensionless groups physically');
  const piInterpretation = await ctx.task(piInterpretationTask, {
    dimensionlessGroups: piGroups.dimensionlessGroups,
    phenomenon,
    knownRelations,
    outputDir
  });

  artifacts.push(...piInterpretation.artifacts);

  // ============================================================================
  // PHASE 5: SCALING LAW DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Deriving scaling laws');
  const scalingLaws = await ctx.task(scalingLawDerivationTask, {
    dimensionlessGroups: piGroups.dimensionlessGroups,
    interpretations: piInterpretation.interpretations,
    phenomenon,
    outputDir
  });

  artifacts.push(...scalingLaws.artifacts);

  // ============================================================================
  // PHASE 6: EQUATION CONSTRAINT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing constraints on governing equations');
  const equationConstraints = await ctx.task(equationConstraintTask, {
    dimensionlessGroups: piGroups.dimensionlessGroups,
    scalingLaws: scalingLaws.laws,
    knownRelations,
    outputDir
  });

  artifacts.push(...equationConstraints.artifacts);

  // ============================================================================
  // PHASE 7: SIMILARITY AND MODEL SCALING
  // ============================================================================

  ctx.log('info', 'Phase 7: Deriving similarity conditions for model scaling');
  const similarityAnalysis = await ctx.task(similarityAnalysisTask, {
    dimensionlessGroups: piGroups.dimensionlessGroups,
    scalingLaws: scalingLaws.laws,
    phenomenon,
    outputDir
  });

  artifacts.push(...similarityAnalysis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Dimensional analysis complete. ${scalingLaws.laws.length} scaling laws derived. ${similarityAnalysis.similarityConditions.length} similarity conditions identified. Review final analysis?`,
    title: 'Dimensional Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        dimensionlessGroups: piGroups.dimensionlessGroups.length,
        scalingLaws: scalingLaws.laws.length,
        similarityConditions: similarityAnalysis.similarityConditions.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phenomenon,
    variables: variableAnalysis.variables,
    dimensionalMatrix: dimensionalMatrix.matrix,
    dimensionlessGroups: piGroups.dimensionlessGroups,
    interpretations: piInterpretation.interpretations,
    scalingLaws: scalingLaws.laws,
    constrainedEquations: equationConstraints.constrainedForms,
    similarity: {
      conditions: similarityAnalysis.similarityConditions,
      modelingGuidelines: similarityAnalysis.modelingGuidelines
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/dimensional-analysis-scaling',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Variable Identification
export const variableIdentificationTask = defineTask('variable-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify variables and assign dimensions',
  agent: {
    name: 'dimensional-analyst',
    prompt: {
      role: 'physicist specializing in dimensional analysis',
      task: 'Identify all relevant physical variables and assign their fundamental dimensions',
      context: args,
      instructions: [
        'List all physical quantities relevant to the phenomenon',
        'Include dependent and independent variables',
        'Include material properties and constants',
        'For each variable, determine dimensional formula',
        'Express dimensions in terms of M, L, T (and others as needed)',
        'Distinguish dimensional from dimensionless quantities',
        'Note any constraints between variables',
        'Identify which variables are controlling parameters',
        'Document units and typical magnitudes',
        'Check completeness - are all relevant variables included?',
        'Save variable analysis to output directory'
      ],
      outputFormat: 'JSON with variables (array with name, symbol, dimensions, units, role), constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'artifacts'],
      properties: {
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              dimensions: { type: 'object' },
              dimensionalFormula: { type: 'string' },
              units: { type: 'string' },
              role: { type: 'string' },
              typicalMagnitude: { type: 'string' }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        controllingParameters: { type: 'array', items: { type: 'string' } },
        completenessCheck: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'variable-identification']
}));

// Task 2: Dimensional Matrix Construction
export const dimensionalMatrixTask = defineTask('dimensional-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct dimensional matrix',
  agent: {
    name: 'matrix-analyst',
    prompt: {
      role: 'applied mathematician',
      task: 'Construct the dimensional matrix relating variables to fundamental dimensions',
      context: args,
      instructions: [
        'Create matrix with rows = fundamental dimensions, columns = variables',
        'Enter exponent of each dimension for each variable',
        'Compute rank of the dimensional matrix',
        'Identify linearly independent columns',
        'Determine number of independent dimensionless groups (n - r)',
        'Identify repeating variables for Pi group construction',
        'Check for dimensional consistency',
        'Document any redundant variables',
        'Express matrix in canonical form if helpful',
        'Save matrix and analysis to output directory'
      ],
      outputFormat: 'JSON with matrix (2D array), rank, independentColumns, repeatingVariables, numPiGroups, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'rank', 'artifacts'],
      properties: {
        matrix: { type: 'array' },
        matrixLabels: {
          type: 'object',
          properties: {
            rows: { type: 'array', items: { type: 'string' } },
            columns: { type: 'array', items: { type: 'string' } }
          }
        },
        rank: { type: 'number' },
        independentColumns: { type: 'array', items: { type: 'number' } },
        repeatingVariables: { type: 'array', items: { type: 'string' } },
        numPiGroups: { type: 'number' },
        redundantVariables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'matrix-analysis']
}));

// Task 3: Buckingham Pi Theorem
export const buckinghamPiTask = defineTask('buckingham-pi', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Buckingham Pi theorem',
  agent: {
    name: 'pi-theorem-specialist',
    prompt: {
      role: 'physicist specializing in similitude theory',
      task: 'Apply Buckingham Pi theorem to derive independent dimensionless groups',
      context: args,
      instructions: [
        'Select r repeating variables that span the dimension space',
        'For each non-repeating variable, form a Pi group',
        'Solve for exponents to make each group dimensionless',
        'Verify each Pi group is indeed dimensionless',
        'Check linear independence of Pi groups',
        'Express Pi groups in simplest form',
        'Identify any well-known dimensionless numbers (Re, Fr, Ma, etc.)',
        'Consider alternative valid Pi group choices',
        'Document the derivation of each group',
        'Save Pi groups to output directory'
      ],
      outputFormat: 'JSON with dimensionlessGroups (array with expression, derivation, verification), alternativeFormulations, knownNumbers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionlessGroups', 'artifacts'],
      properties: {
        dimensionlessGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              expression: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              exponents: { type: 'object' },
              derivation: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        repeatingVariablesUsed: { type: 'array', items: { type: 'string' } },
        alternativeFormulations: { type: 'array' },
        knownNumbers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              piGroup: { type: 'string' },
              standardName: { type: 'string' },
              standardSymbol: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'buckingham-pi']
}));

// Task 4: Pi Group Interpretation
export const piInterpretationTask = defineTask('pi-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interpret dimensionless groups physically',
  agent: {
    name: 'physics-interpreter',
    prompt: {
      role: 'theoretical physicist',
      task: 'Provide physical interpretation for each dimensionless group',
      context: args,
      instructions: [
        'For each Pi group, interpret physical meaning',
        'Express as ratio of physical effects (e.g., inertia/viscosity)',
        'Identify what balance or competition each group represents',
        'Note limiting cases (Pi >> 1 vs Pi << 1)',
        'Relate to known physical regimes',
        'Identify critical values where regime changes occur',
        'Connect to physical intuition about the phenomenon',
        'Note which groups control which aspects of behavior',
        'Identify groups that can be neglected in certain limits',
        'Save interpretations to output directory'
      ],
      outputFormat: 'JSON with interpretations (array with piGroup, meaning, ratioOf, limitingCases, criticalValues), regimeMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretations', 'artifacts'],
      properties: {
        interpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              piGroupId: { type: 'string' },
              physicalMeaning: { type: 'string' },
              ratioOf: { type: 'string' },
              largeLimit: { type: 'string' },
              smallLimit: { type: 'string' },
              criticalValues: { type: 'array' },
              controlsAspect: { type: 'string' }
            }
          }
        },
        regimeMap: { type: 'object' },
        negligibleInLimits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'physical-interpretation']
}));

// Task 5: Scaling Law Derivation
export const scalingLawDerivationTask = defineTask('scaling-law-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive scaling laws',
  agent: {
    name: 'scaling-analyst',
    prompt: {
      role: 'physicist specializing in scaling and universality',
      task: 'Derive scaling laws relating the dimensionless groups',
      context: args,
      instructions: [
        'Express one Pi group as function of others: Pi_1 = f(Pi_2, Pi_3, ...)',
        'Identify power-law scaling in limiting regimes',
        'Determine scaling exponents where possible',
        'Identify self-similar solutions',
        'Note universal scaling behavior',
        'Identify crossover between scaling regimes',
        'Connect scaling laws to underlying physics',
        'Determine data collapse possibilities',
        'Note deviations from simple power laws',
        'Save scaling laws to output directory'
      ],
      outputFormat: 'JSON with laws (array with expression, regime, exponents, universality), crossovers, dataCollapseForm, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['laws', 'artifacts'],
      properties: {
        laws: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              expression: { type: 'string' },
              regime: { type: 'string' },
              exponents: { type: 'object' },
              universality: { type: 'string' },
              physicalBasis: { type: 'string' }
            }
          }
        },
        crossovers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromRegime: { type: 'string' },
              toRegime: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        dataCollapseForm: { type: 'string' },
        selfSimilarSolutions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'scaling-laws']
}));

// Task 6: Equation Constraint Analysis
export const equationConstraintTask = defineTask('equation-constraint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze constraints on governing equations',
  agent: {
    name: 'equation-analyst',
    prompt: {
      role: 'theoretical physicist',
      task: 'Use dimensional analysis to constrain the form of governing equations',
      context: args,
      instructions: [
        'Determine most general dimensionally consistent equation',
        'Identify undetermined functions of dimensionless groups',
        'Constrain equation form using known physics',
        'Identify terms that must appear together',
        'Note which terms dominate in which regimes',
        'Derive non-dimensionalized governing equations',
        'Identify characteristic scales',
        'Determine natural units for the problem',
        'Note simplifications in limiting cases',
        'Save constrained equations to output directory'
      ],
      outputFormat: 'JSON with constrainedForms (array with equation, regime, dominantTerms), characteristicScales, naturalUnits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constrainedForms', 'artifacts'],
      properties: {
        constrainedForms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              equation: { type: 'string' },
              regime: { type: 'string' },
              dominantTerms: { type: 'array', items: { type: 'string' } },
              negligibleTerms: { type: 'array', items: { type: 'string' } },
              undeterminedFunctions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        characteristicScales: { type: 'object' },
        naturalUnits: { type: 'object' },
        nondimensionalizedEquation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'equation-constraints']
}));

// Task 7: Similarity Analysis
export const similarityAnalysisTask = defineTask('similarity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive similarity conditions for model scaling',
  agent: {
    name: 'similarity-specialist',
    prompt: {
      role: 'experimental physicist specializing in model testing',
      task: 'Derive conditions for geometric, kinematic, and dynamic similarity for model scaling',
      context: args,
      instructions: [
        'Identify conditions for geometric similarity',
        'Identify conditions for kinematic similarity',
        'Identify conditions for dynamic similarity',
        'Determine which Pi groups must be matched in model tests',
        'Assess feasibility of achieving complete similarity',
        'Identify partial similarity strategies when complete similarity impossible',
        'Derive model-to-prototype scaling factors',
        'Note distorted model strategies if needed',
        'Provide guidelines for model design',
        'Save similarity analysis to output directory'
      ],
      outputFormat: 'JSON with similarityConditions (array with type, requirement, piGroupsToMatch), scalingFactors, partialSimilarityStrategies, modelingGuidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['similarityConditions', 'modelingGuidelines', 'artifacts'],
      properties: {
        similarityConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              requirement: { type: 'string' },
              piGroupsToMatch: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scalingFactors: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        completeSimilarityFeasible: { type: 'boolean' },
        partialSimilarityStrategies: { type: 'array' },
        distortedModelApproach: { type: 'string' },
        modelingGuidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dimensional-analysis', 'similarity-theory']
}));
