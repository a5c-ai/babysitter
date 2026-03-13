/**
 * @process scientific-discovery/modeling-idealization-approximation
 * @description Modeling, Idealization and Approximation process - Build simplified models that capture essential features while ignoring irrelevant details
 * @inputs { targetSystem: string, modelingGoal: string, constraints: object, acceptableError: number, outputDir: string }
 * @outputs { success: boolean, model: object, idealizations: array, approximations: array, validityDomain: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetSystem = '',
    modelingGoal = '',
    constraints = {},
    acceptableError = 0.1,
    outputDir = 'modeling-idealization-output',
    modelComplexityLimit = 'medium'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Modeling, Idealization and Approximation Process');

  // ============================================================================
  // PHASE 1: SYSTEM CHARACTERIZATION AND GOAL CLARIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing system and clarifying modeling goals');
  const systemCharacterization = await ctx.task(systemCharacterizationTask, {
    targetSystem,
    modelingGoal,
    constraints,
    outputDir
  });

  artifacts.push(...systemCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: FEATURE IDENTIFICATION AND RELEVANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying features and assessing relevance');
  const featureAssessment = await ctx.task(featureRelevanceTask, {
    targetSystem,
    systemCharacteristics: systemCharacterization.characteristics,
    modelingGoal,
    outputDir
  });

  artifacts.push(...featureAssessment.artifacts);

  // ============================================================================
  // PHASE 3: IDEALIZATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing idealizations');
  const idealizationDesign = await ctx.task(idealizationDesignTask, {
    targetSystem,
    essentialFeatures: featureAssessment.essentialFeatures,
    negligibleFeatures: featureAssessment.negligibleFeatures,
    modelingGoal,
    outputDir
  });

  artifacts.push(...idealizationDesign.artifacts);

  // ============================================================================
  // PHASE 4: APPROXIMATION SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Selecting approximations');
  const approximationSelection = await ctx.task(approximationSelectionTask, {
    idealizations: idealizationDesign.idealizations,
    acceptableError,
    modelComplexityLimit,
    outputDir
  });

  artifacts.push(...approximationSelection.artifacts);

  // Breakpoint: Review idealizations and approximations
  await ctx.breakpoint({
    question: `Identified ${idealizationDesign.idealizations.length} idealizations and ${approximationSelection.approximations.length} approximations. Estimated error: ${approximationSelection.estimatedError}. Proceed with model construction?`,
    title: 'Idealization and Approximation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        targetSystem,
        modelingGoal,
        idealizationCount: idealizationDesign.idealizations.length,
        approximationCount: approximationSelection.approximations.length,
        estimatedError: approximationSelection.estimatedError
      }
    }
  });

  // ============================================================================
  // PHASE 5: MODEL CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing the model');
  const modelConstruction = await ctx.task(modelConstructionTask, {
    targetSystem,
    essentialFeatures: featureAssessment.essentialFeatures,
    idealizations: idealizationDesign.idealizations,
    approximations: approximationSelection.approximations,
    modelingGoal,
    outputDir
  });

  artifacts.push(...modelConstruction.artifacts);

  // ============================================================================
  // PHASE 6: VALIDITY DOMAIN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing model validity domain');
  const validityAnalysis = await ctx.task(validityDomainTask, {
    model: modelConstruction.model,
    idealizations: idealizationDesign.idealizations,
    approximations: approximationSelection.approximations,
    acceptableError,
    outputDir
  });

  artifacts.push(...validityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: MODEL VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Verifying model against known cases');
  const modelVerification = await ctx.task(modelVerificationTask, {
    model: modelConstruction.model,
    validityDomain: validityAnalysis.validityDomain,
    targetSystem,
    acceptableError,
    outputDir
  });

  artifacts.push(...modelVerification.artifacts);

  // ============================================================================
  // PHASE 8: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    model: modelConstruction.model,
    idealizations: idealizationDesign.idealizations,
    approximations: approximationSelection.approximations,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Model construction complete. Verification score: ${modelVerification.verificationScore}%. Validity domain established. Review final model?`,
    title: 'Model Construction Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        modelType: modelConstruction.model.type,
        verificationScore: modelVerification.verificationScore,
        validityDomainSize: validityAnalysis.domainSize,
        criticalParameters: sensitivityAnalysis.criticalParameters.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    targetSystem,
    modelingGoal,
    model: modelConstruction.model,
    idealizations: idealizationDesign.idealizations,
    approximations: approximationSelection.approximations,
    validityDomain: validityAnalysis.validityDomain,
    verification: {
      score: modelVerification.verificationScore,
      testCases: modelVerification.testCases,
      failures: modelVerification.failures
    },
    sensitivity: {
      criticalParameters: sensitivityAnalysis.criticalParameters,
      robustParameters: sensitivityAnalysis.robustParameters
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/modeling-idealization-approximation',
      timestamp: startTime,
      outputDir,
      acceptableError
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Characterization
export const systemCharacterizationTask = defineTask('system-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize target system and modeling goals',
  agent: {
    name: 'system-analyst',
    prompt: {
      role: 'theoretical physicist and modeling specialist',
      task: 'Thoroughly characterize the target system and clarify what the model needs to achieve',
      context: args,
      instructions: [
        'Describe the target system comprehensively',
        'Identify all relevant physical/conceptual variables',
        'Document known governing laws or principles',
        'Specify scales (length, time, energy, etc.)',
        'Identify relevant dimensionless parameters',
        'Clarify what questions the model should answer',
        'Determine required accuracy for each output',
        'Note computational or analytical constraints',
        'Identify previous modeling approaches',
        'Document boundary conditions and initial conditions',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with characteristics (variables, laws, scales, parameters), modelingRequirements, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'modelingRequirements', 'artifacts'],
      properties: {
        characteristics: {
          type: 'object',
          properties: {
            variables: { type: 'array', items: { type: 'string' } },
            governingLaws: { type: 'array', items: { type: 'string' } },
            scales: { type: 'object' },
            dimensionlessParameters: { type: 'array' },
            boundaryConditions: { type: 'array', items: { type: 'string' } }
          }
        },
        modelingRequirements: {
          type: 'object',
          properties: {
            primaryOutputs: { type: 'array', items: { type: 'string' } },
            requiredAccuracy: { type: 'object' },
            computationalBudget: { type: 'string' }
          }
        },
        constraints: { type: 'object' },
        previousApproaches: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'system-characterization', 'modeling']
}));

// Task 2: Feature Relevance Assessment
export const featureRelevanceTask = defineTask('feature-relevance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify features and assess relevance',
  agent: {
    name: 'relevance-analyst',
    prompt: {
      role: 'theoretical scientist specializing in model reduction',
      task: 'Identify all system features and assess their relevance to the modeling goal',
      context: args,
      instructions: [
        'List all features, effects, and phenomena present in the system',
        'Assess relevance of each feature to modeling goal',
        'Classify features as essential, secondary, or negligible',
        'Use dimensional analysis to assess relative importance',
        'Consider scale separations',
        'Identify dominant and subdominant effects',
        'Estimate order of magnitude of each contribution',
        'Document coupling between features',
        'Note features critical for qualitative vs quantitative accuracy',
        'Save feature assessment to output directory'
      ],
      outputFormat: 'JSON with essentialFeatures, secondaryFeatures, negligibleFeatures, dominanceAnalysis, scaleSeparations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['essentialFeatures', 'negligibleFeatures', 'artifacts'],
      properties: {
        essentialFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              importance: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        secondaryFeatures: { type: 'array' },
        negligibleFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              estimatedContribution: { type: 'string' },
              neglectJustification: { type: 'string' }
            }
          }
        },
        dominanceAnalysis: { type: 'string' },
        scaleSeparations: { type: 'array' },
        featureCouplings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'feature-relevance', 'model-reduction']
}));

// Task 3: Idealization Design
export const idealizationDesignTask = defineTask('idealization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design idealizations',
  agent: {
    name: 'idealization-specialist',
    prompt: {
      role: 'theoretical physicist specializing in idealization',
      task: 'Design appropriate idealizations that simplify the system while preserving essential behavior',
      context: args,
      instructions: [
        'Design idealizations for negligible features',
        'Types of idealization: abstraction, limit-taking, isolation, homogenization',
        'For each idealization, specify what is simplified',
        'Document conditions under which idealization is valid',
        'Assess error introduced by each idealization',
        'Consider asymptotic idealizations (taking parameters to 0 or infinity)',
        'Design symmetry-based idealizations where applicable',
        'Consider thermodynamic or statistical idealizations',
        'Ensure idealizations are internally consistent',
        'Document what physics is lost vs preserved',
        'Save idealization design to output directory'
      ],
      outputFormat: 'JSON with idealizations (array with type, description, validity, errorEstimate), consistencyCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['idealizations', 'artifacts'],
      properties: {
        idealizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              simplifies: { type: 'string' },
              validityConditions: { type: 'array', items: { type: 'string' } },
              errorEstimate: { type: 'string' },
              physicsLost: { type: 'string' },
              physicsPreserved: { type: 'string' }
            }
          }
        },
        consistencyCheck: { type: 'boolean' },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'idealization', 'model-simplification']
}));

// Task 4: Approximation Selection
export const approximationSelectionTask = defineTask('approximation-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select approximations',
  agent: {
    name: 'approximation-specialist',
    prompt: {
      role: 'applied mathematician and numerical analyst',
      task: 'Select appropriate mathematical approximations to make the model tractable',
      context: args,
      instructions: [
        'Identify where mathematical approximations are needed',
        'Consider Taylor expansions, perturbation series',
        'Consider WKB, variational, mean-field approximations',
        'Assess truncation errors for each approximation',
        'Determine convergence properties',
        'Select approximation order to meet error tolerance',
        'Consider numerical vs analytical approximations',
        'Assess computational cost of each approximation level',
        'Identify approximations that break down at boundaries',
        'Estimate cumulative error from all approximations',
        'Save approximation selections to output directory'
      ],
      outputFormat: 'JSON with approximations (array with type, order, errorBound, validityRange), estimatedError, computationalCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approximations', 'estimatedError', 'artifacts'],
      properties: {
        approximations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              order: { type: 'number' },
              errorBound: { type: 'string' },
              validityRange: { type: 'string' },
              computationalCost: { type: 'string' }
            }
          }
        },
        estimatedError: { type: 'number' },
        cumulativeErrorAnalysis: { type: 'string' },
        computationalCost: { type: 'string' },
        breakdownConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'approximation', 'numerical-methods']
}));

// Task 5: Model Construction
export const modelConstructionTask = defineTask('model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct the model',
  agent: {
    name: 'model-builder',
    prompt: {
      role: 'theoretical scientist and model constructor',
      task: 'Construct the complete model incorporating all idealizations and approximations',
      context: args,
      instructions: [
        'Write down the model equations/rules explicitly',
        'Incorporate all idealizations',
        'Apply selected approximations',
        'Define all model parameters',
        'Specify boundary and initial conditions',
        'Document model inputs and outputs',
        'Write model in canonical/standard form if possible',
        'Identify free parameters vs derived quantities',
        'Document physical interpretation of each term',
        'Note symmetries preserved in the model',
        'Provide solution method or algorithm outline',
        'Save model specification to output directory'
      ],
      outputFormat: 'JSON with model (type, equations, parameters, inputs, outputs, solutionMethod), documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            equations: { type: 'array', items: { type: 'string' } },
            parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  symbol: { type: 'string' },
                  units: { type: 'string' },
                  physicalMeaning: { type: 'string' }
                }
              }
            },
            inputs: { type: 'array', items: { type: 'string' } },
            outputs: { type: 'array', items: { type: 'string' } },
            boundaryConditions: { type: 'array', items: { type: 'string' } },
            solutionMethod: { type: 'string' }
          }
        },
        symmetries: { type: 'array', items: { type: 'string' } },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'model-construction', 'theoretical-modeling']
}));

// Task 6: Validity Domain Analysis
export const validityDomainTask = defineTask('validity-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model validity domain',
  agent: {
    name: 'validity-analyst',
    prompt: {
      role: 'applied scientist specializing in model validity',
      task: 'Determine the domain of validity where the model provides accurate predictions',
      context: args,
      instructions: [
        'Identify parameter ranges where idealizations hold',
        'Determine where approximations remain valid',
        'Find validity boundaries in parameter space',
        'Identify breakdown signatures to watch for',
        'Calculate dimensionless validity criteria',
        'Note regime transitions that invalidate model',
        'Map validity domain in relevant parameter space',
        'Estimate model reliability at domain boundaries',
        'Document physical interpretation of validity limits',
        'Compare with full theory where available',
        'Save validity analysis to output directory'
      ],
      outputFormat: 'JSON with validityDomain (parameterRanges, boundaries, criteria), domainSize, breakdownSignatures, reliabilityMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validityDomain', 'artifacts'],
      properties: {
        validityDomain: {
          type: 'object',
          properties: {
            parameterRanges: { type: 'object' },
            boundaries: { type: 'array', items: { type: 'string' } },
            validityCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        domainSize: { type: 'string' },
        breakdownSignatures: { type: 'array', items: { type: 'string' } },
        regimeTransitions: { type: 'array' },
        reliabilityMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'validity-analysis', 'model-limits']
}));

// Task 7: Model Verification
export const modelVerificationTask = defineTask('model-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify model against known cases',
  agent: {
    name: 'model-verifier',
    prompt: {
      role: 'computational scientist and model validator',
      task: 'Verify the model by testing against known analytical solutions, limiting cases, and benchmarks',
      context: args,
      instructions: [
        'Identify known analytical solutions within validity domain',
        'Compare model predictions to analytical solutions',
        'Test limiting cases (e.g., small/large parameter limits)',
        'Verify conservation laws are satisfied',
        'Check dimensional consistency',
        'Test symmetry properties',
        'Compare with experimental benchmarks if available',
        'Calculate verification score based on test results',
        'Document any discrepancies and their sources',
        'Identify cases where model fails',
        'Save verification results to output directory'
      ],
      outputFormat: 'JSON with verificationScore, testCases (array with case, expected, actual, error), failures, conservationChecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationScore', 'testCases', 'artifacts'],
      properties: {
        verificationScore: { type: 'number', minimum: 0, maximum: 100 },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              caseName: { type: 'string' },
              description: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              error: { type: 'number' },
              passed: { type: 'boolean' }
            }
          }
        },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              caseName: { type: 'string' },
              discrepancy: { type: 'string' },
              likelyCause: { type: 'string' }
            }
          }
        },
        conservationChecks: { type: 'object' },
        symmetryChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'model-verification', 'validation']
}));

// Task 8: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'uncertainty quantification specialist',
      task: 'Analyze model sensitivity to parameters, idealizations, and approximations',
      context: args,
      instructions: [
        'Identify all model parameters and inputs',
        'Perform local sensitivity analysis (partial derivatives)',
        'Assess global sensitivity (Sobol indices or similar)',
        'Identify critical parameters (high sensitivity)',
        'Identify robust parameters (low sensitivity)',
        'Test sensitivity to idealization relaxation',
        'Test sensitivity to approximation order',
        'Identify parameter combinations with amplified sensitivity',
        'Document which outputs are most sensitive',
        'Provide uncertainty propagation guidance',
        'Save sensitivity analysis to output directory'
      ],
      outputFormat: 'JSON with criticalParameters, robustParameters, sensitivityIndices, idealizationSensitivity, approximationSensitivity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalParameters', 'robustParameters', 'artifacts'],
      properties: {
        criticalParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivityIndex: { type: 'number' },
              affectedOutputs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        robustParameters: { type: 'array', items: { type: 'string' } },
        sensitivityIndices: { type: 'object' },
        idealizationSensitivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idealization: { type: 'string' },
              sensitivity: { type: 'string' },
              robustness: { type: 'string' }
            }
          }
        },
        approximationSensitivity: { type: 'array' },
        uncertaintyGuidance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'sensitivity-analysis', 'uncertainty-quantification']
}));
