/**
 * @process Quantum SDK/Library Development
 * @id QC-SW-003
 * @description Develop reusable quantum software libraries and SDKs including circuit primitives,
 * algorithm templates, and hardware abstraction layers.
 * @category Quantum Computing - Software Engineering
 * @priority P2 - Medium
 * @inputs {{ libraryName: string, targetFeatures: array, platforms?: array }}
 * @outputs {{ success: boolean, library: object, documentation: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-sdk-library-development', {
 *   libraryName: 'quantum-algorithms-toolkit',
 *   targetFeatures: ['grover', 'vqe', 'qaoa', 'qft'],
 *   platforms: ['qiskit', 'cirq', 'pennylane']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    libraryName,
    targetFeatures = [],
    platforms = ['qiskit'],
    includeHardwareAbstraction = true,
    includeExamples = true,
    outputDir = 'quantum-sdk-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum SDK/Library Development: ${libraryName}`);
  ctx.log('info', `Features: ${targetFeatures.join(', ')}, Platforms: ${platforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: LIBRARY ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Library Architecture Design');

  const architectureResult = await ctx.task(libraryArchitectureDesignTask, {
    libraryName,
    targetFeatures,
    platforms
  });

  artifacts.push(...(architectureResult.artifacts || []));

  await ctx.breakpoint({
    question: `Library architecture designed. Modules: ${architectureResult.moduleCount}, APIs: ${architectureResult.apiCount}. Proceed with circuit primitives implementation?`,
    title: 'Library Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureResult,
      files: (architectureResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CIRCUIT PRIMITIVES IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Circuit Primitives Implementation');

  const primitivesResult = await ctx.task(circuitPrimitivesImplementationTask, {
    architecture: architectureResult,
    targetFeatures,
    platforms
  });

  artifacts.push(...(primitivesResult.artifacts || []));

  ctx.log('info', `Primitives implemented: ${primitivesResult.primitiveCount}`);

  // ============================================================================
  // PHASE 3: ALGORITHM TEMPLATES IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Algorithm Templates Implementation');

  const templatesResult = await ctx.task(algorithmTemplatesImplementationTask, {
    architecture: architectureResult,
    targetFeatures,
    primitives: primitivesResult
  });

  artifacts.push(...(templatesResult.artifacts || []));

  await ctx.breakpoint({
    question: `Algorithm templates implemented: ${templatesResult.templateCount}. Included: ${templatesResult.algorithms.join(', ')}. Review templates?`,
    title: 'Algorithm Templates Review',
    context: {
      runId: ctx.runId,
      templates: templatesResult,
      files: (templatesResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: HARDWARE ABSTRACTION LAYER
  // ============================================================================

  let halResult = null;
  if (includeHardwareAbstraction) {
    ctx.log('info', 'Phase 4: Hardware Abstraction Layer');

    halResult = await ctx.task(hardwareAbstractionLayerTask, {
      platforms,
      architecture: architectureResult
    });

    artifacts.push(...(halResult.artifacts || []));

    ctx.log('info', `HAL implemented for ${halResult.supportedBackends.length} backends`);
  }

  // ============================================================================
  // PHASE 5: API DESIGN AND IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: API Design and Implementation');

  const apiResult = await ctx.task(apiDesignImplementationTask, {
    libraryName,
    architecture: architectureResult,
    primitives: primitivesResult,
    templates: templatesResult,
    hal: halResult
  });

  artifacts.push(...(apiResult.artifacts || []));

  // ============================================================================
  // PHASE 6: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documentation Generation');

  const docsResult = await ctx.task(documentationGenerationTask, {
    libraryName,
    architecture: architectureResult,
    apiResult,
    primitivesResult,
    templatesResult
  });

  artifacts.push(...(docsResult.artifacts || []));

  // ============================================================================
  // PHASE 7: EXAMPLE NOTEBOOKS
  // ============================================================================

  let examplesResult = null;
  if (includeExamples) {
    ctx.log('info', 'Phase 7: Example Notebooks Creation');

    examplesResult = await ctx.task(exampleNotebooksCreationTask, {
      libraryName,
      targetFeatures,
      templates: templatesResult
    });

    artifacts.push(...(examplesResult.artifacts || []));

    ctx.log('info', `Example notebooks created: ${examplesResult.notebookCount}`);
  }

  // ============================================================================
  // PHASE 8: MULTI-PLATFORM SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Multi-Platform Support');

  const multiPlatformResult = await ctx.task(multiPlatformSupportTask, {
    libraryName,
    platforms,
    architecture: architectureResult,
    hal: halResult
  });

  artifacts.push(...(multiPlatformResult.artifacts || []));

  // ============================================================================
  // PHASE 9: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Testing and Validation');

  const testingResult = await ctx.task(sdkTestingValidationTask, {
    libraryName,
    architecture: architectureResult,
    primitives: primitivesResult,
    templates: templatesResult,
    platforms
  });

  artifacts.push(...(testingResult.artifacts || []));

  await ctx.breakpoint({
    question: `SDK testing complete. Tests passed: ${testingResult.passedTests}/${testingResult.totalTests}. Coverage: ${testingResult.coverage}%. Review test results?`,
    title: 'SDK Testing Review',
    context: {
      runId: ctx.runId,
      testing: testingResult,
      files: (testingResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 10: PACKAGING AND DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Phase 10: Packaging and Distribution');

  const packagingResult = await ctx.task(packagingDistributionTask, {
    libraryName,
    architecture: architectureResult,
    platforms,
    outputDir
  });

  artifacts.push(...(packagingResult.artifacts || []));

  await ctx.breakpoint({
    question: `SDK development complete. Library: ${libraryName}, Modules: ${architectureResult.moduleCount}, Platforms: ${multiPlatformResult.supportedPlatforms.length}. Approve release?`,
    title: 'SDK Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        libraryName,
        modules: architectureResult.moduleCount,
        primitives: primitivesResult.primitiveCount,
        templates: templatesResult.templateCount,
        platforms: multiPlatformResult.supportedPlatforms.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    libraryName,
    library: {
      architecture: architectureResult.architecture,
      moduleCount: architectureResult.moduleCount,
      primitives: primitivesResult.primitiveCount,
      templates: templatesResult.templateCount,
      algorithms: templatesResult.algorithms
    },
    platforms: {
      supported: multiPlatformResult.supportedPlatforms,
      compatibility: multiPlatformResult.compatibilityMatrix
    },
    documentation: {
      apiDocs: docsResult.apiDocsPath,
      userGuide: docsResult.userGuidePath,
      examples: examplesResult?.notebookPaths || []
    },
    testing: {
      totalTests: testingResult.totalTests,
      passedTests: testingResult.passedTests,
      coverage: testingResult.coverage
    },
    packaging: {
      packagePath: packagingResult.packagePath,
      installCommand: packagingResult.installCommand
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-SW-003',
      processName: 'Quantum SDK/Library Development',
      category: 'quantum-computing',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const libraryArchitectureDesignTask = defineTask('sdk-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Library Architecture Design',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Software Architecture Specialist',
      task: 'Design quantum library architecture',
      context: args,
      instructions: [
        '1. Define module structure',
        '2. Design package hierarchy',
        '3. Plan dependency management',
        '4. Design public API surface',
        '5. Plan internal interfaces',
        '6. Design extensibility points',
        '7. Plan versioning strategy',
        '8. Design error handling',
        '9. Create architecture diagram',
        '10. Document design decisions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'moduleCount', 'apiCount'],
      properties: {
        architecture: { type: 'object' },
        moduleCount: { type: 'number' },
        apiCount: { type: 'number' },
        packageHierarchy: { type: 'object' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'architecture']
}));

export const circuitPrimitivesImplementationTask = defineTask('sdk-circuit-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Circuit Primitives Implementation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Quantum Circuit Developer',
      task: 'Implement reusable circuit primitives',
      context: args,
      instructions: [
        '1. Implement basic gate operations',
        '2. Create parameterized circuits',
        '3. Implement entanglement patterns',
        '4. Create state preparation circuits',
        '5. Implement measurement utilities',
        '6. Create circuit composition tools',
        '7. Add circuit visualization',
        '8. Implement circuit validation',
        '9. Add serialization support',
        '10. Document all primitives'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['primitiveCount', 'primitives'],
      properties: {
        primitiveCount: { type: 'number' },
        primitives: { type: 'array' },
        categories: { type: 'array' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'primitives']
}));

export const algorithmTemplatesImplementationTask = defineTask('sdk-algorithm-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Algorithm Templates Implementation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Quantum Algorithm Developer',
      task: 'Implement algorithm templates',
      context: args,
      instructions: [
        '1. Implement VQE template',
        '2. Implement QAOA template',
        '3. Implement Grover template',
        '4. Implement QFT template',
        '5. Implement QPE template',
        '6. Create configurable parameters',
        '7. Add callback support',
        '8. Implement result processing',
        '9. Add algorithm composition',
        '10. Document all templates'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['templateCount', 'algorithms'],
      properties: {
        templateCount: { type: 'number' },
        algorithms: { type: 'array', items: { type: 'string' } },
        templates: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'algorithms']
}));

export const hardwareAbstractionLayerTask = defineTask('sdk-hardware-abstraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hardware Abstraction Layer',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Hardware Integration Specialist',
      task: 'Implement hardware abstraction layer',
      context: args,
      instructions: [
        '1. Design backend interface',
        '2. Implement backend registry',
        '3. Create transpilation hooks',
        '4. Implement job submission interface',
        '5. Add result normalization',
        '6. Implement backend selection',
        '7. Add capability detection',
        '8. Implement fallback strategies',
        '9. Add configuration management',
        '10. Document HAL usage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['supportedBackends', 'interface'],
      properties: {
        supportedBackends: { type: 'array' },
        interface: { type: 'object' },
        capabilities: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'hardware-abstraction']
}));

export const apiDesignImplementationTask = defineTask('sdk-api-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'API Design and Implementation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'API Design Specialist',
      task: 'Design and implement library APIs',
      context: args,
      instructions: [
        '1. Design user-facing APIs',
        '2. Create fluent interfaces',
        '3. Implement factory patterns',
        '4. Add type annotations',
        '5. Implement validation',
        '6. Create convenience methods',
        '7. Add async support',
        '8. Implement context managers',
        '9. Add deprecation handling',
        '10. Document all APIs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['apiSurface'],
      properties: {
        apiSurface: { type: 'object' },
        publicMethods: { type: 'array' },
        typeDefinitions: { type: 'object' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'api']
}));

export const documentationGenerationTask = defineTask('sdk-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Documentation Generation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Technical Writer',
      task: 'Generate comprehensive library documentation',
      context: args,
      instructions: [
        '1. Generate API reference',
        '2. Write user guide',
        '3. Create quickstart guide',
        '4. Write tutorials',
        '5. Document best practices',
        '6. Add migration guides',
        '7. Create FAQ section',
        '8. Add troubleshooting guide',
        '9. Generate docstrings',
        '10. Create index/search'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocsPath', 'userGuidePath'],
      properties: {
        apiDocsPath: { type: 'string' },
        userGuidePath: { type: 'string' },
        tutorialsPath: { type: 'string' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'documentation']
}));

export const exampleNotebooksCreationTask = defineTask('sdk-example-notebooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Example Notebooks Creation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Quantum Education Specialist',
      task: 'Create example Jupyter notebooks',
      context: args,
      instructions: [
        '1. Create getting started notebook',
        '2. Create algorithm examples',
        '3. Add hardware integration examples',
        '4. Create visualization examples',
        '5. Add advanced usage examples',
        '6. Include error handling examples',
        '7. Add performance tips',
        '8. Create real-world examples',
        '9. Add interactive exercises',
        '10. Document expected outputs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['notebookCount', 'notebookPaths'],
      properties: {
        notebookCount: { type: 'number' },
        notebookPaths: { type: 'array' },
        notebooks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'examples']
}));

export const multiPlatformSupportTask = defineTask('sdk-multi-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Multi-Platform Support',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Cross-Platform Specialist',
      task: 'Implement multi-platform support',
      context: args,
      instructions: [
        '1. Implement platform adapters',
        '2. Create compatibility layer',
        '3. Handle platform differences',
        '4. Add feature detection',
        '5. Implement fallbacks',
        '6. Create conversion utilities',
        '7. Add platform-specific optimizations',
        '8. Test cross-platform compatibility',
        '9. Create compatibility matrix',
        '10. Document platform differences'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['supportedPlatforms', 'compatibilityMatrix'],
      properties: {
        supportedPlatforms: { type: 'array' },
        compatibilityMatrix: { type: 'object' },
        adapters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'multi-platform']
}));

export const sdkTestingValidationTask = defineTask('sdk-testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'SDK Testing and Validation',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'SDK Testing Specialist',
      task: 'Test and validate SDK functionality',
      context: args,
      instructions: [
        '1. Run unit tests',
        '2. Run integration tests',
        '3. Test all platforms',
        '4. Validate examples',
        '5. Test documentation code',
        '6. Measure coverage',
        '7. Run performance tests',
        '8. Test edge cases',
        '9. Validate API contracts',
        '10. Generate test report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'coverage'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        coverage: { type: 'number' },
        testReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'testing']
}));

export const packagingDistributionTask = defineTask('sdk-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Packaging and Distribution',
  agent: {
    name: 'quantum-sdk-developer',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'pennylane-hybrid-executor', 'tket-compiler'],
    prompt: {
      role: 'Package Management Specialist',
      task: 'Package and prepare SDK for distribution',
      context: args,
      instructions: [
        '1. Create setup.py/pyproject.toml',
        '2. Configure package metadata',
        '3. Set up dependencies',
        '4. Create package structure',
        '5. Add entry points',
        '6. Configure classifiers',
        '7. Create distribution files',
        '8. Add installation instructions',
        '9. Set up CI/CD for releases',
        '10. Document release process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'installCommand'],
      properties: {
        packagePath: { type: 'string' },
        installCommand: { type: 'string' },
        packageMetadata: { type: 'object' },
        releaseProcess: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'sdk', 'packaging']
}));
