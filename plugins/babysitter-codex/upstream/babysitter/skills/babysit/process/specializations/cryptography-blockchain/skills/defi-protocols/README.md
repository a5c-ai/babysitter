# DeFi Protocol Integration Skill

Expert integration with major DeFi protocols for building composable financial applications.

## Overview

This skill provides comprehensive capabilities for integrating with major DeFi protocols including Uniswap, Aave, Chainlink, Curve, and more.

## Key Capabilities

- **DEX Integration**: Uniswap V2/V3, Curve, Balancer
- **Lending**: Aave, Compound supply/borrow
- **Oracles**: Chainlink price feeds and VRF
- **Flash Loans**: Aave and dYdX flash loans

## Quick Example

```solidity
// Uniswap V3 Swap
ISwapRouter.ExactInputSingleParams memory params =
    ISwapRouter.ExactInputSingleParams({
        tokenIn: USDC,
        tokenOut: WETH,
        fee: 3000,
        recipient: msg.sender,
        deadline: block.timestamp,
        amountIn: amount,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0
    });

router.exactInputSingle(params);
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Uniswap Docs](https://docs.uniswap.org/)
- [Aave Docs](https://docs.aave.com/)

## Process Integration

- `amm-pool-development.js`
- `lending-protocol.js`
- `yield-aggregator.js`
