---
name: gas-optimization
description: Advanced gas optimization techniques for EVM smart contracts. Covers storage packing, memory vs calldata optimization, assembly/Yul, efficient data structures, batch operations, and benchmark-driven optimization strategies.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Gas Optimization Skill

Advanced gas optimization techniques for EVM smart contracts with benchmark-driven analysis.

## Capabilities

- **Storage Optimization**: Storage packing, slot management, SLOAD/SSTORE minimization
- **Memory Management**: Memory vs calldata optimization, expansion costs
- **Assembly/Yul**: Low-level optimization for critical paths
- **Data Structures**: Gas-efficient mappings, arrays, and structs
- **Batch Operations**: Multi-call patterns, bulk transfers
- **Benchmarking**: Gas profiling, comparison analysis

## MCP/Tool Integration

| Tool | Purpose | Reference |
|------|---------|-----------|
| **Foundry MCP** | Gas reports, testing | [foundry-mcp-server](https://github.com/PraneshASP/foundry-mcp-server) |
| **EVM MCP Tools** | Opcode analysis | [evm-mcp-tools](https://github.com/0xGval/evm-mcp-tools) |

## Storage Optimization

### Storage Layout Packing

```solidity
// BAD: 3 storage slots (96 bytes used, 96 bytes allocated)
contract BadPacking {
    uint128 a;  // slot 0 (16 bytes)
    uint256 b;  // slot 1 (32 bytes) - can't pack with a
    uint128 c;  // slot 2 (16 bytes)
}

// GOOD: 2 storage slots (80 bytes used, 64 bytes allocated)
contract GoodPacking {
    uint128 a;  // slot 0, bytes 0-15
    uint128 c;  // slot 0, bytes 16-31
    uint256 b;  // slot 1
}

// Gas savings: ~20,000 gas per SSTORE avoided
```

### Minimize Storage Writes

```solidity
// BAD: Multiple storage writes
function badUpdate(uint256 newA, uint256 newB) external {
    a = newA;  // SSTORE: 20,000 gas (cold) or 2,900 gas (warm)
    b = newB;  // SSTORE: 2,900 gas (warm slot in same tx)
}

// GOOD: Single storage write with packed struct
struct Data {
    uint128 a;
    uint128 b;
}
Data public data;

function goodUpdate(uint128 newA, uint128 newB) external {
    data = Data(newA, newB);  // Single SSTORE: 20,000 gas
}
```

### Use Mappings Over Arrays for Lookups

```solidity
// BAD: O(n) lookup, expensive for large arrays
uint256[] public values;
function exists(uint256 value) public view returns (bool) {
    for (uint i = 0; i < values.length; i++) {
        if (values[i] == value) return true;  // SLOAD per iteration
    }
    return false;
}

// GOOD: O(1) lookup
mapping(uint256 => bool) public valueExists;
function exists(uint256 value) public view returns (bool) {
    return valueExists[value];  // Single SLOAD
}
```

## Memory vs Calldata

### Function Parameters

```solidity
// BAD: Copies array to memory
function processArray(uint256[] memory data) external {
    // Memory copy cost: 3 gas per word + expansion
}

// GOOD: Read directly from calldata
function processArray(uint256[] calldata data) external {
    // No copy, just pointer to calldata
    // Savings: ~60 gas per 32 bytes
}

// Note: Use memory if you need to modify the array
```

### String/Bytes Handling

```solidity
// For read-only operations, use calldata
function validate(string calldata input) external pure returns (bool) {
    return bytes(input).length > 0;
}

// For modifications, use memory
function transform(string memory input) internal pure returns (string memory) {
    bytes memory b = bytes(input);
    b[0] = 'X';
    return string(b);
}
```

## Unchecked Arithmetic

```solidity
// BAD: Overflow checks on every operation (Solidity 0.8+)
function sumArray(uint256[] calldata arr) external pure returns (uint256) {
    uint256 sum = 0;
    for (uint256 i = 0; i < arr.length; i++) {
        sum += arr[i];  // Overflow check: ~40 gas per operation
    }
    return sum;
}

// GOOD: Unchecked when overflow is impossible
function sumArray(uint256[] calldata arr) external pure returns (uint256) {
    uint256 sum = 0;
    uint256 length = arr.length;
    for (uint256 i = 0; i < length;) {
        unchecked {
            sum += arr[i];
            ++i;  // ++i is cheaper than i++
        }
    }
    return sum;
}
// Savings: ~40 gas per iteration
```

## Loop Optimizations

### Cache Array Length

```solidity
// BAD: Length read from storage each iteration
for (uint i = 0; i < array.length; i++) { }  // SLOAD per iteration

// GOOD: Cache length
uint256 length = array.length;
for (uint i = 0; i < length; i++) { }  // Single SLOAD
```

### Pre-increment

```solidity
// BAD: Post-increment creates temporary
for (uint i = 0; i < length; i++) { }

// GOOD: Pre-increment is cheaper
for (uint i = 0; i < length; ++i) { }
// Savings: ~5 gas per iteration
```

## Custom Errors

```solidity
// BAD: String error messages
require(balance >= amount, "Insufficient balance");
// Cost: ~50 gas per character + memory expansion

// GOOD: Custom errors (Solidity 0.8.4+)
error InsufficientBalance(uint256 available, uint256 required);
if (balance < amount) revert InsufficientBalance(balance, amount);
// Cost: Fixed ~24 gas for error selector
// Savings: ~50+ gas for typical error messages
```

## Assembly/Yul Optimization

### Efficient Balance Check

```solidity
// Solidity
function getBalance(address account) external view returns (uint256) {
    return account.balance;
}

// Assembly (slightly cheaper)
function getBalance(address account) external view returns (uint256 bal) {
    assembly {
        bal := balance(account)
    }
}
```

### Efficient Memory Operations

```solidity
// Copy 32 bytes efficiently
function copy32(bytes32 source) internal pure returns (bytes32 dest) {
    assembly {
        dest := source
    }
}

// Efficient keccak256
function efficientHash(bytes32 a, bytes32 b) internal pure returns (bytes32 result) {
    assembly {
        mstore(0x00, a)
        mstore(0x20, b)
        result := keccak256(0x00, 0x40)
    }
}
```

## Batch Operations

### Batch Transfers

```solidity
// BAD: Individual transfers
function transferToMany(address[] calldata recipients, uint256 amount) external {
    for (uint i = 0; i < recipients.length; ++i) {
        token.transfer(recipients[i], amount);  // 21000 base + transfer cost
    }
}

// GOOD: Batch transfer (if supported)
function batchTransfer(
    address[] calldata recipients,
    uint256[] calldata amounts
) external {
    // Single function call overhead
    // Reduced SLOAD for token state
}
```

### Multicall Pattern

```solidity
function multicall(bytes[] calldata data) external returns (bytes[] memory results) {
    results = new bytes[](data.length);
    for (uint256 i = 0; i < data.length; ++i) {
        (bool success, bytes memory result) = address(this).delegatecall(data[i]);
        require(success);
        results[i] = result;
    }
}
// Combines multiple operations in single transaction
```

## Benchmarking Workflow

### Using Foundry Gas Reports

```bash
# Run tests with gas report
forge test --gas-report

# Snapshot gas usage
forge snapshot

# Compare against previous snapshot
forge snapshot --check
```

### Gas Snapshot Format

```
| Contract | Function | Min | Avg | Max | # Calls |
|----------|----------|-----|-----|-----|---------|
| Token    | transfer | 51234 | 54123 | 65432 | 100 |
| Token    | approve  | 24356 | 24356 | 24356 | 50  |
```

### Comparison Testing

```solidity
contract GasComparison is Test {
    function test_gasComparison_approach1() public {
        uint256 gasBefore = gasleft();
        // Approach 1
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Approach 1 gas", gasUsed);
    }

    function test_gasComparison_approach2() public {
        uint256 gasBefore = gasleft();
        // Approach 2
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Approach 2 gas", gasUsed);
    }
}
```

## Common Optimizations Summary

| Technique | Savings | Risk |
|-----------|---------|------|
| Storage packing | 20,000 gas/slot | Low |
| Calldata vs memory | 60 gas/32 bytes | Low |
| Unchecked arithmetic | 40 gas/op | Medium |
| Custom errors | 50+ gas/error | Low |
| Cache storage reads | 100-2100 gas | Low |
| Loop pre-increment | 5 gas/iteration | Low |
| Assembly | Varies | High |

## Process Integration

This skill integrates with:

- `gas-optimization.js` - Full optimization process
- `smart-contract-development-lifecycle.js` - Development best practices
- `amm-pool-development.js` - DeFi-specific optimizations

## Tools Reference

| Tool | Purpose | URL |
|------|---------|-----|
| **Foundry** | Gas reporting | [foundry-rs](https://github.com/foundry-rs/foundry) |
| **Hardhat Gas Reporter** | Gas reports | [hardhat-gas-reporter](https://github.com/cgewecke/hardhat-gas-reporter) |
| **evm.codes** | Opcode costs | [evm.codes](https://www.evm.codes/) |
| **Solidity Optimizer** | Compiler optimization | [Solidity Docs](https://docs.soliditylang.org/en/latest/internals/optimizer.html) |

## See Also

- `skills/evm-analysis/SKILL.md` - Bytecode analysis
- `agents/gas-optimizer/AGENT.md` - Gas optimization agent
- `references.md` - Gas optimization resources
