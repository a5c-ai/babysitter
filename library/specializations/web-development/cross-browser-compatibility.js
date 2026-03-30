/**
 * @process specializations/web-development/cross-browser-compatibility
 * @description Cross-Browser Compatibility Testing - Process for implementing cross-browser testing strategies and ensuring consistent experiences across browsers.
 * @inputs { projectName: string, browsers?: array }
 * @outputs { success: boolean, compatibilityReport: object, fixes: array, artifacts: array }
 * @references - Can I Use: https://caniuse.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, browsers = ['chrome', 'firefox', 'safari', 'edge'], outputDir = 'cross-browser-compatibility' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cross-Browser Compatibility: ${projectName}`);

  const browserAnalysis = await ctx.task(browserAnalysisTask, { projectName, browsers, outputDir });
  artifacts.push(...browserAnalysis.artifacts);

  const polyfillSetup = await ctx.task(polyfillSetupTask, { projectName, outputDir });
  artifacts.push(...polyfillSetup.artifacts);

  const testingSetup = await ctx.task(testingSetupTask, { projectName, browsers, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const compatibilityFixes = await ctx.task(compatibilityFixesTask, { projectName, outputDir });
  artifacts.push(...compatibilityFixes.artifacts);

  await ctx.breakpoint({ question: `Cross-browser compatibility complete for ${projectName}. Approve?`, title: 'Compatibility Review', context: { runId: ctx.runId, report: browserAnalysis.report } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, compatibilityReport: browserAnalysis.report, fixes: compatibilityFixes.fixes, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/cross-browser-compatibility', timestamp: startTime } };
}

export const browserAnalysisTask = defineTask('browser-analysis', (args, taskCtx) => ({ kind: 'agent', title: `Browser Analysis - ${args.projectName}`, agent: { name: 'browser-compatibility-analyst', prompt: { role: 'Browser Compatibility Analyst', task: 'Analyze browser compatibility', context: args, instructions: ['1. Analyze CSS features', '2. Check JavaScript APIs', '3. Review HTML5 usage', '4. Check Web APIs', '5. Analyze polyfill needs', '6. Check vendor prefixes', '7. Review font support', '8. Check media queries', '9. Analyze flexbox/grid', '10. Document findings'], outputFormat: 'JSON with analysis' }, outputSchema: { type: 'object', required: ['report', 'artifacts'], properties: { report: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'compatibility', 'analysis'] }));

export const polyfillSetupTask = defineTask('polyfill-setup', (args, taskCtx) => ({ kind: 'agent', title: `Polyfill Setup - ${args.projectName}`, agent: { name: 'polyfill-specialist', prompt: { role: 'Polyfill Specialist', task: 'Configure polyfills', context: args, instructions: ['1. Configure core-js', '2. Set up Babel polyfills', '3. Configure browserslist', '4. Set up feature detection', '5. Configure conditional loading', '6. Set up polyfill.io', '7. Configure CSS prefixes', '8. Set up PostCSS', '9. Configure fallbacks', '10. Document polyfills'], outputFormat: 'JSON with polyfills' }, outputSchema: { type: 'object', required: ['polyfills', 'artifacts'], properties: { polyfills: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'compatibility', 'polyfills'] }));

export const testingSetupTask = defineTask('testing-setup', (args, taskCtx) => ({ kind: 'agent', title: `Testing Setup - ${args.projectName}`, agent: { name: 'browser-testing-specialist', prompt: { role: 'Browser Testing Specialist', task: 'Set up browser testing', context: args, instructions: ['1. Configure BrowserStack', '2. Set up Sauce Labs', '3. Configure Playwright browsers', '4. Set up visual regression', '5. Configure CI testing', '6. Set up real device testing', '7. Configure screenshot comparison', '8. Set up responsive testing', '9. Configure performance testing', '10. Document testing'], outputFormat: 'JSON with testing setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'compatibility', 'testing'] }));

export const compatibilityFixesTask = defineTask('compatibility-fixes', (args, taskCtx) => ({ kind: 'agent', title: `Compatibility Fixes - ${args.projectName}`, agent: { name: 'compatibility-developer', prompt: { role: 'Compatibility Developer', task: 'Implement compatibility fixes', context: args, instructions: ['1. Fix CSS issues', '2. Fix JavaScript issues', '3. Add vendor prefixes', '4. Implement fallbacks', '5. Fix flexbox issues', '6. Fix grid issues', '7. Fix font issues', '8. Fix form issues', '9. Fix scroll behavior', '10. Document fixes'], outputFormat: 'JSON with fixes' }, outputSchema: { type: 'object', required: ['fixes', 'artifacts'], properties: { fixes: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'compatibility', 'fixes'] }));

export const documentationTask = defineTask('compatibility-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate compatibility documentation', context: args, instructions: ['1. Create README', '2. Document browser support', '3. Create polyfill guide', '4. Document testing', '5. Create troubleshooting', '6. Document best practices', '7. Create checklist', '8. Document fallbacks', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'compatibility', 'documentation'] }));
