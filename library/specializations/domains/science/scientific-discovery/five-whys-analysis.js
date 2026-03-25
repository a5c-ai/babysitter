/**
 * @process domains/science/scientific-discovery/five-whys-analysis
 * @description Apply iterative questioning to drill down to root causes - Guides practitioners through
 * the Five Whys technique to systematically uncover the fundamental cause of a problem by repeatedly
 * asking "why" until reaching actionable root causes.
 * @inputs { problem: string, context: object, evidence?: array, stakeholders?: array }
 * @outputs { success: boolean, whyChain: array, rootCauses: array, validationResults: object, actionPlan: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/five-whys-analysis', {
 *   problem: 'Customer complaints increased by 40% this quarter',
 *   context: { department: 'customer-service', timeline: 'Q3-2024' },
 *   evidence: ['Call logs', 'Survey responses', 'Ticket data']
 * });
 *
 * @references
 * - Ohno, T. (1988). Toyota Production System
 * - Serrat, O. (2017). The Five Whys Technique. Knowledge Solutions
 * - Andersen, B. & Fagerhaug, T. (2006). Root Cause Analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    context = {},
    evidence = [],
    stakeholders = [],
    maxIterations = 7,
    outputDir = 'five-whys-output',
    minimumDepthScore = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Five Whys Analysis for: ${problem}`);

  // ============================================================================
  // PHASE 1: PROBLEM DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining and clarifying the problem');
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    problem,
    context,
    evidence,
    outputDir
  });

  artifacts.push(...problemDefinition.artifacts);

  // ============================================================================
  // PHASE 2: EVIDENCE GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 2: Gathering supporting evidence');
  const evidenceGathering = await ctx.task(evidenceGatheringTask, {
    problem: problemDefinition.clarifiedProblem,
    context,
    evidence,
    outputDir
  });

  artifacts.push(...evidenceGathering.artifacts);

  // ============================================================================
  // PHASE 3: ITERATIVE WHY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting iterative why analysis');
  const whyAnalysis = await ctx.task(iterativeWhyAnalysisTask, {
    problem: problemDefinition.clarifiedProblem,
    evidenceGathering,
    context,
    maxIterations,
    outputDir
  });

  artifacts.push(...whyAnalysis.artifacts);

  // Breakpoint: Review why chain
  await ctx.breakpoint({
    question: `Why chain developed with ${whyAnalysis.depth} levels. Identified ${whyAnalysis.rootCauses?.length || 0} potential root causes. Review before validation?`,
    title: 'Why Chain Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problem: problemDefinition.clarifiedProblem,
        depth: whyAnalysis.depth,
        rootCausesCount: whyAnalysis.rootCauses?.length || 0,
        branchesExplored: whyAnalysis.branches?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 4: ROOT CAUSE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating identified root causes');
  const rootCauseValidation = await ctx.task(rootCauseValidationTask, {
    whyChain: whyAnalysis.whyChain,
    rootCauses: whyAnalysis.rootCauses,
    evidence: evidenceGathering,
    context,
    outputDir
  });

  artifacts.push(...rootCauseValidation.artifacts);

  // ============================================================================
  // PHASE 5: COUNTERMEASURE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing countermeasures');
  const countermeasures = await ctx.task(countermeasureDevelopmentTask, {
    rootCauses: rootCauseValidation.validatedRootCauses,
    context,
    stakeholders,
    outputDir
  });

  artifacts.push(...countermeasures.artifacts);

  // ============================================================================
  // PHASE 6: ACTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating action plan');
  const actionPlan = await ctx.task(actionPlanTask, {
    rootCauses: rootCauseValidation.validatedRootCauses,
    countermeasures: countermeasures.countermeasures,
    stakeholders,
    context,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  // ============================================================================
  // PHASE 7: ANALYSIS QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(analysisQualityScoringTask, {
    problemDefinition,
    whyAnalysis,
    rootCauseValidation,
    countermeasures,
    minimumDepthScore,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= minimumDepthScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Five Whys analysis complete. ${rootCauseValidation.validatedRootCauses?.length || 0} validated root causes. Quality score: ${qualityScore.overallScore}/100. Approve analysis?`,
    title: 'Five Whys Analysis Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problem: problemDefinition.clarifiedProblem,
        validatedRootCauses: rootCauseValidation.validatedRootCauses?.length || 0,
        countermeasures: countermeasures.countermeasures?.length || 0,
        qualityScore: qualityScore.overallScore,
        qualityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problem: problemDefinition.clarifiedProblem,
    whyChain: whyAnalysis.whyChain,
    rootCauses: rootCauseValidation.validatedRootCauses,
    validationResults: {
      validated: rootCauseValidation.validatedCount,
      rejected: rootCauseValidation.rejectedCount,
      validationMethods: rootCauseValidation.validationMethods
    },
    countermeasures: countermeasures.countermeasures,
    actionPlan: {
      actions: actionPlan.actions,
      timeline: actionPlan.timeline,
      owners: actionPlan.owners,
      successMetrics: actionPlan.successMetrics
    },
    qualityScore: {
      overall: qualityScore.overallScore,
      qualityMet,
      depthScore: qualityScore.depthScore,
      validationScore: qualityScore.validationScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/five-whys-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define and clarify the problem',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine'],
    prompt: {
      role: 'Problem analysis specialist',
      task: 'Define and clarify the problem statement for Five Whys analysis',
      context: args,
      instructions: [
        'Clarify the problem statement to be specific and measurable',
        'Distinguish symptoms from the actual problem',
        'Quantify the problem impact where possible',
        'Identify when the problem started or was noticed',
        'Define the scope and boundaries of the problem',
        'Identify who is affected by the problem',
        'Document what is known vs unknown about the problem',
        'Ensure the problem statement is neutral (not blame-assigning)',
        'Verify the problem is within scope to address',
        'Create a clear problem statement for analysis'
      ],
      outputFormat: 'JSON with clarifiedProblem, originalProblem, symptoms, impact, scope, affectedParties, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedProblem', 'impact', 'artifacts'],
      properties: {
        clarifiedProblem: { type: 'string' },
        originalProblem: { type: 'string' },
        symptoms: { type: 'array', items: { type: 'string' } },
        impact: {
          type: 'object',
          properties: {
            quantitative: { type: 'string' },
            qualitative: { type: 'string' }
          }
        },
        scope: { type: 'string' },
        affectedParties: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'string' },
        knownFacts: { type: 'array', items: { type: 'string' } },
        unknowns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'problem-definition']
}));

export const evidenceGatheringTask = defineTask('evidence-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather supporting evidence',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'semantic-scholar-search'],
    prompt: {
      role: 'Evidence analyst',
      task: 'Gather and organize evidence to support the why analysis',
      context: args,
      instructions: [
        'Catalog all available evidence sources',
        'Assess quality and reliability of each evidence source',
        'Identify gaps in evidence',
        'Organize evidence chronologically',
        'Identify patterns in the evidence',
        'Document data sources and collection methods',
        'Note any conflicting evidence',
        'Prioritize evidence by relevance',
        'Create evidence summary for analysis',
        'Recommend additional evidence to gather'
      ],
      outputFormat: 'JSON with evidenceSources, evidenceQuality, gaps, patterns, chronology, conflicts, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evidenceSources', 'artifacts'],
      properties: {
        evidenceSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              reliability: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        evidenceQuality: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        chronology: { type: 'array' },
        conflicts: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'evidence-gathering']
}));

export const iterativeWhyAnalysisTask = defineTask('iterative-why-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct iterative why analysis',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Root cause analyst using Five Whys methodology',
      task: 'Conduct systematic Five Whys analysis to identify root causes',
      context: args,
      instructions: [
        'Start with the clarified problem statement',
        'Ask "Why did this happen?" for each level',
        'Ensure each answer is based on evidence, not assumptions',
        'Continue until reaching actionable root causes',
        'Explore multiple branches when causes diverge',
        'Stop when answers become circular or leave scope',
        'Document evidence supporting each why',
        'Note assumptions that need verification',
        'Identify when root cause is systemic vs specific',
        'Create complete why chain visualization'
      ],
      outputFormat: 'JSON with whyChain, depth, branches, rootCauses, assumptions, evidenceLinks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['whyChain', 'depth', 'rootCauses', 'artifacts'],
      properties: {
        whyChain: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              question: { type: 'string' },
              answer: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string' }
            }
          }
        },
        depth: { type: 'number' },
        branches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              divergencePoint: { type: 'number' },
              alternativeChain: { type: 'array' }
            }
          }
        },
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              type: { type: 'string', enum: ['systemic', 'specific', 'behavioral', 'process'] },
              confidence: { type: 'string' },
              actionable: { type: 'boolean' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        evidenceLinks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'iterative-analysis']
}));

export const rootCauseValidationTask = defineTask('root-cause-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate identified root causes',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Root cause validation specialist',
      task: 'Validate the identified root causes through multiple methods',
      context: args,
      instructions: [
        'Test each root cause against available evidence',
        'Apply the "therefore" test (reverse logic check)',
        'Verify the causal chain is logically sound',
        'Check if fixing root cause would prevent recurrence',
        'Assess if root cause is within control to address',
        'Identify any root causes that are actually symptoms',
        'Rate confidence level for each root cause',
        'Document validation methods used',
        'Recommend additional validation if needed',
        'Prioritize root causes by impact and addressability'
      ],
      outputFormat: 'JSON with validatedRootCauses, rejectedCauses, validatedCount, rejectedCount, validationMethods, confidenceLevels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedRootCauses', 'validatedCount', 'validationMethods', 'artifacts'],
      properties: {
        validatedRootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              validationResult: { type: 'string' },
              confidence: { type: 'string' },
              addressable: { type: 'boolean' },
              priority: { type: 'string' }
            }
          }
        },
        rejectedCauses: { type: 'array' },
        validatedCount: { type: 'number' },
        rejectedCount: { type: 'number' },
        validationMethods: { type: 'array', items: { type: 'string' } },
        confidenceLevels: { type: 'object' },
        additionalValidationNeeded: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'validation']
}));

export const countermeasureDevelopmentTask = defineTask('countermeasure-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop countermeasures',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'hypothesis-generator'],
    prompt: {
      role: 'Countermeasure development specialist',
      task: 'Develop countermeasures to address validated root causes',
      context: args,
      instructions: [
        'Develop at least one countermeasure per root cause',
        'Consider immediate (corrective) and long-term (preventive) actions',
        'Ensure countermeasures address root cause, not symptoms',
        'Evaluate feasibility of each countermeasure',
        'Estimate cost and effort for implementation',
        'Identify potential side effects or risks',
        'Consider systemic vs local countermeasures',
        'Prioritize countermeasures by impact and feasibility',
        'Define success criteria for each countermeasure',
        'Recommend verification methods'
      ],
      outputFormat: 'JSON with countermeasures, prioritization, feasibilityAssessment, risks, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['countermeasures', 'artifacts'],
      properties: {
        countermeasures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rootCause: { type: 'string' },
              countermeasure: { type: 'string' },
              type: { type: 'string', enum: ['corrective', 'preventive', 'both'] },
              feasibility: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' },
              priority: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        prioritization: { type: 'array' },
        feasibilityAssessment: { type: 'object' },
        risks: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'countermeasures']
}));

export const actionPlanTask = defineTask('action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create action plan',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer'],
    prompt: {
      role: 'Action planning specialist',
      task: 'Create detailed action plan for implementing countermeasures',
      context: args,
      instructions: [
        'Create specific actions for each countermeasure',
        'Assign owners for each action',
        'Set realistic timelines and deadlines',
        'Define dependencies between actions',
        'Specify required resources',
        'Define success metrics and KPIs',
        'Plan verification checkpoints',
        'Create communication plan',
        'Define escalation procedures',
        'Plan for monitoring effectiveness'
      ],
      outputFormat: 'JSON with actions, timeline, owners, dependencies, resources, successMetrics, verificationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'timeline', 'successMetrics', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              status: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: { type: 'object' },
        owners: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array' },
        resources: { type: 'object' },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        verificationPlan: { type: 'object' },
        communicationPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'action-plan']
}));

export const analysisQualityScoringTask = defineTask('analysis-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'formal-logic-reasoner'],
    prompt: {
      role: 'Root cause analysis quality auditor',
      task: 'Score the quality and completeness of the Five Whys analysis',
      context: args,
      instructions: [
        'Score problem definition clarity (0-100)',
        'Score depth of why analysis (0-100)',
        'Score evidence support for each why (0-100)',
        'Score root cause validation rigor (0-100)',
        'Score countermeasure appropriateness (0-100)',
        'Calculate overall analysis quality score',
        'Identify weaknesses in the analysis',
        'Recommend improvements',
        'Compare against best practices',
        'Assess actionability of conclusions'
      ],
      outputFormat: 'JSON with overallScore, depthScore, validationScore, componentScores, weaknesses, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'depthScore', 'validationScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        depthScore: { type: 'number', minimum: 0, maximum: 100 },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            problemDefinition: { type: 'number' },
            evidenceSupport: { type: 'number' },
            logicalChain: { type: 'number' },
            rootCauseValidation: { type: 'number' },
            countermeasures: { type: 'number' }
          }
        },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        bestPracticesComparison: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'five-whys', 'quality-scoring']
}));
