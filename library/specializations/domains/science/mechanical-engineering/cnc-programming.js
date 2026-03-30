/**
 * @process cnc-programming
 * @description CNC programming and verification - toolpath generation, G-code development, simulation, and prove-out
 * @inputs {object} inputs
 * @inputs {string} inputs.partNumber - Part identification number
 * @inputs {string} inputs.cadModel - 3D CAD model path
 * @inputs {object} inputs.processRouting - Manufacturing process routing
 * @inputs {object} inputs.machineSpec - Target CNC machine specifications
 * @inputs {object} inputs.toolLibrary - Available cutting tools library
 * @outputs {object} cncProgram - Verified CNC program with documentation
 * @example
 * const result = await process({
 *   partNumber: 'CNC-2024-001',
 *   cadModel: 'models/part-001.step',
 *   processRouting: { operations: [...] },
 *   machineSpec: { type: 'VMC', controller: 'Fanuc 0i-MD', axes: 3 },
 *   toolLibrary: { tools: [...] }
 * });
 * @references FANUC G-code Manual, HAAS Programming Guide, CAM Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: CAM Setup and Stock Definition
  const camSetup = await ctx.task(camSetupTask, {
    cadModel: inputs.cadModel,
    processRouting: inputs.processRouting,
    machineSpec: inputs.machineSpec
  });
  artifacts.push({ phase: 'cam-setup', data: camSetup });

  // Phase 2: Tool Selection and Assembly
  const toolSelection = await ctx.task(toolSelectionTask, {
    operations: inputs.processRouting.operations,
    toolLibrary: inputs.toolLibrary,
    machineSpec: inputs.machineSpec
  });
  artifacts.push({ phase: 'tool-selection', data: toolSelection });

  // Phase 3: Toolpath Generation
  const toolpathGeneration = await ctx.task(toolpathTask, {
    camSetup: camSetup,
    tools: toolSelection.selectedTools,
    operations: inputs.processRouting.operations,
    machineSpec: inputs.machineSpec
  });
  artifacts.push({ phase: 'toolpath-generation', data: toolpathGeneration });

  // Phase 4: Cutting Parameter Optimization
  const parameterOptimization = await ctx.task(parameterOptimizationTask, {
    toolpaths: toolpathGeneration.toolpaths,
    tools: toolSelection.selectedTools,
    material: inputs.processRouting.material
  });
  artifacts.push({ phase: 'parameter-optimization', data: parameterOptimization });

  // Phase 5: G-code Post-Processing
  const postProcessing = await ctx.task(postProcessingTask, {
    toolpaths: toolpathGeneration.toolpaths,
    machineSpec: inputs.machineSpec,
    parameters: parameterOptimization.optimizedParams
  });
  artifacts.push({ phase: 'post-processing', data: postProcessing });

  // Phase 6: Simulation and Collision Detection
  const simulation = await ctx.task(simulationTask, {
    gcode: postProcessing.gcode,
    machineSpec: inputs.machineSpec,
    fixtures: camSetup.fixtures,
    tools: toolSelection.selectedTools
  });
  artifacts.push({ phase: 'simulation', data: simulation });

  // Breakpoint: Simulation Review
  await ctx.breakpoint('simulation-review', {
    question: 'Review simulation results. Any collisions or issues detected?',
    context: {
      collisionReport: simulation.collisionReport,
      cycleTime: simulation.estimatedCycleTime,
      issues: simulation.issues
    }
  });

  // Phase 7: Program Verification
  const verification = await ctx.task(verificationTask, {
    gcode: postProcessing.gcode,
    simulation: simulation,
    processRouting: inputs.processRouting
  });
  artifacts.push({ phase: 'verification', data: verification });

  // Phase 8: Setup Sheet and Documentation
  const documentation = await ctx.task(documentationTask, {
    partNumber: inputs.partNumber,
    gcode: postProcessing.gcode,
    tools: toolSelection.selectedTools,
    camSetup: camSetup,
    machineSpec: inputs.machineSpec
  });
  artifacts.push({ phase: 'documentation', data: documentation });

  // Phase 9: Prove-out Planning
  const proveoutPlan = await ctx.task(proveoutPlanTask, {
    partNumber: inputs.partNumber,
    gcode: postProcessing.gcode,
    criticalFeatures: inputs.processRouting.criticalFeatures
  });
  artifacts.push({ phase: 'proveout-plan', data: proveoutPlan });

  // Final Breakpoint: Program Release Approval
  await ctx.breakpoint('program-release', {
    question: 'Approve CNC program for production release?',
    context: {
      partNumber: inputs.partNumber,
      programNumber: postProcessing.programNumber,
      cycleTime: simulation.estimatedCycleTime,
      toolCount: toolSelection.selectedTools.length
    }
  });

  return {
    success: true,
    results: {
      partNumber: inputs.partNumber,
      programNumber: postProcessing.programNumber,
      gcode: postProcessing.gcode,
      setupSheet: documentation.setupSheet,
      toolList: toolSelection.selectedTools,
      simulation: simulation,
      proveoutPlan: proveoutPlan
    },
    artifacts,
    metadata: {
      estimatedCycleTime: simulation.estimatedCycleTime,
      toolCount: toolSelection.selectedTools.length,
      programLines: postProcessing.lineCount
    }
  };
}

const camSetupTask = defineTask('cam-setup', (args) => ({
  kind: 'agent',
  title: 'CAM Setup and Stock Definition',
  agent: {
    name: 'cam-programmer',
    prompt: {
      role: 'Senior CNC Programmer',
      task: 'Set up CAM environment with stock, fixtures, and coordinate systems',
      context: args,
      instructions: [
        'Import and orient CAD model in CAM system',
        'Define stock geometry and material',
        'Set up machine coordinate system (MCS)',
        'Define work coordinate system (WCS) and part zero',
        'Configure fixture models and clamp locations',
        'Set up multiple setups if required',
        'Define clearance planes and safe zones'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['stock', 'wcs', 'fixtures', 'clearancePlanes'],
      properties: {
        stock: { type: 'object' },
        wcs: { type: 'object' },
        fixtures: { type: 'array', items: { type: 'object' } },
        clearancePlanes: { type: 'object' },
        setups: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const toolSelectionTask = defineTask('tool-selection', (args) => ({
  kind: 'agent',
  title: 'Tool Selection and Assembly',
  agent: {
    name: 'tooling-specialist',
    prompt: {
      role: 'CNC Tooling Specialist',
      task: 'Select and configure cutting tools for all operations',
      context: args,
      instructions: [
        'Select appropriate tools for each machining operation',
        'Configure tool assemblies with holders',
        'Define tool reach and overhang requirements',
        'Set tool numbers and offsets',
        'Verify tool compatibility with machine spindle',
        'Consider tool life and backup requirements',
        'Define tool measurement and preset requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'toolAssemblies', 'offsetTable'],
      properties: {
        selectedTools: { type: 'array', items: { type: 'object' } },
        toolAssemblies: { type: 'array', items: { type: 'object' } },
        offsetTable: { type: 'array', items: { type: 'object' } },
        presetRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const toolpathTask = defineTask('toolpath-generation', (args) => ({
  kind: 'agent',
  title: 'Toolpath Generation',
  agent: {
    name: 'cam-programmer',
    prompt: {
      role: 'Senior CNC Programmer',
      task: 'Generate optimized toolpaths for all machining operations',
      context: args,
      instructions: [
        'Create roughing toolpaths with appropriate stepover and stepdown',
        'Generate finishing toolpaths for required surface quality',
        'Program drilling and hole-making operations',
        'Set up appropriate lead-in/lead-out moves',
        'Configure linking moves between operations',
        'Optimize toolpath order to minimize cycle time',
        'Consider chip evacuation and coolant strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['toolpaths', 'operationSequence', 'estimatedTime'],
      properties: {
        toolpaths: { type: 'array', items: { type: 'object' } },
        operationSequence: { type: 'array', items: { type: 'string' } },
        estimatedTime: { type: 'number' },
        stockRemaining: { type: 'object' }
      }
    }
  }
}));

const parameterOptimizationTask = defineTask('parameter-optimization', (args) => ({
  kind: 'agent',
  title: 'Cutting Parameter Optimization',
  agent: {
    name: 'machining-engineer',
    prompt: {
      role: 'Machining Engineer',
      task: 'Optimize cutting parameters for productivity and tool life',
      context: args,
      instructions: [
        'Calculate optimal spindle speeds based on material and tool diameter',
        'Determine feed rates for productivity and surface finish',
        'Set appropriate depths of cut for roughing and finishing',
        'Consider machine power and torque limitations',
        'Optimize parameters for tool life vs cycle time balance',
        'Set ramp and plunge feed rate reductions',
        'Configure adaptive/dynamic feed adjustments'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParams', 'powerAnalysis', 'toolLifeEstimate'],
      properties: {
        optimizedParams: { type: 'array', items: { type: 'object' } },
        powerAnalysis: { type: 'object' },
        toolLifeEstimate: { type: 'object' },
        feedOverrides: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const postProcessingTask = defineTask('post-processing', (args) => ({
  kind: 'agent',
  title: 'G-code Post-Processing',
  agent: {
    name: 'cam-programmer',
    prompt: {
      role: 'CNC Programmer',
      task: 'Post-process toolpaths to machine-specific G-code',
      context: args,
      instructions: [
        'Select appropriate post-processor for target machine',
        'Configure program header with part number and date',
        'Generate G-code with appropriate formatting',
        'Include tool change sequences and safety blocks',
        'Add comments for operator clarity',
        'Configure coolant and spindle commands',
        'Set up program end and return to home position'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['gcode', 'programNumber', 'lineCount'],
      properties: {
        gcode: { type: 'string' },
        programNumber: { type: 'string' },
        lineCount: { type: 'number' },
        subprograms: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const simulationTask = defineTask('simulation', (args) => ({
  kind: 'agent',
  title: 'Simulation and Collision Detection',
  agent: {
    name: 'simulation-analyst',
    prompt: {
      role: 'CNC Simulation Specialist',
      task: 'Simulate program execution and verify collision-free operation',
      context: args,
      instructions: [
        'Run full machine simulation with all components',
        'Verify no collisions between tool, holder, spindle, and fixtures',
        'Check rapid traverse moves for clearance',
        'Verify tool reach for all operations',
        'Compare machined stock to CAD model for gouges',
        'Verify material removal matches expectations',
        'Calculate accurate cycle time from simulation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['collisionReport', 'estimatedCycleTime', 'materialRemoval'],
      properties: {
        collisionReport: { type: 'object' },
        estimatedCycleTime: { type: 'number' },
        materialRemoval: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        gougeCheck: { type: 'object' }
      }
    }
  }
}));

const verificationTask = defineTask('verification', (args) => ({
  kind: 'agent',
  title: 'Program Verification',
  agent: {
    name: 'quality-programmer',
    prompt: {
      role: 'CNC Quality Programmer',
      task: 'Verify program completeness and compliance with routing',
      context: args,
      instructions: [
        'Verify all routing operations are programmed',
        'Check program against drawing requirements',
        'Verify critical dimensions are achievable',
        'Review G-code for syntax and best practices',
        'Confirm tool numbers match setup sheet',
        'Verify work offset usage is correct',
        'Check for redundant or inefficient moves'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationStatus', 'checklist', 'issues'],
      properties: {
        verificationStatus: { type: 'string' },
        checklist: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

const documentationTask = defineTask('documentation', (args) => ({
  kind: 'agent',
  title: 'Setup Sheet and Documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'CNC Documentation Specialist',
      task: 'Create setup sheet and supporting documentation',
      context: args,
      instructions: [
        'Create detailed setup sheet with fixtures and WCS location',
        'Generate tool list with lengths and diameters',
        'Document work offset values and origins',
        'Include fixture photos or CAD images',
        'List program numbers and file locations',
        'Add operator notes and special instructions',
        'Create tool preset list for offline presetting'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['setupSheet', 'toolList', 'operatorNotes'],
      properties: {
        setupSheet: { type: 'object' },
        toolList: { type: 'array', items: { type: 'object' } },
        operatorNotes: { type: 'array', items: { type: 'string' } },
        attachments: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const proveoutPlanTask = defineTask('proveout-plan', (args) => ({
  kind: 'agent',
  title: 'Prove-out Planning',
  agent: {
    name: 'manufacturing-engineer',
    prompt: {
      role: 'Manufacturing Engineer',
      task: 'Develop prove-out plan for first article production',
      context: args,
      instructions: [
        'Define prove-out sequence and checkpoints',
        'Identify critical features for in-process verification',
        'Plan single-block and dry-run sections',
        'Define feed rate override starting points',
        'List inspection requirements during prove-out',
        'Plan for program adjustments based on first part',
        'Define success criteria for production release'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['proveoutSteps', 'checkpoints', 'successCriteria'],
      properties: {
        proveoutSteps: { type: 'array', items: { type: 'object' } },
        checkpoints: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        riskMitigation: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

export default { process };
