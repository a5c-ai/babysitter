/**
 * @process business-strategy/swot-analysis
 * @description Systematic evaluation of organizational Strengths, Weaknesses, Opportunities, and Threats to inform strategic decision-making
 * @inputs { organizationContext: object, industry: string, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, swotMatrix: object, strategicImplications: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    industry = '',
    stakeholders = [],
    outputDir = 'swot-output',
    timeHorizon = '3-5 years',
    includeWeightedScoring = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting SWOT Analysis Process');

  // ============================================================================
  // PHASE 1: INTERNAL ANALYSIS - STRENGTHS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing organizational strengths');
  const strengthsAnalysis = await ctx.task(strengthsAnalysisTask, {
    organizationContext,
    industry,
    outputDir
  });

  artifacts.push(...strengthsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INTERNAL ANALYSIS - WEAKNESSES
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing organizational weaknesses');
  const weaknessesAnalysis = await ctx.task(weaknessesAnalysisTask, {
    organizationContext,
    industry,
    strengths: strengthsAnalysis.strengths,
    outputDir
  });

  artifacts.push(...weaknessesAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: EXTERNAL ANALYSIS - OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing market opportunities');
  const opportunitiesAnalysis = await ctx.task(opportunitiesAnalysisTask, {
    organizationContext,
    industry,
    timeHorizon,
    outputDir
  });

  artifacts.push(...opportunitiesAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: EXTERNAL ANALYSIS - THREATS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing external threats');
  const threatsAnalysis = await ctx.task(threatsAnalysisTask, {
    organizationContext,
    industry,
    timeHorizon,
    outputDir
  });

  artifacts.push(...threatsAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SWOT MATRIX CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing SWOT matrix');
  const swotMatrix = await ctx.task(swotMatrixConstructionTask, {
    strengths: strengthsAnalysis.strengths,
    weaknesses: weaknessesAnalysis.weaknesses,
    opportunities: opportunitiesAnalysis.opportunities,
    threats: threatsAnalysis.threats,
    includeWeightedScoring,
    outputDir
  });

  artifacts.push(...swotMatrix.artifacts);

  // ============================================================================
  // PHASE 6: TOWS STRATEGIC OPTIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating TOWS strategic options');
  const towsStrategies = await ctx.task(towsStrategiesTask, {
    swotMatrix: swotMatrix.matrix,
    organizationContext,
    outputDir
  });

  artifacts.push(...towsStrategies.artifacts);

  // Breakpoint: Review SWOT analysis
  await ctx.breakpoint({
    question: `SWOT analysis complete. Identified ${strengthsAnalysis.strengths.length} strengths, ${weaknessesAnalysis.weaknesses.length} weaknesses, ${opportunitiesAnalysis.opportunities.length} opportunities, ${threatsAnalysis.threats.length} threats. Review findings?`,
    title: 'SWOT Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        strengths: strengthsAnalysis.strengths.length,
        weaknesses: weaknessesAnalysis.weaknesses.length,
        opportunities: opportunitiesAnalysis.opportunities.length,
        threats: threatsAnalysis.threats.length,
        strategicOptions: towsStrategies.strategies.length
      }
    }
  });

  // ============================================================================
  // PHASE 7: STRATEGIC IMPLICATIONS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Deriving strategic implications');
  const strategicImplications = await ctx.task(strategicImplicationsTask, {
    swotMatrix: swotMatrix.matrix,
    towsStrategies: towsStrategies.strategies,
    organizationContext,
    stakeholders,
    outputDir
  });

  artifacts.push(...strategicImplications.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive SWOT report');
  const swotReport = await ctx.task(swotReportGenerationTask, {
    organizationContext,
    strengthsAnalysis,
    weaknessesAnalysis,
    opportunitiesAnalysis,
    threatsAnalysis,
    swotMatrix,
    towsStrategies,
    strategicImplications,
    outputDir
  });

  artifacts.push(...swotReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    swotMatrix: swotMatrix.matrix,
    strengths: strengthsAnalysis.strengths,
    weaknesses: weaknessesAnalysis.weaknesses,
    opportunities: opportunitiesAnalysis.opportunities,
    threats: threatsAnalysis.threats,
    towsStrategies: towsStrategies.strategies,
    strategicImplications: strategicImplications.implications,
    prioritizedActions: strategicImplications.prioritizedActions,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/swot-analysis',
      timestamp: startTime,
      outputDir,
      timeHorizon
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Strengths Analysis
export const strengthsAnalysisTask = defineTask('strengths-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze organizational strengths',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'senior strategic analyst and organizational development expert',
      task: 'Identify and analyze organizational strengths that provide competitive advantage',
      context: args,
      instructions: [
        'Analyze internal capabilities across key dimensions:',
        '  - Core competencies and distinctive capabilities',
        '  - Financial resources and stability',
        '  - Human capital (skills, expertise, leadership)',
        '  - Operational efficiency and processes',
        '  - Technology and innovation capabilities',
        '  - Brand reputation and market position',
        '  - Customer relationships and loyalty',
        '  - Intellectual property and proprietary assets',
        'Prioritize strengths by strategic importance',
        'Assess sustainability of each strength',
        'Identify strengths that are difficult to imitate',
        'Document evidence and metrics supporting each strength',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with strengths (array of objects with name, description, category, importance, sustainability, evidence), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              sustainability: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        coreCompetencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'strengths', 'internal-analysis']
}));

// Task 2: Weaknesses Analysis
export const weaknessesAnalysisTask = defineTask('weaknesses-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze organizational weaknesses',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'senior strategic analyst and organizational assessment expert',
      task: 'Identify and analyze organizational weaknesses that limit competitive performance',
      context: args,
      instructions: [
        'Analyze internal limitations across key dimensions:',
        '  - Resource gaps and constraints',
        '  - Skill and capability deficiencies',
        '  - Operational inefficiencies',
        '  - Financial vulnerabilities',
        '  - Technology gaps and technical debt',
        '  - Organizational structure issues',
        '  - Cultural challenges',
        '  - Market position weaknesses',
        'Assess severity and impact of each weakness',
        'Identify root causes where possible',
        'Evaluate addressability (easy to fix vs structural)',
        'Prioritize weaknesses by competitive impact',
        'Document evidence and metrics',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with weaknesses (array of objects with name, description, category, severity, rootCause, addressability), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rootCause: { type: 'string' },
              addressability: { type: 'string', enum: ['easy', 'moderate', 'difficult', 'structural'] },
              competitiveImpact: { type: 'string' }
            }
          }
        },
        criticalGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'weaknesses', 'internal-analysis']
}));

// Task 3: Opportunities Analysis
export const opportunitiesAnalysisTask = defineTask('opportunities-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market opportunities',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'senior market analyst and business development strategist',
      task: 'Identify and analyze external opportunities for growth and competitive advantage',
      context: args,
      instructions: [
        'Scan external environment for opportunities across:',
        '  - Market trends and emerging segments',
        '  - Technological developments',
        '  - Regulatory changes (favorable)',
        '  - Competitor vulnerabilities',
        '  - Customer needs evolution',
        '  - Partnership and acquisition targets',
        '  - Geographic expansion possibilities',
        '  - Industry structural changes',
        'Assess attractiveness and timing of each opportunity',
        'Evaluate fit with organizational capabilities',
        'Estimate resource requirements to capture',
        'Analyze competitive dynamics around opportunity',
        'Prioritize by strategic value and achievability',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with opportunities (array of objects with name, description, category, attractiveness, timing, fitScore, resourceRequirement), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              attractiveness: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              timing: { type: 'string', enum: ['immediate', 'short-term', 'medium-term', 'long-term'] },
              fitScore: { type: 'number', minimum: 0, maximum: 100 },
              resourceRequirement: { type: 'string', enum: ['minimal', 'moderate', 'significant', 'major'] }
            }
          }
        },
        emergingTrends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'opportunities', 'external-analysis']
}));

// Task 4: Threats Analysis
export const threatsAnalysisTask = defineTask('threats-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze external threats',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'senior risk analyst and competitive intelligence expert',
      task: 'Identify and analyze external threats to organizational success',
      context: args,
      instructions: [
        'Scan external environment for threats across:',
        '  - Competitive pressure and new entrants',
        '  - Market disruption and technology shifts',
        '  - Regulatory and compliance risks',
        '  - Economic and market volatility',
        '  - Supply chain vulnerabilities',
        '  - Customer behavior changes',
        '  - Talent market challenges',
        '  - Reputation and brand risks',
        'Assess likelihood and impact of each threat',
        'Evaluate velocity (how fast threat is materializing)',
        'Identify early warning indicators',
        'Assess organizational preparedness',
        'Prioritize threats by risk exposure',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with threats (array of objects with name, description, category, likelihood, impact, velocity, warningIndicators), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] },
              impact: { type: 'string', enum: ['severe', 'major', 'moderate', 'minor'] },
              velocity: { type: 'string', enum: ['immediate', 'fast', 'gradual', 'slow'] },
              warningIndicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'threats', 'external-analysis']
}));

// Task 5: SWOT Matrix Construction
export const swotMatrixConstructionTask = defineTask('swot-matrix-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct SWOT matrix',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Construct comprehensive SWOT matrix with weighted scoring',
      context: args,
      instructions: [
        'Organize findings into structured SWOT matrix',
        'Apply weighted scoring methodology if enabled:',
        '  - Weight factors by importance (1-5)',
        '  - Score each factor (1-5)',
        '  - Calculate weighted scores',
        'Identify cross-quadrant relationships',
        'Highlight critical factor combinations',
        'Create visual SWOT matrix representation',
        'Calculate overall strategic position score',
        'Identify dominant quadrant (offensive/defensive posture)',
        'Save matrix to output directory'
      ],
      outputFormat: 'JSON with matrix (structured SWOT), weightedScores (object), overallPosition (string), dominantQuadrant (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'artifacts'],
      properties: {
        matrix: {
          type: 'object',
          properties: {
            strengths: { type: 'array' },
            weaknesses: { type: 'array' },
            opportunities: { type: 'array' },
            threats: { type: 'array' }
          }
        },
        weightedScores: {
          type: 'object',
          properties: {
            strengthsScore: { type: 'number' },
            weaknessesScore: { type: 'number' },
            opportunitiesScore: { type: 'number' },
            threatsScore: { type: 'number' }
          }
        },
        overallPosition: { type: 'string' },
        dominantQuadrant: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'matrix', 'strategy']
}));

// Task 6: TOWS Strategies
export const towsStrategiesTask = defineTask('tows-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate TOWS strategic options',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant and strategic planning expert',
      task: 'Generate strategic options using TOWS matrix analysis',
      context: args,
      instructions: [
        'Apply TOWS matrix framework to generate strategies:',
        '  - SO Strategies: Use Strengths to capture Opportunities (Maxi-Maxi)',
        '  - WO Strategies: Overcome Weaknesses by exploiting Opportunities (Mini-Maxi)',
        '  - ST Strategies: Use Strengths to avoid Threats (Maxi-Mini)',
        '  - WT Strategies: Minimize Weaknesses and avoid Threats (Mini-Mini)',
        'Generate 2-4 strategies per quadrant',
        'Ensure strategies are specific and actionable',
        'Assess feasibility and resource requirements',
        'Identify quick wins vs long-term initiatives',
        'Prioritize strategies by impact and feasibility',
        'Save strategies to output directory'
      ],
      outputFormat: 'JSON with strategies (array with quadrant, name, description, swotFactors, feasibility, priority), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quadrant: { type: 'string', enum: ['SO', 'WO', 'ST', 'WT'] },
              name: { type: 'string' },
              description: { type: 'string' },
              swotFactors: { type: 'array', items: { type: 'string' } },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              timeframe: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'tows', 'strategy-options']
}));

// Task 7: Strategic Implications
export const strategicImplicationsTask = defineTask('strategic-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive strategic implications and recommendations',
  agent: {
    name: 'chief-strategy-officer',
    prompt: {
      role: 'chief strategy officer and executive advisor',
      task: 'Synthesize SWOT findings into strategic implications and prioritized recommendations',
      context: args,
      instructions: [
        'Synthesize key findings from SWOT analysis',
        'Identify critical strategic implications:',
        '  - Core strategic posture (offensive/defensive/balanced)',
        '  - Key success factors to leverage',
        '  - Critical vulnerabilities to address',
        '  - Strategic priorities for resource allocation',
        'Develop prioritized action recommendations',
        'Create implementation roadmap outline',
        'Identify key decisions requiring executive attention',
        'Define success metrics and KPIs',
        'Stakeholder communication recommendations',
        'Save implications to output directory'
      ],
      outputFormat: 'JSON with implications (array), prioritizedActions (array), strategicPosture (string), keyDecisions (array), successMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'prioritizedActions', 'artifacts'],
      properties: {
        implications: { type: 'array', items: { type: 'string' } },
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'number' },
              timeframe: { type: 'string' },
              owner: { type: 'string' },
              resources: { type: 'string' }
            }
          }
        },
        strategicPosture: { type: 'string' },
        keyDecisions: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'swot', 'implications', 'recommendations']
}));

// Task 8: SWOT Report Generation
export const swotReportGenerationTask = defineTask('swot-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive SWOT report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategic planning consultant and technical writer',
      task: 'Generate comprehensive, executive-ready SWOT analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Include methodology section',
        'Document all SWOT factors with supporting evidence',
        'Present SWOT matrix visualization',
        'Include TOWS strategic options analysis',
        'Present strategic implications and recommendations',
        'Include prioritized action roadmap',
        'Add appendices with detailed analysis',
        'Format as professional strategic planning document',
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
  labels: ['agent', 'swot', 'reporting', 'documentation']
}));
