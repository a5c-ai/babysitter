# OpenZeppelin Contracts Skill

Expert usage of OpenZeppelin Contracts, the standard library for secure smart contract development.

## Overview

This skill provides comprehensive capabilities for using OpenZeppelin's battle-tested smart contract library for tokens, access control, governance, and security utilities.

## Key Capabilities

- **Access Control**: Ownable, AccessControl, roles
- **Token Standards**: ERC-20, ERC-721, ERC-1155
- **Governance**: Governor, TimelockController
- **Upgrades**: UUPS and Transparent Proxy patterns

## Quick Start

```bash
npm install @openzeppelin/contracts
```

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Contracts Wizard](https://wizard.openzeppelin.com/)

## Process Integration

- All token processes (ERC-20, ERC-721, ERC-1155)
- `governance-system.js`
- `smart-contract-upgrade.js`
