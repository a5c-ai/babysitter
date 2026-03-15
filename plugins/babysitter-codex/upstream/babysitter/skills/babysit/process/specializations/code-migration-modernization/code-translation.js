/**
 * @process specializations/code-migration-modernization/code-translation
 * @description Code Translation - Process for translating code between programming languages while
 * preserving functionality, idioms, and maintainability using automated tools and manual review.
 * @inputs { projectName: string, sourceLanguage?: string, targetLanguage?: string, codebasePath?: string }
 * @outputs { success: boolean, translationAnalysis: object, translatedCode: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/code-translation', {
 *   projectName: 'VB.NET to C# Translation',
 *   sourceLanguage: 'VB.NET',
 *   targetLanguage: 'C#',
 *   codebasePath: '/src/legacy-vb'
 * });
 *
 * @references
 * - Transpilers Overview: https://en.wikipedia.org/wiki/Source-to-source_compiler
 * - Code Migration Best Practices: https://martinfowler.com/articles/code-migration.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceLanguage = '',
    targetLanguage = '',
    codebasePath = '',
    outputDir = 'code-translation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Code Translation for ${projectName}`);

  // ============================================================================
  // PHASE 1: TRANSLATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing translation requirements');
  const translationAnalysis = await ctx.task(translationAnalysisTask, {
    projectName,
    sourceLanguage,
    targetLanguage,
    codebasePath,
    outputDir
  });

  artifacts.push(...translationAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TOOL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting translation tools');
  const toolSelection = await ctx.task(translationToolSelectionTask, {
    projectName,
    translationAnalysis,
    sourceLanguage,
    targetLanguage,
    outputDir
  });

  artifacts.push(...toolSelection.artifacts);

  // Breakpoint: Tool selection review
  await ctx.breakpoint({
    question: `Translation tools selected for ${projectName}. Primary tool: ${toolSelection.primaryTool}. Manual translation needed: ${toolSelection.manualPercentage}%. Proceed?`,
    title: 'Translation Tool Review',
    context: {
      runId: ctx.runId,
      projectName,
      toolSelection,
      recommendation: 'Review tool capabilities and limitations'
    }
  });

  // ============================================================================
  // PHASE 3: AUTOMATED TRANSLATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Running automated translation');
  const automatedTranslation = await ctx.task(automatedTranslationTask, {
    projectName,
    toolSelection,
    translationAnalysis,
    outputDir
  });

  artifacts.push(...automatedTranslation.artifacts);

  // ============================================================================
  // PHASE 4: MANUAL REVIEW AND FIXES
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying manual fixes');
  const manualFixes = await ctx.task(manualTranslationFixesTask, {
    projectName,
    automatedTranslation,
    translationAnalysis,
    targetLanguage,
    outputDir
  });

  artifacts.push(...manualFixes.artifacts);

  // ============================================================================
  // PHASE 5: IDIOM OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing for target language idioms');
  const idiomOptimization = await ctx.task(idiomOptimizationTask, {
    projectName,
    manualFixes,
    targetLanguage,
    outputDir
  });

  artifacts.push(...idiomOptimization.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing translated code');
  const testing = await ctx.task(translationTestingTask, {
    projectName,
    idiomOptimization,
    translationAnalysis,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Code translation complete for ${projectName}. Files translated: ${automatedTranslation.filesTranslated}. Tests passing: ${testing.allPassed}. Approve?`,
    title: 'Code Translation Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: sourceLanguage,
        to: targetLanguage,
        filesTranslated: automatedTranslation.filesTranslated,
        testsPass: testing.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    translationAnalysis,
    translatedCode: {
      filesTranslated: automatedTranslation.filesTranslated,
      automatedPercentage: automatedTranslation.automatedPercentage,
      manualFixes: manualFixes.fixCount
    },
    idiomOptimization,
    testResults: {
      allPassed: testing.allPassed,
      passed: testing.passedCount,
      failed: testing.failedCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/code-translation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const translationAnalysisTask = defineTask('translation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Translation Analysis - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Language Migration Specialist',
      task: 'Analyze code translation requirements',
      context: args,
      instructions: [
        '1. Inventory source code',
        '2. Identify language-specific constructs',
        '3. Map language differences',
        '4. Identify translation challenges',
        '5. Find library equivalents',
        '6. Assess complexity',
        '7. Identify tests to port',
        '8. Plan translation approach',
        '9. Estimate effort',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with fileCount, constructs, challenges, libraryMappings, complexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fileCount', 'challenges', 'complexity', 'artifacts'],
      properties: {
        fileCount: { type: 'number' },
        constructs: { type: 'array', items: { type: 'object' } },
        challenges: { type: 'array', items: { type: 'object' } },
        libraryMappings: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'analysis', 'language']
}));

export const translationToolSelectionTask = defineTask('translation-tool-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Tool Selection - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Migration Engineer',
      task: 'Select appropriate translation tools',
      context: args,
      instructions: [
        '1. Research available transpilers',
        '2. Evaluate tool accuracy',
        '3. Test with samples',
        '4. Assess coverage',
        '5. Identify manual work needed',
        '6. Select primary tool',
        '7. Plan tool chain',
        '8. Configure tools',
        '9. Document limitations',
        '10. Generate tool report'
      ],
      outputFormat: 'JSON with primaryTool, toolChain, manualPercentage, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryTool', 'manualPercentage', 'artifacts'],
      properties: {
        primaryTool: { type: 'string' },
        toolChain: { type: 'array', items: { type: 'string' } },
        manualPercentage: { type: 'number' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'tools', 'selection']
}));

export const automatedTranslationTask = defineTask('automated-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Automated Translation - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Migration Developer',
      task: 'Run automated code translation',
      context: args,
      instructions: [
        '1. Run translation tool',
        '2. Process all files',
        '3. Log translation issues',
        '4. Track coverage',
        '5. Handle errors',
        '6. Generate output files',
        '7. Maintain file structure',
        '8. Track statistics',
        '9. Document issues',
        '10. Generate translation report'
      ],
      outputFormat: 'JSON with filesTranslated, automatedPercentage, issues, outputPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['filesTranslated', 'automatedPercentage', 'artifacts'],
      properties: {
        filesTranslated: { type: 'number' },
        automatedPercentage: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        outputPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'automated', 'transpilation']
}));

export const manualTranslationFixesTask = defineTask('manual-translation-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Manual Translation Fixes - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Senior Developer',
      task: 'Apply manual translation fixes',
      context: args,
      instructions: [
        '1. Review translation issues',
        '2. Fix untranslated code',
        '3. Handle edge cases',
        '4. Fix syntax errors',
        '5. Update library calls',
        '6. Fix type issues',
        '7. Handle async patterns',
        '8. Fix error handling',
        '9. Document fixes',
        '10. Track fix count'
      ],
      outputFormat: 'JSON with fixCount, fixedFiles, remainingIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fixCount', 'fixedFiles', 'artifacts'],
      properties: {
        fixCount: { type: 'number' },
        fixedFiles: { type: 'number' },
        remainingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'manual', 'fixes']
}));

export const idiomOptimizationTask = defineTask('idiom-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Idiom Optimization - ${args.projectName}`,
  agent: {
    name: 'refactoring-pattern-applier',
    prompt: {
      role: 'Language Expert',
      task: 'Optimize for target language idioms',
      context: args,
      instructions: [
        '1. Identify non-idiomatic code',
        '2. Apply target language patterns',
        '3. Use language features properly',
        '4. Optimize collections usage',
        '5. Apply async patterns',
        '6. Improve error handling',
        '7. Apply naming conventions',
        '8. Use standard library',
        '9. Document optimizations',
        '10. Generate optimization report'
      ],
      outputFormat: 'JSON with optimizationsApplied, patternsUsed, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationsApplied', 'patternsUsed', 'artifacts'],
      properties: {
        optimizationsApplied: { type: 'number' },
        patternsUsed: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'idioms', 'optimization']
}));

export const translationTestingTask = defineTask('translation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Translation Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Test translated code',
      context: args,
      instructions: [
        '1. Run translated tests',
        '2. Verify functionality',
        '3. Compare outputs',
        '4. Test edge cases',
        '5. Validate performance',
        '6. Check behavior parity',
        '7. Test integrations',
        '8. Fix failing tests',
        '9. Document results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, behaviorParity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        behaviorParity: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['code-translation', 'testing', 'validation']
}));
