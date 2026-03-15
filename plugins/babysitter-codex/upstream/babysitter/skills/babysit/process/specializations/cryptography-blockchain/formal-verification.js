/**
 * @process specializations/cryptography-blockchain/formal-verification
 * @description Formal Verification of Smart Contracts - Mathematical verification of smart contract properties using formal
 * methods to prove correctness of critical functions and invariants using Certora, K Framework, and other tools.
 * @inputs { projectName: string, contractPaths?: array, properties?: array, verificationTool?: string }
 * @outputs { success: boolean, verifiedProperties: array, failedProperties: array, counterexamples: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/formal-verification', {
 *   projectName: 'DeFi Protocol Verification',
 *   contractPaths: ['contracts/core/'],
 *   properties: ['solvency', 'no-overflow', 'access-control'],
 *   verificationTool: 'certora'
 * });
 *
 * @references
 * - Certora Prover Documentation: https://docs.certora.com/
 * - K Framework: https://github.com/runtimeverification/k
 * - Formal Verification Best Practices: https://ethereum.org/en/developers/docs/smart-contracts/formal-verification/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contractPaths = ['contracts/'],
    properties = [],
    verificationTool = 'certora',
    timeout = 3600,
    outputDir = 'formal-verification-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Formal Verification: ${projectName}`);
  ctx.log('info', `Tool: ${verificationTool}, Properties: ${properties.length}`);

  // ============================================================================
  // PHASE 1: PROPERTY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying critical properties to verify');

  const propertyIdentification = await ctx.task(propertyIdentificationTask, {
    projectName,
    contractPaths,
    properties,
    outputDir
  });

  artifacts.push(...propertyIdentification.artifacts);

  // ============================================================================
  // PHASE 2: SPECIFICATION WRITING
  // ============================================================================

  ctx.log('info', 'Phase 2: Writing formal specifications');

  const specificationWriting = await ctx.task(specificationWritingTask, {
    projectName,
    propertyIdentification,
    verificationTool,
    outputDir
  });

  artifacts.push(...specificationWriting.artifacts);

  // Quality Gate: Specification Review
  await ctx.breakpoint({
    question: `Formal specifications written for ${specificationWriting.specCount} properties. Review specifications before running verification?`,
    title: 'Specification Review',
    context: {
      runId: ctx.runId,
      projectName,
      specifications: specificationWriting.specifications,
      files: specificationWriting.artifacts.map(a => ({ path: a.path, format: 'cvl' }))
    }
  });

  // ============================================================================
  // PHASE 3: CONTRACT MODELING
  // ============================================================================

  ctx.log('info', 'Phase 3: Modeling contract behavior');

  const contractModeling = await ctx.task(contractModelingTask, {
    projectName,
    specificationWriting,
    verificationTool,
    outputDir
  });

  artifacts.push(...contractModeling.artifacts);

  // ============================================================================
  // PHASE 4: VERIFICATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running verification');

  const verificationExecution = await ctx.task(verificationExecutionTask, {
    projectName,
    specificationWriting,
    contractModeling,
    verificationTool,
    timeout,
    outputDir
  });

  artifacts.push(...verificationExecution.artifacts);

  // ============================================================================
  // PHASE 5: COUNTEREXAMPLE ANALYSIS
  // ============================================================================

  if (verificationExecution.failedProperties.length > 0) {
    ctx.log('info', 'Phase 5: Analyzing counterexamples');

    const counterexampleAnalysis = await ctx.task(counterexampleAnalysisTask, {
      projectName,
      verificationExecution,
      outputDir
    });

    artifacts.push(...counterexampleAnalysis.artifacts);

    await ctx.breakpoint({
      question: `Found ${verificationExecution.failedProperties.length} failed properties with counterexamples. Review and refine specifications?`,
      title: 'Counterexample Analysis',
      context: {
        runId: ctx.runId,
        failedProperties: verificationExecution.failedProperties,
        counterexamples: counterexampleAnalysis.analyzedCounterexamples,
        files: counterexampleAnalysis.artifacts.map(a => ({ path: a.path, format: 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: VERIFICATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating verification report');

  const verificationReport = await ctx.task(verificationReportTask, {
    projectName,
    propertyIdentification,
    specificationWriting,
    verificationExecution,
    outputDir
  });

  artifacts.push(...verificationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: verificationExecution.failedProperties.length === 0,
    projectName,
    verifiedProperties: verificationExecution.verifiedProperties,
    failedProperties: verificationExecution.failedProperties,
    counterexamples: verificationExecution.counterexamples,
    statistics: {
      totalProperties: propertyIdentification.properties.length,
      verified: verificationExecution.verifiedProperties.length,
      failed: verificationExecution.failedProperties.length,
      timeout: verificationExecution.timeoutProperties.length
    },
    reportPath: verificationReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/formal-verification',
      timestamp: startTime,
      verificationTool
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const propertyIdentificationTask = defineTask('property-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Property Identification - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer (uses SK-006: certora-prover)
    prompt: {
      role: 'Formal Methods Engineer',
      task: 'Identify critical properties to verify',
      context: args,
      instructions: [
        '1. Analyze contract functionality',
        '2. Identify invariants (balance, supply, state)',
        '3. Define safety properties (no overflow, no reentrancy)',
        '4. Define liveness properties',
        '5. Identify access control properties',
        '6. Define state transition properties',
        '7. Identify economic properties',
        '8. Prioritize by criticality',
        '9. Document property rationale',
        '10. Create property specification list'
      ],
      outputFormat: 'JSON with identified properties'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'invariants', 'artifacts'],
      properties: {
        properties: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'object' } },
        safetyProperties: { type: 'array', items: { type: 'object' } },
        accessControlProperties: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'properties']
}));

export const specificationWritingTask = defineTask('specification-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Specification Writing - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer (uses SK-006: certora-prover, SK-007: k-framework)
    prompt: {
      role: 'Formal Specification Writer',
      task: 'Write formal specifications in CVL or K',
      context: args,
      instructions: [
        '1. Write invariant specifications',
        '2. Write rule specifications',
        '3. Define ghost variables if needed',
        '4. Write hooks for state tracking',
        '5. Define parametric rules',
        '6. Write preserved blocks',
        '7. Define summaries for external calls',
        '8. Handle loop invariants',
        '9. Document specifications',
        '10. Validate specification syntax'
      ],
      outputFormat: 'JSON with specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'specCount', 'artifacts'],
      properties: {
        specifications: { type: 'array', items: { type: 'object' } },
        specCount: { type: 'number' },
        specFiles: { type: 'array', items: { type: 'string' } },
        ghostVariables: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'specifications']
}));

export const contractModelingTask = defineTask('contract-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contract Modeling - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer
    prompt: {
      role: 'Contract Model Builder',
      task: 'Create contract model for verification',
      context: args,
      instructions: [
        '1. Model state variables',
        '2. Model function behaviors',
        '3. Handle external dependencies',
        '4. Model access control',
        '5. Handle loops and recursion',
        '6. Model time-dependent behavior',
        '7. Handle msg.sender and msg.value',
        '8. Model storage and memory',
        '9. Create harness contracts if needed',
        '10. Validate model completeness'
      ],
      outputFormat: 'JSON with contract model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'harnesses', 'artifacts'],
      properties: {
        model: { type: 'object' },
        harnesses: { type: 'array', items: { type: 'string' } },
        externalSummaries: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'modeling']
}));

export const verificationExecutionTask = defineTask('verification-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Verification Execution - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer (uses SK-006: certora-prover, SK-007: k-framework)
    prompt: {
      role: 'Verification Runner',
      task: 'Execute formal verification',
      context: args,
      instructions: [
        '1. Configure Certora/K prover',
        '2. Set timeout parameters',
        '3. Run verification jobs',
        '4. Monitor progress',
        '5. Collect verification results',
        '6. Extract counterexamples',
        '7. Identify timeout cases',
        '8. Retry with different settings if needed',
        '9. Aggregate results',
        '10. Generate execution log'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verifiedProperties', 'failedProperties', 'artifacts'],
      properties: {
        verifiedProperties: { type: 'array', items: { type: 'string' } },
        failedProperties: { type: 'array', items: { type: 'string' } },
        timeoutProperties: { type: 'array', items: { type: 'string' } },
        counterexamples: { type: 'array', items: { type: 'object' } },
        executionTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'execution']
}));

export const counterexampleAnalysisTask = defineTask('counterexample-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Counterexample Analysis - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer
    prompt: {
      role: 'Counterexample Analyst',
      task: 'Analyze counterexamples from verification',
      context: args,
      instructions: [
        '1. Parse counterexample traces',
        '2. Identify failing conditions',
        '3. Determine if bug or spec issue',
        '4. Analyze state transitions',
        '5. Identify root cause',
        '6. Suggest specification fixes',
        '7. Suggest code fixes if bug',
        '8. Create reproducible test case',
        '9. Document analysis',
        '10. Prioritize fixes'
      ],
      outputFormat: 'JSON with counterexample analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedCounterexamples', 'artifacts'],
      properties: {
        analyzedCounterexamples: { type: 'array', items: { type: 'object' } },
        bugIndicators: { type: 'array', items: { type: 'object' } },
        specIssues: { type: 'array', items: { type: 'object' } },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'counterexamples']
}));

export const verificationReportTask = defineTask('verification-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Verification Report - ${args.projectName}`,
  agent: {
    name: 'formal-methods', // AG-005: Formal Methods Engineer
    prompt: {
      role: 'Verification Report Writer',
      task: 'Generate comprehensive verification report',
      context: args,
      instructions: [
        '1. Summarize verification scope',
        '2. List all verified properties',
        '3. Document failed properties',
        '4. Include counterexample details',
        '5. Document assumptions made',
        '6. Discuss limitations',
        '7. Provide recommendations',
        '8. Include specification files',
        '9. Add verification logs',
        '10. Generate PDF-ready report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'formal-verification', 'reporting']
}));
