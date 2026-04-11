/**
 * @process specializations/game-development/game-balance-economy
 * @description Game Balance and Economy Design Process - Design and tune game economy, progression systems, and balance
 * through systematic modeling, simulation, balance testing, data analytics, and iterative refinement to create
 * fair, engaging, and sustainable game systems.
 * @inputs { gameName: string, economyType?: string, progressionSystems?: array, balanceTargets?: object, outputDir?: string }
 * @outputs { success: boolean, economyModel: object, balanceSpreadsheet: string, simulationResults: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/game-balance-economy', {
 *   gameName: 'Stellar Odyssey',
 *   economyType: 'dual-currency',
 *   progressionSystems: ['character-levels', 'equipment-tiers', 'skill-trees'],
 *   balanceTargets: { sessionLength: '30min', progressionPace: 'medium', difficultyScaling: 'adaptive' }
 * });
 *
 * @references
 * - Game Balance by Ian Schreiber
 * - Machinations: A Diagramming Tool for Game System Design
 * - Game Mechanics: Advanced Game Design by Ernest Adams
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    gameName,
    economyType = 'single-currency',
    progressionSystems = ['levels'],
    balanceTargets = {},
    monetizationModel = 'premium',
    currencies = ['gold'],
    resourceTypes = [],
    playerPowerCurve = 'linear',
    contentDuration = '20 hours',
    outputDir = 'balance-economy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Game Balance and Economy Design: ${gameName}`);
  ctx.log('info', `Economy Type: ${economyType}, Progression Systems: ${progressionSystems.join(', ')}`);

  // ============================================================================
  // PHASE 1: ECONOMY FOUNDATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Economy Foundation and Currency Design');

  const economyFoundation = await ctx.task(economyFoundationTask, {
    gameName,
    economyType,
    currencies,
    monetizationModel,
    resourceTypes,
    outputDir
  });

  artifacts.push(...economyFoundation.artifacts);

  // ============================================================================
  // PHASE 2: PROGRESSION SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Progression Systems and Player Advancement');

  const progressionDesign = await ctx.task(progressionDesignTask, {
    gameName,
    progressionSystems,
    playerPowerCurve,
    contentDuration,
    economyFoundation,
    balanceTargets,
    outputDir
  });

  artifacts.push(...progressionDesign.artifacts);

  // ============================================================================
  // PHASE 3: BALANCE SPREADSHEET CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Balance Spreadsheets and Formulas');

  const balanceSpreadsheets = await ctx.task(balanceSpreadsheetsTask, {
    gameName,
    economyFoundation,
    progressionDesign,
    balanceTargets,
    outputDir
  });

  artifacts.push(...balanceSpreadsheets.artifacts);

  // Quality Gate: Spreadsheet review
  await ctx.breakpoint({
    question: `Balance spreadsheets created for ${gameName}. ${balanceSpreadsheets.sheetsCount} sheets covering ${balanceSpreadsheets.systemsCovered.join(', ')}. Review balance formulas and curves?`,
    title: 'Balance Spreadsheet Review',
    context: {
      runId: ctx.runId,
      gameName,
      sheetsCount: balanceSpreadsheets.sheetsCount,
      systemsCovered: balanceSpreadsheets.systemsCovered,
      keyFormulas: balanceSpreadsheets.keyFormulas,
      files: [{ path: balanceSpreadsheets.spreadsheetPath, format: 'xlsx', label: 'Balance Spreadsheet' }]
    }
  });

  // ============================================================================
  // PHASE 4: ECONOMY SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Economy Simulation and Modeling');

  const economySimulation = await ctx.task(economySimulationTask, {
    gameName,
    economyFoundation,
    progressionDesign,
    balanceSpreadsheets,
    contentDuration,
    outputDir
  });

  artifacts.push(...economySimulation.artifacts);

  // ============================================================================
  // PHASE 5: BALANCE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Balance Testing and Data Collection');

  const balanceTesting = await ctx.task(balanceTestingTask, {
    gameName,
    economyFoundation,
    progressionDesign,
    economySimulation,
    balanceTargets,
    outputDir
  });

  artifacts.push(...balanceTesting.artifacts);

  // ============================================================================
  // PHASE 6: IMBALANCE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Imbalance Identification and Analysis');

  const imbalanceAnalysis = await ctx.task(imbalanceAnalysisTask, {
    gameName,
    economySimulation,
    balanceTesting,
    balanceTargets,
    outputDir
  });

  artifacts.push(...imbalanceAnalysis.artifacts);

  // Quality Gate: Critical imbalances
  if (imbalanceAnalysis.criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `${imbalanceAnalysis.criticalIssues.length} critical balance issues identified in ${gameName}. Issues: ${imbalanceAnalysis.criticalIssues.map(i => i.name).join(', ')}. Review and address before proceeding?`,
      title: 'Critical Balance Issues',
      context: {
        runId: ctx.runId,
        criticalIssues: imbalanceAnalysis.criticalIssues,
        recommendations: imbalanceAnalysis.recommendations,
        files: imbalanceAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: BALANCE ITERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Balance Iteration and Tuning');

  const balanceIteration = await ctx.task(balanceIterationTask, {
    gameName,
    imbalanceAnalysis,
    balanceSpreadsheets,
    economySimulation,
    outputDir
  });

  artifacts.push(...balanceIteration.artifacts);

  // ============================================================================
  // PHASE 8: FINAL BALANCE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Final Balance Documentation');

  const balanceDocumentation = await ctx.task(balanceDocumentationTask, {
    gameName,
    economyFoundation,
    progressionDesign,
    balanceSpreadsheets,
    economySimulation,
    imbalanceAnalysis,
    balanceIteration,
    outputDir
  });

  artifacts.push(...balanceDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Game Balance and Economy Design complete for ${gameName}. Balance health score: ${balanceIteration.healthScore}/100. Ready for implementation?`,
    title: 'Balance Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        gameName,
        economyType,
        currencyCount: currencies.length,
        progressionSystemsCount: progressionSystems.length,
        balanceHealthScore: balanceIteration.healthScore,
        issuesResolved: balanceIteration.issuesResolved,
        remainingConcerns: balanceIteration.remainingConcerns
      },
      files: [
        { path: balanceDocumentation.documentPath, format: 'markdown', label: 'Balance Document' },
        { path: balanceSpreadsheets.spreadsheetPath, format: 'xlsx', label: 'Balance Spreadsheet' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    gameName,
    economyModel: {
      type: economyType,
      currencies: economyFoundation.currencyDetails,
      sinks: economyFoundation.sinks,
      faucets: economyFoundation.faucets,
      balanceRatio: economyFoundation.balanceRatio
    },
    progressionModel: {
      systems: progressionDesign.systemDetails,
      powerCurve: progressionDesign.powerCurve,
      pacing: progressionDesign.pacing
    },
    balanceSpreadsheet: balanceSpreadsheets.spreadsheetPath,
    simulationResults: {
      scenariosRun: economySimulation.scenariosRun,
      inflationRisk: economySimulation.inflationRisk,
      progressionPace: economySimulation.progressionPace,
      bottlenecks: economySimulation.bottlenecks
    },
    balanceHealth: {
      score: balanceIteration.healthScore,
      issuesResolved: balanceIteration.issuesResolved,
      remainingConcerns: balanceIteration.remainingConcerns
    },
    recommendations: balanceIteration.recommendations,
    documentationPath: balanceDocumentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/game-development/game-balance-economy',
      timestamp: startTime,
      gameName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const economyFoundationTask = defineTask('economy-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Economy Foundation - ${args.gameName}`,
  agent: {
    name: 'economy-designer-agent',
    prompt: {
      role: 'Game Economy Designer',
      task: 'Design economy foundation and currency systems',
      context: args,
      instructions: [
        '1. Define all currencies and their purposes',
        '2. Design currency acquisition methods (faucets)',
        '3. Design currency spending methods (sinks)',
        '4. Calculate faucet/sink balance ratios',
        '5. Design resource types and conversion rates',
        '6. Plan inflation prevention mechanisms',
        '7. Design scarcity and abundance cycles',
        '8. Consider monetization impact on economy',
        '9. Create economy flow diagrams',
        '10. Document economy foundation'
      ],
      outputFormat: 'JSON with economy foundation'
    },
    outputSchema: {
      type: 'object',
      required: ['currencyDetails', 'faucets', 'sinks', 'balanceRatio', 'artifacts'],
      properties: {
        currencyDetails: { type: 'array', items: { type: 'object' } },
        faucets: { type: 'array', items: { type: 'object' } },
        sinks: { type: 'array', items: { type: 'object' } },
        balanceRatio: { type: 'number' },
        conversionRates: { type: 'object' },
        inflationPrevention: { type: 'array', items: { type: 'string' } },
        economyFlowPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'economy']
}));

export const progressionDesignTask = defineTask('progression-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Progression Design - ${args.gameName}`,
  agent: {
    name: 'systems-designer-agent',
    prompt: {
      role: 'Systems Designer',
      task: 'Design progression systems and player advancement',
      context: args,
      instructions: [
        '1. Define player power progression curve',
        '2. Design XP/leveling system formulas',
        '3. Create equipment tier progression',
        '4. Design skill tree or ability unlocks',
        '5. Define content gating mechanisms',
        '6. Calculate time-to-max for each system',
        '7. Design milestone rewards and pacing',
        '8. Create catch-up mechanics if needed',
        '9. Balance horizontal vs vertical progression',
        '10. Document progression systems'
      ],
      outputFormat: 'JSON with progression design'
    },
    outputSchema: {
      type: 'object',
      required: ['systemDetails', 'powerCurve', 'pacing', 'artifacts'],
      properties: {
        systemDetails: { type: 'array', items: { type: 'object' } },
        powerCurve: { type: 'object' },
        pacing: { type: 'object' },
        levelingFormula: { type: 'string' },
        tierProgression: { type: 'array', items: { type: 'object' } },
        milestoneRewards: { type: 'array', items: { type: 'object' } },
        timeToMax: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'progression']
}));

export const balanceSpreadsheetsTask = defineTask('balance-spreadsheets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Balance Spreadsheets - ${args.gameName}`,
  agent: {
    name: 'economy-designer-agent',
    prompt: {
      role: 'Game Balance Designer',
      task: 'Create comprehensive balance spreadsheets',
      context: args,
      instructions: [
        '1. Create XP curve spreadsheet with formulas',
        '2. Create item stat scaling spreadsheet',
        '3. Create enemy difficulty scaling sheet',
        '4. Create economy flow calculations',
        '5. Create damage/DPS balance sheets',
        '6. Create resource drop rate tables',
        '7. Add validation formulas for sanity checks',
        '8. Create visualization charts',
        '9. Add tuning parameters as variables',
        '10. Document all formulas and assumptions'
      ],
      outputFormat: 'JSON with spreadsheet details'
    },
    outputSchema: {
      type: 'object',
      required: ['spreadsheetPath', 'sheetsCount', 'systemsCovered', 'keyFormulas', 'artifacts'],
      properties: {
        spreadsheetPath: { type: 'string' },
        sheetsCount: { type: 'number' },
        systemsCovered: { type: 'array', items: { type: 'string' } },
        keyFormulas: { type: 'array', items: { type: 'object' } },
        tuningParameters: { type: 'array', items: { type: 'object' } },
        validationChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'spreadsheets']
}));

export const economySimulationTask = defineTask('economy-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Economy Simulation - ${args.gameName}`,
  agent: {
    name: 'economy-designer-agent',
    prompt: {
      role: 'Economy Simulation Specialist',
      task: 'Run economy simulations and model player behavior',
      context: args,
      instructions: [
        '1. Define player archetypes for simulation',
        '2. Model casual, average, and hardcore play patterns',
        '3. Simulate economy over time (days, weeks, months)',
        '4. Track currency accumulation rates',
        '5. Identify inflation or deflation trends',
        '6. Find bottlenecks in progression',
        '7. Test edge cases and exploits',
        '8. Compare F2P vs paying player progression',
        '9. Generate simulation reports',
        '10. Document simulation methodology'
      ],
      outputFormat: 'JSON with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['scenariosRun', 'inflationRisk', 'progressionPace', 'bottlenecks', 'artifacts'],
      properties: {
        scenariosRun: { type: 'number' },
        playerArchetypes: { type: 'array', items: { type: 'object' } },
        inflationRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
        progressionPace: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        exploitRisks: { type: 'array', items: { type: 'object' } },
        timelineProjections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'simulation']
}));

export const balanceTestingTask = defineTask('balance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Balance Testing - ${args.gameName}`,
  agent: {
    name: 'balance-tester-agent',
    prompt: {
      role: 'Balance QA Analyst',
      task: 'Conduct balance testing and collect data',
      context: args,
      instructions: [
        '1. Test progression pacing across content',
        '2. Verify difficulty curve feels appropriate',
        '3. Test all character builds/options for viability',
        '4. Identify overpowered or underpowered options',
        '5. Measure time-to-completion for content',
        '6. Test economy earn rates vs costs',
        '7. Verify no soft locks or impossible states',
        '8. Test boundary conditions (level 1, max level)',
        '9. Collect quantitative balance metrics',
        '10. Document testing results'
      ],
      outputFormat: 'JSON with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['testsPassed', 'testsFailed', 'metrics', 'artifacts'],
      properties: {
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        metrics: { type: 'object' },
        overpoweredOptions: { type: 'array', items: { type: 'object' } },
        underpoweredOptions: { type: 'array', items: { type: 'object' } },
        pacingIssues: { type: 'array', items: { type: 'object' } },
        economyIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'testing']
}));

export const imbalanceAnalysisTask = defineTask('imbalance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Imbalance Analysis - ${args.gameName}`,
  agent: {
    name: 'balance-tester-agent',
    prompt: {
      role: 'Game Balance Analyst',
      task: 'Identify and categorize balance issues',
      context: args,
      instructions: [
        '1. Analyze simulation and testing data',
        '2. Categorize issues by severity (critical, major, minor)',
        '3. Identify root causes of imbalances',
        '4. Calculate impact of each issue',
        '5. Prioritize issues for resolution',
        '6. Develop fix recommendations',
        '7. Estimate effort for each fix',
        '8. Identify systemic vs localized issues',
        '9. Create imbalance report',
        '10. Document analysis methodology'
      ],
      outputFormat: 'JSON with imbalance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalIssues', 'majorIssues', 'minorIssues', 'recommendations', 'artifacts'],
      properties: {
        criticalIssues: { type: 'array', items: { type: 'object' } },
        majorIssues: { type: 'array', items: { type: 'object' } },
        minorIssues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'string' } },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'analysis']
}));

export const balanceIterationTask = defineTask('balance-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Balance Iteration - ${args.gameName}`,
  agent: {
    name: 'economy-designer-agent',
    prompt: {
      role: 'Lead Balance Designer',
      task: 'Iterate on balance based on analysis',
      context: args,
      instructions: [
        '1. Implement critical issue fixes',
        '2. Adjust tuning parameters in spreadsheets',
        '3. Rerun simulations with changes',
        '4. Verify fixes resolve issues',
        '5. Check for regression or new issues',
        '6. Address major issues',
        '7. Document all changes made',
        '8. Calculate new balance health score',
        '9. Note remaining concerns for future',
        '10. Prepare final recommendations'
      ],
      outputFormat: 'JSON with iteration results'
    },
    outputSchema: {
      type: 'object',
      required: ['healthScore', 'issuesResolved', 'remainingConcerns', 'recommendations', 'artifacts'],
      properties: {
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        issuesResolved: { type: 'array', items: { type: 'string' } },
        changesApplied: { type: 'array', items: { type: 'object' } },
        remainingConcerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'iteration']
}));

export const balanceDocumentationTask = defineTask('balance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Balance Documentation - ${args.gameName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive balance documentation',
      context: args,
      instructions: [
        '1. Document economy model and flow',
        '2. Document progression systems',
        '3. Explain all balance formulas',
        '4. Document tuning parameters',
        '5. Include balance guidelines for designers',
        '6. Document known balance trade-offs',
        '7. Include simulation methodology',
        '8. Create balance maintenance guide',
        '9. Document future balance considerations',
        '10. Create living balance document'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        formulaReference: { type: 'string' },
        tuningGuide: { type: 'string' },
        maintenanceGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'balance', 'documentation']
}));
