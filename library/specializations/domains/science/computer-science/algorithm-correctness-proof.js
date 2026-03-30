/**
 * @process computer-science/algorithm-correctness-proof
 * @description Formally prove algorithm correctness using mathematical techniques including loop invariants, induction, and termination proofs
 * @inputs { algorithmDescription: string, pseudocode: string, specification: object }
 * @outputs { success: boolean, correctnessProof: object, invariants: array, terminationProof: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmDescription,
    pseudocode = '',
    specification = {},
    proofStyle = 'structured',
    outputDir = 'correctness-proof-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Algorithm Correctness Proof');

  // ============================================================================
  // PHASE 1: SPECIFICATION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining preconditions, postconditions, and invariants');
  const specificationDefinition = await ctx.task(specificationDefinitionTask, {
    algorithmDescription,
    pseudocode,
    specification,
    outputDir
  });

  artifacts.push(...specificationDefinition.artifacts);

  // ============================================================================
  // PHASE 2: LOOP INVARIANT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying and specifying loop invariants');
  const loopInvariantAnalysis = await ctx.task(loopInvariantAnalysisTask, {
    algorithmDescription,
    pseudocode,
    specificationDefinition,
    outputDir
  });

  artifacts.push(...loopInvariantAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: INDUCTION PROOF FOR RECURSIVE ALGORITHMS
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying proof by induction for recursive components');
  const inductionProof = await ctx.task(inductionProofTask, {
    algorithmDescription,
    pseudocode,
    specificationDefinition,
    outputDir
  });

  artifacts.push(...inductionProof.artifacts);

  // ============================================================================
  // PHASE 4: LOOP INVARIANT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Verifying loop invariants (initialization, maintenance, termination)');
  const invariantVerification = await ctx.task(invariantVerificationTask, {
    algorithmDescription,
    pseudocode,
    specificationDefinition,
    loopInvariantAnalysis,
    outputDir
  });

  artifacts.push(...invariantVerification.artifacts);

  // ============================================================================
  // PHASE 5: TERMINATION PROOF
  // ============================================================================

  ctx.log('info', 'Phase 5: Proving algorithm termination');
  const terminationProof = await ctx.task(terminationProofTask, {
    algorithmDescription,
    pseudocode,
    loopInvariantAnalysis,
    outputDir
  });

  artifacts.push(...terminationProof.artifacts);

  // ============================================================================
  // PHASE 6: EDGE CASE AND BOUNDARY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling edge cases and boundary conditions');
  const edgeCaseAnalysis = await ctx.task(edgeCaseAnalysisTask, {
    algorithmDescription,
    pseudocode,
    specificationDefinition,
    outputDir
  });

  artifacts.push(...edgeCaseAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: COMPLETE PROOF ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 7: Assembling complete correctness proof');
  const completeProof = await ctx.task(completeProofAssemblyTask, {
    algorithmDescription,
    pseudocode,
    specificationDefinition,
    loopInvariantAnalysis,
    inductionProof,
    invariantVerification,
    terminationProof,
    edgeCaseAnalysis,
    proofStyle,
    outputDir
  });

  artifacts.push(...completeProof.artifacts);

  // Breakpoint: Review correctness proof
  await ctx.breakpoint({
    question: `Correctness proof complete. Proof status: ${completeProof.proofStatus}. Review proof documentation?`,
    title: 'Algorithm Correctness Proof Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        proofStatus: completeProof.proofStatus,
        loopCount: loopInvariantAnalysis.loopCount,
        invariantsVerified: invariantVerification.allVerified,
        terminationProved: terminationProof.terminationProved,
        edgeCasesCovered: edgeCaseAnalysis.edgeCasesCovered
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithmDescription,
    correctnessProof: {
      proofStatus: completeProof.proofStatus,
      preconditions: specificationDefinition.preconditions,
      postconditions: specificationDefinition.postconditions,
      proofDocumentPath: completeProof.documentPath
    },
    invariants: loopInvariantAnalysis.invariants,
    invariantVerification: {
      allVerified: invariantVerification.allVerified,
      verificationDetails: invariantVerification.verificationDetails
    },
    inductionProof: {
      isRecursive: inductionProof.isRecursive,
      baseCase: inductionProof.baseCase,
      inductiveStep: inductionProof.inductiveStep
    },
    terminationProof: {
      terminationProved: terminationProof.terminationProved,
      variantFunction: terminationProof.variantFunction,
      boundedDecrease: terminationProof.boundedDecrease
    },
    edgeCases: {
      identified: edgeCaseAnalysis.edgeCases,
      covered: edgeCaseAnalysis.edgeCasesCovered
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/algorithm-correctness-proof',
      timestamp: startTime,
      proofStyle,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Specification Definition
export const specificationDefinitionTask = defineTask('specification-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define preconditions, postconditions, and invariants',
  agent: {
    name: 'algorithm-analyst',
    skills: ['loop-invariant-generator', 'termination-analyzer', 'theorem-prover-interface'],
    prompt: {
      role: 'formal methods specialist',
      task: 'Define formal specification for the algorithm including preconditions, postconditions, and global invariants',
      context: args,
      instructions: [
        'Analyze algorithm intent and expected behavior',
        'Define preconditions (requirements on input)',
        'Define postconditions (guarantees on output)',
        'Express conditions in formal logical notation',
        'Identify any global invariants that must hold',
        'Document any assumptions about data structures',
        'Specify error conditions and exceptional behavior',
        'Generate formal specification document'
      ],
      outputFormat: 'JSON with preconditions, postconditions, globalInvariants, assumptions, formalNotation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preconditions', 'postconditions', 'artifacts'],
      properties: {
        preconditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              formalNotation: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        postconditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              formalNotation: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        globalInvariants: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'correctness-proof', 'specification']
}));

// Task 2: Loop Invariant Analysis
export const loopInvariantAnalysisTask = defineTask('loop-invariant-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and specify loop invariants',
  agent: {
    name: 'algorithm-analyst',
    skills: ['loop-invariant-generator', 'termination-analyzer'],
    prompt: {
      role: 'algorithm verification specialist',
      task: 'Identify all loops and define appropriate loop invariants for correctness proof',
      context: args,
      instructions: [
        'Identify all loops in the algorithm (for, while, do-while)',
        'For each loop, define a loop invariant',
        'Ensure invariant captures progress toward postcondition',
        'Express invariants in formal logical notation',
        'Identify relationships between nested loop invariants',
        'Document what the invariant captures about algorithm state',
        'Ensure invariant is strong enough to imply postcondition',
        'Generate loop invariant specification document'
      ],
      outputFormat: 'JSON with loopCount, invariants (array with loop location, invariant statement, formal notation), nestedRelationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['loopCount', 'invariants', 'artifacts'],
      properties: {
        loopCount: { type: 'number' },
        invariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopId: { type: 'string' },
              loopLocation: { type: 'string' },
              loopType: { type: 'string', enum: ['for', 'while', 'do-while'] },
              invariant: { type: 'string' },
              formalNotation: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        nestedRelationships: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'correctness-proof', 'loop-invariants']
}));

// Task 3: Induction Proof
export const inductionProofTask = defineTask('induction-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply proof by induction for recursive algorithms',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'loop-invariant-generator'],
    prompt: {
      role: 'mathematician specializing in mathematical induction',
      task: 'Apply structural or strong induction to prove correctness of recursive algorithms',
      context: args,
      instructions: [
        'Determine if algorithm has recursive structure',
        'Choose appropriate induction type (weak, strong, structural)',
        'State and prove base case(s)',
        'State inductive hypothesis clearly',
        'Prove inductive step using hypothesis',
        'Handle multiple recursive calls if present',
        'Document complete induction proof',
        'Verify proof covers all recursive cases'
      ],
      outputFormat: 'JSON with isRecursive, inductionType, baseCase, inductiveHypothesis, inductiveStep, proofComplete, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isRecursive', 'artifacts'],
      properties: {
        isRecursive: { type: 'boolean' },
        inductionType: { type: 'string', enum: ['weak', 'strong', 'structural', 'not-applicable'] },
        baseCase: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            proof: { type: 'string' }
          }
        },
        inductiveHypothesis: { type: 'string' },
        inductiveStep: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            proof: { type: 'string' }
          }
        },
        multipleRecursiveCalls: { type: 'boolean' },
        proofComplete: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'correctness-proof', 'induction']
}));

// Task 4: Invariant Verification
export const invariantVerificationTask = defineTask('invariant-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify loop invariants (initialization, maintenance, termination)',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['loop-invariant-generator', 'theorem-prover-interface'],
    prompt: {
      role: 'formal verification specialist',
      task: 'Verify that loop invariants satisfy the three required properties',
      context: args,
      instructions: [
        'For each loop invariant, prove INITIALIZATION: invariant holds before first iteration',
        'Prove MAINTENANCE: if invariant holds before iteration, it holds after',
        'Prove TERMINATION: when loop terminates, invariant implies postcondition',
        'Use formal logical reasoning for each proof',
        'Document any auxiliary lemmas needed',
        'Identify any gaps or assumptions in proofs',
        'Generate verification report for each invariant'
      ],
      outputFormat: 'JSON with allVerified, verificationDetails (per invariant: initialization, maintenance, termination proofs), gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allVerified', 'verificationDetails', 'artifacts'],
      properties: {
        allVerified: { type: 'boolean' },
        verificationDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopId: { type: 'string' },
              invariant: { type: 'string' },
              initialization: {
                type: 'object',
                properties: {
                  proved: { type: 'boolean' },
                  proof: { type: 'string' }
                }
              },
              maintenance: {
                type: 'object',
                properties: {
                  proved: { type: 'boolean' },
                  proof: { type: 'string' }
                }
              },
              termination: {
                type: 'object',
                properties: {
                  proved: { type: 'boolean' },
                  proof: { type: 'string' }
                }
              }
            }
          }
        },
        auxiliaryLemmas: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'correctness-proof', 'verification']
}));

// Task 5: Termination Proof
export const terminationProofTask = defineTask('termination-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove algorithm termination',
  agent: {
    name: 'algorithm-analyst',
    skills: ['termination-analyzer', 'loop-invariant-generator'],
    prompt: {
      role: 'termination analysis specialist',
      task: 'Prove that the algorithm terminates for all valid inputs',
      context: args,
      instructions: [
        'Identify all loops and recursive calls',
        'Define variant function (ranking function) for each loop',
        'Prove variant is bounded below (e.g., non-negative integer)',
        'Prove variant strictly decreases each iteration',
        'For recursion, prove recursive calls are on smaller inputs',
        'Handle mutual recursion if present',
        'Document well-founded ordering used',
        'Generate complete termination proof'
      ],
      outputFormat: 'JSON with terminationProved, variantFunction, boundedBelow, strictDecrease, wellFoundedOrdering, proofDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terminationProved', 'artifacts'],
      properties: {
        terminationProved: { type: 'boolean' },
        variantFunction: { type: 'string' },
        boundedBelow: {
          type: 'object',
          properties: {
            proved: { type: 'boolean' },
            lowerBound: { type: 'string' },
            proof: { type: 'string' }
          }
        },
        boundedDecrease: {
          type: 'object',
          properties: {
            proved: { type: 'boolean' },
            proof: { type: 'string' }
          }
        },
        wellFoundedOrdering: { type: 'string' },
        loopVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopId: { type: 'string' },
              variant: { type: 'string' },
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
  labels: ['agent', 'correctness-proof', 'termination']
}));

// Task 6: Edge Case Analysis
export const edgeCaseAnalysisTask = defineTask('edge-case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle edge cases and boundary conditions',
  agent: {
    name: 'algorithm-analyst',
    skills: ['loop-invariant-generator'],
    prompt: {
      role: 'software testing and verification specialist',
      task: 'Identify and verify handling of edge cases and boundary conditions',
      context: args,
      instructions: [
        'Identify edge cases from preconditions (empty input, single element, etc.)',
        'Identify boundary conditions (max values, overflow potential)',
        'Verify algorithm handles empty/null inputs correctly',
        'Verify behavior at array/collection boundaries',
        'Check for off-by-one errors in loops',
        'Verify handling of duplicate elements if applicable',
        'Document edge case behavior and correctness',
        'Generate edge case coverage report'
      ],
      outputFormat: 'JSON with edgeCases (array), edgeCasesCovered (boolean), boundaryConditions, offByOneAnalysis, coverageReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['edgeCases', 'edgeCasesCovered', 'artifacts'],
      properties: {
        edgeCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              input: { type: 'string' },
              expectedOutput: { type: 'string' },
              handledCorrectly: { type: 'boolean' },
              explanation: { type: 'string' }
            }
          }
        },
        edgeCasesCovered: { type: 'boolean' },
        boundaryConditions: { type: 'array', items: { type: 'string' } },
        offByOneAnalysis: {
          type: 'object',
          properties: {
            potentialIssues: { type: 'array', items: { type: 'string' } },
            verified: { type: 'boolean' }
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
  labels: ['agent', 'correctness-proof', 'edge-cases']
}));

// Task 7: Complete Proof Assembly
export const completeProofAssemblyTask = defineTask('complete-proof-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete correctness proof',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'technical writer specializing in formal proofs',
      task: 'Assemble all proof components into a complete, structured correctness proof document',
      context: args,
      instructions: [
        'Create structured proof document with clear sections',
        'Begin with algorithm specification (pre/postconditions)',
        'Present loop invariants with verification proofs',
        'Include induction proof for recursive components',
        'Present termination proof with variant functions',
        'Document edge case coverage',
        'Use consistent formal notation throughout',
        'Include proof summary and conclusions',
        'Assess overall proof completeness and soundness',
        'Format as professional academic-style proof document'
      ],
      outputFormat: 'JSON with proofStatus, documentPath, proofSummary, completenessAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proofStatus', 'documentPath', 'artifacts'],
      properties: {
        proofStatus: { type: 'string', enum: ['complete', 'partial', 'incomplete'] },
        documentPath: { type: 'string' },
        proofSummary: { type: 'string' },
        completenessAssessment: {
          type: 'object',
          properties: {
            specificationComplete: { type: 'boolean' },
            invariantsVerified: { type: 'boolean' },
            inductionComplete: { type: 'boolean' },
            terminationProved: { type: 'boolean' },
            edgeCasesCovered: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'correctness-proof', 'documentation']
}));
