/**
 * @process business-strategy/swot-strategic-assessment
 * @description Internal and external strategic assessment using SWOT framework with TOWS matrix for strategy development
 * @inputs { organizationName: string, internalData: object, externalData: object, competitorData: array }
 * @outputs { success: boolean, swotMatrix: object, towsStrategies: object, strategicOptions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    internalData = {},
    externalData = {},
    competitorData = [],
    outputDir = 'swot-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SWOT Strategic Assessment for ${organizationName}`);

  // ============================================================================
  // PHASE 1: STRENGTHS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing internal strengths');
  const strengthsAnalysis = await ctx.task(strengthsAnalysisTask, {
    organizationName,
    internalData,
    competitorData,
    outputDir
  });

  artifacts.push(...strengthsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: WEAKNESSES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing internal weaknesses');
  const weaknessesAnalysis = await ctx.task(weaknessesAnalysisTask, {
    organizationName,
    internalData,
    competitorData,
    outputDir
  });

  artifacts.push(...weaknessesAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: OPPORTUNITIES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing external opportunities');
  const opportunitiesAnalysis = await ctx.task(opportunitiesAnalysisTask, {
    organizationName,
    externalData,
    internalData,
    outputDir
  });

  artifacts.push(...opportunitiesAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: THREATS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing external threats');
  const threatsAnalysis = await ctx.task(threatsAnalysisTask, {
    organizationName,
    externalData,
    competitorData,
    outputDir
  });

  artifacts.push(...threatsAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: TOWS MATRIX DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing TOWS strategy matrix');
  const towsMatrix = await ctx.task(towsMatrixTask, {
    organizationName,
    strengthsAnalysis,
    weaknessesAnalysis,
    opportunitiesAnalysis,
    threatsAnalysis,
    outputDir
  });

  artifacts.push(...towsMatrix.artifacts);

  // ============================================================================
  // PHASE 6: STRATEGIC OPTIONS PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing strategic options');
  const strategicPrioritization = await ctx.task(strategicPrioritizationTask, {
    organizationName,
    towsMatrix,
    internalData,
    outputDir
  });

  artifacts.push(...strategicPrioritization.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    organizationName,
    strategicPrioritization,
    towsMatrix,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive SWOT report');
  const swotReport = await ctx.task(swotReportTask, {
    organizationName,
    strengthsAnalysis,
    weaknessesAnalysis,
    opportunitiesAnalysis,
    threatsAnalysis,
    towsMatrix,
    strategicPrioritization,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...swotReport.artifacts);

  // Breakpoint: Review SWOT analysis
  await ctx.breakpoint({
    question: `SWOT analysis complete for ${organizationName}. ${strategicPrioritization.prioritizedOptions?.length || 0} strategic options identified. Review and approve?`,
    title: 'SWOT Strategic Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        swotCounts: {
          strengths: strengthsAnalysis.strengths?.length || 0,
          weaknesses: weaknessesAnalysis.weaknesses?.length || 0,
          opportunities: opportunitiesAnalysis.opportunities?.length || 0,
          threats: threatsAnalysis.threats?.length || 0
        },
        towsStrategies: {
          so: towsMatrix.soStrategies?.length || 0,
          wo: towsMatrix.woStrategies?.length || 0,
          st: towsMatrix.stStrategies?.length || 0,
          wt: towsMatrix.wtStrategies?.length || 0
        },
        topStrategicOptions: strategicPrioritization.topOptions?.slice(0, 3)
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    swotMatrix: {
      strengths: strengthsAnalysis.strengths,
      weaknesses: weaknessesAnalysis.weaknesses,
      opportunities: opportunitiesAnalysis.opportunities,
      threats: threatsAnalysis.threats
    },
    towsStrategies: {
      soStrategies: towsMatrix.soStrategies,
      woStrategies: towsMatrix.woStrategies,
      stStrategies: towsMatrix.stStrategies,
      wtStrategies: towsMatrix.wtStrategies
    },
    strategicOptions: strategicPrioritization.prioritizedOptions,
    implementationRoadmap: implementationRoadmap.roadmap,
    reportPath: swotReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/swot-strategic-assessment',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Strengths Analysis
export const strengthsAnalysisTask = defineTask('strengths-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze internal strengths',
  agent: {
    name: 'internal-analyst',
    prompt: {
      role: 'organizational analyst and capabilities specialist',
      task: 'Identify and analyze internal strengths and competitive advantages',
      context: args,
      instructions: [
        'Identify core competencies and distinctive capabilities',
        'Assess resource advantages (financial, human, technological)',
        'Evaluate brand equity and market position',
        'Analyze operational efficiencies and cost advantages',
        'Assess innovation capabilities and R&D strength',
        'Evaluate customer relationships and loyalty',
        'Identify organizational culture strengths',
        'Rate each strength by significance and sustainability (1-5)',
        'Compare strengths to key competitors',
        'Generate strengths assessment report'
      ],
      outputFormat: 'JSON with strengths (array with description, significance, sustainability, competitive relevance), coreCompetencies, resourceAdvantages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strengths', 'artifacts'],
      properties: {
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              significance: { type: 'number', minimum: 1, maximum: 5 },
              sustainability: { type: 'number', minimum: 1, maximum: 5 },
              competitiveRelevance: { type: 'string' }
            }
          }
        },
        coreCompetencies: { type: 'array', items: { type: 'string' } },
        resourceAdvantages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'strengths']
}));

// Task 2: Weaknesses Analysis
export const weaknessesAnalysisTask = defineTask('weaknesses-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze internal weaknesses',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'organizational analyst and gap assessment specialist',
      task: 'Identify and analyze internal weaknesses and vulnerabilities',
      context: args,
      instructions: [
        'Identify resource gaps and capability deficiencies',
        'Assess competitive disadvantages relative to rivals',
        'Evaluate operational inefficiencies and cost issues',
        'Analyze organizational structure and process weaknesses',
        'Identify technology gaps and technical debt',
        'Assess talent and skill shortages',
        'Evaluate financial constraints and limitations',
        'Rate each weakness by severity and remediability (1-5)',
        'Identify root causes of key weaknesses',
        'Generate weaknesses assessment report'
      ],
      outputFormat: 'JSON with weaknesses (array with description, severity, remediability, rootCause), capabilityGaps, competitiveDisadvantages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['weaknesses', 'artifacts'],
      properties: {
        weaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              severity: { type: 'number', minimum: 1, maximum: 5 },
              remediability: { type: 'number', minimum: 1, maximum: 5 },
              rootCause: { type: 'string' }
            }
          }
        },
        capabilityGaps: { type: 'array', items: { type: 'string' } },
        competitiveDisadvantages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'weaknesses']
}));

// Task 3: Opportunities Analysis
export const opportunitiesAnalysisTask = defineTask('opportunities-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze external opportunities',
  agent: {
    name: 'opportunity-analyst',
    prompt: {
      role: 'market analyst and opportunity assessment specialist',
      task: 'Identify and analyze external opportunities for growth and advantage',
      context: args,
      instructions: [
        'Identify market growth and expansion opportunities',
        'Analyze emerging customer needs and trends',
        'Evaluate new market segment opportunities',
        'Assess technology and innovation opportunities',
        'Identify partnership and alliance possibilities',
        'Analyze regulatory changes creating opportunities',
        'Evaluate competitor weaknesses to exploit',
        'Assess M&A and investment opportunities',
        'Rate each opportunity by attractiveness and fit (1-5)',
        'Generate opportunities assessment report'
      ],
      outputFormat: 'JSON with opportunities (array with description, attractiveness, strategicFit, timeframe), marketOpportunities, innovationOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              attractiveness: { type: 'number', minimum: 1, maximum: 5 },
              strategicFit: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' }
            }
          }
        },
        marketOpportunities: { type: 'array', items: { type: 'string' } },
        innovationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'opportunities']
}));

// Task 4: Threats Analysis
export const threatsAnalysisTask = defineTask('threats-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze external threats',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'competitive intelligence analyst and risk specialist',
      task: 'Identify and analyze external threats and competitive risks',
      context: args,
      instructions: [
        'Identify competitive threats from existing rivals',
        'Analyze new entrant and disruption threats',
        'Evaluate substitute product/service threats',
        'Assess market and economic risks',
        'Identify regulatory and compliance threats',
        'Analyze technology obsolescence risks',
        'Evaluate supply chain and operational threats',
        'Assess reputational and brand risks',
        'Rate each threat by likelihood and impact (1-5)',
        'Generate threats assessment report'
      ],
      outputFormat: 'JSON with threats (array with description, likelihood, impact, urgency), competitiveThreats, marketRisks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'artifacts'],
      properties: {
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              urgency: { type: 'string' }
            }
          }
        },
        competitiveThreats: { type: 'array', items: { type: 'string' } },
        marketRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'threats']
}));

// Task 5: TOWS Matrix Development
export const towsMatrixTask = defineTask('tows-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop TOWS strategy matrix',
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Develop TOWS strategy matrix combining SWOT elements',
      context: args,
      instructions: [
        'Develop SO strategies: Use strengths to capitalize on opportunities',
        'Develop WO strategies: Overcome weaknesses by exploiting opportunities',
        'Develop ST strategies: Use strengths to mitigate threats',
        'Develop WT strategies: Minimize weaknesses and avoid threats',
        'Ensure strategies are specific, actionable, and measurable',
        'Link each strategy to specific SWOT elements',
        'Identify synergies between strategies',
        'Assess resource requirements for each strategy',
        'Create TOWS matrix visualization',
        'Generate TOWS strategy matrix report'
      ],
      outputFormat: 'JSON with soStrategies, woStrategies, stStrategies, wtStrategies, strategySynergies, resourceRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['soStrategies', 'woStrategies', 'stStrategies', 'wtStrategies', 'artifacts'],
      properties: {
        soStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              resources: { type: 'string' }
            }
          }
        },
        woStrategies: { type: 'array', items: { type: 'object' } },
        stStrategies: { type: 'array', items: { type: 'object' } },
        wtStrategies: { type: 'array', items: { type: 'object' } },
        strategySynergies: { type: 'array', items: { type: 'string' } },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'tows-matrix']
}));

// Task 6: Strategic Options Prioritization
export const strategicPrioritizationTask = defineTask('strategic-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize strategic options',
  agent: {
    name: 'strategy-evaluator',
    prompt: {
      role: 'strategy evaluation specialist',
      task: 'Prioritize TOWS strategic options by feasibility and impact',
      context: args,
      instructions: [
        'Consolidate all TOWS strategies into unified list',
        'Evaluate each strategy on strategic impact (1-10)',
        'Evaluate each strategy on implementation feasibility (1-10)',
        'Assess resource requirements and constraints',
        'Calculate priority scores (impact x feasibility)',
        'Rank strategies by priority score',
        'Identify quick wins (high feasibility, moderate impact)',
        'Identify major initiatives (high impact, may need more resources)',
        'Create strategy prioritization matrix',
        'Generate strategic options prioritization report'
      ],
      outputFormat: 'JSON with prioritizedOptions, topOptions, quickWins, majorInitiatives, prioritizationMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedOptions', 'topOptions', 'artifacts'],
      properties: {
        prioritizedOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              type: { type: 'string', enum: ['SO', 'WO', 'ST', 'WT'] },
              impactScore: { type: 'number' },
              feasibilityScore: { type: 'number' },
              priorityScore: { type: 'number' },
              resourceRequirements: { type: 'string' }
            }
          }
        },
        topOptions: { type: 'array', items: { type: 'string' } },
        quickWins: { type: 'array', items: { type: 'string' } },
        majorInitiatives: { type: 'array', items: { type: 'string' } },
        prioritizationMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'prioritization']
}));

// Task 7: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'strategy implementation specialist',
      task: 'Create actionable implementation roadmap for priority strategies',
      context: args,
      instructions: [
        'Sequence strategies based on dependencies and quick wins',
        'Define implementation phases (short, medium, long-term)',
        'Identify key milestones and deliverables',
        'Allocate resources and responsibilities',
        'Define success metrics for each initiative',
        'Identify risks and mitigation measures',
        'Create timeline with key dates',
        'Define governance and review mechanisms',
        'Estimate budget requirements',
        'Generate implementation roadmap document'
      ],
      outputFormat: 'JSON with roadmap, phases, milestones, resourceAllocation, risks, timeline, budget, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phases', 'artifacts'],
      properties: {
        roadmap: { type: 'array', items: { type: 'object' } },
        phases: {
          type: 'object',
          properties: {
            shortTerm: { type: 'array', items: { type: 'string' } },
            mediumTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        resourceAllocation: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        budget: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'implementation']
}));

// Task 8: SWOT Report Generation
export const swotReportTask = defineTask('swot-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive SWOT report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'senior strategy consultant and report author',
      task: 'Generate comprehensive SWOT strategic assessment report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present SWOT matrix with detailed analysis',
        'Include TOWS strategy matrix',
        'Present prioritized strategic options',
        'Document implementation roadmap',
        'Include visualizations (SWOT matrix, TOWS matrix, priority matrix)',
        'Add appendices with supporting analysis',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'reporting']
}));
