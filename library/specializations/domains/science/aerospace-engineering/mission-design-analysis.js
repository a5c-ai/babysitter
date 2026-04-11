/**
 * @process specializations/domains/science/aerospace-engineering/mission-design-analysis
 * @description Complete space mission design process including trajectory optimization, delta-V budgeting,
 * launch window analysis, and mission timeline development.
 * @inputs { projectName: string, missionObjectives: object, targetBody?: string, constraints?: object }
 * @outputs { success: boolean, trajectoryDesign: object, deltaVBudget: object, missionTimeline: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/mission-design-analysis', {
 *   projectName: 'Mars Sample Return',
 *   missionObjectives: { type: 'sample-return', target: 'Mars' },
 *   targetBody: 'Mars',
 *   constraints: { launchYear: [2026, 2028], maxDuration: 1000 }
 * });
 *
 * @references
 * - NASA Mission Design Guidelines
 * - GMAT (General Mission Analysis Tool)
 * - STK (Systems Tool Kit) Documentation
 * - Fundamentals of Astrodynamics (Bate, Mueller, White)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    missionObjectives,
    targetBody = 'Earth-orbit',
    constraints = {}
  } = inputs;

  // Phase 1: Mission Requirements Definition
  const missionRequirements = await ctx.task(missionRequirementsTask, {
    projectName,
    missionObjectives,
    targetBody,
    constraints
  });

  // Phase 2: Launch Window Analysis
  const launchWindowAnalysis = await ctx.task(launchWindowTask, {
    projectName,
    targetBody,
    requirements: missionRequirements,
    constraints
  });

  // Breakpoint: Launch window review
  await ctx.breakpoint({
    question: `Launch window analysis complete for ${projectName}. ${launchWindowAnalysis.windows.length} windows identified. Select primary window?`,
    title: 'Launch Window Review',
    context: {
      runId: ctx.runId,
      launchWindows: launchWindowAnalysis.windows
    }
  });

  // Phase 3: Trajectory Design
  const trajectoryDesign = await ctx.task(trajectoryDesignTask, {
    projectName,
    launchWindow: launchWindowAnalysis.selectedWindow,
    targetBody,
    requirements: missionRequirements
  });

  // Phase 4: Delta-V Budget
  const deltaVBudget = await ctx.task(deltaVBudgetTask, {
    projectName,
    trajectory: trajectoryDesign,
    requirements: missionRequirements
  });

  // Quality Gate: Delta-V margin
  if (deltaVBudget.margin < 0.1) {
    await ctx.breakpoint({
      question: `Delta-V margin ${(deltaVBudget.margin * 100).toFixed(1)}% below 10% target. Review trajectory or accept?`,
      title: 'Delta-V Margin Warning',
      context: {
        runId: ctx.runId,
        deltaVBudget
      }
    });
  }

  // Phase 5: Orbit Design (if applicable)
  const orbitDesign = targetBody !== 'Earth-orbit' ? await ctx.task(orbitDesignTask, {
    projectName,
    targetBody,
    missionObjectives,
    requirements: missionRequirements
  }) : null;

  // Phase 6: Navigation and Guidance
  const navigationDesign = await ctx.task(navigationDesignTask, {
    projectName,
    trajectory: trajectoryDesign,
    orbitDesign,
    requirements: missionRequirements
  });

  // Phase 7: Operations Timeline
  const operationsTimeline = await ctx.task(operationsTimelineTask, {
    projectName,
    trajectory: trajectoryDesign,
    orbitDesign,
    missionObjectives
  });

  // Phase 8: Monte Carlo Analysis
  const monteCarloAnalysis = await ctx.task(monteCarloAnalysisTask, {
    projectName,
    trajectory: trajectoryDesign,
    navigation: navigationDesign,
    uncertainties: missionRequirements.uncertainties
  });

  // Phase 9: Mission Documentation
  const missionDocumentation = await ctx.task(missionDocumentationTask, {
    projectName,
    missionRequirements,
    launchWindowAnalysis,
    trajectoryDesign,
    deltaVBudget,
    orbitDesign,
    navigationDesign,
    operationsTimeline,
    monteCarloAnalysis
  });

  // Final Breakpoint: Mission Design Approval
  await ctx.breakpoint({
    question: `Mission design complete for ${projectName}. Total delta-V: ${deltaVBudget.total} km/s. Approve baseline?`,
    title: 'Mission Design Approval',
    context: {
      runId: ctx.runId,
      summary: {
        totalDeltaV: deltaVBudget.total,
        missionDuration: trajectoryDesign.totalDuration,
        launchDate: trajectoryDesign.launchDate,
        arrivalDate: trajectoryDesign.arrivalDate
      },
      files: [
        { path: 'artifacts/mission-design.json', format: 'json', content: missionDocumentation },
        { path: 'artifacts/mission-design.md', format: 'markdown', content: missionDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    trajectoryDesign: trajectoryDesign,
    deltaVBudget: deltaVBudget,
    missionTimeline: operationsTimeline,
    navigation: navigationDesign,
    monteCarlo: monteCarloAnalysis,
    documentation: missionDocumentation,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/mission-design-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const missionRequirementsTask = defineTask('mission-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mission Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mission Design Engineer',
      task: 'Define mission requirements and constraints',
      context: args,
      instructions: [
        '1. Define mission objectives and success criteria',
        '2. Identify target body and orbital requirements',
        '3. Define launch vehicle constraints',
        '4. Establish timeline constraints',
        '5. Define payload requirements',
        '6. Identify communication requirements',
        '7. Define power requirements',
        '8. Establish thermal constraints',
        '9. Define navigation accuracy requirements',
        '10. Document mission requirements'
      ],
      outputFormat: 'JSON object with mission requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'constraints'],
      properties: {
        objectives: { type: 'object' },
        constraints: { type: 'object' },
        launchVehicle: { type: 'object' },
        payload: { type: 'object' },
        uncertainties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'requirements', 'aerospace']
}));

export const launchWindowTask = defineTask('launch-window', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch Window Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Astrodynamics Engineer',
      task: 'Analyze launch windows',
      context: args,
      instructions: [
        '1. Calculate planetary ephemerides',
        '2. Identify synodic periods',
        '3. Compute porkchop plots',
        '4. Identify optimal launch dates',
        '5. Calculate C3 requirements',
        '6. Evaluate arrival conditions',
        '7. Assess launch vehicle capability',
        '8. Identify backup windows',
        '9. Document window characteristics',
        '10. Recommend primary window'
      ],
      outputFormat: 'JSON object with launch window analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['windows', 'selectedWindow'],
      properties: {
        windows: { type: 'array', items: { type: 'object' } },
        selectedWindow: { type: 'object' },
        porkchopData: { type: 'object' },
        c3Requirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'launch-window', 'aerospace']
}));

export const trajectoryDesignTask = defineTask('trajectory-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trajectory Design Engineer',
      task: 'Design interplanetary or orbital trajectory',
      context: args,
      instructions: [
        '1. Design departure hyperbola',
        '2. Optimize heliocentric transfer',
        '3. Design arrival trajectory',
        '4. Include gravity assists if applicable',
        '5. Optimize for minimum delta-V',
        '6. Design orbit insertion',
        '7. Include trajectory correction maneuvers',
        '8. Generate state vectors',
        '9. Validate against constraints',
        '10. Document trajectory design'
      ],
      outputFormat: 'JSON object with trajectory design'
    },
    outputSchema: {
      type: 'object',
      required: ['launchDate', 'arrivalDate', 'totalDuration'],
      properties: {
        launchDate: { type: 'string' },
        arrivalDate: { type: 'string' },
        totalDuration: { type: 'number' },
        phases: { type: 'array', items: { type: 'object' } },
        stateVectors: { type: 'object' },
        maneuvers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'trajectory', 'aerospace']
}));

export const deltaVBudgetTask = defineTask('delta-v-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delta-V Budget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Propulsion Budget Engineer',
      task: 'Develop delta-V budget',
      context: args,
      instructions: [
        '1. Calculate launch delta-V',
        '2. Calculate cruise maneuvers',
        '3. Calculate orbit insertion',
        '4. Calculate orbit maintenance',
        '5. Include navigation corrections',
        '6. Add disposal delta-V',
        '7. Calculate total deterministic',
        '8. Add statistical margin',
        '9. Verify propellant capacity',
        '10. Document delta-V budget'
      ],
      outputFormat: 'JSON object with delta-V budget'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'margin', 'breakdown'],
      properties: {
        total: { type: 'number' },
        margin: { type: 'number' },
        breakdown: { type: 'object' },
        propellantRequired: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'delta-v', 'aerospace']
}));

export const orbitDesignTask = defineTask('orbit-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Orbit Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Orbit Design Engineer',
      task: 'Design science or operational orbit',
      context: args,
      instructions: [
        '1. Define orbit requirements',
        '2. Design orbit geometry',
        '3. Optimize for science objectives',
        '4. Analyze orbit stability',
        '5. Calculate station-keeping',
        '6. Design orbit maintenance',
        '7. Analyze eclipse conditions',
        '8. Calculate communication windows',
        '9. Design end-of-life disposal',
        '10. Document orbit design'
      ],
      outputFormat: 'JSON object with orbit design'
    },
    outputSchema: {
      type: 'object',
      required: ['elements', 'characteristics'],
      properties: {
        elements: { type: 'object' },
        characteristics: { type: 'object' },
        stationKeeping: { type: 'object' },
        eclipses: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'orbit-design', 'aerospace']
}));

export const navigationDesignTask = defineTask('navigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Navigation Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Spacecraft Navigation Engineer',
      task: 'Design navigation strategy',
      context: args,
      instructions: [
        '1. Define tracking requirements',
        '2. Design ground tracking strategy',
        '3. Design onboard navigation',
        '4. Calculate navigation accuracy',
        '5. Design TCM strategy',
        '6. Calculate maneuver statistics',
        '7. Design autonomous navigation',
        '8. Calculate DSN requirements',
        '9. Document navigation design',
        '10. Validate navigation accuracy'
      ],
      outputFormat: 'JSON object with navigation design'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracy', 'strategy'],
      properties: {
        accuracy: { type: 'object' },
        strategy: { type: 'object' },
        tcmStrategy: { type: 'object' },
        dsnRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'navigation', 'aerospace']
}));

export const operationsTimelineTask = defineTask('operations-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operations Timeline - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mission Operations Planner',
      task: 'Develop mission operations timeline',
      context: args,
      instructions: [
        '1. Define mission phases',
        '2. Create launch sequence',
        '3. Define cruise activities',
        '4. Plan approach operations',
        '5. Design science operations',
        '6. Plan data downlink',
        '7. Create contingency timelines',
        '8. Define critical events',
        '9. Create operational constraints',
        '10. Document operations timeline'
      ],
      outputFormat: 'JSON object with operations timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'criticalEvents'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        criticalEvents: { type: 'array', items: { type: 'object' } },
        scienceOperations: { type: 'object' },
        contingencies: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'operations', 'aerospace']
}));

export const monteCarloAnalysisTask = defineTask('monte-carlo-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monte Carlo Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Trajectory Analyst',
      task: 'Perform Monte Carlo trajectory analysis',
      context: args,
      instructions: [
        '1. Define uncertainty models',
        '2. Generate dispersed trajectories',
        '3. Analyze arrival dispersions',
        '4. Calculate probability of success',
        '5. Identify sensitivity parameters',
        '6. Analyze delta-V statistics',
        '7. Evaluate mission margins',
        '8. Identify design drivers',
        '9. Recommend margin allocations',
        '10. Document Monte Carlo results'
      ],
      outputFormat: 'JSON object with Monte Carlo analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['probabilityOfSuccess', 'dispersions'],
      properties: {
        probabilityOfSuccess: { type: 'number' },
        dispersions: { type: 'object' },
        sensitivities: { type: 'object' },
        margins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'monte-carlo', 'aerospace']
}));

export const missionDocumentationTask = defineTask('mission-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mission Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mission Design Documentation Engineer',
      task: 'Generate mission design documentation',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document mission requirements',
        '3. Present launch window analysis',
        '4. Document trajectory design',
        '5. Present delta-V budget',
        '6. Document orbit design',
        '7. Present navigation design',
        '8. Document operations timeline',
        '9. Present Monte Carlo results',
        '10. Generate JSON and markdown'
      ],
      outputFormat: 'JSON object with mission documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['space-mission', 'documentation', 'aerospace']
}));
