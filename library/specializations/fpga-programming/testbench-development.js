/**
 * @process specializations/fpga-programming/testbench-development
 * @description Testbench Development - Create comprehensive testbenches for RTL verification including stimulus
 * generation, response checking, and coverage collection. Use SystemVerilog verification features or VHDL testbench
 * patterns.
 * @inputs { dutName: string, dutInterfaces: array, language?: string, verificationLevel?: string, coverageGoals?: object, outputDir?: string }
 * @outputs { success: boolean, testbenchFiles: object, coverageReport: object, testPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/testbench-development', {
 *   dutName: 'axi_dma_controller',
 *   dutInterfaces: ['axi4_lite_if', 'axi4_mm_if', 'interrupt'],
 *   language: 'SystemVerilog',
 *   verificationLevel: 'comprehensive',
 *   coverageGoals: { functional: 90, code: 85 }
 * });
 *
 * @references
 * - SystemVerilog for Verification: https://verificationacademy.com/
 * - Writing Testbenches: https://www.veripool.org/verilator/
 * - VHDL Verification: https://vunit.github.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dutName,
    dutInterfaces,
    language = 'SystemVerilog',
    verificationLevel = 'standard', // 'basic', 'standard', 'comprehensive'
    coverageGoals = { functional: 80, code: 80 },
    clockPeriod = '10ns',
    resetDuration = '100ns',
    randomSeed = 'auto',
    outputDir = 'testbench-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Testbench Development for: ${dutName}`);
  ctx.log('info', `Language: ${language}, Level: ${verificationLevel}`);

  // ============================================================================
  // PHASE 1: VERIFICATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Verification Planning');

  const verificationPlan = await ctx.task(verificationPlanningTask, {
    dutName,
    dutInterfaces,
    verificationLevel,
    coverageGoals,
    outputDir
  });

  artifacts.push(...verificationPlan.artifacts);

  // ============================================================================
  // PHASE 2: TESTBENCH ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Testbench Architecture Design');

  const tbArchitecture = await ctx.task(testbenchArchitectureTask, {
    dutName,
    dutInterfaces,
    language,
    verificationLevel,
    verificationPlan,
    outputDir
  });

  artifacts.push(...tbArchitecture.artifacts);

  // Quality Gate: Architecture review
  await ctx.breakpoint({
    question: `Testbench architecture defined for ${dutName}. Components: ${tbArchitecture.componentCount}. Review testbench structure?`,
    title: 'Testbench Architecture Review',
    context: {
      runId: ctx.runId,
      dutName,
      components: tbArchitecture.components,
      files: tbArchitecture.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: STIMULUS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Stimulus Generator Development');

  const stimulusGen = await ctx.task(stimulusGeneratorTask, {
    dutName,
    dutInterfaces,
    language,
    verificationPlan,
    tbArchitecture,
    randomSeed,
    outputDir
  });

  artifacts.push(...stimulusGen.artifacts);

  // ============================================================================
  // PHASE 4: DRIVER DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Driver Development');

  const drivers = await ctx.task(driverDevelopmentTask, {
    dutName,
    dutInterfaces,
    language,
    tbArchitecture,
    outputDir
  });

  artifacts.push(...drivers.artifacts);

  // ============================================================================
  // PHASE 5: MONITOR DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Monitor Development');

  const monitors = await ctx.task(monitorDevelopmentTask, {
    dutName,
    dutInterfaces,
    language,
    tbArchitecture,
    outputDir
  });

  artifacts.push(...monitors.artifacts);

  // ============================================================================
  // PHASE 6: SCOREBOARD DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Scoreboard and Checker Development');

  const scoreboard = await ctx.task(scoreboardDevelopmentTask, {
    dutName,
    language,
    verificationPlan,
    tbArchitecture,
    outputDir
  });

  artifacts.push(...scoreboard.artifacts);

  // ============================================================================
  // PHASE 7: COVERAGE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Coverage Implementation');

  const coverage = await ctx.task(coverageImplementationTask, {
    dutName,
    language,
    coverageGoals,
    verificationPlan,
    tbArchitecture,
    outputDir
  });

  artifacts.push(...coverage.artifacts);

  // ============================================================================
  // PHASE 8: TEST CASE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Test Case Development');

  const testCases = await ctx.task(testCaseDevelopmentTask, {
    dutName,
    language,
    verificationPlan,
    stimulusGen,
    clockPeriod,
    resetDuration,
    outputDir
  });

  artifacts.push(...testCases.artifacts);

  // ============================================================================
  // PHASE 9: TESTBENCH INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Testbench Integration');

  const integration = await ctx.task(testbenchIntegrationTask, {
    dutName,
    language,
    tbArchitecture,
    drivers,
    monitors,
    scoreboard,
    coverage,
    testCases,
    clockPeriod,
    resetDuration,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 10: SELF-CHECKING MECHANISMS
  // ============================================================================

  ctx.log('info', 'Phase 10: Self-Checking Mechanism Implementation');

  const selfChecking = await ctx.task(selfCheckingTask, {
    dutName,
    language,
    scoreboard,
    integration,
    outputDir
  });

  artifacts.push(...selfChecking.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Testbench Development Complete for ${dutName}. ${testCases.testCount} tests, Coverage targets: Func ${coverageGoals.functional}%, Code ${coverageGoals.code}%. Review testbench package?`,
    title: 'Testbench Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        dutName,
        language,
        verificationLevel,
        componentCount: tbArchitecture.componentCount,
        testCount: testCases.testCount,
        coverageGoals
      },
      files: [
        { path: integration.topFilePath, format: 'sv', label: 'Testbench Top' },
        { path: verificationPlan.planPath, format: 'markdown', label: 'Verification Plan' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dutName,
    testbenchFiles: {
      top: integration.topFilePath,
      drivers: drivers.driverFiles,
      monitors: monitors.monitorFiles,
      scoreboard: scoreboard.scoreboardFile,
      coverage: coverage.coverageFile,
      tests: testCases.testFiles
    },
    coverageReport: {
      functionalCoverageTarget: coverageGoals.functional,
      codeCoverageTarget: coverageGoals.code,
      coveragePoints: coverage.coveragePointCount
    },
    testPlan: {
      path: verificationPlan.planPath,
      testCount: testCases.testCount,
      scenarios: verificationPlan.scenarios
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/testbench-development',
      timestamp: startTime,
      dutName,
      language,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const verificationPlanningTask = defineTask('verification-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Verification Planning - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Create verification plan',
      context: args,
      instructions: [
        '1. Identify verification objectives',
        '2. Define test scenarios',
        '3. Specify coverage goals',
        '4. Identify corner cases',
        '5. Define pass/fail criteria',
        '6. Plan regression strategy',
        '7. Identify risks',
        '8. Define milestones',
        '9. Create feature checklist',
        '10. Document verification plan'
      ],
      outputFormat: 'JSON with verification plan'
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'scenarios', 'artifacts'],
      properties: {
        planPath: { type: 'string' },
        scenarios: { type: 'array', items: { type: 'object' } },
        coverageGoals: { type: 'object' },
        cornerCases: { type: 'array', items: { type: 'string' } },
        milestones: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'planning']
}));

export const testbenchArchitectureTask = defineTask('testbench-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Testbench Architecture - ${args.dutName}`,
  agent: {
    name: 'verification-architect',
    prompt: {
      role: 'Verification Architect',
      task: 'Design testbench architecture',
      context: args,
      instructions: [
        '1. Define testbench hierarchy',
        '2. Identify components needed',
        '3. Design stimulus-driver-monitor structure',
        '4. Plan scoreboard architecture',
        '5. Design coverage collection',
        '6. Define configuration objects',
        '7. Plan virtual interfaces',
        '8. Design environment class',
        '9. Create architecture diagram',
        '10. Document component interactions'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['componentCount', 'components', 'artifacts'],
      properties: {
        componentCount: { type: 'number' },
        components: { type: 'array', items: { type: 'object' } },
        hierarchy: { type: 'object' },
        virtualInterfaces: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'architecture']
}));

export const stimulusGeneratorTask = defineTask('stimulus-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Stimulus Generator - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop stimulus generators',
      context: args,
      instructions: [
        '1. Create transaction classes',
        '2. Implement randomization',
        '3. Define constraints',
        '4. Create sequence library',
        '5. Implement directed sequences',
        '6. Create random sequences',
        '7. Design sequence layering',
        '8. Add stimulus timing',
        '9. Document sequences',
        '10. Create usage examples'
      ],
      outputFormat: 'JSON with stimulus details'
    },
    outputSchema: {
      type: 'object',
      required: ['stimulusFiles', 'sequences', 'artifacts'],
      properties: {
        stimulusFiles: { type: 'array', items: { type: 'string' } },
        sequences: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'stimulus']
}));

export const driverDevelopmentTask = defineTask('driver-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Driver Development - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop interface drivers',
      context: args,
      instructions: [
        '1. Create driver classes per interface',
        '2. Implement protocol handling',
        '3. Add timing control',
        '4. Handle backpressure',
        '5. Implement pipelining',
        '6. Add error injection',
        '7. Create driver callbacks',
        '8. Handle reset behavior',
        '9. Document driver usage',
        '10. Create debug features'
      ],
      outputFormat: 'JSON with driver details'
    },
    outputSchema: {
      type: 'object',
      required: ['driverFiles', 'driverCount', 'artifacts'],
      properties: {
        driverFiles: { type: 'array', items: { type: 'string' } },
        driverCount: { type: 'number' },
        protocols: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'driver']
}));

export const monitorDevelopmentTask = defineTask('monitor-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Monitor Development - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop interface monitors',
      context: args,
      instructions: [
        '1. Create monitor classes per interface',
        '2. Implement passive observation',
        '3. Collect transactions',
        '4. Add protocol checking',
        '5. Generate coverage events',
        '6. Handle reset properly',
        '7. Create analysis ports',
        '8. Add assertion checking',
        '9. Document monitor behavior',
        '10. Create debug features'
      ],
      outputFormat: 'JSON with monitor details'
    },
    outputSchema: {
      type: 'object',
      required: ['monitorFiles', 'monitorCount', 'artifacts'],
      properties: {
        monitorFiles: { type: 'array', items: { type: 'string' } },
        monitorCount: { type: 'number' },
        analysisPorts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'monitor']
}));

export const scoreboardDevelopmentTask = defineTask('scoreboard-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Scoreboard Development - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop scoreboard and checkers',
      context: args,
      instructions: [
        '1. Create scoreboard class',
        '2. Implement reference model',
        '3. Add comparison logic',
        '4. Handle out-of-order completion',
        '5. Implement queuing',
        '6. Add error reporting',
        '7. Create statistics collection',
        '8. Handle timeout detection',
        '9. Document checking rules',
        '10. Add debug features'
      ],
      outputFormat: 'JSON with scoreboard details'
    },
    outputSchema: {
      type: 'object',
      required: ['scoreboardFile', 'artifacts'],
      properties: {
        scoreboardFile: { type: 'string' },
        referenceModelFile: { type: 'string' },
        checkingRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'scoreboard']
}));

export const coverageImplementationTask = defineTask('coverage-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Coverage Implementation - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Implement coverage collection',
      context: args,
      instructions: [
        '1. Define covergroups',
        '2. Create coverpoints',
        '3. Define cross coverage',
        '4. Add transition coverage',
        '5. Implement functional coverage',
        '6. Add assertion coverage',
        '7. Create coverage callbacks',
        '8. Define coverage goals',
        '9. Document coverage model',
        '10. Create coverage report'
      ],
      outputFormat: 'JSON with coverage details'
    },
    outputSchema: {
      type: 'object',
      required: ['coverageFile', 'coveragePointCount', 'artifacts'],
      properties: {
        coverageFile: { type: 'string' },
        coveragePointCount: { type: 'number' },
        covergroups: { type: 'array', items: { type: 'object' } },
        crossCoverage: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'coverage']
}));

export const testCaseDevelopmentTask = defineTask('test-case-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Test Case Development - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop test cases',
      context: args,
      instructions: [
        '1. Create test base class',
        '2. Implement directed tests',
        '3. Implement random tests',
        '4. Create corner case tests',
        '5. Implement stress tests',
        '6. Add error injection tests',
        '7. Create regression suite',
        '8. Define test configuration',
        '9. Document test descriptions',
        '10. Create test list'
      ],
      outputFormat: 'JSON with test details'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testCount', 'artifacts'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        testCategories: { type: 'array', items: { type: 'string' } },
        regressionList: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'tests']
}));

export const testbenchIntegrationTask = defineTask('testbench-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Testbench Integration - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Integrate testbench components',
      context: args,
      instructions: [
        '1. Create testbench top module',
        '2. Instantiate DUT',
        '3. Generate clocks and resets',
        '4. Connect virtual interfaces',
        '5. Instantiate environment',
        '6. Configure environment',
        '7. Start test execution',
        '8. Add simulation control',
        '9. Create run scripts',
        '10. Document usage'
      ],
      outputFormat: 'JSON with integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['topFilePath', 'artifacts'],
      properties: {
        topFilePath: { type: 'string' },
        environmentFile: { type: 'string' },
        runScripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'integration']
}));

export const selfCheckingTask = defineTask('self-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Self-Checking - ${args.dutName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Implement self-checking mechanisms',
      context: args,
      instructions: [
        '1. Add automatic result checking',
        '2. Implement error counting',
        '3. Add pass/fail determination',
        '4. Create error logging',
        '5. Implement timeout handling',
        '6. Add assertion-based checking',
        '7. Create summary reporting',
        '8. Handle simulation end',
        '9. Document checking flow',
        '10. Create debug aids'
      ],
      outputFormat: 'JSON with self-checking details'
    },
    outputSchema: {
      type: 'object',
      required: ['checkingMechanisms', 'artifacts'],
      properties: {
        checkingMechanisms: { type: 'array', items: { type: 'object' } },
        errorHandling: { type: 'object' },
        reportingFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verification', 'self-checking']
}));
