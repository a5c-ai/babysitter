/**
 * @process specializations/security-research/fuzzing-campaign
 * @description Automated vulnerability discovery through coverage-guided fuzzing. Includes target preparation,
 * harness development, corpus creation, campaign execution, and crash analysis using AFL++, libFuzzer,
 * and OSS-Fuzz methodologies.
 * @inputs { projectName: string, targetBinary: string, fuzzingEngine?: string, seedCorpus?: string }
 * @outputs { success: boolean, crashes: array, uniqueVulnerabilities: array, coverageMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/fuzzing-campaign', {
 *   projectName: 'Parser Fuzzing Campaign',
 *   targetBinary: '/path/to/target',
 *   fuzzingEngine: 'afl++',
 *   seedCorpus: '/path/to/seeds'
 * });
 *
 * @references
 * - AFL++: https://aflplus.plus/
 * - libFuzzer: https://llvm.org/docs/LibFuzzer.html
 * - OSS-Fuzz: https://github.com/google/oss-fuzz
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetBinary,
    fuzzingEngine = 'afl++',
    seedCorpus = null,
    fuzzingDuration = '24h',
    sanitizers = ['asan', 'ubsan'],
    outputDir = 'fuzzing-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const crashes = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Fuzzing Campaign for ${projectName}`);
  ctx.log('info', `Engine: ${fuzzingEngine}, Duration: ${fuzzingDuration}`);

  // ============================================================================
  // PHASE 1: TARGET IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying fuzzing targets');

  const targetIdentification = await ctx.task(targetIdentificationTask, {
    projectName,
    targetBinary,
    outputDir
  });

  artifacts.push(...targetIdentification.artifacts);

  // ============================================================================
  // PHASE 2: BUILD INSTRUMENTED BINARIES
  // ============================================================================

  ctx.log('info', 'Phase 2: Building instrumented binaries');

  const instrumentedBuild = await ctx.task(instrumentedBuildTask, {
    projectName,
    targetBinary,
    fuzzingEngine,
    sanitizers,
    outputDir
  });

  artifacts.push(...instrumentedBuild.artifacts);

  // ============================================================================
  // PHASE 3: SEED CORPUS CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating seed corpus');

  const corpusCreation = await ctx.task(corpusCreationTask, {
    projectName,
    targetBinary,
    seedCorpus,
    targetIdentification,
    outputDir
  });

  artifacts.push(...corpusCreation.artifacts);

  // ============================================================================
  // PHASE 4: HARNESS CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring fuzzing harness');

  const harnessConfig = await ctx.task(harnessConfigTask, {
    projectName,
    targetBinary,
    fuzzingEngine,
    instrumentedBuild,
    outputDir
  });

  artifacts.push(...harnessConfig.artifacts);

  await ctx.breakpoint({
    question: `Fuzzing setup complete for ${projectName}. Corpus: ${corpusCreation.corpusSize} seeds. Ready to start campaign?`,
    title: 'Fuzzing Campaign Ready',
    context: {
      runId: ctx.runId,
      setup: {
        targets: targetIdentification.targets,
        corpusSize: corpusCreation.corpusSize,
        engine: fuzzingEngine
      },
      files: harnessConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: CAMPAIGN EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing fuzzing campaign');

  const campaignExecution = await ctx.task(campaignExecutionTask, {
    projectName,
    harnessConfig,
    corpusCreation,
    fuzzingDuration,
    fuzzingEngine,
    outputDir
  });

  crashes.push(...campaignExecution.crashes);
  artifacts.push(...campaignExecution.artifacts);

  // ============================================================================
  // PHASE 6: CRASH TRIAGE
  // ============================================================================

  ctx.log('info', 'Phase 6: Triaging and analyzing crashes');

  const crashTriage = await ctx.task(crashTriageTask, {
    projectName,
    crashes: campaignExecution.crashes,
    outputDir
  });

  artifacts.push(...crashTriage.artifacts);

  // ============================================================================
  // PHASE 7: CRASH MINIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Minimizing and deduplicating findings');

  const crashMinimization = await ctx.task(crashMinimizationTask, {
    projectName,
    crashes: crashTriage.triaged,
    fuzzingEngine,
    outputDir
  });

  vulnerabilities.push(...crashMinimization.vulnerabilities);
  artifacts.push(...crashMinimization.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating fuzzing campaign report');

  const report = await ctx.task(fuzzingReportTask, {
    projectName,
    campaignExecution,
    crashTriage,
    crashMinimization,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Fuzzing campaign complete. ${crashMinimization.uniqueVulnerabilities} unique vulnerabilities found. Review results?`,
    title: 'Fuzzing Campaign Complete',
    context: {
      runId: ctx.runId,
      results: {
        totalCrashes: campaignExecution.crashes.length,
        uniqueVulnerabilities: crashMinimization.uniqueVulnerabilities,
        coverageAchieved: campaignExecution.coverageMetrics
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    crashes: crashTriage.triaged,
    uniqueVulnerabilities: crashMinimization.vulnerabilities,
    coverageMetrics: campaignExecution.coverageMetrics,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/fuzzing-campaign',
      timestamp: startTime,
      fuzzingEngine,
      fuzzingDuration,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const targetIdentificationTask = defineTask('target-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Fuzzing Targets - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Fuzzing Target Analyst',
      task: 'Identify optimal fuzzing targets in the application',
      context: args,
      instructions: [
        '1. Analyze binary/source for fuzzing targets',
        '2. Identify parsers and protocol handlers',
        '3. Find input processing functions',
        '4. Identify attack surface areas',
        '5. Assess code complexity for fuzzing ROI',
        '6. Document function signatures',
        '7. Identify dependencies and libraries',
        '8. Prioritize targets by security impact'
      ],
      outputFormat: 'JSON with fuzzing targets'
    },
    outputSchema: {
      type: 'object',
      required: ['targets', 'prioritizedTargets', 'artifacts'],
      properties: {
        targets: { type: 'array' },
        prioritizedTargets: { type: 'array' },
        totalTargets: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'target-id']
}));

export const instrumentedBuildTask = defineTask('instrumented-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Instrumented Binary - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Fuzzing Build Engineer',
      task: 'Build instrumented binaries for fuzzing',
      context: args,
      instructions: [
        '1. Configure build for coverage instrumentation',
        '2. Enable AFL/libFuzzer instrumentation',
        '3. Compile with sanitizers (ASAN, UBSAN)',
        '4. Enable debugging symbols',
        '5. Optimize for fuzzing performance',
        '6. Verify instrumentation coverage',
        '7. Build persistent mode harness if applicable',
        '8. Document build configuration'
      ],
      outputFormat: 'JSON with build artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['buildSuccess', 'instrumentedBinary', 'artifacts'],
      properties: {
        buildSuccess: { type: 'boolean' },
        instrumentedBinary: { type: 'string' },
        sanitizersEnabled: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'build']
}));

export const corpusCreationTask = defineTask('corpus-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Seed Corpus - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Fuzzing Corpus Engineer',
      task: 'Create or enhance seed corpus for fuzzing',
      context: args,
      instructions: [
        '1. Collect valid input samples',
        '2. Minimize existing corpus',
        '3. Generate grammar-based seeds if applicable',
        '4. Create edge case inputs',
        '5. Include format-specific test cases',
        '6. Optimize corpus for coverage',
        '7. Remove redundant seeds',
        '8. Document corpus composition'
      ],
      outputFormat: 'JSON with corpus details'
    },
    outputSchema: {
      type: 'object',
      required: ['corpusPath', 'corpusSize', 'artifacts'],
      properties: {
        corpusPath: { type: 'string' },
        corpusSize: { type: 'number' },
        seedTypes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'corpus']
}));

export const harnessConfigTask = defineTask('harness-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Fuzzing Harness - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Fuzzing Harness Engineer',
      task: 'Configure fuzzing harness for optimal performance',
      context: args,
      instructions: [
        '1. Configure AFL++/libFuzzer parameters',
        '2. Set memory limits and timeouts',
        '3. Configure crash handling',
        '4. Set up parallel fuzzing if needed',
        '5. Configure mutation strategies',
        '6. Set coverage feedback options',
        '7. Configure output directories',
        '8. Document harness configuration'
      ],
      outputFormat: 'JSON with harness configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['harnessReady', 'configuration', 'artifacts'],
      properties: {
        harnessReady: { type: 'boolean' },
        configuration: { type: 'object' },
        launchCommand: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'harness']
}));

export const campaignExecutionTask = defineTask('campaign-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Fuzzing Campaign - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Fuzzing Campaign Operator',
      task: 'Execute and monitor fuzzing campaign',
      context: args,
      instructions: [
        '1. Launch fuzzing campaign',
        '2. Monitor coverage progress',
        '3. Track crash discovery rate',
        '4. Adjust parameters based on progress',
        '5. Collect crash artifacts',
        '6. Monitor resource usage',
        '7. Run for specified duration',
        '8. Document campaign statistics'
      ],
      outputFormat: 'JSON with campaign results'
    },
    outputSchema: {
      type: 'object',
      required: ['crashes', 'coverageMetrics', 'artifacts'],
      properties: {
        crashes: { type: 'array' },
        coverageMetrics: { type: 'object' },
        executions: { type: 'number' },
        executionsPerSecond: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'execution']
}));

export const crashTriageTask = defineTask('crash-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage Crashes - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Crash Triage Analyst',
      task: 'Triage and analyze fuzzing crashes',
      context: args,
      instructions: [
        '1. Collect all crash artifacts',
        '2. Reproduce each crash',
        '3. Classify crash type (ASAN, SEGV, etc.)',
        '4. Extract stack traces',
        '5. Determine crash location',
        '6. Assess exploitability',
        '7. Group similar crashes',
        '8. Prioritize by severity'
      ],
      outputFormat: 'JSON with triaged crashes'
    },
    outputSchema: {
      type: 'object',
      required: ['triaged', 'byCrashType', 'artifacts'],
      properties: {
        triaged: { type: 'array' },
        byCrashType: { type: 'object' },
        totalCrashes: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'triage']
}));

export const crashMinimizationTask = defineTask('crash-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Minimize Crashes - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Crash Minimization Specialist',
      task: 'Minimize crash inputs and deduplicate findings',
      context: args,
      instructions: [
        '1. Minimize crash-inducing inputs',
        '2. Run afl-tmin or similar tools',
        '3. Deduplicate by crash signature',
        '4. Identify unique vulnerabilities',
        '5. Confirm minimized inputs still trigger crash',
        '6. Document root causes',
        '7. Assign severity ratings',
        '8. Create proof-of-concept files'
      ],
      outputFormat: 'JSON with minimized vulnerabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'uniqueVulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        uniqueVulnerabilities: { type: 'number' },
        minimizedInputs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'minimization']
}));

export const fuzzingReportTask = defineTask('fuzzing-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Fuzzing Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Fuzzing Report Specialist',
      task: 'Generate comprehensive fuzzing campaign report',
      context: args,
      instructions: [
        '1. Summarize campaign execution',
        '2. Document coverage achieved',
        '3. List all unique vulnerabilities',
        '4. Include crash details and PoCs',
        '5. Provide severity ratings',
        '6. Include remediation guidance',
        '7. Document campaign configuration',
        '8. Create professional report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        vulnerabilityCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'fuzzing', 'reporting']
}));
