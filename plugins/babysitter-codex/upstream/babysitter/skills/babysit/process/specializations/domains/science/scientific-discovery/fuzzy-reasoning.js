/**
 * @process scientific-discovery/fuzzy-reasoning
 * @description Truth as degree (0-1) because predicates have blurred boundaries - reasoning with vagueness
 * @inputs { linguisticVariables: array, fuzzyRules: array, crispInputs: object, defuzzificationMethod: string, outputDir: string }
 * @outputs { success: boolean, fuzzyOutputs: object, defuzzifiedOutputs: object, inferenceTrace: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    linguisticVariables = [],
    fuzzyRules = [],
    crispInputs = {},
    defuzzificationMethod = 'centroid',
    outputDir = 'fuzzy-reasoning-output',
    tNorm = 'minimum',
    sNorm = 'maximum'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Fuzzy Reasoning Process');

  // ============================================================================
  // PHASE 1: LINGUISTIC VARIABLE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining linguistic variables and membership functions');
  const variableDefinition = await ctx.task(linguisticVariableTask, {
    linguisticVariables,
    outputDir
  });

  artifacts.push(...variableDefinition.artifacts);

  // ============================================================================
  // PHASE 2: FUZZIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Fuzzifying crisp inputs');
  const fuzzification = await ctx.task(fuzzificationTask, {
    crispInputs,
    membershipFunctions: variableDefinition.membershipFunctions,
    outputDir
  });

  artifacts.push(...fuzzification.artifacts);

  // ============================================================================
  // PHASE 3: FUZZY RULE BASE
  // ============================================================================

  ctx.log('info', 'Phase 3: Processing fuzzy rule base');
  const ruleProcessing = await ctx.task(fuzzyRuleProcessingTask, {
    fuzzyRules,
    linguisticVariables: variableDefinition.variables,
    outputDir
  });

  artifacts.push(...ruleProcessing.artifacts);

  // ============================================================================
  // PHASE 4: FUZZY INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 4: Performing fuzzy inference');
  const inference = await ctx.task(fuzzyInferenceTask, {
    fuzzifiedInputs: fuzzification.fuzzifiedValues,
    processedRules: ruleProcessing.rules,
    tNorm,
    sNorm,
    outputDir
  });

  artifacts.push(...inference.artifacts);

  // ============================================================================
  // PHASE 5: AGGREGATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Aggregating rule outputs');
  const aggregation = await ctx.task(fuzzyAggregationTask, {
    ruleOutputs: inference.ruleOutputs,
    sNorm,
    outputDir
  });

  artifacts.push(...aggregation.artifacts);

  // ============================================================================
  // PHASE 6: DEFUZZIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defuzzifying to crisp outputs');
  const defuzzification = await ctx.task(defuzzificationTask, {
    aggregatedOutput: aggregation.aggregatedMembership,
    defuzzificationMethod,
    outputDir
  });

  artifacts.push(...defuzzification.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reasoning quality');
  const qualityScore = await ctx.task(fuzzyQualityTask, {
    variableDefinition,
    fuzzification,
    inference,
    defuzzification,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review fuzzy reasoning results
  await ctx.breakpoint({
    question: `Fuzzy reasoning complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Review membership functions and rules.'} Review results?`,
    title: 'Fuzzy Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        variablesCount: linguisticVariables.length,
        rulesCount: fuzzyRules.length,
        rulesFired: inference.rulesFired,
        defuzzificationMethod,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const report = await ctx.task(fuzzyReportTask, {
    variableDefinition,
    fuzzification,
    inference,
    aggregation,
    defuzzification,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fuzzyOutputs: aggregation.aggregatedMembership,
    defuzzifiedOutputs: defuzzification.crispOutputs,
    inferenceTrace: inference.trace,
    membershipDegrees: fuzzification.fuzzifiedValues,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/fuzzy-reasoning',
      timestamp: startTime,
      outputDir,
      defuzzificationMethod,
      tNorm,
      sNorm
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Linguistic Variable Definition
export const linguisticVariableTask = defineTask('linguistic-variable', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define linguistic variables and membership functions',
  agent: {
    name: 'fuzzy-variable-agent',
    prompt: {
      role: 'fuzzy systems expert',
      task: 'Define linguistic variables with appropriate membership functions',
      context: args,
      instructions: [
        'For each linguistic variable, define its universe of discourse',
        'Define fuzzy sets (terms) for each variable (e.g., low, medium, high)',
        'Specify membership function type for each term (triangular, trapezoidal, Gaussian)',
        'Define membership function parameters',
        'Ensure coverage: every point in universe has membership in at least one set',
        'Ensure overlap between adjacent fuzzy sets',
        'Validate membership functions are proper (values in [0,1])',
        'Document semantic meaning of each fuzzy set',
        'Save variable definitions to output directory'
      ],
      outputFormat: 'JSON with variables (array), membershipFunctions (object), universeOfDiscourse (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'membershipFunctions', 'artifacts'],
      properties: {
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              universe: { type: 'object' },
              terms: { type: 'array' }
            }
          }
        },
        membershipFunctions: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                parameters: { type: 'object' }
              }
            }
          }
        },
        universeOfDiscourse: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
              resolution: { type: 'number' }
            }
          }
        },
        coverageValidated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'variables']
}));

// Task 2: Fuzzification
export const fuzzificationTask = defineTask('fuzzification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fuzzify crisp inputs to membership degrees',
  agent: {
    name: 'fuzzification-agent',
    prompt: {
      role: 'fuzzy inference specialist',
      task: 'Convert crisp input values to fuzzy membership degrees',
      context: args,
      instructions: [
        'For each crisp input value, compute membership degree in each fuzzy set',
        'Apply membership function: mu_A(x) for value x in set A',
        'Membership degree is in [0, 1]',
        'A value can have non-zero membership in multiple sets',
        'Record all membership degrees for each input',
        'Handle out-of-range inputs appropriately',
        'Validate fuzzification results',
        'Generate fuzzification visualization',
        'Save fuzzified values to output directory'
      ],
      outputFormat: 'JSON with fuzzifiedValues (object), membershipMatrix (object), visualization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fuzzifiedValues', 'artifacts'],
      properties: {
        fuzzifiedValues: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        },
        membershipMatrix: {
          type: 'object',
          additionalProperties: { type: 'object' }
        },
        inputsProcessed: { type: 'number' },
        outOfRangeInputs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'fuzzification']
}));

// Task 3: Fuzzy Rule Processing
export const fuzzyRuleProcessingTask = defineTask('fuzzy-rule-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process and validate fuzzy rule base',
  agent: {
    name: 'fuzzy-rule-agent',
    prompt: {
      role: 'fuzzy rule base engineer',
      task: 'Process and validate the fuzzy rule base',
      context: args,
      instructions: [
        'Parse fuzzy rules of form: IF x is A AND y is B THEN z is C',
        'Identify antecedent (IF part) and consequent (THEN part)',
        'Handle AND (conjunction) and OR (disjunction) in antecedents',
        'Validate rules reference defined linguistic variables and terms',
        'Check rule base completeness (coverage of input space)',
        'Identify redundant or conflicting rules',
        'Assign rule weights if specified',
        'Document rule semantics',
        'Save processed rules to output directory'
      ],
      outputFormat: 'JSON with rules (array), ruleStructure (object), completenessAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'ruleStructure', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              antecedent: { type: 'object' },
              consequent: { type: 'object' },
              weight: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        ruleStructure: {
          type: 'object',
          properties: {
            totalRules: { type: 'number' },
            inputVariables: { type: 'array' },
            outputVariables: { type: 'array' }
          }
        },
        completenessAnalysis: {
          type: 'object',
          properties: {
            isComplete: { type: 'boolean' },
            uncoveredRegions: { type: 'array' },
            redundantRules: { type: 'array' }
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
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'rules']
}));

// Task 4: Fuzzy Inference
export const fuzzyInferenceTask = defineTask('fuzzy-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform fuzzy inference',
  agent: {
    name: 'fuzzy-inference-agent',
    prompt: {
      role: 'fuzzy inference engine specialist',
      task: 'Execute fuzzy inference using fuzzified inputs and rule base',
      context: args,
      instructions: [
        'For each rule, compute antecedent activation strength',
        'Apply t-norm for AND: min (or product) of membership degrees',
        'Apply s-norm for OR: max (or probabilistic sum) of membership degrees',
        'Apply implication: clip or scale consequent by activation strength',
        'Use Mamdani or Sugeno inference method as appropriate',
        'Track which rules fire (activation > 0)',
        'Generate inference trace showing rule evaluations',
        'Compute rule output fuzzy sets',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with ruleOutputs (array), rulesFired (number), trace (array), activationStrengths (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ruleOutputs', 'rulesFired', 'trace', 'artifacts'],
      properties: {
        ruleOutputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'string' },
              activation: { type: 'number' },
              outputFuzzySet: { type: 'object' }
            }
          }
        },
        rulesFired: { type: 'number' },
        trace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              rule: { type: 'string' },
              antecedentEvaluation: { type: 'object' },
              activation: { type: 'number' }
            }
          }
        },
        activationStrengths: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        inferenceMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'inference']
}));

// Task 5: Fuzzy Aggregation
export const fuzzyAggregationTask = defineTask('fuzzy-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate fuzzy rule outputs',
  agent: {
    name: 'fuzzy-aggregation-agent',
    prompt: {
      role: 'fuzzy aggregation specialist',
      task: 'Aggregate multiple rule outputs into single fuzzy output',
      context: args,
      instructions: [
        'Combine all rule output fuzzy sets for each output variable',
        'Apply aggregation operator (typically max/s-norm)',
        'Create aggregated membership function',
        'Handle multiple output variables separately',
        'Visualize aggregated fuzzy output',
        'Validate aggregated output is proper fuzzy set',
        'Document aggregation method used',
        'Save aggregation results to output directory'
      ],
      outputFormat: 'JSON with aggregatedMembership (object), aggregationMethod (string), outputVariables (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregatedMembership', 'aggregationMethod', 'artifacts'],
      properties: {
        aggregatedMembership: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              membershipFunction: { type: 'array' },
              support: { type: 'object' },
              area: { type: 'number' }
            }
          }
        },
        aggregationMethod: { type: 'string' },
        outputVariables: { type: 'array', items: { type: 'string' } },
        rulesContributing: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'aggregation']
}));

// Task 6: Defuzzification
export const defuzzificationTask = defineTask('defuzzification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Defuzzify to crisp output values',
  agent: {
    name: 'defuzzification-agent',
    prompt: {
      role: 'defuzzification specialist',
      task: 'Convert aggregated fuzzy output to crisp values',
      context: args,
      instructions: [
        'Apply specified defuzzification method:',
        '- Centroid (center of gravity): weighted average of membership',
        '- Bisector: value that splits area in half',
        '- Mean of Maximum (MoM): average of maximum membership points',
        '- Smallest/Largest of Maximum: extreme maximum points',
        'Compute crisp output value for each output variable',
        'Validate output is within universe of discourse',
        'Compare different defuzzification methods if useful',
        'Document defuzzification computation',
        'Save crisp outputs to output directory'
      ],
      outputFormat: 'JSON with crispOutputs (object), defuzzificationDetails (object), methodComparison (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['crispOutputs', 'defuzzificationDetails', 'artifacts'],
      properties: {
        crispOutputs: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        defuzzificationDetails: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              computation: { type: 'object' },
              crispValue: { type: 'number' }
            }
          }
        },
        methodComparison: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              centroid: { type: 'number' },
              bisector: { type: 'number' },
              mom: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'defuzzification']
}));

// Task 7: Quality Assessment
export const fuzzyQualityTask = defineTask('fuzzy-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of fuzzy reasoning',
  agent: {
    name: 'fuzzy-quality-agent',
    prompt: {
      role: 'fuzzy systems quality reviewer',
      task: 'Assess quality and validity of fuzzy reasoning process',
      context: args,
      instructions: [
        'Evaluate linguistic variable definition (weight: 25%)',
        'Assess fuzzification correctness (weight: 15%)',
        'Check rule base quality and completeness (weight: 25%)',
        'Evaluate inference process correctness (weight: 20%)',
        'Assess defuzzification appropriateness (weight: 15%)',
        'Verify fuzzy set properties',
        'Check rule coverage of input space',
        'Validate membership function shapes',
        'Calculate weighted overall quality score (0-100)',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            variableDefinition: { type: 'number' },
            fuzzification: { type: 'number' },
            ruleBase: { type: 'number' },
            inference: { type: 'number' },
            defuzzification: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'quality']
}));

// Task 8: Report Generation
export const fuzzyReportTask = defineTask('fuzzy-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate fuzzy reasoning report',
  agent: {
    name: 'fuzzy-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on fuzzy reasoning process',
      context: args,
      instructions: [
        'Create executive summary of fuzzy inference results',
        'Document linguistic variables and membership functions',
        'Present fuzzy rule base',
        'Show fuzzification of inputs',
        'Explain inference process with trace',
        'Present aggregation and defuzzification',
        'Include membership function visualizations',
        'Show input-output surface if applicable',
        'List assumptions and limitations',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'fuzzy-reasoning', 'reporting']
}));
