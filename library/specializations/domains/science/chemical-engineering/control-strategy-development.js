/**
 * @process chemical-engineering/control-strategy-development
 * @description Design process control strategies including control loops, cascade controls, and ratio controls for unit operations
 * @inputs { processName: string, processDescription: object, controlObjectives: array, outputDir: string }
 * @outputs { success: boolean, controlPhilosophy: object, controlLoops: array, dcsConfiguration: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    processDescription,
    controlObjectives,
    existingInstrumentation = [],
    outputDir = 'control-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Control Objectives
  ctx.log('info', 'Starting control strategy development: Defining objectives');
  const objectivesResult = await ctx.task(controlObjectivesTask, {
    processName,
    processDescription,
    controlObjectives,
    outputDir
  });

  if (!objectivesResult.success) {
    return {
      success: false,
      error: 'Control objectives definition failed',
      details: objectivesResult,
      metadata: { processId: 'chemical-engineering/control-strategy-development', timestamp: startTime }
    };
  }

  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Identify Controlled and Manipulated Variables
  ctx.log('info', 'Identifying controlled and manipulated variables');
  const variablesResult = await ctx.task(variableIdentificationTask, {
    processName,
    processDescription,
    objectives: objectivesResult.objectives,
    outputDir
  });

  artifacts.push(...variablesResult.artifacts);

  // Task 3: Select Control Structure
  ctx.log('info', 'Selecting control structure');
  const structureResult = await ctx.task(controlStructureSelectionTask, {
    processName,
    controlledVariables: variablesResult.controlledVariables,
    manipulatedVariables: variablesResult.manipulatedVariables,
    processDescription,
    outputDir
  });

  artifacts.push(...structureResult.artifacts);

  // Task 4: Design Control Loops for Unit Operations
  ctx.log('info', 'Designing control loops for unit operations');
  const loopDesignResult = await ctx.task(controlLoopDesignTask, {
    processName,
    controlStructure: structureResult.structure,
    processDescription,
    existingInstrumentation,
    outputDir
  });

  artifacts.push(...loopDesignResult.artifacts);

  // Task 5: Address Process Interactions and Constraints
  ctx.log('info', 'Addressing process interactions and constraints');
  const interactionsResult = await ctx.task(processInteractionsTask, {
    processName,
    controlLoops: loopDesignResult.loops,
    processDescription,
    outputDir
  });

  artifacts.push(...interactionsResult.artifacts);

  // Breakpoint: Review control strategy
  await ctx.breakpoint({
    question: `Control strategy developed for ${processName}. Control loops: ${loopDesignResult.loops.length}. Cascade loops: ${structureResult.structure.cascadeCount}. Ratio controls: ${structureResult.structure.ratioCount}. Review strategy?`,
    title: 'Control Strategy Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        controlLoops: loopDesignResult.loops.length,
        cascadeLoops: structureResult.structure.cascadeCount,
        ratioControls: structureResult.structure.ratioCount,
        feedforwardControls: structureResult.structure.feedforwardCount
      }
    }
  });

  // Task 6: Document Control Philosophy
  ctx.log('info', 'Documenting control philosophy');
  const philosophyResult = await ctx.task(controlPhilosophyTask, {
    processName,
    objectives: objectivesResult.objectives,
    controlStructure: structureResult.structure,
    controlLoops: loopDesignResult.loops,
    interactions: interactionsResult,
    outputDir
  });

  artifacts.push(...philosophyResult.artifacts);

  // Task 7: Generate DCS Configuration Specification
  ctx.log('info', 'Generating DCS configuration specification');
  const dcsConfigResult = await ctx.task(dcsConfigurationTask, {
    processName,
    controlLoops: loopDesignResult.loops,
    controlPhilosophy: philosophyResult.philosophy,
    outputDir
  });

  artifacts.push(...dcsConfigResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    controlPhilosophy: philosophyResult.philosophy,
    controlLoops: loopDesignResult.loops,
    controlStructure: structureResult.structure,
    dcsConfiguration: dcsConfigResult.configuration,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/control-strategy-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Control Objectives Definition
export const controlObjectivesTask = defineTask('control-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define control objectives',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'process control engineer',
      task: 'Define control objectives for the process',
      context: args,
      instructions: [
        'Identify safety-related control objectives',
        'Identify product quality control objectives',
        'Identify throughput/capacity objectives',
        'Identify environmental compliance objectives',
        'Identify energy efficiency objectives',
        'Prioritize objectives by importance',
        'Define acceptable operating ranges',
        'Document control objectives hierarchy'
      ],
      outputFormat: 'JSON with control objectives, priorities, operating ranges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'objectives', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'number' },
              operatingRange: { type: 'object' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'objectives']
}));

// Task 2: Variable Identification
export const variableIdentificationTask = defineTask('variable-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify controlled and manipulated variables',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'process control analyst',
      task: 'Identify controlled and manipulated variables',
      context: args,
      instructions: [
        'Identify controlled variables (CVs) from objectives',
        'Identify potential manipulated variables (MVs)',
        'Assess CV-MV pairing options',
        'Identify disturbance variables',
        'Assess measurability of variables',
        'Identify constraints on MVs',
        'Create variable interaction matrix',
        'Document variable identification'
      ],
      outputFormat: 'JSON with controlled variables, manipulated variables, interactions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controlledVariables', 'manipulatedVariables', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controlledVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              unit: { type: 'string' },
              measurable: { type: 'boolean' }
            }
          }
        },
        manipulatedVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              range: { type: 'object' }
            }
          }
        },
        disturbances: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'variables']
}));

// Task 3: Control Structure Selection
export const controlStructureSelectionTask = defineTask('control-structure-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select control structure',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'control structure engineer',
      task: 'Select optimal control structure',
      context: args,
      instructions: [
        'Design feedback control loops',
        'Identify opportunities for cascade control',
        'Design ratio control for feed streams',
        'Design feedforward control for disturbances',
        'Evaluate override/selector controls for constraints',
        'Assess decoupling needs',
        'Apply CV-MV pairing rules (RGA)',
        'Document control structure selection'
      ],
      outputFormat: 'JSON with control structure, loop types, pairing rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'structure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        structure: {
          type: 'object',
          properties: {
            feedbackLoops: { type: 'array' },
            cascadeCount: { type: 'number' },
            ratioCount: { type: 'number' },
            feedforwardCount: { type: 'number' },
            overrideControls: { type: 'array' }
          }
        },
        pairingRationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'structure']
}));

// Task 4: Control Loop Design
export const controlLoopDesignTask = defineTask('control-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design control loops for unit operations',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'control loop design engineer',
      task: 'Design control loops for each unit operation',
      context: args,
      instructions: [
        'Design temperature control loops',
        'Design pressure control loops',
        'Design level control loops',
        'Design flow control loops',
        'Design composition/analyzer control loops',
        'Specify transmitter ranges and types',
        'Specify control valve sizing criteria',
        'Document each control loop design'
      ],
      outputFormat: 'JSON with control loops, specifications, P&ID annotations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'loops', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        loops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              type: { type: 'string' },
              controlledVariable: { type: 'string' },
              manipulatedVariable: { type: 'string' },
              transmitter: { type: 'object' },
              controller: { type: 'object' },
              finalElement: { type: 'object' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'loop-design']
}));

// Task 5: Process Interactions Analysis
export const processInteractionsTask = defineTask('process-interactions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address process interactions and constraints',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'process interactions analyst',
      task: 'Analyze and address process interactions',
      context: args,
      instructions: [
        'Identify loop interactions',
        'Calculate relative gain array (RGA)',
        'Design decouplers if needed',
        'Address constraint handling',
        'Design anti-reset windup',
        'Address inverse response issues',
        'Design bumpless transfer logic',
        'Document interaction analysis'
      ],
      outputFormat: 'JSON with interactions analysis, RGA, decoupling strategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'interactions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        interactions: {
          type: 'object',
          properties: {
            rgaMatrix: { type: 'array' },
            significantInteractions: { type: 'array' },
            decouplingStrategy: { type: 'object' }
          }
        },
        constraintHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'interactions']
}));

// Task 6: Control Philosophy Documentation
export const controlPhilosophyTask = defineTask('control-philosophy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document control philosophy',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'control philosophy author',
      task: 'Create comprehensive control philosophy document',
      context: args,
      instructions: [
        'Document overall control strategy',
        'Describe each control loop purpose',
        'Document setpoint guidelines',
        'Specify tuning approach',
        'Document alarm philosophy',
        'Describe startup/shutdown control',
        'Document emergency response control',
        'Create control philosophy document'
      ],
      outputFormat: 'JSON with control philosophy, setpoint guidelines, alarm philosophy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'philosophy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        philosophy: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            overallStrategy: { type: 'string' },
            loopDescriptions: { type: 'array' },
            setpointGuidelines: { type: 'object' },
            alarmPhilosophy: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'philosophy']
}));

// Task 7: DCS Configuration
export const dcsConfigurationTask = defineTask('dcs-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DCS configuration specification',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'DCS configuration engineer',
      task: 'Generate DCS configuration specification',
      context: args,
      instructions: [
        'Specify I/O assignments',
        'Configure control blocks and function blocks',
        'Specify controller algorithms (PID, etc.)',
        'Configure alarm setpoints',
        'Design operator displays',
        'Configure trending and historization',
        'Specify interlock logic',
        'Create DCS configuration specification'
      ],
      outputFormat: 'JSON with DCS configuration, I/O list, display specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'configuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            ioList: { type: 'array' },
            controlBlocks: { type: 'array' },
            alarmConfiguration: { type: 'object' },
            displayList: { type: 'array' },
            interlocks: { type: 'array' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'control-strategy', 'dcs']
}));
