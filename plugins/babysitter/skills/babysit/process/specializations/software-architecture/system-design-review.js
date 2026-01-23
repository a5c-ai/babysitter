/**
 * @process software-architecture/system-design-review
 * @description Structured system design review process for evaluating software architectures against quality attributes, identifying risks, and ensuring alignment with business goals
 * @inputs { systemName: string, architectureDocumentation: object, qualityAttributes: array, stakeholders: array, reviewType: string }
 * @outputs { success: boolean, reviewScore: number, riskCatalog: object, recommendations: array, actionPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'System',
    architectureDocumentation = {},
    qualityAttributes = ['performance', 'security', 'scalability', 'maintainability'],
    stakeholders = [],
    reviewType = 'comprehensive', // comprehensive | focused | lightweight
    outputDir = 'design-review-output',
    minimumQualityScore = 85,
    scenarioCount = 10
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Design Review for ${systemName}`);

  // ============================================================================
  // PHASE 1: PRE-REVIEW PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing for architecture review');
  const preparationResult = await ctx.task(reviewPreparationTask, {
    systemName,
    architectureDocumentation,
    qualityAttributes,
    stakeholders,
    reviewType,
    outputDir
  });

  artifacts.push(...preparationResult.artifacts);

  // ============================================================================
  // PHASE 2: ARCHITECTURE PRESENTATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing architecture presentation materials');
  const architectureAnalysis = await ctx.task(architecturePresentationAnalysisTask, {
    systemName,
    architectureDocumentation,
    preparationResult,
    outputDir
  });

  artifacts.push(...architectureAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: QUALITY ATTRIBUTE SCENARIO DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining quality attribute scenarios');
  const scenarioDefinition = await ctx.task(qualityAttributeScenarioDefinitionTask, {
    systemName,
    qualityAttributes,
    architectureAnalysis,
    scenarioCount,
    outputDir
  });

  artifacts.push(...scenarioDefinition.artifacts);

  // Breakpoint: Review scenarios before evaluation
  await ctx.breakpoint({
    question: `Quality attribute scenarios defined for ${systemName}. Review ${scenarioDefinition.scenarios.length} scenarios before evaluation?`,
    title: 'Quality Attribute Scenarios Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        systemName,
        scenarioCount: scenarioDefinition.scenarios.length,
        highPriorityScenarios: scenarioDefinition.highPriorityScenarios || 0,
        qualityAttributes: qualityAttributes.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: ARCHITECTURE EVALUATION AGAINST SCENARIOS
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating architecture against quality scenarios');

  // Parallel scenario evaluation for efficiency
  const scenarioEvaluations = await ctx.parallel.all(
    scenarioDefinition.highPriorityScenarioList.slice(0, 5).map((scenario, index) =>
      () => ctx.task(scenarioEvaluationTask, {
        systemName,
        scenario,
        scenarioIndex: index + 1,
        architectureAnalysis,
        architectureDocumentation,
        outputDir
      })
    )
  );

  // Combine evaluation results
  const evaluationResults = {
    evaluations: scenarioEvaluations,
    totalScenarios: scenarioEvaluations.length,
    averageScore: scenarioEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / scenarioEvaluations.length
  };

  scenarioEvaluations.forEach(evaluation => {
    artifacts.push(...(evaluation.artifacts || []));
  });

  // ============================================================================
  // PHASE 5: RISK IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying architectural risks and trade-offs');
  const riskAnalysis = await ctx.task(riskIdentificationTask, {
    systemName,
    architectureAnalysis,
    scenarioDefinition,
    evaluationResults,
    qualityAttributes,
    outputDir
  });

  artifacts.push(...riskAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: GENERATE RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating improvement recommendations');
  const recommendationsResult = await ctx.task(recommendationGenerationTask, {
    systemName,
    architectureAnalysis,
    evaluationResults,
    riskAnalysis,
    qualityAttributes,
    outputDir
  });

  artifacts.push(...recommendationsResult.artifacts);

  // ============================================================================
  // PHASE 7: CREATE ACTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating prioritized action plan');
  const actionPlan = await ctx.task(actionPlanCreationTask, {
    systemName,
    recommendationsResult,
    riskAnalysis,
    stakeholders,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REVIEW REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive review report');
  const reviewReport = await ctx.task(reviewReportGenerationTask, {
    systemName,
    preparationResult,
    architectureAnalysis,
    scenarioDefinition,
    evaluationResults,
    riskAnalysis,
    recommendationsResult,
    actionPlan,
    reviewType,
    outputDir
  });

  artifacts.push(...reviewReport.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Scoring overall review quality and completeness');
  const qualityScore = await ctx.task(reviewQualityScoringTask, {
    systemName,
    architectureAnalysis,
    scenarioDefinition,
    evaluationResults,
    riskAnalysis,
    recommendationsResult,
    actionPlan,
    minimumQualityScore,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const reviewScore = qualityScore.overallScore;
  const qualityMet = reviewScore >= minimumQualityScore;

  // Final breakpoint: Review complete report and approve
  await ctx.breakpoint({
    question: `System design review complete for ${systemName}. Review score: ${reviewScore}/100. ${qualityMet ? 'Review meets quality standards!' : 'Review may need additional work.'} Approve and communicate results?`,
    title: 'Final Review Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        systemName,
        reviewScore,
        qualityMet,
        totalArtifacts: artifacts.length,
        criticalRisks: riskAnalysis.criticalRisks?.length || 0,
        highRisks: riskAnalysis.highRisks?.length || 0,
        totalRecommendations: recommendationsResult.recommendations?.length || 0,
        actionItems: actionPlan.actionItems?.length || 0,
        reviewDuration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    reviewScore,
    qualityMet,
    reviewType,
    preparation: {
      reviewAgenda: preparationResult.reviewAgenda,
      stakeholderCount: preparationResult.stakeholderCount,
      materialCompleteness: preparationResult.materialCompleteness
    },
    architectureAnalysis: {
      businessContext: architectureAnalysis.businessContext,
      keyDecisions: architectureAnalysis.keyDecisions,
      technologyStack: architectureAnalysis.technologyStack,
      architectureScore: architectureAnalysis.architectureScore
    },
    scenarios: {
      totalScenarios: scenarioDefinition.scenarios.length,
      highPriorityScenarios: scenarioDefinition.highPriorityScenarios,
      scenariosByAttribute: scenarioDefinition.scenariosByAttribute
    },
    evaluation: {
      averageScore: evaluationResults.averageScore,
      evaluatedScenarios: evaluationResults.totalScenarios,
      passingScenarios: scenarioEvaluations.filter(e => e.passed).length,
      failingScenarios: scenarioEvaluations.filter(e => !e.passed).length
    },
    riskCatalog: {
      totalRisks: riskAnalysis.totalRisks,
      criticalRisks: riskAnalysis.criticalRisks,
      highRisks: riskAnalysis.highRisks,
      mediumRisks: riskAnalysis.mediumRisks,
      sensitivityPoints: riskAnalysis.sensitivityPoints,
      tradeoffs: riskAnalysis.tradeoffs
    },
    recommendations: {
      totalRecommendations: recommendationsResult.recommendations.length,
      highPriority: recommendationsResult.highPriorityRecommendations,
      mediumPriority: recommendationsResult.mediumPriorityRecommendations,
      lowPriority: recommendationsResult.lowPriorityRecommendations,
      quickWins: recommendationsResult.quickWins
    },
    actionPlan: {
      actionItems: actionPlan.actionItems,
      assignedOwners: actionPlan.assignedOwners,
      estimatedDuration: actionPlan.estimatedDuration,
      nextSteps: actionPlan.nextSteps
    },
    reviewReport: {
      reportPath: reviewReport.reportPath,
      executiveSummary: reviewReport.executiveSummary,
      keyFindings: reviewReport.keyFindings
    },
    artifacts,
    duration,
    metadata: {
      processId: 'software-architecture/system-design-review',
      timestamp: startTime,
      systemName,
      reviewType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Review Preparation
export const reviewPreparationTask = defineTask('review-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for architecture review',
  agent: {
    name: 'review-coordinator',
    prompt: {
      role: 'senior architecture review facilitator and coordinator',
      task: 'Prepare comprehensive architecture review agenda, materials checklist, and stakeholder coordination plan',
      context: args,
      instructions: [
        'Assess completeness of architecture documentation (C4 diagrams, ADRs, technical specs)',
        'Identify missing documentation and request from architects',
        'Analyze quality attributes to evaluate and define evaluation criteria',
        'Create stakeholder list and coordinate availability',
        'Prepare review agenda with time allocations (2-4 hours recommended)',
        'Create review materials package for distribution',
        'Define review objectives and success criteria',
        'Prepare presentation template for architecture team',
        'Set up collaborative tools (virtual whiteboard, document sharing)',
        'Generate pre-review checklist'
      ],
      outputFormat: 'JSON with reviewAgenda, stakeholderCount, materialCompleteness (percentage), missingDocumentation (array), reviewObjectives (array), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewAgenda', 'stakeholderCount', 'materialCompleteness', 'artifacts'],
      properties: {
        reviewAgenda: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        stakeholderCount: { type: 'number' },
        materialCompleteness: { type: 'number', minimum: 0, maximum: 100 },
        missingDocumentation: { type: 'array', items: { type: 'string' } },
        reviewObjectives: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'preparation']
}));

// Task 2: Architecture Presentation Analysis
export const architecturePresentationAnalysisTask = defineTask('architecture-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze architecture presentation',
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'principal software architect and technical reviewer',
      task: 'Comprehensively analyze architecture documentation, identify business drivers, key decisions, technology choices, and architectural patterns',
      context: args,
      instructions: [
        'Extract and document business context and drivers from architecture materials',
        'Identify and catalog key architectural decisions with rationale',
        'Analyze architecture diagrams (Context, Container, Component levels if C4)',
        'Document technology stack and infrastructure choices',
        'Identify architectural patterns used (layered, microservices, event-driven, etc.)',
        'Map system boundaries and external dependencies',
        'Assess architectural style consistency and coherence',
        'Identify potential architectural smells or anti-patterns',
        'Document assumptions and constraints',
        'Generate architecture understanding summary',
        'Score architecture documentation completeness (0-100)'
      ],
      outputFormat: 'JSON with businessContext (object), keyDecisions (array), technologyStack (object), architecturalPatterns (array), systemBoundaries (object), externalDependencies (array), assumptions (array), constraints (array), architectureScore (0-100), potentialIssues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['businessContext', 'keyDecisions', 'technologyStack', 'architectureScore', 'artifacts'],
      properties: {
        businessContext: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            businessDrivers: { type: 'array', items: { type: 'string' } },
            keyStakeholders: { type: 'array', items: { type: 'string' } },
            businessConstraints: { type: 'array', items: { type: 'string' } }
          }
        },
        keyDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              tradeoffs: { type: 'string' }
            }
          }
        },
        technologyStack: {
          type: 'object',
          properties: {
            languages: { type: 'array', items: { type: 'string' } },
            frameworks: { type: 'array', items: { type: 'string' } },
            databases: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } },
            externalServices: { type: 'array', items: { type: 'string' } }
          }
        },
        architecturalPatterns: { type: 'array', items: { type: 'string' } },
        systemBoundaries: { type: 'object' },
        externalDependencies: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        architectureScore: { type: 'number', minimum: 0, maximum: 100 },
        potentialIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'architecture-analysis']
}));

// Task 3: Quality Attribute Scenario Definition
export const qualityAttributeScenarioDefinitionTask = defineTask('scenario-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality attribute scenarios',
  agent: {
    name: 'scenario-designer',
    prompt: {
      role: 'quality attribute specialist and scenario architect',
      task: 'Create comprehensive, testable quality attribute scenarios following the Stimulus-Response-Measure pattern',
      context: args,
      instructions: [
        'For each quality attribute, generate multiple concrete scenarios',
        'Use Stimulus-Response-Measure pattern: [Stimulus] -> [Response] -> [Measure]',
        'Example: "Under peak load (10K concurrent users) [stimulus], system responds [response] with <200ms latency for 95% of requests [measure]"',
        'Cover all quality attributes: performance, security, scalability, availability, maintainability, usability, testability',
        'Create scenarios for different operational contexts (normal, peak, stress, failure)',
        'Ensure scenarios are specific, measurable, achievable, relevant, and time-bound',
        'Prioritize scenarios using MoSCoW method (Must have, Should have, Could have, Won\'t have)',
        'Identify critical scenarios requiring immediate attention',
        'Group scenarios by quality attribute category',
        'Document scenario rationale and business impact',
        'Generate scenario catalog with priority rankings'
      ],
      outputFormat: 'JSON with scenarios (array), highPriorityScenarios (number), scenariosByAttribute (object), highPriorityScenarioList (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'highPriorityScenarios', 'scenariosByAttribute', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              attribute: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              stimulus: { type: 'string' },
              response: { type: 'string' },
              measure: { type: 'string' },
              rationale: { type: 'string' },
              businessImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        highPriorityScenarios: { type: 'number' },
        scenariosByAttribute: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        highPriorityScenarioList: {
          type: 'array',
          items: { type: 'object' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'quality-scenarios']
}));

// Task 4: Scenario Evaluation
export const scenarioEvaluationTask = defineTask('scenario-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate scenario ${args.scenarioIndex}`,
  agent: {
    name: 'scenario-evaluator',
    prompt: {
      role: 'architecture evaluator and quality assurance specialist',
      task: 'Evaluate how well the architecture supports the given quality attribute scenario',
      context: args,
      instructions: [
        'Analyze how the current architecture addresses the scenario stimulus',
        'Identify architectural approaches and patterns that support the scenario',
        'Assess whether the architecture can meet the measured response criteria',
        'Document architectural mechanisms enabling the quality attribute',
        'Identify gaps where architecture does not adequately support the scenario',
        'Find sensitivity points: architectural decisions critical to this scenario',
        'Identify trade-offs: decisions that help this scenario but hurt others',
        'Document risks and uncertainties in meeting the scenario',
        'Score scenario support: 0 (not supported) to 100 (fully supported)',
        'Provide specific evidence from architecture to justify the score',
        'Recommend improvements if score is below 80'
      ],
      outputFormat: 'JSON with score (0-100), passed (boolean), architecturalApproaches (array), sensitivityPoints (array), tradeoffs (array), risks (array), gaps (array), evidence (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed', 'architecturalApproaches', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        architecturalApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              description: { type: 'string' },
              effectiveness: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        sensitivityPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              positive: { type: 'string' },
              negative: { type: 'string' }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        evidence: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'scenario-evaluation', `scenario-${args.scenarioIndex}`]
}));

// Task 5: Risk Identification
export const riskIdentificationTask = defineTask('risk-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and analyze architectural risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'architecture risk assessment specialist',
      task: 'Identify, categorize, and prioritize architectural risks, sensitivity points, and trade-offs',
      context: args,
      instructions: [
        'Aggregate all risks identified during scenario evaluations',
        'Identify additional architectural risks not covered by scenarios',
        'Categorize risks: technical, operational, security, performance, scalability',
        'Assess risk likelihood (low/medium/high) and impact (low/medium/high/critical)',
        'Prioritize using risk matrix (likelihood × impact)',
        'Identify critical risks (high likelihood + critical impact)',
        'Document sensitivity points: architectural decisions critical to quality attributes',
        'Document trade-offs: decisions affecting multiple quality attributes',
        'Identify non-risks: decisions with low risk that should not be questioned',
        'Create risk heat map visualization',
        'Generate comprehensive risk catalog with mitigation strategies',
        'Recommend risk monitoring and mitigation approaches'
      ],
      outputFormat: 'JSON with totalRisks, criticalRisks (array), highRisks (array), mediumRisks (array), lowRisks (array), sensitivityPoints (array), tradeoffs (array), nonRisks (array), riskMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRisks', 'criticalRisks', 'highRisks', 'sensitivityPoints', 'tradeoffs', 'artifacts'],
      properties: {
        totalRisks: { type: 'number' },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              description: { type: 'string' },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        highRisks: { type: 'array' },
        mediumRisks: { type: 'array' },
        lowRisks: { type: 'array' },
        sensitivityPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              qualityAttribute: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              positiveImpact: { type: 'array', items: { type: 'string' } },
              negativeImpact: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        },
        nonRisks: { type: 'array', items: { type: 'string' } },
        riskMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'risk-analysis']
}));

// Task 6: Recommendation Generation
export const recommendationGenerationTask = defineTask('recommendation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate improvement recommendations',
  agent: {
    name: 'architecture-advisor',
    prompt: {
      role: 'senior architecture consultant and improvement strategist',
      task: 'Generate prioritized, actionable recommendations for architectural improvements',
      context: args,
      instructions: [
        'Analyze gaps identified in scenario evaluations',
        'Review all identified risks and their mitigation needs',
        'Generate specific, actionable recommendations for each gap/risk',
        'Prioritize recommendations by impact and effort (high/medium/low)',
        'Identify "quick wins": high-impact, low-effort improvements',
        'Identify strategic improvements requiring significant effort',
        'For each recommendation, provide: description, rationale, effort estimate, impact, dependencies',
        'Group recommendations by category (architecture, technology, process, team)',
        'Consider feasibility and organizational constraints',
        'Sequence recommendations based on dependencies',
        'Document expected benefits and success criteria for each',
        'Generate comprehensive recommendations report'
      ],
      outputFormat: 'JSON with recommendations (array), highPriorityRecommendations (number), mediumPriorityRecommendations (number), lowPriorityRecommendations (number), quickWins (array), strategicImprovements (array), recommendationsByCategory (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'highPriorityRecommendations', 'quickWins', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              dependencies: { type: 'array', items: { type: 'string' } },
              expectedBenefits: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highPriorityRecommendations: { type: 'number' },
        mediumPriorityRecommendations: { type: 'number' },
        lowPriorityRecommendations: { type: 'number' },
        quickWins: {
          type: 'array',
          items: { type: 'object' }
        },
        strategicImprovements: {
          type: 'array',
          items: { type: 'object' }
        },
        recommendationsByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'recommendations']
}));

// Task 7: Action Plan Creation
export const actionPlanCreationTask = defineTask('action-plan-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create prioritized action plan',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'project manager and execution strategist',
      task: 'Create detailed, prioritized action plan with owners, timelines, and success metrics',
      context: args,
      instructions: [
        'Convert recommendations into actionable tasks with clear ownership',
        'Assign priority to each action item (critical/high/medium/low)',
        'Estimate effort and duration for each action',
        'Identify task dependencies and sequence appropriately',
        'Assign owners from stakeholder list (or recommend if not available)',
        'Define success criteria and completion metrics for each action',
        'Create timeline with milestones',
        'Identify resources needed (people, budget, tools)',
        'Group actions into phases or sprints if applicable',
        'Define "Next Steps" for immediate execution',
        'Create tracking mechanism for action plan',
        'Generate Gantt chart or roadmap visualization',
        'Document escalation path for blocked items'
      ],
      outputFormat: 'JSON with actionItems (array), assignedOwners (array), estimatedDuration (string), phases (array), nextSteps (array), timeline (object), trackingMechanism (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'assignedOwners', 'nextSteps', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' },
              estimatedEffort: { type: 'string' },
              dueDate: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' },
              status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'blocked'] }
            }
          }
        },
        assignedOwners: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              actionItemIds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        trackingMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'action-planning']
}));

// Task 8: Review Report Generation
export const reviewReportGenerationTask = defineTask('review-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive review report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'senior technical writer and architecture communicator',
      task: 'Generate comprehensive, executive-ready system design review report',
      context: args,
      instructions: [
        'Create executive summary highlighting key findings and critical decisions',
        'Document review process and methodology used',
        'Present architecture overview with diagrams',
        'Document all evaluated quality attribute scenarios with results',
        'Present risk catalog with criticality and mitigation strategies',
        'Detail all recommendations with priority and rationale',
        'Include action plan with owners and timelines',
        'Provide quantitative assessment (scores, metrics, statistics)',
        'Add appendices: scenario details, risk matrix, stakeholder feedback',
        'Format as professional Markdown with clear sections and diagrams',
        'Ensure report is actionable and ready for stakeholder presentation',
        'Include glossary for technical terms',
        'Add references to ADRs and architecture documentation',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings (array), criticalDecisions (array), nextReviewDate (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalDecisions: { type: 'array', items: { type: 'string' } },
        nextReviewDate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'documentation']
}));

// Task 9: Review Quality Scoring
export const reviewQualityScoringTask = defineTask('review-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score review quality and completeness',
  agent: {
    name: 'review-validator',
    prompt: {
      role: 'architecture review auditor and quality assessor',
      task: 'Assess overall design review quality, completeness, and effectiveness',
      context: args,
      instructions: [
        'Evaluate architecture analysis thoroughness (weight: 15%)',
        'Assess scenario coverage and quality (weight: 20%)',
        'Review evaluation rigor and evidence quality (weight: 20%)',
        'Assess risk identification completeness (weight: 20%)',
        'Evaluate recommendation quality and actionability (weight: 15%)',
        'Review action plan feasibility and clarity (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps in the review process',
        'Provide specific recommendations for improving the review',
        'Assess stakeholder satisfaction readiness',
        'Validate alignment with industry best practices (ATAM, SEI)',
        'Check if all quality attributes were adequately addressed'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), completeness (object), gaps (array), improvements (array), stakeholderReadiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completeness', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            architectureAnalysis: { type: 'number' },
            scenarioCoverage: { type: 'number' },
            evaluationRigor: { type: 'number' },
            riskIdentification: { type: 'number' },
            recommendationQuality: { type: 'number' },
            actionPlanClarity: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allQualityAttributesCovered: { type: 'boolean' },
            scenariosWellDefined: { type: 'boolean' },
            risksAdequatelyIdentified: { type: 'boolean' },
            recommendationsActionable: { type: 'boolean' },
            actionPlanComplete: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        stakeholderReadiness: { type: 'string', enum: ['ready', 'minor-updates', 'major-updates'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-review', 'validation', 'quality-scoring']
}));
