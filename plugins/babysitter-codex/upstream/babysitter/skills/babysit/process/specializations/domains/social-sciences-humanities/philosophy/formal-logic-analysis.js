/**
 * @process philosophy/formal-logic-analysis
 * @description Apply propositional and predicate logic to formalize arguments, identify logical structure, and evaluate validity using symbolic notation
 * @inputs { argumentText: string, logicType: string, outputDir: string }
 * @outputs { success: boolean, formalizedArgument: object, validityAssessment: object, artifacts: array }
 * @recommendedSkills SK-PHIL-001 (formal-logic-analysis), SK-PHIL-002 (argument-mapping-reconstruction)
 * @recommendedAgents AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    argumentText,
    logicType = 'propositional',
    outputDir = 'logic-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Argument Identification and Extraction
  ctx.log('info', 'Starting formal logic analysis: Identifying argument components');
  const argumentExtraction = await ctx.task(argumentExtractionTask, {
    argumentText,
    outputDir
  });

  if (!argumentExtraction.success) {
    return {
      success: false,
      error: 'Argument extraction failed',
      details: argumentExtraction,
      metadata: { processId: 'philosophy/formal-logic-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...argumentExtraction.artifacts);

  // Task 2: Symbolization and Formalization
  ctx.log('info', 'Translating argument into symbolic notation');
  const symbolization = await ctx.task(symbolizationTask, {
    argumentComponents: argumentExtraction.components,
    logicType,
    outputDir
  });

  artifacts.push(...symbolization.artifacts);

  // Task 3: Logical Structure Analysis
  ctx.log('info', 'Analyzing logical structure');
  const structureAnalysis = await ctx.task(structureAnalysisTask, {
    formalizedArgument: symbolization.formalizedArgument,
    logicType,
    outputDir
  });

  artifacts.push(...structureAnalysis.artifacts);

  // Task 4: Validity Evaluation
  ctx.log('info', 'Evaluating argument validity');
  const validityEvaluation = await ctx.task(validityEvaluationTask, {
    formalizedArgument: symbolization.formalizedArgument,
    logicType,
    structureAnalysis: structureAnalysis.structure,
    outputDir
  });

  artifacts.push(...validityEvaluation.artifacts);

  // Task 5: Truth Table or Proof Generation
  ctx.log('info', 'Generating formal proof or truth table');
  const proofGeneration = await ctx.task(proofGenerationTask, {
    formalizedArgument: symbolization.formalizedArgument,
    logicType,
    validityResult: validityEvaluation.validity,
    outputDir
  });

  artifacts.push(...proofGeneration.artifacts);

  // Breakpoint: Review analysis results
  await ctx.breakpoint({
    question: `Formal logic analysis complete. Argument is ${validityEvaluation.validity.isValid ? 'VALID' : 'INVALID'}. Review the analysis?`,
    title: 'Formal Logic Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        logicType,
        isValid: validityEvaluation.validity.isValid,
        argumentForm: structureAnalysis.structure.argumentForm,
        premiseCount: argumentExtraction.components.premises.length
      }
    }
  });

  // Task 6: Generate Analysis Report
  ctx.log('info', 'Generating formal logic analysis report');
  const analysisReport = await ctx.task(analysisReportTask, {
    argumentText,
    argumentExtraction,
    symbolization,
    structureAnalysis,
    validityEvaluation,
    proofGeneration,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    formalizedArgument: {
      original: argumentText,
      components: argumentExtraction.components,
      symbolicForm: symbolization.formalizedArgument,
      legend: symbolization.symbolLegend
    },
    validityAssessment: {
      isValid: validityEvaluation.validity.isValid,
      validityType: validityEvaluation.validity.validityType,
      argumentForm: structureAnalysis.structure.argumentForm,
      proof: proofGeneration.proof
    },
    logicalStructure: structureAnalysis.structure,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/formal-logic-analysis',
      timestamp: startTime,
      logicType,
      outputDir
    }
  };
}

// Task 1: Argument Extraction
export const argumentExtractionTask = defineTask('argument-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract argument components from text',
  agent: {
    name: 'logic-analyst',
    prompt: {
      role: 'philosophical logician',
      task: 'Identify and extract argument components from natural language text',
      context: args,
      instructions: [
        'Identify all premises (explicit and implicit)',
        'Identify the main conclusion',
        'Identify any intermediate conclusions',
        'Note indicator words (therefore, because, since, thus)',
        'Identify any unstated assumptions',
        'Separate factual claims from logical connectives',
        'Document the argument in standard form',
        'Save extraction results to output directory'
      ],
      outputFormat: 'JSON with components (premises, conclusion, assumptions), indicators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'components', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        components: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            intermediateConclusions: { type: 'array', items: { type: 'string' } },
            implicitAssumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        indicators: {
          type: 'object',
          properties: {
            premiseIndicators: { type: 'array', items: { type: 'string' } },
            conclusionIndicators: { type: 'array', items: { type: 'string' } }
          }
        },
        standardForm: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'logic', 'argument-extraction']
}));

// Task 2: Symbolization
export const symbolizationTask = defineTask('symbolization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Translate argument into symbolic notation',
  agent: {
    name: 'symbolization-expert',
    prompt: {
      role: 'formal logician',
      task: 'Translate natural language argument into formal symbolic notation',
      context: args,
      instructions: [
        'Assign propositional variables to atomic statements',
        'Identify logical connectives (and, or, not, if-then, if and only if)',
        'Translate premises into symbolic form',
        'Translate conclusion into symbolic form',
        'For predicate logic: identify predicates, constants, variables, quantifiers',
        'Create a complete symbol legend',
        'Verify translation preserves logical meaning',
        'Save formalization to output directory'
      ],
      outputFormat: 'JSON with formalizedArgument, symbolLegend, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizedArgument', 'symbolLegend', 'artifacts'],
      properties: {
        formalizedArgument: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            fullArgument: { type: 'string' }
          }
        },
        symbolLegend: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        connectives: { type: 'array', items: { type: 'string' } },
        quantifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'logic', 'symbolization']
}));

// Task 3: Structure Analysis
export const structureAnalysisTask = defineTask('structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze logical structure of argument',
  agent: {
    name: 'structure-analyst',
    prompt: {
      role: 'philosophical logician',
      task: 'Analyze the logical structure and form of the formalized argument',
      context: args,
      instructions: [
        'Identify the argument form (modus ponens, modus tollens, hypothetical syllogism, etc.)',
        'Determine if argument is deductive or inductive',
        'Identify main connective in each formula',
        'Map argument dependency structure',
        'Check for recognized valid argument forms',
        'Identify any structural fallacies',
        'Document the logical skeleton',
        'Save structure analysis to output directory'
      ],
      outputFormat: 'JSON with structure (argumentForm, logicalType, dependencies), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            argumentForm: { type: 'string' },
            logicalType: { type: 'string' },
            mainConnectives: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'object' },
            recognizedForms: { type: 'array', items: { type: 'string' } },
            structuralIssues: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'logic', 'structure-analysis']
}));

// Task 4: Validity Evaluation
export const validityEvaluationTask = defineTask('validity-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate argument validity',
  agent: {
    name: 'validity-evaluator',
    prompt: {
      role: 'formal logician',
      task: 'Evaluate the logical validity of the formalized argument',
      context: args,
      instructions: [
        'Apply appropriate validity test based on logic type',
        'For propositional logic: use truth table method or semantic trees',
        'For predicate logic: use proof methods or counterexample search',
        'Determine if argument is valid, invalid, or contingent',
        'If invalid, identify counterexample (truth value assignment)',
        'Distinguish validity from soundness',
        'Note any scope or quantifier issues in predicate logic',
        'Save validity assessment to output directory'
      ],
      outputFormat: 'JSON with validity (isValid, validityType, counterexample), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validity', 'artifacts'],
      properties: {
        validity: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            validityType: { type: 'string' },
            method: { type: 'string' },
            counterexample: { type: 'object' },
            explanation: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'logic', 'validity']
}));

// Task 5: Proof Generation
export const proofGenerationTask = defineTask('proof-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate formal proof or truth table',
  agent: {
    name: 'proof-constructor',
    prompt: {
      role: 'formal logician',
      task: 'Construct formal proof or truth table for the argument',
      context: args,
      instructions: [
        'For valid propositional arguments: construct truth table or natural deduction proof',
        'For valid predicate arguments: construct proof using rules of inference',
        'Apply inference rules (MP, MT, HS, DS, conjunction, etc.)',
        'Apply equivalence rules where needed',
        'For invalid arguments: demonstrate invalidity with counterexample',
        'Number each step and cite rule used',
        'Create clear, formatted proof',
        'Save proof to output directory'
      ],
      outputFormat: 'JSON with proof (steps, rules, conclusion), truthTable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proof', 'artifacts'],
      properties: {
        proof: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lineNumber: { type: 'number' },
                  formula: { type: 'string' },
                  justification: { type: 'string' }
                }
              }
            },
            complete: { type: 'boolean' },
            method: { type: 'string' }
          }
        },
        truthTable: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'logic', 'proof']
}));

// Task 6: Analysis Report
export const analysisReportTask = defineTask('analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate formal logic analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical logician and technical writer',
      task: 'Generate comprehensive formal logic analysis report',
      context: args,
      instructions: [
        'Create executive summary with validity determination',
        'Present original argument and standard form',
        'Document symbol legend and formalization',
        'Show logical structure analysis',
        'Present validity proof or counterexample',
        'Include truth table if applicable',
        'Discuss any logical issues or ambiguities',
        'Provide philosophical commentary on argument strength',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'logic', 'reporting']
}));
