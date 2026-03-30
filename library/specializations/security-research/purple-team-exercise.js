/**
 * @process specializations/security-research/purple-team-exercise
 * @description Collaborative security exercise combining red team attack simulation with blue team
 * defensive operations. Focuses on improving detection capabilities, validating security controls,
 * and building organizational security maturity through iterative testing.
 * @inputs { projectName: string, scope: object, attackScenarios: array }
 * @outputs { success: boolean, detectionResults: object, controlGaps: array, purpleTeamReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/purple-team-exercise', {
 *   projectName: 'Quarterly Purple Team Exercise',
 *   scope: { networks: ['corporate'], systems: ['domain-controllers'] },
 *   attackScenarios: ['ransomware', 'data-exfiltration']
 * });
 *
 * @references
 * - Purple Team Exercise Framework: https://github.com/scythe-io/purple-team-exercise-framework
 * - MITRE ATT&CK: https://attack.mitre.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    scope,
    attackScenarios,
    detectionSystems = [],
    outputDir = 'purple-team-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const controlGaps = [];

  ctx.log('info', `Starting Purple Team Exercise for ${projectName}`);
  ctx.log('info', `Scenarios: ${attackScenarios.join(', ')}`);

  // ============================================================================
  // PHASE 1: EXERCISE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning exercise and coordinating teams');

  const planning = await ctx.task(exercisePlanningTask, {
    projectName,
    scope,
    attackScenarios,
    detectionSystems,
    outputDir
  });

  artifacts.push(...planning.artifacts);

  // ============================================================================
  // PHASE 2: BASELINE DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing detection baseline');

  const baseline = await ctx.task(detectionBaselineTask, {
    projectName,
    detectionSystems,
    outputDir
  });

  artifacts.push(...baseline.artifacts);

  // ============================================================================
  // PHASE 3: ATTACK SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Executing attack simulations');

  const attackSimulation = await ctx.task(attackSimulationTask, {
    projectName,
    attackScenarios,
    planning,
    outputDir
  });

  artifacts.push(...attackSimulation.artifacts);

  // ============================================================================
  // PHASE 4: DETECTION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating detection capabilities');

  const detectionValidation = await ctx.task(detectionValidationTask, {
    projectName,
    attackSimulation,
    detectionSystems,
    outputDir
  });

  controlGaps.push(...detectionValidation.gaps);
  artifacts.push(...detectionValidation.artifacts);

  // ============================================================================
  // PHASE 5: RESPONSE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing incident response');

  const responseTesting = await ctx.task(responseTestingTask, {
    projectName,
    attackSimulation,
    detectionValidation,
    outputDir
  });

  controlGaps.push(...responseTesting.gaps);
  artifacts.push(...responseTesting.artifacts);

  // ============================================================================
  // PHASE 6: IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating improvement recommendations');

  const improvements = await ctx.task(improvementRecommendationsTask, {
    projectName,
    detectionValidation,
    responseTesting,
    controlGaps,
    outputDir
  });

  artifacts.push(...improvements.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating purple team report');

  const report = await ctx.task(purpleTeamReportTask, {
    projectName,
    attackSimulation,
    detectionValidation,
    responseTesting,
    improvements,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Purple team exercise complete. Detection rate: ${detectionValidation.detectionRate}%. ${controlGaps.length} gaps identified. Review findings?`,
    title: 'Purple Team Exercise Complete',
    context: {
      runId: ctx.runId,
      summary: {
        scenariosTested: attackScenarios.length,
        detectionRate: detectionValidation.detectionRate,
        controlGaps: controlGaps.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    detectionResults: {
      detectionRate: detectionValidation.detectionRate,
      detected: detectionValidation.detected,
      missed: detectionValidation.missed
    },
    controlGaps,
    purpleTeamReport: {
      reportPath: report.reportPath,
      improvements: improvements.recommendations
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/purple-team-exercise',
      timestamp: startTime,
      attackScenarios,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const exercisePlanningTask = defineTask('exercise-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Exercise - ${args.projectName}`,
  agent: {
    name: 'purple-team-coordinator',
    prompt: {
      role: 'Purple Team Exercise Planner',
      task: 'Plan purple team exercise',
      context: args,
      instructions: [
        '1. Define exercise scope',
        '2. Select attack scenarios',
        '3. Coordinate red and blue teams',
        '4. Map TTPs to test',
        '5. Define success criteria',
        '6. Set up communication channels',
        '7. Prepare monitoring tools',
        '8. Document exercise plan'
      ],
      outputFormat: 'JSON with exercise plan'
    },
    outputSchema: {
      type: 'object',
      required: ['exercisePlan', 'ttpsToTest', 'artifacts'],
      properties: {
        exercisePlan: { type: 'object' },
        ttpsToTest: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'planning']
}));

export const detectionBaselineTask = defineTask('detection-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish Baseline - ${args.projectName}`,
  agent: {
    name: 'purple-team-coordinator',
    prompt: {
      role: 'Detection Baseline Analyst',
      task: 'Establish detection baseline',
      context: args,
      instructions: [
        '1. Inventory detection systems',
        '2. Review existing rules',
        '3. Map current coverage',
        '4. Identify known gaps',
        '5. Baseline alert volume',
        '6. Document configurations',
        '7. Test existing detections',
        '8. Create baseline report'
      ],
      outputFormat: 'JSON with baseline'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'coverage', 'artifacts'],
      properties: {
        baseline: { type: 'object' },
        coverage: { type: 'object' },
        existingRules: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'baseline']
}));

export const attackSimulationTask = defineTask('attack-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulate Attacks - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Attack Simulation Specialist',
      task: 'Execute attack simulations',
      context: args,
      instructions: [
        '1. Execute planned TTPs',
        '2. Document each attack step',
        '3. Note timestamps',
        '4. Capture telemetry generated',
        '5. Document variations tested',
        '6. Note evasion attempts',
        '7. Document detection triggers',
        '8. Create attack log'
      ],
      outputFormat: 'JSON with attack simulation'
    },
    outputSchema: {
      type: 'object',
      required: ['attacksExecuted', 'telemetryGenerated', 'artifacts'],
      properties: {
        attacksExecuted: { type: 'array' },
        telemetryGenerated: { type: 'array' },
        timestamps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'simulation']
}));

export const detectionValidationTask = defineTask('detection-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Detection - ${args.projectName}`,
  agent: {
    name: 'purple-team-coordinator',
    prompt: {
      role: 'Detection Validation Specialist',
      task: 'Validate detection capabilities',
      context: args,
      instructions: [
        '1. Review alerts generated',
        '2. Correlate with attack times',
        '3. Identify missed attacks',
        '4. Calculate detection rate',
        '5. Assess alert quality',
        '6. Identify false positives',
        '7. Document detection gaps',
        '8. Create validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionRate', 'detected', 'missed', 'gaps', 'artifacts'],
      properties: {
        detectionRate: { type: 'number' },
        detected: { type: 'array' },
        missed: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'validation']
}));

export const responseTestingTask = defineTask('response-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Response - ${args.projectName}`,
  agent: {
    name: 'purple-team-coordinator',
    prompt: {
      role: 'Incident Response Tester',
      task: 'Test incident response',
      context: args,
      instructions: [
        '1. Evaluate response time',
        '2. Test investigation process',
        '3. Assess containment actions',
        '4. Test communication',
        '5. Evaluate escalation',
        '6. Test remediation steps',
        '7. Document response gaps',
        '8. Create response report'
      ],
      outputFormat: 'JSON with response testing'
    },
    outputSchema: {
      type: 'object',
      required: ['responseMetrics', 'gaps', 'artifacts'],
      properties: {
        responseMetrics: { type: 'object' },
        gaps: { type: 'array' },
        responseTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'response']
}));

export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Recommendations - ${args.projectName}`,
  agent: {
    name: 'purple-team-coordinator',
    prompt: {
      role: 'Security Improvement Advisor',
      task: 'Generate improvement recommendations',
      context: args,
      instructions: [
        '1. Analyze detection gaps',
        '2. Prioritize improvements',
        '3. Recommend new detections',
        '4. Suggest process improvements',
        '5. Recommend tool enhancements',
        '6. Create detection rules',
        '7. Suggest training needs',
        '8. Create improvement plan'
      ],
      outputFormat: 'JSON with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'newDetections', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        newDetections: { type: 'array' },
        trainingNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'improvements']
}));

export const purpleTeamReportTask = defineTask('purple-team-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Purple Team Report Specialist',
      task: 'Generate purple team report',
      context: args,
      instructions: [
        '1. Summarize exercise',
        '2. Present detection metrics',
        '3. Document gaps found',
        '4. Include improvements',
        '5. Create executive summary',
        '6. Add timeline',
        '7. Include recommendations',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'purple-team', 'reporting']
}));
