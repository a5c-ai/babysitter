/**
 * @process domains/science/scientific-discovery/exploratory-cycle
 * @description Exploratory Cycle: explore -> model -> predict -> test -> refine
 * @inputs {
 *   phenomenon: string,
 *   initialObservations: string,
 *   domain: string,
 *   iterations: number,
 *   convergenceThreshold: number
 * }
 * @outputs {
 *   success: boolean,
 *   refinedModel: object,
 *   predictions: array,
 *   testResults: array,
 *   cycleHistory: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    initialObservations = '',
    domain = 'general science',
    iterations = 3,
    convergenceThreshold = 85
  } = inputs;

  const cycleHistory = [];
  let currentModel = null;
  let converged = false;
  let iteration = 0;

  // Phase 1: Initial Exploration
  ctx.log('info', 'Starting exploratory cycle: Initial exploration phase');
  const exploration = await ctx.task(exploreTask, {
    phenomenon,
    initialObservations,
    domain,
    previousModels: []
  });

  cycleHistory.push({
    iteration: 0,
    phase: 'exploration',
    result: exploration,
    timestamp: ctx.now()
  });

  while (!converged && iteration < iterations) {
    iteration++;

    // Phase 2: Model Building
    ctx.log('info', `Iteration ${iteration}: Building model from observations`);
    const model = await ctx.task(modelBuildingTask, {
      phenomenon,
      domain,
      observations: iteration === 1 ? exploration.observations : cycleHistory[cycleHistory.length - 1].result.refinedObservations,
      previousModel: currentModel,
      iteration
    });

    currentModel = model;
    cycleHistory.push({
      iteration,
      phase: 'modeling',
      result: model,
      timestamp: ctx.now()
    });

    // Phase 3: Generate Predictions
    ctx.log('info', `Iteration ${iteration}: Generating predictions from model`);
    const predictions = await ctx.task(predictionTask, {
      phenomenon,
      domain,
      model: currentModel,
      iteration
    });

    cycleHistory.push({
      iteration,
      phase: 'prediction',
      result: predictions,
      timestamp: ctx.now()
    });

    // Phase 4: Test Predictions
    ctx.log('info', `Iteration ${iteration}: Testing predictions`);
    const testResults = await ctx.task(testingTask, {
      phenomenon,
      domain,
      model: currentModel,
      predictions: predictions.predictions,
      iteration
    });

    cycleHistory.push({
      iteration,
      phase: 'testing',
      result: testResults,
      timestamp: ctx.now()
    });

    // Phase 5: Refine Model Based on Test Results
    ctx.log('info', `Iteration ${iteration}: Refining model based on test results`);
    const refinement = await ctx.task(refinementTask, {
      phenomenon,
      domain,
      model: currentModel,
      predictions: predictions.predictions,
      testResults: testResults,
      convergenceThreshold,
      iteration
    });

    currentModel = refinement.refinedModel;
    cycleHistory.push({
      iteration,
      phase: 'refinement',
      result: refinement,
      timestamp: ctx.now()
    });

    converged = refinement.convergenceScore >= convergenceThreshold;

    if (!converged && iteration < iterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration} complete. Convergence: ${refinement.convergenceScore}%. Continue exploration?`,
        title: `Exploratory Cycle - Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/iteration-${iteration}-model.json`, format: 'json' },
            { path: `artifacts/iteration-${iteration}-test-results.json`, format: 'json' }
          ]
        }
      });
    }
  }

  // Final synthesis
  const synthesis = await ctx.task(synthesisTask, {
    phenomenon,
    domain,
    finalModel: currentModel,
    cycleHistory,
    totalIterations: iteration
  });

  return {
    success: converged || iteration === iterations,
    processId: 'domains/science/scientific-discovery/exploratory-cycle',
    phenomenon,
    domain,
    refinedModel: currentModel,
    predictions: cycleHistory.filter(h => h.phase === 'prediction').map(h => h.result),
    testResults: cycleHistory.filter(h => h.phase === 'testing').map(h => h.result),
    synthesis,
    cycleHistory,
    metadata: {
      totalIterations: iteration,
      converged,
      finalConvergenceScore: cycleHistory[cycleHistory.length - 1]?.result?.convergenceScore || 0,
      timestamp: ctx.now()
    }
  };
}

export const exploreTask = defineTask('explore-phenomenon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Explore: ${args.phenomenon}`,
  agent: {
    name: 'scientific-explorer',
    prompt: {
      role: 'scientific researcher and explorer',
      task: 'Explore and document observations about the phenomenon',
      context: args,
      instructions: [
        'Systematically observe and document the phenomenon',
        'Identify key variables and relationships',
        'Note patterns, anomalies, and unexpected behaviors',
        'Gather qualitative and quantitative data',
        'Document environmental conditions and context',
        'Identify potential confounding factors',
        'Generate initial hypotheses for further investigation'
      ],
      outputFormat: 'JSON with observations, patterns, variables, hypotheses'
    },
    outputSchema: {
      type: 'object',
      required: ['observations', 'patterns', 'variables', 'hypotheses'],
      properties: {
        observations: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        variables: { type: 'array', items: { type: 'object' } },
        hypotheses: { type: 'array', items: { type: 'string' } },
        anomalies: { type: 'array', items: { type: 'string' } },
        context: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'exploration']
}));

export const modelBuildingTask = defineTask('build-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Building: Iteration ${args.iteration}`,
  agent: {
    name: 'model-builder',
    prompt: {
      role: 'theoretical scientist and model builder',
      task: 'Build or refine a model that explains the observations',
      context: args,
      instructions: [
        'Analyze observations and patterns',
        'Construct a theoretical framework or model',
        'Define relationships between variables',
        'Specify model assumptions and limitations',
        'If refining, incorporate lessons from previous iteration',
        'Ensure model is falsifiable and testable',
        'Document model structure and parameters'
      ],
      outputFormat: 'JSON with model structure, equations, assumptions, parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['modelName', 'structure', 'assumptions', 'parameters'],
      properties: {
        modelName: { type: 'string' },
        structure: { type: 'object' },
        equations: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        parameters: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        explanatoryPower: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'modeling']
}));

export const predictionTask = defineTask('generate-predictions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Predictions: Iteration ${args.iteration}`,
  agent: {
    name: 'prediction-generator',
    prompt: {
      role: 'theoretical scientist',
      task: 'Generate testable predictions from the model',
      context: args,
      instructions: [
        'Derive logical predictions from the model',
        'Specify quantitative predictions where possible',
        'Define boundary conditions for predictions',
        'Identify critical tests that could falsify the model',
        'Rank predictions by testability and importance',
        'Specify expected vs unexpected outcomes',
        'Design experiments to test predictions'
      ],
      outputFormat: 'JSON with predictions, test designs, expected outcomes'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              conditions: { type: 'string' },
              expectedOutcome: { type: 'string' },
              testability: { type: 'string' },
              criticality: { type: 'string' }
            }
          }
        },
        experimentDesigns: { type: 'array', items: { type: 'object' } },
        falsificationCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prediction']
}));

export const testingTask = defineTask('test-predictions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Predictions: Iteration ${args.iteration}`,
  agent: {
    name: 'experimental-tester',
    prompt: {
      role: 'experimental scientist',
      task: 'Design and execute tests for the predictions',
      context: args,
      instructions: [
        'Design rigorous tests for each prediction',
        'Specify measurement protocols and controls',
        'Execute tests (conceptually or via simulation)',
        'Record all results and observations',
        'Compare results with predictions',
        'Identify confirmed, refuted, and ambiguous outcomes',
        'Document unexpected findings and anomalies'
      ],
      outputFormat: 'JSON with test results, confirmations, refutations, anomalies'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'summary'],
      properties: {
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predictionId: { type: 'string' },
              testMethod: { type: 'string' },
              observedOutcome: { type: 'string' },
              matchesPrediction: { type: 'boolean' },
              confidence: { type: 'number' }
            }
          }
        },
        confirmed: { type: 'array', items: { type: 'string' } },
        refuted: { type: 'array', items: { type: 'string' } },
        ambiguous: { type: 'array', items: { type: 'string' } },
        anomalies: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'testing']
}));

export const refinementTask = defineTask('refine-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine Model: Iteration ${args.iteration}`,
  agent: {
    name: 'model-refiner',
    prompt: {
      role: 'theoretical scientist',
      task: 'Refine the model based on test results',
      context: args,
      instructions: [
        'Analyze discrepancies between predictions and results',
        'Identify model weaknesses exposed by testing',
        'Propose modifications to improve model accuracy',
        'Update parameters, structure, or assumptions as needed',
        'Assess convergence toward a stable, accurate model',
        'Document all changes and rationale',
        'Identify new observations needed for next iteration'
      ],
      outputFormat: 'JSON with refined model, changes, convergence score, next steps'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedModel', 'changes', 'convergenceScore'],
      properties: {
        refinedModel: { type: 'object' },
        changes: { type: 'array', items: { type: 'object' } },
        convergenceScore: { type: 'number', minimum: 0, maximum: 100 },
        rationale: { type: 'string' },
        refinedObservations: { type: 'array', items: { type: 'object' } },
        nextIterationFocus: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'refinement']
}));

export const synthesisTask = defineTask('synthesize-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Exploratory Cycle Findings',
  agent: {
    name: 'scientific-synthesizer',
    prompt: {
      role: 'senior scientist',
      task: 'Synthesize findings from the entire exploratory cycle',
      context: args,
      instructions: [
        'Summarize the evolution of understanding across iterations',
        'Present the final model and its explanatory power',
        'Document key insights and discoveries',
        'Identify remaining uncertainties and open questions',
        'Suggest future research directions',
        'Assess the robustness and generalizability of findings',
        'Create a comprehensive scientific report'
      ],
      outputFormat: 'JSON with synthesis, final model, insights, future directions'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'finalModelAssessment', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        finalModelAssessment: { type: 'object' },
        insights: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } },
        robustnessAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'synthesis']
}));
