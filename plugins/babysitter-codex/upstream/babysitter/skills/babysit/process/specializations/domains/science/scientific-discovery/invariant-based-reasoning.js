/**
 * @process scientific-discovery/invariant-based-reasoning
 * @description Identify properties that must remain true at each step of a computation or process, using invariants for correctness proofs and algorithm design
 * @inputs { system: object, property: string, operations: array, outputDir: string }
 * @outputs { success: boolean, invariants: array, proofs: array, applications: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = {},
    property = '',
    operations = [],
    outputDir = 'invariant-output',
    targetStrength = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Invariant-Based Reasoning Process');

  // ============================================================================
  // PHASE 1: SYSTEM STATE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing system state');
  const stateCharacterization = await ctx.task(stateCharacterizationTask, {
    system,
    operations,
    outputDir
  });

  artifacts.push(...stateCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: CANDIDATE INVARIANT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying candidate invariants');
  const candidateIdentification = await ctx.task(candidateInvariantIdentificationTask, {
    system,
    property,
    stateSpace: stateCharacterization.stateSpace,
    outputDir
  });

  artifacts.push(...candidateIdentification.artifacts);

  // ============================================================================
  // PHASE 3: INVARIANT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Verifying invariants');
  const invariantVerification = await ctx.task(invariantVerificationTask, {
    candidates: candidateIdentification.candidates,
    operations,
    system,
    outputDir
  });

  artifacts.push(...invariantVerification.artifacts);

  // ============================================================================
  // PHASE 4: INVARIANT STRENGTHENING
  // ============================================================================

  ctx.log('info', 'Phase 4: Strengthening invariants');
  const invariantStrengthening = await ctx.task(invariantStrengtheningTask, {
    verifiedInvariants: invariantVerification.verified,
    property,
    operations,
    outputDir
  });

  artifacts.push(...invariantStrengthening.artifacts);

  // ============================================================================
  // PHASE 5: INDUCTIVE PROOF CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing inductive proofs');
  const proofConstruction = await ctx.task(inductiveProofConstructionTask, {
    invariants: invariantStrengthening.strongInvariants,
    operations,
    system,
    outputDir
  });

  artifacts.push(...proofConstruction.artifacts);

  // ============================================================================
  // PHASE 6: LOOP INVARIANT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing loop invariants');
  const loopInvariantAnalysis = await ctx.task(loopInvariantAnalysisTask, {
    invariants: invariantStrengthening.strongInvariants,
    operations,
    property,
    outputDir
  });

  artifacts.push(...loopInvariantAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: INVARIANT APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Applying invariants');
  const invariantApplication = await ctx.task(invariantApplicationTask, {
    verifiedInvariants: proofConstruction.provenInvariants,
    loopInvariants: loopInvariantAnalysis.loopInvariants,
    property,
    outputDir
  });

  artifacts.push(...invariantApplication.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND CONCLUSIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing invariant analysis');
  const synthesis = await ctx.task(invariantSynthesisTask, {
    stateCharacterization,
    candidateIdentification,
    invariantVerification,
    invariantStrengthening,
    proofConstruction,
    loopInvariantAnalysis,
    invariantApplication,
    targetStrength,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const strengthMet = synthesis.strengthScore >= targetStrength;

  // Breakpoint: Review invariant analysis
  await ctx.breakpoint({
    question: `Invariant analysis complete. Strength: ${synthesis.strengthScore}/${targetStrength}. ${strengthMet ? 'Strength target met!' : 'Stronger invariants may be needed.'} Review analysis?`,
    title: 'Invariant-Based Reasoning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        property,
        candidatesIdentified: candidateIdentification.candidates.length,
        invariantsVerified: invariantVerification.verified.length,
        proofsConstructed: proofConstruction.provenInvariants.length,
        loopInvariants: loopInvariantAnalysis.loopInvariants.length,
        strengthScore: synthesis.strengthScore,
        strengthMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    property,
    invariants: proofConstruction.provenInvariants,
    proofs: proofConstruction.proofs,
    loopInvariants: loopInvariantAnalysis.loopInvariants,
    applications: invariantApplication.applications,
    strengthScore: synthesis.strengthScore,
    strengthMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/invariant-based-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: State Characterization
export const stateCharacterizationTask = defineTask('state-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize system state',
  agent: {
    name: 'state-analyst',
    prompt: {
      role: 'formal methods specialist',
      task: 'Characterize the state space of the system',
      context: args,
      instructions: [
        'Identify the state variables of the system:',
        '  - What quantities/values define the state?',
        '  - What are their types and ranges?',
        '  - What are the initial values?',
        'Characterize the state space:',
        '  - Finite or infinite?',
        '  - Discrete or continuous?',
        '  - Dimensionality?',
        'Identify state transitions:',
        '  - What operations change the state?',
        '  - What are the preconditions?',
        '  - What are the postconditions?',
        'Define reachable states from initial state',
        'Identify terminal/accepting states if applicable',
        'Save state characterization to output directory'
      ],
      outputFormat: 'JSON with stateSpace (variables, types, initial, characteristics), transitions, reachableStates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stateSpace', 'transitions', 'artifacts'],
      properties: {
        stateSpace: {
          type: 'object',
          properties: {
            variables: { type: 'array', items: { type: 'object' } },
            types: { type: 'object' },
            initialState: { type: 'object' },
            characteristics: {
              type: 'object',
              properties: {
                finite: { type: 'boolean' },
                discrete: { type: 'boolean' },
                dimensionality: { type: 'number' }
              }
            }
          }
        },
        transitions: { type: 'array', items: { type: 'object' } },
        reachableStates: { type: 'object' },
        terminalStates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'invariant', 'state-characterization']
}));

// Task 2: Candidate Invariant Identification
export const candidateInvariantIdentificationTask = defineTask('candidate-invariant-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify candidate invariants',
  agent: {
    name: 'invariant-discoverer',
    prompt: {
      role: 'program verification specialist',
      task: 'Identify candidate invariant properties',
      context: args,
      instructions: [
        'Generate candidate invariants:',
        '  - Conservation laws (quantities preserved)',
        '  - Bounds (values within range)',
        '  - Ordering relations (sequences sorted)',
        '  - Structural properties (tree is balanced)',
        '  - Monotonicity (values only increase/decrease)',
        'Consider different invariant types:',
        '  - Safety invariants (bad states unreachable)',
        '  - Data structure invariants (rep invariant)',
        '  - Loop invariants (holds during iteration)',
        '  - Class invariants (object consistency)',
        'Generate invariants related to the target property',
        'Consider invariants at different abstraction levels',
        'Rank candidates by potential usefulness',
        'Save candidate identification to output directory'
      ],
      outputFormat: 'JSON with candidates (array with statement, type, abstraction, usefulness), targetRelated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates', 'targetRelated', 'artifacts'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              formalStatement: { type: 'string' },
              type: { type: 'string', enum: ['conservation', 'bounds', 'ordering', 'structural', 'monotonicity', 'safety'] },
              abstraction: { type: 'string', enum: ['high', 'medium', 'low'] },
              usefulness: { type: 'number' }
            }
          }
        },
        targetRelated: { type: 'array', items: { type: 'string' } },
        generationMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'invariant', 'candidate-identification']
}));

// Task 3: Invariant Verification
export const invariantVerificationTask = defineTask('invariant-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify invariants',
  agent: {
    name: 'invariant-verifier',
    prompt: {
      role: 'formal verification specialist',
      task: 'Verify that candidate invariants actually hold',
      context: args,
      instructions: [
        'For each candidate invariant, verify:',
        '  1. Initialization: True in initial state',
        '  2. Preservation: If true before operation, true after',
        'For each operation/transition:',
        '  - Assume invariant holds in pre-state',
        '  - Apply operation',
        '  - Check invariant holds in post-state',
        'Document verification for each operation:',
        '  - Verified: proof sketch',
        '  - Falsified: counterexample',
        '  - Unknown: reason',
        'Identify invariants that need strengthening',
        'Identify interactions between invariants',
        'Save verification results to output directory'
      ],
      outputFormat: 'JSON with verified (array), falsified (array with counterexample), unknown (array), interactionsngs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'falsified', 'artifacts'],
      properties: {
        verified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              invariant: { type: 'string' },
              initializationProof: { type: 'string' },
              preservationProofs: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        falsified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              invariant: { type: 'string' },
              counterexample: { type: 'object' },
              failingOperation: { type: 'string' }
            }
          }
        },
        unknown: { type: 'array', items: { type: 'object' } },
        needsStrengthening: { type: 'array', items: { type: 'string' } },
        interactions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'invariant', 'verification']
}));

// Task 4: Invariant Strengthening
export const invariantStrengtheningTask = defineTask('invariant-strengthening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strengthen invariants',
  agent: {
    name: 'invariant-strengthener',
    prompt: {
      role: 'verification specialist focusing on invariant design',
      task: 'Strengthen invariants to be more useful for proving the target property',
      context: args,
      instructions: [
        'Analyze why current invariants may be too weak:',
        '  - Not strong enough to prove property?',
        '  - Not inductive (needs auxiliary invariants)?',
        '  - Missing key relationships?',
        'Strengthen invariants by:',
        '  - Adding conjuncts',
        '  - Tightening bounds',
        '  - Adding auxiliary variables',
        '  - Combining related invariants',
        'Ensure strengthened invariant:',
        '  - Is still true (not too strong)',
        '  - Is inductive (self-maintaining)',
        '  - Implies the target property',
        'Document strengthening reasoning',
        'Save strengthened invariants to output directory'
      ],
      outputFormat: 'JSON with strongInvariants (array), strengtheningReasoning, implicationCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strongInvariants', 'strengtheningReasoning', 'artifacts'],
      properties: {
        strongInvariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              strengthened: { type: 'string' },
              technique: { type: 'string' },
              isInductive: { type: 'boolean' }
            }
          }
        },
        strengtheningReasoning: { type: 'array', items: { type: 'string' } },
        implicationCheck: {
          type: 'object',
          properties: {
            impliesProperty: { type: 'boolean' },
            proof: { type: 'string' }
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
  labels: ['agent', 'invariant', 'strengthening']
}));

// Task 5: Inductive Proof Construction
export const inductiveProofConstructionTask = defineTask('inductive-proof-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct inductive proofs',
  agent: {
    name: 'proof-constructor',
    prompt: {
      role: 'mathematical proof specialist',
      task: 'Construct formal inductive proofs using invariants',
      context: args,
      instructions: [
        'For each invariant, construct inductive proof:',
        '  1. Base case: Prove I(s₀) for initial state s₀',
        '  2. Inductive step: ∀s,s\'. I(s) ∧ T(s,s\') → I(s\')',
        'Structure the proof clearly:',
        '  - State what is being proven',
        '  - Assumptions used',
        '  - Step-by-step reasoning',
        '  - Conclusion',
        'Handle each operation separately in inductive step',
        'Combine invariants to prove target property:',
        '  - Show invariants imply property',
        '  - Complete the argument',
        'Document proof dependencies',
        'Save proofs to output directory'
      ],
      outputFormat: 'JSON with provenInvariants (array), proofs (array with invariant, baseCase, inductiveStep), propertyProof, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['provenInvariants', 'proofs', 'artifacts'],
      properties: {
        provenInvariants: { type: 'array', items: { type: 'string' } },
        proofs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              invariant: { type: 'string' },
              baseCase: { type: 'string' },
              inductiveStep: { type: 'string' },
              complete: { type: 'boolean' }
            }
          }
        },
        propertyProof: {
          type: 'object',
          properties: {
            property: { type: 'string' },
            usedInvariants: { type: 'array', items: { type: 'string' } },
            argument: { type: 'string' }
          }
        },
        proofDependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'invariant', 'proof-construction']
}));

// Task 6: Loop Invariant Analysis
export const loopInvariantAnalysisTask = defineTask('loop-invariant-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze loop invariants',
  agent: {
    name: 'loop-analyst',
    prompt: {
      role: 'program correctness specialist',
      task: 'Analyze and design loop invariants',
      context: args,
      instructions: [
        'Identify loops/iterations in the system',
        'For each loop, design a loop invariant that:',
        '  1. Is true before the loop starts (init)',
        '  2. Is preserved by each iteration (maintenance)',
        '  3. Combined with termination, proves postcondition (termination)',
        'Structure loop invariant:',
        '  - What progress has been made?',
        '  - What remains to be done?',
        '  - What properties are maintained?',
        'Verify loop invariant:',
        '  - Initialization: Prove before first iteration',
        '  - Maintenance: Prove preserved by iteration',
        '  - Termination: Prove loop terminates',
        '  - Postcondition: Prove final result',
        'Document loop reasoning',
        'Save loop invariant analysis to output directory'
      ],
      outputFormat: 'JSON with loopInvariants (array with loop, invariant, init, maintenance, termination, postcondition), progressFunctions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['loopInvariants', 'artifacts'],
      properties: {
        loopInvariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loop: { type: 'string' },
              invariant: { type: 'string' },
              initialization: { type: 'string' },
              maintenance: { type: 'string' },
              terminationProof: { type: 'string' },
              postconditionDerivation: { type: 'string' }
            }
          }
        },
        progressFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loop: { type: 'string' },
              function: { type: 'string' },
              decreaseProof: { type: 'string' }
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
  labels: ['agent', 'invariant', 'loop-analysis']
}));

// Task 7: Invariant Application
export const invariantApplicationTask = defineTask('invariant-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply invariants',
  agent: {
    name: 'application-specialist',
    prompt: {
      role: 'software engineering specialist',
      task: 'Show how invariants can be applied practically',
      context: args,
      instructions: [
        'Document applications of verified invariants:',
        '  - Correctness proofs (prove desired property)',
        '  - Bug detection (invariant violation indicates bug)',
        '  - Runtime checking (assert invariants)',
        '  - Optimization (exploit invariant knowledge)',
        'Generate practical recommendations:',
        '  - Where to add assertions',
        '  - How to use for testing',
        '  - Documentation of invariants',
        'Consider invariant-based design:',
        '  - Design operations to maintain invariants',
        '  - Use invariants to guide implementation',
        'Identify invariants suitable for runtime checking',
        'Save application recommendations to output directory'
      ],
      outputFormat: 'JSON with applications (correctness, bugDetection, runtime, optimization), recommendations, runtimeCheckable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'recommendations', 'artifacts'],
      properties: {
        applications: {
          type: 'object',
          properties: {
            correctness: { type: 'array', items: { type: 'object' } },
            bugDetection: { type: 'array', items: { type: 'string' } },
            runtime: { type: 'array', items: { type: 'string' } },
            optimization: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        runtimeCheckable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              invariant: { type: 'string' },
              checkLocation: { type: 'string' },
              overhead: { type: 'string' }
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
  labels: ['agent', 'invariant', 'application']
}));

// Task 8: Invariant Synthesis
export const invariantSynthesisTask = defineTask('invariant-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize invariant analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior verification engineer',
      task: 'Synthesize invariant-based reasoning analysis',
      context: args,
      instructions: [
        'Summarize invariant discovery and verification:',
        '  - Key invariants identified',
        '  - Proofs constructed',
        '  - Loop invariants designed',
        'Assess analysis strength (0-100):',
        '  - Invariants proven?',
        '  - Property proven?',
        '  - Proofs complete?',
        '  - Applicable to practice?',
        'State main conclusions',
        'Identify limitations and gaps',
        'Recommend next steps',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, strengthScore, conclusions, limitations, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'strengthScore', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            keyInvariants: { type: 'array', items: { type: 'string' } },
            proofsConstructed: { type: 'number' },
            propertyProven: { type: 'boolean' }
          }
        },
        strengthScore: { type: 'number', minimum: 0, maximum: 100 },
        conclusions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'invariant', 'synthesis']
}));
