/**
 * @process quantum-computing/variational-algorithm
 * @description QC-ALGO-002: Implement and tune variational quantum algorithms (VQE/QAOA) for optimization and chemistry
 * @inputs { problemType: string, hamiltonian: object, ansatzType: string, optimizer: string }
 * @outputs { success: boolean, optimalParameters: array, energy: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemType = 'optimization',
    hamiltonian,
    ansatzType = 'hardware_efficient',
    optimizer = 'COBYLA',
    maxIterations = 500,
    convergenceThreshold = 1e-6,
    outputDir = 'variational-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Problem Hamiltonian
  ctx.log('info', 'Defining problem Hamiltonian and cost function');
  const hamiltonianDefinition = await ctx.task(hamiltonianDefinitionTask, {
    problemType,
    hamiltonian,
    outputDir
  });

  if (!hamiltonianDefinition.success) {
    return {
      success: false,
      error: 'Hamiltonian definition failed',
      details: hamiltonianDefinition,
      metadata: { processId: 'quantum-computing/variational-algorithm', timestamp: startTime }
    };
  }

  artifacts.push(...hamiltonianDefinition.artifacts);

  // Task 2: Design Parameterized Ansatz
  ctx.log('info', 'Designing parameterized ansatz circuit');
  const ansatzDesign = await ctx.task(ansatzDesignTask, {
    hamiltonianInfo: hamiltonianDefinition.hamiltonianInfo,
    ansatzType,
    outputDir
  });

  artifacts.push(...ansatzDesign.artifacts);

  // Task 3: Configure Classical Optimizer
  ctx.log('info', 'Configuring classical optimizer');
  const optimizerConfig = await ctx.task(optimizerConfigurationTask, {
    optimizer,
    maxIterations,
    convergenceThreshold,
    parameterCount: ansatzDesign.parameterCount,
    outputDir
  });

  artifacts.push(...optimizerConfig.artifacts);

  // Task 4: Implement Hybrid Optimization Loop
  ctx.log('info', 'Implementing hybrid quantum-classical optimization loop');
  const hybridLoop = await ctx.task(hybridOptimizationTask, {
    hamiltonian: hamiltonianDefinition.hamiltonianInfo,
    ansatz: ansatzDesign.ansatz,
    optimizerSettings: optimizerConfig.settings,
    outputDir
  });

  artifacts.push(...hybridLoop.artifacts);

  // Task 5: Tune Hyperparameters
  ctx.log('info', 'Tuning hyperparameters and convergence criteria');
  const hyperparameterTuning = await ctx.task(hyperparameterTuningTask, {
    hybridLoop: hybridLoop.implementation,
    initialResults: hybridLoop.initialResults,
    outputDir
  });

  artifacts.push(...hyperparameterTuning.artifacts);

  // Task 6: Execute VQE/QAOA
  ctx.log('info', 'Executing variational algorithm');
  const executionResult = await ctx.task(variationalExecutionTask, {
    hybridLoop: hybridLoop.implementation,
    tunedParameters: hyperparameterTuning.bestParameters,
    outputDir
  });

  artifacts.push(...executionResult.artifacts);

  // Breakpoint: Review optimization results
  await ctx.breakpoint({
    question: `Variational algorithm completed. Final energy: ${executionResult.finalEnergy}. Iterations: ${executionResult.iterations}. Converged: ${executionResult.converged}. Review results?`,
    title: 'Variational Algorithm Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        algorithmType: problemType === 'chemistry' ? 'VQE' : 'QAOA',
        finalEnergy: executionResult.finalEnergy,
        iterations: executionResult.iterations,
        converged: executionResult.converged,
        ansatzType
      }
    }
  });

  // Task 7: Benchmark Against Classical
  ctx.log('info', 'Benchmarking against classical solutions');
  const classicalBenchmark = await ctx.task(classicalBenchmarkTask, {
    hamiltonianInfo: hamiltonianDefinition.hamiltonianInfo,
    quantumResult: executionResult,
    outputDir
  });

  artifacts.push(...classicalBenchmark.artifacts);

  // Task 8: Generate Convergence Analysis
  ctx.log('info', 'Generating convergence analysis and results report');
  const convergenceAnalysis = await ctx.task(convergenceAnalysisTask, {
    executionResult,
    classicalBenchmark: classicalBenchmark.comparison,
    outputDir
  });

  artifacts.push(...convergenceAnalysis.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithm: problemType === 'chemistry' ? 'VQE' : 'QAOA',
    optimalParameters: executionResult.optimalParameters,
    energy: executionResult.finalEnergy,
    convergence: {
      converged: executionResult.converged,
      iterations: executionResult.iterations,
      history: executionResult.energyHistory
    },
    classicalComparison: {
      classicalEnergy: classicalBenchmark.classicalEnergy,
      energyDifference: classicalBenchmark.energyDifference,
      chemicalAccuracy: classicalBenchmark.withinChemicalAccuracy
    },
    ansatz: {
      type: ansatzType,
      depth: ansatzDesign.depth,
      parameterCount: ansatzDesign.parameterCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'quantum-computing/variational-algorithm',
      timestamp: startTime,
      problemType,
      optimizer
    }
  };
}

// Task 1: Hamiltonian Definition
export const hamiltonianDefinitionTask = defineTask('hamiltonian-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define problem Hamiltonian and cost function',
  agent: {
    name: 'hamiltonian-engineer',
    prompt: {
      role: 'quantum physicist',
      task: 'Define the problem Hamiltonian for variational optimization',
      context: args,
      instructions: [
        'Parse problem specification',
        'Construct Hamiltonian terms (Pauli strings)',
        'Calculate Hamiltonian coefficients',
        'Verify Hermiticity',
        'Compute ground state energy bounds',
        'Generate Hamiltonian visualization',
        'Document term structure',
        'Save Hamiltonian specification to output directory'
      ],
      outputFormat: 'JSON with success flag, hamiltonianInfo object, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hamiltonianInfo', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hamiltonianInfo: {
          type: 'object',
          properties: {
            numQubits: { type: 'number' },
            numTerms: { type: 'number' },
            pauliStrings: { type: 'array' },
            coefficients: { type: 'array' },
            groundStateEstimate: { type: 'number' }
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
  labels: ['agent', 'quantum', 'hamiltonian', 'vqe', 'qaoa']
}));

// Task 2: Ansatz Design
export const ansatzDesignTask = defineTask('ansatz-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design parameterized ansatz circuit',
  agent: {
    name: 'ansatz-designer',
    prompt: {
      role: 'quantum circuit designer',
      task: 'Design optimal parameterized ansatz for variational algorithm',
      context: args,
      instructions: [
        'Select ansatz type (hardware-efficient, UCCSD, ADAPT, etc.)',
        'Determine circuit depth and structure',
        'Design rotation layers',
        'Add entanglement layers',
        'Ensure sufficient expressibility',
        'Consider barren plateau mitigation',
        'Generate circuit diagram',
        'Save ansatz specification to output directory'
      ],
      outputFormat: 'JSON with ansatz object, parameter count, depth, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ansatz', 'parameterCount', 'depth', 'artifacts'],
      properties: {
        ansatz: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            structure: { type: 'array' },
            entanglementMap: { type: 'string' }
          }
        },
        parameterCount: { type: 'number' },
        depth: { type: 'number' },
        expressibility: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'ansatz', 'circuit-design']
}));

// Task 3: Optimizer Configuration
export const optimizerConfigurationTask = defineTask('optimizer-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure classical optimizer',
  agent: {
    name: 'optimizer-configurator',
    prompt: {
      role: 'optimization specialist',
      task: 'Configure classical optimizer for hybrid quantum-classical loop',
      context: args,
      instructions: [
        'Select optimizer (COBYLA, SPSA, Adam, L-BFGS-B)',
        'Configure learning rate or step size',
        'Set convergence criteria',
        'Configure iteration limits',
        'Set up gradient computation method if needed',
        'Configure noise resilience settings for SPSA',
        'Document optimizer selection rationale',
        'Save configuration to output directory'
      ],
      outputFormat: 'JSON with optimizer settings, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['settings', 'artifacts'],
      properties: {
        settings: {
          type: 'object',
          properties: {
            optimizer: { type: 'string' },
            maxIterations: { type: 'number' },
            convergenceThreshold: { type: 'number' },
            learningRate: { type: 'number' },
            gradientMethod: { type: 'string' }
          }
        },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'optimizer', 'configuration']
}));

// Task 4: Hybrid Optimization Implementation
export const hybridOptimizationTask = defineTask('hybrid-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hybrid quantum-classical optimization loop',
  agent: {
    name: 'hybrid-system-engineer',
    prompt: {
      role: 'quantum software engineer',
      task: 'Implement the hybrid quantum-classical optimization loop',
      context: args,
      instructions: [
        'Implement expectation value computation',
        'Set up parameter update loop',
        'Implement callback for tracking progress',
        'Add energy history logging',
        'Implement early stopping conditions',
        'Handle shot noise in measurements',
        'Add parameter persistence',
        'Save implementation to output directory'
      ],
      outputFormat: 'JSON with implementation details, initial test results, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'initialResults', 'artifacts'],
      properties: {
        implementation: {
          type: 'object',
          properties: {
            codeModule: { type: 'string' },
            expectationMethod: { type: 'string' },
            shotsPerIteration: { type: 'number' }
          }
        },
        initialResults: {
          type: 'object',
          properties: {
            initialEnergy: { type: 'number' },
            initialParameters: { type: 'array' }
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
  labels: ['agent', 'quantum', 'hybrid', 'optimization-loop']
}));

// Task 5: Hyperparameter Tuning
export const hyperparameterTuningTask = defineTask('hyperparameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Tune hyperparameters and convergence criteria',
  agent: {
    name: 'hyperparameter-tuner',
    prompt: {
      role: 'machine learning engineer',
      task: 'Tune hyperparameters for optimal convergence',
      context: args,
      instructions: [
        'Test different learning rates',
        'Experiment with shot counts',
        'Tune convergence thresholds',
        'Optimize initialization strategies',
        'Test different ansatz depths',
        'Analyze parameter landscapes',
        'Select best configuration',
        'Save tuning results to output directory'
      ],
      outputFormat: 'JSON with best parameters, tuning history, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bestParameters', 'artifacts'],
      properties: {
        bestParameters: {
          type: 'object',
          properties: {
            learningRate: { type: 'number' },
            shots: { type: 'number' },
            ansatzDepth: { type: 'number' },
            initializationStrategy: { type: 'string' }
          }
        },
        tuningHistory: { type: 'array' },
        parameterSensitivity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'hyperparameter', 'tuning']
}));

// Task 6: Variational Execution
export const variationalExecutionTask = defineTask('variational-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute variational algorithm',
  agent: {
    name: 'vqa-executor',
    prompt: {
      role: 'quantum computing practitioner',
      task: 'Execute the variational quantum algorithm with tuned parameters',
      context: args,
      instructions: [
        'Initialize with tuned parameters',
        'Execute optimization loop',
        'Track convergence progress',
        'Log energy history',
        'Capture optimal parameters',
        'Verify final state',
        'Generate execution report',
        'Save results to output directory'
      ],
      outputFormat: 'JSON with optimal parameters, final energy, convergence status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalParameters', 'finalEnergy', 'converged', 'iterations', 'artifacts'],
      properties: {
        optimalParameters: { type: 'array', items: { type: 'number' } },
        finalEnergy: { type: 'number' },
        converged: { type: 'boolean' },
        iterations: { type: 'number' },
        energyHistory: { type: 'array', items: { type: 'number' } },
        finalState: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'vqe', 'qaoa', 'execution']
}));

// Task 7: Classical Benchmark
export const classicalBenchmarkTask = defineTask('classical-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark against classical solutions',
  agent: {
    name: 'classical-benchmarker',
    prompt: {
      role: 'computational scientist',
      task: 'Compare quantum results with classical exact diagonalization or approximation',
      context: args,
      instructions: [
        'Compute exact ground state energy if feasible',
        'Run classical approximation algorithms',
        'Calculate energy differences',
        'Assess chemical accuracy (1.6 mHa for chemistry)',
        'Compare computational resources',
        'Document quantum advantage analysis',
        'Generate comparison visualizations',
        'Save benchmark results to output directory'
      ],
      outputFormat: 'JSON with classical energy, comparison metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['classicalEnergy', 'energyDifference', 'comparison', 'artifacts'],
      properties: {
        classicalEnergy: { type: 'number' },
        energyDifference: { type: 'number' },
        withinChemicalAccuracy: { type: 'boolean' },
        comparison: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            computationTime: { type: 'object' },
            accuracy: { type: 'number' }
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
  labels: ['agent', 'quantum', 'benchmark', 'classical-comparison']
}));

// Task 8: Convergence Analysis
export const convergenceAnalysisTask = defineTask('convergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate convergence analysis and results report',
  agent: {
    name: 'convergence-analyst',
    prompt: {
      role: 'quantum algorithm analyst',
      task: 'Analyze convergence behavior and generate comprehensive results report',
      context: args,
      instructions: [
        'Plot energy convergence history',
        'Analyze parameter evolution',
        'Identify convergence bottlenecks',
        'Calculate convergence rate',
        'Generate summary statistics',
        'Create executive summary',
        'Document lessons learned',
        'Save analysis report to output directory'
      ],
      outputFormat: 'JSON with analysis summary, visualizations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            convergenceRate: { type: 'number' },
            bottlenecks: { type: 'array', items: { type: 'string' } },
            parameterStability: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'convergence', 'analysis', 'reporting']
}));
