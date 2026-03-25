/**
 * @process scientific-discovery/many-valued-partial-logics
 * @description More than two truth values; explicitly represent "unknown" for reasoning under vagueness
 * @inputs { propositions: array, truthValueAssignments: object, logicType: string, inferenceRules: array, outputDir: string }
 * @outputs { success: boolean, truthValues: object, inferences: array, partialModel: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    propositions = [],
    truthValueAssignments = {},
    logicType = 'three-valued', // three-valued, four-valued, kleene, lukasiewicz
    inferenceRules = [],
    outputDir = 'many-valued-logic-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Many-Valued/Partial Logic Reasoning Process');

  // ============================================================================
  // PHASE 1: LOGIC SYSTEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up many-valued logic system');
  const logicSetup = await ctx.task(logicSystemSetupTask, {
    logicType,
    propositions,
    outputDir
  });

  artifacts.push(...logicSetup.artifacts);

  // ============================================================================
  // PHASE 2: TRUTH VALUE ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assigning truth values to propositions');
  const truthAssignment = await ctx.task(truthAssignmentTask, {
    propositions,
    truthValueAssignments,
    logicSystem: logicSetup.system,
    outputDir
  });

  artifacts.push(...truthAssignment.artifacts);

  // ============================================================================
  // PHASE 3: CONNECTIVE SEMANTICS
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying many-valued connective semantics');
  const connectiveSemantics = await ctx.task(connectiveSemanticsTask, {
    truthValues: truthAssignment.values,
    logicSystem: logicSetup.system,
    propositions,
    outputDir
  });

  artifacts.push(...connectiveSemantics.artifacts);

  // ============================================================================
  // PHASE 4: PARTIAL MODEL CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing partial model');
  const partialModel = await ctx.task(partialModelTask, {
    truthValues: connectiveSemantics.evaluatedTruth,
    logicSystem: logicSetup.system,
    propositions,
    outputDir
  });

  artifacts.push(...partialModel.artifacts);

  // ============================================================================
  // PHASE 5: INFERENCE IN MANY-VALUED LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing inference in many-valued logic');
  const inference = await ctx.task(manyValuedInferenceTask, {
    partialModel: partialModel.model,
    inferenceRules,
    logicSystem: logicSetup.system,
    outputDir
  });

  artifacts.push(...inference.artifacts);

  // ============================================================================
  // PHASE 6: UNCERTAINTY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing uncertainty and unknown values');
  const uncertaintyAnalysis = await ctx.task(unknownAnalysisTask, {
    truthValues: inference.derivedValues,
    partialModel: partialModel.model,
    outputDir
  });

  artifacts.push(...uncertaintyAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reasoning quality');
  const qualityScore = await ctx.task(manyValuedQualityTask, {
    logicSetup,
    truthAssignment,
    partialModel: partialModel.model,
    inference,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review many-valued logic results
  await ctx.breakpoint({
    question: `Many-valued logic analysis complete. Quality score: ${qualityScore.overallScore}/100. Unknown propositions: ${uncertaintyAnalysis.unknownCount}. ${qualityMet ? 'Quality meets standards!' : 'Review truth value assignments.'} Review results?`,
    title: 'Many-Valued Logic Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        logicType,
        propositionsCount: propositions.length,
        trueCount: uncertaintyAnalysis.trueCount,
        falseCount: uncertaintyAnalysis.falseCount,
        unknownCount: uncertaintyAnalysis.unknownCount,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const report = await ctx.task(manyValuedReportTask, {
    logicSetup,
    truthAssignment,
    connectiveSemantics,
    partialModel: partialModel.model,
    inference,
    uncertaintyAnalysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    truthValues: inference.derivedValues,
    inferences: inference.inferences,
    partialModel: partialModel.model,
    uncertaintyAnalysis: uncertaintyAnalysis.analysis,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/many-valued-partial-logics',
      timestamp: startTime,
      outputDir,
      logicType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Logic System Setup
export const logicSystemSetupTask = defineTask('logic-system-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up many-valued logic system',
  agent: {
    name: 'logic-system-agent',
    prompt: {
      role: 'many-valued logic expert',
      task: 'Set up the appropriate many-valued logic system',
      context: args,
      instructions: [
        'Configure logic system based on logicType:',
        '- Three-valued (Kleene): {true, false, unknown}',
        '- Three-valued (Lukasiewicz): {true, false, possible}',
        '- Four-valued (Belnap): {true, false, neither, both}',
        '- n-valued Lukasiewicz logics',
        'Define truth value ordering (lattice structure)',
        'Specify designated values (what counts as "true enough")',
        'Define truth tables for connectives (NOT, AND, OR, IMPLIES)',
        'Document logic system properties',
        'Save logic system configuration to output directory'
      ],
      outputFormat: 'JSON with system (object), truthValues (array), connectives (object), designatedValues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'truthValues', 'connectives', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            numValues: { type: 'number' },
            description: { type: 'string' }
          }
        },
        truthValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              numericValue: { type: 'number' },
              meaning: { type: 'string' }
            }
          }
        },
        connectives: {
          type: 'object',
          properties: {
            negation: { type: 'object' },
            conjunction: { type: 'object' },
            disjunction: { type: 'object' },
            implication: { type: 'object' }
          }
        },
        designatedValues: { type: 'array', items: { type: 'string' } },
        latticeStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'setup']
}));

// Task 2: Truth Value Assignment
export const truthAssignmentTask = defineTask('truth-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign truth values to propositions',
  agent: {
    name: 'truth-assignment-agent',
    prompt: {
      role: 'partial interpretation specialist',
      task: 'Assign many-valued truth values to atomic propositions',
      context: args,
      instructions: [
        'Assign truth values from the logic system to propositions',
        'Handle explicit assignments from input',
        'Assign "unknown" to unspecified propositions if appropriate',
        'Validate assignments are valid truth values',
        'Handle partial information appropriately',
        'Document source/justification for each assignment',
        'Identify propositions with insufficient information',
        'Save truth assignments to output directory'
      ],
      outputFormat: 'JSON with values (object), assignmentSources (object), partialPropositions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['values', 'assignmentSources', 'artifacts'],
      properties: {
        values: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        assignmentSources: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        partialPropositions: { type: 'array', items: { type: 'string' } },
        validationPassed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'assignment']
}));

// Task 3: Connective Semantics
export const connectiveSemanticsTask = defineTask('connective-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply many-valued connective semantics',
  agent: {
    name: 'connective-semantics-agent',
    prompt: {
      role: 'logical semantics expert',
      task: 'Evaluate compound propositions using many-valued connective semantics',
      context: args,
      instructions: [
        'For negation NOT(A): apply truth table from logic system',
        'For conjunction A AND B: apply many-valued conjunction',
        'For disjunction A OR B: apply many-valued disjunction',
        'For implication A -> B: apply many-valued implication',
        'Evaluate compound formulas recursively',
        'Handle nested connectives correctly',
        'Document evaluation steps',
        'Verify semantic consistency',
        'Save evaluated truth values to output directory'
      ],
      outputFormat: 'JSON with evaluatedTruth (object), evaluationSteps (array), compoundFormulas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluatedTruth', 'evaluationSteps', 'artifacts'],
      properties: {
        evaluatedTruth: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        evaluationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              formula: { type: 'string' },
              subformulas: { type: 'array' },
              connective: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        compoundFormulas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              formula: { type: 'string' },
              truthValue: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'semantics']
}));

// Task 4: Partial Model Construction
export const partialModelTask = defineTask('partial-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct partial model',
  agent: {
    name: 'partial-model-agent',
    prompt: {
      role: 'model theory specialist',
      task: 'Construct a partial model representing the many-valued interpretation',
      context: args,
      instructions: [
        'Build partial model with extension and anti-extension for predicates',
        'Extension: elements for which predicate is true',
        'Anti-extension: elements for which predicate is false',
        'Gap: elements for which truth value is unknown',
        'Glut: elements for which predicate is both true and false (four-valued)',
        'Validate model consistency with logic system',
        'Identify information gaps in the model',
        'Document model structure',
        'Save partial model to output directory'
      ],
      outputFormat: 'JSON with model (object), extensions (object), antiExtensions (object), gaps (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            domain: { type: 'array' },
            predicates: { type: 'object' },
            type: { type: 'string' }
          }
        },
        extensions: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        antiExtensions: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        gaps: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        gluts: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        modelConsistent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'model']
}));

// Task 5: Many-Valued Inference
export const manyValuedInferenceTask = defineTask('many-valued-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform inference in many-valued logic',
  agent: {
    name: 'many-valued-inference-agent',
    prompt: {
      role: 'automated reasoning specialist',
      task: 'Perform logical inference in the many-valued system',
      context: args,
      instructions: [
        'Apply inference rules valid in the many-valued logic',
        'Modus ponens may not be fully valid - check logic system',
        'Use designated value preservation for valid inferences',
        'Derive truth values for query propositions',
        'Track inference chains and justifications',
        'Handle propagation of unknown values',
        'Identify conclusions that depend on unknown premises',
        'Apply non-classical inference rules if applicable',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with inferences (array), derivedValues (object), inferenceChains (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'derivedValues', 'artifacts'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              truthValue: { type: 'string' },
              rule: { type: 'string' },
              premises: { type: 'array' }
            }
          }
        },
        derivedValues: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        inferenceChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              steps: { type: 'array' }
            }
          }
        },
        validInferences: { type: 'number' },
        unknownDependentConclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'inference']
}));

// Task 6: Unknown Analysis
export const unknownAnalysisTask = defineTask('unknown-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze unknown and partial truth values',
  agent: {
    name: 'unknown-analysis-agent',
    prompt: {
      role: 'uncertainty analysis specialist',
      task: 'Analyze the distribution and impact of unknown/partial truth values',
      context: args,
      instructions: [
        'Count propositions in each truth value category',
        'Identify which unknowns could be resolved',
        'Analyze impact of unknown values on conclusions',
        'Determine what additional information would help',
        'Identify critical unknowns affecting key conclusions',
        'Assess overall information completeness',
        'Suggest information gathering priorities',
        'Save uncertainty analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), trueCount (number), falseCount (number), unknownCount (number), criticalUnknowns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'trueCount', 'falseCount', 'unknownCount', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            resolvableUnknowns: { type: 'number' },
            criticalGaps: { type: 'array' }
          }
        },
        trueCount: { type: 'number' },
        falseCount: { type: 'number' },
        unknownCount: { type: 'number' },
        otherCount: { type: 'number' },
        criticalUnknowns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              impact: { type: 'string' },
              affectedConclusions: { type: 'array' }
            }
          }
        },
        informationNeeds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'uncertainty']
}));

// Task 7: Quality Assessment
export const manyValuedQualityTask = defineTask('many-valued-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of many-valued logic reasoning',
  agent: {
    name: 'many-valued-quality-agent',
    prompt: {
      role: 'many-valued logic methodology reviewer',
      task: 'Assess quality and validity of many-valued logic analysis',
      context: args,
      instructions: [
        'Evaluate logic system setup appropriateness (weight: 20%)',
        'Assess truth value assignment validity (weight: 25%)',
        'Check connective semantics correctness (weight: 20%)',
        'Evaluate partial model construction (weight: 20%)',
        'Assess inference validity (weight: 15%)',
        'Verify truth tables are applied correctly',
        'Check for semantic consistency',
        'Validate designated value handling',
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
            logicSystemSetup: { type: 'number' },
            truthAssignment: { type: 'number' },
            connectiveSemantics: { type: 'number' },
            partialModel: { type: 'number' },
            inference: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'quality']
}));

// Task 8: Report Generation
export const manyValuedReportTask = defineTask('many-valued-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate many-valued logic analysis report',
  agent: {
    name: 'many-valued-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on many-valued logic reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document logic system and truth values',
        'Present truth tables for connectives',
        'Show truth value assignments',
        'Describe partial model structure',
        'Present inference results',
        'Analyze unknown value distribution',
        'Include visualization of truth value lattice',
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
  labels: ['agent', 'scientific-discovery', 'many-valued-logic', 'reporting']
}));
