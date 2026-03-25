/**
 * @process specializations/game-development/ui-ux-implementation
 * @description Game UI/UX Design and Implementation Process - Design and implement user interface including
 * HUD, menus, input handling, accessibility features, and responsive design for target platforms.
 * @inputs { projectName: string, uiStyle?: string, targetPlatforms?: array, accessibilityLevel?: string, outputDir?: string }
 * @outputs { success: boolean, uiScreens: array, styleGuide: string, accessibilityReport: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/ui-ux-implementation', {
 *   projectName: 'Stellar Odyssey',
 *   uiStyle: 'minimalist-sci-fi',
 *   targetPlatforms: ['PC', 'console'],
 *   accessibilityLevel: 'AA'
 * });
 *
 * @references
 * - Game UI Design: Best Practices
 * - WCAG 2.1 Accessibility Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    uiStyle = 'modern',
    targetPlatforms = ['PC'],
    accessibilityLevel = 'AA',
    controllerSupport = true,
    localizationRequired = true,
    outputDir = 'ui-ux-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UI/UX Implementation: ${projectName}`);

  // Phase 1: UI/UX Design Direction
  const designDirection = await ctx.task(uiDesignDirectionTask, {
    projectName, uiStyle, targetPlatforms, outputDir
  });
  artifacts.push(...designDirection.artifacts);

  // Phase 2: Wireframing
  const wireframes = await ctx.task(wireframingTask, {
    projectName, designDirection, outputDir
  });
  artifacts.push(...wireframes.artifacts);

  // Phase 3: Visual Design
  const visualDesign = await ctx.task(uiVisualDesignTask, {
    projectName, designDirection, wireframes, outputDir
  });
  artifacts.push(...visualDesign.artifacts);

  await ctx.breakpoint({
    question: `UI visual design complete for ${projectName}. ${visualDesign.screenCount} screens designed. Review mockups before implementation?`,
    title: 'UI Visual Design Review',
    context: { runId: ctx.runId, screens: visualDesign.screens, styleGuide: visualDesign.styleGuidePath }
  });

  // Phase 4: HUD Implementation
  const hudImplementation = await ctx.task(hudImplementationTask, {
    projectName, visualDesign, outputDir
  });
  artifacts.push(...hudImplementation.artifacts);

  // Phase 5: Menu Systems
  const menuSystems = await ctx.task(menuSystemsTask, {
    projectName, visualDesign, controllerSupport, outputDir
  });
  artifacts.push(...menuSystems.artifacts);

  // Phase 6: Input Handling
  const inputHandling = await ctx.task(inputHandlingTask, {
    projectName, targetPlatforms, controllerSupport, outputDir
  });
  artifacts.push(...inputHandling.artifacts);

  // Phase 7: Accessibility
  const accessibility = await ctx.task(uiAccessibilityTask, {
    projectName, accessibilityLevel, outputDir
  });
  artifacts.push(...accessibility.artifacts);

  // Phase 8: Localization Support
  const localization = await ctx.task(uiLocalizationTask, {
    projectName, localizationRequired, outputDir
  });
  artifacts.push(...localization.artifacts);

  // Phase 9: UI Testing
  const uiTesting = await ctx.task(uiTestingTask, {
    projectName, hudImplementation, menuSystems, accessibilityLevel, outputDir
  });
  artifacts.push(...uiTesting.artifacts);

  return {
    success: true,
    projectName,
    uiScreens: visualDesign.screens,
    styleGuide: visualDesign.styleGuidePath,
    accessibilityReport: accessibility.reportPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/ui-ux-implementation', timestamp: startTime, outputDir }
  };
}

export const uiDesignDirectionTask = defineTask('ui-design-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Design Direction - ${args.projectName}`,
  agent: {
    name: 'ui-designer-agent',
    prompt: { role: 'UI Designer', task: 'Define UI design direction', context: args, instructions: ['1. Define visual style', '2. Create mood boards', '3. Define typography', '4. Define color palette'] },
    outputSchema: { type: 'object', required: ['styleDefinition', 'colorPalette', 'artifacts'], properties: { styleDefinition: { type: 'object' }, colorPalette: { type: 'array' }, typography: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'design-direction']
}));

export const wireframingTask = defineTask('wireframing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wireframing - ${args.projectName}`,
  agent: {
    name: 'ux-designer-agent',
    prompt: { role: 'UX Designer', task: 'Create UI wireframes', context: args, instructions: ['1. Wireframe HUD elements', '2. Wireframe menus', '3. Define navigation flow', '4. Create interaction patterns'] },
    outputSchema: { type: 'object', required: ['wireframes', 'navigationFlow', 'artifacts'], properties: { wireframes: { type: 'array' }, navigationFlow: { type: 'object' }, interactionPatterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'wireframing']
}));

export const uiVisualDesignTask = defineTask('ui-visual-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visual Design - ${args.projectName}`,
  agent: {
    name: 'ui-designer-agent',
    prompt: { role: 'UI Artist', task: 'Create final UI designs', context: args, instructions: ['1. Design all UI screens', '2. Create UI assets', '3. Create style guide', '4. Design animations'] },
    outputSchema: { type: 'object', required: ['screens', 'screenCount', 'styleGuidePath', 'artifacts'], properties: { screens: { type: 'array' }, screenCount: { type: 'number' }, styleGuidePath: { type: 'string' }, assets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'visual-design']
}));

export const hudImplementationTask = defineTask('hud-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `HUD Implementation - ${args.projectName}`,
  agent: {
    name: 'ui-programmer-agent',
    prompt: { role: 'UI Programmer', task: 'Implement HUD system', context: args, instructions: ['1. Implement health/resource bars', '2. Add minimap', '3. Create objective tracker', '4. Add feedback elements'] },
    outputSchema: { type: 'object', required: ['hudElements', 'artifacts'], properties: { hudElements: { type: 'array' }, responsive: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'hud']
}));

export const menuSystemsTask = defineTask('menu-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `Menu Systems - ${args.projectName}`,
  agent: {
    name: 'ui-programmer-agent',
    prompt: { role: 'UI Programmer', task: 'Implement menu systems', context: args, instructions: ['1. Implement main menu', '2. Create pause menu', '3. Build settings menu', '4. Add inventory/character screens'] },
    outputSchema: { type: 'object', required: ['menus', 'navigationImplemented', 'artifacts'], properties: { menus: { type: 'array' }, navigationImplemented: { type: 'boolean' }, controllerNav: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'menus']
}));

export const inputHandlingTask = defineTask('input-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Input Handling - ${args.projectName}`,
  agent: {
    name: 'ui-programmer-agent',
    prompt: { role: 'Input Programmer', task: 'Implement input handling', context: args, instructions: ['1. Implement keyboard/mouse', '2. Add controller support', '3. Create rebinding system', '4. Add input hints'] },
    outputSchema: { type: 'object', required: ['inputMethods', 'rebindingSupport', 'artifacts'], properties: { inputMethods: { type: 'array' }, rebindingSupport: { type: 'boolean' }, inputHints: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'input']
}));

export const uiAccessibilityTask = defineTask('ui-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Accessibility - ${args.projectName}`,
  agent: {
    name: 'accessibility-tester-agent',
    prompt: { role: 'Accessibility Specialist', task: 'Implement accessibility features', context: args, instructions: ['1. Add colorblind modes', '2. Implement text scaling', '3. Add screen reader support', '4. Create accessibility options'] },
    outputSchema: { type: 'object', required: ['features', 'reportPath', 'artifacts'], properties: { features: { type: 'array' }, reportPath: { type: 'string' }, complianceLevel: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'accessibility']
}));

export const uiLocalizationTask = defineTask('ui-localization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Localization Support - ${args.projectName}`,
  agent: {
    name: 'localization-tester-agent',
    prompt: { role: 'Localization Engineer', task: 'Implement localization support', context: args, instructions: ['1. Set up localization system', '2. Extract text strings', '3. Handle text expansion', '4. Support RTL languages'] },
    outputSchema: { type: 'object', required: ['locSystemReady', 'stringCount', 'artifacts'], properties: { locSystemReady: { type: 'boolean' }, stringCount: { type: 'number' }, supportedLanguages: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'localization']
}));

export const uiTestingTask = defineTask('ui-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test UI implementation', context: args, instructions: ['1. Test all UI flows', '2. Verify accessibility', '3. Test responsiveness', '4. Test input methods'] },
    outputSchema: { type: 'object', required: ['testsPassed', 'issues', 'artifacts'], properties: { testsPassed: { type: 'number' }, issues: { type: 'array' }, accessibilityPassed: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ui-ux', 'testing']
}));
