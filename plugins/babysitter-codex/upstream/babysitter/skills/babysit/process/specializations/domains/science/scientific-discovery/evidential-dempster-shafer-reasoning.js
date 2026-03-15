/**
 * @process scientific-discovery/evidential-dempster-shafer-reasoning
 * @description Allocate mass to possibility sets and combine evidence using Dempster-Shafer theory
 * @inputs { frameOfDiscernment: array, evidenceSources: array, massAssignments: array, conflictThreshold: number, outputDir: string }
 * @outputs { success: boolean, beliefFunctions: object, plausibilityFunctions: object, combinedMass: object, conflictAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    frameOfDiscernment = [],
    evidenceSources = [],
    massAssignments = [],
    conflictThreshold = 0.3,
    outputDir = 'dempster-shafer-output',
    combinationRule = 'dempster'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Dempster-Shafer Evidential Reasoning Process');

  // ============================================================================
  // PHASE 1: FRAME OF DISCERNMENT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining frame of discernment');
  const frameDefinition = await ctx.task(frameDefinitionTask, {
    frameOfDiscernment,
    outputDir
  });

  artifacts.push(...frameDefinition.artifacts);

  // ============================================================================
  // PHASE 2: MASS FUNCTION SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying basic probability assignments');
  const massSpecification = await ctx.task(massSpecificationTask, {
    frame: frameDefinition.frame,
    evidenceSources,
    massAssignments,
    outputDir
  });

  artifacts.push(...massSpecification.artifacts);

  // ============================================================================
  // PHASE 3: BELIEF AND PLAUSIBILITY COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing belief and plausibility functions');
  const beliefPlausibility = await ctx.task(beliefPlausibilityTask, {
    frame: frameDefinition.frame,
    massFunction: massSpecification.massFunction,
    outputDir
  });

  artifacts.push(...beliefPlausibility.artifacts);

  // ============================================================================
  // PHASE 4: EVIDENCE COMBINATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Combining evidence sources');
  const combination = await ctx.task(evidenceCombinationTask, {
    frame: frameDefinition.frame,
    massFunctions: massSpecification.massFunctions,
    combinationRule,
    conflictThreshold,
    outputDir
  });

  artifacts.push(...combination.artifacts);

  // ============================================================================
  // PHASE 5: CONFLICT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing evidence conflict');
  const conflictAnalysis = await ctx.task(conflictAnalysisTask, {
    combinationResult: combination.result,
    massFunctions: massSpecification.massFunctions,
    conflictThreshold,
    outputDir
  });

  artifacts.push(...conflictAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: DECISION SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating decision support');
  const decisionSupport = await ctx.task(dsDecisionSupportTask, {
    beliefFunctions: beliefPlausibility.beliefs,
    plausibilityFunctions: beliefPlausibility.plausibilities,
    combinedMass: combination.combinedMass,
    frame: frameDefinition.frame,
    outputDir
  });

  artifacts.push(...decisionSupport.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reasoning quality');
  const qualityScore = await ctx.task(dsQualityTask, {
    frameDefinition,
    massSpecification,
    beliefPlausibility,
    combination,
    conflictAnalysis: conflictAnalysis.analysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review Dempster-Shafer results
  await ctx.breakpoint({
    question: `Dempster-Shafer analysis complete. Quality score: ${qualityScore.overallScore}/100. Conflict level: ${conflictAnalysis.analysis.conflictLevel}. ${qualityMet ? 'Quality meets standards!' : 'Review conflict and mass assignments.'} Review results?`,
    title: 'Dempster-Shafer Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        frameSize: frameDefinition.frame.length,
        evidenceSourcesCount: evidenceSources.length,
        conflictLevel: conflictAnalysis.analysis.conflictLevel,
        mostBelievedHypothesis: decisionSupport.topHypothesis,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const report = await ctx.task(dsReportTask, {
    frameDefinition,
    massSpecification,
    beliefPlausibility,
    combination,
    conflictAnalysis: conflictAnalysis.analysis,
    decisionSupport,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    beliefFunctions: beliefPlausibility.beliefs,
    plausibilityFunctions: beliefPlausibility.plausibilities,
    combinedMass: combination.combinedMass,
    conflictAnalysis: conflictAnalysis.analysis,
    decisionRecommendations: decisionSupport.recommendations,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/evidential-dempster-shafer-reasoning',
      timestamp: startTime,
      outputDir,
      combinationRule,
      conflictThreshold
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Frame of Discernment Definition
export const frameDefinitionTask = defineTask('frame-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define frame of discernment',
  agent: {
    name: 'frame-definition-agent',
    prompt: {
      role: 'Dempster-Shafer theory expert',
      task: 'Define and validate the frame of discernment for evidential reasoning',
      context: args,
      instructions: [
        'Enumerate all mutually exclusive and exhaustive hypotheses',
        'Validate mutual exclusivity of frame elements',
        'Validate exhaustiveness (covers all possibilities)',
        'Generate power set 2^Theta of all subsets',
        'Identify singleton hypotheses vs composite hypotheses',
        'Document the meaning of each hypothesis',
        'Check for refinement or coarsening needs',
        'Create frame structure suitable for mass assignment',
        'Verify frame is well-defined for the problem domain',
        'Save frame definition to output directory'
      ],
      outputFormat: 'JSON with frame (array), powerSet (array), frameProperties (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frame', 'powerSet', 'artifacts'],
      properties: {
        frame: { type: 'array', items: { type: 'string' } },
        powerSet: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              set: { type: 'array' },
              cardinality: { type: 'number' },
              label: { type: 'string' }
            }
          }
        },
        frameProperties: {
          type: 'object',
          properties: {
            size: { type: 'number' },
            powerSetSize: { type: 'number' },
            isMutuallyExclusive: { type: 'boolean' },
            isExhaustive: { type: 'boolean' }
          }
        },
        hypothesisDescriptions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'frame']
}));

// Task 2: Mass Function Specification
export const massSpecificationTask = defineTask('mass-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify basic probability assignments',
  agent: {
    name: 'mass-specification-agent',
    prompt: {
      role: 'evidence modeling specialist',
      task: 'Specify basic probability assignments (mass functions) for each evidence source',
      context: args,
      instructions: [
        'For each evidence source, define mass function m: 2^Theta -> [0,1]',
        'Ensure m(empty set) = 0',
        'Ensure sum of all masses = 1 for each source',
        'Assign mass to focal elements (subsets with m > 0)',
        'Handle vacuous evidence (all mass to Theta)',
        'Handle certain evidence (all mass to singleton)',
        'Document evidence source reliability',
        'Identify consonant vs non-consonant mass functions',
        'Validate all mass functions satisfy axioms',
        'Save mass specifications to output directory'
      ],
      outputFormat: 'JSON with massFunction (object), massFunctions (array), focalElements (array), validationResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['massFunction', 'massFunctions', 'validationResults', 'artifacts'],
      properties: {
        massFunction: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        massFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              sourceName: { type: 'string' },
              masses: { type: 'object' },
              reliability: { type: 'number' }
            }
          }
        },
        focalElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              set: { type: 'array' },
              mass: { type: 'number' },
              source: { type: 'string' }
            }
          }
        },
        validationResults: {
          type: 'object',
          properties: {
            allValid: { type: 'boolean' },
            issues: { type: 'array' }
          }
        },
        isConsonant: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'mass-function']
}));

// Task 3: Belief and Plausibility Computation
export const beliefPlausibilityTask = defineTask('belief-plausibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute belief and plausibility functions',
  agent: {
    name: 'belief-plausibility-agent',
    prompt: {
      role: 'belief function computation expert',
      task: 'Compute belief (Bel) and plausibility (Pl) functions from mass assignments',
      context: args,
      instructions: [
        'Compute belief: Bel(A) = sum of m(B) for all B subset of A',
        'Compute plausibility: Pl(A) = sum of m(B) for all B intersecting A',
        'Verify Bel(A) <= Pl(A) for all A',
        'Verify Pl(A) = 1 - Bel(not A)',
        'Compute uncertainty interval [Bel(A), Pl(A)] for each hypothesis',
        'Identify hypotheses with high belief vs high plausibility',
        'Compute commonality function if needed',
        'Calculate pignistic probability transformation',
        'Generate belief/plausibility comparison',
        'Save computations to output directory'
      ],
      outputFormat: 'JSON with beliefs (object), plausibilities (object), uncertaintyIntervals (object), pignisticProbabilities (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['beliefs', 'plausibilities', 'artifacts'],
      properties: {
        beliefs: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        plausibilities: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        uncertaintyIntervals: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              belief: { type: 'number' },
              plausibility: { type: 'number' },
              width: { type: 'number' }
            }
          }
        },
        pignisticProbabilities: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        commonality: { type: 'object' },
        verificationPassed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'belief-plausibility']
}));

// Task 4: Evidence Combination
export const evidenceCombinationTask = defineTask('evidence-combination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Combine evidence using combination rules',
  agent: {
    name: 'evidence-combination-agent',
    prompt: {
      role: 'evidence fusion expert',
      task: 'Combine multiple evidence sources using appropriate combination rules',
      context: args,
      instructions: [
        'Apply Dempster rule of combination (if selected)',
        'Handle conflict normalization in Dempster rule',
        'Consider alternative rules if high conflict (Yager, PCR, etc.)',
        'Compute combined mass: m12(A) = sum m1(B)*m2(C) where B∩C=A',
        'Normalize by 1-K where K is conflict mass',
        'Track conflict coefficient K for each combination',
        'Combine sources sequentially or simultaneously',
        'Handle vacuous sources appropriately',
        'Verify combined mass satisfies axioms',
        'Save combination results to output directory'
      ],
      outputFormat: 'JSON with combinedMass (object), result (object), conflictCoefficient (number), combinationSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['combinedMass', 'result', 'conflictCoefficient', 'artifacts'],
      properties: {
        combinedMass: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        result: {
          type: 'object',
          properties: {
            combinationRule: { type: 'string' },
            sourcesCount: { type: 'number' },
            focalElementsCount: { type: 'number' }
          }
        },
        conflictCoefficient: { type: 'number' },
        combinationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              sources: { type: 'array' },
              conflict: { type: 'number' }
            }
          }
        },
        alternativeRuleResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'combination']
}));

// Task 5: Conflict Analysis
export const conflictAnalysisTask = defineTask('conflict-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze evidence conflict',
  agent: {
    name: 'conflict-analysis-agent',
    prompt: {
      role: 'evidence conflict analyst',
      task: 'Analyze sources and nature of conflict between evidence items',
      context: args,
      instructions: [
        'Compute pairwise conflict between evidence sources',
        'Identify sources contributing most to conflict',
        'Analyze whether conflict is due to unreliable sources',
        'Analyze whether conflict is due to genuinely conflicting evidence',
        'Assess if conflict exceeds acceptable threshold',
        'Recommend conflict resolution strategies',
        'Consider source discounting if reliability differs',
        'Identify focal elements causing most conflict',
        'Assess impact of conflict on conclusions',
        'Save conflict analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), pairwiseConflicts (object), conflictSources (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'pairwiseConflicts', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            conflictLevel: { type: 'string' },
            totalConflict: { type: 'number' },
            isAcceptable: { type: 'boolean' },
            mainCause: { type: 'string' }
          }
        },
        pairwiseConflicts: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        conflictSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contributionToConflict: { type: 'number' },
              conflictsWith: { type: 'array' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              rationale: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        conflictingFocalElements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'conflict']
}));

// Task 6: Decision Support
export const dsDecisionSupportTask = defineTask('ds-decision-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate decision support from belief functions',
  agent: {
    name: 'ds-decision-agent',
    prompt: {
      role: 'decision support specialist',
      task: 'Generate decision recommendations from Dempster-Shafer analysis',
      context: args,
      instructions: [
        'Rank hypotheses by belief value',
        'Rank hypotheses by plausibility value',
        'Rank hypotheses by pignistic probability',
        'Identify hypothesis with maximum belief',
        'Identify hypothesis with minimum uncertainty interval',
        'Apply decision rules (max belief, max plausibility, max BetP)',
        'Assess confidence in top recommendations',
        'Identify when evidence is insufficient for decision',
        'Suggest additional evidence needed',
        'Save decision support to output directory'
      ],
      outputFormat: 'JSON with recommendations (array), topHypothesis (string), rankings (object), confidenceAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'topHypothesis', 'rankings', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              recommendation: { type: 'string' },
              confidence: { type: 'string' },
              basis: { type: 'string' }
            }
          }
        },
        topHypothesis: { type: 'string' },
        rankings: {
          type: 'object',
          properties: {
            byBelief: { type: 'array' },
            byPlausibility: { type: 'array' },
            byPignistic: { type: 'array' }
          }
        },
        confidenceAssessment: {
          type: 'object',
          properties: {
            overallConfidence: { type: 'string' },
            evidenceSufficiency: { type: 'string' },
            additionalEvidenceNeeded: { type: 'array' }
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
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'decision']
}));

// Task 7: Quality Assessment
export const dsQualityTask = defineTask('ds-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of Dempster-Shafer analysis',
  agent: {
    name: 'ds-quality-agent',
    prompt: {
      role: 'belief function methodology reviewer',
      task: 'Assess quality and validity of Dempster-Shafer analysis',
      context: args,
      instructions: [
        'Evaluate frame definition quality (weight: 20%)',
        'Assess mass function specification validity (weight: 25%)',
        'Check belief/plausibility computation correctness (weight: 20%)',
        'Evaluate evidence combination appropriateness (weight: 20%)',
        'Assess conflict handling adequacy (weight: 15%)',
        'Verify all D-S axioms are satisfied',
        'Check for proper handling of ignorance',
        'Validate combination rule choice',
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
            frameDefinition: { type: 'number' },
            massSpecification: { type: 'number' },
            beliefPlausibility: { type: 'number' },
            evidenceCombination: { type: 'number' },
            conflictHandling: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        axiomsSatisfied: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'quality']
}));

// Task 8: Report Generation
export const dsReportTask = defineTask('ds-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Dempster-Shafer analysis report',
  agent: {
    name: 'ds-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on Dempster-Shafer evidential reasoning',
      context: args,
      instructions: [
        'Create executive summary of key findings',
        'Document frame of discernment definition',
        'Present mass functions for each evidence source',
        'Show belief and plausibility values with tables',
        'Explain evidence combination process',
        'Discuss conflict analysis results',
        'Present decision recommendations',
        'Include visualizations (belief intervals, mass distributions)',
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
  labels: ['agent', 'scientific-discovery', 'dempster-shafer', 'reporting']
}));
