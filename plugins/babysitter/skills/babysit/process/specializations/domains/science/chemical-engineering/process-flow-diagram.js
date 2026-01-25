/**
 * @process chemical-engineering/process-flow-diagram
 * @description Create comprehensive PFDs with mass/energy balances, stream tables, and equipment identification for chemical processes
 * @inputs { processName: string, feedSpecifications: object, productRequirements: object, outputDir: string }
 * @outputs { success: boolean, pfdPath: string, streamTable: object, equipmentList: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    feedSpecifications,
    productRequirements,
    batteryLimits = {},
    designBasis = {},
    outputDir = 'pfd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Process Boundaries and Battery Limits
  ctx.log('info', 'Starting PFD development: Defining process boundaries');
  const boundaryResult = await ctx.task(processBoundaryDefinitionTask, {
    processName,
    feedSpecifications,
    productRequirements,
    batteryLimits,
    outputDir
  });

  if (!boundaryResult.success) {
    return {
      success: false,
      error: 'Process boundary definition failed',
      details: boundaryResult,
      metadata: { processId: 'chemical-engineering/process-flow-diagram', timestamp: startTime }
    };
  }

  artifacts.push(...boundaryResult.artifacts);

  // Task 2: Develop Material Balance
  ctx.log('info', 'Developing material balance');
  const materialBalanceResult = await ctx.task(materialBalanceTask, {
    processName,
    feedSpecifications,
    productRequirements,
    boundaryDefinition: boundaryResult.boundaryDefinition,
    outputDir
  });

  artifacts.push(...materialBalanceResult.artifacts);

  // Task 3: Develop Energy Balance
  ctx.log('info', 'Developing energy balance');
  const energyBalanceResult = await ctx.task(energyBalanceTask, {
    processName,
    materialBalance: materialBalanceResult.materialBalance,
    boundaryDefinition: boundaryResult.boundaryDefinition,
    designBasis,
    outputDir
  });

  artifacts.push(...energyBalanceResult.artifacts);

  // Task 4: Identify and Size Major Equipment
  ctx.log('info', 'Identifying and sizing major equipment');
  const equipmentResult = await ctx.task(equipmentIdentificationTask, {
    processName,
    materialBalance: materialBalanceResult.materialBalance,
    energyBalance: energyBalanceResult.energyBalance,
    designBasis,
    outputDir
  });

  artifacts.push(...equipmentResult.artifacts);

  // Task 5: Create Stream Tables
  ctx.log('info', 'Creating stream tables');
  const streamTableResult = await ctx.task(streamTableTask, {
    processName,
    materialBalance: materialBalanceResult.materialBalance,
    energyBalance: energyBalanceResult.energyBalance,
    equipmentList: equipmentResult.equipmentList,
    outputDir
  });

  artifacts.push(...streamTableResult.artifacts);

  // Task 6: Specify Operating Conditions and Control Points
  ctx.log('info', 'Specifying operating conditions and control points');
  const operatingConditionsResult = await ctx.task(operatingConditionsTask, {
    processName,
    equipmentList: equipmentResult.equipmentList,
    streamTable: streamTableResult.streamTable,
    designBasis,
    outputDir
  });

  artifacts.push(...operatingConditionsResult.artifacts);

  // Breakpoint: Review PFD components before final assembly
  await ctx.breakpoint({
    question: `PFD components developed for ${processName}. Material balance closure: ${materialBalanceResult.closurePercentage}%. Equipment count: ${equipmentResult.equipmentList.length}. Proceed with PFD assembly?`,
    title: 'PFD Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        processName,
        materialBalanceClosure: materialBalanceResult.closurePercentage,
        energyBalanceClosure: energyBalanceResult.closurePercentage,
        equipmentCount: equipmentResult.equipmentList.length,
        streamCount: streamTableResult.streamCount
      }
    }
  });

  // Task 7: Generate PFD Drawing
  ctx.log('info', 'Generating PFD drawing');
  const pfdDrawingResult = await ctx.task(pfdDrawingTask, {
    processName,
    boundaryDefinition: boundaryResult.boundaryDefinition,
    equipmentList: equipmentResult.equipmentList,
    streamTable: streamTableResult.streamTable,
    operatingConditions: operatingConditionsResult.operatingConditions,
    outputDir
  });

  artifacts.push(...pfdDrawingResult.artifacts);

  // Task 8: Document Design Basis and Assumptions
  ctx.log('info', 'Documenting design basis and assumptions');
  const documentationResult = await ctx.task(designBasisDocumentationTask, {
    processName,
    designBasis,
    materialBalance: materialBalanceResult.materialBalance,
    energyBalance: energyBalanceResult.energyBalance,
    equipmentList: equipmentResult.equipmentList,
    assumptions: {
      boundary: boundaryResult.assumptions,
      material: materialBalanceResult.assumptions,
      energy: energyBalanceResult.assumptions,
      equipment: equipmentResult.assumptions
    },
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    pfdPath: pfdDrawingResult.pfdPath,
    streamTable: streamTableResult.streamTable,
    equipmentList: equipmentResult.equipmentList,
    balances: {
      materialClosure: materialBalanceResult.closurePercentage,
      energyClosure: energyBalanceResult.closurePercentage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/process-flow-diagram',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Process Boundary Definition
export const processBoundaryDefinitionTask = defineTask('process-boundary-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define process boundaries and battery limits',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'senior process engineer',
      task: 'Define process boundaries, battery limits, and scope for PFD development',
      context: args,
      instructions: [
        'Define battery limits (inlet and outlet points)',
        'Identify feed streams entering the process',
        'Identify product streams leaving the process',
        'Define utility interfaces (steam, cooling water, power)',
        'Establish waste and effluent discharge points',
        'Document interconnections with other units',
        'Create boundary diagram showing all interfaces',
        'List all assumptions regarding boundary conditions'
      ],
      outputFormat: 'JSON with boundary definition, interfaces, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'boundaryDefinition', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        boundaryDefinition: {
          type: 'object',
          properties: {
            batteryLimits: { type: 'object' },
            feedStreams: { type: 'array' },
            productStreams: { type: 'array' },
            utilityInterfaces: { type: 'array' },
            wasteStreams: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'pfd', 'boundary-definition']
}));

// Task 2: Material Balance
export const materialBalanceTask = defineTask('material-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop material balance',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process engineer',
      task: 'Develop comprehensive material balance for the process',
      context: args,
      instructions: [
        'Calculate component mass flows for all streams',
        'Apply conservation of mass for each component',
        'Account for reactions with stoichiometry',
        'Calculate conversion, yield, and selectivity',
        'Verify overall material balance closure',
        'Identify recycle streams and calculate recycle ratios',
        'Document all calculation assumptions',
        'Create material balance summary table'
      ],
      outputFormat: 'JSON with material balance, closure percentage, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materialBalance', 'closurePercentage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materialBalance: { type: 'object' },
        closurePercentage: { type: 'number' },
        recycleRatios: { type: 'object' },
        reactionMetrics: {
          type: 'object',
          properties: {
            conversion: { type: 'number' },
            yield: { type: 'number' },
            selectivity: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'pfd', 'material-balance']
}));

// Task 3: Energy Balance
export const energyBalanceTask = defineTask('energy-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop energy balance',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process engineer',
      task: 'Develop comprehensive energy balance for the process',
      context: args,
      instructions: [
        'Calculate enthalpy changes for all streams',
        'Account for heats of reaction',
        'Calculate heat duties for exchangers, heaters, coolers',
        'Determine utility requirements (steam, cooling water)',
        'Calculate shaft work for pumps and compressors',
        'Verify overall energy balance closure',
        'Identify heat integration opportunities',
        'Create energy balance summary'
      ],
      outputFormat: 'JSON with energy balance, utility requirements, closure percentage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'energyBalance', 'closurePercentage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        energyBalance: { type: 'object' },
        closurePercentage: { type: 'number' },
        utilityRequirements: {
          type: 'object',
          properties: {
            steam: { type: 'object' },
            coolingWater: { type: 'object' },
            electricity: { type: 'object' }
          }
        },
        heatDuties: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pfd', 'energy-balance']
}));

// Task 4: Equipment Identification
export const equipmentIdentificationTask = defineTask('equipment-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and size major equipment',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'process equipment engineer',
      task: 'Identify and preliminary size all major process equipment',
      context: args,
      instructions: [
        'Identify all major equipment (vessels, columns, exchangers, pumps)',
        'Assign equipment tags following naming conventions',
        'Perform preliminary sizing calculations',
        'Specify design pressure and temperature',
        'Select materials of construction',
        'Note special requirements (ASME, API codes)',
        'Create equipment list with key specifications',
        'Document sizing methodology and assumptions'
      ],
      outputFormat: 'JSON with equipment list, sizing summary, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'equipmentList', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        equipmentList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              designPressure: { type: 'string' },
              designTemperature: { type: 'string' },
              material: { type: 'string' },
              keyDimensions: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'pfd', 'equipment-sizing']
}));

// Task 5: Stream Table Creation
export const streamTableTask = defineTask('stream-table', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create stream tables',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process engineer',
      task: 'Create comprehensive stream tables for all process streams',
      context: args,
      instructions: [
        'Number all streams following conventions',
        'List stream compositions (mass and mole fractions)',
        'Record total mass and molar flow rates',
        'Document temperature and pressure for each stream',
        'Calculate stream properties (density, viscosity, etc.)',
        'Identify phase (vapor, liquid, two-phase)',
        'Note stream descriptions and destinations',
        'Format as standard PFD stream table'
      ],
      outputFormat: 'JSON with stream table, stream count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'streamTable', 'streamCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        streamTable: { type: 'object' },
        streamCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pfd', 'stream-table']
}));

// Task 6: Operating Conditions Specification
export const operatingConditionsTask = defineTask('operating-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify operating conditions and control points',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'process control engineer',
      task: 'Specify operating conditions and key control points',
      context: args,
      instructions: [
        'Define normal operating conditions for each unit',
        'Specify operating ranges (min, normal, max)',
        'Identify key control variables',
        'Define control loops (temperature, pressure, level, flow)',
        'Specify critical process parameters',
        'Document safety limits and trip points',
        'Create operating envelope summary',
        'Note any special operating requirements'
      ],
      outputFormat: 'JSON with operating conditions, control points, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'operatingConditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        operatingConditions: { type: 'object' },
        controlPoints: { type: 'array' },
        safetyLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pfd', 'operating-conditions']
}));

// Task 7: PFD Drawing Generation
export const pfdDrawingTask = defineTask('pfd-drawing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate PFD drawing',
  agent: {
    name: 'process-integration-coordinator',
    prompt: {
      role: 'process design drafter',
      task: 'Generate comprehensive Process Flow Diagram',
      context: args,
      instructions: [
        'Layout equipment in logical process flow sequence',
        'Draw all process streams with flow direction arrows',
        'Show stream numbers matching stream table',
        'Include equipment tags and descriptions',
        'Add key process parameters on streams',
        'Show control loops with standard symbols',
        'Include title block with revision information',
        'Follow ISA/ANSI standards for symbols',
        'Generate in appropriate format (SVG, PDF, or description)'
      ],
      outputFormat: 'JSON with PFD path, drawing metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pfdPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pfdPath: { type: 'string' },
        drawingMetadata: {
          type: 'object',
          properties: {
            revision: { type: 'string' },
            date: { type: 'string' },
            drawnBy: { type: 'string' },
            checkedBy: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'pfd', 'drawing']
}));

// Task 8: Design Basis Documentation
export const designBasisDocumentationTask = defineTask('design-basis-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document design basis and assumptions',
  agent: {
    name: 'process-development-engineer',
    prompt: {
      role: 'process documentation engineer',
      task: 'Create comprehensive design basis document',
      context: args,
      instructions: [
        'Document process design basis (capacity, feeds, products)',
        'List all design assumptions',
        'Record thermodynamic models used',
        'Document reaction chemistry and kinetics basis',
        'List applicable codes and standards',
        'Record design margins and safety factors',
        'Create assumption tracking matrix',
        'Include references to source documents'
      ],
      outputFormat: 'JSON with design basis document path, assumption list, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentPath: { type: 'string' },
        designBasisSummary: { type: 'object' },
        assumptionsList: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pfd', 'documentation']
}));
