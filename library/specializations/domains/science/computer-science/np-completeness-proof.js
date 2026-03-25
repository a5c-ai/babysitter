/**
 * @process computer-science/np-completeness-proof
 * @description Establish NP-completeness of computational problems via reduction with gadget library
 * @inputs { problemDescription: string, nPMembershipProof: object }
 * @outputs { success: boolean, npCompletenessProof: object, reductionDetails: object, gadgetLibrary: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    nPMembershipProof = {},
    preferredSourceProblem = null,
    outputDir = 'np-completeness-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting NP-Completeness Proof');

  // ============================================================================
  // PHASE 1: NP MEMBERSHIP VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Verifying problem is in NP');
  const npMembershipVerification = await ctx.task(npMembershipVerificationTask, {
    problemDescription,
    nPMembershipProof,
    outputDir
  });

  artifacts.push(...npMembershipVerification.artifacts);

  if (!npMembershipVerification.isInNP) {
    return {
      success: false,
      error: 'Problem not shown to be in NP',
      npMembershipVerification,
      artifacts,
      metadata: {
        processId: 'computer-science/np-completeness-proof',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: SOURCE PROBLEM SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting source problem for reduction');
  const sourceSelection = await ctx.task(sourceSelectionTask, {
    problemDescription,
    preferredSourceProblem,
    outputDir
  });

  artifacts.push(...sourceSelection.artifacts);

  // ============================================================================
  // PHASE 3: REDUCTION TRANSFORMATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing polynomial-time transformation');
  const transformationDesign = await ctx.task(transformationDesignTask, {
    problemDescription,
    sourceSelection,
    outputDir
  });

  artifacts.push(...transformationDesign.artifacts);

  // ============================================================================
  // PHASE 4: GADGET CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing reduction gadgets');
  const gadgetConstruction = await ctx.task(gadgetConstructionTask, {
    problemDescription,
    sourceSelection,
    transformationDesign,
    outputDir
  });

  artifacts.push(...gadgetConstruction.artifacts);

  // ============================================================================
  // PHASE 5: CORRECTNESS PROOF (YES-INSTANCE TO YES-INSTANCE)
  // ============================================================================

  ctx.log('info', 'Phase 5: Proving yes-instance to yes-instance mapping');
  const forwardProof = await ctx.task(forwardProofTask, {
    problemDescription,
    transformationDesign,
    gadgetConstruction,
    outputDir
  });

  artifacts.push(...forwardProof.artifacts);

  // ============================================================================
  // PHASE 6: CORRECTNESS PROOF (NO-INSTANCE TO NO-INSTANCE)
  // ============================================================================

  ctx.log('info', 'Phase 6: Proving no-instance to no-instance mapping (contrapositive)');
  const backwardProof = await ctx.task(backwardProofTask, {
    problemDescription,
    transformationDesign,
    gadgetConstruction,
    outputDir
  });

  artifacts.push(...backwardProof.artifacts);

  // ============================================================================
  // PHASE 7: EFFICIENCY PROOF (POLYNOMIAL CONSTRUCTION TIME)
  // ============================================================================

  ctx.log('info', 'Phase 7: Proving polynomial construction time');
  const efficiencyProof = await ctx.task(efficiencyProofTask, {
    transformationDesign,
    gadgetConstruction,
    outputDir
  });

  artifacts.push(...efficiencyProof.artifacts);

  // ============================================================================
  // PHASE 8: GADGET LIBRARY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting gadgets for future reductions');
  const gadgetLibrary = await ctx.task(gadgetLibraryTask, {
    problemDescription,
    gadgetConstruction,
    outputDir
  });

  artifacts.push(...gadgetLibrary.artifacts);

  // ============================================================================
  // PHASE 9: COMPLETE PROOF ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 9: Assembling complete NP-completeness proof');
  const completeProof = await ctx.task(completeProofTask, {
    problemDescription,
    npMembershipVerification,
    sourceSelection,
    transformationDesign,
    gadgetConstruction,
    forwardProof,
    backwardProof,
    efficiencyProof,
    outputDir
  });

  artifacts.push(...completeProof.artifacts);

  const proofComplete = forwardProof.proved && backwardProof.proved && efficiencyProof.proved;

  // Breakpoint: Review NP-completeness proof
  await ctx.breakpoint({
    question: `NP-completeness proof ${proofComplete ? 'complete' : 'incomplete'}. Source: ${sourceSelection.selectedProblem}. Review proof?`,
    title: 'NP-Completeness Proof Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        isInNP: npMembershipVerification.isInNP,
        sourceProblem: sourceSelection.selectedProblem,
        forwardProofComplete: forwardProof.proved,
        backwardProofComplete: backwardProof.proved,
        polynomialTime: efficiencyProof.proved,
        gadgetCount: gadgetConstruction.gadgets?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: proofComplete,
    problemDescription,
    npCompletenessProof: {
      isNPComplete: proofComplete,
      npMembership: {
        isInNP: npMembershipVerification.isInNP,
        verifierDescription: npMembershipVerification.verifierDescription,
        certificateDescription: npMembershipVerification.certificateDescription
      },
      hardnessProof: {
        sourceProblem: sourceSelection.selectedProblem,
        forwardProofComplete: forwardProof.proved,
        backwardProofComplete: backwardProof.proved,
        polynomialTimeProved: efficiencyProof.proved
      },
      proofDocumentPath: completeProof.proofDocumentPath
    },
    reductionDetails: {
      sourceProblem: sourceSelection.selectedProblem,
      transformationDescription: transformationDesign.transformationDescription,
      transformationComplexity: efficiencyProof.constructionComplexity
    },
    gadgetLibrary: gadgetLibrary.gadgets,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/np-completeness-proof',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: NP Membership Verification
export const npMembershipVerificationTask = defineTask('np-membership-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify problem is in NP',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'asymptotic-notation-calculator', 'theorem-prover-interface'],
    prompt: {
      role: 'complexity theorist',
      task: 'Verify that the problem is in NP by constructing a polynomial-time verifier',
      context: args,
      instructions: [
        'Define the certificate (witness) for yes-instances',
        'Specify certificate size (must be polynomial in input size)',
        'Describe polynomial-time verification algorithm',
        'Prove verifier runs in polynomial time',
        'Prove completeness: yes-instances have valid certificates',
        'Prove soundness: no-instances have no valid certificates',
        'Document NP membership proof completely',
        'Generate NP membership verification report'
      ],
      outputFormat: 'JSON with isInNP, certificateDescription, certificateSize, verifierDescription, verifierComplexity, completenessProof, soundnessProof, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isInNP', 'certificateDescription', 'verifierDescription', 'artifacts'],
      properties: {
        isInNP: { type: 'boolean' },
        certificateDescription: { type: 'string' },
        certificateSize: { type: 'string' },
        verifierDescription: { type: 'string' },
        verifierComplexity: { type: 'string' },
        completenessProof: { type: 'string' },
        soundnessProof: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'np-membership']
}));

// Task 2: Source Problem Selection
export const sourceSelectionTask = defineTask('source-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select source problem for reduction',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder'],
    prompt: {
      role: 'NP-completeness reduction specialist',
      task: 'Select the most appropriate NP-complete source problem for reduction',
      context: args,
      instructions: [
        'Analyze target problem structure',
        'Consider classic NP-complete problems: SAT, 3-SAT, CLIQUE, VERTEX-COVER, etc.',
        'Evaluate structural similarity to source problems',
        'Consider graph problems: HAMILTONIAN-CYCLE, INDEPENDENT-SET, etc.',
        'Consider number problems: SUBSET-SUM, PARTITION, KNAPSACK',
        'Select source that minimizes gadget complexity',
        'Justify selection with structural reasoning',
        'Generate source selection report'
      ],
      outputFormat: 'JSON with selectedProblem, selectionRationale, alternativeProblems, structuralSimilarity, expectedDifficulty, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedProblem', 'selectionRationale', 'artifacts'],
      properties: {
        selectedProblem: { type: 'string' },
        selectionRationale: { type: 'string' },
        alternativeProblems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              suitability: { type: 'string' }
            }
          }
        },
        structuralSimilarity: { type: 'string' },
        expectedDifficulty: { type: 'string', enum: ['straightforward', 'moderate', 'complex'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'source-selection']
}));

// Task 3: Transformation Design
export const transformationDesignTask = defineTask('transformation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design polynomial-time transformation',
  agent: {
    name: 'complexity-theorist',
    skills: ['reduction-builder', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'reduction design specialist',
      task: 'Design the polynomial-time transformation from source to target problem',
      context: args,
      instructions: [
        'Define transformation function f mapping source instances to target instances',
        'Specify how each component of source instance maps to target',
        'Identify key invariants the transformation must preserve',
        'Design high-level transformation algorithm',
        'Identify gadgets needed for the transformation',
        'Document transformation step by step',
        'Provide examples of transformation on small instances',
        'Generate transformation design document'
      ],
      outputFormat: 'JSON with transformationDescription, mappingRules, invariants, algorithmOutline, gadgetsNeeded, examples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transformationDescription', 'mappingRules', 'artifacts'],
      properties: {
        transformationDescription: { type: 'string' },
        mappingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceComponent: { type: 'string' },
              targetComponent: { type: 'string' },
              mappingRule: { type: 'string' }
            }
          }
        },
        invariants: { type: 'array', items: { type: 'string' } },
        algorithmOutline: { type: 'string' },
        gadgetsNeeded: { type: 'array', items: { type: 'string' } },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceInstance: { type: 'string' },
              targetInstance: { type: 'string' }
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
  labels: ['agent', 'np-completeness', 'transformation']
}));

// Task 4: Gadget Construction
export const gadgetConstructionTask = defineTask('gadget-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct reduction gadgets',
  agent: {
    name: 'complexity-theorist',
    skills: ['reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'gadget design specialist',
      task: 'Design and construct gadgets for the NP-completeness reduction',
      context: args,
      instructions: [
        'Identify all gadgets needed for the reduction',
        'Design each gadget with clear purpose',
        'Specify gadget structure and construction',
        'Prove gadget correctness properties',
        'Document how gadgets interact',
        'Provide visual diagrams where helpful',
        'Note gadget size complexity',
        'Generate comprehensive gadget specifications'
      ],
      outputFormat: 'JSON with gadgets (array with name, purpose, construction, correctness, size), interactions, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gadgets', 'artifacts'],
      properties: {
        gadgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              construction: { type: 'string' },
              correctnessProperty: { type: 'string' },
              sizeComplexity: { type: 'string' }
            }
          }
        },
        interactions: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'gadgets']
}));

// Task 5: Forward Proof
export const forwardProofTask = defineTask('forward-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove yes-instance to yes-instance mapping',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'proof specialist',
      task: 'Prove that yes-instances of source problem map to yes-instances of target problem',
      context: args,
      instructions: [
        'Assume source instance is a yes-instance',
        'Show how source solution maps to target solution',
        'Use gadget correctness properties',
        'Prove target instance has a valid solution',
        'Document proof step by step',
        'Handle all cases if there are multiple gadget types',
        'Verify proof completeness',
        'Generate forward direction proof document'
      ],
      outputFormat: 'JSON with proved, proofStrategy, proofSteps, solutionMapping, gadgetProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proved', 'proofStrategy', 'proofSteps', 'artifacts'],
      properties: {
        proved: { type: 'boolean' },
        proofStrategy: { type: 'string' },
        proofSteps: { type: 'array', items: { type: 'string' } },
        solutionMapping: { type: 'string' },
        gadgetProperties: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'forward-proof']
}));

// Task 6: Backward Proof
export const backwardProofTask = defineTask('backward-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove no-instance to no-instance mapping',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'proof specialist',
      task: 'Prove that if target instance is a yes-instance, then source was a yes-instance (contrapositive of no to no)',
      context: args,
      instructions: [
        'Assume target instance has a valid solution',
        'Show how to extract source solution from target solution',
        'Use gadget correctness properties (reverse direction)',
        'Prove source instance must have been a yes-instance',
        'This proves contrapositive: no-instance maps to no-instance',
        'Document proof step by step',
        'Handle edge cases and special configurations',
        'Generate backward direction proof document'
      ],
      outputFormat: 'JSON with proved, proofStrategy, proofSteps, solutionExtraction, gadgetProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proved', 'proofStrategy', 'proofSteps', 'artifacts'],
      properties: {
        proved: { type: 'boolean' },
        proofStrategy: { type: 'string' },
        proofSteps: { type: 'array', items: { type: 'string' } },
        solutionExtraction: { type: 'string' },
        gadgetProperties: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'backward-proof']
}));

// Task 7: Efficiency Proof
export const efficiencyProofTask = defineTask('efficiency-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove polynomial construction time',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'latex-proof-formatter'],
    prompt: {
      role: 'complexity analysis specialist',
      task: 'Prove that the transformation can be computed in polynomial time',
      context: args,
      instructions: [
        'Analyze size of output instance in terms of input size',
        'Count number of gadgets constructed',
        'Analyze time to construct each gadget',
        'Prove total construction time is polynomial',
        'Express complexity as O(n^k) for specific k',
        'Note any preprocessing steps',
        'Document efficiency analysis completely',
        'Generate efficiency proof document'
      ],
      outputFormat: 'JSON with proved, constructionComplexity, outputSize, gadgetCounts, timeBreakdown, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proved', 'constructionComplexity', 'outputSize', 'artifacts'],
      properties: {
        proved: { type: 'boolean' },
        constructionComplexity: { type: 'string' },
        outputSize: { type: 'string' },
        gadgetCounts: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        timeBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              complexity: { type: 'string' }
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
  labels: ['agent', 'np-completeness', 'efficiency']
}));

// Task 8: Gadget Library
export const gadgetLibraryTask = defineTask('gadget-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document gadgets for future reductions',
  agent: {
    name: 'complexity-theorist',
    skills: ['reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'gadget documentation specialist',
      task: 'Create reusable gadget library documentation for future NP-completeness proofs',
      context: args,
      instructions: [
        'Document each gadget with complete specification',
        'Include visual diagrams and descriptions',
        'Note reusability for other reductions',
        'Specify correctness conditions',
        'Document composition rules for combining gadgets',
        'Note any variations or generalizations',
        'Create gadget reference cards',
        'Generate gadget library document'
      ],
      outputFormat: 'JSON with gadgets (array with full specs), reusabilityNotes, compositionRules, variations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gadgets', 'artifacts'],
      properties: {
        gadgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              construction: { type: 'string' },
              correctnessProperty: { type: 'string' },
              forwardBehavior: { type: 'string' },
              backwardBehavior: { type: 'string' },
              sizeComplexity: { type: 'string' },
              reusability: { type: 'string' }
            }
          }
        },
        compositionRules: { type: 'array', items: { type: 'string' } },
        variations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'np-completeness', 'gadget-library']
}));

// Task 9: Complete Proof Assembly
export const completeProofTask = defineTask('complete-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete NP-completeness proof',
  agent: {
    name: 'complexity-theorist',
    skills: ['latex-proof-formatter', 'complexity-class-oracle', 'reduction-builder'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Assemble complete NP-completeness proof document',
      context: args,
      instructions: [
        'Create theorem statement: "Problem X is NP-complete"',
        'Structure proof: (1) X in NP, (2) X is NP-hard',
        'Include complete NP membership proof',
        'Document reduction from source problem',
        'Include gadget constructions with diagrams',
        'Present forward and backward proofs',
        'Include efficiency analysis',
        'Add QED and conclusions',
        'Format as professional academic proof'
      ],
      outputFormat: 'JSON with proofDocumentPath, theoremStatement, proofOutline, completeness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proofDocumentPath', 'theoremStatement', 'artifacts'],
      properties: {
        proofDocumentPath: { type: 'string' },
        theoremStatement: { type: 'string' },
        proofOutline: { type: 'array', items: { type: 'string' } },
        completeness: {
          type: 'object',
          properties: {
            npMembership: { type: 'boolean' },
            npHardness: { type: 'boolean' },
            overall: { type: 'boolean' }
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
  labels: ['agent', 'np-completeness', 'documentation']
}));
