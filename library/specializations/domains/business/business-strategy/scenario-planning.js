/**
 * @process business-strategy/scenario-planning
 * @description Development of multiple plausible future scenarios to stress-test strategies and improve organizational adaptability
 * @inputs { strategicQuestion: string, organizationContext: object, timeHorizon: string, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, scenarios: array, strategicOptions: array, robustStrategies: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    strategicQuestion = '',
    organizationContext = {},
    timeHorizon = '5-10 years',
    stakeholders = [],
    outputDir = 'scenario-planning-output',
    numberOfScenarios = 4
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Scenario Planning Process');

  // ============================================================================
  // PHASE 1: FOCAL QUESTION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining focal question');
  const focalQuestion = await ctx.task(focalQuestionTask, {
    strategicQuestion,
    organizationContext,
    timeHorizon,
    stakeholders,
    outputDir
  });

  artifacts.push(...focalQuestion.artifacts);

  // ============================================================================
  // PHASE 2: DRIVING FORCES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying driving forces');
  const drivingForces = await ctx.task(drivingForcesTask, {
    focalQuestion: focalQuestion.refinedQuestion,
    organizationContext,
    timeHorizon,
    outputDir
  });

  artifacts.push(...drivingForces.artifacts);

  // ============================================================================
  // PHASE 3: CRITICAL UNCERTAINTIES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing critical uncertainties');
  const criticalUncertainties = await ctx.task(criticalUncertaintiesTask, {
    drivingForces: drivingForces.forces,
    focalQuestion: focalQuestion.refinedQuestion,
    outputDir
  });

  artifacts.push(...criticalUncertainties.artifacts);

  // ============================================================================
  // PHASE 4: SCENARIO FRAMEWORK CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing scenario framework');
  const scenarioFramework = await ctx.task(scenarioFrameworkTask, {
    criticalUncertainties: criticalUncertainties.uncertainties,
    numberOfScenarios,
    outputDir
  });

  artifacts.push(...scenarioFramework.artifacts);

  // ============================================================================
  // PHASE 5: SCENARIO NARRATIVE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing scenario narratives');
  const scenarioNarratives = await ctx.task(scenarioNarrativesTask, {
    scenarioFramework: scenarioFramework.framework,
    drivingForces: drivingForces.forces,
    focalQuestion: focalQuestion.refinedQuestion,
    timeHorizon,
    outputDir
  });

  artifacts.push(...scenarioNarratives.artifacts);

  // Breakpoint: Review scenarios
  await ctx.breakpoint({
    question: `Scenario narratives complete. Developed ${scenarioNarratives.scenarios.length} distinct scenarios. Review scenario details?`,
    title: 'Scenario Planning Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        focalQuestion: focalQuestion.refinedQuestion,
        scenarioCount: scenarioNarratives.scenarios.length,
        criticalUncertainties: criticalUncertainties.uncertainties.length,
        drivingForces: drivingForces.forces.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: SCENARIO IMPLICATIONS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing scenario implications');
  const scenarioImplications = await ctx.task(scenarioImplicationsTask, {
    scenarios: scenarioNarratives.scenarios,
    organizationContext,
    outputDir
  });

  artifacts.push(...scenarioImplications.artifacts);

  // ============================================================================
  // PHASE 7: STRATEGIC OPTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing strategic options');
  const strategicOptions = await ctx.task(strategicOptionsTask, {
    scenarios: scenarioNarratives.scenarios,
    implications: scenarioImplications.implications,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicOptions.artifacts);

  // ============================================================================
  // PHASE 8: ROBUST STRATEGY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying robust strategies');
  const robustStrategies = await ctx.task(robustStrategiesTask, {
    scenarios: scenarioNarratives.scenarios,
    strategicOptions: strategicOptions.options,
    outputDir
  });

  artifacts.push(...robustStrategies.artifacts);

  // ============================================================================
  // PHASE 9: EARLY WARNING INDICATORS
  // ============================================================================

  ctx.log('info', 'Phase 9: Defining early warning indicators');
  const earlyWarningIndicators = await ctx.task(earlyWarningIndicatorsTask, {
    scenarios: scenarioNarratives.scenarios,
    criticalUncertainties: criticalUncertainties.uncertainties,
    outputDir
  });

  artifacts.push(...earlyWarningIndicators.artifacts);

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive report');
  const scenarioReport = await ctx.task(scenarioReportTask, {
    focalQuestion,
    drivingForces,
    criticalUncertainties,
    scenarioFramework,
    scenarioNarratives,
    scenarioImplications,
    strategicOptions,
    robustStrategies,
    earlyWarningIndicators,
    outputDir
  });

  artifacts.push(...scenarioReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    focalQuestion: focalQuestion.refinedQuestion,
    scenarios: scenarioNarratives.scenarios,
    strategicOptions: strategicOptions.options,
    robustStrategies: robustStrategies.strategies,
    earlyWarningIndicators: earlyWarningIndicators.indicators,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/scenario-planning',
      timestamp: startTime,
      timeHorizon,
      numberOfScenarios
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Focal Question Definition
export const focalQuestionTask = defineTask('focal-question', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define focal question',
  agent: {
    name: 'strategy-facilitator',
    prompt: {
      role: 'strategic foresight facilitator',
      task: 'Define and refine the focal question for scenario planning',
      context: args,
      instructions: [
        'Review the strategic question and context',
        'Ensure question is:',
        '  - Specific enough to be actionable',
        '  - Broad enough to allow multiple futures',
        '  - Relevant to organizational decisions',
        '  - Appropriate for the time horizon',
        'Refine question phrasing for clarity',
        'Identify key stakeholder perspectives',
        'Define scope and boundaries',
        'Save focal question to output directory'
      ],
      outputFormat: 'JSON with refinedQuestion (string), scope (object), stakeholderPerspectives (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedQuestion', 'artifacts'],
      properties: {
        refinedQuestion: { type: 'string' },
        scope: {
          type: 'object',
          properties: {
            geographic: { type: 'string' },
            temporal: { type: 'string' },
            industry: { type: 'string' }
          }
        },
        stakeholderPerspectives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'focal-question']
}));

// Task 2: Driving Forces Identification
export const drivingForcesTask = defineTask('driving-forces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify driving forces',
  agent: {
    name: 'futurist',
    prompt: {
      role: 'futurist and trend analyst',
      task: 'Identify key driving forces shaping the future',
      context: args,
      instructions: [
        'Identify driving forces across categories:',
        '  - Social and demographic forces',
        '  - Technological forces',
        '  - Economic forces',
        '  - Environmental forces',
        '  - Political and regulatory forces',
        '  - Industry-specific forces',
        'Assess each force for:',
        '  - Impact on focal question (high/medium/low)',
        '  - Uncertainty level (high/medium/low)',
        '  - Speed of change',
        'Identify predetermined elements (high certainty)',
        'Identify key uncertainties (high impact + high uncertainty)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with forces (array of objects), predeterminedElements (array), keyUncertainties (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forces', 'artifacts'],
      properties: {
        forces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              uncertainty: { type: 'string', enum: ['high', 'medium', 'low'] },
              speed: { type: 'string' }
            }
          }
        },
        predeterminedElements: { type: 'array', items: { type: 'string' } },
        keyUncertainties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'driving-forces', 'trends']
}));

// Task 3: Critical Uncertainties Analysis
export const criticalUncertaintiesTask = defineTask('critical-uncertainties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze critical uncertainties',
  agent: {
    name: 'uncertainty-analyst',
    prompt: {
      role: 'strategic uncertainty analyst',
      task: 'Identify and analyze critical uncertainties for scenario axes',
      context: args,
      instructions: [
        'Filter driving forces by high impact AND high uncertainty',
        'Rank uncertainties by strategic importance',
        'Identify top 2-3 critical uncertainties',
        'Define polar outcomes for each uncertainty',
        'Assess independence of uncertainties',
        'Select 2 uncertainties for scenario matrix axes',
        'Ensure axes are:',
        '  - Highly impactful on focal question',
        '  - Genuinely uncertain',
        '  - Independent of each other',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with uncertainties (array of objects with name, description, polarOutcomes), selectedAxes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertainties', 'selectedAxes', 'artifacts'],
      properties: {
        uncertainties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              polarOutcomes: {
                type: 'object',
                properties: {
                  positive: { type: 'string' },
                  negative: { type: 'string' }
                }
              },
              importance: { type: 'number' }
            }
          }
        },
        selectedAxes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pole1: { type: 'string' },
              pole2: { type: 'string' }
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
  labels: ['agent', 'scenario-planning', 'uncertainties']
}));

// Task 4: Scenario Framework Construction
export const scenarioFrameworkTask = defineTask('scenario-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct scenario framework',
  agent: {
    name: 'scenario-architect',
    prompt: {
      role: 'scenario planning architect',
      task: 'Construct the scenario matrix framework',
      context: args,
      instructions: [
        'Use selected uncertainty axes to create 2x2 matrix',
        'Define 4 quadrants (scenarios)',
        'Name each scenario evocatively',
        'Ensure scenarios are:',
        '  - Plausible (could realistically happen)',
        '  - Challenging (test current assumptions)',
        '  - Distinct (clearly different from each other)',
        '  - Consistent (internally coherent)',
        'Position predetermined elements in all scenarios',
        'Create scenario skeleton structure',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with framework (object with axes and quadrants), scenarioSkeletons (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'scenarioSkeletons', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            axis1: { type: 'object' },
            axis2: { type: 'object' },
            quadrants: { type: 'array' }
          }
        },
        scenarioSkeletons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quadrant: { type: 'string' },
              axisPositions: { type: 'object' }
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
  labels: ['agent', 'scenario-planning', 'framework']
}));

// Task 5: Scenario Narratives Development
export const scenarioNarrativesTask = defineTask('scenario-narratives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scenario narratives',
  agent: {
    name: 'scenario-writer',
    prompt: {
      role: 'scenario writer and storyteller',
      task: 'Develop rich, detailed narratives for each scenario',
      context: args,
      instructions: [
        'For each scenario, develop:',
        '  - Compelling scenario name',
        '  - Detailed narrative (2-3 pages)',
        '  - Timeline of key events',
        '  - Description of world state',
        '  - Key characteristics and drivers',
        '  - Winners and losers',
        'Include predetermined elements consistently',
        'Make scenarios vivid and memorable',
        'Ensure internal consistency',
        'Avoid best/worst case labeling',
        'Save narratives to output directory'
      ],
      outputFormat: 'JSON with scenarios (array of objects with name, narrative, timeline, characteristics, winners, losers), artifacts'
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
              name: { type: 'string' },
              narrative: { type: 'string' },
              timeline: { type: 'array', items: { type: 'object' } },
              characteristics: { type: 'array', items: { type: 'string' } },
              winners: { type: 'array', items: { type: 'string' } },
              losers: { type: 'array', items: { type: 'string' } },
              probability: { type: 'string' }
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
  labels: ['agent', 'scenario-planning', 'narratives']
}));

// Task 6: Scenario Implications Analysis
export const scenarioImplicationsTask = defineTask('scenario-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze scenario implications',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'strategic analyst',
      task: 'Analyze implications of each scenario for the organization',
      context: args,
      instructions: [
        'For each scenario, analyze:',
        '  - Market implications',
        '  - Competitive dynamics',
        '  - Customer needs and behaviors',
        '  - Required capabilities',
        '  - Resource implications',
        '  - Risk exposure',
        '  - Opportunity landscape',
        'Identify cross-scenario themes',
        'Assess organizational preparedness',
        'Save implications to output directory'
      ],
      outputFormat: 'JSON with implications (array of objects by scenario), crossScenarioThemes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              marketImplications: { type: 'array', items: { type: 'string' } },
              competitiveImplications: { type: 'array', items: { type: 'string' } },
              capabilityRequirements: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        crossScenarioThemes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'implications']
}));

// Task 7: Strategic Options Development
export const strategicOptionsTask = defineTask('strategic-options', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic options',
  agent: {
    name: 'strategy-consultant',
    prompt: {
      role: 'senior strategy consultant',
      task: 'Develop strategic options for each scenario',
      context: args,
      instructions: [
        'For each scenario, develop:',
        '  - Optimal strategic response',
        '  - Required investments and resources',
        '  - Timeline and milestones',
        '  - Key success factors',
        'Categorize options:',
        '  - Scenario-specific options',
        '  - Cross-scenario options (work in multiple scenarios)',
        '  - Hedging options (reduce downside)',
        '  - Shaping options (influence outcomes)',
        'Save options to output directory'
      ],
      outputFormat: 'JSON with options (array of objects), optionCategories (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'artifacts'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              applicableScenarios: { type: 'array', items: { type: 'string' } },
              category: { type: 'string', enum: ['scenario-specific', 'cross-scenario', 'hedging', 'shaping'] },
              investment: { type: 'string' },
              timeline: { type: 'string' },
              successFactors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        optionCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'strategic-options']
}));

// Task 8: Robust Strategies Identification
export const robustStrategiesTask = defineTask('robust-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify robust strategies',
  agent: {
    name: 'strategy-synthesizer',
    prompt: {
      role: 'strategy synthesis expert',
      task: 'Identify strategies that are robust across multiple scenarios',
      context: args,
      instructions: [
        'Evaluate strategic options across all scenarios',
        'Identify robust strategies:',
        '  - Perform well in most/all scenarios',
        '  - Low regret if wrong scenario materializes',
        '  - Maintain strategic flexibility',
        'Create strategy robustness matrix',
        'Recommend core robust strategy',
        'Identify contingent strategies (scenario-triggered)',
        'Define strategy portfolio approach',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with strategies (array), robustnessMatrix (object), coreStrategy (object), contingentStrategies (array), artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              robustnessScore: { type: 'number' },
              scenarioPerformance: { type: 'object' }
            }
          }
        },
        robustnessMatrix: { type: 'object' },
        coreStrategy: { type: 'object' },
        contingentStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'robust-strategies']
}));

// Task 9: Early Warning Indicators
export const earlyWarningIndicatorsTask = defineTask('early-warning-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define early warning indicators',
  agent: {
    name: 'monitoring-analyst',
    prompt: {
      role: 'strategic monitoring analyst',
      task: 'Define early warning indicators for scenario monitoring',
      context: args,
      instructions: [
        'For each scenario, identify:',
        '  - Leading indicators that signal scenario emergence',
        '  - Data sources and measurement methods',
        '  - Trigger thresholds for action',
        'Define monitoring framework:',
        '  - Indicator tracking frequency',
        '  - Responsible parties',
        '  - Escalation procedures',
        'Create scenario dashboard design',
        'Save indicators to output directory'
      ],
      outputFormat: 'JSON with indicators (array of objects), monitoringFramework (object), dashboardDesign (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'artifacts'],
      properties: {
        indicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              targetScenario: { type: 'string' },
              dataSource: { type: 'string' },
              threshold: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        monitoringFramework: { type: 'object' },
        dashboardDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scenario-planning', 'monitoring', 'indicators']
}));

// Task 10: Scenario Planning Report
export const scenarioReportTask = defineTask('scenario-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive scenario planning report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategic foresight consultant and technical writer',
      task: 'Generate comprehensive scenario planning report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document methodology and process',
        'Present focal question and scope',
        'Document driving forces analysis',
        'Present scenario framework and matrix',
        'Include full scenario narratives',
        'Present strategic implications',
        'Document strategic options and robust strategies',
        'Include monitoring framework',
        'Add appendices and references',
        'Format as professional foresight document',
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
  labels: ['agent', 'scenario-planning', 'reporting', 'documentation']
}));
