/**
 * @process computer-science/computational-problem-classification
 * @description Classify computational problems into appropriate complexity classes with formal reductions and proofs
 * @inputs { problemDescription: string, decisionProblemFormulation: string }
 * @outputs { success: boolean, classification: object, reductionProof: object, complexityLandscape: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    decisionProblemFormulation = '',
    knownRelatedProblems = [],
    outputDir = 'problem-classification-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Computational Problem Classification');

  // ============================================================================
  // PHASE 1: DECISION PROBLEM FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing decision problem');
  const problemFormalization = await ctx.task(problemFormalizationTask, {
    problemDescription,
    decisionProblemFormulation,
    outputDir
  });

  artifacts.push(...problemFormalization.artifacts);

  // ============================================================================
  // PHASE 2: COMPLEXITY CLASS MEMBERSHIP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing complexity class membership');
  const membershipAnalysis = await ctx.task(membershipAnalysisTask, {
    problemDescription,
    problemFormalization,
    outputDir
  });

  artifacts.push(...membershipAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: POLYNOMIAL-TIME REDUCTION CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Constructing polynomial-time reduction');
  const reductionConstruction = await ctx.task(reductionConstructionTask, {
    problemDescription,
    problemFormalization,
    membershipAnalysis,
    knownRelatedProblems,
    outputDir
  });

  artifacts.push(...reductionConstruction.artifacts);

  // ============================================================================
  // PHASE 4: REDUCTION CORRECTNESS VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Verifying reduction correctness');
  const reductionVerification = await ctx.task(reductionVerificationTask, {
    problemDescription,
    reductionConstruction,
    outputDir
  });

  artifacts.push(...reductionVerification.artifacts);

  // ============================================================================
  // PHASE 5: COMPLEXITY LANDSCAPE PLACEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Placing problem in complexity landscape');
  const landscapePlacement = await ctx.task(landscapePlacementTask, {
    problemDescription,
    problemFormalization,
    membershipAnalysis,
    reductionConstruction,
    outputDir
  });

  artifacts.push(...landscapePlacement.artifacts);

  // ============================================================================
  // PHASE 6: RELATED PROBLEMS AND IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting implications and related problems');
  const implicationsDocumentation = await ctx.task(implicationsDocumentationTask, {
    problemDescription,
    problemFormalization,
    membershipAnalysis,
    landscapePlacement,
    knownRelatedProblems,
    outputDir
  });

  artifacts.push(...implicationsDocumentation.artifacts);

  // ============================================================================
  // PHASE 7: CLASSIFICATION REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating classification report');
  const classificationReport = await ctx.task(classificationReportTask, {
    problemDescription,
    problemFormalization,
    membershipAnalysis,
    reductionConstruction,
    reductionVerification,
    landscapePlacement,
    implicationsDocumentation,
    outputDir
  });

  artifacts.push(...classificationReport.artifacts);

  // Breakpoint: Review problem classification
  await ctx.breakpoint({
    question: `Problem classification complete. Class: ${membershipAnalysis.primaryClass}. Hardness: ${reductionConstruction.hardnessResult}. Review classification?`,
    title: 'Computational Problem Classification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        primaryClass: membershipAnalysis.primaryClass,
        hardnessResult: reductionConstruction.hardnessResult,
        reductionVerified: reductionVerification.verified,
        relatedProblems: implicationsDocumentation.relatedProblems?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemDescription,
    classification: {
      primaryClass: membershipAnalysis.primaryClass,
      membershipProved: membershipAnalysis.membershipProved,
      hardnessResult: reductionConstruction.hardnessResult,
      complete: reductionConstruction.isComplete
    },
    reductionProof: {
      sourceProblems: reductionConstruction.sourceProblem,
      reductionDescription: reductionConstruction.reductionDescription,
      correctnessVerified: reductionVerification.verified,
      proofDocument: reductionVerification.proofDocument
    },
    complexityLandscape: {
      placement: landscapePlacement.placement,
      relatedClasses: landscapePlacement.relatedClasses,
      openQuestions: landscapePlacement.openQuestions
    },
    implications: {
      relatedProblems: implicationsDocumentation.relatedProblems,
      practicalImplications: implicationsDocumentation.practicalImplications
    },
    reportPath: classificationReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/computational-problem-classification',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Problem Formalization
export const problemFormalizationTask = defineTask('problem-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize decision problem',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'complexity theorist',
      task: 'Formalize the computational problem as a decision problem with precise specification',
      context: args,
      instructions: [
        'Convert optimization problem to decision version if needed',
        'Define input format precisely (encoding)',
        'Define the yes-instances (language L)',
        'Specify size parameter n',
        'Express problem in formal notation',
        'Identify problem type (graph, number, string, etc.)',
        'Document any variants of the problem',
        'Generate formal problem specification'
      ],
      outputFormat: 'JSON with formalDefinition, inputEncoding, language, sizeParameter, problemType, variants, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalDefinition', 'inputEncoding', 'language', 'artifacts'],
      properties: {
        formalDefinition: { type: 'string' },
        inputEncoding: { type: 'string' },
        language: { type: 'string' },
        sizeParameter: { type: 'string' },
        problemType: { type: 'string' },
        variants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'formalization']
}));

// Task 2: Membership Analysis
export const membershipAnalysisTask = defineTask('membership-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze complexity class membership',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'complexity class specialist',
      task: 'Determine which complexity classes the problem belongs to',
      context: args,
      instructions: [
        'Check if problem is in P (polynomial-time decidable)',
        'Check if problem is in NP (polynomial-time verifiable)',
        'Check if problem is in co-NP',
        'Consider PSPACE membership',
        'Consider EXPTIME membership',
        'Check for special class membership (L, NL, NC, etc.)',
        'Construct polynomial-time verifier for NP membership',
        'Document membership proofs'
      ],
      outputFormat: 'JSON with primaryClass, classMembers, membershipProved, verifierDescription, proofs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryClass', 'classMembers', 'membershipProved', 'artifacts'],
      properties: {
        primaryClass: { type: 'string' },
        classMemberships: {
          type: 'object',
          properties: {
            P: { type: 'boolean' },
            NP: { type: 'boolean' },
            coNP: { type: 'boolean' },
            PSPACE: { type: 'boolean' },
            EXPTIME: { type: 'boolean' }
          }
        },
        membershipProved: { type: 'boolean' },
        verifierDescription: { type: 'string' },
        verifierComplexity: { type: 'string' },
        proofs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'membership']
}));

// Task 3: Reduction Construction
export const reductionConstructionTask = defineTask('reduction-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct polynomial-time reduction',
  agent: {
    name: 'complexity-theorist',
    skills: ['reduction-builder', 'complexity-class-oracle', 'latex-proof-formatter'],
    prompt: {
      role: 'reduction specialist',
      task: 'Construct polynomial-time reduction to establish hardness',
      context: args,
      instructions: [
        'Select appropriate source problem for reduction',
        'Design polynomial-time transformation function f',
        'Ensure transformation preserves yes/no instances',
        'Describe gadget constructions if applicable',
        'Prove transformation runs in polynomial time',
        'Document reduction construction step by step',
        'Identify if problem is complete for the class',
        'Generate reduction specification'
      ],
      outputFormat: 'JSON with sourceProblem, reductionDescription, transformation, gadgets, complexity, hardnessResult, isComplete, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceProblem', 'reductionDescription', 'hardnessResult', 'artifacts'],
      properties: {
        sourceProblem: { type: 'string' },
        reductionDescription: { type: 'string' },
        transformation: { type: 'string' },
        gadgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              construction: { type: 'string' }
            }
          }
        },
        reductionComplexity: { type: 'string' },
        hardnessResult: { type: 'string' },
        isComplete: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'reduction']
}));

// Task 4: Reduction Verification
export const reductionVerificationTask = defineTask('reduction-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify reduction correctness',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'reduction-builder', 'latex-proof-formatter'],
    prompt: {
      role: 'proof verification specialist',
      task: 'Verify correctness of the polynomial-time reduction',
      context: args,
      instructions: [
        'Prove forward direction: yes-instance maps to yes-instance',
        'Prove backward direction: no-instance maps to no-instance',
        'Verify polynomial-time bound on transformation',
        'Check gadget correctness proofs',
        'Identify any edge cases or special inputs',
        'Document complete correctness proof',
        'Note any assumptions made',
        'Generate verification report'
      ],
      outputFormat: 'JSON with verified, forwardProof, backwardProof, timeVerification, edgeCases, proofDocument, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'forwardProof', 'backwardProof', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        forwardProof: { type: 'string' },
        backwardProof: { type: 'string' },
        timeVerification: { type: 'string' },
        edgeCases: { type: 'array', items: { type: 'string' } },
        proofDocument: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'verification']
}));

// Task 5: Landscape Placement
export const landscapePlacementTask = defineTask('landscape-placement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Place problem in complexity landscape',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'reduction-builder', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'complexity landscape specialist',
      task: 'Place the problem in the broader complexity landscape and identify relationships',
      context: args,
      instructions: [
        'Position problem relative to standard complexity classes',
        'Identify containment relationships',
        'Note any separation results if problem resolves open questions',
        'Identify intermediate classes (NP-intermediate, etc.)',
        'Document relationship to parameterized complexity',
        'Create complexity class diagram/placement',
        'Note open questions about problem classification',
        'Generate landscape placement document'
      ],
      outputFormat: 'JSON with placement, relatedClasses, containments, separations, parameterizedAnalysis, openQuestions, diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['placement', 'relatedClasses', 'artifacts'],
      properties: {
        placement: { type: 'string' },
        relatedClasses: { type: 'array', items: { type: 'string' } },
        containments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              superclass: { type: 'string' },
              subclass: { type: 'string' },
              proper: { type: 'boolean' }
            }
          }
        },
        separations: { type: 'array', items: { type: 'string' } },
        parameterizedAnalysis: { type: 'string' },
        openQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'landscape']
}));

// Task 6: Implications Documentation
export const implicationsDocumentationTask = defineTask('implications-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document implications and related problems',
  agent: {
    name: 'complexity-theorist',
    skills: ['complexity-class-oracle', 'approximation-ratio-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'complexity implications specialist',
      task: 'Document implications of the classification and identify related problems',
      context: args,
      instructions: [
        'List problems that reduce to/from this problem',
        'Document implications for solving related problems',
        'Identify special cases that might be easier',
        'Note practical implications (approximability, parameterization)',
        'Document any hardness cascades',
        'Identify algorithmic implications',
        'List related open problems',
        'Generate implications report'
      ],
      outputFormat: 'JSON with relatedProblems, implications, specialCases, practicalImplications, hardnessCascades, openProblems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relatedProblems', 'practicalImplications', 'artifacts'],
      properties: {
        relatedProblems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              relationship: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        implications: { type: 'array', items: { type: 'string' } },
        specialCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              complexity: { type: 'string' }
            }
          }
        },
        practicalImplications: { type: 'array', items: { type: 'string' } },
        hardnessCascades: { type: 'array', items: { type: 'string' } },
        openProblems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'implications']
}));

// Task 7: Classification Report
export const classificationReportTask = defineTask('classification-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate classification report',
  agent: {
    name: 'complexity-theorist',
    skills: ['latex-proof-formatter', 'complexity-class-oracle'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive problem classification report',
      context: args,
      instructions: [
        'Create executive summary of classification results',
        'Include formal problem definition',
        'Document complexity class membership proofs',
        'Present reduction construction and verification',
        'Include complexity landscape diagram',
        'Document related problems and implications',
        'Summarize practical consequences',
        'Format as professional academic-style report'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyResults: {
          type: 'object',
          properties: {
            classification: { type: 'string' },
            hardness: { type: 'string' },
            implications: { type: 'array', items: { type: 'string' } }
          }
        },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem-classification', 'documentation']
}));
