/**
 * @process specializations/fpga-programming/functional-simulation
 * @description Functional Simulation and Debug - Execute functional simulations to verify RTL behavior against
 * specifications. Debug failing tests using waveform analysis and signal tracing.
 * @inputs { designName: string, testbenchPath?: string, simulator?: string, debugLevel?: string, waveformFormat?: string, outputDir?: string }
 * @outputs { success: boolean, simulationResults: object, waveformFiles: array, coverageReport: object, debugReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/functional-simulation', {
 *   designName: 'pcie_controller',
 *   testbenchPath: 'tb/pcie_controller_tb.sv',
 *   simulator: 'QuestaSim',
 *   debugLevel: 'full',
 *   waveformFormat: 'fsdb'
 * });
 *
 * @references
 * - ModelSim/QuestaSim User Guide: https://eda.sw.siemens.com/en-US/ic/questa/
 * - VCS User Guide: https://www.synopsys.com/verification/simulation/vcs.html
 * - Verilator: https://www.veripool.org/verilator/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    testbenchPath = '',
    simulator = 'auto', // 'ModelSim', 'QuestaSim', 'VCS', 'Xcelium', 'Verilator', 'auto'
    debugLevel = 'standard', // 'minimal', 'standard', 'full'
    waveformFormat = 'vcd', // 'vcd', 'fsdb', 'wlf', 'shm'
    coverageEnabled = true,
    assertionsEnabled = true,
    timeout = '10ms',
    outputDir = 'simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Functional Simulation: ${designName}`);
  ctx.log('info', `Simulator: ${simulator}, Debug Level: ${debugLevel}`);

  // ============================================================================
  // PHASE 1: SIMULATION ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Simulation Environment Setup');

  const envSetup = await ctx.task(simulationEnvSetupTask, {
    designName,
    testbenchPath,
    simulator,
    debugLevel,
    waveformFormat,
    coverageEnabled,
    assertionsEnabled,
    outputDir
  });

  artifacts.push(...envSetup.artifacts);

  // ============================================================================
  // PHASE 2: COMPILATION AND ELABORATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Design Compilation and Elaboration');

  const compilation = await ctx.task(compilationTask, {
    designName,
    envSetup,
    assertionsEnabled,
    coverageEnabled,
    outputDir
  });

  artifacts.push(...compilation.artifacts);

  // ============================================================================
  // PHASE 3: DIRECTED TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Directed Test Execution');

  const directedTests = await ctx.task(directedTestExecutionTask, {
    designName,
    compilation,
    timeout,
    waveformFormat,
    outputDir
  });

  artifacts.push(...directedTests.artifacts);

  // ============================================================================
  // PHASE 4: RANDOM TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Random Test Execution');

  const randomTests = await ctx.task(randomTestExecutionTask, {
    designName,
    compilation,
    timeout,
    waveformFormat,
    outputDir
  });

  artifacts.push(...randomTests.artifacts);

  // Quality Gate: Test results review
  const totalTests = directedTests.testCount + randomTests.testCount;
  const passedTests = directedTests.passedCount + randomTests.passedCount;
  const failedTests = directedTests.failedCount + randomTests.failedCount;

  if (failedTests > 0) {
    await ctx.breakpoint({
      question: `Simulation found ${failedTests} failing tests out of ${totalTests}. Proceed with debug analysis?`,
      title: 'Test Failures Detected',
      context: {
        runId: ctx.runId,
        designName,
        totalTests,
        passedTests,
        failedTests,
        failedTestNames: [...directedTests.failedTests, ...randomTests.failedTests],
        files: [...directedTests.artifacts, ...randomTests.artifacts].map(a => ({ path: a.path, format: a.format || 'txt' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: WAVEFORM CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Waveform Capture and Analysis');

  const waveformCapture = await ctx.task(waveformCaptureTask, {
    designName,
    directedTests,
    randomTests,
    waveformFormat,
    debugLevel,
    outputDir
  });

  artifacts.push(...waveformCapture.artifacts);

  // ============================================================================
  // PHASE 6: DEBUG ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Debug Analysis');

  const debugAnalysis = await ctx.task(debugAnalysisTask, {
    designName,
    directedTests,
    randomTests,
    waveformCapture,
    debugLevel,
    outputDir
  });

  artifacts.push(...debugAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: COVERAGE COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Coverage Collection and Analysis');

  const coverageCollection = await ctx.task(coverageCollectionTask, {
    designName,
    directedTests,
    randomTests,
    coverageEnabled,
    outputDir
  });

  artifacts.push(...coverageCollection.artifacts);

  // ============================================================================
  // PHASE 8: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Root Cause Analysis for Failures');

  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    designName,
    directedTests,
    randomTests,
    debugAnalysis,
    waveformCapture,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: SIMULATION REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Simulation Report Generation');

  const simulationReport = await ctx.task(simulationReportTask, {
    designName,
    directedTests,
    randomTests,
    coverageCollection,
    debugAnalysis,
    rootCauseAnalysis,
    outputDir
  });

  artifacts.push(...simulationReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Functional Simulation Complete for ${designName}. ${passedTests}/${totalTests} tests passed. Coverage: ${coverageCollection.overallCoverage}%. Review simulation report?`,
    title: 'Simulation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        designName,
        totalTests,
        passedTests,
        failedTests,
        overallCoverage: coverageCollection.overallCoverage,
        rootCauses: rootCauseAnalysis.rootCauseCount
      },
      files: [
        { path: simulationReport.reportPath, format: 'markdown', label: 'Simulation Report' },
        { path: coverageCollection.coverageReportPath, format: 'html', label: 'Coverage Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: failedTests === 0,
    designName,
    simulationResults: {
      totalTests,
      passedTests,
      failedTests,
      passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    },
    waveformFiles: waveformCapture.waveformFiles,
    coverageReport: {
      overallCoverage: coverageCollection.overallCoverage,
      lineCoverage: coverageCollection.lineCoverage,
      branchCoverage: coverageCollection.branchCoverage,
      functionalCoverage: coverageCollection.functionalCoverage,
      reportPath: coverageCollection.coverageReportPath
    },
    debugReport: {
      rootCauses: rootCauseAnalysis.rootCauses,
      recommendations: rootCauseAnalysis.recommendations,
      debugNotesPath: debugAnalysis.debugNotesPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/functional-simulation',
      timestamp: startTime,
      designName,
      simulator,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const simulationEnvSetupTask = defineTask('simulation-env-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Environment Setup - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Set up simulation environment',
      context: args,
      instructions: [
        '1. Select appropriate simulator',
        '2. Create project/library structure',
        '3. Configure simulation options',
        '4. Set up waveform dumping',
        '5. Configure coverage options',
        '6. Set up assertion controls',
        '7. Create compile scripts',
        '8. Create run scripts',
        '9. Configure debug options',
        '10. Document environment setup'
      ],
      outputFormat: 'JSON with environment setup'
    },
    outputSchema: {
      type: 'object',
      required: ['simulatorUsed', 'projectPath', 'artifacts'],
      properties: {
        simulatorUsed: { type: 'string' },
        projectPath: { type: 'string' },
        compileScript: { type: 'string' },
        runScript: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'setup']
}));

export const compilationTask = defineTask('compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compilation - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Compile design and testbench',
      context: args,
      instructions: [
        '1. Compile design files',
        '2. Compile testbench files',
        '3. Compile packages and libraries',
        '4. Run lint checks',
        '5. Check for syntax errors',
        '6. Check for semantic errors',
        '7. Elaborate top module',
        '8. Resolve warnings',
        '9. Generate compilation log',
        '10. Verify successful build'
      ],
      outputFormat: 'JSON with compilation results'
    },
    outputSchema: {
      type: 'object',
      required: ['compilationSuccess', 'artifacts'],
      properties: {
        compilationSuccess: { type: 'boolean' },
        warningCount: { type: 'number' },
        errorCount: { type: 'number' },
        compilationLog: { type: 'string' },
        elaboratedDesign: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'compilation']
}));

export const directedTestExecutionTask = defineTask('directed-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Directed Tests - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Execute directed test cases',
      context: args,
      instructions: [
        '1. Identify directed tests',
        '2. Run each test case',
        '3. Capture pass/fail status',
        '4. Log assertion results',
        '5. Capture waveforms for failures',
        '6. Record simulation time',
        '7. Collect test metrics',
        '8. Document test results',
        '9. Generate test log',
        '10. Summarize directed test results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'directed-tests']
}));

export const randomTestExecutionTask = defineTask('random-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Random Tests - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Execute random test cases',
      context: args,
      instructions: [
        '1. Configure random seeds',
        '2. Run constrained random tests',
        '3. Monitor coverage progress',
        '4. Capture failures',
        '5. Log random seeds for failures',
        '6. Adjust constraints if needed',
        '7. Run until coverage goals met',
        '8. Document random test strategy',
        '9. Generate test log',
        '10. Summarize random test results'
      ],
      outputFormat: 'JSON with random test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'string' } },
        seedsUsed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'random-tests']
}));

export const waveformCaptureTask = defineTask('waveform-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Waveform Capture - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Capture and organize waveforms',
      context: args,
      instructions: [
        '1. Capture key signal waveforms',
        '2. Focus on failing test waveforms',
        '3. Add signal groups',
        '4. Configure radix display',
        '5. Add cursors and markers',
        '6. Create waveform views',
        '7. Export waveform files',
        '8. Document signal meanings',
        '9. Organize waveform library',
        '10. Create debug views'
      ],
      outputFormat: 'JSON with waveform details'
    },
    outputSchema: {
      type: 'object',
      required: ['waveformFiles', 'artifacts'],
      properties: {
        waveformFiles: { type: 'array', items: { type: 'string' } },
        signalGroups: { type: 'array', items: { type: 'object' } },
        debugViews: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'waveforms']
}));

export const debugAnalysisTask = defineTask('debug-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Debug Analysis - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Analyze simulation debug information',
      context: args,
      instructions: [
        '1. Analyze failing test waveforms',
        '2. Trace signal propagation',
        '3. Identify failure points',
        '4. Check assertion messages',
        '5. Analyze scoreboard mismatches',
        '6. Review timing relationships',
        '7. Check reset behavior',
        '8. Analyze state machine transitions',
        '9. Document findings',
        '10. Create debug notes'
      ],
      outputFormat: 'JSON with debug analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['debugNotesPath', 'findings', 'artifacts'],
      properties: {
        debugNotesPath: { type: 'string' },
        findings: { type: 'array', items: { type: 'object' } },
        failurePoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'debug']
}));

export const coverageCollectionTask = defineTask('coverage-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Coverage Collection - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Collect and analyze coverage',
      context: args,
      instructions: [
        '1. Merge coverage databases',
        '2. Calculate code coverage',
        '3. Calculate functional coverage',
        '4. Identify coverage holes',
        '5. Analyze uncovered scenarios',
        '6. Generate coverage report',
        '7. Create coverage trends',
        '8. Recommend additional tests',
        '9. Document coverage analysis',
        '10. Export coverage data'
      ],
      outputFormat: 'JSON with coverage results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCoverage', 'coverageReportPath', 'artifacts'],
      properties: {
        overallCoverage: { type: 'string' },
        lineCoverage: { type: 'string' },
        branchCoverage: { type: 'string' },
        functionalCoverage: { type: 'string' },
        coverageHoles: { type: 'array', items: { type: 'object' } },
        coverageReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'coverage']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Root Cause Analysis - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Perform root cause analysis',
      context: args,
      instructions: [
        '1. Categorize failures',
        '2. Identify root causes',
        '3. Distinguish RTL vs TB bugs',
        '4. Document failure patterns',
        '5. Suggest fixes',
        '6. Prioritize issues',
        '7. Create bug reports',
        '8. Link to waveforms',
        '9. Recommend verification improvements',
        '10. Create RCA report'
      ],
      outputFormat: 'JSON with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauseCount', 'rootCauses', 'recommendations', 'artifacts'],
      properties: {
        rootCauseCount: { type: 'number' },
        rootCauses: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        bugReports: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'rca']
}));

export const simulationReportTask = defineTask('simulation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Simulation Report - ${args.designName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate simulation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document test results',
        '3. Include coverage summary',
        '4. Document failures and root causes',
        '5. Include waveform references',
        '6. Add recommendations',
        '7. Create appendices',
        '8. Include methodology notes',
        '9. Add sign-off checklist',
        '10. Generate final report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'simulation', 'report']
}));
