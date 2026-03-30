/**
 * @process scientific-discovery/belief-revision-update
 * @description Revise accepted beliefs when new inconsistent information arrives
 * @inputs { beliefBase: array, newInformation: object, revisionStrategy: string, entrenchment: object, outputDir: string }
 * @outputs { success: boolean, revisedBeliefs: array, retractedBeliefs: array, revisionTrace: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    beliefBase = [],
    newInformation = {},
    revisionStrategy = 'agm', // agm, base-revision, kernel-revision
    entrenchment = {},
    outputDir = 'belief-revision-output',
    minimalChange = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Belief Revision/Update Process');

  // ============================================================================
  // PHASE 1: BELIEF BASE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current belief base');
  const beliefAnalysis = await ctx.task(beliefBaseAnalysisTask, {
    beliefBase,
    outputDir
  });

  artifacts.push(...beliefAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONSISTENCY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 2: Checking consistency with new information');
  const consistencyCheck = await ctx.task(consistencyCheckTask, {
    beliefBase,
    newInformation,
    outputDir
  });

  artifacts.push(...consistencyCheck.artifacts);

  // ============================================================================
  // PHASE 3: ENTRENCHMENT ORDERING
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing epistemic entrenchment');
  const entrenchmentOrdering = await ctx.task(entrenchmentOrderingTask, {
    beliefBase,
    entrenchment,
    consistencyCheck,
    outputDir
  });

  artifacts.push(...entrenchmentOrdering.artifacts);

  // ============================================================================
  // PHASE 4: CONTRACTION (IF NEEDED)
  // ============================================================================

  let contractionResult = { contracted: beliefBase, removed: [] };
  if (!consistencyCheck.isConsistent) {
    ctx.log('info', 'Phase 4: Performing belief contraction');
    contractionResult = await ctx.task(beliefContractionTask, {
      beliefBase,
      newInformation,
      entrenchmentOrdering: entrenchmentOrdering.ordering,
      revisionStrategy,
      minimalChange,
      outputDir
    });
    artifacts.push(...contractionResult.artifacts);
  }

  // ============================================================================
  // PHASE 5: EXPANSION
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing belief expansion');
  const expansionResult = await ctx.task(beliefExpansionTask, {
    contractedBase: contractionResult.contracted,
    newInformation,
    outputDir
  });

  artifacts.push(...expansionResult.artifacts);

  // ============================================================================
  // PHASE 6: CLOSURE COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Computing belief closure');
  const closureComputation = await ctx.task(beliefClosureTask, {
    expandedBase: expansionResult.expanded,
    outputDir
  });

  artifacts.push(...closureComputation.artifacts);

  // ============================================================================
  // PHASE 7: AGM POSTULATES VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Verifying AGM postulates');
  const postulateVerification = await ctx.task(agmPostulateTask, {
    originalBeliefs: beliefBase,
    revisedBeliefs: closureComputation.closedBeliefs,
    newInformation,
    revisionStrategy,
    outputDir
  });

  artifacts.push(...postulateVerification.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing revision quality');
  const qualityScore = await ctx.task(beliefRevisionQualityTask, {
    beliefAnalysis,
    consistencyCheck,
    contractionResult,
    expansionResult,
    postulateVerification,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review belief revision results
  await ctx.breakpoint({
    question: `Belief revision complete. Quality score: ${qualityScore.overallScore}/100. Retracted ${contractionResult.removed?.length || 0} beliefs, added ${expansionResult.added?.length || 0}. ${qualityMet ? 'Quality meets standards!' : 'Review entrenchment and revision strategy.'} Review results?`,
    title: 'Belief Revision Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        originalBeliefs: beliefBase.length,
        retractedBeliefs: contractionResult.removed?.length || 0,
        addedBeliefs: expansionResult.added?.length || 0,
        finalBeliefs: closureComputation.closedBeliefs.length,
        agmPostulatesSatisfied: postulateVerification.satisfied,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(beliefRevisionReportTask, {
    beliefAnalysis,
    consistencyCheck,
    entrenchmentOrdering,
    contractionResult,
    expansionResult,
    closureComputation,
    postulateVerification,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    revisedBeliefs: closureComputation.closedBeliefs,
    retractedBeliefs: contractionResult.removed || [],
    addedBeliefs: expansionResult.added || [],
    revisionTrace: {
      originalSize: beliefBase.length,
      contracted: contractionResult.contracted?.length || beliefBase.length,
      expanded: expansionResult.expanded?.length || 0,
      final: closureComputation.closedBeliefs.length
    },
    postulatesSatisfied: postulateVerification.satisfied,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/belief-revision-update',
      timestamp: startTime,
      outputDir,
      revisionStrategy,
      minimalChange
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Belief Base Analysis
export const beliefBaseAnalysisTask = defineTask('belief-base-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current belief base',
  agent: {
    name: 'belief-base-analysis-agent',
    prompt: {
      role: 'belief revision specialist',
      task: 'Analyze the structure of the current belief base',
      context: args,
      instructions: [
        'Parse all beliefs in the belief base',
        'Identify explicit beliefs vs derived beliefs',
        'Check internal consistency of belief base',
        'Identify belief dependencies (which beliefs support others)',
        'Compute belief base statistics',
        'Identify core vs peripheral beliefs',
        'Build belief dependency graph',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), explicitBeliefs (array), derivedBeliefs (array), dependencies (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'explicitBeliefs', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            totalBeliefs: { type: 'number' },
            isConsistent: { type: 'boolean' }
          }
        },
        explicitBeliefs: { type: 'array', items: { type: 'string' } },
        derivedBeliefs: { type: 'array', items: { type: 'string' } },
        dependencies: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        coreBeliefs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'analysis']
}));

// Task 2: Consistency Check
export const consistencyCheckTask = defineTask('consistency-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check consistency with new information',
  agent: {
    name: 'consistency-check-agent',
    prompt: {
      role: 'logical consistency analyst',
      task: 'Check if new information is consistent with current beliefs',
      context: args,
      instructions: [
        'Parse new information',
        'Check direct contradiction with existing beliefs',
        'Check indirect contradiction (new info implies contradiction)',
        'Identify specific conflicting beliefs',
        'Assess severity of inconsistency',
        'Determine if revision or update is needed',
        'Document all inconsistencies found',
        'Save consistency check to output directory'
      ],
      outputFormat: 'JSON with isConsistent (boolean), conflicts (array), inconsistencyType (string), affectedBeliefs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isConsistent', 'conflicts', 'artifacts'],
      properties: {
        isConsistent: { type: 'boolean' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              existingBelief: { type: 'string' },
              newInfo: { type: 'string' },
              conflictType: { type: 'string' }
            }
          }
        },
        inconsistencyType: { type: 'string' },
        affectedBeliefs: { type: 'array', items: { type: 'string' } },
        revisionNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'consistency']
}));

// Task 3: Entrenchment Ordering
export const entrenchmentOrderingTask = defineTask('entrenchment-ordering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute epistemic entrenchment',
  agent: {
    name: 'entrenchment-ordering-agent',
    prompt: {
      role: 'epistemic entrenchment specialist',
      task: 'Compute epistemic entrenchment ordering of beliefs',
      context: args,
      instructions: [
        'Epistemic entrenchment: how firmly held is each belief',
        'More entrenched beliefs are harder to give up',
        'Derive entrenchment from explicit input if provided',
        'Otherwise compute from belief dependencies and roles',
        'Core beliefs are more entrenched than derived',
        'Build total or partial order over beliefs',
        'Verify entrenchment satisfies Gardenfors postulates',
        'Save entrenchment ordering to output directory'
      ],
      outputFormat: 'JSON with ordering (object), entrenchmentLevels (object), partialOrder (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ordering', 'entrenchmentLevels', 'artifacts'],
      properties: {
        ordering: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        entrenchmentLevels: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        partialOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moreEntrenched: { type: 'string' },
              lessEntrenched: { type: 'string' }
            }
          }
        },
        gardenforsSatisfied: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'entrenchment']
}));

// Task 4: Belief Contraction
export const beliefContractionTask = defineTask('belief-contraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform belief contraction',
  agent: {
    name: 'belief-contraction-agent',
    prompt: {
      role: 'belief contraction specialist',
      task: 'Contract belief base to remove inconsistency',
      context: args,
      instructions: [
        'Remove beliefs to restore consistency with new information',
        'Use entrenchment: remove least entrenched beliefs first',
        'Apply minimal change: remove as few beliefs as possible',
        'Apply recovery: if alpha contracted then expanded, return alpha',
        'For AGM: K - alpha = intersection of maximal consistent subsets not implying alpha',
        'For kernel contraction: remove minimal alpha-kernels',
        'Track all removed beliefs and why',
        'Save contracted base to output directory'
      ],
      outputFormat: 'JSON with contracted (array), removed (array), removalJustification (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contracted', 'removed', 'artifacts'],
      properties: {
        contracted: { type: 'array', items: { type: 'string' } },
        removed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              belief: { type: 'string' },
              reason: { type: 'string' },
              entrenchment: { type: 'number' }
            }
          }
        },
        removalJustification: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        contractionMethod: { type: 'string' },
        changeSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'contraction']
}));

// Task 5: Belief Expansion
export const beliefExpansionTask = defineTask('belief-expansion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform belief expansion',
  agent: {
    name: 'belief-expansion-agent',
    prompt: {
      role: 'belief expansion specialist',
      task: 'Expand belief base with new information',
      context: args,
      instructions: [
        'Add new information to contracted belief base',
        'Expansion: K + alpha = Cn(K union {alpha})',
        'Ensure new information is actually added',
        'Handle derived beliefs from new information',
        'Track all added beliefs',
        'Verify resulting base is consistent',
        'Document expansion steps',
        'Save expanded base to output directory'
      ],
      outputFormat: 'JSON with expanded (array), added (array), derivedFromNew (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['expanded', 'added', 'artifacts'],
      properties: {
        expanded: { type: 'array', items: { type: 'string' } },
        added: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              belief: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        derivedFromNew: { type: 'array', items: { type: 'string' } },
        expansionSuccessful: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'expansion']
}));

// Task 6: Belief Closure
export const beliefClosureTask = defineTask('belief-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute belief closure',
  agent: {
    name: 'belief-closure-agent',
    prompt: {
      role: 'logical closure specialist',
      task: 'Compute logical closure of revised belief base',
      context: args,
      instructions: [
        'Compute Cn(K): all logical consequences of K',
        'For practical purposes, compute relevant closure',
        'Apply inference rules to derive new beliefs',
        'Stop when no new beliefs can be derived',
        'Track derivation chains',
        'Verify closure is consistent',
        'Document closure computation',
        'Save closed beliefs to output directory'
      ],
      outputFormat: 'JSON with closedBeliefs (array), derivedInClosure (array), closureSize (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['closedBeliefs', 'derivedInClosure', 'artifacts'],
      properties: {
        closedBeliefs: { type: 'array', items: { type: 'string' } },
        derivedInClosure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              belief: { type: 'string' },
              derivedFrom: { type: 'array' }
            }
          }
        },
        closureSize: { type: 'number' },
        isConsistent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'closure']
}));

// Task 7: AGM Postulate Verification
export const agmPostulateTask = defineTask('agm-postulate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify AGM postulates',
  agent: {
    name: 'agm-postulate-agent',
    prompt: {
      role: 'belief revision theory expert',
      task: 'Verify AGM postulates for belief revision are satisfied',
      context: args,
      instructions: [
        'Check AGM revision postulates (K*1 through K*8):',
        'K*1 (Closure): K*alpha is logically closed',
        'K*2 (Success): alpha in K*alpha',
        'K*3 (Inclusion): K*alpha subset Cn(K union {alpha})',
        'K*4 (Vacuity): If not-alpha not in K, then K*alpha = K + alpha',
        'K*5 (Consistency): K*alpha is consistent if alpha is',
        'K*6 (Extensionality): If alpha equiv beta, then K*alpha = K*beta',
        'K*7 (Superexpansion): K*(alpha AND beta) subset (K*alpha) + beta',
        'K*8 (Subexpansion): If not-beta not in K*alpha, then (K*alpha)+beta subset K*(alpha AND beta)',
        'Document which postulates are satisfied',
        'Save verification to output directory'
      ],
      outputFormat: 'JSON with satisfied (boolean), postulateResults (object), violations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfied', 'postulateResults', 'artifacts'],
      properties: {
        satisfied: { type: 'boolean' },
        postulateResults: {
          type: 'object',
          properties: {
            closure: { type: 'boolean' },
            success: { type: 'boolean' },
            inclusion: { type: 'boolean' },
            vacuity: { type: 'boolean' },
            consistency: { type: 'boolean' },
            extensionality: { type: 'boolean' },
            superexpansion: { type: 'boolean' },
            subexpansion: { type: 'boolean' }
          }
        },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              postulate: { type: 'string' },
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
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'postulates']
}));

// Task 8: Quality Assessment
export const beliefRevisionQualityTask = defineTask('belief-revision-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of belief revision',
  agent: {
    name: 'belief-revision-quality-agent',
    prompt: {
      role: 'belief revision methodology reviewer',
      task: 'Assess quality and validity of belief revision process',
      context: args,
      instructions: [
        'Evaluate belief base analysis (weight: 15%)',
        'Assess consistency checking (weight: 15%)',
        'Check contraction quality (weight: 25%)',
        'Evaluate expansion correctness (weight: 20%)',
        'Assess AGM postulate satisfaction (weight: 25%)',
        'Verify minimal change principle',
        'Check entrenchment handling',
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
            beliefAnalysis: { type: 'number' },
            consistencyCheck: { type: 'number' },
            contraction: { type: 'number' },
            expansion: { type: 'number' },
            postulateVerification: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'quality']
}));

// Task 9: Report Generation
export const beliefRevisionReportTask = defineTask('belief-revision-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate belief revision report',
  agent: {
    name: 'belief-revision-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on belief revision process',
      context: args,
      instructions: [
        'Create executive summary of revision results',
        'Document original belief base',
        'Present new information and conflicts',
        'Show entrenchment ordering',
        'Explain contraction decisions',
        'Document expansion results',
        'Present final revised beliefs',
        'Show AGM postulate verification',
        'Include belief change visualization',
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
  labels: ['agent', 'scientific-discovery', 'belief-revision', 'reporting']
}));
