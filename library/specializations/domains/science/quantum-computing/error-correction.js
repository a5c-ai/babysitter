/**
 * @process quantum-computing/error-correction
 * @description QC-ERR-002: Implement quantum error correction codes for fault-tolerant computation
 * @inputs { codeType: string, logicalQubits: number, errorModel: object }
 * @outputs { success: boolean, qecImplementation: object, threshold: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    codeType = 'surface_code',
    logicalQubits = 1,
    errorModel,
    codeDistance = 3,
    targetLogicalErrorRate = 1e-10,
    outputDir = 'qec-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Select QEC Code
  ctx.log('info', 'Selecting appropriate QEC code for application');
  const codeSelection = await ctx.task(codeSelectionTask, {
    codeType,
    logicalQubits,
    errorModel,
    targetLogicalErrorRate,
    outputDir
  });

  if (!codeSelection.success) {
    return {
      success: false,
      error: 'QEC code selection failed',
      details: codeSelection,
      metadata: { processId: 'quantum-computing/error-correction', timestamp: startTime }
    };
  }

  artifacts.push(...codeSelection.artifacts);

  // Task 2: Implement Logical Qubit Encoding
  ctx.log('info', 'Implementing logical qubit encoding');
  const encodingImplementation = await ctx.task(logicalEncodingTask, {
    codeSpec: codeSelection.codeSpec,
    codeDistance,
    logicalQubits,
    outputDir
  });

  artifacts.push(...encodingImplementation.artifacts);

  // Task 3: Design Syndrome Extraction Circuits
  ctx.log('info', 'Designing syndrome extraction circuits');
  const syndromeCircuits = await ctx.task(syndromeExtractionTask, {
    codeSpec: codeSelection.codeSpec,
    encodingCircuit: encodingImplementation.encodingCircuit,
    outputDir
  });

  artifacts.push(...syndromeCircuits.artifacts);

  // Task 4: Implement Classical Decoder
  ctx.log('info', 'Implementing classical decoder algorithms');
  const decoderImplementation = await ctx.task(decoderImplementationTask, {
    codeSpec: codeSelection.codeSpec,
    syndromeFormat: syndromeCircuits.syndromeFormat,
    outputDir
  });

  artifacts.push(...decoderImplementation.artifacts);

  // Task 5: Simulate Error Correction Performance
  ctx.log('info', 'Simulating error correction performance');
  const performanceSimulation = await ctx.task(qecPerformanceSimulationTask, {
    codeSpec: codeSelection.codeSpec,
    encodingCircuit: encodingImplementation.encodingCircuit,
    syndromeCircuits: syndromeCircuits.circuits,
    decoder: decoderImplementation.decoder,
    errorModel,
    outputDir
  });

  artifacts.push(...performanceSimulation.artifacts);

  // Task 6: Analyze Threshold
  ctx.log('info', 'Analyzing threshold and overhead requirements');
  const thresholdAnalysis = await ctx.task(thresholdAnalysisTask, {
    performanceResults: performanceSimulation.results,
    codeSpec: codeSelection.codeSpec,
    errorModel,
    outputDir
  });

  artifacts.push(...thresholdAnalysis.artifacts);

  // Breakpoint: Review QEC implementation
  await ctx.breakpoint({
    question: `QEC implementation complete. Code: ${codeType}, Distance: ${codeDistance}. Threshold: ${thresholdAnalysis.threshold}. Overhead: ${thresholdAnalysis.overhead.physicalQubits} physical qubits per logical. Review?`,
    title: 'Quantum Error Correction Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        codeType,
        codeDistance,
        threshold: thresholdAnalysis.threshold,
        physicalQubitOverhead: thresholdAnalysis.overhead.physicalQubits,
        logicalErrorRate: performanceSimulation.logicalErrorRate
      }
    }
  });

  // Task 7: Resource Overhead Estimation
  ctx.log('info', 'Estimating resource overhead');
  const resourceEstimation = await ctx.task(qecResourceEstimationTask, {
    codeSpec: codeSelection.codeSpec,
    thresholdAnalysis: thresholdAnalysis.analysis,
    targetLogicalErrorRate,
    outputDir
  });

  artifacts.push(...resourceEstimation.artifacts);

  // Task 8: Generate QEC Documentation
  ctx.log('info', 'Generating QEC documentation');
  const documentation = await ctx.task(qecDocumentationTask, {
    codeSelection: codeSelection.codeSpec,
    encodingImplementation: encodingImplementation.implementation,
    syndromeCircuits: syndromeCircuits.circuits,
    decoderImplementation: decoderImplementation.decoder,
    performanceResults: performanceSimulation.results,
    thresholdAnalysis: thresholdAnalysis.analysis,
    resourceEstimation: resourceEstimation.estimate,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qecImplementation: {
      codeType,
      codeDistance,
      codeSpec: codeSelection.codeSpec,
      encodingCircuit: encodingImplementation.encodingCircuit,
      syndromeCircuits: syndromeCircuits.circuits,
      decoder: decoderImplementation.decoder
    },
    performance: {
      logicalErrorRate: performanceSimulation.logicalErrorRate,
      threshold: thresholdAnalysis.threshold,
      belowThreshold: thresholdAnalysis.belowThreshold
    },
    overhead: {
      physicalQubits: thresholdAnalysis.overhead.physicalQubits,
      syndromeRounds: thresholdAnalysis.overhead.syndromeRounds,
      gateOverhead: resourceEstimation.estimate.gateOverhead
    },
    resourceEstimate: resourceEstimation.estimate,
    artifacts,
    duration,
    metadata: {
      processId: 'quantum-computing/error-correction',
      timestamp: startTime,
      codeType,
      codeDistance
    }
  };
}

// Task 1: QEC Code Selection
export const codeSelectionTask = defineTask('code-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate QEC code for application',
  agent: {
    name: 'qec-strategist',
    prompt: {
      role: 'quantum error correction specialist',
      task: 'Select optimal QEC code based on requirements and constraints',
      context: args,
      instructions: [
        'Evaluate surface codes, color codes, Steane code',
        'Consider hardware connectivity requirements',
        'Assess threshold requirements',
        'Evaluate magic state distillation needs',
        'Consider code switching strategies',
        'Document code properties (n, k, d)',
        'Select optimal code configuration',
        'Save selection analysis to output directory'
      ],
      outputFormat: 'JSON with success flag, codeSpec object, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'codeSpec', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        codeSpec: {
          type: 'object',
          properties: {
            codeName: { type: 'string' },
            n: { type: 'number' },
            k: { type: 'number' },
            d: { type: 'number' },
            stabilizers: { type: 'array' },
            logicalOperators: { type: 'object' }
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
  labels: ['agent', 'quantum', 'qec', 'code-selection']
}));

// Task 2: Logical Qubit Encoding
export const logicalEncodingTask = defineTask('logical-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement logical qubit encoding',
  agent: {
    name: 'encoding-engineer',
    prompt: {
      role: 'quantum encoding specialist',
      task: 'Implement circuits for encoding logical qubits',
      context: args,
      instructions: [
        'Design encoding circuit for code',
        'Implement state preparation for |0_L> and |1_L>',
        'Create logical gate implementations',
        'Design transversal gate circuits',
        'Implement lattice surgery operations if needed',
        'Verify encoding correctness',
        'Document encoding procedure',
        'Save encoding circuits to output directory'
      ],
      outputFormat: 'JSON with encoding circuit, logical gates, implementation details, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['encodingCircuit', 'implementation', 'artifacts'],
      properties: {
        encodingCircuit: { type: 'object' },
        implementation: {
          type: 'object',
          properties: {
            logicalZero: { type: 'object' },
            logicalOne: { type: 'object' },
            logicalGates: { type: 'object' }
          }
        },
        verificationResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'encoding']
}));

// Task 3: Syndrome Extraction
export const syndromeExtractionTask = defineTask('syndrome-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design syndrome extraction circuits',
  agent: {
    name: 'syndrome-designer',
    prompt: {
      role: 'quantum fault-tolerance engineer',
      task: 'Design fault-tolerant syndrome extraction circuits',
      context: args,
      instructions: [
        'Design stabilizer measurement circuits',
        'Ensure fault-tolerant flag qubit usage',
        'Optimize measurement scheduling',
        'Handle ancilla preparation and reset',
        'Design repeated measurement cycles',
        'Minimize circuit depth',
        'Document syndrome format',
        'Save syndrome circuits to output directory'
      ],
      outputFormat: 'JSON with syndrome circuits, measurement schedule, format specification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['circuits', 'syndromeFormat', 'artifacts'],
      properties: {
        circuits: {
          type: 'object',
          properties: {
            xStabilizers: { type: 'array' },
            zStabilizers: { type: 'array' },
            measurementSchedule: { type: 'array' }
          }
        },
        syndromeFormat: {
          type: 'object',
          properties: {
            numBits: { type: 'number' },
            mapping: { type: 'object' }
          }
        },
        circuitDepth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'syndrome']
}));

// Task 4: Decoder Implementation
export const decoderImplementationTask = defineTask('decoder-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement classical decoder algorithms',
  agent: {
    name: 'decoder-implementer',
    prompt: {
      role: 'quantum decoding specialist',
      task: 'Implement classical decoders for the QEC code',
      context: args,
      instructions: [
        'Implement minimum-weight perfect matching (MWPM)',
        'Implement union-find decoder',
        'Add neural network decoder option',
        'Handle space-time syndrome graphs',
        'Optimize decoder speed',
        'Benchmark decoder accuracy',
        'Document decoder API',
        'Save decoder implementation to output directory'
      ],
      outputFormat: 'JSON with decoder object, benchmark results, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['decoder', 'artifacts'],
      properties: {
        decoder: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            algorithm: { type: 'string' },
            complexity: { type: 'string' }
          }
        },
        benchmarkResults: {
          type: 'object',
          properties: {
            decodingTime: { type: 'number' },
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
  labels: ['agent', 'quantum', 'qec', 'decoder']
}));

// Task 5: Performance Simulation
export const qecPerformanceSimulationTask = defineTask('qec-performance-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate error correction performance',
  agent: {
    name: 'qec-simulator',
    prompt: {
      role: 'quantum simulation specialist',
      task: 'Simulate QEC performance under various error models',
      context: args,
      instructions: [
        'Configure noise simulation',
        'Run Monte Carlo error sampling',
        'Execute syndrome extraction cycles',
        'Apply decoder to syndromes',
        'Track logical errors',
        'Compute logical error rate',
        'Vary error rates for threshold estimation',
        'Save simulation results to output directory'
      ],
      outputFormat: 'JSON with simulation results, logical error rate, threshold data, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'logicalErrorRate', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            totalTrials: { type: 'number' },
            logicalErrors: { type: 'number' },
            physicalErrorRates: { type: 'array' }
          }
        },
        logicalErrorRate: { type: 'number' },
        thresholdData: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'simulation']
}));

// Task 6: Threshold Analysis
export const thresholdAnalysisTask = defineTask('threshold-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze threshold and overhead requirements',
  agent: {
    name: 'threshold-analyst',
    prompt: {
      role: 'quantum error correction analyst',
      task: 'Analyze code threshold and resource overhead',
      context: args,
      instructions: [
        'Fit threshold curves from simulation data',
        'Calculate error correction threshold',
        'Determine if below threshold',
        'Calculate physical qubit overhead',
        'Estimate syndrome measurement rounds',
        'Compute time overhead',
        'Generate threshold plots',
        'Save threshold analysis to output directory'
      ],
      outputFormat: 'JSON with threshold value, overhead metrics, analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threshold', 'overhead', 'belowThreshold', 'analysis', 'artifacts'],
      properties: {
        threshold: { type: 'number' },
        belowThreshold: { type: 'boolean' },
        overhead: {
          type: 'object',
          properties: {
            physicalQubits: { type: 'number' },
            syndromeRounds: { type: 'number' },
            timeOverhead: { type: 'number' }
          }
        },
        analysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'threshold']
}));

// Task 7: Resource Estimation
export const qecResourceEstimationTask = defineTask('qec-resource-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate resource overhead',
  agent: {
    name: 'resource-estimator',
    prompt: {
      role: 'quantum resource planner',
      task: 'Estimate complete resource requirements for fault-tolerant computation',
      context: args,
      instructions: [
        'Calculate total physical qubits needed',
        'Estimate magic state distillation overhead',
        'Calculate gate operation costs',
        'Estimate total computation time',
        'Project hardware requirements',
        'Compare with NISQ requirements',
        'Create resource scaling projections',
        'Save resource estimates to output directory'
      ],
      outputFormat: 'JSON with comprehensive resource estimates, projections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimate', 'artifacts'],
      properties: {
        estimate: {
          type: 'object',
          properties: {
            totalPhysicalQubits: { type: 'number' },
            magicStateFactories: { type: 'number' },
            gateOverhead: { type: 'number' },
            estimatedRuntime: { type: 'string' }
          }
        },
        scalingProjections: { type: 'object' },
        hardwareComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'resource-estimation']
}));

// Task 8: QEC Documentation
export const qecDocumentationTask = defineTask('qec-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate QEC documentation',
  agent: {
    name: 'qec-documenter',
    prompt: {
      role: 'quantum technical writer',
      task: 'Generate comprehensive QEC implementation documentation',
      context: args,
      instructions: [
        'Document code properties and selection rationale',
        'Explain encoding procedure',
        'Detail syndrome extraction circuits',
        'Document decoder algorithms',
        'Present performance results',
        'Include threshold analysis',
        'Provide implementation guide',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with documentation paths, key sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        implementationGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'qec', 'documentation']
}));
