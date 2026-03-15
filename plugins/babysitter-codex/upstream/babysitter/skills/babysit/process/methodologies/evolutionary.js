/**
 * @process methodologies/evolutionary
 * @description Evolutionary Algorithm - Generate population, evaluate fitness, select, crossover, mutate, repeat
 * @inputs { task: string, populationSize: number, generations: number, mutationRate: number, fitnessThreshold: number }
 * @outputs { success: boolean, bestSolution: object, finalPopulation: array, evolutionHistory: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Evolutionary Algorithm Process
 *
 * Methodology: Initialize population → Evaluate fitness → Select parents → Crossover → Mutate → Repeat
 *
 * This process implements genetic/evolutionary algorithms where:
 * 1. Generate initial population of candidate solutions
 * 2. Evaluate fitness of each candidate
 * 3. Select fittest candidates as parents
 * 4. Create offspring through crossover (combining parent traits)
 * 5. Apply random mutations to introduce variation
 * 6. Replace least fit with offspring
 * 7. Repeat until convergence or max generations
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to solve through evolution
 * @param {number} inputs.populationSize - Number of solutions in each generation (default: 10)
 * @param {number} inputs.generations - Maximum generations to evolve (default: 20)
 * @param {number} inputs.mutationRate - Probability of mutation (0-1, default: 0.2)
 * @param {number} inputs.fitnessThreshold - Target fitness to achieve (0-100, default: 90)
 * @param {string} inputs.selectionStrategy - Selection method: 'tournament', 'roulette', 'rank' (default: 'tournament')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with best evolved solution
 */
export async function process(inputs, ctx) {
  const {
    task,
    populationSize = 10,
    generations = 20,
    mutationRate = 0.2,
    fitnessThreshold = 90,
    selectionStrategy = 'tournament'
  } = inputs;

  let generation = 0;
  let targetReached = false;
  const evolutionHistory = [];

  // Generation 0: Initialize population
  const initialPopulation = await ctx.task(agentGeneratePopulationTask, {
    task,
    populationSize,
    generation: 0,
    parentPopulation: null
  });

  let currentPopulation = initialPopulation.population;

  // Evaluate initial population fitness
  let fitnessResults = await evaluatePopulationFitness(ctx, task, currentPopulation, 0);
  currentPopulation = fitnessResults.rankedPopulation;

  evolutionHistory.push({
    generation: 0,
    population: currentPopulation,
    bestFitness: fitnessResults.bestFitness,
    avgFitness: fitnessResults.avgFitness,
    worstFitness: fitnessResults.worstFitness,
    timestamp: ctx.now()
  });

  // Check if initial population already meets threshold
  if (fitnessResults.bestFitness >= fitnessThreshold) {
    targetReached = true;
  }

  // Evolution loop
  while (!targetReached && generation < generations) {
    generation++;

    // Phase 1: Selection - Choose parents
    const parents = await ctx.task(agentSelectParentsTask, {
      task,
      population: currentPopulation,
      selectionStrategy,
      numParents: Math.ceil(populationSize / 2)
    });

    // Phase 2: Crossover - Create offspring
    const offspring = await ctx.task(agentCrossoverTask, {
      task,
      parents: parents.selectedParents,
      offspringCount: populationSize
    });

    // Phase 3: Mutation - Introduce variations
    const mutatedOffspring = await ctx.task(agentMutateTask, {
      task,
      offspring: offspring.offspring,
      mutationRate,
      generation
    });

    // Combine parent population and offspring
    const combinedPopulation = [
      ...currentPopulation,
      ...mutatedOffspring.mutatedOffspring
    ];

    // Phase 4: Evaluate fitness of combined population
    fitnessResults = await evaluatePopulationFitness(ctx, task, combinedPopulation, generation);

    // Phase 5: Survival selection - Keep best individuals
    currentPopulation = fitnessResults.rankedPopulation.slice(0, populationSize);

    evolutionHistory.push({
      generation,
      population: currentPopulation,
      bestFitness: fitnessResults.bestFitness,
      avgFitness: fitnessResults.avgFitness,
      worstFitness: fitnessResults.worstFitness,
      diversityScore: calculateDiversity(currentPopulation),
      timestamp: ctx.now()
    });

    // Check if target fitness reached
    if (fitnessResults.bestFitness >= fitnessThreshold) {
      targetReached = true;
    }

    // Optional: Breakpoint for review
    if (generation % 5 === 0 && inputs.reviewEveryNGenerations) {
      await ctx.breakpoint({
        question: `Generation ${generation}: Best fitness ${fitnessResults.bestFitness.toFixed(1)}. Continue evolution?`,
        title: `Evolution - Generation ${generation}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/generation-${generation}-population.json`, format: 'json' },
            { path: `artifacts/generation-${generation}-stats.md`, format: 'markdown' }
          ]
        }
      });
    }
  }

  // Final result
  const bestSolution = currentPopulation[0]; // Population is sorted by fitness

  return {
    success: targetReached,
    task,
    generations: generation,
    maxGenerations: generations,
    targetReached,
    bestSolution,
    finalPopulation: currentPopulation,
    evolutionHistory,
    summary: {
      totalGenerations: generation,
      targetReached,
      finalBestFitness: fitnessResults.bestFitness,
      finalAvgFitness: fitnessResults.avgFitness,
      improvementRate: calculateImprovementRate(evolutionHistory),
      convergenceGeneration: findConvergenceGeneration(evolutionHistory),
      fitnessProgress: evolutionHistory.map(h => ({
        generation: h.generation,
        best: h.bestFitness,
        avg: h.avgFitness
      }))
    },
    metadata: {
      processId: 'methodologies/evolutionary',
      timestamp: ctx.now()
    }
  };
}

