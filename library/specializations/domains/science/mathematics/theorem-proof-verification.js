/**
 * @process specializations/domains/science/mathematics/theorem-proof-verification
 * @description Formal verification of mathematical proofs using proof assistants (Lean, Coq, Isabelle).
 * Includes translating informal proofs into formal systems, checking logical consistency, and identifying gaps in reasoning.
 * @inputs { proofContent: string, theoremStatement: string, proofAssistant?: string, informalProof?: string, targetFormalism?: string }
 * @outputs { success: boolean, verificationResult: object, formalProof: string, gapsIdentified: array, counterexamplesSearched: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/theorem-proof-verification', {
 *   theoremStatement: 'For all natural numbers n, n^2 + n is even',
 *   proofContent: 'Consider n^2 + n = n(n+1). Since n and n+1 are consecutive integers, one must be even...',
 *   proofAssistant: 'lean',
 *   targetFormalism: 'lean4'
 * });
 *
 * @references
 * - Lean Prover: https://leanprover.github.io/
 * - Coq Proof Assistant: https://coq.inria.fr/
 * - Isabelle: https://isabelle.in.tum.de/
 * - Mathematical Components: https://math-comp.github.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    proofContent,
    theoremStatement,
    proofAssistant = 'lean',
    informalProof = '',
    targetFormalism = 'lean4'
  } = inputs;

  // Phase 1: Parse and Structure Informal Proof
  const proofParsing = await ctx.task(proofParsingTask, {
    theoremStatement,
    proofContent,
    informalProof
  });

  // Quality Gate: Proof structure must be parseable
  if (!proofParsing.parsedStructure || proofParsing.parsedStructure.steps.length === 0) {
    return {
      success: false,
      error: 'Unable to parse proof structure',
      phase: 'proof-parsing',
      verificationResult: null
    };
  }

  // Breakpoint: Review parsed proof structure
  await ctx.breakpoint({
    question: `Review parsed proof structure for theorem: "${theoremStatement}". Is the structure correctly identified?`,
    title: 'Proof Structure Review',
    context: {
      runId: ctx.runId,
      theoremStatement,
      parsedStructure: proofParsing.parsedStructure,
      files: [{
        path: `artifacts/phase1-proof-parsing.json`,
        format: 'json',
        content: proofParsing
      }]
    }
  });

  // Phase 2: Translate to Formal Syntax
  const formalTranslation = await ctx.task(formalTranslationTask, {
    theoremStatement,
    parsedStructure: proofParsing.parsedStructure,
    proofAssistant,
    targetFormalism
  });

  // Phase 3: Verify Each Logical Step
  const stepVerification = await ctx.task(stepVerificationTask, {
    formalProof: formalTranslation.formalProof,
    parsedStructure: proofParsing.parsedStructure,
    proofAssistant,
    theoremStatement
  });

  // Quality Gate: Check for critical verification failures
  const criticalFailures = stepVerification.verificationResults.filter(
    r => r.status === 'failed' && r.severity === 'critical'
  );
  if (criticalFailures.length > 0) {
    await ctx.breakpoint({
      question: `Found ${criticalFailures.length} critical verification failures. Review and decide how to proceed?`,
      title: 'Critical Verification Failures',
      context: {
        runId: ctx.runId,
        criticalFailures,
        recommendation: 'Address logical gaps before proceeding'
      }
    });
  }

  // Phase 4: Generate Counterexample Search
  const counterexampleSearch = await ctx.task(counterexampleSearchTask, {
    theoremStatement,
    parsedStructure: proofParsing.parsedStructure,
    formalProof: formalTranslation.formalProof,
    proofAssistant
  });

  // Phase 5: Identify Gaps and Generate Report
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    theoremStatement,
    stepVerification,
    counterexampleSearch,
    parsedStructure: proofParsing.parsedStructure,
    formalProof: formalTranslation.formalProof
  });

  // Final Breakpoint: Verification Complete
  await ctx.breakpoint({
    question: `Proof verification complete for "${theoremStatement}". Review final results and approve?`,
    title: 'Proof Verification Complete',
    context: {
      runId: ctx.runId,
      theoremStatement,
      verificationStatus: stepVerification.overallStatus,
      gapsIdentified: gapAnalysis.gaps,
      files: [
        { path: `artifacts/formal-proof.${targetFormalism}`, format: 'text', content: formalTranslation.formalProof },
        { path: `artifacts/verification-report.json`, format: 'json', content: { stepVerification, gapAnalysis } }
      ]
    }
  });

  return {
    success: true,
    theoremStatement,
    verificationResult: {
      status: stepVerification.overallStatus,
      stepsVerified: stepVerification.verificationResults.filter(r => r.status === 'verified').length,
      totalSteps: stepVerification.verificationResults.length,
      confidence: stepVerification.confidenceScore
    },
    formalProof: formalTranslation.formalProof,
    gapsIdentified: gapAnalysis.gaps,
    counterexamplesSearched: counterexampleSearch.searchPerformed,
    counterexamplesFound: counterexampleSearch.counterexamples,
    recommendations: gapAnalysis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/mathematics/theorem-proof-verification',
      proofAssistant,
      targetFormalism,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const proofParsingTask = defineTask('proof-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Parse Proof Structure - ${args.theoremStatement.substring(0, 50)}...`,
  agent: {
    name: 'proof-strategist',
    skills: ['proof-structure-analyzer', 'lean-proof-assistant', 'coq-proof-assistant'],
    prompt: {
      role: 'Mathematical Logician with expertise in proof theory and formal methods',
      task: 'Parse and structure an informal mathematical proof into a formal logical structure',
      context: {
        theoremStatement: args.theoremStatement,
        proofContent: args.proofContent,
        informalProof: args.informalProof
      },
      instructions: [
        '1. Identify the theorem statement and its logical components (hypotheses, conclusion)',
        '2. Extract each proof step and its logical justification',
        '3. Identify the proof strategy (direct, contradiction, induction, cases, etc.)',
        '4. List all implicit and explicit assumptions',
        '5. Identify any undefined terms or concepts that need definition',
        '6. Map logical dependencies between steps',
        '7. Identify any informal language that needs formalization',
        '8. Flag any steps that appear to have gaps in reasoning',
        '9. Extract any lemmas or auxiliary results used',
        '10. Provide a structured representation of the proof'
      ],
      outputFormat: 'JSON object with structured proof representation'
    },
    outputSchema: {
      type: 'object',
      required: ['parsedStructure', 'proofStrategy', 'assumptions'],
      properties: {
        parsedStructure: {
          type: 'object',
          properties: {
            hypotheses: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stepNumber: { type: 'number' },
                  statement: { type: 'string' },
                  justification: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'number' } },
                  potentialGap: { type: 'boolean' }
                }
              }
            }
          }
        },
        proofStrategy: {
          type: 'string',
          enum: ['direct', 'contradiction', 'induction', 'cases', 'contrapositive', 'construction', 'exhaustion', 'combinatorial']
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              explicit: { type: 'boolean' },
              justification: { type: 'string' }
            }
          }
        },
        undefinedTerms: { type: 'array', items: { type: 'string' } },
        auxiliaryLemmas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lemma: { type: 'string' },
              used: { type: 'boolean' },
              proven: { type: 'boolean' }
            }
          }
        },
        informalExpressions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-verification', 'parsing', 'formal-methods']
}));

export const formalTranslationTask = defineTask('formal-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Translate to Formal Syntax - ${args.proofAssistant}`,
  agent: {
    name: 'theorem-prover-expert',
    skills: ['lean-proof-assistant', 'coq-proof-assistant', 'isabelle-hol-interface'],
    prompt: {
      role: 'Formal Methods Expert specializing in proof assistants and type theory',
      task: 'Translate parsed proof structure into formal proof assistant syntax',
      context: {
        theoremStatement: args.theoremStatement,
        parsedStructure: args.parsedStructure,
        proofAssistant: args.proofAssistant,
        targetFormalism: args.targetFormalism
      },
      instructions: [
        '1. Define necessary types and structures for the proof domain',
        '2. Formalize the theorem statement in the target proof assistant syntax',
        '3. Translate each proof step into formal tactics or term-mode proofs',
        '4. Ensure all implicit assumptions are made explicit',
        '5. Add necessary imports and library dependencies',
        '6. Handle any proof automation opportunities (auto, simp, etc.)',
        '7. Add documentation comments explaining the proof structure',
        '8. Ensure type-correctness of all expressions',
        '9. Generate proof outline with sorry/admit placeholders for unproven steps',
        '10. Provide alternative formulations if applicable'
      ],
      outputFormat: 'JSON object with formal proof and translation notes'
    },
    outputSchema: {
      type: 'object',
      required: ['formalProof', 'imports', 'translationNotes'],
      properties: {
        formalProof: {
          type: 'string',
          description: 'Complete formal proof in target syntax'
        },
        imports: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required library imports'
        },
        definitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        translationNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              informalStep: { type: 'string' },
              formalEquivalent: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        placeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              reason: { type: 'string' },
              suggestedApproach: { type: 'string' }
            }
          }
        },
        typeDefinitions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-verification', 'formal-translation', 'proof-assistants']
}));

export const stepVerificationTask = defineTask('step-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Verify Logical Steps`,
  agent: {
    name: 'theorem-prover-expert',
    skills: ['coq-proof-assistant', 'lean-proof-assistant', 'proof-structure-analyzer'],
    prompt: {
      role: 'Proof Verification Specialist with expertise in formal verification',
      task: 'Verify each logical step of the formal proof for correctness',
      context: {
        formalProof: args.formalProof,
        parsedStructure: args.parsedStructure,
        proofAssistant: args.proofAssistant,
        theoremStatement: args.theoremStatement
      },
      instructions: [
        '1. Check each proof step for logical validity',
        '2. Verify that each inference follows from its premises',
        '3. Check for circular reasoning or hidden assumptions',
        '4. Verify type correctness of all terms',
        '5. Check that all cases are covered in case analysis proofs',
        '6. Verify base cases and inductive steps for induction proofs',
        '7. Identify any steps that require additional justification',
        '8. Check for proper handling of edge cases',
        '9. Assign confidence scores to each step',
        '10. Provide overall verification status'
      ],
      outputFormat: 'JSON object with step-by-step verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationResults', 'overallStatus', 'confidenceScore'],
      properties: {
        verificationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              statement: { type: 'string' },
              status: { type: 'string', enum: ['verified', 'partially-verified', 'failed', 'pending'] },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              confidence: { type: 'number', minimum: 0, maximum: 100 },
              issues: { type: 'array', items: { type: 'string' } },
              suggestions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallStatus: {
          type: 'string',
          enum: ['verified', 'partially-verified', 'failed', 'inconclusive']
        },
        confidenceScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        logicalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        typeErrors: { type: 'array', items: { type: 'string' } },
        missingCases: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-verification', 'logical-verification', 'formal-methods']
}));

export const counterexampleSearchTask = defineTask('counterexample-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Search for Counterexamples`,
  agent: {
    name: 'conjecture-analyst',
    skills: ['counterexample-generator', 'sympy-computer-algebra', 'sage-math-interface'],
    prompt: {
      role: 'Mathematical Analyst specializing in counterexample generation and testing',
      task: 'Search for potential counterexamples to the theorem',
      context: {
        theoremStatement: args.theoremStatement,
        parsedStructure: args.parsedStructure,
        formalProof: args.formalProof,
        proofAssistant: args.proofAssistant
      },
      instructions: [
        '1. Analyze the theorem statement for potential weak points',
        '2. Identify boundary cases and edge conditions',
        '3. Generate systematic test cases across the parameter space',
        '4. Search for counterexamples using computational methods',
        '5. Test special cases (zero, one, negative, infinite, etc.)',
        '6. Check for missing hypotheses that could allow counterexamples',
        '7. Verify that all quantifiers are correctly scoped',
        '8. Test with small examples that can be computed explicitly',
        '9. Document any near-counterexamples or interesting edge cases',
        '10. Provide confidence assessment that no counterexamples exist'
      ],
      outputFormat: 'JSON object with counterexample search results'
    },
    outputSchema: {
      type: 'object',
      required: ['searchPerformed', 'counterexamples', 'confidenceNoCE'],
      properties: {
        searchPerformed: { type: 'boolean' },
        searchMethods: { type: 'array', items: { type: 'string' } },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              input: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        counterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterexample: { type: 'string' },
              explanation: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        nearCounterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              observation: { type: 'string' }
            }
          }
        },
        boundaryAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              boundary: { type: 'string' },
              behavior: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        confidenceNoCE: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Confidence that no counterexamples exist'
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-verification', 'counterexamples', 'testing']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Gap Analysis and Reporting`,
  agent: {
    name: 'proof-strategist',
    skills: ['proof-structure-analyzer', 'lean-proof-assistant', 'latex-math-formatter'],
    prompt: {
      role: 'Mathematical Proof Reviewer with expertise in identifying logical gaps',
      task: 'Analyze verification results and identify gaps in the proof',
      context: {
        theoremStatement: args.theoremStatement,
        stepVerification: args.stepVerification,
        counterexampleSearch: args.counterexampleSearch,
        parsedStructure: args.parsedStructure,
        formalProof: args.formalProof
      },
      instructions: [
        '1. Synthesize verification results to identify all gaps in reasoning',
        '2. Classify gaps by severity (critical, major, minor)',
        '3. Identify missing lemmas or auxiliary results needed',
        '4. Suggest specific fixes for each identified gap',
        '5. Assess the overall completeness of the proof',
        '6. Provide recommendations for strengthening the proof',
        '7. Identify any assumptions that should be made explicit',
        '8. Suggest alternative proof approaches if current proof has fundamental issues',
        '9. Generate a comprehensive verification report',
        '10. Provide actionable next steps for completing the verification'
      ],
      outputFormat: 'JSON object with gap analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'recommendations', 'completenessScore'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              suggestedFix: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        missingLemmas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lemma: { type: 'string' },
              purpose: { type: 'string' },
              difficulty: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        completenessScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        alternativeApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              advantages: { type: 'array', items: { type: 'string' } },
              challenges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        verificationSummary: {
          type: 'string',
          description: 'Executive summary of verification results'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-verification', 'gap-analysis', 'reporting']
}));
