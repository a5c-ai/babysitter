/**
 * @process specializations/web-development/technical-seo-implementation
 * @description Technical SEO Implementation - Process for implementing technical SEO including meta tags, structured data, sitemaps, and Core Web Vitals.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, seoConfig: object, optimizations: array, artifacts: array }
 * @references - Google SEO: https://developers.google.com/search/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'nextjs', outputDir = 'technical-seo-implementation' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Technical SEO Implementation: ${projectName}`);

  const metaTagsSetup = await ctx.task(metaTagsSetupTask, { projectName, framework, outputDir });
  artifacts.push(...metaTagsSetup.artifacts);

  const structuredData = await ctx.task(structuredDataTask, { projectName, outputDir });
  artifacts.push(...structuredData.artifacts);

  const sitemapSetup = await ctx.task(sitemapSetupTask, { projectName, outputDir });
  artifacts.push(...sitemapSetup.artifacts);

  const coreWebVitals = await ctx.task(coreWebVitalsTask, { projectName, outputDir });
  artifacts.push(...coreWebVitals.artifacts);

  await ctx.breakpoint({ question: `Technical SEO complete for ${projectName}. Approve?`, title: 'SEO Review', context: { runId: ctx.runId, optimizations: metaTagsSetup.optimizations } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, seoConfig: metaTagsSetup.config, optimizations: coreWebVitals.optimizations, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/technical-seo-implementation', timestamp: startTime } };
}

export const metaTagsSetupTask = defineTask('meta-tags-setup', (args, taskCtx) => ({ kind: 'agent', title: `Meta Tags Setup - ${args.projectName}`, agent: { name: 'seo-meta-specialist', prompt: { role: 'SEO Meta Specialist', task: 'Configure meta tags', context: args, instructions: ['1. Set up title tags', '2. Configure meta descriptions', '3. Set up Open Graph', '4. Configure Twitter Cards', '5. Set up canonical URLs', '6. Configure robots meta', '7. Set up viewport', '8. Configure hreflang', '9. Set up favicon', '10. Document meta tags'], outputFormat: 'JSON with meta tags' }, outputSchema: { type: 'object', required: ['config', 'optimizations', 'artifacts'], properties: { config: { type: 'object' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'seo', 'meta'] }));

export const structuredDataTask = defineTask('structured-data', (args, taskCtx) => ({ kind: 'agent', title: `Structured Data - ${args.projectName}`, agent: { name: 'structured-data-specialist', prompt: { role: 'Structured Data Specialist', task: 'Implement structured data', context: args, instructions: ['1. Set up JSON-LD', '2. Configure Organization', '3. Set up WebSite', '4. Configure BreadcrumbList', '5. Set up Article', '6. Configure Product', '7. Set up FAQ', '8. Configure Review', '9. Set up LocalBusiness', '10. Document schemas'], outputFormat: 'JSON with structured data' }, outputSchema: { type: 'object', required: ['schemas', 'artifacts'], properties: { schemas: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'seo', 'structured-data'] }));

export const sitemapSetupTask = defineTask('sitemap-setup', (args, taskCtx) => ({ kind: 'agent', title: `Sitemap Setup - ${args.projectName}`, agent: { name: 'sitemap-specialist', prompt: { role: 'Sitemap Specialist', task: 'Configure sitemaps', context: args, instructions: ['1. Create XML sitemap', '2. Configure sitemap index', '3. Set up dynamic sitemap', '4. Configure priority', '5. Set up changefreq', '6. Configure lastmod', '7. Set up image sitemap', '8. Configure video sitemap', '9. Set up robots.txt', '10. Document sitemaps'], outputFormat: 'JSON with sitemaps' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'seo', 'sitemap'] }));

export const coreWebVitalsTask = defineTask('core-web-vitals', (args, taskCtx) => ({ kind: 'agent', title: `Core Web Vitals - ${args.projectName}`, agent: { name: 'web-vitals-specialist', prompt: { role: 'Web Vitals Specialist', task: 'Optimize Core Web Vitals', context: args, instructions: ['1. Optimize LCP', '2. Improve FID/INP', '3. Reduce CLS', '4. Configure prefetching', '5. Optimize fonts', '6. Configure lazy loading', '7. Set up resource hints', '8. Configure compression', '9. Set up monitoring', '10. Document optimizations'], outputFormat: 'JSON with optimizations' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'seo', 'performance'] }));

export const documentationTask = defineTask('seo-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate SEO documentation', context: args, instructions: ['1. Create README', '2. Document meta tags', '3. Create structured data guide', '4. Document sitemaps', '5. Create Core Web Vitals guide', '6. Document testing', '7. Create checklist', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'seo', 'documentation'] }));