/**
 * Helper: Evaluate fitness for entire population
 */
async function evaluatePopulationFitness(ctx, task, population, generation) {
  const fitnessEvaluations = [];

  for (let i = 0; i < population.length; i++) {
    const individual = population[i];
    const fitness = await ctx.task(agentEvaluateFitnessTask, {
      task,
      individual,
      generation,
      individualIndex: i
    });

    fitnessEvaluations.push({
      ...individual,
      fitness: fitness.fitness,
      fitnessBreakdown: fitness.breakdown
    });
  }

  // Sort by fitness (descending)
  const ranked = fitnessEvaluations.sort((a, b) => b.fitness - a.fitness);

  return {
    rankedPopulation: ranked,
    bestFitness: ranked[0].fitness,
    avgFitness: ranked.reduce((sum, ind) => sum + ind.fitness, 0) / ranked.length,
    worstFitness: ranked[ranked.length - 1].fitness
  };
}

/**
 * Helper: Calculate population diversity
 */
function calculateDiversity(population) {
  // Simplified diversity metric
  // In real implementation: use genetic distance or phenotype variance
  const uniqueApproaches = new Set(population.map(ind =>
    JSON.stringify(ind.solution?.approach)
  ));
  return (uniqueApproaches.size / population.length) * 100;
}

/**
 * Helper: Calculate improvement rate
 */
function calculateImprovementRate(history) {
  if (history.length < 2) return 0;
  const firstGen = history[0];
  const lastGen = history[history.length - 1];
  return ((lastGen.bestFitness - firstGen.bestFitness) / history.length).toFixed(2);
}

/**
 * Helper: Find generation where fitness converged
 */
function findConvergenceGeneration(history, threshold = 1.0) {
  for (let i = 5; i < history.length; i++) {
    const recentImprovement = history[i].bestFitness - history[i - 5].bestFitness;
    if (Math.abs(recentImprovement) < threshold) {
      return i;
    }
  }
  return null;
}

/**
 * Generate initial population
 */
export const agentGeneratePopulationTask = defineTask('agent-generate-population', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate population - Generation ${args.generation}`,
  description: 'Create diverse initial candidate solutions',

  agent: {
    name: 'population-generator',
    prompt: {
      role: 'creative solution generator',
      task: `Generate ${args.populationSize} diverse candidate solutions`,
      context: {
        task: args.task,
        populationSize: args.populationSize,
        generation: args.generation,
        parentPopulation: args.parentPopulation
      },
      instructions: [
        `Create exactly ${args.populationSize} different solution candidates`,
        'Maximize diversity - explore different approaches',
        'Each solution should be concrete and implementable',
        'Include both conservative and creative approaches',
        'Represent solutions as structured objects with key traits/genes'
      ],
      outputFormat: 'JSON with array of solutions, each with approach, implementation, traits'
    },
    outputSchema: {
      type: 'object',
      required: ['population'],
      properties: {
        population: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              solution: {
                type: 'object',
                properties: {
                  approach: { type: 'string' },
                  implementation: { type: 'string' },
                  traits: { type: 'object', additionalProperties: true }
                }
              }
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

  labels: ['agent', 'evolutionary', 'generate', `gen-${args.generation}`]
}));

/**
 * Evaluate individual fitness
 */
export const agentEvaluateFitnessTask = defineTask('agent-evaluate-fitness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate fitness - Gen ${args.generation}, Individual ${args.individualIndex}`,
  description: 'Score solution quality',

  agent: {
    name: 'fitness-evaluator',
    prompt: {
      role: 'objective fitness evaluator',
      task: 'Evaluate how well this solution solves the task',
      context: {
        task: args.task,
        individual: args.individual,
        generation: args.generation
      },
      instructions: [
        'Evaluate solution correctness',
        'Assess implementation quality',
        'Check completeness',
        'Consider efficiency and elegance',
        'Score from 0-100',
        'Provide breakdown by criteria'
      ],
      outputFormat: 'JSON with fitness score (0-100) and breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['fitness', 'breakdown'],
      properties: {
        fitness: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            correctness: { type: 'number' },
            quality: { type: 'number' },
            completeness: { type: 'number' },
            efficiency: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'evolutionary', 'fitness', `gen-${args.generation}`]
}));

