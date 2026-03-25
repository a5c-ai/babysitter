/**
 * @process scientific-discovery/reaction-mechanism-chains
 * @description Reaction Mechanism Chains process (Chemistry) - Decompose complex reactions into elementary mechanistic steps
 * @inputs { overallReaction: object, reactants: array, products: array, conditions: object, outputDir: string }
 * @outputs { success: boolean, elementarySteps: array, intermediates: array, transitionStates: array, ratelaw: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    overallReaction = {},
    reactants = [],
    products = [],
    conditions = {},
    outputDir = 'mechanism-chain-output',
    kineticAnalysis = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reaction Mechanism Chains Process');

  // ============================================================================
  // PHASE 1: OVERALL REACTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing overall reaction');
  const overallAnalysis = await ctx.task(overallReactionTask, {
    overallReaction,
    reactants,
    products,
    conditions,
    outputDir
  });

  artifacts.push(...overallAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ELEMENTARY STEP PROPOSAL
  // ============================================================================

  ctx.log('info', 'Phase 2: Proposing elementary mechanistic steps');
  const stepProposal = await ctx.task(elementaryStepProposalTask, {
    overallReaction,
    reactants,
    products,
    bondChanges: overallAnalysis.bondChanges,
    outputDir
  });

  artifacts.push(...stepProposal.artifacts);

  // ============================================================================
  // PHASE 3: INTERMEDIATE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying reaction intermediates');
  const intermediateIdentification = await ctx.task(intermediateIdentificationTask, {
    elementarySteps: stepProposal.elementarySteps,
    reactants,
    products,
    outputDir
  });

  artifacts.push(...intermediateIdentification.artifacts);

  // Breakpoint: Review proposed mechanism
  await ctx.breakpoint({
    question: `Proposed ${stepProposal.elementarySteps.length} elementary steps with ${intermediateIdentification.intermediates.length} intermediates. Review before transition state analysis?`,
    title: 'Mechanism Proposal Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        elementaryStepCount: stepProposal.elementarySteps.length,
        intermediateCount: intermediateIdentification.intermediates.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: TRANSITION STATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing transition states');
  const transitionStateAnalysis = await ctx.task(transitionStateTask, {
    elementarySteps: stepProposal.elementarySteps,
    intermediates: intermediateIdentification.intermediates,
    outputDir
  });

  artifacts.push(...transitionStateAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: ENERGY PROFILE CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing reaction energy profile');
  const energyProfile = await ctx.task(energyProfileTask, {
    elementarySteps: stepProposal.elementarySteps,
    intermediates: intermediateIdentification.intermediates,
    transitionStates: transitionStateAnalysis.transitionStates,
    outputDir
  });

  artifacts.push(...energyProfile.artifacts);

  // ============================================================================
  // PHASE 6: RATE-DETERMINING STEP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying rate-determining step');
  const rdsIdentification = await ctx.task(rateDeterminingStepTask, {
    elementarySteps: stepProposal.elementarySteps,
    transitionStates: transitionStateAnalysis.transitionStates,
    energyProfile: energyProfile.profile,
    outputDir
  });

  artifacts.push(...rdsIdentification.artifacts);

  // ============================================================================
  // PHASE 7: RATE LAW DERIVATION
  // ============================================================================

  let rateLawDerivation = null;
  if (kineticAnalysis) {
    ctx.log('info', 'Phase 7: Deriving rate law');
    rateLawDerivation = await ctx.task(rateLawDerivationTask, {
      elementarySteps: stepProposal.elementarySteps,
      rateDeterminingStep: rdsIdentification.rds,
      intermediates: intermediateIdentification.intermediates,
      outputDir
    });
    artifacts.push(...rateLawDerivation.artifacts);
  }

  // ============================================================================
  // PHASE 8: MECHANISM VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating proposed mechanism');
  const mechanismValidation = await ctx.task(mechanismValidationTask, {
    elementarySteps: stepProposal.elementarySteps,
    intermediates: intermediateIdentification.intermediates,
    overallReaction,
    rateLaw: rateLawDerivation?.rateLaw,
    outputDir
  });

  artifacts.push(...mechanismValidation.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Mechanism analysis complete. RDS: ${rdsIdentification.rds.description}. Validation score: ${mechanismValidation.validationScore}%. Review final mechanism?`,
    title: 'Mechanism Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        rateDeterminingStep: rdsIdentification.rds.stepNumber,
        validationScore: mechanismValidation.validationScore,
        rateLaw: rateLawDerivation?.rateLaw?.expression
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    overallReaction,
    elementarySteps: stepProposal.elementarySteps,
    intermediates: intermediateIdentification.intermediates,
    transitionStates: transitionStateAnalysis.transitionStates,
    energyProfile: energyProfile.profile,
    rateDeterminingStep: rdsIdentification.rds,
    rateLaw: rateLawDerivation?.rateLaw,
    validation: {
      score: mechanismValidation.validationScore,
      checks: mechanismValidation.checks
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/reaction-mechanism-chains',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Overall Reaction Analysis
export const overallReactionTask = defineTask('overall-reaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze overall reaction',
  agent: {
    name: 'reaction-analyst',
    prompt: {
      role: 'organic chemist analyzing reactions',
      task: 'Analyze the overall reaction to understand what transformations occur',
      context: args,
      instructions: [
        'Balance the overall reaction equation',
        'Identify all bonds broken and formed',
        'Classify reaction type (substitution, addition, elimination, etc.)',
        'Identify functional group transformations',
        'Note stereochemical changes',
        'Identify oxidation state changes',
        'Assess thermodynamics (exothermic/endothermic)',
        'Note reaction conditions and their role',
        'Identify likely mechanism class',
        'Save overall analysis to output directory'
      ],
      outputFormat: 'JSON with bondChanges, reactionType, functionalGroupChanges, stereochemistry, thermodynamics, mechanismClass, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bondChanges', 'reactionType', 'artifacts'],
      properties: {
        bondChanges: {
          type: 'object',
          properties: {
            broken: { type: 'array', items: { type: 'string' } },
            formed: { type: 'array', items: { type: 'string' } }
          }
        },
        reactionType: { type: 'string' },
        functionalGroupChanges: { type: 'array' },
        stereochemistry: { type: 'object' },
        thermodynamics: { type: 'object' },
        mechanismClass: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'overall-analysis']
}));

// Task 2: Elementary Step Proposal
export const elementaryStepProposalTask = defineTask('elementary-step-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propose elementary mechanistic steps',
  agent: {
    name: 'mechanistic-chemist',
    prompt: {
      role: 'physical organic chemist proposing mechanisms',
      task: 'Propose elementary steps that could constitute the reaction mechanism',
      context: args,
      instructions: [
        'Elementary steps involve one or at most two molecules',
        'Each step should be chemically reasonable',
        'Propose steps: initiation, propagation, termination (for chain)',
        'Include proton transfers where appropriate',
        'Consider concerted vs stepwise pathways',
        'Note molecularity of each step (unimolecular, bimolecular)',
        'Ensure steps sum to overall reaction',
        'Consider both forward and reverse steps',
        'Draw electron pushing for each step',
        'Save elementary steps to output directory'
      ],
      outputFormat: 'JSON with elementarySteps (array with reactants, products, molecularity, electronPushing), stepSum, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['elementarySteps', 'artifacts'],
      properties: {
        elementarySteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              description: { type: 'string' },
              reactants: { type: 'array', items: { type: 'string' } },
              products: { type: 'array', items: { type: 'string' } },
              molecularity: { type: 'number' },
              stepType: { type: 'string' },
              electronPushing: { type: 'string' },
              reversible: { type: 'boolean' }
            }
          }
        },
        stepSum: { type: 'string' },
        concertedVsStepwise: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'elementary-steps']
}));

// Task 3: Intermediate Identification
export const intermediateIdentificationTask = defineTask('intermediate-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify reaction intermediates',
  agent: {
    name: 'intermediate-specialist',
    prompt: {
      role: 'mechanistic chemist identifying intermediates',
      task: 'Identify all reaction intermediates in the mechanism',
      context: args,
      instructions: [
        'Intermediates are species formed in one step and consumed in another',
        'Identify all intermediate structures',
        'Classify intermediates: carbocations, carbanions, radicals, carbenes, etc.',
        'Assess stability of each intermediate',
        'Note factors stabilizing/destabilizing each intermediate',
        'Determine lifetime (short-lived vs long-lived)',
        'Identify spectroscopic signatures if detectable',
        'Note any intermediates that might be isolable',
        'Save intermediate identification to output directory'
      ],
      outputFormat: 'JSON with intermediates (array with structure, type, stability, lifetime, detection), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intermediates', 'artifacts'],
      properties: {
        intermediates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              structure: { type: 'string' },
              type: { type: 'string' },
              formedInStep: { type: 'number' },
              consumedInStep: { type: 'number' },
              stability: { type: 'string' },
              stabilizingFactors: { type: 'array', items: { type: 'string' } },
              lifetime: { type: 'string' },
              detectionMethod: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'intermediates']
}));

// Task 4: Transition State Analysis
export const transitionStateTask = defineTask('transition-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze transition states',
  agent: {
    name: 'transition-state-analyst',
    prompt: {
      role: 'computational chemist analyzing transition states',
      task: 'Analyze the transition state for each elementary step',
      context: args,
      instructions: [
        'Identify transition state structure for each step',
        'Transition state is highest energy point along reaction coordinate',
        'Describe geometry of transition state',
        'Apply Hammond\'s postulate to predict TS structure',
        'For early TS: resembles reactants',
        'For late TS: resembles products',
        'Assess degree of bond making/breaking at TS',
        'Note any special stabilization of TS',
        'Predict stereochemical outcome from TS geometry',
        'Save transition state analysis to output directory'
      ],
      outputFormat: 'JSON with transitionStates (array with step, structure, geometry, hammondPosition, stereochemistry), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transitionStates', 'artifacts'],
      properties: {
        transitionStates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              structure: { type: 'string' },
              geometry: { type: 'string' },
              hammondPosition: { type: 'string' },
              bondOrders: { type: 'object' },
              stabilization: { type: 'array', items: { type: 'string' } },
              stereochemicalOutcome: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'transition-states']
}));

// Task 5: Energy Profile Construction
export const energyProfileTask = defineTask('energy-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct reaction energy profile',
  agent: {
    name: 'energy-profile-constructor',
    prompt: {
      role: 'physical chemist constructing energy diagrams',
      task: 'Construct the potential energy profile for the reaction',
      context: args,
      instructions: [
        'Plot energy vs reaction coordinate',
        'Place reactants at starting energy',
        'Place intermediates at local minima',
        'Place transition states at local maxima',
        'Place products at final energy',
        'Label activation energies for each step',
        'Calculate overall thermodynamics (delta G)',
        'Identify highest energy point (overall barrier)',
        'Note any conformational changes along coordinate',
        'Save energy profile to output directory'
      ],
      outputFormat: 'JSON with profile (points array with species, energy, type), activationEnergies, overallThermodynamics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'artifacts'],
      properties: {
        profile: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              species: { type: 'string' },
              type: { type: 'string' },
              relativeEnergy: { type: 'number' },
              reactionCoordinate: { type: 'number' }
            }
          }
        },
        activationEnergies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              Ea: { type: 'number' },
              direction: { type: 'string' }
            }
          }
        },
        overallThermodynamics: {
          type: 'object',
          properties: {
            deltaG: { type: 'number' },
            deltaH: { type: 'number' },
            exothermic: { type: 'boolean' }
          }
        },
        highestBarrier: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'energy-profile']
}));

// Task 6: Rate-Determining Step Identification
export const rateDeterminingStepTask = defineTask('rate-determining-step', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify rate-determining step',
  agent: {
    name: 'kinetics-specialist',
    prompt: {
      role: 'kineticist identifying rate-determining steps',
      task: 'Identify the rate-determining step of the mechanism',
      context: args,
      instructions: [
        'RDS is the slowest step in the mechanism',
        'Has highest activation energy barrier',
        'Controls overall reaction rate',
        'Identify from energy profile',
        'Consider competing pathways',
        'Note if there are multiple slow steps',
        'Consider substrate dependence of RDS',
        'Note how conditions might change RDS',
        'Predict kinetic isotope effects from RDS',
        'Save RDS identification to output directory'
      ],
      outputFormat: 'JSON with rds (stepNumber, description, Ea, kineticImplications), alternativeRDS, conditionDependence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rds', 'artifacts'],
      properties: {
        rds: {
          type: 'object',
          properties: {
            stepNumber: { type: 'number' },
            description: { type: 'string' },
            activationEnergy: { type: 'number' },
            transitionStateStructure: { type: 'string' },
            kineticImplications: { type: 'array', items: { type: 'string' } }
          }
        },
        alternativeRDS: { type: 'object' },
        conditionDependence: { type: 'object' },
        kineticIsotopeEffects: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'rate-determining']
}));

// Task 7: Rate Law Derivation
export const rateLawDerivationTask = defineTask('rate-law-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive rate law',
  agent: {
    name: 'kinetics-expert',
    prompt: {
      role: 'chemical kineticist deriving rate laws',
      task: 'Derive the rate law from the proposed mechanism',
      context: args,
      instructions: [
        'Write rate expression for rate-determining step',
        'Apply steady-state approximation to intermediates',
        'Or apply pre-equilibrium approximation if appropriate',
        'Express rate in terms of observable species only',
        'Eliminate intermediate concentrations',
        'Simplify rate expression',
        'Identify order with respect to each reactant',
        'Note any inverse dependence on products',
        'Predict how rate changes with conditions',
        'Save rate law to output directory'
      ],
      outputFormat: 'JSON with rateLaw (expression, orders, approximations), derivation, predictions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rateLaw', 'artifacts'],
      properties: {
        rateLaw: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            orders: { type: 'object' },
            overallOrder: { type: 'number' },
            rateConstant: { type: 'string' }
          }
        },
        derivation: {
          type: 'object',
          properties: {
            approximationUsed: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } }
          }
        },
        predictions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'rate-law']
}));

// Task 8: Mechanism Validation
export const mechanismValidationTask = defineTask('mechanism-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate proposed mechanism',
  agent: {
    name: 'mechanism-validator',
    prompt: {
      role: 'senior chemist validating mechanisms',
      task: 'Validate the proposed mechanism against chemical principles',
      context: args,
      instructions: [
        'Check: steps sum to overall reaction',
        'Check: mass and charge balance in each step',
        'Check: intermediates are chemically reasonable',
        'Check: rate law consistent with experimental data',
        'Check: stereochemistry consistent with mechanism',
        'Check: isotope effects consistent',
        'Note any mechanistic tests that would distinguish alternatives',
        'Assess overall confidence in mechanism',
        'Identify weakest aspects of proposed mechanism',
        'Save validation to output directory'
      ],
      outputFormat: 'JSON with validationScore, checks (array with check, passed, notes), weaknesses, suggestedTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checks', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        weaknesses: { type: 'array', items: { type: 'string' } },
        suggestedTests: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'mechanism-chains', 'chemistry', 'validation']
}));
