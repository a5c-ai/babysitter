/**
 * @process specializations/programming-languages/source-map-generation
 * @description Source Map Generation - Process for generating source maps to enable debugging of compiled/transpiled
 * code in terms of the original source.
 * @inputs { languageName: string, sourceMapVersion?: number, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, sourceMapGenerator: object, mappingSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/source-map-generation', {
 *   languageName: 'MyLang',
 *   sourceMapVersion: 3
 * });
 *
 * @references
 * - Source Map V3 Spec: https://sourcemaps.info/spec.html
 * - Mozilla Source Maps: https://github.com/nicolo-ribaudo/nicolo-nicolo-nicolo-nicolo-nicolo-nicolo-nicolo-nicolo-nicolo-nicolo
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    sourceMapVersion = 3,
    implementationLanguage = 'TypeScript',
    outputDir = 'sourcemap-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Source Map Generation: ${languageName}`);

  // ============================================================================
  // PHASE 1: MAPPING COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Implementing Mapping Collection');

  const mappingCollection = await ctx.task(mappingCollectionTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...mappingCollection.artifacts);

  // ============================================================================
  // PHASE 2: VLQ ENCODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing VLQ Encoding');

  const vlqEncoding = await ctx.task(vlqEncodingTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...vlqEncoding.artifacts);

  // ============================================================================
  // PHASE 3: SOURCE MAP GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Source Map Generation');

  const sourceMapGeneration = await ctx.task(sourceMapGenerationTask, {
    languageName,
    sourceMapVersion,
    mappingCollection,
    vlqEncoding,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...sourceMapGeneration.artifacts);

  // ============================================================================
  // PHASE 4: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Integrating Source Map Generator');

  const integration = await ctx.task(sourceMapIntegrationTask, {
    languageName,
    mappingCollection,
    sourceMapGeneration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 5: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating Tests');

  const testSuite = await ctx.task(sourceMapTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Documentation');

  const documentation = await ctx.task(sourceMapDocumentationTask, {
    languageName,
    sourceMapVersion,
    integration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Source Map Generation Complete for ${languageName}! Version ${sourceMapVersion}, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'Source Map Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        sourceMapVersion,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Source Map Generator' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    sourceMapGenerator: {
      mainFile: integration.mainFilePath,
      version: sourceMapVersion
    },
    mappingSystem: {
      features: mappingCollection.features
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/source-map-generation',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const mappingCollectionTask = defineTask('mapping-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Mapping Collection - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Tooling Engineer',
      task: 'Implement mapping collection',
      context: args,
      instructions: [
        '1. Track original positions during codegen',
        '2. Create mapping builder API',
        '3. Handle line/column tracking',
        '4. Track source files',
        '5. Track original names',
        '6. Handle multi-file compilation',
        '7. Optimize memory usage',
        '8. Handle inline sources',
        '9. Track content hashes',
        '10. Test mapping accuracy'
      ],
      outputFormat: 'JSON with mapping collection'
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
  labels: ['programming-languages', 'sourcemap', 'mapping']
}));

export const vlqEncodingTask = defineTask('vlq-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: VLQ Encoding - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Tooling Engineer',
      task: 'Implement VLQ encoding',
      context: args,
      instructions: [
        '1. Implement base64 VLQ encoding',
        '2. Implement VLQ decoding',
        '3. Handle signed values',
        '4. Optimize encoding performance',
        '5. Handle segment encoding',
        '6. Implement line separation',
        '7. Add validation',
        '8. Test edge cases',
        '9. Benchmark encoding',
        '10. Document format'
      ],
      outputFormat: 'JSON with VLQ encoding'
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
  labels: ['programming-languages', 'sourcemap', 'vlq']
}));

export const sourceMapGenerationTask = defineTask('sourcemap-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Source Map Generation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Tooling Engineer',
      task: 'Implement source map generation',
      context: args,
      instructions: [
        '1. Generate source map JSON',
        '2. Set version field',
        '3. Generate sources array',
        '4. Generate names array',
        '5. Generate mappings string',
        '6. Support sourcesContent',
        '7. Handle source roots',
        '8. Support inline source maps',
        '9. Add source map comment',
        '10. Test output format'
      ],
      outputFormat: 'JSON with source map generation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        outputFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'sourcemap', 'generation']
}));

export const sourceMapIntegrationTask = defineTask('sourcemap-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Source Map Integration - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Compiler Tooling Engineer',
      task: 'Integrate source map generator',
      context: args,
      instructions: [
        '1. Create main generator API',
        '2. Integrate with compiler',
        '3. Add configuration options',
        '4. Support output modes',
        '5. Handle errors',
        '6. Add validation',
        '7. Support concatenation',
        '8. Add debugging mode',
        '9. Optimize performance',
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
  labels: ['programming-languages', 'sourcemap', 'integration']
}));

export const sourceMapTestingTask = defineTask('sourcemap-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Source Map Testing - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive source map tests',
      context: args,
      instructions: [
        '1. Test mapping accuracy',
        '2. Test VLQ encoding',
        '3. Test JSON output',
        '4. Test with browser devtools',
        '5. Test inline source maps',
        '6. Test multi-file',
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
  labels: ['programming-languages', 'sourcemap', 'testing']
}));

export const sourceMapDocumentationTask = defineTask('sourcemap-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Source Map Documentation - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate source map documentation',
      context: args,
      instructions: [
        '1. Create API reference',
        '2. Document usage',
        '3. Document options',
        '4. Add integration guide',
        '5. Document format spec',
        '6. Add debugging guide',
        '7. Document tooling',
        '8. Add examples',
        '9. Document best practices',
        '10. Add troubleshooting'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'artifacts'],
      properties: {
        apiDocPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'sourcemap', 'documentation']
}));
