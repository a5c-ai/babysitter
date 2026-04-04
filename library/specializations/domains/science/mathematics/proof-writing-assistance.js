/**
 * @process specializations/domains/science/mathematics/proof-writing-assistance
 * @description Assist in writing rigorous mathematical proofs with proper structure, notation, and LaTeX formatting.
 * Ensures logical flow, identifies missing steps, and suggests clearer formulations.
 * @inputs { theoremStatement: string, proofDraft?: string, mathDomain?: string, targetAudience?: string, outputFormat?: string }
 * @outputs { success: boolean, refinedProof: string, latexFormatted: string, suggestions: array, structureAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/proof-writing-assistance', {
 *   theoremStatement: 'The square root of 2 is irrational',
 *   proofDraft: 'Assume sqrt(2) is rational. Then sqrt(2) = p/q where p and q are coprime integers...',
 *   mathDomain: 'number-theory',
 *   targetAudience: 'undergraduate',
 *   outputFormat: 'latex'
 * });
 *
 * @references
 * - How to Write Mathematical Proofs: https://www.math.utah.edu/~pa/math/proofs.html
 * - LaTeX Math Mode: https://en.wikibooks.org/wiki/LaTeX/Mathematics
 * - AMS Theorem Environments: https://www.ams.org/publications/authors/tex/amslatex
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    theoremStatement,
    proofDraft = '',
    mathDomain = 'general',
    targetAudience = 'graduate',
    outputFormat = 'latex'
  } = inputs;

  // Phase 1: Review Proof Structure and Logic
  const structureReview = await ctx.task(structureReviewTask, {
    theoremStatement,
    proofDraft,
    mathDomain
  });

  // Quality Gate: Check if proof structure is analyzable
  if (!structureReview.structureAnalysis) {
    return {
      success: false,
      error: 'Unable to analyze proof structure',
      phase: 'structure-review',
      refinedProof: null
    };
  }

  // Breakpoint: Review proof structure analysis
  await ctx.breakpoint({
    question: `Review proof structure analysis. Does this correctly identify the proof strategy and logical flow?`,
    title: 'Proof Structure Review',
    context: {
      runId: ctx.runId,
      theoremStatement,
      proofStrategy: structureReview.proofStrategy,
      logicalFlow: structureReview.structureAnalysis.logicalFlow,
      files: [{
        path: `artifacts/phase1-structure-review.json`,
        format: 'json',
        content: structureReview
      }]
    }
  });

  // Phase 2: Identify Implicit Assumptions
  const assumptionAnalysis = await ctx.task(assumptionAnalysisTask, {
    theoremStatement,
    proofDraft,
    structureAnalysis: structureReview.structureAnalysis,
    mathDomain
  });

  // Phase 3: Suggest Notation Improvements
  const notationSuggestions = await ctx.task(notationSuggestionsTask, {
    theoremStatement,
    proofDraft,
    mathDomain,
    targetAudience,
    existingNotation: structureReview.notation
  });

  // Phase 4: Format in LaTeX
  const latexFormatting = await ctx.task(latexFormattingTask, {
    theoremStatement,
    proofDraft,
    structureAnalysis: structureReview.structureAnalysis,
    notationSuggestions,
    targetAudience,
    outputFormat
  });

  // Phase 5: Generate Proof Outline and Templates
  const proofTemplates = await ctx.task(proofTemplatesTask, {
    theoremStatement,
    proofStrategy: structureReview.proofStrategy,
    mathDomain,
    structureAnalysis: structureReview.structureAnalysis
  });

  // Quality Gate: Review suggestions before finalizing
  if (assumptionAnalysis.implicitAssumptions.length > 0 || notationSuggestions.suggestions.length > 0) {
    await ctx.breakpoint({
      question: `Found ${assumptionAnalysis.implicitAssumptions.length} implicit assumptions and ${notationSuggestions.suggestions.length} notation suggestions. Review and incorporate?`,
      title: 'Suggestions Review',
      context: {
        runId: ctx.runId,
        implicitAssumptions: assumptionAnalysis.implicitAssumptions,
        notationSuggestions: notationSuggestions.suggestions
      }
    });
  }

  // Phase 6: Generate Refined Proof
  const refinedProof = await ctx.task(refinedProofGenerationTask, {
    theoremStatement,
    proofDraft,
    structureReview,
    assumptionAnalysis,
    notationSuggestions,
    latexFormatting,
    proofTemplates,
    targetAudience
  });

  // Final Breakpoint: Proof Writing Complete
  await ctx.breakpoint({
    question: `Proof writing assistance complete for "${theoremStatement}". Review refined proof and approve?`,
    title: 'Proof Writing Complete',
    context: {
      runId: ctx.runId,
      theoremStatement,
      refinedProofPreview: refinedProof.plainText.substring(0, 500) + '...',
      files: [
        { path: `artifacts/refined-proof.tex`, format: 'latex', content: refinedProof.latexFormatted },
        { path: `artifacts/proof-analysis.json`, format: 'json', content: { structureReview, assumptionAnalysis } }
      ]
    }
  });

  return {
    success: true,
    theoremStatement,
    refinedProof: refinedProof.plainText,
    latexFormatted: refinedProof.latexFormatted,
    suggestions: [
      ...assumptionAnalysis.implicitAssumptions.map(a => ({ type: 'assumption', ...a })),
      ...notationSuggestions.suggestions.map(n => ({ type: 'notation', ...n })),
      ...structureReview.improvements.map(i => ({ type: 'structure', ...i }))
    ],
    structureAnalysis: {
      proofStrategy: structureReview.proofStrategy,
      logicalFlow: structureReview.structureAnalysis.logicalFlow,
      completeness: structureReview.structureAnalysis.completeness
    },
    proofOutline: proofTemplates.outline,
    missingSteps: structureReview.missingSteps,
    metadata: {
      processId: 'specializations/domains/science/mathematics/proof-writing-assistance',
      mathDomain,
      targetAudience,
      outputFormat,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const structureReviewTask = defineTask('structure-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Review Proof Structure and Logic`,
  agent: {
    name: 'proof-strategist',
    skills: ['proof-structure-analyzer', 'lean-proof-assistant', 'coq-proof-assistant'],
    prompt: {
      role: 'Mathematical Proof Reviewer with expertise in proof writing pedagogy',
      task: 'Review the proof structure, logical flow, and identify areas for improvement',
      context: {
        theoremStatement: args.theoremStatement,
        proofDraft: args.proofDraft,
        mathDomain: args.mathDomain
      },
      instructions: [
        '1. Identify the proof strategy (direct, contradiction, induction, etc.)',
        '2. Map the logical flow of arguments from premises to conclusion',
        '3. Identify any missing logical steps or gaps in reasoning',
        '4. Check for circular reasoning or logical fallacies',
        '5. Verify that all cases are covered (for case analysis proofs)',
        '6. Check base case and inductive step (for induction proofs)',
        '7. Identify notation used and assess consistency',
        '8. Evaluate clarity and readability of the proof',
        '9. Suggest structural improvements',
        '10. Rate the overall completeness of the proof'
      ],
      outputFormat: 'JSON object with comprehensive structure review'
    },
    outputSchema: {
      type: 'object',
      required: ['proofStrategy', 'structureAnalysis', 'improvements'],
      properties: {
        proofStrategy: {
          type: 'string',
          enum: ['direct', 'contradiction', 'contrapositive', 'induction', 'strong-induction', 'cases', 'construction', 'exhaustion']
        },
        structureAnalysis: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            logicalFlow: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'number' },
                  statement: { type: 'string' },
                  justification: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'number' } }
                }
              }
            },
            completeness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        missingSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] }
            }
          }
        },
        logicalIssues: { type: 'array', items: { type: 'string' } },
        notation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              meaning: { type: 'string' },
              consistent: { type: 'boolean' }
            }
          }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              suggestion: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              location: { type: 'string' }
            }
          }
        },
        clarityScore: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'structure-review']
}));

export const assumptionAnalysisTask = defineTask('assumption-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Identify Implicit Assumptions`,
  agent: {
    name: 'proof-strategist',
    skills: ['proof-structure-analyzer', 'lean-proof-assistant'],
    prompt: {
      role: 'Mathematical Logic Expert specializing in assumption identification',
      task: 'Identify all implicit and explicit assumptions in the proof',
      context: {
        theoremStatement: args.theoremStatement,
        proofDraft: args.proofDraft,
        structureAnalysis: args.structureAnalysis,
        mathDomain: args.mathDomain
      },
      instructions: [
        '1. List all explicit assumptions stated in the proof',
        '2. Identify implicit assumptions that are not stated but used',
        '3. Identify background mathematical facts relied upon',
        '4. Check if all assumptions are necessary (no redundant assumptions)',
        '5. Check if assumptions are sufficient for the conclusion',
        '6. Identify any hidden domain restrictions',
        '7. Flag any unstated but critical assumptions',
        '8. Suggest how to make implicit assumptions explicit',
        '9. Identify axioms or fundamental results used',
        '10. Assess assumption dependency structure'
      ],
      outputFormat: 'JSON object with assumption analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['explicitAssumptions', 'implicitAssumptions'],
      properties: {
        explicitAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              location: { type: 'string' },
              necessary: { type: 'boolean' }
            }
          }
        },
        implicitAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              whereUsed: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'important', 'minor'] },
              suggestedFormulation: { type: 'string' }
            }
          }
        },
        backgroundFacts: { type: 'array', items: { type: 'string' } },
        axiomsUsed: { type: 'array', items: { type: 'string' } },
        domainRestrictions: { type: 'array', items: { type: 'string' } },
        assumptionSufficiency: {
          type: 'object',
          properties: {
            sufficient: { type: 'boolean' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'assumptions']
}));

export const notationSuggestionsTask = defineTask('notation-suggestions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Suggest Notation Improvements`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'math-notation-validator', 'diagram-generator'],
    prompt: {
      role: 'Mathematical Notation Expert with expertise in mathematical communication',
      task: 'Suggest notation improvements for clarity and standard compliance',
      context: {
        theoremStatement: args.theoremStatement,
        proofDraft: args.proofDraft,
        mathDomain: args.mathDomain,
        targetAudience: args.targetAudience,
        existingNotation: args.existingNotation
      },
      instructions: [
        '1. Review existing notation for consistency',
        '2. Identify non-standard or unclear notation',
        '3. Suggest standard notation for the mathematical domain',
        '4. Recommend notation that aids readability',
        '5. Ensure notation is appropriate for target audience',
        '6. Identify opportunities to introduce helpful notation',
        '7. Check for notation conflicts or ambiguities',
        '8. Suggest naming conventions for variables',
        '9. Recommend typographical improvements',
        '10. Provide notation glossary for complex proofs'
      ],
      outputFormat: 'JSON object with notation suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['suggestions', 'notationGlossary'],
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              current: { type: 'string' },
              suggested: { type: 'string' },
              reason: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        consistencyIssues: { type: 'array', items: { type: 'string' } },
        notationGlossary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              meaning: { type: 'string' },
              latex: { type: 'string' }
            }
          }
        },
        standardConventions: { type: 'array', items: { type: 'string' } },
        variableNaming: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              suggestedName: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'notation']
}));

export const latexFormattingTask = defineTask('latex-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Format in LaTeX`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'diagram-generator', 'math-notation-validator'],
    prompt: {
      role: 'LaTeX Expert specializing in mathematical typesetting',
      task: 'Format the proof in proper LaTeX with theorem environments',
      context: {
        theoremStatement: args.theoremStatement,
        proofDraft: args.proofDraft,
        structureAnalysis: args.structureAnalysis,
        notationSuggestions: args.notationSuggestions,
        targetAudience: args.targetAudience,
        outputFormat: args.outputFormat
      },
      instructions: [
        '1. Create appropriate LaTeX document structure',
        '2. Use proper theorem environments (theorem, lemma, proof, etc.)',
        '3. Format all mathematical expressions correctly',
        '4. Apply consistent spacing and alignment',
        '5. Use appropriate fonts and symbols',
        '6. Add equation numbering where appropriate',
        '7. Create proper cross-references if needed',
        '8. Include necessary packages in preamble',
        '9. Format for the target output (paper, slides, web)',
        '10. Ensure AMS-LaTeX compatibility'
      ],
      outputFormat: 'JSON object with LaTeX formatted proof'
    },
    outputSchema: {
      type: 'object',
      required: ['latexDocument', 'preamble', 'body'],
      properties: {
        latexDocument: { type: 'string', description: 'Complete LaTeX document' },
        preamble: { type: 'string', description: 'Required packages and definitions' },
        body: { type: 'string', description: 'Main proof content' },
        theoremEnvironment: { type: 'string' },
        equations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              latex: { type: 'string' }
            }
          }
        },
        requiredPackages: { type: 'array', items: { type: 'string' } },
        customCommands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              definition: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'latex']
}));

export const proofTemplatesTask = defineTask('proof-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Proof Outline and Templates`,
  agent: {
    name: 'theorem-prover-expert',
    skills: ['proof-structure-analyzer', 'lean-proof-assistant', 'coq-proof-assistant'],
    prompt: {
      role: 'Proof Pedagogy Expert',
      task: 'Generate proof outline templates and structure guides',
      context: {
        theoremStatement: args.theoremStatement,
        proofStrategy: args.proofStrategy,
        mathDomain: args.mathDomain,
        structureAnalysis: args.structureAnalysis
      },
      instructions: [
        '1. Generate a clear proof outline with main steps',
        '2. Provide template structure for the proof type',
        '3. Identify key milestones in the proof',
        '4. Suggest lemmas that could be extracted',
        '5. Provide alternative proof outlines if applicable',
        '6. Create a dependency diagram of proof steps',
        '7. Identify reusable proof patterns',
        '8. Provide scaffolding for complex steps',
        '9. Suggest helpful intermediate results',
        '10. Create a summary of the proof strategy'
      ],
      outputFormat: 'JSON object with proof templates and outlines'
    },
    outputSchema: {
      type: 'object',
      required: ['outline', 'template', 'milestones'],
      properties: {
        outline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' },
              key: { type: 'boolean' }
            }
          }
        },
        template: { type: 'string', description: 'Proof template structure' },
        milestones: { type: 'array', items: { type: 'string' } },
        extractableLemmas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        alternativeOutlines: { type: 'array', items: { type: 'object' } },
        proofPatterns: { type: 'array', items: { type: 'string' } },
        strategySummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'templates']
}));

export const refinedProofGenerationTask = defineTask('refined-proof-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Generate Refined Proof`,
  agent: {
    name: 'proof-strategist',
    skills: ['latex-math-formatter', 'proof-structure-analyzer', 'lean-proof-assistant'],
    prompt: {
      role: 'Mathematical Proof Writer',
      task: 'Generate the final refined proof incorporating all improvements',
      context: {
        theoremStatement: args.theoremStatement,
        proofDraft: args.proofDraft,
        structureReview: args.structureReview,
        assumptionAnalysis: args.assumptionAnalysis,
        notationSuggestions: args.notationSuggestions,
        latexFormatting: args.latexFormatting,
        proofTemplates: args.proofTemplates,
        targetAudience: args.targetAudience
      },
      instructions: [
        '1. Incorporate all suggested structural improvements',
        '2. Make implicit assumptions explicit where appropriate',
        '3. Apply notation improvements',
        '4. Fill in missing logical steps',
        '5. Ensure smooth logical flow',
        '6. Maintain appropriate level of detail for target audience',
        '7. Apply proper LaTeX formatting',
        '8. Add helpful commentary where beneficial',
        '9. Ensure the proof is self-contained',
        '10. Generate both plain text and LaTeX versions'
      ],
      outputFormat: 'JSON object with refined proof in multiple formats'
    },
    outputSchema: {
      type: 'object',
      required: ['plainText', 'latexFormatted'],
      properties: {
        plainText: { type: 'string', description: 'Refined proof in plain text' },
        latexFormatted: { type: 'string', description: 'Refined proof in LaTeX' },
        changesSummary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              change: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            rigor: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'proof-writing', 'generation']
}));
