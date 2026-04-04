/**
 * @process specializations/domains/science/nanotechnology/in-situ-characterization
 * @description In-Situ Characterization Experiment Design - Design and execute in-situ and operando
 * characterization experiments to observe dynamic nanoscale processes including synthesis monitoring,
 * environmental exposure effects, and device operation with real-time data capture, process correlation,
 * and phenomenon documentation.
 * @inputs { experimentType: string, dynamicProcess: object, characterizationTechniques: array, temporalRequirements?: object }
 * @outputs { success: boolean, experimentDesign: object, realTimeData: object, phenomenonDocumentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/in-situ-characterization', {
 *   experimentType: 'synthesis-monitoring',
 *   dynamicProcess: { type: 'nanoparticle-growth', material: 'gold', mechanism: 'citrate-reduction' },
 *   characterizationTechniques: ['in-situ-TEM', 'UV-Vis', 'SAXS'],
 *   temporalRequirements: { duration: '30min', samplingRate: '1s' }
 * });
 *
 * @references
 * - Scanning Probe Microscopy for Nanoscience: https://www.nature.com/articles/nnano.2007.300
 * - Raman Spectroscopy of Nanomaterials: https://pubs.rsc.org/en/content/articlelanding/2020/cs/c9cs00621d
 * - DigitalMicrograph (Gatan): https://www.gatan.com/products/tem-analysis/digitalmicrograph-software
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    experimentType,
    dynamicProcess,
    characterizationTechniques,
    temporalRequirements = {},
    environmentalConditions = {}
  } = inputs;

  // Phase 1: Experiment Design
  const experimentDesign = await ctx.task(experimentDesignTask, {
    experimentType,
    dynamicProcess,
    characterizationTechniques,
    temporalRequirements,
    environmentalConditions
  });

  // Quality Gate: Design must be feasible
  if (!experimentDesign.feasible) {
    return {
      success: false,
      error: 'In-situ experiment design not feasible',
      phase: 'experiment-design',
      recommendations: experimentDesign.recommendations
    };
  }

  // Breakpoint: Review experiment design
  await ctx.breakpoint({
    question: `Review in-situ ${experimentType} experiment design. ${characterizationTechniques.length} techniques planned. Approve to proceed?`,
    title: 'In-Situ Experiment Design Review',
    context: {
      runId: ctx.runId,
      experimentType,
      dynamicProcess,
      techniques: characterizationTechniques,
      design: experimentDesign,
      files: [{
        path: 'artifacts/experiment-design.json',
        format: 'json',
        content: experimentDesign
      }]
    }
  });

  // Phase 2: Sample/Cell Preparation
  const samplePreparation = await ctx.task(sampleCellPreparationTask, {
    experimentDesign,
    dynamicProcess,
    characterizationTechniques
  });

  // Phase 3: Instrument Configuration
  const instrumentConfig = await ctx.task(instrumentConfigurationTask, {
    experimentDesign,
    characterizationTechniques,
    temporalRequirements,
    samplePreparation
  });

  // Phase 4: Data Acquisition Protocol
  const dataAcquisitionProtocol = await ctx.task(dataAcquisitionProtocolTask, {
    experimentDesign,
    instrumentConfig,
    temporalRequirements,
    characterizationTechniques
  });

  // Breakpoint: Pre-experiment verification
  await ctx.breakpoint({
    question: `Pre-experiment verification complete. All ${characterizationTechniques.length} instruments configured. Ready to begin data acquisition?`,
    title: 'Pre-Experiment Verification',
    context: {
      runId: ctx.runId,
      instrumentConfig,
      dataAcquisitionProtocol,
      estimatedDuration: dataAcquisitionProtocol.estimatedDuration
    }
  });

  // Phase 5: Real-Time Data Acquisition (Simulated)
  const realTimeData = await ctx.task(realTimeDataAcquisitionTask, {
    experimentDesign,
    dataAcquisitionProtocol,
    dynamicProcess,
    characterizationTechniques
  });

  // Phase 6: Process Correlation Analysis
  const processCorrelation = await ctx.task(processCorrelationTask, {
    realTimeData,
    dynamicProcess,
    characterizationTechniques
  });

  // Phase 7: Kinetic Analysis
  const kineticAnalysis = await ctx.task(kineticAnalysisTask, {
    realTimeData,
    processCorrelation,
    dynamicProcess
  });

  // Phase 8: Phenomenon Documentation
  const phenomenonDoc = await ctx.task(phenomenonDocumentationTask, {
    realTimeData,
    processCorrelation,
    kineticAnalysis,
    dynamicProcess
  });

  // Phase 9: Data Validation
  const dataValidation = await ctx.task(dataValidationTask, {
    realTimeData,
    processCorrelation,
    kineticAnalysis,
    experimentDesign
  });

  // Quality Gate: Data must pass validation
  if (!dataValidation.valid) {
    await ctx.breakpoint({
      question: `Data validation issues detected: ${dataValidation.issues.length} issues. Review and determine if experiment should be repeated?`,
      title: 'Data Validation Warning',
      context: {
        runId: ctx.runId,
        issues: dataValidation.issues,
        recommendations: dataValidation.recommendations
      }
    });
  }

  // Phase 10: Report Generation
  const experimentReport = await ctx.task(reportGenerationTask, {
    experimentDesign,
    realTimeData,
    processCorrelation,
    kineticAnalysis,
    phenomenonDoc,
    dataValidation,
    dynamicProcess
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `In-situ experiment complete. ${phenomenonDoc.phenomenaObserved.length} phenomena documented. Data quality: ${dataValidation.qualityScore}/100. Approve results?`,
    title: 'In-Situ Experiment Results Approval',
    context: {
      runId: ctx.runId,
      phenomenaObserved: phenomenonDoc.phenomenaObserved,
      keyFindings: phenomenonDoc.keyFindings,
      dataQuality: dataValidation.qualityScore,
      files: [
        { path: 'artifacts/experiment-report.md', format: 'markdown', content: experimentReport.markdown },
        { path: 'artifacts/realtime-data.json', format: 'json', content: realTimeData }
      ]
    }
  });

  return {
    success: true,
    experimentDesign,
    realTimeData: {
      acquisitionSummary: realTimeData.summary,
      dataPoints: realTimeData.totalDataPoints,
      duration: realTimeData.actualDuration
    },
    processCorrelation,
    kineticAnalysis,
    phenomenonDocumentation: phenomenonDoc,
    dataValidation,
    report: experimentReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/in-situ-characterization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design in-situ ${args.experimentType} experiment`,
  agent: {
    name: 'in-situ-experiment-designer',
    prompt: {
      role: 'In-Situ Characterization Experiment Designer',
      task: 'Design comprehensive in-situ characterization experiment',
      context: args,
      instructions: [
        '1. Define experimental objectives and success criteria',
        '2. Select optimal characterization techniques for dynamic process',
        '3. Design sample/cell configuration for in-situ observation',
        '4. Plan environmental control (temperature, atmosphere, liquid)',
        '5. Define temporal resolution requirements for each technique',
        '6. Plan data synchronization across multiple techniques',
        '7. Identify potential experimental challenges',
        '8. Design control experiments and references',
        '9. Plan beam damage mitigation strategies',
        '10. Document safety considerations'
      ],
      outputFormat: 'JSON object with experiment design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'objectives', 'techniqueConfiguration'],
      properties: {
        feasible: { type: 'boolean' },
        objectives: { type: 'array', items: { type: 'string' } },
        techniqueConfiguration: { type: 'object' },
        environmentalControl: { type: 'object' },
        temporalPlan: { type: 'object' },
        synchronizationStrategy: { type: 'object' },
        challenges: { type: 'array', items: { type: 'string' } },
        safetyConsiderations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'experiment-design']
}));

export const sampleCellPreparationTask = defineTask('sample-cell-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design sample/cell preparation protocol',
  agent: {
    name: 'sample-cell-specialist',
    prompt: {
      role: 'In-Situ Sample Cell Specialist',
      task: 'Design sample and cell preparation for in-situ experiments',
      context: args,
      instructions: [
        '1. Select appropriate in-situ cell type (liquid, heating, environmental)',
        '2. Design sample loading procedure',
        '3. Define window materials and thickness',
        '4. Plan fluid flow or gas handling if needed',
        '5. Design temperature control and calibration',
        '6. Address sample drift and stability',
        '7. Plan electrode configuration if electrochemistry involved',
        '8. Define cell assembly and sealing procedures',
        '9. Plan reference standards for calibration',
        '10. Document cell cleaning and maintenance'
      ],
      outputFormat: 'JSON object with sample/cell preparation protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['cellType', 'preparationProtocol', 'assemblyProcedure'],
      properties: {
        cellType: { type: 'string' },
        windowMaterial: { type: 'string' },
        preparationProtocol: { type: 'array' },
        assemblyProcedure: { type: 'array' },
        temperatureControl: { type: 'object' },
        fluidHandling: { type: 'object' },
        calibrationProcedure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'sample-preparation']
}));

export const instrumentConfigurationTask = defineTask('instrument-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure instruments for in-situ experiment',
  agent: {
    name: 'instrument-specialist',
    prompt: {
      role: 'Advanced Instrumentation Specialist',
      task: 'Configure instruments for synchronized in-situ data acquisition',
      context: args,
      instructions: [
        '1. Configure primary characterization instrument parameters',
        '2. Set up auxiliary technique instruments',
        '3. Configure data acquisition timing and synchronization',
        '4. Set up environmental control systems',
        '5. Configure automated acquisition routines',
        '6. Set up real-time data monitoring',
        '7. Configure beam damage minimization protocols',
        '8. Set up data storage and backup',
        '9. Configure alarm and safety interlocks',
        '10. Document all instrument settings'
      ],
      outputFormat: 'JSON object with instrument configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['instrumentSettings', 'synchronization', 'dataAcquisition'],
      properties: {
        instrumentSettings: { type: 'object' },
        synchronization: { type: 'object' },
        dataAcquisition: { type: 'object' },
        environmentalControl: { type: 'object' },
        safetyInterlocks: { type: 'array' },
        monitoringParameters: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'instrumentation']
}));

export const dataAcquisitionProtocolTask = defineTask('data-acquisition-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop data acquisition protocol',
  agent: {
    name: 'data-acquisition-specialist',
    prompt: {
      role: 'Data Acquisition Protocol Specialist',
      task: 'Develop comprehensive data acquisition protocol for in-situ experiment',
      context: args,
      instructions: [
        '1. Define data acquisition sequence and timing',
        '2. Set sampling rates for each technique',
        '3. Define trigger conditions for key events',
        '4. Plan data format and metadata capture',
        '5. Configure automated response to events',
        '6. Plan data quality checks during acquisition',
        '7. Define experiment phases and transitions',
        '8. Set up data logging and timestamps',
        '9. Plan contingency protocols for issues',
        '10. Estimate data volume and storage needs'
      ],
      outputFormat: 'JSON object with data acquisition protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['acquisitionSequence', 'samplingRates', 'triggerConditions'],
      properties: {
        acquisitionSequence: { type: 'array' },
        samplingRates: { type: 'object' },
        triggerConditions: { type: 'array' },
        experimentPhases: { type: 'array' },
        dataFormat: { type: 'object' },
        estimatedDuration: { type: 'string' },
        dataVolume: { type: 'string' },
        contingencyProtocols: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'data-acquisition']
}));

export const realTimeDataAcquisitionTask = defineTask('realtime-data-acquisition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute real-time data acquisition',
  agent: {
    name: 'experiment-operator',
    prompt: {
      role: 'In-Situ Experiment Operator',
      task: 'Execute and monitor real-time data acquisition',
      context: args,
      instructions: [
        '1. Execute experiment initialization sequence',
        '2. Monitor data acquisition in real-time',
        '3. Document observed phenomena during experiment',
        '4. Track environmental conditions throughout',
        '5. Note any deviations from expected behavior',
        '6. Capture key events with timestamps',
        '7. Monitor data quality during acquisition',
        '8. Execute phase transitions as planned',
        '9. Document any issues or anomalies',
        '10. Compile acquisition summary'
      ],
      outputFormat: 'JSON object with acquisition results'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'totalDataPoints', 'actualDuration'],
      properties: {
        summary: { type: 'object' },
        totalDataPoints: { type: 'number' },
        actualDuration: { type: 'string' },
        dataByTechnique: { type: 'object' },
        keyEvents: { type: 'array' },
        environmentalLog: { type: 'array' },
        anomalies: { type: 'array' },
        dataQualityIndicators: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'data-acquisition']
}));

export const processCorrelationTask = defineTask('process-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Correlate data with dynamic process',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'Dynamic Process Correlation Analyst',
      task: 'Correlate multi-technique data with dynamic process stages',
      context: args,
      instructions: [
        '1. Align data streams temporally',
        '2. Identify process stages from data signatures',
        '3. Correlate changes across different techniques',
        '4. Map structural changes to process conditions',
        '5. Identify cause-effect relationships',
        '6. Quantify process kinetics from correlated data',
        '7. Detect intermediate states or transients',
        '8. Compare observed with expected process behavior',
        '9. Document correlations and their significance',
        '10. Identify unexplained observations for further study'
      ],
      outputFormat: 'JSON object with process correlation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['processStages', 'correlations', 'timeline'],
      properties: {
        processStages: { type: 'array' },
        correlations: { type: 'array' },
        timeline: { type: 'object' },
        intermediateStates: { type: 'array' },
        causeEffectRelationships: { type: 'array' },
        unexplainedObservations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'correlation']
}));

export const kineticAnalysisTask = defineTask('kinetic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process kinetics',
  agent: {
    name: 'kinetics-specialist',
    prompt: {
      role: 'Reaction Kinetics Specialist',
      task: 'Analyze kinetics of dynamic nanoscale process',
      context: args,
      instructions: [
        '1. Extract rate data from temporal measurements',
        '2. Fit kinetic models to process data',
        '3. Determine rate constants and activation energies',
        '4. Identify rate-limiting steps',
        '5. Analyze nucleation and growth kinetics if applicable',
        '6. Compare with established kinetic models',
        '7. Calculate reaction orders and mechanisms',
        '8. Assess temperature dependence if measured',
        '9. Document kinetic parameters and uncertainties',
        '10. Provide mechanistic interpretation'
      ],
      outputFormat: 'JSON object with kinetic analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['kineticModel', 'rateConstants', 'mechanisticInterpretation'],
      properties: {
        kineticModel: { type: 'string' },
        rateConstants: { type: 'object' },
        activationEnergy: { type: 'number' },
        reactionOrders: { type: 'object' },
        rateLimitingStep: { type: 'string' },
        modelFitQuality: { type: 'object' },
        mechanisticInterpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'kinetics']
}));

export const phenomenonDocumentationTask = defineTask('phenomenon-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document observed phenomena',
  agent: {
    name: 'phenomenon-documentor',
    prompt: {
      role: 'Scientific Phenomenon Documentation Specialist',
      task: 'Document all observed dynamic phenomena in detail',
      context: args,
      instructions: [
        '1. Catalog all observed phenomena with timestamps',
        '2. Describe morphological changes in detail',
        '3. Document phase transformations observed',
        '4. Describe aggregation/dissolution events',
        '5. Capture unusual or unexpected observations',
        '6. Link phenomena to process conditions',
        '7. Compare with literature observations',
        '8. Assess reproducibility of phenomena',
        '9. Generate key findings summary',
        '10. Identify phenomena requiring further investigation'
      ],
      outputFormat: 'JSON object with phenomenon documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['phenomenaObserved', 'keyFindings', 'detailedDescriptions'],
      properties: {
        phenomenaObserved: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        detailedDescriptions: { type: 'array' },
        unexpectedObservations: { type: 'array' },
        literatureComparison: { type: 'object' },
        furtherInvestigation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'documentation']
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate in-situ experiment data',
  agent: {
    name: 'data-validator',
    prompt: {
      role: 'Experimental Data Validation Specialist',
      task: 'Validate quality and reliability of in-situ experiment data',
      context: args,
      instructions: [
        '1. Check data completeness and continuity',
        '2. Validate data synchronization across techniques',
        '3. Assess beam damage effects on data quality',
        '4. Check for instrumental artifacts',
        '5. Validate environmental control data',
        '6. Assess reproducibility of key observations',
        '7. Check consistency between techniques',
        '8. Identify any data quality issues',
        '9. Calculate overall data quality score',
        '10. Recommend data that should be excluded'
      ],
      outputFormat: 'JSON object with data validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'qualityScore', 'validationChecks'],
      properties: {
        valid: { type: 'boolean' },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        validationChecks: { type: 'array' },
        issues: { type: 'array' },
        dataExclusions: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'validation']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate in-situ experiment report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Report Writer for In-Situ Experiments',
      task: 'Generate comprehensive in-situ experiment report',
      context: args,
      instructions: [
        '1. Create executive summary of experiment and findings',
        '2. Document experimental design and setup',
        '3. Present timeline of observed phenomena',
        '4. Include process correlation analysis',
        '5. Present kinetic analysis results',
        '6. Document all phenomena with supporting data',
        '7. Include data quality assessment',
        '8. Provide mechanistic conclusions',
        '9. Discuss implications and significance',
        '10. Recommend future experiments'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'conclusions'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        experimentDetails: { type: 'object' },
        resultsSection: { type: 'object' },
        conclusions: { type: 'array', items: { type: 'string' } },
        futureWork: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'in-situ', 'reporting']
}));
