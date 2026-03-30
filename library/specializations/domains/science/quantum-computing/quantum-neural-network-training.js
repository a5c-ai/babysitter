/**
 * @process Quantum Neural Network Training
 * @id QC-ML-002
 * @description Design and train quantum neural networks (QNNs) for machine learning tasks,
 * addressing challenges like barren plateaus and optimizing training strategies.
 * @category Quantum Computing - Machine Learning
 * @priority P2 - Medium
 * @inputs {{ task: string, architecture?: object, dataset: object }}
 * @outputs {{ success: boolean, trainedQNN: object, performance: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-neural-network-training', {
 *   task: 'regression',
 *   architecture: { layers: 4, qubits: 8 },
 *   dataset: { X_train, y_train, X_test, y_test }
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    task = 'classification', // 'classification', 'regression', 'generative'
    architecture = {},
    dataset,
    numQubits = 4,
    numLayers = 4,
    entanglement = 'full',
    gradientMethod = 'parameter_shift', // 'parameter_shift', 'adjoint', 'finite_diff'
    optimizer = 'Adam',
    learningRate = 0.01,
    batchSize = 32,
    epochs = 100,
    framework = 'pennylane',
    outputDir = 'qnn-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Neural Network Training`);
  ctx.log('info', `Task: ${task}, Qubits: ${numQubits}, Layers: ${numLayers}`);

  // ============================================================================
  // PHASE 1: QNN ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: QNN Architecture Design');

  const architectureResult = await ctx.task(qnnArchitectureDesignTask, {
    task,
    architecture,
    numQubits,
    numLayers,
    entanglement,
    framework
  });

  artifacts.push(...(architectureResult.artifacts || []));

  await ctx.breakpoint({
    question: `QNN architecture designed. Qubits: ${architectureResult.qubitCount}, Parameters: ${architectureResult.parameterCount}, Depth: ${architectureResult.circuitDepth}. Proceed with trainability analysis?`,
    title: 'QNN Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureResult,
      files: (architectureResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: BARREN PLATEAU ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Barren Plateau Analysis');

  const barrenResult = await ctx.task(barrenPlateauAnalysisTask, {
    architecture: architectureResult,
    numQubits,
    numLayers,
    framework
  });

  artifacts.push(...(barrenResult.artifacts || []));

  if (barrenResult.barrenPlateauRisk === 'high') {
    await ctx.breakpoint({
      question: `High barren plateau risk detected. Variance: ${barrenResult.gradientVariance}. Apply mitigation or modify architecture?`,
      title: 'Barren Plateau Warning',
      context: {
        runId: ctx.runId,
        barrenPlateau: barrenResult,
        files: (barrenResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PARAMETER INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Parameter Initialization');

  const initResult = await ctx.task(parameterInitializationTask, {
    architecture: architectureResult,
    barrenPlateauAnalysis: barrenResult,
    framework
  });

  artifacts.push(...(initResult.artifacts || []));

  ctx.log('info', `Parameters initialized using ${initResult.initializationMethod}`);

  // ============================================================================
  // PHASE 4: GRADIENT COMPUTATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Gradient Computation Setup');

  const gradientResult = await ctx.task(gradientComputationSetupTask, {
    architecture: architectureResult,
    gradientMethod,
    framework
  });

  artifacts.push(...(gradientResult.artifacts || []));

  // ============================================================================
  // PHASE 5: TRAINING LOOP
  // ============================================================================

  ctx.log('info', 'Phase 5: Training Loop');

  const trainingResult = await ctx.task(qnnTrainingLoopTask, {
    architecture: architectureResult,
    initialParameters: initResult.initialParameters,
    gradientConfig: gradientResult,
    dataset,
    task,
    optimizer,
    learningRate,
    batchSize,
    epochs,
    framework
  });

  artifacts.push(...(trainingResult.artifacts || []));

  await ctx.breakpoint({
    question: `Training complete. Epochs: ${trainingResult.epochsRun}, Final loss: ${trainingResult.finalLoss}, Best validation: ${trainingResult.bestValidationMetric}. Review training history?`,
    title: 'Training Results Review',
    context: {
      runId: ctx.runId,
      training: trainingResult,
      files: (trainingResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: EXPRESSIBILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Expressibility Analysis');

  const expressibilityResult = await ctx.task(expressibilityAnalysisTask, {
    architecture: architectureResult,
    trainedParameters: trainingResult.optimalParameters,
    framework
  });

  artifacts.push(...(expressibilityResult.artifacts || []));

  // ============================================================================
  // PHASE 7: PERFORMANCE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Performance Evaluation');

  const performanceResult = await ctx.task(qnnPerformanceEvaluationTask, {
    trainedQNN: trainingResult.trainedQNN,
    testData: dataset.testData,
    task,
    framework
  });

  artifacts.push(...(performanceResult.artifacts || []));

  // ============================================================================
  // PHASE 8: TRAINING STRATEGY RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Training Strategy Recommendations');

  const recommendationsResult = await ctx.task(trainingRecommendationsTask, {
    architectureResult,
    barrenResult,
    trainingResult,
    expressibilityResult,
    performanceResult
  });

  artifacts.push(...(recommendationsResult.artifacts || []));

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documentation');

  const reportResult = await ctx.task(qnnReportTask, {
    task,
    architectureResult,
    barrenResult,
    initResult,
    trainingResult,
    expressibilityResult,
    performanceResult,
    recommendationsResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `QNN training complete. Test performance: ${performanceResult.testMetric}, Expressibility: ${expressibilityResult.expressibilityScore}. Approve results?`,
    title: 'QNN Training Complete',
    context: {
      runId: ctx.runId,
      summary: {
        task,
        testPerformance: performanceResult.testMetric,
        expressibility: expressibilityResult.expressibilityScore,
        trainable: barrenResult.barrenPlateauRisk !== 'high'
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    task,
    trainedQNN: {
      parameters: trainingResult.optimalParameters,
      architecture: architectureResult.architecture,
      qubitCount: architectureResult.qubitCount,
      layerCount: numLayers
    },
    performance: {
      trainLoss: trainingResult.finalLoss,
      validationMetric: trainingResult.bestValidationMetric,
      testMetric: performanceResult.testMetric,
      metrics: performanceResult.allMetrics
    },
    analysis: {
      barrenPlateauRisk: barrenResult.barrenPlateauRisk,
      gradientVariance: barrenResult.gradientVariance,
      expressibility: expressibilityResult.expressibilityScore,
      entanglingCapability: expressibilityResult.entanglingCapability
    },
    training: {
      epochs: trainingResult.epochsRun,
      optimizer,
      learningRate,
      initializationMethod: initResult.initializationMethod,
      gradientMethod
    },
    recommendations: recommendationsResult.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ML-002',
      processName: 'Quantum Neural Network Training',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const qnnArchitectureDesignTask = defineTask('qnn-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QNN Architecture Design',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Neural Network Architect',
      task: 'Design quantum neural network architecture',
      context: args,
      instructions: [
        '1. Design input encoding layer',
        '2. Design variational layers',
        '3. Configure entanglement pattern',
        '4. Design output measurement strategy',
        '5. Calculate total parameters',
        '6. Estimate circuit depth',
        '7. Consider hardware constraints',
        '8. Design for trainability',
        '9. Generate architecture diagram',
        '10. Document architecture choices'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'qubitCount', 'parameterCount', 'circuitDepth'],
      properties: {
        architecture: { type: 'object' },
        qubitCount: { type: 'number' },
        parameterCount: { type: 'number' },
        circuitDepth: { type: 'number' },
        encodingLayer: { type: 'object' },
        variationalLayers: { type: 'array' },
        measurementLayer: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'architecture']
}));

export const barrenPlateauAnalysisTask = defineTask('qnn-barren-plateau', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Barren Plateau Analysis',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Trainability Specialist',
      task: 'Analyze barren plateau risk for QNN',
      context: args,
      instructions: [
        '1. Calculate gradient variance',
        '2. Analyze variance scaling with qubits',
        '3. Check expressibility impact',
        '4. Analyze entanglement effects',
        '5. Identify barren plateau risk level',
        '6. Suggest mitigation strategies',
        '7. Recommend architecture modifications',
        '8. Analyze cost function landscape',
        '9. Estimate trainability',
        '10. Document analysis results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['barrenPlateauRisk', 'gradientVariance'],
      properties: {
        barrenPlateauRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
        gradientVariance: { type: 'number' },
        varianceScaling: { type: 'object' },
        mitigationStrategies: { type: 'array', items: { type: 'string' } },
        recommendedChanges: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'trainability']
}));

export const parameterInitializationTask = defineTask('qnn-parameter-init', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parameter Initialization',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'QNN Initialization Specialist',
      task: 'Initialize QNN parameters for optimal training',
      context: args,
      instructions: [
        '1. Select initialization strategy',
        '2. Consider barren plateau mitigation',
        '3. Implement layer-wise initialization',
        '4. Use problem-informed initialization',
        '5. Apply block initialization if needed',
        '6. Generate initial parameters',
        '7. Validate parameter distribution',
        '8. Test gradient flow',
        '9. Document initialization method',
        '10. Provide initialization recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['initialParameters', 'initializationMethod'],
      properties: {
        initialParameters: { type: 'array', items: { type: 'number' } },
        initializationMethod: { type: 'string' },
        parameterDistribution: { type: 'object' },
        gradientFlowTest: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'initialization']
}));

export const gradientComputationSetupTask = defineTask('qnn-gradient-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gradient Computation Setup',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Gradient Specialist',
      task: 'Set up gradient computation for QNN training',
      context: args,
      instructions: [
        '1. Configure gradient computation method',
        '2. Set up parameter shift rule',
        '3. Configure adjoint differentiation',
        '4. Set up finite difference backup',
        '5. Optimize circuit executions',
        '6. Configure batching strategy',
        '7. Set up gradient clipping',
        '8. Configure natural gradient if needed',
        '9. Test gradient computation',
        '10. Document gradient setup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['gradientConfig'],
      properties: {
        gradientConfig: { type: 'object' },
        gradientMethod: { type: 'string' },
        circuitsPerGradient: { type: 'number' },
        batchingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'gradient']
}));

export const qnnTrainingLoopTask = defineTask('qnn-training-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QNN Training Loop',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'QNN Training Specialist',
      task: 'Execute QNN training loop',
      context: args,
      instructions: [
        '1. Set up data loaders',
        '2. Configure optimizer',
        '3. Implement training loop',
        '4. Process batches',
        '5. Compute loss and gradients',
        '6. Update parameters',
        '7. Track training metrics',
        '8. Validate periodically',
        '9. Save checkpoints',
        '10. Return trained model'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['trainedQNN', 'optimalParameters', 'epochsRun', 'finalLoss'],
      properties: {
        trainedQNN: { type: 'object' },
        optimalParameters: { type: 'array', items: { type: 'number' } },
        epochsRun: { type: 'number' },
        finalLoss: { type: 'number' },
        bestValidationMetric: { type: 'number' },
        trainingHistory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'training']
}));

export const expressibilityAnalysisTask = defineTask('qnn-expressibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Expressibility Analysis',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Expressibility Specialist',
      task: 'Analyze expressibility and entangling capability of QNN',
      context: args,
      instructions: [
        '1. Sample random parameters',
        '2. Calculate fidelities between states',
        '3. Compare with Haar random distribution',
        '4. Calculate expressibility score',
        '5. Measure entangling capability',
        '6. Analyze coverage of state space',
        '7. Compare with other architectures',
        '8. Generate expressibility plots',
        '9. Document expressibility analysis',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['expressibilityScore', 'entanglingCapability'],
      properties: {
        expressibilityScore: { type: 'number' },
        entanglingCapability: { type: 'number' },
        fidelityDistribution: { type: 'object' },
        stateSpaceCoverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'expressibility']
}));

export const qnnPerformanceEvaluationTask = defineTask('qnn-performance-eval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QNN Performance Evaluation',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'ML Performance Evaluation Specialist',
      task: 'Evaluate trained QNN performance',
      context: args,
      instructions: [
        '1. Run inference on test set',
        '2. Calculate task-specific metrics',
        '3. Generate predictions',
        '4. Calculate accuracy/MSE',
        '5. Analyze error distribution',
        '6. Generate performance plots',
        '7. Compare with baselines',
        '8. Document performance',
        '9. Identify failure modes',
        '10. Provide assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testMetric', 'allMetrics'],
      properties: {
        testMetric: { type: 'number' },
        allMetrics: { type: 'object' },
        predictions: { type: 'array' },
        errorAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'evaluation']
}));

export const trainingRecommendationsTask = defineTask('qnn-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Strategy Recommendations',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'QNN Optimization Specialist',
      task: 'Provide training strategy recommendations',
      context: args,
      instructions: [
        '1. Analyze training results',
        '2. Identify improvement opportunities',
        '3. Recommend architecture changes',
        '4. Suggest optimization improvements',
        '5. Recommend regularization',
        '6. Suggest data augmentation',
        '7. Recommend hyperparameter tuning',
        '8. Suggest barren plateau mitigation',
        '9. Provide transfer learning suggestions',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        architectureChanges: { type: 'array' },
        hyperparameterSuggestions: { type: 'object' },
        prioritizedActions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'recommendations']
}));

export const qnnReportTask = defineTask('qnn-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QNN Report Generation',
  agent: {
    name: 'qnn-trainer',
    skills: ['vqc-trainer', 'barren-plateau-analyzer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive QNN training report',
      context: args,
      instructions: [
        '1. Summarize QNN architecture',
        '2. Document training process',
        '3. Present performance results',
        '4. Include trainability analysis',
        '5. Add expressibility results',
        '6. Include visualizations',
        '7. Document recommendations',
        '8. Provide conclusions',
        '9. Add future work suggestions',
        '10. Generate final report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        figures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qnn', 'reporting']
}));
