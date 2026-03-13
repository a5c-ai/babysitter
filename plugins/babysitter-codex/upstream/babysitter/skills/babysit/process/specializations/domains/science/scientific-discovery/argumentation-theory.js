/**
 * @process scientific-discovery/argumentation-theory
 * @description Evaluate competing arguments via attack/defense relations using formal argumentation frameworks
 * @inputs { arguments: array, attackRelations: array, supportRelations: array, semantics: string, queries: array, outputDir: string }
 * @outputs { success: boolean, acceptedArguments: array, rejectedArguments: array, extensions: array, argumentEvaluations: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    arguments: argumentList = [],
    attackRelations = [],
    supportRelations = [],
    semantics = 'preferred', // grounded, complete, preferred, stable
    queries = [],
    outputDir = 'argumentation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Argumentation Theory Process');

  // ============================================================================
  // PHASE 1: ARGUMENT FRAMEWORK CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Constructing argumentation framework');
  const frameworkConstruction = await ctx.task(frameworkConstructionTask, {
    arguments: argumentList,
    attackRelations,
    supportRelations,
    outputDir
  });

  artifacts.push(...frameworkConstruction.artifacts);

  // ============================================================================
  // PHASE 2: ATTACK GRAPH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing attack graph');
  const attackAnalysis = await ctx.task(attackGraphAnalysisTask, {
    framework: frameworkConstruction.framework,
    outputDir
  });

  artifacts.push(...attackAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DEFENSE AND REINSTATEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing defense and reinstatement');
  const defenseComputation = await ctx.task(defenseComputationTask, {
    framework: frameworkConstruction.framework,
    attackGraph: attackAnalysis.graph,
    outputDir
  });

  artifacts.push(...defenseComputation.artifacts);

  // ============================================================================
  // PHASE 4: EXTENSION COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Computing extensions under semantics');
  const extensionComputation = await ctx.task(extensionComputationTask, {
    framework: frameworkConstruction.framework,
    defenseRelations: defenseComputation.defenses,
    semantics,
    outputDir
  });

  artifacts.push(...extensionComputation.artifacts);

  // ============================================================================
  // PHASE 5: ARGUMENT ACCEPTABILITY
  // ============================================================================

  ctx.log('info', 'Phase 5: Determining argument acceptability');
  const acceptability = await ctx.task(argumentAcceptabilityTask, {
    extensions: extensionComputation.extensions,
    framework: frameworkConstruction.framework,
    semantics,
    outputDir
  });

  artifacts.push(...acceptability.artifacts);

  // ============================================================================
  // PHASE 6: DIALECTICAL STATUS
  // ============================================================================

  ctx.log('info', 'Phase 6: Computing dialectical status');
  const dialecticalStatus = await ctx.task(dialecticalStatusTask, {
    framework: frameworkConstruction.framework,
    acceptability: acceptability.status,
    extensions: extensionComputation.extensions,
    outputDir
  });

  artifacts.push(...dialecticalStatus.artifacts);

  // ============================================================================
  // PHASE 7: QUERY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating argumentation queries');
  const queryEvaluation = await ctx.task(argumentationQueryTask, {
    queries,
    acceptability: acceptability.status,
    dialecticalStatus: dialecticalStatus.status,
    extensions: extensionComputation.extensions,
    outputDir
  });

  artifacts.push(...queryEvaluation.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(argumentationQualityTask, {
    frameworkConstruction,
    attackAnalysis,
    extensionComputation,
    acceptability,
    dialecticalStatus,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review argumentation results
  await ctx.breakpoint({
    question: `Argumentation analysis complete. Quality score: ${qualityScore.overallScore}/100. Accepted: ${acceptability.accepted.length}, Rejected: ${acceptability.rejected.length}. ${qualityMet ? 'Quality meets standards!' : 'Review attack relations and semantics.'} Review results?`,
    title: 'Argumentation Theory Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        argumentsCount: argumentList.length,
        attacksCount: attackRelations.length,
        extensionsCount: extensionComputation.extensions.length,
        acceptedCount: acceptability.accepted.length,
        rejectedCount: acceptability.rejected.length,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(argumentationReportTask, {
    frameworkConstruction,
    attackAnalysis,
    defenseComputation,
    extensionComputation,
    acceptability,
    dialecticalStatus,
    queryEvaluation,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    acceptedArguments: acceptability.accepted,
    rejectedArguments: acceptability.rejected,
    extensions: extensionComputation.extensions,
    argumentEvaluations: dialecticalStatus.status,
    queryAnswers: queryEvaluation.answers,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/argumentation-theory',
      timestamp: startTime,
      outputDir,
      semantics
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Framework Construction
export const frameworkConstructionTask = defineTask('framework-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct argumentation framework',
  agent: {
    name: 'framework-construction-agent',
    prompt: {
      role: 'argumentation framework specialist',
      task: 'Construct formal argumentation framework from arguments and relations',
      context: args,
      instructions: [
        'Parse arguments into formal structure (premises, conclusion)',
        'Build Dung argumentation framework: AF = (Args, attacks)',
        'If support relations provided, build bipolar AF',
        'Validate all relations reference existing arguments',
        'Build argument graph with attack edges',
        'Identify self-attacking arguments',
        'Identify argument clusters',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), argumentGraph (object), properties (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'argumentGraph', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            arguments: { type: 'array' },
            attacks: { type: 'array' },
            supports: { type: 'array' }
          }
        },
        argumentGraph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' }
          }
        },
        properties: {
          type: 'object',
          properties: {
            argumentCount: { type: 'number' },
            attackCount: { type: 'number' },
            isBipolar: { type: 'boolean' }
          }
        },
        selfAttacking: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'framework']
}));

// Task 2: Attack Graph Analysis
export const attackGraphAnalysisTask = defineTask('attack-graph-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze attack graph structure',
  agent: {
    name: 'attack-graph-agent',
    prompt: {
      role: 'graph analysis specialist',
      task: 'Analyze the structure of the attack graph',
      context: args,
      instructions: [
        'Compute in-degree and out-degree for each argument',
        'Find arguments with no attackers (initial arguments)',
        'Find arguments with no attackees (terminal arguments)',
        'Identify attack cycles',
        'Identify strongly connected components',
        'Compute attack paths between arguments',
        'Identify controversial arguments (many attackers/attackees)',
        'Save attack analysis to output directory'
      ],
      outputFormat: 'JSON with graph (object), initialArguments (array), terminalArguments (array), cycles (array), sccs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['graph', 'initialArguments', 'artifacts'],
      properties: {
        graph: {
          type: 'object',
          properties: {
            inDegree: { type: 'object' },
            outDegree: { type: 'object' }
          }
        },
        initialArguments: { type: 'array', items: { type: 'string' } },
        terminalArguments: { type: 'array', items: { type: 'string' } },
        cycles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              arguments: { type: 'array' },
              length: { type: 'number' }
            }
          }
        },
        sccs: { type: 'array' },
        controversialArguments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'attack-graph']
}));

// Task 3: Defense Computation
export const defenseComputationTask = defineTask('defense-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute defense and reinstatement',
  agent: {
    name: 'defense-computation-agent',
    prompt: {
      role: 'defense relation specialist',
      task: 'Compute defense relations and reinstatement',
      context: args,
      instructions: [
        'Set S defends argument a if S attacks all attackers of a',
        'Compute defense function F(S) = {a : S defends a}',
        'Identify arguments defended by empty set',
        'Build defense tree for each argument',
        'Compute reinstatement: a reinstated if attacker is defeated',
        'Track defense chains',
        'Identify undefendable arguments',
        'Save defense computation to output directory'
      ],
      outputFormat: 'JSON with defenses (object), defendedBy (object), reinstatement (array), undefendable (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['defenses', 'defendedBy', 'artifacts'],
      properties: {
        defenses: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        defendedBy: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        reinstatement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              argument: { type: 'string' },
              reinstatedBy: { type: 'array' }
            }
          }
        },
        undefendable: { type: 'array', items: { type: 'string' } },
        defenseTrees: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'defense']
}));

// Task 4: Extension Computation
export const extensionComputationTask = defineTask('extension-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute extensions under semantics',
  agent: {
    name: 'extension-computation-agent',
    prompt: {
      role: 'argumentation semantics specialist',
      task: 'Compute extensions under the specified semantics',
      context: args,
      instructions: [
        'Compute based on semantics:',
        '- Grounded: unique minimal complete extension',
        '- Complete: conflict-free + defends all its members',
        '- Preferred: maximal complete extensions',
        '- Stable: conflict-free + attacks all non-members',
        'Conflict-free: no internal attacks',
        'Admissible: conflict-free + defends its members',
        'Find all extensions under chosen semantics',
        'Track computation steps',
        'Save extensions to output directory'
      ],
      outputFormat: 'JSON with extensions (array), semantics (string), groundedExtension (array), computationSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extensions', 'semantics', 'artifacts'],
      properties: {
        extensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              arguments: { type: 'array' },
              type: { type: 'string' }
            }
          }
        },
        semantics: { type: 'string' },
        groundedExtension: { type: 'array', items: { type: 'string' } },
        computationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              result: { type: 'array' }
            }
          }
        },
        extensionCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'extensions']
}));

// Task 5: Argument Acceptability
export const argumentAcceptabilityTask = defineTask('argument-acceptability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine argument acceptability',
  agent: {
    name: 'argument-acceptability-agent',
    prompt: {
      role: 'acceptability analysis specialist',
      task: 'Determine which arguments are accepted, rejected, or undecided',
      context: args,
      instructions: [
        'Skeptically accepted: in ALL extensions',
        'Credulously accepted: in SOME extensions',
        'Rejected: in NO extensions',
        'Undecided: in some but not all extensions',
        'Compute acceptance status for each argument',
        'Rank arguments by acceptance strength',
        'Identify core accepted arguments',
        'Save acceptability status to output directory'
      ],
      outputFormat: 'JSON with status (object), accepted (array), rejected (array), undecided (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'accepted', 'rejected', 'artifacts'],
      properties: {
        status: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              skeptical: { type: 'boolean' },
              credulous: { type: 'boolean' },
              extensionCount: { type: 'number' }
            }
          }
        },
        accepted: { type: 'array', items: { type: 'string' } },
        rejected: { type: 'array', items: { type: 'string' } },
        undecided: { type: 'array', items: { type: 'string' } },
        acceptanceRanking: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'acceptability']
}));

// Task 6: Dialectical Status
export const dialecticalStatusTask = defineTask('dialectical-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute dialectical status',
  agent: {
    name: 'dialectical-status-agent',
    prompt: {
      role: 'dialectical analysis specialist',
      task: 'Compute detailed dialectical status for each argument',
      context: args,
      instructions: [
        'Build dialectical tree for each argument',
        'Proponent (PRO) and opponent (OPP) alternate',
        'Mark nodes as WIN/LOSE based on children',
        'Argument accepted if PRO wins dialectical game',
        'Compute argument strength based on tree structure',
        'Identify winning strategies',
        'Summarize dialectical outcomes',
        'Save dialectical status to output directory'
      ],
      outputFormat: 'JSON with status (object), dialecticalTrees (object), winningStrategies (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'dialecticalTrees', 'artifacts'],
      properties: {
        status: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              dialecticalOutcome: { type: 'string' },
              strength: { type: 'number' },
              treeDepth: { type: 'number' }
            }
          }
        },
        dialecticalTrees: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              root: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        winningStrategies: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'argumentation', 'dialectical']
}));

// Task 7: Argumentation Query Evaluation
export const argumentationQueryTask = defineTask('argumentation-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate argumentation queries',
  agent: {
    name: 'argumentation-query-agent',
    prompt: {
      role: 'argumentation query specialist',
      task: 'Evaluate queries about argument acceptance and relations',
      context: args,
      instructions: [
        'Parse argumentation queries',
        'Answer acceptance queries: Is argument A accepted?',
        'Answer comparison queries: Is A stronger than B?',
        'Answer relation queries: Does A attack B?',
        'Provide justification for answers',
        'Handle hypothetical queries',
        'Track query answering reasoning',
        'Save query evaluation to output directory'
      ],
      outputFormat: 'JSON with answers (object), justifications (object), unanswered (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['answers', 'justifications', 'artifacts'],
      properties: {
        answers: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        justifications: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        unanswered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'argumentation', 'query']
}));

// Task 8: Quality Assessment
export const argumentationQualityTask = defineTask('argumentation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of argumentation analysis',
  agent: {
    name: 'argumentation-quality-agent',
    prompt: {
      role: 'argumentation methodology reviewer',
      task: 'Assess quality and validity of argumentation analysis',
      context: args,
      instructions: [
        'Evaluate framework construction (weight: 20%)',
        'Assess attack graph analysis (weight: 15%)',
        'Check extension computation correctness (weight: 25%)',
        'Evaluate acceptability computation (weight: 20%)',
        'Assess dialectical analysis (weight: 20%)',
        'Verify semantics applied correctly',
        'Check for proper handling of cycles',
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
            frameworkConstruction: { type: 'number' },
            attackAnalysis: { type: 'number' },
            extensionComputation: { type: 'number' },
            acceptability: { type: 'number' },
            dialecticalAnalysis: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'argumentation', 'quality']
}));

// Task 9: Report Generation
export const argumentationReportTask = defineTask('argumentation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate argumentation analysis report',
  agent: {
    name: 'argumentation-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on argumentation analysis',
      context: args,
      instructions: [
        'Create executive summary of argumentation results',
        'Document argumentation framework',
        'Present attack graph analysis',
        'Explain defense and reinstatement',
        'Present extensions under chosen semantics',
        'Show argument acceptability',
        'Explain dialectical status',
        'Include argumentation graph visualizations',
        'Present query answers',
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
  labels: ['agent', 'scientific-discovery', 'argumentation', 'reporting']
}));
