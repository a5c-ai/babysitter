/**
 * @process scientific-discovery/qualitative-probability-reasoning
 * @description Use ordinal disbelief ranks instead of numeric probabilities for reasoning under uncertainty
 * @inputs { propositions: array, rankingAssignments: object, defaultRules: array, evidenceItems: array, outputDir: string }
 * @outputs { success: boolean, beliefRanks: object, conditionalRanks: object, inferences: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    propositions = [],
    rankingAssignments = {},
    defaultRules = [],
    evidenceItems = [],
    outputDir = 'qualitative-probability-output',
    rankingScale = 'ordinal'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Qualitative Probability Reasoning Process');

  // ============================================================================
  // PHASE 1: RANKING FUNCTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up ordinal ranking function');
  const rankingSetup = await ctx.task(rankingSetupTask, {
    propositions,
    rankingAssignments,
    rankingScale,
    outputDir
  });

  artifacts.push(...rankingSetup.artifacts);

  // ============================================================================
  // PHASE 2: DEFAULT RULE ENCODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Encoding default rules as ranking constraints');
  const ruleEncoding = await ctx.task(defaultRuleEncodingTask, {
    defaultRules,
    rankingFunction: rankingSetup.rankingFunction,
    propositions,
    outputDir
  });

  artifacts.push(...ruleEncoding.artifacts);

  // ============================================================================
  // PHASE 3: RANKING PROPAGATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Propagating ranks through knowledge base');
  const propagation = await ctx.task(rankPropagationTask, {
    rankingFunction: rankingSetup.rankingFunction,
    encodedRules: ruleEncoding.encodedRules,
    propositions,
    outputDir
  });

  artifacts.push(...propagation.artifacts);

  // ============================================================================
  // PHASE 4: CONDITIONAL RANK COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Computing conditional ranks');
  const conditionalRanks = await ctx.task(conditionalRankTask, {
    rankingFunction: propagation.updatedRanking,
    propositions,
    outputDir
  });

  artifacts.push(...conditionalRanks.artifacts);

  // ============================================================================
  // PHASE 5: BELIEF REVISION WITH EVIDENCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Revising beliefs with evidence');
  const beliefRevision = await ctx.task(rankingRevisionTask, {
    rankingFunction: conditionalRanks.ranking,
    evidenceItems,
    outputDir
  });

  artifacts.push(...beliefRevision.artifacts);

  // ============================================================================
  // PHASE 6: QUALITATIVE INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Performing qualitative inference');
  const inference = await ctx.task(qualitativeInferenceTask, {
    revisedRanking: beliefRevision.revisedRanking,
    propositions,
    outputDir
  });

  artifacts.push(...inference.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reasoning quality');
  const qualityScore = await ctx.task(qualProbQualityTask, {
    rankingSetup,
    ruleEncoding,
    propagation,
    conditionalRanks: conditionalRanks.ranks,
    inference,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review qualitative probability results
  await ctx.breakpoint({
    question: `Qualitative probability analysis complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Review ranking consistency.'} Review results?`,
    title: 'Qualitative Probability Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        propositionsCount: propositions.length,
        defaultRulesCount: defaultRules.length,
        inferencesCount: inference.inferences.length,
        mostBelieved: inference.mostBelieved,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const report = await ctx.task(qualProbReportTask, {
    rankingSetup,
    ruleEncoding,
    conditionalRanks: conditionalRanks.ranks,
    beliefRevision,
    inference,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    beliefRanks: beliefRevision.revisedRanking,
    conditionalRanks: conditionalRanks.ranks,
    inferences: inference.inferences,
    mostBelieved: inference.mostBelieved,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/qualitative-probability-reasoning',
      timestamp: startTime,
      outputDir,
      rankingScale
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Ranking Function Setup
export const rankingSetupTask = defineTask('ranking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up ordinal ranking function',
  agent: {
    name: 'ranking-setup-agent',
    prompt: {
      role: 'ranking theory specialist',
      task: 'Set up ordinal ranking function (OCF/kappa function) for qualitative probability',
      context: args,
      instructions: [
        'Define ranking function kappa: worlds -> ordinals (non-negative integers)',
        'Rank 0 means most plausible/believed',
        'Higher ranks mean less plausible/more disbelieved',
        'Assign initial ranks to atomic propositions',
        'Extend to compound propositions: kappa(A) = min{kappa(w) : w |= A}',
        'Ensure at least one world has rank 0 (normalization)',
        'Handle complete ignorance (all rank 0)',
        'Document rank assignments and justifications',
        'Verify ranking function consistency',
        'Save ranking setup to output directory'
      ],
      outputFormat: 'JSON with rankingFunction (object), worldRanks (object), propositionRanks (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rankingFunction', 'worldRanks', 'artifacts'],
      properties: {
        rankingFunction: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            scale: { type: 'string' },
            normalized: { type: 'boolean' }
          }
        },
        worldRanks: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        propositionRanks: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        rankJustifications: { type: 'object' },
        isConsistent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'ranking']
}));

// Task 2: Default Rule Encoding
export const defaultRuleEncodingTask = defineTask('default-rule-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Encode default rules as ranking constraints',
  agent: {
    name: 'default-rule-agent',
    prompt: {
      role: 'default reasoning specialist',
      task: 'Encode default rules as constraints on the ranking function',
      context: args,
      instructions: [
        'Parse default rules of form "If A, normally B"',
        'Encode as: kappa(A and not-B) > kappa(A and B)',
        'Handle rule priorities and specificity',
        'Encode exceptions to defaults',
        'Use z-ranking or c-representations if appropriate',
        'Ensure encoded rules are consistent',
        'Handle conflicting defaults via prioritization',
        'Document encoding choices',
        'Save encoded rules to output directory'
      ],
      outputFormat: 'JSON with encodedRules (array), ruleConstraints (array), priorityOrder (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['encodedRules', 'ruleConstraints', 'artifacts'],
      properties: {
        encodedRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'string' },
              antecedent: { type: 'string' },
              consequent: { type: 'string' },
              constraint: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        ruleConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              satisfied: { type: 'boolean' }
            }
          }
        },
        priorityOrder: { type: 'array', items: { type: 'string' } },
        conflictsDetected: { type: 'array' },
        encodingMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'defaults']
}));

// Task 3: Rank Propagation
export const rankPropagationTask = defineTask('rank-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propagate ranks through knowledge base',
  agent: {
    name: 'rank-propagation-agent',
    prompt: {
      role: 'belief propagation expert',
      task: 'Propagate ranking values through the knowledge base',
      context: args,
      instructions: [
        'Apply ranking constraints from encoded rules',
        'Propagate ranks to derived propositions',
        'Handle disjunction: kappa(A or B) = min(kappa(A), kappa(B))',
        'Handle conjunction: kappa(A and B) = kappa(A) + kappa(B) (for independent)',
        'Handle negation: consider all worlds where not-A holds',
        'Iterate until ranks stabilize',
        'Detect and resolve rank inconsistencies',
        'Update world ranks based on constraints',
        'Save propagation results to output directory'
      ],
      outputFormat: 'JSON with updatedRanking (object), propagationSteps (array), changedRanks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedRanking', 'propagationSteps', 'artifacts'],
      properties: {
        updatedRanking: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        propagationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              proposition: { type: 'string' },
              oldRank: { type: 'number' },
              newRank: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        changedRanks: { type: 'array' },
        iterations: { type: 'number' },
        converged: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'propagation']
}));

// Task 4: Conditional Rank Computation
export const conditionalRankTask = defineTask('conditional-rank', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute conditional ranks',
  agent: {
    name: 'conditional-rank-agent',
    prompt: {
      role: 'conditional reasoning specialist',
      task: 'Compute conditional ranks for qualitative conditional probability',
      context: args,
      instructions: [
        'Compute conditional rank: kappa(B|A) = kappa(A and B) - kappa(A)',
        'Handle case when kappa(A) = infinity (A impossible)',
        'Compute for key conditional queries',
        'Verify conditional rank properties',
        'kappa(B|A) = 0 means B is believed given A',
        'kappa(B|A) > 0 means B is disbelieved given A',
        'Compare conditional ranks for competing hypotheses',
        'Generate conditional rank table',
        'Save conditional ranks to output directory'
      ],
      outputFormat: 'JSON with ranks (object), ranking (object), conditionalTable (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ranks', 'ranking', 'artifacts'],
      properties: {
        ranks: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        },
        ranking: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        conditionalTable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              proposition: { type: 'string' },
              conditionalRank: { type: 'number' }
            }
          }
        },
        beliefGivenEvidence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'conditional']
}));

// Task 5: Ranking Revision
export const rankingRevisionTask = defineTask('ranking-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise ranking function with evidence',
  agent: {
    name: 'ranking-revision-agent',
    prompt: {
      role: 'belief revision specialist',
      task: 'Revise the ranking function based on new evidence',
      context: args,
      instructions: [
        'Apply qualitative Jeffrey conditionalization',
        'Or apply ranking-theoretic conditionalization',
        'Shift ranks to accommodate certain evidence',
        'For evidence E: set kappa(not-E) = infinity (certain)',
        'For uncertain evidence: adjust ranks proportionally',
        'Maintain ranking consistency after revision',
        'Track how beliefs changed with evidence',
        'Handle multiple evidence items sequentially',
        'Save revised ranking to output directory'
      ],
      outputFormat: 'JSON with revisedRanking (object), revisionSteps (array), beliefChanges (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['revisedRanking', 'revisionSteps', 'artifacts'],
      properties: {
        revisedRanking: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        revisionSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              method: { type: 'string' },
              ranksAffected: { type: 'number' }
            }
          }
        },
        beliefChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              beforeRank: { type: 'number' },
              afterRank: { type: 'number' },
              believedBefore: { type: 'boolean' },
              believedAfter: { type: 'boolean' }
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
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'revision']
}));

// Task 6: Qualitative Inference
export const qualitativeInferenceTask = defineTask('qualitative-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform qualitative probabilistic inference',
  agent: {
    name: 'qualitative-inference-agent',
    prompt: {
      role: 'qualitative reasoning specialist',
      task: 'Perform inference using the ranking function',
      context: args,
      instructions: [
        'Identify believed propositions (rank 0)',
        'Identify disbelieved propositions (rank > 0)',
        'Rank hypotheses by plausibility (lower rank = more plausible)',
        'Determine what is believed given current evidence',
        'Apply default reasoning with ranking',
        'Handle defeasible inference (may be retracted)',
        'Identify most believed hypothesis',
        'Compare relative plausibility of alternatives',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with inferences (array), mostBelieved (string), beliefSet (array), plausibilityRanking (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'mostBelieved', 'beliefSet', 'artifacts'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              status: { type: 'string' },
              rank: { type: 'number' },
              confidence: { type: 'string' }
            }
          }
        },
        mostBelieved: { type: 'string' },
        beliefSet: { type: 'array', items: { type: 'string' } },
        plausibilityRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              rank: { type: 'number' }
            }
          }
        },
        defeasibleConclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'inference']
}));

// Task 7: Quality Assessment
export const qualProbQualityTask = defineTask('qual-prob-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of qualitative probability reasoning',
  agent: {
    name: 'qual-prob-quality-agent',
    prompt: {
      role: 'qualitative reasoning methodology reviewer',
      task: 'Assess quality and validity of qualitative probability analysis',
      context: args,
      instructions: [
        'Evaluate ranking function setup (weight: 25%)',
        'Assess default rule encoding (weight: 20%)',
        'Check rank propagation correctness (weight: 20%)',
        'Evaluate conditional rank computation (weight: 20%)',
        'Assess inference quality (weight: 15%)',
        'Verify ranking axioms satisfied',
        'Check consistency of belief set',
        'Validate default handling',
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
            rankingSetup: { type: 'number' },
            ruleEncoding: { type: 'number' },
            rankPropagation: { type: 'number' },
            conditionalRanks: { type: 'number' },
            inferenceQuality: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'quality']
}));

// Task 8: Report Generation
export const qualProbReportTask = defineTask('qual-prob-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate qualitative probability analysis report',
  agent: {
    name: 'qual-prob-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on qualitative probability reasoning',
      context: args,
      instructions: [
        'Create executive summary of key findings',
        'Document ranking function setup',
        'Explain default rule encoding',
        'Present rank values and ordering',
        'Show conditional ranks',
        'Describe belief revision with evidence',
        'Present inference conclusions',
        'Include ranking visualizations',
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
  labels: ['agent', 'scientific-discovery', 'qualitative-probability', 'reporting']
}));
