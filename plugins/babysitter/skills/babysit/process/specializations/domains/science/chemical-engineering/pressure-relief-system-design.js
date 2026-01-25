/**
 * @process chemical-engineering/pressure-relief-system-design
 * @description Size and design pressure relief systems including relief valves, rupture disks, and flare systems per API 520/521
 * @inputs { processName: string, protectedEquipment: array, reliefScenarios: array, outputDir: string }
 * @outputs { success: boolean, reliefDevices: array, disposalSystem: object, specificationSheets: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    protectedEquipment,
    reliefScenarios,
    disposalMethod = 'flare',
    outputDir = 'relief-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Identify Relief Scenarios
  ctx.log('info', 'Starting relief system design: Identifying relief scenarios');
  const scenarioResult = await ctx.task(reliefScenarioIdentificationTask, {
    processName,
    protectedEquipment,
    reliefScenarios,
    outputDir
  });

  if (!scenarioResult.success) {
    return {
      success: false,
      error: 'Relief scenario identification failed',
      details: scenarioResult,
      metadata: { processId: 'chemical-engineering/pressure-relief-system-design', timestamp: startTime }
    };
  }

  artifacts.push(...scenarioResult.artifacts);

  // Task 2: Calculate Required Relief Rates
  ctx.log('info', 'Calculating required relief rates');
  const reliefRateResult = await ctx.task(reliefRateCalculationTask, {
    processName,
    scenarios: scenarioResult.scenarios,
    protectedEquipment,
    outputDir
  });

  artifacts.push(...reliefRateResult.artifacts);

  // Task 3: Select Relief Device Type
  ctx.log('info', 'Selecting relief device types');
  const deviceSelectionResult = await ctx.task(reliefDeviceSelectionTask, {
    processName,
    scenarios: scenarioResult.scenarios,
    reliefRates: reliefRateResult.reliefRates,
    outputDir
  });

  artifacts.push(...deviceSelectionResult.artifacts);

  // Task 4: Size Relief Devices per API 520
  ctx.log('info', 'Sizing relief devices per API 520');
  const sizingResult = await ctx.task(reliefDeviceSizingTask, {
    processName,
    deviceSelections: deviceSelectionResult.selections,
    reliefRates: reliefRateResult.reliefRates,
    outputDir
  });

  artifacts.push(...sizingResult.artifacts);

  // Task 5: Design Relief Header and Collection System
  ctx.log('info', 'Designing relief header and collection system');
  const headerResult = await ctx.task(reliefHeaderDesignTask, {
    processName,
    reliefDevices: sizingResult.devices,
    disposalMethod,
    outputDir
  });

  artifacts.push(...headerResult.artifacts);

  // Breakpoint: Review relief system design
  await ctx.breakpoint({
    question: `Relief system design in progress for ${processName}. Scenarios: ${scenarioResult.scenarios.length}. Relief devices: ${sizingResult.devices.length}. Header size: ${headerResult.headerSize}". Review design?`,
    title: 'Pressure Relief System Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        scenariosAnalyzed: scenarioResult.scenarios.length,
        reliefDevices: sizingResult.devices.length,
        controllingScenario: reliefRateResult.controllingScenario,
        headerSize: headerResult.headerSize
      }
    }
  });

  // Task 6: Design Disposal System per API 521
  ctx.log('info', 'Designing disposal system per API 521');
  const disposalResult = await ctx.task(disposalSystemDesignTask, {
    processName,
    reliefDevices: sizingResult.devices,
    headerDesign: headerResult.design,
    disposalMethod,
    outputDir
  });

  artifacts.push(...disposalResult.artifacts);

  // Task 7: Verify Installation per API 521
  ctx.log('info', 'Verifying installation requirements per API 521');
  const installationResult = await ctx.task(installationVerificationTask, {
    processName,
    reliefDevices: sizingResult.devices,
    headerDesign: headerResult.design,
    disposalSystem: disposalResult.design,
    outputDir
  });

  artifacts.push(...installationResult.artifacts);

  // Task 8: Generate Relief Device Specification Sheets
  ctx.log('info', 'Generating relief device specification sheets');
  const specificationResult = await ctx.task(reliefSpecificationTask, {
    processName,
    reliefDevices: sizingResult.devices,
    scenarios: scenarioResult.scenarios,
    outputDir
  });

  artifacts.push(...specificationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    reliefDevices: sizingResult.devices,
    disposalSystem: disposalResult.design,
    headerDesign: headerResult.design,
    specificationSheets: specificationResult.specSheets,
    installationRequirements: installationResult.requirements,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/pressure-relief-system-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Relief Scenario Identification
export const reliefScenarioIdentificationTask = defineTask('relief-scenario-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify relief scenarios',
  skill: { name: 'relief-system-designer' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'pressure relief engineer',
      task: 'Identify all credible relief scenarios for protected equipment',
      context: args,
      instructions: [
        'Identify fire case scenarios',
        'Identify blocked outlet scenarios',
        'Identify control valve failure scenarios',
        'Identify thermal expansion scenarios',
        'Identify chemical reaction/runaway scenarios',
        'Identify utility failure scenarios',
        'Identify tube rupture scenarios (for exchangers)',
        'Document all scenarios per API 521'
      ],
      outputFormat: 'JSON with scenarios list, descriptions, basis, artifacts'
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
              type: { type: 'string' },
              equipment: { type: 'string' },
              description: { type: 'string' },
              basis: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'relief-system', 'scenarios']
}));

// Task 2: Relief Rate Calculation
export const reliefRateCalculationTask = defineTask('relief-rate-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate required relief rates',
  skill: { name: 'relief-system-designer' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'relief rate calculation engineer',
      task: 'Calculate required relief rates for each scenario',
      context: args,
      instructions: [
        'Calculate fire case relief rate per API 521',
        'Calculate blocked outlet relief rate',
        'Calculate thermal expansion relief rate',
        'Calculate reaction runaway rate (DIERS if applicable)',
        'Calculate tube rupture relief rate',
        'Identify controlling scenario for each device',
        'Account for two-phase relief if applicable',
        'Document all calculations per API 520'
      ],
      outputFormat: 'JSON with relief rates, controlling scenarios, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reliefRates', 'controllingScenario', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reliefRates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              reliefRate: { type: 'number' },
              units: { type: 'string' },
              phase: { type: 'string' }
            }
          }
        },
        controllingScenario: { type: 'string' },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'relief-system', 'calculations']
}));

// Task 3: Relief Device Selection
export const reliefDeviceSelectionTask = defineTask('relief-device-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select relief device types',
  skill: { name: 'relief-system-designer' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'relief device selection engineer',
      task: 'Select appropriate relief device types',
      context: args,
      instructions: [
        'Evaluate pressure safety valve (PSV) for each application',
        'Evaluate rupture disk for high rate or corrosive service',
        'Evaluate pilot-operated relief valve for tight shutoff',
        'Consider PSV + rupture disk combinations',
        'Select materials compatible with process',
        'Consider backpressure effects on device selection',
        'Document selection rationale',
        'Create device selection summary'
      ],
      outputFormat: 'JSON with device selections, types, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selections', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              equipment: { type: 'string' },
              deviceType: { type: 'string' },
              material: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'relief-system', 'device-selection']
}));

// Task 4: Relief Device Sizing
export const reliefDeviceSizingTask = defineTask('relief-device-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size relief devices per API 520',
  skill: { name: 'relief-system-designer' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'relief device sizing engineer',
      task: 'Size relief devices per API 520 methodology',
      context: args,
      instructions: [
        'Calculate required orifice area per API 520',
        'Select standard orifice size',
        'Account for backpressure correction factors',
        'Account for two-phase flow if applicable',
        'Calculate inlet pressure drop',
        'Verify 3% rule for inlet piping',
        'Size rupture disks if used',
        'Document sizing calculations'
      ],
      outputFormat: 'JSON with sized devices, orifice sizes, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'devices', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        devices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              type: { type: 'string' },
              orifice: { type: 'string' },
              area: { type: 'number' },
              setPressure: { type: 'number' },
              capacity: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'relief-system', 'sizing']
}));

// Task 5: Relief Header Design
export const reliefHeaderDesignTask = defineTask('relief-header-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design relief header and collection system',
  skill: { name: 'relief-system-designer' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'relief header design engineer',
      task: 'Design relief header and collection system',
      context: args,
      instructions: [
        'Calculate header sizing for peak load',
        'Account for simultaneous relief cases',
        'Design for acceptable backpressure',
        'Route header to disposal system',
        'Size knockout drums if required',
        'Design for liquid carryover',
        'Specify header materials and insulation',
        'Document header design'
      ],
      outputFormat: 'JSON with header design, sizing, P&ID routing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'headerSize', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            headerSize: { type: 'string' },
            material: { type: 'string' },
            routing: { type: 'array' },
            knockoutDrum: { type: 'object' }
          }
        },
        headerSize: { type: 'string' },
        backpressureAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'relief-system', 'header-design']
}));

// Task 6: Disposal System Design
export const disposalSystemDesignTask = defineTask('disposal-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design disposal system per API 521',
  skill: { name: 'consequence-modeler' },
  agent: {
    name: 'pressure-relief-engineer',
    prompt: {
      role: 'flare/disposal system engineer',
      task: 'Design relief disposal system per API 521',
      context: args,
      instructions: [
        'Size flare stack or vent (elevated or ground)',
        'Calculate radiation levels at grade',
        'Design for smokeless operation if required',
        'Size flare knockout drum',
        'Design seal systems',
        'Calculate flare tip velocity',
        'Design pilot and ignition systems',
        'Document disposal system design per API 521'
      ],
      outputFormat: 'JSON with disposal system design, flare sizing, radiation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            height: { type: 'number' },
            diameter: { type: 'number' },
            capacity: { type: 'number' },
            radiationAtGrade: { type: 'number' }
          }
        },
        sealSystem: { type: 'object' },
        knockoutDrum: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'relief-system', 'disposal']
}));

// Task 7: Installation Verification
export const installationVerificationTask = defineTask('installation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify installation requirements per API 521',
  agent: {
    name: 'installation-engineer',
    prompt: {
      role: 'relief system installation engineer',
      task: 'Verify installation requirements per API 521',
      context: args,
      instructions: [
        'Verify inlet piping pressure drop < 3%',
        'Verify outlet piping backpressure limits',
        'Check relief device accessibility',
        'Verify discharge orientation (safe location)',
        'Check for proper drainage and pocketing',
        'Verify block valve requirements',
        'Check car seal and lock requirements',
        'Document installation requirements'
      ],
      outputFormat: 'JSON with installation requirements, verification checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirements: {
          type: 'object',
          properties: {
            inletPiping: { type: 'object' },
            outletPiping: { type: 'object' },
            accessibility: { type: 'object' },
            blockValves: { type: 'object' }
          }
        },
        verificationChecklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'relief-system', 'installation']
}));

// Task 8: Relief Specification Sheets
export const reliefSpecificationTask = defineTask('relief-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate relief device specification sheets',
  agent: {
    name: 'specification-engineer',
    prompt: {
      role: 'relief device specification engineer',
      task: 'Generate relief device specification sheets',
      context: args,
      instructions: [
        'Create specification sheet for each relief device',
        'Document tag number and service',
        'Specify set pressure and backpressure',
        'Document relieving conditions',
        'Specify orifice size and capacity',
        'Document materials of construction',
        'Include sizing basis and scenarios',
        'Create complete specification package'
      ],
      outputFormat: 'JSON with specification sheets, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specSheets', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specSheets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              path: { type: 'string' },
              setPressure: { type: 'number' },
              orifice: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'relief-system', 'specification']
}));
