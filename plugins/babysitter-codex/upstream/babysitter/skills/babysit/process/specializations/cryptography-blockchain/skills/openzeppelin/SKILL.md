---
name: openzeppelin
description: Expert usage of OpenZeppelin Contracts library for secure smart contract development. Covers access control, token standards, governance, upgrades, and security utilities.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# OpenZeppelin Contracts Skill

Expert usage of OpenZeppelin Contracts, the standard library for secure smart contract development.

## Capabilities

- **Access Control**: Ownable, AccessControl, Governor patterns
- **Upgradeable Contracts**: UUPS and Transparent Proxy plugins
- **Token Standards**: ERC-20, ERC-721, ERC-1155 implementations
- **Security Utilities**: ReentrancyGuard, Pausable, SafeERC20
- **Governance**: Governor and TimelockController
- **Metatransactions**: ERC-2771 support
- **Cryptographic Utilities**: ECDSA, MerkleProof, EIP712

## Installation

```bash
# Standard contracts
npm install @openzeppelin/contracts

# Upgradeable contracts
npm install @openzeppelin/contracts-upgradeable

# Hardhat upgrades plugin
npm install @openzeppelin/hardhat-upgrades
```

## Access Control

### Ownable

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function protectedFunction() external onlyOwner {
        // Only owner can call
    }
}
```

### AccessControl (Role-Based)

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        // Minting logic
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        // Pausing logic
    }
}
```

### AccessControlEnumerable

```solidity
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract MyContract is AccessControlEnumerable {
    function getAllAdmins() external view returns (address[] memory) {
        uint256 count = getRoleMemberCount(DEFAULT_ADMIN_ROLE);
        address[] memory admins = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            admins[i] = getRoleMember(DEFAULT_ADMIN_ROLE, i);
        }
        return admins;
    }
}
```

## Token Standards

### ERC-20 with Extensions

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
```

### ERC-721 with Extensions

```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

contract MyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MyNFT", "MNFT") {
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Required overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

## Governance

### Governor Setup

```solidity
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract MyGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("MyGovernor")
        GovernorSettings(
            1 days,     // Voting delay
            1 weeks,    // Voting period
            100e18      // Proposal threshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {}

    // Required overrides...
}
```

## Upgradeable Contracts

### UUPS Pattern

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyContractV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

### Deployment Script

```javascript
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Deploy
  const MyContract = await ethers.getContractFactory("MyContractV1");
  const proxy = await upgrades.deployProxy(MyContract, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();
  console.log("Proxy:", await proxy.getAddress());

  // Upgrade
  const MyContractV2 = await ethers.getContractFactory("MyContractV2");
  await upgrades.upgradeProxy(await proxy.getAddress(), MyContractV2);
}
```

## Security Utilities

### SafeERC20

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyContract {
    using SafeERC20 for IERC20;

    function deposit(IERC20 token, uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(IERC20 token, uint256 amount) external {
        token.safeTransfer(msg.sender, amount);
    }
}
```

### ReentrancyGuard

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // Safe from reentrancy
    }
}
```

### MerkleProof

```solidity
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Airdrop {
    bytes32 public merkleRoot;

    function claim(bytes32[] calldata proof, uint256 amount) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        // Process claim
    }
}
```

## Process Integration

| Process | Purpose |
|---------|---------|
| All token processes | Token development |
| `governance-system.js` | Governance |
| `smart-contract-upgrade.js` | Upgrades |
| `staking-contract.js` | Staking |

## Best Practices

1. Always use latest stable version
2. Understand inheritance order
3. Use Wizard for starting templates
4. Audit custom extensions
5. Test upgrade paths thoroughly

## See Also

- `skills/solidity-dev/SKILL.md` - Solidity development
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Contracts Wizard](https://wizard.openzeppelin.com/)
