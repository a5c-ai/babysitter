/**
 * @process specializations/domains/science/nanotechnology/nanodevice-integration
 * @description Nanodevice Integration Process Flow - Design and validate complete nanodevice fabrication
 * process flows integrating multiple unit processes (lithography, deposition, etching) with process
 * compatibility analysis, yield monitoring, failure mode identification, and iterative optimization
 * of critical interfaces.
 * @inputs { deviceArchitecture: object, processModules: array, yieldTarget: number, criticalInterfaces?: array }
 * @outputs { success: boolean, processFlow: object, yieldAnalysis: object, integrationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanodevice-integration', {
 *   deviceArchitecture: { type: 'nanowire-FET', layers: 5, criticalDimension: 20 },
 *   processModules: ['lithography', 'ALD', 'etch', 'metallization'],
 *   yieldTarget: 85,
 *   criticalInterfaces: ['gate-stack', 'source-drain-contact']
 * });
 *
 * @references
 * - National Nanotechnology Coordinated Infrastructure (NNCI): https://nnci.net/
 * - SEMI Standards for Nanoelectronics: https://www.semi.org/
 * - Focused Ion Beam (FIB) Systems: https://www.fei.com/technologies/focused-ion-beam/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceArchitecture,
    processModules,
    yieldTarget,
    criticalInterfaces = [],
    maxIntegrationIterations = 3
  } = inputs;

  // Phase 1: Process Flow Design
  const processFlowDesign = await ctx.task(processFlowDesignTask, {
    deviceArchitecture,
    processModules,
    criticalInterfaces
  });

  // Quality Gate: Process flow must be feasible
  if (!processFlowDesign.feasible) {
    return {
      success: false,
      error: 'Nanodevice process flow design not feasible',
      phase: 'process-flow-design',
      recommendations: processFlowDesign.recommendations
    };
  }

  // Breakpoint: Review process flow design
  await ctx.breakpoint({
    question: `Review ${deviceArchitecture.type} process flow. ${processFlowDesign.totalSteps} steps across ${processModules.length} modules. Approve to proceed?`,
    title: 'Process Flow Design Review',
    context: {
      runId: ctx.runId,
      deviceArchitecture,
      processFlow: processFlowDesign.processFlow,
      criticalSteps: processFlowDesign.criticalSteps,
      files: [{
        path: 'artifacts/process-flow.json',
        format: 'json',
        content: processFlowDesign
      }]
    }
  });

  // Phase 2: Process Compatibility Analysis
  const compatibilityAnalysis = await ctx.task(compatibilityAnalysisTask, {
    processFlowDesign,
    processModules,
    deviceArchitecture
  });

  // Quality Gate: All processes must be compatible
  if (!compatibilityAnalysis.allCompatible) {
    await ctx.breakpoint({
      question: `Process compatibility issues detected: ${compatibilityAnalysis.incompatibilities.length} incompatibilities. Review and resolve?`,
      title: 'Process Compatibility Warning',
      context: {
        runId: ctx.runId,
        incompatibilities: compatibilityAnalysis.incompatibilities,
        recommendations: compatibilityAnalysis.recommendations
      }
    });
  }

  // Phase 3: Interface Analysis (Iterative Optimization)
  let integrationIteration = 0;
  let interfaceQuality = null;
  const interfaceOptimizationHistory = [];

  for (const criticalInterface of criticalInterfaces) {
    let interfaceOptimized = false;
    let interfaceIteration = 0;

    while (!interfaceOptimized && interfaceIteration < maxIntegrationIterations) {
      interfaceIteration++;

      // Interface characterization
      const interfaceCharacterization = await ctx.task(interfaceCharacterizationTask, {
        interface: criticalInterface,
        processFlowDesign,
        iteration: interfaceIteration,
        previousResults: interfaceIteration > 1 ? interfaceOptimizationHistory.find(h => h.interface === criticalInterface) : null
      });

      // Interface optimization
      const interfaceOptimization = await ctx.task(interfaceOptimizationTask, {
        interface: criticalInterface,
        characterization: interfaceCharacterization,
        processFlowDesign,
        iteration: interfaceIteration
      });

      interfaceOptimized = interfaceOptimization.meetsRequirements;
      interfaceQuality = interfaceOptimization.qualityScore;

      interfaceOptimizationHistory.push({
        interface: criticalInterface,
        iteration: interfaceIteration,
        characterization: interfaceCharacterization,
        optimization: interfaceOptimization,
        qualityScore: interfaceQuality,
        optimized: interfaceOptimized
      });

      if (!interfaceOptimized && interfaceIteration < maxIntegrationIterations) {
        await ctx.breakpoint({
          question: `Interface '${criticalInterface}' optimization iteration ${interfaceIteration}: Quality score ${interfaceQuality}/100. Continue optimization?`,
          title: 'Interface Optimization Progress',
          context: {
            runId: ctx.runId,
            interface: criticalInterface,
            qualityScore: interfaceQuality,
            recommendations: interfaceOptimization.recommendations
          }
        });
      }
    }
  }

  // Phase 4: Yield Modeling
  const yieldModeling = await ctx.task(yieldModelingTask, {
    processFlowDesign,
    compatibilityAnalysis,
    interfaceOptimizationHistory,
    yieldTarget
  });

  // Quality Gate: Predicted yield must meet target
  if (yieldModeling.predictedYield < yieldTarget) {
    await ctx.breakpoint({
      question: `Predicted yield ${yieldModeling.predictedYield.toFixed(1)}% below target ${yieldTarget}%. Review yield limiters and proceed?`,
      title: 'Yield Target Warning',
      context: {
        runId: ctx.runId,
        predictedYield: yieldModeling.predictedYield,
        yieldTarget,
        yieldLimiters: yieldModeling.yieldLimiters,
        recommendations: yieldModeling.recommendations
      }
    });
  }

  // Phase 5: Failure Mode Analysis
  const failureModeAnalysis = await ctx.task(failureModeAnalysisTask, {
    processFlowDesign,
    yieldModeling,
    criticalInterfaces,
    deviceArchitecture
  });

  // Phase 6: Test Structure Design
  const testStructureDesign = await ctx.task(testStructureDesignTask, {
    deviceArchitecture,
    processFlowDesign,
    criticalInterfaces,
    failureModeAnalysis
  });

  // Phase 7: In-Line Metrology Plan
  const metrologyPlan = await ctx.task(metrologyPlanTask, {
    processFlowDesign,
    criticalInterfaces,
    yieldModeling,
    testStructureDesign
  });

  // Phase 8: Process Validation
  const processValidation = await ctx.task(processValidationTask, {
    processFlowDesign,
    metrologyPlan,
    yieldTarget,
    testStructureDesign
  });

  // Phase 9: Integration Documentation
  const integrationDocumentation = await ctx.task(integrationDocumentationTask, {
    deviceArchitecture,
    processFlowDesign,
    compatibilityAnalysis,
    interfaceOptimizationHistory,
    yieldModeling,
    failureModeAnalysis,
    testStructureDesign,
    metrologyPlan,
    processValidation
  });

  // Final Breakpoint: Process flow approval
  await ctx.breakpoint({
    question: `Nanodevice integration complete. Predicted yield: ${yieldModeling.predictedYield.toFixed(1)}%. ${failureModeAnalysis.criticalFailureModes.length} critical failure modes identified. Approve process flow?`,
    title: 'Nanodevice Integration Approval',
    context: {
      runId: ctx.runId,
      predictedYield: yieldModeling.predictedYield,
      criticalFailureModes: failureModeAnalysis.criticalFailureModes,
      validationStatus: processValidation.status,
      files: [
        { path: 'artifacts/integration-report.md', format: 'markdown', content: integrationDocumentation.markdown },
        { path: 'artifacts/process-flow.json', format: 'json', content: processFlowDesign.processFlow }
      ]
    }
  });

  return {
    success: true,
    processFlow: {
      design: processFlowDesign,
      compatibility: compatibilityAnalysis,
      interfaces: interfaceOptimizationHistory,
      validation: processValidation
    },
    yieldAnalysis: {
      predictedYield: yieldModeling.predictedYield,
      yieldTarget,
      yieldLimiters: yieldModeling.yieldLimiters,
      yieldModel: yieldModeling.model
    },
    failureModeAnalysis,
    metrologyPlan,
    testStructureDesign,
    integrationReport: integrationDocumentation,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanodevice-integration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const processFlowDesignTask = defineTask('process-flow-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design process flow for ${args.deviceArchitecture.type}`,
  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'Senior Nanodevice Integration Engineer',
      task: 'Design complete process flow for nanodevice fabrication',
      context: args,
      instructions: [
        '1. Define complete process sequence from substrate to device',
        '2. Identify all unit process steps required',
        '3. Define process specifications for each step',
        '4. Identify critical process steps and parameters',
        '5. Plan layer-to-layer alignment strategy',
        '6. Define inter-step handling requirements',
        '7. Identify potential process interactions',
        '8. Plan metrology and inspection points',
        '9. Estimate total process time and complexity',
        '10. Document process flow rationale'
      ],
      outputFormat: 'JSON object with process flow design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'processFlow', 'totalSteps', 'criticalSteps'],
      properties: {
        feasible: { type: 'boolean' },
        processFlow: { type: 'array' },
        totalSteps: { type: 'number' },
        criticalSteps: { type: 'array' },
        alignmentStrategy: { type: 'object' },
        handlingRequirements: { type: 'object' },
        metrologyPoints: { type: 'array' },
        estimatedTime: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'process-flow']
}));

export const compatibilityAnalysisTask = defineTask('compatibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process compatibility',
  agent: {
    name: 'compatibility-analyst',
    prompt: {
      role: 'Process Compatibility Analysis Specialist',
      task: 'Analyze compatibility between sequential process steps',
      context: args,
      instructions: [
        '1. Check thermal budget compatibility across flow',
        '2. Analyze chemical compatibility between steps',
        '3. Check material compatibility at interfaces',
        '4. Assess contamination cross-talk risks',
        '5. Verify equipment compatibility',
        '6. Check for process-induced damage risks',
        '7. Analyze queue time sensitivities',
        '8. Assess atmosphere compatibility',
        '9. Identify all incompatibilities',
        '10. Recommend mitigation strategies'
      ],
      outputFormat: 'JSON object with compatibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['allCompatible', 'compatibilityMatrix', 'incompatibilities'],
      properties: {
        allCompatible: { type: 'boolean' },
        compatibilityMatrix: { type: 'object' },
        incompatibilities: { type: 'array' },
        thermalBudgetAnalysis: { type: 'object' },
        chemicalCompatibility: { type: 'object' },
        contaminationRisks: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'compatibility']
}));

export const interfaceCharacterizationTask = defineTask('interface-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Characterize ${args.interface} interface`,
  agent: {
    name: 'interface-scientist',
    prompt: {
      role: 'Interface Characterization Scientist',
      task: 'Characterize critical device interface',
      context: args,
      instructions: [
        '1. Define interface structure and materials',
        '2. Characterize interface morphology (TEM, AFM)',
        '3. Analyze interface composition (XPS, EELS)',
        '4. Measure interface electrical properties',
        '5. Assess interface defect density',
        '6. Characterize interface roughness',
        '7. Analyze diffusion/intermixing',
        '8. Measure interface thickness if applicable',
        '9. Compare with target specifications',
        '10. Document characterization results'
      ],
      outputFormat: 'JSON object with interface characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaceQuality', 'morphology', 'composition'],
      properties: {
        interfaceQuality: { type: 'number' },
        morphology: { type: 'object' },
        composition: { type: 'object' },
        electricalProperties: { type: 'object' },
        defectDensity: { type: 'number' },
        roughness: { type: 'number' },
        diffusionAnalysis: { type: 'object' },
        comparisonToSpec: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'interface']
}));

export const interfaceOptimizationTask = defineTask('interface-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize ${args.interface} interface`,
  agent: {
    name: 'interface-engineer',
    prompt: {
      role: 'Interface Process Optimization Engineer',
      task: 'Optimize process parameters for interface quality',
      context: args,
      instructions: [
        '1. Analyze interface characterization results',
        '2. Identify process parameters affecting interface',
        '3. Optimize surface preparation before interface formation',
        '4. Adjust deposition parameters for interface quality',
        '5. Optimize thermal treatments',
        '6. Minimize interface defects and contamination',
        '7. Balance interface quality with device requirements',
        '8. Validate optimized interface',
        '9. Document optimization parameters',
        '10. Assess remaining issues'
      ],
      outputFormat: 'JSON object with interface optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsRequirements', 'qualityScore', 'optimizedParameters'],
      properties: {
        meetsRequirements: { type: 'boolean' },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        optimizedParameters: { type: 'object' },
        surfacePreparation: { type: 'object' },
        thermalTreatments: { type: 'object' },
        remainingIssues: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'optimization']
}));

export const yieldModelingTask = defineTask('yield-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model device yield',
  agent: {
    name: 'yield-engineer',
    prompt: {
      role: 'Yield Modeling Engineer',
      task: 'Model and predict device fabrication yield',
      context: args,
      instructions: [
        '1. Identify all yield loss mechanisms',
        '2. Assign defect densities to each process step',
        '3. Calculate step yields using Poisson/negative binomial models',
        '4. Account for critical area for random defects',
        '5. Model systematic yield losses',
        '6. Calculate overall process yield',
        '7. Perform sensitivity analysis',
        '8. Identify yield limiters',
        '9. Compare predicted vs target yield',
        '10. Recommend yield improvement actions'
      ],
      outputFormat: 'JSON object with yield model'
    },
    outputSchema: {
      type: 'object',
      required: ['predictedYield', 'yieldLimiters', 'model'],
      properties: {
        predictedYield: { type: 'number' },
        model: { type: 'object' },
        stepYields: { type: 'object' },
        yieldLimiters: { type: 'array' },
        sensitivityAnalysis: { type: 'object' },
        randomDefectYield: { type: 'number' },
        systematicYield: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'yield']
}));

export const failureModeAnalysisTask = defineTask('failure-mode-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze potential failure modes',
  agent: {
    name: 'reliability-engineer',
    prompt: {
      role: 'Device Reliability and Failure Analysis Engineer',
      task: 'Identify and analyze potential device failure modes',
      context: args,
      instructions: [
        '1. Identify all potential failure modes',
        '2. Classify failure modes by type and severity',
        '3. Correlate failure modes with process steps',
        '4. Assess failure mode probabilities',
        '5. Analyze root causes of critical failures',
        '6. Evaluate detection methods for each failure mode',
        '7. Calculate risk priority numbers (RPN)',
        '8. Identify critical failure modes',
        '9. Recommend failure mitigation strategies',
        '10. Plan failure analysis methodologies'
      ],
      outputFormat: 'JSON object with failure mode analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'criticalFailureModes', 'riskAssessment'],
      properties: {
        failureModes: { type: 'array' },
        criticalFailureModes: { type: 'array' },
        riskAssessment: { type: 'object' },
        rootCauseAnalysis: { type: 'object' },
        detectionMethods: { type: 'object' },
        mitigationStrategies: { type: 'array' },
        fmeaTable: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'reliability']
}));

export const testStructureDesignTask = defineTask('test-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design test structures',
  agent: {
    name: 'test-structure-engineer',
    prompt: {
      role: 'Test Structure Design Engineer',
      task: 'Design test structures for process monitoring and failure analysis',
      context: args,
      instructions: [
        '1. Design structures for each critical process step',
        '2. Include CD/overlay measurement structures',
        '3. Design electrical test structures (resistor, capacitor)',
        '4. Include interface test structures',
        '5. Design structures for failure analysis',
        '6. Plan test structure placement on die/wafer',
        '7. Define measurement procedures for each structure',
        '8. Include process monitor structures',
        '9. Design structures for reliability testing',
        '10. Document test structure specifications'
      ],
      outputFormat: 'JSON object with test structure design'
    },
    outputSchema: {
      type: 'object',
      required: ['testStructures', 'layout', 'measurementProcedures'],
      properties: {
        testStructures: { type: 'array' },
        layout: { type: 'object' },
        measurementProcedures: { type: 'object' },
        cdStructures: { type: 'array' },
        electricalStructures: { type: 'array' },
        interfaceStructures: { type: 'array' },
        reliabilityStructures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'test-structures']
}));

export const metrologyPlanTask = defineTask('metrology-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop in-line metrology plan',
  agent: {
    name: 'metrology-planner',
    prompt: {
      role: 'In-Line Metrology Planning Specialist',
      task: 'Develop comprehensive in-line metrology plan',
      context: args,
      instructions: [
        '1. Define measurement points in process flow',
        '2. Select metrology tools for each measurement',
        '3. Define sampling plans and frequencies',
        '4. Establish measurement specifications',
        '5. Define pass/fail criteria at each point',
        '6. Plan data collection and analysis',
        '7. Define SPC limits for critical parameters',
        '8. Plan measurement correlation and calibration',
        '9. Estimate metrology impact on cycle time',
        '10. Document metrology procedures'
      ],
      outputFormat: 'JSON object with metrology plan'
    },
    outputSchema: {
      type: 'object',
      required: ['measurementPoints', 'tools', 'samplingPlan'],
      properties: {
        measurementPoints: { type: 'array' },
        tools: { type: 'object' },
        samplingPlan: { type: 'object' },
        specifications: { type: 'object' },
        spcLimits: { type: 'object' },
        dataAnalysisPlan: { type: 'object' },
        cycleTimeImpact: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'metrology']
}));

export const processValidationTask = defineTask('process-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate integrated process',
  agent: {
    name: 'validation-engineer',
    prompt: {
      role: 'Process Validation Engineer',
      task: 'Validate complete integrated process flow',
      context: args,
      instructions: [
        '1. Execute full process flow validation runs',
        '2. Verify all step specifications are met',
        '3. Validate yield against predictions',
        '4. Verify metrology plan effectiveness',
        '5. Validate test structure measurements',
        '6. Check device electrical performance',
        '7. Verify process reproducibility',
        '8. Document any deviations or issues',
        '9. Complete validation checklist',
        '10. Generate validation summary'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'validationResults', 'deviations'],
      properties: {
        status: { type: 'string', enum: ['passed', 'conditional', 'failed'] },
        validationResults: { type: 'object' },
        yieldValidation: { type: 'object' },
        devicePerformance: { type: 'object' },
        reproducibility: { type: 'object' },
        deviations: { type: 'array' },
        validationChecklist: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'validation']
}));

export const integrationDocumentationTask = defineTask('integration-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate integration documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive integration documentation',
      context: args,
      instructions: [
        '1. Create process flow specification document',
        '2. Document all process step parameters',
        '3. Include compatibility analysis results',
        '4. Document interface optimization results',
        '5. Include yield model and predictions',
        '6. Document failure mode analysis',
        '7. Include test structure specifications',
        '8. Document metrology plan',
        '9. Include validation results',
        '10. Generate executive summary'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'processSpecification'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        processSpecification: { type: 'object' },
        yieldReport: { type: 'object' },
        fmeaReport: { type: 'object' },
        validationReport: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'integration', 'documentation']
}));
