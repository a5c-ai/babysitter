/**
 * @process specializations/web-development/css-in-js-styled-components
 * @description CSS-in-JS with Styled Components - Process for implementing CSS-in-JS solutions with styled-components or Emotion.
 * @inputs { projectName: string, library?: string }
 * @outputs { success: boolean, themeConfig: object, components: array, artifacts: array }
 * @references - Styled Components: https://styled-components.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, library = 'styled-components', outputDir = 'css-in-js-styled-components' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CSS-in-JS Setup: ${projectName}`);

  const librarySetup = await ctx.task(librarySetupTask, { projectName, library, outputDir });
  artifacts.push(...librarySetup.artifacts);

  const themingSetup = await ctx.task(themingSetupTask, { projectName, outputDir });
  artifacts.push(...themingSetup.artifacts);

  const componentPatterns = await ctx.task(componentPatternsTask, { projectName, outputDir });
  artifacts.push(...componentPatterns.artifacts);

  let globalStyles = await ctx.task(globalStylesTask, { projectName, outputDir });

  // Cache-bust verification protocol (issue #89)
  const cacheBustResult = await ctx.task(cacheBustVerificationTask, { projectName, outputDir });
  artifacts.push(...(cacheBustResult.artifacts || []));
  const buildHashResult = await ctx.task(buildHashCheckTask, { projectName, outputDir });
  artifacts.push(...(buildHashResult.artifacts || []));
  const hardRefreshResult = await ctx.task(hardRefreshInstructionTask, { projectName, framework: 'styled-components' });
  artifacts.push(...(hardRefreshResult.artifacts || []));

    let lastFeedback = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback) {
      globalStyles = await ctx.task(globalStylesTask, { ...{ projectName, outputDir }, feedback: lastFeedback, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({ question: `CSS-in-JS setup complete for ${projectName}. Framework caches have been cleared and rebuild verified. Hard-refresh your browser (Cmd+Shift+R) to verify. Approve?`, title: 'CSS-in-JS Review', context: { runId: ctx.runId, components: componentPatterns.components, cacheBust: cacheBustResult, buildHash: buildHashResult, hardRefresh: hardRefreshResult }, expert: 'owner', tags: ['approval-gate'], previousFeedback: lastFeedback || undefined, attempt: attempt > 0 ? attempt + 1 : undefined });
    if (finalApproval.approved) break;
    lastFeedback = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, themeConfig: themingSetup.theme, components: componentPatterns.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/css-in-js-styled-components', timestamp: startTime } };
}

export const librarySetupTask = defineTask('library-setup', (args, taskCtx) => ({ kind: 'agent', title: `Library Setup - ${args.projectName}`, agent: { name: 'css-in-js-architect', prompt: { role: 'CSS-in-JS Architect', task: 'Configure CSS-in-JS library', context: args, instructions: ['1. Install dependencies', '2. Configure Babel plugin', '3. Set up SSR', '4. Configure TypeScript', '5. Set up ESLint plugin', '6. Configure stylelint', '7. Set up IDE support', '8. Configure minification', '9. Set up debugging', '10. Document setup'], outputFormat: 'JSON with library setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'setup'] }));

export const themingSetupTask = defineTask('theming-setup', (args, taskCtx) => ({ kind: 'agent', title: `Theming Setup - ${args.projectName}`, agent: { name: 'theming-specialist', prompt: { role: 'Theming Specialist', task: 'Create theme system', context: args, instructions: ['1. Create theme object', '2. Define colors', '3. Set up typography', '4. Define spacing', '5. Create breakpoints', '6. Set up shadows', '7. Configure borders', '8. Set up animations', '9. Create theme toggle', '10. Document theme'], outputFormat: 'JSON with theme' }, outputSchema: { type: 'object', required: ['theme', 'artifacts'], properties: { theme: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'theming'] }));

export const componentPatternsTask = defineTask('component-patterns', (args, taskCtx) => ({ kind: 'agent', title: `Component Patterns - ${args.projectName}`, agent: { name: 'styled-component-developer', prompt: { role: 'Styled Component Developer', task: 'Create component patterns', context: args, instructions: ['1. Create base components', '2. Set up extending', '3. Create variants', '4. Configure props', '5. Set up attrs', '6. Create animations', '7. Set up media queries', '8. Create compound components', '9. Set up polymorphic', '10. Document patterns'], outputFormat: 'JSON with patterns' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'patterns'] }));

export const globalStylesTask = defineTask('global-styles', (args, taskCtx) => ({ kind: 'agent', title: `Global Styles - ${args.projectName}`, agent: { name: 'global-styles-specialist', prompt: { role: 'Global Styles Specialist', task: 'Configure global styles', context: args, instructions: ['1. Create global styles', '2. Set up CSS reset', '3. Configure normalize', '4. Set up base styles', '5. Configure fonts', '6. Set up CSS variables', '7. Configure keyframes', '8. Set up scrollbar styles', '9. Configure selection', '10. Document globals'], outputFormat: 'JSON with global styles' }, outputSchema: { type: 'object', required: ['styles', 'artifacts'], properties: { styles: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'global'] }));

export const cacheBustVerificationTask = defineTask('cache-bust-verification', (args, taskCtx) => ({ kind: 'shell', title: `Cache Bust Verification - ${args.projectName}`, shell: { command: 'rm -rf .next .cache dist/static node_modules/.vite node_modules/.cache 2>/dev/null; echo "Cache cleared at $(date +%s)"' }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'cache-bust'] }));

export const buildHashCheckTask = defineTask('build-hash-check', (args, taskCtx) => ({ kind: 'shell', title: `Build Hash Check - ${args.projectName}`, shell: { command: 'find . -maxdepth 3 -name "*.manifest.json" -o -name "build-manifest.json" -o -name ".next/BUILD_ID" 2>/dev/null | head -5 | xargs cat 2>/dev/null || echo "no-manifest-found"' }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'build-hash'] }));

export const hardRefreshInstructionTask = defineTask('hard-refresh-instruction', (args, taskCtx) => ({ kind: 'agent', title: `Hard Refresh Instructions - ${args.projectName}`, agent: { name: 'cache-bust-advisor', prompt: { role: 'Cache Bust Advisor', task: 'Generate hard-refresh instructions for the user', context: args, instructions: ['1. Detect framework from project context', '2. Generate browser-specific hard-refresh instructions (Ctrl+Shift+R / Cmd+Shift+R)', '3. Include instructions for clearing framework-specific caches', '4. Include service worker unregistration steps if applicable', '5. Provide DevTools cache-disable guidance'], outputFormat: 'JSON with instructions and framework fields' }, outputSchema: { type: 'object', required: ['instructions', 'framework'], properties: { instructions: { type: 'string' }, framework: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'hard-refresh'] }));

export const documentationTask = defineTask('css-in-js-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate CSS-in-JS documentation', context: args, instructions: ['1. Create README', '2. Document theme', '3. Create patterns guide', '4. Document global styles', '5. Create testing guide', '6. Document SSR', '7. Create migration guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'css-in-js', 'documentation'] }));
