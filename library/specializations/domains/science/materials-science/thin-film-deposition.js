/**
 * @process domains/science/materials-science/thin-film-deposition
 * @description Thin Film Deposition Protocol - Establish thin film deposition processes (PVD, CVD, ALD) with thickness
 * control, composition optimization, and adhesion testing.
 * @inputs { material: string, substrate: string, technique: string, targetThickness?: number }
 * @outputs { success: boolean, depositionParameters: object, filmProperties: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/thin-film-deposition', {
 *   material: 'TiN',
 *   substrate: 'Si-wafer',
 *   technique: 'sputtering',
 *   targetThickness: 100
 * });
 *
 * @references
 * - PVD Handbook: Mattox, D.M. "Handbook of Physical Vapor Deposition"
 * - ALD: https://www.cambridge.org/core/books/atomic-layer-deposition
 * - CVD: Hitchman, M.L. "Chemical Vapor Deposition: Principles and Applications"
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    material,
    substrate,
    technique = 'sputtering',
    targetThickness = 100,
    targetComposition = null,
    uniformityRequirement = 5,
    outputDir = 'thin-film-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Thin Film Deposition for: ${material} on ${substrate}`);
  ctx.log('info', `Technique: ${technique}, Target thickness: ${targetThickness} nm`);

  // Phase 1: Substrate Preparation
  ctx.log('info', 'Phase 1: Preparing substrate');
  const substratePrep = await ctx.task(substratePreparationTask, {
    substrate,
    material,
    technique,
    outputDir
  });

  artifacts.push(...substratePrep.artifacts);

  // Phase 2: Process Parameter Design
  ctx.log('info', 'Phase 2: Designing deposition parameters');
  const processDesign = await ctx.task(depositionParameterDesignTask, {
    material,
    substrate,
    technique,
    targetThickness,
    targetComposition,
    outputDir
  });

  artifacts.push(...processDesign.artifacts);

  await ctx.breakpoint({
    question: `Deposition parameters designed. Power: ${processDesign.parameters.power}W, Pressure: ${processDesign.parameters.pressure} mTorr. Review parameters?`,
    title: 'Deposition Parameter Review',
    context: {
      runId: ctx.runId,
      summary: {
        technique,
        parameters: processDesign.parameters,
        estimatedRate: processDesign.estimatedDepositionRate
      },
      files: processDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Deposition Execution
  ctx.log('info', 'Phase 3: Executing deposition process');
  const depositionExecution = await ctx.task(depositionExecutionTask, {
    material,
    substrate,
    technique,
    parameters: processDesign.parameters,
    targetThickness,
    outputDir
  });

  artifacts.push(...depositionExecution.artifacts);

  // Phase 4: In-situ Monitoring
  ctx.log('info', 'Phase 4: Monitoring deposition');
  const inSituMonitoring = await ctx.task(inSituMonitoringTask, {
    technique,
    targetThickness,
    depositionLog: depositionExecution.log,
    outputDir
  });

  artifacts.push(...inSituMonitoring.artifacts);

  // Phase 5: Film Characterization
  ctx.log('info', 'Phase 5: Characterizing deposited film');
  const filmCharacterization = await ctx.task(filmCharacterizationTask, {
    material,
    substrate,
    targetThickness,
    targetComposition,
    outputDir
  });

  artifacts.push(...filmCharacterization.artifacts);

  // Phase 6: Adhesion Testing
  ctx.log('info', 'Phase 6: Testing film adhesion');
  const adhesionTesting = await ctx.task(adhesionTestingTask, {
    material,
    substrate,
    filmThickness: filmCharacterization.measuredThickness,
    outputDir
  });

  artifacts.push(...adhesionTesting.artifacts);

  // Phase 7: Uniformity Analysis
  ctx.log('info', 'Phase 7: Analyzing film uniformity');
  const uniformityAnalysis = await ctx.task(uniformityAnalysisTask, {
    material,
    uniformityRequirement,
    thicknessMap: filmCharacterization.thicknessMap,
    outputDir
  });

  artifacts.push(...uniformityAnalysis.artifacts);

  // Phase 8: Process Optimization
  ctx.log('info', 'Phase 8: Optimizing process parameters');
  const processOptimization = await ctx.task(tfProcessOptimizationTask, {
    material,
    technique,
    processDesign,
    filmCharacterization,
    adhesionTesting,
    uniformityAnalysis,
    outputDir
  });

  artifacts.push(...processOptimization.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Generating deposition report');
  const report = await ctx.task(thinFilmReportTask, {
    material,
    substrate,
    technique,
    processDesign,
    filmCharacterization,
    adhesionTesting,
    uniformityAnalysis,
    processOptimization,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    material,
    substrate,
    technique,
    depositionParameters: processOptimization.optimizedParameters || processDesign.parameters,
    filmProperties: {
      thickness: filmCharacterization.measuredThickness,
      composition: filmCharacterization.composition,
      density: filmCharacterization.density,
      roughness: filmCharacterization.roughness,
      crystallinity: filmCharacterization.crystallinity,
      stress: filmCharacterization.stress
    },
    adhesion: {
      testMethod: adhesionTesting.method,
      result: adhesionTesting.result,
      criticalLoad: adhesionTesting.criticalLoad
    },
    uniformity: {
      thicknessVariation: uniformityAnalysis.variation,
      meetsRequirement: uniformityAnalysis.meetsRequirement
    },
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/thin-film-deposition',
      timestamp: startTime,
      targetThickness,
      outputDir
    }
  };
}

// Task 1: Substrate Preparation
export const substratePreparationTask = defineTask('tf-substrate-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Substrate Preparation - ${args.substrate}`,
  agent: {
    name: 'thin-film-technician',
    prompt: {
      role: 'Thin Film Deposition Technician',
      task: 'Prepare substrate for thin film deposition',
      context: args,
      instructions: [
        '1. Clean substrate (solvent, acid, plasma)',
        '2. Verify surface cleanliness',
        '3. Check surface roughness',
        '4. Apply adhesion layer if needed',
        '5. Load into deposition chamber',
        '6. Achieve base pressure',
        '7. Pre-heat substrate if required',
        '8. Perform in-situ cleaning (ion bombardment)',
        '9. Verify surface condition',
        '10. Document preparation procedure'
      ],
      outputFormat: 'JSON with substrate preparation results'
    },
    outputSchema: {
      type: 'object',
      required: ['prepared', 'surfaceCondition', 'artifacts'],
      properties: {
        prepared: { type: 'boolean' },
        cleaningProcedure: { type: 'array', items: { type: 'string' } },
        surfaceCondition: { type: 'string' },
        surfaceRoughness: { type: 'number', description: 'nm RMS' },
        basePressure: { type: 'number', description: 'mTorr' },
        adhesionLayer: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'substrate-prep', 'materials-science']
}));

// Task 2: Deposition Parameter Design
export const depositionParameterDesignTask = defineTask('tf-parameter-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deposition Parameter Design - ${args.material}`,
  agent: {
    name: 'deposition-engineer',
    prompt: {
      role: 'Thin Film Deposition Engineer',
      task: 'Design deposition parameters for target film properties',
      context: args,
      instructions: [
        '1. Select target material and source',
        '2. Determine power/temperature settings',
        '3. Set working pressure',
        '4. Design gas flow rates',
        '5. Set substrate temperature',
        '6. Calculate deposition time from rate',
        '7. Configure substrate rotation/bias',
        '8. Plan reactive gas addition if needed',
        '9. Set up monitoring parameters',
        '10. Document deposition recipe'
      ],
      outputFormat: 'JSON with deposition parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'estimatedDepositionRate', 'artifacts'],
      properties: {
        parameters: {
          type: 'object',
          properties: {
            power: { type: 'number', description: 'W' },
            pressure: { type: 'number', description: 'mTorr' },
            gasFlows: { type: 'object' },
            substrateTemperature: { type: 'number', description: 'C' },
            substrateBias: { type: 'number', description: 'V' },
            depositionTime: { type: 'number', description: 'min' }
          }
        },
        estimatedDepositionRate: { type: 'number', description: 'nm/min' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'parameter-design', 'materials-science']
}));

// Task 3: Deposition Execution
export const depositionExecutionTask = defineTask('tf-deposition-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deposition Execution - ${args.material}`,
  agent: {
    name: 'deposition-operator',
    prompt: {
      role: 'Thin Film Deposition Operator',
      task: 'Execute thin film deposition process',
      context: args,
      instructions: [
        '1. Verify chamber conditions',
        '2. Load deposition recipe',
        '3. Start plasma/heating',
        '4. Open shutter to begin deposition',
        '5. Monitor process parameters',
        '6. Log deposition progress',
        '7. Control deposition time',
        '8. Close shutter at completion',
        '9. Cool down system',
        '10. Unload sample'
      ],
      outputFormat: 'JSON with deposition execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'actualParameters', 'log', 'artifacts'],
      properties: {
        completed: { type: 'boolean' },
        actualParameters: { type: 'object' },
        depositionTime: { type: 'number', description: 'min' },
        log: { type: 'string' },
        processStability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'deposition', 'materials-science']
}));

// Task 4: In-situ Monitoring
export const inSituMonitoringTask = defineTask('tf-insitu-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'In-situ Monitoring',
  agent: {
    name: 'process-monitor',
    prompt: {
      role: 'Thin Film Process Monitor',
      task: 'Monitor deposition process in real-time',
      context: args,
      instructions: [
        '1. Track thickness using QCM/ellipsometry',
        '2. Monitor plasma parameters (OES)',
        '3. Track deposition rate',
        '4. Monitor substrate temperature',
        '5. Check for process drift',
        '6. Detect arcing or instabilities',
        '7. Log all monitored parameters',
        '8. Assess endpoint detection',
        '9. Generate monitoring report',
        '10. Flag any anomalies'
      ],
      outputFormat: 'JSON with in-situ monitoring results'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoredThickness', 'processStability', 'artifacts'],
      properties: {
        monitoredThickness: { type: 'number', description: 'nm' },
        depositionRateProfile: { type: 'string' },
        processStability: { type: 'string' },
        anomalies: { type: 'array', items: { type: 'string' } },
        monitoringData: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'monitoring', 'materials-science']
}));

// Task 5: Film Characterization
export const filmCharacterizationTask = defineTask('tf-film-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Film Characterization - ${args.material}`,
  agent: {
    name: 'film-analyst',
    prompt: {
      role: 'Thin Film Characterization Specialist',
      task: 'Characterize deposited thin film properties',
      context: args,
      instructions: [
        '1. Measure film thickness (ellipsometry, profilometry)',
        '2. Measure composition (EDS, XPS, RBS)',
        '3. Determine crystal structure (XRD)',
        '4. Measure surface roughness (AFM)',
        '5. Determine film density',
        '6. Measure residual stress (wafer curvature)',
        '7. Assess optical properties if relevant',
        '8. Measure electrical properties if relevant',
        '9. Generate thickness map',
        '10. Document characterization results'
      ],
      outputFormat: 'JSON with film characterization results'
    },
    outputSchema: {
      type: 'object',
      required: ['measuredThickness', 'composition', 'artifacts'],
      properties: {
        measuredThickness: { type: 'number', description: 'nm' },
        thicknessMap: { type: 'string' },
        composition: { type: 'object' },
        density: { type: 'number', description: 'g/cm3' },
        roughness: { type: 'number', description: 'nm RMS' },
        crystallinity: { type: 'string' },
        stress: { type: 'number', description: 'MPa' },
        opticalProperties: { type: 'object' },
        electricalProperties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'characterization', 'materials-science']
}));

// Task 6: Adhesion Testing
export const adhesionTestingTask = defineTask('tf-adhesion-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adhesion Testing - ${args.material}`,
  agent: {
    name: 'adhesion-tester',
    prompt: {
      role: 'Thin Film Adhesion Testing Specialist',
      task: 'Test film adhesion to substrate',
      context: args,
      instructions: [
        '1. Select adhesion test method',
        '2. Perform tape test (ASTM D3359)',
        '3. Perform scratch test if needed',
        '4. Determine critical load (scratch)',
        '5. Examine failure mode',
        '6. Assess cohesive vs. adhesive failure',
        '7. Perform pull-off test if applicable',
        '8. Calculate adhesion strength',
        '9. Grade adhesion quality',
        '10. Document adhesion results'
      ],
      outputFormat: 'JSON with adhesion testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'result', 'artifacts'],
      properties: {
        method: { type: 'string' },
        result: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        tapeTestRating: { type: 'string' },
        criticalLoad: { type: 'number', description: 'N (scratch test)' },
        failureMode: { type: 'string' },
        adhesionStrength: { type: 'number', description: 'MPa' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'adhesion', 'materials-science']
}));

// Task 7: Uniformity Analysis
export const uniformityAnalysisTask = defineTask('tf-uniformity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Uniformity Analysis - ${args.material}`,
  agent: {
    name: 'uniformity-analyst',
    prompt: {
      role: 'Thin Film Uniformity Analyst',
      task: 'Analyze film thickness uniformity across substrate',
      context: args,
      instructions: [
        '1. Analyze thickness map data',
        '2. Calculate mean thickness',
        '3. Calculate standard deviation',
        '4. Determine min/max variation',
        '5. Calculate uniformity percentage',
        '6. Generate contour plot',
        '7. Identify thickness trends',
        '8. Compare with requirement',
        '9. Recommend improvements',
        '10. Document uniformity analysis'
      ],
      outputFormat: 'JSON with uniformity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['variation', 'meetsRequirement', 'artifacts'],
      properties: {
        meanThickness: { type: 'number' },
        standardDeviation: { type: 'number' },
        variation: { type: 'number', description: '%' },
        minThickness: { type: 'number' },
        maxThickness: { type: 'number' },
        meetsRequirement: { type: 'boolean' },
        uniformityMap: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'uniformity', 'materials-science']
}));

// Task 8: Process Optimization
export const tfProcessOptimizationTask = defineTask('tf-process-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Optimization - ${args.material}`,
  agent: {
    name: 'process-optimizer',
    prompt: {
      role: 'Thin Film Process Optimization Engineer',
      task: 'Optimize deposition parameters based on characterization',
      context: args,
      instructions: [
        '1. Review characterization results',
        '2. Compare with targets',
        '3. Identify parameter adjustments',
        '4. Optimize for thickness accuracy',
        '5. Optimize for uniformity',
        '6. Optimize for adhesion',
        '7. Balance multiple objectives',
        '8. Generate optimized recipe',
        '9. Document optimization rationale',
        '10. Plan verification run'
      ],
      outputFormat: 'JSON with optimized process parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'expectedImprovements', 'artifacts'],
      properties: {
        optimizedParameters: { type: 'object' },
        parameterChanges: { type: 'object' },
        expectedImprovements: { type: 'object' },
        optimizationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'optimization', 'materials-science']
}));

// Task 9: Report Generation
export const thinFilmReportTask = defineTask('tf-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thin Film Report - ${args.material}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Thin Film Technical Writer',
      task: 'Generate comprehensive thin film deposition report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document deposition parameters',
        '3. Present characterization results',
        '4. Include adhesion test results',
        '5. Present uniformity analysis',
        '6. Document optimization results',
        '7. Include figures and images',
        '8. Add process recommendations',
        '9. Create recipe documentation',
        '10. Format for process specification'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thin-film', 'report', 'documentation', 'materials-science']
}));
