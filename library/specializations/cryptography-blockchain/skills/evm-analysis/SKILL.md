---
name: evm-analysis
description: Deep EVM bytecode analysis and decompilation capabilities for smart contract security, gas optimization, and reverse engineering. Provides tools for analyzing opcodes, storage layouts, proxy patterns, and bytecode verification.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# EVM/Bytecode Analysis Skill

Expert-level EVM bytecode analysis and decompilation for smart contract security audits, gas optimization, and reverse engineering.

## Capabilities

- **Bytecode Analysis**: Analyze EVM bytecode and opcodes
- **Gas Cost Calculation**: Calculate gas costs per operation
- **Storage Layout Identification**: Identify storage slot layouts and packing
- **Decompilation**: Decompile bytecode to pseudo-Solidity
- **Proxy Analysis**: Analyze proxy implementation slots (EIP-1967)
- **Pattern Detection**: Detect bytecode patterns (CREATE2, selfdestruct)
- **Bytecode Verification**: Verify contract bytecode against source

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Purpose | Install |
|--------|---------|---------|
| **EVM MCP Tools** | Smart contract auditing, security analysis | [0xGval/evm-mcp-tools](https://github.com/0xGval/evm-mcp-tools) |
| **Solidity Contract Analyzer** | Contract code analysis with metadata | [Skywork](https://skywork.ai/skypage/en/smart-contract-analysis-solidity) |

## Opcode Reference

Common EVM opcodes and gas costs:

| Category | Opcodes | Base Gas |
|----------|---------|----------|
| Arithmetic | ADD, SUB, MUL, DIV | 3-5 |
| Comparison | LT, GT, EQ, ISZERO | 3 |
| Bitwise | AND, OR, XOR, NOT, SHL, SHR | 3 |
| Memory | MLOAD, MSTORE | 3 + memory expansion |
| Storage | SLOAD | 100 (warm) / 2100 (cold) |
| Storage | SSTORE | 100-20000 (varies) |
| Control | JUMP, JUMPI | 8-10 |
| Call | CALL, DELEGATECALL, STATICCALL | 100 + memory + value |

## Storage Layout Analysis

### Standard Slot Patterns

```solidity
// Basic types (slot 0, 1, 2...)
uint256 public a;     // slot 0
uint256 public b;     // slot 1

// Packed storage
uint128 public c;     // slot 2, bytes 0-15
uint128 public d;     // slot 2, bytes 16-31

// Mappings: keccak256(key . slot)
mapping(address => uint256) public balances;  // slot 3
// balances[addr] at keccak256(addr . 3)

// Dynamic arrays: length at slot, data at keccak256(slot)
uint256[] public arr; // length at slot 4, arr[i] at keccak256(4) + i
```

### EIP-1967 Proxy Slots

```
Implementation: 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
Admin:          0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
Beacon:         0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50
```

## Bytecode Patterns

### Contract Creation

```
PUSH1 0x80          // Free memory pointer
PUSH1 0x40
MSTORE
...
CODECOPY            // Copy runtime code
RETURN              // Return runtime code
```

### Selector Dispatch

```
PUSH4 <selector>    // 4-byte function selector
EQ                  // Compare with calldata[0:4]
PUSH2 <offset>      // Jump destination
JUMPI               // Jump if match
```

### Common Vulnerability Patterns

```
// Reentrancy indicator: CALL before SSTORE
CALL
...
SSTORE

// Unchecked return: CALL without ISZERO check
CALL
// Missing: ISZERO, JUMPI for error handling

// Self-destruct (deprecated but detectable)
SELFDESTRUCT
```

## Workflow

### 1. Fetch Contract Bytecode

```bash
# Using cast (Foundry)
cast code <address> --rpc-url <rpc>

# Using curl
curl -X POST <rpc> \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["<address>","latest"],"id":1}'
```

### 2. Analyze Opcodes

```bash
# Disassemble with cast
cast disassemble <bytecode>

# Or use online tools
# - evm.codes/playground
# - ethervm.io/decompile
```

### 3. Storage Slot Analysis

```bash
# Read specific storage slot
cast storage <address> <slot> --rpc-url <rpc>

# Read EIP-1967 implementation slot
cast storage <address> 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url <rpc>
```

### 4. Bytecode Comparison

```bash
# Get deployed bytecode
cast code <address> --rpc-url <rpc> > deployed.bin

# Compile source and compare
forge build
diff deployed.bin out/Contract.sol/Contract.bin
```

## Process Integration

This skill integrates with the following processes:

- `gas-optimization.js` - Identify gas-heavy opcodes
- `smart-contract-security-audit.js` - Bytecode-level vulnerability detection
- `smart-contract-upgrade.js` - Proxy slot verification
- `formal-verification.js` - Bytecode correctness verification

## Tools Reference

| Tool | Purpose | URL |
|------|---------|-----|
| **Foundry Cast** | CLI bytecode interaction | [foundry-rs/foundry](https://github.com/foundry-rs/foundry) |
| **evm.codes** | Opcode reference | [evm.codes](https://www.evm.codes/) |
| **Dedaub** | Decompiler | [dedaub.com](https://app.dedaub.com/decompile) |
| **Heimdall** | Advanced decompiler | [heimdall-rs](https://github.com/Jon-Becker/heimdall-rs) |
| **panoramix** | Python decompiler | [eveem.org](https://eveem.org/) |

## Example Analysis

```javascript
// Analyze proxy contract
const analysis = {
  type: 'proxy',
  pattern: 'EIP-1967 Transparent',
  implementation: '0x...',
  admin: '0x...',

  // Storage layout
  storageSlots: {
    0: { name: '_initialized', type: 'uint8' },
    1: { name: '_initializing', type: 'bool' },
    // ...
  },

  // Function selectors
  selectors: {
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    // ...
  },

  // Gas hotspots
  gasHotspots: [
    { offset: 0x1a4, opcode: 'SSTORE', context: 'balance update' },
    { offset: 0x2f0, opcode: 'CALL', context: 'external call' }
  ]
};
```

## See Also

- `skills/gas-optimization/SKILL.md` - Gas optimization techniques
- `agents/solidity-auditor/AGENT.md` - Security audit agent
- `references.md` - External resources
