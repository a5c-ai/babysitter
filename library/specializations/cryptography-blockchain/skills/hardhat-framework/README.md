# Hardhat Framework Skill

Expert usage of Hardhat for smart contract development, testing, and deployment.

## Overview

This skill provides comprehensive capabilities for using Hardhat, the most popular Ethereum development environment with a rich plugin ecosystem.

## Key Capabilities

- **Testing**: Write comprehensive tests with ethers.js
- **Deployment**: Script-based deployment management
- **Forking**: Test against mainnet state
- **Plugins**: Use upgrades, coverage, gas reporter

## Quick Start

```bash
# Initialize project
npm init -y
npm install --save-dev hardhat
npx hardhat init

# Compile and test
npx hardhat compile
npx hardhat test
```

## Key Commands

```bash
# Run local node
npx hardhat node

# Deploy to network
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract
npx hardhat verify --network mainnet <address>
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Hardhat Docs](https://hardhat.org/docs)
- [Plugin Directory](https://hardhat.org/hardhat-runner/plugins)

## Process Integration

- `smart-contract-development-lifecycle.js`
- `dapp-frontend-development.js`
- All token and DeFi processes
