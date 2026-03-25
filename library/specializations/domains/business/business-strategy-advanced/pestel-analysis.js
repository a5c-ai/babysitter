/**
 * @process business-strategy/pestel-analysis
 * @description Comprehensive macro-environmental scanning using PESTEL framework to identify external factors affecting strategic decisions
 * @inputs { organizationName: string, industryContext: object, geographicScope: array, timeHorizon: string }
 * @outputs { success: boolean, pestelFactors: object, prioritizedFactors: array, strategicImplications: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    industryContext = {},
    geographicScope = ['global'],
    timeHorizon = '3-5 years',
    outputDir = 'pestel-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting PESTEL Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: POLITICAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing political factors');
  const politicalAnalysis = await ctx.task(politicalFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...politicalAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ECONOMIC FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing economic factors');
  const economicAnalysis = await ctx.task(economicFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...economicAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: SOCIAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing social factors');
  const socialAnalysis = await ctx.task(socialFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...socialAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: TECHNOLOGICAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing technological factors');
  const technologicalAnalysis = await ctx.task(technologicalFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...technologicalAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: ENVIRONMENTAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing environmental factors');
  const environmentalAnalysis = await ctx.task(environmentalFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...environmentalAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: LEGAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing legal factors');
  const legalAnalysis = await ctx.task(legalFactorsTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...legalAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: FACTOR PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Prioritizing factors by impact and probability');
  const prioritizationResult = await ctx.task(factorPrioritizationTask, {
    organizationName,
    politicalAnalysis,
    economicAnalysis,
    socialAnalysis,
    technologicalAnalysis,
    environmentalAnalysis,
    legalAnalysis,
    timeHorizon,
    outputDir
  });

  artifacts.push(...prioritizationResult.artifacts);

  // ============================================================================
  // PHASE 8: STRATEGIC IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing strategic responses');
  const strategicImplications = await ctx.task(strategicImplicationsTask, {
    organizationName,
    industryContext,
    prioritizationResult,
    politicalAnalysis,
    economicAnalysis,
    socialAnalysis,
    technologicalAnalysis,
    environmentalAnalysis,
    legalAnalysis,
    outputDir
  });

  artifacts.push(...strategicImplications.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive PESTEL report');
  const pestelReport = await ctx.task(pestelReportTask, {
    organizationName,
    industryContext,
    geographicScope,
    timeHorizon,
    politicalAnalysis,
    economicAnalysis,
    socialAnalysis,
    technologicalAnalysis,
    environmentalAnalysis,
    legalAnalysis,
    prioritizationResult,
    strategicImplications,
    outputDir
  });

  artifacts.push(...pestelReport.artifacts);

  // Breakpoint: Review PESTEL analysis
  await ctx.breakpoint({
    question: `PESTEL analysis complete for ${organizationName}. ${prioritizationResult.criticalFactors?.length || 0} critical factors identified. Review findings?`,
    title: 'PESTEL Analysis Review',
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
        timeHorizon,
        factorCounts: {
          political: politicalAnalysis.factors?.length || 0,
          economic: economicAnalysis.factors?.length || 0,
          social: socialAnalysis.factors?.length || 0,
          technological: technologicalAnalysis.factors?.length || 0,
          environmental: environmentalAnalysis.factors?.length || 0,
          legal: legalAnalysis.factors?.length || 0
        },
        criticalFactors: prioritizationResult.criticalFactors?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    pestelFactors: {
      political: politicalAnalysis.factors,
      economic: economicAnalysis.factors,
      social: socialAnalysis.factors,
      technological: technologicalAnalysis.factors,
      environmental: environmentalAnalysis.factors,
      legal: legalAnalysis.factors
    },
    prioritizedFactors: prioritizationResult.prioritizedFactors,
    criticalFactors: prioritizationResult.criticalFactors,
    strategicImplications: strategicImplications.implications,
    trendImpactAssessment: prioritizationResult.trendImpactAssessment,
    reportPath: pestelReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/pestel-analysis',
      timestamp: startTime,
      organizationName,
      geographicScope,
      timeHorizon,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Political Factors Analysis
export const politicalFactorsTask = defineTask('political-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze political factors',
  agent: {
    name: 'political-analyst',
    prompt: {
      role: 'political risk analyst and government relations specialist',
      task: 'Analyze political factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess government stability and political climate in relevant regions',
        'Analyze trade policies, tariffs, and international relations',
        'Evaluate tax policies and incentives',
        'Assess regulatory trends and government intervention',
        'Analyze political party positions affecting the industry',
        'Evaluate geopolitical risks and conflicts',
        'Assess lobbying and advocacy landscape',
        'Analyze government spending and fiscal policy',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate political factors assessment report'
      ],
      outputFormat: 'JSON with factors (array of objects with description, likelihood, impact, timeframe), trends, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        trends: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'political']
}));

// Task 2: Economic Factors Analysis
export const economicFactorsTask = defineTask('economic-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze economic factors',
  agent: {
    name: 'economic-analyst',
    prompt: {
      role: 'macroeconomic analyst and market economist',
      task: 'Analyze economic factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess economic growth rates and GDP trends',
        'Analyze inflation rates and monetary policy',
        'Evaluate interest rates and credit availability',
        'Assess exchange rates and currency stability',
        'Analyze unemployment and labor market conditions',
        'Evaluate disposable income and consumer spending',
        'Assess business cycles and recession risks',
        'Analyze commodity prices and supply chain costs',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate economic factors assessment report'
      ],
      outputFormat: 'JSON with factors (array), economicOutlook, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        economicOutlook: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'economic']
}));

// Task 3: Social Factors Analysis
export const socialFactorsTask = defineTask('social-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze social factors',
  agent: {
    name: 'social-analyst',
    prompt: {
      role: 'social trends analyst and demographics specialist',
      task: 'Analyze social factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess demographic trends (age, population growth, urbanization)',
        'Analyze cultural values and attitudes',
        'Evaluate lifestyle changes and consumer preferences',
        'Assess education levels and skill availability',
        'Analyze health consciousness and wellness trends',
        'Evaluate social mobility and class structure',
        'Assess diversity and inclusion expectations',
        'Analyze work-life balance and employment preferences',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate social factors assessment report'
      ],
      outputFormat: 'JSON with factors (array), demographicTrends, culturalShifts, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        demographicTrends: { type: 'array', items: { type: 'string' } },
        culturalShifts: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'social']
}));

// Task 4: Technological Factors Analysis
export const technologicalFactorsTask = defineTask('technological-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze technological factors',
  agent: {
    name: 'technology-analyst',
    prompt: {
      role: 'technology analyst and innovation specialist',
      task: 'Analyze technological factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess emerging technologies and innovation trends',
        'Analyze R&D activity and investment levels',
        'Evaluate automation and AI adoption',
        'Assess digital transformation trends',
        'Analyze technology infrastructure and connectivity',
        'Evaluate cybersecurity threats and data protection',
        'Assess intellectual property and patent activity',
        'Analyze technology adoption rates and diffusion',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate technological factors assessment report'
      ],
      outputFormat: 'JSON with factors (array), emergingTechnologies, disruptionRisks, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        emergingTechnologies: { type: 'array', items: { type: 'string' } },
        disruptionRisks: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'technological']
}));

// Task 5: Environmental Factors Analysis
export const environmentalFactorsTask = defineTask('environmental-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze environmental factors',
  agent: {
    name: 'environmental-analyst',
    prompt: {
      role: 'environmental analyst and sustainability specialist',
      task: 'Analyze environmental factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess climate change impacts and weather patterns',
        'Analyze environmental regulations and carbon policies',
        'Evaluate sustainability expectations from stakeholders',
        'Assess resource scarcity and availability',
        'Analyze waste management and circular economy trends',
        'Evaluate pollution and environmental liability risks',
        'Assess renewable energy trends and adoption',
        'Analyze biodiversity and ecosystem considerations',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate environmental factors assessment report'
      ],
      outputFormat: 'JSON with factors (array), climateRisks, sustainabilityTrends, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        climateRisks: { type: 'array', items: { type: 'string' } },
        sustainabilityTrends: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'environmental']
}));

// Task 6: Legal Factors Analysis
export const legalFactorsTask = defineTask('legal-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze legal factors',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'legal analyst and regulatory affairs specialist',
      task: 'Analyze legal factors affecting the organization using PESTEL framework',
      context: args,
      instructions: [
        'Assess employment law and labor regulations',
        'Analyze consumer protection laws',
        'Evaluate health and safety regulations',
        'Assess data protection and privacy laws (GDPR, etc.)',
        'Analyze antitrust and competition law',
        'Evaluate intellectual property protection',
        'Assess industry-specific regulations',
        'Analyze international trade law and compliance',
        'Rate each factor by likelihood and impact (1-5 scale)',
        'Generate legal factors assessment report'
      ],
      outputFormat: 'JSON with factors (array), regulatoryTrends, complianceRequirements, risks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'number', minimum: 1, maximum: 5 },
              impact: { type: 'number', minimum: 1, maximum: 5 },
              timeframe: { type: 'string' },
              type: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] }
            }
          }
        },
        regulatoryTrends: { type: 'array', items: { type: 'string' } },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'legal']
}));

// Task 7: Factor Prioritization
export const factorPrioritizationTask = defineTask('factor-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize factors by impact and probability',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'senior strategy analyst',
      task: 'Prioritize PESTEL factors by impact and probability',
      context: args,
      instructions: [
        'Consolidate all factors from six PESTEL dimensions',
        'Calculate composite scores (likelihood x impact)',
        'Create prioritization grid (high/medium/low priority)',
        'Identify critical factors requiring immediate attention',
        'Identify emerging trends with long-term significance',
        'Assess interconnections between factors',
        'Create trend impact assessment matrix',
        'Identify watch list factors for monitoring',
        'Generate prioritization matrix visualization',
        'Generate factor prioritization report'
      ],
      outputFormat: 'JSON with prioritizedFactors, criticalFactors, emergingTrends, trendImpactAssessment, watchList, interconnections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedFactors', 'criticalFactors', 'artifacts'],
      properties: {
        prioritizedFactors: { type: 'array', items: { type: 'object' } },
        criticalFactors: { type: 'array', items: { type: 'object' } },
        emergingTrends: { type: 'array', items: { type: 'string' } },
        trendImpactAssessment: { type: 'object' },
        watchList: { type: 'array', items: { type: 'string' } },
        interconnections: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'prioritization']
}));

// Task 8: Strategic Implications
export const strategicImplicationsTask = defineTask('strategic-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic responses to key factors',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Develop strategic implications and responses based on PESTEL analysis',
      context: args,
      instructions: [
        'Identify strategic implications for each critical factor',
        'Develop response strategies for threats',
        'Identify strategies to capitalize on opportunities',
        'Recommend defensive measures for high-risk factors',
        'Suggest proactive initiatives for favorable trends',
        'Identify required capabilities and resources',
        'Develop monitoring and early warning indicators',
        'Create contingency plans for critical risks',
        'Prioritize strategic actions by urgency and impact',
        'Generate strategic implications report'
      ],
      outputFormat: 'JSON with implications, threatResponses, opportunityStrategies, contingencyPlans, monitoringIndicators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: { type: 'array', items: { type: 'object' } },
        threatResponses: { type: 'array', items: { type: 'object' } },
        opportunityStrategies: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        monitoringIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'strategic-implications']
}));

// Task 9: PESTEL Report Generation
export const pestelReportTask = defineTask('pestel-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive PESTEL report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'senior strategy consultant and report author',
      task: 'Generate comprehensive PESTEL analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Include analysis methodology and scope',
        'Present each PESTEL dimension with detailed analysis',
        'Include factor prioritization matrix',
        'Present trend impact assessment',
        'Document strategic implications and recommendations',
        'Include monitoring indicators and watch list',
        'Add appendices with data sources and detailed factor tables',
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
  labels: ['agent', 'pestel', 'reporting']
}));
