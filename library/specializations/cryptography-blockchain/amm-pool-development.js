/**
 * @process specializations/cryptography-blockchain/amm-pool-development
 * @description AMM Pool Development - Implementation of automated market maker liquidity pools with constant product or custom
 * curve formulas, fee mechanisms, and liquidity provider token management.
 * @inputs { projectName: string, curveType?: string, tokenPairs?: array, feeStructure?: object }
 * @outputs { success: boolean, poolInfo: object, contracts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/amm-pool-development', {
 *   projectName: 'DEX Protocol',
 *   curveType: 'constant-product',
 *   tokenPairs: [{ token0: 'WETH', token1: 'USDC' }],
 *   feeStructure: { swapFee: 0.3, protocolFee: 0.05 }
 * });
 *
 * @references
 * - Uniswap V3 Whitepaper: https://uniswap.org/whitepaper-v3.pdf
 * - Curve Finance Whitepaper: https://curve.fi/whitepaper
 * - Balancer Whitepaper: https://balancer.fi/whitepaper.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    curveType = 'constant-product',
    tokenPairs = [],
    feeStructure = { swapFee: 0.3, protocolFee: 0.05 },
    features = ['twap-oracle', 'flash-swaps'],
    framework = 'foundry',
    outputDir = 'amm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AMM Pool Development: ${projectName}`);
  ctx.log('info', `Curve Type: ${curveType}, Features: ${features.join(', ')}`);

  // Phase 1: Bonding Curve Design
  const curveDesign = await ctx.task(bondingCurveDesignTask, { projectName, curveType, outputDir });
  artifacts.push(...curveDesign.artifacts);

  // Phase 2: Pool Factory Implementation
  const factoryImplementation = await ctx.task(factoryImplementationTask, { projectName, curveDesign, framework, outputDir });
  artifacts.push(...factoryImplementation.artifacts);

  // Phase 3: Pool Contract Implementation
  const poolImplementation = await ctx.task(poolImplementationTask, { projectName, curveDesign, feeStructure, features, framework, outputDir });
  artifacts.push(...poolImplementation.artifacts);

  // Phase 4: LP Token Implementation
  const lpTokenImplementation = await ctx.task(lpTokenImplementationTask, { projectName, outputDir });
  artifacts.push(...lpTokenImplementation.artifacts);

  // Phase 5: Fee Mechanism
  const feeMechanism = await ctx.task(feeMechanismTask, { projectName, feeStructure, outputDir });
  artifacts.push(...feeMechanism.artifacts);

  // Phase 6: TWAP Oracle (if enabled)
  if (features.includes('twap-oracle')) {
    const twapOracle = await ctx.task(twapOracleTask, { projectName, outputDir });
    artifacts.push(...twapOracle.artifacts);
  }

  // Phase 7: Flash Swap (if enabled)
  if (features.includes('flash-swaps')) {
    const flashSwap = await ctx.task(flashSwapTask, { projectName, outputDir });
    artifacts.push(...flashSwap.artifacts);
  }

  // Phase 8: Router Implementation
  const routerImplementation = await ctx.task(routerImplementationTask, { projectName, outputDir });
  artifacts.push(...routerImplementation.artifacts);

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
    poolInfo: { curveType, feeStructure, features },
    contracts: {
      factory: factoryImplementation.contractPath,
      pool: poolImplementation.contractPath,
      router: routerImplementation.contractPath
    },
    testResults: testingSuite,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/amm-pool-development', timestamp: startTime }
  };
}

export const bondingCurveDesignTask = defineTask('bonding-curve-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bonding Curve Design - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'DeFi Curve Designer',
      task: 'Design bonding curve formula',
      context: args,
      instructions: ['1. Design curve formula (x*y=k or custom)', '2. Define price calculation', '3. Calculate slippage formula', '4. Define liquidity depth', '5. Plan concentrated liquidity if needed', '6. Document mathematical properties', '7. Analyze capital efficiency', '8. Test with simulations', '9. Define invariants', '10. Document curve specification'],
      outputFormat: 'JSON with curve design'
    },
    outputSchema: { type: 'object', required: ['formula', 'priceCalculation', 'artifacts'], properties: { formula: { type: 'string' }, priceCalculation: { type: 'object' }, invariants: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'curve']
}));

export const factoryImplementationTask = defineTask('factory-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Factory Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'AMM Factory Developer',
      task: 'Implement pool factory contract',
      context: args,
      instructions: ['1. Implement createPool function', '2. Add pool registry', '3. Implement getPool lookup', '4. Add fee configuration', '5. Implement access control', '6. Add upgrade mechanism', '7. Emit creation events', '8. Add protocol fee recipient', '9. Test factory functions', '10. Document factory interface'],
      outputFormat: 'JSON with factory implementation'
    },
    outputSchema: { type: 'object', required: ['contractPath', 'abi', 'artifacts'], properties: { contractPath: { type: 'string' }, abi: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'factory']
}));

export const poolImplementationTask = defineTask('pool-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pool Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'AMM Pool Developer',
      task: 'Implement liquidity pool contract',
      context: args,
      instructions: ['1. Implement swap function with slippage protection', '2. Implement addLiquidity', '3. Implement removeLiquidity', '4. Add fee collection', '5. Implement price oracle', '6. Add reentrancy protection', '7. Implement reserves tracking', '8. Add mint/burn LP tokens', '9. Optimize for gas', '10. Add comprehensive events'],
      outputFormat: 'JSON with pool implementation'
    },
    outputSchema: { type: 'object', required: ['contractPath', 'abi', 'artifacts'], properties: { contractPath: { type: 'string' }, abi: { type: 'array' }, gasEstimates: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'pool']
}));

export const lpTokenImplementationTask = defineTask('lp-token-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `LP Token Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-011: erc20-implementation)
    prompt: {
      role: 'LP Token Developer',
      task: 'Implement liquidity provider tokens',
      context: args,
      instructions: ['1. Implement ERC20 LP token', '2. Add mint function (pool only)', '3. Add burn function (pool only)', '4. Track total supply', '5. Add permit support', '6. Implement proper decimals', '7. Add token metadata', '8. Test LP token', '9. Verify ERC20 compliance', '10. Document LP token'],
      outputFormat: 'JSON with LP token implementation'
    },
    outputSchema: { type: 'object', required: ['contractPath', 'artifacts'], properties: { contractPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'lp-token']
}));

export const feeMechanismTask = defineTask('fee-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fee Mechanism - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'AMM Fee Engineer',
      task: 'Implement fee collection and distribution',
      context: args,
      instructions: ['1. Implement swap fee calculation', '2. Add protocol fee split', '3. Implement LP fee accumulation', '4. Add fee claim mechanism', '5. Implement fee tier system', '6. Add dynamic fees (optional)', '7. Track fee accounting', '8. Implement fee withdrawal', '9. Test fee accuracy', '10. Document fee structure'],
      outputFormat: 'JSON with fee mechanism'
    },
    outputSchema: { type: 'object', required: ['feeStructure', 'artifacts'], properties: { feeStructure: { type: 'object' }, feeCalculation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'fees']
}));

export const twapOracleTask = defineTask('twap-oracle', (args, taskCtx) => ({
  kind: 'agent',
  title: `TWAP Oracle - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-016: oracle-integration)
    prompt: {
      role: 'Price Oracle Developer',
      task: 'Implement TWAP price oracle',
      context: args,
      instructions: ['1. Implement cumulative price tracking', '2. Add observation storage', '3. Implement consult function', '4. Add cardinality management', '5. Handle first observation', '6. Implement TWAP calculation', '7. Add manipulation resistance', '8. Test oracle accuracy', '9. Document oracle usage', '10. Add observation helpers'],
      outputFormat: 'JSON with TWAP oracle'
    },
    outputSchema: { type: 'object', required: ['oracleImplementation', 'artifacts'], properties: { oracleImplementation: { type: 'object' }, manipulationResistance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'oracle']
}));

export const flashSwapTask = defineTask('flash-swap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flash Swap - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns)
    prompt: {
      role: 'Flash Swap Developer',
      task: 'Implement flash swap functionality',
      context: args,
      instructions: ['1. Implement flash swap interface', '2. Add callback mechanism', '3. Verify repayment', '4. Add flash swap fee', '5. Handle multiple tokens', '6. Implement reentrancy protection', '7. Add flash loan callback', '8. Test flash swaps', '9. Document usage', '10. Add example contracts'],
      outputFormat: 'JSON with flash swap implementation'
    },
    outputSchema: { type: 'object', required: ['flashSwapInterface', 'artifacts'], properties: { flashSwapInterface: { type: 'object' }, callbackSpec: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'flash-swap']
}));

export const routerImplementationTask = defineTask('router-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Router Implementation - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-015: defi-protocol-patterns, SK-001: solidity-dev)
    prompt: {
      role: 'AMM Router Developer',
      task: 'Implement swap router',
      context: args,
      instructions: ['1. Implement swapExactTokensForTokens', '2. Implement swapTokensForExactTokens', '3. Add multi-hop routing', '4. Implement deadline checking', '5. Add slippage protection', '6. Implement ETH handling', '7. Add permit support', '8. Optimize gas', '9. Test all swap paths', '10. Document router interface'],
      outputFormat: 'JSON with router implementation'
    },
    outputSchema: { type: 'object', required: ['contractPath', 'abi', 'artifacts'], properties: { contractPath: { type: 'string' }, abi: { type: 'array' }, supportedFunctions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'router']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Suite - ${args.projectName}`,
  agent: {
    name: 'defi-specialist', // AG-004: DeFi Protocol Specialist (uses SK-004: foundry-framework)
    prompt: {
      role: 'AMM Test Engineer',
      task: 'Create comprehensive AMM tests',
      context: args,
      instructions: ['1. Test pool creation', '2. Test swap functionality', '3. Test liquidity operations', '4. Test fee calculations', '5. Test oracle accuracy', '6. Test flash swaps', '7. Test router functions', '8. Run fuzz tests', '9. Test invariants', '10. Achieve high coverage'],
      outputFormat: 'JSON with test results'
    },
    outputSchema: { type: 'object', required: ['coverage', 'allPassing', 'artifacts'], properties: { coverage: { type: 'number' }, allPassing: { type: 'boolean' }, invariantTests: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'testing']
}));

export const securityAnalysisTask = defineTask('security-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Analysis - ${args.projectName}`,
  agent: {
    name: 'solidity-auditor', // AG-001: Senior Solidity Security Auditor (uses SK-002: slither-analysis)
    prompt: {
      role: 'AMM Security Analyst',
      task: 'Analyze AMM security',
      context: args,
      instructions: ['1. Check for reentrancy', '2. Analyze oracle manipulation', '3. Check sandwich attack vectors', '4. Verify slippage protection', '5. Check for flash loan attacks', '6. Verify fee accuracy', '7. Check access control', '8. Analyze MEV vectors', '9. Run static analysis', '10. Generate security report'],
      outputFormat: 'JSON with security analysis'
    },
    outputSchema: { type: 'object', required: ['findings', 'riskScore', 'artifacts'], properties: { findings: { type: 'array' }, riskScore: { type: 'number' }, mevAnalysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['blockchain', 'amm', 'security']
}));
