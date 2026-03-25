---
name: hardhat-framework
description: Expert usage of Hardhat for smart contract development, testing, and deployment. Includes TypeChain generation, plugin ecosystem, network forking, and deployment management.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Hardhat Framework Skill

Expert-level usage of Hardhat, the most popular Ethereum development environment.

## Capabilities

- **Configuration**: Set up hardhat.config.js for multi-network
- **Testing**: Write tests with ethers.js/viem
- **Plugins**: Use plugins (upgrades, gas-reporter, coverage)
- **Local Network**: Run Hardhat Network for development
- **Deployment**: Execute scripts and manage deployments
- **Forking**: Fork mainnet for testing
- **TypeChain**: Generate TypeScript typings

## Installation

```bash
# Create project
mkdir my-project && cd my-project
npm init -y

# Install Hardhat
npm install --save-dev hardhat

# Initialize project
npx hardhat init

# Install common dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

## Configuration

### hardhat.config.js

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_RPC_URL,
        blockNumber: 18000000,
      },
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
```

### TypeScript Configuration

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

## Testing

### Basic Test

```javascript
// test/Token.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens", async function () {
      await token.transfer(addr1.address, 50);
      expect(await token.balanceOf(addr1.address)).to.equal(50);
    });

    it("Should emit Transfer event", async function () {
      await expect(token.transfer(addr1.address, 50))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, 50);
    });

    it("Should fail if sender lacks funds", async function () {
      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
```

### TypeScript Test

```typescript
// test/Token.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { Token } from "../typechain-types";

describe("Token", function () {
  let token: Token;

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
  });

  it("Should deploy successfully", async function () {
    expect(await token.getAddress()).to.be.properAddress;
  });
});
```

### Fork Testing

```javascript
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Fork Test", function () {
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WHALE = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";

  beforeEach(async function () {
    // Impersonate whale account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WHALE],
    });
  });

  it("Should transfer USDC from whale", async function () {
    const whale = await ethers.getSigner(WHALE);
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    const [, recipient] = await ethers.getSigners();
    const amount = ethers.parseUnits("1000", 6);

    await usdc.connect(whale).transfer(recipient.address, amount);
    expect(await usdc.balanceOf(recipient.address)).to.equal(amount);
  });
});
```

## Deployment Scripts

### Basic Deployment

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();

  console.log("Token deployed to:", await token.getAddress());

  // Verify on Etherscan
  if (hre.network.name !== "hardhat") {
    await hre.run("verify:verify", {
      address: await token.getAddress(),
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Upgradeable Deployment

```javascript
// scripts/deploy-upgradeable.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const Token = await ethers.getContractFactory("TokenV1");

  // Deploy proxy
  const token = await upgrades.deployProxy(Token, [], {
    initializer: "initialize",
  });
  await token.waitForDeployment();

  console.log("Proxy deployed to:", await token.getAddress());
}

main();
```

### Upgrade Script

```javascript
// scripts/upgrade.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x...";

  const TokenV2 = await ethers.getContractFactory("TokenV2");
  const token = await upgrades.upgradeProxy(PROXY_ADDRESS, TokenV2);

  console.log("Token upgraded");
}

main();
```

## Hardhat Tasks

```javascript
// hardhat.config.js
task("accounts", "Prints accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("balance", "Prints balance")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });
```

## Commands

```bash
# Compile
npx hardhat compile

# Test
npx hardhat test
npx hardhat test --grep "transfer"

# Coverage
npx hardhat coverage

# Run script
npx hardhat run scripts/deploy.js --network sepolia

# Console
npx hardhat console --network localhost

# Node
npx hardhat node

# Verify
npx hardhat verify --network mainnet <address>
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `smart-contract-development-lifecycle.js` | Full development |
| `dapp-frontend-development.js` | dApp integration |
| All token processes | Token deployment |
| All DeFi processes | Protocol deployment |

## Best Practices

1. Use TypeScript for type safety
2. Configure multiple networks
3. Use environment variables
4. Enable gas reporting
5. Generate coverage reports
6. Verify contracts on explorers

## See Also

- `skills/foundry-framework/SKILL.md` - Alternative framework
- `skills/openzeppelin/SKILL.md` - Contract libraries
- [Hardhat Documentation](https://hardhat.org/docs)
