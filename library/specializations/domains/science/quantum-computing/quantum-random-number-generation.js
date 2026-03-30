/**
 * @process Quantum Random Number Generation
 * @id QC-SEC-002
 * @description Implement quantum random number generation (QRNG) for cryptographic applications
 * leveraging quantum measurement randomness.
 * @category Quantum Computing - Cryptography and Security
 * @priority P2 - Medium
 * @inputs {{ application: string, throughput?: number }}
 * @outputs {{ success: boolean, qrngImplementation: object, testResults: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-random-number-generation', {
 *   application: 'key-generation',
 *   throughput: 1000000 // bits per second
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    application = 'general',
    throughput = 100000,
    framework = 'qiskit',
    outputDir = 'qrng-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Random Number Generation Implementation`);
  ctx.log('info', `Application: ${application}, Target throughput: ${throughput} bps`);

  // ============================================================================
  // PHASE 1: QRNG CIRCUIT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: QRNG Circuit Design');

  const circuitResult = await ctx.task(qrngCircuitDesignTask, {
    throughput,
    framework
  });

  artifacts.push(...(circuitResult.artifacts || []));

  await ctx.breakpoint({
    question: `QRNG circuit designed. Qubits: ${circuitResult.qubitCount}, Bits per circuit: ${circuitResult.bitsPerCircuit}. Proceed with randomness extraction?`,
    title: 'QRNG Circuit Review',
    context: {
      runId: ctx.runId,
      circuit: circuitResult,
      files: (circuitResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: RANDOMNESS EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Randomness Extraction Implementation');

  const extractionResult = await ctx.task(randomnessExtractionTask, {
    circuit: circuitResult,
    framework
  });

  artifacts.push(...(extractionResult.artifacts || []));

  ctx.log('info', `Extraction implemented. Method: ${extractionResult.extractionMethod}`);

  // ============================================================================
  // PHASE 3: QRNG IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: QRNG Implementation');

  const implementationResult = await ctx.task(qrngImplementationTask, {
    circuit: circuitResult,
    extraction: extractionResult,
    throughput,
    framework
  });

  artifacts.push(...(implementationResult.artifacts || []));

  // ============================================================================
  // PHASE 4: STATISTICAL TESTING (NIST)
  // ============================================================================

  ctx.log('info', 'Phase 4: NIST Statistical Testing');

  const nistTestResult = await ctx.task(nistStatisticalTestingTask, {
    qrng: implementationResult,
    sampleSize: Math.max(1000000, throughput * 10)
  });

  artifacts.push(...(nistTestResult.artifacts || []));

  await ctx.breakpoint({
    question: `NIST testing complete. Tests passed: ${nistTestResult.passedTests}/${nistTestResult.totalTests}. P-values healthy: ${nistTestResult.pValuesHealthy}. Review test results?`,
    title: 'NIST Test Results Review',
    context: {
      runId: ctx.runId,
      nistResults: nistTestResult,
      files: (nistTestResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: RANDOMNESS QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Randomness Quality Validation');

  const qualityResult = await ctx.task(randomnessQualityValidationTask, {
    qrng: implementationResult,
    nistResults: nistTestResult
  });

  artifacts.push(...(qualityResult.artifacts || []));

  if (!qualityResult.qualityPassed) {
    await ctx.breakpoint({
      question: `Randomness quality below threshold. Entropy rate: ${qualityResult.entropyRate}. Address issues or accept with warnings?`,
      title: 'Quality Warning',
      context: {
        runId: ctx.runId,
        quality: qualityResult,
        files: (qualityResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: CRYPTOGRAPHIC INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Cryptographic Application Integration');

  const integrationResult = await ctx.task(cryptographicIntegrationTask, {
    qrng: implementationResult,
    application,
    qualityMetrics: qualityResult
  });

  artifacts.push(...(integrationResult.artifacts || []));

  // ============================================================================
  // PHASE 7: SECURITY PROPERTIES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Security Properties Documentation');

  const securityResult = await ctx.task(securityPropertiesDocumentationTask, {
    qrng: implementationResult,
    nistResults: nistTestResult,
    qualityResults: qualityResult,
    integration: integrationResult,
    outputDir
  });

  artifacts.push(...(securityResult.artifacts || []));

  await ctx.breakpoint({
    question: `QRNG implementation complete. Throughput: ${implementationResult.achievedThroughput} bps, NIST tests: ${nistTestResult.passedTests}/${nistTestResult.totalTests}. Approve implementation?`,
    title: 'QRNG Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        application,
        throughput: implementationResult.achievedThroughput,
        nistTestsPassed: nistTestResult.passedTests,
        qualityPassed: qualityResult.qualityPassed
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    application,
    qrngImplementation: {
      circuit: circuitResult.circuit,
      qubitCount: circuitResult.qubitCount,
      extractionMethod: extractionResult.extractionMethod,
      achievedThroughput: implementationResult.achievedThroughput
    },
    testResults: {
      nist: {
        totalTests: nistTestResult.totalTests,
        passedTests: nistTestResult.passedTests,
        pValues: nistTestResult.pValues,
        testDetails: nistTestResult.testDetails
      },
      quality: {
        entropyRate: qualityResult.entropyRate,
        minEntropy: qualityResult.minEntropy,
        qualityPassed: qualityResult.qualityPassed
      }
    },
    integration: integrationResult.integrationConfig,
    securityProperties: securityResult.securityProperties,
    certificationPath: securityResult.certificationPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-SEC-002',
      processName: 'Quantum Random Number Generation',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const qrngCircuitDesignTask = defineTask('qrng-circuit-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QRNG Circuit Design',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Quantum Circuit Design Specialist',
      task: 'Design quantum circuit for random number generation',
      context: args,
      instructions: [
        '1. Design Hadamard-based random bit generation',
        '2. Optimize for throughput requirements',
        '3. Determine optimal qubit count',
        '4. Design parallel measurement',
        '5. Consider hardware constraints',
        '6. Minimize circuit depth',
        '7. Design batch execution',
        '8. Calculate bits per circuit',
        '9. Generate circuit code',
        '10. Document circuit design'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['circuit', 'qubitCount', 'bitsPerCircuit'],
      properties: {
        circuit: { type: 'object' },
        qubitCount: { type: 'number' },
        bitsPerCircuit: { type: 'number' },
        circuitCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'circuit']
}));

export const randomnessExtractionTask = defineTask('qrng-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Randomness Extraction',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Randomness Extraction Specialist',
      task: 'Implement randomness extraction from quantum measurements',
      context: args,
      instructions: [
        '1. Implement von Neumann extraction',
        '2. Implement Toeplitz hashing',
        '3. Design post-processing pipeline',
        '4. Handle bias correction',
        '5. Implement entropy estimation',
        '6. Design buffering strategy',
        '7. Optimize extraction rate',
        '8. Handle edge cases',
        '9. Test extraction quality',
        '10. Document extraction method'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['extractionMethod', 'extractionPipeline'],
      properties: {
        extractionMethod: { type: 'string' },
        extractionPipeline: { type: 'object' },
        extractionRate: { type: 'number' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'extraction']
}));

export const qrngImplementationTask = defineTask('qrng-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QRNG Implementation',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'QRNG Implementation Specialist',
      task: 'Implement complete QRNG system',
      context: args,
      instructions: [
        '1. Integrate circuit and extraction',
        '2. Implement execution loop',
        '3. Add buffering and caching',
        '4. Implement rate control',
        '5. Add error handling',
        '6. Implement health monitoring',
        '7. Add logging',
        '8. Create API interface',
        '9. Test throughput',
        '10. Document implementation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'achievedThroughput'],
      properties: {
        implementation: { type: 'object' },
        achievedThroughput: { type: 'number' },
        api: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'implementation']
}));

export const nistStatisticalTestingTask = defineTask('qrng-nist-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NIST Statistical Testing',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Statistical Testing Specialist',
      task: 'Run NIST SP 800-22 statistical tests on QRNG output',
      context: args,
      instructions: [
        '1. Generate test sample',
        '2. Run frequency test',
        '3. Run block frequency test',
        '4. Run runs test',
        '5. Run longest run test',
        '6. Run FFT test',
        '7. Run serial test',
        '8. Run approximate entropy test',
        '9. Run cumulative sums test',
        '10. Compile and analyze results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'pValues', 'pValuesHealthy'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        pValues: { type: 'object' },
        pValuesHealthy: { type: 'boolean' },
        testDetails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'nist-testing']
}));

export const randomnessQualityValidationTask = defineTask('qrng-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Randomness Quality Validation',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Randomness Quality Specialist',
      task: 'Validate randomness quality for cryptographic use',
      context: args,
      instructions: [
        '1. Calculate Shannon entropy',
        '2. Calculate min-entropy',
        '3. Analyze entropy rate',
        '4. Check for patterns',
        '5. Validate uniformity',
        '6. Check independence',
        '7. Analyze autocorrelation',
        '8. Compare with thresholds',
        '9. Generate quality report',
        '10. Document validation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['entropyRate', 'minEntropy', 'qualityPassed'],
      properties: {
        entropyRate: { type: 'number' },
        minEntropy: { type: 'number' },
        qualityPassed: { type: 'boolean' },
        qualityMetrics: { type: 'object' },
        qualityReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'quality']
}));

export const cryptographicIntegrationTask = defineTask('qrng-crypto-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cryptographic Integration',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Cryptographic Integration Specialist',
      task: 'Integrate QRNG with cryptographic applications',
      context: args,
      instructions: [
        '1. Design key generation interface',
        '2. Implement nonce generation',
        '3. Integrate with CSPRNG',
        '4. Design seeding mechanism',
        '5. Implement rate limiting',
        '6. Add fallback mechanisms',
        '7. Create secure API',
        '8. Test integration',
        '9. Document integration',
        '10. Provide usage examples'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationConfig'],
      properties: {
        integrationConfig: { type: 'object' },
        interfaces: { type: 'array' },
        usageExamples: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'crypto-integration']
}));

export const securityPropertiesDocumentationTask = defineTask('qrng-security-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security Properties Documentation',
  agent: {
    name: 'qrng-engineer',
    skills: ['qrng-generator', 'qiskit-circuit-builder', 'statevector-simulator'],
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Document QRNG security properties',
      context: args,
      instructions: [
        '1. Document quantum source',
        '2. Document extraction method',
        '3. Present test results',
        '4. Document entropy guarantees',
        '5. List security assumptions',
        '6. Document threat model',
        '7. Provide compliance mapping',
        '8. Add certification guidance',
        '9. Include operational guidelines',
        '10. Generate final documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['securityProperties', 'certificationPath'],
      properties: {
        securityProperties: { type: 'object' },
        certificationPath: { type: 'string' },
        complianceMapping: { type: 'object' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'qrng', 'security-docs']
}));
