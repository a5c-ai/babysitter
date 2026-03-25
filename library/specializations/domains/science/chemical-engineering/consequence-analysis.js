/**
 * @process chemical-engineering/consequence-analysis
 * @description Perform consequence modeling for hazardous releases including dispersion, fire, and explosion scenarios
 * @inputs { processName: string, releaseScenarios: array, siteData: object, meteorologicalData: object, outputDir: string }
 * @outputs { success: boolean, consequenceResults: object, impactZones: object, emergencyZones: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    releaseScenarios,
    siteData,
    meteorologicalData,
    populationData = {},
    outputDir = 'consequence-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Release Scenarios
  ctx.log('info', 'Starting consequence analysis: Defining release scenarios');
  const scenarioDefinitionResult = await ctx.task(releaseScenarioDefinitionTask, {
    processName,
    releaseScenarios,
    siteData,
    outputDir
  });

  if (!scenarioDefinitionResult.success) {
    return {
      success: false,
      error: 'Release scenario definition failed',
      details: scenarioDefinitionResult,
      metadata: { processId: 'chemical-engineering/consequence-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...scenarioDefinitionResult.artifacts);

  // Task 2: Model Source Term
  ctx.log('info', 'Modeling source term (release rate, duration)');
  const sourceTermResult = await ctx.task(sourceTermModelingTask, {
    processName,
    scenarios: scenarioDefinitionResult.scenarios,
    outputDir
  });

  artifacts.push(...sourceTermResult.artifacts);

  // Task 3: Perform Dispersion Modeling
  ctx.log('info', 'Performing dispersion modeling');
  const dispersionResult = await ctx.task(dispersionModelingTask, {
    processName,
    sourceTerms: sourceTermResult.sourceTerms,
    meteorologicalData,
    siteData,
    outputDir
  });

  artifacts.push(...dispersionResult.artifacts);

  // Task 4: Model Fire Effects
  ctx.log('info', 'Modeling fire effects');
  const fireResult = await ctx.task(fireModelingTask, {
    processName,
    scenarios: scenarioDefinitionResult.scenarios,
    sourceTerms: sourceTermResult.sourceTerms,
    outputDir
  });

  artifacts.push(...fireResult.artifacts);

  // Task 5: Model Explosion Effects
  ctx.log('info', 'Modeling explosion effects');
  const explosionResult = await ctx.task(explosionModelingTask, {
    processName,
    scenarios: scenarioDefinitionResult.scenarios,
    sourceTerms: sourceTermResult.sourceTerms,
    dispersionResults: dispersionResult.results,
    outputDir
  });

  artifacts.push(...explosionResult.artifacts);

  // Breakpoint: Review consequence modeling results
  await ctx.breakpoint({
    question: `Consequence modeling complete for ${processName}. Scenarios analyzed: ${scenarioDefinitionResult.scenarios.length}. Maximum toxic impact: ${dispersionResult.maxImpactDistance} m. Maximum thermal impact: ${fireResult.maxThermalDistance} m. Review results?`,
    title: 'Consequence Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        scenariosAnalyzed: scenarioDefinitionResult.scenarios.length,
        maxToxicDistance: dispersionResult.maxImpactDistance,
        maxThermalDistance: fireResult.maxThermalDistance,
        maxOverpressureDistance: explosionResult.maxOverpressureDistance
      }
    }
  });

  // Task 6: Determine Impact Zones
  ctx.log('info', 'Determining impact zones');
  const impactZonesResult = await ctx.task(impactZoneDeterminationTask, {
    processName,
    dispersionResults: dispersionResult.results,
    fireResults: fireResult.results,
    explosionResults: explosionResult.results,
    siteData,
    outputDir
  });

  artifacts.push(...impactZonesResult.artifacts);

  // Task 7: Develop Emergency Response Zones
  ctx.log('info', 'Developing emergency response zones');
  const emergencyZonesResult = await ctx.task(emergencyZoneDefinitionTask, {
    processName,
    impactZones: impactZonesResult.zones,
    siteData,
    populationData,
    outputDir
  });

  artifacts.push(...emergencyZonesResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    consequenceResults: {
      dispersion: dispersionResult.results,
      fire: fireResult.results,
      explosion: explosionResult.results
    },
    impactZones: impactZonesResult.zones,
    emergencyZones: emergencyZonesResult.zones,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/consequence-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Release Scenario Definition
export const releaseScenarioDefinitionTask = defineTask('release-scenario-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define release scenarios',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'consequence analysis engineer',
      task: 'Define and characterize release scenarios',
      context: args,
      instructions: [
        'Identify credible release scenarios',
        'Define release location and orientation',
        'Characterize material properties (flammable, toxic)',
        'Define release conditions (pressure, temperature)',
        'Specify hole size or equipment failure mode',
        'Consider instantaneous vs. continuous releases',
        'Document scenario basis',
        'Create scenario summary table'
      ],
      outputFormat: 'JSON with scenarios, release conditions, material properties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scenarios', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              material: { type: 'string' },
              releaseType: { type: 'string' },
              conditions: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'scenarios']
}));

// Task 2: Source Term Modeling
export const sourceTermModelingTask = defineTask('source-term-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model source term (release rate, duration)',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'source term modeling engineer',
      task: 'Calculate release rates and durations',
      context: args,
      instructions: [
        'Calculate discharge rate through orifice/hole',
        'Account for flashing and aerosol formation',
        'Calculate liquid pool formation and evaporation',
        'Determine release duration (inventory limited)',
        'Account for mitigation measures (isolation)',
        'Calculate time-varying release profiles',
        'Model two-phase releases if applicable',
        'Document source term calculations'
      ],
      outputFormat: 'JSON with source terms, release rates, durations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sourceTerms', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sourceTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              releaseRate: { type: 'number' },
              duration: { type: 'number' },
              totalMass: { type: 'number' },
              releasePhase: { type: 'string' }
            }
          }
        },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'source-term']
}));

// Task 3: Dispersion Modeling
export const dispersionModelingTask = defineTask('dispersion-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform dispersion modeling',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'atmospheric dispersion engineer',
      task: 'Model atmospheric dispersion of releases',
      context: args,
      instructions: [
        'Select appropriate dispersion model (Gaussian, dense gas)',
        'Input meteorological conditions',
        'Model concentration contours vs. distance',
        'Calculate distances to toxic endpoints (IDLH, ERPG)',
        'Model transient dispersion if applicable',
        'Consider terrain effects',
        'Generate concentration vs. time plots',
        'Document dispersion modeling results'
      ],
      outputFormat: 'JSON with dispersion results, concentration contours, impact distances, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'maxImpactDistance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              idlhDistance: { type: 'number' },
              erpg2Distance: { type: 'number' },
              erpg3Distance: { type: 'number' },
              concentrationContours: { type: 'object' }
            }
          }
        },
        maxImpactDistance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'dispersion']
}));

// Task 4: Fire Modeling
export const fireModelingTask = defineTask('fire-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model fire effects',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'fire consequence engineer',
      task: 'Model fire effects for flammable releases',
      context: args,
      instructions: [
        'Model pool fire radiation',
        'Model jet fire radiation',
        'Model flash fire extent',
        'Calculate thermal radiation flux vs. distance',
        'Determine distances to thermal endpoints',
        'Calculate fire duration',
        'Consider fireball for instantaneous releases',
        'Document fire modeling results'
      ],
      outputFormat: 'JSON with fire results, thermal radiation, impact distances, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'maxThermalDistance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              fireType: { type: 'string' },
              radiationAt37kW: { type: 'number' },
              radiationAt12kW: { type: 'number' },
              radiationAt4kW: { type: 'number' }
            }
          }
        },
        maxThermalDistance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'fire']
}));

// Task 5: Explosion Modeling
export const explosionModelingTask = defineTask('explosion-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model explosion effects',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'explosion consequence engineer',
      task: 'Model explosion effects',
      context: args,
      instructions: [
        'Model vapor cloud explosion (VCE)',
        'Model BLEVE/fireball if applicable',
        'Calculate overpressure vs. distance',
        'Determine distances to overpressure endpoints',
        'Consider congestion and confinement',
        'Apply TNT equivalency or multi-energy method',
        'Model building damage potential',
        'Document explosion modeling results'
      ],
      outputFormat: 'JSON with explosion results, overpressure, impact distances, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'maxOverpressureDistance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              explosionType: { type: 'string' },
              distanceTo1psi: { type: 'number' },
              distanceTo3psi: { type: 'number' },
              distanceTo10psi: { type: 'number' }
            }
          }
        },
        maxOverpressureDistance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'explosion']
}));

// Task 6: Impact Zone Determination
export const impactZoneDeterminationTask = defineTask('impact-zone-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine impact zones',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'impact zone analyst',
      task: 'Determine impact zones for each consequence type',
      context: args,
      instructions: [
        'Define toxic impact zones (IDLH, ERPG-2, ERPG-3)',
        'Define thermal impact zones (fatality, injury, property)',
        'Define overpressure impact zones',
        'Overlay impact zones on site map',
        'Identify affected areas and populations',
        'Create combined hazard footprints',
        'Generate impact zone maps',
        'Document impact zone determination'
      ],
      outputFormat: 'JSON with impact zones, maps, affected areas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'zones', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        zones: {
          type: 'object',
          properties: {
            toxic: { type: 'array' },
            thermal: { type: 'array' },
            overpressure: { type: 'array' },
            combined: { type: 'array' }
          }
        },
        affectedAreas: { type: 'array' },
        mapPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'impact-zones']
}));

// Task 7: Emergency Response Zone Definition
export const emergencyZoneDefinitionTask = defineTask('emergency-zone-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop emergency response zones',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'emergency response planner',
      task: 'Define emergency response planning zones',
      context: args,
      instructions: [
        'Define isolation zone (immediate danger)',
        'Define protective action zone (shelter/evacuate)',
        'Define planning zone (notification)',
        'Map zones to site layout',
        'Identify assembly points outside zones',
        'Define evacuation routes',
        'Consider population at risk',
        'Document emergency planning input'
      ],
      outputFormat: 'JSON with emergency zones, evacuation routes, assembly points, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'zones', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        zones: {
          type: 'object',
          properties: {
            isolationZone: { type: 'object' },
            protectiveActionZone: { type: 'object' },
            planningZone: { type: 'object' }
          }
        },
        evacuationRoutes: { type: 'array' },
        assemblyPoints: { type: 'array' },
        populationAtRisk: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'consequence-analysis', 'emergency-planning']
}));
