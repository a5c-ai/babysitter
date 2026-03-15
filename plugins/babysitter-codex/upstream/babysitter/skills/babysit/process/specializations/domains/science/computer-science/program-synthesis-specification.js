/**
 * @process computer-science/program-synthesis-specification
 * @description Specify and implement program synthesis from high-level specifications
 * @inputs { taskDescription: string, specificationFormat: string, searchSpaceConstraints: object }
 * @outputs { success: boolean, synthesisSystem: object, correctnessGuarantees: object, performanceBenchmarks: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    taskDescription,
    specificationFormat = 'examples',
    searchSpaceConstraints = {},
    synthesisApproach = 'enumerative',
    outputDir = 'program-synthesis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Program Synthesis Specification');

  // ============================================================================
  // PHASE 1: SPECIFICATION LANGUAGE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining specification language');
  const specificationLanguage = await ctx.task(specificationLanguageTask, {
    taskDescription,
    specificationFormat,
    outputDir
  });

  artifacts.push(...specificationLanguage.artifacts);

  // ============================================================================
  // PHASE 2: SEARCH SPACE REPRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing search space representation');
  const searchSpaceDesign = await ctx.task(searchSpaceDesignTask, {
    taskDescription,
    specificationLanguage,
    searchSpaceConstraints,
    outputDir
  });

  artifacts.push(...searchSpaceDesign.artifacts);

  // ============================================================================
  // PHASE 3: SYNTHESIS ALGORITHM IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing synthesis algorithm');
  const synthesisAlgorithm = await ctx.task(synthesisAlgorithmTask, {
    taskDescription,
    specificationLanguage,
    searchSpaceDesign,
    synthesisApproach,
    outputDir
  });

  artifacts.push(...synthesisAlgorithm.artifacts);

  // ============================================================================
  // PHASE 4: PROGRAM VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Verifying synthesized programs');
  const programVerification = await ctx.task(programVerificationTask, {
    specificationLanguage,
    searchSpaceDesign,
    synthesisAlgorithm,
    outputDir
  });

  artifacts.push(...programVerification.artifacts);

  // ============================================================================
  // PHASE 5: SYNTHESIS OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing for synthesis speed and quality');
  const synthesisOptimization = await ctx.task(synthesisOptimizationTask, {
    synthesisAlgorithm,
    searchSpaceDesign,
    outputDir
  });

  artifacts.push(...synthesisOptimization.artifacts);

  // ============================================================================
  // PHASE 6: AMBIGUOUS SPECIFICATION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling ambiguous specifications');
  const ambiguityHandling = await ctx.task(ambiguityHandlingTask, {
    specificationLanguage,
    synthesisAlgorithm,
    outputDir
  });

  artifacts.push(...ambiguityHandling.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing performance benchmarks');
  const performanceBenchmarks = await ctx.task(performanceBenchmarksTask, {
    taskDescription,
    synthesisAlgorithm,
    outputDir
  });

  artifacts.push(...performanceBenchmarks.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS SYSTEM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating synthesis system documentation');
  const systemDocumentation = await ctx.task(synthesisDocumentationTask, {
    taskDescription,
    specificationLanguage,
    searchSpaceDesign,
    synthesisAlgorithm,
    programVerification,
    synthesisOptimization,
    ambiguityHandling,
    performanceBenchmarks,
    outputDir
  });

  artifacts.push(...systemDocumentation.artifacts);

  // Breakpoint: Review program synthesis specification
  await ctx.breakpoint({
    question: `Program synthesis specification complete. Approach: ${synthesisApproach}. Search space: ${searchSpaceDesign.searchSpaceSize}. Review specification?`,
    title: 'Program Synthesis Specification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        specificationFormat,
        synthesisApproach,
        searchSpaceSize: searchSpaceDesign.searchSpaceSize,
        verificationType: programVerification.verificationType
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    taskDescription,
    synthesisSystem: {
      specificationLanguage: {
        format: specificationLanguage.format,
        expressiveness: specificationLanguage.expressiveness
      },
      searchSpace: {
        representation: searchSpaceDesign.representation,
        size: searchSpaceDesign.searchSpaceSize,
        grammar: searchSpaceDesign.grammar
      },
      algorithm: {
        approach: synthesisApproach,
        description: synthesisAlgorithm.algorithmDescription,
        complexity: synthesisAlgorithm.complexity
      },
      documentationPath: systemDocumentation.documentPath
    },
    correctnessGuarantees: {
      verificationType: programVerification.verificationType,
      soundness: programVerification.soundness,
      completeness: programVerification.completeness
    },
    performanceBenchmarks: {
      benchmarkSuite: performanceBenchmarks.benchmarkSuite,
      expectedPerformance: performanceBenchmarks.expectedPerformance
    },
    ambiguityHandling: {
      approach: ambiguityHandling.approach,
      ranking: ambiguityHandling.ranking
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/program-synthesis-specification',
      timestamp: startTime,
      specificationFormat,
      synthesisApproach,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Specification Language
export const specificationLanguageTask = defineTask('specification-language', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define specification language',
  agent: {
    name: 'semantics-formalist',
    skills: ['grammar-parser-generator', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'specification language designer',
      task: 'Define the specification language for expressing synthesis tasks',
      context: args,
      instructions: [
        'Choose specification format (examples, logical, sketch, natural language)',
        'Define specification syntax if custom',
        'For examples: define input-output format',
        'For logical: define assertion language',
        'For sketches: define hole syntax',
        'Document expressiveness vs complexity tradeoffs',
        'Generate specification language definition'
      ],
      outputFormat: 'JSON with format, syntax, expressiveness, examples, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'syntax', 'expressiveness', 'artifacts'],
      properties: {
        format: { type: 'string', enum: ['examples', 'logical', 'sketch', 'natural-language', 'hybrid'] },
        syntax: { type: 'string' },
        expressiveness: { type: 'string' },
        exampleSpecifications: { type: 'array', items: { type: 'string' } },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'specification']
}));

// Task 2: Search Space Design
export const searchSpaceDesignTask = defineTask('search-space-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design search space representation',
  agent: {
    name: 'algorithm-analyst',
    skills: ['grammar-parser-generator', 'asymptotic-notation-calculator', 'type-inference-engine'],
    prompt: {
      role: 'search space design specialist',
      task: 'Design the search space representation for program synthesis',
      context: args,
      instructions: [
        'Define target program language/DSL',
        'Design grammar for program space',
        'Define components/operators available',
        'Estimate search space size',
        'Consider typing constraints to prune space',
        'Define program representation (AST, string, etc.)',
        'Document search space structure',
        'Generate search space specification'
      ],
      outputFormat: 'JSON with representation, grammar, components, searchSpaceSize, typingConstraints, pruning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['representation', 'grammar', 'searchSpaceSize', 'artifacts'],
      properties: {
        representation: { type: 'string' },
        grammar: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        searchSpaceSize: { type: 'string' },
        typingConstraints: { type: 'array', items: { type: 'string' } },
        pruningStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'search-space']
}));

// Task 3: Synthesis Algorithm
export const synthesisAlgorithmTask = defineTask('synthesis-algorithm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement synthesis algorithm',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'type-inference-engine', 'theorem-prover-interface'],
    prompt: {
      role: 'program synthesis algorithm specialist',
      task: 'Design and implement the synthesis algorithm',
      context: args,
      instructions: [
        'Choose synthesis approach (enumerative, constraint-based, neural)',
        'For enumerative: design search strategy (BFS, DFS, A*)',
        'For constraint-based: design constraint encoding',
        'For neural: design model architecture',
        'Implement pruning and optimization',
        'Handle partial program evaluation',
        'Document algorithm complexity',
        'Generate synthesis algorithm specification'
      ],
      outputFormat: 'JSON with algorithmDescription, approach, searchStrategy, pruning, partialEvaluation, complexity, pseudocode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithmDescription', 'approach', 'complexity', 'artifacts'],
      properties: {
        algorithmDescription: { type: 'string' },
        approach: { type: 'string', enum: ['enumerative', 'constraint-based', 'neural', 'hybrid'] },
        searchStrategy: { type: 'string' },
        constraintEncoding: { type: 'string' },
        pruning: { type: 'array', items: { type: 'string' } },
        partialEvaluation: { type: 'string' },
        complexity: { type: 'string' },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'algorithm']
}));

// Task 4: Program Verification
export const programVerificationTask = defineTask('program-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify synthesized programs',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'program verification specialist',
      task: 'Design verification approach for synthesized programs',
      context: args,
      instructions: [
        'Define verification method (testing, bounded, complete)',
        'For example specs: verify against all examples',
        'For logical specs: use SMT solving or testing',
        'Analyze soundness guarantees',
        'Analyze completeness guarantees',
        'Handle verification-synthesis loop',
        'Document verification approach',
        'Generate verification specification'
      ],
      outputFormat: 'JSON with verificationType, method, soundness, completeness, verificationLoop, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationType', 'method', 'soundness', 'artifacts'],
      properties: {
        verificationType: { type: 'string', enum: ['testing', 'bounded', 'complete'] },
        method: { type: 'string' },
        soundness: { type: 'string' },
        completeness: { type: 'string' },
        verificationLoop: { type: 'string' },
        smtIntegration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'verification']
}));

// Task 5: Synthesis Optimization
export const synthesisOptimizationTask = defineTask('synthesis-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize for synthesis speed and quality',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'dataflow-analysis-engine'],
    prompt: {
      role: 'synthesis optimization specialist',
      task: 'Optimize synthesis for speed and output quality',
      context: args,
      instructions: [
        'Design cost model for program quality',
        'Implement observational equivalence pruning',
        'Design caching for partial evaluations',
        'Implement parallel synthesis if applicable',
        'Design learning-based guidance',
        'Optimize for common synthesis patterns',
        'Document optimizations',
        'Generate optimization specification'
      ],
      outputFormat: 'JSON with costModel, pruningOptimizations, caching, parallelization, learning, commonPatterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costModel', 'pruningOptimizations', 'artifacts'],
      properties: {
        costModel: { type: 'string' },
        pruningOptimizations: { type: 'array', items: { type: 'string' } },
        observationalEquivalence: { type: 'string' },
        caching: { type: 'string' },
        parallelization: { type: 'string' },
        learning: { type: 'string' },
        commonPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'optimization']
}));

// Task 6: Ambiguity Handling
export const ambiguityHandlingTask = defineTask('ambiguity-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle ambiguous specifications',
  agent: {
    name: 'semantics-formalist',
    skills: ['type-inference-engine', 'grammar-parser-generator', 'latex-proof-formatter'],
    prompt: {
      role: 'specification ambiguity specialist',
      task: 'Design approach for handling ambiguous specifications',
      context: args,
      instructions: [
        'Identify sources of ambiguity',
        'Design program ranking for multiple solutions',
        'Consider simplicity bias (Occam\'s razor)',
        'Implement user interaction for disambiguation',
        'Design active learning queries',
        'Handle underspecification gracefully',
        'Document ambiguity handling',
        'Generate ambiguity handling specification'
      ],
      outputFormat: 'JSON with approach, ranking, simplicityBias, userInteraction, activeLearning, underspecification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'ranking', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        ranking: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            method: { type: 'string' }
          }
        },
        simplicityBias: { type: 'string' },
        userInteraction: { type: 'string' },
        activeLearning: { type: 'string' },
        underspecification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'ambiguity']
}));

// Task 7: Performance Benchmarks
export const performanceBenchmarksTask = defineTask('performance-benchmarks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design performance benchmarks',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'latex-proof-formatter'],
    prompt: {
      role: 'synthesis benchmarking specialist',
      task: 'Design performance benchmarks for the synthesis system',
      context: args,
      instructions: [
        'Identify relevant benchmark suites (SyGuS, etc.)',
        'Design custom benchmarks for target domain',
        'Define success metrics (time, program size, quality)',
        'Design scalability tests',
        'Plan comparison with state-of-the-art',
        'Document benchmark methodology',
        'Generate benchmark specification'
      ],
      outputFormat: 'JSON with benchmarkSuite, customBenchmarks, metrics, scalabilityTests, comparisons, expectedPerformance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarkSuite', 'metrics', 'artifacts'],
      properties: {
        benchmarkSuite: { type: 'array', items: { type: 'string' } },
        customBenchmarks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              difficulty: { type: 'string' }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        scalabilityTests: { type: 'string' },
        comparisons: { type: 'array', items: { type: 'string' } },
        expectedPerformance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'benchmarks']
}));

// Task 8: Synthesis Documentation
export const synthesisDocumentationTask = defineTask('synthesis-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate synthesis system documentation',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'grammar-parser-generator'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive program synthesis system documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document specification language',
        'Present search space design',
        'Detail synthesis algorithm',
        'Document verification approach',
        'Present optimization techniques',
        'Include benchmark results design',
        'Format as professional synthesis specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyFeatures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-synthesis', 'documentation']
}));
