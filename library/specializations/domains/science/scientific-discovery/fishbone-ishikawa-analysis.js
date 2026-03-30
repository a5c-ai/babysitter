/**
 * @process domains/science/scientific-discovery/fishbone-ishikawa-analysis
 * @description Categorize and visualize potential causes using cause-effect diagrams - Guides practitioners
 * through creating Ishikawa (fishbone) diagrams to systematically identify and organize potential causes
 * of a problem across multiple categories.
 * @inputs { effect: string, categories?: array, context: object, team?: array }
 * @outputs { success: boolean, diagram: object, causes: object, prioritizedCauses: array, actionPlan: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/fishbone-ishikawa-analysis', {
 *   effect: 'Product defect rate exceeds 5%',
 *   categories: ['Man', 'Machine', 'Method', 'Material', 'Measurement', 'Environment'],
 *   context: { industry: 'manufacturing', product: 'electronic-components' }
 * });
 *
 * @references
 * - Ishikawa, K. (1986). Guide to Quality Control
 * - Tague, N.R. (2005). The Quality Toolbox
 * - ASQ (2024). Cause and Effect Diagram
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    effect,
    categories = ['People', 'Process', 'Equipment', 'Materials', 'Environment', 'Management'],
    context = {},
    team = [],
    outputDir = 'fishbone-output',
    minimumCoverageScore = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Fishbone Analysis for: ${effect}`);

  // ============================================================================
  // PHASE 1: EFFECT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining the effect statement');
  const effectDefinition = await ctx.task(effectDefinitionTask, {
    effect,
    context,
    outputDir
  });

  artifacts.push(...effectDefinition.artifacts);

  // ============================================================================
  // PHASE 2: CATEGORY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting and customizing categories');
  const categorySelection = await ctx.task(categorySelectionTask, {
    effect: effectDefinition.clarifiedEffect,
    categories,
    context,
    outputDir
  });

  artifacts.push(...categorySelection.artifacts);

  // ============================================================================
  // PHASE 3: BRAINSTORMING CAUSES BY CATEGORY
  // ============================================================================

  ctx.log('info', 'Phase 3: Brainstorming causes for each category');

  const categoryAnalyses = await ctx.parallel.all(
    categorySelection.selectedCategories.map((category) =>
      () => ctx.task(categoryBrainstormTask, {
        effect: effectDefinition.clarifiedEffect,
        category,
        context,
        outputDir
      })
    )
  );

  categoryAnalyses.forEach(analysis => {
    artifacts.push(...(analysis.artifacts || []));
  });

  // ============================================================================
  // PHASE 4: SUB-CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing sub-causes');
  const subCauseAnalysis = await ctx.task(subCauseAnalysisTask, {
    effect: effectDefinition.clarifiedEffect,
    categoryAnalyses,
    context,
    outputDir
  });

  artifacts.push(...subCauseAnalysis.artifacts);

  // Breakpoint: Review fishbone structure
  await ctx.breakpoint({
    question: `Fishbone diagram developed with ${categorySelection.selectedCategories.length} categories and ${subCauseAnalysis.totalCauses} total causes. Review structure?`,
    title: 'Fishbone Structure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        effect: effectDefinition.clarifiedEffect,
        categories: categorySelection.selectedCategories.length,
        totalCauses: subCauseAnalysis.totalCauses,
        totalSubCauses: subCauseAnalysis.totalSubCauses
      }
    }
  });

  // ============================================================================
  // PHASE 5: CAUSE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Verifying identified causes');
  const causeVerification = await ctx.task(causeVerificationTask, {
    categoryAnalyses,
    subCauseAnalysis,
    context,
    outputDir
  });

  artifacts.push(...causeVerification.artifacts);

  // ============================================================================
  // PHASE 6: CAUSE PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing causes');
  const causePrioritization = await ctx.task(causePrioritizationTask, {
    verifiedCauses: causeVerification.verifiedCauses,
    context,
    outputDir
  });

  artifacts.push(...causePrioritization.artifacts);

  // ============================================================================
  // PHASE 7: DIAGRAM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating fishbone diagram');
  const diagramGeneration = await ctx.task(diagramGenerationTask, {
    effect: effectDefinition.clarifiedEffect,
    categoryAnalyses,
    subCauseAnalysis,
    causePrioritization,
    outputDir
  });

  artifacts.push(...diagramGeneration.artifacts);

  // ============================================================================
  // PHASE 8: ROOT CAUSE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Selecting root causes for action');
  const rootCauseSelection = await ctx.task(rootCauseSelectionTask, {
    prioritizedCauses: causePrioritization.prioritizedCauses,
    context,
    outputDir
  });

  artifacts.push(...rootCauseSelection.artifacts);

  // ============================================================================
  // PHASE 9: ACTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing action plan');
  const actionPlan = await ctx.task(fishboneActionPlanTask, {
    rootCauses: rootCauseSelection.selectedRootCauses,
    context,
    team,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  // ============================================================================
  // PHASE 10: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 10: Scoring analysis quality');
  const qualityScore = await ctx.task(fishboneQualityScoringTask, {
    effectDefinition,
    categoryAnalyses,
    subCauseAnalysis,
    causeVerification,
    causePrioritization,
    minimumCoverageScore,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= minimumCoverageScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Fishbone analysis complete. ${rootCauseSelection.selectedRootCauses?.length || 0} root causes selected for action. Quality score: ${qualityScore.overallScore}/100. Approve analysis?`,
    title: 'Fishbone Analysis Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        effect: effectDefinition.clarifiedEffect,
        rootCausesSelected: rootCauseSelection.selectedRootCauses?.length || 0,
        actionsPlanned: actionPlan.actions?.length || 0,
        qualityScore: qualityScore.overallScore,
        qualityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    effect: effectDefinition.clarifiedEffect,
    diagram: {
      structure: diagramGeneration.diagramStructure,
      visualization: diagramGeneration.visualizationPath,
      categories: categorySelection.selectedCategories
    },
    causes: {
      byCategory: subCauseAnalysis.causesByCategory,
      totalCauses: subCauseAnalysis.totalCauses,
      totalSubCauses: subCauseAnalysis.totalSubCauses
    },
    prioritizedCauses: causePrioritization.prioritizedCauses,
    rootCauses: rootCauseSelection.selectedRootCauses,
    actionPlan: {
      actions: actionPlan.actions,
      timeline: actionPlan.timeline,
      owners: actionPlan.owners
    },
    qualityScore: {
      overall: qualityScore.overallScore,
      qualityMet,
      coverageScore: qualityScore.coverageScore,
      depthScore: qualityScore.depthScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/fishbone-ishikawa-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const effectDefinitionTask = defineTask('effect-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define the effect statement',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Quality analysis specialist',
      task: 'Define and clarify the effect (problem) statement for fishbone analysis',
      context: args,
      instructions: [
        'Clarify the effect statement to be specific and measurable',
        'Ensure the effect describes the problem, not causes',
        'Quantify the effect where possible',
        'Define the scope of the effect',
        'Identify when and where the effect occurs',
        'Document the impact of the effect',
        'Verify the effect is real and not assumed',
        'Ensure effect is stated neutrally',
        'Position effect as the head of the fishbone',
        'Create clear effect statement for diagram'
      ],
      outputFormat: 'JSON with clarifiedEffect, originalEffect, measurement, scope, timing, impact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedEffect', 'artifacts'],
      properties: {
        clarifiedEffect: { type: 'string' },
        originalEffect: { type: 'string' },
        measurement: { type: 'string' },
        scope: { type: 'string' },
        timing: { type: 'string' },
        location: { type: 'string' },
        impact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'effect-definition']
}));

export const categorySelectionTask = defineTask('category-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select and customize categories',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Fishbone diagram specialist',
      task: 'Select and customize appropriate categories for the fishbone diagram',
      context: args,
      instructions: [
        'Evaluate standard category sets (6M, 8P, 4S, etc.)',
        'Select categories most relevant to the context',
        'Manufacturing: Man, Machine, Method, Material, Measurement, Mother Nature',
        'Service: People, Process, Physical evidence, Place, Product, Price, Promotion, Policy',
        'Customize categories for the specific domain',
        'Ensure categories are mutually exclusive',
        'Verify categories cover all potential cause areas',
        'Add domain-specific categories if needed',
        'Document rationale for category selection',
        'Prepare category descriptions'
      ],
      outputFormat: 'JSON with selectedCategories, categorySet, rationale, categoryDescriptions, customCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCategories', 'rationale', 'artifacts'],
      properties: {
        selectedCategories: { type: 'array', items: { type: 'string' } },
        categorySet: { type: 'string' },
        rationale: { type: 'string' },
        categoryDescriptions: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        customCategories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'category-selection']
}));

export const categoryBrainstormTask = defineTask('category-brainstorm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Brainstorm causes for: ${args.category}`,
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Brainstorming facilitator',
      task: `Brainstorm potential causes within the "${args.category}" category`,
      context: args,
      instructions: [
        'Generate comprehensive list of potential causes in this category',
        'Think broadly - include obvious and non-obvious causes',
        'Consider direct and indirect causes',
        'Ask "What in this category could cause the effect?"',
        'Include causes even if unsure - verification comes later',
        'Avoid filtering or judging causes during brainstorming',
        'Consider interactions with other categories',
        'Document reasoning for each cause',
        'Group similar causes together',
        'Aim for at least 5-10 causes per category'
      ],
      outputFormat: 'JSON with category, causes, reasoning, groupings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'causes', 'artifacts'],
      properties: {
        category: { type: 'string' },
        causes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              description: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        },
        reasoning: { type: 'string' },
        groupings: { type: 'array' },
        interactionNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'brainstorm', args.category.toLowerCase()]
}));

export const subCauseAnalysisTask = defineTask('sub-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze sub-causes',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Root cause analyst',
      task: 'Analyze each primary cause to identify sub-causes (secondary bones)',
      context: args,
      instructions: [
        'For each primary cause, ask "Why does this happen?"',
        'Identify 2-4 sub-causes for significant primary causes',
        'Create secondary bones on the fishbone diagram',
        'Continue to tertiary causes if needed',
        'Ensure sub-causes are more specific than primary causes',
        'Document relationships between causes',
        'Identify common sub-causes across categories',
        'Note causes that appear in multiple branches',
        'Organize sub-causes hierarchically',
        'Calculate total cause counts'
      ],
      outputFormat: 'JSON with causesByCategory, totalCauses, totalSubCauses, crossCategoryCauses, hierarchyDepth, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['causesByCategory', 'totalCauses', 'totalSubCauses', 'artifacts'],
      properties: {
        causesByCategory: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                primaryCause: { type: 'string' },
                subCauses: { type: 'array' }
              }
            }
          }
        },
        totalCauses: { type: 'number' },
        totalSubCauses: { type: 'number' },
        crossCategoryCauses: { type: 'array', items: { type: 'string' } },
        hierarchyDepth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'sub-cause-analysis']
}));

export const causeVerificationTask = defineTask('cause-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify identified causes',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Cause verification specialist',
      task: 'Verify the validity and relevance of identified causes',
      context: args,
      instructions: [
        'Review each cause for logical connection to effect',
        'Verify causes are actual causes, not symptoms',
        'Check for evidence supporting each cause',
        'Identify causes that need investigation',
        'Mark causes as verified, unverified, or disputed',
        'Remove duplicate causes',
        'Consolidate similar causes',
        'Flag causes with insufficient evidence',
        'Document verification method for each',
        'Note causes requiring additional data'
      ],
      outputFormat: 'JSON with verifiedCauses, unverifiedCauses, disputedCauses, removedDuplicates, consolidatedCauses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verifiedCauses', 'artifacts'],
      properties: {
        verifiedCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              verificationMethod: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        unverifiedCauses: { type: 'array' },
        disputedCauses: { type: 'array' },
        removedDuplicates: { type: 'number' },
        consolidatedCauses: { type: 'array' },
        needsInvestigation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'verification']
}));

export const causePrioritizationTask = defineTask('cause-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize causes',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Prioritization specialist',
      task: 'Prioritize causes based on impact, likelihood, and addressability',
      context: args,
      instructions: [
        'Rate each cause on impact (1-10)',
        'Rate each cause on likelihood/frequency (1-10)',
        'Rate each cause on ease of addressing (1-10)',
        'Calculate priority score for each cause',
        'Rank causes by priority score',
        'Identify top 3-5 causes for immediate action',
        'Group causes into high/medium/low priority',
        'Consider resource constraints in prioritization',
        'Document prioritization criteria and weights',
        'Create Pareto analysis if applicable'
      ],
      outputFormat: 'JSON with prioritizedCauses, priorityCriteria, topCauses, paretoAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedCauses', 'topCauses', 'artifacts'],
      properties: {
        prioritizedCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              impactScore: { type: 'number' },
              likelihoodScore: { type: 'number' },
              addressabilityScore: { type: 'number' },
              priorityScore: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        priorityCriteria: { type: 'object' },
        topCauses: { type: 'array' },
        highPriority: { type: 'array' },
        mediumPriority: { type: 'array' },
        lowPriority: { type: 'array' },
        paretoAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'prioritization']
}));

export const diagramGenerationTask = defineTask('diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate fishbone diagram',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Diagram visualization specialist',
      task: 'Generate the complete fishbone diagram structure and visualization',
      context: args,
      instructions: [
        'Create diagram structure with effect as head',
        'Add main bones for each category',
        'Add primary causes as ribs off main bones',
        'Add sub-causes as smaller ribs',
        'Highlight prioritized causes visually',
        'Add annotations for key causes',
        'Create text-based diagram representation',
        'Generate diagram in multiple formats if possible',
        'Include legend explaining prioritization',
        'Ensure diagram is readable and organized'
      ],
      outputFormat: 'JSON with diagramStructure, visualizationPath, textRepresentation, highlights, legend, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramStructure', 'textRepresentation', 'artifacts'],
      properties: {
        diagramStructure: {
          type: 'object',
          properties: {
            effect: { type: 'string' },
            categories: { type: 'array' }
          }
        },
        visualizationPath: { type: 'string' },
        textRepresentation: { type: 'string' },
        highlights: { type: 'array' },
        legend: { type: 'object' },
        formats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'diagram-generation']
}));

export const rootCauseSelectionTask = defineTask('root-cause-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select root causes for action',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Root cause selection specialist',
      task: 'Select the root causes to address based on prioritization and context',
      context: args,
      instructions: [
        'Review prioritized causes list',
        'Select 3-5 root causes for immediate action',
        'Ensure selected causes are truly root causes',
        'Consider quick wins vs long-term fixes',
        'Balance impact with feasibility',
        'Consider resource availability',
        'Document selection rationale',
        'Identify causes deferred for later',
        'Plan for addressing lower priority causes',
        'Create root cause summary'
      ],
      outputFormat: 'JSON with selectedRootCauses, selectionRationale, deferredCauses, quickWins, longTermFixes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedRootCauses', 'selectionRationale', 'artifacts'],
      properties: {
        selectedRootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              rationale: { type: 'string' },
              type: { type: 'string', enum: ['quickWin', 'longTerm', 'immediate'] }
            }
          }
        },
        selectionRationale: { type: 'string' },
        deferredCauses: { type: 'array' },
        quickWins: { type: 'array' },
        longTermFixes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'root-cause-selection']
}));

export const fishboneActionPlanTask = defineTask('fishbone-action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop action plan',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Action planning specialist',
      task: 'Develop action plan to address selected root causes',
      context: args,
      instructions: [
        'Create specific actions for each root cause',
        'Assign owners for each action',
        'Set realistic timelines',
        'Define success metrics',
        'Identify required resources',
        'Plan verification activities',
        'Create communication plan',
        'Define escalation procedures',
        'Plan for monitoring effectiveness',
        'Schedule follow-up reviews'
      ],
      outputFormat: 'JSON with actions, timeline, owners, metrics, resources, verificationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'timeline', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rootCause: { type: 'string' },
              action: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              metric: { type: 'string' }
            }
          }
        },
        timeline: { type: 'object' },
        owners: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'array' },
        resources: { type: 'object' },
        verificationPlan: { type: 'object' },
        followUpSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'action-plan']
}));

export const fishboneQualityScoringTask = defineTask('fishbone-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  skill: { name: 'root-cause-analyzer' },
  agent: {
    name: 'root-cause-analyst',
    skills: ['root-cause-analyzer', 'causal-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Fishbone analysis quality auditor',
      task: 'Score the quality and completeness of the fishbone analysis',
      context: args,
      instructions: [
        'Score effect definition clarity (0-100)',
        'Score category coverage (0-100)',
        'Score cause identification depth (0-100)',
        'Score cause verification rigor (0-100)',
        'Score prioritization methodology (0-100)',
        'Calculate overall quality score',
        'Identify gaps in the analysis',
        'Recommend improvements',
        'Compare against best practices',
        'Assess actionability of conclusions'
      ],
      outputFormat: 'JSON with overallScore, coverageScore, depthScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'coverageScore', 'depthScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        depthScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            effectDefinition: { type: 'number' },
            categoryCoverage: { type: 'number' },
            causeDepth: { type: 'number' },
            verification: { type: 'number' },
            prioritization: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fishbone', 'quality-scoring']
}));
