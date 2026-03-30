/**
 * @process specializations/desktop-development/mvvm-implementation
 * @description MVVM Pattern Implementation for Desktop - Implement Model-View-ViewModel architecture pattern;
 * set up data binding, commands, view models, and state management for desktop applications.
 * @inputs { projectName: string, framework: string, stateLibrary?: string, features: array, outputDir?: string }
 * @outputs { success: boolean, mvvmConfig: object, viewModels: array, bindings: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/mvvm-implementation', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   stateLibrary: 'MobX',
 *   features: ['data-binding', 'commands', 'validation', 'navigation']
 * });
 *
 * @references
 * - MobX: https://mobx.js.org/
 * - Redux: https://redux.js.org/
 * - MVVM Pattern: https://docs.microsoft.com/en-us/dotnet/architecture/maui/mvvm
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    stateLibrary = 'MobX',
    features = ['data-binding', 'commands', 'validation', 'navigation'],
    outputDir = 'mvvm-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MVVM Pattern Implementation: ${projectName}`);

  const requirements = await ctx.task(mvvmRequirementsTask, { projectName, framework, stateLibrary, features, outputDir });
  artifacts.push(...requirements.artifacts);

  const baseSetup = await ctx.task(setupMvvmBaseTask, { projectName, framework, stateLibrary, outputDir });
  artifacts.push(...baseSetup.artifacts);

  const viewModelBase = await ctx.task(createViewModelBaseTask, { projectName, framework, stateLibrary, outputDir });
  artifacts.push(...viewModelBase.artifacts);

  const dataBinding = await ctx.task(implementDataBindingTask, { projectName, framework, stateLibrary, outputDir });
  artifacts.push(...dataBinding.artifacts);

  await ctx.breakpoint({
    question: `MVVM base setup complete with ${stateLibrary}. Features: ${features.join(', ')}. Review?`,
    title: 'MVVM Setup Review',
    context: { runId: ctx.runId, stateLibrary, features }
  });

  let commands = null;
  if (features.includes('commands')) {
    commands = await ctx.task(implementCommandPatternTask, { projectName, framework, stateLibrary, outputDir });
    artifacts.push(...commands.artifacts);
  }

  let validation = null;
  if (features.includes('validation')) {
    validation = await ctx.task(implementValidationTask, { projectName, framework, stateLibrary, outputDir });
    artifacts.push(...validation.artifacts);
  }

  let navigation = null;
  if (features.includes('navigation')) {
    navigation = await ctx.task(implementMvvmNavigationTask, { projectName, framework, stateLibrary, outputDir });
    artifacts.push(...navigation.artifacts);
  }

  const sampleViewModels = await ctx.task(createSampleViewModelsTask, { projectName, framework, stateLibrary, viewModelBase, outputDir });
  artifacts.push(...sampleViewModels.artifacts);

  const mvvmValidation = await ctx.task(validateMvvmTask, { projectName, framework, stateLibrary, baseSetup, dataBinding, commands, validation, outputDir });
  artifacts.push(...mvvmValidation.artifacts);

  const validationPassed = mvvmValidation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    mvvmConfig: { stateLibrary, basePath: baseSetup.basePath },
    viewModels: sampleViewModels.viewModels,
    bindings: dataBinding.bindingTypes,
    features: { commands: !!commands, validation: !!validation, navigation: !!navigation },
    validation: { score: mvvmValidation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/mvvm-implementation', timestamp: startTime }
  };
}

export const mvvmRequirementsTask = defineTask('mvvm-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `MVVM Requirements - ${args.projectName}`,
  agent: {
    name: 'mvvm-analyst',
    prompt: { role: 'MVVM Architecture Analyst', task: 'Analyze MVVM requirements', context: args, instructions: ['1. Analyze architecture needs', '2. Identify view models needed', '3. Plan binding strategy', '4. Define command patterns', '5. Plan validation approach', '6. Define navigation strategy', '7. Plan service layer', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'requirements']
}));

export const setupMvvmBaseTask = defineTask('setup-mvvm-base', (args, taskCtx) => ({
  kind: 'agent',
  title: `MVVM Base Setup - ${args.projectName}`,
  skill: {
    name: 'mobx-react-setup',
  },
  agent: {
    name: 'desktop-architecture-specialist',
    prompt: { role: 'MVVM Setup Developer', task: 'Set up MVVM base infrastructure', context: args, instructions: ['1. Install state management library', '2. Create project structure', '3. Set up DI container', '4. Configure store/root', '5. Create service locator', '6. Set up type definitions', '7. Configure decorators', '8. Generate base configuration'] },
    outputSchema: { type: 'object', required: ['basePath', 'artifacts'], properties: { basePath: { type: 'string' }, configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'setup']
}));

export const createViewModelBaseTask = defineTask('create-viewmodel-base', (args, taskCtx) => ({
  kind: 'agent',
  title: `ViewModel Base Class - ${args.projectName}`,
  agent: {
    name: 'viewmodel-developer',
    prompt: { role: 'ViewModel Developer', task: 'Create base ViewModel class', context: args, instructions: ['1. Create ViewModelBase class', '2. Implement INotifyPropertyChanged', '3. Add observable properties', '4. Add computed properties', '5. Add lifecycle hooks', '6. Add cleanup methods', '7. Add error handling', '8. Generate ViewModel base module'] },
    outputSchema: { type: 'object', required: ['basePath', 'artifacts'], properties: { basePath: { type: 'string' }, methods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'viewmodel']
}));

export const implementDataBindingTask = defineTask('implement-data-binding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Binding - ${args.projectName}`,
  skill: {
    name: 'observable-state-manager',
  },
  agent: {
    name: 'desktop-architecture-specialist',
    prompt: { role: 'Data Binding Developer', task: 'Implement data binding system', context: args, instructions: ['1. Implement one-way binding', '2. Implement two-way binding', '3. Add binding helpers', '4. Create binding decorators', '5. Handle collection binding', '6. Add binding expressions', '7. Handle binding errors', '8. Generate binding configuration'] },
    outputSchema: { type: 'object', required: ['bindingTypes', 'artifacts'], properties: { bindingTypes: { type: 'array' }, helperPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'binding']
}));

export const implementCommandPatternTask = defineTask('implement-command-pattern', (args, taskCtx) => ({
  kind: 'agent',
  title: `Command Pattern - ${args.projectName}`,
  agent: {
    name: 'command-developer',
    prompt: { role: 'Command Pattern Developer', task: 'Implement command pattern', context: args, instructions: ['1. Create ICommand interface', '2. Create RelayCommand class', '3. Add canExecute logic', '4. Implement async commands', '5. Add command parameters', '6. Implement command binding', '7. Add keyboard shortcuts', '8. Generate command module'] },
    outputSchema: { type: 'object', required: ['commandTypes', 'artifacts'], properties: { commandTypes: { type: 'array' }, commandPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'commands']
}));

export const implementValidationTask = defineTask('implement-mvvm-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MVVM Validation - ${args.projectName}`,
  agent: {
    name: 'validation-developer',
    prompt: { role: 'MVVM Validation Developer', task: 'Implement validation system', context: args, instructions: ['1. Create validation interface', '2. Implement validators', '3. Add validation rules', '4. Create validation decorators', '5. Add error collections', '6. Implement async validation', '7. Add validation UI binding', '8. Generate validation module'] },
    outputSchema: { type: 'object', required: ['validatorTypes', 'artifacts'], properties: { validatorTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'validation']
}));

export const implementMvvmNavigationTask = defineTask('implement-mvvm-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MVVM Navigation - ${args.projectName}`,
  agent: {
    name: 'navigation-developer',
    prompt: { role: 'MVVM Navigation Developer', task: 'Implement navigation service', context: args, instructions: ['1. Create navigation service', '2. Implement view registration', '3. Add navigation parameters', '4. Implement back navigation', '5. Add navigation guards', '6. Handle modal navigation', '7. Add navigation history', '8. Generate navigation module'] },
    outputSchema: { type: 'object', required: ['navigationService', 'artifacts'], properties: { navigationService: { type: 'string' }, methods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'navigation']
}));

export const createSampleViewModelsTask = defineTask('create-sample-viewmodels', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sample ViewModels - ${args.projectName}`,
  agent: {
    name: 'sample-developer',
    prompt: { role: 'Sample ViewModel Developer', task: 'Create sample ViewModels', context: args, instructions: ['1. Create MainViewModel', '2. Create SettingsViewModel', '3. Create ListViewModel', '4. Create DetailViewModel', '5. Add sample commands', '6. Add sample validations', '7. Document patterns used', '8. Generate sample ViewModels'] },
    outputSchema: { type: 'object', required: ['viewModels', 'artifacts'], properties: { viewModels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'samples']
}));

export const validateMvvmTask = defineTask('validate-mvvm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate MVVM - ${args.projectName}`,
  agent: {
    name: 'mvvm-validator',
    prompt: { role: 'MVVM Validator', task: 'Validate MVVM implementation', context: args, instructions: ['1. Verify base setup', '2. Test data binding', '3. Test commands', '4. Test validation', '5. Verify navigation', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'mvvm', 'validation']
}));
