# Solidity Development Skill

Expert-level Solidity smart contract development with emphasis on security patterns, gas optimization, and ERC standard compliance.

## Overview

This skill provides comprehensive Solidity development capabilities for building secure, efficient, and standards-compliant smart contracts on EVM-compatible blockchains.

## Key Capabilities

- **Security-First Development**: Implements proven security patterns like Checks-Effects-Interactions
- **ERC Standards**: Full support for ERC-20, ERC-721, ERC-1155, ERC-4626 tokens
- **Gas Optimization**: Advanced techniques including storage packing, assembly, and unchecked blocks
- **Upgradeable Contracts**: UUPS and Transparent Proxy patterns
- **Modern Solidity**: Leverages 0.8+ features (custom errors, immutable, etc.)

## Use Cases

1. **Token Development**: Create fungible and non-fungible tokens
2. **DeFi Protocols**: Build lending, AMM, and yield protocols
3. **Governance Systems**: Implement on-chain governance
4. **NFT Collections**: Deploy NFT contracts with royalties
5. **Upgradeable Systems**: Build proxy-based upgradeable contracts

## Quick Start

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Process Integration

- `smart-contract-development-lifecycle.js`
- `erc20-token-implementation.js`
- `erc721-nft-collection.js`
- `gas-optimization.js`
