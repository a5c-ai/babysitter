/**
 * @process scientific-discovery/symmetry-conservation-thinking
 * @description Symmetry-Conservation Thinking process (Physics) - Use symmetries to infer conserved quantities via Noether's theorem and constrain physical behavior
 * @inputs { physicalSystem: string, observedBehavior: object, knownSymmetries: array, outputDir: string }
 * @outputs { success: boolean, symmetries: array, conservedQuantities: array, constraints: array, predictions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    physicalSystem = '',
    observedBehavior = {},
    knownSymmetries = [],
    outputDir = 'symmetry-conservation-output',
    analysisDepth = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Symmetry-Conservation Thinking Process');

  // ============================================================================
  // PHASE 1: SYSTEM CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing the physical system');
  const systemCharacterization = await ctx.task(systemCharacterizationTask, {
    physicalSystem,
    observedBehavior,
    outputDir
  });

  artifacts.push(...systemCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: SYMMETRY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying symmetries of the system');
  const symmetryIdentification = await ctx.task(symmetryIdentificationTask, {
    physicalSystem,
    systemCharacteristics: systemCharacterization.characteristics,
    knownSymmetries,
    outputDir
  });

  artifacts.push(...symmetryIdentification.artifacts);

  // ============================================================================
  // PHASE 3: NOETHER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying Noether\'s theorem to derive conserved quantities');
  const noetherAnalysis = await ctx.task(noetherAnalysisTask, {
    symmetries: symmetryIdentification.symmetries,
    physicalSystem,
    outputDir
  });

  artifacts.push(...noetherAnalysis.artifacts);

  // Breakpoint: Review symmetries and conservation laws
  await ctx.breakpoint({
    question: `Identified ${symmetryIdentification.symmetries.length} symmetries yielding ${noetherAnalysis.conservedQuantities.length} conserved quantities. Review before constraint analysis?`,
    title: 'Symmetry-Conservation Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalSystem,
        symmetryCount: symmetryIdentification.symmetries.length,
        conservedQuantityCount: noetherAnalysis.conservedQuantities.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: SYMMETRY BREAKING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing symmetry breaking');
  const symmetryBreakingAnalysis = await ctx.task(symmetryBreakingTask, {
    symmetries: symmetryIdentification.symmetries,
    physicalSystem,
    observedBehavior,
    outputDir
  });

  artifacts.push(...symmetryBreakingAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CONSTRAINT DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Deriving constraints from conservation laws');
  const constraintDerivation = await ctx.task(constraintDerivationTask, {
    conservedQuantities: noetherAnalysis.conservedQuantities,
    symmetryBreaking: symmetryBreakingAnalysis.brokenSymmetries,
    physicalSystem,
    outputDir
  });

  artifacts.push(...constraintDerivation.artifacts);

  // ============================================================================
  // PHASE 6: SELECTION RULE DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Deriving selection rules from symmetries');
  const selectionRuleDerivation = await ctx.task(selectionRuleTask, {
    symmetries: symmetryIdentification.symmetries,
    conservedQuantities: noetherAnalysis.conservedQuantities,
    physicalSystem,
    outputDir
  });

  artifacts.push(...selectionRuleDerivation.artifacts);

  // ============================================================================
  // PHASE 7: PREDICTION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating predictions from symmetry analysis');
  const predictionGeneration = await ctx.task(predictionGenerationTask, {
    symmetries: symmetryIdentification.symmetries,
    conservedQuantities: noetherAnalysis.conservedQuantities,
    constraints: constraintDerivation.constraints,
    selectionRules: selectionRuleDerivation.selectionRules,
    outputDir
  });

  artifacts.push(...predictionGeneration.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Symmetry analysis complete. ${constraintDerivation.constraints.length} constraints and ${predictionGeneration.predictions.length} predictions derived. Review findings?`,
    title: 'Symmetry-Conservation Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalSystem,
        constraintCount: constraintDerivation.constraints.length,
        selectionRuleCount: selectionRuleDerivation.selectionRules.length,
        predictionCount: predictionGeneration.predictions.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    physicalSystem,
    symmetries: symmetryIdentification.symmetries,
    conservedQuantities: noetherAnalysis.conservedQuantities,
    symmetryBreaking: symmetryBreakingAnalysis.brokenSymmetries,
    constraints: constraintDerivation.constraints,
    selectionRules: selectionRuleDerivation.selectionRules,
    predictions: predictionGeneration.predictions,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/symmetry-conservation-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Characterization
export const systemCharacterizationTask = defineTask('system-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize the physical system',
  agent: {
    name: 'physics-analyst',
    prompt: {
      role: 'theoretical physicist characterizing physical systems',
      task: 'Characterize the physical system for symmetry analysis',
      context: args,
      instructions: [
        'Identify the degrees of freedom of the system',
        'Determine the Lagrangian or Hamiltonian if applicable',
        'Identify coordinate systems and their relationships',
        'Note spatial, temporal, and internal structure',
        'Identify relevant forces and interactions',
        'Document boundary conditions',
        'Identify relevant scales (length, time, energy)',
        'Note quantum vs classical nature',
        'Identify field vs particle description',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with characteristics (degreesOfFreedom, lagrangian, coordinates, interactions, scales), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'artifacts'],
      properties: {
        characteristics: {
          type: 'object',
          properties: {
            degreesOfFreedom: { type: 'array', items: { type: 'string' } },
            lagrangian: { type: 'string' },
            hamiltonian: { type: 'string' },
            coordinates: { type: 'array', items: { type: 'string' } },
            interactions: { type: 'array', items: { type: 'string' } },
            scales: { type: 'object' },
            quantumClassical: { type: 'string' },
            fieldParticle: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'characterization']
}));

// Task 2: Symmetry Identification
export const symmetryIdentificationTask = defineTask('symmetry-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify symmetries of the system',
  agent: {
    name: 'symmetry-analyst',
    prompt: {
      role: 'theoretical physicist specializing in symmetry groups',
      task: 'Identify all symmetries of the physical system',
      context: args,
      instructions: [
        'Identify continuous symmetries (translations, rotations)',
        'Identify discrete symmetries (parity, time-reversal, charge conjugation)',
        'Check for space translation symmetry (momentum conservation)',
        'Check for time translation symmetry (energy conservation)',
        'Check for rotational symmetry (angular momentum conservation)',
        'Check for gauge symmetries',
        'Check for internal symmetries (isospin, flavor, color)',
        'Identify symmetry group structure',
        'Note approximate vs exact symmetries',
        'Document generators of each symmetry',
        'Save symmetries to output directory'
      ],
      outputFormat: 'JSON with symmetries (array with name, type, group, generator, exact), symmetryGroup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetries', 'artifacts'],
      properties: {
        symmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              continuous: { type: 'boolean' },
              group: { type: 'string' },
              generator: { type: 'string' },
              exact: { type: 'boolean' },
              approximateWhen: { type: 'string' }
            }
          }
        },
        symmetryGroup: { type: 'string' },
        spaceTimeSymmetries: { type: 'array' },
        internalSymmetries: { type: 'array' },
        gaugeSymmetries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'group-theory']
}));

// Task 3: Noether Analysis
export const noetherAnalysisTask = defineTask('noether-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Noether\'s theorem',
  agent: {
    name: 'noether-analyst',
    prompt: {
      role: 'theoretical physicist applying Noether\'s theorem',
      task: 'Apply Noether\'s theorem to derive conserved quantities from symmetries',
      context: args,
      instructions: [
        'For each continuous symmetry, derive the conserved current',
        'Calculate the conserved charge (Noether charge)',
        'Space translation -> Linear momentum',
        'Time translation -> Energy (Hamiltonian)',
        'Rotation -> Angular momentum',
        'Gauge symmetry -> Electric charge, color charge, etc.',
        'Derive explicit form of conserved quantities',
        'Verify conservation by checking time derivative = 0',
        'Note boundary contributions if relevant',
        'Document the Noether current for each symmetry',
        'Save Noether analysis to output directory'
      ],
      outputFormat: 'JSON with conservedQuantities (array with symmetry, quantity, current, charge, expression), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conservedQuantities', 'artifacts'],
      properties: {
        conservedQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              symmetryId: { type: 'string' },
              quantity: { type: 'string' },
              noetherCurrent: { type: 'string' },
              conservedCharge: { type: 'string' },
              expression: { type: 'string' },
              physicalMeaning: { type: 'string' },
              units: { type: 'string' }
            }
          }
        },
        boundaryTerms: { type: 'array' },
        verificationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'noether-theorem']
}));

// Task 4: Symmetry Breaking Analysis
export const symmetryBreakingTask = defineTask('symmetry-breaking-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze symmetry breaking',
  agent: {
    name: 'symmetry-breaking-analyst',
    prompt: {
      role: 'physicist specializing in symmetry breaking',
      task: 'Analyze which symmetries are broken and how',
      context: args,
      instructions: [
        'Identify explicit symmetry breaking (due to terms in Lagrangian)',
        'Identify spontaneous symmetry breaking (ground state breaks symmetry)',
        'Identify anomalous symmetry breaking (quantum effects)',
        'For each broken symmetry, identify the breaking mechanism',
        'Calculate order parameter for spontaneous breaking',
        'Identify Goldstone bosons for spontaneously broken continuous symmetries',
        'Analyze extent of breaking (small vs large)',
        'Identify residual symmetry after breaking',
        'Note implications for conservation laws',
        'Save symmetry breaking analysis to output directory'
      ],
      outputFormat: 'JSON with brokenSymmetries (array with symmetry, mechanism, orderParameter, residual), goldstonesBosons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brokenSymmetries', 'artifacts'],
      properties: {
        brokenSymmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symmetryId: { type: 'string' },
              breakingType: { type: 'string' },
              mechanism: { type: 'string' },
              orderParameter: { type: 'string' },
              breakingScale: { type: 'string' },
              residualSymmetry: { type: 'string' }
            }
          }
        },
        goldstoneBosons: { type: 'array' },
        anomalies: { type: 'array' },
        conservationViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'symmetry-breaking']
}));

// Task 5: Constraint Derivation
export const constraintDerivationTask = defineTask('constraint-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive constraints from conservation laws',
  agent: {
    name: 'constraint-analyst',
    prompt: {
      role: 'physicist deriving physical constraints',
      task: 'Derive constraints on physical processes from conservation laws',
      context: args,
      instructions: [
        'For each conserved quantity, derive constraints on allowed processes',
        'Energy conservation: initial energy = final energy',
        'Momentum conservation: initial momentum = final momentum',
        'Angular momentum conservation constraints',
        'Charge conservation constraints',
        'Express constraints as equations',
        'Identify forbidden processes (violate conservation)',
        'Note kinematic vs dynamic constraints',
        'Derive allowed regions in phase space',
        'Save constraints to output directory'
      ],
      outputFormat: 'JSON with constraints (array with conservedQuantity, constraintEquation, forbiddenProcesses, allowedRegion), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'artifacts'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              conservedQuantityId: { type: 'string' },
              constraintEquation: { type: 'string' },
              constraintType: { type: 'string' },
              forbiddenProcesses: { type: 'array', items: { type: 'string' } },
              allowedRegion: { type: 'string' }
            }
          }
        },
        kinematicConstraints: { type: 'array' },
        dynamicConstraints: { type: 'array' },
        phaseSpaceRestrictions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'constraints']
}));

// Task 6: Selection Rule Derivation
export const selectionRuleTask = defineTask('selection-rule-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive selection rules from symmetries',
  agent: {
    name: 'selection-rule-analyst',
    prompt: {
      role: 'physicist deriving selection rules',
      task: 'Derive selection rules for transitions from symmetry considerations',
      context: args,
      instructions: [
        'Derive selection rules for quantum transitions',
        'Angular momentum selection rules (ΔJ, Δm)',
        'Parity selection rules for electromagnetic transitions',
        'Isospin selection rules',
        'Express which transitions are allowed vs forbidden',
        'Note electric dipole vs magnetic dipole vs electric quadrupole',
        'Derive selection rules for decay processes',
        'Derive selection rules for scattering processes',
        'Calculate relative transition rates from symmetry',
        'Save selection rules to output directory'
      ],
      outputFormat: 'JSON with selectionRules (array with rule, symmetryBasis, allowedTransitions, forbiddenTransitions), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectionRules', 'artifacts'],
      properties: {
        selectionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              ruleName: { type: 'string' },
              ruleStatement: { type: 'string' },
              symmetryBasis: { type: 'string' },
              allowedTransitions: { type: 'array', items: { type: 'string' } },
              forbiddenTransitions: { type: 'array', items: { type: 'string' } },
              multipoleType: { type: 'string' }
            }
          }
        },
        decayRules: { type: 'array' },
        scatteringRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'selection-rules']
}));

// Task 7: Prediction Generation
export const predictionGenerationTask = defineTask('prediction-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate predictions from symmetry analysis',
  agent: {
    name: 'prediction-generator',
    prompt: {
      role: 'theoretical physicist generating predictions',
      task: 'Generate testable predictions from the symmetry analysis',
      context: args,
      instructions: [
        'Generate predictions for experimental observables',
        'Predict which processes are allowed vs forbidden',
        'Predict ratios of rates from symmetry',
        'Predict quantum numbers of allowed states',
        'Predict spectral patterns from symmetry',
        'Predict degeneracy patterns',
        'Predict angular distributions',
        'Note predictions that test symmetry validity',
        'Identify decisive experimental tests',
        'Save predictions to output directory'
      ],
      outputFormat: 'JSON with predictions (array with prediction, basis, observable, testability), decisiveTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'artifacts'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              prediction: { type: 'string' },
              symmetryBasis: { type: 'string' },
              observable: { type: 'string' },
              expectedValue: { type: 'string' },
              testability: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        decisiveTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              testedSymmetry: { type: 'string' },
              expectedOutcome: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'symmetry', 'physics', 'predictions']
}));
