/**
 * @process computer-science/decidability-analysis
 * @description Analyze decidability and computability properties of problems using Turing machine framework and reduction techniques
 * @inputs { problemDescription: string, languageDefinition: string }
 * @outputs { success: boolean, decidabilityClassification: object, proofDocumentation: object, computabilityLandscape: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    languageDefinition = '',
    relatedProblems = [],
    outputDir = 'decidability-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Decidability Analysis');

  // ============================================================================
  // PHASE 1: TURING MACHINE MODELING
  // ============================================================================

  ctx.log('info', 'Phase 1: Modeling problem in Turing machine framework');
  const turingMachineModeling = await ctx.task(turingMachineModelingTask, {
    problemDescription,
    languageDefinition,
    outputDir
  });

  artifacts.push(...turingMachineModeling.artifacts);

  // ============================================================================
  // PHASE 2: DECIDABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing decidability');
  const decidabilityCheck = await ctx.task(decidabilityCheckTask, {
    problemDescription,
    turingMachineModeling,
    outputDir
  });

  artifacts.push(...decidabilityCheck.artifacts);

  // ============================================================================
  // PHASE 3: RICE'S THEOREM APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying Rice\'s theorem for language properties');
  const ricesTheoremAnalysis = await ctx.task(ricesTheoremAnalysisTask, {
    problemDescription,
    turingMachineModeling,
    outputDir
  });

  artifacts.push(...ricesTheoremAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: UNDECIDABILITY PROOF CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing undecidability proof via reduction');
  const undecidabilityProof = await ctx.task(undecidabilityProofTask, {
    problemDescription,
    turingMachineModeling,
    decidabilityCheck,
    ricesTheoremAnalysis,
    outputDir
  });

  artifacts.push(...undecidabilityProof.artifacts);

  // ============================================================================
  // PHASE 5: SEMI-DECIDABILITY (RE) ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing semi-decidability (RE membership)');
  const semiDecidabilityAnalysis = await ctx.task(semiDecidabilityAnalysisTask, {
    problemDescription,
    turingMachineModeling,
    undecidabilityProof,
    outputDir
  });

  artifacts.push(...semiDecidabilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: ARITHMETIC HIERARCHY PLACEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Placing problem in arithmetic hierarchy');
  const hierarchyPlacement = await ctx.task(arithmeticHierarchyPlacementTask, {
    problemDescription,
    turingMachineModeling,
    semiDecidabilityAnalysis,
    outputDir
  });

  artifacts.push(...hierarchyPlacement.artifacts);

  // ============================================================================
  // PHASE 7: DECIDABILITY BOUNDARIES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Documenting decidability boundaries');
  const boundariesDocumentation = await ctx.task(decidabilityBoundariesTask, {
    problemDescription,
    decidabilityCheck,
    semiDecidabilityAnalysis,
    hierarchyPlacement,
    relatedProblems,
    outputDir
  });

  artifacts.push(...boundariesDocumentation.artifacts);

  // ============================================================================
  // PHASE 8: COMPUTABILITY LANDSCAPE PLACEMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating computability landscape report');
  const landscapeReport = await ctx.task(computabilityLandscapeTask, {
    problemDescription,
    turingMachineModeling,
    decidabilityCheck,
    undecidabilityProof,
    semiDecidabilityAnalysis,
    hierarchyPlacement,
    boundariesDocumentation,
    outputDir
  });

  artifacts.push(...landscapeReport.artifacts);

  // Breakpoint: Review decidability analysis
  await ctx.breakpoint({
    question: `Decidability analysis complete. Classification: ${decidabilityCheck.classification}. Review analysis?`,
    title: 'Decidability Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        classification: decidabilityCheck.classification,
        isDecidable: decidabilityCheck.isDecidable,
        isSemiDecidable: semiDecidabilityAnalysis.isSemiDecidable,
        hierarchyLevel: hierarchyPlacement.level,
        ricesTheoremApplicable: ricesTheoremAnalysis.applicable
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemDescription,
    decidabilityClassification: {
      isDecidable: decidabilityCheck.isDecidable,
      classification: decidabilityCheck.classification,
      isSemiDecidable: semiDecidabilityAnalysis.isSemiDecidable,
      isCoSemiDecidable: semiDecidabilityAnalysis.isCoSemiDecidable
    },
    proofDocumentation: {
      ricesTheoremApplicable: ricesTheoremAnalysis.applicable,
      undecidabilityProofMethod: undecidabilityProof.proofMethod,
      reductionSource: undecidabilityProof.reductionSource,
      proofDocumentPath: undecidabilityProof.proofDocumentPath
    },
    computabilityLandscape: {
      arithmeticHierarchyLevel: hierarchyPlacement.level,
      relatedProblems: boundariesDocumentation.relatedProblems,
      decidabilityBoundary: boundariesDocumentation.boundary,
      reportPath: landscapeReport.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/decidability-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Turing Machine Modeling
export const turingMachineModelingTask = defineTask('turing-machine-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model problem in Turing machine framework',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'computability theory specialist',
      task: 'Model the computational problem in the Turing machine framework',
      context: args,
      instructions: [
        'Define the language L corresponding to the problem',
        'Specify input encoding for Turing machine',
        'Define what acceptance/rejection means for the problem',
        'Identify if problem is about TM behavior (language property)',
        'Distinguish decision problem from function problem if applicable',
        'Note any oracle TM considerations',
        'Document formal TM model completely',
        'Generate TM modeling specification'
      ],
      outputFormat: 'JSON with languageDefinition, inputEncoding, acceptanceCriteria, isLanguageProperty, tmModel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['languageDefinition', 'inputEncoding', 'artifacts'],
      properties: {
        languageDefinition: { type: 'string' },
        inputEncoding: { type: 'string' },
        acceptanceCriteria: { type: 'string' },
        isLanguageProperty: { type: 'boolean' },
        languagePropertyType: { type: 'string' },
        tmModel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'turing-machine']
}));

// Task 2: Decidability Check
export const decidabilityCheckTask = defineTask('decidability-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decidability',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'theorem-prover-interface'],
    prompt: {
      role: 'decidability specialist',
      task: 'Determine if the problem is decidable and classify accordingly',
      context: args,
      instructions: [
        'Check if a decider (TM that always halts) exists',
        'If decidable, outline the decision procedure',
        'If potentially undecidable, note evidence',
        'Classify: decidable, semi-decidable, co-semi-decidable, or neither',
        'Consider known decidable fragments',
        'Note any decidable restrictions of the problem',
        'Document classification reasoning',
        'Generate decidability analysis report'
      ],
      outputFormat: 'JSON with isDecidable, classification, decisionProcedure, evidence, decidableFragments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isDecidable', 'classification', 'artifacts'],
      properties: {
        isDecidable: { type: 'boolean' },
        classification: { type: 'string', enum: ['decidable', 'semi-decidable', 'co-semi-decidable', 'undecidable-both'] },
        decisionProcedure: { type: 'string' },
        evidence: { type: 'array', items: { type: 'string' } },
        decidableFragments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fragment: { type: 'string' },
              restriction: { type: 'string' }
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
  labels: ['agent', 'decidability', 'classification']
}));

// Task 3: Rice's Theorem Analysis
export const ricesTheoremAnalysisTask = defineTask('rices-theorem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Rice\'s theorem for language properties',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'complexity-class-oracle', 'latex-proof-formatter'],
    prompt: {
      role: 'Rice\'s theorem specialist',
      task: 'Apply Rice\'s theorem to determine undecidability of language properties',
      context: args,
      instructions: [
        'Determine if problem is a non-trivial property of RE languages',
        'A property P is non-trivial if some TMs satisfy P and some do not',
        'If applicable, Rice\'s theorem immediately proves undecidability',
        'Verify property is semantic (about language, not syntax)',
        'Note if Rice\'s theorem applies or why it does not',
        'For non-applicable cases, explain why',
        'Document Rice\'s theorem application completely',
        'Generate Rice\'s theorem analysis report'
      ],
      outputFormat: 'JSON with applicable, isLanguageProperty, isNonTrivial, isSemantic, undecidabilityImplied, reasoning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'artifacts'],
      properties: {
        applicable: { type: 'boolean' },
        isLanguageProperty: { type: 'boolean' },
        isNonTrivial: { type: 'boolean' },
        isSemantic: { type: 'boolean' },
        undecidabilityImplied: { type: 'boolean' },
        reasoning: { type: 'string' },
        examplesSatisfying: { type: 'array', items: { type: 'string' } },
        examplesNotSatisfying: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'rices-theorem']
}));

// Task 4: Undecidability Proof
export const undecidabilityProofTask = defineTask('undecidability-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct undecidability proof via reduction',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'undecidability proof specialist',
      task: 'Construct formal undecidability proof via reduction from halting problem or other undecidable problem',
      context: args,
      instructions: [
        'Select source undecidable problem (HALT, A_TM, etc.)',
        'Construct many-one reduction from source to target',
        'Define reduction function f that maps instances',
        'Prove reduction correctness: x in source iff f(x) in target',
        'Prove reduction is computable',
        'Conclude target is undecidable',
        'Consider alternative proof methods if direct reduction fails',
        'Document complete undecidability proof'
      ],
      outputFormat: 'JSON with isUndecidable, proofMethod, reductionSource, reductionConstruction, correctnessProof, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isUndecidable', 'proofMethod', 'artifacts'],
      properties: {
        isUndecidable: { type: 'boolean' },
        proofMethod: { type: 'string', enum: ['many-one-reduction', 'turing-reduction', 'rices-theorem', 'diagonalization', 'not-applicable'] },
        reductionSource: { type: 'string' },
        reductionConstruction: { type: 'string' },
        correctnessProof: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'undecidability-proof']
}));

// Task 5: Semi-Decidability Analysis
export const semiDecidabilityAnalysisTask = defineTask('semi-decidability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze semi-decidability (RE membership)',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'theorem-prover-interface'],
    prompt: {
      role: 'recursively enumerable language specialist',
      task: 'Determine if problem is semi-decidable (RE) or co-semi-decidable (co-RE)',
      context: args,
      instructions: [
        'Check if language is recursively enumerable (RE)',
        'RE: there exists TM that accepts exactly the language (may loop on no-instances)',
        'Construct recognizer if language is RE',
        'Check if complement is RE (co-RE)',
        'If both RE and co-RE, then decidable',
        'If neither, place appropriately in hierarchy',
        'Document semi-decidability analysis',
        'Generate semi-decidability report'
      ],
      outputFormat: 'JSON with isSemiDecidable, isCoSemiDecidable, recognizerDescription, complementAnalysis, classification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isSemiDecidable', 'isCoSemiDecidable', 'artifacts'],
      properties: {
        isSemiDecidable: { type: 'boolean' },
        isCoSemiDecidable: { type: 'boolean' },
        recognizerDescription: { type: 'string' },
        complementAnalysis: { type: 'string' },
        classification: { type: 'string', enum: ['RE', 'co-RE', 'RE-and-co-RE', 'neither'] },
        enumerationProcedure: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'semi-decidability']
}));

// Task 6: Arithmetic Hierarchy Placement
export const arithmeticHierarchyPlacementTask = defineTask('arithmetic-hierarchy-placement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Place problem in arithmetic hierarchy',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'arithmetic hierarchy specialist',
      task: 'Place the problem in the arithmetic hierarchy if applicable',
      context: args,
      instructions: [
        'Determine quantifier complexity of problem definition',
        'Sigma_1 = RE (existential)',
        'Pi_1 = co-RE (universal)',
        'Delta_1 = decidable (both)',
        'Sigma_n, Pi_n for higher levels',
        'Identify if problem is complete for its level',
        'Note any oracle characterizations',
        'Document hierarchy placement',
        'Generate hierarchy placement report'
      ],
      outputFormat: 'JSON with level, levelName, isComplete, quantifierStructure, oracleCharacterization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['level', 'levelName', 'artifacts'],
      properties: {
        level: { type: 'string' },
        levelName: { type: 'string' },
        isComplete: { type: 'boolean' },
        quantifierStructure: { type: 'string' },
        oracleCharacterization: { type: 'string' },
        alternatingQuantifiers: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'arithmetic-hierarchy']
}));

// Task 7: Decidability Boundaries
export const decidabilityBoundariesTask = defineTask('decidability-boundaries', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document decidability boundaries',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'decidability boundaries specialist',
      task: 'Document the boundaries between decidable and undecidable variants of the problem',
      context: args,
      instructions: [
        'Identify decidable restrictions/variants of undecidable problems',
        'Identify where undecidability begins as restrictions are lifted',
        'Document the precise boundary conditions',
        'Note any sharp transitions in decidability',
        'Identify related problems with known decidability status',
        'Create decidability landscape diagram',
        'Document practical implications of boundaries',
        'Generate boundaries documentation'
      ],
      outputFormat: 'JSON with boundary, decidableVariants, undecidableVariants, transitions, relatedProblems, practicalImplications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundary', 'decidableVariants', 'undecidableVariants', 'artifacts'],
      properties: {
        boundary: { type: 'string' },
        decidableVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variant: { type: 'string' },
              restriction: { type: 'string' },
              complexity: { type: 'string' }
            }
          }
        },
        undecidableVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variant: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        transitions: { type: 'array', items: { type: 'string' } },
        relatedProblems: { type: 'array', items: { type: 'string' } },
        practicalImplications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'boundaries']
}));

// Task 8: Computability Landscape Report
export const computabilityLandscapeTask = defineTask('computability-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate computability landscape report',
  agent: {
    name: 'complexity-theorist',
    skills: ['latex-proof-formatter', 'complexity-class-oracle'],
    prompt: {
      role: 'computability documentation specialist',
      task: 'Generate comprehensive computability landscape report',
      context: args,
      instructions: [
        'Create executive summary of decidability analysis',
        'Document problem classification in computability hierarchy',
        'Include all proofs (undecidability, semi-decidability)',
        'Present arithmetic hierarchy placement',
        'Document decidability boundaries',
        'Include visual diagrams of hierarchy placement',
        'Summarize practical implications',
        'Format as professional academic report'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, classification, keyResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        classification: {
          type: 'object',
          properties: {
            decidability: { type: 'string' },
            hierarchyLevel: { type: 'string' },
            completeness: { type: 'string' }
          }
        },
        keyResults: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'decidability', 'documentation']
}));
