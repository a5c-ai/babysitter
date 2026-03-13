/**
 * @process domains/science/scientific-discovery/experiment-as-compiler-thinking
 * @description Experiment as Compiler Thinking: See experiments as compilers from hypothesis to data language
 * @inputs {
 *   hypothesis: string,
 *   experimentDesign: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   compilationAnalysis: object,
 *   translationRules: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hypothesis,
    experimentDesign = '',
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze Hypothesis Language
  ctx.log('info', 'Analyzing hypothesis language structure');
  const hypothesisLanguage = await ctx.task(analyzeHypothesisLanguageTask, {
    hypothesis,
    domain
  });

  // Phase 2: Analyze Data Language
  ctx.log('info', 'Analyzing data language structure');
  const dataLanguage = await ctx.task(analyzeDataLanguageTask, {
    experimentDesign,
    domain
  });

  // Phase 3: Define Compilation Rules
  ctx.log('info', 'Defining compilation rules from hypothesis to data');
  const compilationRules = await ctx.task(defineCompilationRulesTask, {
    hypothesisLanguage,
    dataLanguage,
    domain
  });

  await ctx.breakpoint({
    question: 'Compilation rules defined. Review before analysis?',
    title: 'Experiment as Compiler - Rules Defined',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/hypothesis-language.json', format: 'json' },
        { path: 'artifacts/data-language.json', format: 'json' },
        { path: 'artifacts/compilation-rules.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Analyze Compilation Process
  ctx.log('info', 'Analyzing the compilation process');
  const compilationAnalysis = await ctx.task(analyzeCompilationTask, {
    hypothesis,
    hypothesisLanguage,
    dataLanguage,
    compilationRules,
    experimentDesign,
    domain
  });

  // Phase 5: Identify Information Loss
  ctx.log('info', 'Identifying information loss in compilation');
  const informationLoss = await ctx.task(analyzeInformationLossTask, {
    compilationAnalysis,
    hypothesisLanguage,
    dataLanguage,
    domain
  });

  // Phase 6: Analyze Inverse Compilation (Data to Hypothesis)
  ctx.log('info', 'Analyzing inverse compilation');
  const inverseCompilation = await ctx.task(analyzeInverseCompilationTask, {
    compilationRules,
    dataLanguage,
    hypothesisLanguage,
    informationLoss,
    domain
  });

  // Phase 7: Optimize Experiment as Compiler
  ctx.log('info', 'Optimizing experiment as compiler');
  const optimizedCompiler = await ctx.task(optimizeCompilerTask, {
    compilationAnalysis,
    informationLoss,
    inverseCompilation,
    domain
  });

  // Phase 8: Synthesize Insights
  ctx.log('info', 'Synthesizing experiment-as-compiler insights');
  const synthesis = await ctx.task(synthesizeCompilerInsightsTask, {
    hypothesis,
    hypothesisLanguage,
    dataLanguage,
    compilationRules,
    compilationAnalysis,
    informationLoss,
    inverseCompilation,
    optimizedCompiler,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/experiment-as-compiler-thinking',
    hypothesis,
    domain,
    hypothesisLanguage,
    dataLanguage,
    translationRules: compilationRules.rules,
    compilationAnalysis,
    informationLoss,
    inverseCompilation,
    optimizedCompiler,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      hypothesisTerms: hypothesisLanguage.terms?.length || 0,
      dataTerms: dataLanguage.terms?.length || 0,
      compilationRulesCount: compilationRules.rules?.length || 0,
      informationPreserved: 100 - (informationLoss.percentage || 0),
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeHypothesisLanguageTask = defineTask('analyze-hypothesis-language', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Hypothesis Language',
  agent: {
    name: 'hypothesis-linguist',
    prompt: {
      role: 'formal language analyst',
      task: 'Analyze the formal structure of the hypothesis language',
      context: args,
      instructions: [
        'Identify the terms and concepts in the hypothesis',
        'Map the grammar and syntax of hypothesis statements',
        'Identify quantifiers and logical operators',
        'Document semantic relationships between terms',
        'Identify the expressiveness of the hypothesis language',
        'Map constraints and assumptions',
        'Create formal representation of hypothesis language'
      ],
      outputFormat: 'JSON with terms, grammar, semantics, formal representation'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'grammar', 'semantics'],
      properties: {
        terms: { type: 'array', items: { type: 'object' } },
        grammar: { type: 'object' },
        logicalStructure: { type: 'object' },
        semantics: { type: 'object' },
        quantifiers: { type: 'array', items: { type: 'string' } },
        expressiveness: { type: 'string' },
        formalRepresentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'hypothesis-language']
}));

export const analyzeDataLanguageTask = defineTask('analyze-data-language', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Data Language',
  agent: {
    name: 'data-linguist',
    prompt: {
      role: 'data representation analyst',
      task: 'Analyze the formal structure of the data language',
      context: args,
      instructions: [
        'Identify the data types and structures',
        'Map the syntax of data representations',
        'Identify measurement scales and units',
        'Document data relationships and constraints',
        'Identify the expressiveness of the data language',
        'Map noise and uncertainty representations',
        'Create formal representation of data language'
      ],
      outputFormat: 'JSON with data types, structures, scales, formal representation'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'structures', 'scales'],
      properties: {
        terms: { type: 'array', items: { type: 'object' } },
        structures: { type: 'array', items: { type: 'object' } },
        scales: { type: 'array', items: { type: 'object' } },
        units: { type: 'array', items: { type: 'string' } },
        noiseRepresentation: { type: 'object' },
        expressiveness: { type: 'string' },
        formalRepresentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'data-language']
}));

export const defineCompilationRulesTask = defineTask('define-compilation-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Compilation Rules',
  agent: {
    name: 'compilation-rule-designer',
    prompt: {
      role: 'compiler designer',
      task: 'Define rules for compiling hypothesis language to data language',
      context: args,
      instructions: [
        'Map hypothesis terms to data observables',
        'Define transformation rules',
        'Specify operationalization of theoretical terms',
        'Document measurement protocols as compilation steps',
        'Handle abstract concepts with no direct data mapping',
        'Define type conversions and coercions',
        'Document compilation edge cases'
      ],
      outputFormat: 'JSON with compilation rules, mappings, protocols'
    },
    outputSchema: {
      type: 'object',
      required: ['rules'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisTerm: { type: 'string' },
              dataTarget: { type: 'string' },
              transformation: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              fidelity: { type: 'number' }
            }
          }
        },
        operationalizations: { type: 'array', items: { type: 'object' } },
        typeConversions: { type: 'array', items: { type: 'object' } },
        unmappableTerms: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'compilation-rules']
}));

export const analyzeCompilationTask = defineTask('analyze-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Compilation Process',
  agent: {
    name: 'compilation-analyst',
    prompt: {
      role: 'compiler analysis specialist',
      task: 'Analyze the compilation from hypothesis to data',
      context: args,
      instructions: [
        'Trace the compilation of the specific hypothesis',
        'Identify compilation stages and transformations',
        'Document what is preserved in compilation',
        'Identify what is added (experimental artifacts)',
        'Analyze compilation efficiency',
        'Identify compilation bottlenecks',
        'Document the compiled form (expected data)'
      ],
      outputFormat: 'JSON with compilation trace, preserved, added, compiled form'
    },
    outputSchema: {
      type: 'object',
      required: ['compilationTrace', 'preservedInformation', 'compiledForm'],
      properties: {
        compilationTrace: { type: 'array', items: { type: 'object' } },
        stages: { type: 'array', items: { type: 'object' } },
        preservedInformation: { type: 'array', items: { type: 'string' } },
        addedArtifacts: { type: 'array', items: { type: 'string' } },
        efficiency: { type: 'string' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        compiledForm: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'analysis']
}));

export const analyzeInformationLossTask = defineTask('analyze-information-loss', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Information Loss',
  agent: {
    name: 'information-loss-analyst',
    prompt: {
      role: 'information theory specialist',
      task: 'Analyze information loss in the compilation process',
      context: args,
      instructions: [
        'Identify information lost in compilation',
        'Quantify the degree of information loss',
        'Identify which hypothesis aspects are lost',
        'Analyze irreversible transformations',
        'Identify sources of information loss',
        'Assess impact of loss on hypothesis testing',
        'Suggest ways to minimize information loss'
      ],
      outputFormat: 'JSON with lost information, quantification, sources, mitigations'
    },
    outputSchema: {
      type: 'object',
      required: ['lostInformation', 'percentage'],
      properties: {
        lostInformation: { type: 'array', items: { type: 'object' } },
        percentage: { type: 'number' },
        lostAspects: { type: 'array', items: { type: 'string' } },
        irreversibleTransformations: { type: 'array', items: { type: 'object' } },
        lossSources: { type: 'array', items: { type: 'string' } },
        impactOnTesting: { type: 'string' },
        mitigations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'information-loss']
}));

export const analyzeInverseCompilationTask = defineTask('analyze-inverse-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Inverse Compilation',
  agent: {
    name: 'decompilation-analyst',
    prompt: {
      role: 'inverse problem specialist',
      task: 'Analyze the decompilation from data back to hypotheses',
      context: args,
      instructions: [
        'Analyze how data can be decompiled to hypotheses',
        'Identify the inverse rules',
        'Document degeneracies (multiple hypotheses same data)',
        'Analyze what data patterns support/refute hypotheses',
        'Identify ambiguities in decompilation',
        'Assess decompilation fidelity',
        'Map the hypothesis space consistent with data'
      ],
      outputFormat: 'JSON with inverse rules, degeneracies, ambiguities, hypothesis space'
    },
    outputSchema: {
      type: 'object',
      required: ['inverseRules', 'degeneracies'],
      properties: {
        inverseRules: { type: 'array', items: { type: 'object' } },
        degeneracies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataPattern: { type: 'string' },
              consistentHypotheses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ambiguities: { type: 'array', items: { type: 'string' } },
        decompilationFidelity: { type: 'number' },
        hypothesisSpace: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'inverse']
}));

export const optimizeCompilerTask = defineTask('optimize-compiler', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize Experiment as Compiler',
  agent: {
    name: 'compiler-optimizer',
    prompt: {
      role: 'compiler optimization specialist',
      task: 'Optimize the experiment design for better compilation',
      context: args,
      instructions: [
        'Suggest experiment modifications to reduce information loss',
        'Propose additional measurements for better fidelity',
        'Recommend ways to resolve decompilation ambiguities',
        'Optimize for hypothesis discrimination power',
        'Suggest ways to make compilation more efficient',
        'Propose alternative compilation strategies',
        'Create optimized experiment design'
      ],
      outputFormat: 'JSON with optimizations, recommendations, optimized design'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'optimizedDesign'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        additionalMeasurements: { type: 'array', items: { type: 'object' } },
        ambiguityResolutions: { type: 'array', items: { type: 'object' } },
        discriminationImprovements: { type: 'array', items: { type: 'string' } },
        efficiencyImprovements: { type: 'array', items: { type: 'string' } },
        alternativeStrategies: { type: 'array', items: { type: 'object' } },
        optimizedDesign: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'optimization']
}));

export const synthesizeCompilerInsightsTask = defineTask('synthesize-compiler-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Experiment-as-Compiler Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'philosophy of science specialist',
      task: 'Synthesize insights from experiment-as-compiler analysis',
      context: args,
      instructions: [
        'Summarize key findings from compiler analysis',
        'Extract principles for experiment design',
        'Document implications for hypothesis testing',
        'Discuss the compiler metaphor value and limitations',
        'Provide recommendations for future experiments',
        'Note epistemological implications',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, implications'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        testingImplications: { type: 'array', items: { type: 'string' } },
        metaphorValue: { type: 'string' },
        metaphorLimitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        epistemologicalImplications: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-compiler', 'synthesis']
}));
