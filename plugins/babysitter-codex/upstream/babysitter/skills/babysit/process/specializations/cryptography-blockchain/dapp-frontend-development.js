/**
 * @process specializations/cryptography-blockchain/dapp-frontend-development
 * @description dApp Frontend Development - Development of decentralized application frontends with wallet integration,
 * transaction management, and Web3 user experience.
 * @inputs { projectName: string, framework?: string, chains?: array, features?: array }
 * @outputs { success: boolean, appInfo: object, components: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/dapp-frontend-development', {
 *   projectName: 'DeFi Dashboard',
 *   framework: 'nextjs',
 *   chains: ['ethereum', 'polygon', 'arbitrum'],
 *   features: ['wallet-connect', 'transaction-history', 'portfolio-tracking']
 * });
 *
 * @references
 * - Wagmi: https://wagmi.sh/
 * - RainbowKit: https://rainbowkit.com/docs/
 * - Web3Modal: https://docs.walletconnect.com/web3modal/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'nextjs',
    chains = ['ethereum'],
    features = ['wallet-connect', 'transactions'],
    designSystem = 'tailwind',
    outputDir = 'dapp-frontend-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting dApp Frontend Development: ${projectName}`);

  const architectureDesign = await ctx.task(architectureDesignTask, { projectName, framework, features, outputDir });
  artifacts.push(...architectureDesign.artifacts);

  const walletIntegration = await ctx.task(walletIntegrationTask, { projectName, chains, outputDir });
  artifacts.push(...walletIntegration.artifacts);

  const contractIntegration = await ctx.task(contractIntegrationTask, { projectName, chains, outputDir });
  artifacts.push(...contractIntegration.artifacts);

  const transactionManagement = await ctx.task(transactionManagementTask, { projectName, outputDir });
  artifacts.push(...transactionManagement.artifacts);

  const stateManagement = await ctx.task(stateManagementTask, { projectName, outputDir });
  artifacts.push(...stateManagement.artifacts);

  const uiComponents = await ctx.task(uiComponentsTask, { projectName, designSystem, outputDir });
  artifacts.push(...uiComponents.artifacts);

  const errorHandling = await ctx.task(errorHandlingTask, { projectName, outputDir });
  artifacts.push(...errorHandling.artifacts);

  const testingSuite = await ctx.task(testingSuiteTask, { projectName, outputDir });
  artifacts.push(...testingSuite.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    appInfo: { framework, chains, features, designSystem },
    components: uiComponents.components,
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/dapp-frontend-development', timestamp: startTime }
  };
}

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Architecture Design - ${args.projectName}`,
  agent: {
    name: 'dapp-architect',
    prompt: {
      role: 'dApp Frontend Architect',
      task: 'Design dApp architecture',
      context: args,
      instructions: ['1. Design component architecture', '2. Plan state management', '3. Design data flow', '4. Plan caching strategy', '5. Design error handling', '6. Plan Web3 integration', '7. Design routing', '8. Plan authentication', '9. Document architecture', '10. Create component diagram'],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: { type: 'object', required: ['architecture', 'components', 'artifacts'], properties: { architecture: { type: 'object' }, components: { type: 'array' }, dataFlow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'architecture']
}));

export const walletIntegrationTask = defineTask('wallet-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wallet Integration - ${args.projectName}`,
  agent: {
    name: 'wallet-engineer',
    prompt: {
      role: 'Wallet Integration Engineer',
      task: 'Implement wallet integration',
      context: args,
      instructions: ['1. Setup wallet connectors', '2. Implement multi-wallet support', '3. Add chain switching', '4. Implement connection persistence', '5. Add account change handling', '6. Implement disconnect flow', '7. Add mobile wallet support', '8. Handle wallet errors', '9. Test wallet flows', '10. Document integration'],
      outputFormat: 'JSON with wallet integration'
    },
    outputSchema: { type: 'object', required: ['walletConfig', 'connectors', 'artifacts'], properties: { walletConfig: { type: 'object' }, connectors: { type: 'array' }, supportedWallets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'wallet']
}));

export const contractIntegrationTask = defineTask('contract-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contract Integration - ${args.projectName}`,
  agent: {
    name: 'contract-engineer',
    prompt: {
      role: 'Contract Integration Engineer',
      task: 'Integrate smart contracts',
      context: args,
      instructions: ['1. Generate type-safe hooks', '2. Setup ABI management', '3. Implement read functions', '4. Implement write functions', '5. Add event listeners', '6. Implement multicall', '7. Add contract caching', '8. Handle contract errors', '9. Test integrations', '10. Document contract API'],
      outputFormat: 'JSON with contract integration'
    },
    outputSchema: { type: 'object', required: ['contractHooks', 'abis', 'artifacts'], properties: { contractHooks: { type: 'array' }, abis: { type: 'object' }, multicallConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'contracts']
}));

export const transactionManagementTask = defineTask('transaction-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transaction Management - ${args.projectName}`,
  agent: {
    name: 'tx-engineer',
    prompt: {
      role: 'Transaction Management Engineer',
      task: 'Implement transaction management',
      context: args,
      instructions: ['1. Implement tx submission', '2. Add gas estimation', '3. Implement tx tracking', '4. Add pending state', '5. Implement confirmations', '6. Add speed up/cancel', '7. Implement tx history', '8. Add notifications', '9. Handle tx errors', '10. Document tx flow'],
      outputFormat: 'JSON with transaction management'
    },
    outputSchema: { type: 'object', required: ['txManagement', 'states', 'artifacts'], properties: { txManagement: { type: 'object' }, states: { type: 'array' }, notifications: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'transactions']
}));

export const stateManagementTask = defineTask('state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `State Management - ${args.projectName}`,
  agent: {
    name: 'state-engineer',
    prompt: {
      role: 'dApp State Engineer',
      task: 'Implement state management',
      context: args,
      instructions: ['1. Setup global state', '2. Implement Web3 state', '3. Add data caching', '4. Implement optimistic updates', '5. Add persistence', '6. Handle revalidation', '7. Implement subscriptions', '8. Add state debugging', '9. Test state flows', '10. Document state'],
      outputFormat: 'JSON with state management'
    },
    outputSchema: { type: 'object', required: ['stateConfig', 'stores', 'artifacts'], properties: { stateConfig: { type: 'object' }, stores: { type: 'array' }, caching: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'state']
}));

export const uiComponentsTask = defineTask('ui-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Components - ${args.projectName}`,
  agent: {
    name: 'ui-engineer',
    prompt: {
      role: 'dApp UI Engineer',
      task: 'Build UI components',
      context: args,
      instructions: ['1. Create wallet button', '2. Build transaction modal', '3. Create token selector', '4. Build amount input', '5. Create address display', '6. Build network switcher', '7. Create tx status', '8. Build data tables', '9. Add loading states', '10. Document components'],
      outputFormat: 'JSON with UI components'
    },
    outputSchema: { type: 'object', required: ['components', 'designTokens', 'artifacts'], properties: { components: { type: 'array' }, designTokens: { type: 'object' }, storybook: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'ui']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Handling - ${args.projectName}`,
  agent: {
    name: 'error-engineer',
    prompt: {
      role: 'Error Handling Engineer',
      task: 'Implement error handling',
      context: args,
      instructions: ['1. Handle wallet errors', '2. Handle tx errors', '3. Parse revert reasons', '4. Implement user messages', '5. Add error boundaries', '6. Handle network errors', '7. Implement retry logic', '8. Add error logging', '9. Test error flows', '10. Document errors'],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: { type: 'object', required: ['errorHandling', 'errorTypes', 'artifacts'], properties: { errorHandling: { type: 'object' }, errorTypes: { type: 'array' }, userMessages: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'errors']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'dapp-tester',
    prompt: {
      role: 'dApp Testing Engineer',
      task: 'Create testing suite',
      context: args,
      instructions: ['1. Setup test environment', '2. Mock Web3 providers', '3. Test wallet flows', '4. Test transactions', '5. Test components', '6. Add integration tests', '7. Test error handling', '8. Add E2E tests', '9. Measure coverage', '10. Document tests'],
      outputFormat: 'JSON with testing suite'
    },
    outputSchema: { type: 'object', required: ['testSuite', 'coverage', 'artifacts'], properties: { testSuite: { type: 'object' }, coverage: { type: 'number' }, mocks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['dapp', 'testing']
}));
