/**
 * @process specializations/cryptography-blockchain/lending-protocol
 * @description Lending Protocol Implementation - Development of over-collateralized lending and borrowing protocols with
 * interest rate models, collateral management, and liquidation mechanisms.
 * @inputs { projectName: string, interestRateModel?: string, supportedAssets?: array, collateralFactors?: object }
 * @outputs { success: boolean, protocolInfo: object, contracts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/lending-protocol', {
 *   projectName: 'Lending Protocol',
 *   interestRateModel: 'jump-rate',
 *   supportedAssets: ['WETH', 'USDC', 'WBTC'],
 *   collateralFactors: { WETH: 0.75, USDC: 0.85, WBTC: 0.70 }
 * });
 *
 * @references
 * - Compound Protocol Whitepaper: https://compound.finance/documents/Compound.Whitepaper.pdf
 * - Aave V3 Documentation: https://docs.aave.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    interestRateModel = 'jump-rate',
    supportedAssets = [],
    collateralFactors = {},
    features = ['flash-loans', 'liquidation-bonus'],
    framework = 'foundry',
    outputDir = 'lending-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Lending Protocol Development: ${projectName}`);

  // Phase 1: Interest Rate Model Design
  const rateModelDesign = await ctx.task(interestRateModelTask, { projectName, interestRateModel, outputDir });
  artifacts.push(...rateModelDesign.artifacts);

  // Phase 2: Core Protocol Implementation
  const coreImplementation = await ctx.task(coreProtocolTask, { projectName, rateModelDesign, framework, outputDir });
  artifacts.push(...coreImplementation.artifacts);

  // Phase 3: Collateral Management
  const collateralManagement = await ctx.task(collateralManagementTask, { projectName, collateralFactors, outputDir });
  artifacts.push(...collateralManagement.artifacts);

  // Phase 4: Supply and Borrow Functions
  const supplyBorrow = await ctx.task(supplyBorrowTask, { projectName, outputDir });
  artifacts.push(...supplyBorrow.artifacts);

  // Phase 5: Interest Accrual
  const interestAccrual = await ctx.task(interestAccrualTask, { projectName, rateModelDesign, outputDir });
  artifacts.push(...interestAccrual.artifacts);

  // Phase 6: Health Factor and Liquidation
  const liquidationMechanism = await ctx.task(liquidationTask, { projectName, collateralFactors, features, outputDir });
  artifacts.push(...liquidationMechanism.artifacts);

  // Phase 7: Oracle Integration
  const oracleIntegration = await ctx.task(oracleIntegrationTask, { projectName, supportedAssets, outputDir });
  artifacts.push(...oracleIntegration.artifacts);

  // Phase 8: Flash Loans (if enabled)
  if (features.includes('flash-loans')) {
    const flashLoans = await ctx.task(flashLoanTask, { projectName, outputDir });
    artifacts.push(...flashLoans.artifacts);
  }

  // Phase 9: Testing
  const testingSuite = await ctx.task(testingSuiteTask, { projectName, framework, outputDir });
  artifacts.push(...testingSuite.artifacts);

  // Phase 10: Security Analysis
  const securityAnalysis = await ctx.task(securityAnalysisTask, { projectName, outputDir });
  artifacts.push(...securityAnalysis.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    protocolInfo: { interestRateModel, supportedAssets, collateralFactors, features },
    contracts: coreImplementation.contracts,
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/lending-protocol', timestamp: startTime }
  };
}

export const interestRateModelTask = defineTask('interest-rate-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interest Rate Model - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Interest Rate Designer',
      task: 'Design interest rate model',
      context: args,
      instructions: ['1. Design utilization-based rate curve', '2. Set base rate and multiplier', '3. Define kink point for jump rate', '4. Calculate borrow rate formula', '5. Calculate supply rate formula', '6. Model rate behavior', '7. Test with simulations', '8. Document parameters', '9. Analyze market conditions', '10. Create rate model contract'],
      outputFormat: 'JSON with rate model design'
    },
    outputSchema: { type: 'object', required: ['rateModel', 'parameters', 'artifacts'], properties: { rateModel: { type: 'object' }, parameters: { type: 'object' }, simulations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'interest-rate']
}));

export const coreProtocolTask = defineTask('core-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Core Protocol - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'Lending Protocol Developer',
      task: 'Implement core lending protocol',
      context: args,
      instructions: ['1. Implement lending pool controller', '2. Create market token contracts', '3. Implement comptroller/risk management', '4. Add asset configuration', '5. Implement pause functionality', '6. Add access control', '7. Implement upgradability', '8. Add protocol reserves', '9. Create deployment scripts', '10. Document architecture'],
      outputFormat: 'JSON with core implementation'
    },
    outputSchema: { type: 'object', required: ['contracts', 'artifacts'], properties: { contracts: { type: 'array' }, architecture: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'core']
}));

export const collateralManagementTask = defineTask('collateral-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collateral Management - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Collateral Management Engineer',
      task: 'Implement collateral management',
      context: args,
      instructions: ['1. Implement collateral factor configuration', '2. Add asset enable/disable', '3. Calculate collateral value', '4. Track user collateral positions', '5. Implement borrow limits', '6. Add collateral token handling', '7. Implement collateral seizure', '8. Add collateral caps', '9. Test collateral logic', '10. Document collateral rules'],
      outputFormat: 'JSON with collateral management'
    },
    outputSchema: { type: 'object', required: ['collateralConfig', 'artifacts'], properties: { collateralConfig: { type: 'object' }, assetParameters: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'collateral']
}));

export const supplyBorrowTask = defineTask('supply-borrow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Supply and Borrow - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Supply/Borrow Developer',
      task: 'Implement supply and borrow functions',
      context: args,
      instructions: ['1. Implement supply function', '2. Implement withdraw function', '3. Implement borrow function', '4. Implement repay function', '5. Add batch operations', '6. Implement permit support', '7. Add native token handling', '8. Track user positions', '9. Emit proper events', '10. Test all functions'],
      outputFormat: 'JSON with supply/borrow implementation'
    },
    outputSchema: { type: 'object', required: ['functions', 'artifacts'], properties: { functions: { type: 'array' }, events: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'supply-borrow']
}));

export const interestAccrualTask = defineTask('interest-accrual', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interest Accrual - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Interest Accrual Engineer',
      task: 'Implement interest accrual mechanism',
      context: args,
      instructions: ['1. Implement accrueInterest function', '2. Track borrow index', '3. Track supply index', '4. Calculate interest per block', '5. Handle index overflow', '6. Implement compound interest', '7. Add reserve factor', '8. Track protocol reserves', '9. Test accrual accuracy', '10. Document interest mechanics'],
      outputFormat: 'JSON with interest accrual'
    },
    outputSchema: { type: 'object', required: ['accrualMechanism', 'artifacts'], properties: { accrualMechanism: { type: 'object' }, indexTracking: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'interest']
}));

export const liquidationTask = defineTask('liquidation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Liquidation Mechanism - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Liquidation Mechanism Developer',
      task: 'Implement liquidation mechanism',
      context: args,
      instructions: ['1. Calculate health factor', '2. Implement liquidation threshold', '3. Implement liquidate function', '4. Add liquidation bonus', '5. Implement close factor', '6. Handle partial liquidations', '7. Add liquidation discount', '8. Implement bad debt handling', '9. Test liquidation scenarios', '10. Document liquidation rules'],
      outputFormat: 'JSON with liquidation mechanism'
    },
    outputSchema: { type: 'object', required: ['liquidationConfig', 'artifacts'], properties: { liquidationConfig: { type: 'object' }, healthFactorCalculation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'liquidation']
}));

export const oracleIntegrationTask = defineTask('oracle-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Oracle Integration - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-016: oracle-integration)
    prompt: {
      role: 'Oracle Integration Engineer',
      task: 'Integrate price oracles',
      context: args,
      instructions: ['1. Integrate Chainlink price feeds', '2. Add fallback oracles', '3. Implement price staleness checks', '4. Add deviation thresholds', '5. Handle oracle failures', '6. Implement multi-oracle design', '7. Add price bounds', '8. Test oracle reliability', '9. Document oracle setup', '10. Create oracle adapter'],
      outputFormat: 'JSON with oracle integration'
    },
    outputSchema: { type: 'object', required: ['oracleConfig', 'artifacts'], properties: { oracleConfig: { type: 'object' }, priceFeeds: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'oracle']
}));

export const flashLoanTask = defineTask('flash-loan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flash Loans - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Flash Loan Developer',
      task: 'Implement flash loan functionality',
      context: args,
      instructions: ['1. Implement flashLoan function', '2. Add callback interface', '3. Implement fee calculation', '4. Verify repayment', '5. Add reentrancy protection', '6. Support multiple assets', '7. Implement premium collection', '8. Test flash loans', '9. Document interface', '10. Create example usage'],
      outputFormat: 'JSON with flash loan implementation'
    },
    outputSchema: { type: 'object', required: ['flashLoanInterface', 'artifacts'], properties: { flashLoanInterface: { type: 'object' }, fee: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'flash-loan']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'Lending Protocol Tester',
      task: 'Create comprehensive tests',
      context: args,
      instructions: ['1. Test supply/withdraw', '2. Test borrow/repay', '3. Test interest accrual', '4. Test liquidations', '5. Test oracle integration', '6. Test flash loans', '7. Run fuzz tests', '8. Test invariants', '9. Test edge cases', '10. Achieve high coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'testing']
}));

export const securityAnalysisTask = defineTask('security-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor
    prompt: {
      role: 'Lending Security Analyst',
      task: 'Analyze lending protocol security',
      context: args,
      instructions: ['1. Check oracle manipulation', '2. Analyze liquidation safety', '3. Check flash loan vectors', '4. Verify interest calculations', '5. Check for reentrancy', '6. Analyze economic attacks', '7. Check access control', '8. Verify health factor', '9. Run static analysis', '10. Generate security report'],
      outputFormat: 'JSON with security analysis'
    },
    outputSchema: { type: 'object', required: ['findings', 'riskScore', 'artifacts'], properties: { findings: { type: 'array' }, riskScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'lending', 'security']
}));
