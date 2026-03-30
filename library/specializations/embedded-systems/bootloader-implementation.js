/**
 * @process specializations/embedded-systems/bootloader-implementation
 * @description Bootloader Implementation - Design and development of bootloader firmware including initialization code,
 * memory management, firmware update mechanisms, and secure boot processes with chain of trust.
 * @inputs { projectName: string, targetMcu: string, updateMechanism?: string, secureBoot?: boolean, outputDir?: string }
 * @outputs { success: boolean, bootloaderFiles: array, memoryLayout: object, updateProtocol: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/bootloader-implementation', {
 *   projectName: 'SecureBootloader',
 *   targetMcu: 'STM32F407VG',
 *   updateMechanism: 'uart', // 'uart', 'usb', 'can', 'ota'
 *   secureBoot: true
 * });
 *
 * @references
 * - How to Write a Bootloader from Scratch: https://interrupt.memfault.com/blog/how-to-write-a-bootloader-from-scratch
 * - Secure Boot Overview: https://interrupt.memfault.com/blog/secure-boot-overview
 * - Bootloader Design: https://www.embedded.com/bootloader-design-for-microcontrollers/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    updateMechanism = 'uart', // 'uart', 'usb', 'can', 'spi', 'ota'
    secureBoot = false,
    dualBank = false, // Support for dual-bank flash
    compression = false,
    encryption = false,
    rollbackProtection = true,
    watchdogSupport = true,
    outputDir = 'bootloader-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bootloader Implementation: ${projectName}`);
  ctx.log('info', `Target: ${targetMcu}, Update: ${updateMechanism}, Secure: ${secureBoot}`);

  // ============================================================================
  // PHASE 1: BOOTLOADER REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining Bootloader Requirements');

  const requirements = await ctx.task(bootloaderRequirementsTask, {
    projectName,
    targetMcu,
    updateMechanism,
    secureBoot,
    dualBank,
    compression,
    encryption,
    rollbackProtection,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: MEMORY LAYOUT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Memory Layout');

  const memoryLayout = await ctx.task(memoryLayoutDesignTask, {
    projectName,
    targetMcu,
    requirements,
    dualBank,
    outputDir
  });

  artifacts.push(...memoryLayout.artifacts);

  await ctx.breakpoint({
    question: `Memory layout designed for ${projectName}. Bootloader: ${memoryLayout.bootloaderSize}, App: ${memoryLayout.applicationSize}. Proceed?`,
    title: 'Memory Layout Review',
    context: {
      runId: ctx.runId,
      memoryLayout: memoryLayout.layout,
      files: memoryLayout.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: STARTUP AND INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Startup and Initialization');

  const startupCode = await ctx.task(bootloaderStartupTask, {
    projectName,
    targetMcu,
    memoryLayout,
    watchdogSupport,
    outputDir
  });

  artifacts.push(...startupCode.artifacts);

  // ============================================================================
  // PHASE 4: FLASH PROGRAMMING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Flash Programming');

  const flashProgramming = await ctx.task(flashProgrammingTask, {
    projectName,
    targetMcu,
    memoryLayout,
    dualBank,
    outputDir
  });

  artifacts.push(...flashProgramming.artifacts);

  // ============================================================================
  // PHASE 5: UPDATE PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Update Protocol');

  const updateProtocol = await ctx.task(updateProtocolTask, {
    projectName,
    updateMechanism,
    memoryLayout,
    compression,
    outputDir
  });

  artifacts.push(...updateProtocol.artifacts);

  // ============================================================================
  // PHASE 6: IMAGE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Image Verification');

  const imageVerification = await ctx.task(imageVerificationTask, {
    projectName,
    secureBoot,
    encryption,
    memoryLayout,
    outputDir
  });

  artifacts.push(...imageVerification.artifacts);

  // ============================================================================
  // PHASE 7: SECURE BOOT (if enabled)
  // ============================================================================

  let secureBootImpl = null;
  if (secureBoot) {
    ctx.log('info', 'Phase 7: Implementing Secure Boot');

    secureBootImpl = await ctx.task(secureBootImplementationTask, {
      projectName,
      targetMcu,
      encryption,
      memoryLayout,
      imageVerification,
      outputDir
    });

    artifacts.push(...secureBootImpl.artifacts);
  }

  // ============================================================================
  // PHASE 8: APPLICATION LAUNCH
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing Application Launch');

  const appLaunch = await ctx.task(applicationLaunchTask, {
    projectName,
    targetMcu,
    memoryLayout,
    secureBoot,
    outputDir
  });

  artifacts.push(...appLaunch.artifacts);

  // ============================================================================
  // PHASE 9: ROLLBACK PROTECTION (if enabled)
  // ============================================================================

  let rollbackImpl = null;
  if (rollbackProtection) {
    ctx.log('info', 'Phase 9: Implementing Rollback Protection');

    rollbackImpl = await ctx.task(rollbackProtectionTask, {
      projectName,
      dualBank,
      memoryLayout,
      outputDir
    });

    artifacts.push(...rollbackImpl.artifacts);
  }

  // ============================================================================
  // PHASE 10: ERROR HANDLING AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing Error Handling and Recovery');

  const errorHandling = await ctx.task(bootloaderErrorHandlingTask, {
    projectName,
    watchdogSupport,
    rollbackProtection,
    memoryLayout,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 11: BUILD SYSTEM AND LINKER
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting Up Build System');

  const buildSystem = await ctx.task(bootloaderBuildSystemTask, {
    projectName,
    targetMcu,
    memoryLayout,
    outputDir
  });

  artifacts.push(...buildSystem.artifacts);

  // ============================================================================
  // PHASE 12: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating Test Suite');

  const testSuite = await ctx.task(bootloaderTestingTask, {
    projectName,
    updateMechanism,
    secureBoot,
    rollbackProtection,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 13: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating Documentation');

  const documentation = await ctx.task(bootloaderDocumentationTask, {
    projectName,
    targetMcu,
    memoryLayout,
    updateProtocol,
    secureBoot,
    rollbackProtection,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Bootloader Implementation Complete for ${projectName}. Secure: ${secureBoot}, Update: ${updateMechanism}. Review package?`,
    title: 'Bootloader Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        targetMcu,
        updateMechanism,
        secureBoot,
        dualBank,
        rollbackProtection,
        bootloaderSize: memoryLayout.bootloaderSize
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Documentation' },
        { path: memoryLayout.linkerScriptPath, format: 'ld', label: 'Linker Script' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    targetMcu,
    bootloaderFiles: {
      startup: startupCode.files,
      flash: flashProgramming.files,
      update: updateProtocol.files,
      verification: imageVerification.files,
      launch: appLaunch.files
    },
    memoryLayout: {
      layout: memoryLayout.layout,
      bootloaderSize: memoryLayout.bootloaderSize,
      applicationSize: memoryLayout.applicationSize,
      linkerScript: memoryLayout.linkerScriptPath
    },
    updateProtocol: {
      mechanism: updateMechanism,
      protocol: updateProtocol.protocol,
      commands: updateProtocol.commands
    },
    security: {
      secureBoot,
      encryption,
      rollbackProtection,
      verificationMethod: imageVerification.method
    },
    buildSystem: {
      makefilePath: buildSystem.makefilePath,
      configPath: buildSystem.configPath
    },
    documentation: {
      readmePath: documentation.readmePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/bootloader-implementation',
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

export const bootloaderRequirementsTask = defineTask('bootloader-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Define bootloader requirements',
      context: args,
      instructions: [
        '1. Define functional requirements',
        '2. Specify size constraints',
        '3. Define update interface requirements',
        '4. Specify security requirements',
        '5. Define boot time requirements',
        '6. Specify reliability requirements',
        '7. Define recovery mechanisms',
        '8. Specify hardware dependencies',
        '9. Define testing requirements',
        '10. Document acceptance criteria'
      ],
      outputFormat: 'JSON with bootloader requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalReqs', 'securityReqs', 'artifacts'],
      properties: {
        functionalReqs: { type: 'array', items: { type: 'object' } },
        securityReqs: { type: 'array', items: { type: 'object' } },
        sizeConstraints: { type: 'object' },
        bootTimeTarget: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'requirements']
}));

export const memoryLayoutDesignTask = defineTask('memory-layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Memory Layout - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design bootloader memory layout',
      context: args,
      instructions: [
        '1. Analyze available flash and RAM',
        '2. Define bootloader region size and location',
        '3. Define application region(s)',
        '4. Allocate space for image metadata',
        '5. Define shared memory regions',
        '6. Plan for dual-bank if applicable',
        '7. Create memory map diagram',
        '8. Define vector table locations',
        '9. Create linker script',
        '10. Document memory layout'
      ],
      outputFormat: 'JSON with memory layout details'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'bootloaderSize', 'applicationSize', 'linkerScriptPath', 'artifacts'],
      properties: {
        layout: { type: 'object' },
        bootloaderSize: { type: 'string' },
        applicationSize: { type: 'string' },
        linkerScriptPath: { type: 'string' },
        regions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'memory-layout']
}));

export const bootloaderStartupTask = defineTask('bootloader-startup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Startup Code - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement bootloader startup code',
      context: args,
      instructions: [
        '1. Create minimal vector table',
        '2. Implement Reset_Handler',
        '3. Initialize stack pointer',
        '4. Initialize .data and .bss sections',
        '5. Configure clock to safe speed',
        '6. Initialize watchdog if required',
        '7. Check boot reason/flags',
        '8. Implement early hardware init',
        '9. Minimize startup time',
        '10. Add boot diagnostics'
      ],
      outputFormat: 'JSON with startup code details'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'bootSequence', 'artifacts'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        bootSequence: { type: 'array', items: { type: 'string' } },
        bootTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'startup']
}));

export const flashProgrammingTask = defineTask('flash-programming', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Flash Programming - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement flash programming routines',
      context: args,
      instructions: [
        '1. Implement flash unlock/lock',
        '2. Create flash erase functions',
        '3. Implement flash write functions',
        '4. Add flash read-back verification',
        '5. Handle flash errors',
        '6. Implement sector/page management',
        '7. Add write protection handling',
        '8. Optimize for speed',
        '9. Handle dual-bank switching',
        '10. Add flash integrity checks'
      ],
      outputFormat: 'JSON with flash programming details'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'functions', 'artifacts'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        functions: { type: 'array', items: { type: 'string' } },
        sectorSize: { type: 'string' },
        programSpeed: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'flash']
}));

export const updateProtocolTask = defineTask('update-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Update Protocol - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement firmware update protocol',
      context: args,
      instructions: [
        '1. Define protocol message format',
        '2. Implement handshake sequence',
        '3. Create data transfer commands',
        '4. Add progress reporting',
        '5. Implement error recovery',
        '6. Add timeout handling',
        '7. Support chunked transfers',
        '8. Add checksum verification',
        '9. Handle update abort',
        '10. Document protocol specification'
      ],
      outputFormat: 'JSON with update protocol details'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'commands', 'files', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        commands: { type: 'array', items: { type: 'object' } },
        files: { type: 'array', items: { type: 'string' } },
        messageFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'protocol']
}));

export const imageVerificationTask = defineTask('image-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Image Verification - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement firmware image verification',
      context: args,
      instructions: [
        '1. Define image header format',
        '2. Implement CRC32 verification',
        '3. Add SHA256 hash verification',
        '4. Create image signature check (if secure)',
        '5. Verify image size and boundaries',
        '6. Check version compatibility',
        '7. Validate hardware compatibility',
        '8. Add magic number validation',
        '9. Implement integrity check API',
        '10. Document verification process'
      ],
      outputFormat: 'JSON with verification details'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'headerFormat', 'files', 'artifacts'],
      properties: {
        method: { type: 'string' },
        headerFormat: { type: 'object' },
        files: { type: 'array', items: { type: 'string' } },
        verificationSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'verification']
}));

export const secureBootImplementationTask = defineTask('secure-boot-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Secure Boot - ${args.projectName}`,
  agent: {
    name: 'embedded-security-expert',
    prompt: {
      role: 'Embedded Security Engineer',
      task: 'Implement secure boot chain of trust',
      context: args,
      instructions: [
        '1. Design chain of trust',
        '2. Implement public key storage',
        '3. Add digital signature verification (ECDSA/RSA)',
        '4. Implement secure key provisioning',
        '5. Add anti-rollback counters',
        '6. Implement secure debug protection',
        '7. Add tamper detection',
        '8. Protect bootloader from modification',
        '9. Implement secure boot failure handling',
        '10. Document security architecture'
      ],
      outputFormat: 'JSON with secure boot details'
    },
    outputSchema: {
      type: 'object',
      required: ['chainOfTrust', 'signatureAlgorithm', 'files', 'artifacts'],
      properties: {
        chainOfTrust: { type: 'array', items: { type: 'string' } },
        signatureAlgorithm: { type: 'string' },
        keyStorage: { type: 'object' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'secure-boot']
}));

export const applicationLaunchTask = defineTask('application-launch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Application Launch - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement application launch sequence',
      context: args,
      instructions: [
        '1. Disable all interrupts',
        '2. Reset peripheral states',
        '3. Set stack pointer from app vector table',
        '4. Relocate vector table to app location',
        '5. Clear bootloader RAM if needed',
        '6. Pass boot parameters to app',
        '7. Jump to application reset handler',
        '8. Handle launch failures',
        '9. Add launch timeout',
        '10. Document launch sequence'
      ],
      outputFormat: 'JSON with launch details'
    },
    outputSchema: {
      type: 'object',
      required: ['launchSequence', 'files', 'artifacts'],
      properties: {
        launchSequence: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string' } },
        bootParameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'launch']
}));

export const rollbackProtectionTask = defineTask('rollback-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Rollback Protection - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement rollback and recovery protection',
      context: args,
      instructions: [
        '1. Define rollback strategy',
        '2. Implement version number tracking',
        '3. Create backup image management',
        '4. Add boot counter/attempt tracking',
        '5. Implement automatic recovery',
        '6. Handle partial update failures',
        '7. Add factory reset capability',
        '8. Create golden image support',
        '9. Implement A/B partition scheme',
        '10. Document recovery procedures'
      ],
      outputFormat: 'JSON with rollback protection details'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'recoveryMechanisms', 'files', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        recoveryMechanisms: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string' } },
        maxAttempts: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'rollback']
}));

export const bootloaderErrorHandlingTask = defineTask('bootloader-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Error Handling - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement bootloader error handling',
      context: args,
      instructions: [
        '1. Define error codes and categories',
        '2. Implement fault handlers',
        '3. Add error logging to non-volatile memory',
        '4. Create watchdog recovery',
        '5. Implement safe mode boot',
        '6. Add LED/GPIO error indication',
        '7. Handle critical failures',
        '8. Add diagnostic output',
        '9. Implement self-test on errors',
        '10. Document error handling'
      ],
      outputFormat: 'JSON with error handling details'
    },
    outputSchema: {
      type: 'object',
      required: ['errorCodes', 'recoveryActions', 'files', 'artifacts'],
      properties: {
        errorCodes: { type: 'array', items: { type: 'object' } },
        recoveryActions: { type: 'array', items: { type: 'object' } },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'error-handling']
}));

export const bootloaderBuildSystemTask = defineTask('bootloader-build-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Build System - ${args.projectName}`,
  agent: {
    name: 'bootloader-expert',
    prompt: {
      role: 'Build Engineer',
      task: 'Set up bootloader build system',
      context: args,
      instructions: [
        '1. Create Makefile/CMakeLists.txt',
        '2. Configure compiler optimization for size',
        '3. Set up linker script inclusion',
        '4. Add binary generation (hex, bin)',
        '5. Create version embedding',
        '6. Add checksum/signature generation',
        '7. Set up size reporting',
        '8. Configure debug/release builds',
        '9. Add image signing step',
        '10. Document build process'
      ],
      outputFormat: 'JSON with build system details'
    },
    outputSchema: {
      type: 'object',
      required: ['makefilePath', 'configPath', 'artifacts'],
      properties: {
        makefilePath: { type: 'string' },
        configPath: { type: 'string' },
        buildTargets: { type: 'array', items: { type: 'string' } },
        outputFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'build-system']
}));

export const bootloaderTestingTask = defineTask('bootloader-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Testing - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create bootloader test suite',
      context: args,
      instructions: [
        '1. Create unit tests for flash operations',
        '2. Test update protocol',
        '3. Test image verification',
        '4. Test error recovery',
        '5. Test rollback scenarios',
        '6. Test boundary conditions',
        '7. Create stress tests',
        '8. Test secure boot if applicable',
        '9. Create automated test scripts',
        '10. Document test procedures'
      ],
      outputFormat: 'JSON with test suite details'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testCategories', 'artifacts'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCategories: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'testing']
}));

export const bootloaderDocumentationTask = defineTask('bootloader-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create bootloader documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document memory layout',
        '3. Document update protocol',
        '4. Create integration guide',
        '5. Document security features',
        '6. Add troubleshooting guide',
        '7. Document build instructions',
        '8. Create host tool documentation',
        '9. Add API reference',
        '10. Document recovery procedures'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        protocolDocPath: { type: 'string' },
        integrationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'bootloader', 'documentation']
}));
