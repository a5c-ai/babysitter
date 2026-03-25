/**
 * @process specializations/cli-mcp-development/tui-application-framework
 * @description TUI Application Framework Setup - Set up terminal user interface framework for interactive applications
 * using Ink, Bubble Tea, or Textual with layout systems and input handling.
 * @inputs { projectName: string, language: string, framework?: string, components?: array }
 * @outputs { success: boolean, frameworkConfig: object, components: array, layoutSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/tui-application-framework', {
 *   projectName: 'dashboard-tui',
 *   language: 'typescript',
 *   framework: 'ink',
 *   components: ['text', 'box', 'list', 'input']
 * });
 *
 * @references
 * - Ink: https://github.com/vadimdemedes/ink
 * - Bubble Tea: https://github.com/charmbracelet/bubbletea
 * - Textual: https://textual.textualize.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    framework = 'ink',
    components = ['text', 'box', 'list', 'input'],
    outputDir = 'tui-application-framework'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TUI Application Framework Setup: ${projectName}`);
  ctx.log('info', `Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: FRAMEWORK SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting TUI framework');

  const frameworkSelection = await ctx.task(frameworkSelectionTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...frameworkSelection.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring project for TUI development');

  const projectConfig = await ctx.task(projectConfigTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...projectConfig.artifacts);

  // ============================================================================
  // PHASE 3: MAIN APPLICATION COMPONENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing main application component');

  const mainComponent = await ctx.task(mainComponentTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...mainComponent.artifacts);

  // ============================================================================
  // PHASE 4: LAYOUT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating layout system');

  const layoutSystem = await ctx.task(layoutSystemTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...layoutSystem.artifacts);

  // ============================================================================
  // PHASE 5: INPUT HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 5: Adding input handling');

  const inputHandling = await ctx.task(inputHandlingTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...inputHandling.artifacts);

  // Quality Gate: TUI Framework Review
  await ctx.breakpoint({
    question: `TUI framework ${framework} configured. Proceed with component library and advanced features?`,
    title: 'TUI Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      framework,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: FOCUS MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing focus management');

  const focusManagement = await ctx.task(focusManagementTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...focusManagement.artifacts);

  // ============================================================================
  // PHASE 7: BASE COMPONENT LIBRARY
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating base component library');

  const componentLibrary = await ctx.task(componentLibraryTask, {
    projectName,
    language,
    framework,
    components,
    outputDir
  });

  artifacts.push(...componentLibrary.artifacts);

  // ============================================================================
  // PHASE 8: KEYBOARD NAVIGATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Adding keyboard navigation');

  const keyboardNavigation = await ctx.task(keyboardNavigationTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...keyboardNavigation.artifacts);

  // ============================================================================
  // PHASE 9: RESPONSIVE LAYOUT
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing responsive layout');

  const responsiveLayout = await ctx.task(responsiveLayoutTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...responsiveLayout.artifacts);

  // ============================================================================
  // PHASE 10: HOT RELOADING
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up hot reloading for development');

  const hotReloading = await ctx.task(hotReloadingTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...hotReloading.artifacts);

  // ============================================================================
  // PHASE 11: TESTING UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating testing utilities');

  const testingUtilities = await ctx.task(testingUtilitiesTask, {
    projectName,
    language,
    framework,
    outputDir
  });

  artifacts.push(...testingUtilities.artifacts);

  // ============================================================================
  // PHASE 12: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    framework,
    mainComponent,
    layoutSystem,
    componentLibrary,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `TUI Application Framework Setup complete for ${projectName}. Review and approve?`,
    title: 'TUI Framework Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        components: components.length,
        hasHotReloading: true
      },
      files: [
        { path: documentation.tuiDocPath, format: 'markdown', label: 'TUI Documentation' },
        { path: mainComponent.componentPath, format: 'typescript', label: 'Main Component' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    frameworkConfig: {
      framework,
      configPath: projectConfig.configPath
    },
    components: componentLibrary.components,
    layoutSystem: layoutSystem.config,
    inputHandling: inputHandling.config,
    documentation: {
      tuiDoc: documentation.tuiDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/tui-application-framework',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const frameworkSelectionTask = defineTask('framework-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Framework Selection - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Framework Architect',
      task: 'Select TUI framework',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate selected framework',
        '2. Verify language compatibility',
        '3. Document framework capabilities',
        '4. Identify dependencies',
        '5. Generate framework selection document'
      ],
      outputFormat: 'JSON with framework selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFramework', 'capabilities', 'artifacts'],
      properties: {
        selectedFramework: { type: 'string' },
        capabilities: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'framework', 'selection']
}));

export const projectConfigTask = defineTask('project-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Project Configuration - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Project Configuration Specialist',
      task: 'Configure project for TUI development',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install TUI framework dependencies',
        '2. Configure build system',
        '3. Set up development scripts',
        '4. Configure TypeScript/transpilation',
        '5. Generate project configuration'
      ],
      outputFormat: 'JSON with project configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        scripts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'configuration']
}));

export const mainComponentTask = defineTask('main-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Main Component - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Component Developer',
      task: 'Implement main application component',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create App component',
        '2. Set up application state',
        '3. Configure render function',
        '4. Handle application lifecycle',
        '5. Generate main component code'
      ],
      outputFormat: 'JSON with main component'
    },
    outputSchema: {
      type: 'object',
      required: ['componentPath', 'artifacts'],
      properties: {
        componentPath: { type: 'string' },
        stateManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'component', 'main']
}));

export const layoutSystemTask = defineTask('layout-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Layout System - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Layout Specialist',
      task: 'Create layout system',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create layout containers (Box, Flex)',
        '2. Implement flexbox-like layout',
        '3. Add padding and margin support',
        '4. Create border utilities',
        '5. Generate layout system code'
      ],
      outputFormat: 'JSON with layout system'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        layoutComponents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'layout']
}));

export const inputHandlingTask = defineTask('input-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Input Handling - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Input Handling Specialist',
      task: 'Add input handling',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure keyboard input handling',
        '2. Add mouse support if available',
        '3. Create input event system',
        '4. Handle special keys (Ctrl, Alt, etc.)',
        '5. Generate input handling code'
      ],
      outputFormat: 'JSON with input handling'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        supportedInputs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'input']
}));

export const focusManagementTask = defineTask('focus-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Focus Management - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Focus Management Specialist',
      task: 'Implement focus management',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create focus context',
        '2. Implement tab navigation',
        '3. Add focus indicators',
        '4. Handle focus trapping',
        '5. Generate focus management code'
      ],
      outputFormat: 'JSON with focus management'
    },
    outputSchema: {
      type: 'object',
      required: ['focusConfig', 'artifacts'],
      properties: {
        focusConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'focus']
}));

export const componentLibraryTask = defineTask('component-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Component Library - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Component Library Developer',
      task: 'Create base component library',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        components: args.components,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Text component',
        '2. Create Box/Container component',
        '3. Create List component',
        '4. Create Input component',
        '5. Add component documentation',
        '6. Generate component library'
      ],
      outputFormat: 'JSON with component library'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        libraryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'components']
}));

export const keyboardNavigationTask = defineTask('keyboard-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Keyboard Navigation - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Keyboard Navigation Specialist',
      task: 'Add keyboard navigation',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define keyboard shortcuts',
        '2. Implement arrow key navigation',
        '3. Add vim-style navigation (j/k)',
        '4. Create shortcut help overlay',
        '5. Generate keyboard navigation code'
      ],
      outputFormat: 'JSON with keyboard navigation'
    },
    outputSchema: {
      type: 'object',
      required: ['shortcuts', 'artifacts'],
      properties: {
        shortcuts: { type: 'object' },
        navigationConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'keyboard']
}));

export const responsiveLayoutTask = defineTask('responsive-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Responsive Layout - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Responsive Layout Specialist',
      task: 'Implement responsive layout',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect terminal size',
        '2. Handle terminal resize events',
        '3. Create responsive breakpoints',
        '4. Adjust layout based on size',
        '5. Generate responsive layout code'
      ],
      outputFormat: 'JSON with responsive layout'
    },
    outputSchema: {
      type: 'object',
      required: ['responsiveConfig', 'artifacts'],
      properties: {
        responsiveConfig: { type: 'object' },
        breakpoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'responsive']
}));

export const hotReloadingTask = defineTask('hot-reloading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Hot Reloading - ${args.projectName}`,
  agent: {
    name: 'tui-component-architect',
    prompt: {
      role: 'TUI Development Tools Specialist',
      task: 'Set up hot reloading for development',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure file watching',
        '2. Set up hot reload server',
        '3. Handle state preservation',
        '4. Configure development scripts',
        '5. Generate hot reloading configuration'
      ],
      outputFormat: 'JSON with hot reloading'
    },
    outputSchema: {
      type: 'object',
      required: ['hotReloadConfig', 'artifacts'],
      properties: {
        hotReloadConfig: { type: 'object' },
        devScript: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'development', 'hot-reload']
}));

export const testingUtilitiesTask = defineTask('testing-utilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Testing Utilities - ${args.projectName}`,
  agent: {
    name: 'tui-testing-architect',
    prompt: {
      role: 'TUI Testing Specialist',
      task: 'Create testing utilities',
      context: {
        projectName: args.projectName,
        language: args.language,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create component testing utilities',
        '2. Set up snapshot testing',
        '3. Add input simulation helpers',
        '4. Create render helpers',
        '5. Generate testing utilities'
      ],
      outputFormat: 'JSON with testing utilities'
    },
    outputSchema: {
      type: 'object',
      required: ['testUtilsPath', 'artifacts'],
      properties: {
        testUtilsPath: { type: 'string' },
        testHelpers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: {
      role: 'TUI Documentation Specialist',
      task: 'Generate documentation',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        mainComponent: args.mainComponent,
        layoutSystem: args.layoutSystem,
        componentLibrary: args.componentLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document framework setup',
        '2. Document component API',
        '3. Document layout system',
        '4. Add usage examples',
        '5. Document keyboard shortcuts',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['tuiDocPath', 'artifacts'],
      properties: {
        tuiDocPath: { type: 'string' },
        componentDocs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tui', 'documentation']
}));
