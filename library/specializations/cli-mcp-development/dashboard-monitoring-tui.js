/**
 * @process specializations/cli-mcp-development/dashboard-monitoring-tui
 * @description Dashboard and Monitoring TUI - Build real-time dashboard for monitoring data in terminal with charts,
 * log viewers, metrics display, and keyboard shortcuts.
 * @inputs { projectName: string, language: string, framework?: string, widgets?: array }
 * @outputs { success: boolean, dashboardConfig: object, widgets: array, refreshConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/dashboard-monitoring-tui', {
 *   projectName: 'server-monitor',
 *   language: 'typescript',
 *   framework: 'blessed-contrib',
 *   widgets: ['lineChart', 'gauge', 'logViewer', 'table']
 * });
 *
 * @references
 * - blessed-contrib: https://github.com/yaronn/blessed-contrib
 * - Textual: https://textual.textualize.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'blessed-contrib',
    widgets = ['lineChart', 'gauge', 'logViewer', 'table'],
    outputDir = 'dashboard-monitoring-tui'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Dashboard and Monitoring TUI: ${projectName}`);
  ctx.log('info', `Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: DASHBOARD LAYOUT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing dashboard layout');

  const layoutDesign = await ctx.task(layoutDesignTask, {
    projectName,
    framework,
    widgets,
    outputDir
  });

  artifacts.push(...layoutDesign.artifacts);

  // ============================================================================
  // PHASE 2: DATA FETCHING/STREAMING
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing data fetching/streaming');

  const dataFetching = await ctx.task(dataFetchingTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...dataFetching.artifacts);

  // ============================================================================
  // PHASE 3: CHART COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating chart components (line, bar, gauge)');

  const chartComponents = await ctx.task(chartComponentsTask, {
    projectName,
    language,
    framework,
    widgets,
    outputDir
  });

  artifacts.push(...chartComponents.artifacts);

  // ============================================================================
  // PHASE 4: LOG VIEWER COMPONENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Adding log viewer component');

  const logViewer = await ctx.task(logViewerTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...logViewer.artifacts);

  // ============================================================================
  // PHASE 5: METRICS DISPLAY
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing metrics display');

  const metricsDisplay = await ctx.task(metricsDisplayTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...metricsDisplay.artifacts);

  // Quality Gate: Dashboard Widgets Review
  await ctx.breakpoint({
    question: `Dashboard widgets created: charts, log viewer, metrics. Proceed with interactivity and refresh controls?`,
    title: 'Dashboard Widgets Review',
    context: {
      runId: ctx.runId,
      projectName,
      widgets,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: ALERT INDICATORS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating alert indicators');

  const alertIndicators = await ctx.task(alertIndicatorsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...alertIndicators.artifacts);

  // ============================================================================
  // PHASE 7: REFRESH CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding refresh controls');

  const refreshControls = await ctx.task(refreshControlsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...refreshControls.artifacts);

  // ============================================================================
  // PHASE 8: SCROLLABLE REGIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing scrollable regions');

  const scrollableRegions = await ctx.task(scrollableRegionsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...scrollableRegions.artifacts);

  // ============================================================================
  // PHASE 9: KEYBOARD SHORTCUTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating keyboard shortcuts');

  const keyboardShortcuts = await ctx.task(keyboardShortcutsTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...keyboardShortcuts.artifacts);

  // ============================================================================
  // PHASE 10: HELP OVERLAY
  // ============================================================================

  ctx.log('info', 'Phase 10: Adding help overlay');

  const helpOverlay = await ctx.task(helpOverlayTask, {
    projectName,
    language,
    framework,
    keyboardShortcuts,
    outputDir
  });

  artifacts.push(...helpOverlay.artifacts);

  // ============================================================================
  // PHASE 11: PERFORMANCE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Testing performance with large data');

  const performanceTesting = await ctx.task(performanceTestingTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...performanceTesting.artifacts);

  // ============================================================================
  // PHASE 12: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    framework,
    layoutDesign,
    chartComponents,
    keyboardShortcuts,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Dashboard and Monitoring TUI complete for ${projectName}. Review and approve?`,
    title: 'Dashboard TUI Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        widgets: widgets.length,
        hasAlerts: true,
        hasKeyboardShortcuts: true
      },
      files: [
        { path: documentation.dashboardDocPath, format: 'markdown', label: 'Dashboard Documentation' },
        { path: layoutDesign.layoutPath, format: 'typescript', label: 'Dashboard Layout' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    dashboardConfig: {
      framework,
      layoutPath: layoutDesign.layoutPath
    },
    widgets: chartComponents.widgets,
    refreshConfig: refreshControls.config,
    keyboardShortcuts: keyboardShortcuts.shortcuts,
    documentation: {
      dashboardDoc: documentation.dashboardDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/dashboard-monitoring-tui',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const layoutDesignTask = defineTask('layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Layout Design - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Dashboard Layout Designer',
      task: 'Design dashboard layout',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        widgets: args.widgets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create grid-based layout',
        '2. Position widgets in layout',
        '3. Handle terminal resize',
        '4. Create responsive breakpoints',
        '5. Generate layout configuration'
      ],
      outputFormat: 'JSON with layout design'
    },
    outputSchema: {
      type: 'object',
      required: ['layoutPath', 'gridConfig', 'artifacts'],
      properties: {
        layoutPath: { type: 'string' },
        gridConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'layout']
}));

export const dataFetchingTask = defineTask('data-fetching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Fetching - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Data Integration Specialist',
      task: 'Implement data fetching/streaming',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create data fetching service',
        '2. Implement polling mechanism',
        '3. Add WebSocket support',
        '4. Handle data transformation',
        '5. Generate data fetching code'
      ],
      outputFormat: 'JSON with data fetching'
    },
    outputSchema: {
      type: 'object',
      required: ['dataServicePath', 'artifacts'],
      properties: {
        dataServicePath: { type: 'string' },
        dataConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'data']
}));

export const chartComponentsTask = defineTask('chart-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Chart Components - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Chart Component Developer',
      task: 'Create chart components (line, bar, gauge)',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        widgets: args.widgets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create LineChart component',
        '2. Create BarChart component',
        '3. Create Gauge component',
        '4. Add data binding',
        '5. Configure chart styling',
        '6. Generate chart components'
      ],
      outputFormat: 'JSON with chart components'
    },
    outputSchema: {
      type: 'object',
      required: ['widgets', 'artifacts'],
      properties: {
        widgets: { type: 'array', items: { type: 'object' } },
        chartPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'charts']
}));

export const logViewerTask = defineTask('log-viewer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Log Viewer - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Log Viewer Developer',
      task: 'Add log viewer component',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create LogViewer component',
        '2. Implement auto-scroll',
        '3. Add log level filtering',
        '4. Add search functionality',
        '5. Color-code log levels',
        '6. Generate log viewer code'
      ],
      outputFormat: 'JSON with log viewer'
    },
    outputSchema: {
      type: 'object',
      required: ['logViewerPath', 'artifacts'],
      properties: {
        logViewerPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'logs']
}));

export const metricsDisplayTask = defineTask('metrics-display', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Metrics Display - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Metrics Display Developer',
      task: 'Implement metrics display',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create MetricsPanel component',
        '2. Display key metrics',
        '3. Add trend indicators',
        '4. Show comparison with previous',
        '5. Generate metrics display code'
      ],
      outputFormat: 'JSON with metrics display'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsPath', 'artifacts'],
      properties: {
        metricsPath: { type: 'string' },
        metricTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'metrics']
}));

export const alertIndicatorsTask = defineTask('alert-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Alert Indicators - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Alert System Developer',
      task: 'Create alert indicators',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create alert badge component',
        '2. Add color-coded severity',
        '3. Implement blinking for critical',
        '4. Create alert list view',
        '5. Generate alert indicators code'
      ],
      outputFormat: 'JSON with alert indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['alertPath', 'artifacts'],
      properties: {
        alertPath: { type: 'string' },
        alertLevels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'alerts']
}));

export const refreshControlsTask = defineTask('refresh-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Refresh Controls - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Refresh Controls Developer',
      task: 'Add refresh controls',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create refresh interval selector',
        '2. Add manual refresh button',
        '3. Show last updated timestamp',
        '4. Implement pause/resume',
        '5. Generate refresh controls code'
      ],
      outputFormat: 'JSON with refresh controls'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        intervals: { type: 'array', items: { type: 'number' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'refresh']
}));

export const scrollableRegionsTask = defineTask('scrollable-regions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Scrollable Regions - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Scrolling Specialist',
      task: 'Implement scrollable regions',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create scrollable container',
        '2. Add scroll indicators',
        '3. Handle mouse wheel scrolling',
        '4. Add keyboard scrolling',
        '5. Generate scrollable regions code'
      ],
      outputFormat: 'JSON with scrollable regions'
    },
    outputSchema: {
      type: 'object',
      required: ['scrollConfig', 'artifacts'],
      properties: {
        scrollConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'scrolling']
}));

export const keyboardShortcutsTask = defineTask('keyboard-shortcuts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Keyboard Shortcuts - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Keyboard Shortcut Designer',
      task: 'Create keyboard shortcuts',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define navigation shortcuts',
        '2. Add refresh shortcuts (r)',
        '3. Add quit shortcut (q)',
        '4. Add help shortcut (?)',
        '5. Create shortcut registry',
        '6. Generate keyboard shortcuts code'
      ],
      outputFormat: 'JSON with keyboard shortcuts'
    },
    outputSchema: {
      type: 'object',
      required: ['shortcuts', 'artifacts'],
      properties: {
        shortcuts: { type: 'object' },
        shortcutPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'keyboard']
}));

export const helpOverlayTask = defineTask('help-overlay', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Help Overlay - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Help System Developer',
      task: 'Add help overlay',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        keyboardShortcuts: args.keyboardShortcuts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create help overlay component',
        '2. Display keyboard shortcuts',
        '3. Show navigation instructions',
        '4. Add close functionality',
        '5. Generate help overlay code'
      ],
      outputFormat: 'JSON with help overlay'
    },
    outputSchema: {
      type: 'object',
      required: ['helpPath', 'artifacts'],
      properties: {
        helpPath: { type: 'string' },
        helpContent: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'help']
}));

export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Performance Testing - ${args.projectName}`,
  agent: {
    name: 'tui-testing-architect',
    prompt: {
      role: 'TUI Performance Tester',
      task: 'Test performance with large data',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test with large datasets',
        '2. Measure render performance',
        '3. Test memory usage',
        '4. Optimize slow components',
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
  labels: ['tui', 'dashboard', 'performance']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'TUI Dashboard Documentation Specialist',
      task: 'Generate documentation',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        layoutDesign: args.layoutDesign,
        chartComponents: args.chartComponents,
        keyboardShortcuts: args.keyboardShortcuts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document dashboard architecture',
        '2. Document widget API',
        '3. Document keyboard shortcuts',
        '4. Add customization guide',
        '5. Add data source integration guide',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardDocPath', 'artifacts'],
      properties: {
        dashboardDocPath: { type: 'string' },
        widgetDocs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'dashboard', 'documentation']
}));
