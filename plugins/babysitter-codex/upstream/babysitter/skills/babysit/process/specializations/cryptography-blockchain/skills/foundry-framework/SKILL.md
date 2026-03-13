---
name: foundry-framework
description: Expert usage of Foundry (Forge, Cast, Anvil, Chisel) for smart contract development, testing, and deployment. Includes fuzzing, gas reporting, local development, and deployment scripting capabilities.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Foundry Framework Skill

Expert-level usage of Foundry, the blazing fast, portable, and modular toolkit for Ethereum application development.

## Capabilities

- **Forge Testing**: Write and run Solidity tests with fuzzing
- **Gas Optimization**: Generate detailed gas reports and snapshots
- **Local Development**: Use Anvil for local blockchain
- **Chain Interaction**: Execute Cast commands for on-chain operations
- **Project Configuration**: Set up foundry.toml for projects
- **Deployment Scripts**: Write and run forge scripts
- **REPL Debugging**: Use Chisel for Solidity exploration

## Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Update to latest
foundryup

# Verify installation
forge --version
cast --version
anvil --version
chisel --version
```

## Project Setup

### Initialize Project

```bash
# New project
forge init my_project
cd my_project

# Add dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### foundry.toml Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200
via_ir = false

[profile.default.fuzz]
runs = 256
max_test_rejects = 65536
seed = "0x1234"

[profile.default.invariant]
runs = 256
depth = 15
fail_on_revert = false

[profile.ci]
fuzz = { runs = 10000 }
invariant = { runs = 1000, depth = 50 }

[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
sepolia = "${SEPOLIA_RPC_URL}"
arbitrum = "${ARBITRUM_RPC_URL}"

[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

## Forge Testing

### Basic Test

```solidity
// test/Counter.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testFail_Underflow() public {
        counter.decrement();
    }
}
```

### Fuzz Testing

```solidity
contract FuzzTest is Test {
    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }

    function testFuzz_BoundedInput(uint256 x) public {
        x = bound(x, 1, 100);
        // x is now between 1 and 100
    }
}
```

### Invariant Testing

```solidity
contract InvariantTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
        targetContract(address(counter));
    }

    function invariant_NumberNeverNegative() public {
        assertTrue(counter.number() >= 0);
    }

    function invariant_NumberUnderMax() public {
        assertTrue(counter.number() < type(uint256).max);
    }
}
```

### Fork Testing

```solidity
contract ForkTest is Test {
    function setUp() public {
        // Fork mainnet at specific block
        vm.createSelectFork("mainnet", 18000000);
    }

    function test_MainnetState() public {
        // Interact with mainnet contracts
        IERC20 dai = IERC20(0x6B175474E89094C44Da98b954EescdeCB5c811d7);
        uint256 balance = dai.balanceOf(address(this));
    }
}
```

## Forge Commands

```bash
# Build project
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvvv

# Run specific test
forge test --match-test testFuzz_SetNumber

# Run tests with gas report
forge test --gas-report

# Generate gas snapshot
forge snapshot

# Compare gas snapshots
forge snapshot --diff

# Coverage
forge coverage

# Format code
forge fmt
```

## Cast Commands

### Read Chain Data

```bash
# Get ETH balance
cast balance 0x... --rpc-url $RPC

# Read contract storage
cast storage 0x... 0 --rpc-url $RPC

# Call view function
cast call 0x... "balanceOf(address)" 0x... --rpc-url $RPC

# Decode calldata
cast calldata-decode "transfer(address,uint256)" 0x...
```

### Send Transactions

```bash
# Send ETH
cast send 0x... --value 1ether --rpc-url $RPC --private-key $KEY

# Call contract function
cast send 0x... "transfer(address,uint256)" 0x... 1000 --rpc-url $RPC --private-key $KEY
```

### Utility Commands

```bash
# Convert units
cast to-wei 1 ether
cast from-wei 1000000000000000000

# Compute function selector
cast sig "transfer(address,uint256)"

# Get ABI
cast abi-encode "transfer(address,uint256)" 0x... 100

# Decode ABI
cast abi-decode "balanceOf(address)(uint256)" 0x...
```

## Anvil Local Node

```bash
# Start local node
anvil

# Start with specific chain ID
anvil --chain-id 31337

# Fork mainnet
anvil --fork-url $MAINNET_RPC

# Fork at specific block
anvil --fork-url $MAINNET_RPC --fork-block-number 18000000

# Preload accounts
anvil --accounts 20 --balance 10000
```

### Anvil RPC

```bash
# Impersonate account
cast rpc anvil_impersonateAccount 0x... --rpc-url http://localhost:8545

# Set balance
cast rpc anvil_setBalance 0x... 0x1000000000000000000 --rpc-url http://localhost:8545

# Mine blocks
cast rpc anvil_mine 10 --rpc-url http://localhost:8545

# Set block timestamp
cast rpc evm_setNextBlockTimestamp 1700000000 --rpc-url http://localhost:8545
```

## Deployment Scripts

### Script Example

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Counter.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        Counter counter = new Counter();
        counter.setNumber(42);

        vm.stopBroadcast();

        console.log("Counter deployed at:", address(counter));
    }
}
```

### Run Scripts

```bash
# Simulate deployment
forge script script/Deploy.s.sol --rpc-url $RPC

# Deploy to network
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast

# Verify on Etherscan
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast --verify
```

## Chisel REPL

```bash
# Start Chisel
chisel

# In REPL
> uint256 x = 100
> x * 2
200
> address(this)
0x...
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `smart-contract-development-lifecycle.js` | Full development |
| `smart-contract-fuzzing.js` | Fuzzing and invariant testing |
| `invariant-testing.js` | Property-based testing |
| `gas-optimization.js` | Gas profiling |
| All DeFi processes | Testing and deployment |

## Best Practices

1. Use `forge fmt` before committing
2. Maintain gas snapshots for regression testing
3. Use fork testing for integration tests
4. Set appropriate fuzz runs for CI
5. Use profile-based configuration
6. Keep foundry.toml in version control

## See Also

- `skills/hardhat-framework/SKILL.md` - Alternative framework
- `skills/echidna-fuzzer/SKILL.md` - Advanced fuzzing
- `skills/gas-optimization/SKILL.md` - Gas optimization
- [Foundry Book](https://book.getfoundry.sh/)
