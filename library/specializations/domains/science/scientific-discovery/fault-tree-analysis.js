/**
 * @process domains/science/scientific-discovery/fault-tree-analysis
 * @description Construct logic trees to analyze event combinations leading to failures - Guides practitioners
 * through Fault Tree Analysis (FTA) to systematically identify combinations of basic events that can cause
 * a top-level undesired event using Boolean logic.
 * @inputs { topEvent: string, system: object, scope?: string, quantitative?: boolean }
 * @outputs { success: boolean, faultTree: object, cutSets: array, probability?: number, recommendations: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/fault-tree-analysis', {
 *   topEvent: 'Loss of aircraft control',
 *   system: { name: 'Flight Control System', components: ['Hydraulics', 'FBW', 'Manual Backup'] },
 *   quantitative: true
 * });
 *
 * @references
 * - NASA Fault Tree Handbook (2002)
 * - IEC 61025 (2006). Fault Tree Analysis
 * - Vesely, W.E. et al. (1981). Fault Tree Handbook, NUREG-0492
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    topEvent,
    system,
    scope = 'system-level',
    quantitative = false,
    outputDir = 'fta-output',
    minCutSetOrder = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Fault Tree Analysis for: ${topEvent}`);

  // ============================================================================
  // PHASE 1: TOP EVENT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining top event');
  const topEventDefinition = await ctx.task(topEventDefinitionTask, {
    topEvent,
    system,
    scope,
    outputDir
  });

  artifacts.push(...topEventDefinition.artifacts);

  // ============================================================================
  // PHASE 2: SYSTEM BOUNDARY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining system boundaries');
  const boundaryDefinition = await ctx.task(boundaryDefinitionTask, {
    topEvent: topEventDefinition.clarifiedTopEvent,
    system,
    scope,
    outputDir
  });

  artifacts.push(...boundaryDefinition.artifacts);

  // ============================================================================
  // PHASE 3: FAULT TREE CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Constructing fault tree');
  const faultTreeConstruction = await ctx.task(faultTreeConstructionTask, {
    topEvent: topEventDefinition.clarifiedTopEvent,
    system,
    boundaryDefinition,
    outputDir
  });

  artifacts.push(...faultTreeConstruction.artifacts);

  // Breakpoint: Review fault tree structure
  await ctx.breakpoint({
    question: `Fault tree constructed with ${faultTreeConstruction.gatesCount} gates and ${faultTreeConstruction.basicEventsCount} basic events. Review structure?`,
    title: 'Fault Tree Structure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        topEvent: topEventDefinition.clarifiedTopEvent,
        gates: faultTreeConstruction.gatesCount,
        basicEvents: faultTreeConstruction.basicEventsCount,
        treeDepth: faultTreeConstruction.treeDepth
      }
    }
  });

  // ============================================================================
  // PHASE 4: MINIMAL CUT SET ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying minimal cut sets');
  const cutSetAnalysis = await ctx.task(cutSetAnalysisTask, {
    faultTree: faultTreeConstruction.faultTree,
    minCutSetOrder,
    outputDir
  });

  artifacts.push(...cutSetAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: QUALITATIVE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing qualitative analysis');
  const qualitativeAnalysis = await ctx.task(qualitativeAnalysisTask, {
    faultTree: faultTreeConstruction.faultTree,
    cutSets: cutSetAnalysis.minimalCutSets,
    system,
    outputDir
  });

  artifacts.push(...qualitativeAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: QUANTITATIVE ANALYSIS (if requested)
  // ============================================================================

  let quantitativeAnalysis = null;
  if (quantitative) {
    ctx.log('info', 'Phase 6: Performing quantitative analysis');
    quantitativeAnalysis = await ctx.task(quantitativeAnalysisTask, {
      faultTree: faultTreeConstruction.faultTree,
      cutSets: cutSetAnalysis.minimalCutSets,
      system,
      outputDir
    });

    artifacts.push(...quantitativeAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 7: IMPORTANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing event importance');
  const importanceAnalysis = await ctx.task(importanceAnalysisTask, {
    faultTree: faultTreeConstruction.faultTree,
    cutSets: cutSetAnalysis.minimalCutSets,
    quantitativeAnalysis,
    outputDir
  });

  artifacts.push(...importanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: COMMON CAUSE FAILURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing common cause failures');
  const ccfAnalysis = await ctx.task(commonCauseFailureAnalysisTask, {
    faultTree: faultTreeConstruction.faultTree,
    cutSets: cutSetAnalysis.minimalCutSets,
    system,
    outputDir
  });

  artifacts.push(...ccfAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: RECOMMENDATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing recommendations');
  const recommendations = await ctx.task(ftaRecommendationsTask, {
    topEvent: topEventDefinition.clarifiedTopEvent,
    cutSets: cutSetAnalysis.minimalCutSets,
    qualitativeAnalysis,
    quantitativeAnalysis,
    importanceAnalysis,
    ccfAnalysis,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating FTA report');
  const ftaReport = await ctx.task(ftaReportGenerationTask, {
    topEvent: topEventDefinition.clarifiedTopEvent,
    system,
    faultTree: faultTreeConstruction.faultTree,
    cutSets: cutSetAnalysis.minimalCutSets,
    qualitativeAnalysis,
    quantitativeAnalysis,
    importanceAnalysis,
    ccfAnalysis,
    recommendations,
    outputDir
  });

  artifacts.push(...ftaReport.artifacts);

  // ============================================================================
  // PHASE 11: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 11: Scoring FTA quality');
  const qualityScore = await ctx.task(ftaQualityScoringTask, {
    topEventDefinition,
    faultTreeConstruction,
    cutSetAnalysis,
    qualitativeAnalysis,
    quantitativeAnalysis,
    recommendations,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `FTA complete for "${topEvent}". ${cutSetAnalysis.singlePointFailures || 0} single-point failures identified. Quality score: ${qualityScore.overallScore}/100. Approve analysis?`,
    title: 'FTA Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        topEvent: topEventDefinition.clarifiedTopEvent,
        minimalCutSets: cutSetAnalysis.minimalCutSets?.length || 0,
        singlePointFailures: cutSetAnalysis.singlePointFailures || 0,
        topEventProbability: quantitativeAnalysis?.topEventProbability || 'N/A',
        qualityScore: qualityScore.overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    topEvent: topEventDefinition.clarifiedTopEvent,
    faultTree: {
      structure: faultTreeConstruction.faultTree,
      gatesCount: faultTreeConstruction.gatesCount,
      basicEventsCount: faultTreeConstruction.basicEventsCount,
      treeDepth: faultTreeConstruction.treeDepth
    },
    cutSets: {
      minimalCutSets: cutSetAnalysis.minimalCutSets,
      singlePointFailures: cutSetAnalysis.singlePointFailures,
      totalCutSets: cutSetAnalysis.minimalCutSets?.length || 0
    },
    probability: quantitativeAnalysis?.topEventProbability || null,
    importance: importanceAnalysis.importanceRankings,
    commonCauseFailures: ccfAnalysis.ccfGroups,
    recommendations: recommendations.recommendations,
    qualityScore: {
      overall: qualityScore.overallScore,
      completeness: qualityScore.completenessScore,
      rigor: qualityScore.rigorScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/fault-tree-analysis',
      timestamp: startTime,
      scope,
      quantitative,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const topEventDefinitionTask = defineTask('top-event-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define top event',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Fault tree analyst',
      task: 'Define and clarify the top event for fault tree analysis',
      context: args,
      instructions: [
        'Clarify the top event statement to be specific',
        'Ensure top event is a single, well-defined failure state',
        'Define what constitutes the undesired event',
        'Specify the conditions and timing',
        'Define success and failure states',
        'Document the operational context',
        'Identify relevant phases or modes',
        'Define exclusions from the analysis',
        'Ensure top event is at appropriate level',
        'Create clear top event statement'
      ],
      outputFormat: 'JSON with clarifiedTopEvent, successState, failureState, conditions, context, exclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedTopEvent', 'failureState', 'artifacts'],
      properties: {
        clarifiedTopEvent: { type: 'string' },
        originalTopEvent: { type: 'string' },
        successState: { type: 'string' },
        failureState: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        operationalContext: { type: 'string' },
        exclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'top-event-definition']
}));

export const boundaryDefinitionTask = defineTask('boundary-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system boundaries',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine'],
    prompt: {
      role: 'Systems analyst',
      task: 'Define system boundaries and scope for fault tree analysis',
      context: args,
      instructions: [
        'Define physical boundaries of the system',
        'Define functional boundaries',
        'Identify interfaces with external systems',
        'Specify what is included in the analysis',
        'Specify what is excluded from the analysis',
        'Identify assumptions about external systems',
        'Define resolution level for basic events',
        'Specify human actions within scope',
        'Define environmental conditions considered',
        'Document boundary diagram'
      ],
      outputFormat: 'JSON with physicalBoundaries, functionalBoundaries, interfaces, inclusions, exclusions, assumptions, resolutionLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['physicalBoundaries', 'inclusions', 'exclusions', 'artifacts'],
      properties: {
        physicalBoundaries: { type: 'array', items: { type: 'string' } },
        functionalBoundaries: { type: 'array', items: { type: 'string' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        inclusions: { type: 'array', items: { type: 'string' } },
        exclusions: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        resolutionLevel: { type: 'string' },
        environmentalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'boundary-definition']
}));

export const faultTreeConstructionTask = defineTask('fault-tree-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct fault tree',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'reliability-engineer',
    skills: ['formal-logic-reasoner', 'root-cause-analyzer', 'causal-inference-engine'],
    prompt: {
      role: 'Fault tree construction specialist',
      task: 'Construct the fault tree from top event to basic events',
      context: args,
      instructions: [
        'Start with the top event',
        'Ask "What could cause this event?" at each level',
        'Use AND gates for events that must occur together',
        'Use OR gates for alternative causes',
        'Continue until reaching basic events (undeveloped events)',
        'Basic events should be independent failures',
        'Use transfer gates for repeated structures',
        'Include house events for conditions/assumptions',
        'Ensure tree is logically consistent',
        'Document gate and event IDs systematically'
      ],
      outputFormat: 'JSON with faultTree, gatesCount, basicEventsCount, treeDepth, gateTypes, basicEvents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['faultTree', 'gatesCount', 'basicEventsCount', 'artifacts'],
      properties: {
        faultTree: {
          type: 'object',
          properties: {
            topEvent: { type: 'object' },
            gates: { type: 'array' },
            basicEvents: { type: 'array' },
            transfers: { type: 'array' }
          }
        },
        gatesCount: { type: 'number' },
        basicEventsCount: { type: 'number' },
        treeDepth: { type: 'number' },
        gateTypes: {
          type: 'object',
          properties: {
            and: { type: 'number' },
            or: { type: 'number' }
          }
        },
        basicEvents: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'tree-construction']
}));

export const cutSetAnalysisTask = defineTask('cut-set-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify minimal cut sets',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'reliability-engineer',
    skills: ['formal-logic-reasoner', 'root-cause-analyzer', 'bayesian-inference-engine'],
    prompt: {
      role: 'Cut set analyst',
      task: 'Identify all minimal cut sets from the fault tree',
      context: args,
      instructions: [
        'Apply Boolean algebra to simplify the tree',
        'Identify all cut sets (combinations causing top event)',
        'Reduce to minimal cut sets (no subset is a cut set)',
        'Identify single-point failures (order 1 cut sets)',
        'Identify double failures (order 2 cut sets)',
        'Continue to specified minimum order',
        'List cut sets by order',
        'Document cut set analysis method',
        'Verify completeness of cut sets',
        'Calculate cut set statistics'
      ],
      outputFormat: 'JSON with minimalCutSets, cutSetsByOrder, singlePointFailures, doubleFailures, analysisMethod, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['minimalCutSets', 'singlePointFailures', 'artifacts'],
      properties: {
        minimalCutSets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              order: { type: 'number' },
              events: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cutSetsByOrder: { type: 'object' },
        singlePointFailures: { type: 'number' },
        doubleFailures: { type: 'number' },
        maxOrder: { type: 'number' },
        analysisMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'cut-set-analysis']
}));

export const qualitativeAnalysisTask = defineTask('qualitative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform qualitative analysis',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Qualitative analysis specialist',
      task: 'Perform qualitative analysis of the fault tree and cut sets',
      context: args,
      instructions: [
        'Identify critical cut sets (lowest order, highest impact)',
        'Analyze single-point failures for design weaknesses',
        'Identify common events across cut sets',
        'Assess vulnerability of system design',
        'Identify redundancy and diversity',
        'Evaluate defense-in-depth',
        'Identify potential design improvements',
        'Document insights from cut set structure',
        'Assess compliance with safety requirements',
        'Rank cut sets by qualitative importance'
      ],
      outputFormat: 'JSON with criticalCutSets, designWeaknesses, redundancyAssessment, diversityAssessment, insights, designImprovements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalCutSets', 'designWeaknesses', 'artifacts'],
      properties: {
        criticalCutSets: { type: 'array' },
        designWeaknesses: { type: 'array', items: { type: 'string' } },
        commonEvents: { type: 'array', items: { type: 'string' } },
        redundancyAssessment: { type: 'string' },
        diversityAssessment: { type: 'string' },
        defenseInDepth: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        designImprovements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'qualitative-analysis']
}));

export const quantitativeAnalysisTask = defineTask('quantitative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform quantitative analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'root-cause-analyzer'],
    prompt: {
      role: 'Quantitative risk analyst',
      task: 'Calculate probabilities for the fault tree',
      context: args,
      instructions: [
        'Assign failure probabilities to basic events',
        'Document sources for probability data',
        'Calculate cut set probabilities',
        'Calculate top event probability',
        'Apply rare event approximation if appropriate',
        'Calculate exact probability if needed',
        'Perform uncertainty analysis',
        'Calculate expected frequency if applicable',
        'Compare to safety targets',
        'Document calculation methods'
      ],
      outputFormat: 'JSON with basicEventProbabilities, cutSetProbabilities, topEventProbability, calculationMethod, uncertaintyAnalysis, safetyComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topEventProbability', 'calculationMethod', 'artifacts'],
      properties: {
        basicEventProbabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              probability: { type: 'number' },
              source: { type: 'string' }
            }
          }
        },
        cutSetProbabilities: { type: 'array' },
        topEventProbability: { type: 'number' },
        calculationMethod: { type: 'string' },
        uncertaintyAnalysis: { type: 'object' },
        safetyComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'quantitative-analysis']
}));

export const importanceAnalysisTask = defineTask('importance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze event importance',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reliability-engineer',
    skills: ['bayesian-inference-engine', 'root-cause-analyzer', 'statistical-test-selector'],
    prompt: {
      role: 'Importance analysis specialist',
      task: 'Calculate and rank importance measures for basic events',
      context: args,
      instructions: [
        'Calculate Fussell-Vesely importance (contribution to top event)',
        'Calculate Birnbaum importance (sensitivity)',
        'Calculate Risk Achievement Worth (RAW)',
        'Calculate Risk Reduction Worth (RRW)',
        'Rank events by each importance measure',
        'Identify most important events for improvement',
        'Compare rankings across measures',
        'Document importance analysis method',
        'Identify events with high improvement potential',
        'Create importance summary'
      ],
      outputFormat: 'JSON with importanceRankings, fussellVesely, birnbaum, raw, rrw, mostImportantEvents, improvementPriorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['importanceRankings', 'mostImportantEvents', 'artifacts'],
      properties: {
        importanceRankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              fussellVesely: { type: 'number' },
              birnbaum: { type: 'number' },
              raw: { type: 'number' },
              rrw: { type: 'number' }
            }
          }
        },
        fussellVesely: { type: 'object' },
        birnbaum: { type: 'object' },
        raw: { type: 'object' },
        rrw: { type: 'object' },
        mostImportantEvents: { type: 'array', items: { type: 'string' } },
        improvementPriorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'importance-analysis']
}));

export const commonCauseFailureAnalysisTask = defineTask('ccf-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze common cause failures',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Common cause failure analyst',
      task: 'Identify and analyze common cause failures',
      context: args,
      instructions: [
        'Identify groups of events susceptible to CCF',
        'Consider design CCFs (common design errors)',
        'Consider manufacturing CCFs',
        'Consider operational CCFs (common procedures)',
        'Consider environmental CCFs',
        'Assess impact of CCF on cut sets',
        'Identify dependencies that create CCF potential',
        'Recommend CCF defenses',
        'Calculate CCF contribution if quantitative',
        'Document CCF analysis method'
      ],
      outputFormat: 'JSON with ccfGroups, ccfTypes, ccfImpact, dependencies, ccfDefenses, ccfContribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ccfGroups', 'ccfTypes', 'artifacts'],
      properties: {
        ccfGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              groupId: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              ccfType: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        ccfTypes: {
          type: 'object',
          properties: {
            design: { type: 'array' },
            manufacturing: { type: 'array' },
            operational: { type: 'array' },
            environmental: { type: 'array' }
          }
        },
        ccfImpact: { type: 'string' },
        dependencies: { type: 'array' },
        ccfDefenses: { type: 'array', items: { type: 'string' } },
        ccfContribution: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'ccf-analysis']
}));

export const ftaRecommendationsTask = defineTask('fta-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'hypothesis-generator', 'triz-inventive-solver'],
    prompt: {
      role: 'Safety improvement specialist',
      task: 'Develop recommendations based on FTA findings',
      context: args,
      instructions: [
        'Address single-point failures',
        'Recommend additional redundancy where needed',
        'Recommend diversity improvements',
        'Address CCF vulnerabilities',
        'Prioritize by importance measures',
        'Consider cost-effectiveness',
        'Recommend monitoring improvements',
        'Recommend testing improvements',
        'Recommend procedural changes',
        'Document rationale for each recommendation'
      ],
      outputFormat: 'JSON with recommendations, prioritizedRecommendations, designRecommendations, proceduralRecommendations, monitoringRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedRecommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' },
              type: { type: 'string' },
              addressedWeakness: { type: 'string' }
            }
          }
        },
        prioritizedRecommendations: { type: 'array' },
        designRecommendations: { type: 'array' },
        proceduralRecommendations: { type: 'array' },
        monitoringRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'recommendations']
}));

export const ftaReportGenerationTask = defineTask('fta-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate FTA report',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'formal-logic-reasoner'],
    prompt: {
      role: 'FTA documentation specialist',
      task: 'Generate comprehensive FTA report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document scope and boundaries',
        'Include fault tree diagram',
        'List all minimal cut sets',
        'Present qualitative analysis results',
        'Present quantitative results if available',
        'Include importance analysis',
        'Document CCF analysis',
        'Present recommendations',
        'Include appendices with detailed data'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, sections, diagrams, appendices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'report-generation']
}));

export const ftaQualityScoringTask = defineTask('fta-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score FTA quality',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'reliability-engineer',
    skills: ['root-cause-analyzer', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'FTA quality auditor',
      task: 'Assess the quality and completeness of the FTA',
      context: args,
      instructions: [
        'Score scope definition completeness (0-100)',
        'Score fault tree construction rigor (0-100)',
        'Score cut set analysis completeness (0-100)',
        'Score qualitative analysis depth (0-100)',
        'Score quantitative analysis rigor (0-100)',
        'Score recommendations quality (0-100)',
        'Calculate overall quality score',
        'Compare against IEC 61025 requirements',
        'Identify gaps in the FTA',
        'Recommend improvements'
      ],
      outputFormat: 'JSON with overallScore, completenessScore, rigorScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'completenessScore', 'rigorScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        rigorScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            scopeDefinition: { type: 'number' },
            treeConstruction: { type: 'number' },
            cutSetAnalysis: { type: 'number' },
            qualitativeAnalysis: { type: 'number' },
            quantitativeAnalysis: { type: 'number' },
            recommendations: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        standardsCompliance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fta', 'quality-scoring']
}));
