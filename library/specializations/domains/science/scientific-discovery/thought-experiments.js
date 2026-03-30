/**
 * @process scientific-discovery/thought-experiments
 * @description Thought Experiments process - Design and conduct imagined experiments to explore theoretical consequences and gain insight
 * @inputs { theory: object, question: string, constraints: array, outputDir: string }
 * @outputs { success: boolean, thoughtExperiment: object, conclusions: array, implications: array, paradoxes: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    theory = {},
    question = '',
    constraints = [],
    outputDir = 'thought-experiment-output',
    explorationDepth = 'thorough'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Thought Experiment Process');

  // ============================================================================
  // PHASE 1: QUESTION FORMULATION AND THEORY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formulating question and identifying relevant theory');
  const questionFormulation = await ctx.task(questionFormulationTask, {
    theory,
    question,
    constraints,
    outputDir
  });

  artifacts.push(...questionFormulation.artifacts);

  // ============================================================================
  // PHASE 2: THOUGHT EXPERIMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing thought experiment');
  const experimentDesign = await ctx.task(thoughtExperimentDesignTask, {
    refinedQuestion: questionFormulation.refinedQuestion,
    relevantPrinciples: questionFormulation.relevantPrinciples,
    constraints,
    outputDir
  });

  artifacts.push(...experimentDesign.artifacts);

  // ============================================================================
  // PHASE 3: IDEALIZATION AND SIMPLIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing idealizations and simplifications');
  const idealizationSetup = await ctx.task(idealizationSetupTask, {
    thoughtExperiment: experimentDesign.thoughtExperiment,
    constraints,
    outputDir
  });

  artifacts.push(...idealizationSetup.artifacts);

  // Breakpoint: Review thought experiment setup
  await ctx.breakpoint({
    question: `Thought experiment "${experimentDesign.thoughtExperiment.name}" designed. ${idealizationSetup.idealizations.length} idealizations established. Proceed with logical exploration?`,
    title: 'Thought Experiment Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        experimentName: experimentDesign.thoughtExperiment.name,
        question: questionFormulation.refinedQuestion,
        idealizationCount: idealizationSetup.idealizations.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: LOGICAL EXPLORATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Exploring logical consequences');
  const logicalExploration = await ctx.task(logicalExplorationTask, {
    thoughtExperiment: experimentDesign.thoughtExperiment,
    idealizations: idealizationSetup.idealizations,
    relevantPrinciples: questionFormulation.relevantPrinciples,
    outputDir
  });

  artifacts.push(...logicalExploration.artifacts);

  // ============================================================================
  // PHASE 5: PARADOX AND CONTRADICTION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Detecting paradoxes and contradictions');
  const paradoxDetection = await ctx.task(paradoxDetectionTask, {
    conclusions: logicalExploration.conclusions,
    relevantPrinciples: questionFormulation.relevantPrinciples,
    theory,
    outputDir
  });

  artifacts.push(...paradoxDetection.artifacts);

  // ============================================================================
  // PHASE 6: RESOLUTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing resolutions to paradoxes');
  const resolutionAnalysis = await ctx.task(resolutionAnalysisTask, {
    paradoxes: paradoxDetection.paradoxes,
    contradictions: paradoxDetection.contradictions,
    theory,
    idealizations: idealizationSetup.idealizations,
    outputDir
  });

  artifacts.push(...resolutionAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: IMPLICATION DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Deriving implications for theory');
  const implicationDerivation = await ctx.task(implicationDerivationTask, {
    conclusions: logicalExploration.conclusions,
    paradoxResolutions: resolutionAnalysis.resolutions,
    theory,
    question: questionFormulation.refinedQuestion,
    outputDir
  });

  artifacts.push(...implicationDerivation.artifacts);

  // ============================================================================
  // PHASE 8: INSIGHT CRYSTALLIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Crystallizing insights');
  const insightCrystallization = await ctx.task(insightCrystallizationTask, {
    thoughtExperiment: experimentDesign.thoughtExperiment,
    conclusions: logicalExploration.conclusions,
    paradoxes: paradoxDetection.paradoxes,
    resolutions: resolutionAnalysis.resolutions,
    implications: implicationDerivation.implications,
    outputDir
  });

  artifacts.push(...insightCrystallization.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Thought experiment complete. ${logicalExploration.conclusions.length} conclusions drawn. ${paradoxDetection.paradoxes.length} paradoxes found. ${insightCrystallization.insights.length} insights crystallized. Review findings?`,
    title: 'Thought Experiment Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        experimentName: experimentDesign.thoughtExperiment.name,
        conclusionCount: logicalExploration.conclusions.length,
        paradoxCount: paradoxDetection.paradoxes.length,
        insightCount: insightCrystallization.insights.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    thoughtExperiment: {
      name: experimentDesign.thoughtExperiment.name,
      description: experimentDesign.thoughtExperiment.description,
      setup: experimentDesign.thoughtExperiment.setup,
      idealizations: idealizationSetup.idealizations
    },
    question: questionFormulation.refinedQuestion,
    conclusions: logicalExploration.conclusions,
    paradoxes: paradoxDetection.paradoxes,
    resolutions: resolutionAnalysis.resolutions,
    implications: implicationDerivation.implications,
    insights: insightCrystallization.insights,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/thought-experiments',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Question Formulation
export const questionFormulationTask = defineTask('question-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate question and identify relevant theory',
  agent: {
    name: 'theoretical-physicist',
    prompt: {
      role: 'theoretical physicist and philosopher of science',
      task: 'Precisely formulate the question and identify the relevant theoretical principles',
      context: args,
      instructions: [
        'Analyze the posed question for clarity and precision',
        'Refine the question to be sharp and well-defined',
        'Identify the theoretical framework(s) involved',
        'List fundamental principles relevant to the question',
        'Note any tensions between principles',
        'Identify what the theory predicts for this scenario',
        'Document assumptions implicit in the question',
        'Clarify boundary conditions of the problem',
        'Note historical context if relevant',
        'Save question formulation to output directory'
      ],
      outputFormat: 'JSON with refinedQuestion, relevantPrinciples, theoreticalFramework, tensionsBetweenPrinciples, implicitAssumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedQuestion', 'relevantPrinciples', 'artifacts'],
      properties: {
        refinedQuestion: { type: 'string' },
        originalQuestionIssues: { type: 'array', items: { type: 'string' } },
        relevantPrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              statement: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        theoreticalFramework: { type: 'string' },
        tensionsBetweenPrinciples: { type: 'array', items: { type: 'string' } },
        implicitAssumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'question-formulation']
}));

// Task 2: Thought Experiment Design
export const thoughtExperimentDesignTask = defineTask('thought-experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design thought experiment',
  agent: {
    name: 'experiment-designer',
    prompt: {
      role: 'creative physicist and thought experiment designer',
      task: 'Design a thought experiment that illuminates the question',
      context: args,
      instructions: [
        'Design an imaginary experimental setup',
        'Make the setup vivid and easy to visualize',
        'Ensure setup isolates the phenomenon of interest',
        'Include all necessary elements (observers, apparatus, etc.)',
        'Describe initial conditions precisely',
        'Define what is measured or observed',
        'Ensure thought experiment is internally consistent',
        'Make setup as simple as possible while preserving essence',
        'Draw on classic thought experiments for inspiration',
        'Give the thought experiment a memorable name',
        'Save experiment design to output directory'
      ],
      outputFormat: 'JSON with thoughtExperiment (name, description, setup, initialConditions, observables, participants), designRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['thoughtExperiment', 'artifacts'],
      properties: {
        thoughtExperiment: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            setup: { type: 'string' },
            initialConditions: { type: 'array', items: { type: 'string' } },
            observables: { type: 'array', items: { type: 'string' } },
            participants: { type: 'array', items: { type: 'string' } },
            apparatus: { type: 'array', items: { type: 'string' } }
          }
        },
        designRationale: { type: 'string' },
        inspirations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'experiment-design']
}));

// Task 3: Idealization Setup
export const idealizationSetupTask = defineTask('idealization-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish idealizations and simplifications',
  agent: {
    name: 'idealization-specialist',
    prompt: {
      role: 'theoretical physicist specializing in idealization',
      task: 'Establish the idealizations and simplifications for the thought experiment',
      context: args,
      instructions: [
        'List all idealizations needed for the thought experiment',
        'Specify what is idealized away (friction, air resistance, etc.)',
        'Note idealizations of observers (infinite precision, no disturbance)',
        'Document idealizations of apparatus (perfect mirrors, rigid rods)',
        'Specify idealized environmental conditions',
        'Note which idealizations are essential vs convenient',
        'Identify potential issues from idealizations',
        'Ensure idealizations do not remove the phenomenon of interest',
        'Check for conflicting idealizations',
        'Save idealization setup to output directory'
      ],
      outputFormat: 'JSON with idealizations (array with what, why, essential), potentialIssues, conflictCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['idealizations', 'artifacts'],
      properties: {
        idealizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idealization: { type: 'string' },
              what: { type: 'string' },
              why: { type: 'string' },
              essential: { type: 'boolean' },
              potentialIssue: { type: 'string' }
            }
          }
        },
        environmentalConditions: { type: 'array', items: { type: 'string' } },
        observerIdealizations: { type: 'array', items: { type: 'string' } },
        conflictCheck: { type: 'boolean' },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'idealization']
}));

// Task 4: Logical Exploration
export const logicalExplorationTask = defineTask('logical-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explore logical consequences',
  agent: {
    name: 'logical-explorer',
    prompt: {
      role: 'logician and theoretical physicist',
      task: 'Systematically explore the logical consequences of the thought experiment',
      context: args,
      instructions: [
        'Apply relevant physical principles to the setup',
        'Trace logical consequences step by step',
        'Consider what each observer would measure/experience',
        'Apply conservation laws where relevant',
        'Consider symmetries and their implications',
        'Explore alternative reasoning paths',
        'Identify branch points in the reasoning',
        'Note where intuition conflicts with logic',
        'Document the chain of reasoning clearly',
        'Identify robust conclusions vs tentative ones',
        'Save logical exploration to output directory'
      ],
      outputFormat: 'JSON with conclusions (array with statement, reasoning, robustness), reasoningChain, branchPoints, intuitionConflicts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'reasoningChain', 'artifacts'],
      properties: {
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              reasoning: { type: 'string' },
              principlesUsed: { type: 'array', items: { type: 'string' } },
              robustness: { type: 'string' }
            }
          }
        },
        reasoningChain: { type: 'string' },
        branchPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              chosenPath: { type: 'string' }
            }
          }
        },
        intuitionConflicts: { type: 'array', items: { type: 'string' } },
        alternativeReasoningPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'logical-exploration']
}));

// Task 5: Paradox Detection
export const paradoxDetectionTask = defineTask('paradox-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect paradoxes and contradictions',
  agent: {
    name: 'paradox-detector',
    prompt: {
      role: 'philosopher of physics specializing in paradoxes',
      task: 'Identify any paradoxes or contradictions arising from the thought experiment',
      context: args,
      instructions: [
        'Check for logical contradictions in conclusions',
        'Identify violations of physical principles',
        'Detect paradoxes (apparent contradictions)',
        'Distinguish genuine paradoxes from pseudo-paradoxes',
        'Check for violations of causality',
        'Identify information paradoxes',
        'Check for consistency with established results',
        'Identify where different principles give different answers',
        'Note unexpected or counterintuitive results',
        'Classify severity of each paradox',
        'Save paradox analysis to output directory'
      ],
      outputFormat: 'JSON with paradoxes (array with description, type, severity), contradictions, unexpectedResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paradoxes', 'contradictions', 'artifacts'],
      properties: {
        paradoxes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              principlesInConflict: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' },
              isGenuine: { type: 'boolean' }
            }
          }
        },
        contradictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement1: { type: 'string' },
              statement2: { type: 'string' },
              nature: { type: 'string' }
            }
          }
        },
        unexpectedResults: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'paradox-detection']
}));

// Task 6: Resolution Analysis
export const resolutionAnalysisTask = defineTask('resolution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze resolutions to paradoxes',
  agent: {
    name: 'resolution-analyst',
    prompt: {
      role: 'theoretical physicist specializing in paradox resolution',
      task: 'Analyze possible resolutions to the paradoxes and contradictions found',
      context: args,
      instructions: [
        'For each paradox, identify possible resolutions',
        'Consider: flawed assumptions, flawed reasoning, missing physics',
        'Check if idealizations caused the paradox',
        'Consider if new physics is needed',
        'Evaluate each resolution for plausibility',
        'Identify which resolution is most likely correct',
        'Note if paradox reveals limits of theory',
        'Consider historical resolutions to similar paradoxes',
        'Note unresolved paradoxes and their significance',
        'Save resolution analysis to output directory'
      ],
      outputFormat: 'JSON with resolutions (array with paradoxId, possibleResolutions, likelyResolution, confidence), unresolvedParadoxes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutions', 'artifacts'],
      properties: {
        resolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              paradoxId: { type: 'string' },
              possibleResolutions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    resolution: { type: 'string' },
                    mechanism: { type: 'string' },
                    plausibility: { type: 'string' }
                  }
                }
              },
              likelyResolution: { type: 'string' },
              confidence: { type: 'number' },
              implication: { type: 'string' }
            }
          }
        },
        unresolvedParadoxes: { type: 'array', items: { type: 'string' } },
        theoryLimitsRevealed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'resolution-analysis']
}));

// Task 7: Implication Derivation
export const implicationDerivationTask = defineTask('implication-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive implications for theory',
  agent: {
    name: 'implication-analyst',
    prompt: {
      role: 'theoretical physicist and philosopher',
      task: 'Derive the implications of the thought experiment for our understanding of the theory',
      context: args,
      instructions: [
        'What does the thought experiment reveal about the theory?',
        'Does it support or challenge the theory?',
        'What constraints does it place on interpretations?',
        'Does it suggest modifications to the theory?',
        'Does it reveal hidden assumptions in the theory?',
        'What new questions does it raise?',
        'Does it suggest new experiments (real or gedanken)?',
        'How does it connect to other theoretical questions?',
        'What are the philosophical implications?',
        'Save implications to output directory'
      ],
      outputFormat: 'JSON with implications (array with implication, type, significance), newQuestions, suggestedExperiments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              implication: { type: 'string' },
              type: { type: 'string' },
              forTheory: { type: 'string' },
              significance: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        hiddenAssumptions: { type: 'array', items: { type: 'string' } },
        newQuestions: { type: 'array', items: { type: 'string' } },
        suggestedExperiments: { type: 'array', items: { type: 'string' } },
        philosophicalImplications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'implication-derivation']
}));

// Task 8: Insight Crystallization
export const insightCrystallizationTask = defineTask('insight-crystallization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Crystallize insights',
  agent: {
    name: 'insight-crystallizer',
    prompt: {
      role: 'senior physicist and science communicator',
      task: 'Crystallize the key insights from the thought experiment into clear, memorable takeaways',
      context: args,
      instructions: [
        'Identify the key insights from the analysis',
        'Distill each insight to its essence',
        'Phrase insights clearly and memorably',
        'Rank insights by importance',
        'Note which insights are novel vs confirmatory',
        'Identify the "aha moment" of the thought experiment',
        'Connect insights to intuitive understanding',
        'Note insights that could be taught',
        'Identify insights requiring further investigation',
        'Save crystallized insights to output directory'
      ],
      outputFormat: 'JSON with insights (array with insight, essence, importance, novelty), ahaMoment, teachableInsights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              essence: { type: 'string' },
              importance: { type: 'string' },
              novelty: { type: 'string' },
              intuitiveMeaning: { type: 'string' }
            }
          }
        },
        ahaMoment: { type: 'string' },
        teachableInsights: { type: 'array', items: { type: 'string' } },
        furtherInvestigation: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'thought-experiments', 'insight-crystallization']
}));
