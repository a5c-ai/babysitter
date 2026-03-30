/**
 * @process business-strategy/pestel-analysis
 * @description Macro-environmental scanning of Political, Economic, Social, Technological, Environmental, and Legal factors affecting the organization
 * @inputs { organizationContext: object, industry: string, geographicScope: array, timeHorizon: string, outputDir: string }
 * @outputs { success: boolean, pestelFactors: object, impactAssessment: object, strategicImplications: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    industry = '',
    geographicScope = ['national'],
    timeHorizon = '3-5 years',
    outputDir = 'pestel-output',
    includeScenarios = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting PESTEL Analysis Process');

  // ============================================================================
  // PHASE 1: POLITICAL FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing political factors');
  const politicalAnalysis = await ctx.task(politicalFactorsTask, {
    organizationContext,
    industry,
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
    organizationContext,
    industry,
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
    organizationContext,
    industry,
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
    organizationContext,
    industry,
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
    organizationContext,
    industry,
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
    organizationContext,
    industry,
    geographicScope,
    timeHorizon,
    outputDir
  });

  artifacts.push(...legalAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: IMPACT ASSESSMENT AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing impact and prioritizing factors');
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    politicalAnalysis,
    economicAnalysis,
    socialAnalysis,
    technologicalAnalysis,
    environmentalAnalysis,
    legalAnalysis,
    organizationContext,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // Breakpoint: Review PESTEL analysis
  await ctx.breakpoint({
    question: `PESTEL analysis complete. Identified ${impactAssessment.totalFactors} macro-environmental factors with ${impactAssessment.criticalFactors.length} critical factors. Review findings?`,
    title: 'PESTEL Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        politicalFactors: politicalAnalysis.factors.length,
        economicFactors: economicAnalysis.factors.length,
        socialFactors: socialAnalysis.factors.length,
        technologicalFactors: technologicalAnalysis.factors.length,
        environmentalFactors: environmentalAnalysis.factors.length,
        legalFactors: legalAnalysis.factors.length,
        criticalFactors: impactAssessment.criticalFactors.length
      }
    }
  });

  // ============================================================================
  // PHASE 8: SCENARIO DEVELOPMENT (OPTIONAL)
  // ============================================================================

  let scenarioAnalysis = null;
  if (includeScenarios) {
    ctx.log('info', 'Phase 8: Developing scenarios');
    scenarioAnalysis = await ctx.task(scenarioDevelopmentTask, {
      pestelFactors: {
        political: politicalAnalysis.factors,
        economic: economicAnalysis.factors,
        social: socialAnalysis.factors,
        technological: technologicalAnalysis.factors,
        environmental: environmentalAnalysis.factors,
        legal: legalAnalysis.factors
      },
      impactAssessment,
      timeHorizon,
      outputDir
    });
    artifacts.push(...scenarioAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 9: STRATEGIC IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Deriving strategic implications');
  const strategicImplications = await ctx.task(pestelImplicationsTask, {
    pestelFactors: {
      political: politicalAnalysis.factors,
      economic: economicAnalysis.factors,
      social: socialAnalysis.factors,
      technological: technologicalAnalysis.factors,
      environmental: environmentalAnalysis.factors,
      legal: legalAnalysis.factors
    },
    impactAssessment,
    scenarioAnalysis,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicImplications.artifacts);

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive report');
  const pestelReport = await ctx.task(pestelReportTask, {
    organizationContext,
    politicalAnalysis,
    economicAnalysis,
    socialAnalysis,
    technologicalAnalysis,
    environmentalAnalysis,
    legalAnalysis,
    impactAssessment,
    scenarioAnalysis,
    strategicImplications,
    outputDir
  });

  artifacts.push(...pestelReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    pestelFactors: {
      political: politicalAnalysis.factors,
      economic: economicAnalysis.factors,
      social: socialAnalysis.factors,
      technological: technologicalAnalysis.factors,
      environmental: environmentalAnalysis.factors,
      legal: legalAnalysis.factors
    },
    impactAssessment: impactAssessment.assessment,
    criticalFactors: impactAssessment.criticalFactors,
    scenarios: scenarioAnalysis ? scenarioAnalysis.scenarios : null,
    strategicImplications: strategicImplications.implications,
    recommendations: strategicImplications.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/pestel-analysis',
      timestamp: startTime,
      geographicScope,
      timeHorizon
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
      role: 'political risk analyst and government affairs expert',
      task: 'Analyze political factors affecting the organization',
      context: args,
      instructions: [
        'Analyze political factors across dimensions:',
        '  - Government stability and policies',
        '  - Trade policies and tariffs',
        '  - Tax policy changes',
        '  - Regulatory environment',
        '  - Political party agendas',
        '  - International relations',
        '  - Government spending priorities',
        '  - Lobbying and political influence',
        'Assess impact direction (positive/negative/neutral)',
        'Evaluate likelihood and timing',
        'Identify early warning indicators',
        'Consider geographic variations',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), keyTrends (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyTrends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'political', 'macro-environment']
}));

// Task 2: Economic Factors Analysis
export const economicFactorsTask = defineTask('economic-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze economic factors',
  agent: {
    name: 'economist',
    prompt: {
      role: 'economist and market analyst',
      task: 'Analyze economic factors affecting the organization',
      context: args,
      instructions: [
        'Analyze economic factors across dimensions:',
        '  - GDP growth and economic cycles',
        '  - Interest rates and monetary policy',
        '  - Inflation and price stability',
        '  - Exchange rates and currency',
        '  - Unemployment and labor market',
        '  - Consumer confidence and spending',
        '  - Industry-specific economic indicators',
        '  - Global economic trends',
        'Assess impact on organization',
        'Evaluate macroeconomic scenarios',
        'Identify leading indicators',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), economicOutlook (string), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        economicOutlook: { type: 'string' },
        keyIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'economic', 'macro-environment']
}));

// Task 3: Social Factors Analysis
export const socialFactorsTask = defineTask('social-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze social factors',
  agent: {
    name: 'sociologist',
    prompt: {
      role: 'sociologist and consumer behavior expert',
      task: 'Analyze social factors affecting the organization',
      context: args,
      instructions: [
        'Analyze social factors across dimensions:',
        '  - Demographics and population trends',
        '  - Cultural values and attitudes',
        '  - Lifestyle changes',
        '  - Education levels and trends',
        '  - Health consciousness',
        '  - Work-life balance attitudes',
        '  - Social mobility and class',
        '  - Consumer behavior trends',
        '  - Social media and communication',
        'Assess impact on demand and operations',
        'Identify generational differences',
        'Evaluate cultural shifts',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), demographicTrends (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              segments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        demographicTrends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'social', 'macro-environment']
}));

// Task 4: Technological Factors Analysis
export const technologicalFactorsTask = defineTask('technological-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze technological factors',
  agent: {
    name: 'technology-analyst',
    prompt: {
      role: 'technology analyst and innovation expert',
      task: 'Analyze technological factors affecting the organization',
      context: args,
      instructions: [
        'Analyze technological factors across dimensions:',
        '  - Emerging technologies and disruption',
        '  - R&D activity and innovation',
        '  - Technology adoption rates',
        '  - Automation and AI trends',
        '  - Digital transformation',
        '  - Cybersecurity landscape',
        '  - Technology infrastructure',
        '  - Intellectual property dynamics',
        'Assess disruption potential',
        'Identify technology investments needed',
        'Evaluate competitive technology gaps',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), emergingTechnologies (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              maturity: { type: 'string' }
            }
          }
        },
        emergingTechnologies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'technological', 'macro-environment']
}));

// Task 5: Environmental Factors Analysis
export const environmentalFactorsTask = defineTask('environmental-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze environmental factors',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'sustainability analyst and environmental policy expert',
      task: 'Analyze environmental factors affecting the organization',
      context: args,
      instructions: [
        'Analyze environmental factors across dimensions:',
        '  - Climate change and weather patterns',
        '  - Environmental regulations and policies',
        '  - Sustainability requirements',
        '  - Carbon footprint and emissions',
        '  - Resource scarcity and availability',
        '  - Waste management requirements',
        '  - Energy costs and availability',
        '  - Stakeholder environmental expectations',
        'Assess operational and reputational impact',
        'Identify compliance requirements',
        'Evaluate ESG implications',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), sustainabilityRequirements (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              regulatoryDriver: { type: 'boolean' }
            }
          }
        },
        sustainabilityRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'environmental', 'macro-environment']
}));

// Task 6: Legal Factors Analysis
export const legalFactorsTask = defineTask('legal-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze legal factors',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'legal analyst and regulatory compliance expert',
      task: 'Analyze legal factors affecting the organization',
      context: args,
      instructions: [
        'Analyze legal factors across dimensions:',
        '  - Industry-specific regulations',
        '  - Employment and labor law',
        '  - Consumer protection laws',
        '  - Data protection and privacy (GDPR, etc.)',
        '  - Intellectual property law',
        '  - Health and safety regulations',
        '  - Competition and antitrust law',
        '  - Contract and commercial law',
        'Assess compliance requirements',
        'Identify pending legislation',
        'Evaluate litigation risks',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array of objects with name, description, impact, likelihood, timing), complianceRequirements (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              timing: { type: 'string' },
              jurisdiction: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'legal', 'macro-environment']
}));

// Task 7: Impact Assessment
export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess and prioritize PESTEL factors',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Assess impact and prioritize all PESTEL factors',
      context: args,
      instructions: [
        'Consolidate all PESTEL factors',
        'Apply impact-likelihood scoring matrix',
        'Identify critical factors (high impact + high likelihood)',
        'Identify monitoring factors (high impact + low likelihood)',
        'Assess factor interdependencies',
        'Prioritize by strategic importance',
        'Create impact heatmap',
        'Identify quick wins and urgent actions',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (object), criticalFactors (array), totalFactors (number), priorityMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'criticalFactors', 'totalFactors', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            political: { type: 'object' },
            economic: { type: 'object' },
            social: { type: 'object' },
            technological: { type: 'object' },
            environmental: { type: 'object' },
            legal: { type: 'object' }
          }
        },
        criticalFactors: { type: 'array', items: { type: 'string' } },
        totalFactors: { type: 'number' },
        priorityMatrix: { type: 'object' },
        interdependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'impact-assessment', 'prioritization']
}));

// Task 8: Scenario Development
export const scenarioDevelopmentTask = defineTask('scenario-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop future scenarios',
  agent: {
    name: 'futurist',
    prompt: {
      role: 'strategic foresight analyst and futurist',
      task: 'Develop alternative future scenarios based on PESTEL factors',
      context: args,
      instructions: [
        'Identify key uncertainties from PESTEL factors',
        'Select 2 highest-impact uncertainties as scenario axes',
        'Develop 3-4 distinct future scenarios:',
        '  - Best case scenario',
        '  - Worst case scenario',
        '  - Most likely scenario',
        '  - Wildcard scenario',
        'Describe each scenario in detail',
        'Identify strategic implications per scenario',
        'Define early warning indicators',
        'Save scenarios to output directory'
      ],
      outputFormat: 'JSON with scenarios (array of objects with name, description, assumptions, implications, probability), keyUncertainties (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'keyUncertainties', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              implications: { type: 'array', items: { type: 'string' } },
              probability: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyUncertainties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'scenarios', 'foresight']
}));

// Task 9: Strategic Implications
export const pestelImplicationsTask = defineTask('pestel-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive strategic implications',
  agent: {
    name: 'chief-strategy-officer',
    prompt: {
      role: 'chief strategy officer',
      task: 'Derive strategic implications from PESTEL analysis',
      context: args,
      instructions: [
        'Synthesize key findings across all PESTEL dimensions',
        'Identify strategic implications:',
        '  - Market entry/exit decisions',
        '  - Product/service portfolio adjustments',
        '  - Operational changes needed',
        '  - Investment priorities',
        '  - Partnership and alliance opportunities',
        'Develop recommendations by time horizon',
        'Identify capability gaps to address',
        'Define monitoring and review process',
        'Save implications to output directory'
      ],
      outputFormat: 'JSON with implications (array), recommendations (array), monitoringPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'recommendations', 'artifacts'],
      properties: {
        implications: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              pestelDimension: { type: 'string' },
              priority: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pestel', 'implications', 'strategy']
}));

// Task 10: PESTEL Report Generation
export const pestelReportTask = defineTask('pestel-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive PESTEL report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and technical writer',
      task: 'Generate comprehensive PESTEL analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Include methodology section',
        'Document each PESTEL dimension in detail',
        'Present impact assessment and prioritization',
        'Include scenario analysis (if available)',
        'Present strategic implications and recommendations',
        'Add monitoring dashboard outline',
        'Include appendices with detailed data',
        'Format as professional strategy document',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
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
  labels: ['agent', 'pestel', 'reporting', 'documentation']
}));
