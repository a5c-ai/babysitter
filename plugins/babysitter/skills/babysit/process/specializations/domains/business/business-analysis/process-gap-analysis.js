/**
 * @process business-analysis/process-gap-analysis
 * @description Conduct systematic analysis comparing current-state processes to desired future-state or industry benchmarks. Identify gaps, root causes, and prioritize improvement opportunities.
 * @inputs { projectName: string, currentState: object, futureState: object, benchmarks: array, stakeholders: array }
 * @outputs { success: boolean, gapAnalysisMatrix: object, rootCauseAnalysis: object, prioritizedImprovements: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    currentState = {},
    futureState = {},
    benchmarks = [],
    stakeholders = [],
    outputDir = 'gap-analysis-output',
    analysisFramework = 'babok'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Process Gap Analysis for ${projectName}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current state');
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    projectName,
    currentState,
    stakeholders,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  // ============================================================================
  // PHASE 2: FUTURE STATE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining desired future state');
  const futureStateDefinition = await ctx.task(futureStateDefinitionTask, {
    projectName,
    futureState,
    benchmarks,
    currentStateAssessment,
    outputDir
  });

  artifacts.push(...futureStateDefinition.artifacts);

  // ============================================================================
  // PHASE 3: GAP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying gaps between states');
  const gapIdentification = await ctx.task(gapIdentificationTask, {
    projectName,
    currentStateAssessment,
    futureStateDefinition,
    outputDir
  });

  artifacts.push(...gapIdentification.artifacts);

  // ============================================================================
  // PHASE 4: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing root causes of gaps');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    projectName,
    gaps: gapIdentification.gaps,
    currentStateAssessment,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing gap impact');
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    projectName,
    gaps: gapIdentification.gaps,
    rootCauseAnalysis,
    stakeholders,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // ============================================================================
  // PHASE 6: GAP PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing gaps for closure');
  const gapPrioritization = await ctx.task(gapPrioritizationTask, {
    projectName,
    gaps: gapIdentification.gaps,
    impactAssessment,
    rootCauseAnalysis,
    outputDir
  });

  artifacts.push(...gapPrioritization.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT BACKLOG CREATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating prioritized improvement backlog');
  const improvementBacklog = await ctx.task(improvementBacklogTask, {
    projectName,
    prioritizedGaps: gapPrioritization.prioritizedGaps,
    rootCauseAnalysis,
    futureStateDefinition,
    outputDir
  });

  artifacts.push(...improvementBacklog.artifacts);

  // Breakpoint: Review gap analysis
  await ctx.breakpoint({
    question: `Gap analysis complete for ${projectName}. ${gapIdentification.gaps?.length || 0} gaps identified. Review and approve improvement backlog?`,
    title: 'Gap Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        totalGaps: gapIdentification.gaps?.length || 0,
        criticalGaps: impactAssessment.criticalGaps?.length || 0,
        improvementItems: improvementBacklog.backlogItems?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 8: GAP ANALYSIS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating gap analysis report');
  const gapAnalysisReport = await ctx.task(gapAnalysisReportTask, {
    projectName,
    currentStateAssessment,
    futureStateDefinition,
    gapIdentification,
    rootCauseAnalysis,
    impactAssessment,
    gapPrioritization,
    improvementBacklog,
    outputDir
  });

  artifacts.push(...gapAnalysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    gapAnalysisMatrix: {
      totalGaps: gapIdentification.gaps?.length || 0,
      gaps: gapIdentification.gaps,
      gapsByCategory: gapIdentification.gapsByCategory
    },
    rootCauseAnalysis: {
      rootCauses: rootCauseAnalysis.rootCauses,
      fishboneDiagrams: rootCauseAnalysis.fishboneDiagrams
    },
    impactAssessment: {
      criticalGaps: impactAssessment.criticalGaps,
      impactMatrix: impactAssessment.impactMatrix
    },
    prioritizedImprovements: {
      backlogItems: improvementBacklog.backlogItems,
      quickWins: improvementBacklog.quickWins,
      strategicInitiatives: improvementBacklog.strategicInitiatives
    },
    reportPath: gapAnalysisReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/process-gap-analysis',
      timestamp: startTime,
      analysisFramework,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current state',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with process assessment expertise',
      task: 'Assess and document current state processes and capabilities',
      context: args,
      instructions: [
        'Document current processes and workflows',
        'Assess current capability maturity levels',
        'Identify current pain points and issues',
        'Document current metrics and KPIs',
        'Assess technology and tool landscape',
        'Document organizational structure and roles',
        'Identify current strengths to preserve',
        'Document compliance and regulatory status',
        'Assess resource utilization',
        'Create current state summary'
      ],
      outputFormat: 'JSON with currentProcesses, capabilities, painPoints, metrics, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentProcesses', 'capabilities', 'artifacts'],
      properties: {
        currentProcesses: { type: 'array', items: { type: 'object' } },
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              maturityLevel: { type: 'number', minimum: 1, maximum: 5 },
              description: { type: 'string' }
            }
          }
        },
        painPoints: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'object' },
        technology: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'current-state']
}));

export const futureStateDefinitionTask = defineTask('future-state-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define future state',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'strategic business analyst with transformation expertise',
      task: 'Define desired future state based on goals and benchmarks',
      context: args,
      instructions: [
        'Define target processes and workflows',
        'Set target capability maturity levels',
        'Define target metrics and KPIs',
        'Incorporate industry benchmark standards',
        'Define technology target state',
        'Specify organizational changes needed',
        'Define compliance and regulatory targets',
        'Set timeline expectations',
        'Document success criteria',
        'Create future state vision document'
      ],
      outputFormat: 'JSON with targetProcesses, targetCapabilities, targetMetrics, benchmarkComparison, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetProcesses', 'targetCapabilities', 'artifacts'],
      properties: {
        targetProcesses: { type: 'array', items: { type: 'object' } },
        targetCapabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              targetMaturity: { type: 'number', minimum: 1, maximum: 5 },
              rationale: { type: 'string' }
            }
          }
        },
        targetMetrics: { type: 'object' },
        benchmarkComparison: { type: 'array', items: { type: 'object' } },
        technologyTargets: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'future-state']
}));

export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify gaps',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'analytical business analyst with gap analysis expertise',
      task: 'Systematically identify gaps between current and future states',
      context: args,
      instructions: [
        'Compare current vs future state element by element',
        'Identify process gaps (missing or inadequate processes)',
        'Identify capability gaps (maturity level differences)',
        'Identify technology gaps',
        'Identify skill and knowledge gaps',
        'Identify resource gaps',
        'Identify compliance gaps',
        'Categorize gaps by type and area',
        'Document gap descriptions clearly',
        'Create gap inventory matrix'
      ],
      outputFormat: 'JSON with gaps, gapsByCategory, gapMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'gapsByCategory', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              area: { type: 'string' },
              currentState: { type: 'string' },
              futureState: { type: 'string' },
              gapDescription: { type: 'string' },
              gapSize: { type: 'string', enum: ['large', 'medium', 'small'] }
            }
          }
        },
        gapsByCategory: {
          type: 'object',
          properties: {
            process: { type: 'number' },
            capability: { type: 'number' },
            technology: { type: 'number' },
            skill: { type: 'number' },
            resource: { type: 'number' },
            compliance: { type: 'number' }
          }
        },
        gapMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'identification']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'root cause analysis specialist with Six Sigma expertise',
      task: 'Analyze root causes of identified gaps using structured techniques',
      context: args,
      instructions: [
        'Apply 5 Whys technique for each major gap',
        'Create Fishbone (Ishikawa) diagrams for critical gaps',
        'Categorize causes (People, Process, Technology, Policy)',
        'Identify systemic vs isolated causes',
        'Identify contributing factors',
        'Determine cause-effect relationships',
        'Identify root causes vs symptoms',
        'Document evidence for root causes',
        'Prioritize root causes by frequency',
        'Create root cause summary'
      ],
      outputFormat: 'JSON with rootCauses, fishboneDiagrams, fiveWhysAnalysis, causeCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'artifacts'],
      properties: {
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              rootCause: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'string' },
              frequency: { type: 'string', enum: ['systemic', 'frequent', 'occasional', 'isolated'] }
            }
          }
        },
        fishboneDiagrams: { type: 'array', items: { type: 'object' } },
        fiveWhysAnalysis: { type: 'array', items: { type: 'object' } },
        causeCategories: {
          type: 'object',
          properties: {
            people: { type: 'array', items: { type: 'string' } },
            process: { type: 'array', items: { type: 'string' } },
            technology: { type: 'array', items: { type: 'string' } },
            policy: { type: 'array', items: { type: 'string' } }
          }
        },
        systemicCauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'root-cause']
}));

export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess gap impact',
  agent: {
    name: 'impact-analyst',
    prompt: {
      role: 'business impact analyst',
      task: 'Assess business impact of identified gaps',
      context: args,
      instructions: [
        'Assess impact on business operations',
        'Assess financial impact of gaps',
        'Assess customer impact',
        'Assess compliance and risk impact',
        'Assess employee/organizational impact',
        'Rate impact severity (critical, high, medium, low)',
        'Identify interdependencies between gaps',
        'Calculate cost of inaction',
        'Identify critical gaps requiring immediate attention',
        'Create impact assessment matrix'
      ],
      outputFormat: 'JSON with impactMatrix, criticalGaps, financialImpact, riskImpact, costOfInaction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impactMatrix', 'criticalGaps', 'artifacts'],
      properties: {
        impactMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              operationalImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              financialImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              customerImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              riskImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              overallImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        criticalGaps: { type: 'array', items: { type: 'string' } },
        financialImpact: { type: 'object' },
        riskImpact: { type: 'object' },
        costOfInaction: { type: 'string' },
        interdependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'impact']
}));

export const gapPrioritizationTask = defineTask('gap-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize gaps',
  agent: {
    name: 'prioritization-specialist',
    prompt: {
      role: 'strategic prioritization specialist',
      task: 'Prioritize gaps for closure based on impact and effort',
      context: args,
      instructions: [
        'Apply impact vs effort matrix',
        'Consider strategic alignment',
        'Account for dependencies between gaps',
        'Consider resource constraints',
        'Identify quick wins (high impact, low effort)',
        'Identify strategic initiatives (high impact, high effort)',
        'Identify fill-ins (low impact, low effort)',
        'Identify potential thankless tasks (low impact, high effort)',
        'Create prioritized gap list',
        'Document prioritization rationale'
      ],
      outputFormat: 'JSON with prioritizedGaps, quadrantAnalysis, quickWins, strategicInitiatives, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedGaps', 'artifacts'],
      properties: {
        prioritizedGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              priority: { type: 'number' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              quadrant: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        quadrantAnalysis: {
          type: 'object',
          properties: {
            quickWins: { type: 'array', items: { type: 'string' } },
            strategicInitiatives: { type: 'array', items: { type: 'string' } },
            fillIns: { type: 'array', items: { type: 'string' } },
            thanklessTasks: { type: 'array', items: { type: 'string' } }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        strategicInitiatives: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'prioritization']
}));

export const improvementBacklogTask = defineTask('improvement-backlog', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create improvement backlog',
  agent: {
    name: 'improvement-planner',
    prompt: {
      role: 'continuous improvement specialist',
      task: 'Create prioritized improvement backlog with actionable items',
      context: args,
      instructions: [
        'Convert prioritized gaps to improvement initiatives',
        'Define improvement objectives for each item',
        'Specify expected outcomes and benefits',
        'Estimate effort and resources',
        'Define dependencies',
        'Assign preliminary ownership',
        'Group into phases or releases',
        'Define success metrics for each item',
        'Create implementation timeline',
        'Document backlog in standard format'
      ],
      outputFormat: 'JSON with backlogItems, quickWins, strategicInitiatives, phases, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['backlogItems', 'artifacts'],
      properties: {
        backlogItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              gapId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              expectedBenefits: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              priority: { type: 'number' },
              phase: { type: 'string' },
              owner: { type: 'string' },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        strategicInitiatives: { type: 'array', items: { type: 'string' } },
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        totalEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'improvement']
}));

export const gapAnalysisReportTask = defineTask('gap-analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate gap analysis report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'business analysis report writer',
      task: 'Generate comprehensive gap analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document methodology and approach',
        'Present current state assessment',
        'Present future state definition',
        'Document gap analysis findings',
        'Present root cause analysis results',
        'Include impact assessment',
        'Present prioritized improvement backlog',
        'Include implementation recommendations',
        'Add appendices with detailed analysis'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, sections, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'gap-analysis', 'reporting']
}));
