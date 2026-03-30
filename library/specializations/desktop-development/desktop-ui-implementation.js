/**
 * @process specializations/desktop-development/desktop-ui-implementation
 * @description Desktop UI Implementation Workflow - Design and implement desktop application user interface following
 * platform conventions; create layouts, components, styling; ensure responsiveness and native feel.
 * @inputs { projectName: string, framework: string, designSystem?: string, targetPlatforms: array, uiRequirements?: object, outputDir?: string }
 * @outputs { success: boolean, components: array, layouts: array, styleSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-ui-implementation', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   designSystem: 'Fluent',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   uiRequirements: { darkMode: true, accessibility: true }
 * });
 *
 * @references
 * - Electron UI: https://www.electronjs.org/docs/latest/tutorial/application-architecture
 * - Fluent UI: https://developer.microsoft.com/en-us/fluentui
 * - Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    designSystem = 'Custom',
    targetPlatforms = ['windows', 'macos', 'linux'],
    uiRequirements = {
      darkMode: true,
      accessibility: true,
      responsive: true,
      animations: true
    },
    uiLibrary = 'React',
    outputDir = 'desktop-ui-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop UI Implementation: ${projectName}`);
  ctx.log('info', `Framework: ${framework}, Design System: ${designSystem}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: UI REQUIREMENTS AND DESIGN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing UI requirements and design specifications');

  const uiAnalysis = await ctx.task(analyzeUiRequirementsTask, {
    projectName,
    framework,
    designSystem,
    targetPlatforms,
    uiRequirements,
    uiLibrary,
    outputDir
  });

  artifacts.push(...uiAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: UI requirements analyzed. ${uiAnalysis.screens.length} screens identified, ${uiAnalysis.components.length} components needed. Proceed with design system setup?`,
    title: 'UI Requirements Review',
    context: {
      runId: ctx.runId,
      screens: uiAnalysis.screens,
      components: uiAnalysis.components,
      designSystem,
      files: uiAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: DESIGN SYSTEM AND THEMING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up design system and theming');

  const designSystemSetup = await ctx.task(setupDesignSystemTask, {
    projectName,
    framework,
    designSystem,
    uiLibrary,
    uiRequirements,
    outputDir
  });

  artifacts.push(...designSystemSetup.artifacts);

  // ============================================================================
  // PHASE 3: LAYOUT SYSTEM IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing layout system');

  const layoutSystem = await ctx.task(implementLayoutSystemTask, {
    projectName,
    framework,
    uiLibrary,
    uiAnalysis,
    designSystemSetup,
    outputDir
  });

  artifacts.push(...layoutSystem.artifacts);

  // ============================================================================
  // PHASE 4: CORE COMPONENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing core UI components');

  const coreComponents = await ctx.task(implementCoreComponentsTask, {
    projectName,
    framework,
    uiLibrary,
    designSystemSetup,
    uiAnalysis,
    outputDir
  });

  artifacts.push(...coreComponents.artifacts);

  await ctx.breakpoint({
    question: `Phase 4 Complete: ${coreComponents.components.length} core components implemented. Component library includes: ${coreComponents.categories.join(', ')}. Review components?`,
    title: 'Core Components Review',
    context: {
      runId: ctx.runId,
      components: coreComponents.components,
      categories: coreComponents.categories,
      files: coreComponents.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 5: SCREEN IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing application screens');

  const screenImplementation = await ctx.task(implementScreensTask, {
    projectName,
    framework,
    uiLibrary,
    uiAnalysis,
    coreComponents,
    layoutSystem,
    outputDir
  });

  artifacts.push(...screenImplementation.artifacts);

  // ============================================================================
  // PHASE 6: NAVIGATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing navigation system');

  const navigationSystem = await ctx.task(implementNavigationTask, {
    projectName,
    framework,
    uiLibrary,
    uiAnalysis,
    screenImplementation,
    outputDir
  });

  artifacts.push(...navigationSystem.artifacts);

  // ============================================================================
  // PHASE 7: PLATFORM-SPECIFIC ADAPTATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing platform-specific UI adaptations');

  const platformAdaptationTasks = targetPlatforms.map(platform =>
    () => ctx.task(implementPlatformAdaptationsTask, {
      projectName,
      framework,
      platform,
      uiLibrary,
      designSystemSetup,
      coreComponents,
      outputDir
    })
  );

  const platformAdaptations = await ctx.parallel.all(platformAdaptationTasks);

  artifacts.push(...platformAdaptations.flatMap(a => a.artifacts));

  // ============================================================================
  // PHASE 8: ACCESSIBILITY IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing accessibility features');

  const accessibilityImplementation = await ctx.task(implementAccessibilityTask, {
    projectName,
    framework,
    uiLibrary,
    coreComponents,
    screenImplementation,
    outputDir
  });

  artifacts.push(...accessibilityImplementation.artifacts);

  // ============================================================================
  // PHASE 9: ANIMATIONS AND INTERACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing animations and interactions');

  const animationsImplementation = await ctx.task(implementAnimationsTask, {
    projectName,
    framework,
    uiLibrary,
    uiRequirements,
    coreComponents,
    outputDir
  });

  artifacts.push(...animationsImplementation.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating UI documentation and validating implementation');

  const documentation = await ctx.task(generateUiDocumentationTask, {
    projectName,
    framework,
    designSystemSetup,
    coreComponents,
    screenImplementation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validateUiImplementationTask, {
    projectName,
    framework,
    uiRequirements,
    coreComponents,
    screenImplementation,
    accessibilityImplementation,
    platformAdaptations,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `Desktop UI Implementation Complete for ${projectName}! Validation score: ${validation.validationScore}/100. ${coreComponents.components.length} components, ${screenImplementation.screens.length} screens implemented. Approve UI implementation?`,
    title: 'UI Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        designSystem,
        validationScore: validation.validationScore,
        componentsCreated: coreComponents.components.length,
        screensImplemented: screenImplementation.screens.length,
        accessibilityScore: accessibilityImplementation.accessibilityScore
      },
      nextSteps: validation.nextSteps,
      files: [
        { path: documentation.styleGuidePath, format: 'markdown', label: 'Style Guide' },
        { path: documentation.componentDocsPath, format: 'markdown', label: 'Component Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    framework,
    designSystem,
    components: coreComponents.components.map(c => ({
      name: c.name,
      category: c.category,
      path: c.path
    })),
    layouts: layoutSystem.layouts,
    screens: screenImplementation.screens,
    styleSystem: {
      designSystem,
      themeSupport: designSystemSetup.themes,
      darkModeEnabled: uiRequirements.darkMode
    },
    navigation: {
      type: navigationSystem.navigationType,
      routes: navigationSystem.routes
    },
    accessibility: {
      score: accessibilityImplementation.accessibilityScore,
      features: accessibilityImplementation.features
    },
    platformAdaptations: platformAdaptations.map(a => ({
      platform: a.platform,
      adaptations: a.adaptations
    })),
    validation: {
      score: validation.validationScore,
      passed: validationPassed,
      checks: validation.checks
    },
    documentation: {
      styleGuide: documentation.styleGuidePath,
      componentDocs: documentation.componentDocsPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/desktop-ui-implementation',
      timestamp: startTime,
      framework,
      uiLibrary
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const analyzeUiRequirementsTask = defineTask('analyze-ui-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: UI Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'ui-analyst',
    prompt: {
      role: 'Desktop UI/UX Analyst',
      task: 'Analyze UI requirements and identify needed components',
      context: args,
      instructions: [
        '1. Analyze application screens and user flows',
        '2. Identify needed UI components',
        '3. Define component hierarchy',
        '4. Identify platform-specific requirements',
        '5. Assess accessibility requirements',
        '6. Define responsive behavior needs',
        '7. Identify theming requirements',
        '8. Document UI patterns to use',
        '9. Create component inventory',
        '10. Generate UI requirements document'
      ],
      outputFormat: 'JSON with UI requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['screens', 'components', 'artifacts'],
      properties: {
        screens: { type: 'array', items: { type: 'object' } },
        components: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'ui', 'requirements']
}));

export const setupDesignSystemTask = defineTask('setup-design-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design System Setup - ${args.projectName}`,
  agent: {
    name: 'fluent-ui-component-designer',
    prompt: {
      role: 'Design System Engineer',
      task: 'Set up design system and theming infrastructure',
      context: args,
      instructions: [
        '1. Configure design tokens (colors, typography, spacing)',
        '2. Set up CSS variables or styled-components theme',
        '3. Create color palette with semantic names',
        '4. Define typography scale',
        '5. Set up spacing system',
        '6. Configure shadows and elevation',
        '7. Set up dark/light theme support',
        '8. Create theme switching mechanism',
        '9. Configure platform-aware theming',
        '10. Generate design system files'
      ],
      outputFormat: 'JSON with design system configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['tokens', 'themes', 'artifacts'],
      properties: {
        tokens: { type: 'object' },
        themes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'design-system']
}));

export const implementLayoutSystemTask = defineTask('implement-layout-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Layout System - ${args.projectName}`,
  agent: {
    name: 'layout-engineer',
    prompt: {
      role: 'UI Layout Engineer',
      task: 'Implement responsive layout system',
      context: args,
      instructions: [
        '1. Create main application shell/container',
        '2. Implement sidebar layout',
        '3. Create header/toolbar layout',
        '4. Implement content area layouts',
        '5. Create grid system components',
        '6. Implement flexbox utilities',
        '7. Create responsive breakpoints',
        '8. Implement split pane layouts',
        '9. Create panel/card layouts',
        '10. Generate layout components'
      ],
      outputFormat: 'JSON with layout system implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['layouts', 'artifacts'],
      properties: {
        layouts: { type: 'array', items: { type: 'object' } },
        breakpoints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'layout']
}));

export const implementCoreComponentsTask = defineTask('implement-core-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Core Components - ${args.projectName}`,
  skill: {
    name: 'qt-qml-component-generator',
  },
  agent: {
    name: 'desktop-ux-analyst',
    prompt: {
      role: 'UI Component Developer',
      task: 'Implement core UI component library',
      context: args,
      instructions: [
        '1. Create Button component with variants',
        '2. Create Input components (text, number, etc.)',
        '3. Create Select/Dropdown component',
        '4. Create Modal/Dialog component',
        '5. Create Card component',
        '6. Create List/Table components',
        '7. Create Navigation components',
        '8. Create Form components',
        '9. Create Feedback components (toast, alert)',
        '10. Create utility components (icons, loaders)'
      ],
      outputFormat: 'JSON with component implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'categories', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'components']
}));

export const implementScreensTask = defineTask('implement-screens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Screen Implementation - ${args.projectName}`,
  agent: {
    name: 'screen-developer',
    prompt: {
      role: 'Application Screen Developer',
      task: 'Implement application screens using components',
      context: args,
      instructions: [
        '1. Implement main/home screen',
        '2. Implement settings screen',
        '3. Implement data display screens',
        '4. Implement form screens',
        '5. Connect screens to state management',
        '6. Implement loading states',
        '7. Implement error states',
        '8. Implement empty states',
        '9. Add screen transitions',
        '10. Generate screen components'
      ],
      outputFormat: 'JSON with screen implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['screens', 'artifacts'],
      properties: {
        screens: { type: 'array', items: { type: 'object' } },
        routes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'screens']
}));

export const implementNavigationTask = defineTask('implement-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Navigation System - ${args.projectName}`,
  agent: {
    name: 'navigation-developer',
    prompt: {
      role: 'Navigation System Developer',
      task: 'Implement application navigation',
      context: args,
      instructions: [
        '1. Set up routing library configuration',
        '2. Define route structure',
        '3. Implement navigation components',
        '4. Create breadcrumb navigation',
        '5. Implement deep linking',
        '6. Add navigation history',
        '7. Implement keyboard navigation',
        '8. Create navigation guards',
        '9. Add navigation animations',
        '10. Generate navigation configuration'
      ],
      outputFormat: 'JSON with navigation implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationType', 'routes', 'artifacts'],
      properties: {
        navigationType: { type: 'string' },
        routes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'navigation']
}));

export const implementPlatformAdaptationsTask = defineTask('implement-platform-adaptations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: ${args.platform} Adaptations - ${args.projectName}`,
  agent: {
    name: 'platform-convention-advisor',
    prompt: {
      role: 'Platform UI Developer',
      task: `Implement ${args.platform}-specific UI adaptations`,
      context: args,
      instructions: [
        `1. Adapt UI to ${args.platform} conventions`,
        '2. Configure platform-specific window controls',
        '3. Adapt menu structure to platform',
        '4. Configure platform-specific shortcuts',
        '5. Adapt dialogs to platform style',
        '6. Configure platform-specific fonts',
        '7. Adapt spacing and sizing',
        '8. Configure platform theme integration',
        '9. Test platform-specific behaviors',
        '10. Document platform adaptations'
      ],
      outputFormat: 'JSON with platform adaptations'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'adaptations', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        adaptations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'platform-ui', args.platform]
}));

export const implementAccessibilityTask = defineTask('implement-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Accessibility - ${args.projectName}`,
  agent: {
    name: 'accessibility-developer',
    prompt: {
      role: 'Accessibility Developer',
      task: 'Implement accessibility features',
      context: args,
      instructions: [
        '1. Add ARIA attributes to components',
        '2. Implement keyboard navigation',
        '3. Configure focus management',
        '4. Add screen reader support',
        '5. Implement high contrast mode',
        '6. Configure reduced motion support',
        '7. Add role attributes',
        '8. Implement focus indicators',
        '9. Test with accessibility tools',
        '10. Generate accessibility report'
      ],
      outputFormat: 'JSON with accessibility implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['accessibilityScore', 'features', 'artifacts'],
      properties: {
        accessibilityScore: { type: 'number' },
        features: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'accessibility']
}));

export const implementAnimationsTask = defineTask('implement-animations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Animations - ${args.projectName}`,
  agent: {
    name: 'animation-developer',
    prompt: {
      role: 'UI Animation Developer',
      task: 'Implement UI animations and interactions',
      context: args,
      instructions: [
        '1. Define animation design tokens',
        '2. Implement transition utilities',
        '3. Create enter/exit animations',
        '4. Implement micro-interactions',
        '5. Add loading animations',
        '6. Create gesture responses',
        '7. Implement scroll animations',
        '8. Add hover/focus effects',
        '9. Configure reduced motion',
        '10. Generate animation library'
      ],
      outputFormat: 'JSON with animation implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'object' } },
        reducedMotionSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'animations']
}));

export const generateUiDocumentationTask = defineTask('generate-ui-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10a: UI Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'UI Documentation Writer',
      task: 'Generate UI documentation',
      context: args,
      instructions: [
        '1. Create style guide document',
        '2. Document component APIs',
        '3. Create usage examples',
        '4. Document theming system',
        '5. Create accessibility guidelines',
        '6. Document layout patterns',
        '7. Create animation guidelines',
        '8. Document platform differences',
        '9. Create troubleshooting guide',
        '10. Generate storybook/docs'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuidePath', 'componentDocsPath', 'artifacts'],
      properties: {
        styleGuidePath: { type: 'string' },
        componentDocsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'documentation']
}));

export const validateUiImplementationTask = defineTask('validate-ui-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10b: UI Validation - ${args.projectName}`,
  agent: {
    name: 'ui-validator',
    prompt: {
      role: 'UI Implementation Validator',
      task: 'Validate UI implementation',
      context: args,
      instructions: [
        '1. Validate component completeness',
        '2. Check design system compliance',
        '3. Verify accessibility implementation',
        '4. Check responsive behavior',
        '5. Validate platform adaptations',
        '6. Check animation performance',
        '7. Verify theming support',
        '8. Calculate validation score',
        '9. Identify issues',
        '10. Generate recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checks', 'nextSteps', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'validation']
}));
