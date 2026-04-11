/**
 * @process Reflective Equilibrium
 * @description Achieve coherence by mutually adjusting principles and considered judgments iteratively
 * @category Scientific Discovery - Meta-Level and Reflective
 * @inputs {{ principles: array, judgments: array, context: object, constraints: object }}
 * @outputs {{ equilibriumState: object, adjustments: array, coherenceAnalysis: object, recommendations: array }}
 * @example
 * // Input: { principles: [{ name: "...", statement: "..." }], judgments: [{ case: "...", judgment: "..." }], context: {...} }
 * // Output: { equilibriumState: { achieved: true, coherenceLevel: 0.87 }, adjustments: [...], coherenceAnalysis: {...} }
 * @references Rawlsian reflective equilibrium, Wide reflective equilibrium, Coherentism in epistemology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Initial State Assessment
  const initialState = await ctx.task(assessInitialStateTask, {
    principles: inputs.principles,
    judgments: inputs.judgments,
    context: inputs.context
  });

  // Phase 2: Conflict Identification
  const conflictAnalysis = await ctx.task(identifyConflictsTask, {
    principles: inputs.principles,
    judgments: inputs.judgments,
    initialCoherence: initialState.coherenceLevel
  });

  // Iterative Equilibrium Loop
  let currentState = {
    principles: inputs.principles,
    judgments: inputs.judgments,
    coherence: initialState.coherenceLevel,
    conflicts: conflictAnalysis.identifiedConflicts
  };

  const adjustmentHistory = [];
  let iteration = 0;
  const maxIterations = inputs.constraints?.maxIterations || 5;

  while (currentState.conflicts.length > 0 && iteration < maxIterations) {
    iteration++;

    // Phase 3: Adjustment Option Generation
    const adjustmentOptions = await ctx.task(generateAdjustmentOptionsTask, {
      principles: currentState.principles,
      judgments: currentState.judgments,
      conflicts: currentState.conflicts,
      adjustmentHistory: adjustmentHistory,
      iteration: iteration
    });

    // Phase 4: Adjustment Evaluation
    const adjustmentEvaluation = await ctx.task(evaluateAdjustmentsTask, {
      options: adjustmentOptions.options,
      currentState: currentState,
      evaluationCriteria: inputs.context?.evaluationCriteria
    });

    // Phase 5: Apply Best Adjustment
    const adjustmentApplication = await ctx.task(applyAdjustmentTask, {
      selectedAdjustment: adjustmentEvaluation.bestAdjustment,
      currentPrinciples: currentState.principles,
      currentJudgments: currentState.judgments
    });

    adjustmentHistory.push({
      iteration: iteration,
      adjustment: adjustmentEvaluation.bestAdjustment,
      previousCoherence: currentState.coherence,
      newCoherence: adjustmentApplication.newCoherence
    });

    // Phase 6: Re-assess Conflicts
    const reassessment = await ctx.task(reassessConflictsTask, {
      principles: adjustmentApplication.updatedPrinciples,
      judgments: adjustmentApplication.updatedJudgments,
      previousConflicts: currentState.conflicts
    });

    currentState = {
      principles: adjustmentApplication.updatedPrinciples,
      judgments: adjustmentApplication.updatedJudgments,
      coherence: adjustmentApplication.newCoherence,
      conflicts: reassessment.remainingConflicts
    };

    // Quality Gate: Progress Check
    if (adjustmentApplication.newCoherence <= currentState.coherence - 0.1) {
      await ctx.breakpoint('equilibrium-regression', {
        message: 'Equilibrium process is regressing',
        currentCoherence: adjustmentApplication.newCoherence,
        previousCoherence: currentState.coherence,
        adjustment: adjustmentEvaluation.bestAdjustment
      });
    }
  }

  // Phase 7: Equilibrium Verification
  const verification = await ctx.task(verifyEquilibriumTask, {
    finalPrinciples: currentState.principles,
    finalJudgments: currentState.judgments,
    adjustmentHistory: adjustmentHistory,
    targetCoherence: inputs.constraints?.targetCoherence || 0.8
  });

  // Phase 8: Wide Equilibrium Check
  const wideEquilibrium = await ctx.task(checkWideEquilibriumTask, {
    equilibriumState: currentState,
    backgroundTheories: inputs.context?.backgroundTheories,
    relevantFacts: inputs.context?.relevantFacts
  });

  // Phase 9: Stability Analysis
  const stabilityAnalysis = await ctx.task(analyzeStabilityTask, {
    equilibriumState: currentState,
    adjustmentHistory: adjustmentHistory,
    perturbationScenarios: inputs.context?.perturbations
  });

  // Phase 10: Documentation and Recommendations
  const documentation = await ctx.task(documentEquilibriumTask, {
    initialState: initialState,
    finalState: currentState,
    adjustmentHistory: adjustmentHistory,
    verification: verification,
    wideEquilibrium: wideEquilibrium,
    stability: stabilityAnalysis
  });

  return {
    success: true,
    reasoningType: 'Reflective Equilibrium',
    equilibriumState: {
      achieved: verification.equilibriumAchieved,
      coherenceLevel: currentState.coherence,
      finalPrinciples: currentState.principles,
      finalJudgments: currentState.judgments,
      remainingConflicts: currentState.conflicts
    },
    adjustments: adjustmentHistory,
    coherenceAnalysis: {
      initial: initialState.coherenceLevel,
      final: currentState.coherence,
      improvement: currentState.coherence - initialState.coherenceLevel,
      conflictsResolved: initialState.conflictCount - currentState.conflicts.length,
      iterationsRequired: iteration
    },
    wideEquilibrium: {
      achieved: wideEquilibrium.achieved,
      backgroundConsistency: wideEquilibrium.backgroundConsistency,
      factualConsistency: wideEquilibrium.factualConsistency
    },
    stability: {
      stable: stabilityAnalysis.isStable,
      vulnerabilities: stabilityAnalysis.vulnerabilities,
      robustness: stabilityAnalysis.robustnessScore
    },
    recommendations: documentation.recommendations,
    confidence: verification.equilibriumAchieved ? currentState.coherence : currentState.coherence * 0.7
  };
}

export const assessInitialStateTask = defineTask('equilibrium-initial-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Initial State Assessment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Reflective equilibrium specialist',
      task: 'Assess initial coherence state of principles and judgments',
      context: args,
      instructions: [
        'Assess current coherence level',
        'Identify principle-judgment relationships',
        'Map logical dependencies',
        'Identify initial tension points',
        'Assess principle completeness',
        'Document baseline state'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['coherenceLevel', 'conflictCount'],
      properties: {
        coherenceLevel: { type: 'number' },
        conflictCount: { type: 'integer' },
        relationships: { type: 'array' },
        dependencies: { type: 'array' },
        tensionPoints: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'initial-assessment']
}));

export const identifyConflictsTask = defineTask('equilibrium-conflict-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Conflict Identification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Coherence analysis specialist',
      task: 'Identify conflicts between principles and judgments',
      context: args,
      instructions: [
        'Identify principle-judgment conflicts',
        'Identify principle-principle conflicts',
        'Identify judgment-judgment conflicts',
        'Classify conflict types',
        'Assess conflict severity',
        'Prioritize conflicts for resolution'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedConflicts'],
      properties: {
        identifiedConflicts: { type: 'array' },
        principleJudgmentConflicts: { type: 'array' },
        principlePrincipleConflicts: { type: 'array' },
        judgmentJudgmentConflicts: { type: 'array' },
        conflictPriorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'conflict-identification']
}));

export const generateAdjustmentOptionsTask = defineTask('equilibrium-adjustment-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Adjustment Option Generation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium adjustment specialist',
      task: 'Generate options for resolving conflicts',
      context: args,
      instructions: [
        'Generate principle modification options',
        'Generate judgment revision options',
        'Consider new principle additions',
        'Consider judgment removals',
        'Generate hybrid adjustments',
        'Document adjustment rationales'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['options'],
      properties: {
        options: { type: 'array' },
        principleModifications: { type: 'array' },
        judgmentRevisions: { type: 'array' },
        newPrinciples: { type: 'array' },
        removals: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'adjustment-generation']
}));

export const evaluateAdjustmentsTask = defineTask('equilibrium-adjustment-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Adjustment Evaluation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Adjustment evaluation specialist',
      task: 'Evaluate adjustment options and select best',
      context: args,
      instructions: [
        'Evaluate coherence improvement',
        'Assess adjustment costs',
        'Consider cascade effects',
        'Evaluate principle preservation',
        'Select best adjustment',
        'Document selection rationale'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestAdjustment', 'rankings'],
      properties: {
        bestAdjustment: { type: 'object' },
        rankings: { type: 'array' },
        coherenceImprovements: { type: 'object' },
        cascadeEffects: { type: 'array' },
        selectionRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'adjustment-evaluation']
}));

export const applyAdjustmentTask = defineTask('equilibrium-adjustment-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Apply Adjustment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium adjustment application specialist',
      task: 'Apply selected adjustment to principles and judgments',
      context: args,
      instructions: [
        'Apply the selected adjustment',
        'Update affected principles',
        'Update affected judgments',
        'Propagate changes',
        'Calculate new coherence',
        'Document changes made'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedPrinciples', 'updatedJudgments', 'newCoherence'],
      properties: {
        updatedPrinciples: { type: 'array' },
        updatedJudgments: { type: 'array' },
        newCoherence: { type: 'number' },
        changesMade: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'adjustment-application']
}));

export const reassessConflictsTask = defineTask('equilibrium-conflict-reassessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Conflict Reassessment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Conflict reassessment specialist',
      task: 'Reassess conflicts after adjustment',
      context: args,
      instructions: [
        'Check if previous conflicts resolved',
        'Identify any new conflicts created',
        'Update conflict list',
        'Assess resolution progress',
        'Identify emerging patterns',
        'Update priorities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['remainingConflicts', 'resolvedConflicts'],
      properties: {
        remainingConflicts: { type: 'array' },
        resolvedConflicts: { type: 'array' },
        newConflicts: { type: 'array' },
        resolutionProgress: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'conflict-reassessment']
}));

export const verifyEquilibriumTask = defineTask('equilibrium-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Equilibrium Verification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium verification specialist',
      task: 'Verify that equilibrium has been achieved',
      context: args,
      instructions: [
        'Verify coherence threshold met',
        'Check for hidden conflicts',
        'Assess principle coverage',
        'Verify judgment consistency',
        'Assess equilibrium quality',
        'Document verification results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibriumAchieved', 'qualityScore'],
      properties: {
        equilibriumAchieved: { type: 'boolean' },
        qualityScore: { type: 'number' },
        hiddenConflicts: { type: 'array' },
        coverageAssessment: { type: 'object' },
        verificationNotes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'verification']
}));

export const checkWideEquilibriumTask = defineTask('equilibrium-wide-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Wide Equilibrium Check',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Wide reflective equilibrium specialist',
      task: 'Check consistency with background theories and facts',
      context: args,
      instructions: [
        'Check consistency with background theories',
        'Verify factual consistency',
        'Assess external coherence',
        'Identify potential tensions',
        'Evaluate overall integration',
        'Document wide equilibrium status'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['achieved', 'backgroundConsistency', 'factualConsistency'],
      properties: {
        achieved: { type: 'boolean' },
        backgroundConsistency: { type: 'number' },
        factualConsistency: { type: 'number' },
        externalTensions: { type: 'array' },
        integrationScore: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'wide-equilibrium']
}));

export const analyzeStabilityTask = defineTask('equilibrium-stability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Stability Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium stability analyst',
      task: 'Analyze stability of achieved equilibrium',
      context: args,
      instructions: [
        'Test equilibrium under perturbations',
        'Identify vulnerability points',
        'Assess robustness',
        'Evaluate resilience to new cases',
        'Identify stabilizing factors',
        'Calculate stability score'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['isStable', 'robustnessScore'],
      properties: {
        isStable: { type: 'boolean' },
        vulnerabilities: { type: 'array' },
        robustnessScore: { type: 'number' },
        perturbationResults: { type: 'array' },
        stabilizingFactors: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'stability-analysis']
}));

export const documentEquilibriumTask = defineTask('equilibrium-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Documentation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'equilibrium-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium documentation specialist',
      task: 'Document equilibrium process and provide recommendations',
      context: args,
      instructions: [
        'Summarize equilibrium journey',
        'Document key adjustments',
        'Explain rationale for changes',
        'Provide recommendations for maintenance',
        'Identify areas for future refinement',
        'Create guidance for similar cases'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'summary'],
      properties: {
        summary: { type: 'object' },
        keyAdjustments: { type: 'array' },
        rationales: { type: 'array' },
        recommendations: { type: 'array' },
        futureRefinements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reflective-equilibrium', 'documentation']
}));
