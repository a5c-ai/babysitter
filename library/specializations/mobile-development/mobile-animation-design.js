/**
 * @process specializations/mobile-development/mobile-animation-design
 * @description Mobile Animation and Interaction Design - Implement smooth animations, gestures, and micro-interactions
 * for engaging mobile user experiences following platform animation guidelines.
 * @inputs { appName: string, animationTypes?: array, framework?: string, performanceTarget?: string }
 * @outputs { success: boolean, animations: array, gestures: array, performance: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-animation-design', {
 *   appName: 'MyApp',
 *   animationTypes: ['transitions', 'gestures', 'micro-interactions'],
 *   framework: 'react-native',
 *   performanceTarget: '60fps'
 * });
 *
 * @references
 * - React Native Reanimated: https://docs.swmansion.com/react-native-reanimated/
 * - Flutter Animations: https://flutter.dev/docs/development/ui/animations
 * - iOS Animations: https://developer.apple.com/documentation/uikit/animation_and_haptics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    animationTypes = ['transitions', 'gestures', 'micro-interactions'],
    framework = 'react-native',
    performanceTarget = '60fps',
    hapticFeedback = true,
    outputDir = 'mobile-animation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Mobile Animation Design: ${appName}`);
  ctx.log('info', `Animation Types: ${animationTypes.join(', ')}, Target: ${performanceTarget}`);

  // ============================================================================
  // PHASE 1: ANIMATION LIBRARY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up animation library');

  const librarySetup = await ctx.task(librarySetupTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...librarySetup.artifacts);

  // ============================================================================
  // PHASE 2: ANIMATION PRIMITIVES
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating animation primitives');

  const animationPrimitives = await ctx.task(animationPrimitivesTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...animationPrimitives.artifacts);

  // ============================================================================
  // PHASE 3: TRANSITION ANIMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing transition animations');

  const transitions = await ctx.task(transitionsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...transitions.artifacts);

  // ============================================================================
  // PHASE 4: GESTURE HANDLERS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing gesture handlers');

  const gestureHandlers = await ctx.task(gestureHandlersTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...gestureHandlers.artifacts);

  // ============================================================================
  // PHASE 5: MICRO-INTERACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating micro-interactions');

  const microInteractions = await ctx.task(microInteractionsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...microInteractions.artifacts);

  // ============================================================================
  // PHASE 6: LOADING ANIMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing loading animations');

  const loadingAnimations = await ctx.task(loadingAnimationsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...loadingAnimations.artifacts);

  // ============================================================================
  // PHASE 7: NAVIGATION ANIMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating navigation animations');

  const navigationAnimations = await ctx.task(navigationAnimationsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...navigationAnimations.artifacts);

  // ============================================================================
  // PHASE 8: LIST ANIMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing list animations');

  const listAnimations = await ctx.task(listAnimationsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...listAnimations.artifacts);

  // ============================================================================
  // PHASE 9: HAPTIC FEEDBACK
  // ============================================================================

  if (hapticFeedback) {
    ctx.log('info', 'Phase 9: Adding haptic feedback');

    const hapticSetup = await ctx.task(hapticSetupTask, {
      appName,
      framework,
      outputDir
    });

    artifacts.push(...hapticSetup.artifacts);
  }

  // Quality Gate: Animation Review
  await ctx.breakpoint({
    question: `Animation system created for ${appName}. Types: ${animationTypes.join(', ')}, Target: ${performanceTarget}. Review implementation?`,
    title: 'Animation Review',
    context: {
      runId: ctx.runId,
      appName,
      animationTypes,
      performanceTarget,
      animations: animationPrimitives.animations,
      gestures: gestureHandlers.gestures,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 10: SPRING PHYSICS
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing spring physics');

  const springPhysics = await ctx.task(springPhysicsTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...springPhysics.artifacts);

  // ============================================================================
  // PHASE 11: ACCESSIBILITY MOTION
  // ============================================================================

  ctx.log('info', 'Phase 11: Handling reduced motion preferences');

  const accessibilityMotion = await ctx.task(accessibilityMotionTask, {
    appName,
    framework,
    outputDir
  });

  artifacts.push(...accessibilityMotion.artifacts);

  // ============================================================================
  // PHASE 12: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Optimizing animation performance');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    appName,
    framework,
    performanceTarget,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    animations: {
      primitives: animationPrimitives.animations,
      transitions: transitions.transitions,
      microInteractions: microInteractions.interactions,
      loading: loadingAnimations.animations
    },
    gestures: gestureHandlers.gestures,
    navigation: navigationAnimations.animations,
    haptics: hapticFeedback,
    accessibility: accessibilityMotion.features,
    performance: {
      target: performanceTarget,
      optimizations: performanceOptimization.optimizations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/mobile-animation-design',
      timestamp: startTime,
      framework,
      performanceTarget
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const librarySetupTask = defineTask('library-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Animation Library Setup - ${args.appName}`,
  skill: { name: 'gesture-animation' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Animation Specialist',
      task: 'Set up animation library (Reanimated, Flutter animations, etc.)',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install animation library',
        '2. Configure babel plugin (Reanimated)',
        '3. Set up gesture handler library',
        '4. Configure worklets if needed',
        '5. Add animation utilities',
        '6. Set up animation timing functions',
        '7. Configure interpolation utilities',
        '8. Add easing functions',
        '9. Test basic animation',
        '10. Document setup'
      ],
      outputFormat: 'JSON with library setup'
    },
    outputSchema: {
      type: 'object',
      required: ['library', 'artifacts'],
      properties: {
        library: { type: 'string' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'setup']
}));

export const animationPrimitivesTask = defineTask('animation-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Animation Primitives - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Animation Developer',
      task: 'Create animation primitives and hooks',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create fade animation',
        '2. Create scale animation',
        '3. Create translate animation',
        '4. Create rotate animation',
        '5. Implement combined transforms',
        '6. Create animation hooks',
        '7. Implement timing animations',
        '8. Create spring animations',
        '9. Add animation presets',
        '10. Document animation primitives'
      ],
      outputFormat: 'JSON with animation primitives'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'string' } },
        hooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'primitives']
}));

export const transitionsTask = defineTask('transitions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Transitions - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Transition Specialist',
      task: 'Implement view and screen transitions',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create entering animations',
        '2. Create exiting animations',
        '3. Implement layout animations',
        '4. Create shared element transitions',
        '5. Implement crossfade transitions',
        '6. Create slide transitions',
        '7. Implement flip transitions',
        '8. Create custom transition builders',
        '9. Handle staggered transitions',
        '10. Document transition patterns'
      ],
      outputFormat: 'JSON with transitions'
    },
    outputSchema: {
      type: 'object',
      required: ['transitions', 'artifacts'],
      properties: {
        transitions: { type: 'array', items: { type: 'string' } },
        entering: { type: 'array', items: { type: 'string' } },
        exiting: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'transitions']
}));

export const gestureHandlersTask = defineTask('gesture-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Gesture Handlers - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Gesture Specialist',
      task: 'Implement gesture handlers',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement tap gesture',
        '2. Create pan gesture handler',
        '3. Implement pinch gesture',
        '4. Create rotation gesture',
        '5. Implement long press',
        '6. Create swipe gestures',
        '7. Implement fling gesture',
        '8. Create gesture composition',
        '9. Handle simultaneous gestures',
        '10. Document gesture patterns'
      ],
      outputFormat: 'JSON with gesture handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['gestures', 'artifacts'],
      properties: {
        gestures: { type: 'array', items: { type: 'string' } },
        handlers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'gestures']
}));

export const microInteractionsTask = defineTask('micro-interactions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Micro-interactions - ${args.appName}`,
  agent: {
    name: 'mobile-interaction-designer',
    prompt: {
      role: 'Mobile Interaction Designer',
      task: 'Create micro-interactions for buttons, inputs, etc.',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create button press animation',
        '2. Implement input focus animation',
        '3. Create toggle animations',
        '4. Implement checkbox animation',
        '5. Create success/error feedback',
        '6. Implement pull-to-refresh animation',
        '7. Create like/heart animation',
        '8. Implement menu open animation',
        '9. Create tooltip animation',
        '10. Document micro-interactions'
      ],
      outputFormat: 'JSON with micro-interactions'
    },
    outputSchema: {
      type: 'object',
      required: ['interactions', 'artifacts'],
      properties: {
        interactions: { type: 'array', items: { type: 'string' } },
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'micro-interactions']
}));

export const loadingAnimationsTask = defineTask('loading-animations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Loading Animations - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Loading Animation Developer',
      task: 'Implement loading and progress animations',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create spinner animation',
        '2. Implement progress bar animation',
        '3. Create skeleton loading',
        '4. Implement shimmer effect',
        '5. Create pulse animation',
        '6. Implement circular progress',
        '7. Create custom loader',
        '8. Implement Lottie integration',
        '9. Create upload progress animation',
        '10. Document loading patterns'
      ],
      outputFormat: 'JSON with loading animations'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'string' } },
        loaders: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'loading']
}));

export const navigationAnimationsTask = defineTask('navigation-animations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Navigation Animations - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Navigation Animation Specialist',
      task: 'Create navigation and screen transition animations',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create push/pop transitions',
        '2. Implement modal presentations',
        '3. Create tab switch animations',
        '4. Implement drawer animations',
        '5. Create bottom sheet animations',
        '6. Implement hero/shared element',
        '7. Create parallax transitions',
        '8. Implement gesture-based navigation',
        '9. Handle back gesture animation',
        '10. Document navigation animations'
      ],
      outputFormat: 'JSON with navigation animations'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'string' } },
        transitions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'navigation']
}));

export const listAnimationsTask = defineTask('list-animations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: List Animations - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile List Animation Developer',
      task: 'Implement list and collection animations',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create staggered list animations',
        '2. Implement item enter animations',
        '3. Create swipe-to-delete animation',
        '4. Implement drag-to-reorder',
        '5. Create expand/collapse animations',
        '6. Implement pull-to-refresh animation',
        '7. Create pagination animation',
        '8. Implement scroll-based animations',
        '9. Create item press feedback',
        '10. Document list animations'
      ],
      outputFormat: 'JSON with list animations'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'string' } },
        listAnimations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'lists']
}));

export const hapticSetupTask = defineTask('haptic-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Haptic Feedback - ${args.appName}`,
  skill: { name: 'gesture-animation' },
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Mobile Haptics Specialist',
      task: 'Add haptic feedback for interactions',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up haptic library',
        '2. Implement impact feedback',
        '3. Create selection feedback',
        '4. Implement notification feedback',
        '5. Add haptic to button press',
        '6. Implement gesture haptics',
        '7. Create custom haptic patterns',
        '8. Handle device capability check',
        '9. Respect system haptic settings',
        '10. Document haptic patterns'
      ],
      outputFormat: 'JSON with haptic setup'
    },
    outputSchema: {
      type: 'object',
      required: ['haptics', 'artifacts'],
      properties: {
        haptics: { type: 'array', items: { type: 'string' } },
        feedbackTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'haptics']
}));

export const springPhysicsTask = defineTask('spring-physics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Spring Physics - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Physics Animation Specialist',
      task: 'Implement spring physics for natural animations',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure spring parameters (mass, damping)',
        '2. Create spring animation presets',
        '3. Implement bounce effect',
        '4. Create rubber band effect',
        '5. Implement gravity simulation',
        '6. Create momentum scrolling',
        '7. Implement physics-based gestures',
        '8. Create velocity-based animations',
        '9. Implement decay animations',
        '10. Document spring physics'
      ],
      outputFormat: 'JSON with spring physics'
    },
    outputSchema: {
      type: 'object',
      required: ['springs', 'artifacts'],
      properties: {
        springs: { type: 'array', items: { type: 'object' } },
        presets: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'spring-physics']
}));

export const accessibilityMotionTask = defineTask('accessibility-motion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Accessibility Motion - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Accessibility Animation Specialist',
      task: 'Handle reduced motion preferences',
      context: {
        appName: args.appName,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect reduced motion setting',
        '2. Create useReducedMotion hook',
        '3. Provide animation alternatives',
        '4. Disable parallax effects',
        '5. Reduce motion intensity',
        '6. Provide instant transitions option',
        '7. Handle system preference changes',
        '8. Test with reduced motion',
        '9. Document accessibility features',
        '10. Create accessibility guidelines'
      ],
      outputFormat: 'JSON with accessibility motion'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        hooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'accessibility']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Performance Optimization - ${args.appName}`,
  agent: {
    name: 'mobile-ux-engineer',
    prompt: {
      role: 'Animation Performance Engineer',
      task: 'Optimize animation performance for 60fps',
      context: {
        appName: args.appName,
        framework: args.framework,
        performanceTarget: args.performanceTarget,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use native driver where possible',
        '2. Avoid JS thread animations',
        '3. Optimize transform animations',
        '4. Use will-change hints',
        '5. Reduce layout thrashing',
        '6. Implement animation batching',
        '7. Profile with performance tools',
        '8. Handle low-end devices',
        '9. Create performance benchmarks',
        '10. Document optimization patterns'
      ],
      outputFormat: 'JSON with performance optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'animation', 'performance']
}));
