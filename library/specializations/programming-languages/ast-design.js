/**
 * @process specializations/programming-languages/ast-design
 * @description AST Design and Traversal - Process for designing abstract syntax tree structures and implementing
 * traversal patterns. Covers node design, visitor patterns, tree transformations, and serialization.
 * @inputs { languageName: string, grammarSpec?: object, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, astDefinitions: object, visitorFramework: object, transformations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/ast-design', {
 *   languageName: 'MyLang',
 *   implementationLanguage: 'Rust',
 *   immutable: true
 * });
 *
 * @references
 * - Crafting Interpreters: https://craftinginterpreters.com/representing-code.html
 * - Visitor Pattern: https://en.wikipedia.org/wiki/Visitor_pattern
 * - Tree-sitter AST: https://tree-sitter.github.io/tree-sitter/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    grammarSpec = null,
    implementationLanguage = 'TypeScript',
    immutable = true,
    typeSafe = true,
    serializable = true,
    outputDir = 'ast-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AST Design: ${languageName}`);
  ctx.log('info', `Language: ${implementationLanguage}, Immutable: ${immutable}`);

  // ============================================================================
  // PHASE 1: GRAMMAR ANALYSIS FOR NODES
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Grammar for AST Nodes');

  const grammarAnalysis = await ctx.task(grammarAnalysisTask, {
    languageName,
    grammarSpec,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...grammarAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: NODE HIERARCHY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Node Hierarchy');

  const nodeHierarchy = await ctx.task(nodeHierarchyTask, {
    languageName,
    grammarAnalysis,
    implementationLanguage,
    immutable,
    typeSafe,
    outputDir
  });

  artifacts.push(...nodeHierarchy.artifacts);

  await ctx.breakpoint({
    question: `Node hierarchy designed with ${nodeHierarchy.nodeCount} node types. Categories: ${nodeHierarchy.categories.join(', ')}. Proceed with span tracking?`,
    title: 'Node Hierarchy Review',
    context: {
      runId: ctx.runId,
      nodeCount: nodeHierarchy.nodeCount,
      categories: nodeHierarchy.categories,
      files: nodeHierarchy.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 3: SPAN TRACKING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Span Tracking');

  const spanTracking = await ctx.task(spanTrackingTask, {
    languageName,
    nodeHierarchy,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...spanTracking.artifacts);

  // ============================================================================
  // PHASE 4: VISITOR PATTERN IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Visitor Pattern');

  const visitorPattern = await ctx.task(visitorPatternTask, {
    languageName,
    nodeHierarchy,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...visitorPattern.artifacts);

  // ============================================================================
  // PHASE 5: TREE TRANSFORMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Tree Transformations');

  const transformations = await ctx.task(treeTransformationsTask, {
    languageName,
    nodeHierarchy,
    visitorPattern,
    immutable,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...transformations.artifacts);

  // ============================================================================
  // PHASE 6: SERIALIZATION SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding Serialization Support');

  const serialization = await ctx.task(serializationTask, {
    languageName,
    nodeHierarchy,
    serializable,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...serialization.artifacts);

  // ============================================================================
  // PHASE 7: UNIT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Unit Tests');

  const testSuite = await ctx.task(astTestingTask, {
    languageName,
    nodeHierarchy,
    visitorPattern,
    transformations,
    serialization,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(astDocumentationTask, {
    languageName,
    nodeHierarchy,
    visitorPattern,
    transformations,
    serialization,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `AST Design Complete for ${languageName}! ${nodeHierarchy.nodeCount} node types, ${visitorPattern.visitorCount} visitor types. Review deliverables?`,
    title: 'AST Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        nodeCount: nodeHierarchy.nodeCount,
        visitorCount: visitorPattern.visitorCount,
        transformationCount: transformations.transformationCount
      },
      files: [
        { path: nodeHierarchy.filePath, format: implementationLanguage.toLowerCase(), label: 'AST Definitions' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    astDefinitions: {
      nodeCount: nodeHierarchy.nodeCount,
      categories: nodeHierarchy.categories,
      filePath: nodeHierarchy.filePath,
      features: {
        immutable,
        typeSafe,
        serializable
      }
    },
    visitorFramework: {
      visitorCount: visitorPattern.visitorCount,
      traversalOrders: visitorPattern.traversalOrders,
      filePath: visitorPattern.filePath
    },
    transformations: {
      transformationCount: transformations.transformationCount,
      utilities: transformations.utilities
    },
    serialization: {
      formats: serialization.formats,
      roundTrip: serialization.roundTrip
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      apiDocPath: documentation.apiDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/ast-design',
      timestamp: startTime,
      languageName,
      implementationLanguage
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const grammarAnalysisTask = defineTask('grammar-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Grammar Analysis - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Analyze grammar for AST node mapping',
      context: args,
      instructions: [
        '1. Map grammar productions to AST nodes',
        '2. Identify shared node structures',
        '3. Identify expression productions',
        '4. Identify statement productions',
        '5. Identify declaration productions',
        '6. Identify type annotation productions',
        '7. Plan node hierarchy',
        '8. Identify optional vs required children',
        '9. Identify list/sequence nodes',
        '10. Create node catalog'
      ],
      outputFormat: 'JSON with grammar analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['nodeCatalog', 'mappings', 'artifacts'],
      properties: {
        nodeCatalog: { type: 'array', items: { type: 'object' } },
        mappings: { type: 'object' },
        sharedStructures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'grammar-analysis']
}));

export const nodeHierarchyTask = defineTask('node-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Node Hierarchy - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Design AST node hierarchy',
      context: args,
      instructions: [
        '1. Define base node type/trait',
        '2. Create expression node category',
        '3. Create statement node category',
        '4. Create declaration node category',
        '5. Create type node category',
        '6. Define each node with children',
        '7. Add span field to all nodes',
        '8. Use sum types/enums where appropriate',
        '9. Ensure type safety',
        '10. Generate node definitions'
      ],
      outputFormat: 'JSON with node hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['nodeCount', 'categories', 'filePath', 'artifacts'],
      properties: {
        nodeCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        nodes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'node-hierarchy']
}));

export const spanTrackingTask = defineTask('span-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Span Tracking - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Implement source span tracking',
      context: args,
      instructions: [
        '1. Design span structure (start, end)',
        '2. Support byte offsets and line/column',
        '3. Add span to all nodes',
        '4. Handle synthetic/generated nodes',
        '5. Implement span merging',
        '6. Create span utilities',
        '7. Support multi-file spans',
        '8. Handle macro expansion spans',
        '9. Optimize span storage',
        '10. Test span accuracy'
      ],
      outputFormat: 'JSON with span tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['spanStructure', 'filePath', 'artifacts'],
      properties: {
        spanStructure: { type: 'object' },
        filePath: { type: 'string' },
        utilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'span-tracking']
}));

export const visitorPatternTask = defineTask('visitor-pattern', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Visitor Pattern - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Implement visitor pattern',
      context: args,
      instructions: [
        '1. Define visitor interface/trait',
        '2. Add visit method for each node type',
        '3. Implement base visitor with defaults',
        '4. Create typed visitor variants',
        '5. Support pre-order traversal',
        '6. Support post-order traversal',
        '7. Support breadth-first traversal',
        '8. Add visitor with accumulator',
        '9. Support early termination',
        '10. Create visitor utilities'
      ],
      outputFormat: 'JSON with visitor pattern'
    },
    outputSchema: {
      type: 'object',
      required: ['visitorCount', 'traversalOrders', 'filePath', 'artifacts'],
      properties: {
        visitorCount: { type: 'number' },
        traversalOrders: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        visitorTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'visitor']
}));

export const treeTransformationsTask = defineTask('tree-transformations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Tree Transformations - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Implement tree transformation utilities',
      context: args,
      instructions: [
        '1. Create tree map utility',
        '2. Create tree fold utility',
        '3. Implement tree rewrite framework',
        '4. Support pattern matching on trees',
        '5. Create node replacement utilities',
        '6. Handle immutable transformations',
        '7. Support tree filtering',
        '8. Create tree comparison utilities',
        '9. Implement tree diff algorithm',
        '10. Add transformation composition'
      ],
      outputFormat: 'JSON with transformations'
    },
    outputSchema: {
      type: 'object',
      required: ['transformationCount', 'utilities', 'artifacts'],
      properties: {
        transformationCount: { type: 'number' },
        utilities: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'transformations']
}));

export const serializationTask = defineTask('serialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Serialization - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'AST Designer',
      task: 'Implement AST serialization',
      context: args,
      instructions: [
        '1. Implement JSON serialization',
        '2. Support pretty-printing',
        '3. Implement deserialization',
        '4. Verify round-trip preservation',
        '5. Add binary serialization (optional)',
        '6. Support versioned format',
        '7. Handle circular references (if any)',
        '8. Add compression support',
        '9. Create serialization tests',
        '10. Document format specification'
      ],
      outputFormat: 'JSON with serialization'
    },
    outputSchema: {
      type: 'object',
      required: ['formats', 'roundTrip', 'artifacts'],
      properties: {
        formats: { type: 'array', items: { type: 'string' } },
        roundTrip: { type: 'boolean' },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ast', 'serialization']
}));

export const astTestingTask = defineTask('ast-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: AST Testing - ${args.languageName}`,
  agent: {
    name: 'semantic-analysis-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive AST tests',
      context: args,
      instructions: [
        '1. Test each node type',
        '2. Test visitor traversals',
        '3. Test transformations',
        '4. Test serialization round-trip',
        '5. Test span accuracy',
        '6. Test edge cases',
        '7. Test immutability guarantees',
        '8. Test type safety',
        '9. Measure code coverage',
        '10. Add property-based tests'
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
  labels: ['programming-languages', 'ast', 'testing']
}));

export const astDocumentationTask = defineTask('ast-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: AST Documentation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate AST documentation',
      context: args,
      instructions: [
        '1. Create API reference documentation',
        '2. Document each node type',
        '3. Document visitor pattern usage',
        '4. Add transformation examples',
        '5. Document serialization format',
        '6. Create architecture overview',
        '7. Add code examples',
        '8. Document best practices',
        '9. Create quick reference',
        '10. Add diagrams'
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
  labels: ['programming-languages', 'ast', 'documentation']
}));
