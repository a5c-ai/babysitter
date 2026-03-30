/**
 * @process specializations/cli-mcp-development/cli-output-formatting
 * @description CLI Output Formatting System - Implement flexible output formatting with support for multiple formats
 * (text, JSON, table) with colors, styling, quiet mode, and piped output detection.
 * @inputs { projectName: string, language: string, supportedFormats?: array, colorSupport?: boolean }
 * @outputs { success: boolean, formatters: array, outputModes: array, colorConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-output-formatting', {
 *   projectName: 'data-cli',
 *   language: 'typescript',
 *   supportedFormats: ['text', 'json', 'table', 'yaml'],
 *   colorSupport: true
 * });
 *
 * @references
 * - Chalk: https://github.com/chalk/chalk
 * - cli-table3: https://github.com/cli-table/cli-table3
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    supportedFormats = ['text', 'json', 'table'],
    colorSupport = true,
    outputDir = 'cli-output-formatting'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Output Formatting System: ${projectName}`);

  // ============================================================================
  // PHASE 1: OUTPUT FORMAT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing output format strategy');

  const formatStrategy = await ctx.task(formatStrategyTask, {
    projectName,
    supportedFormats,
    outputDir
  });

  artifacts.push(...formatStrategy.artifacts);

  // ============================================================================
  // PHASE 2: TEXT OUTPUT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing human-readable text output');

  const textOutput = await ctx.task(textOutputTask, {
    projectName,
    language,
    colorSupport,
    outputDir
  });

  artifacts.push(...textOutput.artifacts);

  // ============================================================================
  // PHASE 3: JSON OUTPUT MODE
  // ============================================================================

  ctx.log('info', 'Phase 3: Adding JSON output mode');

  const jsonOutput = await ctx.task(jsonOutputTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...jsonOutput.artifacts);

  // ============================================================================
  // PHASE 4: TABLE FORMATTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating table formatting for lists');

  const tableFormatting = await ctx.task(tableFormattingTask, {
    projectName,
    language,
    colorSupport,
    outputDir
  });

  artifacts.push(...tableFormatting.artifacts);

  // ============================================================================
  // PHASE 5: COLOR AND STYLING
  // ============================================================================

  if (colorSupport) {
    ctx.log('info', 'Phase 5: Implementing color and styling helpers');

    const colorStyling = await ctx.task(colorStylingTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...colorStyling.artifacts);
  }

  // Quality Gate: Output Formatting Review
  await ctx.breakpoint({
    question: `Output formatting system created with ${supportedFormats.length} formats. Proceed with output modes configuration?`,
    title: 'Output Formatting Review',
    context: {
      runId: ctx.runId,
      projectName,
      supportedFormats,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: QUIET MODE
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding quiet mode');

  const quietMode = await ctx.task(quietModeTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...quietMode.artifacts);

  // ============================================================================
  // PHASE 7: VERBOSE MODE
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating verbose mode with debug info');

  const verboseMode = await ctx.task(verboseModeTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...verboseMode.artifacts);

  // ============================================================================
  // PHASE 8: OUTPUT TO FILE
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing output to file option');

  const outputToFile = await ctx.task(outputToFileTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...outputToFile.artifacts);

  // ============================================================================
  // PHASE 9: PIPED OUTPUT DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 9: Handling piped output detection');

  const pipedOutputDetection = await ctx.task(pipedOutputDetectionTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...pipedOutputDetection.artifacts);

  // ============================================================================
  // PHASE 10: CROSS-PLATFORM TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing cross-platform output');

  const crossPlatformTesting = await ctx.task(crossPlatformTestingTask, {
    projectName,
    language,
    supportedFormats,
    outputDir
  });

  artifacts.push(...crossPlatformTesting.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting output options');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    supportedFormats,
    colorSupport,
    formatStrategy,
    textOutput,
    jsonOutput,
    tableFormatting,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `CLI Output Formatting System complete for ${projectName}. Review and approve?`,
    title: 'CLI Output Formatting Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        supportedFormats,
        colorSupport,
        outputModes: ['text', 'json', 'quiet', 'verbose']
      },
      files: [
        { path: documentation.outputDocPath, format: 'markdown', label: 'Output Documentation' },
        { path: textOutput.formatterPath, format: 'typescript', label: 'Text Formatter' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    formatters: [
      { type: 'text', path: textOutput.formatterPath },
      { type: 'json', path: jsonOutput.formatterPath },
      { type: 'table', path: tableFormatting.formatterPath }
    ],
    outputModes: ['text', 'json', 'quiet', 'verbose'],
    colorConfig: colorSupport ? { enabled: true } : { enabled: false },
    pipedOutputDetection: pipedOutputDetection.enabled,
    documentation: {
      outputDoc: documentation.outputDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/cli-output-formatting',
      timestamp: startTime,
      supportedFormats
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const formatStrategyTask = defineTask('format-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Format Strategy - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Output Designer',
      task: 'Design output format strategy',
      context: {
        projectName: args.projectName,
        supportedFormats: args.supportedFormats,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define output format hierarchy',
        '2. Design format selection logic',
        '3. Plan format-specific configurations',
        '4. Design format switching mechanism',
        '5. Generate format strategy document'
      ],
      outputFormat: 'JSON with format strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        formatHierarchy: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'strategy']
}));

export const textOutputTask = defineTask('text-output', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Text Output - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Text Output Specialist',
      task: 'Implement human-readable text output',
      context: {
        projectName: args.projectName,
        language: args.language,
        colorSupport: args.colorSupport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create text output formatter',
        '2. Implement success/error message formatting',
        '3. Add headers and section formatting',
        '4. Create bullet list formatting',
        '5. Add status indicators',
        '6. Generate text output code'
      ],
      outputFormat: 'JSON with text output'
    },
    outputSchema: {
      type: 'object',
      required: ['formatterPath', 'artifacts'],
      properties: {
        formatterPath: { type: 'string' },
        formatFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'text']
}));

export const jsonOutputTask = defineTask('json-output', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: JSON Output - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI JSON Output Specialist',
      task: 'Add JSON output mode',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create JSON output formatter',
        '2. Configure pretty-print option',
        '3. Handle circular references',
        '4. Add schema validation output',
        '5. Configure --json flag handling',
        '6. Generate JSON output code'
      ],
      outputFormat: 'JSON with JSON output'
    },
    outputSchema: {
      type: 'object',
      required: ['formatterPath', 'artifacts'],
      properties: {
        formatterPath: { type: 'string' },
        outputOptions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'json']
}));

export const tableFormattingTask = defineTask('table-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Table Formatting - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Table Formatting Specialist',
      task: 'Create table formatting for lists',
      context: {
        projectName: args.projectName,
        language: args.language,
        colorSupport: args.colorSupport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure table library (cli-table3)',
        '2. Create table formatting function',
        '3. Add column configuration',
        '4. Handle truncation for long values',
        '5. Add sorting support',
        '6. Generate table formatting code'
      ],
      outputFormat: 'JSON with table formatting'
    },
    outputSchema: {
      type: 'object',
      required: ['formatterPath', 'artifacts'],
      properties: {
        formatterPath: { type: 'string' },
        tableConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'table']
}));

export const colorStylingTask = defineTask('color-styling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Color and Styling - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Color Styling Specialist',
      task: 'Implement color and styling helpers',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure color library (chalk)',
        '2. Create color helper functions',
        '3. Define color theme',
        '4. Add success/error/warning colors',
        '5. Handle color support detection',
        '6. Generate color styling code'
      ],
      outputFormat: 'JSON with color styling'
    },
    outputSchema: {
      type: 'object',
      required: ['colorConfig', 'artifacts'],
      properties: {
        colorConfig: { type: 'object' },
        theme: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'colors']
}));

export const quietModeTask = defineTask('quiet-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Quiet Mode - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Mode Designer',
      task: 'Add quiet mode',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement --quiet/-q flag',
        '2. Suppress non-essential output',
        '3. Keep error output visible',
        '4. Return minimal output for scripting',
        '5. Generate quiet mode code'
      ],
      outputFormat: 'JSON with quiet mode'
    },
    outputSchema: {
      type: 'object',
      required: ['quietModeConfig', 'artifacts'],
      properties: {
        quietModeConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'quiet']
}));

export const verboseModeTask = defineTask('verbose-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Verbose Mode - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Debug Mode Designer',
      task: 'Create verbose mode with debug info',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement --verbose/-v flag',
        '2. Add detailed progress output',
        '3. Show debug information',
        '4. Add timing information',
        '5. Generate verbose mode code'
      ],
      outputFormat: 'JSON with verbose mode'
    },
    outputSchema: {
      type: 'object',
      required: ['verboseModeConfig', 'artifacts'],
      properties: {
        verboseModeConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'verbose']
}));

export const outputToFileTask = defineTask('output-to-file', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Output to File - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI File Output Specialist',
      task: 'Implement output to file option',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement --output/-o flag',
        '2. Write output to specified file',
        '3. Handle file creation and overwrite',
        '4. Support different output formats to file',
        '5. Generate output to file code'
      ],
      outputFormat: 'JSON with output to file'
    },
    outputSchema: {
      type: 'object',
      required: ['fileOutputConfig', 'artifacts'],
      properties: {
        fileOutputConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'file']
}));

export const pipedOutputDetectionTask = defineTask('piped-output-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Piped Output Detection - ${args.projectName}`,
  agent: {
    name: 'cli-output-architect',
    prompt: {
      role: 'CLI Pipe Detection Specialist',
      task: 'Handle piped output detection',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect if stdout is a TTY',
        '2. Disable colors when piped',
        '3. Adjust output format for piping',
        '4. Handle stdin piping',
        '5. Generate pipe detection code'
      ],
      outputFormat: 'JSON with piped output detection'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        detectionConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'pipe-detection']
}));

export const crossPlatformTestingTask = defineTask('cross-platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Cross-Platform Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: {
      role: 'CLI Cross-Platform Tester',
      task: 'Test cross-platform output',
      context: {
        projectName: args.projectName,
        language: args.language,
        supportedFormats: args.supportedFormats,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test output on Windows',
        '2. Test output on macOS',
        '3. Test output on Linux',
        '4. Test Unicode support',
        '5. Test color support across platforms',
        '6. Generate cross-platform tests'
      ],
      outputFormat: 'JSON with cross-platform tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: { type: 'object' },
        platformSupport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'cross-platform']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'CLI Output Documentation Specialist',
      task: 'Document output options',
      context: {
        projectName: args.projectName,
        supportedFormats: args.supportedFormats,
        colorSupport: args.colorSupport,
        formatStrategy: args.formatStrategy,
        textOutput: args.textOutput,
        jsonOutput: args.jsonOutput,
        tableFormatting: args.tableFormatting,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document supported output formats',
        '2. Document output flags',
        '3. Document color configuration',
        '4. Add output examples',
        '5. Document piping behavior',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['outputDocPath', 'artifacts'],
      properties: {
        outputDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'output', 'documentation']
}));
