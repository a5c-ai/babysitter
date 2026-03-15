/**
 * @process specializations/embedded-systems/hw-sw-interface-specification
 * @description Hardware-Software Interface Specification - Creating detailed interface specifications between hardware and
 * software including register maps, memory-mapped I/O, pin assignments, timing requirements, and electrical characteristics.
 * @inputs { projectName: string, targetMcu: string, peripherals?: array, documentFormat?: string, outputDir?: string }
 * @outputs { success: boolean, interfaceSpec: object, registerMaps: array, pinAssignments: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/hw-sw-interface-specification', {
 *   projectName: 'SensorBoard',
 *   targetMcu: 'STM32F4',
 *   peripherals: ['ADC', 'SPI_Flash', 'I2C_Sensor', 'GPIO_LEDs'],
 *   documentFormat: 'markdown'
 * });
 *
 * @references
 * - Interface Design: https://embeddedartistry.com/blog/2017/02/06/embedded-driver-development-patterns/
 * - Register Maps: https://interrupt.memfault.com/blog/building-drivers-register-interface
 * - Hardware Abstraction: https://www.embedded.com/hardware-abstraction-layer-design/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    peripherals = [],
    documentFormat = 'markdown',
    includeTimingDiagrams = true,
    outputDir = 'hw-sw-interface-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HW-SW Interface Specification: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Peripherals: ${peripherals.length}`);

  // ============================================================================
  // PHASE 1: INTERFACE INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Inventorying Hardware Interfaces');

  const interfaceInventory = await ctx.task(interfaceInventoryTask, {
    projectName,
    targetMcu,
    peripherals,
    outputDir
  });

  artifacts.push(...interfaceInventory.artifacts);

  // ============================================================================
  // PHASE 2: REGISTER MAP SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying Register Maps');

  const registerMaps = await ctx.task(registerMapSpecificationTask, {
    projectName,
    interfaceInventory,
    outputDir
  });

  artifacts.push(...registerMaps.artifacts);

  // ============================================================================
  // PHASE 3: MEMORY MAP SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Specifying Memory Map');

  const memoryMap = await ctx.task(memoryMapSpecificationTask, {
    projectName,
    targetMcu,
    registerMaps,
    outputDir
  });

  artifacts.push(...memoryMap.artifacts);

  // ============================================================================
  // PHASE 4: PIN ASSIGNMENT SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying Pin Assignments');

  const pinAssignments = await ctx.task(pinAssignmentSpecificationTask, {
    projectName,
    targetMcu,
    interfaceInventory,
    outputDir
  });

  artifacts.push(...pinAssignments.artifacts);

  // ============================================================================
  // PHASE 5: TIMING SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Specifying Timing Requirements');

  const timingSpec = await ctx.task(timingSpecificationTask, {
    projectName,
    interfaceInventory,
    includeTimingDiagrams,
    outputDir
  });

  artifacts.push(...timingSpec.artifacts);

  // ============================================================================
  // PHASE 6: ELECTRICAL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Specifying Electrical Characteristics');

  const electricalSpec = await ctx.task(electricalSpecificationTask, {
    projectName,
    targetMcu,
    pinAssignments,
    outputDir
  });

  artifacts.push(...electricalSpec.artifacts);

  // ============================================================================
  // PHASE 7: INTERFACE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Interface Documentation');

  const documentation = await ctx.task(hwSwInterfaceDocumentationTask, {
    projectName,
    documentFormat,
    interfaceInventory,
    registerMaps,
    memoryMap,
    pinAssignments,
    timingSpec,
    electricalSpec,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 8: HEADER FILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Header Files');

  const headerGeneration = await ctx.task(headerFileGenerationTask, {
    projectName,
    registerMaps,
    memoryMap,
    outputDir
  });

  artifacts.push(...headerGeneration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `HW-SW Interface Specification Complete for ${projectName}. Interfaces: ${interfaceInventory.interfaces.length}, Registers: ${registerMaps.totalRegisters}. Review?`,
    title: 'Interface Specification Complete',
    context: {
      runId: ctx.runId,
      summary: {
        interfaceCount: interfaceInventory.interfaces.length,
        registerCount: registerMaps.totalRegisters,
        pinCount: pinAssignments.totalPins
      },
      files: [
        { path: documentation.specPath, format: documentFormat, label: 'Interface Specification' },
        { path: headerGeneration.headerPath, format: 'c', label: 'Generated Headers' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    interfaceSpec: {
      interfaces: interfaceInventory.interfaces,
      memoryMap: memoryMap.map,
      specPath: documentation.specPath
    },
    registerMaps: registerMaps.maps,
    pinAssignments: pinAssignments.assignments,
    timing: timingSpec.specifications,
    electrical: electricalSpec.characteristics,
    headerPath: headerGeneration.headerPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/hw-sw-interface-specification',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const interfaceInventoryTask = defineTask('interface-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Interface Inventory - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Inventory hardware interfaces',
      context: args,
      instructions: [
        '1. List all peripherals',
        '2. Identify interface types',
        '3. Document bus connections',
        '4. List external devices',
        '5. Identify GPIOs',
        '6. Document DMA channels',
        '7. List interrupt sources',
        '8. Identify clocks',
        '9. Create interface diagram',
        '10. Document inventory'
      ],
      outputFormat: 'JSON with interface inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'peripherals', 'artifacts'],
      properties: {
        interfaces: { type: 'array', items: { type: 'object' } },
        peripherals: { type: 'array', items: { type: 'object' } },
        externalDevices: { type: 'array', items: { type: 'object' } },
        dmaChannels: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'inventory']
}));

export const registerMapSpecificationTask = defineTask('register-map-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Register Maps - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Specify register maps',
      context: args,
      instructions: [
        '1. Define register addresses',
        '2. Specify bit fields',
        '3. Document access types',
        '4. Define reset values',
        '5. Specify field descriptions',
        '6. Document dependencies',
        '7. Define read/write masks',
        '8. Specify reserved bits',
        '9. Create register tables',
        '10. Document register map'
      ],
      outputFormat: 'JSON with register maps'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'totalRegisters', 'artifacts'],
      properties: {
        maps: { type: 'array', items: { type: 'object' } },
        totalRegisters: { type: 'number' },
        bitFields: { type: 'object' },
        resetValues: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'registers']
}));

export const memoryMapSpecificationTask = defineTask('memory-map-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Memory Map - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Specify memory map',
      context: args,
      instructions: [
        '1. Define address ranges',
        '2. Map peripheral bases',
        '3. Specify access permissions',
        '4. Document region sizes',
        '5. Define alignment requirements',
        '6. Map external memory',
        '7. Document gaps',
        '8. Specify cacheability',
        '9. Create memory map diagram',
        '10. Document map'
      ],
      outputFormat: 'JSON with memory map'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'regions', 'artifacts'],
      properties: {
        map: { type: 'object' },
        regions: { type: 'array', items: { type: 'object' } },
        peripheralBases: { type: 'object' },
        totalAddressSpace: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'memory-map']
}));

export const pinAssignmentSpecificationTask = defineTask('pin-assignment-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Pin Assignments - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Specify pin assignments',
      context: args,
      instructions: [
        '1. List all pins',
        '2. Assign functions',
        '3. Specify alternate functions',
        '4. Document directions',
        '5. Specify pull-ups/downs',
        '6. Define drive strength',
        '7. Document multiplexing',
        '8. Create pin table',
        '9. Generate pin diagram',
        '10. Document assignments'
      ],
      outputFormat: 'JSON with pin assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'totalPins', 'artifacts'],
      properties: {
        assignments: { type: 'array', items: { type: 'object' } },
        totalPins: { type: 'number' },
        alternateFunctions: { type: 'object' },
        gpioConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'pins']
}));

export const timingSpecificationTask = defineTask('timing-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Timing Specification - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Specify timing requirements',
      context: args,
      instructions: [
        '1. Define clock frequencies',
        '2. Specify setup times',
        '3. Specify hold times',
        '4. Define propagation delays',
        '5. Specify bus timing',
        '6. Define interrupt latency',
        '7. Specify DMA timing',
        '8. Create timing diagrams',
        '9. Document constraints',
        '10. Verify margins'
      ],
      outputFormat: 'JSON with timing specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'clockFrequencies', 'artifacts'],
      properties: {
        specifications: { type: 'array', items: { type: 'object' } },
        clockFrequencies: { type: 'object' },
        setupHoldTimes: { type: 'object' },
        timingDiagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'timing']
}));

export const electricalSpecificationTask = defineTask('electrical-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Electrical Specification - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Specify electrical characteristics',
      context: args,
      instructions: [
        '1. Define voltage levels',
        '2. Specify current limits',
        '3. Define logic thresholds',
        '4. Specify impedances',
        '5. Define power requirements',
        '6. Specify ESD ratings',
        '7. Document absolute maximums',
        '8. Specify operating conditions',
        '9. Define decoupling',
        '10. Document characteristics'
      ],
      outputFormat: 'JSON with electrical specification'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'voltageLevels', 'artifacts'],
      properties: {
        characteristics: { type: 'object' },
        voltageLevels: { type: 'object' },
        currentLimits: { type: 'object' },
        powerRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'electrical']
}));

export const hwSwInterfaceDocumentationTask = defineTask('hw-sw-interface-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Interface Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate interface documentation',
      context: args,
      instructions: [
        '1. Create document structure',
        '2. Document interfaces',
        '3. Include register maps',
        '4. Add memory map',
        '5. Document pin assignments',
        '6. Include timing specs',
        '7. Add electrical specs',
        '8. Include diagrams',
        '9. Add revision history',
        '10. Format document'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'sections', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'documentation']
}));

export const headerFileGenerationTask = defineTask('header-file-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Header Generation - ${args.projectName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Generate header files',
      context: args,
      instructions: [
        '1. Generate register defines',
        '2. Create bit field macros',
        '3. Generate base addresses',
        '4. Create peripheral structs',
        '5. Generate access macros',
        '6. Add documentation comments',
        '7. Create type definitions',
        '8. Generate enumerations',
        '9. Add header guards',
        '10. Format headers'
      ],
      outputFormat: 'JSON with generated headers'
    },
    outputSchema: {
      type: 'object',
      required: ['headerPath', 'generatedFiles', 'artifacts'],
      properties: {
        headerPath: { type: 'string' },
        generatedFiles: { type: 'array', items: { type: 'string' } },
        macroCount: { type: 'number' },
        structCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'interface-spec', 'codegen']
}));
