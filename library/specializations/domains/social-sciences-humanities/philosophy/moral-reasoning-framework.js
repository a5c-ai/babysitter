/**
 * @process philosophy/moral-reasoning-framework
 * @description Apply systematic moral reasoning using principlism, casuistry, or other ethical decision-making frameworks to evaluate actions and policies
 * @inputs { moralQuestion: string, framework: string, contextDetails: object, outputDir: string }
 * @outputs { success: boolean, reasoningProcess: object, moralJudgment: object, justification: string, artifacts: array }
 * @recommendedSkills SK-PHIL-003 (ethical-framework-application), SK-PHIL-012 (bioethics-deliberation), SK-PHIL-007 (evidence-justification-assessment)
 * @recommendedAgents AG-PHIL-002 (ethics-consultant-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    moralQuestion,
    framework = 'principlism',
    contextDetails = {},
    outputDir = 'moral-reasoning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Moral Question Clarification
  ctx.log('info', 'Starting moral reasoning: Clarifying the moral question');
  const questionClarification = await ctx.task(questionClarificationTask, {
    moralQuestion,
    contextDetails,
    outputDir
  });

  if (!questionClarification.success) {
    return {
      success: false,
      error: 'Question clarification failed',
      details: questionClarification,
      metadata: { processId: 'philosophy/moral-reasoning-framework', timestamp: startTime }
    };
  }

  artifacts.push(...questionClarification.artifacts);

  // Task 2: Framework Setup
  ctx.log('info', `Setting up ${framework} framework`);
  const frameworkSetup = await ctx.task(frameworkSetupTask, {
    framework,
    clarifiedQuestion: questionClarification.clarified,
    outputDir
  });

  artifacts.push(...frameworkSetup.artifacts);

  // Task 3: Principle/Precedent Identification
  ctx.log('info', 'Identifying relevant principles or precedents');
  const principleIdentification = await ctx.task(principleIdentificationTask, {
    framework,
    question: questionClarification.clarified,
    frameworkComponents: frameworkSetup.components,
    outputDir
  });

  artifacts.push(...principleIdentification.artifacts);

  // Task 4: Application and Balancing
  ctx.log('info', 'Applying principles and balancing considerations');
  const applicationProcess = await ctx.task(applicationProcessTask, {
    framework,
    question: questionClarification.clarified,
    principles: principleIdentification.principles,
    contextDetails,
    outputDir
  });

  artifacts.push(...applicationProcess.artifacts);

  // Task 5: Judgment Formation
  ctx.log('info', 'Forming moral judgment');
  const judgmentFormation = await ctx.task(judgmentFormationTask, {
    framework,
    applicationResults: applicationProcess.results,
    question: questionClarification.clarified,
    outputDir
  });

  artifacts.push(...judgmentFormation.artifacts);

  // Breakpoint: Review reasoning results
  await ctx.breakpoint({
    question: `Moral reasoning complete using ${framework}. Judgment: ${judgmentFormation.judgment.verdict}. Review the reasoning process?`,
    title: 'Moral Reasoning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        framework,
        verdict: judgmentFormation.judgment.verdict,
        confidence: judgmentFormation.judgment.confidence,
        principlesApplied: principleIdentification.principles.length
      }
    }
  });

  // Task 6: Generate Reasoning Report
  ctx.log('info', 'Generating moral reasoning report');
  const reasoningReport = await ctx.task(reasoningReportTask, {
    moralQuestion,
    questionClarification,
    frameworkSetup,
    principleIdentification,
    applicationProcess,
    judgmentFormation,
    framework,
    outputDir
  });

  artifacts.push(...reasoningReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    reasoningProcess: {
      framework,
      clarifiedQuestion: questionClarification.clarified,
      principlesUsed: principleIdentification.principles,
      balancingProcess: applicationProcess.results,
      reasoningSteps: applicationProcess.steps
    },
    moralJudgment: judgmentFormation.judgment,
    justification: judgmentFormation.justification,
    dissent: judgmentFormation.dissent,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/moral-reasoning-framework',
      timestamp: startTime,
      framework,
      outputDir
    }
  };
}

// Task 1: Question Clarification
export const questionClarificationTask = defineTask('question-clarification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify the moral question',
  agent: {
    name: 'moral-analyst',
    prompt: {
      role: 'moral philosopher',
      task: 'Clarify and precisely formulate the moral question to be addressed',
      context: args,
      instructions: [
        'Identify the core moral question or dilemma',
        'Distinguish factual questions from normative questions',
        'Identify any ambiguities in the question',
        'Clarify key terms and concepts',
        'Specify the decision context and constraints',
        'Identify what kind of answer is sought (permissibility, obligation, etc.)',
        'Note any hidden assumptions in the question',
        'Save clarification to output directory'
      ],
      outputFormat: 'JSON with success, clarified (question, type, scope), ambiguities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'clarified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        clarified: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            questionType: { type: 'string' },
            scope: { type: 'string' },
            keyTerms: { type: 'object' },
            decisionContext: { type: 'string' }
          }
        },
        ambiguities: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'moral-reasoning', 'clarification']
}));

// Task 2: Framework Setup
export const frameworkSetupTask = defineTask('framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up ethical decision-making framework',
  agent: {
    name: 'framework-expert',
    prompt: {
      role: 'moral philosopher',
      task: 'Set up the specified ethical framework for systematic reasoning',
      context: args,
      instructions: [
        'For principlism: set up autonomy, beneficence, non-maleficence, justice',
        'For casuistry: identify paradigm cases and analogical reasoning structure',
        'For reflective equilibrium: set up considered judgments and principles',
        'For discourse ethics: establish ideal speech conditions',
        'Document the framework methodology and steps',
        'Identify framework-specific considerations',
        'Note framework limitations for this type of question',
        'Save framework setup to output directory'
      ],
      outputFormat: 'JSON with components (principles, methodology, steps), limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'methodology', 'artifacts'],
      properties: {
        components: {
          type: 'object',
          properties: {
            principles: { type: 'array', items: { type: 'string' } },
            paradigmCases: { type: 'array', items: { type: 'string' } },
            procedureSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        methodology: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'moral-reasoning', 'framework']
}));

// Task 3: Principle Identification
export const principleIdentificationTask = defineTask('principle-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify relevant principles or precedents',
  agent: {
    name: 'principle-analyst',
    prompt: {
      role: 'moral philosopher',
      task: 'Identify principles, precedents, or considered judgments relevant to the question',
      context: args,
      instructions: [
        'For principlism: specify how each principle applies',
        'For casuistry: identify paradigm cases and their features',
        'Identify relevant moral rules and norms',
        'Note any competing principles or precedents',
        'Assess initial weight or priority of principles',
        'Identify any specification of principles needed',
        'Consider principle interactions',
        'Save principle identification to output directory'
      ],
      outputFormat: 'JSON with principles (name, content, relevance, weight), precedents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['principles', 'artifacts'],
      properties: {
        principles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              content: { type: 'string' },
              relevance: { type: 'string' },
              initialWeight: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        precedents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
              verdict: { type: 'string' }
            }
          }
        },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'moral-reasoning', 'principles']
}));

// Task 4: Application Process
export const applicationProcessTask = defineTask('application-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply principles and balance considerations',
  agent: {
    name: 'moral-reasoner',
    prompt: {
      role: 'moral philosopher',
      task: 'Apply the framework principles to the specific case and balance competing considerations',
      context: args,
      instructions: [
        'Apply each principle to the specific case',
        'For principlism: use specification and balancing',
        'For casuistry: reason by analogy from paradigm cases',
        'Identify which principles support which actions',
        'Weigh competing principles in context',
        'Document the balancing reasoning',
        'Consider relevant contextual features',
        'Save application process to output directory'
      ],
      outputFormat: 'JSON with results (applications, balancing), steps, weights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'steps', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            principleApplications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  principle: { type: 'string' },
                  application: { type: 'string' },
                  supports: { type: 'string' }
                }
              }
            },
            balancingConsiderations: { type: 'array', items: { type: 'string' } },
            finalWeights: { type: 'object' }
          }
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' },
              reasoning: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'moral-reasoning', 'application']
}));

// Task 5: Judgment Formation
export const judgmentFormationTask = defineTask('judgment-formation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Form moral judgment',
  agent: {
    name: 'moral-judge',
    prompt: {
      role: 'moral philosopher',
      task: 'Form a considered moral judgment based on the reasoning process',
      context: args,
      instructions: [
        'Reach a verdict on the moral question',
        'State the judgment clearly (permissible, obligatory, wrong, etc.)',
        'Provide the justification for the judgment',
        'Assess confidence level in the judgment',
        'Note any conditions or qualifications',
        'Articulate potential dissenting positions',
        'Consider reflective equilibrium with intuitions',
        'Save judgment to output directory'
      ],
      outputFormat: 'JSON with judgment (verdict, confidence, conditions), justification, dissent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['judgment', 'justification', 'artifacts'],
      properties: {
        judgment: {
          type: 'object',
          properties: {
            verdict: { type: 'string' },
            confidence: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } },
            qualifications: { type: 'array', items: { type: 'string' } }
          }
        },
        justification: { type: 'string' },
        dissent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'string' },
              reasoning: { type: 'string' },
              response: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'moral-reasoning', 'judgment']
}));

// Task 6: Reasoning Report
export const reasoningReportTask = defineTask('reasoning-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate moral reasoning report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'moral philosopher and technical writer',
      task: 'Generate comprehensive moral reasoning report',
      context: args,
      instructions: [
        'Create executive summary with verdict',
        'Present the moral question and clarification',
        'Document the framework and methodology',
        'Present identified principles and their relevance',
        'Detail the application and balancing process',
        'Present the moral judgment with full justification',
        'Include dissenting views and responses',
        'Note limitations and caveats',
        'Format as professional Markdown report',
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
  labels: ['agent', 'philosophy', 'moral-reasoning', 'reporting']
}));
