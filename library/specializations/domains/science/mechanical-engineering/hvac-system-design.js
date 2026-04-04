/**
 * @process specializations/domains/science/mechanical-engineering/hvac-system-design
 * @description HVAC System Design - Designing heating, ventilation, and air conditioning systems
 * per ASHRAE standards, including load calculations, equipment selection, duct/piping layout,
 * and energy efficiency optimization.
 * @inputs { projectName: string, buildingData: object, climateZone: string, designCriteria: object }
 * @outputs { success: boolean, loads: object, equipment: array, ductDesign: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/hvac-system-design', {
 *   projectName: 'Office Building HVAC',
 *   buildingData: { area: 5000, floors: 3, occupancy: 250 },
 *   climateZone: '4A',
 *   designCriteria: { summerDB: 35, winterDB: -5, indoorTemp: 22 }
 * });
 *
 * @references
 * - ASHRAE Handbook - Fundamentals: https://www.ashrae.org/technical-resources/ashrae-handbook
 * - ASHRAE Standard 62.1 - Ventilation: https://www.ashrae.org/technical-resources/standards-and-guidelines
 * - ASHRAE Standard 90.1 - Energy: https://www.ashrae.org/technical-resources/standards-and-guidelines
 * - SMACNA Duct Standards: https://www.smacna.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    buildingData = {},
    climateZone,
    designCriteria = {},
    systemType = 'vav', // 'vav', 'vrf', 'chilled-beam', 'doas', 'packaged'
    energyCode = 'ASHRAE-90.1-2019',
    outputDir = 'hvac-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HVAC System Design for ${projectName}`);
  ctx.log('info', `Climate Zone: ${climateZone}, System Type: ${systemType}`);

  // ============================================================================
  // PHASE 1: BUILDING ANALYSIS AND ZONING
  // ============================================================================

  ctx.log('info', 'Phase 1: Building Analysis and Zoning');

  const zoningResult = await ctx.task(buildingZoningTask, {
    projectName,
    buildingData,
    outputDir
  });

  artifacts.push(...zoningResult.artifacts);

  ctx.log('info', `Building zoned - ${zoningResult.zoneCount} thermal zones defined`);

  // ============================================================================
  // PHASE 2: LOAD CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 2: Heating and Cooling Load Calculations');

  const loadResult = await ctx.task(loadCalculationsTask, {
    projectName,
    buildingData,
    zoningResult,
    climateZone,
    designCriteria,
    outputDir
  });

  artifacts.push(...loadResult.artifacts);

  ctx.log('info', `Loads calculated - Peak cooling: ${loadResult.peakCooling} tons, Peak heating: ${loadResult.peakHeating} kW`);

  // Breakpoint: Review load calculations
  await ctx.breakpoint({
    question: `Load calculations complete. Peak cooling: ${loadResult.peakCooling} tons, Peak heating: ${loadResult.peakHeating} kW. Watts/sqft: ${loadResult.coolingIntensity}. Review load breakdown?`,
    title: 'Load Calculation Review',
    context: {
      runId: ctx.runId,
      loadSummary: loadResult.summary,
      zoneLoads: loadResult.zoneLoads,
      loadComponents: loadResult.loadComponents,
      files: loadResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: VENTILATION REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Ventilation Requirements (ASHRAE 62.1)');

  const ventilationResult = await ctx.task(ventilationRequirementsTask, {
    projectName,
    buildingData,
    zoningResult,
    outputDir
  });

  artifacts.push(...ventilationResult.artifacts);

  ctx.log('info', `Ventilation calculated - Total OA: ${ventilationResult.totalOutdoorAir} CFM`);

  // ============================================================================
  // PHASE 4: SYSTEM SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: HVAC System Selection');

  const systemSelectionResult = await ctx.task(systemSelectionTask, {
    projectName,
    loadResult,
    ventilationResult,
    buildingData,
    systemType,
    outputDir
  });

  artifacts.push(...systemSelectionResult.artifacts);

  ctx.log('info', `System selected: ${systemSelectionResult.selectedSystem}`);

  // ============================================================================
  // PHASE 5: EQUIPMENT SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Equipment Selection');

  const equipmentResult = await ctx.task(equipmentSelectionTask, {
    projectName,
    loadResult,
    ventilationResult,
    systemSelectionResult,
    energyCode,
    outputDir
  });

  artifacts.push(...equipmentResult.artifacts);

  ctx.log('info', `Equipment selected - ${equipmentResult.equipmentList.length} items`);

  // ============================================================================
  // PHASE 6: AIR DISTRIBUTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Air Distribution Design');

  const airDistributionResult = await ctx.task(airDistributionTask, {
    projectName,
    zoningResult,
    loadResult,
    equipmentResult,
    outputDir
  });

  artifacts.push(...airDistributionResult.artifacts);

  ctx.log('info', `Air distribution designed - Total duct length: ${airDistributionResult.totalDuctLength} ft`);

  // ============================================================================
  // PHASE 7: PIPING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Hydronic Piping Design');

  const pipingResult = await ctx.task(pipingDesignTask, {
    projectName,
    equipmentResult,
    systemSelectionResult,
    outputDir
  });

  artifacts.push(...pipingResult.artifacts);

  ctx.log('info', `Piping designed - Chilled water: ${pipingResult.chilledWaterGPM} GPM`);

  // ============================================================================
  // PHASE 8: CONTROLS DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Controls Design');

  const controlsResult = await ctx.task(controlsDesignTask, {
    projectName,
    systemSelectionResult,
    equipmentResult,
    zoningResult,
    outputDir
  });

  artifacts.push(...controlsResult.artifacts);

  ctx.log('info', `Controls designed - ${controlsResult.pointCount} control points`);

  // ============================================================================
  // PHASE 9: ENERGY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Energy Analysis');

  const energyResult = await ctx.task(energyAnalysisTask, {
    projectName,
    loadResult,
    equipmentResult,
    systemSelectionResult,
    climateZone,
    energyCode,
    outputDir
  });

  artifacts.push(...energyResult.artifacts);

  ctx.log('info', `Energy analysis complete - Annual consumption: ${energyResult.annualConsumption} kWh`);

  // Quality Gate: Energy code compliance
  if (!energyResult.codeCompliant) {
    await ctx.breakpoint({
      question: `Design does not meet ${energyCode} requirements. EUI: ${energyResult.eui} vs target ${energyResult.euiTarget}. Review energy measures?`,
      title: 'Energy Code Compliance',
      context: {
        runId: ctx.runId,
        energyResults: energyResult.summary,
        complianceIssues: energyResult.complianceIssues,
        recommendations: energyResult.recommendations,
        files: energyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: GENERATE HVAC REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating HVAC Design Report');

  const reportResult = await ctx.task(generateHVACReportTask, {
    projectName,
    buildingData,
    zoningResult,
    loadResult,
    ventilationResult,
    systemSelectionResult,
    equipmentResult,
    airDistributionResult,
    pipingResult,
    controlsResult,
    energyResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `HVAC Design Complete for ${projectName}. Peak cooling: ${loadResult.peakCooling} tons, ${equipmentResult.equipmentList.length} equipment items. EUI: ${energyResult.eui}. Approve design?`,
    title: 'HVAC Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        peakCooling: loadResult.peakCooling,
        peakHeating: loadResult.peakHeating,
        systemType: systemSelectionResult.selectedSystem,
        annualEnergy: energyResult.annualConsumption,
        eui: energyResult.eui
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'HVAC Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    loads: {
      peakCooling: loadResult.peakCooling,
      peakHeating: loadResult.peakHeating,
      ventilationCFM: ventilationResult.totalOutdoorAir
    },
    equipment: equipmentResult.equipmentList,
    ductDesign: airDistributionResult.summary,
    energyPerformance: {
      annualConsumption: energyResult.annualConsumption,
      eui: energyResult.eui,
      codeCompliant: energyResult.codeCompliant
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/hvac-system-design',
      processSlug: 'hvac-system-design',
      category: 'mechanical-engineering',
      timestamp: startTime,
      systemType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const buildingZoningTask = defineTask('building-zoning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Building Zoning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Analyze building and define thermal zones',
      context: {
        projectName: args.projectName,
        buildingData: args.buildingData,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review building floor plans and sections',
        '2. Identify space types and occupancies',
        '3. Group spaces into thermal zones:',
        '   - Similar thermal loads',
        '   - Similar schedules',
        '   - Orientation and exposure',
        '4. Identify perimeter vs interior zones',
        '5. Define zone boundaries',
        '6. Document zone characteristics',
        '7. Create zone schedule',
        '8. Map zones to floors'
      ],
      outputFormat: 'JSON object with zoning'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'zoneCount', 'zones', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        zoneCount: { type: 'number' },
        zones: { type: 'array' },
        zoneSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'zoning']
}));

export const loadCalculationsTask = defineTask('load-calculations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Load Calculations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Calculate heating and cooling loads per ASHRAE',
      context: {
        projectName: args.projectName,
        buildingData: args.buildingData,
        zoningResult: args.zoningResult,
        climateZone: args.climateZone,
        designCriteria: args.designCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Gather design weather data',
        '2. Calculate cooling loads using RTS or CLTD method:',
        '   - Envelope loads (walls, roof, glass)',
        '   - Internal loads (people, lights, equipment)',
        '   - Ventilation loads',
        '3. Calculate heating loads:',
        '   - Envelope transmission',
        '   - Infiltration',
        '   - Ventilation',
        '4. Apply diversity factors',
        '5. Calculate block loads per zone',
        '6. Calculate coincident building peak',
        '7. Document safety factors',
        '8. Create load summary'
      ],
      outputFormat: 'JSON object with load calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'peakCooling', 'peakHeating', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        peakCooling: { type: 'number' },
        peakHeating: { type: 'number' },
        coolingIntensity: { type: 'number' },
        zoneLoads: { type: 'array' },
        loadComponents: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'load-calculations', 'ashrae']
}));

export const ventilationRequirementsTask = defineTask('ventilation-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ventilation Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Calculate ventilation requirements per ASHRAE 62.1',
      context: {
        projectName: args.projectName,
        buildingData: args.buildingData,
        zoningResult: args.zoningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine space categories per ASHRAE 62.1',
        '2. Calculate people outdoor air rate (Rp)',
        '3. Calculate area outdoor air rate (Ra)',
        '4. Calculate zone outdoor air:',
        '   Vbz = Rp × Pz + Ra × Az',
        '5. Calculate zone air distribution effectiveness',
        '6. Calculate zone outdoor airflow:',
        '   Voz = Vbz / Ez',
        '7. For multizone: calculate system efficiency',
        '8. Calculate outdoor air intake'
      ],
      outputFormat: 'JSON object with ventilation requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalOutdoorAir', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalOutdoorAir: { type: 'number' },
        zoneVentilation: { type: 'array' },
        systemEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'ventilation', 'ashrae-62.1']
}));

export const systemSelectionTask = defineTask('system-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Select HVAC system type',
      context: {
        projectName: args.projectName,
        loadResult: args.loadResult,
        ventilationResult: args.ventilationResult,
        buildingData: args.buildingData,
        systemType: args.systemType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate system options:',
        '   - VAV with central plant',
        '   - VRF/VRV systems',
        '   - Chilled beams with DOAS',
        '   - Packaged rooftop units',
        '   - Water source heat pumps',
        '2. Score against criteria:',
        '   - First cost',
        '   - Operating cost',
        '   - Space requirements',
        '   - Flexibility',
        '   - Maintenance',
        '3. Select optimal system',
        '4. Define system configuration',
        '5. Document selection rationale'
      ],
      outputFormat: 'JSON object with system selection'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedSystem', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedSystem: { type: 'string' },
        systemConfiguration: { type: 'object' },
        selectionMatrix: { type: 'object' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'system-selection']
}));

export const equipmentSelectionTask = defineTask('equipment-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Equipment Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Select HVAC equipment',
      context: {
        projectName: args.projectName,
        loadResult: args.loadResult,
        ventilationResult: args.ventilationResult,
        systemSelectionResult: args.systemSelectionResult,
        energyCode: args.energyCode,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select air handling units:',
        '   - Capacity, CFM',
        '   - Coil sizing',
        '   - Fan selection',
        '2. Select chillers:',
        '   - Capacity with redundancy',
        '   - Efficiency (kW/ton)',
        '3. Select boilers:',
        '   - Capacity',
        '   - Efficiency',
        '4. Select pumps:',
        '   - GPM, head',
        '   - Efficiency',
        '5. Select terminal units (VAV boxes)',
        '6. Verify code compliance',
        '7. Create equipment schedule'
      ],
      outputFormat: 'JSON object with equipment selection'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'equipmentList', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        equipmentList: { type: 'array' },
        equipmentSchedule: { type: 'object' },
        totalConnectedLoad: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'equipment']
}));

export const airDistributionTask = defineTask('air-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Air Distribution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Design air distribution system',
      context: {
        projectName: args.projectName,
        zoningResult: args.zoningResult,
        loadResult: args.loadResult,
        equipmentResult: args.equipmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate supply air quantities per zone',
        '2. Design duct layout:',
        '   - Main trunk routing',
        '   - Branch connections',
        '   - Fitting selection',
        '3. Size ducts using equal friction or static regain',
        '4. Select diffusers and grilles',
        '5. Calculate system pressure drop',
        '6. Verify noise criteria (NC)',
        '7. Design return air system',
        '8. Create duct schedule'
      ],
      outputFormat: 'JSON object with air distribution design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalDuctLength', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalDuctLength: { type: 'number' },
        systemPressureDrop: { type: 'number' },
        ductSchedule: { type: 'array' },
        diffuserSchedule: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'duct-design']
}));

export const pipingDesignTask = defineTask('piping-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Piping Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Design Engineer',
      task: 'Design hydronic piping systems',
      context: {
        projectName: args.projectName,
        equipmentResult: args.equipmentResult,
        systemSelectionResult: args.systemSelectionResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate chilled water flow:',
        '   GPM = tons × 24 / deltaT',
        '2. Calculate hot water flow',
        '3. Design piping layout:',
        '   - Primary/secondary loops',
        '   - Distribution piping',
        '4. Size piping using friction tables',
        '5. Select expansion tanks',
        '6. Design air separation',
        '7. Calculate pump head',
        '8. Create piping schedule'
      ],
      outputFormat: 'JSON object with piping design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'chilledWaterGPM', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        chilledWaterGPM: { type: 'number' },
        hotWaterGPM: { type: 'number' },
        pipingSchedule: { type: 'array' },
        pumpHead: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'piping']
}));

export const controlsDesignTask = defineTask('controls-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Controls Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HVAC Controls Engineer',
      task: 'Design HVAC controls system',
      context: {
        projectName: args.projectName,
        systemSelectionResult: args.systemSelectionResult,
        equipmentResult: args.equipmentResult,
        zoningResult: args.zoningResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define control sequences:',
        '   - AHU sequences',
        '   - VAV box sequences',
        '   - Plant sequences',
        '2. Identify control points (inputs/outputs)',
        '3. Select sensors and actuators',
        '4. Define setpoints and schedules',
        '5. Design BAS architecture',
        '6. Create control diagrams',
        '7. Develop points list',
        '8. Write sequence of operations'
      ],
      outputFormat: 'JSON object with controls design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pointCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pointCount: { type: 'number' },
        controlSequences: { type: 'array' },
        pointsList: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'controls', 'bas']
}));

export const energyAnalysisTask = defineTask('energy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Energy Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Energy Engineer',
      task: 'Perform HVAC energy analysis',
      context: {
        projectName: args.projectName,
        loadResult: args.loadResult,
        equipmentResult: args.equipmentResult,
        systemSelectionResult: args.systemSelectionResult,
        climateZone: args.climateZone,
        energyCode: args.energyCode,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Perform annual energy simulation',
        '2. Calculate annual HVAC energy consumption',
        '3. Calculate EUI (Energy Use Intensity)',
        '4. Compare to energy code baseline',
        '5. Identify energy conservation measures',
        '6. Calculate utility costs',
        '7. Check ASHRAE 90.1 compliance',
        '8. Generate energy report'
      ],
      outputFormat: 'JSON object with energy analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'annualConsumption', 'eui', 'codeCompliant', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        annualConsumption: { type: 'number' },
        eui: { type: 'number' },
        euiTarget: { type: 'number' },
        codeCompliant: { type: 'boolean' },
        complianceIssues: { type: 'array' },
        recommendations: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'energy', 'ashrae-90.1']
}));

export const generateHVACReportTask = defineTask('generate-hvac-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate HVAC Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive HVAC design report',
      context: {
        projectName: args.projectName,
        buildingData: args.buildingData,
        zoningResult: args.zoningResult,
        loadResult: args.loadResult,
        ventilationResult: args.ventilationResult,
        systemSelectionResult: args.systemSelectionResult,
        equipmentResult: args.equipmentResult,
        airDistributionResult: args.airDistributionResult,
        pipingResult: args.pipingResult,
        controlsResult: args.controlsResult,
        energyResult: args.energyResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document design basis',
        '3. Present load calculations',
        '4. Present system selection',
        '5. Include equipment schedules',
        '6. Present duct and piping design',
        '7. Document controls sequences',
        '8. Include energy analysis',
        '9. List design drawings',
        '10. State conclusions'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'hvac', 'reporting']
}));
