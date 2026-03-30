---
name: certora-prover
description: Formal verification using Certora Prover with CVL specification language. Supports invariant rules, parametric verification, ghost variables, and counterexample analysis for mathematical proof of contract correctness.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Certora Formal Verification Skill

Formal verification of smart contracts using Certora Prover, providing mathematical proofs of contract correctness.

## Capabilities

- **CVL Specifications**: Write Certora Verification Language specs
- **Invariant Rules**: Define and verify state invariants
- **Parametric Rules**: Write comprehensive property tests
- **Ghost Variables**: Track abstract state
- **Counterexamples**: Analyze verification failures
- **Loop Handling**: Configure loop invariants and unrolling
- **Summarization**: Abstract complex functions

## Installation

```bash
# Install Java (required)
sudo apt install openjdk-17-jdk

# Install Certora CLI
pip install certora-cli

# Set API key
export CERTORAKEY=<your-api-key>

# Verify installation
certoraRun --version
```

## Project Setup

### Directory Structure

```
project/
├── contracts/
│   └── Token.sol
├── certora/
│   ├── conf/
│   │   └── token.conf
│   └── specs/
│       └── token.spec
└── foundry.toml
```

### Configuration File

```yaml
# certora/conf/token.conf
{
  "files": ["contracts/Token.sol"],
  "verify": "Token:certora/specs/token.spec",
  "solc": "solc-0.8.20",
  "msg": "Token verification",
  "rule_sanity": "basic",
  "optimistic_loop": true,
  "loop_iter": 3
}
```

## CVL Specification Language

### Basic Rules

```cvl
// certora/specs/token.spec

methods {
    function balanceOf(address) external returns (uint256) envfree;
    function totalSupply() external returns (uint256) envfree;
    function transfer(address, uint256) external returns (bool);
}

// Invariant: balance never exceeds total supply
invariant balanceUnderSupply(address user)
    balanceOf(user) <= totalSupply()

// Rule: transfer preserves total supply
rule transferPreservesTotalSupply(address to, uint256 amount) {
    env e;

    uint256 supplyBefore = totalSupply();

    transfer(e, to, amount);

    uint256 supplyAfter = totalSupply();

    assert supplyBefore == supplyAfter,
        "Total supply changed after transfer";
}
```

### Parametric Rules

```cvl
// Parametric rule: any function preserves an invariant
rule anyFunctionPreservesInvariant(method f) {
    env e;
    calldataarg args;

    uint256 supplyBefore = totalSupply();

    f(e, args);

    uint256 supplyAfter = totalSupply();

    assert supplyBefore == supplyAfter,
        "Total supply changed";
}
```

### Ghost Variables

```cvl
// Ghost variable to track sum of all balances
ghost mathint sumBalances {
    init_state axiom sumBalances == 0;
}

// Hook to update ghost on balance changes
hook Sstore balances[KEY address user] uint256 newBalance
    (uint256 oldBalance) STORAGE {
    sumBalances = sumBalances + newBalance - oldBalance;
}

// Invariant using ghost
invariant totalSupplyIsSumOfBalances()
    to_mathint(totalSupply()) == sumBalances
```

### Function Summaries

```cvl
// Summary for external calls
methods {
    function _.transfer(address, uint256) external => DISPATCHER(true);
    function _.balanceOf(address) external returns (uint256) => DISPATCHER(true);
}

// Havoc summary (non-deterministic)
methods {
    function externalCall() external => HAVOC_ECF;
}

// Constant summary
methods {
    function getConstant() external returns (uint256) => ALWAYS(100);
}
```

### Loop Handling

```cvl
// Loop invariant
rule loopInvariant() {
    env e;

    // Configure loop unrolling
    require e.msg.sender != 0;

    // Loop iterations are bounded by config
    processArray(e);

    assert true; // Verify loop terminates
}
```

## Running Verification

### Basic Run

```bash
# Run verification
certoraRun certora/conf/token.conf

# Run specific rule
certoraRun certora/conf/token.conf --rule transferPreservesTotalSupply

# Run with message
certoraRun certora/conf/token.conf --msg "PR #123 verification"
```

### Advanced Options

```bash
# Sanity checks
certoraRun certora/conf/token.conf --rule_sanity basic

# Optimistic loop handling
certoraRun certora/conf/token.conf --optimistic_loop --loop_iter 5

# Multi-contract verification
certoraRun contracts/Token.sol contracts/Staking.sol \
  --verify Token:specs/token.spec

# Debug mode
certoraRun certora/conf/token.conf --debug
```

## Interpreting Results

### Verification Output

```
Rule: transferPreservesTotalSupply
  Status: VERIFIED ✓
  Time: 45s

Rule: balanceUnderSupply
  Status: VIOLATED ✗
  Counterexample:
    - user: 0x1234...
    - Initial balance: 100
    - Final balance: 200
    - Total supply: 150
```

### Counterexample Analysis

1. **Check Call Trace**: Understand the sequence of calls
2. **Examine State Changes**: Track storage modifications
3. **Identify Assumptions**: Check if assumptions are too weak
4. **Verify Model**: Ensure CVL spec matches intent

## Common Patterns

### ERC-20 Verification

```cvl
methods {
    function balanceOf(address) external returns (uint256) envfree;
    function totalSupply() external returns (uint256) envfree;
    function allowance(address, address) external returns (uint256) envfree;
}

// Transfer integrity
rule transferIntegrity(address to, uint256 amount) {
    env e;
    address from = e.msg.sender;

    uint256 fromBalanceBefore = balanceOf(from);
    uint256 toBalanceBefore = balanceOf(to);
    require from != to;

    transfer(e, to, amount);

    uint256 fromBalanceAfter = balanceOf(from);
    uint256 toBalanceAfter = balanceOf(to);

    assert fromBalanceAfter == fromBalanceBefore - amount;
    assert toBalanceAfter == toBalanceBefore + amount;
}

// Allowance monotonicity
rule approveIntegrity(address spender, uint256 amount) {
    env e;

    approve(e, spender, amount);

    assert allowance(e.msg.sender, spender) == amount;
}
```

### Access Control Verification

```cvl
methods {
    function owner() external returns (address) envfree;
    function setOwner(address) external;
}

// Only owner can change owner
rule onlyOwnerCanChangeOwner(address newOwner) {
    env e;

    address ownerBefore = owner();

    setOwner(e, newOwner);

    assert e.msg.sender == ownerBefore,
        "Non-owner changed owner";
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Certora Verification
on: [push, pull_request]

jobs:
  certora:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Certora
        run: pip install certora-cli

      - name: Run Verification
        env:
          CERTORAKEY: ${{ secrets.CERTORAKEY }}
        run: certoraRun certora/conf/token.conf
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `formal-verification.js` | Primary verification |
| `smart-contract-security-audit.js` | Deep security analysis |
| `lending-protocol.js` | Protocol correctness |
| `amm-pool-development.js` | DeFi invariants |
| `governance-system.js` | Governance properties |

## Best Practices

1. Start with simple invariants
2. Use parametric rules for comprehensive coverage
3. Document all assumptions
4. Analyze counterexamples carefully
5. Use ghost variables for complex state tracking
6. Set appropriate loop bounds
7. Run nightly verification in CI

## See Also

- `skills/slither-analysis/SKILL.md` - Static analysis
- `skills/echidna-fuzzer/SKILL.md` - Property fuzzing
- `agents/formal-methods/AGENT.md` - Verification expert
- [Certora Documentation](https://docs.certora.com/)
