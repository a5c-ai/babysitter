/**
 * @process specializations/cli-mcp-development/progress-status-indicators
 * @description Progress and Status Indicators - Implement progress bars, spinners, and status messages for long-running
 * CLI operations with ETA calculations and non-TTY fallback.
 * @inputs { projectName: string, language: string, indicatorTypes?: array }
 * @outputs { success: boolean, indicators: array, ttyHandling: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/progress-status-indicators', {
 *   projectName: 'build-cli',
 *   language: 'typescript',
 *   indicatorTypes: ['spinner', 'progressbar', 'tasklist']
 * });
 *
 * @references
 * - Ora: https://github.com/sindresorhus/ora
 * - cli-progress: https://github.com/npkgz/cli-progress
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    indicatorTypes = ['spinner', 'progressbar', 'tasklist'],
    outputDir = 'progress-status-indicators'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Progress and Status Indicators: ${projectName}`);

  // ============================================================================
  // PHASE 1: INDICATOR LIBRARY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting progress indicator libraries');

  const librarySelection = await ctx.task(librarySelectionTask, {
    projectName,
    language,
    indicatorTypes,
    outputDir
  });

  artifacts.push(...librarySelection.artifacts);

  // ============================================================================
  // PHASE 2: SPINNER IMPLEMENTATION
  // ============================================================================

  if (indicatorTypes.includes('spinner')) {
    ctx.log('info', 'Phase 2: Implementing spinner for indeterminate progress');

    const spinnerImpl = await ctx.task(spinnerImplementationTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...spinnerImpl.artifacts);
  }

  // ============================================================================
  // PHASE 3: PROGRESS BAR IMPLEMENTATION
  // ============================================================================

  if (indicatorTypes.includes('progressbar')) {
    ctx.log('info', 'Phase 3: Creating progress bar for known duration tasks');

    const progressBarImpl = await ctx.task(progressBarImplementationTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...progressBarImpl.artifacts);
  }

  // ============================================================================
  // PHASE 4: MULTI-STEP PROGRESS TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 4: Adding multi-step progress tracking');

  const multiStepProgress = await ctx.task(multiStepProgressTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...multiStepProgress.artifacts);

  // ============================================================================
  // PHASE 5: TASK LIST WITH STATUS
  // ============================================================================

  if (indicatorTypes.includes('tasklist')) {
    ctx.log('info', 'Phase 5: Implementing task list with status');

    const taskListImpl = await ctx.task(taskListImplementationTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...taskListImpl.artifacts);
  }

  // Quality Gate: Progress Indicators Review
  await ctx.breakpoint({
    question: `Progress indicators implemented: ${indicatorTypes.join(', ')}. Proceed with TTY handling and advanced features?`,
    title: 'Progress Indicators Review',
    context: {
      runId: ctx.runId,
      projectName,
      indicatorTypes,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: NON-TTY HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling non-TTY environments gracefully');

  const nonTtyHandling = await ctx.task(nonTtyHandlingTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...nonTtyHandling.artifacts);

  // ============================================================================
  // PHASE 7: ETA CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding ETA calculations');

  const etaCalculations = await ctx.task(etaCalculationsTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...etaCalculations.artifacts);

  // ============================================================================
  // PHASE 8: DOWNLOAD/UPLOAD PROGRESS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating download/upload progress');

  const downloadUploadProgress = await ctx.task(downloadUploadProgressTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...downloadUploadProgress.artifacts);

  // ============================================================================
  // PHASE 9: CONCURRENT PROGRESS INDICATORS
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing concurrent progress indicators');

  const concurrentIndicators = await ctx.task(concurrentIndicatorsTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...concurrentIndicators.artifacts);

  // ============================================================================
  // PHASE 10: PERFORMANCE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing performance impact');

  const performanceTesting = await ctx.task(performanceTestingTask, {
    projectName,
    language,
    indicatorTypes,
    outputDir
  });

  artifacts.push(...performanceTesting.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting progress patterns');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    indicatorTypes,
    librarySelection,
    nonTtyHandling,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Progress and Status Indicators complete for ${projectName}. Review and approve?`,
    title: 'Progress Indicators Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        indicatorTypes,
        hasEtaCalculations: true,
        hasNonTtyFallback: true
      },
      files: [
        { path: documentation.progressDocPath, format: 'markdown', label: 'Progress Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    indicators: indicatorTypes.map(type => ({ type, implemented: true })),
    ttyHandling: {
      nonTtyFallback: nonTtyHandling.enabled,
      etaSupported: true
    },
    documentation: {
      progressDoc: documentation.progressDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/progress-status-indicators',
      timestamp: startTime,
      indicatorTypes
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const librarySelectionTask = defineTask('library-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Library Selection - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Progress Library Specialist',
      task: 'Select progress indicator libraries',
      context: {
        projectName: args.projectName,
        language: args.language,
        indicatorTypes: args.indicatorTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate spinner libraries (ora, cli-spinners)',
        '2. Evaluate progress bar libraries (cli-progress)',
        '3. Evaluate task list libraries (listr2)',
        '4. Select libraries based on requirements',
        '5. Generate library selection document'
      ],
      outputFormat: 'JSON with library selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedLibraries', 'artifacts'],
      properties: {
        selectedLibraries: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'library-selection']
}));

export const spinnerImplementationTask = defineTask('spinner-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Spinner Implementation - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Spinner Specialist',
      task: 'Implement spinner for indeterminate progress',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure ora spinner',
        '2. Create spinner wrapper utility',
        '3. Add success/fail/warn methods',
        '4. Configure spinner styles',
        '5. Handle spinner text updates',
        '6. Generate spinner implementation'
      ],
      outputFormat: 'JSON with spinner implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['spinnerPath', 'artifacts'],
      properties: {
        spinnerPath: { type: 'string' },
        spinnerConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'spinner']
}));

export const progressBarImplementationTask = defineTask('progressbar-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Progress Bar Implementation - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Progress Bar Specialist',
      task: 'Create progress bar for known duration tasks',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure cli-progress library',
        '2. Create progress bar wrapper',
        '3. Add percentage display',
        '4. Configure bar formatting',
        '5. Add speed/throughput display',
        '6. Generate progress bar implementation'
      ],
      outputFormat: 'JSON with progress bar implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['progressBarPath', 'artifacts'],
      properties: {
        progressBarPath: { type: 'string' },
        progressBarConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'progressbar']
}));

export const multiStepProgressTask = defineTask('multi-step-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Multi-Step Progress - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Multi-Step Progress Designer',
      task: 'Add multi-step progress tracking',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create step tracking utility',
        '2. Display step numbers (1/5, 2/5)',
        '3. Track overall progress',
        '4. Handle step failures',
        '5. Generate multi-step progress code'
      ],
      outputFormat: 'JSON with multi-step progress'
    },
    outputSchema: {
      type: 'object',
      required: ['multiStepPath', 'artifacts'],
      properties: {
        multiStepPath: { type: 'string' },
        stepConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'multi-step']
}));

export const taskListImplementationTask = defineTask('tasklist-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Task List Implementation - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Task List Specialist',
      task: 'Implement task list with status',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure listr2 or similar library',
        '2. Create task list wrapper',
        '3. Add task status indicators',
        '4. Handle concurrent tasks',
        '5. Handle nested tasks',
        '6. Generate task list implementation'
      ],
      outputFormat: 'JSON with task list implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['taskListPath', 'artifacts'],
      properties: {
        taskListPath: { type: 'string' },
        taskListConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'tasklist']
}));

export const nonTtyHandlingTask = defineTask('non-tty-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Non-TTY Handling - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI TTY Handling Specialist',
      task: 'Handle non-TTY environments gracefully',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect TTY environment',
        '2. Create fallback for non-TTY',
        '3. Use simple progress messages',
        '4. Disable animations',
        '5. Generate non-TTY handling code'
      ],
      outputFormat: 'JSON with non-TTY handling'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        fallbackConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'non-tty']
}));

export const etaCalculationsTask = defineTask('eta-calculations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: ETA Calculations - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI ETA Calculation Specialist',
      task: 'Add ETA calculations',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate elapsed time',
        '2. Estimate remaining time',
        '3. Format ETA display',
        '4. Handle variable speed operations',
        '5. Generate ETA calculation code'
      ],
      outputFormat: 'JSON with ETA calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['etaConfig', 'artifacts'],
      properties: {
        etaConfig: { type: 'object' },
        calculationMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'eta']
}));

export const downloadUploadProgressTask = defineTask('download-upload-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Download/Upload Progress - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Transfer Progress Specialist',
      task: 'Create download/upload progress',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create transfer progress utility',
        '2. Show bytes transferred',
        '3. Display transfer speed',
        '4. Show file size information',
        '5. Generate transfer progress code'
      ],
      outputFormat: 'JSON with download/upload progress'
    },
    outputSchema: {
      type: 'object',
      required: ['transferProgressPath', 'artifacts'],
      properties: {
        transferProgressPath: { type: 'string' },
        transferConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'transfer']
}));

export const concurrentIndicatorsTask = defineTask('concurrent-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Concurrent Indicators - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Concurrent Progress Specialist',
      task: 'Implement concurrent progress indicators',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Support multiple progress bars',
        '2. Handle concurrent task updates',
        '3. Manage terminal real estate',
        '4. Coordinate indicator rendering',
        '5. Generate concurrent indicators code'
      ],
      outputFormat: 'JSON with concurrent indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['concurrentConfig', 'artifacts'],
      properties: {
        concurrentConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'concurrent']
}));

export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Performance Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: {
      role: 'CLI Performance Tester',
      task: 'Test performance impact',
      context: {
        projectName: args.projectName,
        language: args.language,
        indicatorTypes: args.indicatorTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Benchmark progress indicator overhead',
        '2. Test memory usage',
        '3. Test CPU impact',
        '4. Measure render frequency impact',
        '5. Generate performance test suite'
      ],
      outputFormat: 'JSON with performance tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: { type: 'object' },
        benchmarks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'performance']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Progress Documentation Specialist',
      task: 'Document progress patterns',
      context: {
        projectName: args.projectName,
        indicatorTypes: args.indicatorTypes,
        librarySelection: args.librarySelection,
        nonTtyHandling: args.nonTtyHandling,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document spinner usage',
        '2. Document progress bar usage',
        '3. Document task list usage',
        '4. Document non-TTY fallback',
        '5. Add usage examples',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['progressDocPath', 'artifacts'],
      properties: {
        progressDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'progress', 'documentation']
}));
