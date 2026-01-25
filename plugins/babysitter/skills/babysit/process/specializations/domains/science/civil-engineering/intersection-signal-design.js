/**
 * @process civil-engineering/intersection-signal-design
 * @description Design of traffic signals including signal timing, phasing, controller specifications, and detection systems per MUTCD
 * @inputs { projectId: string, intersectionGeometry: object, trafficData: object, pedestrianData: object }
 * @outputs { success: boolean, signalDesign: object, timingPlans: array, equipmentSpecs: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    intersectionGeometry,
    trafficData,
    pedestrianData,
    existingConditions,
    coordinationRequirements,
    designStandard = 'MUTCD',
    outputDir = 'signal-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Signal Warrant Analysis
  ctx.log('info', 'Starting signal design: Warrant analysis');
  const warrantAnalysis = await ctx.task(warrantAnalysisTask, {
    projectId,
    intersectionGeometry,
    trafficData,
    pedestrianData,
    outputDir
  });

  if (!warrantAnalysis.success) {
    return {
      success: false,
      error: 'Signal warrant analysis failed',
      details: warrantAnalysis,
      metadata: { processId: 'civil-engineering/intersection-signal-design', timestamp: startTime }
    };
  }

  artifacts.push(...warrantAnalysis.artifacts);

  // Task 2: Phasing Design
  ctx.log('info', 'Designing signal phasing');
  const phasingDesign = await ctx.task(phasingDesignTask, {
    projectId,
    intersectionGeometry,
    trafficData,
    pedestrianData,
    outputDir
  });

  artifacts.push(...phasingDesign.artifacts);

  // Task 3: Signal Timing Design
  ctx.log('info', 'Designing signal timing');
  const timingDesign = await ctx.task(timingDesignTask, {
    projectId,
    intersectionGeometry,
    phasingDesign,
    trafficData,
    pedestrianData,
    outputDir
  });

  artifacts.push(...timingDesign.artifacts);

  // Task 4: Detection System Design
  ctx.log('info', 'Designing detection system');
  const detectionDesign = await ctx.task(detectionDesignTask, {
    projectId,
    intersectionGeometry,
    phasingDesign,
    timingDesign,
    outputDir
  });

  artifacts.push(...detectionDesign.artifacts);

  // Task 5: Controller and Cabinet Design
  ctx.log('info', 'Specifying controller and cabinet');
  const controllerDesign = await ctx.task(controllerDesignTask, {
    projectId,
    phasingDesign,
    detectionDesign,
    coordinationRequirements,
    outputDir
  });

  artifacts.push(...controllerDesign.artifacts);

  // Breakpoint: Review signal design
  await ctx.breakpoint({
    question: `Signal design complete for ${projectId}. Cycle length: ${timingDesign.cycleLength}s. Review design?`,
    title: 'Traffic Signal Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        warrantsMetCount: warrantAnalysis.warrantsMetCount,
        numberOfPhases: phasingDesign.phaseCount,
        cycleLength: timingDesign.cycleLength,
        detectorCount: detectionDesign.detectorCount,
        controllerType: controllerDesign.type
      }
    }
  });

  // Task 6: Signal Head Layout
  ctx.log('info', 'Designing signal head layout');
  const signalHeadLayout = await ctx.task(signalHeadLayoutTask, {
    projectId,
    intersectionGeometry,
    phasingDesign,
    designStandard,
    outputDir
  });

  artifacts.push(...signalHeadLayout.artifacts);

  // Task 7: Electrical Design
  ctx.log('info', 'Designing electrical system');
  const electricalDesign = await ctx.task(electricalDesignTask, {
    projectId,
    signalHeadLayout,
    detectionDesign,
    controllerDesign,
    outputDir
  });

  artifacts.push(...electricalDesign.artifacts);

  // Task 8: Signal Plans
  ctx.log('info', 'Generating signal plans');
  const signalPlans = await ctx.task(signalPlansTask, {
    projectId,
    intersectionGeometry,
    phasingDesign,
    signalHeadLayout,
    detectionDesign,
    electricalDesign,
    outputDir
  });

  artifacts.push(...signalPlans.artifacts);

  // Task 9: Signal Design Report
  ctx.log('info', 'Generating signal design report');
  const designReport = await ctx.task(signalReportTask, {
    projectId,
    warrantAnalysis,
    phasingDesign,
    timingDesign,
    detectionDesign,
    controllerDesign,
    signalHeadLayout,
    electricalDesign,
    outputDir
  });

  artifacts.push(...designReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    signalDesign: {
      warrantAnalysis: warrantAnalysis.results,
      phasing: phasingDesign.phasing,
      timing: timingDesign.timing,
      detection: detectionDesign.system,
      controller: controllerDesign.specifications,
      signalHeads: signalHeadLayout.layout,
      electrical: electricalDesign.design
    },
    timingPlans: timingDesign.timingPlans,
    equipmentSpecs: {
      controller: controllerDesign.specifications,
      detectors: detectionDesign.specifications,
      signalHeads: signalHeadLayout.specifications
    },
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/intersection-signal-design',
      timestamp: startTime,
      projectId,
      designStandard,
      outputDir
    }
  };
}

// Task 1: Signal Warrant Analysis
export const warrantAnalysisTask = defineTask('warrant-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform signal warrant analysis',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Perform MUTCD signal warrant analysis',
      context: args,
      instructions: [
        'Analyze Warrant 1 - Eight-Hour Vehicular Volume',
        'Analyze Warrant 2 - Four-Hour Vehicular Volume',
        'Analyze Warrant 3 - Peak Hour',
        'Analyze Warrant 4 - Pedestrian Volume',
        'Analyze Warrant 5 - School Crossing',
        'Analyze Warrant 7 - Crash Experience',
        'Document warrant analysis results',
        'Provide signal recommendation'
      ],
      outputFormat: 'JSON with warrant analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'warrantsMetCount', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        warrantsMetCount: { type: 'number' },
        warrantsMet: { type: 'array' },
        warrantsNotMet: { type: 'array' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'warrants']
}));

// Task 2: Phasing Design
export const phasingDesignTask = defineTask('phasing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design signal phasing',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Design signal phasing scheme',
      context: args,
      instructions: [
        'Determine number of phases needed',
        'Assign movements to phases',
        'Design protected vs. permitted left turns',
        'Design pedestrian phases',
        'Establish phase sequence',
        'Design overlap phases if needed',
        'Check for conflicting movements',
        'Create phase diagram'
      ],
      outputFormat: 'JSON with phasing design, phase diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['phasing', 'phaseCount', 'artifacts'],
      properties: {
        phasing: { type: 'object' },
        phaseCount: { type: 'number' },
        phaseSequence: { type: 'array' },
        leftTurnTreatment: { type: 'object' },
        pedestrianPhases: { type: 'array' },
        overlaps: { type: 'array' },
        phaseDiagram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'phasing']
}));

// Task 3: Signal Timing Design
export const timingDesignTask = defineTask('timing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design signal timing',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Design signal timing parameters',
      context: args,
      instructions: [
        'Calculate yellow and all-red intervals',
        'Calculate pedestrian walk and clearance times',
        'Calculate minimum green times',
        'Calculate cycle length using Webster or HCM',
        'Allocate green time to phases',
        'Check capacity and LOS',
        'Design multiple timing plans if needed',
        'Create timing sheets'
      ],
      outputFormat: 'JSON with timing parameters, timing plans'
    },
    outputSchema: {
      type: 'object',
      required: ['timing', 'cycleLength', 'timingPlans', 'artifacts'],
      properties: {
        timing: { type: 'object' },
        cycleLength: { type: 'number' },
        timingPlans: { type: 'array' },
        yellowIntervals: { type: 'object' },
        allRedIntervals: { type: 'object' },
        pedestrianTiming: { type: 'object' },
        losResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'timing']
}));

// Task 4: Detection System Design
export const detectionDesignTask = defineTask('detection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design detection system',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Design vehicle and pedestrian detection system',
      context: args,
      instructions: [
        'Select detection technology (loops, video, radar)',
        'Design vehicle detector placement',
        'Design advance detectors for dilemma zone',
        'Design stop bar detectors',
        'Specify pedestrian pushbuttons',
        'Design accessible pedestrian signals',
        'Specify detector amplifiers and cards',
        'Create detection layout'
      ],
      outputFormat: 'JSON with detection design, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'detectorCount', 'specifications', 'artifacts'],
      properties: {
        system: { type: 'object' },
        detectorCount: { type: 'number' },
        detectorType: { type: 'string' },
        detectorLayout: { type: 'array' },
        pedestrianDetection: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'detection']
}));

// Task 5: Controller and Cabinet Design
export const controllerDesignTask = defineTask('controller-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify controller and cabinet',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Specify signal controller and cabinet',
      context: args,
      instructions: [
        'Select controller type (NEMA, ATC, 2070)',
        'Specify controller features needed',
        'Select cabinet type and size',
        'Specify conflict monitor',
        'Specify malfunction management unit',
        'Design coordination capabilities',
        'Specify communication requirements',
        'Create controller specifications'
      ],
      outputFormat: 'JSON with controller specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'specifications', 'artifacts'],
      properties: {
        type: { type: 'string' },
        specifications: { type: 'object' },
        cabinetType: { type: 'string' },
        conflictMonitor: { type: 'object' },
        communicationSpecs: { type: 'object' },
        coordinationFeatures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'controller']
}));

// Task 6: Signal Head Layout
export const signalHeadLayoutTask = defineTask('signal-head-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design signal head layout',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic signal engineer',
      task: 'Design signal head placement',
      context: args,
      instructions: [
        'Determine signal head types needed',
        'Design mast arm signal mounting',
        'Design span wire mounting if applicable',
        'Place primary and supplemental heads',
        'Design pedestrian signal placement',
        'Check visibility and sight distance',
        'Verify MUTCD compliance',
        'Create signal head layout plan'
      ],
      outputFormat: 'JSON with signal head layout, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'specifications', 'artifacts'],
      properties: {
        layout: { type: 'object' },
        signalHeads: { type: 'array' },
        mountingType: { type: 'string' },
        mastArmDesign: { type: 'object' },
        pedestrianSignals: { type: 'array' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'signal-heads']
}));

// Task 7: Electrical Design
export const electricalDesignTask = defineTask('electrical-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design electrical system',
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'electrical engineer',
      task: 'Design signal electrical system',
      context: args,
      instructions: [
        'Design service entrance and metering',
        'Design conduit layout',
        'Design junction box placement',
        'Design grounding system',
        'Calculate electrical loads',
        'Design cable sizing',
        'Design battery backup if required',
        'Create electrical schematic'
      ],
      outputFormat: 'JSON with electrical design, schematics'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        serviceEntrance: { type: 'object' },
        conduitLayout: { type: 'array' },
        electricalLoads: { type: 'object' },
        groundingSystem: { type: 'object' },
        batteryBackup: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'electrical']
}));

// Task 8: Signal Plans
export const signalPlansTask = defineTask('signal-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate signal plans',
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'traffic signal CAD technician',
      task: 'Generate traffic signal plans',
      context: args,
      instructions: [
        'Create signal layout plan',
        'Create pole and foundation details',
        'Create wiring diagram',
        'Create conduit plan',
        'Create signal head schedule',
        'Create detector layout plan',
        'Create timing sheet',
        'Create equipment list'
      ],
      outputFormat: 'JSON with drawing list, file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'artifacts'],
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sheetNumber: { type: 'string' },
              title: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        equipmentList: { type: 'array' },
        drawingIndex: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'plans']
}));

// Task 9: Signal Design Report
export const signalReportTask = defineTask('signal-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate signal design report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'traffic engineer',
      task: 'Generate comprehensive signal design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document warrant analysis',
        'Present phasing design',
        'Document timing parameters',
        'Describe detection system',
        'Document controller specifications',
        'Include signal head layout',
        'Present electrical design',
        'Include cost estimate'
      ],
      outputFormat: 'JSON with report path, key elements'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyElements', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyElements: { type: 'array' },
        costEstimate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'signal', 'reporting']
}));
