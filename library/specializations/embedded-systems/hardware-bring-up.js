/**
 * @process specializations/embedded-systems/hardware-bring-up
 * @description Hardware Bring-Up Process - Initial validation and testing of new hardware platforms, including power-on
 * sequence verification, clock configuration, memory testing, and peripheral functionality validation using JTAG debuggers
 * and oscilloscopes.
 * @inputs { boardName: string, hardwareRevision?: string, schematicPath?: string, datasheetPaths?: array, targetMcu?: string, debugInterface?: string, outputDir?: string }
 * @outputs { success: boolean, validationReport: object, peripheralsValidated: array, issues: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/hardware-bring-up', {
 *   boardName: 'CustomBoard-Rev2',
 *   hardwareRevision: 'Rev2.1',
 *   targetMcu: 'STM32F407VG',
 *   debugInterface: 'JTAG',
 *   schematicPath: 'docs/schematics/custom-board-v2.pdf'
 * });
 *
 * @references
 * - Hardware Bring-Up Best Practices: https://www.embedded.com/hardware-bring-up-best-practices/
 * - JTAG Debugging: https://interrupt.memfault.com/blog/a-deep-dive-into-jtag
 * - Embedded Systems Debugging: https://www.embedded.com/debugging-embedded-systems-with-oscilloscopes/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    boardName,
    hardwareRevision = '1.0',
    schematicPath = null,
    datasheetPaths = [],
    targetMcu = 'STM32F4xx',
    debugInterface = 'SWD', // 'SWD', 'JTAG', 'cJTAG'
    powerSupplyVoltages = ['3.3V', '5V'],
    oscillatorFrequencies = [],
    peripheralsToTest = ['GPIO', 'UART', 'SPI', 'I2C', 'Timer'],
    outputDir = 'hardware-bring-up-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Hardware Bring-Up Process for ${boardName} (${hardwareRevision})`);
  ctx.log('info', `Target MCU: ${targetMcu}, Debug Interface: ${debugInterface}`);

  // ============================================================================
  // PHASE 1: PRE-BRING-UP PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Pre-Bring-Up Preparation and Documentation Review');

  const preparation = await ctx.task(preBringUpPreparationTask, {
    boardName,
    hardwareRevision,
    schematicPath,
    datasheetPaths,
    targetMcu,
    debugInterface,
    powerSupplyVoltages,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // ============================================================================
  // PHASE 2: POWER SUPPLY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Power Supply and Voltage Rail Validation');

  const powerValidation = await ctx.task(powerSupplyValidationTask, {
    boardName,
    powerSupplyVoltages,
    preparation,
    outputDir
  });

  artifacts.push(...powerValidation.artifacts);
  if (powerValidation.issues) issues.push(...powerValidation.issues);

  // Quality Gate: Power validation must pass before proceeding
  if (!powerValidation.allRailsValid) {
    await ctx.breakpoint({
      question: `Power supply validation for ${boardName} found issues: ${powerValidation.failedRails.join(', ')}. Review and resolve power issues before continuing?`,
      title: 'Power Supply Validation Failed',
      context: {
        runId: ctx.runId,
        boardName,
        failedRails: powerValidation.failedRails,
        measurements: powerValidation.measurements,
        recommendation: 'Check power supply connections, decoupling capacitors, and regulator outputs',
        files: powerValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: CLOCK CONFIGURATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Clock System Configuration and Validation');

  const clockValidation = await ctx.task(clockConfigurationTask, {
    boardName,
    targetMcu,
    oscillatorFrequencies,
    preparation,
    outputDir
  });

  artifacts.push(...clockValidation.artifacts);
  if (clockValidation.issues) issues.push(...clockValidation.issues);

  // ============================================================================
  // PHASE 4: DEBUG INTERFACE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Debug Interface Connection and Validation');

  const debugValidation = await ctx.task(debugInterfaceValidationTask, {
    boardName,
    targetMcu,
    debugInterface,
    preparation,
    outputDir
  });

  artifacts.push(...debugValidation.artifacts);
  if (debugValidation.issues) issues.push(...debugValidation.issues);

  // Quality Gate: Debug connection
  if (!debugValidation.connectionSuccessful) {
    await ctx.breakpoint({
      question: `Debug interface (${debugInterface}) connection to ${boardName} failed. Check debug probe and connections. Continue with troubleshooting?`,
      title: 'Debug Interface Connection Failed',
      context: {
        runId: ctx.runId,
        debugInterface,
        targetMcu,
        troubleshootingSteps: debugValidation.troubleshootingSteps,
        files: debugValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: MEMORY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Memory System Testing (Flash, RAM, External Memory)');

  const memoryTesting = await ctx.task(memoryTestingTask, {
    boardName,
    targetMcu,
    preparation,
    outputDir
  });

  artifacts.push(...memoryTesting.artifacts);
  if (memoryTesting.issues) issues.push(...memoryTesting.issues);

  // ============================================================================
  // PHASE 6: PERIPHERAL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Peripheral Functionality Validation');

  // Run peripheral tests in parallel where possible
  const peripheralTests = await ctx.parallel.all(
    peripheralsToTest.map(peripheral =>
      () => ctx.task(peripheralValidationTask, {
        boardName,
        targetMcu,
        peripheral,
        preparation,
        outputDir
      })
    )
  );

  const peripheralsValidated = [];
  peripheralTests.forEach(test => {
    artifacts.push(...test.artifacts);
    if (test.issues) issues.push(...test.issues);
    peripheralsValidated.push({
      peripheral: test.peripheral,
      status: test.status,
      testsPassed: test.testsPassed,
      testsFailed: test.testsFailed
    });
  });

  // ============================================================================
  // PHASE 7: INITIAL FIRMWARE LOAD TEST
  // ============================================================================

  ctx.log('info', 'Phase 7: Initial Firmware Load and Execution Test');

  const firmwareLoadTest = await ctx.task(firmwareLoadTestTask, {
    boardName,
    targetMcu,
    debugInterface,
    memoryTesting,
    outputDir
  });

  artifacts.push(...firmwareLoadTest.artifacts);
  if (firmwareLoadTest.issues) issues.push(...firmwareLoadTest.issues);

  // ============================================================================
  // PHASE 8: BRING-UP REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Bring-Up Report');

  const bringUpReport = await ctx.task(bringUpReportTask, {
    boardName,
    hardwareRevision,
    targetMcu,
    powerValidation,
    clockValidation,
    debugValidation,
    memoryTesting,
    peripheralsValidated,
    firmwareLoadTest,
    issues,
    outputDir
  });

  artifacts.push(...bringUpReport.artifacts);

  // Final Breakpoint: Review bring-up results
  const overallSuccess = powerValidation.allRailsValid &&
    debugValidation.connectionSuccessful &&
    memoryTesting.allTestsPassed &&
    firmwareLoadTest.loadSuccessful;

  await ctx.breakpoint({
    question: `Hardware Bring-Up Complete for ${boardName}. Overall status: ${overallSuccess ? 'SUCCESS' : 'ISSUES FOUND'}. ${issues.length} issues logged. Review bring-up report?`,
    title: 'Hardware Bring-Up Complete',
    context: {
      runId: ctx.runId,
      summary: {
        boardName,
        hardwareRevision,
        targetMcu,
        overallSuccess,
        peripheralsValidated: peripheralsValidated.filter(p => p.status === 'passed').length,
        peripheralsFailed: peripheralsValidated.filter(p => p.status === 'failed').length,
        issueCount: issues.length
      },
      recommendation: overallSuccess ? 'Board is ready for BSP development' : 'Address logged issues before proceeding',
      files: [
        { path: bringUpReport.reportPath, format: 'markdown', label: 'Bring-Up Report' },
        ...bringUpReport.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: overallSuccess,
    boardName,
    hardwareRevision,
    targetMcu,
    validationReport: {
      powerValidation: {
        passed: powerValidation.allRailsValid,
        measurements: powerValidation.measurements
      },
      clockValidation: {
        passed: clockValidation.allClocksValid,
        frequencies: clockValidation.measuredFrequencies
      },
      debugValidation: {
        passed: debugValidation.connectionSuccessful,
        interface: debugInterface
      },
      memoryTesting: {
        passed: memoryTesting.allTestsPassed,
        flashSize: memoryTesting.flashSize,
        ramSize: memoryTesting.ramSize
      },
      firmwareLoad: {
        passed: firmwareLoadTest.loadSuccessful
      }
    },
    peripheralsValidated,
    issues,
    reportPath: bringUpReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/hardware-bring-up',
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

export const preBringUpPreparationTask = defineTask('pre-bring-up-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pre-Bring-Up Preparation - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Prepare for hardware bring-up by reviewing documentation and creating test plan',
      context: args,
      instructions: [
        '1. Review board schematics and identify key components',
        '2. Review MCU datasheet for pin configuration and power requirements',
        '3. Identify power supply rails and expected voltages',
        '4. Document clock sources (HSE, LSE, internal oscillators)',
        '5. Create memory map based on MCU specifications',
        '6. Identify debug interface connections (SWD/JTAG pins)',
        '7. List peripherals to be validated with test procedures',
        '8. Prepare test equipment checklist (oscilloscope, multimeter, logic analyzer)',
        '9. Create bring-up checklist with sequence of operations',
        '10. Document expected behavior for each validation step'
      ],
      outputFormat: 'JSON with preparation details and test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'powerRails', 'peripheralList', 'artifacts'],
      properties: {
        testPlan: { type: 'object' },
        powerRails: { type: 'array', items: { type: 'object' } },
        clockSources: { type: 'array', items: { type: 'object' } },
        memoryMap: { type: 'object' },
        peripheralList: { type: 'array', items: { type: 'string' } },
        debugPins: { type: 'object' },
        equipmentChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'preparation']
}));

export const powerSupplyValidationTask = defineTask('power-supply-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Power Supply Validation - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Hardware Test Engineer',
      task: 'Validate power supply rails and voltage regulators',
      context: args,
      instructions: [
        '1. Verify input power supply voltage and current capacity',
        '2. Measure each voltage rail with multimeter',
        '3. Verify voltage within tolerance (typically +/- 5%)',
        '4. Check for ripple and noise with oscilloscope',
        '5. Verify power sequencing if multiple rails',
        '6. Check regulator thermal performance under load',
        '7. Verify decoupling capacitor effectiveness',
        '8. Measure current consumption at idle state',
        '9. Document all measurements and compare to expected values',
        '10. Identify and log any power-related issues'
      ],
      outputFormat: 'JSON with power validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allRailsValid', 'measurements', 'artifacts'],
      properties: {
        allRailsValid: { type: 'boolean' },
        measurements: { type: 'array', items: { type: 'object' } },
        failedRails: { type: 'array', items: { type: 'string' } },
        rippleMeasurements: { type: 'array', items: { type: 'object' } },
        currentConsumption: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'power-validation']
}));

export const clockConfigurationTask = defineTask('clock-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Clock Configuration - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure and validate clock system',
      context: args,
      instructions: [
        '1. Verify external crystal oscillator startup',
        '2. Measure oscillator frequency with frequency counter',
        '3. Configure PLL for desired system clock',
        '4. Verify MCO (Microcontroller Clock Output) if available',
        '5. Configure peripheral clock dividers',
        '6. Measure actual peripheral clock frequencies',
        '7. Verify clock stability under temperature variation',
        '8. Configure low-power clock sources (LSE/LSI)',
        '9. Document clock tree configuration',
        '10. Log any clock-related issues or deviations'
      ],
      outputFormat: 'JSON with clock validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allClocksValid', 'measuredFrequencies', 'artifacts'],
      properties: {
        allClocksValid: { type: 'boolean' },
        measuredFrequencies: { type: 'array', items: { type: 'object' } },
        pllConfiguration: { type: 'object' },
        clockTree: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'clock-configuration']
}));

export const debugInterfaceValidationTask = defineTask('debug-interface-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Debug Interface Validation - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Validate debug interface connection and functionality',
      context: args,
      instructions: [
        '1. Verify debug probe detection (J-Link, ST-LINK, etc.)',
        '2. Check debug interface pin connections (SWDIO, SWCLK, SWO)',
        '3. Attempt target connection and identify MCU',
        '4. Read MCU device ID and verify against expected value',
        '5. Verify halt and step functionality',
        '6. Test memory read/write through debug interface',
        '7. Verify SWO trace output if available',
        '8. Test debug speed settings (slow to fast)',
        '9. Document successful debug configuration',
        '10. Create troubleshooting steps if connection fails'
      ],
      outputFormat: 'JSON with debug interface validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['connectionSuccessful', 'artifacts'],
      properties: {
        connectionSuccessful: { type: 'boolean' },
        detectedMcu: { type: 'string' },
        deviceId: { type: 'string' },
        debugSpeed: { type: 'string' },
        swoAvailable: { type: 'boolean' },
        troubleshootingSteps: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'debug-interface']
}));

export const memoryTestingTask = defineTask('memory-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Memory Testing - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Test internal and external memory systems',
      context: args,
      instructions: [
        '1. Identify memory regions (Flash, SRAM, CCM, external)',
        '2. Verify Flash memory read access',
        '3. Test SRAM with walking bit pattern',
        '4. Test SRAM with address pattern test',
        '5. Verify memory-mapped peripheral regions',
        '6. Test external memory interface if present (FSMC/FMC)',
        '7. Verify memory protection unit (MPU) configuration',
        '8. Test stack and heap regions',
        '9. Measure memory access timing',
        '10. Document memory map and test results'
      ],
      outputFormat: 'JSON with memory test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'flashSize', 'ramSize', 'artifacts'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        flashSize: { type: 'string' },
        ramSize: { type: 'string' },
        memoryRegions: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'array', items: { type: 'object' } },
        externalMemory: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'memory-testing']
}));

export const peripheralValidationTask = defineTask('peripheral-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: ${args.peripheral} Validation - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: `Validate ${args.peripheral} peripheral functionality`,
      context: args,
      instructions: [
        `1. Configure ${args.peripheral} peripheral registers`,
        '2. Verify clock enable for peripheral',
        '3. Configure GPIO pins for peripheral function',
        '4. Perform basic functional test',
        '5. Verify interrupt generation if applicable',
        '6. Test different operating modes',
        '7. Measure timing/signal with oscilloscope',
        '8. Verify communication with external devices if applicable',
        '9. Test error handling and recovery',
        '10. Document test results and any issues'
      ],
      outputFormat: 'JSON with peripheral validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['peripheral', 'status', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        peripheral: { type: 'string' },
        status: { type: 'string', enum: ['passed', 'failed', 'partial'] },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testDetails: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'peripheral-validation', args.peripheral]
}));

export const firmwareLoadTestTask = defineTask('firmware-load-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Firmware Load Test - ${args.boardName}`,
  agent: {
    name: 'hw-bringup-specialist',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Test initial firmware load and execution',
      context: args,
      instructions: [
        '1. Create minimal "blinky" test firmware',
        '2. Compile firmware with appropriate linker script',
        '3. Flash firmware to target via debug interface',
        '4. Verify successful flash programming',
        '5. Reset target and verify firmware execution',
        '6. Verify LED blink or other visible indication',
        '7. Test firmware execution from different boot modes',
        '8. Verify vector table location and interrupt handling',
        '9. Test basic printf/debug output if UART available',
        '10. Document firmware load procedure'
      ],
      outputFormat: 'JSON with firmware load test results'
    },
    outputSchema: {
      type: 'object',
      required: ['loadSuccessful', 'artifacts'],
      properties: {
        loadSuccessful: { type: 'boolean' },
        flashTime: { type: 'string' },
        verifyPassed: { type: 'boolean' },
        executionVerified: { type: 'boolean' },
        bootModesTested: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'firmware-load']
}));

export const bringUpReportTask = defineTask('bring-up-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Bring-Up Report - ${args.boardName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Documentation Engineer',
      task: 'Generate comprehensive hardware bring-up report',
      context: args,
      instructions: [
        '1. Create executive summary of bring-up status',
        '2. Document board identification and revision',
        '3. Summarize power validation results with measurements',
        '4. Summarize clock configuration and validation',
        '5. Document debug interface setup and configuration',
        '6. Summarize memory testing results',
        '7. List all peripheral validation results',
        '8. Document firmware load test results',
        '9. Create issues list with severity and recommendations',
        '10. Provide next steps and recommendations'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        overallStatus: { type: 'string', enum: ['passed', 'failed', 'partial'] },
        issuesSummary: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hardware-bring-up', 'documentation']
}));
