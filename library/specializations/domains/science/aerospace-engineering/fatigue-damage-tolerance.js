/**
 * @process specializations/domains/science/aerospace-engineering/fatigue-damage-tolerance
 * @description Process for assessing structural fatigue life and damage tolerance including crack growth analysis,
 * inspection intervals, and certification compliance.
 * @inputs { projectName: string, structureDefinition: object, loadSpectrum: object, materialData?: object }
 * @outputs { success: boolean, fatigueLife: object, crackGrowthAnalysis: object, inspectionPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/fatigue-damage-tolerance', {
 *   projectName: 'Wing Lower Panel DT Analysis',
 *   structureDefinition: { component: 'wing-lower-panel', material: 'Al-2024-T3' },
 *   loadSpectrum: { type: 'flight-by-flight', source: 'spectrum.csv' }
 * });
 *
 * @references
 * - FAR 25.571 Damage Tolerance Requirements
 * - JSSG-2006 Aircraft Structures
 * - NASGRO Crack Growth Manual
 * - MIL-HDBK-5J Material Properties
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    structureDefinition,
    loadSpectrum,
    materialData = {}
  } = inputs;

  // Phase 1: Structure and Load Definition
  const structureAnalysis = await ctx.task(structureDefinitionTask, {
    projectName,
    structureDefinition,
    loadSpectrum
  });

  // Phase 2: Material Fatigue Data
  const fatigueData = await ctx.task(fatigueMaterialDataTask, {
    projectName,
    material: structureDefinition.material,
    materialData,
    environment: structureDefinition.environment
  });

  // Phase 3: Stress Spectrum Development
  const stressSpectrum = await ctx.task(stressSpectrumTask, {
    projectName,
    structureAnalysis,
    loadSpectrum,
    stressConcentrations: structureAnalysis.stressConcentrations
  });

  // Breakpoint: Spectrum review
  await ctx.breakpoint({
    question: `Review stress spectrum for ${projectName}. Max stress: ${stressSpectrum.maxStress} ksi. Proceed with fatigue analysis?`,
    title: 'Stress Spectrum Review',
    context: {
      runId: ctx.runId,
      spectrum: stressSpectrum,
      cycleCount: stressSpectrum.totalCycles
    }
  });

  // Phase 4: Safe-Life Fatigue Analysis
  const safeLifeAnalysis = await ctx.task(safeLifeAnalysisTask, {
    projectName,
    stressSpectrum,
    fatigueData,
    scatterFactor: inputs.scatterFactor
  });

  // Phase 5: Initial Flaw Assumption
  const initialFlawAssumption = await ctx.task(initialFlawTask, {
    projectName,
    structureDefinition,
    inspectionCapability: inputs.inspectionCapability
  });

  // Phase 6: Crack Growth Analysis
  const crackGrowthAnalysis = await ctx.task(crackGrowthAnalysisTask, {
    projectName,
    structureAnalysis,
    stressSpectrum,
    fatigueData,
    initialFlaw: initialFlawAssumption
  });

  // Quality Gate: Critical crack size
  if (crackGrowthAnalysis.criticalCrackSize < initialFlawAssumption.initialFlawSize * 2) {
    await ctx.breakpoint({
      question: `Critical crack size (${crackGrowthAnalysis.criticalCrackSize}) close to initial flaw. Review structure or accept?`,
      title: 'Critical Crack Size Warning',
      context: {
        runId: ctx.runId,
        crackGrowthAnalysis,
        recommendation: 'Consider redesign or enhanced inspection'
      }
    });
  }

  // Phase 7: Residual Strength Analysis
  const residualStrength = await ctx.task(residualStrengthTask, {
    projectName,
    structureAnalysis,
    crackGrowthAnalysis,
    loadSpectrum
  });

  // Phase 8: Inspection Interval Determination
  const inspectionInterval = await ctx.task(inspectionIntervalTask, {
    projectName,
    crackGrowthAnalysis,
    inspectionCapability: inputs.inspectionCapability,
    safetyFactor: inputs.inspectionSafetyFactor
  });

  // Phase 9: Certification Compliance
  const certificationCompliance = await ctx.task(certificationComplianceTask, {
    projectName,
    safeLifeAnalysis,
    crackGrowthAnalysis,
    residualStrength,
    inspectionInterval,
    certificationBasis: inputs.certificationBasis
  });

  // Phase 10: Report Generation
  const reportGeneration = await ctx.task(dtReportTask, {
    projectName,
    structureAnalysis,
    fatigueData,
    safeLifeAnalysis,
    crackGrowthAnalysis,
    residualStrength,
    inspectionInterval,
    certificationCompliance
  });

  // Final Breakpoint: DT Analysis Approval
  await ctx.breakpoint({
    question: `DT analysis complete for ${projectName}. Safe life: ${safeLifeAnalysis.safeLife} flights. Inspection interval: ${inspectionInterval.interval} flights. Approve?`,
    title: 'DT Analysis Approval',
    context: {
      runId: ctx.runId,
      summary: {
        safeLife: safeLifeAnalysis.safeLife,
        inspectionInterval: inspectionInterval.interval,
        certificationStatus: certificationCompliance.status
      },
      files: [
        { path: 'artifacts/dt-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/dt-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    fatigueLife: {
      safeLife: safeLifeAnalysis.safeLife,
      meanLife: safeLifeAnalysis.meanLife,
      scatterFactor: safeLifeAnalysis.scatterFactor
    },
    crackGrowthAnalysis: {
      criticalCrackSize: crackGrowthAnalysis.criticalCrackSize,
      crackGrowthLife: crackGrowthAnalysis.crackGrowthLife,
      growthCurve: crackGrowthAnalysis.growthCurve
    },
    inspectionPlan: inspectionInterval,
    certification: certificationCompliance,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/fatigue-damage-tolerance',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task definitions following the same pattern...

export const structureDefinitionTask = defineTask('structure-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structure Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Fatigue Engineer',
      task: 'Define structure for fatigue and damage tolerance analysis',
      context: args,
      instructions: [
        '1. Define structural component geometry',
        '2. Identify critical locations and details',
        '3. Characterize stress concentrations (Kt factors)',
        '4. Define load paths and redundancy',
        '5. Identify fastener holes and cutouts',
        '6. Define material and processing',
        '7. Document manufacturing process effects',
        '8. Identify corrosion and environment factors',
        '9. Define boundary conditions',
        '10. Document structure criticality'
      ],
      outputFormat: 'JSON object with structure definition'
    },
    outputSchema: {
      type: 'object',
      required: ['geometry', 'criticalLocations', 'stressConcentrations'],
      properties: {
        geometry: { type: 'object' },
        criticalLocations: { type: 'array', items: { type: 'object' } },
        stressConcentrations: { type: 'array', items: { type: 'object' } },
        redundancy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'damage-tolerance', 'aerospace']
}));

export const fatigueMaterialDataTask = defineTask('fatigue-material-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fatigue Material Data - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Fatigue Specialist',
      task: 'Compile fatigue material properties',
      context: args,
      instructions: [
        '1. Gather S-N curve data for material',
        '2. Define strain-life properties if needed',
        '3. Compile crack growth rate data (da/dN vs deltaK)',
        '4. Define fracture toughness (Kc, KIc)',
        '5. Account for mean stress effects',
        '6. Apply environment corrections',
        '7. Define threshold stress intensity',
        '8. Apply data scatter factors',
        '9. Document data sources',
        '10. Create material fatigue card'
      ],
      outputFormat: 'JSON object with fatigue material data'
    },
    outputSchema: {
      type: 'object',
      required: ['snCurve', 'crackGrowthData', 'fractureToughness'],
      properties: {
        snCurve: { type: 'object' },
        crackGrowthData: { type: 'object' },
        fractureToughness: { type: 'number' },
        threshold: { type: 'number' },
        environmentFactors: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'materials', 'aerospace']
}));

export const stressSpectrumTask = defineTask('stress-spectrum', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stress Spectrum Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Loads and Fatigue Spectrum Engineer',
      task: 'Develop stress spectrum from load spectrum',
      context: args,
      instructions: [
        '1. Process load spectrum to stress spectrum',
        '2. Apply stress concentration factors',
        '3. Account for residual stresses',
        '4. Apply sequence counting method (rainflow)',
        '5. Develop exceedance curves',
        '6. Calculate equivalent constant amplitude',
        '7. Truncate low cycles per guidelines',
        '8. Apply ground-air-ground corrections',
        '9. Document spectrum statistics',
        '10. Create cycle-by-cycle spectrum file'
      ],
      outputFormat: 'JSON object with stress spectrum'
    },
    outputSchema: {
      type: 'object',
      required: ['maxStress', 'totalCycles', 'spectrum'],
      properties: {
        maxStress: { type: 'number' },
        minStress: { type: 'number' },
        totalCycles: { type: 'number' },
        spectrum: { type: 'object' },
        exceedanceCurve: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'spectrum', 'aerospace']
}));

export const safeLifeAnalysisTask = defineTask('safe-life-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safe-Life Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Life Analysis Engineer',
      task: 'Perform safe-life fatigue analysis',
      context: args,
      instructions: [
        '1. Apply Miner cumulative damage rule',
        '2. Calculate damage per spectrum block',
        '3. Sum damage to determine mean life',
        '4. Apply scatter factor for safe life',
        '5. Account for surface finish effects',
        '6. Consider fretting fatigue if applicable',
        '7. Validate against test data',
        '8. Document conservatisms',
        '9. Perform sensitivity analysis',
        '10. Calculate safe life with margin'
      ],
      outputFormat: 'JSON object with safe-life results'
    },
    outputSchema: {
      type: 'object',
      required: ['safeLife', 'meanLife', 'scatterFactor'],
      properties: {
        safeLife: { type: 'number' },
        meanLife: { type: 'number' },
        scatterFactor: { type: 'number' },
        damagePerFlight: { type: 'number' },
        criticalLocation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'safe-life', 'aerospace']
}));

export const initialFlawTask = defineTask('initial-flaw', (args, taskCtx) => ({
  kind: 'agent',
  title: `Initial Flaw Assumption - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NDI and Damage Tolerance Engineer',
      task: 'Define initial flaw assumptions',
      context: args,
      instructions: [
        '1. Review NDI capability for structure',
        '2. Define inspection method limitations',
        '3. Establish detectable flaw size',
        '4. Define initial manufacturing flaw',
        '5. Consider rogue flaw assumptions',
        '6. Account for continuing damage',
        '7. Define flaw geometry (corner, surface, through)',
        '8. Document flaw assumptions per regulations',
        '9. Consider multiple site damage',
        '10. Document initial flaw rationale'
      ],
      outputFormat: 'JSON object with initial flaw assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['initialFlawSize', 'flawGeometry'],
      properties: {
        initialFlawSize: { type: 'number' },
        flawGeometry: { type: 'string' },
        detectableFlawSize: { type: 'number' },
        ndiMethod: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'initial-flaw', 'aerospace']
}));

export const crackGrowthAnalysisTask = defineTask('crack-growth-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Crack Growth Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Crack Growth Analysis Engineer',
      task: 'Perform linear elastic fracture mechanics crack growth analysis',
      context: args,
      instructions: [
        '1. Calculate stress intensity factor solutions',
        '2. Apply beta factor corrections',
        '3. Integrate crack growth using Paris law or equivalent',
        '4. Account for retardation effects',
        '5. Calculate crack growth life to critical size',
        '6. Generate crack length vs flights curve',
        '7. Identify inspection thresholds',
        '8. Consider multi-path crack scenarios',
        '9. Validate with coupon or component data',
        '10. Document analysis methodology'
      ],
      outputFormat: 'JSON object with crack growth results'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalCrackSize', 'crackGrowthLife', 'growthCurve'],
      properties: {
        criticalCrackSize: { type: 'number' },
        crackGrowthLife: { type: 'number' },
        growthCurve: { type: 'array', items: { type: 'object' } },
        inspectionThreshold: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'crack-growth', 'aerospace']
}));

export const residualStrengthTask = defineTask('residual-strength', (args, taskCtx) => ({
  kind: 'agent',
  title: `Residual Strength Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Residual Strength Engineer',
      task: 'Perform residual strength analysis',
      context: args,
      instructions: [
        '1. Define limit load requirements',
        '2. Calculate residual strength vs crack size',
        '3. Apply fracture toughness criteria',
        '4. Consider net section yield',
        '5. Determine critical crack size',
        '6. Assess two-bay crack capability',
        '7. Account for load redistribution',
        '8. Generate residual strength diagram',
        '9. Verify compliance with regulations',
        '10. Document residual strength capability'
      ],
      outputFormat: 'JSON object with residual strength results'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalCrackSize', 'residualStrengthCurve'],
      properties: {
        criticalCrackSize: { type: 'number' },
        residualStrengthCurve: { type: 'array', items: { type: 'object' } },
        limitLoadCapability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'residual-strength', 'aerospace']
}));

export const inspectionIntervalTask = defineTask('inspection-interval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inspection Interval - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Maintenance and Inspection Planning Engineer',
      task: 'Determine inspection intervals',
      context: args,
      instructions: [
        '1. Calculate crack growth period from detectable to critical',
        '2. Apply inspection safety factor',
        '3. Determine initial inspection threshold',
        '4. Establish repeat inspection interval',
        '5. Consider inspection probability of detection',
        '6. Account for operational variation',
        '7. Define inspection method requirements',
        '8. Coordinate with maintenance program',
        '9. Document inspection rationale',
        '10. Create inspection requirement summary'
      ],
      outputFormat: 'JSON object with inspection intervals'
    },
    outputSchema: {
      type: 'object',
      required: ['threshold', 'interval'],
      properties: {
        threshold: { type: 'number' },
        interval: { type: 'number' },
        method: { type: 'string' },
        detectableSize: { type: 'number' },
        safetyFactor: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'inspection', 'aerospace']
}));

export const certificationComplianceTask = defineTask('certification-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structures Certification Engineer',
      task: 'Assess compliance with damage tolerance regulations',
      context: args,
      instructions: [
        '1. Review applicable certification requirements (25.571)',
        '2. Verify safe-life or damage tolerant classification',
        '3. Confirm initial flaw assumptions meet requirements',
        '4. Verify inspection program adequacy',
        '5. Confirm residual strength compliance',
        '6. Document means of compliance',
        '7. Prepare certification summary',
        '8. Identify any deviations or exceptions',
        '9. Coordinate with DER/AR',
        '10. Generate compliance matrix'
      ],
      outputFormat: 'JSON object with certification compliance'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'complianceMatrix'],
      properties: {
        status: { type: 'string', enum: ['compliant', 'conditional', 'non-compliant'] },
        complianceMatrix: { type: 'array', items: { type: 'object' } },
        deviations: { type: 'array', items: { type: 'string' } },
        meansOfCompliance: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'certification', 'aerospace']
}));

export const dtReportTask = defineTask('dt-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `DT Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Damage Tolerance Report Engineer',
      task: 'Generate damage tolerance analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document structure description',
        '3. Present material properties',
        '4. Document load spectrum',
        '5. Present fatigue analysis results',
        '6. Present crack growth analysis',
        '7. Document residual strength',
        '8. Present inspection requirements',
        '9. Document certification compliance',
        '10. Generate JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete DT report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fatigue', 'reporting', 'aerospace']
}));
