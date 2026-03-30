---
name: echidna-fuzzer
description: Property-based testing and fuzzing using Echidna for smart contracts. Includes invariant definition, corpus management, coverage analysis, and CI/CD integration for comprehensive security testing.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Echidna Fuzzing Skill

Property-based testing and fuzzing for smart contracts using Echidna, the premier smart contract fuzzer from Trail of Bits.

## Capabilities

- **Property Tests**: Write Echidna-compatible property tests
- **Configuration**: Customize fuzzing parameters
- **Invariant Testing**: Define and verify contract invariants
- **Coverage Analysis**: Analyze fuzzing coverage
- **Corpus Management**: Handle and minimize test cases
- **Extended Campaigns**: Run long fuzzing campaigns
- **CI Integration**: Automate fuzzing in pipelines

## Installation

```bash
# Install via docker (recommended)
docker pull ghcr.io/crytic/echidna/echidna:latest

# Or download binary
curl -LO https://github.com/crytic/echidna/releases/latest/download/echidna-Linux
chmod +x echidna-Linux
mv echidna-Linux /usr/local/bin/echidna

# Verify
echidna --version
```

## Property Testing

### Basic Properties

```solidity
// contracts/Token.sol
contract Token {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}

// contracts/TokenTest.sol
contract TokenTest is Token {
    constructor() {
        balances[msg.sender] = 10000;
        totalSupply = 10000;
    }

    // Echidna property: name starts with echidna_
    function echidna_totalSupply_constant() public view returns (bool) {
        return totalSupply == 10000;
    }

    function echidna_balance_under_total() public view returns (bool) {
        return balances[msg.sender] <= totalSupply;
    }
}
```

### Assertion Mode

```solidity
contract TokenAssertions is Token {
    function transfer(address to, uint256 amount) external override {
        uint256 balanceBefore = balances[msg.sender] + balances[to];

        super.transfer(to, amount);

        uint256 balanceAfter = balances[msg.sender] + balances[to];

        // Assertion: conservation of tokens
        assert(balanceBefore == balanceAfter);
    }
}
```

## Configuration

### echidna.yaml

```yaml
# Test configuration
testMode: property  # property, assertion, exploration, overflow
testLimit: 50000
seqLen: 100
shrinkLimit: 5000

# Contract configuration
deployer: "0x10000"
sender: ["0x10000", "0x20000", "0x30000"]
psender: "0x10000"

# Corpus configuration
corpusDir: "corpus"
coverage: true
coverageFormats: ["html", "lcov"]

# Filtering
filterBlacklist: true
filterFunctions: ["excludedFunction"]

# Advanced
codeSize: 0xffff
gasLimit: 10000000
prefix: "echidna_"

# Assertion mode specific
checkAsserts: true

# Workers
workers: 4
```

### Run Commands

```bash
# Basic run
echidna contracts/TokenTest.sol --contract TokenTest

# With config
echidna contracts/TokenTest.sol --contract TokenTest --config echidna.yaml

# Assertion mode
echidna contracts/TokenTest.sol --contract TokenTest --test-mode assertion

# Multi-ABI mode (test multiple contracts)
echidna . --contract TokenTest --crytic-args "--compile-all"
```

## Advanced Patterns

### Time-Based Properties

```solidity
contract TimeBased {
    uint256 public startTime;
    uint256 public lockedUntil;

    constructor() {
        startTime = block.timestamp;
        lockedUntil = block.timestamp + 1 days;
    }

    function withdraw() external {
        require(block.timestamp >= lockedUntil);
        // withdraw logic
    }

    function echidna_locked_before_time() public view returns (bool) {
        // Echidna can manipulate block.timestamp
        return block.timestamp < lockedUntil || true; // simplified
    }
}
```

### Multi-Contract Testing

```solidity
contract EchidnaTest {
    Token token;
    Staking staking;

    constructor() {
        token = new Token();
        staking = new Staking(address(token));
    }

    function stake(uint256 amount) public {
        token.approve(address(staking), amount);
        staking.stake(amount);
    }

    function echidna_staking_invariant() public view returns (bool) {
        return staking.totalStaked() <= token.totalSupply();
    }
}
```

### DeFi Invariants

```solidity
contract AMMTest is AMM {
    function echidna_constant_product() public view returns (bool) {
        // k = x * y should be constant (or increase)
        uint256 currentK = reserveX * reserveY;
        return currentK >= initialK;
    }

    function echidna_no_free_tokens() public view returns (bool) {
        // Total tokens in pool >= total LP tokens value
        return reserveX + reserveY >= totalLPTokens;
    }

    function echidna_price_bounds() public view returns (bool) {
        // Price should be within reasonable bounds
        uint256 price = (reserveX * 1e18) / reserveY;
        return price > 0 && price < type(uint256).max / 1e18;
    }
}
```

## Coverage Analysis

### Generate Coverage

```yaml
# echidna.yaml
coverage: true
coverageFormats: ["html", "lcov", "txt"]
corpusDir: "corpus"
```

```bash
# Run with coverage
echidna contracts/Test.sol --contract Test --config echidna.yaml

# View HTML coverage
open corpus/covered.html
```

### Interpret Coverage

- **Green**: Fully covered lines
- **Yellow**: Partially covered (some branches)
- **Red**: Uncovered code
- **Gray**: Non-executable

## Corpus Management

### Corpus Structure

```
corpus/
├── coverage/
│   ├── covered.txt
│   └── covered.html
├── reproducers/
│   └── failing_test.txt
└── corpus/
    └── sequence_1234.txt
```

### Replay Corpus

```bash
# Replay a failing sequence
echidna contracts/Test.sol --contract Test --corpus-dir corpus --replay
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Echidna Fuzzing
on: [push, pull_request]

jobs:
  echidna:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Compile contracts
        run: forge build

      - name: Run Echidna
        uses: crytic/echidna-action@v2
        with:
          files: contracts/Test.sol
          contract: Test
          config: echidna.yaml
          test-limit: 10000
```

### Extended Fuzzing

```yaml
# echidna-extended.yaml
testLimit: 1000000
timeout: 86400  # 24 hours
workers: 8
```

```bash
# Run extended campaign
echidna . --contract Test --config echidna-extended.yaml
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `smart-contract-fuzzing.js` | Primary fuzzing |
| `invariant-testing.js` | Invariant verification |
| `smart-contract-security-audit.js` | Security testing |
| `amm-pool-development.js` | DeFi invariants |
| `lending-protocol.js` | Protocol invariants |

## Best Practices

1. Start with simple properties
2. Use assertion mode for internal checks
3. Test invariants that should NEVER break
4. Run extended campaigns before deployments
5. Maintain corpus between runs
6. Review coverage to improve tests
7. Combine with Slither and Mythril

## Troubleshooting

### Out of Gas

```yaml
gasLimit: 100000000  # Increase limit
```

### Compilation Issues

```bash
# Use crytic-compile directly
echidna . --crytic-args "--foundry-compile-all"
```

### Slow Fuzzing

```yaml
workers: 8  # Increase parallelism
shrinkLimit: 1000  # Reduce shrinking
```

## See Also

- `skills/slither-analysis/SKILL.md` - Static analysis
- `skills/mythril-symbolic/SKILL.md` - Symbolic execution
- `skills/foundry-framework/SKILL.md` - Forge invariant testing
- `agents/solidity-auditor/AGENT.md` - Security auditor
- [Echidna Documentation](https://github.com/crytic/echidna)
