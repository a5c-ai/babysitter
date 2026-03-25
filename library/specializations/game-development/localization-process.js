/**
 * @process specializations/game-development/localization-process
 * @description Game Localization Process - Prepare and implement localization for target markets including
 * text translation, audio localization, cultural adaptation, and localization QA testing.
 * @inputs { projectName: string, targetLanguages?: array, localizationScope?: string, outputDir?: string }
 * @outputs { success: boolean, localizedLanguages: array, stringCount: number, qaStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/localization-process', {
 *   projectName: 'Stellar Odyssey',
 *   targetLanguages: ['en', 'fr', 'de', 'es', 'ja', 'zh-CN'],
 *   localizationScope: 'full'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetLanguages = ['en'],
    localizationScope = 'text-only',
    voiceLocalization = false,
    culturalAdaptation = true,
    outputDir = 'localization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Localization Process: ${projectName}`);
  ctx.log('info', `Languages: ${targetLanguages.join(', ')}`);

  // Phase 1: Localization Planning
  const locPlan = await ctx.task(localizationPlanningTask, { projectName, targetLanguages, localizationScope, outputDir });
  artifacts.push(...locPlan.artifacts);

  // Phase 2: String Extraction
  const stringExtraction = await ctx.task(stringExtractionTask, { projectName, outputDir });
  artifacts.push(...stringExtraction.artifacts);

  // Phase 3: Translation
  const translation = await ctx.task(translationTask, { projectName, stringExtraction, targetLanguages, outputDir });
  artifacts.push(...translation.artifacts);

  // Phase 4: Cultural Adaptation
  if (culturalAdaptation) {
    const adaptation = await ctx.task(culturalAdaptationTask, { projectName, targetLanguages, outputDir });
    artifacts.push(...adaptation.artifacts);
  }

  // Phase 5: Voice Localization (if applicable)
  if (voiceLocalization) {
    const voiceLoc = await ctx.task(voiceLocalizationTask, { projectName, targetLanguages, outputDir });
    artifacts.push(...voiceLoc.artifacts);
  }

  // Phase 6: Integration
  const integration = await ctx.task(locIntegrationTask, { projectName, translation, targetLanguages, outputDir });
  artifacts.push(...integration.artifacts);

  // Phase 7: Localization QA
  const locQA = await ctx.task(localizationQATask, { projectName, targetLanguages, outputDir });
  artifacts.push(...locQA.artifacts);

  await ctx.breakpoint({
    question: `Localization complete for ${projectName}. ${targetLanguages.length} languages. ${stringExtraction.stringCount} strings. QA pass rate: ${locQA.passRate}%. Review?`,
    title: 'Localization Review',
    context: { runId: ctx.runId, translation, locQA }
  });

  return {
    success: true,
    projectName,
    localizedLanguages: targetLanguages,
    stringCount: stringExtraction.stringCount,
    qaStatus: { passRate: locQA.passRate, issues: locQA.issues },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/localization-process', timestamp: startTime, outputDir }
  };
}

export const localizationPlanningTask = defineTask('localization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Localization Planning - ${args.projectName}`,
  agent: {
    name: 'localization-coordinator-agent',
    prompt: { role: 'Localization Manager', task: 'Plan localization project', context: args, instructions: ['1. Define scope per language', '2. Create localization schedule', '3. Assign vendors', '4. Define quality standards'] },
    outputSchema: { type: 'object', required: ['plan', 'schedule', 'artifacts'], properties: { plan: { type: 'object' }, schedule: { type: 'object' }, vendors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'planning']
}));

export const stringExtractionTask = defineTask('string-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `String Extraction - ${args.projectName}`,
  agent: {
    name: 'localization-tester-agent',
    prompt: { role: 'Localization Engineer', task: 'Extract localizable strings', context: args, instructions: ['1. Extract all text strings', '2. Add context notes', '3. Mark character limits', '4. Create string database'] },
    outputSchema: { type: 'object', required: ['stringCount', 'stringDatabase', 'artifacts'], properties: { stringCount: { type: 'number' }, stringDatabase: { type: 'string' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'extraction']
}));

export const translationTask = defineTask('translation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Translation - ${args.projectName}`,
  agent: {
    name: 'localization-coordinator-agent',
    prompt: { role: 'Translation Lead', task: 'Translate all strings', context: args, instructions: ['1. Translate strings', '2. Apply style guide', '3. Handle placeholders', '4. Review translations'] },
    outputSchema: { type: 'object', required: ['translatedLanguages', 'completionRate', 'artifacts'], properties: { translatedLanguages: { type: 'array' }, completionRate: { type: 'object' }, glossaryPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'translation']
}));

export const culturalAdaptationTask = defineTask('cultural-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cultural Adaptation - ${args.projectName}`,
  agent: {
    name: 'localization-coordinator-agent',
    prompt: { role: 'Culturalization Specialist', task: 'Adapt content for cultures', context: args, instructions: ['1. Review cultural sensitivities', '2. Adapt imagery and symbols', '3. Modify content for ratings', '4. Document adaptations'] },
    outputSchema: { type: 'object', required: ['adaptations', 'artifacts'], properties: { adaptations: { type: 'array' }, ratingsImpact: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'cultural-adaptation']
}));

export const voiceLocalizationTask = defineTask('voice-localization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Voice Localization - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'VO Director', task: 'Localize voice acting', context: args, instructions: ['1. Cast local voice actors', '2. Direct recording sessions', '3. Edit and sync audio', '4. QA voice overs'] },
    outputSchema: { type: 'object', required: ['voLanguages', 'lineCount', 'artifacts'], properties: { voLanguages: { type: 'array' }, lineCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'voice']
}));

export const locIntegrationTask = defineTask('loc-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Localization Integration - ${args.projectName}`,
  agent: {
    name: 'localization-tester-agent',
    prompt: { role: 'Localization Engineer', task: 'Integrate translations', context: args, instructions: ['1. Import translated strings', '2. Test text display', '3. Fix overflow issues', '4. Verify font support'] },
    outputSchema: { type: 'object', required: ['integrated', 'issues', 'artifacts'], properties: { integrated: { type: 'boolean' }, issues: { type: 'array' }, fontSupport: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'integration']
}));

export const localizationQATask = defineTask('localization-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Localization QA - ${args.projectName}`,
  agent: {
    name: 'localization-tester-agent',
    prompt: { role: 'Localization QA', task: 'QA all localizations', context: args, instructions: ['1. Test all languages in-game', '2. Check for truncation', '3. Verify translations', '4. Report issues'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, languageStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'localization', 'qa']
}));
