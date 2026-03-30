/**
 * @process chemical-engineering/process-simulation-model
 * @description Build and validate steady-state process simulation models using tools like Aspen Plus, HYSYS, or DWSIM
 * @inputs { processName: string, pfdData: object, thermodynamicSystem: string, validationData: object, outputDir: string }
 * @outputs { success: boolean, modelPath: string, validationResults: object, sensitivityAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    pfdData,
    thermodynamicSystem,
    validationData = {},
    simulationTool = 'DWSIM',
    outputDir = 'simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Thermodynamic Model Selection
  ctx.log('info', 'Starting simulation model development: Selecting thermodynamic models');
  const thermoSelectionResult = await ctx.task(thermodynamicSelectionTask, {
    processName,
    components: pfdData.components,
    operatingConditions: pfdData.operatingConditions,
    thermodynamicSystem,
    outputDir
  });

  if (!thermoSelectionResult.success) {
    return {
      success: false,
      error: 'Thermodynamic model selection failed',
      details: thermoSelectionResult,
      metadata: { processId: 'chemical-engineering/process-simulation-model', timestamp: startTime }
    };
  }

  artifacts.push(...thermoSelectionResult.artifacts);

  // Task 2: Component Database Configuration
  ctx.log('info', 'Configuring component database');
  const componentConfigResult = await ctx.task(componentConfigurationTask, {
    processName,
    components: pfdData.components,
    thermoModel: thermoSelectionResult.selectedModel,
    simulationTool,
    outputDir
  });

  artifacts.push(...componentConfigResult.artifacts);

  // Task 3: Unit Operations Configuration
  ctx.log('info', 'Configuring unit operations');
  const unitOpsResult = await ctx.task(unitOperationsConfigTask, {
    processName,
    equipmentList: pfdData.equipmentList,
    streamTable: pfdData.streamTable,
    thermoModel: thermoSelectionResult.selectedModel,
    simulationTool,
    outputDir
  });

  artifacts.push(...unitOpsResult.artifacts);

  // Task 4: Stream Connectivity Setup
  ctx.log('info', 'Setting up stream connectivity');
  const connectivityResult = await ctx.task(streamConnectivityTask, {
    processName,
    unitOperations: unitOpsResult.unitOperations,
    streamTable: pfdData.streamTable,
    outputDir
  });

  artifacts.push(...connectivityResult.artifacts);

  // Task 5: Feed and Operating Conditions Input
  ctx.log('info', 'Inputting feed and operating conditions');
  const feedConditionsResult = await ctx.task(feedConditionsTask, {
    processName,
    feedStreams: pfdData.feedStreams,
    operatingConditions: pfdData.operatingConditions,
    outputDir
  });

  artifacts.push(...feedConditionsResult.artifacts);

  // Task 6: Model Convergence and Solution
  ctx.log('info', 'Running simulation and achieving convergence');
  const convergenceResult = await ctx.task(modelConvergenceTask, {
    processName,
    modelConfiguration: {
      thermoModel: thermoSelectionResult.selectedModel,
      unitOperations: unitOpsResult.unitOperations,
      connectivity: connectivityResult.connectivity,
      feedConditions: feedConditionsResult.feedConditions
    },
    simulationTool,
    outputDir
  });

  artifacts.push(...convergenceResult.artifacts);

  // Breakpoint: Review simulation convergence
  await ctx.breakpoint({
    question: `Simulation model converged for ${processName}. Convergence status: ${convergenceResult.converged ? 'SUCCESS' : 'FAILED'}. ${convergenceResult.warnings?.length || 0} warnings. Proceed with validation?`,
    title: 'Simulation Model Convergence Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        converged: convergenceResult.converged,
        iterations: convergenceResult.iterations,
        warnings: convergenceResult.warnings,
        thermoModel: thermoSelectionResult.selectedModel.name
      }
    }
  });

  // Task 7: Model Validation
  ctx.log('info', 'Validating model against experimental/plant data');
  const validationResult = await ctx.task(modelValidationTask, {
    processName,
    simulationResults: convergenceResult.results,
    validationData,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  // Task 8: Sensitivity Analysis
  ctx.log('info', 'Performing sensitivity analysis');
  const sensitivityResult = await ctx.task(sensitivityAnalysisTask, {
    processName,
    modelConfiguration: convergenceResult.modelConfiguration,
    keyParameters: pfdData.keyParameters || [],
    simulationTool,
    outputDir
  });

  artifacts.push(...sensitivityResult.artifacts);

  // Task 9: Model Documentation
  ctx.log('info', 'Generating model documentation');
  const documentationResult = await ctx.task(modelDocumentationTask, {
    processName,
    thermoModel: thermoSelectionResult.selectedModel,
    unitOperations: unitOpsResult.unitOperations,
    validationResults: validationResult.validationResults,
    sensitivityResults: sensitivityResult.sensitivityResults,
    assumptions: {
      thermo: thermoSelectionResult.assumptions,
      components: componentConfigResult.assumptions,
      unitOps: unitOpsResult.assumptions
    },
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    modelPath: convergenceResult.modelPath,
    thermoModel: thermoSelectionResult.selectedModel,
    validationResults: validationResult.validationResults,
    sensitivityAnalysis: sensitivityResult.sensitivityResults,
    converged: convergenceResult.converged,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/process-simulation-model',
      timestamp: startTime,
      simulationTool,
      outputDir
    }
  };
}

// Task 1: Thermodynamic Model Selection
export const thermodynamicSelectionTask = defineTask('thermodynamic-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate thermodynamic models',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'thermodynamics specialist',
      task: 'Select appropriate thermodynamic property methods for process simulation',
      context: args,
      instructions: [
        'Analyze component types (polar, non-polar, electrolytes, etc.)',
        'Consider operating pressure and temperature ranges',
        'Evaluate phase behavior requirements (VLE, LLE, VLLE)',
        'Select equation of state (SRK, PR, PSRK, etc.) or activity model (NRTL, UNIQUAC, etc.)',
        'Justify thermodynamic model selection',
        'Identify binary interaction parameters needed',
        'Document model limitations and validity range',
        'Recommend validation approach for thermo model'
      ],
      outputFormat: 'JSON with selected model, justification, parameters, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedModel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedModel: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            validityRange: { type: 'object' },
            binaryParameters: { type: 'object' }
          }
        },
        justification: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'thermodynamics']
}));

// Task 2: Component Configuration
export const componentConfigurationTask = defineTask('component-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure component database',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process simulation engineer',
      task: 'Configure component database and properties for simulation',
      context: args,
      instructions: [
        'Add all process components to simulation',
        'Verify component property data availability',
        'Add user-defined components if needed (pseudocomponents)',
        'Configure component aliases and synonyms',
        'Set up petroleum fractions if applicable',
        'Verify critical properties and acentric factors',
        'Configure temperature-dependent properties',
        'Document any estimated or user-defined properties'
      ],
      outputFormat: 'JSON with component list, property sources, user-defined components, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'componentList', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        componentList: { type: 'array' },
        userDefinedComponents: { type: 'array' },
        propertyEstimations: { type: 'array' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'components']
}));

// Task 3: Unit Operations Configuration
export const unitOperationsConfigTask = defineTask('unit-operations-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure unit operations',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process simulation engineer',
      task: 'Configure all unit operations in the simulation model',
      context: args,
      instructions: [
        'Add all unit operations from equipment list',
        'Configure reactor models (stoichiometry, kinetics, equilibrium)',
        'Set up separation units (columns, flash drums, etc.)',
        'Configure heat exchangers with duty/area specifications',
        'Set up pumps and compressors with efficiency curves',
        'Configure mixers, splitters, and stream manipulators',
        'Set specifications and design variables for each unit',
        'Document model choices for each unit operation'
      ],
      outputFormat: 'JSON with unit operations configuration, model choices, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'unitOperations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        unitOperations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              type: { type: 'string' },
              model: { type: 'string' },
              specifications: { type: 'object' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'unit-operations']
}));

// Task 4: Stream Connectivity
export const streamConnectivityTask = defineTask('stream-connectivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up stream connectivity',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process simulation engineer',
      task: 'Configure stream connectivity between unit operations',
      context: args,
      instructions: [
        'Connect all material streams between units',
        'Connect energy streams (heat, work)',
        'Set up recycle streams with tear stream locations',
        'Configure recycle convergence parameters',
        'Identify and handle recycle loops',
        'Set up purge and bleed streams',
        'Verify flowsheet connectivity completeness',
        'Document calculation sequence'
      ],
      outputFormat: 'JSON with connectivity map, recycle streams, calculation sequence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'connectivity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        connectivity: {
          type: 'object',
          properties: {
            materialStreams: { type: 'array' },
            energyStreams: { type: 'array' },
            recycleStreams: { type: 'array' },
            tearStreams: { type: 'array' }
          }
        },
        calculationSequence: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'connectivity']
}));

// Task 5: Feed Conditions Input
export const feedConditionsTask = defineTask('feed-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Input feed and operating conditions',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process simulation engineer',
      task: 'Input all feed stream conditions and operating parameters',
      context: args,
      instructions: [
        'Set feed stream flow rates',
        'Specify feed compositions (mole or mass fractions)',
        'Set feed temperatures and pressures',
        'Input feed stream phase specifications',
        'Set operating parameters for all units',
        'Configure design specs and vary blocks if needed',
        'Set up calculator blocks for derived values',
        'Document all input specifications'
      ],
      outputFormat: 'JSON with feed conditions, operating parameters, design specs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'feedConditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        feedConditions: { type: 'object' },
        operatingParameters: { type: 'object' },
        designSpecs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'feed-conditions']
}));

// Task 6: Model Convergence
export const modelConvergenceTask = defineTask('model-convergence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run simulation and achieve convergence',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process simulation engineer',
      task: 'Run simulation and troubleshoot convergence issues',
      context: args,
      instructions: [
        'Initialize simulation with reasonable estimates',
        'Run flowsheet calculation',
        'Monitor convergence of recycle loops',
        'Troubleshoot convergence failures',
        'Adjust convergence parameters if needed',
        'Verify mass and energy balance closure',
        'Check for warnings and errors',
        'Save converged model file'
      ],
      outputFormat: 'JSON with convergence status, results, warnings, model path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'converged', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        converged: { type: 'boolean' },
        iterations: { type: 'number' },
        results: { type: 'object' },
        warnings: { type: 'array', items: { type: 'string' } },
        modelPath: { type: 'string' },
        modelConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'convergence']
}));

// Task 7: Model Validation
export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate model against experimental/plant data',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process validation engineer',
      task: 'Validate simulation model against available data',
      context: args,
      instructions: [
        'Compare simulation results with plant/experimental data',
        'Calculate deviations for key parameters',
        'Assess model accuracy for temperatures, pressures, flows',
        'Validate product compositions and purities',
        'Check heat duties against measured values',
        'Identify areas requiring model improvement',
        'Calculate overall model accuracy metrics',
        'Document validation results and limitations'
      ],
      outputFormat: 'JSON with validation results, deviations, accuracy metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationResults: {
          type: 'object',
          properties: {
            overallAccuracy: { type: 'number' },
            parameterDeviations: { type: 'object' },
            passedChecks: { type: 'array' },
            failedChecks: { type: 'array' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'validation']
}));

// Task 8: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis on key parameters',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process analysis engineer',
      task: 'Perform sensitivity analysis on key process parameters',
      context: args,
      instructions: [
        'Identify key input parameters for sensitivity study',
        'Define parameter variation ranges',
        'Run parametric studies varying one parameter at a time',
        'Analyze impact on key outputs (yield, purity, energy)',
        'Identify most sensitive parameters',
        'Generate sensitivity plots/tornado diagrams',
        'Document parameter sensitivities',
        'Recommend operating ranges based on sensitivity'
      ],
      outputFormat: 'JSON with sensitivity results, key sensitivities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sensitivityResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sensitivityResults: {
          type: 'object',
          properties: {
            parameters: { type: 'array' },
            sensitivities: { type: 'object' },
            mostSensitive: { type: 'array' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'sensitivity']
}));

// Task 9: Model Documentation
export const modelDocumentationTask = defineTask('model-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate model documentation',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process documentation engineer',
      task: 'Create comprehensive simulation model documentation',
      context: args,
      instructions: [
        'Document thermodynamic model selection and rationale',
        'List all components and property sources',
        'Document unit operation models and specifications',
        'Record all input assumptions',
        'Document validation results and accuracy',
        'Include sensitivity analysis findings',
        'List model limitations and validity range',
        'Create user guide for running the model'
      ],
      outputFormat: 'JSON with documentation path, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentPath: { type: 'string' },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'simulation', 'documentation']
}));
