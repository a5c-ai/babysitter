/**
 * @process specializations/mobile-development/responsive-mobile-layout
 * @description Responsive Mobile Layout Implementation - Build responsive layouts that adapt to different screen sizes,
 * orientations, and device types using platform-specific techniques and best practices.
 * @inputs { appName: string, targetDevices?: array, orientations?: array, framework?: string, breakpoints?: object }
 * @outputs { success: boolean, layouts: array, breakpoints: object, utilities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/responsive-mobile-layout', {
 *   appName: 'MyApp',
 *   targetDevices: ['phone', 'tablet'],
 *   orientations: ['portrait', 'landscape'],
 *   framework: 'react-native',
 *   breakpoints: { phone: 320, tablet: 768, desktop: 1024 }
 * });
 *
 * @references
 * - React Native Dimensions: https://reactnative.dev/docs/dimensions
 * - Flutter LayoutBuilder: https://api.flutter.dev/flutter/widgets/LayoutBuilder-class.html
 * - iOS Size Classes: https://developer.apple.com/design/human-interface-guidelines/layout
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    targetDevices = ['phone', 'tablet'],
    orientations = ['portrait', 'landscape'],
    framework = 'react-native',
    breakpoints = { phone: 320, tablet: 768 },
    outputDir = 'responsive-layout'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Responsive Layout Implementation: ${appName}`);
  ctx.log('info', `Framework: ${framework}, Devices: ${targetDevices.join(', ')}`);

  // ============================================================================
  // PHASE 1: RESPONSIVE STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining responsive strategy');

  const responsiveStrategy = await ctx.task(responsiveStrategyTask, {
    appName,
    targetDevices,
    orientations,
    framework,
    breakpoints,
    outputDir
  });

  artifacts.push(...responsiveStrategy.artifacts);

  // ============================================================================
  // PHASE 2: BREAKPOINT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring breakpoints');

  const breakpointConfig = await ctx.task(breakpointConfigTask, {
    appName,
    breakpoints,
    framework,
    outputDir
  });

  artifacts.push(...breakpointConfig.artifacts);

  // ============================================================================
  // PHASE 3: DIMENSION UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating dimension utilities');

  const dimensionUtils = await ctx.task(dimensionUtilsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...dimensionUtils.artifacts);

  // ============================================================================
  // PHASE 4: RESPONSIVE HOOKS/UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Building responsive hooks and utilities');

  const responsiveHooks = await ctx.task(responsiveHooksTask, {
    appName,
    framework,
    breakpointConfig,
    outputDir
  });

  artifacts.push(...responsiveHooks.artifacts);

  // ============================================================================
  // PHASE 5: FLEXIBLE CONTAINERS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating flexible container components');

  const flexibleContainers = await ctx.task(flexibleContainersTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...flexibleContainers.artifacts);

  // ============================================================================
  // PHASE 6: ADAPTIVE LAYOUTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing adaptive layouts');

  const adaptiveLayouts = await ctx.task(adaptiveLayoutsTask, {
    appName,
    targetDevices,
    framework,
    outputDir
  });

  artifacts.push(...adaptiveLayouts.artifacts);

  // ============================================================================
  // PHASE 7: ORIENTATION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Handling orientation changes');

  const orientationHandling = await ctx.task(orientationHandlingTask, {
    appName,
    orientations,
    framework,
    outputDir
  });

  artifacts.push(...orientationHandling.artifacts);

  // ============================================================================
  // PHASE 8: SAFE AREA HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing safe area handling');

  const safeAreaHandling = await ctx.task(safeAreaHandlingTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...safeAreaHandling.artifacts);

  // Quality Gate: Layout Review
  await ctx.breakpoint({
    question: `Responsive layout system created for ${appName}. Devices: ${targetDevices.join(', ')}, Orientations: ${orientations.join(', ')}. Review implementation?`,
    title: 'Responsive Layout Review',
    context: {
      runId: ctx.runId,
      appName,
      targetDevices,
      orientations,
      breakpoints,
      utilities: responsiveHooks.hooks,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 9: RESPONSIVE TEXT
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing responsive typography');

  const responsiveText = await ctx.task(responsiveTextTask, {
    appName,
    framework,
    breakpointConfig,
    outputDir
  });

  artifacts.push(...responsiveText.artifacts);

  // ============================================================================
  // PHASE 10: RESPONSIVE IMAGES
  // ============================================================================

  ctx.log('info', 'Phase 10: Handling responsive images');

  const responsiveImages = await ctx.task(responsiveImagesTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...responsiveImages.artifacts);

  // ============================================================================
  // PHASE 11: GRID SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 11: Building responsive grid system');

  const gridSystem = await ctx.task(gridSystemTask, {
    appName,
    framework,
    breakpointConfig,
    outputDir
  });

  artifacts.push(...gridSystem.artifacts);

  // ============================================================================
  // PHASE 12: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Testing responsive layouts');

  const responsiveTesting = await ctx.task(responsiveTestingTask, {
    appName,
    targetDevices,
    orientations,
    framework,
    outputDir
  });

  artifacts.push(...responsiveTesting.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    layouts: adaptiveLayouts.layouts,
    breakpoints: breakpointConfig.breakpoints,
    utilities: {
      hooks: responsiveHooks.hooks,
      dimensionUtils: dimensionUtils.utilities,
      containers: flexibleContainers.components
    },
    gridSystem: gridSystem.grid,
    safeArea: safeAreaHandling.utilities,
    testing: responsiveTesting.testResults,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/responsive-mobile-layout',
      timestamp: startTime,
      framework,
      targetDevices
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const responsiveStrategyTask = defineTask('responsive-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Responsive Strategy - ${args.appName}`,
  agent: {
    name: 'mobile-ui-architect',
    prompt: {
      role: 'Mobile UI Architect',
      task: 'Define responsive strategy for the application',
      context: {
        appName: args.appName,
        targetDevices: args.targetDevices,
        orientations: args.orientations,
        framework: args.framework,
        breakpoints: args.breakpoints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze target device requirements',
        '2. Define responsive approach (fluid vs adaptive)',
        '3. Document breakpoint strategy',
        '4. Plan layout variations per device',
        '5. Define orientation handling approach',
        '6. Document scaling strategy',
        '7. Plan component responsiveness',
        '8. Define testing strategy',
        '9. Document performance considerations',
        '10. Create responsive design guide'
      ],
      outputFormat: 'JSON with responsive strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        approach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'strategy']
}));

export const breakpointConfigTask = defineTask('breakpoint-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Breakpoint Configuration - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Layout Developer',
      task: 'Configure breakpoints for responsive layouts',
      context: {
        appName: args.appName,
        breakpoints: args.breakpoints,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define breakpoint values',
        '2. Create breakpoint constants/enum',
        '3. Implement breakpoint detection',
        '4. Create breakpoint context/provider',
        '5. Add device type detection',
        '6. Handle edge cases',
        '7. Create breakpoint utilities',
        '8. Add TypeScript types',
        '9. Test breakpoint detection',
        '10. Document breakpoint system'
      ],
      outputFormat: 'JSON with breakpoint configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['breakpoints', 'artifacts'],
      properties: {
        breakpoints: { type: 'object' },
        detectionMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'breakpoints']
}));

export const dimensionUtilsTask = defineTask('dimension-utils', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dimension Utilities - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Layout Developer',
      task: 'Create dimension and scaling utilities',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create screen dimension getter',
        '2. Implement width/height percentage utils',
        '3. Create scaling functions (wp, hp)',
        '4. Implement font scaling',
        '5. Add pixel ratio handling',
        '6. Create dimension listeners',
        '7. Handle window vs screen dimensions',
        '8. Add platform-specific handling',
        '9. Create responsive value calculator',
        '10. Document dimension utilities'
      ],
      outputFormat: 'JSON with dimension utilities'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'artifacts'],
      properties: {
        utilities: { type: 'array', items: { type: 'string' } },
        scalingFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'dimensions']
}));

export const responsiveHooksTask = defineTask('responsive-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Responsive Hooks - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Hook Developer',
      task: 'Build responsive hooks and utilities',
      context: {
        appName: args.appName,
        framework: args.framework,
        breakpointConfig: args.breakpointConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create useWindowDimensions hook',
        '2. Create useBreakpoint hook',
        '3. Implement useDeviceType hook',
        '4. Create useOrientation hook',
        '5. Implement useResponsiveValue hook',
        '6. Create useMediaQuery hook',
        '7. Add dimension change listeners',
        '8. Implement useIsMobile/useIsTablet',
        '9. Create responsive context',
        '10. Document hook usage'
      ],
      outputFormat: 'JSON with responsive hooks'
    },
    outputSchema: {
      type: 'object',
      required: ['hooks', 'artifacts'],
      properties: {
        hooks: { type: 'array', items: { type: 'string' } },
        context: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'hooks']
}));

export const flexibleContainersTask = defineTask('flexible-containers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Flexible Containers - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile UI Developer',
      task: 'Create flexible container components',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create ResponsiveContainer component',
        '2. Implement Flex wrapper component',
        '3. Create auto-sizing container',
        '4. Implement ScrollView wrapper',
        '5. Create aspect ratio container',
        '6. Implement max-width container',
        '7. Create centered container',
        '8. Implement padding container',
        '9. Create responsive spacing component',
        '10. Document container usage'
      ],
      outputFormat: 'JSON with flexible containers'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'containers']
}));

export const adaptiveLayoutsTask = defineTask('adaptive-layouts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Adaptive Layouts - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Layout Developer',
      task: 'Implement adaptive layouts for different devices',
      context: {
        appName: args.appName,
        targetDevices: args.targetDevices,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create phone-specific layouts',
        '2. Create tablet-specific layouts',
        '3. Implement layout switcher',
        '4. Create master-detail layout for tablets',
        '5. Implement split view for tablets',
        '6. Create adaptive navigation',
        '7. Implement content adaptation',
        '8. Create responsive card layouts',
        '9. Handle layout transitions',
        '10. Document adaptive patterns'
      ],
      outputFormat: 'JSON with adaptive layouts'
    },
    outputSchema: {
      type: 'object',
      required: ['layouts', 'artifacts'],
      properties: {
        layouts: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'adaptive']
}));

export const orientationHandlingTask = defineTask('orientation-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Orientation Handling - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Orientation Specialist',
      task: 'Handle orientation changes',
      context: {
        appName: args.appName,
        orientations: args.orientations,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect orientation changes',
        '2. Create orientation listener',
        '3. Implement portrait-specific layouts',
        '4. Implement landscape-specific layouts',
        '5. Handle orientation lock',
        '6. Preserve state on rotation',
        '7. Animate orientation transitions',
        '8. Handle keyboard with orientation',
        '9. Test orientation scenarios',
        '10. Document orientation handling'
      ],
      outputFormat: 'JSON with orientation handling'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: { type: 'array', items: { type: 'string' } },
        layouts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'orientation']
}));

export const safeAreaHandlingTask = defineTask('safe-area-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Safe Area Handling - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Safe Area Specialist',
      task: 'Implement safe area handling',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Get safe area insets',
        '2. Create SafeAreaView wrapper',
        '3. Handle notch/Dynamic Island',
        '4. Handle home indicator area',
        '5. Handle status bar height',
        '6. Create safe area hooks',
        '7. Handle keyboard safe area',
        '8. Implement edge-to-edge design',
        '9. Test on various devices',
        '10. Document safe area utilities'
      ],
      outputFormat: 'JSON with safe area handling'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'artifacts'],
      properties: {
        utilities: { type: 'array', items: { type: 'string' } },
        insets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'safe-area']
}));

export const responsiveTextTask = defineTask('responsive-text', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Responsive Text - ${args.appName}`,
  agent: {
    name: 'mobile-typography-specialist',
    prompt: {
      role: 'Mobile Typography Specialist',
      task: 'Implement responsive typography',
      context: {
        appName: args.appName,
        framework: args.framework,
        breakpointConfig: args.breakpointConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create responsive font scale',
        '2. Implement font size scaling',
        '3. Handle Dynamic Type (iOS)',
        '4. Handle font scaling (Android)',
        '5. Create responsive text component',
        '6. Implement line height scaling',
        '7. Handle text truncation responsively',
        '8. Create typography variants',
        '9. Test accessibility scaling',
        '10. Document responsive typography'
      ],
      outputFormat: 'JSON with responsive text'
    },
    outputSchema: {
      type: 'object',
      required: ['typography', 'artifacts'],
      properties: {
        typography: { type: 'object' },
        scalingFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'typography']
}));

export const responsiveImagesTask = defineTask('responsive-images', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Responsive Images - ${args.appName}`,
  skill: { name: 'responsive-design' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Image Specialist',
      task: 'Handle responsive images',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create responsive image component',
        '2. Handle different image resolutions',
        '3. Implement aspect ratio preservation',
        '4. Handle cover/contain modes',
        '5. Implement lazy loading',
        '6. Handle placeholder images',
        '7. Create image size variants',
        '8. Optimize for different densities',
        '9. Handle image loading states',
        '10. Document image handling'
      ],
      outputFormat: 'JSON with responsive images'
    },
    outputSchema: {
      type: 'object',
      required: ['imageHandling', 'artifacts'],
      properties: {
        imageHandling: { type: 'object' },
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'images']
}));

export const gridSystemTask = defineTask('grid-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Grid System - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Grid Specialist',
      task: 'Build responsive grid system',
      context: {
        appName: args.appName,
        framework: args.framework,
        breakpointConfig: args.breakpointConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Grid component',
        '2. Implement Row component',
        '3. Create Column component',
        '4. Add responsive column sizing',
        '5. Implement gutters/spacing',
        '6. Create nested grid support',
        '7. Add offset support',
        '8. Implement order control',
        '9. Handle wrap behavior',
        '10. Document grid system'
      ],
      outputFormat: 'JSON with grid system'
    },
    outputSchema: {
      type: 'object',
      required: ['grid', 'artifacts'],
      properties: {
        grid: { type: 'object' },
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'grid']
}));

export const responsiveTestingTask = defineTask('responsive-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Responsive Testing - ${args.appName}`,
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Mobile Test Engineer',
      task: 'Test responsive layouts',
      context: {
        appName: args.appName,
        targetDevices: args.targetDevices,
        orientations: args.orientations,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create device dimension test matrix',
        '2. Test phone layouts',
        '3. Test tablet layouts',
        '4. Test orientation changes',
        '5. Test breakpoint transitions',
        '6. Test safe area handling',
        '7. Test text scaling',
        '8. Create visual regression tests',
        '9. Test on real devices',
        '10. Document test results'
      ],
      outputFormat: 'JSON with responsive testing'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: { type: 'object' },
        deviceMatrix: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'responsive', 'testing']
}));
