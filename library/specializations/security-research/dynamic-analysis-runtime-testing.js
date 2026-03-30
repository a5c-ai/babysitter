/**
 * @process specializations/security-research/dynamic-analysis-runtime-testing
 * @description Security testing of running applications through debugging, instrumentation, and interactive
 * testing to discover vulnerabilities that manifest at runtime including memory corruption, race conditions,
 * and input validation issues.
 * @inputs { projectName: string, targetApplication: string, testEnvironment?: object, sanitizers?: array }
 * @outputs { success: boolean, vulnerabilities: array, runtimeReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/dynamic-analysis-runtime-testing', {
 *   projectName: 'Runtime Security Analysis',
 *   targetApplication: '/path/to/application',
 *   testEnvironment: { os: 'linux', arch: 'x64' },
 *   sanitizers: ['asan', 'msan', 'ubsan']
 * });
 *
 * @references
 * - AddressSanitizer: https://clang.llvm.org/docs/AddressSanitizer.html
 * - DynamoRIO: https://dynamorio.org/
 * - Frida: https://frida.re/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    testEnvironment = { os: 'linux', arch: 'x64' },
    sanitizers = ['asan', 'msan', 'ubsan'],
    instrumentationTools = ['frida', 'dynamorio'],
    outputDir = 'dynamic-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Dynamic Analysis for ${projectName}`);
  ctx.log('info', `Sanitizers: ${sanitizers.join(', ')}`);

  // ============================================================================
  // PHASE 1: ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up instrumented test environment');

  const envSetup = await ctx.task(environmentSetupTask, {
    projectName,
    targetApplication,
    testEnvironment,
    sanitizers,
    outputDir
  });

  artifacts.push(...envSetup.artifacts);

  // ============================================================================
  // PHASE 2: SANITIZER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running with memory and undefined behavior sanitizers');

  const sanitizerAnalysis = await ctx.task(sanitizerAnalysisTask, {
    projectName,
    targetApplication,
    sanitizers,
    envSetup,
    outputDir
  });

  vulnerabilities.push(...sanitizerAnalysis.vulnerabilities);
  artifacts.push(...sanitizerAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: DEBUGGING AND TRACING
  // ============================================================================

  ctx.log('info', 'Phase 3: Debugging and tracing execution paths');

  const debuggingAnalysis = await ctx.task(debuggingAnalysisTask, {
    projectName,
    targetApplication,
    envSetup,
    outputDir
  });

  vulnerabilities.push(...debuggingAnalysis.vulnerabilities);
  artifacts.push(...debuggingAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: MEMORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Monitoring memory operations');

  const memoryAnalysis = await ctx.task(memoryAnalysisTask, {
    projectName,
    targetApplication,
    envSetup,
    outputDir
  });

  vulnerabilities.push(...memoryAnalysis.vulnerabilities);
  artifacts.push(...memoryAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: RACE CONDITION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying race conditions');

  const raceConditionAnalysis = await ctx.task(raceConditionAnalysisTask, {
    projectName,
    targetApplication,
    envSetup,
    outputDir
  });

  vulnerabilities.push(...raceConditionAnalysis.vulnerabilities);
  artifacts.push(...raceConditionAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: INPUT BOUNDARY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing input validation at boundaries');

  const boundaryTesting = await ctx.task(boundaryTestingTask, {
    projectName,
    targetApplication,
    envSetup,
    outputDir
  });

  vulnerabilities.push(...boundaryTesting.vulnerabilities);
  artifacts.push(...boundaryTesting.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating dynamic analysis report');

  const report = await ctx.task(dynamicReportTask, {
    projectName,
    vulnerabilities,
    analysisResults: {
      sanitizerAnalysis,
      debuggingAnalysis,
      memoryAnalysis,
      raceConditionAnalysis,
      boundaryTesting
    },
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Dynamic analysis complete for ${projectName}. Found ${vulnerabilities.length} runtime vulnerabilities. Review findings?`,
    title: 'Dynamic Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: report.summary,
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    runtimeReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/dynamic-analysis-runtime-testing',
      timestamp: startTime,
      sanitizers,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const environmentSetupTask = defineTask('environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Test Environment - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Test Environment Engineer',
      task: 'Set up instrumented test environment for dynamic analysis',
      context: args,
      instructions: [
        '1. Configure isolated test environment',
        '2. Build application with sanitizer support',
        '3. Enable ASAN, MSAN, UBSAN as specified',
        '4. Configure debugging symbols',
        '5. Set up instrumentation frameworks (Frida, DynamoRIO)',
        '6. Configure memory profiling tools',
        '7. Set up logging and monitoring',
        '8. Verify environment readiness'
      ],
      outputFormat: 'JSON with environment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentReady', 'configuration', 'artifacts'],
      properties: {
        environmentReady: { type: 'boolean' },
        configuration: { type: 'object' },
        sanitizersEnabled: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'dynamic-analysis', 'setup']
}));

export const sanitizerAnalysisTask = defineTask('sanitizer-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Sanitizer Analysis - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Memory Safety Analyst',
      task: 'Execute application with sanitizers and analyze findings',
      context: args,
      instructions: [
        '1. Run application with AddressSanitizer (ASAN)',
        '2. Detect buffer overflows and use-after-free',
        '3. Run with MemorySanitizer (MSAN)',
        '4. Detect uninitialized memory reads',
        '5. Run with UndefinedBehaviorSanitizer (UBSAN)',
        '6. Detect integer overflows and undefined behavior',
        '7. Collect and analyze sanitizer reports',
        '8. Document all findings with stack traces'
      ],
      outputFormat: 'JSON with sanitizer findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'sanitizerReports', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        sanitizerReports: { type: 'object' },
        issuesFound: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'sanitizers']
}));

export const debuggingAnalysisTask = defineTask('debugging-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug and Trace - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Debugging and Tracing Specialist',
      task: 'Debug and trace execution paths for security analysis',
      context: args,
      instructions: [
        '1. Set up debugging with GDB/LLDB',
        '2. Trace execution of security-critical functions',
        '3. Monitor system calls with strace/dtrace',
        '4. Analyze control flow during execution',
        '5. Identify unexpected code paths',
        '6. Monitor file and network operations',
        '7. Trace privilege operations',
        '8. Document execution anomalies'
      ],
      outputFormat: 'JSON with debugging findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'executionTraces', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        executionTraces: { type: 'array' },
        anomaliesFound: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'debugging']
}));

export const memoryAnalysisTask = defineTask('memory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Memory Operations - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Memory Security Analyst',
      task: 'Monitor and analyze memory operations for vulnerabilities',
      context: args,
      instructions: [
        '1. Monitor heap allocations and deallocations',
        '2. Detect memory leaks',
        '3. Identify double-free conditions',
        '4. Detect use-after-free patterns',
        '5. Monitor stack operations',
        '6. Identify buffer boundary violations',
        '7. Analyze heap corruption patterns',
        '8. Document memory safety issues'
      ],
      outputFormat: 'JSON with memory analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'memoryIssues', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        memoryIssues: { type: 'array' },
        leaksDetected: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'memory-analysis']
}));

export const raceConditionAnalysisTask = defineTask('race-condition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detect Race Conditions - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Concurrency Security Analyst',
      task: 'Identify race conditions and concurrency vulnerabilities',
      context: args,
      instructions: [
        '1. Run with ThreadSanitizer (TSAN)',
        '2. Identify data races',
        '3. Detect lock ordering issues',
        '4. Find TOCTOU vulnerabilities',
        '5. Analyze thread synchronization',
        '6. Test concurrent access patterns',
        '7. Identify atomicity violations',
        '8. Document race condition findings'
      ],
      outputFormat: 'JSON with race condition findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'raceConditions', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        raceConditions: { type: 'array' },
        dataRaces: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'race-conditions']
}));

export const boundaryTestingTask = defineTask('boundary-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Input Boundaries - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Input Boundary Testing Specialist',
      task: 'Test input validation at boundary conditions',
      context: args,
      instructions: [
        '1. Identify all input interfaces',
        '2. Test boundary values (min, max, overflow)',
        '3. Test malformed inputs',
        '4. Test encoding edge cases',
        '5. Monitor application behavior at boundaries',
        '6. Identify input validation bypasses',
        '7. Test error handling paths',
        '8. Document boundary violations'
      ],
      outputFormat: 'JSON with boundary testing findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'boundaryIssues', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        boundaryIssues: { type: 'array' },
        inputsTested: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'boundary-testing']
}));

export const dynamicReportTask = defineTask('dynamic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Dynamic Analysis Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Report Specialist',
      task: 'Generate comprehensive dynamic analysis report',
      context: args,
      instructions: [
        '1. Consolidate all dynamic analysis findings',
        '2. Deduplicate and prioritize vulnerabilities',
        '3. Create executive summary',
        '4. Document each vulnerability with details',
        '5. Include reproduction steps',
        '6. Provide remediation recommendations',
        '7. Generate metrics and statistics',
        '8. Format as professional report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'bySeverity', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        bySeverity: { type: 'object' },
        totalVulnerabilities: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reporting']
}));
