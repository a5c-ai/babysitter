---
name: defi-protocols
description: Integration expertise for major DeFi protocols including Uniswap, Aave, Compound, Chainlink, Curve, and Balancer. Supports swaps, liquidity provision, lending, borrowing, oracles, and flash loans.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# DeFi Protocol Integration Skill

Expert integration with major DeFi protocols for building composable financial applications.

## Capabilities

- **Uniswap Integration**: V2/V3 swaps, liquidity, positions
- **Aave/Compound**: Supply, borrow, liquidations
- **Chainlink Oracles**: Price feeds, VRF, automation
- **Curve Finance**: Pool interactions, gauges
- **Balancer**: Weighted pools, joins/exits
- **Flash Loans**: Aave, dYdX flash loan execution
- **MEV Protection**: Flashbots integration

## Uniswap Integration

### V2 Swaps

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapV2Swap {
    IUniswapV2Router02 public immutable router;

    constructor(address _router) {
        router = IUniswapV2Router02(_router);
    }

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256 amountOut) {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(router), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            block.timestamp
        );

        return amounts[1];
    }
}
```

### V3 Swaps

```solidity
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract UniswapV3Swap {
    ISwapRouter public immutable router;

    constructor(address _router) {
        router = ISwapRouter(_router);
    }

    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external returns (uint256 amountOut) {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(router), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        return router.exactInputSingle(params);
    }
}
```

### V3 Liquidity Position

```solidity
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract UniswapV3LP {
    INonfungiblePositionManager public immutable nfpm;

    function mintPosition(
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external returns (uint256 tokenId) {
        IERC20(token0).approve(address(nfpm), amount0Desired);
        IERC20(token1).approve(address(nfpm), amount1Desired);

        INonfungiblePositionManager.MintParams memory params =
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            });

        (tokenId, , , ) = nfpm.mint(params);
    }
}
```

## Aave Integration

### Supply and Borrow

```solidity
import {IPool} from "@aave/v3-core/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/v3-core/contracts/interfaces/IPoolAddressesProvider.sol";

contract AaveIntegration {
    IPool public immutable pool;

    constructor(address _poolProvider) {
        pool = IPool(IPoolAddressesProvider(_poolProvider).getPool());
    }

    function supply(address asset, uint256 amount) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        IERC20(asset).approve(address(pool), amount);

        pool.supply(asset, amount, msg.sender, 0);
    }

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode // 1 = stable, 2 = variable
    ) external {
        pool.borrow(asset, amount, interestRateMode, 0, msg.sender);
    }

    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode
    ) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        IERC20(asset).approve(address(pool), amount);

        pool.repay(asset, amount, interestRateMode, msg.sender);
    }

    function withdraw(address asset, uint256 amount) external {
        pool.withdraw(asset, amount, msg.sender);
    }
}
```

### Flash Loans

```solidity
import {IPool} from "@aave/v3-core/contracts/interfaces/IPool.sol";
import {IFlashLoanSimpleReceiver} from "@aave/v3-core/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";

contract AaveFlashLoan is IFlashLoanSimpleReceiver {
    IPool public immutable POOL;

    constructor(address _pool) {
        POOL = IPool(_pool);
    }

    function executeFlashLoan(address asset, uint256 amount) external {
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            abi.encode(msg.sender),
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller must be pool");
        require(initiator == address(this), "Initiator must be this");

        // Custom logic here
        // e.g., arbitrage, liquidation, collateral swap

        // Repay flash loan
        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(address(POOL), amountOwed);

        return true;
    }
}
```

## Chainlink Integration

### Price Feeds

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getLatestPrice() public view returns (int256) {
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        // Stale price check
        require(updatedAt > block.timestamp - 1 hours, "Stale price");
        require(price > 0, "Invalid price");

        return price;
    }

    function getDecimals() public view returns (uint8) {
        return priceFeed.decimals();
    }
}
```

### VRF (Randomness)

```solidity
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract VRFConsumer is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 2;

    uint256[] public s_randomWords;
    uint256 public s_requestId;

    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
    }

    function requestRandomWords() external returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        s_requestId = requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        s_randomWords = randomWords;
    }
}
```

## Curve Integration

```solidity
interface ICurvePool {
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external returns (uint256);

    function add_liquidity(
        uint256[3] calldata amounts,
        uint256 min_mint_amount
    ) external returns (uint256);

    function remove_liquidity(
        uint256 amount,
        uint256[3] calldata min_amounts
    ) external returns (uint256[3] memory);
}

contract CurveSwap {
    ICurvePool public pool;

    function swap(
        int128 tokenIn,
        int128 tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256) {
        return pool.exchange(tokenIn, tokenOut, amountIn, minAmountOut);
    }
}
```

## MEV Protection (Flashbots)

```typescript
// TypeScript/ethers.js example
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

async function sendPrivateTransaction() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    wallet,
    "https://relay.flashbots.net"
  );

  const signedTransactions = await flashbotsProvider.signBundle([
    {
      signer: wallet,
      transaction: {
        to: targetContract,
        data: encodedFunctionData,
        gasLimit: 500000,
      },
    },
  ]);

  const bundleSubmission = await flashbotsProvider.sendRawBundle(
    signedTransactions,
    targetBlockNumber
  );

  const waitResponse = await bundleSubmission.wait();
  console.log("Bundle included:", waitResponse);
}
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `amm-pool-development.js` | AMM building |
| `lending-protocol.js` | Lending protocol |
| `yield-aggregator.js` | Yield strategies |
| `economic-simulation.js` | Protocol modeling |

## Best Practices

1. Always validate oracle data freshness
2. Implement slippage protection
3. Use flash loan callbacks securely
4. Handle MEV for sensitive transactions
5. Test with mainnet forks

## See Also

- `skills/solidity-dev/SKILL.md` - Solidity development
- `agents/defi-architect/AGENT.md` - DeFi expert
- [DeFiLlama](https://defillama.com/) - Protocol TVL
