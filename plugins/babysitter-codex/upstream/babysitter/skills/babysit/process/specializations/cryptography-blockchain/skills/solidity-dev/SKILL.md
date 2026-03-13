---
name: solidity-dev
description: Deep expertise in Solidity language features, patterns, and best practices for secure smart contract development. Covers ERC standards, gas optimization, upgradeable contracts, and security patterns.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Solidity Development Skill

Expert-level Solidity smart contract development with emphasis on security patterns, gas optimization, and ERC standard compliance.

## Capabilities

- **Secure Coding Patterns**: Implement Checks-Effects-Interactions, reentrancy guards
- **Gas Optimization**: Write gas-efficient code using assembly/Yul when appropriate
- **NatSpec Documentation**: Generate comprehensive contract documentation
- **ERC Standards**: Implement ERC-20, ERC-721, ERC-1155, ERC-4626 compliant tokens
- **OpenZeppelin Integration**: Properly use and extend OZ contracts
- **Modern Solidity Features**: Leverage 0.8+ features (custom errors, unchecked blocks)
- **Upgradeable Contracts**: Implement UUPS and Transparent Proxy patterns

## Security Patterns

### Checks-Effects-Interactions (CEI)

```solidity
function withdraw(uint256 amount) external {
    // CHECKS
    require(balances[msg.sender] >= amount, "Insufficient balance");

    // EFFECTS
    balances[msg.sender] -= amount;

    // INTERACTIONS
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

### Custom Errors (Gas Efficient)

```solidity
// Instead of require strings
error InsufficientBalance(uint256 requested, uint256 available);
error Unauthorized(address caller);

function withdraw(uint256 amount) external {
    if (balances[msg.sender] < amount) {
        revert InsufficientBalance(amount, balances[msg.sender]);
    }
}
```

### Unchecked Arithmetic

```solidity
function increment(uint256 i) external pure returns (uint256) {
    // Safe when overflow is impossible
    unchecked {
        return i + 1; // Saves ~80 gas
    }
}
```

## ERC Standard Templates

### ERC-20 Token

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    // Required overrides for multiple inheritance
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
```

### ERC-721 NFT

```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

contract MyNFT is ERC721, ERC721URIStorage, ERC721Royalty {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MyNFT", "NFT") {
        _setDefaultRoyalty(msg.sender, 250); // 2.5%
    }

    function safeMint(address to, string memory uri) external {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
```

## Upgradeable Contract Pattern

### UUPS Proxy

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContractV1 is UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal override onlyOwner
    {}

    function setValue(uint256 _value) external {
        value = _value;
    }
}
```

## Gas Optimization Techniques

### Storage Packing

```solidity
// BAD: Uses 3 storage slots (96 bytes)
contract Unpacked {
    uint256 a;    // slot 0
    uint8 b;      // slot 1
    uint256 c;    // slot 2
}

// GOOD: Uses 2 storage slots (64 bytes)
contract Packed {
    uint256 a;    // slot 0
    uint256 c;    // slot 1
    uint8 b;      // slot 1 (packed with previous)
}
```

### Calldata vs Memory

```solidity
// Use calldata for read-only arrays
function processData(uint256[] calldata data) external pure returns (uint256) {
    uint256 sum;
    for (uint256 i; i < data.length;) {
        sum += data[i];
        unchecked { ++i; }
    }
    return sum;
}
```

### Assembly Optimization

```solidity
function efficientTransfer(address to, uint256 amount) external {
    assembly {
        // Load balance from storage
        let bal := sload(add(balances.slot, caller()))

        // Check balance
        if lt(bal, amount) {
            revert(0, 0)
        }

        // Update balances
        sstore(add(balances.slot, caller()), sub(bal, amount))
        sstore(add(balances.slot, to), add(sload(add(balances.slot, to)), amount))
    }
}
```

## Process Integration

This skill integrates with:

| Process | Purpose |
|---------|---------|
| `smart-contract-development-lifecycle.js` | Full development workflow |
| `erc20-token-implementation.js` | ERC-20 implementation |
| `erc721-nft-collection.js` | NFT collection development |
| `erc1155-multi-token.js` | Multi-token development |
| `erc4626-tokenized-vault.js` | Vault implementation |
| `gas-optimization.js` | Performance tuning |
| `smart-contract-upgrade.js` | Proxy upgrades |

## Tools Reference

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Foundry** | Development framework | `curl -L https://foundry.paradigm.xyz \| bash` |
| **Hardhat** | Development framework | `npm install hardhat` |
| **Solhint** | Linter | `npm install solhint` |
| **Prettier Solidity** | Formatter | `npm install prettier-plugin-solidity` |

## Best Practices Checklist

- [ ] Use latest stable Solidity version (0.8.x+)
- [ ] Implement CEI pattern for external calls
- [ ] Use custom errors instead of require strings
- [ ] Add NatSpec documentation
- [ ] Implement proper access control
- [ ] Consider gas optimization
- [ ] Add comprehensive tests
- [ ] Run static analysis (Slither)
- [ ] Document upgrade paths

## See Also

- `skills/foundry-framework/SKILL.md` - Foundry development
- `skills/hardhat-framework/SKILL.md` - Hardhat development
- `skills/openzeppelin/SKILL.md` - OpenZeppelin contracts
- `skills/gas-optimization/SKILL.md` - Gas optimization
- `agents/solidity-auditor/AGENT.md` - Security auditor agent
