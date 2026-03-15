/**
 * @process specializations/programming-languages/module-system-design
 * @description Module System Design - Process for designing and implementing a module system with namespaces,
 * imports/exports, visibility rules, and dependency resolution.
 * @inputs { languageName: string, moduleStyle?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, moduleSystem: object, resolution: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/module-system-design', {
 *   languageName: 'MyLang',
 *   moduleStyle: 'hierarchical'
 * });
 *
 * @references
 * - Rust Modules: https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html
 * - ES Modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
 * - OCaml Modules: https://ocaml.org/docs/modules
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    moduleStyle = 'hierarchical',
    implementationLanguage = 'Rust',
    outputDir = 'module-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Module System Design: ${languageName}`);
  ctx.log('info', `Module style: ${moduleStyle}`);

  // ============================================================================
  // PHASE 1: MODULE STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Module Structure');

  const moduleStructure = await ctx.task(moduleStructureTask, {
    languageName,
    moduleStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...moduleStructure.artifacts);

  // ============================================================================
  // PHASE 2: IMPORT/EXPORT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Import/Export System');

  const importExport = await ctx.task(importExportTask, {
    languageName,
    moduleStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...importExport.artifacts);

  await ctx.breakpoint({
    question: `Import/export system designed. Features: ${importExport.features.join(', ')}. Proceed with visibility rules?`,
    title: 'Import/Export Review',
    context: {
      runId: ctx.runId,
      features: importExport.features,
      files: importExport.artifacts.map(a => ({ path: a.path, format: a.format || 'rust' }))
    }
  });

  // ============================================================================
  // PHASE 3: VISIBILITY RULES
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Visibility Rules');

  const visibilityRules = await ctx.task(visibilityRulesTask, {
    languageName,
    moduleStructure,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...visibilityRules.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY RESOLUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Dependency Resolution');

  const dependencyResolution = await ctx.task(dependencyResolutionTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...dependencyResolution.artifacts);

  // ============================================================================
  // PHASE 5: NAME RESOLUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Name Resolution');

  const nameResolution = await ctx.task(nameResolutionTask, {
    languageName,
    moduleStructure,
    visibilityRules,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...nameResolution.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Module System');

  const integration = await ctx.task(moduleSystemIntegrationTask, {
    languageName,
    moduleStructure,
    importExport,
    visibilityRules,
    dependencyResolution,
    nameResolution,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(moduleSystemTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(moduleSystemDocumentationTask, {
    languageName,
    moduleStyle,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Module System Complete for ${languageName}! Style: ${moduleStyle}, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'Module System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        moduleStyle,
        visibilityLevels: visibilityRules.levels,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Module System' },
        { path: documentation.guidePath, format: 'markdown', label: 'Module Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    moduleSystem: {
      mainFile: integration.mainFilePath,
      style: moduleStyle
    },
    resolution: {
      algorithm: dependencyResolution.algorithm,
      features: nameResolution.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/module-system-design',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const moduleStructureTask = defineTask('module-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Module Structure - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Design module structure',
      context: args,
      instructions: [
        '1. Define module declaration syntax',
        '2. Design namespace hierarchy',
        '3. Handle file/directory mapping',
        '4. Define module paths',
        '5. Design inline modules',
        '6. Handle anonymous modules',
        '7. Design module attributes',
        '8. Handle conditional compilation',
        '9. Support module re-exports',
        '10. Document module structure'
      ],
      outputFormat: 'JSON with module structure'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'structure']
}));

export const importExportTask = defineTask('import-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Import/Export - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Implement import/export system',
      context: args,
      instructions: [
        '1. Design import syntax',
        '2. Design export syntax',
        '3. Handle named imports/exports',
        '4. Handle default exports',
        '5. Handle wildcard imports',
        '6. Handle aliased imports',
        '7. Handle selective re-exports',
        '8. Handle circular imports',
        '9. Implement import resolution',
        '10. Test import/export'
      ],
      outputFormat: 'JSON with import/export'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'import-export']
}));

export const visibilityRulesTask = defineTask('visibility-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Visibility Rules - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Implement visibility rules',
      context: args,
      instructions: [
        '1. Define visibility levels (public, private, etc.)',
        '2. Implement default visibility',
        '3. Handle crate/package visibility',
        '4. Handle parent module visibility',
        '5. Implement friend/internal visibility',
        '6. Handle visibility inheritance',
        '7. Implement visibility checking',
        '8. Handle visibility in re-exports',
        '9. Add visibility error messages',
        '10. Test visibility rules'
      ],
      outputFormat: 'JSON with visibility rules'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'filePath', 'artifacts'],
      properties: {
        levels: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        defaultVisibility: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'visibility']
}));

export const dependencyResolutionTask = defineTask('dependency-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Resolution - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Build Systems Engineer',
      task: 'Implement dependency resolution',
      context: args,
      instructions: [
        '1. Design dependency manifest format',
        '2. Implement version resolution',
        '3. Handle version constraints',
        '4. Implement dependency graph',
        '5. Handle circular dependencies',
        '6. Implement lockfile format',
        '7. Handle local dependencies',
        '8. Handle remote dependencies',
        '9. Implement caching',
        '10. Test resolution algorithm'
      ],
      outputFormat: 'JSON with dependency resolution'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'filePath', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        filePath: { type: 'string' },
        supportedSources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'dependencies']
}));

export const nameResolutionTask = defineTask('name-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Name Resolution - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement name resolution',
      context: args,
      instructions: [
        '1. Build module graph',
        '2. Resolve import paths',
        '3. Handle qualified names',
        '4. Handle unqualified names',
        '5. Implement glob imports',
        '6. Handle shadowing rules',
        '7. Resolve method calls',
        '8. Handle use declarations',
        '9. Add resolution errors',
        '10. Test name resolution'
      ],
      outputFormat: 'JSON with name resolution'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'name-resolution']
}));

export const moduleSystemIntegrationTask = defineTask('module-system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Module System Integration - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Integrate module system',
      context: args,
      instructions: [
        '1. Create main module resolver',
        '2. Integrate with parser',
        '3. Integrate with type checker',
        '4. Add module caching',
        '5. Handle incremental compilation',
        '6. Add configuration',
        '7. Handle errors',
        '8. Add debugging support',
        '9. Add metrics',
        '10. Final organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'publicApi', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'integration']
}));

export const moduleSystemTestingTask = defineTask('module-system-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Module System Testing - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive module system tests',
      context: args,
      instructions: [
        '1. Test import/export',
        '2. Test visibility rules',
        '3. Test name resolution',
        '4. Test dependency resolution',
        '5. Test circular dependencies',
        '6. Test error handling',
        '7. Test edge cases',
        '8. Benchmark performance',
        '9. Measure coverage',
        '10. Add regression tests'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'testing']
}));

export const moduleSystemDocumentationTask = defineTask('module-system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Module System Documentation - ${args.languageName}`,
  agent: {
    name: 'language-feature-designer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate module system documentation',
      context: args,
      instructions: [
        '1. Create module guide',
        '2. Document import/export',
        '3. Document visibility',
        '4. Document dependencies',
        '5. Add examples',
        '6. Add best practices',
        '7. Document resolution',
        '8. Add troubleshooting',
        '9. Document configuration',
        '10. Create quick reference'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'modules', 'documentation']
}));
