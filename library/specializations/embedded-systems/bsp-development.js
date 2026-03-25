/**
 * @process specializations/embedded-systems/bsp-development
 * @description Board Support Package (BSP) Development - Creating and maintaining the foundational software layer that
 * initializes hardware, provides hardware abstraction, and enables higher-level software to interact with specific
 * hardware platforms.
 * @inputs { boardName: string, targetMcu: string, rtos?: string, peripherals?: array, outputDir?: string }
 * @outputs { success: boolean, bspStructure: object, driversCreated: array, halConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/bsp-development', {
 *   boardName: 'CustomBoard-v2',
 *   targetMcu: 'STM32F407VG',
 *   rtos: 'FreeRTOS',
 *   peripherals: ['UART', 'SPI', 'I2C', 'GPIO', 'ADC', 'Timer']
 * });
 *
 * @references
 * - Creating a Board Support Package: https://www.embedded.com/creating-a-board-support-package/
 * - BSP Architecture: https://embeddedartistry.com/blog/2017/02/06/embedded-driver-development-patterns/
 * - HAL Design: https://interrupt.memfault.com/blog/hardware-abstraction-layer
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    boardName,
    targetMcu,
    rtos = null, // null for bare-metal, 'FreeRTOS', 'Zephyr', 'ThreadX'
    peripherals = ['GPIO', 'UART', 'SPI', 'I2C', 'Timer'],
    vendorHal = true, // Use vendor HAL (STM32 HAL, NXP SDK, etc.)
    customHal = false, // Create custom HAL layer
    lowPowerSupport = true,
    debugSupport = true,
    outputDir = 'bsp-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting BSP Development for ${boardName}`);
  ctx.log('info', `Target MCU: ${targetMcu}, RTOS: ${rtos || 'Bare-metal'}`);

  // ============================================================================
  // PHASE 1: BSP ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing BSP Architecture');

  const architectureDesign = await ctx.task(bspArchitectureTask, {
    boardName,
    targetMcu,
    rtos,
    peripherals,
    vendorHal,
    customHal,
    lowPowerSupport,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  await ctx.breakpoint({
    question: `BSP Architecture designed for ${boardName}. Layers: ${architectureDesign.layers.join(', ')}. Review architecture before implementation?`,
    title: 'BSP Architecture Review',
    context: {
      runId: ctx.runId,
      layers: architectureDesign.layers,
      modules: architectureDesign.modules,
      files: architectureDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: STARTUP CODE AND LINKER SCRIPT
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating Startup Code and Linker Script');

  const startupCode = await ctx.task(startupCodeTask, {
    boardName,
    targetMcu,
    architectureDesign,
    rtos,
    outputDir
  });

  artifacts.push(...startupCode.artifacts);

  // ============================================================================
  // PHASE 3: SYSTEM INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing System Initialization');

  const systemInit = await ctx.task(systemInitTask, {
    boardName,
    targetMcu,
    architectureDesign,
    startupCode,
    outputDir
  });

  artifacts.push(...systemInit.artifacts);

  // ============================================================================
  // PHASE 4: CLOCK CONFIGURATION MODULE
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating Clock Configuration Module');

  const clockConfig = await ctx.task(clockConfigModuleTask, {
    boardName,
    targetMcu,
    architectureDesign,
    outputDir
  });

  artifacts.push(...clockConfig.artifacts);

  // ============================================================================
  // PHASE 5: GPIO ABSTRACTION LAYER
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing GPIO Abstraction Layer');

  const gpioLayer = await ctx.task(gpioAbstractionTask, {
    boardName,
    targetMcu,
    architectureDesign,
    outputDir
  });

  artifacts.push(...gpioLayer.artifacts);

  // ============================================================================
  // PHASE 6: PERIPHERAL DRIVERS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating Peripheral Driver Modules');

  const driverTasks = peripherals
    .filter(p => p !== 'GPIO') // GPIO handled separately
    .map(peripheral =>
      () => ctx.task(peripheralDriverTask, {
        boardName,
        targetMcu,
        peripheral,
        architectureDesign,
        vendorHal,
        outputDir
      })
    );

  const driverResults = await ctx.parallel.all(driverTasks);
  const driversCreated = [];

  driverResults.forEach(result => {
    artifacts.push(...result.artifacts);
    driversCreated.push({
      peripheral: result.peripheral,
      files: result.files,
      functions: result.exportedFunctions
    });
  });

  // ============================================================================
  // PHASE 7: INTERRUPT MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Interrupt Management');

  const interruptMgmt = await ctx.task(interruptManagementTask, {
    boardName,
    targetMcu,
    peripherals,
    rtos,
    architectureDesign,
    outputDir
  });

  artifacts.push(...interruptMgmt.artifacts);

  // ============================================================================
  // PHASE 8: LOW-POWER MANAGEMENT (if enabled)
  // ============================================================================

  let lowPowerMgmt = null;
  if (lowPowerSupport) {
    ctx.log('info', 'Phase 8: Implementing Low-Power Management');

    lowPowerMgmt = await ctx.task(lowPowerManagementTask, {
      boardName,
      targetMcu,
      rtos,
      architectureDesign,
      outputDir
    });

    artifacts.push(...lowPowerMgmt.artifacts);
  }

  // ============================================================================
  // PHASE 9: RTOS INTEGRATION (if applicable)
  // ============================================================================

  let rtosIntegration = null;
  if (rtos) {
    ctx.log('info', `Phase 9: Integrating ${rtos}`);

    rtosIntegration = await ctx.task(rtosIntegrationTask, {
      boardName,
      targetMcu,
      rtos,
      architectureDesign,
      interruptMgmt,
      outputDir
    });

    artifacts.push(...rtosIntegration.artifacts);
  }

  // ============================================================================
  // PHASE 10: DEBUG AND LOGGING SUPPORT
  // ============================================================================

  let debugModule = null;
  if (debugSupport) {
    ctx.log('info', 'Phase 10: Adding Debug and Logging Support');

    debugModule = await ctx.task(debugSupportTask, {
      boardName,
      targetMcu,
      rtos,
      architectureDesign,
      outputDir
    });

    artifacts.push(...debugModule.artifacts);
  }

  // ============================================================================
  // PHASE 11: BSP CONFIGURATION HEADER
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating BSP Configuration Header');

  const bspConfig = await ctx.task(bspConfigHeaderTask, {
    boardName,
    targetMcu,
    rtos,
    peripherals,
    architectureDesign,
    driversCreated,
    lowPowerSupport,
    debugSupport,
    outputDir
  });

  artifacts.push(...bspConfig.artifacts);

  // ============================================================================
  // PHASE 12: BUILD SYSTEM INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting Up Build System');

  const buildSystem = await ctx.task(buildSystemTask, {
    boardName,
    targetMcu,
    rtos,
    architectureDesign,
    outputDir
  });

  artifacts.push(...buildSystem.artifacts);

  // ============================================================================
  // PHASE 13: BSP DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating BSP Documentation');

  const documentation = await ctx.task(bspDocumentationTask, {
    boardName,
    targetMcu,
    rtos,
    architectureDesign,
    driversCreated,
    bspConfig,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `BSP Development Complete for ${boardName}. ${driversCreated.length} drivers created. Review BSP package?`,
    title: 'BSP Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        boardName,
        targetMcu,
        rtos: rtos || 'Bare-metal',
        driversCount: driversCreated.length,
        lowPowerSupport,
        debugSupport
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'BSP Documentation' },
        { path: bspConfig.configPath, format: 'c', label: 'BSP Configuration' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    boardName,
    targetMcu,
    rtos: rtos || 'bare-metal',
    bspStructure: {
      layers: architectureDesign.layers,
      modules: architectureDesign.modules,
      directories: architectureDesign.directories
    },
    driversCreated,
    halConfig: {
      vendorHal,
      customHal,
      peripherals
    },
    features: {
      lowPowerSupport,
      debugSupport,
      rtosIntegration: !!rtos
    },
    buildSystem: {
      type: buildSystem.buildType,
      configPath: buildSystem.configPath
    },
    documentation: {
      readmePath: documentation.readmePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/bsp-development',
      timestamp: startTime,
      boardName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const bspArchitectureTask = defineTask('bsp-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: BSP Architecture - ${args.boardName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Architect',
      task: 'Design BSP architecture with proper layering and abstraction',
      context: args,
      instructions: [
        '1. Define BSP layer hierarchy (HAL, Drivers, Board, Application)',
        '2. Design module structure for each peripheral type',
        '3. Define directory structure and file organization',
        '4. Specify interfaces between layers',
        '5. Design configuration mechanism (compile-time, runtime)',
        '6. Plan memory allocation strategy',
        '7. Define error handling approach',
        '8. Design interrupt priority scheme',
        '9. Plan for portability and reusability',
        '10. Create architecture diagram'
      ],
      outputFormat: 'JSON with BSP architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'modules', 'directories', 'artifacts'],
      properties: {
        layers: { type: 'array', items: { type: 'string' } },
        modules: { type: 'array', items: { type: 'object' } },
        directories: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        configMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'architecture']
}));

export const startupCodeTask = defineTask('startup-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Startup Code - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create startup code and linker script for the target MCU',
      context: args,
      instructions: [
        '1. Create vector table with interrupt handlers',
        '2. Implement Reset_Handler startup sequence',
        '3. Initialize .data section (copy from Flash to RAM)',
        '4. Zero-initialize .bss section',
        '5. Initialize C runtime (call static constructors if C++)',
        '6. Configure FPU if present',
        '7. Call SystemInit for clock setup',
        '8. Create linker script with memory regions',
        '9. Define stack and heap sizes',
        '10. Add weak default handlers for all interrupts'
      ],
      outputFormat: 'JSON with startup code details'
    },
    outputSchema: {
      type: 'object',
      required: ['startupFile', 'linkerScript', 'artifacts'],
      properties: {
        startupFile: { type: 'string' },
        linkerScript: { type: 'string' },
        vectorTable: { type: 'object' },
        memoryRegions: { type: 'array', items: { type: 'object' } },
        stackSize: { type: 'string' },
        heapSize: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'startup']
}));

export const systemInitTask = defineTask('system-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: System Initialization - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement system initialization sequence',
      context: args,
      instructions: [
        '1. Configure flash wait states for target frequency',
        '2. Enable instruction and data caches',
        '3. Configure voltage regulator if applicable',
        '4. Set up system tick timer',
        '5. Configure NVIC priority grouping',
        '6. Enable fault handlers (HardFault, MemManage, etc.)',
        '7. Initialize debug features (ITM, DWT)',
        '8. Configure MPU regions if needed',
        '9. Create BSP_Init() entry point',
        '10. Document initialization sequence'
      ],
      outputFormat: 'JSON with system init details'
    },
    outputSchema: {
      type: 'object',
      required: ['initSequence', 'artifacts'],
      properties: {
        initSequence: { type: 'array', items: { type: 'string' } },
        configuredFeatures: { type: 'array', items: { type: 'string' } },
        systemTickConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'initialization']
}));

export const clockConfigModuleTask = defineTask('clock-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Clock Configuration - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create clock configuration module',
      context: args,
      instructions: [
        '1. Define clock source options (HSI, HSE, LSI, LSE)',
        '2. Configure PLL for system clock',
        '3. Set AHB, APB1, APB2 prescalers',
        '4. Configure peripheral clock enables',
        '5. Add clock frequency getter functions',
        '6. Implement clock switching functions',
        '7. Add clock failure detection and recovery',
        '8. Create clock tree documentation',
        '9. Support dynamic clock scaling if needed',
        '10. Add validation for clock configuration'
      ],
      outputFormat: 'JSON with clock configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['clockConfig', 'frequencies', 'artifacts'],
      properties: {
        clockConfig: { type: 'object' },
        frequencies: { type: 'object' },
        exportedFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'clock']
}));

export const gpioAbstractionTask = defineTask('gpio-abstraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: GPIO Abstraction - ${args.boardName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create GPIO abstraction layer',
      context: args,
      instructions: [
        '1. Define GPIO port and pin data types',
        '2. Create pin configuration structure',
        '3. Implement GPIO_Init() for pin configuration',
        '4. Create GPIO_Read/Write/Toggle functions',
        '5. Add alternate function configuration',
        '6. Implement EXTI (external interrupt) support',
        '7. Create board-specific pin definitions',
        '8. Add port-wide operations',
        '9. Support pin remapping if available',
        '10. Create GPIO test/validation functions'
      ],
      outputFormat: 'JSON with GPIO abstraction details'
    },
    outputSchema: {
      type: 'object',
      required: ['gpioApi', 'pinDefinitions', 'artifacts'],
      properties: {
        gpioApi: { type: 'array', items: { type: 'string' } },
        pinDefinitions: { type: 'object' },
        extiSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'gpio']
}));

export const peripheralDriverTask = defineTask('peripheral-driver', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: ${args.peripheral} Driver - ${args.boardName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: `Create ${args.peripheral} peripheral driver`,
      context: args,
      instructions: [
        `1. Define ${args.peripheral} handle/instance structure`,
        '2. Create initialization function with configuration options',
        '3. Implement core read/write/transfer operations',
        '4. Add interrupt-driven operation support',
        '5. Implement DMA support if applicable',
        '6. Add error handling and status reporting',
        '7. Create timeout handling',
        '8. Implement de-initialization function',
        '9. Add callback registration for async operations',
        '10. Document API with usage examples'
      ],
      outputFormat: 'JSON with driver details'
    },
    outputSchema: {
      type: 'object',
      required: ['peripheral', 'files', 'exportedFunctions', 'artifacts'],
      properties: {
        peripheral: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        exportedFunctions: { type: 'array', items: { type: 'string' } },
        interruptSupport: { type: 'boolean' },
        dmaSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'driver', args.peripheral]
}));

export const interruptManagementTask = defineTask('interrupt-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Interrupt Management - ${args.boardName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement interrupt management system',
      context: args,
      instructions: [
        '1. Define interrupt priority levels scheme',
        '2. Create NVIC configuration functions',
        '3. Implement interrupt enable/disable functions',
        '4. Add critical section macros',
        '5. Create interrupt handler registration mechanism',
        '6. Implement interrupt nesting support',
        '7. Add interrupt latency measurement hooks',
        '8. Configure preemption and sub-priority',
        '9. Implement interrupt-safe queue operations',
        '10. Document interrupt configuration'
      ],
      outputFormat: 'JSON with interrupt management details'
    },
    outputSchema: {
      type: 'object',
      required: ['priorityScheme', 'exportedFunctions', 'artifacts'],
      properties: {
        priorityScheme: { type: 'object' },
        priorityLevels: { type: 'number' },
        exportedFunctions: { type: 'array', items: { type: 'string' } },
        criticalSectionMacros: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'interrupts']
}));

export const lowPowerManagementTask = defineTask('low-power-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Low-Power Management - ${args.boardName}`,
  agent: {
    name: 'power-optimization-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement low-power management module',
      context: args,
      instructions: [
        '1. Identify available sleep modes (Sleep, Stop, Standby)',
        '2. Create sleep mode entry functions',
        '3. Configure wake-up sources (EXTI, RTC, UART)',
        '4. Implement peripheral power-down sequences',
        '5. Add clock gating functions',
        '6. Create power consumption profiles',
        '7. Implement wake-up time optimization',
        '8. Add peripheral state save/restore',
        '9. Integrate with RTOS tickless idle if applicable',
        '10. Document power modes and consumption'
      ],
      outputFormat: 'JSON with low-power management details'
    },
    outputSchema: {
      type: 'object',
      required: ['sleepModes', 'wakeupSources', 'artifacts'],
      properties: {
        sleepModes: { type: 'array', items: { type: 'object' } },
        wakeupSources: { type: 'array', items: { type: 'string' } },
        exportedFunctions: { type: 'array', items: { type: 'string' } },
        powerProfiles: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'low-power']
}));

export const rtosIntegrationTask = defineTask('rtos-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: ${args.rtos} Integration - ${args.boardName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: `Integrate ${args.rtos} with BSP`,
      context: args,
      instructions: [
        '1. Configure RTOS port for target MCU',
        '2. Set up SysTick for RTOS tick',
        '3. Configure PendSV and SVCall handlers',
        '4. Define task stack sizes and priorities',
        '5. Implement tick suppression for low-power',
        '6. Create RTOS-aware interrupt handlers',
        '7. Configure heap memory for RTOS',
        '8. Set up static allocation if desired',
        '9. Create BSP-RTOS abstraction if needed',
        '10. Document RTOS configuration'
      ],
      outputFormat: 'JSON with RTOS integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['rtosConfig', 'portFiles', 'artifacts'],
      properties: {
        rtosConfig: { type: 'object' },
        portFiles: { type: 'array', items: { type: 'string' } },
        tickConfig: { type: 'object' },
        heapConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'rtos', args.rtos]
}));

export const debugSupportTask = defineTask('debug-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Debug Support - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Add debug and logging support to BSP',
      context: args,
      instructions: [
        '1. Implement printf retargeting to UART',
        '2. Configure ITM for SWO trace output',
        '3. Add assert macro with location info',
        '4. Create logging module with levels',
        '5. Implement fault handler with diagnostics',
        '6. Add stack usage tracking',
        '7. Create CPU cycle counter functions',
        '8. Implement watchdog support',
        '9. Add runtime statistics gathering',
        '10. Document debug features'
      ],
      outputFormat: 'JSON with debug support details'
    },
    outputSchema: {
      type: 'object',
      required: ['debugFeatures', 'exportedFunctions', 'artifacts'],
      properties: {
        debugFeatures: { type: 'array', items: { type: 'string' } },
        exportedFunctions: { type: 'array', items: { type: 'string' } },
        loggingLevels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'debug']
}));

export const bspConfigHeaderTask = defineTask('bsp-config-header', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: BSP Configuration - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create BSP configuration header file',
      context: args,
      instructions: [
        '1. Define board identification macros',
        '2. Configure peripheral enable/disable flags',
        '3. Set buffer sizes and resource limits',
        '4. Define pin assignments for board',
        '5. Set clock configuration parameters',
        '6. Configure debug options',
        '7. Set RTOS configuration if applicable',
        '8. Define version information',
        '9. Add sanity check assertions',
        '10. Document all configuration options'
      ],
      outputFormat: 'JSON with configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'configOptions', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        configOptions: { type: 'array', items: { type: 'object' } },
        pinDefinitions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'configuration']
}));

export const buildSystemTask = defineTask('build-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Build System - ${args.boardName}`,
  agent: {
    name: 'build-engineer',
    prompt: {
      role: 'Embedded Build Engineer',
      task: 'Set up build system for BSP',
      context: args,
      instructions: [
        '1. Create CMakeLists.txt or Makefile',
        '2. Define compiler flags for target',
        '3. Configure linker flags and script',
        '4. Set up include paths',
        '5. Create library target for BSP',
        '6. Add example application target',
        '7. Configure debug and release builds',
        '8. Add static analysis integration',
        '9. Set up code formatting rules',
        '10. Document build instructions'
      ],
      outputFormat: 'JSON with build system details'
    },
    outputSchema: {
      type: 'object',
      required: ['buildType', 'configPath', 'artifacts'],
      properties: {
        buildType: { type: 'string', enum: ['cmake', 'make', 'meson'] },
        configPath: { type: 'string' },
        targets: { type: 'array', items: { type: 'string' } },
        compilerFlags: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'build-system']
}));

export const bspDocumentationTask = defineTask('bsp-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: BSP Documentation - ${args.boardName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Documentation Engineer',
      task: 'Create BSP documentation',
      context: args,
      instructions: [
        '1. Create README with quick start guide',
        '2. Document BSP architecture and layers',
        '3. Create API reference for each module',
        '4. Document configuration options',
        '5. Add hardware setup instructions',
        '6. Create getting started examples',
        '7. Document peripheral usage with code samples',
        '8. Add troubleshooting guide',
        '9. Create change log template',
        '10. Add license and contribution guidelines'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        apiDocsPath: { type: 'string' },
        examplesPath: { type: 'string' },
        documentationFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bsp', 'documentation']
}));
