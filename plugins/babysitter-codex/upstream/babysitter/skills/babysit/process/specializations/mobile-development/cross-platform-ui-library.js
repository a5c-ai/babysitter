/**
 * @process specializations/mobile-development/cross-platform-ui-library
 * @description Cross-Platform UI Component Library Creation - Build a shared, platform-aware UI component library
 * for consistent cross-platform design with accessibility support and comprehensive documentation.
 * @inputs { libraryName: string, designSystem?: object, platforms?: array, componentRequirements?: array, accessibilityLevel?: string }
 * @outputs { success: boolean, libraryPath: string, components: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/cross-platform-ui-library', {
 *   libraryName: 'MyUIKit',
 *   designSystem: { colors: {}, typography: {}, spacing: {} },
 *   platforms: ['ios', 'android'],
 *   componentRequirements: ['Button', 'Input', 'Card', 'Modal'],
 *   accessibilityLevel: 'WCAG-AA'
 * });
 *
 * @references
 * - React Native Paper: https://callstack.github.io/react-native-paper/
 * - Flutter Material/Cupertino: https://flutter.dev/docs/development/ui/widgets
 * - Design Systems: https://www.designsystems.com/
 * - WCAG Guidelines: https://www.w3.org/WAI/standards-guidelines/wcag/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    libraryName,
    designSystem = {},
    platforms = ['ios', 'android'],
    componentRequirements = ['Button', 'Input', 'Card', 'List', 'Modal'],
    accessibilityLevel = 'WCAG-AA',
    framework = 'react-native',
    outputDir = 'ui-library'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cross-Platform UI Library Creation: ${libraryName}`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}, Components: ${componentRequirements.length}`);

  // ============================================================================
  // PHASE 1: DESIGN SYSTEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing design system and creating component inventory');

  const designAnalysis = await ctx.task(designAnalysisTask, {
    libraryName,
    designSystem,
    componentRequirements,
    platforms,
    outputDir
  });

  artifacts.push(...designAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: THEME CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating base theme configuration');

  const themeConfig = await ctx.task(themeConfigTask, {
    libraryName,
    designSystem,
    designAnalysis,
    outputDir
  });

  artifacts.push(...themeConfig.artifacts);

  // ============================================================================
  // PHASE 3: PLATFORM DETECTION UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing platform detection utilities');

  const platformUtils = await ctx.task(platformUtilsTask, {
    libraryName,
    platforms,
    framework,
    outputDir
  });

  artifacts.push(...platformUtils.artifacts);

  // ============================================================================
  // PHASE 4: ATOMIC COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Building atomic components (buttons, inputs, cards)');

  const atomicComponents = await ctx.task(atomicComponentsTask, {
    libraryName,
    componentRequirements,
    themeConfig,
    platformUtils,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...atomicComponents.artifacts);

  // ============================================================================
  // PHASE 5: COMPOSITE COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating composite components (forms, lists, navigation)');

  const compositeComponents = await ctx.task(compositeComponentsTask, {
    libraryName,
    atomicComponents,
    themeConfig,
    outputDir
  });

  artifacts.push(...compositeComponents.artifacts);

  // ============================================================================
  // PHASE 6: PLATFORM-SPECIFIC VARIANTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing platform-specific variants');

  const platformVariants = await ctx.task(platformVariantsTask, {
    libraryName,
    platforms,
    atomicComponents,
    compositeComponents,
    outputDir
  });

  artifacts.push(...platformVariants.artifacts);

  // ============================================================================
  // PHASE 7: ACCESSIBILITY FEATURES
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding accessibility features');

  const accessibilityFeatures = await ctx.task(accessibilityFeaturesTask, {
    libraryName,
    accessibilityLevel,
    atomicComponents,
    compositeComponents,
    outputDir
  });

  artifacts.push(...accessibilityFeatures.artifacts);

  // Quality Gate: Accessibility Review
  await ctx.breakpoint({
    question: `Accessibility features implemented for ${libraryName}. Level: ${accessibilityLevel}. Review accessibility compliance?`,
    title: 'Accessibility Review',
    context: {
      runId: ctx.runId,
      libraryName,
      accessibilityLevel,
      accessibilityFeatures: accessibilityFeatures.features,
      complianceStatus: accessibilityFeatures.complianceStatus,
      files: accessibilityFeatures.artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 8: COMPONENT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating component documentation with examples');

  const componentDocs = await ctx.task(componentDocsTask, {
    libraryName,
    atomicComponents,
    compositeComponents,
    themeConfig,
    outputDir
  });

  artifacts.push(...componentDocs.artifacts);

  // ============================================================================
  // PHASE 9: STORYBOOK/DEMO APP
  // ============================================================================

  ctx.log('info', 'Phase 9: Building Storybook or interactive demo app');

  const demoApp = await ctx.task(demoAppTask, {
    libraryName,
    atomicComponents,
    compositeComponents,
    framework,
    outputDir
  });

  artifacts.push(...demoApp.artifacts);

  // ============================================================================
  // PHASE 10: UNIT TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Writing unit tests for components');

  const unitTests = await ctx.task(unitTestsTask, {
    libraryName,
    atomicComponents,
    compositeComponents,
    framework,
    outputDir
  });

  artifacts.push(...unitTests.artifacts);

  // ============================================================================
  // PHASE 11: USAGE GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating usage guidelines and best practices');

  const usageGuidelines = await ctx.task(usageGuidelinesTask, {
    libraryName,
    themeConfig,
    atomicComponents,
    compositeComponents,
    accessibilityFeatures,
    outputDir
  });

  artifacts.push(...usageGuidelines.artifacts);

  // ============================================================================
  // PHASE 12: PACKAGE PUBLISHING
  // ============================================================================

  ctx.log('info', 'Phase 12: Preparing component library as package');

  const packageSetup = await ctx.task(packageSetupTask, {
    libraryName,
    framework,
    outputDir
  });

  artifacts.push(...packageSetup.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    libraryName,
    libraryPath: packageSetup.packagePath,
    components: {
      atomic: atomicComponents.components,
      composite: compositeComponents.components,
      total: atomicComponents.components.length + compositeComponents.components.length
    },
    theme: themeConfig.theme,
    accessibility: {
      level: accessibilityLevel,
      compliance: accessibilityFeatures.complianceStatus,
      features: accessibilityFeatures.features
    },
    documentation: {
      componentDocs: componentDocs.docsPath,
      usageGuidelines: usageGuidelines.guidelinesPath,
      demoApp: demoApp.demoPath
    },
    testing: {
      testCount: unitTests.testCount,
      coverage: unitTests.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/cross-platform-ui-library',
      timestamp: startTime,
      platforms,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const designAnalysisTask = defineTask('design-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Analysis - ${args.libraryName}`,
  skill: { name: 'design-tokens' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'UI/UX Designer',
      task: 'Analyze design system and create component inventory',
      context: {
        libraryName: args.libraryName,
        designSystem: args.designSystem,
        componentRequirements: args.componentRequirements,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze design system specifications',
        '2. Create comprehensive component inventory',
        '3. Define component API and prop interfaces',
        '4. Identify platform-specific design requirements',
        '5. Map design tokens to theme variables',
        '6. Document component states and variants',
        '7. Define component hierarchy',
        '8. Identify shared patterns across components',
        '9. Create component specification document',
        '10. Generate design analysis report'
      ],
      outputFormat: 'JSON with design analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['componentInventory', 'designTokens', 'artifacts'],
      properties: {
        componentInventory: { type: 'array', items: { type: 'object' } },
        designTokens: { type: 'object' },
        platformRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'design-system']
}));

export const themeConfigTask = defineTask('theme-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Theme Configuration - ${args.libraryName}`,
  skill: { name: 'design-tokens' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'UI Theme Developer',
      task: 'Create base theme configuration',
      context: {
        libraryName: args.libraryName,
        designSystem: args.designSystem,
        designAnalysis: args.designAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create color palette with light and dark modes',
        '2. Define typography scale and font families',
        '3. Create spacing and sizing system',
        '4. Define border radius and shadow tokens',
        '5. Create animation timing and easing tokens',
        '6. Set up breakpoints for responsive design',
        '7. Create theme provider component',
        '8. Implement theme context and hooks',
        '9. Set up theme customization API',
        '10. Document theme configuration'
      ],
      outputFormat: 'JSON with theme configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['theme', 'artifacts'],
      properties: {
        theme: { type: 'object' },
        colors: { type: 'object' },
        typography: { type: 'object' },
        spacing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'theming']
}));

export const platformUtilsTask = defineTask('platform-utils', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Platform Utilities - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Cross-Platform Mobile Developer',
      task: 'Implement platform detection utilities',
      context: {
        libraryName: args.libraryName,
        platforms: args.platforms,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create platform detection utilities',
        '2. Implement device type detection (phone/tablet)',
        '3. Create screen size utilities',
        '4. Implement safe area handling',
        '5. Create platform-specific style utilities',
        '6. Implement responsive scaling functions',
        '7. Create keyboard handling utilities',
        '8. Implement haptic feedback utilities',
        '9. Create status bar utilities',
        '10. Document platform utilities'
      ],
      outputFormat: 'JSON with platform utilities'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'artifacts'],
      properties: {
        utilities: { type: 'array', items: { type: 'string' } },
        platformHooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'platform-utils']
}));

export const atomicComponentsTask = defineTask('atomic-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Atomic Components - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'UI Component Developer',
      task: 'Build atomic components (buttons, inputs, cards)',
      context: {
        libraryName: args.libraryName,
        componentRequirements: args.componentRequirements,
        themeConfig: args.themeConfig,
        platformUtils: args.platformUtils,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Button component with variants',
        '2. Create TextInput component with validation',
        '3. Create Card component with shadows',
        '4. Create Icon component wrapper',
        '5. Create Text component with typography',
        '6. Create Avatar component',
        '7. Create Badge component',
        '8. Create Divider component',
        '9. Implement consistent prop interfaces',
        '10. Add basic accessibility attributes'
      ],
      outputFormat: 'JSON with atomic components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        propTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'components', 'atomic']
}));

export const compositeComponentsTask = defineTask('composite-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Composite Components - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'UI Component Developer',
      task: 'Create composite components (forms, lists, navigation)',
      context: {
        libraryName: args.libraryName,
        atomicComponents: args.atomicComponents,
        themeConfig: args.themeConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Form component with validation',
        '2. Create List component with virtualization',
        '3. Create Modal component with animations',
        '4. Create BottomSheet component',
        '5. Create Header/AppBar component',
        '6. Create TabBar component',
        '7. Create Drawer component',
        '8. Create Alert/Dialog component',
        '9. Create Snackbar/Toast component',
        '10. Create SearchBar component'
      ],
      outputFormat: 'JSON with composite components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        propTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'components', 'composite']
}));

export const platformVariantsTask = defineTask('platform-variants', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Platform Variants - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Cross-Platform UI Developer',
      task: 'Implement platform-specific variants (iOS/Android styles)',
      context: {
        libraryName: args.libraryName,
        platforms: args.platforms,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create iOS-specific component variants',
        '2. Create Android/Material component variants',
        '3. Implement automatic platform detection',
        '4. Add platform prop for manual override',
        '5. Implement iOS navigation patterns',
        '6. Implement Android navigation patterns',
        '7. Add platform-specific animations',
        '8. Implement platform-specific gestures',
        '9. Create platform comparison documentation',
        '10. Test on both platforms'
      ],
      outputFormat: 'JSON with platform variants'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'artifacts'],
      properties: {
        variants: { type: 'object' },
        platformDifferences: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'platform-variants']
}));

export const accessibilityFeaturesTask = defineTask('accessibility-features', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Accessibility Features - ${args.libraryName}`,
  skill: { name: 'accessibility-testing' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Accessibility Specialist',
      task: 'Add accessibility features to all components',
      context: {
        libraryName: args.libraryName,
        accessibilityLevel: args.accessibilityLevel,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add accessibility labels and hints',
        '2. Implement screen reader support',
        '3. Add keyboard navigation support',
        '4. Implement focus management',
        '5. Add role and state attributes',
        '6. Ensure minimum touch target sizes',
        '7. Implement high contrast support',
        '8. Add reduce motion support',
        '9. Create accessibility testing utilities',
        '10. Generate accessibility compliance report'
      ],
      outputFormat: 'JSON with accessibility features'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'complianceStatus', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        complianceStatus: { type: 'string' },
        violations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'accessibility']
}));

export const componentDocsTask = defineTask('component-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Component Documentation - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Create comprehensive component documentation',
      context: {
        libraryName: args.libraryName,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        themeConfig: args.themeConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document each component with description',
        '2. Create prop tables with types and defaults',
        '3. Add usage examples for each component',
        '4. Document component variants',
        '5. Add accessibility documentation',
        '6. Create theming documentation',
        '7. Add migration guides',
        '8. Create API reference',
        '9. Add troubleshooting section',
        '10. Generate documentation site structure'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['docsPath', 'artifacts'],
      properties: {
        docsPath: { type: 'string' },
        componentDocs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'documentation']
}));

export const demoAppTask = defineTask('demo-app', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Demo App - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Mobile Developer',
      task: 'Build Storybook or interactive demo app',
      context: {
        libraryName: args.libraryName,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up Storybook for React Native (or demo app for Flutter)',
        '2. Create stories for all atomic components',
        '3. Create stories for composite components',
        '4. Add controls for interactive prop editing',
        '5. Implement theme switching in demo',
        '6. Add accessibility inspection tools',
        '7. Create component playground',
        '8. Add search and navigation',
        '9. Configure demo app build',
        '10. Document demo app usage'
      ],
      outputFormat: 'JSON with demo app details'
    },
    outputSchema: {
      type: 'object',
      required: ['demoPath', 'artifacts'],
      properties: {
        demoPath: { type: 'string' },
        stories: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'storybook', 'demo']
}));

export const unitTestsTask = defineTask('unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Unit Tests - ${args.libraryName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Test Engineer',
      task: 'Write unit tests for all components',
      context: {
        libraryName: args.libraryName,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create test utilities and helpers',
        '2. Write render tests for each component',
        '3. Test component prop variations',
        '4. Test user interactions (press, input)',
        '5. Test accessibility features',
        '6. Test theming integration',
        '7. Test platform-specific behavior',
        '8. Add snapshot tests',
        '9. Configure coverage reporting',
        '10. Set up CI test pipeline'
      ],
      outputFormat: 'JSON with test details'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'testing']
}));

export const usageGuidelinesTask = defineTask('usage-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Usage Guidelines - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Technical Writer',
      task: 'Create usage guidelines and best practices',
      context: {
        libraryName: args.libraryName,
        themeConfig: args.themeConfig,
        atomicComponents: args.atomicComponents,
        compositeComponents: args.compositeComponents,
        accessibilityFeatures: args.accessibilityFeatures,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create component usage patterns',
        '2. Document theming best practices',
        '3. Write accessibility guidelines',
        '4. Create performance optimization guide',
        '5. Document common patterns and recipes',
        '6. Add do/do-not examples',
        '7. Create migration guides',
        '8. Document testing patterns',
        '9. Add contribution guidelines',
        '10. Create changelog template'
      ],
      outputFormat: 'JSON with guidelines paths'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelinesPath', 'artifacts'],
      properties: {
        guidelinesPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'guidelines']
}));

export const packageSetupTask = defineTask('package-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Package Setup - ${args.libraryName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Mobile Package Developer',
      task: 'Prepare component library as publishable package',
      context: {
        libraryName: args.libraryName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure package.json / pubspec.yaml',
        '2. Set up build configuration',
        '3. Configure TypeScript declarations (RN)',
        '4. Set up semantic versioning',
        '5. Create changelog',
        '6. Configure npm/pub publishing',
        '7. Set up peer dependencies',
        '8. Create installation documentation',
        '9. Configure bundle optimization',
        '10. Create release workflow'
      ],
      outputFormat: 'JSON with package details'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        packageName: { type: 'string' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ui-library', 'packaging']
}));
