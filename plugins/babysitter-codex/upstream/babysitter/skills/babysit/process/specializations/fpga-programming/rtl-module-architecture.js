/**
 * @process specializations/fpga-programming/rtl-module-architecture
 * @description RTL Module Architecture Design - Design and document the architecture for RTL modules including interface
 * definitions, internal data paths, control logic, and timing requirements. Establish module hierarchy and define signal
 * naming conventions.
 * @inputs { moduleName: string, targetDevice?: string, interfaces?: array, clockDomains?: array, functionality?: string, outputDir?: string }
 * @outputs { success: boolean, architectureDoc: object, blockDiagram: string, interfaces: array, timingDiagram: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/rtl-module-architecture', {
 *   moduleName: 'DataStreamProcessor',
 *   targetDevice: 'Xilinx Artix-7',
 *   interfaces: ['AXI4-Stream input', 'AXI4-Stream output', 'AXI4-Lite config'],
 *   clockDomains: ['sys_clk@100MHz'],
 *   functionality: 'Real-time data filtering and transformation pipeline'
 * });
 *
 * @references
 * - RTL Design Best Practices: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 * - FPGA Architecture Design: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 * - Hardware Design Patterns: https://zipcpu.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    moduleName,
    targetDevice = 'Generic FPGA',
    interfaces = [],
    clockDomains = ['clk@100MHz'],
    functionality = '',
    dataWidth = 32,
    pipelineDepth = 'auto',
    resourceBudget = {},
    namingConvention = 'snake_case',
    outputDir = 'rtl-architecture-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RTL Module Architecture Design: ${moduleName}`);
  ctx.log('info', `Target Device: ${targetDevice}, Interfaces: ${interfaces.length}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Requirements Analysis and Specification Review');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    moduleName,
    targetDevice,
    interfaces,
    clockDomains,
    functionality,
    dataWidth,
    resourceBudget,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: INTERFACE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Interface Definition and Port Specification');

  const interfaceDefinition = await ctx.task(interfaceDefinitionTask, {
    moduleName,
    interfaces,
    clockDomains,
    dataWidth,
    requirements,
    namingConvention,
    outputDir
  });

  artifacts.push(...interfaceDefinition.artifacts);

  // Quality Gate: Interface review
  await ctx.breakpoint({
    question: `Interface definition complete for ${moduleName}. ${interfaceDefinition.ports.length} ports defined across ${interfaceDefinition.interfaceCount} interfaces. Review interface specification?`,
    title: 'Interface Definition Review',
    context: {
      runId: ctx.runId,
      moduleName,
      ports: interfaceDefinition.ports,
      interfaces: interfaceDefinition.interfaceDetails,
      files: interfaceDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: DATAPATH ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Internal Datapath Architecture Design');

  const datapathDesign = await ctx.task(datapathArchitectureTask, {
    moduleName,
    functionality,
    dataWidth,
    pipelineDepth,
    interfaceDefinition,
    requirements,
    outputDir
  });

  artifacts.push(...datapathDesign.artifacts);

  // ============================================================================
  // PHASE 4: CONTROL LOGIC DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Control Logic and State Machine Design');

  const controlLogic = await ctx.task(controlLogicDesignTask, {
    moduleName,
    functionality,
    datapathDesign,
    interfaceDefinition,
    requirements,
    outputDir
  });

  artifacts.push(...controlLogic.artifacts);

  // ============================================================================
  // PHASE 5: MODULE HIERARCHY
  // ============================================================================

  ctx.log('info', 'Phase 5: Module Hierarchy and Decomposition');

  const moduleHierarchy = await ctx.task(moduleHierarchyTask, {
    moduleName,
    datapathDesign,
    controlLogic,
    interfaceDefinition,
    outputDir
  });

  artifacts.push(...moduleHierarchy.artifacts);

  // ============================================================================
  // PHASE 6: TIMING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Timing Requirements and Critical Path Analysis');

  const timingAnalysis = await ctx.task(timingAnalysisTask, {
    moduleName,
    targetDevice,
    clockDomains,
    datapathDesign,
    controlLogic,
    pipelineDepth,
    outputDir
  });

  artifacts.push(...timingAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: RESOURCE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Resource Estimation and Optimization Planning');

  const resourceEstimation = await ctx.task(resourceEstimationTask, {
    moduleName,
    targetDevice,
    datapathDesign,
    controlLogic,
    moduleHierarchy,
    resourceBudget,
    outputDir
  });

  artifacts.push(...resourceEstimation.artifacts);

  // ============================================================================
  // PHASE 8: BLOCK DIAGRAM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Block Diagram and Documentation Generation');

  const documentation = await ctx.task(architectureDocumentationTask, {
    moduleName,
    targetDevice,
    interfaceDefinition,
    datapathDesign,
    controlLogic,
    moduleHierarchy,
    timingAnalysis,
    resourceEstimation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `RTL Module Architecture Design Complete for ${moduleName}. ${moduleHierarchy.submoduleCount} submodules defined. Estimated ${resourceEstimation.lutCount} LUTs, ${resourceEstimation.ffCount} FFs. Review architecture documentation?`,
    title: 'Architecture Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        moduleName,
        targetDevice,
        portCount: interfaceDefinition.ports.length,
        submoduleCount: moduleHierarchy.submoduleCount,
        pipelineStages: datapathDesign.pipelineStages,
        stateCount: controlLogic.stateCount,
        estimatedLuts: resourceEstimation.lutCount,
        estimatedFfs: resourceEstimation.ffCount,
        criticalPathNs: timingAnalysis.criticalPathNs
      },
      files: [
        { path: documentation.blockDiagramPath, format: 'svg', label: 'Block Diagram' },
        { path: documentation.architectureDocPath, format: 'markdown', label: 'Architecture Document' },
        { path: documentation.timingDiagramPath, format: 'svg', label: 'Timing Diagram' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    moduleName,
    targetDevice,
    architectureDoc: {
      path: documentation.architectureDocPath,
      version: documentation.version
    },
    blockDiagram: documentation.blockDiagramPath,
    interfaces: interfaceDefinition.interfaceDetails,
    timingDiagram: documentation.timingDiagramPath,
    hierarchy: {
      topModule: moduleName,
      submodules: moduleHierarchy.submodules,
      depth: moduleHierarchy.hierarchyDepth
    },
    timing: {
      clockDomains,
      criticalPathNs: timingAnalysis.criticalPathNs,
      targetFrequencyMHz: timingAnalysis.targetFrequencyMHz
    },
    resources: {
      estimatedLuts: resourceEstimation.lutCount,
      estimatedFfs: resourceEstimation.ffCount,
      estimatedBram: resourceEstimation.bramCount,
      estimatedDsp: resourceEstimation.dspCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/rtl-module-architecture',
      timestamp: startTime,
      moduleName,
      targetDevice,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.moduleName}`,
  agent: {
    name: 'fpga-architect', // AG-006: FPGA Architect Agent
    prompt: {
      role: 'FPGA Design Architect',
      task: 'Analyze and document RTL module requirements',
      context: args,
      instructions: [
        '1. Extract functional requirements from specification',
        '2. Identify performance requirements (throughput, latency)',
        '3. Document interface requirements and protocols',
        '4. Analyze clock domain requirements',
        '5. Identify data width and format requirements',
        '6. Document resource constraints (LUTs, FFs, BRAM, DSP)',
        '7. Identify timing constraints and targets',
        '8. List external dependencies and IP requirements',
        '9. Document testability requirements',
        '10. Create requirements traceability matrix'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalReqs', 'performanceReqs', 'artifacts'],
      properties: {
        functionalReqs: { type: 'array', items: { type: 'object' } },
        performanceReqs: { type: 'object' },
        interfaceReqs: { type: 'array', items: { type: 'object' } },
        resourceConstraints: { type: 'object' },
        timingConstraints: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'requirements']
}));

export const interfaceDefinitionTask = defineTask('interface-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Interface Definition - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Define module interfaces and port specifications',
      context: args,
      instructions: [
        '1. Define all input ports with directions and widths',
        '2. Define all output ports with directions and widths',
        '3. Specify clock and reset ports',
        '4. Define standard interface signals (AXI, Avalon, etc.)',
        '5. Create generic/parameter definitions',
        '6. Apply naming conventions consistently',
        '7. Document signal descriptions and timing',
        '8. Define default values and reset states',
        '9. Specify input/output timing requirements',
        '10. Create interface documentation'
      ],
      outputFormat: 'JSON with interface definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['ports', 'interfaceCount', 'interfaceDetails', 'artifacts'],
      properties: {
        ports: { type: 'array', items: { type: 'object' } },
        interfaceCount: { type: 'number' },
        interfaceDetails: { type: 'array', items: { type: 'object' } },
        generics: { type: 'array', items: { type: 'object' } },
        clockPorts: { type: 'array', items: { type: 'object' } },
        resetPorts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'interfaces']
}));

export const datapathArchitectureTask = defineTask('datapath-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Datapath Architecture - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design internal datapath architecture',
      context: args,
      instructions: [
        '1. Define data flow through the module',
        '2. Identify pipeline stages and register boundaries',
        '3. Design arithmetic and logic units',
        '4. Plan memory interfaces and buffers',
        '5. Design multiplexer and routing logic',
        '6. Identify parallel processing opportunities',
        '7. Plan data width conversions',
        '8. Design FIFO and buffer structures',
        '9. Optimize for target device resources',
        '10. Document datapath timing'
      ],
      outputFormat: 'JSON with datapath design'
    },
    outputSchema: {
      type: 'object',
      required: ['dataFlow', 'pipelineStages', 'artifacts'],
      properties: {
        dataFlow: { type: 'array', items: { type: 'object' } },
        pipelineStages: { type: 'number' },
        processingUnits: { type: 'array', items: { type: 'object' } },
        buffers: { type: 'array', items: { type: 'object' } },
        multiplexers: { type: 'array', items: { type: 'object' } },
        latency: { type: 'number' },
        throughput: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'datapath']
}));

export const controlLogicDesignTask = defineTask('control-logic-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Control Logic Design - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design control logic and state machines',
      context: args,
      instructions: [
        '1. Identify control requirements',
        '2. Design main state machine(s)',
        '3. Define state encoding (one-hot, binary, Gray)',
        '4. Design state transition logic',
        '5. Create output logic (Moore/Mealy)',
        '6. Handle illegal state recovery',
        '7. Design handshake and flow control',
        '8. Implement enable and clock gating',
        '9. Design interrupt and error handling',
        '10. Document state diagrams'
      ],
      outputFormat: 'JSON with control logic design'
    },
    outputSchema: {
      type: 'object',
      required: ['stateMachines', 'stateCount', 'artifacts'],
      properties: {
        stateMachines: { type: 'array', items: { type: 'object' } },
        stateCount: { type: 'number' },
        stateEncoding: { type: 'string' },
        transitionTable: { type: 'array', items: { type: 'object' } },
        outputLogic: { type: 'object' },
        flowControl: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'control-logic', 'fsm']
}));

export const moduleHierarchyTask = defineTask('module-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Module Hierarchy - ${args.moduleName}`,
  agent: {
    name: 'fpga-architect', // AG-006: FPGA Architect Agent
    prompt: {
      role: 'FPGA Design Architect',
      task: 'Define module hierarchy and decomposition',
      context: args,
      instructions: [
        '1. Identify logical submodule boundaries',
        '2. Create hierarchical decomposition',
        '3. Define submodule interfaces',
        '4. Plan module instantiation',
        '5. Identify shared/reusable components',
        '6. Define module parameters and generics',
        '7. Plan generate statements for arrays',
        '8. Document instantiation hierarchy',
        '9. Define inter-module signal naming',
        '10. Create hierarchy diagram'
      ],
      outputFormat: 'JSON with module hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['submodules', 'submoduleCount', 'hierarchyDepth', 'artifacts'],
      properties: {
        submodules: { type: 'array', items: { type: 'object' } },
        submoduleCount: { type: 'number' },
        hierarchyDepth: { type: 'number' },
        sharedComponents: { type: 'array', items: { type: 'string' } },
        generateStructures: { type: 'array', items: { type: 'object' } },
        interconnects: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'hierarchy']
}));

export const timingAnalysisTask = defineTask('timing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Timing Analysis - ${args.moduleName}`,
  agent: {
    name: 'fpga-timing-expert', // AG-002: FPGA Timing Expert Agent
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Analyze timing requirements and critical paths',
      context: args,
      instructions: [
        '1. Identify target clock frequency',
        '2. Analyze potential critical paths',
        '3. Estimate combinational logic delays',
        '4. Plan pipeline insertion points',
        '5. Analyze setup and hold requirements',
        '6. Document clock domain crossings',
        '7. Identify multicycle paths',
        '8. Plan false path exceptions',
        '9. Create timing diagrams',
        '10. Document timing constraints'
      ],
      outputFormat: 'JSON with timing analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalPathNs', 'targetFrequencyMHz', 'artifacts'],
      properties: {
        criticalPathNs: { type: 'number' },
        targetFrequencyMHz: { type: 'number' },
        criticalPaths: { type: 'array', items: { type: 'object' } },
        pipelinePoints: { type: 'array', items: { type: 'string' } },
        clockCrossings: { type: 'array', items: { type: 'object' } },
        multicyclePaths: { type: 'array', items: { type: 'object' } },
        falsePaths: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'timing']
}));

export const resourceEstimationTask = defineTask('resource-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Resource Estimation - ${args.moduleName}`,
  agent: {
    name: 'fpga-architect', // AG-006: FPGA Architect Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Estimate resource utilization and optimization planning',
      context: args,
      instructions: [
        '1. Estimate LUT utilization',
        '2. Estimate flip-flop count',
        '3. Estimate Block RAM usage',
        '4. Estimate DSP block usage',
        '5. Analyze carry chain utilization',
        '6. Estimate I/O requirements',
        '7. Compare against resource budget',
        '8. Identify optimization opportunities',
        '9. Plan resource sharing',
        '10. Document resource estimates'
      ],
      outputFormat: 'JSON with resource estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['lutCount', 'ffCount', 'artifacts'],
      properties: {
        lutCount: { type: 'number' },
        ffCount: { type: 'number' },
        bramCount: { type: 'number' },
        dspCount: { type: 'number' },
        ioCount: { type: 'number' },
        utilizationPercent: { type: 'object' },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } },
        resourceBreakdown: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'resources']
}));

export const architectureDocumentationTask = defineTask('architecture-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Architecture Documentation - ${args.moduleName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Engineer',
      task: 'Generate architecture documentation and diagrams',
      context: args,
      instructions: [
        '1. Create architecture overview document',
        '2. Generate block diagram',
        '3. Create timing diagrams',
        '4. Document interface specifications',
        '5. Create state machine diagrams',
        '6. Document signal descriptions',
        '7. Create parameter documentation',
        '8. Generate hierarchy diagrams',
        '9. Document design decisions',
        '10. Create implementation guidelines'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureDocPath', 'blockDiagramPath', 'timingDiagramPath', 'version', 'artifacts'],
      properties: {
        architectureDocPath: { type: 'string' },
        blockDiagramPath: { type: 'string' },
        timingDiagramPath: { type: 'string' },
        stateDiagramPath: { type: 'string' },
        hierarchyDiagramPath: { type: 'string' },
        version: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'rtl-design', 'documentation']
}));
