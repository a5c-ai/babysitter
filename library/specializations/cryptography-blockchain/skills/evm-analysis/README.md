# EVM/Bytecode Analysis Skill

## Overview

The EVM Analysis skill provides deep bytecode analysis capabilities for Ethereum Virtual Machine contracts. It enables security auditors, gas optimizers, and developers to understand compiled smart contract behavior at the lowest level.

## Use Cases

### Security Auditing
- Identify vulnerability patterns in bytecode
- Detect hidden functionality not visible in source
- Verify source code matches deployed bytecode
- Analyze proxy implementation slots

### Gas Optimization
- Identify gas-expensive opcodes
- Find storage access patterns
- Optimize function dispatch
- Analyze memory expansion costs

### Reverse Engineering
- Decompile contracts without source
- Map storage slot layouts
- Identify function selectors
- Trace execution paths

## Quick Start

### 1. Analyze Deployed Contract

```bash
# Fetch bytecode
cast code 0xContractAddress --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY > contract.bin

# Disassemble
cast disassemble $(cat contract.bin)
```

### 2. Check Proxy Implementation

```bash
# EIP-1967 implementation slot
cast storage 0xProxyAddress \
  0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc \
  --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### 3. Verify Bytecode Match

```bash
# Compile with same settings as deployment
forge build --optimizer-runs 200

# Compare
diff <(cast code 0xContractAddress --rpc-url $RPC) \
     out/Contract.sol/Contract.json | jq -r '.deployedBytecode.object'
```

## Integration with Processes

This skill is automatically used by:

| Process | Usage |
|---------|-------|
| `gas-optimization.js` | Opcode-level gas analysis |
| `smart-contract-security-audit.js` | Bytecode vulnerability scanning |
| `smart-contract-upgrade.js` | Proxy slot verification |
| `formal-verification.js` | Bytecode property checking |

## MCP Server Support

For enhanced capabilities, install the EVM MCP Tools:

```bash
# In claude_desktop_config.json
{
  "mcpServers": {
    "evm-tools": {
      "command": "npx",
      "args": ["-y", "@0xgval/evm-mcp-tools"]
    }
  }
}
```

## Common Patterns Reference

### Function Selector Calculation

```javascript
// Solidity function selector
// keccak256("transfer(address,uint256)")[0:4]
const selector = ethers.id("transfer(address,uint256)").slice(0, 10);
// Result: 0xa9059cbb
```

### Storage Slot Calculation

```javascript
// Mapping slot: keccak256(key . slot)
const slot = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256"],
    [userAddress, mappingSlot]
  )
);
```

### Proxy Detection

```javascript
// Check for EIP-1967 proxy
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const impl = await provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
const isProxy = impl !== "0x" + "0".repeat(64);
```

## Output Schema

When used in process tasks, this skill outputs:

```json
{
  "contractType": "proxy|implementation|library|standalone",
  "proxyPattern": "EIP-1967|EIP-1822|Beacon|Custom|none",
  "implementation": "0x... or null",
  "storageLayout": [
    { "slot": 0, "name": "owner", "type": "address", "offset": 0 }
  ],
  "functionSelectors": {
    "0xa9059cbb": "transfer(address,uint256)"
  },
  "gasHotspots": [
    { "offset": "0x1a4", "opcode": "SSTORE", "estimatedGas": 20000 }
  ],
  "vulnerabilityIndicators": [
    { "type": "unchecked-call", "offset": "0x2f0", "severity": "high" }
  ],
  "bytecodeHash": "0x..."
}
```

## Resources

- [EVM Codes Reference](https://www.evm.codes/)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP-1967: Proxy Storage Slots](https://eips.ethereum.org/EIPS/eip-1967)
- [Foundry Book - Cast](https://book.getfoundry.sh/cast/)
