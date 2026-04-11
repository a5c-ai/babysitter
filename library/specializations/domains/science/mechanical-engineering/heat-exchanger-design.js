/**
 * @process specializations/domains/science/mechanical-engineering/heat-exchanger-design
 * @description Heat Exchanger Design and Rating - Sizing and rating shell-and-tube, plate, and
 * air-cooled heat exchangers using TEMA standards and thermal design software to meet heat duty
 * and pressure drop requirements.
 * @inputs { projectName: string, exchangerType: string, hotSide: object, coldSide: object, heatDuty: number }
 * @outputs { success: boolean, designResults: object, sizing: object, performance: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/heat-exchanger-design', {
 *   projectName: 'Process Cooler Design',
 *   exchangerType: 'shell-and-tube',
 *   hotSide: { fluid: 'oil', inlet: 80, outlet: 50, flowRate: 5 },
 *   coldSide: { fluid: 'water', inlet: 25, outlet: 40, flowRate: 10 },
 *   heatDuty: 150000
 * });
 *
 * @references
 * - TEMA Standards: https://www.tema.org/
 * - Heat Exchanger Design Handbook: https://www.begellhouse.com/
 * - Process Heat Transfer by Kern
 * - HTRI Software: https://www.htri.net/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    exchangerType = 'shell-and-tube', // 'shell-and-tube', 'plate', 'air-cooled', 'double-pipe'
    hotSide = {},
    coldSide = {},
    heatDuty,
    pressureDropLimits = {},
    foulingFactors = {},
    designMargin = 1.15,
    outputDir = 'heat-exchanger-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Heat Exchanger Design for ${projectName}`);
  ctx.log('info', `Type: ${exchangerType}, Heat Duty: ${heatDuty} W`);

  // ============================================================================
  // PHASE 1: THERMAL REQUIREMENTS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Thermal Requirements Definition');

  const requirementsResult = await ctx.task(hxRequirementsTask, {
    projectName,
    exchangerType,
    hotSide,
    coldSide,
    heatDuty,
    designMargin,
    outputDir
  });

  artifacts.push(...requirementsResult.artifacts);

  ctx.log('info', `Requirements defined - LMTD: ${requirementsResult.lmtd}C`);

  // ============================================================================
  // PHASE 2: FLUID PROPERTY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Fluid Property Evaluation');

  const fluidPropsResult = await ctx.task(fluidPropertiesTask, {
    projectName,
    hotSide,
    coldSide,
    outputDir
  });

  artifacts.push(...fluidPropsResult.artifacts);

  ctx.log('info', `Fluid properties evaluated for both streams`);

  // ============================================================================
  // PHASE 3: PRELIMINARY SIZING
  // ============================================================================

  ctx.log('info', 'Phase 3: Preliminary Sizing');

  const prelimSizingResult = await ctx.task(preliminarySizingTask, {
    projectName,
    exchangerType,
    requirementsResult,
    fluidPropsResult,
    outputDir
  });

  artifacts.push(...prelimSizingResult.artifacts);

  ctx.log('info', `Preliminary sizing - Area: ${prelimSizingResult.estimatedArea} m^2`);

  // Breakpoint: Review preliminary sizing
  await ctx.breakpoint({
    question: `Preliminary sizing complete. Estimated area: ${prelimSizingResult.estimatedArea} m^2, U: ${prelimSizingResult.overallU} W/m^2K. Proceed with detailed design?`,
    title: 'Preliminary Sizing Review',
    context: {
      runId: ctx.runId,
      preliminarySizing: prelimSizingResult.summary,
      assumptions: prelimSizingResult.assumptions,
      files: prelimSizingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: DETAILED THERMAL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Detailed Thermal Design');

  const thermalDesignResult = await ctx.task(detailedThermalDesignTask, {
    projectName,
    exchangerType,
    requirementsResult,
    fluidPropsResult,
    prelimSizingResult,
    foulingFactors,
    outputDir
  });

  artifacts.push(...thermalDesignResult.artifacts);

  ctx.log('info', `Thermal design complete - Actual area: ${thermalDesignResult.actualArea} m^2`);

  // ============================================================================
  // PHASE 5: HYDRAULIC DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Hydraulic Design');

  const hydraulicResult = await ctx.task(hydraulicDesignTask, {
    projectName,
    exchangerType,
    thermalDesignResult,
    fluidPropsResult,
    pressureDropLimits,
    outputDir
  });

  artifacts.push(...hydraulicResult.artifacts);

  ctx.log('info', `Hydraulic design complete - Shell dP: ${hydraulicResult.shellPressureDrop} kPa, Tube dP: ${hydraulicResult.tubePressureDrop} kPa`);

  // Quality Gate: Pressure drop limits
  if (hydraulicResult.shellPressureDrop > pressureDropLimits.shell ||
      hydraulicResult.tubePressureDrop > pressureDropLimits.tube) {
    await ctx.breakpoint({
      question: `Pressure drop exceeds limits. Shell: ${hydraulicResult.shellPressureDrop}/${pressureDropLimits.shell} kPa, Tube: ${hydraulicResult.tubePressureDrop}/${pressureDropLimits.tube} kPa. Modify design?`,
      title: 'Pressure Drop Warning',
      context: {
        runId: ctx.runId,
        pressureDrops: {
          shell: hydraulicResult.shellPressureDrop,
          tube: hydraulicResult.tubePressureDrop
        },
        limits: pressureDropLimits,
        suggestions: hydraulicResult.suggestions,
        files: hydraulicResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: MECHANICAL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Mechanical Design');

  const mechanicalResult = await ctx.task(mechanicalDesignTask, {
    projectName,
    exchangerType,
    thermalDesignResult,
    hydraulicResult,
    outputDir
  });

  artifacts.push(...mechanicalResult.artifacts);

  ctx.log('info', `Mechanical design complete - TEMA type: ${mechanicalResult.temaType}`);

  // ============================================================================
  // PHASE 7: PERFORMANCE RATING
  // ============================================================================

  ctx.log('info', 'Phase 7: Performance Rating');

  const ratingResult = await ctx.task(performanceRatingTask, {
    projectName,
    thermalDesignResult,
    hydraulicResult,
    mechanicalResult,
    designMargin,
    outputDir
  });

  artifacts.push(...ratingResult.artifacts);

  ctx.log('info', `Performance rating - Excess area: ${ratingResult.excessArea}%`);

  // ============================================================================
  // PHASE 8: GENERATE DESIGN REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Heat Exchanger Report');

  const reportResult = await ctx.task(generateHXReportTask, {
    projectName,
    exchangerType,
    requirementsResult,
    fluidPropsResult,
    prelimSizingResult,
    thermalDesignResult,
    hydraulicResult,
    mechanicalResult,
    ratingResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Heat Exchanger Design Complete for ${projectName}. Type: ${mechanicalResult.temaType}, Area: ${thermalDesignResult.actualArea} m^2, Excess: ${ratingResult.excessArea}%. Approve design?`,
    title: 'Heat Exchanger Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        temaType: mechanicalResult.temaType,
        heatDuty,
        area: thermalDesignResult.actualArea,
        overallU: thermalDesignResult.overallU,
        excessArea: ratingResult.excessArea
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'HX Design Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    exchangerType,
    designResults: {
      temaType: mechanicalResult.temaType,
      heatDuty,
      lmtd: requirementsResult.lmtd,
      overallU: thermalDesignResult.overallU
    },
    sizing: {
      area: thermalDesignResult.actualArea,
      shellDiameter: mechanicalResult.shellDiameter,
      tubeLength: mechanicalResult.tubeLength,
      tubeCount: mechanicalResult.tubeCount,
      baffleCount: mechanicalResult.baffleCount
    },
    performance: {
      excessArea: ratingResult.excessArea,
      shellPressureDrop: hydraulicResult.shellPressureDrop,
      tubePressureDrop: hydraulicResult.tubePressureDrop,
      effectiveness: ratingResult.effectiveness
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/heat-exchanger-design',
      processSlug: 'heat-exchanger-design',
      category: 'mechanical-engineering',
      timestamp: startTime,
      exchangerType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hxRequirementsTask = defineTask('hx-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `HX Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Define heat exchanger thermal requirements',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        hotSide: args.hotSide,
        coldSide: args.coldSide,
        heatDuty: args.heatDuty,
        designMargin: args.designMargin,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify heat balance:',
        '   Q = m_dot * Cp * deltaT (both sides)',
        '2. Calculate LMTD for counterflow:',
        '   LMTD = (deltaT1 - deltaT2) / ln(deltaT1/deltaT2)',
        '3. Apply LMTD correction factor for shell passes',
        '4. Determine temperature approach',
        '5. Identify controlling resistance',
        '6. Define design heat duty with margin',
        '7. Check for temperature cross',
        '8. Document design basis'
      ],
      outputFormat: 'JSON object with thermal requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'lmtd', 'designHeatDuty', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        lmtd: { type: 'number' },
        lmtdCorrectionFactor: { type: 'number' },
        designHeatDuty: { type: 'number' },
        temperatureApproach: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'requirements']
}));

export const fluidPropertiesTask = defineTask('fluid-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fluid Properties - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Transfer Specialist',
      task: 'Evaluate fluid properties for heat exchanger design',
      context: {
        projectName: args.projectName,
        hotSide: args.hotSide,
        coldSide: args.coldSide,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Obtain fluid properties at bulk temperatures:',
        '   - Density (rho)',
        '   - Specific heat (Cp)',
        '   - Thermal conductivity (k)',
        '   - Dynamic viscosity (mu)',
        '2. Calculate Prandtl number: Pr = Cp*mu/k',
        '3. Evaluate wall temperature correction',
        '4. Check for phase change regions',
        '5. Identify fouling fluid',
        '6. Determine fluid allocation (shell vs tube)',
        '7. Document property sources'
      ],
      outputFormat: 'JSON object with fluid properties'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hotSideProps', 'coldSideProps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hotSideProps: { type: 'object' },
        coldSideProps: { type: 'object' },
        fluidAllocation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'fluid-properties']
}));

export const preliminarySizingTask = defineTask('preliminary-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Preliminary Sizing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Perform preliminary heat exchanger sizing',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        requirementsResult: args.requirementsResult,
        fluidPropsResult: args.fluidPropsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assume overall heat transfer coefficient U',
        '2. Calculate preliminary area:',
        '   A = Q / (U * LMTD_corrected)',
        '3. Select preliminary geometry:',
        '   - Tube diameter and pitch',
        '   - Shell diameter',
        '   - Baffle spacing',
        '4. Estimate number of tubes',
        '5. Estimate tube length',
        '6. Check aspect ratios',
        '7. Document assumptions'
      ],
      outputFormat: 'JSON object with preliminary sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimatedArea', 'overallU', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimatedArea: { type: 'number' },
        overallU: { type: 'number' },
        preliminaryGeometry: { type: 'object' },
        assumptions: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'sizing']
}));

export const detailedThermalDesignTask = defineTask('detailed-thermal-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detailed Thermal Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Perform detailed thermal design calculations',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        requirementsResult: args.requirementsResult,
        fluidPropsResult: args.fluidPropsResult,
        prelimSizingResult: args.prelimSizingResult,
        foulingFactors: args.foulingFactors,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate tube-side heat transfer coefficient:',
        '   - Reynolds number',
        '   - Nusselt number correlation',
        '   - hi = Nu * k / D',
        '2. Calculate shell-side heat transfer coefficient:',
        '   - Kern method or Bell-Delaware',
        '   - ho based on geometry',
        '3. Calculate tube wall resistance',
        '4. Add fouling resistances',
        '5. Calculate overall U:',
        '   1/U = 1/ho + Rfo + Rw + Rfi + (Ao/Ai)/hi',
        '6. Calculate required area',
        '7. Select actual geometry',
        '8. Calculate actual area'
      ],
      outputFormat: 'JSON object with detailed thermal design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actualArea', 'overallU', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actualArea: { type: 'number' },
        overallU: { type: 'number' },
        tubeSideHTC: { type: 'number' },
        shellSideHTC: { type: 'number' },
        resistanceBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'thermal-design']
}));

export const hydraulicDesignTask = defineTask('hydraulic-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hydraulic Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Calculate pressure drops',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        thermalDesignResult: args.thermalDesignResult,
        fluidPropsResult: args.fluidPropsResult,
        pressureDropLimits: args.pressureDropLimits,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate tube-side pressure drop:',
        '   - Friction in tubes',
        '   - Return losses',
        '   - Nozzle losses',
        '2. Calculate shell-side pressure drop:',
        '   - Crossflow through bundle',
        '   - Window flow',
        '   - End zone losses',
        '   - Nozzle losses',
        '3. Compare to limits',
        '4. Suggest modifications if exceeded',
        '5. Calculate pumping power',
        '6. Document calculations'
      ],
      outputFormat: 'JSON object with hydraulic design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'shellPressureDrop', 'tubePressureDrop', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        shellPressureDrop: { type: 'number' },
        tubePressureDrop: { type: 'number' },
        pressureDropBreakdown: { type: 'object' },
        pumpingPower: { type: 'object' },
        suggestions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'hydraulics']
}));

export const mechanicalDesignTask = defineTask('mechanical-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Define mechanical design per TEMA',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        thermalDesignResult: args.thermalDesignResult,
        hydraulicResult: args.hydraulicResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select TEMA type (AES, BEM, etc.)',
        '2. Define shell specifications:',
        '   - Diameter',
        '   - Wall thickness',
        '   - Material',
        '3. Define tube specifications:',
        '   - OD, thickness, length',
        '   - Material',
        '   - Pitch and layout',
        '4. Design tube sheet:',
        '   - Thickness calculation',
        '   - Tube attachment',
        '5. Design baffles:',
        '   - Type, spacing, cut',
        '6. Design nozzles',
        '7. Thermal expansion provisions',
        '8. Create data sheet'
      ],
      outputFormat: 'JSON object with mechanical design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'temaType', 'shellDiameter', 'tubeLength', 'tubeCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        temaType: { type: 'string' },
        shellDiameter: { type: 'number' },
        tubeLength: { type: 'number' },
        tubeCount: { type: 'number' },
        baffleCount: { type: 'number' },
        tubeSpecification: { type: 'object' },
        shellSpecification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'mechanical-design', 'tema']
}));

export const performanceRatingTask = defineTask('performance-rating', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Rating - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Heat Exchanger Design Specialist',
      task: 'Rate heat exchanger performance',
      context: {
        projectName: args.projectName,
        thermalDesignResult: args.thermalDesignResult,
        hydraulicResult: args.hydraulicResult,
        mechanicalResult: args.mechanicalResult,
        designMargin: args.designMargin,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate excess area:',
        '   Excess = (Actual - Required) / Required * 100',
        '2. Calculate effectiveness:',
        '   epsilon = Q_actual / Q_max',
        '3. Calculate NTU',
        '4. Verify design margin achieved',
        '5. Check off-design performance',
        '6. Calculate fouling margin',
        '7. Create performance summary'
      ],
      outputFormat: 'JSON object with performance rating'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'excessArea', 'effectiveness', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        excessArea: { type: 'number' },
        effectiveness: { type: 'number' },
        ntu: { type: 'number' },
        foulingMargin: { type: 'number' },
        performanceCurves: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'heat-exchanger', 'rating']
}));

export const generateHXReportTask = defineTask('generate-hx-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate HX Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive heat exchanger design report',
      context: {
        projectName: args.projectName,
        exchangerType: args.exchangerType,
        requirementsResult: args.requirementsResult,
        fluidPropsResult: args.fluidPropsResult,
        prelimSizingResult: args.prelimSizingResult,
        thermalDesignResult: args.thermalDesignResult,
        hydraulicResult: args.hydraulicResult,
        mechanicalResult: args.mechanicalResult,
        ratingResult: args.ratingResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document design basis and requirements',
        '3. Present thermal design calculations',
        '4. Present hydraulic design',
        '5. Show mechanical specification',
        '6. Include TEMA data sheet',
        '7. Present performance rating',
        '8. Document design margins',
        '9. Include specification drawings',
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
  labels: ['mechanical-engineering', 'heat-exchanger', 'reporting']
}));
