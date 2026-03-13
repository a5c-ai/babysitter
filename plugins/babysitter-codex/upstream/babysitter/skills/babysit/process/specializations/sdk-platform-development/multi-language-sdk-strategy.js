/**
 * @process specializations/sdk-platform-development/multi-language-sdk-strategy
 * @description Multi-Language SDK Strategy - Define strategy for supporting multiple programming languages with consistent
 * features, evaluating handwritten vs generated SDK tradeoffs, and establishing language-specific idiom guidelines.
 * @inputs { projectName: string, targetLanguages: array, apiSpecPath?: string, featureParity?: object, generationStrategy?: string }
 * @outputs { success: boolean, strategy: object, languageGuidelines: array, codeGenConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/multi-language-sdk-strategy', {
 *   projectName: 'CloudAPI SDK',
 *   targetLanguages: ['typescript', 'python', 'go', 'java', 'csharp'],
 *   apiSpecPath: './openapi.yaml',
 *   featureParity: { core: true, advanced: 'per-language' },
 *   generationStrategy: 'hybrid'
 * });
 *
 * @references
 * - Azure SDK Guidelines: https://azure.github.io/azure-sdk/
 * - OpenAPI Generator: https://openapi-generator.tech/
 * - Smithy: https://smithy.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetLanguages = ['typescript', 'python', 'go'],
    apiSpecPath = '',
    featureParity = { core: true, advanced: 'per-language' },
    generationStrategy = 'hybrid',
    outputDir = 'multi-language-strategy'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Language SDK Strategy: ${projectName}`);
  ctx.log('info', `Target Languages: ${targetLanguages.join(', ')}`);
  ctx.log('info', `Generation Strategy: ${generationStrategy}`);

  // ============================================================================
  // PHASE 1: LANGUAGE ECOSYSTEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing target language ecosystems');

  const ecosystemAnalysis = await ctx.task(ecosystemAnalysisTask, {
    projectName,
    targetLanguages,
    outputDir
  });

  artifacts.push(...ecosystemAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: GENERATION STRATEGY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Evaluating handwritten vs generated SDK tradeoffs');

  const strategyEvaluation = await ctx.task(strategyEvaluationTask, {
    projectName,
    targetLanguages,
    generationStrategy,
    apiSpecPath,
    ecosystemAnalysis,
    outputDir
  });

  artifacts.push(...strategyEvaluation.artifacts);

  // ============================================================================
  // PHASE 3: CODE GENERATION PIPELINE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing code generation pipeline');

  const codeGenPipeline = await ctx.task(codeGenPipelineTask, {
    projectName,
    targetLanguages,
    apiSpecPath,
    strategyEvaluation,
    outputDir
  });

  artifacts.push(...codeGenPipeline.artifacts);

  // ============================================================================
  // PHASE 4: LANGUAGE-SPECIFIC IDIOM GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 4: Establishing language-specific idiom guidelines');

  const languageGuidelinesTasks = targetLanguages.map(lang =>
    () => ctx.task(languageIdiomTask, {
      projectName,
      language: lang,
      ecosystemAnalysis,
      outputDir
    })
  );

  const languageGuidelines = await ctx.parallel.all(languageGuidelinesTasks);
  artifacts.push(...languageGuidelines.flatMap(g => g.artifacts));

  // Quality Gate: Strategy Review
  await ctx.breakpoint({
    question: `Multi-language strategy defined for ${projectName}. Languages: ${targetLanguages.length}, Generation approach: ${strategyEvaluation.recommendedApproach}. Approve strategy?`,
    title: 'Multi-Language Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetLanguages,
      recommendedApproach: strategyEvaluation.recommendedApproach,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: FEATURE PARITY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning feature parity across languages');

  const featureParityPlan = await ctx.task(featureParityTask, {
    projectName,
    targetLanguages,
    featureParity,
    languageGuidelines,
    outputDir
  });

  artifacts.push(...featureParityPlan.artifacts);

  // ============================================================================
  // PHASE 6: TESTING STRATEGY PER LANGUAGE
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining testing strategy per language');

  const testingStrategy = await ctx.task(testingStrategyTask, {
    projectName,
    targetLanguages,
    ecosystemAnalysis,
    outputDir
  });

  artifacts.push(...testingStrategy.artifacts);

  // ============================================================================
  // PHASE 7: RELEASE COORDINATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning release coordination across languages');

  const releaseCoordination = await ctx.task(releaseCoordinationTask, {
    projectName,
    targetLanguages,
    codeGenPipeline,
    outputDir
  });

  artifacts.push(...releaseCoordination.artifacts);

  // ============================================================================
  // PHASE 8: STRATEGY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating strategy documentation');

  const documentation = await ctx.task(strategyDocumentationTask, {
    projectName,
    ecosystemAnalysis,
    strategyEvaluation,
    codeGenPipeline,
    languageGuidelines,
    featureParityPlan,
    testingStrategy,
    releaseCoordination,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    strategy: {
      approach: strategyEvaluation.recommendedApproach,
      rationale: strategyEvaluation.rationale,
      tradeoffs: strategyEvaluation.tradeoffs
    },
    languageGuidelines: languageGuidelines.map(g => ({
      language: g.language,
      idioms: g.idioms,
      conventions: g.conventions
    })),
    codeGenConfig: {
      pipeline: codeGenPipeline.pipeline,
      templates: codeGenPipeline.templates,
      customizations: codeGenPipeline.customizations
    },
    featureParity: featureParityPlan.matrix,
    testingStrategy: testingStrategy.perLanguage,
    releaseCoordination: releaseCoordination.plan,
    documentation: {
      strategyDoc: documentation.strategyDocPath,
      languageGuides: documentation.languageGuidePaths
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/multi-language-sdk-strategy',
      timestamp: startTime,
      targetLanguages,
      generationStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const ecosystemAnalysisTask = defineTask('ecosystem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Language Ecosystem Analysis - ${args.projectName}`,
  agent: {
    name: 'cross-language-consistency-agent',
    prompt: {
      role: 'Multi-Language SDK Strategist',
      task: 'Analyze target language ecosystems and community standards',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze package managers and distribution channels per language',
        '2. Identify popular SDK patterns and conventions per language',
        '3. Evaluate async/await and concurrency patterns',
        '4. Assess error handling conventions per language',
        '5. Analyze type system capabilities',
        '6. Identify testing frameworks and conventions',
        '7. Evaluate documentation standards',
        '8. Assess community expectations for SDKs',
        '9. Identify dependency management best practices',
        '10. Generate ecosystem analysis report'
      ],
      outputFormat: 'JSON with ecosystem analysis per language'
    },
    outputSchema: {
      type: 'object',
      required: ['ecosystems', 'artifacts'],
      properties: {
        ecosystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              packageManager: { type: 'string' },
              sdkPatterns: { type: 'array', items: { type: 'string' } },
              typeSystem: { type: 'string' },
              asyncModel: { type: 'string' }
            }
          }
        },
        commonPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'ecosystem-analysis']
}));

export const strategyEvaluationTask = defineTask('strategy-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Generation Strategy Evaluation - ${args.projectName}`,
  agent: {
    name: 'cross-language-consistency-agent',
    prompt: {
      role: 'SDK Generation Strategist',
      task: 'Evaluate handwritten vs generated SDK tradeoffs',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        generationStrategy: args.generationStrategy,
        apiSpecPath: args.apiSpecPath,
        ecosystemAnalysis: args.ecosystemAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate handwritten SDK approach (pros, cons, effort)',
        '2. Evaluate fully generated SDK approach',
        '3. Evaluate hybrid approach (generated base + handwritten layers)',
        '4. Assess maintenance burden for each approach',
        '5. Evaluate consistency vs idiomaticity tradeoffs',
        '6. Consider team skills and resources',
        '7. Assess API stability and change frequency',
        '8. Evaluate time-to-market requirements',
        '9. Recommend optimal approach per language',
        '10. Document strategy evaluation'
      ],
      outputFormat: 'JSON with strategy evaluation and recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedApproach', 'tradeoffs', 'artifacts'],
      properties: {
        recommendedApproach: { type: 'string', enum: ['handwritten', 'generated', 'hybrid'] },
        rationale: { type: 'string' },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' }
            }
          }
        },
        perLanguageRecommendation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'strategy-evaluation']
}));

export const codeGenPipelineTask = defineTask('codegen-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Code Generation Pipeline - ${args.projectName}`,
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'SDK Code Generation Engineer',
      task: 'Design code generation pipeline from API specifications',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        apiSpecPath: args.apiSpecPath,
        strategyEvaluation: args.strategyEvaluation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select code generation tools (OpenAPI Generator, Smithy, custom)',
        '2. Design template customization approach',
        '3. Plan post-generation processing for idiomatic code',
        '4. Configure language-specific generators',
        '5. Design validation and linting for generated code',
        '6. Plan CI/CD integration for SDK regeneration',
        '7. Design breaking change detection',
        '8. Plan generated vs handwritten code boundaries',
        '9. Configure documentation generation',
        '10. Document code generation pipeline'
      ],
      outputFormat: 'JSON with code generation pipeline design'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'templates', 'artifacts'],
      properties: {
        pipeline: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            stages: { type: 'array', items: { type: 'string' } },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              templatePath: { type: 'string' },
              customizations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        customizations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'code-generation']
}));

export const languageIdiomTask = defineTask('language-idiom', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Language Idiom Guidelines - ${args.language}`,
  agent: {
    name: 'cross-language-consistency-agent',
    prompt: {
      role: `${args.language} SDK Specialist`,
      task: `Establish ${args.language}-specific idiom guidelines`,
      context: {
        projectName: args.projectName,
        language: args.language,
        ecosystemAnalysis: args.ecosystemAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Define naming conventions for ${args.language}`,
        '2. Establish error handling patterns',
        '3. Define async/await usage patterns',
        '4. Establish type usage and generics patterns',
        '5. Define builder pattern vs fluent API usage',
        '6. Establish resource management patterns',
        '7. Define logging and debugging patterns',
        '8. Establish testing patterns',
        '9. Define documentation patterns (docstrings, etc.)',
        '10. Document language idiom guidelines'
      ],
      outputFormat: 'JSON with language-specific guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'idioms', 'conventions', 'artifacts'],
      properties: {
        language: { type: 'string' },
        idioms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              usage: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        conventions: {
          type: 'object',
          properties: {
            naming: { type: 'object' },
            errorHandling: { type: 'string' },
            asyncPattern: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'idioms', args.language]
}));

export const featureParityTask = defineTask('feature-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Feature Parity Planning - ${args.projectName}`,
  agent: {
    name: 'cross-language-consistency-agent',
    prompt: {
      role: 'SDK Feature Parity Planner',
      task: 'Plan feature parity across all target languages',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        featureParity: args.featureParity,
        languageGuidelines: args.languageGuidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define core features required in all languages',
        '2. Identify language-specific feature variations',
        '3. Plan feature rollout timeline per language',
        '4. Define feature parity testing criteria',
        '5. Identify features that cannot be implemented identically',
        '6. Plan alternative implementations for non-portable features',
        '7. Define feature documentation requirements',
        '8. Plan cross-language consistency testing',
        '9. Create feature parity matrix',
        '10. Document feature parity plan'
      ],
      outputFormat: 'JSON with feature parity plan'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'artifacts'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              category: { type: 'string' },
              languages: { type: 'object' }
            }
          }
        },
        coreFeatures: { type: 'array', items: { type: 'string' } },
        languageSpecific: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'feature-parity']
}));

export const testingStrategyTask = defineTask('testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Testing Strategy Per Language - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'SDK Testing Architect',
      task: 'Define testing strategy per target language',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        ecosystemAnalysis: args.ecosystemAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define unit testing framework per language',
        '2. Plan integration testing approach',
        '3. Design contract testing strategy',
        '4. Plan cross-language consistency tests',
        '5. Define coverage requirements',
        '6. Plan mock/stub strategies per language',
        '7. Design performance benchmarking',
        '8. Plan compatibility testing matrix',
        '9. Define CI/CD testing pipeline',
        '10. Document testing strategy'
      ],
      outputFormat: 'JSON with testing strategy per language'
    },
    outputSchema: {
      type: 'object',
      required: ['perLanguage', 'artifacts'],
      properties: {
        perLanguage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              framework: { type: 'string' },
              coverageTarget: { type: 'number' },
              mockStrategy: { type: 'string' }
            }
          }
        },
        crossLanguageTests: { type: 'array', items: { type: 'string' } },
        contractTests: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'testing']
}));

export const releaseCoordinationTask = defineTask('release-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Release Coordination Planning - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'SDK Release Manager',
      task: 'Plan release coordination across all target languages',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        codeGenPipeline: args.codeGenPipeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define versioning strategy (synchronized vs independent)',
        '2. Plan release scheduling and cadence',
        '3. Design changelog coordination',
        '4. Plan package registry publishing per language',
        '5. Define release testing requirements',
        '6. Plan announcement and communication',
        '7. Design rollback procedures per language',
        '8. Plan deprecation coordination',
        '9. Define release automation',
        '10. Document release coordination plan'
      ],
      outputFormat: 'JSON with release coordination plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            versioningStrategy: { type: 'string' },
            cadence: { type: 'string' },
            coordination: { type: 'string' }
          }
        },
        perLanguageRelease: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              registry: { type: 'string' },
              automation: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'release-management']
}));

export const strategyDocumentationTask = defineTask('strategy-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Strategy Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'SDK Technical Writer',
      task: 'Generate comprehensive multi-language strategy documentation',
      context: {
        projectName: args.projectName,
        ecosystemAnalysis: args.ecosystemAnalysis,
        strategyEvaluation: args.strategyEvaluation,
        codeGenPipeline: args.codeGenPipeline,
        languageGuidelines: args.languageGuidelines,
        featureParityPlan: args.featureParityPlan,
        testingStrategy: args.testingStrategy,
        releaseCoordination: args.releaseCoordination,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create multi-language strategy overview',
        '2. Document generation approach and rationale',
        '3. Create language-specific implementation guides',
        '4. Document feature parity matrix',
        '5. Create testing guidelines per language',
        '6. Document release coordination procedures',
        '7. Create contributor guidelines per language',
        '8. Document code generation pipeline',
        '9. Create troubleshooting guide',
        '10. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyDocPath', 'languageGuidePaths', 'artifacts'],
      properties: {
        strategyDocPath: { type: 'string' },
        languageGuidePaths: { type: 'array', items: { type: 'string' } },
        featureMatrixPath: { type: 'string' },
        releaseGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'multi-language', 'documentation']
}));
