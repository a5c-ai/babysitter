/**
 * @process specializations/domains/business/decision-intelligence/strategic-scenario-development
 * @description Strategic Scenario Development - Creation of multiple plausible future scenarios using
 * driving forces analysis, uncertainty mapping, and narrative development techniques.
 * @inputs { projectName: string, strategicContext: object, timeHorizon: string, stakeholders: array, focusAreas?: array }
 * @outputs { success: boolean, scenarioSet: array, drivingForces: object, uncertaintyMap: object, strategicOptions: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/strategic-scenario-development', {
 *   projectName: 'Energy Transition Scenarios 2035',
 *   strategicContext: { industry: 'Energy', scope: 'Global' },
 *   timeHorizon: '10 years',
 *   stakeholders: ['Strategy Team', 'Board', 'Business Units']
 * });
 *
 * @references
 * - BCG Henderson Institute: https://www.bcg.com/henderson-institute
 * - Shell Scenario Planning: Pioneering scenario methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    strategicContext = {},
    timeHorizon = '5 years',
    stakeholders = [],
    focusAreas = [],
    outputDir = 'scenario-output'
  } = inputs;

  // Phase 1: Driving Forces Identification
  const drivingForces = await ctx.task(drivingForcesTask, {
    projectName,
    strategicContext,
    timeHorizon,
    focusAreas
  });

  // Phase 2: Uncertainty Assessment
  const uncertaintyAssessment = await ctx.task(uncertaintyAssessmentTask, {
    projectName,
    drivingForces,
    timeHorizon
  });

  // Phase 3: Scenario Framework Development
  const scenarioFramework = await ctx.task(scenarioFrameworkTask, {
    projectName,
    drivingForces,
    uncertaintyAssessment
  });

  // Phase 4: Scenario Narrative Development
  const scenarioNarratives = await ctx.task(scenarioNarrativesTask, {
    projectName,
    scenarioFramework,
    drivingForces,
    timeHorizon
  });

  // Breakpoint: Review scenario narratives
  await ctx.breakpoint({
    question: `Review scenario narratives for ${projectName}. Are they plausible and distinct?`,
    title: 'Scenario Narrative Review',
    context: {
      runId: ctx.runId,
      projectName,
      scenarioCount: scenarioNarratives.scenarios?.length || 0
    }
  });

  // Phase 5: Scenario Quantification
  const scenarioQuantification = await ctx.task(scenarioQuantificationTask, {
    projectName,
    scenarioNarratives,
    drivingForces
  });

  // Phase 6: Strategic Implications Analysis
  const strategicImplications = await ctx.task(scenarioImplicationsTask, {
    projectName,
    scenarioNarratives,
    scenarioQuantification,
    strategicContext
  });

  // Phase 7: Strategic Options Development
  const strategicOptions = await ctx.task(strategicOptionsTask, {
    projectName,
    scenarioNarratives,
    strategicImplications
  });

  // Phase 8: Monitoring and Early Warning
  const monitoringSystem = await ctx.task(scenarioMonitoringTask, {
    projectName,
    scenarioNarratives,
    drivingForces
  });

  return {
    success: true,
    projectName,
    drivingForces,
    uncertaintyMap: uncertaintyAssessment,
    scenarioFramework,
    scenarioSet: scenarioNarratives.scenarios,
    scenarioQuantification,
    strategicImplications,
    strategicOptions,
    monitoringSystem,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/strategic-scenario-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const drivingForcesTask = defineTask('driving-forces', (args, taskCtx) => ({
  kind: 'agent',
  title: `Driving Forces Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Foresight Analyst',
      task: 'Identify and analyze driving forces shaping the future',
      context: args,
      instructions: [
        '1. Identify STEEP factors (Social, Technological, Economic, Environmental, Political)',
        '2. Analyze industry-specific drivers',
        '3. Identify trends vs uncertainties',
        '4. Assess driver impact magnitude',
        '5. Evaluate driver interdependencies',
        '6. Identify wild cards and weak signals',
        '7. Prioritize driving forces',
        '8. Document driver evidence and sources'
      ],
      outputFormat: 'JSON object with driving forces analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['forces', 'trends', 'uncertainties'],
      properties: {
        forces: { type: 'array' },
        trends: { type: 'array' },
        uncertainties: { type: 'array' },
        wildCards: { type: 'array' },
        interdependencies: { type: 'object' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'driving-forces']
}));

export const uncertaintyAssessmentTask = defineTask('uncertainty-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Uncertainty Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Uncertainty Analysis Expert',
      task: 'Assess and map critical uncertainties',
      context: args,
      instructions: [
        '1. Evaluate uncertainty of each driving force',
        '2. Assess impact of each uncertainty',
        '3. Create uncertainty-impact matrix',
        '4. Identify critical uncertainties',
        '5. Analyze uncertainty correlations',
        '6. Assess resolution timelines',
        '7. Identify uncertainty clusters',
        '8. Select scenario-defining uncertainties'
      ],
      outputFormat: 'JSON object with uncertainty assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertainties', 'matrix', 'critical'],
      properties: {
        uncertainties: { type: 'array' },
        impactAssessment: { type: 'object' },
        matrix: { type: 'object' },
        critical: { type: 'array' },
        correlations: { type: 'object' },
        clusters: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'uncertainty']
}));

export const scenarioFrameworkTask = defineTask('scenario-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Framework Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Framework Designer',
      task: 'Develop scenario framework and axes',
      context: args,
      instructions: [
        '1. Select scenario axes from critical uncertainties',
        '2. Define axis endpoints',
        '3. Create 2x2 scenario matrix',
        '4. Name scenario quadrants',
        '5. Validate scenario distinctiveness',
        '6. Test for internal consistency',
        '7. Ensure scenario coverage',
        '8. Document framework rationale'
      ],
      outputFormat: 'JSON object with scenario framework'
    },
    outputSchema: {
      type: 'object',
      required: ['axes', 'matrix', 'quadrants'],
      properties: {
        axes: { type: 'array' },
        endpoints: { type: 'object' },
        matrix: { type: 'object' },
        quadrants: { type: 'array' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'framework']
}));

export const scenarioNarrativesTask = defineTask('scenario-narratives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Narrative Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Storyteller',
      task: 'Develop detailed scenario narratives',
      context: args,
      instructions: [
        '1. Develop compelling scenario names',
        '2. Write scenario narratives with storyline',
        '3. Describe world conditions in each scenario',
        '4. Detail driving force behaviors',
        '5. Describe industry dynamics',
        '6. Outline customer/market evolution',
        '7. Identify key events and milestones',
        '8. Make scenarios vivid and memorable'
      ],
      outputFormat: 'JSON object with scenario narratives'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'narratives', 'characteristics'],
      properties: {
        scenarios: { type: 'array' },
        narratives: { type: 'object' },
        worldConditions: { type: 'object' },
        characteristics: { type: 'object' },
        milestones: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'narratives']
}));

export const scenarioQuantificationTask = defineTask('scenario-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Quantification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Quantification Analyst',
      task: 'Quantify key variables across scenarios',
      context: args,
      instructions: [
        '1. Identify key variables to quantify',
        '2. Estimate variable ranges per scenario',
        '3. Develop growth trajectories',
        '4. Model market sizes per scenario',
        '5. Estimate competitive dynamics',
        '6. Project financial implications',
        '7. Create scenario data tables',
        '8. Validate quantification consistency'
      ],
      outputFormat: 'JSON object with scenario quantification'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'estimates', 'projections'],
      properties: {
        variables: { type: 'array' },
        estimates: { type: 'object' },
        trajectories: { type: 'object' },
        projections: { type: 'object' },
        dataTables: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'quantification']
}));

export const scenarioImplicationsTask = defineTask('scenario-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Implications Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Implications Analyst',
      task: 'Analyze strategic implications of each scenario',
      context: args,
      instructions: [
        '1. Assess business model viability per scenario',
        '2. Evaluate competitive position changes',
        '3. Identify capability requirements',
        '4. Assess resource implications',
        '5. Identify risks per scenario',
        '6. Spot opportunities per scenario',
        '7. Evaluate strategic fit',
        '8. Identify no-regret moves'
      ],
      outputFormat: 'JSON object with strategic implications'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'risks', 'opportunities'],
      properties: {
        implications: { type: 'object' },
        businessModel: { type: 'object' },
        capabilities: { type: 'object' },
        risks: { type: 'object' },
        opportunities: { type: 'object' },
        noRegretMoves: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'implications']
}));

export const strategicOptionsTask = defineTask('strategic-options', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Options Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Options Designer',
      task: 'Develop strategic options robust across scenarios',
      context: args,
      instructions: [
        '1. Identify robust strategies across scenarios',
        '2. Design flexible strategic options',
        '3. Create scenario-specific strategies',
        '4. Develop contingent moves',
        '5. Identify hedging strategies',
        '6. Design option value strategies',
        '7. Create strategy portfolios',
        '8. Define trigger points for options'
      ],
      outputFormat: 'JSON object with strategic options'
    },
    outputSchema: {
      type: 'object',
      required: ['robustStrategies', 'options', 'contingentMoves'],
      properties: {
        robustStrategies: { type: 'array' },
        flexibleOptions: { type: 'array' },
        scenarioSpecific: { type: 'object' },
        contingentMoves: { type: 'array' },
        options: { type: 'array' },
        triggers: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'options']
}));

export const scenarioMonitoringTask = defineTask('scenario-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring and Early Warning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Monitoring Specialist',
      task: 'Design scenario monitoring and early warning system',
      context: args,
      instructions: [
        '1. Identify leading indicators per scenario',
        '2. Define trigger points and thresholds',
        '3. Design monitoring dashboard',
        '4. Create alert mechanisms',
        '5. Plan periodic scenario reviews',
        '6. Design scenario update process',
        '7. Create response protocols',
        '8. Define governance for monitoring'
      ],
      outputFormat: 'JSON object with monitoring system'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'triggers', 'dashboard'],
      properties: {
        indicators: { type: 'array' },
        triggers: { type: 'object' },
        dashboard: { type: 'object' },
        alerts: { type: 'object' },
        reviews: { type: 'object' },
        protocols: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'scenarios', 'monitoring']
}));
