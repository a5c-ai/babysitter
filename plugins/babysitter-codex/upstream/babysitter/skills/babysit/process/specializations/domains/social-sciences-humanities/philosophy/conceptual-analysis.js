/**
 * @process philosophy/conceptual-analysis
 * @description Analyze, define, and clarify philosophical concepts through examination of necessary and sufficient conditions, counterexamples, and conceptual boundaries
 * @inputs { concept: string, analysisDepth: string, testCounterexamples: boolean, outputDir: string }
 * @outputs { success: boolean, conceptAnalysis: object, definitions: object, boundaries: object, artifacts: array }
 * @recommendedSkills SK-PHIL-005 (conceptual-analysis), SK-PHIL-002 (argument-mapping-reconstruction), SK-PHIL-006 (thought-experiment-design)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    concept,
    analysisDepth = 'comprehensive',
    testCounterexamples = true,
    outputDir = 'conceptual-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Concept Identification and Usage Survey
  ctx.log('info', 'Starting conceptual analysis: Surveying concept usage');
  const usageSurvey = await ctx.task(usageSurveyTask, {
    concept,
    outputDir
  });

  if (!usageSurvey.success) {
    return {
      success: false,
      error: 'Usage survey failed',
      details: usageSurvey,
      metadata: { processId: 'philosophy/conceptual-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...usageSurvey.artifacts);

  // Task 2: Necessary Conditions Analysis
  ctx.log('info', 'Analyzing necessary conditions');
  const necessaryConditions = await ctx.task(necessaryConditionsTask, {
    concept,
    usages: usageSurvey.usages,
    outputDir
  });

  artifacts.push(...necessaryConditions.artifacts);

  // Task 3: Sufficient Conditions Analysis
  ctx.log('info', 'Analyzing sufficient conditions');
  const sufficientConditions = await ctx.task(sufficientConditionsTask, {
    concept,
    usages: usageSurvey.usages,
    necessaryConditions: necessaryConditions.conditions,
    outputDir
  });

  artifacts.push(...sufficientConditions.artifacts);

  // Task 4: Counterexample Testing (if requested)
  let counterexampleAnalysis = null;
  if (testCounterexamples) {
    ctx.log('info', 'Testing with counterexamples');
    counterexampleAnalysis = await ctx.task(counterexampleTestingTask, {
      concept,
      necessaryConditions: necessaryConditions.conditions,
      sufficientConditions: sufficientConditions.conditions,
      outputDir
    });
    artifacts.push(...counterexampleAnalysis.artifacts);
  }

  // Task 5: Conceptual Boundary Mapping
  ctx.log('info', 'Mapping conceptual boundaries');
  const boundaryMapping = await ctx.task(boundaryMappingTask, {
    concept,
    necessaryConditions: necessaryConditions.conditions,
    sufficientConditions: sufficientConditions.conditions,
    counterexamples: counterexampleAnalysis?.counterexamples,
    outputDir
  });

  artifacts.push(...boundaryMapping.artifacts);

  // Task 6: Definition Formulation
  ctx.log('info', 'Formulating definitions');
  const definitionFormulation = await ctx.task(definitionFormulationTask, {
    concept,
    necessaryConditions: necessaryConditions.conditions,
    sufficientConditions: sufficientConditions.conditions,
    boundaries: boundaryMapping.boundaries,
    outputDir
  });

  artifacts.push(...definitionFormulation.artifacts);

  // Breakpoint: Review conceptual analysis
  await ctx.breakpoint({
    question: `Conceptual analysis of "${concept}" complete. Found ${necessaryConditions.conditions.length} necessary conditions. Review the analysis?`,
    title: 'Conceptual Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        concept,
        necessaryConditionsCount: necessaryConditions.conditions.length,
        sufficientConditionsFound: sufficientConditions.conditions.length > 0,
        counterexamplesTested: testCounterexamples
      }
    }
  });

  // Task 7: Generate Conceptual Analysis Report
  ctx.log('info', 'Generating conceptual analysis report');
  const analysisReport = await ctx.task(conceptualReportTask, {
    concept,
    usageSurvey,
    necessaryConditions,
    sufficientConditions,
    counterexampleAnalysis,
    boundaryMapping,
    definitionFormulation,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conceptAnalysis: {
      concept,
      usages: usageSurvey.usages,
      necessaryConditions: necessaryConditions.conditions,
      sufficientConditions: sufficientConditions.conditions,
      counterexamples: counterexampleAnalysis?.counterexamples
    },
    definitions: {
      proposed: definitionFormulation.definitions,
      preferred: definitionFormulation.preferred,
      justification: definitionFormulation.justification
    },
    boundaries: {
      clearCases: boundaryMapping.boundaries.clearCases,
      borderlineCases: boundaryMapping.boundaries.borderlineCases,
      relatedConcepts: boundaryMapping.boundaries.relatedConcepts
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/conceptual-analysis',
      timestamp: startTime,
      analysisDepth,
      outputDir
    }
  };
}

// Task 1: Usage Survey
export const usageSurveyTask = defineTask('usage-survey', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Survey concept usage',
  agent: {
    name: 'usage-surveyor',
    prompt: {
      role: 'philosophical analyst',
      task: 'Survey the various uses and meanings of the concept',
      context: args,
      instructions: [
        'Identify ordinary language uses of the concept',
        'Identify technical philosophical uses',
        'Note different senses or meanings',
        'Identify paradigm cases of the concept',
        'Note etymology and historical development',
        'Identify related and contrasting concepts',
        'Document how different philosophers use the concept',
        'Save usage survey to output directory'
      ],
      outputFormat: 'JSON with success, usages (ordinary, technical, paradigmCases), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'usages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        usages: {
          type: 'object',
          properties: {
            ordinary: { type: 'array', items: { type: 'string' } },
            technical: { type: 'array', items: { type: 'string' } },
            senses: { type: 'array', items: { type: 'string' } },
            paradigmCases: { type: 'array', items: { type: 'string' } },
            etymology: { type: 'string' },
            relatedConcepts: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'conceptual', 'usage']
}));

// Task 2: Necessary Conditions
export const necessaryConditionsTask = defineTask('necessary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze necessary conditions',
  agent: {
    name: 'necessity-analyst',
    prompt: {
      role: 'analytic philosopher',
      task: 'Identify the necessary conditions for the concept to apply',
      context: args,
      instructions: [
        'Identify conditions that must be present for concept to apply',
        'For each candidate: test if concept applies without it',
        'Distinguish essential from accidental features',
        'Consider modal tests (could X be Y without Z?)',
        'Note conditions shared with related concepts',
        'Rank conditions by centrality',
        'Document reasoning for each necessary condition',
        'Save necessary conditions to output directory'
      ],
      outputFormat: 'JSON with conditions (condition, reasoning, certainty), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'artifacts'],
      properties: {
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              reasoning: { type: 'string' },
              certainty: { type: 'string' },
              centrality: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'conceptual', 'necessary']
}));

// Task 3: Sufficient Conditions
export const sufficientConditionsTask = defineTask('sufficient-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze sufficient conditions',
  agent: {
    name: 'sufficiency-analyst',
    prompt: {
      role: 'analytic philosopher',
      task: 'Identify sufficient conditions for the concept to apply',
      context: args,
      instructions: [
        'Identify condition sets that guarantee concept applies',
        'Test if necessary conditions together are sufficient',
        'Consider multiple sufficient condition sets (disjunctive)',
        'Test each candidate set against paradigm cases',
        'Note any gaps between necessary and sufficient',
        'Consider whether concept is family-resemblance type',
        'Document reasoning for sufficiency claims',
        'Save sufficient conditions to output directory'
      ],
      outputFormat: 'JSON with conditions (conditionSet, reasoning, coverage), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'artifacts'],
      properties: {
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conditionSet: { type: 'array', items: { type: 'string' } },
              reasoning: { type: 'string' },
              coverage: { type: 'string' }
            }
          }
        },
        familyResemblance: { type: 'boolean' },
        gapAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'conceptual', 'sufficient']
}));

// Task 4: Counterexample Testing
export const counterexampleTestingTask = defineTask('counterexample-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test with counterexamples',
  agent: {
    name: 'counterexample-tester',
    prompt: {
      role: 'analytic philosopher',
      task: 'Test proposed conditions against counterexamples',
      context: args,
      instructions: [
        'Generate potential counterexamples to necessary conditions',
        'Generate potential counterexamples to sufficient conditions',
        'Consider famous philosophical counterexamples if relevant',
        'Assess the force of each counterexample',
        'Consider how to modify conditions in response',
        'Distinguish genuine counterexamples from borderline cases',
        'Note any stubborn counterexamples',
        'Save counterexample analysis to output directory'
      ],
      outputFormat: 'JSON with counterexamples (case, target, assessment, modification), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['counterexamples', 'artifacts'],
      properties: {
        counterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              targetCondition: { type: 'string' },
              conditionType: { type: 'string' },
              assessment: { type: 'string' },
              force: { type: 'string' },
              modification: { type: 'string' }
            }
          }
        },
        stubbornCounterexamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'conceptual', 'counterexample']
}));

// Task 5: Boundary Mapping
export const boundaryMappingTask = defineTask('boundary-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map conceptual boundaries',
  agent: {
    name: 'boundary-mapper',
    prompt: {
      role: 'analytic philosopher',
      task: 'Map the boundaries and extensions of the concept',
      context: args,
      instructions: [
        'Identify clear positive cases (clearly falls under concept)',
        'Identify clear negative cases (clearly does not)',
        'Identify borderline cases (unclear application)',
        'Map relationships to neighboring concepts',
        'Identify the semantic field of the concept',
        'Note any vagueness or open texture',
        'Consider context-sensitivity of boundaries',
        'Save boundary mapping to output directory'
      ],
      outputFormat: 'JSON with boundaries (clearCases, borderlineCases, relatedConcepts), vagueness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaries', 'artifacts'],
      properties: {
        boundaries: {
          type: 'object',
          properties: {
            clearCases: {
              type: 'object',
              properties: {
                positive: { type: 'array', items: { type: 'string' } },
                negative: { type: 'array', items: { type: 'string' } }
              }
            },
            borderlineCases: { type: 'array', items: { type: 'string' } },
            relatedConcepts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  relationship: { type: 'string' }
                }
              }
            }
          }
        },
        vagueness: { type: 'string' },
        contextSensitivity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'conceptual', 'boundaries']
}));

// Task 6: Definition Formulation
export const definitionFormulationTask = defineTask('definition-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate definitions',
  agent: {
    name: 'definition-formulator',
    prompt: {
      role: 'analytic philosopher',
      task: 'Formulate precise definitions of the concept',
      context: args,
      instructions: [
        'Formulate definitions based on analysis',
        'Consider multiple definitional forms (genus-species, functional, etc.)',
        'State the preferred definition clearly',
        'Justify the preferred definition',
        'Note limitations or caveats',
        'Consider revisionary vs. descriptive definitions',
        'Assess how well definition captures the concept',
        'Save definition formulation to output directory'
      ],
      outputFormat: 'JSON with definitions (definition, type, scope), preferred, justification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definitions', 'preferred', 'artifacts'],
      properties: {
        definitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              definition: { type: 'string' },
              type: { type: 'string' },
              scope: { type: 'string' },
              limitations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        preferred: { type: 'string' },
        justification: { type: 'string' },
        revisionary: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'conceptual', 'definition']
}));

// Task 7: Conceptual Report
export const conceptualReportTask = defineTask('conceptual-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate conceptual analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'analytic philosopher and technical writer',
      task: 'Generate comprehensive conceptual analysis report',
      context: args,
      instructions: [
        'Create executive summary with preferred definition',
        'Present the concept and usage survey',
        'Document necessary conditions analysis',
        'Document sufficient conditions analysis',
        'Present counterexample analysis if performed',
        'Include boundary mapping',
        'Present proposed definitions',
        'Note limitations and further work needed',
        'Format as professional philosophical report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
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
  labels: ['agent', 'philosophy', 'conceptual', 'reporting']
}));
