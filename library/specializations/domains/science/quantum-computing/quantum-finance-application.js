/**
 * @process Quantum Finance Application
 * @id QC-APP-002
 * @description Develop quantum computing applications for financial services including option
 * pricing, risk analysis, and portfolio optimization using quantum Monte Carlo and amplitude estimation.
 * @category Quantum Computing - Application Development
 * @priority P2 - Medium
 * @inputs {{ applicationArea: string, financialData: object }}
 * @outputs {{ success: boolean, results: object, validationReport: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-finance-application', {
 *   applicationArea: 'option_pricing',
 *   financialData: { option: {...}, marketData: {...} }
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationArea, // 'option_pricing', 'risk_analysis', 'portfolio_optimization', 'credit_risk'
    financialData,
    algorithm = 'amplitude_estimation', // 'amplitude_estimation', 'quantum_monte_carlo', 'qgan'
    precision = 0.01,
    framework = 'qiskit_finance',
    outputDir = 'quantum-finance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Finance Application: ${applicationArea}`);
  ctx.log('info', `Algorithm: ${algorithm}, Precision: ${precision}`);

  // ============================================================================
  // PHASE 1: FINANCIAL MODEL DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Financial Model Definition');

  const modelResult = await ctx.task(financialModelDefinitionTask, {
    applicationArea,
    financialData
  });

  artifacts.push(...(modelResult.artifacts || []));

  await ctx.breakpoint({
    question: `Financial model defined. Model type: ${modelResult.modelType}, Parameters: ${modelResult.parameterCount}. Proceed with quantum encoding?`,
    title: 'Financial Model Review',
    context: {
      runId: ctx.runId,
      model: modelResult,
      files: (modelResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: PROBABILITY DISTRIBUTION ENCODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Probability Distribution Encoding');

  const encodingResult = await ctx.task(probabilityDistributionEncodingTask, {
    model: modelResult,
    algorithm,
    precision,
    framework
  });

  artifacts.push(...(encodingResult.artifacts || []));

  ctx.log('info', `Distribution encoded. Qubits: ${encodingResult.qubitCount}`);

  // ============================================================================
  // PHASE 3: AMPLITUDE ESTIMATION CIRCUIT
  // ============================================================================

  ctx.log('info', 'Phase 3: Amplitude Estimation Circuit Design');

  const aeCircuitResult = await ctx.task(amplitudeEstimationCircuitTask, {
    encoding: encodingResult,
    precision,
    algorithm,
    framework
  });

  artifacts.push(...(aeCircuitResult.artifacts || []));

  // ============================================================================
  // PHASE 4: QUANTUM EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Quantum Execution');

  const executionResult = await ctx.task(quantumFinanceExecutionTask, {
    circuit: aeCircuitResult,
    model: modelResult,
    algorithm,
    framework
  });

  artifacts.push(...(executionResult.artifacts || []));

  await ctx.breakpoint({
    question: `Quantum execution complete. Estimated value: ${executionResult.estimatedValue}, Confidence interval: ${executionResult.confidenceInterval}. Review results?`,
    title: 'Quantum Execution Review',
    context: {
      runId: ctx.runId,
      execution: executionResult,
      files: (executionResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: CLASSICAL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Classical Validation');

  const validationResult = await ctx.task(classicalFinanceValidationTask, {
    applicationArea,
    financialData,
    quantumResult: executionResult,
    model: modelResult
  });

  artifacts.push(...(validationResult.artifacts || []));

  // ============================================================================
  // PHASE 6: FINANCIAL DATA INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Financial Data Integration');

  const integrationResult = await ctx.task(financialDataIntegrationTask, {
    applicationArea,
    quantumResult: executionResult,
    validationResult
  });

  artifacts.push(...(integrationResult.artifacts || []));

  // ============================================================================
  // PHASE 7: REGULATORY COMPLIANCE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Regulatory Compliance Documentation');

  const complianceResult = await ctx.task(regulatoryComplianceDocumentationTask, {
    applicationArea,
    model: modelResult,
    executionResult,
    validationResult,
    outputDir
  });

  artifacts.push(...(complianceResult.artifacts || []));

  await ctx.breakpoint({
    question: `Quantum finance application complete. Area: ${applicationArea}, Quantum result: ${executionResult.estimatedValue}, Classical validation: ${validationResult.classicalResult}. Approve application?`,
    title: 'Finance Application Complete',
    context: {
      runId: ctx.runId,
      summary: {
        applicationArea,
        quantumResult: executionResult.estimatedValue,
        classicalResult: validationResult.classicalResult,
        error: validationResult.relativeError
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    applicationArea,
    results: {
      quantumEstimate: executionResult.estimatedValue,
      confidenceInterval: executionResult.confidenceInterval,
      precision: executionResult.achievedPrecision
    },
    validationReport: {
      classicalResult: validationResult.classicalResult,
      relativeError: validationResult.relativeError,
      validationPassed: validationResult.passed,
      methodology: validationResult.methodology
    },
    quantumResources: {
      qubits: encodingResult.qubitCount,
      circuitDepth: aeCircuitResult.circuitDepth,
      queries: executionResult.numQueries
    },
    compliance: complianceResult.complianceReport,
    dataIntegration: integrationResult.integrationConfig,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-APP-002',
      processName: 'Quantum Finance Application',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const financialModelDefinitionTask = defineTask('qfin-model-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Financial Model Definition',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Quantitative Finance Specialist',
      task: 'Define financial model for quantum computation',
      context: args,
      instructions: [
        '1. Analyze application requirements',
        '2. Select appropriate model (Black-Scholes, etc.)',
        '3. Define model parameters',
        '4. Specify probability distributions',
        '5. Define payoff function',
        '6. Set risk measures',
        '7. Validate model assumptions',
        '8. Calculate classical reference',
        '9. Document model',
        '10. Provide model code'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['modelType', 'parameters', 'parameterCount'],
      properties: {
        modelType: { type: 'string' },
        parameters: { type: 'object' },
        parameterCount: { type: 'number' },
        distributions: { type: 'object' },
        payoffFunction: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'model']
}));

export const probabilityDistributionEncodingTask = defineTask('qfin-distribution-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probability Distribution Encoding',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Quantum Encoding Specialist',
      task: 'Encode probability distributions on quantum computer',
      context: args,
      instructions: [
        '1. Discretize probability distributions',
        '2. Calculate amplitude encoding',
        '3. Design loading circuit',
        '4. Implement log-normal distribution',
        '5. Handle multivariate distributions',
        '6. Optimize qubit count',
        '7. Validate encoding accuracy',
        '8. Generate encoding circuit',
        '9. Test encoding',
        '10. Document encoding'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['encodingCircuit', 'qubitCount'],
      properties: {
        encodingCircuit: { type: 'object' },
        qubitCount: { type: 'number' },
        encodingAccuracy: { type: 'number' },
        discretizationParams: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'encoding']
}));

export const amplitudeEstimationCircuitTask = defineTask('qfin-ae-circuit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Amplitude Estimation Circuit',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Amplitude Estimation Specialist',
      task: 'Design amplitude estimation circuit for finance',
      context: args,
      instructions: [
        '1. Design oracle for payoff function',
        '2. Implement Grover operator',
        '3. Configure precision qubits',
        '4. Implement QAE or IQAE',
        '5. Add ancilla management',
        '6. Optimize circuit depth',
        '7. Handle boundary conditions',
        '8. Generate complete circuit',
        '9. Calculate resource requirements',
        '10. Document circuit design'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['circuit', 'circuitDepth'],
      properties: {
        circuit: { type: 'object' },
        circuitDepth: { type: 'number' },
        totalQubits: { type: 'number' },
        oracleCircuit: { type: 'object' },
        groverOperator: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'amplitude-estimation']
}));

export const quantumFinanceExecutionTask = defineTask('qfin-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Finance Execution',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Quantum Execution Specialist',
      task: 'Execute quantum finance algorithm',
      context: args,
      instructions: [
        '1. Execute amplitude estimation',
        '2. Process measurement results',
        '3. Calculate estimated value',
        '4. Compute confidence interval',
        '5. Track query complexity',
        '6. Apply post-processing',
        '7. Handle errors',
        '8. Validate results',
        '9. Generate execution report',
        '10. Document execution'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedValue', 'confidenceInterval', 'achievedPrecision'],
      properties: {
        estimatedValue: { type: 'number' },
        confidenceInterval: { type: 'array' },
        achievedPrecision: { type: 'number' },
        numQueries: { type: 'number' },
        rawResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'execution']
}));

export const classicalFinanceValidationTask = defineTask('qfin-classical-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Finance Validation',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Quantitative Validation Specialist',
      task: 'Validate quantum results against classical methods',
      context: args,
      instructions: [
        '1. Run classical Monte Carlo',
        '2. Calculate analytical solution if available',
        '3. Compare with market prices',
        '4. Calculate relative error',
        '5. Test convergence',
        '6. Analyze discrepancies',
        '7. Validate methodology',
        '8. Generate validation report',
        '9. Provide recommendations',
        '10. Document validation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['classicalResult', 'relativeError', 'passed'],
      properties: {
        classicalResult: { type: 'number' },
        relativeError: { type: 'number' },
        passed: { type: 'boolean' },
        methodology: { type: 'string' },
        comparisonDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'validation']
}));

export const financialDataIntegrationTask = defineTask('qfin-data-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Financial Data Integration',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Financial Systems Integration Specialist',
      task: 'Integrate quantum finance with data sources',
      context: args,
      instructions: [
        '1. Design data interfaces',
        '2. Connect to market data',
        '3. Implement data transformations',
        '4. Add real-time updates',
        '5. Configure caching',
        '6. Add error handling',
        '7. Implement logging',
        '8. Create API endpoints',
        '9. Test integration',
        '10. Document integration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationConfig'],
      properties: {
        integrationConfig: { type: 'object' },
        dataInterfaces: { type: 'array' },
        apiEndpoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'integration']
}));

export const regulatoryComplianceDocumentationTask = defineTask('qfin-compliance-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Compliance Documentation',
  agent: {
    name: 'quantum-finance-analyst',
    skills: ['pennylane-hybrid-executor', 'qiskit-circuit-builder', 'qubo-formulator'],
    prompt: {
      role: 'Financial Compliance Specialist',
      task: 'Document regulatory compliance for quantum finance',
      context: args,
      instructions: [
        '1. Identify applicable regulations',
        '2. Document model methodology',
        '3. Document validation approach',
        '4. Create audit trail',
        '5. Document risk measures',
        '6. Add model governance',
        '7. Create compliance checklist',
        '8. Document limitations',
        '9. Add disclaimers',
        '10. Generate compliance report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceReport'],
      properties: {
        complianceReport: { type: 'object' },
        regulations: { type: 'array' },
        checklist: { type: 'array' },
        auditTrail: { type: 'object' },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'finance', 'compliance']
}));
