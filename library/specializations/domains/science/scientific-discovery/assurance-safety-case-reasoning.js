/**
 * @process scientific-discovery/assurance-safety-case-reasoning
 * @description Structured arguments for system safety/security using Goal Structuring Notation and similar frameworks
 * @inputs { topLevelGoal: string, context: array, strategies: array, evidence: array, hazards: array, outputDir: string }
 * @outputs { success: boolean, safetyCaseStructure: object, evidenceAssessment: object, gaps: array, overallConfidence: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    topLevelGoal = '',
    context = [],
    strategies = [],
    evidence = [],
    hazards = [],
    outputDir = 'safety-case-output',
    notationType = 'gsn', // gsn, cae, sacm
    confidenceThreshold = 0.8
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Assurance/Safety Case Reasoning Process');

  // ============================================================================
  // PHASE 1: GOAL DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Decomposing top-level safety goal');
  const goalDecomposition = await ctx.task(goalDecompositionTask, {
    topLevelGoal,
    context,
    hazards,
    outputDir
  });

  artifacts.push(...goalDecomposition.artifacts);

  // ============================================================================
  // PHASE 2: STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining argumentation strategies');
  const strategyDefinition = await ctx.task(strategyDefinitionTask, {
    goals: goalDecomposition.goals,
    strategies,
    hazards,
    outputDir
  });

  artifacts.push(...strategyDefinition.artifacts);

  // ============================================================================
  // PHASE 3: ARGUMENT STRUCTURE CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Constructing argument structure');
  const argumentStructure = await ctx.task(argumentStructureTask, {
    goals: goalDecomposition.goals,
    strategies: strategyDefinition.strategies,
    context,
    notationType,
    outputDir
  });

  artifacts.push(...argumentStructure.artifacts);

  // ============================================================================
  // PHASE 4: EVIDENCE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 4: Mapping evidence to claims');
  const evidenceMapping = await ctx.task(evidenceMappingTask, {
    argumentStructure: argumentStructure.structure,
    evidence,
    outputDir
  });

  artifacts.push(...evidenceMapping.artifacts);

  // ============================================================================
  // PHASE 5: EVIDENCE QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing evidence quality');
  const evidenceAssessment = await ctx.task(evidenceQualityTask, {
    evidenceMapping: evidenceMapping.mapping,
    evidence,
    outputDir
  });

  artifacts.push(...evidenceAssessment.artifacts);

  // ============================================================================
  // PHASE 6: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing gaps in safety case');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    argumentStructure: argumentStructure.structure,
    evidenceMapping: evidenceMapping.mapping,
    evidenceAssessment: evidenceAssessment.assessment,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: CONFIDENCE PROPAGATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Propagating confidence through argument');
  const confidencePropagation = await ctx.task(confidencePropagationTask, {
    argumentStructure: argumentStructure.structure,
    evidenceAssessment: evidenceAssessment.assessment,
    gaps: gapAnalysis.gaps,
    outputDir
  });

  artifacts.push(...confidencePropagation.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing safety case quality');
  const qualityScore = await ctx.task(safetyCaseQualityTask, {
    goalDecomposition,
    argumentStructure: argumentStructure.structure,
    evidenceAssessment: evidenceAssessment.assessment,
    gapAnalysis,
    confidencePropagation,
    confidenceThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;
  const confidenceMet = confidencePropagation.overallConfidence >= confidenceThreshold;

  // Breakpoint: Review safety case results
  await ctx.breakpoint({
    question: `Safety case analysis complete. Quality score: ${qualityScore.overallScore}/100. Overall confidence: ${(confidencePropagation.overallConfidence * 100).toFixed(1)}%. ${gapAnalysis.gaps.length} gaps identified. ${qualityMet && confidenceMet ? 'Meets thresholds!' : 'Review gaps and evidence.'} Review results?`,
    title: 'Safety Case Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        goalsCount: goalDecomposition.goals.length,
        strategiesCount: strategyDefinition.strategies.length,
        evidenceCount: evidence.length,
        gapsCount: gapAnalysis.gaps.length,
        overallConfidence: confidencePropagation.overallConfidence,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(safetyCaseReportTask, {
    goalDecomposition,
    strategyDefinition,
    argumentStructure: argumentStructure.structure,
    evidenceMapping: evidenceMapping.mapping,
    evidenceAssessment: evidenceAssessment.assessment,
    gapAnalysis,
    confidencePropagation,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    safetyCaseStructure: argumentStructure.structure,
    evidenceAssessment: evidenceAssessment.assessment,
    gaps: gapAnalysis.gaps,
    overallConfidence: confidencePropagation.overallConfidence,
    goalConfidences: confidencePropagation.goalConfidences,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/assurance-safety-case-reasoning',
      timestamp: startTime,
      outputDir,
      notationType,
      confidenceThreshold
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Goal Decomposition
export const goalDecompositionTask = defineTask('goal-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose top-level safety goal',
  agent: {
    name: 'goal-decomposition-agent',
    prompt: {
      role: 'safety case architect',
      task: 'Decompose the top-level safety goal into sub-goals',
      context: args,
      instructions: [
        'Parse the top-level safety/security goal',
        'Identify goal types: safety, security, reliability, availability',
        'Decompose into sub-goals using strategies',
        'Ensure sub-goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Link goals to relevant hazards/threats',
        'Create goal hierarchy (tree structure)',
        'Identify leaf goals (directly supported by evidence)',
        'Validate goal completeness',
        'Save goal decomposition to output directory'
      ],
      outputFormat: 'JSON with goals (array), goalHierarchy (object), leafGoals (array), hazardMapping (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'goalHierarchy', 'leafGoals', 'artifacts'],
      properties: {
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              parent: { type: 'string' },
              level: { type: 'number' }
            }
          }
        },
        goalHierarchy: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            children: { type: 'object' }
          }
        },
        leafGoals: { type: 'array', items: { type: 'string' } },
        hazardMapping: {
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
  labels: ['agent', 'scientific-discovery', 'safety-case', 'goals']
}));

// Task 2: Strategy Definition
export const strategyDefinitionTask = defineTask('strategy-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define argumentation strategies',
  agent: {
    name: 'strategy-definition-agent',
    prompt: {
      role: 'safety argumentation specialist',
      task: 'Define strategies linking goals to sub-goals and evidence',
      context: args,
      instructions: [
        'Define strategy for each non-leaf goal',
        'Strategy explains HOW the goal will be achieved',
        'Common patterns: decomposition by hazard, by component, by lifecycle',
        'Link strategies to relevant context',
        'Ensure strategies are complete (cover all aspects)',
        'Ensure strategies are sound (valid reasoning)',
        'Document strategy rationale',
        'Save strategies to output directory'
      ],
      outputFormat: 'JSON with strategies (array), strategyPatterns (object), strategyGoalMapping (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'strategyGoalMapping', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              pattern: { type: 'string' },
              parentGoal: { type: 'string' },
              childGoals: { type: 'array' },
              rationale: { type: 'string' }
            }
          }
        },
        strategyPatterns: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        strategyGoalMapping: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'safety-case', 'strategies']
}));

// Task 3: Argument Structure Construction
export const argumentStructureTask = defineTask('argument-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct argument structure',
  agent: {
    name: 'argument-structure-agent',
    prompt: {
      role: 'GSN/safety case modeler',
      task: 'Construct the safety case argument structure',
      context: args,
      instructions: [
        'Build argument structure using notation type (GSN, CAE, SACM)',
        'GSN elements: Goal, Strategy, Context, Assumption, Justification, Solution',
        'Create links: SupportedBy, InContextOf',
        'Ensure structural well-formedness',
        'Mark undeveloped elements',
        'Create modular structure if large',
        'Validate argument completeness',
        'Save structure to output directory'
      ],
      outputFormat: 'JSON with structure (object), elements (array), links (array), undeveloped (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'elements', 'links', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            notation: { type: 'string' },
            root: { type: 'string' },
            modules: { type: 'array' }
          }
        },
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              developed: { type: 'boolean' }
            }
          }
        },
        links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        undeveloped: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'safety-case', 'structure']
}));

// Task 4: Evidence Mapping
export const evidenceMappingTask = defineTask('evidence-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map evidence to claims',
  agent: {
    name: 'evidence-mapping-agent',
    prompt: {
      role: 'evidence management specialist',
      task: 'Map available evidence to safety case claims',
      context: args,
      instructions: [
        'Parse all available evidence items',
        'Classify evidence type: test results, analysis, review, certification',
        'Map evidence to leaf goals they support',
        'Identify goals with no supporting evidence',
        'Identify evidence not linked to any goal',
        'Track evidence provenance and freshness',
        'Document mapping rationale',
        'Save evidence mapping to output directory'
      ],
      outputFormat: 'JSON with mapping (object), unsupportedGoals (array), unmappedEvidence (array), evidenceTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'unsupportedGoals', 'artifacts'],
      properties: {
        mapping: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                evidenceId: { type: 'string' },
                relevance: { type: 'string' }
              }
            }
          }
        },
        unsupportedGoals: { type: 'array', items: { type: 'string' } },
        unmappedEvidence: { type: 'array', items: { type: 'string' } },
        evidenceTypes: {
          type: 'object',
          properties: {
            testResults: { type: 'number' },
            analysis: { type: 'number' },
            review: { type: 'number' },
            certification: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'safety-case', 'evidence-mapping']
}));

// Task 5: Evidence Quality Assessment
export const evidenceQualityTask = defineTask('evidence-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess evidence quality',
  agent: {
    name: 'evidence-quality-agent',
    prompt: {
      role: 'evidence quality assessor',
      task: 'Assess the quality and strength of evidence',
      context: args,
      instructions: [
        'Assess each evidence item for:',
        '- Relevance to claim',
        '- Trustworthiness of source',
        '- Completeness',
        '- Currency (is it up to date?)',
        'Assign quality score 0-1 for each evidence',
        'Identify weak evidence needing strengthening',
        'Identify strong evidence',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (object), qualityScores (object), weakEvidence (array), strongEvidence (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'qualityScores', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              relevance: { type: 'number' },
              trustworthiness: { type: 'number' },
              completeness: { type: 'number' },
              currency: { type: 'number' },
              overallQuality: { type: 'number' }
            }
          }
        },
        qualityScores: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        weakEvidence: { type: 'array', items: { type: 'string' } },
        strongEvidence: { type: 'array', items: { type: 'string' } },
        averageQuality: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'safety-case', 'evidence-quality']
}));

// Task 6: Gap Analysis
export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze gaps in safety case',
  agent: {
    name: 'gap-analysis-agent',
    prompt: {
      role: 'safety case gap analyst',
      task: 'Identify gaps and weaknesses in the safety case',
      context: args,
      instructions: [
        'Identify unsupported goals (no evidence)',
        'Identify weakly supported goals (poor evidence)',
        'Identify missing strategies',
        'Identify missing context',
        'Identify logical gaps in argument',
        'Assess impact of each gap on overall case',
        'Prioritize gaps by severity',
        'Suggest remediation for each gap',
        'Save gap analysis to output directory'
      ],
      outputFormat: 'JSON with gaps (array), gapsByType (object), prioritizedGaps (array), remediations (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'gapsByType', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        gapsByType: {
          type: 'object',
          properties: {
            evidenceGaps: { type: 'number' },
            strategyGaps: { type: 'number' },
            contextGaps: { type: 'number' },
            logicalGaps: { type: 'number' }
          }
        },
        prioritizedGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        remediations: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'safety-case', 'gaps']
}));

// Task 7: Confidence Propagation
export const confidencePropagationTask = defineTask('confidence-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propagate confidence through argument',
  agent: {
    name: 'confidence-propagation-agent',
    prompt: {
      role: 'confidence assessment specialist',
      task: 'Propagate confidence from evidence up through argument structure',
      context: args,
      instructions: [
        'Assign confidence to leaf goals based on evidence quality',
        'Propagate confidence up through argument tree',
        'For AND-decomposition: take minimum of children',
        'For OR-decomposition: take maximum of children',
        'Weight by strategy strength if applicable',
        'Account for gaps (reduce confidence)',
        'Compute overall confidence in top-level goal',
        'Identify confidence bottlenecks',
        'Save confidence propagation to output directory'
      ],
      outputFormat: 'JSON with goalConfidences (object), overallConfidence (number), bottlenecks (array), propagationTrace (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['goalConfidences', 'overallConfidence', 'artifacts'],
      properties: {
        goalConfidences: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              confidence: { type: 'number' },
              source: { type: 'string' }
            }
          }
        },
        overallConfidence: { type: 'number' },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              confidence: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        propagationTrace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              computation: { type: 'string' },
              result: { type: 'number' }
            }
          }
        },
        confidenceDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'safety-case', 'confidence']
}));

// Task 8: Quality Assessment
export const safetyCaseQualityTask = defineTask('safety-case-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess safety case quality',
  agent: {
    name: 'safety-case-quality-agent',
    prompt: {
      role: 'safety case methodology reviewer',
      task: 'Assess overall quality of the safety case',
      context: args,
      instructions: [
        'Evaluate goal decomposition quality (weight: 20%)',
        'Assess argument structure soundness (weight: 20%)',
        'Check evidence mapping completeness (weight: 20%)',
        'Evaluate evidence quality (weight: 20%)',
        'Assess gap severity (weight: 20%)',
        'Check notation compliance',
        'Verify traceability',
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
            goalDecomposition: { type: 'number' },
            argumentStructure: { type: 'number' },
            evidenceMapping: { type: 'number' },
            evidenceQuality: { type: 'number' },
            gapSeverity: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'safety-case', 'quality']
}));

// Task 9: Report Generation
export const safetyCaseReportTask = defineTask('safety-case-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate safety case report',
  agent: {
    name: 'safety-case-report-agent',
    prompt: {
      role: 'safety case documentation specialist',
      task: 'Generate comprehensive safety case report',
      context: args,
      instructions: [
        'Create executive summary of safety case',
        'Document top-level goal and decomposition',
        'Present argument structure with GSN diagram description',
        'List all strategies and rationales',
        'Present evidence mapping and quality',
        'Document all identified gaps',
        'Show confidence analysis',
        'Include recommendations for improvement',
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
  labels: ['agent', 'scientific-discovery', 'safety-case', 'reporting']
}));
