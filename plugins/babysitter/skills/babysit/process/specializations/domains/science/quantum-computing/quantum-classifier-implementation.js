/**
 * @process Quantum Classifier Implementation
 * @id QC-ML-001
 * @description Implement quantum machine learning classifiers including variational quantum
 * classifiers, quantum kernel methods, and quantum support vector machines.
 * @category Quantum Computing - Machine Learning
 * @priority P1 - High
 * @inputs {{ dataset: object, classifierType?: string, features?: number }}
 * @outputs {{ success: boolean, trainedClassifier: object, accuracy: number, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-classifier-implementation', {
 *   dataset: { X_train, y_train, X_test, y_test },
 *   classifierType: 'VQC',
 *   features: 4
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataset,
    classifierType = 'VQC', // 'VQC', 'QSVM', 'QKernel'
    features,
    encodingType = 'amplitude', // 'amplitude', 'angle', 'iqp'
    ansatzType = 'real_amplitudes',
    optimizer = 'COBYLA',
    maxIterations = 200,
    numLayers = 2,
    framework = 'qiskit_ml',
    outputDir = 'quantum-classifier-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Classifier Implementation`);
  ctx.log('info', `Type: ${classifierType}, Encoding: ${encodingType}, Ansatz: ${ansatzType}`);

  // ============================================================================
  // PHASE 1: DATA PREPROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Data Preprocessing');

  const preprocessResult = await ctx.task(dataPreprocessingTask, {
    dataset,
    features,
    encodingType
  });

  artifacts.push(...(preprocessResult.artifacts || []));

  await ctx.breakpoint({
    question: `Data preprocessed. Samples: ${preprocessResult.numSamples}, Features: ${preprocessResult.numFeatures}, Classes: ${preprocessResult.numClasses}. Proceed with encoding circuit design?`,
    title: 'Data Preprocessing Review',
    context: {
      runId: ctx.runId,
      preprocessing: preprocessResult,
      files: (preprocessResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: DATA ENCODING CIRCUIT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Data Encoding Circuit Design');

  const encodingResult = await ctx.task(dataEncodingCircuitTask, {
    numFeatures: preprocessResult.numFeatures,
    encodingType,
    framework
  });

  artifacts.push(...(encodingResult.artifacts || []));

  ctx.log('info', `Encoding circuit designed. Qubits: ${encodingResult.qubitCount}, Depth: ${encodingResult.encodingDepth}`);

  // ============================================================================
  // PHASE 3: CLASSIFIER ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Classifier Architecture Design');

  const architectureResult = await ctx.task(classifierArchitectureTask, {
    classifierType,
    encodingCircuit: encodingResult,
    numClasses: preprocessResult.numClasses,
    ansatzType,
    numLayers,
    framework
  });

  artifacts.push(...(architectureResult.artifacts || []));

  await ctx.breakpoint({
    question: `Classifier architecture designed. Parameters: ${architectureResult.parameterCount}, Total depth: ${architectureResult.totalDepth}. Proceed with training?`,
    title: 'Classifier Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureResult,
      files: (architectureResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: CLASSIFIER TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 4: Classifier Training');

  const trainingResult = await ctx.task(classifierTrainingTask, {
    classifierType,
    architecture: architectureResult,
    trainData: preprocessResult.trainData,
    optimizer,
    maxIterations,
    framework
  });

  artifacts.push(...(trainingResult.artifacts || []));

  ctx.log('info', `Training complete. Iterations: ${trainingResult.iterations}, Final loss: ${trainingResult.finalLoss}`);

  // ============================================================================
  // PHASE 5: MODEL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Model Validation');

  const validationResult = await ctx.task(classifierValidationTask, {
    trainedClassifier: trainingResult.trainedClassifier,
    valData: preprocessResult.valData,
    framework
  });

  artifacts.push(...(validationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Validation complete. Accuracy: ${validationResult.accuracy}, F1-score: ${validationResult.f1Score}. Review validation metrics?`,
    title: 'Validation Results Review',
    context: {
      runId: ctx.runId,
      validation: validationResult,
      files: (validationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: TEST SET EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Test Set Evaluation');

  const testResult = await ctx.task(testSetEvaluationTask, {
    trainedClassifier: trainingResult.trainedClassifier,
    testData: preprocessResult.testData,
    framework
  });

  artifacts.push(...(testResult.artifacts || []));

  // ============================================================================
  // PHASE 7: CLASSICAL BASELINE COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 7: Classical Baseline Comparison');

  const baselineResult = await ctx.task(classicalBaselineComparisonTask, {
    dataset: preprocessResult,
    quantumAccuracy: testResult.accuracy
  });

  artifacts.push(...(baselineResult.artifacts || []));

  // ============================================================================
  // PHASE 8: CONVERGENCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Convergence Analysis');

  const convergenceResult = await ctx.task(trainingConvergenceAnalysisTask, {
    trainingHistory: trainingResult.history,
    validationHistory: validationResult.history
  });

  artifacts.push(...(convergenceResult.artifacts || []));

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documentation');

  const reportResult = await ctx.task(classifierReportTask, {
    classifierType,
    preprocessResult,
    encodingResult,
    architectureResult,
    trainingResult,
    validationResult,
    testResult,
    baselineResult,
    convergenceResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Quantum classifier complete. Test accuracy: ${testResult.accuracy}, Classical baseline: ${baselineResult.bestClassicalAccuracy}. Approve results?`,
    title: 'Quantum Classifier Complete',
    context: {
      runId: ctx.runId,
      summary: {
        classifierType,
        testAccuracy: testResult.accuracy,
        classicalBaseline: baselineResult.bestClassicalAccuracy,
        quantumAdvantage: testResult.accuracy > baselineResult.bestClassicalAccuracy
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    classifierType,
    trainedClassifier: {
      parameters: trainingResult.optimalParameters,
      architecture: architectureResult.architecture,
      encodingType,
      ansatzType
    },
    accuracy: {
      train: trainingResult.trainAccuracy,
      validation: validationResult.accuracy,
      test: testResult.accuracy
    },
    metrics: {
      precision: testResult.precision,
      recall: testResult.recall,
      f1Score: testResult.f1Score,
      confusionMatrix: testResult.confusionMatrix
    },
    comparison: {
      classicalBaseline: baselineResult.bestClassicalAccuracy,
      bestClassicalMethod: baselineResult.bestMethod,
      quantumAdvantage: testResult.accuracy > baselineResult.bestClassicalAccuracy
    },
    training: {
      iterations: trainingResult.iterations,
      finalLoss: trainingResult.finalLoss,
      converged: convergenceResult.converged
    },
    resources: {
      qubits: architectureResult.qubitCount,
      parameters: architectureResult.parameterCount,
      circuitDepth: architectureResult.totalDepth
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ML-001',
      processName: 'Quantum Classifier Implementation',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataPreprocessingTask = defineTask('qml-data-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Preprocessing',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Machine Learning Data Specialist',
      task: 'Preprocess dataset for quantum classifier',
      context: args,
      instructions: [
        '1. Load and validate dataset',
        '2. Perform feature selection if needed',
        '3. Normalize/standardize features',
        '4. Scale to appropriate range for encoding',
        '5. Split into train/validation/test sets',
        '6. Handle class imbalance if present',
        '7. Encode labels appropriately',
        '8. Validate data quality',
        '9. Calculate dataset statistics',
        '10. Document preprocessing steps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['trainData', 'valData', 'testData', 'numFeatures', 'numClasses', 'numSamples'],
      properties: {
        trainData: { type: 'object' },
        valData: { type: 'object' },
        testData: { type: 'object' },
        numFeatures: { type: 'number' },
        numClasses: { type: 'number' },
        numSamples: { type: 'number' },
        featureNames: { type: 'array' },
        classDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'preprocessing']
}));

export const dataEncodingCircuitTask = defineTask('qml-data-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Encoding Circuit Design',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Data Encoding Specialist',
      task: 'Design quantum circuit for classical data encoding',
      context: args,
      instructions: [
        '1. Select appropriate encoding strategy',
        '2. Design amplitude encoding circuit',
        '3. Design angle encoding circuit',
        '4. Implement IQP feature map if selected',
        '5. Calculate required qubits',
        '6. Implement data re-uploading if needed',
        '7. Optimize encoding depth',
        '8. Test encoding with sample data',
        '9. Generate encoding circuit',
        '10. Document encoding approach'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['encodingCircuit', 'qubitCount', 'encodingDepth'],
      properties: {
        encodingCircuit: { type: 'object' },
        qubitCount: { type: 'number' },
        encodingDepth: { type: 'number' },
        encodingType: { type: 'string' },
        parameterMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'encoding']
}));

export const classifierArchitectureTask = defineTask('qml-classifier-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classifier Architecture Design',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum ML Architecture Specialist',
      task: 'Design quantum classifier architecture',
      context: args,
      instructions: [
        '1. Design variational ansatz layers',
        '2. Configure entanglement pattern',
        '3. Add measurement strategy for classification',
        '4. Implement multi-class output if needed',
        '5. Calculate total parameter count',
        '6. Optimize for trainability',
        '7. Consider barren plateau mitigation',
        '8. Calculate total circuit depth',
        '9. Generate architecture diagram',
        '10. Document architecture choices'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'parameterCount', 'totalDepth', 'qubitCount'],
      properties: {
        architecture: { type: 'object' },
        parameterCount: { type: 'number' },
        totalDepth: { type: 'number' },
        qubitCount: { type: 'number' },
        ansatzCircuit: { type: 'object' },
        measurementStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'architecture']
}));

export const classifierTrainingTask = defineTask('qml-classifier-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classifier Training',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum ML Training Specialist',
      task: 'Train quantum classifier on dataset',
      context: args,
      instructions: [
        '1. Initialize parameters',
        '2. Configure optimizer',
        '3. Set up loss function (cross-entropy, etc.)',
        '4. Implement training loop',
        '5. Calculate gradients (parameter shift)',
        '6. Update parameters',
        '7. Monitor training loss',
        '8. Track training accuracy',
        '9. Save training history',
        '10. Return optimal parameters'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['trainedClassifier', 'optimalParameters', 'iterations', 'finalLoss'],
      properties: {
        trainedClassifier: { type: 'object' },
        optimalParameters: { type: 'array', items: { type: 'number' } },
        iterations: { type: 'number' },
        finalLoss: { type: 'number' },
        trainAccuracy: { type: 'number' },
        history: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'training']
}));

export const classifierValidationTask = defineTask('qml-classifier-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classifier Validation',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'ML Validation Specialist',
      task: 'Validate trained quantum classifier',
      context: args,
      instructions: [
        '1. Run predictions on validation set',
        '2. Calculate accuracy',
        '3. Calculate precision and recall',
        '4. Calculate F1 score',
        '5. Generate confusion matrix',
        '6. Analyze misclassifications',
        '7. Check for overfitting',
        '8. Track validation history',
        '9. Generate validation report',
        '10. Document validation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracy', 'f1Score'],
      properties: {
        accuracy: { type: 'number' },
        precision: { type: 'number' },
        recall: { type: 'number' },
        f1Score: { type: 'number' },
        confusionMatrix: { type: 'array' },
        history: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'validation']
}));

export const testSetEvaluationTask = defineTask('qml-test-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Set Evaluation',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'ML Evaluation Specialist',
      task: 'Evaluate trained classifier on test set',
      context: args,
      instructions: [
        '1. Run predictions on test set',
        '2. Calculate all metrics',
        '3. Generate classification report',
        '4. Create confusion matrix',
        '5. Calculate ROC-AUC if applicable',
        '6. Analyze per-class performance',
        '7. Identify failure modes',
        '8. Generate visualizations',
        '9. Document test results',
        '10. Provide final assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracy', 'precision', 'recall', 'f1Score', 'confusionMatrix'],
      properties: {
        accuracy: { type: 'number' },
        precision: { type: 'number' },
        recall: { type: 'number' },
        f1Score: { type: 'number' },
        confusionMatrix: { type: 'array' },
        rocAuc: { type: 'number' },
        classificationReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'evaluation']
}));

export const classicalBaselineComparisonTask = defineTask('qml-classical-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Baseline Comparison',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'ML Benchmarking Specialist',
      task: 'Compare quantum classifier with classical baselines',
      context: args,
      instructions: [
        '1. Train SVM classifier',
        '2. Train Random Forest',
        '3. Train Neural Network',
        '4. Train Logistic Regression',
        '5. Evaluate all on test set',
        '6. Compare with quantum accuracy',
        '7. Analyze computational resources',
        '8. Identify quantum advantage conditions',
        '9. Document comparison results',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestClassicalAccuracy', 'bestMethod', 'allResults'],
      properties: {
        bestClassicalAccuracy: { type: 'number' },
        bestMethod: { type: 'string' },
        allResults: { type: 'object' },
        quantumAdvantage: { type: 'boolean' },
        resourceComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'benchmark']
}));

export const trainingConvergenceAnalysisTask = defineTask('qml-convergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Convergence Analysis',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Optimization Analysis Specialist',
      task: 'Analyze training convergence of quantum classifier',
      context: args,
      instructions: [
        '1. Analyze loss curve',
        '2. Check for convergence',
        '3. Identify training issues',
        '4. Detect overfitting',
        '5. Analyze gradient behavior',
        '6. Check for barren plateaus',
        '7. Generate convergence plots',
        '8. Provide optimization recommendations',
        '9. Document convergence analysis',
        '10. Suggest improvements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['converged'],
      properties: {
        converged: { type: 'boolean' },
        convergenceRate: { type: 'number' },
        overfitting: { type: 'boolean' },
        barrenPlateauDetected: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'ml', 'convergence']
}));

export const classifierReportTask = defineTask('qml-classifier-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classifier Report Generation',
  agent: {
    name: 'qml-engineer',
    skills: ['quantum-kernel-estimator', 'vqc-trainer', 'data-encoder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'ML Documentation Specialist',
      task: 'Generate comprehensive quantum classifier report',
      context: args,
      instructions: [
        '1. Summarize classifier configuration',
        '2. Document training process',
        '3. Present performance metrics',
        '4. Include comparison with baselines',
        '5. Add convergence analysis',
        '6. Include visualizations',
        '7. Document circuit details',
        '8. Provide conclusions',
        '9. Add recommendations',
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
  labels: ['quantum-computing', 'ml', 'reporting']
}));
