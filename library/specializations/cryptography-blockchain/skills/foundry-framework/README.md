# Foundry Framework Skill

Expert usage of Foundry (Forge, Cast, Anvil, Chisel) for smart contract development, testing, and deployment.

## Overview

This skill provides comprehensive capabilities for using Foundry, the blazing fast Ethereum development toolkit written in Rust.

## Key Capabilities

- **Forge**: Compile, test, and deploy smart contracts
- **Cast**: Interact with EVM chains from the command line
- **Anvil**: Spin up local development nodes
- **Chisel**: Solidity REPL for quick prototyping

## Quick Start

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Create project
forge init my_project && cd my_project

# Build and test
forge build
forge test -vvv
```

## Key Commands

```bash
# Run tests with gas report
forge test --gas-report

# Fork mainnet
anvil --fork-url $RPC

# Call contract
cast call $CONTRACT "balanceOf(address)" $ADDR

# Deploy script
forge script script/Deploy.s.sol --broadcast
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Foundry Book](https://book.getfoundry.sh/)
- [GitHub](https://github.com/foundry-rs/foundry)

## Process Integration

- `smart-contract-development-lifecycle.js`
- `smart-contract-fuzzing.js`
- `invariant-testing.js`
- `gas-optimization.js`
