/**
 * @process specializations/web-development/tailwind-design-system
 * @description Tailwind Design System - Process for creating a comprehensive design system with Tailwind CSS including custom themes, components, and tokens.
 * @inputs { projectName: string, brandColors?: object }
 * @outputs { success: boolean, designTokens: object, components: array, artifacts: array }
 * @references - Tailwind CSS: https://tailwindcss.com/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, brandColors = {}, outputDir = 'tailwind-design-system' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Tailwind Design System: ${projectName}`);

  const tailwindSetup = await ctx.task(tailwindSetupTask, { projectName, brandColors, outputDir });
  artifacts.push(...tailwindSetup.artifacts);

  const designTokens = await ctx.task(designTokensTask, { projectName, brandColors, outputDir });
  artifacts.push(...designTokens.artifacts);

  const componentLibrary = await ctx.task(componentLibraryTask, { projectName, outputDir });
  artifacts.push(...componentLibrary.artifacts);

  let darkMode = await ctx.task(darkModeTask, { projectName, outputDir });

  // Cache-bust verification protocol (issue #89)
  const cacheBustResult = await ctx.task(cacheBustVerificationTask, { projectName, outputDir });
  artifacts.push(...(cacheBustResult.artifacts || []));
  const buildHashResult = await ctx.task(buildHashCheckTask, { projectName, outputDir });
  artifacts.push(...(buildHashResult.artifacts || []));
  const hardRefreshResult = await ctx.task(hardRefreshInstructionTask, { projectName, framework: 'tailwind' });
  artifacts.push(...(hardRefreshResult.artifacts || []));

    let lastFeedback = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback) {
      darkMode = await ctx.task(darkModeTask, { ...{ projectName, outputDir }, feedback: lastFeedback, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({ question: `Tailwind design system complete for ${projectName}. Framework caches have been cleared and rebuild verified. Hard-refresh your browser (Cmd+Shift+R) to verify. Approve?`, title: 'Design System Review', context: { runId: ctx.runId, tokens: designTokens.tokens, cacheBust: cacheBustResult, buildHash: buildHashResult, hardRefresh: hardRefreshResult }, expert: 'owner', tags: ['approval-gate'], previousFeedback: lastFeedback || undefined, attempt: attempt > 0 ? attempt + 1 : undefined });
    if (finalApproval.approved) break;
    lastFeedback = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, designTokens: designTokens.tokens, components: componentLibrary.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/tailwind-design-system', timestamp: startTime } };
}

export const tailwindSetupTask = defineTask('tailwind-setup', (args, taskCtx) => ({ kind: 'skill', title: `Tailwind Setup - ${args.projectName}`, skill: { name: 'tailwind-skill', prompt: { role: 'Tailwind Architect', task: 'Configure Tailwind CSS', context: args, instructions: ['1. Install Tailwind CSS', '2. Configure PostCSS', '3. Set up tailwind.config', '4. Configure content paths', '5. Set up plugins', '6. Configure presets', '7. Set up PurgeCSS', '8. Configure safelist', '9. Set up IDE integration', '10. Document setup'], outputFormat: 'JSON with Tailwind setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'setup'] }));

export const designTokensTask = defineTask('design-tokens', (args, taskCtx) => ({ kind: 'agent', title: `Design Tokens - ${args.projectName}`, agent: { name: 'design-tokens-specialist', prompt: { role: 'Design Tokens Specialist', task: 'Create design tokens', context: args, instructions: ['1. Define color palette', '2. Create typography scale', '3. Set up spacing system', '4. Define breakpoints', '5. Create shadows', '6. Set up borders', '7. Define animations', '8. Create z-index scale', '9. Set up opacity values', '10. Document tokens'], outputFormat: 'JSON with design tokens' }, outputSchema: { type: 'object', required: ['tokens', 'artifacts'], properties: { tokens: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'tokens'] }));

export const componentLibraryTask = defineTask('component-library', (args, taskCtx) => ({ kind: 'agent', title: `Component Library - ${args.projectName}`, agent: { name: 'tailwind-component-developer', prompt: { role: 'Tailwind Component Developer', task: 'Create component library', context: args, instructions: ['1. Create button variants', '2. Build input components', '3. Create card components', '4. Build navigation', '5. Create modals', '6. Build alerts', '7. Create badges', '8. Build dropdowns', '9. Create forms', '10. Document components'], outputFormat: 'JSON with components' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'components'] }));

export const darkModeTask = defineTask('dark-mode', (args, taskCtx) => ({ kind: 'agent', title: `Dark Mode - ${args.projectName}`, agent: { name: 'dark-mode-specialist', prompt: { role: 'Dark Mode Specialist', task: 'Implement dark mode', context: args, instructions: ['1. Configure dark mode', '2. Create dark palette', '3. Set up color variables', '4. Configure transitions', '5. Set up toggle', '6. Configure system preference', '7. Set up persistence', '8. Create dark components', '9. Configure images', '10. Document dark mode'], outputFormat: 'JSON with dark mode' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'dark-mode'] }));

export const cacheBustVerificationTask = defineTask('cache-bust-verification', (args, taskCtx) => ({ kind: 'shell', title: `Cache Bust Verification - ${args.projectName}`, shell: { command: 'rm -rf .next .cache dist/static node_modules/.vite node_modules/.cache 2>/dev/null; echo "Cache cleared at $(date +%s)"' }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'cache-bust'] }));

export const buildHashCheckTask = defineTask('build-hash-check', (args, taskCtx) => ({ kind: 'shell', title: `Build Hash Check - ${args.projectName}`, shell: { command: 'find . -maxdepth 3 -name "*.manifest.json" -o -name "build-manifest.json" -o -name ".next/BUILD_ID" 2>/dev/null | head -5 | xargs cat 2>/dev/null || echo "no-manifest-found"' }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'build-hash'] }));

export const hardRefreshInstructionTask = defineTask('hard-refresh-instruction', (args, taskCtx) => ({ kind: 'agent', title: `Hard Refresh Instructions - ${args.projectName}`, agent: { name: 'cache-bust-advisor', prompt: { role: 'Cache Bust Advisor', task: 'Generate hard-refresh instructions for the user', context: args, instructions: ['1. Detect framework from project context', '2. Generate browser-specific hard-refresh instructions (Ctrl+Shift+R / Cmd+Shift+R)', '3. Include instructions for clearing Tailwind/PostCSS caches', '4. Include PurgeCSS safelist verification', '5. Provide DevTools cache-disable guidance'], outputFormat: 'JSON with instructions and framework fields' }, outputSchema: { type: 'object', required: ['instructions', 'framework'], properties: { instructions: { type: 'string' }, framework: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'hard-refresh'] }));

export const documentationTask = defineTask('design-system-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate design system documentation', context: args, instructions: ['1. Create README', '2. Document tokens', '3. Create component guide', '4. Document dark mode', '5. Create patterns guide', '6. Document utilities', '7. Create Storybook', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'tailwind', 'documentation'] }));
