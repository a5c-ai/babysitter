/**
 * @process specializations/domains/science/mechanical-engineering/fatigue-life-prediction
 * @description Fatigue Life Prediction - Assessing component durability under cyclic loading using
 * stress-life (S-N), strain-life (epsilon-N), or fracture mechanics approaches, including load
 * spectrum development and damage accumulation analysis per Miner's rule.
 * @inputs { projectName: string, componentName: string, material: object, loadSpectrum: array, geometry: object }
 * @outputs { success: boolean, fatigueLife: number, damageAccumulation: number, safetyFactor: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/fatigue-life-prediction', {
 *   projectName: 'Crankshaft Fatigue Analysis',
 *   componentName: 'Main Bearing Journal',
 *   material: { name: 'Steel 4340', Su: 1100, Sy: 1000, Se: 450 },
 *   loadSpectrum: [{ amplitude: 300, cycles: 1e6 }, { amplitude: 450, cycles: 1e4 }],
 *   geometry: { Kt: 2.1, notchRadius: 2.5 }
 * });
 *
 * @references
 * - Deformation and Fracture Mechanics: https://www.wiley.com/en-us/Deformation+and+Fracture+Mechanics+of+Engineering+Materials
 * - Shigley's Mechanical Engineering Design: Chapter 6 - Fatigue Failure
 * - SAE Fatigue Design Handbook: https://www.sae.org/
 * - FKM Guideline: https://www.vdma.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    componentName,
    material = {},
    loadSpectrum = [],
    geometry = {},
    stressState = 'uniaxial', // 'uniaxial', 'biaxial', 'multiaxial'
    analysisMethod = 'stress-life', // 'stress-life', 'strain-life', 'fracture-mechanics'
    surfaceCondition = 'machined',
    reliabilityFactor = 0.90,
    temperatureEffect = null,
    designLife = 1e6,
    outputDir = 'fatigue-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Fatigue Life Prediction for ${projectName}`);
  ctx.log('info', `Component: ${componentName}, Method: ${analysisMethod}`);

  // ============================================================================
  // PHASE 1: LOAD SPECTRUM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Load Spectrum Analysis');

  const spectrumResult = await ctx.task(loadSpectrumAnalysisTask, {
    projectName,
    componentName,
    loadSpectrum,
    outputDir
  });

  artifacts.push(...spectrumResult.artifacts);

  ctx.log('info', `Load spectrum analyzed - ${spectrumResult.cycleCount} cycles, ${spectrumResult.blockCount} load blocks`);

  // Breakpoint: Review load spectrum
  await ctx.breakpoint({
    question: `Load spectrum analysis complete. Total cycles: ${spectrumResult.cycleCount}, Max amplitude: ${spectrumResult.maxAmplitude} MPa, Mean stress range: ${spectrumResult.meanStressRange} MPa. Review spectrum?`,
    title: 'Load Spectrum Review',
    context: {
      runId: ctx.runId,
      spectrumSummary: spectrumResult.summary,
      rainflowCounts: spectrumResult.rainflowCounts,
      files: spectrumResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: MATERIAL FATIGUE PROPERTIES
  // ============================================================================

  ctx.log('info', 'Phase 2: Material Fatigue Properties');

  const materialResult = await ctx.task(fatigueMaterialPropertiesTask, {
    projectName,
    material,
    analysisMethod,
    temperatureEffect,
    outputDir
  });

  artifacts.push(...materialResult.artifacts);

  ctx.log('info', `Material properties established - Se': ${materialResult.enduranceLimit} MPa`);

  // ============================================================================
  // PHASE 3: MODIFICATION FACTORS
  // ============================================================================

  ctx.log('info', 'Phase 3: Modification Factors Calculation');

  const modFactorsResult = await ctx.task(modificationFactorsTask, {
    projectName,
    material,
    geometry,
    surfaceCondition,
    reliabilityFactor,
    temperatureEffect,
    stressState,
    outputDir
  });

  artifacts.push(...modFactorsResult.artifacts);

  ctx.log('info', `Modification factors calculated - Combined factor: ${modFactorsResult.combinedFactor}`);

  // ============================================================================
  // PHASE 4: CORRECTED ENDURANCE LIMIT
  // ============================================================================

  ctx.log('info', 'Phase 4: Corrected Endurance Limit');

  const enduranceResult = await ctx.task(correctedEnduranceTask, {
    projectName,
    materialResult,
    modFactorsResult,
    outputDir
  });

  artifacts.push(...enduranceResult.artifacts);

  ctx.log('info', `Corrected endurance limit: Se = ${enduranceResult.correctedEndurance} MPa`);

  // ============================================================================
  // PHASE 5: STRESS CONCENTRATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Stress Concentration Analysis');

  const stressConcentrationResult = await ctx.task(stressConcentrationTask, {
    projectName,
    geometry,
    material,
    outputDir
  });

  artifacts.push(...stressConcentrationResult.artifacts);

  ctx.log('info', `Fatigue stress concentration factor Kf = ${stressConcentrationResult.Kf}`);

  // ============================================================================
  // PHASE 6: S-N CURVE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: S-N Curve Development');

  const snCurveResult = await ctx.task(snCurveDevelopmentTask, {
    projectName,
    material,
    enduranceResult,
    stressConcentrationResult,
    analysisMethod,
    outputDir
  });

  artifacts.push(...snCurveResult.artifacts);

  ctx.log('info', `S-N curve developed - Slope b = ${snCurveResult.slope}`);

  // Breakpoint: Review S-N curve
  await ctx.breakpoint({
    question: `S-N curve developed. Endurance limit: ${snCurveResult.enduranceLimit} MPa at ${snCurveResult.enduranceCycles} cycles. Slope: ${snCurveResult.slope}. Review curve parameters?`,
    title: 'S-N Curve Review',
    context: {
      runId: ctx.runId,
      snCurveParams: snCurveResult.parameters,
      files: snCurveResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: MEAN STRESS CORRECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Mean Stress Correction');

  const meanStressResult = await ctx.task(meanStressCorrectionTask, {
    projectName,
    spectrumResult,
    material,
    snCurveResult,
    outputDir
  });

  artifacts.push(...meanStressResult.artifacts);

  ctx.log('info', `Mean stress correction applied using ${meanStressResult.method}`);

  // ============================================================================
  // PHASE 8: DAMAGE ACCUMULATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Damage Accumulation Analysis');

  const damageResult = await ctx.task(damageAccumulationTask, {
    projectName,
    spectrumResult,
    snCurveResult,
    meanStressResult,
    outputDir
  });

  artifacts.push(...damageResult.artifacts);

  ctx.log('info', `Damage accumulation: D = ${damageResult.totalDamage}`);

  // Quality Gate: Damage exceeds 1.0
  if (damageResult.totalDamage > 1.0) {
    await ctx.breakpoint({
      question: `Cumulative damage D = ${damageResult.totalDamage} exceeds 1.0. Fatigue failure predicted before design life. Primary contributor: ${damageResult.primaryContributor}. Review damage breakdown?`,
      title: 'Fatigue Failure Predicted',
      context: {
        runId: ctx.runId,
        totalDamage: damageResult.totalDamage,
        damageBreakdown: damageResult.damageBreakdown,
        primaryContributor: damageResult.primaryContributor,
        files: damageResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: FATIGUE LIFE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Fatigue Life Calculation');

  const lifeResult = await ctx.task(fatigueLifeCalculationTask, {
    projectName,
    damageResult,
    spectrumResult,
    designLife,
    outputDir
  });

  artifacts.push(...lifeResult.artifacts);

  ctx.log('info', `Predicted fatigue life: ${lifeResult.predictedLife} cycles`);

  // ============================================================================
  // PHASE 10: SAFETY FACTOR AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Safety Factor and Reporting');

  const reportResult = await ctx.task(generateFatigueReportTask, {
    projectName,
    componentName,
    material,
    loadSpectrum,
    spectrumResult,
    materialResult,
    modFactorsResult,
    enduranceResult,
    stressConcentrationResult,
    snCurveResult,
    meanStressResult,
    damageResult,
    lifeResult,
    designLife,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  const fatigueSF = lifeResult.predictedLife / designLife;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Fatigue Analysis Complete for ${componentName}. Predicted life: ${lifeResult.predictedLife} cycles. Safety factor: ${fatigueSF.toFixed(2)}. Damage per block: ${damageResult.damagePerBlock}. Approve analysis?`,
    title: 'Fatigue Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        componentName,
        predictedLife: lifeResult.predictedLife,
        designLife,
        safetyFactor: fatigueSF,
        totalDamage: damageResult.totalDamage,
        enduranceLimit: enduranceResult.correctedEndurance
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Fatigue Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    componentName,
    fatigueLife: lifeResult.predictedLife,
    damageAccumulation: damageResult.totalDamage,
    safetyFactor: fatigueSF,
    analysisResults: {
      enduranceLimit: enduranceResult.correctedEndurance,
      Kf: stressConcentrationResult.Kf,
      snCurveSlope: snCurveResult.slope,
      damagePerBlock: damageResult.damagePerBlock
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/fatigue-life-prediction',
      processSlug: 'fatigue-life-prediction',
      category: 'mechanical-engineering',
      timestamp: startTime,
      analysisMethod
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const loadSpectrumAnalysisTask = defineTask('load-spectrum-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Load Spectrum Analysis - ${args.componentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Analyze and process fatigue load spectrum',
      context: {
        projectName: args.projectName,
        componentName: args.componentName,
        loadSpectrum: args.loadSpectrum,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate load spectrum data',
        '2. Perform rainflow cycle counting if time history provided',
        '3. Identify mean and alternating stress components',
        '4. Create cycle count histogram',
        '5. Calculate spectrum statistics:',
        '   - Maximum amplitude',
        '   - Mean stress range',
        '   - Total cycle count',
        '6. Group similar amplitude cycles into blocks',
        '7. Arrange spectrum in decreasing amplitude order',
        '8. Validate against operating conditions',
        '9. Plot load spectrum',
        '10. Document spectrum development'
      ],
      outputFormat: 'JSON object with load spectrum analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cycleCount', 'blockCount', 'maxAmplitude', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cycleCount: { type: 'number' },
        blockCount: { type: 'number' },
        maxAmplitude: { type: 'number' },
        meanStressRange: { type: 'string' },
        rainflowCounts: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'load-spectrum', 'rainflow']
}));

export const fatigueMaterialPropertiesTask = defineTask('fatigue-material-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Material Properties - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Specialist',
      task: 'Establish fatigue material properties',
      context: {
        projectName: args.projectName,
        material: args.material,
        analysisMethod: args.analysisMethod,
        temperatureEffect: args.temperatureEffect,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Obtain/estimate S-N curve parameters:',
        '   - Ultimate tensile strength (Su)',
        '   - Yield strength (Sy)',
        '   - Endurance limit (Se\') at 10^6 cycles',
        '2. For strain-life: get epsilon-N parameters',
        '   - Fatigue strength coefficient (sigma_f\')',
        '   - Fatigue ductility coefficient (epsilon_f\')',
        '   - Fatigue strength exponent (b)',
        '   - Fatigue ductility exponent (c)',
        '3. For fracture mechanics: get Paris law constants',
        '4. Apply temperature derating if needed',
        '5. Document material data sources',
        '6. Estimate properties if test data unavailable',
        '7. Create material fatigue card'
      ],
      outputFormat: 'JSON object with fatigue material properties'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'enduranceLimit', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        enduranceLimit: { type: 'number' },
        fatigueStrengthCoeff: { type: 'number' },
        fatigueStrengthExp: { type: 'number' },
        fatigueDuctilityCoeff: { type: 'number' },
        fatigueDuctilityExp: { type: 'number' },
        dataSource: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'materials']
}));

export const modificationFactorsTask = defineTask('modification-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Modification Factors - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Calculate fatigue modification factors',
      context: {
        projectName: args.projectName,
        material: args.material,
        geometry: args.geometry,
        surfaceCondition: args.surfaceCondition,
        reliabilityFactor: args.reliabilityFactor,
        temperatureEffect: args.temperatureEffect,
        stressState: args.stressState,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate surface finish factor (ka):',
        '   - Based on surface roughness and Su',
        '2. Calculate size factor (kb):',
        '   - Based on equivalent diameter',
        '3. Calculate load factor (kc):',
        '   - 1.0 for bending, 0.85 for axial, 0.59 for torsion',
        '4. Calculate temperature factor (kd)',
        '5. Calculate reliability factor (ke)',
        '6. Calculate miscellaneous factor (kf)',
        '7. Calculate combined modification factor',
        '8. Document all factor calculations',
        '9. Reference applicable standards'
      ],
      outputFormat: 'JSON object with modification factors'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'combinedFactor', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        surfaceFactor: { type: 'number' },
        sizeFactor: { type: 'number' },
        loadFactor: { type: 'number' },
        temperatureFactor: { type: 'number' },
        reliabilityFactor: { type: 'number' },
        miscFactor: { type: 'number' },
        combinedFactor: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'modification-factors']
}));

export const correctedEnduranceTask = defineTask('corrected-endurance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Corrected Endurance Limit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Calculate corrected endurance limit',
      context: {
        projectName: args.projectName,
        materialResult: args.materialResult,
        modFactorsResult: args.modFactorsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply Marin equation:',
        '   Se = ka * kb * kc * kd * ke * kf * Se\'',
        '2. Verify reasonableness of result',
        '3. Compare with published data if available',
        '4. Document calculation',
        '5. Note any conservatism in approach'
      ],
      outputFormat: 'JSON object with corrected endurance limit'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'correctedEndurance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        correctedEndurance: { type: 'number' },
        originalEndurance: { type: 'number' },
        reductionRatio: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'endurance-limit']
}));

export const stressConcentrationTask = defineTask('stress-concentration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stress Concentration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Calculate fatigue stress concentration factor',
      context: {
        projectName: args.projectName,
        geometry: args.geometry,
        material: args.material,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify stress concentration features',
        '2. Determine theoretical stress concentration factor Kt',
        '3. Calculate notch sensitivity q:',
        '   - Using Peterson or Neuber equation',
        '   - Based on notch radius and material',
        '4. Calculate fatigue stress concentration factor:',
        '   Kf = 1 + q(Kt - 1)',
        '5. Handle multiple stress concentrations',
        '6. Document Kt source (chart, FEA, handbook)',
        '7. Create stress concentration summary'
      ],
      outputFormat: 'JSON object with stress concentration factors'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'Kt', 'Kf', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        Kt: { type: 'number' },
        notchSensitivity: { type: 'number' },
        Kf: { type: 'number' },
        notchRadius: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'stress-concentration']
}));

export const snCurveDevelopmentTask = defineTask('sn-curve-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `S-N Curve Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Develop component S-N curve',
      context: {
        projectName: args.projectName,
        material: args.material,
        enduranceResult: args.enduranceResult,
        stressConcentrationResult: args.stressConcentrationResult,
        analysisMethod: args.analysisMethod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define S-N curve anchor points:',
        '   - 10^3 cycles: approximately 0.9*Su',
        '   - 10^6 cycles: corrected Se',
        '2. Calculate slope in log-log space:',
        '   b = (log(S_1e3) - log(Se)) / (log(1e3) - log(1e6))',
        '3. Apply stress concentration to curve',
        '4. Define endurance limit cutoff',
        '5. Handle low-cycle fatigue region',
        '6. Create S-N curve equation',
        '7. Plot S-N curve with confidence bands',
        '8. Tabulate S-N data points'
      ],
      outputFormat: 'JSON object with S-N curve parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'slope', 'enduranceLimit', 'enduranceCycles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        slope: { type: 'number' },
        intercept: { type: 'number' },
        enduranceLimit: { type: 'number' },
        enduranceCycles: { type: 'number' },
        parameters: { type: 'object' },
        snDataPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'sn-curve']
}));

export const meanStressCorrectionTask = defineTask('mean-stress-correction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mean Stress Correction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Apply mean stress correction',
      context: {
        projectName: args.projectName,
        spectrumResult: args.spectrumResult,
        material: args.material,
        snCurveResult: args.snCurveResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select mean stress correction method:',
        '   - Goodman (conservative for ductile)',
        '   - Gerber (less conservative)',
        '   - Soderberg (very conservative)',
        '   - Morrow (strain-life approach)',
        '2. Apply correction to each load block:',
        '   Sa_eq = Sa / (1 - Sm/Su) for Goodman',
        '3. Plot modified Goodman diagram',
        '4. Calculate equivalent fully-reversed stress',
        '5. Handle compressive mean stress',
        '6. Document correction approach'
      ],
      outputFormat: 'JSON object with mean stress correction'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'method', 'correctedAmplitudes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        method: { type: 'string' },
        correctedAmplitudes: { type: 'array' },
        goodmanDiagram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'mean-stress']
}));

export const damageAccumulationTask = defineTask('damage-accumulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Damage Accumulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Calculate cumulative fatigue damage',
      context: {
        projectName: args.projectName,
        spectrumResult: args.spectrumResult,
        snCurveResult: args.snCurveResult,
        meanStressResult: args.meanStressResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply Palmgren-Miner linear damage rule:',
        '   D = sum(ni / Ni)',
        '2. For each load block:',
        '   - Determine allowable cycles Ni from S-N curve',
        '   - Calculate damage fraction di = ni/Ni',
        '3. Sum damage fractions',
        '4. Create damage breakdown by load level',
        '5. Identify primary damage contributor',
        '6. Handle cycles below endurance limit',
        '7. Consider sequence effects if applicable',
        '8. Document damage calculation'
      ],
      outputFormat: 'JSON object with damage accumulation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalDamage', 'damageBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalDamage: { type: 'number' },
        damagePerBlock: { type: 'number' },
        damageBreakdown: { type: 'array' },
        primaryContributor: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'damage-accumulation', 'miners-rule']
}));

export const fatigueLifeCalculationTask = defineTask('fatigue-life-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Life Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Calculate predicted fatigue life',
      context: {
        projectName: args.projectName,
        damageResult: args.damageResult,
        spectrumResult: args.spectrumResult,
        designLife: args.designLife,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate blocks to failure:',
        '   Blocks = 1 / damage_per_block',
        '2. Convert to total cycles',
        '3. Calculate safety factor vs design life',
        '4. Express life in appropriate units (cycles, hours, missions)',
        '5. Provide confidence interval if applicable',
        '6. Compare to design requirements',
        '7. Document life prediction'
      ],
      outputFormat: 'JSON object with fatigue life prediction'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'predictedLife', 'blocksToFailure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        predictedLife: { type: 'number' },
        blocksToFailure: { type: 'number' },
        lifeUnits: { type: 'string' },
        confidenceLevel: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fatigue', 'life-prediction']
}));

export const generateFatigueReportTask = defineTask('generate-fatigue-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Fatigue Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive fatigue analysis report',
      context: {
        projectName: args.projectName,
        componentName: args.componentName,
        material: args.material,
        loadSpectrum: args.loadSpectrum,
        spectrumResult: args.spectrumResult,
        materialResult: args.materialResult,
        modFactorsResult: args.modFactorsResult,
        enduranceResult: args.enduranceResult,
        stressConcentrationResult: args.stressConcentrationResult,
        snCurveResult: args.snCurveResult,
        meanStressResult: args.meanStressResult,
        damageResult: args.damageResult,
        lifeResult: args.lifeResult,
        designLife: args.designLife,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document component and material',
        '3. Present load spectrum analysis',
        '4. Show modification factor calculations',
        '5. Present S-N curve development',
        '6. Show damage accumulation calculation',
        '7. Present fatigue life prediction',
        '8. Compare with design requirements',
        '9. State conclusions and recommendations',
        '10. Include all supporting calculations'
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
  labels: ['mechanical-engineering', 'fatigue', 'reporting']
}));
