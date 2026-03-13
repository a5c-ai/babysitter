/**
 * @process business-strategy/competitor-intelligence-analysis
 * @description Systematic competitor analysis including identification, profiling, monitoring, and response planning
 * @inputs { organizationName: string, industryContext: object, knownCompetitors: array, marketData: object }
 * @outputs { success: boolean, competitorMap: object, competitorProfiles: array, responsePlaybook: object, earlyWarningSystem: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    industryContext = {},
    knownCompetitors = [],
    marketData = {},
    outputDir = 'competitor-intel-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Competitor Intelligence Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: COMPETITOR IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying competitors across categories');
  const competitorIdentification = await ctx.task(competitorIdentificationTask, {
    organizationName,
    industryContext,
    knownCompetitors,
    marketData,
    outputDir
  });

  artifacts.push(...competitorIdentification.artifacts);

  // ============================================================================
  // PHASE 2: COMPETITOR PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing comprehensive competitor profiles');
  const competitorProfiles = await ctx.task(competitorProfilingTask, {
    organizationName,
    competitorIdentification,
    marketData,
    outputDir
  });

  artifacts.push(...competitorProfiles.artifacts);

  // ============================================================================
  // PHASE 3: STRENGTH AND WEAKNESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing competitor strengths and weaknesses');
  const strengthWeaknessAnalysis = await ctx.task(strengthWeaknessAnalysisTask, {
    organizationName,
    competitorProfiles,
    industryContext,
    outputDir
  });

  artifacts.push(...strengthWeaknessAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: STRATEGIC INTENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing competitor strategic intent and moves');
  const strategicIntentAnalysis = await ctx.task(strategicIntentAnalysisTask, {
    organizationName,
    competitorProfiles,
    marketData,
    outputDir
  });

  artifacts.push(...strategicIntentAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: COMPETITIVE DYNAMICS MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping competitive dynamics and relationships');
  const competitiveDynamics = await ctx.task(competitiveDynamicsTask, {
    organizationName,
    competitorProfiles,
    strengthWeaknessAnalysis,
    strategicIntentAnalysis,
    outputDir
  });

  artifacts.push(...competitiveDynamics.artifacts);

  // ============================================================================
  // PHASE 6: RESPONSE SCENARIO DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing competitive response scenarios');
  const responseScenarios = await ctx.task(responseScenariosTask, {
    organizationName,
    competitorProfiles,
    strategicIntentAnalysis,
    competitiveDynamics,
    outputDir
  });

  artifacts.push(...responseScenarios.artifacts);

  // ============================================================================
  // PHASE 7: EARLY WARNING SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing competitive early warning system');
  const earlyWarningSystem = await ctx.task(earlyWarningSystemTask, {
    organizationName,
    competitorProfiles,
    strategicIntentAnalysis,
    outputDir
  });

  artifacts.push(...earlyWarningSystem.artifacts);

  // ============================================================================
  // PHASE 8: RESPONSE PLAYBOOK CREATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating competitive response playbook');
  const responsePlaybook = await ctx.task(responsePlaybookTask, {
    organizationName,
    responseScenarios,
    strengthWeaknessAnalysis,
    competitiveDynamics,
    outputDir
  });

  artifacts.push(...responsePlaybook.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive competitor intelligence report');
  const competitorReport = await ctx.task(competitorReportTask, {
    organizationName,
    competitorIdentification,
    competitorProfiles,
    strengthWeaknessAnalysis,
    strategicIntentAnalysis,
    competitiveDynamics,
    responseScenarios,
    earlyWarningSystem,
    responsePlaybook,
    outputDir
  });

  artifacts.push(...competitorReport.artifacts);

  // Breakpoint: Review competitor intelligence
  await ctx.breakpoint({
    question: `Competitor intelligence analysis complete for ${organizationName}. ${competitorIdentification.totalCompetitors} competitors profiled. Review findings?`,
    title: 'Competitor Intelligence Analysis Review',
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
        competitorCounts: {
          direct: competitorIdentification.directCompetitors?.length || 0,
          indirect: competitorIdentification.indirectCompetitors?.length || 0,
          potential: competitorIdentification.potentialCompetitors?.length || 0
        },
        topThreats: strengthWeaknessAnalysis.topThreats?.slice(0, 3),
        responseScenarios: responseScenarios.scenarios?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    competitorMap: {
      direct: competitorIdentification.directCompetitors,
      indirect: competitorIdentification.indirectCompetitors,
      potential: competitorIdentification.potentialCompetitors
    },
    competitorProfiles: competitorProfiles.profiles,
    strengthWeaknessAnalysis: strengthWeaknessAnalysis.analysis,
    competitiveDynamics: competitiveDynamics.dynamics,
    responsePlaybook: responsePlaybook.playbook,
    earlyWarningSystem: earlyWarningSystem.system,
    reportPath: competitorReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/competitor-intelligence-analysis',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Competitor Identification
export const competitorIdentificationTask = defineTask('competitor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify competitors across categories',
  agent: {
    name: 'competitor-identifier',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Identify and categorize all relevant competitors',
      context: args,
      instructions: [
        'Identify direct competitors (same products, same customers)',
        'Identify indirect competitors (substitute products, same needs)',
        'Identify potential competitors (could enter market)',
        'Map competitors by market segment',
        'Assess competitor relevance and threat level',
        'Identify emerging competitors and disruptors',
        'Create competitor landscape map',
        'Prioritize competitors for detailed analysis',
        'Generate competitor identification report'
      ],
      outputFormat: 'JSON with directCompetitors, indirectCompetitors, potentialCompetitors, totalCompetitors, competitorMap, prioritizedList, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['directCompetitors', 'indirectCompetitors', 'potentialCompetitors', 'totalCompetitors', 'artifacts'],
      properties: {
        directCompetitors: { type: 'array', items: { type: 'object' } },
        indirectCompetitors: { type: 'array', items: { type: 'object' } },
        potentialCompetitors: { type: 'array', items: { type: 'object' } },
        totalCompetitors: { type: 'number' },
        competitorMap: { type: 'object' },
        prioritizedList: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'identification']
}));

// Task 2: Competitor Profiling
export const competitorProfilingTask = defineTask('competitor-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop comprehensive competitor profiles',
  agent: {
    name: 'competitor-profiler',
    prompt: {
      role: 'competitive intelligence researcher',
      task: 'Create comprehensive profiles for priority competitors',
      context: args,
      instructions: [
        'Profile company background (history, ownership, structure)',
        'Document product/service portfolio',
        'Analyze pricing strategy and positioning',
        'Assess market share and growth trajectory',
        'Evaluate financial performance and health',
        'Map geographic presence and expansion',
        'Analyze customer base and segments served',
        'Document technology and innovation capabilities',
        'Assess leadership team and key personnel',
        'Generate comprehensive competitor profiles'
      ],
      outputFormat: 'JSON with profiles (array with name, background, products, pricing, marketShare, financials, geography, customers, technology, leadership), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'artifacts'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              background: { type: 'object' },
              products: { type: 'array', items: { type: 'object' } },
              pricing: { type: 'object' },
              marketShare: { type: 'string' },
              financials: { type: 'object' },
              geography: { type: 'array', items: { type: 'string' } },
              customers: { type: 'object' },
              technology: { type: 'object' },
              leadership: { type: 'array', items: { type: 'object' } }
            }
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
  labels: ['agent', 'competitor-intel', 'profiling']
}));

// Task 3: Strength and Weakness Analysis
export const strengthWeaknessAnalysisTask = defineTask('strength-weakness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor strengths and weaknesses',
  agent: {
    name: 'swot-analyst',
    prompt: {
      role: 'competitive analysis specialist',
      task: 'Analyze strengths and weaknesses of each competitor',
      context: args,
      instructions: [
        'Identify key strengths of each competitor',
        'Identify key weaknesses of each competitor',
        'Compare strengths/weaknesses to our organization',
        'Identify competitive advantages and disadvantages',
        'Assess sustainability of competitor strengths',
        'Identify exploitable weaknesses',
        'Rank competitors by overall threat level',
        'Identify our relative position vs. each competitor',
        'Generate strength/weakness analysis matrix'
      ],
      outputFormat: 'JSON with analysis (array with competitor, strengths, weaknesses, relativePosition), topThreats, exploitableWeaknesses, competitiveGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'topThreats', 'artifacts'],
      properties: {
        analysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              relativePosition: { type: 'string' },
              threatLevel: { type: 'string' }
            }
          }
        },
        topThreats: { type: 'array', items: { type: 'string' } },
        exploitableWeaknesses: { type: 'array', items: { type: 'object' } },
        competitiveGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'strength-weakness']
}));

// Task 4: Strategic Intent Analysis
export const strategicIntentAnalysisTask = defineTask('strategic-intent-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor strategic intent and likely moves',
  agent: {
    name: 'strategy-predictor',
    prompt: {
      role: 'competitive strategy analyst',
      task: 'Analyze competitor strategic intent and predict likely moves',
      context: args,
      instructions: [
        'Analyze stated strategic objectives and goals',
        'Assess implied strategy from actions and investments',
        'Identify growth ambitions and expansion plans',
        'Analyze R&D and innovation direction',
        'Assess M&A appetite and likely targets',
        'Predict likely competitive moves',
        'Identify potential market entry/exit plans',
        'Assess reaction patterns to competitive actions',
        'Generate strategic intent analysis report'
      ],
      outputFormat: 'JSON with intentAnalysis (array with competitor, statedStrategy, impliedStrategy, growthPlans, predictedMoves, reactionPatterns), marketMovesPredictions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intentAnalysis', 'artifacts'],
      properties: {
        intentAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              statedStrategy: { type: 'string' },
              impliedStrategy: { type: 'string' },
              growthPlans: { type: 'array', items: { type: 'string' } },
              predictedMoves: { type: 'array', items: { type: 'string' } },
              reactionPatterns: { type: 'object' }
            }
          }
        },
        marketMovesPredictions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'strategic-intent']
}));

// Task 5: Competitive Dynamics Mapping
export const competitiveDynamicsTask = defineTask('competitive-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map competitive dynamics and relationships',
  agent: {
    name: 'dynamics-analyst',
    prompt: {
      role: 'competitive dynamics specialist',
      task: 'Map competitive dynamics, relationships, and ecosystem',
      context: args,
      instructions: [
        'Map competitive relationships (rivalry intensity)',
        'Identify alliances and partnerships',
        'Map ecosystem relationships (suppliers, channels, platforms)',
        'Assess competitive intensity by segment',
        'Identify market leadership patterns',
        'Analyze attack and defense patterns',
        'Map value network positions',
        'Identify competitive flashpoints',
        'Generate competitive dynamics map'
      ],
      outputFormat: 'JSON with dynamics, relationships, ecosystem, competitiveIntensity, flashpoints, valueNetwork, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamics', 'artifacts'],
      properties: {
        dynamics: { type: 'object' },
        relationships: { type: 'array', items: { type: 'object' } },
        ecosystem: { type: 'object' },
        competitiveIntensity: { type: 'object' },
        flashpoints: { type: 'array', items: { type: 'string' } },
        valueNetwork: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'dynamics']
}));

// Task 6: Response Scenarios Development
export const responseScenariosTask = defineTask('response-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop competitive response scenarios',
  agent: {
    name: 'scenario-planner',
    prompt: {
      role: 'competitive scenario planner',
      task: 'Develop response scenarios for competitor actions',
      context: args,
      instructions: [
        'Identify likely competitor moves requiring response',
        'Develop scenarios for each predicted move',
        'Create response options for each scenario',
        'Evaluate response effectiveness and risks',
        'Identify trigger points for each response',
        'Assess resource requirements for responses',
        'Develop contingency plans',
        'Prioritize scenarios by likelihood and impact',
        'Generate response scenario documentation'
      ],
      outputFormat: 'JSON with scenarios (array with trigger, competitorMove, responseOptions, recommendedResponse, resources), prioritizedScenarios, contingencyPlans, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              competitorMove: { type: 'string' },
              competitor: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              responseOptions: { type: 'array', items: { type: 'object' } },
              recommendedResponse: { type: 'string' },
              resources: { type: 'string' }
            }
          }
        },
        prioritizedScenarios: { type: 'array', items: { type: 'string' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'scenarios']
}));

// Task 7: Early Warning System Design
export const earlyWarningSystemTask = defineTask('early-warning-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design competitive early warning system',
  agent: {
    name: 'early-warning-designer',
    prompt: {
      role: 'competitive intelligence system designer',
      task: 'Design early warning system for competitor moves',
      context: args,
      instructions: [
        'Define key indicators to monitor for each competitor',
        'Identify data sources for monitoring',
        'Establish monitoring frequency and process',
        'Define alert thresholds and escalation procedures',
        'Design competitive intelligence dashboard',
        'Establish signal interpretation guidelines',
        'Create competitor news and activity tracking',
        'Define roles and responsibilities for monitoring',
        'Generate early warning system documentation'
      ],
      outputFormat: 'JSON with system (indicators, dataSources, monitoringProcess, alertThresholds, escalation), dashboard, signalInterpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            indicators: { type: 'array', items: { type: 'object' } },
            dataSources: { type: 'array', items: { type: 'string' } },
            monitoringProcess: { type: 'object' },
            alertThresholds: { type: 'object' },
            escalation: { type: 'object' }
          }
        },
        dashboard: { type: 'object' },
        signalInterpretation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitor-intel', 'early-warning']
}));

// Task 8: Response Playbook Creation
export const responsePlaybookTask = defineTask('response-playbook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create competitive response playbook',
  agent: {
    name: 'playbook-creator',
    prompt: {
      role: 'competitive strategy playbook author',
      task: 'Create comprehensive competitive response playbook',
      context: args,
      instructions: [
        'Document response plays for common competitor moves',
        'Create decision trees for response selection',
        'Define response timing guidelines',
        'Include resource allocation guidelines',
        'Document escalation procedures',
        'Create communication templates',
        'Include lessons learned from past responses',
        'Define success metrics for responses',
        'Generate comprehensive playbook document'
      ],
      outputFormat: 'JSON with playbook (plays, decisionTrees, timingGuidelines, resourceAllocation, escalation, templates, metrics), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbook', 'artifacts'],
      properties: {
        playbook: {
          type: 'object',
          properties: {
            plays: { type: 'array', items: { type: 'object' } },
            decisionTrees: { type: 'array', items: { type: 'object' } },
            timingGuidelines: { type: 'object' },
            resourceAllocation: { type: 'object' },
            escalation: { type: 'object' },
            templates: { type: 'array', items: { type: 'string' } },
            metrics: { type: 'array', items: { type: 'object' } }
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
  labels: ['agent', 'competitor-intel', 'playbook']
}));

// Task 9: Competitor Intelligence Report Generation
export const competitorReportTask = defineTask('competitor-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive competitor intelligence report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'competitive intelligence report author',
      task: 'Generate comprehensive competitor intelligence report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present competitor landscape map',
        'Document detailed competitor profiles',
        'Present strength/weakness analysis',
        'Include strategic intent analysis',
        'Document competitive dynamics',
        'Present response scenarios and playbook',
        'Include early warning system design',
        'Add visualizations and frameworks',
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
  labels: ['agent', 'competitor-intel', 'reporting']
}));
