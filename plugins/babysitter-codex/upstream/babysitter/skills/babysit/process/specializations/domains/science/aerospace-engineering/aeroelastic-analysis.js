/**
 * @process specializations/domains/science/aerospace-engineering/aeroelastic-analysis
 * @description Process for analyzing flutter, divergence, and control reversal to ensure structural integrity
 * across the flight envelope.
 * @inputs { projectName: string, vehicleModel: object, flightEnvelope: object, structuralModel?: object }
 * @outputs { success: boolean, flutterAnalysis: object, divergenceAnalysis: object, clearanceReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/aeroelastic-analysis', {
 *   projectName: 'Transport Wing Flutter Analysis',
 *   vehicleModel: { type: 'transport', wingspan: 35 },
 *   flightEnvelope: { maxMach: 0.85, maxAltitude: 43000, maxQ: 450 }
 * });
 *
 * @references
 * - FAR 25.629 Aeroelastic Stability Requirements
 * - MIL-A-8870 Flutter Prevention
 * - NASA Aeroelasticity Handbook
 * - NASTRAN Aeroelastic Analysis Guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleModel,
    flightEnvelope,
    structuralModel = {}
  } = inputs;

  // Phase 1: Model Preparation
  const modelPrep = await ctx.task(aeroelasticModelPrepTask, {
    projectName,
    vehicleModel,
    structuralModel
  });

  // Phase 2: Aerodynamic Model
  const aeroModel = await ctx.task(unsteadyAeroModelTask, {
    projectName,
    vehicleModel,
    flightEnvelope,
    structuralModel: modelPrep
  });

  // Phase 3: Ground Vibration Test Correlation
  const gvtCorrelation = await ctx.task(gvtCorrelationTask, {
    projectName,
    structuralModel: modelPrep,
    gvtData: inputs.gvtData
  });

  // Breakpoint: Model correlation review
  await ctx.breakpoint({
    question: `GVT correlation complete for ${projectName}. MAC > 0.9: ${gvtCorrelation.correlatedModes}/${gvtCorrelation.totalModes}. Proceed?`,
    title: 'GVT Correlation Review',
    context: {
      runId: ctx.runId,
      correlation: gvtCorrelation
    }
  });

  // Phase 4: Flutter Analysis
  const flutterAnalysis = await ctx.task(flutterAnalysisTask, {
    projectName,
    structuralModel: gvtCorrelation.updatedModel,
    aeroModel,
    flightEnvelope
  });

  // Quality Gate: Flutter margin
  if (flutterAnalysis.lowestFlutterSpeed < flightEnvelope.vd * 1.15) {
    await ctx.breakpoint({
      question: `Flutter speed ${flutterAnalysis.lowestFlutterSpeed} KEAS below 1.15 VD. Critical review required.`,
      title: 'Flutter Margin Warning',
      context: {
        runId: ctx.runId,
        flutterAnalysis,
        recommendation: 'Consider structural modifications or mass balance'
      }
    });
  }

  // Phase 5: Divergence Analysis
  const divergenceAnalysis = await ctx.task(divergenceAnalysisTask, {
    projectName,
    structuralModel: gvtCorrelation.updatedModel,
    aeroModel,
    flightEnvelope
  });

  // Phase 6: Control Reversal Analysis
  const controlReversalAnalysis = await ctx.task(controlReversalTask, {
    projectName,
    structuralModel: gvtCorrelation.updatedModel,
    aeroModel,
    controlSurfaces: vehicleModel.controlSurfaces
  });

  // Phase 7: Store Flutter Analysis (if applicable)
  const storeAnalysis = inputs.externalStores ? await ctx.task(storeFlutterTask, {
    projectName,
    flutterAnalysis,
    externalStores: inputs.externalStores
  }) : null;

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(flutterSensitivityTask, {
    projectName,
    flutterAnalysis,
    parameterVariations: inputs.parameterVariations
  });

  // Phase 9: Flight Flutter Test Planning
  const fftPlan = await ctx.task(flightFlutterTestTask, {
    projectName,
    flutterAnalysis,
    flightEnvelope,
    testRequirements: inputs.testRequirements
  });

  // Phase 10: Certification Report
  const certificationReport = await ctx.task(aeroelasticCertificationTask, {
    projectName,
    flutterAnalysis,
    divergenceAnalysis,
    controlReversalAnalysis,
    storeAnalysis,
    fftPlan,
    certificationBasis: inputs.certificationBasis
  });

  // Final Breakpoint: Clearance Approval
  await ctx.breakpoint({
    question: `Aeroelastic analysis complete for ${projectName}. Flutter margin: ${flutterAnalysis.margin}%. Approve clearance?`,
    title: 'Aeroelastic Clearance Approval',
    context: {
      runId: ctx.runId,
      summary: {
        flutterSpeed: flutterAnalysis.lowestFlutterSpeed,
        flutterMargin: flutterAnalysis.margin,
        divergenceMargin: divergenceAnalysis.margin,
        certificationStatus: certificationReport.status
      },
      files: [
        { path: 'artifacts/aeroelastic-report.json', format: 'json', content: certificationReport },
        { path: 'artifacts/aeroelastic-report.md', format: 'markdown', content: certificationReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    flutterAnalysis: {
      lowestFlutterSpeed: flutterAnalysis.lowestFlutterSpeed,
      flutterMode: flutterAnalysis.criticalMode,
      margin: flutterAnalysis.margin
    },
    divergenceAnalysis: {
      divergenceSpeed: divergenceAnalysis.divergenceSpeed,
      margin: divergenceAnalysis.margin
    },
    controlReversal: controlReversalAnalysis,
    clearanceReport: certificationReport,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/aeroelastic-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const aeroelasticModelPrepTask = defineTask('aeroelastic-model-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aeroelastic Model Engineer',
      task: 'Prepare structural model for aeroelastic analysis',
      context: args,
      instructions: [
        '1. Import or create structural finite element model',
        '2. Verify model connectivity and mass distribution',
        '3. Check boundary conditions and constraints',
        '4. Perform normal modes analysis',
        '5. Verify natural frequencies and mode shapes',
        '6. Create reduced order model if needed',
        '7. Define control surface degrees of freedom',
        '8. Verify mass and stiffness matrices',
        '9. Document model verification',
        '10. Export splined model for aero coupling'
      ],
      outputFormat: 'JSON object with prepared model'
    },
    outputSchema: {
      type: 'object',
      required: ['modes', 'frequencies'],
      properties: {
        modes: { type: 'number' },
        frequencies: { type: 'array', items: { type: 'number' } },
        massDistribution: { type: 'object' },
        verification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'modeling', 'aerospace']
}));

export const unsteadyAeroModelTask = defineTask('unsteady-aero-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Aerodynamic Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Unsteady Aerodynamics Engineer',
      task: 'Develop unsteady aerodynamic model',
      context: args,
      instructions: [
        '1. Create doublet lattice aerodynamic model',
        '2. Define aerodynamic panels and boxes',
        '3. Set up structure-aero spline interpolation',
        '4. Calculate generalized aerodynamic forces (GAF)',
        '5. Define reduced frequencies and Mach numbers',
        '6. Account for compressibility corrections',
        '7. Include control surface aerodynamics',
        '8. Validate against steady aero data',
        '9. Apply correction factors if needed',
        '10. Document aerodynamic model'
      ],
      outputFormat: 'JSON object with aerodynamic model'
    },
    outputSchema: {
      type: 'object',
      required: ['panelCount', 'gafMatrices'],
      properties: {
        panelCount: { type: 'number' },
        gafMatrices: { type: 'object' },
        reducedFrequencies: { type: 'array', items: { type: 'number' } },
        machNumbers: { type: 'array', items: { type: 'number' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'aerodynamics', 'aerospace']
}));

export const gvtCorrelationTask = defineTask('gvt-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: `GVT Correlation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Dynamics Correlation Engineer',
      task: 'Correlate FE model with ground vibration test data',
      context: args,
      instructions: [
        '1. Compare analytical vs test frequencies',
        '2. Calculate Modal Assurance Criterion (MAC)',
        '3. Identify uncorrelated modes',
        '4. Update model parameters (stiffness, mass)',
        '5. Re-run correlation checks',
        '6. Document frequency deviations',
        '7. Assess mode pairing',
        '8. Update model for flutter analysis',
        '9. Document correlation summary',
        '10. Obtain correlation approval'
      ],
      outputFormat: 'JSON object with correlation results'
    },
    outputSchema: {
      type: 'object',
      required: ['correlatedModes', 'totalModes', 'updatedModel'],
      properties: {
        correlatedModes: { type: 'number' },
        totalModes: { type: 'number' },
        macMatrix: { type: 'object' },
        frequencyComparison: { type: 'array', items: { type: 'object' } },
        updatedModel: { type: 'object' },
        modelUpdates: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'correlation', 'aerospace']
}));

export const flutterAnalysisTask = defineTask('flutter-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flutter Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flutter Analysis Engineer',
      task: 'Perform flutter stability analysis',
      context: args,
      instructions: [
        '1. Set up flutter solution (p-k, k, p methods)',
        '2. Define velocity and altitude sweep',
        '3. Calculate flutter eigenvalues',
        '4. Track frequency and damping vs velocity',
        '5. Identify flutter mechanism and coupling modes',
        '6. Generate V-g and V-f plots',
        '7. Determine flutter speed and frequency',
        '8. Calculate flutter margin above VD',
        '9. Identify critical flutter condition',
        '10. Document flutter analysis results'
      ],
      outputFormat: 'JSON object with flutter analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['lowestFlutterSpeed', 'criticalMode', 'margin'],
      properties: {
        lowestFlutterSpeed: { type: 'number' },
        flutterFrequency: { type: 'number' },
        criticalMode: { type: 'string' },
        margin: { type: 'number' },
        vgPlot: { type: 'object' },
        vfPlot: { type: 'object' },
        flutterMechanism: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'flutter', 'aerospace']
}));

export const divergenceAnalysisTask = defineTask('divergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Divergence Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Static Aeroelastic Engineer',
      task: 'Perform static divergence analysis',
      context: args,
      instructions: [
        '1. Calculate static aeroelastic stiffness',
        '2. Compute divergence dynamic pressure',
        '3. Identify divergence mode shape',
        '4. Calculate divergence speed',
        '5. Determine margin above VD',
        '6. Analyze sensitivity to stiffness',
        '7. Check all lifting surfaces',
        '8. Document divergence results',
        '9. Compare with flutter boundaries',
        '10. Assess certification compliance'
      ],
      outputFormat: 'JSON object with divergence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['divergenceSpeed', 'margin'],
      properties: {
        divergenceSpeed: { type: 'number' },
        divergenceDynamicPressure: { type: 'number' },
        margin: { type: 'number' },
        criticalSurface: { type: 'string' },
        modeShape: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'divergence', 'aerospace']
}));

export const controlReversalTask = defineTask('control-reversal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Reversal Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control Surface Aeroelastic Engineer',
      task: 'Analyze control surface reversal',
      context: args,
      instructions: [
        '1. Calculate control surface effectiveness vs speed',
        '2. Determine reversal speed for each surface',
        '3. Analyze aileron effectiveness and reversal',
        '4. Analyze elevator effectiveness',
        '5. Analyze rudder effectiveness',
        '6. Calculate margin above VD',
        '7. Assess impact on handling qualities',
        '8. Document effectiveness curves',
        '9. Verify certification compliance',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with control reversal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['reversalSpeeds', 'effectiveness'],
      properties: {
        reversalSpeeds: {
          type: 'object',
          properties: {
            aileron: { type: 'number' },
            elevator: { type: 'number' },
            rudder: { type: 'number' }
          }
        },
        effectiveness: { type: 'object' },
        margins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'control-reversal', 'aerospace']
}));

export const storeFlutterTask = defineTask('store-flutter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Store Flutter Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'External Store Flutter Engineer',
      task: 'Analyze flutter with external stores',
      context: args,
      instructions: [
        '1. Define store configurations',
        '2. Model store mass and inertia',
        '3. Include pylon flexibility',
        '4. Analyze symmetric and antisymmetric cases',
        '5. Calculate flutter with each store config',
        '6. Analyze jettison transients',
        '7. Identify critical store combinations',
        '8. Generate flutter placard',
        '9. Document store flutter clearances',
        '10. Define store carriage limitations'
      ],
      outputFormat: 'JSON object with store flutter analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['configurations', 'flutterSpeeds'],
      properties: {
        configurations: { type: 'array', items: { type: 'object' } },
        flutterSpeeds: { type: 'object' },
        criticalConfig: { type: 'string' },
        placards: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'store-flutter', 'aerospace']
}));

export const flutterSensitivityTask = defineTask('flutter-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aeroelastic Sensitivity Engineer',
      task: 'Perform flutter sensitivity analysis',
      context: args,
      instructions: [
        '1. Vary structural stiffness parameters',
        '2. Vary mass distribution',
        '3. Vary aerodynamic parameters',
        '4. Analyze fuel loading effects',
        '5. Calculate flutter speed sensitivities',
        '6. Identify critical parameters',
        '7. Assess robustness of flutter margin',
        '8. Consider manufacturing tolerances',
        '9. Document sensitivity results',
        '10. Provide design recommendations'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitivities', 'criticalParameters'],
      properties: {
        sensitivities: { type: 'object' },
        criticalParameters: { type: 'array', items: { type: 'string' } },
        robustness: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'sensitivity', 'aerospace']
}));

export const flightFlutterTestTask = defineTask('flight-flutter-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `FFT Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Flutter Test Engineer',
      task: 'Plan flight flutter test program',
      context: args,
      instructions: [
        '1. Define test objectives',
        '2. Plan envelope expansion approach',
        '3. Define test points and conditions',
        '4. Select excitation method',
        '5. Define instrumentation requirements',
        '6. Establish real-time monitoring',
        '7. Define go/no-go criteria',
        '8. Plan safety abort procedures',
        '9. Define data analysis methods',
        '10. Document FFT plan'
      ],
      outputFormat: 'JSON object with FFT plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testPoints', 'instrumentation'],
      properties: {
        testPoints: { type: 'array', items: { type: 'object' } },
        instrumentation: { type: 'object' },
        excitationMethod: { type: 'string' },
        safetyProcedures: { type: 'object' },
        analysisMethod: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'flight-test', 'aerospace']
}));

export const aeroelasticCertificationTask = defineTask('aeroelastic-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aeroelastic Certification Engineer',
      task: 'Prepare aeroelastic certification documentation',
      context: args,
      instructions: [
        '1. Document flutter analysis compliance',
        '2. Document divergence compliance',
        '3. Document control reversal compliance',
        '4. Present GVT correlation evidence',
        '5. Document FFT results (if available)',
        '6. Present margins and clearances',
        '7. Document store flutter clearances',
        '8. Prepare compliance summary',
        '9. Address special conditions',
        '10. Generate certification report'
      ],
      outputFormat: 'JSON object with certification report'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'complianceMatrix', 'markdown'],
      properties: {
        status: { type: 'string' },
        complianceMatrix: { type: 'array', items: { type: 'object' } },
        margins: { type: 'object' },
        clearances: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aeroelastic', 'certification', 'aerospace']
}));
