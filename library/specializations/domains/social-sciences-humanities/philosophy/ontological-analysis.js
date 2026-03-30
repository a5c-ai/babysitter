/**
 * @process philosophy/ontological-analysis
 * @description Investigate questions of being, existence, and the nature of reality through conceptual analysis, thought experiments, and engagement with metaphysical traditions
 * @inputs { ontologicalQuestion: string, metaphysicalTraditions: array, useThoughtExperiments: boolean, outputDir: string }
 * @outputs { success: boolean, ontologicalInvestigation: object, metaphysicalFindings: object, philosophicalPosition: object, artifacts: array }
 * @recommendedSkills SK-PHIL-005 (conceptual-analysis), SK-PHIL-006 (thought-experiment-design), SK-PHIL-010 (philosophical-writing-argumentation)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-006 (academic-philosophy-writer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    ontologicalQuestion,
    metaphysicalTraditions = ['analytic', 'continental', 'classical'],
    useThoughtExperiments = true,
    outputDir = 'ontological-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Question Clarification and Framing
  ctx.log('info', 'Starting ontological analysis: Clarifying the question');
  const questionClarification = await ctx.task(questionClarificationTask, {
    ontologicalQuestion,
    outputDir
  });

  if (!questionClarification.success) {
    return {
      success: false,
      error: 'Question clarification failed',
      details: questionClarification,
      metadata: { processId: 'philosophy/ontological-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...questionClarification.artifacts);

  // Task 2: Metaphysical Tradition Survey
  ctx.log('info', 'Surveying metaphysical traditions');
  const traditionSurvey = await ctx.task(traditionSurveyTask, {
    clarifiedQuestion: questionClarification.clarified,
    metaphysicalTraditions,
    outputDir
  });

  artifacts.push(...traditionSurvey.artifacts);

  // Task 3: Conceptual Analysis
  ctx.log('info', 'Conducting conceptual analysis');
  const conceptualAnalysis = await ctx.task(conceptualAnalysisTask, {
    clarifiedQuestion: questionClarification.clarified,
    keyConcepts: questionClarification.keyConcepts,
    outputDir
  });

  artifacts.push(...conceptualAnalysis.artifacts);

  // Task 4: Thought Experiment Development (if requested)
  let thoughtExperiments = null;
  if (useThoughtExperiments) {
    ctx.log('info', 'Developing thought experiments');
    thoughtExperiments = await ctx.task(thoughtExperimentTask, {
      clarifiedQuestion: questionClarification.clarified,
      conceptualFindings: conceptualAnalysis.findings,
      outputDir
    });
    artifacts.push(...thoughtExperiments.artifacts);
  }

  // Task 5: Argument Analysis and Evaluation
  ctx.log('info', 'Analyzing and evaluating arguments');
  const argumentAnalysis = await ctx.task(argumentAnalysisTask, {
    traditionResponses: traditionSurvey.responses,
    conceptualFindings: conceptualAnalysis.findings,
    thoughtExperiments: thoughtExperiments?.experiments,
    outputDir
  });

  artifacts.push(...argumentAnalysis.artifacts);

  // Task 6: Position Development
  ctx.log('info', 'Developing philosophical position');
  const positionDevelopment = await ctx.task(positionDevelopmentTask, {
    question: questionClarification.clarified,
    traditionSurvey,
    conceptualAnalysis,
    argumentAnalysis,
    outputDir
  });

  artifacts.push(...positionDevelopment.artifacts);

  // Breakpoint: Review ontological analysis
  await ctx.breakpoint({
    question: `Ontological analysis complete. Examined ${metaphysicalTraditions.length} traditions. Review the analysis?`,
    title: 'Ontological Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        question: questionClarification.clarified.coreQuestion,
        traditionsExamined: metaphysicalTraditions,
        keyConceptsAnalyzed: questionClarification.keyConcepts.length,
        thoughtExperimentsUsed: useThoughtExperiments
      }
    }
  });

  // Task 7: Generate Ontological Report
  ctx.log('info', 'Generating ontological analysis report');
  const ontologicalReport = await ctx.task(ontologicalReportTask, {
    ontologicalQuestion,
    questionClarification,
    traditionSurvey,
    conceptualAnalysis,
    thoughtExperiments,
    argumentAnalysis,
    positionDevelopment,
    outputDir
  });

  artifacts.push(...ontologicalReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    ontologicalInvestigation: {
      question: ontologicalQuestion,
      clarifiedQuestion: questionClarification.clarified,
      keyConcepts: questionClarification.keyConcepts,
      conceptualAnalysis: conceptualAnalysis.findings
    },
    metaphysicalFindings: {
      traditionResponses: traditionSurvey.responses,
      thoughtExperiments: thoughtExperiments?.experiments,
      arguments: argumentAnalysis.arguments
    },
    philosophicalPosition: {
      position: positionDevelopment.position,
      justification: positionDevelopment.justification,
      objections: positionDevelopment.objections,
      responses: positionDevelopment.responses
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/ontological-analysis',
      timestamp: startTime,
      metaphysicalTraditions,
      outputDir
    }
  };
}

// Task 1: Question Clarification
export const questionClarificationTask = defineTask('question-clarification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify the ontological question',
  agent: {
    name: 'ontological-analyst',
    prompt: {
      role: 'metaphysician',
      task: 'Clarify and precisely formulate the ontological question',
      context: args,
      instructions: [
        'Identify the core ontological question',
        'Distinguish from epistemological or semantic questions',
        'Identify key ontological concepts involved',
        'Note presuppositions of the question',
        'Identify the type of being or existence at issue',
        'Frame the question within ontological categories',
        'Note any ambiguities requiring resolution',
        'Save clarification to output directory'
      ],
      outputFormat: 'JSON with success, clarified (coreQuestion, type, presuppositions), keyConcepts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'clarified', 'keyConcepts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        clarified: {
          type: 'object',
          properties: {
            coreQuestion: { type: 'string' },
            questionType: { type: 'string' },
            ontologicalCategory: { type: 'string' },
            presuppositions: { type: 'array', items: { type: 'string' } },
            ambiguities: { type: 'array', items: { type: 'string' } }
          }
        },
        keyConcepts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ontology', 'clarification']
}));

// Task 2: Tradition Survey
export const traditionSurveyTask = defineTask('tradition-survey', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Survey metaphysical traditions',
  agent: {
    name: 'metaphysics-historian',
    prompt: {
      role: 'historian of metaphysics',
      task: 'Survey how different metaphysical traditions address the question',
      context: args,
      instructions: [
        'For each tradition: identify key figures and positions',
        'Present classical responses (Plato, Aristotle, etc.)',
        'Present modern responses (Descartes, Leibniz, etc.)',
        'Present contemporary analytic responses',
        'Present continental approaches if relevant',
        'Note key arguments from each tradition',
        'Identify points of agreement and disagreement',
        'Save tradition survey to output directory'
      ],
      outputFormat: 'JSON with responses (byTradition), agreements, disagreements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'artifacts'],
      properties: {
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tradition: { type: 'string' },
              keyFigures: { type: 'array', items: { type: 'string' } },
              position: { type: 'string' },
              keyArguments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        agreements: { type: 'array', items: { type: 'string' } },
        disagreements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ontology', 'traditions']
}));

// Task 3: Conceptual Analysis
export const conceptualAnalysisTask = defineTask('conceptual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct conceptual analysis',
  agent: {
    name: 'conceptual-analyst',
    prompt: {
      role: 'analytic metaphysician',
      task: 'Conduct rigorous conceptual analysis of key ontological concepts',
      context: args,
      instructions: [
        'Analyze necessary and sufficient conditions for concepts',
        'Identify conceptual connections and dependencies',
        'Test conceptual boundaries with counterexamples',
        'Distinguish different senses or uses of concepts',
        'Analyze conceptual primitives vs. derived concepts',
        'Consider modal properties of concepts',
        'Note conceptual innovations needed',
        'Save conceptual analysis to output directory'
      ],
      outputFormat: 'JSON with findings (conceptAnalyses, connections, boundaries), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            conceptAnalyses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  necessaryConditions: { type: 'array', items: { type: 'string' } },
                  sufficientConditions: { type: 'array', items: { type: 'string' } },
                  counterexamples: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            conceptualConnections: { type: 'array', items: { type: 'string' } },
            primitives: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'ontology', 'conceptual-analysis']
}));

// Task 4: Thought Experiment
export const thoughtExperimentTask = defineTask('thought-experiment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop thought experiments',
  agent: {
    name: 'thought-experimenter',
    prompt: {
      role: 'metaphysician',
      task: 'Develop and analyze thought experiments relevant to the question',
      context: args,
      instructions: [
        'Develop thought experiments to test intuitions',
        'Present classic thought experiments if relevant',
        'Construct novel scenarios to probe the question',
        'Analyze what intuitions the experiments reveal',
        'Consider objections to thought experiment methodology',
        'Note any conflicting intuitions',
        'Assess the evidential value of experiments',
        'Save thought experiments to output directory'
      ],
      outputFormat: 'JSON with experiments (scenario, intuitions, analysis), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['experiments', 'artifacts'],
      properties: {
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scenario: { type: 'string' },
              question: { type: 'string' },
              intuitions: { type: 'array', items: { type: 'string' } },
              analysis: { type: 'string' },
              objections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        methodologicalNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ontology', 'thought-experiment']
}));

// Task 5: Argument Analysis
export const argumentAnalysisTask = defineTask('argument-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and evaluate arguments',
  agent: {
    name: 'argument-analyst',
    prompt: {
      role: 'metaphysician',
      task: 'Analyze and evaluate the main arguments on the ontological question',
      context: args,
      instructions: [
        'Identify main arguments for different positions',
        'Reconstruct arguments in valid form',
        'Evaluate premise plausibility',
        'Identify strongest arguments',
        'Note major objections to each argument',
        'Assess the dialectical situation',
        'Identify any decisive considerations',
        'Save argument analysis to output directory'
      ],
      outputFormat: 'JSON with arguments (reconstruction, evaluation, objections), dialecticalAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments', 'artifacts'],
      properties: {
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              position: { type: 'string' },
              reconstruction: { type: 'string' },
              premiseEvaluation: { type: 'object' },
              strength: { type: 'string' },
              objections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dialecticalAssessment: { type: 'string' },
        strongestArguments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ontology', 'arguments']
}));

// Task 6: Position Development
export const positionDevelopmentTask = defineTask('position-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop philosophical position',
  agent: {
    name: 'position-developer',
    prompt: {
      role: 'metaphysician',
      task: 'Develop a reasoned philosophical position on the ontological question',
      context: args,
      instructions: [
        'Synthesize findings into a coherent position',
        'State the position clearly',
        'Provide justification drawing on analysis',
        'Anticipate major objections',
        'Develop responses to objections',
        'Note any remaining uncertainties',
        'Consider implications of the position',
        'Save position development to output directory'
      ],
      outputFormat: 'JSON with position, justification, objections, responses, implications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['position', 'justification', 'artifacts'],
      properties: {
        position: { type: 'string' },
        justification: { type: 'string' },
        objections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
              source: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              toObjection: { type: 'string' },
              response: { type: 'string' }
            }
          }
        },
        uncertainties: { type: 'array', items: { type: 'string' } },
        implications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ontology', 'position']
}));

// Task 7: Ontological Report
export const ontologicalReportTask = defineTask('ontological-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ontological analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'metaphysician and technical writer',
      task: 'Generate comprehensive ontological analysis report',
      context: args,
      instructions: [
        'Create executive summary with position',
        'Present the ontological question',
        'Document conceptual analysis',
        'Present tradition survey',
        'Include thought experiments if developed',
        'Present argument analysis',
        'Detail the philosophical position',
        'Include objections and responses',
        'Note implications and further questions',
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
  labels: ['agent', 'philosophy', 'ontology', 'reporting']
}));
