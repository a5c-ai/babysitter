/**
 * @process specializations/domains/science/electrical-engineering/dsp-algorithm-design
 * @description DSP Algorithm Design and Implementation - Guide the design and implementation of digital signal
 * processing algorithms. Covers algorithm development, fixed-point conversion, and optimization for real-time
 * performance on DSP processors and FPGAs.
 * @inputs { algorithmName: string, signalType: string, requirements: object, targetPlatform?: string }
 * @outputs { success: boolean, algorithm: object, implementation: object, verificationResults: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/dsp-algorithm-design', {
 *   algorithmName: 'Adaptive Echo Canceller',
 *   signalType: 'audio',
 *   requirements: { sampleRate: '48kHz', latency: '<5ms', convergenceTime: '<1s' },
 *   targetPlatform: 'ARM-Cortex-M7'
 * });
 *
 * @references
 * - IEEE 754 (Floating-Point Arithmetic)
 * - Fixed-Point Best Practices
 * - MATLAB/Simulink Documentation
 * - DSP Algorithm Implementation Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmName,
    signalType,
    requirements,
    targetPlatform = 'generic'
  } = inputs;

  // Phase 1: Define Signal Processing Requirements and Specifications
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    algorithmName,
    signalType,
    requirements,
    targetPlatform
  });

  // Phase 2: Develop Algorithm in Floating-Point
  const floatingPointDevelopment = await ctx.task(floatingPointDevelopmentTask, {
    algorithmName,
    requirements: requirementsDefinition.specifications,
    signalType
  });

  // Breakpoint: Review floating-point algorithm
  await ctx.breakpoint({
    question: `Review floating-point algorithm for ${algorithmName}. Performance meets specifications: ${floatingPointDevelopment.meetsSpecs}. Proceed with validation?`,
    title: 'Algorithm Review',
    context: {
      runId: ctx.runId,
      algorithmName,
      performance: floatingPointDevelopment.performance,
      files: [{
        path: `artifacts/phase2-floating-point.json`,
        format: 'json',
        content: floatingPointDevelopment
      }]
    }
  });

  // Phase 3: Validate Algorithm Performance with Test Signals
  const algorithmValidation = await ctx.task(algorithmValidationTask, {
    algorithmName,
    algorithm: floatingPointDevelopment.algorithm,
    requirements: requirementsDefinition.specifications,
    signalType
  });

  // Quality Gate: Algorithm must meet specifications
  if (!algorithmValidation.allTestsPassed) {
    await ctx.breakpoint({
      question: `Algorithm validation failed ${algorithmValidation.failedTests.length} tests. Review and iterate algorithm design?`,
      title: 'Validation Issues',
      context: {
        runId: ctx.runId,
        failedTests: algorithmValidation.failedTests,
        recommendations: algorithmValidation.recommendations
      }
    });
  }

  // Phase 4: Convert to Fixed-Point Representation
  const fixedPointConversion = await ctx.task(fixedPointConversionTask, {
    algorithmName,
    floatingPointAlgorithm: floatingPointDevelopment.algorithm,
    targetPlatform,
    requirements: requirementsDefinition.specifications
  });

  // Phase 5: Analyze Quantization Effects and Word Lengths
  const quantizationAnalysis = await ctx.task(quantizationAnalysisTask, {
    algorithmName,
    fixedPointAlgorithm: fixedPointConversion.algorithm,
    floatingPointReference: floatingPointDevelopment.algorithm,
    requirements: requirementsDefinition.specifications
  });

  // Breakpoint: Review fixed-point conversion results
  await ctx.breakpoint({
    question: `Fixed-point conversion complete for ${algorithmName}. SQNR: ${quantizationAnalysis.sqnr}. Acceptable performance?`,
    title: 'Fixed-Point Review',
    context: {
      runId: ctx.runId,
      wordLengths: fixedPointConversion.wordLengths,
      quantizationError: quantizationAnalysis.errorMetrics,
      files: [{
        path: `artifacts/phase5-quantization.json`,
        format: 'json',
        content: quantizationAnalysis
      }]
    }
  });

  // Phase 6: Optimize for Computational Efficiency
  const computationalOptimization = await ctx.task(computationalOptimizationTask, {
    algorithmName,
    fixedPointAlgorithm: fixedPointConversion.algorithm,
    targetPlatform,
    requirements: requirementsDefinition.specifications
  });

  // Phase 7: Implement on Target Platform
  const platformImplementation = await ctx.task(platformImplementationTask, {
    algorithmName,
    optimizedAlgorithm: computationalOptimization.optimizedAlgorithm,
    targetPlatform,
    requirements: requirementsDefinition.specifications
  });

  // Phase 8: Verify Implementation Against Reference
  const implementationVerification = await ctx.task(implementationVerificationTask, {
    algorithmName,
    implementation: platformImplementation.implementation,
    floatingPointReference: floatingPointDevelopment.algorithm,
    requirements: requirementsDefinition.specifications
  });

  // Final Breakpoint: Implementation Approval
  await ctx.breakpoint({
    question: `DSP algorithm implementation complete for ${algorithmName}. Verification ${implementationVerification.passed ? 'PASSED' : 'FAILED'}. Approve for release?`,
    title: 'Implementation Approval',
    context: {
      runId: ctx.runId,
      algorithmName,
      performance: implementationVerification.performanceMetrics,
      resourceUsage: platformImplementation.resourceUsage,
      files: [
        { path: `artifacts/final-implementation.json`, format: 'json', content: platformImplementation.implementation },
        { path: `artifacts/dsp-report.md`, format: 'markdown', content: implementationVerification.markdown }
      ]
    }
  });

  return {
    success: true,
    algorithmName,
    algorithm: {
      floatingPoint: floatingPointDevelopment.algorithm,
      fixedPoint: fixedPointConversion.algorithm,
      optimized: computationalOptimization.optimizedAlgorithm
    },
    implementation: {
      platform: targetPlatform,
      code: platformImplementation.implementation,
      resourceUsage: platformImplementation.resourceUsage
    },
    verificationResults: {
      passed: implementationVerification.passed,
      metrics: implementationVerification.performanceMetrics,
      bitAccuracy: implementationVerification.bitAccuracy
    },
    quantization: {
      wordLengths: fixedPointConversion.wordLengths,
      sqnr: quantizationAnalysis.sqnr,
      errorBounds: quantizationAnalysis.errorBounds
    },
    documentation: implementationVerification.documentation,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/dsp-algorithm-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Systems Engineer with expertise in algorithm specification',
      task: 'Define signal processing requirements and specifications',
      context: {
        algorithmName: args.algorithmName,
        signalType: args.signalType,
        requirements: args.requirements,
        targetPlatform: args.targetPlatform
      },
      instructions: [
        '1. Define input signal characteristics (sample rate, bandwidth, dynamic range)',
        '2. Specify output requirements (format, precision, latency)',
        '3. Define performance metrics (SNR, THD, convergence, etc.)',
        '4. Specify real-time constraints (throughput, latency budget)',
        '5. Define memory and computational resource constraints',
        '6. Specify interface requirements (I/O formats, buffering)',
        '7. Define test signal requirements for validation',
        '8. Specify target platform constraints',
        '9. Document any regulatory or standard compliance needs',
        '10. Create requirements traceability matrix'
      ],
      outputFormat: 'JSON object with complete specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications'],
      properties: {
        specifications: {
          type: 'object',
          properties: {
            input: { type: 'object' },
            output: { type: 'object' },
            performance: { type: 'object' },
            constraints: { type: 'object' },
            testSignals: { type: 'array', items: { type: 'object' } }
          }
        },
        traceabilityMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'requirements']
}));

export const floatingPointDevelopmentTask = defineTask('floating-point-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Floating-Point Development - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Algorithm Developer with expertise in signal processing',
      task: 'Develop algorithm in floating-point representation',
      context: {
        algorithmName: args.algorithmName,
        requirements: args.requirements,
        signalType: args.signalType
      },
      instructions: [
        '1. Design algorithm architecture and signal flow',
        '2. Implement core processing blocks in MATLAB/Python',
        '3. Design filter structures with appropriate topology',
        '4. Implement adaptive elements if required',
        '5. Optimize algorithm structure for numerical stability',
        '6. Simulate with ideal floating-point precision',
        '7. Measure performance against specifications',
        '8. Profile computational complexity (MIPS, memory)',
        '9. Document algorithm design decisions',
        '10. Create reference implementation for verification'
      ],
      outputFormat: 'JSON object with floating-point algorithm'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'meetsSpecs', 'performance'],
      properties: {
        algorithm: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            blocks: { type: 'array', items: { type: 'object' } },
            parameters: { type: 'object' },
            stateVariables: { type: 'array', items: { type: 'string' } }
          }
        },
        meetsSpecs: { type: 'boolean' },
        performance: {
          type: 'object',
          properties: {
            snr: { type: 'string' },
            latency: { type: 'string' },
            mips: { type: 'string' },
            memory: { type: 'string' }
          }
        },
        designDecisions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'algorithm', 'floating-point']
}));

export const algorithmValidationTask = defineTask('algorithm-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Algorithm Validation - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Verification Engineer',
      task: 'Validate algorithm performance with test signals',
      context: {
        algorithmName: args.algorithmName,
        algorithm: args.algorithm,
        requirements: args.requirements,
        signalType: args.signalType
      },
      instructions: [
        '1. Generate test signals per specification requirements',
        '2. Run algorithm with sinusoidal test signals',
        '3. Test with swept-frequency signals',
        '4. Test with impulsive and transient signals',
        '5. Test with realistic application signals',
        '6. Measure all performance metrics',
        '7. Test boundary conditions and edge cases',
        '8. Verify stability under all conditions',
        '9. Compare results to specifications',
        '10. Document test results and any failures'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'testResults'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              passed: { type: 'boolean' },
              measured: { type: 'string' },
              required: { type: 'string' }
            }
          }
        },
        failedTests: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'validation']
}));

export const fixedPointConversionTask = defineTask('fixed-point-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Fixed-Point Conversion - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Fixed-Point Design Engineer',
      task: 'Convert algorithm to fixed-point representation',
      context: {
        algorithmName: args.algorithmName,
        floatingPointAlgorithm: args.floatingPointAlgorithm,
        targetPlatform: args.targetPlatform,
        requirements: args.requirements
      },
      instructions: [
        '1. Analyze signal ranges throughout the algorithm',
        '2. Determine required word lengths for inputs/outputs',
        '3. Select fixed-point formats (Qm.n notation)',
        '4. Convert coefficients to fixed-point',
        '5. Implement scaling strategies for overflow prevention',
        '6. Handle intermediate precision in multiplications',
        '7. Implement rounding strategies',
        '8. Document fixed-point word lengths for all signals',
        '9. Identify potential overflow/underflow points',
        '10. Create fixed-point simulation model'
      ],
      outputFormat: 'JSON object with fixed-point algorithm'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'wordLengths'],
      properties: {
        algorithm: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            fixedPointBlocks: { type: 'array', items: { type: 'object' } },
            scalingFactors: { type: 'object' }
          }
        },
        wordLengths: {
          type: 'object',
          properties: {
            input: { type: 'string' },
            output: { type: 'string' },
            coefficients: { type: 'string' },
            accumulator: { type: 'string' }
          }
        },
        overflowHandling: { type: 'object' },
        roundingStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'fixed-point']
}));

export const quantizationAnalysisTask = defineTask('quantization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Quantization Analysis - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Quantization Analysis Engineer',
      task: 'Analyze quantization effects and determine word lengths',
      context: {
        algorithmName: args.algorithmName,
        fixedPointAlgorithm: args.fixedPointAlgorithm,
        floatingPointReference: args.floatingPointReference,
        requirements: args.requirements
      },
      instructions: [
        '1. Measure signal-to-quantization-noise ratio (SQNR)',
        '2. Analyze coefficient quantization effects',
        '3. Evaluate limit cycle behavior',
        '4. Analyze overflow probability',
        '5. Compare fixed-point to floating-point output',
        '6. Identify critical quantization points',
        '7. Optimize word lengths for performance vs. cost',
        '8. Calculate worst-case error bounds',
        '9. Verify performance meets requirements',
        '10. Document quantization analysis results'
      ],
      outputFormat: 'JSON object with quantization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sqnr', 'errorMetrics', 'errorBounds'],
      properties: {
        sqnr: { type: 'string' },
        errorMetrics: {
          type: 'object',
          properties: {
            meanError: { type: 'string' },
            maxError: { type: 'string' },
            rmsError: { type: 'string' }
          }
        },
        errorBounds: { type: 'object' },
        coefficientSensitivity: { type: 'array', items: { type: 'object' } },
        limitCycleAnalysis: { type: 'object' },
        optimizationRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'quantization']
}));

export const computationalOptimizationTask = defineTask('computational-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Computational Optimization - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Optimization Engineer',
      task: 'Optimize algorithm for computational efficiency',
      context: {
        algorithmName: args.algorithmName,
        fixedPointAlgorithm: args.fixedPointAlgorithm,
        targetPlatform: args.targetPlatform,
        requirements: args.requirements
      },
      instructions: [
        '1. Profile computational bottlenecks',
        '2. Optimize loop structures for efficiency',
        '3. Apply SIMD optimization opportunities',
        '4. Utilize platform-specific MAC instructions',
        '5. Optimize memory access patterns',
        '6. Apply algorithmic optimizations (FFT, polyphase, etc.)',
        '7. Reduce memory footprint where possible',
        '8. Implement efficient coefficient storage',
        '9. Optimize for cache utilization',
        '10. Document optimization techniques applied'
      ],
      outputFormat: 'JSON object with optimized algorithm'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedAlgorithm'],
      properties: {
        optimizedAlgorithm: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            optimizations: { type: 'array', items: { type: 'string' } },
            mipsReduction: { type: 'string' },
            memoryReduction: { type: 'string' }
          }
        },
        optimizationReport: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              improvement: { type: 'string' }
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
  labels: ['ee', 'dsp', 'optimization']
}));

export const platformImplementationTask = defineTask('platform-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Platform Implementation - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'Embedded DSP Developer',
      task: 'Implement algorithm on target platform',
      context: {
        algorithmName: args.algorithmName,
        optimizedAlgorithm: args.optimizedAlgorithm,
        targetPlatform: args.targetPlatform,
        requirements: args.requirements
      },
      instructions: [
        '1. Set up development environment for target platform',
        '2. Implement optimized algorithm in C/Assembly',
        '3. Utilize platform DSP libraries where beneficial',
        '4. Implement DMA for efficient data transfer',
        '5. Configure interrupts for real-time operation',
        '6. Implement double-buffering for streaming',
        '7. Profile execution time and memory usage',
        '8. Verify real-time constraints are met',
        '9. Implement diagnostic and debug features',
        '10. Document implementation details'
      ],
      outputFormat: 'JSON object with platform implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'resourceUsage'],
      properties: {
        implementation: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            codeStructure: { type: 'object' },
            configuration: { type: 'object' }
          }
        },
        resourceUsage: {
          type: 'object',
          properties: {
            programMemory: { type: 'string' },
            dataMemory: { type: 'string' },
            cpuUtilization: { type: 'string' },
            executionTime: { type: 'string' }
          }
        },
        realTimeMargin: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'implementation', 'embedded']
}));

export const implementationVerificationTask = defineTask('implementation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Implementation Verification - ${args.algorithmName}`,
  agent: {
    name: 'dsp-algorithm-engineer',
    prompt: {
      role: 'DSP Verification Engineer',
      task: 'Verify implementation against floating-point reference',
      context: {
        algorithmName: args.algorithmName,
        implementation: args.implementation,
        floatingPointReference: args.floatingPointReference,
        requirements: args.requirements
      },
      instructions: [
        '1. Generate test vectors from reference model',
        '2. Run implementation with test vectors',
        '3. Compare output to reference (bit-exact or tolerance)',
        '4. Verify all performance specifications',
        '5. Test boundary conditions and edge cases',
        '6. Verify real-time operation under load',
        '7. Measure actual vs. expected performance',
        '8. Verify memory and resource usage',
        '9. Document verification results',
        '10. Generate verification report'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'performanceMetrics', 'bitAccuracy'],
      properties: {
        passed: { type: 'boolean' },
        performanceMetrics: {
          type: 'object',
          properties: {
            snr: { type: 'string' },
            latency: { type: 'string' },
            throughput: { type: 'string' }
          }
        },
        bitAccuracy: {
          type: 'object',
          properties: {
            maxDifference: { type: 'string' },
            rmsDifference: { type: 'string' }
          }
        },
        documentation: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'dsp', 'verification']
}));
