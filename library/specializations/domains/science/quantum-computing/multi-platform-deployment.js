/**
 * @process Multi-Platform Deployment
 * @id QC-HW-002
 * @description Deploy quantum applications across multiple hardware platforms (IBM, Google, IonQ, etc.)
 * with platform-specific optimizations and unified interfaces.
 * @category Quantum Computing - Hardware Integration
 * @priority P2 - Medium
 * @inputs {{ application: object, platforms: array }}
 * @outputs {{ success: boolean, deployments: object, comparisonReport: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('multi-platform-deployment', {
 *   application: { name: 'vqe-solver', circuit: vqeCircuit },
 *   platforms: ['ibm_brisbane', 'ionq_harmony', 'rigetti_aspen']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    application,
    platforms = ['ibm_brisbane'],
    compareResults = true,
    unifiedInterface = true,
    framework = 'qiskit',
    outputDir = 'multi-platform-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const deployments = {};

  ctx.log('info', `Starting Multi-Platform Deployment: ${application.name}`);
  ctx.log('info', `Target platforms: ${platforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: PLATFORM ABSTRACTION LAYER
  // ============================================================================

  ctx.log('info', 'Phase 1: Platform Abstraction Layer');

  const abstractionResult = await ctx.task(platformAbstractionLayerTask, {
    platforms,
    framework
  });

  artifacts.push(...(abstractionResult.artifacts || []));

  await ctx.breakpoint({
    question: `Platform abstraction created. Supported platforms: ${abstractionResult.supportedPlatforms.length}. Proceed with platform-specific transpilation?`,
    title: 'Platform Abstraction Review',
    context: {
      runId: ctx.runId,
      abstraction: abstractionResult,
      files: (abstractionResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: PLATFORM-SPECIFIC TRANSPILATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Platform-Specific Transpilation');

  for (const platform of platforms) {
    ctx.log('info', `Transpiling for ${platform}...`);

    const transpileResult = await ctx.task(platformSpecificTranspilationTask, {
      application,
      platform,
      abstractionLayer: abstractionResult
    });

    deployments[platform] = { transpilation: transpileResult };
    artifacts.push(...(transpileResult.artifacts || []));
  }

  ctx.log('info', `Transpilation complete for ${platforms.length} platforms`);

  // ============================================================================
  // PHASE 3: UNIFIED JOB SUBMISSION INTERFACE
  // ============================================================================

  let interfaceResult = null;
  if (unifiedInterface) {
    ctx.log('info', 'Phase 3: Unified Job Submission Interface');

    interfaceResult = await ctx.task(unifiedJobSubmissionInterfaceTask, {
      platforms,
      deployments,
      abstractionLayer: abstractionResult
    });

    artifacts.push(...(interfaceResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 4: PLATFORM EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Platform Execution');

  for (const platform of platforms) {
    ctx.log('info', `Executing on ${platform}...`);

    const executionResult = await ctx.task(platformExecutionTask, {
      platform,
      transpilation: deployments[platform].transpilation,
      interface: interfaceResult
    });

    deployments[platform].execution = executionResult;
    artifacts.push(...(executionResult.artifacts || []));
  }

  await ctx.breakpoint({
    question: `Execution complete on ${platforms.length} platforms. Review execution results?`,
    title: 'Platform Execution Review',
    context: {
      runId: ctx.runId,
      deployments,
      files: artifacts.slice(-platforms.length * 2).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: RESULT NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Result Normalization');

  const normalizationResult = await ctx.task(resultNormalizationTask, {
    platforms,
    deployments,
    application
  });

  artifacts.push(...(normalizationResult.artifacts || []));

  // ============================================================================
  // PHASE 6: CROSS-PLATFORM COMPARISON
  // ============================================================================

  let comparisonResult = null;
  if (compareResults && platforms.length > 1) {
    ctx.log('info', 'Phase 6: Cross-Platform Comparison');

    comparisonResult = await ctx.task(crossPlatformComparisonTask, {
      platforms,
      normalizedResults: normalizationResult,
      deployments
    });

    artifacts.push(...(comparisonResult.artifacts || []));

    await ctx.breakpoint({
      question: `Cross-platform comparison complete. Best performing: ${comparisonResult.bestPlatform}. Review comparison?`,
      title: 'Platform Comparison Review',
      context: {
        runId: ctx.runId,
        comparison: comparisonResult,
        files: (comparisonResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: PLATFORM DIFFERENCES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Platform Differences Documentation');

  const differencesResult = await ctx.task(platformDifferencesDocumentationTask, {
    platforms,
    deployments,
    comparison: comparisonResult
  });

  artifacts.push(...(differencesResult.artifacts || []));

  // ============================================================================
  // PHASE 8: BEST PRACTICES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Best Practices Documentation');

  const bestPracticesResult = await ctx.task(bestPracticesDocumentationTask, {
    platforms,
    deployments,
    comparison: comparisonResult,
    outputDir
  });

  artifacts.push(...(bestPracticesResult.artifacts || []));

  await ctx.breakpoint({
    question: `Multi-platform deployment complete. Platforms: ${platforms.length}, Best performer: ${comparisonResult?.bestPlatform || platforms[0]}. Approve deployment?`,
    title: 'Multi-Platform Deployment Complete',
    context: {
      runId: ctx.runId,
      summary: {
        application: application.name,
        platforms: platforms.length,
        bestPlatform: comparisonResult?.bestPlatform || platforms[0],
        unifiedInterface: unifiedInterface
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    application: application.name,
    deployments: Object.fromEntries(
      Object.entries(deployments).map(([platform, data]) => [
        platform,
        {
          transpilationSuccess: data.transpilation?.success,
          executionSuccess: data.execution?.success,
          metrics: data.execution?.metrics
        }
      ])
    ),
    comparisonReport: comparisonResult ? {
      bestPlatform: comparisonResult.bestPlatform,
      rankings: comparisonResult.rankings,
      performanceMetrics: comparisonResult.performanceMetrics
    } : null,
    unifiedInterface: interfaceResult?.interface,
    normalizedResults: normalizationResult.results,
    platformDifferences: differencesResult.differences,
    bestPractices: bestPracticesResult.practices,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-HW-002',
      processName: 'Multi-Platform Deployment',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const platformAbstractionLayerTask = defineTask('mp-abstraction-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Platform Abstraction Layer',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Platform Abstraction Specialist',
      task: 'Create platform abstraction layer for multi-platform support',
      context: args,
      instructions: [
        '1. Define common interface',
        '2. Implement platform adapters',
        '3. Handle API differences',
        '4. Normalize gate sets',
        '5. Abstract job submission',
        '6. Abstract result retrieval',
        '7. Handle authentication',
        '8. Implement error mapping',
        '9. Add capability detection',
        '10. Document abstraction layer'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['supportedPlatforms', 'abstractionLayer'],
      properties: {
        supportedPlatforms: { type: 'array', items: { type: 'string' } },
        abstractionLayer: { type: 'object' },
        adapters: { type: 'object' },
        capabilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'abstraction']
}));

export const platformSpecificTranspilationTask = defineTask('mp-platform-transpilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Platform-Specific Transpilation',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Platform Transpilation Specialist',
      task: 'Transpile circuit for specific platform',
      context: args,
      instructions: [
        '1. Get platform specifications',
        '2. Transpile to native gates',
        '3. Apply platform mapping',
        '4. Optimize for platform',
        '5. Handle platform quirks',
        '6. Validate constraints',
        '7. Calculate metrics',
        '8. Generate platform circuit',
        '9. Test transpilation',
        '10. Document transpilation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'transpiledCircuit'],
      properties: {
        success: { type: 'boolean' },
        transpiledCircuit: { type: 'object' },
        metrics: { type: 'object' },
        platformSpecifics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'transpilation']
}));

export const unifiedJobSubmissionInterfaceTask = defineTask('mp-unified-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Unified Job Submission Interface',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Interface Design Specialist',
      task: 'Build unified job submission interface',
      context: args,
      instructions: [
        '1. Design unified API',
        '2. Implement job submission',
        '3. Handle platform routing',
        '4. Implement status tracking',
        '5. Add result retrieval',
        '6. Handle errors uniformly',
        '7. Implement retries',
        '8. Add logging',
        '9. Create client SDK',
        '10. Document interface'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['interface'],
      properties: {
        interface: { type: 'object' },
        apiDefinition: { type: 'object' },
        clientSDK: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'interface']
}));

export const platformExecutionTask = defineTask('mp-platform-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Platform Execution',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Platform Execution Specialist',
      task: 'Execute circuit on target platform',
      context: args,
      instructions: [
        '1. Authenticate with platform',
        '2. Submit job',
        '3. Monitor execution',
        '4. Handle queue time',
        '5. Retrieve results',
        '6. Collect metrics',
        '7. Handle errors',
        '8. Store raw results',
        '9. Record execution metadata',
        '10. Document execution'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'metrics'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        metrics: { type: 'object' },
        executionTime: { type: 'number' },
        queueTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'execution']
}));

export const resultNormalizationTask = defineTask('mp-result-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Result Normalization',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Result Processing Specialist',
      task: 'Normalize results across platforms',
      context: args,
      instructions: [
        '1. Parse platform-specific results',
        '2. Convert to common format',
        '3. Normalize measurement outcomes',
        '4. Handle bit ordering differences',
        '5. Calculate common metrics',
        '6. Apply error mitigation',
        '7. Generate unified output',
        '8. Validate normalization',
        '9. Store normalized results',
        '10. Document normalization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: { type: 'object' },
        normalizationApplied: { type: 'array' },
        commonFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'normalization']
}));

export const crossPlatformComparisonTask = defineTask('mp-cross-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-Platform Comparison',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Platform Comparison Specialist',
      task: 'Compare performance across platforms',
      context: args,
      instructions: [
        '1. Compare result quality',
        '2. Compare execution time',
        '3. Compare cost',
        '4. Compare availability',
        '5. Rank platforms',
        '6. Identify best for task',
        '7. Analyze tradeoffs',
        '8. Generate comparison charts',
        '9. Provide recommendations',
        '10. Document comparison'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestPlatform', 'rankings', 'performanceMetrics'],
      properties: {
        bestPlatform: { type: 'string' },
        rankings: { type: 'array' },
        performanceMetrics: { type: 'object' },
        tradeoffs: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'comparison']
}));

export const platformDifferencesDocumentationTask = defineTask('mp-differences-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Platform Differences Documentation',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Documentation Specialist',
      task: 'Document platform differences',
      context: args,
      instructions: [
        '1. Document gate sets',
        '2. Document connectivity',
        '3. Document API differences',
        '4. Document result formats',
        '5. Document limitations',
        '6. Document pricing',
        '7. Document availability',
        '8. Document quirks',
        '9. Create comparison table',
        '10. Generate documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['differences'],
      properties: {
        differences: { type: 'object' },
        comparisonTable: { type: 'object' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'documentation']
}));

export const bestPracticesDocumentationTask = defineTask('mp-best-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Best Practices Documentation',
  agent: {
    name: 'multi-platform-engineer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'braket-executor', 'tket-compiler', 'backend-selector'],
    prompt: {
      role: 'Best Practices Specialist',
      task: 'Document multi-platform best practices',
      context: args,
      instructions: [
        '1. Document circuit design practices',
        '2. Document transpilation practices',
        '3. Document execution practices',
        '4. Document error handling',
        '5. Document cost optimization',
        '6. Document debugging tips',
        '7. Document testing practices',
        '8. Document monitoring',
        '9. Create checklist',
        '10. Generate final documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['practices'],
      properties: {
        practices: { type: 'array' },
        checklist: { type: 'array' },
        documentation: { type: 'string' },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'multi-platform', 'best-practices']
}));
