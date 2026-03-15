/**
 * @process domains/science/materials-science/thermal-analysis
 * @description Thermal Analysis Protocol - Conduct thermal characterization (DSC, TGA, DTA, TMA, DMA) for phase
 * transitions, decomposition, and thermomechanical property determination.
 * @inputs { sampleId: string, techniques: array, temperatureRange?: object, atmosphere?: string }
 * @outputs { success: boolean, thermalEvents: array, thermomechanicalData: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/thermal-analysis', {
 *   sampleId: 'SAMPLE-004',
 *   techniques: ['DSC', 'TGA'],
 *   temperatureRange: { min: 25, max: 1000 },
 *   atmosphere: 'nitrogen'
 * });
 *
 * @references
 * - DSC: https://www.tainstruments.com/dsc-differential-scanning-calorimetry/
 * - TGA: https://www.netzsch-thermal-analysis.com/en/products-solutions/thermogravimetric-analysis/
 * - DMA: https://www.mettler.com/en-us/library/applications/thermal-analysis/
 * - ASTM E473: Standard Terminology for Thermal Analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sampleId,
    techniques = ['DSC', 'TGA'],
    temperatureRange = { min: 25, max: 800 },
    heatingRate = 10,
    atmosphere = 'nitrogen',
    sampleMass = null,
    cycleCount = 1,
    outputDir = 'thermal-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const thermalResults = {};

  ctx.log('info', `Starting Thermal Analysis for sample: ${sampleId}`);
  ctx.log('info', `Techniques: ${techniques.join(', ')}, Range: ${temperatureRange.min}-${temperatureRange.max}C`);

  // Phase 1: Sample Preparation
  ctx.log('info', 'Phase 1: Preparing sample for thermal analysis');
  const samplePrep = await ctx.task(thermalSamplePrepTask, {
    sampleId,
    techniques,
    sampleMass,
    outputDir
  });

  artifacts.push(...samplePrep.artifacts);

  // Phase 2: DSC Analysis (if requested)
  if (techniques.includes('DSC')) {
    ctx.log('info', 'Phase 2a: Performing DSC analysis');
    const dscResult = await ctx.task(dscAnalysisTask, {
      sampleId,
      temperatureRange,
      heatingRate,
      atmosphere,
      cycleCount,
      sampleMass: samplePrep.actualMass,
      outputDir
    });

    thermalResults.dsc = dscResult;
    artifacts.push(...dscResult.artifacts);
  }

  // Phase 3: TGA Analysis (if requested)
  if (techniques.includes('TGA')) {
    ctx.log('info', 'Phase 2b: Performing TGA analysis');
    const tgaResult = await ctx.task(tgaAnalysisTask, {
      sampleId,
      temperatureRange,
      heatingRate,
      atmosphere,
      sampleMass: samplePrep.actualMass,
      outputDir
    });

    thermalResults.tga = tgaResult;
    artifacts.push(...tgaResult.artifacts);
  }

  // Phase 4: DTA Analysis (if requested)
  if (techniques.includes('DTA')) {
    ctx.log('info', 'Phase 2c: Performing DTA analysis');
    const dtaResult = await ctx.task(dtaAnalysisTask, {
      sampleId,
      temperatureRange,
      heatingRate,
      atmosphere,
      outputDir
    });

    thermalResults.dta = dtaResult;
    artifacts.push(...dtaResult.artifacts);
  }

  // Phase 5: TMA Analysis (if requested)
  if (techniques.includes('TMA')) {
    ctx.log('info', 'Phase 2d: Performing TMA analysis');
    const tmaResult = await ctx.task(tmaAnalysisTask, {
      sampleId,
      temperatureRange,
      heatingRate,
      outputDir
    });

    thermalResults.tma = tmaResult;
    artifacts.push(...tmaResult.artifacts);
  }

  // Phase 6: DMA Analysis (if requested)
  if (techniques.includes('DMA')) {
    ctx.log('info', 'Phase 2e: Performing DMA analysis');
    const dmaResult = await ctx.task(dmaAnalysisTask, {
      sampleId,
      temperatureRange,
      heatingRate,
      outputDir
    });

    thermalResults.dma = dmaResult;
    artifacts.push(...dmaResult.artifacts);
  }

  // Phase 7: Thermal Event Analysis
  ctx.log('info', 'Phase 3: Analyzing thermal events');
  const thermalEvents = await ctx.task(thermalEventAnalysisTask, {
    sampleId,
    thermalResults,
    outputDir
  });

  artifacts.push(...thermalEvents.artifacts);

  // Breakpoint: Review thermal analysis results
  await ctx.breakpoint({
    question: `Thermal analysis complete for ${sampleId}. Found ${thermalEvents.events.length} thermal events. Review results?`,
    title: 'Thermal Analysis Review',
    context: {
      runId: ctx.runId,
      summary: {
        sampleId,
        techniques,
        thermalEvents: thermalEvents.events,
        phaseTransitions: thermalEvents.phaseTransitions,
        decompositionSteps: thermalResults.tga?.decompositionSteps
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 4: Generating thermal analysis report');
  const report = await ctx.task(thermalReportTask, {
    sampleId,
    techniques,
    thermalResults,
    thermalEvents,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sampleId,
    techniques,
    thermalEvents: thermalEvents.events,
    phaseTransitions: thermalEvents.phaseTransitions,
    dscResults: thermalResults.dsc ? {
      glassTrans: thermalResults.dsc.glassTransition,
      meltingPoint: thermalResults.dsc.meltingPoint,
      crystallization: thermalResults.dsc.crystallization,
      enthalpy: thermalResults.dsc.enthalpyValues
    } : null,
    tgaResults: thermalResults.tga ? {
      massLoss: thermalResults.tga.totalMassLoss,
      decompositionSteps: thermalResults.tga.decompositionSteps,
      residue: thermalResults.tga.residueMass
    } : null,
    thermomechanicalData: {
      tma: thermalResults.tma,
      dma: thermalResults.dma
    },
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/thermal-analysis',
      timestamp: startTime,
      temperatureRange,
      heatingRate,
      atmosphere,
      outputDir
    }
  };
}

// Task 1: Sample Preparation
export const thermalSamplePrepTask = defineTask('thermal-sample-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Sample Preparation - ${args.sampleId}`,
  agent: {
    name: 'thermal-analyst',
    prompt: {
      role: 'Thermal Analysis Technician',
      task: 'Prepare sample for thermal analysis',
      context: args,
      instructions: [
        '1. Select appropriate crucible/pan material',
        '2. Weigh sample accurately (balance precision)',
        '3. Ensure proper sample contact with pan',
        '4. Consider sample form (powder, film, bulk)',
        '5. Check for volatile components',
        '6. Assess thermal history if relevant',
        '7. Prepare reference material if needed',
        '8. Document sample preparation',
        '9. Verify instrument calibration',
        '10. Record actual sample mass'
      ],
      outputFormat: 'JSON with sample preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['prepared', 'actualMass', 'artifacts'],
      properties: {
        prepared: { type: 'boolean' },
        actualMass: { type: 'number', description: 'mg' },
        crucibleType: { type: 'string' },
        sampleForm: { type: 'string' },
        notes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'sample-prep', 'materials-science']
}));

// Task 2: DSC Analysis
export const dscAnalysisTask = defineTask('dsc-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `DSC Analysis - ${args.sampleId}`,
  agent: {
    name: 'dsc-specialist',
    prompt: {
      role: 'Differential Scanning Calorimetry Specialist',
      task: 'Perform DSC thermal analysis',
      context: args,
      instructions: [
        '1. Configure temperature program',
        '2. Set heating/cooling rates',
        '3. Purge with appropriate atmosphere',
        '4. Run baseline if needed',
        '5. Acquire DSC curve',
        '6. Identify glass transitions (midpoint, onset)',
        '7. Analyze melting events (onset, peak, enthalpy)',
        '8. Analyze crystallization events',
        '9. Calculate enthalpies of transition',
        '10. Assess thermal history effects'
      ],
      outputFormat: 'JSON with DSC analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['glassTransition', 'meltingPoint', 'artifacts'],
      properties: {
        glassTransition: {
          type: 'object',
          properties: {
            onset: { type: 'number' },
            midpoint: { type: 'number' },
            endpoint: { type: 'number' },
            deltaCp: { type: 'number' }
          }
        },
        meltingPoint: {
          type: 'object',
          properties: {
            onset: { type: 'number' },
            peak: { type: 'number' },
            enthalpy: { type: 'number' }
          }
        },
        crystallization: { type: 'object' },
        enthalpyValues: { type: 'array', items: { type: 'object' } },
        thermogramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'dsc', 'calorimetry', 'materials-science']
}));

// Task 3: TGA Analysis
export const tgaAnalysisTask = defineTask('tga-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `TGA Analysis - ${args.sampleId}`,
  agent: {
    name: 'tga-specialist',
    prompt: {
      role: 'Thermogravimetric Analysis Specialist',
      task: 'Perform TGA thermal analysis',
      context: args,
      instructions: [
        '1. Configure temperature program',
        '2. Set appropriate atmosphere (N2, air, O2)',
        '3. Tare balance and load sample',
        '4. Record initial mass',
        '5. Acquire TGA curve',
        '6. Identify mass loss steps',
        '7. Calculate derivative (DTG) curve',
        '8. Determine onset temperatures',
        '9. Calculate mass loss percentages',
        '10. Identify residue composition'
      ],
      outputFormat: 'JSON with TGA analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMassLoss', 'decompositionSteps', 'artifacts'],
      properties: {
        totalMassLoss: { type: 'number', description: 'percent' },
        decompositionSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              onsetTemp: { type: 'number' },
              peakTemp: { type: 'number' },
              massLoss: { type: 'number' },
              assignment: { type: 'string' }
            }
          }
        },
        residueMass: { type: 'number' },
        dtgPeaks: { type: 'array', items: { type: 'number' } },
        thermogramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'tga', 'decomposition', 'materials-science']
}));

// Task 4: DTA Analysis
export const dtaAnalysisTask = defineTask('dta-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `DTA Analysis - ${args.sampleId}`,
  agent: {
    name: 'dta-specialist',
    prompt: {
      role: 'Differential Thermal Analysis Specialist',
      task: 'Perform DTA thermal analysis',
      context: args,
      instructions: [
        '1. Select appropriate reference material',
        '2. Configure temperature program',
        '3. Acquire DTA curve',
        '4. Identify endothermic events',
        '5. Identify exothermic events',
        '6. Determine peak temperatures',
        '7. Correlate with phase diagram data',
        '8. Assess reaction kinetics',
        '9. Compare with DSC if available',
        '10. Document thermal events'
      ],
      outputFormat: 'JSON with DTA analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['thermalEvents', 'artifacts'],
      properties: {
        thermalEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              type: { type: 'string', enum: ['endothermic', 'exothermic'] },
              assignment: { type: 'string' }
            }
          }
        },
        thermogramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'dta', 'materials-science']
}));

// Task 5: TMA Analysis
export const tmaAnalysisTask = defineTask('tma-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `TMA Analysis - ${args.sampleId}`,
  agent: {
    name: 'tma-specialist',
    prompt: {
      role: 'Thermomechanical Analysis Specialist',
      task: 'Perform TMA dimensional analysis',
      context: args,
      instructions: [
        '1. Measure initial sample dimensions',
        '2. Configure probe type and force',
        '3. Set temperature program',
        '4. Acquire dimensional change data',
        '5. Calculate coefficient of thermal expansion (CTE)',
        '6. Identify softening points',
        '7. Detect glass transition',
        '8. Analyze penetration behavior',
        '9. Assess thermal stability',
        '10. Document dimensional changes'
      ],
      outputFormat: 'JSON with TMA analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['cte', 'dimensionalChange', 'artifacts'],
      properties: {
        cte: { type: 'number', description: 'ppm/K' },
        cteByRange: { type: 'object' },
        dimensionalChange: { type: 'object' },
        softeningPoint: { type: 'number' },
        glassTransition: { type: 'number' },
        thermogramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'tma', 'expansion', 'materials-science']
}));

// Task 6: DMA Analysis
export const dmaAnalysisTask = defineTask('dma-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMA Analysis - ${args.sampleId}`,
  agent: {
    name: 'dma-specialist',
    prompt: {
      role: 'Dynamic Mechanical Analysis Specialist',
      task: 'Perform DMA viscoelastic analysis',
      context: args,
      instructions: [
        '1. Select deformation mode (tension, bending, shear)',
        '2. Set oscillation frequency and amplitude',
        '3. Configure temperature sweep',
        '4. Acquire storage modulus (E\') data',
        '5. Acquire loss modulus (E") data',
        '6. Calculate tan delta',
        '7. Identify glass transition (E", tan delta peak)',
        '8. Analyze secondary relaxations',
        '9. Perform frequency sweep if needed',
        '10. Construct master curves if applicable'
      ],
      outputFormat: 'JSON with DMA analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['storageModulus', 'lossModulus', 'tanDelta', 'artifacts'],
      properties: {
        storageModulus: { type: 'object', description: 'E\' vs temperature' },
        lossModulus: { type: 'object', description: 'E" vs temperature' },
        tanDelta: { type: 'object' },
        glassTransitionEprime: { type: 'number' },
        glassTransitionTanDelta: { type: 'number' },
        secondaryRelaxations: { type: 'array', items: { type: 'object' } },
        thermogramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'dma', 'viscoelastic', 'materials-science']
}));

// Task 7: Thermal Event Analysis
export const thermalEventAnalysisTask = defineTask('thermal-event-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Event Analysis - ${args.sampleId}`,
  agent: {
    name: 'thermal-data-analyst',
    prompt: {
      role: 'Thermal Data Analysis Specialist',
      task: 'Analyze and correlate thermal events across techniques',
      context: args,
      instructions: [
        '1. Compile thermal events from all techniques',
        '2. Correlate events across methods',
        '3. Identify phase transitions',
        '4. Classify events (glass transition, melting, decomposition)',
        '5. Determine transition enthalpies',
        '6. Assess thermal stability limits',
        '7. Identify crystallization behavior',
        '8. Compare with literature data',
        '9. Resolve conflicting assignments',
        '10. Create thermal event summary'
      ],
      outputFormat: 'JSON with thermal event analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['events', 'phaseTransitions', 'artifacts'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              temperature: { type: 'number' },
              type: { type: 'string' },
              technique: { type: 'string' },
              enthalpy: { type: 'number' }
            }
          }
        },
        phaseTransitions: { type: 'array', items: { type: 'object' } },
        thermalStabilityLimit: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thermal-analysis', 'event-analysis', 'materials-science']
}));

// Task 8: Report Generation
export const thermalReportTask = defineTask('thermal-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermal Analysis Report - ${args.sampleId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Thermal Analysis Technical Writer',
      task: 'Generate comprehensive thermal analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document experimental parameters',
        '3. Present thermograms with annotations',
        '4. Include data tables',
        '5. Discuss phase transitions',
        '6. Present decomposition analysis',
        '7. Report thermomechanical properties',
        '8. Compare with reference materials',
        '9. Add conclusions',
        '10. Format per ASTM E473 terminology'
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
  labels: ['agent', 'thermal-analysis', 'report', 'documentation', 'materials-science']
}));
