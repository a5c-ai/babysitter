/**
 * @process domains/science/scientific-discovery/fast-theory-sketching-protocol
 * @description Fast Theory Sketching Protocol: Observe -> Generate hypotheses -> Constraints -> Stress-test -> Experiments
 * @inputs {
 *   phenomenon: string,
 *   observationData: string,
 *   domain: string,
 *   iterations: number
 * }
 * @outputs {
 *   success: boolean,
 *   sketchedTheory: object,
 *   experimentalPlan: object,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    observationData = '',
    domain = 'general science',
    iterations = 2,
    convergenceThreshold = 80
  } = inputs;

  const startTime = ctx.now();
  const sketchingHistory = [];
  let currentTheory = null;
  let converged = false;
  let iteration = 0;

  // PHASE 1: OBSERVE - Systematic observation and pattern identification
  ctx.log('info', 'Phase 1: Systematic observation');
  const observation = await ctx.task(systematicObservationTask, {
    phenomenon,
    observationData,
    domain
  });

  sketchingHistory.push({
    phase: 'observation',
    result: observation,
    timestamp: ctx.now()
  });

  // Iterative theory sketching loop
  while (!converged && iteration < iterations) {
    iteration++;
    ctx.log('info', `Theory sketching iteration ${iteration}`);

    // PHASE 2: GENERATE HYPOTHESES - Rapid hypothesis generation
    ctx.log('info', `Phase 2: Generating hypotheses (iteration ${iteration})`);
    const hypotheses = await ctx.task(generateHypothesesTask, {
      observation,
      previousTheory: currentTheory,
      iteration,
      domain
    });

    sketchingHistory.push({
      iteration,
      phase: 'hypothesis-generation',
      result: hypotheses,
      timestamp: ctx.now()
    });

    // PHASE 3: CONSTRAINTS - Apply theoretical and empirical constraints
    ctx.log('info', `Phase 3: Applying constraints (iteration ${iteration})`);
    const constrainedHypotheses = await ctx.task(applyConstraintsTask, {
      hypotheses,
      observation,
      domain
    });

    sketchingHistory.push({
      iteration,
      phase: 'constraints',
      result: constrainedHypotheses,
      timestamp: ctx.now()
    });

    // PHASE 4: STRESS-TEST - Challenge hypotheses with edge cases
    ctx.log('info', `Phase 4: Stress-testing (iteration ${iteration})`);
    const stressTestResults = await ctx.task(stressTestHypothesesTask, {
      hypotheses: constrainedHypotheses.survivingHypotheses,
      observation,
      domain
    });

    sketchingHistory.push({
      iteration,
      phase: 'stress-test',
      result: stressTestResults,
      timestamp: ctx.now()
    });

    // Select best theory from surviving hypotheses
    ctx.log('info', `Selecting best theory (iteration ${iteration})`);
    const theorySelection = await ctx.task(selectBestTheoryTask, {
      stressTestResults,
      constrainedHypotheses,
      observation,
      domain
    });

    currentTheory = theorySelection.selectedTheory;

    sketchingHistory.push({
      iteration,
      phase: 'theory-selection',
      result: theorySelection,
      timestamp: ctx.now()
    });

    // Check for convergence
    converged = theorySelection.confidenceScore >= convergenceThreshold;

    if (!converged && iteration < iterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Theory confidence ${theorySelection.confidenceScore}%. Continue sketching?`,
        title: `Fast Theory Sketching - Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/iteration-${iteration}-theory.json`, format: 'json' },
            { path: `artifacts/iteration-${iteration}-stress-tests.json`, format: 'json' }
          ]
        }
      });
    }
  }

  // PHASE 5: EXPERIMENTS - Design discriminating experiments
  ctx.log('info', 'Phase 5: Designing experiments');
  const experimentalPlan = await ctx.task(designExperimentsTask, {
    currentTheory,
    observation,
    sketchingHistory,
    domain
  });

  sketchingHistory.push({
    phase: 'experiment-design',
    result: experimentalPlan,
    timestamp: ctx.now()
  });

  // Final synthesis
  ctx.log('info', 'Synthesizing fast theory sketching results');
  const synthesis = await ctx.task(synthesizeTheorySketchTask, {
    phenomenon,
    observation,
    currentTheory,
    experimentalPlan,
    sketchingHistory,
    domain
  });

  return {
    success: converged || iteration === iterations,
    processId: 'domains/science/scientific-discovery/fast-theory-sketching-protocol',
    phenomenon,
    domain,
    observation,
    sketchedTheory: currentTheory,
    experimentalPlan,
    sketchingHistory,
    synthesis,
    insights: synthesis.insights,
    metadata: {
      totalIterations: iteration,
      converged,
      finalConfidence: currentTheory?.confidenceScore || 0,
      hypothesesGenerated: sketchingHistory.filter(h => h.phase === 'hypothesis-generation').reduce((sum, h) => sum + (h.result.hypotheses?.length || 0), 0),
      experimentsDesigned: experimentalPlan.experiments?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const systematicObservationTask = defineTask('systematic-observation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Systematic Observation',
  agent: {
    name: 'scientific-observer',
    prompt: {
      role: 'observational scientist',
      task: 'Perform systematic observation of the phenomenon',
      context: args,
      instructions: [
        'Document all observable features',
        'Identify patterns and regularities',
        'Note anomalies and exceptions',
        'Quantify where possible',
        'Identify variables and their ranges',
        'Document environmental conditions',
        'Create structured observation record'
      ],
      outputFormat: 'JSON with observations, patterns, anomalies, variables'
    },
    outputSchema: {
      type: 'object',
      required: ['observations', 'patterns', 'variables'],
      properties: {
        observations: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        anomalies: { type: 'array', items: { type: 'object' } },
        variables: { type: 'array', items: { type: 'object' } },
        conditions: { type: 'object' },
        quantitativeData: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'observation']
}));

export const generateHypothesesTask = defineTask('generate-hypotheses', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Hypotheses: Iteration ${args.iteration}`,
  agent: {
    name: 'hypothesis-generator',
    prompt: {
      role: 'theoretical scientist',
      task: 'Rapidly generate multiple hypotheses to explain observations',
      context: args,
      instructions: [
        'Generate diverse hypotheses quickly',
        'Include conventional and unconventional ideas',
        'Consider multiple mechanism types',
        'Build on previous theories if provided',
        'Ensure hypotheses are testable',
        'Document the reasoning behind each',
        'Generate at least 5-10 hypotheses'
      ],
      outputFormat: 'JSON with hypotheses, mechanisms, testability'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              mechanism: { type: 'string' },
              predictions: { type: 'array', items: { type: 'string' } },
              testability: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        },
        diversity: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'hypothesis-generation']
}));

export const applyConstraintsTask = defineTask('apply-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Constraints',
  agent: {
    name: 'constraint-applier',
    prompt: {
      role: 'theoretical physicist',
      task: 'Apply theoretical and empirical constraints to hypotheses',
      context: args,
      instructions: [
        'Apply physical/domain constraints',
        'Check consistency with observations',
        'Apply parsimony constraints',
        'Check for logical consistency',
        'Apply conservation laws if applicable',
        'Filter out obviously invalid hypotheses',
        'Rank surviving hypotheses'
      ],
      outputFormat: 'JSON with surviving hypotheses, eliminated hypotheses, rankings'
    },
    outputSchema: {
      type: 'object',
      required: ['survivingHypotheses', 'eliminatedHypotheses'],
      properties: {
        survivingHypotheses: { type: 'array', items: { type: 'object' } },
        eliminatedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              eliminationReason: { type: 'string' },
              violatedConstraint: { type: 'string' }
            }
          }
        },
        rankings: { type: 'array', items: { type: 'object' } },
        constraintsApplied: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'constraints']
}));

export const stressTestHypothesesTask = defineTask('stress-test-hypotheses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stress-Test Hypotheses',
  agent: {
    name: 'stress-tester',
    prompt: {
      role: 'critical scientist',
      task: 'Stress-test surviving hypotheses with edge cases',
      context: args,
      instructions: [
        'Generate challenging edge cases',
        'Test each hypothesis against edge cases',
        'Push hypotheses to their limits',
        'Identify breaking points',
        'Document failure modes',
        'Rate robustness of each hypothesis',
        'Identify the most robust hypotheses'
      ],
      outputFormat: 'JSON with test results, robustness scores, failure modes'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'robustnessScores'],
      properties: {
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              edgeCases: { type: 'array', items: { type: 'object' } },
              passed: { type: 'number' },
              failed: { type: 'number' },
              failureModes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        robustnessScores: { type: 'array', items: { type: 'object' } },
        mostRobust: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'stress-test']
}));

export const selectBestTheoryTask = defineTask('select-best-theory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Best Theory',
  agent: {
    name: 'theory-selector',
    prompt: {
      role: 'senior scientist',
      task: 'Select the best theory from stress-tested hypotheses',
      context: args,
      instructions: [
        'Evaluate all surviving hypotheses',
        'Consider robustness, parsimony, and explanatory power',
        'Select the best hypothesis as working theory',
        'Document selection criteria',
        'Assign confidence score 0-100',
        'Identify areas needing refinement',
        'Note alternative promising hypotheses'
      ],
      outputFormat: 'JSON with selected theory, confidence, alternatives'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTheory', 'confidenceScore'],
      properties: {
        selectedTheory: { type: 'object' },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        selectionCriteria: { type: 'array', items: { type: 'string' } },
        refinementNeeded: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'selection']
}));

export const designExperimentsTask = defineTask('design-experiments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Discriminating Experiments',
  agent: {
    name: 'experiment-designer',
    prompt: {
      role: 'experimental scientist',
      task: 'Design experiments to test and discriminate the theory',
      context: args,
      instructions: [
        'Design experiments to test key predictions',
        'Design experiments to discriminate between theory and alternatives',
        'Prioritize by information value',
        'Consider feasibility and resources',
        'Specify expected outcomes',
        'Design both confirming and potentially falsifying experiments',
        'Create comprehensive experimental plan'
      ],
      outputFormat: 'JSON with experiments, priorities, expected outcomes'
    },
    outputSchema: {
      type: 'object',
      required: ['experiments'],
      properties: {
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              targetPrediction: { type: 'string' },
              expectedOutcome: { type: 'string' },
              discriminatoryPower: { type: 'string' },
              feasibility: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        experimentalPlan: { type: 'object' },
        resourceRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'experiments']
}));

export const synthesizeTheorySketchTask = defineTask('synthesize-theory-sketch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Theory Sketching Results',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'scientific synthesizer',
      task: 'Synthesize the fast theory sketching process results',
      context: args,
      instructions: [
        'Summarize the sketched theory',
        'Document the evidence base',
        'Highlight key insights from the process',
        'Note remaining uncertainties',
        'Provide the experimental roadmap',
        'Assess overall confidence',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, confidence, roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights', 'theorySummary'],
      properties: {
        synthesis: { type: 'string' },
        theorySummary: { type: 'object' },
        evidenceBase: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } },
        uncertainties: { type: 'array', items: { type: 'string' } },
        experimentalRoadmap: { type: 'object' },
        overallConfidence: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory-sketching', 'synthesis']
}));