/**
 * Select parents for reproduction
 */
export const agentSelectParentsTask = defineTask('agent-select-parents', (args, taskCtx) => ({
  kind: 'node',
  title: 'Select parents',
  description: 'Choose fit individuals for reproduction',

  script: async () => {
    const { population, selectionStrategy, numParents } = args;
    const parents = [];

    if (selectionStrategy === 'tournament') {
      // Tournament selection: randomly pick k individuals, select best
      const tournamentSize = 3;
      for (let i = 0; i < numParents; i++) {
        const tournament = [];
        for (let j = 0; j < tournamentSize; j++) {
          tournament.push(population[Math.floor(Math.random() * population.length)]);
        }
        const winner = tournament.sort((a, b) => b.fitness - a.fitness)[0];
        parents.push(winner);
      }
    } else if (selectionStrategy === 'roulette') {
      // Roulette wheel selection: probability proportional to fitness
      const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
      for (let i = 0; i < numParents; i++) {
        let spin = Math.random() * totalFitness;
        for (const individual of population) {
          spin -= individual.fitness;
          if (spin <= 0) {
            parents.push(individual);
            break;
          }
        }
      }
    } else {
      // Rank selection: top N individuals
      parents.push(...population.slice(0, numParents));
    }

    return { selectedParents: parents };
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['node', 'evolutionary', 'selection']
}));

/**
 * Crossover - combine parent traits
 */
export const agentCrossoverTask = defineTask('agent-crossover', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Crossover - Create offspring',
  description: 'Combine parent solutions to create offspring',

  agent: {
    name: 'crossover-operator',
    prompt: {
      role: 'genetic crossover operator',
      task: 'Combine parent solutions to create diverse offspring',
      context: {
        task: args.task,
        parents: args.parents,
        offspringCount: args.offspringCount
      },
      instructions: [
        `Create ${args.offspringCount} offspring from the parent solutions`,
        'For each offspring, combine traits from two random parents',
        'Mix approaches, implementation details, and key characteristics',
        'Ensure offspring inherit good traits from parents',
        'Create valid, coherent solutions (not just random combinations)',
        'Maintain diversity in offspring'
      ],
      outputFormat: 'JSON with array of offspring solutions'
    },
    outputSchema: {
      type: 'object',
      required: ['offspring'],
      properties: {
        offspring: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parentIds: { type: 'array', items: { type: 'string' } },
              solution: {
                type: 'object',
                properties: {
                  approach: { type: 'string' },
                  implementation: { type: 'string' },
                  traits: { type: 'object', additionalProperties: true }
                }
              }
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

  labels: ['agent', 'evolutionary', 'crossover']
}));

/**
 * Mutation - introduce random variations
 */
export const agentMutateTask = defineTask('agent-mutate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mutate offspring',
  description: 'Introduce random variations',

  agent: {
    name: 'mutation-operator',
    prompt: {
      role: 'genetic mutation operator',
      task: 'Apply random mutations to offspring solutions',
      context: {
        task: args.task,
        offspring: args.offspring,
        mutationRate: args.mutationRate,
        generation: args.generation
      },
      instructions: [
        `For each offspring, apply mutation with probability ${args.mutationRate}`,
        'Mutations should be small, random changes to traits',
        'Examples: tweak approach, modify implementation detail, adjust parameters',
        'Keep mutations realistic and valid',
        'Mutations introduce novelty to explore solution space',
        `Mark which offspring were mutated`
      ],
      outputFormat: 'JSON with array of mutated offspring'
    },
    outputSchema: {
      type: 'object',
      required: ['mutatedOffspring'],
      properties: {
        mutatedOffspring: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parentIds: { type: 'array', items: { type: 'string' } },
              mutated: { type: 'boolean' },
              mutation: { type: 'string' },
              solution: {
                type: 'object',
                properties: {
                  approach: { type: 'string' },
                  implementation: { type: 'string' },
                  traits: { type: 'object', additionalProperties: true }
                }
              }
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

  labels: ['agent', 'evolutionary', 'mutation']
}));
