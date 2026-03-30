/**
 * @process philosophy/thought-experiment-development
 * @description Construct and analyze philosophical thought experiments to test intuitions, reveal conceptual commitments, and evaluate theories
 * @inputs { philosophicalQuestion: string, targetTheory: string, experimentType: string, outputDir: string }
 * @outputs { success: boolean, thoughtExperiment: object, intuitionAnalysis: object, theoreticalImplications: object, artifacts: array }
 * @recommendedSkills SK-PHIL-006 (thought-experiment-design), SK-PHIL-005 (conceptual-analysis), SK-PHIL-010 (philosophical-writing-argumentation)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-006 (academic-philosophy-writer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    philosophicalQuestion,
    targetTheory = null,
    experimentType = 'intuition-pump',
    outputDir = 'thought-experiment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Question and Theory Analysis
  ctx.log('info', 'Starting thought experiment development: Analyzing question');
  const questionAnalysis = await ctx.task(questionAnalysisTask, {
    philosophicalQuestion,
    targetTheory,
    outputDir
  });

  if (!questionAnalysis.success) {
    return {
      success: false,
      error: 'Question analysis failed',
      details: questionAnalysis,
      metadata: { processId: 'philosophy/thought-experiment-development', timestamp: startTime }
    };
  }

  artifacts.push(...questionAnalysis.artifacts);

  // Task 2: Scenario Construction
  ctx.log('info', 'Constructing thought experiment scenario');
  const scenarioConstruction = await ctx.task(scenarioConstructionTask, {
    questionAnalysis: questionAnalysis.analysis,
    experimentType,
    targetTheory,
    outputDir
  });

  artifacts.push(...scenarioConstruction.artifacts);

  // Task 3: Intuition Elicitation
  ctx.log('info', 'Eliciting and analyzing intuitions');
  const intuitionElicitation = await ctx.task(intuitionElicitationTask, {
    scenario: scenarioConstruction.scenario,
    philosophicalQuestion,
    outputDir
  });

  artifacts.push(...intuitionElicitation.artifacts);

  // Task 4: Theoretical Implications Analysis
  ctx.log('info', 'Analyzing theoretical implications');
  const theoreticalAnalysis = await ctx.task(theoreticalAnalysisTask, {
    scenario: scenarioConstruction.scenario,
    intuitions: intuitionElicitation.intuitions,
    targetTheory,
    outputDir
  });

  artifacts.push(...theoreticalAnalysis.artifacts);

  // Task 5: Objections and Responses
  ctx.log('info', 'Developing objections and responses');
  const objectionsAnalysis = await ctx.task(objectionsAnalysisTask, {
    scenario: scenarioConstruction.scenario,
    intuitions: intuitionElicitation.intuitions,
    implications: theoreticalAnalysis.implications,
    outputDir
  });

  artifacts.push(...objectionsAnalysis.artifacts);

  // Task 6: Variant Development
  ctx.log('info', 'Developing scenario variants');
  const variantDevelopment = await ctx.task(variantDevelopmentTask, {
    originalScenario: scenarioConstruction.scenario,
    objections: objectionsAnalysis.objections,
    outputDir
  });

  artifacts.push(...variantDevelopment.artifacts);

  // Breakpoint: Review thought experiment
  await ctx.breakpoint({
    question: `Thought experiment developed. Scenario: "${scenarioConstruction.scenario.name}". ${variantDevelopment.variants.length} variants created. Review the experiment?`,
    title: 'Thought Experiment Development Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        experimentName: scenarioConstruction.scenario.name,
        experimentType,
        intuitionsElicited: intuitionElicitation.intuitions.length,
        variantsCreated: variantDevelopment.variants.length
      }
    }
  });

  // Task 7: Generate Thought Experiment Report
  ctx.log('info', 'Generating thought experiment report');
  const experimentReport = await ctx.task(experimentReportTask, {
    philosophicalQuestion,
    questionAnalysis,
    scenarioConstruction,
    intuitionElicitation,
    theoreticalAnalysis,
    objectionsAnalysis,
    variantDevelopment,
    outputDir
  });

  artifacts.push(...experimentReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    thoughtExperiment: {
      name: scenarioConstruction.scenario.name,
      scenario: scenarioConstruction.scenario,
      variants: variantDevelopment.variants,
      type: experimentType
    },
    intuitionAnalysis: {
      intuitions: intuitionElicitation.intuitions,
      conflictingIntuitions: intuitionElicitation.conflicts,
      intuitionStrength: intuitionElicitation.strength
    },
    theoreticalImplications: {
      forTargetTheory: theoreticalAnalysis.implications.forTarget,
      forAlternatives: theoreticalAnalysis.implications.forAlternatives,
      conceptualCommitments: theoreticalAnalysis.commitments
    },
    objections: objectionsAnalysis.objections,
    responses: objectionsAnalysis.responses,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/thought-experiment-development',
      timestamp: startTime,
      experimentType,
      outputDir
    }
  };
}

// Task 1: Question Analysis
export const questionAnalysisTask = defineTask('question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze philosophical question for thought experiment',
  agent: {
    name: 'question-analyst',
    prompt: {
      role: 'philosopher',
      task: 'Analyze the philosophical question to guide thought experiment construction',
      context: args,
      instructions: [
        'Identify the core philosophical question',
        'Identify what intuitions are relevant',
        'Analyze the target theory if specified',
        'Identify key variables to manipulate',
        'Determine what the experiment should test',
        'Consider what would count as success',
        'Note any methodological considerations',
        'Save question analysis to output directory'
      ],
      outputFormat: 'JSON with success, analysis (question, relevantIntuitions, variables, successCriteria), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            coreQuestion: { type: 'string' },
            relevantIntuitions: { type: 'array', items: { type: 'string' } },
            keyVariables: { type: 'array', items: { type: 'string' } },
            testingGoal: { type: 'string' },
            successCriteria: { type: 'string' },
            methodologicalNotes: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'thought-experiment', 'analysis']
}));

// Task 2: Scenario Construction
export const scenarioConstructionTask = defineTask('scenario-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct thought experiment scenario',
  agent: {
    name: 'scenario-constructor',
    prompt: {
      role: 'philosopher',
      task: 'Construct a compelling thought experiment scenario',
      context: args,
      instructions: [
        'Design a scenario that isolates the key variables',
        'Make the scenario vivid and easy to imagine',
        'Ensure scenario is internally consistent',
        'Avoid irrelevant complications',
        'Specify all relevant details',
        'Formulate the key question about the scenario',
        'Consider the scenario plausibility',
        'Save scenario to output directory'
      ],
      outputFormat: 'JSON with scenario (name, description, setup, question, keyFeatures), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenario', 'artifacts'],
      properties: {
        scenario: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            setup: { type: 'string' },
            keyQuestion: { type: 'string' },
            keyFeatures: { type: 'array', items: { type: 'string' } },
            assumptions: { type: 'array', items: { type: 'string' } },
            plausibility: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'thought-experiment', 'scenario']
}));

// Task 3: Intuition Elicitation
export const intuitionElicitationTask = defineTask('intuition-elicitation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Elicit and analyze intuitions',
  agent: {
    name: 'intuition-analyst',
    prompt: {
      role: 'philosopher',
      task: 'Elicit and analyze the intuitions prompted by the scenario',
      context: args,
      instructions: [
        'Identify the primary intuition about the scenario',
        'Consider alternative intuitive responses',
        'Assess the strength and reliability of intuitions',
        'Note any conflicting intuitions',
        'Consider whether intuitions are widely shared',
        'Analyze what generates the intuitions',
        'Assess evidential value of the intuitions',
        'Save intuition analysis to output directory'
      ],
      outputFormat: 'JSON with intuitions (intuition, strength, basis), conflicts, evidentialValue, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intuitions', 'artifacts'],
      properties: {
        intuitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              intuition: { type: 'string' },
              strength: { type: 'string' },
              basis: { type: 'string' },
              widelyShared: { type: 'boolean' }
            }
          }
        },
        conflicts: { type: 'array', items: { type: 'string' } },
        strength: { type: 'string' },
        evidentialValue: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'thought-experiment', 'intuitions']
}));

// Task 4: Theoretical Analysis
export const theoreticalAnalysisTask = defineTask('theoretical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze theoretical implications',
  agent: {
    name: 'theory-analyst',
    prompt: {
      role: 'philosopher',
      task: 'Analyze what the thought experiment implies for theories',
      context: args,
      instructions: [
        'Analyze implications for target theory',
        'Consider what the intuitions reveal about concepts',
        'Identify conceptual commitments revealed',
        'Analyze implications for alternative theories',
        'Consider whether intuitions support or undermine theories',
        'Assess the evidential weight for theory evaluation',
        'Note any theory-laden aspects of intuitions',
        'Save theoretical analysis to output directory'
      ],
      outputFormat: 'JSON with implications (forTarget, forAlternatives), commitments, evidentialWeight, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: {
          type: 'object',
          properties: {
            forTarget: { type: 'string' },
            forAlternatives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theory: { type: 'string' },
                  implication: { type: 'string' }
                }
              }
            }
          }
        },
        commitments: { type: 'array', items: { type: 'string' } },
        evidentialWeight: { type: 'string' },
        theoryLadenness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'thought-experiment', 'theory']
}));

// Task 5: Objections Analysis
export const objectionsAnalysisTask = defineTask('objections-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop objections and responses',
  agent: {
    name: 'objection-analyst',
    prompt: {
      role: 'philosopher',
      task: 'Develop objections to the thought experiment and responses',
      context: args,
      instructions: [
        'Identify potential objections to the scenario',
        'Consider objections to the intuitions',
        'Consider objections to the implications drawn',
        'Develop responses to each objection',
        'Assess the force of remaining objections',
        'Consider methodological objections',
        'Note any decisive objections',
        'Save objections analysis to output directory'
      ],
      outputFormat: 'JSON with objections (objection, type, force), responses, unresolvedIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objections', 'responses', 'artifacts'],
      properties: {
        objections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
              type: { type: 'string' },
              force: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              toObjection: { type: 'string' },
              response: { type: 'string' },
              success: { type: 'string' }
            }
          }
        },
        unresolvedIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'thought-experiment', 'objections']
}));

// Task 6: Variant Development
export const variantDevelopmentTask = defineTask('variant-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scenario variants',
  agent: {
    name: 'variant-developer',
    prompt: {
      role: 'philosopher',
      task: 'Develop variants of the thought experiment to test different aspects',
      context: args,
      instructions: [
        'Create variants that modify key variables',
        'Develop variants that address objections',
        'Create variants for edge cases',
        'Develop variants that isolate specific factors',
        'Note how intuitions change across variants',
        'Consider what variants reveal',
        'Identify the most illuminating variants',
        'Save variant development to output directory'
      ],
      outputFormat: 'JSON with variants (name, modification, intuitionChange, insight), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'artifacts'],
      properties: {
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              modification: { type: 'string' },
              scenario: { type: 'string' },
              intuitionChange: { type: 'string' },
              insight: { type: 'string' }
            }
          }
        },
        mostIlluminating: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'thought-experiment', 'variants']
}));

// Task 7: Experiment Report
export const experimentReportTask = defineTask('experiment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate thought experiment report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosopher and technical writer',
      task: 'Generate comprehensive thought experiment report',
      context: args,
      instructions: [
        'Create executive summary of the thought experiment',
        'Present the philosophical question',
        'Present the main scenario vividly',
        'Document intuition analysis',
        'Present theoretical implications',
        'Include objections and responses',
        'Present key variants',
        'Note conclusions and limitations',
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
  labels: ['agent', 'philosophy', 'thought-experiment', 'reporting']
}));
