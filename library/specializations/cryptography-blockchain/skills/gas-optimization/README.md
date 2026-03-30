# Gas Optimization Skill

## Overview

The Gas Optimization skill provides advanced techniques for reducing gas costs in EVM smart contracts. It covers storage layout, memory management, assembly optimization, and benchmark-driven development practices.

## Use Cases

### Contract Development
- Optimize storage layout before deployment
- Reduce function execution costs
- Implement gas-efficient patterns

### Code Review
- Identify gas inefficiencies in existing contracts
- Suggest optimization improvements
- Quantify potential savings

### DeFi Protocols
- Optimize high-frequency operations (swaps, transfers)
- Reduce costs for batch operations
- Minimize MEV extraction surfaces

## Quick Start

### 1. Run Gas Analysis

```bash
# Generate gas report
forge test --gas-report

# Create gas snapshot
forge snapshot

# Compare implementations
forge snapshot --diff
```

### 2. Common Quick Wins

```solidity
// 1. Use calldata for read-only arrays
function process(uint256[] calldata data) external { }

// 2. Cache array length
uint256 length = array.length;
for (uint i = 0; i < length;) {
    unchecked { ++i; }
}

// 3. Use custom errors
error InsufficientBalance();
if (balance < amount) revert InsufficientBalance();

// 4. Pack storage variables
uint128 a;
uint128 b;  // Same slot as a
```

### 3. Measure Before/After

```solidity
function test_gasImprovement() public {
    uint256 before = gasleft();
    // optimized code
    uint256 used = before - gasleft();
    assertLt(used, 50000, "Gas target exceeded");
}
```

## Integration with Processes

| Process | Usage |
|---------|-------|
| `gas-optimization.js` | Full optimization workflow |
| `smart-contract-development-lifecycle.js` | Development best practices |
| `amm-pool-development.js` | DeFi optimizations |

## Optimization Checklist

### Storage
- [ ] Variables packed into minimal slots
- [ ] Frequently accessed variables in same slot
- [ ] Mappings used instead of arrays for lookups
- [ ] Storage reads cached in memory

### Functions
- [ ] External functions use calldata
- [ ] View functions where possible
- [ ] Short-circuit evaluations
- [ ] Custom errors instead of require strings

### Loops
- [ ] Array length cached
- [ ] Pre-increment used (++i)
- [ ] Unchecked arithmetic where safe
- [ ] Early exits when possible

### Advanced
- [ ] Assembly for critical paths
- [ ] Batch operations supported
- [ ] Minimal on-chain data storage
- [ ] Events for off-chain data

## Gas Cost Reference

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| SSTORE (new) | 20,000 | Cold slot, zero to non-zero |
| SSTORE (update) | 5,000 | Non-zero to non-zero |
| SSTORE (clear) | 2,900 + refund | Non-zero to zero |
| SLOAD (cold) | 2,100 | First access |
| SLOAD (warm) | 100 | Subsequent access |
| MSTORE | 3 | Plus memory expansion |
| MLOAD | 3 | Plus memory expansion |
| CALLDATALOAD | 3 | Read calldata |
| ADD/SUB/MUL | 3-5 | Arithmetic |
| Overflow check | ~40 | Per operation |

## Output Schema

When used in process tasks:

```json
{
  "contract": "TokenContract",
  "analysis": {
    "totalFunctions": 15,
    "optimizationOpportunities": 8,
    "estimatedSavings": "45,000 gas average"
  },
  "findings": [
    {
      "location": "transfer()",
      "issue": "Storage read in loop",
      "current": 54000,
      "optimized": 32000,
      "savings": 22000,
      "recommendation": "Cache balances[msg.sender] before loop"
    }
  ],
  "storageLayout": {
    "currentSlots": 5,
    "optimizedSlots": 3,
    "savedSlots": 2
  },
  "benchmarks": {
    "transfer": { "before": 54000, "after": 32000 },
    "approve": { "before": 46000, "after": 24000 }
  }
}
```

## Resources

- [EVM Opcodes Reference](https://www.evm.codes/)
- [Solidity Gas Optimization Tips](https://www.rareskills.io/post/gas-optimization)
- [Foundry Gas Reports](https://book.getfoundry.sh/forge/gas-reports)
- [OpenZeppelin Gas Patterns](https://docs.openzeppelin.com/contracts/4.x/api/utils#Arrays)
