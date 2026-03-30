/**
 * @process computer-science/dsl-design-implementation
 * @description Design and implement domain-specific languages for specialized problem domains
 * @inputs { domainDescription: string, domainRequirements: array, implementationApproach: string }
 * @outputs { success: boolean, dslSpecification: object, implementation: object, standardLibrary: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domainDescription,
    domainRequirements = [],
    implementationApproach = 'embedded',
    hostLanguage = null,
    outputDir = 'dsl-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting DSL Design and Implementation');

  // ============================================================================
  // PHASE 1: DOMAIN REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing domain requirements and idioms');
  const domainAnalysis = await ctx.task(domainAnalysisTask, {
    domainDescription,
    domainRequirements,
    outputDir
  });

  artifacts.push(...domainAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: SYNTAX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing DSL syntax for domain expressiveness');
  const syntaxDesign = await ctx.task(syntaxDesignTask, {
    domainDescription,
    domainAnalysis,
    implementationApproach,
    hostLanguage,
    outputDir
  });

  artifacts.push(...syntaxDesign.artifacts);

  // ============================================================================
  // PHASE 3: SEMANTICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining DSL semantics');
  const semanticsDefinition = await ctx.task(semanticsDefinitionTask, {
    domainDescription,
    domainAnalysis,
    syntaxDesign,
    implementationApproach,
    outputDir
  });

  artifacts.push(...semanticsDefinition.artifacts);

  // ============================================================================
  // PHASE 4: PARSER AND TYPE CHECKER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing parser and type checker');
  const parserTypeChecker = await ctx.task(parserTypeCheckerTask, {
    syntaxDesign,
    semanticsDefinition,
    implementationApproach,
    hostLanguage,
    outputDir
  });

  artifacts.push(...parserTypeChecker.artifacts);

  // ============================================================================
  // PHASE 5: COMPILATION/INTERPRETATION BACKEND
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating compilation/interpretation backend');
  const backend = await ctx.task(backendImplementationTask, {
    domainDescription,
    syntaxDesign,
    semanticsDefinition,
    implementationApproach,
    hostLanguage,
    outputDir
  });

  artifacts.push(...backend.artifacts);

  // ============================================================================
  // PHASE 6: STANDARD LIBRARY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing domain-specific standard library');
  const standardLibrary = await ctx.task(standardLibraryTask, {
    domainDescription,
    domainAnalysis,
    syntaxDesign,
    semanticsDefinition,
    outputDir
  });

  artifacts.push(...standardLibrary.artifacts);

  // ============================================================================
  // PHASE 7: USER DOCUMENTATION AND EXAMPLES
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating user documentation and examples');
  const documentation = await ctx.task(dslDocumentationTask, {
    domainDescription,
    domainAnalysis,
    syntaxDesign,
    semanticsDefinition,
    standardLibrary,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 8: DSL SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating complete DSL specification');
  const specificationDocument = await ctx.task(dslSpecificationTask, {
    domainDescription,
    domainAnalysis,
    syntaxDesign,
    semanticsDefinition,
    parserTypeChecker,
    backend,
    standardLibrary,
    documentation,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review DSL design and implementation
  await ctx.breakpoint({
    question: `DSL design complete. Approach: ${implementationApproach}. Review specification and implementation?`,
    title: 'DSL Design and Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        implementationApproach,
        syntaxFeatures: syntaxDesign.keyFeatures?.length || 0,
        libraryFunctions: standardLibrary.functions?.length || 0,
        hasTypeChecker: parserTypeChecker.hasTypeChecker
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    domainDescription,
    dslSpecification: {
      domainAnalysis: domainAnalysis.analysis,
      syntax: syntaxDesign.syntax,
      semantics: semanticsDefinition.semantics,
      specificationDocumentPath: specificationDocument.documentPath
    },
    implementation: {
      approach: implementationApproach,
      hostLanguage,
      parser: parserTypeChecker.parserDescription,
      typeChecker: parserTypeChecker.typeCheckerDescription,
      backend: backend.backendDescription
    },
    standardLibrary: {
      functions: standardLibrary.functions,
      dataTypes: standardLibrary.dataTypes,
      libraryDocumentPath: standardLibrary.libraryDocumentPath
    },
    documentation: {
      userGuidePath: documentation.userGuidePath,
      tutorialPath: documentation.tutorialPath,
      examples: documentation.examples
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/dsl-design-implementation',
      timestamp: startTime,
      implementationApproach,
      hostLanguage,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Domain Analysis
export const domainAnalysisTask = defineTask('domain-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze domain requirements and idioms',
  agent: {
    name: 'semantics-formalist',
    skills: ['grammar-parser-generator', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'domain analysis specialist',
      task: 'Analyze the target domain to identify requirements, idioms, and patterns for the DSL',
      context: args,
      instructions: [
        'Identify core domain concepts and entities',
        'Discover common operations and patterns in the domain',
        'Identify domain-specific idioms and conventions',
        'Analyze existing tools/languages used in the domain',
        'Identify pain points with existing solutions',
        'Define target user personas',
        'Document domain vocabulary (ubiquitous language)',
        'Generate domain analysis report'
      ],
      outputFormat: 'JSON with analysis, coreConcepts, operations, idioms, existingTools, painPoints, vocabulary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'coreConcepts', 'operations', 'artifacts'],
      properties: {
        analysis: { type: 'string' },
        coreConcepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              description: { type: 'string' },
              relationships: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        operations: { type: 'array', items: { type: 'string' } },
        idioms: { type: 'array', items: { type: 'string' } },
        existingTools: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        vocabulary: { type: 'object' },
        targetUsers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'domain-analysis']
}));

// Task 2: Syntax Design
export const syntaxDesignTask = defineTask('syntax-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design DSL syntax for domain expressiveness',
  agent: {
    name: 'semantics-formalist',
    skills: ['grammar-parser-generator', 'lambda-calculus-reducer', 'latex-proof-formatter'],
    prompt: {
      role: 'language syntax designer',
      task: 'Design expressive and intuitive syntax for the DSL',
      context: args,
      instructions: [
        'Design syntax that mirrors domain concepts',
        'Choose between textual, graphical, or hybrid syntax',
        'For embedded DSL: leverage host language features',
        'For standalone DSL: design complete grammar',
        'Prioritize readability for domain experts',
        'Minimize syntactic noise',
        'Support domain idioms naturally',
        'Generate syntax specification with examples'
      ],
      outputFormat: 'JSON with syntax, keyFeatures, grammar, syntaxExamples, designRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['syntax', 'keyFeatures', 'artifacts'],
      properties: {
        syntax: { type: 'string' },
        syntaxType: { type: 'string', enum: ['textual', 'graphical', 'hybrid'] },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        grammar: { type: 'string' },
        syntaxExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              code: { type: 'string' }
            }
          }
        },
        designRationale: { type: 'string' },
        hostLanguageFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'syntax']
}));

// Task 3: Semantics Definition
export const semanticsDefinitionTask = defineTask('semantics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define DSL semantics',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'language semantics specialist',
      task: 'Define precise semantics for the DSL (embedded or standalone)',
      context: args,
      instructions: [
        'For embedded DSL: define translation to host language',
        'For standalone DSL: define operational/denotational semantics',
        'Specify evaluation order and strategy',
        'Define error handling semantics',
        'Handle domain-specific runtime behavior',
        'Consider side effects and state if applicable',
        'Document semantic edge cases',
        'Generate semantics specification'
      ],
      outputFormat: 'JSON with semantics, semanticsType, translationRules, errorHandling, edgeCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['semantics', 'semanticsType', 'artifacts'],
      properties: {
        semantics: { type: 'string' },
        semanticsType: { type: 'string', enum: ['embedded-translation', 'operational', 'denotational'] },
        translationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dslConstruct: { type: 'string' },
              targetCode: { type: 'string' }
            }
          }
        },
        evaluationStrategy: { type: 'string' },
        errorHandling: { type: 'string' },
        stateModel: { type: 'string' },
        edgeCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'semantics']
}));

// Task 4: Parser and Type Checker
export const parserTypeCheckerTask = defineTask('parser-type-checker', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement parser and type checker',
  agent: {
    name: 'compiler-engineer',
    skills: ['grammar-parser-generator', 'type-inference-engine', 'dataflow-analysis-engine'],
    prompt: {
      role: 'language implementation specialist',
      task: 'Design parser and type checker implementation for the DSL',
      context: args,
      instructions: [
        'For embedded DSL: leverage host language parsing',
        'For standalone DSL: design parser (LL, LR, PEG, etc.)',
        'Choose parser generator or hand-written parser',
        'Design AST representation',
        'Implement type checker if DSL is typed',
        'Design error reporting for good UX',
        'Consider IDE integration (LSP)',
        'Generate parser/type checker specification'
      ],
      outputFormat: 'JSON with parserDescription, parserTechnology, astDesign, hasTypeChecker, typeCheckerDescription, errorReporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['parserDescription', 'hasTypeChecker', 'artifacts'],
      properties: {
        parserDescription: { type: 'string' },
        parserTechnology: { type: 'string' },
        parserType: { type: 'string', enum: ['hand-written', 'generated', 'host-language', 'combinator'] },
        astDesign: { type: 'string' },
        hasTypeChecker: { type: 'boolean' },
        typeCheckerDescription: { type: 'string' },
        typeSystem: { type: 'string' },
        errorReporting: { type: 'string' },
        ideIntegration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'parser']
}));

// Task 5: Backend Implementation
export const backendImplementationTask = defineTask('backend-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create compilation/interpretation backend',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'grammar-parser-generator', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'language backend specialist',
      task: 'Design and implement compilation or interpretation backend',
      context: args,
      instructions: [
        'Choose compilation vs interpretation strategy',
        'For embedded DSL: generate host language code/data',
        'For standalone: target host language, VM, or native',
        'Design intermediate representation if needed',
        'Implement code generation/interpretation',
        'Optimize for domain-specific patterns',
        'Consider runtime support requirements',
        'Generate backend specification'
      ],
      outputFormat: 'JSON with backendDescription, strategy, targetPlatform, irDesign, optimizations, runtimeSupport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['backendDescription', 'strategy', 'artifacts'],
      properties: {
        backendDescription: { type: 'string' },
        strategy: { type: 'string', enum: ['compilation', 'interpretation', 'hybrid'] },
        targetPlatform: { type: 'string' },
        irDesign: { type: 'string' },
        codeGeneration: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        runtimeSupport: { type: 'string' },
        performanceConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'backend']
}));

// Task 6: Standard Library
export const standardLibraryTask = defineTask('standard-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop domain-specific standard library',
  agent: {
    name: 'semantics-formalist',
    skills: ['lambda-calculus-reducer', 'type-inference-engine', 'latex-proof-formatter'],
    prompt: {
      role: 'library design specialist',
      task: 'Develop standard library with domain-specific functionality',
      context: args,
      instructions: [
        'Identify essential domain functions',
        'Define domain-specific data types',
        'Create utility functions for common operations',
        'Design consistent API style',
        'Provide sensible defaults',
        'Include common domain algorithms',
        'Document all library components',
        'Generate standard library specification'
      ],
      outputFormat: 'JSON with functions, dataTypes, utilities, apiStyle, libraryDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functions', 'dataTypes', 'artifacts'],
      properties: {
        functions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              signature: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        dataTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              operations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        utilities: { type: 'array', items: { type: 'string' } },
        apiStyle: { type: 'string' },
        libraryDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'standard-library']
}));

// Task 7: Documentation
export const dslDocumentationTask = defineTask('dsl-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create user documentation and examples',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'grammar-parser-generator'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Create comprehensive user documentation and examples',
      context: args,
      instructions: [
        'Write getting started guide',
        'Create language reference documentation',
        'Develop tutorial with progressive examples',
        'Document standard library functions',
        'Provide real-world use case examples',
        'Include FAQ and troubleshooting',
        'Create quick reference card',
        'Generate documentation package'
      ],
      outputFormat: 'JSON with userGuidePath, tutorialPath, referencePath, examples, faq, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['userGuidePath', 'examples', 'artifacts'],
      properties: {
        userGuidePath: { type: 'string' },
        tutorialPath: { type: 'string' },
        referencePath: { type: 'string' },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              code: { type: 'string' },
              output: { type: 'string' }
            }
          }
        },
        faq: { type: 'array', items: { type: 'string' } },
        quickReference: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'documentation']
}));

// Task 8: DSL Specification Document
export const dslSpecificationTask = defineTask('dsl-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate complete DSL specification',
  agent: {
    name: 'semantics-formalist',
    skills: ['latex-proof-formatter', 'grammar-parser-generator', 'lambda-calculus-reducer'],
    prompt: {
      role: 'language specification specialist',
      task: 'Generate comprehensive DSL specification document',
      context: args,
      instructions: [
        'Create executive summary of DSL',
        'Document domain analysis and rationale',
        'Include complete syntax specification',
        'Present formal semantics',
        'Document implementation architecture',
        'Include standard library reference',
        'Provide usage guidelines',
        'Format as professional language specification'
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
        implementationStatus: { type: 'string' },
        futureWork: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dsl', 'specification']
}));
