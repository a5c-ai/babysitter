/**
 * @process specializations/desktop-development/desktop-i18n
 * @description Desktop Internationalization (i18n) Implementation - Implement localization including string
 * extraction, translation management, RTL support, locale-aware formatting, and language switching.
 * @inputs { projectName: string, framework: string, languages: array, defaultLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, i18nConfig: object, languages: array, extractedStrings: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-i18n', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   languages: ['en', 'es', 'fr', 'de', 'ja', 'ar'],
 *   defaultLanguage: 'en'
 * });
 *
 * @references
 * - i18next: https://www.i18next.com/
 * - react-intl: https://formatjs.io/docs/react-intl/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    languages = ['en', 'es', 'fr', 'de'],
    defaultLanguage = 'en',
    outputDir = 'desktop-i18n'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop i18n Implementation: ${projectName}`);

  const requirements = await ctx.task(i18nRequirementsTask, { projectName, framework, languages, defaultLanguage, outputDir });
  artifacts.push(...requirements.artifacts);

  const i18nSetup = await ctx.task(setupI18nFrameworkTask, { projectName, framework, languages, defaultLanguage, outputDir });
  artifacts.push(...i18nSetup.artifacts);

  const stringExtraction = await ctx.task(extractStringsTask, { projectName, framework, outputDir });
  artifacts.push(...stringExtraction.artifacts);

  const translationManagement = await ctx.task(setupTranslationManagementTask, { projectName, languages, defaultLanguage, outputDir });
  artifacts.push(...translationManagement.artifacts);

  await ctx.breakpoint({
    question: `i18n setup complete. ${stringExtraction.stringCount} strings extracted. Languages: ${languages.join(', ')}. Review?`,
    title: 'i18n Setup Review',
    context: { runId: ctx.runId, languages, stringCount: stringExtraction.stringCount }
  });

  const rtlSupport = await ctx.task(implementRtlSupportTask, { projectName, framework, languages, outputDir });
  artifacts.push(...rtlSupport.artifacts);

  const localeFormatting = await ctx.task(implementLocaleFormattingTask, { projectName, framework, outputDir });
  artifacts.push(...localeFormatting.artifacts);

  const languageSwitching = await ctx.task(implementLanguageSwitchingTask, { projectName, framework, outputDir });
  artifacts.push(...languageSwitching.artifacts);

  const validation = await ctx.task(validateI18nTask, { projectName, framework, languages, i18nSetup, stringExtraction, rtlSupport, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    i18nConfig: { library: i18nSetup.library, configPath: i18nSetup.configPath },
    languages: languages,
    defaultLanguage,
    extractedStrings: stringExtraction.stringCount,
    rtlSupport: rtlSupport.enabled,
    formatting: localeFormatting.formatters,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/desktop-i18n', timestamp: startTime }
  };
}

export const i18nRequirementsTask = defineTask('i18n-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `i18n Requirements - ${args.projectName}`,
  agent: {
    name: 'i18n-analyst',
    prompt: { role: 'i18n Requirements Analyst', task: 'Analyze internationalization requirements', context: args, instructions: ['1. Analyze language requirements', '2. Identify RTL languages', '3. Plan string extraction', '4. Document formatting needs', '5. Plan translation workflow', '6. Identify pluralization needs', '7. Plan language detection', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'requirements']
}));

export const setupI18nFrameworkTask = defineTask('setup-i18n-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `i18n Framework Setup - ${args.projectName}`,
  skill: {
    name: 'i18next-electron-setup',
  },
  agent: {
    name: 'desktop-i18n-engineer',
    prompt: { role: 'i18n Framework Developer', task: 'Set up i18n framework', context: args, instructions: ['1. Install i18next/react-intl', '2. Configure initialization', '3. Set up language detection', '4. Configure fallbacks', '5. Set up namespaces', '6. Configure interpolation', '7. Set up caching', '8. Generate i18n configuration'] },
    outputSchema: { type: 'object', required: ['library', 'configPath', 'artifacts'], properties: { library: { type: 'string' }, configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'framework']
}));

export const extractStringsTask = defineTask('extract-strings', (args, taskCtx) => ({
  kind: 'agent',
  title: `String Extraction - ${args.projectName}`,
  skill: {
    name: 'translation-string-extractor',
  },
  agent: {
    name: 'desktop-i18n-engineer',
    prompt: { role: 'String Extraction Developer', task: 'Extract translatable strings', context: args, instructions: ['1. Configure extraction tool', '2. Scan source files', '3. Extract marked strings', '4. Generate translation keys', '5. Create base translation file', '6. Handle plurals', '7. Handle context', '8. Generate extraction report'] },
    outputSchema: { type: 'object', required: ['stringCount', 'artifacts'], properties: { stringCount: { type: 'number' }, keys: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'extraction']
}));

export const setupTranslationManagementTask = defineTask('setup-translation-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Translation Management - ${args.projectName}`,
  agent: {
    name: 'translation-manager',
    prompt: { role: 'Translation Management Developer', task: 'Set up translation management', context: args, instructions: ['1. Create language files', '2. Set up translation directory', '3. Configure file format (JSON)', '4. Set up translation scripts', '5. Configure missing key handling', '6. Set up validation', '7. Create translation guide', '8. Generate translation structure'] },
    outputSchema: { type: 'object', required: ['translationDir', 'artifacts'], properties: { translationDir: { type: 'string' }, fileFormat: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'translation']
}));

export const implementRtlSupportTask = defineTask('implement-rtl-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `RTL Support - ${args.projectName}`,
  agent: {
    name: 'rtl-developer',
    prompt: { role: 'RTL Support Developer', task: 'Implement RTL language support', context: args, instructions: ['1. Configure RTL detection', '2. Set up CSS direction', '3. Handle mirrored layouts', '4. Configure RTL fonts', '5. Handle bidirectional text', '6. Test RTL layouts', '7. Handle icons/images', '8. Generate RTL configuration'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, rtlLanguages: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'rtl']
}));

export const implementLocaleFormattingTask = defineTask('implement-locale-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Locale Formatting - ${args.projectName}`,
  agent: {
    name: 'formatting-developer',
    prompt: { role: 'Locale Formatting Developer', task: 'Implement locale-aware formatting', context: args, instructions: ['1. Configure date formatting', '2. Configure number formatting', '3. Configure currency formatting', '4. Configure relative time', '5. Configure list formatting', '6. Configure pluralization', '7. Create formatting utilities', '8. Generate formatting configuration'] },
    outputSchema: { type: 'object', required: ['formatters', 'artifacts'], properties: { formatters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'formatting']
}));

export const implementLanguageSwitchingTask = defineTask('implement-language-switching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Language Switching - ${args.projectName}`,
  agent: {
    name: 'language-switch-developer',
    prompt: { role: 'Language Switching Developer', task: 'Implement language switching', context: args, instructions: ['1. Create language selector UI', '2. Implement switch logic', '3. Persist language preference', '4. Handle hot reload', '5. Update document direction', '6. Emit language events', '7. Handle system language', '8. Generate language switching module'] },
    outputSchema: { type: 'object', required: ['componentPath', 'artifacts'], properties: { componentPath: { type: 'string' }, persistence: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'language-switching']
}));

export const validateI18nTask = defineTask('validate-i18n', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate i18n - ${args.projectName}`,
  agent: {
    name: 'i18n-validator',
    prompt: { role: 'i18n Validator', task: 'Validate i18n implementation', context: args, instructions: ['1. Verify string extraction', '2. Test language switching', '3. Verify RTL support', '4. Test formatting', '5. Check translation coverage', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, translationCoverage: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'i18n', 'validation']
}));
